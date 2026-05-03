import logging
import uvicorn
from config import APP_HOST, APP_PORT
from app.main import app

logger = logging.getLogger(__name__)


if __name__ == "__main__":
    logger.info("[startup] STARTING UVICORN on %s:%s...", APP_HOST, APP_PORT)
    uvicorn.run("main:app", host=APP_HOST, port=APP_PORT, reload=True)
