"""
Multi-Tier News Deduplicator & Corroboration Engine
Identifies duplicate coverage via exact URL hashes (stored in external_id) and fuzzy title similarity.
Links duplicates to the canonical record and elevates corroboration counts and reliability grades.
"""

from datetime import datetime, timedelta
from difflib import SequenceMatcher
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models import NewsArticle, NewsIntelligence

class NewsDeduplicator:
    """Manages deduplication and multi-source corroboration logic."""

    def __init__(self, title_similarity_threshold: float = 0.85, window_days: int = 7):
        self.similarity_threshold = title_similarity_threshold
        self.window_days = window_days

    def find_duplicate(
        self,
        db: Session,
        url_hash: str,
        title: str,
        pub_dt: datetime
    ) -> Optional[NewsArticle]:
        """
        Finds an existing article that is either an exact URL match or a fuzzy title match.
        """
        # 1. Exact URL Hash Match (stored in external_id)
        exact = db.execute(
            select(NewsArticle).where(NewsArticle.external_id == url_hash)
        ).scalar_one_or_none()
        if exact:
            return exact

        # 2. Fuzzy Title Match within date window
        window_start = pub_dt - timedelta(days=self.window_days)
        window_end = pub_dt + timedelta(days=self.window_days)

        recent_candidates = db.execute(
            select(NewsArticle).where(
                NewsArticle.duplicate_of_article_id.is_(None),  # compare against canonical articles
                NewsArticle.published_at >= window_start,
                NewsArticle.published_at <= window_end
            )
        ).scalars().all()

        clean_title = title.lower().strip()
        for cand in recent_candidates:
            cand_title = (cand.title or "").lower().strip()
            similarity = SequenceMatcher(None, clean_title, cand_title).ratio()
            if similarity >= self.similarity_threshold:
                return cand

        return None

    def link_corroboration(
        self,
        db: Session,
        canonical: NewsArticle,
        new_publisher: str,
        new_source_name: str
    ):
        """
        Elevates corroboration count on the canonical article's intelligence items
        and upgrades reliability grades if multi-source corroborated.
        """
        for intel in canonical.intelligence_items:
            intel.is_corroborated = True
            intel.corroboration_count = (intel.corroboration_count or 1) + 1

            if intel.corroboration_count >= 3:
                intel.reliability_grade = "A"
            elif intel.corroboration_count >= 2 and intel.reliability_grade in ("C", "D"):
                intel.reliability_grade = "B"

        db.commit()

# Singleton instance
news_deduplicator = NewsDeduplicator()
