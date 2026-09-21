export interface ProjectorThemeConfig {
  id: string;
  name: string;
  description: string;
  badgeBg: string;
  previewGradient: string;
  bgGradient: string;
  glow1: string;
  glow2: string;
  headerIconBg: string;
  headerIconText: string;
  accentText: string;
  accentBorder: string;
  accentBg: string;
  cardBg: string;
  cardBorder: string;
  activeBadge: string;
  lockedBadge: string;
  revealBadge: string;
  optionNormalBg: string;
  optionNormalBorder: string;
  optionCorrectBg: string;
  optionCorrectBorder: string;
  progressGradient: string;
}

export const PROJECTOR_THEMES: Record<string, ProjectorThemeConfig> = {
  default: {
    id: 'default',
    name: 'Mặc Định',
    description: 'Chủ đề chính (#190839 & #F7CAC9)',
    badgeBg: 'bg-theme-accent',
    previewGradient: 'from-[#190839] to-theme-accent/20',
    bgGradient: 'bg-transparent',
    glow1: 'bg-theme-accent/10',
    glow2: 'bg-theme-accent/10',
    headerIconBg: 'bg-theme-accent/20 shadow-theme-accent/30',
    headerIconText: 'text-theme-accent',
    accentText: 'text-theme-accent',
    accentBorder: 'border-[#3E1D74]',
    accentBg: 'bg-[#241148]',
    cardBg: 'bg-[#241148]/70 backdrop-blur-md',
    cardBorder: 'border-[#3E1D74]',
    activeBadge: 'bg-theme-accent/20 text-theme-accent border border-theme-accent/40',
    lockedBadge: 'bg-[#0D0420]/50 text-[#B6A6D8]/50 border border-[#3E1D74]/30',
    revealBadge: 'bg-[#FCEEEC]/20 text-theme-accent border border-theme-accent/40',
    optionNormalBg: 'bg-[#0D0420]/40',
    optionNormalBorder: 'border-[#3E1D74]/60',
    optionCorrectBg: 'bg-theme-accent/20',
    optionCorrectBorder: 'border-theme-accent ring-2 ring-[#FCEEEC]/30',
    progressGradient: 'from-theme-accent/60 to-theme-accent',
  }
};

export const getProjectorTheme = (themeId?: string): ProjectorThemeConfig => {
  return PROJECTOR_THEMES.default;
};
