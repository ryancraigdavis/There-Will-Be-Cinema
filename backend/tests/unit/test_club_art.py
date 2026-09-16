from io import BytesIO

import httpx
import pytest
from PIL import Image

from cinema.club import art


def _png(size=(900, 1350)) -> bytes:
    buffer = BytesIO()
    Image.new("RGB", size, (120, 40, 20)).save(buffer, "PNG")
    return buffer.getvalue()


def _serving(response: httpx.Response) -> httpx.MockTransport:
    return httpx.MockTransport(lambda request: response)


async def test_caches_a_resized_webp(tmp_path):
    raw = _png()
    version = await art.cache_art(
        "https://img.example/poster.png", 3, tmp_path, _serving(httpx.Response(200, content=raw))
    )
    assert version and len(version) == 12
    with Image.open(art.art_path(tmp_path, 3)) as stored:
        assert stored.format == "WEBP"
        assert stored.width == art.ART_WIDTH


@pytest.mark.parametrize(
    "response",
    [
        pytest.param(httpx.Response(404), id="missing"),
        pytest.param(httpx.Response(200, content=b"<html>nope</html>"), id="not-an-image"),
        pytest.param(httpx.Response(200, content=b"x" * (art.MAX_BYTES + 1)), id="too-large"),
    ],
)
async def test_failures_store_nothing(tmp_path, response):
    version = await art.cache_art("https://img.example/p", 3, tmp_path, _serving(response))
    assert version is None
    assert not art.art_path(tmp_path, 3).exists()


async def test_unreachable_host(tmp_path):
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("down", request=request)

    transport = httpx.MockTransport(handler)
    assert await art.cache_art("https://img.example/p", 3, tmp_path, transport) is None


def test_remove_art_is_idempotent(tmp_path):
    art.remove_art(tmp_path, 99)
    path = art.art_path(tmp_path, 99)
    path.parent.mkdir(parents=True)
    path.write_bytes(b"x")
    art.remove_art(tmp_path, 99)
    assert not path.exists()
