"""
Agrocel Market Intelligence - Dynamic Intelligence Transformation Test Suite
Automated Verification of 9 Core Dynamic Scenarios
Ensures zero hardcoded business numbers, period-aware currency conversions,
dynamic econometric forecasting, and reliable evidence-grounded AI fallbacks.
"""

import pytest
from datetime import date, datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import (
    Base, Product, Geography, MarketPrice, TradeRecord, SalesRecord,
    NewsSource, NewsArticle, NewsIntelligence,
    Competitor, CompetitorReport, CompetitorExtractedMetric
)
from app.services.currency_service import (
    get_usd_inr_rate, convert_inr_to_usd, convert_usd_to_inr, get_rate_metadata
)
from app.services.kpi_service import build_dynamic_kpi, unavailable_kpi, DynamicKPIMetric
from app.services.forecasting_engine import (
    train_and_forecast_econometric, get_persisted_forecast_run, MIN_OBSERVATIONS_REQUIRED
)
from app.services.market_balance_engine import calculate_dynamic_market_balance
from app.services.outage_service import get_dynamic_outages_register
from app.overview_engine import (
    get_price_benchmarks, get_executive_market_snapshot, get_forecasts_overview, get_news_overview
)
from app.ai.executive_brief_engine import generate_deterministic_brief_data


