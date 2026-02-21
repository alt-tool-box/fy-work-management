"""
Jira Integration Service - Syncs tasks from Jira to the application
"""
import httpx
from datetime import datetime, date
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session

from app.models.planned_task import PlannedTask
from app.models.sprint import Sprint
from app.config import get_settings

settings = get_settings()


class JiraService:
    """Service for syncing tasks from Jira"""
    
    # Map Jira status IDs to our status values
    STATUS_MAP = {
        "1": "planned",        # Backlog
        "10008": "planned",    # Backlog (alt)
        "3": "in_progress",    # Work In Progress
        "10810": "in_progress", # WIP (alt)
        "10109": "in_progress", # In Progress
        "11810": "deferred",   # Blocked
        "10003": "deferred",   # Need More Info
        "10110": "in_progress", # Peer Review
        "5": "in_progress",    # Ready For Review
        "6": "completed",      # Done
    }
    
    def __init__(self, db: Session):
        self.db = db
    
    async def fetch_jira_data(
        self,
        cookie: str,
        rapid_view_id: int,
        quick_filter_id: int,
        selected_project_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch data from Jira API
        
        Args:
            cookie: Jira authentication cookie
            rapid_view_id: Jira board ID
            quick_filter_id: Jira quick filter ID (usually user's assigned tasks)
            selected_project_key: Jira project key to filter
        
        Returns:
            Dict containing Jira board data
        """
        url = f"https://jira.walmart.com/rest/greenhopper/1.0/xboard/work/allData.json"
        params = {
            "rapidViewId": rapid_view_id,
            "activeQuickFilters": quick_filter_id,
        }
        
        if selected_project_key:
            params["selectedProjectKey"] = selected_project_key
        
        headers = {
            "Cookie": cookie,
            "Accept": "*/*",
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params, headers=headers)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise ValueError("Authentication failed. Please check your Jira cookie.")
            elif e.response.status_code == 403:
                raise ValueError("Access denied. You may not have permission to view this board.")
            else:
                raise ValueError(f"Jira API error: {e.response.status_code}")
        except httpx.TimeoutException:
            raise ValueError("Jira request timed out. Please try again.")
        except Exception as e:
            raise ValueError(f"Failed to fetch Jira data: {str(e)}")
    
    def _map_jira_status(self, jira_status_id: str) -> str:
        """Map Jira status ID to our status"""
        return self.STATUS_MAP.get(jira_status_id, "planned")
    
    def _find_or_create_sprint(
        self,
        jira_sprint_data: Optional[Dict[str, Any]]
    ) -> Optional[Sprint]:
        """
        Find existing sprint or create one based on Jira sprint data
        
        Args:
            jira_sprint_data: Jira sprint information
        
        Returns:
            Sprint object or None
        """
        if not jira_sprint_data:
            return None
        
        sprint_name = jira_sprint_data.get("name", "")
        
        # Try to find existing sprint by name and date range
        # Note: Sprint model doesn't have 'year' field, we filter by dates instead
        existing_sprint = self.db.query(Sprint).filter(
            Sprint.name.ilike(f"%{sprint_name}%")
        ).first()
        
        if existing_sprint:
            return existing_sprint
        
        # Parse sprint dates from Jira
        try:
            start_date_str = jira_sprint_data.get("startDate", "")
            end_date_str = jira_sprint_data.get("endDate", "")
            
            # Jira date format: "18/Jan/26 10:58 PM"
            start_date = datetime.strptime(start_date_str.split()[0], "%d/%b/%y").date()
            end_date = datetime.strptime(end_date_str.split()[0], "%d/%b/%y").date()
            
            # Create new sprint
            sprint_state = jira_sprint_data.get("state", "")
            status = "active" if sprint_state == "ACTIVE" else "completed" if sprint_state == "CLOSED" else "planned"
            
            new_sprint = Sprint(
                name=sprint_name,
                start_date=start_date,
                end_date=end_date,
                goal=jira_sprint_data.get("goal", "Synced from Jira"),
                status=status,
                working_days=10  # Default 2-week sprint
            )
            
            self.db.add(new_sprint)
            self.db.flush()
            return new_sprint
        except Exception as e:
            print(f"Warning: Could not parse sprint dates: {e}")
            return None
    
    def _map_jira_issue_to_task(
        self,
        issue: Dict[str, Any],
        entity_data: Dict[str, Any],
        sprint_data: Optional[Dict[str, Any]],
        year: int
    ) -> Dict[str, Any]:
        """
        Map a Jira issue to our PlannedTask format
        
        Args:
            issue: Jira issue data
            entity_data: Jira entity metadata (types, priorities, etc.)
            sprint_data: Sprint information
            year: Target year
        
        Returns:
            Dict with mapped task data
        """
        # Extract basic info
        external_id = issue.get("key", "")
        title = issue.get("summary", "Untitled Task")
        
        # Get epic name for tags
        epic_id = issue.get("epicId")
        epic_name = None
        if epic_id and "epics" in entity_data:
            epic_data = entity_data["epics"].get(str(epic_id), {})
            epic_field = epic_data.get("epicField", {})
            epic_name = epic_field.get("text")
        
        # Build description with assignee info
        assignee_name = issue.get("assigneeName", "Unassigned")
        description = f"**Assignee:** {assignee_name}\n**Jira Key:** {external_id}"
        if epic_name:
            description += f"\n**Epic:** {epic_name}"
        
        # Get story points
        estimate_stat = issue.get("estimateStatistic", {})
        stat_value = estimate_stat.get("statFieldValue", {})
        story_points = stat_value.get("value") if stat_value else None
        
        # Map status
        status_id = issue.get("statusId", "1")
        status = self._map_jira_status(status_id)
        
        # Get priority (default to medium if not specified)
        priority_id = issue.get("priorityId")
        priority = "medium"  # Default
        
        # Find or create sprint
        sprint = self._find_or_create_sprint(sprint_data)
        
        # Prepare tags
        tags = []
        if epic_name:
            tags.append(epic_name)
        tags.append("jira-synced")
        
        return {
            "external_id": external_id,
            "external_source": "jira",
            "title": title,
            "description": description,
            "story_points": story_points,
            "status": status,
            "priority": priority,
            "tags": tags,
            "sprint_id": sprint.id if sprint else None,
            "year": year,
            "last_synced_at": datetime.utcnow(),
        }
    
    async def sync_tasks(
        self,
        cookie: str,
        rapid_view_id: int = 27928,
        quick_filter_id: int = 399097,
        selected_project_key: Optional[str] = None,
        year: Optional[int] = None,
        quarter_id: Optional[str] = None,
        sprint_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Main sync function - fetches from Jira and syncs to database
        
        Args:
            cookie: Jira authentication cookie
            rapid_view_id: Jira board ID
            quick_filter_id: Jira quick filter ID
            selected_project_key: Jira project key
            year: Target year (defaults to current year)
            quarter_id: Specific quarter to assign tasks to
            sprint_id: Specific sprint to assign tasks to
        
        Returns:
            Dict with sync results
        """
        if year is None:
            year = datetime.now().year
        
        # Fetch data from Jira
        jira_data = await self.fetch_jira_data(
            cookie, 
            rapid_view_id, 
            quick_filter_id,
            selected_project_key
        )
        
        # Extract relevant data
        issues_data = jira_data.get("issuesData", {})
        issues = issues_data.get("issues", [])
        entity_data = jira_data.get("entityData", {})
        sprints_data = jira_data.get("sprintsData", {})
        sprints = sprints_data.get("sprints", [])
        
        # Determine which sprint to use
        target_sprint_data = None
        
        if sprint_id:
            # Use the explicitly provided sprint
            target_sprint = self.db.query(Sprint).filter(Sprint.id == sprint_id).first()
            if not target_sprint:
                raise ValueError(f"Sprint with ID {sprint_id} not found")
            # Create a dict to pass to mapping function
            target_sprint_data = {
                "name": target_sprint.name,
                "startDate": target_sprint.start_date.strftime("%d/%b/%y 12:00 AM"),
                "endDate": target_sprint.end_date.strftime("%d/%b/%y 11:59 PM"),
                "state": "ACTIVE" if target_sprint.status == "active" else "CLOSED"
            }
        else:
            # Fall back to active sprint from Jira (if any)
            for sprint in sprints:
                if sprint.get("state") == "ACTIVE":
                    target_sprint_data = sprint
                    break
        
        # Sync results
        results = {
            "total": len(issues),
            "created": 0,
            "updated": 0,
            "skipped": 0,
            "errors": [],
        }
        
        for issue in issues:
            try:
                external_id = issue.get("key")
                
                if not external_id:
                    results["skipped"] += 1
                    results["errors"].append(f"Issue missing key: {issue.get('summary', 'Unknown')}")
                    continue
                
                # Map Jira issue to our task format
                task_data = self._map_jira_issue_to_task(issue, entity_data, target_sprint_data, year)
                
                # Override sprint_id if explicitly provided
                if sprint_id:
                    task_data["sprint_id"] = sprint_id
                
                # Check if task already exists
                existing_task = self.db.query(PlannedTask).filter(
                    PlannedTask.external_id == external_id
                ).first()
                
                if existing_task:
                    # Update existing task
                    for key, value in task_data.items():
                        if key not in ["external_id", "external_source"]:  # Don't change these
                            setattr(existing_task, key, value)
                    
                    existing_task.updated_at = datetime.utcnow()
                    results["updated"] += 1
                else:
                    # Create new task
                    new_task = PlannedTask(**task_data)
                    self.db.add(new_task)
                    results["created"] += 1
                
            except Exception as e:
                results["errors"].append(f"{external_id}: {str(e)}")
                results["skipped"] += 1
                continue
        
        # Commit all changes
        try:
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise ValueError(f"Failed to save synced tasks: {str(e)}")
        
        return results
    
    def get_sync_history(self, limit: int = 10) -> List[PlannedTask]:
        """Get recently synced tasks from Jira"""
        return self.db.query(PlannedTask)\
            .filter(PlannedTask.external_source == "jira")\
            .order_by(PlannedTask.last_synced_at.desc())\
            .limit(limit)\
            .all()
