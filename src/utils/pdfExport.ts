import jsPDF from 'jspdf';
import { DocumentProject, Page } from '../types/publisher';

export async function exportToPdf(project: DocumentProject): Promise<void> {
  if (project.pages.length === 0) return;

  const firstPage = project.pages[0];
  const orientation = firstPage.orientation === 'landscape' ? 'l' : 'p';

  // Create jsPDF with custom point dimensions (pixels to points approx 0.75 ratio)
  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: [firstPage.width * 0.75, firstPage.height * 0.75],
  });

  for (let i = 0; i < project.pages.length; i++) {
    const page = project.pages[i];
    if (i > 0) {
      pdf.addPage([page.width * 0.75, page.height * 0.75], page.orientation === 'landscape' ? 'l' : 'p');
    }

    // Capture the DOM element of the page if present
    const pageEl = document.getElementById(`print-page-${page.id}`);
    if (pageEl) {
      try {
        // Render via canvas rasterization for exact visual match (WordArt, fonts, gradients, drop shadows)
        const canvas = await renderPageToCanvas(pageEl, page.width, page.height);
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, page.width * 0.75, page.height * 0.75);
      } catch (e) {
        console.error('Canvas capture failed, falling back', e);
      }
    }
  }

  const filename = project.name.replace(/\.pub$/, '') + '.pdf';
  pdf.save(filename);
}

// Helper to rasterize an HTML element to an HTML5 canvas at high DPI (2x)
export async function renderPageToCanvas(
  element: HTMLElement,
  width: number,
  height: number,
  scale = 2
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Clone element to sanitize for SVG foreignObject
  const cloned = element.cloneNode(true) as HTMLElement;

  // Remove selection boxes or editing handles from the print clone
  const handles = cloned.querySelectorAll('.resize-handle, .selection-marquee, .no-print');
  handles.forEach((h) => h.remove());

  // Wrap in SVG foreignObject
  const xmlSerializer = new XMLSerializer();
  const htmlContent = xmlSerializer.serializeToString(cloned);

  const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;transform-origin:top left;">
          ${htmlContent}
        </div>
      </foreignObject>
    </svg>
  `;

  return new Promise((resolve) => {
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };

    img.onerror = () => {
      // Fallback: white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };

    img.src = url;
  });
}
