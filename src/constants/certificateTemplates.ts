import type {
  ImageElement,
  LineElement,
  PublisherElement,
  QRElement,
  ShapeElement,
  TextElement,
} from '../types/publisher';
import type { TemplateDefinition } from './templates';
import { getStickerById } from './stickerLibrary';
import { SAMPLE_GRAPHICS } from './sampleGraphics';

const stickerUri = (id: string) => getStickerById(id)?.dataUri || '';
const stockUri = (id: string) => SAMPLE_GRAPHICS.find((g) => g.id === id)?.src || '';

/**
 * The twelve certificates, drawn against a small set of shared parts.
 *
 * They used to be six copies of the same object literal, which is why they drifted: one had real
 * signature rules and two had `'______________________\nNames'` typed into a text box, four used
 * `Inter`, and none of them had anything behind the paper. The parts below are the ones that must
 * agree across all six:
 *
 *  - the paper     a page-level dot or grid pattern at 5–6% so the sheet has tooth instead of flat
 *                  colour. It is `page.backgroundPattern`, not a shape: a pattern *shape* paints
 *                  'transparent' between its motifs, and every contrast check reads a shape's
 *                  `fillColor` as the colour behind the type — so a shape watermark made the
 *                  design pass lighten half the sheet's type by 50%.
 *  - `signature`   a real `line` at 1.5px with the name in bold and the role muted beneath it, as
 *                  three elements — the rule, the bold name, the grey role — because runs are not
 *                  styled here, and eight underscores are not a signature
 *  - `logoSlot`    a 64px circular `image` with an empty `src`, marked `slotKind: 'logo'` so the
 *                  design pass leaves it empty for the school's own crest
 *  - `qr`          a scannable code for verifying a project, a completion or a certificate ID
 *
 * Geometry is authored on the 8px grid the polish pass snaps to, so `alignToGrid` and
 * `normaliseRhythm` find nothing to move.
 */

type Box = { x: number; y: number; width: number; height: number };

/** Families that are actually loaded by the app (see constants/fonts.ts). */
const BODY = 'Plus Jakarta Sans';
const DISPLAY = 'Playfair Display';
const SCRIPT = 'Kaushan Script';
const ROUND = 'Fredoka';
const SLAB = 'Montserrat';
const SOFT = 'Nunito';
const BALOO = 'Baloo 2';

const text = (
  id: string,
  box: Box,
  copy: string,
  style: Partial<TextElement> & { fontFamily: string; fontSize: number },
): TextElement =>
  ({
    id,
    type: 'text',
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    rotation: 0,
    zIndex: 5,
    text: copy,
    fontWeight: style.fontWeight ?? 'normal',
    fontStyle: style.fontStyle ?? 'normal',
    textDecoration: 'none',
    color: style.color ?? '#334155',
    textAlign: style.textAlign ?? 'center',
    lineHeight: style.lineHeight ?? 1.3,
    verticalAlign: style.verticalAlign ?? 'top',
    columns: 1,
    columnGap: 0,
    padding: 0,
    ...style,
  }) as TextElement;

const shape = (
  id: string,
  box: Box,
  style: Partial<ShapeElement> & { fillColor?: string } = {},
): ShapeElement =>
  ({
    id,
    type: 'shape',
    shapeType: 'rectangle',
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    rotation: 0,
    zIndex: 1,
    fillColor: style.fillColor ?? 'transparent',
    strokeColor: style.strokeColor ?? 'transparent',
    strokeWidth: style.strokeWidth ?? 0,
    ...style,
  }) as ShapeElement;

const line = (id: string, box: Box, strokeColor: string, strokeWidth = 1.5): LineElement => ({
  id,
  type: 'line',
  x: box.x,
  y: box.y,
  width: box.width,
  height: box.height,
  rotation: 0,
  zIndex: 4,
  strokeColor,
  strokeWidth,
});

const qr = (id: string, box: Box, value: string): QRElement => ({
  id,
  type: 'qr',
  x: box.x,
  y: box.y,
  width: box.width,
  height: box.height,
  rotation: 0,
  zIndex: 4,
  value,
  fgColor: '#0f172a',
  bgColor: '#ffffff',
});

/**
 * A circular frame waiting for a crest. Deliberately empty — see `ImageElement.slotKind`.
 * `size` is 64 by default; the DepEd letterhead carries two 60px crests instead, because the
 * Republic line needs the width between them.
 */
const logoSlot = (id: string, x: number, y: number, name: string, size = 64): ImageElement => ({
  id,
  type: 'image',
  name,
  src: '',
  x,
  y,
  width: size,
  height: size,
  rotation: 0,
  zIndex: 6,
  maskShape: 'circle',
  objectFit: 'cover',
  slotKind: 'logo',
  isPlaceholder: true,
});

/**
 * Sign-a-here: the rule, the name in bold, the role in muted small caps under it.
 *
 * Runs are not styled in this editor, so "bold name + muted role" is two text elements stacked on
 * the same box — which is also what lets the role take letter-spacing without dragging the name
 * along with it.
 */
const signature = (
  id: string,
  box: { x: number; y: number; width: number },
  signer: { name: string; role: string },
  ink: { rule?: string; name?: string; role?: string; align?: 'left' | 'center' } = {},
): PublisherElement[] => [
  line(`${id}-line`, { x: box.x, y: box.y, width: box.width, height: 4 }, ink.rule ?? '#94a3b8', 1.5),
  text(
    `${id}-name`,
    { x: box.x, y: box.y + 8, width: box.width, height: 24 },
    signer.name,
    {
      fontFamily: BODY,
      fontSize: 15,
      fontWeight: 'bold',
      color: ink.name ?? '#0f172a',
      textAlign: ink.align ?? 'center',
    },
  ),
  text(
    `${id}-role`,
    { x: box.x, y: box.y + 32, width: box.width, height: 20 },
    signer.role,
    {
      fontFamily: BODY,
      fontSize: 11,
      fontWeight: '600',
      color: ink.role ?? '#64748b',
      textAlign: ink.align ?? 'center',
      letterSpacing: 1.2,
    },
  ),
];

/** Confetti: the small shapes that keep a friendly certificate from looking like a form. */
const confetti = (
  id: string,
  x: number,
  y: number,
  size: number,
  style: { shapeType?: ShapeElement['shapeType']; fillColor: string; rotation?: number },
): ShapeElement =>
  shape(
    id,
    { x, y, width: size, height: size },
    {
      shapeType: style.shapeType ?? 'circle',
      fillColor: style.fillColor,
      rotation: style.rotation ?? 0,
      zIndex: 2,
    },
  );

/**
 * ── The DepEd set ─────────────────────────────────────────────────────────────────────────
 *
 * Six certificates for the Philippine public-school calendar, drawn on the same paper as the six
 * above. They differ from them in one way that matters: the sheet itself is a drawn asset now —
 * a parchment or pastel ground with the department's frame on top — so the layout has to live
 * inside the frame's opening rather than inside the 48px margin. The openings were measured off
 * the shipped PNGs and the columns below sit inside them.
 *
 * The letterhead is the Department's own: two crests, the Republic line, and the region and
 * school beneath it. `depedHeader` draws that block once so all six agree on it, including the
 * 60px crests — circular, empty, and marked `slotKind: 'logo'`, because the school prints its
 * own seal there and stock art is the one thing a teacher would have to delete first.
 *
 * Everything is on the 8px step and every stack has 8px multiples between its boxes, so
 * `alignToGrid` and `normaliseRhythm` find nothing to move and the pages ship as authored.
 */

const SCHOOL = 'San Roque National High School';

/**
 * The Department's letterhead: crest, Republic line, region + school, crest.
 *
 * `width` is 4 more than a multiple of 8 on purpose. The crests are 60 wide, so with a 0-mod-8
 * width the right crest lands 4px off the polish pass's step and gets nudged — and a logo frame
 * that drifts 4px is exactly the thing a legal document must not do. A 4-mod-8 width puts both
 * crests on the step, at the cost of a 2px offset from the sheet's centre line, which no one has
 * ever seen and every grid has.
 */
