"""
Sprint Pydantic Schemas
"""
from datetime import date, datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class SprintBase(BaseModel):
    """Base Sprint schema with common fields"""
    name: str = Field(..., min_length=1, max_length=100)
    quarter_id: Optional[UUID] = Field(None, description="Quarter this sprint belongs to")
    start_date: date
    end_date: date
    goal: Optional[str] = None


class SprintCreate(SprintBase):
    """Schema for creating a new sprint"""
    status: str = Field(default="planned", pattern="^(planned|active|completed)$")
    working_days: int = Field(default=10, ge=1, le=30)


class SprintUpdate(BaseModel):
    """Schema for updating a sprint"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    quarter_id: Optional[UUID] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = Field(None, pattern="^(planned|active|completed)$")
    goal: Optional[str] = None
    working_days: Optional[int] = Field(None, ge=1, le=30)


class SprintResponse(SprintBase):
    """Schema for sprint response"""
    id: UUID
    status: str
    working_days: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class SprintWithQuarterResponse(SprintResponse):
    """Sprint response with quarter details"""
    quarter_name: Optional[str] = None
    quarter_year: Optional[int] = None


class SprintGenerateRequest(BaseModel):
    """Schema for auto-generating sprints for a year"""
    year: int = Field(..., ge=2020, le=2100)
    start_date: date = Field(..., description="First sprint start date")
    sprint_prefix: str = Field(default="Sprint", max_length=50)
