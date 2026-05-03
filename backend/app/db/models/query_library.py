from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, computed_field


DAY_ABBREV = {
    "monday": "Mon",
    "tuesday": "Tue",
    "wednesday": "Wed",
    "thursday": "Thu",
    "friday": "Fri",
    "saturday": "Sat",
    "sunday": "Sun",
}


class ScheduleConfig(BaseModel):
    """Structured schedule configuration."""

    enabled: bool = True
    frequency: Literal["daily", "weekly", "monthly"]
    day_of_week: Optional[str] = None
    day_of_month: Optional[int] = None
    hour: int = 9
    minute: int = 0
    timezone: str = "UTC"
    next_run_at: Optional[datetime] = None


class SavedQuery(BaseModel):
    """A saved query in the library."""

    id: str
    title: str
    sql: str
    description: str = ""
    folder_name: str = "Uncategorized"
    connection_id: Optional[str] = None
    icon: str = "\U0001f4c4"
    icon_bg: str = "rgba(0,229,255,0.1)"
    tags: list[str] = Field(default_factory=list)
    schedule: Optional[ScheduleConfig] = None
    owner_id: str
    created_at: datetime
    updated_at: datetime
    run_count: int = 0
    last_run_at: Optional[datetime] = None

    @computed_field
    @property
    def schedule_label(self) -> Optional[str]:
        if not self.schedule or not self.schedule.enabled:
            return None
        schedule = self.schedule
        period = f"{schedule.hour % 12 or 12}:{schedule.minute:02d} {'AM' if schedule.hour < 12 else 'PM'}"
        if schedule.frequency == "daily":
            return f"Daily at {period} {schedule.timezone}"
        if schedule.frequency == "weekly" and schedule.day_of_week:
            day = DAY_ABBREV.get(schedule.day_of_week, schedule.day_of_week)
            return f"Weekly, {day} {period} {schedule.timezone}"
        if schedule.frequency == "monthly" and schedule.day_of_month:
            return f"Monthly, day {schedule.day_of_month} {period} {schedule.timezone}"
        return f"{schedule.frequency.title()} {period} {schedule.timezone}"


class QueryRunRecord(BaseModel):
    """A single run-history entry for a saved query."""

    id: str
    sql: str
    connection_id: Optional[str] = None
    query_id: Optional[str] = None
    success: bool
    row_count: int = 0
    execution_time_ms: float = 0.0
    error: Optional[str] = None
    triggered_by: str = "manual"
    owner_id: str
    ran_at: datetime


class SaveQueryInput(BaseModel):
    """Domain input for creating a saved query."""

    title: str
    sql: str
    description: str = ""
    folder_name: str = "Uncategorized"
    connection_id: Optional[str] = None
    icon: str = "\U0001f4c4"
    icon_bg: str = "rgba(0,229,255,0.1)"
    tags: list[str] = Field(default_factory=list)
    schedule: Optional[ScheduleConfig] = None


class UpdateQueryInput(BaseModel):
    """Domain input for updating a saved query."""

    title: Optional[str] = None
    sql: Optional[str] = None
    description: Optional[str] = None
    folder_name: Optional[str] = None
    connection_id: Optional[str] = None
    icon: Optional[str] = None
    icon_bg: Optional[str] = None
    tags: Optional[list[str]] = None
    schedule: Optional[ScheduleConfig] = None
