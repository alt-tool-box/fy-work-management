"""
Sprint Service - Business logic for sprint management
"""
from datetime import date, timedelta
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.sprint import Sprint
from app.models.quarter import Quarter
from app.schemas.sprint import SprintCreate, SprintUpdate, SprintGenerateRequest


class SprintService:
    """Service class for sprint operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(self, status: Optional[str] = None, year: Optional[int] = None, quarter_id: Optional[UUID] = None) -> List[Sprint]:
        """Get all sprints with optional filtering"""
        query = self.db.query(Sprint)
        
        if status:
            query = query.filter(Sprint.status == status)
        
        if year:
            query = query.filter(
                Sprint.start_date >= date(year, 1, 1),
                Sprint.start_date <= date(year, 12, 31)
            )
        
        if quarter_id:
            query = query.filter(Sprint.quarter_id == quarter_id)
        
        return query.order_by(Sprint.start_date).all()
    
    def get_by_id(self, sprint_id: UUID) -> Optional[Sprint]:
        """Get a sprint by ID"""
        return self.db.query(Sprint).filter(Sprint.id == sprint_id).first()
    
    def get_active_sprint(self) -> Optional[Sprint]:
        """Get the currently active sprint"""
        today = date.today()
        return self.db.query(Sprint).filter(
            and_(
                Sprint.start_date <= today,
                Sprint.end_date >= today
            )
        ).first()
    
    def get_current_or_next_sprint(self) -> Optional[Sprint]:
        """Get current sprint or the next upcoming one"""
        active = self.get_active_sprint()
        if active:
            return active
        
        # Get next upcoming sprint
        today = date.today()
        return self.db.query(Sprint).filter(
            Sprint.start_date > today
        ).order_by(Sprint.start_date).first()
    
    def get_by_quarter(self, quarter_id: UUID) -> List[Sprint]:
        """Get all sprints for a specific quarter"""
        return self.db.query(Sprint).filter(
            Sprint.quarter_id == quarter_id
        ).order_by(Sprint.start_date).all()
    
    def find_quarter_for_date(self, target_date: date) -> Optional[Quarter]:
        """Find the quarter that contains a specific date"""
        return self.db.query(Quarter).filter(
            and_(
                Quarter.start_date <= target_date,
                Quarter.end_date >= target_date
            )
        ).first()
    
    def validate_sprint_dates(self, start_date: date, end_date: date, quarter_id: UUID = None) -> tuple[bool, str]:
        """Validate sprint dates"""
        # Basic validation
        if end_date < start_date:
            return False, "End date must be after start date"
        
        # If quarter is specified, validate sprint is within quarter
        if quarter_id:
            quarter = self.db.query(Quarter).filter(Quarter.id == quarter_id).first()
            if quarter:
                if start_date < quarter.start_date:
                    return False, f"Sprint start date ({start_date}) cannot be before quarter start ({quarter.start_date})"
                if end_date > quarter.end_date:
                    return False, f"Sprint end date ({end_date}) cannot be after quarter end ({quarter.end_date})"
        
        return True, ""
    
    def create(self, sprint_data: SprintCreate) -> Sprint:
        """Create a new sprint with validation"""
        # If no quarter_id provided, try to find the appropriate quarter
        quarter_id = sprint_data.quarter_id
        if not quarter_id:
            quarter = self.find_quarter_for_date(sprint_data.start_date)
            if quarter:
                quarter_id = quarter.id
        
        # Validate sprint dates against quarter
        is_valid, error_msg = self.validate_sprint_dates(
            sprint_data.start_date, 
            sprint_data.end_date, 
            quarter_id
        )
        if not is_valid:
            raise ValueError(error_msg)
        
        sprint = Sprint(
            name=sprint_data.name,
            quarter_id=quarter_id,
            start_date=sprint_data.start_date,
            end_date=sprint_data.end_date,
            status=sprint_data.status,
            goal=sprint_data.goal,
            working_days=sprint_data.working_days
        )
        self.db.add(sprint)
        self.db.commit()
        self.db.refresh(sprint)
        return sprint
    
    def update(self, sprint_id: UUID, sprint_data: SprintUpdate) -> Optional[Sprint]:
        """Update a sprint with validation"""
        sprint = self.get_by_id(sprint_id)
        if not sprint:
            return None
        
        update_data = sprint_data.model_dump(exclude_unset=True)
        
        # Get the dates for validation (use existing if not being updated)
        start_date = update_data.get('start_date', sprint.start_date)
        end_date = update_data.get('end_date', sprint.end_date)
        quarter_id = update_data.get('quarter_id', sprint.quarter_id)
        
        # Validate dates against quarter
        is_valid, error_msg = self.validate_sprint_dates(start_date, end_date, quarter_id)
        if not is_valid:
            raise ValueError(error_msg)
        
        for field, value in update_data.items():
            setattr(sprint, field, value)
        
        self.db.commit()
        self.db.refresh(sprint)
        return sprint
    
    def delete(self, sprint_id: UUID) -> bool:
        """Delete a sprint"""
        sprint = self.get_by_id(sprint_id)
        if not sprint:
            return False
        
        self.db.delete(sprint)
        self.db.commit()
        return True
    
    def generate_sprints_for_year(self, request: SprintGenerateRequest) -> List[Sprint]:
        """
        Auto-generate 26 sprints for a year.
        Each sprint is 2 weeks (14 days).
        Sprints are automatically assigned to their corresponding quarters.
        """
        sprints = []
        current_start = request.start_date
        sprint_number = 1
        
        # Generate 26 sprints (52 weeks / 2 weeks per sprint)
        while sprint_number <= 26 and current_start.year <= request.year:
            end_date = current_start + timedelta(days=13)  # 14 days inclusive
            
            # Check if we're still within the year
            if current_start.year > request.year:
                break
            
            sprint_name = request.sprint_prefix + f" {sprint_number}"
            
            # Find the quarter for this sprint
            quarter = self.find_quarter_for_date(current_start)
            quarter_id = quarter.id if quarter else None
            
            sprint = Sprint(
                name=sprint_name,
                quarter_id=quarter_id,
                start_date=current_start,
                end_date=end_date,
                status="planned",
                working_days=10
            )
            
            self.db.add(sprint)
            sprints.append(sprint)
            
            # Move to next sprint
            current_start = end_date + timedelta(days=1)
            sprint_number += 1
        
        self.db.commit()
        
        # Refresh all sprints to get their IDs
        for sprint in sprints:
            self.db.refresh(sprint)
        
        return sprints
    
    def activate_sprint(self, sprint_id: UUID) -> Optional[Sprint]:
        """Activate a sprint (and deactivate any currently active sprint)"""
        # Deactivate current active sprint
        current_active = self.get_active_sprint()
        if current_active and current_active.id != sprint_id:
            current_active.status = "completed"
        
        # Activate the specified sprint
        sprint = self.get_by_id(sprint_id)
        if sprint:
            sprint.status = "active"
            self.db.commit()
            self.db.refresh(sprint)
        
        return sprint
    
    def get_sprint_by_date(self, target_date: date) -> Optional[Sprint]:
        """Get the sprint that contains a specific date"""
        return self.db.query(Sprint).filter(
            and_(
                Sprint.start_date <= target_date,
                Sprint.end_date >= target_date
            )
        ).first()
