from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ChartConfig(BaseModel):
    """Configuration for chart rendering."""
    x_column: Optional[str] = None
    y_columns: list[str] = Field(default_factory=list)
    title: Optional[str] = None
    x_label: Optional[str] = None
    y_label: Optional[str] = None


class Dashboard(BaseModel):
    """A dashboard that holds widgets."""
    id: str
    name: str
    icon: str = "📊"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CreateDashboardRequest(BaseModel):
    """Request body for creating a dashboard."""
    name: str
    icon: str = "📊"


class DashboardWidget(BaseModel):
    """A single widget on the dashboard."""
    id: str
    dashboard_id: str
    title: str
    viz_type: str  # bar | line | donut | table | kpi
    size: str = "half"  # half | full
    connection_id: Optional[str] = None
    columns: list[str] = Field(default_factory=list)
    rows: list[dict] = Field(default_factory=list)
    chart_config: Optional[ChartConfig] = None
    cadence: str = "Manual only"
    x: int = 0
    y: int = 0
    w: int = 1
    h: int = 7
    minW: int = 1
    minH: int = 5
    bar_orientation: str = "horizontal"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AddWidgetRequest(BaseModel):
    """Request body for adding a widget."""
    dashboard_id: str
    title: str
    viz_type: str = "table"
    size: str = "half"
    connection_id: Optional[str] = None
    columns: list[str] = Field(default_factory=list)
    rows: list[dict] = Field(default_factory=list)
    chart_config: Optional[ChartConfig] = None
    cadence: str = "Manual only"
    x: Optional[int] = None
    y: Optional[int] = None
    w: Optional[int] = None
    h: Optional[int] = None
    minW: Optional[int] = None
    minH: Optional[int] = None
    bar_orientation: Optional[str] = None


class UpdateWidgetRequest(BaseModel):
    """Patchable widget fields for layout and preferences."""
    title: Optional[str] = None
    size: Optional[str] = None
    x: Optional[int] = None
    y: Optional[int] = None
    w: Optional[int] = None
    h: Optional[int] = None
    minW: Optional[int] = None
    minH: Optional[int] = None
    bar_orientation: Optional[str] = None


class DashboardSummary(Dashboard):
    """Dashboard summary with widget count."""
    widget_count: int = 0


class DashboardStats(BaseModel):
    """Aggregate widget stats."""
    total_widgets: int = 0
    viz_breakdown: dict[str, int] = Field(default_factory=dict)
