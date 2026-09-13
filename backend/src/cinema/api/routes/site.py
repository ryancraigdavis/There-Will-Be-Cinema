from fastapi import APIRouter, Request

from cinema.api.deps import settings_of

router = APIRouter(tags=["site"])


@router.get("/site")
async def site(request: Request) -> dict:
    settings = settings_of(request)
    return {
        "emby_url": settings.emby_public,
        "emby_server_id": await request.app.state.emby.server_id(),
        "club_url": settings.club_url,
    }
