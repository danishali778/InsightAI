"""APScheduler integration for automatic query execution."""
import logging
from typing import Optional
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from zoneinfo import ZoneInfo

from .models import ScheduleConfig

logger = logging.getLogger("querymind.scheduler")

_scheduler: Optional[BackgroundScheduler] = None


def init_scheduler() -> BackgroundScheduler:
    """Create and start the background scheduler."""
    global _scheduler
    _scheduler = BackgroundScheduler(timezone="UTC")
    _scheduler.start()
    logger.info("Scheduler started.")
    return _scheduler


def shutdown_scheduler() -> None:
    """Gracefully shut down the scheduler."""
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler shut down.")


def _build_trigger(config: ScheduleConfig) -> CronTrigger:
    """Convert a ScheduleConfig into an APScheduler CronTrigger."""
    tz = ZoneInfo(config.timezone)
    kwargs: dict = {"hour": config.hour, "minute": config.minute, "timezone": tz}
    if config.frequency == "weekly" and config.day_of_week:
        kwargs["day_of_week"] = config.day_of_week[:3].lower()  # "monday" -> "mon"
    elif config.frequency == "monthly" and config.day_of_month:
        kwargs["day"] = config.day_of_month
    # daily: runs every day at hour:minute (no extra fields)
    return CronTrigger(**kwargs)


def _execute_scheduled_query(query_id: str, user_id: str) -> None:
    """Job function: execute a saved query and log the run."""
    # Lazy imports to avoid circular dependencies
    from query_library import store
    from database import connection_manager
    from query_executor.executor import execute_query

    query = store.get_query(user_id, query_id)
    if not query or not query.schedule or not query.schedule.enabled:
        remove_job(query_id)
        return

    if not query.connection_id:
        logger.warning("Scheduled query %s (user %s) has no connection_id, skipping.", query_id, user_id)
        store.log_run(user_id=user_id, query_id=query_id, success=False, error="No connection configured", triggered_by="schedule")
        return

    engine = connection_manager.get_engine(user_id, query.connection_id)
    if not engine:
        logger.warning("Scheduled query %s (user %s): connection %s not found.", query_id, user_id, query.connection_id)
        store.log_run(user_id=user_id, query_id=query_id, success=False, error="Connection not found", triggered_by="schedule")
        return

    result = execute_query(
        user_id,
        engine, 
        query.sql, 
        row_limit=500, 
        connection_id=query.connection_id,
        readonly=connection_manager.get_readonly(user_id, query.connection_id)
    )
    store.increment_run_count(user_id, query_id)
    store.log_run(
        user_id=user_id,
        query_id=query_id,
        success=result.success,
        row_count=result.row_count,
        execution_time_ms=result.execution_time_ms,
        error=result.error,
        triggered_by="schedule",
    )
    _update_next_run(query_id, user_id)
    logger.info("Scheduled query %s (user %s) executed: success=%s, rows=%d", query_id, user_id, result.success, result.row_count)


def _update_next_run(query_id: str, user_id: str) -> None:
    """Compute and store next_run_at from APScheduler's job state."""
    if not _scheduler:
        return
    from query_library import store

    job = _scheduler.get_job(f"schedule_{query_id}")
    if job and job.next_run_time:
        query = store.get_query(user_id, query_id)
        if query and query.schedule:
            # Note: This updates the local object. To persist, we'd need store.update_schedule.
            # However, next_run_at is computed, so maybe we don't need to persist it every time.
            query.schedule.next_run_at = job.next_run_time


def register_job(query_id: str, config: ScheduleConfig, user_id: Optional[str] = None) -> None:
    """Add or replace a scheduled job."""
    if not _scheduler:
        return
    
    # If user_id is not provided, we need to find it (for restore)
    if not user_id:
        from query_library import store
        # This is a bit inefficient for restore, but works.
        # Ideally, restore_all_jobs passes user_id.
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
    """Remove a scheduled job if it exists."""
    if not _scheduler:
        return
    job_id = f"schedule_{query_id}"
    try:
        _scheduler.remove_job(job_id)
        logger.info("Removed job %s", job_id)
    except Exception:
        pass  # Job may not exist


def restore_all_jobs() -> None:
    """Re-register all enabled schedules from the store. Called on startup."""
    from query_library import store

    scheduled = store.get_scheduled_queries() # No user_id => all users
    for query in scheduled:
        if query.schedule and query.owner_id:
            register_job(query.id, query.schedule, user_id=query.owner_id)
    logger.info("Restored %d scheduled jobs.", len(scheduled))
