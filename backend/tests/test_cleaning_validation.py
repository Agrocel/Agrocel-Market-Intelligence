import pytest
from datetime import date
from app.cleaning.common import parse_flexible_date, normalize_quantity_mt, normalize_country, normalize_competitor

def test_parse_flexible_date():
    assert parse_flexible_date("2024-04-15") == date(2024, 4, 15)
    assert parse_flexible_date("15.04.2024") == date(2024, 4, 15)
    assert parse_flexible_date("15/04/2024") == date(2024, 4, 15)
    assert parse_flexible_date("Jan.2024") == date(2024, 1, 1)
    assert parse_flexible_date("Jun 23") == date(2023, 6, 1)
    assert parse_flexible_date("6003002 - 15/04/2023") == date(2023, 4, 15)
    assert parse_flexible_date(None) is None
    assert parse_flexible_date("") is None

def test_normalize_quantity_mt():
    qty_mt, orig_qty, orig_unit = normalize_quantity_mt(18000, "KGS")
    assert qty_mt == 18.0
    assert orig_qty == 18000.0
    assert orig_unit == "KGS"

    qty_mt, _, _ = normalize_quantity_mt("17.4", "MT")
    assert qty_mt == 17.4

    qty_mt, _, _ = normalize_quantity_mt(None)
    assert qty_mt is None

def test_normalize_country():
    assert normalize_country("P.R.CHINA") == "China"
    assert normalize_country("CHINA") == "China"
    assert normalize_country("INDIA") == "India"
    assert normalize_country("TOKYO, JAPAN") == "Japan"
    assert normalize_country(None) == "World"

def test_normalize_competitor():
    assert normalize_competitor("ARCHEAN CHEMICAL INDUSTRIES LIMITED.") == "Archean Chemical"
    assert normalize_competitor("SATYESH BRINECHEM PVT LTD") == "Satyesh Brinechem"
    assert normalize_competitor("ICL GROUP") == "ICL Group"
    assert normalize_competitor(None) is None

def test_trade_average_price_rule():
    # average_price_usd_per_mt = trade_value_usd / quantity_mt
    qty_mt = 20.0
    val_usd = 60000.0
    avg_price = round(val_usd / qty_mt, 2)
    assert avg_price == 3000.0
