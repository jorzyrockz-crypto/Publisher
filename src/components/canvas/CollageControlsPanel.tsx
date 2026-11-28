import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import { useCollageSelection } from '../../hooks/useCollageSelection';
import { COLLAGE_CONTROL_TITLES } from '../../constants/collageControls';
import { COLLAGE_VIBE_PACKS, getBackdropPreviewStyle } from '../../utils/borderArtStyles';
import { applyVibePack } from '../../utils/collageVibes';

/**
 * The context panel's collage section — the destination for nested controls on the canvas
 * bar. Vibe packs first: a pack is a *choice* between looks, so it does not belong in a
 * one-click button, but it also should not require the builder modal.
 *
 * Lives in the right inspector, which renders in both Publisher and Designer mode, so the
 * bar's nested buttons have exactly one destination rather than two implementations.
 */
export const CollageControlsPanel: React.FC = () => {
  const { collageControlSection, closeCollageControl, patchCollageMeta } = usePublisher();
  const collage = useCollageSelection();

  // The panel is about a specific collage; if the selection moves on, so does the panel.
  useEffect(() => {
    if (!collage) closeCollageControl();
  }, [collage, closeCollageControl]);

  if (!collageControlSection || !collage) return null;

  const { groupId, meta } = collage;

  return (
    <div className="space-y-2 rounded-[10px] border border-[#d3c9f9] bg-[#faf8ff] p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-[#4a3c8c]">
          {COLLAGE_CONTROL_TITLES[collageControlSection]}
        </span>
        <button
          type="button"
          onClick={closeCollageControl}
          className="p-0.5 rounded-[5px] text-[#7a6dbb] hover:bg-[#efeafd] hover:text-[#5c4bb8] transition"
          aria-label="Close collage controls"
          title="Close"
        >
          <X size={12} />
        </button>
      </div>

      {collageControlSection === 'vibes' && (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            {COLLAGE_VIBE_PACKS.map((pack) => {
              const isActive = meta.vibePackId === pack.id;
              const frameColor = pack.style.frameColor || '#ffffff';
              const accentColor = pack.style.accentColor || '#cbd5e1';
              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => patchCollageMeta(groupId, applyVibePack(meta, pack.id))}
                  title={pack.description}
                  aria-pressed={isActive}
                  className={`flex flex-col gap-1 rounded-[9px] border p-1.5 text-left transition cursor-pointer ${
                    isActive
                      ? 'border-[#6e56cf] bg-white ring-1 ring-[#6e56cf]/25'
                      : 'border-[#e5e9ee] bg-white hover:border-[#d3c9f9]'
                  }`}
                >
                  <div
                    className="flex h-8 w-full items-center justify-center gap-1 overflow-hidden rounded-[6px] border border-[#e5e9ee]/70 p-1"
                    style={getBackdropPreviewStyle(pack.backdrop)}
                  >
                    <div
                      className="h-5 w-4 flex-shrink-0 rounded-[2px]"
                      style={{ backgroundColor: frameColor, border: `1.5px solid ${accentColor}` }}
                    />
                    <div
                      className="h-5 w-4 flex-shrink-0 rounded-[2px]"
                      style={{
                        backgroundColor: frameColor,
                        border: `1.5px solid ${accentColor}`,
                        transform: pack.style.scatterTilt ? 'rotate(4deg)' : undefined,
                      }}
                    />
                  </div>
                  <span className="truncate text-[10px] font-semibold text-[#202833]">
                    {pack.label}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[9.5px] leading-snug text-[#7a6dbb]">
            Changes the look, not the photos — framings and positions stay put.
          </p>
        </>
      )}
    </div>
  );
};
