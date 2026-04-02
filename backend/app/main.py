from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
import app.db_models  # must be imported before init_db so models register to Base
from app.routes import router as expenses_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup"""
    init_db()
    print("✓ API started with MySQL database")
    yield


app = FastAPI(
    title="Smart Expense Tracker API",
    description="Backend API for Smart Expense Tracker application with MySQL",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(expenses_router)


@app.get("/")
async def root():
    """Root endpoint - API is running"""
    return {
        "message": "Smart Expense Tracker API",
        "version": "1.0.0",
        "database": "MySQL",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "database": "MySQL"}
