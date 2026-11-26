import {
  Page,
  PublisherElement,
  ShapeElement,
  TextElement,
} from '../types/publisher';
import {
  classifyElements,
  composeDesignForTarget,
  fitTextToBox,
} from './designBlueprints';

export type DesignRecommendationCategory = 'all' | 'layouts' | 'color-dark' | 'photo';

export interface DesignRecommendation {
  id: string;
  title: string;
  subtitle: string;
  category: Exclude<DesignRecommendationCategory, 'all'>;
  badge: string;
  previewPage: Page;
}

export interface AIDesignAdvice {
  vibeTitle: string;
  bg: string;
  primary: string;
  accent: string;
  text: string;
  headingFont: string;
  bodyFont: string;
  preferredLayout: 'split-left' | 'split-right' | 'centered' | 'dark' | 'swiss';
  source: 'gemini' | 'local';
}

function cloneElements(els: PublisherElement[]): PublisherElement[] {
  return JSON.parse(JSON.stringify(els));
}

function makeAccentBar(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor: string,
  zIndex = 1
): ShapeElement {
  return {
    id,
    type: 'shape',
    name: 'Design Accent',
    shapeType: 'rectangle',
    x,
    y,
    width,
    height,
    rotation: 0,
    zIndex,
    fillColor,
    strokeColor: 'transparent',
    strokeWidth: 0,
  };
}

function fitEl(el: TextElement, maxW: number, maxH: number): TextElement {
  const { fontSize, neededHeight } = fitTextToBox(
    el.text,
    el.fontFamily,
    el.fontWeight,
    el.fontSize || 18,
    10,
    maxW,
    maxH,
    el.lineHeight || 1.25,
    el.letterSpacing || 0
  );
  return {
    ...el,
    width: maxW,
    fontSize,
    height: Math.max(24, Math.min(maxH, neededHeight)),
  };
}

function applyPaletteToElements(
  elements: PublisherElement[],
  palette: { text: string; muted: string; primary: string; accent: string; headingFont?: string; bodyFont?: string }
): PublisherElement[] {
  return elements.map((el): PublisherElement => {
    if (el.type === 'text') {
      const isHeading = (el.fontSize || 16) >= 22;
      return fitEl(
        {
          ...el,
          color: isHeading ? palette.text : palette.muted,
          fontFamily: isHeading
            ? palette.headingFont || el.fontFamily
            : palette.bodyFont || el.fontFamily,
        },
        el.width,
        el.height
      );
    }
    if (el.type === 'shape') {
      return {
        ...el,
        fillColor:
          el.fillColor === 'transparent'
            ? 'transparent'
            : el.width > 300 && el.height > 300
            ? palette.primary
            : palette.accent,
      };
    }
    return el;
  });
}

