from fastapi import APIRouter, HTTPException

from common.models import MessageResponse
from database import connection_manager
from ai_core.models import ChatRequest, ChatResponse, ChatMessage, SessionMessagesResponse, SessionSummary, UpdateSessionRequest
from ai_core.graph import run_chat
from ai_core import session_manager


router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
def send_chat_message(request: ChatRequest):
    """Send a message and get AI-generated SQL + results."""
    # Verify database connection exists
    engine = connection_manager.get_engine(request.connection_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Database connection not found. Connect first.")

    # Get or create session
    session_id = request.session_id
    is_new_session = False
    if not session_id:
        session = session_manager.create_session(request.connection_id)
        session_id = session.id
        is_new_session = True
    else:
        session = session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found.")

    # Track the connection used in this message
    session_manager.track_connection(session_id, request.connection_id)

    # Auto-title on first message of a new session
    if is_new_session:
        title = request.message[:50].strip()
        if len(request.message) > 50:
            title += "..."
        session_manager.rename_session(session_id, title)

    # Save user message to session
    session_manager.add_message(session_id, ChatMessage(
        role="user",
        content=request.message,
        connection_id=request.connection_id,
    ))

    # Run the LangGraph pipeline
    try:
        result = run_chat(
            connection_id=request.connection_id,
            session_id=session_id,
            user_message=request.message,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")

    # Save assistant response to session
    session_manager.add_message(session_id, ChatMessage(
        role="assistant",
        content=result.get("explanation", ""),
        connection_id=request.connection_id,
        sql=result.get("sql", ""),
        results={"row_count": result.get("row_count", 0)} if result.get("rows") else None,
        error=result.get("error", "") or None,
    ))

    # Build response
    error = result.get("error", "")
    return ChatResponse(
        session_id=session_id,
        message=result.get("explanation", ""),
        sql=result.get("sql"),
        columns=result.get("columns", []),
        rows=result.get("rows", []),
        row_count=result.get("row_count", 0),
        execution_time_ms=result.get("execution_time_ms", 0.0),
        chart_recommendation=result.get("chart_recommendation"),
        error=error if error else None,
    )


@router.get("/sessions", response_model=list[SessionSummary])
def list_sessions():
    """List all chat sessions."""
    return session_manager.list_sessions()


@router.post("/sessions", response_model=SessionSummary)
def create_session(connection_id: str | None = None):
    """Create a new chat session."""
    if connection_id:
        engine = connection_manager.get_engine(connection_id)
        if not engine:
            raise HTTPException(status_code=404, detail="Database connection not found.")

    session = session_manager.create_session(connection_id)
    return {
        "id": session.id,
        "connection_ids": session.connection_ids,
        "last_connection_id": session.last_connection_id,
        "title": session.title,
        "message_count": len(session.messages),
        "created_at": session.created_at,
    }


@router.patch("/sessions/{session_id}", response_model=SessionSummary)
def update_session(session_id: str, request: UpdateSessionRequest):
    """Update session metadata (e.g. rename)."""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if request.title is not None:
        session_manager.rename_session(session_id, request.title)
    session = session_manager.get_session(session_id)
    return {
        "id": session.id,
        "connection_ids": session.connection_ids,
        "last_connection_id": session.last_connection_id,
        "title": session.title,
        "message_count": len(session.messages),
        "created_at": session.created_at,
    }


@router.delete("/sessions/{session_id}", response_model=MessageResponse)
def delete_session(session_id: str):
    """Delete a chat session."""
    success = session_manager.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found.")
    return {"message": f"Session {session_id} deleted."}


@router.get("/sessions/{session_id}/messages", response_model=SessionMessagesResponse)
def get_session_messages(session_id: str):
    """Get all messages in a session."""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    return {
        "session_id": session_id,
        "connection_ids": session.connection_ids,
        "last_connection_id": session.last_connection_id,
        "messages": [msg.model_dump() for msg in session.messages],
    }
