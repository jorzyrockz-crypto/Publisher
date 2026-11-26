import type { TextElement } from '../types/publisher';
import { wordArtWeight } from './wordArt';

/**
 * One layout engine for both the DOM renderer and the canvas exporter.
 *
 * Before this existed the two disagreed: the DOM leaned on CSS (columns, justify,
 * tracking) while `canvasRenderer` used a plain greedy wrap, so exports silently
 * dropped tracking, indents, columns and drop caps. Everything now resolves to
 * absolute positions here and both renderers only paint what they are given.
 */

export type TextRunKind = 'word' | 'space' | 'marker' | 'leader';

export interface LaidOutRun {
  text: string;
  x: number;
  width: number;
  kind: TextRunKind;
  /** Per-run size: list markers and drop caps differ from body text. */
  fontSize: number;
  /** Vertical offset applied when painting (superscript / subscript). */
  baselineShift: number;
}

export interface LaidOutLine {
  runs: LaidOutRun[];
  /** Top of the line box, relative to the text box. */
  y: number;
  height: number;
  /** Top of the glyph em-box, used identically by both renderers. */
  textTop: number;
  isLast: boolean;
}

export interface CurveChar {
  text: string;
  /** Centre of the glyph box. */
  x: number;
  y: number;
  /** Clockwise rotation in degrees. */
  angle: number;
  fontSize: number;
  width: number;
}

export interface LaidOutDropCap {
  char: string;
  x: number;
  y: number;
  size: number;
  width: number;
  lines: number;
}

export interface TextLayoutResult {
  fontSize: number;
  lines: LaidOutLine[];
  contentHeight: number;
  padding: number;
  textLeft: number;
  columnWidth: number;
  columnCount: number;
  columnGap: number;
  dropCap?: LaidOutDropCap;
  /** Present when the element is curved: glyphs placed on a circular arc. */
  curve?: { chars: CurveChar[]; contentHeight: number };
  /** True when the layout is taller than the frame (after any auto-fit). */
  overflows: boolean;
}

let measureCtx: CanvasRenderingContext2D | null = null;
const widthCache = new Map<string, number>();

function getMeasureCtx(): CanvasRenderingContext2D | null {
  if (measureCtx) return measureCtx;
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 8;
  measureCtx = canvas.getContext('2d');
  return measureCtx;
}

/** Glyph width in px, cached per font + string. */
export function measureTextWidth(text: string, font: string): number {
  if (!text) return 0;
  const key = `${font}\u0000${text}`;
  const cached = widthCache.get(key);
  if (cached !== undefined) return cached;

  const ctx = getMeasureCtx();
  let width: number;
  if (ctx) {
    ctx.font = font;
    width = ctx.measureText(text).width;
  } else {
    // Headless fallback (tests / SSR): average advance width.
    const size = Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] || 16);
    width = text.length * size * 0.52;
  }
  if (widthCache.size > 4000) widthCache.clear();
  widthCache.set(key, width);
  return width;
}

export function buildFontString(
  el: Pick<TextElement, 'fontFamily' | 'fontWeight' | 'fontStyle'> & {
    isWordArt?: boolean;
    wordArtStyle?: TextElement['wordArtStyle'];
  },
  size: number
): string {
  const style = el.fontStyle === 'italic' ? 'italic ' : '';
  // A WordArt style forces a heavier weight, so measurement has to use it too
  // or the wrap and the glyphs disagree.
  const weight =
    (el.isWordArt ? wordArtWeight(el.wordArtStyle) : undefined) ??
    (el.fontWeight === 'bold' ? '700' : el.fontWeight || '400');
  return `${style}${weight} ${Math.max(1, size)}px ${el.fontFamily || 'sans-serif'}`;
}

/** Width of a run including tracking (letter spacing) and word spacing. */
export function measureRun(
  text: string,
  font: string,
  letterSpacing = 0,
  wordSpacing = 0
): number {
  if (!text) return 0;
  const spaces = (text.match(/ /g) || []).length;
  return measureTextWidth(text, font) + letterSpacing * text.length + wordSpacing * spaces;
}

