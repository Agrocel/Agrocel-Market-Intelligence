from datetime import datetime, date
from sqlalchemy import String, Float, Date, DateTime, ForeignKey, Text, Boolean, Integer, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

class Timestamped:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Product(Base, Timestamped):
    __tablename__ = 'products'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    chemical_name: Mapped[str] = mapped_column(String(120))
    product_code: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

class Geography(Base):
    __tablename__ = 'geographies'
    id: Mapped[int] = mapped_column(primary_key=True)
    country: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    region: Mapped[str] = mapped_column(String(100))
    iso_code: Mapped[str] = mapped_column(String(3), unique=True, index=True)

class Competitor(Base, Timestamped):
    __tablename__ = 'competitors'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    country: Mapped[str] = mapped_column(String(100))
    listed_company: Mapped[bool] = mapped_column(Boolean, default=False)
    stock_ticker: Mapped[str | None] = mapped_column(String(32), index=True)
    website: Mapped[str | None] = mapped_column(String(255))
    active: Mapped[bool] = mapped_column(Boolean, default=True)

class MarketPrice(Base, Timestamped):
    __tablename__ = 'market_prices'
    __table_args__ = (
        UniqueConstraint('product_id', 'geography_id', 'price_date', 'source_name', name='uq_market_price_point'),
        Index('ix_market_prices_date_product', 'price_date', 'product_id'),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey('products.id'), index=True)
    geography_id: Mapped[int] = mapped_column(ForeignKey('geographies.id'), index=True)
    price_date: Mapped[date] = mapped_column(Date, index=True)
    price_value: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(8), default='USD')
    unit: Mapped[str] = mapped_column(String(30), default='MT')
    source_name: Mapped[str] = mapped_column(String(150), index=True)
    source_url: Mapped[str | None] = mapped_column(String(500))
    source_document_id: Mapped[int | None] = mapped_column(ForeignKey('source_documents.id'), nullable=True)
    confidence_grade: Mapped[str] = mapped_column(String(1), default='B')

class TradeRecord(Base, Timestamped):
    __tablename__ = 'trade_records'
    __table_args__ = (
        UniqueConstraint('source_file', 'source_sheet', 'source_row_index', name='uq_trade_source_row'),
        Index('ix_trade_date_dir_product', 'trade_date', 'trade_direction', 'product_id'),
        Index('ix_trade_partner_country', 'partner_country'),
        Index('ix_trade_fy_dir', 'financial_year', 'trade_direction'),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey('products.id'), index=True, default=1)
    trade_date: Mapped[date] = mapped_column(Date, index=True)
    trade_direction: Mapped[str] = mapped_column(String(8), index=True) # IMPORT, EXPORT
    financial_year: Mapped[str] = mapped_column(String(16), index=True)
    
    reporting_country: Mapped[str] = mapped_column(String(100), default='India')
    partner_country: Mapped[str] = mapped_column(String(100), default='World', index=True)
    
    indian_port: Mapped[str | None] = mapped_column(String(100), nullable=True)
    foreign_port: Mapped[str | None] = mapped_column(String(100), nullable=True)
    indian_company: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    foreign_company: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    bill_no: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    product_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hs_code: Mapped[str | None] = mapped_column(String(20), index=True, default='28013020')
    
    quantity_mt: Mapped[float] = mapped_column(Float)
    trade_value_usd: Mapped[float] = mapped_column(Float)
    average_price_usd_per_mt: Mapped[float] = mapped_column(Float)
    trade_value_inr: Mapped[float | None] = mapped_column(Float, nullable=True)
    unit_rate_inr: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    source_file: Mapped[str] = mapped_column(String(255))
    source_sheet: Mapped[str] = mapped_column(String(64))
    source_row_index: Mapped[int] = mapped_column(Integer)
    source_name: Mapped[str] = mapped_column(String(150), index=True)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    original_quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    original_unit: Mapped[str | None] = mapped_column(String(20), nullable=True)

