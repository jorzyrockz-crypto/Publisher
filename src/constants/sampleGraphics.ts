export interface SampleGraphic {
  id: string;
  name: string;
  src: string;
}

const encodeSvg = (svg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;

export const SAMPLE_GRAPHICS: SampleGraphic[] = [
  {
    id: 'sunset-peaks',
    name: 'Alpine Sunset',
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
    id: 'modern-geo',
    name: 'Bauhaus Geometry',
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
];
