import json
import logging
from typing import Any
from urllib import request


logger = logging.getLogger(__name__)


def has_slack_webhook(webhook_url: str | None) -> bool:
    return bool(webhook_url)


def send_slack_message(
    webhook_url: str | None,
    text: str,
    blocks: list[dict[str, Any]] | None = None,
) -> bool:
    if not webhook_url:
        logger.warning("Slack webhook is not configured. Skipping message.")
        return False

    payload: dict[str, Any] = {"text": text}
    if blocks:
        payload["blocks"] = blocks

    req = request.Request(
        webhook_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=10) as response:
            return 200 <= response.status < 300
    except Exception as exc:
        logger.error("Failed to send Slack message: %s", exc)
        return False


__all__ = ["has_slack_webhook", "send_slack_message"]
