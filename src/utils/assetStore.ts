/**
 * Asset packs: offline storybook kits, stored in IndexedDB.
 *
 * A pack is a folder (or a .zip) holding one `manifest.json` plus the artwork it lists. The
 * manifest carries a 160px thumb and a full-size image per asset, because a picker that decodes
 * twelve 1200px images to show a grid of chips is why tablets feel slow.
 *
 * There is no dependency here at all: IndexedDB is the store, `DecompressionStream` unpacks the
 * zip, and the only cache is a Map of object URLs. A pack installed once is available with the
 * network off, which is the point of shipping one.
 *
 * The built-in pack is not in the database — it is a folder under `public/`, listed by the same
 * manifest, so a fresh install has a complete kit before anyone imports anything.
 */

export type AssetLayer = 'backdrop' | 'frame' | 'sticker' | 'badge';

/** Where a frame piece wants to land on a page. Optional: an addition to the published schema. */
export type FrameSlot = 'top' | 'bottom' | 'corner';

export interface AssetEntry {
  id: string;
  label: string;
  layer: AssetLayer;
  tags: string[];
  /** Path inside the pack, e.g. `thumbs/bg-forest.webp`. */
  thumb: string;
  /** Path inside the pack, e.g. `full/bg-forest.webp`. */
  full: string;
  width: number;
  height: number;
  slot?: FrameSlot;
}

export interface AssetPackManifest {
  packId: string;
  name: string;
  version: string;
  assets: AssetEntry[];
}

export type PackSource = 'builtin' | 'installed';

/** A manifest plus the information needed to resolve its files. */
export interface PackSummary extends AssetPackManifest {
  source: PackSource;
  /** Built-in packs live on disk, relative to the app; installed ones live in IndexedDB. */
  baseUrl?: string;
  installedAt?: number;
}

export type AssetSize = 'thumb' | 'full';

const DB_NAME = 'PublisherAssetStore';
const DB_VERSION = 1;
const PACKS = 'packs';
const BLOBS = 'blobs';

/** The kit that ships with the app, built by `npm run pack:storybook`. */
export const BUILTIN_PACK_BASE = './asset-packs/storybook-reading-v1/';

const LAYERS: AssetLayer[] = ['backdrop', 'frame', 'sticker', 'badge'];
const SLOTS: FrameSlot[] = ['top', 'bottom', 'corner'];

const urlCache = new Map<string, string>();

export class AssetPackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetPackError';
  }
}

/* ------------------------------------------------------------------ manifest validation */

function asString(value: unknown, where: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AssetPackError(`${where} is missing a string.`);
  }
  return value;
}

/** A path inside a pack: relative, forward slashes, and never climbing out of the folder. */
function asPackPath(value: unknown, where: string): string {
  const raw = asString(value, where).replace(/\\/g, '/').replace(/^\.\//, '');
  if (raw.startsWith('/') || raw.split('/').includes('..')) {
    throw new AssetPackError(`${where} must stay inside the pack ("${raw}").`);
  }
  return raw;
}

function asNumber(value: unknown, where: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new AssetPackError(`${where} needs a positive number.`);
  }
  return Math.round(value);
}

/**
 * Turns whatever was in `manifest.json` into a pack we can list, refusing anything that would put
 * a broken tile in the picker. The messages name the offending asset: a pack author needs to know
 * which one, not that "the manifest is invalid".
 */
