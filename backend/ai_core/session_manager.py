import uuid
from typing import Optional
from datetime import datetime
from ai_core.models import ChatSession, ChatMessage, SessionSummary
from database.supabase_client import supabase
from database.retry import supabase_retry


@supabase_retry
def create_session(user_id: str, connection_id: str | None = None) -> ChatSession:
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
    
    response = supabase.table("chat_sessions").insert(data).execute()
    
    if not response.data:
        raise Exception("Failed to create chat session")
        
    return ChatSession(**response.data[0], messages=[])


@supabase_retry
def get_session(user_id: str, session_id: str) -> Optional[ChatSession]:
    """Get a session by ID and owner from Supabase."""
    # 1. Fetch session metadata
    session_resp = supabase.table("chat_sessions") \
        .select("*") \
        .eq("id", session_id) \
        .eq("owner_id", user_id) \
        .execute()
        
    if not session_resp.data:
        return None
        
    session_data = session_resp.data[0]
    
    # 2. Fetch messages
    messages_resp = supabase.table("chat_messages") \
        .select("*") \
        .eq("session_id", session_id) \
        .order("created_at", desc=False) \
        .execute()
        
    messages = [ChatMessage(**m) for m in messages_resp.data]
    chained_messages = reconstruct_dual_chain(messages)
    
    return ChatSession(**session_data, messages=chained_messages)


@supabase_retry
def delete_session(user_id: str, session_id: str) -> bool:
    """Delete a session and its messages from Supabase."""
    # 1. Delete messages first
    supabase.table("chat_messages") \
        .delete() \
        .eq("session_id", session_id) \
        .eq("owner_id", user_id) \
        .execute()
        
    # 2. Delete session
    response = supabase.table("chat_sessions") \
        .delete() \
        .eq("id", session_id) \
        .eq("owner_id", user_id) \
        .execute()
        
    return len(response.data) > 0


@supabase_retry
def list_sessions(user_id: str) -> list[SessionSummary]:
    """List all sessions for a user from Supabase."""
    # Fetch sessions with message counts (simplified: just list sessions)
    response = supabase.table("chat_sessions") \
        .select("*, chat_messages(count)") \
        .eq("owner_id", user_id) \
        .order("created_at", desc=True) \
        .execute()
        
    sessions = []
    for item in response.data:
        # Pydantic handles mapping if keys match
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


@supabase_retry
def track_connection(user_id: str, session_id: str, connection_id: str | None) -> None:
    """Track a connection used in a session. Safe for side-effect usage."""
    if not connection_id:
        return
        
    try:
        # Get current connection_ids
        session_resp = supabase.table("chat_sessions") \
            .select("connection_ids") \
            .eq("id", session_id) \
            .eq("owner_id", user_id) \
            .execute()
            
        if not session_resp.data:
            return
            
        conn_ids = session_resp.data[0].get("connection_ids") or []
        if connection_id not in conn_ids:
            conn_ids.append(connection_id)
            
        supabase.table("chat_sessions") \
            .update({
                "connection_ids": conn_ids,
                "last_connection_id": connection_id
            }) \
            .eq("id", session_id) \
            .eq("owner_id", user_id) \
            .execute()
    except Exception as e:
        print(f"Error tracking connection (side-effect): {str(e)}")


@supabase_retry
def rename_session(user_id: str, session_id: str, title: str) -> bool:
    """Rename a session. Returns False if session not found. Safe for side-effect usage."""
    try:
        response = supabase.table("chat_sessions") \
            .update({"title": title}) \
            .eq("id", session_id) \
            .eq("owner_id", user_id) \
            .execute()
        return bool(response.data)
    except Exception as e:
        print(f"Error renaming session (side-effect): {str(e)}")
        return False


