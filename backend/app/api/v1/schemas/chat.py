from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class ChartRecommendation(BaseModel):
    """Chart recommendation returned for a query result."""

    type: str
    x_column: Optional[str] = None
    y_columns: Optional[list[str]] = Field(default_factory=list)
    color_column: Optional[str] = None
    tooltip_columns: Optional[list[str]] = Field(default_factory=list)
    is_grouped: bool = False
    is_dual_axis: bool = False
    title: str
    x_label: Optional[str] = None
    y_label: Optional[str] = None


class ChatRequest(BaseModel):
    """Request to send a chat message."""

    connection_id: str
    session_id: Optional[str] = None
    message: str


class ChatResponse(BaseModel):
    """Response from the AI chat."""

    session_id: str
    message_id: str
    user_message_id: str
    message: str
    sql: Optional[str] = None
    columns: list[str] = Field(default_factory=list)
    rows: list[dict] = Field(default_factory=list)
    row_count: int = 0
    execution_time_ms: float = 0.0
    chart_recommendation: Optional[ChartRecommendation] = None
    error: Optional[str] = None
    column_metadata: dict = Field(default_factory=dict)
    is_pinned: bool = False
    prev_query_id: Optional[str] = None


class ChatMessage(BaseModel):
    """API-facing chat message payload."""

    id: str
    role: str
    content: str
    connection_id: Optional[str] = None
    sql: Optional[str] = None
    results: Optional[dict] = None
    columns: list[str] = Field(default_factory=list)
    chart_recommendation: Optional[Any] = None
    is_pinned: bool = False
    error: Optional[str] = None
    parent_id: Optional[str] = None
    prev_query_id: Optional[str] = None
    created_at: str


class ChatSession(BaseModel):
    """API-facing chat session payload."""

    id: str
    owner_id: str
    connection_ids: list[str] = Field(default_factory=list)
    last_connection_id: Optional[str] = None
    title: Optional[str] = None
    messages: list[ChatMessage] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class SessionSummary(BaseModel):
    """API-facing session summary payload."""

    id: str
    owner_id: str
    connection_ids: list[str] = Field(default_factory=list)
    last_connection_id: Optional[str] = None
    title: Optional[str] = None
    message_count: int = 0
    created_at: str


class SessionMessagesResponse(BaseModel):
    """Full message history for a session."""

    session_id: str
    owner_id: str
    connection_ids: list[str] = Field(default_factory=list)
    last_connection_id: Optional[str] = None
    messages: list[ChatMessage] = Field(default_factory=list)


class UpdateSessionRequest(BaseModel):
    """Request to update session metadata."""

    title: Optional[str] = None


class EditSqlRequest(BaseModel):
    """Request to edit SQL in a chat message and re-run it."""

    sql: str
    connection_id: str


__all__ = [
    "ChartRecommendation",
    "ChatMessage",
    "ChatSession",
    "ChatRequest",
    "ChatResponse",
    "SessionSummary",
    "SessionMessagesResponse",
    "UpdateSessionRequest",
    "EditSqlRequest",
]
