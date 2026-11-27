import React, { useEffect, useState } from 'react';
import { AlertCircle, ImageOff, Loader2 } from 'lucide-react';
import {
  EMPTY_PHOTO_RESULT,
  searchPhotos,
  type PhotoHit,
  type PhotoSearchOutcome,
} from '../../utils/photoSearch';

/** A single character is not a search — same rule as the Publisher panel. */
const MIN_QUERY_LENGTH = 2;
/** Wait for the user to stop typing before spending four requests. */
const TYPING_IDLE_MS = 500;
const CACHE_TTL_MS = 5 * 60_000;
const CACHE_LIMIT = 24;
/** Shown before the user types, the way Designer suggests imagery for the design. */
const SUGGESTED_QUERY = 'abstract';
const PER_SOURCE = 6;

interface CacheEntry {
  at: number;
  value: PhotoSearchOutcome;
}

const searchCache = new Map<string, CacheEntry>();

function readCache(key: string): CacheEntry | undefined {
  const entry = searchCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    searchCache.delete(key);
    return undefined;
  }
  // Refresh recency so a repeated query survives the eviction pass below.
  searchCache.delete(key);
  searchCache.set(key, entry);
  return entry;
}

function writeCache(key: string, value: PhotoSearchOutcome): void {
  searchCache.set(key, { at: Date.now(), value });
  while (searchCache.size > CACHE_LIMIT) {
    const oldest = searchCache.keys().next().value;
    if (oldest === undefined) break;
    searchCache.delete(oldest);
  }
}

function SkeletonTile() {
  return (
    <div className="aspect-[4/3] animate-pulse rounded-tile bg-surface-sunken" aria-hidden="true" />
  );
}

/**
 * Photo results for the Designer "Visuals" drawer.
 *
 * Deliberately self-contained: it owns its debounce, its five-minute cache and its
 * per-tile insert state, so the Visuals drawer stays a layout component. Insertion is
 * reported upward — the drawer decides what to do with the data URL.
 */
export const DesignerPhotoSection: React.FC<{
  query: string;
  onInsert: (dataUrl: string, hit: PhotoHit) => void;
}> = ({ query, onInsert }) => {
  const trimmed = query.trim();
  const isSuggested = trimmed.length < MIN_QUERY_LENGTH;
  const term = isSuggested ? SUGGESTED_QUERY : trimmed;

  // Cache reads happen during render, not in an effect: the result for a term is a pure
  // function of (term, cache), so there is nothing to synchronise.
  const cachedValue = readCache(term)?.value;
  const [fetched, setFetched] = useState<{ term: string; value: PhotoSearchOutcome } | null>(
    null
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [insertError, setInsertError] = useState<string | null>(null);

  const outcome = cachedValue ?? (fetched?.term === term ? fetched.value : EMPTY_PHOTO_RESULT);
  const loading = !cachedValue && fetched?.term !== term;

  useEffect(() => {
    // A cached term renders immediately and needs no request at all.
    if (readCache(term)) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      searchPhotos(term, { signal: controller.signal, perSource: PER_SOURCE })
        .then((value) => {
          if (controller.signal.aborted) return;
          writeCache(term, value);
          setFetched({ term, value });
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setFetched({ term, value: EMPTY_PHOTO_RESULT });
        });
    }, TYPING_IDLE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [term]);

  const handlePick = async (hit: PhotoHit) => {
    if (pendingId) return;
    setInsertError(null);
    setPendingId(hit.id);
    try {
      const dataUrl = await hit.insert();
      onInsert(dataUrl, hit);
    } catch {
      setInsertError(`Could not load that ${hit.sourceLabel} image — try another.`);
    } finally {
      setPendingId(null);
    }
  };

  const hits = outcome.hits;
  const failures = outcome.failures;

  return (
    <section className="space-y-2" aria-label="Photos">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-lead font-semibold text-ink">Photos</h3>
        <span className="truncate text-2xs text-ink-muted">
          {isSuggested ? 'Suggested' : `“${term}”`}
        </span>
      </div>

      {loading && hits.length === 0 ? (
        <div className="grid grid-cols-2 gap-2">
          <SkeletonTile />
          <SkeletonTile />
          <SkeletonTile />
          <SkeletonTile />
        </div>
      ) : hits.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {hits.map((hit) => {
            const busy = pendingId === hit.id;
            return (
              <button
                key={hit.id}
                type="button"
                onClick={() => void handlePick(hit)}
                disabled={Boolean(pendingId)}
                title={`${hit.title} — ${hit.credit}`}
                className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-tile bg-surface-sunken ring-1 ring-line transition [content-visibility:auto] hover:ring-accent-line disabled:cursor-progress"
              >
                <img
                  src={hit.thumbUrl}
                  alt={hit.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.04]"
                />
                <span className="absolute left-1 top-1 rounded-chip bg-black/55 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white">
                  {hit.sourceLabel}
                </span>
                {busy && (
                  <span className="absolute inset-0 grid place-items-center bg-black/45">
                    <Loader2 size={18} className="animate-spin text-white" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 rounded-tile border border-dashed border-line px-3 py-5 text-center">
          <ImageOff size={18} className="text-ink-muted" />
          <p className="text-meta text-ink-secondary">No photos for “{term}”</p>
          <p className="text-2xs text-ink-muted">
            Try a broader word — “paper”, “office”, “texture”.
          </p>
        </div>
      )}

      {insertError && (
        <p className="flex items-start gap-1 text-2xs text-ink-secondary">
          <AlertCircle size={12} className="mt-px flex-shrink-0" />
          {insertError}
        </p>
      )}

      {failures.length > 0 && (
        <p className="text-2xs text-ink-muted">
          {failures.length === 4
            ? 'Photo sources are unreachable right now — shapes and graphics still work.'
            : `${failures.length} of 4 photo sources did not answer.`}
        </p>
      )}

      {!loading && hits.length > 0 && (
        <p className="text-2xs text-ink-muted">
          Pixabay · Unsplash · Openverse · museums — keys stay server-side.
        </p>
      )}
    </section>
  );
};
