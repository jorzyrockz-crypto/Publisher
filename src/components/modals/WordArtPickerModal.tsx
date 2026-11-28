import React, { useMemo, useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { WordArtStyle } from '../../types/publisher';
import { WORD_ART_STYLES } from '../../utils/wordArt';
import {
  TONE_OPTIONS,
  TypeIdea,
  TypeTone,
  styleLabel,
  suggestTypeIdeas,
} from '../../utils/aiTypeStudio';
import { X, Sparkles, Loader2, Wand2 } from 'lucide-react';

/** True when the page background is dark enough for glow-style type. */
function isDarkColor(color: string | undefined): boolean {
  if (!color) return false;
  const hex = color.trim().replace('#', '');
  if (hex.length !== 3 && hex.length !== 6) return false;
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return false;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45;
}

export const WordArtPickerModal: React.FC = () => {
  const { isWordArtModalOpen, setIsWordArtModalOpen, addTextBox, project, activePage } = usePublisher();
  const [wordArtText, setWordArtText] = useState('HEADLINE TITLE');
  const [selectedStyle, setSelectedStyle] = useState<WordArtStyle>('gold3d');

  // AI Type Studio: free keyless model writes the words and picks the style.
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<TypeTone>('elegant');
  const [ideas, setIdeas] = useState<TypeIdea[]>([]);
  const [ideaSource, setIdeaSource] = useState<'ai' | 'offline' | null>(null);
  const [ideaNote, setIdeaNote] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const darkPage = useMemo(
    () =>
      isDarkColor(activePage?.backgroundColor) ||
      isDarkColor(activePage?.backgroundGradient?.color1) ||
      isDarkColor(activePage?.backgroundGradient?.color2),
    [activePage?.backgroundColor, activePage?.backgroundGradient?.color1, activePage?.backgroundGradient?.color2]
  );

  if (!isWordArtModalOpen) return null;

  const handleSuggest = async () => {
    const seed = topic.trim() || wordArtText.trim();
    if (!seed || isThinking) return;
    setIsThinking(true);
    setIdeaNote(null);
    try {
      const result = await suggestTypeIdeas({
        topic: seed,
        tone,
        documentName: project?.name,
        darkPage,
        count: 4,
      });
      setIdeas(result.ideas);
      setIdeaSource(result.source);
      setIdeaNote(result.note ?? null);
    } finally {
      setIsThinking(false);
    }
  };

  const applyIdea = (idea: TypeIdea) => {
    setWordArtText(idea.phrase);
    setSelectedStyle(idea.styleId);
  };

  const styles = [...WORD_ART_STYLES]
    .sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew))
    .map((s) => ({
      id: s.id,
      name: s.label,
      previewClass: s.className,
      darkBg: s.dark,
      isNew: s.isNew,
    }));

  const handleInsert = () => {
    addTextBox({
      text: wordArtText,
      fontSize: 38,
      fontWeight: 'bold',
      isWordArt: true,
      wordArtStyle: selectedStyle,
      width: 440,
      height: 90,
      fontFamily: 'Impact',
    });
    setIsWordArtModalOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center select-none p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-[15px] shadow-[0_20px_70px_rgba(21,35,45,0.22)] border border-[#e5e9ee]/90 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5a44c9] to-[#8a6ff0] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Sparkles size={16} className="text-amber-300" />
            <span>WordArt Gallery</span>
          </div>
          <button
            onClick={() => setIsWordArtModalOpen(false)}
            className="p-1 hover:bg-white/20 rounded-full transition text-white/80 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              WordArt Text
            </label>
            <input
              type="text"
              value={wordArtText}
              onChange={(e) => setWordArtText(e.target.value)}
              className="w-full border border-[#e5e9ee] rounded-xl px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[#6e56cf]/20 focus:border-[#b3a4f2] font-bold text-slate-800"
            />
          </div>

          <div className="rounded-2xl border border-[#e5e9ee] bg-[#f8fafb] p-3 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Wand2 size={13} className="text-[#6e56cf]" />
              <span className="text-xs font-bold text-slate-700">AI ideas</span>
              <span className="text-[10px] text-slate-500">free — writes the words and picks the look</span>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleSuggest();
                  }
                }}
                placeholder="What is this piece about? e.g. spring open house"
                className="flex-1 min-w-0 bg-white px-2.5 py-1.5 rounded-[8px] border border-[#e5e9ee] text-[11px] outline-none focus:border-[#b3a4f2]"
              />
              <button
                type="button"
                onClick={() => void handleSuggest()}
                disabled={isThinking || (!topic.trim() && !wordArtText.trim())}
                className="px-3 py-1.5 rounded-[8px] bg-[#6e56cf] hover:bg-[#5c4bb8] disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
              >
                {isThinking ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {isThinking ? 'Thinking…' : 'Suggest'}
              </button>
            </div>

            <div className="flex items-center gap-1">
              {TONE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTone(option.id)}
                  className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold transition cursor-pointer ${
                    tone === option.id
                      ? 'bg-[#efeafd] text-[#5c4bb8]'
                      : 'bg-white text-[#4a5661] border border-[#e5e9ee] hover:text-[#5c4bb8]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
              {darkPage && (
                <span className="ml-auto text-[9.5px] text-slate-500">dark page — glow styles boosted</span>
              )}
            </div>

            {ideas.length > 0 && (
              <div className="space-y-1">
                {ideas.map((idea, index) => (
                  <button
                    key={`${idea.phrase}-${index}`}
                    type="button"
                    onClick={() => applyIdea(idea)}
                    title={idea.reason}
                    className={`w-full text-left px-2 py-1.5 rounded-[8px] border transition cursor-pointer flex items-center gap-2 ${
                      wordArtText === idea.phrase && selectedStyle === idea.styleId
                        ? 'bg-[#efeafd] border-[#d3c9f9]'
                        : 'bg-white border-[#e5e9ee] hover:border-[#d3c9f9]'
                    }`}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block text-[11px] font-bold text-slate-800 truncate">
                        {idea.phrase}
                      </span>
                      <span className="block text-[9.5px] text-slate-500 truncate">{idea.reason}</span>
                    </span>
                    <span className="shrink-0 px-1.5 py-0.5 rounded-[5px] bg-slate-100 text-[9px] font-semibold text-slate-600">
                      {styleLabel(idea.styleId)}
                    </span>
                  </button>
                ))}
                <p className="text-[9px] text-slate-400 leading-snug pt-0.5">
                  {ideaSource === 'ai'
                    ? 'Written by a free AI model — click one to load it, then edit the style freely.'
                    : ideaNote ?? 'Local suggestions — the free model is unavailable right now.'}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Select Style Preset
            </label>
            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {styles.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id)}
                  title={s.isNew ? `${s.name} — new in this release` : s.name}
                  className={`p-3 rounded-2xl border cursor-pointer text-center flex flex-col items-center justify-center h-24 transition-all hover:scale-[1.02] ${
                    s.darkBg ? 'bg-slate-900' : 'bg-slate-50/60'
                  } ${
                    selectedStyle === s.id
                      ? 'border-indigo-600 ring-2 ring-indigo-600 shadow-xs'
                      : 'border-[#e5e9ee] hover:border-slate-300'
                  }`}
                >
                  <span className={`text-xl font-black ${s.previewClass} truncate max-w-full`}>
                    WordArt
                  </span>
                  {s.isNew && (
                    <span className="mt-1 rounded bg-indigo-600 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                      New
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-semibold mt-2 ${
                      s.darkBg ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {s.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-100 flex justify-end gap-2.5">
          <button
            onClick={() => setIsWordArtModalOpen(false)}
            className="px-4 py-2 rounded-xl border border-[#e5e9ee] text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            className="px-5 py-2 rounded-xl bg-[#6e56cf] hover:bg-[#5c4bb8] active:scale-95 text-white text-xs font-bold transition shadow-xs"
          >
            Insert WordArt
          </button>
        </div>
      </div>
    </div>
  );
};
