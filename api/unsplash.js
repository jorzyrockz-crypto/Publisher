/**
 * Same-origin Unsplash proxy for static deployments (Vercel serverless function
 * at `/api/unsplash`).
 *
 * Unlike Pixabay, this deliberately has **no image relay**. Unsplash's API
 * guidelines require hotlinking their images (`images.unsplash.com` sends
 * `Access-Control-Allow-Origin: *`, so the browser can load and rasterise them
 * for export without tainting the canvas) and forbid copying photos onto your
 * own servers. So the browser fetches image bytes directly, and this function
 * only handles the two things that need the key:
 *
 *   mode=search  → GET https://api.unsplash.com/search/photos
 *   mode=track   → GET the photo's links.download_location (required when a
 *                  user "uses" a photo: inserting it into a document)
 *
 * The access key is a secret and lives only in the deployment environment:
 *
 *      Vercel → Settings → Environment Variables → UNSPLASH_ACCESS_KEY
 *
 * Attribution is not done here — the Stock Art panel renders "Photo by … on
 * Unsplash" with the UTM parameters their guidelines require.
 *
 * Docs: https://unsplash.com/documentation  ·  Guidelines:
 * https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines
 */

const API_ORIGIN = 'https://api.unsplash.com';
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

function notConfigured(res) {
  sendJson(res, 503, {
    error:
      'UNSPLASH_ACCESS_KEY is not configured on this deployment. Add it in Vercel → Settings → Environment Variables (Production and Preview) and redeploy.',
    code: 'not_configured',
  });
}

export default async function handler(req, res) {
  const key = (process.env.UNSPLASH_ACCESS_KEY || '').trim();
  const requestUrl = getBaseUrl(req);
  const mode = requestUrl.searchParams.get('mode') || 'search';

  if (mode === 'diag') {
    const out = {
      configured: Boolean(key),
      keyPrefix: key ? key.slice(0, 3) : null,
      keyLength: key.length,
      vercelEnv: process.env.VERCEL_ENV || null,
    };
    if (key) {
      try {
        const probe = await fetch(`${API_ORIGIN}/photos?per_page=1`, {
          headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1', 'User-Agent': USER_AGENT },
        });
        out.upstreamStatus = probe.status;
        out.rateLimitRemaining = probe.headers.get('x-ratelimit-remaining');
        if (!probe.ok) out.upstreamBodyHead = (await probe.text()).slice(0, 180);
      } catch (error) {
        out.upstreamError = String(error);
      }
    }
    sendJson(res, 200, out);
    return;
  }

  if (!key) {
    notConfigured(res);
    return;
  }

  const authHeaders = {
    Authorization: `Client-ID ${key}`,
    'Accept-Version': 'v1',
    'User-Agent': USER_AGENT,
  };

  // Records the "download" event Unsplash requires when a photo is used.
  if (mode === 'track') {
    const target = requestUrl.searchParams.get('url') || '';
    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      sendJson(res, 400, { error: 'url parameter must be an absolute URL' });
      return;
    }
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'api.unsplash.com' || !parsed.pathname.startsWith('/photos/')) {
      sendJson(res, 400, { error: 'only https://api.unsplash.com/photos/… download locations can be tracked' });
      return;
    }
    try {
      const upstream = await fetch(parsed.toString(), { headers: authHeaders });
      sendJson(res, 200, { tracked: upstream.ok, upstreamStatus: upstream.status });
    } catch (error) {
      // Never block an insert on analytics: the panel treats this as advisory.
      sendJson(res, 200, { tracked: false, error: String(error) });
    }
    return;
  }

  const params = new URLSearchParams({
    query: (requestUrl.searchParams.get('query') || requestUrl.searchParams.get('q') || '').slice(0, 100),
    page: requestUrl.searchParams.get('page') || '1',
    per_page: requestUrl.searchParams.get('per_page') || '18',
    content_filter: requestUrl.searchParams.get('content_filter') || 'high',
  });
  for (const name of ['orientation', 'order_by', 'color']) {
    const value = requestUrl.searchParams.get(name);
    if (value && value !== 'all') params.set(name, value);
  }

  try {
    const upstream = await fetch(`${API_ORIGIN}/search/photos?${params.toString()}`, { headers: authHeaders });
    const body = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const remaining = upstream.headers.get('x-ratelimit-remaining');
    if (remaining) res.setHeader('X-Unsplash-RateLimit-Remaining', remaining);
    // Demo apps get 50 requests/hour, so cache hard at the edge.
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=600');
    res.end(body);
  } catch (error) {
    sendJson(res, 502, { error: `search failed: ${String(error)}` });
  }
}
