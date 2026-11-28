import React, { useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Minus,
  Plus,
  Underline,
} from 'lucide-react';
import { usePublisher } from '../../context/PublisherContext';
import { useTextSelection } from '../../hooks/useTextSelection';
import { useTextPanelState } from '../../hooks/useTextPanelState';
import type { TextElement } from '../../types/publisher';
import { isBoldWeight, toggleBoldWeight } from '../../utils/textWeight';

const iconBtn = (active: boolean, mixed = false) =>
  `min-w-[40px] min-h-[40px] p-1.5 rounded-[10px] flex items-center justify-center transition cursor-pointer active:scale-95 ${
    active
      ? 'bg-[#efeafd] text-[#5c4bb8]'
      : mixed
        ? 'text-[#5c4bb8] ring-1 ring-inset ring-[#cfc4f5]'
        : 'text-[#4a5661] hover:text-[#161a22] hover:bg-[#f4f2ff]'
  }`;

const MIXED = '\u2014';

const ALIGNMENTS = [
  { value: 'left', label: 'Align text left', Icon: AlignLeft },
  { value: 'center', label: 'Centre text', Icon: AlignCenter },
  { value: 'right', label: 'Align text right', Icon: AlignRight },
  { value: 'justify', label: 'Justify text to both edges', Icon: AlignJustify },
] satisfies Array<{ value: TextElement['textAlign']; label: string; Icon: typeof AlignLeft }>;

const MIN_SIZE = 8;
const MAX_SIZE = 200;

/**
 * The text bar, shared by both workspaces.
 *
 * The colour and the font are choices, so their chips open the edit panel where a list and a
 * palette can actually live; the rest of the bar is one click and one outcome and stays here.
 * Every change applies to the whole text selection in a single commit.
 *
 * Each control says what it is about to do and what it has already done:
 *
 *  - the size reads as a number you can type into, not a label — `81` was a value you could nudge
 *    but never set;
 *  - B shows itself pressed for *any* heavy weight, not only the literal `'bold'` value, so a 900
 *    title no longer looks unbolded and, worse, gets lighter when you press B;
 *  - alignment is four buttons that set an alignment, instead of one icon that looks like "left"
 *    and advances to centre when clicked.
 */
