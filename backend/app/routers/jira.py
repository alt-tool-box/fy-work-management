"""
Jira Integration API Router - Endpoints for Jira synchronization
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime

from app.database import get_db
from app.services.jira_service import JiraService
from app.schemas.planned_task import PlannedTaskResponse

router = APIRouter(prefix="/jira", tags=["jira"])


class JiraSyncRequest(BaseModel):
    """Request schema for Jira sync"""
    cookie: str = Field(..., description="Jira authentication cookie")
    rapid_view_id: int = Field(27928, description="Jira board ID")
    quick_filter_id: int = Field(399097, description="Jira quick filter ID (usually for assigned tasks)")
    selected_project_key: str = Field("SECENGDEV", description="Jira project key")
    year: int = Field(None, description="Target year for syncing (defaults to current year)")
    quarter_id: str = Field(None, description="Assign tasks to this specific quarter")
    sprint_id: str = Field(None, description="Assign tasks to this specific sprint")


class JiraSyncResponse(BaseModel):
    """Response schema for Jira sync"""
    success: bool
    message: str
    results: Dict[str, Any]
    synced_at: datetime


@router.post("/sync", response_model=JiraSyncResponse)
async def sync_jira_tasks(
    request: JiraSyncRequest,
    db: Session = Depends(get_db)
):
    """
    Sync tasks from Jira to the application
    
    **Process:**
    1. Fetches tasks from Jira using provided credentials
    2. Maps Jira issues to PlannedTask format
    3. Creates new tasks or updates existing ones (by external_id)
    4. Returns sync statistics
    
    **Authentication:**
    - Requires valid Jira cookie from the user
    - Cookie is not stored, only used for this request
    
    **Duplicate Prevention:**
    - Uses Jira issue key (external_id) to prevent duplicates
    - Updates existing tasks if they were previously synced
    """
    try:
        service = JiraService(db)
        
        # Perform sync
        results = await service.sync_tasks(
            cookie=request.cookie,
            rapid_view_id=request.rapid_view_id,
            quick_filter_id=request.quick_filter_id,
            selected_project_key=request.selected_project_key,
            year=request.year,
            quarter_id=request.quarter_id,
            sprint_id=request.sprint_id
        )
        
        # Build response message
        message = f"Synced {results['total']} tasks: "
        message += f"{results['created']} created, "
        message += f"{results['updated']} updated, "
        message += f"{results['skipped']} skipped"
        
        if results['errors']:
            message += f" (with {len(results['errors'])} errors)"
        
        return JiraSyncResponse(
            success=True,
            message=message,
            results=results,
            synced_at=datetime.utcnow()
        )
        
    except ValueError as e:
        # User-friendly errors (auth, validation, etc.)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sync failed: {str(e)}"
        )


@router.get("/sync-history", response_model=List[PlannedTaskResponse])
def get_sync_history(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get recently synced tasks from Jira
    
    Returns the last N tasks that were synced from Jira,
    ordered by last_synced_at (most recent first).
    """
    try:
        service = JiraService(db)
        tasks = service.get_sync_history(limit=limit)
        return tasks
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch sync history: {str(e)}"
        )


@router.get("/test-connection")
async def test_jira_connection(
    cookie: str,
    rapid_view_id: int = 27928,
    db: Session = Depends(get_db)
):
    """
    Test Jira connection without syncing
    
    Verifies that the provided cookie and board ID are valid.
    """
    try:
        service = JiraService(db)
        
        # Just try to fetch data without syncing
        jira_data = await service.fetch_jira_data(
            cookie=cookie,
            rapid_view_id=rapid_view_id,
            quick_filter_id=0  # No filter for test
        )
        
        issues_count = len(jira_data.get("issuesData", {}).get("issues", []))
        
        return {
            "success": True,
            "message": "Connection successful",
            "board_id": rapid_view_id,
            "total_issues": issues_count
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Connection test failed: {str(e)}"
        )
