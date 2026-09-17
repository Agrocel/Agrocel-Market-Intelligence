import sys, time
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.database import engine, Base, SessionLocal
from app.cleaning.clean_trade_data import clean_all_trade_data
from app.cleaning.clean_china_price_data import clean_china_prices
from app.cleaning.clean_sales_data import clean_all_sales_data
from app.cleaning.clean_competitor_stock_data import clean_competitor_data
from app.cleaning.clean_news_data import clean_news_and_intelligence
from app.cleaning.clean_sunsirs_data import clean_and_ingest_sunsirs
from app.cleaning.ingest_documents import ingest_all_reports

def run_master_ingestion():
    start_time = time.time()
    print("======================================================================")
    print("      AGROCEL BROMINE MARKET INTELLIGENCE — MASTER INGESTION RUN      ")
    print("======================================================================")
    
    # 1. Ensure tables exist
    Base.metadata.create_all(engine)
    db = SessionLocal()
    
    try:
        # Step 1: Trade Data
        trade_res = clean_all_trade_data(db)
        
        # Step 2: China Price Data
        price_res = clean_china_prices(db)
        
        # Step 3: Agrocel Sales Data
        sales_res = clean_all_sales_data(db)
        
        # Step 4: Competitor Shipments & Stock Data
        comp_res = clean_competitor_data(db)
        
        # Step 5: News & Intelligence Items
        news_res = clean_news_and_intelligence(db)

        # Step 6: SunSirs (生意社) China Bromine Spot & Market News
        sunsirs_res = clean_and_ingest_sunsirs(db)
        
        # Step 7: Richard Reports Document Extraction & Vector Indexing in Qdrant
        doc_res = ingest_all_reports(db)
        
        duration = time.time() - start_time
        print("\n======================================================================")
        print(f"  MASTER INGESTION FINISHED IN {duration:.2f} SECONDS")
        print("======================================================================")
        
    finally:
        db.close()

if __name__ == "__main__":
    run_master_ingestion()
