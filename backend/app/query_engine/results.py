from typing import Optional

from pydantic import BaseModel, Field


class QueryExecutionResult(BaseModel):
    """Canonical query-engine execution result."""

    success: bool
    columns: list[str] = Field(default_factory=list)
    rows: list[dict] = Field(default_factory=list)
    row_count: int = 0
    truncated: bool = False
    execution_time_ms: float = 0.0
    error: Optional[str] = None


__all__ = ["QueryExecutionResult"]
