import time
from typing import Dict, Any
from app.graph.state import AgentState
from app.llm.factory import llm_factory

def node_compose(state: AgentState) -> Dict[str, Any]:
    start_time = time.time()
    recon = state.get("reconciliation_bridge", {})
    quality = state.get("quality_dashboard", {})
    align = state.get("column_alignments", {})

    narrative = llm_factory.generate_narrative(
        summary_stats=align,
        quality_data=quality,
        reconciliation_data=recon
    )

    duration_ms = int((time.time() - start_time) * 1000)
    summary = "Composed executive audit narrative and structural variance decomposition."

    timeline_entry = {
        "node": "compose",
        "status": "completed",
        "summary": summary,
        "duration_ms": duration_ms,
        "timestamp": time.strftime("%H:%M:%S")
    }

    return {
        "executive_narrative": narrative,
        "node_timeline": state.get("node_timeline", []) + [timeline_entry],
        "current_node": "compose"
    }
