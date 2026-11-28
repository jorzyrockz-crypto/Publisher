import type { WordArtStyle } from '../types/publisher';

/**
 * The WordArt catalogue — one list for the gallery, the inspector and the
 * renderer, so a style can never be offered without a class to paint it (the
 * bug that left "Emerald 3D Block" and "Deep Blue" as plain text).
 */
export interface WordArtOption {
  id: WordArtStyle;
  label: string;
  className: string;
  /** Preview needs a dark tile to read (glow styles). */
  dark?: boolean;
}

export const WORD_ART_STYLES: WordArtOption[] = [
  { id: 'gold3d', label: 'Gold 3D Extrusion', className: 'wordart-gold3d' },
  { id: 'rainbow', label: 'Rainbow Gradient', className: 'wordart-rainbow' },
  { id: 'outline', label: 'Cyan Bold Outline', className: 'wordart-outline' },
  { id: 'retro', label: 'Retro Pop 3D', className: 'wordart-retro' },
  { id: 'neon-glow', label: 'Neon Cyber Glow', className: 'wordart-neon-glow', dark: true },
  { id: 'chrome', label: 'Chrome Metallic', className: 'wordart-chrome' },
  { id: 'fire', label: 'Blazing Fire', className: 'wordart-fire' },
  { id: 'comic-pop', label: 'Comic Pop Art', className: 'wordart-comic-pop' },
  { id: 'emerald-3d', label: 'Emerald 3D Block', className: 'wordart-emerald-3d' },
  { id: 'sunset-gradient', label: 'Sunset Vibe', className: 'wordart-sunset-gradient' },
  { id: 'gradient-blue', label: 'Deep Blue Gradient', className: 'wordart-gradient-blue' },
  { id: 'cinematic', label: 'Cinematic Gold', className: 'wordart-cinematic', dark: true },
  { id: 'holographic', label: 'Holographic AI', className: 'wordart-holographic', dark: true },
  { id: 'varsity', label: 'Varsity Block', className: 'wordart-varsity' },
  { id: 'synth-chrome', label: 'Synthwave AI Chrome', className: 'wordart-synth-chrome', dark: true },
  { id: 'liquid-glass', label: 'Liquid Glass Chrome', className: 'wordart-liquid-glass', dark: true },
  { id: 'rose-gold', label: 'Molten Rose Gold', className: 'wordart-rose-gold' },
  { id: 'cyber-acid', label: 'Cyberpunk Acid', className: 'wordart-cyber-acid', dark: true },
  { id: 'obsidian-gold', label: 'Obsidian & Gold Foil', className: 'wordart-obsidian-gold' },
  { id: 'candy-gloss', label: 'Candy 3D Gloss', className: 'wordart-candy-gloss' },
  // Poster stickers — the tarpapel / school-event look: a cheerful ramp inside a fat white
  // die-cut border with a paper-lift shadow, so the word survives a busy photo behind it.
  { id: 'sticker-royal', label: 'Royal Sticker Pop', className: 'wordart-sticker-royal', dark: true },
  { id: 'sticker-forest', label: 'Fresh Leaf Sticker', className: 'wordart-sticker-forest', dark: true },
  { id: 'sticker-coral', label: 'Warm Coral Sticker', className: 'wordart-sticker-coral' },
  { id: 'sticker-teal', label: 'Deep Teal Sticker', className: 'wordart-sticker-teal', dark: true },
  // Flat ink on a painted highlight — the brush-swipe and pastel-pill headline.
  { id: 'brush-sunshine', label: 'Sunshine Brush Swipe', className: 'wordart-brush-sunshine' },
  { id: 'brush-blush', label: 'Pastel Blush Ribbon', className: 'wordart-brush-blush' },
  { id: 'pill-highlight', label: 'Pastel Pill Highlight', className: 'wordart-pill-highlight' },
  // Eco campaign: pine, gold, wood and ribbon.
  { id: 'eco-champion', label: 'Eco Champion Gold', className: 'wordart-eco-champion' },
  { id: 'eco-leaf', label: 'Eco Leaf Block', className: 'wordart-eco-leaf' },
  {
    id: 'wood-plank-action',
    label: 'Rustic Wood Plank',
    className: 'wordart-wood-plank-action',
  },
  { id: 'eco-ribbon', label: 'Forest Ribbon Banner', className: 'wordart-eco-ribbon' },
  {
    id: 'forest-script-sticker',
    label: 'Pine Script Sticker',
    className: 'wordart-forest-script-sticker',
  },
  // Fiesta and award: trophy metal, a fiesta spectrum, parchment script and a wood sign.
  { id: 'trophy-gold', label: 'Award Trophy Gold', className: 'wordart-trophy-gold' },
  { id: 'fiesta-mosaic', label: 'Fiesta Spectrum Sticker', className: 'wordart-fiesta-mosaic' },
  {
    id: 'parchment-script',
    label: 'Parchment Brush Script',
    className: 'wordart-parchment-script',
  },
  { id: 'folklore-wood', label: 'Folklore Wood Sign', className: 'wordart-folklore-wood' },
  // Children's books and reading corners.
  { id: 'storybook-crayon', label: 'Storybook Crayon Pop', className: 'wordart-storybook-crayon' },
  { id: 'fairytale-sparkle', label: 'Fairytale Magic', className: 'wordart-fairytale-sparkle' },
  {
    id: 'reading-nook-sage',
    label: 'Cozy Sage Nook',
    className: 'wordart-reading-nook-sage',
  },
  { id: 'storytime-banner', label: 'Storytime Ribbon', className: 'wordart-storytime-banner' },
  // Reading-corner forms: a school-blue banner, a coral welcome, a gold logbook ribbon.
  {
    id: 'champs-basa-blue',
    label: 'Basa Blue Banner',
    className: 'wordart-champs-basa-blue',
    dark: true,
  },
  {
    id: 'champs-kasadya-coral',
    label: 'Kasadya Coral',
    className: 'wordart-champs-kasadya-coral',
  },
  {
    id: 'champs-gold-ribbon',
    label: 'Champs Gold Ribbon',
    className: 'wordart-champs-gold-ribbon',
  },
  // Portfolios: quiet, trimmed, at 800.
  {
    id: 'portfolio-editorial',
    label: 'Editorial Slate & Gold',
    className: 'wordart-portfolio-editorial',
  },
  { id: 'portfolio-indigo', label: 'Modern Indigo Ink', className: 'wordart-portfolio-indigo' },
];

const BY_ID = new Map<string, WordArtOption>(WORD_ART_STYLES.map((s) => [s.id, s]));

/** The CSS class that paints a style, or '' for plain text. */
export function wordArtClassName(style?: WordArtStyle): string {
  if (!style || style === 'none') return '';
  return BY_ID.get(style)?.className ?? '';
}

/** Every style the UI offers, with "none" first. */
export function wordArtPickerOptions(): WordArtOption[] {
  return [{ id: 'none', label: 'Standard Text', className: 'text-slate-700' }, ...WORD_ART_STYLES];
}

/* ------------------------------------------------------------------ *
 * Paint specs — the same numbers the CSS uses, so the canvas exporter
 * and the DOM paint identically. src/index.css keeps the rules only for
 * the gallery previews, and a test asserts the two never drift apart.
 * ------------------------------------------------------------------ */

export interface WordArtShadow {
  dx: number;
  dy: number;
  blur: number;
  color: string;
}

