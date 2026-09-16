from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

IMMUTABLE = "public, max-age=31536000, immutable"
SHORT = "public, max-age=300"
_POLICY = {
    "/api/posters/": IMMUTABLE,
    "/api/thumbs/": IMMUTABLE,
    "/api/club-art/": IMMUTABLE,
    "/api/atlases/index.json": SHORT,
    "/api/atlases/": IMMUTABLE,
}


def _policy_for(path: str) -> str | None:
    return next((v for k, v in _POLICY.items() if path.startswith(k)), None)


class CacheHeaderMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        policy = _policy_for(request.url.path)
        response.headers.update({"Cache-Control": policy} if policy else {})
        return response


def mount_static(app: FastAPI, data_dir: Path) -> None:
    for name in ("posters", "thumbs", "atlases", "club-art"):
        (data_dir / name).mkdir(parents=True, exist_ok=True)
        app.mount(f"/api/{name}", StaticFiles(directory=data_dir / name), name=name)
    app.add_middleware(CacheHeaderMiddleware)
