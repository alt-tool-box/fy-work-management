"""
Chat Pydantic Schemas
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Schema for sending a chat message"""
    message: str = Field(..., min_length=1, max_length=5000)
    session_id: Optional[UUID] = None  # If None, creates new session


class ChatResponse(BaseModel):
    """Schema for chat response"""
    session_id: UUID
    message: str
    response: str
    created_at: datetime


class ChatHistoryItem(BaseModel):
    """Schema for a single chat history item"""
    id: UUID
    role: str  # user, assistant
    message: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    """Schema for chat history response"""
    session_id: UUID
    messages: List[ChatHistoryItem]
    total: int
