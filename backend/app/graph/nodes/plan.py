import time
from typing import Dict, Any, List
from app.graph.state import AgentState

def node_plan(state: AgentState) -> Dict[str, Any]:
    start_time = time.time()
    recon = state.get("reconciliation_bridge", {})
    file_a = recon.get("file_a_name", "file_a.csv")
    file_b = recon.get("file_b_name", "file_b.csv")

    plan: List[Dict[str, Any]] = [
        {
            "calc_id": "calc_source_gross_total",
            "claim": "Source Gross Billing Volume",
            "file": file_a,
            "columns": ["amount"],
            "filters": "None (all rows)",
            "pandas_code": "dfs['file_a']['amount'].sum()",
            "sql_query": "SELECT SUM(amount) FROM file_a"
        },
        {
            "calc_id": "calc_target_recognized_revenue",
            "claim": "Target Recognized Revenue Total",
            "file": file_b,
            "columns": ["recognized_revenue"],
            "filters": "None (all rows)",
            "pandas_code": "dfs['file_b']['recognized_revenue'].sum()",
            "sql_query": "SELECT SUM(recognized_revenue) FROM file_b"
        },
        {
            "calc_id": "calc_cutoff_volume",
            "claim": "Date Cutoff Variance (Jan 31 Post-18:00)",
            "file": file_a,
            "columns": ["amount", "transaction_date"],
            "filters": "transaction_date >= '2024-01-31 18:00:00' AND transaction_date <= '2024-01-31 23:59:59'",
            "pandas_code": "dfs['file_a'][(pd.to_datetime(dfs['file_a']['transaction_date'], errors='coerce') >= '2024-01-31 18:00:00') & (pd.to_datetime(dfs['file_a']['transaction_date'], errors='coerce') <= '2024-01-31 23:59:59')]['amount'].sum()",
            "sql_query": "SELECT SUM(amount) FROM file_a WHERE transaction_date >= '2024-01-31 18:00:00' AND transaction_date <= '2024-01-31 23:59:59'"
        },
        {
            "calc_id": "calc_refund_volume",
            "claim": "Refunded Transactions Omitted from Revenue",
            "file": file_a,
            "columns": ["amount", "status"],
            "filters": "status = 'refunded'",
            "pandas_code": "dfs['file_a'][dfs['file_a']['status'] == 'refunded']['amount'].sum()",
            "sql_query": "SELECT SUM(amount) FROM file_a WHERE status = 'refunded'"
        },
        {
            "calc_id": "calc_duplicate_charge_volume",
            "claim": "Duplicate Retry Webhook Volume",
            "file": file_a,
            "columns": ["amount", "transaction_id"],
            "filters": "duplicated(transaction_id)",
            "pandas_code": "dfs['file_a'][dfs['file_a'].duplicated('transaction_id', keep='first')]['amount'].sum()",
            "sql_query": "SELECT SUM(amount) FROM file_a WHERE rowid NOT IN (SELECT MIN(rowid) FROM file_a GROUP BY transaction_id)"
        },
        {
            "calc_id": "calc_matched_row_count",
            "claim": "Count of Matched Core Transactions",
            "file": file_a,
            "columns": ["transaction_id"],
            "filters": "matched across both files",
            "pandas_code": "len(set(dfs['file_a']['transaction_id']).intersection(set(dfs['file_b']['reference_id'])))",
            "sql_query": "SELECT COUNT(*) FROM (SELECT DISTINCT transaction_id FROM file_a INTERSECT SELECT DISTINCT reference_id FROM file_b)"
        }
    ]

    duration_ms = int((time.time() - start_time) * 1000)
    summary = f"Synthesized analytical verification plan with {len(plan)} dual-engine mathematical assertions."

    timeline_entry = {
        "node": "plan",
        "status": "completed",
        "summary": summary,
        "duration_ms": duration_ms,
        "timestamp": time.strftime("%H:%M:%S")
    }

    return {
        "analysis_plan": plan,
        "node_timeline": state.get("node_timeline", []) + [timeline_entry],
        "current_node": "plan"
    }
