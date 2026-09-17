import os, sys, datetime
from pathlib import Path
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..database import SessionLocal
from ..models import SalesRecord, IngestionRun, IngestionError
from .common import (
    BASE_DIR, get_or_create_product, get_or_create_geography
)

RAW_SALES_DIR = BASE_DIR / "Data" / "Raw" / "AGROCEL-Sales"

SALES_FILES = [
    "SALE 2021.xls",
    "SALE 212223.xls",
    "SALE 2324.xls",
    "SALE 242526.xls",
    "SALE 2627.xls",
]

def parse_num(val):
    if val is None or pd.isna(val):
        return None
    s = str(val).replace(',', '').strip()
    try:
        return float(s)
    except ValueError:
        return None

def get_financial_year(d):
    y = d.year
    m = d.month
    if m >= 4:
        return f"{y}-{str(y+1)[-2:]}"
    else:
        return f"{y-1}-{str(y)[-2:]}"

def categorize_product(p_raw):
    p = str(p_raw).strip().upper()
    if p.startswith("BR (T)") or "TANKER" in p:
        return "Liquid Bromine (Tanker)"
    elif p.startswith("BR (P)") or p == "BR (B)" or "PALLET" in p:
        return "Liquid Bromine (Pallets)"
    elif p.startswith("BR"):
        return "Liquid Bromine"
    elif p.startswith("HBR"):
        return "Hydrobromic Acid"
    elif any(term in p for term in ["BCP", "PBR", "POBR", "CABR", "IPBR", "NPBR", "E2BB", "NABR"]):
        return "Bromine Derivative"
    elif "H2SO4" in p:
        return "Industrial Chemical"
    elif any(term in p for term in ["MAHA", "AQUA"]):
        return "Specialty Agro/Water"
    else:
        return "Other"

