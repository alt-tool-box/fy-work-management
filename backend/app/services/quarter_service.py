"""
Quarter Service - Business logic for quarter management
"""
from datetime import date
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.quarter import Quarter
from app.schemas.quarter import QuarterCreate, QuarterUpdate


class QuarterService:
    """Service class for quarter operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(self, year: Optional[int] = None) -> List[Quarter]:
        """Get all quarters with optional year filtering"""
        query = self.db.query(Quarter)
        
        if year:
            query = query.filter(Quarter.year == year)
        
        return query.order_by(Quarter.year, Quarter.name).all()
    
    def get_by_id(self, quarter_id: UUID) -> Optional[Quarter]:
        """Get a quarter by ID"""
        return self.db.query(Quarter).filter(Quarter.id == quarter_id).first()
    
    def get_current_quarter(self) -> Optional[Quarter]:
        """Get the current quarter based on today's date"""
        today = date.today()
        return self.db.query(Quarter).filter(
            and_(
                Quarter.start_date <= today,
                Quarter.end_date >= today
            )
        ).first()
    
    def create(self, quarter_data: QuarterCreate) -> Quarter:
        """Create a new quarter"""
        quarter = Quarter(
            name=quarter_data.name,
            start_date=quarter_data.start_date,
            end_date=quarter_data.end_date,
            year=quarter_data.year
        )
        self.db.add(quarter)
        self.db.commit()
        self.db.refresh(quarter)
        return quarter
    
    def update(self, quarter_id: UUID, quarter_data: QuarterUpdate) -> Optional[Quarter]:
        """Update a quarter"""
        quarter = self.get_by_id(quarter_id)
        if not quarter:
            return None
        
        update_data = quarter_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(quarter, field, value)
        
        self.db.commit()
        self.db.refresh(quarter)
        return quarter
    
    def delete(self, quarter_id: UUID) -> bool:
        """Delete a quarter"""
        quarter = self.get_by_id(quarter_id)
        if not quarter:
            return False
        
        self.db.delete(quarter)
        self.db.commit()
        return True
    
    def generate_quarters_for_year(self, year: int, fy_start_month: int = 1) -> List[Quarter]:
        """
        Generate quarters for a year based on FY start month.
        Default assumes calendar year (Jan start).
        """
        quarters = []
        
        # Define quarter boundaries based on FY start month
        if fy_start_month == 1:  # Calendar year
            quarter_months = [
                ("Q1", 1, 3),
                ("Q2", 4, 6),
                ("Q3", 7, 9),
                ("Q4", 10, 12)
            ]
        elif fy_start_month == 4:  # April FY (common in some countries)
            quarter_months = [
                ("Q1", 4, 6),
                ("Q2", 7, 9),
                ("Q3", 10, 12),
                ("Q4", 1, 3)  # Next calendar year
            ]
        else:
            # Generic calculation for any start month
            quarter_months = []
            for i in range(4):
                start_month = ((fy_start_month - 1 + i * 3) % 12) + 1
                end_month = ((fy_start_month - 1 + i * 3 + 2) % 12) + 1
                quarter_months.append((f"Q{i+1}", start_month, end_month))
        
        for name, start_month, end_month in quarter_months:
            # Handle year rollover for FY
            q_year = year
            if fy_start_month != 1 and start_month < fy_start_month:
                q_year = year + 1
            
            # Calculate last day of end month
            if end_month == 12:
                end_date = date(q_year, 12, 31)
            else:
                end_date = date(q_year, end_month + 1, 1) - timedelta(days=1)
            
            quarter = Quarter(
                name=name,
                start_date=date(q_year if start_month >= fy_start_month or fy_start_month == 1 else q_year, start_month, 1),
                end_date=end_date,
                year=year
            )
            self.db.add(quarter)
            quarters.append(quarter)
        
        self.db.commit()
        
        for quarter in quarters:
            self.db.refresh(quarter)
        
        return quarters
    
    def get_quarter_by_date(self, target_date: date) -> Optional[Quarter]:
        """Get the quarter that contains a specific date"""
        return self.db.query(Quarter).filter(
            and_(
                Quarter.start_date <= target_date,
                Quarter.end_date >= target_date
            )
        ).first()


# Import timedelta for generate_quarters_for_year
from datetime import timedelta
