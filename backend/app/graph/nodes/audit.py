import time
from typing import Dict, Any
from app.graph.state import AgentState
from app.tools.quality_checks import QualityAuditor

def node_audit(state: AgentState) -> Dict[str, Any]:
    start_time = time.time()
    dfs = state.get("dataframes", {})
    auditor = QualityAuditor(dfs)
    dashboard_data = auditor.audit()

    findings = dashboard_data.findings
    critical_count = sum(1 for f in findings if f.severity == "CRITICAL")
    high_count = sum(1 for f in findings if f.severity == "HIGH")

    duration_ms = int((time.time() - start_time) * 1000)
    summary = (
        f"Data quality audit completed: {dashboard_data.overall_score:.1f}/100 health score. "
        f"Identified {len(findings)} findings ({critical_count} CRITICAL, {high_count} HIGH)."
    )

    timeline_entry = {
        "node": "audit",
        "status": "completed",
        "summary": summary,
        "duration_ms": duration_ms,
        "timestamp": time.strftime("%H:%M:%S")
    }

    return {
        "quality_dashboard": dashboard_data.model_dump(),
        "node_timeline": state.get("node_timeline", []) + [timeline_entry],
        "current_node": "audit"
    }
