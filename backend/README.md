# Data Analyst Agent - Backend Service

FastAPI service powering autonomous multi-dataset data quality audits and financial reconciliation with LangGraph and dual-engine execution.

## Key Features
- **11-Node LangGraph Pipeline**: Sequential deterministic reasoning graph with real-time SSE streaming.
- **Dual Execution Engine (Pandas vs DuckDB/SQL)**: Compares analytical calculations between Pandas vectorized operations and SQL query execution to guarantee zero mathematical hallucinations.
- **5-Dimension Quality Auditing**: Completeness, Uniqueness, Validity, Consistency, and Timeliness inspection with automatic remediation generation.
- **Financial Waterfall Reconciler**: Attribute variance bridge decomposing total delta into Cutoff, Duplicates, Missing syncs, Definition differences, and Residual unexplained gap.
- **Anti-Hallucination Number Guard**: Verifies that 100% of figures cited in executive narratives match registered entries in the calculation log.

## Installation & Running

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## API Endpoints
- `POST /sessions` - Upload 2+ CSV datasets
- `POST /sessions/demo` - Initialize session with demo Stripe & NetSuite datasets
- `GET /sessions/{id}/state` - Retrieve full session state (supports refresh)
- `GET /sessions/{id}/stream` - SSE endpoint streaming live LangGraph node events
- `POST /sessions/{id}/ask` - Natural language analytical query endpoint
- `GET /sessions/{id}/downloads/report` - Download HTML report
- `GET /sessions/{id}/downloads/reproduce` - Download Python reproduction script
- `GET /sessions/{id}/downloads/calculations` - Download calculation_log.json

## Testing & Evals
```bash
python -m pytest tests/
python evals/run_eval.py
```
