"""
File Service - Business logic for file upload/download with MinIO
"""
import io
import uuid
from datetime import timedelta
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from minio import Minio
from minio.error import S3Error

from app.config import get_settings
from app.models.attachment import Attachment
from app.schemas.attachment import AttachmentCreate, AttachmentResponse

settings = get_settings()


class FileService:
    """Service class for file operations with MinIO"""
    
    def __init__(self, db: Session):
        self.db = db
        self.minio_client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure
        )
        self.bucket_name = settings.minio_bucket
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Create bucket if it doesn't exist"""
        try:
            if not self.minio_client.bucket_exists(self.bucket_name):
                self.minio_client.make_bucket(self.bucket_name)
        except S3Error as e:
            print(f"Error creating bucket: {e}")
    
    def upload_file(
        self,
        work_entry_id: UUID,
        file_name: str,
        file_content: bytes,
        content_type: str
    ) -> Optional[Attachment]:
        """
        Upload a file to MinIO and create an attachment record.
        """
        try:
            # Generate unique key for the file
            file_extension = file_name.split('.')[-1] if '.' in file_name else ''
            unique_id = str(uuid.uuid4())
            minio_key = f"attachments/{work_entry_id}/{unique_id}.{file_extension}"
            
            # Upload to MinIO
            file_size = len(file_content)
            self.minio_client.put_object(
                self.bucket_name,
                minio_key,
                io.BytesIO(file_content),
                length=file_size,
                content_type=content_type
            )
            
            # Create attachment record
            attachment = Attachment(
                work_entry_id=work_entry_id,
                file_name=file_name,
                file_type=content_type,
                file_size=file_size,
                minio_bucket=self.bucket_name,
                minio_key=minio_key
            )
            
            self.db.add(attachment)
            self.db.commit()
            self.db.refresh(attachment)
            
            return attachment
            
        except S3Error as e:
            print(f"Error uploading file: {e}")
            return None
    
    def get_attachment(self, attachment_id: UUID) -> Optional[Attachment]:
        """Get attachment by ID"""
        return self.db.query(Attachment).filter(Attachment.id == attachment_id).first()
    
    def get_attachments_by_work_entry(self, work_entry_id: UUID) -> list[Attachment]:
        """Get all attachments for a work entry"""
        return self.db.query(Attachment)\
            .filter(Attachment.work_entry_id == work_entry_id)\
            .all()
    
    def get_download_url(self, attachment_id: UUID, expires_hours: int = 1) -> Optional[str]:
        """
        Generate a presigned URL for downloading a file.
        """
        attachment = self.get_attachment(attachment_id)
        if not attachment:
            return None
        
        try:
            url = self.minio_client.presigned_get_object(
                attachment.minio_bucket,
                attachment.minio_key,
                expires=timedelta(hours=expires_hours)
            )
            return url
        except S3Error as e:
            print(f"Error generating download URL: {e}")
            return None
    
    def delete_file(self, attachment_id: UUID) -> bool:
        """
        Delete a file from MinIO and remove the attachment record.
        """
        attachment = self.get_attachment(attachment_id)
        if not attachment:
            return False
        
        try:
            # Delete from MinIO
            self.minio_client.remove_object(
                attachment.minio_bucket,
                attachment.minio_key
            )
            
            # Delete attachment record
            self.db.delete(attachment)
            self.db.commit()
            
            return True
            
        except S3Error as e:
            print(f"Error deleting file: {e}")
            return False
    
    def get_attachment_response(self, attachment: Attachment) -> AttachmentResponse:
        """Convert attachment to response with download URL"""
        download_url = self.get_download_url(attachment.id)
        
        return AttachmentResponse(
            id=attachment.id,
            work_entry_id=attachment.work_entry_id,
            file_name=attachment.file_name,
            file_path=attachment.file_path,
            file_type=attachment.file_type,
            file_size=attachment.file_size,
            minio_bucket=attachment.minio_bucket,
            minio_key=attachment.minio_key,
            created_at=attachment.created_at,
            download_url=download_url
        )
