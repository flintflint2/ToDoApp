const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/app');
const { pool, init } = require('../src/db');

let server, base;
const created = [];

before(async () => {
  await init();
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (created.length) await pool.query('DELETE FROM todos WHERE id = ANY($1)', [created]);
  server.close();
  await pool.end();
});

const call = async (method, path, body) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

test('healthz', async () => {
  const r = await call('GET', '/healthz');
  assert.deepStrictEqual(r, { status: 200, body: { status: 'ok' } });
});

test('create, list, toggle, edit, delete', async () => {
  let r = await call('POST', '/api/todos', { title: '  Buy milk  ' });
  assert.strictEqual(r.status, 201);
  assert.strictEqual(r.body.title, 'Buy milk');
  assert.strictEqual(r.body.done, false);
  const id = r.body.id;
  created.push(id);

  r = await call('GET', '/api/todos');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body[0].id, id);

  r = await call('PATCH', `/api/todos/${id}`, { done: true });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.done, true);

  r = await call('PATCH', `/api/todos/${id}`, { title: 'Buy bread' });
  assert.strictEqual(r.body.title, 'Buy bread');
  assert.strictEqual(r.body.done, true);

  r = await call('DELETE', `/api/todos/${id}`);
  assert.strictEqual(r.status, 204);
  r = await call('GET', '/api/todos');
  assert.ok(!r.body.some((t) => t.id === id));
});

test('validation errors', async () => {
  for (const title of ['', '   ', undefined, 5, 'x'.repeat(201)]) {
    const r = await call('POST', '/api/todos', { title });
    assert.strictEqual(r.status, 400);
    assert.ok(r.body.error);
  }
  const ok = await call('POST', '/api/todos', { title: 'x'.repeat(200) });
  assert.strictEqual(ok.status, 201);
  created.push(ok.body.id);
  const r = await call('PATCH', `/api/todos/${ok.body.id}`, { title: ' ' });
  assert.strictEqual(r.status, 400);
});

test('unknown id', async () => {
  for (const [m, b] of [['PATCH', { done: true }], ['DELETE']]) {
    const r = await call(m, '/api/todos/999999999', b);
    assert.deepStrictEqual(r, { status: 404, body: { error: 'Not found' } });
  }
  const r = await call('DELETE', '/api/todos/abc');
  assert.strictEqual(r.status, 404);
});
