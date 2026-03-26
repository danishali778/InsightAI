from pydantic import BaseModel
from typing import Optional


class MessageResponse(BaseModel):
    """Simple success message payload."""
    message: str


class StatusMessageResponse(MessageResponse):
    """Success message payload with an optional status label."""
    status: Optional[str] = None


class ErrorDetail(BaseModel):
    """Normalized error details returned by the API."""
    code: str
    message: str
    details: Optional[list[dict]] = None


class ErrorResponse(BaseModel):
    """Top-level normalized error response."""
    error: ErrorDetail
