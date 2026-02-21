"""
Quarter Pydantic Schemas
"""
from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


class QuarterBase(BaseModel):
    """Base Quarter schema with common fields"""
    name: str = Field(..., pattern="^Q[1-4]$", description="Quarter name (Q1, Q2, Q3, Q4)")
    start_date: date
    end_date: date
    year: int = Field(..., ge=2020, le=2100)
    
    @field_validator('end_date')
    @classmethod
    def validate_end_date(cls, v, info):
        """Ensure end_date is after start_date"""
        if 'start_date' in info.data and v:
            if v <= info.data['start_date']:
                raise ValueError('end_date must be after start_date')
        return v


class QuarterCreate(QuarterBase):
    """Schema for creating a new quarter"""
    pass


class QuarterUpdate(BaseModel):
    """Schema for updating a quarter"""
    name: Optional[str] = Field(None, pattern="^Q[1-4]$")
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    year: Optional[int] = Field(None, ge=2020, le=2100)


class QuarterResponse(QuarterBase):
    """Schema for quarter response"""
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
