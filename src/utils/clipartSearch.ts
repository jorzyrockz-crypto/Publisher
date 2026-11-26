import { encodeSvgDataUri } from './svgRecolor';

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

export function toProxiedClipartUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('https://clipart.free/')) {
    return rawUrl.replace('https://clipart.free/', '/api/clipart-free/');
  }
  return rawUrl;
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

  const proxyUrl = `/api/clipart-free/api/clipart/search?${params.toString()}`;
  const res = await fetch(proxyUrl, { signal: options.signal });

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
      const svgRes = await fetch(toProxiedClipartUrl(item.svg_url));
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
  const pngRes = await fetch(toProxiedClipartUrl(pngUrl));
  if (!pngRes.ok) {
    throw new Error(`Failed to download clipart (HTTP ${pngRes.status})`);
  }
  const blob = await pngRes.blob();
  return blobToDataUrl(blob);
}
