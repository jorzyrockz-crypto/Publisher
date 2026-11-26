import {
  ConnectorElement,
  PageMargins,
  PublisherElement,
  ShapeElement,
  TextElement,
} from '../types/publisher';

export type CompositionStyle = 'auto' | 'editorial' | 'centered';

export interface SemanticRoles {
  backgrounds: PublisherElement[];
  edgeBands: PublisherElement[];
  heroTitle: TextElement | null;
  kicker: TextElement | null;
  subtitles: PublisherElement[];
  ctaPills: ShapeElement[];
  visuals: PublisherElement[];
  cornerBadges: ShapeElement[];
  brandMarks: PublisherElement[];
  connectors: ConnectorElement[];
}

let cachedMeasureCtx: CanvasRenderingContext2D | null = null;
function getMeasureContext(): CanvasRenderingContext2D | null {
  if (cachedMeasureCtx) return cachedMeasureCtx;
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  cachedMeasureCtx = c.getContext('2d');
  return cachedMeasureCtx;
}

/**
 * Accurately estimates wrapped pixel height for a text block given a fixed maxWidth.
 */
export function estimateWrappedTextHeight(
  text: string,
  fontFamily: string,
  fontWeight: string,
  fontSize: number,
  maxWidth: number,
  lineHeight = 1.25,
  letterSpacing = 0
): number {
  const ctx = getMeasureContext();
  const safeMaxW = Math.max(40, maxWidth);
  const paragraphs = (text || 'Sample Text').split('\n');
  let totalLines = 0;

  if (!ctx) {
    const avgCharW = fontSize * 0.56 + Math.max(0, letterSpacing);
    const charsPerLine = Math.max(4, Math.floor(safeMaxW / avgCharW));
    for (const p of paragraphs) {
      totalLines += Math.max(1, Math.ceil(p.length / charsPerLine));
    }
    return Math.ceil(totalLines * fontSize * lineHeight + 6);
  }

  const numericWeight = fontWeight === 'bold' ? '700' : fontWeight || '400';
  ctx.font = `${numericWeight} ${fontSize}px ${fontFamily || 'sans-serif'}`;

  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      totalLines += 1;
      continue;
    }
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      const extraSpacing = Math.max(0, candidate.length - 1) * letterSpacing;
      const measuredW = ctx.measureText(candidate).width + extraSpacing;
      if (measuredW > safeMaxW && line) {
        totalLines += 1;
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) totalLines += 1;
  }

  return Math.ceil(Math.max(1, totalLines) * fontSize * lineHeight + 8);
}

/**
 * Computes the largest font size within [minFont, maxFont] such that the text wraps cleanly inside maxW × maxH.
 */