export function parseManifest(raw: unknown): AssetPackManifest {
  if (!raw || typeof raw !== 'object') throw new AssetPackError('manifest.json is not an object.');
  const m = raw as Record<string, unknown>;
  const packId = asString(m.packId, 'packId');
  if (!/^[a-z0-9][a-z0-9-_.]*$/i.test(packId)) {
    throw new AssetPackError(`packId "${packId}" may only use letters, digits, dots and dashes.`);
  }
  if (!Array.isArray(m.assets) || m.assets.length === 0) {
    throw new AssetPackError(`pack "${packId}" lists no assets.`);
  }

  const seen = new Set<string>();
  const assets = m.assets.map((item, index): AssetEntry => {
    if (!item || typeof item !== 'object') throw new AssetPackError(`assets[${index}] is not an object.`);
    const a = item as Record<string, unknown>;
    const id = asString(a.id, `assets[${index}].id`);
    if (seen.has(id)) throw new AssetPackError(`assets[${index}] reuses the id "${id}".`);
    seen.add(id);

    const layer = asString(a.layer, `assets[${index}].layer`) as AssetLayer;
    if (!LAYERS.includes(layer)) {
      throw new AssetPackError(`assets[${index}].layer must be one of ${LAYERS.join(', ')}.`);
    }
    const tags = Array.isArray(a.tags)
      ? a.tags.filter((t): t is string => typeof t === 'string').map((t) => t.toLowerCase())
      : [];
    const slot = typeof a.slot === 'string' && SLOTS.includes(a.slot as FrameSlot)
      ? (a.slot as FrameSlot)
      : undefined;

    return {
      id,
      label: asString(a.label, `assets[${index}].label`),
      layer,
      tags,
      thumb: asPackPath(a.thumb, `assets[${index}].thumb`),
      full: asPackPath(a.full, `assets[${index}].full`),
      width: asNumber(a.width, `assets[${index}].width`),
      height: asNumber(a.height, `assets[${index}].height`),
      ...(slot ? { slot } : {}),
    };
  });

  return {
    packId,
    name: typeof m.name === 'string' && m.name.trim() ? m.name : packId,
    version: typeof m.version === 'string' && m.version.trim() ? m.version : '1.0.0',
    assets,
  };
}

/* ------------------------------------------------------------------ IndexedDB */

function hasIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined' && indexedDB !== null;
}

function openAssetDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDB()) {
      reject(new AssetPackError('This browser has no IndexedDB, so packs cannot be stored.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PACKS)) db.createObjectStore(PACKS, { keyPath: 'packId' });
      if (!db.objectStoreNames.contains(BLOBS)) db.createObjectStore(BLOBS);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new AssetPackError('Could not open the pack store.'));
  });
}

const blobKey = (packId: string, relativePath: string) => `${packId}/${relativePath}`;

/** A blob's type decides how the canvas exports it, so it is set from the file name. */
function mimeFor(relativePath: string): string {
  const ext = relativePath.toLowerCase().split('.').pop() ?? '';
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'avif') return 'image/avif';
  if (ext === 'gif') return 'image/gif';
  return 'image/webp';
}

/** Base64 in chunks: one `String.fromCharCode` per byte overflows the argument limit on big art. */
function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Saves an unpacked manifest and its `{ relativePath -> Blob }` files, in one transaction. */
export async function installAssetPack(
  manifest: AssetPackManifest,
  files: Map<string, Blob>
): Promise<void> {
  const missing = manifest.assets
    .flatMap((a) => [a.thumb, a.full])
    .filter((p) => !files.has(p));
  if (missing.length) {
    throw new AssetPackError(
      `Pack "${manifest.name}" is missing ${missing.length} file${missing.length === 1 ? '' : 's'}: ` +
        `${[...new Set(missing)].slice(0, 4).join(', ')}${missing.length > 4 ? '…' : ''}`
    );
  }

  const db = await openAssetDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([PACKS, BLOBS], 'readwrite');
    tx.objectStore(PACKS).put({ ...manifest, installedAt: Date.now() });

    const blobStore = tx.objectStore(BLOBS);
    for (const [relativePath, blob] of files.entries()) {
      blobStore.put(blob, blobKey(manifest.packId, relativePath));
    }

    tx.oncomplete = () => {
      // A reinstall can change artwork under the same path: drop the stale URLs.
      for (const [key, url] of urlCache) {
        if (key.startsWith(`${manifest.packId}/`)) {
          URL.revokeObjectURL(url);
          urlCache.delete(key);
        }
      }
      resolve();
    };
    tx.onerror = () => reject(tx.error ?? new AssetPackError('Could not save the pack.'));
    tx.onabort = () => reject(tx.error ?? new AssetPackError('Saving the pack was aborted.'));
  });
}

