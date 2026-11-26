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
| Pixabay (stock photos) | same function as production (`api/pixabay.js`) | ⚠ needs the serverless relay — see below |
| Unsplash (stock photos) | same function as production (`api/unsplash.js`) | ⚠ needs the serverless relay for search only — see below |
| AI Type Studio (headline ideas) | same function as production (`api/ai.js`) | ⚠ needs the serverless relay — see below |
| Museum art (AIC + Cleveland) | same function as production (`api/openaccess.js`) | ⚠ needs the serverless relay — see below |
| Pexels photos | same function as production (`api/pexels.js`) | ⚠ needs the relay + `PEXELS_API_KEY`; hidden unless one exists |
| Openclipart vectors | same function as production (`api/openclipart.js`) | ⚠ needs the serverless relay — see below |

Every resolver returns an ordered candidate list, so a failed request silently
falls through to the next strategy instead of breaking the search.

## Clipart.Free on a static host

### 1. Vercel: server-side proxy (recommended, already wired)

`api/clipart.js` is a small Vercel function that calls
`https://clipart.free/api/clipart/search` with the key from the deployment
environment, so the browser needs neither CORS nor a key:

```
GET /api/clipart?mode=search&q=cat&page=1&category=animals
GET /api/clipart?mode=asset&url=https%3A%2F%2Fclipart.free%2Fstatic%2F…
```

Set it once — **Vercel → Settings → Environment Variables →
`CLIPART_FREE_API_KEY`** (type *sensitive*, all environments), then redeploy.
Never put this key in `src/`: a baked-in key ships inside the JS bundle and, in
a public repo, to the whole world (this project did exactly that until the key
was removed). Verified live: search returns real JSON from the alias.

Caveat: clipart.free's **static CDN** answers `500` to non-browser requests
(even with a browser UA, `Accept` and `Referer`), so the `mode=asset` hop only
relays pages; SVG/PNG previews still load through the browser's own `<img>`
hotlink, and server-side asset fetching is not possible.

## Pixabay photos on a static host

Pixabay is the panel's only source that **cannot** be called from the browser at
all: `pixabay.com` sends neither CORS headers on its API nor on its image CDN, so
a direct `fetch` fails and a hotlinked `<img>` would taint the export canvas
(`canvasRenderer` loads images with `crossOrigin = 'anonymous'`, and a tainted
canvas makes `toDataURL` throw). Everything therefore goes through one
same-origin function, which also keeps the key server-side:

```
GET /api/pixabay?mode=search&q=cat&page=1&image_type=photo&orientation=horizontal
GET /api/pixabay?mode=image&url=https%3A%2F%2Fpixabay.com%2Fget%2F…
GET /api/pixabay?mode=diag
```

Set it once — **Vercel → Settings → Environment Variables →
`PIXABAY_API_KEY`** (type *sensitive*, Production + Preview), then redeploy.
Get a key from your pixabay.com account (Docs → *Get API key*).

`npm run dev` mounts the very same handler through a small Vite middleware, so
`PIXABAY_API_KEY` in your shell/sandbox environment is enough for local work:

```bash
PIXABAY_API_KEY=12345678-abcdef npm run dev
```

Behaviour worth remembering:

- **No key configured** → the relay answers `503 {code:"not_configured"}` and the
  panel shows a quiet notice instead of an error; the other five sources keep
  working. Nothing crashes.
- **`mode=image` is allow-listed** to `pixabay.com` / `cdn.pixabay.com`. It is
  not an open proxy.
- **Search responses are cached for 24 h** (`s-maxage=86400`), which Pixabay's
  terms require; relayed image bytes are cached for a week and then copied into
  the project as data URLs — nothing hotlinks Pixabay afterwards.
- **Attribution**: results carry the photographer's name and the panel footer
  links back to Pixabay, as the Pixabay Content License asks.

On a host that cannot run the function (plain GitHub Pages, S3), Pixabay simply
stays unavailable — the panel degrades rather than breaking.

## Unsplash photos on a static host

Unsplash's API guidelines pull in a different direction from Pixabay's:
**hotlink the photos, do not re-host them**, and credit the photographer with
UTM-tagged links. `images.unsplash.com` sends `Access-Control-Allow-Origin: *`,
so the browser can both display a photo and fetch its bytes at insert time
(converting to a data URL inside the user's own document — our server never
stores an Unsplash file).

