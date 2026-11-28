import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Grid3x3, Image as ImageIcon, Printer, Scaling, X } from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import type { DocumentProject, ImageElement, Page } from '../../types/publisher';
import {
  DEFAULT_PRINT_SETTINGS,
  computeTarpapelMetrics,
  suggestTarpapelGrid,
  type PrintSettings,
} from '../../utils/printUtils';
import { exportTarpapelPdf } from '../../utils/pdfExport';

/**
 * Print as Tarpaulin.
 *
 * The premise: every design in the workspace can become a tarpapel. So the modal does not ask what
 * kind of document it is — one page from any open tab, or an image from disk, is a source like any
 * other. The printing itself is not implemented here: `computeTarpapelMetrics` sizes it,
 * `exportTarpapelPdf` slices and writes it. This file is a door, not a second engine.
 */

const GRID_PRESETS: Array<{ c: number; r: number }> = [
  { c: 2, r: 2 },
  { c: 2, r: 3 },
  { c: 3, r: 2 },
  { c: 4, r: 2 },
  { c: 3, r: 3 },
  { c: 4, r: 3 },
];

const OVERLAP_OPTIONS: Array<{ value: PrintSettings['tarpapelOverlapIn']; label: string }> = [
  { value: 0, label: 'None' },
  { value: 0.25, label: '6 mm' },
  { value: 0.5, label: '13 mm' },
  { value: 0.75, label: '19 mm' },
];

const MARGIN_OPTIONS: Array<{ value: PrintSettings['tarpapelMarginIn']; label: string }> = [
  { value: 0, label: 'Borderless' },
  { value: 0.25, label: '6 mm' },
  { value: 0.5, label: '13 mm' },
];

const PAPER_OPTIONS: Array<{ value: PrintSettings['paperSize']; label: string }> = [
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
  { value: 'legal', label: 'Legal' },
  { value: 'a3', label: 'A3' },
];

function projectFromImage(src: string, w: number, h: number, name: string): DocumentProject {
  const element: ImageElement = {
    id: 'tarpapel-source-image',
    type: 'image',
    name,
    src,
    x: 0,
    y: 0,
    width: w,
    height: h,
    rotation: 0,
    zIndex: 1,
  };
  const page: Page = {
    id: 'tarpapel-source-page',
    name: 'Image',
    width: w,
    height: h,
    orientation: w >= h ? 'landscape' : 'portrait',
    backgroundColor: '#ffffff',
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
    guides: [],
    elements: [element],
  };
  return {
    id: 'tarpapel-image-project',
    name,
    pages: [page],
    activePageIndex: 0,
    pageSizeName: 'custom',
    colorScheme: 'clean',
  };
}

