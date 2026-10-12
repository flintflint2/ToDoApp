const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const toTodo = (r) => ({
  id: Number(r.id),
  title: r.title,
  done: r.done,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function parseTitle(v) {
  if (typeof v !== 'string') throw new HttpError(400, 'title is required and must be a string');
  const t = v.trim();
  if (t.length < 1) throw new HttpError(400, 'title must not be empty');
  if (t.length > 200) throw new HttpError(400, 'title must be at most 200 characters');
  return t;
}

function parseId(v) {
  if (!/^\d{1,18}$/.test(v)) throw new HttpError(404, 'Not found');
  return v;
}

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json());

  app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

  app.get('/api/todos', wrap(async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM todos ORDER BY created_at DESC, id DESC');
    res.json(rows.map(toTodo));
  }));

  app.post('/api/todos', wrap(async (req, res) => {
    const title = parseTitle((req.body || {}).title);
    const { rows } = await pool.query('INSERT INTO todos (title) VALUES ($1) RETURNING *', [title]);
    res.status(201).json(toTodo(rows[0]));
  }));

  app.patch('/api/todos/:id', wrap(async (req, res) => {
    const id = parseId(req.params.id);
    const body = req.body || {};
    const sets = [];
    const vals = [];
    if (body.title !== undefined) {
      vals.push(parseTitle(body.title));
      sets.push(`title = $${vals.length}`);
    }
    if (body.done !== undefined) {
      if (typeof body.done !== 'boolean') throw new HttpError(400, 'done must be a boolean');
      vals.push(body.done);
      sets.push(`done = $${vals.length}`);
    }
    if (!sets.length) throw new HttpError(400, 'Nothing to update');
    vals.push(id);
    const { rows } = await pool.query(
      `UPDATE todos SET ${sets.join(', ')}, updated_at = now() WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (!rows.length) throw new HttpError(404, 'Not found');
    res.json(toTodo(rows[0]));
  }));

  app.delete('/api/todos/:id', wrap(async (req, res) => {
    const id = parseId(req.params.id);
    const { rowCount } = await pool.query('DELETE FROM todos WHERE id = $1', [id]);
    if (!rowCount) throw new HttpError(404, 'Not found');
    res.status(204).end();
  }));

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
