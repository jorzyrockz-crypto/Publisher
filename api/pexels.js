/**
 * Same-origin Pexels proxy for static deployments (Vercel serverless function
 * at `/api/pexels`).
 *
 * Why a relay, same as Pixabay:
 *  - api.pexels.com is not a browser API: the key cannot ship to the client, and
 *    images.pexels.com needs to be read as bytes for an untainted export canvas.
 *  - the key lives only in the environment:
 *
 *      Vercel → Settings → Environment Variables → PEXELS_API_KEY
 *
 *  - the free tier is 200 requests/hour and 20,000/month, so searches are cached
 *    at the edge. `mode=diag` reports the remaining quota from Pexels' own
 *    `X-Ratelimit-*` headers.
 *
 * Pexels' API guidelines (https://www.pexels.com/api/documentation/#guidelines)
 * require a visible "Photos provided by Pexels" link wherever results appear and
 * ask for photographer credit — the panel renders both.
 *
 * Routes:
 *   GET /api/pexels?mode=search&q=cat&page=1&per_page=18&orientation=landscape
 *   GET /api/pexels?mode=curated&page=1&per_page=18
 *   GET /api/pexels?mode=image&url=https://images.pexels.com/photos/…
 *   GET /api/pexels?mode=diag[&probe=1]
 */

const API_ORIGIN = 'https://api.pexels.com/v1';
const USER_AGENT = 'StudioPress/1.0 (Desktop Publishing Studio)';
/** Only Pexels' own CDN may be relayed — this is not an open proxy. */
const IMAGE_HOSTS = new Set(['images.pexels.com']);
/** Rendered width for inserts: sharp in print, a few hundred KB not several MB. */
const INSERT_WIDTH = 1600;
const THUMB_SIZE = 360;

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
      'PEXELS_API_KEY is not configured on this deployment. Add it in Vercel → Settings → Environment Variables (Production and Preview) and redeploy.',
    code: 'not_configured',
  });
}

/** Builds a CDN rendition from the original URL, so we control size and weight. */
function rendition(original, params) {
  if (!original) return '';
  try {
    const url = new URL(original);
    url.searchParams.set('auto', 'compress');
    url.searchParams.set('cs', 'tinysrgb');
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
    return url.toString();
  } catch {
    return '';
  }
}

function toPhoto(raw) {
  const original = raw?.src?.original || raw?.src?.large2x || '';
  const thumb = rendition(original, { fit: 'crop', w: THUMB_SIZE, h: THUMB_SIZE });
  const insert = rendition(original, { w: INSERT_WIDTH });
  if (!thumb || !insert) return null;
  return {
    id: String(raw.id ?? original),
    title: raw.alt || `Pexels #${raw.id ?? ''}`,
    thumbUrl: thumb,
    insertUrl: insert,
    pageUrl: raw.url || '',
    photographer: raw.photographer || '',
    photographerUrl: raw.photographer_url || '',
    width: raw.width || INSERT_WIDTH,
    height: raw.height || INSERT_WIDTH,
    avgColor: raw.avg_color || '#e5e5e5',
    alt: raw.alt || '',
    licence: 'Pexels License',
  };
}

async function callPexels(path, key, params) {
  const url = new URL(`${API_ORIGIN}${path}`);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(name, String(value));
  }
  const upstream = await fetch(url.toString(), {
    headers: { Authorization: key, 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });
  const headers = {
    limit: upstream.headers.get('x-ratelimit-limit'),
    remaining: upstream.headers.get('x-ratelimit-remaining'),
    reset: upstream.headers.get('x-ratelimit-reset'),
  };
  if (!upstream.ok) {
    const body = (await upstream.text()).slice(0, 200);
    const error = new Error(`pexels answered ${upstream.status}: ${body}`);
    error.status = upstream.status;
    error.headers = headers;
    error.bodyHead = body;
    throw error;
  }
  return { json: await upstream.json(), headers };
}

