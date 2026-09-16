from collections.abc import AsyncIterator
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from cinema.api.errors import register_exception_handlers
from cinema.api.routes import admin, catalog, club, club_admin, club_members, health, site
from cinema.api.routes.static import mount_static
from cinema.catalog.cache import CatalogCache
from cinema.club.throttle import Throttle
from cinema.config import Settings, get_settings
from cinema.db.connection import connect
from cinema.emby.client import EmbyClient
from cinema.logging import configure_logging
from cinema.sync.scheduler import SyncRunner


def _lifespan(settings: Settings, client: EmbyClient | None):
    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        conn = connect(settings.data_dir)
        emby = client or EmbyClient(settings.emby_base, settings.emby_server_api)
        cache = CatalogCache(conn, settings.data_dir)
        runner = SyncRunner(conn, emby, settings.data_dir, cache, settings.sync_interval_hours)
        app.state.settings, app.state.conn, app.state.cache, app.state.runner = (
            settings,
            conn,
            cache,
            runner,
        )
        app.state.emby = emby
        app.state.login_throttle = Throttle()
        app.state.post_throttle = Throttle(limit=30, window=600.0)
        task = runner.start()
        yield
        task.cancel()
        with suppress(BaseException):
            await task
        await emby.close()
        conn.close()

    return lifespan


def create_app(settings: Settings | None = None, client: EmbyClient | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(settings.log_level, settings.log_json)
    app = FastAPI(
        title="There Will Be Cinema API",
        version="0.1.0",
        lifespan=_lifespan(settings, client),
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_origin],
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )
    register_exception_handlers(app)
    mount_static(app, settings.data_dir)
    app.include_router(health.router, prefix="/api")
    app.include_router(catalog.router, prefix="/api")
    app.include_router(admin.router, prefix="/api")
    app.include_router(site.router, prefix="/api")
    app.include_router(club.router, prefix="/api")
    app.include_router(club_admin.router, prefix="/api")
    app.include_router(club_members.router, prefix="/api")
    return app
