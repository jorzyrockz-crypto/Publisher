import { useCallback, useEffect, useRef } from 'react';
import type React from 'react';

/**
 * Touch, taught to a mouse-driven canvas.
 *
 * Everything on the pasteboard — selecting, dragging an element, the resize handles, guides,
 * artboards, panning the pasteboard — is written against `mousedown` / `mousemove` / `mouseup`.
 * Rewriting each of those for pointers would mean touching a dozen drag handlers and getting
 * one of them subtly wrong; instead this bridge turns a finger into exactly those events, so
 * every existing gesture keeps working, including the code paths that decide what a *click*
 * on empty pasteboard means.
 *
 * The bridge also owns what a mouse never had:
 *
 *   - two fingers pinch-zoom, anchored on the point between them, and pan with the same
 *     gesture — the pasteboard point under your fingers stays under your fingers;
 *   - a long press becomes a `contextmenu`, so the canvas right-click menu (Group, Ungroup,
 *     Arrange) is reachable without a right mouse button;
 *   - a second finger landing mid-drag cancels the drag rather than dragging an element while
 *     zooming the sheet.
 *
 * Native scrolling is switched off on the viewport by CSS (`touch-action: none`), which is what
 * lets a finger drag an element instead of scrolling the pasteboard under it.
 */

const TAP_SLOP_PX = 8;
const LONG_PRESS_MS = 550;
const TWO_FINGER_SLOP_PX = 6;

type Mode = 'idle' | 'mouse' | 'pinch';

interface Point {
  x: number;
  y: number;
}

function midpoint(touches: ArrayLike<{ clientX: number; clientY: number }>): Point {
  const [a, b] = [touches[0], touches[1]];
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}

function spread(touches: ArrayLike<{ clientX: number; clientY: number }>): number {
  const [a, b] = [touches[0], touches[1]];
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

const dispatchMouse = (
  type: 'mousedown' | 'mousemove' | 'mouseup',
  point: Point,
  target: EventTarget,
  button = 0
) => {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    clientX: point.x,
    clientY: point.y,
    button,
    buttons: type === 'mouseup' ? 0 : 1,
  });
  // Drag handlers that behave differently for a mouse -- notably "clicking a selected text
  // box opens it for editing" -- can tell a finger from a cursor. On touch a drag moves the
  // box and a double tap opens it.
  Object.defineProperty(event, '__spTouch', { value: true });
  target.dispatchEvent(event);
};