/** Every imported pack, newest first. */
export async function listInstalledPacks(): Promise<PackSummary[]> {
  const db = await openAssetDB();
  const packs = await new Promise<Array<AssetPackManifest & { installedAt?: number }>>(
    (resolve, reject) => {
      const tx = db.transaction(PACKS, 'readonly');
      const req = tx.objectStore(PACKS).getAll();
      req.onsuccess = () => resolve(req.result as Array<AssetPackManifest & { installedAt?: number }>);
      req.onerror = () => reject(req.error ?? new AssetPackError('Could not read the pack store.'));
    }
  );
  return packs
    .map((p) => ({ ...p, source: 'installed' as const }))
    .sort((a, b) => (b.installedAt ?? 0) - (a.installedAt ?? 0));
}

export async function uninstallAssetPack(packId: string): Promise<void> {
  const db = await openAssetDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([PACKS, BLOBS], 'readwrite');
    tx.objectStore(PACKS).delete(packId);
    const blobStore = tx.objectStore(BLOBS);
    // Range over the key prefix: `packId/` to `packId0` (the next character after '/').
    const range = IDBKeyRange.bound(`${packId}/`, `${packId}/\uffff`);
    blobStore.delete(range);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new AssetPackError('Could not remove the pack.'));
  });
  for (const [key, url] of urlCache) {
    if (key.startsWith(`${packId}/`)) {
      URL.revokeObjectURL(url);
      urlCache.delete(key);
    }
  }
}

/* ------------------------------------------------------------------ resolving artwork */

function pathFor(entry: AssetEntry, size: AssetSize): string {
  return size === 'thumb' ? entry.thumb : entry.full;
}

/**
 * A URL for display in the picker. Built-in packs are served as files; imported ones become blob
 * URLs, cached so re-rendering the grid does not create a new object every frame.
 */
export async function getAssetUrl(
  pack: PackSummary,
  entry: AssetEntry,
  size: AssetSize = 'thumb'
): Promise<string | null> {
  const relativePath = pathFor(entry, size);
  if (pack.source === 'builtin') {
    return pack.baseUrl ? `${pack.baseUrl}${relativePath}` : `${BUILTIN_PACK_BASE}${relativePath}`;
  }

  const key = blobKey(pack.packId, relativePath);
  const cached = urlCache.get(key);
  if (cached) return cached;

  const blob = await getAssetBlob(pack, entry, size);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(key, url);
  return url;
}

export async function getAssetBlob(
  pack: PackSummary,
  entry: AssetEntry,
  size: AssetSize = 'full'
): Promise<Blob | null> {
  const relativePath = pathFor(entry, size);
  if (pack.source === 'builtin') {
    try {
      const res = await fetch(`${pack.baseUrl ?? BUILTIN_PACK_BASE}${relativePath}`);
      return res.ok ? await res.blob() : null;
    } catch {
      return null;
    }
  }

  const db = await openAssetDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BLOBS, 'readonly');
    const req = tx.objectStore(BLOBS).get(blobKey(pack.packId, relativePath));
    req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
    req.onerror = () => reject(req.error ?? new AssetPackError('Could not read the artwork.'));
  });
}

/**
 * Insert-time conversion. A blob URL is fine for a picker, but it dies with the tab, and a
 * document that references one exports blank — so anything dropped on the page is copied in as a
 * data URL.
 */
export async function getAssetDataUrl(
  pack: PackSummary,
  entry: AssetEntry,
  size: AssetSize = 'full'
): Promise<string | null> {
  const blob = await getAssetBlob(pack, entry, size);
  if (!blob) return null;
  const type = blob.type || mimeFor(pathFor(entry, size));
  return `data:${type};base64,${toBase64(await blob.arrayBuffer())}`;
}

/* ------------------------------------------------------------------ the built-in pack */

export async function fetchBuiltinPack(): Promise<PackSummary | null> {
  try {
    const res = await fetch(`${BUILTIN_PACK_BASE}manifest.json`, { cache: 'no-cache' });
    if (!res.ok) return null;
    const manifest = parseManifest(await res.json());
    return { ...manifest, source: 'builtin', baseUrl: BUILTIN_PACK_BASE };
  } catch {
    // A build without the folder is a build without the starter kit, not an error the user caused.
    return null;
  }
}

