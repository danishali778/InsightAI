from fastapi import APIRouter, Depends
from typing import Optional

from common.auth import get_current_user, User
from query_history.models import QueryRecord, QueryStats
from query_history import store


router = APIRouter(prefix="/api/query-history", tags=["Query History"])


@router.get("", response_model=list[QueryRecord])
def get_query_history(
    connection_id: Optional[str] = None, 
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    """Get recent query history, optionally filtered by connection."""
    records = store.get_history(user_id=current_user.id, connection_id=connection_id, limit=limit)
    return [r.model_dump() for r in records]


@router.get("/stats", response_model=QueryStats)
def get_query_stats(connection_id: str, current_user: User = Depends(get_current_user)):
    """Get query stats for a specific connection."""
    return store.get_stats(user_id=current_user.id, connection_id=connection_id)