Only the two calls that need the access key go through `api/unsplash.js`:

```
GET /api/unsplash?mode=search&query=cat&page=1&orientation=landscape&order_by=relevant
GET /api/unsplash?mode=track&url=https%3A%2F%2Fapi.unsplash.com%2Fphotos%2F…%2Fdownload
GET /api/unsplash?mode=diag
```

Set it once — **Vercel → Settings → Environment Variables →
`UNSPLASH_ACCESS_KEY`** (type *sensitive*, Production + Preview), then redeploy.
The key is on your Unsplash app page (Access Key, not the Secret Key).

- **`mode=track`** is the "download event" Unsplash requires when a user uses a
  photo; the panel fires it on insert and treats a failure as advisory.
- **Rate limits**: a demo app gets 50 requests/hour, a production app 5,000.
  Search responses are edge-cached for an hour (`s-maxage=3600`) to stay well
  inside that; `mode=diag` reports `x-ratelimit-remaining`.
- **Attribution** is mandatory: results show the photographer's name, the photo
  page, the profile and the Unsplash home page all carry
  `utm_source=studiopress&utm_medium=referral&utm_campaign=api-credit`.
- **No key configured** → `503 {code:"not_configured"}`, and the panel shows a
  quiet notice; the other six sources keep working.
- Never put "Unsplash" in your app's name or icon (their guideline), which is why
  the app is StudioPress and the tab is just `Uns`.

## AI Type Studio on a static host

The WordArt gallery's "AI ideas" panel asks a free text model to write display
headlines and choose a WordArt style for each. Browsers are not allowed to call
the model directly from every host, and the anonymous tier is rate-limited per
IP, so one function brokers it:

```
GET /api/ai?mode=text&prompt=…    → { text, source }
GET /api/ai?mode=diag[&probe=1]   → reachability, optional live probe
```

**No key is required.** It uses Pollinations' keyless text endpoint
(`text.pollinations.ai`). If you set `POLLINATIONS_API_KEY` (type *sensitive*),
the higher-limit `gen.pollinations.ai` endpoint is used instead — still
server-side, never in the bundle.

- The anonymous tier allows roughly **one request every 15–45 seconds per IP**,
  so the panel sends one request per click and never retries in a loop.
- When the model is busy, times out (25 s server-side, 28 s client-side) or
  answers with anything unparseable, the panel shows **local suggestions**
  computed in `src/utils/aiTypeStudio.ts` and labels them as such. The feature
  never dead-ends, with or without a network.
- Ideas are inserted as ordinary WordArt text boxes, so exports and printing are
  unaffected.

## Public-domain museum art

Two CC0 collections behind one keyless relay — the strongest source in the panel
for engravings, ornaments, botanical plates and period illustration:

| Museum | API | Notes |
| --- | --- | --- |
| Art Institute of Chicago | `api.artic.edu/api/v1/artworks/search` | `fields=` must include `image_id`; images come from IIIF (`www.artic.edu/iiif/2/<id>/full/1200,/0/default.jpg`) |
| Cleveland Museum of Art | `openaccess-api.clevelandart.org/api/artworks/` | filter `cc0=1&has_image=1`; `images.web` ≈ 630px, `images.print` ≈ 2200px |

```
GET /api/openaccess?mode=search&q=botanical&page=1&limit=18&source=all
GET /api/openaccess?mode=image&url=https%3A%2F%2F…
GET /api/openaccess?mode=diag
```

No key, no signup. The relay interleaves both museums so neither dominates the
first screen, and `mode=image` is allow-listed to the two image hosts and cached
for 30 days (`immutable`) — these files never change. Cleveland's "print"
rendition is 2–5 MB, so the client downscales anything over 700 KB to 1600px
before it enters the document (it lives in IndexedDB, but a 5 MB data URL hurts
the editor all the same).

Both collections are public domain/CC0, so attribution is optional — the panel
credits both museums under the results anyway.

Rejected candidates, for the record: Openclipart's `format=json` endpoint now
returns HTML (scraping only), the Met's collection API refused automated
requests during review, and Pexels/Europeana/Smithsonian all need keys.