export const TarpapelModal: React.FC = () => {
  const {
    project,
    workspaceTabs,
    activeTabId,
    isTarpapelModalOpen,
    setIsTarpapelModalOpen,
    printSettings,
    setPrintSettings,
  } = usePublisher();

  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [sourceKey, setSourceKey] = useState<string>('active');
  const [pageIndex, setPageIndex] = useState(0);
  const [imported, setImported] = useState<DocumentProject | null>(null);
  const [gridTouched, setGridTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start from whatever the print panel last used, so the two doors never disagree.
  useEffect(() => {
    if (!isTarpapelModalOpen) return;
    setSettings({
      ...printSettings,
      printMode: 'tarpapel',
      paperSize: printSettings.paperSize === 'auto' ? 'a4' : printSettings.paperSize,
    });
    setGridTouched(false);
    setError(null);
    setPageIndex(0);
  }, [isTarpapelModalOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isTarpapelModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsTarpapelModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isTarpapelModalOpen, setIsTarpapelModalOpen]);

  const otherTabs = useMemo(
    () => workspaceTabs.filter((t) => t.id !== activeTabId),
    [workspaceTabs, activeTabId]
  );

  const sourceProject: DocumentProject | null = useMemo(() => {
    if (sourceKey === 'image') return imported;
    if (sourceKey === 'active') return project;
    return workspaceTabs.find((t) => t.id === sourceKey)?.project ?? null;
  }, [sourceKey, imported, project, workspaceTabs]);

  const sourcePage: Page | null = useMemo(() => {
    if (!sourceProject) return null;
    const page = sourceProject.pages[pageIndex] ?? sourceProject.pages[0];
    return page ?? null;
  }, [sourceProject, pageIndex]);

  const metrics = useMemo(
    () => (sourcePage ? computeTarpapelMetrics(sourcePage, settings) : null),
    [sourcePage, settings]
  );

  const suggestion = useMemo(
    () => (sourcePage ? suggestTarpapelGrid(sourcePage, settings) : null),
    [sourcePage, settings]
  );

  // A fresh source picks its own grid, unless the teacher has already chosen one.
  useEffect(() => {
    if (!suggestion || gridTouched) return;
    setSettings((s) =>
      s.tarpapelCols === suggestion.cols && s.tarpapelRows === suggestion.rows
        ? s
        : { ...s, tarpapelCols: suggestion.cols, tarpapelRows: suggestion.rows }
    );
  }, [suggestion, gridTouched]);

  if (!isTarpapelModalOpen) return null;

  const designAspect = sourcePage ? sourcePage.width / Math.max(1, sourcePage.height) : 1;
  const posterAspect = metrics ? metrics.totalPosterWIn / Math.max(0.1, metrics.totalPosterHIn) : 1;
  const isTaller = designAspect >= posterAspect; // design wider than poster → bands top & bottom
  const coverFraction = isTaller ? posterAspect / designAspect : designAspect / posterAspect;
  const padPercent = Math.round((1 - coverFraction) * 100);

  const patch = (next: Partial<PrintSettings>) => setSettings((s) => ({ ...s, ...next }));

  const applySuggestion = () => {
    if (!suggestion) return;
    setGridTouched(true);
    patch({ tarpapelCols: suggestion.cols, tarpapelRows: suggestion.rows });
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || '');
      const probe = new window.Image();
      probe.onload = () => {
        const w = probe.naturalWidth || 1600;
        const h = probe.naturalHeight || 1200;
        setImported(projectFromImage(src, w, h, file.name.replace(/\.[^.]+$/, '')));
        setSourceKey('image');
        setPageIndex(0);
        setGridTouched(false);
      };
      probe.onerror = () => setError('That file could not be read as an image.');
      probe.src = src;
    };
    reader.onerror = () => setError('That file could not be read.');
    reader.readAsDataURL(file);
  };

  const handleExport = async () => {
    if (!sourcePage || !sourceProject) {
      setSourceKey('image');
      fileInputRef.current?.click();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setPrintSettings({ ...settings, printMode: 'tarpapel' });
      await exportTarpapelPdf(sourceProject, sourcePage, settings);
      setIsTarpapelModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The poster could not be written.');
    } finally {
      setBusy(false);
    }
  };

  const sourceChips: Array<{ key: string; label: string; sub: string }> = [
    {
      key: 'active',
      label: project.name || 'Current page',
      sub: `${project.pages.length} page${project.pages.length === 1 ? '' : 's'}`,
    },
    ...otherTabs.map((t) => ({
      key: t.id,
      label: t.project.name || 'Untitled',
      sub: `${t.project.pages.length} page${t.project.pages.length === 1 ? '' : 's'}`,
    })),
  ];
  if (imported) sourceChips.push({ key: 'image', label: imported.name, sub: 'Imported image' });

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onClick={() => setIsTarpapelModalOpen(false)}
    >
      <div
        className="w-full max-w-3xl max-h-[88vh] overflow-hidden bg-white rounded-2xl shadow-2xl border border-[#e5e9ee] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e5e9ee]">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Printer size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-[#161a22] leading-tight">Print as Tarpaulin</h2>
            <p className="text-[11px] text-[#5b6673]">
              Any design in the workspace, on ordinary sheets — glue the overlap and it becomes one
              poster.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsTarpapelModalOpen(false)}
            className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* 1 · Source */}
          <section>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                1 · What are we printing
              </h3>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#5c4bb8] hover:underline cursor-pointer"
              >
                <ImageIcon size={12} /> Import image…
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sourceChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => {
                    setSourceKey(chip.key);
                    setPageIndex(0);
                    setGridTouched(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition cursor-pointer ${
                    sourceKey === chip.key
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  <span className="block text-[11px] font-bold leading-tight max-w-[190px] truncate">
                    {chip.label}
                  </span>
                  <span
                    className={`block text-[9.5px] leading-tight ${
                      sourceKey === chip.key ? 'text-amber-50' : 'text-slate-500'
                    }`}
                  >
                    {chip.sub}
                  </span>
                </button>
              ))}
            </div>
            {sourceKey === 'image' && !imported && (
              <p className="mt-1.5 text-[10.5px] text-slate-500">
                Pick a JPG or PNG — a Canva export, a finished tarpaulin, anything.
              </p>
            )}
            {sourceProject && sourceProject.pages.length > 1 && (
              <div className="mt-2 flex items-center gap-2">
                <label className="text-[10.5px] font-semibold text-slate-600">Page</label>
                <select
                  value={pageIndex}
                  onChange={(e) => setPageIndex(Number(e.target.value))}
                  className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-white"
                >
                  {sourceProject.pages.map((p, i) => (
                    <option key={p.id} value={i}>
                      {i + 1}. {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </section>

          {/* 2 · Sheets */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              2 · How it is cut up
            </h3>
            <div className="grid grid-cols-6 gap-1">
              {GRID_PRESETS.map((p) => {
                const active = settings.tarpapelCols === p.c && settings.tarpapelRows === p.r;
                return (
                  <button
                    key={`${p.c}x${p.r}`}
                    type="button"
                    onClick={() => {
                      setGridTouched(true);
                      patch({ tarpapelCols: p.c, tarpapelRows: p.r });
                    }}
                    className={`py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      active
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    {p.c}×{p.r}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              <label className="block">
                <span className="block text-[9.5px] font-semibold text-slate-600 mb-0.5">
                  Columns
                </span>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={settings.tarpapelCols}
                  onChange={(e) => {
                    setGridTouched(true);
                    patch({
                      tarpapelCols: Math.max(1, Math.min(8, Number(e.target.value) || 1)),
                    });
                  }}
                  className="w-full text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-white"
                />
              </label>
              <label className="block">
                <span className="block text-[9.5px] font-semibold text-slate-600 mb-0.5">Rows</span>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={settings.tarpapelRows}
                  onChange={(e) => {
                    setGridTouched(true);
                    patch({ tarpapelRows: Math.max(1, Math.min(8, Number(e.target.value) || 1)) });
                  }}
                  className="w-full text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-white"
                />
              </label>
              <label className="block">
                <span className="block text-[9.5px] font-semibold text-slate-600 mb-0.5">Glue strip</span>
                <select
                  value={settings.tarpapelOverlapIn}
                  onChange={(e) =>
                    patch({
                      tarpapelOverlapIn: Number(e.target.value) as PrintSettings['tarpapelOverlapIn'],
                    })
                  }
                  className="w-full text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-white"
                >
                  {OVERLAP_OPTIONS.map((o) => (
                    <option key={o.label} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-[9.5px] font-semibold text-slate-600 mb-0.5">
                  Printer margin
                </span>
                <select
                  value={settings.tarpapelMarginIn}
                  onChange={(e) =>
                    patch({
                      tarpapelMarginIn: Number(e.target.value) as PrintSettings['tarpapelMarginIn'],
                    })
                  }
                  className="w-full text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-white"
                >
                  {MARGIN_OPTIONS.map((o) => (
                    <option key={o.label} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              <label className="block">
                <span className="block text-[9.5px] font-semibold text-slate-600 mb-0.5">Paper</span>
                <select
                  value={settings.paperSize}
                  onChange={(e) => patch({ paperSize: e.target.value as PrintSettings['paperSize'] })}
                  className="w-full text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-white"
                >
                  {PAPER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-[9.5px] font-semibold text-slate-600 mb-0.5">
                  Sheet orientation
                </span>
                <select
                  value={settings.sheetOrientation}
                  onChange={(e) =>
                    patch({
                      sheetOrientation: e.target.value as PrintSettings['sheetOrientation'],
                    })
                  }
                  className="w-full text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                  <option value="auto">Match design</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-[9.5px] font-semibold text-slate-600 mb-0.5">
                  If shapes differ
                </span>
                <select
                  value={settings.tarpapelFitMode}
                  onChange={(e) =>
                    patch({ tarpapelFitMode: e.target.value as PrintSettings['tarpapelFitMode'] })
                  }
                  className="w-full text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="contain">Pad with bands</option>
                  <option value="cover">Crop to fill</option>
                </select>
              </label>
            </div>

            {suggestion && (
              <button
                type="button"
                onClick={applySuggestion}
                className="mt-2 inline-flex items-center gap-1.5 text-[10.5px] font-bold text-[#5c4bb8] hover:underline cursor-pointer"
              >
                <Grid3x3 size={12} />
                {suggestion.cols}×{suggestion.rows} fits this design best —{' '}
                {suggestion.sizeCm[0]} × {suggestion.sizeCm[1]} cm on {suggestion.sheets} sheets
              </button>
            )}
          </section>

          {/* 3 · Result */}
          <section className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[13px] font-bold text-[#161a22]">
                {metrics ? `${metrics.cols * metrics.rows} sheets` : '—'}
              </span>
              <span className="text-[11px] text-slate-600">
                {metrics
                  ? `${settings.paperSize.toUpperCase()} ${metrics.isLandscape ? 'landscape' : 'portrait'} · ${metrics.totalPosterWCm.toFixed(0)} × ${metrics.totalPosterHCm.toFixed(0)} cm assembled`
                  : 'Choose a design'}
              </span>
              {metrics && (
                <span className="inline-flex items-center gap-1 text-[10.5px] text-slate-600">
                  <Scaling size={11} /> design at {metrics.posterScalePercent}%
                </span>
              )}
            </div>
            <p className="mt-1 text-[10.5px] leading-snug text-slate-600">
              {padPercent <= 1
                ? 'The design and the poster have the same shape — nothing is padded or cropped.'
                : settings.tarpapelFitMode === 'cover'
                  ? `Cropping ${padPercent}% of ${isTaller ? 'the top and bottom' : 'the sides'} to fill the poster.`
                  : `${padPercent}% of the poster will be blank ${isTaller ? 'above and below' : 'left and right'} — change the grid above to fit the design.`}
            </p>

            {/* Sheet map: the poster's proportions, cut into its sheets, with the design shown to scale. */}
            <div className="mt-2.5 flex justify-center">
              <div
                className="relative bg-white border border-amber-300 rounded-sm overflow-hidden"
                style={{
                  aspectRatio: `${Math.max(0.2, posterAspect)}`,
                  width: '100%',
                  maxWidth: posterAspect >= 1 ? 420 : 190,
                }}
              >
                <div
                  className="absolute inset-0 grid"
                  style={{
                    gridTemplateColumns: `repeat(${settings.tarpapelCols}, 1fr)`,
                    gridTemplateRows: `repeat(${settings.tarpapelRows}, 1fr)`,
                  }}
                >
                  {Array.from({ length: settings.tarpapelCols * settings.tarpapelRows }).map(
                    (_, i) => (
                      <div
                        key={i}
                        className="relative border border-dashed border-amber-300/80 flex items-start justify-start"
                      >
                        <span className="text-[8.5px] font-bold text-amber-700/80 px-1 py-0.5">
                          {i + 1}
                        </span>
                      </div>
                    )
                  )}
                </div>
                {/* The design itself, contained or covered inside the poster */}
                <div
                  className="absolute border border-[#5c4bb8]/70 bg-[#5c4bb8]/10 pointer-events-none"
                  style={
                    isTaller
                      ? {
                          left: 0,
                          right: 0,
                          top: `${((1 - coverFraction) / 2) * 100}%`,
                          height: `${coverFraction * 100}%`,
                        }
                      : {
                          top: 0,
                          bottom: 0,
                          left: `${((1 - coverFraction) / 2) * 100}%`,
                          width: `${coverFraction * 100}%`,
                        }
                  }
                />
              </div>
            </div>
          </section>

          {error && (
            <p className="text-[11px] text-rose-600 font-semibold" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[#e5e9ee] bg-[#fafbfc]">
          <p className="text-[10.5px] text-slate-500 leading-snug">
            Sheets print with glue strips, corner marks and a sheet number in the margin.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTarpapelModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={busy || !sourcePage}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Printer size={13} />
              {busy ? 'Writing…' : 'Download tarpapel PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
