import { BorderArtStyle, ImageElement, ImageEffectPreset } from '../types/publisher';

export interface CropRatioPreset {
  id: string;
  label: string;
  ratio: number; // width / height
}

export const CROP_RATIO_PRESETS: CropRatioPreset[] = [
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:3', label: '4:3', ratio: 4 / 3 },
  { id: '3:4', label: '3:4', ratio: 3 / 4 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: '3:2', label: '3:2', ratio: 3 / 2 },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
];

export function computeAspectCropUpdates(
  el: ImageElement,
  targetRatio: number,
  maxPageWidth: number,
  maxPageHeight: number
): Partial<ImageElement> {
  const newW = Math.min(el.width, maxPageWidth - el.x);
  let newH = Math.max(32, Math.round(newW / targetRatio));
  let finalW = newW;
  if (el.y + newH > maxPageHeight) {
    newH = Math.max(32, maxPageHeight - el.y);
    finalW = Math.max(32, Math.round(newH * targetRatio));
  }
  return {
    width: finalW,
    height: newH,
    objectFit: 'cover',
    aspectRatioLocked: true,
  };
}

export interface FilterEffectDefinition {
  name: string;
  vals: Partial<ImageElement>;
}

const BASE_TONES: Pick<
  ImageElement,
  'brightness' | 'contrast' | 'saturate' | 'grayscale' | 'sepia' | 'blur' | 'hueRotate'
> = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  sepia: 0,
  blur: 0,
  hueRotate: 0,
};

export const FILTER_EFFECT_PRESETS: FilterEffectDefinition[] = [
  { name: 'Original', vals: { ...BASE_TONES, effectPreset: 'none' } },
  {
    name: 'Sticker',
    vals: { ...BASE_TONES, brightness: 106, contrast: 112, saturate: 125, effectPreset: 'sticker' },
  },
  {
    name: 'Clay-Style',
    vals: { ...BASE_TONES, brightness: 108, contrast: 104, saturate: 118, effectPreset: 'clay' },
  },
  {
    name: 'Cartoon',
    vals: { ...BASE_TONES, brightness: 105, contrast: 145, saturate: 165, effectPreset: 'cartoon' },
  },
  {
    name: 'Animation',
    vals: { ...BASE_TONES, brightness: 114, contrast: 115, saturate: 155, effectPreset: 'animation' },
  },
  {
    name: 'Retro Film',
    vals: { ...BASE_TONES, brightness: 106, contrast: 96, sepia: 32, saturate: 90, effectPreset: 'retro-film' },
  },
  {
    name: 'Duotone Pop',
    vals: { ...BASE_TONES, contrast: 125, saturate: 150, hueRotate: 320, effectPreset: 'duotone-pop' },
  },
  { name: 'B&W', vals: { ...BASE_TONES, brightness: 105, contrast: 120, grayscale: 100, effectPreset: 'none' } },
  { name: 'Vintage', vals: { ...BASE_TONES, brightness: 105, contrast: 95, saturate: 85, sepia: 65, effectPreset: 'none' } },
  { name: 'Vivid', vals: { ...BASE_TONES, brightness: 108, contrast: 118, saturate: 155, effectPreset: 'none' } },
  { name: 'Cool', vals: { ...BASE_TONES, brightness: 102, contrast: 110, saturate: 110, hueRotate: 195, effectPreset: 'none' } },
  { name: 'Soft Blur', vals: { ...BASE_TONES, brightness: 108, contrast: 95, saturate: 95, blur: 3, effectPreset: 'none' } },
];

export const BORDER_ART_OPTIONS: {
  id: BorderArtStyle;
  label: string;
  defaultColor?: string;
  defaultColor2?: string;
  defaultPadding?: number;
}[] = [
  { id: 'none', label: 'None (Clean)', defaultColor: '#cbd5e1', defaultPadding: 0 },
  { id: 'polaroid', label: 'Polaroid Frame', defaultColor: '#ffffff', defaultColor2: '#e2e8f0', defaultPadding: 10 },
  { id: 'washi-tape', label: 'Washi Tape Scrapbook', defaultColor: '#f59e0b', defaultColor2: '#fda4af', defaultPadding: 6 },
  { id: 'filmstrip', label: 'Cinema Filmstrip', defaultColor: '#0f172a', defaultColor2: '#f8fafc', defaultPadding: 8 },
  { id: 'stamp-postage', label: 'Postage Stamp', defaultColor: '#ffffff', defaultColor2: '#4f46e5', defaultPadding: 10 },
  { id: 'classic-frame', label: 'Classic Mat Frame', defaultColor: '#ffffff', defaultColor2: '#1e293b', defaultPadding: 10 },
  { id: 'double-gold', label: 'Double Gold Leaf', defaultColor: '#f59e0b', defaultColor2: '#fde047', defaultPadding: 6 },
  { id: 'art-deco', label: 'Art Deco Geometric', defaultColor: '#1e293b', defaultColor2: '#ffffff', defaultPadding: 6 },
  { id: 'dots-and-dashes', label: 'Stitched Collage', defaultColor: '#4f46e5', defaultColor2: '#ffffff', defaultPadding: 6 },
  { id: 'stars', label: 'Star Sparkle Corner', defaultColor: '#f59e0b', defaultColor2: '#4f46e5', defaultPadding: 6 },
  { id: 'certificate-leaf', label: 'Botanical Laurel', defaultColor: '#059669', defaultColor2: '#d97706', defaultPadding: 8 },
  { id: 'neon-frame', label: 'Neon Glow Edge', defaultColor: '#22d3ee', defaultColor2: '#ec4899', defaultPadding: 4 },
];

export type EffectStylePreset = ImageEffectPreset;
