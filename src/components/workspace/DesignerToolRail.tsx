import React, { useEffect, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { SHAPE_CATALOG } from '../../utils/shapePaths';
import { ShapePreviewIcon } from '../common/ShapePreviewIcon';
import { COLOR_SCHEMES } from '../../constants/colorSchemes';
import { PAGE_SIZES } from '../../constants/pageSizes';
import { WORD_ART_STYLES } from '../../utils/wordArt';
import { ColorInput } from '../common/ColorInput';
import { PageThumbnails } from '../sidebar/PageThumbnails';
import {
  Wand2,
  Type,
  Upload,
  Shapes,
  Palette,
  Layers,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Table as TableIcon,
  QrCode,
  Minus,
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

type DesignerDrawerTab = 'edit' | 'text' | 'media' | 'visuals' | 'brand' | 'layers';

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
    addShape,
    addLine,
    addPicturePlaceholder,
    addImage,
    addTable,
    addQRCode,
    setColorScheme,
    isStockArtPanelOpen,
    setIsStockArtPanelOpen,
    setIsWordArtModalOpen,
    setIsAIImageModalOpen,
    setIsCollageModalOpen,
    setIsBrandKitModalOpen,
    setIsBrandBoardModalOpen,
    setIsRightPanelOpen,
    setRightPanelTab,
    setIsLeftPanelOpen,
    setToolMode,
  } = usePublisher();

  const [activeDrawer, setActiveDrawer] = useState<DesignerDrawerTab>('text');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  // Sync Layers drawer with isLeftPanelOpen when toggling from elsewhere
  useEffect(() => {
    setIsLeftPanelOpen(drawerOpen && activeDrawer === 'layers');
  }, [drawerOpen, activeDrawer, setIsLeftPanelOpen]);

  const handleSelectRailTab = (tab: DesignerDrawerTab) => {
    if (drawerOpen && activeDrawer === tab) {
      setDrawerOpen(false);
      return;
    }
    setActiveDrawer(tab);
    setDrawerOpen(true);
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        addImage(reader.result);
        setToolMode('select');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const selectedTextElement =
    selectedElementIds.length === 1
      ? activePage.elements.find(
          (el) => el.id === selectedElementIds[0] && el.type === 'text'
        )
      : undefined;

  const railItems: Array<{
    id: DesignerDrawerTab;
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'edit', label: 'Edit', icon: <Wand2 size={18} /> },
    { id: 'text', label: 'Text', icon: <Type size={18} /> },
    { id: 'media', label: 'My media', icon: <Upload size={18} /> },
    { id: 'visuals', label: 'Visuals', icon: <Shapes size={18} /> },
    { id: 'brand', label: 'Brand', icon: <Palette size={18} /> },
    { id: 'layers', label: 'Layers', icon: <Layers size={18} /> },
  ];

  const pillToggle = (active: boolean) =>
    `flex items-center justify-center gap-1 px-2 py-1.5 rounded-[8px] border text-[11px] font-medium transition cursor-pointer ${
      active
        ? 'bg-[#efeafd] border-[#d3c9f9] text-[#5c4bb8]'
        : 'bg-[#f8fafb] border-[#e5e9ee] text-[#4a5661] hover:bg-[#f4f2ff]'
    }`;

  return (
    <div className="flex h-full flex-shrink-0 z-30 relative select-none">
      {/* 1. Labeled Vertical Icon Rail (64px — Microsoft Designer style) */}
      <aside
        className="w-[64px] h-full bg-white border-r border-[#e5e9ee] flex flex-col items-center py-2.5 gap-1.5 flex-shrink-0"
        aria-label="Designer Studio Rail"
      >
        {railItems.map((item) => {
          const isActive = drawerOpen && activeDrawer === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectRailTab(item.id)}
              className={`w-[52px] py-2 rounded-[10px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#efeafd] text-[#5c4bb8] shadow-2xs'
                  : 'text-[#4a5661] hover:text-[#161a22] hover:bg-[#f4f2ff]'
              }`}
              title={item.label}
            >
              {item.icon}
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </aside>

      {/* 2. Single Expandable Left Studio Drawer */}
      {drawerOpen && (
        <div className="h-full flex items-stretch relative">
          {activeDrawer === 'layers' ? (
            <div className="h-full flex">
              <PageThumbnails />
            </div>
          ) : (
            <div className="w-[264px] h-full bg-white border-r border-[#e5e9ee] flex flex-col overflow-hidden">
              <div className="px-3.5 py-3 border-b border-[#e5e9ee] flex items-center justify-between">
                <h2 className="text-xs font-semibold text-[#161a22]">
                  {activeDrawer === 'edit'
                    ? 'Page & Design'
                    : activeDrawer === 'text'
                    ? 'Text editing'
                    : activeDrawer === 'media'
                    ? 'My media'
                    : activeDrawer === 'visuals'
                    ? 'Visuals & Shapes'
                    : 'Brand & Colors'}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {activeDrawer === 'edit' && (
                  <>
                    {/* Document & Canvas Settings (moved from floating pill into sidebar) */}
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
                            title="Artboard View"
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

                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-[#4a5661]">Quick AI &amp; Layouts</p>
                      <button
                        type="button"
                        onClick={() => setIsAIImageModalOpen(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#e5e9ee] bg-white hover:bg-[#f8fafb] text-xs font-medium transition cursor-pointer"
                      >
                        <Wand2 size={14} className="text-[#6e56cf]" />
                        <span>AI Image Studio</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCollageModalOpen(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#e5e9ee] bg-white hover:bg-[#f8fafb] text-xs font-medium transition cursor-pointer"
                      >
                        <LayoutGrid size={14} className="text-[#6e56cf]" />
                        <span>Photo Collage Builder</span>
                      </button>
                    </div>
                  </>
                )}

                {activeDrawer === 'text' && (
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

                    {/* Full WordArt Style Presets placed directly in the Text panel */}
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

                {activeDrawer === 'media' && (
                  <div className="space-y-2">
                    <label className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-[10px] bg-[#6e56cf] hover:bg-[#5c4bb8] text-white text-xs font-semibold transition cursor-pointer">
                      <Upload size={14} />
                      <span>Upload from device</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadImage}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => addPicturePlaceholder()}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] text-xs font-medium transition cursor-pointer"
                    >
                      <ImageIcon size={14} className="text-[#6e56cf]" />
                      <span>Add Picture Frame</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAIImageModalOpen(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] text-xs font-medium transition cursor-pointer"
                    >
                      <Wand2 size={14} className="text-[#6e56cf]" />
                      <span>Generate AI Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCollageModalOpen(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] text-xs font-medium transition cursor-pointer"
                    >
                      <LayoutGrid size={14} className="text-[#6e56cf]" />
                      <span>Create Photo Collage</span>
                    </button>
                  </div>
                )}

                {activeDrawer === 'visuals' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsStockArtPanelOpen(!isStockArtPanelOpen)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[10px] bg-[#6e56cf] hover:bg-[#5c4bb8] text-white text-xs font-semibold transition cursor-pointer"
                    >
                      <Shapes size={14} />
                      <span>{isStockArtPanelOpen ? 'Hide Stock & Clipart' : 'Browse Stock & Clipart'}</span>
                    </button>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-[#4a5661]">Quick Elements</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => addLine()}
                          className="flex flex-col items-center gap-1 p-2 rounded-[8px] border border-[#e5e9ee] hover:bg-[#f4f2ff] text-[10px] font-medium cursor-pointer"
                        >
                          <Minus size={14} className="-rotate-45" />
                          <span>Line</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => addTable(3, 3)}
                          className="flex flex-col items-center gap-1 p-2 rounded-[8px] border border-[#e5e9ee] hover:bg-[#f4f2ff] text-[10px] font-medium cursor-pointer"
                        >
                          <TableIcon size={14} />
                          <span>Table</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => addQRCode()}
                          className="flex flex-col items-center gap-1 p-2 rounded-[8px] border border-[#e5e9ee] hover:bg-[#f4f2ff] text-[10px] font-medium cursor-pointer"
                        >
                          <QrCode size={14} />
                          <span>QR Code</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-[#4a5661]">Vector Shapes</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {SHAPE_CATALOG.map((item) => (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => addShape(item.type)}
                            className="p-2 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] hover:border-[#d3c9f9] flex items-center justify-center transition cursor-pointer"
                            title={item.label}
                          >
                            <ShapePreviewIcon shapeType={item.type} size={20} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {activeDrawer === 'brand' && (
                  <>
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => setIsBrandKitModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[10px] bg-[#6e56cf] hover:bg-[#5c4bb8] text-white text-xs font-semibold transition cursor-pointer"
                      >
                        <Palette size={14} />
                        <span>Manage Brand Kits</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsBrandBoardModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[10px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] text-xs font-medium transition cursor-pointer"
                      >
                        <LayoutGrid size={14} className="text-[#6e56cf]" />
                        <span>Multi-Size Brand Board</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-[#4a5661]">Color Schemes</span>
                      <div className="space-y-1.5">
                        {COLOR_SCHEMES.slice(0, 8).map((scheme) => (
                          <button
                            key={scheme.id}
                            type="button"
                            onClick={() => setColorScheme(scheme.id)}
                            className="w-full flex items-center justify-between px-2.5 py-2 rounded-[8px] border border-[#e5e9ee] hover:bg-[#f4f2ff] transition cursor-pointer"
                          >
                            <span className="text-[11px] font-medium text-[#161a22] truncate">
                              {scheme.name}
                            </span>
                            <div className="flex items-center gap-1">
                              {[scheme.primary, scheme.secondary, scheme.accent].map((c, idx) => (
                                <span
                                  key={idx}
                                  className="w-3.5 h-3.5 rounded-full border border-black/10"
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Collapse Handle Tab (<) on Drawer Edge */}
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-10 bg-white border border-l-0 border-[#e5e9ee] rounded-r-[8px] shadow-xs flex items-center justify-center text-[#6a7682] hover:text-[#5c4bb8] cursor-pointer z-40"
            title="Collapse Drawer"
            aria-label="Collapse Drawer"
          >
            <ChevronLeft size={12} />
          </button>
        </div>
      )}

      {/* Re-open Handle Tab (>) when Drawer is Collapsed */}
      {!drawerOpen && (
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="absolute left-[64px] top-1/2 -translate-y-1/2 w-4 h-10 bg-white border border-l-0 border-[#e5e9ee] rounded-r-[8px] shadow-xs flex items-center justify-center text-[#6a7682] hover:text-[#5c4bb8] cursor-pointer z-40"
          title="Expand Drawer"
          aria-label="Expand Drawer"
        >
          <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
};
