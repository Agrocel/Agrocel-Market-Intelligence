import os, sys, datetime
from pathlib import Path
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..database import SessionLocal
from ..models import TradeRecord, IngestionRun, IngestionError
from .common import (
    BASE_DIR, get_or_create_product
)

RAW_TRADE_DIR = BASE_DIR / "Data" / "Raw" / "BR-IMP-EXP"

EXPORT_FILE = RAW_TRADE_DIR / "Bromine Export 2018 - Feb 2026.xlsx"
IMPORT_FILE = RAW_TRADE_DIR / "Bromine Import 2018 - Feb 2026.xlsx"

# Comprehensive City / Port / Variant to Canonical Sovereign Country Mapping
CITY_PORT_TO_COUNTRY = {
    # China
    'china': 'China',
    'china ': 'China',
    'qingdao': 'China',
    'qingtao': 'China',
    'ningbo': 'China',
    'cntao': 'China',
    'qingdao pt': 'China',
    'qingdao liuting apt': 'China',
    'shanghai': 'China',
    'tianjin': 'China',
    'dalian': 'China',
    'huangpu': 'China',
    
    # Russia
    'russia': 'Russia',
    'russian federation': 'Russia',
    'vladivostok': 'Russia',
    'novorossiysk': 'Russia',
    'st petersburg': 'Russia',
    'saint petersburg': 'Russia',
    'moscow': 'Russia',
    
    # Germany
    'germany': 'Germany',
    'hamburg': 'Germany',
    'bremen': 'Germany',
    'frankfurt': 'Germany',
    
    # Poland
    'poland': 'Poland',
    'gdansk': 'Poland',
    'gdynia': 'Poland',
    'warsaw': 'Poland',
    
    # United Kingdom
    'united kingdom': 'United Kingdom',
    'uk': 'United Kingdom',
    'felixstowe': 'United Kingdom',
    'southampton': 'United Kingdom',
    'london': 'United Kingdom',
    
    # Japan
    'japan': 'Japan',
    'kobe': 'Japan',
    'tokyo': 'Japan',
    'yokohama': 'Japan',
    'osaka': 'Japan',
    'nagoya': 'Japan',
    
    # Mexico
    'mexico': 'Mexico',
    'altamira': 'Mexico',
    'manzanillo': 'Mexico',
    'veracruz': 'Mexico',
    
    # Argentina
    'argentina': 'Argentina',
    'buenos aires': 'Argentina',
    
    # Ukraine
    'ukraine': 'Ukraine',
    'odessa': 'Ukraine',
    
    # Vietnam
    'vietnam': 'Vietnam',
    'vietnam, democratic rep. of': 'Vietnam',
    'ho chi minh city': 'Vietnam',
    'haiphong': 'Vietnam',
    
    # United Arab Emirates
    'united arab emirates': 'United Arab Emirates',
    'jebel ali': 'United Arab Emirates',
    'dubai': 'United Arab Emirates',
    'sharjah': 'United Arab Emirates',
    'abu dhabi': 'United Arab Emirates',
    
    # Taiwan
    'taiwan': 'Taiwan',
    'kaohsiung': 'Taiwan',
    'taipei': 'Taiwan',
    'keelung': 'Taiwan',
    
    # Jordan
    'jordan': 'Jordan',
    'aqaba': 'Jordan',
    'aqaba (el akaba)': 'Jordan',
    'aqaba free zone': 'Jordan',
    'aqaba el akaba': 'Jordan',
    'aboa': 'Jordan',
    
    # Israel
    'israel': 'Israel',
    'haifa': 'Israel',
    'ashdod': 'Israel',
    'tel aviv': 'Israel',
    
    # Belgium
    'belgium': 'Belgium',
    'antwerp': 'Belgium',
    'zeebrugge': 'Belgium',
    'brussels': 'Belgium',
    
    # South Korea
    'south korea': 'South Korea',
    'korea': 'South Korea',
    'busan': 'South Korea',
    'incheon': 'South Korea',
    'ulsan': 'South Korea',
    
    # United States
    'united states': 'United States',
    'united states of america': 'United States',
    'usa': 'United States',
    'houston': 'United States',
    'houston, tx': 'United States',
    'new orleans': 'United States',
    'savannah': 'United States',
    'norfolk': 'United States',
    
    # Saudi Arabia
    'saudi arabia': 'Saudi Arabia',
    'dammam': 'Saudi Arabia',
    'jeddah': 'Saudi Arabia',
    
    # Singapore
    'singapore': 'Singapore',
    
    # Netherlands
    'netherlands': 'Netherlands',
    'rotterdam': 'Netherlands',
    
    # Italy
    'italy': 'Italy',
    'genoa': 'Italy',
    
    # Hungary
    'hungary': 'Hungary',
    'budapest': 'Hungary',
    
    # Brazil
    'brazil': 'Brazil',
    'santos': 'Brazil',
    
    # Canada
    'canada': 'Canada',
    'vancouver': 'Canada',
    'montreal': 'Canada',
    
    # Cambodia
    'cambodia': 'Cambodia',
    'sihanoukville': 'Cambodia',
    
    # Bahrain
    'bahrain': 'Bahrain',
    
    # Nepal
    'nepal': 'Nepal',
    
    # Congo
    'congo': 'Congo',
    
    # Lithuania
    'lithuania': 'Lithuania',
    'klaipeda': 'Lithuania',
    
    # Romania
    'romania': 'Romania',
    'constanta': 'Romania',
}

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

