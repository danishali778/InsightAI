from fastapi import APIRouter

from analytics import build_analytics_overview


router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview")
def get_analytics_overview():
    return build_analytics_overview()
