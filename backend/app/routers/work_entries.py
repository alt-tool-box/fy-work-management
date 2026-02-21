"""
Work Entry API Router
"""
from datetime import date
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.work_entry_service import WorkEntryService
from app.schemas.work_entry import (
    WorkEntryCreate, WorkEntryUpdate, WorkEntryResponse, WorkEntryListResponse
)

router = APIRouter(prefix="/work-entries", tags=["Work Entries"])


@router.get("", response_model=WorkEntryListResponse)
def get_work_entries(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    start_date: Optional[date] = Query(None, description="Filter from date"),
    end_date: Optional[date] = Query(None, description="Filter to date"),
    sprint_id: Optional[UUID] = Query(None, description="Filter by sprint"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    search: Optional[str] = Query(None, description="Search in title/description"),
    db: Session = Depends(get_db)
):
    """Get all work entries with filtering and pagination"""
    service = WorkEntryService(db)
    items, total = service.get_all(
        page=page,
        page_size=page_size,
        start_date=start_date,
        end_date=end_date,
        sprint_id=sprint_id,
        category=category,
        status=status,
        priority=priority,
        search=search
    )
    
    total_pages = (total + page_size - 1) // page_size
    
    return WorkEntryListResponse(
        items=[WorkEntryResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/today", response_model=List[WorkEntryResponse])
def get_today_entries(db: Session = Depends(get_db)):
    """Get today's work entries"""
    service = WorkEntryService(db)
    return service.get_today_entries()


@router.get("/date/{target_date}", response_model=List[WorkEntryResponse])
def get_entries_by_date(target_date: date, db: Session = Depends(get_db)):
    """Get work entries for a specific date"""
    service = WorkEntryService(db)
    return service.get_by_date(target_date)


@router.get("/sprint/{sprint_id}", response_model=List[WorkEntryResponse])
def get_entries_by_sprint(sprint_id: UUID, db: Session = Depends(get_db)):
    """Get work entries for a sprint"""
    service = WorkEntryService(db)
    return service.get_by_sprint(sprint_id)


@router.get("/{entry_id}", response_model=WorkEntryResponse)
def get_work_entry(entry_id: UUID, db: Session = Depends(get_db)):
    """Get a specific work entry by ID"""
    service = WorkEntryService(db)
    entry = service.get_by_id(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Work entry not found")
    return entry


@router.post("", response_model=WorkEntryResponse, status_code=201)
def create_work_entry(entry_data: WorkEntryCreate, db: Session = Depends(get_db)):
    """Create a new work entry with validation"""
    service = WorkEntryService(db)
    try:
        return service.create(entry_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{entry_id}", response_model=WorkEntryResponse)
def update_work_entry(
    entry_id: UUID,
    entry_data: WorkEntryUpdate,
    db: Session = Depends(get_db)
):
    """Update a work entry with validation"""
    service = WorkEntryService(db)
    try:
        entry = service.update(entry_id, entry_data)
        if not entry:
            raise HTTPException(status_code=404, detail="Work entry not found")
        return entry
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{entry_id}", status_code=204)
def delete_work_entry(entry_id: UUID, db: Session = Depends(get_db)):
    """Delete a work entry"""
    service = WorkEntryService(db)
    if not service.delete(entry_id):
        raise HTTPException(status_code=404, detail="Work entry not found")


@router.get("/stats/by-status", response_model=dict)
def get_stats_by_status(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    """Get work entry counts by status"""
    service = WorkEntryService(db)
    return service.count_by_status(start_date, end_date)


@router.get("/stats/by-category", response_model=dict)
def get_stats_by_category(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    """Get work entry counts by category"""
    service = WorkEntryService(db)
    return service.count_by_category(start_date, end_date)


@router.get("/stats/time-spent", response_model=dict)
def get_time_spent(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    """Get total time spent within date range"""
    service = WorkEntryService(db)
    total_minutes = service.get_total_time_spent(start_date, end_date)
    return {
        "total_minutes": total_minutes,
        "total_hours": round(total_minutes / 60, 2)
    }
