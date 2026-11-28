import React, { useCallback } from 'react';
import { A4_POSTER, SQUARE_POST } from '../../utils/blankDesign';
import { filterTemplates } from './homeCatalog';
import { HOME_SHORTCUTS, type HomeShortcut } from './shortcutCatalog';
import { useDesignLauncher } from './useDesignLauncher';

/**
 * The row of mini cards inside the hero: six ways to start, in the same pastel language as the
 * rest of Home.
 *
 * Every card **starts a document**; none of them merely filters the gallery, because a card called
 * "Reading Corner" that scrolls a grid is a link dressed as a button. Where a format has a design
 * worth starting from (a reading sign, an A4 poster, a collage layout) the card opens the first
 * template of that kind; where it does not (a tarpapel grid, a square post, a blank page) it makes
 * the canvas. Either way the next thing on screen is the editor.
 *
 * The row scrolls sideways rather than wrapping — six cards on a laptop is a row, and a second line
 * of cards under the search box pushes the gallery below the fold. `safe center` keeps the row
 * centred when it fits and falls back to left alignment when it overflows, which is what stops the
 * first card being unreachable inside the scroll box. The vertical padding is the scroll container's
 * room for the hover shadow: `overflow-x` clips on both axes, so without it every lifted card loses
 * its top and bottom edge.
 */
export const HomeShortcuts: React.FC = () => {
  const { startTarpapel, startBlank, applyTemplate } = useDesignLauncher();

  const open = useCallback(
    (shortcut: HomeShortcut) => {
      const { action } = shortcut;
      switch (action.kind) {
        case 'tarpapel':
          startTarpapel();
          break;
        case 'blank':
          startBlank(action.spec === 'square' ? SQUARE_POST : A4_POSTER);
          break;
        case 'template': {
          const template = filterTemplates({
            group: action.group,
            format: action.format ?? 'all',
            query: action.query ?? '',
          })[0];
          if (template) applyTemplate(template.id);
          else startBlank(A4_POSTER);
          break;
        }
      }
    },
    [applyTemplate, startBlank, startTarpapel]
  );

  return (
    <div
      className="home-strip mt-1 -mb-2 flex gap-2 overflow-x-auto px-1 py-2.5 [justify-content:safe_center]"
      role="group"
      aria-label="Start a design"
    >
      {HOME_SHORTCUTS.map((shortcut) => (
        <button
          key={shortcut.id}
          type="button"
          data-tone={shortcut.tone}
          onClick={() => open(shortcut)}
          className="home-shortcut flex w-[200px] flex-shrink-0 items-center justify-between gap-2 rounded-feature px-3 py-2 text-left cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-focus"
        >
          <span className="min-w-0">
            <span className="home-shortcut-title block truncate text-meta font-bold tracking-[-0.01em]">
              {shortcut.title}
            </span>
            <span className="home-shortcut-sub block truncate text-2xs">
              {shortcut.subtitle}
            </span>
          </span>

          {/* Decorative: the label already carries the meaning, so it is not announced. */}
          <img
            src={shortcut.art}
            alt=""
            aria-hidden="true"
            width={shortcut.width}
            height={shortcut.height}
            decoding="async"
            className="home-shortcut-art h-12 w-12 flex-shrink-0 object-contain"
          />
        </button>
      ))}
    </div>
  );
};
