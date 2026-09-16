import sqlite3
from typing import Literal

from fastapi import APIRouter, HTTPException, Request
from pydantic import AwareDatetime, BaseModel, Field, HttpUrl

from cinema.api.deps import conn_of, require_admin, require_same_site, settings_of
from cinema.club import art, events, films, rsvps
from cinema.db import club_repo

router = APIRouter(tags=["club-admin"])


class ScreeningIn(BaseModel):
    item_id: str | None = Field(default=None, max_length=64)
    title: str = Field(default="", max_length=200)
    year: int | None = Field(default=None, ge=1880, le=2100)
    art_url: HttpUrl | None = None
    message: str = Field(default="", max_length=600)
    description: str = Field(default="", max_length=3000)
    starts_at: AwareDatetime
    location: str = Field(default="", max_length=200)
    status: Literal["draft", "published", "cancelled"] = "draft"


class StatusIn(BaseModel):
    status: Literal["new", "shortlisted", "scheduled", "declined"]


def _text(value: str) -> str | None:
    return value.strip() or None


def _url(value: HttpUrl | None) -> str | None:
    return str(value) if value else None


def _fields(conn: sqlite3.Connection, body: ScreeningIn) -> dict:
    try:
        film = films.resolve(conn, body.item_id, body.title, body.year)
    except films.FilmProblem as error:
        raise HTTPException(422, str(error)) from error
    return {
        "item_id": film["item_id"],
        "title": film["title"],
        "year": film["year"],
        "art_url": None if film["item_id"] else _url(body.art_url),
        "description": _text(body.description) or film["overview"],
        "message": _text(body.message),
        "starts_at": events.canonical(body.starts_at),
        "location": _text(body.location),
        "status": body.status,
    }


async def _refresh_art(request: Request, event_id: int, before: sqlite3.Row | None) -> None:
    conn, data_dir = conn_of(request), settings_of(request).data_dir
    row = club_repo.get_event(conn, event_id)
    unchanged = before is not None and before["art_url"] == row["art_url"] and row["art_version"]
    if unchanged:
        return
    art.remove_art(data_dir, event_id)
    version = await art.cache_art(row["art_url"], event_id, data_dir) if row["art_url"] else None
    club_repo.set_art_version(conn, event_id, version)


def _screening(request: Request, event_id: int) -> dict:
    return {"screening": events.admin(club_repo.get_event(conn_of(request), event_id))}


def _existing(request: Request, event_id: int) -> sqlite3.Row:
    row = club_repo.get_event(conn_of(request), event_id)
    if row is None:
        raise HTTPException(404, "no such screening")
    return row


@router.get("/club/admin/overview")
async def overview(request: Request) -> dict:
    session = require_admin(request)
    return {"name": session.name}


@router.get("/club/admin/events")
async def list_screenings(request: Request) -> dict:
    require_admin(request)
    conn = conn_of(request)
    counts = club_repo.rsvp_counts(conn)
    return {
        "screenings": [
            {**events.admin(row), "rsvps": rsvps.totals(counts.get(row["id"]))}
            for row in club_repo.list_events(conn)
        ]
    }


@router.post("/club/admin/events", status_code=201)
async def create_screening(request: Request, body: ScreeningIn) -> dict:
    require_same_site(request)
    require_admin(request)
    event_id = club_repo.insert_event(conn_of(request), _fields(conn_of(request), body))
    await _refresh_art(request, event_id, None)
    return _screening(request, event_id)


@router.post("/club/admin/events/{event_id}")
async def update_screening(request: Request, event_id: int, body: ScreeningIn) -> dict:
    require_same_site(request)
    require_admin(request)
    before = _existing(request, event_id)
    club_repo.update_event(conn_of(request), event_id, _fields(conn_of(request), body))
    await _refresh_art(request, event_id, before)
    return _screening(request, event_id)


@router.post("/club/admin/events/{event_id}/delete")
async def delete_screening(request: Request, event_id: int) -> dict:
    require_same_site(request)
    require_admin(request)
    _existing(request, event_id)
    club_repo.delete_event(conn_of(request), event_id)
    club_repo.delete_event_rsvps(conn_of(request), event_id)
    art.remove_art(settings_of(request).data_dir, event_id)
    return {"deleted": event_id}


@router.get("/club/admin/events/{event_id}/rsvps")
async def screening_rsvps(request: Request, event_id: int) -> dict:
    require_admin(request)
    _existing(request, event_id)
    rows = club_repo.list_rsvps(conn_of(request), event_id)
    counts = club_repo.rsvp_counts(conn_of(request)).get(event_id)
    return {"rsvps": [rsvps.admin_rsvp(row) for row in rows], "totals": rsvps.totals(counts)}


@router.post("/club/admin/rsvps/{rsvp_id}/delete")
async def delete_rsvp(request: Request, rsvp_id: int) -> dict:
    require_same_site(request)
    require_admin(request)
    if not club_repo.delete_rsvp(conn_of(request), rsvp_id):
        raise HTTPException(404, "no such rsvp")
    return {"deleted": rsvp_id}


@router.get("/club/admin/suggestions")
async def list_suggestions(request: Request) -> dict:
    require_admin(request)
    rows = club_repo.list_suggestions(conn_of(request))
    return {"suggestions": [rsvps.admin_suggestion(row) for row in rows]}


@router.post("/club/admin/suggestions/{suggestion_id}")
async def set_suggestion_status(request: Request, suggestion_id: int, body: StatusIn) -> dict:
    require_same_site(request)
    require_admin(request)
    if not club_repo.set_suggestion_status(conn_of(request), suggestion_id, body.status):
        raise HTTPException(404, "no such suggestion")
    return {"id": suggestion_id, "status": body.status}


@router.post("/club/admin/suggestions/{suggestion_id}/delete")
async def delete_suggestion(request: Request, suggestion_id: int) -> dict:
    require_same_site(request)
    require_admin(request)
    if not club_repo.delete_suggestion(conn_of(request), suggestion_id):
        raise HTTPException(404, "no such suggestion")
    return {"deleted": suggestion_id}
