export interface TableTheme {
  id: string;
  name: string;
  headerBg: string;
  headerColor: string;
  cellBg: string;
  altRowBg: string;
  cellColor: string;
  borderColor: string;
  borderWidth: number;
}

export const TABLE_THEMES: TableTheme[] = [
  {
    id: 'emerald-office',
    name: 'Emerald Office',
    headerBg: '#0f6b4e',
    headerColor: '#ffffff',
    cellBg: '#ffffff',
    altRowBg: '#ecfdf5',
    cellColor: '#1e293b',
    borderColor: '#a7f3d0',
    borderWidth: 1,
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    headerBg: '#0369a1',
    headerColor: '#ffffff',
    cellBg: '#ffffff',
    altRowBg: '#f0f9ff',
    cellColor: '#0f172a',
    borderColor: '#bae6fd',
    borderWidth: 1,
  },
  {
    id: 'midnight-slate',
    name: 'Midnight Slate',
    headerBg: '#1e293b',
    headerColor: '#ffffff',
    cellBg: '#ffffff',
    altRowBg: '#f1f5f9',
    cellColor: '#1e293b',
    borderColor: '#cbd5e1',
    borderWidth: 1,
  },
  {
    id: 'warm-terracotta',
    name: 'Warm Terracotta',
    headerBg: '#c2410c',
    headerColor: '#ffffff',
    cellBg: '#ffffff',
    altRowBg: '#fff7ed',
    cellColor: '#292524',
    borderColor: '#fed7aa',
    borderWidth: 1,
  },
  {
    id: 'royal-plum',
    name: 'Royal Plum',
    headerBg: '#701a75',
    headerColor: '#ffffff',
    cellBg: '#ffffff',
    altRowBg: '#fdf4ff',
    cellColor: '#18181b',
    borderColor: '#f5d0fe',
    borderWidth: 1,
  },
  {
    id: 'gold-heritage',
    name: 'Gold Heritage',
    headerBg: '#b45309',
    headerColor: '#ffffff',
    cellBg: '#fffdfa',
    altRowBg: '#fef3c7',
    cellColor: '#451a03',
    borderColor: '#fde68a',
    borderWidth: 1,
  },
  {
    id: 'minimal-light',
    name: 'Minimal Light',
    headerBg: '#f1f5f9',
    headerColor: '#0f172a',
    cellBg: '#ffffff',
    altRowBg: '#f8fafc',
    cellColor: '#334155',
    borderColor: '#e2e8f0',
    borderWidth: 1,
  },
  {
    id: 'dark-studio',
    name: 'Dark Studio',
    headerBg: '#059669',
    headerColor: '#ffffff',
    cellBg: '#0f172a',
    altRowBg: '#1e293b',
    cellColor: '#f8fafc',
    borderColor: '#334155',
    borderWidth: 1,
  },
];
