const http = require('http');
const { Pool } = require('pg');

const PORT = process.env.PORT || 8080;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function sendJson(res, statusCode, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/healthz') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/time') {
    try {
      const result = await pool.query('SELECT now()');
      sendJson(res, 200, { now: result.rows[0].now });
    } catch (err) {
      sendJson(res, 500, { error: 'Failed to fetch time from database', details: err.message });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
