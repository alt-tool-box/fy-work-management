"""
File Upload API Router
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.services.file_service import FileService
from app.services.work_entry_service import WorkEntryService
from app.schemas.attachment import AttachmentResponse

router = APIRouter(prefix="/files", tags=["Files"])
settings = get_settings()


@router.post("/upload", response_model=AttachmentResponse, status_code=201)
async def upload_file(
    work_entry_id: UUID = Query(..., description="Work entry to attach file to"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a file and attach it to a work entry.
    File size and allowed types are configured in settings.
    """
    # Verify work entry exists
    work_entry_service = WorkEntryService(db)
    work_entry = work_entry_service.get_by_id(work_entry_id)
    if not work_entry:
        raise HTTPException(status_code=404, detail="Work entry not found")
    
    # Validate file type using config
    if file.content_type not in settings.allowed_file_types_list:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. Allowed types: images, PDF, Word, Excel, text files"
        )
    
    # Read file content
    content = await file.read()
    
    # Validate file size using config
    if len(content) > settings.max_file_size:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {settings.max_file_size // (1024*1024)}MB"
        )
    
    # Upload file
    file_service = FileService(db)
    attachment = file_service.upload_file(
        work_entry_id=work_entry_id,
        file_name=file.filename,
        file_content=content,
        content_type=file.content_type
    )
    
    if not attachment:
        raise HTTPException(status_code=500, detail="Failed to upload file")
    
    return file_service.get_attachment_response(attachment)


@router.get("/work-entry/{work_entry_id}", response_model=List[AttachmentResponse])
def get_attachments_by_work_entry(
    work_entry_id: UUID,
    db: Session = Depends(get_db)
):
    """Get all attachments for a work entry"""
    file_service = FileService(db)
    attachments = file_service.get_attachments_by_work_entry(work_entry_id)
    return [file_service.get_attachment_response(a) for a in attachments]


@router.get("/{attachment_id}", response_model=AttachmentResponse)
def get_attachment(attachment_id: UUID, db: Session = Depends(get_db)):
    """Get attachment details with download URL"""
    file_service = FileService(db)
    attachment = file_service.get_attachment(attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return file_service.get_attachment_response(attachment)


@router.get("/{attachment_id}/download-url", response_model=dict)
def get_download_url(
    attachment_id: UUID,
    expires_hours: int = Query(default=1, ge=1, le=24),
    db: Session = Depends(get_db)
):
    """Get a presigned download URL for an attachment"""
    file_service = FileService(db)
    url = file_service.get_download_url(attachment_id, expires_hours)
    if not url:
        raise HTTPException(status_code=404, detail="Attachment not found or URL generation failed")
    return {"download_url": url, "expires_in_hours": expires_hours}


@router.delete("/{attachment_id}", status_code=204)
def delete_attachment(attachment_id: UUID, db: Session = Depends(get_db)):
    """Delete an attachment"""
    file_service = FileService(db)
    if not file_service.delete_file(attachment_id):
        raise HTTPException(status_code=404, detail="Attachment not found")
