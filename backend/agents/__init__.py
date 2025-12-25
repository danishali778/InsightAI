"""Agents Module - InsightAI"""
from .sql_architect import get_sql_architect_agent, generate_sql_task
from .data_viz import get_data_viz_agent, visualize_data_task

__all__ = [
    "get_sql_architect_agent",
    "generate_sql_task",
    "get_data_viz_agent", 
    "visualize_data_task",
]