def resolve_country(raw_country, raw_port=None, raw_supp=None):
    if raw_country and pd.notna(raw_country):
        c = str(raw_country).strip().lower()
        if c in CITY_PORT_TO_COUNTRY:
            return CITY_PORT_TO_COUNTRY[c]
        for k, v in CITY_PORT_TO_COUNTRY.items():
            if k == c or k in c.split(','):
                return v
                
    if raw_port and pd.notna(raw_port):
        p = str(raw_port).strip().lower()
        if p in CITY_PORT_TO_COUNTRY:
            return CITY_PORT_TO_COUNTRY[p]
        for k, v in CITY_PORT_TO_COUNTRY.items():
            if k in p:
                return v
                
    if raw_supp and pd.notna(raw_supp):
        s = str(raw_supp).strip().lower()
        if 'dead sea' in s or 'israel' in s or 'icl' in s:
            return 'Israel'
        elif 'jordan' in s or 'albemarle' in s:
            return 'Jordan'
        elif any(term in s for term in ['lanxess', 'us inc', 'usa', 'united states']):
            return 'United States'
        elif any(term in s for term in ['unibrom', 'tianyi', 'shanghai', 'shandong', 'openchem']):
            return 'China'
            
    return "World"

def clean_export_sheet(db: Session, file_path: Path, sheet_name: str, bromine_prod) -> dict:
    fname = file_path.name
    print(f"  [EXPORT] Processing sheet '{sheet_name}'...")
    
    run = IngestionRun(
        pipeline_name="clean_trade_data",
        file_name=f"{fname}::{sheet_name}",
        started_at=datetime.datetime.now(datetime.timezone.utc),
        status="RUNNING"
    )
    db.add(run)
    db.commit()
    
    try:
        df = pd.read_excel(file_path, sheet_name=sheet_name)
    except Exception as e:
        run.status = "FAILED"
        run.error_message = f"Error reading sheet: {e}"
        run.completed_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        return {"loaded": 0, "duplicates": 0, "rejected": 0, "error": str(e)}

    # Filter out empty buffer/summary rows
    date_cols = [c for c in df.columns if 'date' in c.lower()]
    if not date_cols:
        run.status = "FAILED"
        run.error_message = "Date column not found"
        run.completed_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        return {"loaded": 0, "duplicates": 0, "rejected": 0}
        
    dcol = date_cols[0]
    df = df[df[dcol].notna()].copy()
    
    loaded = 0
    dupes = 0
    rejd = 0
    
    # Extract columns dynamically
    ccol = [c for c in df.columns if 'country' in c.lower()]
    ccol = ccol[0] if ccol else None
    
    pcol = [c for c in df.columns if 'port' in c.lower() and 'foreign' in c.lower()]
    pcol = pcol[0] if pcol else None
    
    in_port_col = [c for c in df.columns if 'port' in c.lower() and 'indian' in c.lower()]
    in_port_col = in_port_col[0] if in_port_col else None
    
    in_comp_col = [c for c in df.columns if 'indian' in c.lower() and 'company' in c.lower()]
    in_comp_col = in_comp_col[0] if in_comp_col else None
    
    fg_comp_col = [c for c in df.columns if 'foreign' in c.lower() and 'company' in c.lower()]
    fg_comp_col = fg_comp_col[0] if fg_comp_col else None
    
    prod_col = [c for c in df.columns if 'product' in c.lower()]
    prod_col = prod_col[0] if prod_col else None
    
    bill_col = [c for c in df.columns if 'bill' in c.lower()]
    bill_col = bill_col[0] if bill_col else None
    
    hs_col = [c for c in df.columns if 'hs' in c.lower()]
    hs_col = hs_col[0] if hs_col else None
    
    qty_col = [c for c in df.columns if 'quantity' in c.lower()]
    qty_col = qty_col[0] if qty_col else 'Quantity'
    
    rate_fc_col = [c for c in df.columns if 'rate(inv)' in c.lower()]
    rate_fc_col = rate_fc_col[0] if rate_fc_col else None
    
    rate_inr_col = [c for c in df.columns if 'rate(inr)' in c.lower()]
    rate_inr_col = rate_inr_col[0] if rate_inr_col else None
    
    val_fc_col = [c for c in df.columns if 'invoice fc' in c.lower()]
    val_fc_col = val_fc_col[0] if val_fc_col else None
    
    fob_inr_col = [c for c in df.columns if 'fob (inr)' in c.lower()]
    fob_inr_col = fob_inr_col[0] if fob_inr_col else None
    
    for idx, row in df.iterrows():
        excel_row_num = idx + 2
        
        try:
            dt = pd.to_datetime(row[dcol])
            d = dt.date()
        except Exception:
            rejd += 1
            continue
            
        fy = get_financial_year(d)
        
        raw_qty = parse_num(row.get(qty_col)) or 0.0
        if raw_qty <= 0:
            rejd += 1
            continue
        qty_mt = round(raw_qty, 4)
        
        # Partner Country resolution
        c_raw = row[ccol] if ccol and pd.notna(row[ccol]) else None
        p_raw = row[pcol] if pcol and pd.notna(row[pcol]) else None
        fg_comp_raw = row[fg_comp_col] if fg_comp_col and pd.notna(row[fg_comp_col]) else None
        partner = resolve_country(c_raw, p_raw, fg_comp_raw)
        
        # Exchange rates for USD/INR conversion when customs clerk entered INR in FC column
        FX_RATES = {
            '2018-19': 69.9,
            '2019-20': 70.9,
            '2020-21': 74.2,
            '2021-22': 74.5,
            '2022-23': 80.4,
            '2023-24': 82.8,
            '2024-25': 83.5,
            '2025-26': 85.5,
            '2026-27': 86.5,
        }
        fx = FX_RATES.get(fy, 83.0)

        # Financial valuations
        val_usd = parse_num(row.get(val_fc_col)) if val_fc_col else None
        rate_fc = parse_num(row.get(rate_fc_col)) if rate_fc_col else None
        fob_inr = parse_num(row.get(fob_inr_col)) if fob_inr_col else None
        rate_inr = parse_num(row.get(rate_inr_col)) if rate_inr_col else None
        
        # Detect if TotFC was erroneously entered as INR in the customs sheet
        if fob_inr and val_usd and (fob_inr / val_usd < 5.0 or abs(fob_inr - val_usd) < 100):
            val_usd = round(fob_inr / fx, 2)
            
        if rate_fc is not None and rate_fc > 0:
            if rate_fc < 50.0:
                avg_usd_mt = round(rate_fc * 1000.0, 2)
            elif 500.0 <= rate_fc <= 20000.0:
                avg_usd_mt = round(rate_fc, 2)
            elif fob_inr and qty_mt > 0:
                avg_usd_mt = round((fob_inr / fx) / qty_mt, 2)
            else:
                avg_usd_mt = round(val_usd / qty_mt, 2) if (val_usd and qty_mt > 0) else 0.0
        elif val_usd and qty_mt > 0:
            avg_usd_mt = round(val_usd / qty_mt, 2)
        elif fob_inr and qty_mt > 0:
            val_usd = round(fob_inr / fx, 2)
            avg_usd_mt = round(val_usd / qty_mt, 2)
        else:
            avg_usd_mt = 0.0
            
        if val_usd is None or val_usd <= 0:
            val_usd = round(qty_mt * avg_usd_mt, 2)
            
        # Metadata
        in_port = str(row[in_port_col]).strip() if in_port_col and pd.notna(row[in_port_col]) else None
        fg_port = str(row[pcol]).strip() if pcol and pd.notna(row[pcol]) else None
        in_comp = str(row[in_comp_col]).strip() if in_comp_col and pd.notna(row[in_comp_col]) else None
        fg_comp = str(row[fg_comp_col]).strip() if fg_comp_col and pd.notna(row[fg_comp_col]) else None
        bill_no = str(row[bill_col]).strip() if bill_col and pd.notna(row[bill_col]) else None
        if bill_no and bill_no.endswith('.0'): bill_no = bill_no[:-2]
        prod_name = str(row[prod_col]).strip() if prod_col and pd.notna(row[prod_col]) else "Liquid Bromine"
        hs_code = str(row[hs_col]).replace('.', '').strip() if hs_col and pd.notna(row[hs_col]) else "28013020"
        
        # Idempotency check
        existing = db.scalar(
            select(TradeRecord.id).where(
                TradeRecord.source_file == fname,
                TradeRecord.source_sheet == sheet_name,
                TradeRecord.source_row_index == excel_row_num
            )
        )
        if existing:
            dupes += 1
            continue
            
        rec = TradeRecord(
            product_id=bromine_prod.id,
            trade_date=d,
            trade_direction="EXPORT",
            financial_year=fy,
            reporting_country="India",
            partner_country=partner,
            indian_port=in_port,
            foreign_port=fg_port,
            indian_company=in_comp,
            foreign_company=fg_comp,
            bill_no=bill_no,
            product_name=prod_name,
            hs_code=hs_code,
            quantity_mt=qty_mt,
            trade_value_usd=round(val_usd, 2),
            average_price_usd_per_mt=avg_usd_mt,
            trade_value_inr=fob_inr,
            unit_rate_inr=rate_inr,
            source_file=fname,
            source_sheet=sheet_name,
            source_row_index=excel_row_num,
            source_name=fname,
            source_url=None,
            original_quantity=qty_mt,
            original_unit="MTS"
        )
        db.add(rec)
        loaded += 1
        
        if loaded % 250 == 0:
            db.commit()
            
    db.commit()
    run.rows_processed = len(df)
    run.rows_loaded = loaded
    run.rows_rejected = rejd
    run.rows_duplicate = dupes
    run.status = "SUCCESS"
    run.completed_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    
    print(f"    Loaded={loaded}, Duplicates={dupes}, Rejected={rejd}")
    return {"loaded": loaded, "duplicates": dupes, "rejected": rejd}

