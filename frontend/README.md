# Data Analyst Agent - Frontend Application

Modern React 18 single-page dashboard built with Vite, TypeScript, Tailwind CSS, TanStack Query, Zustand, and Recharts.

## Architecture & Views
1. **UploadPanel**: Drag & drop CSV ingestion, instant demo loading, per-file preview (rows, columns, SHA-256 hash).
2. **AgentProgress**: Live vertical reasoning trail driven by Server-Sent Events (SSE) tracking all 11 LangGraph nodes.
3. **QualityDashboard**: 5-dimension quality gauges (0-100) and filterable findings table with expandable remediation drawers.
4. **ReconciliationBridge**: Financial waterfall chart (Recharts) with variance attribution and sample row drawer.
5. **AskPanel & AnswerCard**: Chat interface returning confidence badges, side-by-side values, assumptions, and evidence chips.
6. **EvidenceDrawer**: Inspection drawer displaying exact Pandas code vs DuckDB SQL query parity.
7. **UnresolvedIssues**: Ranked action items for critical blockers and residual discrepancies.
8. **Downloads**: One-click download triggers for HTML reports, Python reproduce scripts, and JSON calculation logs.

## Setup & Running

```bash
cd frontend
npm install
npm run dev
```

The application runs on `http://localhost:5173` and proxies requests to `http://localhost:8000` (configured via `.env` / `VITE_API_BASE_URL`).

## Building & Typechecking
```bash
npx tsc --noEmit
npm run build
```
