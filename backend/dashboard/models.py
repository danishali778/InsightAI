from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ChartConfig(BaseModel):
    """Configuration for chart rendering."""
    x_column: Optional[str] = None
    y_columns: list[str] = []
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
    columns: list[str] = []
    rows: list[dict] = []
    chart_config: Optional[ChartConfig] = None
    cadence: str = "Manual only"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AddWidgetRequest(BaseModel):
    """Request body for adding a widget."""
    dashboard_id: str
    title: str
    viz_type: str = "table"
    size: str = "half"
    connection_id: Optional[str] = None
    columns: list[str] = []
    rows: list[dict] = []
    chart_config: Optional[ChartConfig] = None
    cadence: str = "Manual only"
