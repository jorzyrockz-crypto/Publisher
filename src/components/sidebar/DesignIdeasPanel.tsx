import React, { useMemo, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { ElementRenderer } from '../canvas/ElementRenderer';
import { buildPatternBackgroundStyle } from '../../utils/patternGenerator';
import { buildLinearGradientCss } from '../../constants/gradientSwatches';
import {
  AIDesignAdvice,
  DesignRecommendationCategory,
  fetchAIDesignAdvice,
  generateDesignRecommendations,
} from '../../utils/designRecommendations';
import { Sparkles, Wand2, Settings2, Check } from 'lucide-react';

const GEMINI_KEY_STORAGE = 'studiopress_gemini_api_key';

export const DesignIdeasPanel: React.FC = () => {
  const {
    project,
    activePage,
    applyDesignRecommendation,
  } = usePublisher();

  const [category, setCategory] = useState<DesignRecommendationCategory>('all');
  const [vibePrompt, setVibePrompt] = useState('');
  const [aiAdvice, setAiAdvice] = useState<AIDesignAdvice | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [apiKeyDraft, setApiKeyDraft] = useState(() => {
    try {
      return localStorage.getItem(GEMINI_KEY_STORAGE) || '';
    } catch {
      return '';
    }
  });

  const recommendations = useMemo(() => {
    const all = generateDesignRecommendations(activePage, aiAdvice);
    if (category === 'all') return all;
    return all.filter((r) => r.category === category);
  }, [activePage, aiAdvice, category]);

  const handleAskAI = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);
    try {
      const advice = await fetchAIDesignAdvice(activePage, vibePrompt || 'Modern studio layout', apiKeyDraft);
      setAiAdvice(advice);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveKey = () => {
    try {
      if (apiKeyDraft.trim()) {
        localStorage.setItem(GEMINI_KEY_STORAGE, apiKeyDraft.trim());
      } else {
        localStorage.removeItem(GEMINI_KEY_STORAGE);
      }
    } catch {
      // ignore storage errors
    }
    setShowKeyConfig(false);
  };

  return (
    <div className="p-3 space-y-3">
      {/* Hybrid AI / Vibe Prompt Bar */}
      <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-purple-50/70 border border-indigo-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold text-indigo-950 flex items-center gap-1">
            <Sparkles size={12} className="text-indigo-600" />
            <span>Design Ideas</span>
            <span className="text-[8.5px] px-1.5 py-0.2 rounded-full bg-white/80 text-indigo-700 border border-indigo-200 font-bold">
              Hybrid
            </span>
          </span>
          <button
            type="button"
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className="p-1 rounded-lg hover:bg-white/70 text-indigo-700 transition"
            title="Optional: Configure Gemini API Key for AI palette & font suggestions"
          >
            <Settings2 size={12} />
          </button>
        </div>

        {showKeyConfig && (
          <div className="p-2 rounded-xl bg-white border border-indigo-200 space-y-1.5 text-[10px]">
            <label className="block font-semibold text-slate-600">
              Optional Gemini API Key (for AI Custom Vibes)
            </label>
            <input
              type="password"
              value={apiKeyDraft}
              onChange={(e) => setApiKeyDraft(e.target.value)}
              placeholder="AIza... (leave blank for instant local)"
              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-[10.5px] outline-none focus:border-indigo-500"
            />
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={() => setShowKeyConfig(false)}
                className="px-2 py-0.5 rounded-md text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-bold"
              >
                Save
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleAskAI} className="flex items-center gap-1">
          <input
            type="text"
            value={vibePrompt}
            onChange={(e) => setVibePrompt(e.target.value)}
            placeholder="Vibe: Graduation, Tech, Pastel..."
            className="flex-1 bg-white border border-indigo-200/90 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-700 outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={isGenerating}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-[10.5px] font-bold flex items-center gap-1 transition cursor-pointer"
            title="Generate custom style suggestion"
          >
            <Wand2 size={11} />
            <span>{isGenerating ? '...' : 'Style'}</span>
          </button>
        </form>
      </div>

      {/* Category Filter Chips */}
      <div className="grid grid-cols-4 gap-1 bg-slate-100 p-0.5 rounded-xl">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'layouts', label: 'Layouts' },
            { id: 'color-dark', label: 'Themes' },
            { id: 'photo', label: 'Photos' },
          ] as const
        ).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`py-1 rounded-lg text-[9.5px] font-bold transition cursor-pointer ${
              category === c.id
                ? 'bg-white text-indigo-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Live Mini-Canvas Recommendations */}
      <div className="space-y-2.5">
        {recommendations.map((rec) => {
          const pg = rec.previewPage;
          const thumbW = 216;
          const scale = thumbW / pg.width;
          const thumbH = Math.min(180, Math.round(pg.height * scale));
          const effScale = Math.min(scale, thumbH / pg.height);
          const renderW = Math.round(pg.width * effScale);
          const renderH = Math.round(pg.height * effScale);
          const isApplied = appliedId === rec.id;

          return (
            <button
              key={rec.id}
              type="button"
              onClick={() => {
                applyDesignRecommendation(pg);
                setAppliedId(rec.id);
                window.setTimeout(() => setAppliedId(null), 1500);
              }}
              className="group w-full text-left bg-white hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-400 rounded-2xl p-2 transition-all shadow-2xs hover:shadow-md cursor-pointer space-y-1.5"
            >
              <div className="flex justify-center bg-slate-100/80 rounded-xl p-2 relative overflow-hidden">
                <div
                  className="shadow-sm rounded-md overflow-hidden relative bg-white border border-slate-200/80"
                  style={{
                    width: `${renderW}px`,
                    height: `${renderH}px`,
                    backgroundColor: pg.backgroundColor,
                    backgroundImage: pg.backgroundGradient
                      ? buildLinearGradientCss(
                          pg.backgroundGradient.color1,
                          pg.backgroundGradient.color2,
                          pg.backgroundGradient.angle
                        )
                      : undefined,
                    ...buildPatternBackgroundStyle(pg.backgroundPattern, effScale),
                  }}
                >
                  <div
                    className="pointer-events-none select-none"
                    style={{
                      width: `${pg.width}px`,
                      height: `${pg.height}px`,
                      transform: `scale(${effScale})`,
                      transformOrigin: 'top left',
                      position: 'relative',
                    }}
                  >
                    {pg.elements
                      .filter((el) => el.visible !== false)
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
                          <ElementRenderer
                            element={el}
                            isSelected={false}
                            pageNumber={project.activePageIndex + 1}
                            totalPages={project.pages.length}
                          />
                        </div>
                      ))}
                  </div>
                </div>

                <span
                  className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold shadow-xs transition ${
                    isApplied
                      ? 'bg-emerald-600 text-white opacity-100'
                      : 'bg-indigo-600 text-white opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {isApplied ? (
                    <span className="flex items-center gap-0.5">
                      <Check size={10} /> Applied
                    </span>
                  ) : (
                    'Apply'
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 truncate">{rec.title}</div>
                  <div className="text-[9.5px] text-slate-500 truncate">{rec.subtitle}</div>
                </div>
                <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 flex-shrink-0">
                  {rec.badge}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
