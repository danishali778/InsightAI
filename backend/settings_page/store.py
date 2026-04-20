import traceback
from typing import Optional
from database.supabase_client import async_supabase
from database.retry import async_supabase_retry
from settings_page.models import UserSettingsResponse, UserSettingsUpdate, UserSettingsBase, UserSubscription

# Global dictionary to persist Mock User state across browser redirects
_MOCK_SUBSCRIPTION_DB = {}

@async_supabase_retry
async def get_user_settings(user_id: str) -> UserSettingsResponse:
    """Fetch user settings asynchronously, creating defaults if none exist."""
    try:
        response = await async_supabase.table("user_settings").select("*").eq("owner_id", user_id).execute()
        
        if not response.data:
            fallback = UserSettingsBase().model_dump()
            fallback["owner_id"] = user_id
            return UserSettingsResponse(**fallback)
                
        return UserSettingsResponse(**response.data[0])
    except Exception as e:
        fallback = UserSettingsBase().model_dump()
        fallback["owner_id"] = user_id
        return UserSettingsResponse(**fallback)

@async_supabase_retry
async def update_user_settings(user_id: str, updates: UserSettingsUpdate) -> UserSettingsResponse:
    """Partially update user settings asynchronously."""
    data = updates.model_dump(exclude_unset=True)
    if not data:
        return await get_user_settings(user_id)
        
    data["updated_at"] = "now()"
    
    response = await async_supabase.table("user_settings").update(data).eq("owner_id", user_id).execute()
    
    if response.data:
        return UserSettingsResponse(**response.data[0])
        
    return await get_user_settings(user_id)

@async_supabase_retry
async def get_user_subscription(user_id: str) -> UserSubscription:
    """Fetch user subscription asynchronously."""
    defaults = {
        "owner_id": user_id,
        "plan_type": "free",
        "queries_used": 0,
        "queries_limit": 100,
        "ai_used": 0,
        "ai_limit": 30,
        "next_reset_date": "soon"
    }

    if user_id in _MOCK_SUBSCRIPTION_DB:
        return UserSubscription(**_MOCK_SUBSCRIPTION_DB[user_id])

    try:
        response = await async_supabase.table("user_subscriptions").select("*").eq("owner_id", user_id).execute()
        
        if not response.data:
            insert_defaults = defaults.copy()
            if "next_reset_date" in insert_defaults: del insert_defaults["next_reset_date"]
            insert_resp = await async_supabase.table("user_subscriptions").insert(insert_defaults).execute()
            if insert_resp.data:
                return UserSubscription(**insert_resp.data[0])
            return UserSubscription(**defaults)
            
        return UserSubscription(**response.data[0])
    except Exception as e:
        return UserSubscription(**defaults)

@async_supabase_retry
async def increment_usage(user_id: str, usage_type: str) -> bool:
    """Increment usage asynchronously."""
    sub = await get_user_subscription(user_id)
    
    try:
        if usage_type == "query":
            if sub.queries_used >= sub.queries_limit:
                return False
            await async_supabase.table("user_subscriptions") \
                .update({"queries_used": sub.queries_used + 1}) \
                .eq("owner_id", user_id) \
                .execute()
            return True

        elif usage_type == "ai":
            if sub.ai_used >= sub.ai_limit:
                return False
            await async_supabase.table("user_subscriptions") \
                .update({"ai_used": sub.ai_used + 1}) \
                .eq("owner_id", user_id) \
                .execute()
            return True
    except Exception as e:
        print(f"[Usage Store] Silently ignoring update error for {user_id}: {e}")
        return True 
        
    return False

@async_supabase_retry
async def upgrade_to_pro(user_id: str) -> UserSubscription:
    """Mock Stripe Webhook (async)."""
    data = {
        "plan_type": "pro",
        "queries_limit": 5000,
        "ai_limit": 500,
        "updated_at": "now()"
    }
    try:
        response = await async_supabase.table("user_subscriptions").update(data).eq("owner_id", user_id).execute()
        if response.data:
            return UserSubscription(**response.data[0])
    except Exception:
        pass
    
    mem = (await get_user_subscription(user_id)).model_dump()
    mem.update(data)
    mem["next_reset_date"] = "soon"
    _MOCK_SUBSCRIPTION_DB[user_id] = mem
    return UserSubscription(**mem)

@async_supabase_retry
async def onboard_user(user_id: str) -> bool:
    """Onboard user asynchronously."""
    try:
        existing = await async_supabase.table("user_settings").select("owner_id").eq("owner_id", user_id).execute()
        if not existing.data:
            defaults = UserSettingsBase().model_dump()
            defaults["owner_id"] = user_id
            await async_supabase.table("user_settings").insert(defaults).execute()
        
        existing_sub = await async_supabase.table("user_subscriptions").select("owner_id").eq("owner_id", user_id).execute()
        if not existing_sub.data:
            sub_defaults = {
                "owner_id": user_id,
                "plan_type": "free", "queries_used": 0, "queries_limit": 100, "ai_used": 0, "ai_limit": 30
            }
            await async_supabase.table("user_subscriptions").insert(sub_defaults).execute()
        
        return True
    except Exception as e:
        print(f"[Onboarding Store] Error: {e}")
        return False
