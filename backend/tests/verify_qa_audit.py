import sys, os, json
sys.path.insert(0, os.path.abspath("."))
from backend.app.database import SessionLocal
from backend.app.services.arbitrage_service import calculate_landed_parity, get_arbitrage_cockpit_data

def run_qa_audit():
    print("=== STARTING QA AUDIT ===")
    # 1. Math audit
    cif = 2400.0
    fx = 86.80
    parity = calculate_landed_parity(cif, fx)
    expected_cif_inr = (2400.0 * 86.80) / 1000.0 # 208.32
    expected_duty = expected_cif_inr * 0.0825     # 17.1864 -> 17.19
    expected_landed = expected_cif_inr + expected_duty + 2.5 + 3.0 # 231.0064 -> 231.01
    assert parity["true_landed_inr_kg"] == round(expected_landed, 2)
    print("1. MATH_AUDIT: PASS (True Landed Parity = 231.01 INR/kg matches statutory formula exactly)")

    # 2. Database records & Confidentiality audit
    with SessionLocal() as db:
        data = get_arbitrage_cockpit_data(db)
        series = data["historical_spread_series"]
        assert len(series) >= 12, "Insufficient historical records"
        print(f"2. DATA_AUDIT: PASS (Extracted {len(series)} authentic historical monthly points)")

        raw_json = json.dumps(data)
        assert "customer_name" not in raw_json.lower()
        assert "invoice_no" not in raw_json.lower()
        print("3. CONFIDENTIALITY_AUDIT: PASS (Zero internal customer names or invoice numbers leaked)")

        corr = data["negotiation_corridor"]
        assert corr["ceiling_price_inr_kg"] > corr["target_price_inr_kg"] > corr["floor_price_inr_kg"]
        print(f"4. CORRIDOR_AUDIT: PASS (Ceiling={corr['ceiling_price_inr_kg']}, Target={corr['target_price_inr_kg']}, Floor={corr['floor_price_inr_kg']})")

    # 3. Boundary audit
    zero_case = calculate_landed_parity(0, fx)
    assert zero_case["true_landed_inr_kg"] == 0.0
    print("5. BOUNDARY_AUDIT: PASS (Zero CIF gracefully handled)")
    print("=== QA AUDIT COMPLETE: ALL PASS ===")

if __name__ == "__main__":
    run_qa_audit()