def clean_import_sheet(db: Session, file_path: Path, sheet_name: str, bromine_prod) -> dict:
    fname = file_path.name
    print(f"  [IMPORT] Processing sheet '{sheet_name}'...")
    
    run = IngestionRun(
        pipeline_name="clean_trade_data",
        file_name=f"{fname}::{sheet_name}",
        started_at=datetime.datetime.now(datetime.timezone.utc),
        status="RUNNING"
    )
    db.add(run)
    db.commit()
    
    try:
        df = pd.read_excel(file_path, sheet_name=sheet_name)
    except Exception as e:
        run.status = "FAILED"
        run.error_message = f"Error reading sheet: {e}"
        run.completed_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        return {"loaded": 0, "duplicates": 0, "rejected": 0, "error": str(e)}

    # Filter out empty buffer/summary rows
    date_cols = [c for c in df.columns if 'date' in c.lower()]
    if not date_cols:
        run.status = "FAILED"
        run.error_message = "Date column not found"
        run.completed_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        return {"loaded": 0, "duplicates": 0, "rejected": 0}
        
    dcol = date_cols[0]
    df = df[df[dcol].notna()].copy()
    
    loaded = 0
    dupes = 0
    rejd = 0
    
    ccol = [c for c in df.columns if 'country' in c.lower()]
    ccol = ccol[0] if ccol else None
    
    pcol = [c for c in df.columns if 'port_of_shipment' in c.lower()]
    pcol = pcol[0] if pcol else None
    
    in_port_col = [c for c in df.columns if 'indian' in c.lower() and 'port' in c.lower()]
    in_port_col = in_port_col[0] if in_port_col else None
    
    importer_col = [c for c in df.columns if 'importer' in c.lower()]
    importer_col = importer_col[0] if importer_col else None
    
    supp_col = [c for c in df.columns if 'supp_name' in c.lower()]
    supp_col = supp_col[0] if supp_col else None
    
    prod_col = [c for c in df.columns if 'item' in c.lower()]
    prod_col = prod_col[0] if prod_col else None
    
    be_no_col = [c for c in df.columns if 'be_no' in c.lower()]
    be_no_col = be_no_col[0] if be_no_col else None
    
    cth_col = [c for c in df.columns if 'cth' in c.lower()]
    cth_col = cth_col[0] if cth_col else None
    
    qty_col = [c for c in df.columns if 'qty' in c.lower()]
    qty_col = qty_col[0] if qty_col else 'QTY'
    
    unit_fc_col = [c for c in df.columns if 'invoiceunitpricefc' in c.lower()]
    unit_fc_col = unit_fc_col[0] if unit_fc_col else None
    
    unit_inr_col = [c for c in df.columns if 'unit_value_inr' in c.lower()]
    unit_inr_col = unit_inr_col[0] if unit_inr_col else None
    
    tot_val_col = [c for c in df.columns if 'total_value' in c.lower()]
    tot_val_col = tot_val_col[0] if tot_val_col else None
    
    for idx, row in df.iterrows():
        excel_row_num = idx + 2
        
        try:
            dt = pd.to_datetime(row[dcol])
            d = dt.date()
        except Exception:
            rejd += 1
            continue
            
        fy = get_financial_year(d)
        
        raw_qty = parse_num(row.get(qty_col)) or 0.0
        if raw_qty <= 0:
            rejd += 1
            continue
        qty_mt = round(raw_qty, 4)
        
        # Partner Country resolution
        c_raw = row[ccol] if ccol and pd.notna(row[ccol]) else None
        p_raw = row[pcol] if pcol and pd.notna(row[pcol]) else None
        supp_raw = row[supp_col] if supp_col and pd.notna(row[supp_col]) else None
        partner = resolve_country(c_raw, p_raw, supp_raw)
        
        # Pricing & Values
        unit_fc = parse_num(row.get(unit_fc_col)) if unit_fc_col else None
        unit_inr = parse_num(row.get(unit_inr_col)) if unit_inr_col else None
        tot_inr = parse_num(row.get(tot_val_col)) if tot_val_col else None
        
        # InvoiceUnitPriceFC in Indian Customs is in USD/kg (e.g. 2.40 USD/kg = 2,400 USD/MT)
        if unit_fc is not None and unit_fc > 0:
            avg_usd_mt = round(unit_fc * 1000.0, 2) if unit_fc < 500 else round(unit_fc, 2)
        elif tot_inr and qty_mt > 0:
            avg_usd_mt = round((tot_inr / 80.0) / qty_mt, 2)
        else:
            avg_usd_mt = 0.0
            
        val_usd = round(qty_mt * avg_usd_mt, 2)
        
        # Metadata
        in_port = str(row[in_port_col]).strip() if in_port_col and pd.notna(row[in_port_col]) else None
        fg_port = str(row[pcol]).strip() if pcol and pd.notna(row[pcol]) else None
        importer = str(row[importer_col]).strip() if importer_col and pd.notna(row[importer_col]) else None
        supplier = str(row[supp_col]).strip() if supp_col and pd.notna(row[supp_col]) else None
        be_no = str(row[be_no_col]).strip() if be_no_col and pd.notna(row[be_no_col]) else None
        if be_no and be_no.endswith('.0'): be_no = be_no[:-2]
        prod_name = str(row[prod_col]).strip() if prod_col and pd.notna(row[prod_col]) else "Bromine Elemental"
        hs_code = str(row[cth_col]).replace('.', '').strip() if cth_col and pd.notna(row[cth_col]) else "28013020"
        
        # Idempotency check
        existing = db.scalar(
            select(TradeRecord.id).where(
                TradeRecord.source_file == fname,
                TradeRecord.source_sheet == sheet_name,
                TradeRecord.source_row_index == excel_row_num
            )
        )
        if existing:
            dupes += 1
            continue
            
        rec = TradeRecord(
            product_id=bromine_prod.id,
            trade_date=d,
            trade_direction="IMPORT",
            financial_year=fy,
            reporting_country="India",
            partner_country=partner,
            indian_port=in_port,
            foreign_port=fg_port,
            indian_company=importer,
            foreign_company=supplier,
            bill_no=be_no,
            product_name=prod_name,
            hs_code=hs_code,
            quantity_mt=qty_mt,
            trade_value_usd=round(val_usd, 2),
            average_price_usd_per_mt=avg_usd_mt,
            trade_value_inr=tot_inr,
            unit_rate_inr=unit_inr,
            source_file=fname,
            source_sheet=sheet_name,
            source_row_index=excel_row_num,
            source_name=fname,
            source_url=None,
            original_quantity=qty_mt,
            original_unit="MTS"
        )
        db.add(rec)
        loaded += 1
        
        if loaded % 250 == 0:
            db.commit()
            
    db.commit()
    run.rows_processed = len(df)
    run.rows_loaded = loaded
    run.rows_rejected = rejd
    run.rows_duplicate = dupes
    run.status = "SUCCESS"
    run.completed_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    
    print(f"    Loaded={loaded}, Duplicates={dupes}, Rejected={rejd}")
    return {"loaded": loaded, "duplicates": dupes, "rejected": rejd}

