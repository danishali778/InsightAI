from fastapi import APIRouter, HTTPException, Body
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
from query_library import scheduler, schema_recommender
from query_executor.executor import execute_query
from common.auth import get_current_user, User
from fastapi import Depends


router = APIRouter(prefix="/api/library", tags=["Query Library"])


@router.get("/queries", response_model=list[SavedQuery])
def list_queries(
    folder: Optional[str] = None, 
    tag: Optional[str] = None, 
    connection_id: Optional[str] = None, 
    recently_run: bool = False,
    current_user: User = Depends(get_current_user)
):
    """List saved queries with optional filters."""
    queries = store.list_queries(
        user_id=current_user.id,
        folder=folder, 
        tag=tag, 
        connection_id=connection_id, 
        recently_run=recently_run
    )
    return [q.model_dump() for q in queries]


@router.post("/queries", response_model=SaveQueryResponse)
def save_query(req: SaveQueryRequest, current_user: User = Depends(get_current_user)):
    """Save a new query to the library. Returns existing query if duplicate SQL found."""
    query, created = store.save_query(current_user.id, req)
    if created and query.schedule and query.schedule.enabled:
        scheduler.register_job(query.id, query.schedule, user_id=current_user.id)
    return {**query.model_dump(), "created": created}


@router.get("/queries/{query_id}", response_model=SavedQuery)
def get_query(query_id: str, current_user: User = Depends(get_current_user)):
    """Get a single saved query."""
    query = store.get_query(current_user.id, query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")
    return query.model_dump()


@router.put("/queries/{query_id}", response_model=SavedQuery)
def update_query(query_id: str, req: UpdateQueryRequest, current_user: User = Depends(get_current_user)):
    """Update an existing saved query."""
    query = store.update_query(current_user.id, query_id, req)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")
    if "schedule" in req.model_dump(exclude_unset=True):
        if query.schedule and query.schedule.enabled:
            scheduler.register_job(query_id, query.schedule, user_id=current_user.id)
        else:
            scheduler.remove_job(query_id)
    return query.model_dump()


@router.delete("/queries/{query_id}", response_model=MessageResponse)
def delete_query(query_id: str, current_user: User = Depends(get_current_user)):
    """Delete a saved query."""
    scheduler.remove_job(query_id)
    success = store.delete_query(current_user.id, query_id)
    if not success:
        raise HTTPException(status_code=404, detail="Query not found.")
    return {"message": "Query deleted."}


@router.post("/queries/{query_id}/run", response_model=RunSavedQueryResponse)
def run_query(query_id: str, current_user: User = Depends(get_current_user)):
    """Execute a saved query and increment its run count."""
    query = store.get_query(current_user.id, query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")

    if not query.connection_id:
        raise HTTPException(status_code=400, detail="No connection_id associated with this query.")

    engine = connection_manager.get_engine(current_user.id, query.connection_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Database connection not found.")

    result = execute_query(engine, query.sql, row_limit=500, connection_id=query.connection_id,
                           readonly=connection_manager.get_readonly(current_user.id, query.connection_id))
    store.increment_run_count(current_user.id, query_id)

    # Log to run history
    store.log_run(
        user_id=current_user.id,
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
def get_run_history(query_id: str, limit: int = 20, current_user: User = Depends(get_current_user)):
    """Get run history for a saved query."""
    query = store.get_query(current_user.id, query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")
    runs = store.get_run_history(current_user.id, query_id, limit=limit)
    return [r.model_dump() for r in runs]


@router.get("/folders", response_model=list[FolderSummary])
def list_folders(current_user: User = Depends(get_current_user)):
    """List all folders with query counts."""
    return store.list_folders(current_user.id)


@router.post("/folders", status_code=201)
def create_folder(name: str = Body(..., embed=True), current_user: User = Depends(get_current_user)):
    """Create a new (possibly empty) folder."""
    name = name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Folder name is required.")
    store.create_folder(current_user.id, name)
    return {"name": name}


@router.get("/tags", response_model=list[str])
def list_tags(current_user: User = Depends(get_current_user)):
    """List all unique tags."""
    return store.list_tags(current_user.id)


@router.get("/stats", response_model=LibraryStats)
def get_stats(current_user: User = Depends(get_current_user)):
    """Get library-wide statistics."""
    return store.get_stats(current_user.id)


# ── Schedule endpoints ────────────────────────────────

@router.get("/queries/{query_id}/schedule", response_model=ScheduleStatusResponse)
def get_schedule(query_id: str, current_user: User = Depends(get_current_user)):
    """Get the schedule configuration for a saved query."""
    query = store.get_query(current_user.id, query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")
    return {
        "query_id": query_id,
        "schedule": query.schedule,
        "schedule_label": query.schedule_label,
        "message": "OK",
    }


@router.put("/queries/{query_id}/schedule", response_model=ScheduleStatusResponse)
def set_schedule(query_id: str, config: ScheduleConfig, current_user: User = Depends(get_current_user)):
    """Create or update the schedule for a saved query."""
    query = store.get_query(current_user.id, query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")
    if not query.connection_id:
        raise HTTPException(status_code=400, detail="Cannot schedule a query without a database connection.")

    updated = store.update_schedule(current_user.id, query_id, config)
    if config.enabled:
        scheduler.register_job(query_id, config, user_id=current_user.id)
    else:
        scheduler.remove_job(query_id)

    return {
        "query_id": query_id,
        "schedule": updated.schedule if updated else None,
        "schedule_label": updated.schedule_label if updated else None,
        "message": "Schedule updated." if config.enabled else "Schedule disabled.",
    }


# ── Public Library endpoints ──────────────────────────

@router.get("/public")
def list_public_templates(connection_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Return AI-generated templates for a connection plus generation status."""
    if not connection_id:
        return {"status": "not_started", "connection_id": None, "templates": []}

    # Verify connection ownership
    if not connection_manager.get_engine(current_user.id, connection_id):
         raise HTTPException(status_code=404, detail="Connection not found.")

    status = schema_recommender.get_status(connection_id)
    templates = schema_recommender.get_templates(connection_id)

    return {
        "status": status,
        "connection_id": connection_id,
        "templates": [
            {
                "id": t.id,
                "connection_id": t.connection_id,
                "title": t.title,
                "description": t.description,
                "sql": t.sql,
                "category": t.category,
                "category_color": t.category_color,
                "tags": t.tags,
                "icon": t.icon,
                "icon_bg": t.icon_bg,
                "difficulty": t.difficulty,
            }
            for t in templates
        ],
    }


@router.post("/public/generate")
def trigger_template_generation(connection_id: str, current_user: User = Depends(get_current_user)):
    """Manually trigger (or re-trigger) template generation for a connection."""
    schema_text = connection_manager.get_schema_for_ai(current_user.id, connection_id)
    if not schema_text:
        raise HTTPException(status_code=404, detail="Connection not found.")
    conn_info = connection_manager.get_all_connections(current_user.id)
    db_type = next((c["db_type"] for c in conn_info if c["id"] == connection_id), "postgresql")
    schema_recommender.generate_in_background(connection_id, schema_text, db_type)
    return {"message": "Template generation started.", "connection_id": connection_id}


@router.post("/public/{template_id}/clone", response_model=SaveQueryResponse)
def clone_public_template(template_id: str, connection_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Clone an AI-generated template into the user's query library."""
    template = schema_recommender.get_template_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found.")
    
    # Verify target connection ownership if provided
    if connection_id and not connection_manager.get_engine(current_user.id, connection_id):
         raise HTTPException(status_code=404, detail="Target connection not found.")

    req = SaveQueryRequest(
        title=template.title,
        sql=template.sql,
        description=template.description,
        folder_name="Uncategorized",
        connection_id=connection_id or template.connection_id,
        icon=template.icon,
        icon_bg=template.icon_bg,
        tags=template.tags,
    )
    query, created = store.save_query(current_user.id, req)
    return {**query.model_dump(), "created": created}


@router.delete("/queries/{query_id}/schedule", response_model=ScheduleStatusResponse)
def remove_schedule(query_id: str, current_user: User = Depends(get_current_user)):
    """Remove the schedule from a saved query."""
    query = store.get_query(current_user.id, query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")

    store.update_schedule(current_user.id, query_id, None)
    scheduler.remove_job(query_id)

    return {
        "query_id": query_id,
        "schedule": None,
        "schedule_label": None,
        "message": "Schedule removed.",
    }
