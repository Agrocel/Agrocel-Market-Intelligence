import os, json, csv, re
from datetime import datetime, date
from pathlib import Path
from sqlalchemy.orm import Session
from ..models import IngestionRun, IngestionError, Product, Geography, Competitor

BASE_DIR = Path(__file__).resolve().parents[3]
MAPPINGS_DIR = Path(__file__).resolve().parents[1] / "mappings"
REPORTS_DIR = BASE_DIR / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

_country_map = None
_competitor_map = None
_product_map = None
_unit_rules = None
_hs_map = None
_reliability_map = None

def get_mapping(name: str):
    global _country_map, _competitor_map, _product_map, _unit_rules, _hs_map, _reliability_map
    path = MAPPINGS_DIR / f"{name}.json"
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def normalize_country(raw: str | None) -> str:
    if not raw or str(raw).strip() in ('', 'None', 'NULL', 'N/A'):
        return "World"
    cmap = get_mapping("country_aliases")
    raw_clean = str(raw).strip().upper()
    if raw_clean in cmap:
        return cmap[raw_clean]
    if ',' in raw_clean:
        parts = [p.strip() for p in raw_clean.split(',')]
        for p in reversed(parts):
            if p in cmap:
                return cmap[p]
    c = re.sub(r'[/].*$', '', raw_clean).strip()
    c = re.sub(r'\d+', '', c).strip()
    if c in cmap:
        return cmap[c]
    for k, v in cmap.items():
        if k in raw_clean:
            return v
    return str(raw).strip().title()

def normalize_competitor(raw: str | None) -> str | None:
    if not raw or str(raw).strip() in ('', 'None', 'NULL'):
        return None
    c = str(raw).strip().upper()
    c_clean = re.sub(r'[.]', '', c).strip()
    comp_map = get_mapping("competitor_aliases")
    for k, v in comp_map.items():
        if k.upper() in c_clean or c_clean in k.upper():
            return v
    return str(raw).strip()

def normalize_product(raw: str | None) -> str:
    if not raw or str(raw).strip() in ('', 'None', 'NULL'):
        return "Bromine"
    p = str(raw).strip().upper()
    pmap = get_mapping("product_aliases")
    return pmap.get(p, "Bromine")

def parse_flexible_date(val) -> date | None:
    if val is None or str(val).strip() == '':
        return None
    if isinstance(val, (datetime, date)):
        return val.date() if isinstance(val, datetime) else val
        
    s = str(val).strip()
    
    # Try month name formats like "Jan.2024" or "May 2024" or "Jun 23"
    month_match = re.search(r'([A-Za-z]+)[.\s\-_]+(?:20)?(\d{2,4})', s)
    if month_match:
        m_str, y_str = month_match.groups()
        if len(y_str) == 2:
            y_str = "20" + y_str
        for m_fmt in ("%b", "%B"):
            try:
                dt = datetime.strptime(f"{m_str[:3]} {y_str}", f"%b %Y")
                return dt.date()
            except ValueError:
                pass

    # Standard date patterns
    for fmt in (
        '%Y-%m-%d', '%Y-%m-%d %H:%M:%S',
        '%d.%m.%Y', '%d/%m/%Y', '%m/%d/%Y',
        '%Y/%m/%d', '%d-%m-%Y', '%d-%b-%Y', '%d-%B-%Y',
        '%Y%m%d', '%d.%m.%y', '%d/%m/%y'
    ):
        try:
            return datetime.strptime(s.split()[0], fmt).date()
        except ValueError:
            pass
            
    # Try parsing doc string like "4005052 - 22/04/2023"
    sub_date = re.search(r'(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})', s)
    if sub_date:
        return parse_flexible_date(sub_date.group(1))
        
    return None

def normalize_quantity_mt(qty_val, unit_val=None) -> tuple[float | None, float | None, str | None]:
    """Converts quantity to MT. Returns (quantity_mt, original_qty, original_unit)"""
    if qty_val is None:
        return None, None, None
    try:
        raw_qty = float(str(qty_val).replace(',', '').strip())
    except ValueError:
        return None, None, str(unit_val)
        
    u_str = str(unit_val).strip().upper() if unit_val else "KGS"
    rules = get_mapping("unit_conversion_rules").get("unit_to_mt_multiplier", {})
    
    # Default multiplier for KGS if unit is missing or mentions kg
    multiplier = rules.get(u_str, 0.001 if 'KG' in u_str else 1.0 if 'MT' in u_str or 'TON' in u_str else 0.001)
    qty_mt = round(raw_qty * multiplier, 4)
    return qty_mt, raw_qty, str(unit_val) if unit_val else "KGS"

def log_rejected_row(pipeline_name: str, row_num: int, row_data: dict | list, reason: str):
    rep_file = REPORTS_DIR / f"rejected_rows_{pipeline_name}.csv"
    file_exists = rep_file.exists()
    with open(rep_file, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["timestamp", "row_num", "reason", "raw_data"])
        writer.writerow([datetime.utcnow().isoformat(), row_num, reason, json.dumps(str(row_data))])

def get_or_create_product(db: Session, name="Bromine", code="BR2") -> Product:
    p = db.query(Product).filter((Product.product_code == code) | (Product.name == name)).first()
    if not p:
        p = Product(name=name, chemical_name=name, product_code=code, active=True)
        db.add(p)
        db.commit()
    return p

def get_or_create_geography(db: Session, country_name: str) -> Geography:
    g = db.query(Geography).filter(Geography.country == country_name).first()
    if not g:
        iso = country_name[:3].upper()
        # make iso unique
        existing = db.query(Geography).filter(Geography.iso_code == iso).first()
        if existing:
            iso = (country_name[:2] + str(existing.id))[:3].upper()
        g = Geography(country=country_name, region="Global", iso_code=iso)
        db.add(g)
        db.commit()
    return g

def get_or_create_competitor(db: Session, comp_name: str, country="India") -> Competitor:
    c = db.query(Competitor).filter(Competitor.name == comp_name).first()
    if not c:
        c = Competitor(name=comp_name, country=country, listed_company=False, active=True)
        db.add(c)
        db.commit()
    return c
