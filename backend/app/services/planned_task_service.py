"""
Planned Task Service - Business logic for planned task management
"""
from datetime import date, datetime
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.models.planned_task import PlannedTask
from app.models.work_entry import WorkEntry
from app.models.sprint import Sprint
from app.schemas.planned_task import (
    PlannedTaskCreate, PlannedTaskUpdate, 
    PlannedTaskComplete, PlannedTaskDefer, PlannedTaskStats
)


class PlannedTaskService:
    """Service class for planned task operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all(
        self,
        page: int = 1,
        page_size: int = 20,
        sprint_id: Optional[UUID] = None,
        week_number: Optional[int] = None,
        year: Optional[int] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None
    ) -> Tuple[List[PlannedTask], int]:
        """Get all planned tasks with filtering and pagination"""
        query = self.db.query(PlannedTask)
        
        if sprint_id:
            query = query.filter(PlannedTask.sprint_id == sprint_id)
        if week_number:
            query = query.filter(PlannedTask.week_number == week_number)
        if year:
            query = query.filter(PlannedTask.year == year)
        if status:
            query = query.filter(PlannedTask.status == status)
        if priority:
            query = query.filter(PlannedTask.priority == priority)
        
        total = query.count()
        
        offset = (page - 1) * page_size
        items = query.order_by(PlannedTask.created_at.desc())\
                     .offset(offset)\
                     .limit(page_size)\
                     .all()
        
        return items, total
    
    def get_by_id(self, task_id: UUID) -> Optional[PlannedTask]:
        """Get a planned task by ID"""
        return self.db.query(PlannedTask).filter(PlannedTask.id == task_id).first()
    
    def get_by_sprint(self, sprint_id: UUID) -> List[PlannedTask]:
        """Get all planned tasks for a sprint"""
        return self.db.query(PlannedTask)\
            .filter(PlannedTask.sprint_id == sprint_id)\
            .order_by(PlannedTask.priority.desc(), PlannedTask.created_at)\
            .all()
    
    def get_by_week(self, year: int, week_number: int) -> List[PlannedTask]:
        """Get all planned tasks for a specific week"""
        return self.db.query(PlannedTask)\
            .filter(
                and_(
                    PlannedTask.year == year,
                    PlannedTask.week_number == week_number
                )
            )\
            .order_by(PlannedTask.priority.desc(), PlannedTask.created_at)\
            .all()
    
    def validate_task_date(self, target_date: date, sprint_id: UUID = None) -> tuple[bool, str]:
        """Validate planned task target date against sprint dates"""
        if not target_date or not sprint_id:
            return True, ""
        
        sprint = self.db.query(Sprint).filter(Sprint.id == sprint_id).first()
        if not sprint:
            return False, f"Sprint with ID {sprint_id} not found"
        
        if target_date < sprint.start_date:
            return False, f"Target date ({target_date}) cannot be before sprint start ({sprint.start_date})"
        if target_date > sprint.end_date:
            return False, f"Target date ({target_date}) cannot be after sprint end ({sprint.end_date})"
        
        return True, ""
    
    def create(self, task_data: PlannedTaskCreate) -> PlannedTask:
        """Create a new planned task with validation"""
        # Validate target date against sprint
        if task_data.target_date and task_data.sprint_id:
            is_valid, error_msg = self.validate_task_date(task_data.target_date, task_data.sprint_id)
            if not is_valid:
                raise ValueError(error_msg)
        
        task = PlannedTask(
            title=task_data.title,
            description=task_data.description,
            sprint_id=task_data.sprint_id,
            week_number=task_data.week_number,
            year=task_data.year,
            target_date=task_data.target_date,
            estimated_hours=task_data.estimated_hours,
            story_points=task_data.story_points,
            priority=task_data.priority,
            status=task_data.status,
            category=task_data.category,
            tags=task_data.tags
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task
    
    def update(self, task_id: UUID, task_data: PlannedTaskUpdate) -> Optional[PlannedTask]:
        """Update a planned task with validation"""
        task = self.get_by_id(task_id)
        if not task:
            return None
        
        update_data = task_data.model_dump(exclude_unset=True)
        
        # Get the target date and sprint_id for validation (use existing if not being updated)
        target_date = update_data.get('target_date', task.target_date)
        sprint_id = update_data.get('sprint_id', task.sprint_id)
        
        # Validate target date against sprint
        if target_date and sprint_id:
            is_valid, error_msg = self.validate_task_date(target_date, sprint_id)
            if not is_valid:
                raise ValueError(error_msg)
        
        for field, value in update_data.items():
            setattr(task, field, value)
        
        self.db.commit()
        self.db.refresh(task)
        return task
    
    def delete(self, task_id: UUID) -> bool:
        """Delete a planned task"""
        task = self.get_by_id(task_id)
        if not task:
            return False
        
        self.db.delete(task)
        self.db.commit()
        return True
    
    def complete_task(self, task_id: UUID, complete_data: PlannedTaskComplete) -> Tuple[Optional[PlannedTask], Optional[WorkEntry]]:
        """
        Mark a planned task as complete and create a work entry.
        Returns both the updated task and the created work entry.
        """
        task = self.get_by_id(task_id)
        if not task:
            return None, None
        
        # Create work entry from the planned task
        work_entry = WorkEntry(
            title=task.title,
            description=complete_data.description,
            date=date.today(),
            category=task.category,
            tags=task.tags,
            time_spent=complete_data.time_spent,
            priority=task.priority,
            status="completed",
            sprint_id=task.sprint_id,
            notes=complete_data.notes
        )
        self.db.add(work_entry)
        self.db.flush()  # Get the work_entry.id
        
        # Update the planned task to link to work entry
        task.status = "completed"
        task.work_entry_id = work_entry.id
        
        self.db.commit()
        self.db.refresh(task)
        self.db.refresh(work_entry)
        
        return task, work_entry
    
    def defer_task(self, task_id: UUID, defer_data: PlannedTaskDefer) -> Optional[PlannedTask]:
        """Defer a planned task to a future sprint or week"""
        task = self.get_by_id(task_id)
        if not task:
            return None
        
        task.status = "deferred"
        task.deferred_to_sprint_id = defer_data.defer_to_sprint_id
        task.deferred_to_week = defer_data.defer_to_week
        
        # Update year if provided
        if defer_data.defer_to_year:
            task.year = defer_data.defer_to_year
        
        self.db.commit()
        self.db.refresh(task)
        return task
    
    def get_stats(
        self, 
        sprint_id: Optional[UUID] = None,
        week_number: Optional[int] = None,
        year: Optional[int] = None
    ) -> PlannedTaskStats:
        """Get statistics for planned tasks"""
        query = self.db.query(PlannedTask)
        
        if sprint_id:
            query = query.filter(PlannedTask.sprint_id == sprint_id)
        if week_number and year:
            query = query.filter(
                and_(
                    PlannedTask.week_number == week_number,
                    PlannedTask.year == year
                )
            )
        elif year:
            query = query.filter(PlannedTask.year == year)
        
        tasks = query.all()
        
        total = len(tasks)
        completed = sum(1 for t in tasks if t.status == "completed")
        in_progress = sum(1 for t in tasks if t.status == "in_progress")
        deferred = sum(1 for t in tasks if t.status == "deferred")
        cancelled = sum(1 for t in tasks if t.status == "cancelled")
        
        total_sp = sum(t.story_points or 0 for t in tasks)
        completed_sp = sum(t.story_points or 0 for t in tasks if t.status == "completed")
        
        completion_rate = (completed / total * 100) if total > 0 else 0.0
        
        return PlannedTaskStats(
            total_planned=total,
            completed=completed,
            in_progress=in_progress,
            deferred=deferred,
            cancelled=cancelled,
            completion_rate=round(completion_rate, 2),
            total_story_points=total_sp,
            completed_story_points=completed_sp
        )
    
    def get_pending_tasks(self, sprint_id: Optional[UUID] = None) -> List[PlannedTask]:
        """Get pending (not completed) tasks"""
        query = self.db.query(PlannedTask).filter(
            PlannedTask.status.in_(["planned", "in_progress"])
        )
        
        if sprint_id:
            query = query.filter(PlannedTask.sprint_id == sprint_id)
        
        return query.order_by(PlannedTask.priority.desc()).all()
    
    def get_deferred_tasks(
        self, 
        original_sprint_id: Optional[UUID] = None
    ) -> List[PlannedTask]:
        """Get deferred tasks, optionally filtered by original sprint"""
        query = self.db.query(PlannedTask).filter(PlannedTask.status == "deferred")
        
        if original_sprint_id:
            query = query.filter(PlannedTask.sprint_id == original_sprint_id)
        
        return query.all()
