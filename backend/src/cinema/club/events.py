import sqlite3
from datetime import UTC, datetime, timedelta
from urllib.parse import quote

SHOWING_FOR = timedelta(hours=4)


def canonical(moment: datetime) -> str:
    return moment.astimezone(UTC).replace(microsecond=0).isoformat()


def cutoff(now: datetime) -> str:
    return canonical(now - SHOWING_FOR)


def poster_url(row: sqlite3.Row) -> str | None:
    choices = [
        (
            bool(row["item_id"] and row["image_tag"]),
            f"/api/posters/{quote(str(row['item_id']))}.webp?v={row['image_tag']}",
        ),
        (bool(row["art_version"]), f"/api/club-art/{row['id']}.webp?v={row['art_version']}"),
    ]
    return next((url for usable, url in choices if usable), None)


def public(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "year": row["year"],
        "starts_at": row["starts_at"],
        "location": row["location"],
        "message": row["message"],
        "description": row["description"],
        "item_id": row["item_id"],
        "poster_url": poster_url(row),
        "runtime_min": row["runtime_min"],
    }


def admin(row: sqlite3.Row) -> dict:
    return {
        **public(row),
        "status": row["status"],
        "art_url": row["art_url"],
        "updated_at": row["updated_at"],
    }
