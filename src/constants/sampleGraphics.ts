export type StockCategory = 'Nature' | 'Abstract' | 'Business' | 'Badges' | 'Lifestyle';

export interface SampleGraphic {
  id: string;
  name: string;
  category: StockCategory;
  src: string;
}

const encodeSvg = (svg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;

export const SAMPLE_GRAPHICS: SampleGraphic[] = [
  // Nature & Landscapes
  {
    id: 'sunset-peaks',
    name: 'Alpine Sunset',
    category: 'Nature',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="45%" stop-color="#be185d"/>
            <stop offset="85%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#fde047"/>
          </linearGradient>
        </defs>
        <rect width="800" height="550" fill="url(#sky)"/>
        <circle cx="560" cy="240" r="85" fill="#fef08a" opacity="0.9"/>
        <path d="M0 400 L190 220 L360 360 L540 180 L800 390 L800 550 L0 550 Z" fill="#1e1b4b"/>
        <path d="M0 440 L140 310 L310 420 L480 270 L680 410 L800 350 L800 550 L0 550 Z" fill="#0f172a"/>
      </svg>
    `),
  },
  {
    id: 'ocean-waves',
    name: 'Emerald Waves',
    category: 'Nature',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#064e3b"/>
            <stop offset="50%" stop-color="#0d9488"/>
            <stop offset="100%" stop-color="#38bdf8"/>
          </linearGradient>
        </defs>
        <rect width="800" height="550" fill="url(#bg)"/>
        <path d="M0 280 Q 200 180 400 280 T 800 260 L 800 550 L 0 550 Z" fill="#ffffff" opacity="0.18"/>
        <path d="M0 340 Q 220 250 440 340 T 800 320 L 800 550 L 0 550 Z" fill="#ffffff" opacity="0.22"/>
        <path d="M0 410 Q 240 330 480 410 T 800 390 L 800 550 L 0 550 Z" fill="#ffffff" opacity="0.28"/>
        <circle cx="180" cy="140" r="55" fill="#fde68a" opacity="0.85"/>
      </svg>
    `),
  },
  {
    id: 'forest-pines',
    name: 'Pine Forest',
    category: 'Nature',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550">
        <defs>
          <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ecfdf5"/>
            <stop offset="100%" stop-color="#a7f3d0"/>
          </linearGradient>
        </defs>
        <rect width="800" height="550" fill="url(#mist)"/>
        <circle cx="620" cy="130" r="50" fill="#ffffff" opacity="0.9"/>
        <path d="M80 550 L160 260 L240 550 Z" fill="#065f46"/>
        <path d="M210 550 L310 190 L410 550 Z" fill="#047857"/>
        <path d="M360 550 L450 280 L540 550 Z" fill="#064e3b"/>
        <path d="M490 550 L600 210 L710 550 Z" fill="#059669"/>
        <path d="M630 550 L720 300 L800 550 Z" fill="#065f46"/>
      </svg>
    `),
  },
  {
    id: 'golden-desert',
    name: 'Golden Dunes',
    category: 'Nature',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550">
        <defs>
          <linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#fb923c"/>
            <stop offset="100%" stop-color="#fef3c7"/>
          </linearGradient>
        </defs>
        <rect width="800" height="550" fill="url(#dsky)"/>
        <circle cx="240" cy="180" r="70" fill="#fffbeb"/>
        <path d="M0 360 Q 260 260 520 360 T 800 340 L 800 550 L 0 550 Z" fill="#d97706"/>
        <path d="M0 430 Q 220 350 480 440 T 800 410 L 800 550 L 0 550 Z" fill="#b45309"/>
      </svg>
    `),
  },
  {
    id: 'starry-night',
    name: 'Starry Cosmos',
    category: 'Nature',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550">
        <defs>
          <linearGradient id="night" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#020617"/>
            <stop offset="60%" stop-color="#1e1b4b"/>
            <stop offset="100%" stop-color="#312e81"/>
          </linearGradient>
        </defs>
        <rect width="800" height="550" fill="url(#night)"/>
        <circle cx="600" cy="140" r="55" fill="#fef08a"/>
        <circle cx="622" cy="126" r="50" fill="#1e1b4b"/>
        <g fill="#ffffff">
          <circle cx="120" cy="90" r="3"/><circle cx="240" cy="160" r="2"/>
          <circle cx="380" cy="80" r="3.5"/><circle cx="460" cy="210" r="2"/>
          <circle cx="150" cy="280" r="2.5"/><circle cx="700" cy="280" r="3"/>
          <circle cx="310" cy="310" r="2"/><circle cx="520" cy="95" r="2.5"/>
        </g>
        <path d="M0 440 Q 400 370 800 440 L 800 550 L 0 550 Z" fill="#0f172a"/>
      </svg>
    `),
  },

  // Abstract & Backgrounds
  {
    id: 'modern-geo',
    name: 'Bauhaus Geometry',
    category: 'Abstract',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550">
        <rect width="800" height="550" fill="#f8fafc"/>
        <rect x="60" y="60" width="320" height="430" rx="24" fill="#0f6b4e"/>
        <circle cx="540" cy="210" r="150" fill="#f59e0b"/>
        <polygon points="380,490 580,220 740,490" fill="#0369a1" opacity="0.88"/>
        <circle cx="220" cy="275" r="95" fill="#fef08a"/>
      </svg>
    `),
  },
  {
    id: 'tech-grid',
    name: 'Cyber Horizon',
    category: 'Abstract',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550">
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#312e81"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>
        <rect width="800" height="550" fill="url(#cg)"/>
        <circle cx="400" cy="240" r="140" fill="#ec4899" opacity="0.85"/>
        <rect x="0" y="290" width="800" height="260" fill="#020617" opacity="0.75"/>
        <g stroke="#38bdf8" stroke-width="2" opacity="0.55">
          <line x1="0" y1="320" x2="800" y2="320"/>
          <line x1="0" y1="360" x2="800" y2="360"/>
          <line x1="0" y1="410" x2="800" y2="410"/>
          <line x1="0" y1="470" x2="800" y2="470"/>
          <line x1="400" y1="290" x2="400" y2="550"/>
          <line x1="300" y1="290" x2="100" y2="550"/>
          <line x1="500" y1="290" x2="700" y2="550"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'pastel-mesh',
    name: 'Pastel Aura',
    category: 'Abstract',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550">
        <rect width="800" height="550" fill="#fdf2f8"/>
        <circle cx="180" cy="140" r="220" fill="#fbcfe8" opacity="0.7"/>
        <circle cx="620" cy="160" r="240" fill="#bae6fd" opacity="0.7"/>
        <circle cx="420" cy="420" r="230" fill="#bbf7d0" opacity="0.7"/>
      </svg>
    `),
  },
  {
    id: 'origami-poly',
    name: 'Origami Facets',
    category: 'Abstract',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550">
        <polygon points="0,0 420,0 260,280 0,220" fill="#0f766e"/>
        <polygon points="420,0 800,0 800,260 260,280" fill="#14b8a6"/>
        <polygon points="0,220 260,280 180,550 0,550" fill="#115e59"/>
        <polygon points="260,280 800,260 540,550 180,550" fill="#0d9488"/>
        <polygon points="800,260 800,550 540,550" fill="#042f2e"/>
      </svg>
    `),
  },
  {
    id: 'ribbon-flow',
    name: 'Silk Ribbon',
    category: 'Abstract',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550">
        <rect width="800" height="550" fill="#0f172a"/>
        <path d="M-50 420 C 180 120, 420 520, 850 140" stroke="#10b981" stroke-width="70" fill="none" opacity="0.75"/>
        <path d="M-50 460 C 220 180, 460 480, 850 200" stroke="#38bdf8" stroke-width="45" fill="none" opacity="0.65"/>
        <path d="M-50 380 C 160 80, 380 460, 850 90" stroke="#f59e0b" stroke-width="25" fill="none" opacity="0.8"/>
      </svg>
    `),
  },

  // Business & Tech
  {
    id: 'growth-chart',
    name: 'Growth Analytics',
    category: 'Business',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450">
        <rect width="600" height="450" rx="24" fill="#f8fafc"/>
        <rect x="80" y="260" width="70" height="120" rx="8" fill="#cbd5e1"/>
        <rect x="190" y="210" width="70" height="170" rx="8" fill="#94a3b8"/>
        <rect x="300" y="150" width="70" height="230" rx="8" fill="#10b981"/>
        <rect x="410" y="90" width="70" height="290" rx="8" fill="#047857"/>
        <path d="M90 220 L225 160 L335 110 L455 55" stroke="#f59e0b" stroke-width="10" stroke-linecap="round" fill="none"/>
        <polygon points="465,45 430,52 458,82" fill="#f59e0b"/>
      </svg>
    `),
  },
  {
    id: 'rocket-launch',
    name: 'Startup Rocket',
    category: 'Business',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#0f172a"/>
        <path d="M250 70 C310 140 310 260 280 340 L220 340 C190 260 190 140 250 70 Z" fill="#f8fafc"/>
        <circle cx="250" cy="195" r="32" fill="#0284c7" stroke="#bae6fd" stroke-width="6"/>
        <path d="M210 270 L160 345 L218 330 Z" fill="#ef4444"/>
        <path d="M290 270 L340 345 L282 330 Z" fill="#ef4444"/>
        <path d="M230 345 L250 430 L270 345 Z" fill="#f59e0b"/>
      </svg>
    `),
  },
  {
    id: 'lightbulb-idea',
    name: 'Bright Idea',
    category: 'Business',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#fffbeb"/>
        <circle cx="250" cy="205" r="105" fill="#fde047"/>
        <rect x="208" y="300" width="84" height="55" rx="12" fill="#64748b"/>
        <rect x="220" y="362" width="60" height="22" rx="10" fill="#475569"/>
        <g stroke="#f59e0b" stroke-width="10" stroke-linecap="round">
          <line x1="250" y1="50" x2="250" y2="80"/>
          <line x1="100" y1="205" x2="130" y2="205"/>
          <line x1="370" y1="205" x2="400" y2="205"/>
          <line x1="140" y1="95" x2="162" y2="117"/>
          <line x1="360" y1="95" x2="338" y2="117"/>
        </g>
      </svg>
    `),
  },
  {
    id: 'megaphone-promo',
    name: 'Promo Megaphone',
    category: 'Business',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#eff6ff"/>
        <polygon points="140,220 340,120 340,360 140,280" fill="#0369a1"/>
        <rect x="110" y="215" width="45" height="70" rx="10" fill="#1e293b"/>
        <rect x="155" y="280" width="32" height="85" rx="8" fill="#334155"/>
        <ellipse cx="340" cy="240" rx="18" ry="120" fill="#38bdf8"/>
        <path d="M385 180 L430 155 M395 240 L445 240 M385 300 L430 325" stroke="#f59e0b" stroke-width="12" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: 'global-network',
    name: 'Global Connect',
    category: 'Business',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#ecfdf5"/>
        <circle cx="250" cy="250" r="145" fill="#059669"/>
        <ellipse cx="250" cy="250" rx="70" ry="145" fill="none" stroke="#a7f3d0" stroke-width="6"/>
        <line x1="105" y1="250" x2="395" y2="250" stroke="#a7f3d0" stroke-width="6"/>
        <line x1="125" y1="180" x2="375" y2="180" stroke="#a7f3d0" stroke-width="5"/>
        <line x1="125" y1="320" x2="375" y2="320" stroke="#a7f3d0" stroke-width="5"/>
      </svg>
    `),
  },

  // Badges & Celebrations
  {
    id: 'gold-trophy',
    name: 'Award Trophy',
    category: 'Badges',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#fefce8"/>
        <path d="M160 110 H340 V210 C340 275 295 315 250 315 C205 315 160 275 160 210 Z" fill="#eab308"/>
        <path d="M160 135 H115 C115 195 145 220 175 220" fill="none" stroke="#ca8a04" stroke-width="16"/>
        <path d="M340 135 H385 C385 195 355 220 325 220" fill="none" stroke="#ca8a04" stroke-width="16"/>
        <rect x="232" y="310" width="36" height="65" fill="#ca8a04"/>
        <rect x="175" y="375" width="150" height="36" rx="8" fill="#854d0e"/>
      </svg>
    `),
  },
  {
    id: 'verified-seal',
    name: 'Quality Seal',
    category: 'Badges',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#ffffff"/>
        <circle cx="250" cy="250" r="160" fill="#0f6b4e"/>
        <circle cx="250" cy="250" r="130" fill="none" stroke="#a7f3d0" stroke-width="6" stroke-dasharray="14 10"/>
        <path d="M185 255 L230 300 L325 200" fill="none" stroke="#ffffff" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `),
  },
  {
    id: 'gift-box',
    name: 'Special Gift',
    category: 'Badges',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#fff1f2"/>
        <rect x="120" y="210" width="260" height="190" rx="14" fill="#e11d48"/>
        <rect x="105" y="165" width="290" height="55" rx="10" fill="#be123c"/>
        <rect x="230" y="165" width="40" height="235" fill="#fde047"/>
        <circle cx="215" cy="140" r="32" fill="none" stroke="#fde047" stroke-width="18"/>
        <circle cx="285" cy="140" r="32" fill="none" stroke="#fde047" stroke-width="18"/>
      </svg>
    `),
  },
  {
    id: 'party-confetti',
    name: 'Celebration',
    category: 'Badges',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#faf5ff"/>
        <polygon points="110,390 220,170 330,280" fill="#9333ea"/>
        <circle cx="340" cy="150" r="20" fill="#f59e0b"/>
        <circle cx="260" cy="100" r="14" fill="#ec4899"/>
        <circle cx="390" cy="240" r="16" fill="#06b6d4"/>
        <rect x="160" y="95" width="26" height="26" rx="5" fill="#10b981" transform="rotate(25 173 108)"/>
        <rect x="370" y="320" width="24" height="24" rx="5" fill="#f43f5e" transform="rotate(40 382 332)"/>
      </svg>
    `),
  },
  {
    id: 'coffee-cup',
    name: 'Cafe Special',
    category: 'Badges',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#fff7ed"/>
        <path d="M140 210 H330 V310 C330 365 290 395 235 395 C180 395 140 365 140 310 Z" fill="#78350f"/>
        <path d="M330 235 H365 C385 235 395 250 395 270 C395 290 385 305 365 305 H330" fill="none" stroke="#78350f" stroke-width="20"/>
        <rect x="115" y="395" width="240" height="20" rx="10" fill="#92400e"/>
        <path d="M195 165 Q 210 130 195 105 M240 165 Q 255 130 240 105 M285 165 Q 300 130 285 105" stroke="#d97706" stroke-width="10" stroke-linecap="round" fill="none"/>
      </svg>
    `),
  },

  // Additional Nature
  {
    id: 'autumn-leaves',
    name: 'Autumn Breeze',
    category: 'Nature',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550">
        <rect width="800" height="550" fill="#fff7ed"/>
        <circle cx="220" cy="180" r="110" fill="#fed7aa"/>
        <path d="M180 420 C 200 260, 320 180, 460 140 C 430 290, 340 390, 180 420 Z" fill="#ea580c"/>
        <path d="M380 440 C 410 300, 520 220, 650 190 C 620 330, 530 420, 380 440 Z" fill="#d97706"/>
        <path d="M150 450 L 460 140" stroke="#7c2d12" stroke-width="6" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: 'tropical-palm',
    name: 'Tropical Island',
    category: 'Nature',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550">
        <defs>
          <linearGradient id="trop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0ea5e9"/>
            <stop offset="100%" stop-color="#bae6fd"/>
          </linearGradient>
        </defs>
        <rect width="800" height="550" fill="url(#trop)"/>
        <circle cx="620" cy="130" r="65" fill="#fde047"/>
        <path d="M0 400 Q 400 360 800 400 L 800 550 L 0 550 Z" fill="#0284c7"/>
        <path d="M0 460 Q 300 420 620 550 L 0 550 Z" fill="#fde68a"/>
        <path d="M180 480 Q 210 320 250 180" stroke="#78350f" stroke-width="22" fill="none" stroke-linecap="round"/>
        <path d="M250 180 Q 150 140 90 210 M250 180 Q 200 90 140 100 M250 180 Q 330 110 390 170 M250 180 Q 350 200 390 260" stroke="#15803d" stroke-width="20" fill="none" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: 'snowy-peaks',
    name: 'Winter Frost',
    category: 'Nature',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550">
        <rect width="800" height="550" fill="#e0f2fe"/>
        <polygon points="40,550 260,170 480,550" fill="#64748b"/>
        <polygon points="260,170 190,290 250,270 310,300 330,290" fill="#ffffff"/>
        <polygon points="320,550 560,130 780,550" fill="#475569"/>
        <polygon points="560,130 485,260 545,240 605,275 635,260" fill="#ffffff"/>
      </svg>
    `),
  },

  // Additional Abstract
  {
    id: 'neon-gradient',
    name: 'Neon Aurora',
    category: 'Abstract',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550">
        <defs>
          <linearGradient id="neon" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#7c3aed"/>
            <stop offset="50%" stop-color="#db2777"/>
            <stop offset="100%" stop-color="#f97316"/>
          </linearGradient>
        </defs>
        <rect width="800" height="550" fill="url(#neon)"/>
        <circle cx="640" cy="120" r="170" fill="#ffffff" opacity="0.12"/>
        <circle cx="160" cy="430" r="210" fill="#000000" opacity="0.15"/>
      </svg>
    `),
  },
  {
    id: 'minimal-arch',
    name: 'Terracotta Arch',
    category: 'Abstract',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550">
        <rect width="800" height="550" fill="#fef3c7"/>
        <path d="M220 550 V 250 A 180 180 0 0 1 580 250 V 550 Z" fill="#c2410c"/>
        <circle cx="400" cy="240" r="75" fill="#fbbf24"/>
        <rect x="0" y="480" width="800" height="70" fill="#78350f"/>
      </svg>
    `),
  },
  {
    id: 'retro-halftone',
    name: 'Retro Sunburst',
    category: 'Abstract',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 550">
        <rect width="800" height="550" fill="#fef08a"/>
        <g fill="#f97316" opacity="0.85">
          <polygon points="400,275 0,0 160,0"/>
          <polygon points="400,275 320,0 480,0"/>
          <polygon points="400,275 640,0 800,0"/>
          <polygon points="400,275 800,140 800,310"/>
          <polygon points="400,275 800,430 680,550"/>
          <polygon points="400,275 480,550 320,550"/>
          <polygon points="400,275 140,550 0,430"/>
          <polygon points="400,275 0,310 0,140"/>
        </g>
        <circle cx="400" cy="275" r="95" fill="#dc2626"/>
      </svg>
    `),
  },

  // Additional Business
  {
    id: 'target-goal',
    name: 'Target Bullseye',
    category: 'Business',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#f8fafc"/>
        <circle cx="250" cy="250" r="165" fill="#ef4444"/>
        <circle cx="250" cy="250" r="115" fill="#ffffff"/>
        <circle cx="250" cy="250" r="65" fill="#ef4444"/>
        <circle cx="250" cy="250" r="22" fill="#fde047"/>
      </svg>
    `),
  },
  {
    id: 'briefcase-pro',
    name: 'Executive Case',
    category: 'Business',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#f1f5f9"/>
        <path d="M190 150 V 120 H 310 V 150" fill="none" stroke="#334155" stroke-width="18" stroke-linecap="round"/>
        <rect x="95" y="150" width="310" height="230" rx="22" fill="#1e293b"/>
        <rect x="95" y="150" width="310" height="95" rx="22" fill="#334155"/>
        <rect x="225" y="225" width="50" height="36" rx="8" fill="#f59e0b"/>
      </svg>
    `),
  },
  {
    id: 'calendar-event',
    name: 'Event Calendar',
    category: 'Business',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#ecfdf5"/>
        <rect x="95" y="110" width="310" height="290" rx="24" fill="#ffffff" stroke="#cbd5e1" stroke-width="6"/>
        <path d="M95 134 A 24 24 0 0 1 119 110 H 381 A 24 24 0 0 1 405 134 V 195 H 95 Z" fill="#0f6b4e"/>
        <rect x="155" y="80" width="22" height="55" rx="10" fill="#334155"/>
        <rect x="323" y="80" width="22" height="55" rx="10" fill="#334155"/>
        <rect x="145" y="235" width="55" height="45" rx="8" fill="#e2e8f0"/>
        <rect x="222" y="235" width="55" height="45" rx="8" fill="#10b981"/>
        <rect x="300" y="235" width="55" height="45" rx="8" fill="#e2e8f0"/>
        <rect x="145" y="305" width="55" height="45" rx="8" fill="#e2e8f0"/>
        <rect x="222" y="305" width="55" height="45" rx="8" fill="#e2e8f0"/>
        <rect x="300" y="305" width="55" height="45" rx="8" fill="#f59e0b"/>
      </svg>
    `),
  },

  // Additional Badges
  {
    id: 'sale-tag',
    name: 'Hot Sale Tag',
    category: 'Badges',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#fff1f2"/>
        <path d="M110 110 H 265 L 405 250 L 250 405 L 110 265 Z" fill="#e11d48"/>
        <circle cx="170" cy="170" r="22" fill="#fff1f2"/>
        <text x="245" y="275" font-family="Arial, sans-serif" font-weight="900" font-size="64" fill="#ffffff" text-anchor="middle" transform="rotate(-45 245 260)">SALE</text>
      </svg>
    `),
  },
  {
    id: 'ribbon-rosette',
    name: 'First Place Ribbon',
    category: 'Badges',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#eff6ff"/>
        <polygon points="185,260 140,430 215,390 250,440 250,260" fill="#1d4ed8"/>
        <polygon points="315,260 360,430 285,390 250,440 250,260" fill="#2563eb"/>
        <circle cx="250" cy="195" r="115" fill="#f59e0b"/>
        <circle cx="250" cy="195" r="88" fill="#fde047"/>
        <text x="250" y="218" font-family="Georgia, serif" font-weight="bold" font-size="76" fill="#92400e" text-anchor="middle">#1</text>
      </svg>
    `),
  },
  {
    id: 'five-stars',
    name: '5-Star Rating',
    category: 'Badges',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 220">
        <rect width="600" height="220" rx="24" fill="#0f172a"/>
        <g fill="#facc15" transform="translate(45, 55)">
          <polygon points="45,0 58,32 92,35 66,57 74,90 45,72 16,90 24,57 -2,35 32,32"/>
          <polygon transform="translate(105,0)" points="45,0 58,32 92,35 66,57 74,90 45,72 16,90 24,57 -2,35 32,32"/>
          <polygon transform="translate(210,0)" points="45,0 58,32 92,35 66,57 74,90 45,72 16,90 24,57 -2,35 32,32"/>
          <polygon transform="translate(315,0)" points="45,0 58,32 92,35 66,57 74,90 45,72 16,90 24,57 -2,35 32,32"/>
          <polygon transform="translate(420,0)" points="45,0 58,32 92,35 66,57 74,90 45,72 16,90 24,57 -2,35 32,32"/>
        </g>
      </svg>
    `),
  },

  // Lifestyle, Food & Events
  {
    id: 'birthday-cake',
    name: 'Party Cake',
    category: 'Lifestyle',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#fdf2f8"/>
        <rect x="115" y="270" width="270" height="125" rx="18" fill="#f472b6"/>
        <rect x="150" y="185" width="200" height="90" rx="14" fill="#fbcfe8"/>
        <rect x="238" y="110" width="24" height="75" rx="6" fill="#38bdf8"/>
        <path d="M250 65 Q 270 90 250 110 Q 230 90 250 65 Z" fill="#f59e0b"/>
        <rect x="90" y="395" width="320" height="22" rx="11" fill="#be185d"/>
      </svg>
    `),
  },
  {
    id: 'pizza-slice',
    name: 'Pizza Special',
    category: 'Lifestyle',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#fffbeb"/>
        <polygon points="250,410 105,130 395,130" fill="#facc15"/>
        <path d="M95 130 Q 250 95 405 130" stroke="#d97706" stroke-width="34" stroke-linecap="round" fill="none"/>
        <circle cx="220" cy="210" r="24" fill="#dc2626"/>
        <circle cx="285" cy="230" r="22" fill="#dc2626"/>
        <circle cx="250" cy="305" r="20" fill="#dc2626"/>
      </svg>
    `),
  },
  {
    id: 'ticket-pass',
    name: 'VIP Ticket',
    category: 'Lifestyle',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320">
        <rect width="600" height="320" rx="24" fill="#0f172a"/>
        <path d="M60 70 H 540 V 130 A 30 30 0 0 0 540 190 V 250 H 60 V 190 A 30 30 0 0 0 60 130 Z" fill="#f59e0b"/>
        <line x1="410" y1="80" x2="410" y2="240" stroke="#78350f" stroke-width="4" stroke-dasharray="10 8"/>
        <text x="235" y="178" font-family="Impact, sans-serif" font-size="64" fill="#451a03" text-anchor="middle">VIP PASS</text>
      </svg>
    `),
  },
  {
    id: 'music-note',
    name: 'Live Music',
    category: 'Lifestyle',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#312e81"/>
        <circle cx="170" cy="340" r="48" fill="#38bdf8"/>
        <circle cx="330" cy="310" r="48" fill="#ec4899"/>
        <path d="M206 340 V 135 L 366 105 V 310" fill="none" stroke="#ffffff" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `),
  },
  {
    id: 'camera-lens',
    name: 'Photo Studio',
    category: 'Lifestyle',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#f1f5f9"/>
        <path d="M180 140 L 210 105 H 290 L 320 140 Z" fill="#334155"/>
        <rect x="85" y="140" width="330" height="235" rx="28" fill="#1e293b"/>
        <circle cx="250" cy="258" r="78" fill="#0f172a" stroke="#94a3b8" stroke-width="12"/>
        <circle cx="250" cy="258" r="45" fill="#0284c7"/>
        <circle cx="232" cy="240" r="14" fill="#ffffff" opacity="0.6"/>
        <circle cx="365" cy="180" r="12" fill="#f59e0b"/>
      </svg>
    `),
  },
  {
    id: 'grad-cap',
    name: 'Graduation',
    category: 'Lifestyle',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#eff6ff"/>
        <polygon points="250,120 430,205 250,290 70,205" fill="#1e293b"/>
        <path d="M145 245 V 325 C 145 355 355 355 355 325 V 245" fill="#334155"/>
        <line x1="395" y1="220" x2="395" y2="335" stroke="#f59e0b" stroke-width="10"/>
        <circle cx="395" cy="340" r="16" fill="#f59e0b"/>
      </svg>
    `),
  },
  {
    id: 'open-book',
    name: 'Knowledge Book',
    category: 'Lifestyle',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#ecfdf5"/>
        <path d="M80 140 Q 165 110 250 155 Q 335 110 420 140 V 360 Q 335 330 250 375 Q 165 330 80 360 Z" fill="#ffffff" stroke="#0f6b4e" stroke-width="14" stroke-linejoin="round"/>
        <line x1="250" y1="155" x2="250" y2="375" stroke="#0f6b4e" stroke-width="10"/>
      </svg>
    `),
  },
  {
    id: 'heart-love',
    name: 'Greeting Heart',
    category: 'Lifestyle',
    src: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
        <rect width="500" height="500" rx="28" fill="#fff1f2"/>
        <path d="M250 400 C 120 310, 75 230, 75 170 C 75 110, 125 80, 175 80 C 215 80, 240 105, 250 130 C 260 105, 285 80, 325 80 C 375 80, 425 110, 425 170 C 425 230, 380 310, 250 400 Z" fill="#e11d48"/>
      </svg>
    `),
  },
];
