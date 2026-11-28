import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { TEXT_EFFECT_KEYS, fitTextBoxToEffects } from '../utils/textEffectsFit';
import {
  DocumentProject,
  Page,
  PublisherElement,
  PageMargins,
  PageGuide,
  PageBackgroundPattern,
  PageBackgroundGradient,
  MasterPageDef,
  BrandKit,
  TextElement,
  ShapeElement,
  ImageElement,
  TableElement,
  AccentElement,
  LineElement,
  QRElement,
  ConnectorElement,
  ShapeType,
  BackstageSection,
} from '../types/publisher';
import type { TextControlSection } from '../constants/textControls';
import { buildCollageElements } from '../utils/collageBuild';
import { adoptCollageIds, freshCollageIds } from '../utils/collageIdentity';
import type { CollageControlSection } from '../constants/collageControls';
import { buildMergedPartFromShape } from '../utils/shapePaths';
import { mergeShapeGeometry } from '../utils/shapeBoolean';
import { pageRingsToLocal, ringsToPath, shapeOutlineRings } from '../utils/shapeClip';
import { TEMPLATES } from '../constants/templates';
import {
  clearWorkspaceStorage,
  flushMirrorSync,
  readBootCache,
  readStoredWorkspace,
  saveWorkspace,
  type StoredWorkspace,
} from '../utils/workspaceStorage';
import { reflowElementsForSize } from '../utils/smartResize';
import { CompositionStyle } from '../utils/designBlueprints';
import { DEFAULT_BRAND_KITS, rebrandPageWithKit } from '../utils/brandRebrand';
import { PAGE_SIZES } from '../constants/pageSizes';
import { COLOR_SCHEMES } from '../constants/colorSchemes';
import { buildMasterPresetElements } from '../constants/masterPresets';
import {
  DEFAULT_PRINT_SETTINGS,
  PrintSettings,
  computeTarpapelMetrics,
} from '../utils/printUtils';

interface PublisherContextType {
  project: DocumentProject;
  activePage: Page;
  selectedElementIds: string[];
  zoom: number;
  pan: { x: number; y: number };
  activeTab: 'home' | 'insert' | 'page-design' | 'mailings' | 'view' | 'settings';
  workspaceMode: 'publisher' | 'designer';
  theme: 'light' | 'dark';
  isBackstageOpen: boolean;
  /** Active File (Backstage) section — shared so any button can deep-link. */
  backstageSection: BackstageSection;
  setBackstageSection: (section: BackstageSection) => void;
  isMailMergeOpen: boolean;
  isWordArtModalOpen: boolean;
  isBuildingBlocksModalOpen: boolean;
  isAIImageModalOpen: boolean;
  isStockArtPanelOpen: boolean;
  isCollageModalOpen: boolean;
  editingCollageState: {
    meta: import('../utils/borderArtStyles').CollageMeta;
    groupId?: string;
    elementId?: string;
    originX: number;
    originY: number;
  } | null;
  isBrandBoardModalOpen: boolean;
  isBrandKitModalOpen: boolean;
  brandKits: BrandKit[];
  activeBrandKit: BrandKit;
  rulerVisible: boolean;
  guidesVisible: boolean;
  gridVisible: boolean;
  tarpapelOverlayVisible: boolean;
  printSettings: PrintSettings;
  snapToGuides: boolean;
  snapToGrid: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isEditingMaster: boolean;
  hasClipboard: boolean;
  viewMode: 'artboard' | 'single' | 'continuous' | 'spread';
  toolMode: 'select' | 'pan';
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
  rightPanelTab: 'inspector' | 'design-ideas';

  // Setters & UI controls
  setViewMode: (mode: 'artboard' | 'single' | 'continuous' | 'spread') => void;
  setToolMode: (mode: 'select' | 'pan') => void;
  setIsLeftPanelOpen: (open: boolean) => void;
  setIsRightPanelOpen: (open: boolean) => void;
  setRightPanelTab: (tab: 'inspector' | 'design-ideas') => void;
  applyDesignRecommendation: (recommendedPage: Page) => void;
  setIsEditingMaster: (editing: boolean) => void;
  toggleMasterPageVisibility: () => void;
  masterPages: MasterPageDef[];
  activeMasterId: string;
  getMasterElementsForPage: (pg: Page) => PublisherElement[];
  addMasterPage: (name?: string) => void;
  selectMasterPage: (masterId: string) => void;
  renameMasterPage: (masterId: string, name: string) => void;
  deleteMasterPage: (masterId: string) => void;
  assignMasterToPage: (pageId: string, masterId: string | null) => void;
  applyMasterPreset: (presetId: string) => void;
  reorderPage: (fromIndex: number, toIndex: number) => void;
  renamePage: (pageId: string, name: string) => void;
  addBookletSpread: () => void;
  padToBookletMultiple: () => void;
  setActiveTab: (tab: 'home' | 'insert' | 'page-design' | 'mailings' | 'view' | 'settings') => void;
  setWorkspaceMode: (mode: 'publisher' | 'designer') => void;
  toggleWorkspaceMode: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setIsBackstageOpen: (open: boolean) => void;
  /** Opens the File view on a specific section (e.g. 'print'). */
  openBackstage: (section?: BackstageSection) => void;
  setIsMailMergeOpen: (open: boolean) => void;
  setIsWordArtModalOpen: (open: boolean) => void;
  setIsBuildingBlocksModalOpen: (open: boolean) => void;
  setIsAIImageModalOpen: (open: boolean) => void;
  setIsStockArtPanelOpen: (open: boolean) => void;
  setIsCollageModalOpen: (open: boolean) => void;
  openCollageEditor: (opts: {
    meta: import('../utils/borderArtStyles').CollageMeta;
    groupId?: string;
    elementId?: string;
    originX: number;
    originY: number;
  }) => void;
  replaceCollageGroup: (
    nextElements: PublisherElement[],
    groupId?: string,
    elementId?: string
  ) => void;
  /**
   * Applies a changed `CollageMeta` to a collage already on the page, leaving its position
   * alone. This is what lets the canvas toolbar change a collage without opening the
   * builder — the modal and the toolbar write elements through the same builder.
   */
  patchCollageMeta: (
    groupId: string,
    nextMeta: import('../utils/borderArtStyles').CollageMeta,
    /** The collage's elements. Passed explicitly so an ungrouped collage still patches. */
    memberIds?: string[]
  ) => void;

  /**
   * Nested collage controls (experimental). The canvas bar has direct buttons for one-click
   * changes; anything that needs a value picked sends the user here instead.
   */
  collageControlSection: CollageControlSection | null;
  openCollageControl: (section: CollageControlSection) => void;
  closeCollageControl: () => void;
  /**
   * The same idea for text: the bar's font and colour chips open their section here rather
   * than rendering a picker inside a floating pill.
   */
  textControlSection: TextControlSection | null;
  openTextControl: (section: TextControlSection) => void;
  closeTextControl: () => void;
  setIsBrandBoardModalOpen: (open: boolean) => void;
  setIsBrandKitModalOpen: (open: boolean) => void;
  saveBrandKit: (kit: BrandKit) => void;
  deleteBrandKit: (kitId: string) => void;
  applyBrandKit: (
    kit: BrandKit,
    scope?: 'all' | 'page',
    options?: { stampLogo?: boolean }
  ) => void;
  setRulerVisible: (visible: boolean) => void;
  setGuidesVisible: (visible: boolean) => void;
  setGridVisible: (visible: boolean) => void;
  setTarpapelOverlayVisible: (visible: boolean) => void;
  setPrintSettings: React.Dispatch<React.SetStateAction<PrintSettings>>;
  matchPageToTarpapelRatio: () => void;
  setSnapToGuides: (snap: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;

  // History
  undo: () => void;
  redo: () => void;

  // Document & Page actions
  workspaceTabs: WorkspaceTab[];
  activeTabId: string;
  switchWorkspaceTab: (tabId: string) => void;
  createNewTab: (initialProject?: DocumentProject) => void;
  closeWorkspaceTab: (tabId: string) => void;
  renameWorkspaceTab: (tabId: string, name: string) => void;
  duplicateWorkspaceTab: (tabId: string) => void;
  moveWorkspaceTab: (tabId: string, direction: 'left' | 'right') => void;
  setWorkspaceTabColor: (tabId: string, color?: string) => void;
  setProject: (newProject: DocumentProject) => void;
  setActivePageIndex: (index: number) => void;
  addPage: () => void;
  duplicateActivePage: () => void;
  deleteActivePage: () => void;
  deletePageById: (pageId: string) => void;
  generateBrandBoardSizes: (sizeNames: string[], layoutStyle?: CompositionStyle) => void;
  setPageSize: (sizeName: string) => void;
  setPageOrientation: (orientation: 'portrait' | 'landscape') => void;
  updatePagePosition: (pageIndex: number, x: number, y: number) => void;
  setPageMargins: (margins: PageMargins) => void;
  setPageBackgroundColor: (color: string) => void;
  setPageBackgroundGradient: (gradient: PageBackgroundGradient | undefined) => void;
  setPageBackgroundPattern: (pattern: PageBackgroundPattern | undefined) => void;
  applyPageBackdrop: (backdrop: {
    backgroundColor: string;
    backgroundGradient?: PageBackgroundGradient;
    backgroundPattern?: PageBackgroundPattern;
  }) => void;
  setColorScheme: (schemeId: string) => void;
  loadTemplate: (templateId: string) => void;

  // Guides
  addGuide: (orientation: 'horizontal' | 'vertical', position: number) => void;
  removeGuide: (id: string) => void;

  // Element actions
  addElement: (element: PublisherElement) => void;
  addElementsBatch: (elements: PublisherElement[]) => void;
  updateElement: (
    id: string,
    updates: Partial<PublisherElement>,
    options?: { transient?: boolean }
  ) => void;
  updateElementsBatch: (
    updatesById: Record<string, Partial<PublisherElement>>,
    options?: { transient?: boolean }
  ) => void;
  beginInteraction: () => void;
  endInteraction: () => void;
  updateSelectedElements: (updates: Partial<PublisherElement>) => void;
  deleteSelectedElements: () => void;
  duplicateSelectedElements: () => void;
  copySelectedElements: () => void;
  pasteElements: () => void;
  toggleElementLock: (id: string) => void;
  toggleElementVisibility: (id: string) => void;
  setElementsVisibility: (ids: string[], visible: boolean) => void;
  setElementsLocked: (ids: string[], locked: boolean) => void;
  renameElement: (id: string, name: string) => void;
  reorderElementLayer: (draggedId: string, targetId: string) => void;
  selectElement: (id: string, multiSelect?: boolean) => void;
  selectElements: (ids: string[], additive?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  alignSelected: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeSelected: (axis: 'horizontal' | 'vertical') => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  mergeSelectedShapes: (op: 'union' | 'combine' | 'subtract' | 'intersect') => void;
  clipToShape: () => void;
  autoConnectSelectedShapes: (style?: 'straight' | 'elbow' | 'curved') => void;
  disconnectSelectedShapes: () => void;
  addConnectedDiagramStep: (style?: 'straight' | 'elbow' | 'curved') => void;

  // Quick factory helpers
  addTextBox: (options?: Partial<TextElement>) => void;
  addShape: (shapeType: ShapeType, options?: Partial<ShapeElement>) => void;
  addImage: (src: string, options?: Partial<ImageElement>) => void;
  addPicturePlaceholder: (options?: Partial<ImageElement>) => void;
  fillPlaceholderFromImageElement: (sourceId: string, targetPlaceholderId: string) => void;
  detachImageFromPlaceholder: (elementId: string) => void;
  addTable: (rows: number, cols: number, options?: Partial<TableElement>) => void;
  addAccent: (accentType: AccentElement['accentType'], options?: Partial<AccentElement>) => void;
  addLine: (options?: Partial<LineElement>) => void;
  addQRCode: (value?: string, options?: Partial<QRElement>) => void;
  addPageNumberToken: () => void;

  // Zoom & Pan
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomFit: () => void;
  zoom100: () => void;
}

export interface WorkspaceTab {
  id: string;
  project: DocumentProject;
  tabColor?: string;
  updatedAt: number;
}

const PublisherContext = createContext<PublisherContextType | null>(null);

const BRAND_KITS_STORAGE_KEY = 'studiopress_brand_kits_v1';

interface BootWorkspace {
  tabs: WorkspaceTab[];
  activeTabId: string;
  /** True while an IndexedDB copy may still be newer than the in-memory one. */
  expectIndexedDb: boolean;
  savedAt: number;
}

/**
 * Collages saved before they were stamped with an id adopt one here, so a document that
 * predates the change behaves exactly like one inserted today.
 */
function withAdoptedCollages(tabs: WorkspaceTab[]): WorkspaceTab[] {
  let changed = false;
  const next = tabs.map((tab) => {
    const pages = adoptCollageIds(tab.project.pages);
    if (pages === tab.project.pages) return tab;
    changed = true;
    return { ...tab, project: { ...tab.project, pages } };
  });
  return changed ? next : tabs;
}

function defaultWorkspace(): WorkspaceTab[] {
  return [
    {
      id: 'tab-initial',
      project: JSON.parse(JSON.stringify(TEMPLATES[0].project)),
      updatedAt: Date.now(),
    },
  ];
}

/**
 * First paint reads what `localStorage` can serve synchronously (the small
 * mirror, or the pre-IndexedDB keys on first run after the upgrade). When the
 * marker says an IndexedDB copy exists, the provider shows a short restoring
 * screen and swaps in the authoritative document — see `expectIndexedDb`.
 */
function loadInitialWorkspace(): BootWorkspace {
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reset') === '1' || params.get('fresh') === '1') {
        void clearWorkspaceStorage({ resetCaches: true });
        params.delete('reset');
        params.delete('fresh');
        const nextSearch = params.toString();
        const cleanUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
        window.history.replaceState({}, '', cleanUrl);
        return { tabs: defaultWorkspace(), activeTabId: 'tab-initial', expectIndexedDb: false, savedAt: 0 };
      }
    }
    const cached = readBootCache();
    if (cached.workspace && cached.workspace.tabs.length > 0) {
      const tabs = withAdoptedCollages(
        cached.workspace.tabs.filter(
          (tab) => tab?.id && tab?.project && Array.isArray(tab.project.pages) && tab.project.pages.length > 0
        )
      );
      if (tabs.length > 0) {
        const activeExists = tabs.some((tab) => tab.id === cached.workspace!.activeTabId);
        return {
          tabs,
          activeTabId: activeExists ? cached.workspace.activeTabId : tabs[0].id,
          expectIndexedDb: cached.expectIndexedDb,
          savedAt: cached.savedAt,
        };
      }
    }
    return {
      tabs: defaultWorkspace(),
      activeTabId: 'tab-initial',
      expectIndexedDb: cached.expectIndexedDb,
      savedAt: cached.savedAt,
    };
  } catch {
    return { tabs: defaultWorkspace(), activeTabId: 'tab-initial', expectIndexedDb: false, savedAt: 0 };
  }
}

