"""
Bromine Market News Ingestion Pipeline Orchestrator
Coordinates source discovery, ingestion, normalization, relevance filtering,
multi-source deduplication/corroboration, AI intelligence synthesis, MySQL storage,
and Qdrant vector indexing.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import SessionLocal
from app.models import (
    NewsSource, NewsArticle, NewsIntelligence, NewsIngestionRun,
    Product, Competitor, Geography
)
from .taxonomy import news_taxonomy
from .registry import source_registry
from .normalizer import ArticleNormalizer
from .relevance_filter import relevance_filter
from .deduplicator import news_deduplicator
from .gdelt_client import gdelt_client
from .rss_client import rss_client
from .ai_classifier import news_classifier
from .qdrant_news_indexer import news_indexer

class BromineNewsPipeline:
    """Master orchestrator for Bromine news intelligence ingestion."""

    def __init__(self):
        self.normalizer = ArticleNormalizer()
        self.filter = relevance_filter
        self.dedup = news_deduplicator
        self.gdelt = gdelt_client
        self.rss = rss_client
        self.classifier = news_classifier
        self.indexer = news_indexer

    def run_pipeline(self, run_type: str = "manual", source_type_filter: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes a complete ingestion run across all approved sources.
        """
        db: Session = SessionLocal()
        run_record = NewsIngestionRun(
            pipeline_name=f"news_ingestion_{run_type}",
            started_at=datetime.utcnow(),
            status="RUNNING"
        )
        db.add(run_record)
        db.commit()

        stats = {
            "run_id": run_record.id,
            "total_fetched": 0,
            "total_relevant": 0,
            "total_duplicates": 0,
            "total_rejected": 0,
            "new_articles_added": 0,
            "errors": []
        }

        try:
            # Ensure Bromine product exists for foreign keys
            product = db.execute(select(Product).where(Product.product_code == "BR2")).scalar_one_or_none()
            if not product:
                product = Product(name="Bromine", chemical_name="Elemental Bromine", product_code="BR2")
                db.add(product)
                db.commit()
            product_id = product.id

            # 1. Sync and load active sources
            source_registry.sync_sources(db)
            sources = source_registry.get_active_sources(db, source_type=source_type_filter)

            for source in sources:
                fetched_items: List[Dict[str, Any]] = []
                try:
                    if source.source_type == "GDELT":
                        fetched_items = self.gdelt.fetch_all_taxonomy_queries(max_records_per_query=25)
                    elif source.source_type == "RSS" and source.feed_url:
                        fetched_items = self.rss.fetch_feed(source.feed_url, source.source_name)

                    source_registry.record_success(db, source.id)
                except Exception as src_err:
                    error_msg = f"Failed fetching from {source.source_name}: {src_err}"
                    print(f"[PIPELINE SOURCE ERROR] {error_msg}")
                    source_registry.record_failure(db, source.id, str(src_err))
                    stats["errors"].append(error_msg)
                    continue

                stats["total_fetched"] += len(fetched_items)

                # 2. Process each article
                for item in fetched_items:
                    try:
                        self._process_single_item(db, item, source, product_id, stats)
                    except Exception as item_err:
                        print(f"[PIPELINE ITEM ERROR] Error processing article '{item.get('title')}': {item_err}")
                        stats["errors"].append(str(item_err))

            # Mark run as completed
            run_record.completed_at = datetime.utcnow()
            run_record.status = "SUCCESS" if not stats["errors"] else "PARTIAL"
            run_record.articles_fetched = stats["total_fetched"]
            run_record.articles_relevant = stats["total_relevant"]
            run_record.articles_duplicate = stats["total_duplicates"]
            run_record.articles_rejected = stats["total_rejected"]
            run_record.articles_new = stats["new_articles_added"]
            if stats["errors"]:
                run_record.error_message = "\n".join(stats["errors"][:5])
            db.commit()

        except Exception as run_err:
            db.rollback()
            run_record.completed_at = datetime.utcnow()
            run_record.status = "FAILED"
            run_record.error_message = str(run_err)
            db.commit()
            stats["errors"].append(str(run_err))
        finally:
            db.close()

        return stats

    def _process_single_item(
        self,
        db: Session,
        raw_item: Dict[str, Any],
        source: NewsSource,
        product_id: int,
        stats: Dict[str, Any]
    ):
        """Processes, filters, deduplicates, classifies, and indexes one raw article."""
        # 1. Normalize
        norm = self.normalizer.normalize_payload(raw_item, default_region=source.publisher_region)
        title = norm["title"]
        snippet = norm["snippet"]
        canonical_url = norm["canonical_url"]
        url_hash = norm["url_hash"]
        pub_dt = norm["published_at"]
        raw_url = raw_item.get("url") or raw_item.get("link") or canonical_url

        if not title:
            return

        # 2. Filter relevance
        filter_res = self.filter.evaluate(title, snippet)
        is_relevant = filter_res["is_relevant"]

        if not is_relevant:
            stats["total_rejected"] += 1
            # Check if this rejected URL is already logged to avoid duplicate rejected rows
            existing_rej = db.query(NewsArticle.id).filter(NewsArticle.external_id == url_hash).first()
            if not existing_rej:
                rej_article = NewsArticle(
                    news_source_id=source.id,
                    external_id=url_hash,
                    canonical_url=canonical_url[:750],
                    original_url=raw_url,
                    title=title[:500],
                    summary_or_snippet=snippet[:2000] if snippet else "",
                    publisher_name=norm["publisher"][:200] or source.source_name,
                    publisher_region=source.publisher_region,
                    published_at=pub_dt,
                    relevance_score=filter_res["score"],
                    exclusion_reason=filter_res["rejection_reason"][:255] if filter_res["rejection_reason"] else None,
                    processing_status="REJECTED"
                )
                db.add(rej_article)
                db.commit()
            return

        stats["total_relevant"] += 1

        # 3. Check for duplicates / corroboration
        existing_match = self.dedup.find_duplicate(db, url_hash, title, pub_dt)
        if existing_match:
            stats["total_duplicates"] += 1
            if existing_match.external_id == url_hash:
                return  # exact record already in database

            # Corroborating duplicate coverage
            self.dedup.link_corroboration(db, existing_match, norm["publisher"], source.source_name)
            dup_record = NewsArticle(
                news_source_id=source.id,
                duplicate_of_article_id=existing_match.id,
                external_id=url_hash,
                canonical_url=canonical_url[:750],
                original_url=raw_url,
                title=title[:500],
                summary_or_snippet=snippet[:2000] if snippet else "",
                publisher_name=norm["publisher"][:200] or source.source_name,
                publisher_region=source.publisher_region,
                published_at=pub_dt,
                relevance_score=filter_res["score"],
                processing_status="DUPLICATE"
            )
            db.add(dup_record)
            db.commit()
            return

        # 4. New unique relevant article
        new_article = NewsArticle(
            news_source_id=source.id,
            external_id=url_hash,
            canonical_url=canonical_url[:750],
            original_url=raw_url,
            title=title[:500],
            summary_or_snippet=snippet[:2000] if snippet else "",
            publisher_name=norm["publisher"][:200] or source.source_name,
            publisher_region=source.publisher_region,
            published_at=pub_dt,
            relevance_score=filter_res["score"],
            processing_status="RELEVANT"
        )
        db.add(new_article)
        db.commit()
        db.refresh(new_article)

        # 5. Classify and extract structured intelligence
        intel_res = self.classifier.classify_article(
            title=title,
            snippet=snippet,
            publisher=new_article.publisher_name or source.source_name,
            geography=norm["geography"],
            matched_competitors=filter_res["matched_competitors"],
            base_event_category=filter_res["event_category"]
        )

        # Check if matched competitor is in competitors table
        competitor_id = None
        if filter_res["matched_competitors"]:
            comp_name = filter_res["matched_competitors"][0]
            comp_rec = db.execute(select(Competitor).where(Competitor.name.ilike(f"%{comp_name}%"))).scalar_one_or_none()
            if comp_rec:
                competitor_id = comp_rec.id

        severity = intel_res.get("severity_score", 3)
        impact_lvl = "CRITICAL" if severity >= 5 else "HIGH" if severity >= 4 else "MEDIUM"

        intel_record = NewsIntelligence(
            news_article_id=new_article.id,
            product_id=product_id,
            competitor_id=competitor_id,
            event_geography_name=norm["geography"],
            intelligence_type=intel_res.get("event_category", "GENERAL_MARKET"),
            event_date=pub_dt.date() if pub_dt else datetime.utcnow().date(),
            impact_level=impact_lvl,
            reliability_grade=source.default_reliability_grade or "B",
            short_summary=intel_res.get("strategic_implication", "")[:1000] or title[:1000],
            why_it_matters=f"{intel_res.get('strategic_implication', '')} Recommendation: {intel_res.get('action_recommended', '')}",
            is_corroborated=False,
            corroboration_count=1,
            review_status="APPROVED"
        )
        db.add(intel_record)
        db.commit()

        # 6. Index into Qdrant for semantic RAG retrieval
        try:
            self.indexer.index_news_article(
                article_id=new_article.id,
                title=title,
                snippet=snippet,
                canonical_url=canonical_url,
                publisher=new_article.publisher_name or source.source_name,
                geography=norm["geography"],
                event_category=intel_res.get("event_category", "GENERAL_MARKET"),
                reliability_grade=intel_record.reliability_grade,
                published_at=pub_dt.isoformat() if pub_dt else datetime.utcnow().isoformat(),
                intelligence=intel_res
            )
        except Exception as q_err:
            print(f"[PIPELINE QDRANT WARNING] Could not index article {new_article.id}: {q_err}")

        stats["new_articles_added"] += 1

# Singleton instance
news_pipeline = BromineNewsPipeline()
