import jsPDF from 'jspdf';
import { DocumentProject } from '../types/publisher';
import { renderPageModelToCanvas } from './canvasRenderer';

export async function exportToPdf(project: DocumentProject): Promise<void> {
  if (project.pages.length === 0) return;

  const firstPage = project.pages[0];
  const orientation = firstPage.width > firstPage.height ? 'l' : 'p';

  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: [firstPage.width * 0.75, firstPage.height * 0.75],
  });

  const masterEls = project.masterPage?.showOnAllPages ? project.masterPage.elements : [];

  for (let i = 0; i < project.pages.length; i++) {
    const page = project.pages[i];
    if (i > 0) {
      pdf.addPage(
        [page.width * 0.75, page.height * 0.75],
        page.width > page.height ? 'l' : 'p'
      );
    }

    const canvas = await renderPageModelToCanvas(page, 2, false, masterEls);
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, page.width * 0.75, page.height * 0.75);
  }

  const filename = (project.name || 'publication').replace(/\.pub$/i, '') + '.pdf';
  pdf.save(filename);
}
