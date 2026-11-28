import { DocumentProject } from '../types/publisher';
import { isIndexedDbAvailable } from './workspaceStorage';
import { renderPageModelToCanvas } from './canvasRenderer';

/**
 * Recent Designs — the local shelf behind the Home screen.
 *
 * `Save As` hands the user a `.spress` file and then forgets about it: the browser has no idea
 * where the download went, so the app cannot offer to open it again. The Home screen needs
 * something to put in its "Recent Designs" strip, so every save also keeps a copy here — the
 * project body so the card can actually reopen the document, and a small JPEG of page 1 so the
 * card can show what it is.
 *
 * Two IndexedDB stores, deliberately:
 *
 * - `meta`   — a dozen small records (name, size, page count, timestamp, thumbnail). Read every
 *              time Home opens; must stay cheap whatever the projects weigh.
 * - `projects` — the document JSON, read only when a card is clicked.
 *
 * Reading every recent project just to draw eight cards would mean deserialising megabytes on
 * every visit to Home, which is precisely the kind of cost that makes a landing screen feel slow.
 *
 * The `.spress` file remains the source of truth. This is a convenience cache: it is written on
 * save, pruned to `RECENT_DESIGNS_LIMIT`, and a document that could not be cached is simply not
 * listed — a card you cannot open is worse than no card at all.
 */

const DB_NAME = 'StudioPressRecentDesigns';
const DB_VERSION = 1;
const META_STORE = 'meta';
const PROJECT_STORE = 'projects';

/** How many designs the strip remembers. Canva shows a row; eight fills a wide one. */
export const RECENT_DESIGNS_LIMIT = 8;

/** Thumbnail long edge, in device pixels. Big enough for a 180px card on a retina screen. */
const THUMB_WIDTH = 420;

export interface RecentDesign {
  id: string;
  name: string;
  pageSizeName: string;
  pageCount: number;
  /** Page-1 dimensions, so the card can draw the right-shaped placeholder before the JPEG lands. */
  width: number;
  height: number;
  updatedAt: number;
  /** A small JPEG of page 1 as a data URI, or absent if the page could not be rasterised. */
  thumbnail?: string;
}

interface StoredProject {
  id: string;
  project: DocumentProject;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;
const listeners = new Set<() => void>();

function openDb(): Promise<IDBDatabase | null> {
  if (!isIndexedDbAvailable()) return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      let request: IDBOpenDBRequest;
      try {
        request = indexedDB.open(DB_NAME, DB_VERSION);
      } catch {
        resolve(null);
        return;
      }
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(PROJECT_STORE)) {
          db.createObjectStore(PROJECT_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    });
  }
  return dbPromise;
}

function publish() {
  for (const listener of listeners) listener();
}

/** Home subscribes so a save made in the editor shows up without a reload. */
export function subscribeRecentDesigns(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function requestResult<T>(request: IDBRequest<T>): Promise<T | null> {
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

/** Everything the strip needs, newest first. Never touches a project body. */
export async function listRecentDesigns(): Promise<RecentDesign[]> {
  const db = await openDb();
  if (!db) return [];
  const tx = db.transaction(META_STORE, 'readonly');
  const rows = await requestResult(tx.objectStore(META_STORE).getAll() as IDBRequest<RecentDesign[]>);
  return (rows ?? []).sort((a, b) => b.updatedAt - a.updatedAt);
}

/** The stored copy of a design, or null if it was pruned or never cached. */
export async function loadRecentDesign(id: string): Promise<DocumentProject | null> {
  const db = await openDb();
  if (!db) return null;
  const tx = db.transaction(PROJECT_STORE, 'readonly');
  const row = await requestResult(tx.objectStore(PROJECT_STORE).get(id) as IDBRequest<StoredProject>);
  return row?.project ?? null;
}

export async function forgetRecentDesign(id: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  const tx = db.transaction([META_STORE, PROJECT_STORE], 'readwrite');
  tx.objectStore(META_STORE).delete(id);
  tx.objectStore(PROJECT_STORE).delete(id);
  await new Promise<void>((resolve) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
  publish();
}

/**
 * Page 1 as a small JPEG.
 *
 * The canvas renderer is the same one the PNG/PDF export uses, so the thumbnail is the artwork —
 * not a DOM screenshot that would miss a WordArt effect the canvas paints differently.
 */
async function thumbnailFor(project: DocumentProject): Promise<string | undefined> {
  const page = project.pages[project.activePageIndex] ?? project.pages[0];
  if (!page) return undefined;
  try {
    const scale = Math.min(1, THUMB_WIDTH / Math.max(1, page.width));
    const canvas = await renderPageModelToCanvas(
      page,
      scale,
      false,
      project.masterPage?.showOnAllPages ? project.masterPage.elements : []
    );
    return canvas.toDataURL('image/jpeg', 0.72);
  } catch {
    // A missing font or a tainted canvas is not a reason to lose the entry — the card falls back
    // to a plain paper-coloured tile.
    return undefined;
  }
}

/**
 * Remembers a document. Called from save and from opening a `.spress` file, so the strip holds
 * documents the user actually made or opened rather than every template they hovered.
 */
export async function recordRecentDesign(project: DocumentProject): Promise<void> {
  const db = await openDb();
  if (!db) return;

  const page = project.pages[project.activePageIndex] ?? project.pages[0];
  const meta: RecentDesign = {
    id: project.id || `proj-${Date.now()}`,
    name: project.name || 'Untitled design',
    pageSizeName: project.pageSizeName,
    pageCount: project.pages.length,
    width: page?.width ?? 0,
    height: page?.height ?? 0,
    updatedAt: Date.now(),
    thumbnail: await thumbnailFor(project),
  };

  // Write the body first. If it does not fit, there is nothing to list: a card that opens a
  // missing document is worse than the document never being on the shelf.
  const wroteBody = await new Promise<boolean>((resolve) => {
    try {
      const tx = db.transaction(PROJECT_STORE, 'readwrite');
      tx.objectStore(PROJECT_STORE).put({ id: meta.id, project } satisfies StoredProject);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
  if (!wroteBody) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(META_STORE, 'readwrite');
      tx.objectStore(META_STORE).put(meta);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });

  await pruneRecentDesigns();
  publish();
}

/** Keeps the newest `RECENT_DESIGNS_LIMIT` and drops the rest, body and card together. */
async function pruneRecentDesigns(): Promise<void> {
  const db = await openDb();
  if (!db) return;
  const all = await listRecentDesigns();
  const drop = all.slice(RECENT_DESIGNS_LIMIT);
  if (drop.length === 0) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction([META_STORE, PROJECT_STORE], 'readwrite');
      for (const entry of drop) {
        tx.objectStore(META_STORE).delete(entry.id);
        tx.objectStore(PROJECT_STORE).delete(entry.id);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

/** "just now", "12 min ago", "Yesterday", "3 Mar" — short enough for a card subtitle. */
export function formatEditedAgo(timestamp: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const then = new Date(timestamp);
  const today = new Date(now);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  if (timestamp >= startOfToday - 86_400_000) return 'Yesterday';
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
