"""
AI Chat API Router
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.ai_service import AIService
from app.services.work_entry_service import WorkEntryService
from app.schemas.chat import ChatMessage, ChatResponse, ChatHistoryResponse, ChatHistoryItem

router = APIRouter(prefix="/chat", tags=["AI Chat"])


@router.post("", response_model=ChatResponse)
def send_chat_message(
    message: ChatMessage,
    db: Session = Depends(get_db)
):
    """
    Send a message to the AI chat agent.
    If session_id is not provided, a new session will be created.
    """
    ai_service = AIService(db)
    work_entry_service = WorkEntryService(db)
    
    # Build context from recent work entries
    from datetime import date, timedelta
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    
    recent_entries = work_entry_service.get_entries_in_range(week_start, today)
    context = None
    
    if recent_entries:
        context = "Recent work entries:\n"
        for entry in recent_entries[:10]:
            context += f"- {entry.date}: {entry.title}\n"
    
    return ai_service.chat(
        message=message.message,
        session_id=message.session_id,
        context=context
    )


@router.get("/history", response_model=ChatHistoryResponse)
def get_chat_history(
    session_id: UUID = Query(..., description="Chat session ID"),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Get chat history for a session"""
    ai_service = AIService(db)
    history = ai_service.get_chat_history(session_id, limit)
    
    return ChatHistoryResponse(
        session_id=session_id,
        messages=[
            ChatHistoryItem(
                id=msg.id,
                role=msg.role,
                message=msg.message,
                created_at=msg.created_at
            )
            for msg in history
        ],
        total=len(history)
    )


@router.get("/sessions", response_model=List[UUID])
def get_all_sessions(db: Session = Depends(get_db)):
    """Get all chat session IDs"""
    ai_service = AIService(db)
    return ai_service.get_all_sessions()


@router.delete("/history/{session_id}", status_code=204)
def delete_chat_history(session_id: UUID, db: Session = Depends(get_db)):
    """Delete chat history for a session"""
    ai_service = AIService(db)
    if not ai_service.delete_chat_history(session_id):
        raise HTTPException(status_code=404, detail="Session not found")
