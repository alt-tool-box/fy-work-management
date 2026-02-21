"""
Work Entry Service - Business logic for work entry management
"""
from datetime import date, timedelta
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, extract

from app.models.work_entry import WorkEntry
from app.models.sprint import Sprint
from app.schemas.work_entry import WorkEntryCreate, WorkEntryUpdate


class WorkEntryService:
    """Service class for work entry operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(
        self,
        page: int = 1,
        page_size: int = 20,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        sprint_id: Optional[UUID] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[WorkEntry], int]:
        """Get all work entries with filtering and pagination"""
        query = self.db.query(WorkEntry)
        
        # Apply filters
        if start_date:
            query = query.filter(WorkEntry.date >= start_date)
        if end_date:
            query = query.filter(WorkEntry.date <= end_date)
        if sprint_id:
            query = query.filter(WorkEntry.sprint_id == sprint_id)
        if category:
            query = query.filter(WorkEntry.category == category)
        if status:
            query = query.filter(WorkEntry.status == status)
        if priority:
            query = query.filter(WorkEntry.priority == priority)
        if search:
            query = query.filter(
                WorkEntry.title.ilike(f"%{search}%") | 
                WorkEntry.description.ilike(f"%{search}%")
            )
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        items = query.order_by(WorkEntry.date.desc(), WorkEntry.created_at.desc())\
                     .offset(offset)\
                     .limit(page_size)\
                     .all()
        
        return items, total
    
    def get_by_id(self, entry_id: UUID) -> Optional[WorkEntry]:
        """Get a work entry by ID"""
        return self.db.query(WorkEntry).filter(WorkEntry.id == entry_id).first()
    
    def get_by_date(self, target_date: date) -> List[WorkEntry]:
        """Get all work entries for a specific date"""
        return self.db.query(WorkEntry)\
            .filter(WorkEntry.date == target_date)\
            .order_by(WorkEntry.created_at)\
            .all()
    
    def get_by_sprint(self, sprint_id: UUID) -> List[WorkEntry]:
        """Get all work entries for a sprint"""
        return self.db.query(WorkEntry)\
            .filter(WorkEntry.sprint_id == sprint_id)\
            .order_by(WorkEntry.date)\
            .all()
    
    def validate_entry_date(self, entry_date: date, sprint_id: UUID = None) -> tuple[bool, str]:
        """Validate work entry date against sprint dates"""
        if not sprint_id:
            return True, ""
        
        sprint = self.db.query(Sprint).filter(Sprint.id == sprint_id).first()
        if not sprint:
            return False, f"Sprint with ID {sprint_id} not found"
        
        if entry_date < sprint.start_date:
            return False, f"Work entry date ({entry_date}) cannot be before sprint start ({sprint.start_date})"
        if entry_date > sprint.end_date:
            return False, f"Work entry date ({entry_date}) cannot be after sprint end ({sprint.end_date})"
        
        return True, ""
    
    def create(self, entry_data: WorkEntryCreate) -> WorkEntry:
        """Create a new work entry with validation"""
        # Validate date against sprint if sprint is specified
        is_valid, error_msg = self.validate_entry_date(entry_data.date, entry_data.sprint_id)
        if not is_valid:
            raise ValueError(error_msg)
        
        entry = WorkEntry(
            title=entry_data.title,
            description=entry_data.description,
            date=entry_data.date,
            category=entry_data.category,
            tags=entry_data.tags,
            time_spent=entry_data.time_spent,
            priority=entry_data.priority,
            status=entry_data.status,
            sprint_id=entry_data.sprint_id,
            notes=entry_data.notes
        )
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry
    
    def update(self, entry_id: UUID, entry_data: WorkEntryUpdate) -> Optional[WorkEntry]:
        """Update a work entry with validation"""
        entry = self.get_by_id(entry_id)
        if not entry:
            return None
        
        update_data = entry_data.model_dump(exclude_unset=True)
        
        # Get the date and sprint_id for validation (use existing if not being updated)
        entry_date = update_data.get('date', entry.date)
        sprint_id = update_data.get('sprint_id', entry.sprint_id)
        
        # Validate date against sprint
        is_valid, error_msg = self.validate_entry_date(entry_date, sprint_id)
        if not is_valid:
            raise ValueError(error_msg)
        
        for field, value in update_data.items():
            setattr(entry, field, value)
        
        self.db.commit()
        self.db.refresh(entry)
        return entry
    
    def delete(self, entry_id: UUID) -> bool:
        """Delete a work entry"""
        entry = self.get_by_id(entry_id)
        if not entry:
            return False
        
        self.db.delete(entry)
        self.db.commit()
        return True
    
    def get_entries_in_range(self, start_date: date, end_date: date) -> List[WorkEntry]:
        """Get all work entries within a date range"""
        return self.db.query(WorkEntry).filter(
            and_(
                WorkEntry.date >= start_date,
                WorkEntry.date <= end_date
            )
        ).order_by(WorkEntry.date).all()
    
    def get_today_entries(self) -> List[WorkEntry]:
        """Get today's work entries"""
        return self.get_by_date(date.today())
    
    def get_week_entries(self, week_start: Optional[date] = None) -> List[WorkEntry]:
        """Get work entries for a week"""
        if not week_start:
            today = date.today()
            week_start = today - timedelta(days=today.weekday())
        
        week_end = week_start + timedelta(days=6)
        return self.get_entries_in_range(week_start, week_end)
    
    def get_month_entries(self, year: int, month: int) -> List[WorkEntry]:
        """Get work entries for a month"""
        return self.db.query(WorkEntry).filter(
            and_(
                extract('year', WorkEntry.date) == year,
                extract('month', WorkEntry.date) == month
            )
        ).order_by(WorkEntry.date).all()
    
    def count_by_status(
        self, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None
    ) -> dict:
        """Count work entries by status within a date range"""
        query = self.db.query(
            WorkEntry.status,
            func.count(WorkEntry.id).label('count')
        )
        
        if start_date:
            query = query.filter(WorkEntry.date >= start_date)
        if end_date:
            query = query.filter(WorkEntry.date <= end_date)
        
        results = query.group_by(WorkEntry.status).all()
        return {r.status: r.count for r in results}
    
    def count_by_category(
        self, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None
    ) -> dict:
        """Count work entries by category within a date range"""
        query = self.db.query(
            WorkEntry.category,
            func.count(WorkEntry.id).label('count')
        )
        
        if start_date:
            query = query.filter(WorkEntry.date >= start_date)
        if end_date:
            query = query.filter(WorkEntry.date <= end_date)
        
        results = query.filter(WorkEntry.category.isnot(None))\
                      .group_by(WorkEntry.category)\
                      .all()
        return {r.category: r.count for r in results}
    
    def get_total_time_spent(
        self, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None
    ) -> int:
        """Get total time spent in minutes within a date range"""
        query = self.db.query(func.sum(WorkEntry.time_spent))
        
        if start_date:
            query = query.filter(WorkEntry.date >= start_date)
        if end_date:
            query = query.filter(WorkEntry.date <= end_date)
        
        result = query.scalar()
        return result or 0
    
    def get_unplanned_entries(
        self, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None
    ) -> List[WorkEntry]:
        """Get work entries that don't have an associated planned task"""
        from app.models.planned_task import PlannedTask
        
        # Subquery to get work_entry_ids that are linked to planned tasks
        linked_ids_subquery = self.db.query(PlannedTask.work_entry_id).filter(
            PlannedTask.work_entry_id.isnot(None)
        ).subquery()
        
        query = self.db.query(WorkEntry).filter(
            ~WorkEntry.id.in_(linked_ids_subquery)
        )
        
        if start_date:
            query = query.filter(WorkEntry.date >= start_date)
        if end_date:
            query = query.filter(WorkEntry.date <= end_date)
        
        return query.order_by(WorkEntry.date).all()
