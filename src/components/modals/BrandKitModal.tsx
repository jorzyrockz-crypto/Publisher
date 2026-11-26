import React, { useEffect, useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { ColorInput } from '../common/ColorInput';
import { BrandKit } from '../../types/publisher';
import { extractBrandColorsFromImage } from '../../utils/brandRebrand';
import { FontSelector } from '../common/FontSelector';
import {
  Palette,
  X,
  Plus,
  Upload,
  Trash2,
  Sparkles,
  Wand2,
  ImagePlus,
  Layers,
  FileCheck,
} from 'lucide-react';

export const BrandKitModal: React.FC = () => {
  const {
    isBrandKitModalOpen,
    setIsBrandKitModalOpen,
    brandKits,
    activeBrandKit,
    saveBrandKit,
    deleteBrandKit,
    applyBrandKit,
    addImage,
    activePage,
    project,
  } = usePublisher();

  const [draft, setDraft] = useState<BrandKit>(activeBrandKit);
  const [stampLogo, setStampLogo] = useState<boolean>(true);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isBrandKitModalOpen) {
      setDraft(activeBrandKit);
    }
  }, [isBrandKitModalOpen, activeBrandKit]);

  if (!isBrandKitModalOpen) return null;

  const handleCreateNew = () => {
    const fresh: BrandKit = {
      id: `kit-custom-${Date.now()}`,
      name: `My Brand Kit ${brandKits.filter((k) => k.isCustom).length + 1}`,
      headingFont: draft.headingFont || 'Montserrat',
      bodyFont: draft.bodyFont || 'Segoe UI',
      isCustom: true,
      colors: { ...draft.colors },
      logoSrc: draft.logoSrc,
    };
    saveBrandKit(fresh);
    setDraft(fresh);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = String(ev.target?.result || '');
      const next: BrandKit = { ...draft, logoSrc: dataUrl };
      setDraft(next);
      saveBrandKit(next);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAutoPickFromLogo = async () => {
    if (!draft.logoSrc) return;
    const extracted = await extractBrandColorsFromImage(draft.logoSrc);
    const updated: BrandKit = {
      ...draft,
      colors: {
        ...draft.colors,
        ...extracted,
      },
    };
    setDraft(updated);
    saveBrandKit(updated);
  };

  const updateColor = (key: keyof BrandKit['colors'], value: string) => {
    const updated: BrandKit = {
      ...draft,
      colors: { ...draft.colors, [key]: value },
    };
    setDraft(updated);
    saveBrandKit(updated);
  };

  const updateDraftField = (updates: Partial<BrandKit>) => {
    const updated = { ...draft, ...updates };
    setDraft(updated);
    saveBrandKit(updated);
  };

  const handleApply = (scope: 'all' | 'page') => {
    saveBrandKit(draft);
    applyBrandKit(draft, scope, { stampLogo: Boolean(stampLogo && draft.logoSrc) });
    setIsBrandKitModalOpen(false);
  };

  const handleInsertLogoOnce = () => {
    if (!draft.logoSrc) return;
    const size = Math.max(64, Math.min(140, Math.round(Math.min(activePage.width, activePage.height) * 0.18)));
    addImage(draft.logoSrc, {
      name: 'Brand Kit Logo',
      width: size,
      height: size,
      objectFit: 'contain',
      aspectRatioLocked: true,
      borderWidth: 0,
    });
    setIsBrandKitModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#15232d]/35 backdrop-blur-[2px] flex items-center justify-center p-4 select-none"
      onClick={() => setIsBrandKitModalOpen(false)}
    >
      <div
        className="bg-white rounded-[15px] shadow-[0_20px_70px_rgba(21,35,45,0.22)] border border-[#e5e9ee] max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e9ee] flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#8a6ff0] to-[#5a44c9] text-white flex items-center justify-center shadow-sm">
              <Palette size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>Brand Kit Studio</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#efeafd] text-[#5c4bb8]">
                  Smart Rebrand
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Save your logo, fonts &amp; colors to intelligently rebrand any design across all artboards
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsBrandKitModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left: Brand Kits List */}
          <div className="md:col-span-4 p-4 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Brand Kits ({brandKits.length})
              </span>
              <button
                type="button"
                onClick={handleCreateNew}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#6e56cf] hover:bg-[#5c4bb8] text-white text-[11px] font-bold transition cursor-pointer"
              >
                <Plus size={12} />
                <span>New Kit</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-0.5">
              {brandKits.map((kit) => {
                const isSelected = kit.id === draft.id;
                return (
                  <div
                    key={kit.id}
                    onClick={() => setDraft(kit)}
                    className={`group p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-indigo-600 bg-white ring-1 ring-[#6e56cf]/30 shadow-xs'
                        : 'border-[#e5e9ee] bg-white/80 hover:border-[#d3c9f9]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {kit.name}
                        </span>
                        {kit.isCustom && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#efeafd] text-[#5c4bb8] font-bold">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        {[
                          kit.colors.primary,
                          kit.colors.secondary,
                          kit.colors.accent,
                          kit.colors.dark,
                          kit.colors.light,
                        ].map((hex, i) => (
                          <span
                            key={i}
                            className="w-4 h-4 rounded-full border border-[#e5e9ee] shadow-2xs"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </div>

                    {kit.isCustom && brandKits.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBrandKit(kit.id);
                          if (draft.id === kit.id) {
                            const next = brandKits.find((k) => k.id !== kit.id);
                            if (next) setDraft(next);
                          }
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition"
                        title="Delete Custom Kit"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Active Kit Editor & Live Preview */}
          <div className="md:col-span-8 p-5 space-y-5 bg-white">
            {/* Name & Logo Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => updateDraftField({ name: e.target.value })}
                    className="w-full rounded-xl border border-[#e5e9ee] bg-slate-50 focus:bg-white px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#6e56cf]/20 focus:border-[#b3a4f2]"
                  />
                </div>

                {/* Live Mini Preview Card */}
                <div
                  className="rounded-2xl p-3.5 border border-[#e5e9ee] shadow-xs space-y-1.5 relative overflow-hidden"
                  style={{ backgroundColor: draft.colors.light }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: draft.colors.accent,
                        color: '#0f172a',
                      }}
                    >
                      Brand Preview
                    </span>
                    {draft.logoSrc && (
                      <img
                        src={draft.logoSrc}
                        alt="Brand Logo"
                        className="h-7 w-7 object-contain rounded"
                      />
                    )}
                  </div>
                  <div
                    className="text-base font-bold leading-tight truncate"
                    style={{ fontFamily: draft.headingFont, color: draft.colors.primary }}
                  >
                    {draft.name}
                  </div>
                  <div
                    className="text-[11px] leading-snug"
                    style={{ fontFamily: draft.bodyFont, color: draft.colors.dark }}
                  >
                    Headings in {draft.headingFont} &amp; body copy in {draft.bodyFont}.
                  </div>
                </div>
              </div>

              {/* Brand Logo Upload */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-600">
                  Brand Logo (Optional)
                </label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <div className="h-24 rounded-2xl border-2 border-dashed border-[#e5e9ee] bg-slate-50 flex items-center justify-center relative overflow-hidden">
                  {draft.logoSrc ? (
                    <>
                      <img
                        src={draft.logoSrc}
                        alt="Logo"
                        className="max-h-20 max-w-[160px] object-contain p-1"
                      />
                      <button
                        type="button"
                        onClick={() => updateDraftField({ logoSrc: undefined })}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 transition"
                        title="Remove Logo"
                      >
                        <X size={11} />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="flex flex-col items-center gap-1 text-slate-400 hover:text-[#5c4bb8] transition cursor-pointer"
                    >
                      <Upload size={18} />
                      <span className="text-[11px] font-semibold">Upload PNG / SVG Logo</span>
                    </button>
                  )}
                </div>

                {draft.logoSrc && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleAutoPickFromLogo}
                      className="flex-1 py-1 px-2 rounded-lg border border-[#d3c9f9] bg-[#efeafd] hover:bg-[#efeafd] text-[#5c4bb8] text-[10.5px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Wand2 size={11} />
                      <span>Auto-Pick Colors</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleInsertLogoOnce}
                      className="flex-1 py-1 px-2 rounded-lg border border-[#e5e9ee] bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10.5px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <ImagePlus size={11} />
                      <span>Insert Logo</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Fonts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Heading Font
                </label>
                <FontSelector
                  value={draft.headingFont}
                  onChange={(headingFont) => updateDraftField({ headingFont })}
                  className="w-full rounded-xl px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Body Font
                </label>
                <FontSelector
                  value={draft.bodyFont}
                  onChange={(bodyFont) => updateDraftField({ bodyFont })}
                  className="w-full rounded-xl px-2.5 py-1.5"
                />
              </div>
            </div>

            {/* 5 Brand Colors */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="block text-[11px] font-bold text-slate-600">
                Brand Palette (Auto-Remaps Shapes, Gradients &amp; Contrast Text)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {(
                  [
                    { key: 'primary', label: 'Primary' },
                    { key: 'secondary', label: 'Secondary' },
                    { key: 'accent', label: 'Accent' },
                    { key: 'dark', label: 'Dark Ink' },
                    { key: 'light', label: 'Light Tint' },
                    { key: 'background', label: 'Canvas BG' },
                  ] as const
                ).map((swatch) => (
                  <div
                    key={swatch.key}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl border border-[#e5e9ee] bg-slate-50"
                  >
                    <ColorInput
                      value={draft.colors[swatch.key]}
                      onChange={(e) => updateColor(swatch.key, e.target.value)}
                      className="w-8 h-8 rounded-full border border-[#e5e9ee] cursor-pointer p-0 shadow-2xs"
                      target="text"
                      />
                    <span className="text-[10px] font-semibold text-slate-700">
                      {swatch.label}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 uppercase">
                      {draft.colors[swatch.key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {draft.logoSrc && (
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={stampLogo}
                  onChange={(e) => setStampLogo(e.target.checked)}
                  className="accent-[#6e56cf] rounded"
                />
                <span>Auto-stamp Brand Logo onto rebranded artboards</span>
              </label>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e9ee] bg-slate-50 flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-slate-500">
            Updates fonts, fills, gradients, patterns &amp; contrast-safe text (Undoable via Ctrl+Z)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleApply('page')}
              className="py-2 px-4 rounded-xl border border-[#d3c9f9] bg-white hover:bg-[#efeafd] text-[#5c4bb8] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileCheck size={14} />
              <span>Rebrand Active Page</span>
            </button>
            <button
              type="button"
              onClick={() => handleApply('all')}
              className="py-2 px-5 rounded-xl bg-[#6e56cf] hover:bg-[#5c4bb8] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles size={14} />
              <Layers size={14} />
              <span>Rebrand All Artboards ({project.pages.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
