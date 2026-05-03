"""Query-history workflows."""

from typing import Optional

from app.db.repositories import query_history_repository


def record_query(
    user_id: str,
    connection_id: str,
    sql: str,
    success: bool,
    error: Optional[str] = None,
    execution_time_ms: Optional[float] = None,
    row_count: Optional[int] = None,
):
    return query_history_repository.log_query(
        user_id=user_id,
        connection_id=connection_id,
        sql=sql,
        success=success,
        error=error,
        execution_time_ms=execution_time_ms,
        row_count=row_count,
    )


def list_history(
    user_id: str,
    connection_id: Optional[str] = None,
    limit: int = 20,
):
    return query_history_repository.get_history(
        user_id=user_id,
        connection_id=connection_id,
        limit=limit,
    )


def get_connection_stats(user_id: str, connection_id: str):
    return query_history_repository.get_stats(user_id=user_id, connection_id=connection_id)


def log_query(
    user_id: str,
    connection_id: str,
    sql: str,
    success: bool,
    error: Optional[str] = None,
    execution_time_ms: Optional[float] = None,
    row_count: Optional[int] = None,
):
    return record_query(
        user_id=user_id,
        connection_id=connection_id,
        sql=sql,
        success=success,
        error=error,
        execution_time_ms=execution_time_ms,
        row_count=row_count,
    )


def get_history(
    user_id: str,
    connection_id: Optional[str] = None,
    limit: int = 20,
):
    return list_history(user_id=user_id, connection_id=connection_id, limit=limit)


def get_stats(user_id: str, connection_id: str):
    return get_connection_stats(user_id=user_id, connection_id=connection_id)


__all__ = [
    "record_query",
    "list_history",
    "get_connection_stats",
    "log_query",
    "get_history",
    "get_stats",
]
