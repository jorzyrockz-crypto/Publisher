import { encodeSvgDataUri } from './svgRecolor';
import {
  FetchAttemptError,
  fetchFirstOk,
  resolveClipartAssetUrls,
  resolveClipartSearchUrls,
  resolveWikimediaAssetUrls,
} from './apiEndpoints';

export interface ClipartFreeItem {
  slug: string;
  title: string;
  category: string;
  license: string;
  tags: string[];
  creator: string;
  width: number;
  height: number;
  page_url: string;
  svg_url: string;
  png_urls: {
    '400'?: string;
    '800'?: string;
    '2000'?: string;
  };
}

export interface ClipartFreeSearchResponse {
  total: number;
  page: number;
  per_page: number;
  results: ClipartFreeItem[];
}

export const CLIPART_FREE_CATEGORIES = [
  'All',
  'animals',
  'nature',
  'people',
  'food',
  'business',
  'education',
  'objects',
  'holidays',
  'symbols',
] as const;

export const CLIPART_FREE_STORAGE_KEY = 'studiopress_clipart_free_key';

export function getSavedClipartFreeKey(): string {
  try {
    return localStorage.getItem(CLIPART_FREE_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveClipartFreeKey(key: string): void {
  try {
    localStorage.setItem(CLIPART_FREE_STORAGE_KEY, key.trim());
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Preferred, directly-usable URL for a Clipart.Free asset.
 * Development hits the Vite proxy, production hits Clipart.Free (or a configured proxy).
 */
export function toProxiedClipartUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const candidates = resolveClipartAssetUrls(rawUrl);
  return candidates[0] || rawUrl;
}

export async function searchClipartFree(
  query: string,
  options: {
    category?: string;
    page?: number;
    apiKey: string;
    signal?: AbortSignal;
  }
): Promise<ClipartFreeSearchResponse> {
  const key = options.apiKey.trim();
  if (!key) {
    throw new Error('Please enter your Clipart.Free API key (starts with cf_).');
  }

  const params = new URLSearchParams({
    q: query.trim() || 'cat',
    page: String(options.page || 1),
    key,
  });
  if (options.category && options.category !== 'All') {
    params.set('category', options.category);
  }

  // The Clipart.Free REST path has changed between releases; probe the known
  // shapes so a 404 on one doesn't take the whole source down.
  const pathVariants = [
    `/api/clipart/search`,
    `/api/v1/clipart/search`,
    `/api/search`,
  ];

  let lastResponse: Response | null = null;
  let lastNetworkError: unknown = null;

  for (const base of pathVariants) {
    const pathAndQuery = `${base}?${params.toString()}`;
    const candidates = resolveClipartSearchUrls(pathAndQuery);

    try {
      const res = await fetchFirstOk(candidates, { signal: options.signal });
      if (res.ok) return res.json();
      lastResponse = res;
      // 404 = wrong route, try the next one. Anything else is meaningful.
      if (res.status !== 404) break;
    } catch (err) {
      if (options.signal?.aborted) throw err;
      lastNetworkError = err;
      break;
    }
  }

  if (lastResponse && lastResponse.status !== 404) {
    throw new Error(await describeClipartHttpError(lastResponse));
  }
  if (lastResponse) {
    throw new Error(
      'Clipart.Free returned 404 for every known API path — the service may have changed its API. Try Iconify or Wikimedia instead.'
    );
  }

  throw new Error(describeClipartNetworkError(lastNetworkError));
}

/** Turns a raw response into an actionable message. */
async function describeClipartHttpError(res: Response): Promise<string> {
  let detail = '';
  try {
    const json = await res.json();
    if (json?.error || json?.message) detail = String(json.error || json.message);
  } catch {
    // non-JSON body (HTML error page / proxy error)
  }

  if (res.status === 401 || res.status === 403) {
    return `Clipart.Free rejected the API key (HTTP ${res.status}). Open the 🔑 button and paste a valid cf_ key.`;
  }
  if (res.status === 402) {
    return 'Clipart.Free says this key is out of quota (HTTP 402).';
  }
  if (res.status === 429) {
    return 'Clipart.Free rate-limited this key (HTTP 429). Wait a moment and retry.';
  }
  if (res.status === 502 || res.status === 504) {
    return `Clipart.Free could not be reached by the proxy (HTTP ${res.status}). The proxy host has no internet access to clipart.free — try again from a normal browser tab, or run StudioPress outside a sandbox.`;
  }
  return `Clipart.Free HTTP ${res.status}${detail ? `: ${detail}` : ''}`;
}

/** Explains a total network failure (CORS / offline / blocked proxy). */
function describeClipartNetworkError(err: unknown): string {
  const attempts = err instanceof FetchAttemptError ? err.attempts : [];
  const triedProxy = attempts.some((a) => a.url.startsWith('/api/') || /workers\.dev|vercel\.app/.test(a.url));
  const triedDirect = attempts.some((a) => a.url.startsWith('https://clipart.free'));

  if (triedDirect && triedProxy) {
    return (
      'Clipart.Free is unreachable: the browser call was blocked (CORS or offline) and the proxy failed too. ' +
      'Add a CORS proxy URL under the 🔑 button (docs/static-hosting.md) — Iconify and Wikimedia work without one.'
    );
  }
  if (triedDirect) {
    return (
      'Clipart.Free blocked this browser request (no CORS header or the site is offline). ' +
      'Add a CORS proxy URL under the 🔑 button — see docs/static-hosting.md.'
    );
  }
  return 'Clipart.Free search failed — network unreachable. Iconify and Wikimedia are unaffected.';
}

/**
 * Diagnostics used by the Stock Art panel's "Test" button: explains exactly
 * which hop failed instead of a generic failure.
 */
export async function diagnoseClipartConnection(
  apiKey: string
): Promise<{ ok: boolean; message: string }> {
  const key = apiKey.trim();
  if (!key) return { ok: false, message: 'No API key set.' };

  const params = new URLSearchParams({ q: 'cat', page: '1', key });
  const url = `/api/clipart/search?${params.toString()}`;

  try {
    const res = await fetchFirstOk(resolveClipartSearchUrls(url));
    if (res.ok) {
      let count = 0;
      try {
        const json = await res.json();
        count = Array.isArray(json?.results) ? json.results.length : 0;
      } catch {
        // ignore
      }
      return { ok: true, message: `Connected · ${count} results for “cat”.` };
    }
    return { ok: false, message: await describeClipartHttpError(res) };
  } catch (err) {
    return { ok: false, message: describeClipartNetworkError(err) };
  }
}


function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image blob'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Downloads the CC0 SVG (preferred so StudioPress SVG Recolor works) or high-res PNG
 * as a self-contained local Data URL so canvas export & offline saving work cleanly.
 */
export async function fetchClipartAsDataUrl(item: ClipartFreeItem): Promise<string> {
  if (item.svg_url) {
    try {
      const svgRes = await fetchFirstOk(resolveClipartAssetUrls(item.svg_url));
      if (svgRes.ok) {
        const svgText = await svgRes.text();
        if (svgText.includes('<svg')) {
          return encodeSvgDataUri(svgText);
        }
      }
    } catch {
      // fallback to PNG below
    }
  }

  const pngUrl = item.png_urls?.['800'] || item.png_urls?.['400'] || item.png_urls?.['2000'];
  if (!pngUrl) {
    throw new Error('No downloadable image URL found for this clipart.');
  }
  const pngRes = await fetchFirstOk(resolveClipartAssetUrls(pngUrl));
  if (!pngRes.ok) {
    throw new Error(`Failed to download clipart (HTTP ${pngRes.status})`);
  }
  const blob = await pngRes.blob();
  return blobToDataUrl(blob);
}

// ============================================================================
// 2. ICONIFY API (200,000+ free vector icons & color illustrations, no key)
// ============================================================================

export interface IconifyItem {
  id: string; // e.g. "mdi:cat" or "twemoji:cat-face"
  prefix: string;
  name: string;
  previewUrl: string;
}

export async function searchIconify(
  query: string,
  options?: {
    filter?: 'all' | 'color' | 'mono';
    limit?: number;
    signal?: AbortSignal;
  }
): Promise<{ total: number; items: IconifyItem[] }> {
  const q = query.trim() || 'star';
  const params = new URLSearchParams({
    query: q,
    limit: String(options?.limit || 36),
  });
  if (options?.filter === 'color') {
    params.set('prefixes', 'noto,twemoji,openmoji,fluent-emoji,emojione,flat-color-icons,streamline-emojis');
  } else if (options?.filter === 'mono') {
    params.set('prefixes', 'mdi,lucide,tabler,solar,ph,heroicons,ri,bi');
  }

  const res = await fetch(`https://api.iconify.design/search?${params.toString()}`, {
    signal: options?.signal,
  });
  if (!res.ok) {
    throw new Error(`Iconify search failed (HTTP ${res.status})`);
  }
  const data = await res.json();
  const icons: string[] = Array.isArray(data?.icons) ? data.icons : [];
  const items: IconifyItem[] = icons
    .map((id) => {
      const [prefix, ...rest] = id.split(':');
      const name = rest.join(':');
      if (!prefix || !name) return null;
      return {
        id,
        prefix,
        name,
        previewUrl: `https://api.iconify.design/${encodeURIComponent(prefix)}/${encodeURIComponent(name)}.svg?height=64&color=%231e293b`,
      };
    })
    .filter((x): x is IconifyItem => Boolean(x));

  return { total: data?.total ?? items.length, items };
}

export async function fetchIconifyAsDataUrl(item: IconifyItem): Promise<string> {
  const url = `https://api.iconify.design/${encodeURIComponent(item.prefix)}/${encodeURIComponent(item.name)}.svg?height=256`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch Iconify SVG (HTTP ${res.status})`);
  }
  let svgText = await res.text();
  // Replace currentColor with crisp dark slate so monochrome icons render visibly and support StudioPress SVG Recolor
  svgText = svgText.replace(/currentColor/gi, '#1e293b');
  return encodeSvgDataUri(svgText);
}

// ============================================================================
// 3. WIKIMEDIA COMMONS API (Public-domain / CC SVGs & photos, no key)
// ============================================================================

export interface WikimediaItem {
  pageid: number;
  title: string;
  cleanTitle: string;
  thumbUrl: string;
  insertUrl: string;
  originalUrl: string;
  mime: string;
  width: number;
  height: number;
}

/**
 * Preferred, directly-usable URL for a Wikimedia asset.
 * `upload.wikimedia.org` sends permissive CORS headers, so a static host can
 * load these directly — the dev build still routes through the Vite proxy.
 */
export function toProxiedWikimediaUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const candidates = resolveWikimediaAssetUrls(rawUrl);
  return candidates[0] || rawUrl;
}

export async function searchWikimedia(
  query: string,
  options?: {
    filter?: 'all' | 'svg' | 'photo';
    limit?: number;
    signal?: AbortSignal;
  }
): Promise<WikimediaItem[]> {
  const baseQ = query.trim() || 'cat';
  const typeClause =
    options?.filter === 'svg'
      ? 'filetype:drawing'
      : options?.filter === 'photo'
      ? 'filetype:bitmap'
      : 'filetype:bitmap|drawing';

  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: `${baseQ} ${typeClause}`,
    gsrlimit: String(options?.limit || 24),
    prop: 'imageinfo',
    iiprop: 'url|size|mime',
    iiurlwidth: '400',
    format: 'json',
    origin: '*',
  });

  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`, {
    signal: options?.signal,
  });
  if (!res.ok) {
    throw new Error(`Wikimedia search failed (HTTP ${res.status})`);
  }

  const data = await res.json();
  const pages = Object.values(data?.query?.pages || {}) as Array<{
    pageid: number;
    title: string;
    index?: number;
    imageinfo?: Array<{
      url?: string;
      thumburl?: string;
      responsiveUrls?: Record<string, string>;
      mime?: string;
      width?: number;
      height?: number;
    }>;
  }>;

  pages.sort((a, b) => (a.index ?? 999) - (b.index ?? 999));

  return pages
    .map((p) => {
      const info = p.imageinfo?.[0];
      if (!info?.url || !info.mime?.startsWith('image/')) return null;
      const isSvg = info.mime === 'image/svg+xml';
      const thumbUrl = info.thumburl || info.url;
      // For SVGs use the original vector URL; for large photos use 960px responsive or thumb so insertion is fast
      const insertUrl = isSvg
        ? info.url
        : info.responsiveUrls?.['2'] || info.thumburl || info.url;
      const cleanTitle = p.title.replace(/^File:/i, '').replace(/\.[^.]+$/, '').replace(/_/g, ' ');
      return {
        pageid: p.pageid,
        title: p.title,
        cleanTitle,
        thumbUrl,
        insertUrl,
        originalUrl: info.url,
        mime: info.mime,
        width: info.width || 400,
        height: info.height || 400,
      };
    })
    .filter((x): x is WikimediaItem => Boolean(x));
}

export async function fetchWikimediaAsDataUrl(item: WikimediaItem): Promise<string> {
  let res: Response;
  try {
    res = await fetchFirstOk(resolveWikimediaAssetUrls(item.insertUrl));
  } catch {
    // fallback to thumbUrl if insertUrl failed
    res = await fetchFirstOk(resolveWikimediaAssetUrls(item.thumbUrl));
  }
  if (!res.ok) {
    res = await fetchFirstOk(resolveWikimediaAssetUrls(item.thumbUrl));
  }
  if (!res.ok) {
    throw new Error(`Failed to load Wikimedia file (HTTP ${res.status})`);
  }

  if (item.mime === 'image/svg+xml' && item.insertUrl.toLowerCase().includes('.svg')) {
    const svgText = await res.text();
    if (svgText.includes('<svg')) {
      return encodeSvgDataUri(svgText);
    }
  }

  const blob = await res.blob();
  return blobToDataUrl(blob);
}
