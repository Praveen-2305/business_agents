import time
from typing import Dict, Any
from app.graph.state import AgentState
from app.tools.reconciler import ReconciliationEngine

def node_reconcile(state: AgentState) -> Dict[str, Any]:
    start_time = time.time()
    dfs = state.get("dataframes", {})
    reconciler = ReconciliationEngine(dfs)
    bridge_data = reconciler.reconcile()

    file_a = bridge_data.file_a_name
    file_b = bridge_data.file_b_name
    tot_a = bridge_data.file_a_total
    tot_b = bridge_data.file_b_total
    steps_count = len(bridge_data.steps)
    residual = bridge_data.residual_variance

    duration_ms = int((time.time() - start_time) * 1000)
    summary = (
        f"Reconciled {file_a} (${tot_a:,.2f}) to {file_b} (${tot_b:,.2f}) "
        f"across {steps_count} bridge steps (Residual variance: ${residual:,.2f})."
    )

    timeline_entry = {
        "node": "reconcile",
        "status": "completed",
        "summary": summary,
        "duration_ms": duration_ms,
        "timestamp": time.strftime("%H:%M:%S")
    }

    return {
        "reconciliation_bridge": bridge_data.model_dump(),
        "node_timeline": state.get("node_timeline", []) + [timeline_entry],
        "current_node": "reconcile"
    }
