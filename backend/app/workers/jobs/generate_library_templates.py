"""Background template-generation jobs."""

import logging
from typing import Optional

from app.agents.nl_to_sql.template_recommender import (
    DynamicTemplate,
    clear_connection as _clear_connection,
    generate_in_background as _generate_in_background,
    get_status as _get_status,
    get_template_by_id as _get_template_by_id,
    get_templates as _get_templates,
)


logger = logging.getLogger("app.workers.template_generation")


def trigger_generation(connection_id: str, schema_text: str, db_type: str) -> None:
    """Start in-memory background template generation for a connection."""
    logger.info("Triggering template generation for connection %s", connection_id)
    _generate_in_background(connection_id, schema_text, db_type)


def get_generation_status(connection_id: str) -> str:
    return _get_status(connection_id)


def list_generated_templates(connection_id: str) -> list[DynamicTemplate]:
    return _get_templates(connection_id)


def get_generated_template(template_id: str) -> Optional[DynamicTemplate]:
    return _get_template_by_id(template_id)


def clear_generated_templates(connection_id: str) -> None:
    logger.info("Clearing template cache for connection %s", connection_id)
    _clear_connection(connection_id)


async def restore_jobs() -> int:
    """Restore durable worker jobs for this domain.

    Template generation is currently in-memory and on-demand, so there is no
    persisted queue to rebuild after process restart.
    """
    logger.info("Template generation uses on-demand in-memory jobs; nothing to restore.")
    return 0


__all__ = [
    "trigger_generation",
    "get_generation_status",
    "list_generated_templates",
    "get_generated_template",
    "clear_generated_templates",
    "restore_jobs",
]
