"""
News Source Registry Manager
Maintains and syncs approved sources from YAML configuration into the MySQL database.
Tracks source health, reliability grades, and consecutive failure counts.
"""

from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
import yaml
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models import NewsSource

CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "news_sources.yaml"

class SourceRegistry:
    """Manages news sources in configuration and DB."""

    def __init__(self, config_file: Optional[Path] = None):
        self.config_path = config_file or CONFIG_PATH

    def load_config(self) -> List[Dict[str, Any]]:
        if not self.config_path.exists():
            return []
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}
                return data.get("sources", [])
        except Exception as e:
            print(f"[REGISTRY ERROR] Failed loading news_sources.yaml: {e}")
            return []

    def sync_sources(self, db: Session) -> int:
        """Upserts all sources defined in YAML to the news_sources database table."""
        sources_cfg = self.load_config()
        synced_count = 0

        for item in sources_cfg:
            name = item.get("source_name")
            if not name:
                continue

            existing = db.execute(
                select(NewsSource).where(NewsSource.source_name == name)
            ).scalar_one_or_none()

            if existing:
                existing.source_type = item.get("source_type", existing.source_type)
                existing.base_url = item.get("base_url", existing.base_url)
                existing.feed_url = item.get("feed_url", existing.feed_url)
                existing.publisher_region = item.get("publisher_region", existing.publisher_region)
                existing.default_reliability_grade = item.get("default_reliability_grade", existing.default_reliability_grade)
                existing.allowed_for_automated_fetch = item.get("allowed_for_automated_fetch", existing.allowed_for_automated_fetch)
                existing.active = item.get("active", existing.active)
                existing.fetch_frequency_minutes = item.get("fetch_frequency_minutes", existing.fetch_frequency_minutes)
                existing.notes = item.get("notes", existing.notes)
            else:
                new_source = NewsSource(
                    source_name=name,
                    source_type=item.get("source_type", "RSS"),
                    base_url=item.get("base_url"),
                    feed_url=item.get("feed_url"),
                    publisher_region=item.get("publisher_region", "Global"),
                    default_reliability_grade=item.get("default_reliability_grade", "B"),
                    allowed_for_automated_fetch=item.get("allowed_for_automated_fetch", True),
                    active=item.get("active", True),
                    fetch_frequency_minutes=item.get("fetch_frequency_minutes", 180),
                    notes=item.get("notes")
                )
                db.add(new_source)
            synced_count += 1

        db.commit()
        return synced_count

    def get_active_sources(self, db: Session, source_type: Optional[str] = None) -> List[NewsSource]:
        """Retrieves active sources permitted for automated fetching."""
        query = select(NewsSource).where(
            NewsSource.active == True,
            NewsSource.allowed_for_automated_fetch == True
        )
        if source_type:
            query = query.where(NewsSource.source_type == source_type)
        return list(db.execute(query).scalars().all())

    def record_success(self, db: Session, source_id: int):
        """Updates health status on a successful ingestion."""
        source = db.get(NewsSource, source_id)
        if source:
            source.last_fetched_at = datetime.utcnow()
            db.commit()

    def record_failure(self, db: Session, source_id: int, error_msg: str):
        """Records failure timestamp."""
        source = db.get(NewsSource, source_id)
        if source:
            source.last_fetched_at = datetime.utcnow()
            db.commit()

# Singleton instance
source_registry = SourceRegistry()
