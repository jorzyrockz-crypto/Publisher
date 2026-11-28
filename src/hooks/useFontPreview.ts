import { useEffect, useRef, useState } from 'react';
import { hasFontStylesheet, loadGoogleFontStylesheet } from '../constants/fonts';

/**
 * Loads a family's stylesheet the first time its row is about to be seen, and says whether
 * the preview is ready.
 *
 * A font list is the one place where showing only what is installed is wrong: the point of the
 * list is to show you faces you do not have yet. So every row asks for its own face — when it
 * is near the viewport, not all at once, and only while there is a connection to fetch from.
 */
export function useFontPreview(family: string, enabled: boolean) {
  const [ready, setReady] = useState(() => hasFontStylesheet(family));
  const nodeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!enabled || ready) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    const node = nodeRef.current;
    if (!node) return;

    let cancelled = false;
    const request = () => {
      void loadGoogleFontStylesheet(family).then(() => {
        if (!cancelled) setReady(true);
      });
    };

    // No observer (very old browser, or a test environment): just ask now.
    if (typeof IntersectionObserver === 'undefined') {
      request();
      return () => {
        cancelled = true;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        request();
      },
      // Start early enough that the face is there by the time the row is read.
      { rootMargin: '160px' }
    );
    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [family, enabled, ready]);

  return { ready, nodeRef } as const;
}
