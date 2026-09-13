import time


def _settled(api, minimum: int) -> bool:
    body = api.get("/api/health").json()
    return body["item_count"] >= minimum and not body["sync_running"]


def _wait_for_items(api, minimum: int = 1) -> None:
    deadline = time.time() + 10
    while time.time() < deadline and not _settled(api, minimum):
        time.sleep(0.05)


def test_health_after_startup_sync(api):
    _wait_for_items(api)
    body = api.get("/api/health").json()
    assert body["status"] == "ok"
    assert body["item_count"] == 4


def test_catalog_etag_roundtrip(api):
    _wait_for_items(api)
    first = api.get("/api/catalog")
    assert first.status_code == 200
    assert first.headers["etag"]
    assert len(first.json()["items"]) == 4
    again = api.get("/api/catalog", headers={"If-None-Match": first.headers["etag"]})
    assert again.status_code == 304


def test_collections(api):
    _wait_for_items(api)
    body = api.get("/api/collections").json()
    assert [c["name"] for c in body] == ["Staff Picks", "Empty Set"]
    assert body[0]["items"] == ["m1", "m2"]


def test_static_poster_served_with_cache_header(api):
    _wait_for_items(api)
    resp = api.get("/api/posters/m1.webp")
    assert resp.status_code == 200
    assert "immutable" in resp.headers["cache-control"]
    assert api.get("/api/atlases/index.json").status_code == 200


def test_admin_sync_requires_token(api):
    assert api.post("/api/admin/sync").status_code == 401
    assert api.post("/api/admin/sync", headers={"Authorization": "Bearer nope"}).status_code == 401
    ok = api.post("/api/admin/sync?mode=full", headers={"Authorization": "Bearer secret-token"})
    assert ok.status_code == 202
    assert ok.json()["status"] in {"queued", "already_running"}


def test_site_info(api):
    assert api.get("/api/site").json() == {
        "emby_url": "http://emby.test",
        "emby_server_id": "server-1",
        "club_url": "https://criterion.therewillbecinema.com/movie-club",
    }
