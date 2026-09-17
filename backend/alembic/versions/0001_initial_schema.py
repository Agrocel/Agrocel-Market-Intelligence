"""Initial PostgreSQL schema; pgvector is explicitly enabled for document retrieval."""
from alembic import op
import sqlalchemy as sa
revision='0001_initial_schema'; down_revision=None; branch_labels=None; depends_on=None
def upgrade():
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')
    # Runtime SQLAlchemy models create the normalized tables; production migration starts vector index support.
    op.execute('CREATE INDEX IF NOT EXISTS ix_document_chunks_embedding ON document_chunks USING ivfflat ((embedding::vector(1536)) vector_cosine_ops)')
def downgrade(): op.execute('DROP INDEX IF EXISTS ix_document_chunks_embedding')
