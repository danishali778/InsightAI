import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from common import register_exception_handlers
from config import APP_HOST, APP_PORT, ALLOWED_ORIGINS
from routers import analytics, database, query, chat, query_history, query_library, dashboard_widgets


@asynccontextmanager
async def lifespan(app: FastAPI):
    from database.connection_manager import seed_dev_connection
    from query_library.scheduler import init_scheduler, restore_all_jobs, shutdown_scheduler
    seed_dev_connection()
    init_scheduler()
    restore_all_jobs()
    yield
    shutdown_scheduler()


app = FastAPI(
    title="QueryMind API",
    description="Chat with your data — Text-to-SQL powered by AI",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
origins = ALLOWED_ORIGINS
if "*" not in origins:
    # Always include these for dev robustness
    for local_origin in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]:
        if local_origin not in origins:
            origins.append(local_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "QueryMind API", "version": "2.0.0"}


if __name__ == "__main__":
    uvicorn.run("main:app", host=APP_HOST, port=APP_PORT, reload=True)
