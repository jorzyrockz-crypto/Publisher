/**
 * Workspace persistence — IndexedDB first, localStorage only as a mirror.
 *
 * The document model stores images inline as data URLs, so a photo-heavy project
 * blows past the ~5 MB `localStorage` ceiling after a handful of photos (each
 * 1280px Pixabay insert is ~550 KB, a full-page scan much more). IndexedDB has
 * no such ceiling — typically a large share of free disk — so the document lives
 * there and localStorage keeps only what it can comfortably hold:
 *
 *   IndexedDB  studiopress-workspace / documents / "workspace"   ← authoritative
 *   localStorage  ms_publisher_workspace_mirror_v2               ← fast boot, ≤1.5 MB
 *   localStorage  ms_publisher_storage_v2                        ← marker: mode + savedAt
 *
 * Boot order: the mirror (synchronous, instant paint) while the marker says an
 * IndexedDB copy exists and may be newer; whichever has the later `savedAt`
 * wins. Nothing in the app has to know about any of this — elements keep their
 * data URLs in memory, so the renderer, exporters and print path are untouched.
 *
 * Browsers evict unpersisted storage under pressure, so the first save asks for
 * `navigator.storage.persist()`; the status bar reports which backend is live.
 */

import type { DocumentProject } from '../types/publisher';

export interface StoredTab {
  id: string;
  project: DocumentProject;
  tabColor?: string;
  updatedAt: number;
}

export interface WorkspaceSnapshot {
  tabs: StoredTab[];
  activeTabId: string;
}

export interface StoredWorkspace extends WorkspaceSnapshot {
  id: string;
  version: number;
  savedAt: number;
  bytes: number;
}

export interface StorageMarker {
  mode: 'indexeddb' | 'local';
  savedAt: number;
  bytes: number;
}

export interface SaveInfo extends StorageMarker {
  persisted: boolean | null;
}

const DB_NAME = 'studiopress-workspace';
const DB_VERSION = 1;
const STORE_NAME = 'documents';
const RECORD_ID = 'workspace';
export const WORKSPACE_VERSION = 2;

export const STORAGE_MARKER_KEY = 'ms_publisher_storage_v2';
export const MIRROR_KEY = 'ms_publisher_workspace_mirror_v2';
/** Legacy keys written before IndexedDB storage existed. */
export const LEGACY_AUTOSAVE_KEY = 'ms_publisher_clone_autosave_v1';
export const LEGACY_TABS_KEY = 'studiopress_workspace_tabs_v1';

/**
 * A mirror bigger than this is not worth the risk of eating the whole
 * localStorage quota (other features store keys there too).
 */
export const MIRROR_LIMIT = 1_500_000;

let dbPromise: Promise<IDBDatabase | null> | null = null;
let lastSaveInfo: SaveInfo | null = null;
const saveInfoListeners = new Set<() => void>();

export function isIndexedDbAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

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
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    });
  }
  return dbPromise;
}

function byteLength(json: string): number {
  try {
    return new Blob([json]).size;
  } catch {
    return json.length;
  }
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Which backend the last save used — the status bar subscribes to this. */
export function getLastSaveInfo(): SaveInfo | null {
  return lastSaveInfo;
}

export function subscribeSaveInfo(listener: () => void): () => void {
  saveInfoListeners.add(listener);
  return () => saveInfoListeners.delete(listener);
}

function publishSaveInfo(info: SaveInfo) {
  lastSaveInfo = info;
  for (const listener of saveInfoListeners) listener();
}

let persistRequested = false;
/** Ask the browser not to evict our data; ignored when already granted/denied. */
async function requestPersistentStorage(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted?.()) return true;
    if (persistRequested) return null;
    persistRequested = true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

/** Reads the workspace record from IndexedDB, or null when unavailable. */
export async function readStoredWorkspace(): Promise<StoredWorkspace | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(RECORD_ID);
      request.onsuccess = () => {
        const value = request.result as StoredWorkspace | undefined;
        resolve(value && Array.isArray(value.tabs) ? value : null);
      };
      request.onerror = () => resolve(null);
      tx.onabort = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function readStorageMarker(): StorageMarker | null {
  const marker = readJson<StorageMarker>(STORAGE_MARKER_KEY);
  if (!marker || typeof marker.savedAt !== 'number') return null;
  return marker;
}

/** The mirror copy, if one was small enough to keep. */
export function readMirrorWorkspace(): StoredWorkspace | null {
  const mirror = readJson<StoredWorkspace>(MIRROR_KEY);
  return mirror && Array.isArray(mirror.tabs) && mirror.tabs.length > 0 ? mirror : null;
}

/** Old single-document / tabs keys, still consulted for the first load. */
export function readLegacyWorkspace(): { workspace: StoredWorkspace; rawBytes: number } | null {
  const parsedTabs = readJson<{ tabs?: StoredTab[]; activeTabId?: string }>(LEGACY_TABS_KEY);
  if (parsedTabs?.tabs?.length) {
    const validTabs = parsedTabs.tabs.filter(
      (tab) => tab?.id && tab?.project && Array.isArray(tab.project.pages) && tab.project.pages.length > 0
    );
    if (validTabs.length) {
      const activeExists = validTabs.some((tab) => tab.id === parsedTabs.activeTabId);
      return {
        workspace: {
          id: RECORD_ID,
          version: WORKSPACE_VERSION,
          savedAt: 0,
          bytes: 0,
          tabs: validTabs,
          activeTabId: activeExists ? parsedTabs.activeTabId! : validTabs[0].id,
        },
        rawBytes: 0,
      };
    }
  }
  const parsedSingle = readJson<DocumentProject>(LEGACY_AUTOSAVE_KEY);
  if (parsedSingle && Array.isArray(parsedSingle.pages) && parsedSingle.pages.length > 0) {
    return {
      workspace: {
        id: RECORD_ID,
        version: WORKSPACE_VERSION,
        savedAt: 0,
        bytes: 0,
        tabs: [{ id: 'tab-initial', project: parsedSingle, updatedAt: Date.now() }],
        activeTabId: 'tab-initial',
      },
      rawBytes: 0,
    };
  }
  return null;
}

/**
 * What the very first render can show, plus whether an IndexedDB read is worth
 * waiting for. Synchronous by design: the provider calls it during render.
 */
export function readBootCache(): {
  workspace: StoredWorkspace | null;
  expectIndexedDb: boolean;
  savedAt: number;
} {
  const marker = readStorageMarker();
  const canUseDb = isIndexedDbAvailable();
  if (!marker) {
    // No marker yet: this browser may still be on the pre-IndexedDB layout.
    return { workspace: readLegacyWorkspace()?.workspace ?? null, expectIndexedDb: false, savedAt: 0 };
  }
  const mirror = readMirrorWorkspace();
  if (mirror) {
    return { workspace: mirror, expectIndexedDb: marker.mode === 'indexeddb' && canUseDb, savedAt: mirror.savedAt ?? 0 };
  }
  // No mirror (the document was too big for one): read the fallback keys so a
  // localStorage-mode document still opens.
  return {
    workspace: readLegacyWorkspace()?.workspace ?? null,
    expectIndexedDb: marker.mode === 'indexeddb' && canUseDb,
    savedAt: 0,
  };
}

function writeToDb(record: StoredWorkspace): Promise<boolean> {
  return openDb().then(
    (db) =>
      new Promise<boolean>((resolve) => {
        if (!db) {
          resolve(false);
          return;
        }
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).put(record);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
          tx.onabort = () => resolve(false);
        } catch {
          resolve(false);
        }
      })
  );
}

