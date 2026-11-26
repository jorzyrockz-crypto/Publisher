import {
  ConnectorElement,
  PageMargins,
  PublisherElement,
  ShapeElement,
  TextElement,
} from '../types/publisher';

/**
 * Checks whether an element acts as a full-bleed background, header banner, or footer bar.
 */
function isBackgroundOrEdgeBand(
  el: PublisherElement,
  srcW: number,
  srcH: number
): boolean {
  if (el.type === 'connector') return false;
  const coversWidth = el.width >= srcW * 0.78;
  const coversHeight = el.height >= srcH * 0.78;
  return (el.type === 'shape' || el.type === 'image') && (coversWidth || coversHeight);
}

/**
 * Checks if an element should preserve a 1:1 / original aspect ratio (circles, QRs, badges, logos).
 */
function shouldPreserveAspect(el: PublisherElement): boolean {
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
 * Intelligently reflows and scales elements from a source page (srcW × srcH)
 * onto a target artboard (targetW × targetH) without breaking shapes, QR codes, or readability.
 */
export function reflowElementsForSize(
  elements: PublisherElement[],
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number,
  targetMargins: PageMargins,
  cloneIds = false
): PublisherElement[] {
  if (srcW <= 0 || srcH <= 0 || targetW <= 0 || targetH <= 0) return elements;

  const scaleX = targetW / srcW;
  const scaleY = targetH / srcH;
  const uniformScale = Math.min(scaleX, scaleY);
  const srcRatio = srcW / srcH;
  const targetRatio = targetW / targetH;

  // Map IDs & groupIds when cloning onto new artboards
  const idMap = new Map<string, string>();
  const groupMap = new Map<string, string>();

  const mapElementIdentity = (el: PublisherElement): PublisherElement => {
    const cloned: PublisherElement = JSON.parse(JSON.stringify(el));
    if (!cloneIds) return cloned;

    const newId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    idMap.set(el.id, newId);
    cloned.id = newId;

    if (el.groupId) {
      if (!groupMap.has(el.groupId)) {
        groupMap.set(
          el.groupId,
          `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        );
      }
      cloned.groupId = groupMap.get(el.groupId);
    }
    return cloned;
  };

  const working = elements.map(mapElementIdentity);
  const safeW = Math.max(80, targetW - targetMargins.left - targetMargins.right);
  const safeH = Math.max(80, targetH - targetMargins.top - targetMargins.bottom);

  const isUltraWideSwitch = targetRatio >= 2.1 && srcRatio < 1.8;
  const isTallVerticalSwitch = targetRatio <= 0.65 && srcRatio > 0.85;

  const backgrounds: PublisherElement[] = [];
  const foregrounds: PublisherElement[] = [];
  const connectors: ConnectorElement[] = [];

  working.forEach((el) => {
    if (el.type === 'connector') {
      connectors.push(el);
    } else if (isBackgroundOrEdgeBand(el, srcW, srcH)) {
      backgrounds.push(el);
    } else {
      foregrounds.push(el);
    }
  });

  // 1. Transform Background / Full-Bleed / Edge Bands cleanly
  const transformedBackgrounds = backgrounds.map((el) => {
    const coversWidth = el.width >= srcW * 0.78;
    const coversHeight = el.height >= srcH * 0.78;
    const next = { ...el };

    if (coversWidth && coversHeight) {
      next.x = 0;
      next.y = 0;
      next.width = targetW;
      next.height = targetH;
    } else if (coversWidth) {
      next.x = 0;
      next.width = targetW;
      next.y = Math.round(el.y * scaleY);
      next.height = Math.max(24, Math.round(el.height * scaleY));
      // Keep bottom bars pinned to bottom
      if (el.y + el.height >= srcH * 0.92) {
        next.y = Math.max(0, targetH - next.height);
      }
    } else if (coversHeight) {
      next.y = 0;
      next.height = targetH;
      next.x = Math.round(el.x * scaleX);
      next.width = Math.max(24, Math.round(el.width * scaleX));
      if (el.x + el.width >= srcW * 0.92) {
        next.x = Math.max(0, targetW - next.width);
      }
    }

    if (next.type === 'shape' && next.waveAmplitude) {
      next.waveAmplitude = Math.max(8, Math.round(next.waveAmplitude * uniformScale));
    }
    return next;
  });

  // 2. Transform Foreground Content based on Target Aspect Regime
  let transformedForegrounds: PublisherElement[];

  if (isUltraWideSwitch && foregrounds.length > 0) {
    // 2-Zone Horizontal Split (Zone 1 Left: Text/Headlines/CTAs | Zone 2 Right: Visuals/Cards/QR)
    const primaryTexts: PublisherElement[] = [];
    const visualsAndSecondary: PublisherElement[] = [];

    foregrounds.forEach((el) => {
      if (el.type === 'text' || el.type === 'accent') {
        primaryTexts.push(el);
      } else {
        visualsAndSecondary.push(el);
      }
    });

    // If all elements are visuals or all text, split evenly by y/importance
    if (primaryTexts.length === 0) {
      const mid = Math.ceil(foregrounds.length / 2);
      primaryTexts.push(...foregrounds.slice(0, mid));
      visualsAndSecondary.splice(0, visualsAndSecondary.length, ...foregrounds.slice(mid));
    } else if (visualsAndSecondary.length === 0 && primaryTexts.length > 2) {
      const cut = Math.ceil(primaryTexts.length * 0.6);
      visualsAndSecondary.push(...primaryTexts.slice(cut));
      primaryTexts.splice(cut);
    }

    const leftZoneW = visualsAndSecondary.length > 0 ? Math.round(safeW * 0.56) : safeW;
    const rightZoneX = targetMargins.left + leftZoneW + Math.round(safeW * 0.04);
    const rightZoneW = Math.max(80, safeW - leftZoneW - Math.round(safeW * 0.04));

    const fontScale = Math.min(1, Math.max(0.42, (targetH / srcH) * 1.15));

    const layoutColumn = (
      items: PublisherElement[],
      zoneX: number,
      zoneW: number
    ): PublisherElement[] => {
      if (items.length === 0) return [];
      const rowGap = Math.max(6, Math.round(safeH * 0.04));
      const rowH = Math.max(
        26,
        Math.floor((safeH - rowGap * Math.max(0, items.length - 1)) / items.length)
      );

      return items.map((el, idx) => {
        const next = { ...el };
        if (next.type === 'text') {
          const txt = next as TextElement;
          txt.fontSize = Math.max(10, Math.round(txt.fontSize * fontScale));
          txt.lineHeight = Math.min(1.35, txt.lineHeight || 1.2);
          if (txt.textAlign === 'center' && visualsAndSecondary.length > 0) {
            txt.textAlign = 'left';
          }
        }
        if (shouldPreserveAspect(next)) {
          const aspect = el.width / Math.max(1, el.height);
          const fitH = Math.min(rowH, Math.round(zoneW / aspect));
          const fitW = Math.round(fitH * aspect);
          next.width = Math.max(24, fitW);
          next.height = Math.max(24, fitH);
          next.x = Math.round(zoneX + (zoneW - next.width) / 2);
          next.y = Math.round(targetMargins.top + idx * (rowH + rowGap) + (rowH - next.height) / 2);
        } else {
          next.x = zoneX;
          next.y = Math.round(targetMargins.top + idx * (rowH + rowGap));
          next.width = zoneW;
          next.height = rowH;
          if (next.type === 'shape' && next.labelFontSize) {
            next.labelFontSize = Math.max(10, Math.round(next.labelFontSize * fontScale));
          }
        }
        return next;
      });
    };

    transformedForegrounds = [
      ...layoutColumn(primaryTexts, targetMargins.left, leftZoneW),
      ...layoutColumn(visualsAndSecondary, rightZoneX, rightZoneW),
    ];
  } else if (isTallVerticalSwitch && foregrounds.length > 0) {
    // Tall Story Vertical Stack (Sorted top-to-bottom / left-to-right)
    const sorted = [...foregrounds].sort((a, b) =>
      Math.abs(a.y - b.y) > 30 ? a.y - b.y : a.x - b.x
    );
    const gapY = Math.max(12, Math.round(safeH * 0.025));
    const slotH = Math.max(
      40,
      Math.floor((safeH - gapY * Math.max(0, sorted.length - 1)) / sorted.length)
    );
    const fontScale = Math.min(1.4, Math.max(0.7, scaleX * 0.95));

    transformedForegrounds = sorted.map((el, idx) => {
      const next = { ...el };
      if (shouldPreserveAspect(next)) {
        const aspect = el.width / Math.max(1, el.height);
        const h = Math.min(slotH, Math.round((safeW * 0.85) / aspect));
        const w = Math.round(h * aspect);
        next.width = Math.max(32, w);
        next.height = Math.max(32, h);
        next.x = Math.round(targetMargins.left + (safeW - next.width) / 2);
        next.y = Math.round(targetMargins.top + idx * (slotH + gapY) + (slotH - next.height) / 2);
      } else {
        next.x = targetMargins.left;
        next.width = safeW;
        next.height = slotH;
        next.y = Math.round(targetMargins.top + idx * (slotH + gapY));
      }

      if (next.type === 'text') {
        const txt = next as TextElement;
        txt.fontSize = Math.max(12, Math.round(txt.fontSize * fontScale));
        txt.textAlign = 'center';
      } else if (next.type === 'shape' && next.labelFontSize) {
        next.labelFontSize = Math.max(12, Math.round(next.labelFontSize * fontScale));
      }
      return next;
    });
  } else {
    // Proportional Smart Anchor Scaling
    transformedForegrounds = foregrounds.map((el) => {
      const next = { ...el };
      const relCx = (el.x + el.width / 2) / srcW;
      const relCy = (el.y + el.height / 2) / srcH;

      let nextW: number;
      let nextH: number;

      if (shouldPreserveAspect(el)) {
        nextW = Math.max(20, Math.round(el.width * uniformScale));
        nextH = Math.max(20, Math.round(el.height * uniformScale));
      } else {
        nextW = Math.max(24, Math.min(safeW, Math.round(el.width * scaleX)));
        nextH = Math.max(20, Math.min(safeH, Math.round(el.height * scaleY)));
      }

      let nextX = Math.round(relCx * targetW - nextW / 2);
      let nextY = Math.round(relCy * targetH - nextH / 2);

      // Clamp cleanly inside target artboard bounds
      nextX = Math.max(
        Math.min(targetMargins.left, targetW - nextW),
        Math.min(targetW - targetMargins.right - nextW, nextX)
      );
      nextY = Math.max(
        Math.min(targetMargins.top, targetH - nextH),
        Math.min(targetH - targetMargins.bottom - nextH, nextY)
      );

      next.x = Math.max(0, nextX);
      next.y = Math.max(0, nextY);
      next.width = nextW;
      next.height = nextH;

      if (next.type === 'text') {
        const txt = next as TextElement;
        const textScale = Math.min(1.5, Math.max(0.45, uniformScale));
        txt.fontSize = Math.max(9, Math.round(txt.fontSize * textScale));
        if (txt.padding) {
          txt.padding = Math.max(2, Math.round(txt.padding * uniformScale));
        }
        if (txt.columns > 1 && targetW < 520) {
          txt.columns = 1;
        }
      } else if (next.type === 'shape') {
        const shp = next as ShapeElement;
        if (shp.labelFontSize) {
          shp.labelFontSize = Math.max(9, Math.round(shp.labelFontSize * uniformScale));
        }
        if (shp.cornerRadius) {
          shp.cornerRadius = Math.max(2, Math.round(shp.cornerRadius * uniformScale));
        }
      }

      return next;
    });
  }

  // 3. Remap ConnectorElement endpoints if cloned onto a new artboard
  const transformedConnectors = connectors.map((conn) => ({
    ...conn,
    fromId: cloneIds ? idMap.get(conn.fromId) || conn.fromId : conn.fromId,
    toId: cloneIds ? idMap.get(conn.toId) || conn.toId : conn.toId,
    strokeWidth: Math.max(1.5, Math.round((conn.strokeWidth || 2.5) * Math.min(1.2, uniformScale))),
  }));

  return [
    ...transformedBackgrounds,
    ...transformedForegrounds,
    ...transformedConnectors,
  ];
}
