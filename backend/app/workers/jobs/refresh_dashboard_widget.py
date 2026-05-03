import logging
from typing import Optional
from zoneinfo import ZoneInfo

import anyio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.api.v1.schemas.dashboards import UpdateWidgetRequest
from app.services import dashboard_service
from app.services.connection_service import get_engine, get_readonly
from app.services.query_execution_service import execute_query


logger = logging.getLogger("app.workers.dashboard")
_scheduler: Optional[AsyncIOScheduler] = None


def init_scheduler() -> AsyncIOScheduler:
    global _scheduler
    _scheduler = AsyncIOScheduler(timezone="UTC")
    _scheduler.start()
    logger.info("Async Dashboard Scheduler started.")
    return _scheduler


def shutdown_scheduler() -> None:
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Async Dashboard Scheduler shut down.")


def _build_trigger(cadence: str) -> Optional[CronTrigger]:
    if not cadence:
        return None
    cadence_lower = cadence.lower()
    tz = ZoneInfo("UTC")

    if "hourly" in cadence_lower:
        return CronTrigger(minute=0, timezone=tz)
    if "daily" in cadence_lower:
        return CronTrigger(hour=0, minute=0, timezone=tz)
    if "weekly" in cadence_lower:
        return CronTrigger(day_of_week="mon", hour=0, minute=0, timezone=tz)
    if "monthly" in cadence_lower:
        return CronTrigger(day=1, hour=0, minute=0, timezone=tz)
    return None


async def _execute_dashboard_widget(widget_id: str, user_id: str) -> None:
    widget = await dashboard_service.get_widget(user_id, widget_id)
    if not widget or widget.cadence == "Manual only" or not widget.sql:
        await remove_widget_job(widget_id)
        return

    if not widget.connection_id:
        return

    engine = await get_engine(user_id, widget.connection_id)
    if not engine:
        return

    dash = await dashboard_service.get_dashboard(user_id, widget.dashboard_id)
    final_sql = widget.sql
    if dash and dash.filters:
        final_sql = dashboard_service.apply_global_filters(widget.sql, dash.filters)

    readonly = await get_readonly(user_id, widget.connection_id)
    result = await anyio.to_thread.run_sync(
        execute_query,
        user_id,
        engine,
        final_sql,
        500,
        widget.connection_id,
        readonly,
    )

    if result.success:
        req = UpdateWidgetRequest(columns=result.columns, rows=result.rows)
        await dashboard_service.update_widget(user_id, widget_id, req)
        logger.info("Scheduled dashboard widget %s executed successfully.", widget_id)
    else:
        logger.warning("Scheduled dashboard widget %s failed: %s", widget_id, result.error)


async def register_widget_job(widget_id: str, cadence: str, user_id: str) -> None:
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
    if not _scheduler:
        return
    job_id = f"dash_widget_{widget_id}"
    try:
        _scheduler.remove_job(job_id)
        logger.info("Removed job %s", job_id)
    except Exception:
        pass


async def restore_jobs() -> None:
    scheduled = await dashboard_service.get_all_scheduled_widgets()
    for widget in scheduled:
        if widget.cadence and widget.cadence != "Manual only":
            await register_widget_job(widget.id, widget.cadence, widget.owner_id)
    logger.info("Restored %d dashboard widget jobs.", len(scheduled))


__all__ = [
    "init_scheduler",
    "shutdown_scheduler",
    "register_widget_job",
    "remove_widget_job",
    "restore_jobs",
]
