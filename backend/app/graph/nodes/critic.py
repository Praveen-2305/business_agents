import time
from typing import Dict, Any, List
from app.graph.state import AgentState

def node_critic(state: AgentState) -> Dict[str, Any]:
    start_time = time.time()
    quality = state.get("quality_dashboard", {})
    recon = state.get("reconciliation_bridge", {})
    findings = quality.get("findings", [])
    residual = recon.get("residual_variance", 0.0)
    q_score = quality.get("overall_score", 100.0)

    unresolved: List[Dict[str, Any]] = []

    # 1. Residual variance issue
    if abs(residual) > 0.01:
        unresolved.append({
            "id": "ISS-1",
            "title": f"Unexplained Residual Variance of ${abs(residual):,.2f}",
            "severity": "CRITICAL",
            "category": "Reconciliation Residual",
            "rows_affected": 1,
            "monetary_impact": abs(residual),
            "recommended_action": "Audit ledger entry `TXN-1055` against Stripe payout batch report to eliminate unexplained variance."
        })

    # 2. Critical/High quality findings
    for idx, f in enumerate(findings):
        if f.get("severity") in ["CRITICAL", "HIGH"]:
            unresolved.append({
                "id": f"ISS-{len(unresolved) + 1}",
                "title": f"{f.get('check_name')} in {f.get('file')}",
                "severity": f.get("severity"),
                "category": f.get("dimension"),
                "rows_affected": f.get("affected_rows_count", 0),
                "monetary_impact": None,
                "recommended_action": f.get("suggested_fix")
            })

    # Determine confidence
    if abs(residual) > 5000.0 or q_score < 80.0:
        confidence = "LOW"
    elif abs(residual) > 0.01 or q_score < 95.0:
        confidence = "MEDIUM"
    else:
        confidence = "HIGH"

    duration_ms = int((time.time() - start_time) * 1000)
    summary = (
        f"Critic evaluation completed: Assigned {confidence} confidence rating. "
        f"Flagged {len(unresolved)} actionable unresolved issues."
    )

    timeline_entry = {
        "node": "critic",
        "status": "completed",
        "summary": summary,
        "duration_ms": duration_ms,
        "timestamp": time.strftime("%H:%M:%S")
    }

    return {
        "critic_evaluation": {
            "confidence": confidence,
            "overall_health": "ACCEPTABLE" if confidence != "LOW" else "REQUIRES_ATTENTION",
            "unresolved_count": len(unresolved)
        },
        "unresolved_issues": unresolved,
        "node_timeline": state.get("node_timeline", []) + [timeline_entry],
        "current_node": "critic"
    }
