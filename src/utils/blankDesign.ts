import { DocumentProject, Page } from '../types/publisher';
import { PrintSettings, computeTarpapelMetrics } from './printUtils';

/**
 * Blank documents for the Home screen's "Create a Design" popover and its quick-start chips.
 *
 * Before this, the only way to start from nothing was File ▸ New, and every new document was the
 * Letter blank regardless of what the user was about to make. The formats here are the ones people
 * actually open the app for: an A4 poster (the default school print), a 3 × 2 tarpapel, a wide
 * banner, and a size you type yourself.
 */

export interface BlankDesignSpec {
  name: string;
  width: number;
  height: number;
  pageSizeName: string;
  /** Margins in px; derived from the sheet when omitted. */
  margin?: number;
}

/** A poster is read from across a room, so its safe area is proportionally wider than a letter's. */
function defaultMargin(width: number, height: number): number {
  return Math.max(40, Math.round(Math.min(width, height) * 0.055));
}

/**
 * A one-page document with nothing on it.
 *
 * Deliberately not built by cloning a template: a clone drags in whichever page size, colour
 * scheme and background that template happened to have, and the first thing a blank page does is
 * quietly stop being blank.
 */
export function buildBlankProject(spec: BlankDesignSpec): DocumentProject {
  const margin = spec.margin ?? defaultMargin(spec.width, spec.height);
  const page: Page = {
    id: 'page-1',
    name: 'Page 1',
    width: spec.width,
    height: spec.height,
    orientation: spec.width > spec.height ? 'landscape' : 'portrait',
    backgroundColor: '#ffffff',
    margins: { top: margin, right: margin, bottom: margin, left: margin },
    guides: [],
    elements: [],
  };

  return {
    id: `proj-${Date.now()}`,
    name: spec.name,
    pageSizeName: spec.pageSizeName,
    colorScheme: 'office',
    activePageIndex: 0,
    pages: [page],
  };
}

/** A4 portrait — 210 × 297 mm at 96 dpi, the size every school printer is loaded with. */
export const A4_POSTER: BlankDesignSpec = {
  name: 'A4 Poster.pub',
  width: 794,
  height: 1123,
  pageSizeName: 'a4',
};

/** 1080 × 1080 — the square every social platform crops to. */
export const SQUARE_POST: BlankDesignSpec = {
  name: 'Social Post.pub',
  width: 1080,
  height: 1080,
  pageSizeName: 'ig-post',
};

/** 1920 × 640, the strip above a website's fold. */
export const LANDSCAPE_BANNER: BlankDesignSpec = {
  name: 'Landscape Banner.pub',
  width: 1920,
  height: 640,
  pageSizeName: 'hero-banner',
};

/**
 * Tarpapel — one poster that prints across a grid of A4 sheets.
 *
 * The canvas takes the proportions of the assembled poster, not of one sheet, and the print
 * settings are pre-set to the same grid, so what is drawn on screen is what gets tiled. A stub
 * page is passed to the metrics because the poster's inches depend only on the sheet size, the
 * grid and the overlap — never on what is on the page.
 */
const METRICS_STUB: Page = {
  id: 'metrics-stub',
  name: 'stub',
  width: 794,
  height: 1123,
  orientation: 'portrait',
  backgroundColor: '#ffffff',
  margins: { top: 0, right: 0, bottom: 0, left: 0 },
  guides: [],
  elements: [],
};

/** 3 sheets across, 2 down, on A4 landscape — the classroom-standard tarpapel. */
export const TARPAPEL_3X2: { cols: number; rows: number; settings: Partial<PrintSettings> } = {
  cols: 3,
  rows: 2,
  settings: {
    printMode: 'tarpapel',
    paperSize: 'a4',
    sheetOrientation: 'landscape',
    tarpapelCols: 3,
    tarpapelRows: 2,
    tarpapelFitMode: 'contain',
    tarpapelShowTileGuides: true,
  },
};

/** The assembled poster's pixel size for a tarpapel grid, capped so the canvas stays workable. */
export function tarpapelPosterSize(
  base: PrintSettings,
  cols: number,
  rows: number
): { width: number; height: number } {
  const metrics = computeTarpapelMetrics(METRICS_STUB, {
    ...base,
    printMode: 'tarpapel',
    paperSize: 'a4',
    sheetOrientation: 'landscape',
    tarpapelCols: cols,
    tarpapelRows: rows,
  });
  const ratio = metrics.totalPosterWIn / Math.max(0.1, metrics.totalPosterHIn);
  const width = Math.min(3600, Math.round(metrics.totalPosterWIn * 96));
  return { width, height: Math.round(width / ratio) };
}

/**
 * A tarpapel canvas, sized to the grid it will print on.
 *
 * The margin is a whole glue-strip wide: a tarpapel is taped together from overlapping sheets, and
 * anything within a few centimetres of a seam gets cut and doubled. Keeping a blank one's safe area
 * that far in means text placed by eye at the edge is already inside the printable area.
 */
export function buildTarpapelProject(base: PrintSettings): BlankDesignSpec {
  const { width, height } = tarpapelPosterSize(base, TARPAPEL_3X2.cols, TARPAPEL_3X2.rows);
  return {
    name: 'Tarpapel 3×2.pub',
    width,
    height,
    pageSizeName: 'tarpapel-3x2',
    margin: Math.round(Math.min(width, height) * 0.07),
  };
}

/** Clamps a custom size to something the canvas can actually draw. */
export function clampCustomSize(width: number, height: number): { width: number; height: number } {
  const clamp = (value: number) =>
    Math.max(200, Math.min(4000, Math.round(Number.isFinite(value) ? value : 0)));
  return { width: clamp(width), height: clamp(height) };
}
