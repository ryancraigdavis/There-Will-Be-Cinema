import gzip
import hashlib
import json
import sqlite3
from dataclasses import dataclass
from pathlib import Path

from cinema.catalog.schemas import compact_collection, compact_item
from cinema.db import repo
from cinema.sync.atlas import current_version


@dataclass(frozen=True)
class CatalogPayload:
    etag: str
    body_gzip: bytes
    item_count: int


class CatalogCache:
    def __init__(self, conn: sqlite3.Connection, data_dir: Path) -> None:
        self._conn = conn
        self._data_dir = data_dir
        self._payload: CatalogPayload | None = None
        self._collections: bytes | None = None

    def invalidate(self) -> None:
        self._payload = None
        self._collections = None

    def _build(self) -> CatalogPayload:
        items = [compact_item(r) for r in repo.list_items(self._conn)]
        version = current_version(self._data_dir) or "none"
        body = json.dumps({"atlas": version, "items": items}, separators=(",", ":")).encode()
        etag = '"' + hashlib.sha1(body).hexdigest()[:20] + '"'
        return CatalogPayload(etag=etag, body_gzip=gzip.compress(body, 6), item_count=len(items))

    def payload(self) -> CatalogPayload:
        self._payload = self._payload or self._build()
        return self._payload

    def collections(self) -> bytes:
        built = json.dumps(
            [compact_collection(c) for c in repo.list_collections(self._conn)],
            separators=(",", ":"),
        ).encode()
        self._collections = self._collections or built
        return self._collections
