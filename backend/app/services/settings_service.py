"""User settings workflows."""

from app.db.models.settings import UserSettingsUpdate
from app.db.repositories import settings_repository


def get_settings_for_user(user_id: str):
    return settings_repository.get_user_settings(user_id)


def update_settings_for_user(user_id: str, updates: UserSettingsUpdate):
    return settings_repository.update_user_settings(user_id, updates.model_dump(exclude_unset=True))


def get_user_settings(user_id: str):
    return get_settings_for_user(user_id)


def update_user_settings(user_id: str, updates: UserSettingsUpdate):
    return update_settings_for_user(user_id, updates)


__all__ = [
    "get_settings_for_user",
    "update_settings_for_user",
    "get_user_settings",
    "update_user_settings",
]
