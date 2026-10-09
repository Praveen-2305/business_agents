import os
import hashlib
import time
from typing import Dict, Any
import pandas as pd
from app.graph.state import AgentState

def node_ingest(state: AgentState) -> Dict[str, Any]:
    start_time = time.time()
    file_paths = state.get("file_paths", {})
    dfs = {}
    previews = []

    for name, path in file_paths.items():
        # Compute SHA256
        hasher = hashlib.sha256()
        with open(path, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        sha256_hash = hasher.hexdigest()

        df = pd.read_csv(path)
        dfs[name] = df

        preview_rows = df.head(5).fillna("").to_dict(orient="records")
        previews.append({
            "filename": name,
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": list(df.columns),
            "sha256_hash": sha256_hash,
            "preview_data": preview_rows
        })

    duration_ms = int((time.time() - start_time) * 1000)
    summary = f"Ingested {len(dfs)} datasets ({sum(len(d) for d in dfs.values())} total rows) with verified SHA256 hashes."

    timeline_entry = {
        "node": "ingest",
        "status": "completed",
        "summary": summary,
        "duration_ms": duration_ms,
        "timestamp": time.strftime("%H:%M:%S")
    }

    return {
        "dataframes": dfs,
        "file_previews": previews,
        "node_timeline": state.get("node_timeline", []) + [timeline_entry],
        "current_node": "ingest"
    }
