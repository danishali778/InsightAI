import uuid
from .models import ChatSession, ChatMessage


# In-memory session storage
_sessions: dict[str, ChatSession] = {}


def create_session(connection_id: str | None = None) -> ChatSession:
    """Create a new chat session."""
    session_id = str(uuid.uuid4())[:8]
    session = ChatSession(
        id=session_id,
        connection_ids=[connection_id] if connection_id else [],
        last_connection_id=connection_id,
    )
    _sessions[session_id] = session
    return session


def get_session(session_id: str) -> ChatSession | None:
    """Get a session by ID."""
    return _sessions.get(session_id)


def delete_session(session_id: str) -> bool:
    """Delete a session."""
    if session_id in _sessions:
        del _sessions[session_id]
        return True
    return False


def list_sessions() -> list[dict]:
    """List all sessions."""
    return [
        {
            "id": s.id,
            "connection_ids": s.connection_ids,
            "last_connection_id": s.last_connection_id,
            "title": s.title,
            "message_count": len(s.messages),
            "created_at": s.created_at,
        }
        for s in _sessions.values()
    ]


def track_connection(session_id: str, connection_id: str) -> None:
    """Track a connection used in a session."""
    session = _sessions.get(session_id)
    if session:
        if connection_id not in session.connection_ids:
            session.connection_ids.append(connection_id)
        session.last_connection_id = connection_id


def rename_session(session_id: str, title: str) -> bool:
    """Rename a session. Returns False if session not found."""
    session = _sessions.get(session_id)
    if not session:
        return False
    session.title = title
    return True


def add_message(session_id: str, message: ChatMessage) -> None:
    """Add a message to a session."""
    session = _sessions.get(session_id)
    if session:
        session.messages.append(message)


def get_history_for_llm(session_id: str) -> list[dict]:
    """
    Get conversation history formatted for LLM input.
    Returns list of {"role": ..., "content": ...} dicts.
    """
    session = _sessions.get(session_id)
    if not session:
        return []

    history = []
    for msg in session.messages:
        content = msg.content
        # For assistant messages, include the SQL that was generated
        if msg.role == "assistant" and msg.sql:
            content = f"{msg.content}\n```sql\n{msg.sql}\n```"
        history.append({"role": msg.role, "content": content})

    return history
