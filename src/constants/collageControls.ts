/**
 * Which collage controls are reachable from the canvas, and whether they route through the
 * edit context panel.
 *
 * Nested controls (the ones that need a value picked) open in the existing inspector rather
 * than a new floating surface. The flag is here in one place so the experiment can be
 * switched off without touching the direct buttons, which do not depend on any of it.
 */
export const COLLAGE_PANEL_SECTIONS_ENABLED = true;

export type CollageControlSection = 'vibes' | 'layouts' | 'photos' | 'backdrop' | 'frame';

export const COLLAGE_CONTROL_TITLES: Record<CollageControlSection, string> = {
  vibes: 'Vibe packs',
  layouts: 'Layout',
  photos: 'Photos',
  backdrop: 'Backdrop',
  frame: 'Frame',
};
