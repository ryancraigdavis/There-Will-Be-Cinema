import sqlite3
from pathlib import Path

SCHEMA_PATH = Path(__file__).with_name("schema.sql")
SCHEMA_VERSION = "2"
ADDED_COLUMNS = {
    "width": "INTEGER",
    "height": "INTEGER",
    "file_size": "INTEGER",
    "container": "TEXT",
    "video_codec": "TEXT",
}


def _add_missing_columns(conn: sqlite3.Connection) -> None:
    existing = {row["name"] for row in conn.execute("PRAGMA table_info(items)")}
    missing = {name: kind for name, kind in ADDED_COLUMNS.items() if name not in existing}
    for name, kind in missing.items():
        conn.execute(f"ALTER TABLE items ADD COLUMN {name} {kind}")


def connect(data_dir: Path) -> sqlite3.Connection:
    data_dir.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(data_dir / "cinema.db", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.executescript(SCHEMA_PATH.read_text())
    with conn:
        _add_missing_columns(conn)
    return conn
