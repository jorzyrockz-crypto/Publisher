/**
 * The Home screen's logic, held to the rules it promises.
 *
 * Home is mostly chrome, and chrome is not worth a check. What *is* worth one is the small amount of
 * logic that decides which templates you see and what document a chip makes, because both are
 * invisible failures: a template filed under no group simply disappears from every filter, and a
 * "3 × 2 tarpapel" whose canvas has the wrong ratio prints as a poster with two blank sheets.
 *
 * The modules are loaded through Vite's own module graph rather than Node's type stripping, because
 * the template catalogue is TypeScript with cross-file type imports, and the bundler is the only
 * thing in this repo that resolves those the way the app does.
 *
 *   npm run check:home
 */
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

const [catalog, blanks, recents, printing, catalogue] = await Promise.all([
  server.ssrLoadModule('/src/components/home/homeCatalog.ts'),
  server.ssrLoadModule('/src/utils/blankDesign.ts'),
  server.ssrLoadModule('/src/utils/recentDesigns.ts'),
  server.ssrLoadModule('/src/utils/printUtils.ts'),
  server.ssrLoadModule('/src/constants/templates.ts'),
]);
await server.close();

const { TEMPLATES } = catalogue;

const {
  TEMPLATE_GROUPS,
  GROUP_COUNTS,
  FORMAT_FILTERS,
  filterTemplates,
  matchesSearch,
  templateFormat,
  templateSizeLabel,
  templateSubtitle,
  templateGroupLabel,
} = catalog;

const {
  buildBlankProject,
  buildTarpapelProject,
  tarpapelPosterSize,
  clampCustomSize,
  TARPAPEL_3X2,
  A4_POSTER,
  LANDSCAPE_BANNER,
  SQUARE_POST,
} = blanks;

const { formatEditedAgo } = recents;
const { computeTarpapelMetrics, DEFAULT_PRINT_SETTINGS } = printing;

let fail = 0;
const ok = (cond, msg, extra = '') => {
  if (!cond) {
    fail += 1;
    console.log('FAIL', msg, extra);
  }
};

/* 1. every template is reachable through exactly one filter chip */
{
  const seen = new Map();
  for (const tpl of TEMPLATES) {
    const owners = TEMPLATE_GROUPS.filter((group) => group.categories.includes(tpl.category));
    ok(owners.length === 1, `${tpl.id} (${tpl.category}) is in ${owners.length} groups`);
    if (owners.length === 1) seen.set(tpl.id, owners[0].label);
  }
  ok(seen.size === TEMPLATES.length, 'duplicate template ids across groups');

  const sum = TEMPLATE_GROUPS.reduce((total, group) => total + (GROUP_COUNTS[group.label] ?? 0), 0);
  ok(sum === TEMPLATES.length, 'group counts do not add up to the catalogue', `${sum} vs ${TEMPLATES.length}`);
  ok(GROUP_COUNTS.All === TEMPLATES.length, 'the All chip count is wrong');
  console.log(`${TEMPLATES.length} templates, ${TEMPLATE_GROUPS.length} groups, none orphaned`);
}

/* 2. every card can say what it is */
{
  for (const tpl of TEMPLATES) {
    const label = templateSizeLabel(tpl);
    ok(typeof label === 'string' && label.trim().length > 0, `${tpl.id} has no size label`);
    ok(!/NaN|undefined/.test(label), `${tpl.id} has a broken size label: ${label}`);
    const subtitle = templateSubtitle(tpl);
    ok(!/undefined|NaN/.test(subtitle), `${tpl.id} has a broken subtitle: ${subtitle}`);
    ok(templateGroupLabel(tpl) !== undefined, `${tpl.id} has no group`);
  }
  const tarpapels = TEMPLATES.filter((t) => t.category === 'Tarpapel');
  ok(
    tarpapels.every((t) => templateSizeLabel(t).includes('Tarpapel')),
    'a tarpapel card does not say Tarpapel'
  );
}

/* 3. the format filter partitions the library without losing anything */
{
  const counts = { portrait: 0, landscape: 0, tiled: 0 };
  for (const tpl of TEMPLATES) counts[templateFormat(tpl)] += 1;
  const total = counts.portrait + counts.landscape + counts.tiled;
  ok(total === TEMPLATES.length, 'format classification lost templates', JSON.stringify(counts));
  for (const option of FORMAT_FILTERS) {
    const n = filterTemplates({ group: 'All', format: option.id, query: '' }).length;
    const expected = option.id === 'all' ? TEMPLATES.length : counts[option.id];
    ok(n === expected, `format "${option.id}" filters ${n}, expected ${expected}`);
  }
  ok(counts.tiled === TEMPLATES.filter((t) => t.category === 'Tarpapel').length, 'Tiled is not the tarpapel set');
  console.log('formats:', JSON.stringify(counts));
}

/* 4. search finds what a person would type */
{
  const n = (query) => filterTemplates({ group: 'All', format: 'all', query }).length;
  ok(n('tarpapel') > 0 && n('tarpapel') < TEMPLATES.length, 'searching "tarpapel" filters nothing');
  ok(n('tarpapel') === TEMPLATES.filter((t) => /tarpapel/i.test(`${t.name} ${t.description} ${t.category}`)).length,
    '"tarpapel" does not return the tarpapel set');
  ok(n('reading corner') > 0, 'searching "reading corner" (a group name) finds nothing');
  ok(n('a4') > 0, 'searching "a4" finds nothing');
  ok(n('') === TEMPLATES.length, 'an empty query must return everything');
  ok(n('  ') === TEMPLATES.length, 'a whitespace query must return everything');
  ok(n('zzzzz') === 0, 'a nonsense query must return nothing');
  ok(
    TEMPLATES.every((tpl) => matchesSearch(tpl, tpl.name.split(' ')[0])),
    'a template cannot be found by the first word of its own name'
  );

  // Words in any order: "reading a4" is a phrase nobody types in the catalogue's order.
  const both = TEMPLATES.filter((t) => matchesSearch(t, 'reading a4'));
  ok(both.length > 0, 'multi-word search in any order fails');
}

