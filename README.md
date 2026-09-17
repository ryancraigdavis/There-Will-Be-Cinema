# There Will Be Cinema

A personal movie site built as a walkable, early-90s video store. You arrive at the front
counter; the lobby fixtures (bulletin board, suggestion box, telephone) belong to the movie
club, and past the gate the aisles hold every film and series on the Emby server.

## Layout

```
backend/   FastAPI + SQLite: syncs the Emby library, caches posters, builds texture atlases
frontend/  React + React Three Fiber: the 3D store (/), catalog search (/search), club redirect (/club)
artifacts/ source art (logo, framed store art)
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
- **Props:** the popcorn cart beside the counter pops a batch when you click it and the gumball
  machine turns its crank and drops a gumball into the tray; neither one leads anywhere. An oil
  derrick stands off the left corner of the lobby, the There Will Be Blood poster and a Paul Thomas
  Anderson portrait hang by New Releases, and two oilfield paintings flank a lit THERE WILL BE
  CINEMA sign on the back wall of the store.
- **Finding things:** press **M** (or the *Find a movie* button) to drop the store guide over the
  scene. Search every title — fuzzy, typo-tolerant, exact matches first — and each hit shows where
  it lives ("Horror #–B · Aisle 4"). Pick one and you walk to that shelf with the tape already
  pulled out; Enter takes the top hit. With the box empty the guide lists the directory, so
  picking a genre walks you to the front of its section. Esc closes it.
- **Signs:** banners hang over each aisle naming what is down it, each 1-meter bay is signed with
  its genre and letter range ("Drama A–B"), and letter tabs stand between tapes on the shelf.
- **Enter the store** through the gate. Every movie faces out, shelved by genre on four
  double-sided 9-meter gondolas and along the lined walls. The right lobby wall holds the 160
  most recently added movies, the back wall holds TV on DVD, and the gondola ends show your
  biggest Emby collections. There is room for about 4,400 movies before titles stop fitting.
- **Walking:** WASD or arrow keys, Shift to run, mouse to look, M for the guide. The browser locks
  the pointer; Esc pauses. Without pointer lock, drag to look. On touch screens, use the left stick
  and drag to look.
- **Tapes:** hover for the title, click to pull one off the shelf, then Watch on Emby or put it back.
- **Versions:** a film you own twice (4K and 1080p, theatrical and extended) sits on the shelf
  once. The panel picks the best copy and lists the others, and Watch on Emby opens the one
  you choose. `/?tape=<emby id>` opens the store with that tape already pulled out.

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
`--press=Key`, `--drag=x1,y1,x2,y2`, `--await-text=`, `--await-mode=`, `--await-path=`, `--goto=`,
`--wait=ms`, `--shot=name`, `--flash=name`, `--steady-hover=x,y,n`, `--pick-report`, `--count=name`,
`--cookie=name=value` (follow it with `--goto=` so the page reloads with the cookie),
`--fill=selector::value` (Playwright locator, value after the last `::`).
Pass `--nolock` to test hover and clicks, since headless pointer lock reports no mouse movement, and
`--mobile` with `--width`/`--height` for the touch layout. `--shot` settles 30 frames first, which
takes seconds under software WebGL, so catch animations mid-flight with `--flash` instead.

## Movie club

The club is moving in from the old Canva page in stages (see the plan's Phase 5).

- **Signing in:** anyone with an account on the Emby server signs in with their Emby username and
  password — from **Sign in** on the intro, the name chip in the HUD, or `/club/admin`. The site
  shows its own form and never Emby's grid of users. The password goes straight to Emby; the site
  keeps only a signed 30-day cookie with the account id and name.
- **Admins** are the Emby usernames listed in `CLUB_ADMINS`. They get a **Dashboard** link and the
  dashboard at `/club/admin`; everyone else who signs in is a member.
- Sign-in stays switched off until `SESSION_SECRET` is set. Changing that secret signs everyone out.
- Eight wrong passwords in ten minutes, from one address or for one username, lock sign-in for a
  while.
- **Screenings:** admins add them on the dashboard. Search the library and the poster, year and
  synopsis fill themselves in, or switch to *Not in the library* and type the title, year and a
  poster image address (the site downloads and keeps its own copy). Add the date, where, and a
  message from the hosts; the card beside the form shows exactly what members will see. Only
  *Published* screenings appear publicly; *Draft* and *Cancelled* stay on the dashboard.
- The next published screening is the first thing on the site: the opening card, pinned to the
  bulletin board in the lobby with the next few dates beside it, and at the top of `/club`. A
  screening stays "next" until four hours after it starts. With nothing scheduled, the site falls
  back to the logo panel.
- **RSVP:** the RSVP button on the opening card, the telephone on the counter, and the `/club` page
  (any upcoming date). Going, maybe or can't make it, plus guests and a note. Signed-in members
  answer as their Emby account; everyone else types a name, and answering again with the same name
  changes the answer instead of adding a second one. Nobody but the admins ever sees who's coming.
- **Suggestions:** the suggestion box on the counter and `/club`. Search the library or type a film
  that isn't in it, with an optional note. The dashboard inbox marks each one shortlisted,
  scheduled or passed.
- **Dashboard:** every screening shows its RSVP count; *Guest list* opens names, answers, guests
  and notes with a headcount, and lets you remove a bogus entry. Deleting a screening deletes its
  RSVPs. Anonymous RSVPs and suggestions are capped at 30 per address every ten minutes.
- **Polls:** for when the club can't decide. On the dashboard, write a question and add two to
  six options from the suggestions inbox, a library search, or typed titles. Polls save as
  drafts; *Open poll* pins it to the bulletin board (as a note, plus a Vote button on the board's
  card) and to `/club`. Only one poll is open at a time. Members vote once and can change it
  while the poll is open: signed-in members by account, everyone else by a random id kept in
  their browser. Admins watch live counts (with names for signed-in voters); members see results
  only after *Close poll*, and `/club` keeps showing them for two weeks. A closed poll can be
  reopened; a leader that came from a suggestion can be marked scheduled in one click.
- **Board switch:** *Show upcoming dates on the bulletin board* turns the "Coming up" note on or
  off. An open poll takes that spot on the board while it runs.

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
| `POST /api/club/login` | `{username, password}` checked against Emby; sets the session cookie |
| `POST /api/club/logout` | clears the session cookie |
| `GET /api/club/me` | `{name, admin}` for the current session |
| `GET /api/club/admin/overview` | admins only (401 signed out, 403 for members) |
| `GET /api/club/next` | the next published screening, or `null` |
| `GET /api/club/schedule?limit=` | upcoming published screenings, soonest first |
| `GET /api/club/admin/events` | admins: every screening with its status |
| `POST /api/club/admin/events[/{id}]` | admins: create, or update by id |
| `POST /api/club/admin/events/{id}/delete` | admins: delete |
| `GET /api/club-art/{id}.webp` | cached poster for a screening that isn't in the library |
| `POST /api/club/rsvp` | `{event_id, answer, guests, name, note}`; upserts per account or name |
| `GET /api/club/rsvp?event_id=` | the signed-in member's own answer, or `null` |
| `POST /api/club/suggestions` | `{item_id}` or `{title, year}`, plus `name` and `note` |
| `GET /api/club/admin/events/{id}/rsvps` | admins: guest list and totals |
| `POST /api/club/admin/rsvps/{id}/delete` | admins: remove an RSVP |
| `GET /api/club/admin/suggestions` | admins: the inbox, newest first |
| `POST /api/club/admin/suggestions/{id}[/delete]` | admins: set `{status}`, or delete |
| `GET /api/club/poll?voter=` | the open poll, or results of one closed in the last 14 days |
| `POST /api/club/votes` | `{poll_id, option_id, voter}`; one vote per account or browser |
| `GET /api/club/settings` | `{board_schedule}` |
| `POST /api/club/admin/settings` | admins: `{board_schedule}` |
| `GET/POST /api/club/admin/polls[/{id}]` | admins: list with live counts, create, edit a draft |
| `POST /api/club/admin/polls/{id}/status` | admins: `{status: open\|closed}` |
| `POST /api/club/admin/polls/{id}/delete` | admins: delete a poll and its votes |

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
| `SESSION_SECRET` | empty, which leaves club sign-in switched off |
| `CLUB_ADMINS` | empty; comma-separated Emby usernames allowed into the dashboard |
| `SECURE_COOKIES` | `false`; set `true` wherever the site is served over https |
