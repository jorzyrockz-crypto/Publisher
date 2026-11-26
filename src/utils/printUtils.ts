import { DocumentProject, Page, PublisherElement } from '../types/publisher';
import { renderPageModelToCanvas } from './canvasRenderer';

export type PrintLayoutMode = 'standard' | 'booklet' | 'tarpapel';
export type SheetOrientation = 'auto' | 'portrait' | 'landscape';

export interface PrintSettings {
  printerName: 'System Print Dialog' | 'Save as PDF' | 'Office Color LaserJet' | 'Photo Inkjet Pro';
  paperSize: 'auto' | 'letter' | 'a4' | 'a3' | 'legal' | 'tabloid';
  qualityDpi: 150 | 300 | 600;
  duplex: 'one-sided' | 'long-edge' | 'short-edge';
  scaleMode: 'fit' | 'actual' | 'fill';
  rangeMode: 'all' | 'current' | 'custom';
  customRange: string;
  colorMode: 'color' | 'grayscale';
  showCropMarks: boolean;
  showMarginBox: boolean;
  pagesPerSheet: 1 | 2 | 4;
  copies: number;
  printMode: PrintLayoutMode;
  sheetOrientation: SheetOrientation;
  bookletSides: 'both' | 'fronts-only' | 'backs-only';
  bookletShowFoldLine: boolean;
  tarpapelCols: number;
  tarpapelRows: number;
  tarpapelOverlapPx: number;
  tarpapelOverlapIn: 0 | 0.25 | 0.5 | 0.75;
  tarpapelMarginIn: 0 | 0.25 | 0.5;
  tarpapelFitMode: 'contain' | 'cover';
  tarpapelTargetPageIndex: number;
  tarpapelShowTileGuides: boolean;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  printerName: 'System Print Dialog',
  paperSize: 'auto',
  qualityDpi: 300,
  duplex: 'one-sided',
  scaleMode: 'fit',
  rangeMode: 'all',
  customRange: '1',
  colorMode: 'color',
  showCropMarks: false,
  showMarginBox: false,
  pagesPerSheet: 1,
  copies: 1,
  printMode: 'standard',
  sheetOrientation: 'auto',
  bookletSides: 'both',
  bookletShowFoldLine: true,
  tarpapelCols: 2,
  tarpapelRows: 2,
  tarpapelOverlapPx: 18,
  tarpapelOverlapIn: 0.25,
  tarpapelMarginIn: 0.25,
  tarpapelFitMode: 'contain',
  tarpapelTargetPageIndex: 0,
  tarpapelShowTileGuides: true,
};

export function resolveMasterElementsForProject(
  project: DocumentProject | undefined,
  page: Page
): PublisherElement[] {
  if (!project) return [];
  if (page.hideMaster || project.masterPage?.showOnAllPages === false) return [];
  if (project.masterPages && project.masterPages.length > 0) {
    const m = page.masterId
      ? project.masterPages.find((mp) => mp.id === page.masterId)
      : project.masterPages[0];
    return m?.elements || [];
  }
  return project.masterPage?.elements || [];
}

/**
 * Parses a human page-range string like "1, 3-5" into valid 0-based page indices.
 */
export function parsePageIndices(rangeStr: string, totalPages: number): number[] {
  const result = new Set<number>();
  const parts = rangeStr
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = Math.max(1, parseInt(startStr, 10) || 1);
      const end = Math.min(totalPages, parseInt(endStr, 10) || start);
      const lo = Math.min(start, end);
      const hi = Math.max(start, end);
      for (let i = lo; i <= hi; i++) {
        result.add(i - 1);
      }
    } else {
      const num = parseInt(part, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= totalPages) {
        result.add(num - 1);
      }
    }
  }

  return Array.from(result).sort((a, b) => a - b);
}

/**
 * Groups selected pages into print sheets of 1, 2, or 4 pages per sheet.
 */
export function chunkPagesIntoSheets(pages: Page[], perSheet: 1 | 2 | 4): Page[][] {
  const sheets: Page[][] = [];
  for (let i = 0; i < pages.length; i += perSheet) {
    sheets.push(pages.slice(i, i + perSheet));
  }
  return sheets;
}

export interface BookletSheet {
  sheetNumber: number;
  side: 'Front' | 'Back';
  leftPage: Page | null;
  rightPage: Page | null;
  leftPageNum: number | null;
  rightPageNum: number | null;
}

