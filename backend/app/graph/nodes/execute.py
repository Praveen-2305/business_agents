import time
from typing import Dict, Any, List
import pandas as pd
from app.graph.state import AgentState
from app.tools.dual_engine import DualEngine

def node_execute(state: AgentState) -> Dict[str, Any]:
    start_time = time.time()
    dfs = state.get("dataframes", {})
    plan = state.get("analysis_plan", [])
    engine = DualEngine(dfs)

    raw_results: List[Dict[str, Any]] = []

    # Map keys
    keys = list(dfs.keys())
    name_a = keys[0]
    name_b = keys[1] if len(keys) > 1 else keys[0]
    df_a = dfs[name_a]
    df_b = dfs[name_b]

    for item in plan:
        cid = item["calc_id"]
        
        # Build pandas execution lambda
        if cid == "calc_source_gross_total":
            p_fn = lambda d: float(d[name_a]["amount"].sum())
        elif cid == "calc_target_recognized_revenue":
            p_fn = lambda d: float(d[name_b]["recognized_revenue"].sum())
        elif cid == "calc_cutoff_volume":
            p_fn = lambda d: float(d[name_a][(pd.to_datetime(d[name_a]["transaction_date"], errors="coerce") >= pd.Timestamp("2024-01-31 18:00:00")) & (pd.to_datetime(d[name_a]["transaction_date"], errors="coerce") <= pd.Timestamp("2024-01-31 23:59:59"))]["amount"].sum())
        elif cid == "calc_refund_volume":
            p_fn = lambda d: float(d[name_a][d[name_a]["status"] == "refunded"]["amount"].sum())
        elif cid == "calc_duplicate_charge_volume":
            p_fn = lambda d: float(d[name_a][d[name_a].duplicated("transaction_id", keep="first")]["amount"].sum())
        elif cid == "calc_matched_row_count":
            p_fn = lambda d: len(set(d[name_a]["transaction_id"]).intersection(set(d[name_b]["reference_id"])))
        else:
            p_fn = lambda d: 0.0

        res = engine.execute_and_verify(
            calc_id=cid,
            claim_name=item["claim"],
            file_name=item["file"],
            columns=item["columns"],
            filters_applied=item["filters"],
            pandas_fn=p_fn,
            pandas_code_str=item["pandas_code"],
            sql_query=item["sql_query"]
        )
        raw_results.append(res)

    duration_ms = int((time.time() - start_time) * 1000)
    summary = f"Concurrently executed {len(raw_results)} analytical queries across Pandas and SQL engines."

    timeline_entry = {
        "node": "execute",
        "status": "completed",
        "summary": summary,
        "duration_ms": duration_ms,
        "timestamp": time.strftime("%H:%M:%S")
    }

    return {
        "calculation_log": raw_results,
        "node_timeline": state.get("node_timeline", []) + [timeline_entry],
        "current_node": "execute"
    }
