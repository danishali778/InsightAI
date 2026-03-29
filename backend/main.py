import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from common import register_exception_handlers
from config import APP_HOST, APP_PORT, ALLOWED_ORIGINS
from routers import analytics, database, query, chat, query_history, query_library, dashboard_widgets


@asynccontextmanager
async def lifespan(app: FastAPI):
    from query_library.scheduler import init_scheduler, restore_all_jobs, shutdown_scheduler
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