export default async function handler(req, res) {
  const key = (process.env.PEXELS_API_KEY || '').trim();
  const requestUrl = getBaseUrl(req);
  const mode = requestUrl.searchParams.get('mode') || 'search';

  if (mode === 'diag') {
    const out = {
      configured: Boolean(key),
      keyLength: key.length,
      vercelEnv: process.env.VERCEL_ENV || null,
      quota: null,
    };
    if (key && requestUrl.searchParams.get('probe') === '1') {
      try {
        const { json, headers } = await callPexels('/search', key, { query: 'cat', per_page: 1 });
        out.upstreamStatus = 200;
        out.quota = headers;
        out.sampleTotal = json?.total_results ?? 0;
      } catch (error) {
        out.upstreamStatus = error.status || null;
        out.upstreamError = String(error).slice(0, 200);
        out.quota = error.headers || null;
      }
    }
    sendJson(res, 200, out);
    return;
  }

  if (mode === 'image') {
    const target = requestUrl.searchParams.get('url') || '';
    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      sendJson(res, 400, { error: 'url parameter must be an absolute URL' });
      return;
    }
    if (parsed.protocol !== 'https:' || !IMAGE_HOSTS.has(parsed.hostname)) {
      sendJson(res, 400, { error: 'only https://images.pexels.com URLs can be relayed' });
      return;
    }
    try {
      const upstream = await fetch(parsed.toString(), {
        headers: { 'User-Agent': USER_AGENT, Accept: 'image/jpeg,image/png,image/*,*/*;q=0.8' },
      });
      if (!upstream.ok) {
        sendJson(res, upstream.status, { error: `pexels cdn answered ${upstream.status}` });
        return;
      }
      const bytes = Buffer.from(await upstream.arrayBuffer());
      res.statusCode = 200;
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
      // Bytes become a data URL in the document immediately; nothing hotlinks
      // this route later.
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, immutable');
      res.end(bytes);
    } catch (error) {
      sendJson(res, 502, { error: `image relay failed: ${String(error)}` });
    }
    return;
  }

  if (!key) {
    notConfigured(res);
    return;
  }

  const perPage = Math.min(
    80,
    Math.max(3, Number(requestUrl.searchParams.get('per_page') || '18') || 18)
  );
  const page = Math.max(1, Number(requestUrl.searchParams.get('page') || '1') || 1);

  if (mode === 'curated') {
    try {
      const { json, headers } = await callPexels('/curated', key, { page, per_page: perPage });
      sendJson(
        res,
        200,
        {
          page,
          perPage,
          total: json?.total_results ?? 0,
          items: (json?.photos ?? []).map(toPhoto).filter(Boolean),
          quota: headers,
        },
        'public, max-age=1800, s-maxage=3600, stale-while-revalidate=600'
      );
    } catch (error) {
      sendJson(res, error.status === 429 ? 429 : 502, { error: String(error) });
    }
    return;
  }

  const query = (requestUrl.searchParams.get('q') || '').trim().slice(0, 100);
  if (!query) {
    sendJson(res, 400, { error: 'q parameter is required' });
    return;
  }

  try {
    const { json, headers } = await callPexels('/search', key, {
      query,
      page,
      per_page: perPage,
      orientation: requestUrl.searchParams.get('orientation') || '',
      size: requestUrl.searchParams.get('size') || '',
      color: requestUrl.searchParams.get('color') || '',
      locale: requestUrl.searchParams.get('locale') || '',
    });
    sendJson(
      res,
      200,
      {
        page,
        perPage,
        total: json?.total_results ?? 0,
        // Pexels returns a next_page URL rather than a count of pages.
        hasMore: Boolean(json?.next_page),
        items: (json?.photos ?? []).map(toPhoto).filter(Boolean),
        quota: headers,
      },
      // 1 hour at the edge: the free tier is 200 requests/hour, and a search for
      // "cat" does not change that fast.
      'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600'
    );
  } catch (error) {
    if (error.status === 429) {
      sendJson(res, 429, {
        error: 'Pexels rate limit reached (200 requests/hour on the free tier) — try again later.',
        quota: error.headers || null,
      });
      return;
    }
    if (error.status === 401 || error.status === 403) {
      sendJson(res, 502, { error: 'Pexels rejected the API key — check PEXELS_API_KEY in Vercel.', bodyHead: error.bodyHead });
      return;
    }
    sendJson(res, 502, { error: String(error), bodyHead: error.bodyHead });
  }
}