function buildSplitLayout(
  page: Page,
  side: 'left' | 'right',
  palette: { bg: string; text: string; muted: string; primary: string; accent: string; headingFont?: string; bodyFont?: string }
): Page {
  const cloned = cloneElements(page.elements);
  const roles = classifyElements(cloned, page.width, page.height);
  const m = page.margins || { top: 48, right: 48, bottom: 48, left: 48 };
  const cw = page.width - m.left - m.right;
  const ch = page.height - m.top - m.bottom;

  const hasVisual = roles.visuals.length > 0;
  const colGap = 24;
  const visualColW = hasVisual ? Math.round(cw * 0.46) : cw;
  const textColW = hasVisual ? cw - visualColW - colGap : cw;
  const visualX = side === 'left' ? m.left : m.left + textColW + colGap;
  const textX = side === 'left' ? (hasVisual ? m.left + visualColW + colGap : m.left) : m.left;

  const next: PublisherElement[] = [];

  // Accent vertical or top bar
  next.push(makeAccentBar(`rec-bar-${side}`, textX, m.top, 56, 6, palette.accent, 2));

  let curY = m.top + 18;
  if (roles.kicker && roles.kicker.type === 'text') {
    const k = fitEl(
      {
        ...roles.kicker,
        x: textX,
        y: curY,
        width: textColW,
        textAlign: 'left',
        color: palette.accent,
        fontFamily: palette.bodyFont || roles.kicker.fontFamily,
        zIndex: 5,
      },
      textColW,
      34
    );
    next.push(k);
    curY += k.height + 8;
  }

  if (roles.heroTitle && roles.heroTitle.type === 'text') {
    const h = fitEl(
      {
        ...roles.heroTitle,
        x: textX,
        y: curY,
        width: textColW,
        textAlign: 'left',
        color: palette.text,
        fontFamily: palette.headingFont || roles.heroTitle.fontFamily,
        zIndex: 6,
      },
      textColW,
      Math.round(ch * 0.36)
    );
    next.push(h);
    curY += h.height + 12;
  }

  for (const sub of roles.subtitles) {
    if (sub.type !== 'text') continue;
    if (curY > page.height - m.bottom - 30) break;
    const availH = Math.max(36, page.height - m.bottom - curY - 36);
    const s = fitEl(
      {
        ...sub,
        x: textX,
        y: curY,
        width: textColW,
        textAlign: 'left',
        color: palette.muted,
        fontFamily: palette.bodyFont || sub.fontFamily,
        zIndex: 5,
      },
      textColW,
      availH
    );
    next.push(s);
    curY += s.height + 10;
  }

  for (const cta of roles.ctaPills) {
    next.push({
      ...cta,
      x: textX,
      y: Math.min(page.height - m.bottom - cta.height, curY + 4),
      fillColor: palette.primary,
      zIndex: 7,
    });
    curY += cta.height + 8;
  }

  if (hasVisual) {
    const count = Math.min(2, roles.visuals.length);
    const gap = 12;
    const eachH = Math.round((ch - gap * (count - 1)) / count);
    roles.visuals.slice(0, count).forEach((v, idx) => {
      next.push({
        ...v,
        x: visualX,
        y: m.top + idx * (eachH + gap),
        width: visualColW,
        height: eachH,
        zIndex: 4,
      });
    });
  }

  return {
    ...page,
    backgroundColor: palette.bg,
    backgroundGradient: undefined,
    backgroundPattern: undefined,
    elements: next,
  };
}

function buildHeroOverlayLayout(page: Page): Page | null {
  const cloned = cloneElements(page.elements);
  const roles = classifyElements(cloned, page.width, page.height);
  if (roles.visuals.length === 0) return null;

  const mainVisual = roles.visuals[0];
  const m = page.margins || { top: 48, right: 48, bottom: 48, left: 48 };
  const cw = page.width - m.left - m.right;
  const next: PublisherElement[] = [];

  next.push({
    ...mainVisual,
    x: 0,
    y: 0,
    width: page.width,
    height: page.height,
    rotation: 0,
    zIndex: 1,
    ...(mainVisual.type === 'image' ? { objectFit: 'cover' as const, borderWidth: 0, borderArt: 'none' as const } : {}),
  });

  // Translucent dark scrim card for legible typography
  const cardH = Math.round(page.height * 0.44);
  const cardY = Math.round(page.height - cardH - m.bottom);
  next.push({
    id: 'rec-hero-scrim',
    type: 'shape',
    name: 'Overlay Scrim',
    shapeType: 'rounded-rect',
    x: m.left,
    y: cardY,
    width: cw,
    height: cardH,
    rotation: 0,
    zIndex: 2,
    fillColor: '#0f172a',
    opacity: 0.78,
    strokeColor: 'rgba(255,255,255,0.2)',
    strokeWidth: 1,
    cornerRadius: 18,
  });

  let curY = cardY + 24;
  if (roles.kicker && roles.kicker.type === 'text') {
    const k = fitEl(
      { ...roles.kicker, x: m.left + 24, y: curY, width: cw - 48, color: '#fbbf24', textAlign: 'left', zIndex: 4 },
      cw - 48,
      28
    );
    next.push(k);
    curY += k.height + 6;
  }
  if (roles.heroTitle && roles.heroTitle.type === 'text') {
    const h = fitEl(
      { ...roles.heroTitle, x: m.left + 24, y: curY, width: cw - 48, color: '#ffffff', textAlign: 'left', zIndex: 5 },
      cw - 48,
      Math.round(cardH * 0.45)
    );
    next.push(h);
    curY += h.height + 8;
  }
  for (const sub of roles.subtitles.slice(0, 2)) {
    if (sub.type !== 'text') continue;
    const s = fitEl(
      { ...sub, x: m.left + 24, y: curY, width: cw - 48, color: '#e2e8f0', textAlign: 'left', zIndex: 4 },
      cw - 48,
      54
    );
    next.push(s);
    curY += s.height + 6;
  }

  return {
    ...page,
    backgroundColor: '#0f172a',
    backgroundGradient: undefined,
    backgroundPattern: undefined,
    elements: next,
  };
}

