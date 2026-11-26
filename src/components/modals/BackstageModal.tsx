import React, { useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { TEMPLATES, TemplateDefinition } from '../../constants/templates';
import { ElementRenderer } from '../canvas/ElementRenderer';
import { ConnectorElement, Page } from '../../types/publisher';
import {
  saveProjectToFile,
  loadProjectFromFile,
  exportToImage,
} from '../../utils/imageExport';
import { exportToPdf } from '../../utils/pdfExport';
import { buildPatternBackgroundStyle } from '../../utils/patternGenerator';
import {
  DEFAULT_PRINT_SETTINGS,
  PrintSettings,
  chunkPagesIntoSheets,
  executePrintJob,
  parsePageIndices,
} from '../../utils/printUtils';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  FilePlus,
  FolderOpen,
  Save,
  Printer,
  FileDown,
  Image as ImageIcon,
  Info,
  Sparkles,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

const TemplatePagePreview: React.FC<{
  page: Page;
  maxWidth: number;
  maxHeight: number;
  showMargins?: boolean;
  showCropMarks?: boolean;
  grayscale?: boolean;
}> = React.memo(({ page, maxWidth, maxHeight, showMargins, showCropMarks, grayscale }) => {
  const scale = Math.min(maxWidth / page.width, maxHeight / page.height);
  const scaledW = Math.round(page.width * scale);
  const scaledH = Math.round(page.height * scale);
  const connectors = page.elements.filter(
    (el): el is ConnectorElement => el.type === 'connector' && el.visible !== false
  );

  return (
    <div className={`relative flex-shrink-0 ${showCropMarks ? 'p-2.5' : ''}`}>
      {showCropMarks && (
        <>
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-r border-b border-slate-700 pointer-events-none" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-l border-b border-slate-700 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-r border-t border-slate-700 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-l border-t border-slate-700 pointer-events-none" />
        </>
      )}
      <div
        className="relative shadow-md border border-slate-200/80 overflow-hidden bg-white"
        style={{
          width: `${scaledW}px`,
          height: `${scaledH}px`,
          backgroundColor: page.backgroundColor || '#ffffff',
          ...buildPatternBackgroundStyle(page.backgroundPattern, scale),
          filter: grayscale ? 'grayscale(100%)' : undefined,
        }}
      >
        <div
          className="pointer-events-none select-none"
          style={{
            width: `${page.width}px`,
            height: `${page.height}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'relative',
          }}
        >
        {page.elements
          .filter((el) => el.visible !== false && el.type !== 'connector')
          .map((el) => (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: `${el.x}px`,
                top: `${el.y}px`,
                width: `${el.width}px`,
                height: `${el.height}px`,
                transform: `rotate(${el.rotation}deg)`,
                transformOrigin: 'center center',
                zIndex: el.zIndex,
                opacity: el.opacity !== undefined ? el.opacity : 1,
              }}
            >
              <ElementRenderer element={el} isSelected={false} pageNumber={1} totalPages={1} />
            </div>
          ))}

        {connectors.length > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none"
            width={page.width}
            height={page.height}
            style={{ zIndex: 45, overflow: 'visible' }}
          >
            {connectors.map((conn) => {
              const fromEl = page.elements.find((e) => e.id === conn.fromId);
              const toEl = page.elements.find((e) => e.id === conn.toId);
              if (!fromEl || !toEl) return null;
              const x1 = fromEl.x + fromEl.width / 2;
              const y1 = fromEl.y + fromEl.height / 2;
              const x2 = toEl.x + toEl.width / 2;
              const y2 = toEl.y + toEl.height / 2;
              return (
                <line
                  key={conn.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={conn.strokeColor}
                  strokeWidth={conn.strokeWidth || 3}
                />
              );
            })}
            </svg>
          )}

          {showMargins && (
            <div
              className="absolute border border-dashed border-sky-500/80 pointer-events-none"
              style={{
                left: `${page.margins.left}px`,
                top: `${page.margins.top}px`,
                right: `${page.margins.right}px`,
                bottom: `${page.margins.bottom}px`,
                zIndex: 90,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
});

export const BackstageModal: React.FC = () => {
  const {
    project,
    activePage,
    isBackstageOpen,
    setIsBackstageOpen,
    loadTemplate,
    setProject,
  } = usePublisher();

  const [activeSection, setActiveSection] = useState<
    'info' | 'new' | 'open' | 'save' | 'print' | 'export'
  >('new');
  const [templateGroupFilter, setTemplateGroupFilter] = useState<string>('All');
  const [templateSearch, setTemplateSearch] = useState<string>('');
  const [previewTemplate, setPreviewTemplate] = useState<TemplateDefinition | null>(null);

  const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [showPrinterProps, setShowPrinterProps] = useState<boolean>(false);
  const [activeSheetIdx, setActiveSheetIdx] = useState<number>(0);
  const [showAllPrintSheets, setShowAllPrintSheets] = useState<boolean>(false);
  const [isPreparingPrint, setIsPreparingPrint] = useState<boolean>(false);
  const [printCapturePages, setPrintCapturePages] = useState<Page[] | null>(null);
  const [transparentPng, setTransparentPng] = useState<boolean>(false);
  const [isTransparentCapture, setIsTransparentCapture] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isBackstageOpen) return null;

  const resolveSelectedPrintPages = (): Page[] => {
    if (printSettings.rangeMode === 'current') {
      return [activePage];
    }
    if (printSettings.rangeMode === 'custom') {
      const indices = parsePageIndices(printSettings.customRange, project.pages.length);
      return indices.length > 0 ? indices.map((i) => project.pages[i]) : [activePage];
    }
    return project.pages;
  };

  const runWithOffscreenCapture = async (
    pagesToCapture: Page[],
    action: () => Promise<void>,
    transparent = false
  ) => {
    setIsPreparingPrint(true);
    setIsTransparentCapture(transparent);
    setPrintCapturePages(pagesToCapture);

    await new Promise<void>((res) => window.requestAnimationFrame(() => res()));
    await new Promise<void>((res) => window.setTimeout(res, 80));

    try {
      await action();
    } finally {
      setIsPreparingPrint(false);
      setIsTransparentCapture(false);
      setPrintCapturePages(null);
    }
  };

  const handlePrintNow = async () => {
    const pagesToPrint = resolveSelectedPrintPages();
    await runWithOffscreenCapture(pagesToPrint, async () => {
      if (printSettings.printerName === 'Save as PDF') {
        await exportToPdf({ ...project, pages: pagesToPrint }, 'print-capture-');
      } else {
        await executePrintJob(pagesToPrint, printSettings, 'print-capture-');
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex select-none text-slate-800 animate-in fade-in duration-150">
      {/* Left Backstage Indigo Navigation Bar */}
      <div className="w-60 bg-gradient-to-b from-[#312e81] via-[#4338ca] to-[#4f46e5] text-white flex flex-col justify-between p-5 flex-shrink-0 shadow-lg">
        <div className="space-y-6">
          {/* Back button */}
          <button
            onClick={() => setIsBackstageOpen(false)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white text-xs font-semibold w-fit border border-white/20 shadow-xs"
            title="Return to Canvas"
          >
            <ArrowLeft size={16} />
            <span>Back to Canvas</span>
          </button>

          {/* Navigation Items */}
          <nav className="space-y-1.5 pt-1">
            <button
              onClick={() => setActiveSection('new')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeSection === 'new'
                  ? 'bg-white/20 text-white shadow-xs border border-white/25'
                  : 'hover:bg-white/10 text-white/80'
              }`}
            >
              <FilePlus size={16} className="text-indigo-300" />
              <span>New</span>
            </button>

            <button
              onClick={() => setActiveSection('open')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeSection === 'open'
                  ? 'bg-white/20 text-white shadow-xs border border-white/25'
                  : 'hover:bg-white/10 text-white/80'
              }`}
            >
              <FolderOpen size={16} className="text-indigo-300" />
              <span>Open</span>
            </button>

            <button
              onClick={() => setActiveSection('save')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeSection === 'save'
                  ? 'bg-white/20 text-white shadow-xs border border-white/25'
                  : 'hover:bg-white/10 text-white/80'
              }`}
            >
              <Save size={16} className="text-indigo-300" />
              <span>Save As</span>
            </button>

            <button
              onClick={() => setActiveSection('print')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeSection === 'print'
                  ? 'bg-white/20 text-white shadow-xs border border-white/25'
                  : 'hover:bg-white/10 text-white/80'
              }`}
            >
              <Printer size={16} className="text-indigo-300" />
              <span>Print</span>
            </button>

            <button
              onClick={() => setActiveSection('export')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeSection === 'export'
                  ? 'bg-white/20 text-white shadow-xs border border-white/25'
                  : 'hover:bg-white/10 text-white/80'
              }`}
            >
              <FileDown size={16} className="text-indigo-300" />
              <span>Export</span>
            </button>

            <button
              onClick={() => setActiveSection('info')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeSection === 'info'
                  ? 'bg-white/20 text-white shadow-xs border border-white/25'
                  : 'hover:bg-white/10 text-white/80'
              }`}
            >
              <Info size={16} className="text-indigo-300" />
              <span>Info</span>
            </button>
          </nav>
        </div>

        <div className="text-[11px] text-white/70 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <Sparkles size={12} className="text-amber-300" />
            <span>StudioPress</span>
          </div>
          <p className="text-[10px] text-indigo-200/80">Modern Web Studio</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-12 bg-slate-50">
        {/* SECTION: NEW TEMPLATES (Grouped & Categorized) */}
        {activeSection === 'new' && (() => {
          const groupDefs: { label: string; categories: TemplateDefinition['category'][] }[] = [
            { label: 'Web & Branding', categories: ['Hero Banner', 'Logo'] },
            { label: 'Social Media', categories: ['Social Media'] },
            { label: 'Marketing & Flyers', categories: ['Brochure', 'Flyer', 'Poster', 'Postcard'] },
            { label: 'Cards, Menus & Invitations', categories: ['Menu', 'Invitation', 'Business Card'] },
            { label: 'Publications & Resumes', categories: ['Newsletter', 'Resume', 'Certificate'] },
            { label: 'Blank Canvas', categories: ['Blank'] },
          ];

          const filterTabs = ['All', ...groupDefs.map((g) => g.label)];

          const visibleGroups = groupDefs
            .filter((g) => templateGroupFilter === 'All' || g.label === templateGroupFilter)
            .map((g) => ({
              ...g,
              items: TEMPLATES.filter(
                (t) =>
                  g.categories.includes(t.category) &&
                  (t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                    t.category.toLowerCase().includes(templateSearch.toLowerCase()) ||
                    t.description.toLowerCase().includes(templateSearch.toLowerCase()))
              ),
            }))
            .filter((g) => g.items.length > 0);

          return (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Templates Gallery</h1>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Start from {TEMPLATES.length} designer-crafted publication layouts grouped by purpose.
                  </p>
                </div>

                <input
                  type="text"
                  placeholder="Search templates (e.g. menu, poster, resume)..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="w-full md:w-64 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
                />
              </div>

              {/* Category Group Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {filterTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTemplateGroupFilter(tab)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                      templateGroupFilter === tab
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Grouped Template Sections */}
              <div className="space-y-8">
                {visibleGroups.map((group) => (
                  <div key={group.label} className="space-y-3.5">
                    <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                      <h2 className="text-sm font-bold text-slate-700">{group.label}</h2>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600">
                        {group.items.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {group.items.map((tpl) => (
                        <div
                          key={tpl.id}
                          onClick={() => {
                            loadTemplate(tpl.id);
                            confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
                          }}
                          className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-xl hover:border-indigo-500 cursor-pointer transition-all hover:-translate-y-1 group flex flex-col justify-between"
                        >
                          <div>
                            <div
                              className="w-full h-44 rounded-xl mb-3.5 flex items-center justify-center p-3 relative overflow-hidden border border-slate-200/70"
                              style={{
                                background:
                                  tpl.category === 'Blank'
                                    ? '#f1f5f9'
                                    : tpl.thumbnailGradient || '#f1f5f9',
                              }}
                            >
                              <div className="absolute inset-0 bg-white/15" />
                              <div className="relative z-10 transition-transform duration-200 group-hover:scale-[1.03]">
                                {tpl.project.pages[0] && (
                                  <TemplatePagePreview
                                    page={tpl.project.pages[0]}
                                    maxWidth={240}
                                    maxHeight={148}
                                  />
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewTemplate(tpl);
                                }}
                                className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-indigo-600 text-white text-[10.5px] font-semibold opacity-0 group-hover:opacity-100 transition-all shadow-md"
                                title="Full Preview"
                              >
                                <Eye size={12} />
                                <span>Preview</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200/60">
                                {tpl.category}
                              </span>
                              <span className="text-[11px] font-medium text-slate-400">
                                {tpl.project.pages.length}{' '}
                                {tpl.project.pages.length === 1 ? 'Page' : 'Pages'}
                              </span>
                            </div>

                            <h3 className="font-bold text-sm text-slate-800 group-hover:text-indigo-700 transition">
                              {tpl.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {tpl.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-700">
                            <span>Create Publication</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* SECTION: OPEN */}
        {activeSection === 'open' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Open Publication</h1>
            <div className="bg-white p-10 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto shadow-xs">
                <FolderOpen size={32} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-800">Open from your device</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Select a saved StudioPress project file (.pub)
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept=".pub,.json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const loaded = await loadProjectFromFile(file);
                      setProject(loaded);
                      setIsBackstageOpen(false);
                      confetti({ particleCount: 40 });
                    } catch (err) {
                      alert('Error loading publication: ' + (err as Error).message);
                    }
                  }
                }}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-semibold text-xs transition shadow-sm"
              >
                Browse Files...
              </button>
            </div>
          </div>
        )}

        {/* SECTION: SAVE AS */}
        {activeSection === 'save' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Save Publication</h1>
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  File Name
                </label>
                <input
                  type="text"
                  value={project.name}
                  onChange={(e) => (project.name = e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    saveProjectToFile(project);
                    setIsBackstageOpen(false);
                  }}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-semibold text-xs transition shadow-sm flex items-center gap-2"
                >
                  <Save size={14} />
                  <span>Download .pub File</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: PRINT PUBLICATION */}
        {activeSection === 'print' && (() => {
          const selectedPages = resolveSelectedPrintPages();
          const sheets = chunkPagesIntoSheets(selectedPages, printSettings.pagesPerSheet);
          const safeSheetIdx = Math.min(activeSheetIdx, Math.max(0, sheets.length - 1));
          const displayedSheets = showAllPrintSheets ? sheets : [sheets[safeSheetIdx]].filter(Boolean);

          return (
            <div className="max-w-5xl mx-auto space-y-5">
              <div className="flex items-end justify-between flex-wrap gap-2">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                    Print Publication
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure sheet imposition, grayscale ink proofing, trim marks, and print directly.
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200/70">
                  {selectedPages.length} {selectedPages.length === 1 ? 'Page' : 'Pages'} • {sheets.length}{' '}
                  {sheets.length === 1 ? 'Sheet' : 'Sheets'}
                </span>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                {/* Left Column: Print Settings */}
                <div className="lg:col-span-4 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 space-y-4">
                  {/* Primary Actions */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={isPreparingPrint}
                      onClick={handlePrintNow}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 active:scale-95 text-white rounded-xl font-bold text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isPreparingPrint ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Preparing Sheets...</span>
                        </>
                      ) : (
                        <>
                          <Printer size={18} />
                          <span>Print Document</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isPreparingPrint}
                      onClick={() =>
                        runWithOffscreenCapture(project.pages, async () => {
                          await exportToPdf(project, 'print-capture-');
                          confetti({ particleCount: 35 });
                        })
                      }
                      className="w-full py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <FileDown size={14} className="text-rose-600" />
                      <span>Export Print-Ready PDF</span>
                    </button>
                  </div>

                  {/* Printer Selector & Properties */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Printer
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPrinterProps(!showPrinterProps)}
                        className="text-[10.5px] font-bold text-indigo-700 hover:underline"
                      >
                        {showPrinterProps ? 'Hide Properties' : 'Printer Properties'}
                      </button>
                    </div>
                    <select
                      value={printSettings.printerName}
                      onChange={(e) =>
                        setPrintSettings((s) => ({
                          ...s,
                          printerName: e.target.value as PrintSettings['printerName'],
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="System Print Dialog">System Print Dialog (Default)</option>
                      <option value="Save as PDF">Save as PDF (Direct Download)</option>
                      <option value="Office Color LaserJet">Office Color LaserJet</option>
                      <option value="Photo Inkjet Pro">Photo Inkjet Pro</option>
                    </select>

                    {showPrinterProps && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-[11px]">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                              Paper Size
                            </label>
                            <select
                              value={printSettings.paperSize}
                              onChange={(e) =>
                                setPrintSettings((s) => ({
                                  ...s,
                                  paperSize: e.target.value as PrintSettings['paperSize'],
                                }))
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium outline-none"
                            >
                              <option value="auto">Auto-Match</option>
                              <option value="letter">Letter (8.5×11&quot;)</option>
                              <option value="a4">A4 (210×297mm)</option>
                              <option value="legal">Legal</option>
                              <option value="tabloid">Tabloid (11×17&quot;)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                              Quality
                            </label>
                            <select
                              value={printSettings.qualityDpi}
                              onChange={(e) =>
                                setPrintSettings((s) => ({
                                  ...s,
                                  qualityDpi: Number(e.target.value) as PrintSettings['qualityDpi'],
                                }))
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium outline-none"
                            >
                              <option value={150}>Draft (150 DPI)</option>
                              <option value={300}>Standard (300 DPI)</option>
                              <option value={600}>High (600 DPI)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                              Duplex / Sides
                            </label>
                            <select
                              value={printSettings.duplex}
                              onChange={(e) =>
                                setPrintSettings((s) => ({
                                  ...s,
                                  duplex: e.target.value as PrintSettings['duplex'],
                                }))
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium outline-none"
                            >
                              <option value="one-sided">One-Sided</option>
                              <option value="long-edge">2-Sided (Long)</option>
                              <option value="short-edge">2-Sided (Short)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                              Scale Mode
                            </label>
                            <select
                              value={printSettings.scaleMode}
                              onChange={(e) =>
                                setPrintSettings((s) => ({
                                  ...s,
                                  scaleMode: e.target.value as PrintSettings['scaleMode'],
                                }))
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium outline-none"
                            >
                              <option value="fit">Fit to Paper</option>
                              <option value="actual">Actual (100%)</option>
                              <option value="fill">Fill Sheet</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Copies */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-600">Copies</label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={printSettings.copies}
                      onChange={(e) =>
                        setPrintSettings((s) => ({
                          ...s,
                          copies: Math.max(1, Math.min(99, Number(e.target.value) || 1)),
                        }))
                      }
                      className="w-20 px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-center outline-none focus:border-indigo-600"
                    />
                  </div>

                  {/* Page Range */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Pages to Print
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                      {(
                        [
                          { id: 'all', label: `All (${project.pages.length})` },
                          { id: 'current', label: `Current (#${project.activePageIndex + 1})` },
                          { id: 'custom', label: 'Custom' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setPrintSettings((s) => ({ ...s, rangeMode: opt.id }));
                            setActiveSheetIdx(0);
                          }}
                          className={`py-1 px-1.5 rounded-lg text-[10.5px] font-semibold transition ${
                            printSettings.rangeMode === opt.id
                              ? 'bg-white text-indigo-800 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {printSettings.rangeMode === 'custom' && (
                      <input
                        type="text"
                        value={printSettings.customRange}
                        onChange={(e) => {
                          setPrintSettings((s) => ({ ...s, customRange: e.target.value }));
                          setActiveSheetIdx(0);
                        }}
                        placeholder="e.g. 1, 3-4"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono outline-none focus:border-indigo-600"
                      />
                    )}
                  </div>

                  {/* Color Mode */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Color &amp; Ink Proof
                    </label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                      {(
                        [
                          { id: 'color', label: 'Full Color' },
                          { id: 'grayscale', label: 'B&W Grayscale' },
                        ] as const
                      ).map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() =>
                            setPrintSettings((s) => ({ ...s, colorMode: mode.id }))
                          }
                          className={`py-1.5 rounded-lg text-[11px] font-semibold transition ${
                            printSettings.colorMode === mode.id
                              ? 'bg-white text-indigo-800 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sheet Layout (Pages Per Sheet) */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Pages Per Sheet
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                      {([1, 2, 4] as const).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => {
                            setPrintSettings((s) => ({ ...s, pagesPerSheet: n }));
                            setActiveSheetIdx(0);
                          }}
                          className={`py-1.5 rounded-lg text-[11px] font-semibold transition ${
                            printSettings.pagesPerSheet === n
                              ? 'bg-white text-indigo-800 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {n === 1 ? '1-Up' : n === 2 ? '2-Up' : '4-Up Grid'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prepress Marks & Guides */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Prepress &amp; Proof Overlays
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printSettings.showCropMarks}
                        onChange={(e) =>
                          setPrintSettings((s) => ({ ...s, showCropMarks: e.target.checked }))
                        }
                        className="accent-indigo-600 rounded"
                      />
                      <span>Corner Crop / Trim Marks</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printSettings.showMarginBox}
                        onChange={(e) =>
                          setPrintSettings((s) => ({ ...s, showMarginBox: e.target.checked }))
                        }
                        className="accent-indigo-600 rounded"
                      />
                      <span>Show Safe Margin Box (Preview)</span>
                    </label>
                  </div>
                </div>

                {/* Right Column: Live Print Sheet Preview Stage */}
                <div className="lg:col-span-8 bg-slate-100/90 p-6 flex flex-col justify-between gap-4 min-h-[480px]">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">
                        Live Print Sheet Preview
                      </span>
                      {printSettings.colorMode === 'grayscale' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-white font-semibold">
                          B&amp;W Proof
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {sheets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setShowAllPrintSheets(!showAllPrintSheets)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${
                            showAllPrintSheets
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {showAllPrintSheets ? 'Single Sheet' : 'View All Sheets'}
                        </button>
                      )}

                      {!showAllPrintSheets && sheets.length > 1 && (
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5">
                          <button
                            type="button"
                            disabled={safeSheetIdx === 0}
                            onClick={() => setActiveSheetIdx((i) => Math.max(0, i - 1))}
                            className="p-0.5 text-slate-600 disabled:opacity-30 hover:text-indigo-700"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <span className="text-[11px] font-mono font-bold text-slate-700 px-1">
                            Sheet {safeSheetIdx + 1}/{sheets.length}
                          </span>
                          <button
                            type="button"
                            disabled={safeSheetIdx >= sheets.length - 1}
                            onClick={() =>
                              setActiveSheetIdx((i) => Math.min(sheets.length - 1, i + 1))
                            }
                            className="p-0.5 text-slate-600 disabled:opacity-30 hover:text-indigo-700"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Physical Print Sheet Display */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-6 overflow-y-auto py-2">
                    {displayedSheets.map((sheetPages, sIdx) => {
                      const cols = printSettings.pagesPerSheet === 1 ? 1 : 2;
                      const perPgW =
                        printSettings.pagesPerSheet === 1
                          ? showAllPrintSheets
                            ? 320
                            : 420
                          : printSettings.pagesPerSheet === 2
                          ? 220
                          : 185;
                      const perPgH =
                        printSettings.pagesPerSheet === 1
                          ? showAllPrintSheets
                            ? 340
                            : 440
                          : printSettings.pagesPerSheet === 2
                          ? 290
                          : 185;

                      return (
                        <div key={sIdx} className="flex flex-col items-center gap-1.5">
                          <div
                            className="bg-white rounded-md shadow-xl border border-slate-300/90 p-5 grid gap-4 place-items-center"
                            style={{
                              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                            }}
                          >
                            {sheetPages.map((pg) => (
                              <div key={pg.id} className="flex flex-col items-center gap-1">
                                <TemplatePagePreview
                                  page={pg}
                                  maxWidth={perPgW}
                                  maxHeight={perPgH}
                                  showMargins={printSettings.showMarginBox}
                                  showCropMarks={printSettings.showCropMarks}
                                  grayscale={printSettings.colorMode === 'grayscale'}
                                />
                                {printSettings.pagesPerSheet > 1 && (
                                  <span className="text-[9.5px] font-medium text-slate-400">
                                    {pg.name}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                          <span className="text-[10.5px] font-medium text-slate-500">
                            Sheet {showAllPrintSheets ? sIdx + 1 : safeSheetIdx + 1} •{' '}
                            {sheetPages.map((p) => p.name).join(' + ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* SECTION: EXPORT */}
        {activeSection === 'export' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Export & Publish</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* PDF */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
                    <FileDown size={24} />
                  </div>
                  <h3 className="font-bold text-sm text-slate-800">Commercial PDF</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Export high-resolution multi-page PDF document ready for commercial printing.
                  </p>
                </div>
                <button
                  disabled={isPreparingPrint}
                  onClick={() =>
                    runWithOffscreenCapture(project.pages, async () => {
                      await exportToPdf(project, 'print-capture-');
                      confetti({ particleCount: 35 });
                    })
                  }
                  className="mt-6 w-full py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {isPreparingPrint ? 'Exporting...' : 'Create PDF'}
                </button>
              </div>

              {/* PNG */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <ImageIcon size={24} />
                  </div>
                  <h3 className="font-bold text-sm text-slate-800">PNG Image (300 DPI)</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Lossless high-definition raster image of the currently selected page.
                  </p>
                  <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={transparentPng}
                      onChange={(e) => setTransparentPng(e.target.checked)}
                      className="accent-indigo-600 rounded"
                    />
                    <span>Transparent Background</span>
                  </label>
                </div>
                <button
                  disabled={isPreparingPrint}
                  onClick={() =>
                    runWithOffscreenCapture(
                      [activePage],
                      async () => {
                        await exportToImage(
                          activePage,
                          'png',
                          activePage.name,
                          'print-capture-',
                          transparentPng
                        );
                        confetti({ particleCount: 35 });
                      },
                      transparentPng
                    )
                  }
                  className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {isPreparingPrint ? 'Exporting...' : 'Export PNG'}
                </button>
              </div>

              {/* JPEG */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                    <ImageIcon size={24} />
                  </div>
                  <h3 className="font-bold text-sm text-slate-800">JPEG Graphic</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Compressed web-ready image format optimal for email newsletters and websites.
                  </p>
                </div>
                <button
                  disabled={isPreparingPrint}
                  onClick={() =>
                    runWithOffscreenCapture([activePage], async () => {
                      await exportToImage(activePage, 'jpeg', activePage.name, 'print-capture-');
                      confetti({ particleCount: 35 });
                    })
                  }
                  className="mt-6 w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {isPreparingPrint ? 'Exporting...' : 'Export JPEG'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: INFO */}
        {activeSection === 'info' && (() => {
          const allElements = project.pages.flatMap((pg) => pg.elements);
          const textCount = allElements.filter((e) => e.type === 'text').length;
          const shapeCount = allElements.filter((e) => e.type === 'shape').length;
          const imageCount = allElements.filter((e) => e.type === 'image').length;
          const qrCount = allElements.filter((e) => e.type === 'qr').length;
          const connectorCount = allElements.filter((e) => e.type === 'connector').length;

          const usedFonts = Array.from(
            new Set(
              allElements
                .filter((e) => e.type === 'text')
                .map((e) => (e as { fontFamily: string }).fontFamily)
                .filter(Boolean)
            )
          );

          const emptyImages = allElements.filter(
            (e) => e.type === 'image' && !(e as { src: string }).src
          ).length;
          const defaultQrCount = allElements.filter(
            (e) => e.type === 'qr' && (e as { value: string }).value === 'https://example.com'
          ).length;
          const approxKb = Math.max(1, Math.round(JSON.stringify(project).length / 1024));

          return (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                    Publication Info &amp; Preflight
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Inspect document properties, fonts, element counts, and print readiness.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => saveProjectToFile(project)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Save .pub</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('print')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Printer size={14} />
                    <span>Print Preview</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Document Properties Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 text-xs">
                  <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                    Document Properties
                  </h2>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">
                      Publication Title (Editable)
                    </label>
                    <input
                      type="text"
                      value={project.name}
                      onChange={(e) =>
                        setProject({ ...project, name: e.target.value || 'Untitled.pub' })
                      }
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-bold text-slate-800 outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Artboards / Pages:</span>
                    <span className="font-bold text-slate-800">{project.pages.length}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Active Page Size:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {activePage.width} × {activePage.height} px ({activePage.orientation})
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Estimated Project Size:</span>
                    <span className="font-mono font-bold text-slate-800">{approxKb} KB</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Active Theme:</span>
                    <span className="font-bold text-slate-800 capitalize">{project.colorScheme}</span>
                  </div>
                </div>

                {/* Elements & Preflight Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 text-xs">
                  <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                    Content &amp; Preflight Check
                  </h2>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Text Boxes', count: textCount },
                      { label: 'Shapes', count: shapeCount },
                      { label: 'Images', count: imageCount },
                      { label: 'QR Codes', count: qrCount },
                      { label: 'Connectors', count: connectorCount },
                      { label: 'Total Items', count: allElements.length },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center"
                      >
                        <div className="text-base font-extrabold text-indigo-700">{stat.count}</div>
                        <div className="text-[10px] font-semibold text-slate-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Used Fonts */}
                  <div className="space-y-1.5 pt-1">
                    <span className="block text-[11px] font-semibold text-slate-400">
                      Fonts Used ({usedFonts.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {usedFonts.length > 0 ? (
                        usedFonts.map((f) => (
                          <span
                            key={f}
                            className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200/60 text-[10.5px] font-semibold"
                          >
                            {f}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[11px]">No text elements yet</span>
                      )}
                    </div>
                  </div>

                  {/* Preflight Status */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    {emptyImages === 0 && defaultQrCount === 0 ? (
                      <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-[11px]">
                        ✓ Preflight Passed — No empty photo placeholders or default QR links.
                      </div>
                    ) : (
                      <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] space-y-0.5">
                        {emptyImages > 0 && (
                          <div>• {emptyImages} empty photo placeholder(s) need an image.</div>
                        )}
                        {defaultQrCount > 0 && (
                          <div>• {defaultQrCount} QR code(s) still point to https://example.com.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Full Template Preview Lightbox */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-6"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    {previewTemplate.category}
                  </span>
                  <h2 className="text-lg font-bold text-slate-800">{previewTemplate.name}</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{previewTemplate.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    loadTemplate(previewTemplate.id);
                    setPreviewTemplate(null);
                    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  Use This Template
                </button>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition"
                  title="Close Preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex flex-wrap items-start justify-center gap-6">
              {previewTemplate.project.pages.map((pg, idx) => (
                <div key={pg.id} className="flex flex-col items-center gap-2">
                  <TemplatePagePreview page={pg} maxWidth={440} maxHeight={520} />
                  <span className="text-[11px] font-semibold text-slate-500">
                    Page {idx + 1}: {pg.name || `Page ${idx + 1}`} ({pg.width}×{pg.height}px)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Offscreen Full-Resolution Staging Container for Multi-Page Print Capture */}
      {printCapturePages && (
        <div
          style={{
            position: 'fixed',
            left: '-100000px',
            top: 0,
            pointerEvents: 'none',
            opacity: 1,
          }}
        >
          {printCapturePages.map((pg, idx) => {
            const connectors = pg.elements.filter(
              (el): el is ConnectorElement => el.type === 'connector' && el.visible !== false
            );
            return (
              <div
                key={`cap-${pg.id}`}
                id={`print-capture-${pg.id}`}
                style={{
                  position: 'relative',
                  width: `${pg.width}px`,
                  height: `${pg.height}px`,
                  backgroundColor: isTransparentCapture ? 'transparent' : pg.backgroundColor || '#ffffff',
                  ...(isTransparentCapture ? {} : buildPatternBackgroundStyle(pg.backgroundPattern)),
                  overflow: 'hidden',
                }}
              >
                {pg.elements
                  .filter((el) => el.visible !== false && el.type !== 'connector')
                  .map((el) => (
                    <div
                      key={el.id}
                      style={{
                        position: 'absolute',
                        left: `${el.x}px`,
                        top: `${el.y}px`,
                        width: `${el.width}px`,
                        height: `${el.height}px`,
                        transform: `rotate(${el.rotation}deg)`,
                        transformOrigin: 'center center',
                        zIndex: el.zIndex,
                        opacity: el.opacity !== undefined ? el.opacity : 1,
                      }}
                    >
                      <ElementRenderer
                        element={el}
                        isSelected={false}
                        pageNumber={idx + 1}
                        totalPages={project.pages.length}
                      />
                    </div>
                  ))}
                {connectors.length > 0 && (
                  <svg
                    width={pg.width}
                    height={pg.height}
                    style={{ position: 'absolute', inset: 0, zIndex: 45, overflow: 'visible' }}
                  >
                    {connectors.map((conn) => {
                      const fromEl = pg.elements.find((e) => e.id === conn.fromId);
                      const toEl = pg.elements.find((e) => e.id === conn.toId);
                      if (!fromEl || !toEl) return null;
                      return (
                        <line
                          key={conn.id}
                          x1={fromEl.x + fromEl.width / 2}
                          y1={fromEl.y + fromEl.height / 2}
                          x2={toEl.x + toEl.width / 2}
                          y2={toEl.y + toEl.height / 2}
                          stroke={conn.strokeColor}
                          strokeWidth={conn.strokeWidth || 3}
                        />
                      );
                    })}
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
