"""
Unit & Integration Tests for Bromine News Ingestion Pipeline
"""

import sys
import unittest
from datetime import datetime, timedelta
from pathlib import Path

# Ensure backend path is on sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.news.taxonomy import news_taxonomy
from app.news.normalizer import ArticleNormalizer
from app.news.relevance_filter import relevance_filter
from app.news.deduplicator import news_deduplicator
from app.news.ai_classifier import news_classifier
from app.news.gdelt_client import gdelt_client
from app.news.pipeline import news_pipeline
from app.database import SessionLocal
from app.models import NewsArticle, NewsSource, NewsIntelligence

class TestBromineNewsPipeline(unittest.TestCase):

    def test_taxonomy_loading(self):
        """Verify keywords, competitors, and exclusion terms are loaded properly."""
        self.assertGreaterEqual(len(news_taxonomy.product_keywords), 10)
        self.assertIn("bromine", news_taxonomy.product_keywords)
        self.assertGreaterEqual(len(news_taxonomy.competitors), 5)
        self.assertGreaterEqual(len(news_taxonomy.negative_exclusion_keywords), 5)

        # Test competitor alias detection
        matched = news_taxonomy.match_competitors("Archean Chemical announced record Q2 results.")
        self.assertEqual(len(matched), 1)
        self.assertEqual(matched[0]["name"], "Archean Chemical Industries")

        # Test geography matching
        geo = news_taxonomy.match_geography("Plant shut down in Weifang, Shandong.")
        self.assertEqual(geo, "China")

        geo_in = news_taxonomy.match_geography("Shipment delayed from Mundra port, Gujarat.")
        self.assertEqual(geo_in, "India")

    def test_normalizer(self):
        """Verify URL canonicalization, tracker stripping, and datetime parsing."""
        raw_url = "https://WWW.ChemicalMarket.com/article/12345/?utm_source=twitter&utm_medium=social#comments"
        canon = ArticleNormalizer.canonicalize_url(raw_url)
        self.assertNotIn("utm_source", canon)
        self.assertNotIn("utm_medium", canon)
        self.assertNotIn("#comments", canon)
        self.assertEqual(canon, "https://www.chemicalmarket.com/article/12345")

        url_hash = ArticleNormalizer.compute_url_hash(canon)
        self.assertEqual(len(url_hash), 64)

        # Test date parsing
        dt1 = ArticleNormalizer.parse_datetime("2026-09-10T14:30:00Z")
        self.assertEqual(dt1.year, 2026)
        self.assertEqual(dt1.month, 9)
        self.assertEqual(dt1.day, 10)

        dt_gdelt = ArticleNormalizer.parse_datetime("20260908120000")
        self.assertEqual(dt_gdelt.year, 2026)
        self.assertEqual(dt_gdelt.month, 9)
        self.assertEqual(dt_gdelt.day, 8)

        dt_cn = ArticleNormalizer.parse_datetime("2026年09月05日")
        self.assertEqual(dt_cn.year, 2026)
        self.assertEqual(dt_cn.month, 9)
        self.assertEqual(dt_cn.day, 5)

    def test_relevance_filter(self):
        """Verify bromine specificity, negative exclusion, and audit logging."""
        # 1. High relevance Bromine market news
        res1 = relevance_filter.evaluate(
            title="Shandong bromine spot prices surge as Weifang environmental audits tighten supply",
            snippet="Merchant elemental bromine prices rose to 26,500 RMB/mt following environmental inspections."
        )
        self.assertTrue(res1["is_relevant"])
        self.assertGreaterEqual(res1["score"], 0.60)
        self.assertEqual(res1["status"], "accepted")
        self.assertIsNone(res1["rejection_reason"])
        self.assertIn("bromine", res1["matched_keywords"])

        # 2. Irrelevant negative keyword news (pool disinfectant)
        res2 = relevance_filter.evaluate(
            title="Top 5 Best Swimming Pool Bromine Tablets for Hot Tubs and Spas in 2026",
            snippet="These swimming pool bromine tablets keep your hot tub clean and bacteria free all summer."
        )
        self.assertFalse(res2["is_relevant"])
        self.assertEqual(res2["status"], "rejected")
        self.assertIn("EXCLUDED_BY_NEGATIVE_KEYWORD", res2["rejection_reason"])

        # 3. Irrelevant general chemical news without bromine
        res3 = relevance_filter.evaluate(
            title="Methanol and Caustic Soda global demand outlook for 2026",
            snippet="Global production of caustic soda and ethylene glycol saw steady recovery in Asian markets."
        )
        self.assertFalse(res3["is_relevant"])
        self.assertEqual(res3["status"], "rejected")
        self.assertIn("NO_BROMINE_PRODUCT_KEYWORD", res3["rejection_reason"])

    def test_ai_classifier_rule_fallback(self):
        """Verify deterministic rule-based intelligence classification produces structured insight."""
        intel = news_classifier._classify_with_rules(
            title="Archean Chemical expands elemental bromine extraction in Kutch, Gujarat",
            snippet="The company added 18,000 MT capacity to capture growing export demand in China and Europe.",
            publisher="The Hindu BusinessLine",
            geography="India",
            matched_competitors=["Archean Chemical Industries"],
            base_event_category="CAPACITY"
        )
        self.assertEqual(intel["event_category"], "CAPACITY")
        self.assertEqual(intel["impact_on_agrocel"], "direct")
        self.assertGreaterEqual(intel["severity_score"], 4)
        self.assertTrue("Archean" in intel["strategic_implication"] or "competitor" in intel["strategic_implication"].lower())
        self.assertNotEqual(intel["action_recommended"], "")

    def test_pipeline_execution(self):
        """Runs a live or fallback pipeline execution and verifies records in DB."""
        stats = news_pipeline.run_pipeline(run_type="test_run")
        self.assertGreaterEqual(stats["total_fetched"], 0)
        self.assertIn("run_id", stats)

        db = SessionLocal()
        try:
            articles_count = db.query(NewsArticle).count()
            self.assertGreaterEqual(articles_count, 0)
            sources_count = db.query(NewsSource).count()
            self.assertGreaterEqual(sources_count, 5)
        finally:
            db.close()

if __name__ == "__main__":
    unittest.main()
