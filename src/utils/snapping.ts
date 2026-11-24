import { PublisherElement, Page, PageGuide } from '../types/publisher';

export interface SnapResult {
  x: number;
  y: number;
  horizontalGuide?: number; // Y position of alignment guide
  verticalGuide?: number; // X position of alignment guide
}

const SNAP_THRESHOLD = 6; // pixels

export function calculateSnap(
  currentElementId: string,
  proposedX: number,
  proposedY: number,
  width: number,
  height: number,
  page: Page,
  snapToGuides = true,
  snapToObjects = true
): SnapResult {
  let snappedX = proposedX;
  let snappedY = proposedY;
  let verticalGuide: number | undefined;
  let horizontalGuide: number | undefined;

  const currentLeft = proposedX;
  const currentCenterX = proposedX + width / 2;
  const currentRight = proposedX + width;

  const currentTop = proposedY;
  const currentCenterY = proposedY + height / 2;
  const currentBottom = proposedY + height;

  const targetXPoints: number[] = [
    0, // Page left
    page.width / 2, // Page center
    page.width, // Page right
    page.margins.left, // Left margin
    page.width - page.margins.right, // Right margin
  ];

  const targetYPoints: number[] = [
    0, // Page top
    page.height / 2, // Page center
    page.height, // Page bottom
    page.margins.top, // Top margin
    page.height - page.margins.bottom, // Bottom margin
  ];

  // Add user guide lines
  if (snapToGuides && page.guides) {
    page.guides.forEach((g) => {
      if (g.orientation === 'vertical') targetXPoints.push(g.position);
      if (g.orientation === 'horizontal') targetYPoints.push(g.position);
    });
  }

  // Add other elements' edge and center points
  if (snapToObjects && page.elements) {
    page.elements.forEach((el) => {
      if (el.id === currentElementId) return;
      targetXPoints.push(el.x, el.x + el.width / 2, el.x + el.width);
      targetYPoints.push(el.y, el.y + el.height / 2, el.y + el.height);
    });
  }

  // Snap X: check left, center, right
  let minDiffX = SNAP_THRESHOLD;
  for (const target of targetXPoints) {
    // Snap Left
    if (Math.abs(currentLeft - target) < minDiffX) {
      minDiffX = Math.abs(currentLeft - target);
      snappedX = target;
      verticalGuide = target;
    }
    // Snap Center
    else if (Math.abs(currentCenterX - target) < minDiffX) {
      minDiffX = Math.abs(currentCenterX - target);
      snappedX = target - width / 2;
      verticalGuide = target;
    }
    // Snap Right
    else if (Math.abs(currentRight - target) < minDiffX) {
      minDiffX = Math.abs(currentRight - target);
      snappedX = target - width;
      verticalGuide = target;
    }
  }

  // Snap Y: check top, center, bottom
  let minDiffY = SNAP_THRESHOLD;
  for (const target of targetYPoints) {
    // Snap Top
    if (Math.abs(currentTop - target) < minDiffY) {
      minDiffY = Math.abs(currentTop - target);
      snappedY = target;
      horizontalGuide = target;
    }
    // Snap Center
    else if (Math.abs(currentCenterY - target) < minDiffY) {
      minDiffY = Math.abs(currentCenterY - target);
      snappedY = target - height / 2;
      horizontalGuide = target;
    }
    // Snap Bottom
    else if (Math.abs(currentBottom - target) < minDiffY) {
      minDiffY = Math.abs(currentBottom - target);
      snappedY = target - height;
      horizontalGuide = target;
    }
  }

  return {
    x: Math.round(snappedX),
    y: Math.round(snappedY),
    verticalGuide,
    horizontalGuide,
  };
}
