from pydantic import BaseModel
from typing import Optional
from datetime import datetime


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
    tags: list[str] = []
    schedule: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    run_count: int = 0
    last_run_at: Optional[datetime] = None


class SaveQueryRequest(BaseModel):
    """Request to save a new query."""
    title: str
    sql: str
    description: str = ""
    folder_name: str = "Uncategorized"
    connection_id: Optional[str] = None
    icon: str = "📄"
    icon_bg: str = "rgba(0,229,255,0.1)"
    tags: list[str] = []
    schedule: Optional[str] = None


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
    schedule: Optional[str] = None
