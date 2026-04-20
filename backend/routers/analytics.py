from fastapi import APIRouter, Depends

from common.auth import get_current_user, User
from analytics import build_analytics_overview


router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview")
async def get_analytics_overview(current_user: User = Depends(get_current_user)):
    return await build_analytics_overview(current_user.id)
