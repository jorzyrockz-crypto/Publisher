import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DocumentProject } from '../types/publisher';

export async function exportToPdf(
  project: DocumentProject,
  elementPrefix = 'print-capture-'
): Promise<void> {
  if (project.pages.length === 0) return;

  const firstPage = project.pages[0];
  const orientation = firstPage.orientation === 'landscape' ? 'l' : 'p';

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
        page.orientation === 'landscape' ? 'l' : 'p'
      );
    }

    const pageEl =
      document.getElementById(`${elementPrefix}${page.id}`) ||
      document.getElementById(`print-page-${page.id}`);

    if (pageEl) {
      try {
        const canvas = await renderPageToCanvas(
          pageEl,
          page.width,
          page.height,
          2,
          page.backgroundColor || '#ffffff'
        );
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, page.width * 0.75, page.height * 0.75);
      } catch (e) {
        console.error('PDF page capture failed:', e);
      }
    }
  }

  const filename = project.name.replace(/\.pub$/, '') + '.pdf';
  pdf.save(filename);
}

/**
 * Rasterizes a full-resolution page DOM element to an HTML5 Canvas using html2canvas
 * so Tailwind CSS, Google Fonts, gradients, WordArt, and SVG shapes render accurately.
 */
export async function renderPageToCanvas(
  element: HTMLElement,
  width: number,
  height: number,
  scale = 2,
  backgroundColor = '#ffffff'
): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor,
    width,
    height,
    logging: false,
    ignoreElements: (el) =>
      el.classList?.contains('no-print') ||
      el.classList?.contains('resize-handle') ||
      el.classList?.contains('selection-marquee'),
  });
}
