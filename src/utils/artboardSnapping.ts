/**
 * Snapping for **papers**, not for what is printed on them.
 *
 * On the artboard a page is a sheet lying on a pasteboard, and teachers line sheets up by eye —
 * edge to edge, or centred under one another. Elements have snapped for a while (`calculateSnap`);
 * papers never did, so every alignment was done by hand and a row of four looked like a row of
 * four-ish.
 *
 * The pull is measured in **screen** pixels by the caller (`8 / zoom`), so it feels the same at 20%
 * as at 200% — the same reason the element threshold is scaled.
 */

export interface PaperRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PaperSnap {
  x: number;
  y: number;
  /** Artboard x to draw a guide down, when the paper snapped sideways. */
  guideX?: number;
  /** Artboard y to draw a guide across, when the paper snapped up or down. */
  guideY?: number;
}

/** Edge guesses for one axis: the three ways a rectangle can meet a line. */
interface Best {
  delta: number;
  position: number;
  guide: number;
}

const better = (best: Best | null, delta: number, position: number, guide: number): Best | null =>
  Math.abs(delta) < Math.abs(best?.delta ?? Infinity) ? { delta, position, guide } : best;

/**
 * @param proposed where the drag has put the paper, in artboard pixels
 * @param others   every other paper on the artboard
 * @param threshold pull radius in artboard pixels (`8 / zoom` at the call site)
 */
export function snapPaperPosition(
  proposed: PaperRect,
  others: PaperRect[],
  threshold: number
): PaperSnap {
  const targetsX: number[] = [0];
  const targetsY: number[] = [0];
  for (const other of others) {
    targetsX.push(other.x, other.x + other.width / 2, other.x + other.width);
    targetsY.push(other.y, other.y + other.height / 2, other.y + other.height);
  }

  const spansX = [0, proposed.width / 2, proposed.width];
  const spansY = [0, proposed.height / 2, proposed.height];

  let bestX: Best | null = null;
  let bestY: Best | null = null;

  for (const target of targetsX) {
    for (const span of spansX) {
      const delta = target - (proposed.x + span);
      if (Math.abs(delta) <= threshold) bestX = better(bestX, delta, proposed.x + delta, target);
    }
  }
  for (const target of targetsY) {
    for (const span of spansY) {
      const delta = target - (proposed.y + span);
      if (Math.abs(delta) <= threshold) bestY = better(bestY, delta, proposed.y + delta, target);
    }
  }

  return {
    x: Math.round(bestX ? bestX.position : proposed.x),
    y: Math.round(bestY ? bestY.position : proposed.y),
    guideX: bestX ? bestX.guide : undefined,
    guideY: bestY ? bestY.guide : undefined,
  };
}
