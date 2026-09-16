import time

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, Field

from cinema.api.deps import (
    client_address,
    require_admin,
    require_same_site,
    session_of,
    settings_of,
    throttle_of,
)
from cinema.club import sessions
from cinema.club.throttle import TooManyAttempts
from cinema.emby.auth import EmbyUnavailable, InvalidLogin
from cinema.emby.models import EmbyUser

router = APIRouter(tags=["club"])


class Credentials(BaseModel):
    username: str = Field(min_length=1, max_length=128)
    password: str = Field(default="", max_length=512)


def _describe(request: Request, session: sessions.Session | None) -> dict:
    admins = settings_of(request).club_admin_names
    return {
        "name": session.name if session else None,
        "admin": sessions.is_admin(session, admins),
    }


def _throttle_keys(request: Request, username: str) -> list[str]:
    return [f"ip:{client_address(request)}", f"user:{username.strip().casefold()}"]


async def _verify(request: Request, credentials: Credentials) -> EmbyUser:
    throttle = throttle_of(request)
    keys = _throttle_keys(request, credentials.username)
    now = time.time()
    try:
        throttle.check(keys, now)
        user = await request.app.state.emby.authenticate(
            credentials.username.strip(), credentials.password
        )
    except TooManyAttempts as error:
        raise HTTPException(429, "too many sign-in attempts, try again in a few minutes") from error
    except InvalidLogin as error:
        throttle.fail(keys, now)
        raise HTTPException(401, "invalid username or password") from error
    except EmbyUnavailable as error:
        raise HTTPException(502, "the emby server did not answer") from error
    throttle.clear(keys)
    return user


@router.post("/club/login")
async def login(request: Request, response: Response, credentials: Credentials) -> dict:
    require_same_site(request)
    settings = settings_of(request)
    if not settings.session_secret:
        raise HTTPException(503, "sign-in is not configured")
    user = await _verify(request, credentials)
    token = sessions.issue(user.id, user.name, settings.session_secret, time.time())
    response.set_cookie(
        sessions.COOKIE,
        token,
        max_age=sessions.TTL_SECONDS,
        httponly=True,
        samesite="lax",
        secure=settings.secure_cookies,
        path="/",
    )
    return _describe(request, sessions.read(token, settings.session_secret, time.time()))


@router.post("/club/logout")
async def logout(request: Request, response: Response) -> dict:
    require_same_site(request)
    response.delete_cookie(sessions.COOKIE, path="/")
    return {"name": None, "admin": False}


@router.get("/club/me")
async def me(request: Request) -> dict:
    return _describe(request, session_of(request))


@router.get("/club/admin/overview")
async def admin_overview(request: Request) -> dict:
    session = require_admin(request)
    return {"name": session.name}
