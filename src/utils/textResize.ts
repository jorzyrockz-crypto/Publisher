import type { TextElement } from '../types/publisher';
import { layoutText } from './textLayout';

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
  // box, so vertical centring and fixed layouts survive.
  if (handle === '' || handle === 'e' || handle === 'w') {
    const measured = layoutText({ ...el, width, height: 100000, autoFit: 'none' });
    const needed = Math.ceil(measured.contentHeight + measured.padding * 2);
    return { x, y, width, height: Math.max(height, needed), autoFit: 'shrink' };
  }

  return { x, y, width, height, autoFit: 'shrink' };
}
