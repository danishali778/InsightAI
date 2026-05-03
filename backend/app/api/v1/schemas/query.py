from typing import Optional

from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    """Request to execute a SQL query."""

    connection_id: str
    sql: str
    row_limit: Optional[int] = 500


class QueryResult(BaseModel):
    """Result of a SQL query execution."""

    success: bool
    columns: list[str] = Field(default_factory=list)
    rows: list[dict] = Field(default_factory=list)
    row_count: int = 0
    truncated: bool = False
    execution_time_ms: float = 0.0
    error: Optional[str] = None


__all__ = ["QueryRequest", "QueryResult"]
