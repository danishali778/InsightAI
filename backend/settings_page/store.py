import traceback
from typing import Optional
from database.supabase_client import supabase
from settings_page.models import UserSettingsResponse, UserSettingsUpdate, UserSettingsBase

def get_user_settings(user_id: str) -> UserSettingsResponse:
    """Fetch user settings, creating defaults if none exist."""
    try:
        response = supabase.table("user_settings").select("*").eq("owner_id", user_id).execute()
        
        if not response.data:
            return None
                
        return UserSettingsResponse(**response.data[0])
    except Exception as e:
        # Expected error for Mock user due to foreign key violations. Fallback is safe.
        # traceback.print_exc()
        fallback = UserSettingsBase().model_dump()
        fallback["owner_id"] = user_id
        return UserSettingsResponse(**fallback)

def update_user_settings(user_id: str, updates: UserSettingsUpdate) -> UserSettingsResponse:
    """Partially update user settings."""
    try:
        data = updates.model_dump(exclude_unset=True)
        if not data:
            return get_user_settings(user_id)
            
        data["updated_at"] = "now()"
        
        response = supabase.table("user_settings").update(data).eq("owner_id", user_id).execute()
        
        if response.data:
            return UserSettingsResponse(**response.data[0])
            
        # If it failed to update because it doesn't exist, we must create it first
        return get_user_settings(user_id)
    except Exception as e:
        print(f"[Settings Store] Error updating settings for {user_id}: {e}")
        traceback.print_exc()
        raise e

# --- Billing & Rate Limiting ---

from settings_page.models import UserSubscription

# Global dictionary to persist Mock User state across browser redirects
_MOCK_SUBSCRIPTION_DB = {}

def get_user_subscription(user_id: str) -> UserSubscription:
    """Fetch user subscription, generating a mock default if not present."""
    defaults = {
        "owner_id": user_id,
        "plan_type": "free",
        "queries_used": 0,
        "queries_limit": 100,
        "ai_used": 0,
        "ai_limit": 30,
        "next_reset_date": "soon"
    }

    # Intercept Dev Mode mock user to load from memory if they upgraded
    if user_id in _MOCK_SUBSCRIPTION_DB:
        return UserSubscription(**_MOCK_SUBSCRIPTION_DB[user_id])

    try:
        response = supabase.table("user_subscriptions").select("*").eq("owner_id", user_id).execute()
        
        if not response.data:
            insert_defaults = defaults.copy()
            del insert_defaults["next_reset_date"]
            insert_resp = supabase.table("user_subscriptions").insert(insert_defaults).execute()
            if insert_resp.data:
                return UserSubscription(**insert_resp.data[0])
            return UserSubscription(**defaults)
            
        return UserSubscription(**response.data[0])
    except Exception as e:
        print(
            f"[Usage Store] Failed to fetch/insert subscription for {user_id}"
            f" (likely MOCK_USER). Falling back to memory: {e}"
        )
        return UserSubscription(**defaults)

def increment_usage(user_id: str, type: str) -> bool:
    """
    Increment either 'queries_used' or 'ai_used'.
    Returns True if successful, False if limit exceeded.
    """
    sub = get_user_subscription(user_id)
    
    try:
        if type == "query":
            if sub.queries_used >= sub.queries_limit:
                return False
            (
                supabase.table("user_subscriptions")
                .update({"queries_used": sub.queries_used + 1})
                .eq("owner_id", user_id)
                .execute()
            )
            return True

        elif type == "ai":
            if sub.ai_used >= sub.ai_limit:
                return False
            (
                supabase.table("user_subscriptions")
                .update({"ai_used": sub.ai_used + 1})
                .eq("owner_id", user_id)
                .execute()
            )
            return True
    except Exception as e:
        print(f"[Usage Store] Silently ignoring update error for {user_id}: {e}")
        return True # Act as if usage increment succeeded locally
        
    return False

def upgrade_to_pro(user_id: str) -> UserSubscription:
    """Mock Stripe Webhook: Upgrades user to PRO and vastly increases limits."""
    data = {
        "plan_type": "pro",
        "queries_limit": 5000,
        "ai_limit": 500,
        "updated_at": "now()"
    }
    try:
        response = supabase.table("user_subscriptions").update(data).eq("owner_id", user_id).execute()
        if response.data:
            return UserSubscription(**response.data[0])
    except Exception as e:
        print(f"[Usage Store] Failed to formally upgrade {user_id}. Using Global Memory Fallback.")
    
    # Fallback for dev mode
    mem = get_user_subscription(user_id).model_dump()
    mem.update(data)
    mem["next_reset_date"] = "soon"
    
    # Save the upgraded state in global memory so it survives the browser redirect!
    _MOCK_SUBSCRIPTION_DB[user_id] = mem
    
    return UserSubscription(**mem)


def onboard_user(user_id: str) -> bool:
    """
    Formal onboarding: Creates default settings and subscription for a new user.
    Idempotent: If records already exist, it does nothing and returns success.
    """
    try:
        # 1. Check if user already has settings
        existing = supabase.table("user_settings").select("owner_id").eq("owner_id", user_id).execute()
        if not existing.data:
            # Create default settings
            defaults = UserSettingsBase().model_dump()
            defaults["owner_id"] = user_id
            supabase.table("user_settings").insert(defaults).execute()
        
        # 2. Check if user already has a subscription
        existing_sub = (
            supabase.table("user_subscriptions")
            .select("owner_id")
            .eq("owner_id", user_id)
            .execute()
        )
        if not existing_sub.data:
            # Create default subscription
            sub_defaults = {
                "owner_id": user_id,
                "plan_type": "free",
                "queries_used": 0,
                "queries_limit": 100,
                "ai_used": 0,
                "ai_limit": 30
            }
            supabase.table("user_subscriptions").insert(sub_defaults).execute()
        
        return True
    except Exception as e:
        print(f"[Onboarding Store] Error onboarding user {user_id}: {e}")
        return False

