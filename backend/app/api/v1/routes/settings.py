from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUserDep, UncheckedUserDep
from app.api.v1.schemas.settings import (
    BillingInfoResponse,
    CurrentUserResponse,
    OnboardResponse,
    UserSettingsResponse,
    UserSettingsUpdate,
)
from app.db.models.settings import UserSettingsUpdate as UserSettingsUpdateInput
from app.services import billing_service
from app.services import settings_service as store

router = APIRouter(prefix="/api/settings", tags=["User Settings"])

@router.get("", response_model=UserSettingsResponse)
def get_user_settings(current_user: CurrentUserDep):
    """Get the current authenticated user's settings. Defaults are injected if none exist."""
    try:
        return store.get_settings_for_user(current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch settings: {str(e)}")

@router.put("", response_model=UserSettingsResponse)
def update_user_settings(
    updates: UserSettingsUpdate,
    current_user: CurrentUserDep
):
    """Partially update user settings."""
    try:
        domain_updates = UserSettingsUpdateInput(**updates.model_dump(exclude_unset=True))
        return store.update_settings_for_user(current_user.id, domain_updates)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")

# --- Billing & Subscriptions ---

@router.get("/billing", response_model=BillingInfoResponse)
def get_billing_info(current_user: CurrentUserDep):
    """Get the user's current subscription tier and usage limit counters."""
    try:
        return billing_service.get_user_subscription(current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch billing info: {str(e)}")

@router.post("/billing/upgrade", response_model=BillingInfoResponse)
def trigger_mock_upgrade(current_user: CurrentUserDep):
    """Mock webhook: Upgrades the user to Pro and instantly resets/increases their limits."""
    try:
        return billing_service.upgrade_to_pro(current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upgrade: {str(e)}")


@router.post("/onboard", response_model=OnboardResponse)
def onboard_user(current_user: UncheckedUserDep):
    """Register the user in the database (Source of Truth)."""
    success = billing_service.onboard_user(current_user.id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to initialize user session.")
    return {"status": "success"}


@router.get("/me", response_model=CurrentUserResponse)
def check_auth(current_user: CurrentUserDep):
    """A lightweight endpoint for the frontend to verify that the user still exists in the DB."""
    return {"id": current_user.id, "email": current_user.email}
