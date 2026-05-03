from pydantic import BaseModel


class WebhookStatusResponse(BaseModel):
    """Generic webhook acknowledgement payload."""

    status: str


__all__ = ["WebhookStatusResponse"]
