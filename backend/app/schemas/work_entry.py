"""
Work Entry Pydantic Schemas
"""
from datetime import date, datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class WorkEntryBase(BaseModel):
    """Base Work Entry schema with common fields"""
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    date: date
    category: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None
    time_spent: Optional[int] = Field(None, ge=0, description="Time spent in minutes")
    priority: str = Field(default="medium", pattern="^(low|medium|high|critical)$")
    status: str = Field(default="completed", pattern="^(in_progress|completed|on_hold)$")
    notes: Optional[str] = None


class WorkEntryCreate(WorkEntryBase):
    """Schema for creating a new work entry"""
    sprint_id: Optional[UUID] = None


class WorkEntryUpdate(BaseModel):
    """Schema for updating a work entry"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    date: Optional[date] = None
    category: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None
    time_spent: Optional[int] = Field(None, ge=0)
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|critical)$")
    status: Optional[str] = Field(None, pattern="^(in_progress|completed|on_hold)$")
    sprint_id: Optional[UUID] = None
    notes: Optional[str] = None


class WorkEntryResponse(WorkEntryBase):
    """Schema for work entry response"""
    id: UUID
    sprint_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class WorkEntryListResponse(BaseModel):
    """Schema for paginated work entry list response"""
    items: List[WorkEntryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
