import os
import logging
import logging.handlers
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
# Logging Setup — replaces the brittle custom log_to_file() function
# Uses Python's standard logging module with a RotatingFileHandler so that:
#   - Log history is preserved across restarts (up to 3 x 5MB files)
#   - External log aggregators (Datadog, CloudWatch, etc.) can consume it
#   - No manual ASCII stripping is needed
# ---------------------------------------------------------------------------
LOG_FILE = "startup_debug.log"


def configure_logging() -> None:
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Rotating file handler — keeps last 3 files of max 5MB each
    file_handler = logging.handlers.RotatingFileHandler(
        LOG_FILE,
        maxBytes=5 * 1024 * 1024,  # 5 MB
        backupCount=3,
        encoding="utf-8",
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)

    # Console handler — INFO+ only
    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(logging.INFO)
    stream_handler.setFormatter(formatter)

    root_logger.addHandler(file_handler)
    root_logger.addHandler(stream_handler)


configure_logging()
logger = logging.getLogger(__name__)

logger.info("[startup] INITIALIZING MAIN.PY...")

from common import register_exception_handlers
from config import APP_HOST, APP_PORT, ALLOWED_ORIGINS
logger.info("[startup] Configuration and common utils loaded.")

from routers import analytics, database, query, chat, query_history, query_library, dashboard_widgets, settings_page, webhooks
logger.info("[startup] Routers imported successfully.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    from database.connection_manager import seed_dev_connection
    from query_library.scheduler import init_scheduler, restore_all_jobs, shutdown_scheduler

    logger.info("[startup] Lifespan started.")
    try:
        logger.info("[startup] Seeding dev connection...")
        seed_dev_connection()
        logger.info("[startup] Seeding dev connection DONE.")

        logger.info("[startup] Initializing scheduler...")
        init_scheduler()
        logger.info("[startup] Initializing scheduler DONE.")

        logger.info("[startup] Restoring all jobs...")
        restore_all_jobs()
        logger.info("[startup] Restoring all jobs DONE.")

        logger.info("[startup] Lifespan setup complete. App should start now.")
    except Exception as e:
        logger.error("[startup] ERROR during lifespan: %s", e, exc_info=True)

    yield
    logger.info("[startup] Shutting down.")
    shutdown_scheduler()


app = FastAPI(
    title="QueryMind API",
    description="Chat with your data — Text-to-SQL powered by AI",
    version="2.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS Configuration
# ---------------------------------------------------------------------------
# IMPORTANT: Using allow_credentials=True together with allow_origins=["*"]
# is a security misconfiguration — browsers block credentialed requests to
# wildcard origins, but the combination also opens CSRF attack surface.
# We enforce that wildcards are never used with credentials enabled.
# ---------------------------------------------------------------------------
origins = list(ALLOWED_ORIGINS)

# Hard guard: refuse to start if wildcard origin + credentials are combined.
if "*" in origins:
    raise RuntimeError(
        "Security configuration error: ALLOWED_ORIGINS cannot contain '*' "
        "when allow_credentials=True. "
        "Set ALLOWED_ORIGINS to a specific list of allowed origins. "
        "Refusing to start."
    )

# Add localhost origins only if not already present (dev convenience)
for local_origin in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]:
    if local_origin not in origins:
        origins.append(local_origin)

logger.info("[startup] CORS allowed origins: %s", origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_headers=["*"],
    allow_methods=["*"],
    allow_credentials=True,
)

register_exception_handlers(app)

# Include routers
app.include_router(database.router)
app.include_router(query.router)
app.include_router(chat.router)
app.include_router(query_history.router)
app.include_router(query_library.router)
app.include_router(dashboard_widgets.router)
app.include_router(analytics.router)
app.include_router(settings_page.router)
app.include_router(webhooks.router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "QueryMind API", "version": "2.0.0"}


if __name__ == "__main__":
    logger.info("[startup] STARTING UVICORN on %s:%s...", APP_HOST, APP_PORT)
    uvicorn.run("main:app", host=APP_HOST, port=APP_PORT, reload=True)
