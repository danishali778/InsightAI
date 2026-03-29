import uuid
from datetime import datetime, timezone
from typing import Optional
from .models import Dashboard, CreateDashboardRequest, DashboardWidget, AddWidgetRequest, UpdateWidgetRequest, RenameDashboardRequest


# In-memory stores
_dashboards: dict[str, Dashboard] = {}
_widgets: dict[str, DashboardWidget] = {}


# ─── Dashboard CRUD ─────────────────────────────────────────

def create_dashboard(req: CreateDashboardRequest) -> Dashboard:
    """Create a new dashboard."""
    dash = Dashboard(
        id=str(uuid.uuid4())[:8],
        name=req.name,
        icon=req.icon,
        created_at=datetime.now(timezone.utc),
    )
    _dashboards[dash.id] = dash
    return dash


def list_dashboards() -> list[dict]:
    """List all dashboards with widget counts."""
    result = []
    for d in sorted(_dashboards.values(), key=lambda x: x.created_at):
        widget_count = sum(1 for w in _widgets.values() if w.dashboard_id == d.id)
        result.append({
            **d.model_dump(),
            "widget_count": widget_count,
        })
    return result


def get_dashboard(dashboard_id: str) -> Optional[Dashboard]:
    return _dashboards.get(dashboard_id)


def rename_dashboard(dashboard_id: str, name: str) -> Optional[Dashboard]:
    dash = _dashboards.get(dashboard_id)
    if not dash:
        return None
    dash.name = name.strip()
    _dashboards[dashboard_id] = dash
    return dash


def delete_dashboard(dashboard_id: str) -> bool:
    if dashboard_id in _dashboards:
        del _dashboards[dashboard_id]
        # Also delete all widgets in this dashboard
        to_delete = [wid for wid, w in _widgets.items() if w.dashboard_id == dashboard_id]
        for wid in to_delete:
            del _widgets[wid]
        return True
    return False


# ─── Widget CRUD ────────────────────────────────────────────

def add_widget(req: AddWidgetRequest) -> DashboardWidget:
    """Add a new widget to a dashboard."""
    # Keep size presets as defaults; layout remains user-overridable later.
    size_defaults = {
        "half": {"w": 1, "h": 7, "minW": 1, "minH": 5},
        "full": {"w": 2, "h": 8, "minW": 2, "minH": 6},
    }
    layout_default = size_defaults.get(req.size, size_defaults["half"])
    dash_widgets = [w for w in _widgets.values() if w.dashboard_id == req.dashboard_id]
    next_y = max((w.y + w.h) for w in dash_widgets) if dash_widgets else 0

    widget = DashboardWidget(
        id=str(uuid.uuid4())[:8],
        dashboard_id=req.dashboard_id,
        title=req.title,
        viz_type=req.viz_type,
        size=req.size,
        connection_id=req.connection_id,
        columns=req.columns,
        rows=req.rows,
        chart_config=req.chart_config,
        cadence=req.cadence,
        sql=req.sql,
        x=req.x if req.x is not None else 0,
        y=req.y if req.y is not None else next_y,
        w=req.w if req.w is not None else layout_default["w"],
        h=req.h if req.h is not None else layout_default["h"],
        minW=req.minW if req.minW is not None else layout_default["minW"],
        minH=req.minH if req.minH is not None else layout_default["minH"],
        bar_orientation=req.bar_orientation or "horizontal",
        created_at=datetime.now(timezone.utc),
    )
    _widgets[widget.id] = widget
    return widget


def list_widgets(dashboard_id: Optional[str] = None) -> list[DashboardWidget]:
    """List widgets, optionally filtered by dashboard."""
    result = list(_widgets.values())
    if dashboard_id:
        result = [w for w in result if w.dashboard_id == dashboard_id]
    return sorted(result, key=lambda w: w.created_at, reverse=True)


def get_widget(widget_id: str) -> Optional[DashboardWidget]:
    return _widgets.get(widget_id)


def delete_widget(widget_id: str) -> bool:
    if widget_id in _widgets:
        del _widgets[widget_id]
        return True
    return False


def update_widget(widget_id: str, req: UpdateWidgetRequest) -> Optional[DashboardWidget]:
    """Update widget layout/preferences."""
    widget = _widgets.get(widget_id)
    if not widget:
        return None
    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(widget, field, value)
    _widgets[widget_id] = widget
    return widget


def get_stats(dashboard_id: Optional[str] = None) -> dict:
    """Get dashboard statistics."""
    widgets = list_widgets(dashboard_id)
    viz_counts: dict[str, int] = {}
    for w in widgets:
        viz_counts[w.viz_type] = viz_counts.get(w.viz_type, 0) + 1
    return {
        "total_widgets": len(widgets),
        "viz_breakdown": viz_counts,
    }
