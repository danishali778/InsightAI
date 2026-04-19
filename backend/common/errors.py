import logging
import uuid

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


def _normalize_http_detail(detail: object) -> tuple[str, list[dict] | None]:
    if isinstance(detail, dict):
        message = str(detail.get("message") or detail.get("detail") or "Request failed.")
        details = detail.get("details")
        return message, details if isinstance(details, list) else None
    if isinstance(detail, list):
        return "Request failed.", detail if all(isinstance(item, dict) for item in detail) else None
    if isinstance(detail, str):
        return detail, None
    return "Request failed.", None


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(_: Request, exc: HTTPException):
        message, details = _normalize_http_detail(exc.detail)
        code = f"http_{exc.status_code}"
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": code,
                    "message": message,
                    "details": details,
                }
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "validation_error",
                    "message": "Request validation failed.",
                    "details": exc.errors(),
                }
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        # Generate a unique correlation ID so the error can be traced in server logs
        # without exposing internal details to the client.
        correlation_id = str(uuid.uuid4())

        # Log the full exception server-side with the correlation ID for traceability.
        logger.exception(
            "Unhandled exception [correlation_id=%s] on %s %s",
            correlation_id,
            request.method,
            request.url.path,
            exc_info=exc,
        )

        # Return only a generic message + correlation ID to the client.
        # Never expose str(exc) or stack traces to external callers.
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "internal_server_error",
                    "message": "An unexpected error occurred. Please contact support if this persists.",
                    "correlation_id": correlation_id,
                }
            },
        )
