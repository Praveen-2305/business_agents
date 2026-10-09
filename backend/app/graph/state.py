from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    session_id: str
    file_paths: Dict[str, str] # filename -> absolute path
    dataframes: Dict[str, Any] # filename -> pd.DataFrame
    file_previews: List[Dict[str, Any]]
    column_alignments: Dict[str, Any]
    quality_dashboard: Dict[str, Any]
    reconciliation_bridge: Dict[str, Any]
    analysis_plan: List[Dict[str, Any]]
    calculation_log: List[Dict[str, Any]]
    verification_summary: Dict[str, Any]
    critic_evaluation: Dict[str, Any]
    executive_narrative: str
    number_guard_passed: bool
    unresolved_issues: List[Dict[str, Any]]
    report_artifacts: Dict[str, str] # filename -> path
    node_timeline: List[Dict[str, Any]]
    current_node: Optional[str]
    error: Optional[str]
