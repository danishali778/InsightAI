"""Compatibility wrapper for legacy imports.

New code should import from app.core.config.
"""

from app.core.config import ALLOWED_ORIGINS, APP_HOST, APP_PORT, Settings, get_settings, settings

__all__ = [
    "Settings",
    "settings",
    "get_settings",
    "APP_HOST",
    "APP_PORT",
    "ALLOWED_ORIGINS",
]
