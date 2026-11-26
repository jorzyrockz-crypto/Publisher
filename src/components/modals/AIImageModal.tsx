import React, { useRef, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import {
  AIArtStyle,
  AICloudModel,
  AICreationType,
  AIEngineMode,
  AIAspectRatio,
  AI_ART_STYLES,
  AI_CLOUD_MODELS,
  AI_CREATION_TYPES,
  ASPECT_RATIOS,
  CATEGORIZED_PROMPT_PRESETS,
  GeneratedImageResult,
  PROCEDURAL_MOTIFS,
  ProceduralMotif,
  enhancePromptText,
  generateHybridAIImage,
} from '../../utils/aiImageGenerator';
import { removeImageBackground } from '../../utils/bgRemoval';
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
  Eraser,
  SlidersHorizontal,
  Ban,
} from 'lucide-react';

export const AIImageModal: React.FC = () => {
  const { isAIImageModalOpen, setIsAIImageModalOpen, addImage, activePage } = usePublisher();

  const [creationType, setCreationType] = useState<AICreationType>('photo');
  const [prompt, setPrompt] = useState(
    'Smiling college graduate holding diploma, warm sunlight, studio portrait'
  );
  const [negativePrompt, setNegativePrompt] = useState('blurry, watermark, distorted text, cropped');
  const [showNegative, setShowNegative] = useState(false);

  const [engineMode, setEngineMode] = useState<AIEngineMode>('hybrid');
  const [cloudModel, setCloudModel] = useState<AICloudModel>('flux');
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('studiopress_gemini_api_key') || '';
    } catch {
      return '';
    }
  });
  const [showKeyBar, setShowKeyBar] = useState(false);

  const [artStyle, setArtStyle] = useState<AIArtStyle>('photorealistic');
  const [motif, setMotif] = useState<ProceduralMotif>('aurora-mesh');
  const [ratioId, setRatioId] = useState<AIAspectRatio>('1:1');
  const [batchCount, setBatchCount] = useState<1 | 2>(1);
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 999999));

  const [showProceduralOpts, setShowProceduralOpts] = useState(false);
  const [complexity, setComplexity] = useState<number>(5);
  const [grain, setGrain] = useState<number>(18);
  const [hdPrint, setHdPrint] = useState<boolean>(false);
  const [useCustomPalette, setUseCustomPalette] = useState<boolean>(false);
  const [customPalette, setCustomPalette] = useState({
    bg1: '#0f172a',
    bg2: '#064e3b',
    accent1: '#10b981',
    accent2: '#f59e0b',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentBatch, setCurrentBatch] = useState<GeneratedImageResult[]>([]);
  const [currentResult, setCurrentResult] = useState<GeneratedImageResult | null>(null);
  const [history, setHistory] = useState<GeneratedImageResult[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  if (!isAIImageModalOpen) return null;

  const selectedRatio = ASPECT_RATIOS.find((r) => r.id === ratioId) || ASPECT_RATIOS[0];
  const activePresets = CATEGORIZED_PROMPT_PRESETS[creationType] || [];

  const handleSelectCreationType = (nextType: AICreationType) => {
    setCreationType(nextType);
    const firstPreset = CATEGORIZED_PROMPT_PRESETS[nextType]?.[0];
    const allDefaults = Object.values(CATEGORIZED_PROMPT_PRESETS).flat();
    if (firstPreset && (!prompt.trim() || allDefaults.includes(prompt.trim()))) {
      setPrompt(firstPreset);
    }
    if (nextType === 'clipart' || nextType === 'logo') {
      setArtStyle('minimal-vector');
      setRatioId('1:1');
    } else if (nextType === 'backdrop') {
      setArtStyle('editorial');
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsGenerating(false);
  };

  const handleGenerate = async (customSeed?: number) => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      setErrorMsg('Please enter a prompt or pick a quick preset.');
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const baseSeed = customSeed ?? seed;
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const seeds = batchCount === 2 ? [baseSeed, baseSeed + 137] : [baseSeed];
      const results = await Promise.all(
        seeds.map((s) =>
          generateHybridAIImage(cleanPrompt, {
            mode: engineMode,
            cloudModel,
            creationType,
            negativePrompt: showNegative ? negativePrompt : undefined,
            ratio: selectedRatio,
            style: artStyle,
            motif,
            seed: s,
            complexity,
            grain,
            hdPrint,
            customPalette: useCustomPalette ? customPalette : undefined,
            geminiApiKey,
            signal: controller.signal,
          })
        )
      );
      setCurrentBatch(results);
      setCurrentResult(results[0]);
      setHistory((prev) => [...results, ...prev].slice(0, 8));
    } catch (err) {
      const code = err instanceof Error ? err.message : 'Error';
      if (code === 'Generation cancelled') {
        setErrorMsg('Generation cancelled.');
      } else {
        setErrorMsg(
          code === 'RATE_LIMITED'
            ? 'Cloud AI is rate-limited right now (429). Wait a few seconds or switch to Hybrid / Offline Art.'
            : `${code} — Try another Cloud Model or switch to Auto Hybrid / Offline Art.`
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleTogglePreviewBgRemoval = async () => {
    if (!currentResult) return;
    if (currentResult.bgRemoved && currentResult.originalDataUrl) {
      const restored: GeneratedImageResult = {
        ...currentResult,
        dataUrl: currentResult.originalDataUrl,
        originalDataUrl: undefined,
        bgRemoved: false,
      };
      setCurrentResult(restored);
      setCurrentBatch((b) => b.map((item) => (item.seed === currentResult.seed ? restored : item)));
      return;
    }

    setIsRemovingBg(true);
    try {
      const cleaned = await removeImageBackground(currentResult.dataUrl, {
        mode: 'flood',
        targetColor: 'auto',
        tolerance: 30,
        feather: 1,
      });
      const updated: GeneratedImageResult = {
        ...currentResult,
        originalDataUrl: currentResult.dataUrl,
        dataUrl: cleaned,
        bgRemoved: true,
      };
      setCurrentResult(updated);
      setCurrentBatch((b) => b.map((item) => (item.seed === currentResult.seed ? updated : item)));
    } finally {
      setIsRemovingBg(false);
    }
  };

  const computeInsertSize = () => {
    const maxW = Math.max(160, activePage.width - 80);
    const ratioScale = Math.min(1, maxW / selectedRatio.insertWidth);
    return {
      width: Math.round(selectedRatio.insertWidth * ratioScale),
      height: Math.round(selectedRatio.insertHeight * ratioScale),
    };
  };

  const handleInsert = (asSticker = false) => {
    if (!currentResult?.dataUrl) return;
    const { width, height } = computeInsertSize();

    addImage(currentResult.dataUrl, {
      name: `${asSticker ? 'Sticker' : 'AI Art'}: ${currentResult.prompt.slice(0, 22)}`,
      width: asSticker ? Math.min(200, width) : width,
      height: asSticker ? Math.min(200, height) : height,
      x: Math.round((activePage.width - (asSticker ? Math.min(200, width) : width)) / 2),
      y: Math.round((activePage.height - (asSticker ? Math.min(200, height) : height)) / 2),
      objectFit: asSticker || currentResult.bgRemoved ? 'contain' : 'cover',
      ...(asSticker
        ? {
            effectPreset: 'sticker' as const,
            isSticker: true,
            stickerOutlineColor: '#ffffff',
            stickerOutlineWidth: 5,
            stickerFinish: 'matte' as const,
            borderWidth: 0,
          }
        : {}),
    });
    setIsAIImageModalOpen(false);
  };

  const handleSetAsBackground = () => {
    if (!currentResult?.dataUrl) return;
    addImage(currentResult.dataUrl, {
      name: `Page Background: ${currentResult.prompt.slice(0, 20)}`,
      x: 0,
      y: 0,
      width: activePage.width,
      height: activePage.height,
      zIndex: 0,
      objectFit: 'cover',
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
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + Creation Type Switcher */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
              <Wand2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span>AI Image Studio</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  Flux + Gemini + Cutout
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Create photos, die-cut stickers, logos, and editorial backdrops
              </p>
            </div>
          </div>

          {/* Creation Mode Chips */}
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-2xl">
            {AI_CREATION_TYPES.map((ct) => (
              <button
                key={ct.id}
                type="button"
                onClick={() => handleSelectCreationType(ct.id)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                  creationType === ct.id
                    ? 'bg-white text-indigo-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {ct.label}
              </button>
            ))}
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
          {/* Left Column: Prompt & Controls */}
          <div className="md:col-span-5 p-5 space-y-3.5 bg-white">
            {/* Engine Mode + Cloud Model */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600">
                  Generation Engine
                </label>
                <button
                  type="button"
                  onClick={() => setShowKeyBar(!showKeyBar)}
                  className="text-[10px] font-bold text-indigo-700 hover:underline"
                >
                  {geminiApiKey ? 'Gemini Key Set ✓' : '+ Gemini API Key (Optional)'}
                </button>
              </div>

              {showKeyBar && (
                <div className="p-2 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-center gap-1.5">
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGeminiApiKey(val);
                      try {
                        if (val.trim()) localStorage.setItem('studiopress_gemini_api_key', val.trim());
                        else localStorage.removeItem('studiopress_gemini_api_key');
                      } catch {
                        // ignore
                      }
                    }}
                    placeholder="Paste Gemini API key..."
                    className="flex-1 bg-white border border-indigo-200 rounded-lg px-2 py-1 text-[10.5px] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyBar(false)}
                    className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold"
                  >
                    Done
                  </button>
                </div>
              )}

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
                          ? 'bg-white text-indigo-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon size={12} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {engineMode !== 'procedural' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold text-slate-500">
                      Cloud Model
                    </label>
                    {cloudModel === 'gemini' && (
                      <span className="text-[10px] text-amber-600 font-medium">
                        Requires Google Cloud Billing
                      </span>
                    )}
                  </div>
                  <select
                    value={cloudModel}
                    onChange={(e) => setCloudModel(e.target.value as AICloudModel)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-600"
                  >
                    {AI_CLOUD_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Prompt Input + Magic Enhance */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600">
                  Describe Your {AI_CREATION_TYPES.find((t) => t.id === creationType)?.label}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNegative(!showNegative)}
                    className="text-[10px] font-semibold text-slate-500 hover:text-slate-800"
                  >
                    {showNegative ? 'Hide Negative' : '+ Negative'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrompt(enhancePromptText(prompt, creationType, artStyle))}
                    className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1 transition"
                    title="Expand short prompt with studio details"
                  >
                    <Sparkles size={10} /> Magic Enhance
                  </button>
                </div>
              </div>

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
                placeholder="Describe subject, lighting, mood, or sticker object..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none transition"
              />

              {showNegative && (
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Avoid (e.g. blurry, text, watermark, background)..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700 outline-none focus:border-indigo-500"
                />
              )}

              <div className="flex flex-wrap gap-1">
                {activePresets.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrompt(preset)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 text-slate-600 border border-slate-200/70 transition truncate max-w-[185px]"
                    title={preset}
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Style, Aspect Ratio & Variations */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-600 mb-1">
                  Art Style
                </label>
                <select
                  value={artStyle}
                  onChange={(e) => setArtStyle(e.target.value as AIArtStyle)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-medium outline-none focus:border-indigo-600"
                >
                  {AI_ART_STYLES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10.5px] font-bold text-slate-600 mb-1">
                  Ratio
                </label>
                <select
                  value={ratioId}
                  onChange={(e) => setRatioId(e.target.value as AIAspectRatio)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-medium outline-none focus:border-indigo-600"
                >
                  {ASPECT_RATIOS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10.5px] font-bold text-slate-600 mb-1">
                  Variations
                </label>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/70">
                  {([1, 2] as const).map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setBatchCount(cnt)}
                      className={`py-1 rounded-lg text-[11px] font-bold transition ${
                        batchCount === cnt
                          ? 'bg-white text-indigo-800 shadow-2xs'
                          : 'text-slate-600'
                      }`}
                    >
                      {cnt}×
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Collapsible Procedural Fallback Controls */}
            {engineMode !== 'cloud' && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProceduralOpts(!showProceduralOpts)}
                  className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 hover:text-indigo-700 py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal size={12} />
                    <span>Offline Procedural Motif &amp; Palette</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {engineMode === 'procedural' || showProceduralOpts ? 'Hide' : 'Show'}
                  </span>
                </button>

                {(engineMode === 'procedural' || showProceduralOpts) && (
                  <div className="space-y-2.5 pt-2">
                    <div className="grid grid-cols-3 gap-1 max-h-24 overflow-y-auto pr-0.5">
                      {PROCEDURAL_MOTIFS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMotif(m.id)}
                          className={`py-1 px-1.5 rounded-lg border text-[10px] font-semibold transition ${
                            motif === m.id
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                          <span>Detail</span>
                          <span>{complexity}/10</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={complexity}
                          onChange={(e) => setComplexity(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                          <span>Film Grain</span>
                          <span>{grain}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={grain}
                          onChange={(e) => setGrain(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useCustomPalette}
                          onChange={(e) => setUseCustomPalette(e.target.checked)}
                          className="accent-indigo-600 rounded"
                        />
                        <span>Custom Colors</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hdPrint}
                          onChange={(e) => setHdPrint(e.target.checked)}
                          className="accent-indigo-600 rounded"
                        />
                        <span>2× Print-HD</span>
                      </label>
                    </div>
                    {useCustomPalette && (
                      <div className="grid grid-cols-4 gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                        {(
                          [
                            { key: 'bg1', label: 'BG 1' },
                            { key: 'bg2', label: 'BG 2' },
                            { key: 'accent1', label: 'Art 1' },
                            { key: 'accent2', label: 'Art 2' },
                          ] as const
                        ).map((item) => (
                          <div key={item.key} className="flex flex-col items-center gap-0.5">
                            <input
                              type="color"
                              value={customPalette[item.key]}
                              onChange={(e) =>
                                setCustomPalette((p) => ({ ...p, [item.key]: e.target.value }))
                              }
                              className="w-6 h-6 rounded-full border border-slate-200 cursor-pointer p-0"
                            />
                            <span className="text-[9px] text-slate-500 font-semibold">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Generate / Cancel Row */}
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => {
                  const nextSeed = Math.floor(Math.random() * 999999);
                  setSeed(nextSeed);
                  handleGenerate(nextSeed);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Generating ({batchCount}×)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Generate {AI_CREATION_TYPES.find((t) => t.id === creationType)?.label}</span>
                  </>
                )}
              </button>

              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 transition"
                  title="Cancel generation"
                >
                  <Ban size={13} />
                  <span>Cancel</span>
                </button>
              ) : (
                <button
                  type="button"
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
              )}
            </div>
          </div>

          {/* Right Column: Live Output Canvas, Cutout Tool & Gallery */}
          <div className="md:col-span-7 p-5 bg-slate-50 flex flex-col justify-between gap-3.5">
            <div className="flex-1 flex flex-col items-center justify-center min-h-[290px] rounded-2xl border-2 border-dashed border-slate-200 bg-white p-4 relative overflow-hidden">
              {currentResult ? (
                <div className="flex flex-col items-center gap-2.5 w-full">
                  <div className="flex items-center justify-between w-full gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        currentResult.source === 'cloud'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {currentResult.modelLabel ||
                        (currentResult.source === 'cloud' ? 'Cloud AI' : 'Procedural Art')}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isRemovingBg}
                        onClick={handleTogglePreviewBgRemoval}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${
                          currentResult.bgRemoved
                            ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100'
                        }`}
                        title="Remove background cleanly to preview and insert as transparent cutout or die-cut sticker"
                      >
                        <Eraser size={11} />
                        <span>
                          {isRemovingBg
                            ? 'Removing...'
                            : currentResult.bgRemoved
                            ? 'Restore BG'
                            : 'Remove BG'}
                        </span>
                      </button>

                      <span className="text-[10px] font-mono text-slate-400">
                        {currentResult.width}×{currentResult.height}
                      </span>
                    </div>
                  </div>

                  {/* Preview Canvas (Checkerboard when BG removed) */}
                  <div
                    className="rounded-xl overflow-hidden border border-slate-200 shadow-md flex items-center justify-center"
                    style={
                      currentResult.bgRemoved
                        ? {
                            backgroundImage:
                              'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                            backgroundSize: '16px 16px',
                            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                          }
                        : undefined
                    }
                  >
                    <img
                      src={currentResult.dataUrl}
                      alt={currentResult.prompt}
                      className="max-h-[250px] w-auto object-contain"
                    />
                  </div>

                  {/* 2-Variation Switcher when batchCount === 2 */}
                  {currentBatch.length > 1 && (
                    <div className="flex items-center gap-2">
                      {currentBatch.map((bItem, bIdx) => (
                        <button
                          key={bItem.seed}
                          type="button"
                          onClick={() => setCurrentResult(bItem)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border text-[10px] font-bold transition cursor-pointer ${
                            currentResult.seed === bItem.seed
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                              : 'border-slate-200 bg-white text-slate-600'
                          }`}
                        >
                          <img
                            src={bItem.dataUrl}
                            alt=""
                            className="w-6 h-6 rounded object-cover"
                          />
                          <span>Var {bIdx + 1}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {currentResult.fallbackNotice && (
                    <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-[10.5px] text-amber-800">
                      <AlertCircle size={13} className="flex-shrink-0" />
                      <span>{currentResult.fallbackNotice}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center max-w-sm space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto">
                    <Wand2 size={22} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    Ready to Create Artwork
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Pick <strong>Photo</strong>, <strong>Clipart / Sticker</strong>, <strong>Logo</strong>, or <strong>Poster Backdrop</strong> — generate freely with <strong>Flux.1</strong>, customize aspect ratios, or remove backgrounds for die-cut stickers.
                  </p>
                </div>
              )}

              {errorMsg && (
                <div className="mt-2.5 w-full flex items-start justify-between gap-3 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-rose-600" />
                    <span className="leading-relaxed">{errorMsg}</span>
                  </div>
                  {cloudModel === 'gemini' && (
                    <button
                      type="button"
                      onClick={() => {
                        setCloudModel('flux');
                        setErrorMsg(null);
                        handleGenerate();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] whitespace-nowrap hover:bg-indigo-700 transition cursor-pointer flex-shrink-0"
                    >
                      Switch to Flux.1 Free
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Session History & Insert Controls */}
            <div className="space-y-3">
              {history.length > 1 && (
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Recent Creations ({history.length})
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {history.map((item, idx) => (
                      <button
                        key={`${item.seed}-${idx}`}
                        type="button"
                        onClick={() => {
                          setCurrentResult(item);
                          setPrompt(item.prompt);
                        }}
                        className={`w-12 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition cursor-pointer ${
                          currentResult === item
                            ? 'border-indigo-600 shadow-xs'
                            : 'border-slate-200 opacity-80 hover:opacity-100'
                        }`}
                        title={item.prompt}
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

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 flex-wrap">
                <button
                  type="button"
                  disabled={!currentResult}
                  onClick={handleDownload}
                  className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  disabled={!currentResult}
                  onClick={handleSetAsBackground}
                  className="py-2 px-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 text-indigo-800 text-xs font-semibold transition cursor-pointer"
                >
                  Set as BG
                </button>
                <button
                  type="button"
                  disabled={!currentResult}
                  onClick={() => handleInsert(true)}
                  className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                  title="Insert as frameless die-cut Sticker with contour outline"
                >
                  <Sparkles size={13} />
                  <span>Insert as Sticker</span>
                </button>
                <button
                  type="button"
                  disabled={!currentResult}
                  onClick={() => handleInsert(false)}
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ImagePlus size={13} />
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
