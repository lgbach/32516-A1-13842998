#!/usr/bin/env python
"""
Smart Expense Tracker - Backend Server
Run this file to start the FastAPI development server
"""

import uvicorn
from app.main import app

if __name__ == "__main__":
    print("Starting Smart Expense Tracker API...")
    print("📊 API running at http://localhost:8000")
    print("📖 API docs at http://localhost:8000/docs")
    print("🔄 ReDoc at http://localhost:8000/redoc")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
