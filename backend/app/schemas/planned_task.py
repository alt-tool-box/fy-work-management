"""
Planned Task Pydantic Schemas
"""
from datetime import date, datetime
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field, model_validator


class PlannedTaskBase(BaseModel):
    """Base Planned Task schema with common fields"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    year: int = Field(..., ge=2020, le=2100)
    target_date: Optional[date] = None
    estimated_hours: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    story_points: Optional[int] = Field(None, ge=0)
    priority: str = Field(default="medium", pattern="^(low|medium|high|critical)$")
    category: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None


class PlannedTaskCreate(PlannedTaskBase):
    """Schema for creating a new planned task"""
    sprint_id: Optional[UUID] = None
    week_number: Optional[int] = Field(None, ge=1, le=53)
    status: str = Field(default="planned", pattern="^(planned|in_progress|completed|deferred|cancelled)$")
    
    @model_validator(mode='after')
    def validate_sprint_or_week(self):
        """Ensure either sprint_id or week_number is provided"""
        if self.sprint_id is None and self.week_number is None:
            raise ValueError('Either sprint_id or week_number must be provided')
        return self


class PlannedTaskUpdate(BaseModel):
    """Schema for updating a planned task"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    sprint_id: Optional[UUID] = None
    week_number: Optional[int] = Field(None, ge=1, le=53)
    year: Optional[int] = Field(None, ge=2020, le=2100)
    target_date: Optional[date] = None
    estimated_hours: Optional[Decimal] = Field(None, ge=0)
    story_points: Optional[int] = Field(None, ge=0)
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|critical)$")
    status: Optional[str] = Field(None, pattern="^(planned|in_progress|completed|deferred|cancelled)$")
    category: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None


class PlannedTaskResponse(PlannedTaskBase):
    """Schema for planned task response"""
    id: UUID
    sprint_id: Optional[UUID] = None
    week_number: Optional[int] = None
    status: str
    work_entry_id: Optional[UUID] = None
    deferred_to_sprint_id: Optional[UUID] = None
    deferred_to_week: Optional[int] = None
    
    # External integration fields
    external_id: Optional[str] = None
    external_source: Optional[str] = None
    last_synced_at: Optional[datetime] = None
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PlannedTaskComplete(BaseModel):
    """Schema for marking a planned task as complete"""
    description: str = Field(..., min_length=1, description="Work entry description")
    time_spent: Optional[int] = Field(None, ge=0, description="Time spent in minutes")
    notes: Optional[str] = None


class PlannedTaskDefer(BaseModel):
    """Schema for deferring a planned task"""
    defer_to_sprint_id: Optional[UUID] = None
    defer_to_week: Optional[int] = Field(None, ge=1, le=53)
    defer_to_year: Optional[int] = Field(None, ge=2020, le=2100)
    reason: Optional[str] = None
    
    @model_validator(mode='after')
    def validate_defer_target(self):
        """Ensure either sprint_id or week_number is provided for deferral"""
        if self.defer_to_sprint_id is None and self.defer_to_week is None:
            raise ValueError('Either defer_to_sprint_id or defer_to_week must be provided')
        return self


class PlannedTaskStats(BaseModel):
    """Schema for planned task statistics"""
    total_planned: int
    completed: int
    in_progress: int
    deferred: int
    cancelled: int
    completion_rate: float
    total_story_points: int
    completed_story_points: int
