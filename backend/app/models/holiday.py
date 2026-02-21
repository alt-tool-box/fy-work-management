"""
Holiday Model - Represents holidays and days off
"""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Date, Boolean, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Holiday(Base):
    """
    Holiday model for tracking holidays and days off
    """
    __tablename__ = "holidays"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    date = Column(Date, nullable=False)
    is_recurring = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    holiday_type = Column(String(50), default="holiday")  # holiday, day_off, leave
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Holiday(name='{self.name}', date='{self.date}')>"
