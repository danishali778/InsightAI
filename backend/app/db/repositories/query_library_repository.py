import uuid
import asyncio
from datetime import datetime, timezone
from typing import Optional

from app.db.models.query_library import (
    QueryRunRecord,
    SaveQueryInput,
    SavedQuery,
    ScheduleConfig,
    UpdateQueryInput,
)
from app.db.retry import async_supabase_retry
from app.integrations.supabase_db import async_supabase


def _normalize_sql(sql: str) -> str:
    """Normalize SQL for duplicate comparison."""
    return " ".join(sql.strip().lower().split())


def _map_to_saved_query(row: dict) -> SavedQuery:
    """Map a Supabase row to a SavedQuery model."""
    metadata = row.get("metadata") or {}
    schedule_data = row.get("schedule") or {}

    return SavedQuery(
        id=str(row["id"]),
        title=row["title"],
        sql=row["sql"],
        description=row.get("description") or "",
        folder_name=metadata.get("folder_name", "Uncategorized"),
        connection_id=str(row["connection_id"]) if row.get("connection_id") else None,
        icon=metadata.get("icon", "📄"),
        icon_bg=metadata.get("icon_bg", "rgba(0,229,255,0.1)"),
        tags=metadata.get("tags", []),
        schedule=ScheduleConfig(**schedule_data) if schedule_data and schedule_data.get("frequency") else None,
        owner_id=str(row["owner_id"]),
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row.get("updated_at") or row["created_at"]),
        run_count=row.get("run_count") or 0,
        last_run_at=datetime.fromisoformat(row["last_run_at"]) if row.get("last_run_at") else None,
    )


# ─── Async Core Functions ───────────────────────────────────────────────────

@async_supabase_retry
async def find_duplicate(user_id: str, sql: str, connection_id: Optional[str] = None) -> Optional[SavedQuery]:
    """Check if a query with the same SQL already exists for this user."""
    query = async_supabase.table("saved_queries").select("*").eq("owner_id", user_id)
    if connection_id:
        query = query.eq("connection_id", connection_id)
    else:
        query = query.is_("connection_id", "null")

    response = await query.execute()
    normalized_input = _normalize_sql(sql)

    for row in response.data:
        if _normalize_sql(row["sql"]) == normalized_input:
            return _map_to_saved_query(row)
    return None


@async_supabase_retry
async def save_query(user_id: str, req: SaveQueryInput) -> tuple[SavedQuery, bool]:
    """Create a new saved query. Returns (query, created)."""
    existing = await find_duplicate(user_id, req.sql, req.connection_id)
    if existing:
        return existing, False

    metadata = {
        "folder_name": req.folder_name,
        "icon": req.icon,
        "icon_bg": req.icon_bg,
        "tags": req.tags
    }

    schedule = req.schedule.model_dump() if req.schedule else {}

    row = {
        "owner_id": user_id,
        "title": req.title,
        "sql": req.sql,
        "description": req.description,
        "connection_id": req.connection_id,
        "metadata": metadata,
        "schedule": schedule
    }

    response = await async_supabase.table("saved_queries").insert(row).execute()
    if not response.data:
        raise Exception("Failed to save query")

    return _map_to_saved_query(response.data[0]), True


@async_supabase_retry
async def get_query(user_id: str, query_id: str) -> Optional[SavedQuery]:
    """Get a single saved query by ID."""
    response = await async_supabase.table("saved_queries") \
        .select("*") \
        .eq("id", query_id) \
        .eq("owner_id", user_id) \
        .execute()

    if not response.data:
        return None
    return _map_to_saved_query(response.data[0])


@async_supabase_retry
async def list_queries(
    user_id: str,
    folder: Optional[str] = None,
    tag: Optional[str] = None,
    connection_id: Optional[str] = None,
    recently_run: bool = False,
) -> list[SavedQuery]:
    """List all saved queries for a user, with optional filters."""
    query = async_supabase.table("saved_queries").select("*").eq("owner_id", user_id)

    if connection_id:
        query = query.eq("connection_id", connection_id)

    response = await query.execute()
    result = [_map_to_saved_query(row) for row in response.data]

    if folder and folder not in ("All Queries", "Recently Run", "Scheduled"):
        result = [q for q in result if q.folder_name == folder]

    if folder == "Scheduled":
        result = [q for q in result if q.schedule and q.schedule.enabled]

    if tag:
        result = [q for q in result if tag in q.tags]

    if recently_run or folder == "Recently Run":
        result = [q for q in result if q.last_run_at is not None]
        result.sort(key=lambda q: q.last_run_at, reverse=True)  # type: ignore
        return result

    # Sort by most recently updated
    result.sort(key=lambda q: q.updated_at, reverse=True)
    return result