function buildPhotoGridLayout(page: Page): Page | null {
  const cloned = cloneElements(page.elements);
  const roles = classifyElements(cloned, page.width, page.height);
  if (roles.visuals.length < 2) return null;

  const m = page.margins || { top: 48, right: 48, bottom: 48, left: 48 };
  const cw = page.width - m.left - m.right;
  const next: PublisherElement[] = [];

  let curY = m.top;
  if (roles.heroTitle && roles.heroTitle.type === 'text') {
    const h = fitEl(
      { ...roles.heroTitle, x: m.left, y: curY, width: cw, textAlign: 'center', color: '#0f172a', zIndex: 5 },
      cw,
      86
    );
    next.push(h);
    curY += h.height + 10;
  }
  if (roles.subtitles[0] && roles.subtitles[0].type === 'text') {
    const s = fitEl(
      { ...roles.subtitles[0], x: m.left, y: curY, width: cw, textAlign: 'center', color: '#475569', zIndex: 5 },
      cw,
      44
    );
    next.push(s);
    curY += s.height + 16;
  }

  const visuals = roles.visuals.slice(0, 4);
  const cols = visuals.length <= 2 ? visuals.length : 2;
  const rows = Math.ceil(visuals.length / cols);
  const gap = 14;
  const availH = Math.max(140, page.height - m.bottom - curY);
  const cellW = Math.round((cw - gap * (cols - 1)) / cols);
  const cellH = Math.round((availH - gap * (rows - 1)) / rows);

  visuals.forEach((v, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    next.push({
      ...v,
      x: m.left + c * (cellW + gap),
      y: curY + r * (cellH + gap),
      width: cellW,
      height: cellH,
      zIndex: 3,
    });
  });

  return {
    ...page,
    backgroundColor: '#f8fafc',
    backgroundGradient: undefined,
    backgroundPattern: undefined,
    elements: next,
  };
}

