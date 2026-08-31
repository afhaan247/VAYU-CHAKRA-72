"""
FastAPI Main Entry Point for VAYU-CHAKRA 72 Backend Server
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router

app = FastAPI(
    title="VAYU-CHAKRA 72 API",
    description="Physics-Guided Multi-Variable Atmospheric Forecasting Backend for Delhi NCR (SIH 26082)",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
def root():
    return {
        "system": "VAYU-CHAKRA 72",
        "description": "Physics-Guided 72-Hour Atmospheric Forecasting System",
        "status": "OPERATIONAL",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