/** The built-in kit first, then everything the user imported. */
export async function listAssetPacks(): Promise<PackSummary[]> {
  const [builtin, installed] = await Promise.all([
    fetchBuiltinPack(),
    listInstalledPacks().catch(() => [] as PackSummary[]),
  ]);
  return builtin ? [builtin, ...installed] : installed;
}

/* ------------------------------------------------------------------ zip import */

/** Locates the end-of-central-directory record by scanning back over the comment. */
function findEocd(view: DataView): number {
  const maxComment = 0xffff;
  const floor = Math.max(0, view.byteLength - maxComment - 22);
  for (let i = view.byteLength - 22; i >= floor; i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) return i;
  }
  return -1;
}

/**
 * Reads an unpacked .zip into its manifest and files.
 *
 * Only the two compression methods a zip of images actually uses are supported — stored (0) and
 * deflate (8) — and deflate goes through the browser's own `DecompressionStream`, so importing a
 * pack costs no dependency. Zip64 archives are refused by name rather than mis-parsed.
 */
export async function readAssetPackZip(
  file: Blob
): Promise<{ manifest: AssetPackManifest; files: Map<string, Blob> }> {
  if (typeof DecompressionStream === 'undefined') {
    throw new AssetPackError('This browser cannot unzip packs (no DecompressionStream).');
  }
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const eocd = findEocd(view);
  if (eocd < 0) throw new AssetPackError('That file is not a zip archive.');

  const entryCount = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const files = new Map<string, Blob>();
  let manifestText: string | null = null;

  for (let i = 0; i < entryCount; i += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) {
      throw new AssetPackError('The zip’s central directory is damaged.');
    }
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    offset += 46 + nameLength + extraLength + commentLength;

    if (name.endsWith('/')) continue;
    if (compressedSize === 0xffffffff) {
      throw new AssetPackError('Zip64 archives are not supported — re-zip without zip64.');
    }
    if (view.getUint32(localOffset, true) !== 0x04034b50) {
      throw new AssetPackError(`The zip entry “${name}” has a damaged local header.`);
    }
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const raw = bytes.subarray(dataStart, dataStart + compressedSize);

    // The manifest is compressed like everything else, so it is inflated first and read after —
    // the alternative is a JSON parse error that says nothing about the zip.
    const clean = name.replace(/^\.\//, '');
    const type = mimeFor(clean);
    let entryBlob: Blob;
    if (method === 0) {
      entryBlob = new Blob([raw], { type });
    } else if (method === 8) {
      const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      entryBlob = new Blob([await new Response(stream).arrayBuffer()], { type });
    } else {
      throw new AssetPackError(`The zip entry “${name}” uses unsupported compression (${method}).`);
    }

    if (clean === 'manifest.json') {
      manifestText = await entryBlob.text();
      continue;
    }
    files.set(clean, entryBlob);
  }

  if (manifestText === null) throw new AssetPackError('The zip has no manifest.json at its root.');

  let raw: unknown;
  try {
    raw = JSON.parse(manifestText);
  } catch {
    throw new AssetPackError('manifest.json is not valid JSON.');
  }
  return { manifest: parseManifest(raw), files };
}

/** Imports a `.zip` pack into IndexedDB. Throws `AssetPackError` with a message worth showing. */
export async function importAssetPackZip(file: Blob): Promise<PackSummary> {
  const { manifest, files } = await readAssetPackZip(file);
  await installAssetPack(manifest, files);
  return { ...manifest, source: 'installed', installedAt: Date.now() };
}

/** Filtering for the picker: layer first, then a free-text match on label and tags. */
export function filterAssets(
  assets: AssetEntry[],
  options: { layer?: AssetLayer | 'all'; query?: string } = {}
): AssetEntry[] {
  const layer = options.layer ?? 'all';
  const query = (options.query ?? '').trim().toLowerCase();
  return assets.filter((asset) => {
    if (layer !== 'all' && asset.layer !== layer) return false;
    if (!query) return true;
    return (
      asset.label.toLowerCase().includes(query) ||
      asset.tags.some((tag) => tag.includes(query))
    );
  });
}
