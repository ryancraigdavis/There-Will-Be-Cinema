import gzip
import json

from cinema.catalog.cache import CatalogCache
from cinema.db import repo
from cinema.emby.parse import flatten_item


def test_payload_compacts_and_caches(conn, data_dir, emby_items):
    repo.upsert_items(conn, [flatten_item(i) for i in emby_items])
    cache = CatalogCache(conn, data_dir)
    first = cache.payload()
    body = json.loads(gzip.decompress(first.body_gzip))
    assert first.item_count == 4
    assert body["atlas"] == "none"
    movie = next(i for i in body["items"] if i["id"] == "m1")
    assert (movie["t"], movie["ti"], movie["y"], movie["hdr"], movie["dv"]) == (
        "Movie",
        "There Will Be Blood",
        2007,
        "Dolby Vision",
        "7.6",
    )
    assert movie["g"] == ["Drama", "History"]
    assert movie["imdb"] == "tt0469494"
    assert movie["k4"] is True
    assert cache.payload() is first
    cache.invalidate()
    assert cache.payload() is not first
    assert cache.payload().etag == first.etag
