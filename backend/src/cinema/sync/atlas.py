import hashlib
import json
from pathlib import Path

from PIL import Image

from cinema.sync.posters import thumb_dir

CELL = (128, 192)
ATLAS_SIZE = 4096
COLS = ATLAS_SIZE // CELL[0]
ROWS = ATLAS_SIZE // CELL[1]
PER_ATLAS = COLS * ROWS
LEVELS = (1024, 2048, ATLAS_SIZE)
INDEX_NAME = "index.json"


def atlas_dir(data_dir: Path) -> Path:
    return data_dir / "atlases"


def level_path(data_dir: Path, number: int, size: int) -> Path:
    suffix = "" if size == ATLAS_SIZE else f"-{size}"
    return atlas_dir(data_dir) / f"{number}{suffix}.webp"


def atlas_version(slots: list[tuple[str, str]]) -> str:
    digest = hashlib.sha1("|".join(f"{i}:{t}" for i, t in slots).encode())
    return digest.hexdigest()[:16]


def slot_position(index: int) -> tuple[int, int, int]:
    atlas, within = divmod(index, PER_ATLAS)
    row, col = divmod(within, COLS)
    return atlas, col, row


def build_index(slots: list[tuple[str, str]]) -> dict:
    return {
        "cell": list(CELL),
        "size": ATLAS_SIZE,
        "levels": list(LEVELS),
        "cols": COLS,
        "rows": ROWS,
        "version": atlas_version(slots),
        "slots": {item_id: list(slot_position(i)) for i, (item_id, _) in enumerate(slots)},
    }


def read_index(data_dir: Path) -> dict | None:
    path = atlas_dir(data_dir) / INDEX_NAME
    return json.loads(path.read_text()) if path.exists() else None


def current_version(data_dir: Path) -> str | None:
    index = read_index(data_dir)
    return index["version"] if index else None


def levels_complete(data_dir: Path) -> bool:
    index = read_index(data_dir) or {}
    expected = [
        level_path(data_dir, number, size)
        for number in range(index.get("count", 0))
        for size in LEVELS
    ]
    return index.get("levels") == list(LEVELS) and all(path.exists() for path in expected)


def _paste(sheet: Image.Image, thumb_path: Path, col: int, row: int) -> None:
    with Image.open(thumb_path) as thumb:
        sheet.paste(thumb.convert("RGB"), (col * CELL[0], row * CELL[1]))


def _save_levels(sheet: Image.Image, data_dir: Path, number: int) -> None:
    for size in LEVELS:
        scaled = (
            sheet if size == ATLAS_SIZE else sheet.resize((size, size), Image.Resampling.LANCZOS)
        )
        scaled.save(level_path(data_dir, number, size), "WEBP", quality=82)


def _render_atlas(data_dir: Path, number: int, chunk: list[tuple[int, str]]) -> None:
    sheet = Image.new("RGB", (ATLAS_SIZE, ATLAS_SIZE), (8, 6, 6))
    for index, item_id in chunk:
        _, col, row = slot_position(index)
        _paste(sheet, thumb_dir(data_dir) / f"{item_id}.webp", col, row)
    _save_levels(sheet, data_dir, number)


def build_atlases(data_dir: Path, slots: list[tuple[str, str]]) -> dict:
    atlas_dir(data_dir).mkdir(parents=True, exist_ok=True)
    indexed = list(enumerate(item_id for item_id, _ in slots))
    chunks = [indexed[i : i + PER_ATLAS] for i in range(0, len(indexed), PER_ATLAS)]
    for number, chunk in enumerate(chunks):
        _render_atlas(data_dir, number, chunk)
    index = {**build_index(slots), "count": len(chunks)}
    (atlas_dir(data_dir) / INDEX_NAME).write_text(json.dumps(index))
    return index
