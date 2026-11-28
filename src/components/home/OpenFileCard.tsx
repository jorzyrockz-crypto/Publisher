import React, { useRef, useState } from 'react';
import { FolderOpen, Loader2 } from 'lucide-react';
import { useDesignLauncher } from './useDesignLauncher';

/** What the app writes on save (`.pub`) and what this dialog has always accepted (`.spress`). */
const ACCEPT = '.pub,.spress,.json,application/json';

/**
 * Opening a saved document.
 *
 * A browser cannot remember where a download went, so the file picker is the only honest route back
 * into a `.pub`/`.spress` on disk. Two shapes of the same control: a dashed card for the strips and
 * a small pill for the My Projects header.
 */
export const OpenFileCard: React.FC<{ variant?: 'card' | 'strip' | 'pill' }> = ({
  variant = 'card',
}) => {
  const { openFile } = useDesignLauncher();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await openFile(file);
    } catch {
      setError('That file could not be read as a StudioPress document.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        title="Open a saved .spress / .pub file"
        className={
          variant === 'pill'
            ? 'flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-meta font-semibold text-ink-body transition-colors hover:border-accent-line hover:bg-accent-soft hover:text-accent-ink cursor-pointer'
            : `flex w-full flex-col items-center justify-center gap-2 rounded-tile border border-dashed border-line bg-surface-sunken p-4 text-center transition-colors hover:border-accent-line hover:bg-accent-soft cursor-pointer ${
                // Matches the artwork tile plus its two text lines in each layout, so the dashed
                // card does not sit proud of the designs beside it.
                variant === 'strip' ? 'h-[166px]' : 'h-[186px]'
              }`
        }
      >
        {busy ? (
          <Loader2 size={18} className="animate-spin text-accent-ink" />
        ) : (
          <FolderOpen size={variant === 'pill' ? 14 : 22} className="text-accent-ink" />
        )}
        <span className={variant === 'pill' ? '' : 'text-body font-semibold text-ink'}>
          Open File
        </span>
        {variant !== 'pill' && (
          <span className="text-meta text-ink-muted">a saved .spress or .pub document</span>
        )}
      </button>
      {error && <p className="mt-1 text-2xs font-medium text-red-500">{error}</p>}
    </>
  );
};
