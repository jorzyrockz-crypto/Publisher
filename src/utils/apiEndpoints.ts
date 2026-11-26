/**
 * Static-hosting aware endpoint resolver.
 *
 * In development StudioPress proxies third-party APIs through the Vite dev
 * server (`/api/pollinations`, `/api/clipart-free`, `/api/wikimedia-*`) so the
 * browser never sees a cross-origin request.  A production build (GitHub Pages,
 * Netlify, S3, ...) has no dev server, so those `/api/*` routes would 404.
 *
 * This module centralises the decision:
 *
 *  1. APIs that already send permissive CORS headers (Pollinations, Wikimedia,
 *     Iconify) are called **directly** in production.
 *  2. APIs that require a proxy in production (Clipart.Free, because its API is
 *     keyed and sends no CORS header) use an optional user-configured proxy
 *     (Cloudflare Worker / Vercel function).  The URL can come from
 *     `VITE_CLIPART_PROXY_URL` at build time or be set at runtime in the UI
 *     (stored in localStorage) — see `docs/static-hosting.md`.
 *
 * Every resolver returns an ordered list of candidate URLs so callers can simply
 * walk the list and use the first one that answers.
 */

// Guarded so the module is also importable outside Vite (tests / scripts).
const env = ((import.meta as unknown as { env?: Record<string, string | boolean | undefined> })
  .env ?? {}) as Record<string, string | boolean | undefined>;

/** True when the app was built for a static host (no Vite dev proxy available). */
export const IS_STATIC_HOST = !env.DEV;

export const CLIPART_PROXY_STORAGE_KEY = 'studiopress_clipart_proxy_url';
export const WIKIMEDIA_PROXY_STORAGE_KEY = 'studiopress_wikimedia_proxy_url';
export const POLLINATIONS_KEY_STORAGE_KEY = 'studiopress_pollinations_api_key';

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    if (value.trim()) localStorage.setItem(key, value.trim());
    else localStorage.removeItem(key);
  } catch {
    // ignore quota / privacy-mode errors
  }
}

