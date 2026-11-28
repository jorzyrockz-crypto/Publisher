import type { Page } from '../types/publisher';
import { renderPageModelToCanvas } from './canvasRenderer';

/**
 * A second pair of eyes, borrowed.
 *
 * The local scorer in `layoutScore` measures what can be measured. What it cannot measure is
 * whether the thing looks *good* — which is exactly the judgement a vision model can offer
 * without us training anything, and without copying anyone's templates.
 *
 * The page is rendered with the same renderer the exporter uses, so what the critic sees is what
 * you would print, and the rubric asks for the three fixes that would most improve it. With no
 * key, or no connection, this returns null and the panel simply keeps the local score: the
 * feature is an upgrade, never a dependency.
 */

export interface DesignCritique {
  score: number;
  verdict: string;
  fixes: string[];
  source: 'vision';
}

const GEMINI_KEY_STORAGE = 'studiopress_gemini_api_key';

export function storedCriticKey(): string {
  try {
    return (localStorage.getItem(GEMINI_KEY_STORAGE) || '').trim();
  } catch {
    return '';
  }
}

/** Rendering is local and fast; if it has not finished by now, it is not going to. */
const RENDER_TIMEOUT_MS = 8000;

const RUBRIC = `You are an exacting art director reviewing a print layout.
Score it 0-100 on composition, hierarchy, spacing rhythm, colour and legibility.
Then give the three changes that would improve it most, each under 15 words, concrete and
about this page (positions, sizes, colours) rather than general advice.
Return ONLY JSON: {"score": number, "verdict": "one sentence", "fixes": ["...", "...", "..."]}`;

/** Renders the page at a readable size and asks the model to mark it. */
export async function critiqueDesign(
  page: Page,
  apiKey: string = storedCriticKey()
): Promise<DesignCritique | null> {
  const key = apiKey.trim();
  if (!key) return null;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;

  let dataUrl = '';
  try {
    // 1.5x is enough detail for judgement and keeps the payload small. The race matters: a
    // photo that never finishes loading must not leave the panel spinning forever.
    const canvas = await Promise.race([
      renderPageModelToCanvas(page, 1.5),
      new Promise<null>((resolve) => {
        window.setTimeout(() => resolve(null), RENDER_TIMEOUT_MS);
      }),
    ]);
    if (!canvas) return null;
    dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    return null;
  }
  if (!dataUrl.startsWith('data:image')) return null;

  return requestDesignCritique(dataUrl, key);
}

/**
 * The half that talks to the model: send a rendered page, get a score back. Separated from the
 * rendering so it can be tested without a browser, and so a future provider is a new function
 * with the same shape rather than a fork of this one.
 */
export async function requestDesignCritique(
  dataUrl: string,
  apiKey: string
): Promise<DesignCritique | null> {
  const key = apiKey.trim();
  if (!key || !dataUrl.startsWith('data:image')) return null;
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: RUBRIC },
                { inline_data: { mime_type: 'image/jpeg', data: base64 } },
              ],
            },
          ],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );
    if (!res.ok) return null;
    const payload = await res.json();
    const raw = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { score?: number; verdict?: string; fixes?: string[] };
    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score))));
    if (!Number.isFinite(score)) return null;

    return {
      score,
      verdict: String(parsed.verdict || '').slice(0, 200) || 'Reviewed.',
      fixes: (parsed.fixes || []).map((f) => String(f)).filter(Boolean).slice(0, 3),
      source: 'vision',
    };
  } catch {
    return null;
  }
}
