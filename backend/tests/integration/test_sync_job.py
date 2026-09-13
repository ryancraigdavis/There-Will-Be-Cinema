from cinema.db import repo
from cinema.sync import atlas
from cinema.sync.job import run_sync
from cinema.sync.posters import poster_dir, thumb_dir


async def test_full_then_incremental(conn, fake_emby, data_dir):
    first = await run_sync(conn, fake_emby, data_dir)
    assert first["mode"] == "full"
    assert first["items_seen"] == 4
    assert first["posters_fetched"] == 3
    assert first["collections"] == 2
    assert fake_emby.since_calls == [None]
    assert (poster_dir(data_dir) / "m1.webp").exists()
    assert (thumb_dir(data_dir) / "m1.webp").exists()
    assert atlas.current_version(data_dir) == first["atlas_version"]
    assert repo.list_collections(conn)[0]["item_ids"] == ["m1", "m2"]

    second = await run_sync(conn, fake_emby, data_dir)
    assert second["mode"] == "incremental"
    assert second["posters_fetched"] == 0
    assert fake_emby.since_calls[1] is not None
    assert len(fake_emby.image_calls) == 3


async def test_full_marks_removed_items_deleted(conn, fake_emby, data_dir):
    await run_sync(conn, fake_emby, data_dir)
    fake_emby.items = fake_emby.items[:2]
    summary = await run_sync(conn, fake_emby, data_dir, requested="full")
    assert summary["removed"] == 2
    assert repo.item_count(conn) == 2


async def test_changed_image_tag_refetches(conn, fake_emby, data_dir):
    await run_sync(conn, fake_emby, data_dir)
    fake_emby.items[0]["ImageTags"]["Primary"] = "tag-m1-v2"
    summary = await run_sync(conn, fake_emby, data_dir)
    assert summary["posters_fetched"] == 1
    assert fake_emby.image_calls[-1] == ("m1", "tag-m1-v2")


async def test_failed_run_is_recorded(conn, fake_emby, data_dir, mocker):
    mocker.patch.object(fake_emby, "boxsets", side_effect=RuntimeError("boom"))
    try:
        await run_sync(conn, fake_emby, data_dir)
    except RuntimeError:
        pass
    run = conn.execute("SELECT status, error FROM sync_runs ORDER BY id DESC LIMIT 1").fetchone()
    assert run["status"] == "error"
    assert "boom" in run["error"]
    assert repo.last_successful_sync(conn) is None
