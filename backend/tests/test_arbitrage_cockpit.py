import pytest
from backend.app.services.arbitrage_service import calculate_landed_parity, get_arbitrage_cockpit_data
from backend.app.database import SessionLocal

def test_calculate_landed_parity_standard():
    # Test standard Indian customs parameters for Bromine HS 28013020
    # CIF $2,400/MT, FX 86.8 INR/USD
    res = calculate_landed_parity(
        cif_usd_mt=2400.0,
        fx_rate=86.80,
        bcd_pct=7.5,
        swc_pct=0.75,
        port_handling_inr_kg=2.50,
        inland_freight_inr_kg=3.00
    )
    assert res["assessed_cif_inr_kg"] == 208.32
    assert res["customs_duty_inr_kg"] == 17.19
    assert res["port_handling_inr_kg"] == 2.50
    assert res["inland_freight_inr_kg"] == 3.00
    assert res["true_landed_inr_kg"] == 231.01
    assert res["true_landed_usd_mt"] == 2661.4

def test_calculate_landed_parity_zero_or_negative():
    res = calculate_landed_parity(cif_usd_mt=0, fx_rate=86.80)
    assert res["true_landed_inr_kg"] == 0.0

def test_get_arbitrage_cockpit_payload():
    with SessionLocal() as db:
        data = get_arbitrage_cockpit_data(db)
        assert data["status"] == "success"
        assert "baseline_parameters" in data
        assert "simulation_parameters" in data
        assert "breakdown" in data
        assert "negotiation_corridor" in data
        assert "historical_spread_series" in data
        assert len(data["historical_spread_series"]) > 0

        corridor = data["negotiation_corridor"]
        assert corridor["ceiling_price_inr_kg"] > corridor["target_price_inr_kg"]
        assert corridor["target_price_inr_kg"] > corridor["floor_price_inr_kg"]
        assert "commercial_guidance" in corridor
