from fastapi import APIRouter, HTTPException, Depends
from typing import Optional

from common.models import MessageResponse
from common.auth import get_current_user, User
from dashboard import store
from dashboard.models import AddWidgetRequest, CreateDashboardRequest, Dashboard, DashboardStats, DashboardSummary, DashboardWidget, UpdateWidgetRequest, RenameDashboardRequest
from database import connection_manager
from query_executor.executor import execute_query


router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


# ─── Dashboard CRUD ─────────────────────────────────────────

@router.get("/dashboards", response_model=list[DashboardSummary])
def list_dashboards(current_user: User = Depends(get_current_user)):
    """List all dashboards with widget counts for the current user."""
    return store.list_dashboards(current_user.id)


@router.post("/dashboards", response_model=Dashboard)
def create_dashboard(req: CreateDashboardRequest, current_user: User = Depends(get_current_user)):
    """Create a new dashboard."""
    return store.create_dashboard(current_user.id, req)


@router.patch("/dashboards/{dashboard_id}", response_model=Dashboard)
def rename_dashboard(dashboard_id: str, req: RenameDashboardRequest, current_user: User = Depends(get_current_user)):
    """Rename a dashboard."""
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Name cannot be empty.")
    
    dash = store.rename_dashboard(current_user.id, dashboard_id, req.name)
    if not dash:
        raise HTTPException(status_code=404, detail="Dashboard not found.")
    return dash


@router.delete("/dashboards/{dashboard_id}", response_model=MessageResponse)
def delete_dashboard(dashboard_id: str, current_user: User = Depends(get_current_user)):
    """Delete a dashboard and all its widgets."""
    success = store.delete_dashboard(current_user.id, dashboard_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dashboard not found.")
    return {"message": "Dashboard deleted."}


# ─── Widget CRUD ────────────────────────────────────────────

@router.get("/widgets", response_model=list[DashboardWidget])
def list_widgets(dashboard_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """List all widgets, optionally filtered by dashboard."""
    return store.list_widgets(current_user.id, dashboard_id=dashboard_id)


@router.post("/widgets", response_model=DashboardWidget)
def add_widget(req: AddWidgetRequest, current_user: User = Depends(get_current_user)):
    """Add a widget to a dashboard."""
    user_id = current_user.id
    # Verify dashboard exists and belongs to user
    dash = store.get_dashboard(user_id, req.dashboard_id)
    if not dash:
        raise HTTPException(status_code=404, detail="Dashboard not found.")
    
    return store.add_widget(user_id, req)


@router.delete("/widgets/{widget_id}", response_model=MessageResponse)
def delete_widget(widget_id: str, current_user: User = Depends(get_current_user)):
    """Delete a widget."""
    success = store.delete_widget(current_user.id, widget_id)
    if not success:
        raise HTTPException(status_code=404, detail="Widget not found.")
    return {"message": "Widget deleted."}


@router.patch("/widgets/{widget_id}", response_model=DashboardWidget)
def update_widget(widget_id: str, req: UpdateWidgetRequest, current_user: User = Depends(get_current_user)):
    """Update widget layout and display preferences."""
    widget = store.update_widget(current_user.id, widget_id, req)
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found.")
    return widget


@router.post("/widgets/{widget_id}/refresh", response_model=DashboardWidget)
def refresh_widget(widget_id: str, current_user: User = Depends(get_current_user)):
    """Re-run a widget's SQL and update its rows."""
    user_id = current_user.id
    widget = store.get_widget(user_id, widget_id)
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found.")
    if not widget.sql:
        raise HTTPException(status_code=400, detail="Widget has no SQL to refresh.")
    if not widget.connection_id:
        raise HTTPException(status_code=400, detail="Widget has no connection.")
    
    engine = connection_manager.get_engine(user_id, widget.connection_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Connection not found.")
    
    result = execute_query(
        engine, 
        widget.sql, 
        row_limit=500, 
        connection_id=widget.connection_id,
        readonly=connection_manager.get_readonly(user_id, widget.connection_id)
    )
    
    if not result.success:
        raise HTTPException(status_code=500, detail=result.error or "Query failed.")
    
    # Note: store.update_widget doesn't handle results/rows currently in Supabase.
    # This might need adjustment if we want to persist results.
    req = UpdateWidgetRequest(columns=result.columns, rows=result.rows)
    updated = store.update_widget(user_id, widget_id, req)
    return updated


@router.get("/stats", response_model=DashboardStats)
def get_stats(dashboard_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get dashboard statistics."""
    return store.get_stats(current_user.id, dashboard_id=dashboard_id)
