/**
 * Local API server — no Vercel login required.
 * Serves ./api/generate.js, ./api/health.js, ./api/pack.js on http://localhost:3000
 * Run via: npm run dev:server  (or npm run dev:full for frontend + API together)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) { val = val.slice(1, -1); }
    if (!(key in process.env)) process.env[key] = val;
  }
  console.log('[local-api] Loaded .env');
} else {
  console.warn('[local-api] No .env found at', envPath);
}

const PORT = process.env.API_PORT ? Number(process.env.API_PORT) : 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

// Warp Vercel-style (req, res) handlers to plain Node http
function wrap(handler) {
  return async (req, rawReq) => {
    let body = '';
    rawReq.on('data', (chunk) => (body += chunk));
    await new Promise((resolve) => rawReq.on('end', resolve));
    let json = {};
    if (body) { try { json = JSON.parse(body); } catch { json = {}; } }
    const headers = {};
    const res = {
      statusCode: 200,
      setHeader(k, v) { headers[k] = v; },
      status(code) { this.statusCode = code; return this; },
      json(obj) { return { statusCode: this.statusCode, headers, body: JSON.stringify(obj) }; },
      end(msg) { return { statusCode: this.statusCode, headers, body: msg || '' }; },
    };
    const reqLike = { method: rawReq.method, headers: rawReq.headers, body: json, query: {}, url: rawReq.url, };
    const result = await handler(reqLike, res);
    if (result && typeof result.statusCode === 'number') return result;
    return { statusCode: res.statusCode, headers, body: '' };
  };
}

const generateHandler = require('./api/generate.js');
const healthHandler = require('./api/health.js');
const packHandler = require('./api/pack.js');
const wrappedGenerate = wrap(generateHandler);
const wrappedHealth = wrap(healthHandler);
const wrappedPack = wrap(packHandler);

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' });
    res.end(); return;
  }

  const url = req.url.split('?')[0];

  try {
    let out;
    if (url === '/api/generate' || url === '/api/generate.js') { out = await wrappedGenerate(req, req); }
    else if (url === '/api/health' || url === '/api/health.js') { out = await wrappedHealth(req, req); }
    else if (url === '/api/pack' || url.startsWith('/api/pack/') || url === '/api/pack.js') { out = await wrappedPack(req, req); }
    else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Not found: ' + url })); return; }

    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, ...out.headers, };
    res.writeHead(out.statusCode, headers);
    res.end(out.body);
  } catch (e) {
    console.error('[local-api] Unhandled error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN });
    res.end(JSON.stringify({ error: e.message || 'Internal server error', stack: e.stack }));
  }
});

server.listen(PORT, () => {
  console.log(`[local-api] Listening on http://localhost:${PORT}`);
  console.log(`[local-api]  POST http://localhost:${PORT}/api/generate`);
  console.log(`[local-api]  GET  http://localhost:${PORT}/api/health`);
  console.log(`[local-api]  GET/POST http://localhost:${PORT}/api/pack`);
  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) console.warn('[local-api] WARNING: GEMINI_API_KEY and GROQ_API_KEY not set in .env');
  if (!process.env.VITE_SUPABASE_URL) console.warn('[local-api] WARNING: VITE_SUPABASE_URL not set');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) console.warn('[local-api] WARNING: SUPABASE_SERVICE_ROLE_KEY not set (needed for pack API)');
});