export interface WordArtGradient {
  /** CSS angle in degrees: 180 = top→bottom, 135 = down-right. */
  angle: number;
  stops: { offset: number; color: string }[];
}

/**
 * Programmatic 3D block: `steps` copies of the glyphs marching back along
 * (dx, dy), the colour running start→end. CSS gets the same marching copies
 * as a drop-shadow chain, so the DOM, the canvas and the PDF agree.
 */
export interface WordArtExtrusion {
  steps: number;
  dx: number;
  dy: number;
  startColor: string;
  endColor: string;
}

/**
 * A painted highlight behind the letters.
 *
 * The numbers are *padding*, in element pixels, and they are deliberately generous: a highlighter
 * runs past the word, and a swipe that stops dead at the glyph box looks like a text background
 * rather than paint. Geometry, not an image — the DOM and the exporter share one path.
 */
export interface WordArtBackdrop {
  type: 'brush-swipe' | 'pastel-pill' | 'wood-plank' | 'ribbon-banner';
  color: string;
  /** How far the highlight runs past the glyph box, horizontally. */
  paddingX?: number;
  /** …and vertically. */
  paddingY?: number;
}

export interface WordArtPaint {
  /** The style forces a heavier weight than the document's. */
  weight: '800' | '900';
  /** Some styles are only right in italic (synthwave, liquid metal). */
  italic?: boolean;
  fill?: string;
  gradient?: WordArtGradient;
  stroke?: { width: number; color: string };
  /**
   * A poster border: the declared width is the width you *see*, not the width of a centred
   * stroke. Both renderers double it and hide the inner half under the fill, so a 6px sticker
   * border reads as 6px of white instead of 3.
   */
  heavyStroke?: boolean;
  shadows: WordArtShadow[];
  /** Marching 3D block, painted behind everything. */
  extrusion?: WordArtExtrusion;
  /** Soft light spills (painted furthest back). */
  bloom?: { blur: number; color: string }[];
  /** One long cast shadow, painted after the extrusion. */
  castShadow?: WordArtShadow;
  /** A pass of sparkles over the finished letters. */
  glints?: boolean;
  /** A painted highlight, drawn furthest back — behind every shadow. */
  backdrop?: WordArtBackdrop;
  /**
   * A default arc for the style, on the Curve control's scale (÷100). The element's own
   * `textCurve` overrides it, so a template can arch one line without changing the style.
   */
  arc?: number;
}

/** The three passes that make a swipe look painted rather than drawn. */
export const SWIPE_LAYERS: { dy: number; dh: number; alpha: number; tilt: number }[] = [
  { dy: 0, dh: 0, alpha: 0.95, tilt: -0.012 },
  { dy: -2, dh: -4, alpha: 0.75, tilt: 0.008 },
  { dy: 3, dh: -6, alpha: 0.65, tilt: -0.005 },
];

/** One command of a path. Small on purpose: enough for a brush, portable to both painters. */
export type WordArtPathCommand =
  | { c: 'M'; x: number; y: number }
  | { c: 'L'; x: number; y: number }
  | { c: 'Q'; cx: number; cy: number; x: number; y: number };

/**
 * The swipe outline, centred on (0,0), as commands rather than an SVG string.
 *
 * Commands are the only description that both painters can execute exactly: the DOM joins them
 * into a `d` attribute, the exporter traces them with `moveTo`/`lineTo`/`quadraticCurveTo`. An
 * SVG string would force the canvas side to depend on `Path2D`, which is not global in every
 * runtime — and without it, the highlight silently degrades to a rectangle.
 */
export function brushSwipeCommands(width: number, height: number): WordArtPathCommand[] {
  const hw = width / 2;
  const hh = height / 2;
  // Bristle offsets, as a fraction of the stroke height. Fixed numbers, not `Math.random()`: the
  // editor and the export must paint the identical shape, and a rerender must not twitch.
  const top = [0.06, -0.1, 0.12, -0.02, 0.14, -0.08, 0.1, 0];
  const bottom = [-0.08, 0.06, -0.14, 0.02, -0.1, 0.08, -0.04, 0];
  const steps = top.length - 1;
  const commands: WordArtPathCommand[] = [];

  // The stroke starts a little inside the box and swells as it travels — the pressed start of a
  // loaded brush, not a clipped rectangle edge.
  commands.push({ c: 'M', x: -hw + width * 0.02, y: -hh + hh * top[0] });
  for (let i = 1; i <= steps; i += 1) {
    commands.push({
      c: 'L',
      x: -hw + (width * i) / steps,
      y: -hh + hh * top[i],
    });
  }
  // Right-hand tail: lifts up and thins out past the box, then hooks back.
  commands.push({ c: 'L', x: hw + hh * 0.5, y: -hh * 0.5 });
  commands.push({ c: 'L', x: hw + hh * 0.18, y: hh * 0.16 });
  commands.push({ c: 'L', x: hw - width * 0.01, y: hh + hh * bottom[0] });
  for (let i = 1; i <= steps; i += 1) {
    commands.push({
      c: 'L',
      x: -hw + (width * (steps - i)) / steps,
      y: hh + hh * bottom[i],
    });
  }
  commands.push({ c: 'L', x: -hw - hh * 0.4, y: hh * 0.4 });
  commands.push({ c: 'L', x: -hw - hh * 0.1, y: -hh * 0.2 });
  return commands;
}

/** A pill (stadium) outline: straight runs with quarter-turn corners. */
export function pillCommands(width: number, height: number): WordArtPathCommand[] {
  const w = width / 2;
  const h = height / 2;
  const r = Math.max(1, Math.min(h, w));
  return [
    { c: 'M', x: -w + r, y: -h },
    { c: 'L', x: w - r, y: -h },
    { c: 'Q', cx: w, cy: -h, x: w, y: -h + r },
    { c: 'L', x: w, y: h - r },
    { c: 'Q', cx: w, cy: h, x: w - r, y: h },
    { c: 'L', x: -w + r, y: h },
    { c: 'Q', cx: -w, cy: h, x: -w, y: h - r },
    { c: 'L', x: -w, y: -h + r },
    { c: 'Q', cx: -w, cy: -h, x: -w + r, y: -h },
  ];
}

/**
 * A swallowtail ribbon: both ends cut inward to the vertical middle.
 *
 * The notches are part of the *outline*, not a pair of triangles glued on, so the ribbon exports as
 * one filled shape with no seams where the cuts meet the band.
 */
export function ribbonBannerCommands(width: number, height: number): WordArtPathCommand[] {
  const hw = width / 2;
  const hh = height / 2;
  const notch = hh * 0.7;
  return [
    { c: 'M', x: -hw - notch, y: -hh },
    { c: 'L', x: hw + notch, y: -hh },
    { c: 'L', x: hw, y: 0 },
    { c: 'L', x: hw + notch, y: hh },
    { c: 'L', x: -hw - notch, y: hh },
    { c: 'L', x: -hw, y: 0 },
  ];
}

/**
 * A hand-cut plank: no two edges quite parallel, the right end longer than the left, the bottom
 * sagging. Straight commands only — a plank sawn by a person is irregular, not bezier-smooth.
 */
