import os
import uuid
import time
import json
import asyncio
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from app.config import settings
from app.schemas.schemas import (
    SessionState,
    FilePreview,
    NodeStreamEvent,
    AnswerCard,
    QualityDashboardData,
    ReconciliationBridgeData,
    UnresolvedIssue,
    VerificationResult
)
from app.graph.builder import NODE_SEQUENCE
from app.graph.state import AgentState
from app.llm.factory import llm_factory
from app.reporting.generator import ReportArtifactGenerator

router = APIRouter(prefix="/sessions", tags=["Sessions"])

# In-memory store for sessions
sessions_store: Dict[str, Dict[str, Any]] = {}

class AskRequest(BaseModel):
    question: str

@router.post("", response_model=SessionState)
async def create_session_with_files(files: List[UploadFile] = File(...)):
    """
    Creates a new audit session by uploading 2 or more CSV files.
    """
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Please upload at least 2 CSV datasets to perform reconciliation.")

    session_id = str(uuid.uuid4())
    session_dir = os.path.join(settings.OUTPUTS_DIR, session_id, "uploads")
    os.makedirs(session_dir, exist_ok=True)

    file_paths: Dict[str, str] = {}
    for upload in files:
        target_path = os.path.join(session_dir, upload.filename)
        content = await upload.read()
        with open(target_path, "wb") as f:
            f.write(content)
        file_paths[upload.filename] = target_path

    # Initial session state
    session_data: Dict[str, Any] = {
        "session_id": session_id,
        "status": "idle",
        "file_paths": file_paths,
        "dataframes": {},
        "files": [],
        "current_node": None,
        "node_timeline": [],
        "quality": None,
        "reconciliation": None,
        "executive_summary": None,
        "unresolved_issues": [],
        "calculation_log": [],
        "chat_history": [],
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    sessions_store[session_id] = session_data

    return _build_session_state_response(session_id)

@router.post("/demo", response_model=SessionState)
async def load_demo_session():
    """
    Creates a new session preloaded with the demo Stripe & NetSuite datasets.
    """
    session_id = str(uuid.uuid4())
    session_dir = os.path.join(settings.OUTPUTS_DIR, session_id, "uploads")
    os.makedirs(session_dir, exist_ok=True)

    file_a_demo = os.path.join(settings.DATA_DIR, "billing_stripe_transactions.csv")
    file_b_demo = os.path.join(settings.DATA_DIR, "erp_general_ledger_revenues.csv")

    if not os.path.exists(file_a_demo) or not os.path.exists(file_b_demo):
        # Generate them on the fly if missing
        from scripts.generate_demo_data import generate_datasets
        generate_datasets(settings.DATA_DIR)

    file_paths = {
        "billing_stripe_transactions.csv": file_a_demo,
        "erp_general_ledger_revenues.csv": file_b_demo
    }

    session_data: Dict[str, Any] = {
        "session_id": session_id,
        "status": "idle",
        "file_paths": file_paths,
        "dataframes": {},
        "files": [],
        "current_node": None,
        "node_timeline": [],
        "quality": None,
        "reconciliation": None,
        "executive_summary": None,
        "unresolved_issues": [],
        "calculation_log": [],
        "chat_history": [],
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    sessions_store[session_id] = session_data

    # Pre-run ingest node to get file previews immediately for the user
    from app.graph.nodes.ingest import node_ingest
    ingest_res = node_ingest({"file_paths": file_paths})
    session_data["dataframes"] = ingest_res["dataframes"]
    session_data["files"] = ingest_res["file_previews"]

    return _build_session_state_response(session_id)

@router.get("/{session_id}/state", response_model=SessionState)
async def get_session_state(session_id: str):
    """
    Returns the current session state so the frontend can restore the audit after a refresh.
    """
    if session_id not in sessions_store:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
    return _build_session_state_response(session_id)

@router.get("/{session_id}/stream")
async def stream_session_nodes(session_id: str):
    """
    Server-Sent Events (SSE) endpoint:
    Emits one event per LangGraph node: {node, status: started|completed, summary, duration_ms}
    Runs through the full 11-node workflow if not already run.
    """
    if session_id not in sessions_store:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    async def event_generator():
        session = sessions_store[session_id]
        
        # If already completed, stream out the historical events
        if session.get("status") == "completed":
            for entry in session.get("node_timeline", []):
                yield f"data: {json.dumps(entry)}\n\n"
            yield f"data: {json.dumps({'node': 'complete', 'status': 'completed', 'summary': 'Audit workflow completed', 'duration_ms': 0})}\n\n"
            return

        session["status"] = "running"
        state: AgentState = {
            "session_id": session_id,
            "file_paths": session.get("file_paths", {}),
            "dataframes": session.get("dataframes", {}),
            "file_previews": session.get("files", []),
            "column_alignments": {},
            "quality_dashboard": {},
            "reconciliation_bridge": {},
            "analysis_plan": [],
            "calculation_log": [],
            "verification_summary": {},
            "critic_evaluation": {},
            "executive_narrative": "",
            "number_guard_passed": True,
            "unresolved_issues": [],
            "report_artifacts": {},
            "node_timeline": [],
            "current_node": None,
            "error": None
        }

        # Step through each node in the LangGraph sequence
        for node_name, node_fn in NODE_SEQUENCE:
            # Emit "started"
            started_event = {
                "node": node_name,
                "status": "started",
                "summary": f"Executing node '{node_name}'...",
                "duration_ms": 0,
                "timestamp": time.strftime("%H:%M:%S")
            }
            yield f"data: {json.dumps(started_event)}\n\n"
            await asyncio.sleep(0.05) # small yield to flush SSE event

            # Run node execution
            try:
                update_dict = node_fn(state)
                state.update(update_dict)
                session["current_node"] = node_name

                # Grab completed timeline entry
                completed_entry = state["node_timeline"][-1]
                yield f"data: {json.dumps(completed_entry)}\n\n"
                await asyncio.sleep(0.08)

            except Exception as e:
                err_event = {
                    "node": node_name,
                    "status": "error",
                    "summary": f"Failed in node '{node_name}': {str(e)}",
                    "duration_ms": 0,
                    "timestamp": time.strftime("%H:%M:%S")
                }
                yield f"data: {json.dumps(err_event)}\n\n"
                session["status"] = "error"
                return

        # Save finalized state back to session store
        session["status"] = "completed"
        session["dataframes"] = state.get("dataframes", {})
        session["files"] = state.get("file_previews", [])
        session["node_timeline"] = state.get("node_timeline", [])
        session["quality"] = state.get("quality_dashboard")
        session["reconciliation"] = state.get("reconciliation_bridge")
        session["executive_summary"] = state.get("executive_narrative")
        session["unresolved_issues"] = state.get("unresolved_issues", [])
        session["calculation_log"] = state.get("calculation_log", [])

        # Emit final workflow complete signal
        final_signal = {
            "node": "workflow_complete",
            "status": "completed",
            "summary": "All 11 LangGraph nodes completed with verified audit outputs.",
            "duration_ms": sum(e.get("duration_ms", 0) for e in session["node_timeline"]),
            "timestamp": time.strftime("%H:%M:%S")
        }
        yield f"data: {json.dumps(final_signal)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/{session_id}/ask", response_model=AnswerCard)
async def ask_question(session_id: str, payload: AskRequest):
    """
    Natural Language Q&A endpoint reusing the session state.
    Returns AnswerCard with confidence rating, per-file side-by-side values,
    assumptions, caveats, and evidence chips.
    """
    if session_id not in sessions_store:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    session = sessions_store[session_id]
    question = payload.question

    answer_dict = llm_factory.answer_question(
        question=question,
        state_dict=session,
        dual_engine_results=session.get("calculation_log", [])
    )

    card = AnswerCard(**answer_dict)
    session.setdefault("chat_history", []).append(card.model_dump())
    return card

# --- Download Endpoints ---
@router.get("/{session_id}/downloads/report")
async def download_html_report(session_id: str):
    path = os.path.join(settings.OUTPUTS_DIR, session_id, "report.html")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="HTML report artifact not yet generated. Please run audit first.")
    return FileResponse(path, media_type="text/html", filename=f"audit_report_{session_id[:8]}.html")