class SalesRecord(Base, Timestamped):
    __tablename__ = 'sales_records'
    __table_args__ = (
        UniqueConstraint('source_file', 'source_row_index', name='uq_sales_source_row'),
        Index('ix_sales_date_product', 'sales_date', 'product_id'),
        Index('ix_sales_fy_customer', 'financial_year', 'customer_name'),
        Index('ix_sales_category', 'product_category'),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_no: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    sales_date: Mapped[date] = mapped_column(Date, index=True)
    financial_year: Mapped[str] = mapped_column(String(16), index=True)
    customer_name: Mapped[str] = mapped_column(String(255), index=True)
    consignee_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    state_or_zone: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    location: Mapped[str | None] = mapped_column(String(128), nullable=True)
    po_number: Mapped[str | None] = mapped_column(String(128), nullable=True)
    po_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    
    product_raw: Mapped[str] = mapped_column(String(64), index=True)
    product_category: Mapped[str] = mapped_column(String(64), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey('products.id'), index=True, default=1)
    geography_id: Mapped[int] = mapped_column(ForeignKey('geographies.id'), default=1)
    
    quantity_kg: Mapped[float] = mapped_column(Float)
    quantity_mt: Mapped[float] = mapped_column(Float)
    basic_rate_per_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    net_realization_per_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    realization_inr_per_mt: Mapped[float] = mapped_column(Float)
    revenue_inr: Mapped[float] = mapped_column(Float)
    gross_amount_inr: Mapped[float | None] = mapped_column(Float, nullable=True)
    
    customer_segment: Mapped[str | None] = mapped_column(String(100), default='Industrial')
    is_confidential: Mapped[bool] = mapped_column(Boolean, default=True)
    source_file: Mapped[str] = mapped_column(String(255))
    source_row_index: Mapped[int] = mapped_column(Integer)

class CompetitorStockPrice(Base, Timestamped):
    __tablename__ = 'competitor_stock_prices'
    __table_args__ = (
        UniqueConstraint('competitor_id', 'price_date', name='uq_competitor_stock_daily'),
        Index('ix_stock_comp_date', 'competitor_id', 'price_date'),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    competitor_id: Mapped[int] = mapped_column(ForeignKey('competitors.id'), index=True)
    stock_ticker: Mapped[str] = mapped_column(String(32), index=True)
    price_date: Mapped[date] = mapped_column(Date, index=True)
    close_price: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(8), default='USD')
    volume: Mapped[float | None] = mapped_column(Float, nullable=True)
    source_name: Mapped[str] = mapped_column(String(150))

class SourceDocument(Base, Timestamped):
    __tablename__ = 'source_documents'
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(500), index=True)
    source_type: Mapped[str] = mapped_column(String(40), index=True)
    source_name: Mapped[str] = mapped_column(String(150))
    source_url: Mapped[str | None] = mapped_column(String(500))
    file_path: Mapped[str | None] = mapped_column(String(500))
    published_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    ingested_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    original_file_name: Mapped[str | None] = mapped_column(String(500))
    checksum: Mapped[str | None] = mapped_column(String(64), unique=True, index=True)
    processing_status: Mapped[str] = mapped_column(String(30), default='PENDING', index=True)

class DocumentChunk(Base, Timestamped):
    __tablename__ = 'document_chunks'
    id: Mapped[int] = mapped_column(primary_key=True)
    source_document_id: Mapped[int] = mapped_column(ForeignKey('source_documents.id'), index=True)
    chunk_text: Mapped[str] = mapped_column(Text)
    chunk_index: Mapped[int] = mapped_column(Integer)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    embedding: Mapped[str | None] = mapped_column(Text, nullable=True)
    qdrant_point_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

