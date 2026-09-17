import sys
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"

def test_api_dashboard_overview():
    res = client.get("/api/dashboard/bromine-overview")
    assert res.status_code == 200
    data = res.json()
    assert "latest_price" in data
    assert "exports" in data
    assert "imports" in data
    assert "sales" in data

def test_api_prices():
    res = client.get("/api/prices?limit=5")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_api_competitors():
    res = client.get("/api/competitors")
    assert res.status_code == 200
    comps = res.json()
    assert len(comps) >= 2
    tickers = [c.get("ticker") for c in comps]
    assert "ICL" in tickers or "ACI" in tickers

def test_api_competitor_stocks():
    res = client.get("/api/competitors/stocks?ticker=ACI")
    assert res.status_code == 200
    stocks = res.json()
    assert len(stocks) > 0

def test_api_chat_query():
    res = client.post("/api/chat/query", json={"question": "What is the China Bromine price?"})
    assert res.status_code == 200
    ans = res.json()
    assert "answer" in ans
    assert "sources" in ans
    assert len(ans["answer"]) > 10

def test_api_report_generate():
    res = client.post("/api/reports/generate", json={"report_type": "weekly"})
    assert res.status_code == 200
    rep = res.json()
    assert "Weekly Bromine Market Digest" in rep["title"]
    assert "metrics" in rep
