import React, { useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { TEMPLATES, TemplateDefinition } from '../../constants/templates';
import { ElementRenderer } from '../canvas/ElementRenderer';
import { ConnectorElement, Page } from '../../types/publisher';
import {
  saveProjectToFile,
  loadProjectFromFile,
  exportToImage,
  triggerPrint,
} from '../../utils/imageExport';
import { exportToPdf } from '../../utils/pdfExport';
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
} from 'lucide-react';

const TemplatePagePreview: React.FC<{
  page: Page;
  maxWidth: number;
  maxHeight: number;
}> = React.memo(({ page, maxWidth, maxHeight }) => {
  const scale = Math.min(maxWidth / page.width, maxHeight / page.height);
  const scaledW = Math.round(page.width * scale);
  const scaledH = Math.round(page.height * scale);
  const connectors = page.elements.filter(
    (el): el is ConnectorElement => el.type === 'connector' && el.visible !== false
  );

  return (
    <div
      className="relative shadow-md border border-slate-200/80 overflow-hidden bg-white flex-shrink-0"
      style={{
        width: `${scaledW}px`,
        height: `${scaledH}px`,
        backgroundColor: page.backgroundColor || '#ffffff',
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isBackstageOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex select-none text-slate-800 animate-in fade-in duration-150">
      {/* Left Backstage Green Navigation Bar */}
      <div className="w-60 bg-gradient-to-b from-[#064e3b] via-[#047857] to-[#065f46] text-white flex flex-col justify-between p-5 flex-shrink-0 shadow-lg">
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

        {/* SECTION: PRINT */}
        {activeSection === 'print' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Print Publication</h1>
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-64 space-y-5">
                <button
                  onClick={() => {
                    setIsBackstageOpen(false);
                    setTimeout(triggerPrint, 300);
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold text-sm transition shadow-md flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  <span>Print Document</span>
                </button>

                <div className="text-xs space-y-2.5 text-slate-600 border-t border-slate-100 pt-4 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pages:</span>
                    <span className="font-bold text-slate-800">{project.pages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Paper Size:</span>
                    <span className="font-bold text-slate-800 capitalize">{project.pageSizeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Orientation:</span>
                    <span className="font-bold text-slate-800 capitalize">{activePage.orientation}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-slate-50 rounded-2xl p-6 flex items-center justify-center border border-dashed border-slate-300">
                <div className="text-center text-slate-400 text-xs">
                  <Printer size={36} className="mx-auto mb-2.5 text-slate-400" />
                  <span>Ready to print: {activePage.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  onClick={async () => {
                    await exportToPdf(project);
                    confetti({ particleCount: 35 });
                  }}
                  className="mt-6 w-full py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Create PDF
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
                </div>
                <button
                  onClick={async () => {
                    await exportToImage(activePage, 'png', activePage.name);
                    confetti({ particleCount: 35 });
                  }}
                  className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Export PNG
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
                  onClick={async () => {
                    await exportToImage(activePage, 'jpeg', activePage.name);
                    confetti({ particleCount: 35 });
                  }}
                  className="mt-6 w-full py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Export JPEG
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: INFO */}
        {activeSection === 'info' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Document Details</h1>
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 text-xs font-medium">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Publication Title:</span>
                <span className="font-bold text-slate-800">{project.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Page Count:</span>
                <span className="font-bold text-slate-800">{project.pages.length}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Canvas Dimensions:</span>
                <span className="font-mono font-bold text-slate-800">
                  {activePage.width} × {activePage.height} px
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Active Theme:</span>
                <span className="font-bold text-slate-800 capitalize">{project.colorScheme}</span>
              </div>
            </div>
          </div>
        )}
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
    </div>
  );
};
