import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    from app.services.connection_service import seed_dev_connection
    from app.workers.scheduler import (
        initialize_workers,
        restore_worker_jobs,
        shutdown_workers,
    )

    logger.info("[startup] Lifespan started.")
    try:
        logger.info("[startup] Seeding dev connection...")
        await seed_dev_connection()
        logger.info("[startup] Seeding dev connection DONE.")

        logger.info("[startup] Initializing workers...")
        initialize_workers()
        logger.info("[startup] Initializing workers DONE.")

        logger.info("[startup] Restoring worker jobs...")
        await restore_worker_jobs()
        logger.info("[startup] Restoring worker jobs DONE.")
    except Exception as exc:
        logger.error("[startup] ERROR during lifespan: %s", exc, exc_info=True)

    yield

    logger.info("[startup] Shutting down.")
    shutdown_workers()
