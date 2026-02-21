"""
Configuration Model - Stores application configuration as key-value pairs
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class Configuration(Base):
    """
    Configuration model for storing app settings as key-value pairs
    """
    __tablename__ = "configuration"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(JSONB, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Configuration(key='{self.key}')>"
