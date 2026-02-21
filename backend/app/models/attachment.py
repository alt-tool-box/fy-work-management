"""
Attachment Model - Represents file attachments for work entries
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Attachment(Base):
    """
    Attachment model for file attachments stored in MinIO
    """
    __tablename__ = "attachments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    work_entry_id = Column(UUID(as_uuid=True), ForeignKey("work_entries.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    file_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)  # in bytes
    minio_bucket = Column(String(100), nullable=False)
    minio_key = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    work_entry = relationship("WorkEntry", back_populates="attachments")
    
    def __repr__(self):
        return f"<Attachment(file_name='{self.file_name}')>"
