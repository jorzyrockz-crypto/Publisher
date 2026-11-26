import { useEffect, useState } from 'react';

export interface ImageAspect {
  width: number;
  height: number;
}

/**
 * Intrinsic size of an image source, cached per URL.
 *
 * A cropped picture can only slide on an axis where it is bigger than its
 * frame, so the pan controls need the real pixel size of the picture — not just
 * the size of the box it is drawn in.
 */
const cache = new Map<string, ImageAspect | null>();
const pending = new Map<string, Array<(size: ImageAspect | null) => void>>();

function load(src: string, done: (size: ImageAspect | null) => void) {
  if (cache.has(src)) {
    done(cache.get(src) ?? null);
    return;
  }
  const waiting = pending.get(src);
  if (waiting) {
    waiting.push(done);
    return;
  }
  pending.set(src, [done]);
  const img = new Image();
  const finish = (size: ImageAspect | null) => {
    cache.set(src, size);
    const waitingList = pending.get(src) || [];
    pending.delete(src);
    waitingList.forEach((cb) => cb(size));
  };
  img.onload = () =>
    finish(
      img.naturalWidth > 0 && img.naturalHeight > 0
        ? { width: img.naturalWidth, height: img.naturalHeight }
        : null
    );
  img.onerror = () => finish(null);
  img.src = src;
}

export function useImageAspect(src?: string): ImageAspect | null {
  const [loaded, setLoaded] = useState<{ src?: string; size: ImageAspect | null } | null>(null);

  useEffect(() => {
    // Already measured — the value is read during render, so nothing to do.
    if (!src || cache.has(src)) return;
    let active = true;
    load(src, (size) => {
      if (active) setLoaded({ src, size });
    });
    return () => {
      active = false;
    };
  }, [src]);

  if (!src) return null;
  if (cache.has(src)) return cache.get(src) ?? null;
  return loaded && loaded.src === src ? loaded.size : null;
}
