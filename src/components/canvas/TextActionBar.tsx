import React from 'react';
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Minus, Plus, Underline } from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import { useTextSelection } from '../../hooks/useTextSelection';
import { useTextPanelState } from '../../hooks/useTextPanelState';

const iconBtn = (active: boolean) =>
  `min-w-[34px] min-h-[34px] p-1.5 rounded-[10px] flex items-center justify-center transition cursor-pointer active:scale-95 ${
    active ? 'bg-[#efeafd] text-[#5c4bb8]' : 'text-[#4a5661] hover:text-[#161a22] hover:bg-[#f4f2ff]'
  }`;

/**
 * The text bar, shared by both workspaces.
 *
 * The colour and the font are choices, so their chips open the edit panel where a list and a
 * palette can actually live; the rest of the bar is one click and one outcome and stays here.
 * Every change applies to the whole text selection in a single commit.
 */
export const TextActionBar: React.FC = () => {
  const { updateElementsBatch } = usePublisher();
  const selection = useTextSelection();
  const font = useTextPanelState('type');
  const colour = useTextPanelState('colour');

  if (!selection) return null;
  const { elements, primary, mixed } = selection;

  const apply = (patch: Parameters<typeof updateElementsBatch>[0] extends never ? never : Record<string, unknown>) =>
    updateElementsBatch(Object.fromEntries(elements.map((el) => [el.id, patch])) as never);

  const size = Math.round(primary.fontSize || 16);
  const alignOrder: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];

  return (
    <>
      <button
        type="button"
        onClick={colour.toggle}
        aria-label="Text color"
        title="Text color"
        className={`h-9 px-2 rounded-[10px] flex items-center gap-1 border transition cursor-pointer touch-manipulation ${
          colour.open ? 'border-[#6e56cf] bg-[#efeafd]' : 'border-[#e5e9ee] bg-[#f8fafb] hover:bg-white'
        }`}
      >
        <span className="flex flex-col items-center leading-none">
          <span className="text-[13px] font-bold text-[#161a22]">A</span>
          <span
            className="mt-0.5 h-[3px] w-4 rounded-full"
            style={{ background: mixed.color ? '#9aa4af' : primary.color || '#161a22' }}
          />
        </span>
      </button>

      <button
        type="button"
        onClick={font.toggle}
        aria-label="Font"
        title="Font"
        className={`h-9 max-w-[168px] px-2.5 rounded-[10px] flex items-center gap-1.5 border transition cursor-pointer touch-manipulation ${
          font.open ? 'border-[#6e56cf] bg-[#efeafd]' : 'border-[#e5e9ee] bg-[#f8fafb] hover:bg-white'
        }`}
      >
        <span className="text-[13px] font-bold text-[#6e56cf]">A</span>
        <span className="text-xs font-medium text-[#161a22] truncate">
          {mixed.fontFamily ? 'Mixed' : primary.fontFamily || 'Inter'}
        </span>
        <span className="w-3 h-3 rounded-full border border-[#161a22] flex-shrink-0" />
      </button>

      <div className="flex items-center border border-[#e5e9ee] rounded-[10px] bg-[#f8fafb] h-9 px-1 gap-1">
        <button
          type="button"
          onClick={() =>
            apply(
              Object.fromEntries(elements.map((el) => [el.id, { fontSize: Math.max(8, (el.fontSize || 16) - 2) }]))
            )
          }
          className="w-7 h-7 flex items-center justify-center rounded-[7px] text-[#4a5661] hover:text-[#5c4bb8] hover:bg-white cursor-pointer touch-manipulation"
          title="Decrease Font Size"
        >
          <Minus size={13} />
        </button>
        <span className="text-xs font-semibold min-w-[26px] text-center text-[#161a22]">{size}</span>
        <button
          type="button"
          onClick={() =>
            apply(
              Object.fromEntries(elements.map((el) => [el.id, { fontSize: Math.min(200, (el.fontSize || 16) + 2) }]))
            )
          }
          className="w-7 h-7 flex items-center justify-center rounded-[7px] text-[#4a5661] hover:text-[#5c4bb8] hover:bg-white cursor-pointer touch-manipulation"
          title="Increase Font Size"
        >
          <Plus size={13} />
        </button>
      </div>

      <div className="w-[1px] h-5 bg-[#e5e9ee] mx-0.5" />

      <button
        type="button"
        onClick={() =>
          apply(
            Object.fromEntries(
              elements.map((el) => [el.id, { fontWeight: el.fontWeight === 'bold' ? 'normal' : 'bold' }])
            )
          )
        }
        className={iconBtn(primary.fontWeight === 'bold')}
        title="Bold"
      >
        <Bold size={15} />
      </button>
      <button
        type="button"
        onClick={() =>
          apply(
            Object.fromEntries(
              elements.map((el) => [el.id, { fontStyle: el.fontStyle === 'italic' ? 'normal' : 'italic' }])
            )
          )
        }
        className={iconBtn(primary.fontStyle === 'italic')}
        title="Italic"
      >
        <Italic size={15} />
      </button>
      <button
        type="button"
        onClick={() =>
          apply(
            Object.fromEntries(
              elements.map((el) => [
                el.id,
                { textDecoration: el.textDecoration === 'underline' ? 'none' : 'underline' },
              ])
            )
          )
        }
        className={iconBtn(primary.textDecoration === 'underline')}
        title="Underline"
      >
        <Underline size={15} />
      </button>

      <button
        type="button"
        onClick={() => {
          const current = (primary.textAlign || 'left') as 'left' | 'center' | 'right';
          const next = alignOrder[(alignOrder.indexOf(current) + 1) % alignOrder.length];
          apply(Object.fromEntries(elements.map((el) => [el.id, { textAlign: next }])));
        }}
        className={iconBtn(false)}
        title="Cycle Text Alignment"
      >
        {primary.textAlign === 'center' ? (
          <AlignCenter size={15} />
        ) : primary.textAlign === 'right' ? (
          <AlignRight size={15} />
        ) : (
          <AlignLeft size={15} />
        )}
      </button>

      <div className="w-[1px] h-5 bg-[#e5e9ee] mx-0.5" />
    </>
  );
};