function clearLegacyKeys() {
  try {
    localStorage.removeItem(LEGACY_AUTOSAVE_KEY);
    localStorage.removeItem(LEGACY_TABS_KEY);
  } catch {
    // ignore
  }
}

/** Content-only signature: the timestamp must not defeat the no-op check. */
let lastSavedContent: string | null = null;

/**
 * Persists one snapshot. Cheap when nothing changed; always reports the backend
 * it ended up on so the UI and the status bar stay honest.
 */
export async function saveWorkspace(snapshot: WorkspaceSnapshot): Promise<SaveInfo> {
  const savedAt = Date.now();
  const payload = {
    id: RECORD_ID,
    version: WORKSPACE_VERSION,
    savedAt,
    tabs: snapshot.tabs,
    activeTabId: snapshot.activeTabId,
  };
  const json = JSON.stringify(payload);
  const bytes = byteLength(json);
  const content = JSON.stringify({ tabs: snapshot.tabs, activeTabId: snapshot.activeTabId });

  // Identical content (selection changes, re-renders): skip the disk write but
  // still report a fresh save time, so the UI stays truthful.
  if (content === lastSavedContent && readStorageMarker()?.mode === 'indexeddb') {
    const info: SaveInfo = { mode: 'indexeddb', savedAt, bytes, persisted: await requestPersistentStorage() };
    publishSaveInfo(info);
    return info;
  }

  const record: StoredWorkspace = { ...payload, bytes };
  let mode: 'indexeddb' | 'local' = 'local';

  if (await writeToDb(record)) {
    mode = 'indexeddb';
    lastSavedContent = content;
    // The document is safely on disk: the old keys are pure overhead now.
    clearLegacyKeys();
  } else {
    // No IndexedDB (or the write failed): fall back to the old behaviour rather
    // than losing the document, accepting the old size ceiling.
    lastSavedContent = null;
    try {
      localStorage.setItem(LEGACY_TABS_KEY, json);
    } catch {
      // quota exceeded — the mirror below is the last resort
    }
  }

  // Mirror for a fast boot, only while it comfortably fits.
  if (bytes <= MIRROR_LIMIT) {
    if (!writeJson(MIRROR_KEY, record)) {
      try {
        localStorage.removeItem(MIRROR_KEY);
      } catch {
        // ignore
      }
    }
  } else {
    try {
      localStorage.removeItem(MIRROR_KEY);
    } catch {
      // ignore
    }
  }

  writeJson(STORAGE_MARKER_KEY, { mode, savedAt, bytes } satisfies StorageMarker);
  const persisted = mode === 'indexeddb' ? await requestPersistentStorage() : null;
  const info: SaveInfo = { mode, savedAt, bytes, persisted };
  publishSaveInfo(info);
  return info;
}

/**
 * Synchronous last-gasp write for `beforeunload`, where promises may never run.
 * Only the small mirror is updated; a document too large for it is already in
 * IndexedDB from the previous debounce tick.
 */
export function flushMirrorSync(snapshot: WorkspaceSnapshot): void {
  const savedAt = Date.now();
  const payload = {
    id: RECORD_ID,
    version: WORKSPACE_VERSION,
    savedAt,
    tabs: snapshot.tabs,
    activeTabId: snapshot.activeTabId,
  };
  const json = JSON.stringify(payload);
  const bytes = byteLength(json);
  if (bytes > MIRROR_LIMIT) return;
  const record: StoredWorkspace = { ...payload, bytes };
  if (!writeJson(MIRROR_KEY, record)) return;
  const previous = readStorageMarker();
  writeJson(STORAGE_MARKER_KEY, {
    mode: previous?.mode ?? 'local',
    savedAt,
    bytes,
  } satisfies StorageMarker);
}

/** Human-readable bytes for tooltips. */
export function formatBytes(bytes: number): string {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
