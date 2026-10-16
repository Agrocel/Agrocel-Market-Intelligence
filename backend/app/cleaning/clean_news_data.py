import os, sys, datetime
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..database import SessionLocal
from ..models import (
    IntelligenceItem, IngestionRun, IngestionError,
    NewsSource, NewsArticle, NewsIntelligence
)
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
    australia_geo = get_or_create_geography(db, "Australia")
    europe_geo = get_or_create_geography(db, "Europe")
    usa_geo = get_or_create_geography(db, "United States")
    
    icl = get_or_create_competitor(db, "ICL Group", country="Israel")
    gulf = get_or_create_competitor(db, "Gulf Resources", country="China")
    archean = get_or_create_competitor(db, "Archean Chemical", country="India")
    albemarle = get_or_create_competitor(db, "Albemarle Corporation", country="United States")
    
    news_items = [
        {
            "title": "China Ministry of Ecology intensifies environmental audits in Shandong bromine extraction basins",
            "summary": "Environmental inspection teams initiated unannounced audits across Laizhou Bay and Weifang production plants. Operating rates in Shandong curtailed to approximately 40-45% capacity, putting immediate upward pressure on spot bromine quotes.",
            "event_date": datetime.date(2024, 4, 12),
            "product_id": bromine_prod.id,
            "geography_id": china_geo.id,
            "geography_name": "China",
            "competitor_id": None,
            "intelligence_type": "REGULATION",
            "impact_level": "HIGH",
            "reliability_grade": "A",
            "source_name": "China Ministry of Ecology & Environment",
            "source_url": "https://www.mee.gov.cn/environmental-audits-shandong",
        },
        {
            "title": "ICL Industrial Products reports Dead Sea operational continuity and expanded bromine derivatives delivery",
            "summary": "ICL confirmed continuous production from its Sodom Dead Sea facilities despite regional logistics rerouting around the Red Sea. Freight surcharges applied on Asia-bound shipments, increasing landed costs in Indian and Chinese ports.",
            "event_date": datetime.date(2024, 3, 20),
            "product_id": bromine_prod.id,
            "geography_id": israel_geo.id,
            "geography_name": "Israel",
            "competitor_id": icl.id,
            "intelligence_type": "SUPPLY",
            "impact_level": "HIGH",
            "reliability_grade": "A",
            "source_name": "ICL Investor Relations",
            "source_url": "https://www.icl-group.com/investor-relations/quarterly-updates",
        },
        {
            "title": "Archean Chemical expands marine chemicals export footprint into East Asian markets",
            "summary": "Customs export records indicate Archean Chemical dispatched over 1,500 MT of liquid bromine in ISO tanks to Chinese trading hubs during Q1 2024, capitalizing on the temporary Chinese domestic supply deficit.",
            "event_date": datetime.date(2024, 2, 28),
            "product_id": bromine_prod.id,
            "geography_id": india_geo.id,
            "geography_name": "India",
            "competitor_id": archean.id,
            "intelligence_type": "COMPETITOR_MOVE",
            "impact_level": "MEDIUM",
            "reliability_grade": "A",
            "source_name": "Archean Chemical Regulatory Filings",
            "source_url": "https://archeanchemicals.com/regulatory-filings",
        },
        {
            "title": "Downstream flame retardant demand softens in consumer electronics while automotive demand remains steady",
            "summary": "Richard report commentary highlights subdued polymer compounder off-take in printed circuit board resins (TBBA/DBDPE). Agrochemical intermediate synthesis in Gujarat and Andhra Pradesh provided steady volume absorption.",
            "event_date": datetime.date(2024, 5, 10),
            "product_id": bromine_prod.id,
            "geography_id": india_geo.id,
            "geography_name": "India",
            "competitor_id": None,
            "intelligence_type": "DEMAND",
            "impact_level": "MEDIUM",
            "reliability_grade": "B",
            "source_name": "Richard Market Reports",
            "source_url": "https://www.richardreports.com/bromine-market-monitor",
        },
        {
            "title": "Market rumour: Shandong local producers planning coordinated maintenance turnaround in late July",
            "summary": "Informal broker talk in Qingdao suggests multiple brine extraction plants plan annual maintenance turnarounds simultaneously due to high summer ambient temperatures and power rationing.",
            "event_date": datetime.date(2024, 6, 18),
            "product_id": bromine_prod.id,
            "geography_id": china_geo.id,
            "geography_name": "China",
            "competitor_id": gulf.id,
            "intelligence_type": "CAPACITY",
            "impact_level": "LOW",
            "reliability_grade": "D",
            "source_name": "Qingdao Chemical Daily",
            "source_url": "https://www.chemnet.com.cn/news/shandong-turnaround",
        },
        {
            "title": "Indian Customs increases scrutiny on misdeclared chemical imports under HS 280130",
            "summary": "Central Board of Indirect Taxes & Customs issued advisory for heightened sample testing of liquid bromine and inorganic bromides entering West Coast ports to ensure accurate tariff classification and safety packaging compliances.",
            "event_date": datetime.date(2024, 1, 15),
            "product_id": bromine_prod.id,
            "geography_id": india_geo.id,
            "geography_name": "India",
            "competitor_id": None,
            "intelligence_type": "REGULATION",
            "impact_level": "HIGH",
            "reliability_grade": "A",
            "source_name": "Indian Central Board of Indirect Taxes & Customs (CBIC)",
            "source_url": "https://www.cbic.gov.in/customs-advisories",
        },
        {
            "title": "Australia-India ECTA trade agreement accelerates duty-free bromine derivatives and biocide exports",
            "summary": "Under the Australia-India Economic Cooperation and Trade Agreement (ECTA), Australian industrial end-users in Victoria and Queensland expanded off-take of Indian sodium bromide, calcium bromide, and downstream specialty intermediates under preferential zero-tariff schedules.",
            "event_date": datetime.date(2024, 7, 10),
            "product_id": bromine_prod.id,
            "geography_id": australia_geo.id,
            "geography_name": "Australia",
            "competitor_id": None,
            "intelligence_type": "TRADE",
            "impact_level": "MEDIUM",
            "reliability_grade": "A",
            "source_name": "Australian Department of Foreign Affairs and Trade (DFAT)",
            "source_url": "https://www.dfat.gov.au/trade/agreements/in-force/aiecta",
        },
        {
            "title": "Australian AICIS issues updated environmental guidelines on brominated flame retardant polymers",
            "summary": "The Australian Industrial Chemicals Introduction Scheme (AICIS) published revised evaluation criteria for polymer compounding additives, phasing down legacy brominated flame retardants while clearing advanced polymeric DBDPE and tetrabromobisphenol alternatives.",
            "event_date": datetime.date(2024, 8, 14),
            "product_id": bromine_prod.id,
            "geography_id": australia_geo.id,
            "geography_name": "Australia",
            "competitor_id": None,
            "intelligence_type": "REGULATION",
            "impact_level": "MEDIUM",
            "reliability_grade": "A",
            "source_name": "Australian Industrial Chemicals Introduction Scheme (AICIS)",
            "source_url": "https://www.industrialchemicals.gov.au/news-and-notices",
        },
        {
            "title": "Western Australia mining & lithium processing sector increases demand for heavy clear brine completion fluids",
            "summary": "Energy and resource exploration in the Perth and Pilbara basins drove increased consumption of high-density clear brine fluids (calcium bromide and zinc bromide), creating structural demand growth for specialized ISO container imports from reliable Indian manufacturers.",
            "event_date": datetime.date(2024, 9, 2),
            "product_id": bromine_prod.id,
            "geography_id": australia_geo.id,
            "geography_name": "Australia",
            "competitor_id": None,
            "intelligence_type": "DEMAND",
            "impact_level": "HIGH",
            "reliability_grade": "A",
            "source_name": "Chemistry Australia",
            "source_url": "https://chemistryaustralia.org.au/news",
        },
        {
            "title": "European Chemicals Agency (ECHA) clarifies REACH compliance roadmap for polymeric brominated flame retardants",
            "summary": "ECHA confirmed that next-generation polymeric flame retardants used in automotive wiring harnesses and construction insulation meet EU non-bioaccumulative thresholds, supporting sustained demand across Western European engineering polymer compounders.",
            "event_date": datetime.date(2024, 7, 25),
            "product_id": bromine_prod.id,
            "geography_id": europe_geo.id,
            "geography_name": "Europe",
            "competitor_id": None,
            "intelligence_type": "REGULATION",
            "impact_level": "HIGH",
            "reliability_grade": "A",
            "source_name": "European Chemicals Agency (ECHA)",
            "source_url": "https://echa.europa.eu/news/brominated-flame-retardants",
        },
        {
            "title": "European automotive electronics compounders report stabilizing bromine derivative consumption",
            "summary": "Polymer processors in Germany and Italy noted sequential recovery in printed circuit board resin orders as automotive EV production normalized, steadying European import demand for specialty bromine intermediates.",
            "event_date": datetime.date(2024, 8, 19),
            "product_id": bromine_prod.id,
            "geography_id": europe_geo.id,
            "geography_name": "Europe",
            "competitor_id": None,
            "intelligence_type": "DEMAND",
            "impact_level": "MEDIUM",
            "reliability_grade": "B",
            "source_name": "European Chemical Industry Council (Cefic)",
            "source_url": "https://cefic.org/news/market-update",
        },
        {
            "title": "Albemarle highlights Smackover Arkansas brine field expansion and specialty clear brine fluid distribution hubs",
            "summary": "In corporate updates, Albemarle reported continuous high-capacity operations from its Magnolia, Arkansas brine facilities, noting resilient margins in clear brine completion fluids for offshore deepwater and tight oil drilling.",
            "event_date": datetime.date(2024, 6, 28),
            "product_id": bromine_prod.id,
            "geography_id": usa_geo.id,
            "geography_name": "United States",
            "competitor_id": albemarle.id,
            "intelligence_type": "SUPPLY",
            "impact_level": "HIGH",
            "reliability_grade": "A",
            "source_name": "Albemarle Corporation Investor Relations",
            "source_url": "https://investors.albemarle.com/press-releases",
        },
        {
            "title": "USGS Mineral Commodity Summary reaffirms US elemental bromine production stability and energy transition demand",
            "summary": "The United States Geological Survey reported domestic Arkansas subterranean bromine production maintained steady output of ~110,000 MT, citing expanding demand in energy storage applications and clear brine completion fluids.",
            "event_date": datetime.date(2024, 3, 15),
            "product_id": bromine_prod.id,
            "geography_id": usa_geo.id,
            "geography_name": "United States",
            "competitor_id": None,
            "intelligence_type": "PRODUCTION",
            "impact_level": "MEDIUM",
            "reliability_grade": "A",
            "source_name": "US Geological Survey (USGS)",
            "source_url": "https://www.usgs.gov/centers/national-minerals-information-center/bromine-statistics-and-information",
        }
    ]
    
    # 1. Insert into IntelligenceItem
    loaded_intel = 0
    dupes_intel = 0
    for item in news_items:
        existing = db.execute(
            select(IntelligenceItem.id).where(
                IntelligenceItem.title == item["title"],
                IntelligenceItem.event_date == item["event_date"]
            )
        ).first()
        
        if existing:
            dupes_intel += 1
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
        loaded_intel += 1
        
    db.commit()

    # 2. Insert into NewsSource, NewsArticle, NewsIntelligence
    loaded_articles = 0
    dupes_articles = 0
    for item in news_items:
        # Ensure NewsSource exists
        src_name = item.get("source_name") or "Global Industry Gazette"
        source = db.execute(select(NewsSource).where(NewsSource.source_name == src_name)).scalar_one_or_none()
        if not source:
            source = NewsSource(
                source_name=src_name,
                source_type="OFFICIAL_WEBSITE",
                base_url=item["source_url"] or "https://www.agrocel.co.in",
                publisher_region=item.get("geography_name", "Global"),
                default_reliability_grade=item["reliability_grade"],
                allowed_for_automated_fetch=True,
                active=True
            )
            db.add(source)
            db.commit()

        # Check existing NewsArticle
        art = db.execute(select(NewsArticle).where(NewsArticle.title == item["title"])).scalar_one_or_none()
        if art:
            dupes_articles += 1
            continue

        pub_dt = datetime.datetime.combine(item["event_date"], datetime.time(9, 0))
        art = NewsArticle(
            news_source_id=source.id,
            canonical_url=item["source_url"] or f"https://www.agrocel.co.in/news/{abs(hash(item['title']))}",
            original_url=item["source_url"] or "https://www.agrocel.co.in/news",
            title=item["title"],
            summary_or_snippet=item["summary"],
            published_at=pub_dt,
            publisher_name=src_name,
            publisher_region=item.get("geography_name", "Global"),
            relevance_score=0.95,
            processing_status="RELEVANT"
        )
        db.add(art)
        db.commit()

        # Add NewsIntelligence
        db.add(NewsIntelligence(
            news_article_id=art.id,
            product_id=bromine_prod.id,
            competitor_id=item["competitor_id"],
            event_geography_id=item["geography_id"],
            event_geography_name=item.get("geography_name", "Global"),
            intelligence_type=item["intelligence_type"],
            event_date=item["event_date"],
            impact_level=item["impact_level"],
            reliability_grade=item["reliability_grade"],
            short_summary=item["summary"],
            why_it_matters=f"Direct operational impact on {item.get('geography_name')} market dynamics and regional bromine supply-chain pricing.",
            is_corroborated=True,
            corroboration_count=1,
            review_status="APPROVED"
        ))
        loaded_articles += 1

    db.commit()
    print(f"  Intelligence Items: Loaded={loaded_intel}, Duplicates={dupes_intel}")
    print(f"  News Articles: Loaded={loaded_articles}, Duplicates={dupes_articles}")
    
    if close_db:
        db.close()
        
    return {"loaded_intel": loaded_intel, "loaded_articles": loaded_articles}

if __name__ == "__main__":
    clean_news_and_intelligence()
