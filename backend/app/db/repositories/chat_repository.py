import json
import logging
import uuid
from datetime import datetime
from typing import Optional

from app.db.models.chat import ChatMessage, ChatSession, SessionSummary
from app.db.retry import async_supabase_retry
from app.integrations.supabase_db import async_supabase


logger = logging.getLogger(__name__)


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
        "created_at": datetime.now().isoformat(),
    }
    response = await async_supabase.table("chat_sessions").insert(data).execute()
    if not response.data:
        raise Exception("Failed to create chat session")
    return ChatSession(**response.data[0], messages=[])


@async_supabase_retry
async def get_session(user_id: str, session_id: str) -> Optional[ChatSession]:
    """Get a session by ID and owner from Supabase."""
    session_resp = (
        await async_supabase.table("chat_sessions")
        .select("*")
        .eq("id", session_id)
        .eq("owner_id", user_id)
        .execute()
    )
    if not session_resp.data:
        return None

    session_data = session_resp.data[0]
    messages_resp = (
        await async_supabase.table("chat_messages")
        .select("*")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .execute()
    )
    messages = [ChatMessage(**row) for row in messages_resp.data]
    return ChatSession(**session_data, messages=reconstruct_dual_chain(messages))


@async_supabase_retry
async def delete_session(user_id: str, session_id: str) -> bool:
    """Delete a session and its messages from Supabase."""
    await (
        async_supabase.table("chat_messages")
        .delete()
        .eq("session_id", session_id)
        .eq("owner_id", user_id)
        .execute()
    )
    response = (
        await async_supabase.table("chat_sessions")
        .delete()
        .eq("id", session_id)
        .eq("owner_id", user_id)
        .execute()
    )
    return len(response.data) > 0


