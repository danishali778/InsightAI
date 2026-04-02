from fastapi import APIRouter, HTTPException, Depends

from common.models import MessageResponse
from common.auth import get_current_user, User
from database import connection_manager
from ai_core.models import ChatRequest, ChatResponse, ChatMessage, SessionMessagesResponse, SessionSummary, UpdateSessionRequest
from ai_core.graph import run_chat
from ai_core import session_manager


router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
def send_chat_message(request: ChatRequest, current_user: User = Depends(get_current_user)):
    """Send a message and get AI-generated SQL + results."""
    user_id = current_user.id
    
    # Verify database connection exists for THIS user
    engine = connection_manager.get_engine(user_id, request.connection_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Database connection not found. Connect first.")

    # Get or create session
    session_id = request.session_id
    is_new_session = False
    if not session_id:
        session = session_manager.create_session(user_id, request.connection_id)
        session_id = session.id
        is_new_session = True
    else:
        session = session_manager.get_session(user_id, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found.")

    # Track the connection used in this message
    session_manager.track_connection(user_id, session_id, request.connection_id)

    # Auto-title on first message of a new session
    if is_new_session:
        title = request.message[:50].strip()
        if len(request.message) > 50:
            title += "..."
        session_manager.rename_session(user_id, session_id, title)

    # Save user message to session
    session_manager.add_message(user_id, session_id, ChatMessage(
        role="user",
        content=request.message,
        connection_id=request.connection_id,
    ))

    # Run the LangGraph pipeline
    try:
        # Note: run_chat currently doesn't take user_id, 
        # but it uses connection_manager.get_engine internally.
        # We might need to update graph.py too if it doesn't support user_id yet.
        result = run_chat(
            user_id=user_id,
            connection_id=request.connection_id,
            session_id=session_id,
            user_message=request.message,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")

    # Save assistant response to history
    try:
        # Ensure we have a clean dictionary from the graph results
        assistant_msg = ChatMessage(
            role="assistant",
            content=result.get("explanation", ""),
            connection_id=request.connection_id,
            sql=result.get("sql"),
            results={"rows": result.get("rows", [])},
            columns=result.get("columns", []),
            chart_recommendation=result.get("chart_recommendation"),
            error=result.get("error")
        )
        session_manager.add_message(user_id, session_id, assistant_msg)
    except Exception as e:
        print(f"❌ Critical error creating/saving assistant response to history: {str(e)}")
        import traceback
        traceback.print_exc()

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
        column_metadata=result.get("column_metadata", {}),
    )


@router.get("/sessions", response_model=list[SessionSummary])
def list_sessions(current_user: User = Depends(get_current_user)):
    """List all chat sessions for the current user."""
    return session_manager.list_sessions(current_user.id)


@router.post("/sessions", response_model=SessionSummary)
def create_session(connection_id: str | None = None, current_user: User = Depends(get_current_user)):
    """Create a new chat session."""
    user_id = current_user.id
    if connection_id:
        engine = connection_manager.get_engine(user_id, connection_id)
        if not engine:
            raise HTTPException(status_code=404, detail="Database connection not found.")

    session = session_manager.create_session(user_id, connection_id)
    return SessionSummary(
        id=session.id,
        owner_id=session.owner_id,
        connection_ids=session.connection_ids,
        last_connection_id=session.last_connection_id,
        title=session.title,
        message_count=0,
        created_at=session.created_at,
    )


@router.patch("/sessions/{session_id}", response_model=SessionSummary)
def update_session(session_id: str, request: UpdateSessionRequest, current_user: User = Depends(get_current_user)):
    """Update session metadata (e.g. rename)."""
    user_id = current_user.id
    session = session_manager.get_session(user_id, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    if request.title is not None:
        session_manager.rename_session(user_id, session_id, request.title)
    
    # Re-fetch for current state
    session = session_manager.get_session(user_id, session_id)
    return SessionSummary(
        id=session.id,
        owner_id=session.owner_id,
        connection_ids=session.connection_ids,
        last_connection_id=session.last_connection_id,
        title=session.title,
        message_count=len(session.messages),
        created_at=session.created_at,
    )


@router.delete("/sessions/{session_id}", response_model=MessageResponse)
def delete_session(session_id: str, current_user: User = Depends(get_current_user)):
    """Delete a chat session."""
    success = session_manager.delete_session(current_user.id, session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found.")
    return {"message": f"Session {session_id} deleted."}


@router.get("/sessions/{session_id}/messages", response_model=SessionMessagesResponse)
def get_session_messages(session_id: str, current_user: User = Depends(get_current_user)):
    """Get all messages in a session."""
    user_id = current_user.id
    session = session_manager.get_session(user_id, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    return SessionMessagesResponse(
        session_id=session_id,
        owner_id=user_id,
        connection_ids=session.connection_ids,
        last_connection_id=session.last_connection_id,
        messages=session.messages,
    )
