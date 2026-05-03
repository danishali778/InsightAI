"""Canonical worker scheduler orchestration."""


def initialize_workers() -> None:
    from app.workers.jobs.refresh_dashboard_widget import init_scheduler as init_dashboard_scheduler
    from app.workers.jobs.run_saved_query import init_scheduler as init_query_scheduler

    init_query_scheduler()
    init_dashboard_scheduler()


def shutdown_workers() -> None:
    from app.workers.jobs.refresh_dashboard_widget import shutdown_scheduler as shutdown_dashboard_scheduler
    from app.workers.jobs.run_saved_query import shutdown_scheduler as shutdown_query_scheduler

    shutdown_query_scheduler()
    shutdown_dashboard_scheduler()


async def restore_worker_jobs() -> None:
    from app.workers.jobs.generate_library_templates import restore_jobs as restore_template_jobs
    from app.workers.jobs.refresh_dashboard_widget import restore_jobs as restore_dashboard_jobs
    from app.workers.jobs.run_saved_query import restore_jobs as restore_query_jobs

    await restore_query_jobs()
    await restore_dashboard_jobs()
    await restore_template_jobs()


__all__ = ["initialize_workers", "shutdown_workers", "restore_worker_jobs"]
