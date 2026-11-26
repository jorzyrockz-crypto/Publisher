/**
 * Pexels — free stock photos (Pexels License).
 *
 * Same reasoning as Pixabay: the browser never talks to api.pexels.com, because
 * the key cannot ship to a client and images.pexels.com must be read as bytes for
 * an untainted export canvas. Everything goes through `api/pexels`.
 *
 * Licence notes that shape this module:
 *  - the API guidelines require a visible "Photos provided by Pexels" link
 *    wherever results are shown, so the panel renders one under the results;
 *  - photographer credit is expected, so every item carries its author and page;
 *  - the free tier is 200 requests/hour / 20,000/month, so the relay caches and
 *    `mode=diag&probe=1` reports the remaining quota.
 *
 * Docs: https://www.pexels.com/api/documentation/
 */

export type PexelsOrientation = 'all' | 'landscape' | 'portrait' | 'square';

export interface PexelsItem {
  id: string;
  title: string;
  /** Square crop for the grid. */
  thumbUrl: string;
  /** ≤1600px rendition, used for inserts. */
  insertUrl: string;
  pageUrl: string;
  photographer: string;
  photographerUrl: string;
  width: number;
  height: number;
  avgColor: string;
  licence: string;
}

export interface PexelsSearchOptions {
  page?: number;
  perPage?: number;
  orientation?: PexelsOrientation;
  signal?: AbortSignal;
}

export interface PexelsSearchResult {
  items: PexelsItem[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export class PexelsNotConfiguredError extends Error {
  constructor() {
    super(
      'Pexels is not configured on this deployment yet. Add PEXELS_API_KEY in Vercel → Settings → Environment Variables (Production and Preview), then redeploy.'
    );
    this.name = 'PexelsNotConfiguredError';
  }
}

/**
 * Pexels paused new key issuance (announced on their API page in late Sept 2026,
 * still paused) — existing keys keep working, new ones cannot be requested. The
 * panel therefore hides this source entirely unless `mode=diag` reports a key, so
 * nobody is sent to a page that cannot help them.
 */
export const PEXELS_PROXY_HINT =
  'Pexels paused new API key issuance, so this deployment has no key and the source stays hidden. Existing Pexels keys still work — add PEXELS_API_KEY in Vercel and this tab appears on its own.';

const RELAY = '/api/pexels';

function toItem(raw: Partial<PexelsItem> | null): PexelsItem | null {
  if (!raw || !raw.thumbUrl || !raw.insertUrl) return null;
  return {
    id: String(raw.id ?? raw.insertUrl),
    title: (raw.title || `Pexels #${raw.id ?? ''}`).slice(0, 80),
    thumbUrl: raw.thumbUrl,
    insertUrl: raw.insertUrl,
    pageUrl: raw.pageUrl || 'https://www.pexels.com/',
    photographer: raw.photographer || '',
    photographerUrl: raw.photographerUrl || '',
    width: raw.width || 1600,
    height: raw.height || 1600,
    avgColor: raw.avgColor || '#e5e5e5',
    licence: raw.licence || 'Pexels License',
  };
}

/** Searches Pexels through the relay. Throws `PexelsNotConfiguredError` without a key. */
export async function searchPexels(
  query: string,
  options: PexelsSearchOptions = {}
): Promise<PexelsSearchResult> {
  const page = Math.max(1, options.page ?? 1);
  const perPage = Math.min(80, Math.max(3, options.perPage ?? 18));
  const params = new URLSearchParams({
    mode: 'search',
    q: query.trim(),
    page: String(page),
    per_page: String(perPage),
  });
  if (options.orientation && options.orientation !== 'all') {
    params.set('orientation', options.orientation);
  }

  const res = await fetch(`${RELAY}?${params.toString()}`, {
    signal: options.signal,
    headers: { Accept: 'application/json' },
  });

  if (res.status === 503) throw new PexelsNotConfiguredError();
  if (res.status === 429) {
    throw new Error('Pexels rate limit reached (200 requests/hour on the free tier) — try again later.');
  }
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.text()).slice(0, 160);
    } catch {
      // ignore
    }
    throw new Error(`Pexels answered ${res.status}${detail ? `: ${detail}` : ''}`);
  }

  const data = (await res.json()) as { items?: Partial<PexelsItem>[]; total?: number; hasMore?: boolean };
  return {
    items: (data.items ?? []).map(toItem).filter((item): item is PexelsItem => item !== null),
    total: data.total ?? 0,
    page,
    perPage,
    hasMore: Boolean(data.hasMore),
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
 * Downloads one photo through the relay as a data URL. The project stores the
 * bytes, so a photograph already placed on a page keeps working even if the
 * source changes or the deployment's key is removed.
 */
export async function fetchPexelsAsDataUrl(item: PexelsItem): Promise<string> {
  const res = await fetch(`${RELAY}?mode=image&url=${encodeURIComponent(item.insertUrl)}`);
  if (res.status === 503) throw new PexelsNotConfiguredError();
  if (!res.ok) throw new Error(`Pexels image relay answered ${res.status}`);
  return blobToDataUrl(await res.blob());
}
