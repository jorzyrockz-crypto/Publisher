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
  | 'bokeh-glow';

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
  }
): GeneratedImageResult {
  const { ratio, motif, style, seed } = options;
  const effectiveSeed = hashString(`${prompt}|${motif}|${style}|${seed}`);
  const rng = createRng(effectiveSeed);
  const palette = resolvePalette(prompt, seed);

  const canvas = document.createElement('canvas');
  canvas.width = ratio.width;
  canvas.height = ratio.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      dataUrl: '',
      source: 'procedural',
      width: ratio.width,
      height: ratio.height,
      seed,
      prompt,
    };
  }

  const w = ratio.width;
  const h = ratio.height;

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
