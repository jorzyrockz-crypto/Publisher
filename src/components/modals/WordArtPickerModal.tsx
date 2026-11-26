import React, { useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { WordArtStyle } from '../../types/publisher';
import { WORD_ART_STYLES } from '../../utils/wordArt';
import { X, Sparkles } from 'lucide-react';

export const WordArtPickerModal: React.FC = () => {
  const { isWordArtModalOpen, setIsWordArtModalOpen, addTextBox } = usePublisher();
  const [wordArtText, setWordArtText] = useState('HEADLINE TITLE');
  const [selectedStyle, setSelectedStyle] = useState<WordArtStyle>('gold3d');

  if (!isWordArtModalOpen) return null;

  const styles = WORD_ART_STYLES.map((s) => ({
    id: s.id,
    name: s.label,
    previewClass: s.className,
    darkBg: s.dark,
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

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Select Style Preset
            </label>
            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {styles.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id)}
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
