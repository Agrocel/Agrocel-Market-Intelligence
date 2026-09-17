import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_executive_brief_latest():
    res = client.get("/api/executive-briefs/latest?product=bromine")
    assert res.status_code == 200
    data = res.json()
    assert "id" in data
    assert data["product"] == "Bromine"
    assert "overall_market_direction" in data
    assert data["overall_market_direction"] in ["BULLISH", "BEARISH", "MIXED", "STABLE"]
    assert "executive_summary" in data
    assert "why_it_matters" in data
    assert "management_attention" in data
    assert "market_narrative" in data
    assert data["market_narrative"] is not None
    assert "who_did_what" in data["market_narrative"]
    assert len(data["market_narrative"]["who_did_what"]) >= 3
    assert "sections" in data
    assert len(data["sections"]) >= 8

    # Verify section types match specification
    expected_section_types = [
        "THIS_WEEK", "WHAT_CHANGED", "WHY_IT_MATTERS", "MARKET_EVIDENCE",
        "COMPETITOR_WATCH", "RISKS_OPPORTUNITIES", "MANAGEMENT_ATTENTION", "INTELLIGENCE_SOURCES"
    ]
    actual_section_types = [s["section_type"] for s in data["sections"]]
    for est in expected_section_types:
        assert est in actual_section_types, f"Missing expected section: {est}"

    # Verify citations
    assert "citations" in data
    assert len(data["citations"]) > 0
    for cit in data["citations"]:
        assert cit["reliability_grade"] in ["A", "B", "C", "D"]

def test_api_executive_brief_history():
    res = client.get("/api/executive-briefs/history?product=bromine")
    assert res.status_code == 200
    history = res.json()
    assert isinstance(history, list)
    assert len(history) >= 1
    item = history[0]
    assert "id" in item
    assert "period_start" in item
    assert "period_end" in item
    assert "overall_market_direction" in item

def test_api_executive_brief_by_id():
    # First get latest id
    latest = client.get("/api/executive-briefs/latest").json()
    brief_id = latest["id"]

    res = client.get(f"/api/executive-briefs/{brief_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == brief_id
    assert len(data["sections"]) >= 8

def test_api_executive_brief_citations():
    latest = client.get("/api/executive-briefs/latest").json()
    brief_id = latest["id"]

    res = client.get(f"/api/executive-briefs/{brief_id}/citations")
    assert res.status_code == 200
    citations = res.json()
    assert isinstance(citations, list)
    assert len(citations) > 0
    assert "source_title" in citations[0]
    assert "reliability_grade" in citations[0]

def test_api_executive_brief_market_evidence():
    latest = client.get("/api/executive-briefs/latest").json()
    brief_id = latest["id"]

    res = client.get(f"/api/executive-briefs/{brief_id}/market-evidence")
    assert res.status_code == 200
    evidence = res.json()
    assert "brief_id" in evidence
    assert "prices" in evidence
    assert "trade" in evidence
    assert "stocks" in evidence

def test_api_executive_brief_generate_weekly():
    res = client.post("/api/executive-briefs/generate-weekly", json={"product": "bromine", "force": True})
    assert res.status_code == 200
    new_brief = res.json()
    assert "id" in new_brief
    assert len(new_brief["sections"]) >= 8
    assert len(new_brief["citations"]) >= 3

