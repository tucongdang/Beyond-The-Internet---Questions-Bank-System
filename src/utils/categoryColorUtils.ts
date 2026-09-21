export interface CategoryColorScheme {
  id: string;
  name: string;
  hex: string;
  badgeStyle: string;
  borderStyle: string;
  pillBg: string;
}

export const CATEGORY_COLOR_SCHEMES: Record<string, CategoryColorScheme> = {
  purple: {
    id: 'purple',
    name: 'Tím Hoàng Gia (Purple)',
    hex: '#a855f7',
    badgeStyle: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    borderStyle: 'border-purple-500/40',
    pillBg: 'bg-purple-950/60 text-purple-300'
  },
  emerald: {
    id: 'emerald',
    name: 'Xanh Ngọc Lục Bảo (Emerald)',
    hex: '#10b981',
    badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    borderStyle: 'border-emerald-500/40',
    pillBg: 'bg-emerald-950/60 text-emerald-300'
  },
  sky: {
    id: 'sky',
    name: 'Xanh Da Trời (Sky Blue)',
    hex: '#0ea5e9',
    badgeStyle: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    borderStyle: 'border-sky-500/40',
    pillBg: 'bg-sky-950/60 text-sky-300'
  },
  amber: {
    id: 'amber',
    name: 'Vàng Hổ Phách (Amber)',
    hex: '#f59e0b',
    badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    borderStyle: 'border-amber-500/40',
    pillBg: 'bg-amber-950/60 text-amber-300'
  },
  rose: {
    id: 'rose',
    name: 'Hồng Ngọc (Rose)',
    hex: '#f43f5e',
    badgeStyle: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    borderStyle: 'border-rose-500/40',
    pillBg: 'bg-rose-950/60 text-rose-300'
  },
  indigo: {
    id: 'indigo',
    name: 'Chàm Đêm (Indigo)',
    hex: '#6366f1',
    badgeStyle: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    borderStyle: 'border-indigo-500/40',
    pillBg: 'bg-indigo-950/60 text-indigo-300'
  },
  teal: {
    id: 'teal',
    name: 'Xanh Chanh Mint (Teal)',
    hex: '#14b8a6',
    badgeStyle: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    borderStyle: 'border-teal-500/40',
    pillBg: 'bg-teal-950/60 text-teal-300'
  },
  cyan: {
    id: 'cyan',
    name: 'Xanh Cyan Công Nghệ',
    hex: '#06b6d4',
    badgeStyle: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    borderStyle: 'border-cyan-500/40',
    pillBg: 'bg-cyan-950/60 text-cyan-300'
  }
};

const CATEGORY_COLOR_STORAGE_KEY = 'bti2026_category_colors_v1';

export function getCategoryColorsMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(CATEGORY_COLOR_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function setCategoryColor(categoryName: string, colorId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const map = getCategoryColorsMap();
    map[categoryName] = colorId;
    localStorage.setItem(CATEGORY_COLOR_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving category color:', e);
  }
}

// Generate consistent fallback color based on string hash if no color mapped
export function getCategoryColorScheme(categoryName: string, customColorId?: string): CategoryColorScheme {
  if (!categoryName) return CATEGORY_COLOR_SCHEMES.purple;

  const colorMap = getCategoryColorsMap();
  const colorId = customColorId || colorMap[categoryName];

  if (colorId && CATEGORY_COLOR_SCHEMES[colorId]) {
    return CATEGORY_COLOR_SCHEMES[colorId];
  }

  // Pre-mapped keyword matching
  const nameLower = categoryName.toLowerCase();
  if (nameLower.includes('logic') || nameLower.includes('tư duy')) {
    return CATEGORY_COLOR_SCHEMES.sky;
  }
  if (nameLower.includes('math') || nameLower.includes('toán')) {
    return CATEGORY_COLOR_SCHEMES.indigo;
  }
  if (nameLower.includes('trivia') || nameLower.includes('đố vui')) {
    return CATEGORY_COLOR_SCHEMES.amber;
  }
  if (nameLower.includes('ai') || nameLower.includes('trí tuệ')) {
    return CATEGORY_COLOR_SCHEMES.purple;
  }
  if (nameLower.includes('an toàn') || nameLower.includes('bảo vệ')) {
    return CATEGORY_COLOR_SCHEMES.rose;
  }
  if (nameLower.includes('dữ liệu') || nameLower.includes('khai thác')) {
    return CATEGORY_COLOR_SCHEMES.emerald;
  }

  // Hash string algorithm
  const keys = Object.keys(CATEGORY_COLOR_SCHEMES);
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % keys.length;
  return CATEGORY_COLOR_SCHEMES[keys[index]] || CATEGORY_COLOR_SCHEMES.purple;
}
