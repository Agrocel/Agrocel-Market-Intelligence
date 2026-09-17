import os, uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import VectorParams, Distance, PointStruct
    HAS_QDRANT = True
except ImportError:
    QdrantClient = None
    HAS_QDRANT = False

from .embedding_provider import get_embedding_provider, BaseEmbeddingProvider

COLLECTION_NAME = "bromine_intelligence_documents"
DEFAULT_STORAGE_DIR = Path(__file__).resolve().parents[3] / "Data" / "qdrant_storage"

class QdrantStore:
    def __init__(self, storage_path: Optional[Path] = None, embedding_provider: Optional[BaseEmbeddingProvider] = None):
        self.storage_path = storage_path or DEFAULT_STORAGE_DIR
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.embedding_provider = embedding_provider or get_embedding_provider()
        self.dimension = self.embedding_provider.dimension
        self.collection_name = COLLECTION_NAME
        self.client = None
        if not HAS_QDRANT or QdrantClient is None:
            return
        try:
            self.client = QdrantClient(path=str(self.storage_path))
            self.ensure_collection()
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Qdrant file storage locked by concurrent process: {e}")
            self.client = None

    def ensure_collection(self):
        if self.client is None:
            return
        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)
            if not exists:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=self.dimension, distance=Distance.COSINE)
                )
        except Exception:
            pass

    def upsert_chunks(self, chunks: List[Dict[str, Any]]) -> int:
        """
        Chunks is a list of dicts:
        {
          "text": str,
          "source_document_id": int,
          "title": str,
          "source_type": str,
          "page_number": int | None,
          "publication_date": str | None,
          "file_path": str | None,
          "reliability_grade": str,
          "competitor": str | None,
          "geography": str | None
        }
        """
        if not chunks:
            return 0
            
        points = []
        texts = [c["text"] for c in chunks]
        embeddings = self.embedding_provider.embed_documents(texts)
        
        for idx, chunk in enumerate(chunks):
            # Generate deterministic or unique ID based on doc id and page/index
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{chunk.get('source_document_id')}_{chunk.get('page_number', 0)}_{idx}"))
            payload = {
                "chunk_text": chunk["text"],
                "source_document_id": chunk.get("source_document_id"),
                "title": chunk.get("title", ""),
                "source_type": chunk.get("source_type", "REPORT"),
                "page_number": chunk.get("page_number"),
                "publication_date": str(chunk.get("publication_date")),
                "file_path": chunk.get("file_path"),
                "reliability_grade": chunk.get("reliability_grade", "B"),
                "competitor": chunk.get("competitor"),
                "geography": chunk.get("geography", "Global")
            }
            points.append(PointStruct(id=point_id, vector=embeddings[idx], payload=payload))
            
        self.client.upsert(collection_name=self.collection_name, points=points)
        return len(points)

    def search(self, query: str, limit: int = 5, score_threshold: float = 0.15) -> List[Dict[str, Any]]:
        if self.client is None:
            return []
        query_vector = self.embedding_provider.embed_text(query)
        # In Qdrant client 1.19, use query_points
        try:
            results = self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector,
                limit=limit,
                score_threshold=score_threshold
            ).points
        except Exception:
            # Fallback to search
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                limit=limit,
                score_threshold=score_threshold
            )
            
        hits = []
        for r in results:
            payload = r.payload or {}
            hits.append({
                "score": round(float(r.score), 4),
                "text": payload.get("chunk_text", ""),
                "title": payload.get("title", "Document"),
                "source_type": payload.get("source_type", "REPORT"),
                "page_number": payload.get("page_number"),
                "publication_date": payload.get("publication_date"),
                "file_path": payload.get("file_path"),
                "reliability_grade": payload.get("reliability_grade", "B"),
                "source_document_id": payload.get("source_document_id")
            })
        return hits

_global_store = None

def get_qdrant_store() -> QdrantStore:
    global _global_store
    if _global_store is None:
        _global_store = QdrantStore()
    return _global_store
