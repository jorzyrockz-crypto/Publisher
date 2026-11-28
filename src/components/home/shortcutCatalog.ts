import type { FormatFilter } from './homeCatalog';

/**
 * The six ways to start, as data.
 *
 * These were pills. A pill is a label; a card is a promise with a picture on it, and the row inside
 * the hero now speaks the same language as the rest of Home. Keeping the list here rather than in
 * the component lets `npm run check:home` hold each card to its destination: a group that still has
 * templates, a search that still finds something, a size the blank builder still knows.
 */
export type HomeShortcutAction =
  | { kind: 'tarpapel' }
  | { kind: 'template'; group: string; format?: FormatFilter; query?: string }
  | { kind: 'blank'; spec: 'a4' | 'square' };

export interface HomeShortcut {
  id: string;
  /** Which pastel the card wears — see `.home-shortcut[data-tone]` in `src/index.css`. */
  tone: 'violet' | 'amber' | 'teal' | 'rose' | 'sky' | 'slate';
  title: string;
  /** One line beside the title. Longer than this and it truncates on a laptop. */
  subtitle: string;
  art: string;
  width: number;
  height: number;
  action: HomeShortcutAction;
}

export const HOME_SHORTCUTS: HomeShortcut[] = [
  {
    id: 'tarpapel-3x2',
    tone: 'amber',
    title: 'Tarpapel (3×2)',
    subtitle: 'Six taped A4 sheets',
    art: '/home/mini-tarpapel.webp',
    width: 300,
    height: 169,
    action: { kind: 'tarpapel' },
  },
  {
    id: 'reading-corner',
    tone: 'teal',
    title: 'Reading Corner',
    subtitle: 'Book nook signs',
    art: '/home/mini-reading.webp',
    width: 300,
    height: 173,
    action: { kind: 'template', group: 'Reading Corner' },
  },
  {
    id: 'a4-poster',
    tone: 'violet',
    title: 'A4 Poster',
    subtitle: 'Print-ready sheet',
    art: '/home/mini-poster.webp',
    width: 300,
    height: 399,
    action: { kind: 'template', group: 'Posters & Flyers', format: 'portrait', query: 'a4' },
  },
  {
    id: 'photo-collage',
    tone: 'rose',
    title: 'Photo Collage',
    subtitle: 'Photos into a grid',
    art: '/home/mini-collage.webp',
    width: 300,
    height: 304,
    action: { kind: 'template', group: 'Collages' },
  },
  {
    id: 'social-media',
    tone: 'sky',
    title: 'Social Media',
    subtitle: '1080 square post',
    art: '/home/mini-social.webp',
    width: 300,
    height: 231,
    action: { kind: 'blank', spec: 'square' },
  },
  {
    id: 'blank-canvas',
    tone: 'slate',
    title: 'Blank Canvas',
    subtitle: 'Empty A4 sheet',
    art: '/home/mini-blank.webp',
    width: 300,
    height: 161,
    action: { kind: 'blank', spec: 'a4' },
  },
];
