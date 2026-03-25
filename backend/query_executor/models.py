from pydantic import BaseModel
from typing import Optional


class QueryRequest(BaseModel):
    """Request to execute a SQL query."""
    connection_id: str
    sql: str
    row_limit: Optional[int] = 500  # Default cap at 500 rows


class QueryResult(BaseModel):
    """Result of a SQL query execution."""
    success: bool
    columns: list[str] = []
    rows: list[dict] = []
    row_count: int = 0
    truncated: bool = False  # True if results were capped
    execution_time_ms: float = 0.0
    error: Optional[str] = None
