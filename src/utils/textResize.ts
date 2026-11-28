import type { TextElement } from '../types/publisher';
import { textBoxContentHeight } from './textBoxGrowth';

/** Drag context handed over by the selection box (structurally typed). */
export interface TextResizeMeta {
  handle: string;
  startWidth: number;
  startHeight: number;
  startFontSize?: number;
}

/**
 * Text boxes behave like type, not like picture frames. Resizing one should
 * never leave the words clipped:
 *
 * - corner handles scale the *type* with the box (Canva behaviour), so the
 *   block keeps its proportions at any size;
 * - side handles change the measure, so the text rewraps and the frame grows
 *   downwards if the new measure needs more lines;
 * - either way the box ends up in "shrink to fit", so later typing can't
 *   overflow it either.
 *
 * `autoSizeText === false` opts an element back into plain frame resizing.
 */
export function resizeTextBox(
  el: TextElement,
  box: { x: number; y: number; width: number; height: number },
  meta?: TextResizeMeta
): Partial<TextElement> {
  const { x, y, width, height } = box;
  if (el.autoSizeText === false) return { x, y, width, height };

  const handle = meta?.handle ?? '';
  const isCorner = handle.length === 2;

  if (isCorner && meta && meta.startWidth > 0 && meta.startHeight > 0) {
    const scale = Math.min(width / meta.startWidth, height / meta.startHeight);
    const startSize = meta.startFontSize ?? el.fontSize;
    const fontSize = Math.min(400, Math.max(6, Math.round(startSize * scale * 10) / 10));
    return { x, y, width, height, fontSize, autoFit: 'shrink' };
  }

  // Side handles change the measure only: rewrap, then let the frame grow if
  // the new measure needs more lines. It never collapses a deliberately tall
  // box, so vertical centring and fixed layouts survive. The height is the same
  // one `utils/textBoxGrowth` uses, so dragging a handle and typing into the box
  // cannot disagree about how tall the words are.
  if (handle === '' || handle === 'e' || handle === 'w') {
    // Height is handed over as a large number so the *measure* decides the wrap; only the
    // width is being dragged.
    const needed = textBoxContentHeight({ ...el, width, height: 100000 });
    return { x, y, width, height: Math.max(height, needed), autoFit: 'shrink' };
  }

  return { x, y, width, height, autoFit: 'shrink' };
}
