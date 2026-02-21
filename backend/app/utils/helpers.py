"""
Helper utility functions
"""
from datetime import date, timedelta
from typing import Tuple


def get_week_dates(year: int, week: int) -> Tuple[date, date]:
    """
    Get start and end dates for a specific ISO week.
    
    Args:
        year: The year
        week: ISO week number (1-53)
    
    Returns:
        Tuple of (start_date, end_date)
    """
    start_date = date.fromisocalendar(year, week, 1)  # Monday
    end_date = start_date + timedelta(days=6)  # Sunday
    return start_date, end_date


def get_month_dates(year: int, month: int) -> Tuple[date, date]:
    """
    Get start and end dates for a specific month.
    
    Args:
        year: The year
        month: Month number (1-12)
    
    Returns:
        Tuple of (start_date, end_date)
    """
    start_date = date(year, month, 1)
    
    # Calculate last day of month
    if month == 12:
        end_date = date(year, 12, 31)
    else:
        end_date = date(year, month + 1, 1) - timedelta(days=1)
    
    return start_date, end_date


def get_quarter_dates(year: int, quarter: int) -> Tuple[date, date]:
    """
    Get start and end dates for a specific quarter.
    
    Args:
        year: The year
        quarter: Quarter number (1-4)
    
    Returns:
        Tuple of (start_date, end_date)
    """
    quarter_start_months = {1: 1, 2: 4, 3: 7, 4: 10}
    start_month = quarter_start_months[quarter]
    
    start_date = date(year, start_month, 1)
    
    # Calculate end date (last day of the quarter)
    end_month = start_month + 2
    if end_month == 12:
        end_date = date(year, 12, 31)
    else:
        end_date = date(year, end_month + 1, 1) - timedelta(days=1)
    
    return start_date, end_date


def calculate_working_days(start_date: date, end_date: date, holidays: list = None) -> int:
    """
    Calculate the number of working days between two dates.
    Excludes weekends (Saturday and Sunday) and optionally holidays.
    
    Args:
        start_date: Start date (inclusive)
        end_date: End date (inclusive)
        holidays: Optional list of holiday dates to exclude
    
    Returns:
        Number of working days
    """
    if holidays is None:
        holidays = []
    
    holiday_set = set(holidays)
    working_days = 0
    current = start_date
    
    while current <= end_date:
        # Monday = 0, Sunday = 6
        if current.weekday() < 5 and current not in holiday_set:
            working_days += 1
        current += timedelta(days=1)
    
    return working_days


def format_duration(minutes: int) -> str:
    """
    Format duration in minutes to human-readable string.
    
    Args:
        minutes: Duration in minutes
    
    Returns:
        Formatted string (e.g., "2h 30m")
    """
    if minutes < 0:
        return "0m"
    
    hours = minutes // 60
    mins = minutes % 60
    
    if hours > 0 and mins > 0:
        return f"{hours}h {mins}m"
    elif hours > 0:
        return f"{hours}h"
    else:
        return f"{mins}m"


def get_iso_week_number(target_date: date) -> Tuple[int, int]:
    """
    Get ISO week number and year for a date.
    
    Args:
        target_date: The date to get week info for
    
    Returns:
        Tuple of (year, week_number)
    """
    iso_calendar = target_date.isocalendar()
    return iso_calendar[0], iso_calendar[1]


def get_fiscal_year(target_date: date, fy_start_month: int = 1) -> int:
    """
    Get the fiscal year for a date based on FY start month.
    
    Args:
        target_date: The date
        fy_start_month: Month when fiscal year starts (1-12)
    
    Returns:
        Fiscal year number
    """
    if fy_start_month == 1:
        return target_date.year
    
    if target_date.month >= fy_start_month:
        return target_date.year
    else:
        return target_date.year - 1


def get_sprint_number(target_date: date, first_sprint_start: date) -> int:
    """
    Calculate which sprint number a date falls into.
    Assumes 2-week sprints.
    
    Args:
        target_date: The date to check
        first_sprint_start: Start date of the first sprint
    
    Returns:
        Sprint number (1-based)
    """
    if target_date < first_sprint_start:
        return 0
    
    days_since_start = (target_date - first_sprint_start).days
    sprint_number = (days_since_start // 14) + 1
    
    return sprint_number
