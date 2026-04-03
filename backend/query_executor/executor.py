import time
from typing import Optional
from sqlalchemy import text
from sqlalchemy.engine import Engine

from .models import QueryResult
from .safety import validate_query, sanitize_row_limit


# Query timeout in seconds
QUERY_TIMEOUT = 30


def execute_query(user_id: str, engine: Engine, sql: str, row_limit: int = 500, connection_id: Optional[str] = None, readonly: bool = True) -> QueryResult:
    """
    Execute a SQL query safely against the given database engine.

    Safety checks:
    - Read-only enforcement (when readonly=True, blocks DROP, DELETE, UPDATE, INSERT, etc.)
    - Row limit cap (default 500, auto-appends LIMIT if missing)
    - Timeout protection (30 seconds)
    - Graceful error handling
    """

    # Step 1: Validate query is read-only (only when readonly mode is enabled)
    if readonly:
        is_safe, error_msg = validate_query(sql)
        if not is_safe:
            return QueryResult(
                success=False,
                error=error_msg,
            )

    # Step 2: Apply row limit
    safe_sql = sanitize_row_limit(sql, row_limit)

    # Step 3: Execute with error handling
    start_time = time.time()
    try:
        with engine.connect() as conn:
            # Set statement timeout (PostgreSQL)
            try:
                conn.execute(text(f"SET statement_timeout = '{QUERY_TIMEOUT * 1000}'"))
            except Exception:
                pass  # Not all DBs support this, that's fine

            result = conn.execute(text(safe_sql))
            columns = list(result.keys())
            rows = [dict(row._mapping) for row in result.fetchall()]

            elapsed = (time.time() - start_time) * 1000  # ms

            # Check if we hit the limit
            truncated = len(rows) >= row_limit

            return _log_and_return(QueryResult(
                success=True,
                columns=columns,
                rows=rows,
                row_count=len(rows),
                truncated=truncated,
                execution_time_ms=round(elapsed, 2),
            ), user_id, connection_id, safe_sql)

    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        error_text = str(e)

        # Friendly error messages
        if "does not exist" in error_text or "doesn't exist" in error_text:
            friendly = f"Table or column not found. {error_text.split(chr(10))[0]}"
        elif "syntax error" in error_text.lower():
            friendly = f"SQL syntax error. {error_text.split(chr(10))[0]}"
        elif "timeout" in error_text.lower() or "cancel" in error_text.lower():
            friendly = f"Query timed out after {QUERY_TIMEOUT} seconds. Try a simpler query or add filters."
        elif "permission" in error_text.lower() or "denied" in error_text.lower():
            friendly = "Permission denied. Your database user may not have access to this table."
        else:
            friendly = error_text.split('\n')[0]

        return _log_and_return(QueryResult(
            success=False,
            execution_time_ms=round(elapsed, 2),
            error=friendly,
        ), user_id, connection_id, sql)


def _log_and_return(result: QueryResult, user_id: str, connection_id: Optional[str], sql: str) -> QueryResult:
    """Log the query to history and return the result."""
    if connection_id:
        try:
            from query_history.store import log_query
            log_query(
                user_id=user_id,
                connection_id=connection_id,
                sql=sql,
                success=result.success,
                error=result.error,
                execution_time_ms=result.execution_time_ms,
                row_count=result.row_count,
            )
        except Exception:
            pass  # Don't let logging failures break query execution
    return result
