/**
 * StudioPress CORS proxy — Cloudflare Worker
 * ------------------------------------------
 * Deploy this single file as a Worker and put its URL into StudioPress so that
 * Cloud AI, Clipart.Free and Wikimedia keep working on GitHub Pages (or any
 * other static host), where Vite's dev-server proxy does not exist.
 *
 * Routes (same paths the Vite dev proxy uses):
 *   /clipart-free/*        -> https://clipart.free/*
 *   /pollinations/*        -> https://image.pollinations.ai/*
 *   /wikimedia-upload/*    -> https://upload.wikimedia.org/*   (alias: /upload/*)
 *   /wikimedia-thumb/*     -> https://thumb.wikimedia.org/*    (alias: /thumb/*)
 *
 * Deploy:
 *   npm i -g wrangler
 *   wrangler deploy workers/clipart-proxy.js --name studiopress-proxy
 *
 * Then in StudioPress: Stock Art panel → 🔑 key icon → "CORS Proxy"
 *   https://studiopress-proxy.<your-subdomain>.workers.dev/clipart-free
 */

const ROUTES = [
  { prefix: '/clipart-free', origin: 'https://clipart.free' },
  { prefix: '/pollinations', origin: 'https://image.pollinations.ai' },
  { prefix: '/wikimedia-upload', origin: 'https://upload.wikimedia.org' },
  { prefix: '/upload', origin: 'https://upload.wikimedia.org' },
  { prefix: '/wikimedia-thumb', origin: 'https://thumb.wikimedia.org' },
  { prefix: '/thumb', origin: 'https://thumb.wikimedia.org' },
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    const route = ROUTES.find(
      (r) => url.pathname === r.prefix || url.pathname.startsWith(`${r.prefix}/`)
    );
    if (!route) {
      return new Response(
        JSON.stringify({ error: 'Unknown proxy route', path: url.pathname, routes: ROUTES.map((r) => r.prefix) }),
        { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const target =
      route.origin + url.pathname.slice(route.prefix.length) + (url.search || '');

    let upstream;
    try {
      upstream = await fetch(target, {
        method: request.method,
        headers: {
          Accept: request.headers.get('Accept') || '*/*',
          'User-Agent': 'StudioPress/1.0 (Desktop Publishing Studio)',
        },
        cf: { cacheTtl: 3600, cacheEverything: true },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: `Upstream fetch failed: ${String(err)}` }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const headers = new Headers(upstream.headers);
    for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value);
    // Never leak upstream encoding artefacts to the browser
    headers.delete('content-security-policy');
    headers.delete('x-frame-options');

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  },
};
