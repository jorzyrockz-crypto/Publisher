import { useEffect, useRef, useState } from 'react';

/**
 * Fires once when the element first scrolls into view.
 *
 * The gallery is 73 cards, and a card is not a picture — it is a live page: every text box, shape
 * and WordArt sign on the template, rendered in the DOM. Rendering all 73 on mount is several
 * thousand elements of work before the hero has even painted. Waiting for a card to come near the
 * viewport spreads that work out to the moment it is actually needed, which is also what makes the
 * first paint on Home immediate.
 *
 * `rootMargin` pre-loads slightly below the fold so a card is never seen empty.
 */
export function useInView<T extends HTMLElement>(
  options: { rootMargin?: string; enabled?: boolean } = {}
): [React.RefObject<T | null>, boolean] {
  const { rootMargin = '320px', enabled = true } = options;
  const ref = useRef<T | null>(null);
  // No IntersectionObserver (an old browser, or a test) means "assume visible": the gallery degrades
  // to rendering everything rather than showing empty tiles forever.
  const [inView, setInView] = useState(
    () => !enabled || typeof IntersectionObserver === 'undefined'
  );

  useEffect(() => {
    if (!enabled || inView) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, inView, rootMargin]);

  return [ref, inView];
}
