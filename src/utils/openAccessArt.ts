/**
 * Public-domain art — Art Institute of Chicago + Cleveland Museum of Art.
 *
 * Both collections are CC0/public domain and keyless. They are exactly what a
 * clip-art search wants and stock-photo sources cannot supply: engraved
 * ornaments, botanical plates, decorative borders, architectural detail and
 * period illustration — all printable without an attribution obligation.
 *
 * Bytes come through `api/openaccess` (museum CDNs do not answer browsers from
 * every host, and the export canvas needs readable pixels). Cleveland serves a
 * ~2200px "print" file of 2–5 MB, so inserts are downscaled in the browser to a
 * sensible width before being stored in the document.
 */

export type OpenAccessSource = 'aic' | 'cle';

export interface OpenAccessItem {
  id: string;
  source: OpenAccessSource;
  title: string;
  creator: string;
  date: string;
  department: string;
  pageUrl: string;
  thumbUrl: string;
  insertUrl: string;
  licence: string;
  museum: string;
}

export interface OpenAccessSearchOptions {
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}

export interface OpenAccessSearchResult {
  items: OpenAccessItem[];
  total: number;
  page: number;
  limit: number;
}

const RELAY = '/api/openaccess';

/** Width used for inserts; large enough for a 300 dpi decorative element. */
const INSERT_MAX_PX = 1600;
/** Above this, the fetched image is downscaled before it enters the document. */
const SHRINK_THRESHOLD_BYTES = 700_000;

export const OPEN_ACCESS_CREDIT = 'Public-domain art from the Art Institute of Chicago and the Cleveland Museum of Art';

function toItem(raw: Partial<OpenAccessItem> | null): OpenAccessItem | null {
  if (!raw || !raw.thumbUrl || !raw.insertUrl) return null;
  const source: OpenAccessSource = raw.source === 'cle' ? 'cle' : 'aic';
  return {
    id: String(raw.id ?? raw.insertUrl),
    source,
    title: (raw.title || 'Untitled').trim(),
    creator: (raw.creator || '').trim(),
    date: (raw.date || '').trim(),
    department: (raw.department || '').trim(),
    pageUrl: raw.pageUrl || '',
    thumbUrl: raw.thumbUrl,
    insertUrl: raw.insertUrl,
    licence: raw.licence || 'CC0 / public domain',
    museum: raw.museum || (source === 'cle' ? 'Cleveland Museum of Art' : 'Art Institute of Chicago'),
  };
}

/** Searches both museums through the relay; they are interleaved server-side. */
export async function searchOpenAccess(
  query: string,
  options: OpenAccessSearchOptions = {}
): Promise<OpenAccessSearchResult> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(50, Math.max(3, options.limit ?? 18));
  const params = new URLSearchParams({
    mode: 'search',
    source: 'all',
    q: query.trim(),
    page: String(page),
    limit: String(limit),
  });

  const res = await fetch(`${RELAY}?${params.toString()}`, {
    signal: options.signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.text()).slice(0, 160);
    } catch {
      // ignore
    }
    throw new Error(`Museum search answered ${res.status}${detail ? `: ${detail}` : ''}`);
  }

  const data = (await res.json()) as { items?: Partial<OpenAccessItem>[]; total?: number };
  return {
    items: (data.items ?? []).map(toItem).filter((item): item is OpenAccessItem => item !== null),
    total: data.total ?? 0,
    page,
    limit,
  };
}

/** Exposed for tests: decides whether a fetched image needs downscaling. */
export function shouldShrink(bytes: number): boolean {
  return bytes > SHRINK_THRESHOLD_BYTES;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read the downloaded artwork'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Downscales a data URL to `INSERT_MAX_PX` on its long edge and re-encodes as
 * JPEG. Museum "print" renditions are multi-megabyte; a decorative element on a
 * page does not need that, and the document is stored in IndexedDB.
 */
export function shrinkDataUrl(dataUrl: string, maxPx = INSERT_MAX_PX): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const scale = Math.min(1, maxPx / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      } catch {
        resolve(dataUrl);
      }
    };
    image.onerror = () => reject(new Error('Could not decode the artwork image'));
    image.src = dataUrl;
  });
}

/**
 * Downloads one artwork through the relay and returns a data URL ready to place.
 * Over-sized renditions are downscaled so photo-heavy documents stay manageable.
 */
export async function fetchOpenAccessAsDataUrl(item: OpenAccessItem): Promise<string> {
  const res = await fetch(`${RELAY}?mode=image&url=${encodeURIComponent(item.insertUrl)}`);
  if (!res.ok) throw new Error(`Artwork relay answered ${res.status}`);
  const blob = await res.blob();
  const dataUrl = await blobToDataUrl(blob);
  if (!shouldShrink(blob.size)) return dataUrl;
  return shrinkDataUrl(dataUrl);
}
