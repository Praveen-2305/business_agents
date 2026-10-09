import time
from typing import Dict, Any
import pandas as pd
from app.graph.state import AgentState

def node_align(state: AgentState) -> Dict[str, Any]:
    start_time = time.time()
    dfs = state.get("dataframes", {})
    keys = list(dfs.keys())

    if len(keys) < 2:
        summary = "Single dataset ingested; skipped multi-table key alignment."
        alignment = {"status": "single_file"}
    else:
        df_a = dfs[keys[0]]
        df_b = dfs[keys[1]]

        key_a = next((c for c in df_a.columns if "id" in c.lower()), df_a.columns[0])
        key_b = next((c for c in df_b.columns if "id" in c.lower()), df_b.columns[0])

        metric_a = next((c for c in df_a.columns if any(m in c.lower() for m in ["amount", "revenue", "total"])), df_a.columns[1])
        metric_b = next((c for c in df_b.columns if any(m in c.lower() for m in ["amount", "revenue", "total"])), df_b.columns[1])

        set_a = set(df_a[key_a].dropna().astype(str))
        set_b = set(df_b[key_b].dropna().astype(str))
        overlap = len(set_a.intersection(set_b))
        overlap_pct = round(overlap / max(len(set_a), 1) * 100, 1)

        alignment = {
            "key_mapping": {keys[0]: key_a, keys[1]: key_b},
            "metric_mapping": {keys[0]: metric_a, keys[1]: metric_b},
            "matched_keys_count": overlap,
            "match_rate_pct": overlap_pct
        }
        summary = f"Aligned primary keys '{key_a}' <-> '{key_b}' with {overlap_pct}% key intersection ({overlap} shared records)."

    duration_ms = int((time.time() - start_time) * 1000)
    timeline_entry = {
        "node": "align",
        "status": "completed",
        "summary": summary,
        "duration_ms": duration_ms,
        "timestamp": time.strftime("%H:%M:%S")
    }

    return {
        "column_alignments": alignment,
        "node_timeline": state.get("node_timeline", []) + [timeline_entry],
        "current_node": "align"
    }
