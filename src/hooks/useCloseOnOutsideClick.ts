import { useEffect } from 'react';

/**
 * A panel closes when you click outside it.
 *
 * Panels here are attached to something selected; a click somewhere else is a click about
 * something else, and a panel that stays to argue about it is in the way. The click that
 * *opened* the panel is not "outside" — by the time the panel exists the pointer is already
 * down — so opening still works.
 */
export function useCloseOnOutsideClick(
  rootRef: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  onClose: () => void
) {
  useEffect(() => {
    if (!enabled) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      // A popover that portals itself to <body> (colour pickers, dropdowns) is still "inside"
      // as far as the user is concerned; leaving one open must not close the panel behind it.
      const inFloating = (target as HTMLElement).closest?.(
        '[data-floating-panel], [role="listbox"], [role="dialog"]'
      );
      if (inFloating) return;
      onClose();
    };
    document.addEventListener('mousedown', onPointerDown, true);
    return () => document.removeEventListener('mousedown', onPointerDown, true);
  }, [rootRef, enabled, onClose]);
}