export function applyTextTransform(
  text: string,
  el: Pick<TextElement, 'textTransform'>
): string {
  if (el.textTransform === 'uppercase') return text.toUpperCase();
  if (el.textTransform === 'lowercase') return text.toLowerCase();
  if (el.textTransform === 'capitalize') return text.replace(/\b\w/g, (c) => c.toUpperCase());
  return text;
}

const BULLETS = ['•', '◦', '▪'];

function listMarkerFor(
  style: TextElement['listStyle'],
  index: number,
  level: number
): string | null {
  if (!style || style === 'none') return null;
  if (style === 'number') return `${index}.`;
  return BULLETS[Math.min(level, BULLETS.length - 1)];
}

/**
 * Conservative hyphenation: only long words, splitting after a vowel cluster, so
 * we never produce the gibberish of naive width-splitting.
 */
function hyphenateWord(
  word: string,
  maxWidth: number,
  font: string,
  letterSpacing: number
): string | null {
  const clean = word.replace(/[^A-Za-z]/g, '');
  if (clean.length < 7) return null;
  for (let cut = Math.floor(clean.length / 2) + 2; cut >= 4; cut -= 1) {
    const head = `${clean.slice(0, cut)}-`;
    if (measureRun(head, font, letterSpacing) <= maxWidth) return head;
  }
  return null;
}

interface RawLine {
  text: string;
  /** Tab-separated paragraph: left label, optional leader, right value. */
  tab?: { left: string; right: string };
  isParagraphStart: boolean;
  paragraphIndex: number;
  level: number;
}

export interface TextLayoutOptions {
  /** Override the element's size (auto-fit walks this down). */
  fontSize?: number;
  /** Skip the auto-fit recursion. */
  ignoreAutoFit?: boolean;
}

function buildRawLines(
  el: TextElement,
  font: string,
  baseSize: number,
  textWidth: number,
  capWidth: number,
  capLines: number,
  letterSpacing: number,
  wordSpacing: number
): RawLine[] {
  const raw = applyTextTransform(el.text || '', el);
  const paragraphs = raw.split('\n');
  const out: RawLine[] = [];

  const availableWidth = (absoluteLine: number, firstLineOfParagraph: boolean) => {
    let width = textWidth;
    if (firstLineOfParagraph) width -= el.textIndent || 0;
    if (capLines > 0 && absoluteLine < capLines) width -= capWidth;
    return Math.max(20, width);
  };

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const level = paragraph.match(/^\s*/)?.[0].length ? 1 : 0;
    const body = paragraph.replace(/^\s+/, '');
    const isParagraphStart = true;

    if (body.includes('\t')) {
      const [left, right = ''] = body.split('\t');
      out.push({
        text: body,
        tab: { left: left.trimEnd(), right: right.trimStart() },
        isParagraphStart,
        paragraphIndex,
        level,
      });
      return;
    }

    if (body.trim() === '') {
      out.push({ text: '', isParagraphStart, paragraphIndex, level });
      return;
    }

    const words = body.split(/\s+/).filter(Boolean);
    let current: string[] = [];
    let currentWidth = 0;
    let first = true;

    for (const word of words) {
      const wordWidth = measureRun(word, font, letterSpacing, wordSpacing);
      const spaceWidth =
        current.length > 0 ? measureRun(' ', font, letterSpacing, wordSpacing) : 0;
      const limit = availableWidth(out.length + current.length, first);
      const nextWidth = currentWidth + spaceWidth + wordWidth;
      void baseSize;

      if (nextWidth > limit && current.length > 0) {
        out.push({
          text: current.join(' '),
          isParagraphStart: first ? isParagraphStart : false,
          paragraphIndex,
          level,
        });
        first = false;
        current = [word];
        currentWidth = wordWidth;
        const tightLimit = availableWidth(out.length, false);
        if (el.hyphenate && wordWidth > tightLimit) {
          const head = hyphenateWord(word, tightLimit, font, letterSpacing);
          if (head) {
            out.push({ text: head, isParagraphStart: false, paragraphIndex, level });
            current = [];
            currentWidth = 0;
          }
        }
        continue;
      }

      if (nextWidth > limit && current.length === 0) {
        if (el.hyphenate) {
          const head = hyphenateWord(word, limit, font, letterSpacing);
          if (head) {
            out.push({ text: head, isParagraphStart: first, paragraphIndex, level });
            first = false;
            current = [];
            currentWidth = 0;
            continue;
          }
        }
        // A single word wider than the column: keep it whole and let it clip,
        // exactly as a browser does.
        current = [current.length > 0 ? `${current.join(' ')} ${word}` : word];
        currentWidth = nextWidth;
        continue;
      }

      current.push(word);
      currentWidth = nextWidth;
    }

    if (current.length > 0) {
      out.push({
        text: current.join(' '),
        isParagraphStart: first ? isParagraphStart : false,
        paragraphIndex,
        level,
      });
    }
  });

  return out;
}

