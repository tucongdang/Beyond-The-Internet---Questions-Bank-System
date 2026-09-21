import React from 'react';

export interface TagColorScheme {
  id: string;
  name: string;
  bgClass: string;
  activeClass: string;
  borderClass: string;
  textClass: string;
  dotBg: string;
  badgeStyle: string;
  badgeActiveStyle: string;
  hex: string;
}

export const TAG_COLOR_SCHEMES: Record<string, TagColorScheme> = {
  purple: {
    id: 'purple',
    name: 'Tím Thạch Anh',
    bgClass: 'bg-purple-500/15',
    activeClass: 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-400/50 shadow-purple-900/40 font-bold',
    borderClass: 'border-purple-500/30',
    textClass: 'text-purple-300',
    dotBg: 'bg-purple-400',
    badgeStyle: 'bg-purple-500/15 text-purple-200 border-purple-500/30 hover:bg-purple-500/25',
    badgeActiveStyle: 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/30 font-bold',
    hex: '#c084fc'
  },
  indigo: {
    id: 'indigo',
    name: 'Xanh Chàm',
    bgClass: 'bg-indigo-500/15',
    activeClass: 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-400/50 shadow-indigo-900/40 font-bold',
    borderClass: 'border-indigo-500/30',
    textClass: 'text-indigo-300',
    dotBg: 'bg-indigo-400',
    badgeStyle: 'bg-indigo-500/15 text-indigo-200 border-indigo-500/30 hover:bg-indigo-500/25',
    badgeActiveStyle: 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/30 font-bold',
    hex: '#818cf8'
  },
  emerald: {
    id: 'emerald',
    name: 'Xanh Ngọc',
    bgClass: 'bg-emerald-500/15',
    activeClass: 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/50 shadow-emerald-900/40 font-bold',
    borderClass: 'border-emerald-500/30',
    textClass: 'text-emerald-300',
    dotBg: 'bg-emerald-400',
    badgeStyle: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/25',
    badgeActiveStyle: 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-500/30 font-bold',
    hex: '#34d399'
  },
  rose: {
    id: 'rose',
    name: 'Hồng Đào',
    bgClass: 'bg-rose-500/15',
    activeClass: 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-400/50 shadow-rose-900/40 font-bold',
    borderClass: 'border-rose-500/30',
    textClass: 'text-rose-300',
    dotBg: 'bg-rose-400',
    badgeStyle: 'bg-rose-500/15 text-rose-200 border-rose-500/30 hover:bg-rose-500/25',
    badgeActiveStyle: 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-500/30 font-bold',
    hex: '#fb7185'
  },
  amber: {
    id: 'amber',
    name: 'Hổ Phách',
    bgClass: 'bg-amber-500/15',
    activeClass: 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-300/50 shadow-amber-900/40 font-bold',
    borderClass: 'border-amber-500/30',
    textClass: 'text-amber-300',
    dotBg: 'bg-amber-400',
    badgeStyle: 'bg-amber-500/15 text-amber-200 border-amber-500/30 hover:bg-amber-500/25',
    badgeActiveStyle: 'bg-amber-500 text-slate-950 border-amber-300 font-bold shadow-md shadow-amber-500/30',
    hex: '#fbbf24'
  },
  cyan: {
    id: 'cyan',
    name: 'Xanh Biển',
    bgClass: 'bg-cyan-500/15',
    activeClass: 'bg-cyan-600 text-white border-cyan-400 ring-2 ring-cyan-400/50 shadow-cyan-900/40 font-bold',
    borderClass: 'border-cyan-500/30',
    textClass: 'text-cyan-300',
    dotBg: 'bg-cyan-400',
    badgeStyle: 'bg-cyan-500/15 text-cyan-200 border-cyan-500/30 hover:bg-cyan-500/25',
    badgeActiveStyle: 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-500/30 font-bold',
    hex: '#22d3ee'
  },
  sky: {
    id: 'sky',
    name: 'Xanh Da Trời',
    bgClass: 'bg-sky-500/15',
    activeClass: 'bg-sky-600 text-white border-sky-400 ring-2 ring-sky-400/50 shadow-sky-900/40 font-bold',
    borderClass: 'border-sky-500/30',
    textClass: 'text-sky-300',
    dotBg: 'bg-sky-400',
    badgeStyle: 'bg-sky-500/15 text-sky-200 border-sky-500/30 hover:bg-sky-500/25',
    badgeActiveStyle: 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-500/30 font-bold',
    hex: '#38bdf8'
  },
  fuchsia: {
    id: 'fuchsia',
    name: 'Tím Sen',
    bgClass: 'bg-fuchsia-500/15',
    activeClass: 'bg-fuchsia-600 text-white border-fuchsia-400 ring-2 ring-fuchsia-400/50 shadow-fuchsia-900/40 font-bold',
    borderClass: 'border-fuchsia-500/30',
    textClass: 'text-fuchsia-300',
    dotBg: 'bg-fuchsia-400',
    badgeStyle: 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/30 hover:bg-fuchsia-500/25',
    badgeActiveStyle: 'bg-fuchsia-600 text-white border-fuchsia-400 shadow-md shadow-fuchsia-500/30 font-bold',
    hex: '#e879f9'
  }
};

const STORAGE_KEY_TAG_COLORS = 'bti_qb_tag_color_map';

/** Get tag color mappings from localStorage */
export function getTagColorMap(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TAG_COLORS);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

/** Save color for a specific tag */
export function setTagColor(tagName: string, colorId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const map = getTagColorMap();
    map[tagName] = colorId;
    localStorage.setItem(STORAGE_KEY_TAG_COLORS, JSON.stringify(map));
  } catch {}
}

/** Deterministically assigns a color scheme to a tag name if no custom color is specified */
export function getTagColorScheme(tagName: string, customColorId?: string): TagColorScheme {
  const map = getTagColorMap();
  const effectiveColorId = customColorId || map[tagName];
  if (effectiveColorId && TAG_COLOR_SCHEMES[effectiveColorId]) {
    return TAG_COLOR_SCHEMES[effectiveColorId];
  }
  const keys = Object.keys(TAG_COLOR_SCHEMES);
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % keys.length;
  return TAG_COLOR_SCHEMES[keys[index]];
}
