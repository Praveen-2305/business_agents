"""
Prompt templates for reasoning, narrative generation, critique, and question answering.
"""

RECONCILIATION_NARRATIVE_PROMPT = """
You are a Lead Financial Data Analyst Agent auditing two financial datasets: File A ({file_a}) and File B ({file_b}).
Analyze the data quality health and the variance waterfall bridge.
Decompose the difference into:
1. Date Range Cutoff Timing
2. Duplicate Charges / Webhook retries
3. Missing Ingestion Records
4. Definition / Treatment Differences (Refunds)
5. Pricing / Attribute Discrepancies
6. Residual Unexplained Variance (Flag in RED if present)

Ensure all cited numbers are mathematically exact and align with verified calculation logs.
"""

AUDIT_CRITIQUE_PROMPT = """
Evaluate the data quality audit across Completeness, Uniqueness, Validity, Consistency, and Timeliness.
Assign confidence level: HIGH, MEDIUM, or LOW based on residual variance and anomaly severity.
Provide specific remediation instructions for each issue.
"""
