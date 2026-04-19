import os
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# Configuration
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
# Mirror the frontend VITE_DEV_MODE
DEV_MODE = os.getenv("VITE_DEV_MODE", "true").lower() == "true"

security = HTTPBearer(auto_error=not DEV_MODE)

class User(BaseModel):
    id: str
    email: Optional[str] = None

# Mock User for DEV_MODE
MOCK_USER = User(
    id="00000000-0000-0000-0000-000000000000",
    email="dev@insightai.com"
)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    verify_existence: bool = True
) -> User:
    """
    FastAPI dependency that extracts and verifies the user from a Supabase JWT.
    If DEV_MODE is True and no token is provided, returns a mock user.
    If verify_existence is True, it also checks the DB for user presence.
    """
    if DEV_MODE and not credentials:
        return MOCK_USER

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
        )

    token = credentials.credentials
    
    try:
        if not SUPABASE_JWT_SECRET:
            # If we don't have the secret, we can't verify locally.
            # In a real production environment, this would be a configuration error.
            if DEV_MODE:
                return MOCK_USER
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication server misconfigured (missing JWT secret)",
            )

        # Decode and verify the Supabase JWT
        # Supabase uses HS256 by default, but newer projects use ES256 (ECC P-256)
        key = SUPABASE_JWT_SECRET
        try:
            # If the secret looks like a JSON object (JWK), parse it
            import json
            trimmed_secret = SUPABASE_JWT_SECRET.strip()
            if trimmed_secret.startswith('{') and trimmed_secret.endswith('}'):
                key = json.loads(trimmed_secret)
        except Exception:
            # Fallback to raw secret if JSON parsing fails
            key = SUPABASE_JWT_SECRET

        payload = jwt.decode(
            token, 
            key, 
            algorithms=["HS256", "ES256"], 
            audience="authenticated"
        )
        
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
            
        # --- DATABASE TRUTH CHECK ---
        # If not in DEV_MODE, verify that the user actually exists in our DB
        if not DEV_MODE and verify_existence:
            from database.supabase_client import supabase
            # We check user_settings as our "Proof of Existence"
            user_check = supabase.table("user_settings").select("owner_id").eq("owner_id", user_id).execute()
            if not user_check.data:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User account has been deactivated or deleted.",
                )
            
        return User(id=user_id, email=email)

    except JWTError as e:
        if DEV_MODE:
            print(f"Auth Trace: Invalid JWT provided, but continuing with MOCK_USER because DEV_MODE=true. Error: {e}")
            return MOCK_USER
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
        )
    except Exception as e:
        if DEV_MODE:
            return MOCK_USER
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token"
        )


async def get_user_no_check(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> User:
    """Dependency for endpoints that need auth but can skip the existence check (e.g. onboarding)."""
    return await get_current_user(credentials, verify_existence=False)