export function useCanvasTouchGestures({
  containerRef,
  zoom,
  setZoom,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  setZoom: (value: number) => void;
}) {
  const modeRef = useRef<Mode>('idle');
  const mouseTargetRef = useRef<EventTarget | null>(null);
  const lastPointRef = useRef<Point>({ x: 0, y: 0 });
  const startPointRef = useRef<Point>({ x: 0, y: 0 });
  const longPressRef = useRef<number | null>(null);
  const pinchRef = useRef<{
    startZoom: number;
    /** Finger spread when the pinch began — the denominator for the scale ratio. */
    spreadAtStart: number;
    /** Pasteboard point under the pinch centre, in unscaled content coordinates. */
    anchor: Point;
    origin: Point;
    moved: boolean;
  } | null>(null);

  // Zoom is read inside touch handlers that outlive a render, so keep the latest in a ref.
  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  const setZoomRef = useRef(setZoom);
  useEffect(() => {
    setZoomRef.current = setZoom;
  }, [setZoom]);

  const cancelLongPress = useCallback(() => {
    if (longPressRef.current !== null) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }, []);

  const endMouse = useCallback(() => {
    cancelLongPress();
    if (modeRef.current !== 'mouse') return;
    const target = mouseTargetRef.current ?? window;
    dispatchMouse('mouseup', lastPointRef.current, target);
    mouseTargetRef.current = null;
    modeRef.current = 'idle';
  }, [cancelLongPress]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;

      // A second finger means a pinch; whatever the first one was dragging, it stops now.
      if (e.touches.length >= 2) {
        if (modeRef.current === 'mouse') endMouse();
        const rect = container.getBoundingClientRect();
        const centre = midpoint(e.touches);
        pinchRef.current = {
          startZoom: zoomRef.current,
          spreadAtStart: Math.max(1, spread(e.touches)),
          anchor: {
            x: (container.scrollLeft + (centre.x - rect.left)) / zoomRef.current,
            y: (container.scrollTop + (centre.y - rect.top)) / zoomRef.current,
          },
          origin: centre,
          moved: false,
        };
        modeRef.current = 'pinch';
        return;
      }

      if (modeRef.current !== 'idle') return;

      const touch = e.touches[0];
      const point = { x: touch.clientX, y: touch.clientY };
      const target = (e.target as HTMLElement) ?? container;

      lastPointRef.current = point;
      startPointRef.current = point;
      mouseTargetRef.current = target;
      modeRef.current = 'mouse';

      dispatchMouse('mousedown', point, target);

      // Long press → the menu a right-click opens. Cancelled the moment the finger travels.
      longPressRef.current = window.setTimeout(() => {
        longPressRef.current = null;
        if (modeRef.current !== 'mouse') return;
        const travelled = Math.hypot(
          lastPointRef.current.x - startPointRef.current.x,
          lastPointRef.current.y - startPointRef.current.y
        );
        if (travelled > TAP_SLOP_PX) return;
        // Let go of the element first, so the menu is not opened on top of a live drag.
        endMouse();
        dispatchMouse('mouseup', lastPointRef.current, target);
        const menu = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          composed: true,
          view: window,
          clientX: startPointRef.current.x,
          clientY: startPointRef.current.y,
          button: 2,
        });
        target.dispatchEvent(menu);
      }, LONG_PRESS_MS);
    },
    [containerRef, endMouse]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;

      if (modeRef.current === 'pinch') {
        const pinch = pinchRef.current;
        if (!pinch || e.touches.length < 2) return;
        const distance = spread(e.touches);
        if (!pinch.moved && distance === 0) return;

        // Ignore the first pixels of either kind of movement, then accept both: a pinch that
        // also travels is still a pinch, and a pinch that does not travel is still a pinch.
        const centre = midpoint(e.touches);
        const centreMoved = Math.hypot(centre.x - pinch.origin.x, centre.y - pinch.origin.y);
        const spreadChanged = Math.abs(distance - pinch.spreadAtStart);
        if (!pinch.moved && centreMoved < TWO_FINGER_SLOP_PX && spreadChanged < 4) return;
        pinch.moved = true;

        // Scale is the ratio of finger spread to the spread when the pinch began.
        const next = Math.min(3, Math.max(0.2, (pinch.startZoom * distance) / pinch.spreadAtStart));
        setZoomRef.current(Number(next.toFixed(2)));

        // Keep the pasteboard point that was under the fingers under the fingers: this is what
        // makes a pinch feel anchored rather than like the sheet sliding away.
        const rect = container.getBoundingClientRect();
        container.scrollLeft = pinch.anchor.x * next - (centre.x - rect.left);
        container.scrollTop = pinch.anchor.y * next - (centre.y - rect.top);
        return;
      }

      if (modeRef.current !== 'mouse') return;
      const touch = e.touches[0];
      if (!touch) return;

      const point = { x: touch.clientX, y: touch.clientY };
      if (
        Math.hypot(point.x - startPointRef.current.x, point.y - startPointRef.current.y) >
        TAP_SLOP_PX
      ) {
        cancelLongPress();
      }
      lastPointRef.current = point;
      dispatchMouse('mousemove', point, window);
    },
    [cancelLongPress, containerRef]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (modeRef.current === 'pinch') {
        if (e.touches.length < 2) {
          modeRef.current = 'idle';
          pinchRef.current = null;
        }
        return;
      }
      if (modeRef.current === 'mouse' && e.touches.length === 0) endMouse();
    },
    [endMouse]
  );

  const handleTouchCancel = useCallback(() => {
    cancelLongPress();
    if (modeRef.current === 'mouse') endMouse();
    modeRef.current = 'idle';
    pinchRef.current = null;
  }, [cancelLongPress, endMouse]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  };
}

export type { Point };
