import time
from urllib.parse import urlsplit

from fastapi import HTTPException, Request

from cinema.catalog.cache import CatalogCache
from cinema.club import sessions
from cinema.club.sessions import Session
from cinema.club.throttle import Throttle, TooManyAttempts
from cinema.config import Settings
from cinema.sync.scheduler import SyncRunner


def settings_of(request: Request) -> Settings:
    return request.app.state.settings


def cache_of(request: Request) -> CatalogCache:
    return request.app.state.cache


def runner_of(request: Request) -> SyncRunner:
    return request.app.state.runner


def conn_of(request: Request):
    return request.app.state.conn


def throttle_of(request: Request) -> Throttle:
    return request.app.state.login_throttle


def limit_posts(request: Request) -> None:
    keys, now = [f"ip:{client_address(request)}"], time.time()
    throttle = request.app.state.post_throttle
    try:
        throttle.check(keys, now)
    except TooManyAttempts as error:
        raise HTTPException(429, "too many submissions, try again in a few minutes") from error
    throttle.record(keys, now)


def session_of(request: Request) -> Session | None:
    token = request.cookies.get(sessions.COOKIE, "")
    try:
        session = sessions.read(token, settings_of(request).session_secret, time.time())
    except ValueError:
        session = None
    return session


def require_admin(request: Request) -> Session:
    session = session_of(request)
    if not sessions.is_admin(session, settings_of(request).club_admin_names):
        raise HTTPException(status_code=403 if session else 401, detail="club admins only")
    return session


def _hostname(value: str) -> str:
    return (urlsplit(value if "//" in value else f"//{value}").hostname or "").casefold()


def require_same_site(request: Request) -> None:
    origin = request.headers.get("origin")
    trusted = {
        _hostname(request.headers.get("host", "")),
        _hostname(request.headers.get("x-forwarded-host", "")),
        _hostname(settings_of(request).frontend_origin),
    }
    if origin is not None and _hostname(origin) not in trusted:
        raise HTTPException(status_code=403, detail="cross-site request refused")


def client_address(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    return forwarded or (request.client.host if request.client else "unknown")
