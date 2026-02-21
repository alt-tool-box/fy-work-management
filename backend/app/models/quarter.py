"""
Quarter Model - Represents a 3-month period
"""
import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Date, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Quarter(Base):
    """
    Quarter model representing a 3-month period (Q1, Q2, Q3, Q4)
    
    Hierarchy: FY → Quarter → Sprint
    """
    __tablename__ = "quarters"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(20), nullable=False)  # Q1, Q2, Q3, Q4
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    year = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    sprints = relationship("Sprint", back_populates="quarter", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Quarter(name='{self.name}', year={self.year})>"
