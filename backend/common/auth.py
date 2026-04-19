import os
import logging
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
from dotenv import load_dotenv

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
    # Force real JWT verification when the secret is present, even in dev mode.
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
) -> User:
    """
    FastAPI dependency that extracts and verifies the user from a Supabase JWT.

    Authentication flow:
      1. If BACKEND_DEV_MODE=true AND no SUPABASE_JWT_SECRET → return MOCK_USER (local dev only)
      2. If BACKEND_DEV_MODE=true AND SUPABASE_JWT_SECRET is set → enforce real JWT (hard guard)
      3. Production: always enforce real JWT, never fall back to mock
    """
    # Allow mock auth only when explicitly activated with no secret present
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
            # In dev mode with no secret and no token this path is unreachable
            # (caught above). Reaching here means prod with missing secret.
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication server misconfigured (missing JWT secret)",
            )

        # Decode and verify the Supabase JWT
        # Supabase uses HS256 by default, but newer projects use ES256 (ECC P-256)
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
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

        return User(id=user_id, email=email)

    except JWTError as e:
        # In mock-auth dev mode with a bad token, log and fall back to mock user.
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
        raise

    except Exception:
        if _MOCK_AUTH_ACTIVE:
            return MOCK_USER
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )
