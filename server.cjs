/**
 * Production server for Docker / Render / Koyeb / Fly.io / Railway.
 * - Serves ./dist (Vite build) with SPA fallback
 * - Reuses ./api/*.js Vercel-style handlers for /api/*
 * - Zero new dependencies (plain Node http), so the Docker image stays small
 *
 * Run: npm run build && npm start  (PORT defaults to 8080)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT || 8080);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

// Optional .env support for `docker run` without --env-file / compose
(function loadDotEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  try {
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2].trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(m[1] in process.env)) process.env[m[1]] = val;
    }
    console.log('[server] Loaded .env');
  } catch (e) {
    console.warn('[server] Could not load .env:', e.message);
  }
})();

// package.json sets "type": "module", so Node treats api/*.js as ESM and
// plain require() crashes ("require is not defined"). Force-compile every
// file under ./api as CJS — same trick as local-api.cjs.
const Module = require('module');
const _origJsHandler = require.extensions['.js'];
require.extensions['.js'] = function (m, filename) {
  if (filename.replace(/\\/g, '/').includes('/api/')) {
    m._compile(fs.readFileSync(filename, 'utf8'), filename);
  } else {
    _origJsHandler(m, filename);
  }
};

function loadCjs(relativePath) {
  const filename = path.join(ROOT, relativePath);
  delete require.cache[filename];
  const exported = require(filename);
  return exported && exported.default ? exported.default : exported;
}

const generateHandler = loadCjs('./api/generate.js');
const healthHandler = loadCjs('./api/health.js');
const packHandler = loadCjs('./api/pack.js');

const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB — text input caps at 20k chars

function readJsonBody(rawReq) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let body = '';
    rawReq.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        rawReq.destroy();
        return;
      }
      body += chunk;
    });
    rawReq.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
    rawReq.on('error', reject);
  });
}

// Adapt Vercel-style (req, res) handlers to plain Node http
async function runHandler(handler, rawReq) {
  const json = rawReq.method === 'GET' || rawReq.method === 'HEAD' ? {} : await readJsonBody(rawReq);
  const headers = {};
  const res = {
    statusCode: 200,
    setHeader(k, v) {
      headers[k] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      return { statusCode: this.statusCode, headers, body: JSON.stringify(obj) };
    },
    end(msg) {
      return { statusCode: this.statusCode, headers, body: msg || '' };
    },
  };
  const reqLike = {
    method: rawReq.method,
    headers: rawReq.headers,
    body: json,
    query: {},
    url: rawReq.url,
  };
  const result = await handler(reqLike, res);
  // Handlers default empty-string headers when ALLOWED_ORIGIN is unset;
  // drop them so the server-level CORS default stands.
  for (const k of Object.keys(headers)) if (headers[k] === '') delete headers[k];
  if (result && typeof result.statusCode === 'number') return result;
  return { statusCode: res.statusCode, headers, body: '' };
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

function serveStatic(urlPath, res) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel.endsWith('/')) rel += 'index.html';
  // Prevent path traversal
  const safe = path.normalize(rel).replace(/^(\.\.[/\\])+/, '');
  let file = path.join(DIST, safe);

  if (!file.startsWith(DIST)) {
    res.writeHead(403);
    res.end('Forbidden');
    return true;
  }

  // SPA fallback: unknown non-asset route -> index.html
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    if (!path.extname(rel)) {
      file = path.join(DIST, 'index.html');
    } else {
      return false;
    }
  }
  if (!fs.existsSync(file)) return false;

  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': file.includes('/assets/')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=0, must-revalidate',
  });
  fs.createReadStream(file).pipe(res);
  return true;
}

const server = http.createServer(async (req, res) => {
  // CORS (same-origin in Docker, but harmless for split deploys)
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const urlPath = (req.url || '/').split('?')[0];

  try {
    if (urlPath === '/api/health' || urlPath === '/api/health.js') {
      const out = await runHandler(healthHandler, req);
      res.writeHead(out.statusCode, { 'Content-Type': 'application/json', ...out.headers });
      res.end(out.body);
      return;
    }
    if (urlPath === '/api/generate' || urlPath === '/api/generate.js') {
      const out = await runHandler(generateHandler, req);
      res.writeHead(out.statusCode, { 'Content-Type': 'application/json', ...out.headers });
      res.end(out.body);
      return;
    }
    if (urlPath === '/api/pack' || urlPath.startsWith('/api/pack/') || urlPath === '/api/pack.js') {
      const out = await runHandler(packHandler, req);
      res.writeHead(out.statusCode, { 'Content-Type': 'application/json', ...out.headers });
      res.end(out.body);
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    if (!fs.existsSync(DIST) || !fs.existsSync(path.join(DIST, 'index.html'))) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Frontend not built. Run `npm run build` first (dist/ missing).',
        })
      );
      return;
    }

    if (!serveStatic(urlPath, res)) {
      // Unknown asset -> 404 (unknown page route already fell back to index.html)
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found: ' + urlPath }));
    }
  } catch (e) {
    console.error('[server] Unhandled error:', e);
    if (!res.headersSent) {
      res.writeHead(e.message === 'Request body too large' ? 413 : 500, {
        'Content-Type': 'application/json',
      });
    }
    res.end(JSON.stringify({ error: e.message || 'Internal server error' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] SmartWay listening on :${PORT}`);
  console.log(`[server]   GET  /api/health`);
  console.log(`[server]   POST /api/generate`);
  console.log(`[server]   GET/POST /api/pack`);
  if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
    console.warn('[server] WARNING: neither GEMINI_API_KEY nor GROQ_API_KEY is set');
  }
});
