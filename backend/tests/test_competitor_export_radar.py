import sys, os, json
sys.path.insert(0, os.path.abspath("backend"))

from app.database import SessionLocal
from app.models import Competitor, CompetitorReport, CompetitorExtractedMetric, CompetitorStrategicFinding, TradeRecord
from app.main import competitor_export_radar, competitor_dossiers, competitor_dossier_detail

def test_competitor_satyesh_integration():
    print("=== STARTING SATYESH BRINECHEM & EXPORT RADAR QA AUDIT ===")
    with SessionLocal() as db:
        # 1. Verify Satyesh in DB
        satyesh = db.query(Competitor).filter_by(stock_ticker="SATYESH").first()
        assert satyesh is not None, "Satyesh Brinechem not found in competitors table"
        assert satyesh.name == "Satyesh Brinechem"
        assert satyesh.country == "India"
        print(f"1. SATYESH_DB_AUDIT: PASS (ID={satyesh.id}, Name='{satyesh.name}', Ticker='{satyesh.stock_ticker}')")

        # 2. Verify Reports, Metrics, and Findings
        reports = db.query(CompetitorReport).filter_by(competitor_id=satyesh.id).all()
        assert len(reports) == 3, f"Expected 3 MCA reports for Satyesh, found {len(reports)}"
        
        metrics = db.query(CompetitorExtractedMetric).filter_by(competitor_id=satyesh.id).all()
        assert len(metrics) == 11, f"Expected 11 metrics (quarterly + annual) for Satyesh, found {len(metrics)}"
        annual_metrics = [m for m in metrics if m.is_annual]
        assert len(annual_metrics) == 2, f"Expected 2 annual metrics (FY24, FY25), found {len(annual_metrics)}"

        findings = db.query(CompetitorStrategicFinding).filter_by(competitor_id=satyesh.id).all()
        assert len(findings) == 2, f"Expected 2 strategic findings for Satyesh, found {len(findings)}"
        print("2. SATYESH_DOSSIER_AUDIT: PASS (3 MCA Form AOC-4 reports, 11 metrics with is_annual flags, 2 findings)")

        # 3. Test Export Radar API function for ARCHEAN
        radar_archean = competitor_export_radar("ARCHEAN", db)
        assert radar_archean["selected_company"] == "ARCHEAN"
        assert radar_archean["summary"]["total_historical_volume_mt"] > 40000
        assert len(radar_archean["monthly_series"]) >= 24
        assert len(radar_archean["recent_manifests"]) == 15
        assert radar_archean["summary"]["diversion_risk_level"] in ["ELEVATED", "MODERATE", "LOW"]
        assert "China" in radar_archean["recent_manifests"][0]["destination"]
        print(f"3. ARCHEAN_EXPORT_RADAR_AUDIT: PASS ({len(radar_archean['monthly_series'])} months, {radar_archean['summary']['total_historical_volume_mt']} MT total, {len(radar_archean['recent_manifests'])} verified manifests)")

        # 4. Test Export Radar API function for SATYESH
        radar_satyesh = competitor_export_radar("SATYESH", db)
        assert radar_satyesh["selected_company"] == "SATYESH"
        assert radar_satyesh["summary"]["total_historical_volume_mt"] > 10000
        assert len(radar_satyesh["recent_manifests"]) == 15
        print(f"4. SATYESH_EXPORT_RADAR_AUDIT: PASS ({len(radar_satyesh['monthly_series'])} months, {radar_satyesh['summary']['total_historical_volume_mt']} MT total, {len(radar_satyesh['recent_manifests'])} verified manifests)")

        # 5. Confidentiality & Masking
        radar_json = json.dumps(radar_archean) + json.dumps(radar_satyesh)
        assert "customer_name" not in radar_json.lower()
        assert "invoice_no" not in radar_json.lower()
        print("5. CONFIDENTIALITY_AUDIT: PASS (Zero internal customer names or internal sales invoices leaked)")

    print("=== ALL COMPETITOR & EXPORT RADAR QA TESTS PASSED ===")

if __name__ == "__main__":
    test_competitor_satyesh_integration()
