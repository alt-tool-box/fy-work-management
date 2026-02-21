"""
Dashboard API Router
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import DashboardStats, SprintProgress, DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    service = DashboardService(db)
    return service.get_stats()


@router.get("/sprint-progress", response_model=Optional[SprintProgress])
def get_sprint_progress(
    sprint_id: Optional[UUID] = Query(None, description="Sprint ID (uses current sprint if not provided)"),
    db: Session = Depends(get_db)
):
    """Get progress for current or specified sprint"""
    service = DashboardService(db)
    return service.get_sprint_progress(sprint_id)


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    include_ai: bool = Query(default=True, description="Include AI-generated content"),
    db: Session = Depends(get_db)
):
    """Get complete dashboard summary with optional AI enhancement"""
    service = DashboardService(db)
    return service.get_dashboard_summary(include_ai)
