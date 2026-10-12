# Todo app

A small, mobile-friendly Todo app: one shared list, no auth.
Express + Postgres backend (`backend/`), React 18 + Vite + TypeScript frontend (`frontend/`), schema in `db/init/`.

## Run locally (without Docker)

Requires Node 22 and a running Postgres 16.

```sh
# backend (creates the table on startup if missing)
cd backend && npm install
DATABASE_URL=postgres://app:sandbox@127.0.0.1:5432/app PORT=8080 npm run dev

# frontend (another terminal); Vite proxies /api to http://localhost:8080
cd frontend && npm install && npm run dev      # http://localhost:5173
```

Tests: `cd backend && npm test` (uses the real `DATABASE_URL`, cleans up after itself);
`cd frontend && npm run build`.

## Run with Docker

```sh
cp .env.example .env
docker compose up --build
```
Web: http://localhost:5173, API: http://localhost:8080.

## Configuration

- Backend: `PORT` (default 8080), `DATABASE_URL`, `CORS_ORIGIN` (default `http://localhost:5173`).
- Frontend: `VITE_API_URL` (default `/api`).

## API

| Method & path | Body | Response |
|---|---|---|
| `GET /api/todos` | – | `200` todos, newest first |
| `POST /api/todos` | `{"title"}` | `201` todo |
| `PATCH /api/todos/:id` | `{"title"?, "done"?}` | `200` todo |
| `DELETE /api/todos/:id` | – | `204` |
| `GET /healthz` | – | `200 {"status":"ok"}` |

Errors: `400`/`404`/`500` as `{"error": "..."}`. Title is trimmed, 1–200 chars.

## Notes

- `VITE_API_URL` may be given with or without the `/api` suffix (`http://localhost:8080` and
  `http://localhost:8080/api` are equivalent); `/api` is appended when missing.
