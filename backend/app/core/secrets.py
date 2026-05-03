"""Secret access and validation helpers."""

import logging

from app.core.config import settings


logger = logging.getLogger(__name__)

DEV_ENCRYPTION_KEY = "TZZoA4e_0aRy3zO0u7FzjHwBq2L8y6b9R9oV8XmQ_Jw="


def get_encryption_key() -> str:
    """Return the configured Fernet key, allowing a dev-only fallback."""
    if settings.encryption_key:
        return settings.encryption_key

    if settings.backend_dev_mode:
        logger.warning("ENCRYPTION_KEY is missing. Using the development fallback key.")
        return DEV_ENCRYPTION_KEY

    logger.error("ENCRYPTION_KEY is missing outside development mode.")
    raise RuntimeError("ENCRYPTION_KEY must be set outside development mode")


def require_groq_api_key() -> str:
    return settings.require("groq_api_key")


def require_lemon_squeezy_webhook_secret() -> str:
    return settings.require("lemon_squeezy_webhook_secret")


def require_supabase_url() -> str:
    return settings.require("supabase_url")


def require_supabase_service_role_key() -> str:
    return settings.require("supabase_service_role_key")


def validate_core_credentials() -> None:
    """Fail fast in production if credentials required for core runtime are missing."""
    required_in_production = [
        "encryption_key",
        "supabase_url",
        "supabase_service_role_key",
        "supabase_jwt_secret",
        "groq_api_key",
    ]
    missing = [name for name in required_in_production if not getattr(settings, name)]
    if missing and settings.is_production:
        raise RuntimeError(f"Missing required production configuration values: {', '.join(missing)}")


__all__ = [
    "DEV_ENCRYPTION_KEY",
    "get_encryption_key",
    "require_groq_api_key",
    "require_lemon_squeezy_webhook_secret",
    "require_supabase_url",
    "require_supabase_service_role_key",
    "validate_core_credentials",
]
