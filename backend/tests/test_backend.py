import os
import pytest
import pandas as pd
from fastapi.testclient import TestClient

from app.main import app
from app.tools.dual_engine import DualEngine
from app.tools.quality_checks import QualityAuditor
from app.tools.reconciler import ReconciliationEngine
from app.graph.nodes.ingest import node_ingest

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_dual_engine_execution():
    df = pd.DataFrame({
        "transaction_id": ["TXN-1", "TXN-2", "TXN-3"],
        "amount": [100.0, 250.50, 49.50]
    })
    engine = DualEngine({"file_a": df})
    res = engine.execute_and_verify(
        calc_id="test_calc",
        claim_name="Test Sum",
        file_name="file_a",
        columns=["amount"],
        filters_applied="None",
        pandas_fn=lambda d: float(d["file_a"]["amount"].sum()),
        pandas_code_str="df['amount'].sum()",
        sql_query="SELECT SUM(amount) FROM file_a"
    )
    assert res["verified"] is True
    assert res["variance"] == 0.0
    assert res["pandas_result"] == 400.0
    assert res["sql_result"] == 400.0

def test_quality_checks():
    df = pd.DataFrame({
        "id": ["1", "2", "2", None],
        "amount": [100.0, -50.0, 20.0, 30.0],
        "date": ["2024-01-01", "2024-01-02", "bad_date", "2024-01-04"]
    })
    auditor = QualityAuditor({"test_file.csv": df})
    dashboard = auditor.audit()

    assert dashboard.overall_score < 100.0
    assert len(dashboard.findings) > 0
    dimensions_found = {f.dimension for f in dashboard.findings}
    assert "Completeness" in dimensions_found
    assert "Uniqueness" in dimensions_found
    assert "Validity" in dimensions_found

def test_demo_session_and_flow():
    # 1. Load demo session
    resp = client.post("/sessions/demo")
    assert resp.status_code == 200
    data = resp.json()
    session_id = data["session_id"]
    assert len(data["files"]) == 2

    # 2. Check session state
    state_resp = client.get(f"/sessions/{session_id}/state")
    assert state_resp.status_code == 200
    assert state_resp.json()["session_id"] == session_id

    # 3. Test Q&A
    ask_resp = client.post(f"/sessions/{session_id}/ask", json={"question": "Why is File B revenue lower than File A?"})
    assert ask_resp.status_code == 200
    ans_data = ask_resp.json()
    assert ans_data["confidence"] in ["HIGH", "MEDIUM", "LOW"]
    assert len(ans_data["confidence_reasons"]) > 0
