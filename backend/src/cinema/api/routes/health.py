from fastapi import APIRouter, Request

from cinema.api.deps import conn_of
from cinema.db import repo

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(request: Request) -> dict:
    conn = conn_of(request)
    last = repo.last_successful_sync(conn)
    return {
        "status": "ok",
        "item_count": repo.item_count(conn),
        "last_sync": dict(last) if last else None,
        "sync_running": request.app.state.runner.running,
    }
