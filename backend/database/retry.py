import asyncio
import logging
from functools import wraps
from typing import TypeVar, Callable, Any, Awaitable

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
    KeyError,
)

MAX_RETRIES = 3
BASE_DELAY = 0.3


def supabase_retry(func: Callable[..., T]) -> Callable[..., T]:
    """Decorator for synchronous Supabase operations."""
    @wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> T:
        last_exception = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                return func(*args, **kwargs)
            except RETRYABLE_EXCEPTIONS as e:
                last_exception = e
                if attempt < MAX_RETRIES:
                    delay = BASE_DELAY * (2 ** (attempt - 1))
                    logger.warning("[supabase_retry] %s() attempt %d/%d failed: %s", func.__name__, attempt, MAX_RETRIES, e)
                    import time
                    time.sleep(delay)
                else:
                    logger.error("[supabase_retry] %s() failed after %d attempts", func.__name__, MAX_RETRIES)
        raise last_exception  # type: ignore
    return wrapper


def async_supabase_retry(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
    """Decorator for asynchronous Supabase operations."""
    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> T:
        last_exception = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                return await func(*args, **kwargs)
            except RETRYABLE_EXCEPTIONS as e:
                last_exception = e
                if attempt < MAX_RETRIES:
                    delay = BASE_DELAY * (2 ** (attempt - 1))
                    logger.warning("[async_supabase_retry] %s() attempt %d/%d failed: %s", func.__name__, attempt, MAX_RETRIES, e)
                    await asyncio.sleep(delay)
                else:
                    logger.error("[async_supabase_retry] %s() failed after %d attempts", func.__name__, MAX_RETRIES)
        raise last_exception  # type: ignore
    return wrapper

