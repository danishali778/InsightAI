from fastapi import APIRouter, HTTPException, Depends
from typing import Optional

from common.models import MessageResponse
from common.auth import get_current_user, User
from dashboard import store
from dashboard.models import AddWidgetRequest, CreateDashboardRequest, Dashboard, DashboardStats, DashboardSummary, DashboardWidget, UpdateWidgetRequest, RenameDashboardRequest, UpdateDashboardRequest
from database import connection_manager
from query_executor.executor import execute_query
from dashboard.insight_agent import generate_widget_insight


router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

def apply_global_filters(sql: str, filters: dict) -> str:
    """Wrap SQL in a CTE and apply global filters."""
    if not filters:
        return sql
    
    # Basic validation for the wrap
    clean_sql = sql.strip().rstrip(';')
    
    # We use a CTE to ensure we can apply filters even on complex queries
    wrapped = f"WITH __user_query AS (\n{clean_sql}\n)\nSELECT * FROM __user_query WHERE 1=1"
    
    # 1. Date Range Filter (assumes created_at column)
    date_range = filters.get("date_range")
    if date_range and date_range != "all":
        try:
            days = int(date_range)
            wrapped += f" AND created_at >= NOW() - INTERVAL '{days} days'"
        except: pass
        
    # 2. Status Filter (assumes status column)
    status = filters.get("status")
    if status:
        wrapped += f" AND status = '{status}'"
        
    # 3. Limit Filter
    limit = filters.get("limit")
    if limit:
        try:
            limit_val = int(limit)
            wrapped += f" LIMIT {limit_val}"
        except: pass
        
    return wrapped


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


@router.patch("/dashboards/{dashboard_id}/update", response_model=Dashboard)
def update_dashboard(dashboard_id: str, req: UpdateDashboardRequest, current_user: User = Depends(get_current_user)):
    """Update dashboard properties including filters."""
    dash = store.update_dashboard(current_user.id, dashboard_id, req)
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
    
    # Apply global filters from dashboard
    dash = store.get_dashboard(user_id, widget.dashboard_id)
    final_sql = widget.sql
    if dash and dash.filters:
        final_sql = apply_global_filters(widget.sql, dash.filters)

    result = execute_query(
        user_id,
        engine, 
        final_sql, 
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


@router.post("/widgets/{widget_id}/insight", response_model=dict)
def get_widget_insight(widget_id: str, current_user: User = Depends(get_current_user)):
    """Generate an AI insight for a widget's current data."""
    user_id = current_user.id
    widget = store.get_widget(user_id, widget_id)
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found.")
    
    dash = store.get_dashboard(user_id, widget.dashboard_id)
    filters = dash.filters if dash else {}
    
    insight = generate_widget_insight(
        widget.title, 
        widget.viz_type, 
        widget.rows, 
        filters
    )
    return {"insight": insight}


@router.get("/stats", response_model=DashboardStats)
def get_stats(dashboard_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get dashboard statistics."""
    return store.get_stats(current_user.id, dashboard_id=dashboard_id)
