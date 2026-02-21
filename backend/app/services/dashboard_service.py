"""
Dashboard Service - Business logic for dashboard statistics and summaries
"""
from datetime import date, datetime, timedelta
from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.work_entry import WorkEntry
from app.models.planned_task import PlannedTask
from app.models.sprint import Sprint
from app.models.holiday import Holiday
from app.schemas.dashboard import (
    DashboardStats, SprintProgress, CategoryBreakdown,
    UpcomingTask, UpcomingHoliday, DashboardSummary
)
from app.services.sprint_service import SprintService
from app.services.work_entry_service import WorkEntryService
from app.services.planned_task_service import PlannedTaskService
from app.services.holiday_service import HolidayService
from app.services.ai_service import AIService


class DashboardService:
    """Service class for dashboard operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.sprint_service = SprintService(db)
        self.work_entry_service = WorkEntryService(db)
        self.planned_task_service = PlannedTaskService(db)
        self.holiday_service = HolidayService(db)
        self.ai_service = AIService(db)
    
    def get_stats(self) -> DashboardStats:
        """Get comprehensive dashboard statistics"""
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        month_start = date(today.year, today.month, 1)
        
        # Work entry counts
        total_entries = self.db.query(func.count(WorkEntry.id)).scalar() or 0
        today_entries = self.db.query(func.count(WorkEntry.id))\
            .filter(WorkEntry.date == today).scalar() or 0
        week_entries = self.db.query(func.count(WorkEntry.id))\
            .filter(WorkEntry.date >= week_start).scalar() or 0
        month_entries = self.db.query(func.count(WorkEntry.id))\
            .filter(WorkEntry.date >= month_start).scalar() or 0
        
        # Planned task counts
        total_planned = self.db.query(func.count(PlannedTask.id)).scalar() or 0
        planned_completed = self.db.query(func.count(PlannedTask.id))\
            .filter(PlannedTask.status == "completed").scalar() or 0
        planned_in_progress = self.db.query(func.count(PlannedTask.id))\
            .filter(PlannedTask.status == "in_progress").scalar() or 0
        planned_pending = self.db.query(func.count(PlannedTask.id))\
            .filter(PlannedTask.status == "planned").scalar() or 0
        
        # Time spent
        time_today = self.work_entry_service.get_total_time_spent(today, today)
        time_week = self.work_entry_service.get_total_time_spent(week_start, today)
        time_month = self.work_entry_service.get_total_time_spent(month_start, today)
        
        # Category breakdown
        category_counts = self.work_entry_service.count_by_category(month_start, today)
        total_categorized = sum(category_counts.values())
        categories = [
            CategoryBreakdown(
                category=cat,
                count=count,
                percentage=round((count / total_categorized * 100) if total_categorized > 0 else 0, 2)
            )
            for cat, count in category_counts.items()
        ]
        
        # Calculate completion rate
        completion_rate = (planned_completed / total_planned * 100) if total_planned > 0 else 0.0
        
        # Average tasks per day (last 30 days)
        thirty_days_ago = today - timedelta(days=30)
        last_30_days_entries = self.db.query(func.count(WorkEntry.id))\
            .filter(WorkEntry.date >= thirty_days_ago).scalar() or 0
        avg_tasks_per_day = round(last_30_days_entries / 30, 2)
        
        return DashboardStats(
            total_work_entries=total_entries,
            work_entries_today=today_entries,
            work_entries_this_week=week_entries,
            work_entries_this_month=month_entries,
            total_planned_tasks=total_planned,
            planned_completed=planned_completed,
            planned_in_progress=planned_in_progress,
            planned_pending=planned_pending,
            total_time_spent_today=time_today,
            total_time_spent_week=time_week,
            total_time_spent_month=time_month,
            categories=categories,
            completion_rate=round(completion_rate, 2),
            avg_tasks_per_day=avg_tasks_per_day
        )
    
    def get_sprint_progress(self, sprint_id: Optional[UUID] = None) -> Optional[SprintProgress]:
        """Get progress for current or specified sprint"""
        # Get sprint
        if sprint_id:
            sprint = self.sprint_service.get_by_id(sprint_id)
        else:
            sprint = self.sprint_service.get_current_or_next_sprint()
        
        if not sprint:
            return None
        
        # Get planned task stats for this sprint
        stats = self.planned_task_service.get_stats(sprint_id=sprint.id)
        
        # Calculate days
        today = date.today()
        days_elapsed = max(0, (today - sprint.start_date).days)
        days_remaining = max(0, (sprint.end_date - today).days)
        
        # Calculate completion percentage
        total = stats.total_planned
        completion_percentage = (stats.completed / total * 100) if total > 0 else 0.0
        
        return SprintProgress(
            sprint_id=sprint.id,
            sprint_name=sprint.name,
            start_date=sprint.start_date,
            end_date=sprint.end_date,
            status=sprint.status,
            goal=sprint.goal,
            total_planned=stats.total_planned,
            completed=stats.completed,
            in_progress=stats.in_progress,
            deferred=stats.deferred,
            cancelled=stats.cancelled,
            completion_percentage=round(completion_percentage, 2),
            days_remaining=days_remaining,
            days_elapsed=days_elapsed,
            total_story_points=stats.total_story_points,
            completed_story_points=stats.completed_story_points
        )
    
    def get_upcoming_tasks(self, limit: int = 5) -> List[UpcomingTask]:
        """Get upcoming planned tasks"""
        pending_tasks = self.planned_task_service.get_pending_tasks()[:limit]
        
        return [
            UpcomingTask(
                id=task.id,
                title=task.title,
                target_date=task.target_date,
                priority=task.priority,
                status=task.status,
                sprint_name=task.sprint.name if task.sprint else None
            )
            for task in pending_tasks
        ]
    
    def get_upcoming_holidays(self, days: int = 30) -> List[UpcomingHoliday]:
        """Get upcoming holidays"""
        holidays = self.holiday_service.get_upcoming(days)
        
        return [
            UpcomingHoliday(
                id=h.id,
                name=h.name,
                date=h.date,
                holiday_type=h.holiday_type
            )
            for h in holidays
        ]
    
    def get_dashboard_summary(self, include_ai: bool = True) -> DashboardSummary:
        """Get complete dashboard summary with optional AI enhancement"""
        stats = self.get_stats()
        sprint_progress = self.get_sprint_progress()
        upcoming_tasks = self.get_upcoming_tasks()
        upcoming_holidays = self.get_upcoming_holidays()
        
        ai_summary = None
        ai_insights = []
        
        if include_ai:
            # Generate AI summary
            try:
                today = date.today()
                week_start = today - timedelta(days=today.weekday())
                recent_entries = self.work_entry_service.get_entries_in_range(week_start, today)
                
                if recent_entries:
                    work_data = [
                        {"title": e.title, "description": e.description}
                        for e in recent_entries
                    ]
                    ai_summary = self.ai_service.generate_summary(work_data, "this week")
                
                # Generate insights
                insight_stats = {
                    "total": stats.total_work_entries,
                    "completed": stats.planned_completed,
                    "completion_rate": stats.completion_rate,
                    "total_time": stats.total_time_spent_week,
                    "top_category": stats.categories[0].category if stats.categories else "N/A"
                }
                ai_insights = self.ai_service.generate_insights(insight_stats)
                
            except Exception as e:
                ai_summary = f"AI summary unavailable: {str(e)}"
                ai_insights = []
        
        return DashboardSummary(
            stats=stats,
            sprint_progress=sprint_progress,
            upcoming_tasks=upcoming_tasks,
            upcoming_holidays=upcoming_holidays,
            ai_summary=ai_summary,
            ai_insights=ai_insights,
            generated_at=datetime.utcnow()
        )
