import type { TemplateCategory } from "./templates";

/**
 * Artwork that ships with the app.
 *
 * These are generated images, and generated images are only useful if they are *ours*: they live
 * in `public/templates`, they are listed here, and templates reference them by path. Nothing
 * hotlinks, nothing expires, and a template keeps its artwork when it is exported or duplicated.
 *
 * Each piece records its tone so the layout pass can put light artwork behind dark type (and the
 * other way round) instead of discovering the problem after the fact.
 */

export interface ArtworkAsset {
  id: string;
  name: string;
  /** Public path — the same string stored on the element's `src`. */
  src: string;
  orientation: "landscape" | "portrait";
  /** Average tone of the photograph: what a scrim has to do to keep text readable. */
  tone: "light" | "dark" | "mid";
  /** Categories this artwork was made for. */
  useFor: TemplateCategory[];
  description: string;
  /** Words this image suits, matched against the template's name and copy when picking. */
  keywords: string[];
}

export const GENERATED_ARTWORK: ArtworkAsset[] = [
  {
    id: "abstract-violet-flow",
    name: "Violet Flow",
    src: "./templates/abstract-violet-flow.jpg",
    orientation: "landscape",
    tone: "dark",
    useFor: ["Poster", "Social Media", "Hero Banner", "Email"],
    description:
      "Indigo and magenta ink bloom — dramatic, high-contrast backgrounds.",
    keywords: [
      "abstract",
      "violet",
      "neon",
      "tech",
      "digital",
      "modern",
      "bold",
      "sale",
      "launch",
      "gradient",
    ],
  },
  {
    id: "portrait-violet",
    name: "Violet Silk",
    src: "./templates/portrait-violet.jpg",
    orientation: "portrait",
    tone: "dark",
    useFor: ["Poster", "Invitation", "Social Media"],
    description:
      "Portrait silk folds with light in the lower third — posters and covers.",
    keywords: [
      "silk",
      "violet",
      "cinematic",
      "film",
      "drama",
      "elegant",
      "night",
      "music",
      "premium",
    ],
  },
  {
    id: "editorial-desk-warm",
    name: "Studio Desk",
    src: "./templates/editorial-desk-warm.jpg",
    orientation: "landscape",
    tone: "light",
    useFor: ["Brochure", "Newsletter", "Cover Document", "Narrative Report"],
    description: "Warm editorial desk — brochures, reports and proposals.",
    keywords: [
      "desk",
      "studio",
      "work",
      "business",
      "proposal",
      "editorial",
      "craft",
      "strategy",
      "report",
    ],
  },
  {
    id: "architecture-light",
    name: "Concrete Light",
    src: "./templates/architecture-light.jpg",
    orientation: "landscape",
    tone: "mid",
    useFor: ["Cover Document", "Newsletter", "Narrative Report", "Program"],
    description: "Concrete and hard light — corporate covers and inside pages.",
    keywords: [
      "architecture",
      "concrete",
      "building",
      "corporate",
      "minimal",
      "light",
      "structure",
      "annual",
    ],
  },
  {
    id: "botanical-shadow",
    name: "Palm Shadow",
    src: "./templates/botanical-shadow.jpg",
    orientation: "landscape",
    tone: "light",
    useFor: ["Menu", "Card", "Postcard", "Collage", "Calendar"],
    description: "Palm shadows on plaster — menus, cards and keepsakes.",
    keywords: [
      "botanical",
      "palm",
      "plant",
      "menu",
      "garden",
      "shadow",
      "nature",
      "calm",
      "spa",
    ],
  },
  {
    id: "portrait-cream",
    name: "Ivory Light",
    src: "./templates/portrait-cream.jpg",
    orientation: "portrait",
    tone: "light",
    useFor: ["Invitation", "Certificate", "Menu", "Card", "Program"],
    description: "Ivory wall with palm light — invitations and certificates.",
    keywords: [
      "ivory",
      "cream",
      "invitation",
      "wedding",
      "gala",
      "certificate",
      "calm",
      "award",
    ],
  },
  {
    id: "coastline-duotone",
    name: "Deep Water",
    src: "./templates/coastline-duotone.jpg",
    orientation: "landscape",
    tone: "dark",
    useFor: ["Flyer", "Tarpapel", "Program", "Hero Banner"],
    description: "Duotone water — flyers, tarpaulins and event headers.",
    keywords: [
      "water",
      "wave",
      "ocean",
      "summer",
      "cool",
      "sea",
      "pool",
      "festival",
    ],
  },
  {
    id: "golden-haze",
    name: "Golden Haze",
    src: "./templates/golden-haze.jpg",
    orientation: "landscape",
    tone: "light",
    useFor: ["Flyer", "Poster", "Invitation", "Card", "Tarpapel"],
    description: "Sunlit dunes — warm, celebratory artwork.",
    keywords: [
      "sunset",
      "golden",
      "warm",
      "summer",
      "sun",
      "dune",
      "celebrate",
      "party",
      "wedding",
      "gold",
    ],
  },
];

/** Categories that are type-driven; putting a photo in them makes them worse, not better. */
const TYPE_ONLY: TemplateCategory[] = [
  "Logo",
  "Resume",
  "Business Card",
  "Blank",
];

export function isTypeOnlyCategory(category: TemplateCategory): boolean {
  return TYPE_ONLY.includes(category);
}

export function isGeneratedArtwork(src: string | undefined): boolean {
  if (!src) return false;
  return src.startsWith("./templates/") || src.startsWith("/templates/");
}

const hash = (value: string): number => {
  let out = 0;
  for (let i = 0; i < value.length; i += 1)
    out = (out * 31 + value.charCodeAt(i)) % 100000;
  return out;
};

/**
 * Artwork for a category and a frame.
 *
 * Three things decide it: the orientation the frame needs, the words the template actually uses
 * (a "Sunset Rooftop" flyer should not get polar water), and a small stable jitter keyed on the
 * hint so two posters in the same category do not end up with the same photograph.
 */
export function artworkFor(
  category: TemplateCategory,
  orientation?: "landscape" | "portrait",
  hint = "",
): ArtworkAsset | null {
  if (isTypeOnlyCategory(category)) return null;
  const matches = GENERATED_ARTWORK.filter((art) =>
    art.useFor.includes(category),
  );
  if (matches.length === 0) return null;

  const text = hint.toLowerCase();
  const scored = matches.map((art) => {
    let score = orientation && art.orientation === orientation ? 4 : 0;
    score += art.keywords.filter((word) => text.includes(word)).length * 3;
    // Deterministic jitter: same template, same artwork, every time — but not the same artwork
    // as the next template in the gallery.
    score += (hash(`${art.id}:${text}`) % 100) / 100;
    return { art, score };
  });

  return scored.sort((a, b) => b.score - a.score)[0].art;
}

/** The artwork that reads as a hero on a page of this shape. */
export function heroArtworkFor(
  category: TemplateCategory,
  pageIsPortrait: boolean,
  hint = "",
): ArtworkAsset | null {
  return artworkFor(category, pageIsPortrait ? "portrait" : "landscape", hint);
}

export function getArtworkById(id: string): ArtworkAsset | undefined {
  return GENERATED_ARTWORK.find((art) => art.id === id);
}
