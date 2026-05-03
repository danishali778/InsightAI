from typing import Optional

from pydantic import BaseModel, Field

from app.api.v1.schemas.dashboards import DashboardSummary


class AnalyticsOverviewMetrics(BaseModel):
    active_connections: int = 0
    total_queries: int = 0
    successful_queries: int = 0
    failed_queries: int = 0
    success_rate: float = 0.0
    avg_time_ms: float = 0.0
    saved_queries: int = 0
    scheduled_queries: int = 0
    dashboards: int = 0
    total_widgets: int = 0


class AnalyticsQueryHealth(BaseModel):
    successful: int = 0
    failed: int = 0


class TopConnectionUsage(BaseModel):
    connection_id: Optional[str] = None
    name: str
    database: str
    db_type: str
    query_count: int


class RecentAnalyticsQuery(BaseModel):
    id: str
    connection_id: Optional[str] = None
    connection_name: str
    sql: str
    success: bool
    error: Optional[str] = None
    execution_time_ms: Optional[float] = None
    row_count: Optional[int] = None
    timestamp: str


class AnalyticsLibraryStats(BaseModel):
    total_queries: int = 0
    scheduled: int = 0
    total_runs: int = 0
    recently_run: int = 0
    folders: int = 0


class AnalyticsDashboardsSection(BaseModel):
    total_dashboards: int = 0
    total_widgets: int = 0
    viz_breakdown: dict[str, int] = Field(default_factory=dict)
    items: list[DashboardSummary] = Field(default_factory=list)


class AnalyticsOverviewResponse(BaseModel):
    overview: AnalyticsOverviewMetrics
    library: AnalyticsLibraryStats
    dashboards: AnalyticsDashboardsSection
    query_health: AnalyticsQueryHealth
    top_connections: list[TopConnectionUsage] = Field(default_factory=list)
    recent_queries: list[RecentAnalyticsQuery] = Field(default_factory=list)


__all__ = [
    "AnalyticsOverviewMetrics",
    "AnalyticsQueryHealth",
    "TopConnectionUsage",
    "RecentAnalyticsQuery",
    "AnalyticsLibraryStats",
    "AnalyticsDashboardsSection",
    "AnalyticsOverviewResponse",
]
