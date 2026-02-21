"""
Holiday Service - Business logic for holiday management
"""
from datetime import date, timedelta
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, extract

from app.models.holiday import Holiday
from app.schemas.holiday import HolidayCreate, HolidayUpdate


class HolidayService:
    """Service class for holiday operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(
        self, 
        year: Optional[int] = None,
        holiday_type: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Holiday]:
        """Get all holidays with optional filtering"""
        query = self.db.query(Holiday)
        
        if year:
            query = query.filter(extract('year', Holiday.date) == year)
        
        if holiday_type:
            query = query.filter(Holiday.holiday_type == holiday_type)
        
        if start_date:
            query = query.filter(Holiday.date >= start_date)
        
        if end_date:
            query = query.filter(Holiday.date <= end_date)
        
        return query.order_by(Holiday.date).all()
    
    def get_by_id(self, holiday_id: UUID) -> Optional[Holiday]:
        """Get a holiday by ID"""
        return self.db.query(Holiday).filter(Holiday.id == holiday_id).first()
    
    def get_by_date(self, target_date: date) -> Optional[Holiday]:
        """Get holiday for a specific date"""
        return self.db.query(Holiday).filter(Holiday.date == target_date).first()
    
    def get_upcoming(self, days: int = 30) -> List[Holiday]:
        """Get upcoming holidays within specified days"""
        today = date.today()
        end_date = today + timedelta(days=days)
        
        return self.db.query(Holiday).filter(
            and_(
                Holiday.date >= today,
                Holiday.date <= end_date
            )
        ).order_by(Holiday.date).all()
    
    def create(self, holiday_data: HolidayCreate) -> Holiday:
        """Create a new holiday"""
        holiday = Holiday(
            name=holiday_data.name,
            date=holiday_data.date,
            is_recurring=holiday_data.is_recurring,
            description=holiday_data.description,
            holiday_type=holiday_data.holiday_type
        )
        self.db.add(holiday)
        self.db.commit()
        self.db.refresh(holiday)
        return holiday
    
    def update(self, holiday_id: UUID, holiday_data: HolidayUpdate) -> Optional[Holiday]:
        """Update a holiday"""
        holiday = self.get_by_id(holiday_id)
        if not holiday:
            return None
        
        update_data = holiday_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(holiday, field, value)
        
        self.db.commit()
        self.db.refresh(holiday)
        return holiday
    
    def delete(self, holiday_id: UUID) -> bool:
        """Delete a holiday"""
        holiday = self.get_by_id(holiday_id)
        if not holiday:
            return False
        
        self.db.delete(holiday)
        self.db.commit()
        return True
    
    def is_holiday(self, target_date: date) -> bool:
        """Check if a date is a holiday"""
        holiday = self.get_by_date(target_date)
        return holiday is not None
    
    def get_holidays_in_range(self, start_date: date, end_date: date) -> List[Holiday]:
        """Get all holidays within a date range"""
        return self.db.query(Holiday).filter(
            and_(
                Holiday.date >= start_date,
                Holiday.date <= end_date
            )
        ).order_by(Holiday.date).all()
    
    def count_holidays_in_range(self, start_date: date, end_date: date) -> int:
        """Count holidays within a date range"""
        return self.db.query(Holiday).filter(
            and_(
                Holiday.date >= start_date,
                Holiday.date <= end_date
            )
        ).count()
    
    def generate_recurring_holidays_for_year(self, year: int) -> List[Holiday]:
        """
        Generate recurring holidays for a specific year based on existing recurring holidays.
        """
        # Get all recurring holidays
        recurring = self.db.query(Holiday).filter(Holiday.is_recurring == True).all()
        
        new_holidays = []
        for holiday in recurring:
            # Create new holiday for the specified year
            new_date = date(year, holiday.date.month, holiday.date.day)
            
            # Check if already exists
            existing = self.db.query(Holiday).filter(
                and_(
                    Holiday.date == new_date,
                    Holiday.name == holiday.name
                )
            ).first()
            
            if not existing:
                new_holiday = Holiday(
                    name=holiday.name,
                    date=new_date,
                    is_recurring=True,
                    description=holiday.description,
                    holiday_type=holiday.holiday_type
                )
                self.db.add(new_holiday)
                new_holidays.append(new_holiday)
        
        if new_holidays:
            self.db.commit()
            for h in new_holidays:
                self.db.refresh(h)
        
        return new_holidays