@async_supabase_retry
async def update_query(user_id: str, query_id: str, req: UpdateQueryInput) -> Optional[SavedQuery]:
    """Update an existing saved query (partial update)."""
    existing = await get_query(user_id, query_id)
    if not existing:
        return None

    update_data = req.model_dump(exclude_unset=True)
    row_update = {}

    for field in ["title", "sql", "description", "connection_id"]:
        if field in update_data:
            row_update[field] = update_data[field]

    metadata = {
        "folder_name": existing.folder_name,
        "icon": existing.icon,
        "icon_bg": existing.icon_bg,
        "tags": existing.tags
    }

    metadata_changed = False
    for field in ["folder_name", "icon", "icon_bg", "tags"]:
        if field in update_data:
            metadata[field] = update_data[field]
            metadata_changed = True

    if metadata_changed:
        row_update["metadata"] = metadata

    if "schedule" in update_data:
        row_update["schedule"] = update_data["schedule"].model_dump() if update_data["schedule"] else {}

    if not row_update:
        return existing

    response = await async_supabase.table("saved_queries") \
        .update(row_update) \
        .eq("id", query_id) \
        .eq("owner_id", user_id) \
        .execute()

    if not response.data:
        return None
    return _map_to_saved_query(response.data[0])


@async_supabase_retry
async def delete_query(user_id: str, query_id: str) -> bool:
    """Delete a saved query."""
    response = await async_supabase.table("saved_queries") \
        .delete() \
        .eq("id", query_id) \
        .eq("owner_id", user_id) \
        .execute()
    return len(response.data) > 0


@async_supabase_retry
async def increment_run_count(user_id: str, query_id: str) -> Optional[SavedQuery]:
    """Bump run count and update last_run_at."""
    existing = await get_query(user_id, query_id)
    if not existing:
        return None

    now = datetime.now(timezone.utc).isoformat()
    row_update = {
        "run_count": existing.run_count + 1,
        "last_run_at": now
    }

    response = await async_supabase.table("saved_queries") \
        .update(row_update) \
        .eq("id", query_id) \
        .eq("owner_id", user_id) \
        .execute()

    if not response.data:
        return None
    return _map_to_saved_query(response.data[0])


async def create_folder(user_id: str, name: str) -> bool:
    """Explicit folders are not yet supported in DB schema, but we can infer them from metadata."""
    return True


async def list_folders(user_id: str) -> list[dict]:
    """Get unique folder names with counts."""
    queries = await list_queries(user_id)
    folders: dict[str, int] = {}
    for q in queries:
        folders[q.folder_name] = folders.get(q.folder_name, 0) + 1
    return [{"name": name, "count": count} for name, count in sorted(folders.items())]


async def list_tags(user_id: str) -> list[str]:
    """Get all unique tags across saved queries."""
    queries = await list_queries(user_id)
    tags: set[str] = set()
    for q in queries:
        tags.update(q.tags)
    return sorted(tags)


async def get_stats(user_id: str) -> dict:
    """Get library-wide statistics."""
    queries = await list_queries(user_id)
    total = len(queries)
    scheduled = len([q for q in queries if q.schedule and q.schedule.enabled])
    total_runs = sum(q.run_count for q in queries)

    return {
        "total_queries": total,
        "scheduled": scheduled,
        "total_runs": total_runs,
        "recently_run": len([q for q in queries if q.last_run_at]),
        "folders": len(set(q.folder_name for q in queries)),
    }


@async_supabase_retry
async def get_scheduled_queries(user_id: Optional[str] = None) -> list[SavedQuery]:
    """Return all queries with an enabled schedule."""
    query = async_supabase.table("saved_queries").select("*")
    if user_id:
        query = query.eq("owner_id", user_id)

    response = await query.execute()
    result = [_map_to_saved_query(row) for row in response.data]
    return [q for q in result if q.schedule and q.schedule.enabled]


