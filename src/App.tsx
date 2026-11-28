import React, { Suspense, useEffect, useRef } from 'react';
import { PublisherProvider, usePublisher } from './context/PublisherContext';
import { useWindowWidth } from './hooks/useResizablePanel';
import { Ribbon } from './components/ribbon/Ribbon';
import { QuickAccessToolbar } from './components/ribbon/QuickAccessToolbar';
import { DesignerToolRail } from './components/workspace/DesignerToolRail';
import { DocumentTabsBar } from './components/workspace/DocumentTabsBar';
import { PageThumbnails } from './components/sidebar/PageThumbnails';
import { CanvasArea } from './components/canvas/CanvasArea';
import { PropertiesPanel } from './components/sidebar/PropertiesPanel';
import { StockArtPanel } from './components/sidebar/StockArtPanel';
import { AssetPackPanel } from './components/sidebar/AssetPackPanel';
import { StatusBar } from './components/statusbar/StatusBar';
import { CinematicSplashScreen } from './components/common/CinematicSplashScreen';
// Heavy overlay dialogs are code-split so the initial bundle only ships the
// editor shell (ribbon + canvas + sidebar). Each chunk loads on first open.
const BackstageModal = React.lazy(() =>
  import('./components/modals/BackstageModal').then((m) => ({ default: m.BackstageModal }))
);
const WordArtPickerModal = React.lazy(() =>
  import('./components/modals/WordArtPickerModal').then((m) => ({ default: m.WordArtPickerModal }))
);
const MailMergeModal = React.lazy(() =>
  import('./components/modals/MailMergeModal').then((m) => ({ default: m.MailMergeModal }))
);
const AIImageModal = React.lazy(() =>
  import('./components/modals/AIImageModal').then((m) => ({ default: m.AIImageModal }))
);
const CollageModal = React.lazy(() =>
  import('./components/modals/CollageModal').then((m) => ({ default: m.CollageModal }))
);
const BrandBoardModal = React.lazy(() =>
  import('./components/modals/BrandBoardModal').then((m) => ({ default: m.BrandBoardModal }))
);
const BrandKitModal = React.lazy(() =>
  import('./components/modals/BrandKitModal').then((m) => ({ default: m.BrandKitModal }))
);
const ShortcutsModal = React.lazy(() =>
  import('./components/modals/ShortcutsModal').then((m) => ({ default: m.ShortcutsModal }))
);

