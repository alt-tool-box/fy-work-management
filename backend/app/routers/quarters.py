"""
Quarter API Router
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.quarter_service import QuarterService
from app.schemas.quarter import QuarterCreate, QuarterUpdate, QuarterResponse

router = APIRouter(prefix="/quarters", tags=["Quarters"])


@router.get("", response_model=List[QuarterResponse])
def get_quarters(
    year: Optional[int] = Query(None, description="Filter by year"),
    db: Session = Depends(get_db)
):
    """Get all quarters with optional year filtering"""
    service = QuarterService(db)
    return service.get_all(year=year)


@router.get("/current", response_model=Optional[QuarterResponse])
def get_current_quarter(db: Session = Depends(get_db)):
    """Get the current quarter"""
    service = QuarterService(db)
    return service.get_current_quarter()


@router.get("/{quarter_id}", response_model=QuarterResponse)
def get_quarter(quarter_id: UUID, db: Session = Depends(get_db)):
    """Get a specific quarter by ID"""
    service = QuarterService(db)
    quarter = service.get_by_id(quarter_id)
    if not quarter:
        raise HTTPException(status_code=404, detail="Quarter not found")
    return quarter


@router.post("", response_model=QuarterResponse, status_code=201)
def create_quarter(quarter_data: QuarterCreate, db: Session = Depends(get_db)):
    """Create a new quarter"""
    service = QuarterService(db)
    return service.create(quarter_data)


@router.put("/{quarter_id}", response_model=QuarterResponse)
def update_quarter(
    quarter_id: UUID,
    quarter_data: QuarterUpdate,
    db: Session = Depends(get_db)
):
    """Update a quarter"""
    service = QuarterService(db)
    quarter = service.update(quarter_id, quarter_data)
    if not quarter:
        raise HTTPException(status_code=404, detail="Quarter not found")
    return quarter


@router.delete("/{quarter_id}", status_code=204)
def delete_quarter(quarter_id: UUID, db: Session = Depends(get_db)):
    """Delete a quarter"""
    service = QuarterService(db)
    if not service.delete(quarter_id):
        raise HTTPException(status_code=404, detail="Quarter not found")


@router.post("/generate/{year}", response_model=List[QuarterResponse], status_code=201)
def generate_quarters(
    year: int,
    fy_start_month: int = Query(default=1, ge=1, le=12, description="Fiscal year start month"),
    db: Session = Depends(get_db)
):
    """Generate quarters for a year"""
    service = QuarterService(db)
    return service.generate_quarters_for_year(year, fy_start_month)
