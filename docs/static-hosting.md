# Static hosting (GitHub Pages, Netlify, S3…)

StudioPress runs entirely in the browser, so it works on a static host. The one
catch is that the **Vite dev server proxy does not exist in production**: any
`/api/pollinations`, `/api/clipart-free` or `/api/wikimedia-*` request would 404
on GitHub Pages.

`src/utils/apiEndpoints.ts` now decides how each source is reached:

| Source | Dev (`npm run dev`) | Static build (GitHub Pages) |
| --- | --- | --- |
| Pollinations (Cloud AI) | Vite proxy `/api/pollinations` | ✔ direct `image.pollinations.ai` (CORS-enabled) |
| Iconify (200k icons) | direct | ✔ direct `api.iconify.design` (CORS-enabled) |
| Wikimedia Commons | Vite proxy | ✔ direct `upload.wikimedia.org` (CORS-enabled) |
| Clipart.Free | Vite proxy | ⚠ needs a proxy — see below |

Every resolver returns an ordered candidate list, so a failed request silently
falls through to the next strategy instead of breaking the search.

## Clipart.Free on a static host

The Clipart.Free REST API is keyed and does not send CORS headers, so browsers
block direct calls from `https://<user>.github.io`. Two options:

### 1. Runtime setting (no rebuild)

1. Open the **Stock Art** panel.
2. Click the 🔑 key icon.
3. Paste your proxy base URL into **CORS Proxy (static hosting)**, e.g.
   `https://studiopress-proxy.my-name.workers.dev/clipart-free`.

The value is stored in `localStorage` (`studiopress_clipart_proxy_url`), so it
survives reloads and never needs to be committed to the repo.

### 2. Build-time environment variable

```bash
# .env.production
VITE_CLIPART_PROXY_URL=https://studiopress-proxy.my-name.workers.dev/clipart-free
VITE_WIKIMEDIA_PROXY_URL=        # optional, Wikimedia already works directly
```

Vite inlines these at build time. Then run `npm run build` as usual.

## Troubleshooting: "Clipart.Free won't run"

Use the **Test Clipart.Free connection** button in the Stock Art panel's 🔑 bar —
it reports exactly which hop failed:

| Message | Meaning | Fix |
| --- | --- | --- |
| `HTTP 401/403` | Key rejected | Paste a valid `cf_…` key |
| `HTTP 402 / 429` | Quota / rate limit | Wait, or use another key |
| `HTTP 502/504` | The **proxy host** cannot reach clipart.free | Use a proxy on a host with internet access (Worker/Vercel), not a sandboxed dev server |
| `blocked (CORS or offline)` | The browser call was refused **and** no proxy answered | Add a proxy URL, or use Iconify / Wikimedia |
| `404 for every known API path` | Clipart.Free changed its REST routes | Update the path list in `src/utils/clipartSearch.ts` |

**Openverse** is the keyless fallback for imagery: `https://api.openverse.org` sends CORS headers and needs no
proxy, so the Stock Art panel keeps working even when Clipart.Free is unreachable.
Deploy the worker below only if you specifically want Clipart.Free.

Requests are now issued **from the browser first** (`https://clipart.free/…`)
and only fall back to the same-origin proxy — a dev server running in a sandbox
with no outbound internet can no longer break the source on its own.

## Deploy the Cloudflare Worker proxy

[`workers/clipart-proxy.js`](../workers/clipart-proxy.js) is a ready-to-deploy,
allow-listed CORS proxy (it only forwards to Clipart.Free, Pollinations and
Wikimedia — never an open relay).

```bash
npm i -g wrangler
wrangler login
wrangler deploy workers/clipart-proxy.js --name studiopress-proxy
```

Use the resulting URL with the `/clipart-free` suffix:

```
https://studiopress-proxy.<subdomain>.workers.dev/clipart-free
```

Prefer Vercel? Create `api/clipart-free/[...path].js` that forwards to
`https://clipart.free/<path>` with `Access-Control-Allow-Origin: *` and use
`https://<project>.vercel.app/api/clipart-free` as the proxy base.

## GitHub Pages checklist

- `vite.config.ts` uses `base: './'`, so the bundle works from any sub-path.
- `.github/workflows/deploy.yml` builds on every push to `main` and publishes
  `dist/`.
- `dist/` is git-ignored — only the Actions artifact is published.
- Deep links are irrelevant (single screen app), so no SPA 404 shim needed.
