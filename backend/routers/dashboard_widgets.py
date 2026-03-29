from fastapi import APIRouter, HTTPException
from typing import Optional

from common.models import MessageResponse
from dashboard import store
from dashboard.models import AddWidgetRequest, CreateDashboardRequest, Dashboard, DashboardStats, DashboardSummary, DashboardWidget, UpdateWidgetRequest, RenameDashboardRequest
from database import connection_manager
from query_executor.executor import execute_query


router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


# ─── Dashboard CRUD ─────────────────────────────────────────

@router.get("/dashboards", response_model=list[DashboardSummary])
def list_dashboards():
    """List all dashboards with widget counts."""
    return store.list_dashboards()


@router.post("/dashboards", response_model=Dashboard)
def create_dashboard(req: CreateDashboardRequest):
    """Create a new dashboard."""
    dash = store.create_dashboard(req)
    return dash.model_dump()


@router.patch("/dashboards/{dashboard_id}", response_model=Dashboard)
def rename_dashboard(dashboard_id: str, req: RenameDashboardRequest):
    """Rename a dashboard."""
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Name cannot be empty.")
    dash = store.rename_dashboard(dashboard_id, req.name)
    if not dash:
        raise HTTPException(status_code=404, detail="Dashboard not found.")
    return dash.model_dump()


@router.delete("/dashboards/{dashboard_id}", response_model=MessageResponse)
def delete_dashboard(dashboard_id: str):
    """Delete a dashboard and all its widgets."""
    success = store.delete_dashboard(dashboard_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dashboard not found.")
    return {"message": "Dashboard deleted."}


# ─── Widget CRUD ────────────────────────────────────────────

@router.get("/widgets", response_model=list[DashboardWidget])
def list_widgets(dashboard_id: Optional[str] = None):
    """List all widgets, optionally filtered by dashboard."""
    widgets = store.list_widgets(dashboard_id=dashboard_id)
    return [w.model_dump() for w in widgets]


@router.post("/widgets", response_model=DashboardWidget)
def add_widget(req: AddWidgetRequest):
    """Add a widget to a dashboard."""
    # Verify dashboard exists
    dash = store.get_dashboard(req.dashboard_id)
    if not dash:
        raise HTTPException(status_code=404, detail="Dashboard not found.")
    widget = store.add_widget(req)
    return widget.model_dump()


@router.delete("/widgets/{widget_id}", response_model=MessageResponse)
def delete_widget(widget_id: str):
    """Delete a widget."""
    success = store.delete_widget(widget_id)
    if not success:
        raise HTTPException(status_code=404, detail="Widget not found.")
    return {"message": "Widget deleted."}


@router.patch("/widgets/{widget_id}", response_model=DashboardWidget)
def update_widget(widget_id: str, req: UpdateWidgetRequest):
    """Update widget layout and display preferences."""
    widget = store.update_widget(widget_id, req)
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found.")
    return widget.model_dump()


@router.post("/widgets/{widget_id}/refresh", response_model=DashboardWidget)
def refresh_widget(widget_id: str):
    """Re-run a widget's SQL and update its rows."""
    widget = store.get_widget(widget_id)
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found.")
    if not widget.sql:
        raise HTTPException(status_code=400, detail="Widget has no SQL to refresh.")
    if not widget.connection_id:
        raise HTTPException(status_code=400, detail="Widget has no connection.")
    engine = connection_manager.get_engine(widget.connection_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Connection not found.")
    result = execute_query(engine, widget.sql, row_limit=500, connection_id=widget.connection_id)
    if not result.success:
        raise HTTPException(status_code=500, detail=result.error or "Query failed.")
    req = UpdateWidgetRequest(columns=result.columns, rows=result.rows)
    updated = store.update_widget(widget_id, req)
    return updated.model_dump()


@router.get("/stats", response_model=DashboardStats)
def get_stats(dashboard_id: Optional[str] = None):
    """Get dashboard statistics."""
    return store.get_stats(dashboard_id=dashboard_id)
