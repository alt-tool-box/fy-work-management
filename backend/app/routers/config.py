"""
Configuration API Router
"""
from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.config_service import ConfigService
from app.schemas.configuration import (
    ConfigurationUpdate, ConfigurationResponse, 
    ConfigurationBulkUpdate, AppConfiguration
)

router = APIRouter(prefix="/config", tags=["Configuration"])


@router.get("", response_model=Dict[str, Any])
def get_all_config(db: Session = Depends(get_db)):
    """Get all configuration values"""
    service = ConfigService(db)
    return service.get_all()


@router.get("/app", response_model=AppConfiguration)
def get_app_configuration(db: Session = Depends(get_db)):
    """Get app configuration as structured object"""
    service = ConfigService(db)
    return service.get_app_configuration()


@router.get("/{key}")
def get_config_value(key: str, db: Session = Depends(get_db)):
    """Get a specific configuration value"""
    service = ConfigService(db)
    value = service.get_by_key(key)
    return {"key": key, "value": value}


@router.put("", response_model=ConfigurationResponse)
def update_config(update: ConfigurationUpdate, db: Session = Depends(get_db)):
    """Update a single configuration value"""
    service = ConfigService(db)
    return service.update_config(update)


@router.put("/bulk", response_model=List[ConfigurationResponse])
def update_config_bulk(updates: ConfigurationBulkUpdate, db: Session = Depends(get_db)):
    """Update multiple configuration values at once"""
    service = ConfigService(db)
    return service.update_bulk(updates.configurations)


@router.delete("/{key}", status_code=204)
def delete_config(key: str, db: Session = Depends(get_db)):
    """Delete a configuration (reset to default)"""
    service = ConfigService(db)
    service.delete_config(key)


@router.post("/initialize", response_model=Dict[str, str])
def initialize_defaults(db: Session = Depends(get_db)):
    """Initialize default configurations"""
    service = ConfigService(db)
    service.initialize_defaults()
    return {"message": "Default configurations initialized"}


# Work Categories Management
@router.get("/categories", response_model=List[str])
def get_work_categories(db: Session = Depends(get_db)):
    """Get list of work categories"""
    service = ConfigService(db)
    return service.get_work_categories()


@router.post("/categories/{category}", response_model=List[str])
def add_work_category(category: str, db: Session = Depends(get_db)):
    """Add a new work category"""
    service = ConfigService(db)
    return service.add_work_category(category)


@router.delete("/categories/{category}", response_model=List[str])
def remove_work_category(category: str, db: Session = Depends(get_db)):
    """Remove a work category"""
    service = ConfigService(db)
    return service.remove_work_category(category)
