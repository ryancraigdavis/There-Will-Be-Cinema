import pytest

from cinema.sync.displays import pick_display

TAGS = {f"m{i}": f"t{i}" for i in range(1, 40)}


def collection(name, *ids):
    return {"name": name, "item_ids": list(ids)}


@pytest.mark.parametrize(
    ("newest", "collections", "expected"),
    [
        pytest.param([("m1", "t1")], [], ["m1"], id="newest-only"),
        pytest.param(
            [],
            [collection("Small", "m1", "m2"), collection("Big", "m3", "m4", "m5")],
            ["m3", "m4", "m5", "m1", "m2"],
            id="largest-collection-first",
        ),
        pytest.param(
            [],
            [collection("B", "m1", "m2"), collection("A", "m3", "m4")],
            ["m3", "m4", "m1", "m2"],
            id="ties-broken-by-name",
        ),
        pytest.param(
            [("m1", "t1")],
            [collection("Both", "m1", "m2")],
            ["m1", "m2"],
            id="deduplicated-keeping-first-place",
        ),
        pytest.param(
            [("m1", "t1")],
            [collection("Ghosts", "nope", "m2")],
            ["m1", "m2"],
            id="items-without-posters-skipped",
        ),
    ],
)
def test_pick_display(newest, collections, expected):
    picked = pick_display(newest, collections, TAGS, cap=100)
    assert [item_id for item_id, _ in picked] == expected
    assert all(tag == TAGS[item_id] for item_id, tag in picked)


def test_pick_display_limits_each_collection_and_the_sheet():
    ids = [f"m{i}" for i in range(1, 31)]
    many = [collection(f"c{n}", *ids) for n in range(5)]
    picked = pick_display([], many, TAGS, cap=8, per_collection=3, top=2)
    assert [item_id for item_id, _ in picked] == ["m1", "m2", "m3"]
    assert len(pick_display([], many, TAGS, cap=2, per_collection=3, top=2)) == 2
