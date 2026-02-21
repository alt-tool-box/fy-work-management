"""
FY Work Management - FastAPI Application
Main entry point for the backend API
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db

# Import routers
from app.routers.sprints import router as sprints_router
from app.routers.quarters import router as quarters_router
from app.routers.holidays import router as holidays_router
from app.routers.calendar import router as calendar_router
from app.routers.work_entries import router as work_entries_router
from app.routers.planned_tasks import router as planned_tasks_router
from app.routers.files import router as files_router
from app.routers.config import router as config_router
from app.routers.chat import router as chat_router
from app.routers.dashboard import router as dashboard_router
from app.routers.summary import router as summary_router
from app.routers.jira import router as jira_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup: Initialize database tables
    print("🚀 Starting FY Work Management API...")
    init_db()
    print("✅ Database initialized")
    
    yield
    
    # Shutdown
    print("👋 Shutting down FY Work Management API...")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="""
    FY Work Management API - A comprehensive work management application 
    for tracking and managing organizational work throughout the fiscal year.
    
    ## Features
    - 📊 Dashboard with AI-enhanced statistics and summaries
    - 📅 FY Calendar with holidays and work tracking
    - 📝 Daily work entry management
    - 📋 Planned tasks for sprints and weeks
    - 📈 Multiple summary views (daily, weekly, monthly, quarterly, sprint, yearly)
    - 🤖 AI-powered chat agent
    - 📎 File attachments with MinIO storage
    """,
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS using centralized settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_methods_list,
    allow_headers=settings.cors_headers_list,
)


# Health check endpoint
@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version
    }


# Root endpoint
@app.get("/", tags=["Root"])
def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to FY Work Management API",
        "version": settings.app_version,
        "docs": "/docs",
        "redoc": "/redoc"
    }


# Include all routers with /api/v1 prefix
API_PREFIX = "/api/v1"

# Sprint and Quarter management
app.include_router(sprints_router, prefix=API_PREFIX)
app.include_router(quarters_router, prefix=API_PREFIX)

# Calendar and Holidays
app.include_router(holidays_router, prefix=API_PREFIX)
app.include_router(calendar_router, prefix=API_PREFIX)

# Work Entries
app.include_router(work_entries_router, prefix=API_PREFIX)

# Planned Tasks
app.include_router(planned_tasks_router, prefix=API_PREFIX)

# Files
app.include_router(files_router, prefix=API_PREFIX)

# Configuration
app.include_router(config_router, prefix=API_PREFIX)

# AI Chat
app.include_router(chat_router, prefix=API_PREFIX)

# Dashboard
app.include_router(dashboard_router, prefix=API_PREFIX)

# Summary
app.include_router(summary_router, prefix=API_PREFIX)

# Jira Integration
app.include_router(jira_router, prefix=API_PREFIX)


# Error handlers
from fastapi import Request
from fastapi.responses import JSONResponse


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors"""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred",
            "error": str(exc) if settings.debug else "Internal Server Error"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
