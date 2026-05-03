import hashlib
import hmac
import json
from typing import Any

from app.core.config import settings


def has_webhook_secret() -> bool:
    return bool(settings.lemon_squeezy_webhook_secret)


def verify_webhook_signature(raw_body: bytes, signature: str | None) -> bool:
    secret = settings.lemon_squeezy_webhook_secret
    if not secret or not signature:
        return False

    digest = hmac.new(
        key=secret.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(digest, signature)


def parse_webhook_payload(raw_body: bytes) -> dict[str, Any]:
    return json.loads(raw_body.decode("utf-8"))


def get_event_name(payload: dict[str, Any]) -> str:
    return str(payload.get("meta", {}).get("event_name", ""))


def get_custom_data(payload: dict[str, Any]) -> dict[str, Any]:
    custom_data = payload.get("meta", {}).get("custom_data", {})
    return custom_data if isinstance(custom_data, dict) else {}


def get_user_id(payload: dict[str, Any]) -> str | None:
    user_id = get_custom_data(payload).get("user_id")
    return str(user_id) if user_id else None


__all__ = [
    "get_custom_data",
    "get_event_name",
    "get_user_id",
    "has_webhook_secret",
    "parse_webhook_payload",
    "verify_webhook_signature",
]
