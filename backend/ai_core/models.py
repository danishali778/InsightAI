from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ChatMessage(BaseModel):
    """A single message in a chat session."""
    role: str  # "user" or "assistant"
    content: str
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
    connection_id: str
    messages: list[ChatMessage] = []
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
    columns: list[str] = []
    rows: list[dict] = []
    row_count: int = 0
    execution_time_ms: float = 0.0
    chart_recommendation: Optional[dict] = None
    error: Optional[str] = None
