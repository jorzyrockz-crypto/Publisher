/**
 * Photo search shared by the Publisher stock panel and the Designer "Visuals" drawer.
 *
 * The Publisher panel (StockArtPanel) grew its own search state, source chips and key
 * management. The Designer workspace needs the same photographs without that chrome, so
 * this module exposes one small aggregate over the sources that return *photos*:
 * Pixabay, Unsplash, Openverse and public-domain museum art.
 *
 * Kept deliberately thin: it does not cache, debounce or render. Those belong to the
 * consuming component so the two surfaces can tune them independently.
 */
import {
  fetchOpenAccessAsDataUrl,
  searchOpenAccess,
  type OpenAccessItem,
} from './openAccessArt';
import {
  fetchOpenverseAsDataUrl,
  searchOpenverse,
  type OpenverseItem,
} from './openverseSearch';
import { fetchPixabayAsDataUrl, searchPixabay, type PixabayItem } from './pixabaySearch';
import {
  fetchUnsplashAsDataUrl,
  searchUnsplash,
  trackUnsplashUse,
  type UnsplashItem,
} from './unsplashSearch';

export type PhotoSourceId = 'pixabay' | 'unsplash' | 'openverse' | 'museum';

export interface PhotoHit {
  /** Already namespaced by source — ids collide across APIs. */
  id: string;
  source: PhotoSourceId;
  sourceLabel: string;
  title: string;
  thumbUrl: string;
  /** "Photographer · Pixabay" style, for the tile tooltip and the credit line. */
  credit: string;
  pageUrl: string;
  /** Resolves to a data URL at insert width. Called only when the user picks the tile. */
  insert: () => Promise<string>;
}

export interface PhotoSearchOutcome {
  hits: PhotoHit[];
  counts: Partial<Record<PhotoSourceId, number>>;
  /** Sources that rejected, so the UI can say so instead of pretending they are empty. */
  failures: PhotoSourceId[];
}

export interface PhotoSearchOptions {
  perSource?: number;
  signal?: AbortSignal;
}

const SOURCE_LABELS: Record<PhotoSourceId, string> = {
  pixabay: 'Pixabay',
  unsplash: 'Unsplash',
  openverse: 'Openverse',
  museum: 'Museum',
};

export const EMPTY_PHOTO_RESULT: PhotoSearchOutcome = { hits: [], counts: {}, failures: [] };

/** Round-robin so a single prolific source cannot own the top of the grid. */
function interleave(buckets: PhotoHit[][]): PhotoHit[] {
  const out: PhotoHit[] = [];
  const depth = Math.max(0, ...buckets.map((bucket) => bucket.length));
  for (let i = 0; i < depth; i += 1) {
    for (const bucket of buckets) {
      const hit = bucket[i];
      if (hit) out.push(hit);
    }
  }
  return out;
}

function toPixabayHits(items: PixabayItem[]): PhotoHit[] {
  return items
    .filter((item) => item.thumbUrl)
    .map((item) => ({
      id: `pixabay:${item.id}`,
      source: 'pixabay' as const,
      sourceLabel: SOURCE_LABELS.pixabay,
      title: item.title || item.tags || 'Pixabay photo',
      thumbUrl: item.thumbUrl,
      credit: item.user ? `${item.user} · Pixabay` : 'Pixabay',
      pageUrl: item.pageUrl,
      insert: () => fetchPixabayAsDataUrl(item),
    }));
}

function toUnsplashHits(items: UnsplashItem[]): PhotoHit[] {
  return items
    .filter((item) => item.thumbUrl)
    .map((item) => ({
      id: `unsplash:${item.id}`,
      source: 'unsplash' as const,
      sourceLabel: SOURCE_LABELS.unsplash,
      title: item.title || 'Unsplash photo',
      thumbUrl: item.thumbUrl,
      credit: item.user ? `${item.user} · Unsplash` : 'Unsplash',
      pageUrl: item.pageUrl,
      insert: async () => {
        // Unsplash's API terms require a download event when a photo is actually used.
        await trackUnsplashUse(item);
        return fetchUnsplashAsDataUrl(item);
      },
    }));
}

function toOpenverseHits(items: OpenverseItem[]): PhotoHit[] {
  return items
    .filter((item) => item.thumbUrl)
    .map((item) => ({
      id: `openverse:${item.id}`,
      source: 'openverse' as const,
      sourceLabel: SOURCE_LABELS.openverse,
      title: item.title || 'Openverse image',
      thumbUrl: item.thumbUrl,
      credit: item.creator ? `${item.creator} · ${item.license || 'CC'}` : 'Openverse',
      pageUrl: item.landingUrl,
      insert: () => fetchOpenverseAsDataUrl(item),
    }));
}

function toMuseumHits(items: OpenAccessItem[]): PhotoHit[] {
  return items
    .filter((item) => item.thumbUrl)
    .map((item) => ({
      id: `museum:${item.id}`,
      source: 'museum' as const,
      sourceLabel: SOURCE_LABELS.museum,
      title: item.title || 'Museum artwork',
      thumbUrl: item.thumbUrl,
      credit: item.creator ? `${item.creator} · ${item.museum}` : item.museum,
      pageUrl: item.pageUrl,
      insert: () => fetchOpenAccessAsDataUrl(item),
    }));
}

/**
 * Searches every photo source in parallel. A source that fails — missing key, offline
 * relay, rate limit — is reported in `failures` rather than thrown, because a design
 * tool must not show an empty grid when three of four sources answered.
 */
export async function searchPhotos(
  query: string,
  options: PhotoSearchOptions = {}
): Promise<PhotoSearchOutcome> {
  const q = query.trim();
  if (!q) return EMPTY_PHOTO_RESULT;

  const perSource = Math.min(24, Math.max(4, options.perSource ?? 8));
  const signal = options.signal;

  const sources: Array<{
    id: PhotoSourceId;
    run: () => Promise<PhotoHit[]>;
  }> = [
    {
      id: 'pixabay',
      run: async () =>
        toPixabayHits((await searchPixabay(q, { perPage: perSource })).items),
    },
    {
      id: 'unsplash',
      run: async () =>
        toUnsplashHits((await searchUnsplash(q, { perPage: perSource })).items),
    },
    {
      id: 'openverse',
      run: async () =>
        toOpenverseHits(await searchOpenverse(q, { limit: perSource, signal })),
    },
    {
      id: 'museum',
      run: async () =>
        toMuseumHits((await searchOpenAccess(q, { limit: perSource })).items),
    },
  ];

  const settled = await Promise.allSettled(sources.map((source) => source.run()));

  const hits: PhotoHit[][] = [];
  const counts: Partial<Record<PhotoSourceId, number>> = {};
  const failures: PhotoSourceId[] = [];

  settled.forEach((result, index) => {
    const source = sources[index];
    if (result.status === 'fulfilled') {
      hits.push(result.value);
      counts[source.id] = result.value.length;
    } else {
      failures.push(source.id);
    }
  });

  if (signal?.aborted) return EMPTY_PHOTO_RESULT;

  return { hits: interleave(hits), counts, failures };
}

export { SOURCE_LABELS as PHOTO_SOURCE_LABELS };
