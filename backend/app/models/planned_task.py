"""
Planned Task Model - Represents tasks planned for a sprint or week
"""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Date, Text, Integer, DateTime, ForeignKey, Numeric, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship

from app.database import Base


class PlannedTask(Base):
    """
    Planned Task model for tracking tasks scheduled for sprints or weeks
    """
    __tablename__ = "planned_tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    sprint_id = Column(UUID(as_uuid=True), ForeignKey("sprints.id"), nullable=True)
    week_number = Column(Integer, nullable=True)  # ISO week number (1-53)
    year = Column(Integer, nullable=False)
    target_date = Column(Date, nullable=True)
    estimated_hours = Column(Numeric(5, 2), nullable=True)
    story_points = Column(Integer, nullable=True)
    priority = Column(String(20), default="medium")  # low, medium, high, critical
    status = Column(String(20), default="planned")  # planned, in_progress, completed, deferred, cancelled
    category = Column(String(100), nullable=True)
    tags = Column(ARRAY(String), nullable=True)
    work_entry_id = Column(UUID(as_uuid=True), ForeignKey("work_entries.id"), nullable=True)
    deferred_to_sprint_id = Column(UUID(as_uuid=True), ForeignKey("sprints.id"), nullable=True)
    deferred_to_week = Column(Integer, nullable=True)
    
    # External integration fields
    external_id = Column(String(100), nullable=True, unique=True, index=True)  # Jira issue key, etc.
    external_source = Column(String(50), nullable=True)  # "jira", "manual", etc.
    last_synced_at = Column(DateTime, nullable=True)  # Last sync timestamp
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sprint = relationship("Sprint", back_populates="planned_tasks", foreign_keys=[sprint_id])
    work_entry = relationship("WorkEntry", foreign_keys=[work_entry_id], uselist=False)
    deferred_to_sprint = relationship("Sprint", foreign_keys=[deferred_to_sprint_id])
    
    # Constraint: Either sprint_id or week_number must be provided
    __table_args__ = (
        CheckConstraint(
            'sprint_id IS NOT NULL OR week_number IS NOT NULL',
            name='chk_sprint_or_week'
        ),
    )
    
    def __repr__(self):
        return f"<PlannedTask(title='{self.title}', status='{self.status}')>"
