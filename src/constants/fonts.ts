export interface FontDefinition {
  family: string;
  category: 'Sans-Serif' | 'Serif' | 'Display' | 'Script' | 'Monospace';
  source: 'system' | 'google';
}

export const SYSTEM_FONTS: FontDefinition[] = [
  { family: 'Segoe UI', category: 'Sans-Serif', source: 'system' },
  { family: 'Arial', category: 'Sans-Serif', source: 'system' },
  { family: 'Calibri', category: 'Sans-Serif', source: 'system' },
  { family: 'Trebuchet MS', category: 'Sans-Serif', source: 'system' },
  { family: 'Verdana', category: 'Sans-Serif', source: 'system' },
  { family: 'Tahoma', category: 'Sans-Serif', source: 'system' },
  { family: 'Georgia', category: 'Serif', source: 'system' },
  { family: 'Times New Roman', category: 'Serif', source: 'system' },
  { family: 'Cambria', category: 'Serif', source: 'system' },
  { family: 'Garamond', category: 'Serif', source: 'system' },
  { family: 'Palatino Linotype', category: 'Serif', source: 'system' },
  { family: 'Book Antiqua', category: 'Serif', source: 'system' },
  { family: 'Impact', category: 'Display', source: 'system' },
  { family: 'Comic Sans MS', category: 'Script', source: 'system' },
  { family: 'Courier New', category: 'Monospace', source: 'system' },
  { family: 'Consolas', category: 'Monospace', source: 'system' },
];

export const GOOGLE_FONTS_CATALOG: FontDefinition[] = [
  { family: 'Inter', category: 'Sans-Serif', source: 'google' },
  { family: 'Roboto', category: 'Sans-Serif', source: 'google' },
  { family: 'Open Sans', category: 'Sans-Serif', source: 'google' },
  { family: 'Montserrat', category: 'Sans-Serif', source: 'google' },
  { family: 'Poppins', category: 'Sans-Serif', source: 'google' },
  { family: 'Lato', category: 'Sans-Serif', source: 'google' },
  { family: 'Raleway', category: 'Sans-Serif', source: 'google' },
  { family: 'Space Grotesk', category: 'Sans-Serif', source: 'google' },
  { family: 'Playfair Display', category: 'Serif', source: 'google' },
  { family: 'Merriweather', category: 'Serif', source: 'google' },
  { family: 'Lora', category: 'Serif', source: 'google' },
  { family: 'Cormorant Garamond', category: 'Serif', source: 'google' },
  { family: 'Cinzel', category: 'Serif', source: 'google' },
  { family: 'Oswald', category: 'Display', source: 'google' },
  { family: 'Bebas Neue', category: 'Display', source: 'google' },
  { family: 'Anton', category: 'Display', source: 'google' },
  { family: 'Bungee', category: 'Display', source: 'google' },
  { family: 'Monoton', category: 'Display', source: 'google' },
  { family: 'Orbitron', category: 'Display', source: 'google' },
  { family: 'Righteous', category: 'Display', source: 'google' },
  { family: 'Syne', category: 'Display', source: 'google' },
  { family: 'Abril Fatface', category: 'Serif', source: 'google' },
  { family: 'Shrikhand', category: 'Display', source: 'google' },
  { family: 'Press Start 2P', category: 'Display', source: 'google' },
  { family: 'Pacifico', category: 'Script', source: 'google' },
  { family: 'Dancing Script', category: 'Script', source: 'google' },
  { family: 'Lobster', category: 'Script', source: 'google' },
  { family: 'Permanent Marker', category: 'Script', source: 'google' },
  { family: 'Kaushan Script', category: 'Script', source: 'google' },
  // The pairings the themed WordArt styles ask for: rounded book faces, and the quiet
  // portfolio sans that reads at 800 without closing its counters.
  { family: 'Fredoka', category: 'Display', source: 'google' },
  { family: 'Baloo 2', category: 'Display', source: 'google' },
  { family: 'Quicksand', category: 'Sans-Serif', source: 'google' },
  { family: 'Nunito', category: 'Sans-Serif', source: 'google' },
  { family: 'Patrick Hand', category: 'Script', source: 'google' },
  { family: 'Chewy', category: 'Display', source: 'google' },
  { family: 'Plus Jakarta Sans', category: 'Sans-Serif', source: 'google' },
  { family: 'Fira Code', category: 'Monospace', source: 'google' },
];

const DOWNLOADED_FONTS_KEY = 'ms_publisher_downloaded_fonts_v1';

export function getDownloadedGoogleFonts(): string[] {
  try {
    const raw = localStorage.getItem(DOWNLOADED_FONTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return ['Inter', 'Playfair Display', 'Montserrat'];
}

export function saveDownloadedGoogleFonts(fonts: string[]): void {
  try {
    localStorage.setItem(DOWNLOADED_FONTS_KEY, JSON.stringify(fonts));
  } catch {
    // ignore
  }
}

function stylesheetId(family: string): string {
  return `gfont-${family.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
}

/** True when this family's stylesheet is already on the page (or downloading). */
export function hasFontStylesheet(family: string): boolean {
  try {
    return Boolean(document.getElementById(stylesheetId(family)));
  } catch {
    return false;
  }
}

export function loadGoogleFontStylesheet(family: string): Promise<void> {
  const safeId = stylesheetId(family);
  if (document.getElementById(safeId)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.id = safeId;
    link.rel = 'stylesheet';
    const encoded = encodeURIComponent(family).replace(/%20/g, '+');
    link.href = `https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@0,400;0,600;0,700;0,800;1,400;1,700&display=swap`;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

/** Every Google-hosted family a document actually uses. */
export function projectFontFamilies(project: {
  pages?: readonly { elements?: readonly unknown[] }[];
}): string[] {
  const families = new Set<string>();
  for (const page of project.pages ?? []) {
    for (const element of page.elements ?? []) {
      const family = (element as { fontFamily?: string }).fontFamily;
      if (family && GOOGLE_FONTS_CATALOG.some((font) => font.family === family)) {
        families.add(family);
      }
    }
  }
  return [...families];
}

/**
 * Fetch and *settle* the faces a document needs before it is shown.
 *
 * A template that ships in a script face has to arrive as that face. Loading the stylesheet alone
 * is not enough — the canvas measures with whatever is resolved at that moment, so the first
 * layout would be the fallback and every box on the page would be sized for a font it is not
 * drawn in. This awaits `document.fonts.load` for the weights the page uses, and gives up after
 * `timeoutMs` so an offline or slow network never blocks opening a document.
 */
export async function preloadProjectFonts(
  project: { pages?: readonly { elements?: readonly unknown[] }[] },
  timeoutMs = 1500
): Promise<void> {
  if (typeof document === 'undefined') return;
  const families = projectFontFamilies(project);
  if (families.length === 0) return;

  const load = (async () => {
    await Promise.all(families.map((family) => loadGoogleFontStylesheet(family)));
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (!fonts) return;
    await Promise.all(
      families.flatMap((family) =>
        ['400', '700', '900'].map((weight) =>
          fonts.load(`${weight} 48px "${family}"`).catch(() => undefined)
        )
      )
    );
  })();

  await Promise.race([load, new Promise<void>((resolve) => setTimeout(resolve, timeoutMs))]);
}