@router.get("/{session_id}/downloads/reproduce")
async def download_reproduce_script(session_id: str):
    path = os.path.join(settings.OUTPUTS_DIR, session_id, "reproduce_audit.py")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Reproduction script not found. Please run audit first.")
    return FileResponse(path, media_type="text/x-python", filename=f"reproduce_audit_{session_id[:8]}.py")

@router.get("/{session_id}/downloads/calculations")
async def download_calculation_log(session_id: str):
    path = os.path.join(settings.OUTPUTS_DIR, session_id, "calculation_log.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Calculation log not found. Please run audit first.")
    return FileResponse(path, media_type="application/json", filename=f"calculation_log_{session_id[:8]}.json")

def _build_session_state_response(session_id: str) -> SessionState:
    session = sessions_store[session_id]
    return SessionState(
        session_id=session["session_id"],
        status=session["status"],
        files=[FilePreview(**f) for f in session.get("files", [])],
        current_node=session.get("current_node"),
        node_timeline=session.get("node_timeline", []),
        quality=QualityDashboardData(**session["quality"]) if session.get("quality") else None,
        reconciliation=ReconciliationBridgeData(**session["reconciliation"]) if session.get("reconciliation") else None,
        executive_summary=session.get("executive_summary"),
        unresolved_issues=[UnresolvedIssue(**i) for i in session.get("unresolved_issues", [])],
        calculation_log=[VerificationResult(**c) for c in session.get("calculation_log", [])],
        chat_history=[AnswerCard(**c) for c in session.get("chat_history", [])],
        created_at=session["created_at"]
    )