/**
 * Arranges pages in true saddle-stitch booklet imposition order (padded to multiple of 4).
 */
export function buildBookletSheets(
  pages: Page[],
  sides: 'both' | 'fronts-only' | 'backs-only' = 'both'
): BookletSheet[] {
  if (pages.length === 0) return [];
  const totalSlots = Math.max(4, Math.ceil(pages.length / 4) * 4);
  const sheetCount = totalSlots / 4;
  const result: BookletSheet[] = [];

  const getPageAt = (oneBased: number): { page: Page | null; num: number | null } => {
    if (oneBased < 1 || oneBased > pages.length) return { page: null, num: null };
    return { page: pages[oneBased - 1], num: oneBased };
  };

  for (let k = 0; k < sheetCount; k++) {
    const frontLeftIdx = totalSlots - 2 * k;
    const frontRightIdx = 2 * k + 1;
    const backLeftIdx = 2 * k + 2;
    const backRightIdx = totalSlots - 2 * k - 1;

    if (sides === 'both' || sides === 'fronts-only') {
      const fl = getPageAt(frontLeftIdx);
      const fr = getPageAt(frontRightIdx);
      result.push({
        sheetNumber: k + 1,
        side: 'Front',
        leftPage: fl.page,
        rightPage: fr.page,
        leftPageNum: fl.num,
        rightPageNum: fr.num,
      });
    }
    if (sides === 'both' || sides === 'backs-only') {
      const bl = getPageAt(backLeftIdx);
      const br = getPageAt(backRightIdx);
      result.push({
        sheetNumber: k + 1,
        side: 'Back',
        leftPage: bl.page,
        rightPage: br.page,
        leftPageNum: bl.num,
        rightPageNum: br.num,
      });
    }
  }

  return result;
}

export interface TarpapelTile {
  row: number;
  col: number;
  label: string;
  width: number;
  height: number;
  dataUrl: string;
}

export function resolvePaperBaseDimensions(
  paperSize: PrintSettings['paperSize'],
  orientation: SheetOrientation,
  fallbackPage?: Page
): { widthIn: number; heightIn: number; isLandscape: boolean } {
  let wIn = 8.5;
  let hIn = 11;
  if (paperSize === 'a4') {
    wIn = 8.27;
    hIn = 11.69;
  } else if (paperSize === 'a3') {
    wIn = 11.69;
    hIn = 16.54;
  } else if (paperSize === 'legal') {
    wIn = 8.5;
    hIn = 14;
  } else if (paperSize === 'tabloid') {
    wIn = 11;
    hIn = 17;
  } else if (paperSize === 'auto' && fallbackPage) {
    wIn = Math.min(fallbackPage.width, fallbackPage.height) / 96;
    hIn = Math.max(fallbackPage.width, fallbackPage.height) / 96;
  }

  const isLandscape =
    orientation === 'landscape'
      ? true
      : orientation === 'portrait'
      ? false
      : fallbackPage
      ? fallbackPage.width > fallbackPage.height
      : false;

  return {
    widthIn: isLandscape ? Math.max(wIn, hIn) : Math.min(wIn, hIn),
    heightIn: isLandscape ? Math.min(wIn, hIn) : Math.max(wIn, hIn),
    isLandscape,
  };
}

export interface TarpapelMetrics {
  sheetWIn: number;
  sheetHIn: number;
  isLandscape: boolean;
  marginIn: number;
  printableWIn: number;
  printableHIn: number;
  overlapIn: number;
  cols: number;
  rows: number;
  totalPosterWIn: number;
  totalPosterHIn: number;
  totalPosterWCm: number;
  totalPosterHCm: number;
  posterScalePercent: number;
  effectiveDpi: number;
  lowResImageCount: number;
}

