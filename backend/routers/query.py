from fastapi import APIRouter, HTTPException

from database import connection_manager
from query_executor.models import QueryRequest, QueryResult
from query_executor.executor import execute_query


router = APIRouter(prefix="/api/query", tags=["Query"])


@router.post("/execute", response_model=QueryResult)
def execute_sql_query(request: QueryRequest):
    """Execute a read-only SQL query against a connected database."""
    engine = connection_manager.get_engine(request.connection_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Connection not found. Connect to a database first.")

    return execute_query(
        engine=engine,
        sql=request.sql,
        row_limit=request.row_limit or 500,
        connection_id=request.connection_id,
    )
