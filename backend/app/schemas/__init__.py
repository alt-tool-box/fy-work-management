"""
Pydantic Schemas for API request/response validation
"""
from app.schemas.sprint import (
    SprintCreate, SprintUpdate, SprintResponse, SprintGenerateRequest
)
from app.schemas.quarter import (
    QuarterCreate, QuarterUpdate, QuarterResponse
)
from app.schemas.holiday import (
    HolidayCreate, HolidayUpdate, HolidayResponse
)
from app.schemas.work_entry import (
    WorkEntryCreate, WorkEntryUpdate, WorkEntryResponse
)
from app.schemas.planned_task import (
    PlannedTaskCreate, PlannedTaskUpdate, PlannedTaskResponse,
    PlannedTaskComplete, PlannedTaskDefer
)
from app.schemas.attachment import (
    AttachmentCreate, AttachmentResponse
)
from app.schemas.configuration import (
    ConfigurationUpdate, ConfigurationResponse
)
from app.schemas.chat import (
    ChatMessage, ChatResponse, ChatHistoryResponse
)
from app.schemas.dashboard import (
    DashboardStats, SprintProgress
)
from app.schemas.summary import (
    SummaryRequest, SummaryResponse
)

__all__ = [
    # Sprint
    "SprintCreate", "SprintUpdate", "SprintResponse", "SprintGenerateRequest",
    # Quarter
    "QuarterCreate", "QuarterUpdate", "QuarterResponse",
    # Holiday
    "HolidayCreate", "HolidayUpdate", "HolidayResponse",
    # Work Entry
    "WorkEntryCreate", "WorkEntryUpdate", "WorkEntryResponse",
    # Planned Task
    "PlannedTaskCreate", "PlannedTaskUpdate", "PlannedTaskResponse",
    "PlannedTaskComplete", "PlannedTaskDefer",
    # Attachment
    "AttachmentCreate", "AttachmentResponse",
    # Configuration
    "ConfigurationUpdate", "ConfigurationResponse",
    # Chat
    "ChatMessage", "ChatResponse", "ChatHistoryResponse",
    # Dashboard
    "DashboardStats", "SprintProgress",
    # Summary
    "SummaryRequest", "SummaryResponse",
]
