import React, { useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { WordArtStyle } from '../../types/publisher';
import { X, Sparkles } from 'lucide-react';

export const WordArtPickerModal: React.FC = () => {
  const { isWordArtModalOpen, setIsWordArtModalOpen, addTextBox } = usePublisher();
  const [wordArtText, setWordArtText] = useState('HEADLINE TITLE');
  const [selectedStyle, setSelectedStyle] = useState<WordArtStyle>('gold3d');

  if (!isWordArtModalOpen) return null;

  const styles: { id: WordArtStyle; name: string; previewClass: string }[] = [
    { id: 'gold3d', name: 'Gold 3D Extrusion', previewClass: 'wordart-gold3d' },
    { id: 'rainbow', name: 'Rainbow Gradient', previewClass: 'wordart-rainbow' },
    { id: 'outline', name: 'Cyan Outlined 3D', previewClass: 'wordart-outline' },
    { id: 'retro', name: 'Retro Pop Shadow', previewClass: 'wordart-retro' },
  ];

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
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#064e3b] to-[#047857] text-white px-5 py-3.5 flex items-center justify-between">
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
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Select Style Preset
            </label>
            <div className="grid grid-cols-2 gap-3">
              {styles.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id)}
                  className={`p-4 rounded-2xl border cursor-pointer text-center flex flex-col items-center justify-center h-28 transition-all hover:scale-[1.02] ${
                    selectedStyle === s.id
                      ? 'border-emerald-600 ring-2 ring-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-slate-200/80 hover:border-slate-300 bg-slate-50/60'
                  }`}
                >
                  <span className={`text-xl font-black ${s.previewClass} truncate max-w-full`}>
                    WordArt
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 mt-2.5">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-100 flex justify-end gap-2.5">
          <button
            onClick={() => setIsWordArtModalOpen(false)}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition shadow-xs"
          >
            Insert WordArt
          </button>
        </div>
      </div>
    </div>
  );
};
