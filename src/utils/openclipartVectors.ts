/**
 * Openclipart — free SVG clip art (CC0).
 *
 * The one source in the panel that returns **real vectors**: every file is an
 * SVG dedicated to the public domain, so a drawing stays sharp at any size, can
 * be recoloured by editing the file, and needs no credit.
 *
 * There is no JSON API any more (`?format=json` returns HTML), so `api/openclipart`
 * parses the search page and both images are relayed:
 *  - thumbnails, so a Referer or bot rule cannot leave the grid blank;
 *  - the SVG itself, because the document stores a data URL and must keep working
 *    without Openclipart.
 *
 * Terms: https://openclipart.org/about — all clip art is CC0.
 */

export interface OpenclipartItem {
  id: string;
  title: string;
  slug: string;
  /** Relayed 200px PNG, for the grid. */
  thumbUrl: string;
  /** 800px PNG preview on their CDN — used as a fallback preview only. */
  previewUrl: string;
  pageUrl: string;
  licence: string;
}

export interface OpenclipartSearchOptions {
  page?: number;
  signal?: AbortSignal;
}

export interface OpenclipartSearchResult {
  items: OpenclipartItem[];
  total: number;
  page: number;
  hasMore: boolean;
}

export const OPENCLIPART_CREDIT =
  'Free vector clip art from Openclipart — every file is dedicated to the public domain (CC0).';

const RELAY = '/api/openclipart';

function toItem(raw: Partial<OpenclipartItem> | null): OpenclipartItem | null {
  const id = raw?.id ? String(raw.id) : '';
  if (!id) return null;
  return {
    id,
    title: (raw?.title || `Clipart #${id}`).slice(0, 90),
    slug: raw?.slug || '',
    // Thumbnails go through the relay so a missing Referer can never blank the grid.
    thumbUrl: `${RELAY}?mode=thumb&id=${encodeURIComponent(id)}`,
    previewUrl: raw?.previewUrl || '',
    pageUrl: raw?.pageUrl || `https://openclipart.org/detail/${id}`,
    licence: raw?.licence || 'CC0 / public domain',
  };
}

export async function searchOpenclipart(
  query: string,
  options: OpenclipartSearchOptions = {}
): Promise<OpenclipartSearchResult> {
  const page = Math.max(1, options.page ?? 1);
  const params = new URLSearchParams({ mode: 'search', q: query.trim(), page: String(page) });

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
    throw new Error(`Openclipart answered ${res.status}${detail ? `: ${detail}` : ''}`);
  }

  const data = (await res.json()) as {
    items?: Partial<OpenclipartItem>[];
    total?: number;
    hasMore?: boolean;
  };
  return {
    items: (data.items ?? []).map(toItem).filter((item): item is OpenclipartItem => item !== null),
    total: data.total ?? 0,
    page,
    hasMore: Boolean(data.hasMore),
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read the downloaded clip art'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Downloads the SVG through the relay and returns a data URL. The bytes are
 * checked: if their site answers with an HTML page (bot check, or the file was
 * removed), that must surface as an error, not as a broken image on the page.
 */
export async function fetchOpenclipartSvgAsDataUrl(item: OpenclipartItem): Promise<string> {
  const res = await fetch(`${RELAY}?mode=svg&id=${encodeURIComponent(item.id)}`);
  if (!res.ok) throw new Error(`Clipart download answered ${res.status}`);
  const contentType = res.headers.get('content-type') || '';
  const blob = await res.blob();
  if (contentType.includes('text/html')) {
    throw new Error('Clipart download returned a web page instead of an SVG — try again in a moment.');
  }
  if (blob.size < 64) throw new Error('Clipart download was empty.');
  return blobToDataUrl(blob);
}
