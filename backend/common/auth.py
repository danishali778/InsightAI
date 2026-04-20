import os
import logging
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
from dotenv import load_dotenv
from database.retry import async_supabase_retry

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# BACKEND_DEV_MODE is the authoritative toggle for mock auth.
# It must be set explicitly — the frontend's VITE_DEV_MODE is NOT used here
# to avoid accidental mock auth activation in production environments.
BACKEND_DEV_MODE = os.getenv("BACKEND_DEV_MODE", "false").lower() == "true"

# ---------------------------------------------------------------------------
# Hard guard: Refuse mock auth if JWT secret is present.
# This prevents a misconfigured production environment (e.g. BACKEND_DEV_MODE
# accidentally set to true) from silently bypassing authentication.
# ---------------------------------------------------------------------------
if BACKEND_DEV_MODE and SUPABASE_JWT_SECRET:
    logger.warning(
        "⚠️  BACKEND_DEV_MODE=true but SUPABASE_JWT_SECRET is configured. "
        "Mock auth is DISABLED — real JWT verification will be enforced. "
        "To use mock auth, remove SUPABASE_JWT_SECRET from your environment."
    )
    _MOCK_AUTH_ACTIVE = False
elif BACKEND_DEV_MODE:
    logger.warning(
        "⚠️  BACKEND_DEV_MODE=true and no SUPABASE_JWT_SECRET found. "
        "Mock authentication is ACTIVE. Do NOT use this configuration in production."
    )
    _MOCK_AUTH_ACTIVE = True
else:
    _MOCK_AUTH_ACTIVE = False

security = HTTPBearer(auto_error=not _MOCK_AUTH_ACTIVE)


class User(BaseModel):
    id: str
    email: Optional[str] = None


# Mock User — only used when _MOCK_AUTH_ACTIVE is True
MOCK_USER = User(
    id="00000000-0000-0000-0000-000000000000",
    email="dev@insightai.com"
)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    verify_existence: bool = True,
) -> User:
    """
    FastAPI dependency that extracts and verifies the user from a Supabase JWT.

    Authentication flow:
      1. If BACKEND_DEV_MODE=true AND no SUPABASE_JWT_SECRET → return MOCK_USER (local dev only)
      2. If BACKEND_DEV_MODE=true AND SUPABASE_JWT_SECRET is set → enforce real JWT (hard guard)
      3. Production: always enforce real JWT, never fall back to mock
    """
    if _MOCK_AUTH_ACTIVE and not credentials:
        return MOCK_USER

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
        )

    token = credentials.credentials

    try:
        if not SUPABASE_JWT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication server misconfigured (missing JWT secret)",
            )

        # Decode and verify the Supabase JWT
        # Supabase uses HS256 by default, but newer projects use ES256 (ECC P-256)
        key = SUPABASE_JWT_SECRET
        try:
            import json
            trimmed_secret = SUPABASE_JWT_SECRET.strip()
            if trimmed_secret.startswith('{') and trimmed_secret.endswith('}'):
                key = json.loads(trimmed_secret)
        except Exception:
            key = SUPABASE_JWT_SECRET

        payload = jwt.decode(
            token,
            key,
            algorithms=["HS256", "ES256"],
            audience="authenticated",
        )

        user_id: str = payload.get("sub")
        email: str = payload.get("email")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        # --- DATABASE TRUTH CHECK ---
        if not _MOCK_AUTH_ACTIVE and verify_existence:
            try:
                from database.supabase_client import async_supabase
                from database.retry import async_supabase_retry

                @async_supabase_retry
                async def check_user():
                    return await async_supabase.table("user_settings").select("owner_id").eq("owner_id", user_id).execute()
                
                user_check = await check_user()
                if not user_check.data:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="User account has been deactivated or deleted.",
                    )
            except HTTPException:
                raise
            except Exception as db_err:
                logger.error("Authentication Database Error (Truth Check): %s", db_err, exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Auth system infrastructure error. Please try again later.",
                )

        return User(id=user_id, email=email)

    except JWTError as e:
        if _MOCK_AUTH_ACTIVE:
            logger.debug(
                "Auth: Invalid JWT in BACKEND_DEV_MODE, continuing with MOCK_USER. Error: %s", e
            )
            return MOCK_USER

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    except HTTPException:
        # Re-raise explicit HTTPExceptions (like the 401/500 from the Truth Check)
        raise

    except Exception as e:
        if _MOCK_AUTH_ACTIVE:
            return MOCK_USER
        
        # Log unexpected errors as 500s, not 401s, to avoid logout loops
        logger.error("Unexpected Auth Middleware Error: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal authentication service error.",
        )


async def get_user_no_check(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> User:
    """Dependency for endpoints that need auth but can skip the existence check (e.g. onboarding)."""
    return await get_current_user(credentials, verify_existence=False)
