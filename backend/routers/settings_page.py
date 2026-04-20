from fastapi import APIRouter, Depends, HTTPException

from common.auth import get_current_user, get_user_no_check, User
from settings_page import store
from settings_page.models import UserSettingsResponse, UserSettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["User Settings"])

@router.get("", response_model=UserSettingsResponse)
async def get_user_settings(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's settings asynchronously."""
    try:
        return await store.get_user_settings(current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch settings: {str(e)}")

@router.put("", response_model=UserSettingsResponse)
async def update_user_settings(
    updates: UserSettingsUpdate,
    current_user: User = Depends(get_current_user)
):
    """Partially update user settings asynchronously."""
    try:
        return await store.update_user_settings(current_user.id, updates)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")

# --- Billing & Subscriptions ---

@router.get("/billing", response_model=store.UserSubscription)
async def get_billing_info(current_user: User = Depends(get_current_user)):
    """Get the user's current subscription asynchronously."""
    try:
        return await store.get_user_subscription(current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch billing info: {str(e)}")

@router.post("/billing/upgrade", response_model=store.UserSubscription)
async def trigger_mock_upgrade(current_user: User = Depends(get_current_user)):
    """Mock upgrade asynchronously."""
    try:
        return await store.upgrade_to_pro(current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upgrade: {str(e)}")


@router.post("/onboard")
async def onboard_user(current_user: User = Depends(get_user_no_check)):
    """Register the user asynchronously."""
    success = await store.onboard_user(current_user.id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to initialize user session.")
    return {"status": "success"}


@router.get("/me")
async def check_auth(current_user: User = Depends(get_current_user)):
    """Lite auth check."""
    return {"id": current_user.id, "email": current_user.email}
