import logging
from dataclasses import dataclass
from typing import Iterable


logger = logging.getLogger(__name__)


@dataclass
class EmailMessage:
    to: list[str]
    subject: str
    text: str
    html: str | None = None


@dataclass
class EmailDeliveryResult:
    sent: bool
    provider: str
    error: str | None = None


def is_email_configured() -> bool:
    return False


def send_email(message: EmailMessage) -> EmailDeliveryResult:
    logger.warning(
        "Email provider not configured. Skipping email to %s with subject %s.",
        ", ".join(message.to),
        message.subject,
    )
    return EmailDeliveryResult(
        sent=False,
        provider="none",
        error="Email provider not configured",
    )


def normalize_recipients(recipients: str | Iterable[str]) -> list[str]:
    if isinstance(recipients, str):
        return [recipients]
    return [recipient for recipient in recipients if recipient]


__all__ = [
    "EmailDeliveryResult",
    "EmailMessage",
    "is_email_configured",
    "normalize_recipients",
    "send_email",
]