export function computeTarpapelMetrics(page: Page, settings: PrintSettings): TarpapelMetrics {
  const cols = Math.max(1, Math.min(8, Math.round(settings.tarpapelCols || 2)));
  const rows = Math.max(1, Math.min(8, Math.round(settings.tarpapelRows || 2)));
  const { widthIn: sheetWIn, heightIn: sheetHIn, isLandscape } = resolvePaperBaseDimensions(
    settings.paperSize,
    settings.sheetOrientation,
    page
  );
  const marginIn = settings.tarpapelMarginIn ?? 0.25;
  const printableWIn = Math.max(1, sheetWIn - marginIn * 2);
  const printableHIn = Math.max(1, sheetHIn - marginIn * 2);
  const overlapIn = Math.min(
    Math.min(printableWIn, printableHIn) * 0.25,
    settings.tarpapelOverlapIn ?? 0.25
  );

  const totalPosterWIn = cols * printableWIn - Math.max(0, cols - 1) * overlapIn;
  const totalPosterHIn = rows * printableHIn - Math.max(0, rows - 1) * overlapIn;
  const totalPosterWCm = totalPosterWIn * 2.54;
  const totalPosterHCm = totalPosterHIn * 2.54;

  const pageWIn = Math.max(1, page.width) / 96;
  const pageHIn = Math.max(1, page.height) / 96;
  const scaleFactor =
    settings.tarpapelFitMode === 'cover'
      ? Math.max(totalPosterWIn / pageWIn, totalPosterHIn / pageHIn)
      : Math.min(totalPosterWIn / pageWIn, totalPosterHIn / pageHIn);
  const posterScalePercent = Math.round(scaleFactor * 100);

  // Estimate effective print DPI for vector text/shapes vs embedded raster images
  let minImgDpi: number = settings.qualityDpi;
  let lowResImageCount = 0;
  for (const el of page.elements) {
    if (el.type === 'image' && el.visible !== false) {
      const printedElWIn = (el.width / 96) * scaleFactor;
      // Approximate natural raster density assuming standard 1200px source if unknown
      const approxPx = 1200;
      const estDpi = printedElWIn > 0 ? Math.round(approxPx / printedElWIn) : settings.qualityDpi;
      if (estDpi < 140) lowResImageCount++;
      minImgDpi = Math.min(minImgDpi, estDpi);
    }
  }

  return {
    sheetWIn,
    sheetHIn,
    isLandscape,
    marginIn,
    printableWIn,
    printableHIn,
    overlapIn,
    cols,
    rows,
    totalPosterWIn,
    totalPosterHIn,
    totalPosterWCm,
    totalPosterHCm,
    posterScalePercent,
    effectiveDpi: Math.max(72, Math.min(settings.qualityDpi, minImgDpi)),
    lowResImageCount,
  };
}

/**
 * Slices a page at high DPI into physically-proportioned NxM Tarpapel poster tiles
 * with glue/tape overlap strips, cut/trim marks, and Master Page elements preserved.
 */
