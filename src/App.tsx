import React from 'react';
import { PublisherProvider } from './context/PublisherContext';
import { Ribbon } from './components/ribbon/Ribbon';
import { PageThumbnails } from './components/sidebar/PageThumbnails';
import { CanvasArea } from './components/canvas/CanvasArea';
import { PropertiesPanel } from './components/sidebar/PropertiesPanel';
import { StatusBar } from './components/statusbar/StatusBar';
import { BackstageModal } from './components/modals/BackstageModal';
import { WordArtPickerModal } from './components/modals/WordArtPickerModal';
import { MailMergeModal } from './components/modals/MailMergeModal';
import { AIImageModal } from './components/modals/AIImageModal';
import { CollageModal } from './components/modals/CollageModal';
import { BrandBoardModal } from './components/modals/BrandBoardModal';

export const AppContent: React.FC = () => {
  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-100 font-sans">
      {/* 1. Office Ribbon Header & Quick Access Toolbar */}
      <Ribbon />

      {/* 2. Main Work Area: Thumbnails + Canvas Workspace + Properties Inspector */}
      <div className="flex flex-1 w-full h-[calc(100vh-120px)] overflow-hidden relative">
        <PageThumbnails />
        <CanvasArea />
        <PropertiesPanel />
      </div>

      {/* 3. Bottom Status Bar */}
      <StatusBar />

      {/* 4. Full-screen & Overlay Modals */}
      <BackstageModal />
      <WordArtPickerModal />
      <MailMergeModal />
      <AIImageModal />
      <CollageModal />
      <BrandBoardModal />
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
