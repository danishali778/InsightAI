import uuid
from datetime import datetime, timezone
from typing import Optional
from .models import QueryRecord


# In-memory query history store (newest first)
_history: list[QueryRecord] = []

# Maximum records to keep in memory
MAX_HISTORY = 500


def log_query(
    connection_id: str,
    sql: str,
    success: bool,
    error: Optional[str] = None,
    execution_time_ms: Optional[float] = None,
    row_count: Optional[int] = None,
) -> QueryRecord:
    """Log a query execution. Called automatically after every query."""
    record = QueryRecord(
        id=str(uuid.uuid4())[:8],
        connection_id=connection_id,
        sql=sql.strip(),
        success=success,
        error=error,
        execution_time_ms=execution_time_ms,
        row_count=row_count,
        timestamp=datetime.now(timezone.utc),
    )
    _history.insert(0, record)  # newest first

    # Cap the list size
    if len(_history) > MAX_HISTORY:
        _history[:] = _history[:MAX_HISTORY]

    return record


def get_history(
    connection_id: Optional[str] = None,
    limit: int = 20,
) -> list[QueryRecord]:
    """Get recent query history, optionally filtered by connection_id."""
    if connection_id:
        filtered = [r for r in _history if r.connection_id == connection_id]
    else:
        filtered = _history
    return filtered[:limit]


def get_stats(connection_id: str) -> dict:
    """Get quick stats for a connection's query activity."""
    records = [r for r in _history if r.connection_id == connection_id]
    if not records:
        return {"total": 0, "successful": 0, "failed": 0, "avg_time_ms": 0}

    successful = [r for r in records if r.success]
    failed = [r for r in records if not r.success]
    times = [r.execution_time_ms for r in records if r.execution_time_ms is not None]

    return {
        "total": len(records),
        "successful": len(successful),
        "failed": len(failed),
        "avg_time_ms": round(sum(times) / len(times), 2) if times else 0,
    }