/**
 * Shown while the authoritative document is read out of IndexedDB. Without it
 * the editor would flash the default template and could export the wrong page.
 * Includes an escape hatch to wipe stuck/corrupted browser storage and start fresh.
 */
const WorkspaceRestoreSplash: React.FC<{ onReset: () => Promise<void> | void }> = ({ onReset }) => {
  const [resetting, setResetting] = useState(false);
  const isDark =
    typeof window !== 'undefined' &&
    (document.documentElement.classList.contains('dark') ||
      localStorage.getItem('studiopress_theme') === 'dark');

  const handleReset = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      await onReset();
    } finally {
      setResetting(false);
    }
  };

  return (
    <div
      className={`h-screen w-screen flex items-center justify-center px-4 ${
        isDark ? 'bg-[#12151c] text-[#f0f3f8]' : 'bg-[#f4f6f8] text-[#161a22]'
      }`}
    >
      <div className="flex flex-col items-center gap-3 text-center max-w-xs">
        <div className="w-8 h-8 rounded-full border-2 border-[#d3c9f9] border-t-[#6e56cf] animate-spin" />
        <p className="text-xs font-semibold">
          {resetting ? 'Resetting workspace…' : 'Restoring your document…'}
        </p>
        <p className={`text-[11px] ${isDark ? 'text-[#9aa5b1]' : 'text-[#6a7682]'}`}>
          Large images load from browser storage
        </p>
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className={`mt-2 px-3.5 py-1.5 rounded-[8px] border text-[11px] font-semibold transition cursor-pointer disabled:opacity-50 ${
            isDark
              ? 'border-[#2f3644] bg-[#1c212b] hover:bg-[#272e3b] text-[#e2e8f0]'
              : 'border-[#d8dee6] bg-white hover:bg-[#f4f2ff] hover:border-[#d3c9f9] text-[#4a5661] hover:text-[#5c4bb8]'
          }`}
        >
          {resetting ? 'Clearing storage…' : 'Reset App & Start Fresh'}
        </button>
      </div>
    </div>
  );
};

