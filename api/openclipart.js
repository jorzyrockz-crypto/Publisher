/**
 * Openclipart relay for `/api/openclipart`.
 *
 * Openclipart is 100k+ SVG clip art, every file dedicated to the public domain
 * (CC0): no attribution, no key, no rate limit, and — unlike every photo source
 * — genuine vectors, so a drawing stays crisp at any print size.
 *
 * Two wrinkles shape this file:
 *
 *  1. **There is no JSON API any more.** `?format=json` returns the HTML search
 *     page. So this relay parses the markup, tolerantly: detail links and the
 *     preview image live inside the same `<a>`, so a window around each
 *     `href="/detail/<id>/<slug>"` yields the id, slug, title and preview. If
 *     Openclipart reshuffles their templates the parse yields nothing rather
 *     than junk, and `mode=diag` reports the counts so breakage is visible.
 *  2. **The SVG has to be fetched as bytes.** The document stores a data URL, so
 *     a placed drawing keeps working offline and never hotlinks their server.
 *
 * Routes:
 *   GET /api/openclipart?mode=search&q=flower&page=1
 *   GET /api/openclipart?mode=thumb&id=351216          → 200px PNG
 *   GET /api/openclipart?mode=svg&id=351216            → the SVG file
 *   GET /api/openclipart?mode=diag[&probe=1]
 *
 * Terms: https://openclipart.org/about (all content CC0).
 */

const ORIGIN = 'https://openclipart.org';
/**
 * Their site sits behind bot protection in places, so the relay presents itself
 * as a normal browser rather than a bare server-side fetcher.
 */
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: `${ORIGIN}/`,
};

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

