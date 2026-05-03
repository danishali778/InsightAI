"""AI query-template workflows."""

from app.agents.nl_to_sql.template_recommender import DynamicTemplate
from app.workers.jobs import generate_library_templates as template_jobs


def get_generation_status(connection_id: str) -> str:
    return template_jobs.get_generation_status(connection_id)


def list_templates(connection_id: str) -> list[DynamicTemplate]:
    return template_jobs.list_generated_templates(connection_id)


def get_template(template_id: str):
    return template_jobs.get_generated_template(template_id)


def clear_templates_for_connection(connection_id: str) -> None:
    template_jobs.clear_generated_templates(connection_id)


def start_template_generation(connection_id: str, schema_text: str, db_type: str) -> None:
    template_jobs.trigger_generation(connection_id, schema_text, db_type)


__all__ = [
    "DynamicTemplate",
    "get_generation_status",
    "list_templates",
    "get_template",
    "clear_templates_for_connection",
    "start_template_generation",
]
