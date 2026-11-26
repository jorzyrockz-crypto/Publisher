import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  DocumentProject,
  Page,
  PublisherElement,
  PageMargins,
  PageGuide,
  TextElement,
  ShapeElement,
  ImageElement,
  TableElement,
  AccentElement,
  LineElement,
  QRElement,
  ConnectorElement,
  ShapeType,
} from '../types/publisher';
import { buildMergedPartFromShape } from '../utils/shapePaths';
import { TEMPLATES } from '../constants/templates';
import { PAGE_SIZES } from '../constants/pageSizes';
import { COLOR_SCHEMES } from '../constants/colorSchemes';

interface PublisherContextType {
  project: DocumentProject;
  activePage: Page;
  selectedElementIds: string[];
  zoom: number;
  pan: { x: number; y: number };
  activeTab: 'home' | 'insert' | 'page-design' | 'mailings' | 'view';
  isBackstageOpen: boolean;
  isMailMergeOpen: boolean;
  isWordArtModalOpen: boolean;
  isBuildingBlocksModalOpen: boolean;
  rulerVisible: boolean;
  guidesVisible: boolean;
  gridVisible: boolean;
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

  // Setters & UI controls
  setViewMode: (mode: 'artboard' | 'single' | 'continuous' | 'spread') => void;
  setToolMode: (mode: 'select' | 'pan') => void;
  setIsLeftPanelOpen: (open: boolean) => void;
  setIsRightPanelOpen: (open: boolean) => void;
  setIsEditingMaster: (editing: boolean) => void;
  toggleMasterPageVisibility: () => void;
  setActiveTab: (tab: 'home' | 'insert' | 'page-design' | 'mailings' | 'view') => void;
  setIsBackstageOpen: (open: boolean) => void;
  setIsMailMergeOpen: (open: boolean) => void;
  setIsWordArtModalOpen: (open: boolean) => void;
  setIsBuildingBlocksModalOpen: (open: boolean) => void;
  setRulerVisible: (visible: boolean) => void;
  setGuidesVisible: (visible: boolean) => void;
  setGridVisible: (visible: boolean) => void;
  setSnapToGuides: (snap: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;

  // History
  undo: () => void;
  redo: () => void;

  // Document & Page actions
  setProject: (newProject: DocumentProject) => void;
  setActivePageIndex: (index: number) => void;
  addPage: () => void;
  duplicateActivePage: () => void;
  deleteActivePage: () => void;
  setPageSize: (sizeName: string) => void;
  setPageOrientation: (orientation: 'portrait' | 'landscape') => void;
  updatePagePosition: (pageIndex: number, x: number, y: number) => void;
  setPageMargins: (margins: PageMargins) => void;
  setPageBackgroundColor: (color: string) => void;
  setColorScheme: (schemeId: string) => void;
  loadTemplate: (templateId: string) => void;

  // Guides
  addGuide: (orientation: 'horizontal' | 'vertical', position: number) => void;
  removeGuide: (id: string) => void;

  // Element actions
  addElement: (element: PublisherElement) => void;
  updateElement: (id: string, updates: Partial<PublisherElement>) => void;
  updateSelectedElements: (updates: Partial<PublisherElement>) => void;
  deleteSelectedElements: () => void;
  duplicateSelectedElements: () => void;
  copySelectedElements: () => void;
  pasteElements: () => void;
  toggleElementLock: (id: string) => void;
  toggleElementVisibility: (id: string) => void;
  selectElement: (id: string, multiSelect?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  alignSelected: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeSelected: (axis: 'horizontal' | 'vertical') => void;
  mergeSelectedShapes: (op: 'union' | 'combine' | 'subtract' | 'intersect') => void;
  autoConnectSelectedShapes: (style?: 'straight' | 'elbow' | 'curved') => void;
  addConnectedDiagramStep: (style?: 'straight' | 'elbow' | 'curved') => void;

  // Quick factory helpers
  addTextBox: (options?: Partial<TextElement>) => void;
  addShape: (shapeType: ShapeType, options?: Partial<ShapeElement>) => void;
  addImage: (src: string, options?: Partial<ImageElement>) => void;
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

const PublisherContext = createContext<PublisherContextType | null>(null);

const AUTOSAVE_KEY = 'ms_publisher_clone_autosave_v1';

export const PublisherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage autosave if available, otherwise default to Corporate Trifold Brochure
  const [project, setProjectState] = useState<DocumentProject>(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return JSON.parse(JSON.stringify(TEMPLATES[0].project));
  });

  // Auto-save project to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(project));
    } catch {
      // ignore quota errors
    }
  }, [project]);

  const [historyPast, setHistoryPast] = useState<DocumentProject[]>([]);
  const [historyFuture, setHistoryFuture] = useState<DocumentProject[]>([]);

  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [copiedElements, setCopiedElements] = useState<PublisherElement[]>([]);
  const [isEditingMaster, setIsEditingMasterState] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'artboard' | 'single' | 'continuous' | 'spread'>('artboard');
  const [toolMode, setToolMode] = useState<'select' | 'pan'>('select');
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [zoom, setZoomState] = useState<number>(0.8);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [activeTab, setActiveTab] = useState<'home' | 'insert' | 'page-design' | 'mailings' | 'view'>('home');
  const [isBackstageOpen, setIsBackstageOpen] = useState(false);
  const [isMailMergeOpen, setIsMailMergeOpen] = useState(false);
  const [isWordArtModalOpen, setIsWordArtModalOpen] = useState(false);
  const [isBuildingBlocksModalOpen, setIsBuildingBlocksModalOpen] = useState(false);

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

  const setPageSize = useCallback(
    (sizeName: string) => {
      const def = PAGE_SIZES.find((s) => s.name === sizeName);
      if (!def) return;
      const newPages = project.pages.map((pg, idx) =>
        idx === project.activePageIndex
          ? {
              ...pg,
              width: def.width,
              height: def.height,
              orientation: (def.width > def.height ? 'landscape' : 'portrait') as
                | 'portrait'
                | 'landscape',
            }
          : pg
      );
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
        };
      });
      commitProject({
        ...project,
        pages: newPages,
      });
    },
    [project, commitProject]
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

  const loadTemplate = useCallback(
    (templateId: string) => {
      const tpl = TEMPLATES.find((t) => t.id === templateId);
      if (!tpl) return;
      const cloned: DocumentProject = JSON.parse(JSON.stringify(tpl.project));
      commitProject(cloned);
      setSelectedElementIds([]);
      setIsBackstageOpen(false);
    },
    [commitProject]
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

  // Helper to get/update elements on either Master Page or Active Page
  const currentElements = isEditingMaster
    ? project.masterPage?.elements || []
    : activePage.elements;

  const commitCurrentElements = useCallback(
    (nextElements: PublisherElement[]) => {
      if (isEditingMaster) {
        const currentMaster = project.masterPage || { elements: [], showOnAllPages: true };
        commitProject({
          ...project,
          masterPage: { ...currentMaster, elements: nextElements },
        });
      } else {
        const updatedPage = { ...activePage, elements: nextElements };
        const newPages = project.pages.map((pg, idx) =>
          idx === project.activePageIndex ? updatedPage : pg
        );
        commitProject({ ...project, pages: newPages });
      }
    },
    [isEditingMaster, project, activePage, commitProject]
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

  const updateElement = useCallback(
    (id: string, updates: Partial<PublisherElement>) => {
      if (isEditingMaster) {
        const updated = currentElements.map((el) =>
          el.id === id ? ({ ...el, ...updates } as PublisherElement) : el
        );
        commitCurrentElements(updated);
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

    currentElements.forEach((el) => {
      if (selectedElementIds.includes(el.id)) {
        const newId = `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        newIds.push(newId);
        duplicated.push({
          ...el,
          id: newId,
          x: el.x + 20,
          y: el.y + 20,
          zIndex: el.zIndex + 1,
        });
      }
    });

    commitCurrentElements([...currentElements, ...duplicated]);
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

    commitCurrentElements([...currentElements, ...pasted]);
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

  const selectElement = useCallback((id: string, multiSelect = false) => {
    setSelectedElementIds((prev) => {
      if (multiSelect) {
        return prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      }
      return [id];
    });
  }, []);

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
        borderWidth: 1,
        maskShape: 'none',
        ...options,
      };
      addElement(defaultImg);
    },
    [activePage, addElement]
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
        themeId: 'emerald-office',
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
    (value = 'https://www.microsoft.com/publisher', options?: Partial<QRElement>) => {
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
        s.shapeType === 'merged' && s.mergedParts
          ? s.mergedParts.map((p) => ({
              ...p,
              x: p.x + (s.x - minX),
              y: p.y + (s.y - minY),
            }))
          : [buildMergedPartFromShape(s, minX, minY)]
      );

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

  // Auto-connect 2+ selected elements with smart diagram connectors
  const autoConnectSelectedShapes = useCallback(
    (style: 'straight' | 'elbow' | 'curved' = 'elbow') => {
      const selected = currentElements.filter((el) =>
        selectedElementIds.includes(el.id) && el.type !== 'connector'
      );
      if (selected.length < 2) return;

      // Sort left-to-right / top-to-bottom for natural diagram flow
      const ordered = [...selected].sort((a, b) =>
        Math.abs(a.x - b.x) > 40 ? a.x - b.x : a.y - b.y
      );

      const maxZ = currentElements.reduce((acc, el) => Math.max(acc, el.zIndex), 0);
      const connectors: ConnectorElement[] = [];

      for (let i = 0; i < ordered.length - 1; i++) {
        const fromEl = ordered[i];
        const toEl = ordered[i + 1];
        connectors.push({
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
          zIndex: maxZ + 1 + i,
          strokeColor: activeScheme.primary,
          strokeWidth: 2.5,
          strokeDash: 'solid',
          arrowEnd: true,
        });
      }

      commitCurrentElements([...currentElements, ...connectors]);
    },
    [currentElements, selectedElementIds, activeScheme, commitCurrentElements]
  );

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
    // Fits standard page nicely in viewport
    const containerW = window.innerWidth - 380;
    const containerH = window.innerHeight - 240;
    const scaleX = containerW / activePage.width;
    const scaleY = containerH / activePage.height;
    const fitScale = Math.min(scaleX, scaleY, 1.2) * 0.9;
    setZoomState(Number(fitScale.toFixed(2)));
    setPan({ x: 0, y: 0 });
  }, [activePage]);

  return (
    <PublisherContext.Provider
      value={{
        project,
        activePage,
        selectedElementIds,
        zoom,
        pan,
        activeTab,
        isBackstageOpen,
        isMailMergeOpen,
        isWordArtModalOpen,
        isBuildingBlocksModalOpen,
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

        setViewMode,
        setToolMode,
        setIsLeftPanelOpen,
        setIsRightPanelOpen,
        setIsEditingMaster,
        toggleMasterPageVisibility,
        setActiveTab,
        setIsBackstageOpen,
        setIsMailMergeOpen,
        setIsWordArtModalOpen,
        setIsBuildingBlocksModalOpen,
        setRulerVisible,
        setGuidesVisible,
        setGridVisible,
        setSnapToGuides,
        setSnapToGrid,

        undo,
        redo,

        setProject,
        setActivePageIndex,
        addPage,
        duplicateActivePage,
        deleteActivePage,
        setPageSize,
        setPageOrientation,
        updatePagePosition,
        setPageMargins,
        setPageBackgroundColor,
        setColorScheme,
        loadTemplate,

        addGuide,
        removeGuide,

        addElement,
        updateElement,
        updateSelectedElements,
        deleteSelectedElements,
        duplicateSelectedElements,
        copySelectedElements,
        pasteElements,
        toggleElementLock,
        toggleElementVisibility,
        selectElement,
        selectAll,
        clearSelection,
        bringForward,
        sendBackward,
        bringToFront,
        sendToBack,
        alignSelected,
        distributeSelected,
        mergeSelectedShapes,
        autoConnectSelectedShapes,
        addConnectedDiagramStep,

        addTextBox,
        addShape,
        addImage,
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
