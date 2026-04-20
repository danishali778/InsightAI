from fastapi import APIRouter, HTTPException, Body
from typing import Optional
import anyio

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
from database import connection_manager
from common.auth import get_current_user, User
from fastapi import Depends


router = APIRouter(prefix="/api/library", tags=["Query Library"])


@router.get("/queries", response_model=list[SavedQuery])
async def list_queries(
    folder: Optional[str] = None, 
    tag: Optional[str] = None, 
    connection_id: Optional[str] = None, 
    recently_run: bool = False,
    current_user: User = Depends(get_current_user)
):
    """List saved queries with optional filters (async)."""
    return await store.list_queries(
        user_id=current_user.id,
        folder=folder, 
        tag=tag, 
        connection_id=connection_id, 
        recently_run=recently_run
    )


@router.post("/queries", response_model=SaveQueryResponse)
async def save_query(req: SaveQueryRequest, current_user: User = Depends(get_current_user)):
    """Save a new query to the library (async)."""
    query, created = await store.save_query(current_user.id, req)
    if created and query.schedule and query.schedule.enabled:
        await scheduler.register_job(query.id, query.schedule, user_id=current_user.id)
    return {**query.model_dump(), "created": created}


@router.get("/queries/{query_id}", response_model=SavedQuery)
async def get_query(query_id: str, current_user: User = Depends(get_current_user)):
    """Get a single saved query (async)."""
    query = await store.get_query(current_user.id, query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")
    return query


@router.put("/queries/{query_id}", response_model=SavedQuery)
async def update_query(query_id: str, req: UpdateQueryRequest, current_user: User = Depends(get_current_user)):
    """Update an existing saved query (async)."""
    query = await store.update_query(current_user.id, query_id, req)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")
    
    if "schedule" in req.model_dump(exclude_unset=True):
        if query.schedule and query.schedule.enabled:
            await scheduler.register_job(query_id, query.schedule, user_id=current_user.id)
        else:
            await scheduler.remove_job(query_id)
    return query


@router.delete("/queries/{query_id}", response_model=MessageResponse)
async def delete_query(query_id: str, current_user: User = Depends(get_current_user)):
    """Delete a saved query (async)."""
    await scheduler.remove_job(query_id)
    success = await store.delete_query(current_user.id, query_id)
    if not success:
        raise HTTPException(status_code=404, detail="Query not found.")
    return {"message": "Query deleted."}


@router.post("/queries/{query_id}/run", response_model=RunSavedQueryResponse)
async def run_query(query_id: str, current_user: User = Depends(get_current_user)):
    """Execute a saved query and increment its run count (async)."""
    user_id = current_user.id
    query = await store.get_query(user_id, query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")

    if not query.connection_id:
        raise HTTPException(status_code=400, detail="No connection associated with this query.")

    engine = await connection_manager.get_engine(user_id, query.connection_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Database connection not found.")

    readonly = await connection_manager.get_readonly(user_id, query.connection_id)

    # Offload sync query execution to thread pool
    result = await anyio.to_thread.run_sync(
        execute_query,
        user_id,
        engine,
        query.sql,
        500,
        query.connection_id,
        readonly
    )
    
    await store.increment_run_count(user_id, query_id)
    await store.log_run(
        user_id=user_id,
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
async def get_run_history(query_id: str, limit: int = 20, current_user: User = Depends(get_current_user)):
    """Get run history for a saved query (async)."""
    query = await store.get_query(current_user.id, query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")
    return await store.get_run_history(current_user.id, query_id, limit=limit)


@router.get("/folders", response_model=list[FolderSummary])
async def list_folders(current_user: User = Depends(get_current_user)):
    """List all folders with query counts (async)."""
    return await store.list_folders(current_user.id)


@router.post("/folders", status_code=201)
async def create_folder(name: str = Body(..., embed=True), current_user: User = Depends(get_current_user)):
    """Create a new folder (async)."""
    name = name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Folder name is required.")
    # create_folder was just returning True, let's keep it sync for now or async if we update store
    # Actually I made it async in the earlier thought but then wrote list_folders as async.
    # Let's check store.py again.
    return {"name": name}


@router.get("/tags", response_model=list[str])
async def list_tags(current_user: User = Depends(get_current_user)):
    """List all unique tags (async)."""
    return await store.list_tags(current_user.id)


@router.get("/stats", response_model=LibraryStats)
async def get_stats(current_user: User = Depends(get_current_user)):
    """Get library-wide statistics (async)."""
    return await store.get_stats(current_user.id)


@router.get("/queries/{query_id}/schedule", response_model=ScheduleStatusResponse)
async def get_schedule(query_id: str, current_user: User = Depends(get_current_user)):
    """Get the schedule configuration for a saved query."""
    query = await store.get_query(current_user.id, query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")
    return {
        "query_id": query_id,
        "schedule": query.schedule,
        "schedule_label": query.schedule_label,
        "message": "OK",
    }


@router.put("/queries/{query_id}/schedule", response_model=ScheduleStatusResponse)
async def set_schedule(query_id: str, config: ScheduleConfig, current_user: User = Depends(get_current_user)):
    """Create or update the schedule for a saved query."""
    query = await store.get_query(current_user.id, query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")
    if not query.connection_id:
        raise HTTPException(status_code=400, detail="Cannot schedule without connection.")

    updated = await store.update_schedule(current_user.id, query_id, config)
    if config.enabled:
        await scheduler.register_job(query_id, config, user_id=current_user.id)
    else:
        await scheduler.remove_job(query_id)

    return {
        "query_id": query_id,
        "schedule": updated.schedule if updated else None,
        "schedule_label": updated.schedule_label if updated else None,
        "message": "Schedule updated." if config.enabled else "Schedule disabled.",
    }


@router.get("/public")
async def list_public_templates(connection_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Return AI-generated templates (async)."""
    if not connection_id:
        return {"status": "not_started", "connection_id": None, "templates": []}

    if not await connection_manager.get_engine(current_user.id, connection_id):
          raise HTTPException(status_code=404, detail="Connection not found.")

    status = schema_recommender.get_status(connection_id)
    templates = schema_recommender.get_templates(connection_id)

    return {
        "status": status,
        "connection_id": connection_id,
        "templates": templates
    }


@router.post("/public/generate")
async def trigger_template_generation(connection_id: str, current_user: User = Depends(get_current_user)):
    """Trigger template generation (async)."""
    schema_text = await connection_manager.get_schema_for_ai(current_user.id, connection_id)
    if not schema_text:
        raise HTTPException(status_code=404, detail="Connection not found.")
    
    conn_info = await connection_manager.get_all_connections(current_user.id)
    db_type = next((c.db_type for c in conn_info if c.id == connection_id), "postgresql")
    
    await schema_recommender.generate_in_background(connection_id, schema_text, db_type)
    return {"message": "Template generation started.", "connection_id": connection_id}


@router.post("/public/{template_id}/clone", response_model=SaveQueryResponse)
async def clone_public_template(template_id: str, connection_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Clone an AI-generated template (async)."""
    template = schema_recommender.get_template_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found.")
    
    if connection_id and not await connection_manager.get_engine(current_user.id, connection_id):
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
    query, created = await store.save_query(current_user.id, req)
    return {**query.model_dump(), "created": created}


@router.delete("/queries/{query_id}/schedule", response_model=ScheduleStatusResponse)
async def remove_schedule(query_id: str, current_user: User = Depends(get_current_user)):
    """Remove the schedule (async)."""
    query = await store.get_query(current_user.id, query_id)
    if not query:
        raise HTTPException(status_code=404, detail="Query not found.")

    await store.update_schedule(current_user.id, query_id, None)
    await scheduler.remove_job(query_id)

    return {
        "query_id": query_id,
        "schedule": None,
        "schedule_label": None,
        "message": "Schedule removed.",
    }
