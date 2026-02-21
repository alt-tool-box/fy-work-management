"""
Configuration Pydantic Schemas
"""
from datetime import datetime
from typing import Any, Dict, Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class ConfigurationUpdate(BaseModel):
    """Schema for updating configuration"""
    key: str = Field(..., min_length=1, max_length=100)
    value: Any


class ConfigurationResponse(BaseModel):
    """Schema for configuration response"""
    id: UUID
    key: str
    value: Any
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ConfigurationBulkUpdate(BaseModel):
    """Schema for bulk configuration update"""
    configurations: List[ConfigurationUpdate]


class AppConfiguration(BaseModel):
    """Schema for all app configurations"""
    fy_start_month: int = Field(default=1, ge=1, le=12)
    sprint_duration_weeks: int = Field(default=2)
    sprint_start_day: str = Field(default="monday")
    sprint_naming_pattern: str = Field(default="Sprint {number}")
    work_categories: List[str] = Field(default_factory=lambda: [
        "Development", "Meeting", "Review", "Documentation", "Research", "Other"
    ])
    default_priority: str = Field(default="medium")
    default_status: str = Field(default="completed")