export function woodPlankCommands(width: number, height: number): WordArtPathCommand[] {
  const hw = width / 2;
  const hh = height / 2;
  const bite = Math.max(2, Math.min(6, hh * 0.12));
  return [
    { c: 'M', x: -hw + bite, y: -hh + bite * 0.5 },
    { c: 'L', x: hw - bite * 0.4, y: -hh },
    { c: 'L', x: hw + bite * 0.8, y: -hh * 0.1 },
    { c: 'L', x: hw - bite * 0.8, y: hh },
    { c: 'L', x: -hw, y: hh - bite * 0.5 },
    { c: 'L', x: -hw - bite, y: 0 },
  ];
}

/** One wood-grain streak, `index` of `count`, as a shallow quad across the plank. */
export function woodGrainCommands(
  width: number,
  height: number,
  index: number,
  count = 4
): WordArtPathCommand[] {
  const hw = width / 2;
  const hh = height / 2;
  const y = -hh + (height / (count + 1)) * (index + 1);
  const wobble = height * 0.03 * (index % 2 === 0 ? 1 : -1);
  return [
    { c: 'M', x: -hw + Math.max(3, height * 0.05), y },
    { c: 'Q', cx: 0, cy: y + wobble, x: hw - Math.max(3, height * 0.05), y },
  ];
}

/** The same commands as an SVG `d`, for the DOM layer. */
export function pathCommandToSvg(commands: WordArtPathCommand[]): string {
  const n = (value: number) => Math.round(value * 100) / 100;
  return (
    commands
      .map((command) =>
        command.c === 'Q'
          ? `Q ${n(command.cx)} ${n(command.cy)} ${n(command.x)} ${n(command.y)}`
          : `${command.c} ${n(command.x)} ${n(command.y)}`
      )
      .join(' ') + ' Z'
  );
}

/** Convenience for the DOM and for tests. */
export const brushSwipePath = (width: number, height: number) =>
  pathCommandToSvg(brushSwipeCommands(width, height));

export const pillPath = (width: number, height: number) =>
  pathCommandToSvg(pillCommands(width, height));

export interface WordArtBackdropLayer {
  /** Path centred on (0,0), in the padded box's pixels. */
  commands: WordArtPathCommand[];
  /** The same path as an SVG `d`, so the DOM does not have to re-derive it. */
  d: string;
  /** Solid fill; when absent the backdrop's own `color` is used. */
  fill?: string;
  /** Gradient fill (measured across the padded box), painted instead of `fill`. */
  gradient?: WordArtGradient;
  /** Stroke this layer's outline instead of filling it — wood grain, plank borders. */
  stroke?: { color: string; width: number };
  dy: number;
  tilt: number;
  alpha: number;
}

/**
 * Everything a renderer needs to paint a style's highlight over a glyph box: the padded box, the
 * fill, and one or three layers. Returns undefined when the style has no backdrop or no box.
 */
export function wordArtBackdropLayers(
  style: WordArtStyle | undefined,
  box: { x: number; y: number; width: number; height: number } | undefined
):
  | {
      fill: string;
      box: { x: number; y: number; width: number; height: number };
      layers: WordArtBackdropLayer[];
    }
  | undefined {
  const backdrop = wordArtPaint(style)?.backdrop;
  if (!backdrop || !box) return undefined;

  const padX = backdrop.paddingX ?? 24;
  const padY = backdrop.paddingY ?? 10;
  const padded = {
    x: box.x - padX,
    y: box.y - padY,
    width: Math.max(2, box.width + padX * 2),
    height: Math.max(2, box.height + padY * 2),
  };

  if (backdrop.type === 'ribbon-banner') {
    const commands = ribbonBannerCommands(padded.width, padded.height);
    return {
      fill: backdrop.color,
      box: padded,
      layers: [{ commands, d: pathCommandToSvg(commands), dy: 0, tilt: 0, alpha: 1 }],
    };
  }

  if (backdrop.type === 'wood-plank') {
    const plank = woodPlankCommands(padded.width, padded.height);
    const layers: WordArtBackdropLayer[] = [
      {
        commands: plank,
        d: pathCommandToSvg(plank),
        // Light at the top edge, the backdrop's own tone through the middle, shadow at the bottom —
        // the same three-stop ramp the CSS preview used to fake with a linear-gradient.
        gradient: {
          angle: 180,
          stops: [
            { offset: 0, color: '#92400e' },
            { offset: 0.5, color: backdrop.color },
            { offset: 1, color: '#451a03' },
          ],
        },
        dy: 0,
        tilt: 0,
        alpha: 1,
      },
    ];
    for (let index = 0; index < 4; index += 1) {
      const grain = woodGrainCommands(padded.width, padded.height, index);
      layers.push({
        commands: grain,
        d: pathCommandToSvg(grain),
        stroke: { color: 'rgba(42, 16, 4, 0.35)', width: 1.5 },
        dy: 0,
        tilt: 0,
        alpha: 1,
      });
    }
    layers.push({
      commands: plank,
      d: pathCommandToSvg(plank),
      stroke: { color: '#451a03', width: 2 },
      dy: 0,
      tilt: 0,
      alpha: 1,
    });
    return { fill: backdrop.color, box: padded, layers };
  }

  if (backdrop.type === 'pastel-pill') {
    return {
      fill: backdrop.color,
      box: padded,
      layers: [
        {
          commands: pillCommands(padded.width, padded.height),
          d: pillPath(padded.width, padded.height),
          dy: 0,
          tilt: 0,
          alpha: 1,
        },
      ],
    };
  }

  return {
    fill: backdrop.color,
    box: padded,
    layers: SWIPE_LAYERS.map((layer) => {
      const commands = brushSwipeCommands(padded.width, padded.height + layer.dh);
      return {
        commands,
        d: pathCommandToSvg(commands),
        dy: layer.dy,
        tilt: layer.tilt,
        alpha: layer.alpha,
      };
    }),
  };
}

/** Whether a style paints a highlight at all — used by the composition pass and the DOM. */
/** The colour a style paints behind its letters, if it paints one at all. */
export function wordArtBackdropColor(style?: WordArtStyle): string | undefined {
  return wordArtPaint(style)?.backdrop?.color;
}

export function wordArtHasBackdrop(style?: WordArtStyle): boolean {
  return Boolean(wordArtPaint(style)?.backdrop);
}

