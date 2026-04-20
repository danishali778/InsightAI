import uuid
from typing import Optional
from datetime import datetime
from ai_core.models import ChatSession, ChatMessage, SessionSummary
from database.supabase_client import async_supabase
from database.retry import async_supabase_retry


@async_supabase_retry
async def create_session(user_id: str, connection_id: str | None = None) -> ChatSession:
    """Create a new chat session in Supabase."""
    session_id = str(uuid.uuid4())
    
    data = {
        "id": session_id,
        "owner_id": user_id,
        "connection_ids": [connection_id] if connection_id else [],
        "last_connection_id": connection_id,
        "title": "New Chat",
        "created_at": datetime.now().isoformat()
    }
    
    response = await async_supabase.table("chat_sessions").insert(data).execute()
    
    if not response.data:
        raise Exception("Failed to create chat session")
        
    return ChatSession(**response.data[0], messages=[])


@async_supabase_retry
async def get_session(user_id: str, session_id: str) -> Optional[ChatSession]:
    """Get a session by ID and owner from Supabase."""
    # 1. Fetch session metadata
    session_resp = await async_supabase.table("chat_sessions") \
        .select("*") \
        .eq("id", session_id) \
        .eq("owner_id", user_id) \
        .execute()
        
    if not session_resp.data:
        return None
        
    session_data = session_resp.data[0]
    
    # 2. Fetch messages
    messages_resp = await async_supabase.table("chat_messages") \
        .select("*") \
        .eq("session_id", session_id) \
        .order("created_at", desc=False) \
        .execute()
        
    messages = [ChatMessage(**m) for m in messages_resp.data]
    chained_messages = reconstruct_dual_chain(messages)
    
    return ChatSession(**session_data, messages=chained_messages)


@async_supabase_retry
async def delete_session(user_id: str, session_id: str) -> bool:
    """Delete a session and its messages from Supabase."""
    # 1. Delete messages first
    await async_supabase.table("chat_messages") \
        .delete() \
        .eq("session_id", session_id) \
        .eq("owner_id", user_id) \
        .execute()
        
    # 2. Delete session
    response = await async_supabase.table("chat_sessions") \
        .delete() \
        .eq("id", session_id) \
        .eq("owner_id", user_id) \
        .execute()
        
    return len(response.data) > 0


@async_supabase_retry
async def list_sessions(user_id: str) -> list[SessionSummary]:
    """List all sessions for a user from Supabase."""
    response = await async_supabase.table("chat_sessions") \
        .select("*, chat_messages(count)") \
        .eq("owner_id", user_id) \
        .order("created_at", desc=True) \
        .execute()
        
    sessions = []
    for item in response.data:
        msg_count = item.get("chat_messages", [{}])[0].get("count", 0)
        sessions.append(SessionSummary(
            id=item["id"],
            owner_id=item["owner_id"],
            connection_ids=item["connection_ids"],
            last_connection_id=item["last_connection_id"],
            title=item["title"],
            message_count=msg_count,
            created_at=item["created_at"]
        ))
        
    return sessions


@async_supabase_retry
async def track_connection(user_id: str, session_id: str, connection_id: str | None) -> None:
    """Track a connection used in a session."""
    if not connection_id:
        return
        
    try:
        session_resp = await async_supabase.table("chat_sessions") \
            .select("connection_ids") \
            .eq("id", session_id) \
            .eq("owner_id", user_id) \
            .execute()
            
        if not session_resp.data:
            return
            
        conn_ids = session_resp.data[0].get("connection_ids") or []
        if connection_id not in conn_ids:
            conn_ids.append(connection_id)
            
        await async_supabase.table("chat_sessions") \
            .update({
                "connection_ids": conn_ids,
                "last_connection_id": connection_id
            }) \
            .eq("id", session_id) \
            .eq("owner_id", user_id) \
            .execute()
    except Exception as e:
        print(f"Error tracking connection: {str(e)}")


