export type AIEngineMode = 'hybrid' | 'cloud' | 'procedural';

export type AIArtStyle =
  | 'photorealistic'
  | '3d-render'
  | 'minimal-vector'
  | 'watercolor'
  | 'cyberpunk'
  | 'editorial';

export type ProceduralMotif =
  | 'aurora-mesh'
  | 'liquid-waves'
  | 'bauhaus-geo'
  | 'cyber-grid'
  | 'bokeh-glow'
  | 'liquid-marble'
  | 'topo-contours'
  | 'low-poly-3d'
  | 'halftone-pop'
  | 'mandala-radial'
  | 'editorial-portrait';

export type PaletteMode = 'auto' | 'custom';

export type AIAspectRatio = '1:1' | '4:3' | '3:4' | '16:9';

export interface AspectRatioSpec {
  id: AIAspectRatio;
  label: string;
  width: number;
  height: number;
  insertWidth: number;
  insertHeight: number;
}

export const ASPECT_RATIOS: AspectRatioSpec[] = [
  { id: '1:1', label: 'Square (1:1)', width: 768, height: 768, insertWidth: 280, insertHeight: 280 },
  { id: '4:3', label: 'Landscape (4:3)', width: 800, height: 600, insertWidth: 340, insertHeight: 255 },
  { id: '3:4', label: 'Portrait (3:4)', width: 600, height: 800, insertWidth: 255, insertHeight: 340 },
  { id: '16:9', label: 'Widescreen (16:9)', width: 960, height: 540, insertWidth: 384, insertHeight: 216 },
];

export const AI_ART_STYLES: { id: AIArtStyle; label: string; promptSuffix: string }[] = [
  { id: 'photorealistic', label: 'Photo Realistic', promptSuffix: 'ultra detailed, studio lighting, crisp photography' },
  { id: '3d-render', label: '3D Glossy Render', promptSuffix: '3D octane render, smooth materials, soft studio rim light' },
  { id: 'minimal-vector', label: 'Modern Flat Art', promptSuffix: 'clean modern editorial vector illustration, balanced composition' },
  { id: 'watercolor', label: 'Watercolor Print', promptSuffix: 'textured watercolor painting on cotton paper, soft washes' },
  { id: 'cyberpunk', label: 'Neon Cyber Glow', promptSuffix: 'vibrant neon cyan and magenta glow, futuristic dark backdrop' },
  { id: 'editorial', label: 'Magazine Editorial', promptSuffix: 'high fashion editorial aesthetic, warm contrast, film grain' },
];

export const PROCEDURAL_MOTIFS: { id: ProceduralMotif; label: string }[] = [
  { id: 'aurora-mesh', label: 'Aurora Mesh' },
  { id: 'liquid-waves', label: 'Liquid Waves' },
  { id: 'bauhaus-geo', label: 'Bauhaus Geo' },
  { id: 'cyber-grid', label: 'Cyber Grid' },
  { id: 'bokeh-glow', label: 'Bokeh Glow' },
  { id: 'liquid-marble', label: 'Liquid Marble' },
  { id: 'topo-contours', label: 'Topo Contours' },
  { id: 'low-poly-3d', label: 'Low-Poly 3D' },
  { id: 'halftone-pop', label: 'Halftone Pop' },
  { id: 'mandala-radial', label: 'Mandala' },
  { id: 'editorial-portrait', label: 'Portrait Art' },
];

export const PROMPT_PRESETS: string[] = [
  'Minimalist emerald and gold abstract geometric poster backdrop',
  'Sunset mountain peaks in warm watercolor layers',
  'Neon cyber futuristic digital waves dark background',
  'Modern clean coffee shop workspace morning sunlight',
  'Luxury rose gold marble fluid silk texture',
];

