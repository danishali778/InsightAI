import os
import logging
import uvicorn
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger(__name__)

# Log folder
LOG_FILE = "startup_debug.log"


def log_to_file(msg: str):
    # Strip non-ASCII if needed, but utf-8 file writing is usually fine
    # The real killer is the print() to a cp1252 terminal
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"{msg}\n")
        # Print only ASCII to terminal to avoid charmap errors
        safe_msg = msg.encode('ascii', 'ignore').decode('ascii')
        print(f"Log: {safe_msg}", flush=True)
    except Exception:
        pass


# Clear old log
if os.path.exists(LOG_FILE):
    try:
        os.remove(LOG_FILE)
    except Exception:
        pass

log_to_file("[startup] INITIALIZING MAIN.PY...")

from common import register_exception_handlers
from config import APP_HOST, APP_PORT, ALLOWED_ORIGINS
log_to_file("[startup] Configuration and common utils loaded.")

from routers import analytics, database, query, chat, query_history, query_library, dashboard_widgets, settings_page, webhooks
log_to_file("[startup] Routers imported successfully.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    from database.connection_manager import seed_dev_connection
    from query_library.scheduler import init_scheduler, restore_all_jobs, shutdown_scheduler

    log_to_file("[startup] Lifespan started.")
    try:
        log_to_file("[startup] Seeding dev connection...")
        seed_dev_connection()
        log_to_file("[startup] Seeding dev connection DONE.")

        log_to_file("[startup] Initializing scheduler...")
        init_scheduler()
        log_to_file("[startup] Initializing scheduler DONE.")

        log_to_file("[startup] Restoring all jobs...")
        restore_all_jobs()
        log_to_file("[startup] Restoring all jobs DONE.")

        log_to_file("[startup] Lifespan setup complete. App should start now.")
    except Exception as e:
        log_to_file(f"[startup] ERROR during lifespan: {e}")
        log_to_file(traceback.format_exc())

    yield
    log_to_file("[startup] Shutting down.")
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
# This prevents a misconfigured ALLOWED_ORIGINS env var from silently creating
# a CSRF-vulnerable server in production.
if "*" in origins:
    raise RuntimeError(
        "Security configuration error: ALLOWED_ORIGINS cannot contain '*' "
        "when allow_credentials=True. "
        "Set ALLOWED_ORIGINS to a specific list of allowed origins (e.g. "
        "'https://app.yourdomain.com'). "
        "Refusing to start."
    )

# Add localhost origins only if not already present (dev convenience)
for local_origin in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]:
    if local_origin not in origins:
        origins.append(local_origin)

log_to_file(f"[startup] CORS allowed origins: {origins}")

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
    log_to_file(f"[startup] STARTING UVICORN on {APP_HOST}:{APP_PORT}...")
    uvicorn.run("main:app", host=APP_HOST, port=APP_PORT, reload=True)
