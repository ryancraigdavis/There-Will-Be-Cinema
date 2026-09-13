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
