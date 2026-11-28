export type StickerCategory =
  | 'celebration'
  | 'love'
  | 'holiday'
  | 'travel'
  | 'kawaii'
  | 'doodles'
  | 'nature'
  | 'people'
  | 'animals'
  | 'plants'
  | 'objects'
  | 'school-office'
  | 'certificates';

export interface StickerDef {
  id: string;
  name: string;
  category: StickerCategory;
  vibePackIds?: string[];
  svg: string;
  dataUri: string;
}

const toSvgUri = (svg: string): string =>
  `data:image/svg+xml,${encodeURIComponent(svg)}`;

const makeSticker = (
  id: string,
  name: string,
  category: StickerCategory,
  innerSvg: string,
  vibePackIds?: string[]
): StickerDef => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">${innerSvg}</svg>`;
  return {
    id,
    name,
    category,
    vibePackIds,
    svg,
    dataUri: toSvgUri(svg),
  };
};

/**
 * The certificate seals and K-3 stickers are drawn by hand as 512×512 transparent PNGs rather than
 * as SVG paths, so they register through the same catalog with the file itself as the data URI.
 * `svg` still carries a wrapper so anything that inlines a sticker sees a self-contained document.
 */
const makeRasterSticker = (
  id: string,
  name: string,
  category: StickerCategory,
  src: string,
  size = 512
): StickerDef => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><image href="${src}" x="0" y="0" width="${size}" height="${size}"/></svg>`;
  return { id, name, category, svg, dataUri: src };
};

export const STICKER_CATALOG: StickerDef[] = [
  // Celebration (Birthday & Graduation)
  makeSticker(
    'stk-cake',
    'Birthday Cake',
    'celebration',
    `<rect x="24" y="60" width="72" height="36" rx="8" fill="#fbcfe8" stroke="#be185d" stroke-width="4"/>
     <path d="M24 66 Q36 78 48 66 Q60 78 72 66 Q84 78 96 66 L96 56 L24 56 Z" fill="#f43f5e"/>
     <rect x="44" y="34" width="8" height="22" rx="2" fill="#38bdf8" stroke="#0369a1" stroke-width="2.5"/>
     <rect x="68" y="34" width="8" height="22" rx="2" fill="#fbbf24" stroke="#b45309" stroke-width="2.5"/>
     <path d="M48 20 Q53 28 48 33 Q43 28 48 20 Z" fill="#f97316"/>
     <path d="M72 20 Q77 28 72 33 Q67 28 72 20 Z" fill="#f97316"/>`,
    ['birthday-bash']
  ),
  makeSticker(
    'stk-balloon',
    'Party Balloon',
    'celebration',
    `<ellipse cx="60" cy="48" rx="30" ry="36" fill="#fb7185" stroke="#be123c" stroke-width="4"/>
     <ellipse cx="49" cy="34" rx="7" ry="12" fill="#ffe4e6" opacity="0.65" transform="rotate(-18 49 34)"/>
     <polygon points="55,84 65,84 60,92" fill="#be123c"/>
     <path d="M60 92 Q52 102 64 112" fill="none" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>`,
    ['birthday-bash']
  ),
  makeSticker(
    'stk-confetti-burst',
    'Confetti Pop',
    'celebration',
    `<polygon points="60,12 70,42 102,42 76,60 86,90 60,72 34,90 44,60 18,42 50,42" fill="#fbbf24" stroke="#b45309" stroke-width="3.5" stroke-linejoin="round"/>
     <circle cx="22" cy="24" r="6" fill="#f43f5e"/>
     <circle cx="98" cy="22" r="5" fill="#38bdf8"/>
     <circle cx="96" cy="96" r="6" fill="#a855f7"/>
     <circle cx="24" cy="94" r="5" fill="#10b981"/>`,
    ['birthday-bash', 'pastel-zine']
  ),
  makeSticker(
    'stk-grad-cap',
    'Graduation Cap',
    'celebration',
    `<polygon points="60,22 106,44 60,66 14,44" fill="#1e293b" stroke="#0f172a" stroke-width="3.5" stroke-linejoin="round"/>
     <path d="M34 54 L34 78 Q60 92 86 78 L86 54" fill="#334155" stroke="#0f172a" stroke-width="3.5"/>
     <line x1="94" y1="49" x2="94" y2="84" stroke="#eab308" stroke-width="4" stroke-linecap="round"/>
     <circle cx="94" cy="86" r="5" fill="#facc15"/>`,
    ['graduation-honors']
  ),
  makeSticker(
    'stk-trophy',
    'Gold Trophy',
    'celebration',
    `<path d="M36 24 H84 V52 C84 68 72 78 60 78 C48 78 36 68 36 52 Z" fill="#facc15" stroke="#a16207" stroke-width="4"/>
     <path d="M36 32 H22 C18 32 18 52 36 54" fill="none" stroke="#a16207" stroke-width="4"/>
     <path d="M84 32 H98 C102 32 102 52 84 54" fill="none" stroke="#a16207" stroke-width="4"/>
     <rect x="54" y="78" width="12" height="16" fill="#eab308" stroke="#a16207" stroke-width="3"/>
     <rect x="40" y="94" width="40" height="10" rx="3" fill="#854d0e"/>`,
    ['graduation-honors']
  ),

  // Love & Wedding
  makeSticker(
    'stk-rings',
    'Wedding Rings',
    'love',
    `<circle cx="48" cy="64" r="24" fill="none" stroke="#eab308" stroke-width="7"/>
     <circle cx="72" cy="64" r="24" fill="none" stroke="#facc15" stroke-width="7"/>
     <polygon points="48,26 58,36 48,44 38,36" fill="#bae6fd" stroke="#0284c7" stroke-width="2.5"/>`,
    ['wedding-romance']
  ),
  makeSticker(
    'stk-gold-heart',
    'Golden Heart',
    'love',
    `<path d="M60 98 C24 74 16 48 26 32 C35 18 52 20 60 34 C68 20 85 18 94 32 C104 48 96 74 60 98 Z" fill="#fda4af" stroke="#e11d48" stroke-width="4"/>
     <path d="M38 36 Q44 30 50 36" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>`,
    ['wedding-romance', 'kawaii-sticker']
  ),
  makeSticker(
    'stk-sparkle',
    'Magic Sparkles',
    'love',
    `<path d="M60 12 L68 48 L104 56 L68 64 L60 100 L52 64 L16 56 L52 48 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="3.5" stroke-linejoin="round"/>
     <path d="M92 16 L95 26 L105 29 L95 32 L92 42 L89 32 L79 29 L89 26 Z" fill="#fde047"/>`,
    ['wedding-romance', 'graduation-honors', 'kawaii-sticker']
  ),

  // Holiday
  makeSticker(
    'stk-tree',
    'Holiday Tree',
    'holiday',
    `<polygon points="60,14 92,48 76,48 98,78 22,78 44,48 28,48" fill="#16a34a" stroke="#14532d" stroke-width="4" stroke-linejoin="round"/>
     <rect x="52" y="78" width="16" height="22" rx="2" fill="#92400e"/>
     <polygon points="60,6 64,15 73,15 66,20 68,29 60,24 52,29 54,20 47,15 56,15" fill="#facc15"/>
     <circle cx="54" cy="48" r="4" fill="#f43f5e"/>
     <circle cx="70" cy="64" r="4" fill="#fbbf24"/>`,
    ['holiday-festive']
  ),
  makeSticker(
    'stk-snowflake',
    'Winter Snowflake',
    'holiday',
    `<g stroke="#38bdf8" stroke-width="5" stroke-linecap="round">
       <line x1="60" y1="14" x2="60" y2="106"/>
       <line x1="20" y1="37" x2="100" y2="83"/>
       <line x1="100" y1="37" x2="20" y2="83"/>
       <polyline points="48,26 60,36 72,26" fill="none"/>
       <polyline points="48,94 60,84 72,94" fill="none"/>
     </g>
     <circle cx="60" cy="60" r="8" fill="#e0f2fe" stroke="#0284c7" stroke-width="3"/>`,
    ['holiday-festive']
  ),
  makeSticker(
    'stk-gift',
    'Wrapped Gift',
    'holiday',
    `<rect x="24" y="46" width="72" height="54" rx="6" fill="#f43f5e" stroke="#9f1239" stroke-width="4"/>
     <rect x="20" y="36" width="80" height="16" rx="4" fill="#fb7185" stroke="#9f1239" stroke-width="4"/>
     <rect x="53" y="36" width="14" height="64" fill="#fde047"/>
     <path d="M60 36 C42 18 32 30 48 36 Z" fill="#fde047" stroke="#ca8a04" stroke-width="3"/>
     <path d="M60 36 C78 18 88 30 72 36 Z" fill="#fde047" stroke="#ca8a04" stroke-width="3"/>`,
    ['holiday-festive', 'birthday-bash']
  ),

  // Travel
  makeSticker(
    'stk-plane',
    'Paper Airplane',
    'travel',
    `<polygon points="104,20 18,54 48,68 90,34 58,76 88,94" fill="#38bdf8" stroke="#0369a1" stroke-width="4" stroke-linejoin="round"/>
     <polygon points="48,68 58,76 54,96" fill="#0284c7"/>`,
    ['travel-journal']
  ),
  makeSticker(
    'stk-compass',
    'Adventure Compass',
    'travel',
    `<circle cx="60" cy="60" r="40" fill="#fffbeb" stroke="#b45309" stroke-width="5"/>
     <polygon points="60,26 70,60 60,54 50,60" fill="#ef4444"/>
     <polygon points="60,94 70,60 60,66 50,60" fill="#334155"/>
     <circle cx="60" cy="60" r="5" fill="#facc15"/>`,
    ['travel-journal']
  ),
  makeSticker(
    'stk-camera',
    'Retro Camera',
    'travel',
    `<rect x="18" y="36" width="84" height="58" rx="10" fill="#334155" stroke="#0f172a" stroke-width="4"/>
     <rect x="38" y="24" width="26" height="12" rx="4" fill="#475569" stroke="#0f172a" stroke-width="3"/>
     <circle cx="60" cy="65" r="18" fill="#e2e8f0" stroke="#0f172a" stroke-width="4"/>
     <circle cx="60" cy="65" r="10" fill="#0ea5e9"/>
     <circle cx="84" cy="48" r="4" fill="#f43f5e"/>`,
    ['retro-polaroid', 'travel-journal']
  ),

  // Kawaii & Baby
  makeSticker(
    'stk-cloud',
    'Dreamy Cloud',
    'kawaii',
    `<path d="M30 82 H88 C98 82 104 74 104 65 C104 56 97 49 88 49 C86 35 74 26 60 26 C46 26 35 36 33 49 C23 50 16 58 16 67 C16 76 22 82 30 82 Z" fill="#e0f2fe" stroke="#38bdf8" stroke-width="4"/>
     <circle cx="48" cy="60" r="3" fill="#0f172a"/>
     <circle cx="72" cy="60" r="3" fill="#0f172a"/>
     <path d="M55 66 Q60 71 65 66" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>`,
    ['baby-milestone', 'kawaii-sticker']
  ),
  makeSticker(
    'stk-moon',
    'Crescent Moon',
    'kawaii',
    `<path d="M74 20 C48 22 30 44 32 70 C34 92 54 106 78 102 C58 94 52 74 56 54 C60 38 66 28 74 20 Z" fill="#fde047" stroke="#ca8a04" stroke-width="4" stroke-linejoin="round"/>
     <circle cx="84" cy="36" r="4" fill="#facc15"/>`,
    ['baby-milestone']
  ),
  makeSticker(
    'stk-bow',
    'Pastel Bow',
    'kawaii',
    `<path d="M60 58 C38 30 16 36 22 60 C28 84 48 72 60 62 Z" fill="#f9a8d4" stroke="#db2777" stroke-width="4"/>
     <path d="M60 58 C82 30 104 36 98 60 C92 84 72 72 60 62 Z" fill="#f9a8d4" stroke="#db2777" stroke-width="4"/>
     <circle cx="60" cy="60" r="9" fill="#f472b6" stroke="#db2777" stroke-width="4"/>`,
    ['kawaii-sticker', 'baby-milestone']
  ),

  // Doodles & Tape
  makeSticker(
    'stk-washi',
    'Washi Tape Strip',
    'doodles',
    `<g transform="rotate(-12 60 60)">
       <polygon points="16,44 104,44 98,54 104,64 98,74 16,74 22,64 16,54" fill="#fda4af" opacity="0.9" stroke="#f43f5e" stroke-width="2.5"/>
       <line x1="34" y1="46" x2="26" y2="72" stroke="#ffffff" stroke-width="3" opacity="0.6"/>
       <line x1="60" y1="46" x2="52" y2="72" stroke="#ffffff" stroke-width="3" opacity="0.6"/>
       <line x1="86" y1="46" x2="78" y2="72" stroke="#ffffff" stroke-width="3" opacity="0.6"/>
     </g>`,
    ['cozy-scrapbook', 'retro-polaroid']
  ),
  makeSticker(
    'stk-crown',
    'Doodle Crown',
    'doodles',
    `<polygon points="20,86 16,36 42,56 60,26 78,56 104,36 100,86" fill="#ffd166" stroke="#3d348b" stroke-width="4.5" stroke-linejoin="round"/>
     <circle cx="60" cy="66" r="5" fill="#ef476f"/>`,
    ['pastel-zine', 'editorial-minimal']
  ),
  makeSticker(
    'stk-lightning',
    'Pop Lightning',
    'doodles',
    `<polygon points="68,14 28,64 56,64 48,106 92,52 62,52" fill="#fde047" stroke="#3d348b" stroke-width="4.5" stroke-linejoin="round"/>`,
    ['pastel-zine']
  ),

  // Nature & Autumn
  makeSticker(
    'stk-autumn-leaf',
    'Maple Leaf',
    'nature',
    `<path d="M60 14 L70 36 L94 32 L82 54 L102 64 L78 74 L82 90 L60 82 L38 90 L42 74 L18 64 L38 54 L26 32 L50 36 Z" fill="#f97316" stroke="#9a3412" stroke-width="3.5" stroke-linejoin="round"/>
     <line x1="60" y1="38" x2="60" y2="104" stroke="#7c2d12" stroke-width="4" stroke-linecap="round"/>`,
    ['autumn-harvest']
  ),
  makeSticker(
    'stk-flower',
    'Daisy Blossom',
    'nature',
    `<g fill="#fce7f3" stroke="#ec4899" stroke-width="3">
       <circle cx="60" cy="28" r="14"/>
       <circle cx="90" cy="48" r="14"/>
       <circle cx="78" cy="84" r="14"/>
       <circle cx="42" cy="84" r="14"/>
       <circle cx="30" cy="48" r="14"/>
     </g>
     <circle cx="60" cy="60" r="14" fill="#facc15" stroke="#ca8a04" stroke-width="3"/>`,
    ['cozy-scrapbook', 'autumn-harvest']
  ),

  // People / Humans
  makeSticker(
    'stk-graduate-person',
    'Happy Graduate',
    'people',
    `<circle cx="60" cy="52" r="22" fill="#fed7aa" stroke="#9a3412" stroke-width="3.5"/>
     <polygon points="60,16 96,30 60,44 24,30" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>
     <line x1="90" y1="32" x2="90" y2="54" stroke="#facc15" stroke-width="3.5"/>
     <path d="M28 106 C28 82 92 82 92 106 Z" fill="#1e3a8a" stroke="#0f172a" stroke-width="3.5"/>
     <circle cx="52" cy="52" r="2.8" fill="#0f172a"/>
     <circle cx="68" cy="52" r="2.8" fill="#0f172a"/>
     <path d="M53 60 Q60 66 67 60" fill="none" stroke="#9a3412" stroke-width="2.8" stroke-linecap="round"/>`,
    ['graduation-honors']
  ),
  makeSticker(
    'stk-teacher',
    'Teacher / Presenter',
    'people',
    `<circle cx="60" cy="42" r="20" fill="#fde68a" stroke="#92400e" stroke-width="3.5"/>
     <path d="M40 38 C40 20 80 20 80 38" fill="#451a03"/>
     <rect x="46" y="39" width="11" height="8" rx="2" fill="none" stroke="#0f172a" stroke-width="2.5"/>
     <rect x="63" y="39" width="11" height="8" rx="2" fill="none" stroke="#0f172a" stroke-width="2.5"/>
     <line x1="57" y1="43" x2="63" y2="43" stroke="#0f172a" stroke-width="2.5"/>
     <path d="M26 106 C26 78 94 78 94 106 Z" fill="#0d9488" stroke="#115e59" stroke-width="3.5"/>
     <polygon points="60,76 54,94 60,102 66,94" fill="#f43f5e"/>`
  ),
  makeSticker(
    'stk-office-pro',
    'Office Pro',
    'people',
    `<circle cx="60" cy="42" r="20" fill="#fed7aa" stroke="#7c2d12" stroke-width="3.5"/>
     <path d="M40 36 Q60 16 80 36" fill="#1e293b"/>
     <path d="M26 106 C26 76 94 76 94 106 Z" fill="#334155" stroke="#0f172a" stroke-width="3.5"/>
     <polygon points="60,74 52,96 60,104 68,96" fill="#4f46e5"/>
     <circle cx="53" cy="44" r="2.6" fill="#0f172a"/>
     <circle cx="67" cy="44" r="2.6" fill="#0f172a"/>
     <path d="M54 52 Q60 56 66 52" fill="none" stroke="#7c2d12" stroke-width="2.5" stroke-linecap="round"/>`
  ),
  makeSticker(
    'stk-artist-person',
    'Creative Artist',
    'people',
    `<circle cx="60" cy="48" r="20" fill="#ffedd5" stroke="#9a3412" stroke-width="3.5"/>
     <ellipse cx="56" cy="24" rx="24" ry="10" fill="#e11d48" stroke="#881337" stroke-width="3" transform="rotate(-12 56 24)"/>
     <path d="M28 106 C28 80 92 80 92 106 Z" fill="#6366f1" stroke="#312e81" stroke-width="3.5"/>
     <circle cx="53" cy="48" r="2.6" fill="#0f172a"/>
     <circle cx="67" cy="48" r="2.6" fill="#0f172a"/>
     <path d="M54 56 Q60 61 66 56" fill="none" stroke="#9a3412" stroke-width="2.5" stroke-linecap="round"/>`
  ),

  // Animals
  makeSticker(
    'stk-wise-owl',
    'Wise Owl',
    'animals',
    `<ellipse cx="60" cy="64" rx="34" ry="38" fill="#b45309" stroke="#78350f" stroke-width="4"/>
     <ellipse cx="60" cy="74" rx="22" ry="22" fill="#fef3c7"/>
     <circle cx="46" cy="48" r="11" fill="#ffffff" stroke="#78350f" stroke-width="3"/>
     <circle cx="74" cy="48" r="11" fill="#ffffff" stroke="#78350f" stroke-width="3"/>
     <circle cx="46" cy="48" r="5" fill="#0f172a"/>
     <circle cx="74" cy="48" r="5" fill="#0f172a"/>
     <polygon points="55,56 65,56 60,65" fill="#f59e0b"/>
     <polygon points="32,26 42,34 30,42" fill="#92400e"/>
     <polygon points="88,26 78,34 90,42" fill="#92400e"/>`,
    ['graduation-honors', 'kawaii-sticker']
  ),
  makeSticker(
    'stk-cute-cat',
    'Cute Cat',
    'animals',
    `<polygon points="28,24 46,40 26,52" fill="#fb923c" stroke="#9a3412" stroke-width="3.5"/>
     <polygon points="92,24 74,40 94,52" fill="#fb923c" stroke="#9a3412" stroke-width="3.5"/>
     <circle cx="60" cy="64" r="34" fill="#fdba74" stroke="#9a3412" stroke-width="4"/>
     <circle cx="46" cy="58" r="4" fill="#0f172a"/>
     <circle cx="74" cy="58" r="4" fill="#0f172a"/>
     <polygon points="56,66 64,66 60,72" fill="#f43f5e"/>
     <path d="M52 75 Q60 80 68 75" fill="none" stroke="#9a3412" stroke-width="2.5" stroke-linecap="round"/>`,
    ['kawaii-sticker']
  ),
  makeSticker(
    'stk-puppy',
    'Playful Puppy',
    'animals',
    `<ellipse cx="26" cy="60" rx="12" ry="24" fill="#92400e" stroke="#451a03" stroke-width="3.5" transform="rotate(14 26 60)"/>
     <ellipse cx="94" cy="60" rx="12" ry="24" fill="#92400e" stroke="#451a03" stroke-width="3.5" transform="rotate(-14 94 60)"/>
     <circle cx="60" cy="62" r="32" fill="#fde68a" stroke="#78350f" stroke-width="4"/>
     <circle cx="47" cy="56" r="4" fill="#0f172a"/>
     <circle cx="73" cy="56" r="4" fill="#0f172a"/>
     <ellipse cx="60" cy="67" rx="7" ry="5" fill="#1e293b"/>`,
    ['kawaii-sticker']
  ),
  makeSticker(
    'stk-butterfly',
    'Monarch Butterfly',
    'animals',
    `<path d="M58 56 C30 22 10 38 22 64 C28 76 46 72 58 64 Z" fill="#f97316" stroke="#7c2d12" stroke-width="3.5"/>
     <path d="M62 56 C90 22 110 38 98 64 C92 76 74 72 62 64 Z" fill="#f97316" stroke="#7c2d12" stroke-width="3.5"/>
     <path d="M58 66 C34 72 26 98 44 98 C54 98 58 82 58 66 Z" fill="#fbbf24" stroke="#7c2d12" stroke-width="3.5"/>
     <path d="M62 66 C86 72 94 98 76 98 C66 98 62 82 62 66 Z" fill="#fbbf24" stroke="#7c2d12" stroke-width="3.5"/>
     <rect x="57" y="42" width="6" height="44" rx="3" fill="#1e293b"/>`
  ),

  // Plants
  makeSticker(
    'stk-monstera',
    'Monstera Leaf',
    'plants',
    `<path d="M60 16 C88 20 100 48 92 78 C84 96 68 100 60 96 C52 100 36 96 28 78 C20 48 32 20 60 16 Z" fill="#16a34a" stroke="#14532d" stroke-width="4"/>
     <line x1="60" y1="22" x2="60" y2="108" stroke="#14532d" stroke-width="4" stroke-linecap="round"/>
     <ellipse cx="42" cy="52" rx="8" ry="4" fill="#ffffff" opacity="0.85" transform="rotate(-20 42 52)"/>
     <ellipse cx="78" cy="52" rx="8" ry="4" fill="#ffffff" opacity="0.85" transform="rotate(20 78 52)"/>
     <ellipse cx="44" cy="74" rx="7" ry="3.5" fill="#ffffff" opacity="0.85" transform="rotate(-15 44 74)"/>
     <ellipse cx="76" cy="74" rx="7" ry="3.5" fill="#ffffff" opacity="0.85" transform="rotate(15 76 74)"/>`
  ),
  makeSticker(
    'stk-succulent',
    'Potted Succulent',
    'plants',
    `<polygon points="34,68 86,68 78,104 42,104" fill="#ea580c" stroke="#7c2d12" stroke-width="4" stroke-linejoin="round"/>
     <rect x="30" y="60" width="60" height="12" rx="4" fill="#f97316" stroke="#7c2d12" stroke-width="3.5"/>
     <ellipse cx="60" cy="40" rx="12" ry="22" fill="#22c55e" stroke="#14532d" stroke-width="3.5"/>
     <ellipse cx="42" cy="48" rx="10" ry="18" fill="#16a34a" stroke="#14532d" stroke-width="3.5" transform="rotate(-28 42 48)"/>
     <ellipse cx="78" cy="48" rx="10" ry="18" fill="#16a34a" stroke="#14532d" stroke-width="3.5" transform="rotate(28 78 48)"/>`,
    ['cozy-scrapbook']
  ),
  makeSticker(
    'stk-laurel-wreath',
    'Laurel Wreath',
    'plants',
    `<path d="M54 96 C26 86 18 52 34 26" fill="none" stroke="#ca8a04" stroke-width="4" stroke-linecap="round"/>
     <path d="M66 96 C94 86 102 52 86 26" fill="none" stroke="#ca8a04" stroke-width="4" stroke-linecap="round"/>
     <ellipse cx="26" cy="58" rx="9" ry="5" fill="#facc15" stroke="#a16207" stroke-width="2" transform="rotate(-30 26 58)"/>
     <ellipse cx="32" cy="40" rx="9" ry="5" fill="#facc15" stroke="#a16207" stroke-width="2" transform="rotate(-15 32 40)"/>
     <ellipse cx="34" cy="76" rx="9" ry="5" fill="#facc15" stroke="#a16207" stroke-width="2" transform="rotate(-45 34 76)"/>
     <ellipse cx="94" cy="58" rx="9" ry="5" fill="#facc15" stroke="#a16207" stroke-width="2" transform="rotate(30 94 58)"/>
     <ellipse cx="88" cy="40" rx="9" ry="5" fill="#facc15" stroke="#a16207" stroke-width="2" transform="rotate(15 88 40)"/>
     <ellipse cx="86" cy="76" rx="9" ry="5" fill="#facc15" stroke="#a16207" stroke-width="2" transform="rotate(45 86 76)"/>
     <polygon points="60,28 64,38 74,38 66,44 69,54 60,48 51,54 54,44 46,38 56,38" fill="#eab308"/>`,
    ['graduation-honors']
  ),
  makeSticker(
    'stk-sunflower',
    'Bright Sunflower',
    'plants',
    `<g fill="#facc15" stroke="#ca8a04" stroke-width="2.5">
       <ellipse cx="60" cy="22" rx="8" ry="16"/>
       <ellipse cx="60" cy="98" rx="8" ry="16"/>
       <ellipse cx="22" cy="60" rx="16" ry="8"/>
       <ellipse cx="98" cy="60" rx="16" ry="8"/>
       <ellipse cx="33" cy="33" rx="8" ry="16" transform="rotate(-45 33 33)"/>
       <ellipse cx="87" cy="33" rx="8" ry="16" transform="rotate(45 87 33)"/>
       <ellipse cx="33" cy="87" rx="8" ry="16" transform="rotate(45 33 87)"/>
       <ellipse cx="87" cy="87" rx="8" ry="16" transform="rotate(-45 87 87)"/>
     </g>
     <circle cx="60" cy="60" r="22" fill="#78350f" stroke="#451a03" stroke-width="3.5"/>`
  ),

  // Objects & School/Office
  makeSticker(
    'stk-book-stack',
    'Book Stack',
    'school-office',
    `<rect x="20" y="74" width="80" height="22" rx="4" fill="#1d4ed8" stroke="#1e3a8a" stroke-width="3.5"/>
     <rect x="28" y="50" width="68" height="22" rx="4" fill="#059669" stroke="#065f46" stroke-width="3.5"/>
     <rect x="24" y="26" width="72" height="22" rx="4" fill="#e11d48" stroke="#881337" stroke-width="3.5"/>
     <line x1="34" y1="37" x2="82" y2="37" stroke="#ffffff" stroke-width="3" opacity="0.6"/>
     <line x1="38" y1="61" x2="82" y2="61" stroke="#ffffff" stroke-width="3" opacity="0.6"/>`,
    ['graduation-honors']
  ),
  makeSticker(
    'stk-gold-seal',
    'Gold Seal Ribbon',
    'school-office',
    `<polygon points="44,68 34,108 50,98 60,108 60,68" fill="#dc2626"/>
     <polygon points="76,68 86,108 70,98 60,108 60,68" fill="#ef4444"/>
     <circle cx="60" cy="48" r="30" fill="#f59e0b" stroke="#b45309" stroke-width="4"/>
     <circle cx="60" cy="48" r="21" fill="#fde047" stroke="#ca8a04" stroke-width="2.5"/>
     <polygon points="60,34 64,43 74,43 66,49 69,58 60,52 51,58 54,49 46,43 56,43" fill="#b45309"/>`,
    ['graduation-honors']
  ),
  makeSticker(
    'stk-laptop',
    'Studio Laptop',
    'objects',
    `<rect x="22" y="26" width="76" height="52" rx="6" fill="#1e293b" stroke="#0f172a" stroke-width="4"/>
     <rect x="28" y="32" width="64" height="40" rx="2" fill="#38bdf8"/>
     <polygon points="14,78 106,78 98,94 22,94" fill="#cbd5e1" stroke="#475569" stroke-width="3.5" stroke-linejoin="round"/>`
  ),
  makeSticker(
    'stk-coffee-mug',
    'Coffee Mug',
    'objects',
    `<path d="M26 44 H80 V84 C80 96 70 102 53 102 C36 102 26 96 26 84 Z" fill="#ffffff" stroke="#334155" stroke-width="4"/>
     <path d="M80 52 H92 C98 52 98 76 80 76" fill="none" stroke="#334155" stroke-width="4"/>
     <path d="M42 26 Q48 18 42 12" fill="none" stroke="#94a3b8" stroke-width="3.5" stroke-linecap="round"/>
     <path d="M60 28 Q66 20 60 14" fill="none" stroke="#94a3b8" stroke-width="3.5" stroke-linecap="round"/>`,
    ['cozy-scrapbook']
  ),
  makeSticker(
    'stk-megaphone',
    'Promo Megaphone',
    'objects',
    `<polygon points="24,52 88,24 88,92 24,68" fill="#f43f5e" stroke="#881337" stroke-width="4" stroke-linejoin="round"/>
     <rect x="16" y="48" width="14" height="24" rx="4" fill="#1e293b"/>
     <rect x="36" y="72" width="12" height="24" rx="4" fill="#334155"/>
     <circle cx="92" cy="58" r="10" fill="#fde047" stroke="#ca8a04" stroke-width="3"/>`
  ),
  makeSticker(
    'stk-palette',
    'Paint Palette',
    'objects',
    `<path d="M60 20 C30 20 18 44 22 68 C26 88 44 98 62 96 C74 95 74 82 68 76 C64 72 72 64 84 68 C96 72 104 60 100 44 C94 28 78 20 60 20 Z" fill="#fef3c7" stroke="#92400e" stroke-width="4"/>
     <circle cx="44" cy="42" r="6" fill="#ef4444"/>
     <circle cx="64" cy="36" r="6" fill="#3b82f6"/>
     <circle cx="80" cy="48" r="6" fill="#10b981"/>
     <circle cx="42" cy="64" r="6" fill="#f59e0b"/>`
  ),
  // Certificates (seals and K-3 award stickers — hand-drawn PNGs in public/assets/certificates)
  makeRasterSticker(
    'cert-seal-gold-foil',
    'Gold Foil Seal',
    'certificates',
    './assets/certificates/cert-seal-gold-foil.png'
  ),
  makeRasterSticker(
    'cert-seal-torch-laurel',
    'Torch & Laurel Seal',
    'certificates',
    './assets/certificates/cert-seal-torch-laurel.png'
  ),
  makeRasterSticker(
    'cert-stk-k3-gold-star',
    'Smiling Star Medal',
    'certificates',
    './assets/certificates/cert-stk-k3-gold-star.png'
  ),
  makeRasterSticker(
    'cert-stk-perfect-attendance',
    'Perfect Attendance',
    'certificates',
    './assets/certificates/cert-stk-perfect-attendance.png'
  ),
  makeRasterSticker(
    'cert-stk-values-heart',
    'Values Heart',
    'certificates',
    './assets/certificates/cert-stk-values-heart.png'
  ),
];

export function getStickerById(id: string): StickerDef | undefined {
  return STICKER_CATALOG.find((s) => s.id === id);
}
