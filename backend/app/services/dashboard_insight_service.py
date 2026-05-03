"""Dashboard insight workflows."""

from app.agents.insights.generator import generate_widget_insight as _generate_widget_insight
from app.agents.insights.generator import get_groq_client


def generate_widget_insight(
    title: str,
    viz_type: str,
    rows,
    dashboard_filters: dict | None = None,
) -> str:
    return _generate_widget_insight(title, viz_type, rows, dashboard_filters or {})


__all__ = ["get_groq_client", "generate_widget_insight"]
