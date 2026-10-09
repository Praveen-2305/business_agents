import time
from typing import Dict, Any
from app.graph.state import AgentState

def node_verify(state: AgentState) -> Dict[str, Any]:
    start_time = time.time()
    calc_log = state.get("calculation_log", [])

    verified_count = sum(1 for c in calc_log if c.get("verified", False))
    total_count = len(calc_log)
    max_variance = max((c.get("variance", 0.0) for c in calc_log), default=0.0)

    summary_status = "PASSED" if verified_count == total_count else "FAILED_CHECK"

    duration_ms = int((time.time() - start_time) * 1000)
    summary = (
        f"Dual-engine verification {summary_status}: {verified_count}/{total_count} assertions verified "
        f"(max variance: {max_variance:.6f})."
    )

    timeline_entry = {
        "node": "verify",
        "status": "completed",
        "summary": summary,
        "duration_ms": duration_ms,
        "timestamp": time.strftime("%H:%M:%S")
    }

    return {
        "verification_summary": {
            "status": summary_status,
            "verified_count": verified_count,
            "total_count": total_count,
            "max_variance": max_variance
        },
        "node_timeline": state.get("node_timeline", []) + [timeline_entry],
        "current_node": "verify"
    }
