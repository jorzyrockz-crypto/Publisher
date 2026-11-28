import { DocumentProject, Page } from '../types/publisher';
import { renderPageModelToCanvas } from './canvasRenderer';
import { expandCanvasWithBleed } from './imageExport';
import {
  PrintSettings,
  buildBookletSheets,
  resolvePaperBaseDimensions,
  sheetMarkGeometry,
  slicePageIntoTarpapelTiles,
} from './printUtils';

/**
 * jsPDF is ~350 kB of the old single-chunk bundle. Loading it on demand means
 * the editor shell boots without it and export pays the cost only when used.
 */
let jsPdfModulePromise: Promise<typeof import('jspdf')> | null = null;
function loadJsPdf() {
  if (!jsPdfModulePromise) jsPdfModulePromise = import('jspdf');
  return jsPdfModulePromise;
}

export interface PdfExportOptions {
  /** Bleed width in inches applied on all four sides (0, 0.125 or 0.25). */
  bleedIn?: number;
  /** Draw printer crop marks outside the trim box. */
  cropMarks?: boolean;
  /** Extra margin (inches) reserved for crop marks. Defaults to 0.25". */
  cropMarkMarginIn?: number;
}

/** Two short registration lines per corner, standard print-shop style. */
function drawCropMarks(
  pdf: {
    setDrawColor: (r: number, g: number, b: number) => void;
    setLineWidth: (w: number) => void;
    line: (x1: number, y1: number, x2: number, y2: number) => void;
  },
  trimX: number,
  trimY: number,
  trimW: number,
  trimH: number
) {
  const gap = 4; // pt between trim edge and mark start
  const len = 12; // pt mark length
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.4);

  const top = trimY;
  const bottom = trimY + trimH;
  const left = trimX;
  const right = trimX + trimW;

  // Horizontal marks
  pdf.line(left - gap - len, top, left - gap, top);
  pdf.line(right + gap, top, right + gap + len, top);
  pdf.line(left - gap - len, bottom, left - gap, bottom);
  pdf.line(right + gap, bottom, right + gap + len, bottom);

  // Vertical marks
  pdf.line(left, top - gap - len, left, top - gap);
  pdf.line(right, top - gap - len, right, top - gap);
  pdf.line(left, bottom + gap, left, bottom + gap + len);
  pdf.line(right, bottom + gap, right, bottom + gap + len);
}

export function resolveMasterElementsForPdf(project: DocumentProject, page: Page) {
  if (page.hideMaster || project.masterPage?.showOnAllPages === false) return [];
  if (project.masterPages && project.masterPages.length > 0) {
    const m = page.masterId
      ? project.masterPages.find((mp) => mp.id === page.masterId)
      : project.masterPages[0];
    return m?.elements || [];
  }
  return project.masterPage?.elements || [];
}

export async function exportToPdf(
  project: DocumentProject,
  options: PdfExportOptions = {}
): Promise<void> {
  if (project.pages.length === 0) return;

  const { jsPDF } = await loadJsPdf();
  const bleedIn = Math.max(0, options.bleedIn ?? 0);
  const cropMarks = Boolean(options.cropMarks);
  const markMarginIn = cropMarks ? Math.max(0.15, options.cropMarkMarginIn ?? 0.25) : 0;
  const ptPerIn = 72;
  const bleedPt = bleedIn * ptPerIn;

  const firstPage = project.pages[0];
  const orientation = firstPage.width > firstPage.height ? 'l' : 'p';
  const mediaSize = (page: Page): [number, number] => [
    (page.width + (bleedIn + markMarginIn) * 2) * ptPerIn,
    (page.height + (bleedIn + markMarginIn) * 2) * ptPerIn,
  ];

  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: mediaSize(firstPage),
  });

  for (let i = 0; i < project.pages.length; i++) {
    const page = project.pages[i];
    if (i > 0) {
      pdf.addPage(mediaSize(page), page.width > page.height ? 'l' : 'p');
    }

    const masterEls = resolveMasterElementsForPdf(project, page);
    let canvas = await renderPageModelToCanvas(page, 2, false, masterEls);

    // Bleed: mirror the outer edge pixels so artwork runs past the trim line.
    if (bleedIn > 0) {
      const bleedPx = Math.round((bleedIn / page.width) * canvas.width);
      const bg =
        page.backgroundColor || (page.backgroundGradient ? page.backgroundGradient.color1 : '#ffffff');
      canvas = expandCanvasWithBleed(canvas, bleedPx, bg);
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Trim box = where the design gets cut (page bounds, inset by the mark margin)
    const trimX = markMarginIn * ptPerIn + bleedPt;
    const trimY = trimX;
    const trimW = page.width * ptPerIn;
    const trimH = page.height * ptPerIn;

    // The rendered canvas already includes the mirrored bleed when requested,
    // so it is drawn outwards from the trim box by exactly `bleedPt`.
    pdf.addImage(
      imgData,
      'JPEG',
      trimX - bleedPt,
      trimY - bleedPt,
      trimW + bleedPt * 2,
      trimH + bleedPt * 2
    );

    if (cropMarks) {
      drawCropMarks(pdf, trimX, trimY, trimW, trimH);
      // Thin trim guides help visual proofing without affecting the cut
      pdf.setDrawColor(190, 196, 204);
      pdf.setLineWidth(0.25);
      pdf.line(trimX, trimY + trimH + 2, trimX + trimW, trimY + trimH + 2);
    }
  }

  const suffix = bleedIn > 0 ? '-bleed' : '';
  const filename = (project.name || 'publication').replace(/\.pub$/i, '') + suffix + '.pdf';
  pdf.save(filename);
}

