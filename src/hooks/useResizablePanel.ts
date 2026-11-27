import React, { useCallback, useEffect, useState } from 'react';

export function useWindowWidth(): number {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return width;
}

export function useResizablePanel(options: {
  storageKey: string;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  edge: 'left' | 'right'; // 'right' means handle is on the right edge (left sidebar); 'left' means handle is on the left edge (right sidebar)
}) {
  const { storageKey, defaultWidth, minWidth, maxWidth, edge } = options;

  const [width, setWidth] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(storageKey));
      if (Number.isFinite(saved) && saved >= minWidth && saved <= maxWidth) {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return defaultWidth;
  });

  const windowWidth = useWindowWidth();
  const effectiveWidth = Math.min(width, Math.max(220, windowWidth - 48));

  const [isDragging, setIsDragging] = useState(false);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = width;
      setIsDragging(true);

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const nextWidth = edge === 'right' ? startWidth + delta : startWidth - delta;
        const clamped = Math.max(minWidth, Math.min(maxWidth, nextWidth));
        setWidth(clamped);
      };

      const onMouseUp = (upEvent: MouseEvent) => {
        const delta = upEvent.clientX - startX;
        const nextWidth = edge === 'right' ? startWidth + delta : startWidth - delta;
        const clamped = Math.max(minWidth, Math.min(maxWidth, nextWidth));
        setIsDragging(false);
        try {
          localStorage.setItem(storageKey, String(Math.round(clamped)));
        } catch {
          // ignore
        }
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [width, minWidth, maxWidth, edge, storageKey]
  );

  const resetWidth = useCallback(() => {
    setWidth(defaultWidth);
    try {
      localStorage.setItem(storageKey, String(defaultWidth));
    } catch {
      // ignore
    }
  }, [defaultWidth, storageKey]);

  return { width: effectiveWidth, isDragging, onMouseDown, resetWidth };
}
