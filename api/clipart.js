/**
 * Same-origin Clipart.Free proxy for static deployments (Vercel serverless
 * function at `/api/clipart`).
 *
 * Why this exists:
 *  - clipart.free does not reliably send CORS headers, so a browser on
 *    studiopress-blue.vercel.app cannot call it directly.
 *  - a *secret* must never be inlined into a client bundle, and hardcoding one
 *    in `src/` (as this project used to do) publishes it to the world.
 *
 * The key therefore lives only in the deployment environment:
 *
 *   Vercel → Settings → Environment Variables → CLIPART_FREE_API_KEY (secret)
 *
 * Routes:
 *   GET /api/clipart?mode=search&q=cat&page=1&category=animals
 *   GET /api/clipart?mode=asset&url=https://clipart.free/static/…
 */

const ORIGIN = 'https://clipart.free';
const USER_AGENT = 'StudioPress/1.0 (Desktop Publishing Studio)';

function sendJson(res, status, payload, cache = 'no-store') {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.end(JSON.stringify(payload));
}

function getBaseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return new URL(req.url || '/', `${proto}://${host}`);
}

export default async function handler(req, res) {
  const key = (process.env.CLIPART_FREE_API_KEY || '').trim();
  const requestUrl = getBaseUrl(req);
  const mode = requestUrl.searchParams.get('mode') || 'search';

  if (mode === 'asset') {
    const target = requestUrl.searchParams.get('url') || '';
    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      sendJson(res, 400, { error: 'url parameter must be an absolute URL' });
      return;
    }
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'clipart.free') {
      sendJson(res, 400, { error: 'only https://clipart.free assets can be proxied' });
      return;
    }

    try {
      // clipart.free's static CDN answers 500 to bare programmatic requests, so
      // present the same shape a browser would send.
      const upstream = await fetch(parsed.toString(), {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          Accept: 'image/svg+xml,image/png,image/*,*/*;q=0.8',
          Referer: 'https://clipart.free/',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      if (!upstream.ok) {
        sendJson(res, upstream.status, { error: `clipart.free answered ${upstream.status}` });
        return;
      }
      const bytes = Buffer.from(await upstream.arrayBuffer());
      res.statusCode = 200;
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, immutable');
      res.end(bytes);
    } catch (error) {
      sendJson(res, 502, { error: `asset fetch failed: ${String(error)}` });
    }
    return;
  }

  if (!key) {
    sendJson(res, 500, {
      error:
        'CLIPART_FREE_API_KEY is not configured on this deployment. Add it in Vercel → Settings → Environment Variables and redeploy.',
    });
    return;
  }

  const params = new URLSearchParams({
    q: (requestUrl.searchParams.get('q') || 'clipart').slice(0, 160),
    page: requestUrl.searchParams.get('page') || '1',
  });
  const category = requestUrl.searchParams.get('category');
  if (category && category !== 'All') params.set('category', category);
  const color = requestUrl.searchParams.get('color');
  if (color) params.set('color', color);
  params.set('key', key);

  try {
    const upstream = await fetch(`${ORIGIN}/api/clipart/search?${params.toString()}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });
    const body = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
    res.end(body);
  } catch (error) {
    sendJson(res, 502, { error: `search failed: ${String(error)}` });
  }
}
