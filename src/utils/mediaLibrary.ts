/**
 * The user's uploaded media, persisted on the device.
 *
 * `My media` used to be React state on the rail: real for as long as the tab lived, gone
 * on reload. Placing an image survives because it is baked into the document, but the
 * library — the thing that lets you use the logo you uploaded yesterday again — did not.
 *
 * Stored in its own IndexedDB database rather than mixed into `studiopress-workspace`:
 * the document store is versioned and replaced whole on reset, and a library should
 * outlive that. Falls back to memory when IndexedDB is unavailable (private windows,
 * old browsers) and reports it, instead of silently pretending to save.
 */

export interface MediaUpload {
  id: string;
  name: string;
  /** Data URL at storage size — this is what gets placed on the page. */
  dataUrl: string;
  bytes: number;
  width: number;
  height: number;
  addedAt: number;
}

const DB_NAME = 'studiopress-media';
const DB_VERSION = 1;
const STORE = 'uploads';

/** Keep the newest N. A library of 300 logos is not a library, it is a landfill. */
const MAX_ITEMS = 40;
/** Anything past this is too big to duplicate into a library without asking. */
const MAX_STORED_BYTES = 12 * 1024 * 1024;
/** Long edge above which an upload is re-encoded before storage. */
const MAX_STORED_PX = 2400;

const memoryFallback: MediaUpload[] = [];
let memoryOnly = false;

export function isMediaLibraryPersistent(): boolean {
  return !memoryOnly && typeof indexedDB !== 'undefined' && indexedDB !== null;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('addedAt', 'addedAt');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open media library'));
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = dataUrl;
  });
}

/**
 * Re-encodes over-large uploads at storage size. Format is preserved on purpose: an
 * uploaded PNG is usually a logo or a sticker, and JPEG re-encoding would fill its
 * transparency with black — the trap the museum artwork path avoids only because those
 * are photographs.
 *
 * Decoding is awaited before drawing: `drawImage` on an image whose `src` was just
 * assigned paints nothing, which is the classic way to save 0×0 pixels.
 */
async function prepareImage(
  dataUrl: string,
  mime: string
): Promise<{ dataUrl: string; width: number; height: number }> {
  const image = await loadImage(dataUrl);
  if (!image || !image.width || !image.height) {
    return { dataUrl, width: 0, height: 0 };
  }

  const { width, height } = image;
  const longest = Math.max(width, height);
  if (longest <= MAX_STORED_PX) return { dataUrl, width, height };

  try {
    const scale = MAX_STORED_PX / longest;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return { dataUrl, width, height };
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return {
      dataUrl: canvas.toDataURL(mime === 'image/png' ? 'image/png' : 'image/jpeg', 0.9),
      // The stored file is the canvas, so report its size — not the original's, which would
      // claim dimensions the library no longer holds.
      width: canvas.width,
      height: canvas.height,
    };
  } catch {
    return { dataUrl, width, height };
  }
}

function approxBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  const payload = comma >= 0 ? dataUrl.length - comma - 1 : dataUrl.length;
  return Math.round((payload * 3) / 4);
}

export async function listUploads(): Promise<MediaUpload[]> {
  if (!isMediaLibraryPersistent()) {
    return [...memoryFallback].sort((a, b) => b.addedAt - a.addedAt);
  }
  try {
    const db = await openDb();
    return await new Promise<MediaUpload[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).getAll();
      request.onsuccess = () => {
        const rows = (request.result ?? []) as MediaUpload[];
        rows.sort((a, b) => b.addedAt - a.addedAt);
        resolve(rows);
      };
      request.onerror = () => reject(request.error ?? new Error('Could not read the library'));
      tx.oncomplete = () => db.close();
    });
  } catch {
    memoryOnly = true;
    return [...memoryFallback];
  }
}

async function evictOldest(db: IDBDatabase): Promise<void> {
  const count = await new Promise<number>((resolve) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(0);
  });
  if (count <= MAX_ITEMS) return;
  const rows = await new Promise<MediaUpload[]>((resolve) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    request.onsuccess = () => resolve((request.result ?? []) as MediaUpload[]);
    request.onerror = () => resolve([]);
  });
  const doomed = rows
    .sort((a, b) => a.addedAt - b.addedAt)
    .slice(0, rows.length - MAX_ITEMS);
  if (doomed.length === 0) return;
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  doomed.forEach((row) => store.delete(row.id));
}

export async function saveUpload(file: File): Promise<MediaUpload> {
  const raw = await readAsDataUrl(file);
  if (!raw) throw new Error('That file could not be read');
  if (approxBytes(raw) > MAX_STORED_BYTES) {
    throw new Error(`"${file.name}" is too large — keep uploads under 12 MB.`);
  }

  const { dataUrl, width, height } = await prepareImage(raw, file.type || 'image/png');

  const upload: MediaUpload = {
    id: `upl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: file.name || 'Upload',
    dataUrl,
    bytes: approxBytes(dataUrl),
    width,
    height,
    addedAt: Date.now(),
  };

  if (!isMediaLibraryPersistent()) {
    memoryFallback.unshift(upload);
    return upload;
  }

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(upload);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Could not save that upload'));
  });
  await evictOldest(db);
  db.close();
  return upload;
}

export async function deleteUpload(id: string): Promise<void> {
  const at = memoryFallback.findIndex((item) => item.id === id);
  if (at >= 0) memoryFallback.splice(at, 1);
  if (!isMediaLibraryPersistent()) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch {
    /* deleting is best-effort: losing a delete is far less bad than an exception */
  }
}

export async function clearUploads(): Promise<void> {
  memoryFallback.length = 0;
  if (!isMediaLibraryPersistent()) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch {
    /* best-effort */
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
