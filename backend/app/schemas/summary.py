"""
Summary Pydantic Schemas
"""
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class SummaryRequest(BaseModel):
    """Schema for summary request"""
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    sprint_id: Optional[UUID] = None
    include_ai_insights: bool = True


class TaskSummary(BaseModel):
    """Schema for task summary statistics"""
    total_entries: int = 0
    completed: int = 0
    in_progress: int = 0
    on_hold: int = 0
    total_time_spent: int = 0  # in minutes
    avg_time_per_task: float = 0.0
    
    # By category
    by_category: Dict[str, int] = {}
    
    # By priority
    by_priority: Dict[str, int] = {}


class PlannedVsActual(BaseModel):
    """Schema for planned vs actual comparison"""
    total_planned: int = 0
    completed_on_time: int = 0
    completed_late: int = 0
    deferred: int = 0
    cancelled: int = 0
    unplanned_work: int = 0  # Work entries without planned tasks
    completion_rate: float = 0.0
    
    # Story points
    planned_story_points: int = 0
    completed_story_points: int = 0


class DeferredTask(BaseModel):
    """Schema for deferred task info"""
    id: UUID
    title: str
    original_sprint: Optional[str] = None
    original_week: Optional[int] = None
    deferred_to_sprint: Optional[str] = None
    deferred_to_week: Optional[int] = None


class SummaryResponse(BaseModel):
    """Schema for summary response"""
    # Period info
    summary_type: str  # daily, weekly, monthly, quarterly, sprint, yearly
    start_date: date
    end_date: date
    period_label: str  # e.g., "Week 3, 2026", "Q1 2026", "Sprint 5"
    
    # Statistics
    task_summary: TaskSummary
    planned_vs_actual: PlannedVsActual
    
    # Deferred tasks
    deferred_tasks: List[DeferredTask] = []
    
    # AI-generated content
    ai_highlights: List[str] = []
    ai_patterns: List[str] = []
    ai_recommendations: List[str] = []
    ai_summary: Optional[str] = None
    
    # Metadata
    generated_at: datetime


class YearlySummary(SummaryResponse):
    """Schema for yearly summary with additional fields"""
    quarterly_breakdown: Dict[str, TaskSummary] = {}
    monthly_breakdown: Dict[str, TaskSummary] = {}
    sprint_breakdown: Dict[str, TaskSummary] = {}
    total_working_days: int = 0
    total_holidays: int = 0
