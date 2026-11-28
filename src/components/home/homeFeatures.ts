/**
 * The three things people come to StudioPress to make, as data.
 *
 * Kept out of the component because it is also the input to `npm run check:home`: the cards promise
 * a destination ("a collage", "a tarpapel", "the kits") and a check can hold that promise to a
 * group that still has templates in it, or a size the tarpapel builder still accepts.
 */
export type HomeFeatureTarget =
  | { kind: 'template-group'; group: string }
  | { kind: 'tarpapel' }
  | { kind: 'section'; section: 'kits' };

export interface HomeFeature {
  id: string;
  /** Which pastel the card wears — see `.home-feature[data-tone]` in `src/index.css`. */
  tone: 'violet' | 'amber' | 'teal';
  title: string;
  /** One line at the card's width. Longer and it wraps, which is what makes a row look untidy. */
  subtitle: string;
  art: string;
  width: number;
  height: number;
  target: HomeFeatureTarget;
}

export const HOME_FEATURES: HomeFeature[] = [
  {
    id: 'collage',
    tone: 'violet',
    title: 'Collage Maker',
    subtitle: 'Photos into a grid',
    art: '/home/art-collage.webp',
    width: 640,
    height: 337,
    target: { kind: 'template-group', group: 'Collages' },
  },
  {
    id: 'tarpapel',
    tone: 'amber',
    title: 'Tarpaulin Printer',
    subtitle: 'Any design, on A4 sheets',
    art: '/home/art-printer.webp',
    width: 640,
    height: 555,
    target: { kind: 'tarpapel' },
  },
  {
    id: 'story-kit',
    tone: 'teal',
    title: 'Story Kit',
    subtitle: 'Backdrops, frames, stickers',
    art: '/home/art-storykit.webp',
    width: 640,
    height: 691,
    target: { kind: 'section', section: 'kits' },
  },
];
