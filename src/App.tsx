import React from 'react';
import { PublisherProvider } from './context/PublisherContext';
import { Ribbon } from './components/ribbon/Ribbon';
import { DocumentTabsBar } from './components/workspace/DocumentTabsBar';
import { PageThumbnails } from './components/sidebar/PageThumbnails';
import { CanvasArea } from './components/canvas/CanvasArea';
import { PropertiesPanel } from './components/sidebar/PropertiesPanel';
import { StockArtPanel } from './components/sidebar/StockArtPanel';
import { StatusBar } from './components/statusbar/StatusBar';
import { BackstageModal } from './components/modals/BackstageModal';
import { WordArtPickerModal } from './components/modals/WordArtPickerModal';
import { MailMergeModal } from './components/modals/MailMergeModal';
import { AIImageModal } from './components/modals/AIImageModal';
import { CollageModal } from './components/modals/CollageModal';
import { BrandBoardModal } from './components/modals/BrandBoardModal';
import { BrandKitModal } from './components/modals/BrandKitModal';

export const AppContent: React.FC = () => {
  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-100 font-sans">
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

      {/* 4. Full-screen & Overlay Modals */}
      <BackstageModal />
      <WordArtPickerModal />
      <MailMergeModal />
      <AIImageModal />
      <CollageModal />
      <BrandBoardModal />
      <BrandKitModal />
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
