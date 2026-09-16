from datetime import UTC, datetime, timedelta, timezone

import pytest

from cinema.club import events


def _row(**overrides) -> dict:
    return {
        "id": 7,
        "item_id": None,
        "image_tag": None,
        "art_version": None,
        "title": "Magnolia",
        "year": 1999,
        "starts_at": "2026-09-19T00:30:00+00:00",
        "location": "Living room",
        "message": "Bring snacks",
        "description": "Frogs.",
        "runtime_min": None,
        "status": "published",
        "art_url": None,
        "updated_at": "2026-09-16T00:00:00+00:00",
        **overrides,
    }


@pytest.mark.parametrize(
    ("moment", "expected"),
    [
        pytest.param(
            datetime(2026, 9, 18, 19, 30, tzinfo=timezone(timedelta(hours=-5))),
            "2026-09-19T00:30:00+00:00",
            id="offset-to-utc",
        ),
        pytest.param(
            datetime(2026, 9, 19, 0, 30, 12, 345678, tzinfo=UTC),
            "2026-09-19T00:30:12+00:00",
            id="drops-microseconds",
        ),
    ],
)
def test_canonical(moment, expected):
    assert events.canonical(moment) == expected


def test_cutoff_keeps_tonights_screening_showing():
    now = datetime(2026, 9, 19, 2, 0, tzinfo=UTC)
    assert events.cutoff(now) == "2026-09-18T22:00:00+00:00"


@pytest.mark.parametrize(
    ("overrides", "expected"),
    [
        pytest.param(
            {"item_id": "m1", "image_tag": "tag1"}, "/api/posters/m1.webp?v=tag1", id="library"
        ),
        pytest.param({"item_id": "m3", "image_tag": None}, None, id="library-without-poster"),
        pytest.param({"art_version": "abc"}, "/api/club-art/7.webp?v=abc", id="cached-art"),
        pytest.param({}, None, id="nothing"),
    ],
)
def test_poster_url(overrides, expected):
    assert events.poster_url(_row(**overrides)) == expected


def test_admin_shape_extends_the_public_one():
    public = events.public(_row())
    admin = events.admin(_row(status="draft", art_url="https://img.example/a.jpg"))
    assert "status" not in public
    assert admin == {
        **public,
        "status": "draft",
        "art_url": "https://img.example/a.jpg",
        "updated_at": "2026-09-16T00:00:00+00:00",
    }
