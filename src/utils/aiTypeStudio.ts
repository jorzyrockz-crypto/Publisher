/**
 * AI Type Studio — free, keyless headline ideas with a WordArt treatment.
 *
 * Why this design: the app renders WordArt as real text, identically in the DOM
 * and in the PNG/PDF exporter (20/20 styles verified). Letting a model *write
 * the words and choose the style* therefore gives AI-assisted type that stays
 * editable, restyleable and print-sharp — a generated text image could do none
 * of that, and image models misspell long words.
 *
 * The model is Pollinations' free keyless endpoint, reached through `api/ai.js`
 * (one request per click, since the anonymous tier allows roughly one every
 * 15–45 seconds). When the model is busy, unreachable, or answers with anything
 * unparseable, `buildOfflineIdeas` produces sensible suggestions locally, so the
 * feature always returns something the user can insert.
 */

import type { WordArtStyle } from '../types/publisher';
import { WORD_ART_STYLES } from './wordArt';

export type TypeTone = 'elegant' | 'bold' | 'playful';

export interface TypeIdea {
  phrase: string;
  styleId: WordArtStyle;
  reason: string;
  source: 'ai' | 'offline';
}

export interface TypeIdeaRequest {
  /** What the piece is about: "spring open house", "graduation sale", … */
  topic: string;
  tone: TypeTone;
  /** Optional context so the model can pick something that suits the page. */
  documentName?: string;
  darkPage?: boolean;
  count?: number;
  signal?: AbortSignal;
}

export interface TypeIdeaResult {
  ideas: TypeIdea[];
  /** `ai` when the model answered, `offline` when local suggestions were used. */
  source: 'ai' | 'offline';
  /** Short, user-facing explanation of why the fallback kicked in. */
  note?: string;
}

const IDEAS_ENDPOINT = '/api/ai';
const MAX_PHRASE = 44;
const CLIENT_TIMEOUT_MS = 28_000;

export const TONE_OPTIONS: { id: TypeTone; label: string }[] = [
  { id: 'elegant', label: 'Elegant' },
  { id: 'bold', label: 'Bold' },
  { id: 'playful', label: 'Playful' },
];

const VALID_STYLE_IDS = new Set<string>(WORD_ART_STYLES.map((style) => style.id));
const STYLE_LABELS = new Map(WORD_ART_STYLES.map((style) => [style.id, style.label]));

export function styleLabel(styleId: WordArtStyle): string {
  return STYLE_LABELS.get(styleId) ?? styleId;
}

/** Styles grouped by the mood they read as, used by the offline generator. */
const STYLES_BY_TONE: Record<TypeTone, WordArtStyle[]> = {
  elegant: ['cinematic', 'rose-gold', 'obsidian-gold', 'liquid-glass', 'gold3d', 'emerald-3d'],
  bold: ['gold3d', 'retro', 'comic-pop', 'chrome', 'varsity', 'gradient-blue', 'emerald-3d'],
  playful: ['candy-gloss', 'rainbow', 'fire', 'comic-pop', 'holographic', 'sunset-gradient'],
};

const DARK_FRIENDLY: WordArtStyle[] = ['neon-glow', 'cinematic', 'holographic', 'synth-chrome', 'liquid-glass', 'cyber-acid'];

