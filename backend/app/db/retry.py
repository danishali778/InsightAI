"""
Retry utility for Supabase operations.

Handles transient HTTP/2 connection drops (RemoteProtocolError: Server disconnected)
that occur when the Supabase connection pool reuses a stale connection.
"""

import time
import logging
from functools import wraps
from typing import TypeVar, Callable, Any

import httpx
import httpcore

logger = logging.getLogger(__name__)

T = TypeVar("T")

# Exceptions that indicate a transient connection issue worth retrying
RETRYABLE_EXCEPTIONS = (
    httpx.RemoteProtocolError,
    httpcore.RemoteProtocolError,
    httpx.ConnectError,
    httpx.ReadError,
    ConnectionResetError,
    ConnectionAbortedError,
)

MAX_RETRIES = 3
BASE_DELAY = 0.3  # seconds


def supabase_retry(func: Callable[..., T]) -> Callable[..., T]:
    """
    Decorator that retries a Supabase operation on transient connection errors.

    Usage:
        @supabase_retry
        def list_dashboards(user_id: str):
            return supabase.table("dashboards").select("*").execute()
    """
    @wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> T:
        last_exception = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                return func(*args, **kwargs)
            except RETRYABLE_EXCEPTIONS as e:
                last_exception = e
                if attempt < MAX_RETRIES:
                    delay = BASE_DELAY * (2 ** (attempt - 1))  # 0.3s, 0.6s
                    logger.warning(
                        "[supabase_retry] %s() attempt %d/%d failed: %s — retrying in %.1fs",
                        func.__name__, attempt, MAX_RETRIES, str(e), delay
                    )
                    time.sleep(delay)
                else:
                    logger.error(
                        "[supabase_retry] %s() failed after %d attempts: %s",
                        func.__name__, MAX_RETRIES, str(e)
                    )
        raise last_exception  # type: ignore[misc]
    return wrapper


def async_supabase_retry(func: Callable[..., Any]) -> Callable[..., Any]:
    """
    Decorator that retries an asynchronous Supabase operation on transient connection errors.
    """
    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        last_exception = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                return await func(*args, **kwargs)
            except RETRYABLE_EXCEPTIONS as e:
                last_exception = e
                if attempt < MAX_RETRIES:
                    delay = BASE_DELAY * (2 ** (attempt - 1))
                    logger.warning(
                        "[async_supabase_retry] %s() attempt %d/%d failed: %s — retrying in %.1fs",
                        func.__name__, attempt, MAX_RETRIES, str(e), delay
                    )
                    import asyncio
                    await asyncio.sleep(delay)
                else:
                    logger.error(
                        "[async_supabase_retry] %s() failed after %d attempts: %s",
                        func.__name__, MAX_RETRIES, str(e)
                    )
        raise last_exception
    return wrapper
