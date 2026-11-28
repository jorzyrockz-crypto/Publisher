import type {
  Page,
  PublisherElement,
  ShapeElement,
  TextElement,
} from "../types/publisher";
import type { TemplateCategory } from "../constants/templates";
import { artworkFor, isTypeOnlyCategory } from "../constants/generatedArtwork";
import { contrastRatio } from "./documentPalette";
import { wordArtHasBackdrop, wordArtSelfContained } from "./wordArt";
import type { WordArtStyle } from "../types/publisher";

/**
 * Composed layouts — the part that makes a template look *designed* rather than tidied.
 *
 * Rules and snapping fix sloppiness. A page that was never composed still reads as a page that
 * was never composed, so these presets are the compositions a studio would reach for: a picture
 * panel, a type panel, an eyebrow, a headline that owns the space, an accent rule, a measured
 * body block and a footer sitting on the baseline.
 *
 * Two things they deliberately do *not* do:
 *  - change the template's voice. The headline keeps its family, weight, colour and alignment;
 *    only the geometry and the spacing are editorial.
 *  - lose any copy. Text that does not earn a slot is appended to the body block, so the finished
 *    document still says everything the original said.
 *
 * Each composition is a *candidate*: `templatePolish` scores it against the tidied original and
 * keeps whichever is better, so a preset can never make a template worse.
 */

type Rect = { x: number; y: number; width: number; height: number };

