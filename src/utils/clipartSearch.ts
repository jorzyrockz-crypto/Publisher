import { encodeSvgDataUri } from './svgRecolor';
import {
  CLIPART_PROXY_HINT,
  IS_STATIC_HOST,
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

  const pathAndQuery = `/api/clipart/search?${params.toString()}`;
  const candidates = resolveClipartSearchUrls(pathAndQuery);

  let res: Response;
  try {
    res = await fetchFirstOk(candidates, { signal: options.signal });
  } catch (err) {
    if (options.signal?.aborted) throw err;
    if (IS_STATIC_HOST) {
      throw new Error(CLIPART_PROXY_HINT);
    }
    throw err instanceof Error ? err : new Error('Clipart.Free search failed');
  }

  if (!res.ok) {
    let errText = `Clipart.Free HTTP ${res.status}`;
    try {
      const json = await res.json();
      if (json?.error || json?.message) {
        errText = json.error || json.message;
      }
    } catch {
      // ignore parse error
    }
    if (IS_STATIC_HOST && (res.status === 0 || res.type === 'opaque')) {
      errText = CLIPART_PROXY_HINT;
    }
    throw new Error(errText);
  }

  return res.json();
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