/** Decodes the handful of entities that show up in their alt/title text. */
function decodeEntities(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

function slugToTitle(slug) {
  return decodeEntities(String(slug).replace(/[-_]+/g, ' '))
    .replace(/\s+/g, ' ')
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

/**
 * Extracts results from a search page.
 *
 * Anchored on the `<img>` tag rather than the link: the preview's `src` carries
 * the clipart id and its `alt` carries the title, so both facts come from the
 * same tag and cannot be mixed up between neighbours. The detail link is only
 * used for the slug (and page URL), and only when it names the same id.
 *
 * Tolerant by design: if Openclipart reshuffles the template this yields nothing
 * rather than junk, and `mode=diag` reports the counts so breakage is visible.
 */
export function parseSearchPage(html, page, perPage) {
  const items = [];
  const seen = new Set();
  const img = /<img\b[^>]*>/gi;
  let match;
  while ((match = img.exec(html)) !== null) {
    const tag = match[0];
    const srcMatch = tag.match(/\/image\/(\d+)px\/(\d+)/i);
    if (!srcMatch) continue;
    const id = srcMatch[2];
    if (seen.has(id)) continue;

    // The anchor wrapping this image is immediately before it; use its slug only
    // if it points at the same clipart.
    const before = html.slice(Math.max(0, match.index - 600), match.index);
    const links = [...before.matchAll(/href="(?:\/|https?:\/\/openclipart\.org\/)detail\/(\d+)\/([^"#?]*)/gi)];
    const link = links.length ? links[links.length - 1] : null;
    const slug = link && link[1] === id ? link[2] : '';

    const altMatch = tag.match(/alt="([^"]*)"/i);
    const alt = altMatch ? decodeEntities(altMatch[1]) : '';
    seen.add(id);
    items.push({
      id,
      title: (alt || slugToTitle(slug) || `Clipart #${id}`).slice(0, 90),
      slug,
      pageUrl: slug ? `${ORIGIN}/detail/${id}/${slug}` : `${ORIGIN}/detail/${id}`,
      thumbUrl: `${ORIGIN}/image/200px/${id}`,
      previewUrl: `${ORIGIN}/image/800px/${id}`,
      isSvg: true,
      licence: 'CC0 / public domain',
    });
    if (items.length >= perPage) break;
  }

  // Total lives in the header ("6,219 clipart for …"), page count in the pager.
  let total = items.length;
  const totalMatch = html.match(/([\d,]+)\s*clipart/i);
  if (totalMatch) {
    const parsed = Number(totalMatch[1].replace(/,/g, ''));
    if (Number.isFinite(parsed) && parsed > 0) total = parsed;
  }
  let pageCount = 0;
  const pageMatch = html.match(/Page\s+\d+\s+of\s+([\d,]+)/i);
  if (pageMatch) pageCount = Number(pageMatch[1].replace(/,/g, '')) || 0;

  const hasMore = pageCount ? page < pageCount : items.length >= perPage;
  return { items, total, hasMore, pageCount };
}

async function fetchSearch(query, page) {
  const url = `${ORIGIN}/search/?query=${encodeURIComponent(query)}&page=${page}`;
  const upstream = await fetch(url, { headers: BROWSER_HEADERS, redirect: 'follow' });
  if (!upstream.ok) {
    const error = new Error(`openclipart search answered ${upstream.status}`);
    error.status = upstream.status;
    throw error;
  }
  const html = await upstream.text();
  const perPage = 48;
  return { html, ...parseSearchPage(html, page, perPage), perPage };
}

function numericId(value) {
  const id = String(value || '').trim();
  return /^\d{1,12}$/.test(id) ? id : null;
}

export default async function handler(req, res) {
  const requestUrl = getBaseUrl(req);
  const mode = requestUrl.searchParams.get('mode') || 'search';

  if (mode === 'diag') {
    const out = { configured: true, source: 'openclipart', vercelEnv: process.env.VERCEL_ENV || null };
    if (requestUrl.searchParams.get('probe') === '1') {
      try {
        const result = await fetchSearch('flower', 1);
        out.upstreamStatus = 200;
        out.htmlBytes = result.html.length;
        out.parsed = result.items.length;
        out.total = result.total;
        out.first = result.items[0] ? { id: result.items[0].id, title: result.items[0].title } : null;
        // A page that parses to zero means the markup moved and the regex needs
        // adjusting — worth knowing before users see an empty panel.
        out.parserHealthy = result.items.length > 0;

        // The SVG path is the whole point of this source: prove the download
        // endpoint answers with vector bytes rather than an HTML interstitial.
        const firstId = result.items[0]?.id;
        if (firstId) {
          try {
            const svgRes = await fetch(`${ORIGIN}/download/${firstId}`, {
              headers: { ...BROWSER_HEADERS, Accept: 'image/svg+xml,image/*,*/*;q=0.8' },
              redirect: 'follow',
            });
            const buf = Buffer.from(await svgRes.arrayBuffer());
            const head = buf.subarray(0, 200).toString('utf8');
            out.svg = {
              status: svgRes.status,
              contentType: svgRes.headers.get('content-type'),
              bytes: buf.length,
              startsWithSvg: /<\?xml|<svg/i.test(head),
              bodyHead: svgRes.ok ? undefined : head.slice(0, 120),
            };
          } catch (error) {
            out.svg = { error: String(error).slice(0, 160) };
          }
        }
      } catch (error) {
        out.upstreamStatus = error.status || null;
        out.upstreamError = String(error).slice(0, 200);
      }
    }
    sendJson(res, 200, out);
    return;
  }

  if (mode === 'thumb' || mode === 'svg') {
    const id = numericId(requestUrl.searchParams.get('id'));
    if (!id) {
      sendJson(res, 400, { error: 'id parameter must be a numeric clipart id' });
      return;
    }
    const target = mode === 'svg' ? `${ORIGIN}/download/${id}` : `${ORIGIN}/image/200px/${id}`;
    try {
      const upstream = await fetch(target, {
        headers: { ...BROWSER_HEADERS, Accept: 'image/svg+xml,image/png,image/*,*/*;q=0.8' },
        redirect: 'follow',
      });
      if (!upstream.ok) {
        sendJson(res, upstream.status, { error: `openclipart answered ${upstream.status}` });
        return;
      }
      const bytes = Buffer.from(await upstream.arrayBuffer());
      const contentType =
        upstream.headers.get('content-type') ||
        (mode === 'svg' ? 'image/svg+xml' : 'image/png');
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      // Public-domain files never change; cache hard at the edge.
      res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=2592000, immutable');
      res.end(bytes);
    } catch (error) {
      sendJson(res, 502, { error: `clipart relay failed: ${String(error)}` });
    }
    return;
  }

  const query = (requestUrl.searchParams.get('q') || '').trim().slice(0, 80);
  const page = Math.min(200, Math.max(1, Number(requestUrl.searchParams.get('page') || '1') || 1));
  if (!query) {
    sendJson(res, 400, { error: 'q parameter is required' });
    return;
  }

  try {
    const result = await fetchSearch(query, page);
    sendJson(
      res,
      200,
      {
        page,
        perPage: result.perPage,
        total: result.total,
        hasMore: result.hasMore,
        items: result.items,
      },
      // Their search page is static enough to cache for a day.
      'public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600'
    );
  } catch (error) {
    sendJson(res, 502, { error: `openclipart search failed: ${String(error)}` });
  }
}
