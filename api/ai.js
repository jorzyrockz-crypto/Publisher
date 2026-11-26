/**
 * Free text-model relay for the AI Type Studio (`/api/ai`).
 *
 * Pollinations serves a keyless text model over plain HTTP, which the browser
 * cannot call directly from every host and which should not be hammered from
 * each client IP, so it goes through this function:
 *
 *   GET /api/ai?mode=text&prompt=…    → { text, source }
 *   GET /api/ai?mode=diag[&probe=1]   → what this deployment can reach
 *
 * Keyless by default. If `POLLINATIONS_API_KEY` is set the higher-limit endpoint
 * is used instead (still server-side; the key never reaches the browser).
 *
 * The anonymous service allows roughly one request every 15–45 seconds per IP,
 * so the client sends one request per click and falls back to local suggestions
 * when the model is busy — see `src/utils/aiTypeStudio.ts`.
 */

const ANONYMOUS_ORIGIN = 'https://text.pollinations.ai';
const KEYED_ORIGIN = 'https://gen.pollinations.ai/text';
const USER_AGENT = 'StudioPress/1.0 (Desktop Publishing Studio)';
const MAX_PROMPT = 800;
const TIMEOUT_MS = 25_000;

function sendJson(res, status, payload, cache = 'no-store') {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.end(JSON.stringify(payload));
}

function getBaseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return new URL(req.url || '/', `${proto}://${host}`);
}

async function callModel(prompt, key) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const url = key
    ? `${KEYED_ORIGIN}/${encodeURIComponent(prompt)}?key=${encodeURIComponent(key)}&model=openai`
    : `${ANONYMOUS_ORIGIN}/${encodeURIComponent(prompt)}`;
  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/plain' },
      signal: controller.signal,
    });
    const body = await upstream.text();
    return { ok: upstream.ok, status: upstream.status, body };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  const key = (process.env.POLLINATIONS_API_KEY || '').trim();
  const requestUrl = getBaseUrl(req);
  const mode = requestUrl.searchParams.get('mode') || 'text';

  if (mode === 'diag') {
    const out = {
      configured: true, // keyless by design
      keyedRequests: Boolean(key),
      vercelEnv: process.env.VERCEL_ENV || null,
      endpoint: key ? 'gen.pollinations.ai' : 'text.pollinations.ai',
    };
    if (requestUrl.searchParams.get('probe') === '1') {
      try {
        const probe = await callModel('Reply with the single word: ok', key);
        out.upstreamStatus = probe.status;
        out.upstreamBodyHead = probe.body.slice(0, 120);
      } catch (error) {
        out.upstreamError = String(error);
      }
    }
    sendJson(res, 200, out);
    return;
  }

  const prompt = (requestUrl.searchParams.get('prompt') || '').trim();
  if (!prompt) {
    sendJson(res, 400, { error: 'prompt parameter is required' });
    return;
  }
  if (prompt.length > MAX_PROMPT) {
    sendJson(res, 400, { error: `prompt is limited to ${MAX_PROMPT} characters` });
    return;
  }

  try {
    const result = await callModel(prompt, key);
    if (!result.ok) {
      sendJson(res, 502, {
        error: `text model answered ${result.status}`,
        bodyHead: result.body.slice(0, 200),
      });
      return;
    }
    sendJson(res, 200, {
      text: result.body,
      source: key ? 'keyed' : 'anonymous',
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    sendJson(res, aborted ? 504 : 502, {
      error: aborted ? 'text model timed out' : `text model failed: ${String(error)}`,
    });
  }
}
