import secrets
from typing import Literal

from fastapi import APIRouter, Header, HTTPException, Request

from cinema.api.deps import runner_of, settings_of

router = APIRouter(tags=["admin"])


def _require_token(request: Request, authorization: str | None) -> None:
    expected = f"Bearer {settings_of(request).admin_token}"
    ok = authorization is not None and secrets.compare_digest(authorization, expected)
    if not ok:
        raise HTTPException(status_code=401, detail="invalid admin token")


@router.post("/admin/sync", status_code=202)
async def trigger_sync(
    request: Request,
    mode: Literal["full", "incremental"] | None = None,
    authorization: str | None = Header(default=None),
) -> dict:
    _require_token(request, authorization)
    runner = runner_of(request)
    queued = not runner.running
    runner.trigger(mode) if queued else None
    return {"status": "queued" if queued else "already_running", "mode": mode}