const PAINT: Partial<Record<WordArtStyle, WordArtPaint>> = {
  rainbow: {
    weight: '900',
    gradient: {
      angle: 135,
      stops: [
        { offset: 0, color: '#f43f5e' },
        { offset: 0.25, color: '#fb923c' },
        { offset: 0.5, color: '#facc15' },
        { offset: 0.75, color: '#10b981' },
        { offset: 1, color: '#3b82f6' },
      ],
    },
    shadows: [{ dx: 0, dy: 2, blur: 4, color: 'rgba(0,0,0,0.15)' }],
  },
  gold3d: {
    weight: '800',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#fde68a' },
        { offset: 0.45, color: '#f59e0b' },
        { offset: 1, color: '#b45309' },
      ],
    },
    // the brown edge is what keeps gold legible on cream certificates
    stroke: { width: 2, color: '#7c2d12' },
    shadows: [
      { dx: 0, dy: 2, blur: 3, color: 'rgba(120,53,15,0.35)' },
      { dx: 0, dy: 4, blur: 10, color: 'rgba(0,0,0,0.18)' },
    ],
  },
  outline: {
    weight: '900',
    fill: '#ffffff',
    stroke: { width: 2, color: '#0f766e' },
    shadows: [{ dx: 2, dy: 3, blur: 0, color: 'rgba(15,118,110,0.3)' }],
  },
  retro: {
    weight: '800',
    fill: '#ec4899',
    shadows: [
      { dx: 3, dy: 3, blur: 0, color: '#06b6d4' },
      { dx: 5, dy: 5, blur: 0, color: '#3b82f6' },
    ],
  },
  'neon-glow': {
    weight: '900',
    fill: '#e0f2fe',
    shadows: [
      { dx: 0, dy: 0, blur: 6, color: '#38bdf8' },
      { dx: 0, dy: 0, blur: 14, color: '#0284c7' },
      { dx: 0, dy: 0, blur: 28, color: '#ec4899' },
    ],
  },
  chrome: {
    weight: '900',
    gradient: {
      angle: 180,
      // 49% → 50% is the horizon: a bright sky snapping into a dark reflection
      stops: [
        { offset: 0, color: '#ffffff' },
        { offset: 0.32, color: '#dbe3ec' },
        { offset: 0.49, color: '#93a4b8' },
        { offset: 0.5, color: '#38455c' },
        { offset: 0.62, color: '#7c8ba1' },
        { offset: 0.8, color: '#c3cedd' },
        { offset: 1, color: '#f2f6fa' },
      ],
    },
    stroke: { width: 1.5, color: '#1e293b' },
    shadows: [{ dx: 0, dy: 2, blur: 3, color: 'rgba(15,23,42,0.45)' }],
  },
  fire: {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#fef08a' },
        { offset: 0.55, color: '#f97316' },
        { offset: 1, color: '#dc2626' },
      ],
    },
    shadows: [{ dx: 0, dy: 3, blur: 8, color: 'rgba(239,68,68,0.55)' }],
  },
  'comic-pop': {
    weight: '900',
    fill: '#facc15',
    stroke: { width: 2, color: '#0f172a' },
    shadows: [{ dx: 4, dy: 4, blur: 0, color: '#0f172a' }],
  },
  'emerald-3d': {
    weight: '900',
    fill: '#10b981',
    shadows: [
      { dx: 1, dy: 1, blur: 0, color: '#065f46' },
      { dx: 2, dy: 2, blur: 0, color: '#064e3b' },
      { dx: 3, dy: 3, blur: 0, color: '#022c22' },
      { dx: 4, dy: 5, blur: 8, color: 'rgba(0,0,0,0.35)' },
    ],
  },
  'sunset-gradient': {
    weight: '900',
    gradient: {
      angle: 135,
      stops: [
        { offset: 0, color: '#ec4899' },
        { offset: 0.55, color: '#f97316' },
        { offset: 1, color: '#facc15' },
      ],
    },
    shadows: [{ dx: 0, dy: 2, blur: 4, color: 'rgba(236,72,153,0.3)' }],
  },
  'gradient-blue': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#93c5fd' },
        { offset: 0.48, color: '#3b82f6' },
        { offset: 1, color: '#1d4ed8' },
      ],
    },
    shadows: [{ dx: 0, dy: 2, blur: 4, color: 'rgba(29,78,216,0.35)' }],
  },
  // Film-title gold: warm rim light, a deep ink edge so it survives a pale
  // backdrop, and a long soft cast shadow for depth.
  cinematic: {
    weight: '900',
    gradient: {
      angle: 178,
      stops: [
        { offset: 0, color: '#fff4d6' },
        { offset: 0.34, color: '#f0b45a' },
        { offset: 0.62, color: '#c8842e' },
        { offset: 1, color: '#f7e2b2' },
      ],
    },
    stroke: { width: 3, color: '#1b1206' },
    shadows: [
      { dx: 0, dy: 3, blur: 10, color: 'rgba(255,176,74,0.45)' },
      { dx: 0, dy: 10, blur: 26, color: 'rgba(0,0,0,0.55)' },
    ],
  },
  // Iridescent foil — the "AI render" look: violet to cyan to pink, lifted by
  // a cool bloom and held together with a near-black edge.
  holographic: {
    weight: '900',
    gradient: {
      angle: 135,
      // the white stop at 44% is the specular glint that sells the foil
      stops: [
        { offset: 0, color: '#a78bfa' },
        { offset: 0.2, color: '#22d3ee' },
        { offset: 0.44, color: '#f8fafc' },
        { offset: 0.46, color: '#f472b6' },
        { offset: 0.7, color: '#fde68a' },
        { offset: 1, color: '#c4b5fd' },
      ],
    },
    stroke: { width: 2, color: '#160f2e' },
    shadows: [
      { dx: 0, dy: 0, blur: 12, color: 'rgba(34,211,238,0.5)' },
      { dx: 0, dy: 2, blur: 4, color: 'rgba(10,10,30,0.45)' },
    ],
  },
  // College block letters: crisp white edge, hard offset shadow, no gradient.
  varsity: {
    weight: '900',
    fill: '#dc2626',
    stroke: { width: 4, color: '#ffffff' },
    shadows: [{ dx: 4, dy: 4, blur: 0, color: '#1e293b' }],
  },
  // Horizon-break metal: gold sky, a hard snap into indigo water, cyan bounce
  // under it, a six-step ember block and a violet bloom — the "AI render" look.
  'synth-chrome': {
    weight: '900',
    italic: true,
    glints: true,
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#fff9c4' },
        { offset: 0.24, color: '#ffca3a' },
        { offset: 0.48, color: '#ff6ec7' },
        { offset: 0.5, color: '#1e1b4b' },
        { offset: 0.72, color: '#2563eb' },
        { offset: 0.9, color: '#38bdf8' },
        { offset: 1, color: '#e0f2fe' },
      ],
    },
    stroke: { width: 2, color: '#fef08a' },
    extrusion: { steps: 6, dx: 0.8, dy: 1.3, startColor: '#ff7b00', endColor: '#9a1c00' },
    bloom: [{ blur: 14, color: 'rgba(168, 85, 247, 0.55)' }],
    castShadow: { dx: 0, dy: 10, blur: 16, color: 'rgba(0, 0, 0, 0.65)' },
    shadows: [],
  },
  'liquid-glass': {
    weight: '900',
    glints: true,
    gradient: {
      angle: 175,
      stops: [
        { offset: 0, color: '#ffffff' },
        { offset: 0.28, color: '#e0f2fe' },
        { offset: 0.47, color: '#94a3b8' },
        { offset: 0.5, color: '#1e293b' },
        { offset: 0.68, color: '#cbd5e1' },
        { offset: 0.86, color: '#f8fafc' },
        { offset: 1, color: '#c4b5fd' },
      ],
    },
    stroke: { width: 1.5, color: '#ffffff' },
    extrusion: { steps: 4, dx: 0, dy: 1.2, startColor: '#64748b', endColor: '#0f172a' },
    bloom: [{ blur: 12, color: 'rgba(125, 211, 252, 0.45)' }],
    castShadow: { dx: 0, dy: 8, blur: 14, color: 'rgba(15, 23, 42, 0.45)' },
    shadows: [],
  },
  'rose-gold': {
    weight: '900',
    glints: true,
    gradient: {
      angle: 165,
      stops: [
        { offset: 0, color: '#fff7ed' },
        { offset: 0.25, color: '#fed7aa' },
        { offset: 0.44, color: '#f472b6' },
        { offset: 0.48, color: '#831843' },
        { offset: 0.65, color: '#fb7185' },
        { offset: 0.85, color: '#fda4af' },
        { offset: 1, color: '#fff1f2' },
      ],
    },
    stroke: { width: 2, color: '#ffedd5' },
    extrusion: { steps: 5, dx: 0.6, dy: 1.2, startColor: '#be185d', endColor: '#4c0519' },
    bloom: [{ blur: 12, color: 'rgba(251, 113, 133, 0.4)' }],
    castShadow: { dx: 0, dy: 8, blur: 14, color: 'rgba(0, 0, 0, 0.45)' },
    shadows: [],
  },
  'cyber-acid': {
    weight: '900',
    italic: true,
    gradient: {
      angle: 135,
      stops: [
        { offset: 0, color: '#ecfccb' },
        { offset: 0.35, color: '#a3e635' },
        { offset: 0.7, color: '#22d3ee' },
        { offset: 1, color: '#06b6d4' },
      ],
    },
    stroke: { width: 3, color: '#09090b' },
    extrusion: { steps: 5, dx: 1.2, dy: 1.2, startColor: '#ec4899', endColor: '#831843' },
    bloom: [{ blur: 14, color: 'rgba(163, 230, 53, 0.5)' }],
    castShadow: { dx: 0, dy: 8, blur: 12, color: 'rgba(0, 0, 0, 0.6)' },
    shadows: [],
  },
  // Self-contained on light or dark: a glossy charcoal face with a hard
  // diagonal sheen and a gold foil edge.
  'obsidian-gold': {
    weight: '900',
    gradient: {
      angle: 155,
      stops: [
        { offset: 0, color: '#52525b' },
        { offset: 0.35, color: '#18181b' },
        { offset: 0.47, color: '#f4f4f5' },
        { offset: 0.51, color: '#09090b' },
        { offset: 0.85, color: '#27272a' },
        { offset: 1, color: '#71717a' },
      ],
    },
    stroke: { width: 3, color: '#f59e0b' },
    extrusion: { steps: 4, dx: 0.5, dy: 1.1, startColor: '#b45309', endColor: '#451a03' },
    castShadow: { dx: 0, dy: 6, blur: 12, color: 'rgba(0, 0, 0, 0.5)' },
    shadows: [],
  },
  'candy-gloss': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#ffffff' },
        { offset: 0.14, color: '#fda4af' },
        { offset: 0.5, color: '#f43f5e' },
        { offset: 0.85, color: '#e11d48' },
        { offset: 1, color: '#9f1239' },
      ],
    },
    stroke: { width: 4, color: '#ffffff' },
    extrusion: { steps: 5, dx: 0, dy: 1.4, startColor: '#881337', endColor: '#4c0519' },
    castShadow: { dx: 0, dy: 8, blur: 12, color: 'rgba(76, 5, 25, 0.4)' },
    shadows: [],
  },
  // ---- poster stickers ------------------------------------------------------------------
  // Three bright stops on a vertical ramp, a fat white border and a soft paper-lift shadow.
  // No horizon break and no chrome: these are meant to be read from across a school yard.
  'sticker-royal': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#38bdf8' },
        { offset: 0.45, color: '#2563eb' },
        { offset: 1, color: '#1e3a8a' },
      ],
    },
    stroke: { width: 6, color: '#ffffff' },
    castShadow: { dx: 0, dy: 4, blur: 10, color: 'rgba(15, 23, 42, 0.28)' },
    heavyStroke: true,
    shadows: [],
  },
  'sticker-forest': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#4ade80' },
        { offset: 0.5, color: '#16a34a' },
        { offset: 1, color: '#14532d' },
      ],
    },
    stroke: { width: 7, color: '#ffffff' },
    castShadow: { dx: 0, dy: 5, blur: 12, color: 'rgba(20, 83, 45, 0.28)' },
    heavyStroke: true,
    shadows: [],
  },
  'sticker-coral': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#fbbf24' },
        { offset: 0.42, color: '#f97316' },
        { offset: 1, color: '#dc2626' },
      ],
    },
    stroke: { width: 7, color: '#ffffff' },
    castShadow: { dx: 0, dy: 5, blur: 12, color: 'rgba(153, 27, 27, 0.28)' },
    heavyStroke: true,
    shadows: [],
  },
  'sticker-teal': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#2dd4bf' },
        { offset: 0.55, color: '#0f766e' },
        { offset: 1, color: '#134e4a' },
      ],
    },
    stroke: { width: 6, color: '#ffffff' },
    castShadow: { dx: 0, dy: 4, blur: 10, color: 'rgba(19, 78, 74, 0.25)' },
    heavyStroke: true,
    shadows: [],
  },
  // Navy ink on a sunshine swipe: the highlight does the shouting, the type stays calm.
  'brush-sunshine': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#1e3a8a' },
        { offset: 1, color: '#0f172a' },
      ],
    },
    backdrop: { type: 'brush-swipe', color: '#facc15', paddingX: 28, paddingY: 12 },
    shadows: [],
  },
  // The softer sibling, for teacher-wellness and quote cards.
  'brush-blush': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#be123c' },
        { offset: 1, color: '#881337' },
      ],
    },
    backdrop: { type: 'brush-swipe', color: '#fbcfe8', paddingX: 24, paddingY: 10 },
    // A blush ribbon reads as a banner, so the style arches slightly; type it flat and it looks
    // like a highlight floating off the word.
    arc: 0.12,
    shadows: [],
  },
  // Indigo ink on a pastel pill: the same idea, tidier, for agendas.
  'pill-highlight': {
    weight: '900',
    fill: '#1e1b4b',
    backdrop: { type: 'pastel-pill', color: '#e0e7ff', paddingX: 22, paddingY: 10 },
    shadows: [],
  },
  // ---- eco campaign ---------------------------------------------------------------------
  // Plant-a-tree posters: pine and gold, wood and ribbon. Same grammar as the stickers — a heavy
  // authored rim doing the contrast work — but the palette is forest rather than candy.
  'eco-champion': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#fef08a' },
        { offset: 0.45, color: '#facc15' },
        { offset: 0.85, color: '#eab308' },
        { offset: 1, color: '#ca8a04' },
      ],
    },
    // A pine rim, not white: this is painted signwork, so the outline reads as ink.
    stroke: { width: 6, color: '#14532d' },
    heavyStroke: true,
    extrusion: { steps: 4, dx: 0, dy: 1.5, startColor: '#14532d', endColor: '#052e16' },
    castShadow: { dx: 0, dy: 6, blur: 10, color: 'rgba(5, 46, 22, 0.35)' },
    shadows: [],
  },
  'eco-leaf': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#22c55e' },
        { offset: 0.55, color: '#15803d' },
        { offset: 1, color: '#14532d' },
      ],
    },
    stroke: { width: 4, color: '#ffffff' },
    castShadow: { dx: 0, dy: 4, blur: 8, color: 'rgba(20, 83, 45, 0.25)' },
    shadows: [],
  },
  'wood-plank-action': {
    weight: '900',
    italic: true,
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#ffffff' },
        { offset: 0.7, color: '#fef3c7' },
        { offset: 1, color: '#fde68a' },
      ],
    },
    castShadow: { dx: 2, dy: 4, blur: 4, color: 'rgba(42, 20, 6, 0.75)' },
    backdrop: { type: 'wood-plank', color: '#78350f', paddingX: 44, paddingY: 14 },
    shadows: [],
  },
  'eco-ribbon': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#ffffff' },
        { offset: 1, color: '#f0fdf4' },
      ],
    },
    backdrop: { type: 'ribbon-banner', color: '#14532d', paddingX: 36, paddingY: 10 },
    shadows: [],
  },
  'forest-script-sticker': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#166534' },
        { offset: 1, color: '#052e16' },
      ],
    },
    stroke: { width: 6, color: '#ffffff' },
    heavyStroke: true,
    castShadow: { dx: 0, dy: 3, blur: 8, color: 'rgba(0, 0, 0, 0.28)' },
    shadows: [],
  },
  // ---- fiesta & award -------------------------------------------------------------------
  // Trophy gold is the one place a horizon break is not "AI chrome": an award seal has a hard
  // bronze reflection band, and the whole point is that the top half is lit.
  'trophy-gold': {
    weight: '900',
    glints: true,
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#fffbeb' },
        { offset: 0.28, color: '#fde047' },
        { offset: 0.48, color: '#eab308' },
        { offset: 0.51, color: '#92400e' },
        { offset: 0.72, color: '#f59e0b' },
        { offset: 0.9, color: '#fef08a' },
        { offset: 1, color: '#ca8a04' },
      ],
    },
    stroke: { width: 2.5, color: '#fef9c3' },
    extrusion: { steps: 5, dx: 0.5, dy: 1.3, startColor: '#b45309', endColor: '#451a03' },
    bloom: [{ blur: 16, color: 'rgba(250, 204, 21, 0.48)' }],
    castShadow: { dx: 0, dy: 8, blur: 14, color: 'rgba(0, 0, 0, 0.65)' },
    shadows: [],
  },
  // A horizontal sweep, not a vertical one: every letter gets its own fiesta hue, which is the
  // only way a one-word headline can carry six colours without looking striped.
  'fiesta-mosaic': {
    weight: '900',
    gradient: {
      angle: 90,
      stops: [
        { offset: 0, color: '#dc2626' },
        { offset: 0.22, color: '#eab308' },
        { offset: 0.42, color: '#ea580c' },
        { offset: 0.62, color: '#16a34a' },
        { offset: 0.8, color: '#0d9488' },
        { offset: 1, color: '#78350f' },
      ],
    },
    stroke: { width: 7, color: '#ffffff' },
    heavyStroke: true,
    castShadow: { dx: 0, dy: 5, blur: 12, color: 'rgba(0, 0, 0, 0.4)' },
    shadows: [],
  },
  'parchment-script': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#18181b' },
        { offset: 1, color: '#09090b' },
      ],
    },
    backdrop: { type: 'brush-swipe', color: '#fef3c7', paddingX: 32, paddingY: 12 },
    shadows: [],
  },
  'folklore-wood': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#fffbeb' },
        { offset: 0.65, color: '#fde68a' },
        { offset: 1, color: '#f59e0b' },
      ],
    },
    stroke: { width: 3.5, color: '#291002' },
    castShadow: { dx: 0, dy: 4, blur: 6, color: 'rgba(0, 0, 0, 0.7)' },
    backdrop: { type: 'wood-plank', color: '#78350f', paddingX: 44, paddingY: 14 },
    shadows: [],
  },
  // ---- children's books & reading corners ------------------------------------------------
  // Crayon-bright, die-cut, and unafraid: these are read by a five-year-old across a classroom.
  'storybook-crayon': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#fde047' },
        { offset: 0.5, color: '#fb923c' },
        { offset: 1, color: '#f43f5e' },
      ],
    },
    stroke: { width: 4, color: '#ffffff' },
    heavyStroke: true,
    extrusion: { steps: 4, dx: 0, dy: 1.5, startColor: '#1d4ed8', endColor: '#1e3a8a' },
    castShadow: { dx: 0, dy: 6, blur: 10, color: 'rgba(30, 58, 138, 0.3)' },
    shadows: [],
  },
  'fairytale-sparkle': {
    weight: '900',
    glints: true,
    gradient: {
      angle: 160,
      stops: [
        { offset: 0, color: '#fdf4ff' },
        { offset: 0.35, color: '#e879f9' },
        { offset: 0.7, color: '#818cf8' },
        { offset: 1, color: '#38bdf8' },
      ],
    },
    stroke: { width: 2.5, color: '#ffffff' },
    bloom: [{ blur: 12, color: 'rgba(192, 132, 252, 0.55)' }],
    castShadow: { dx: 0, dy: 5, blur: 10, color: 'rgba(49, 46, 129, 0.3)' },
    shadows: [],
  },
  'reading-nook-sage': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#34d399' },
        { offset: 0.55, color: '#059669' },
        { offset: 1, color: '#065f46' },
      ],
    },
    stroke: { width: 6, color: '#fffbeb' },
    heavyStroke: true,
    // Deeper than the other sage tones: the arched header sits over a sunlit window in the nook
    // poster, and a 0.22 shadow dissolves into that wall instead of lifting the letters off it.
    castShadow: { dx: 0, dy: 4, blur: 10, color: 'rgba(6, 78, 59, 0.38)' },
    // A reading-corner header wants the gentle smile, and it belongs to the *style*: arch it here
    // and every page that uses it agrees, with the Curve control still free to override.
    arc: 0.11,
    shadows: [],
  },
  'storytime-banner': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#fffbeb' },
        { offset: 1, color: '#fef3c7' },
      ],
    },
    castShadow: { dx: 0, dy: 2, blur: 4, color: 'rgba(67, 20, 7, 0.45)' },
    backdrop: { type: 'ribbon-banner', color: '#c2410c', paddingX: 36, paddingY: 12 },
    shadows: [],
  },
  // ---- reading-corner forms ---------------------------------------------------------------
  // Printed at A4 on a school photocopier: three colours, a cream die-cut so the words survive a
  // grey machine, and no bloom that a mono print would turn into mud.
  'champs-basa-blue': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#60a5fa' },
        { offset: 0.5, color: '#2563eb' },
        { offset: 1, color: '#1e3a8a' },
      ],
    },
    stroke: { width: 4, color: '#eff6ff' },
    heavyStroke: true,
    castShadow: { dx: 0, dy: 3, blur: 6, color: 'rgba(30, 58, 138, 0.3)' },
    shadows: [],
  },
  'champs-kasadya-coral': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#fb7185' },
        { offset: 0.55, color: '#e11d48' },
        { offset: 1, color: '#9f1239' },
      ],
    },
    stroke: { width: 3, color: '#fff1f2' },
    heavyStroke: true,
    castShadow: { dx: 0, dy: 2, blur: 5, color: 'rgba(159, 18, 57, 0.26)' },
    shadows: [],
  },
  'champs-gold-ribbon': {
    weight: '900',
    gradient: {
      angle: 180,
      stops: [
        { offset: 0, color: '#fef3c7' },
        { offset: 0.5, color: '#fbbf24' },
        { offset: 1, color: '#b45309' },
      ],
    },
    castShadow: { dx: 0, dy: 2, blur: 4, color: 'rgba(24, 24, 27, 0.4)' },
    backdrop: { type: 'ribbon-banner', color: '#0f766e', paddingX: 34, paddingY: 12 },
    shadows: [],
  },

  // ---- portfolios ------------------------------------------------------------------------
  // Refined, not shouted: a hairline trim and a soft lift. 800 rather than 900 so a serif or a
  // geometric sans keeps its shapes — the two styles that look wrong at poster weight.
  'portfolio-editorial': {
    weight: '800',
    gradient: {
      angle: 165,
      stops: [
        { offset: 0, color: '#475569' },
        { offset: 0.45, color: '#1e293b' },
        { offset: 1, color: '#0f172a' },
      ],
    },
    stroke: { width: 1.5, color: '#d97706' },
    castShadow: { dx: 0, dy: 4, blur: 12, color: 'rgba(15, 23, 42, 0.22)' },
    shadows: [],
  },
  'portfolio-indigo': {
    weight: '800',
    gradient: {
      angle: 135,
      stops: [
        { offset: 0, color: '#4f46e5' },
        { offset: 0.55, color: '#2563eb' },
        { offset: 1, color: '#0d9488' },
      ],
    },
    stroke: { width: 1.5, color: '#ffffff' },
    castShadow: { dx: 0, dy: 6, blur: 16, color: 'rgba(37, 99, 235, 0.22)' },
    shadows: [],
  },
};

