from fastapi import APIRouter, HTTPException
from typing import Optional

from common.models import MessageResponse
from query_library import store
from query_library.models import (
    FolderSummary,
    LibraryStats,
    QueryRunRecord,
    RunSavedQueryResponse,
    SaveQueryRequest,
    SaveQueryResponse,
    SavedQuery,
    ScheduleConfig,
    ScheduleStatusResponse,
    UpdateQueryRequest,
)
from query_library import scheduler
from database import connection_manager
from query_executor.executor import execute_query


router = APIRouter(prefix="/api/library", tags=["Query Library"])


@router.get("/queries", response_model=list[SavedQuery])
def list_queries(folder: Optional[str] = None, tag: Optional[str] = None, connection_id: Optional[str] = None, recently_run: bool = False):
    """List saved queries with optional filters."""
    queries = store.list_queries(folder=folder, tag=tag, connection_id=connection_id, recently_run=recently_run)
    return [q.model_dump() for q in queries]


@router.post("/queries", response_model=SaveQueryResponse)
def save_query(req: SaveQueryRequest):
    """Save a new query to the library. Returns existing query if duplicate SQL found."""
    query, created = store.save_query(req)
    if created and query.schedule and query.schedule.enabled:
        scheduler.register_job(query.id, query.schedule)
    return {**query.model_dump(), "created": created}


@router.get("/queries/{query_id}", response_model=SavedQuery)
def get_query(query_id: str):
    """Get a single saved query."""
    query = store.get_query(query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")
    return query.model_dump()


@router.put("/queries/{query_id}", response_model=SavedQuery)
def update_query(query_id: str, req: UpdateQueryRequest):
    """Update an existing saved query."""
    query = store.update_query(query_id, req)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")
    if "schedule" in req.model_dump(exclude_unset=True):
        if query.schedule and query.schedule.enabled:
            scheduler.register_job(query_id, query.schedule)
        else:
            scheduler.remove_job(query_id)
    return query.model_dump()


@router.delete("/queries/{query_id}", response_model=MessageResponse)
def delete_query(query_id: str):
    """Delete a saved query."""
    scheduler.remove_job(query_id)
    success = store.delete_query(query_id)
    if not success:
        raise HTTPException(status_code=404, detail="Query not found.")
    return {"message": "Query deleted."}


@router.post("/queries/{query_id}/run", response_model=RunSavedQueryResponse)
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

    # Log to run history
    store.log_run(
        query_id=query_id,
        success=result.success,
        row_count=result.row_count,
        execution_time_ms=result.execution_time_ms,
        error=result.error,
    )

    return {
        "query_id": query_id,
        "success": result.success,
        "columns": result.columns,
        "rows": result.rows,
        "row_count": result.row_count,
        "execution_time_ms": result.execution_time_ms,
        "error": result.error,
    }


@router.get("/queries/{query_id}/runs", response_model=list[QueryRunRecord])
def get_run_history(query_id: str, limit: int = 20):
    """Get run history for a saved query."""
    query = store.get_query(query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")
    runs = store.get_run_history(query_id, limit=limit)
    return [r.model_dump() for r in runs]


@router.get("/folders", response_model=list[FolderSummary])
def list_folders():
    """List all folders with query counts."""
    return store.list_folders()


@router.get("/tags", response_model=list[str])
def list_tags():
    """List all unique tags."""
    return store.list_tags()


@router.get("/stats", response_model=LibraryStats)
def get_stats():
    """Get library-wide statistics."""
    return store.get_stats()


# ── Schedule endpoints ────────────────────────────────

@router.get("/queries/{query_id}/schedule", response_model=ScheduleStatusResponse)
def get_schedule(query_id: str):
    """Get the schedule configuration for a saved query."""
    query = store.get_query(query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")
    return {
        "query_id": query_id,
        "schedule": query.schedule,
        "schedule_label": query.schedule_label,
        "message": "OK",
    }


@router.put("/queries/{query_id}/schedule", response_model=ScheduleStatusResponse)
def set_schedule(query_id: str, config: ScheduleConfig):
    """Create or update the schedule for a saved query."""
    query = store.get_query(query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")
    if not query.connection_id:
        raise HTTPException(status_code=400, detail="Cannot schedule a query without a database connection.")

    updated = store.update_schedule(query_id, config)
    if config.enabled:
        scheduler.register_job(query_id, config)
    else:
        scheduler.remove_job(query_id)

    return {
        "query_id": query_id,
        "schedule": updated.schedule if updated else None,
        "schedule_label": updated.schedule_label if updated else None,
        "message": "Schedule updated." if config.enabled else "Schedule disabled.",
    }


@router.delete("/queries/{query_id}/schedule", response_model=ScheduleStatusResponse)
def remove_schedule(query_id: str):
    """Remove the schedule from a saved query."""
    query = store.get_query(query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")

    store.update_schedule(query_id, None)
    scheduler.remove_job(query_id)

    return {
        "query_id": query_id,
        "schedule": None,
        "schedule_label": None,
        "message": "Schedule removed.",
    }
