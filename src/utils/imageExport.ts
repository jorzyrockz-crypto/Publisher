import { DocumentProject, Page, PublisherElement } from '../types/publisher';
import { renderPageModelToCanvas } from './canvasRenderer';
import { resolveMasterElementsForProject } from './printUtils';
import { projectBaseName, projectFileName } from './projectFile';
import { recordRecentDesign } from './recentDesigns';

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
  // The download is the file; this copy is what makes the Home screen able to offer the document
  // back. Fire-and-forget: a cache that cannot be written must never fail a save.
  void recordRecentDesign(project);
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = projectFileName(project.name);
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
          throw new Error('Invalid StudioPress project file format (.spress)');
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


/**
 * Extends a rendered page canvas by `bleedPx` on every side by mirroring the
 * outermost pixels. Print shops need artwork to run past the trim line; mirrored
 * edge extension is the standard trick for flat colours, gradients and photos and
 * keeps the trim area pixel-identical to the design.
 */
export function expandCanvasWithBleed(
  src: HTMLCanvasElement,
  bleedPx: number,
  background: string = '#ffffff'
): HTMLCanvasElement {
  const bleed = Math.round(bleedPx);
  if (bleed <= 0) return src;

  const out = document.createElement('canvas');
  out.width = src.width + bleed * 2;
  out.height = src.height + bleed * 2;
  const ctx = out.getContext('2d');
  if (!ctx) return src;

  ctx.fillStyle = background || '#ffffff';
  ctx.fillRect(0, 0, out.width, out.height);

  // Original artwork
  ctx.drawImage(src, bleed, bleed);

  const strip = Math.max(1, bleed);
  const sw = Math.min(strip, src.width);
  const sh = Math.min(strip, src.height);

  // Left + right edge mirroring (horizontal flip)
  ctx.save();
  ctx.translate(bleed, bleed);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0, sw, src.height, 0, 0, bleed, src.height);
  ctx.restore();

  ctx.save();
  ctx.translate(bleed + src.width + bleed, bleed);
  ctx.scale(-1, 1);
  ctx.drawImage(src, src.width - sw, 0, sw, src.height, 0, 0, bleed, src.height);
  ctx.restore();

  // Top + bottom edge mirroring (vertical flip)
  ctx.save();
  ctx.translate(bleed, bleed);
  ctx.scale(1, -1);
  ctx.drawImage(src, 0, 0, src.width, sh, 0, 0, src.width, bleed);
  ctx.restore();

  ctx.save();
  ctx.translate(bleed, bleed + src.height + bleed);
  ctx.scale(1, -1);
  ctx.drawImage(src, 0, src.height - sh, src.width, sh, 0, 0, src.width, bleed);
  ctx.restore();

  return out;
}

export interface BatchPngOptions {
  transparent?: boolean;
  scale?: number;
  onProgress?: (done: number, total: number) => void;
}

/**
 * Renders every page at print resolution and packages them into a single ZIP
 * (one PNG per page) — far more convenient than N separate browser downloads.
 * JSZip is imported dynamically so it never lands in the initial bundle.
 */
export async function exportAllPagesToPngZip(
  project: DocumentProject,
  options: BatchPngOptions = {}
): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const scale = options.scale ?? 2;
  const zip = new JSZip();
  const safeBase = projectBaseName(project.name || 'publication').replace(/[^\w\-. ]+/g, '_');
  const folder = zip.folder(safeBase) || zip;

  const total = project.pages.length;
  for (let i = 0; i < total; i++) {
    const page = project.pages[i];
    const masters = resolveMasterElementsForProject(project, page);
    const canvas = await renderPageModelToCanvas(page, scale, Boolean(options.transparent), masters);
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1] || '';
    const index = String(i + 1).padStart(2, '0');
    const pageName = (page.name || `Page-${index}`).replace(/[^\w\-. ]+/g, '_');
    folder.file(`${index}-${pageName}.png`, base64, { base64: true });
    options.onProgress?.(i + 1, total);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeBase}-pages.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Exports only the selected elements (e.g. a 2-graphic logo) as a tight,
 * high-resolution transparent PNG without the rest of the page.
 */
export async function exportSelectionToPng(
  page: Page,
  selectedElements: PublisherElement[],
  filename = 'logo-selection',
  scale = 3
): Promise<void> {
  if (selectedElements.length === 0) return;

  const pad = 16;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of selectedElements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }

  const width = Math.max(32, Math.ceil(maxX - minX + pad * 2));
  const height = Math.max(32, Math.ceil(maxY - minY + pad * 2));

  const shiftedElements = selectedElements.map((el) => ({
    ...el,
    x: el.x - minX + pad,
    y: el.y - minY + pad,
  }));

  const tempPage: Page = {
    ...page,
    width,
    height,
    backgroundColor: 'transparent',
    backgroundGradient: undefined,
    backgroundPattern: undefined,
    elements: shiftedElements,
  };

  const canvas = await renderPageModelToCanvas(tempPage, scale, true, []);
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
      'image/png',
      1
    );
  });

  const url = URL.createObjectURL(blob);
  const safeName = (filename || 'logo-selection').replace(/[^\w\-. ]+/g, '_');
  const link = document.createElement('a');
  link.download = `${safeName}.png`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
