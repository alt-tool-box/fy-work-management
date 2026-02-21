"""
Summary API Router
"""
from datetime import date
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.summary_service import SummaryService
from app.schemas.summary import SummaryResponse

router = APIRouter(prefix="/summary", tags=["Summary"])


@router.get("/daily", response_model=SummaryResponse)
def get_daily_summary(
    target_date: Optional[date] = Query(None, description="Date for summary (defaults to today)"),
    include_ai: bool = Query(default=True, description="Include AI-generated insights"),
    db: Session = Depends(get_db)
):
    """Get daily summary"""
    service = SummaryService(db)
    return service.get_daily_summary(target_date, include_ai)


@router.get("/weekly", response_model=SummaryResponse)
def get_weekly_summary(
    year: Optional[int] = Query(None, description="Year"),
    week: Optional[int] = Query(None, ge=1, le=53, description="ISO week number"),
    include_ai: bool = Query(default=True, description="Include AI-generated insights"),
    db: Session = Depends(get_db)
):
    """Get weekly summary"""
    service = SummaryService(db)
    return service.get_weekly_summary(year, week, include_ai)


@router.get("/monthly", response_model=SummaryResponse)
def get_monthly_summary(
    year: Optional[int] = Query(None, description="Year"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Month (1-12)"),
    include_ai: bool = Query(default=True, description="Include AI-generated insights"),
    db: Session = Depends(get_db)
):
    """Get monthly summary"""
    service = SummaryService(db)
    return service.get_monthly_summary(year, month, include_ai)


@router.get("/quarterly", response_model=SummaryResponse)
def get_quarterly_summary(
    year: Optional[int] = Query(None, description="Year"),
    quarter: Optional[int] = Query(None, ge=1, le=4, description="Quarter (1-4)"),
    include_ai: bool = Query(default=True, description="Include AI-generated insights"),
    db: Session = Depends(get_db)
):
    """Get quarterly summary (by year and quarter number)"""
    service = SummaryService(db)
    return service.get_quarterly_summary(year, quarter, include_ai)


@router.get("/quarter/{quarter_id}", response_model=SummaryResponse)
def get_quarter_summary_by_id(
    quarter_id: UUID,
    include_ai: bool = Query(default=True, description="Include AI-generated insights"),
    db: Session = Depends(get_db)
):
    """Get quarterly summary by quarter ID (for custom quarters)"""
    service = SummaryService(db)
    summary = service.get_quarter_summary_by_id(quarter_id, include_ai)
    if not summary:
        raise HTTPException(status_code=404, detail="Quarter not found")
    return summary


@router.get("/sprint/{sprint_id}", response_model=SummaryResponse)
def get_sprint_summary(
    sprint_id: UUID,
    include_ai: bool = Query(default=True, description="Include AI-generated insights"),
    db: Session = Depends(get_db)
):
    """Get sprint summary"""
    service = SummaryService(db)
    summary = service.get_sprint_summary(sprint_id, include_ai)
    if not summary:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return summary


@router.get("/yearly", response_model=SummaryResponse)
def get_yearly_summary(
    year: Optional[int] = Query(None, description="Year (defaults to current year)"),
    include_ai: bool = Query(default=True, description="Include AI-generated insights"),
    db: Session = Depends(get_db)
):
    """Get yearly summary"""
    service = SummaryService(db)
    return service.get_yearly_summary(year, include_ai)