export async function slicePageIntoTarpapelTiles(
  page: Page,
  settings: PrintSettings,
  masterElements: PublisherElement[] = []
): Promise<TarpapelTile[]> {
  const m = computeTarpapelMetrics(page, settings);
  const maxDim = Math.max(page.width, page.height);
  const desiredScale = Math.max(m.cols, m.rows) * (settings.qualityDpi >= 300 ? 2 : 1.5);
  const renderScale = Math.min(6, Math.max(2.5, desiredScale), 7200 / Math.max(1, maxDim));

  const srcCanvas = await renderPageModelToCanvas(page, renderScale, false, masterElements);

  // Build assembled poster canvas in true physical proportions
  const posterPxPerIn = Math.min(
    settings.qualityDpi >= 300 ? 220 : 150,
    7200 / Math.max(m.totalPosterWIn, m.totalPosterHIn)
  );
  const posterW = Math.max(100, Math.round(m.totalPosterWIn * posterPxPerIn));
  const posterH = Math.max(100, Math.round(m.totalPosterHIn * posterPxPerIn));

  const posterCanvas = document.createElement('canvas');
  posterCanvas.width = posterW;
  posterCanvas.height = posterH;
  const pCtx = posterCanvas.getContext('2d');
  if (pCtx) {
    pCtx.fillStyle = '#ffffff';
    pCtx.fillRect(0, 0, posterW, posterH);
    pCtx.imageSmoothingEnabled = true;
    pCtx.imageSmoothingQuality = 'high';

    const fitScale =
      settings.tarpapelFitMode === 'cover'
        ? Math.max(posterW / srcCanvas.width, posterH / srcCanvas.height)
        : Math.min(posterW / srcCanvas.width, posterH / srcCanvas.height);
    const drawW = srcCanvas.width * fitScale;
    const drawH = srcCanvas.height * fitScale;
    const drawX = (posterW - drawW) / 2;
    const drawY = (posterH - drawH) / 2;
    pCtx.drawImage(srcCanvas, drawX, drawY, drawW, drawH);
  }

  const tileW = Math.max(40, Math.round(m.printableWIn * posterPxPerIn));
  const tileH = Math.max(40, Math.round(m.printableHIn * posterPxPerIn));
  const overlapPx = Math.round(m.overlapIn * posterPxPerIn);
  const stepX = Math.max(1, tileW - overlapPx);
  const stepY = Math.max(1, tileH - overlapPx);

  const tiles: TarpapelTile[] = [];
  const totalTiles = m.cols * m.rows;

  for (let r = 0; r < m.rows; r++) {
    for (let c = 0; c < m.cols; c++) {
      const sx = Math.min(Math.max(0, posterW - tileW), c * stepX);
      const sy = Math.min(Math.max(0, posterH - tileH), r * stepY);

      const tileCanvas = document.createElement('canvas');
      tileCanvas.width = tileW;
      tileCanvas.height = tileH;
      const tCtx = tileCanvas.getContext('2d');
      if (tCtx) {
        tCtx.fillStyle = '#ffffff';
        tCtx.fillRect(0, 0, tileW, tileH);
        tCtx.imageSmoothingEnabled = true;
        tCtx.imageSmoothingQuality = 'high';
        tCtx.drawImage(posterCanvas, sx, sy, tileW, tileH, 0, 0, tileW, tileH);

        if (settings.tarpapelShowTileGuides) {
          tCtx.save();

          // Highlight Glue/Tape Overlap strips on inner right & bottom edges
          if (overlapPx > 2) {
            tCtx.fillStyle = 'rgba(245, 158, 11, 0.14)';
            if (c < m.cols - 1) {
              tCtx.fillRect(tileW - overlapPx, 0, overlapPx, tileH);
              tCtx.strokeStyle = 'rgba(217, 119, 6, 0.55)';
              tCtx.lineWidth = Math.max(1.5, posterPxPerIn * 0.012);
              tCtx.setLineDash([8, 6]);
              tCtx.beginPath();
              tCtx.moveTo(tileW - overlapPx, 0);
              tCtx.lineTo(tileW - overlapPx, tileH);
              tCtx.stroke();
            }
            if (r < m.rows - 1) {
              tCtx.fillRect(0, tileH - overlapPx, tileW, overlapPx);
              tCtx.strokeStyle = 'rgba(217, 119, 6, 0.55)';
              tCtx.lineWidth = Math.max(1.5, posterPxPerIn * 0.012);
              tCtx.setLineDash([8, 6]);
              tCtx.beginPath();
              tCtx.moveTo(0, tileH - overlapPx);
              tCtx.lineTo(tileW, tileH - overlapPx);
              tCtx.stroke();
            }
          }

          // Dashed outer trim border
          tCtx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
          tCtx.lineWidth = Math.max(2, Math.round(posterPxPerIn * 0.015));
          tCtx.setLineDash([10, 6]);
          tCtx.strokeRect(2, 2, tileW - 4, tileH - 4);
          tCtx.setLineDash([]);

          // Corner alignment ticks (+)
          const tick = Math.max(14, Math.round(posterPxPerIn * 0.14));
          tCtx.strokeStyle = 'rgba(15, 23, 42, 0.75)';
          tCtx.lineWidth = Math.max(1.5, posterPxPerIn * 0.012);
          [
            [8, 8],
            [tileW - 8, 8],
            [8, tileH - 8],
            [tileW - 8, tileH - 8],
          ].forEach(([cx, cy]) => {
            tCtx.beginPath();
            tCtx.moveTo(cx - tick / 2, cy);
            tCtx.lineTo(cx + tick / 2, cy);
            tCtx.moveTo(cx, cy - tick / 2);
            tCtx.lineTo(cx, cy + tick / 2);
            tCtx.stroke();
          });

          // Tile index badge
          const fontSize = Math.max(18, Math.round(posterPxPerIn * 0.14));
          const tileNum = r * m.cols + c + 1;
          tCtx.font = `bold ${fontSize}px sans-serif`;
          tCtx.fillStyle = 'rgba(15, 23, 42, 0.68)';
          tCtx.fillText(`R${r + 1}·C${c + 1} (${tileNum}/${totalTiles})`, 16, fontSize + 12);

          if (overlapPx > 12 && c < m.cols - 1) {
            const smallFont = Math.max(12, Math.round(fontSize * 0.65));
            tCtx.save();
            tCtx.translate(tileW - overlapPx / 2 + smallFont * 0.35, tileH / 2);
            tCtx.rotate(-Math.PI / 2);
            tCtx.font = `bold ${smallFont}px sans-serif`;
            tCtx.fillStyle = 'rgba(180, 83, 9, 0.75)';
            tCtx.textAlign = 'center';
            tCtx.fillText('GLUE / TAPE OVERLAP', 0, 0);
            tCtx.restore();
          }

          tCtx.restore();
        }
      }

      tiles.push({
        row: r + 1,
        col: c + 1,
        label: `Row ${r + 1}, Col ${c + 1}`,
        width: tileW,
        height: tileH,
        dataUrl: tileCanvas.toDataURL('image/png'),
      });
    }
  }

  return tiles;
}