def clean_all_trade_data(db: Session = None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
        
    print("\n--- Running clean_trade_data Pipeline (Authoritative Multi-Year Source) ---")
    results = {}
    bromine_prod = get_or_create_product(db, name="Bromine", code="BR2")
    
    # 1. EXPORT WORKBOOK
    if EXPORT_FILE.exists():
        print(f"\nProcessing Export Workbook: {EXPORT_FILE.name}")
        xl_exp = pd.ExcelFile(EXPORT_FILE)
        for sheet in xl_exp.sheet_names:
            res = clean_export_sheet(db, EXPORT_FILE, sheet, bromine_prod)
            results[f"EXPORT::{sheet}"] = res
    else:
        print(f"  Warning: Export file not found: {EXPORT_FILE}")
        
    # 2. IMPORT WORKBOOK
    if IMPORT_FILE.exists():
        print(f"\nProcessing Import Workbook: {IMPORT_FILE.name}")
        xl_imp = pd.ExcelFile(IMPORT_FILE)
        for sheet in xl_imp.sheet_names:
            if sheet.lower() == 'sheet1':
                continue
            res = clean_import_sheet(db, IMPORT_FILE, sheet, bromine_prod)
            results[f"IMPORT::{sheet}"] = res
    else:
        print(f"  Warning: Import file not found: {IMPORT_FILE}")
        
    total_loaded = sum(r.get("loaded", 0) for r in results.values())
    print(f"\n--- Ingestion Completed: {total_loaded} total trade shipments ingested ---")
    
    if close_db:
        db.close()
        
    return results

if __name__ == "__main__":
    clean_all_trade_data()
