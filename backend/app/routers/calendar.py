"""
Calendar Events API Router
"""
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.services.work_entry_service import WorkEntryService
from app.services.holiday_service import HolidayService
from app.services.planned_task_service import PlannedTaskService
from app.services.sprint_service import SprintService

router = APIRouter(prefix="/calendar", tags=["Calendar"])


class CalendarEvent(BaseModel):
    """Schema for calendar events"""
    id: str
    title: str
    date: date
    event_type: str  # work_entry, holiday, planned_task, sprint_start, sprint_end
    category: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    description: Optional[str] = None


class CalendarEventsResponse(BaseModel):
    """Response schema for calendar events"""
    events: List[CalendarEvent]
    total: int
    start_date: date
    end_date: date


@router.get("/events", response_model=CalendarEventsResponse)
def get_calendar_events(
    start_date: date = Query(..., description="Start date for events"),
    end_date: date = Query(..., description="End date for events"),
    include_work_entries: bool = Query(default=True),
    include_holidays: bool = Query(default=True),
    include_planned_tasks: bool = Query(default=True),
    include_sprints: bool = Query(default=True),
    db: Session = Depends(get_db)
):
    """
    Get all calendar events within a date range.
    Includes work entries, holidays, planned tasks, and sprint boundaries.
    """
    events = []
    
    # Work entries
    if include_work_entries:
        work_service = WorkEntryService(db)
        entries = work_service.get_entries_in_range(start_date, end_date)
        for entry in entries:
            events.append(CalendarEvent(
                id=f"work_{entry.id}",
                title=entry.title,
                date=entry.date,
                event_type="work_entry",
                category=entry.category,
                status=entry.status,
                priority=entry.priority,
                description=entry.description[:200] if entry.description else None
            ))
    
    # Holidays
    if include_holidays:
        holiday_service = HolidayService(db)
        holidays = holiday_service.get_holidays_in_range(start_date, end_date)
        for holiday in holidays:
            events.append(CalendarEvent(
                id=f"holiday_{holiday.id}",
                title=holiday.name,
                date=holiday.date,
                event_type="holiday",
                category=holiday.holiday_type,
                description=holiday.description
            ))
    
    # Planned tasks with target dates
    if include_planned_tasks:
        planned_service = PlannedTaskService(db)
        # Get all planned tasks and filter by target_date
        tasks, _ = planned_service.get_all(page=1, page_size=1000)
        for task in tasks:
            if task.target_date and start_date <= task.target_date <= end_date:
                events.append(CalendarEvent(
                    id=f"planned_{task.id}",
                    title=f"[Planned] {task.title}",
                    date=task.target_date,
                    event_type="planned_task",
                    category=task.category,
                    status=task.status,
                    priority=task.priority,
                    description=task.description[:200] if task.description else None
                ))
    
    # Sprint boundaries
    if include_sprints:
        sprint_service = SprintService(db)
        sprints = sprint_service.get_all()
        for sprint in sprints:
            # Sprint start
            if start_date <= sprint.start_date <= end_date:
                events.append(CalendarEvent(
                    id=f"sprint_start_{sprint.id}",
                    title=f"Sprint Start: {sprint.name}",
                    date=sprint.start_date,
                    event_type="sprint_start",
                    status=sprint.status,
                    description=sprint.goal
                ))
            # Sprint end
            if start_date <= sprint.end_date <= end_date:
                events.append(CalendarEvent(
                    id=f"sprint_end_{sprint.id}",
                    title=f"Sprint End: {sprint.name}",
                    date=sprint.end_date,
                    event_type="sprint_end",
                    status=sprint.status
                ))
    
    # Sort events by date
    events.sort(key=lambda x: x.date)
    
    return CalendarEventsResponse(
        events=events,
        total=len(events),
        start_date=start_date,
        end_date=end_date
    )


@router.get("/work-intensity", response_model=dict)
def get_work_intensity(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db)
):
    """
    Get work intensity (number of entries) per day within a date range.
    Useful for calendar heat map visualization.
    """
    work_service = WorkEntryService(db)
    entries = work_service.get_entries_in_range(start_date, end_date)
    
    # Count entries per day
    intensity = {}
    for entry in entries:
        date_str = entry.date.isoformat()
        intensity[date_str] = intensity.get(date_str, 0) + 1
    
    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "intensity": intensity
    }