export interface GeneratedImageResult {
  dataUrl: string;
  source: 'cloud' | 'procedural';
  width: number;
  height: number;
  seed: number;
  prompt: string;
  fallbackNotice?: string;
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createRng(seed: number): () => number {
  let s = seed || 1337;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Palette {
  bg1: string;
  bg2: string;
  accents: string[];
}

const KEYWORD_PALETTES: { keywords: string[]; palette: Palette }[] = [
  {
    keywords: ['neon', 'cyber', 'futur', 'tech', 'synth', 'hologram', 'dark', 'night'],
    palette: {
      bg1: '#090d16',
      bg2: '#1e1b4b',
      accents: ['#06b6d4', '#ec4899', '#8b5cf6', '#22d3ee'],
    },
  },
  {
    keywords: ['sunset', 'warm', 'sun', 'fire', 'autumn', 'summer', 'coral', 'orange'],
    palette: {
      bg1: '#450a0a',
      bg2: '#9a3412',
      accents: ['#f43f5e', '#f97316', '#facc15', '#fb7185'],
    },
  },
  {
    keywords: ['ocean', 'sea', 'water', 'sky', 'blue', 'ice', 'winter', 'arctic'],
    palette: {
      bg1: '#082f49',
      bg2: '#0f172a',
      accents: ['#0284c7', '#38bdf8', '#2dd4bf', '#bae6fd'],
    },
  },
  {
    keywords: ['emerald', 'green', 'forest', 'nature', 'botanical', 'leaf', 'eco'],
    palette: {
      bg1: '#022c22',
      bg2: '#064e3b',
      accents: ['#10b981', '#34d399', '#fbbf24', '#a7f3d0'],
    },
  },
  {
    keywords: ['gold', 'luxury', 'vip', 'royal', 'marble', 'elegant', 'rose'],
    palette: {
      bg1: '#18181b',
      bg2: '#27272a',
      accents: ['#f59e0b', '#fde047', '#fda4af', '#e4e4e7'],
    },
  },
  {
    keywords: ['pastel', 'coffee', 'minimal', 'cream', 'soft', 'clean', 'paper'],
    palette: {
      bg1: '#faf5ff',
      bg2: '#fff7ed',
      accents: ['#f472b6', '#60a5fa', '#34d399', '#fbbf24'],
    },
  },
];

function resolvePalette(prompt: string, seed: number): Palette {
  const lower = prompt.toLowerCase();
  const match = KEYWORD_PALETTES.find((entry) =>
    entry.keywords.some((kw) => lower.includes(kw))
  );
  if (match) return match.palette;

  const fallbackIndex = hashString(prompt + seed) % KEYWORD_PALETTES.length;
  return KEYWORD_PALETTES[fallbackIndex].palette;
}

/**
 * Instant 100% offline generative artwork renderer using HTML5 Canvas 2D.
 * Produces deterministic, print-ready high-resolution PNG Data URLs.
 */
export function generateProceduralArtwork(
  prompt: string,
  options: {
    ratio: AspectRatioSpec;
    motif: ProceduralMotif;
    style: AIArtStyle;
    seed: number;
    complexity?: number;
    grain?: number;
    hdPrint?: boolean;
    customPalette?: { bg1: string; bg2: string; accent1: string; accent2: string };
  }
): GeneratedImageResult {
  const {
    ratio,
    motif,
    style,
    seed,
    complexity = 5,
    grain = 18,
    hdPrint = false,
    customPalette,
  } = options;
  const effectiveSeed = hashString(`${prompt}|${motif}|${style}|${seed}`);
  const rng = createRng(effectiveSeed);
  const palette: Palette = customPalette
    ? {
        bg1: customPalette.bg1,
        bg2: customPalette.bg2,
        accents: [customPalette.accent1, customPalette.accent2, customPalette.accent1, customPalette.accent2],
      }
    : resolvePalette(prompt, seed);

  const scaleFactor = hdPrint ? 2 : 1;
  const w = ratio.width * scaleFactor;
  const h = ratio.height * scaleFactor;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      dataUrl: '',
      source: 'procedural',
      width: w,
      height: h,
      seed,
      prompt,
    };
  }

