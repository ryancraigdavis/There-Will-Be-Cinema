import asyncio
import sqlite3
from pathlib import Path

import structlog

from cinema.catalog.cache import CatalogCache
from cinema.emby.client import EmbyClient
from cinema.sync.job import run_sync

log = structlog.get_logger()


class SyncRunner:
    def __init__(
        self,
        conn: sqlite3.Connection,
        client: EmbyClient,
        data_dir: Path,
        cache: CatalogCache,
        interval_hours: float,
    ) -> None:
        self._conn = conn
        self._client = client
        self._data_dir = data_dir
        self._cache = cache
        self._interval = interval_hours * 3600
        self._lock = asyncio.Lock()

    @property
    def running(self) -> bool:
        return self._lock.locked()

    async def run(self, mode: str | None = None) -> dict:
        async with self._lock:
            summary = await run_sync(self._conn, self._client, self._data_dir, mode)
        self._cache.invalidate()
        return summary

    async def run_guarded(self, mode: str | None = None) -> None:
        try:
            await self.run(mode)
        except Exception:
            log.warning("scheduled_sync_failed")

    async def loop(self) -> None:
        while True:
            await self.run_guarded()
            await asyncio.sleep(self._interval)

    def start(self) -> asyncio.Task:
        return asyncio.create_task(self.loop(), name="sync-loop")

    def trigger(self, mode: str | None) -> asyncio.Task:
        return asyncio.create_task(self.run_guarded(mode), name="sync-manual")
