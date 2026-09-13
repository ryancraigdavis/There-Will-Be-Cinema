# There Will Be Cinema

A personal movie site built as a walkable, early-90s video store. You arrive at the front
counter; the lobby fixtures (bulletin board, suggestion box, telephone) belong to the movie
club, and past the gate the aisles hold every film and series on the Emby server.

## Layout

```
backend/   FastAPI + SQLite: syncs the Emby library, caches posters, builds texture atlases
frontend/  React + Vite: home page, catalog search (/search), club redirect (/club); 3D store next
artifacts/ source art (logo)
```

## Running locally

Secrets come from Doppler (`there_will_be_cinema` / `dev`). The repo is already scoped with
`doppler setup`; every command goes through `doppler run --`.

```
just api        # backend on :8000 (first run does a full Emby sync into backend/data/)
just web        # frontend on :5173, proxies /api to :8000
just sync full  # trigger a manual sync
just test       # pytest + vitest
just lint       # ruff + biome
```

Without `just`:

```
cd backend && doppler run -- uv run uvicorn --factory cinema.main:create_app --reload --port 8000
cd frontend && npm install && npm run dev
cd backend && uv run pytest
cd frontend && npm test && npm run lint && npm run build
```

Set `API_PROXY_TARGET` to point the Vite dev proxy at a backend on another port.

## Production stack

`docker compose` runs the API (with Doppler) and an nginx container that serves the built
frontend and proxies `/api/` to it. Point the reverse proxy at port 8080.

```
DOPPLER_TOKEN=<service token> docker compose up --build -d   # http://localhost:8080
docker compose down
```

`WEB_PORT` changes the published port. Library data lives in the `cinema-data` volume.

## API

| Route | Purpose |
|---|---|
| `GET /api/health` | item count, last sync, whether a sync is running |
| `GET /api/site` | public Emby URL, Emby server id, club URL |
| `GET /api/catalog` | whole catalog, gzip + ETag |
| `GET /api/collections` | Emby BoxSets with member ids |
| `GET /api/posters/{id}.webp` | 400px poster |
| `GET /api/thumbs/{id}.webp` | 128×192 thumb |
| `GET /api/atlases/index.json`, `/api/atlases/{n}.webp` | texture atlases for the 3D store |
| `POST /api/admin/sync?mode=full\|incremental` | bearer `ADMIN_TOKEN` |

## Configuration

| Var | Default |
|---|---|
| `EMBY_SERVER_URL` | required |
| `EMBY_SERVER_API` | required |
| `ADMIN_TOKEN` | required |
| `EMBY_PUBLIC_URL` | `EMBY_SERVER_URL` (set this if the server URL is LAN-only; it is what "Watch on Emby" links use) |
| `CLUB_URL` | `https://criterion.therewillbecinema.com/movie-club` |
| `DATA_DIR` | `./data` |
| `SYNC_INTERVAL_HOURS` | `6` |
| `LOG_LEVEL` / `LOG_JSON` | `INFO` / `false` |
| `FRONTEND_ORIGIN` | `http://localhost:5173` |
