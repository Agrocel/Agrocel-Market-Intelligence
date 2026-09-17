import os, sys, openpyxl, datetime
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..database import SessionLocal
from ..models import MarketPrice, IngestionRun, IngestionError
from .common import (
    BASE_DIR, parse_flexible_date, log_rejected_row,
    get_or_create_product, get_or_create_geography
)

RAW_CHINA_DIR = BASE_DIR / "Data" / "Raw" / "CHINA-PRICE"
RAW_RICHARD_DIR = BASE_DIR / "Data" / "Raw" / "RICHARD REPORT"

def clean_china_prices(db: Session = None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
        
    print("\n--- Running clean_china_price_data Pipeline ---")
    results = {}
    
    bromine_prod = get_or_create_product(db, name="Bromine", code="BR2")
    china_geo = get_or_create_geography(db, "China")
    
    # 1. China Price Data.xlsx
    file_path = RAW_CHINA_DIR / "China Price Data.xlsx"
    if file_path.exists():
        run = IngestionRun(
            pipeline_name="clean_china_price_data",
            file_name=file_path.name,
            started_at=datetime.datetime.utcnow(),
            status="RUNNING"
        )
        db.add(run)
        db.commit()
        
        wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
        ws = wb.active
        rows = []
        for r in ws.iter_rows(values_only=True):
            if any(c is not None and str(c).strip() != '' for c in r):
                rows.append(r)
        wb.close()
        
        # Headers: ['Commodity', 'Sectors', 'Price', 'Date', 'Price INR', 'Price RMB (KG)', 'Price  INR (Kg)', 'Month_Year', 'Price USD (Kg)', 'INR Rate']
        # Note: if row 0 has strings or numbers
        # Check if row 0 has a datetime at column index 3 (data without header)
        if len(rows) > 0 and (isinstance(rows[0][3], (datetime.date, datetime.datetime)) or (len(rows[0]) > 8 and isinstance(rows[0][8], (int, float)))):
            idx_date = 3
            idx_usd_kg = 8
            idx_general_price = 2
            data_start_idx = 0
        else:
            header_idx = 0
            for idx in range(min(3, len(rows))):
                cells = [str(x).lower().strip() for x in rows[idx] if x is not None]
                if any('price' in s or 'date' in s or 'commodity' in s for s in cells):
                    header_idx = idx
                    break
                    
            headers = [str(c).lower().strip() if c is not None else f"col_{i}" for i, c in enumerate(rows[header_idx])]
            
            def get_col(candidates):
                for c in candidates:
                    for idx, h in enumerate(headers):
                        if c.lower() == h or c.lower() in h:
                            return idx
                return None
                
            idx_date = get_col(["date"])
            idx_usd_kg = get_col(["price usd (kg)", "usd (kg)"])
            idx_rmb_kg = get_col(["price rmb (kg)", "rmb (kg)"])
            idx_general_price = get_col(["price"])
            data_start_idx = header_idx + 1
        
        loaded = 0
        rejected = 0
        duplicates = 0
        total_processed = 0
        
        for row_i, r in enumerate(rows[data_start_idx:], start=data_start_idx + 1):
            total_processed += 1
            raw_date = r[idx_date] if idx_date is not None and idx_date < len(r) else None
            d = parse_flexible_date(raw_date)
            if not d:
                rejected += 1
                log_rejected_row("clean_china_price_data", row_i, r, f"Unparseable date: {raw_date}")
                continue
                
            raw_usd_kg = r[idx_usd_kg] if idx_usd_kg is not None and idx_usd_kg < len(r) else None
            price_usd_mt = None
            if raw_usd_kg is not None:
                try:
                    price_usd_mt = float(str(raw_usd_kg).replace(',', '').strip()) * 1000.0
                except ValueError:
                    price_usd_mt = None
                    
            if price_usd_mt is None or price_usd_mt <= 0:
                raw_gen = r[idx_general_price] if idx_general_price is not None and idx_general_price < len(r) else None
                try:
                    p_val = float(str(raw_gen).replace(',', '').strip())
                    if p_val > 500: # Already USD/MT
                        price_usd_mt = p_val
                    elif p_val > 0: # USD/KG
                        price_usd_mt = p_val * 1000.0
                except (ValueError, TypeError):
                    price_usd_mt = None
                    
            if price_usd_mt is None or price_usd_mt <= 0:
                rejected += 1
                log_rejected_row("clean_china_price_data", row_i, r, f"Invalid price value: {raw_usd_kg}")
                continue
                
            # Idempotency check
            existing = db.execute(
                select(MarketPrice.id).where(
                    MarketPrice.product_id == bromine_prod.id,
                    MarketPrice.geography_id == china_geo.id,
                    MarketPrice.price_date == d,
                    MarketPrice.source_name == file_path.name
                )
            ).first()
            
            if existing:
                duplicates += 1
                continue
                
            item = MarketPrice(
                product_id=bromine_prod.id,
                geography_id=china_geo.id,
                price_date=d,
                price_value=round(price_usd_mt, 2),
                currency="USD",
                unit="MT",
                source_name=file_path.name,
                source_url=None,
                confidence_grade="B"
            )
            db.add(item)
            loaded += 1
            if loaded % 100 == 0:
                db.commit()
                
        db.commit()
        run.rows_processed = total_processed
        run.rows_loaded = loaded
        run.rows_rejected = rejected
        run.rows_duplicate = duplicates
        run.status = "SUCCESS"
        run.completed_at = datetime.datetime.utcnow()
        db.commit()
        
        print(f"  {file_path.name}: Loaded={loaded}, Duplicates={duplicates}, Rejected={rejected}")
        results[file_path.name] = {"loaded": loaded, "duplicates": duplicates, "rejected": rejected}
        
    # 2. bromine import data-202401-202503.xlsx
    richard_impex = RAW_RICHARD_DIR / "bromine import data-202401-202503.xlsx"
    if richard_impex.exists():
        run2 = IngestionRun(
            pipeline_name="clean_china_price_data",
            file_name=richard_impex.name,
            started_at=datetime.datetime.utcnow(),
            status="RUNNING"
        )
        db.add(run2)
        db.commit()
        
        wb = openpyxl.load_workbook(richard_impex, read_only=True, data_only=True)
        ws = wb.active
        rows = [r for r in ws.iter_rows(values_only=True) if any(c is not None for c in r)]
        wb.close()
        
        # Row 1 has headers: ['Time', 'Quantity(mt)', 'Compared to last month', 'Amount (USD)', 'Average Price', ...]
        loaded2 = 0
        dupes2 = 0
        rejd2 = 0
        
        for row_i, r in enumerate(rows[2:], start=3):
            time_val = r[0]
            d = parse_flexible_date(time_val)
            if not d:
                rejd2 += 1
                continue
            avg_price = None
            try:
                avg_price = float(str(r[4]).replace(',', '').strip())
            except (ValueError, TypeError):
                avg_price = None
                
            if avg_price and avg_price > 0:
                existing = db.execute(
                    select(MarketPrice.id).where(
                        MarketPrice.product_id == bromine_prod.id,
                        MarketPrice.geography_id == china_geo.id,
                        MarketPrice.price_date == d,
                        MarketPrice.source_name == richard_impex.name
                    )
                ).first()
                if existing:
                    dupes2 += 1
                    continue
                db.add(MarketPrice(
                    product_id=bromine_prod.id,
                    geography_id=china_geo.id,
                    price_date=d,
                    price_value=round(avg_price, 2),
                    currency="USD",
                    unit="MT",
                    source_name=richard_impex.name,
                    source_url=None,
                    confidence_grade="B"
                ))
                loaded2 += 1
                
        db.commit()
        run2.rows_processed = len(rows) - 2
        run2.rows_loaded = loaded2
        run2.rows_rejected = rejd2
        run2.rows_duplicate = dupes2
        run2.status = "SUCCESS"
        run2.completed_at = datetime.datetime.utcnow()
        db.commit()
        
        print(f"  {richard_impex.name}: Loaded={loaded2}, Duplicates={dupes2}, Rejected={rejd2}")
        results[richard_impex.name] = {"loaded": loaded2, "duplicates": dupes2, "rejected": rejd2}
        
    if close_db:
        db.close()
        
    return results

if __name__ == "__main__":
    clean_china_prices()