export function generateDesignRecommendations(
  page: Page,
  advice?: AIDesignAdvice | null
): DesignRecommendation[] {
  const recs: DesignRecommendation[] = [];

  // 1. Editorial Split Left
  recs.push({
    id: 'split-left',
    title: 'Editorial Split Left',
    subtitle: 'Balanced visual left + crisp type right',
    category: 'layouts',
    badge: 'Layout',
    previewPage: buildSplitLayout(page, 'left', {
      bg: '#ffffff',
      text: '#0f172a',
      muted: '#475569',
      primary: '#4f46e5',
      accent: '#4f46e5',
    }),
  });

  // 2. Editorial Split Right
  recs.push({
    id: 'split-right',
    title: 'Editorial Split Right',
    subtitle: 'Headline-first left + visual right',
    category: 'layouts',
    badge: 'Layout',
    previewPage: buildSplitLayout(page, 'right', {
      bg: '#f8fafc',
      text: '#1e293b',
      muted: '#64748b',
      primary: '#0284c7',
      accent: '#0ea5e9',
    }),
  });

  // 3. Centered Poster Card
  const centeredEls = composeDesignForTarget(
    cloneElements(page.elements),
    page.width,
    page.height,
    page.width,
    page.height,
    page.margins,
    false,
    'centered'
  );
  recs.push({
    id: 'centered-poster',
    title: 'Centered Focus',
    subtitle: 'Symmetric poster hierarchy',
    category: 'layouts',
    badge: 'Balanced',
    previewPage: {
      ...page,
      backgroundColor: '#ffffff',
      backgroundGradient: { color1: '#ffffff', color2: '#eef2ff', angle: 135 },
      elements: centeredEls,
    },
  });

  // 4. Swiss Minimalist Grid
  const swissEls = composeDesignForTarget(
    cloneElements(page.elements),
    page.width,
    page.height,
    page.width,
    page.height,
    page.margins,
    false,
    'editorial'
  );
  recs.push({
    id: 'swiss-minimal',
    title: 'Swiss Minimalist',
    subtitle: 'Clean editorial alignment & bold rule',
    category: 'layouts',
    badge: 'Clean',
    previewPage: {
      ...page,
      backgroundColor: '#ffffff',
      backgroundGradient: undefined,
      elements: [
        makeAccentBar('rec-swiss-top', 0, 0, page.width, 12, '#0f172a', 1),
        ...applyPaletteToElements(swissEls, {
          text: '#0f172a',
          muted: '#475569',
          primary: '#0f172a',
          accent: '#dc2626',
          headingFont: 'Inter',
          bodyFont: 'Inter',
        }),
      ],
    },
  });

  // 5. Hero Full-Bleed Overlay (if visuals exist)
  const heroOverlay = buildHeroOverlayLayout(page);
  if (heroOverlay) {
    recs.push({
      id: 'hero-overlay',
      title: 'Full-Bleed Hero',
      subtitle: 'Edge-to-edge photo with contrast card',
      category: 'photo',
      badge: 'Photo',
      previewPage: heroOverlay,
    });
  }

  // 6. Photo Collage Grid (if 2+ visuals exist)
  const photoGrid = buildPhotoGridLayout(page);
  if (photoGrid) {
    recs.push({
      id: 'photo-grid',
      title: 'Gallery Grid',
      subtitle: 'Auto-aligned multi-photo showcase',
      category: 'photo',
      badge: 'Collage',
      previewPage: photoGrid,
    });
  }

  // 7. Dark Mode Executive
  recs.push({
    id: 'dark-executive',
    title: 'Dark Executive',
    subtitle: 'Deep navy slate + gold/indigo contrast',
    category: 'color-dark',
    badge: 'Dark',
    previewPage: buildSplitLayout(page, 'right', {
      bg: '#0f172a',
      text: '#f8fafc',
      muted: '#cbd5e1',
      primary: '#6366f1',
      accent: '#f59e0b',
    }),
  });

  // 8. Warm Serif Editorial
  recs.push({
    id: 'warm-editorial',
    title: 'Warm Classic',
    subtitle: 'Ivory paper + serif display pairing',
    category: 'color-dark',
    badge: 'Classic',
    previewPage: buildSplitLayout(page, 'left', {
      bg: '#fffbeb',
      text: '#451a03',
      muted: '#78350f',
      primary: '#b45309',
      accent: '#d97706',
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
    }),
  });

  // 9. Modern Gradient Pop
  recs.push({
    id: 'gradient-pop',
    title: 'Modern Gradient Pop',
    subtitle: 'Soft pastel gradient + high-impact type',
    category: 'color-dark',
    badge: 'Vibrant',
    previewPage: {
      ...page,
      backgroundColor: '#eef2ff',
      backgroundGradient: { color1: '#e0e7ff', color2: '#fce7f3', angle: 135 },
      elements: applyPaletteToElements(cloneElements(centeredEls), {
        text: '#312e81',
        muted: '#4c1d95',
        primary: '#7c3aed',
        accent: '#ec4899',
      }),
    },
  });

  // 10. Optional AI Custom Styled Recommendation (at top when advice is present!)
  if (advice) {
    const aiPage =
      advice.preferredLayout === 'split-left'
        ? buildSplitLayout(page, 'left', {
            bg: advice.bg,
            text: advice.text,
            muted: advice.text,
            primary: advice.primary,
            accent: advice.accent,
            headingFont: advice.headingFont,
            bodyFont: advice.bodyFont,
          })
        : advice.preferredLayout === 'split-right' || advice.preferredLayout === 'dark'
        ? buildSplitLayout(page, 'right', {
            bg: advice.bg,
            text: advice.text,
            muted: advice.text,
            primary: advice.primary,
            accent: advice.accent,
            headingFont: advice.headingFont,
            bodyFont: advice.bodyFont,
          })
        : {
            ...page,
            backgroundColor: advice.bg,
            backgroundGradient: undefined,
            elements: applyPaletteToElements(cloneElements(centeredEls), {
              text: advice.text,
              muted: advice.text,
              primary: advice.primary,
              accent: advice.accent,
              headingFont: advice.headingFont,
              bodyFont: advice.bodyFont,
            }),
          };

    recs.unshift({
      id: 'ai-custom-vibe',
      title: advice.vibeTitle,
      subtitle: `${advice.headingFont} + ${advice.bodyFont}`,
      category: 'color-dark',
      badge: advice.source === 'gemini' ? 'Gemini AI' : 'Smart Match',
      previewPage: aiPage,
    });
  }

  return recs;
}

