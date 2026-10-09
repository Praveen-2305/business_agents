from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field

# --- File Preview Models ---
class FilePreview(BaseModel):
    filename: str
    rows: int
    columns: int
    column_names: List[str]
    sha256_hash: str
    preview_data: List[Dict[str, Any]] = []

# --- Quality Audit Models ---
class DimensionScore(BaseModel):
    completeness: float
    uniqueness: float
    validity: float
    consistency: float
    timeliness: float
    overall: float

class Finding(BaseModel):
    id: str
    severity: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]
    file: str
    check_name: str
    dimension: Literal["Completeness", "Uniqueness", "Validity", "Consistency", "Timeliness"]
    message: str
    affected_rows_count: int
    sample_row_ids: List[str] = []
    suggested_fix: str

class QualityDashboardData(BaseModel):
    file_scores: Dict[str, DimensionScore]
    overall_score: float
    findings: List[Finding]

# --- Reconciliation Bridge Models ---
class BridgeStep(BaseModel):
    step_id: str
    title: str
    category: Literal[
        "base_file_a",
        "date_range_cutoff",
        "duplicate_records",
        "missing_records",
        "definitions_timing",
        "mismatched_attributes",
        "residual_unexplained",
        "base_file_b"
    ]
    delta_amount: float
    cumulative_amount: float
    rows_affected: int
    hypothesis: str
    sample_rows: List[Dict[str, Any]] = []
    is_residual: bool = False

class ReconciliationBridgeData(BaseModel):
    file_a_name: str
    file_b_name: str
    file_a_metric_name: str
    file_b_metric_name: str
    file_a_total: float
    file_b_total: float
    total_variance: float
    explained_variance: float
    residual_variance: float
    residual_percentage: float
    steps: List[BridgeStep]

# --- Dual-Engine Verification Models ---
class VerificationResult(BaseModel):
    calc_id: str
    claim_name: str
    file_name: str
    columns_used: List[str]
    filters_applied: str
    row_count: int
    pandas_code: str
    sql_query: str
    pandas_result: Any
    sql_result: Any
    variance: float
    verified: bool
    duration_ms: int

# --- Q&A / Answer Card Models ---
class EvidenceChip(BaseModel):
    calc_id: str
    label: str
    file_name: str
    columns: List[str]
    filters: str
    row_count: int
    pandas_code: str
    sql_query: str
    pandas_val: str
    sql_val: str
    verified: bool

class AnswerCard(BaseModel):
    question: str
    headline: str
    confidence: Literal["HIGH", "MEDIUM", "LOW"]
    confidence_reasons: List[str]
    primary_value: str
    per_file_values: Dict[str, Any]
    assumptions: List[str]
    caveats: List[str]
    evidence_chips: List[EvidenceChip]

# --- Unresolved Issues ---
class UnresolvedIssue(BaseModel):
    id: str
    title: str
    severity: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    category: str
    rows_affected: int
    monetary_impact: Optional[float] = None
    recommended_action: str

# --- Full Session State ---
class SessionState(BaseModel):
    session_id: str
    status: Literal["idle", "running", "completed", "error"]
    files: List[FilePreview] = []
    current_node: Optional[str] = None
    node_timeline: List[Dict[str, Any]] = []
    quality: Optional[QualityDashboardData] = None
    reconciliation: Optional[ReconciliationBridgeData] = None
    executive_summary: Optional[str] = None
    unresolved_issues: List[UnresolvedIssue] = []
    calculation_log: List[VerificationResult] = []
    chat_history: List[AnswerCard] = []
    created_at: str

# --- SSE Stream Event Model ---
class NodeStreamEvent(BaseModel):
    node: str
    status: Literal["started", "completed", "error"]
    summary: str
    duration_ms: int = 0
    timestamp: str
