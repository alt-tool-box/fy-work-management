"""
Sprint Model - Represents a 2-week work period within a quarter
"""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Date, Text, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Sprint(Base):
    """
    Sprint model representing a 2-week work period.
    1 Sprint = 2 Weeks = 14 Calendar Days (10 working days + 4 weekend days)
    
    Hierarchy: FY → Quarter → Sprint
    """
    __tablename__ = "sprints"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    quarter_id = Column(UUID(as_uuid=True), ForeignKey("quarters.id"), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(20), default="planned")  # planned, active, completed
    goal = Column(Text, nullable=True)
    working_days = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    quarter = relationship("Quarter", back_populates="sprints")
    work_entries = relationship("WorkEntry", back_populates="sprint", foreign_keys="WorkEntry.sprint_id")
    planned_tasks = relationship("PlannedTask", back_populates="sprint", foreign_keys="PlannedTask.sprint_id")
    
    def __repr__(self):
        return f"<Sprint(name='{self.name}', start_date='{self.start_date}', end_date='{self.end_date}')>"