function normaliseBase(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function unique(urls: string[]): string[] {
  return Array.from(new Set(urls.filter(Boolean)));
}

/* ------------------------------------------------------------------ */
/* Clipart.Free proxy                                                  */
/* ------------------------------------------------------------------ */

export function getClipartProxyBase(): string {
  const stored = readStorage(CLIPART_PROXY_STORAGE_KEY);
  if (stored !== null) return normaliseBase(stored);
  return normaliseBase(String(env.VITE_CLIPART_PROXY_URL || ''));
}

export function saveClipartProxyBase(url: string): void {
  writeStorage(CLIPART_PROXY_STORAGE_KEY, url);
}

/* ------------------------------------------------------------------ */
/* Wikimedia proxy (rarely needed — upload.wikimedia.org sends CORS)    */
/* ------------------------------------------------------------------ */

export function getWikimediaProxyBase(): string {
  const stored = readStorage(WIKIMEDIA_PROXY_STORAGE_KEY);
  if (stored !== null) return normaliseBase(stored);
  return normaliseBase(String(env.VITE_WIKIMEDIA_PROXY_URL || ''));
}

export function saveWikimediaProxyBase(url: string): void {
  writeStorage(WIKIMEDIA_PROXY_STORAGE_KEY, url);
}

/* ------------------------------------------------------------------ */
/* Pollinations.ai — free Flux image generation                        */
/* ------------------------------------------------------------------ */

/**
 * Optional Pollinations key. Anonymous generation is now throttled or rejected
 * outright (HTTP 401/402/500), so a key can be pasted in the UI
 * (`studiopress_pollinations_api_key`) or inlined at build time with
 * `VITE_POLLINATIONS_API_KEY`.
 */
export function getPollinationsKey(): string {
  const stored = readStorage(POLLINATIONS_KEY_STORAGE_KEY);
  if (stored !== null) return stored.trim();
  return String(env.VITE_POLLINATIONS_API_KEY || '').trim();
}

export function savePollinationsKey(key: string): void {
  writeStorage(POLLINATIONS_KEY_STORAGE_KEY, key);
}

/**
 * Candidate URLs for a Pollinations request.
 *
 * Order: legacy keyless host (still the fastest when it answers), the current
 * `gen.pollinations.ai` API, then the Vite dev proxy. The key, when present, is
 * appended as `?key=` — that form survives `<img src>` requests, which cannot
 * send an Authorization header.
 *
 * @param pathAndQuery e.g. `/prompt/a%20cat?model=flux&width=768`
 */
export function resolvePollinationsUrls(pathAndQuery: string): string[] {
  const key = getPollinationsKey();
  const withKey = (url: string): string => {
    if (!key || /[?&]key=/.test(url)) return url;
    return `${url}${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(key)}`;
  };

  const direct = `https://image.pollinations.ai${pathAndQuery}`;
  const gen = pathAndQuery.startsWith('/prompt/')
    ? `https://gen.pollinations.ai/image/${pathAndQuery.slice('/prompt/'.length)}`
    : `https://gen.pollinations.ai${pathAndQuery}`;
  const devProxy = `/api/pollinations${pathAndQuery}`;

  const ordered = IS_STATIC_HOST ? [direct, gen, devProxy] : [devProxy, direct, gen];
  return unique(ordered).map(withKey);
}

/* ------------------------------------------------------------------ */
/* Clipart.Free search + assets                                        */
/* ------------------------------------------------------------------ */

/**
 * Candidate URLs for a Clipart.Free search.
 * @param pathAndQuery e.g. `/api/clipart/search?q=cat&key=cf_...`
 */
export function resolveClipartSearchUrls(pathAndQuery: string): string[] {
  const proxyBase = getClipartProxyBase();
  const direct = `https://clipart.free${pathAndQuery}`;
  const devProxy = `/api/clipart-free${pathAndQuery}`;
  const customProxy = proxyBase ? `${proxyBase}${pathAndQuery}` : '';
  // Static hosts ship a serverless proxy that holds the API key server-side
  // (`api/clipart.js`), so the browser needs neither CORS nor a key.
  const serverless = IS_STATIC_HOST ? clipartServerlessSearchUrl(pathAndQuery) : '';

  // A user-configured proxy wins; otherwise try the browser's own request first
  // (fast when clipart.free does send CORS) and keep the proxies as fallbacks.
  if (proxyBase) return unique([customProxy, direct, serverless, devProxy]);
  return unique([direct, serverless, devProxy]);
}

/**
 * Maps a Clipart.Free REST path onto the same-origin serverless proxy
 * (`/api/clipart?mode=search&…`). Any API key is stripped: the function injects
 * its own from the environment.
 */
export function clipartServerlessSearchUrl(pathAndQuery: string): string {
  const [path, query = ''] = pathAndQuery.split('?');
  if (!/^\/api\/(v1\/clipart|clipart)\/search$|^\/api\/search$/.test(path)) return '';
  const params = new URLSearchParams(query);
  params.delete('key');
  params.set('mode', 'search');
  return `/api/clipart?${params.toString()}`;
}

/**
 * Candidate URLs for downloading a Clipart.Free asset (SVG/PNG).
 * @param rawUrl absolute clipart.free URL
 */
export function resolveClipartAssetUrls(rawUrl: string): string[] {
  if (!rawUrl) return [];
  const proxyBase = getClipartProxyBase();

  const absolute = rawUrl.startsWith('https://clipart.free/')
    ? rawUrl
    : rawUrl.startsWith('/')
      ? `https://clipart.free${rawUrl}`
      : rawUrl;

  const path = absolute.startsWith('https://clipart.free')
    ? absolute.slice('https://clipart.free'.length)
    : '';

  const candidates: string[] = [];
  if (proxyBase && path) candidates.push(`${proxyBase}${path}`);
  candidates.push(absolute);
  if (IS_STATIC_HOST && /^https:\/\/clipart\.free\//.test(absolute)) {
    candidates.push(`/api/clipart?mode=asset&url=${encodeURIComponent(absolute)}`);
  }
  if (!IS_STATIC_HOST && path) candidates.push(`/api/clipart-free${path}`);

  return unique(candidates);
}

/* ------------------------------------------------------------------ */
/* Wikimedia Commons assets                                            */
/* ------------------------------------------------------------------ */

/**
 * Candidate URLs for downloading a Wikimedia asset
 * (upload.wikimedia.org / thumb.wikimedia.org send `access-control-allow-origin: *`,
 * so a direct request works from a static host).
 */
export function resolveWikimediaAssetUrls(rawUrl: string): string[] {
  if (!rawUrl) return [];
  const proxyBase = getWikimediaProxyBase();

  if (rawUrl.startsWith('/api/wikimedia-upload/') || rawUrl.startsWith('/api/wikimedia-thumb/')) {
    if (!IS_STATIC_HOST) return [rawUrl];
    if (rawUrl.startsWith('/api/wikimedia-upload/')) {
      return unique([`https://upload.wikimedia.org/${rawUrl.slice('/api/wikimedia-upload/'.length)}`]);
    }
    return unique([`https://thumb.wikimedia.org/${rawUrl.slice('/api/wikimedia-thumb/'.length)}`]);
  }

  const candidates: string[] = [rawUrl];

  if (proxyBase) {
    if (rawUrl.startsWith('https://upload.wikimedia.org/')) {
      candidates.unshift(`${proxyBase}/upload/${rawUrl.slice('https://upload.wikimedia.org/'.length)}`);
    } else if (rawUrl.startsWith('https://thumb.wikimedia.org/')) {
      candidates.unshift(`${proxyBase}/thumb/${rawUrl.slice('https://thumb.wikimedia.org/'.length)}`);
    }
  }

  if (!IS_STATIC_HOST) {
    if (rawUrl.startsWith('https://upload.wikimedia.org/')) {
      candidates.push(rawUrl.replace('https://upload.wikimedia.org/', '/api/wikimedia-upload/'));
    } else if (rawUrl.startsWith('https://thumb.wikimedia.org/')) {
      candidates.push(rawUrl.replace('https://thumb.wikimedia.org/', '/api/wikimedia-thumb/'));
    }
  }

  return unique(candidates);
}

/* ------------------------------------------------------------------ */
/* Generic helpers                                                     */
/* ------------------------------------------------------------------ */

export interface FetchAttempt {
  url: string;
  /** HTTP status, or undefined when the request never completed. */
  status?: number;
  /** Network/CORS error message when the request never completed. */
  networkError?: string;
}

/** Error carrying every attempt so the UI can explain *why* a source failed. */
export class FetchAttemptError extends Error {
  attempts: FetchAttempt[];

  constructor(attempts: FetchAttempt[]) {
    super(attempts.map((a) => `${a.url} → ${a.status ? `HTTP ${a.status}` : a.networkError}`).join('; '));
    this.name = 'FetchAttemptError';
    this.attempts = attempts;
  }
}

/**
 * Fetches the first candidate URL that responds `ok`.
 * Returns the last real HTTP response if nothing succeeded, and throws a
 * `FetchAttemptError` (with per-URL diagnostics) when every attempt failed at
 * the network level (offline, blocked, CORS).
 */
export async function fetchFirstOk(
  urls: string[],
  init?: RequestInit
): Promise<Response> {
  const attempts: FetchAttempt[] = [];
  let lastResponse: Response | null = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, init);
      attempts.push({ url, status: res.status });
      if (res.ok) return res;
      lastResponse = res;
    } catch (err) {
      if (init?.signal?.aborted) throw err;
      attempts.push({
        url,
        networkError: err instanceof Error ? err.message : 'Network error',
      });
    }
  }

  if (lastResponse) return lastResponse; // let callers surface a real HTTP status
  throw new FetchAttemptError(attempts);
}

/** Human-readable hint shown when a static host blocks a keyed API. */
export const CLIPART_PROXY_HINT =
  'Clipart.Free blocks direct browser calls on static hosting. Add a proxy URL under the 🔑 key icon, or use Iconify / Wikimedia sources.';