export const PublisherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialWorkspaceRef = useRef<BootWorkspace | null>(null);
  if (!initialWorkspaceRef.current) {
    initialWorkspaceRef.current = loadInitialWorkspace();
  }
  const [isRestoring, setIsRestoring] = useState<boolean>(
    () => initialWorkspaceRef.current!.expectIndexedDb
  );

  const [workspaceTabs, setWorkspaceTabs] = useState<WorkspaceTab[]>(
    () => initialWorkspaceRef.current!.tabs
  );
  const [activeTabId, setActiveTabId] = useState<string>(
    () => initialWorkspaceRef.current!.activeTabId
  );

  const [project, setProjectState] = useState<DocumentProject>(() => {
    const found = initialWorkspaceRef.current!.tabs.find(
      (t) => t.id === initialWorkspaceRef.current!.activeTabId
    );
    return found ? found.project : initialWorkspaceRef.current!.tabs[0].project;
  });

  const tabHistoriesRef = useRef<
    Record<string, { past: DocumentProject[]; future: DocumentProject[] }>
  >({});

  // Sync active project edits into workspaceTabs
  useEffect(() => {
    setWorkspaceTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, project, updatedAt: Date.now() } : t))
    );
  }, [project, activeTabId]);

  // Debounced auto-save of every workspace tab. IndexedDB is the real store
  // (it has no 5 MB ceiling for photo-heavy documents); localStorage only keeps
  // a mirror small enough to boot from instantly.
  const latestTabsRef = useRef({ tabs: workspaceTabs, activeTabId });
  latestTabsRef.current = { tabs: workspaceTabs, activeTabId };
  const saveChainRef = useRef<Promise<unknown>>(Promise.resolve());

  const persistWorkspace = useCallback(() => {
    const snapshot = latestTabsRef.current;
    // Serialise saves: two in flight at once could land out of order.
    saveChainRef.current = saveChainRef.current
      .then(() => saveWorkspace({ tabs: snapshot.tabs, activeTabId: snapshot.activeTabId }))
      .catch(() => {
        // Storage failure must never break editing; the status bar shows the mode.
      });
  }, []);

  useEffect(() => {
    // Never write while the authoritative document is still being restored.
    if (isRestoring) return;
    const timer = window.setTimeout(persistWorkspace, 500);
    return () => window.clearTimeout(timer);
  }, [workspaceTabs, activeTabId, isRestoring, persistWorkspace]);

  useEffect(() => {
    // A tab being closed or hidden cannot await IndexedDB, so write the small
    // mirror synchronously and let the queued save catch up in the background.
    const flush = () => flushMirrorSync(latestTabsRef.current);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flush();
        persistWorkspace();
      }
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [persistWorkspace]);

  const [historyPast, setHistoryPast] = useState<DocumentProject[]>([]);
  const [historyFuture, setHistoryFuture] = useState<DocumentProject[]>([]);

  // A store that never answers must not trap the editor behind the splash.
  const restoreAbandonedRef = useRef(false);
  useEffect(() => {
    if (!isRestoring) return;
    const timer = window.setTimeout(() => {
      restoreAbandonedRef.current = true;
      setIsRestoring(false);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [isRestoring]);

  // Swap in the authoritative document once IndexedDB answers, unless the
  // synchronous copy was already newer.
  useEffect(() => {
    if (!initialWorkspaceRef.current!.expectIndexedDb) return;
    let cancelled = false;
    const bootSavedAt = initialWorkspaceRef.current!.savedAt;
    void readStoredWorkspace()
      .then((stored: StoredWorkspace | null) => {
        if (cancelled || restoreAbandonedRef.current) return;
        if (!stored || stored.savedAt <= bootSavedAt) return;
        const validTabs = withAdoptedCollages(
          stored.tabs.filter(
            (tab) => tab?.id && tab?.project && Array.isArray(tab.project.pages) && tab.project.pages.length > 0
          )
        );
        if (validTabs.length === 0) return;
        const activeExists = validTabs.some((tab) => tab.id === stored.activeTabId);
        const nextActiveId = activeExists ? stored.activeTabId : validTabs[0].id;
        const nextProject = validTabs.find((tab) => tab.id === nextActiveId)!.project;
        tabHistoriesRef.current = {};
        setWorkspaceTabs(validTabs);
        setActiveTabId(nextActiveId);
        setProjectState(nextProject);
        setHistoryPast([]);
        setHistoryFuture([]);
      })
      .catch(() => {
        // Corrupt or unavailable store: keep whatever localStorage gave us.
      })
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [copiedElements, setCopiedElements] = useState<PublisherElement[]>([]);
  const [isEditingMaster, setIsEditingMasterState] = useState<boolean>(false);
  // Single page is the default view: one page, fully fitted, is what people open a
  // document to look at. Spread/artboard are deliberate choices from the view control.
  const [viewMode, setViewMode] = useState<'artboard' | 'single' | 'continuous' | 'spread'>(
    'single'
  );
  const [toolMode, setToolMode] = useState<'select' | 'pan'>('select');
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState<'inspector' | 'design-ideas'>('inspector');
  const [zoom, setZoomState] = useState<number>(0.8);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [activeTab, setActiveTab] = useState<
    'home' | 'insert' | 'page-design' | 'mailings' | 'view' | 'settings'
  >('home');
  const [workspaceMode, setWorkspaceModeState] = useState<'publisher' | 'designer'>(() => {
    try {
      const saved = localStorage.getItem('studiopress_workspace_mode');
      if (saved === 'designer' || saved === 'publisher') return saved;
    } catch {
      // ignore
    }
    return 'publisher';
  });

  useEffect(() => {
    try {
      localStorage.setItem('studiopress_workspace_mode', workspaceMode);
    } catch {
      // ignore
    }
  }, [workspaceMode]);

  const setWorkspaceMode = useCallback((next: 'publisher' | 'designer') => {
    setWorkspaceModeState(next);
  }, []);
  const toggleWorkspaceMode = useCallback(() => {
    setWorkspaceModeState((prev) => (prev === 'publisher' ? 'designer' : 'publisher'));
  }, []);
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('studiopress_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
    try {
      localStorage.setItem('studiopress_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const setTheme = useCallback((next: 'light' | 'dark') => setThemeState(next), []);
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === 'light' ? 'dark' : 'light')),
    []
  );
  const [isBackstageOpen, setIsBackstageOpen] = useState(false);
  // The File view section lives here so the toolbar, ribbon and status bar can
  // deep-link straight to Print / Export / New without prop drilling.
  const [backstageSection, setBackstageSection] = useState<BackstageSection>('new');

  const openBackstage = useCallback((section?: BackstageSection) => {
    if (section) setBackstageSection(section);
    setIsBackstageOpen(true);
  }, []);
  const [tarpapelOverlayVisible, setTarpapelOverlayVisible] = useState(false);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [isMailMergeOpen, setIsMailMergeOpen] = useState(false);
  const [isWordArtModalOpen, setIsWordArtModalOpen] = useState(false);
  const [isBuildingBlocksModalOpen, setIsBuildingBlocksModalOpen] = useState(false);
  const [isAIImageModalOpen, setIsAIImageModalOpen] = useState(false);
  const [isStockArtPanelOpen, setIsStockArtPanelOpen] = useState(false);
  const [isCollageModalOpen, setIsCollageModalOpenState] = useState(false);
  const [collageControlSection, setCollageControlSection] = useState<CollageControlSection | null>(
    null
  );
  const [textControlSection, setTextControlSection] = useState<TextControlSection | null>(null);
  const [editingCollageState, setEditingCollageState] = useState<{
    meta: import('../utils/borderArtStyles').CollageMeta;
    groupId?: string;
    elementId?: string;
    originX: number;
    originY: number;
  } | null>(null);
  const setIsCollageModalOpen = useCallback((open: boolean) => {
    setIsCollageModalOpenState(open);
    if (!open) setEditingCollageState(null);
  }, []);
  const openCollageEditor = useCallback(
    (opts: {
      meta: import('../utils/borderArtStyles').CollageMeta;
      groupId?: string;
      elementId?: string;
      originX: number;
      originY: number;
    }) => {
      setEditingCollageState(opts);
      setIsCollageModalOpenState(true);
    },
    []
  );
  const openCollageControl = useCallback(
    (section: CollageControlSection) => {
      setCollageControlSection(section);
      setTextControlSection(null);
      // Same destination rule as text: the drawer beside the bar in Designer, the inspector
      // in Publisher, which has no drawer.
      if (workspaceMode !== 'designer') {
        setIsRightPanelOpen(true);
        setRightPanelTab('inspector');
      }
    },
    [workspaceMode]
  );
  const openTextControl = useCallback(
    (section: TextControlSection) => {
      setTextControlSection(section);
      setCollageControlSection(null);
      // Designer has an edit sidebar beside the toolbar, and that is where a font list
      // belongs; Publisher has no drawer, so there the inspector is the destination.
      if (workspaceMode !== 'designer') {
        setIsRightPanelOpen(true);
        setRightPanelTab('inspector');
      }
    },
    [workspaceMode]
  );
  const closeTextControl = useCallback(() => setTextControlSection(null), []);
  const closeCollageControl = useCallback(() => setCollageControlSection(null), []);

  const [isBrandBoardModalOpen, setIsBrandBoardModalOpen] = useState(false);
  const [isBrandKitModalOpen, setIsBrandKitModalOpen] = useState(false);

  const [brandKits, setBrandKits] = useState<BrandKit[]>(() => {
    try {
      const saved = localStorage.getItem(BRAND_KITS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_BRAND_KITS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(BRAND_KITS_STORAGE_KEY, JSON.stringify(brandKits));
    } catch {
      // ignore quota errors
    }
  }, [brandKits]);

  const activeBrandKit =
    brandKits.find((k) => k.id === project.activeBrandKitId) || brandKits[0];

  const [rulerVisible, setRulerVisible] = useState(true);
  const [guidesVisible, setGuidesVisible] = useState(true);
  const [gridVisible, setGridVisible] = useState(false);
  const [snapToGuides, setSnapToGuides] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);

  const activePage = project.pages[project.activePageIndex] || project.pages[0];

  const setIsEditingMaster = useCallback((editing: boolean) => {
    setIsEditingMasterState(editing);
    setSelectedElementIds([]);
  }, []);

  const toggleMasterPageVisibility = useCallback(() => {
    const current = project.masterPage || { elements: [], showOnAllPages: true };
    setProjectState((prev) => ({
      ...prev,
      masterPage: {
        ...current,
        showOnAllPages: !current.showOnAllPages,
      },
    }));
  }, [project.masterPage]);

  // Helper to commit a new project state with undo history
  const projectRef = useRef(project);
  projectRef.current = project;
  const interactionSnapshotRef = useRef<DocumentProject | null>(null);

  const beginInteraction = useCallback(() => {
    interactionSnapshotRef.current = projectRef.current;
  }, []);

  const endInteraction = useCallback(() => {
    const snap = interactionSnapshotRef.current;
    interactionSnapshotRef.current = null;
    if (snap && snap !== projectRef.current) {
      setHistoryPast((past) => [...past.slice(-30), snap]);
      setHistoryFuture([]);
    }
  }, []);

  const commitProject = useCallback(
    (newProject: DocumentProject) => {
      setHistoryPast((past) => [...past.slice(-30), project]);
      setHistoryFuture([]);
      setProjectState(newProject);
    },
    [project]
  );

  const undo = useCallback(() => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((past) => past.slice(0, past.length - 1));
    setHistoryFuture((future) => [project, ...future]);
    setProjectState(previous);
  }, [historyPast, project]);

  const redo = useCallback(() => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryFuture((future) => future.slice(1));
    setHistoryPast((past) => [...past, project]);
    setProjectState(next);
  }, [historyFuture, project]);

  const setProject = useCallback((newProj: DocumentProject) => {
    commitProject(newProj);
    setSelectedElementIds([]);
  }, [commitProject]);

  const switchWorkspaceTab = useCallback(
    (tabId: string) => {
      if (tabId === activeTabId) return;
      const target = workspaceTabs.find((t) => t.id === tabId);
      if (!target) return;

      tabHistoriesRef.current[activeTabId] = {
        past: historyPast,
        future: historyFuture,
      };
      setWorkspaceTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, project } : t))
      );

      const targetHist = tabHistoriesRef.current[tabId] || { past: [], future: [] };
      setActiveTabId(tabId);
      setProjectState(target.project);
      setHistoryPast(targetHist.past);
      setHistoryFuture(targetHist.future);
      setSelectedElementIds([]);
      setIsEditingMasterState(false);
    },
    [activeTabId, workspaceTabs, historyPast, historyFuture, project]
  );

  const createNewTab = useCallback(
    (initialProject?: DocumentProject) => {
      const blankTpl = TEMPLATES.find((t) => t.id === 'blank-letter') || TEMPLATES[0];
      const nextProj: DocumentProject = initialProject
        ? JSON.parse(JSON.stringify(initialProject))
        : {
            ...JSON.parse(JSON.stringify(blankTpl.project)),
            id: `proj-${Date.now()}`,
            name: `Publication ${workspaceTabs.length + 1}.pub`,
          };
      const newTabId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      tabHistoriesRef.current[activeTabId] = {
        past: historyPast,
        future: historyFuture,
      };

      setWorkspaceTabs((prev) => [
        ...prev.map((t) => (t.id === activeTabId ? { ...t, project } : t)),
        { id: newTabId, project: nextProj, updatedAt: Date.now() },
      ]);
      setActiveTabId(newTabId);
      setProjectState(nextProj);
      setHistoryPast([]);
      setHistoryFuture([]);
      setSelectedElementIds([]);
      setIsEditingMasterState(false);
    },
    [activeTabId, workspaceTabs.length, historyPast, historyFuture, project]
  );

  const closeWorkspaceTab = useCallback(
    (tabId: string) => {
      delete tabHistoriesRef.current[tabId];
      if (workspaceTabs.length <= 1) {
        const blankTpl = TEMPLATES.find((t) => t.id === 'blank-letter') || TEMPLATES[0];
        const freshProj: DocumentProject = {
          ...JSON.parse(JSON.stringify(blankTpl.project)),
          id: `proj-${Date.now()}`,
          name: 'Publication 1.pub',
        };
        const freshId = `tab-${Date.now()}`;
        setWorkspaceTabs([{ id: freshId, project: freshProj, updatedAt: Date.now() }]);
        setActiveTabId(freshId);
        setProjectState(freshProj);
        setHistoryPast([]);
        setHistoryFuture([]);
        setSelectedElementIds([]);
        setIsEditingMasterState(false);
        return;
      }

      const idx = workspaceTabs.findIndex((t) => t.id === tabId);
      const remaining = workspaceTabs.filter((t) => t.id !== tabId);
      setWorkspaceTabs(remaining);

      if (tabId === activeTabId) {
        const nextTab = remaining[Math.min(idx, remaining.length - 1)] || remaining[0];
        const nextHist = tabHistoriesRef.current[nextTab.id] || { past: [], future: [] };
        setActiveTabId(nextTab.id);
        setProjectState(nextTab.project);
        setHistoryPast(nextHist.past);
        setHistoryFuture(nextHist.future);
        setSelectedElementIds([]);
        setIsEditingMasterState(false);
      }
    },
    [workspaceTabs, activeTabId]
  );

  const renameWorkspaceTab = useCallback(
    (tabId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setWorkspaceTabs((prev) =>
        prev.map((t) =>
          t.id === tabId ? { ...t, project: { ...t.project, name: trimmed } } : t
        )
      );
      if (tabId === activeTabId) {
        setProjectState((p) => ({ ...p, name: trimmed }));
      }
    },
    [activeTabId]
  );

  const duplicateWorkspaceTab = useCallback(
    (tabId: string) => {
      const source = workspaceTabs.find((t) => t.id === tabId);
      if (!source) return;
      const baseProj = tabId === activeTabId ? project : source.project;
      const cloned: DocumentProject = JSON.parse(JSON.stringify(baseProj));
      cloned.id = `proj-${Date.now()}`;
      const cleanName = cloned.name.replace(/\.pub$/i, '');
      cloned.name = `${cleanName} (Copy).pub`;

      const newTabId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      tabHistoriesRef.current[activeTabId] = {
        past: historyPast,
        future: historyFuture,
      };

      const idx = workspaceTabs.findIndex((t) => t.id === tabId);
      setWorkspaceTabs((prev) => {
        const synced = prev.map((t) => (t.id === activeTabId ? { ...t, project } : t));
        const copyTab: WorkspaceTab = {
          id: newTabId,
          project: cloned,
          tabColor: source.tabColor,
          updatedAt: Date.now(),
        };
        const next = [...synced];
        next.splice(idx + 1, 0, copyTab);
        return next;
      });
      setActiveTabId(newTabId);
      setProjectState(cloned);
      setHistoryPast([]);
      setHistoryFuture([]);
      setSelectedElementIds([]);
      setIsEditingMasterState(false);
    },
    [workspaceTabs, activeTabId, project, historyPast, historyFuture]
  );

  const moveWorkspaceTab = useCallback(
    (tabId: string, direction: 'left' | 'right') => {
      setWorkspaceTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === tabId);
        if (idx === -1) return prev;
        const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= prev.length) return prev;
        const next = [...prev];
        const [item] = next.splice(idx, 1);
        next.splice(targetIdx, 0, item);
        return next;
      });
    },
    []
  );

  const setWorkspaceTabColor = useCallback((tabId: string, color?: string) => {
    setWorkspaceTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, tabColor: color } : t))
    );
  }, []);

  const setActivePageIndex = useCallback((index: number) => {
    setProjectState((p) => ({ ...p, activePageIndex: index }));
    setSelectedElementIds([]);
  }, []);

  const addPage = useCallback(() => {
    const pageNum = project.pages.length + 1;
    // Place new artboard to the right of the rightmost existing page
    let nextX = 80;
    project.pages.forEach((pg, idx) => {
      const px = pg.x ?? 80 + idx * (pg.width + 80);
      nextX = Math.max(nextX, px + pg.width + 80);
    });

    const newPage: Page = {
      id: `page-${Date.now()}`,
      name: `Page ${pageNum}`,
      x: nextX,
      y: activePage.y ?? 80,
      width: activePage.width,
      height: activePage.height,
      orientation: activePage.orientation,
      backgroundColor: '#ffffff',
      margins: { ...activePage.margins },
      guides: [],
      elements: [],
    };
    commitProject({
      ...project,
      pages: [...project.pages, newPage],
      activePageIndex: project.pages.length,
    });
    setSelectedElementIds([]);
  }, [project, activePage, commitProject]);

  const duplicateActivePage = useCallback(() => {
    const clonedPage: Page = JSON.parse(JSON.stringify(activePage));
    clonedPage.id = `page-${Date.now()}`;
    clonedPage.name = `${activePage.name} (Copy)`;
    clonedPage.x = (activePage.x ?? 80) + activePage.width + 80;
    clonedPage.y = activePage.y ?? 80;
    // assign new IDs to elements
    clonedPage.elements = clonedPage.elements.map((el) => ({
      ...el,
      id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    }));

    const newPages = [...project.pages];
    newPages.splice(project.activePageIndex + 1, 0, clonedPage);

    commitProject({
      ...project,
      pages: newPages,
      activePageIndex: project.activePageIndex + 1,
    });
    setSelectedElementIds([]);
  }, [project, activePage, commitProject]);

  const deleteActivePage = useCallback(() => {
    if (project.pages.length <= 1) return; // Keep at least one page
    const newPages = project.pages.filter((_, idx) => idx !== project.activePageIndex);
    const newIndex = Math.max(0, project.activePageIndex - 1);
    commitProject({
      ...project,
      pages: newPages,
      activePageIndex: newIndex,
    });
    setSelectedElementIds([]);
  }, [project, commitProject]);

  const deletePageById = useCallback(
    (pageId: string) => {
      if (project.pages.length <= 1) return; // Always keep at least one artboard
      const targetIdx = project.pages.findIndex((pg) => pg.id === pageId);
      if (targetIdx === -1) return;
      const newPages = project.pages.filter((pg) => pg.id !== pageId);
      let nextActiveIdx = project.activePageIndex;
      if (targetIdx < project.activePageIndex) {
        nextActiveIdx = project.activePageIndex - 1;
      } else if (targetIdx === project.activePageIndex) {
        nextActiveIdx = Math.max(0, Math.min(targetIdx, newPages.length - 1));
      }
    commitProject({
      ...project,
      pages: newPages,
      activePageIndex: nextActiveIdx,
    });
    setSelectedElementIds([]);
  },
  [project, commitProject]
  );

  const reorderPage = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= project.pages.length ||
        toIndex >= project.pages.length
      ) {
        return;
      }
      const nextPages = [...project.pages];
      const [moved] = nextPages.splice(fromIndex, 1);
      nextPages.splice(toIndex, 0, moved);
      const activeId = activePage.id;
      const nextActiveIdx = Math.max(
        0,
        nextPages.findIndex((p) => p.id === activeId)
      );
      commitProject({
        ...project,
        pages: nextPages,
        activePageIndex: nextActiveIdx,
      });
    },
    [project, activePage.id, commitProject]
  );

  const renamePage = useCallback(
    (pageId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      commitProject({
        ...project,
        pages: project.pages.map((pg) => (pg.id === pageId ? { ...pg, name: trimmed } : pg)),
      });
    },
    [project, commitProject]
  );

  const addBookletSpread = useCallback(() => {
    const baseCount = project.pages.length;
    let nextX = 80;
    project.pages.forEach((pg, idx) => {
      const px = pg.x ?? 80 + idx * (pg.width + 80);
      nextX = Math.max(nextX, px + pg.width + 80);
    });
    const ts = Date.now();
    const leftPg: Page = {
      id: `page-${ts}-l`,
      name: `Page ${baseCount + 1}`,
      x: nextX,
      y: activePage.y ?? 80,
      width: activePage.width,
      height: activePage.height,
      orientation: activePage.orientation,
      backgroundColor: '#ffffff',
      margins: { ...activePage.margins },
      guides: [],
      elements: [],
    };
    const rightPg: Page = {
      id: `page-${ts}-r`,
      name: `Page ${baseCount + 2}`,
      x: nextX + activePage.width + 80,
      y: activePage.y ?? 80,
      width: activePage.width,
      height: activePage.height,
      orientation: activePage.orientation,
      backgroundColor: '#ffffff',
      margins: { ...activePage.margins },
      guides: [],
      elements: [],
    };
    commitProject({
      ...project,
      pages: [...project.pages, leftPg, rightPg],
      activePageIndex: baseCount,
    });
    setSelectedElementIds([]);
  }, [project, activePage, commitProject]);

  const padToBookletMultiple = useCallback(() => {
    const count = project.pages.length;
    const targetCount = Math.max(4, Math.ceil(count / 4) * 4);
    const needed = targetCount - count;
    if (needed === 0) return;

    let nextX = 80;
    project.pages.forEach((pg, idx) => {
      const px = pg.x ?? 80 + idx * (pg.width + 80);
      nextX = Math.max(nextX, px + pg.width + 80);
    });

    const ts = Date.now();
    const extraPages: Page[] = Array.from({ length: needed }).map((_, i) => ({
      id: `page-${ts}-pad-${i}`,
      name: `Page ${count + i + 1}`,
      x: nextX + i * (activePage.width + 80),
      y: activePage.y ?? 80,
      width: activePage.width,
      height: activePage.height,
      orientation: activePage.orientation,
      backgroundColor: '#ffffff',
      margins: { ...activePage.margins },
      guides: [],
      elements: [],
    }));

    commitProject({
      ...project,
      pages: [...project.pages, ...extraPages],
    });
  }, [project, activePage, commitProject]);

  const setPageSize = useCallback(
    (sizeName: string) => {
      const def = PAGE_SIZES.find((s) => s.name === sizeName);
      if (!def) return;
      const newPages = project.pages.map((pg, idx) => {
        if (idx !== project.activePageIndex) return pg;
        const marginPad = def.width < 520 || def.height < 420 ? 18 : 40;
        const nextMargins = { top: marginPad, right: marginPad, bottom: marginPad, left: marginPad };
        return {
          ...pg,
          width: def.width,
          height: def.height,
          orientation: (def.width > def.height ? 'landscape' : 'portrait') as
            | 'portrait'
            | 'landscape',
          margins: nextMargins,
          elements:
            pg.elements.length > 0
              ? reflowElementsForSize(
                  pg.elements,
                  pg.width,
                  pg.height,
                  def.width,
                  def.height,
                  nextMargins,
                  false
                )
              : pg.elements,
        };
      });
      commitProject({
        ...project,
        pageSizeName: sizeName,
        pages: newPages,
      });
    },
    [project, commitProject]
  );

  const setPageOrientation = useCallback(
    (orientation: 'portrait' | 'landscape') => {
      const newPages = project.pages.map((pg, idx) => {
        if (idx !== project.activePageIndex || pg.orientation === orientation) return pg;
        const w = pg.width;
        const h = pg.height;
        return {
          ...pg,
          orientation,
          width: h,
          height: w,
          elements:
            pg.elements.length > 0
              ? reflowElementsForSize(pg.elements, w, h, h, w, pg.margins, false)
              : pg.elements,
        };
      });
      commitProject({
        ...project,
        pages: newPages,
      });
    },
    [project, commitProject]
  );

  const generateBrandBoardSizes = useCallback(
    (sizeNames: string[], layoutStyle: CompositionStyle = 'auto') => {
      const defs = sizeNames
        .map((name) => PAGE_SIZES.find((s) => s.name === name))
        .filter((d): d is NonNullable<typeof d> => Boolean(d));
      if (defs.length === 0) return;

      // Start laying out new artboards in a neat wrapped row to the right of existing artboards
      let startX = 80;
      let startY = 80;
      project.pages.forEach((pg, idx) => {
        const px = pg.x ?? 80 + idx * (pg.width + 80);
        const py = pg.y ?? 80;
        startX = Math.max(startX, px + pg.width + 100);
        startY = Math.min(startY, py);
      });

      const gap = 90;
      const maxRowWidth = startX + 3600;
      let cursorX = startX;
      let cursorY = startY;
      let rowMaxH = 0;

      const generatedPages: Page[] = defs.map((def, i) => {
        if (i > 0 && cursorX + def.width > maxRowWidth) {
          cursorX = startX;
          cursorY += rowMaxH + gap;
          rowMaxH = 0;
        }

        const marginPad = def.width < 520 || def.height < 420 ? 18 : 40;
        const targetMargins = { top: marginPad, right: marginPad, bottom: marginPad, left: marginPad };
        const reflowedElements = reflowElementsForSize(
          activePage.elements,
          activePage.width,
          activePage.height,
          def.width,
          def.height,
          targetMargins,
          true,
          layoutStyle
        );

        const newPage: Page = {
          id: `page-brand-${Date.now()}-${i}`,
          name: def.displayName.split(' (')[0],
          x: cursorX,
          y: cursorY,
          width: def.width,
          height: def.height,
          orientation: def.width > def.height ? 'landscape' : 'portrait',
          backgroundColor: activePage.backgroundColor,
          backgroundPattern: activePage.backgroundPattern
            ? { ...activePage.backgroundPattern }
            : undefined,
          margins: targetMargins,
          guides: [],
          elements: reflowedElements,
        };

        cursorX += def.width + gap;
        rowMaxH = Math.max(rowMaxH, def.height);
        return newPage;
      });

      commitProject({
        ...project,
        pages: [...project.pages, ...generatedPages],
        activePageIndex: project.pages.length,
      });
      setSelectedElementIds([]);
    },
    [project, activePage, commitProject]
  );

  const updatePagePosition = useCallback(
    (pageIndex: number, x: number, y: number) => {
      setProjectState((prev) => ({
        ...prev,
        pages: prev.pages.map((pg, idx) =>
          idx === pageIndex ? { ...pg, x: Math.round(x), y: Math.round(y) } : pg
        ),
      }));
    },
    []
  );

  const setPageMargins = useCallback(
    (margins: PageMargins) => {
      const newPages = project.pages.map((pg, idx) =>
        idx === project.activePageIndex ? { ...pg, margins } : pg
      );
      commitProject({ ...project, pages: newPages });
    },
    [project, commitProject]
  );

  const setPageBackgroundColor = useCallback(
    (backgroundColor: string) => {
      const newPages = project.pages.map((pg, idx) =>
        idx === project.activePageIndex ? { ...pg, backgroundColor } : pg
      );
      commitProject({ ...project, pages: newPages });
    },
    [project, commitProject]
  );

  const setPageBackgroundPattern = useCallback(
    (backgroundPattern: PageBackgroundPattern | undefined) => {
      const newPages = project.pages.map((pg, idx) =>
        idx === project.activePageIndex ? { ...pg, backgroundPattern } : pg
      );
      commitProject({ ...project, pages: newPages });
    },
    [project, commitProject]
  );

  const setPageBackgroundGradient = useCallback(
    (backgroundGradient: PageBackgroundGradient | undefined) => {
      const newPages = project.pages.map((pg, idx) =>
        idx === project.activePageIndex ? { ...pg, backgroundGradient } : pg
      );
      commitProject({ ...project, pages: newPages });
    },
    [project, commitProject]
  );

  const applyPageBackdrop = useCallback(
    (backdrop: {
      backgroundColor: string;
      backgroundGradient?: PageBackgroundGradient;
      backgroundPattern?: PageBackgroundPattern;
    }) => {
      const newPages = project.pages.map((pg, idx) =>
        idx === project.activePageIndex
          ? {
              ...pg,
              backgroundColor: backdrop.backgroundColor,
              backgroundGradient: backdrop.backgroundGradient,
              backgroundPattern: backdrop.backgroundPattern,
            }
          : pg
      );
      commitProject({ ...project, pages: newPages });
    },
    [project, commitProject]
  );

  const setColorScheme = useCallback(
    (schemeId: string) => {
      const newScheme = COLOR_SCHEMES.find((s) => s.id === schemeId);
      if (!newScheme) return;
      const prevScheme =
        COLOR_SCHEMES.find((s) => s.id === project.colorScheme) || COLOR_SCHEMES[0];

      const primaryPool = new Set(COLOR_SCHEMES.map((s) => s.primary.toLowerCase()));
      const secondaryPool = new Set(COLOR_SCHEMES.map((s) => s.secondary.toLowerCase()));
      const accentPool = new Set(COLOR_SCHEMES.map((s) => s.accent.toLowerCase()));
      const lightPool = new Set(COLOR_SCHEMES.map((s) => s.light.toLowerCase()));

      const remapColor = (color: string | undefined): string | undefined => {
        if (!color) return color;
        const c = color.toLowerCase();
        if (c === prevScheme.primary.toLowerCase() || primaryPool.has(c)) return newScheme.primary;
        if (c === prevScheme.secondary.toLowerCase() || secondaryPool.has(c)) return newScheme.secondary;
        if (c === prevScheme.accent.toLowerCase() || accentPool.has(c)) return newScheme.accent;
        if (c === prevScheme.light.toLowerCase() || lightPool.has(c)) return newScheme.light;
        return color;
      };

      const remapElements = (elements: PublisherElement[]): PublisherElement[] =>
        elements.map((el) => {
          switch (el.type) {
            case 'text':
              return {
                ...el,
                color: remapColor(el.color) || el.color,
                backgroundColor: remapColor(el.backgroundColor),
                borderColor: remapColor(el.borderColor),
              };
            case 'shape':
              return {
                ...el,
                fillColor: remapColor(el.fillColor) || el.fillColor,
                gradientColor2: remapColor(el.gradientColor2),
                strokeColor: remapColor(el.strokeColor) || el.strokeColor,
              };
            case 'table':
              return {
                ...el,
                headerBg: newScheme.primary,
                altRowBg: newScheme.light,
                borderColor: newScheme.secondary,
              };
            case 'accent':
              return {
                ...el,
                accentColor:
                  el.accentColor.toLowerCase() === prevScheme.accent.toLowerCase()
                    ? newScheme.accent
                    : newScheme.primary,
                secondaryColor: newScheme.secondary,
              };
            case 'line':
              return {
                ...el,
                strokeColor: remapColor(el.strokeColor) || newScheme.primary,
              };
            default:
              return el;
          }
        });

      const updatedPages = project.pages.map((pg) => ({
        ...pg,
        elements: remapElements(pg.elements),
      }));

      const updatedMaster = project.masterPage
        ? {
            ...project.masterPage,
            elements: remapElements(project.masterPage.elements),
          }
        : undefined;

      commitProject({
        ...project,
        colorScheme: schemeId,
        pages: updatedPages,
        masterPage: updatedMaster,
      });
    },
    [project, commitProject]
  );

  const saveBrandKit = useCallback((kit: BrandKit) => {
    setBrandKits((prev) => {
      const exists = prev.some((k) => k.id === kit.id);
      return exists ? prev.map((k) => (k.id === kit.id ? kit : k)) : [...prev, kit];
    });
  }, []);

  const deleteBrandKit = useCallback((kitId: string) => {
    setBrandKits((prev) => {
      const next = prev.filter((k) => k.id !== kitId);
      return next.length > 0 ? next : DEFAULT_BRAND_KITS;
    });
  }, []);

  const applyBrandKit = useCallback(
    (
      kit: BrandKit,
      scope: 'all' | 'page' = 'all',
      options?: { stampLogo?: boolean }
    ) => {
      const nextPages = project.pages.map((pg, idx) => {
        if (scope === 'page' && idx !== project.activePageIndex) return pg;
        return rebrandPageWithKit(pg, kit, options);
      });
      commitProject({
        ...project,
        activeBrandKitId: kit.id,
        pages: nextPages,
      });
    },
    [project, commitProject]
  );

  const loadTemplate = useCallback(
    (templateId: string) => {
      const tpl = TEMPLATES.find((t) => t.id === templateId);
      if (!tpl) return;
      const cloned: DocumentProject = JSON.parse(JSON.stringify(tpl.project));
      createNewTab(cloned);
      setIsBackstageOpen(false);
    },
    [createNewTab]
  );

  // Guides
  const addGuide = useCallback(
    (orientation: 'horizontal' | 'vertical', position: number) => {
      const newGuide: PageGuide = {
        id: `guide-${Date.now()}`,
        orientation,
        position,
      };
      const updatedPage = {
        ...activePage,
        guides: [...activePage.guides, newGuide],
      };
      const newPages = project.pages.map((pg, idx) =>
        idx === project.activePageIndex ? updatedPage : pg
      );
      commitProject({ ...project, pages: newPages });
    },
    [project, activePage, commitProject]
  );

  const removeGuide = useCallback(
    (id: string) => {
      const updatedPage = {
        ...activePage,
        guides: activePage.guides.filter((g) => g.id !== id),
      };
      const newPages = project.pages.map((pg, idx) =>
        idx === project.activePageIndex ? updatedPage : pg
      );
      commitProject({ ...project, pages: newPages });
    },
    [project, activePage, commitProject]
  );

  // Multi-Master Page resolution & helpers
  const masterPages: MasterPageDef[] =
    project.masterPages && project.masterPages.length > 0
      ? project.masterPages
      : [
          {
            id: 'master-a',
            name: 'Master A',
            elements: project.masterPage?.elements || [],
          },
        ];
  const activeMaster =
    masterPages.find((m) => m.id === project.activeMasterId) || masterPages[0];
  const activeMasterId = activeMaster.id;

  const getMasterElementsForPage = useCallback(
    (pg: Page): PublisherElement[] => {
      if (pg.hideMaster || project.masterPage?.showOnAllPages === false) return [];
      const found = pg.masterId
        ? masterPages.find((m) => m.id === pg.masterId)
        : masterPages[0];
      return found?.elements || [];
    },
    [masterPages, project.masterPage?.showOnAllPages]
  );

  const addMasterPage = useCallback(
    (name?: string) => {
      const nextNum = masterPages.length + 1;
      const newMaster: MasterPageDef = {
        id: `master-${Date.now()}`,
        name: name?.trim() || `Master ${String.fromCharCode(64 + nextNum)}`,
        elements: [],
      };
      const nextMasters = [...masterPages, newMaster];
      commitProject({
        ...project,
        masterPages: nextMasters,
        activeMasterId: newMaster.id,
        masterPage: {
          elements: nextMasters[0].elements,
          showOnAllPages: project.masterPage?.showOnAllPages ?? true,
        },
      });
      setIsEditingMasterState(true);
      setSelectedElementIds([]);
    },
    [masterPages, project, commitProject]
  );

  const selectMasterPage = useCallback(
    (masterId: string) => {
      if (!masterPages.some((m) => m.id === masterId)) return;
      setProjectState((p) => ({ ...p, activeMasterId: masterId }));
      setIsEditingMasterState(true);
      setSelectedElementIds([]);
    },
    [masterPages]
  );

  const renameMasterPage = useCallback(
    (masterId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const nextMasters = masterPages.map((m) =>
        m.id === masterId ? { ...m, name: trimmed } : m
      );
      commitProject({ ...project, masterPages: nextMasters });
    },
    [masterPages, project, commitProject]
  );

  const deleteMasterPage = useCallback(
    (masterId: string) => {
      if (masterPages.length <= 1) return;
      const nextMasters = masterPages.filter((m) => m.id !== masterId);
      const nextActiveId =
        activeMasterId === masterId ? nextMasters[0].id : activeMasterId;
      commitProject({
        ...project,
        masterPages: nextMasters,
        activeMasterId: nextActiveId,
        pages: project.pages.map((pg) =>
          pg.masterId === masterId ? { ...pg, masterId: nextMasters[0].id } : pg
        ),
        masterPage: {
          elements: nextMasters[0].elements,
          showOnAllPages: project.masterPage?.showOnAllPages ?? true,
        },
      });
    },
    [masterPages, activeMasterId, project, commitProject]
  );

  const assignMasterToPage = useCallback(
    (pageId: string, masterId: string | null) => {
      commitProject({
        ...project,
        pages: project.pages.map((pg) =>
          pg.id === pageId
            ? masterId === null
              ? { ...pg, hideMaster: true }
              : { ...pg, hideMaster: false, masterId }
            : pg
        ),
      });
    },
    [project, commitProject]
  );

  const applyMasterPreset = useCallback(
    (presetId: string) => {
      const presetEls = buildMasterPresetElements(
        presetId,
        activePage.width,
        activePage.height,
        activePage.margins,
        project.name
      );
      const nextMasters = masterPages.map((m) =>
        m.id === activeMasterId ? { ...m, elements: presetEls } : m
      );
      commitProject({
        ...project,
        masterPages: nextMasters,
        activeMasterId,
        masterPage: {
          elements: nextMasters[0].elements,
          showOnAllPages: true,
        },
      });
      setIsEditingMasterState(true);
      setSelectedElementIds([]);
    },
    [activePage, project, masterPages, activeMasterId, commitProject]
  );

  // Helper to get/update elements on either Active Master Page or Active Page
  const currentElements = isEditingMaster
    ? activeMaster.elements
    : activePage.elements;

  const commitCurrentElements = useCallback(
    (nextElements: PublisherElement[]) => {
      // Applying a text style grows the box to hold its paint (see utils/textEffectsFit), so a
      // shadow, glow or extrusion is not clipped by the box that carries it. Running this at
      // the one place element writes land means it covers the ribbon, the panels, the WordArt
      // gallery and the stroke controls alike.
      const projected = nextElements.map((el) => {
        if (el.type !== 'text') return el;
        const before = currentElements.find((prev) => prev.id === el.id) as TextElement | undefined;
        if (!before) return el;
        const record = el as unknown as Record<string, unknown>;
        const previous = before as unknown as Record<string, unknown>;
        const effectsChanged = TEXT_EFFECT_KEYS.some((key) => record[key] !== previous[key]);
        if (!effectsChanged) return el;
        const fit = fitTextBoxToEffects(el);
        return fit ? ({ ...el, ...fit } as PublisherElement) : el;
      });
      nextElements = projected;

      if (isEditingMaster) {
        const nextMasters = masterPages.map((m) =>
          m.id === activeMasterId ? { ...m, elements: nextElements } : m
        );
        commitProject({
          ...project,
          masterPages: nextMasters,
          activeMasterId,
          masterPage: {
            elements: nextMasters[0].elements,
            showOnAllPages: project.masterPage?.showOnAllPages ?? true,
          },
        });
      } else {
        const updatedPage = { ...activePage, elements: nextElements };
        const newPages = project.pages.map((pg, idx) =>
          idx === project.activePageIndex ? updatedPage : pg
        );
        commitProject({ ...project, pages: newPages });
      }
    },
    [isEditingMaster, masterPages, activeMasterId, project, activePage, currentElements, commitProject]
  );

  // Element actions
  const addElement = useCallback(
    (element: PublisherElement) => {
      const maxZ = currentElements.reduce((acc, el) => Math.max(acc, el.zIndex), 0);
      const withZ = { ...element, zIndex: maxZ + 1 };
      commitCurrentElements([...currentElements, withZ]);
      setSelectedElementIds([element.id]);
    },
    [currentElements, commitCurrentElements]
  );

  const addElementsBatch = useCallback(
    (elements: PublisherElement[]) => {
      if (elements.length === 0) return;
      let maxZ = currentElements.reduce((acc, el) => Math.max(acc, el.zIndex), 0);
      const withZ = elements.map((el) => {
        maxZ += 1;
        return { ...el, zIndex: el.zIndex > 0 ? maxZ + el.zIndex - 1 : maxZ };
      });
      commitCurrentElements([...currentElements, ...withZ]);
      setSelectedElementIds(withZ.map((el) => el.id));
    },
    [currentElements, commitCurrentElements]
  );

  const replaceCollageGroup = useCallback(
    (nextElements: PublisherElement[], groupId?: string, elementId?: string) => {
      const remaining = currentElements.filter((el) => {
        if (groupId && el.groupId === groupId) return false;
        if (!groupId && elementId && el.id === elementId) return false;
        return true;
      });
      let maxZ = remaining.reduce((acc, el) => Math.max(acc, el.zIndex), 0);
      const withZ = nextElements.map((el, i) => ({
        ...el,
        zIndex: maxZ + (el.zIndex > 0 ? el.zIndex : i + 1),
      }));
      commitCurrentElements([...remaining, ...withZ]);
      setSelectedElementIds(withZ.map((el) => el.id));
    },
    [currentElements, commitCurrentElements]
  );

  const patchCollageMeta = useCallback(
    (
      groupId: string,
      nextMeta: import('../utils/borderArtStyles').CollageMeta,
      memberIds?: string[]
    ) => {
      const memberIdSet = memberIds?.length ? new Set(memberIds) : null;
      const members = memberIdSet
        ? currentElements.filter((el) => memberIdSet.has(el.id))
        : currentElements.filter((el) => el.groupId === groupId);
      if (members.length === 0) return;

      // The collage's own top-left, never the page centre: a restyle must not move it.
      const originX = Math.min(...members.map((el) => el.x));
      const originY = Math.min(...members.map((el) => el.y));
      const baseZ = Math.min(...members.map((el) => el.zIndex));

      const { elements, pageBackdrop } = buildCollageElements({
        meta: nextMeta,
        originX,
        originY,
        pageWidth: activePage.width,
        pageHeight: activePage.height,
        margins: activePage.margins,
        groupId: groupId || undefined,
        groupSlots: true,
      });

      // Reuse the ids and z-order of the elements being replaced. The builder mints new
      // ids, and a new id is a broken reference: undo restores the previous elements, the
      // selection still points at the new ones, and the toolbar silently empties. Keeping
      // the z values also stops the collage creeping up the stack one patch at a time.
      const pool = new Map<string, PublisherElement[]>();
      members.forEach((member) => {
        const key = member.name ?? '';
        const list = pool.get(key) ?? [];
        list.push(member);
        pool.set(key, list);
      });
      const rebuilt = elements.map((el) => {
        const previous = pool.get(el.name ?? '')?.shift();
        return {
          ...el,
          id: previous?.id ?? el.id,
          zIndex: previous?.zIndex ?? baseZ + el.zIndex,
        };
      });
      const replaced = new Set(members.map((el) => el.id));
      const remaining = currentElements.filter((el) => !replaced.has(el.id));

      if (pageBackdrop) applyPageBackdrop(pageBackdrop);
      commitCurrentElements([...remaining, ...rebuilt]);
      // Reselect the rebuilt group, so the toolbar survives its own click.
      setSelectedElementIds(rebuilt.map((el) => el.id));
    },
    [currentElements, activePage, commitCurrentElements, applyPageBackdrop]
  );

  const updateElement = useCallback(
    (id: string, updates: Partial<PublisherElement>, options?: { transient?: boolean }) => {
      if (isEditingMaster) {
        if (options?.transient) {
          setProjectState((prev) => ({
            ...prev,
            masterPage: {
              ...(prev.masterPage || { showOnAllPages: true, elements: [] }),
              elements: (prev.masterPage?.elements || []).map((el) =>
                el.id === id ? ({ ...el, ...updates } as PublisherElement) : el
              ),
            },
          }));
          return;
        }
        const updated = currentElements.map((el) =>
          el.id === id ? ({ ...el, ...updates } as PublisherElement) : el
        );
        commitCurrentElements(updated);
        return;
      }

      if (options?.transient) {
        setProjectState((prev) => {
          const targetPageIdx = prev.pages.findIndex((pg) =>
            pg.elements.some((el) => el.id === id)
          );
          if (targetPageIdx === -1) return prev;
          const newPages = prev.pages.map((pg, idx) =>
            idx === targetPageIdx
              ? {
                  ...pg,
                  elements: pg.elements.map((el) =>
                    el.id === id ? ({ ...el, ...updates } as PublisherElement) : el
                  ),
                }
              : pg
          );
          return { ...prev, pages: newPages, activePageIndex: targetPageIdx };
        });
        return;
      }

      const targetPageIdx = project.pages.findIndex((pg) =>
        pg.elements.some((el) => el.id === id)
      );
      if (targetPageIdx === -1) return;

      const newPages = project.pages.map((pg, idx) =>
        idx === targetPageIdx
          ? {
              ...pg,
              elements: pg.elements.map((el) =>
                el.id === id ? ({ ...el, ...updates } as PublisherElement) : el
              ),
            }
          : pg
      );
      commitProject({ ...project, pages: newPages, activePageIndex: targetPageIdx });
    },
    [isEditingMaster, currentElements, commitCurrentElements, project, commitProject]
  );

  const updateElementsBatch = useCallback(
    (
      updatesById: Record<string, Partial<PublisherElement>>,
      options?: { transient?: boolean }
    ) => {
      const ids = Object.keys(updatesById);
      if (ids.length === 0) return;

      if (isEditingMaster) {
        if (options?.transient) {
          setProjectState((prev) => ({
            ...prev,
            masterPage: {
              ...(prev.masterPage || { showOnAllPages: true, elements: [] }),
              elements: (prev.masterPage?.elements || []).map((el) =>
                updatesById[el.id] ? ({ ...el, ...updatesById[el.id] } as PublisherElement) : el
              ),
            },
          }));
          return;
        }
        const updated = currentElements.map((el) =>
          updatesById[el.id] ? ({ ...el, ...updatesById[el.id] } as PublisherElement) : el
        );
        commitCurrentElements(updated);
        return;
      }

      if (options?.transient) {
        setProjectState((prev) => {
          const targetPageIdx = prev.pages.findIndex((pg) =>
            pg.elements.some((el) => Boolean(updatesById[el.id]))
          );
          if (targetPageIdx === -1) return prev;
          const newPages = prev.pages.map((pg, idx) =>
            idx === targetPageIdx
              ? {
                  ...pg,
                  elements: pg.elements.map((el) =>
                    updatesById[el.id]
                      ? ({ ...el, ...updatesById[el.id] } as PublisherElement)
                      : el
                  ),
                }
              : pg
          );
          return { ...prev, pages: newPages, activePageIndex: targetPageIdx };
        });
        return;
      }

      const targetPageIdx = project.pages.findIndex((pg) =>
        pg.elements.some((el) => Boolean(updatesById[el.id]))
      );
      if (targetPageIdx === -1) return;

      const newPages = project.pages.map((pg, idx) =>
        idx === targetPageIdx
          ? {
              ...pg,
              elements: pg.elements.map((el) =>
                updatesById[el.id] ? ({ ...el, ...updatesById[el.id] } as PublisherElement) : el
              ),
            }
          : pg
      );
      commitProject({ ...project, pages: newPages, activePageIndex: targetPageIdx });
    },
    [isEditingMaster, currentElements, commitCurrentElements, project, commitProject]
  );

  const updateSelectedElements = useCallback(
    (updates: Partial<PublisherElement>) => {
      if (selectedElementIds.length === 0) return;
      const updated = currentElements.map((el) =>
        selectedElementIds.includes(el.id) ? ({ ...el, ...updates } as PublisherElement) : el
      );
      commitCurrentElements(updated);
    },
    [currentElements, selectedElementIds, commitCurrentElements]
  );

  const deleteSelectedElements = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const updated = currentElements.filter((el) => !selectedElementIds.includes(el.id));
    commitCurrentElements(updated);
    setSelectedElementIds([]);
  }, [currentElements, selectedElementIds, commitCurrentElements]);

  const duplicateSelectedElements = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const duplicated: PublisherElement[] = [];
    const newIds: string[] = [];
    const groupMap = new Map<string, string>();

    currentElements.forEach((el) => {
      if (selectedElementIds.includes(el.id)) {
        const newId = `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        newIds.push(newId);
        let nextGroupId = el.groupId;
        if (el.groupId) {
          if (!groupMap.has(el.groupId)) {
            groupMap.set(el.groupId, `grp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`);
          }
          nextGroupId = groupMap.get(el.groupId);
        }
        duplicated.push({
          ...el,
          id: newId,
          groupId: nextGroupId,
          x: el.x + 20,
          y: el.y + 20,
          zIndex: el.zIndex + 1,
        });
      }
    });

    commitCurrentElements([...currentElements, ...freshCollageIds(duplicated)]);
    setSelectedElementIds(newIds);
  }, [currentElements, selectedElementIds, commitCurrentElements]);

  const copySelectedElements = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const toCopy = currentElements.filter((el) => selectedElementIds.includes(el.id));
    setCopiedElements(JSON.parse(JSON.stringify(toCopy)));
  }, [currentElements, selectedElementIds]);

  const pasteElements = useCallback(() => {
    if (copiedElements.length === 0) return;
    const maxZ = currentElements.reduce((acc, el) => Math.max(acc, el.zIndex), 0);
    const pasted: PublisherElement[] = [];
    const newIds: string[] = [];

    copiedElements.forEach((el, idx) => {
      const newId = `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      newIds.push(newId);
      pasted.push({
        ...el,
        id: newId,
        x: el.x + 24,
        y: el.y + 24,
        zIndex: maxZ + idx + 1,
      });
    });

    commitCurrentElements([...currentElements, ...freshCollageIds(pasted)]);
    setSelectedElementIds(newIds);
  }, [copiedElements, currentElements, commitCurrentElements]);

  const toggleElementLock = useCallback(
    (id: string) => {
      const target = currentElements.find((el) => el.id === id);
      if (!target) return;
      updateElement(id, { locked: !target.locked });
    },
    [currentElements, updateElement]
  );

  const toggleElementVisibility = useCallback(
    (id: string) => {
      const target = currentElements.find((el) => el.id === id);
      if (!target) return;
      updateElement(id, { visible: target.visible === false ? true : false });
    },
    [currentElements, updateElement]
  );

  const setElementsVisibility = useCallback(
    (ids: string[], visible: boolean) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      commitCurrentElements(
        currentElements.map((el) => (idSet.has(el.id) ? { ...el, visible } : el))
      );
    },
    [currentElements, commitCurrentElements]
  );

  const setElementsLocked = useCallback(
    (ids: string[], locked: boolean) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      commitCurrentElements(
        currentElements.map((el) => (idSet.has(el.id) ? { ...el, locked } : el))
      );
    },
    [currentElements, commitCurrentElements]
  );

  const renameElement = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      updateElement(id, { name: trimmed });
    },
    [updateElement]
  );

  const reorderElementLayer = useCallback(
    (draggedId: string, targetId: string) => {
      if (draggedId === targetId) return;
      // Sort top-to-bottom (descending zIndex) matching Layers panel display
      const desc = [...currentElements].sort((a, b) => b.zIndex - a.zIndex);
      const fromIdx = desc.findIndex((el) => el.id === draggedId);
      const toIdx = desc.findIndex((el) => el.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return;

      const [moved] = desc.splice(fromIdx, 1);
      desc.splice(toIdx, 0, moved);

      const total = desc.length;
      const zMap = new Map<string, number>();
      desc.forEach((el, idx) => zMap.set(el.id, total - idx));

      commitCurrentElements(
        currentElements.map((el) => ({
          ...el,
          zIndex: zMap.get(el.id) ?? el.zIndex,
        }))
      );
    },
    [currentElements, commitCurrentElements]
  );

  const selectElement = useCallback(
    (id: string, multiSelect = false) => {
      const target = currentElements.find((el) => el.id === id);
      const groupIds =
        target?.groupId
          ? currentElements.filter((el) => el.groupId === target.groupId).map((el) => el.id)
          : [id];

      setSelectedElementIds((prev) => {
        if (multiSelect) {
          const isAlreadySelected = prev.includes(id);
          if (isAlreadySelected) {
            return prev.filter((item) => !groupIds.includes(item));
          }
          return Array.from(new Set([...prev, ...groupIds]));
        }
        return groupIds;
      });
    },
    [currentElements]
  );

  const selectElements = useCallback(
    (ids: string[], additive = false) => {
      if (ids.length === 0) {
        if (!additive) setSelectedElementIds([]);
        return;
      }
      const groupSet = new Set<string>();
      ids.forEach((id) => {
        groupSet.add(id);
        const target = currentElements.find((el) => el.id === id);
        if (target?.groupId) {
          currentElements
            .filter((el) => el.groupId === target.groupId)
            .forEach((el) => groupSet.add(el.id));
        }
      });
      const expanded = Array.from(groupSet);
      setSelectedElementIds((prev) =>
        additive ? Array.from(new Set([...prev, ...expanded])) : expanded
      );
    },
    [currentElements]
  );

  const groupSelected = useCallback(() => {
    if (selectedElementIds.length < 2) return;
    const newGroupId = `grp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const updated = currentElements.map((el) =>
      selectedElementIds.includes(el.id) ? { ...el, groupId: newGroupId } : el
    );
    commitCurrentElements(updated);
  }, [currentElements, selectedElementIds, commitCurrentElements]);

  const ungroupSelected = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const selectedGroupIds = new Set(
      currentElements
        .filter((el) => selectedElementIds.includes(el.id) && el.groupId)
        .map((el) => el.groupId as string)
    );
    const updated = currentElements.map((el) =>
      selectedElementIds.includes(el.id) || (el.groupId && selectedGroupIds.has(el.groupId))
        ? { ...el, groupId: undefined }
        : el
    );
    commitCurrentElements(updated);
  }, [currentElements, selectedElementIds, commitCurrentElements]);

  const selectAll = useCallback(() => {
    setSelectedElementIds(currentElements.map((el) => el.id));
  }, [currentElements]);

  const clearSelection = useCallback(() => {
    setSelectedElementIds([]);
  }, []);

  // Arrange / Z-Order
  const bringToFront = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const maxZ = currentElements.reduce((acc, el) => Math.max(acc, el.zIndex), 0);
    const updated = currentElements.map((el) =>
      selectedElementIds.includes(el.id) ? { ...el, zIndex: maxZ + 1 } : el
    );
    commitCurrentElements(updated);
  }, [currentElements, selectedElementIds, commitCurrentElements]);

  const sendToBack = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const minZ = currentElements.reduce((acc, el) => Math.min(acc, el.zIndex), 0);
    const updated = currentElements.map((el) =>
      selectedElementIds.includes(el.id) ? { ...el, zIndex: Math.max(0, minZ - 1) } : el
    );
    commitCurrentElements(updated);
  }, [currentElements, selectedElementIds, commitCurrentElements]);

  const bringForward = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const updated = currentElements.map((el) =>
      selectedElementIds.includes(el.id) ? { ...el, zIndex: el.zIndex + 1 } : el
    );
    commitCurrentElements(updated);
  }, [currentElements, selectedElementIds, commitCurrentElements]);

  const sendBackward = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const updated = currentElements.map((el) =>
      selectedElementIds.includes(el.id) ? { ...el, zIndex: Math.max(0, el.zIndex - 1) } : el
    );
    commitCurrentElements(updated);
  }, [currentElements, selectedElementIds, commitCurrentElements]);

  // Alignment
  const alignSelected = useCallback(
    (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      if (selectedElementIds.length === 0) return;

      const selected = activePage.elements.filter((el) => selectedElementIds.includes(el.id));
      if (selected.length === 0) return;

      // If single element selected, align relative to page margins or page bounds!
      if (selected.length === 1) {
        const el = selected[0];
        let newX = el.x;
        let newY = el.y;

        if (alignment === 'left') newX = activePage.margins.left;
        else if (alignment === 'center') newX = (activePage.width - el.width) / 2;
        else if (alignment === 'right') newX = activePage.width - activePage.margins.right - el.width;
        else if (alignment === 'top') newY = activePage.margins.top;
        else if (alignment === 'middle') newY = (activePage.height - el.height) / 2;
        else if (alignment === 'bottom') newY = activePage.height - activePage.margins.bottom - el.height;

        updateElement(el.id, { x: newX, y: newY });
        return;
      }

      // If multiple elements selected, align relative to their bounding box
      const minX = Math.min(...selected.map((el) => el.x));
      const maxX = Math.max(...selected.map((el) => el.x + el.width));
      const minY = Math.min(...selected.map((el) => el.y));
      const maxY = Math.max(...selected.map((el) => el.y + el.height));
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const updated = activePage.elements.map((el) => {
        if (!selectedElementIds.includes(el.id)) return el;
        if (alignment === 'left') return { ...el, x: minX };
        if (alignment === 'center') return { ...el, x: centerX - el.width / 2 };
        if (alignment === 'right') return { ...el, x: maxX - el.width };
        if (alignment === 'top') return { ...el, y: minY };
        if (alignment === 'middle') return { ...el, y: centerY - el.height / 2 };
        if (alignment === 'bottom') return { ...el, y: maxY - el.height };
        return el;
      });

      const newPages = project.pages.map((pg, idx) =>
        idx === project.activePageIndex ? { ...pg, elements: updated } : pg
      );
      commitProject({ ...project, pages: newPages });
    },
    [project, activePage, selectedElementIds, commitProject, updateElement]
  );

  const distributeSelected = useCallback(
    (axis: 'horizontal' | 'vertical') => {
      const selected = activePage.elements.filter((el) => selectedElementIds.includes(el.id));
      if (selected.length < 3) return;

      if (axis === 'horizontal') {
        const sorted = [...selected].sort((a, b) => a.x - b.x);
        const minX = sorted[0].x;
        const last = sorted[sorted.length - 1];
        const maxX = last.x + last.width;
        const totalElementsWidth = sorted.reduce((sum, el) => sum + el.width, 0);
        const gap = (maxX - minX - totalElementsWidth) / (sorted.length - 1);

        let currentX = minX;
        const idToX: Record<string, number> = {};
        sorted.forEach((el) => {
          idToX[el.id] = currentX;
          currentX += el.width + gap;
        });

        const updated = activePage.elements.map((el) =>
          idToX[el.id] !== undefined ? { ...el, x: idToX[el.id] } : el
        );
        const newPages = project.pages.map((pg, idx) =>
          idx === project.activePageIndex ? { ...pg, elements: updated } : pg
        );
        commitProject({ ...project, pages: newPages });
      } else {
        const sorted = [...selected].sort((a, b) => a.y - b.y);
        const minY = sorted[0].y;
        const last = sorted[sorted.length - 1];
        const maxY = last.y + last.height;
        const totalElementsHeight = sorted.reduce((sum, el) => sum + el.height, 0);
        const gap = (maxY - minY - totalElementsHeight) / (sorted.length - 1);

        let currentY = minY;
        const idToY: Record<string, number> = {};
        sorted.forEach((el) => {
          idToY[el.id] = currentY;
          currentY += el.height + gap;
        });

        const updated = activePage.elements.map((el) =>
          idToY[el.id] !== undefined ? { ...el, y: idToY[el.id] } : el
        );
        const newPages = project.pages.map((pg, idx) =>
          idx === project.activePageIndex ? { ...pg, elements: updated } : pg
        );
        commitProject({ ...project, pages: newPages });
      }
    },
    [project, activePage, selectedElementIds, commitProject]
  );

  // Quick factory helpers
  const addTextBox = useCallback(
    (options?: Partial<TextElement>) => {
      const defaultText: TextElement = {
        id: `txt-${Date.now()}`,
        type: 'text',
        x: activePage.margins.left + 50,
        y: activePage.margins.top + 50,
        width: 320,
        height: 120,
        rotation: 0,
        zIndex: 10,
        text: 'Click here and enter your publication text. Customize font, size, columns and styles from the ribbon above.',
        fontFamily: 'Segoe UI',
        fontSize: 16,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#1e293b',
        textAlign: 'left',
        verticalAlign: 'top',
        columns: 1,
        columnGap: 12,
        lineHeight: 1.4,
        padding: 8,
        // Text behaves like type: no clipped words, ever.
        autoFit: 'shrink',
        autoSizeText: true,
        ...options,
      };
      addElement(defaultText);
    },
    [activePage, addElement]
  );

  const activeScheme = COLOR_SCHEMES.find((s) => s.id === project.colorScheme) || COLOR_SCHEMES[0];

  const addShape = useCallback(
    (shapeType: ShapeType, options?: Partial<ShapeElement>) => {
      const defaultShape: ShapeElement = {
        id: `shp-${Date.now()}`,
        type: 'shape',
        shapeType,
        x: activePage.margins.left + 60,
        y: activePage.margins.top + 60,
        width: 160,
        height: 120,
        rotation: 0,
        zIndex: 5,
        fillColor: activeScheme.primary,
        strokeColor: activeScheme.dark,
        strokeWidth: 2,
        cornerRadius: shapeType === 'rounded-rect' ? 12 : 0,
        ...options,
      };
      addElement(defaultShape);
    },
    [activePage, activeScheme, addElement]
  );

  const addImage = useCallback(
    (src: string, options?: Partial<ImageElement>) => {
      const defaultImg: ImageElement = {
        id: `img-${Date.now()}`,
        type: 'image',
        src,
        x: activePage.margins.left + 40,
        y: activePage.margins.top + 40,
        width: 260,
        height: 180,
        rotation: 0,
        zIndex: 8,
        aspectRatioLocked: true,
        borderColor: '#cbd5e1',
        // Clip art, logos and photos arrive without a frame; a border is only
        // drawn once the user asks for one in Format → Border.
        borderWidth: 0,
        maskShape: 'none',
        ...options,
      };
      addElement(defaultImg);
    },
    [activePage, addElement]
  );

  const addPicturePlaceholder = useCallback(
    (options?: Partial<ImageElement>) => {
      const placeholderImg: ImageElement = {
        id: `ph-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'image',
        name: 'Picture Placeholder',
        src: '',
        x: activePage.margins.left + 40,
        y: activePage.margins.top + 40,
        width: 240,
        height: 180,
        rotation: 0,
        zIndex: 8,
        objectFit: 'cover',
        aspectRatioLocked: true,
        borderRadius: 8,
        maskShape: 'none',
        ...options,
      };
      addElement(placeholderImg);
    },
    [activePage, addElement]
  );

  const fillPlaceholderFromImageElement = useCallback(
    (sourceId: string, targetPlaceholderId: string) => {
      const sourceEl = currentElements.find(
        (el): el is ImageElement => el.id === sourceId && el.type === 'image'
      );
      const targetEl = currentElements.find(
        (el): el is ImageElement => el.id === targetPlaceholderId && el.type === 'image'
      );
      if (!sourceEl || !targetEl || !sourceEl.src || sourceEl.id === targetEl.id) return;

      const nextName =
        !targetEl.name || targetEl.name === 'Picture Placeholder'
          ? sourceEl.name || targetEl.name
          : targetEl.name;

      const updated = currentElements
        .filter((el) => el.id !== sourceId)
        .map((el) =>
          el.id === targetPlaceholderId
            ? ({
                ...el,
                src: sourceEl.src,
                name: nextName,
              } as PublisherElement)
            : el
        );

      commitCurrentElements(updated);
      setSelectedElementIds([targetPlaceholderId]);
    },
    [currentElements, commitCurrentElements]
  );

  const detachImageFromPlaceholder = useCallback(
    (elementId: string) => {
      const targetEl = currentElements.find(
        (el): el is ImageElement => el.id === elementId && el.type === 'image'
      );
      if (!targetEl || !targetEl.src) return;

      const maxZ = currentElements.reduce((m, e) => Math.max(m, e.zIndex), 0);
      const detachedId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const detachedEl: ImageElement = {
        ...targetEl,
        id: detachedId,
        name: targetEl.name && targetEl.name !== 'Picture Placeholder' ? targetEl.name : 'Detached Image',
        x: Math.min(activePage.width - 60, targetEl.x + 24),
        y: Math.min(activePage.height - 60, targetEl.y + 24),
        zIndex: maxZ + 1,
        borderArt: 'none',
        borderWidth: 0,
        maskShape: 'none',
        objectFit: 'contain',
      };

      const updated = currentElements.map((el) =>
        el.id === elementId
          ? ({
              ...el,
              src: '',
              originalSrc: undefined,
              bgRemoved: false,
              name: 'Picture Placeholder',
            } as PublisherElement)
          : el
      );

      commitCurrentElements([...updated, detachedEl]);
      setSelectedElementIds([detachedId]);
    },
    [currentElements, activePage, commitCurrentElements]
  );

  const addTable = useCallback(
    (rows: number, cols: number, options?: Partial<TableElement>) => {
      const data: string[][] = [];
      for (let r = 0; r < rows; r++) {
        const row: string[] = [];
        for (let c = 0; c < cols; c++) {
          row.push(r === 0 ? `Header ${c + 1}` : `Data ${r},${c + 1}`);
        }
        data.push(row);
      }
      const defaultTable: TableElement = {
        id: `tbl-${Date.now()}`,
        type: 'table',
        x: activePage.margins.left + 30,
        y: activePage.margins.top + 30,
        width: 420,
        height: rows * 36,
        rotation: 0,
        zIndex: 9,
        rows,
        cols,
        data,
        themeId: 'indigo-office',
        headerBg: activeScheme.primary,
        headerColor: '#ffffff',
        cellBg: '#ffffff',
        altRowBg: activeScheme.light,
        cellColor: '#1e293b',
        borderColor: activeScheme.secondary,
        borderWidth: 1,
        bandedRows: true,
        showHeaderRow: true,
        ...options,
      };
      addElement(defaultTable);
    },
    [activePage, activeScheme, addElement]
  );

  const addAccent = useCallback(
    (accentType: AccentElement['accentType'], options?: Partial<AccentElement>) => {
      const defaultAccent: AccentElement = {
        id: `acc-${Date.now()}`,
        type: 'accent',
        accentType,
        x: activePage.margins.left + 40,
        y: activePage.margins.top + 80,
        width: accentType === 'coupon' ? 320 : 400,
        height: accentType === 'coupon' ? 180 : 100,
        rotation: 0,
        zIndex: 10,
        title: accentType === 'coupon' ? 'SPECIAL SAVINGS COUPON' : 'PULL QUOTE HIGHLIGHT',
        subtitle: accentType === 'coupon' ? 'Save 25% on your next order' : '— Publication Editor',
        text: 'This is an authentic MS Publisher style accent building block for highlights, coupons and mastheads.',
        badgeText: 'LIMITED EDITION',
        accentColor: activeScheme.primary,
        ...options,
      };
      addElement(defaultAccent);
    },
    [activePage, activeScheme, addElement]
  );

  const addLine = useCallback(
    (options?: Partial<LineElement>) => {
      const defaultLine: LineElement = {
        id: `line-${Date.now()}`,
        type: 'line',
        x: activePage.margins.left + 50,
        y: activePage.margins.top + 100,
        width: 300,
        height: 2,
        rotation: 0,
        zIndex: 6,
        strokeColor: activeScheme.primary,
        strokeWidth: 2,
        strokeDash: 'solid',
        ...options,
      };
      addElement(defaultLine);
    },
    [activePage, activeScheme, addElement]
  );

  const addQRCode = useCallback(
    (value = 'https://example.com', options?: Partial<QRElement>) => {
      const defaultQR: QRElement = {
        id: `qr-${Date.now()}`,
        type: 'qr',
        name: 'QR Code',
        x: activePage.margins.left + 60,
        y: activePage.margins.top + 60,
        width: 140,
        height: 140,
        rotation: 0,
        zIndex: 10,
        value,
        fgColor: '#0f172a',
        bgColor: '#ffffff',
        ...options,
      };
      addElement(defaultQR);
    },
    [activePage, addElement]
  );

  const addPageNumberToken = useCallback(() => {
    addTextBox({
      name: 'Page Number',
      text: 'Page {{PageNumber}} of {{TotalPages}}',
      x: activePage.width / 2 - 80,
      y: activePage.height - activePage.margins.bottom - 30,
      width: 160,
      height: 30,
      fontSize: 11,
      color: '#64748b',
      textAlign: 'center',
      fontWeight: '600',
    });
  }, [activePage, addTextBox]);

  // Merge 2+ selected shapes (Union, Combine, Subtract, Intersect)
  const mergeSelectedShapes = useCallback(
    (op: 'union' | 'combine' | 'subtract' | 'intersect') => {
      const shapes = currentElements.filter(
        (el): el is ShapeElement =>
          selectedElementIds.includes(el.id) && el.type === 'shape'
      );
      if (shapes.length < 2) return;

      const minX = Math.min(...shapes.map((s) => s.x));
      const minY = Math.min(...shapes.map((s) => s.y));
      const maxX = Math.max(...shapes.map((s) => s.x + s.width));
      const maxY = Math.max(...shapes.map((s) => s.y + s.height));

      const base = shapes[0];
      const mergedParts = shapes.flatMap((s) =>
        s.shapeType === 'merged' && (s.mergedPath || s.mergedParts)
          ? s.mergedPath
            ? [
                {
                  d: s.mergedPath,
                  x: s.x - minX,
                  y: s.y - minY,
                  width: s.width,
                  height: s.height,
                  rotation: s.rotation || 0,
                  // the path is stored in the frame it was generated for
                  scaleX: s.width / (s.mergedBaseWidth || s.width || 1),
                  scaleY: s.height / (s.mergedBaseHeight || s.height || 1),
                },
              ]
            : (s.mergedParts || []).map((p) => ({
                ...p,
                x: p.x + (s.x - minX),
                y: p.y + (s.y - minY),
              }))
          : [buildMergedPartFromShape(s, minX, minY)]
      );

      // One real path: true union / subtract / intersect instead of a mask.
      const mergedPath = mergeShapeGeometry(mergedParts, op) ?? undefined;

      const mergedShape: ShapeElement = {
        id: `shp-merged-${Date.now()}`,
        type: 'shape',
        name: `Merged (${op})`,
        shapeType: 'merged',
        x: Math.round(minX),
        y: Math.round(minY),
        width: Math.max(20, Math.round(maxX - minX)),
        height: Math.max(20, Math.round(maxY - minY)),
        rotation: 0,
        zIndex: Math.max(...shapes.map((s) => s.zIndex)),
        fillColor: base.fillColor,
        fillType: base.fillType,
        gradientColor2: base.gradientColor2,
        gradientAngle: base.gradientAngle,
        strokeColor: base.strokeColor,
        strokeWidth: base.strokeWidth,
        strokeDash: base.strokeDash,
        shadow: base.shadow,
        glow: base.glow,
        glowColor: base.glowColor,
        glowSize: base.glowSize,
        mergeOp: op,
        mergedPath,
        mergedBaseWidth: mergedPath ? Math.max(20, Math.round(maxX - minX)) : undefined,
        mergedBaseHeight: mergedPath ? Math.max(20, Math.round(maxY - minY)) : undefined,
        mergedParts,
      };

      const remaining = currentElements.filter(
        (el) => !shapes.some((s) => s.id === el.id)
      );
      commitCurrentElements([...remaining, mergedShape]);
      setSelectedElementIds([mergedShape.id]);
    },
    [currentElements, selectedElementIds, commitCurrentElements]
  );

  // Clip the selected content to a shape's boundary (image or shape content)
  const clipToShape = useCallback(() => {
    const selected = currentElements.filter((el) => selectedElementIds.includes(el.id));
    const shapes = selected.filter((el): el is ShapeElement => el.type === 'shape');
    if (shapes.length === 0) return;

    // The bottom-most selected shape is the frame; everything else is content.
    const frame = shapes[0];
    const content = selected.filter((el) => el.id !== frame.id);
    if (content.length === 0) return;

    const updates: Record<string, Partial<PublisherElement>> = {};
    const frameUnrotated = shapeOutlineRings({ ...frame, rotation: 0 });
    const frameLocalPath = ringsToPath(frameUnrotated, frame.x, frame.y);
    const framePageRings = shapeOutlineRings(frame);

    for (const el of content) {
      if (el.type === 'image') {
        // The image adopts the frame: same box, same angle, clipped to it.
        updates[el.id] = {
          x: frame.x,
          y: frame.y,
          width: frame.width,
          height: frame.height,
          rotation: frame.rotation || 0,
          clipPathD: frameLocalPath,
          clipBaseWidth: frame.width,
          clipBaseHeight: frame.height,
          maskShape: 'none',
          zIndex: (frame.zIndex || 0) + 0.5,
        };
      } else if (el.type === 'shape') {
        // Shapes keep their place; the frame is expressed in their local space.
        updates[el.id] = {
          clipPathD: pageRingsToLocal(framePageRings, el),
          clipBaseWidth: el.width,
          clipBaseHeight: el.height,
        };
      }
    }

    if (Object.keys(updates).length > 0) updateElementsBatch(updates);
  }, [currentElements, selectedElementIds, updateElementsBatch]);

  // Auto-connect 2+ selected elements (or update existing connector style without duplicating)
  const autoConnectSelectedShapes = useCallback(
    (style: 'straight' | 'elbow' | 'curved' = 'elbow') => {
      const selected = currentElements.filter(
        (el) => selectedElementIds.includes(el.id) && el.type !== 'connector'
      );
      if (selected.length < 2) return;

      // Sort left-to-right / top-to-bottom for natural diagram flow
      const ordered = [...selected].sort((a, b) =>
        Math.abs(a.x - b.x) > 40 ? a.x - b.x : a.y - b.y
      );

      let nextElements = [...currentElements];
      let maxZ = nextElements.reduce((acc, el) => Math.max(acc, el.zIndex), 0);
      const newConnectors: ConnectorElement[] = [];

      for (let i = 0; i < ordered.length - 1; i++) {
        const fromEl = ordered[i];
        const toEl = ordered[i + 1];

        const existingIdx = nextElements.findIndex(
          (el) =>
            el.type === 'connector' &&
            ((el.fromId === fromEl.id && el.toId === toEl.id) ||
              (el.fromId === toEl.id && el.toId === fromEl.id))
        );

        if (existingIdx !== -1) {
          const existing = nextElements[existingIdx] as ConnectorElement;
          nextElements[existingIdx] = {
            ...existing,
            connectorStyle: style,
          };
        } else {
          maxZ += 1;
          newConnectors.push({
            id: `conn-${Date.now()}-${i}`,
            type: 'connector',
            name: `Connector ${i + 1}`,
            fromId: fromEl.id,
            toId: toEl.id,
            connectorStyle: style,
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            rotation: 0,
            zIndex: maxZ,
            strokeColor: activeScheme.primary,
            strokeWidth: 2.5,
            strokeDash: 'solid',
            arrowEnd: true,
          });
        }
      }

      commitCurrentElements([...nextElements, ...newConnectors]);
    },
    [currentElements, selectedElementIds, activeScheme, commitCurrentElements]
  );

  const disconnectSelectedShapes = useCallback(() => {
    if (selectedElementIds.length < 2) return;
    const idSet = new Set(selectedElementIds);
    const updated = currentElements.filter(
      (el) => !(el.type === 'connector' && idSet.has(el.fromId) && idSet.has(el.toId))
    );
    if (updated.length !== currentElements.length) {
      commitCurrentElements(updated);
    }
  }, [currentElements, selectedElementIds, commitCurrentElements]);

  // Spawn a connected next-step diagram node from the currently selected element
  const addConnectedDiagramStep = useCallback(
    (style: 'straight' | 'elbow' | 'curved' = 'elbow') => {
      if (selectedElementIds.length !== 1) return;
      const source = currentElements.find((el) => el.id === selectedElementIds[0]);
      if (!source || source.type === 'connector') return;

      const maxZ = currentElements.reduce((acc, el) => Math.max(acc, el.zIndex), 0);
      const nextShape: ShapeElement = {
        id: `shp-${Date.now()}`,
        type: 'shape',
        name: 'Diagram Step',
        shapeType: source.type === 'shape' ? source.shapeType : 'rounded-rect',
        x: Math.round(source.x + source.width + 70),
        y: Math.round(source.y),
        width: source.width,
        height: source.height,
        rotation: 0,
        zIndex: maxZ + 1,
        fillColor: source.type === 'shape' ? source.fillColor : activeScheme.primary,
        strokeColor: source.type === 'shape' ? source.strokeColor : activeScheme.dark,
        strokeWidth: 2,
        cornerRadius: 12,
        label: 'Next Step',
        labelColor: '#ffffff',
      };

      const connector: ConnectorElement = {
        id: `conn-${Date.now()}`,
        type: 'connector',
        name: 'Diagram Connector',
        fromId: source.id,
        toId: nextShape.id,
        connectorStyle: style,
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        rotation: 0,
        zIndex: maxZ + 2,
        strokeColor: activeScheme.primary,
        strokeWidth: 2.5,
        strokeDash: 'solid',
        arrowEnd: true,
      };

      commitCurrentElements([...currentElements, nextShape, connector]);
      setSelectedElementIds([nextShape.id]);
    },
    [selectedElementIds, currentElements, activeScheme, commitCurrentElements]
  );

  // Zoom
  const setZoom = useCallback((newZoom: number) => {
    setZoomState(Math.min(3.0, Math.max(0.2, newZoom)));
  }, []);

  const zoomIn = useCallback(() => {
    setZoomState((z) => Math.min(3.0, Number((z + 0.1).toFixed(2))));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomState((z) => Math.max(0.2, Number((z - 0.1).toFixed(2))));
  }, []);

  const zoom100 = useCallback(() => {
    setZoomState(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomFit = useCallback(() => {
    // Measure the real canvas viewport (falls back to window math when the
    // workspace has not mounted yet, e.g. during first paint).
    const viewport = document.querySelector('[data-canvas-viewport]') as HTMLElement | null;
    const containerW = viewport?.clientWidth || window.innerWidth - 380;
    const containerH = viewport?.clientHeight || window.innerHeight - 240;

    // Reserve room for rulers (~24px), page drop shadow and the floating
    // zoom toolbar so the artboard is always fully framed.
    const padX = 72;
    const padY = 96;
    const scaleX = (containerW - padX) / activePage.width;
    const scaleY = (containerH - padY) / activePage.height;
    const fitScale = Math.min(scaleX, scaleY, 1.2);
    // A page without a measurable size produced NaN here, and a NaN zoom draws nothing.
    const safeScale = Number.isFinite(fitScale) ? fitScale : 1;
    setZoomState(Number(Math.min(3.0, Math.max(0.2, safeScale)).toFixed(2)));
    setPan({ x: 0, y: 0 });
  }, [activePage]);

  const handleResetWorkspace = useCallback(async () => {
    restoreAbandonedRef.current = true;
    await clearWorkspaceStorage({ resetCaches: true });
    const freshTabs = defaultWorkspace();
    tabHistoriesRef.current = {};
    setWorkspaceTabs(freshTabs);
    setActiveTabId(freshTabs[0].id);
    setProjectState(freshTabs[0].project);
    setHistoryPast([]);
    setHistoryFuture([]);
    setIsRestoring(false);
  }, []);

  // Hold the editor back until the real document is in memory, so nobody sees
  // (or exports) the default template while IndexedDB is still answering.
  if (isRestoring) {
    return <WorkspaceRestoreSplash onReset={handleResetWorkspace} />;
  }

  return (
    <PublisherContext.Provider
      value={{
        project,
        activePage,
        selectedElementIds,
        zoom,
        pan,
        activeTab,
        workspaceMode,
        theme,
        isBackstageOpen,
        backstageSection,
        setBackstageSection,
        isMailMergeOpen,
        isWordArtModalOpen,
        isBuildingBlocksModalOpen,
        isAIImageModalOpen,
        isStockArtPanelOpen,
        isCollageModalOpen,
        editingCollageState,
        isBrandBoardModalOpen,
        isBrandKitModalOpen,
        brandKits,
        activeBrandKit,
        rulerVisible,
        guidesVisible,
        gridVisible,
        snapToGuides,
        snapToGrid,
        canUndo: historyPast.length > 0,
        canRedo: historyFuture.length > 0,
        isEditingMaster,
        hasClipboard: copiedElements.length > 0,
        viewMode,
        toolMode,
        isLeftPanelOpen,
        isRightPanelOpen,
        rightPanelTab,

        setViewMode,
        setToolMode,
        setIsLeftPanelOpen,
        setIsRightPanelOpen,
        setRightPanelTab,
        applyDesignRecommendation: (recommendedPage: Page) => {
          const updatedPages = project.pages.map((pg, idx) =>
            idx === project.activePageIndex
              ? {
                  ...pg,
                  elements: JSON.parse(JSON.stringify(recommendedPage.elements)),
                  backgroundColor: recommendedPage.backgroundColor,
                  backgroundGradient: recommendedPage.backgroundGradient,
                  backgroundPattern: recommendedPage.backgroundPattern,
                }
              : pg
          );
          commitProject({ ...project, pages: updatedPages });
          setSelectedElementIds([]);
        },
        setIsEditingMaster,
        toggleMasterPageVisibility,
        masterPages,
        activeMasterId,
        getMasterElementsForPage,
        addMasterPage,
        selectMasterPage,
        renameMasterPage,
        deleteMasterPage,
        assignMasterToPage,
        applyMasterPreset,
        reorderPage,
        renamePage,
        addBookletSpread,
        padToBookletMultiple,
        setActiveTab,
        setWorkspaceMode,
        toggleWorkspaceMode,
        setTheme,
        toggleTheme,
        setIsBackstageOpen,
        openBackstage,
        setIsMailMergeOpen,
        setIsWordArtModalOpen,
        setIsBuildingBlocksModalOpen,
        setIsAIImageModalOpen,
        setIsStockArtPanelOpen,
        setIsCollageModalOpen,
        openCollageEditor,
        replaceCollageGroup,
        patchCollageMeta,
        collageControlSection,
        openCollageControl,
        closeCollageControl,
        textControlSection,
        openTextControl,
        closeTextControl,
        setIsBrandBoardModalOpen,
        setIsBrandKitModalOpen,
        saveBrandKit,
        deleteBrandKit,
        applyBrandKit,
        setRulerVisible,
        setGuidesVisible,
        setGridVisible,
        setSnapToGuides,
        setSnapToGrid,

        undo,
        redo,

        workspaceTabs,
        activeTabId,
        switchWorkspaceTab,
        createNewTab,
        closeWorkspaceTab,
        renameWorkspaceTab,
        duplicateWorkspaceTab,
        moveWorkspaceTab,
        setWorkspaceTabColor,
        setProject,
        setActivePageIndex,
        addPage,
        duplicateActivePage,
        deleteActivePage,
        deletePageById,
        generateBrandBoardSizes,
        setPageSize,
        setPageOrientation,
        updatePagePosition,
        setPageMargins,
        setPageBackgroundColor,
        setPageBackgroundGradient,
        setPageBackgroundPattern,
        applyPageBackdrop,
        setColorScheme,
        loadTemplate,

        addGuide,
        removeGuide,

        addElement,
        addElementsBatch,
        updateElement,
        updateElementsBatch,
        beginInteraction,
        endInteraction,
        updateSelectedElements,
        deleteSelectedElements,
        duplicateSelectedElements,
        copySelectedElements,
        pasteElements,
        toggleElementLock,
        toggleElementVisibility,
        setElementsVisibility,
        setElementsLocked,
        renameElement,
        reorderElementLayer,
        selectElement,
        selectElements,
        selectAll,
        clearSelection,
        bringForward,
        sendBackward,
        bringToFront,
        sendToBack,
        alignSelected,
        distributeSelected,
        groupSelected,
        ungroupSelected,
        mergeSelectedShapes,
        autoConnectSelectedShapes,
        disconnectSelectedShapes,
        addConnectedDiagramStep,

        addTextBox,
    clipToShape,
        addShape,
        addImage,
        addPicturePlaceholder,
        fillPlaceholderFromImageElement,
        detachImageFromPlaceholder,
        addTable,
        addAccent,
        addLine,
        addQRCode,
        addPageNumberToken,

        setZoom,
        setPan,
        zoomIn,
        zoomOut,
        zoomFit,
        zoom100,
        tarpapelOverlayVisible,
        setTarpapelOverlayVisible,
        printSettings,
        setPrintSettings,
        matchPageToTarpapelRatio: () => {
          const m = computeTarpapelMetrics(activePage, printSettings);
          const targetRatio = m.totalPosterWIn / Math.max(0.1, m.totalPosterHIn);
          const baseW = activePage.width;
          const nextH = Math.max(200, Math.round(baseW / targetRatio));
          const updatedPages = project.pages.map((pg, idx) =>
            idx === project.activePageIndex
              ? {
                  ...pg,
                  width: baseW,
                  height: nextH,
                  orientation: (baseW > nextH ? 'landscape' : 'portrait') as 'portrait' | 'landscape',
                  elements: reflowElementsForSize(
                    pg.elements,
                    pg.width,
                    pg.height,
                    baseW,
                    nextH,
                    pg.margins
                  ),
                }
              : pg
          );
          commitProject({ ...project, pages: updatedPages });
        },
      }}
    >
      {children}
    </PublisherContext.Provider>
  );
};

export const usePublisher = () => {
  const context = useContext(PublisherContext);
  if (!context) {
    throw new Error('usePublisher must be used within a PublisherProvider');
  }
  return context;
};
