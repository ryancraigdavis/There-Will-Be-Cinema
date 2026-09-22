import json
import sqlite3
from collections.abc import Iterable
from datetime import UTC, datetime

from cinema.emby.models import CollectionRow, ItemRow

_ITEM_COLUMNS = (
    "id",
    "type",
    "title",
    "sort_title",
    "year",
    "overview",
    "runtime_min",
    "community_rating",
    "official_rating",
    "genres",
    "primary_genre",
    "tags",
    "provider_ids",
    "date_created",
    "date_last_saved",
    "image_tag",
    "is_4k",
    "hdr_format",
    "dv_profile",
    "has_atmos",
    "has_dtsx",
    "audio_codec_summary",
    "width",
    "height",
    "file_size",
    "container",
    "video_codec",
    "child_count",
)
_JSON_COLUMNS = {"genres", "tags", "provider_ids"}
_UPSERT_ITEM = (
    f"INSERT INTO items ({', '.join(_ITEM_COLUMNS)}, deleted) "
    f"VALUES ({', '.join(':' + c for c in _ITEM_COLUMNS)}, 0) "
    "ON CONFLICT(id) DO UPDATE SET "
    + ", ".join(f"{c}=excluded.{c}" for c in _ITEM_COLUMNS if c != "id")
    + ", deleted=0"
)


def _now() -> str:
    return datetime.now(UTC).isoformat()


def _item_params(row: ItemRow) -> dict:
    data = row.model_dump()
    return {c: (json.dumps(data[c]) if c in _JSON_COLUMNS else data[c]) for c in _ITEM_COLUMNS}


def upsert_items(conn: sqlite3.Connection, rows: Iterable[ItemRow]) -> int:
    params = [_item_params(r) for r in rows]
    with conn:
        conn.executemany(_UPSERT_ITEM, params)
    return len(params)


def mark_deleted_except(conn: sqlite3.Connection, keep_ids: Iterable[str]) -> int:
    ids = list(keep_ids)
    with conn:
        conn.execute("CREATE TEMP TABLE IF NOT EXISTS keep (id TEXT PRIMARY KEY)")
        conn.execute("DELETE FROM keep")
        conn.executemany("INSERT OR IGNORE INTO keep (id) VALUES (?)", [(i,) for i in ids])
        cur = conn.execute(
            "UPDATE items SET deleted=1 WHERE deleted=0 AND id NOT IN (SELECT id FROM keep)"
        )
    return cur.rowcount


def replace_collections(conn: sqlite3.Connection, collections: Iterable[CollectionRow]) -> int:
    rows = list(collections)
    with conn:
        conn.execute("DELETE FROM collection_items")
        conn.execute("DELETE FROM collections")
        conn.executemany(
            "INSERT INTO collections (id, name, overview, image_tag, sort_order) "
            "VALUES (?, ?, ?, ?, ?)",
            [(c.id, c.name, c.overview, c.image_tag, i) for i, c in enumerate(rows)],
        )
        conn.executemany(
            "INSERT OR IGNORE INTO collection_items (collection_id, item_id, position) "
            "VALUES (?, ?, ?)",
            [(c.id, item, pos) for c in rows for pos, item in enumerate(c.item_ids)],
        )
    return len(rows)


def list_items(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    return conn.execute(
        "SELECT * FROM items WHERE deleted=0 ORDER BY type, primary_genre, sort_title, id"
    ).fetchall()


def list_collections(conn: sqlite3.Connection) -> list[dict]:
    cols = conn.execute("SELECT * FROM collections ORDER BY sort_order").fetchall()
    links = conn.execute(
        "SELECT ci.collection_id, ci.item_id FROM collection_items ci "
        "JOIN items i ON i.id = ci.item_id AND i.deleted=0 ORDER BY ci.position"
    ).fetchall()
    by_col: dict[str, list[str]] = {c["id"]: [] for c in cols}
    for link in links:
        by_col.setdefault(link["collection_id"], []).append(link["item_id"])
    return [{**dict(c), "item_ids": by_col[c["id"]]} for c in cols]


def get_meta(conn: sqlite3.Connection, key: str) -> str | None:
    row = conn.execute("SELECT value FROM meta WHERE key = ?", (key,)).fetchone()
    return row["value"] if row else None


def set_meta(conn: sqlite3.Connection, key: str, value: str) -> None:
    with conn:
        conn.execute(
            "INSERT INTO meta (key, value) VALUES (?, ?) "
            "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            (key, value),
        )


def item_count(conn: sqlite3.Connection) -> int:
    return conn.execute("SELECT COUNT(*) FROM items WHERE deleted=0").fetchone()[0]


def posters_needed(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    return conn.execute(
        "SELECT i.id, i.image_tag FROM items i LEFT JOIN posters p ON p.item_id = i.id "
        "WHERE i.deleted=0 AND i.image_tag IS NOT NULL "
        "AND (p.image_tag IS NULL OR p.image_tag != i.image_tag)"
    ).fetchall()


def record_poster(conn: sqlite3.Connection, item_id: str, image_tag: str) -> None:
    with conn:
        conn.execute(
            "INSERT INTO posters (item_id, image_tag, fetched_at) VALUES (?, ?, ?) "
            "ON CONFLICT(item_id) DO UPDATE SET image_tag=excluded.image_tag, "
            "fetched_at=excluded.fetched_at",
            (item_id, image_tag, _now()),
        )


def poster_slots(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    return conn.execute(
        "SELECT i.id, p.image_tag FROM items i JOIN posters p ON p.item_id = i.id "
        "AND p.image_tag = i.image_tag WHERE i.deleted=0 "
        "ORDER BY i.type, i.primary_genre, i.sort_title, i.id"
    ).fetchall()


def newest_movies(conn: sqlite3.Connection, limit: int) -> list[sqlite3.Row]:
    return conn.execute(
        "SELECT i.id, p.image_tag FROM items i JOIN posters p ON p.item_id = i.id "
        "AND p.image_tag = i.image_tag WHERE i.deleted=0 AND i.type='Movie' "
        "ORDER BY i.date_created DESC, i.id LIMIT ?",
        (limit,),
    ).fetchall()


def start_sync_run(conn: sqlite3.Connection, mode: str) -> int:
    with conn:
        cur = conn.execute(
            "INSERT INTO sync_runs (mode, started_at, status) VALUES (?, ?, 'running')",
            (mode, _now()),
        )
    return int(cur.lastrowid or 0)


def finish_sync_run(conn: sqlite3.Connection, run_id: int, status: str, **counts: object) -> None:
    fields = {"finished_at": _now(), "status": status, **counts}
    assignments = ", ".join(f"{k}=:{k}" for k in fields)
    with conn:
        conn.execute(f"UPDATE sync_runs SET {assignments} WHERE id=:id", {**fields, "id": run_id})


def last_successful_sync(conn: sqlite3.Connection) -> sqlite3.Row | None:
    return conn.execute(
        "SELECT * FROM sync_runs WHERE status='ok' ORDER BY id DESC LIMIT 1"
    ).fetchone()
