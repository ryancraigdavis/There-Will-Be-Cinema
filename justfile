# There Will Be Cinema — dev tasks. Run `just <recipe>`.

# Run the API locally (secrets via Doppler)
api:
    cd backend && doppler run -- uv run uvicorn --factory cinema.main:create_app --reload --port 8000

# Run the frontend dev server (proxies /api to :8000)
web:
    cd frontend && npm run dev

# Run API and frontend together
dev:
    just api & just web; wait

# Trigger a library sync (mode: full | incremental)
sync mode="incremental":
    cd backend && doppler run -- sh -c 'curl -s -X POST -H "Authorization: Bearer $ADMIN_TOKEN" "http://localhost:8000/api/admin/sync?mode={{mode}}"'

# Lint + format check (both)
lint:
    cd backend && uv run ruff check . && uv run ruff format --check .
    cd frontend && npm run lint

# Auto-fix lint + format (both)
fmt:
    cd backend && uv run ruff check --fix . && uv run ruff format .
    cd frontend && npm run fmt

# Backend tests
test-api:
    cd backend && uv run pytest

# Frontend tests
test-web:
    cd frontend && npm test

# All tests
test: test-api test-web

# Build production images
build:
    docker compose build

# Run the production stack locally on :8765 using the repo's Doppler token
up:
    DOPPLER_TOKEN=$(doppler configure get token --plain) docker compose up --build -d

# Stop the production stack
down:
    docker compose down