@async_supabase_retry
async def list_sessions(user_id: str) -> list[SessionSummary]:
    """List all sessions for a user from Supabase."""
    response = (
        await async_supabase.table("chat_sessions")
        .select("*, chat_messages(count)")
        .eq("owner_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    sessions: list[SessionSummary] = []
    for item in response.data:
        msg_count = item.get("chat_messages", [{}])[0].get("count", 0)
        sessions.append(
            SessionSummary(
                id=item["id"],
                owner_id=item["owner_id"],
                connection_ids=item["connection_ids"],
                last_connection_id=item["last_connection_id"],
                title=item["title"],
                message_count=msg_count,
                created_at=item["created_at"],
            )
        )
    return sessions


@async_supabase_retry
async def track_connection(user_id: str, session_id: str, connection_id: str | None) -> None:
    """Track a connection used in a session. Safe for side-effect usage."""
    if not connection_id:
        return
    try:
        session_resp = (
            await async_supabase.table("chat_sessions")
            .select("connection_ids")
            .eq("id", session_id)
            .eq("owner_id", user_id)
            .execute()
        )
        if not session_resp.data:
            return

        conn_ids = session_resp.data[0].get("connection_ids") or []
        if connection_id not in conn_ids:
            conn_ids.append(connection_id)

        await (
            async_supabase.table("chat_sessions")
            .update({"connection_ids": conn_ids, "last_connection_id": connection_id})
            .eq("id", session_id)
            .eq("owner_id", user_id)
            .execute()
        )
    except Exception as exc:
        logger.warning("Error tracking connection for session %s: %s", session_id, exc)


@async_supabase_retry
async def rename_session(user_id: str, session_id: str, title: str) -> bool:
    """Rename a session. Returns False if session not found."""
    try:
        response = (
            await async_supabase.table("chat_sessions")
            .update({"title": title})
            .eq("id", session_id)
            .eq("owner_id", user_id)
            .execute()
        )
        return bool(response.data)
    except Exception as exc:
        logger.warning("Error renaming session %s: %s", session_id, exc)
        return False


@async_supabase_retry
async def add_message(user_id: str, session_id: str, message: ChatMessage) -> None:
    """Add a single message to session history."""
    try:
        msg_dict = json.loads(message.model_dump_json())
        msg_dict["session_id"] = session_id
        msg_dict["owner_id"] = user_id
        clean_dict = {key: value for key, value in msg_dict.items() if value is not None}
        result = await async_supabase.table("chat_messages").insert(clean_dict).execute()
        if hasattr(result, "error") and result.error:
            logger.error("Supabase error inserting message %s: %s", message.id, result.error)
    except Exception as exc:
        logger.error("Error adding message %s to Supabase: %s", message.id, exc)


@async_supabase_retry
async def update_message(user_id: str, session_id: str, message_id: str, updates: dict) -> bool:
    """Update a single message in session history."""
    try:
        clean_updates = {key: value for key, value in updates.items() if value is not None}
        response = (
            await async_supabase.table("chat_messages")
            .update(clean_updates)
            .eq("id", message_id)
            .eq("session_id", session_id)
            .eq("owner_id", user_id)
            .execute()
        )
        return bool(response.data)
    except Exception as exc:
        logger.error("Error updating message %s in session %s: %s", message_id, session_id, exc)
        return False


@async_supabase_retry
async def get_history_for_llm(user_id: str, session_id: str) -> list[dict]:
    """Get conversation history formatted for LLM input from Supabase."""
    try:
        response = (
            await async_supabase.table("chat_messages")
            .select("role", "content", "sql")
            .eq("session_id", session_id)
            .eq("owner_id", user_id)
            .order("created_at", desc=False)
            .execute()
        )
        if not response.data:
            return []

        history: list[dict] = []
        for msg in response.data:
            content = msg["content"]
            if msg["role"] == "assistant" and msg.get("sql"):
                content = f"{content}\n```sql\n{msg['sql']}\n```"
            history.append({"role": msg["role"], "content": content})
        return history
    except Exception as exc:
        logger.warning("Error fetching history for session %s: %s", session_id, exc)
        return []


@async_supabase_retry
async def get_latest_user_message_id(user_id: str, session_id: str) -> Optional[str]:
    """Get the ID of the most recent user message in a session."""
    try:
        response = (
            await async_supabase.table("chat_messages")
            .select("id")
            .eq("session_id", session_id)
            .eq("owner_id", user_id)
            .eq("role", "user")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if response.data:
            return response.data[0]["id"]
        return None
    except Exception as exc:
        logger.warning("Error fetching latest user message for session %s: %s", session_id, exc)
        return None


def reconstruct_dual_chain(messages: list[ChatMessage]) -> list[ChatMessage]:
    """Reconstruct conversation order using prev_query_id and parent_id links."""
    if not messages:
        return []

    user_msgs_by_prev: dict[str | None, ChatMessage] = {}
    assistant_msgs_by_parent: dict[str | None, list[ChatMessage]] = {}

    for msg in messages:
        if msg.role == "user":
            user_msgs_by_prev[msg.prev_query_id] = msg
        elif msg.role == "assistant":
            assistant_msgs_by_parent.setdefault(msg.parent_id, []).append(msg)

    chain: list[ChatMessage] = []
    current_user_msg = user_msgs_by_prev.get(None)
    while current_user_msg:
        chain.append(current_user_msg)
        responses = assistant_msgs_by_parent.get(current_user_msg.id, [])
        responses.sort(key=lambda item: item.created_at)
        chain.extend(responses)
        current_user_msg = user_msgs_by_prev.get(current_user_msg.id)

    if not chain and messages:
        return sorted(messages, key=lambda item: item.created_at)

    if len(chain) < len(messages):
        chain_ids = {msg.id for msg in chain}
        orphans = [msg for msg in messages if msg.id not in chain_ids]
        chain.extend(sorted(orphans, key=lambda item: item.created_at))

    return chain


__all__ = [
    "create_session",
    "get_session",
    "delete_session",
    "list_sessions",
    "track_connection",
    "rename_session",
    "add_message",
    "update_message",
    "get_history_for_llm",
    "get_latest_user_message_id",
    "reconstruct_dual_chain",
]
