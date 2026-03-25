from fastapi import APIRouter, HTTPException
from typing import Optional

from dashboard import store
from dashboard.models import AddWidgetRequest, CreateDashboardRequest


router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


# ─── Dashboard CRUD ─────────────────────────────────────────

@router.get("/dashboards")
def list_dashboards():
    """List all dashboards with widget counts."""
    return store.list_dashboards()


@router.post("/dashboards")
def create_dashboard(req: CreateDashboardRequest):
    """Create a new dashboard."""
    dash = store.create_dashboard(req)
    return dash.model_dump()


@router.delete("/dashboards/{dashboard_id}")
def delete_dashboard(dashboard_id: str):
    """Delete a dashboard and all its widgets."""
    success = store.delete_dashboard(dashboard_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dashboard not found.")
    return {"message": "Dashboard deleted."}


# ─── Widget CRUD ────────────────────────────────────────────

@router.get("/widgets")
def list_widgets(dashboard_id: Optional[str] = None):
    """List all widgets, optionally filtered by dashboard."""
    widgets = store.list_widgets(dashboard_id=dashboard_id)
    return [w.model_dump() for w in widgets]


@router.post("/widgets")
def add_widget(req: AddWidgetRequest):
    """Add a widget to a dashboard."""
    # Verify dashboard exists
    dash = store.get_dashboard(req.dashboard_id)
    if not dash:
        raise HTTPException(status_code=404, detail="Dashboard not found.")
    widget = store.add_widget(req)
    return widget.model_dump()


@router.delete("/widgets/{widget_id}")
def delete_widget(widget_id: str):
    """Delete a widget."""
    success = store.delete_widget(widget_id)
    if not success:
        raise HTTPException(status_code=404, detail="Widget not found.")
    return {"message": "Widget deleted."}


@router.get("/stats")
def get_stats(dashboard_id: Optional[str] = None):
    """Get dashboard statistics."""
    return store.get_stats(dashboard_id=dashboard_id)
