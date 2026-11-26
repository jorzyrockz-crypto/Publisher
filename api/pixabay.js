/**
 * Same-origin Pixabay proxy for static deployments (Vercel serverless function
 * at `/api/pixabay`).
 *
 * Why this exists:
 *  - pixabay.com sends no `Access-Control-Allow-Origin`, so a browser on
 *    studiopress-blue.vercel.app can neither call the API nor read image bytes.
 *    Without a broker, both the search and the export would fail (the exporter
 *    loads images with `crossOrigin = 'anonymous'`, and a tainted canvas makes
 *    `toDataURL` throw).
 *  - the API key is a secret. It lives only in the deployment environment:
 *
 *      Vercel → Settings → Environment Variables → PIXABAY_API_KEY
 *
 *  - Pixabay's terms require search responses to be cached for 24 hours and
 *    forbid permanent hotlinking of their image URLs. This function caches the
 *    JSON at the edge and relays image bytes so the app can store them itself.
 *
 * Docs: https://pixabay.com/api/docs/
 *
 * Routes:
 *   GET /api/pixabay?mode=search&q=cat&page=1&image_type=photo
 *   GET /api/pixabay?mode=image&url=https://pixabay.com/get/…jpg
 *   GET /api/pixabay?mode=diag
 */

const SEARCH_ORIGIN = 'https://pixabay.com/api/';
const USER_AGENT = 'StudioPress/1.0 (Desktop Publishing Studio)';
/** Only Pixabay's own hosts may be relayed — this is not an open proxy. */
const IMAGE_HOSTS = new Set(['pixabay.com', 'www.pixabay.com', 'cdn.pixabay.com']);

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
      'PIXABAY_API_KEY is not configured on this deployment. Add it in Vercel → Settings → Environment Variables (Production and Preview) and redeploy.',
    code: 'not_configured',
  });
}

export default async function handler(req, res) {
  const key = (process.env.PIXABAY_API_KEY || '').trim();
  const requestUrl = getBaseUrl(req);
  const mode = requestUrl.searchParams.get('mode') || 'search';

  // Reports what this deployment can see, without ever echoing the key.
  if (mode === 'diag') {
    const out = {
      configured: Boolean(key),
      keyPrefix: key ? key.slice(0, 3) : null,
      keyLength: key.length,
      vercelEnv: process.env.VERCEL_ENV || null,
    };
    if (key) {
      try {
        const probe = await fetch(`${SEARCH_ORIGIN}?key=${encodeURIComponent(key)}&q=cat&per_page=3`, {
          headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        });
        out.upstreamStatus = probe.status;
        if (!probe.ok) out.upstreamBodyHead = (await probe.text()).slice(0, 180);
      } catch (error) {
        out.upstreamError = String(error);
      }
    }
    sendJson(res, 200, out);
    return;
  }

  // JSON diagnostics for the image path: reports what Pixabay answers our
  // server for a given URL under a few header sets, without relaying bytes.
  if (mode === 'probe') {
    const target = requestUrl.searchParams.get('url') || '';
    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      sendJson(res, 400, { error: 'url parameter must be an absolute URL' });
      return;
    }
    if (parsed.protocol !== 'https:' || !IMAGE_HOSTS.has(parsed.hostname)) {
      sendJson(res, 400, { error: 'only https://pixabay.com image URLs can be probed' });
      return;
    }
    const variants = [
      { name: 'as-authored', headers: { 'User-Agent': USER_AGENT, Accept: 'image/*,*/*;q=0.8', Referer: 'https://pixabay.com/' } },
      { name: 'browser-ua', headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36', Accept: 'image/avif,image/webp,image/jpeg,image/*,*/*;q=0.8', Referer: 'https://pixabay.com/' } },
      { name: 'no-referer', headers: { 'User-Agent': USER_AGENT, Accept: 'image/*,*/*;q=0.8' } },
    ];
    const results = [];
    for (const variant of variants) {
      try {
        const upstream = await fetch(parsed.toString(), { headers: variant.headers, redirect: 'follow' });
        const buf = Buffer.from(await upstream.arrayBuffer());
        results.push({
          name: variant.name,
          status: upstream.status,
          ok: upstream.ok,
          contentType: upstream.headers.get('content-type'),
          bytes: buf.length,
          finalUrl: upstream.url ? upstream.url.slice(0, 120) : null,
          bodyHead: upstream.ok ? null : buf.toString('utf8').slice(0, 160),
        });
      } catch (error) {
        results.push({ name: variant.name, error: String(error) });
      }
    }
    sendJson(res, 200, { host: parsed.hostname, results });
    return;
  }

  // Fetches this function's own image route over real HTTP, so a relay that
  // answers 200 with the right bytes proves the whole binary path, including
  // how the platform writes the body back.
  if (mode === 'selfcheck') {
    const target = requestUrl.searchParams.get('url') || '';
    const origin = `${requestUrl.protocol}//${requestUrl.host}`;
    const probeUrl = `${origin}/api/pixabay?mode=image&url=${encodeURIComponent(target)}`;
    try {
      const res2 = await fetch(probeUrl, { headers: { 'User-Agent': USER_AGENT } });
      const buf = Buffer.from(await res2.arrayBuffer());
      sendJson(res, 200, {
        relayUrl: probeUrl.slice(0, 160),
        status: res2.status,
        contentType: res2.headers.get('content-type'),
        cacheControl: res2.headers.get('cache-control'),
        bytes: buf.length,
        looksLikeJpeg: buf.length > 2 && buf[0] === 0xff && buf[1] === 0xd8,
        bodyHead: res2.ok ? null : buf.toString('utf8').slice(0, 200),
      });
    } catch (error) {
      sendJson(res, 200, { relayUrl: probeUrl.slice(0, 160), error: String(error) });
    }
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
      sendJson(res, 400, { error: 'only https://pixabay.com image URLs can be relayed' });
      return;
    }

    try {
      const upstream = await fetch(parsed.toString(), {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'image/jpeg,image/png,image/*,*/*;q=0.8',
          Referer: 'https://pixabay.com/',
        },
      });
      if (!upstream.ok) {
        sendJson(res, upstream.status, { error: `pixabay answered ${upstream.status}` });
        return;
      }
      const bytes = Buffer.from(await upstream.arrayBuffer());
      res.statusCode = 200;
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
      // The app turns these bytes into a data URL immediately; nothing hotlinks
      // this route later, so it can be cached hard.
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

  const params = new URLSearchParams({
    key,
    q: (requestUrl.searchParams.get('q') || '').slice(0, 100),
    page: requestUrl.searchParams.get('page') || '1',
    per_page: requestUrl.searchParams.get('per_page') || '20',
    safesearch: requestUrl.searchParams.get('safesearch') || 'true',
  });
  for (const name of ['image_type', 'orientation', 'category', 'colors', 'order', 'min_width', 'min_height']) {
    const value = requestUrl.searchParams.get(name);
    if (value && value !== 'all') params.set(name, value);
  }

  try {
    const upstream = await fetch(`${SEARCH_ORIGIN}?${params.toString()}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });
    const body = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // Pixabay requires search responses to be cached for 24 hours.
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=86400, stale-while-revalidate=3600');
    res.end(body);
  } catch (error) {
    sendJson(res, 502, { error: `search failed: ${String(error)}` });
  }
}
