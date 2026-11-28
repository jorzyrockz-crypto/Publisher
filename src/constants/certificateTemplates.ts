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
 * The six certificates, drawn against a small set of shared parts.
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

/** A circular frame waiting for a crest. Deliberately empty — see `ImageElement.slotKind`. */
const logoSlot = (id: string, x: number, y: number, name: string): ImageElement => ({
  id,
  type: 'image',
  name,
  src: '',
  x,
  y,
  width: 64,
  height: 64,
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
];