/**
 * Captures high-DPI page canvases from DOM elements and prints them cleanly
 * inside an isolated iframe with optional grayscale proofing and crop marks.
 */
export async function executePrintJob(
  pages: Page[],
  settings: PrintSettings,
  project?: DocumentProject
): Promise<void> {
  if (pages.length === 0) return;

  const cropMarksHtml = settings.showCropMarks
    ? `<div class="crop crop-tl"></div><div class="crop crop-tr"></div><div class="crop crop-bl"></div><div class="crop crop-br"></div>`
    : '';

  let sheetsHtml = '';
  let pageCssOrientation = '';

  if (settings.printMode === 'booklet') {
    const bookletSheets = buildBookletSheets(pages, settings.bookletSides);
    const renderedByPageId = new Map<string, string>();
    const dpiScale = settings.qualityDpi >= 300 ? 2 : 1.5;
    for (const pg of pages) {
      const masterEls = resolveMasterElementsForProject(project, pg);
      const canvas = await renderPageModelToCanvas(pg, dpiScale, false, masterEls);
      renderedByPageId.set(pg.id, canvas.toDataURL('image/png'));
    }

    const isPortraitSheet = settings.sheetOrientation === 'portrait';
    pageCssOrientation = isPortraitSheet ? 'size: portrait;' : 'size: landscape;';

    const allBookletCopies = Array.from({ length: Math.max(1, settings.copies) }).flatMap(
      () => bookletSheets
    );

    sheetsHtml = allBookletCopies
      .map((bs) => {
        const leftHtml = bs.leftPage
          ? `<img src="${renderedByPageId.get(bs.leftPage.id) || ''}" alt="${bs.leftPage.name}" />`
          : `<div class="blank-half">Blank</div>`;
        const rightHtml = bs.rightPage
          ? `<img src="${renderedByPageId.get(bs.rightPage.id) || ''}" alt="${bs.rightPage.name}" />`
          : `<div class="blank-half">Blank</div>`;
        const foldHtml = settings.bookletShowFoldLine ? `<div class="fold-line"></div>` : '';
        return `
          <div class="sheet booklet-sheet" style="grid-template-columns: 1fr 1fr; grid-template-rows: 1fr; position: relative;">
            ${foldHtml}
            <div class="cell"><div class="frame ${settings.showCropMarks ? 'has-crop' : ''}">${cropMarksHtml}${leftHtml}</div></div>
            <div class="cell"><div class="frame ${settings.showCropMarks ? 'has-crop' : ''}">${cropMarksHtml}${rightHtml}</div></div>
          </div>`;
      })
      .join('');
  } else if (settings.printMode === 'tarpapel') {
    const targetIdx = Math.max(0, Math.min(pages.length - 1, settings.tarpapelTargetPageIndex || 0));
    const targetPage = pages[targetIdx] || pages[0];
    const masterEls = resolveMasterElementsForProject(project, targetPage);
    const tiles = await slicePageIntoTarpapelTiles(targetPage, settings, masterEls);
    const { isLandscape } = resolvePaperBaseDimensions(
      settings.paperSize,
      settings.sheetOrientation,
      targetPage
    );
    pageCssOrientation = isLandscape ? 'size: landscape;' : 'size: portrait;';

    const allTileCopies = Array.from({ length: Math.max(1, settings.copies) }).flatMap(
      () => tiles
    );

    sheetsHtml = allTileCopies
      .map(
        (tile) => `
          <div class="sheet" style="grid-template-columns: 1fr; grid-template-rows: 1fr;">
            <div class="cell">
              <div class="frame">
                <img src="${tile.dataUrl}" alt="${tile.label}" />
              </div>
            </div>
          </div>`
      )
      .join('');
  } else {
    const capturedImages: { page: Page; dataUrl: string }[] = [];
    for (const pg of pages) {
      const masterEls = resolveMasterElementsForProject(project, pg);
      const canvas = await renderPageModelToCanvas(pg, settings.qualityDpi >= 300 ? 2 : 1.5, false, masterEls);
      capturedImages.push({
        page: pg,
        dataUrl: canvas.toDataURL('image/png'),
      });
    }

    if (capturedImages.length === 0) {
      window.print();
      return;
    }

    const sheets: { page: Page; dataUrl: string }[][] = [];
    for (let i = 0; i < capturedImages.length; i += settings.pagesPerSheet) {
      sheets.push(capturedImages.slice(i, i + settings.pagesPerSheet));
    }

    const allCopySheets = Array.from({ length: Math.max(1, settings.copies) }).flatMap(
      () => sheets
    );

    if (settings.sheetOrientation === 'landscape') pageCssOrientation = 'size: landscape;';
    else if (settings.sheetOrientation === 'portrait') pageCssOrientation = 'size: portrait;';

    sheetsHtml = allCopySheets
      .map((sheetItems) => {
        const cols = settings.pagesPerSheet === 1 ? 1 : 2;
        const rows = settings.pagesPerSheet === 4 ? 2 : 1;
        const isLandscapeSheet =
          settings.sheetOrientation === 'landscape' ||
          (settings.sheetOrientation === 'auto' &&
            (settings.pagesPerSheet === 2 ||
              (settings.pagesPerSheet === 1 && sheetItems[0].page.width > sheetItems[0].page.height)));

        const cellsHtml = sheetItems
          .map(
            (item) => `
            <div class="cell">
              <div class="frame ${settings.showCropMarks ? 'has-crop' : ''}">
                ${cropMarksHtml}
                <img src="${item.dataUrl}" alt="${item.page.name}" />
              </div>
            </div>`
          )
          .join('');

        return `
          <div class="sheet ${isLandscapeSheet ? 'landscape' : 'portrait'}" style="grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, 1fr);">
            ${cellsHtml}
          </div>`;
      })
      .join('');
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc || !iframe.contentWindow) {
    iframe.remove();
    window.print();
    return;
  }

  doc.open();
  doc.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>StudioPress Print Job</title>
        <style>
          @page { margin: 8mm; ${pageCssOrientation} }
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; background: #fff; font-family: sans-serif; }
          .sheet {
            width: 100vw;
            height: 100vh;
            display: grid;
            gap: 10mm;
            padding: 4mm;
            page-break-after: always;
            align-items: center;
            justify-items: center;
          }
          .booklet-sheet { gap: 0; padding: 0; }
          .fold-line {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 50%;
            border-left: 1px dashed rgba(100, 116, 139, 0.65);
            pointer-events: none;
            z-index: 10;
          }
          .blank-half {
            color: #cbd5e1;
            font-size: 10pt;
          }
          .sheet:last-child { page-break-after: auto; }
          .cell {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .frame {
            position: relative;
            max-width: 100%;
            max-height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .frame.has-crop { padding: 5mm; }
          img {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            display: block;
            ${settings.colorMode === 'grayscale' ? 'filter: grayscale(100%);' : ''}
          }
          .crop {
            position: absolute;
            width: 4mm;
            height: 4mm;
            pointer-events: none;
          }
          .crop-tl { top: 0; left: 0; border-right: 0.75pt solid #0f172a; border-bottom: 0.75pt solid #0f172a; }
          .crop-tr { top: 0; right: 0; border-left: 0.75pt solid #0f172a; border-bottom: 0.75pt solid #0f172a; }
          .crop-bl { bottom: 0; left: 0; border-right: 0.75pt solid #0f172a; border-top: 0.75pt solid #0f172a; }
          .crop-br { bottom: 0; right: 0; border-left: 0.75pt solid #0f172a; border-top: 0.75pt solid #0f172a; }
        </style>
      </head>
      <body>${sheetsHtml}</body>
    </html>
  `);
  doc.close();

  // Wait for images inside the iframe to decode before printing
  await Promise.all(
    Array.from(doc.images).map(
      (img) =>
        new Promise<void>((res) => {
          if (img.complete) return res();
          img.onload = () => res();
          img.onerror = () => res();
        })
    )
  );

  iframe.contentWindow.focus();
  iframe.contentWindow.print();
  window.setTimeout(() => {
    iframe.remove();
  }, 1500);
}
