import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Download, Image as ImageIcon, Printer, Search, Sparkles, X } from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import type { DocumentProject, ImageElement, Page } from '../../types/publisher';
import { TEMPLATES } from '../../constants/templates';
import { renderPageModelToCanvas } from '../../utils/canvasRenderer';
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
 * Every design in the workarea is a source: any page of any open tab, any wall-sized gallery
 * template, or a file from disk. The modal does the choosing and the previewing; the printing is
 * `computeTarpapelMetrics` + `exportTarpapelPdf`, exactly as the print panel does it. No second
 * engine, no second opinion about size.
 */

const GRID_PRESETS: Array<{ c: number; r: number }> = [
  { c: 2, r: 2 },
  { c: 2, r: 3 },
  { c: 3, r: 2 },
  { c: 4, r: 2 },
  { c: 4, r: 3 },
  { c: 5, r: 4 },
];

/** Gallery categories that are meant to be seen from across a room. */
const WALL_CATEGORIES = new Set(['Poster', 'Tarpapel', 'Champs Reading', 'Hero Banner', 'Program']);

const OVERLAP_OPTIONS: Array<{ value: PrintSettings['tarpapelOverlapIn']; label: string }> = [
  { value: 0, label: 'No glue strip' },
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
  { value: 'tabloid', label: 'Tabloid' },
];

interface SourceRow {
  key: string;
  group: 'workspace' | 'gallery' | 'file';
  label: string;
  detail: string;
  project: DocumentProject;
  pageIndex: number;
}

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

const FIELD =
  'w-full h-8 px-2 rounded-lg border border-[#dfe4ea] bg-white text-[11.5px] text-[#202833] focus:outline-none focus:border-[#8b7ce0] focus:ring-2 focus:ring-[#5c4bb8]/15';
