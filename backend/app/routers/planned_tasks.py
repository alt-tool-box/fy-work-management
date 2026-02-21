"""
Planned Task API Router
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.planned_task_service import PlannedTaskService
from app.schemas.planned_task import (
    PlannedTaskCreate, PlannedTaskUpdate, PlannedTaskResponse,
    PlannedTaskComplete, PlannedTaskDefer, PlannedTaskStats
)
from app.schemas.work_entry import WorkEntryResponse

router = APIRouter(prefix="/planned-tasks", tags=["Planned Tasks"])


@router.get("", response_model=List[PlannedTaskResponse])
def get_planned_tasks(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    sprint_id: Optional[UUID] = Query(None, description="Filter by sprint"),
    week_number: Optional[int] = Query(None, ge=1, le=53, description="Filter by week number"),
    year: Optional[int] = Query(None, description="Filter by year"),
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    db: Session = Depends(get_db)
):
    """Get all planned tasks with filtering and pagination"""
    service = PlannedTaskService(db)
    items, total = service.get_all(
        page=page,
        page_size=page_size,
        sprint_id=sprint_id,
        week_number=week_number,
        year=year,
        status=status,
        priority=priority
    )
    return items


@router.get("/sprint/{sprint_id}", response_model=List[PlannedTaskResponse])
def get_tasks_by_sprint(sprint_id: UUID, db: Session = Depends(get_db)):
    """Get all planned tasks for a specific sprint"""
    service = PlannedTaskService(db)
    return service.get_by_sprint(sprint_id)


@router.get("/week/{year}/{week_number}", response_model=List[PlannedTaskResponse])
def get_tasks_by_week(
    year: int,
    week_number: int,
    db: Session = Depends(get_db)
):
    """Get all planned tasks for a specific week"""
    service = PlannedTaskService(db)
    return service.get_by_week(year, week_number)


@router.get("/stats", response_model=PlannedTaskStats)
def get_task_stats(
    sprint_id: Optional[UUID] = Query(None),
    week_number: Optional[int] = Query(None, ge=1, le=53),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Get planned task statistics"""
    service = PlannedTaskService(db)
    return service.get_stats(sprint_id=sprint_id, week_number=week_number, year=year)


@router.get("/pending", response_model=List[PlannedTaskResponse])
def get_pending_tasks(
    sprint_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db)
):
    """Get pending (not completed) tasks"""
    service = PlannedTaskService(db)
    return service.get_pending_tasks(sprint_id)


@router.get("/deferred", response_model=List[PlannedTaskResponse])
def get_deferred_tasks(
    original_sprint_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db)
):
    """Get deferred tasks"""
    service = PlannedTaskService(db)
    return service.get_deferred_tasks(original_sprint_id)


@router.get("/{task_id}", response_model=PlannedTaskResponse)
def get_planned_task(task_id: UUID, db: Session = Depends(get_db)):
    """Get a specific planned task by ID"""
    service = PlannedTaskService(db)
    task = service.get_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Planned task not found")
    return task


@router.post("", response_model=PlannedTaskResponse, status_code=201)
def create_planned_task(task_data: PlannedTaskCreate, db: Session = Depends(get_db)):
    """Create a new planned task with validation"""
    service = PlannedTaskService(db)
    try:
        return service.create(task_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{task_id}", response_model=PlannedTaskResponse)
def update_planned_task(
    task_id: UUID,
    task_data: PlannedTaskUpdate,
    db: Session = Depends(get_db)
):
    """Update a planned task with validation"""
    service = PlannedTaskService(db)
    try:
        task = service.update(task_id, task_data)
        if not task:
            raise HTTPException(status_code=404, detail="Planned task not found")
        return task
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{task_id}", status_code=204)
def delete_planned_task(task_id: UUID, db: Session = Depends(get_db)):
    """Delete a planned task"""
    service = PlannedTaskService(db)
    if not service.delete(task_id):
        raise HTTPException(status_code=404, detail="Planned task not found")


@router.post("/{task_id}/complete", response_model=dict)
def complete_planned_task(
    task_id: UUID,
    complete_data: PlannedTaskComplete,
    db: Session = Depends(get_db)
):
    """
    Mark a planned task as complete and create a work entry.
    Returns both the updated task and the created work entry.
    """
    service = PlannedTaskService(db)
    task, work_entry = service.complete_task(task_id, complete_data)
    
    if not task:
        raise HTTPException(status_code=404, detail="Planned task not found")
    
    return {
        "task": PlannedTaskResponse.model_validate(task),
        "work_entry": WorkEntryResponse.model_validate(work_entry)
    }


@router.post("/{task_id}/defer", response_model=PlannedTaskResponse)
def defer_planned_task(
    task_id: UUID,
    defer_data: PlannedTaskDefer,
    db: Session = Depends(get_db)
):
    """Defer a planned task to a future sprint or week"""
    service = PlannedTaskService(db)
    task = service.defer_task(task_id, defer_data)
    if not task:
        raise HTTPException(status_code=404, detail="Planned task not found")
    return task
