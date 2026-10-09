import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.sessions import router as sessions_router

app = FastAPI(
    title="Data Analyst Agent & Reconciliation System",
    description="Enterprise Multi-Node Agent for 5-Dimension Quality Audits and Financial Reconciliation Bridge",
    version="1.0.0",
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(sessions_router)

@app.get("/")
def root():
    return {
        "service": "Data Analyst Agent API",
        "status": "online",
        "docs_url": "/docs",
        "openapi_url": "/openapi.json"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