const LABEL = 'block text-[9.5px] font-bold uppercase tracking-[0.06em] text-[#7b8794] mb-1';

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
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [query, setQuery] = useState('');
  const [imported, setImported] = useState<DocumentProject | null>(null);
  const [gridTouched, setGridTouched] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });

  /* ---------------- sources: the whole workarea, not just the open tab ---------------- */

  const rows: SourceRow[] = useMemo(() => {
    const ordered = [...workspaceTabs].sort((a, b) =>
      a.id === activeTabId ? -1 : b.id === activeTabId ? 1 : b.updatedAt - a.updatedAt
    );
    const fromTabs: SourceRow[] = [];
    for (const tab of ordered) {
      const proj = tab.id === activeTabId ? project : tab.project;
      proj.pages.forEach((page, i) => {
        fromTabs.push({
          key: `tab:${tab.id}:${i}`,
          group: 'workspace',
          label: proj.name || 'Untitled',
          detail: `${page.name} · ${Math.round(page.width)} × ${Math.round(page.height)}`,
          project: proj,
          pageIndex: i,
        });
      });
    }
    const fromGallery: SourceRow[] = TEMPLATES.filter((t) => WALL_CATEGORIES.has(t.category)).map(
      (t) => ({
        key: `tpl:${t.id}`,
        group: 'gallery' as const,
        label: t.name,
        detail: `${t.category} · ${Math.round(t.project.pages[0]?.width ?? 0)} × ${Math.round(
          t.project.pages[0]?.height ?? 0
        )}`,
        project: t.project,
        pageIndex: 0,
      })
    );
    const fromFiles: SourceRow[] = imported
      ? [
          {
            key: 'file:imported',
            group: 'file',
            label: imported.name,
            detail: 'Imported image',
            project: imported,
            pageIndex: 0,
          },
        ]
      : [];
    return [...fromTabs, ...fromFiles, ...fromGallery];
  }, [workspaceTabs, activeTabId, project, imported]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.label.toLowerCase().includes(q) || r.detail.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const selected = rows.find((r) => r.key === selectedKey) ?? rows[0] ?? null;
  const sourcePage: Page | null = selected
    ? selected.project.pages[selected.pageIndex] ?? selected.project.pages[0] ?? null
    : null;
  const sourceProject = selected?.project ?? null;

  /* ---------------- open / close ---------------- */

  useEffect(() => {
    if (!isTarpapelModalOpen) return;
    setSettings({
      ...printSettings,
      printMode: 'tarpapel',
      paperSize: printSettings.paperSize === 'auto' ? 'a4' : printSettings.paperSize,
    });
    setGridTouched(false);
    setError(null);
    setQuery('');
    setSelectedKey('');
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

  // The poster has to be measured, not guessed: `aspect-ratio` plus both max-width and max-height
  // squashes the art instead of shrinking it, which would misrepresent the design being approved.
  useEffect(() => {
    const el = stageRef.current;
    if (!isTarpapelModalOpen || !el) return;
    const measure = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isTarpapelModalOpen]);

  /* ---------------- geometry ---------------- */

  const metrics = useMemo(
    () => (sourcePage ? computeTarpapelMetrics(sourcePage, settings) : null),
    [sourcePage, settings]
  );
  const suggestion = useMemo(
    () => (sourcePage ? suggestTarpapelGrid(sourcePage, settings) : null),
    [sourcePage, settings]
  );

  useEffect(() => {
    if (!suggestion || gridTouched) return;
    setSettings((s) =>
      s.tarpapelCols === suggestion.cols && s.tarpapelRows === suggestion.rows
        ? s
        : { ...s, tarpapelCols: suggestion.cols, tarpapelRows: suggestion.rows }
    );
  }, [suggestion, gridTouched]);

  /* ---------------- real preview: the page itself, tiled ---------------- */

  useEffect(() => {
    if (!isTarpapelModalOpen || !sourcePage) {
      setPreviewUrl(null);
      return;
    }
    let cancelled = false;
    setPreviewBusy(true);
    const scale = Math.min(2, Math.max(0.4, 1500 / Math.max(sourcePage.width, sourcePage.height)));
    renderPageModelToCanvas(sourcePage, scale)
      .then((canvas) => {
        if (cancelled) return;
        setPreviewUrl(canvas.toDataURL('image/jpeg', 0.86));
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null);
      })
      .finally(() => {
        if (!cancelled) setPreviewBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isTarpapelModalOpen, sourcePage]);

  if (!isTarpapelModalOpen) return null;

  const designAspect = sourcePage ? sourcePage.width / Math.max(1, sourcePage.height) : 1;
  const posterAspect = metrics ? metrics.totalPosterWIn / Math.max(0.1, metrics.totalPosterHIn) : 1;
  const designIsWider = designAspect >= posterAspect;
  const coverFraction = designIsWider ? posterAspect / designAspect : designAspect / posterAspect;
  const padPercent = Math.round((1 - coverFraction) * 100);
  const sheetCount = settings.tarpapelCols * settings.tarpapelRows;
  const showTotalsPerSheet = sheetCount <= 24;

  const patch = (next: Partial<PrintSettings>) => setSettings((s) => ({ ...s, ...next }));

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || '');
      const probe = new window.Image();
      probe.onload = () => {
        const next = projectFromImage(
          src,
          probe.naturalWidth || 1600,
          probe.naturalHeight || 1200,
          file.name.replace(/\.[^.]+$/, '')
        );
        setImported(next);
        setSelectedKey('file:imported');
        setGridTouched(false);
      };
      probe.onerror = () => setError('That file could not be read as an image.');
      probe.src = src;
    };
    reader.onerror = () => setError('That file could not be read.');
    reader.readAsDataURL(file);
  };

  const handleExport = async () => {
    if (!sourcePage || !sourceProject) return;
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

  const groups: Array<{ id: SourceRow['group']; title: string; rows: SourceRow[] }> = [
    { id: 'workspace', title: 'Open in the workspace', rows: filteredRows.filter((r) => r.group === 'workspace') },
    { id: 'file', title: 'Imported file', rows: filteredRows.filter((r) => r.group === 'file') },
    { id: 'gallery', title: 'Made for walls', rows: filteredRows.filter((r) => r.group === 'gallery') },
  ];

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 backdrop-blur-sm p-4"
      onClick={() => setIsTarpapelModalOpen(false)}
    >
      <div
        className="w-full max-w-5xl h-[88vh] max-h-[820px] overflow-hidden bg-white rounded-2xl shadow-2xl border border-[#e5e9ee] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 h-[58px] border-b border-[#eef1f5] shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#efeafd] text-[#5c4bb8] flex items-center justify-center">
            <Printer size={17} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[13.5px] font-bold text-[#161a22] leading-tight">
              Print as Tarpaulin
            </h2>
            <p className="text-[10.5px] text-[#7b8794] leading-tight">
              Any design in the workarea, printed on ordinary sheets and glued into one poster.
            </p>
          </div>
          <div className="flex-1" />
          <div className="hidden sm:flex items-center gap-1.5 text-[10.5px] font-bold text-[#3d4854] bg-[#f4f6f9] border border-[#e6ebf1] rounded-full px-2.5 py-1">
            <span className="text-[#5c4bb8]">{sheetCount}</span> sheets
            <span className="text-[#c3ccd6]">·</span>
            {metrics ? `${metrics.totalPosterWCm.toFixed(0)} × ${metrics.totalPosterHCm.toFixed(0)} cm` : '—'}
          </div>
          <button
            type="button"
            onClick={() => setIsTarpapelModalOpen(false)}
            className="w-8 h-8 rounded-lg text-[#8a94a0] hover:bg-[#f4f6f9] flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          {/* Left rail: source + sheet controls */}
          <div className="w-full md:w-[336px] shrink-0 border-r border-[#eef1f5] flex flex-col min-h-0">
            <div className="px-4 pt-3.5 pb-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9aa4b0]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find a design…"
                  className={`${FIELD} pl-7`}
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2">
              {groups.map((group) =>
                group.rows.length === 0 ? null : (
                  <div key={group.id} className="mb-1">
                    <div className="px-2 pt-2 pb-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#9aa4b0]">
                      {group.title}
                    </div>
                    {group.rows.map((row) => {
                      const active = selected?.key === row.key;
                      return (
                        <button
                          key={row.key}
                          type="button"
                          onClick={() => {
                            setSelectedKey(row.key);
                            setGridTouched(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg flex items-start gap-2 transition cursor-pointer ${
                            active ? 'bg-[#efeafd]' : 'hover:bg-[#f6f7fa]'
                          }`}
                        >
                          <span
                            className={`mt-[3px] w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                              active
                                ? 'bg-[#5c4bb8] border-[#5c4bb8] text-white'
                                : 'border-[#d3dae2] text-transparent'
                            }`}
                          >
                            <Check size={9} strokeWidth={3} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[11.5px] font-semibold text-[#202833] truncate">
                              {row.label}
                            </span>
                            <span className="block text-[9.5px] text-[#8a94a0] truncate">
                              {row.detail}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full mt-1 px-2 py-2 rounded-lg border border-dashed border-[#d3dae2] text-[11px] font-semibold text-[#5c4bb8] hover:bg-[#f8f7fe] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ImageIcon size={12} /> Upload a JPG or PNG
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>

            {/* Sheet controls */}
            <div className="border-t border-[#eef1f5] px-4 py-3 space-y-2.5 bg-[#fbfcfd]">
              <div className="flex items-center justify-between">
                <span className={LABEL}>Sheets</span>
                {suggestion &&
                  (suggestion.cols !== settings.tarpapelCols ||
                    suggestion.rows !== settings.tarpapelRows) && (
                    <button
                      type="button"
                      onClick={() => {
                        setGridTouched(true);
                        patch({ tarpapelCols: suggestion.cols, tarpapelRows: suggestion.rows });
                      }}
                      className="inline-flex items-center gap-1 text-[9.5px] font-bold text-[#5c4bb8] hover:underline cursor-pointer"
                    >
                      <Sparkles size={10} /> fit {suggestion.cols}×{suggestion.rows}
                    </button>
                  )}
              </div>
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
                      className={`h-7 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                        active
                          ? 'bg-[#5c4bb8] text-white border-[#5c4bb8]'
                          : 'bg-white text-[#3d4854] border-[#dfe4ea] hover:border-[#b9aee8]'
                      }`}
                    >
                      {p.c}×{p.r}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className={LABEL}>Columns</span>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={settings.tarpapelCols}
                    onChange={(e) => {
                      setGridTouched(true);
                      patch({ tarpapelCols: Math.max(1, Math.min(8, Number(e.target.value) || 1)) });
                    }}
                    className={FIELD}
                  />
                </label>
                <label className="block">
                  <span className={LABEL}>Rows</span>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={settings.tarpapelRows}
                    onChange={(e) => {
                      setGridTouched(true);
                      patch({ tarpapelRows: Math.max(1, Math.min(8, Number(e.target.value) || 1)) });
                    }}
                    className={FIELD}
                  />
                </label>
                <label className="block">
                  <span className={LABEL}>Paper</span>
                  <select
                    value={settings.paperSize}
                    onChange={(e) => patch({ paperSize: e.target.value as PrintSettings['paperSize'] })}
                    className={FIELD}
                  >
                    {PAPER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={LABEL}>Sheet</span>
                  <select
                    value={settings.sheetOrientation}
                    onChange={(e) =>
                      patch({ sheetOrientation: e.target.value as PrintSettings['sheetOrientation'] })
                    }
                    className={FIELD}
                  >
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                    <option value="auto">Match design</option>
                  </select>
                </label>
                <label className="block">
                  <span className={LABEL}>Glue strip</span>
                  <select
                    value={settings.tarpapelOverlapIn}
                    onChange={(e) =>
                      patch({
                        tarpapelOverlapIn: Number(e.target.value) as PrintSettings['tarpapelOverlapIn'],
                      })
                    }
                    className={FIELD}
                  >
                    {OVERLAP_OPTIONS.map((o) => (
                      <option key={o.label} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={LABEL}>Printer margin</span>
                  <select
                    value={settings.tarpapelMarginIn}
                    onChange={(e) =>
                      patch({
                        tarpapelMarginIn: Number(e.target.value) as PrintSettings['tarpapelMarginIn'],
                      })
                    }
                    className={FIELD}
                  >
                    {MARGIN_OPTIONS.map((o) => (
                      <option key={o.label} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className={LABEL}>When the shapes differ</span>
                <select
                  value={settings.tarpapelFitMode}
                  onChange={(e) =>
                    patch({ tarpapelFitMode: e.target.value as PrintSettings['tarpapelFitMode'] })
                  }
                  className={FIELD}
                >
                  <option value="contain">Pad with paper-coloured bands</option>
                  <option value="cover">Crop to fill the poster</option>
                </select>
              </label>
            </div>
          </div>

          {/* Right: the poster, as it will be assembled */}
          <div className="flex-1 min-h-0 flex flex-col bg-[#eef1f6]">
            <div className="flex-1 min-h-0 p-5 flex items-center justify-center overflow-hidden relative">
              {previewBusy && (
                <span className="absolute top-3 right-4 text-[10px] font-semibold text-[#8a94a0]">
                  rendering…
                </span>
              )}
              <div ref={stageRef} className="relative w-full h-full flex items-center justify-center">
              <div
                className="relative bg-white shadow-[0_10px_40px_rgba(28,44,58,0.18)] ring-1 ring-black/5"
                style={{
                  width: stage.w > 0 ? Math.min(stage.w, stage.h * posterAspect) : '100%',
                  height: stage.w > 0 ? Math.min(stage.w, stage.h * posterAspect) / posterAspect : 'auto',
                  aspectRatio: `${Math.max(0.25, posterAspect)}`,
                }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Tarpapel preview"
                    className="absolute inset-0 w-full h-full"
                    style={{ objectFit: settings.tarpapelFitMode === 'cover' ? 'cover' : 'contain' }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[10.5px] text-[#9aa4b0]">
                    {sourcePage ? 'no preview' : 'pick a design'}
                  </div>
                )}

                {/* sheet grid */}
                <div
                  className="absolute inset-0 grid pointer-events-none"
                  style={{
                    gridTemplateColumns: `repeat(${settings.tarpapelCols}, 1fr)`,
                    gridTemplateRows: `repeat(${settings.tarpapelRows}, 1fr)`,
                  }}
                >
                  {Array.from({ length: sheetCount }).map((_, i) => (
                    <div
                      key={i}
                      className="relative border border-white/70 shadow-[0_0_0_1px_rgba(0,0,0,0.10)]"
                    >
                      {showTotalsPerSheet && (
                        <span className="absolute left-[3px] top-[2px] text-[8px] font-bold text-white/95 [text-shadow:0_0_2px_rgba(0,0,0,0.65)]">
                          {i + 1}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* crop guide when covering */}
                {settings.tarpapelFitMode === 'cover' && padPercent > 1 && (
                  <div
                    className="absolute border border-dashed border-rose-400/80 pointer-events-none"
                    style={
                      designIsWider
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
                )}
              </div>
              </div>
            </div>

            {/* Read-out */}
            <div className="shrink-0 px-5 py-2.5 bg-white/70 border-t border-[#e2e8ef] flex flex-wrap items-center gap-x-4 gap-y-1">
              {[
                { k: 'Sheets', v: `${sheetCount}` },
                {
                  k: 'Assembled',
                  v: metrics
                    ? `${metrics.totalPosterWCm.toFixed(0)} × ${metrics.totalPosterHCm.toFixed(0)} cm`
                    : '—',
                },
                {
                  k: 'Sheet',
                  v: metrics
                    ? `${settings.paperSize.toUpperCase()} ${metrics.isLandscape ? 'landscape' : 'portrait'}`
                    : '—',
                },
                { k: 'Design scale', v: metrics ? `${metrics.posterScalePercent}%` : '—' },
              ].map((item) => (
                <div key={item.k} className="min-w-[74px]">
                  <div className="text-[8.5px] font-bold uppercase tracking-[0.08em] text-[#9aa4b0]">
                    {item.k}
                  </div>
                  <div className="text-[11.5px] font-bold text-[#202833]">{item.v}</div>
                </div>
              ))}
              <div className="flex-1" />
              <p className="text-[10px] leading-snug text-[#7b8794] max-w-[300px]">
                {padPercent <= 1
                  ? 'Design and poster share a shape — nothing is padded or cropped.'
                  : settings.tarpapelFitMode === 'cover'
                    ? `Cropping ${padPercent}% of the ${designIsWider ? 'height' : 'width'} to fill.`
                    : `${padPercent}% of the paper stays blank — the “fit” button above will match the shapes.`}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 h-[58px] border-t border-[#eef1f5] bg-white shrink-0">
          <p className="text-[10.5px] text-[#8a94a0]">
            {error ? (
              <span className="text-rose-600 font-semibold">{error}</span>
            ) : (
              'Each sheet prints with corner ticks, its number and the glue edge in the margin.'
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTarpapelModalOpen(false)}
              className="px-3 h-8 rounded-lg text-[11.5px] font-bold text-[#5b6673] hover:bg-[#f4f6f9] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={busy || !sourcePage}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg text-[11.5px] font-bold text-white bg-[#5c4bb8] hover:bg-[#4c3d9e] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              <Download size={13} />
              {busy ? 'Writing…' : 'Download tarpapel PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
