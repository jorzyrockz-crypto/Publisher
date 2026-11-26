export type GradientCategory = 'pastel' | 'warm' | 'cool' | 'vivid' | 'metallic';

export interface GradientSwatch {
  id: string;
  name: string;
  category: GradientCategory;
  color1: string;
  color2: string;
  angle: number;
}

export const GRADIENT_SWATCHES: GradientSwatch[] = [
  // Pastel
  { id: 'cotton-candy', name: 'Cotton Candy', category: 'pastel', color1: '#fdf2f8', color2: '#e0f2fe', angle: 135 },
  { id: 'peach-milk', name: 'Peach Milk', category: 'pastel', color1: '#fff1f2', color2: '#fef3c7', angle: 135 },
  { id: 'lavender-mist', name: 'Lavender Mist', category: 'pastel', color1: '#f3e8ff', color2: '#dbeafe', angle: 135 },
  { id: 'mint-sorbet', name: 'Mint Sorbet', category: 'pastel', color1: '#ecfdf5', color2: '#e0f2fe', angle: 135 },

  // Warm / Sunset
  { id: 'sunset-glow', name: 'Sunset Glow', category: 'warm', color1: '#ff7e5f', color2: '#feb47b', angle: 135 },
  { id: 'coral-rose', name: 'Coral Rose', category: 'warm', color1: '#f43f5e', color2: '#fb923c', angle: 135 },
  { id: 'golden-hour', name: 'Golden Hour', category: 'warm', color1: '#f59e0b', color2: '#fef08a', angle: 135 },
  { id: 'warm-cream', name: 'Warm Cream', category: 'warm', color1: '#fffbeb', color2: '#fde68a', angle: 135 },

  // Cool / Ocean
  { id: 'sky-breeze', name: 'Sky Breeze', category: 'cool', color1: '#0284c7', color2: '#38bdf8', angle: 135 },
  { id: 'deep-lagoon', name: 'Deep Lagoon', category: 'cool', color1: '#0f766e', color2: '#2dd4bf', angle: 135 },
  { id: 'twilight-indigo', name: 'Twilight Indigo', category: 'cool', color1: '#312e81', color2: '#6366f1', angle: 135 },
  { id: 'arctic-frost', name: 'Arctic Frost', category: 'cool', color1: '#e0f2fe', color2: '#93c5fd', angle: 180 },

  // Vivid / Berry
  { id: 'neon-berry', name: 'Neon Berry', category: 'vivid', color1: '#ec4899', color2: '#8b5cf6', angle: 135 },
  { id: 'tropical-lime', name: 'Tropical Lime', category: 'vivid', color1: '#10b981', color2: '#a3e635', angle: 135 },
  { id: 'midnight-aurora', name: 'Midnight Aurora', category: 'vivid', color1: '#0f172a', color2: '#0ea5e9', angle: 135 },

  // Metallic / Editorial
  { id: 'champagne-gold', name: 'Champagne Gold', category: 'metallic', color1: '#facc15', color2: '#b45309', angle: 135 },
  { id: 'rose-gold', name: 'Rose Gold', category: 'metallic', color1: '#fda4af', color2: '#e11d48', angle: 135 },
  { id: 'slate-steel', name: 'Slate Steel', category: 'metallic', color1: '#475569', color2: '#cbd5e1', angle: 135 },
];

export function buildLinearGradientCss(
  color1: string,
  color2: string,
  angle = 135
): string {
  return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
}