class IntelligenceItem(Base, Timestamped):
    __tablename__ = 'intelligence_items'
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(500))
    summary: Mapped[str] = mapped_column(Text)
    event_date: Mapped[date] = mapped_column(Date, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey('products.id'), index=True)
    competitor_id: Mapped[int | None] = mapped_column(ForeignKey('competitors.id'), nullable=True, index=True)
    geography_id: Mapped[int | None] = mapped_column(ForeignKey('geographies.id'), nullable=True, index=True)
    intelligence_type: Mapped[str] = mapped_column(String(40), index=True) # price, capacity, demand, supply, regulation, competitor move, market event, customer signal
    impact_level: Mapped[str] = mapped_column(String(10), index=True) # LOW, MEDIUM, HIGH, CRITICAL
    reliability_grade: Mapped[str] = mapped_column(String(1), index=True) # A, B, C, D
    source_document_id: Mapped[int | None] = mapped_column(ForeignKey('source_documents.id'), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(500))
    extracted_by: Mapped[str] = mapped_column(String(10), default='SYSTEM')
    reviewed_by: Mapped[str | None] = mapped_column(String(100))
    review_status: Mapped[str] = mapped_column(String(12), default='APPROVED', index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ManualIntelligenceEntry(Base):
    __tablename__ = 'manual_intelligence_entries'
    id: Mapped[int] = mapped_column(primary_key=True)
    submitted_by: Mapped[str] = mapped_column(String(100))
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    raw_text: Mapped[str] = mapped_column(Text)
    event_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    suggested_tags: Mapped[str | None] = mapped_column(String(255))
    reliability_grade: Mapped[str] = mapped_column(String(1), default='C')
    review_status: Mapped[str] = mapped_column(String(12), default='PENDING')
    linked_intelligence_item_id: Mapped[int | None] = mapped_column(ForeignKey('intelligence_items.id'), nullable=True)

class IngestionRun(Base):
    __tablename__ = 'ingestion_runs'
    id: Mapped[int] = mapped_column(primary_key=True)
    pipeline_name: Mapped[str] = mapped_column(String(100), index=True)
    file_name: Mapped[str] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(30), default='RUNNING') # SUCCESS, PARTIAL, FAILED
    rows_processed: Mapped[int] = mapped_column(Integer, default=0)
    rows_loaded: Mapped[int] = mapped_column(Integer, default=0)
    rows_rejected: Mapped[int] = mapped_column(Integer, default=0)
    rows_duplicate: Mapped[int] = mapped_column(Integer, default=0)
    warnings: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

class IngestionError(Base):
    __tablename__ = 'ingestion_errors'
    id: Mapped[int] = mapped_column(primary_key=True)
    ingestion_run_id: Mapped[int] = mapped_column(ForeignKey('ingestion_runs.id'), index=True)
    row_number: Mapped[int] = mapped_column(Integer)
    raw_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_reason: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class ExecutiveBrief(Base):
    __tablename__ = 'executive_briefs'
    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey('products.id'), index=True)
    brief_type: Mapped[str] = mapped_column(String(20), default='WEEKLY', index=True) # WEEKLY, MONTHLY, ON_DEMAND
    period_start: Mapped[date] = mapped_column(Date, index=True)
    period_end: Mapped[date] = mapped_column(Date, index=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    generated_by: Mapped[str] = mapped_column(String(50), default='SYSTEM')
    overall_market_direction: Mapped[str] = mapped_column(String(20), default='MIXED') # BULLISH, BEARISH, MIXED, STABLE
    market_narrative: Mapped[str | None] = mapped_column(Text, nullable=True) # Full executive prose: Who did what & market state
    executive_summary: Mapped[str] = mapped_column(Text)
    why_it_matters: Mapped[str] = mapped_column(Text)
    management_attention: Mapped[str] = mapped_column(Text)
    source_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default='PUBLISHED', index=True) # DRAFT, REVIEWED, PUBLISHED
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sections: Mapped[list["ExecutiveBriefSection"]] = relationship(back_populates="brief", cascade="all, delete-orphan")
    citations: Mapped[list["ExecutiveBriefCitation"]] = relationship(back_populates="brief", cascade="all, delete-orphan")

