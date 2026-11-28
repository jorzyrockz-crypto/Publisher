import type { DocumentProject, Page } from '../types/publisher';
import {
  PRINT_PT_TO_MM,
  PrintSettings,
  resolvePaperBaseDimensions,
  sheetMarkGeometry,
  slicePageIntoTarpapelTiles,
} from './printUtils';
import { resolveMasterElementsForPdf } from './pdfExport';

/**
 * Send a tarpapel straight to the printer.
 *
 * The PDF export writes a file and leaves the teacher to open it, find the print button, and hope the
 * printer does not "fit to page" a sheet that was measured to the millimetre. This path builds the
 * sheets in a hidden frame at their true physical size, with `@page` set to the paper and margins at
 * zero, so what reaches the driver is the sheet as designed — then it opens the system dialog.
 *
 * Marks come from the same `sheetMarkGeometry` the PDF uses, converted to millimetres and placed in
 * the printer margin, so the two doors print the same sheet.
 */

const PT_TO_MM = PRINT_PT_TO_MM;

export interface SheetMarkupContext {
  pageWmm: number;
  pageHmm: number;
  marginMm: number;
  printableWmm: number;
  printableHmm: number;
  cols: number;
  rows: number;
}

function markMarkup(tile: { col: number; row: number }, ctx: SheetMarkupContext): string {
  const geometry = sheetMarkGeometry(
    ctx.pageWmm / PT_TO_MM,
    ctx.pageHmm / PT_TO_MM,
    ctx.marginMm / PT_TO_MM,
    tile.col,
    tile.row,
    ctx.cols,
    ctx.rows
  );
  const parts: string[] = [];
  for (const line of geometry.lines) {
    const x1 = line.x1 * PT_TO_MM;
    const y1 = line.y1 * PT_TO_MM;
    const x2 = line.x2 * PT_TO_MM;
    const y2 = line.y2 * PT_TO_MM;
    parts.push(
      `<i class="tick" style="left:${Math.min(x1, x2).toFixed(2)}mm;top:${Math.min(y1, y2).toFixed(2)}mm;width:${Math.max(Math.abs(x2 - x1), 0.14).toFixed(2)}mm;height:${Math.max(Math.abs(y2 - y1), 0.14).toFixed(2)}mm"></i>`
    );
  }
  for (const label of geometry.labels) {
    const x = label.x * PT_TO_MM;
    const y = label.y * PT_TO_MM;
    const horizontal =
      label.align === 'right'
        ? `right:${(ctx.pageWmm - x).toFixed(2)}mm;text-align:right`
        : `left:${x.toFixed(2)}mm`;
    parts.push(
      `<span class="lbl" style="${horizontal};top:${(y - 2.1).toFixed(2)}mm">${label.text}</span>`
    );
  }
  return parts.join('');
}

/** The whole print document as a string. Pure, so the sheet geometry can be checked in Node. */
export function buildTarpapelPrintHtml(
  tiles: Array<{ dataUrl: string; col: number; row: number }>,
  ctx: SheetMarkupContext,
  title: string
): string {
  const sheets = tiles
    .map(
      (tile) => `<section class="sheet">
  <img class="art" src="${tile.dataUrl}" alt="">
  ${markMarkup(tile, ctx)}
</section>`
    )
    .join('\n');

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${title.replace(/[<>&]/g, '')}</title>
<style>
  @page { size: ${ctx.pageWmm.toFixed(2)}mm ${ctx.pageHmm.toFixed(2)}mm; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .sheet {
    position: relative;
    width: ${ctx.pageWmm.toFixed(2)}mm;
    height: ${ctx.pageHmm.toFixed(2)}mm;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
  }
  .sheet:last-of-type { page-break-after: auto; break-after: auto; }
  .art {
    position: absolute;
    left: ${ctx.marginMm.toFixed(2)}mm;
    top: ${ctx.marginMm.toFixed(2)}mm;
    width: ${ctx.printableWmm.toFixed(2)}mm;
    height: ${ctx.printableHmm.toFixed(2)}mm;
    display: block;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .tick { position: absolute; background: #5a6470; }
  .lbl {
    position: absolute;
    font: 600 2.5mm/1 ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
    color: #5a6470;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
</style></head>
<body>
${sheets}
</body></html>`;
}

/**
 * Physical page and margin for a tarpapel, in millimetres. `paperSize`/`sheetOrientation` are already
 * resolved to the effective page, so a landscape A4 reads 297 × 210 rather than 210 × 297.
 */
export function tarpapelPrintContext(page: Page, settings: PrintSettings): SheetMarkupContext {
  const { widthIn, heightIn } = resolvePaperBaseDimensions(
    settings.paperSize,
    settings.sheetOrientation,
    page
  );
  const pageWmm = widthIn * 25.4;
  const pageHmm = heightIn * 25.4;
  const marginMm = (settings.tarpapelMarginIn ?? 0.25) * 25.4;
  return {
    pageWmm,
    pageHmm,
    marginMm,
    printableWmm: Math.max(10, pageWmm - marginMm * 2),
    printableHmm: Math.max(10, pageHmm - marginMm * 2),
    cols: settings.tarpapelCols,
    rows: settings.tarpapelRows,
  };
}

async function waitForArtwork(doc: Document): Promise<void> {
  const images = Array.from(doc.images);
  await Promise.all(
    images.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
            window.setTimeout(resolve, 4000);
          })
    )
  );
  // One frame after decode, so the driver never receives a blank sheet.
  await new Promise<void>((resolve) => window.setTimeout(resolve, 120));
}

export interface TarpapelPrintResult {
  sheets: number;
}

/**
 * Prints the poster. Resolves once the system dialog has been opened — the call itself is
 * fire-and-forget by nature, so callers should treat `sheets > 0` as "handed to the printer".
 */
export async function printTarpapelPoster(
  project: DocumentProject,
  page: Page,
  settings: PrintSettings
): Promise<TarpapelPrintResult> {
  const masterElements = resolveMasterElementsForPdf(project, page);
  const tiles = await slicePageIntoTarpapelTiles(
    page,
    { ...settings, tarpapelShowTileGuides: false },
    masterElements
  );
  if (tiles.length === 0) return { sheets: 0 };

  const context = tarpapelPrintContext(page, settings);

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.setAttribute('title', 'Tarpapel print frame');
  frame.style.cssText =
    'position:fixed;left:-10000px;top:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none';

  const html = buildTarpapelPrintHtml(
    tiles.map((t) => ({ dataUrl: t.dataUrl, col: t.col, row: t.row })),
    context,
    project.name || 'Tarpapel'
  );

  document.body.appendChild(frame);
  const frameWindow = frame.contentWindow;
  const frameDoc = frameWindow?.document;
  if (!frameWindow || !frameDoc) {
    frame.remove();
    throw new Error('The print frame could not be opened. Use Download instead.');
  }

  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  frameWindow.addEventListener('afterprint', () => frame.remove(), { once: true });
  window.setTimeout(() => frame.remove(), 5 * 60 * 1000);

  await waitForArtwork(frameDoc);
  frameWindow.focus();
  frameWindow.print();

  return { sheets: tiles.length };
}
