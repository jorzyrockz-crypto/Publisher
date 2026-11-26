import { DocumentProject, Page, PublisherElement } from '../types/publisher';
import { renderPageModelToCanvas } from './canvasRenderer';

export async function exportToImage(
  page: Page,
  format: 'png' | 'jpeg',
  filename: string,
  transparent = false,
  masterElements: PublisherElement[] = []
): Promise<void> {
  const useAlpha = format === 'png' && transparent;
  const canvas = await renderPageModelToCanvas(page, 2, useAlpha, masterElements);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
      `image/${format}`,
      0.95
    );
  });

  const url = URL.createObjectURL(blob);
  const safeName = (filename || page.name || 'export').replace(/[^\w\-. ]+/g, '_');
  const link = document.createElement('a');
  link.download = `${safeName}.${format}`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function saveProjectToFile(project: DocumentProject): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = project.name.endsWith('.pub') ? project.name : `${project.name}.pub`;
  link.href = url;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function loadProjectFromFile(file: File): Promise<DocumentProject> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!parsed.pages || !Array.isArray(parsed.pages)) {
          throw new Error('Invalid StudioPress project file format (.pub)');
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