const depedHeader = (
  id: string,
  box: { x: number; y: number; width: number; ink: string; muted: string },
): PublisherElement[] => {
  const crest = 60;
  // 16px of air would put the line 76px in — 4px off the step, and the polish pass would slide it.
  const inset = crest + 20;
  return [
    logoSlot(`${id}-crest-left`, box.x, box.y, 'DepEd Logo', crest),
    logoSlot(`${id}-crest-right`, box.x + box.width - crest, box.y, 'School Logo', crest),
    text(
      `${id}-republic`,
      { x: box.x + inset, y: box.y + 8, width: box.width - inset * 2, height: 16 },
      'Republic of the Philippines • Department of Education',
      { fontFamily: BODY, fontSize: 10, fontWeight: 'bold', color: box.ink, letterSpacing: 1.3 },
    ),
    text(
      `${id}-region`,
      { x: box.x + inset, y: box.y + 32, width: box.width - inset * 2, height: 16 },
      `Region VI – Western Visayas • ${SCHOOL}`,
      { fontFamily: BODY, fontSize: 10, fontWeight: '600', color: box.muted, letterSpacing: 0.8 },
    ),
  ];
};

/** A drawn asset placed as art — the frame, a rule, a seal, a sticker. */
const art = (
  id: string,
  box: Box,
  src: string,
  name: string,
  style: Partial<ImageElement> = {},
): ImageElement =>
  ({
    id,
    type: 'image',
    name,
    src,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    rotation: 0,
    zIndex: 6,
    objectFit: 'contain',
    ...style,
  }) as ImageElement;

/**
 * The ground and the frame, both pinned: the drawn sheet is furniture, and a frame the align pass
 * may nudge is a frame that drifts off the edge it was cut for. `fill` rather than `cover` because
 * the art is 4:3 and the sheet is 1.29:1 — three percent of stretch is invisible on paper and
 * cropping the frame's own rule would not be.
 */
const drawnSheet = (prefix: string, ground: string, border: string): PublisherElement[] => [
  art(
    `${prefix}-ground`,
    { x: 0, y: 0, width: 1056, height: 816 },
    stockUri(ground),
    'Certificate Paper',
    { zIndex: 1, locked: true, objectFit: 'fill' },
  ),
  art(
    `${prefix}-border`,
    { x: 0, y: 0, width: 1056, height: 816 },
    stockUri(border),
    'Certificate Frame',
    { zIndex: 2, locked: true, objectFit: 'fill' },
  ),
];

