import asyncio
import hashlib
from io import BytesIO
from pathlib import Path

import httpx
from PIL import Image, UnidentifiedImageError

ART_WIDTH = 600
MAX_BYTES = 12 * 1024 * 1024
TIMEOUT = 15.0
FAILURES = (
    httpx.HTTPError,
    OSError,
    ValueError,
    UnidentifiedImageError,
    Image.DecompressionBombError,
)


def art_dir(data_dir: Path) -> Path:
    return data_dir / "club-art"


def art_path(data_dir: Path, event_id: int) -> Path:
    return art_dir(data_dir) / f"{event_id}.webp"


def _write(raw: bytes, path: Path) -> None:
    image = Image.open(BytesIO(raw)).convert("RGB")
    image.thumbnail((ART_WIDTH, ART_WIDTH * 2), Image.Resampling.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "WEBP", quality=82)


async def _download(url: str, transport: httpx.AsyncBaseTransport | None) -> bytes:
    async with httpx.AsyncClient(
        timeout=TIMEOUT, follow_redirects=True, transport=transport
    ) as client:
        response = await client.get(url, headers={"User-Agent": "ThereWillBeCinema/1.0"})
        response.raise_for_status()
    if len(response.content) > MAX_BYTES:
        raise ValueError("image is too large")
    return response.content


async def cache_art(
    url: str,
    event_id: int,
    data_dir: Path,
    transport: httpx.AsyncBaseTransport | None = None,
) -> str | None:
    try:
        raw = await _download(url, transport)
        await asyncio.to_thread(_write, raw, art_path(data_dir, event_id))
        version = hashlib.sha1(raw).hexdigest()[:12]
    except FAILURES:
        version = None
    return version


def remove_art(data_dir: Path, event_id: int) -> None:
    art_path(data_dir, event_id).unlink(missing_ok=True)
