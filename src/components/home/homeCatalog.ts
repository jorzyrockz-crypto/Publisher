import { TEMPLATES, TemplateCategory, TemplateDefinition } from '../../constants/templates';
import { PAGE_SIZES } from '../../constants/pageSizes';

/**
 * The vocabulary the Home gallery filters with.
 *
 * The old gallery printed one wrapping block of fourteen category pills and grouped its results
 * into fourteen sections underneath. Two shapes of the same taxonomy, both of which pushed the
 * artwork below the fold. Here the groups are the *filter bar* — a single scrollable row — and the
 * results are one flat grid, which is the shape a gallery wants: the pictures are the content, and
 * the taxonomy is a control.
 */

export interface TemplateGroup {
  label: string;
  categories: TemplateCategory[];
}

export const TEMPLATE_GROUPS: TemplateGroup[] = [
  { label: 'Reading Corner', categories: ['Champs Reading'] },
  { label: 'Tarpapel Posters', categories: ['Tarpapel'] },
  { label: 'Posters & Flyers', categories: ['Poster', 'Flyer'] },
  { label: 'Collages', categories: ['Collage'] },
  { label: 'Programs', categories: ['Program'] },
  { label: 'Social Media', categories: ['Social Media'] },
  { label: 'Cards & Invitations', categories: ['Card', 'Invitation', 'Postcard'] },
  { label: 'Menus', categories: ['Menu'] },
  { label: 'Business Cards', categories: ['Business Card'] },
  { label: 'Certificates', categories: ['Certificate'] },
  { label: 'Newsletters', categories: ['Newsletter', 'Email'] },
  { label: 'Reports & Covers', categories: ['Cover Document', 'Narrative Report'] },
  { label: 'Resumes', categories: ['Resume'] },
  { label: 'Calendars', categories: ['Calendar'] },
  { label: 'Web & Branding', categories: ['Hero Banner', 'Logo'] },
  { label: 'Brochures', categories: ['Brochure'] },
  { label: 'Blank', categories: ['Blank'] },
];

export type FormatFilter = 'all' | 'portrait' | 'landscape' | 'tiled';

export const FORMAT_FILTERS: { id: FormatFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'portrait', label: 'Portrait' },
  { id: 'landscape', label: 'Landscape' },
  { id: 'tiled', label: 'Tiled' },
];

export type TemplateFormat = 'portrait' | 'landscape' | 'tiled';

/**
 * Portrait / landscape / tiled.
 *
 * "Tiled" is not a shape, it is a job: a tarpapel is one poster printed across a grid of sheets, so
 * it is grouped by what it *is* rather than by the proportions it happens to have. Everything else
 * is simply which way up it is.
 */
export function templateFormat(tpl: TemplateDefinition): TemplateFormat {
  if (tpl.category === 'Tarpapel') return 'tiled';
  const page = tpl.project.pages[0];
  if (!page) return 'portrait';
  return page.width > page.height ? 'landscape' : 'portrait';
}

const SHORT_SIZE: Record<string, string> = {
  letter: 'Letter',
  a4: 'A4',
  'a4-landscape': 'A4 landscape',
  tabloid: 'Tabloid',
  a3: 'A3',
  trifold: 'Trifold',
  flyer: 'Flyer',
  poster: 'Poster',
  'hero-banner': 'Web banner',
  'brand-logo': 'Logo',
  certificate: 'Certificate',
  'business-card': 'Business card',
  postcard: 'Postcard',
  'greeting-card': 'Greeting card',
  'ig-post': 'Square post',
  'ig-story': 'Story',
  'yt-thumb': 'YouTube',
  'fb-cover': 'Facebook cover',
  'linkedin-banner': 'LinkedIn banner',
};

/**
 * The badge on a card's preview: the sheet the design prints on.
 *
 * Named sizes read as names ("A4", "Tabloid"); anything else falls back to its measurements, so a
 * template with a bespoke page still says what it is instead of showing nothing.
 */
export function templateSizeLabel(tpl: TemplateDefinition): string {
  const page = tpl.project.pages[0];
  if (!page) return 'Untitled';
  if (tpl.category === 'Tarpapel') {
    // Templates that name their grid get it; the rest are generic tarpapels.
    const named = /(\d)\s*[×x]\s*(\d)\s*tarpapel/i.exec(tpl.name);
    return named ? `${named[1]}×${named[2]} Tarpapel` : 'Tarpapel';
  }
  const direct = SHORT_SIZE[tpl.project.pageSizeName];
  const bySize = PAGE_SIZES.find((s) => s.width === page.width && s.height === page.height);
  if (bySize && SHORT_SIZE[bySize.name]) return SHORT_SIZE[bySize.name];
  if (direct) return direct;
  return `${Math.round(page.width)} × ${Math.round(page.height)}`;
}

/** The muted line under a card's title: what it is and how long it is. */
export function templateSubtitle(tpl: TemplateDefinition): string {
  const pages = tpl.project.pages.length;
  return `${tpl.category} · ${pages} page${pages === 1 ? '' : 's'}`;
}

/** The group a template is filed under, for search and for the chip that filters it. */
export function templateGroupLabel(tpl: TemplateDefinition): string {
  return TEMPLATE_GROUPS.find((g) => g.categories.includes(tpl.category))?.label ?? tpl.category;
}

/**
 * Live search.
 *
 * Matched against the words a user would actually type: the template's name, its category, its
 * group ("reading corner" is a group, not a category), its description, and the sheet it prints
 * on ("a4", "tarpapel", "square"). Every word has to appear somewhere, in any order, so
 * "reading a4" still finds the A4 reading signs.
 */
export function matchesSearch(tpl: TemplateDefinition, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = [
    tpl.name,
    tpl.category,
    templateGroupLabel(tpl),
    tpl.description,
    templateSizeLabel(tpl),
    tpl.project.pageSizeName,
  ]
    .join(' ')
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export interface TemplateFilterState {
  group: string;
  format: FormatFilter;
  query: string;
}

/** Everything, filtered as little as the user asked for. Order is the catalogue's. */
export function filterTemplates(state: TemplateFilterState): TemplateDefinition[] {
  const group = TEMPLATE_GROUPS.find((g) => g.label === state.group);
  return TEMPLATES.filter(
    (tpl) =>
      (!group || group.categories.includes(tpl.category)) &&
      (state.format === 'all' || templateFormat(tpl) === state.format) &&
      matchesSearch(tpl, state.query)
  );
}

/** How many templates each group holds, so a chip can say so without counting on every render. */
export const GROUP_COUNTS: Record<string, number> = TEMPLATE_GROUPS.reduce(
  (acc, group) => {
    acc[group.label] = TEMPLATES.filter((t) => group.categories.includes(t.category)).length;
    return acc;
  },
  { All: TEMPLATES.length } as Record<string, number>
);
