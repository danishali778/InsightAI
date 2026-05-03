from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class QueryRecord(BaseModel):
    """API-facing query-history record payload."""

    id: str
    connection_id: str
    sql: str
    success: bool
    error: Optional[str] = None
    execution_time_ms: Optional[float] = None
    row_count: Optional[int] = None
    owner_id: str
    timestamp: datetime


class QueryStats(BaseModel):
    """Aggregate execution statistics for a connection."""

    total: int = 0
    successful: int = 0
    failed: int = 0
    avg_time_ms: float = 0.0


__all__ = ["QueryRecord", "QueryStats"]
