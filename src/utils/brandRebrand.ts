import {
  BrandKit,
  ImageElement,
  Page,
  PublisherElement,
  ShapeElement,
  TextElement,
} from '../types/publisher';

export const DEFAULT_BRAND_KITS: BrandKit[] = [
  {
    id: 'kit-studiopress',
    name: 'StudioPress Indigo',
    headingFont: 'Montserrat',
    bodyFont: 'Segoe UI',
    colors: {
      primary: '#4f46e5',
      secondary: '#06b6d4',
      accent: '#f59e0b',
      dark: '#0f172a',
      light: '#eef2ff',
      background: '#ffffff',
    },
  },
  {
    id: 'kit-luxury-gold',
    name: 'Noir & Gold Luxury',
    headingFont: 'Playfair Display',
    bodyFont: 'Lora',
    colors: {
      primary: '#18181b',
      secondary: '#d97706',
      accent: '#fbbf24',
      dark: '#09090b',
      light: '#fef3c7',
      background: '#fafaf9',
    },
  },
  {
    id: 'kit-coral-pop',
    name: 'Sunset Creator Pop',
    headingFont: 'Bebas Neue',
    bodyFont: 'Poppins',
    colors: {
      primary: '#f43f5e',
      secondary: '#f97316',
      accent: '#facc15',
      dark: '#1e293b',
      light: '#fff1f2',
      background: '#ffffff',
    },
  },
  {
    id: 'kit-emerald-atelier',
    name: 'Emerald Editorial',
    headingFont: 'Georgia',
    bodyFont: 'Merriweather',
    colors: {
      primary: '#065f46',
      secondary: '#10b981',
      accent: '#d97706',
      dark: '#022c22',
      light: '#ecfdf5',
      background: '#fafaf9',
    },
  },
  {
    id: 'kit-cyber-neon',
    name: 'Cyber Neon Tech',
    headingFont: 'Impact',
    bodyFont: 'Segoe UI',
    colors: {
      primary: '#7c3aed',
      secondary: '#06b6d4',
      accent: '#ec4899',
      dark: '#090d16',
      light: '#f3e8ff',
      background: '#090d16',
    },
  },
  {
    id: 'kit-ocean-trust',
    name: 'Corporate Ocean',
    headingFont: 'Segoe UI',
    bodyFont: 'Open Sans',
    colors: {
      primary: '#0369a1',
      secondary: '#0ea5e9',
      accent: '#f59e0b',
      dark: '#0f172a',
      light: '#f0f9ff',
      background: '#ffffff',
    },
  },
];

function parseHexToRgb(color: string): [number, number, number] | null {
  if (!color) return null;
  const trimmed = color.trim().toLowerCase();
  if (trimmed === 'transparent' || trimmed === 'none') return null;

  const hex3 = /^#([0-9a-f]{3})$/i.exec(trimmed);
  if (hex3) {
    const h = hex3[1];
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }

  const hex6 = /^#([0-9a-f]{6})$/i.exec(trimmed);
  if (hex6) {
    const h = hex6[1];
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }

  const rgbMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(trimmed);
  if (rgbMatch) {
    return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
  }
  return null;
}

/** Relative luminance in 0..1 range */
export function getColorLuminance(color: string): number {
  const rgb = parseHexToRgb(color);
  if (!rgb) return 0.9;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getSaturation(color: string): number {
  const rgb = parseHexToRgb(color);
  if (!rgb) return 0;
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const l = (max + min) / 2;
  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

function isPureWhiteOrNearWhite(color: string): boolean {
  const lum = getColorLuminance(color);
  return lum >= 0.94 && getSaturation(color) < 0.15;
}

/**
 * Samples dominant brand colors from an uploaded Brand Logo image via an offscreen canvas.
 */
export function extractBrandColorsFromImage(dataUrl: string): Promise<{
  primary: string;
  secondary: string;
  accent: string;
  dark: string;
  light: string;
}> {
  return new Promise((resolve) => {
    const fallback = {
      primary: '#4f46e5',
      secondary: '#06b6d4',
      accent: '#f59e0b',
      dark: '#0f172a',
      light: '#eef2ff',
    };
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 48;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(fallback);

        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        const buckets = new Map<string, { count: number; sat: number; lum: number }>();
        const toHex = (r: number, g: number, b: number) =>
          `#${[r, g, b].map((v) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0')).join('')}`;

        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue;
          const r = Math.round(data[i] / 24) * 24;
          const g = Math.round(data[i + 1] / 24) * 24;
          const b = Math.round(data[i + 2] / 24) * 24;
          const hex = toHex(r, g, b);
          const sat = getSaturation(hex);
          const lum = getColorLuminance(hex);
          // Skip near-pure white backgrounds
          if (lum > 0.92 && sat < 0.15) continue;
          const prev = buckets.get(hex);
          buckets.set(hex, {
            count: (prev?.count || 0) + 1 + sat * 2,
            sat,
            lum,
          });
        }

        const ranked = Array.from(buckets.entries()).sort((a, b) => b[1].count - a[1].count);
        const chromatic = ranked.filter(([, meta]) => meta.sat >= 0.2);

        const primary = chromatic[0]?.[0] || ranked[0]?.[0] || fallback.primary;
        const secondary = chromatic[1]?.[0] || chromatic[0]?.[0] || fallback.secondary;
        const accent = chromatic[2]?.[0] || secondary || fallback.accent;
        const darkest = ranked.find(([, meta]) => meta.lum < 0.25)?.[0] || '#0f172a';

        resolve({
          primary,
          secondary,
          accent,
          dark: darkest,
          light: '#f8fafc',
        });
      } catch {
        resolve(fallback);
      }
    };
    img.onerror = () => resolve(fallback);
    img.src = dataUrl;
  });
}

