from pathlib import Path

import pytest

from cinema.config import Settings


def test_public_url_defaults_to_server(monkeypatch):
    monkeypatch.setenv("EMBY_SERVER_URL", "https://emby.example.com/")
    monkeypatch.setenv("EMBY_SERVER_API", "k")
    monkeypatch.setenv("ADMIN_TOKEN", "t")
    s = Settings()
    assert s.emby_public == "https://emby.example.com"
    assert s.data_dir == Path("./data")
    assert s.sync_interval_hours == 6.0


def test_public_url_override(monkeypatch):
    monkeypatch.setenv("EMBY_SERVER_URL", "http://10.0.0.5:8096")
    monkeypatch.setenv("EMBY_SERVER_API", "k")
    monkeypatch.setenv("ADMIN_TOKEN", "t")
    monkeypatch.setenv("EMBY_PUBLIC_URL", "https://emby.example.com")
    assert Settings().emby_public == "https://emby.example.com"


def test_bare_host_gets_http_scheme(monkeypatch):
    monkeypatch.setenv("EMBY_SERVER_URL", "192.168.1.5:8096/")
    monkeypatch.setenv("EMBY_SERVER_API", "k")
    monkeypatch.setenv("ADMIN_TOKEN", "t")
    s = Settings()
    assert s.emby_base == "http://192.168.1.5:8096"
    assert s.emby_public == "http://192.168.1.5:8096"


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        pytest.param("", frozenset(), id="unset"),
        pytest.param("Ryan", frozenset({"ryan"}), id="one"),
        pytest.param(
            " Ryan , Co-Host ,", frozenset({"ryan", "co-host"}), id="spaces-and-trailing-comma"
        ),
    ],
)
def test_club_admin_names(monkeypatch, raw, expected):
    monkeypatch.setenv("EMBY_SERVER_URL", "http://emby")
    monkeypatch.setenv("EMBY_SERVER_API", "k")
    monkeypatch.setenv("ADMIN_TOKEN", "t")
    monkeypatch.setenv("CLUB_ADMINS", raw)
    assert Settings().club_admin_names == expected
