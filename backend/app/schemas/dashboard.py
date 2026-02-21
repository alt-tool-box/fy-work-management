"""
Dashboard Pydantic Schemas
"""
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class TaskStats(BaseModel):
    """Schema for task statistics"""
    total: int = 0
    completed: int = 0
    in_progress: int = 0
    on_hold: int = 0


class CategoryBreakdown(BaseModel):
    """Schema for category breakdown"""
    category: str
    count: int
    percentage: float


class DashboardStats(BaseModel):
    """Schema for dashboard statistics"""
    # Work entry stats
    total_work_entries: int = 0
    work_entries_today: int = 0
    work_entries_this_week: int = 0
    work_entries_this_month: int = 0
    
    # Planned task stats
    total_planned_tasks: int = 0
    planned_completed: int = 0
    planned_in_progress: int = 0
    planned_pending: int = 0
    
    # Time stats
    total_time_spent_today: int = 0  # in minutes
    total_time_spent_week: int = 0
    total_time_spent_month: int = 0
    
    # Category breakdown
    categories: List[CategoryBreakdown] = []
    
    # Trends
    completion_rate: float = 0.0
    avg_tasks_per_day: float = 0.0


class SprintProgress(BaseModel):
    """Schema for sprint progress"""
    sprint_id: UUID
    sprint_name: str
    start_date: date
    end_date: date
    status: str
    goal: Optional[str] = None
    
    # Progress metrics
    total_planned: int = 0
    completed: int = 0
    in_progress: int = 0
    deferred: int = 0
    cancelled: int = 0
    
    # Percentages
    completion_percentage: float = 0.0
    days_remaining: int = 0
    days_elapsed: int = 0
    
    # Story points
    total_story_points: int = 0
    completed_story_points: int = 0


class UpcomingTask(BaseModel):
    """Schema for upcoming task"""
    id: UUID
    title: str
    target_date: Optional[date] = None
    priority: str
    status: str
    sprint_name: Optional[str] = None


class UpcomingHoliday(BaseModel):
    """Schema for upcoming holiday"""
    id: UUID
    name: str
    date: date
    holiday_type: str


class DashboardSummary(BaseModel):
    """Schema for AI-enhanced dashboard summary"""
    stats: DashboardStats
    sprint_progress: Optional[SprintProgress] = None
    upcoming_tasks: List[UpcomingTask] = []
    upcoming_holidays: List[UpcomingHoliday] = []
    ai_summary: Optional[str] = None
    ai_insights: List[str] = []
    generated_at: datetime