function getContrastTextColor(bgColor: string, kit: BrandKit): string {
  const lum = getColorLuminance(bgColor);
  return lum < 0.45 ? '#ffffff' : kit.colors.dark;
}

/**
 * Estimates the visual backdrop color immediately behind an element (shape underneath or page bg).
 */
function findBackdropColorUnder(
  el: PublisherElement,
  allElements: PublisherElement[],
  pageBg: string
): string {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;

  const underneath = allElements
    .filter(
      (other) =>
        other.id !== el.id &&
        other.type === 'shape' &&
        other.zIndex <= el.zIndex &&
        cx >= other.x &&
        cx <= other.x + other.width &&
        cy >= other.y &&
        cy <= other.y + other.height &&
        (other as ShapeElement).fillColor !== 'transparent'
    )
    .sort((a, b) => b.zIndex - a.zIndex);

  if (underneath.length > 0) {
    return (underneath[0] as ShapeElement).fillColor;
  }
  return pageBg;
}

/**
 * Intelligently rebrands a full Page (colors, gradients, contrast-safe text, heading/body fonts,
 * patterns, connectors, tables, and optional Brand Logo stamping) to match a BrandKit.
 */
export function rebrandPageWithKit(
  page: Page,
  kit: BrandKit,
  options?: { stampLogo?: boolean }
): Page {
  const stampLogo = Boolean(options?.stampLogo);

  // 1. Update Page Canvas Background sensibly (preserve pure crisp white unless kit is dark-theme and page was already dark)
  const prevPageIsDark = getColorLuminance(page.backgroundColor || '#ffffff') < 0.25;
  const kitBgIsDark = getColorLuminance(kit.colors.background) < 0.25;
  let nextPageBg = page.backgroundColor || '#ffffff';

  if (prevPageIsDark) {
    nextPageBg = kitBgIsDark ? kit.colors.background : kit.colors.dark;
  } else if (!isPureWhiteOrNearWhite(nextPageBg)) {
    nextPageBg = kit.colors.light;
  }

  // 2. First pass: Rebrand Shapes, Accents, Tables, Connectors, Lines
  const firstPassShapes = page.elements.map((el) => {
    if (el.type === 'shape') {
      const shp = { ...el } as ShapeElement;
      const isLarge =
        shp.width >= page.width * 0.45 || shp.height >= page.height * 0.28;
      const isBadge =
        shp.shapeType === 'badge-burst' ||
        shp.shapeType === 'star' ||
        (shp.width <= 320 && shp.height <= 90 && Boolean(shp.label));

      if (shp.fillColor && shp.fillColor !== 'transparent') {
        const lum = getColorLuminance(shp.fillColor);
        const sat = getSaturation(shp.fillColor);

        if (isLarge) {
          shp.fillColor = lum < 0.14 && !shp.fillType ? kit.colors.dark : kit.colors.primary;
          if (shp.fillType === 'linear-gradient') {
            shp.fillColor = kit.colors.primary;
            shp.gradientColor2 = kit.colors.secondary;
          }
        } else if (isBadge) {
          shp.fillColor = kit.colors.accent;
          if (shp.fillType === 'linear-gradient') {
            shp.gradientColor2 = kit.colors.primary;
          }
        } else if (isPureWhiteOrNearWhite(shp.fillColor)) {
          shp.fillColor = '#ffffff';
        } else if (lum > 0.82 && sat < 0.35) {
          shp.fillColor = kit.colors.light;
        } else if (lum < 0.2 && sat < 0.25) {
          shp.fillColor = kit.colors.dark;
        } else {
          shp.fillColor = sat > 0.45 ? kit.colors.primary : kit.colors.secondary;
          if (shp.fillType === 'linear-gradient') {
            shp.gradientColor2 = kit.colors.secondary;
          }
        }
      }

      if (shp.strokeColor && shp.strokeColor !== 'transparent') {
        if (!isPureWhiteOrNearWhite(shp.strokeColor)) {
          shp.strokeColor = isBadge ? kit.colors.primary : kit.colors.secondary;
        }
      }

      if (shp.glow) {
        shp.glowColor = kit.colors.secondary;
      }

      if (shp.label && shp.fillColor && shp.fillColor !== 'transparent') {
        shp.labelColor = getContrastTextColor(shp.fillColor, kit);
      }
      return shp;
    }

    if (el.type === 'table') {
      return {
        ...el,
        headerBg: kit.colors.primary,
        headerColor: getContrastTextColor(kit.colors.primary, kit),
        altRowBg: kit.colors.light,
        borderColor: kit.colors.secondary,
        cellColor: kit.colors.dark,
      };
    }

    if (el.type === 'accent') {
      return {
        ...el,
        accentColor: kit.colors.primary,
        secondaryColor: kit.colors.light,
      };
    }

    if (el.type === 'line' || el.type === 'connector') {
      return {
        ...el,
        strokeColor: kit.colors.primary,
      };
    }

    if (el.type === 'qr') {
      const qrBg = el.bgColor && getColorLuminance(el.bgColor) < 0.3 ? kit.colors.dark : '#ffffff';
      return {
        ...el,
        bgColor: qrBg,
        fgColor: qrBg === '#ffffff' ? kit.colors.dark : kit.colors.accent,
      };
    }

    return el;
  });

  // 3. Second pass: Rebrand Typography & Contrast-Safe Text against updated shapes
  let rebrandedElements: PublisherElement[] = firstPassShapes.map((el) => {
    if (el.type === 'text') {
      const txt = { ...el } as TextElement;
      const isHeading =
        txt.fontSize >= 22 ||
        txt.fontWeight === 'bold' ||
        txt.fontWeight === '800' ||
        txt.fontWeight === '900' ||
        Boolean(txt.isWordArt);

      txt.fontFamily = isHeading ? kit.headingFont : kit.bodyFont;

      const backdrop = findBackdropColorUnder(txt, firstPassShapes, nextPageBg);
      const backdropLum = getColorLuminance(backdrop);
      const prevSat = getSaturation(txt.color);

      if (backdropLum < 0.45) {
        // Dark surface underneath -> keep crisp white or bright brand accent for colorful labels
        txt.color = prevSat > 0.38 && txt.fontSize <= 28 ? kit.colors.accent : '#ffffff';
      } else {
        // Light surface underneath -> primary/accent for standout headings or dark ink for readable copy
        if (prevSat > 0.45 && isHeading) {
          txt.color = kit.colors.primary;
        } else if (prevSat > 0.45) {
          txt.color = kit.colors.secondary;
        } else {
          txt.color = kit.colors.dark;
        }
      }

      if (txt.backgroundColor && txt.backgroundColor !== 'transparent') {
        txt.backgroundColor =
          getColorLuminance(txt.backgroundColor) < 0.45 ? kit.colors.primary : kit.colors.light;
        txt.color = getContrastTextColor(txt.backgroundColor, kit);
      }

      return txt;
    }

    if (el.type === 'image' && el.name === 'Brand Kit Logo' && kit.logoSrc) {
      return { ...el, src: kit.logoSrc };
    }

    return el;
  });

  // 4. Optional Brand Logo Stamping onto pages that don't already have a Brand Kit Logo
  if (stampLogo && kit.logoSrc) {
    const hasLogoAlready = rebrandedElements.some(
      (el) => el.type === 'image' && el.name === 'Brand Kit Logo'
    );
    if (!hasLogoAlready) {
      const logoSize = Math.max(48, Math.min(96, Math.round(Math.min(page.width, page.height) * 0.14)));
      const padX = Math.max(16, page.margins.right);
      const padY = Math.max(16, page.margins.top);
      const maxZ = rebrandedElements.reduce((acc, el) => Math.max(acc, el.zIndex), 0);

      const logoEl: ImageElement = {
        id: `img-brand-logo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'image',
        name: 'Brand Kit Logo',
        src: kit.logoSrc,
        x: Math.max(12, page.width - padX - logoSize),
        y: padY,
        width: logoSize,
        height: logoSize,
        rotation: 0,
        zIndex: maxZ + 1,
        objectFit: 'contain',
        aspectRatioLocked: true,
      };
      rebrandedElements = [...rebrandedElements, logoEl];
    }
  }

  return {
    ...page,
    backgroundColor: nextPageBg,
    backgroundPattern: page.backgroundPattern
      ? { ...page.backgroundPattern, color: kit.colors.primary }
      : undefined,
    elements: rebrandedElements,
  };
}
