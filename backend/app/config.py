"""
Application configuration using Pydantic Settings
All service configurations are centralized here.
"""
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from functools import lru_cache
import json


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    All configurations for the FY Work Management application.
    """
    
    # ============================================
    # APPLICATION SETTINGS
    # ============================================
    app_name: str = Field(default="FY Work Management", description="Application name")
    app_version: str = Field(default="1.0.0", description="Application version")
    debug: bool = Field(default=True, description="Debug mode")
    api_prefix: str = Field(default="/api/v1", description="API prefix")
    
    # ============================================
    # SERVER SETTINGS
    # ============================================
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")
    reload: bool = Field(default=True, description="Auto-reload on code changes")
    workers: int = Field(default=1, description="Number of worker processes")
    
    # ============================================
    # CORS SETTINGS
    # ============================================
    cors_origins: str = Field(
        default='["http://localhost:5173", "http://localhost:3000"]',
        description="Allowed CORS origins (JSON array string)"
    )
    cors_allow_credentials: bool = Field(default=True, description="Allow credentials")
    cors_allow_methods: str = Field(default='["*"]', description="Allowed HTTP methods")
    cors_allow_headers: str = Field(default='["*"]', description="Allowed headers")
    
    # ============================================
    # DATABASE SETTINGS (PostgreSQL)
    # ============================================
    database_url: str = Field(
        default="postgresql://postgres@localhost:5432/fy_work_management",
        description="PostgreSQL connection URL"
    )
    db_pool_size: int = Field(default=10, description="Database connection pool size")
    db_max_overflow: int = Field(default=20, description="Max overflow connections")
    db_pool_pre_ping: bool = Field(default=True, description="Enable pool pre-ping")
    db_echo: bool = Field(default=False, description="Echo SQL queries (for debugging)")
    
    # ============================================
    # MINIO SETTINGS (File Storage)
    # ============================================
    minio_endpoint: str = Field(default="127.0.0.1:9000", description="MinIO server endpoint")
    minio_access_key: str = Field(default="minioadmin", description="MinIO access key")
    minio_secret_key: str = Field(default="minioadmin", description="MinIO secret key")
    minio_bucket: str = Field(default="fy-work-management", description="MinIO bucket name")
    minio_secure: bool = Field(default=False, description="Use HTTPS for MinIO")
    minio_region: Optional[str] = Field(default=None, description="MinIO region")
    
    # File upload settings
    max_file_size: int = Field(default=10485760, description="Max file size in bytes (10MB)")
    allowed_file_types: str = Field(
        default='["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/plain", "text/csv"]',
        description="Allowed file MIME types (JSON array string)"
    )
    
    # ============================================
    # OLLAMA SETTINGS (AI/LLM)
    # ============================================
    ollama_base_url: str = Field(default="http://localhost:11434", description="Ollama API base URL")
    ollama_model: str = Field(default="gpt-oss:20b", description="Ollama model name")
    ollama_timeout: float = Field(default=60.0, description="Ollama request timeout in seconds")
    ollama_max_retries: int = Field(default=3, description="Max retries for Ollama requests")
    ai_enabled: bool = Field(default=True, description="Enable AI features")
    
    # ============================================
    # SPRINT SETTINGS
    # ============================================
    sprint_duration_days: int = Field(default=14, description="Sprint duration in days (2 weeks)")
    sprint_working_days: int = Field(default=10, description="Working days per sprint")
    sprints_per_year: int = Field(default=26, description="Number of sprints per year")
    default_sprint_start_day: str = Field(default="monday", description="Default sprint start day")
    
    # ============================================
    # FISCAL YEAR SETTINGS
    # ============================================
    fy_start_month: int = Field(default=1, ge=1, le=12, description="Fiscal year start month (1-12)")
    
    # ============================================
    # WORK ENTRY SETTINGS
    # ============================================
    default_work_categories: str = Field(
        default='["Development", "Meeting", "Review", "Documentation", "Research", "Bug Fix", "Testing", "Planning", "Other"]',
        description="Default work categories (JSON array string)"
    )
    default_priority: str = Field(default="medium", description="Default task priority")
    default_status: str = Field(default="completed", description="Default work entry status")
    
    # ============================================
    # PAGINATION SETTINGS
    # ============================================
    default_page_size: int = Field(default=20, description="Default page size")
    max_page_size: int = Field(default=100, description="Maximum page size")
    
    # ============================================
    # LOGGING SETTINGS
    # ============================================
    log_level: str = Field(default="INFO", description="Logging level")
    log_format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Log format"
    )
    
    # ============================================
    # HELPER PROPERTIES
    # ============================================
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from JSON string"""
        try:
            return json.loads(self.cors_origins)
        except json.JSONDecodeError:
            return ["http://localhost:5173", "http://localhost:3000"]
    
    @property
    def cors_methods_list(self) -> List[str]:
        """Parse CORS methods from JSON string"""
        try:
            return json.loads(self.cors_allow_methods)
        except json.JSONDecodeError:
            return ["*"]
    
    @property
    def cors_headers_list(self) -> List[str]:
        """Parse CORS headers from JSON string"""
        try:
            return json.loads(self.cors_allow_headers)
        except json.JSONDecodeError:
            return ["*"]
    
    @property
    def allowed_file_types_list(self) -> List[str]:
        """Parse allowed file types from JSON string"""
        try:
            return json.loads(self.allowed_file_types)
        except json.JSONDecodeError:
            return ["image/jpeg", "image/png", "application/pdf"]
    
    @property
    def work_categories_list(self) -> List[str]:
        """Parse work categories from JSON string"""
        try:
            return json.loads(self.default_work_categories)
        except json.JSONDecodeError:
            return ["Development", "Meeting", "Review", "Other"]
    
    @property
    def database_url_with_driver(self) -> str:
        """Get database URL with psycopg driver"""
        url = self.database_url
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url
    
    # ============================================
    # PYDANTIC SETTINGS CONFIG
    # ============================================
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Uses LRU cache to avoid reading .env file on every request.
    """
    return Settings()


# ============================================
# SAMPLE .ENV FILE CONTENT
# ============================================
"""
# Application
APP_NAME=FY Work Management
APP_VERSION=1.0.0
DEBUG=true

# Server
HOST=0.0.0.0
PORT=8000

# CORS
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fy_work_management
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20

# MinIO (File Storage)
MINIO_ENDPOINT=127.0.0.1:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=fy-work-management
MINIO_SECURE=false

# Ollama (AI/LLM)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gpt-oss:20b
OLLAMA_TIMEOUT=60.0
AI_ENABLED=true

# Sprint Settings
SPRINT_DURATION_DAYS=14
SPRINT_WORKING_DAYS=10

# Fiscal Year
FY_START_MONTH=1

# Logging
LOG_LEVEL=INFO
"""
