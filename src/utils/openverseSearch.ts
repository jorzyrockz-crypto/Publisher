/**
 * Openverse (WordPress Foundation) — CC-licensed image search.
 *
 * Unlike Clipart.Free this API needs no key and sends permissive CORS headers,
 * including on its thumbnails, so it works from a static host *and* from a
 * sandboxed preview without any proxy.
 *
 * Docs: https://api.openverse.org/v1/
 */

export interface OpenverseItem {
  id: string;
  title: string;
  thumbUrl: string;
  insertUrl: string;
  landingUrl: string;
  creator: string;
  license: string;
  source: string;
  width: number;
  height: number;
  isSvg: boolean;
}

const API_BASE = 'https://api.openverse.org/v1/images/';

interface RawOpenverseResult {
  id?: string;
  title?: string;
  url?: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  creator?: string;
  license?: string;
  license_version?: string;
  foreign_landing_url?: string;
  source?: string;
  filetype?: string;
}

function toItem(raw: RawOpenverseResult): OpenverseItem | null {
  const thumbUrl = raw.thumbnail || '';
  const insertUrl = raw.url || thumbUrl;
  if (!thumbUrl || !insertUrl) return null;

  return {
    id: raw.id || insertUrl,
    title: (raw.title || 'Untitled').slice(0, 80),
    thumbUrl,
    insertUrl,
    landingUrl: raw.foreign_landing_url || '',
    creator: raw.creator || '',
    license: `${(raw.license || 'cc').toUpperCase()}${raw.license_version ? ` ${raw.license_version}` : ''}`,
    source: raw.source || 'openverse',
    width: raw.width || 600,
    height: raw.height || 600,
    isSvg: (raw.filetype || '').toLowerCase() === 'svg',
  };
}

export async function searchOpenverse(
  query: string,
  options?: { limit?: number; signal?: AbortSignal }
): Promise<OpenverseItem[]> {
  const params = new URLSearchParams({
    q: query.trim() || 'abstract',
    page_size: String(Math.min(20, options?.limit || 16)),
    mature: 'false',
  });

  const res = await fetch(`${API_BASE}?${params.toString()}`, {
    signal: options?.signal,
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error('Openverse rate-limited anonymous requests — try again in a minute.');
    }
    throw new Error(`Openverse HTTP ${res.status}`);
  }

  const data = await res.json();
  const results: RawOpenverseResult[] = Array.isArray(data?.results) ? data.results : [];
  return results.map(toItem).filter((x): x is OpenverseItem => Boolean(x));
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
 * Downloads an Openverse image as a self-contained data URL so canvas export
 * works offline. Tries the CORS-safe thumbnail first, then the full-size file.
 */
export async function fetchOpenverseAsDataUrl(item: OpenverseItem): Promise<string> {
  const candidates = [item.thumbUrl, item.insertUrl].filter(Boolean);

  let lastError: unknown = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) {
        lastError = new Error('Not an image');
        continue;
      }
      return await blobToDataUrl(blob);
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    `Could not download this Openverse image (${
      lastError instanceof Error ? lastError.message : 'network error'
    }). The origin site may block hot-linking — try another result.`
  );
}
