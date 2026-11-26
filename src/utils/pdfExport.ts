import jsPDF from 'jspdf';
import { DocumentProject, Page } from '../types/publisher';
import { renderPageModelToCanvas } from './canvasRenderer';
import {
  PrintSettings,
  buildBookletSheets,
  resolvePaperBaseDimensions,
  slicePageIntoTarpapelTiles,
} from './printUtils';

function resolveMasterElementsForPdf(project: DocumentProject, page: Page) {
  if (page.hideMaster || project.masterPage?.showOnAllPages === false) return [];
  if (project.masterPages && project.masterPages.length > 0) {
    const m = page.masterId
      ? project.masterPages.find((mp) => mp.id === page.masterId)
      : project.masterPages[0];
    return m?.elements || [];
  }
  return project.masterPage?.elements || [];
}

export async function exportToPdf(project: DocumentProject): Promise<void> {
  if (project.pages.length === 0) return;

  const firstPage = project.pages[0];
  const orientation = firstPage.width > firstPage.height ? 'l' : 'p';

  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: [firstPage.width * 0.75, firstPage.height * 0.75],
  });

  for (let i = 0; i < project.pages.length; i++) {
    const page = project.pages[i];
    if (i > 0) {
      pdf.addPage(
        [page.width * 0.75, page.height * 0.75],
        page.width > page.height ? 'l' : 'p'
      );
    }

    const masterEls = resolveMasterElementsForPdf(project, page);
    const canvas = await renderPageModelToCanvas(page, 2, false, masterEls);
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, page.width * 0.75, page.height * 0.75);
  }

  const filename = (project.name || 'publication').replace(/\.pub$/i, '') + '.pdf';
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
  const masterEls = resolveMasterElementsForPdf(project, page);
  const tiles = await slicePageIntoTarpapelTiles(page, settings, masterEls);
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
  });

  const filename =
    (project.name || 'tarpapel').replace(/\.pub$/i, '') +
    `-tarpapel-${settings.tarpapelCols}x${settings.tarpapelRows}.pdf`;
  pdf.save(filename);
}
