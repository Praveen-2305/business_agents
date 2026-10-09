export type FilePreview = {
  filename: string;
  rows: number;
  columns: number;
  column_names: string[];
  sha256_hash: string;
  preview_data: Record<string, any>[];
};

export type DimensionScore = {
  completeness: number;
  uniqueness: number;
  validity: number;
  consistency: number;
  timeliness: number;
  overall: number;
};

export type Finding = {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  file: string;
  check_name: string;
  dimension: "Completeness" | "Uniqueness" | "Validity" | "Consistency" | "Timeliness";
  message: string;
  affected_rows_count: number;
  sample_row_ids: string[];
  suggested_fix: string;
};

export type QualityDashboardData = {
  file_scores: Record<string, DimensionScore>;
  overall_score: number;
  findings: Finding[];
};

export type BridgeStep = {
  step_id: string;
  title: string;
  category:
    | "base_file_a"
    | "date_range_cutoff"
    | "duplicate_records"
    | "missing_records"
    | "definitions_timing"
    | "mismatched_attributes"
    | "residual_unexplained"
    | "base_file_b";
  delta_amount: number;
  cumulative_amount: number;
  rows_affected: number;
  hypothesis: string;
  sample_rows: Record<string, any>[];
  is_residual: boolean;
};

export type ReconciliationBridgeData = {
  file_a_name: string;
  file_b_name: string;
  file_a_metric_name: string;
  file_b_metric_name: string;
  file_a_total: number;
  file_b_total: number;
  total_variance: number;
  explained_variance: number;
  residual_variance: number;
  residual_percentage: number;
  steps: BridgeStep[];
};

export type VerificationResult = {
  calc_id: string;
  claim_name: string;
  file_name: string;
  columns_used: string[];
  filters_applied: string;
  row_count: number;
  pandas_code: string;
  sql_query: string;
  pandas_result: any;
  sql_result: any;
  variance: number;
  verified: boolean;
  duration_ms: number;
};

export type EvidenceChip = {
  calc_id: string;
  label: string;
  file_name: string;
  columns: string[];
  filters: string;
  row_count: number;
  pandas_code: string;
  sql_query: string;
  pandas_val: string;
  sql_val: string;
  verified: boolean;
};

export type AnswerCard = {
  question: string;
  headline: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  confidence_reasons: string[];
  primary_value: string;
  per_file_values: Record<string, any>;
  assumptions: string[];
  caveats: string[];
  evidence_chips: EvidenceChip[];
};

export type UnresolvedIssue = {
  id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  category: string;
  rows_affected: number;
  monetary_impact?: number | null;
  recommended_action: string;
};

export type NodeStreamEvent = {
  node: string;
  status: "started" | "completed" | "error";
  summary: string;
  duration_ms: number;
  timestamp: string;
};

export type SessionState = {
  session_id: string;
  status: "idle" | "running" | "completed" | "error";
  files: FilePreview[];
  current_node?: string | null;
  node_timeline: NodeStreamEvent[];
  quality?: QualityDashboardData | null;
  reconciliation?: ReconciliationBridgeData | null;
  executive_summary?: string | null;
  unresolved_issues: UnresolvedIssue[];
  calculation_log: VerificationResult[];
  chat_history: AnswerCard[];
  created_at: string;
};
