from fastapi import APIRouter
from typing import Optional

from query_history.models import QueryRecord, QueryStats
from query_history import store


router = APIRouter(prefix="/api/query-history", tags=["Query History"])


@router.get("", response_model=list[QueryRecord])
def get_query_history(connection_id: Optional[str] = None, limit: int = 20):
    """Get recent query history, optionally filtered by connection."""
    records = store.get_history(connection_id=connection_id, limit=limit)
    return [r.model_dump() for r in records]


@router.get("/stats", response_model=QueryStats)
def get_query_stats(connection_id: str):
    """Get query stats for a specific connection."""
    return store.get_stats(connection_id)
