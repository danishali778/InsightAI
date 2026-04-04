import uuid
from datetime import datetime, timezone
from typing import Optional
from .models import QueryRecord
from database.supabase_client import supabase
from database.retry import supabase_retry


@supabase_retry
def log_query(
    user_id: str,
    connection_id: str,
    sql: str,
    success: bool,
    error: Optional[str] = None,
    execution_time_ms: Optional[float] = None,
    row_count: Optional[int] = None,
) -> QueryRecord:
    """Log a query execution to Supabase. Called automatically after every query."""
    row = {
        "owner_id": user_id,
        "connection_id": connection_id,
        "sql": sql.strip(),
        "success": success,
        "error": error,
        "execution_time_ms": execution_time_ms,
        "row_count": row_count,
        "triggered_by": "manual", # Default for ad-hoc
    }
    
    response = supabase.table("query_executions").insert(row).execute()
    if not response.data:
        raise Exception("Failed to log query execution")
        
    row = response.data[0]
    return QueryRecord(
        id=str(row["id"]),
        connection_id=str(row["connection_id"]),
        sql=row["sql"],
        success=row["success"],
        error=row.get("error"),
        execution_time_ms=row["execution_time_ms"],
        row_count=row["row_count"],
        owner_id=str(row["owner_id"]),
        timestamp=datetime.fromisoformat(row["ran_at"]),
    )


@supabase_retry
def get_history(
    user_id: str,
    connection_id: Optional[str] = None,
    limit: int = 20,
) -> list[QueryRecord]:
    """Get recent query history for a user, optionally filtered by connection."""
    query = supabase.table("query_executions") \
        .select("*") \
        .eq("owner_id", user_id) \
        .is_("query_id", "null") # Only ad-hoc queries for this general history
        
    if connection_id:
        query = query.eq("connection_id", connection_id)
        
    response = query.order("ran_at", desc=True).limit(limit).execute()
    
    return [
        QueryRecord(
            id=str(row["id"]),
            connection_id=str(row["connection_id"]),
            sql=row["sql"],
            success=row["success"],
            error=row.get("error"),
            execution_time_ms=row["execution_time_ms"],
            row_count=row["row_count"],
            owner_id=str(row["owner_id"]),
            timestamp=datetime.fromisoformat(row["ran_at"]),
        )
        for row in response.data
    ]


@supabase_retry
def get_stats(user_id: str, connection_id: str) -> dict:
    """Get quick stats for a connection's query activity."""
    # We'll fetch the last 100 executions for this user/connection to calculate stats
    response = supabase.table("query_executions") \
        .select("success, execution_time_ms") \
        .eq("owner_id", user_id) \
        .eq("connection_id", connection_id) \
        .limit(100) \
        .execute()
        
    records = response.data
    if not records:
        return {"total": 0, "successful": 0, "failed": 0, "avg_time_ms": 0}

    successful = [r for r in records if r["success"]]
    failed = [r for r in records if not r["success"]]
    times = [r["execution_time_ms"] for r in records if r["execution_time_ms"] is not None]

    return {
        "total": len(records),
        "successful": len(successful),
        "failed": len(failed),
        "avg_time_ms": round(sum(times) / len(times), 2) if times else 0,
    }