## Openclipart (free SVG vectors)

The only source in the panel that returns **real vectors**: 100k+ clip-art files,
every one dedicated to the public domain (CC0) — no attribution, no key, no quota.
An SVG stays sharp at any print size, which no photo source can claim.

Two wrinkles, both handled in `api/openclipart.js`:

1. **No JSON API any more.** `?format=json` returns the HTML search page, so the
   relay parses it. The parse is anchored on the `<img>` tag — its `src` carries
   the clipart id and its `alt` the title, so both come from the same tag and
   cannot be mixed up between neighbours. The detail link supplies the slug only
   when it names the same id. If their template moves, the parse yields **zero**
   items rather than junk, and `mode=diag&probe=1` reports `parserHealthy`.
2. **Bytes, not hotlinks.** Thumbnails and SVGs are both relayed (`mode=thumb`,
   `mode=svg`), cached 30 days immutable; the panel stores the SVG as a data URL,
   so a placed drawing survives without Openclipart.

```
GET /api/openclipart?mode=search&q=flower&page=1
GET /api/openclipart?mode=thumb&id=351216
GET /api/openclipart?mode=svg&id=351216
GET /api/openclipart?mode=diag&probe=1
```

A download that answers with HTML (bot check) or zero bytes is rejected with a
message instead of becoming a broken image on the page.

## Pexels

> **Pexels paused new API key issuance.** Their API page reads "New API key
> issuance is currently paused and cannot be requested" (first seen late Sept
> 2026, still true in November). Keys issued before the pause keep working.
> Nothing here is broken if you cannot get one.

The relay and panel source stay in the tree for existing keys, but the source is
**self-hiding**: on mount the panel asks `GET /api/pexels?mode=diag`, and the tab
only appears when the deployment actually holds a key — no dead tab, no notice
telling you to visit a page that cannot issue keys.

To turn it on if you already have a key (or the pause ends):

1. Vercel → project → Settings → Environment Variables → `PEXELS_API_KEY`
   (type *sensitive*, targets **Production** and **Preview**).
2. Redeploy. `GET /api/pexels?mode=diag&probe=1` should report
   `{"configured":true,"upstreamStatus":200,"quota":{…}}` and the tab appears.

```
GET /api/pexels?mode=search&q=cat&page=1&per_page=18&orientation=landscape
GET /api/pexels?mode=curated&page=1
GET /api/pexels?mode=image&url=https%3A%2F%2Fimages.pexels.com%2F…
GET /api/pexels?mode=diag[&probe=1]
```

Without the key the relay answers `503 {code:"not_configured"}` and the panel
shows a quiet "Get a free key / Retry / Hide" notice — the other eight sources
keep working.

Quota is 200 requests/hour and 20,000/month, so search responses are cached one
hour at the edge and `mode=diag&probe=1` reports `X-Ratelimit-Remaining`.
Inserts are built from the original with `w=1600` and relayed as bytes; the API
guidelines require a visible "Photos provided by Pexels" link, which the panel
renders under the results, and photographer credit on each card.

### 2. Other static hosts (GitHub Pages, S3…)

The Clipart.Free REST API is keyed and does not send CORS headers, so browsers
block direct calls from `https://<user>.github.io`. Two options:

#### Runtime setting (no rebuild)

1. Open the **Stock Art** panel.
2. Click the 🔑 key icon.
3. Paste your proxy base URL into **CORS Proxy (static hosting)**, e.g.
   `https://studiopress-proxy.my-name.workers.dev/clipart-free`.

The value is stored in `localStorage` (`studiopress_clipart_proxy_url`), so it
survives reloads and never needs to be committed to the repo.

#### Build-time environment variable

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

## Vercel checklist (project `studiopress`)

The project is `studiopress` in team `jorzyrockz-cryptos-projects`
(`prj_urOoVH6gb6XuFziG0t1fAsczqRe3`), linked to
`github.com/jorzyrockz-crypto/Publisher`, framework preset **Vite**, build
command `npm run build` (`tsc -b && vite build`), output `dist/`, Node 26.x.
The build itself is fine and the GitHub integration **is** connected — a push
to any branch produces a preview deployment (`source: "git"`, e.g.
`dpl_EdBkQnBAkUxw389eLUsvWDDTqWsm` for commit `efff43f`). What never updated was
**production**, for two reasons:

