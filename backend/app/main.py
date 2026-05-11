from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db, close_db
from app.routes import router as expenses_router
from app.auth_routes import router as auth_router
from app.admin_routes import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup"""
    init_db()
    print("✓ API started with MongoDB database")
    yield
    close_db()
    print("✓ MongoDB connection closed")


app = FastAPI(
    title="Smart Expense Tracker API",
    description="Backend API for Smart Expense Tracker application with MongoDB",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration - Tutorial 10 Security Best Practice
_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = _origins_env.split(",") if _origins_env else [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Include routers
app.include_router(auth_router)
app.include_router(expenses_router)
app.include_router(admin_router)


@app.get("/")
async def root():
    """Root endpoint - API is running"""
    return {
        "message": "Smart Expense Tracker API",
        "version": "2.0.0",
        "database": "MongoDB",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "API is running",
        "database": "MongoDB"
    }
