"""
Attachment Pydantic Schemas
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class AttachmentCreate(BaseModel):
    """Schema for creating an attachment record"""
    work_entry_id: UUID
    file_name: str = Field(..., min_length=1, max_length=255)
    file_path: Optional[str] = None
    file_type: Optional[str] = Field(None, max_length=100)
    file_size: Optional[int] = Field(None, ge=0)
    minio_bucket: str = Field(..., min_length=1, max_length=100)
    minio_key: str = Field(..., min_length=1, max_length=500)


class AttachmentResponse(BaseModel):
    """Schema for attachment response"""
    id: UUID
    work_entry_id: UUID
    file_name: str
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    minio_bucket: str
    minio_key: str
    created_at: datetime
    download_url: Optional[str] = None  # Presigned URL for download
    
    class Config:
        from_attributes = True