/* 5. group + format compose */
{
  const reading = filterTemplates({ group: 'Reading Corner', format: 'all', query: '' });
  ok(reading.length > 0, 'the Reading Corner chip is empty');
  ok(reading.every((t) => t.category === 'Champs Reading'), 'Reading Corner leaked another category');
  const landscape = filterTemplates({ group: 'Reading Corner', format: 'landscape', query: '' });
  ok(landscape.length <= reading.length, 'adding a format widened the result');
  ok(landscape.every((t) => templateFormat(t) === 'landscape'), 'the format filter leaked');
}

/* 6. blank documents are blank, and the right size */
{
  for (const spec of [A4_POSTER, LANDSCAPE_BANNER, SQUARE_POST]) {
    const project = buildBlankProject(spec);
    ok(project.pages.length === 1, `${spec.name} is not one page`);
    const page = project.pages[0];
    ok(page.elements.length === 0, `${spec.name} starts with elements on it`);
    ok(page.width === spec.width && page.height === spec.height, `${spec.name} is the wrong size`);
    ok(page.orientation === (spec.width > spec.height ? 'landscape' : 'portrait'), `${spec.name} is the wrong way up`);
    ok(page.margins.top > 0 && page.margins.left > 0, `${spec.name} has no margins`);
    ok(project.colorScheme === 'office', `${spec.name} has no colour scheme`);
    ok(!/undefined/.test(project.name), `${spec.name} has a broken name`);
  }
  const big = buildBlankProject({ name: 'x', width: 3000, height: 2000, pageSizeName: 'custom' });
  ok(big.pages[0].margins.top >= 40, 'a large sheet must not keep a letter-sized margin');
}

/* 7. a tarpapel canvas is the assembled poster, not one sheet */
{
  const stub = buildBlankProject(A4_POSTER).pages[0];
  const metrics = computeTarpapelMetrics(stub, {
    ...DEFAULT_PRINT_SETTINGS,
    printMode: 'tarpapel',
    paperSize: 'a4',
    sheetOrientation: 'landscape',
    tarpapelCols: TARPAPEL_3X2.cols,
    tarpapelRows: TARPAPEL_3X2.rows,
  });
  const expectedRatio = metrics.totalPosterWIn / metrics.totalPosterHIn;
  const size = tarpapelPosterSize(DEFAULT_PRINT_SETTINGS, TARPAPEL_3X2.cols, TARPAPEL_3X2.rows);
  const actualRatio = size.width / size.height;
  ok(Math.abs(actualRatio - expectedRatio) < 0.01, 'the tarpapel canvas is not the poster ratio', `${actualRatio.toFixed(3)} vs ${expectedRatio.toFixed(3)}`);
  ok(size.width <= 3600, 'the tarpapel canvas is wider than the cap', String(size.width));
  ok(expectedRatio > 2 && expectedRatio < 2.4, 'three A4-landscape sheets across two down is not ~2.2:1', expectedRatio.toFixed(3));

  const spec = buildTarpapelProject(DEFAULT_PRINT_SETTINGS);
  ok(spec.pageSizeName === 'tarpapel-3x2', 'the tarpapel document does not name its grid');
  const project = buildBlankProject(spec);
  ok(project.pages[0].width === size.width && project.pages[0].height === size.height, 'the tarpapel page is not the poster');
  const marginShare = project.pages[0].margins.top / Math.min(size.width, size.height);
  ok(marginShare > 0.05, 'the tarpapel margin does not clear a glue strip', marginShare.toFixed(3));
  ok(TARPAPEL_3X2.settings.tarpapelCols === 3 && TARPAPEL_3X2.settings.tarpapelRows === 2, 'the 3×2 print setup is not 3×2');
}

/* 8. custom sizes are clamped to something the canvas can draw */
{
  ok(clampCustomSize(10, 10).width === 200, 'a tiny custom size was not raised');
  ok(clampCustomSize(99999, 99999).width === 4000, 'a huge custom size was not capped');
  ok(clampCustomSize(1200.6, 400.4).width === 1201, 'a custom size was not rounded');
  ok(clampCustomSize(NaN, 500).width === 200, 'a NaN width was not handled');
}

/* 9. "last edited" reads like a person wrote it */
{
  const now = Date.UTC(2026, 10, 26, 12, 0, 0);
  ok(formatEditedAgo(now - 10_000, now) === 'just now', 'seconds did not read as just now');
  ok(formatEditedAgo(now - 60_000, now) === '1 min ago', 'one minute is not "1 min ago"');
  ok(formatEditedAgo(now - 3 * 3_600_000, now) === '3 hr ago', 'hours are wrong');
  ok(!/NaN|Invalid/.test(formatEditedAgo(0, now)), 'an old timestamp produced Invalid Date');
}

console.log(fail === 0 ? 'ALL CHECKS PASSED' : `${fail} FAILURES`);
process.exitCode = fail === 0 ? 0 : 1;
