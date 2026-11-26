import { Page } from '../types/publisher';
import { renderPageModelToCanvas } from './canvasRenderer';

export interface PrintSettings {
  printerName: 'System Print Dialog' | 'Save as PDF' | 'Office Color LaserJet' | 'Photo Inkjet Pro';
  paperSize: 'auto' | 'letter' | 'a4' | 'legal' | 'tabloid';
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
};

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

/**
 * Captures high-DPI page canvases from DOM elements and prints them cleanly
 * inside an isolated iframe with optional grayscale proofing and crop marks.
 */
export async function executePrintJob(
  pages: Page[],
  settings: PrintSettings
): Promise<void> {
  if (pages.length === 0) return;

  const capturedImages: { page: Page; dataUrl: string }[] = [];
  for (const pg of pages) {
    const canvas = await renderPageModelToCanvas(pg, settings.qualityDpi >= 300 ? 2 : 1.5, false);
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

  const cropMarksHtml = settings.showCropMarks
    ? `<div class="crop crop-tl"></div><div class="crop crop-tr"></div><div class="crop crop-bl"></div><div class="crop crop-br"></div>`
    : '';

  const sheetsHtml = allCopySheets
    .map((sheetItems) => {
      const cols = settings.pagesPerSheet === 1 ? 1 : 2;
      const rows = settings.pagesPerSheet === 4 ? 2 : 1;
      const isLandscapeSheet =
        settings.pagesPerSheet === 2 ||
        (settings.pagesPerSheet === 1 && sheetItems[0].page.width > sheetItems[0].page.height);

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
          @page { margin: 8mm; }
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
