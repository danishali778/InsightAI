"""Insight-generation agent package."""

from app.agents.insights.generator import generate_widget_insight, get_groq_client

__all__ = ["get_groq_client", "generate_widget_insight"]