@pytest.fixture
def test_db():
    """Isolated in-memory SQLite database for test execution."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()

    # Seed baseline product and geography
    p = Product(id=1, name="Bromine", chemical_name="Liquid Elemental Bromine", product_code="BR2")
    g = Geography(id=1, country="India", region="South Asia", iso_code="IND")
    session.add_all([p, g])
    session.commit()

    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


# =========================================================================
# TEST 1 — PRICE CHANGE
# =========================================================================
def test_scenario_1_price_change(test_db):
    """
    Modify a price/trade record. Verify that dependent metrics
    (CIF parity, price spread, domestic headroom) update dynamically.
    """
    # 1. Initial State: Import record at $3,000/MT CIF
    t1 = TradeRecord(
        product_id=1,
        trade_date=date(2026, 2, 1),
        trade_direction="IMPORT",
        financial_year="2025-26",
        partner_country="Israel",
        indian_port="Nhava Sheva",
        foreign_company="ICL Group",
        quantity_mt=100.0,
        trade_value_usd=300000.0, # $3,000/MT
        average_price_usd_per_mt=3000.0,
        trade_value_inr=26040000.0,
        source_file="test_import.xlsx",
        source_sheet="Sheet1",
        source_row_index=1,
        source_name="Customs Feed"
    )
    s1 = SalesRecord(
        product_id=1,
        sales_date=date(2026, 2, 15),
        financial_year="2025-26",
        customer_name="Gujarat Agrochemicals Ltd",
        product_raw="BROMINE",
        product_category="BROMINE",
        quantity_kg=50000.0,
        quantity_mt=50.0,
        realization_inr_per_mt=200000.0, # ₹200/kg
        revenue_inr=10000000.0,
        source_file="test_sale.xlsx",
        source_row_index=1
    )
    test_db.add_all([t1, s1])
    test_db.commit()

    benchmarks_v1 = get_price_benchmarks(test_db)
    assert benchmarks_v1["latest_metrics"]["cif_india_import_parity_usd_mt"] == 3000.0
    assert benchmarks_v1["domestic_pricing_headroom"]["agrocel_price_inr_kg"] == 200.0
    headroom_v1 = benchmarks_v1["domestic_pricing_headroom"]["headroom_inr_kg"]

    # 2. Modify State: Add a higher price import deal at $3,600/MT
    t2 = TradeRecord(
        product_id=1,
        trade_date=date(2026, 2, 20),
        trade_direction="IMPORT",
        financial_year="2025-26",
        partner_country="Jordan",
        indian_port="Mundra",
        foreign_company="Jordan Bromine Co",
        quantity_mt=200.0,
        trade_value_usd=720000.0, # $3,600/MT
        average_price_usd_per_mt=3600.0,
        trade_value_inr=62496000.0,
        source_file="test_import.xlsx",
        source_sheet="Sheet1",
        source_row_index=2,
        source_name="Customs Feed"
    )
    test_db.add(t2)
    test_db.commit()

    benchmarks_v2 = get_price_benchmarks(test_db)
    # Weighted average: (300k + 720k) / 300 MT = $3,400/MT
    assert benchmarks_v2["latest_metrics"]["cif_india_import_parity_usd_mt"] == 3400.0
    headroom_v2 = benchmarks_v2["domestic_pricing_headroom"]["headroom_inr_kg"]
    # Headroom should have widened as import parity increased
    assert headroom_v2 > headroom_v1


# =========================================================================
# TEST 2 — MISSING DATA
# =========================================================================
def test_scenario_2_missing_data_returns_null(test_db):
    """
    When records are missing or an empty database is queried,
    metrics must return null / 'unavailable' without invented fallbacks (e.g. 2850, 3048).
    """
    benchmarks = get_price_benchmarks(test_db)
    assert benchmarks["latest_metrics"]["cif_india_import_parity_usd_mt"] is None
    assert benchmarks["latest_metrics"]["agrocel_weighted_realization_inr_mt"] is None
    assert benchmarks["latest_metrics"]["data_status"] == "unavailable"
    assert "unavailable" in benchmarks["ai_price_interpretation"].lower()

    # KPI builder test
    kpi = unavailable_kpi(
        metric_id="china_spot_benchmark",
        label="China Spot Benchmark",
        unit="USD/MT",
        reason="No verified price records found in active filter window"
    )
    assert kpi.value is None
    assert kpi.data_status == "unavailable"
    assert kpi.unit == "USD/MT"


# =========================================================================
# TEST 3 — SUPPLY CHANGE
# =========================================================================
def test_scenario_3_supply_change(test_db):
    """
    Modify plant disruption/capacity record. Verify that active disruption count
    and market balance assessments update dynamically.
    """
    outages_initial = get_dynamic_outages_register(test_db)
    initial_count = outages_initial["active_count"]

    # Ingest a new plant event via NewsIntelligence
    source = NewsSource(
        source_name="Industry Wire Test",
        source_type="OFFICIAL_WEBSITE",
        base_url="https://example.com"
    )
    test_db.add(source)
    test_db.commit()

    article = NewsArticle(
        news_source_id=source.id,
        canonical_url="https://example.com/outage-1",
        original_url="https://example.com/outage-1",
        title="Jordan Bromine Dead Sea Extraction Unit Unscheduled Maintenance",
        summary_or_snippet="Extraction operations disrupted following pipe failure.",
        published_at=datetime.utcnow(),
        publisher_name="Platts Chemical",
        publisher_region="Middle East",
        processing_status="PROCESSED"
    )
    test_db.add(article)
    test_db.commit()

    intel = NewsIntelligence(
        news_article_id=article.id,
        product_id=1,
        event_geography_name="Jordan",
        intelligence_type="PLANT_EVENT",
        event_date=date.today(),
        impact_level="CRITICAL",
        is_corroborated=True,
        short_summary="Extraction operations disrupted following pipe failure.",
        why_it_matters="Tightens Dead Sea supply"
    )
    test_db.add(intel)
    test_db.commit()

    outages_updated = get_dynamic_outages_register(test_db)
    assert outages_updated["active_count"] == initial_count + 1
    assert any("NEWS-EVT" in d["event_id"] for d in outages_updated["outages"])


# =========================================================================
# TEST 4 — NEWS INGESTION
# =========================================================================
def test_scenario_4_news_ingestion(test_db):
    """
    Add a verified news development. Verify news overview updates dynamically.
    """
    news_initial = get_news_overview(test_db)
    initial_count = news_initial["total_items"]

    source = NewsSource(
        source_name="China Chemical Radar",
        source_type="GDELT",
        base_url="https://example.com/china"
    )
    test_db.add(source)
    test_db.commit()

    article = NewsArticle(
        news_source_id=source.id,
        canonical_url="https://example.com/china-news-1",
        original_url="https://example.com/china-news-1",
        title="Ministry of Ecology Enforces 30% Groundwater Pumping Quota in Weifang",
        summary_or_snippet="Shandong provincial authorities mandate 30% extraction cut on subterranean brine.",
        published_at=datetime.utcnow(),
        publisher_name="Xinhua Chemical",
        publisher_region="China",
        processing_status="PROCESSED"
    )
    test_db.add(article)
    test_db.commit()

    news_updated = get_news_overview(test_db)
    assert news_updated["total_items"] == initial_count + 1
    assert any(article.title in item["headline"] for item in news_updated["items"])


# =========================================================================
# TEST 5 — FORECAST AVAILABILITY
# =========================================================================
def test_scenario_5_forecast_availability():
    """
    Ensure no predefined forecast arrays are returned.
    When data < 12 points, return status='UNAVAILABLE'.
    When data >= 12 points, return real econometric model output.
    """
    # 1. Less than 12 points -> UNAVAILABLE
    short_series = [
        {"date": f"2025-{m:02d}", "month_label": f"M{m}", "avg_unit_value_usd_mt": 3000 + m * 20, "volume_mt": 100}
        for m in range(1, 6) # only 5 months
    ]
    res_short = train_and_forecast_econometric(short_series, forecast_horizon=6)
    assert res_short["status"] == "UNAVAILABLE"
    assert len(res_short["predictions"]) == 0
    assert "insufficient verified time-series" in res_short["message"]

    # 2. 18 months of historical data -> SUCCESS with real model evaluation
    long_series = [
        {"date": f"2024-{m:02d}" if m <= 12 else f"2025-{(m-12):02d}",
         "month_label": f"Month {m}",
         "avg_unit_value_usd_mt": 2800 + (m * 25),
         "volume_mt": 500}
        for m in range(1, 19)
    ]
    res_long = train_and_forecast_econometric(long_series, forecast_horizon=6)
    assert res_long["status"] == "SUCCESS"
    assert len(res_long["predictions"]) == 6
    meta = res_long["model_metadata"]
    assert "Agrocel-ETS" in meta["model_name"]
    assert "mae_usd_mt" in meta["evaluation_metrics"]
    assert "mape_pct" in meta["evaluation_metrics"]
    assert meta["evaluation_metrics"]["mae_usd_mt"] >= 0.0
    # Predictions must have valid confidence bounds
    p1 = res_long["predictions"][0]
    assert p1["lower_bound_usd"] < p1["predicted_cif_usd_mt"] < p1["upper_bound_usd"]


# =========================================================================
# TEST 6 — AI FAILURE / DETERMINISTIC FALLBACK
# =========================================================================
def test_scenario_6_ai_failure_safe_fallback():
    """
    When Gemini API is unavailable, deterministic fallback must generate
    safe, factual briefs using only validated metrics without inventing facts.
    """
    metrics = {
        "china_spot_price": {
            "current_usd_mt": 3200.0,
            "change_pct": 5.2,
            "price_formatted": "$3,200.0/MT"
        },
        "india_trade": {
            "export_qty_mt": 850.0,
            "export_val_usd": 2720000.0,
            "top_destinations": "China, Vietnam"
        },
        "agrocel_sales": {
            "sales_qty_mt": 620.0,
            "realization_inr_per_mt": 210000.0
        },
        "competitor_events": []
    }
    doc_evidence = [
        {"document_title": "Richard Bromine Weekly", "page_number": 3, "text": "China spot firm on supply tightness."}
    ]

    brief = generate_deterministic_brief_data(metrics, doc_evidence)
    assert brief["overall_market_direction"] == "BULLISH"
    assert "$3,200.0/MT" in brief["executive_summary"]
    assert "INR 210,000/MT" in brief["executive_summary"]
    assert len(brief["sections"]) >= 8
    assert len(brief["citations"]) >= 1


# =========================================================================
# TEST 7 — REPORTING PERIOD & CURRENCY CONVERSION
# =========================================================================
def test_scenario_7_reporting_period_and_currency():
    """
    Test period-aware currency conversions across financial years / dates.
    Ensures static 83.5 is eliminated in favor of verified RBI reference rates.
    """
    # 2018-19 historical period
    rate_2018 = get_usd_inr_rate(dt=date(2018, 6, 15))
    assert 69.0 <= rate_2018 <= 71.0

    # 2022-23 period
    rate_2022 = get_usd_inr_rate(dt=date(2022, 10, 10))
    assert 80.0 <= rate_2022 <= 83.0

    # 2025-26 contemporary period
    rate_2025 = get_usd_inr_rate(dt=date(2025, 11, 1))
    assert 85.0 <= rate_2025 <= 88.0

    # Conversion consistency
    usd_val = 1000.0
    inr_val = convert_usd_to_inr(usd_val, dt=date(2025, 11, 1))
    converted_back = convert_inr_to_usd(inr_val, dt=date(2025, 11, 1))
    assert abs(converted_back - usd_val) < 0.01

    meta = get_rate_metadata(dt=date(2025, 11, 1))
    assert meta["source_authority"] == "Reserve Bank of India (RBI)"
    assert meta["effective_period"] == "2025-11"

    # =========================================================================
# TEST 8 — DATA PROVENANCE
# =========================================================================
def test_scenario_8_data_provenance_exposure():
    """
    Verify that calculated KPIs expose formula, source IDs,
    and quality status for transparency.
    """
    kpi = build_dynamic_kpi(
        metric_id="agrocel_domestic_realization",
        label="Agrocel Domestic Realization",
        value=195.7,
        unit="INR/kg",
        period="FY 2025-26",
        previous_period_value=182.4,
        source_ids=["sales_records:SALE_2526.xls"],
        calculation_method="Sum(Net Invoice Value INR) / Sum(Net Quantity MT) / 1000",
        data_status="verified"
    )

    assert kpi.metric_id == "agrocel_domestic_realization"
    assert kpi.value == 195.7
    assert kpi.unit == "INR/kg"
    assert round(kpi.absolute_change, 2) == 13.3
    assert round(kpi.percentage_change, 2) == 7.29
    assert kpi.calculation_method is not None
    assert "sales_records" in kpi.source_ids[0]
    assert kpi.data_status == "verified"
    assert kpi.last_updated is not None


# =========================================================================
# TEST 9 — CROSS-PAGE CONSISTENCY
# =========================================================================
def test_scenario_9_cross_page_consistency(test_db):
    """
    Verify that the same business metric displays identically
    across Executive Overview and Price Intelligence.
    """
    # Populate consistent sales and trade records
    t = TradeRecord(
        product_id=1,
        trade_date=date(2026, 1, 15),
        trade_direction="IMPORT",
        financial_year="2025-26",
        partner_country="Israel",
        indian_port="Nhava Sheva",
        foreign_company="ICL Group",
        quantity_mt=250.0,
        trade_value_usd=750000.0, # $3,000/MT
        average_price_usd_per_mt=3000.0,
        trade_value_inr=65100000.0,
        source_file="test_import.xlsx",
        source_sheet="Sheet1",
        source_row_index=1,
        source_name="Customs Feed"
    )
    s = SalesRecord(
        product_id=1,
        sales_date=date(2026, 1, 20),
        financial_year="2025-26",
        customer_name="Aarti Industries Ltd",
        product_raw="BROMINE",
        product_category="BROMINE",
        quantity_kg=100000.0,
        quantity_mt=100.0,
        realization_inr_per_mt=195000.0, # ₹195/kg
        revenue_inr=19500000.0,
        source_file="test_sale.xlsx",
        source_row_index=1
    )
    test_db.add_all([t, s])
    test_db.commit()

    price_benchmarks = get_price_benchmarks(test_db)
    exec_snapshot = get_executive_market_snapshot(test_db)

    # CIF parity match
    cif_from_price_page = price_benchmarks["latest_metrics"]["cif_india_import_parity_usd_mt"]
    cif_from_exec_overview = exec_snapshot["price_direction"]["benchmark_cif_usd_mt"]
    assert cif_from_price_page == cif_from_exec_overview == 3000.0

    # Agrocel realization match
    realization_from_price_page = price_benchmarks["latest_metrics"]["agrocel_weighted_realization_inr_mt"]
    realization_from_exec_overview = exec_snapshot["agrocel_position"]["weighted_avg_realization_inr_mt"]
    assert realization_from_price_page == realization_from_exec_overview == 195000.0
