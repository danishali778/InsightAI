from fastapi import APIRouter
from typing import Optional

from app.api.deps import CurrentUserDep
from app.api.v1.schemas.query_history import QueryRecord, QueryStats
from app.services import query_history_service as store


router = APIRouter(prefix="/api/query-history", tags=["Query History"])


@router.get("", response_model=list[QueryRecord])
def get_query_history(
    current_user: CurrentUserDep,
    connection_id: Optional[str] = None, 
    limit: int = 20,
):
    """Get recent query history, optionally filtered by connection."""
    records = store.list_history(user_id=current_user.id, connection_id=connection_id, limit=limit)
    return [r.model_dump() for r in records]


@router.get("/stats", response_model=QueryStats)
def get_query_stats(connection_id: str, current_user: CurrentUserDep):
    """Get query stats for a specific connection."""
    return store.get_connection_stats(user_id=current_user.id, connection_id=connection_id)
