export type AccentTheme = 'rose' | 'purple' | 'midnight' | 'high_contrast' | 'color_blind';

export const THEMES = {
  rose: {
    name: 'BTI Rose',
    color: '#F7CAC9',
    rgb: '247, 202, 201'
  },
  purple: {
    name: 'BTI Purple',
    color: '#C084FC',
    rgb: '192, 132, 252'
  },
  midnight: {
    name: 'Midnight',
    color: '#93C5FD',
    rgb: '147, 197, 253'
  },
  high_contrast: {
    name: 'Tương phản cao',
    color: '#FACC15',
    rgb: '250, 204, 21'
  },
  color_blind: {
    name: 'Mù màu (Cyan)',
    color: '#22D3EE',
    rgb: '34, 211, 238'
  }
};

export function getAccentTheme(): AccentTheme {
  try {
    return (localStorage.getItem('bti_accent_theme') as AccentTheme) || 'rose';
  } catch {
    return 'rose';
  }
}

export function setAccentTheme(theme: AccentTheme) {
  try {
    localStorage.setItem('bti_accent_theme', theme);
    applyTheme(theme);
    window.dispatchEvent(new Event('themechange'));
  } catch {}
}

export function applyTheme(theme: AccentTheme) {
  const t = THEMES[theme] || THEMES.rose;
  document.documentElement.style.setProperty('--bti-accent', t.color);
  document.documentElement.style.setProperty('--bti-accent-rgb', t.rgb);
}

export function initTheme() {
  applyTheme(getAccentTheme());
}

export function getWorkspaceHighContrast(): boolean {
  try {
    return localStorage.getItem('bti_workspace_hc') === 'true';
  } catch {
    return false;
  }
}

export function setWorkspaceHighContrast(hc: boolean) {
  try {
    localStorage.setItem('bti_workspace_hc', String(hc));
    window.dispatchEvent(new Event('wshc_change'));
  } catch {}
}
