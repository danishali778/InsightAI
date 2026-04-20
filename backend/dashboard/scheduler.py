"""Async APScheduler integration for automatic dashboard widget execution."""
import logging
from typing import Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from zoneinfo import ZoneInfo
import anyio

logger = logging.getLogger("dashboard.scheduler")

_scheduler: Optional[AsyncIOScheduler] = None


def init_scheduler() -> AsyncIOScheduler:
    """Create and start the async background scheduler."""
    global _scheduler
    _scheduler = AsyncIOScheduler(timezone="UTC")
    _scheduler.start()
    logger.info("Async Dashboard Scheduler started.")
    return _scheduler


def shutdown_scheduler() -> None:
    """Gracefully shut down the scheduler."""
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Async Dashboard Scheduler shut down.")


def _build_trigger(cadence: str) -> Optional[CronTrigger]:
    """Convert a cadence string into an APScheduler CronTrigger."""
    if not cadence:
        return None
    c = cadence.lower()
    tz = ZoneInfo("UTC")
    
    if "hourly" in c:
        return CronTrigger(minute=0, timezone=tz)
    elif "daily" in c:
        return CronTrigger(hour=0, minute=0, timezone=tz)
    elif "weekly" in c:
        return CronTrigger(day_of_week="mon", hour=0, minute=0, timezone=tz)
    elif "monthly" in c:
        return CronTrigger(day=1, hour=0, minute=0, timezone=tz)
    
    return None


async def _execute_dashboard_widget(widget_id: str, user_id: str) -> None:
    """Job function: execute a dashboard widget's SQL and update rows asynchronously."""
    from dashboard import store
    from database import connection_manager
    from query_executor.executor import execute_query
    from routers.dashboard_widgets import apply_global_filters

    widget = await store.get_widget(user_id, widget_id)
    if not widget or widget.cadence == 'Manual only' or not widget.sql:
        await remove_widget_job(widget_id)
        return

    if not widget.connection_id:
        return

    engine = await connection_manager.get_engine(user_id, widget.connection_id)
    if not engine:
        return

    dash = await store.get_dashboard(user_id, widget.dashboard_id)
    final_sql = widget.sql
    if dash and dash.filters:
        # Note: apply_global_filters is usually a sync helper
        final_sql = apply_global_filters(widget.sql, dash.filters)

    readonly = await connection_manager.get_readonly(user_id, widget.connection_id)

    # Offload sync query execution to thread pool
    result = await anyio.to_thread.run_sync(
        execute_query,
        user_id,
        engine, 
        final_sql, 
        500, 
        widget.connection_id,
        readonly
    )
    
    if result.success:
        from dashboard.models import UpdateWidgetRequest
        req = UpdateWidgetRequest(columns=result.columns, rows=result.rows)
        await store.update_widget(user_id, widget_id, req)
        logger.info("Scheduled dashboard widget %s executed successfully.", widget_id)
    else:
        logger.warning("Scheduled dashboard widget %s failed: %s", widget_id, result.error)


async def register_widget_job(widget_id: str, cadence: str, user_id: str) -> None:
    """Add or replace a scheduled job for a widget."""
    if not _scheduler:
        return
        
    job_id = f"dash_widget_{widget_id}"
    trigger = _build_trigger(cadence)
    
    if not trigger:
        await remove_widget_job(widget_id)
        return

    _scheduler.add_job(
        _execute_dashboard_widget,
        trigger=trigger,
        args=[widget_id, user_id],
        id=job_id,
        replace_existing=True,
        name=f"Widget: {widget_id}",
    )
    logger.info("Registered job %s for cadence '%s'", job_id, cadence)


async def remove_widget_job(widget_id: str) -> None:
    """Remove a scheduled job if it exists."""
    if not _scheduler:
        return
    job_id = f"dash_widget_{widget_id}"
    try:
        _scheduler.remove_job(job_id)
        logger.info("Removed job %s", job_id)
    except Exception:
        pass


async def restore_all_widget_jobs() -> None:
    """Re-register all widgets that have active cadences. Called on startup."""
    from dashboard import store

    scheduled = await store.get_all_scheduled_widgets()
    for widget in scheduled:
        if widget.cadence and widget.cadence != 'Manual only':
            await register_widget_job(widget.id, widget.cadence, widget.owner_id)
            
    logger.info("Restored %d dashboard widget jobs.", len(scheduled))
