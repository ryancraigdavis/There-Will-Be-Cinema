# There Will Be Cinema

A personal movie site built as a walkable, early-90s video store. You arrive at the front
counter; the lobby fixtures (bulletin board, suggestion box, telephone) belong to the movie
club, and past the gate the aisles hold every film and series on the Emby server.

## Layout

```
backend/   FastAPI + SQLite: syncs the Emby library, caches posters, builds texture atlases
frontend/  React + React Three Fiber: the 3D store (/), catalog search (/search), club redirect (/club)
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

## The store

- **Walk in** from the intro. You start at the front counter; drag to look around the lobby.
- **Lobby:** click the bulletin board, suggestion box, or telephone, or use the buttons along the
  bottom. The camera pans to each one. Esc steps back. The catalog kiosk opens the search page and
  the New Releases sign opens Emby.
- **Enter the store** through the gate. Every movie faces out, shelved by genre on four
  double-sided 9-meter gondolas and along the lined walls. The right lobby wall holds the 160
  most recently added movies, the back wall holds TV on DVD, and the gondola ends show your
  biggest Emby collections. There is room for about 4,400 movies before titles stop fitting.
- **Walking:** WASD or arrow keys, Shift to run, mouse to look. The browser locks the pointer; Esc
  pauses. Without pointer lock, drag to look. On touch screens, use the left stick and drag to look.
- **Tapes:** hover for the title, click to pull one off the shelf, then Watch on Emby or put it back.

Posters come from texture atlases at three sizes (1024, 2048, 4096). Shelves far away use the
small sheet and sharpen as you get close; phones stop at 2048. The backend regenerates any missing
size during its next sync.

Use the Docker stack's API from the dev server with `API_PROXY_TARGET=http://localhost:8765 npm run dev`.

### Screenshot smoke tool

`npm run shoot` drives the store in headless Chromium with software WebGL and saves PNGs to
`frontend/shots/`. Steps run in order:

```
npm run shoot -- --nolock --click-text="Walk in" --await-mode=counter --shot=counter \
  --click-text="Enter the store" --await-mode=free --key=KeyW:1500 --hover=300,280 --shot=aisle
```

Steps: `--click=x,y`, `--click-text=`, `--click-selector=`, `--hover=x,y`, `--key=Code:ms`,
`--press=Key`, `--drag=x1,y1,x2,y2`, `--await-text=`, `--await-mode=`, `--wait=ms`, `--shot=name`.
Pass `--nolock` to test hover and clicks, since headless pointer lock reports no mouse movement.

## Production stack

`docker compose` runs the API (with Doppler) and an nginx container that serves the built
frontend and proxies `/api/` to it. Point the reverse proxy at port 8765.

```
DOPPLER_TOKEN=<service token> docker compose up --build -d   # http://localhost:8765
docker compose down
```

`WEB_PORT` changes the published port, and can live in a `.env` file next to the compose file. Library data lives in the `cinema-data` volume.

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
