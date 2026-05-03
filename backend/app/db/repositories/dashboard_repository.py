import uuid
from datetime import datetime, timezone
from typing import Optional

from app.db.models.dashboard import (
    AddWidgetInput,
    CreateDashboardInput,
    Dashboard,
    DashboardSummary,
    DashboardWidget,
    UpdateDashboardInput,
    UpdateWidgetInput,
)
from app.db.retry import async_supabase_retry
from app.integrations.supabase_db import async_supabase
from app.workers.jobs import refresh_dashboard_widget as scheduler


@async_supabase_retry
async def create_dashboard(user_id: str, req: CreateDashboardInput) -> Dashboard:
    """Create a new dashboard in Supabase."""
    dash_id = str(uuid.uuid4())
    data = {
        "id": dash_id,
        "owner_id": user_id,
        "name": req.name,
        "icon": req.icon,
        "filters": req.filters or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    response = await async_supabase.table("dashboards").insert(data).execute()
    if not response.data:
        raise Exception("Failed to create dashboard")

    return Dashboard(**response.data[0])


@async_supabase_retry
async def list_dashboards(user_id: str) -> list[DashboardSummary]:
    """List all dashboards for a user from Supabase with widget counts."""
    response = (
        await async_supabase.table("dashboards")
        .select("*, dashboard_widgets(count)")
        .eq("owner_id", user_id)
        .order("created_at", desc=False)
        .execute()
    )

    result = []
    for dashboard in response.data:
        widget_count = dashboard.get("dashboard_widgets", [{}])[0].get("count", 0)
        result.append(DashboardSummary(**dashboard, widget_count=widget_count))
    return result


@async_supabase_retry
async def get_dashboard(user_id: str, dashboard_id: str) -> Optional[Dashboard]:
    """Get a specific dashboard by ID and owner."""
    response = (
        await async_supabase.table("dashboards")
        .select("*")
        .eq("id", dashboard_id)
        .eq("owner_id", user_id)
        .execute()
    )

    if not response.data:
        return None
    return Dashboard(**response.data[0])


@async_supabase_retry
async def rename_dashboard(user_id: str, dashboard_id: str, name: str) -> Optional[Dashboard]:
    """Rename a dashboard in Supabase."""
    response = (
        await async_supabase.table("dashboards")
        .update({"name": name.strip()})
        .eq("id", dashboard_id)
        .eq("owner_id", user_id)
        .execute()
    )

    if not response.data:
        return None
    return Dashboard(**response.data[0])


@async_supabase_retry
async def update_dashboard(
    user_id: str,
    dashboard_id: str,
    req: UpdateDashboardInput,
) -> Optional[Dashboard]:
    """Update dashboard properties."""
    update_data = {}
    if req.name is not None:
        update_data["name"] = req.name
    if req.icon is not None:
        update_data["icon"] = req.icon
    if req.filters is not None:
        update_data["filters"] = req.filters
    if req.is_public is not None:
        update_data["is_public"] = False

    if not update_data:
        return await get_dashboard(user_id, dashboard_id)

    response = (
        await async_supabase.table("dashboards")
        .update(update_data)
        .eq("id", dashboard_id)
        .eq("owner_id", user_id)
        .execute()
    )

    if not response.data:
        return None
    return Dashboard(**response.data[0])


@async_supabase_retry
async def delete_dashboard(user_id: str, dashboard_id: str) -> bool:
    """Delete a dashboard."""
    response = (
        await async_supabase.table("dashboards")
        .delete()
        .eq("id", dashboard_id)
        .eq("owner_id", user_id)
        .execute()
    )

    return len(response.data) > 0


@async_supabase_retry
async def get_shared_dashboard(token: str) -> Optional[Dashboard]:
    """Return public dashboards if sharing is re-enabled later."""
    response = (
        await async_supabase.table("dashboards")
        .select("*")
        .eq("share_token", token)
        .eq("is_public", True)
        .execute()
    )

    if not response.data:
        return None
    return Dashboard(**response.data[0])


@async_supabase_retry
async def get_shared_widgets(dashboard_id: str) -> list[DashboardWidget]:
    """List widgets for a public dashboard if sharing is re-enabled later."""
    response = (
        await async_supabase.table("dashboard_widgets")
        .select("*")
        .eq("dashboard_id", dashboard_id)
        .order("order_index", desc=False)
        .order("created_at", desc=True)
        .execute()
    )
    return [_map_widget(widget) for widget in response.data]


@async_supabase_retry
async def add_widget(user_id: str, req: AddWidgetInput) -> DashboardWidget:
    """Add a new widget to a dashboard in Supabase."""
    size_defaults = {
        "half": {"w": 1, "h": 7, "minW": 1, "minH": 5},
        "full": {"w": 2, "h": 8, "minW": 2, "minH": 6},
    }
    layout_default = size_defaults.get(req.size, size_defaults["half"])

    current_widgets = await list_widgets(user_id, dashboard_id=req.dashboard_id)
    next_y = max((widget.y + widget.h) for widget in current_widgets) if current_widgets else 0
    next_order = max(widget.order_index for widget in current_widgets) + 1 if current_widgets else 0

    widget_id = str(uuid.uuid4())

    layout_params = {
        "x": req.x if req.x is not None else 0,
        "y": req.y if req.y is not None else next_y,
        "w": req.w if req.w is not None else layout_default["w"],
        "h": req.h if req.h is not None else layout_default["h"],
        "minW": req.minW if req.minW is not None else layout_default["minW"],
        "minH": req.minH if req.minH is not None else layout_default["minH"],
        "bar_orientation": req.bar_orientation or "horizontal",
    }

    data = {
        "id": widget_id,
        "dashboard_id": req.dashboard_id,
        "owner_id": user_id,
        "title": req.title,
        "viz_type": req.viz_type,
        "size": req.size,
        "connection_id": req.connection_id,
        "sql": req.sql,
        "chart_config": req.chart_config.model_dump() if req.chart_config else {},
        "layout_params": layout_params,
        "cadence": req.cadence,
        "order_index": req.order_index if req.order_index is not None else next_order,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "rows": req.rows if req.rows else [],
        "columns": req.columns if req.columns else [],
    }

    response = await async_supabase.table("dashboard_widgets").insert(data).execute()
    if not response.data:
        raise Exception("Failed to add widget")

    mapped_widget = _map_widget(response.data[0])

    if req.cadence and req.cadence != "Manual only":
        await scheduler.register_widget_job(mapped_widget.id, req.cadence, user_id)

    return mapped_widget


@async_supabase_retry
async def list_widgets(user_id: str, dashboard_id: Optional[str] = None) -> list[DashboardWidget]:
    """List widgets for a user from Supabase."""
    query = async_supabase.table("dashboard_widgets").select("*").eq("owner_id", user_id)

    if dashboard_id:
        query = query.eq("dashboard_id", dashboard_id)

    response = await query.order("order_index", desc=False).order("created_at", desc=True).execute()
    return [_map_widget(widget) for widget in response.data]


@async_supabase_retry
async def get_widget(user_id: str, widget_id: str) -> Optional[DashboardWidget]:
    """Get a specific widget by ID."""
    response = (
        await async_supabase.table("dashboard_widgets")
        .select("*")
        .eq("id", widget_id)
        .eq("owner_id", user_id)
        .execute()
    )

    if not response.data:
        return None
    return _map_widget(response.data[0])


@async_supabase_retry
async def delete_widget(user_id: str, widget_id: str) -> bool:
    """Delete a widget from Supabase."""
    response = (
        await async_supabase.table("dashboard_widgets")
        .delete()
        .eq("id", widget_id)
        .eq("owner_id", user_id)
        .execute()
    )

    await scheduler.remove_widget_job(widget_id)
    return len(response.data) > 0


@async_supabase_retry
async def update_widget(
    user_id: str,
    widget_id: str,
    req: UpdateWidgetInput,
) -> Optional[DashboardWidget]:
    """Update widget metadata in Supabase."""
    current = await get_widget(user_id, widget_id)
    if not current:
        return None

    update_data = {}
    if req.title is not None:
        update_data["title"] = req.title
    if req.size is not None:
        update_data["size"] = req.size
    if req.order_index is not None:
        update_data["order_index"] = req.order_index
    if req.cadence is not None:
        update_data["cadence"] = req.cadence

    layout_params = {
        "x": current.x,
        "y": current.y,
        "w": current.w,
        "h": current.h,
        "minW": current.minW,
        "minH": current.minH,
        "bar_orientation": current.bar_orientation,
    }

    layout_changed = False
    for field in ["x", "y", "w", "h", "minW", "minH", "bar_orientation"]:
        value = getattr(req, field)
        if value is not None:
            layout_params[field] = value
            layout_changed = True

    if layout_changed:
        update_data["layout_params"] = layout_params

    if req.rows is not None:
        update_data["rows"] = req.rows
    if req.columns is not None:
        update_data["columns"] = req.columns

    if not update_data:
        return current

    response = (
        await async_supabase.table("dashboard_widgets")
        .update(update_data)
        .eq("id", widget_id)
        .eq("owner_id", user_id)
        .execute()
    )

    if not response.data:
        return None

    mapped_widget = _map_widget(response.data[0])

    if req.cadence is not None:
        await scheduler.register_widget_job(widget_id, req.cadence, user_id)

    return mapped_widget


async def get_stats(user_id: str, dashboard_id: Optional[str] = None) -> dict:
    """Get dashboard statistics from Supabase."""
    widgets = await list_widgets(user_id, dashboard_id=dashboard_id)
    viz_counts: dict[str, int] = {}
    for widget in widgets:
        viz_counts[widget.viz_type] = viz_counts.get(widget.viz_type, 0) + 1
    return {
        "total_widgets": len(widgets),
        "viz_breakdown": viz_counts,
    }


@async_supabase_retry
async def get_all_scheduled_widgets() -> list[DashboardWidget]:
    """Get all widgets from Supabase that have an automatic cadence."""
    response = (
        await async_supabase.table("dashboard_widgets")
        .select("*")
        .neq("cadence", "Manual only")
        .execute()
    )
    return [_map_widget(widget) for widget in response.data]


def _map_widget(data: dict) -> DashboardWidget:
    """Map Supabase record to DashboardWidget Pydantic model."""
    layout_params = data.get("layout_params", {})
    return DashboardWidget(
        id=data["id"],
        owner_id=data["owner_id"],
        dashboard_id=data["dashboard_id"],
        title=data["title"],
        viz_type=data["viz_type"],
        size=data["size"],
        connection_id=data.get("connection_id"),
        sql=data.get("sql"),
        chart_config=data.get("chart_config"),
        cadence=data.get("cadence", "Manual only"),
        x=layout_params.get("x", 0),
        y=layout_params.get("y", 0),
        w=layout_params.get("w", 1),
        h=layout_params.get("h", 7),
        minW=layout_params.get("minW", 1),
        minH=layout_params.get("minH", 5),
        bar_orientation=layout_params.get("bar_orientation", "horizontal"),
        order_index=data.get("order_index", 0),
        created_at=data["created_at"],
        columns=data.get("columns", []),
        rows=data.get("rows", []),
    )
