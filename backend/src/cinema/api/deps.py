from fastapi import Request

from cinema.catalog.cache import CatalogCache
from cinema.config import Settings
from cinema.sync.scheduler import SyncRunner


def settings_of(request: Request) -> Settings:
    return request.app.state.settings


def cache_of(request: Request) -> CatalogCache:
    return request.app.state.cache


def runner_of(request: Request) -> SyncRunner:
    return request.app.state.runner


def conn_of(request: Request):
    return request.app.state.conn
