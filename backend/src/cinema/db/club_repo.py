import sqlite3
from datetime import UTC, datetime

EVENT_FIELDS = (
    "item_id",
    "title",
    "year",
    "art_url",
    "message",
    "description",
    "starts_at",
    "location",
    "status",
)
_SELECT_EVENT = (
    "SELECT e.*, i.image_tag, i.runtime_min FROM club_events e "
    "LEFT JOIN items i ON i.id = e.item_id AND i.deleted = 0"
)


def _now() -> str:
    return datetime.now(UTC).isoformat()


def film(conn: sqlite3.Connection, item_id: str) -> sqlite3.Row | None:
    return conn.execute(
        "SELECT id, title, year, overview FROM items WHERE id = ? AND deleted = 0", (item_id,)
    ).fetchone()


def insert_event(conn: sqlite3.Connection, fields: dict) -> int:
    now = _now()
    columns = ", ".join(EVENT_FIELDS)
    values = ", ".join(f":{name}" for name in EVENT_FIELDS)
    with conn:
        cursor = conn.execute(
            f"INSERT INTO club_events ({columns}, created_at, updated_at) "
            f"VALUES ({values}, :now, :now)",
            {**fields, "now": now},
        )
    return int(cursor.lastrowid)


def update_event(conn: sqlite3.Connection, event_id: int, fields: dict) -> bool:
    assignments = ", ".join(f"{name} = :{name}" for name in EVENT_FIELDS)
    with conn:
        cursor = conn.execute(
            f"UPDATE club_events SET {assignments}, updated_at = :now WHERE id = :id",
            {**fields, "now": _now(), "id": event_id},
        )
    return cursor.rowcount > 0


def set_art_version(conn: sqlite3.Connection, event_id: int, version: str | None) -> None:
    with conn:
        conn.execute("UPDATE club_events SET art_version = ? WHERE id = ?", (version, event_id))


def delete_event(conn: sqlite3.Connection, event_id: int) -> bool:
    with conn:
        cursor = conn.execute("DELETE FROM club_events WHERE id = ?", (event_id,))
    return cursor.rowcount > 0


def get_event(conn: sqlite3.Connection, event_id: int) -> sqlite3.Row | None:
    return conn.execute(f"{_SELECT_EVENT} WHERE e.id = ?", (event_id,)).fetchone()


def list_events(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    return conn.execute(f"{_SELECT_EVENT} ORDER BY e.starts_at DESC, e.id DESC").fetchall()


def upcoming_events(conn: sqlite3.Connection, since: str, limit: int) -> list[sqlite3.Row]:
    return conn.execute(
        f"{_SELECT_EVENT} WHERE e.status = 'published' AND e.starts_at >= ? "
        "ORDER BY e.starts_at, e.id LIMIT ?",
        (since, limit),
    ).fetchall()
