import type { WordArtStyle } from '../types/publisher';

/**
 * The WordArt catalogue — one list for the gallery, the inspector and the
 * renderer, so a style can never be offered without a class to paint it (the
 * bug that left "Emerald 3D Block" and "Deep Blue" as plain text).
 */
export interface WordArtOption {
  id: WordArtStyle;
  label: string;
  className: string;
  /** Preview needs a dark tile to read (glow styles). */
  dark?: boolean;
}

export const WORD_ART_STYLES: WordArtOption[] = [
  { id: 'gold3d', label: 'Gold 3D Extrusion', className: 'wordart-gold3d' },
  { id: 'rainbow', label: 'Rainbow Gradient', className: 'wordart-rainbow' },
  { id: 'outline', label: 'Cyan Bold Outline', className: 'wordart-outline' },
  { id: 'retro', label: 'Retro Pop 3D', className: 'wordart-retro' },
  { id: 'neon-glow', label: 'Neon Cyber Glow', className: 'wordart-neon-glow', dark: true },
  { id: 'chrome', label: 'Chrome Metallic', className: 'wordart-chrome' },
  { id: 'fire', label: 'Blazing Fire', className: 'wordart-fire' },
  { id: 'comic-pop', label: 'Comic Pop Art', className: 'wordart-comic-pop' },
  { id: 'emerald-3d', label: 'Emerald 3D Block', className: 'wordart-emerald-3d' },
  { id: 'sunset-gradient', label: 'Sunset Vibe', className: 'wordart-sunset-gradient' },
  { id: 'gradient-blue', label: 'Deep Blue Gradient', className: 'wordart-gradient-blue' },
];

const BY_ID = new Map<string, WordArtOption>(WORD_ART_STYLES.map((s) => [s.id, s]));

/** The CSS class that paints a style, or '' for plain text. */
export function wordArtClassName(style?: WordArtStyle): string {
  if (!style || style === 'none') return '';
  return BY_ID.get(style)?.className ?? '';
}

/** Every style the UI offers, with "none" first. */
export function wordArtPickerOptions(): WordArtOption[] {
  return [{ id: 'none', label: 'Standard Text', className: 'text-slate-700' }, ...WORD_ART_STYLES];
}
