/**
 * Pixabay — free stock photos, illustrations and vectors (Content License).
 *
 * The browser never talks to pixabay.com directly: their API and CDN send no
 * CORS headers, so a fetch would fail and any image we hotlinked would taint the
 * export canvas. Everything goes through the same-origin serverless relay in
 * `api/pixabay.js`, which also keeps the API key on the server.
 *
 * Licence notes that shape this module:
 *  - results must be attributed where they are shown ("Powered by Pixabay"), so
 *    every item carries its photographer and landing page;
 *  - permanent hotlinking is not allowed, so `fetchPixabayAsDataUrl` copies the
 *    bytes into the project instead of linking them;
 *  - search responses are cached for 24 hours, which the relay's headers do.
 *
 * Docs: https://pixabay.com/api/docs/
 */

export type PixabayImageType = 'all' | 'photo' | 'illustration' | 'vector';
export type PixabayOrientation = 'all' | 'horizontal' | 'vertical';

export interface PixabayItem {
  id: string;
  title: string;
  /** 150px preview, for the grid. */
  thumbUrl: string;
  /** 640px rendition — a sensible fallback when `largeImageURL` is absent. */
  insertUrl: string;
  /** Up to 1280px, used for inserts so print stays sharp. */
  largeUrl: string;
  pageUrl: string;
  user: string;
  userUrl: string;
  type: string;
  width: number;
  height: number;
  tags: string;
}

export interface PixabaySearchOptions {
  page?: number;
  perPage?: number;
  imageType?: PixabayImageType;
  orientation?: PixabayOrientation;
  category?: string;
  colors?: string;
  order?: 'popular' | 'latest';
  minWidth?: number;
  signal?: AbortSignal;
}

export interface PixabaySearchResult {
  items: PixabayItem[];
  total: number;
  totalHits: number;
  page: number;
  perPage: number;
}

interface RawPixabayHit {
  id?: number;
  pageURL?: string;
  type?: string;
  tags?: string;
  previewURL?: string;
  webformatURL?: string;
  largeImageURL?: string;
  imageWidth?: number;
  imageHeight?: number;
  webformatWidth?: number;
  webformatHeight?: number;
  user?: string;
  userImageURL?: string;
}

/** Thrown when the relay exists but has no API key, so the UI can explain it. */
export class PixabayNotConfiguredError extends Error {
  constructor() {
    super(
      'Pixabay is not configured on this deployment yet. Add PIXABAY_API_KEY in Vercel → Settings → Environment Variables (Production and Preview), then redeploy.'
    );
    this.name = 'PixabayNotConfiguredError';
  }
}

export const PIXABAY_PROXY_HINT =
  'Pixabay needs its server-side relay (api/pixabay.js) plus a PIXABAY_API_KEY environment variable. Iconify, Wikimedia and Openverse work without one.';

const RELAY = '/api/pixabay';

/** A title out of the tag list — Pixabay has no title field. */
function titleFromTags(tags: string | undefined, fallback: string): string {
  const first = (tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(' ');
  if (!first) return fallback;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function toItem(raw: RawPixabayHit): PixabayItem | null {
  const thumbUrl = raw.previewURL || '';
  const insertUrl = raw.webformatURL || raw.largeImageURL || thumbUrl;
  if (!thumbUrl || !insertUrl) return null;
  return {
    id: String(raw.id ?? insertUrl),
    title: titleFromTags(raw.tags, `Pixabay #${raw.id ?? ''}`).slice(0, 60),
    thumbUrl,
    insertUrl,
    largeUrl: raw.largeImageURL || insertUrl,
    pageUrl: raw.pageURL || '',
    user: raw.user || '',
    userUrl: raw.userImageURL || '',
    type: raw.type || 'photo',
    width: raw.imageWidth || raw.webformatWidth || 640,
    height: raw.imageHeight || raw.webformatHeight || 480,
    tags: raw.tags || '',
  };
}

/** Searches Pixabay through the relay. Aborts silently when the signal fires. */
export async function searchPixabay(
  query: string,
  options: PixabaySearchOptions = {}
): Promise<PixabaySearchResult> {
  const params = new URLSearchParams({
    mode: 'search',
    q: query.trim(),
    page: String(Math.max(1, options.page ?? 1)),
    per_page: String(Math.min(200, Math.max(3, options.perPage ?? 18))),
    safesearch: 'true',
  });
  if (options.imageType && options.imageType !== 'all') params.set('image_type', options.imageType);
  if (options.orientation && options.orientation !== 'all') params.set('orientation', options.orientation);
  if (options.category) params.set('category', options.category);
  if (options.colors) params.set('colors', options.colors);
  if (options.order) params.set('order', options.order);
  if (options.minWidth) params.set('min_width', String(options.minWidth));

  const res = await fetch(`${RELAY}?${params.toString()}`, {
    signal: options.signal,
    headers: { Accept: 'application/json' },
  });

  if (res.status === 503) throw new PixabayNotConfiguredError();
  if (!res.ok) {
    if (res.status === 429) {
      throw new Error('Pixabay rate limit reached (100 requests a minute) — try again shortly.');
    }
    let detail = '';
    try {
      detail = (await res.text()).slice(0, 160);
    } catch {
      // ignore
    }
    throw new Error(`Pixabay answered ${res.status}${detail ? `: ${detail}` : ''}`);
  }

  const data = (await res.json()) as { total?: number; totalHits?: number; hits?: RawPixabayHit[] };
  const page = Math.max(1, options.page ?? 1);
  const perPage = Math.min(200, Math.max(3, options.perPage ?? 18));
  return {
    items: (data.hits ?? []).map(toItem).filter((item): item is PixabayItem => item !== null),
    total: data.total ?? 0,
    totalHits: data.totalHits ?? (data.hits ?? []).length,
    page,
    perPage,
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read the downloaded image'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Downloads one result through the relay and returns it as a data URL, which is
 * what the project stores: self-contained, export-safe, and no hotlinking.
 *
 * @param size `large` (≤1280px, default), `web` (≤640px) or `thumb`.
 */
export async function fetchPixabayAsDataUrl(
  item: PixabayItem,
  size: 'large' | 'web' | 'thumb' = 'large'
): Promise<string> {
  const source = size === 'thumb' ? item.thumbUrl : size === 'web' ? item.insertUrl : item.largeUrl;
  const res = await fetch(`${RELAY}?mode=image&url=${encodeURIComponent(source)}`);
  if (res.status === 503) throw new PixabayNotConfiguredError();
  if (!res.ok) throw new Error(`Pixabay image relay answered ${res.status}`);
  return blobToDataUrl(await res.blob());
}
