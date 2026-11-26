import React, { useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { PAGE_SIZES } from '../../constants/pageSizes';
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

  const handleGenerate = () => {
    if (selectedSizes.length === 0) return;
    generateBrandBoardSizes(selectedSizes);
    setViewMode('artboard');
    setZoom(0.4);
    setIsBrandBoardModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 flex items-center justify-center p-4 select-none"
      onClick={() => setIsBrandBoardModalOpen(false)}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-sm">
              <LayoutGrid size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>Brand Planning Board — Magic Multi-Size</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
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
          {/* Quick Suites */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectSocialSuite}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-semibold transition cursor-pointer"
              >
                + Social Media Suite
              </button>
              <button
                type="button"
                onClick={selectPrintSuite}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                + Print & Cards Suite
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
                            ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500/30 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-slate-50'
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
                              ? 'bg-indigo-600 border-indigo-600 text-white'
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
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Selected: <strong>{selectedSizes.length}</strong> artboards (each can be deleted or moved on canvas)
          </span>
          <button
            type="button"
            disabled={selectedSizes.length === 0}
            onClick={handleGenerate}
            className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Generate {selectedSizes.length} Brand Artboards</span>
          </button>
        </div>
      </div>
    </div>
  );
};