@async_supabase_retry
async def rename_session(user_id: str, session_id: str, title: str) -> bool:
    """Rename a session."""
    try:
        response = await async_supabase.table("chat_sessions") \
            .update({"title": title}) \
            .eq("id", session_id) \
            .eq("owner_id", user_id) \
            .execute()
        return bool(response.data)
    except Exception as e:
        print(f"Error renaming session: {str(e)}")
        return False


@async_supabase_retry
async def add_message(user_id: str, session_id: str, message: ChatMessage) -> None:
    """Add a single message to session history."""
    try:
        import json
        msg_dict = json.loads(message.json())
        msg_dict["session_id"] = session_id
        msg_dict["owner_id"] = user_id
        
        clean_dict = {k: v for k, v in msg_dict.items() if v is not None}
        
        await async_supabase.table("chat_messages").insert(clean_dict).execute()
    except Exception as e:
        print(f"❌ Error adding message to Supabase: {str(e)}")


@async_supabase_retry
async def update_message(user_id: str, session_id: str, message_id: str, updates: dict) -> bool:
    """Update a single message in session history."""
    try:
        clean_updates = {k: v for k, v in updates.items() if v is not None}
        
        response = await async_supabase.table("chat_messages") \
            .update(clean_updates) \
            .eq("id", message_id) \
            .eq("session_id", session_id) \
            .eq("owner_id", user_id) \
            .execute()
        return bool(response.data)
    except Exception as e:
        print(f"❌ Error updating message: {str(e)}")
        return False


@async_supabase_retry
async def get_history_for_llm(user_id: str, session_id: str) -> list[dict]:
    """Get conversation history formatted for LLM input."""
    try:
        response = await async_supabase.table("chat_messages") \
            .select("role", "content", "sql") \
            .eq("session_id", session_id) \
            .eq("owner_id", user_id) \
            .order("created_at", desc=False) \
            .execute()
            
        if not response.data:
            return []

        history = []
        for msg in response.data:
            role = msg["role"]
            content = msg["content"]
            
            if role == "assistant" and msg.get("sql"):
                content = f"{content}\n```sql\n{msg['sql']}\n```"
                
            history.append({"role": role, "content": content})

        return history
    except Exception as e:
        print(f"Error fetching history side-effect: {str(e)}")
        return []


@async_supabase_retry
async def get_latest_user_message_id(user_id: str, session_id: str) -> Optional[str]:
    """Get the ID of the most recent USER message in a session."""
    try:
        response = await async_supabase.table("chat_messages") \
            .select("id") \
            .eq("session_id", session_id) \
            .eq("owner_id", user_id) \
            .eq("role", "user") \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()
            
        if response.data:
            return response.data[0]["id"]
        return None
    except Exception as e:
        print(f"Error fetching latest user message: {str(e)}")
        return None


def reconstruct_dual_chain(messages: list[ChatMessage]) -> list[ChatMessage]:
    """Reconstruct the conversation history using prev_query_id and parent_id links."""
    if not messages:
        return []

    user_msgs_by_prev = {}
    assistant_msgs_by_parent = {}
    
    for msg in messages:
        if msg.role == "user":
            user_msgs_by_prev[msg.prev_query_id] = msg
        elif msg.role == "assistant":
            if msg.parent_id not in assistant_msgs_by_parent:
                assistant_msgs_by_parent[msg.parent_id] = []
            assistant_msgs_by_parent[msg.parent_id].append(msg)

    chain = []
    current_user_msg = user_msgs_by_prev.get(None)
    
    while current_user_msg:
        chain.append(current_user_msg)
        responses = assistant_msgs_by_parent.get(current_user_msg.id, [])
        responses.sort(key=lambda x: x.created_at)
        chain.extend(responses)
        current_user_msg = user_msgs_by_prev.get(current_user_msg.id)

    if not chain and messages:
        return sorted(messages, key=lambda x: x.created_at)

    if len(chain) < len(messages):
        chain_ids = {m.id for m in chain}
        orphans = [m for m in messages if m.id not in chain_ids]
        chain.extend(sorted(orphans, key=lambda x: x.created_at))

    return chain
