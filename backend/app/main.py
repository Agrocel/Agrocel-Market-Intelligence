import csv, io, os, shutil, hashlib
from datetime import datetime, date, timedelta
from pathlib import Path
from typing import Optional, List
from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select, desc, func
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import (
    Product, Geography, Competitor, MarketPrice, TradeRecord,
    SalesRecord, SourceDocument, DocumentChunk, IntelligenceItem,
    ManualIntelligenceEntry, CompetitorStockPrice, IngestionRun, IngestionError,
    NewsSource, NewsArticle, NewsIntelligence, NewsIngestionRun
)
from .services import (
    overview, parse_date_opt, get_data_sources_summary,
    get_latest_common_month_range, get_latest_common_date
)
from .retrieval.hybrid_retriever import hybrid_chat_answer
from .cleaning.ingest_documents import ingest_single_document
from .vector.qdrant_store import get_qdrant_store
from .weekly_workflow import (
    get_latest_executive_brief,
    get_executive_brief_by_id,
    get_executive_brief_history,
    run_weekly_intelligence_workflow,
    get_brief_citations,
    get_brief_market_evidence,
    format_brief_response
)
from .news.pipeline import news_pipeline
from .news.scheduler import news_scheduler
from .news.taxonomy import news_taxonomy
from .news.registry import source_registry

app = FastAPI(title="Agrocel Bromine Market Intelligence API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.on_event("startup")
def boot():
    Base.metadata.create_all(engine)
    try:
        news_scheduler.start()
    except Exception as e:
        print(f"[STARTUP] Could not start news scheduler: {e}")

@app.on_event("shutdown")
def shutdown():
    try:
        news_scheduler.stop()
    except Exception:
        pass

@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat(), "database": "connected"}