1. **Production branch mismatch — the real culprit.** Vercel builds production
   only from the branch in *Settings → Git → Production Branch*, which is
   `main`. This repo's default branch is `master` (feature work happens on
   `arena/*`), so every push landed as a preview and production stayed on the
   commit created by the **import** (`6715a35`). `main` is a separate lineage
   (61 commits, tree identical to `master`) that the GitHub Pages workflow also
   builds from. Fix: set the Production Branch to `master` (or merge into
   `main`) — after that, merging to `master` deploys production automatically.
2. **`gitProviderOptions.createDeployments = "disabled"`** does *not* stop
   builds. It only suppresses the GitHub *Deployment* objects/statuses Vercel
   would otherwise create on commits — GitHub's deployments API shows only
   `github-pages` entries, which is how you can tell. Don't chase this switch
   expecting the site to start updating.

### Deployment Protection (separate problem)

`ssoProtection = { deploymentType: "all_except_custom_domains" }` sends every
**preview/branch** URL to `vercel.com/login` ("Protected Deployment – Vercel"),
which reads exactly like a broken app when a preview link is opened outside the
owner's browser. Production aliases (`studiopress-blue.vercel.app`) stay
public. To share previews, set *Settings → Deployment Protection → Vercel
Authentication → Disabled* (or *Standard Protection*); any custom domain is
exempt.

### Shipping a fix from a branch (no dashboard access)

Build the branch straight from git — no token or local CLI needed:

```js
create_deployment({
  project: 'prj_urOoVH6gb6XuFziG0t1fAsczqRe3',
  team_id: 'team_eA9LcgxPsThx7dVBiXwEqUen',
  git_source: { type: 'github', repoId: '1473150842', ref: '<branch>' },
  target: 'production',   // omit for a preview
})
```

Verify the promotion by matching the CSS hash in `dist/index.html` against
`https://studiopress-blue.vercel.app/assets/index-<hash>.css` — a 200 with the
same hash proves the live site is your commit.

### Why the static build behaves differently from `npm run dev`

Vercel serves `dist/` only: there is no dev server, so every `/api/*` rewrite
in `vite.config.ts` (`/api/pollinations`, `/api/clipart-free`,
`/api/wikimedia-*`) is **404**. The app therefore calls
`image.pollinations.ai`, `commons.wikimedia.org`, `api.iconify.design` and
`api.openverse.org` directly (all CORS-enabled) and resolves Clipart.Free
through `src/utils/apiEndpoints.ts` (browser-first candidate order). Anything
that still needs a same-origin proxy must be pointed at the Cloudflare Worker,
never at `/api/…`.

## Cloud AI images (Pollinations) — key now required

As of Nov 2026 Pollinations gates **generation** behind an API key; only model
listing (`/models`) answers anonymously, and generation without a key returns
`401/402/500`. Its model list no longer contains `flux` (it currently reports
just `sana`), so requesting a retired model also fails.

What the app does now:

- Tries the requested model, then falls back to `flux` → `sana`, over three
  hosts: `image.pollinations.ai/prompt/…`, `gen.pollinations.ai/image/…`, then
  the Vite dev proxy.
- Sends the key as `?key=…` (the `Authorization` header is impossible for
  `<img>`-style loads). Two places to supply it:
  - **Runtime:** AI Image modal → *+ API Keys* → paste a key from
    `enter.pollinations.ai`. Stored in `localStorage`
    (`studiopress_pollinations_api_key`); never leaves the browser except to
    Pollinations itself.
  - **Build time:** `VITE_POLLINATIONS_API_KEY` (Vercel → Settings →
    Environment Variables, then redeploy). Note this inlines the key into the
    public bundle — prefer the runtime field, or use a `pk_` app key.
- Maps failures to readable copy: `AUTH_REQUIRED`, `PAYMENT_REQUIRED`,
  `UPSTREAM_5xx` (upstream outage) instead of a bare `HTTP_500`.

Hybrid and Offline Art engines are unaffected — they run fully in the browser
and need no key or network.
