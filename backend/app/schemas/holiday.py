"""
Holiday Pydantic Schemas
"""
from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class HolidayBase(BaseModel):
    """Base Holiday schema with common fields"""
    name: str = Field(..., min_length=1, max_length=255)
    date: date
    is_recurring: bool = False
    description: Optional[str] = None
    holiday_type: str = Field(default="holiday", pattern="^(holiday|day_off|leave)$")


class HolidayCreate(HolidayBase):
    """Schema for creating a new holiday"""
    pass


class HolidayUpdate(BaseModel):
    """Schema for updating a holiday"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    date: Optional[date] = None
    is_recurring: Optional[bool] = None
    description: Optional[str] = None
    holiday_type: Optional[str] = Field(None, pattern="^(holiday|day_off|leave)$")


class HolidayResponse(BaseModel):
    """Schema for holiday response"""
    id: UUID
    name: str
    date: date
    is_recurring: bool = False
    description: Optional[str] = None
    holiday_type: Optional[str] = "holiday"
    created_at: datetime
    
    class Config:
        from_attributes = True
