from fastapi import APIRouter, HTTPException, Depends
import anyio

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
async def send_chat_message(
    request: ChatRequest, 
    current_user: User = Depends(get_current_user),
    _: User = Depends(RateLimitChecker("ai"))
):
    """Send a message and get AI-generated SQL + results."""
    user_id = current_user.id
    
    # 1. Verify engine
    engine = await connection_manager.get_engine(user_id, request.connection_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Database connection not found.")

    # 2. Get or create session
    session_id = request.session_id
    is_new_session = False
    if not session_id:
        session = await session_manager.create_session(user_id, request.connection_id)
        session_id = session.id
        is_new_session = True
    else:
        session = await session_manager.get_session(user_id, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found.")

    # 3. Side effects
    await session_manager.track_connection(user_id, session_id, request.connection_id)

    if is_new_session:
        title = request.message[:50].strip() + ("..." if len(request.message) > 50 else "")
        await session_manager.rename_session(user_id, session_id, title)

    prev_query_id = await session_manager.get_latest_user_message_id(user_id, session_id)

    # 4. Save user message
    user_msg = ChatMessage(
        role="user",
        content=request.message,
        connection_id=request.connection_id,
        prev_query_id=prev_query_id
    )
    await session_manager.add_message(user_id, session_id, user_msg)

    # 5. Run the LangGraph pipeline
    try:
        result = await run_chat(
            user_id=user_id,
            connection_id=request.connection_id,
            session_id=session_id,
            user_message=request.message,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")

    # 6. Save assistant response
    assistant_msg_id = ""
    try:
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
        await session_manager.add_message(user_id, session_id, assistant_msg)
    except Exception as e:
        print(f"❌ Error saving assistant msg: {e}")

    # 7. Return response
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
        chart_recommendation=result.get("chart_recommendation"),
        error=result.get("error"),
        column_metadata=result.get("column_metadata", {}),
        is_pinned=False,
        prev_query_id=prev_query_id
    )


@router.get("/sessions", response_model=list[SessionSummary])
async def list_sessions(current_user: User = Depends(get_current_user)):
    return await session_manager.list_sessions(current_user.id)


@router.post("/sessions", response_model=SessionSummary)
async def create_session(connection_id: str | None = None, current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    if connection_id:
        engine = await connection_manager.get_engine(user_id, connection_id)
        if not engine: raise HTTPException(status_code=404, detail="Connection not found.")

    session = await session_manager.create_session(user_id, connection_id)
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
async def update_session(session_id: str, request: UpdateSessionRequest, current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    if request.title is not None:
        await session_manager.rename_session(user_id, session_id, request.title)
    
    session = await session_manager.get_session(user_id, session_id)
    if not session: raise HTTPException(status_code=404, detail="Session not found.")
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
async def delete_session(session_id: str, current_user: User = Depends(get_current_user)):
    success = await session_manager.delete_session(current_user.id, session_id)
    if not success: raise HTTPException(status_code=404, detail="Session not found.")
    return {"message": f"Session {session_id} deleted."}


@router.get("/sessions/{session_id}/messages", response_model=SessionMessagesResponse)
async def get_session_messages(session_id: str, current_user: User = Depends(get_current_user)):
    session = await session_manager.get_session(current_user.id, session_id)
    if not session: raise HTTPException(status_code=404, detail="Session not found.")
    return SessionMessagesResponse(
        session_id=session_id,
        owner_id=current_user.id,
        connection_ids=session.connection_ids,
        last_connection_id=session.last_connection_id,
        messages=session.messages,
    )


@router.post("/{session_id}/message/{message_id}/edit-sql", response_model=ChatMessage)
async def edit_chat_sql(
    session_id: str,
    message_id: str,
    request: EditSqlRequest,
    current_user: User = Depends(get_current_user)
):
    user_id = current_user.id
    engine = await connection_manager.get_engine(user_id, request.connection_id)
    if not engine: raise HTTPException(status_code=404, detail="Connection not found.")
        
    readonly = await connection_manager.get_readonly(user_id, request.connection_id)
    
    # Offload sync query to thread pool
    result = await anyio.to_thread.run_sync(
        execute_query, user_id, engine, request.sql, 500, request.connection_id, readonly
    )

    new_viz = None
    if result.success and result.rows:
        try:
            history = await session_manager.get_history_for_llm(user_id, session_id)
            user_msg_context = next((m["content"] for m in reversed(history) if m["role"] == "user"), "Custom query")
            new_viz = await generate_visualization_blueprint(
                user_message=user_msg_context,
                sql=request.sql,
                preview_rows=result.rows[:5],
                column_metadata={},
                is_edited=True
            )
        except Exception:
            pass

    updates = {
        "sql": request.sql,
        "results": {"rows": result.rows},
        "columns": result.columns,
        "chart_recommendation": new_viz,
        "error": result.error if result.error else None
    }
    await session_manager.update_message(user_id, session_id, message_id, updates)

    return ChatMessage(
        id=message_id,
        role="assistant",
        content="SQL Updated",
        sql=request.sql,
        results={"rows": result.rows},
        columns=result.columns,
        chart_recommendation=new_viz,
        error=result.error,
        connection_id=request.connection_id
    )


@router.post("/{session_id}/message/{message_id}/pin", response_model=MessageResponse)
async def toggle_pin_message(
    session_id: str,
    message_id: str,
    is_pinned: bool,
    current_user: User = Depends(get_current_user)
):
    success = await session_manager.update_message(current_user.id, session_id, message_id, {"is_pinned": is_pinned})
    if not success: raise HTTPException(status_code=404, detail="Message not found.")
    return MessageResponse(message="Pin status updated")
