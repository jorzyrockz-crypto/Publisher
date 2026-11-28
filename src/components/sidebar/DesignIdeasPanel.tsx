import React, { useMemo, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { ElementRenderer } from '../canvas/ElementRenderer';
import { buildPatternBackgroundStyle } from '../../utils/patternGenerator';
import { buildLinearGradientCss } from '../../constants/gradientSwatches';
import {
  AIDesignAdvice,
  DesignRecommendationCategory,
  fetchAIDesignAdvice,
} from '../../utils/designRecommendations';
import { rankDesignCandidates } from '../../utils/designCandidates';
import {
  getFeedback,
  recordDesignFeedback,
  resetFeedback,
  totalSignals,
} from '../../utils/designFeedback';
import { critiqueDesign, DesignCritique, storedCriticKey } from '../../utils/designCritic';
import { LayoutScore, scoreLayout } from '../../utils/layoutScore';
import { X, Sparkles, Wand2, Settings2, Check, ScanEye, Gauge } from 'lucide-react';

/** The score, as a badge: green A, blue B, amber C, red D. */
const scoreTone = (score: LayoutScore) =>
  score.grade === 'A'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : score.grade === 'B'
    ? 'bg-sky-50 text-sky-700 border-sky-200'
    : score.grade === 'C'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-rose-50 text-rose-700 border-rose-200';

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
  const [critique, setCritique] = useState<DesignCritique | null>(null);
  const [isCritiquing, setIsCritiquing] = useState(false);
  // Learned preferences are state, so a signal re-ranks the list in the same commit.
  const [feedback, setFeedback] = useState(() => getFeedback());
  const [apiKeyDraft, setApiKeyDraft] = useState(() => {
    try {
      return localStorage.getItem(GEMINI_KEY_STORAGE) || '';
    } catch {
      return '';
    }
  });

  // Suggestions arrive ranked by how well they score as layouts, nudged by what this user has
  // actually kept before. The panel is the same list it always was — it is just ordered.
  const signals = totalSignals(feedback);

  const recommendations = useMemo(() => {
    const ranked = rankDesignCandidates(activePage, aiAdvice, { limit: 8, feedback });
    if (category === 'all') return ranked;
    return ranked.filter((c) => c.category === category);
  }, [activePage, aiAdvice, category, feedback]);

  const pageScore = useMemo(() => scoreLayout(activePage), [activePage]);

  const handleCritique = async () => {
    setIsCritiquing(true);
    try {
      const result = await critiqueDesign(activePage);
      setCritique(result);
    } finally {
      setIsCritiquing(false);
    }
  };

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
      <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-purple-50/70 border border-[#d3c9f9]/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold text-indigo-950 flex items-center gap-1">
            <Sparkles size={12} className="text-[#5c4bb8]" />
            <span>Design Ideas</span>
            <span className="text-[8.5px] px-1.5 py-0.2 rounded-full bg-white/80 text-[#5c4bb8] border border-[#d3c9f9] font-bold">
              Hybrid
            </span>
          </span>
          <button
            type="button"
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className="p-1 rounded-lg hover:bg-white/70 text-[#5c4bb8] transition"
            title="Optional: Configure Gemini API Key for AI palette & font suggestions"
          >
            <Settings2 size={12} />
          </button>
        </div>

        {showKeyConfig && (
          <div className="p-2 rounded-xl bg-white border border-[#d3c9f9] space-y-1.5 text-[10px]">
            <label className="block font-semibold text-slate-600">
              Optional Gemini API Key (for AI Custom Vibes)
            </label>
            <input
              type="password"
              value={apiKeyDraft}
              onChange={(e) => setApiKeyDraft(e.target.value)}
              placeholder="AIza... (leave blank for instant local)"
              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-[10.5px] outline-none focus:border-[#d3c9f9]"
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
                className="px-2 py-0.5 rounded-md bg-[#6e56cf] text-white font-bold"
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
            className="flex-1 bg-white border border-[#d3c9f9]/90 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-700 outline-none focus:border-[#d3c9f9]"
          />
          <button
            type="submit"
            disabled={isGenerating}
            className="px-2.5 py-1.5 rounded-[8px] bg-[#6e56cf] hover:bg-[#5c4bb8] disabled:opacity-50 !text-white text-[10.5px] font-semibold flex items-center gap-1 transition cursor-pointer"
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
                ? 'bg-white text-[#5c4bb8] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* What the page scores, why, and — with a key — a second opinion from a vision model. */}
      <div className="rounded-2xl border border-slate-200 bg-white p-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1">
            <Gauge size={12} className="text-[#5c4bb8]" /> This page
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${scoreTone(pageScore)}`}
            title={pageScore.highlights.join(' · ') || 'No highlights yet'}
          >
            {pageScore.total} / 100 · {pageScore.grade}
          </span>
        </div>

        {pageScore.issues.length === 0 ? (
          <div className="text-[9.5px] text-emerald-700">
            {pageScore.highlights.slice(0, 2).join(' · ') || 'Nothing to fix.'}
          </div>
        ) : (
          <ul className="space-y-1">
            {pageScore.issues.slice(0, 3).map((issue) => (
              <li key={issue.id} className="text-[9.5px] leading-snug flex gap-1">
                <span
                  className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    issue.severity === 'bad'
                      ? 'bg-rose-500'
                      : issue.severity === 'warn'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}
                />
                <span className="text-slate-600">
                  <span className="font-semibold text-slate-800">{issue.label}.</span> {issue.detail}
                </span>
              </li>
            ))}
          </ul>
        )}

        {signals > 0 && (
          <button
            type="button"
            onClick={() => {
              resetFeedback();
              setFeedback({});
            }}
            className="w-full text-left text-[9px] text-slate-400 hover:text-slate-600 cursor-pointer"
            title="Forget which kinds of suggestion you have picked"
          >
            Reset learned preferences ({signals} signal{signals === 1 ? '' : 's'})
          </button>
        )}

        <button
          type="button"
          onClick={handleCritique}
          disabled={isCritiquing || !storedCriticKey()}
          title={
            storedCriticKey()
              ? 'Render the page and have a vision model review it'
              : 'Add your Gemini key to enable the AI second opinion'
          }
          className={`w-full h-8 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition ${
            storedCriticKey()
              ? 'bg-[#efeafd] text-[#5c4bb8] hover:bg-[#e6e0fb] cursor-pointer'
              : 'bg-slate-50 text-slate-400 cursor-not-allowed'
          }`}
        >
          <ScanEye size={12} />
          {isCritiquing ? 'Reviewing…' : critique ? 'Review again' : 'Second opinion'}
        </button>

        {critique && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-2 space-y-1">
            <div className="text-[9.5px] font-bold text-slate-800">
              {critique.score} / 100 — {critique.verdict}
            </div>
            <ol className="list-decimal list-inside space-y-0.5">
              {critique.fixes.map((fix) => (
                <li key={fix} className="text-[9.5px] text-slate-600 leading-snug">
                  {fix}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Live Mini-Canvas Recommendations — ranked, with the reason on each card */}
      <div className="space-y-2.5">
        {recommendations.map((rec) => {
          const pg = rec.page;
          const thumbW = 216;
          const scale = thumbW / pg.width;
          const thumbH = Math.min(180, Math.round(pg.height * scale));
          const effScale = Math.min(scale, thumbH / pg.height);
          const renderW = Math.round(pg.width * effScale);
          const renderH = Math.round(pg.height * effScale);
          const isApplied = appliedId === rec.id;

          return (
            <div
              key={rec.id}
              className="group relative w-full text-left bg-white hover:bg-[#efeafd] border border-slate-200 hover:border-[#d3c9f9] rounded-2xl p-2 transition-all shadow-2xs hover:shadow-md cursor-pointer space-y-1.5"
              onClick={() => {
                applyDesignRecommendation(pg);
                setFeedback(recordDesignFeedback(rec.learnKey, 'accepted'));
                setAppliedId(rec.id);
                window.setTimeout(() => setAppliedId(null), 1500);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                e.preventDefault();
                applyDesignRecommendation(pg);
                setFeedback(recordDesignFeedback(rec.learnKey, 'accepted'));
              }}
            >
              {/* The score, and the one thing that would make this layout better. */}
              <div className="flex items-center gap-1.5 px-1">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 ${scoreTone(rec.score)}`}
                  title={rec.score.issues.map((i) => `${i.label}: ${i.detail}`).join('\n') || 'No issues found'}
                >
                  <Gauge size={9} />
                  {rec.score.total} · {rec.score.grade}
                </span>
                <span className="text-[9px] text-slate-500 truncate flex-1">{rec.rationale}</span>
                {rec.exploring && (
                  <span className="text-[8px] font-bold text-[#5c4bb8] px-1 rounded bg-[#efeafd]">
                    new
                  </span>
                )}
              </div>
              <button
                type="button"
                title="Not this one"
                aria-label={`Dismiss ${rec.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setFeedback(recordDesignFeedback(rec.learnKey, 'dismissed'));
                }}
                className="absolute top-1 left-1 z-10 w-5 h-5 rounded-full bg-white/90 border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
              >
                <X size={11} />
              </button>
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
                      : 'bg-[#6e56cf] text-white opacity-0 group-hover:opacity-100'
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