export function fitTextToBox(
  text: string,
  fontFamily: string,
  fontWeight: string,
  maxFont: number,
  minFont: number,
  maxW: number,
  maxH: number,
  lineHeight = 1.25,
  letterSpacing = 0
): { fontSize: number; neededHeight: number } {
  let lo = Math.max(8, Math.round(minFont));
  let hi = Math.max(lo, Math.round(maxFont));
  let bestSize = lo;
  let bestH = estimateWrappedTextHeight(
    text,
    fontFamily,
    fontWeight,
    lo,
    maxW,
    lineHeight,
    letterSpacing
  );

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const h = estimateWrappedTextHeight(
      text,
      fontFamily,
      fontWeight,
      mid,
      maxW,
      lineHeight,
      letterSpacing
    );
    if (h <= maxH) {
      bestSize = mid;
      bestH = h;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return {
    fontSize: bestSize,
    neededHeight: Math.min(maxH, Math.max(bestH, Math.round(bestSize * lineHeight + 6))),
  };
}

export function shouldPreserveAspect(el: PublisherElement): boolean {
  if (el.type === 'qr') return true;
  if (el.type === 'image') return el.aspectRatioLocked !== false;
  if (el.type === 'shape') {
    const s = el as ShapeElement;
    return (
      s.shapeType === 'circle' ||
      s.shapeType === 'star' ||
      s.shapeType === 'badge-burst' ||
      s.shapeType === 'heart' ||
      s.shapeType === 'hexagon' ||
      s.shapeType === 'diamond' ||
      s.shapeType === 'cross'
    );
  }
  return false;
}

/**
 * Classifies artboard elements into semantic design roles so multi-size artboards
 * compose like a human designer rather than stretching elements blindly.
 */
export function classifyElements(
  elements: PublisherElement[],
  srcW: number,
  srcH: number
): SemanticRoles {
  const roles: SemanticRoles = {
    backgrounds: [],
    edgeBands: [],
    heroTitle: null,
    kicker: null,
    subtitles: [],
    ctaPills: [],
    visuals: [],
    cornerBadges: [],
    brandMarks: [],
    connectors: [],
  };

  const textCandidates: TextElement[] = [];

  for (const el of elements) {
    if (el.type === 'connector') {
      roles.connectors.push(el);
      continue;
    }

    if (el.type === 'qr' || (el.type === 'image' && el.name === 'Brand Kit Logo')) {
      roles.brandMarks.push(el);
      continue;
    }

    if (el.type === 'shape' || el.type === 'image') {
      const coversWidth = el.width >= srcW * 0.76;
      const coversHeight = el.height >= srcH * 0.76;

      if (coversWidth && coversHeight) {
        roles.backgrounds.push(el);
        continue;
      }

      if (coversWidth || coversHeight) {
        roles.edgeBands.push(el);
        continue;
      }
    }

    if (el.type === 'shape') {
      const shp = el as ShapeElement;
      if (
        shp.shapeType === 'badge-burst' ||
        shp.shapeType === 'star' ||
        shp.shapeType === 'heart'
      ) {
        roles.cornerBadges.push(shp);
        continue;
      }
      if (shp.label && shp.width <= 540 && shp.height <= 130 && !shp.label.includes('\n\n')) {
        roles.ctaPills.push(shp);
        continue;
      }
      roles.visuals.push(shp);
      continue;
    }

    if (el.type === 'image' || el.type === 'table') {
      roles.visuals.push(el);
      continue;
    }

    if (el.type === 'accent' || el.type === 'line') {
      roles.subtitles.push(el);
      continue;
    }

    if (el.type === 'text') {
      textCandidates.push(el);
    }
  }

  // Pick heroTitle as largest / boldest text element
  if (textCandidates.length > 0) {
    const scored = [...textCandidates].sort((a, b) => {
      const weightA = a.fontSize * (a.isWordArt ? 1.4 : 1) * (a.fontWeight === '900' ? 1.15 : 1);
      const weightB = b.fontSize * (b.isWordArt ? 1.4 : 1) * (b.fontWeight === '900' ? 1.15 : 1);
      return weightB - weightA;
    });
    roles.heroTitle = scored[0];

    const remaining = scored.slice(1);
    // Find short high-tracking or top kicker
    const kickerIdx = remaining.findIndex(
      (t) =>
        t.text.length <= 64 &&
        !t.text.includes('\n') &&
        ((t.letterSpacing && t.letterSpacing >= 1.5) || t.y < (roles.heroTitle?.y ?? 9999))
    );
    if (kickerIdx !== -1) {
      roles.kicker = remaining[kickerIdx];
      remaining.splice(kickerIdx, 1);
    }

    // Order remaining subtitles by length (concise items first so micro cards pick best summary)
    remaining.sort((a, b) => a.text.length - b.text.length);
    roles.subtitles.unshift(...remaining);
  }

  return roles;
}

/**
 * Measures and lays out a vertical stack of semantic items cleanly inside a box
 * without stretching CTA pills or clipping headlines.
 */
function layoutWeightedStack(
  items: { kind: 'kicker' | 'hero' | 'sub' | 'cta' | 'accent'; el: PublisherElement }[],
  zoneX: number,
  zoneY: number,
  zoneW: number,
  zoneH: number,
  align: 'left' | 'center',
  baseScale: number
): PublisherElement[] {
  if (items.length === 0) return [];

  const gap = Math.max(6, Math.min(18, Math.round(zoneH * 0.04)));
  const totalGap = gap * Math.max(0, items.length - 1);
  const availH = Math.max(40, zoneH - totalGap);

  // Assign realistic vertical budgets by role
  const weights: Record<string, number> = {
    hero: 3.0,
    sub: 1.7,
    accent: 1.8,
    kicker: 0.9,
    cta: 1.0,
  };
  const totalWeight = items.reduce((s, it) => s + (weights[it.kind] || 1), 0);

  const sized = items.map((item) => {
    const budgetH = Math.max(20, Math.floor((availH * (weights[item.kind] || 1)) / totalWeight));
    const el = { ...item.el };

    if (el.type === 'text') {
      const txt = el as TextElement;
      const clampedIdeal = Math.max(
        item.kind === 'hero' ? 16 : 10,
        Math.min(
          item.kind === 'hero' ? 86 : item.kind === 'kicker' ? 22 : 34,
          Math.round(txt.fontSize * Math.max(0.45, Math.min(1.25, baseScale)))
        )
      );
      const minF = item.kind === 'hero' ? 14 : 9;
      const fitted = fitTextToBox(
        txt.text,
        txt.fontFamily,
        txt.fontWeight,
        clampedIdeal,
        minF,
        zoneW - (txt.padding || 0) * 2,
        budgetH,
        Math.min(1.4, txt.lineHeight || 1.2),
        txt.letterSpacing || 0
      );
      txt.fontSize = fitted.fontSize;
      txt.lineHeight = Math.min(1.35, txt.lineHeight || 1.2);
      txt.textAlign = align;
      txt.verticalAlign = 'middle';
      if (txt.columns > 1 && zoneW < 520) txt.columns = 1;
      txt.width = zoneW;
      txt.height = fitted.neededHeight;
      return { el: txt, h: fitted.neededHeight };
    }

    if (item.kind === 'cta' && el.type === 'shape') {
      const shp = el as ShapeElement;
      const origFont = shp.labelFontSize || 15;
      const targetFont = Math.max(10, Math.min(22, Math.round(origFont * Math.max(0.55, Math.min(1.15, baseScale)))));
      const pillH = Math.max(28, Math.min(58, Math.round(targetFont * 2.55)));
      const textLen = (shp.label || 'ACTION').length;
      const pillW = Math.min(zoneW, Math.max(110, Math.round(textLen * targetFont * 0.68 + 38)));

      shp.labelFontSize = targetFont;
      shp.width = pillW;
      shp.height = Math.min(budgetH, pillH);
      shp.cornerRadius = Math.min(Math.round(shp.height / 2), shp.cornerRadius ?? 20);
      return { el: shp, h: shp.height };
    }

    // Accent or misc block
    el.width = zoneW;
    el.height = Math.min(budgetH, Math.max(28, Math.round(el.height * baseScale)));
    return { el, h: el.height };
  });

  // Vertically center the cohesive flex group inside zoneY..zoneY+zoneH
  const totalStackH =
    sized.reduce((sum, s) => sum + s.h, 0) + gap * Math.max(0, sized.length - 1);
  let cursorY = Math.round(zoneY + Math.max(0, (zoneH - totalStackH) / 2));

  return sized.map(({ el, h }) => {
    const out = { ...el };
    out.y = cursorY;
    out.x =
      align === 'center' ? Math.round(zoneX + (zoneW - out.width) / 2) : Math.round(zoneX);
    cursorY += h + gap;
    return out;
  });
}

/**
 * Intelligent Semantic Design Composer: builds tailored multi-size layouts without
 * stretching pills/images or cramping headlines.
 */
export function composeDesignForTarget(
  elements: PublisherElement[],
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number,
  targetMargins: PageMargins,
  cloneIds = false,
  layoutStyle: CompositionStyle = 'auto'
): PublisherElement[] {
  if (srcW <= 0 || srcH <= 0 || targetW <= 0 || targetH <= 0) return elements;

  const idMap = new Map<string, string>();
  const groupMap = new Map<string, string>();

  const working: PublisherElement[] = elements.map((el) => {
    const cloned: PublisherElement = JSON.parse(JSON.stringify(el));
    if (!cloneIds) return cloned;
    const newId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    idMap.set(el.id, newId);
    cloned.id = newId;
    if (el.groupId) {
      if (!groupMap.has(el.groupId)) {
        groupMap.set(el.groupId, `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
      }
      cloned.groupId = groupMap.get(el.groupId);
    }
    return cloned;
  });

  const scaleX = targetW / srcW;
  const scaleY = targetH / srcH;
  const uniformScale = Math.min(scaleX, scaleY);
  const srcRatio = srcW / srcH;
  const targetRatio = targetW / targetH;
  const safeW = Math.max(80, targetW - targetMargins.left - targetMargins.right);
  const safeH = Math.max(80, targetH - targetMargins.top - targetMargins.bottom);

  const roles = classifyElements(working, srcW, srcH);

  // If this artboard is a connected diagram/flowchart, keep proportional topology cleanly so arrows remain sensible
  if (roles.connectors.length > 0) {
    const fgAndBg = working.filter((el) => el.type !== 'connector').map((el) => {
      const next = { ...el };
      if (next.type === 'shape' && (next.width >= srcW * 0.76 || next.height >= srcH * 0.76)) {
        next.x = Math.round(next.x * scaleX);
        next.y = Math.round(next.y * scaleY);
        next.width = Math.round(next.width * scaleX);
        next.height = Math.round(next.height * scaleY);
      } else {
        const relCx = (el.x + el.width / 2) / srcW;
        const relCy = (el.y + el.height / 2) / srcH;
        next.width = Math.max(24, Math.round(el.width * uniformScale));
        next.height = Math.max(20, Math.round(el.height * uniformScale));
        next.x = Math.max(targetMargins.left, Math.min(targetW - targetMargins.right - next.width, Math.round(relCx * targetW - next.width / 2)));
        next.y = Math.max(targetMargins.top, Math.min(targetH - targetMargins.bottom - next.height, Math.round(relCy * targetH - next.height / 2)));
        if (next.type === 'text') next.fontSize = Math.max(9, Math.round(next.fontSize * uniformScale));
        if (next.type === 'shape' && next.labelFontSize) next.labelFontSize = Math.max(9, Math.round(next.labelFontSize * uniformScale));
      }
      return next;
    });
    const conns = roles.connectors.map((c) => ({
      ...c,
      fromId: cloneIds ? idMap.get(c.fromId) || c.fromId : c.fromId,
      toId: cloneIds ? idMap.get(c.toId) || c.toId : c.toId,
    }));
    return [...fgAndBg, ...conns];
  }

  // 1. Scale Full Backgrounds
  const outBackgrounds = roles.backgrounds.map((bg) => ({
    ...bg,
    x: 0,
    y: 0,
    width: targetW,
    height: targetH,
    ...(bg.type === 'image' ? { objectFit: 'cover' as const } : {}),
  }));

  // Choose composition archetype
  const isMicroCard = targetW <= 600 && targetH <= 420;
  const isUltraWide = !isMicroCard && targetRatio >= 2.0;
  const isTallStory = targetRatio <= 0.65 && (srcRatio > 0.82 || layoutStyle !== 'auto');
  const ratioDelta = Math.max(targetRatio / srcRatio, srcRatio / targetRatio);

  // 2. Transform Edge Bands appropriately for the target archetype
  const outEdgeBands = roles.edgeBands.map((band) => {
    const next = { ...band };
    const wasTopOrBottom = band.width >= srcW * 0.76;
    if (isUltraWide && wasTopOrBottom) {
      // Convert horizontal wavy/header bands cleanly into a right-side accent panel on ultra-wide banners!
      next.x = Math.round(targetW * 0.56);
      next.y = 0;
      next.width = Math.round(targetW * 0.44);
      next.height = targetH;
      if (next.type === 'shape' && next.waveEdge && next.waveEdge !== 'none') {
        next.waveEdge = 'left';
        next.waveAmplitude = Math.max(12, Math.min(34, Math.round((next.waveAmplitude || 24) * 0.85)));
      }
    } else if (wasTopOrBottom) {
      next.x = 0;
      next.width = targetW;
      next.height = Math.max(28, Math.min(Math.round(targetH * 0.42), Math.round(band.height * scaleY)));
      next.y = band.y + band.height >= srcH * 0.9 ? targetH - next.height : 0;
      if (next.type === 'shape' && next.waveAmplitude) {
        next.waveAmplitude = Math.max(10, Math.round(next.waveAmplitude * uniformScale));
      }
    } else {
      next.y = 0;
      next.height = targetH;
      next.width = Math.max(12, Math.min(Math.round(targetW * 0.45), Math.round(band.width * scaleX)));
      next.x = band.x + band.width >= srcW * 0.9 ? targetW - next.width : 0;
    }
    return next;
  });

  // Preserve proportional layout ONLY when user selected 'auto', aspect is close (delta <= 1.38), and not micro
  if (layoutStyle === 'auto' && ratioDelta <= 1.38 && !isMicroCard) {
    const proportionalFg = [
      ...(roles.kicker ? [roles.kicker] : []),
      ...(roles.heroTitle ? [roles.heroTitle] : []),
      ...roles.subtitles,
      ...roles.ctaPills,
      ...roles.visuals,
      ...roles.cornerBadges,
      ...roles.brandMarks,
    ].map((el) => {
      const next = { ...el };
      const relCx = (el.x + el.width / 2) / srcW;
      const relCy = (el.y + el.height / 2) / srcH;

      let nextW: number;
      let nextH: number;
      if (shouldPreserveAspect(el) || roles.ctaPills.some((c) => c.id === el.id)) {
        nextW = Math.max(24, Math.round(el.width * uniformScale));
        nextH = Math.max(24, Math.round(el.height * uniformScale));
      } else {
        nextW = Math.max(30, Math.min(safeW, Math.round(el.width * scaleX)));
        nextH = Math.max(24, Math.min(safeH, Math.round(el.height * scaleY)));
      }

      next.width = nextW;
      next.height = nextH;
      next.x = Math.max(
        targetMargins.left,
        Math.min(targetW - targetMargins.right - nextW, Math.round(relCx * targetW - nextW / 2))
      );
      next.y = Math.max(
        targetMargins.top,
        Math.min(targetH - targetMargins.bottom - nextH, Math.round(relCy * targetH - nextH / 2))
      );

      if (next.type === 'text') {
        const txt = next as TextElement;
        const fitted = fitTextToBox(
          txt.text,
          txt.fontFamily,
          txt.fontWeight,
          Math.max(10, Math.round(txt.fontSize * Math.min(1.45, Math.max(0.5, uniformScale)))),
          9,
          txt.width - (txt.padding || 0) * 2,
          txt.height,
          txt.lineHeight,
          txt.letterSpacing || 0
        );
        txt.fontSize = fitted.fontSize;
      } else if (next.type === 'shape' && next.labelFontSize) {
        next.labelFontSize = Math.max(10, Math.round(next.labelFontSize * uniformScale));
      }
      return next;
    });

    return [...outBackgrounds, ...outEdgeBands, ...proportionalFg];
  }

  // 3. Semantic Archetype Composition (No Cramping, No Stretched Pills!)
  const align: 'left' | 'center' =
    layoutStyle === 'centered' || (layoutStyle === 'auto' && isTallStory) ? 'center' : 'left';

  if (isMicroCard) {
    // Micro Card Blueprint (Priority-Trimmed: Kicker + HeroTitle + 1 Concise Sub/CTA + 1 Brand Mark)
    const cardScale = Math.max(0.42, Math.min(0.85, targetH / 620));
    const hasRightMark = roles.brandMarks.length > 0 || roles.visuals.length > 0;
    const leftW = hasRightMark ? Math.round(safeW * 0.64) : safeW;

    const stackItems: { kind: 'kicker' | 'hero' | 'sub' | 'cta'; el: PublisherElement }[] = [];
    if (roles.kicker) stackItems.push({ kind: 'kicker', el: roles.kicker });
    if (roles.heroTitle) stackItems.push({ kind: 'hero', el: roles.heroTitle });
    if (roles.ctaPills[0]) {
      stackItems.push({ kind: 'cta', el: roles.ctaPills[0] });
    } else if (roles.subtitles[0]) {
      stackItems.push({ kind: 'sub', el: roles.subtitles[0] });
    }

    const laidOutLeft = layoutWeightedStack(
      stackItems,
      targetMargins.left,
      targetMargins.top,
      leftW,
      safeH,
      'left',
      cardScale
    );

    const outRight: PublisherElement[] = [];
    const rightEl = roles.brandMarks[0] || roles.visuals[0];
    if (rightEl) {
      const mark = { ...rightEl };
      const size = Math.min(Math.round(safeW * 0.28), Math.round(safeH * 0.72));
      mark.width = size;
      mark.height = size;
      mark.x = targetW - targetMargins.right - size;
      mark.y = Math.round(targetMargins.top + (safeH - size) / 2);
      outRight.push(mark);
    }

    return [...outBackgrounds, ...outEdgeBands, ...laidOutLeft, ...outRight];
  }

  if (isUltraWide) {
    // Ultra-Wide Banner Blueprint (Weighted Left Flex Stack + Right Showcase Zone)
    const bannerScale = Math.max(0.5, Math.min(1.1, targetH / 760));
    const rightZoneItems = [...roles.visuals.slice(0, 2), ...roles.brandMarks.slice(0, 1)];
    const hasRightZone = rightZoneItems.length > 0;
    const leftW = hasRightZone ? Math.round(safeW * 0.56) : safeW;

    const leftStack: { kind: 'kicker' | 'hero' | 'sub' | 'cta' | 'accent'; el: PublisherElement }[] = [];
    if (roles.kicker) leftStack.push({ kind: 'kicker', el: roles.kicker });
    if (roles.heroTitle) leftStack.push({ kind: 'hero', el: roles.heroTitle });
    if (roles.subtitles[0]) {
      leftStack.push({
        kind: roles.subtitles[0].type === 'accent' ? 'accent' : 'sub',
        el: roles.subtitles[0],
      });
    }
    if (roles.ctaPills[0]) leftStack.push({ kind: 'cta', el: roles.ctaPills[0] });

    const laidOutLeft = layoutWeightedStack(
      leftStack,
      targetMargins.left,
      targetMargins.top,
      leftW,
      safeH,
      layoutStyle === 'centered' && !hasRightZone ? 'center' : 'left',
      bannerScale
    );

    // Right Zone: arrange visual cards / QR cleanly without stretching
    const outRight: PublisherElement[] = [];
    if (hasRightZone) {
      const rX = targetMargins.left + leftW + Math.round(safeW * 0.05);
      const rW = Math.max(100, targetW - targetMargins.right - rX);
      const colW =
        rightZoneItems.length > 1
          ? Math.floor((rW - 14 * (rightZoneItems.length - 1)) / rightZoneItems.length)
          : rW;

      rightZoneItems.forEach((item, idx) => {
        const next = { ...item };
        const aspect = item.width / Math.max(1, item.height);
        if (shouldPreserveAspect(next) || next.type === 'shape') {
          let fitH = Math.min(safeH * 0.84, colW / Math.max(0.5, aspect));
          let fitW = fitH * aspect;
          if (fitW > colW) {
            fitW = colW;
            fitH = fitW / Math.max(0.5, aspect);
          }
          next.width = Math.max(40, Math.round(fitW));
          next.height = Math.max(40, Math.round(fitH));
        } else {
          next.width = Math.max(60, colW);
          next.height = Math.round(safeH * 0.8);
        }
        next.x = Math.round(rX + idx * (colW + 14) + (colW - next.width) / 2);
        next.y = Math.round(targetMargins.top + (safeH - next.height) / 2);
        if (next.type === 'shape' && next.labelFontSize) {
          next.labelFontSize = Math.max(11, Math.round(next.labelFontSize * bannerScale));
        }
        outRight.push(next);
      });
    }

    // Place 1 corner badge cleanly at top-right if space permits
    const outBadges: PublisherElement[] = [];
    if (roles.cornerBadges[0]) {
      const b = { ...roles.cornerBadges[0] };
      const size = Math.max(48, Math.min(110, Math.round(targetH * 0.28)));
      b.width = size;
      b.height = size;
      b.x = targetW - targetMargins.right - size;
      b.y = targetMargins.top;
      if (b.labelFontSize) b.labelFontSize = Math.max(10, Math.round(size * 0.14));
      outBadges.push(b);
    }

    return [...outBackgrounds, ...outEdgeBands, ...laidOutLeft, ...outRight, ...outBadges];
  }

  // Default Balanced / Tall Vertical Blueprint (Stories, Square Posts, Editorial Posters)
  const verticalPadTop = isTallStory ? Math.max(targetMargins.top, Math.round(targetH * 0.06)) : targetMargins.top;
  const verticalPadBottom = isTallStory ? Math.max(targetMargins.bottom, Math.round(targetH * 0.06)) : targetMargins.bottom;
  const usableH = Math.max(120, targetH - verticalPadTop - verticalPadBottom);
  const stackScale = Math.max(0.65, Math.min(1.25, safeW / 720));

  const topItems: { kind: 'kicker' | 'hero' | 'sub' | 'accent'; el: PublisherElement }[] = [];
  if (roles.kicker) topItems.push({ kind: 'kicker', el: roles.kicker });
  if (roles.heroTitle) topItems.push({ kind: 'hero', el: roles.heroTitle });
  if (roles.subtitles[0]) {
    topItems.push({
      kind: roles.subtitles[0].type === 'accent' ? 'accent' : 'sub',
      el: roles.subtitles[0],
    });
  }

  const bottomItems: { kind: 'sub' | 'cta' | 'accent'; el: PublisherElement }[] = [];
  if (roles.subtitles[1]) {
    bottomItems.push({
      kind: roles.subtitles[1].type === 'accent' ? 'accent' : 'sub',
      el: roles.subtitles[1],
    });
  }
  roles.ctaPills.slice(0, 1).forEach((cta) => bottomItems.push({ kind: 'cta', el: cta }));

  const hasMiddleVisuals = roles.visuals.length > 0 || roles.brandMarks.length > 0;
  const topFrac = hasMiddleVisuals ? 0.4 : 0.72;
  const midFrac = hasMiddleVisuals ? (bottomItems.length > 0 ? 0.38 : 0.56) : 0;
  const botFrac = bottomItems.length > 0 ? 1 - topFrac - midFrac : 0;

  const topH = Math.round(usableH * topFrac);
  const midH = Math.round(usableH * midFrac);
  const botH = Math.max(60, usableH - topH - midH);

  const outTop = layoutWeightedStack(
    topItems,
    targetMargins.left,
    verticalPadTop,
    safeW,
    topH,
    align,
    stackScale
  );

  const outMid: PublisherElement[] = [];
  const midItems = [...roles.visuals.slice(0, 2), ...roles.brandMarks.slice(0, 1)];
  if (hasMiddleVisuals && midItems.length > 0) {
    const midY = verticalPadTop + topH + 12;
    const cols = midItems.length;
    const cellW = Math.floor((safeW - 16 * (cols - 1)) / cols);
    midItems.forEach((item, idx) => {
      const next = { ...item };
      const aspect = item.width / Math.max(1, item.height);
      if (shouldPreserveAspect(next)) {
        const fitH = Math.min(midH - 16, Math.round(cellW / Math.max(0.5, aspect)));
        const fitW = Math.round(fitH * aspect);
        next.width = Math.max(40, fitW);
        next.height = Math.max(40, fitH);
      } else {
        next.width = cellW;
        next.height = Math.min(midH - 16, Math.max(60, Math.round(cellW / Math.max(0.8, aspect))));
      }
      next.x = Math.round(targetMargins.left + idx * (cellW + 16) + (cellW - next.width) / 2);
      next.y = Math.round(midY + (midH - next.height) / 2);
      if (next.type === 'shape' && next.labelFontSize) {
        next.labelFontSize = Math.max(12, Math.round(next.labelFontSize * stackScale));
      }
      outMid.push(next);
    });
  }

  const outBot =
    bottomItems.length > 0
      ? layoutWeightedStack(
          bottomItems,
          targetMargins.left,
          verticalPadTop + topH + midH,
          safeW,
          botH,
          align,
          stackScale
        )
      : [];

  const outBadges: PublisherElement[] = [];
  if (roles.cornerBadges[0]) {
    const b = { ...roles.cornerBadges[0] };
    const size = Math.max(56, Math.min(130, Math.round(Math.min(targetW, targetH) * 0.16)));
    b.width = size;
    b.height = size;
    b.x = targetW - targetMargins.right - size;
    b.y = verticalPadTop;
    if (b.labelFontSize) b.labelFontSize = Math.max(11, Math.round(size * 0.13));
    outBadges.push(b);
  }

  return [...outBackgrounds, ...outEdgeBands, ...outTop, ...outMid, ...outBot, ...outBadges];
}
