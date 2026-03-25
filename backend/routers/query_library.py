from fastapi import APIRouter, HTTPException
from typing import Optional

from query_library import store
from query_library.models import SaveQueryRequest, UpdateQueryRequest
from database import connection_manager
from query_executor.executor import execute_query


router = APIRouter(prefix="/api/library", tags=["Query Library"])


@router.get("/queries")
def list_queries(folder: Optional[str] = None, tag: Optional[str] = None, connection_id: Optional[str] = None, recently_run: bool = False):
    """List saved queries with optional filters."""
    queries = store.list_queries(folder=folder, tag=tag, connection_id=connection_id, recently_run=recently_run)
    return [q.model_dump() for q in queries]


@router.post("/queries")
def save_query(req: SaveQueryRequest):
    """Save a new query to the library. Returns existing query if duplicate SQL found."""
    query, created = store.save_query(req)
    return {**query.model_dump(), "created": created}


@router.get("/queries/{query_id}")
def get_query(query_id: str):
    """Get a single saved query."""
    query = store.get_query(query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")
    return query.model_dump()


@router.put("/queries/{query_id}")
def update_query(query_id: str, req: UpdateQueryRequest):
    """Update an existing saved query."""
    query = store.update_query(query_id, req)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")
    return query.model_dump()


@router.delete("/queries/{query_id}")
def delete_query(query_id: str):
    """Delete a saved query."""
    success = store.delete_query(query_id)
    if not success:
        raise HTTPException(status_code=404, detail="Query not found.")
    return {"message": "Query deleted."}


@router.post("/queries/{query_id}/run")
def run_query(query_id: str):
    """Execute a saved query and increment its run count."""
    query = store.get_query(query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")

    if not query.connection_id:
        raise HTTPException(status_code=400, detail="No connection_id associated with this query.")

    engine = connection_manager.get_engine(query.connection_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Database connection not found.")

    result = execute_query(engine, query.sql, row_limit=500, connection_id=query.connection_id)
    store.increment_run_count(query_id)

    return {
        "query_id": query_id,
        "success": result.success,
        "columns": result.columns,
        "rows": result.rows,
        "row_count": result.row_count,
        "execution_time_ms": result.execution_time_ms,
        "error": result.error,
    }


@router.get("/folders")
def list_folders():
    """List all folders with query counts."""
    return store.list_folders()


@router.get("/tags")
def list_tags():
    """List all unique tags."""
    return store.list_tags()


@router.get("/stats")
def get_stats():
    """Get library-wide statistics."""
    return store.get_stats()
