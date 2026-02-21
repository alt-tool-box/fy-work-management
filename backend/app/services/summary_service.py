"""
Summary Service - Business logic for generating work summaries
"""
from datetime import date, datetime, timedelta
from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.models.work_entry import WorkEntry
from app.models.planned_task import PlannedTask
from app.models.sprint import Sprint
from app.schemas.summary import (
    SummaryResponse, TaskSummary, PlannedVsActual, DeferredTask
)
from app.services.work_entry_service import WorkEntryService
from app.services.planned_task_service import PlannedTaskService
from app.services.sprint_service import SprintService
from app.services.ai_service import AIService


class SummaryService:
    """Service class for summary generation"""
    
    def __init__(self, db: Session):
        self.db = db
        self.work_entry_service = WorkEntryService(db)
        self.planned_task_service = PlannedTaskService(db)
        self.sprint_service = SprintService(db)
        self.ai_service = AIService(db)
    
    def _get_task_summary(self, start_date: date, end_date: date) -> TaskSummary:
        """Get task summary statistics for a date range"""
        entries = self.work_entry_service.get_entries_in_range(start_date, end_date)
        
        total = len(entries)
        completed = sum(1 for e in entries if e.status == "completed")
        in_progress = sum(1 for e in entries if e.status == "in_progress")
        on_hold = sum(1 for e in entries if e.status == "on_hold")
        total_time = sum(e.time_spent or 0 for e in entries)
        avg_time = total_time / total if total > 0 else 0.0
        
        # By category
        by_category = {}
        for entry in entries:
            cat = entry.category or "Uncategorized"
            by_category[cat] = by_category.get(cat, 0) + 1
        
        # By priority
        by_priority = {}
        for entry in entries:
            by_priority[entry.priority] = by_priority.get(entry.priority, 0) + 1
        
        return TaskSummary(
            total_entries=total,
            completed=completed,
            in_progress=in_progress,
            on_hold=on_hold,
            total_time_spent=total_time,
            avg_time_per_task=round(avg_time, 2),
            by_category=by_category,
            by_priority=by_priority
        )
    
    def _get_planned_vs_actual(
        self, 
        start_date: date, 
        end_date: date,
        sprint_id: Optional[UUID] = None
    ) -> PlannedVsActual:
        """Get planned vs actual comparison"""
        # Get planned tasks
        if sprint_id:
            planned_tasks = self.planned_task_service.get_by_sprint(sprint_id)
        else:
            # Get tasks for the date range based on year/week
            query = self.db.query(PlannedTask)
            # This is a simplified query - in reality would need more complex logic
            planned_tasks = query.all()
        
        total_planned = len(planned_tasks)
        completed_on_time = sum(1 for t in planned_tasks if t.status == "completed")
        deferred = sum(1 for t in planned_tasks if t.status == "deferred")
        cancelled = sum(1 for t in planned_tasks if t.status == "cancelled")
        
        # Count unplanned work (work entries not linked to any planned task)
        entries = self.work_entry_service.get_entries_in_range(start_date, end_date)
        # Get work_entry_ids that are linked to planned tasks
        linked_entry_ids = {t.work_entry_id for t in planned_tasks if t.work_entry_id is not None}
        unplanned = sum(1 for e in entries if e.id not in linked_entry_ids)
        
        completion_rate = (completed_on_time / total_planned * 100) if total_planned > 0 else 0.0
        
        # Story points
        planned_sp = sum(t.story_points or 0 for t in planned_tasks)
        completed_sp = sum(t.story_points or 0 for t in planned_tasks if t.status == "completed")
        
        return PlannedVsActual(
            total_planned=total_planned,
            completed_on_time=completed_on_time,
            completed_late=0,  # Would need more complex tracking
            deferred=deferred,
            cancelled=cancelled,
            unplanned_work=unplanned,
            completion_rate=round(completion_rate, 2),
            planned_story_points=planned_sp,
            completed_story_points=completed_sp
        )
    
    def _get_deferred_tasks(self, sprint_id: Optional[UUID] = None) -> List[DeferredTask]:
        """Get list of deferred tasks"""
        deferred = self.planned_task_service.get_deferred_tasks(sprint_id)
        
        return [
            DeferredTask(
                id=t.id,
                title=t.title,
                original_sprint=t.sprint.name if t.sprint else None,
                original_week=t.week_number,
                deferred_to_sprint=t.deferred_to_sprint.name if t.deferred_to_sprint else None,
                deferred_to_week=t.deferred_to_week
            )
            for t in deferred
        ]
    
    def _generate_ai_content(
        self, 
        entries: List[WorkEntry], 
        period: str,
        stats: Dict[str, Any]
    ) -> tuple:
        """Generate AI content for summary"""
        highlights = []
        patterns = []
        recommendations = []
        summary = None
        
        try:
            # Generate summary
            if entries:
                work_data = [
                    {"title": e.title, "description": e.description}
                    for e in entries
                ]
                summary = self.ai_service.generate_summary(work_data, period)
            
            # Generate insights (used as highlights)
            highlights = self.ai_service.generate_insights(stats)
            
            # Generate recommendations
            context = {
                "avg_tasks": stats.get("avg_tasks", 0),
                "deferred": stats.get("deferred", 0),
                "completion_rate": stats.get("completion_rate", 0),
                "pattern": "regular" if stats.get("total", 0) > 0 else "low activity"
            }
            recommendations = self.ai_service.generate_recommendations(context)
            
        except Exception as e:
            summary = f"AI content unavailable: {str(e)}"
        
        return highlights, patterns, recommendations, summary
    
    def get_daily_summary(self, target_date: Optional[date] = None, include_ai: bool = True) -> SummaryResponse:
        """Get daily summary"""
        if not target_date:
            target_date = date.today()
        
        task_summary = self._get_task_summary(target_date, target_date)
        planned_vs_actual = self._get_planned_vs_actual(target_date, target_date)
        
        # AI content
        highlights, patterns, recommendations, ai_summary = [], [], [], None
        if include_ai:
            entries = self.work_entry_service.get_by_date(target_date)
            stats = {
                "total": task_summary.total_entries,
                "completed": task_summary.completed,
                "completion_rate": planned_vs_actual.completion_rate,
                "total_time": task_summary.total_time_spent,
                "top_category": max(task_summary.by_category, key=task_summary.by_category.get) if task_summary.by_category else "N/A"
            }
            highlights, patterns, recommendations, ai_summary = self._generate_ai_content(
                entries, f"date {target_date}", stats
            )
        
        return SummaryResponse(
            summary_type="daily",
            start_date=target_date,
            end_date=target_date,
            period_label=target_date.strftime("%A, %B %d, %Y"),
            task_summary=task_summary,
            planned_vs_actual=planned_vs_actual,
            deferred_tasks=[],
            ai_highlights=highlights,
            ai_patterns=patterns,
            ai_recommendations=recommendations,
            ai_summary=ai_summary,
            generated_at=datetime.utcnow()
        )
    
    def get_weekly_summary(
        self, 
        year: Optional[int] = None, 
        week: Optional[int] = None,
        include_ai: bool = True
    ) -> SummaryResponse:
        """Get weekly summary"""
        today = date.today()
        
        if year and week:
            # Calculate start date from year and week
            start_date = date.fromisocalendar(year, week, 1)
        else:
            # Current week
            start_date = today - timedelta(days=today.weekday())
            year = start_date.year
            week = start_date.isocalendar()[1]
        
        end_date = start_date + timedelta(days=6)
        
        task_summary = self._get_task_summary(start_date, end_date)
        planned_vs_actual = self._get_planned_vs_actual(start_date, end_date)
        deferred_tasks = self._get_deferred_tasks()
        
        # AI content
        highlights, patterns, recommendations, ai_summary = [], [], [], None
        if include_ai:
            entries = self.work_entry_service.get_entries_in_range(start_date, end_date)
            stats = {
                "total": task_summary.total_entries,
                "completed": task_summary.completed,
                "completion_rate": planned_vs_actual.completion_rate,
                "total_time": task_summary.total_time_spent,
                "top_category": max(task_summary.by_category, key=task_summary.by_category.get) if task_summary.by_category else "N/A",
                "avg_tasks": task_summary.total_entries / 7,
                "deferred": len(deferred_tasks)
            }
            highlights, patterns, recommendations, ai_summary = self._generate_ai_content(
                entries, f"Week {week}, {year}", stats
            )
        
        return SummaryResponse(
            summary_type="weekly",
            start_date=start_date,
            end_date=end_date,
            period_label=f"Week {week}, {year}",
            task_summary=task_summary,
            planned_vs_actual=planned_vs_actual,
            deferred_tasks=deferred_tasks,
            ai_highlights=highlights,
            ai_patterns=patterns,
            ai_recommendations=recommendations,
            ai_summary=ai_summary,
            generated_at=datetime.utcnow()
        )
    
    def get_monthly_summary(
        self, 
        year: Optional[int] = None, 
        month: Optional[int] = None,
        include_ai: bool = True
    ) -> SummaryResponse:
        """Get monthly summary"""
        today = date.today()
        
        if not year:
            year = today.year
        if not month:
            month = today.month
        
        start_date = date(year, month, 1)
        
        # Calculate end of month
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        
        task_summary = self._get_task_summary(start_date, end_date)
        planned_vs_actual = self._get_planned_vs_actual(start_date, end_date)
        deferred_tasks = self._get_deferred_tasks()
        
        month_name = start_date.strftime("%B %Y")
        
        # AI content
        highlights, patterns, recommendations, ai_summary = [], [], [], None
        if include_ai:
            entries = self.work_entry_service.get_entries_in_range(start_date, end_date)
            stats = {
                "total": task_summary.total_entries,
                "completed": task_summary.completed,
                "completion_rate": planned_vs_actual.completion_rate,
                "total_time": task_summary.total_time_spent,
                "top_category": max(task_summary.by_category, key=task_summary.by_category.get) if task_summary.by_category else "N/A",
                "avg_tasks": task_summary.total_entries / 30,
                "deferred": len(deferred_tasks)
            }
            highlights, patterns, recommendations, ai_summary = self._generate_ai_content(
                entries, month_name, stats
            )
        
        return SummaryResponse(
            summary_type="monthly",
            start_date=start_date,
            end_date=end_date,
            period_label=month_name,
            task_summary=task_summary,
            planned_vs_actual=planned_vs_actual,
            deferred_tasks=deferred_tasks,
            ai_highlights=highlights,
            ai_patterns=patterns,
            ai_recommendations=recommendations,
            ai_summary=ai_summary,
            generated_at=datetime.utcnow()
        )
    
    def get_quarterly_summary(
        self, 
        year: Optional[int] = None, 
        quarter: Optional[int] = None,
        include_ai: bool = True
    ) -> SummaryResponse:
        """Get quarterly summary"""
        today = date.today()
        
        if not year:
            year = today.year
        if not quarter:
            quarter = (today.month - 1) // 3 + 1
        
        # Calculate quarter dates
        quarter_starts = {1: 1, 2: 4, 3: 7, 4: 10}
        start_month = quarter_starts[quarter]
        start_date = date(year, start_month, 1)
        
        end_month = start_month + 2
        if end_month == 12:
            end_date = date(year, 12, 31)
        else:
            end_date = date(year, end_month + 1, 1) - timedelta(days=1)
        
        task_summary = self._get_task_summary(start_date, end_date)
        planned_vs_actual = self._get_planned_vs_actual(start_date, end_date)
        deferred_tasks = self._get_deferred_tasks()
        
        period_label = f"Q{quarter} {year}"
        
        # AI content
        highlights, patterns, recommendations, ai_summary = [], [], [], None
        if include_ai:
            entries = self.work_entry_service.get_entries_in_range(start_date, end_date)
            stats = {
                "total": task_summary.total_entries,
                "completed": task_summary.completed,
                "completion_rate": planned_vs_actual.completion_rate,
                "total_time": task_summary.total_time_spent,
                "top_category": max(task_summary.by_category, key=task_summary.by_category.get) if task_summary.by_category else "N/A",
                "avg_tasks": task_summary.total_entries / 90,
                "deferred": len(deferred_tasks)
            }
            highlights, patterns, recommendations, ai_summary = self._generate_ai_content(
                entries, period_label, stats
            )
        
        return SummaryResponse(
            summary_type="quarterly",
            start_date=start_date,
            end_date=end_date,
            period_label=period_label,
            task_summary=task_summary,
            planned_vs_actual=planned_vs_actual,
            deferred_tasks=deferred_tasks,
            ai_highlights=highlights,
            ai_patterns=patterns,
            ai_recommendations=recommendations,
            ai_summary=ai_summary,
            generated_at=datetime.utcnow()
        )
    
    def get_quarter_summary_by_id(
        self, 
        quarter_id: UUID,
        include_ai: bool = True
    ) -> Optional[SummaryResponse]:
        """Get quarterly summary by quarter ID (for custom quarters)"""
        from app.models.quarter import Quarter
        
        # Fetch the quarter
        quarter = self.db.query(Quarter).filter(Quarter.id == quarter_id).first()
        if not quarter:
            return None
        
        start_date = quarter.start_date
        end_date = quarter.end_date
        
        task_summary = self._get_task_summary(start_date, end_date)
        planned_vs_actual = self._get_planned_vs_actual(start_date, end_date)
        deferred_tasks = self._get_deferred_tasks()
        
        period_label = f"{quarter.name} {quarter.year}"
        
        # AI content
        highlights, patterns, recommendations, ai_summary = [], [], [], None
        if include_ai:
            entries = self.work_entry_service.get_entries_in_range(start_date, end_date)
            # Calculate days in quarter
            days_in_quarter = (end_date - start_date).days + 1
            stats = {
                "total": task_summary.total_entries,
                "completed": task_summary.completed,
                "completion_rate": planned_vs_actual.completion_rate,
                "total_time": task_summary.total_time_spent,
                "top_category": max(task_summary.by_category, key=task_summary.by_category.get) if task_summary.by_category else "N/A",
                "avg_tasks": task_summary.total_entries / days_in_quarter if days_in_quarter > 0 else 0,
                "deferred": len(deferred_tasks)
            }
            highlights, patterns, recommendations, ai_summary = self._generate_ai_content(
                entries, period_label, stats
            )
        
        return SummaryResponse(
            summary_type="quarterly",
            start_date=start_date,
            end_date=end_date,
            period_label=period_label,
            task_summary=task_summary,
            planned_vs_actual=planned_vs_actual,
            deferred_tasks=deferred_tasks,
            ai_highlights=highlights,
            ai_patterns=patterns,
            ai_recommendations=recommendations,
            ai_summary=ai_summary,
            generated_at=datetime.utcnow()
        )
    
    def get_sprint_summary(self, sprint_id: UUID, include_ai: bool = True) -> Optional[SummaryResponse]:
        """Get sprint summary"""
        sprint = self.sprint_service.get_by_id(sprint_id)
        if not sprint:
            return None
        
        task_summary = self._get_task_summary(sprint.start_date, sprint.end_date)
        planned_vs_actual = self._get_planned_vs_actual(sprint.start_date, sprint.end_date, sprint_id)
        deferred_tasks = self._get_deferred_tasks(sprint_id)
        
        # AI content
        highlights, patterns, recommendations, ai_summary = [], [], [], None
        if include_ai:
            entries = self.work_entry_service.get_entries_in_range(sprint.start_date, sprint.end_date)
            stats = {
                "total": task_summary.total_entries,
                "completed": task_summary.completed,
                "completion_rate": planned_vs_actual.completion_rate,
                "total_time": task_summary.total_time_spent,
                "top_category": max(task_summary.by_category, key=task_summary.by_category.get) if task_summary.by_category else "N/A",
                "avg_tasks": task_summary.total_entries / 14,
                "deferred": len(deferred_tasks)
            }
            highlights, patterns, recommendations, ai_summary = self._generate_ai_content(
                entries, sprint.name, stats
            )
        
        return SummaryResponse(
            summary_type="sprint",
            start_date=sprint.start_date,
            end_date=sprint.end_date,
            period_label=sprint.name,
            task_summary=task_summary,
            planned_vs_actual=planned_vs_actual,
            deferred_tasks=deferred_tasks,
            ai_highlights=highlights,
            ai_patterns=patterns,
            ai_recommendations=recommendations,
            ai_summary=ai_summary,
            generated_at=datetime.utcnow()
        )
    
    def get_yearly_summary(self, year: Optional[int] = None, include_ai: bool = True) -> SummaryResponse:
        """Get yearly summary"""
        if not year:
            year = date.today().year
        
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)
        
        task_summary = self._get_task_summary(start_date, end_date)
        planned_vs_actual = self._get_planned_vs_actual(start_date, end_date)
        deferred_tasks = self._get_deferred_tasks()
        
        # AI content
        highlights, patterns, recommendations, ai_summary = [], [], [], None
        if include_ai:
            # For yearly, we sample entries to avoid too much data
            entries = self.work_entry_service.get_entries_in_range(start_date, end_date)[:100]
            stats = {
                "total": task_summary.total_entries,
                "completed": task_summary.completed,
                "completion_rate": planned_vs_actual.completion_rate,
                "total_time": task_summary.total_time_spent,
                "top_category": max(task_summary.by_category, key=task_summary.by_category.get) if task_summary.by_category else "N/A",
                "avg_tasks": task_summary.total_entries / 365,
                "deferred": len(deferred_tasks)
            }
            highlights, patterns, recommendations, ai_summary = self._generate_ai_content(
                entries, f"Year {year}", stats
            )
        
        return SummaryResponse(
            summary_type="yearly",
            start_date=start_date,
            end_date=end_date,
            period_label=str(year),
            task_summary=task_summary,
            planned_vs_actual=planned_vs_actual,
            deferred_tasks=deferred_tasks,
            ai_highlights=highlights,
            ai_patterns=patterns,
            ai_recommendations=recommendations,
            ai_summary=ai_summary,
            generated_at=datetime.utcnow()
        )
