from fastapi import APIRouter, HTTPException, Depends
import anyio

from common.auth import get_current_user, User
from database import connection_manager
from query_executor.models import QueryRequest, QueryResult
from query_executor.executor import execute_query
from common.rate_limit import RateLimitChecker


router = APIRouter(prefix="/api/query", tags=["Query"])


@router.post("/execute", response_model=QueryResult)
async def execute_sql_query(
    request: QueryRequest, 
    current_user: User = Depends(get_current_user),
    _: User = Depends(RateLimitChecker("query"))
):
    """Execute a read-only SQL query asynchronously."""
    user_id = current_user.id
    engine = await connection_manager.get_engine(user_id, request.connection_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Connection not found.")

    readonly = await connection_manager.get_readonly(user_id, request.connection_id)

    # Offload sync query execution to thread pool
    return await anyio.to_thread.run_sync(
        execute_query,
        user_id,
        engine,
        request.sql,
        request.row_limit or 500,
        request.connection_id,
        readonly
    )
