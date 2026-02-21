"""
Work Entry Model - Represents actual work done on a specific day
"""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Date, Text, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship

from app.database import Base


class WorkEntry(Base):
    """
    Work Entry model for tracking actual work completed
    """
    __tablename__ = "work_entries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    date = Column(Date, nullable=False)
    category = Column(String(100), nullable=True)
    tags = Column(ARRAY(String), nullable=True)
    time_spent = Column(Integer, nullable=True)  # in minutes
    priority = Column(String(20), default="medium")  # low, medium, high, critical
    status = Column(String(20), default="completed")  # in_progress, completed, on_hold
    sprint_id = Column(UUID(as_uuid=True), ForeignKey("sprints.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sprint = relationship("Sprint", back_populates="work_entries", foreign_keys=[sprint_id])
    # planned_task relationship is defined via PlannedTask.work_entry_id
    attachments = relationship("Attachment", back_populates="work_entry", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<WorkEntry(title='{self.title}', date='{self.date}')>"
