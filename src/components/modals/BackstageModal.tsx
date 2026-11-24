import React, { useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { TEMPLATES } from '../../constants/templates';
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
  CheckCircle,
} from 'lucide-react';

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isBackstageOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex select-none text-slate-800 animate-in fade-in duration-150">
      {/* Left Backstage Green Navigation Bar */}
      <div className="w-56 bg-[#0f6b4e] text-white flex flex-col justify-between p-4 flex-shrink-0">
        <div className="space-y-4">
          {/* Back button */}
          <button
            onClick={() => setIsBackstageOpen(false)}
            className="flex items-center gap-2 p-2 rounded-full hover:bg-white/20 transition text-white w-fit"
            title="Return to Document"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Navigation Items */}
          <nav className="space-y-1 pt-2">
            <button
              onClick={() => setActiveSection('info')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold tracking-wide transition ${
                activeSection === 'info' ? 'bg-[#0b533c] text-white shadow-sm' : 'hover:bg-white/10 text-white/90'
              }`}
            >
              <Info size={16} />
              <span>Info</span>
            </button>

            <button
              onClick={() => setActiveSection('new')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold tracking-wide transition ${
                activeSection === 'new' ? 'bg-[#0b533c] text-white shadow-sm' : 'hover:bg-white/10 text-white/90'
              }`}
            >
              <FilePlus size={16} />
              <span>New</span>
            </button>

            <button
              onClick={() => setActiveSection('open')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold tracking-wide transition ${
                activeSection === 'open' ? 'bg-[#0b533c] text-white shadow-sm' : 'hover:bg-white/10 text-white/90'
              }`}
            >
              <FolderOpen size={16} />
              <span>Open</span>
            </button>

            <button
              onClick={() => setActiveSection('save')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold tracking-wide transition ${
                activeSection === 'save' ? 'bg-[#0b533c] text-white shadow-sm' : 'hover:bg-white/10 text-white/90'
              }`}
            >
              <Save size={16} />
              <span>Save As</span>
            </button>

            <button
              onClick={() => setActiveSection('print')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold tracking-wide transition ${
                activeSection === 'print' ? 'bg-[#0b533c] text-white shadow-sm' : 'hover:bg-white/10 text-white/90'
              }`}
            >
              <Printer size={16} />
              <span>Print</span>
            </button>

            <button
              onClick={() => setActiveSection('export')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold tracking-wide transition ${
                activeSection === 'export' ? 'bg-[#0b533c] text-white shadow-sm' : 'hover:bg-white/10 text-white/90'
              }`}
            >
              <FileDown size={16} />
              <span>Export</span>
            </button>
          </nav>
        </div>

        <div className="text-[11px] text-white/60">
          <p className="font-semibold text-white/80">Microsoft Publisher</p>
          <p>Version 2026 Clone Edition</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-10 bg-[#f8fafc]">
        {/* SECTION: NEW TEMPLATES */}
        {activeSection === 'new' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-light text-slate-800">Featured Templates</h1>
              <p className="text-xs text-slate-500 mt-1">
                Choose from professionally designed publication templates or start from scratch.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => {
                    loadTemplate(tpl.id);
                    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
                  }}
                  className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-[#0f6b4e] cursor-pointer transition group flex flex-col justify-between"
                >
                  <div>
                    {/* Visual Card Banner */}
                    <div
                      className="w-full h-36 rounded-md mb-3 flex items-center justify-center text-white font-bold p-3 relative overflow-hidden"
                      style={{ backgroundColor: tpl.thumbnailColor }}
                    >
                      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
                      <span className="text-center text-base drop-shadow z-10">{tpl.name}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-[#0f6b4e]">
                        {tpl.category}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {tpl.project.pages.length} {tpl.project.pages.length === 1 ? 'Page' : 'Pages'}
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm text-slate-800 group-hover:text-[#0f6b4e] transition">
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tpl.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0f6b4e]">
                    <span>Create Publication</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: OPEN */}
        {activeSection === 'open' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-light text-slate-800">Open Publication</h1>
            <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm text-center space-y-4">
              <FolderOpen size={48} className="mx-auto text-[#0f6b4e]" />
              <div>
                <h3 className="font-semibold text-base text-slate-800">Open from your computer</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Select a saved Microsoft Publisher project file (.pub)
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
                className="px-6 py-2 bg-[#0f6b4e] text-white rounded font-medium text-xs hover:bg-[#0c533c] transition shadow-sm"
              >
                Browse Files...
              </button>
            </div>
          </div>
        )}

        {/* SECTION: SAVE AS */}
        {activeSection === 'save' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-light text-slate-800">Save Publication</h1>
            <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Publication File Name
                </label>
                <input
                  type="text"
                  value={project.name}
                  onChange={(e) => (project.name = e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-[#0f6b4e]"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    saveProjectToFile(project);
                    setIsBackstageOpen(false);
                  }}
                  className="px-6 py-2 bg-[#0f6b4e] text-white rounded font-medium text-xs hover:bg-[#0c533c] transition shadow-sm flex items-center gap-2"
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
            <h1 className="text-2xl font-light text-slate-800">Print Publication</h1>
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-64 space-y-4">
                <button
                  onClick={() => {
                    setIsBackstageOpen(false);
                    setTimeout(triggerPrint, 300);
                  }}
                  className="w-full py-3 bg-[#0f6b4e] text-white rounded font-semibold text-sm hover:bg-[#0c533c] transition shadow flex items-center justify-center gap-2"
                >
                  <Printer size={18} />
                  <span>Print Now</span>
                </button>

                <div className="text-xs space-y-2 text-slate-600 border-t border-slate-200 pt-3">
                  <div>
                    <span className="font-semibold">Pages:</span> {project.pages.length}
                  </div>
                  <div>
                    <span className="font-semibold">Paper Size:</span> {project.pageSizeName}
                  </div>
                  <div>
                    <span className="font-semibold">Orientation:</span> {activePage.orientation}
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-slate-100 rounded p-4 flex items-center justify-center border border-dashed border-slate-300">
                <div className="text-center text-slate-400 text-xs">
                  <Printer size={32} className="mx-auto mb-2 text-slate-400" />
                  <span>Print preview prepared for {activePage.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: EXPORT */}
        {activeSection === 'export' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-light text-slate-800">Export & Publish</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* PDF */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <FileDown size={32} className="text-red-600 mb-2" />
                  <h3 className="font-semibold text-sm text-slate-800">PDF Document</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Export high-resolution vector PDF with all pages ready for commercial printing.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await exportToPdf(project);
                    confetti({ particleCount: 30 });
                  }}
                  className="mt-6 w-full py-2 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition"
                >
                  Create PDF
                </button>
              </div>

              {/* PNG */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <ImageIcon size={32} className="text-blue-600 mb-2" />
                  <h3 className="font-semibold text-sm text-slate-800">PNG Image (300 DPI)</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Export current active page as lossless high-definition raster PNG.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await exportToImage(activePage, 'png', activePage.name);
                    confetti({ particleCount: 30 });
                  }}
                  className="mt-6 w-full py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition"
                >
                  Export PNG
                </button>
              </div>

              {/* JPEG */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <ImageIcon size={32} className="text-amber-600 mb-2" />
                  <h3 className="font-semibold text-sm text-slate-800">JPEG Photo</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Optimized web JPEG image ideal for social media sharing and email.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await exportToImage(activePage, 'jpeg', activePage.name);
                    confetti({ particleCount: 30 });
                  }}
                  className="mt-6 w-full py-2 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700 transition"
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
            <h1 className="text-2xl font-light text-slate-800">Document Information</h1>
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-600">Publication Name:</span>
                <span className="text-slate-800">{project.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-600">Pages Count:</span>
                <span className="text-slate-800">{project.pages.length}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-600">Page Dimensions:</span>
                <span className="text-slate-800">
                  {activePage.width} × {activePage.height} px
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-semibold text-slate-600">Color Palette:</span>
                <span className="text-slate-800 capitalize">{project.colorScheme}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