/** Paint instructions for a style, or undefined for plain text. */
export function wordArtPaint(style?: WordArtStyle): WordArtPaint | undefined {
  if (!style || style === 'none') return undefined;
  return PAINT[style];
}

/** The weight a style forces on the type (layout must measure with it too). */
/**
 * The exporter-facing view of a style: one angle and one stop list, which is
 * what a CanvasLinearGradient wants. Derived from `PAINT` — never authored by
 * hand — so the canvas module and the stylesheet cannot drift.
 */
export interface WordArtSpec {
  id?: WordArtStyle;
  /** CSS convention: 0deg points up, 180deg points down. */
  angle: number;
  stops: { offset: number; color: string }[];
  italic?: boolean;
  glints?: boolean;
  stroke?: { width: number; color: string };
  heavyStroke?: boolean;
  extrusion?: WordArtExtrusion;
  bloom?: { blur: number; color: string }[];
  castShadow?: WordArtShadow;
  /** Extra authored shadows, painted nearest the glyphs. */
  shadows: WordArtShadow[];
  /** A painted highlight behind the letters, if the style asks for one. */
  backdrop?: WordArtBackdrop;
  /**
   * Style-level arc, in the same units as the Curve control (0–100) divided by 100: `0.15` is the
   * gentle upward smile a banner header wants, `-0.15` the trough. An element's own `textCurve`
   * always wins — see `wordArtCurve`.
   */
  arc?: number;
}