class ExecutiveBriefSection(Base):
    __tablename__ = 'executive_brief_sections'
    id: Mapped[int] = mapped_column(primary_key=True)
    executive_brief_id: Mapped[int] = mapped_column(ForeignKey('executive_briefs.id'), index=True)
    section_type: Mapped[str] = mapped_column(String(50), index=True)
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    display_order: Mapped[int] = mapped_column(Integer, default=1)
    confidence_level: Mapped[str] = mapped_column(String(20), default='HIGH') # HIGH, MEDIUM, LOW
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    brief: Mapped["ExecutiveBrief"] = relationship(back_populates="sections")
    citations: Mapped[list["ExecutiveBriefCitation"]] = relationship(back_populates="section")

class ExecutiveBriefCitation(Base):
    __tablename__ = 'executive_brief_citations'
    id: Mapped[int] = mapped_column(primary_key=True)
    executive_brief_id: Mapped[int] = mapped_column(ForeignKey('executive_briefs.id'), index=True)
    section_id: Mapped[int | None] = mapped_column(ForeignKey('executive_brief_sections.id'), nullable=True, index=True)
    source_document_id: Mapped[int | None] = mapped_column(ForeignKey('source_documents.id'), nullable=True)
    intelligence_item_id: Mapped[int | None] = mapped_column(ForeignKey('intelligence_items.id'), nullable=True)
    market_price_id: Mapped[int | None] = mapped_column(ForeignKey('market_prices.id'), nullable=True)
    trade_record_id: Mapped[int | None] = mapped_column(ForeignKey('trade_records.id'), nullable=True)
    sales_record_id: Mapped[int | None] = mapped_column(ForeignKey('sales_records.id'), nullable=True)
    news_article_id: Mapped[int | None] = mapped_column(ForeignKey('news_articles.id'), nullable=True)
    news_intelligence_id: Mapped[int | None] = mapped_column(ForeignKey('news_intelligence.id'), nullable=True)
    citation_text: Mapped[str] = mapped_column(Text)
    source_title: Mapped[str] = mapped_column(String(255))
    source_url_or_file: Mapped[str | None] = mapped_column(String(500), nullable=True)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    published_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    reliability_grade: Mapped[str] = mapped_column(String(1), default='B') # A, B, C, D

    brief: Mapped["ExecutiveBrief"] = relationship(back_populates="citations")
    section: Mapped["ExecutiveBriefSection | None"] = relationship(back_populates="citations")

# ========================================================
# News Ingestion & Intelligence Data Models
# ========================================================

