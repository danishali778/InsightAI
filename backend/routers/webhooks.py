from fastapi import APIRouter, Request, HTTPException, Header
import hmac
import hashlib
import json
import os
from settings_page.store import upgrade_to_pro

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

LEMON_SECRET = os.getenv("LEMON_SQUEEZY_WEBHOOK_SECRET")

@router.post("/lemonsqueezy")
async def lemonsqueezy_webhook(request: Request, x_signature: str = Header(None)):
    """
    Secure Webhook endpoint for Lemon Squeezy.
    Triggered when a subscription is purchased.
    """
    if not LEMON_SECRET:
        print("[Webhook] WARNING: LEMON_SQUEEZY_WEBHOOK_SECRET is not set. Rejecting webhook.")
        raise HTTPException(status_code=500, detail="Webhook secret not configured on server")

    if not x_signature:
        raise HTTPException(status_code=400, detail="Missing X-Signature header")

    # 1. Read raw body for signature verification
    raw_body = await request.body()
    
    # 2. Compute HMAC SHA-256 signature
    digest = hmac.new(
        key=LEMON_SECRET.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256
    ).hexdigest()

    # 3. Verify Signature securely
    if not hmac.compare_digest(digest, x_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    # 4. Parse JSON and execute logic
    try:
        data = json.loads(raw_body.decode("utf-8"))
        event_name = data.get("meta", {}).get("event_name", "")

        print(f"[Webhook] Received validated Lemon Squeezy event: {event_name}")

        if event_name == "subscription_created":
            custom_data = data.get("meta", {}).get("custom_data", {})
            user_id = custom_data.get("user_id")
            
            if not user_id:
                print("[Webhook] Error: Received subscription but no custom user_id attached!")
                raise HTTPException(status_code=400, detail="No user_id found in custom_data")
            
            # Officially upgrade user in the database
            upgrade_to_pro(user_id)
            print(f"[Webhook] Success! Upgraded user {user_id} to PRO via Lemon Squeezy.")

        return {"status": "success"}

    except Exception as e:
        print(f"[Webhook] Processing error: {e}")
        raise HTTPException(status_code=500, detail="Error processing webhook payload")