@app.get("/api/dashboard/bromine-overview")
def dashboard(
    start: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    return overview(db, start=start, end=end)

@app.get("/api/data-sources/summary")
def data_sources_summary(db: Session = Depends(get_db)):
    """Returns complete data range, origin metadata, and news provenance for all sources."""
    return get_data_sources_summary(db)
    
@app.get("/api/market/forecast")
def market_forecast():
    """Returns the internal proprietary monthly price forecast for India Bromine."""
    historical_points = [
        {"date": "2022-06", "month_label": "Jun 22", "avg_unit_value_usd": 2.81},
        {"date": "2022-07", "month_label": "Jul 22", "avg_unit_value_usd": 2.92},
        {"date": "2022-08", "month_label": "Aug 22", "avg_unit_value_usd": 3.06},
        {"date": "2022-09", "month_label": "Sep 22", "avg_unit_value_usd": 3.32},
        {"date": "2022-10", "month_label": "Oct 22", "avg_unit_value_usd": 3.23},
        {"date": "2022-11", "month_label": "Nov 22", "avg_unit_value_usd": 3.10},
        {"date": "2022-12", "month_label": "Dec 22", "avg_unit_value_usd": 3.33},
        {"date": "2023-01", "month_label": "Jan 23", "avg_unit_value_usd": 3.17},
        {"date": "2023-02", "month_label": "Feb 23", "avg_unit_value_usd": 3.54},
        {"date": "2023-03", "month_label": "Mar 23", "avg_unit_value_usd": 3.76},
        {"date": "2023-04", "month_label": "Apr 23", "avg_unit_value_usd": 3.82},
        {"date": "2023-05", "month_label": "May 23", "avg_unit_value_usd": 3.66},
        {"date": "2023-06", "month_label": "Jun 23", "avg_unit_value_usd": 3.76},
        {"date": "2023-07", "month_label": "Jul 23", "avg_unit_value_usd": 3.73},
        {"date": "2023-08", "month_label": "Aug 23", "avg_unit_value_usd": 3.85},
        {"date": "2023-09", "month_label": "Sep 23", "avg_unit_value_usd": 4.05},
        {"date": "2023-10", "month_label": "Oct 23", "avg_unit_value_usd": 4.19},
        {"date": "2023-11", "month_label": "Nov 23", "avg_unit_value_usd": 4.32},
        {"date": "2023-12", "month_label": "Dec 23", "avg_unit_value_usd": 4.61},
        {"date": "2024-01", "month_label": "Jan 24", "avg_unit_value_usd": 4.74},
        {"date": "2024-02", "month_label": "Feb 24", "avg_unit_value_usd": 5.02},
        {"date": "2024-03", "month_label": "Mar 24", "avg_unit_value_usd": 5.91},
        {"date": "2024-04", "month_label": "Apr 24", "avg_unit_value_usd": 6.20},
        {"date": "2024-05", "month_label": "May 24", "avg_unit_value_usd": 6.38},
        {"date": "2024-06", "month_label": "Jun 24", "avg_unit_value_usd": 6.64},
        {"date": "2024-07", "month_label": "Jul 24", "avg_unit_value_usd": 5.91},
        {"date": "2024-08", "month_label": "Aug 24", "avg_unit_value_usd": 5.74},
        {"date": "2024-09", "month_label": "Sep 24", "avg_unit_value_usd": 5.90},
        {"date": "2024-10", "month_label": "Oct 24", "avg_unit_value_usd": 5.59},
        {"date": "2024-11", "month_label": "Nov 24", "avg_unit_value_usd": 5.24},
        {"date": "2024-12", "month_label": "Dec 24", "avg_unit_value_usd": 4.74},
        {"date": "2025-01", "month_label": "Jan 25", "avg_unit_value_usd": 4.31},
        {"date": "2025-02", "month_label": "Feb 25", "avg_unit_value_usd": 3.88},
        {"date": "2025-03", "month_label": "Mar 25", "avg_unit_value_usd": 3.39},
        {"date": "2025-04", "month_label": "Apr 25", "avg_unit_value_usd": 3.26},
        {"date": "2025-05", "month_label": "May 25", "avg_unit_value_usd": 2.60},
        {"date": "2025-06", "month_label": "Jun 25", "avg_unit_value_usd": 2.43},
        {"date": "2025-07", "month_label": "Jul 25", "avg_unit_value_usd": 2.30},
        {"date": "2025-08", "month_label": "Aug 25", "avg_unit_value_usd": 2.51},
        {"date": "2025-09", "month_label": "Sep 25", "avg_unit_value_usd": 2.36},
        {"date": "2025-10", "month_label": "Oct 25", "avg_unit_value_usd": 2.49},
        {"date": "2025-11", "month_label": "Nov 25", "avg_unit_value_usd": 2.66},
        {"date": "2025-12", "month_label": "Dec 25", "avg_unit_value_usd": 2.83},
        {"date": "2026-01", "month_label": "Jan 26", "avg_unit_value_usd": 3.17},
        {"date": "2026-02", "month_label": "Feb 26", "avg_unit_value_usd": 3.02}
    ]
    predictions = [
        {"date": "2026-03-31", "month_label": "Mar 26", "display_date": "Tuesday, March 31, 2026", "predicted_price": 3.01},
        {"date": "2026-04-30", "month_label": "Apr 26", "display_date": "Thursday, April 30, 2026", "predicted_price": 3.05},
        {"date": "2026-05-31", "month_label": "May 26", "display_date": "Sunday, May 31, 2026", "predicted_price": 3.04}
    ]
    return {
        "model_title": "Monthly Average Price in India & Forecast Trend",
        "unit": "USD / kg",
        "historical": historical_points,
        "predictions": predictions,
        "latest_historical": {"date": "2026-02", "value": 3.02},
        "peak": {"date": "2024-06", "value": 6.64},
        "trough": {"date": "2025-07", "value": 2.30}
    }

@app.get("/api/prices")
def prices(
    start: Optional[str] = None,
    end: Optional[str] = None,
    currency: Optional[str] = "USD",
    limit: int = Query(1000, ge=1, le=10000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    q = select(MarketPrice)
    if currency and currency.upper() != "ALL":
        q = q.where(MarketPrice.currency == currency.upper())
    d_start = parse_date_opt(start)
    d_end = parse_date_opt(end)
    max_price_date = db.scalar(select(func.max(MarketPrice.price_date)))
    if max_price_date and d_start and d_end and d_start > max_price_date:
        days = (d_end - d_start).days
        d_end = max_price_date
        d_start = d_end - timedelta(days=days)

    if d_start: q = q.where(MarketPrice.price_date >= d_start)
    if d_end: q = q.where(MarketPrice.price_date <= d_end)
    
    rows = db.scalars(q.order_by(MarketPrice.price_date.desc()).offset(offset).limit(limit)).all()
    return [
        {
            "id": x.id,
            "date": str(x.price_date),
            "value": x.price_value,
            "currency": x.currency,
            "unit": x.unit,
            "source": x.source_name,
            "grade": x.confidence_grade
        } for x in rows
    ]

@app.get("/api/trade-records")
def trade_records(
    direction: Optional[str] = None,
    partner: Optional[str] = None,
    financial_year: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
    limit: int = Query(5000, ge=1, le=10000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    q = select(TradeRecord)
    if direction:
        q = q.where(TradeRecord.trade_direction == direction.upper().strip())
    if partner:
        q = q.where(TradeRecord.partner_country.ilike(f"%{partner.strip()}%"))
    if financial_year:
        q = q.where(TradeRecord.financial_year == financial_year.strip())
    d_start = parse_date_opt(start)
    d_end = parse_date_opt(end)
    max_trade_date = db.scalar(select(func.max(TradeRecord.trade_date)))
    if max_trade_date and d_start and d_end and d_start > max_trade_date:
        days = (d_end - d_start).days
        d_end = max_trade_date
        d_start = d_end - timedelta(days=days)

    if d_start: q = q.where(TradeRecord.trade_date >= d_start)
    if d_end: q = q.where(TradeRecord.trade_date <= d_end)
    
    rows = db.scalars(q.order_by(TradeRecord.trade_date.desc()).offset(offset).limit(limit)).all()
    return [
        {
            "id": x.id,
            "date": str(x.trade_date),
            "direction": x.trade_direction,
            "financial_year": x.financial_year,
            "quantity_mt": x.quantity_mt,
            "value_usd": x.trade_value_usd,
            "average_price": x.average_price_usd_per_mt,
            "partner": x.partner_country,
            "reporting": x.reporting_country,
            "indian_port": x.indian_port,
            "foreign_port": x.foreign_port,
            "indian_company": x.indian_company,
            "foreign_company": x.foreign_company,
            "bill_no": x.bill_no,
            "product_name": x.product_name,
            "trade_value_inr": x.trade_value_inr,
            "unit_rate_inr": x.unit_rate_inr,
            "hs_code": x.hs_code,
            "source": x.source_name
        } for x in rows
    ]

@app.get("/api/sales-records")
def sales_records(
    start: Optional[str] = None,
    end: Optional[str] = None,
    product_category: Optional[str] = None,
    financial_year: Optional[str] = None,
    limit: int = Query(1500, ge=1, le=10000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    q = select(SalesRecord)
    d_start = parse_date_opt(start)
    d_end = parse_date_opt(end)
    if d_start: q = q.where(SalesRecord.sales_date >= d_start)
    if d_end: q = q.where(SalesRecord.sales_date <= d_end)
    if product_category: q = q.where(SalesRecord.product_category == product_category)
    if financial_year: q = q.where(SalesRecord.financial_year == financial_year)
    
    rows = db.scalars(q.order_by(SalesRecord.sales_date.desc()).offset(offset).limit(limit)).all()
    return [
        {
            "id": x.id,
            "invoice_no": x.invoice_no,
            "date": str(x.sales_date),
            "financial_year": x.financial_year,
            "product": x.product_raw,
            "category": x.product_category,
            "customer": x.customer_name,
            "consignee": x.consignee_name,
            "state_or_zone": x.state_or_zone,
            "location": x.location,
            "po_number": x.po_number,
            "quantity_kg": x.quantity_kg,
            "quantity_mt": x.quantity_mt,
            "basic_rate_per_kg": x.basic_rate_per_kg,
            "net_realization_per_kg": x.net_realization_per_kg,
            "realization": x.realization_inr_per_mt,
            "realization_inr_per_mt": x.realization_inr_per_mt,
            "revenue_inr": x.revenue_inr,
            "gross_amount_inr": x.gross_amount_inr,
            "segment": x.customer_segment,
            "confidential": x.is_confidential,
            "source_file": x.source_file,
        } for x in rows
    ]

@app.get("/api/competitors")
def competitors(db: Session = Depends(get_db)):
    rows = db.scalars(select(Competitor).order_by(Competitor.name)).all()
    return [
        {
            "id": x.id,
            "name": x.name,
            "country": x.country,
            "listed": x.listed_company,
            "ticker": x.stock_ticker,
            "website": x.website
        } for x in rows
    ]

@app.get("/api/competitors/stocks")
def competitor_stocks(
    ticker: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = select(CompetitorStockPrice)
    if ticker:
        q = q.where(CompetitorStockPrice.stock_ticker == ticker.upper().strip())
    d_start = parse_date_opt(start)
    d_end = parse_date_opt(end)
    if d_start: q = q.where(CompetitorStockPrice.price_date >= d_start)
    if d_end: q = q.where(CompetitorStockPrice.price_date <= d_end)
    
    rows = db.scalars(q.order_by(CompetitorStockPrice.price_date.asc())).all()
    return [
        {
            "id": x.id,
            "ticker": x.stock_ticker,
            "date": str(x.price_date),
            "close_price": x.close_price,
            "currency": x.currency,
            "volume": x.volume,
            "source": x.source_name
        } for x in rows
    ]

@app.get("/api/intelligence-items")
def intelligence_items(
    impact: Optional[str] = None,
    reliability: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    q = select(IntelligenceItem)
    if impact: q = q.where(IntelligenceItem.impact_level == impact.upper().strip())
    if reliability: q = q.where(IntelligenceItem.reliability_grade == reliability.upper().strip())
    if type: q = q.where(IntelligenceItem.intelligence_type == type.upper().strip())
    
    rows = db.scalars(q.order_by(IntelligenceItem.event_date.desc()).offset(offset).limit(limit)).all()
    return [
        {
            "id": x.id,
            "title": x.title,
            "summary": x.summary,
            "date": str(x.event_date),
            "type": x.intelligence_type,
            "impact": x.impact_level,
            "reliability": x.reliability_grade,
            "source_url": x.source_url,
            "status": x.review_status
        } for x in rows
    ]

@app.get("/api/ingestion/status")
def ingestion_status(limit: int = 15, db: Session = Depends(get_db)):
    runs = db.scalars(select(IngestionRun).order_by(IngestionRun.started_at.desc()).limit(limit)).all()
    return [
        {
            "id": r.id,
            "pipeline": r.pipeline_name,
            "file": r.file_name,
            "status": r.status,
            "processed": r.rows_processed,
            "loaded": r.rows_loaded,
            "rejected": r.rows_rejected,
            "duplicate": r.rows_duplicate,
            "started_at": r.started_at.isoformat(),
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "warnings": r.warnings
        } for r in runs
    ]

@app.get("/api/documents/search")
def document_search(query: str = Query(..., min_length=2), limit: int = 5):
    qdrant = get_qdrant_store()
    return qdrant.search(query=query, limit=limit)

@app.post("/api/documents/upload")
def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    target = Path("Data/documents")
    target.mkdir(parents=True, exist_ok=True)
    raw = file.file.read()
    checksum = hashlib.sha256(raw).hexdigest()
    
    # Check if duplicate
    existing = db.scalar(select(SourceDocument).where(SourceDocument.checksum == checksum))
    if existing:
        return {"status": "duplicate", "document_id": existing.id, "title": existing.title}
        
    out_path = target / f"{checksum[:12]}_{file.filename}"
    out_path.write_bytes(raw)
    
    res = ingest_single_document(db, out_path, source_type="USER_UPLOAD")
    return {"status": "indexed", "document_id": res.get("document_id"), "chunks": res.get("chunks", 0)}

class ManualEntry(BaseModel):
    title: str
    raw_text: str
    event_date: str
    impact_level: str = "MEDIUM"
    reliability_grade: str = "C"
    submitted_by: str = "Field Contributor"

@app.post("/api/intelligence/manual")
def manual_intelligence(entry: ManualEntry, db: Session = Depends(get_db)):
    p = db.scalar(select(Product).where(Product.product_code == "BR2"))
    if not p:
        p = Product(name="Bromine", chemical_name="Bromine", product_code="BR2")
        db.add(p); db.flush()
        
    ev_dt = parse_date_opt(entry.event_date) or date.today()
    
    item = IntelligenceItem(
        title=entry.title,
        summary=entry.raw_text,
        event_date=ev_dt,
        product_id=p.id,
        intelligence_type="MARKET_EVENT",
        impact_level=entry.impact_level.upper(),
        reliability_grade=entry.reliability_grade.upper(),
        extracted_by="USER",
        review_status="PENDING"
    )
    db.add(item)
    db.flush()
    
    db.add(ManualIntelligenceEntry(
        submitted_by=entry.submitted_by,
        raw_text=entry.raw_text,
        event_date=ev_dt,
        reliability_grade=entry.reliability_grade.upper(),
        linked_intelligence_item_id=item.id
    ))
    db.commit()
    return {"id": item.id, "status": "pending_review"}

@app.post("/api/intelligence/sync-sunsirs")
def sync_sunsirs_intelligence(db: Session = Depends(get_db)):
    """Triggers ingestion of latest SunSirs (生意社) China bromine prices & news."""
    from .cleaning.clean_sunsirs_data import clean_and_ingest_sunsirs
    return clean_and_ingest_sunsirs(db)

class ChatQuery(BaseModel):
    question: str = Field(min_length=3, max_length=2000)

@app.post("/api/chat/query")
def chat_query(payload: ChatQuery, db: Session = Depends(get_db)):
    return hybrid_chat_answer(db, payload.question)

class ReportRequest(BaseModel):
    report_type: str = "weekly"

@app.post("/api/reports/generate")
def report_generation(payload: ReportRequest, db: Session = Depends(get_db)):
    from .retrieval.report_generator import generate_market_report
    return generate_market_report(db, report_type=payload.report_type)

# ==========================================
# Executive Brief APIs
# ==========================================

class GenerateWeeklyRequest(BaseModel):
    product: str = "bromine"
    period_end: Optional[str] = None
    force: bool = True

@app.get("/api/executive-briefs/latest")
def latest_executive_brief(product: str = Query("bromine"), db: Session = Depends(get_db)):
    brief = get_latest_executive_brief(db, product_code="BR2")
    if not brief:
        raise HTTPException(status_code=404, detail="No executive brief found")
    return brief

@app.get("/api/executive-briefs/history")
def executive_brief_history(
    product: str = Query("bromine"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return get_executive_brief_history(db, product_code="BR2", limit=limit)

@app.get("/api/executive-briefs/{brief_id}")
def executive_brief_by_id(brief_id: int, db: Session = Depends(get_db)):
    brief = get_executive_brief_by_id(db, brief_id)
    if not brief:
        raise HTTPException(status_code=404, detail=f"Executive brief #{brief_id} not found")
    return brief

@app.post("/api/executive-briefs/generate-weekly")
def generate_weekly_brief(payload: GenerateWeeklyRequest = GenerateWeeklyRequest(), db: Session = Depends(get_db)):
    p_end = parse_date_opt(payload.period_end)
    brief = run_weekly_intelligence_workflow(db, period_end=p_end, force_regenerate=payload.force)
    return format_brief_response(brief)

@app.get("/api/executive-briefs/{brief_id}/citations")
def executive_brief_citations(brief_id: int, db: Session = Depends(get_db)):
    return get_brief_citations(db, brief_id)

@app.get("/api/executive-briefs/{brief_id}/market-evidence")
def executive_brief_market_evidence(brief_id: int, db: Session = Depends(get_db)):
    evidence = get_brief_market_evidence(db, brief_id)
    if not evidence:
        raise HTTPException(status_code=404, detail=f"Market evidence for brief #{brief_id} not found")
    return evidence

# ==========================================
# Bromine Market News Ingestion & Intelligence APIs
# ==========================================

class TriggerNewsIngestRequest(BaseModel):
    source_type: Optional[str] = None

@app.post("/api/news/ingest/trigger")
def trigger_news_ingestion(
    payload: TriggerNewsIngestRequest = TriggerNewsIngestRequest(),
    db: Session = Depends(get_db)
):
    """Triggers an on-demand ingestion run across configured news and RSS sources."""
    stats = news_pipeline.run_pipeline(run_type="manual_trigger", source_type_filter=payload.source_type)
    return {
        "status": "success",
        "message": f"News ingestion complete. Added {stats.get('new_articles_added', 0)} new relevant items.",
        "stats": stats
    }

@app.get("/api/news/status")
def news_pipeline_status(db: Session = Depends(get_db)):
    """Returns news scheduler state, latest ingestion runs, and overall database counts."""
    scheduler_status = news_scheduler.get_status()

    recent_runs = db.execute(
        select(NewsIngestionRun).order_by(desc(NewsIngestionRun.started_at)).limit(5)
    ).scalars().all()

    total_articles = db.scalar(select(func.count(NewsArticle.id))) or 0
    relevant_articles = db.scalar(select(func.count(NewsArticle.id)).where(NewsArticle.processing_status == "RELEVANT")) or 0
    rejected_articles = db.scalar(select(func.count(NewsArticle.id)).where(NewsArticle.processing_status == "REJECTED")) or 0
    duplicate_articles = db.scalar(select(func.count(NewsArticle.id)).where(NewsArticle.processing_status == "DUPLICATE")) or 0
    total_intel = db.scalar(select(func.count(NewsIntelligence.id))) or 0

    return {
        "scheduler": scheduler_status,
        "database_counts": {
            "total_articles": total_articles,
            "relevant_articles": relevant_articles,
            "rejected_articles": rejected_articles,
            "duplicate_articles": duplicate_articles,
            "total_intelligence_items": total_intel
        },
        "recent_runs": [
            {
                "id": r.id,
                "pipeline_name": r.pipeline_name,
                "status": r.status,
                "started_at": r.started_at.isoformat() if r.started_at else None,
                "completed_at": r.completed_at.isoformat() if r.completed_at else None,
                "articles_fetched": r.articles_fetched,
                "articles_new": r.articles_new,
                "articles_relevant": r.articles_relevant,
                "articles_rejected": r.articles_rejected,
                "error_message": r.error_message
            } for r in recent_runs
        ]
    }

@app.get("/api/news/sources")
def list_news_sources(db: Session = Depends(get_db)):
    """Returns all configured news, RSS, and official sources with health status."""
    sources = db.execute(select(NewsSource).order_by(NewsSource.id)).scalars().all()
    return [
        {
            "id": s.id,
            "source_name": s.source_name,
            "source_type": s.source_type,
            "base_url": s.base_url,
            "feed_url": s.feed_url,
            "publisher_region": s.publisher_region,
            "default_reliability_grade": s.default_reliability_grade,
            "allowed_for_automated_fetch": s.allowed_for_automated_fetch,
            "active": s.active,
            "fetch_frequency_minutes": s.fetch_frequency_minutes,
            "last_fetched_at": s.last_fetched_at.isoformat() if s.last_fetched_at else None,
            "notes": s.notes
        } for s in sources
    ]

@app.get("/api/news/taxonomy")
def get_news_taxonomy():
    """Returns the editable Bromine search keywords, competitors, and event categories."""
    return {
        "product_keywords": news_taxonomy.product_keywords,
        "competitors": news_taxonomy.competitors,
        "geographies": news_taxonomy.geographies,
        "event_categories": news_taxonomy.event_categories,
        "negative_exclusion_keywords": news_taxonomy.negative_exclusion_keywords,
        "relevance_scoring": news_taxonomy.relevance_scoring
    }

@app.get("/api/news/curated-feed")
def curated_news_feed(
    category: Optional[str] = Query(None, description="Event category e.g. PRICE, CAPACITY, SUPPLY, DEMAND, REGULATION, TRADE"),
    geography: Optional[str] = Query(None, description="Event geography e.g. China, India, Europe, United States, Middle East, Global"),
    impact_level: Optional[str] = Query(None, description="Impact level e.g. CRITICAL, HIGH, MEDIUM, LOW"),
    min_relevance: float = Query(0.40, ge=0.0, le=1.0),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Returns curated, deduplicated Bromine news items with structured AI intelligence and corroborating sources."""
    query = (
        select(NewsArticle, NewsIntelligence)
        .outerjoin(NewsIntelligence, NewsArticle.id == NewsIntelligence.news_article_id)
        .where(
            NewsArticle.processing_status == "RELEVANT",
            NewsArticle.duplicate_of_article_id.is_(None),  # Canonical items only
            NewsArticle.relevance_score >= min_relevance
        )
    )

    if category:
        query = query.where(NewsIntelligence.intelligence_type == category.upper())
    if geography:
        query = query.where(NewsIntelligence.event_geography_name == geography)
    if impact_level:
        query = query.where(NewsIntelligence.impact_level == impact_level.upper())

    # Total count query
    total_count = db.scalar(select(func.count()).select_from(query.subquery())) or 0

    # Paginated results ordered by published date
    results = db.execute(
        query.order_by(desc(NewsArticle.published_at)).limit(limit).offset(offset)
    ).all()

    items = []
    for art, intel in results:
        # Get count of duplicate corroborating records linked to this article
        corrob_count = db.scalar(
            select(func.count(NewsArticle.id)).where(NewsArticle.duplicate_of_article_id == art.id)
        ) or 0
        total_sources = corrob_count + 1

        items.append({
            "id": art.id,
            "title": art.title,
            "summary": art.summary_or_snippet,
            "canonical_url": art.canonical_url,
            "publisher": art.publisher_name,
            "publisher_region": art.publisher_region,
            "published_at": art.published_at.isoformat() if art.published_at else None,
            "relevance_score": art.relevance_score,
            "corroboration_count": total_sources,
            "is_multi_source_corroborated": total_sources > 1,
            "intelligence": {
                "id": intel.id if intel else None,
                "category": intel.intelligence_type if intel else "GENERAL_MARKET",
                "geography": intel.event_geography_name if intel else art.publisher_region,
                "impact_level": intel.impact_level if intel else "MEDIUM",
                "reliability_grade": intel.reliability_grade if intel else "B",
                "strategic_implication": intel.short_summary if intel else "",
                "why_it_matters": intel.why_it_matters if intel else ""
            } if intel else None
        })

    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "items": items
    }

