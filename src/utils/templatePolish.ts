import type {
  DocumentProject,
  Page,
  PublisherElement,
  ShapeElement,
  TextElement,
} from "../types/publisher";
import type { TemplateCategory } from "../constants/templates";
import { textBackdrop } from "./layoutScore";
import { contrastRatio, relativeLuminance } from "./documentPalette";
import {
  artworkFor,
  heroArtworkFor,
  isTypeOnlyCategory,
} from "../constants/generatedArtwork";
import { composeEditorial } from "./editorialComposition";
import { scoreElements } from "./layoutScore";

/**
 * The design pass every template goes through.
 *
 * The shipped templates were drawn by hand, one at a time, and they show it in the same four
 * places over and over: gaps that are 13px instead of 16, boxes that stop 9px short of the
 * margin, text that was never checked against what is behind it, and pages with no photograph on
 * them at all. Fixing 292 layouts by hand is not the job — a rule set that fixes those four
 * things is, and it keeps working for templates added later.
 *
 * Rules, in the order they run:
 *   1. artwork   — image slots get real artwork; visual categories get a hero behind the type
 *   2. margins   — things that stop just short of a margin snap to it
 *   3. grid      — remaining edges land on an 8px step
 *   4. rhythm    — vertical gaps between stacked blocks become multiples of 8
 *   5. contrast  — text is pushed until it passes AA against its own backdrop
 *   6. density   — a page that is over-full loses weight from its decorative shapes
 *
 * Every rule is conservative on purpose: nothing moves more than 24px, nothing changes order,
 * and a rule that cannot help leaves the element exactly where it was.
 */

export interface PolishStats {
  artwork: number;
  heroes: number;
  snappedToMargins: number;
  snappedToGrid: number;
  rhythm: number;
  contrast: number;
  lightened: number;
  /** Pages where the tidied layout won. */
  tidied: number;
  /** Pages where the editorial composition won. */
  composed: number;
  /** Pages left exactly as authored, because nothing improved on them. */
  keptOriginal: number;
}

const emptyStats = (): PolishStats => ({
  artwork: 0,
  heroes: 0,
  snappedToMargins: 0,
  snappedToGrid: 0,
  rhythm: 0,
  contrast: 0,
  lightened: 0,
  tidied: 0,
  composed: 0,
  keptOriginal: 0,
});

export const TEMPLATE_POLISH_STATS: PolishStats = emptyStats();

/** 8px is the step; 24px is how far a thing may move to find it. */
const STEP = 8;
const SNAP_LIMIT = 24;

