import hashlib
import json
from collections.abc import Iterable
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

Slot = tuple[str, str]
Cell = tuple[int, int, str]


def atlas_dir(data_dir: Path) -> Path:
    return data_dir / "atlases"


def level_path(data_dir: Path, number: int, size: int) -> Path:
    suffix = "" if size == ATLAS_SIZE else f"-{size}"
    return atlas_dir(data_dir) / f"{number}{suffix}.webp"


def atlas_version(slots: Iterable[Slot]) -> str:
    digest = hashlib.sha1("|".join(f"{i}:{t}" for i, t in slots).encode())
    return digest.hexdigest()[:16]


def slot_position(index: int) -> tuple[int, int, int]:
    atlas, within = divmod(index, PER_ATLAS)
    row, col = divmod(within, COLS)
    return atlas, col, row


def chunked(slots: list[Slot]) -> list[list[Slot]]:
    return [slots[i : i + PER_ATLAS] for i in range(0, len(slots), PER_ATLAS)]


def sheet_cells(chunk: Iterable[Slot]) -> list[Cell]:
    return [(*slot_position(i)[1:], item_id) for i, (item_id, _) in enumerate(chunk)]


def positions(sheets: list[list[Slot]], first: int = 0) -> dict[str, list[int]]:
    return {
        item_id: [first + number, col, row]
        for number, chunk in enumerate(sheets)
        for col, row, item_id in sheet_cells(chunk)
    }


def build_index(slots: list[Slot], display: list[Slot] | None = None) -> dict:
    genre_sheets = chunked(slots)
    display_sheets = chunked(display or [])
    return {
        "cell": list(CELL),
        "size": ATLAS_SIZE,
        "levels": list(LEVELS),
        "cols": COLS,
        "rows": ROWS,
        "version": atlas_version([*slots, *(display or [])]),
        "sheets": [atlas_version(chunk) for chunk in [*genre_sheets, *display_sheets]],
        "count": len(genre_sheets) + len(display_sheets),
        "slots": positions(genre_sheets),
        "display": positions(display_sheets, len(genre_sheets)),
    }


def read_index(data_dir: Path) -> dict | None:
    path = atlas_dir(data_dir) / INDEX_NAME
    return json.loads(path.read_text()) if path.exists() else None


def current_version(data_dir: Path) -> str | None:
    index = read_index(data_dir)
    return index["version"] if index else None


def sheet_complete(data_dir: Path, number: int) -> bool:
    return all(level_path(data_dir, number, size).exists() for size in LEVELS)


def levels_complete(data_dir: Path) -> bool:
    index = read_index(data_dir) or {}
    numbers = range(index.get("count", 0))
    return index.get("levels") == list(LEVELS) and all(
        sheet_complete(data_dir, number) for number in numbers
    )


def stale_sheets(data_dir: Path, index: dict) -> list[int]:
    previous = (read_index(data_dir) or {}).get("sheets", [])
    return [
        number
        for number, digest in enumerate(index["sheets"])
        if digest not in previous[number : number + 1] or not sheet_complete(data_dir, number)
    ]


def _paste(sheet: Image.Image, thumb_path: Path, col: int, row: int) -> None:
    with Image.open(thumb_path) as thumb:
        sheet.paste(thumb.convert("RGB"), (col * CELL[0], row * CELL[1]))


def _save_levels(sheet: Image.Image, data_dir: Path, number: int) -> None:
    for size in LEVELS:
        scaled = (
            sheet if size == ATLAS_SIZE else sheet.resize((size, size), Image.Resampling.LANCZOS)
        )
        scaled.save(level_path(data_dir, number, size), "WEBP", quality=82)


def render_sheet(data_dir: Path, number: int, cells: Iterable[Cell]) -> None:
    sheet = Image.new("RGB", (ATLAS_SIZE, ATLAS_SIZE), (8, 6, 6))
    for col, row, item_id in cells:
        _paste(sheet, thumb_dir(data_dir) / f"{item_id}.webp", col, row)
    _save_levels(sheet, data_dir, number)


def build_atlases(data_dir: Path, slots: list[Slot], display: list[Slot] | None = None) -> dict:
    atlas_dir(data_dir).mkdir(parents=True, exist_ok=True)
    index = build_index(slots, display)
    sheets = [*chunked(slots), *chunked(display or [])]
    for number in stale_sheets(data_dir, index):
        render_sheet(data_dir, number, sheet_cells(sheets[number]))
    (atlas_dir(data_dir) / INDEX_NAME).write_text(json.dumps(index))
    return index
