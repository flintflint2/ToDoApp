# Backend

Minimal Node.js backend using the built-in `http` module (no frameworks).

## Endpoints

- `GET /healthz` — returns `{"status":"ok"}`
- `GET /api/time` — returns the current time read from Postgres (`SELECT now()`)

## Environment variables

- `PORT` (default `8080`)
- `DATABASE_URL` — Postgres connection string

## Running

```bash
npm install
npm run dev
```
