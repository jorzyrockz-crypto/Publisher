import React, { Suspense, useEffect, useRef } from 'react';
import { PublisherProvider, usePublisher } from './context/PublisherContext';
import { useWindowWidth } from './hooks/useResizablePanel';
import { Ribbon } from './components/ribbon/Ribbon';
import { DocumentTabsBar } from './components/workspace/DocumentTabsBar';
import { PageThumbnails } from './components/sidebar/PageThumbnails';
import { CanvasArea } from './components/canvas/CanvasArea';
import { PropertiesPanel } from './components/sidebar/PropertiesPanel';
import { StockArtPanel } from './components/sidebar/StockArtPanel';
import { StatusBar } from './components/statusbar/StatusBar';
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
    isStockArtPanelOpen,
    setIsLeftPanelOpen,
    setIsRightPanelOpen,
  } = usePublisher();
  const windowWidth = useWindowWidth();
  const prevWidthRef = useRef(windowWidth);

  // Auto-collapse sidebars when resizing into a narrow/tablet viewport so the canvas stays usable
  useEffect(() => {
    const prev = prevWidthRef.current;
    prevWidthRef.current = windowWidth;
    if (windowWidth < 1024 && prev >= 1024) {
      setIsLeftPanelOpen(false);
      setIsRightPanelOpen(false);
    }
  }, [windowWidth, setIsLeftPanelOpen, setIsRightPanelOpen]);

  // On medium screens (< 1280px), yield the Inspector when Stock Art opens so both don't crowd the canvas
  useEffect(() => {
    if (isStockArtPanelOpen && windowWidth < 1280) {
      setIsRightPanelOpen(false);
    }
  }, [isStockArtPanelOpen, windowWidth, setIsRightPanelOpen]);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#edf0f3] text-[#161a22] font-sans">
      {/* 1. Office Ribbon Header & Quick Access Toolbar */}
      <Ribbon />

      {/* 2. Main Work Area: Thumbnails + Canvas Workspace + Properties Inspector */}
      <div className="flex flex-1 w-full min-h-0 overflow-hidden relative">
        <PageThumbnails />
        <CanvasArea />
        <StockArtPanel />
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
