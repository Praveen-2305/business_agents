import time
from typing import Dict, Any
from app.graph.state import AgentState
from app.reporting.generator import ReportArtifactGenerator

def node_report(state: AgentState) -> Dict[str, Any]:
    start_time = time.time()
    session_id = state.get("session_id", "default_session")
    generator = ReportArtifactGenerator(session_id)

    artifacts = generator.generate_all(
        quality=state.get("quality_dashboard", {}),
        reconciliation=state.get("reconciliation_bridge", {}),
        calculation_log=state.get("calculation_log", []),
        executive_narrative=state.get("executive_narrative", ""),
        file_paths=state.get("file_paths", {})
    )

    duration_ms = int((time.time() - start_time) * 1000)
    summary = f"Generated audit artifacts: HTML report, reproduce_audit.py, and calculation_log.json."

    timeline_entry = {
        "node": "report",
        "status": "completed",
        "summary": summary,
        "duration_ms": duration_ms,
        "timestamp": time.strftime("%H:%M:%S")
    }

    return {
        "report_artifacts": artifacts,
        "node_timeline": state.get("node_timeline", []) + [timeline_entry],
        "current_node": "report"
    }
