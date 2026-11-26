import React, { useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import {
  AIArtStyle,
  AIEngineMode,
  AIAspectRatio,
  AI_ART_STYLES,
  ASPECT_RATIOS,
  GeneratedImageResult,
  PROCEDURAL_MOTIFS,
  PROMPT_PRESETS,
  ProceduralMotif,
  generateHybridAIImage,
} from '../../utils/aiImageGenerator';
import {
  Wand2,
  X,
  Sparkles,
  Download,
  RefreshCw,
  ImagePlus,
  Cpu,
  Cloud,
  Zap,
  AlertCircle,
} from 'lucide-react';

export const AIImageModal: React.FC = () => {
  const { isAIImageModalOpen, setIsAIImageModalOpen, addImage, activePage } = usePublisher();

  const [prompt, setPrompt] = useState(
    'Modern emerald and gold geometric waves editorial backdrop'
  );
  const [engineMode, setEngineMode] = useState<AIEngineMode>('hybrid');
  const [artStyle, setArtStyle] = useState<AIArtStyle>('editorial');
  const [motif, setMotif] = useState<ProceduralMotif>('aurora-mesh');
  const [ratioId, setRatioId] = useState<AIAspectRatio>('4:3');
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 999999));

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<GeneratedImageResult | null>(null);
  const [history, setHistory] = useState<GeneratedImageResult[]>([]);

  if (!isAIImageModalOpen) return null;

  const selectedRatio = ASPECT_RATIOS.find((r) => r.id === ratioId) || ASPECT_RATIOS[1];

  const handleGenerate = async (customSeed?: number) => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      setErrorMsg('Please enter a prompt or pick a quick preset.');
      return;
    }

    const activeSeed = customSeed ?? seed;
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const result = await generateHybridAIImage(cleanPrompt, {
        mode: engineMode,
        ratio: selectedRatio,
        style: artStyle,
        motif,
        seed: activeSeed,
      });
      setCurrentResult(result);
      setHistory((prev) => [result, ...prev.slice(0, 5)]);
    } catch (err) {
      const code = err instanceof Error ? err.message : 'Error';
      setErrorMsg(
        code === 'RATE_LIMITED'
          ? 'Cloud AI is rate-limited right now (429). Wait a few seconds or switch to Hybrid / Offline Art.'
          : 'Cloud AI request failed or timed out. Switch to Hybrid or Offline Art for instant results.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = () => {
    if (!currentResult?.dataUrl) return;
    const maxW = Math.max(160, activePage.width - 80);
    const ratioScale = Math.min(1, maxW / selectedRatio.insertWidth);
    const width = Math.round(selectedRatio.insertWidth * ratioScale);
    const height = Math.round(selectedRatio.insertHeight * ratioScale);

    addImage(currentResult.dataUrl, {
      name: `AI Art: ${currentResult.prompt.slice(0, 24)}`,
      width,
      height,
      x: Math.round((activePage.width - width) / 2),
      y: Math.round((activePage.height - height) / 2),
    });
    setIsAIImageModalOpen(false);
  };

  const handleDownload = () => {
    if (!currentResult?.dataUrl) return;
    const link = document.createElement('a');
    link.href = currentResult.dataUrl;
    link.download = `publisher-ai-${currentResult.seed}.png`;
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 flex items-center justify-center p-4 select-none"
      onClick={() => setIsAIImageModalOpen(false)}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
              <Wand2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>Free AI Image Studio</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Hybrid Engine
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Free Cloud AI (Pollinations) with instant offline Procedural Art fallback
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAIImageModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition"
            title="Close Studio"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left Column: Prompt & Settings */}
          <div className="md:col-span-5 p-5 space-y-4 bg-white">
            {/* Engine Mode */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                Generation Engine
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
                {(
                  [
                    { id: 'hybrid', label: 'Auto Hybrid', icon: Zap },
                    { id: 'cloud', label: 'Cloud AI', icon: Cloud },
                    { id: 'procedural', label: 'Offline Art', icon: Cpu },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEngineMode(item.id)}
                      className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-[11px] font-semibold transition ${
                        engineMode === item.id
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon size={12} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                Describe Your Image
              </label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder="e.g. Minimalist sunset mountains, bold vector shapes, warm gold tones..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none transition"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {PROMPT_PRESETS.slice(0, 3).map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrompt(preset)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 border border-slate-200/70 transition truncate max-w-[190px]"
                    title={preset}
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style & Aspect Ratio */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Art Style
                </label>
                <select
                  value={artStyle}
                  onChange={(e) => setArtStyle(e.target.value as AIArtStyle)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 text-xs font-medium outline-none focus:border-emerald-600"
                >
                  {AI_ART_STYLES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Aspect Ratio
                </label>
                <select
                  value={ratioId}
                  onChange={(e) => setRatioId(e.target.value as AIAspectRatio)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 text-xs font-medium outline-none focus:border-emerald-600"
                >
                  {ASPECT_RATIOS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Offline Procedural Motif (shown when Hybrid or Procedural) */}
            {engineMode !== 'cloud' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Procedural Pattern Motif (Instant / Fallback)
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {PROCEDURAL_MOTIFS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMotif(m.id)}
                      className={`py-1 px-1.5 rounded-lg border text-[10.5px] font-semibold transition ${
                        motif === m.id
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => {
                  const nextSeed = Math.floor(Math.random() * 999999);
                  setSeed(nextSeed);
                  handleGenerate(nextSeed);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Generating Artwork...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Generate Image</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => {
                  const nextSeed = Math.floor(Math.random() * 999999);
                  setSeed(nextSeed);
                  handleGenerate(nextSeed);
                }}
                title="New Random Variation"
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* Right Column: Live Output & History */}
          <div className="md:col-span-7 p-5 bg-slate-50 flex flex-col justify-between gap-4">
            <div className="flex-1 flex flex-col items-center justify-center min-h-[280px] rounded-2xl border-2 border-dashed border-slate-200 bg-white p-4 relative overflow-hidden">
              {currentResult ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        currentResult.source === 'cloud'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {currentResult.source === 'cloud'
                        ? 'Pollinations Cloud AI'
                        : 'Instant Procedural Art'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {currentResult.width}×{currentResult.height}px • Seed #{currentResult.seed}
                    </span>
                  </div>

                  <img
                    src={currentResult.dataUrl}
                    alt={currentResult.prompt}
                    className="max-h-[260px] w-auto object-contain rounded-xl shadow-md border border-slate-200"
                  />

                  {currentResult.fallbackNotice && (
                    <div className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>{currentResult.fallbackNotice}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center max-w-xs space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                    <Wand2 size={22} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    Ready to Create Artwork
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Enter a prompt and click <strong>Generate Image</strong>. Hybrid mode uses Free Cloud AI when available and falls back instantly to Procedural Art if rate-limited or offline.
                  </p>
                </div>
              )}

              {errorMsg && (
                <div className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Session History & Insert Controls */}
            <div className="space-y-3">
              {history.length > 1 && (
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Recent Creations
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {history.map((item, idx) => (
                      <button
                        key={`${item.seed}-${idx}`}
                        type="button"
                        onClick={() => setCurrentResult(item)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition ${
                          currentResult === item
                            ? 'border-emerald-600 shadow-xs'
                            : 'border-slate-200 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={item.dataUrl}
                          alt={item.prompt}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  disabled={!currentResult}
                  onClick={handleDownload}
                  className="py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download size={14} />
                  <span>Download PNG</span>
                </button>
                <button
                  type="button"
                  disabled={!currentResult}
                  onClick={handleInsert}
                  className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ImagePlus size={14} />
                  <span>Insert onto Page</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