export const AppContent: React.FC = () => {
  const {
    workspaceMode,
    isLeftPanelOpen,
    isRightPanelOpen,
    isStockArtPanelOpen,
    isAssetPackPanelOpen,
    setIsLeftPanelOpen,
    setIsRightPanelOpen,
    setIsStockArtPanelOpen,
    setIsAssetPackPanelOpen,
    selectedElementIds,
    closeCollageControl,
    closeTextControl,
  } = usePublisher();
  const windowWidth = useWindowWidth();
  const prevWidthRef = useRef(windowWidth);
  const didMountCollapseRef = useRef(false);
  const hadSelectionRef = useRef(selectedElementIds.length > 0);
  const inspectorClosedForDeselectRef = useRef(false);

  /**
   * The Inspector edits what is selected, so it closes with the selection. Deselecting used
   * to leave it standing there on the page settings while the object it was opened for was
   * gone; now an empty selection closes it, and selecting something again brings it back.
   *
   * Only a change of selection does this. An Inspector someone opened by hand while nothing
   * is selected stays open, and so does one that was already open on an empty canvas at boot.
   */
  useEffect(() => {
    const hasSelection = selectedElementIds.length > 0;
    if (hasSelection === hadSelectionRef.current) return;
    hadSelectionRef.current = hasSelection;

    if (hasSelection) {
      if (inspectorClosedForDeselectRef.current) {
        inspectorClosedForDeselectRef.current = false;
        setIsRightPanelOpen(true);
      }
      return;
    }

    closeCollageControl();
    closeTextControl();
    if (isRightPanelOpen) {
      inspectorClosedForDeselectRef.current = true;
      setIsRightPanelOpen(false);
    }
  }, [
    selectedElementIds.length,
    isRightPanelOpen,
    setIsRightPanelOpen,
    closeCollageControl,
    closeTextControl,
  ]);

  // On tablet/narrow initial mount (< 1024px), start with sidebars collapsed so the canvas is immediately visible
  useEffect(() => {
    if (didMountCollapseRef.current) return;
    didMountCollapseRef.current = true;
    if (window.innerWidth < 1024) {
      setIsLeftPanelOpen(false);
      setIsRightPanelOpen(false);
    }
  }, [setIsLeftPanelOpen, setIsRightPanelOpen]);

  // Auto-collapse sidebars when resizing into a narrow/tablet viewport; restore on large screens
  useEffect(() => {
    const prev = prevWidthRef.current;
    prevWidthRef.current = windowWidth;
    if (windowWidth < 1024 && prev >= 1024) {
      setIsLeftPanelOpen(false);
      setIsRightPanelOpen(false);
      setIsStockArtPanelOpen(false);
    } else if (windowWidth >= 1280 && prev < 1024) {
      setIsLeftPanelOpen(true);
      setIsRightPanelOpen(true);
    }
  }, [windowWidth, setIsLeftPanelOpen, setIsRightPanelOpen, setIsStockArtPanelOpen]);

  // On medium screens (< 1280px), yield the Inspector when Stock Art opens so both don't crowd the canvas
  useEffect(() => {
    if (isStockArtPanelOpen && windowWidth < 1280) {
      setIsRightPanelOpen(false);
    }
  }, [isStockArtPanelOpen, windowWidth, setIsRightPanelOpen]);

  // In Designer mode, start with the right Inspector collapsed for an airy canvas (opened via "Effects")
  useEffect(() => {
    if (workspaceMode === 'designer') {
      setIsRightPanelOpen(false);
    } else if (window.innerWidth >= 1024) {
      setIsLeftPanelOpen(true);
      setIsRightPanelOpen(true);
    }
  }, [workspaceMode, setIsLeftPanelOpen, setIsRightPanelOpen]);

  const isNarrow = windowWidth < 1024;
  const hasNarrowDrawerOpen =
    isNarrow && (isLeftPanelOpen || isRightPanelOpen || isStockArtPanelOpen || isAssetPackPanelOpen);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#edf0f3] text-[#161a22] font-sans">
      <CinematicSplashScreen />
      {/* 1. Office Ribbon (Publisher) or Clean Top Bar (Designer) */}
      {workspaceMode === 'designer' ? <QuickAccessToolbar /> : <Ribbon />}

      {/* 2. Main Work Area: Tool Rail + Drawer (Designer) or Thumbnails + Canvas + Inspector */}
      <div className="flex flex-1 w-full min-h-0 overflow-hidden relative">
        {workspaceMode === 'designer' ? <DesignerToolRail /> : <PageThumbnails />}
        <CanvasArea />
        {hasNarrowDrawerOpen && (
          <div
            onClick={() => {
              setIsLeftPanelOpen(false);
              setIsRightPanelOpen(false);
              setIsStockArtPanelOpen(false);
              setIsAssetPackPanelOpen(false);
            }}
            className="absolute inset-0 bg-[#15232d]/25 backdrop-blur-[1px] z-25 transition-opacity"
            aria-hidden="true"
          />
        )}
        {workspaceMode !== 'designer' && !isAssetPackPanelOpen && <StockArtPanel />}
        {workspaceMode !== 'designer' && isAssetPackPanelOpen && <AssetPackPanel />}
        <PropertiesPanel />
      </div>

      {/* 3. Excel-Style Bottom Sheet Tabs & Status Bar */}
      <DocumentTabsBar />
      <StatusBar />

      {/* 4. Full-screen & Overlay Modals (lazy — loaded on first open) */}
      <Suspense fallback={null}>
        <BackstageModal />
        <WordArtPickerModal />
        <MailMergeModal />
        <AIImageModal />
        <CollageModal />
        <BrandBoardModal />
        <BrandKitModal />
        <ShortcutsModal />
      </Suspense>
    </div>
  );
};

export default function App() {
  return (
    <PublisherProvider>
      <AppContent />
    </PublisherProvider>
  );
}
