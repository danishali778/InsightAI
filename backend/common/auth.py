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

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> User:
    """
    FastAPI dependency that extracts and verifies the user from a Supabase JWT.
    If DEV_MODE is True and no token is provided, returns a mock user.
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
        payload = jwt.decode(
            token, 
            SUPABASE_JWT_SECRET, 
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