/**
 * Lays a text element out into absolute lines and runs, in document pixels.
 */
export function layoutText(el: TextElement, options: TextLayoutOptions = {}): TextLayoutResult {
  const padding = el.padding || 0;
  const columnCount = Math.max(1, Math.min(3, el.columns || 1));
  const columnGap = el.columnGap ?? 16;
  const boxW = Math.max(1, el.width - padding * 2);
  const boxH = Math.max(1, el.height - padding * 2);
  const columnWidth = Math.max(20, (boxW - columnGap * (columnCount - 1)) / columnCount);

  const scriptScale = el.script && el.script !== 'normal' ? 0.68 : 1;
  const letterSpacing = el.letterSpacing || 0;
  const wordSpacing = el.wordSpacing || 0;
  const lineHeightFactor = el.lineHeight || 1.4;
  const baseSize = Math.max(1, (options.fontSize ?? el.fontSize) * scriptScale);
  const font = buildFontString(el, baseSize);
  const lineHeight = baseSize * lineHeightFactor;
  const baselineShift =
    el.script === 'super' ? -baseSize * 0.35 : el.script === 'sub' ? baseSize * 0.2 : 0;

  const listStyle = el.listStyle || 'none';
  const hanging = el.hangingIndent ?? (listStyle !== 'none' ? 22 : 0);
  const listIndent = el.listIndent ?? 0;
  const textLeft = padding + listIndent + hanging;
  const textWidth = Math.max(20, columnWidth - listIndent - hanging);

  const rawText = applyTextTransform(el.text || '', el);
  const curveBend = el.textCurve ?? 0;

  // Curved text bypasses line layout: glyphs are placed on an arc instead.
  if (curveBend !== 0) {
    const curvedText = rawText.replace(/\n+/g, ' ').trim();
    const build = (size: number) =>
      buildCurveLayout(
        el,
        curvedText,
        size,
        scriptScale,
        baselineShift,
        letterSpacing,
        wordSpacing,
        padding,
        boxW,
        curveBend
      );

    let size = baseSize;
    let curve = build(size);
    // Curved text shrinks to fit like any other block, so a ring never spills
    // out of its frame after a resize.
    if (el.autoFit === 'shrink' && !options.ignoreAutoFit) {
      let guard = 0;
      while (curve.contentHeight > boxH + 0.5 && size > 6 && guard++ < 24) {
        size = Math.max(6, size - Math.max(0.5, size * 0.06));
        curve = build(size);
      }
    }

    return {
      fontSize: size,
      lines: [],
      contentHeight: curve.contentHeight,
      padding,
      textLeft: padding,
      columnWidth: boxW,
      columnCount: 1,
      columnGap: 0,
      curve,
      overflows: curve.contentHeight > boxH + 0.5,
    };
  }

  const firstPara = rawText.split('\n')[0] || '';
  const firstChar = firstPara.trim()[0] || '';
  const hasDropCap = Boolean(el.dropCap && firstChar);
  const capSize = baseSize * 2.8;
  const capFont = buildFontString(el, capSize);
  const capWidth = hasDropCap ? measureTextWidth(firstChar, capFont) + baseSize * 0.35 : 0;
  const capLines = hasDropCap ? Math.max(1, Math.round(capSize / lineHeight)) : 0;

  const rawLines = buildRawLines(
    el,
    font,
    baseSize,
    textWidth,
    hasDropCap ? capWidth : 0,
    hasDropCap ? capLines : 0,
    letterSpacing,
    wordSpacing
  );

  // Balance columns by line count, the way CSS multi-column does for text.
  const perColumn = columnCount > 1 ? Math.ceil(rawLines.length / columnCount) : rawLines.length;
  const laidOut: LaidOutLine[] = [];
  let maxBottom = 0;

  for (let i = 0; i < rawLines.length; i += 1) {
    const line = rawLines[i];
    const chunkIndex = columnCount > 1 ? Math.floor(i / Math.max(1, perColumn)) : 0;
    const columnX = padding + chunkIndex * (columnWidth + columnGap);
    const lineInChunk = columnCount > 1 ? i % Math.max(1, perColumn) : i;
    const y = lineInChunk * lineHeight;

    let startX = columnX + listIndent + hanging;
    if (line.isParagraphStart) startX += el.textIndent || 0;
    if (hasDropCap && i < capLines) startX += capWidth;

    const runs: LaidOutRun[] = [];

    if (line.tab) {
      const leftWidth = measureRun(line.tab.left, font, letterSpacing, wordSpacing);
      const rightWidth = measureRun(line.tab.right, font, letterSpacing, wordSpacing);
      const stops =
        el.tabStops && el.tabStops.length > 0 ? [...el.tabStops].sort((a, b) => a - b) : [];
      const relativeLeft = startX - columnX;
      const stop =
        stops.find((s) => s > relativeLeft + leftWidth + rightWidth + 8) ??
        columnWidth - (listIndent + hanging);
      const leaderStart = startX + leftWidth + 2;
      const leaderEnd = columnX + stop - rightWidth - 4;

      runs.push({
        text: line.tab.left,
        x: startX,
        width: leftWidth,
        kind: 'word',
        fontSize: baseSize,
        baselineShift,
      });

      if (el.tabLeader && el.tabLeader !== 'none' && leaderEnd > leaderStart) {
        runs.push({
          text: el.tabLeader === 'line' ? '─' : el.tabLeader === 'dash' ? '-' : '.',
          x: leaderStart,
          width: leaderEnd - leaderStart,
          kind: 'leader',
          fontSize: baseSize,
          baselineShift,
        });
      }

      runs.push({
        text: line.tab.right,
        x: Math.max(leaderEnd, startX + leftWidth) + 4,
        width: rightWidth,
        kind: 'word',
        fontSize: baseSize,
        baselineShift,
      });
    } else {
      if (line.isParagraphStart && listStyle !== 'none') {
        const marker = listMarkerFor(listStyle, line.paragraphIndex + 1, line.level);
        if (marker) {
          const markerWidth = measureRun(marker, font, letterSpacing, wordSpacing);
          runs.push({
            text: marker,
            x: columnX + listIndent + hanging - markerWidth - 8,
            width: markerWidth,
            kind: 'marker',
            fontSize: baseSize,
            baselineShift,
          });
        }
      }

      const width = measureRun(line.text, font, letterSpacing, wordSpacing);
      const words = line.text ? line.text.split(' ') : [];
      const lineIsLastInColumn =
        columnCount > 1
          ? lineInChunk === Math.min(perColumn, rawLines.length - chunkIndex * perColumn) - 1
          : i === rawLines.length - 1;
      const justify =
        el.textAlign === 'justify' &&
        !lineIsLastInColumn &&
        words.length > 1 &&
        columnX + columnWidth - startX > width;

      if (justify) {
        const spaceWidth = measureRun(' ', font, letterSpacing, wordSpacing);
        const extra = (columnX + columnWidth - startX - width) / (words.length - 1);
        let cursor = startX;
        words.forEach((word, wi) => {
          const wordWidth = measureRun(word, font, letterSpacing, wordSpacing);
          runs.push({
            text: word,
            x: cursor,
            width: wordWidth,
            kind: 'word',
            fontSize: baseSize,
            baselineShift,
          });
          cursor += wordWidth;
          if (wi < words.length - 1) {
            const sw = spaceWidth + extra;
            runs.push({
              text: ' ',
              x: cursor,
              width: sw,
              kind: 'space',
              fontSize: baseSize,
              baselineShift,
            });
            cursor += sw;
          }
        });
      } else if (line.text) {
        runs.push({
          text: line.text,
          x: startX,
          width,
          kind: 'word',
          fontSize: baseSize,
          baselineShift,
        });
      }
    }

    laidOut.push({
      runs,
      y,
      height: lineHeight,
      textTop: y + (lineHeight - baseSize) / 2,
      isLast: i === rawLines.length - 1,
    });
    maxBottom = Math.max(maxBottom, y + lineHeight);
  }

  const contentHeight = maxBottom;
  const overflows = contentHeight > boxH + 0.5;

  // Auto-fit: shrink the type until the block fits its frame.
  if (el.autoFit === 'shrink' && overflows && !options.ignoreAutoFit) {
    let size = el.fontSize;
    while (size > 6) {
      size = Math.max(6, size - Math.max(0.5, size * 0.04));
      const next = layoutText(el, { fontSize: size, ignoreAutoFit: true });
      if (!next.overflows || size === 6) return next;
    }
  }

  const dropCap: LaidOutDropCap | undefined = hasDropCap
    ? {
        char: firstChar,
        x: padding + listIndent + hanging + (el.textIndent || 0),
        y: 0,
        size: capSize,
        width: capWidth,
        lines: capLines,
      }
    : undefined;

  return {
    fontSize: baseSize,
    lines: laidOut,
    contentHeight,
    padding,
    textLeft,
    columnWidth,
    columnCount,
    columnGap,
    dropCap,
    overflows,
  };
}

