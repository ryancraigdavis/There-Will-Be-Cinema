import time
from datetime import UTC, datetime, timedelta

import pytest

ADMIN = {"username": "ryan", "password": "projector"}
MEMBER = {"username": "guest", "password": ""}


def _settle(api) -> None:
    deadline = time.time() + 10
    while time.time() < deadline:
        body = api.get("/api/health").json()
        if body["item_count"] >= 4 and not body["sync_running"]:
            return
        time.sleep(0.05)


@pytest.fixture
def admin(api):
    _settle(api)
    api.post("/api/club/login", json=ADMIN)
    return api


def _at(hours: float) -> str:
    return (datetime.now(UTC) + timedelta(hours=hours)).isoformat()


def _create(api, **fields) -> dict:
    body = {"starts_at": _at(48), "status": "published", **fields}
    response = api.post("/api/club/admin/events", json=body)
    assert response.status_code == 201, response.text
    return response.json()["screening"]


def test_library_film_fills_itself_in(admin):
    screening = _create(admin, item_id="m1", message="Bring snacks", location="Living room")
    assert screening["title"] == "There Will Be Blood"
    assert screening["year"] == 2007
    assert screening["description"] == "Oil."
    assert screening["poster_url"].startswith("/api/posters/m1.webp?v=")
    assert screening["message"] == "Bring snacks"


def test_written_description_beats_the_synopsis(admin):
    screening = _create(admin, item_id="m1", description="Milkshakes.")
    assert screening["description"] == "Milkshakes."


def test_other_film_uses_the_typed_details(admin, mocker):
    cache = mocker.patch("cinema.club.art.cache_art", mocker.AsyncMock(return_value="v1"))
    screening = _create(
        admin, title="  Paris, Texas ", year=1984, art_url="https://img.example/paris.jpg"
    )
    assert (screening["title"], screening["year"], screening["item_id"]) == (
        "Paris, Texas",
        1984,
        None,
    )
    assert screening["poster_url"] == f"/api/club-art/{screening['id']}.webp?v=v1"
    assert cache.await_count == 1


@pytest.mark.parametrize(
    ("fields", "status"),
    [
        pytest.param({"title": "   "}, 422, id="no-title"),
        pytest.param({"item_id": "nope"}, 422, id="unknown-film"),
        pytest.param({"title": "X", "starts_at": "2026-09-19T19:30:00"}, 422, id="naive-time"),
        pytest.param({"title": "X", "art_url": "file:///etc/passwd"}, 422, id="non-http-art"),
        pytest.param({"title": "X", "status": "maybe"}, 422, id="bad-status"),
    ],
)
def test_rejected_screenings(admin, fields, status):
    body = {"starts_at": _at(48), **fields}
    assert admin.post("/api/club/admin/events", json=body).status_code == status


def test_next_is_the_soonest_published_screening(admin):
    _create(admin, title="Later", starts_at=_at(24 * 14))
    soon = _create(admin, title="Soon", starts_at=_at(24 * 3))
    _create(admin, title="Draft", starts_at=_at(24), status="draft")
    _create(admin, title="Long gone", starts_at=_at(-24 * 7))
    assert admin.get("/api/club/next").json()["screening"]["id"] == soon["id"]
    schedule = admin.get("/api/club/schedule").json()["screenings"]
    assert [s["title"] for s in schedule] == ["Soon", "Later"]
    assert "status" not in schedule[0]


def test_tonights_screening_stays_up_while_it_plays(admin):
    tonight = _create(admin, title="Tonight", starts_at=_at(-1))
    assert admin.get("/api/club/next").json()["screening"]["id"] == tonight["id"]


def test_nothing_scheduled(api):
    _settle(api)
    assert api.get("/api/club/next").json() == {"screening": None}
    assert api.get("/api/club/schedule").json() == {"screenings": []}


def test_update_and_delete(admin):
    screening = _create(admin, item_id="m2")
    changed = admin.post(
        f"/api/club/admin/events/{screening['id']}",
        json={"item_id": "m2", "starts_at": _at(72), "status": "draft", "location": "Garage"},
    ).json()["screening"]
    assert (changed["location"], changed["status"]) == ("Garage", "draft")
    assert admin.get("/api/club/next").json() == {"screening": None}
    listed = admin.get("/api/club/admin/events").json()["screenings"]
    assert [s["id"] for s in listed] == [screening["id"]]
    assert admin.post(f"/api/club/admin/events/{screening['id']}/delete").json() == {
        "deleted": screening["id"]
    }
    assert admin.get("/api/club/admin/events").json() == {"screenings": []}


@pytest.mark.parametrize(
    ("method", "path"),
    [
        pytest.param("post", "/api/club/admin/events/999", id="update"),
        pytest.param("post", "/api/club/admin/events/999/delete", id="delete"),
    ],
)
def test_missing_screening(admin, method, path):
    body = {"title": "X", "starts_at": _at(1)}
    assert getattr(admin, method)(path, json=body).status_code == 404


@pytest.mark.parametrize(
    "credentials",
    [pytest.param(None, id="signed-out"), pytest.param(MEMBER, id="member")],
)
def test_only_admins_manage_screenings(api, credentials):
    _settle(api)
    api.post("/api/club/login", json=credentials) if credentials else None
    body = {"title": "X", "starts_at": _at(1)}
    assert api.get("/api/club/admin/events").status_code in {401, 403}
    assert api.post("/api/club/admin/events", json=body).status_code in {401, 403}