interface TypeCopy {
  eyebrow: string;
  title: string;
  body: string;
  footer: string;
  titleSource?: TextElement;
  eyebrowSource?: TextElement;
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const isDark = (hex: string) => {
  const clean = (hex || "").replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  if (full.length !== 6) return false;
  const value = Number.parseInt(full, 16);
  if (!Number.isFinite(value)) return false;
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5;
};

const mix = (from: string, to: string, t: number) => {
  const read = (hex: string) => {
    const clean = hex.replace("#", "");
    const full =
      clean.length === 3
        ? clean
            .split("")
            .map((c) => c + c)
            .join("")
        : clean;
    const value = Number.parseInt(full, 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  };
  if (!HEX.test(from) || !HEX.test(to)) return from;
  const a = read(from);
  const b = read(to);
  const out = a.map((channel, i) => Math.round(channel + (b[i] - channel) * t));
  return `#${out.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
};

/** Walks `colour` toward the far end of the scale until it is readable on `background`. */
function ensureContrast(
  colour: string,
  background: string,
  target = 4.6,
): string {
  if (!HEX.test(colour) || !HEX.test(background)) return colour;
  const towards = isDark(background) ? "#ffffff" : "#111827";
  let working = colour;
  for (let step = 0; step < 30; step += 1) {
    if (contrastRatio(working, background) >= target) return working;
    working = mix(working, towards, 0.12);
  }
  // Still short after walking the whole way: the ink has to win. Readability is not negotiable.
  return towards;
}

/** Reads the copy out of an existing page so the composition uses the template's words. */
function readCopy(page: Page): TypeCopy | null {
  const texts = page.elements.filter(
    (el): el is TextElement =>
      el.type === "text" &&
      el.visible !== false &&
      Boolean(el.text && el.text.trim()),
  );
  if (texts.length < 2) return null;

  const bySize = [...texts].sort((a, b) => b.fontSize - a.fontSize);
  const titleSource = bySize[0];
  const title = (titleSource.text || "").trim().replace(/\s+/g, " ");
  if (!title) return null;

  const contactPattern =
    /(@|www\.|\.com\b|\.club\b|\+\d|\d{3}[\s.-]?\d{3}|\bRSVP\b|\bRSVP\b)/i;
  const footerSource = texts.find(
    (el) => el.id !== titleSource.id && contactPattern.test(el.text),
  );

  const spare = texts.filter(
    (el) => el.id !== titleSource.id && el.id !== footerSource?.id,
  );
  // A kicker sits at the top of a page, so the topmost short line is the better guess than the
  // smallest one — footers and metadata lines are small too, and reading those as the kicker is
  // what made the first pass look scrambled.
  const eyebrowSource = [...spare]
    .filter((el) => el.text.trim().length <= 64)
    .sort((a, b) => a.y - b.y || a.fontSize - b.fontSize)[0];
  const bodySource = [...spare]
    .filter((el) => el.id !== eyebrowSource?.id)
    .sort((a, b) => b.text.length - a.text.length)[0];

  const clean = (value: string, limit: number) =>
    value.trim().replace(/\s+/g, " ").slice(0, limit);

  const used = new Set([
    titleSource.id,
    footerSource?.id,
    eyebrowSource?.id,
    bodySource?.id,
  ]);
  const leftovers = texts
    .filter((el) => !used.has(el.id))
    .map((el) => clean(el.text, 140))
    .filter(Boolean);

  return {
    eyebrow: clean(eyebrowSource?.text || "", 52),
    title: title.slice(0, 92),
    body: [clean(bodySource?.text || "", 340), ...leftovers]
      .filter(Boolean)
      .join("  ·  ")
      .slice(0, 430),
    footer: clean(footerSource?.text || "", 96),
    titleSource,
    eyebrowSource,
  };
}

/** The most saturated light accent on the page — the colour a designer would pick for a rule. */
const accentOf = (page: Page, adaptTo: string): string => {
  const fills = page.elements
    .filter(
      (el): el is ShapeElement => el.type === "shape" && el.visible !== false,
    )
    .map((el) => el.fillColor)
    .filter((fill): fill is string => Boolean(fill) && HEX.test(fill));

  // Rank by saturation: the vivid brand colour is the one worth a rule, not the greys.
  const scored = fills
    .map((fill) => {
      const clean = fill.replace("#", "");
      const full =
        clean.length === 3
          ? clean
              .split("")
              .map((c) => c + c)
              .join("")
          : clean;
      const [r, g, b] = [0, 2, 4].map((i) =>
        Number.parseInt(full.slice(i, i + 2), 16),
      );
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      return { fill, saturation: (max - min) / 255, lightness: max / 255 };
    })
    .filter((entry) => entry.saturation > 0.16 && entry.lightness > 0.2)
    .sort((a, b) => b.saturation - a.saturation);

  const chosen = scored[0]?.fill || "#6e56cf";
  return ensureContrast(chosen, adaptTo, 2.8);
};

const hexToRgba = (hex: string, alpha: number) => {
  const clean = (hex || "#000000").replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  if (full.length !== 6) return `rgba(0,0,0,${alpha})`;
  const value = Number.parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

const baseText = (
  id: string,
  rect: Rect,
  text: string,
  options: {
    fontSize: number;
    fontWeight: number | string;
    color: string;
    fontFamily?: string;
    align?: "left" | "center" | "right";
    letterSpacing?: number;
    lineHeight?: number;
    uppercase?: boolean;
    zIndex?: number;
    opacity?: number;
  },
): TextElement =>
  ({
    id,
    type: "text",
    name: "Text",
    ...rect,
    rotation: 0,
    zIndex: options.zIndex ?? 5,
    text,
    fontFamily: options.fontFamily || "Inter",
    fontSize: options.fontSize,
    fontWeight: options.fontWeight,
    fontStyle: "normal",
    textAlign: options.align ?? "left",
    verticalAlign: "top",
    columns: 1,
    columnGap: 16,
    lineHeight: options.lineHeight ?? 1.25,
    padding: 0,
    color: options.color,
    letterSpacing: options.letterSpacing ?? 0,
    opacity: options.opacity ?? 1,
    textTransform: options.uppercase ? "uppercase" : "none",
  }) as unknown as TextElement;

const bar = (id: string, rect: Rect, fill: string, zIndex = 4): ShapeElement =>
  ({
    id,
    type: "shape",
    name: "Rule",
    shapeType: "rectangle",
    ...rect,
    rotation: 0,
    zIndex,
    fillColor: fill,
    opacity: 1,
  }) as unknown as ShapeElement;

/** Which categories have a composition a studio would reach for. */
const COMPOSED: TemplateCategory[] = ["Poster", "Flyer", "Invitation"];

/** Anything with a table, a connector, a collage or an odd amount of copy keeps its own design. */
function isComposable(page: Page): boolean {
  if (
    page.elements.some((el) => el.type === "table" || el.type === "connector")
  )
    return false;
  if (
    page.elements.some(
      (el) =>
        el.type === "image" && (el as { collageMeta?: unknown }).collageMeta,
    )
  )
    return false;
  // Lettering that *is* the design must not be recomposed: a stack of two or more WordArt lines
  // is a lockup, and a sticker or brush style carries its own border or backdrop. A single display
  // title among ordinary copy is fair game — the composition keeps the words and the page.
  const wordArt = page.elements.filter(
    (el) => el.type === "text" && (el as { isWordArt?: boolean }).isWordArt,
  ) as Array<{ wordArtStyle?: WordArtStyle }>;
  if (wordArt.length >= 2) return false;
  if (
    wordArt.some(
      (el) =>
        wordArtSelfContained(el.wordArtStyle) ||
        wordArtHasBackdrop(el.wordArtStyle),
    )
  )
    return false;
  const texts = page.elements.filter(
    (el) => el.type === "text" && el.visible !== false,
  );
  return texts.length >= 2 && texts.length <= 7;
}

/**
 * Shrinks the headline until it wraps into `maxLines` lines inside `width`.
 *
 * The advance width is deliberately pessimistic: type that overflows its box is the one thing a
 * composition cannot recover from, because the next block has already been placed below it.
 */
function fitHeadline(
  text: string,
  width: number,
  startSize: number,
  maxLines: number,
  minSize: number,
  weight: number | string | undefined,
  uppercase: boolean,
) {
  const heavy =
    Number(weight) >= 600 || String(weight).toLowerCase().includes("bold");
  const perCharRatio = (uppercase ? 0.74 : 0.66) + (heavy ? 0.03 : 0);
  const measure = (size: number) => {
    const perLine = Math.max(5, Math.floor(width / (size * perCharRatio)));
    return Math.max(1, Math.ceil(text.length / perLine));
  };

  let size = startSize;
  while (size > minSize && measure(size) > maxLines) {
    size -= Math.max(1, Math.round(startSize * 0.05));
  }
  return { size, lines: measure(size) };
}

/** Blocks must not touch: a composition that overlaps is worse than the layout it replaced. */
function hasBlockCollision(elements: PublisherElement[]): boolean {
  const blocks = elements.filter(
    (el) =>
      el.type === "text" || el.id.includes("rule") || el.id.includes("hair"),
  );
  for (let i = 0; i < blocks.length; i += 1) {
    for (let j = i + 1; j < blocks.length; j += 1) {
      const a = blocks[i];
      const b = blocks[j];
      const overlapX =
        Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const overlapY =
        Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      if (overlapX > 2 && overlapY > 2) return true;
    }
  }
  return false;
}

export function composeEditorial(
  page: Page,
  category: TemplateCategory,
  hint = "",
): Page | null {
  if (isTypeOnlyCategory(category) || !COMPOSED.includes(category)) return null;
  if (!isComposable(page)) return null;

  const copy = readCopy(page);
  if (!copy) return null;

  const W = page.width;
  const H = page.height;
  const portrait = H >= W;
  const short = Math.min(W, H);
  const isStationery = category === "Invitation";

  // Landscape canvases keep their own design. A side-by-side picture panel reads as a layout on a
  // portrait page; on a 16:9 thumbnail it just looks like two rectangles. Those templates are
  // already bold and full bleed, and the tidying pass is the right treatment for them.
  if (!portrait) return null;

  const art = artworkFor(
    category,
    portrait ? "portrait" : "landscape",
    `${hint} ${page.name}`,
  );
  if (!art) return null;

  const pageBg = (page.backgroundColor || "#ffffff").toLowerCase();
  const panelBg = isDark(pageBg) ? "#f8fafc" : pageBg;
  const accent = accentOf(page, panelBg);

  // Ink is inherited: a template with a crimson headline keeps its crimson headline. If the
  // inherited colour is too light to read on the panel, it is replaced by true ink — never by a
  // half-way grey, which is what a contrast walk alone would produce and what makes type look
  // washed out.
  const sourceInk = copy.titleSource?.color || "";
  const sourceInkReads =
    HEX.test(sourceInk) && contrastRatio(sourceInk, panelBg) >= 4.5;
  const ink = sourceInkReads
    ? sourceInk
    : isDark(panelBg)
      ? "#ffffff"
      : "#141821";
  const inkMuted = ensureContrast(
    isDark(ink) ? "#4b5563" : mix(ink, "#111827", 0.35),
    panelBg,
    4.6,
  );
  const titleFamily = copy.titleSource?.fontFamily || "Inter";
  const titleWeight = copy.titleSource?.fontWeight || 800;
  const titleWasCentred = (copy.titleSource?.textAlign || "left") === "center";
  const titleUpperCase =
    (copy.titleSource?.textTransform || "none") === "uppercase";

  const margin = Math.round(short * 0.075);
  const size = (ratio: number) => Math.max(9, Math.round(short * ratio));

  const elements: PublisherElement[] = [];

  // ---- geometry -------------------------------------------------------------------------
  // Portrait pages get a picture band on top; landscape pages get a picture panel at the side.
  // Stationery keeps the picture full bleed and floats a card on it.
  let artRect: Rect;
  let typeRect: Rect;
  let card: Rect | null = null;

  if (isStationery) {
    const inset = Math.round(short * 0.055);
    artRect = { x: 0, y: 0, width: W, height: H };
    card = { x: inset, y: inset, width: W - inset * 2, height: H - inset * 2 };
    typeRect = card;
  } else if (portrait) {
    const bandH = Math.round(H * 0.52);
    artRect = { x: 0, y: 0, width: W, height: bandH };
    typeRect = { x: 0, y: bandH, width: W, height: H - bandH };
  } else {
    const bandW = Math.round(W * 0.44);
    artRect = { x: W - bandW, y: 0, width: bandW, height: H };
    typeRect = { x: 0, y: 0, width: W - bandW, height: H };
  }

  elements.push({
    id: `cmp-art-${page.id}`,
    type: "image",
    name: art.name,
    src: art.src,
    ...artRect,
    rotation: 0,
    zIndex: 0,
    opacity: 1,
    imageFit: "cover",
    imageScale: 1,
    imageRotation: 0,
    flipH: false,
    flipV: false,
    panX: 0,
    panY: 0,
    locked: true,
  } as unknown as PublisherElement);

  // A hairline of the accent along the join: the detail that makes the two panels read as one
  // composition rather than two rectangles stacked up.
  if (portrait && !isStationery) {
    elements.push(
      bar(
        `cmp-join-${page.id}`,
        {
          x: 0,
          y: artRect.height - Math.max(4, Math.round(short * 0.008)),
          width: W,
          height: Math.max(4, Math.round(short * 0.008)),
        },
        accent,
        2,
      ),
    );
  }

  if (card) {
    elements.push({
      id: `cmp-panel-${page.id}`,
      type: "shape",
      name: "Card",
      shapeType: "rectangle",
      ...card,
      rotation: 0,
      zIndex: 1,
      fillColor: panelBg,
      opacity: 1,
    } as unknown as PublisherElement);
  }

  // ---- type -------------------------------------------------------------------------------------------------------------------------------------------------------
  const textW = isStationery
    ? card!.width - margin * 1.2
    : typeRect.width - margin * 2;
  const textX = isStationery ? card!.x + margin * 0.6 : typeRect.x + margin;
  const centred = isStationery || titleWasCentred;
  const align: "left" | "center" = centred ? "center" : "left";

  const headlineStart = isStationery ? size(0.072) : size(0.088);
  const maxLines = isStationery ? 3 : 3;
  const fitted = fitHeadline(
    titleUpperCase ? copy.title.toUpperCase() : copy.title,
    textW,
    headlineStart,
    maxLines,
    size(0.03),
    titleWeight,
    titleUpperCase,
  );
  const eyebrowSize = Math.max(
    9,
    Math.round(short * (isStationery ? 0.017 : 0.0155)),
  );
  const bodySize = Math.max(
    10,
    Math.round(short * (isStationery ? 0.024 : 0.0215)),
  );
  const footerSize = Math.max(9, Math.round(short * 0.016));

  const gap = Math.round(short * (isStationery ? 0.03 : 0.022));
  const ruleH = Math.max(3, Math.round(short * 0.0075));
  const ruleW = Math.round(short * 0.1);

  const buildTypeLayout = (headlineSize: number): PublisherElement[] => {
    const titleH = Math.round(fitted.lines * headlineSize * 1.12);
    const bodyPerLine = Math.max(14, Math.floor(textW / (bodySize * 0.52)));
    const bodyLines = copy.body
      ? Math.max(1, Math.ceil(copy.body.length / bodyPerLine))
      : 0;
    const bodyH = Math.round(bodyLines * bodySize * 1.55);
    const eyebrowH = copy.eyebrow ? Math.round(eyebrowSize * 1.8) : 0;
    const contentH =
      (copy.eyebrow ? eyebrowH + gap : 0) +
      titleH +
      gap * 1.2 +
      ruleH +
      (bodyH ? gap + bodyH : 0);

    // Vertically the block is distributed, not dumped at the top: the empty space ends up shared
    // between the headline and the footer instead of pooling under the body.
    const panelTop = typeRect.y;
    const panelH = typeRect.height;
    const footerZone = copy.footer
      ? margin + Math.round(footerSize * 2.4)
      : margin;
    const available = panelH - footerZone - margin;
    // Slack is shared out rather than left in one heap: a little above the block, and a little
    // more in each of its gaps. That is what makes the spacing read as deliberate.
    const slack = Math.max(0, available - contentH);
    // Stationery centres its block; a poster with a footer shares the slack; a poster without one
    // anchors the type to the bottom of its panel, under the picture. That last case is the classic
    // poster lockup, and it is the one that stops a big empty foot appearing under the copy.
    const lead = Math.round(
      slack * (isStationery ? 0.5 : copy.footer ? 0.26 : 0.94),
    );
    // Capped: slack shared into the gaps is breathing room, but too much of it turns the rule
    // into a floating line and the block stops reading as one thing.
    const spread = Math.min(gap, Math.round(slack * (isStationery ? 0.1 : 0.07)));
    const blockTop = panelTop + (isStationery ? margin * 1.2 : margin) + lead;

    const blocks: PublisherElement[] = [];
    let y = blockTop;

    if (copy.eyebrow) {
      blocks.push(
        baseText(
          `cmp-eyebrow-${page.id}`,
          { x: textX, y, width: textW, height: eyebrowH },
          copy.eyebrow,
          {
            fontSize: eyebrowSize,
            fontWeight: 700,
            color: inkMuted,
            fontFamily: copy.eyebrowSource?.fontFamily || titleFamily,
            align,
            letterSpacing: Math.max(1, Math.round(eyebrowSize * 0.18)),
            uppercase: true,
            zIndex: 6,
          },
        ),
      );
      y += eyebrowH + gap + spread;
    }

    blocks.push(
      baseText(
        `cmp-title-${page.id}`,
        { x: textX, y, width: textW, height: titleH },
        copy.title,
        {
          fontSize: headlineSize,
          fontWeight: titleWeight,
          color: ink,
          fontFamily: titleFamily,
          align,
          lineHeight: 1.08,
          letterSpacing: Math.round(
            headlineSize * (titleUpperCase ? 0.01 : -0.01),
          ),
          uppercase: titleUpperCase,
          zIndex: 7,
        },
      ),
    );
    y += titleH + gap * 0.6 + spread;

    blocks.push(
      bar(
        `cmp-rule-${page.id}`,
        {
          x: centred ? textX + Math.round((textW - ruleW) / 2) : textX,
          y,
          width: ruleW,
          height: ruleH,
        },
        accent,
        6,
      ),
    );
    y += ruleH + gap * 0.8 + spread;

    // The footer is pinned to the bottom of the panel, so its position is known before the body
    // is placed. Body copy that would crowd it comes down a point at a time until it fits: the
    // last line of a paragraph must never sit on the rule above the footer.
    const footerY = panelTop + panelH - margin - Math.round(footerSize * 1.7);
    const hairY = footerY - Math.max(gap, Math.round(short * 0.024));
    const bodyLimit = copy.footer ? hairY - Math.round(gap * 0.8) : typeRect.y + typeRect.height - margin;

    if (copy.body) {
      let bodyFontSize = bodySize;
      let bodyHeight = bodyH;
      while (bodyFontSize > 9 && y + bodyHeight > bodyLimit) {
        bodyFontSize -= 1;
        const perLine = Math.max(12, Math.floor(textW / (bodyFontSize * 0.52)));
        const lines = Math.max(1, Math.ceil(copy.body.length / perLine));
        bodyHeight = Math.round(lines * bodyFontSize * 1.55);
      }
      blocks.push(
        baseText(
          `cmp-body-${page.id}`,
          {
            x: textX,
            y,
            width: centred ? textW : Math.round(textW * 0.95),
            height: bodyHeight,
          },
          copy.body,
          {
            fontSize: bodyFontSize,
            fontWeight: 400,
            color: inkMuted,
            fontFamily: "Inter",
            align,
            lineHeight: 1.55,
            zIndex: 6,
          },
        ),
      );
    }

    if (copy.footer) {
      blocks.push(
        bar(
          `cmp-hair-${page.id}`,
          { x: textX, y: hairY, width: textW, height: 1 },
          hexToRgba("#141821", 0.16),
          5,
        ),
      );
      blocks.push(
        baseText(
          `cmp-footer-${page.id}`,
          {
            x: textX,
            y: footerY,
            width: textW,
            height: Math.round(footerSize * 1.9),
          },
          copy.footer,
          {
            fontSize: footerSize,
            fontWeight: 600,
            color: inkMuted,
            fontFamily: "Inter",
            align,
            letterSpacing: Math.round(footerSize * 0.06),
            zIndex: 6,
          },
        ),
      );
    }

    return blocks;
  };

  // Type that has grown into something is type that has to come down a size. Retry at descending
  // sizes and keep the first layout whose blocks are clean, rather than shipping an overlap.
  let chosen: PublisherElement[] | null = null;
  for (const factor of [1, 0.94, 0.88, 0.81, 0.74]) {
    const candidate = [
      ...elements,
      ...buildTypeLayout(
        Math.max(size(0.03), Math.round(fitted.size * factor)),
      ),
    ];
    if (!hasBlockCollision(candidate)) {
      chosen = candidate;
      break;
    }
  }
  if (!chosen) return null;
  return { ...page, backgroundColor: panelBg, elements: chosen };
}
