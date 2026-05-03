from fastapi import APIRouter

from app.api.deps import CurrentUserDep
from app.api.v1.schemas.analytics import AnalyticsOverviewResponse
from app.services.analytics_service import build_analytics_overview


router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_analytics_overview(current_user: CurrentUserDep):
    return await build_analytics_overview(current_user.id)