export function wordArtSpec(style?: WordArtStyle): WordArtSpec | undefined {
  const paint = wordArtPaint(style);
  if (!paint) return undefined;
  return {
    id: style,
    angle: paint.gradient?.angle ?? 180,
    stops: paint.gradient?.stops ?? [
      { offset: 0, color: paint.fill ?? '#111827' },
      { offset: 1, color: paint.fill ?? '#111827' },
    ],
    italic: paint.italic,
    glints: paint.glints,
    stroke: paint.stroke,
    heavyStroke: paint.heavyStroke,
    extrusion: paint.extrusion,
    bloom: paint.bloom,
    castShadow: paint.castShadow,
    shadows: paint.shadows,
    backdrop: paint.backdrop,
    arc: paint.arc,
  };
}

/**
 * The `.wordart-*` rule for a style, generated from the paint spec. The
 * stylesheet in src/index.css is written by this function (see
 * `scripts/wordart-css.ts`), so a gallery preview and the canvas painter can
 * never disagree about a stop, an outline or a drop shadow.
 */
export function buildWordArtCssRule(style: WordArtStyle, className = `wordart-${style}`): string {
  const paint = wordArtPaint(style);
  if (!paint) return '';
  const lines: string[] = [`  font-weight: ${paint.weight};`];
  if (paint.italic) lines.push('  font-style: italic;');
  if (paint.gradient) {
    const stops = [...paint.gradient.stops]
      .sort((a, b) => a.offset - b.offset)
      .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
      .join(', ');
    lines.push(
      `  background: linear-gradient(${paint.gradient.angle}deg, ${stops});`,
      '  -webkit-background-clip: text;',
      '  -webkit-text-fill-color: transparent;'
    );
  } else if (paint.fill) {
    lines.push(`  color: ${paint.fill};`);
  }
  if (paint.stroke) {
    const rim = paint.heavyStroke ? paint.stroke.width * 2 : paint.stroke.width;
    lines.push(`  -webkit-text-stroke: ${rim}px ${paint.stroke.color};`);
    // Canvas paints the outline behind the fill; without this the DOM paints it
    // on top and the two renderers disagree about how thick the letters look.
    lines.push('  paint-order: stroke fill;');
  }
  if (paint.backdrop) {
    // The DOM paints the swipe as an SVG layer (see ElementRenderer); the class only carries the
    // colour so a preview tile shows the highlight without mounting the SVG.
    lines.push(`  --wordart-backdrop: ${paint.backdrop.color};`);
  }
  const chain = wordArtShadowChain(paint);
  if (chain.length) {
    lines.push('  filter:');
    const shadows = chain.map((s) => `    drop-shadow(${shadowCss(s)})`);
    lines[lines.length - 1] = `  filter:\n${shadows.join('\n')};`;
  }
  return `.${className} {\n${lines.join('\n')}\n}`;
}

