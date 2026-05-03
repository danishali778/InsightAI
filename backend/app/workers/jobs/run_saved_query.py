import asyncio
import logging
from typing import Optional
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.db.models.query_library import ScheduleConfig
from app.services import query_library_service
from app.services.connection_service import get_engine, get_readonly
from app.services.query_execution_service import execute_query


logger = logging.getLogger("app.workers.query_library")
_scheduler: Optional[BackgroundScheduler] = None


def init_scheduler() -> BackgroundScheduler:
    global _scheduler
    _scheduler = BackgroundScheduler(timezone="UTC")
    _scheduler.start()
    logger.info("Scheduler started.")
    return _scheduler


def shutdown_scheduler() -> None:
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler shut down.")


def _build_trigger(config: ScheduleConfig) -> CronTrigger:
    tz = ZoneInfo(config.timezone)
    kwargs: dict = {"hour": config.hour, "minute": config.minute, "timezone": tz}
    if config.frequency == "weekly" and config.day_of_week:
        kwargs["day_of_week"] = config.day_of_week[:3].lower()
    elif config.frequency == "monthly" and config.day_of_month:
        kwargs["day"] = config.day_of_month
    return CronTrigger(**kwargs)


def _update_next_run(query_id: str, user_id: str) -> None:
    if not _scheduler:
        return
    job = _scheduler.get_job(f"schedule_{query_id}")
    if job and job.next_run_time:
        query = query_library_service.sync_get_query(user_id, query_id)
        if query and query.schedule:
            query.schedule.next_run_at = job.next_run_time


def _execute_scheduled_query(query_id: str, user_id: str) -> None:
    query = query_library_service.sync_get_query(user_id, query_id)
    if not query or not query.schedule or not query.schedule.enabled:
        remove_job(query_id)
        return

    if not query.connection_id:
        logger.warning("Scheduled query %s (user %s) has no connection_id, skipping.", query_id, user_id)
        query_library_service.sync_log_run(
            user_id=user_id,
            query_id=query_id,
            success=False,
            error="No connection configured",
            triggered_by="schedule",
        )
        return

    engine = asyncio.run(get_engine(user_id, query.connection_id))
    if not engine:
        logger.warning("Scheduled query %s (user %s): connection %s not found.", query_id, user_id, query.connection_id)
        query_library_service.sync_log_run(
            user_id=user_id,
            query_id=query_id,
            success=False,
            error="Connection not found",
            triggered_by="schedule",
        )
        return

    readonly = asyncio.run(get_readonly(user_id, query.connection_id))
    result = execute_query(
        user_id,
        engine,
        query.sql,
        row_limit=500,
        connection_id=query.connection_id,
        readonly=readonly,
    )
    query_library_service.sync_increment_run_count(user_id, query_id)
    query_library_service.sync_log_run(
        user_id=user_id,
        query_id=query_id,
        success=result.success,
        row_count=result.row_count,
        execution_time_ms=result.execution_time_ms,
        error=result.error,
        triggered_by="schedule",
    )
    _update_next_run(query_id, user_id)
    logger.info(
        "Scheduled query %s (user %s) executed: success=%s, rows=%d",
        query_id,
        user_id,
        result.success,
        result.row_count,
    )


def register_job(query_id: str, config: ScheduleConfig, user_id: Optional[str] = None) -> None:
    if not _scheduler or not user_id:
        return

    job_id = f"schedule_{query_id}"
    trigger = _build_trigger(config)
    _scheduler.add_job(
        _execute_scheduled_query,
        trigger=trigger,
        args=[query_id, user_id],
        id=job_id,
        replace_existing=True,
        name=f"Query: {query_id}",
    )
    _update_next_run(query_id, user_id)
    logger.info("Registered job %s (%s) for user %s", job_id, config.frequency, user_id)


def remove_job(query_id: str) -> None:
    if not _scheduler:
        return
    job_id = f"schedule_{query_id}"
    try:
        _scheduler.remove_job(job_id)
        logger.info("Removed job %s", job_id)
    except Exception:
        pass


async def restore_jobs() -> None:
    scheduled = await query_library_service.get_scheduled_queries()
    for query in scheduled:
        if query.schedule and query.owner_id:
            register_job(query.id, query.schedule, user_id=query.owner_id)
    logger.info("Restored %d scheduled jobs.", len(scheduled))


__all__ = [
    "init_scheduler",
    "shutdown_scheduler",
    "register_job",
    "remove_job",
    "restore_jobs",
]