  // Base gradient backdrop
  const angle = rng() * Math.PI * 2;
  const bgGrad = ctx.createLinearGradient(
    w / 2 - Math.cos(angle) * w * 0.6,
    h / 2 - Math.sin(angle) * h * 0.6,
    w / 2 + Math.cos(angle) * w * 0.6,
    h / 2 + Math.sin(angle) * h * 0.6
  );
  bgGrad.addColorStop(0, style === 'cyberpunk' ? '#090d16' : palette.bg1);
  bgGrad.addColorStop(1, style === 'cyberpunk' ? '#2e1065' : palette.bg2);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  if (motif === 'aurora-mesh' || motif === 'bokeh-glow') {
    const blobCount = motif === 'bokeh-glow' ? 16 : 8;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < blobCount; i++) {
      const cx = rng() * w;
      const cy = rng() * h;
      const maxR = motif === 'bokeh-glow' ? 60 + rng() * 190 : 180 + rng() * 340;
      const color = palette.accents[i % palette.accents.length];
      const grad = ctx.createRadialGradient(cx, cy, maxR * 0.05, cx, cy, maxR);
      grad.addColorStop(0, `${color}${motif === 'bokeh-glow' ? '77' : 'cc'}`);
      grad.addColorStop(0.55, `${color}44`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  if (motif === 'liquid-waves') {
    const waveLayers = 6;
    for (let layer = 0; layer < waveLayers; layer++) {
      const color = palette.accents[layer % palette.accents.length];
      const baseY = h * (0.28 + layer * 0.12);
      const amp = 35 + rng() * 55;
      const phase = rng() * Math.PI * 2;
      const freq = 1.5 + rng() * 2;

      ctx.save();
      ctx.globalAlpha = 0.28 + (layer / waveLayers) * 0.45;
      const waveGrad = ctx.createLinearGradient(0, baseY - amp, w, h);
      waveGrad.addColorStop(0, color);
      waveGrad.addColorStop(1, palette.accents[(layer + 1) % palette.accents.length]);
      ctx.fillStyle = waveGrad;

      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, baseY);
      const steps = 64;
      for (let s = 0; s <= steps; s++) {
        const px = (s / steps) * w;
        const py =
          baseY +
          Math.sin((s / steps) * Math.PI * 2 * freq + phase) * amp +
          Math.cos((s / steps) * Math.PI * freq - phase) * (amp * 0.35);
        ctx.lineTo(px, py);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  if (motif === 'bauhaus-geo') {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const cx = rng() * w;
      const cy = rng() * h;
      const size = 60 + rng() * 210;
      const color = palette.accents[i % palette.accents.length];
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rng() * Math.PI);
      ctx.globalAlpha = 0.35 + rng() * 0.5;
      ctx.fillStyle = color;

      const kind = i % 3;
      if (kind === 0) {
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * (rng() > 0.4 ? 2 : 1));
        ctx.fill();
      } else if (kind === 1) {
        ctx.fillRect(-size / 2, -size / 3, size, size * 0.66);
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.lineTo(-size / 2, size / 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  if (motif === 'cyber-grid') {
    const horizonY = h * 0.52;
    // Glowing synthwave sun
    const sunR = Math.min(w, h) * 0.24;
    const sunGrad = ctx.createLinearGradient(w / 2, horizonY - sunR, w / 2, horizonY + sunR * 0.3);
    sunGrad.addColorStop(0, palette.accents[2] || '#fde047');
    sunGrad.addColorStop(0.6, palette.accents[1] || '#ec4899');
    sunGrad.addColorStop(1, 'rgba(236,72,153,0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(w / 2, horizonY - sunR * 0.1, sunR, 0, Math.PI * 2);
    ctx.fill();

    // Horizon perspective lines
    ctx.save();
    ctx.strokeStyle = palette.accents[0] || '#22d3ee';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.55;

    for (let i = -12; i <= 12; i++) {
      ctx.beginPath();
      ctx.moveTo(w / 2 + i * 26, horizonY);
      ctx.lineTo(w / 2 + i * 165, h);
      ctx.stroke();
    }
    for (let row = 1; row <= 12; row++) {
      const t = Math.pow(row / 12, 1.7);
      const y = horizonY + t * (h - horizonY);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (motif === 'liquid-marble') {
    const ribbons = 8 + complexity * 2;
    for (let i = 0; i < ribbons; i++) {
      const color = palette.accents[i % palette.accents.length];
      ctx.save();
      ctx.globalAlpha = 0.22 + rng() * 0.35;
      ctx.strokeStyle = color;
      ctx.lineWidth = (18 + rng() * 55) * scaleFactor;
      ctx.lineCap = 'round';
      ctx.beginPath();
      let x = -w * 0.1;
      let y = rng() * h;
      ctx.moveTo(x, y);
      const segs = 6;
      for (let s = 1; s <= segs; s++) {
        const nx = (s / segs) * w * 1.2 - w * 0.1;
        const ny = y + (rng() - 0.5) * h * 0.55;
        const cx = (x + nx) / 2;
        const cy = y + (rng() - 0.5) * h * 0.4;
        ctx.quadraticCurveTo(cx, cy, nx, ny);
        x = nx;
        y = ny;
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  if (motif === 'topo-contours') {
    const rings = 10 + complexity * 2;
    const cx = w * (0.3 + rng() * 0.4);
    const cy = h * (0.3 + rng() * 0.4);
    ctx.save();
    ctx.lineWidth = 1.6 * scaleFactor;
    for (let r = 1; r <= rings; r++) {
      const baseR = (r / rings) * Math.max(w, h) * 0.85;
      ctx.strokeStyle = palette.accents[r % palette.accents.length];
      ctx.globalAlpha = 0.3 + (r / rings) * 0.45;
      ctx.beginPath();
      const pts = 72;
      for (let p = 0; p <= pts; p++) {
        const a = (p / pts) * Math.PI * 2;
        const wobble =
          Math.sin(a * 3 + r * 0.35) * 18 * scaleFactor +
          Math.cos(a * 5 - r * 0.2) * 10 * scaleFactor;
        const px = cx + Math.cos(a) * (baseR + wobble);
        const py = cy + Math.sin(a) * (baseR * 0.78 + wobble);
        if (p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  }

  if (motif === 'low-poly-3d') {
    const cols = Math.max(4, 4 + Math.round(complexity * 0.8));
    const rows = Math.max(4, 4 + Math.round(complexity * 0.8));
    const cellW = w / cols;
    const cellH = h / rows;
    const grid: { x: number; y: number }[][] = [];
    for (let r = 0; r <= rows; r++) {
      const rowPts: { x: number; y: number }[] = [];
      for (let c = 0; c <= cols; c++) {
        const jx = c === 0 || c === cols ? 0 : (rng() - 0.5) * cellW * 0.72;
        const jy = r === 0 || r === rows ? 0 : (rng() - 0.5) * cellH * 0.72;
        rowPts.push({ x: c * cellW + jx, y: r * cellH + jy });
      }
      grid.push(rowPts);
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const p1 = grid[r][c];
        const p2 = grid[r][c + 1];
        const p3 = grid[r + 1][c];
        const p4 = grid[r + 1][c + 1];
        const tris = [
          [p1, p2, p4],
          [p1, p4, p3],
        ];
        tris.forEach((tri, idx) => {
          ctx.save();
          ctx.fillStyle = palette.accents[(r + c + idx) % palette.accents.length];
          ctx.globalAlpha = 0.25 + rng() * 0.55;
          ctx.beginPath();
          ctx.moveTo(tri[0].x, tri[0].y);
          ctx.lineTo(tri[1].x, tri[1].y);
          ctx.lineTo(tri[2].x, tri[2].y);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.12)';
          ctx.lineWidth = 1 * scaleFactor;
          ctx.stroke();
          ctx.restore();
        });
      }
    }
  }

  if (motif === 'halftone-pop') {
    const spacing = Math.max(14, (36 - complexity * 2)) * scaleFactor;
    ctx.save();
    for (let y = spacing / 2; y < h; y += spacing) {
      for (let x = spacing / 2; x < w; x += spacing) {
        const t = (x / w + y / h) * 0.5;
        const r = spacing * (0.12 + t * 0.36);
        ctx.fillStyle = palette.accents[Math.floor(t * palette.accents.length) % palette.accents.length];
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  if (motif === 'mandala-radial') {
    const petals = 8 + complexity * 2;
    const rings = 4 + Math.floor(complexity / 2);
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) * 0.44;
    ctx.save();
    ctx.translate(cx, cy);
    for (let ring = rings; ring >= 1; ring--) {
      const r = (ring / rings) * maxR;
      const color = palette.accents[ring % palette.accents.length];
      ctx.fillStyle = color;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5 * scaleFactor;
      ctx.globalAlpha = 0.35 + (ring / rings) * 0.45;
      for (let p = 0; p < petals; p++) {
        ctx.save();
        ctx.rotate((p / petals) * Math.PI * 2 + ring * 0.15);
        ctx.beginPath();
        ctx.ellipse(r * 0.55, 0, r * 0.45, r * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  if (motif === 'editorial-portrait') {
    const cx = w / 2;
    const cy = h * 0.48;
    const unit = Math.min(w, h) * 0.32;
    ctx.save();
    // Editorial backdrop halo
    ctx.fillStyle = palette.accents[0];
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(cx - unit * 0.2, cy - unit * 0.15, unit * 1.05, 0, Math.PI * 2);
    ctx.fill();

    // Stylized geometric bust / shoulders
    ctx.fillStyle = palette.accents[1] || '#f59e0b';
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.ellipse(cx, cy + unit * 0.95, unit * 0.95, unit * 0.65, 0, Math.PI, 0);
    ctx.fill();

    // Head silhouette
    ctx.fillStyle = palette.accents[2] || '#fde047';
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.ellipse(cx, cy - unit * 0.15, unit * 0.44, unit * 0.56, 0, 0, Math.PI * 2);
    ctx.fill();

    // Continuous Matisse-style one-line facial contour
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4 * scaleFactor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.moveTo(cx - unit * 0.22, cy - unit * 0.32);
    ctx.quadraticCurveTo(cx - unit * 0.05, cy - unit * 0.38, cx, cy - unit * 0.28);
    ctx.lineTo(cx - unit * 0.04, cy - unit * 0.02);
    ctx.quadraticCurveTo(cx + unit * 0.06, cy + unit * 0.04, cx + unit * 0.02, cy + unit * 0.08);
    ctx.moveTo(cx + unit * 0.14, cy - unit * 0.28);
    ctx.arc(cx + unit * 0.16, cy - unit * 0.28, unit * 0.03, 0, Math.PI * 2);
    ctx.moveTo(cx - unit * 0.1, cy + unit * 0.18);
    ctx.quadraticCurveTo(cx, cy + unit * 0.25, cx + unit * 0.12, cy + unit * 0.18);
    ctx.stroke();
    ctx.restore();
  }

  // Optional film grain texture
  if (grain > 0) {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const strength = (grain / 100) * 28;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (rng() - 0.5) * strength;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // Subtle editorial highlight vignette / sheen
  const sheen = ctx.createRadialGradient(w * 0.35, h * 0.25, 20, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
  sheen.addColorStop(0, 'rgba(255,255,255,0.14)');
  sheen.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    source: 'procedural',
    width: w,
    height: h,
    seed,
    prompt,
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image blob'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Generates a free AI image via Pollinations.ai and converts it to a local Data URL
 * so canvas PDF/PNG export and offline project saving work without CORS tainting.
 */
export async function generateCloudAIImage(
  prompt: string,
  options: {
    ratio: AspectRatioSpec;
    style: AIArtStyle;
    seed: number;
    signal?: AbortSignal;
  }
): Promise<GeneratedImageResult> {
  const styleEntry = AI_ART_STYLES.find((s) => s.id === options.style);
  const fullPrompt = styleEntry
    ? `${prompt.trim()}, ${styleEntry.promptSuffix}`
    : prompt.trim();

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    fullPrompt
  )}?width=${options.ratio.width}&height=${options.ratio.height}&seed=${options.seed}&nologo=true`;

  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(() => timeoutController.abort(), 22000);

  if (options.signal) {
    options.signal.addEventListener('abort', () => timeoutController.abort(), { once: true });
  }

  try {
    const res = await fetch(url, { signal: timeoutController.signal });
    if (res.status === 429) {
      throw new Error('RATE_LIMITED');
    }
    if (!res.ok) {
      throw new Error(`HTTP_${res.status}`);
    }
    const blob = await res.blob();
    if (!blob.type.startsWith('image/')) {
      throw new Error('INVALID_IMAGE_RESPONSE');
    }
    const dataUrl = await blobToDataUrl(blob);
    return {
      dataUrl,
      source: 'cloud',
      width: options.ratio.width,
      height: options.ratio.height,
      seed: options.seed,
      prompt,
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function generateHybridAIImage(
  prompt: string,
  options: {
    mode: AIEngineMode;
    ratio: AspectRatioSpec;
    style: AIArtStyle;
    motif: ProceduralMotif;
    seed: number;
    complexity?: number;
    grain?: number;
    hdPrint?: boolean;
    customPalette?: { bg1: string; bg2: string; accent1: string; accent2: string };
    signal?: AbortSignal;
  }
): Promise<GeneratedImageResult> {
  if (options.mode === 'procedural') {
    return generateProceduralArtwork(prompt, options);
  }

  try {
    return await generateCloudAIImage(prompt, options);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    if (options.mode === 'cloud') {
      throw err;
    }

    // Hybrid automatic fallback to Instant Procedural Artwork
    const procedural = generateProceduralArtwork(prompt, options);
    const reason =
      message === 'RATE_LIMITED'
        ? 'Free Cloud AI is temporarily busy (rate limit 429). Switched seamlessly to Instant Procedural Art!'
        : 'Cloud AI could not be reached right now. Switched seamlessly to Instant Procedural Art!';

    return {
      ...procedural,
      fallbackNotice: reason,
    };
  }
}