export const TextActionBar: React.FC = () => {
  const { updateElementsBatch } = usePublisher();
  const selection = useTextSelection();
  const font = useTextPanelState('type');
  const colour = useTextPanelState('colour');

  /** While typing in the size field this holds the raw text; `null` means "show the selection". */
  const [sizeDraft, setSizeDraft] = useState<string | null>(null);

  if (!selection) return null;
  const { elements, primary, mixed } = selection;

  const batch = (updates: Record<string, Partial<TextElement>>) =>
    updateElementsBatch(updates as never);

  /** A patch computed per element, so a mixed selection toggles each box from its own state. */
  const applyEach = (fn: (el: TextElement) => Partial<TextElement>) =>
    batch(Object.fromEntries(elements.map((el) => [el.id, fn(el)])));

  const size = Math.round(primary.fontSize || 16);
  const showMixedSize = mixed.fontSize && sizeDraft === null;
  const isBold = mixed.fontWeight ? false : isBoldWeight(primary.fontWeight);
  const isItalic = primary.fontStyle === 'italic';
  const isUnderline = primary.textDecoration === 'underline';
  const alignMixed = elements.some((el) => el.textAlign !== primary.textAlign);

  const setSize = (next: number) => {
    const clamped = Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(next)));
    applyEach(() => ({ fontSize: clamped }));
    setSizeDraft(null);
  };

  const commitSize = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) setSize(parsed);
    else setSizeDraft(null);
  };

  // Back to the weight it had before it was switched off — a 900 title returns to 900.
  const toggleBold = () => applyEach((el) => ({ fontWeight: toggleBoldWeight(el.id, el.fontWeight) }));

  return (
    <>
      <button
        type="button"
        onClick={colour.toggle}
        aria-label="Text color"
        title="Text color"
        className={`h-10 px-2.5 rounded-[10px] flex items-center gap-1 border transition cursor-pointer active:scale-95 touch-manipulation ${
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
        className={`h-10 max-w-[176px] px-3 rounded-[10px] flex items-center gap-1.5 border transition cursor-pointer active:scale-95 touch-manipulation ${
          font.open ? 'border-[#6e56cf] bg-[#efeafd]' : 'border-[#e5e9ee] bg-[#f8fafb] hover:bg-white'
        }`}
      >
        <span className="text-[13px] font-bold text-[#6e56cf]">A</span>
        <span className="text-xs font-medium text-[#161a22] truncate">
          {mixed.fontFamily ? 'Mixed' : primary.fontFamily || 'Inter'}
        </span>
        <span className="w-3 h-3 rounded-full border border-[#161a22] flex-shrink-0" />
      </button>

      <div className="flex items-center border border-[#e5e9ee] rounded-[10px] bg-[#f8fafb] h-10 px-1 gap-0.5">
        <button
          type="button"
          onClick={() => applyEach((el) => ({ fontSize: Math.max(MIN_SIZE, (el.fontSize || 16) - 2) }))}
          className="w-9 h-9 flex items-center justify-center rounded-[8px] text-[#4a5661] hover:text-[#5c4bb8] hover:bg-white cursor-pointer active:scale-95 touch-manipulation"
          title="Decrease font size"
          aria-label="Decrease font size"
        >
          <Minus size={13} />
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={sizeDraft ?? (showMixedSize ? MIXED : String(size))}
          onChange={(e) => setSizeDraft(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={(e) => commitSize(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitSize(e.currentTarget.value);
              e.currentTarget.blur();
            } else if (e.key === 'Escape') {
              setSizeDraft(null);
              e.currentTarget.blur();
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              setSize(size + (e.key === 'ArrowUp' ? 2 : -2));
            }
          }}
          aria-label="Font size"
          title="Font size — type a value, or use the arrows"
          className="w-[34px] h-9 bg-transparent text-center text-xs font-semibold text-[#161a22] outline-none rounded-[8px] focus:bg-white focus:ring-2 focus:ring-[#6e56cf]/25 tabular-nums"
        />
        <button
          type="button"
          onClick={() => applyEach((el) => ({ fontSize: Math.min(MAX_SIZE, (el.fontSize || 16) + 2) }))}
          className="w-9 h-9 flex items-center justify-center rounded-[8px] text-[#4a5661] hover:text-[#5c4bb8] hover:bg-white cursor-pointer active:scale-95 touch-manipulation"
          title="Increase font size"
          aria-label="Increase font size"
        >
          <Plus size={13} />
        </button>
      </div>

      <div className="w-[1px] h-5 bg-[#e5e9ee] mx-0.5" />

      <button
        type="button"
        onClick={toggleBold}
        aria-pressed={isBold}
        aria-label="Bold"
        title={isBold ? 'Remove bold' : 'Bold'}
        className={iconBtn(isBold, mixed.fontWeight)}
      >
        <Bold size={15} />
      </button>
      <button
        type="button"
        onClick={() => applyEach((el) => ({ fontStyle: el.fontStyle === 'italic' ? 'normal' : 'italic' }))}
        aria-pressed={isItalic}
        aria-label="Italic"
        title={isItalic ? 'Remove italic' : 'Italic'}
        className={iconBtn(isItalic)}
      >
        <Italic size={15} />
      </button>
      <button
        type="button"
        onClick={() =>
          applyEach((el) => ({
            textDecoration: el.textDecoration === 'underline' ? 'none' : 'underline',
          }))
        }
        aria-pressed={isUnderline}
        aria-label="Underline"
        title={isUnderline ? 'Remove underline' : 'Underline'}
        className={iconBtn(isUnderline)}
      >
        <Underline size={15} />
      </button>

      {/*
        Four buttons, not one cycling icon. The old control showed "align left" and then centred
        the text when you clicked it, which is the wrong mapping however you read it.
      */}
      <div
        role="group"
        aria-label="Text alignment"
        className="flex items-center border border-[#e5e9ee] rounded-[10px] bg-[#f8fafb] h-10 px-1 gap-0.5"
      >
        {ALIGNMENTS.map(({ value, label, Icon }) => {
          const active = !alignMixed && (primary.textAlign || 'left') === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => applyEach(() => ({ textAlign: value }))}
              aria-pressed={active}
              aria-label={label}
              title={label}
              className={`w-[34px] h-8 flex items-center justify-center rounded-[7px] transition cursor-pointer active:scale-95 touch-manipulation ${
                active
                  ? 'bg-[#efeafd] text-[#5c4bb8]'
                  : 'text-[#4a5661] hover:text-[#5c4bb8] hover:bg-white'
              }`}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>

      <div className="w-[1px] h-5 bg-[#e5e9ee] mx-0.5" />
    </>
  );
};