def clean_sales_file(db: Session, file_path: Path, bromine_prod, india_geo):
    fname = file_path.name
    print(f"\nProcessing {fname}...")
    
    run = IngestionRun(
        pipeline_name="clean_sales_data",
        file_name=fname,
        started_at=datetime.datetime.utcnow(),
        status="RUNNING"
    )
    db.add(run)
    db.commit()
    
    try:
        df = pd.read_excel(file_path, header=1)
    except Exception as e:
        run.status = "FAILED"
        run.error_message = f"Failed to read excel file: {e}"
        run.completed_at = datetime.datetime.utcnow()
        db.commit()
        print(f"  Error reading {fname}: {e}")
        return {"loaded": 0, "duplicates": 0, "rejected": 0, "error": str(e)}

    # Filter out empty buffer rows
    if 'DATE' not in df.columns:
        run.status = "FAILED"
        run.error_message = "DATE column not found in header row"
        run.completed_at = datetime.datetime.utcnow()
        db.commit()
        return {"loaded": 0, "duplicates": 0, "rejected": 0, "error": "No DATE column"}
        
    df = df[df['DATE'].notna()].copy()
    
    # Identify dynamic column names
    inv_col = 'INVOICE' if 'INVOICE' in df.columns else ('INV. NO.' if 'INV. NO.' in df.columns else None)
    prod_col = 'PRODUCT' if 'PRODUCT' in df.columns else ('PROD' if 'PROD' in df.columns else None)
    po_no_col = 'PO NO.' if 'PO NO.' in df.columns else ('PO #' if 'PO #' in df.columns else None)
    po_dt_col = 'PO DATE' if 'PO DATE' in df.columns else ('PO DT' if 'PO DT' in df.columns else None)
    rate_col = 'RATE' if 'RATE' in df.columns else None
    net_rate_col = [c for c in ['NSR', 'NET RATE', 'NET'] if c in df.columns]
    net_rate_col = net_rate_col[0] if net_rate_col else None
    net_amt_col = 'NET AMT.' if 'NET AMT.' in df.columns else None
    gross_amt_col = 'GROSS AMT.' if 'GROSS AMT.' in df.columns else None
    state_col = 'STATE' if 'STATE' in df.columns else None
    zone_col = 'ZONE' if 'ZONE' in df.columns else None
    loc_col = 'LOCATION' if 'LOCATION' in df.columns else None
    
    loaded = 0
    dupes = 0
    rejd = 0
    
    for idx, row in df.iterrows():
        excel_row_num = idx + 2 # Header is at row index 1, data starts at 2
        
        raw_date = row['DATE']
        try:
            dt = pd.to_datetime(raw_date)
            d = dt.date()
        except Exception:
            rejd += 1
            err = IngestionError(
                run_id=run.id,
                source_file=fname,
                row_number=excel_row_num,
                raw_data=str(row.to_dict())[:1000],
                error_type="INVALID_DATE",
                error_details=f"Cannot parse date: {raw_date}"
            )
            db.add(err)
            continue
            
        fy = get_financial_year(d)
        
        # Invoice number
        raw_inv = row[inv_col] if inv_col and pd.notna(row[inv_col]) else None
        inv_no = str(raw_inv).strip() if raw_inv else None
        if inv_no:
            if inv_no.endswith('.0'):
                inv_no = inv_no[:-2]
            if inv_no.lower() in ['nan', 'none', '']:
                inv_no = None
                
        # Buyer / Consignee
        buyer = str(row['BUYER']).strip() if 'BUYER' in row and pd.notna(row['BUYER']) else "Commercial Client"
        consignee = str(row['CONSIGNEE']).strip() if 'CONSIGNEE' in row and pd.notna(row['CONSIGNEE']) else None
        if consignee and consignee.lower() in ['nan', 'none', '']:
            consignee = None
            
        # Geography
        state_zone = None
        if state_col and pd.notna(row[state_col]):
            state_zone = str(row[state_col]).strip()
        elif zone_col and pd.notna(row[zone_col]):
            state_zone = str(row[zone_col]).strip()
            
        location = str(row[loc_col]).strip() if loc_col and pd.notna(row[loc_col]) else None
        if location and location.lower() in ['nan', 'none', '']:
            location = None
            
        # PO Details
        po_no = str(row[po_no_col]).strip() if po_no_col and pd.notna(row[po_no_col]) else None
        if po_no and po_no.lower() in ['nan', 'none', '']:
            po_no = None
            
        po_dt = None
        if po_dt_col and pd.notna(row[po_dt_col]):
            try:
                po_dt = pd.to_datetime(row[po_dt_col], dayfirst=True).date()
            except Exception:
                po_dt = None
                
        # Product & Category
        prod_raw = str(row[prod_col]).strip() if prod_col and pd.notna(row[prod_col]) else "Br (T)"
        cat = categorize_product(prod_raw)
        
        # Quantity
        qty_kg = parse_num(row.get('QTY. (KGS)')) or 0.0
        qty_mt = round(qty_kg / 1000.0, 4)
        
        # Rates & Amounts
        rate = parse_num(row.get(rate_col)) if rate_col else None
        net_rate = parse_num(row.get(net_rate_col)) if net_rate_col else None
        net_amt = parse_num(row.get(net_amt_col)) if net_amt_col else None
        gross_amt = parse_num(row.get(gross_amt_col)) if gross_amt_col else None
        
        # Realization calculation
        if net_rate is not None and net_rate > 0:
            realized_rate_kg = net_rate
        elif rate is not None and rate > 0:
            realized_rate_kg = rate
        elif net_amt and qty_kg > 0:
            realized_rate_kg = round(net_amt / qty_kg, 2)
        else:
            realized_rate_kg = 0.0
            
        realization_mt = round(realized_rate_kg * 1000.0, 2)
        
        if net_amt is not None and net_amt > 0:
            rev = round(net_amt, 2)
        elif realized_rate_kg > 0 and qty_kg > 0:
            rev = round(qty_kg * realized_rate_kg, 2)
        else:
            rev = 0.0
            
        # Customer segment
        if 'Liquid Bromine' in cat:
            segment = 'Bromine Direct'
        elif 'Derivative' in cat:
            segment = 'Specialty Derivative'
        elif 'Hydrobromic Acid' in cat:
            segment = 'HBr Direct'
        else:
            segment = 'Commercial'
            
        # Idempotency check via source file and row index
        existing = db.scalar(
            select(SalesRecord.id).where(
                SalesRecord.source_file == fname,
                SalesRecord.source_row_index == excel_row_num
            )
        )
        if existing:
            dupes += 1
            continue
            
        record = SalesRecord(
            invoice_no=inv_no,
            sales_date=d,
            financial_year=fy,
            customer_name=buyer,
            consignee_name=consignee,
            state_or_zone=state_zone,
            location=location,
            po_number=po_no,
            po_date=po_dt,
            product_raw=prod_raw,
            product_category=cat,
            product_id=bromine_prod.id,
            geography_id=india_geo.id,
            quantity_kg=qty_kg,
            quantity_mt=qty_mt,
            basic_rate_per_kg=rate,
            net_realization_per_kg=realized_rate_kg,
            realization_inr_per_mt=realization_mt,
            revenue_inr=rev,
            gross_amount_inr=gross_amt,
            customer_segment=segment,
            is_confidential=True,
            source_file=fname,
            source_row_index=excel_row_num
        )
        db.add(record)
        loaded += 1
        
        if loaded % 250 == 0:
            db.commit()
            
    db.commit()
    
    run.rows_processed = len(df)
    run.rows_loaded = loaded
    run.rows_rejected = rejd
    run.rows_duplicate = dupes
    run.status = "SUCCESS"
    run.completed_at = datetime.datetime.utcnow()
    db.commit()
    
    print(f"  {fname}: Loaded={loaded}, Duplicates={dupes}, Rejected={rejd}")
    return {"loaded": loaded, "duplicates": dupes, "rejected": rejd}

def clean_all_sales_data(db: Session = None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
        
    print("\n--- Running clean_sales_data Pipeline (Authoritative Multi-Year Source) ---")
    results = {}
    bromine_prod = get_or_create_product(db, name="Bromine", code="BR2")
    india_geo = get_or_create_geography(db, "India")
    
    for fname in SALES_FILES:
        fpath = RAW_SALES_DIR / fname
        if fpath.exists():
            res = clean_sales_file(db, fpath, bromine_prod, india_geo)
            results[fname] = res
        else:
            print(f"  Warning: File not found: {fpath}")
            results[fname] = {"error": "File not found"}
            
    total_loaded = sum(r.get("loaded", 0) for r in results.values())
    print(f"\n--- Ingestion Completed: {total_loaded} total sales records ingested ---")
    
    if close_db:
        db.close()
        
    return results

if __name__ == "__main__":
    clean_all_sales_data()
