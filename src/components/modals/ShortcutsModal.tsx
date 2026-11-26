import React, { useEffect, useMemo, useState } from 'react';
import { X, Keyboard, Search } from 'lucide-react';
import { OPEN_SHORTCUTS_EVENT } from '../../utils/uiEvents';

interface ShortcutRow {
  keys: string[];
  label: string;
}

interface ShortcutGroup {
  title: string;
  rows: ShortcutRow[];
}

const GROUPS: ShortcutGroup[] = [
  {
    title: 'File & Export',
    rows: [
      { keys: ['Ctrl', 'S'], label: 'Save publication (.pub)' },
      { keys: ['Ctrl', 'P'], label: 'Print / Save as PDF' },
      { keys: ['Ctrl', 'K'], label: 'Command search' },
      { keys: ['?'], label: 'This shortcuts cheatsheet' },
    ],
  },
  {
    title: 'Editing',
    rows: [
      { keys: ['Ctrl', 'Z'], label: 'Undo' },
      { keys: ['Ctrl', 'Y'], label: 'Redo' },
      { keys: ['Ctrl', 'C'], label: 'Copy selection' },
      { keys: ['Ctrl', 'V'], label: 'Paste' },
      { keys: ['Ctrl', 'D'], label: 'Duplicate selection' },
      { keys: ['Del'], label: 'Delete selection' },
    ],
  },
  {
    title: 'Selection & Nudging',
    rows: [
      { keys: ['Ctrl', 'A'], label: 'Select all on page' },
      { keys: ['Esc'], label: 'Deselect / close dialog' },
      { keys: ['←', '→', '↑', '↓'], label: 'Nudge 1 px' },
      { keys: ['Shift', '←'], label: 'Nudge 10 px' },
    ],
  },
  {
    title: 'Canvas & View',
    rows: [
      { keys: ['Space', 'Drag'], label: 'Pan the pasteboard' },
      { keys: ['H'], label: 'Hand / pan tool' },
      { keys: ['V'], label: 'Select tool' },
      { keys: ['Ctrl', 'Wheel'], label: 'Zoom in / out' },
      { keys: ['+'], label: 'Zoom in' },
      { keys: ['-'], label: 'Zoom out' },
    ],
  },
];

const KeyCap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-[6px] bg-white border border-[#d8dfe6] border-b-[2px] text-[11px] font-semibold text-[#3d4a57] font-mono shadow-2xs">
    {children}
  </kbd>
);

export const ShortcutsModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const openHandler = () => setIsOpen(true);
    window.addEventListener(OPEN_SHORTCUTS_EVENT, openHandler);
    return () => window.removeEventListener(OPEN_SHORTCUTS_EVENT, openHandler);
  }, []);

  // Global "?" shortcut (Shift + /) opens the cheatsheet
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '?' || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      e.preventDefault();
      setIsOpen((v) => !v);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Esc closes
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GROUPS;
    return GROUPS.map((g) => ({
      ...g,
      rows: g.rows.filter(
        (r) =>
          r.label.toLowerCase().includes(q) || r.keys.join(' ').toLowerCase().includes(q)
      ),
    })).filter((g) => g.rows.length > 0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-2xl max-h-[80vh] overflow-hidden bg-white rounded-2xl shadow-2xl border border-[#e5e9ee] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e5e9ee]">
          <div className="w-9 h-9 rounded-xl bg-[#e5f4f3] text-[#087477] flex items-center justify-center">
            <Keyboard size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-[#202833] leading-tight">Keyboard Shortcuts</h2>
            <p className="text-[11px] text-[#778391]">
              Press <span className="font-semibold">?</span> anytime to reopen this cheatsheet
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-[8px] text-[#778391] hover:text-[#202833] hover:bg-[#f3f5f7] transition cursor-pointer"
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-[#e5e9ee] bg-[#f8fafb]">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9aa4ae] pointer-events-none"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter shortcuts..."
              className="w-full bg-white text-[#202833] placeholder-[#9aa4ae] pl-8 pr-3 py-1.5 rounded-[8px] text-[11.5px] outline-none border border-[#e5e9ee] focus:border-[#73b9b7]"
            />
          </div>
        </div>

        <div className="overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          {filtered.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#9aa4ae] mb-2">
                {group.title}
              </h3>
              <ul className="space-y-1.5">
                {group.rows.map((row) => (
                  <li
                    key={`${group.title}-${row.label}`}
                    className="flex items-center justify-between gap-3 py-0.5"
                  >
                    <span className="text-[11.5px] text-[#46515e]">{row.label}</span>
                    <span className="flex items-center gap-1 flex-shrink-0">
                      {row.keys.map((k, i) => (
                        <React.Fragment key={`${row.label}-${k}-${i}`}>
                          {i > 0 && <span className="text-[9px] text-[#b6bfc8]">+</span>}
                          <KeyCap>{k}</KeyCap>
                        </React.Fragment>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-[#9aa4ae] col-span-full text-center py-6">
              No shortcuts match “{query}”.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
