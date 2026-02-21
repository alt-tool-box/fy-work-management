"""
Sprint API Router
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.sprint_service import SprintService
from app.schemas.sprint import (
    SprintCreate, SprintUpdate, SprintResponse, SprintGenerateRequest
)

router = APIRouter(prefix="/sprints", tags=["Sprints"])


@router.get("", response_model=List[SprintResponse])
def get_sprints(
    status: Optional[str] = Query(None, description="Filter by status"),
    year: Optional[int] = Query(None, description="Filter by year"),
    quarter_id: Optional[UUID] = Query(None, description="Filter by quarter"),
    db: Session = Depends(get_db)
):
    """Get all sprints with optional filtering"""
    service = SprintService(db)
    return service.get_all(status=status, year=year, quarter_id=quarter_id)


@router.get("/quarter/{quarter_id}", response_model=List[SprintResponse])
def get_sprints_by_quarter(quarter_id: UUID, db: Session = Depends(get_db)):
    """Get all sprints for a specific quarter"""
    service = SprintService(db)
    return service.get_by_quarter(quarter_id)


@router.get("/active", response_model=Optional[SprintResponse])
def get_active_sprint(db: Session = Depends(get_db)):
    """Get the currently active sprint"""
    service = SprintService(db)
    sprint = service.get_active_sprint()
    return sprint


@router.get("/current", response_model=Optional[SprintResponse])
def get_current_or_next_sprint(db: Session = Depends(get_db)):
    """Get current sprint or next upcoming sprint"""
    service = SprintService(db)
    return service.get_current_or_next_sprint()


@router.get("/{sprint_id}", response_model=SprintResponse)
def get_sprint(sprint_id: UUID, db: Session = Depends(get_db)):
    """Get a specific sprint by ID"""
    service = SprintService(db)
    sprint = service.get_by_id(sprint_id)
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return sprint


@router.post("", response_model=SprintResponse, status_code=201)
def create_sprint(sprint_data: SprintCreate, db: Session = Depends(get_db)):
    """Create a new sprint with validation"""
    service = SprintService(db)
    try:
        return service.create(sprint_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{sprint_id}", response_model=SprintResponse)
def update_sprint(
    sprint_id: UUID, 
    sprint_data: SprintUpdate, 
    db: Session = Depends(get_db)
):
    """Update a sprint with validation"""
    service = SprintService(db)
    try:
        sprint = service.update(sprint_id, sprint_data)
        if not sprint:
            raise HTTPException(status_code=404, detail="Sprint not found")
        return sprint
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{sprint_id}", status_code=204)
def delete_sprint(sprint_id: UUID, db: Session = Depends(get_db)):
    """Delete a sprint"""
    service = SprintService(db)
    if not service.delete(sprint_id):
        raise HTTPException(status_code=404, detail="Sprint not found")


@router.post("/generate", response_model=List[SprintResponse], status_code=201)
def generate_sprints(
    request: SprintGenerateRequest,
    db: Session = Depends(get_db)
):
    """Auto-generate 26 sprints for a year"""
    service = SprintService(db)
    return service.generate_sprints_for_year(request)


@router.post("/{sprint_id}/activate", response_model=SprintResponse)
def activate_sprint(sprint_id: UUID, db: Session = Depends(get_db)):
    """Activate a sprint (and deactivate current active sprint)"""
    service = SprintService(db)
    sprint = service.activate_sprint(sprint_id)
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return sprint
