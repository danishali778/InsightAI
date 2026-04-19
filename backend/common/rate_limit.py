from fastapi import Depends, HTTPException, status
from common.auth import get_current_user, User
from settings_page.store import increment_usage

class RateLimitChecker:
    def __init__(self, limit_type: str):
        """limit_type should be 'query' or 'ai'"""
        self.limit_type = limit_type
        
    def __call__(self, current_user: User = Depends(get_current_user)):
        success = increment_usage(current_user.id, self.limit_type)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"{self.limit_type.upper()}_LIMIT_EXCEEDED"
            )
        return current_user
