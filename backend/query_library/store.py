import uuid
from datetime import datetime, timezone
from typing import Optional
from .models import SavedQuery, SaveQueryRequest, UpdateQueryRequest


# In-memory store
_queries: dict[str, SavedQuery] = {}


def _normalize_sql(sql: str) -> str:
    """Normalize SQL for duplicate comparison."""
    return " ".join(sql.strip().lower().split())


def find_duplicate(sql: str, connection_id: Optional[str] = None) -> Optional[SavedQuery]:
    """Check if a query with the same SQL already exists."""
    normalized = _normalize_sql(sql)
    for q in _queries.values():
        if _normalize_sql(q.sql) == normalized and q.connection_id == connection_id:
            return q
    return None


def save_query(req: SaveQueryRequest) -> tuple[SavedQuery, bool]:
    """Create a new saved query. Returns (query, created).
    If a duplicate SQL exists for the same connection, returns the existing one."""
    existing = find_duplicate(req.sql, req.connection_id)
    if existing:
        return existing, False

    now = datetime.now(timezone.utc)
    query = SavedQuery(
        id=str(uuid.uuid4())[:8],
        title=req.title,
        sql=req.sql,
        description=req.description,
        folder_name=req.folder_name,
        connection_id=req.connection_id,
        icon=req.icon,
        icon_bg=req.icon_bg,
        tags=req.tags,
        schedule=req.schedule,
        created_at=now,
        updated_at=now,
    )
    _queries[query.id] = query
    return query, True


def get_query(query_id: str) -> Optional[SavedQuery]:
    """Get a single saved query by ID."""
    return _queries.get(query_id)


def list_queries(
    folder: Optional[str] = None,
    tag: Optional[str] = None,
    connection_id: Optional[str] = None,
    recently_run: bool = False,
) -> list[SavedQuery]:
    """List all saved queries, with optional filters."""
    result = list(_queries.values())

    if folder and folder not in ("All Queries", "Recently Run", "Scheduled"):
        result = [q for q in result if q.folder_name == folder]
    if recently_run or folder == "Recently Run":
        result = [q for q in result if q.last_run_at is not None]
        result.sort(key=lambda q: q.last_run_at, reverse=True)  # type: ignore
        return result
    if folder == "Scheduled":
        result = [q for q in result if q.schedule]
    if tag:
        result = [q for q in result if tag in q.tags]
    if connection_id:
        result = [q for q in result if q.connection_id == connection_id]

    # Sort by most recently updated
    result.sort(key=lambda q: q.updated_at, reverse=True)
    return result


def update_query(query_id: str, req: UpdateQueryRequest) -> Optional[SavedQuery]:
    """Update an existing saved query (partial update)."""
    query = _queries.get(query_id)
    if not query:
        return None

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(query, field, value)
    query.updated_at = datetime.now(timezone.utc)
    _queries[query_id] = query
    return query


def delete_query(query_id: str) -> bool:
    """Delete a saved query."""
    if query_id in _queries:
        del _queries[query_id]
        return True
    return False


def increment_run_count(query_id: str) -> Optional[SavedQuery]:
    """Bump run count and update last_run_at."""
    query = _queries.get(query_id)
    if not query:
        return None
    query.run_count += 1
    query.last_run_at = datetime.now(timezone.utc)
    query.updated_at = query.last_run_at
    _queries[query_id] = query
    return query


def list_folders() -> list[dict]:
    """Get unique folder names with counts."""
    folders: dict[str, int] = {}
    for q in _queries.values():
        folders[q.folder_name] = folders.get(q.folder_name, 0) + 1
    return [{"name": name, "count": count} for name, count in sorted(folders.items())]


def list_tags() -> list[str]:
    """Get all unique tags across saved queries."""
    tags: set[str] = set()
    for q in _queries.values():
        tags.update(q.tags)
    return sorted(tags)


def get_stats() -> dict:
    """Get library-wide statistics."""
    queries = list(_queries.values())
    total = len(queries)
    scheduled = len([q for q in queries if q.schedule])
    total_runs = sum(q.run_count for q in queries)

    return {
        "total_queries": total,
        "scheduled": scheduled,
        "total_runs": total_runs,
        "recently_run": len([q for q in queries if q.last_run_at]),
        "folders": len(set(q.folder_name for q in queries)),
    }
