import asyncio
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps

from cinema.emby.client import EmbyClient

POSTER_WIDTH = 400
THUMB_SIZE = (128, 192)
WEBP_QUALITY = 80


def poster_dir(data_dir: Path) -> Path:
    return data_dir / "posters"


def thumb_dir(data_dir: Path) -> Path:
    return data_dir / "thumbs"


def write_variants(raw: bytes, item_id: str, data_dir: Path) -> None:
    poster_dir(data_dir).mkdir(parents=True, exist_ok=True)
    thumb_dir(data_dir).mkdir(parents=True, exist_ok=True)
    image = Image.open(BytesIO(raw)).convert("RGB")
    image.save(poster_dir(data_dir) / f"{item_id}.webp", "WEBP", quality=WEBP_QUALITY)
    thumb = ImageOps.fit(image, THUMB_SIZE, Image.Resampling.LANCZOS)
    thumb.save(thumb_dir(data_dir) / f"{item_id}.webp", "WEBP", quality=WEBP_QUALITY)


async def fetch_poster(
    client: EmbyClient,
    item_id: str,
    tag: str,
    data_dir: Path,
    sem: asyncio.Semaphore,
) -> bool:
    async with sem:
        raw = await client.image_bytes(item_id, tag, POSTER_WIDTH)
    written = raw is not None
    await asyncio.to_thread(write_variants, raw, item_id, data_dir) if written else None
    return written
