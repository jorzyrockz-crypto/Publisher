import React, { useState } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { WordArtStyle } from '../../types/publisher';
import { X, Sparkles } from 'lucide-react';

export const WordArtPickerModal: React.FC = () => {
  const { isWordArtModalOpen, setIsWordArtModalOpen, addTextBox } = usePublisher();
  const [wordArtText, setWordArtText] = useState('YOUR HEADLINE HERE');
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center select-none p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#0f6b4e] text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Sparkles size={16} className="text-amber-300" />
            <span>WordArt Gallery</span>
          </div>
          <button
            onClick={() => setIsWordArtModalOpen(false)}
            className="text-white/80 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Enter WordArt Text
            </label>
            <input
              type="text"
              value={wordArtText}
              onChange={(e) => setWordArtText(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm outline-none focus:border-[#0f6b4e] font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Select WordArt Style
            </label>
            <div className="grid grid-cols-2 gap-3">
              {styles.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id)}
                  className={`p-3 rounded-lg border cursor-pointer text-center flex flex-col items-center justify-center h-24 transition ${
                    selectedStyle === s.id
                      ? 'border-[#0f6b4e] ring-2 ring-[#0f6b4e] bg-emerald-50/40'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <span className={`text-xl font-black ${s.previewClass} truncate max-w-full`}>
                    WordArt
                  </span>
                  <span className="text-[10px] text-slate-500 mt-2 font-medium">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={() => setIsWordArtModalOpen(false)}
            className="px-4 py-1.5 rounded border border-slate-300 text-xs text-slate-700 hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            className="px-5 py-1.5 rounded bg-[#0f6b4e] hover:bg-[#0c533c] text-white text-xs font-semibold transition shadow-sm"
          >
            Insert WordArt
          </button>
        </div>
      </div>
    </div>
  );
};
