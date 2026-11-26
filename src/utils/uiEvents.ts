/**
 * Tiny cross-component event bus for shell-level UI actions (no context churn).
 */

export const OPEN_SHORTCUTS_EVENT = 'studiopress:open-shortcuts';

/** Opens the keyboard cheatsheet from anywhere in the app. */
export function openShortcutsModal(): void {
  window.dispatchEvent(new CustomEvent(OPEN_SHORTCUTS_EVENT));
}
