import React, { useEffect, useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { BrandKit } from '../../types/publisher';
import { extractBrandColorsFromImage } from '../../utils/brandRebrand';
import { ColorInput } from '../common/ColorInput';
import { FontSelector } from '../common/FontSelector';
import { COLOR_SCHEMES } from '../../constants/colorSchemes';
import { PAGE_SIZES } from '../../constants/pageSizes';
import { CompositionStyle } from '../../utils/designBlueprints';
import {
  Plus,
  Upload,
  Trash2,
  Sparkles,
  Wand2,
  ImagePlus,
  Check,
  Pencil,
  ChevronUp,
} from 'lucide-react';

export const DesignerBrandPanel: React.FC = () => {
  const {
    brandKits,
    activeBrandKit,
    saveBrandKit,
    deleteBrandKit,
    applyBrandKit,
    addImage,
    activePage,
    project,
    setColorScheme,
    generateBrandBoardSizes,
    setViewMode,
    setZoom,
  } = usePublisher();

  const [subTab, setSubTab] = useState<'kit' | 'board' | 'schemes'>('kit');
  const [applyScope, setApplyScope] = useState<'page' | 'all'>('page');
  const [stampLogo, setStampLogo] = useState(true);
  const [editingKitId, setEditingKitId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BrandKit>(activeBrandKit);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [layoutStyle, setLayoutStyle] = useState<CompositionStyle>('auto');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([
    'ig-post',
    'ig-story',
    'yt-thumb',
    'fb-cover',
    'linkedin-banner',
  ]);

  useEffect(() => {
    setDraft(activeBrandKit);
  }, [activeBrandKit]);

  const handleTapKitCard = (kit: BrandKit) => {
    setDraft(kit);
    saveBrandKit(kit);
    applyBrandKit(kit, applyScope, { stampLogo });
  };

  const handleCreateNew = () => {
    const fresh: BrandKit = {
      id: `kit-custom-${Date.now()}`,
      name: `Custom Kit ${brandKits.filter((k) => k.isCustom).length + 1}`,
      headingFont: draft.headingFont || 'Montserrat',
      bodyFont: draft.bodyFont || 'Inter',
      isCustom: true,
      colors: { ...draft.colors },
      logoSrc: draft.logoSrc,
    };
    saveBrandKit(fresh);
    setDraft(fresh);
    setEditingKitId(fresh.id);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
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
      colors: { ...draft.colors, ...extracted },
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

  const updateField = (updates: Partial<BrandKit>) => {
    const updated = { ...draft, ...updates };
    setDraft(updated);
    saveBrandKit(updated);
  };

  const toggleSize = (name: string) => {
    setSelectedSizes((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Inline Sub-Tabs (Brand Kit | Multi-Size | Schemes) */}
      <div className="px-3 pt-2.5 pb-2 border-b border-[#e5e9ee]">
        <div className="grid grid-cols-3 gap-1 bg-[#f3f5f7] p-0.5 rounded-[9px] border border-[#e5e9ee]">
          <button
            type="button"
            onClick={() => setSubTab('kit')}
            className={`py-1 rounded-[7px] text-[11px] font-semibold transition cursor-pointer ${
              subTab === 'kit'
                ? 'bg-white text-[#5c4bb8] shadow-2xs'
                : 'text-[#4a5661] hover:text-[#161a22]'
            }`}
          >
            Brand Kit
          </button>
          <button
            type="button"
            onClick={() => setSubTab('board')}
            className={`py-1 rounded-[7px] text-[11px] font-semibold transition cursor-pointer ${
              subTab === 'board'
                ? 'bg-white text-[#5c4bb8] shadow-2xs'
                : 'text-[#4a5661] hover:text-[#161a22]'
            }`}
          >
            Multi-Size
          </button>
          <button
            type="button"
            onClick={() => setSubTab('schemes')}
            className={`py-1 rounded-[7px] text-[11px] font-semibold transition cursor-pointer ${
              subTab === 'schemes'
                ? 'bg-white text-[#5c4bb8] shadow-2xs'
                : 'text-[#4a5661] hover:text-[#161a22]'
            }`}
          >
            Schemes
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {subTab === 'kit' && (
          <>
            {/* Top Bar: Tap-to-Apply Scope + New Kit */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center bg-[#f3f5f7] p-0.5 rounded-[7px] border border-[#e5e9ee] text-[10.5px]">
                <button
                  type="button"
                  onClick={() => setApplyScope('page')}
                  className={`px-2 py-0.5 rounded-[5px] font-semibold transition cursor-pointer ${
                    applyScope === 'page'
                      ? 'bg-white text-[#5c4bb8] shadow-2xs'
                      : 'text-[#4a5661]'
                  }`}
                >
                  This Page
                </button>
                <button
                  type="button"
                  onClick={() => setApplyScope('all')}
                  className={`px-2 py-0.5 rounded-[5px] font-semibold transition cursor-pointer ${
                    applyScope === 'all'
                      ? 'bg-white text-[#5c4bb8] shadow-2xs'
                      : 'text-[#4a5661]'
                  }`}
                >
                  All ({project.pages.length})
                </button>
              </div>

              <button
                type="button"
                onClick={handleCreateNew}
                className="flex items-center gap-1 px-2.5 py-1 rounded-[7px] bg-[#efeafd] hover:bg-[#e4dbfc] text-[#5c4bb8] text-[10.5px] font-semibold transition cursor-pointer"
                title="Create New Brand Kit"
              >
                <Plus size={11} />
                <span>New Kit</span>
              </button>
            </div>

            <p className="text-[10.5px] text-[#6a7682]">
              Tap any card to apply its colors &amp; fonts immediately.
            </p>

            {/* Single-Tap Brand Kit Cards */}
            <div className="space-y-2">
              {brandKits.map((kit) => {
                const isActive = activeBrandKit.id === kit.id;
                const isEditing = editingKitId === kit.id;
                return (
                  <div
                    key={kit.id}
                    className={`rounded-[12px] border transition-all overflow-hidden ${
                      isActive
                        ? 'border-[#6e56cf] bg-[#faf8ff] ring-1 ring-[#d3c9f9]'
                        : 'border-[#e5e9ee] bg-white hover:border-[#b9acef] hover:bg-[#fcfbff]'
                    }`}
                  >
                    {/* Single-Tap Card Surface */}
                    <div
                      onClick={() => handleTapKitCard(kit)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleTapKitCard(kit);
                        }
                      }}
                      className="p-2.5 cursor-pointer space-y-2"
                      title={`Tap to apply "${kit.name}"`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-[#161a22] truncate">
                              {kit.name}
                            </span>
                            {isActive && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#efeafd] text-[#5c4bb8] text-[9px] font-bold flex-shrink-0">
                                <Check size={9} />
                                Active
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1.5 mt-0.5 truncate">
                            <span
                              style={{ fontFamily: kit.headingFont }}
                              className="text-sm font-bold text-[#161a22]"
                            >
                              Aa
                            </span>
                            <span
                              style={{ fontFamily: kit.bodyFont }}
                              className="text-[10.5px] text-[#6a7682] truncate"
                            >
                              {kit.headingFont} · {kit.bodyFont}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {kit.logoSrc && (
                            <img
                              src={kit.logoSrc}
                              alt=""
                              className="w-7 h-7 rounded-[6px] object-contain border border-[#e5e9ee] bg-white p-0.5"
                            />
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDraft(kit);
                              saveBrandKit(kit);
                              setEditingKitId(isEditing ? null : kit.id);
                            }}
                            className={`p-1.5 rounded-[7px] transition cursor-pointer ${
                              isEditing
                                ? 'bg-[#efeafd] text-[#5c4bb8]'
                                : 'text-[#6a7682] hover:text-[#5c4bb8] hover:bg-[#f4f2ff]'
                            }`}
                            title={isEditing ? 'Close Editor' : 'Customize Kit'}
                            aria-label={isEditing ? 'Close Editor' : 'Customize Kit'}
                          >
                            {isEditing ? <ChevronUp size={13} /> : <Pencil size={12} />}
                          </button>
                        </div>
                      </div>

                      {/* 5-Swatch Color Bar */}
                      <div className="grid grid-cols-5 gap-1 h-4 rounded-[6px] overflow-hidden border border-black/5">
                        {[
                          kit.colors.primary,
                          kit.colors.secondary,
                          kit.colors.accent,
                          kit.colors.dark,
                          kit.colors.light,
                        ].map((hex, i) => (
                          <div
                            key={i}
                            style={{ backgroundColor: hex }}
                            title={hex}
                            className="h-full w-full"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Inline Expandable Customize Drawer for this Card */}
                    {isEditing && (
                      <div
                        className="px-2.5 pb-2.5 pt-2 border-t border-[#e5e9ee] bg-[#f8fafb] space-y-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={draft.name}
                            onChange={(e) => updateField({ name: e.target.value })}
                            placeholder="Brand Kit Name"
                            className="flex-1 min-w-0 h-7 px-2 rounded-[7px] border border-[#e5e9ee] bg-white text-[11px] text-[#161a22] outline-none focus:border-[#6e56cf]"
                          />
                          {draft.isCustom && (
                            <button
                              type="button"
                              onClick={() => {
                                deleteBrandKit(draft.id);
                                setEditingKitId(null);
                              }}
                              className="p-1.5 rounded-[7px] text-[#b42318] hover:bg-[#ffe4e7] cursor-pointer"
                              title="Delete Kit"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        {/* Swatches */}
                        <div className="grid grid-cols-5 gap-1">
                          {(
                            [
                              ['primary', 'Pri'],
                              ['secondary', 'Sec'],
                              ['accent', 'Acc'],
                              ['dark', 'Drk'],
                              ['light', 'Lgt'],
                            ] as const
                          ).map(([key, label]) => (
                            <div key={key} className="flex flex-col items-center gap-0.5">
                              <ColorInput
                                value={draft.colors[key]}
                                onChange={(e) => updateColor(key, e.target.value)}
                                className="w-8 h-6 rounded-[5px] border border-[#e5e9ee]"
                                title={label}
                              />
                              <span className="text-[9px] text-[#6a7682]">{label}</span>
                            </div>
                          ))}
                        </div>

                        {/* Fonts */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <span className="text-[9.5px] text-[#6a7682] block mb-0.5">
                              Heading
                            </span>
                            <FontSelector
                              value={draft.headingFont}
                              onChange={(font) => updateField({ headingFont: font })}
                            />
                          </div>
                          <div>
                            <span className="text-[9.5px] text-[#6a7682] block mb-0.5">
                              Body
                            </span>
                            <FontSelector
                              value={draft.bodyFont}
                              onChange={(font) => updateField({ bodyFont: font })}
                            />
                          </div>
                        </div>

                        {/* Logo */}
                        <div className="flex items-center justify-between gap-1.5 pt-0.5">
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-[7px] border border-[#e5e9ee] bg-white hover:bg-[#f4f2ff] text-[10.5px] font-medium text-[#4a5661] hover:text-[#5c4bb8] cursor-pointer"
                          >
                            <Upload size={11} />
                            <span>{draft.logoSrc ? 'Replace Logo' : 'Upload Logo'}</span>
                          </button>
                          {draft.logoSrc && (
                            <>
                              <button
                                type="button"
                                onClick={handleAutoPickFromLogo}
                                className="p-1.5 rounded-[7px] bg-[#efeafd] text-[#5c4bb8] hover:bg-[#e4dbfc] cursor-pointer"
                                title="Extract Colors from Logo"
                              >
                                <Wand2 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => addImage(draft.logoSrc!, { width: 120, height: 120 })}
                                className="p-1.5 rounded-[7px] border border-[#e5e9ee] bg-white text-[#4a5661] hover:text-[#5c4bb8] cursor-pointer"
                                title="Stamp Logo on Page"
                              >
                                <ImagePlus size={12} />
                              </button>
                            </>
                          )}
                        </div>

                        {draft.logoSrc && (
                          <label className="flex items-center gap-1.5 text-[10.5px] text-[#4a5661] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={stampLogo}
                              onChange={(e) => setStampLogo(e.target.checked)}
                              className="rounded border-[#d8dee6] text-[#6e56cf]"
                            />
                            <span>Stamp logo when tapping card</span>
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {subTab === 'board' && (
          <>
            <p className="text-[11px] text-[#6a7682]">
              Reflow &ldquo;{activePage.name}&rdquo; into multiple social, print, or web sizes on your artboard.
            </p>

            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() =>
                  setSelectedSizes(['ig-post', 'ig-story', 'yt-thumb', 'fb-cover', 'linkedin-banner'])
                }
                className="py-1.5 px-2 rounded-[7px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] text-[10.5px] font-semibold text-[#4a5661] cursor-pointer"
              >
                Social
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedSizes(['flyer', 'poster', 'postcard', 'business-card', 'trifold'])
                }
                className="py-1.5 px-2 rounded-[7px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] text-[10.5px] font-semibold text-[#4a5661] cursor-pointer"
              >
                Print
              </button>
              <button
                type="button"
                onClick={() =>
                  setSelectedSizes(['hero-banner', 'brand-logo', 'ig-post', 'fb-cover', 'linkedin-banner'])
                }
                className="py-1.5 px-2 rounded-[7px] border border-[#e5e9ee] bg-[#f8fafb] hover:bg-[#f4f2ff] text-[10.5px] font-semibold text-[#4a5661] cursor-pointer"
              >
                Web
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#4a5661]">Layout Style</span>
              <select
                value={layoutStyle}
                onChange={(e) => setLayoutStyle(e.target.value as CompositionStyle)}
                className="w-full h-7 px-2 rounded-[8px] border border-[#e5e9ee] bg-[#f8fafb] text-[11px] font-medium text-[#161a22] outline-none cursor-pointer"
              >
                <option value="auto">Auto Smart Reflow</option>
                <option value="editorial">Editorial</option>
                <option value="minimal">Minimalist</option>
                <option value="bold">Bold / Dynamic</option>
              </select>
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {PAGE_SIZES.map((sz) => {
                const checked = selectedSizes.includes(sz.name);
                return (
                  <button
                    key={sz.name}
                    type="button"
                    onClick={() => toggleSize(sz.name)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[8px] border text-left text-[11px] transition cursor-pointer ${
                      checked
                        ? 'border-[#d3c9f9] bg-[#f4f2ff] text-[#5c4bb8] font-semibold'
                        : 'border-[#e5e9ee] bg-white hover:bg-[#f8fafb] text-[#4a5661]'
                    }`}
                  >
                    <span className="truncate">{sz.name}</span>
                    {checked && <Check size={12} className="flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={selectedSizes.length === 0}
              onClick={() => {
                generateBrandBoardSizes(selectedSizes, layoutStyle);
                setViewMode('artboard');
                setZoom(0.4);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-[9px] bg-[#6e56cf] hover:bg-[#5c4bb8] disabled:opacity-40 text-white text-xs font-semibold transition cursor-pointer"
            >
              <Sparkles size={13} />
              <span>Generate ({selectedSizes.length} Sizes)</span>
            </button>
          </>
        )}

        {subTab === 'schemes' && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[#4a5661]">Tap a Scheme to Apply</span>
            {COLOR_SCHEMES.map((scheme) => (
              <button
                key={scheme.id}
                type="button"
                onClick={() => setColorScheme(scheme.id)}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-[10px] border border-[#e5e9ee] bg-white hover:border-[#6e56cf] hover:bg-[#f4f2ff] transition cursor-pointer"
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
        )}
      </div>
    </div>
  );
};
