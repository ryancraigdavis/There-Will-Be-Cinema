import json
import sqlite3

_KEYS = {
    "id": "id",
    "t": "type",
    "ti": "title",
    "st": "sort_title",
    "y": "year",
    "rt": "runtime_min",
    "cr": "community_rating",
    "or": "official_rating",
    "pg": "primary_genre",
    "dc": "date_created",
    "img": "image_tag",
    "k4": "is_4k",
    "hdr": "hdr_format",
    "dv": "dv_profile",
    "at": "has_atmos",
    "dx": "has_dtsx",
    "ac": "audio_codec_summary",
    "w": "width",
    "h": "height",
    "sz": "file_size",
    "cn": "container",
    "vc": "video_codec",
    "cc": "child_count",
    "ov": "overview",
}
_BOOL_KEYS = {"k4", "at", "dx"}


def compact_item(row: sqlite3.Row) -> dict:
    base = {short: row[col] for short, col in _KEYS.items()}
    flags = {k: bool(base[k]) for k in _BOOL_KEYS}
    providers = json.loads(row["provider_ids"])
    return {
        **base,
        **flags,
        "g": json.loads(row["genres"]),
        "tg": json.loads(row["tags"]),
        "imdb": providers.get("Imdb"),
        "tmdb": providers.get("Tmdb"),
    }


def compact_collection(col: dict) -> dict:
    return {
        "id": col["id"],
        "name": col["name"],
        "overview": col["overview"],
        "img": col["image_tag"],
        "items": col["item_ids"],
    }
