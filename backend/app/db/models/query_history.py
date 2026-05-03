from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class QueryRecord(BaseModel):
    """A single executed query log entry."""

    id: str
    connection_id: str
    sql: str
    success: bool
    error: Optional[str] = None
    execution_time_ms: Optional[float] = None
    row_count: Optional[int] = None
    owner_id: str
    timestamp: datetime
