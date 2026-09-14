import asyncio
import sqlite3
from datetime import UTC, datetime, timedelta
from pathlib import Path

import structlog

from cinema.db import repo
from cinema.emby.client import EmbyClient
from cinema.emby.parse import flatten_collection, flatten_item
from cinema.sync import atlas, posters

log = structlog.get_logger()
BATCH = 200
POSTER_CONCURRENCY = 4
INCREMENTAL_OVERLAP = timedelta(hours=1)


def choose_mode(conn: sqlite3.Connection, requested: str | None) -> str:
    empty = repo.item_count(conn) == 0
    return requested or ("full" if empty else "incremental")


def since_for(conn: sqlite3.Connection, mode: str) -> str | None:
    last = repo.last_successful_sync(conn)
    started = datetime.fromisoformat(last["started_at"]) if last else datetime.now(UTC)
    return None if mode == "full" else (started - INCREMENTAL_OVERLAP).isoformat()


async def sync_items(conn: sqlite3.Connection, client: EmbyClient, since: str | None) -> list[str]:
    seen: list[str] = []
    batch = []
    async for raw in client.iter_items(since=since):
        batch.append(flatten_item(raw))
        seen.append(str(raw["Id"]))
        batch = batch if len(batch) < BATCH else _flush(conn, batch)
    _flush(conn, batch)
    return seen


def _flush(conn: sqlite3.Connection, batch: list) -> list:
    repo.upsert_items(conn, batch)
    return []


async def sync_collections(conn: sqlite3.Connection, client: EmbyClient) -> int:
    boxsets = await client.boxsets()
    children = await asyncio.gather(*(client.boxset_children(str(b["Id"])) for b in boxsets))
    rows = [flatten_collection(b, ids) for b, ids in zip(boxsets, children, strict=True)]
    return repo.replace_collections(conn, rows)


async def sync_posters(conn: sqlite3.Connection, client: EmbyClient, data_dir: Path) -> int:
    needed = repo.posters_needed(conn)
    sem = asyncio.Semaphore(POSTER_CONCURRENCY)
    results = await asyncio.gather(
        *(posters.fetch_poster(client, r["id"], r["image_tag"], data_dir, sem) for r in needed),
        return_exceptions=True,
    )
    fetched = [r for r, ok in zip(needed, results, strict=True) if ok is True]
    for row in fetched:
        repo.record_poster(conn, row["id"], row["image_tag"])
    return len(fetched)


async def rebuild_atlases(conn: sqlite3.Connection, data_dir: Path) -> str:
    slots = [(r["id"], r["image_tag"]) for r in repo.poster_slots(conn)]
    version = atlas.atlas_version(slots)
    stale = version != atlas.current_version(data_dir) or not atlas.levels_complete(data_dir)
    await asyncio.to_thread(atlas.build_atlases, data_dir, slots) if stale else None
    return version


async def run_sync(
    conn: sqlite3.Connection,
    client: EmbyClient,
    data_dir: Path,
    requested: str | None = None,
) -> dict:
    mode = choose_mode(conn, requested)
    run_id = repo.start_sync_run(conn, mode)
    log.info("sync_start", mode=mode, run_id=run_id)
    try:
        seen = await sync_items(conn, client, since_for(conn, mode))
        removed = repo.mark_deleted_except(conn, seen) if mode == "full" else 0
        collections = await sync_collections(conn, client)
        fetched = await sync_posters(conn, client, data_dir)
        version = await rebuild_atlases(conn, data_dir)
    except Exception as exc:
        repo.finish_sync_run(conn, run_id, "error", error=repr(exc))
        log.error("sync_failed", run_id=run_id, exc_info=exc)
        raise
    repo.finish_sync_run(
        conn, run_id, "ok", items_seen=len(seen), items_changed=removed, posters_fetched=fetched
    )
    summary = {
        "run_id": run_id,
        "mode": mode,
        "items_seen": len(seen),
        "removed": removed,
        "collections": collections,
        "posters_fetched": fetched,
        "atlas_version": version,
    }
    log.info("sync_done", **summary)
    return summary
