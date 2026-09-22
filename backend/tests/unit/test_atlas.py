import json

import pytest
from PIL import Image

from cinema.sync import atlas
from cinema.sync.posters import thumb_dir


@pytest.mark.parametrize(
    ("index", "expected"),
    [
        pytest.param(0, (0, 0, 0), id="first"),
        pytest.param(31, (0, 31, 0), id="end-of-row"),
        pytest.param(32, (0, 0, 1), id="second-row"),
        pytest.param(671, (0, 31, 20), id="last-in-atlas"),
        pytest.param(672, (1, 0, 0), id="second-atlas"),
    ],
)
def test_slot_position(index, expected):
    assert atlas.slot_position(index) == expected


def test_capacity():
    assert atlas.PER_ATLAS == 672


def test_version_is_stable_and_tag_sensitive():
    a = atlas.atlas_version([("m1", "t1"), ("m2", "t2")])
    assert a == atlas.atlas_version([("m1", "t1"), ("m2", "t2")])
    assert a != atlas.atlas_version([("m1", "t9"), ("m2", "t2")])


def test_build_atlases_writes_sheet_and_index(data_dir):
    thumb_dir(data_dir).mkdir(parents=True)
    for item_id, color in (("m1", (255, 0, 0)), ("m2", (0, 255, 0))):
        Image.new("RGB", atlas.CELL, color).save(thumb_dir(data_dir) / f"{item_id}.webp", "WEBP")
    index = atlas.build_atlases(data_dir, [("m1", "t1"), ("m2", "t2")])
    assert index["count"] == 1
    assert index["slots"] == {"m1": [0, 0, 0], "m2": [0, 1, 0]}
    assert (
        json.loads((atlas.atlas_dir(data_dir) / "index.json").read_text())["version"]
        == index["version"]
    )
    with Image.open(atlas.atlas_dir(data_dir) / "0.webp") as sheet:
        assert sheet.size == (atlas.ATLAS_SIZE, atlas.ATLAS_SIZE)
        assert sheet.getpixel((10, 10))[0] > 200
        assert sheet.getpixel((atlas.CELL[0] + 10, 10))[1] > 200
    assert atlas.current_version(data_dir) == index["version"]


def _two_thumbs(data_dir):
    thumb_dir(data_dir).mkdir(parents=True, exist_ok=True)
    for item_id in ("m1", "m2"):
        Image.new("RGB", atlas.CELL, (200, 40, 20)).save(
            thumb_dir(data_dir) / f"{item_id}.webp", "WEBP"
        )
    return [("m1", "t1"), ("m2", "t2")]


def test_build_writes_every_level(data_dir):
    index = atlas.build_atlases(data_dir, _two_thumbs(data_dir))
    assert index["levels"] == [1024, 2048, 4096]
    for size in atlas.LEVELS:
        with Image.open(atlas.level_path(data_dir, 0, size)) as sheet:
            assert sheet.size == (size, size)
    assert atlas.levels_complete(data_dir) is True


@pytest.mark.parametrize(
    "damage",
    [
        pytest.param(lambda d: atlas.level_path(d, 0, 2048).unlink(), id="missing-level-file"),
        pytest.param(
            lambda d: (atlas.atlas_dir(d) / "index.json").write_text(
                json.dumps({"version": "old", "count": 1})
            ),
            id="legacy-index",
        ),
    ],
)
def test_levels_incomplete(data_dir, damage):
    atlas.build_atlases(data_dir, _two_thumbs(data_dir))
    damage(data_dir)
    assert atlas.levels_complete(data_dir) is False


def test_levels_incomplete_without_index(data_dir):
    assert atlas.levels_complete(data_dir) is False


def test_display_sheet_follows_the_genre_sheets(data_dir):
    thumbs = _two_thumbs(data_dir)
    index = atlas.build_atlases(data_dir, thumbs, display=[("m2", "t2"), ("m1", "t1")])
    assert index["count"] == 2
    assert index["slots"] == {"m1": [0, 0, 0], "m2": [0, 1, 0]}
    assert index["display"] == {"m2": [1, 0, 0], "m1": [1, 1, 0]}
    assert len(index["sheets"]) == 2
    assert index["version"] != atlas.build_index(thumbs)["version"]
    assert atlas.sheet_complete(data_dir, 1) is True
    assert atlas.levels_complete(data_dir) is True


def test_unchanged_sheets_are_not_rendered_again(data_dir, monkeypatch):
    thumbs = _two_thumbs(data_dir)
    atlas.build_atlases(data_dir, thumbs, display=[("m1", "t1")])
    rendered = []
    monkeypatch.setattr(atlas, "render_sheet", lambda _d, number, _c: rendered.append(number))
    atlas.build_atlases(data_dir, thumbs, display=[("m1", "t1")])
    assert rendered == []
    atlas.build_atlases(data_dir, thumbs, display=[("m2", "t2")])
    assert rendered == [1]
    atlas.level_path(data_dir, 0, 1024).unlink()
    atlas.build_atlases(data_dir, thumbs, display=[("m2", "t2")])
    assert rendered == [1, 0]


def test_index_without_display_is_still_legal():
    index = atlas.build_index([("m1", "t1")])
    assert index["display"] == {}
    assert index["sheets"] == [index["version"]]
