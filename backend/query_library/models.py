from pydantic import BaseModel, Field, computed_field
from typing import Optional, Literal
from datetime import datetime


DAY_ABBREV = {
    "monday": "Mon", "tuesday": "Tue", "wednesday": "Wed",
    "thursday": "Thu", "friday": "Fri", "saturday": "Sat", "sunday": "Sun",
}


class ScheduleConfig(BaseModel):
    """Structured schedule configuration."""
    enabled: bool = True
    frequency: Literal["daily", "weekly", "monthly"]
    day_of_week: Optional[str] = None      # "monday"..."sunday" (weekly)
    day_of_month: Optional[int] = None     # 1-28 (monthly)
    hour: int = 9                           # 0-23
    minute: int = 0                         # 0-59
    timezone: str = "UTC"                   # IANA timezone string
    next_run_at: Optional[datetime] = None  # Set by scheduler


class SavedQuery(BaseModel):
    """A saved query in the library."""
    id: str
    title: str
    sql: str
    description: str = ""
    folder_name: str = "Uncategorized"
    connection_id: Optional[str] = None
    icon: str = "📄"
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
        s = self.schedule
        period = f"{s.hour % 12 or 12}:{s.minute:02d} {'AM' if s.hour < 12 else 'PM'}"
        if s.frequency == "daily":
            return f"Daily at {period} {s.timezone}"
        if s.frequency == "weekly" and s.day_of_week:
            return f"Weekly, {DAY_ABBREV.get(s.day_of_week, s.day_of_week)} {period} {s.timezone}"
        if s.frequency == "monthly" and s.day_of_month:
            return f"Monthly, day {s.day_of_month} {period} {s.timezone}"
        return f"{s.frequency.title()} {period} {s.timezone}"


class SaveQueryRequest(BaseModel):
    """Request to save a new query."""
    title: str
    sql: str
    description: str = ""
    folder_name: str = "Uncategorized"
    connection_id: Optional[str] = None
    icon: str = "📄"
    icon_bg: str = "rgba(0,229,255,0.1)"
    tags: list[str] = Field(default_factory=list)
    schedule: Optional[ScheduleConfig] = None


class UpdateQueryRequest(BaseModel):
    """Request to update an existing query."""
    title: Optional[str] = None
    sql: Optional[str] = None
    description: Optional[str] = None
    folder_name: Optional[str] = None
    connection_id: Optional[str] = None
    icon: Optional[str] = None
    icon_bg: Optional[str] = None
    tags: Optional[list[str]] = None
    schedule: Optional[ScheduleConfig] = None


class SaveQueryResponse(SavedQuery):
    """Saved query payload plus duplicate status."""
    created: bool


class FolderSummary(BaseModel):
    """Folder name and query count."""
    name: str
    count: int


class LibraryStats(BaseModel):
    """Aggregate library statistics."""
    total_queries: int = 0
    scheduled: int = 0
    total_runs: int = 0
    recently_run: int = 0
    folders: int = 0


class RunSavedQueryResponse(BaseModel):
    """Execution result when running a saved query."""
    query_id: str
    success: bool
    columns: list[str] = Field(default_factory=list)
    rows: list[dict] = Field(default_factory=list)
    row_count: int = 0
    execution_time_ms: float = 0.0
    error: Optional[str] = None


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
    triggered_by: str = "manual"  # "manual" or "schedule"
    owner_id: str
    ran_at: datetime


class ScheduleStatusResponse(BaseModel):
    """Response for schedule-specific operations."""
    query_id: str
    schedule: Optional[ScheduleConfig] = None
    schedule_label: Optional[str] = None
    message: str
