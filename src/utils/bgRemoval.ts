export interface BgRemovalOptions {
  mode?: 'flood' | 'color-key';
  targetColor?: 'auto' | 'white' | 'black' | string;
  tolerance?: number; // 5 to 85
  feather?: number; // 0 to 3
}

function parseHexRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [255, 255, 255];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function loadImgForBgRemoval(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for background removal'));
    img.src = src;
  });
}

/**
 * Client-side background removal for cliparts, stickers, and photos.
 * - 'flood': 4-edge BFS flood-fill (preserves enclosed white areas like eyes/teeth)
 * - 'color-key': removes all matching background pixels (ideal for enclosed loops in cliparts)
 */
export async function removeImageBackground(
  src: string,
  options: BgRemovalOptions = {}
): Promise<string> {
  const mode = options.mode || 'flood';
  const tolerance = Math.max(5, Math.min(85, options.tolerance ?? 28));
  const feather = Math.max(0, Math.min(3, options.feather ?? 1));
  const targetColorOpt = options.targetColor || 'auto';

  const img = await loadImgForBgRemoval(src);
  const w = Math.max(1, img.naturalWidth || img.width || 400);
  const h = Math.max(1, img.naturalHeight || img.height || 400);

  // Cap processing resolution for fast, responsive browser execution
  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;

  ctx.drawImage(img, 0, 0, cw, ch);
  const imgData = ctx.getImageData(0, 0, cw, ch);
  const data = imgData.data;

  // Determine target background RGB
  let bgR = 255;
  let bgG = 255;
  let bgB = 255;

  if (targetColorOpt === 'white') {
    bgR = 255;
    bgG = 255;
    bgB = 255;
  } else if (targetColorOpt === 'black') {
    bgR = 0;
    bgG = 0;
    bgB = 0;
  } else if (targetColorOpt !== 'auto' && targetColorOpt.startsWith('#')) {
    [bgR, bgG, bgB] = parseHexRgb(targetColorOpt);
  } else {
    // Auto-sample corners & mid-edges (weighted median/average of opaque edge pixels)
    const sampleCoords = [
      [1, 1],
      [cw - 2, 1],
      [1, ch - 2],
      [cw - 2, ch - 2],
      [Math.floor(cw / 2), 1],
      [Math.floor(cw / 2), ch - 2],
      [1, Math.floor(ch / 2)],
      [cw - 2, Math.floor(ch / 2)],
    ];
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let count = 0;
    for (const [sx, sy] of sampleCoords) {
      const idx = (Math.max(0, Math.min(ch - 1, sy)) * cw + Math.max(0, Math.min(cw - 1, sx))) * 4;
      if (data[idx + 3] > 20) {
        sumR += data[idx];
        sumG += data[idx + 1];
        sumB += data[idx + 2];
        count++;
      }
    }
    if (count > 0) {
      bgR = Math.round(sumR / count);
      bgG = Math.round(sumG / count);
      bgB = Math.round(sumB / count);
    }
  }

  const maxDist = tolerance * 1.75;
  const colorDist = (idx: number): number => {
    const dr = data[idx] - bgR;
    const dg = data[idx + 1] - bgG;
    const db = data[idx + 2] - bgB;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  if (mode === 'color-key') {
    const total = cw * ch;
    for (let p = 0; p < total; p++) {
      const idx = p * 4;
      if (data[idx + 3] === 0) continue;
      const d = colorDist(idx);
      if (d <= maxDist) {
        if (feather > 0 && d > maxDist * 0.72) {
          const ratio = (d - maxDist * 0.72) / (maxDist * 0.28);
          data[idx + 3] = Math.round(data[idx + 3] * Math.min(1, ratio));
        } else {
          data[idx + 3] = 0;
        }
      }
    }
  } else {
    // 4-edge BFS flood fill
    const visited = new Uint8Array(cw * ch);
    const queue = new Int32Array(cw * ch);
    let head = 0;
    let tail = 0;

    const tryEnqueue = (x: number, y: number) => {
      if (x < 0 || x >= cw || y < 0 || y >= ch) return;
      const p = y * cw + x;
      if (visited[p]) return;
      const idx = p * 4;
      if (data[idx + 3] === 0 || colorDist(idx) <= maxDist) {
        visited[p] = 1;
        queue[tail++] = p;
      }
    };

    for (let x = 0; x < cw; x++) {
      tryEnqueue(x, 0);
      tryEnqueue(x, ch - 1);
    }
    for (let y = 0; y < ch; y++) {
      tryEnqueue(0, y);
      tryEnqueue(cw - 1, y);
    }

    while (head < tail) {
      const p = queue[head++];
      const idx = p * 4;
      data[idx + 3] = 0;
      const x = p % cw;
      const y = (p - x) / cw;
      tryEnqueue(x + 1, y);
      tryEnqueue(x - 1, y);
      tryEnqueue(x, y + 1);
      tryEnqueue(x, y - 1);
    }

    // Optional soft edge feathering on pixels adjacent to removed background
    if (feather > 0) {
      const featherDist = maxDist * (1 + feather * 0.12);
      for (let y = 1; y < ch - 1; y++) {
        for (let x = 1; x < cw - 1; x++) {
          const p = y * cw + x;
          if (visited[p]) continue;
          if (
            visited[p - 1] ||
            visited[p + 1] ||
            visited[p - cw] ||
            visited[p + cw]
          ) {
            const idx = p * 4;
            const d = colorDist(idx);
            if (d < featherDist) {
              const alphaScale = Math.max(0.15, (d - maxDist * 0.6) / (featherDist - maxDist * 0.6));
              data[idx + 3] = Math.round(data[idx + 3] * Math.min(1, alphaScale));
            }
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}