/** Every rule, in catalogue order — the body of the WordArt block in index.css. */
export function buildWordArtStylesheet(): string {
  return WORD_ART_STYLES.map((style) => buildWordArtCssRule(style.id, style.className)).join('\n\n');
}

export interface WordArtGlint {
  /** Centre, in element-local pixels. */
  x: number;
  y: number;
  /** Outer radius of the four-point star. */
  radius: number;
  /** Rotation in radians. */
  rotation: number;
  opacity: number;
}

/** Where the sparkles land, as fractions of the text box. */
const GLINT_ANCHORS: { fx: number; fy: number; scale: number; opacity: number }[] = [
  { fx: 0.08, fy: 0.14, scale: 1, opacity: 0.95 }, // top-left, the hero sparkle
  { fx: 0.92, fy: 0.1, scale: 0.85, opacity: 0.85 }, // top-right
  { fx: 0.38, fy: 0.78, scale: 0.55, opacity: 0.6 }, // lower specular
];

/** Too small to read, too large to sit on the letters. */
const GLINT_MIN = 5;
const GLINT_MAX = 26;

/**
 * Sparkle pass for the styles that ask for one. Deterministic from the style
 * and the box, so the DOM overlay and the canvas paint the same stars.
 */
export function wordArtGlints(
  style: WordArtStyle | undefined,
  width: number,
  height: number
): WordArtGlint[] {
  const paint = wordArtPaint(style);
  if (!paint?.glints || width <= 0 || height <= 0) return [];
  const base = Math.max(GLINT_MIN, Math.min(GLINT_MAX, height * 0.28));
  return GLINT_ANCHORS.map((anchor) => ({
    x: Math.min(width - 1, Math.max(1, anchor.fx * width)),
    y: Math.min(height - 1, Math.max(1, anchor.fy * height)),
    radius: Math.min(GLINT_MAX, Math.max(GLINT_MIN, base * anchor.scale)),
    rotation: 0,
    opacity: anchor.opacity,
  }));
}

/** The star as an eight-point polygon — shared by the canvas and the DOM. */
export function glintStarPoints(glint: WordArtGlint): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < 8; i += 1) {
    const angle = glint.rotation + (i * Math.PI) / 4;
    const radius = i % 2 === 0 ? glint.radius : glint.radius * 0.18;
    points.push({
      x: glint.x + Math.cos(angle) * radius,
      y: glint.y + Math.sin(angle) * radius,
    });
  }
  return points;
}

