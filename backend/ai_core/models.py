import uuid
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime


class ChartRecommendation(BaseModel):
    """Chart recommendation returned for a query result."""
    type: str
    x_column: Optional[str] = None
    y_columns: list[str] = Field(default_factory=list)
    color_column: Optional[str] = None
    tooltip_columns: list[str] = Field(default_factory=list)
    is_grouped: bool = False
    is_dual_axis: bool = False
    title: str
    x_label: Optional[str] = None
    y_label: Optional[str] = None


class ChatMessage(BaseModel):
    """A single message in a chat session."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str  # "user" or "assistant"
    content: str
    connection_id: Optional[str] = None
    sql: Optional[str] = None
    results: Optional[Dict] = None
    columns: List[str] = Field(default_factory=list)
    chart_recommendation: Optional[Any] = None  # Using Any for persistence flexibility
    is_pinned: bool = False
    error: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())

    def __init__(self, **data):
        if not data.get("id"):
            import uuid
            data["id"] = str(uuid.uuid4())
        if not data.get("created_at"):
            data["created_at"] = datetime.now().isoformat()
        super().__init__(**data)


class ChatSession(BaseModel):
    """A chat session with conversation history."""
    id: str
    owner_id: str
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
    message_id: str  # The ID of the assistant response message
    user_message_id: str  # The ID of the user's input message
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


class SessionSummary(BaseModel):
    """Minimal chat session data used for sidebars and lists."""
    id: str
    owner_id: str
    connection_ids: list[str] = Field(default_factory=list)
    last_connection_id: Optional[str] = None
    title: Optional[str] = None
    message_count: int
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
