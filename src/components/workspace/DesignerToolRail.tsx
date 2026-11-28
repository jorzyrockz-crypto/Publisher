import React, { useEffect, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { PAGE_SIZES } from '../../constants/pageSizes';
import { WORD_ART_STYLES } from '../../utils/wordArt';
import { ColorInput } from '../common/ColorInput';
import { PageThumbnails } from '../sidebar/PageThumbnails';
import { StockArtPanel } from '../sidebar/StockArtPanel';
import { SidebarTools } from '../sidebar/SidebarTools';
import { DesignerBrandPanel } from './DesignerBrandPanel';
import { DesignerViewPanel } from './DesignerViewPanel';
import { DesignerSettingsPanel } from './DesignerSettingsPanel';
import { DesignerVisualsPanel } from './DesignerVisualsPanel';
import { DesignerMediaPanel } from './DesignerMediaPanel';
import { TextControlsPanel } from '../canvas/TextControlsPanel';
import { CollageControlsPanel } from '../canvas/CollageControlsPanel';
import { COLLAGE_CONTROL_TITLES, type CollageControlSection } from '../../constants/collageControls';
import { TEXT_CONTROL_TITLES } from '../../constants/textControls';
import {
  clearUploads,
  deleteUpload,
  listUploads,
  saveUpload,
  type MediaUpload,
} from '../../utils/mediaLibrary';
// The collage drawer carries the layout catalogue (~20 kB); load it on first open
// rather than in the editor shell.
const DesignerCollagePanel = React.lazy(() =>
  import('./DesignerCollagePanel').then((m) => ({ default: m.DesignerCollagePanel }))
);
import {
  Wand2,
  Type,
  Upload,
  Shapes,
  Palette,
  Layers,
  Eye,
  Settings,
  ChevronLeft,
  ChevronRight,
  Images,
  Wrench,
  Sparkles,
  LayoutGrid,
  RotateCw,
  LayoutDashboard,
  File,
  Files,
  BookOpen,
  Ruler,
  Grid,
  Magnet,
} from 'lucide-react';

type DesignerDrawerTab =
  | 'edit'
  | 'text'
  | 'media'
  | 'stock'
  | 'tools'
  | 'visuals'
  | 'collage'
  | 'brand'
  | 'layers'
  | 'view'
  | 'settings';

export const DesignerToolRail: React.FC = () => {
  const {
    project,
    activePage,
    selectedElementIds,
    viewMode,
    setViewMode,
    rulerVisible,
    setRulerVisible,
    gridVisible,
    setGridVisible,
    snapToGuides,
    setSnapToGuides,
    snapToGrid,
    setSnapToGrid,
    setPageSize,
    setPageOrientation,
    setPageBackgroundColor,
    addTextBox,
    updateElement,
    addPicturePlaceholder,
    addImage,
    setIsWordArtModalOpen,
    setIsAIImageModalOpen,
    setIsRightPanelOpen,
    setRightPanelTab,
    setIsLeftPanelOpen,
    setToolMode,
    textControlSection,
    closeTextControl,
    collageControlSection,
    closeCollageControl,
  } = usePublisher();

  const [activeDrawer, setActiveDrawer] = useState<DesignerDrawerTab>('text');
  // Uploads live on the rail, which stays mounted, so switching drawers no longer throws
  // the library away — and they are stored on the device, so a reload does not either.
  const [uploads, setUploads] = useState<MediaUpload[]>([]);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  /**
   * Nested controls from the canvas bar open here, in the sidebar beside it — the font list,
   * the colour palette, a collage's layouts and backdrop. One destination for every bar.
   *
   * Derived, not synchronised: asking for a panel *is* a drawer that is open on the Edit
   * pane, so there is no state to set in an effect and nothing to get out of step. Closing
   * the panel returns the drawer to whatever it was showing before.
   */
  const sidePanel = textControlSection
    ? { title: TEXT_CONTROL_TITLES[textControlSection], close: closeTextControl }
    : collageControlSection
    ? {
        title: COLLAGE_CONTROL_TITLES[collageControlSection as CollageControlSection],
        close: closeCollageControl,
      }
    : null;
  const pane: DesignerDrawerTab = sidePanel ? 'edit' : activeDrawer;
  const drawerVisible = drawerOpen || Boolean(sidePanel);

  // Sync Layers drawer with isLeftPanelOpen when toggling from elsewhere
  useEffect(() => {
    setIsLeftPanelOpen(drawerVisible && pane === 'layers');
  }, [drawerVisible, pane, setIsLeftPanelOpen]);

  const handleSelectRailTab = (tab: DesignerDrawerTab) => {
    closeTextControl();
    closeCollageControl();
    if (drawerOpen && activeDrawer === tab) {
      setDrawerOpen(false);
      return;
    }
    setActiveDrawer(tab);
    setDrawerOpen(true);
  };

  // Load the saved library once. Async, so nothing is set synchronously inside the effect.
  useEffect(() => {
    let alive = true;
    listUploads()
      .then((rows) => {
        if (alive) setUploads(rows);
      })
      .catch(() => {
        if (alive) setUploads([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const handlePlaceUpload = (src: string) => {
    addImage(src);
    setToolMode('select');
  };

  /** Saves every file to the device library and places the first one, so an upload still
   *  lands on the page immediately — the rest wait as thumbnails. */
  const handleUploadFiles = (files: FileList | null) => {
    const list = Array.from(files ?? []);
    if (list.length === 0) return;
    setUploadNotice(null);

    list.forEach((file, index) => {
      saveUpload(file)
        .then((upload) => {
          setUploads((current) => [upload, ...current.filter((item) => item.id !== upload.id)]);
          if (index === 0) handlePlaceUpload(upload.dataUrl);
        })
        .catch((error: unknown) => {
          setUploadNotice(
            error instanceof Error ? error.message : 'That file could not be saved.'
          );
        });
    });
  };

  const handleDeleteUpload = (id: string) => {
    setUploads((current) => current.filter((item) => item.id !== id));
    void deleteUpload(id);
  };

  const handleClearUploads = () => {
    setUploads([]);
    void clearUploads();
  };

  const selectedTextElement =
    selectedElementIds.length === 1
      ? activePage.elements.find(
          (el) => el.id === selectedElementIds[0] && el.type === 'text'
        )
      : undefined;

  const mainRailItems: Array<{
    id: DesignerDrawerTab;
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'edit', label: 'Edit', icon: <Wand2 size={18} /> },
    { id: 'text', label: 'Text', icon: <Type size={18} /> },
    { id: 'media', label: 'My media', icon: <Upload size={18} /> },
    { id: 'stock', label: 'Stock', icon: <Images size={18} /> },
    { id: 'visuals', label: 'Visuals', icon: <Shapes size={18} /> },
    { id: 'tools', label: 'Tools', icon: <Wrench size={18} /> },
    { id: 'collage', label: 'Collage', icon: <LayoutGrid size={18} /> },
    { id: 'brand', label: 'Brand', icon: <Palette size={18} /> },
    { id: 'layers', label: 'Layers', icon: <Layers size={18} /> },
    { id: 'view', label: 'View', icon: <Eye size={18} /> },
  ];

  const pillToggle = (active: boolean) =>
    `flex items-center justify-center gap-1 px-2 py-1.5 rounded-[8px] border text-[11px] font-medium transition cursor-pointer ${
      active
        ? 'bg-[#efeafd] border-[#d3c9f9] text-[#5c4bb8]'
        : 'bg-[#f8fafb] border-[#e5e9ee] text-[#4a5661] hover:bg-[#f4f2ff]'
    }`;

  // A nested panel is a touch surface: 40px swatches and 48px rows need the extra width, and
  // the drawer sits beside the bar, so it can afford it without crowding the canvas.
  const drawerWidthClass = sidePanel
    ? 'w-[336px]'
    : activeDrawer === 'media' ||
        activeDrawer === 'brand' ||
        activeDrawer === 'visuals' ||
        activeDrawer === 'collage' ||
        activeDrawer === 'stock' ||
        activeDrawer === 'tools'
      ? 'w-[296px]'
      : 'w-[268px]';

  const drawerTitle =
    pane === 'edit'
      ? 'Page & Design'
      : pane === 'text'
      ? 'Text editing'
      : pane === 'media'
      ? 'My media'
      : pane === 'visuals'
      ? 'Add visuals'
      : pane === 'collage'
      ? 'Collage'
      : pane === 'stock'
      ? 'Stock art'
      : pane === 'tools'
      ? 'Tools'
      : pane === 'brand'
      ? 'Brand Studio'
      : pane === 'view'
      ? 'View & Display'
      : 'Settings';

  return (
    <div className="flex h-full flex-shrink-0 z-30 relative select-none touch-manipulation">
      {/* 1. Labeled Vertical Icon Rail (70px touch-friendly — Microsoft Designer style) */}
      <aside
        className="w-[70px] h-full bg-white border-r border-[#e5e9ee] flex flex-col items-center justify-between py-2.5 flex-shrink-0"
        aria-label="Designer Studio Rail"
      >
        <div className="flex w-full min-h-0 flex-1 flex-col items-center gap-1.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {mainRailItems.map((item) => {
            const isActive = drawerOpen && activeDrawer === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectRailTab(item.id)}
                className={`w-[58px] min-h-[50px] py-2 rounded-[12px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer touch-manipulation active:scale-95 ${
                  isActive
                    ? 'bg-[#efeafd] text-[#5c4bb8] shadow-2xs'
                    : 'text-[#4a5661] hover:text-[#161a22] hover:bg-[#f4f2ff]'
                }`}
                title={item.label}
              >
                {item.icon}
                <span className="text-[10.5px] font-medium leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom-pinned Settings */}
        <div className="pt-2 border-t border-[#e5e9ee] flex flex-col items-center flex-shrink-0">
          <button
            type="button"
            onClick={() => handleSelectRailTab('settings')}
            className={`w-[58px] min-h-[50px] py-2 rounded-[12px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer touch-manipulation active:scale-95 ${
              drawerOpen && activeDrawer === 'settings'
                ? 'bg-[#efeafd] text-[#5c4bb8] shadow-2xs'
                : 'text-[#4a5661] hover:text-[#161a22] hover:bg-[#f4f2ff]'
            }`}
            title="Settings"
          >
            <Settings size={18} />
            <span className="text-[10.5px] font-medium leading-none">Settings</span>
          </button>
        </div>
      </aside>

      {/* 2. Single Expandable Left Studio Drawer */}
      {drawerVisible && (
        <div className="h-full flex items-stretch relative">
          {pane === 'layers' ? (
            <div className="h-full flex">
              <PageThumbnails />
            </div>
          ) : (
            <div
              className={`${drawerWidthClass} h-full bg-white border-r border-[#e5e9ee] flex flex-col overflow-hidden`}
            >
              {pane !== 'stock' && (
                <div className="px-3.5 py-3 border-b border-[#e5e9ee] flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {sidePanel && (
                      <button
                        type="button"
                        onClick={() => {
                          // Closing the panel returns to the pane you were on rather than
                          // taking the drawer down with it.
                          setDrawerOpen(true);
                          sidePanel.close();
                        }}
                        aria-label="Back to the edit panel"
                        title="Back"
                        className="w-9 h-9 -ml-1.5 flex items-center justify-center rounded-full text-[#4a5661] hover:bg-[#f4f2ff] hover:text-[#5c4bb8] transition cursor-pointer flex-shrink-0 touch-manipulation"
                      >
                        <ChevronLeft size={18} />
                      </button>
                    )}
                    <h2 className="text-xs font-semibold text-[#161a22] truncate">
                      {sidePanel ? sidePanel.title : drawerTitle}
                    </h2>
                  </div>
                </div>
              )}

              {pane === 'brand' ? (
                <DesignerBrandPanel />
              ) : pane === 'view' ? (
                <DesignerViewPanel />
              ) : pane === 'settings' ? (
                <DesignerSettingsPanel />
              ) : pane === 'visuals' ? (
                <DesignerVisualsPanel onOpenMyMedia={() => setActiveDrawer('media')} />
              ) : pane === 'collage' ? (
                <React.Suspense
                  fallback={<div className="p-3 text-meta text-ink-muted">Loading collage…</div>}
                >
                  <DesignerCollagePanel />
                </React.Suspense>
              ) : pane === 'stock' ? (
                /* All sources, filters, key bar, paging and credits, untouched. The rail
                   hides its own drawer header here: the panel brings an inspector-style
                   one, and two stacked titles is noise. */
                <StockArtPanel embedded />
              ) : pane === 'tools' ? (
                /* Tools launches the jobs that begin with material — collage, tarpaulin, the
                   storybook kit — and the kit opens in place, inside this drawer. */
                <div className="flex-1 min-h-0 flex flex-col">
                  <SidebarTools showLabel={false} />
                </div>
              ) : pane === 'media' ? (
                <DesignerMediaPanel
                  uploads={uploads}
                  onFiles={handleUploadFiles}
                  onPlace={handlePlaceUpload}
                  onDelete={handleDeleteUpload}
                  onClear={handleClearUploads}
                  onAddPlaceholder={() => addPicturePlaceholder()}
                  onOpenAI={() => setIsAIImageModalOpen(true)}
                  onOpenStock={() => setActiveDrawer('stock')}
                  notice={uploadNotice}
                />
              ) : sidePanel ? (
                <div className="flex-1 overflow-y-auto p-3">
                  {textControlSection ? (
                    <TextControlsPanel variant="pane" />
                  ) : (
                    <CollageControlsPanel variant="pane" />
                  )}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                  {pane === 'edit' && (
                    <>
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-[#4a5661]">Page &amp; Canvas</p>
                        <div className="space-y-2 p-2.5 rounded-[10px] border border-[#e5e9ee] bg-[#f8fafb]">
                          <div className="flex items-center gap-1.5">
                            <select
                              value={project.pageSizeName}
                              onChange={(e) => setPageSize(e.target.value)}
                              className="flex-1 min-w-0 h-7 px-2 rounded-[7px] border border-[#e5e9ee] bg-white text-[11px] font-medium text-[#161a22] outline-none cursor-pointer"
                              title="Page Size"
                            >
                              {PAGE_SIZES.map((s) => (
                                <option key={s.name} value={s.name}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() =>
                                setPageOrientation(
                                  activePage.orientation === 'portrait' ? 'landscape' : 'portrait'
                                )
                              }
                              className="flex items-center gap-1 h-7 px-2 rounded-[7px] border border-[#e5e9ee] bg-white hover:bg-[#f4f2ff] text-[11px] font-medium text-[#4a5661] hover:text-[#5c4bb8] transition cursor-pointer"
                              title="Toggle Orientation"
                            >
                              <RotateCw size={11} />
                              <span>
                                {activePage.orientation === 'portrait' ? 'Portrait' : 'Landscape'}
                              </span>
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-[11px] text-[#4a5661]">Page Fill</span>
                            <ColorInput
                              value={activePage.backgroundColor || '#ffffff'}
                              onChange={(e) => setPageBackgroundColor(e.target.value)}
                              className="w-7 h-6 rounded border border-[#e5e9ee]"
                            />
                          </div>

                          <div className="grid grid-cols-4 gap-1 pt-0.5">
                            <button
                              type="button"
                              onClick={() => setViewMode('artboard')}
                              className={pillToggle(viewMode === 'artboard')}
                              title="Freeform — every paper on one pasteboard"
                            >
                              <LayoutDashboard size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewMode('single')}
                              className={pillToggle(viewMode === 'single')}
                              title="Single Page View"
                            >
                              <File size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewMode('continuous')}
                              className={pillToggle(viewMode === 'continuous')}
                              title="Continuous Scroll"
                            >
                              <Files size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewMode('spread')}
                              className={pillToggle(viewMode === 'spread')}
                              title="2-Page Spread"
                            >
                              <BookOpen size={12} />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-1 pt-0.5">
                            <button
                              type="button"
                              onClick={() => setRulerVisible(!rulerVisible)}
                              className={pillToggle(rulerVisible)}
                              title="Toggle Rulers"
                            >
                              <Ruler size={11} />
                              <span>Rulers</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setGridVisible(!gridVisible)}
                              className={pillToggle(gridVisible)}
                              title="Toggle Grid"
                            >
                              <Grid size={11} />
                              <span>Grid</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next = !(snapToGuides || snapToGrid);
                                setSnapToGuides(next);
                                setSnapToGrid(next);
                              }}
                              className={pillToggle(snapToGuides || snapToGrid)}
                              title="Toggle Smart Snap"
                            >
                              <Magnet size={11} />
                              <span>Snap</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold text-[#4a5661]">Studio Panels</p>
                        <button
                          type="button"
                          onClick={() => {
                            setRightPanelTab('design-ideas');
                            setIsRightPanelOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#d3c9f9] bg-[#f4f2ff] hover:bg-[#efeafd] text-[#5c4bb8] text-xs font-semibold transition cursor-pointer"
                        >
                          <Sparkles size={14} />
                          <span>Open Design Ideas</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRightPanelTab('inspector');
                            setIsRightPanelOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] text-[#161a22] text-xs font-medium transition cursor-pointer"
                        >
                          <Wand2 size={14} className="text-[#6e56cf]" />
                          <span>Open Full Inspector</span>
                        </button>
                      </div>
                    </>
                  )}

                  {pane === 'text' && (
                    <>
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            addTextBox({
                              text: 'Add a heading',
                              fontSize: 36,
                              fontWeight: 'bold',
                              height: 64,
                            })
                          }
                          className="w-full text-left px-3 py-2.5 rounded-[10px] bg-[#6e56cf] hover:bg-[#5c4bb8] text-white text-sm font-bold transition cursor-pointer"
                        >
                          Add a heading
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            addTextBox({
                              text: 'Add a subheading',
                              fontSize: 22,
                              fontWeight: 'bold',
                              height: 48,
                            })
                          }
                          className="w-full text-left px-3 py-2 rounded-[10px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] text-[#161a22] text-xs font-semibold transition cursor-pointer"
                        >
                          Add a subheading
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            addTextBox({
                              text: 'Add a little bit of body text',
                              fontSize: 14,
                              height: 44,
                            })
                          }
                          className="w-full text-left px-3 py-2 rounded-[10px] border border-[#e5e9ee] bg-white hover:bg-[#f4f2ff] text-[#4a5661] text-xs transition cursor-pointer"
                        >
                          Add body text
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-[#4a5661]">
                            {selectedTextElement ? 'Apply Style Preset' : 'Text & WordArt Styles'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsWordArtModalOpen(true)}
                            className="text-[11px] font-semibold text-[#6e56cf] hover:underline cursor-pointer"
                          >
                            AI Ideas →
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {WORD_ART_STYLES.map((style) => (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => {
                                if (selectedTextElement) {
                                  updateElement(selectedTextElement.id, {
                                    isWordArt: true,
                                    wordArtStyle: style.id,
                                  });
                                } else {
                                  addTextBox({
                                    text: 'HEADLINE',
                                    fontSize: 38,
                                    fontWeight: 'bold',
                                    isWordArt: true,
                                    wordArtStyle: style.id,
                                    width: 360,
                                    height: 84,
                                  });
                                }
                              }}
                              className={`h-[72px] px-1.5 rounded-[10px] border border-[#e5e9ee] hover:border-[#6e56cf] flex flex-col items-center justify-center transition cursor-pointer overflow-hidden ${
                                style.dark
                                  ? 'bg-[#111827] hover:bg-[#1e293b]'
                                  : 'bg-[#f8fafb] hover:bg-[#f4f2ff]'
                              }`}
                              title={style.label}
                            >
                              <span
                                className={`text-lg font-extrabold leading-tight ${style.className}`}
                              >
                                WordArt
                              </span>
                              <span
                                className={`text-[9px] mt-1 truncate max-w-full ${
                                  style.dark ? 'text-slate-300' : 'text-[#6a7682]'
                                }`}
                              >
                                {style.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Collapse Handle Tab (<) on Drawer Edge — touch-friendly */}
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-14 bg-white border border-l-0 border-[#e5e9ee] rounded-r-[10px] shadow-sm flex items-center justify-center text-[#6a7682] hover:text-[#5c4bb8] cursor-pointer z-40 touch-manipulation active:scale-95"
            title="Collapse Drawer"
            aria-label="Collapse Drawer"
          >
            <ChevronLeft size={15} />
          </button>
        </div>
      )}

      {/* Re-open Handle Tab (>) when Drawer is Collapsed */}
      {!drawerOpen && (
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="absolute left-[70px] top-1/2 -translate-y-1/2 w-6 h-14 bg-white border border-l-0 border-[#e5e9ee] rounded-r-[10px] shadow-sm flex items-center justify-center text-[#6a7682] hover:text-[#5c4bb8] cursor-pointer z-40 touch-manipulation active:scale-95"
          title="Expand Drawer"
          aria-label="Expand Drawer"
        >
          <ChevronRight size={15} />
        </button>
      )}
    </div>
  );
};