class NewsSource(Base, Timestamped):
    __tablename__ = 'news_sources'
    id: Mapped[int] = mapped_column(primary_key=True)
    source_name: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    source_type: Mapped[str] = mapped_column(String(30), index=True)  # GDELT, RSS, OFFICIAL_WEBSITE, MANUAL
    base_url: Mapped[str] = mapped_column(String(500))
    feed_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    publisher_region: Mapped[str] = mapped_column(String(50), default='Global', index=True)
    default_reliability_grade: Mapped[str] = mapped_column(String(1), default='B')  # A, B, C, D
    allowed_for_automated_fetch: Mapped[bool] = mapped_column(Boolean, default=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    fetch_frequency_minutes: Mapped[int] = mapped_column(Integer, default=180)
    last_fetched_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    terms_checked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    articles: Mapped[list["NewsArticle"]] = relationship(back_populates="source", cascade="all, delete-orphan")
    ingestion_runs: Mapped[list["NewsIngestionRun"]] = relationship(back_populates="source")

class NewsArticle(Base, Timestamped):
    __tablename__ = 'news_articles'
    id: Mapped[int] = mapped_column(primary_key=True)
    news_source_id: Mapped[int] = mapped_column(ForeignKey('news_sources.id'), index=True)
    external_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    canonical_url: Mapped[str] = mapped_column(String(750), index=True)
    original_url: Mapped[str] = mapped_column(Text)
    title: Mapped[str] = mapped_column(String(500), index=True)
    summary_or_snippet: Mapped[str] = mapped_column(Text)
    author: Mapped[str | None] = mapped_column(String(200), nullable=True)
    published_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    language: Mapped[str] = mapped_column(String(10), default='en')
    publisher_name: Mapped[str] = mapped_column(String(200), index=True)
    publisher_region: Mapped[str] = mapped_column(String(50), index=True)
    raw_payload_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    content_fetch_status: Mapped[str] = mapped_column(String(30), default='SNIPPET_ONLY')  # SNIPPET_ONLY, FULL_TEXT, FAILED
    duplicate_of_article_id: Mapped[int | None] = mapped_column(ForeignKey('news_articles.id'), nullable=True, index=True)
    relevance_score: Mapped[float] = mapped_column(Float, default=0.0, index=True)
    exclusion_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    processing_status: Mapped[str] = mapped_column(String(30), default='PENDING', index=True)  # PENDING, RELEVANT, REJECTED, PROCESSED, DUPLICATE
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    source: Mapped["NewsSource"] = relationship(back_populates="articles")
    intelligence_items: Mapped[list["NewsIntelligence"]] = relationship(back_populates="article", cascade="all, delete-orphan")
    duplicates: Mapped[list["NewsArticle"]] = relationship(back_populates="primary_article", foreign_keys=[duplicate_of_article_id])
    primary_article: Mapped["NewsArticle | None"] = relationship(back_populates="duplicates", remote_side=[id], foreign_keys=[duplicate_of_article_id])

class NewsIntelligence(Base, Timestamped):
    __tablename__ = 'news_intelligence'
    id: Mapped[int] = mapped_column(primary_key=True)
    news_article_id: Mapped[int] = mapped_column(ForeignKey('news_articles.id'), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey('products.id'), index=True)
    competitor_id: Mapped[int | None] = mapped_column(ForeignKey('competitors.id'), nullable=True, index=True)
    event_geography_id: Mapped[int | None] = mapped_column(ForeignKey('geographies.id'), nullable=True, index=True)
    event_geography_name: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    intelligence_type: Mapped[str] = mapped_column(String(40), index=True)  # PRICE, CAPACITY, SUPPLY, DEMAND, REGULATION, TRADE, COMPETITOR_MOVE, PLANT_EVENT, SAFETY_INCIDENT, OTHER
    event_date: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    impact_level: Mapped[str] = mapped_column(String(10), default='MEDIUM', index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    reliability_grade: Mapped[str] = mapped_column(String(1), default='B', index=True)  # A, B, C, D
    short_summary: Mapped[str] = mapped_column(Text)
    why_it_matters: Mapped[str] = mapped_column(Text)
    is_corroborated: Mapped[bool] = mapped_column(Boolean, default=False)
    corroboration_count: Mapped[int] = mapped_column(Integer, default=1)
    qdrant_point_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    review_status: Mapped[str] = mapped_column(String(12), default='APPROVED', index=True)  # PENDING, APPROVED, REJECTED
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    article: Mapped["NewsArticle"] = relationship(back_populates="intelligence_items")
    product: Mapped["Product"] = relationship()
    competitor: Mapped["Competitor | None"] = relationship()
    geography: Mapped["Geography | None"] = relationship()

class NewsIngestionRun(Base):
    __tablename__ = 'news_ingestion_runs'
    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int | None] = mapped_column(ForeignKey('news_sources.id'), nullable=True, index=True)
    pipeline_name: Mapped[str] = mapped_column(String(100), default='news_ingestion', index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default='RUNNING')  # RUNNING, SUCCESS, PARTIAL, FAILED
    articles_fetched: Mapped[int] = mapped_column(Integer, default=0)
    articles_new: Mapped[int] = mapped_column(Integer, default=0)
    articles_duplicate: Mapped[int] = mapped_column(Integer, default=0)
    articles_relevant: Mapped[int] = mapped_column(Integer, default=0)
    articles_rejected: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    source: Mapped["NewsSource | None"] = relationship(back_populates="ingestion_runs")


