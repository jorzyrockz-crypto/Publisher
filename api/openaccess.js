/**
 * Public-domain art relay for `/api/openaccess`.
 *
 * Two museums, both keyless, both CC0 for the images we serve:
 *
 *   source=aic  Art Institute of Chicago — 130k+ works, IIIF images
 *               https://api.artic.edu/api/v1/artworks/search
 *   source=cle  Cleveland Museum of Art   — CC0 filter, direct CDN
 *               https://openaccess-api.clevelandart.org/api/artworks/
 *
 * A relay exists for two reasons: neither API sends CORS headers to every host,
 * and the browser must be able to read image bytes for an untainted export
 * canvas. `mode=image` is allow-listed to the two image hosts and caches
 * aggressively — these files never change.
 *
 * Both collections are public domain / CC0, so no attribution is required; the
 * panel credits the museums anyway because it is the courteous thing to do.
 */

const AIC_SEARCH = 'https://api.artic.edu/api/v1/artworks/search';
const CLE_SEARCH = 'https://openaccess-api.clevelandart.org/api/artworks/';
const USER_AGENT = 'StudioPress/1.0 (Desktop Publishing Studio)';

/** Only museum image hosts may be relayed. */
const IMAGE_HOSTS = new Set([
  'www.artic.edu',
  'openaccess-cdn.clevelandart.org',
  'cdn.artic.edu',
  'api.artic.edu',
]);

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

async function aicSearch(query, page, limit) {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(limit),
    fields: 'id,title,image_id,artist_display,date_display,is_public_domain,department_title',
  });
  const upstream = await fetch(`${AIC_SEARCH}?${params.toString()}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });
  if (!upstream.ok) throw new Error(`aic ${upstream.status}`);
  const json = await upstream.json();
  const config = json?.config?.iiif_url || 'https://www.artic.edu/iiif/2';
  return {
    total: json?.pagination?.total ?? 0,
    items: (json?.data ?? []).map((artwork) => ({
      id: String(artwork.id),
      source: 'aic',
      title: artwork.title || 'Untitled',
      creator: (artwork.artist_display || '').split('\n')[0] || '',
      date: artwork.date_display || '',
      department: artwork.department_title || '',
      pageUrl: `https://www.artic.edu/artworks/${artwork.id}`,
      thumbUrl: artwork.image_id ? `${config}/${artwork.image_id}/full/400,/0/default.jpg` : '',
      insertUrl: artwork.image_id ? `${config}/${artwork.image_id}/full/1200,/0/default.jpg` : '',
      licence: 'CC0 / public domain',
      museum: 'Art Institute of Chicago',
    })),
  };
}

async function cleSearch(query, page, limit) {
  const params = new URLSearchParams({
    q: query,
    cc0: '1',
    has_image: '1',
    limit: String(limit),
    skip: String((page - 1) * limit),
  });
  const upstream = await fetch(`${CLE_SEARCH}?${params.toString()}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });
  if (!upstream.ok) throw new Error(`cle ${upstream.status}`);
  const json = await upstream.json();
  return {
    total: json?.info?.total ?? 0,
    items: (json?.data ?? []).map((artwork) => {
      const images = artwork.images || {};
      return {
        id: String(artwork.id),
        source: 'cle',
        title: artwork.title || 'Untitled',
        creator: artwork.creators?.[0]?.description || '',
        date: artwork.creation_date || '',
        department: artwork.department || '',
        pageUrl: artwork.url || '',
        // `web` is 630px (grid), `print` is ~2200px — the client downsizes it
        // before storing, so inserts stay a few hundred KB instead of several MB.
        thumbUrl: images.web?.url || '',
        insertUrl: images.print?.url || images.web?.url || '',
        licence: 'CC0 / public domain',
        museum: 'Cleveland Museum of Art',
      };
    }),
  };
}

export default async function handler(req, res) {
  const requestUrl = getBaseUrl(req);
  const mode = requestUrl.searchParams.get('mode') || 'search';

  if (mode === 'diag') {
    const out = { configured: true, vercelEnv: process.env.VERCEL_ENV || null, sources: {} };
    for (const [name, run] of [
      ['aic', () => aicSearch('cat', 1, 1)],
      ['cle', () => cleSearch('cat', 1, 1)],
    ]) {
      try {
        const result = await run();
        out.sources[name] = { ok: true, total: result.total };
      } catch (error) {
        out.sources[name] = { ok: false, error: String(error) };
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
      sendJson(res, 400, { error: 'only museum image hosts can be relayed' });
      return;
    }
    try {
      const upstream = await fetch(parsed.toString(), {
        headers: { 'User-Agent': USER_AGENT, Accept: 'image/*,*/*;q=0.8' },
      });
      if (!upstream.ok) {
        sendJson(res, upstream.status, { error: `museum cdn answered ${upstream.status}` });
        return;
      }
      const bytes = Buffer.from(await upstream.arrayBuffer());
      res.statusCode = 200;
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
      // Public-domain files are immutable: cache hard.
      res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=2592000, immutable');
      res.end(bytes);
    } catch (error) {
      sendJson(res, 502, { error: `image relay failed: ${String(error)}` });
    }
    return;
  }

  const query = (requestUrl.searchParams.get('q') || '').trim().slice(0, 100);
  const page = Math.max(1, Number(requestUrl.searchParams.get('page') || '1') || 1);
  const limit = Math.min(50, Math.max(3, Number(requestUrl.searchParams.get('limit') || '18') || 18));
  const source = requestUrl.searchParams.get('source') || 'all';
  if (!query) {
    sendJson(res, 400, { error: 'q parameter is required' });
    return;
  }

  const runners = [];
  if (source === 'all' || source === 'aic') runners.push(['aic', aicSearch]);
  if (source === 'all' || source === 'cle') runners.push(['cle', cleSearch]);

  const settled = await Promise.allSettled(
    runners.map(async ([name, run]) => ({ name, result: await run(query, page, limit) }))
  );

  const items = [];
  const errors = [];
  let total = 0;
  for (const outcome of settled) {
    if (outcome.status === 'fulfilled') {
      items.push(...outcome.value.result.items.filter((item) => item.thumbUrl && item.insertUrl));
      total += outcome.value.result.total;
    } else {
      errors.push(String(outcome.reason));
    }
  }

  if (items.length === 0 && errors.length > 0) {
    sendJson(res, 502, { error: `museum search failed: ${errors[0]}`, errors });
    return;
  }

  // Interleave the two museums so neither dominates the first screen.
  const bySource = new Map();
  for (const item of items) {
    const bucket = bySource.get(item.source) || [];
    bucket.push(item);
    bySource.set(item.source, bucket);
  }
  const interleaved = [];
  for (let i = 0; interleaved.length < limit; i += 1) {
    let added = false;
    for (const bucket of bySource.values()) {
      if (bucket[i] && interleaved.length < limit) {
        interleaved.push(bucket[i]);
        added = true;
      }
    }
    if (!added) break;
  }

  sendJson(
    res,
    200,
    { total, page, limit, items: interleaved, errors: errors.length ? errors : undefined },
    'public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600'
  );
}