/** SVG path for the same star, for the DOM overlay. */
export function glintStarPath(glint: WordArtGlint): string {
  return glintStarPoints(glint)
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ') + ' Z';
}

export function wordArtWeight(style?: WordArtStyle): '800' | '900' | undefined {
  return wordArtPaint(style)?.weight;
}

/** Linear mix of two hex colours — the extrusion ramp, shared by CSS and canvas. */
export function lerpHex(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const h = hex.replace('#', '');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const to = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return `#${to(ar + (br - ar) * t)}${to(ag + (bg - ag) * t)}${to(ab + (bb - ab) * t)}`;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Every layer that sits *behind* the glyphs, nearest first — the order CSS
 * lists its drop-shadows in, and the order the exporter walks backwards.
 * Extrusion copies, hand-authored shadows, the cast shadow, then the bloom.
 */
/** The stroke width to actually paint: doubled when the border is meant to be seen at full width. */
export function wordArtRimWidth(spec?: Pick<WordArtPaint, 'stroke' | 'heavyStroke'>): number {
  if (!spec?.stroke) return 0;
  return spec.heavyStroke ? spec.stroke.width * 2 : spec.stroke.width;
}

export function wordArtShadowChain(paint?: WordArtPaint): WordArtShadow[] {
  if (!paint) return [];
  const chain: WordArtShadow[] = [];
  const extrusion = paint.extrusion;
  if (extrusion) {
    const { steps, dx, dy, startColor, endColor } = extrusion;
    for (let i = 1; i <= steps; i += 1) {
      chain.push({
        dx: round2(dx * i),
        dy: round2(dy * i),
        blur: 0,
        color: lerpHex(startColor, endColor, steps === 1 ? 1 : (i - 1) / (steps - 1)),
      });
    }
  }
  chain.push(...paint.shadows);
  // A fat border drawn with sharp joins spikes at the corners of A, M and W. CSS text stroke has no
  // `stroke-linejoin` to fix it (that property is SVG-only), and the canvas already rounds its
  // joins — so the fix both renderers can share is a blurred copy of the fill in the border colour,
  // painted just under the border. It rounds the outer edge the same way on screen and in export.
  if (paint.stroke && paint.stroke.width >= 4) {
    chain.push({ dx: 0, dy: 0, blur: 2, color: paint.stroke.color });
  }
  if (paint.castShadow) chain.push(paint.castShadow);
  for (const bloom of paint.bloom ?? []) {
    chain.push({ dx: 0, dy: 0, blur: bloom.blur, color: bloom.color });
  }
  return chain;
}

/**
 * True when the style carries its own legibility: a fat, near-white die-cut border means the
 * letters read on a dark photo, a pale page and a mid-tone collage alike. Such a style must not be
 * "corrected" for low contrast against the page — the border is the correction.
 */
export function wordArtSelfContained(style?: WordArtStyle): boolean {
  const paint = wordArtPaint(style);
  if (!paint?.stroke) return false;
  const lum = (() => {
    const hex = paint.stroke.color.replace('#', '');
    if (hex.length !== 6) return 0;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  })();
  // A declared heavy rim is an authored contrast device whether it is white or pine ink. The
  // contrast pass exists to rescue unstyled type; it must not repaint a sign. (The four die-cut
  // sticker styles are white, so this only widens the rule to the eco styles.)
  if (paint.heavyStroke && paint.stroke.width >= 5) return true;
  return paint.stroke.width >= 4 && lum > 0.8;
}

/**
 * Whether a style supplies its own contrast, so the colour pass must leave it alone.
 *
 * Wider than `wordArtSelfContained`, and used by a different question. `wordArtSelfContained` asks
 * "is there a die-cut border", which also decides composability; this asks "will this line still be
 * legible on any ground", which is what the enhancement pass needs to know:
 *
 * - a painted backdrop (swipe, plank, ribbon) *is* the ground, so pitch-black script on a dark scrim
 *   still reads — it sits on its own cream swipe;
 * - a rim heavy enough to be a border separates the letters from anything;
 * - a gradient with a wide luminance range has structure inside the glyph itself: award gold runs
 *   from near-white to bronze, so it never dissolves into a single background even though one of
 *   its stops might match it.
 */
export function wordArtCarriesContrast(style?: WordArtStyle): boolean {
  const paint = wordArtPaint(style);
  if (!paint) return false;
  if (wordArtSelfContained(style)) return true;
  if (paint.backdrop) return true;

  const luminance = (hex: string) => {
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return 0.5;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16) / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const stops = paint.gradient
    ? paint.gradient.stops.map((stop) => luminance(stop.color))
    : paint.fill
      ? [luminance(paint.fill)]
      : [];
  if (stops.length === 0) return false;
  return Math.max(...stops) - Math.min(...stops) >= 0.55;
}

/** The curve to lay this element out with: the element's own, else the style's `arc`. */
export function wordArtCurve(style: WordArtStyle | undefined, elementCurve?: number): number {
  if (elementCurve !== undefined && elementCurve !== 0) return elementCurve;
  const arc = wordArtPaint(style)?.arc ?? 0;
  return Math.abs(arc) < 0.001 ? 0 : arc * 100;
}

/** True when the style only looks right in italic. */
export function wordArtItalic(style?: WordArtStyle): boolean {
  return !!wordArtPaint(style)?.italic;
}

function shadowCss(s: WordArtShadow): string {
  return `${s.dx}px ${s.dy}px ${s.blur}px ${s.color}`;
}

/**
 * DOM paint for a style. `background`/`gradient` are returned separately
 * because a gradient has to be clipped to the glyphs on the glyph wrapper,
 * never on the element box (it would swallow the box fill).
 */
export interface WordArtCss {
  fontWeight?: '800' | '900';
  color?: string;
  /** `linear-gradient(...)` value, already ordered. */
  backgroundImage?: string;
  /** Glyphs must be transparent so the gradient shows through them. */
  textFillTransparent?: boolean;
  webkitTextStroke?: string;
  /** drop-shadow chain for every layer behind the glyphs. */
  filter?: string;
  /** 'italic' when the style slant is part of the look. */
  fontStyle?: 'italic';
  /** Canvas paints the outline behind the fill; so must the DOM. */
  paintOrder?: 'stroke fill';
}

export function wordArtCss(style?: WordArtStyle): WordArtCss {
  const paint = wordArtPaint(style);
  if (!paint) return {};
  const css: WordArtCss = { fontWeight: paint.weight };
  if (paint.italic) css.fontStyle = 'italic';
  if (paint.fill) css.color = paint.fill;
  if (paint.gradient) {
    const stops = [...paint.gradient.stops]
      .sort((a, b) => a.offset - b.offset)
      .map((s) => `${s.color} ${Math.round(s.offset * 100)}%`)
      .join(', ');
    css.backgroundImage = `linear-gradient(${paint.gradient.angle}deg, ${stops})`;
    css.textFillTransparent = true;
  }
  if (paint.stroke) {
    css.webkitTextStroke = `${paint.stroke.width}px ${paint.stroke.color}`;
    css.paintOrder = 'stroke fill';
  }
  // `text-shadow` bleeds through a background-clipped fill and muddies the
  // metal; a drop-shadow filter paints behind the clipped glyphs instead.
  const chain = wordArtShadowChain(paint);
  if (chain.length) css.filter = chain.map((s) => `drop-shadow(${shadowCss(s)})`).join(' ');
  return css;
}
