.PHONY: dev backend frontend install test eval

dev:
	@echo "Starting both Backend (FastAPI :8000) and Frontend (Vite :5173)..."
	make -j 2 backend frontend

backend:
	cd backend && uvicorn app.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

test:
	cd backend && python -m pytest tests/

eval:
	cd backend && python evals/run_eval.py
