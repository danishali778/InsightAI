from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import anyio

from common.models import MessageResponse
from common.auth import get_current_user, User
from dashboard import store
from dashboard.models import (
    AddWidgetRequest, CreateDashboardRequest, Dashboard, DashboardStats, 
    DashboardSummary, DashboardWidget, UpdateWidgetRequest, 
    RenameDashboardRequest, UpdateDashboardRequest
)
from database import connection_manager
from query_executor.executor import execute_query
from dashboard.insight_agent import generate_widget_insight


router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

def apply_global_filters(sql: str, filters: dict) -> str:
    """Wrap SQL in a CTE and apply global filters."""
    if not filters: return sql
    clean_sql = sql.strip().rstrip(';')
    wrapped = f"WITH __user_query AS (\n{clean_sql}\n)\nSELECT * FROM __user_query WHERE 1=1"
    
    date_range = filters.get("date_range")
    if date_range and date_range != "all":
        try:
            days = int(date_range)
            wrapped += f" AND created_at >= NOW() - INTERVAL '{days} days'"
        except: pass
        
    status = filters.get("status")
    if status: wrapped += f" AND status = '{status}'"
        
    limit = filters.get("limit")
    if limit:
        try:
            limit_val = int(limit)
            wrapped += f" LIMIT {limit_val}"
        except: pass
        
    return wrapped


# ─── Dashboard CRUD ─────────────────────────────────────────

@router.get("/dashboards", response_model=list[DashboardSummary])
async def list_dashboards(current_user: User = Depends(get_current_user)):
    return await store.list_dashboards(current_user.id)


@router.post("/dashboards", response_model=Dashboard)
async def create_dashboard(req: CreateDashboardRequest, current_user: User = Depends(get_current_user)):
    return await store.create_dashboard(current_user.id, req)


@router.patch("/dashboards/{dashboard_id}", response_model=Dashboard)
async def rename_dashboard(dashboard_id: str, req: RenameDashboardRequest, current_user: User = Depends(get_current_user)):
    if not req.name.strip(): raise HTTPException(status_code=400, detail="Name required.")
    dash = await store.rename_dashboard(current_user.id, dashboard_id, req.name)
    if not dash: raise HTTPException(status_code=404, detail="Dashboard not found.")
    return dash


@router.patch("/dashboards/{dashboard_id}/update", response_model=Dashboard)
async def update_dashboard(dashboard_id: str, req: UpdateDashboardRequest, current_user: User = Depends(get_current_user)):
    dash = await store.update_dashboard(current_user.id, dashboard_id, req)
    if not dash: raise HTTPException(status_code=404, detail="Dashboard not found.")
    return dash


@router.delete("/dashboards/{dashboard_id}", response_model=MessageResponse)
async def delete_dashboard(dashboard_id: str, current_user: User = Depends(get_current_user)):
    success = await store.delete_dashboard(current_user.id, dashboard_id)
    if not success: raise HTTPException(status_code=404, detail="Dashboard not found.")
    return {"message": "Dashboard deleted."}


# ─── Widget CRUD ────────────────────────────────────────────

@router.get("/widgets", response_model=list[DashboardWidget])
async def list_widgets(dashboard_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    return await store.list_widgets(current_user.id, dashboard_id=dashboard_id)


@router.post("/widgets", response_model=DashboardWidget)
async def add_widget(req: AddWidgetRequest, current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    dash = await store.get_dashboard(user_id, req.dashboard_id)
    if not dash: raise HTTPException(status_code=404, detail="Dashboard not found.")
    return await store.add_widget(user_id, req)


@router.delete("/widgets/{widget_id}", response_model=MessageResponse)
async def delete_widget(widget_id: str, current_user: User = Depends(get_current_user)):
    success = await store.delete_widget(current_user.id, widget_id)
    if not success: raise HTTPException(status_code=404, detail="Widget not found.")
    return {"message": "Widget deleted."}


@router.patch("/widgets/{widget_id}", response_model=DashboardWidget)
async def update_widget(widget_id: str, req: UpdateWidgetRequest, current_user: User = Depends(get_current_user)):
    widget = await store.update_widget(current_user.id, widget_id, req)
    if not widget: raise HTTPException(status_code=404, detail="Widget not found.")
    return widget


@router.post("/widgets/{widget_id}/refresh", response_model=DashboardWidget)
async def refresh_widget(widget_id: str, current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    widget = await store.get_widget(user_id, widget_id)
    if not widget or not widget.sql or not widget.connection_id:
        raise HTTPException(status_code=400, detail="Invalid widget for refresh.")
    
    engine = await connection_manager.get_engine(user_id, widget.connection_id)
    if not engine: raise HTTPException(status_code=404, detail="Connection not found.")
    
    dash = await store.get_dashboard(user_id, widget.dashboard_id)
    final_sql = apply_global_filters(widget.sql, dash.filters if dash else {})

    readonly = await connection_manager.get_readonly(user_id, widget.connection_id)
    
    # Run sync DB query in thread pool
    result = await anyio.to_thread.run_sync(
        execute_query, user_id, engine, final_sql, 500, widget.connection_id, readonly
    )
    
    if not result.success: raise HTTPException(status_code=500, detail=result.error)
    
    req = UpdateWidgetRequest(columns=result.columns, rows=result.rows)
    return await store.update_widget(user_id, widget_id, req)


@router.post("/widgets/{widget_id}/insight", response_model=dict)
async def get_widget_insight_route(widget_id: str, current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    widget = await store.get_widget(user_id, widget_id)
    if not widget: raise HTTPException(status_code=404, detail="Widget not found.")
    
    dash = await store.get_dashboard(user_id, widget.dashboard_id)
    insight = await generate_widget_insight(widget.title, widget.viz_type, widget.rows, dash.filters if dash else {})
    return {"insight": insight}


@router.get("/stats", response_model=DashboardStats)
async def get_stats(dashboard_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    return await store.get_stats(current_user.id, dashboard_id=dashboard_id)


# ─── Public Sharing ─────────────────────────────────────────

@router.get("/shared/{share_token}", response_model=Dashboard)
async def get_public_dashboard(share_token: str):
    dash = await store.get_shared_dashboard(share_token)
    if not dash: raise HTTPException(status_code=404, detail="Not found.")
    return dash


@router.get("/shared/{share_token}/widgets", response_model=list[DashboardWidget])
async def get_public_dashboard_widgets(share_token: str):
    dash = await store.get_shared_dashboard(share_token)
    if not dash: raise HTTPException(status_code=404, detail="Not found.")
    return await store.get_shared_widgets(dash.id)
