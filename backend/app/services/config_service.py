"""
Configuration Service - Business logic for app configuration
"""
from typing import Any, Dict, List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.configuration import Configuration
from app.schemas.configuration import ConfigurationUpdate, AppConfiguration

settings = get_settings()


class ConfigService:
    """Service class for configuration operations"""
    
    def __init__(self, db: Session):
        self.db = db
        # Default configuration values from centralized config
        self.DEFAULT_CONFIG = {
            "fy_start_month": settings.fy_start_month,
            "sprint_duration_days": settings.sprint_duration_days,
            "sprint_working_days": settings.sprint_working_days,
            "sprint_start_day": settings.default_sprint_start_day,
            "sprint_naming_pattern": "Sprint {number}",
            "work_categories": settings.work_categories_list,
            "default_priority": settings.default_priority,
            "default_status": settings.default_status
        }
    
    def get_all(self) -> Dict[str, Any]:
        """Get all configurations as a dictionary"""
        configs = self.db.query(Configuration).all()
        result = dict(self.DEFAULT_CONFIG)
        
        for config in configs:
            result[config.key] = config.value
        
        return result
    
    def get_by_key(self, key: str) -> Any:
        """Get a configuration value by key"""
        config = self.db.query(Configuration).filter(Configuration.key == key).first()
        
        if config:
            return config.value
        
        return self.DEFAULT_CONFIG.get(key)
    
    def set_value(self, key: str, value: Any) -> Configuration:
        """Set or update a configuration value"""
        config = self.db.query(Configuration).filter(Configuration.key == key).first()
        
        if config:
            config.value = value
        else:
            config = Configuration(key=key, value=value)
            self.db.add(config)
        
        self.db.commit()
        self.db.refresh(config)
        return config
    
    def update_config(self, update: ConfigurationUpdate) -> Configuration:
        """Update a single configuration"""
        return self.set_value(update.key, update.value)
    
    def update_bulk(self, updates: List[ConfigurationUpdate]) -> List[Configuration]:
        """Update multiple configurations at once"""
        configs = []
        for update in updates:
            config = self.set_value(update.key, update.value)
            configs.append(config)
        return configs
    
    def delete_config(self, key: str) -> bool:
        """Delete a configuration (reset to default)"""
        config = self.db.query(Configuration).filter(Configuration.key == key).first()
        if config:
            self.db.delete(config)
            self.db.commit()
            return True
        return False
    
    def get_app_configuration(self) -> AppConfiguration:
        """Get all configurations as AppConfiguration model"""
        config_dict = self.get_all()
        return AppConfiguration(**config_dict)
    
    def initialize_defaults(self) -> None:
        """Initialize default configurations if they don't exist"""
        for key, value in self.DEFAULT_CONFIG.items():
            existing = self.db.query(Configuration).filter(Configuration.key == key).first()
            if not existing:
                config = Configuration(key=key, value=value)
                self.db.add(config)
        
        self.db.commit()
    
    # Convenience methods for common configurations
    def get_fy_start_month(self) -> int:
        """Get fiscal year start month"""
        return self.get_by_key("fy_start_month") or 1
    
    def get_work_categories(self) -> List[str]:
        """Get list of work categories"""
        return self.get_by_key("work_categories") or []
    
    def add_work_category(self, category: str) -> List[str]:
        """Add a new work category"""
        categories = self.get_work_categories()
        if category not in categories:
            categories.append(category)
            self.set_value("work_categories", categories)
        return categories
    
    def remove_work_category(self, category: str) -> List[str]:
        """Remove a work category"""
        categories = self.get_work_categories()
        if category in categories:
            categories.remove(category)
            self.set_value("work_categories", categories)
        return categories