/**
 * Places each glyph on a circular arc. `bend` is a percentage of a full turn:
 * 100 wraps the text into a complete ring, 35 gives a gentle arch, negative
 * values bow it downwards like a bowl.
 */
function buildCurveLayout(
  el: TextElement,
  text: string,
  baseSize: number,
  scriptScale: number,
  baselineShift: number,
  letterSpacing: number,
  wordSpacing: number,
  padding: number,
  boxW: number,
  bend: number
): { chars: CurveChar[]; contentHeight: number } {
  const font = buildFontString(el, baseSize);
  const chars: CurveChar[] = [];
  const glyphs = Array.from(text);
  if (glyphs.length === 0) return { chars, contentHeight: baseSize };

  const widths = glyphs.map((ch) => measureRun(ch, font, letterSpacing, wordSpacing));
  const totalWidth = Math.max(1, widths.reduce((a, b) => a + b, 0));
  const pct = Math.max(-100, Math.min(100, Math.abs(bend))) / 100;
  const sweep = Math.PI * 2 * pct; // total angle the string covers
  const upward = bend > 0;

  // A full ring only reads if the circle is big enough for the glyphs; when the
  // text is short the radius grows and the letters spread out along the arc
  // (exactly what Canva does) instead of piling up on a tight bend.
  const minRadius = baseSize * 1.55;
  let radius = Math.max(minRadius, totalWidth / Math.max(0.001, sweep));
  const usableHalf = Math.max(minRadius, boxW / 2 - padding - baseSize * 0.5);
  if (pct > 0.85) radius = Math.min(radius, Math.max(minRadius, usableHalf));

  const cx = padding + boxW / 2;
  const drop = radius * (1 - Math.cos(sweep / 2));
  const arcTop = padding + baseSize * 0.6;

  let cursor = 0;
  glyphs.forEach((ch, index) => {
    const width = widths[index];
    const fraction = (cursor + width / 2) / totalWidth;
    const theta = (fraction - 0.5) * sweep;
    const x = cx + radius * Math.sin(theta);
    const y = upward
      ? arcTop + radius * (1 - Math.cos(theta))
      : arcTop + drop - radius * (1 - Math.cos(theta));
    chars.push({
      text: ch,
      x,
      y,
      angle: (upward ? theta : -theta) * (180 / Math.PI),
      fontSize: baseSize,
      width,
    });
    cursor += width;
  });

  void scriptScale;
  void baselineShift;
  void el;
  const contentHeight = (upward ? drop : drop) + baseSize * 1.35;
  return { chars, contentHeight };
}

/** Vertical offset that aligns the block inside its frame. */
export function verticalOffset(layout: TextLayoutResult, el: TextElement): number {
  const boxH = Math.max(1, el.height - layout.padding * 2);
  if (el.verticalAlign === 'middle') return Math.max(0, (boxH - layout.contentHeight) / 2);
  if (el.verticalAlign === 'bottom') return Math.max(0, boxH - layout.contentHeight);
  return 0;
}

export function countWords(text: string): number {
  const trimmed = (text || '').trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}
