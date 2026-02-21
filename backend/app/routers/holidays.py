"""
Holiday API Router
"""
from datetime import date
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.holiday_service import HolidayService
from app.schemas.holiday import HolidayCreate, HolidayUpdate, HolidayResponse

router = APIRouter(prefix="/holidays", tags=["Holidays"])


@router.get("", response_model=List[HolidayResponse])
def get_holidays(
    year: Optional[int] = Query(None, description="Filter by year"),
    holiday_type: Optional[str] = Query(None, description="Filter by type (holiday, day_off, leave)"),
    start_date: Optional[date] = Query(None, description="Filter from date"),
    end_date: Optional[date] = Query(None, description="Filter to date"),
    db: Session = Depends(get_db)
):
    """Get all holidays with optional filtering"""
    service = HolidayService(db)
    return service.get_all(
        year=year,
        holiday_type=holiday_type,
        start_date=start_date,
        end_date=end_date
    )


@router.get("/upcoming", response_model=List[HolidayResponse])
def get_upcoming_holidays(
    days: int = Query(default=30, ge=1, le=365, description="Number of days to look ahead"),
    db: Session = Depends(get_db)
):
    """Get upcoming holidays within specified days"""
    service = HolidayService(db)
    return service.get_upcoming(days)


@router.get("/check/{target_date}", response_model=bool)
def check_is_holiday(target_date: date, db: Session = Depends(get_db)):
    """Check if a specific date is a holiday"""
    service = HolidayService(db)
    return service.is_holiday(target_date)


@router.get("/{holiday_id}", response_model=HolidayResponse)
def get_holiday(holiday_id: UUID, db: Session = Depends(get_db)):
    """Get a specific holiday by ID"""
    service = HolidayService(db)
    holiday = service.get_by_id(holiday_id)
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    return holiday


@router.post("", response_model=HolidayResponse, status_code=201)
def create_holiday(holiday_data: HolidayCreate, db: Session = Depends(get_db)):
    """Create a new holiday"""
    service = HolidayService(db)
    return service.create(holiday_data)


@router.put("/{holiday_id}", response_model=HolidayResponse)
def update_holiday(
    holiday_id: UUID,
    holiday_data: HolidayUpdate,
    db: Session = Depends(get_db)
):
    """Update a holiday"""
    service = HolidayService(db)
    holiday = service.update(holiday_id, holiday_data)
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    return holiday


@router.delete("/{holiday_id}", status_code=204)
def delete_holiday(holiday_id: UUID, db: Session = Depends(get_db)):
    """Delete a holiday"""
    service = HolidayService(db)
    if not service.delete(holiday_id):
        raise HTTPException(status_code=404, detail="Holiday not found")


@router.post("/generate-recurring/{year}", response_model=List[HolidayResponse])
def generate_recurring_holidays(year: int, db: Session = Depends(get_db)):
    """Generate recurring holidays for a specific year"""
    service = HolidayService(db)
    return service.generate_recurring_holidays_for_year(year)