export const CERTIFICATE_TEMPLATES: TemplateDefinition[] = [
  // 1. School: Honor Roll Academic Certificate
  {
    id: 'cert-school-honor-roll',
    name: 'Honor Roll Academic Certificate',
    description: 'Classic school honor roll award with navy header ribbon, laurel wreath, and graduation cap.',
    category: 'Certificate',
    thumbnailColor: '#1e3a8a',
    thumbnailGradient: 'linear-gradient(135deg, #1e3a8a 0%, #f59e0b 100%)',
    project: {
      id: 'proj-cert-honor',
      name: 'Honor Roll Certificate.pub',
      pageSizeName: 'certificate',
      colorScheme: 'ocean-navy',
      activePageIndex: 0,
      masterPage: { elements: [], showOnAllPages: true },
      pages: [
        {
          id: 'page-1',
          name: 'Honor Roll',
          width: 1056,
          height: 816,
          orientation: 'landscape',
          margins: { top: 48, right: 48, bottom: 48, left: 48 },
          backgroundColor: '#fffdf7',
          backgroundPattern: { type: 'dots', color: '#1e3a8a', opacity: 0.06, scale: 32, strokeWidth: 1.5, rotation: 0 },
          guides: [],
          elements: [
            shape('ch-outer', { x: 24, y: 24, width: 1008, height: 768 }, {
              strokeColor: '#1e3a8a',
              strokeWidth: 8,
              locked: true,
              zIndex: 1,
            }),
            // Locked, and the pair is sized so the density pass reads both as the sheet rather
            // than as decoration: an unlocked 82% frame gets shrunk by 12% and floats away from
            // the border it belongs to.
            shape('ch-inner', { x: 36, y: 36, width: 984, height: 744 }, {
              strokeColor: '#d97706',
              strokeWidth: 2,
              locked: true,
              zIndex: 2,
            }),
            // Deep navy, not a flat plate: the gradient keeps the band from reading as a
            // pasted-on rectangle against warm cream paper.
            shape('ch-banner', { x: 48, y: 48, width: 960, height: 120 }, {
              fillColor: '#0f172a',
              fillType: 'linear-gradient',
              gradientColor2: '#1e3a8a',
              gradientAngle: 90,
              zIndex: 3,
            }),
            shape('ch-banner-rule', { x: 48, y: 168, width: 960, height: 4 }, {
              fillColor: '#d97706',
              zIndex: 3,
            }),
            logoSlot('ch-logo-left', 80, 80, 'DepEd Logo'),
            logoSlot('ch-logo-right', 912, 80, 'School Logo'),
            text(
              'ch-title',
              { x: 180, y: 80, width: 696, height: 56 },
              'ACADEMIC HONOR ROLL',
              {
                fontFamily: DISPLAY,
                fontSize: 38,
                fontWeight: 'bold',
                color: '#ffffff',
                isWordArt: true,
                wordArtStyle: 'trophy-gold',
              },
            ),
            text(
              'ch-school',
              { x: 180, y: 136, width: 696, height: 24 },
              'ST. CLAIRE ACADEMY • OFFICE OF ACADEMIC AFFAIRS',
              {
                fontFamily: BODY,
                fontSize: 13,
                fontWeight: 'bold',
                color: '#fde047',
                letterSpacing: 2,
              },
            ),
            text(
              'ch-kicker',
              { x: 140, y: 208, width: 776, height: 32 },
              'THIS CERTIFICATE OF MERIT IS PROUDLY AWARDED TO',
              {
                fontFamily: BODY,
                fontSize: 14,
                fontWeight: '600',
                color: '#64748b',
                letterSpacing: 2,
              },
            ),
            text('ch-student', { x: 140, y: 256, width: 776, height: 96 }, 'Student Full Name', {
              fontFamily: SCRIPT,
              fontSize: 56,
              fontWeight: 'normal',
              color: '#0f172a',
            }),
            line('ch-line', { x: 248, y: 360, width: 560, height: 4 }, '#d97706', 2),
            text(
              'ch-desc',
              { x: 168, y: 384, width: 720, height: 96 },
              'For achieving First Honors distinction with exemplary academic performance, diligence, and leadership during the 2025–2026 School Year.',
              { fontFamily: BODY, fontSize: 17, color: '#334155' },
            ),
            {
              id: 'ch-wreath',
              type: 'image',
              name: 'Laurel Wreath',
              src: stickerUri('stk-laurel-wreath'),
              // The wreath and the cap are one achievement cluster, centred on the page: 424 →
              // 632 is 208 wide around the 528 axis, on the 8px step so neither gets nudged.
              x: 424,
              y: 480,
              width: 120,
              height: 120,
              rotation: 0,
              zIndex: 5,
              objectFit: 'contain',
              effectPreset: 'sticker',
              isSticker: true,
              stickerOutlineColor: '#ffffff',
              stickerOutlineWidth: 4,
            },
            {
              id: 'ch-cap',
              type: 'image',
              name: 'Graduation Cap',
              src: stickerUri('stk-grad-cap'),
              x: 560,
              y: 504,
              width: 72,
              height: 72,
              rotation: 6,
              zIndex: 5,
              objectFit: 'contain',
              effectPreset: 'sticker',
              isSticker: true,
              stickerOutlineColor: '#ffffff',
              stickerOutlineWidth: 4,
            },
            ...signature(
              'ch-sig-l',
              { x: 112, y: 648, width: 248 },
              { name: 'Dr. Elena Rostova', role: 'SCHOOL PRINCIPAL' },
              { rule: '#94a3b8' },
            ),
            ...signature(
              'ch-sig-r',
              { x: 696, y: 648, width: 248 },
              { name: 'Prof. Marcus Vance', role: 'ACADEMIC COORDINATOR' },
              { rule: '#94a3b8' },
            ),
          ],
        },
      ],
    },
  },

  // 2. School: Student Star & Attendance Award
  {
    id: 'cert-school-star-student',
    name: 'Student Star & Attendance Award',
    description: 'Vibrant classroom achievement certificate featuring Wise Owl and Gold Trophy stickers.',
    category: 'Certificate',
    thumbnailColor: '#0284c7',
    thumbnailGradient: 'linear-gradient(135deg, #0ea5e9 0%, #facc15 100%)',
    project: {
      id: 'proj-cert-star',
      name: 'Student Star Award.pub',
      pageSizeName: 'certificate',
      colorScheme: 'ocean-navy',
      activePageIndex: 0,
      masterPage: { elements: [], showOnAllPages: true },
      pages: [
        {
          id: 'page-1',
          name: 'Star Award',
          width: 1056,
          height: 816,
          orientation: 'landscape',
          margins: { top: 48, right: 48, bottom: 48, left: 48 },
          backgroundColor: '#f0f9ff',
          backgroundPattern: { type: 'dots', color: '#0ea5e9', opacity: 0.06, scale: 28, strokeWidth: 1.5, rotation: 0 },
          guides: [],
          elements: [
            shape('cs-card', { x: 36, y: 36, width: 984, height: 744 }, {
              shapeType: 'rounded-rect',
              fillColor: '#ffffff',
              strokeColor: '#0ea5e9',
              strokeWidth: 6,
              cornerRadius: 28,
              locked: true,
              zIndex: 1,
            }),
            // The yellow pill was a shape with a label. This is a WordArt banner, so the ribbon is
            // drawn *by the type* and stays crisp at any size.
            text('cs-ribbon', { x: 320, y: 80, width: 416, height: 48 }, 'STAR STUDENT AWARD', {
              fontFamily: SOFT,
              fontSize: 20,
              fontWeight: 'bold',
              color: '#713f12',
              isWordArt: true,
              wordArtStyle: 'champs-gold-ribbon',
            }),
            confetti('cs-confetti-a', 96, 336, 16, { shapeType: 'star', fillColor: '#fbbf24', rotation: 12 }),
            confetti('cs-confetti-b', 152, 400, 10, { fillColor: '#38bdf8' }),
            confetti('cs-confetti-c', 80, 472, 12, { shapeType: 'star', fillColor: '#f472b6', rotation: -18 }),
            confetti('cs-confetti-d', 928, 336, 14, { shapeType: 'star', fillColor: '#38bdf8', rotation: 22 }),
            confetti('cs-confetti-e', 880, 408, 10, { fillColor: '#fbbf24' }),
            confetti('cs-confetti-f', 944, 472, 12, { shapeType: 'star', fillColor: '#34d399', rotation: -12 }),
            {
              id: 'cs-owl',
              type: 'image',
              name: 'Wise Owl',
              src: stickerUri('stk-wise-owl'),
              x: 88,
              y: 88,
              width: 120,
              height: 120,
              rotation: -8,
              zIndex: 6,
              objectFit: 'contain',
              effectPreset: 'sticker',
              isSticker: true,
              stickerOutlineColor: '#ffffff',
              stickerOutlineWidth: 5,
            },
            {
              id: 'cs-trophy',
              type: 'image',
              name: 'Gold Trophy',
              src: stickerUri('stk-trophy'),
              x: 848,
              y: 88,
              width: 120,
              height: 120,
              rotation: 8,
              zIndex: 6,
              objectFit: 'contain',
              effectPreset: 'sticker',
              isSticker: true,
              stickerOutlineColor: '#ffffff',
              stickerOutlineWidth: 5,
            },
            text(
              'cs-title',
              { x: 160, y: 144, width: 736, height: 72 },
              'CERTIFICATE OF EXCELLENCE',
              {
                fontFamily: ROUND,
                fontSize: 42,
                fontWeight: 'bold',
                color: '#0369a1',
                isWordArt: true,
                wordArtStyle: 'champs-basa-blue',
              },
            ),
            text('cs-name', { x: 140, y: 264, width: 776, height: 80 }, 'Awesome Student Name', {
              fontFamily: DISPLAY,
              fontSize: 50,
              fontWeight: 'bold',
              color: '#0f172a',
            }),
            line('cs-div', { x: 268, y: 352, width: 520, height: 4 }, '#38bdf8', 3),
            text(
              'cs-body',
              { x: 176, y: 384, width: 704, height: 96 },
              'Awarded for outstanding classroom participation, kindness to classmates, and 100% Perfect Attendance this quarter!',
              { fontFamily: SOFT, fontSize: 18, color: '#334155' },
            ),
            {
              id: 'cs-seal',
              type: 'image',
              name: 'Gold Seal',
              src: stickerUri('stk-gold-seal'),
              x: 480,
              y: 504,
              width: 96,
              height: 96,
              rotation: 0,
              zIndex: 6,
              objectFit: 'contain',
              effectPreset: 'sticker',
              isSticker: true,
              stickerOutlineColor: '#ffffff',
              stickerOutlineWidth: 4,
            },
            ...signature(
              'cs-sig-l',
              { x: 96, y: 648, width: 248 },
              { name: 'Ma. Clarissa Bautista', role: 'CLASS ADVISER' },
              { rule: '#cbd5e1', role: '#64748b' },
            ),
            ...signature(
              'cs-sig-r',
              { x: 712, y: 648, width: 248 },
              { name: 'Mr. Joel Ramirez', role: 'SCHOOL HEAD' },
              { rule: '#cbd5e1', role: '#64748b' },
            ),
          ],
        },
      ],
    },
  },

  // 3. School: STEM & Science Fair Winner
  {
    id: 'cert-school-stem',
    name: 'STEM & Science Fair Winner',
    description: 'Modern teal & cobalt STEM award featuring Science Lab Flasks stock art and geometric accents.',
    category: 'Certificate',
    thumbnailColor: '#0891b2',
    thumbnailGradient: 'linear-gradient(135deg, #0891b2 0%, #1e3a8a 100%)',
    project: {
      id: 'proj-cert-stem',
      name: 'STEM Science Fair Award.pub',
      pageSizeName: 'certificate',
      colorScheme: 'ocean-navy',
      activePageIndex: 0,
      masterPage: { elements: [], showOnAllPages: true },
      pages: [
        {
          id: 'page-1',
          name: 'STEM Certificate',
          width: 1056,
          height: 816,
          orientation: 'landscape',
          margins: { top: 48, right: 48, bottom: 48, left: 48 },
          backgroundColor: '#ecfeff',
          backgroundPattern: { type: 'grid', color: '#0e7490', opacity: 0.05, scale: 40, strokeWidth: 1.5, rotation: 0 },
          guides: [],
          elements: [
            shape('st-sidebar', { x: 0, y: 0, width: 248, height: 816 }, {
              fillColor: '#0f172a',
              fillType: 'linear-gradient',
              gradientColor2: '#0e7490',
              gradientAngle: 90,
              locked: true,
              zIndex: 1,
            }),
            // A lit edge where the panel meets the paper: the only bright line on the page, which
            // is what makes the sidebar read as a printed band rather than a coloured block.
            shape('st-side-rule', { x: 248, y: 0, width: 4, height: 816 }, {
              fillColor: '#22d3ee',
              locked: true,
              zIndex: 2,
            }),
            {
              id: 'st-flask',
              type: 'image',
              name: 'Science Lab Flasks',
              src: stockUri('science-flasks'),
              x: 48,
              y: 112,
              width: 152,
              height: 152,
              rotation: 0,
              zIndex: 4,
              borderRadius: 20,
              objectFit: 'contain',
            },
            text('st-side-txt', { x: 16, y: 312, width: 200, height: 128 }, 'ANNUAL\nSTEM &\nSCIENCE\nFAIR 2026', {
              fontFamily: SLAB,
              fontSize: 22,
              fontWeight: 'bold',
              color: '#22d3ee',
            }),
            text(
              'st-title',
              { x: 312, y: 104, width: 664, height: 64 },
              'INNOVATION & DISCOVERY AWARD',
              {
                fontFamily: SLAB,
                fontSize: 34,
                fontWeight: 'bold',
                color: '#0e7490',
                textAlign: 'left',
                isWordArt: true,
                wordArtStyle: 'portfolio-indigo',
              },
            ),
            text('st-name', { x: 312, y: 232, width: 664, height: 80 }, 'Young Scientist Name', {
              fontFamily: DISPLAY,
              fontSize: 48,
              fontWeight: 'bold',
              color: '#0f172a',
              textAlign: 'left',
            }),
            line('st-line', { x: 312, y: 328, width: 620, height: 4 }, '#06b6d4', 3),
            text(
              'st-desc',
              { x: 312, y: 352, width: 640, height: 112 },
              'In recognition of creative scientific inquiry, experimental rigor, and presentation excellence at the Regional Science & Engineering Showcase.',
              { fontFamily: BODY, fontSize: 17, color: '#334155', textAlign: 'left' },
            ),
            ...signature(
              'st-sig',
              { x: 312, y: 632, width: 288 },
              { name: 'Dr. Liza Mendoza', role: 'STEM DEPARTMENT CHAIR' },
              { rule: '#94a3b8', align: 'left' },
            ),
            qr('st-qr', { x: 912, y: 640, width: 96, height: 96 }, 'https://stclaire.edu/verify/stem-2026'),
            text('st-qr-caption', { x: 864, y: 744, width: 144, height: 16 }, 'SCAN TO VERIFY', {
              fontFamily: BODY,
              fontSize: 9,
              fontWeight: '600',
              color: '#64748b',
              letterSpacing: 1.6,
            }),
          ],
        },
      ],
    },
  },

  // 4. Office: Employee of the Month Award
  {
    id: 'cert-office-employee-month',
    name: 'Employee of the Month Award',
    description: 'Executive slate & gold corporate recognition certificate with First Place Ribbon graphic.',
    category: 'Certificate',
    thumbnailColor: '#1e293b',
    thumbnailGradient: 'linear-gradient(135deg, #0f172a 0%, #f59e0b 100%)',
    project: {
      id: 'proj-cert-emp',
      name: 'Employee of the Month.pub',
      pageSizeName: 'certificate',
      colorScheme: 'slate-gold',
      activePageIndex: 0,
      masterPage: { elements: [], showOnAllPages: true },
      pages: [
        {
          id: 'page-1',
          name: 'Employee Award',
          width: 1056,
          height: 816,
          orientation: 'landscape',
          margins: { top: 48, right: 48, bottom: 48, left: 48 },
          backgroundColor: '#ffffff',
          backgroundPattern: { type: 'dots', color: '#0f172a', opacity: 0.06, scale: 32, strokeWidth: 1.5, rotation: 0 },
          guides: [],
          elements: [
            shape('em-border', { x: 24, y: 24, width: 1008, height: 768 }, {
              strokeColor: '#0f172a',
              strokeWidth: 10,
              locked: true,
              zIndex: 1,
            }),
            shape('em-gold-bar', { x: 48, y: 48, width: 960, height: 16 }, {
              fillColor: '#f59e0b',
              fillType: 'linear-gradient',
              gradientColor2: '#fde047',
              gradientAngle: 0,
              zIndex: 2,
            }),
            {
              id: 'em-ribbon',
              type: 'image',
              name: 'First Place Ribbon',
              src: stockUri('ribbon-rosette'),
              x: 840,
              y: 96,
              width: 128,
              height: 128,
              rotation: 0,
              zIndex: 4,
              borderRadius: 18,
              objectFit: 'contain',
            },
            text('em-kicker', { x: 88, y: 104, width: 720, height: 32 }, 'CORPORATE EXCELLENCE & LEADERSHIP', {
              fontFamily: BODY,
              fontSize: 13,
              fontWeight: 'bold',
              color: '#b45309',
              textAlign: 'left',
              letterSpacing: 3,
            }),
            text(
              'em-title',
              { x: 88, y: 144, width: 720, height: 72 },
              'EMPLOYEE OF THE MONTH',
              {
                fontFamily: DISPLAY,
                fontSize: 42,
                fontWeight: 'bold',
                color: '#0f172a',
                textAlign: 'left',
                isWordArt: true,
                wordArtStyle: 'portfolio-editorial',
              },
            ),
            text('em-name', { x: 88, y: 288, width: 880, height: 80 }, 'Recipient Full Name', {
              fontFamily: DISPLAY,
              fontSize: 54,
              fontWeight: 'bold',
              fontStyle: 'italic',
              color: '#1e293b',
              textAlign: 'left',
            }),
            line('em-line', { x: 88, y: 376, width: 680, height: 4 }, '#f59e0b', 3),
            text(
              'em-desc',
              { x: 88, y: 400, width: 824, height: 104 },
              'In grateful recognition of exceptional dedication, teamwork, and measurable impact on client success throughout the month.',
              { fontFamily: BODY, fontSize: 18, color: '#475569', textAlign: 'left' },
            ),
            ...signature(
              'em-sig-l',
              { x: 88, y: 648, width: 264 },
              { name: 'Atty. Renato Cruz', role: 'CHIEF EXECUTIVE OFFICER' },
              { rule: '#cbd5e1', align: 'left' },
            ),
            ...signature(
              'em-sig-r',
              { x: 400, y: 648, width: 264 },
              { name: 'Grace Villanueva', role: 'HUMAN RESOURCES DIRECTOR' },
              { rule: '#cbd5e1', align: 'left' },
            ),
          ],
        },
      ],
    },
  },

  // 5. Office: Workshop & Training Completion
  {
    id: 'cert-office-training',
    name: 'Workshop & Training Completion',
    description: 'Clean corporate training certificate with Knowledge Book, Wax Seal, and accreditation ID.',
    category: 'Certificate',
    thumbnailColor: '#0f766e',
    thumbnailGradient: 'linear-gradient(135deg, #0f766e 0%, #4f46e5 100%)',
    project: {
      id: 'proj-cert-training',
      name: 'Training Completion.pub',
      pageSizeName: 'certificate',
      colorScheme: 'emerald-forest',
      activePageIndex: 0,
      masterPage: { elements: [], showOnAllPages: true },
      pages: [
        {
          id: 'page-1',
          name: 'Completion Certificate',
          width: 1056,
          height: 816,
          orientation: 'landscape',
          margins: { top: 48, right: 48, bottom: 48, left: 48 },
          backgroundColor: '#f8fafc',
          backgroundPattern: { type: 'dots', color: '#0f766e', opacity: 0.06, scale: 32, strokeWidth: 1.5, rotation: 0 },
          guides: [],
          elements: [
            shape('tr-frame', { x: 36, y: 36, width: 984, height: 744 }, {
              shapeType: 'rounded-rect',
              fillColor: '#ffffff',
              strokeColor: '#0f766e',
              strokeWidth: 4,
              cornerRadius: 16,
              locked: true,
              zIndex: 1,
            }),
            // INSET/LAC certificates are handed out with a header band; the wave keeps it from
            // looking like a spreadsheet row.
            shape('tr-header', { x: 48, y: 48, width: 960, height: 88 }, {
              fillColor: '#0f766e',
              fillType: 'linear-gradient',
              gradientColor2: '#115e59',
              gradientAngle: 0,
              waveEdge: 'bottom',
              waveAmplitude: 8,
              waveFrequency: 3,
              locked: true,
              zIndex: 2,
            }),
            {
              id: 'tr-book',
              type: 'image',
              name: 'Knowledge Book',
              src: stockUri('open-book'),
              x: 496,
              y: 56,
              width: 64,
              height: 64,
              rotation: 0,
              zIndex: 4,
              borderRadius: 12,
              objectFit: 'contain',
            },
            text(
              'tr-title',
              { x: 120, y: 184, width: 816, height: 64 },
              'CERTIFICATE OF COMPLETION',
              {
                fontFamily: BODY,
                fontSize: 38,
                fontWeight: 'bold',
                color: '#0f766e',
                letterSpacing: 2,
                isWordArt: true,
                wordArtStyle: 'portfolio-indigo',
              },
            ),
            text('tr-name', { x: 120, y: 280, width: 816, height: 80 }, 'Participant Full Name', {
              fontFamily: DISPLAY,
              fontSize: 48,
              fontWeight: 'bold',
              color: '#0f172a',
            }),
            text(
              'tr-desc',
              { x: 176, y: 384, width: 704, height: 88 },
              'Has successfully completed 24 Continuing Education Hours in Executive Leadership & Digital Operations Workshop.',
              { fontFamily: BODY, fontSize: 17, color: '#475569' },
            ),
            {
              id: 'tr-seal',
              type: 'image',
              name: 'Official Wax Seal',
              src: stockUri('wax-seal'),
              x: 480,
              y: 504,
              width: 96,
              height: 96,
              rotation: 0,
              zIndex: 4,
              borderRadius: 50,
              objectFit: 'contain',
            },
            ...signature(
              'tr-sig-l',
              { x: 112, y: 648, width: 256 },
              { name: 'Engr. Paolo Reyes', role: 'PROGRAM LEAD TRAINER' },
              { rule: '#94a3b8' },
            ),
            ...signature(
              'tr-sig-r',
              { x: 560, y: 648, width: 256 },
              { name: 'Maria Santos', role: 'TRAINING REGISTRAR' },
              { rule: '#94a3b8' },
            ),
            qr('tr-qr', { x: 936, y: 632, width: 72, height: 72 }, 'https://stclaire.edu/verify/tr-2026'),
            text('tr-id', { x: 872, y: 712, width: 136, height: 20 }, 'ID #TR-2026', {
              fontFamily: BODY,
              fontSize: 10,
              fontWeight: '600',
              color: '#64748b',
              letterSpacing: 1.4,
            }),
          ],
        },
      ],
    },
  },

  // 6. Office / Community: Service & Appreciation Award
  {
    id: 'cert-service-appreciation',
    name: 'Service & Appreciation Award',
    description: 'Warm burgundy & cream appreciation certificate with Botanical Leaf Arch and Gold Seal.',
    category: 'Certificate',
    thumbnailColor: '#881337',
    thumbnailGradient: 'linear-gradient(135deg, #881337 0%, #f59e0b 100%)',
    project: {
      id: 'proj-cert-apprec',
      name: 'Service Appreciation.pub',
      pageSizeName: 'certificate',
      colorScheme: 'crimson-editorial',
      activePageIndex: 0,
      masterPage: { elements: [], showOnAllPages: true },
      pages: [
        {
          id: 'page-1',
          name: 'Appreciation',
          width: 1056,
          height: 816,
          orientation: 'landscape',
          margins: { top: 48, right: 48, bottom: 48, left: 48 },
          backgroundColor: '#fff1f2',
          backgroundPattern: { type: 'dots', color: '#9f1239', opacity: 0.06, scale: 32, strokeWidth: 1.5, rotation: 0 },
          guides: [],
          elements: [
            shape('ap-card', { x: 32, y: 32, width: 992, height: 752 }, {
              fillColor: '#fffdf9',
              strokeColor: '#9f1239',
              strokeWidth: 6,
              locked: true,
              zIndex: 1,
            }),
            // The double gold rule is the whole "engraved stationery" gesture: a hairline and a
            // heavy line a few millimetres in, both inside the burgundy frame.
            shape('ap-rule-a', { x: 48, y: 48, width: 960, height: 720 }, {
              strokeColor: '#d97706',
              strokeWidth: 1,
              locked: true,
              zIndex: 2,
            }),
            // Locked: 12px inside the hairline is the engraved-stationery gap, and the margin
            // snap only knows about one edge — it would flatten the pair into a single rule.
            shape('ap-rule-b', { x: 60, y: 60, width: 936, height: 696 }, {
              strokeColor: '#d97706',
              strokeWidth: 3,
              locked: true,
              zIndex: 2,
            }),
            {
              id: 'ap-arch',
              type: 'image',
              name: 'Botanical Arch',
              src: stockUri('botanical-arch'),
              x: 88,
              y: 88,
              width: 120,
              height: 120,
              rotation: 0,
              zIndex: 4,
              borderRadius: 16,
              objectFit: 'contain',
            },
            text(
              'ap-title',
              { x: 176, y: 104, width: 704, height: 64 },
              'CERTIFICATE OF APPRECIATION',
              {
                fontFamily: DISPLAY,
                fontSize: 38,
                fontWeight: 'bold',
                color: '#881337',
                isWordArt: true,
                wordArtStyle: 'trophy-gold',
              },
            ),
            text(
              'ap-sub',
              { x: 176, y: 192, width: 704, height: 32 },
              'PRESENTED WITH SINCERE GRATITUDE TO',
              {
                fontFamily: BODY,
                fontSize: 13,
                fontWeight: 'bold',
                color: '#b45309',
                letterSpacing: 2.5,
              },
            ),
            text('ap-name', { x: 140, y: 256, width: 776, height: 96 }, 'Honoree Full Name', {
              fontFamily: SCRIPT,
              fontSize: 56,
              fontWeight: 'normal',
              color: '#0f172a',
            }),
            text(
              'ap-desc',
              { x: 176, y: 376, width: 704, height: 96 },
              'In heartfelt appreciation for your invaluable contribution, dedicated service, and unwavering support to our organization and community.',
              { fontFamily: BODY, fontSize: 17, color: '#334155' },
            ),
            {
              id: 'ap-seal',
              type: 'image',
              name: 'Gold Seal',
              src: stickerUri('stk-gold-seal'),
              x: 480,
              y: 496,
              width: 96,
              height: 96,
              rotation: 0,
              zIndex: 5,
              objectFit: 'contain',
              effectPreset: 'sticker',
              isSticker: true,
              stickerOutlineColor: '#ffffff',
              stickerOutlineWidth: 4,
            },
            ...signature(
              'ap-sig-l',
              { x: 112, y: 648, width: 248 },
              { name: 'Ramon Delgado', role: 'MANAGING DIRECTOR' },
              { rule: '#d6b48c', name: '#3f1d24', role: '#5b6675' },
            ),
            ...signature(
              'ap-sig-r',
              { x: 696, y: 648, width: 248 },
              { name: 'Isabel Mercado', role: 'BOARD CHAIRPERSON' },
              { rule: '#d6b48c', name: '#3f1d24', role: '#5b6675' },
            ),
          ],
        },
      ],
    },
  },

  // ── The DepEd set ───────────────────────────────────────────────────────────────────────
  //
  // Six certificates for the Philippine public-school calendar, on the drawn sheet rather than
  // inside the 48px margin: the layout lives inside the frame's opening, and the opening is not a
  // rectangle. Each border was measured row by row at 1056×816 — the free run across that row,
  // alpha > 24 — because the ornaments climb into the page: royal-gold is clear 125–930 through the
  // middle rows, 204–851 by y656 and 244–811 by y672, which is why its signature pair sits at 248
  // and 560 rather than against the margin. The crayon frame is clear 67–988 through the middle and
  // 142–913 by y656. Every box below is inside the run of the rows it actually occupies.
  //
  // The rhythm is the other half: every box is on the 8px step and every stack gap is a multiple of
  // 8, so `alignToGrid` and `normaliseRhythm` find nothing to fix and the pages ship as authored.
  //
  // A note on the names: a project's `name` is a title now, not a filename — the save supplies
  // `.spress` — so these six carry no extension.

  // 7. DepEd: Academic Excellence (DO 015, s. 2026)
  {
    id: 'cert-deped-academic-excellence',
    name: 'DepEd Academic Excellence Award (DO 015, s. 2026)',
    description:
      'Parchment certificate for a general average of 90 and above under DepEd Order No. 015, s. 2026 — royal-gold frame, gold flourish rule and foil seal.',
    category: 'Certificate',
    thumbnailColor: '#8a6a2f',
    thumbnailGradient: 'linear-gradient(135deg, #fbf6ea 0%, #b08d3f 100%)',
    project: {
      id: 'proj-cert-deped-academic',
      name: 'DepEd Academic Excellence Award',
      pageSizeName: 'certificate',
      colorScheme: 'slate-gold',
      activePageIndex: 0,
      masterPage: { elements: [], showOnAllPages: true },
      pages: [
        {
          id: 'page-1',
          name: 'Academic Excellence',
          width: 1056,
          height: 816,
          orientation: 'landscape',
          margins: { top: 48, right: 48, bottom: 48, left: 48 },
          backgroundColor: '#fbf6ea',
          backgroundPattern: { type: 'dots', color: '#8a6a2f', opacity: 0.06, scale: 32, strokeWidth: 1.5, rotation: 0 },
          guides: [],
          elements: [
            ...drawnSheet('dp-ac', 'cert-bg-parchment-guilloche', 'cert-border-royal-gold'),
            ...depedHeader('dp-ac', { x: 216, y: 176, width: 628, ink: '#4a4234', muted: '#6b6355' }),
            text(
              'dp-ac-title',
              { x: 168, y: 232, width: 720, height: 56 },
              'ACADEMIC EXCELLENCE AWARD',
              {
                fontFamily: DISPLAY,
                fontSize: 36,
                fontWeight: 'bold',
                color: '#3f2f0a',
                isWordArt: true,
                wordArtStyle: 'trophy-gold',
              },
            ),
            art(
              'dp-ac-seal',
              { x: 480, y: 304, width: 96, height: 96 },
              stickerUri('cert-seal-gold-foil'),
              'Gold Foil Seal',
            ),
            text(
              'dp-ac-order',
              { x: 176, y: 408, width: 704, height: 16 },
              'DepEd Order No. 015, s. 2026 • General Average of 90 and Above',
              { fontFamily: BODY, fontSize: 11, fontWeight: 'bold', color: '#7a5a1e', letterSpacing: 1.4 },
            ),
            text('dp-ac-name', { x: 152, y: 432, width: 752, height: 72 }, 'Juan Miguel A. Dela Cruz', {
              fontFamily: SCRIPT,
              fontSize: 50,
              color: '#241f18',
            }),
            art(
              'dp-ac-rule',
              { x: 328, y: 528, width: 400, height: 32 },
              stockUri('cert-line-gold-flourish'),
              'Gold Flourish Rule',
              { zIndex: 4 },
            ),
            text(
              'dp-ac-citation',
              { x: 176, y: 568, width: 704, height: 48 },
              'For attaining a general average of ninety (90) or higher in all learning areas, and for the discipline and diligence that earned this distinction for School Year 2025–2026.',
              { fontFamily: BODY, fontSize: 15, color: '#3f3a2f', lineHeight: 1.4 },
            ),
            ...signature(
              'dp-ac-sig-l',
              { x: 248, y: 616, width: 248 },
              { name: 'Ma. Clarissa B. Bautista', role: 'CLASS ADVISER' },
              { rule: '#b08d3f', name: '#241f18', role: '#5b5445' },
            ),
            ...signature(
              'dp-ac-sig-r',
              { x: 560, y: 616, width: 248 },
              { name: 'Dr. Ramon C. Villanueva', role: 'SCHOOL PRINCIPAL' },
              { rule: '#b08d3f', name: '#241f18', role: '#5b5445' },
            ),
          ],
        },
      ],
    },
  },

  // 8. DepEd: K–3 Certificate of Merit
  {
    id: 'cert-deped-k3-merit',
    name: 'DepEd K–3 Certificate of Merit',
    description:
      'Pastel-sky certificate for Kinder to Grade 3 — crayon-star frame, star-dotted rule and a smiling star medal.',
    category: 'Certificate',
    thumbnailColor: '#0ea5e9',
    thumbnailGradient: 'linear-gradient(135deg, #e0f2fe 0%, #fbbf24 100%)',
    project: {
      id: 'proj-cert-deped-k3',
      name: 'DepEd K-3 Certificate of Merit',
      pageSizeName: 'certificate',
      colorScheme: 'ocean-navy',
      activePageIndex: 0,
      masterPage: { elements: [], showOnAllPages: true },
      pages: [
        {
          id: 'page-1',
          name: 'K-3 Merit',
          width: 1056,
          height: 816,
          orientation: 'landscape',
          margins: { top: 48, right: 48, bottom: 48, left: 48 },
          backgroundColor: '#eef8ff',
          backgroundPattern: { type: 'dots', color: '#38bdf8', opacity: 0.06, scale: 28, strokeWidth: 1.5, rotation: 0 },
          guides: [],
          elements: [
            ...drawnSheet('dp-k3m', 'cert-bg-k3-pastel-sky', 'cert-border-k3-crayon-stars'),
            ...depedHeader('dp-k3m', { x: 208, y: 136, width: 644, ink: '#26445c', muted: '#4c667a' }),
            text(
              'dp-k3m-title',
              { x: 152, y: 208, width: 752, height: 56 },
              'CERTIFICATE OF MERIT',
              {
                fontFamily: ROUND,
                fontSize: 40,
                fontWeight: 'bold',
                color: '#1e3a8a',
                isWordArt: true,
                wordArtStyle: 'champs-basa-blue',
              },
            ),
            text(
              'dp-k3m-ribbon',
              { x: 288, y: 288, width: 480, height: 40 },
              'KINDER TO GRADE 3',
              {
                fontFamily: SOFT,
                fontSize: 18,
                fontWeight: 'bold',
                color: '#14343f',
                isWordArt: true,
                wordArtStyle: 'champs-gold-ribbon',
              },
            ),
            text('dp-k3m-name', { x: 152, y: 344, width: 752, height: 72 }, 'Andrea Sofia L. Mercado', {
              fontFamily: BALOO,
              fontSize: 52,
              color: '#123c5a',
            }),
            art(
              'dp-k3m-rule',
              { x: 288, y: 432, width: 480, height: 40 },
              stockUri('cert-line-k3-stars'),
              'Star Dotted Rule',
              { zIndex: 4 },
            ),
            text(
              'dp-k3m-citation',
              { x: 232, y: 496, width: 592, height: 64 },
              'For showing remarkable progress, cheerful participation, and a genuine love of learning in the early grades this School Year 2025–2026.',
              { fontFamily: SOFT, fontSize: 16, color: '#2f4a5c', lineHeight: 1.4 },
            ),
            art(
              'dp-k3m-star',
              { x: 112, y: 496, width: 112, height: 112 },
              stickerUri('cert-stk-k3-gold-star'),
              'Smiling Star Medal',
            ),
            ...signature(
              'dp-k3m-sig-l',
              { x: 184, y: 648, width: 248 },
              { name: 'Ma. Clarissa B. Bautista', role: 'CLASS ADVISER' },
              { rule: '#94a3b8', name: '#123c5a', role: '#4c667a' },
            ),
            ...signature(
              'dp-k3m-sig-r',
              { x: 624, y: 648, width: 248 },
              { name: 'Dr. Ramon C. Villanueva', role: 'SCHOOL HEAD' },
              { rule: '#94a3b8', name: '#123c5a', role: '#4c667a' },
            ),
          ],
        },
      ],
    },
  },

  // 9. DepEd: Character Traits Award (Core Values)
  {
    id: 'cert-deped-character-traits',
    name: 'DepEd Character Traits Award (Core Values)',
    description:
      'Emerald-framed core-values award with the four DepEd values in a teal band, an editable trait callout and a values heart.',
    category: 'Certificate',
    thumbnailColor: '#0f766e',
    thumbnailGradient: 'linear-gradient(135deg, #d1fae5 0%, #0f766e 100%)',
    project: {
      id: 'proj-cert-deped-character',
      name: 'DepEd Character Traits Award',
      pageSizeName: 'certificate',
      colorScheme: 'ocean-navy',
      activePageIndex: 0,
      masterPage: { elements: [], showOnAllPages: true },
      pages: [
        {
          id: 'page-1',
          name: 'Character Traits',
          width: 1056,
          height: 816,
          orientation: 'landscape',
          margins: { top: 48, right: 48, bottom: 48, left: 48 },
          backgroundColor: '#f4fbff',
          backgroundPattern: { type: 'dots', color: '#0f766e', opacity: 0.06, scale: 32, strokeWidth: 1.5, rotation: 0 },
          guides: [],
          elements: [
            ...drawnSheet('dp-ct', 'cert-bg-k3-pastel-sky', 'cert-border-emerald-modern'),
            ...depedHeader('dp-ct', { x: 176, y: 144, width: 708, ink: '#1f3f4a', muted: '#4a6a72' }),
            text(
              'dp-ct-title',
              { x: 152, y: 216, width: 752, height: 56 },
              'CHARACTER TRAITS AWARD',
              {
                fontFamily: ROUND,
                fontSize: 40,
                fontWeight: 'bold',
                color: '#065f46',
                isWordArt: true,
                wordArtStyle: 'reading-nook-sage',
              },
            ),
            // The four Core Values, in one band: the exact wording is fixed by the Department, so
            // it is a text element a teacher can read, not a picture of the words.
            shape('dp-ct-values-pill', { x: 208, y: 288, width: 640, height: 40 }, {
              shapeType: 'rounded-rect',
              fillColor: '#0f766e',
              cornerRadius: 20,
              zIndex: 3,
            }),
            text(
              'dp-ct-values',
              { x: 232, y: 296, width: 592, height: 16 },
              'Maka-Diyos • Makatao • Makakalikasan • Makabansa',
              { fontFamily: BODY, fontSize: 11, fontWeight: 'bold', color: '#ffffff', letterSpacing: 1.6 },
            ),
            text('dp-ct-kicker', { x: 176, y: 352, width: 704, height: 16 }, 'AWARDED TO', {
              fontFamily: BODY,
              fontSize: 12,
              fontWeight: 'bold',
              color: '#3f5a63',
              letterSpacing: 2.4,
            }),
            text('dp-ct-name', { x: 152, y: 376, width: 752, height: 64 }, 'Josefina Marie T. Alonzo', {
              fontFamily: BALOO,
              fontSize: 48,
              color: '#123c5a',
            }),
            // The callout is the editable line: every learner is cited for a different trait.
            shape('dp-ct-trait-pill', { x: 320, y: 456, width: 416, height: 64 }, {
              shapeType: 'rounded-rect',
              fillColor: '#fff7ed',
              strokeColor: '#e7c9a9',
              strokeWidth: 2,
              cornerRadius: 28,
              zIndex: 3,
            }),
            text('dp-ct-trait', { x: 344, y: 472, width: 368, height: 36 }, 'Most Helpful & Kind', {
              fontFamily: DISPLAY,
              fontSize: 26,
              fontWeight: 'bold',
              color: '#7c2d12',
            }),
            text(
              'dp-ct-citation',
              { x: 216, y: 528, width: 624, height: 48 },
              'For consistently living the Core Values at home and in school — the first to help, the last to complain, and a steady example to classmates.',
              { fontFamily: BODY, fontSize: 15, color: '#2f4a5c', lineHeight: 1.4 },
            ),
            // The same star rule the K-3 frame is drawn with, closing the citation before the
            // signatures — it is the only ornament in this template that is not a seal.
            art(
              'dp-ct-rule',
              { x: 288, y: 584, width: 480, height: 40 },
              stockUri('cert-line-k3-stars'),
              'Star Dotted Rule',
              { zIndex: 4 },
            ),
            art(
              'dp-ct-heart',
              { x: 88, y: 520, width: 112, height: 112 },
              stickerUri('cert-stk-values-heart'),
              'Values Heart',
            ),
            ...signature(
              'dp-ct-sig-l',
              { x: 168, y: 640, width: 248 },
              { name: 'Ma. Clarissa B. Bautista', role: 'CLASS ADVISER' },
              { rule: '#94a3b8', name: '#123c5a', role: '#4c667a' },
            ),
            ...signature(
              'dp-ct-sig-r',
              { x: 640, y: 640, width: 248 },
              { name: 'Dr. Ramon C. Villanueva', role: 'SCHOOL HEAD' },
              { rule: '#94a3b8', name: '#123c5a', role: '#4c667a' },
            ),
          ],
        },
      ],
    },
  },

  // 10. DepEd: Perfect Attendance Award
  {
    id: 'cert-deped-perfect-attendance',
    name: 'DepEd Perfect Attendance Award',
    description:
      'Crayon-star attendance award with a gold quarter ribbon, the SF2 citation, and the alarm-clock-and-apple medal.',
    category: 'Certificate',
    thumbnailColor: '#e11d48',
    thumbnailGradient: 'linear-gradient(135deg, #ffe4e6 0%, #fb7185 100%)',
    project: {
      id: 'proj-cert-deped-attendance',
      name: 'DepEd Perfect Attendance Award',
      pageSizeName: 'certificate',
      colorScheme: 'ocean-navy',
      activePageIndex: 0,
      masterPage: { elements: [], showOnAllPages: true },
      pages: [
        {
          id: 'page-1',
          name: 'Perfect Attendance',
          width: 1056,
          height: 816,
          orientation: 'landscape',
          margins: { top: 48, right: 48, bottom: 48, left: 48 },
          backgroundColor: '#f7fbff',
          backgroundPattern: { type: 'dots', color: '#f43f5e', opacity: 0.06, scale: 28, strokeWidth: 1.5, rotation: 0 },
          guides: [],
          elements: [
            ...drawnSheet('dp-att', 'cert-bg-k3-pastel-sky', 'cert-border-k3-crayon-stars'),
            ...depedHeader('dp-att', { x: 208, y: 136, width: 644, ink: '#26445c', muted: '#4c667a' }),
            // The coral ramp runs from rose to deep wine, so it needs a dark ground to read on and
            // a light one would repaint it. The plaque is that ground: a plum board the way a
            // classroom has one, rimmed in the same coral the letters are painted with.
            shape('dp-att-plaque', { x: 232, y: 216, width: 592, height: 72 }, {
              shapeType: 'rounded-rect',
              fillColor: '#4a1526',
              strokeColor: '#fb7185',
              strokeWidth: 2,
              cornerRadius: 32,
              zIndex: 3,
            }),
            text(
              'dp-att-title',
              { x: 256, y: 224, width: 544, height: 56 },
              'PERFECT ATTENDANCE',
              {
                fontFamily: ROUND,
                fontSize: 44,
                fontWeight: 'bold',
                color: '#ffe4e6',
                isWordArt: true,
                wordArtStyle: 'champs-kasadya-coral',
              },
            ),
            text(
              'dp-att-ribbon',
              { x: 288, y: 304, width: 480, height: 40 },
              'FIRST QUARTER • SY 2025–2026',
              {
                fontFamily: SOFT,
                fontSize: 18,
                fontWeight: 'bold',
                color: '#14343f',
                isWordArt: true,
                wordArtStyle: 'champs-gold-ribbon',
              },
            ),
            text('dp-att-name', { x: 152, y: 360, width: 752, height: 64 }, 'Nathaniel P. Rivera', {
              fontFamily: BALOO,
              fontSize: 50,
              color: '#123c5a',
            }),
            art(
              'dp-att-rule',
              { x: 288, y: 440, width: 480, height: 40 },
              stockUri('cert-line-k3-stars'),
              'Star Dotted Rule',
              { zIndex: 4 },
            ),
            text(
              'dp-att-citation',
              { x: 248, y: 488, width: 560, height: 64 },
              'For completing the First Quarter of School Year 2025–2026 with zero absences and zero tardiness, as recorded in School Form 2 (SF2).',
              { fontFamily: SOFT, fontSize: 16, color: '#2f4a5c', lineHeight: 1.4 },
            ),
            art(
              'dp-att-star',
              { x: 112, y: 488, width: 128, height: 128 },
              stickerUri('cert-stk-perfect-attendance'),
              'Perfect Attendance Medal',
            ),
            ...signature(
              'dp-att-sig-l',
              { x: 184, y: 648, width: 248 },
              { name: 'Ma. Clarissa B. Bautista', role: 'CLASS ADVISER' },
              { rule: '#94a3b8', name: '#123c5a', role: '#4c667a' },
            ),
            ...signature(
              'dp-att-sig-r',
              { x: 624, y: 648, width: 248 },
              { name: 'Dr. Ramon C. Villanueva', role: 'SCHOOL HEAD' },
              { rule: '#94a3b8', name: '#123c5a', role: '#4c667a' },
            ),
          ],
        },
      ],
    },
  },

  // 11. DepEd: Leadership & Special Recognition
  {
    id: 'cert-deped-leadership-special',
    name: 'DepEd Leadership & Special Recognition Award',
    description:
      'Maroon-heritage leadership award for a contest, a student-government post or a special citation — torch-and-laurel seal.',
    category: 'Certificate',
    thumbnailColor: '#7f1d1d',
    thumbnailGradient: 'linear-gradient(135deg, #faf4e8 0%, #7f1d1d 100%)',
    project: {
      id: 'proj-cert-deped-leadership',
      name: 'DepEd Leadership and Special Recognition',
      pageSizeName: 'certificate',
      colorScheme: 'crimson-editorial',
      activePageIndex: 0,
      masterPage: { elements: [], showOnAllPages: true },
      pages: [
        {
          id: 'page-1',
          name: 'Leadership',
          width: 1056,
          height: 816,
          orientation: 'landscape',
          margins: { top: 48, right: 48, bottom: 48, left: 48 },
          backgroundColor: '#faf4e8',
          backgroundPattern: { type: 'grid', color: '#7f1d1d', opacity: 0.05, scale: 40, strokeWidth: 1.5, rotation: 0 },
          guides: [],
          elements: [
            ...drawnSheet('dp-lead', 'cert-bg-maroon-heritage', 'cert-border-royal-gold'),
            ...depedHeader('dp-lead', { x: 216, y: 176, width: 628, ink: '#4a2a20', muted: '#6b4a3e' }),
            text(
              'dp-lead-title',
              { x: 168, y: 232, width: 720, height: 56 },
              'LEADERSHIP EXCELLENCE',
              {
                fontFamily: DISPLAY,
                fontSize: 36,
                fontWeight: 'bold',
                color: '#3f2f0a',
                isWordArt: true,
                wordArtStyle: 'trophy-gold',
              },
            ),
            text('dp-lead-name', { x: 152, y: 304, width: 752, height: 72 }, 'Maria Isabel D. Santos', {
              fontFamily: SCRIPT,
              fontSize: 50,
              color: '#2a1a14',
            }),
            art(
              'dp-lead-seal',
              { x: 480, y: 400, width: 96, height: 96 },
              stickerUri('cert-seal-torch-laurel'),
              'Torch and Laurel Seal',
            ),
            art(
              'dp-lead-rule',
              { x: 328, y: 512, width: 400, height: 32 },
              stockUri('cert-line-gold-flourish'),
              'Gold Flourish Rule',
              { zIndex: 4 },
            ),
            text(
              'dp-lead-citation',
              { x: 176, y: 552, width: 704, height: 56 },
              'For outstanding leadership and service as an officer of the Supreme Student Government, and for representing the school in the 2026 Division Leadership Congress.',
              { fontFamily: BODY, fontSize: 15, color: '#3f2a22', lineHeight: 1.4 },
            ),
            ...signature(
              'dp-lead-sig-l',
              { x: 248, y: 616, width: 248 },
              { name: 'Atty. Percival R. Lim', role: 'AWARDS COMMITTEE CHAIR' },
              { rule: '#b08d3f', name: '#241f18', role: '#5b4038' },
            ),
            ...signature(
              'dp-lead-sig-r',
              { x: 560, y: 616, width: 248 },
              { name: 'Dr. Ramon C. Villanueva', role: 'SCHOOL HEAD' },
              { rule: '#b08d3f', name: '#241f18', role: '#5b4038' },
            ),
          ],
        },
      ],
    },
  },

  // 12. DepEd: INSET / LAC & Stakeholder Appreciation
  {
    id: 'cert-deped-inset-lac',
    name: 'DepEd INSET / LAC & Stakeholder Appreciation',
    description:
      'Modern blue certificate for INSET, Learning Action Cell and stakeholder sessions — event metadata, verification QR and foil seal.',
    category: 'Certificate',
    thumbnailColor: '#1d4ed8',
    thumbnailGradient: 'linear-gradient(135deg, #dbeafe 0%, #1e3a8a 100%)',
    project: {
      id: 'proj-cert-deped-inset',
      name: 'DepEd INSET and LAC Certificate',
      pageSizeName: 'certificate',
      colorScheme: 'ocean-navy',
      activePageIndex: 0,
      masterPage: { elements: [], showOnAllPages: true },
      pages: [
        {
          id: 'page-1',
          name: 'INSET / LAC',
          width: 1056,
          height: 816,
          orientation: 'landscape',
          margins: { top: 48, right: 48, bottom: 48, left: 48 },
          backgroundColor: '#f4f8ff',
          backgroundPattern: { type: 'grid', color: '#1d4ed8', opacity: 0.05, scale: 40, strokeWidth: 1.5, rotation: 0 },
          guides: [],
          elements: [
            ...drawnSheet('dp-lac', 'cert-bg-modern-blue-geo', 'cert-border-emerald-modern'),
            ...depedHeader('dp-lac', { x: 176, y: 144, width: 708, ink: '#1f3f4a', muted: '#4a6a72' }),
            text(
              'dp-lac-title',
              { x: 152, y: 216, width: 752, height: 56 },
              'CERTIFICATE OF PARTICIPATION',
              {
                fontFamily: BODY,
                fontSize: 38,
                fontWeight: 'bold',
                color: '#0f172a',
                isWordArt: true,
                wordArtStyle: 'portfolio-indigo',
              },
            ),
            text('dp-lac-name', { x: 152, y: 288, width: 752, height: 56 }, 'Rosalie D. Fernandez', {
              fontFamily: BODY,
              fontSize: 36,
              fontWeight: 'bold',
              color: '#0f2233',
            }),
            // Topic • date • venue • hours: one line, because that is how a certificate is filed,
            // and every field stays editable.
            text(
              'dp-lac-meta',
              { x: 152, y: 360, width: 752, height: 24 },
              'Contextualized Learning • 12–14 March 2026 • LRC, San Roque NHS • 24 Training Hours',
              { fontFamily: BODY, fontSize: 12, fontWeight: '600', color: '#3f5a63', letterSpacing: 0.6 },
            ),
            text(
              'dp-lac-citation',
              { x: 176, y: 392, width: 704, height: 64 },
              'For completing the School-Based In-Service Training and Learning Action Cell for teachers, and for the participation and collegiality that made the sessions work.',
              { fontFamily: BODY, fontSize: 15, color: '#2f4a5c', lineHeight: 1.4 },
            ),
            art(
              'dp-lac-rule',
              { x: 288, y: 464, width: 480, height: 40 },
              stockUri('cert-line-blue-ribbon'),
              'Ribbon Divider',
              { zIndex: 4 },
            ),
            art(
              'dp-lac-seal',
              { x: 112, y: 512, width: 88, height: 88 },
              stickerUri('cert-seal-gold-foil'),
              'Gold Foil Seal',
            ),
            qr('dp-lac-qr', { x: 856, y: 512, width: 88, height: 88 }, 'https://deped.gov.ph/verify/inset-2026-srnshs'),
            ...signature(
              'dp-lac-sig-l',
              { x: 200, y: 640, width: 296 },
              { name: 'Dr. Ramon C. Villanueva', role: 'SCHOOL HEAD' },
              { rule: '#94a3b8', name: '#123c5a', role: '#4c667a' },
            ),
            ...signature(
              'dp-lac-sig-r',
              { x: 560, y: 640, width: 296 },
              { name: 'Dr. Lilia M. Ocampo', role: 'PUBLIC SCHOOLS DISTRICT SUPERVISOR' },
              { rule: '#94a3b8', name: '#123c5a', role: '#4c667a' },
            ),
          ],
        },
      ],
    },
  },
];