const hexToRgb = (hex: string): [number, number, number] | null => {
  const clean = hex.replace("#", "").trim();
  if (clean.length !== 3 && clean.length !== 6) return null;
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const value = Number.parseInt(full, 16);
  if (!Number.isFinite(value)) return null;
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const rgbToHex = (rgb: [number, number, number]) =>
  `#${rgb
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

/** Moves `color` toward `target` by `amount` (0..1). */
export function mixHex(color: string, target: string, amount: number): string {
  const a = hexToRgb(color);
  const b = hexToRgb(target);
  if (!a || !b) return color;
  return rgbToHex([
    a[0] + (b[0] - a[0]) * amount,
    a[1] + (b[1] - a[1]) * amount,
    a[2] + (b[2] - a[2]) * amount,
  ]);
}

const isBackgroundShape = (el: PublisherElement, page: Page) =>
  (el.type === "shape" || el.type === "image") &&
  el.width * el.height >= page.width * page.height * 0.85;

/** Distance to the nearest margin edge, if it is worth closing. */
function marginSnap(value: number, edges: number[]): number | null {
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestTarget: number | null = null;
  edges.forEach((edge) => {
    const distance = Math.abs(edge - value);
    if (distance > 0 && distance <= SNAP_LIMIT && distance < bestDistance) {
      bestDistance = distance;
      bestTarget = edge;
    }
  });
  return bestTarget;
}

const snapToStep = (value: number) => Math.round(value / STEP) * STEP;

/** 1. Image slots get artwork; visual pages get a hero behind the type. */
function placeArtwork(
  page: Page,
  category: TemplateCategory,
  stats: PolishStats,
  hint = "",
): PublisherElement[] {
  const isPortrait = page.height >= page.width;
  const elements = page.elements.map((el) => {
    if (el.type !== "image") return el;
    const image = el as PublisherElement & { src?: string; name?: string };
    const looksPlaceholder =
      !image.src || image.src.startsWith("data:image/svg");
    if (!looksPlaceholder) return el;
    const art = artworkFor(
      category,
      el.width >= el.height ? "landscape" : "portrait",
      `${hint} ${page.name}`,
    );
    if (!art) return el;
    stats.artwork += 1;
    return { ...image, src: art.src, name: art.name } as PublisherElement;
  });

  if (isTypeOnlyCategory(category)) return elements;

  const alreadyHasPhoto = elements.some(
    (el) =>
      el.type === "image" &&
      (el as PublisherElement & { src?: string }).src &&
      !isBackgroundShape(el, page),
  );
  const hero = heroArtworkFor(category, isPortrait, `${hint} ${page.name}`);
  // A hero only goes in where the page is visibly bare of imagery: adding one behind a busy
  // page would hide the design it was meant to improve.
  const lowCoverage = elements.length <= 12;
  if (alreadyHasPhoto || !hero || !lowCoverage) return elements;

  const heroElement = {
    id: `tpl-art-${page.id}`,
    type: "image",
    name: hero.name,
    src: hero.src,
    x: 0,
    y: 0,
    width: page.width,
    height: page.height,
    rotation: 0,
    zIndex: 0,
    opacity: hero.tone === "light" ? 0.9 : 1,
    imageFit: "cover",
    imageScale: 1,
    imageRotation: 0,
    flipH: false,
    flipV: false,
    panX: 0,
    panY: 0,
    locked: true,
  } as unknown as PublisherElement;

  // A veil in the page's own colour, so the photograph reads as a tinted panel and the type keeps
  // the contrast it was designed with. A hero without a veil puts body copy straight onto texture,
  // which is the fastest way to make a page unreadable. On a dark page the veil stays light-handed:
  // white type on a dark photograph is readable already, and dimming it to nothing loses the art.
  const darkPage = relativeLuminance(page.backgroundColor || "#ffffff") < 0.4;
  const veil = {
    id: `tpl-veil-${page.id}`,
    type: "shape",
    name: "Hero veil",
    shapeType: "rectangle",
    x: 0,
    y: 0,
    width: page.width,
    height: page.height,
    rotation: 0,
    zIndex: 1,
    fillColor: page.backgroundColor || "#ffffff",
    opacity: darkPage ? 0.5 : 0.85,
    locked: true,
  } as unknown as PublisherElement;

  // Everything else has to sit above it — shifted by the same amount, so the stacking order the
  // template was authored with is preserved. Collapsing everything to one level destroys the ties
  // that decide whether a heading sits on its colour bar or behind it.
  const lifted = elements.map((el) => ({
    ...el,
    zIndex: el.zIndex + 2,
  }));
  stats.heroes += 1;
  return [heroElement, veil, ...lifted];
}

/** 2 + 3. Margins first, then the 8px step. */
function alignToGrid(
  page: Page,
  elements: PublisherElement[],
  stats: PolishStats,
): PublisherElement[] {
  const m = page.margins;
  const rightEdge = page.width - m.right;
  const bottomEdge = page.height - m.bottom;

  return elements.map((el) => {
    if (isBackgroundShape(el, page) || el.locked === true) return el;
    const next = { ...el };

    const xTarget =
      marginSnap(next.x, [m.left]) ??
      marginSnap(next.x + next.width, [rightEdge]);
    if (xTarget !== null) {
      next.x = xTarget === m.left ? m.left : rightEdge - next.width;
      stats.snappedToMargins += 1;
    } else {
      const snapped = snapToStep(next.x);
      if (Math.abs(snapped - next.x) > 0 && Math.abs(snapped - next.x) <= 4) {
        next.x = snapped;
        stats.snappedToGrid += 1;
      }
    }

    const yTarget =
      marginSnap(next.y, [m.top]) ??
      marginSnap(next.y + next.height, [bottomEdge]);
    if (yTarget !== null) {
      next.y = yTarget === m.top ? m.top : bottomEdge - next.height;
      stats.snappedToMargins += 1;
    } else {
      const snapped = snapToStep(next.y);
      if (Math.abs(snapped - next.y) > 0 && Math.abs(snapped - next.y) <= 4) {
        next.y = snapped;
        stats.snappedToGrid += 1;
      }
    }

    return next;
  });
}

/** 4. Gaps in a vertical stack become multiples of the step, biggest offenders first. */
function normaliseRhythm(
  page: Page,
  elements: PublisherElement[],
  stats: PolishStats,
): PublisherElement[] {
  const content = elements
    .filter((el) => !isBackgroundShape(el, page) && el.type !== "image")
    .sort((a, b) => a.y - b.y);

  const result = [...elements];

  for (let i = 1; i < content.length; i += 1) {
    const above = content[i - 1];
    const below = content[i];
    // Only pairs that share a column are a stack.
    const overlapsX =
      below.x < above.x + above.width && below.x + below.width > above.x;
    if (!overlapsX) continue;

    const gap = below.y - (above.y + above.height);
    if (gap < 2 || gap > 160) continue;
    const target = Math.max(STEP, snapToStep(gap));
    const delta = target - gap;
    if (delta === 0 || Math.abs(delta) > 8) continue;

    const index = result.findIndex((el) => el.id === below.id);
    if (index === -1) continue;
    const moved = { ...result[index], y: result[index].y + delta };
    if (moved.y + moved.height > page.height - page.margins.bottom + 1)
      continue;
    result[index] = moved;
    stats.rhythm += 1;

    // Keep the stack intact: everything below this block moves with it.
    for (let j = i + 1; j < content.length; j += 1) {
      const followIndex = result.findIndex((el) => el.id === content[j].id);
      if (followIndex === -1) continue;
      const follower = result[followIndex];
      if (
        follower.y + follower.height + delta >
        page.height - page.margins.bottom + 1
      )
        break;
      result[followIndex] = { ...follower, y: follower.y + delta };
    }
  }

  return result;
}

/** 5. Text is pushed toward the ink that reads on its backdrop until it passes AA. */
function fixContrast(
  page: Page,
  elements: PublisherElement[],
  stats: PolishStats,
): PublisherElement[] {
  return elements.map((el) => {
    if (el.type !== "text") return el;
    const text = el as TextElement;
    if (!text.color || text.color === "transparent") return text;
    if (text.highlightColor && text.highlightColor !== "transparent")
      return text;

    const backdrop = textBackdrop(
      text,
      elements,
      page.backgroundColor || "#ffffff",
    );
    if (!backdrop) return text; // photograph or gradient — cannot judge, so do not touch

    let ratio = contrastRatio(text.color, backdrop);
    if (ratio >= 4.5) return text;

    // Which way is "away"? Compare against white and black and take the shorter walk.
    const towardWhite = contrastRatio("#f8fafc", backdrop);
    const target = towardWhite >= 4.5 ? "#f8fafc" : "#111827";

    for (let step = 1; step <= 10; step += 1) {
      const candidate = mixHex(text.color, target, step / 10);
      ratio = contrastRatio(candidate, backdrop);
      if (ratio >= 4.5) {
        stats.contrast += 1;
        if (target === "#f8fafc") stats.lightened += 1;
        return { ...text, color: candidate };
      }
    }

    // Even fully mixed it does not pass: take the best we reached.
    stats.contrast += 1;
    return { ...text, color: target };
  });
}

/** 6. A page that is too full loses weight from its decoration, not its content. */
function relieveDensity(
  page: Page,
  elements: PublisherElement[],
  stats: PolishStats,
): PublisherElement[] {
  const pageArea = page.width * page.height;
  const ink = elements.reduce((sum, el) => {
    if (el.visible === false || isBackgroundShape(el, page)) return sum;
    return sum + el.width * el.height;
  }, 0);
  if (ink / pageArea <= 0.78) return elements;

  // Shrink the biggest decorations (shapes, not text or pictures) a little, keeping their
  // centres, until the page is back inside the comfortable band.
  const pad = page.width * page.height * 0.04;
  let working = elements;
  let inkNow = ink;
  const decorations = elements
    .filter(
      (el): el is ShapeElement =>
        el.type === "shape" && !isBackgroundShape(el, page),
    )
    .sort((a, b) => b.width * b.height - a.width * a.height);

  for (const decoration of decorations.slice(0, 3)) {
    if (inkNow / pageArea <= 0.72) break;
    const scale = 0.88;
    const w = Math.round(decoration.width * scale);
    const h = Math.round(decoration.height * scale);
    const cx = decoration.x + decoration.width / 2;
    const cy = decoration.y + decoration.height / 2;
    inkNow -= decoration.width * decoration.height;
    inkNow += w * h;
    working = working.map((el) =>
      el.id === decoration.id
        ? {
            ...el,
            width: w,
            height: h,
            x: Math.round(cx - w / 2),
            y: Math.round(cy - h / 2),
          }
        : el,
    );
    stats.lightened += 1;
    void pad;
  }
  return working;
}

export function polishPage(page: Page, category: TemplateCategory, hint = ''): Page {
  let elements = placeArtwork(page, category, TEMPLATE_POLISH_STATS, hint);
  elements = alignToGrid(page, elements, TEMPLATE_POLISH_STATS);
  elements = normaliseRhythm(page, elements, TEMPLATE_POLISH_STATS);
  elements = fixContrast(page, elements, TEMPLATE_POLISH_STATS);
  elements = relieveDensity(page, elements, TEMPLATE_POLISH_STATS);
  const tidied: Page = { ...page, elements };

  // Three candidates, best one wins. The original is in the running on purpose: a rule that
  // helps most pages but hurts this one must not ship here, and a template that was already
  // right should come through untouched.
  const composed = composeEditorial(page, category, hint);
  const candidates: Page[] = composed ? [page, tidied, composed] : [page, tidied];
  // A page carrying artwork wins a near-tie. A template with a photograph behind its type reads
  // as designed where the same template on flat colour reads as unfinished, so when two candidates
  // score within a point of each other the one with the picture is the better template.
  const rank = (candidate: Page) =>
    scoreElements(candidate.elements, candidate).total +
    (candidate.elements.some(
      (el) => el.type === "image" && el.width * el.height > candidate.width * candidate.height * 0.5,
    )
      ? 0.9
      : 0);
  const best = candidates.reduce((winner, candidate) => (rank(candidate) > rank(winner) ? candidate : winner));

  if (best === tidied) TEMPLATE_POLISH_STATS.tidied += 1;
  else if (best === composed) TEMPLATE_POLISH_STATS.composed += 1;
  else TEMPLATE_POLISH_STATS.keptOriginal += 1;

  return best;
}

/** Every word on the page, used to pick artwork the copy actually suits. */
function hintFor(project: DocumentProject): string {
  const words = project.pages.flatMap((page) =>
    page.elements.flatMap((el) =>
      el.type === "text" ? [String((el as TextElement).text || "")] : [],
    ),
  );
  return `${project.name} ${words.join(" ")}`.toLowerCase();
}

export function polishProject(
  project: DocumentProject,
  category: TemplateCategory,
): DocumentProject {
  const hint = hintFor(project);
  return {
    ...project,
    pages: project.pages.map((page) => polishPage(page, category, hint)),
  };
}
