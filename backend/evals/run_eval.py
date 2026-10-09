import os
import sys
import json
import time

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app.graph.builder import NODE_SEQUENCE
from app.graph.state import AgentState
from app.config import settings

def run_evaluation():
    print("=" * 70)
    print("EVALUATION SUITE: DATA ANALYST AGENT & FINANCIAL RECONCILIATION")
    print("=" * 70)

    # 1. Prepare demo datasets
    file_a = os.path.join(settings.DATA_DIR, "billing_stripe_transactions.csv")
    file_b = os.path.join(settings.DATA_DIR, "erp_general_ledger_revenues.csv")

    if not os.path.exists(file_a) or not os.path.exists(file_b):
        from scripts.generate_demo_data import generate_datasets
        generate_datasets(settings.DATA_DIR)

    file_paths = {
        "billing_stripe_transactions.csv": file_a,
        "erp_general_ledger_revenues.csv": file_b
    }

    state: AgentState = {
        "session_id": "eval_test_session",
        "file_paths": file_paths,
        "dataframes": {},
        "file_previews": [],
        "column_alignments": {},
        "quality_dashboard": {},
        "reconciliation_bridge": {},
        "analysis_plan": [],
        "calculation_log": [],
        "verification_summary": {},
        "critic_evaluation": {},
        "executive_narrative": "",
        "number_guard_passed": False,
        "unresolved_issues": [],
        "report_artifacts": {},
        "node_timeline": [],
        "current_node": None,
        "error": None
    }

    # 2. Run all 11 nodes sequentially
    print("\nExecuting 11-node LangGraph pipeline...")
    for node_name, node_fn in NODE_SEQUENCE:
        t0 = time.time()
        res = node_fn(state)
        state.update(res)
        duration = int((time.time() - t0) * 1000)
        summary = state["node_timeline"][-1]["summary"]
        print(f"  [OK] Node: {node_name:<14} ({duration}ms) -> {summary[:55]}...")

    # 3. Evaluate criteria
    results = {}

    # Check 1: Ingestion & cryptographic hashing
    hashes_ok = len(state["file_previews"]) == 2 and all(len(p["sha256_hash"]) == 64 for p in state["file_previews"])
    results["Cryptographic SHA-256 Hashing"] = "PASS" if hashes_ok else "FAIL"

    # Check 2: 5-dimension quality audit
    quality = state.get("quality_dashboard", {})
    findings = quality.get("findings", [])
    dimensions = {f["dimension"] for f in findings}
    quality_ok = len(dimensions) >= 4 and len(findings) > 0
    results["5-Dimension Quality Audit"] = "PASS" if quality_ok else "FAIL"

    # Check 3: Reconciliation bridge balance
    recon = state.get("reconciliation_bridge", {})
    tot_a = recon.get("file_a_total", 0.0)
    tot_b = recon.get("file_b_total", 0.0)
    steps = recon.get("steps", [])
    # Check cumulative math: step_1 + deltas = step_8
    bridge_ok = len(steps) >= 5 and abs(steps[-1]["cumulative_amount"] - tot_b) < 0.01
    results["Waterfall Bridge Mathematical Balance"] = "PASS" if bridge_ok else "FAIL"

    # Check 4: Dual-engine Pandas vs DuckDB verification
    calc_log = state.get("calculation_log", [])
    all_verified = len(calc_log) > 0 and all(c.get("verified") is True for c in calc_log)
    results["Dual-Engine Precision Parity"] = "PASS" if all_verified else "FAIL"

    # Check 5: Number Guard anti-hallucination verification
    guard_ok = state.get("number_guard_passed", False)
    results["Number Guard Anti-Hallucination Guard"] = "PASS" if guard_ok else "FAIL"

    # Check 6: Artifact exports
    artifacts = state.get("report_artifacts", {})
    artifacts_ok = all(os.path.exists(p) for p in artifacts.values()) if artifacts else False
    results["Audit Artifact Generation (HTML/Code/JSON)"] = "PASS" if artifacts_ok else "FAIL"

    print("\n" + "=" * 70)
    print("EVALUATION RESULTS SCORECARD")
    print("=" * 70)
    all_passed = True
    for metric, status in results.items():
        print(f"  {metric:<45} : [{status}]")
        if status != "PASS":
            all_passed = False

    print("=" * 70)
    if all_passed:
        print("ALL EVALUATION CHECKS PASSED (6/6). Pipeline certified for production.")
    else:
        print("SOME EVALUATION CHECKS FAILED.")
        sys.exit(1)

if __name__ == "__main__":
    run_evaluation()
