import { useCallback, useEffect, useRef } from 'react';
import type React from 'react';

/**
 * Zoom that never re-renders React.
 *
 * Zoom lives in a context, so every step of a pinch or a wheel gesture used to re-render the
 * ribbon, both sidebars, the thumbnails and every element on every page — sixty times a second,
 * to change one number. That is where zooming felt heavy.
 *
 * Instead the visual scale is a CSS custom property, `--sp-zoom`, read by the artboard frames and
 * the page canvases (`calc(… * var(--sp-zoom))`, `scale(var(--sp-zoom))`). A gesture writes that
 * one property straight onto the scroll container: the compositor scales, the layout of the
 * pasteboard follows, and React is not involved until the gesture settles. Then the value is
 * committed to state once, which is also what the zoom readout, the rulers and every drag
 * calculation use.
 *
 * Because state lags by the settle time, `flush()` is called before anything that measures —
 * a drag, a marquee, a click — so those always work from the committed zoom.
 */

const SETTLE_MS = 180;

export function useLiveZoom({
  containerRef,
  zoom,
  setZoom,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  setZoom: (value: number) => void;
}) {
  const commitRef = useRef(setZoom);
  useEffect(() => {
    commitRef.current = setZoom;
  }, [setZoom]);

  const committedRef = useRef(zoom);
  /** Zoom currently painted on screen, when it is ahead of the committed one. */
  const paintedRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // A zoom that came from somewhere else (the toolbar, Fit, a keyboard shortcut) wins over a
  // pending gesture value: drop ours rather than overwrite theirs a moment later.
  useEffect(() => {
    committedRef.current = zoom;
    paintedRef.current = null;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [zoom]);

  const paint = useCallback(
    (value: number) => {
      paintedRef.current = value;
      containerRef.current?.style.setProperty('--sp-zoom', String(value));
    },
    [containerRef]
  );

  const flush = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const painted = paintedRef.current;
    paintedRef.current = null;
    if (painted === null) return;
    if (Math.abs(painted - committedRef.current) < 0.0005) return;
    commitRef.current(painted);
  }, []);

  /**
   * Paints `value` immediately and commits it once the gesture stops moving.
   * With `anchor`, the pasteboard point under the pointer stays under the pointer.
   */
  const zoomLive = useCallback(
    (value: number, anchor?: { clientX: number; clientY: number }) => {
      const container = containerRef.current;
      if (!container) return;

      const from = paintedRef.current ?? committedRef.current;
      const next = Math.min(3, Math.max(0.2, value));
      if (Math.abs(next - from) < 0.0005) return;

      let contentPoint: { x: number; y: number } | null = null;
      if (anchor) {
        const rect = container.getBoundingClientRect();
        contentPoint = {
          x: (container.scrollLeft + (anchor.clientX - rect.left)) / from,
          y: (container.scrollTop + (anchor.clientY - rect.top)) / from,
        };
      }

      paint(next);

      if (contentPoint && anchor) {
        const rect = container.getBoundingClientRect();
        container.scrollLeft = contentPoint.x * next - (anchor.clientX - rect.left);
        container.scrollTop = contentPoint.y * next - (anchor.clientY - rect.top);
      }

      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        const painted = paintedRef.current;
        paintedRef.current = null;
        if (painted !== null && Math.abs(painted - committedRef.current) >= 0.0005) {
          commitRef.current(painted);
        }
      }, SETTLE_MS);
    },
    [containerRef, paint]
  );

  /** Current on-screen zoom, gesture value included. */
  const currentZoom = useCallback(() => paintedRef.current ?? committedRef.current, []);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    []
  );

  return { zoomLive, flush, currentZoom };
}