function clampPhrase(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim().replace(/^["'“”]+|["'“”]+$/g, '');
  return cleaned.length > MAX_PHRASE ? `${cleaned.slice(0, MAX_PHRASE - 1).trimEnd()}…` : cleaned;
}

const SMALL_WORDS = new Set(['of', 'the', 'and', 'a', 'an', 'in', 'on', 'at', 'for', 'to', 'by']);

function titleCase(topic: string): string {
  return topic
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && SMALL_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/** Small stable hash so the same topic+page does not shuffle on every render. */
function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function pick<T>(items: T[], seed: number, offset: number): T {
  return items[(seed + offset * 7) % items.length];
}

/**
 * Deterministic suggestions used when the free model is unavailable. Reads like
 * a copywriter's first pass rather than random noise: each tone has its own
 * phrasing and its own styles.
 */
export function buildOfflineIdeas(request: TypeIdeaRequest): TypeIdea[] {
  const topic = clampPhrase(request.topic || 'your big news');
  const Title = titleCase(topic);
  const upper = topic.toUpperCase();
  const seed = hashString(`${topic}|${request.tone}|${request.darkPage ? 'dark' : 'light'}`);
  const count = Math.max(1, Math.min(5, request.count ?? 4));

  const phrasesByTone: Record<TypeTone, string[]> = {
    elegant: [Title, `Celebrating ${Title}`, `An Evening of ${Title}`, `${Title} · An Invitation`, `The ${Title} Collection`],
    bold: [upper, `${upper}!`, `THE ${upper} EVENT`, `${upper} — DON'T MISS IT`, `GET READY FOR ${upper}`],
    playful: [`${Title}!`, `Oh, ${Title}!`, `Hello, ${Title}`, `${Title} Time`, `Big ${Title} Energy`],
  };

  const reasonsByTone: Record<TypeTone, string[]> = {
    elegant: [
      'Rose gold and foil read formal without shouting.',
      'Cinematic gold keeps a long line legible at poster size.',
      'Obsidian and gold foil suits invitations and menus.',
    ],
    bold: [
      'Extruded 3D weight carries across a room.',
      'Chrome with a hard rim survives small thumbnails.',
      'Block varsity lettering at this length stays punchy.',
    ],
    playful: [
      'Glossy candy holds up in a kids’ flyer.',
      'A rainbow ramp earns its keep on a short phrase.',
      'Warm fire tones match a seasonal poster.',
    ],
  };

  const stylePool = [...STYLES_BY_TONE[request.tone]];
  if (request.darkPage) {
    // Dark pages make the glow styles sing; put them first.
    stylePool.unshift(...DARK_FRIENDLY.filter((style) => !stylePool.slice(0, 3).includes(style)));
  }

  const phrases = phrasesByTone[request.tone];
  const reasons = reasonsByTone[request.tone];
  const ideas: TypeIdea[] = [];
  for (let i = 0; i < count && i < phrases.length; i += 1) {
    const phrase = clampPhrase(phrases[i]);
    if (!phrase || ideas.some((idea) => idea.phrase === phrase)) continue;
    ideas.push({
      phrase,
      styleId: pick(stylePool, seed, i),
      reason: reasons[i % reasons.length],
      source: 'offline',
    });
  }
  return ideas;
}

function buildPrompt(request: TypeIdeaRequest, count: number): string {
  const styleList = WORD_ART_STYLES.map((style) => `${style.id} (${style.label})`).join(', ');
  return [
    'You are a typographic art director for a print design app.',
    `Topic: ${request.topic}.`,
    `Mood: ${request.tone}.${request.darkPage ? ' The page is dark.' : ' The page is light.'}${
      request.documentName ? ` Document: ${request.documentName}.` : ''
    }`,
    `Write ${count} short display headlines (2-5 words each, no quotes, no emoji) and pick a WordArt style for each.`,
    `Pick styles only from this list: ${styleList}.`,
    'Answer with JSON only, no prose and no code fences:',
    '[{"phrase":"...","style":"style-id","reason":"max 10 words"}]',
  ].join(' ');
}

function parseIdeas(raw: string, count: number): TypeIdea[] {
  const unfenced = raw.replace(/```(?:json)?/gi, '').trim();
  const start = unfenced.indexOf('[');
  const end = unfenced.lastIndexOf(']');
  if (start === -1 || end <= start) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(unfenced.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const ideas: TypeIdea[] = [];
  for (const entry of parsed.slice(0, count)) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;
    const phraseRaw = typeof record.phrase === 'string' ? record.phrase : '';
    const phrase = clampPhrase(phraseRaw);
    if (!phrase) continue;
    const styleRaw = typeof record.style === 'string' ? record.style.trim() : '';
    const styleId = (VALID_STYLE_IDS.has(styleRaw) ? styleRaw : null) as WordArtStyle | null;
    if (!styleId) continue;
    const reason = typeof record.reason === 'string' ? record.reason.trim().slice(0, 90) : '';
    if (ideas.some((idea) => idea.phrase === phrase)) continue;
    ideas.push({
      phrase,
      styleId,
      reason: reason || `Set in ${styleLabel(styleId)}.`,
      source: 'ai',
    });
  }
  return ideas;
}

/**
 * One request, one result. Never throws: falls back to local suggestions and
 * says why, so the UI can label the ideas honestly.
 */
export async function suggestTypeIdeas(request: TypeIdeaRequest): Promise<TypeIdeaResult> {
  const count = Math.max(1, Math.min(5, request.count ?? 4));
  const topic = request.topic.trim();
  if (!topic) return { ideas: buildOfflineIdeas({ ...request, count }), source: 'offline' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  request.signal?.addEventListener('abort', onAbort);

  try {
    const params = new URLSearchParams({ mode: 'text', prompt: buildPrompt({ ...request, topic }, count) });
    const res = await fetch(`${IDEAS_ENDPOINT}?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      const fallback = buildOfflineIdeas({ ...request, topic, count });
      return {
        ideas: fallback,
        source: 'offline',
        note:
          res.status === 504
            ? 'The free model timed out, so these are local suggestions.'
            : 'The free model is busy, so these are local suggestions.',
      };
    }
    const data = (await res.json()) as { text?: string };
    const ideas = parseIdeas(data.text ?? '', count);
    if (ideas.length === 0) {
      return {
        ideas: buildOfflineIdeas({ ...request, topic, count }),
        source: 'offline',
        note: 'The model answered in an unexpected format, so these are local suggestions.',
      };
    }
    // Top up with local ideas when the model returns fewer than asked.
    const filled = ideas.length < count ? [...ideas, ...buildOfflineIdeas({ ...request, topic, count })].slice(0, count) : ideas;
    return { ideas: filled, source: 'ai' };
  } catch {
    return {
      ideas: buildOfflineIdeas({ ...request, topic, count }),
      source: 'offline',
      note: 'The free model is unreachable right now, so these are local suggestions.',
    };
  } finally {
    clearTimeout(timeout);
    request.signal?.removeEventListener('abort', onAbort);
  }
}