export async function exportBookletPdf(
  project: DocumentProject,
  pages: Page[],
  settings: PrintSettings
): Promise<void> {
  if (pages.length === 0) return;
  const bookletSheets = buildBookletSheets(pages, settings.bookletSides);
  if (bookletSheets.length === 0) return;

  const { jsPDF } = await loadJsPdf();
  const isPortrait = settings.sheetOrientation === 'portrait';
  const refPage = pages[0];
  const sheetW = isPortrait ? Math.min(refPage.width * 1.5, 816 * 0.75) : refPage.width * 1.5;
  const sheetH = isPortrait ? Math.max(refPage.height * 0.75, 1056 * 0.75) : refPage.height * 0.75;

  const pdf = new jsPDF({
    orientation: isPortrait ? 'p' : 'l',
    unit: 'pt',
    format: [sheetW, sheetH],
  });

  const renderedMap = new Map<string, string>();
  for (const pg of pages) {
    const masterEls = resolveMasterElementsForPdf(project, pg);
    const c = await renderPageModelToCanvas(pg, 2, false, masterEls);
    renderedMap.set(pg.id, c.toDataURL('image/jpeg', 0.95));
  }

  bookletSheets.forEach((bs, idx) => {
    if (idx > 0) pdf.addPage([sheetW, sheetH], isPortrait ? 'p' : 'l');
    const halfW = sheetW / 2;
    if (bs.leftPage) {
      const data = renderedMap.get(bs.leftPage.id);
      if (data) pdf.addImage(data, 'JPEG', 0, 0, halfW, sheetH);
    }
    if (bs.rightPage) {
      const data = renderedMap.get(bs.rightPage.id);
      if (data) pdf.addImage(data, 'JPEG', halfW, 0, halfW, sheetH);
    }
    if (settings.bookletShowFoldLine) {
      pdf.setDrawColor(148, 163, 184);
      pdf.setLineDashPattern([4, 4], 0);
      pdf.line(halfW, 0, halfW, sheetH);
      pdf.setLineDashPattern([], 0);
    }
  });

  const filename = (project.name || 'booklet').replace(/\.pub$/i, '') + '-booklet.pdf';
  pdf.save(filename);
}

export async function exportTarpapelPdf(
  project: DocumentProject,
  page: Page,
  settings: PrintSettings
): Promise<void> {
  const { jsPDF } = await loadJsPdf();
  const masterEls = resolveMasterElementsForPdf(project, page);
  // Guides are a screen aid. Baking them into the tile would print amber stripes across the art the
  // teacher is about to glue, so the export always slices clean and draws its marks as vectors in the
  // printer margin instead (see `sheetMarkGeometry`).
  const tiles = await slicePageIntoTarpapelTiles(
    page,
    { ...settings, tarpapelShowTileGuides: false },
    masterEls
  );
  if (tiles.length === 0) return;

  const { widthIn, heightIn, isLandscape } = resolvePaperBaseDimensions(
    settings.paperSize,
    settings.sheetOrientation,
    page
  );
  const ptW = widthIn * 72;
  const ptH = heightIn * 72;
  const marginPt = (settings.tarpapelMarginIn ?? 0.25) * 72;
  const availW = Math.max(72, ptW - marginPt * 2);
  const availH = Math.max(72, ptH - marginPt * 2);

  const pdf = new jsPDF({
    orientation: isLandscape ? 'l' : 'p',
    unit: 'pt',
    format: [ptW, ptH],
  });

  tiles.forEach((tile, idx) => {
    if (idx > 0) pdf.addPage([ptW, ptH], isLandscape ? 'l' : 'p');
    pdf.addImage(tile.dataUrl, 'PNG', marginPt, marginPt, availW, availH);

    const marks = sheetMarkGeometry(
      ptW,
      ptH,
      marginPt,
      Math.min(tile.col, settings.tarpapelCols),
      Math.min(tile.row, settings.tarpapelRows),
      settings.tarpapelCols,
      settings.tarpapelRows
    );
    if (marks.lines.length === 0) return;
    pdf.setDrawColor(90, 100, 112);
    pdf.setLineWidth(0.4);
    for (const line of marks.lines) pdf.line(line.x1, line.y1, line.x2, line.y2);
    pdf.setFontSize(5.5);
    pdf.setTextColor(90, 100, 112);
    for (const label of marks.labels) {
      pdf.text(label.text, label.x, label.y, label.align ? { align: label.align } : undefined);
    }
  });

  const filename =
    (project.name || 'tarpapel').replace(/\.pub$/i, '') +
    `-tarpapel-${settings.tarpapelCols}x${settings.tarpapelRows}.pdf`;
  pdf.save(filename);
}
