import { PageMargins, PublisherElement } from '../types/publisher';
import { CompositionStyle, composeDesignForTarget } from './designBlueprints';

/**
 * Intelligently converts and composes elements from a source artboard onto a target size,
 * preserving aspect ratios on visuals/pills and fitting text cleanly to prevent clipping or cramping.
 */
export function reflowElementsForSize(
  elements: PublisherElement[],
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number,
  targetMargins: PageMargins,
  cloneIds = false,
  layoutStyle: CompositionStyle = 'auto'
): PublisherElement[] {
  return composeDesignForTarget(
    elements,
    srcW,
    srcH,
    targetW,
    targetH,
    targetMargins,
    cloneIds,
    layoutStyle
  );
}