@async_supabase_retry
async def update_schedule(user_id: str, query_id: str, config: Optional[ScheduleConfig]) -> Optional[SavedQuery]:
    """Update just the schedule field of a query."""
    row_update = {
        "schedule": config.model_dump() if config else {}
    }

    response = await async_supabase.table("saved_queries") \
        .update(row_update) \
        .eq("id", query_id) \
        .eq("owner_id", user_id) \
        .execute()

    if not response.data:
        return None
    return _map_to_saved_query(response.data[0])


@async_supabase_retry
async def log_run(
    user_id: str,
    query_id: str,
    success: bool,
    row_count: int = 0,
    execution_time_ms: float = 0.0,
    error: Optional[str] = None,
    triggered_by: str = "manual",
) -> QueryRunRecord:
    """Record a run of a saved query in query_executions."""
    query = await get_query(user_id, query_id)
    if not query:
        raise Exception(f"Query {query_id} not found for logging")

    row = {
        "query_id": query_id,
        "owner_id": user_id,
        "connection_id": query.connection_id,
        "sql": query.sql,
        "success": success,
        "row_count": row_count,
        "execution_time_ms": execution_time_ms,
        "error": error,
        "triggered_by": triggered_by
    }

    response = await async_supabase.table("query_executions").insert(row).execute()
    if not response.data:
        raise Exception("Failed to log run")

    row = response.data[0]
    return QueryRunRecord(
        id=str(row["id"]),
        query_id=str(row["query_id"]),
        sql=row["sql"],
        connection_id=str(row["connection_id"]) if row.get("connection_id") else None,
        owner_id=str(row["owner_id"]),
        success=row["success"],
        row_count=row["row_count"],
        execution_time_ms=row["execution_time_ms"],
        error=row.get("error"),
        triggered_by=row["triggered_by"],
        ran_at=datetime.fromisoformat(row["ran_at"])
    )


@async_supabase_retry
async def get_run_history(user_id: str, query_id: str, limit: int = 20) -> list[QueryRunRecord]:
    """Get run history for a saved query, newest first."""
    response = await async_supabase.table("query_executions") \
        .select("*") \
        .eq("query_id", query_id) \
        .eq("owner_id", user_id) \
        .order("ran_at", desc=True) \
        .limit(limit) \
        .execute()

    return [
        QueryRunRecord(
            id=str(row["id"]),
            query_id=str(row["query_id"]),
            sql=row["sql"],
            connection_id=str(row["connection_id"]) if row.get("connection_id") else None,
            owner_id=str(row["owner_id"]),
            success=row["success"],
            row_count=row["row_count"],
            execution_time_ms=row["execution_time_ms"],
            error=row.get("error"),
            triggered_by=row["triggered_by"],
            ran_at=datetime.fromisoformat(row["ran_at"])
        )
        for row in response.data
    ]


# ─── Option A: Sync wrappers for APScheduler (runs in background thread) ────
# APScheduler jobs run in a thread, not on the async event loop.
# These thin wrappers call asyncio.run() to bridge sync→async safely.

def sync_get_query(user_id: str, query_id: str) -> Optional[SavedQuery]:
    """Sync wrapper for APScheduler: get a single query."""
    return asyncio.run(get_query(user_id, query_id))


def sync_get_scheduled_queries(user_id: Optional[str] = None) -> list[SavedQuery]:
    """Sync wrapper for APScheduler: get all scheduled queries."""
    return asyncio.run(get_scheduled_queries(user_id))


def sync_increment_run_count(user_id: str, query_id: str) -> Optional[SavedQuery]:
    """Sync wrapper for APScheduler: increment run count."""
    return asyncio.run(increment_run_count(user_id, query_id))


def sync_log_run(
    user_id: str,
    query_id: str,
    success: bool,
    row_count: int = 0,
    execution_time_ms: float = 0.0,
    error: Optional[str] = None,
    triggered_by: str = "scheduler",
) -> QueryRunRecord:
    """Sync wrapper for APScheduler: log a scheduled run."""
    return asyncio.run(log_run(
        user_id=user_id,
        query_id=query_id,
        success=success,
        row_count=row_count,
        execution_time_ms=execution_time_ms,
        error=error,
        triggered_by=triggered_by,
    ))
