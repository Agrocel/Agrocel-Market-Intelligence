from datetime import datetime, date
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc

from ..models import (
    MarketPrice, TradeRecord, SalesRecord, Competitor,
    CompetitorStockPrice, IntelligenceItem, SourceDocument
)
from .hybrid_retriever import hybrid_chat_answer, build_citations
from ..vector.qdrant_store import get_qdrant_store

def generate_market_report(db: Session, report_type: str = "weekly") -> Dict[str, Any]:
    rtype = report_type.lower().strip()
    
    # Fetch core market metrics
    prices = db.scalars(select(MarketPrice).order_by(MarketPrice.price_date.desc()).limit(2)).all()
    latest_price = prices[0] if prices else None
    prior_price = prices[1] if len(prices) > 1 else None
    pct_change = 0.0
    if latest_price and prior_price and prior_price.price_value > 0:
        pct_change = round(((latest_price.price_value - prior_price.price_value) / prior_price.price_value) * 100, 1)
        
    export_tot = db.execute(select(func.coalesce(func.sum(TradeRecord.quantity_mt), 0), func.coalesce(func.sum(TradeRecord.trade_value_usd), 0)).where(TradeRecord.trade_direction == 'EXPORT')).one()
    import_tot = db.execute(select(func.coalesce(func.sum(TradeRecord.quantity_mt), 0), func.coalesce(func.sum(TradeRecord.trade_value_usd), 0)).where(TradeRecord.trade_direction == 'IMPORT')).one()
    sales_tot = db.execute(select(func.coalesce(func.sum(SalesRecord.quantity_mt), 0), func.coalesce(func.avg(SalesRecord.realization_inr_per_mt), 0))).one()
    
    # Intelligence items
    intel_items = db.scalars(select(IntelligenceItem).order_by(IntelligenceItem.event_date.desc()).limit(10)).all()
    high_impact = [it for it in intel_items if it.impact_level in ('HIGH', 'CRITICAL')]
    
    # Competitors
    competitors = db.scalars(select(Competitor).limit(5)).all()
    stocks = db.scalars(select(CompetitorStockPrice).order_by(CompetitorStockPrice.price_date.desc()).limit(6)).all()
    
    # Qdrant search for contextual excerpts
    qdrant = get_qdrant_store()
    
    if "weekly" in rtype:
        title = "Weekly Bromine Market Digest"
        qdrant_hits = qdrant.search("bromine weekly market price trend and supply balance", limit=3)
        summary = (
            f"**Executive Summary (Week ending {datetime.now().strftime('%d %B %Y')}):**\n\n"
            f"- **China Price Benchmark**: Spot Bromine stands at **{latest_price.currency if latest_price else 'USD'} {latest_price.price_value:,.0f} / {latest_price.unit if latest_price else 'MT'}** ({pct_change:+.1f}% vs prior observation).\n"
            f"- **Trade Flows**: India exports recorded **{export_tot[0]:,.1f} MT** (USD {export_tot[1]:,.0f}); imports recorded **{import_tot[0]:,.1f} MT** (USD {import_tot[1]:,.0f}).\n"
            f"- **Agrocel Internal Realization**: Maintained average realization of **INR {sales_tot[1]:,.0f}/MT** across {sales_tot[0]:,.1f} MT dispatched.\n"
            f"- **Active Signals**: {len(high_impact)} high-impact intelligence alerts requiring commercial desk monitoring."
        )
    elif "monthly" in rtype:
        title = "Monthly Bromine Market Report"
        qdrant_hits = qdrant.search("monthly bromine derivatives demand and capacity updates", limit=4)
        summary = (
            f"**Monthly Strategic Review ({datetime.now().strftime('%B %Y')}):**\n\n"
            f"1. **Market Price Trajectory**: China bromine domestic quotes reflected continuous seasonal adjustment with environmental supervision remaining strict in Shandong province.\n"
            f"2. **Export Parity & Domestic Realization**: Export realization averaged USD {(export_tot[1]/export_tot[0]):,.1f}/MT compared against Agrocel domestic realization INR {sales_tot[1]:,.0f}/MT.\n"
            f"3. **Competitor Dynamics**: Archean Chemical and Satyesh Brinechem maintained consistent dispatches across domestic clients with targeted export flows into China and Japan."
        )
    elif "competitor" in rtype:
        title = "Competitor Intelligence Update"
        qdrant_hits = qdrant.search("Archean chemical ICL Group bromine competitor shipments", limit=4)
        stock_bullets = [f"- **{s.stock_ticker}**: {s.close_price} {s.currency} ({s.price_date})" for s in stocks[:4]]
        summary = (
            f"**Competitor Market Actions & Stock Summary:**\n\n"
            f"{chr(10).join(stock_bullets)}\n\n"
            f"- **Domestic Co-players**: Archean Chemical continues to lead organized domestic merchant sales and large-volume ISO tank exports to China.\n"
            f"- **International Majors**: ICL Group continues to manage global logistics around the Dead Sea, maintaining derivative delivery commitments."
        )
    elif "risk" in rtype or "opportunity" in rtype:
        title = "Risk and Opportunity Summary"
        qdrant_hits = qdrant.search("bromine market risk environmental audit supply disruption opportunity", limit=4)
        summary = (
            f"**Bromine Commercial Risks & Opportunities Matrix:**\n\n"
            f"**Key Opportunities:**\n"
            f"- Expansion of domestic agrochemical and pharmaceutical intermediate synthesis in India.\n"
            f"- Spot export arbitrage windows into China during severe Shandong environmental curtailments.\n\n"
            f"**Key Risks:**\n"
            f"- Weak off-take in printed circuit board flame retardants (TBBA).\n"
            f"- Potential freight volatility and import tariff scrutiny."
        )
    else:
        title = "Price and Trade Movement Summary"
        qdrant_hits = qdrant.search("bromine import export price movement trade balance", limit=4)
        summary = (
            f"**Price & Trade Balance Overview:**\n\n"
            f"- China benchmark: **{latest_price.price_value:,.0f} USD/MT** (date: {latest_price.price_date}).\n"
            f"- Indian net trade balance: Exports ({export_tot[0]:,.1f} MT) vs Imports ({import_tot[0]:,.1f} MT)."
        )

    citations = build_citations(qdrant_hits)
    
    return {
        "title": title,
        "generated_at": datetime.utcnow().isoformat(),
        "report_type": rtype,
        "summary": summary,
        "sources": citations,
        "metrics": {
            "latest_price": latest_price.price_value if latest_price else 0,
            "price_currency": latest_price.currency if latest_price else "USD",
            "price_change_pct": pct_change,
            "exports_mt": export_tot[0],
            "imports_mt": import_tot[0],
            "sales_mt": sales_tot[0],
            "sales_realization_inr": sales_tot[1]
        }
    }
