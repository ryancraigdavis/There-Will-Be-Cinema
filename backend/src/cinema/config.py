from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


def _with_scheme(url: str) -> str:
    bare = url.strip().rstrip("/")
    prefix = "" if bare.startswith(("http://", "https://")) else "http://"
    return prefix + bare


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")

    emby_server_url: str
    emby_server_api: str
    admin_token: str

    emby_public_url: str = ""
    club_url: str = "https://criterion.therewillbecinema.com/movie-club"
    data_dir: Path = Path("./data")
    sync_interval_hours: float = 6.0
    log_level: str = "INFO"
    log_json: bool = False
    frontend_origin: str = "http://localhost:5173"

    @property
    def emby_base(self) -> str:
        return _with_scheme(self.emby_server_url)

    @property
    def emby_public(self) -> str:
        return _with_scheme(self.emby_public_url or self.emby_server_url)


@lru_cache
def get_settings() -> Settings:
    return Settings()
