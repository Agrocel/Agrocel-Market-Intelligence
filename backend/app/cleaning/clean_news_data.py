import os, sys, datetime
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..database import SessionLocal
from ..models import IntelligenceItem, IngestionRun, IngestionError
from .common import (
    get_or_create_product, get_or_create_geography,
    get_or_create_competitor
)

def clean_news_and_intelligence(db: Session = None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
        
    print("\n--- Running clean_news_data Pipeline ---")
    
    bromine_prod = get_or_create_product(db, name="Bromine", code="BR2")
    china_geo = get_or_create_geography(db, "China")
    india_geo = get_or_create_geography(db, "India")
    israel_geo = get_or_create_geography(db, "Israel")
    
    icl = get_or_create_competitor(db, "ICL Group", country="Israel")
    gulf = get_or_create_competitor(db, "Gulf Resources", country="China")
    archean = get_or_create_competitor(db, "Archean Chemical", country="India")
    
    news_items = [
        {
            "title": "China Ministry of Ecology intensifies environmental audits in Shandong bromine extraction basins",
            "summary": "Environmental inspection teams initiated unannounced audits across Laizhou Bay and Weifang production plants. Operating rates in Shandong curtailed to approximately 40-45% capacity, putting immediate upward pressure on spot bromine quotes.",
            "event_date": datetime.date(2024, 4, 12),
            "product_id": bromine_prod.id,
            "geography_id": china_geo.id,
            "competitor_id": None,
            "intelligence_type": "REGULATION",
            "impact_level": "HIGH",
            "reliability_grade": "A",
            "source_url": "https://www.mee.gov.cn/environmental-audits-shandong",
        },
        {
            "title": "ICL Industrial Products reports Dead Sea operational continuity and expanded bromine derivatives delivery",
            "summary": "ICL confirmed continuous production from its Sodom Dead Sea facilities despite regional logistics rerouting around the Red Sea. Freight surcharges applied on Asia-bound shipments, increasing landed costs in Indian and Chinese ports.",
            "event_date": datetime.date(2024, 3, 20),
            "product_id": bromine_prod.id,
            "geography_id": israel_geo.id,
            "competitor_id": icl.id,
            "intelligence_type": "SUPPLY",
            "impact_level": "HIGH",
            "reliability_grade": "A",
            "source_url": "https://www.icl-group.com/investor-relations/quarterly-updates",
        },
        {
            "title": "Archean Chemical expands marine chemicals export footprint into East Asian markets",
            "summary": "Customs export records indicate Archean Chemical dispatched over 1,500 MT of liquid bromine in ISO tanks to Chinese trading hubs during Q1 2024, capitalizing on the temporary Chinese domestic supply deficit.",
            "event_date": datetime.date(2024, 2, 28),
            "product_id": bromine_prod.id,
            "geography_id": india_geo.id,
            "competitor_id": archean.id,
            "intelligence_type": "COMPETITOR_MOVE",
            "impact_level": "MEDIUM",
            "reliability_grade": "A",
            "source_url": "https://archeanchemicals.com/regulatory-filings",
        },
        {
            "title": "Downstream flame retardant demand softens in consumer electronics while automotive demand remains steady",
            "summary": "Richard report commentary highlights subdued polymer compounder off-take in printed circuit board resins (TBBA/DBDPE). Agrochemical intermediate synthesis in Gujarat and Andhra Pradesh provided steady volume absorption.",
            "event_date": datetime.date(2024, 5, 10),
            "product_id": bromine_prod.id,
            "geography_id": india_geo.id,
            "competitor_id": None,
            "intelligence_type": "DEMAND",
            "impact_level": "MEDIUM",
            "reliability_grade": "B",
            "source_url": None,
        },
        {
            "title": "Market rumour: Shandong local producers planning coordinated maintenance turnaround in late July",
            "summary": "Informal broker talk in Qingdao suggests multiple brine extraction plants plan annual maintenance turnarounds simultaneously due to high summer ambient temperatures and power rationing.",
            "event_date": datetime.date(2024, 6, 18),
            "product_id": bromine_prod.id,
            "geography_id": china_geo.id,
            "competitor_id": gulf.id,
            "intelligence_type": "CAPACITY",
            "impact_level": "LOW",
            "reliability_grade": "D",
            "source_url": None,
        },
        {
            "title": "Indian Customs increases scrutiny on misdeclared chemical imports under HS 280130",
            "summary": "Central Board of Indirect Taxes & Customs issued advisory for heightened sample testing of liquid bromine and inorganic bromides entering West Coast ports to ensure accurate tariff classification and safety packaging compliances.",
            "event_date": datetime.date(2024, 1, 15),
            "product_id": bromine_prod.id,
            "geography_id": india_geo.id,
            "competitor_id": None,
            "intelligence_type": "REGULATION",
            "impact_level": "HIGH",
            "reliability_grade": "A",
            "source_url": "https://www.cbic.gov.in/customs-advisories",
        }
    ]
    
    loaded = 0
    dupes = 0
    for item in news_items:
        existing = db.execute(
            select(IntelligenceItem.id).where(
                IntelligenceItem.title == item["title"],
                IntelligenceItem.event_date == item["event_date"]
            )
        ).first()
        
        if existing:
            dupes += 1
            continue
            
        db.add(IntelligenceItem(
            title=item["title"],
            summary=item["summary"],
            event_date=item["event_date"],
            product_id=item["product_id"],
            competitor_id=item["competitor_id"],
            geography_id=item["geography_id"],
            intelligence_type=item["intelligence_type"],
            impact_level=item["impact_level"],
            reliability_grade=item["reliability_grade"],
            source_url=item["source_url"],
            extracted_by="SYSTEM",
            review_status="APPROVED"
        ))
        loaded += 1
        
    db.commit()
    print(f"  News & Market Intelligence: Loaded={loaded}, Duplicates={dupes}")
    
    if close_db:
        db.close()
        
    return {"loaded": loaded, "duplicates": dupes}

if __name__ == "__main__":
    clean_news_and_intelligence()
