from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ChartRecommendation(BaseModel):
    """Chart recommendation returned for a query result."""
    type: str
    x_column: str
    y_columns: list[str] = Field(default_factory=list)
    title: str
    x_label: str
    y_label: str


class ChatMessage(BaseModel):
    """A single message in a chat session."""
    role: str  # "user" or "assistant"
    content: str
    connection_id: Optional[str] = None
    sql: Optional[str] = None
    results: Optional[dict] = None
    error: Optional[str] = None
    timestamp: str = ""

    def __init__(self, **data):
        if not data.get("timestamp"):
            data["timestamp"] = datetime.now().isoformat()
        super().__init__(**data)


class ChatSession(BaseModel):
    """A chat session with conversation history."""
    id: str
    connection_ids: list[str] = Field(default_factory=list)
    last_connection_id: Optional[str] = None
    title: Optional[str] = None
    messages: list[ChatMessage] = Field(default_factory=list)
    created_at: str = ""

    def __init__(self, **data):
        if not data.get("created_at"):
            data["created_at"] = datetime.now().isoformat()
        super().__init__(**data)


class ChatRequest(BaseModel):
    """Request to send a chat message."""
    connection_id: str
    session_id: Optional[str] = None  # None = create new session
    message: str


class ChatResponse(BaseModel):
    """Response from the AI chat."""
    session_id: str
    message: str
    sql: Optional[str] = None
    columns: list[str] = Field(default_factory=list)
    rows: list[dict] = Field(default_factory=list)
    row_count: int = 0
    execution_time_ms: float = 0.0
    chart_recommendation: Optional[ChartRecommendation] = None
    error: Optional[str] = None


class SessionSummary(BaseModel):
    """Minimal chat session data used for sidebars and lists."""
    id: str
    connection_ids: list[str] = Field(default_factory=list)
    last_connection_id: Optional[str] = None
    title: Optional[str] = None
    message_count: int
    created_at: str


class SessionMessagesResponse(BaseModel):
    """Full message history for a session."""
    session_id: str
    connection_ids: list[str] = Field(default_factory=list)
    last_connection_id: Optional[str] = None
    messages: list[ChatMessage] = Field(default_factory=list)


class UpdateSessionRequest(BaseModel):
    """Request to update session metadata."""
    title: Optional[str] = None
