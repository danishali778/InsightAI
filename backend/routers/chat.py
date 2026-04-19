from fastapi import APIRouter, HTTPException, Depends

from common.models import MessageResponse
from common.auth import get_current_user, User
from database import connection_manager
from ai_core.models import (
    ChatRequest, ChatResponse, ChatMessage, SessionMessagesResponse, 
    SessionSummary, UpdateSessionRequest, EditSqlRequest
)
from ai_core.graph import run_chat
from ai_core import session_manager
from ai_core.visualization_agent import generate_visualization_blueprint
from query_executor.executor import execute_query
from common.rate_limit import RateLimitChecker


router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
def send_chat_message(
    request: ChatRequest, 
    current_user: User = Depends(get_current_user),
    _: User = Depends(RateLimitChecker("ai"))
):
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

    # Find previous query in this session
    prev_query_id = None
    if session_id:
        prev_query_id = session_manager.get_latest_user_message_id(user_id, session_id)

    # Save user message to session
    user_msg = ChatMessage(
        role="user",
        content=request.message,
        connection_id=request.connection_id,
        prev_query_id=prev_query_id
    )
    session_manager.add_message(user_id, session_id, user_msg)

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
    assistant_msg_id = ""
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
            error=result.get("error"),
            parent_id=user_msg.id
        )
        assistant_msg_id = assistant_msg.id
        session_manager.add_message(user_id, session_id, assistant_msg)
    except Exception as e:
        print(f"❌ Critical error creating/saving assistant response to history: {str(e)}")
        import traceback
        traceback.print_exc()

    # Build response
    error = result.get("error", "")
    chart_rec = result.get("chart_recommendation")
    
    # Sanitize chart recommendation to prevent Pydantic validation errors if AI sends None for lists
    if chart_rec and isinstance(chart_rec, dict):
        if chart_rec.get("y_columns") is None:
            chart_rec["y_columns"] = []
        if chart_rec.get("tooltip_columns") is None:
            chart_rec["tooltip_columns"] = []
    return ChatResponse(
        session_id=session_id,
        message_id=assistant_msg_id,
        user_message_id=user_msg.id,
        message=result.get("explanation", ""),
        sql=result.get("sql"),
        columns=result.get("columns", []),
        rows=result.get("rows", []),
        row_count=result.get("row_count", 0),
        execution_time_ms=result.get("execution_time_ms", 0.0),
        chart_recommendation=chart_rec,
        error=error if error else None,
        column_metadata=result.get("column_metadata", {}),
        is_pinned=False,
        prev_query_id=prev_query_id
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


@router.post("/{session_id}/message/{message_id}/edit-sql", response_model=ChatMessage)
def edit_chat_sql(
    session_id: str,
    message_id: str,
    request: EditSqlRequest,
    current_user: User = Depends(get_current_user)
):
    """Edit the SQL of a message, re-run it, and update the message in history."""
    import traceback
    user_id = current_user.id
    print(f"[edit-sql] Starting: session={session_id}, msg={message_id}, conn={request.connection_id}")
    
    # 1. Verify engine
    engine = connection_manager.get_engine(user_id, request.connection_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Database connection not found.")
    print(f"[edit-sql] Step 1 OK: engine found")
        
    # 2. Re-run query
    try:
        result = execute_query(
            user_id,
            engine=engine,
            sql=request.sql,
            row_limit=500,
            connection_id=request.connection_id,
            readonly=True
        )
        print(f"[edit-sql] Step 2 OK: query executed — success={result.success}, rows={result.row_count}, cols={len(result.columns)}")
    except Exception as e:
        print(f"[edit-sql] Step 2 FAILED: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Query execution failed: {str(e)}")

    # 3. Get visualization context
    new_viz = None
    try:
        history = session_manager.get_history_for_llm(user_id, session_id)
        user_msg_context = "Custom SQL query"
        for h_msg in history:
            if h_msg["role"] == "user":
                user_msg_context = h_msg["content"]
        print(f"[edit-sql] Step 3 OK: context = '{user_msg_context[:50]}...'")

        # 4. Re-run visualization agent (only if query succeeded with rows)
        if result.success and result.rows:
            new_viz = generate_visualization_blueprint(
                user_message=user_msg_context,
                sql=request.sql,
                preview_rows=result.rows[:5],
                column_metadata={},
                is_edited=True
            )
            print(f"[edit-sql] Step 4 OK: viz = {new_viz.get('type') if new_viz else None}")
        else:
            print(f"[edit-sql] Step 4 SKIPPED: no rows to visualize")
    except Exception as e:
        print(f"[edit-sql] Step 3/4 WARN (non-fatal): {e}")
        traceback.print_exc()
        # Visualization failure is non-fatal — we still return the query results

    # 5. Update message in Supabase
    try:
        updates = {
            "sql": request.sql,
            "results": {"rows": result.rows},
            "columns": result.columns,
        }
        # Only include chart_recommendation if we have a new one
        if new_viz is not None:
            updates["chart_recommendation"] = new_viz
        # Only include error if there is one
        if result.error:
            updates["error"] = result.error
        
        print(f"[edit-sql] Step 5: updating message with keys={list(updates.keys())}")
        success = session_manager.update_message(user_id, session_id, message_id, updates)
        print(f"[edit-sql] Step 5 {'OK' if success else 'WARN'}: update_message returned {success}")
    except Exception as e:
        print(f"[edit-sql] Step 5 WARN (non-fatal): {e}")
        traceback.print_exc()
        # DB update failure is non-fatal — we still return the fresh results

    # 6. Return updated message to frontend regardless of DB update success
    return ChatMessage(
        id=message_id,
        role="assistant",
        content="SQL Updated & Re-run",
        sql=request.sql,
        results={"rows": result.rows},
        columns=result.columns,
        chart_recommendation=new_viz,
        error=result.error,
        connection_id=request.connection_id
    )


@router.post("/{session_id}/message/{message_id}/pin", response_model=MessageResponse)
def toggle_pin_message(
    session_id: str,
    message_id: str,
    is_pinned: bool,
    current_user: User = Depends(get_current_user)
):
    """Toggle the pinned status of a chat message."""
    success = session_manager.update_message(
        current_user.id,
        session_id,
        message_id,
        {"is_pinned": is_pinned}
    )
    if not success:
        raise HTTPException(status_code=404, detail="Message not found.")
        
    return MessageResponse(message="Pin status updated")