@supabase_retry
def add_message(user_id: str, session_id: str, message: ChatMessage) -> None:
    """Add a single message to session history."""
    try:
        # Use JSON serialization then reload to ensure a clean, Supabase-safe dictionary
        import json
        msg_dict = json.loads(message.json())
        msg_dict["session_id"] = session_id
        msg_dict["owner_id"] = user_id
        
        # Remove any empty/None keys that might cause Supabase issues with default values
        clean_dict = {k: v for k, v in msg_dict.items() if v is not None}
        
        result = supabase.table("chat_messages").insert(clean_dict).execute()
        if hasattr(result, 'error') and result.error:
            print(f"❌ Supabase Error inserting message: {result.error}")
    except Exception as e:
        print(f"❌ Error adding message to Supabase: {str(e)}")
        # Don't raise, we want the chat to continue even if history save fails


@supabase_retry
def update_message(user_id: str, session_id: str, message_id: str, updates: dict) -> bool:
    """Update a single message in session history."""
    try:
        # Filter out None values to avoid overwriting with nulls if not intentional
        clean_updates = {k: v for k, v in updates.items() if v is not None}
        
        response = supabase.table("chat_messages") \
            .update(clean_updates) \
            .eq("id", message_id) \
            .eq("session_id", session_id) \
            .eq("owner_id", user_id) \
            .execute()
        return bool(response.data)
    except Exception as e:
        print(f"❌ Error updating message: {str(e)}")
        return False


@supabase_retry
def get_history_for_llm(user_id: str, session_id: str) -> list[dict]:
    """
    Get conversation history formatted for LLM input from Supabase.
    Returns list of {"role": ..., "content": ...} dicts.
    """
    try:
        response = supabase.table("chat_messages") \
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
            
            # For assistant messages, include the SQL that was generated
            if role == "assistant" and msg.get("sql"):
                content = f"{content}\n```sql\n{msg['sql']}\n```"
                
            history.append({"role": role, "content": content})

        return history
    except Exception as e:
        print(f"Error fetching history from Supabase (side-effect): {str(e)}")
        return []


@supabase_retry
def get_latest_user_message_id(user_id: str, session_id: str) -> Optional[str]:
    """Get the ID of the most recent USER message in a session."""
    try:
        response = supabase.table("chat_messages") \
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
    """
    Reconstruct the conversation history using prev_query_id and parent_id links.
    Algorithm:
    1. Organize all user messages by their prev_query_id.
    2. Organize all assistant messages by their parent_id.
    3. Start with the user message where prev_query_id is None.
    4. Follow the queries sequentially, inserting their associated assistant responses in between.
    """
    if not messages:
        return []

    # 1. Map queries by prev_query_id
    # Note: Using a list for responses in case one query has multiple answers
    user_msgs_by_prev = {}
    assistant_msgs_by_parent = {}
    
    for msg in messages:
        if msg.role == "user":
            user_msgs_by_prev[msg.prev_query_id] = msg
        elif msg.role == "assistant":
            if msg.parent_id not in assistant_msgs_by_parent:
                assistant_msgs_by_parent[msg.parent_id] = []
            assistant_msgs_by_parent[msg.parent_id].append(msg)

    # 2. Build the chain starting from the root (prev_query_id is None)
    chain = []
    current_user_msg = user_msgs_by_prev.get(None)
    
    while current_user_msg:
        # Add the User Message
        chain.append(current_user_msg)
        
        # Add any Assistant Responses for this user message
        responses = assistant_msgs_by_parent.get(current_user_msg.id, [])
        # Sort responses by time if there are multiple
        responses.sort(key=lambda x: x.created_at)
        chain.extend(responses)
        
        # Move to the next User Message in the sequence
        current_user_msg = user_msgs_by_prev.get(current_user_msg.id)

    # 3. Safety Check: If the chain is empty but we have messages, 
    # fall back to chronological order (for legacy data)
    if not chain and messages:
        return sorted(messages, key=lambda x: x.created_at)

    # Also check if we missed any orphaned messages (rare)
    if len(chain) < len(messages):
        # Find messages not in chain
        chain_ids = {m.id for m in chain}
        orphans = [m for m in messages if m.id not in chain_ids]
        # Append orphans at the end or handle appropriately
        chain.extend(sorted(orphans, key=lambda x: x.created_at))

    return chain
