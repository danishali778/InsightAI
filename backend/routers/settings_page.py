from fastapi import APIRouter, Depends, HTTPException
from typing import Optional

from common.auth import get_current_user, get_user_no_check, User
from settings_page import store
from settings_page.models import UserSettingsResponse, UserSettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["User Settings"])

@router.get("", response_model=UserSettingsResponse)
def get_user_settings(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's settings. Defaults are injected if none exist."""
    try:
        return store.get_user_settings(current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch settings: {str(e)}")

@router.put("", response_model=UserSettingsResponse)
def update_user_settings(
    updates: UserSettingsUpdate,
    current_user: User = Depends(get_current_user)
):
    """Partially update user settings."""
    try:
        return store.update_user_settings(current_user.id, updates)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")

# --- Billing & Subscriptions ---

@router.get("/billing", response_model=store.UserSubscription)
def get_billing_info(current_user: User = Depends(get_current_user)):
    """Get the user's current subscription tier and usage limit counters."""
    try:
        return store.get_user_subscription(current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch billing info: {str(e)}")

@router.post("/billing/upgrade", response_model=store.UserSubscription)
def trigger_mock_upgrade(current_user: User = Depends(get_current_user)):
    """Mock webhook: Upgrades the user to Pro and instantly resets/increases their limits."""
    try:
        return store.upgrade_to_pro(current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upgrade: {str(e)}")


@router.post("/onboard")
def onboard_user(current_user: User = Depends(get_user_no_check)):
    """Register the user in the database (Source of Truth)."""
    success = store.onboard_user(current_user.id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to initialize user session.")
    return {"status": "success"}


@router.get("/me")
def check_auth(current_user: User = Depends(get_current_user)):
    """A lightweight endpoint for the frontend to verify that the user still exists in the DB."""
    return {"id": current_user.id, "email": current_user.email}
