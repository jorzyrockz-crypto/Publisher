import React, { useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { PAGE_SIZES } from '../../constants/pageSizes';
import { CompositionStyle } from '../../utils/designBlueprints';
import { Sparkles, X, Check, LayoutGrid } from 'lucide-react';

export const BrandBoardModal: React.FC = () => {
  const {
    isBrandBoardModalOpen,
    setIsBrandBoardModalOpen,
    activePage,
    generateBrandBoardSizes,
    setZoom,
    setViewMode,
  } = usePublisher();

  const [layoutStyle, setLayoutStyle] = useState<CompositionStyle>('auto');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([
    'ig-post',
    'ig-story',
    'yt-thumb',
    'fb-cover',
    'linkedin-banner',
  ]);

  if (!isBrandBoardModalOpen) return null;

  const toggleSize = (name: string) => {
    setSelectedSizes((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const selectSocialSuite = () => {
    setSelectedSizes(['ig-post', 'ig-story', 'yt-thumb', 'fb-cover', 'linkedin-banner']);
  };

  const selectPrintSuite = () => {
    setSelectedSizes(['flyer', 'poster', 'postcard', 'business-card', 'trifold']);
  };

  const selectWebBrandKit = () => {
    setSelectedSizes(['hero-banner', 'brand-logo', 'ig-post', 'fb-cover', 'linkedin-banner']);
  };

  const handleGenerate = () => {
    if (selectedSizes.length === 0) return;
    generateBrandBoardSizes(selectedSizes, layoutStyle);
    setViewMode('artboard');
    setZoom(0.4);
    setIsBrandBoardModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#15232d]/35 backdrop-blur-[2px] flex items-center justify-center p-4 select-none"
      onClick={() => setIsBrandBoardModalOpen(false)}
    >
      <div
        className="bg-white rounded-[15px] shadow-[0_20px_70px_rgba(21,35,45,0.22)] border border-[#e5e9ee] max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e9ee] flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#8a6ff0] to-[#5a44c9] text-white flex items-center justify-center shadow-sm">
              <LayoutGrid size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>Brand Planning Board — Magic Multi-Size</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#efeafd] text-[#5c4bb8]">
                  Smart Reflow
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Convert &ldquo;{activePage.name}&rdquo; ({activePage.width}×{activePage.height}px) into multiple sizes arranged automatically on your canvas
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsBrandBoardModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Composition Style Selector */}
          <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-50 p-3 rounded-2xl border border-[#e5e9ee]">
            <div>
              <div className="text-xs font-bold text-slate-700">Intelligent Designer Style</div>
              <div className="text-[10.5px] text-slate-400">
                Measures wrapped headlines &amp; locks button proportions automatically
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-xl">
              {(
                [
                  { id: 'auto', label: 'Smart Auto' },
                  { id: 'editorial', label: 'Editorial Left' },
                  { id: 'centered', label: 'Centered' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLayoutStyle(opt.id)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition ${
                    layoutStyle === opt.id
                      ? 'bg-white text-[#5c4bb8] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Suites */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectSocialSuite}
                className="px-3 py-1.5 rounded-xl bg-[#efeafd] hover:bg-[#efeafd] border border-[#d3c9f9] text-[#5c4bb8] text-xs font-semibold transition cursor-pointer"
              >
                + Social Media Suite
              </button>
              <button
                type="button"
                onClick={selectPrintSuite}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-[#e5e9ee] text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                + Print & Cards Suite
              </button>
              <button
                type="button"
                onClick={selectWebBrandKit}
                className="px-3 py-1.5 rounded-xl bg-[#efeafd] hover:bg-[#efeafd] border border-[#d3c9f9] text-[#5c4bb8] text-xs font-semibold transition cursor-pointer"
              >
                + Web & Brand Kit
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSizes([])}
              className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition"
            >
              Clear Selection
            </button>
          </div>

          {/* Size Selection Grid */}
          {(['Card & Social', 'Marketing', 'Standard'] as const).map((cat) => {
            const sizes = PAGE_SIZES.filter((s) => s.category === cat);
            return (
              <div key={cat} className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {cat}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {sizes.map((size) => {
                    const isChecked = selectedSizes.includes(size.name);
                    const aspect = size.width / size.height;
                    const boxH = aspect >= 1 ? Math.max(12, Math.round(32 / aspect)) : 32;
                    const boxW = aspect >= 1 ? 32 : Math.max(12, Math.round(32 * aspect));

                    return (
                      <button
                        key={size.name}
                        type="button"
                        onClick={() => toggleSize(size.name)}
                        className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition cursor-pointer ${
                          isChecked
                            ? 'border-indigo-600 bg-[#efeafd] ring-1 ring-[#6e56cf]/30 shadow-2xs'
                            : 'border-[#e5e9ee] bg-white hover:border-[#d3c9f9] hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                          <div
                            style={{ width: `${boxW}px`, height: `${boxH}px` }}
                            className={`rounded-sm border-2 transition ${
                              isChecked
                                ? 'border-indigo-600 bg-indigo-200/70'
                                : 'border-slate-300 bg-slate-100'
                            }`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-800 truncate">
                            {size.displayName.split(' (')[0]}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {size.width}×{size.height}px
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border ${
                            isChecked
                              ? 'bg-[#6e56cf] border-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check size={12} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e9ee] bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Selected: <strong>{selectedSizes.length}</strong> artboards (each can be deleted or moved on canvas)
          </span>
          <button
            type="button"
            disabled={selectedSizes.length === 0}
            onClick={handleGenerate}
            className="py-2 px-5 rounded-xl bg-[#6e56cf] hover:bg-[#5c4bb8] disabled:bg-slate-300 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Generate {selectedSizes.length} Brand Artboards</span>
          </button>
        </div>
      </div>
    </div>
  );
};