function localKeywordDesignAdvice(prompt: string): AIDesignAdvice {
  const p = prompt.toLowerCase();
  if (/dark|tech|cyber|gaming|neon|night/.test(p)) {
    return {
      vibeTitle: 'Midnight Cyber Tech',
      bg: '#0f172a',
      primary: '#6366f1',
      accent: '#38bdf8',
      text: '#f8fafc',
      headingFont: 'Montserrat',
      bodyFont: 'Inter',
      preferredLayout: 'dark',
      source: 'local',
    };
  }
  if (/grad|school|commencement|award|cert|academic|formal/.test(p)) {
    return {
      vibeTitle: 'Academic Prestige',
      bg: '#fffdf7',
      primary: '#1e3a8a',
      accent: '#d97706',
      text: '#1e293b',
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
      preferredLayout: 'centered',
      source: 'local',
    };
  }
  if (/party|birthday|summer|fun|kids|pastel|pink/.test(p)) {
    return {
      vibeTitle: 'Playful Pastel Pop',
      bg: '#fdf2f8',
      primary: '#ec4899',
      accent: '#f59e0b',
      text: '#500724',
      headingFont: 'Poppins',
      bodyFont: 'Inter',
      preferredLayout: 'split-left',
      source: 'local',
    };
  }
  if (/eco|nature|green|organic|garden/.test(p)) {
    return {
      vibeTitle: 'Organic Botanical',
      bg: '#f0fdf4',
      primary: '#15803d',
      accent: '#65a30d',
      text: '#14532d',
      headingFont: 'Merriweather',
      bodyFont: 'Inter',
      preferredLayout: 'split-right',
      source: 'local',
    };
  }
  return {
    vibeTitle: prompt.trim().slice(0, 24) || 'Modern Studio',
    bg: '#ffffff',
    primary: '#4f46e5',
    accent: '#0ea5e9',
    text: '#0f172a',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    preferredLayout: 'swiss',
    source: 'local',
  };
}

export async function fetchAIDesignAdvice(
  page: Page,
  prompt: string,
  apiKey?: string
): Promise<AIDesignAdvice> {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) {
    return localKeywordDesignAdvice(prompt);
  }

  const textSummary = page.elements
    .filter((el): el is TextElement => el.type === 'text')
    .map((t) => t.text.slice(0, 60))
    .slice(0, 5)
    .join(' | ');

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        cleanKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a graphic designer for a desktop publishing app. Given the page text: "${textSummary || 'Blank Poster'}" and user style request: "${prompt || 'Clean modern layout'}", return ONLY valid JSON with keys: vibeTitle (2-4 words), bg (hex), primary (hex), accent (hex), text (high-contrast hex against bg), headingFont (e.g. Inter, Playfair Display, Montserrat, Poppins), bodyFont (e.g. Inter), preferredLayout (one of: split-left, split-right, centered, dark, swiss).`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!res.ok) return localKeywordDesignAdvice(prompt);
    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return localKeywordDesignAdvice(prompt);
    const parsed = JSON.parse(rawText);
    return {
      vibeTitle: parsed.vibeTitle || 'AI Custom Style',
      bg: parsed.bg || '#ffffff',
      primary: parsed.primary || '#4f46e5',
      accent: parsed.accent || '#0ea5e9',
      text: parsed.text || '#0f172a',
      headingFont: parsed.headingFont || 'Inter',
      bodyFont: parsed.bodyFont || 'Inter',
      preferredLayout: parsed.preferredLayout || 'centered',
      source: 'gemini',
    };
  } catch {
    return localKeywordDesignAdvice(prompt);
  }
}
