"""
Qdrant News Indexer
Indexes relevant market news articles and AI intelligence payloads into Qdrant vector storage
for RAG retrieval and citation in executive intelligence briefs.
"""

import uuid
from typing import Dict, Any, List, Optional
from pathlib import Path
try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import VectorParams, Distance, PointStruct
    HAS_QDRANT = True
except ImportError:
    QdrantClient = None
    HAS_QDRANT = False

from app.vector.embedding_provider import get_embedding_provider, BaseEmbeddingProvider

COLLECTION_NAME = "bromine_market_news"
DEFAULT_STORAGE_DIR = Path(__file__).resolve().parents[3] / "Data" / "qdrant_storage"

class QdrantNewsIndexer:
    """Manages vector embeddings and payload indexing for market news articles."""

    def __init__(self, storage_path: Optional[Path] = None):
        self.storage_path = storage_path or DEFAULT_STORAGE_DIR
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.embedding_provider = get_embedding_provider()
        self.dimension = self.embedding_provider.dimension
        self.collection_name = COLLECTION_NAME
        self.client = None
        self._init_client()

    def _init_client(self):
        if not HAS_QDRANT or QdrantClient is None:
            self.client = None
            return
        try:
            self.client = QdrantClient(path=str(self.storage_path))
            self.ensure_collection()
        except Exception as e:
            print(f"[QDRANT NEWS INDEXER WARNING] Qdrant storage unavailable/locked: {e}")
            self.client = None

    def ensure_collection(self):
        if not self.client:
            return
        try:
            existing = [c.name for c in self.client.get_collections().collections]
            if self.collection_name not in existing:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=self.dimension, distance=Distance.COSINE)
                )
                print(f"[QDRANT] Created collection '{self.collection_name}' with dimension {self.dimension}")
        except Exception as e:
            print(f"[QDRANT WARNING] Failed ensuring collection '{self.collection_name}': {e}")

    def index_news_article(
        self,
        article_id: int,
        title: str,
        snippet: str,
        canonical_url: str,
        publisher: str,
        geography: str,
        event_category: str,
        reliability_grade: str,
        published_at: str,
        intelligence: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Embeds and indexes a single news article with intelligence payload into Qdrant."""
        if not self.client:
            self._init_client()
        if not self.client:
            return False

        try:
            intel = intelligence or {}
            strat_imp = intel.get("strategic_implication", "")
            action_rec = intel.get("action_recommended", "")

            # Searchable text combining title, market snippet, and strategic implication
            full_text = f"Title: {title}\nSummary: {snippet}\nImplication: {strat_imp}\nAction: {action_rec}"
            vector = self.embedding_provider.embed_text(full_text)

            point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, canonical_url or f"news_{article_id}"))
            payload = {
                "news_article_id": article_id,
                "title": title,
                "snippet": snippet,
                "canonical_url": canonical_url,
                "publisher": publisher,
                "geography": geography,
                "event_category": event_category,
                "reliability_grade": reliability_grade,
                "published_at": published_at,
                "impact_on_agrocel": intel.get("impact_on_agrocel", "indirect"),
                "impact_sentiment": intel.get("impact_sentiment", "neutral_market_signal"),
                "severity_score": intel.get("severity_score", 3),
                "strategic_implication": strat_imp,
                "action_recommended": action_rec
            }

            self.client.upsert(
                collection_name=self.collection_name,
                points=[PointStruct(id=point_id, vector=vector, payload=payload)]
            )
            return True
        except Exception as e:
            print(f"[QDRANT INDEX ERROR] Failed to index article {article_id}: {e}")
            return False

# Singleton instance
news_indexer = QdrantNewsIndexer()
