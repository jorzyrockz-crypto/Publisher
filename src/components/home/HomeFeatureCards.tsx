import React, { useCallback } from 'react';
import { usePublisher } from '../../context/PublisherContext';
import { A4_POSTER } from '../../utils/blankDesign';
import { filterTemplates } from './homeCatalog';
import { HOME_FEATURES, type HomeFeature } from './homeFeatures';
import { useDesignLauncher } from './useDesignLauncher';

/**
 * Three cards that answer "what am I making?" in colour, before the gallery makes anyone read.
 *
 * Every card is a real shortcut, not decoration:
 *
 *   Collage Maker    → the first collage layout in the library (a blank grid is not a collage)
 *   Tarpaulin Printer → a tarpapel canvas with the 3 × 2 grid already set
 *   Story Kit        → the asset packs, where backdrops and stickers live
 *
 * The artwork is clay-rendered pastel with a cut-out background, so it sits *on* the tint rather
 * than in a white box; `.home-feature` supplies the pastel, the hairline and the lift, and takes
 * its four colours from the card's `data-tone`, so dark mode is one more block of the same four.
 */
export const HomeFeatureCards: React.FC = () => {
  const { setHomeSection } = usePublisher();
  const { startTarpapel, startBlank, applyTemplate } = useDesignLauncher();

  const open = useCallback(
    (feature: HomeFeature) => {
      switch (feature.target.kind) {
        case 'template-group': {
          const template = filterTemplates({ group: feature.target.group, format: 'all', query: '' })[0];
          if (template) applyTemplate(template.id);
          else startBlank(A4_POSTER);
          break;
        }
        case 'tarpapel':
          startTarpapel();
          break;
        case 'section':
          setHomeSection(feature.target.section);
          break;
      }
    },
    [applyTemplate, setHomeSection, startBlank, startTarpapel]
  );

  return (
    <section aria-label="What you can make" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {HOME_FEATURES.map((feature) => (
        <button
          key={feature.id}
          type="button"
          data-tone={feature.tone}
          onClick={() => open(feature)}
          className="home-feature flex items-center justify-between gap-2 overflow-hidden rounded-feature px-4 py-4 text-left cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-focus sm:last:col-span-2 xl:last:col-span-1"
        >
          <span className="min-w-0 max-w-[58%]">
            <span className="home-feature-title block truncate text-base font-bold tracking-[-0.01em]">
              {feature.title}
            </span>
            <span className="home-feature-subtitle mt-1 block text-meta">
              {feature.subtitle}
            </span>
          </span>

          {/* Decorative: the title already carries the meaning, so the image is not announced. */}
          <img
            src={feature.art}
            alt=""
            aria-hidden="true"
            width={feature.width}
            height={feature.height}
            decoding="async"
            className="home-feature-art h-[86px] w-auto max-w-[46%] flex-shrink-0 object-contain sm:h-[92px]"
          />
        </button>
      ))}
    </section>
  );
};
