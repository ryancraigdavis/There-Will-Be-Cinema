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


def atlas_dir(data_dir: Path) -> Path:
    return data_dir / "atlases"


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
        "cols": COLS,
        "rows": ROWS,
        "version": atlas_version(slots),
        "slots": {item_id: list(slot_position(i)) for i, (item_id, _) in enumerate(slots)},
    }


def current_version(data_dir: Path) -> str | None:
    path = atlas_dir(data_dir) / "index.json"
    return json.loads(path.read_text())["version"] if path.exists() else None


def _paste(sheet: Image.Image, thumb_path: Path, col: int, row: int) -> None:
    with Image.open(thumb_path) as thumb:
        sheet.paste(thumb.convert("RGB"), (col * CELL[0], row * CELL[1]))


def _render_atlas(data_dir: Path, number: int, chunk: list[tuple[int, str]]) -> None:
    sheet = Image.new("RGB", (ATLAS_SIZE, ATLAS_SIZE), (8, 6, 6))
    for index, item_id in chunk:
        _, col, row = slot_position(index)
        _paste(sheet, thumb_dir(data_dir) / f"{item_id}.webp", col, row)
    sheet.save(atlas_dir(data_dir) / f"{number}.webp", "WEBP", quality=82)


def build_atlases(data_dir: Path, slots: list[tuple[str, str]]) -> dict:
    atlas_dir(data_dir).mkdir(parents=True, exist_ok=True)
    indexed = list(enumerate(item_id for item_id, _ in slots))
    chunks = [indexed[i : i + PER_ATLAS] for i in range(0, len(indexed), PER_ATLAS)]
    for number, chunk in enumerate(chunks):
        _render_atlas(data_dir, number, chunk)
    index = {**build_index(slots), "count": len(chunks)}
    (atlas_dir(data_dir) / "index.json").write_text(json.dumps(index))
    return index
