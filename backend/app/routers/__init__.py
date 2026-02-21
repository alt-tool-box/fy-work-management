"""
API Routers
"""
from app.routers.sprints import router as sprints_router
from app.routers.quarters import router as quarters_router
from app.routers.holidays import router as holidays_router
from app.routers.work_entries import router as work_entries_router
from app.routers.planned_tasks import router as planned_tasks_router
from app.routers.files import router as files_router
from app.routers.config import router as config_router
from app.routers.chat import router as chat_router
from app.routers.dashboard import router as dashboard_router
from app.routers.summary import router as summary_router

__all__ = [
    "sprints_router",
    "quarters_router",
    "holidays_router",
    "work_entries_router",
    "planned_tasks_router",
    "files_router",
    "config_router",
    "chat_router",
    "dashboard_router",
    "summary_router",
]
