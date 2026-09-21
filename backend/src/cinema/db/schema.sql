CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    sort_title TEXT NOT NULL,
    year INTEGER,
    overview TEXT,
    runtime_min INTEGER,
    community_rating REAL,
    official_rating TEXT,
    genres TEXT NOT NULL DEFAULT '[]',
    primary_genre TEXT NOT NULL DEFAULT 'Uncategorized',
    tags TEXT NOT NULL DEFAULT '[]',
    provider_ids TEXT NOT NULL DEFAULT '{}',
    date_created TEXT,
    date_last_saved TEXT,
    image_tag TEXT,
    is_4k INTEGER NOT NULL DEFAULT 0,
    hdr_format TEXT,
    dv_profile TEXT,
    has_atmos INTEGER NOT NULL DEFAULT 0,
    has_dtsx INTEGER NOT NULL DEFAULT 0,
    audio_codec_summary TEXT,
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    container TEXT,
    video_codec TEXT,
    child_count INTEGER,
    deleted INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_items_sort ON items (type, primary_genre, sort_title);

CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    overview TEXT,
    image_tag TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS collection_items (
    collection_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    PRIMARY KEY (collection_id, item_id)
);

CREATE TABLE IF NOT EXISTS posters (
    item_id TEXT PRIMARY KEY,
    image_tag TEXT NOT NULL,
    fetched_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mode TEXT NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    items_seen INTEGER NOT NULL DEFAULT 0,
    items_changed INTEGER NOT NULL DEFAULT 0,
    posters_fetched INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    error TEXT
);
