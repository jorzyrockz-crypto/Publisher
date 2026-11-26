/**
 * Unsplash — free high-resolution photos (Unsplash License).
 *
 * Two rules from https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines
 * shape this module:
 *
 *  1. **Hotlink, never re-host.** Photos are shown straight from
 *     `images.unsplash.com`, which sends `Access-Control-Allow-Origin: *` — so
 *     the browser can also fetch the bytes at insert time and store them in the
 *     user's own document without tainting the export canvas. Our server never
 *     copies an Unsplash photo.
 *  2. **Credit, with UTM parameters.** Every link back to Unsplash (photo,
 *     photographer, homepage) carries `utm_source=studiopress&utm_medium=referral`
 *     and, when a photo is used, we must GET its `links.download_location`.
 *
 * The access key itself stays on the server (`api/unsplash.js`); only search
 * and download-tracking go through it.
 */

export type UnsplashOrientation = 'all' | 'landscape' | 'portrait' | 'squarish';
export type UnsplashOrder = 'relevant' | 'latest';

export interface UnsplashItem {
  id: string;
  title: string;
  /** ~400px wide hotlink, for the results grid. */
  thumbUrl: string;
  /** ~1080px wide hotlink, fetched only when the user inserts it. */
  insertUrl: string;
  pageUrl: string;
  user: string;
  userUrl: string;
  width: number;
  height: number;
  color: string;
  /** `links.download_location` — must be called when the photo is used. */
  downloadLocation: string;
}

export interface UnsplashSearchOptions {
  page?: number;
  perPage?: number;
  orientation?: UnsplashOrientation;
  orderBy?: UnsplashOrder;
  color?: string;
  signal?: AbortSignal;
}

export interface UnsplashSearchResult {
  items: UnsplashItem[];
  total: number;
  totalPages: number;
  page: number;
  perPage: number;
}

export class UnsplashNotConfiguredError extends Error {
  constructor() {
    super(
      'Unsplash is not configured on this deployment yet. Add UNSPLASH_ACCESS_KEY in Vercel → Settings → Environment Variables (Production and Preview), then redeploy.'
    );
    this.name = 'UnsplashNotConfiguredError';
  }
}

export const UNSPLASH_PROXY_HINT =
  'Unsplash needs its server-side relay (api/unsplash.js) plus an UNSPLASH_ACCESS_KEY environment variable. Iconify, Wikimedia and Openverse work without one.';

/** Required on every link back to unsplash.com. */
export const UNSPLASH_UTM = 'utm_source=studiopress&utm_medium=referral&utm_campaign=api-credit';

export function unsplashCreditUrl(url: string): string {
  if (!url) return `https://unsplash.com/?${UNSPLASH_UTM}`;
  return `${url}${url.includes('?') ? '&' : '?'}${UNSPLASH_UTM}`;
}

const RELAY = '/api/unsplash';

interface RawUnsplashPhoto {
  id?: string;
  alt_description?: string | null;
  description?: string | null;
  width?: number;
  height?: number;
  color?: string;
  urls?: { raw?: string; full?: string; regular?: string; small?: string; thumb?: string };
  user?: { name?: string; links?: { html?: string } };
  links?: { html?: string; download_location?: string };
}

function toItem(raw: RawUnsplashPhoto): UnsplashItem | null {
  const thumbUrl = raw.urls?.small || raw.urls?.thumb || '';
  const insertUrl = raw.urls?.regular || raw.urls?.full || thumbUrl;
  if (!thumbUrl || !insertUrl) return null;
  const title = (raw.alt_description || raw.description || 'Unsplash photo').trim();
  return {
    id: String(raw.id ?? insertUrl),
    title: title.length > 60 ? `${title.slice(0, 57)}…` : title,
    thumbUrl,
    insertUrl,
    pageUrl: raw.links?.html || '',
    user: raw.user?.name || '',
    userUrl: raw.user?.links?.html || '',
    width: raw.width || 1080,
    height: raw.height || 720,
    color: raw.color || '#e5e9ee',
    downloadLocation: raw.links?.download_location || '',
  };
}

/** Searches Unsplash through the relay. Aborts silently when the signal fires. */
export async function searchUnsplash(
  query: string,
  options: UnsplashSearchOptions = {}
): Promise<UnsplashSearchResult> {
  const page = Math.max(1, options.page ?? 1);
  const perPage = Math.min(30, Math.max(3, options.perPage ?? 18));
  const params = new URLSearchParams({
    mode: 'search',
    query: query.trim(),
    page: String(page),
    per_page: String(perPage),
    content_filter: 'high',
  });
  if (options.orientation && options.orientation !== 'all') params.set('orientation', options.orientation);
  if (options.orderBy) params.set('order_by', options.orderBy);
  if (options.color) params.set('color', options.color);

  const res = await fetch(`${RELAY}?${params.toString()}`, {
    signal: options.signal,
    headers: { Accept: 'application/json' },
  });

  if (res.status === 503) throw new UnsplashNotConfiguredError();
  if (res.status === 403) {
    throw new Error('Unsplash rejected the access key (403) — check UNSPLASH_ACCESS_KEY.');
  }
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.text()).slice(0, 160);
    } catch {
      // ignore
    }
    throw new Error(`Unsplash answered ${res.status}${detail ? `: ${detail}` : ''}`);
  }

  const data = (await res.json()) as {
    total?: number;
    total_pages?: number;
    results?: RawUnsplashPhoto[];
  };
  return {
    items: (data.results ?? []).map(toItem).filter((item): item is UnsplashItem => item !== null),
    total: data.total ?? 0,
    totalPages: data.total_pages ?? 1,
    page,
    perPage,
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read the downloaded photo'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Tells Unsplash a photo was used. Required by their API terms; best-effort, so
 * a failure never blocks the insert.
 */
export async function trackUnsplashUse(item: UnsplashItem): Promise<void> {
  if (!item.downloadLocation) return;
  try {
    await fetch(`${RELAY}?mode=track&url=${encodeURIComponent(item.downloadLocation)}`);
  } catch {
    // advisory only
  }
}

/**
 * Fetches a photo from `images.unsplash.com` and returns it as a data URL.
 *
 * This is a hotlink fetch in the browser — the bytes go straight into the
 * user's document, never through our server. The `w`/`q` parameters are Imgix
 * transforms, so we download ~1280px instead of the full 5–8 MB original.
 */
export async function fetchUnsplashAsDataUrl(item: UnsplashItem, maxWidth = 1280): Promise<string> {
  // `urls.regular` already carries `?ixid=…&w=1080`, so set the transforms
  // instead of appending a second `w`.
  let source = item.insertUrl;
  try {
    const url = new URL(item.insertUrl);
    url.searchParams.set('w', String(maxWidth));
    url.searchParams.set('q', '80');
    url.searchParams.set('fm', 'jpg');
    url.searchParams.set('fit', 'max');
    source = url.toString();
  } catch {
    // not an absolute URL: fetch as-is
  }
  const res = await fetch(source, { mode: 'cors', credentials: 'omit' });
  if (!res.ok) throw new Error(`Unsplash CDN answered ${res.status}`);
  return blobToDataUrl(await res.blob());
}
