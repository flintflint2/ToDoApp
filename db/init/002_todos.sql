CREATE TABLE IF NOT EXISTS todos (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  done        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
