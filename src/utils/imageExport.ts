import { DocumentProject, Page } from '../types/publisher';
import { renderPageToCanvas } from './pdfExport';

export async function exportToImage(page: Page, format: 'png' | 'jpeg', filename: string): Promise<void> {
  const pageEl = document.getElementById(`print-page-${page.id}`);
  if (!pageEl) return;

  const canvas = await renderPageToCanvas(pageEl, page.width, page.height, 2);
  const dataUrl = canvas.toDataURL(`image/${format}`, 0.95);

  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  link.href = dataUrl;
  link.click();
}

export function saveProjectToFile(project: DocumentProject): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  const safeName = project.name.endsWith('.pub') ? project.name : `${project.name}.pub`;
  link.setAttribute('download', safeName);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function loadProjectFromFile(file: File): Promise<DocumentProject> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!parsed.pages || !Array.isArray(parsed.pages)) {
          throw new Error('Invalid MS Publisher project file format');
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}

export function triggerPrint(): void {
  window.print();
}
