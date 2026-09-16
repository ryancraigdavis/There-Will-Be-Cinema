import json
import sqlite3
from collections.abc import AsyncIterator
from io import BytesIO
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from cinema.config import Settings
from cinema.db.connection import connect
from cinema.emby.auth import InvalidLogin
from cinema.emby.models import EmbyUser
from cinema.main import create_app

FIXTURES = Path(__file__).parent / "fixtures"
EMBY_ACCOUNTS = {
    "ryan": ("projector", EmbyUser(id="u-ryan", name="Ryan")),
    "guest": ("", EmbyUser(id="u-guest", name="Guest")),
}


def _png(color: tuple[int, int, int]) -> bytes:
    buf = BytesIO()
    Image.new("RGB", (200, 300), color).save(buf, "PNG")
    return buf.getvalue()


class FakeEmby:
    def __init__(self, items: list[dict], boxsets: list[dict]) -> None:
        self.items = items
        self.boxsets_data = boxsets
        self.image_calls: list[tuple[str, str]] = []
        self.since_calls: list[str | None] = []

    async def close(self) -> None:
        return None

    async def server_id(self) -> str | None:
        return "server-1"

    async def authenticate(self, username: str, password: str) -> EmbyUser:
        expected, user = EMBY_ACCOUNTS.get(username.casefold(), (None, None))
        if user is None or password != expected:
            raise InvalidLogin(username)
        return user

    async def iter_items(self, since: str | None = None, **_: object) -> AsyncIterator[dict]:
        self.since_calls.append(since)
        for item in self.items:
            yield item

    async def all_ids(self, **_: object) -> list[str]:
        return [str(item["Id"]) for item in self.items]

    async def boxsets(self) -> list[dict]:
        return [{k: v for k, v in b.items() if k != "children"} for b in self.boxsets_data]

    async def boxset_children(self, parent_id: str) -> list[str]:
        return next(b["children"] for b in self.boxsets_data if b["Id"] == parent_id)

    async def image_bytes(self, item_id: str, tag: str, max_width: int) -> bytes | None:
        self.image_calls.append((item_id, tag))
        return None if item_id == "missing" else _png((120, 40, 20))


@pytest.fixture
def emby_items() -> list[dict]:
    return json.loads((FIXTURES / "emby_items.json").read_text())


@pytest.fixture
def emby_boxsets() -> list[dict]:
    return json.loads((FIXTURES / "emby_boxsets.json").read_text())


@pytest.fixture
def fake_emby(emby_items, emby_boxsets) -> FakeEmby:
    return FakeEmby(emby_items, emby_boxsets)


@pytest.fixture
def data_dir(tmp_path: Path) -> Path:
    return tmp_path / "data"


@pytest.fixture
def conn(data_dir: Path) -> sqlite3.Connection:
    connection = connect(data_dir)
    yield connection
    connection.close()


@pytest.fixture
def settings(data_dir: Path) -> Settings:
    return Settings(
        emby_server_url="http://emby.test",
        emby_server_api="key",
        admin_token="secret-token",
        data_dir=data_dir,
        sync_interval_hours=1000,
        session_secret="test-session-secret",
        club_admins="Ryan",
    )


@pytest.fixture
def api(settings: Settings, fake_emby: FakeEmby) -> TestClient:
    with TestClient(create_app(settings, fake_emby)) as client:
        yield client
