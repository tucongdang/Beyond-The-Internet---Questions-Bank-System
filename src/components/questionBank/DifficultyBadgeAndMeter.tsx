import React from 'react';
import { 
  Sparkles, 
  Target, 
  Zap, 
  Flame, 
  Crown,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import { CognitiveLevel, QuestionItem } from '../../types';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap } from '../../utils/hapticUtils';

export interface DifficultyConfig {
  key: CognitiveLevel;
  tier: number; // 1 to 4
  percentage: number; // 25, 50, 75, 100
  label: string;
  vietnameseLabel: string;
  taxonomyRange: string;
  difficultyName: string;
  description: string;
  verbs: string;
  color: string;
  textColor: string;
  bgBadge: string;
  borderBadge: string;
  glowColor: string;
  barColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const DIFFICULTY_CONFIGS: Record<CognitiveLevel, DifficultyConfig> = {
  NHAN_BIET: {
    key: 'NHAN_BIET',
    tier: 1,
    percentage: 25,
    label: 'Nhận biết',
    vietnameseLabel: 'Bậc 1-2 (Cơ bản)',
    taxonomyRange: 'Bậc 1 - 2',
    difficultyName: 'Dễ',
    description: 'Nhớ lại, nhận diện thông tin, định nghĩa, thuật ngữ và thao tác cơ bản.',
    verbs: 'Liệt kê, nhận diện, chỉ ra, nhắc lại, chọn đúng',
    color: '#38bdf8', // sky-400
    textColor: 'text-sky-300',
    bgBadge: 'bg-sky-500/15',
    borderBadge: 'border-sky-500/35',
    glowColor: 'shadow-sky-500/20',
    barColor: 'bg-sky-400',
    icon: Target
  },
  THONG_HIEU: {
    key: 'THONG_HIEU',
    tier: 2,
    percentage: 50,
    label: 'Thông hiểu',
    vietnameseLabel: 'Bậc 3-4 (Trung cấp)',
    taxonomyRange: 'Bậc 3 - 4',
    difficultyName: 'Trung bình',
    description: 'Hiểu bản chất, giải thích quy trình, so sánh và phân loại nội dung số.',
    verbs: 'Giải thích, mô tả, phân loại, minh họa, so sánh',
    color: '#34d399', // emerald-400
    textColor: 'text-emerald-300',
    bgBadge: 'bg-emerald-500/15',
    borderBadge: 'border-emerald-500/35',
    glowColor: 'shadow-emerald-500/20',
    barColor: 'bg-emerald-400',
    icon: Zap
  },
  VAN_DUNG: {
    key: 'VAN_DUNG',
    tier: 3,
    percentage: 75,
    label: 'Vận dụng',
    vietnameseLabel: 'Bậc 5-6 (Nâng cao)',
    taxonomyRange: 'Bậc 5 - 6',
    difficultyName: 'Khá',
    description: 'Áp dụng kiến thức, kỹ năng giải quyết tình huống thực tế và sự cố số.',
    verbs: 'Áp dụng, thực thi, xử lý sự cố, cấu hình, hướng dẫn',
    color: '#fbbf24', // amber-400
    textColor: 'text-amber-300',
    bgBadge: 'bg-amber-500/15',
    borderBadge: 'border-amber-500/35',
    glowColor: 'shadow-amber-500/20',
    barColor: 'bg-amber-400',
    icon: Flame
  },
  VAN_DUNG_CAO: {
    key: 'VAN_DUNG_CAO',
    tier: 4,
    percentage: 100,
    label: 'Vận dụng cao',
    vietnameseLabel: 'Bậc 7-8 (Chuyên sâu)',
    taxonomyRange: 'Bậc 7 - 8',
    difficultyName: 'Khó',
    description: 'Phân tích đa chiều, phản biện, đánh giá rủi ro an toàn số và kiến tạo giải pháp mới.',
    verbs: 'Đánh giá, phản biện, thiết kế giải pháp, kiến tạo, thẩm định',
    color: '#f43f5e', // rose-500
    textColor: 'text-rose-300',
    bgBadge: 'bg-rose-500/15',
    borderBadge: 'border-rose-500/35',
    glowColor: 'shadow-rose-500/20',
    barColor: 'bg-rose-500',
    icon: Crown
  }
};

export function getDifficultyConfig(level?: string | CognitiveLevel | null): DifficultyConfig {
  if (!level || !(level in DIFFICULTY_CONFIGS)) {
    return DIFFICULTY_CONFIGS.THONG_HIEU; // Default fallback
  }
  return DIFFICULTY_CONFIGS[level as CognitiveLevel];
}

interface DifficultyBadgeAndMeterProps {
  level?: string | CognitiveLevel | null;
  showMeter?: boolean;
  showTierRange?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
  tooltipText?: string;
}

/**
 * Visual badge and 4-segment progress meter component for Question Cards
 */
export const DifficultyBadgeAndMeter: React.FC<DifficultyBadgeAndMeterProps> = ({
  level,
  showMeter = true,
  showTierRange = true,
  size = 'sm',
  interactive = false,
  onClick,
  className = '',
  tooltipText
}) => {
  const config = getDifficultyConfig(level);
  const IconComponent = config.icon;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      vibrateTap();
      soundFx.playClick();
      onClick();
    }
  };

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1',
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3 py-1.5 gap-2.5'
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  }[size];

  const barHeights = {
    xs: 'h-1 w-2',
    sm: 'h-1.5 w-2.5',
    md: 'h-2 w-3.5',
    lg: 'h-2.5 w-4.5'
  }[size];

  return (
    <div
      onClick={handleClick}
      title={tooltipText || `Độ khó: ${config.label} (${config.taxonomyRange}) - ${config.difficultyName} [${config.percentage}%]. ${config.description}`}
      className={`inline-flex items-center rounded-[4px] border font-mono font-bold transition-all select-none ${config.bgBadge} ${config.borderBadge} ${config.textColor} ${sizeClasses} ${
        interactive ? 'cursor-pointer hover:scale-105 active:scale-95 hover:border-current shadow-sm' : ''
      } ${className}`}
    >
      {/* Icon */}
      <IconComponent className={`${iconSizes} shrink-0`} />

      {/* Label */}
      <span className="font-semibold whitespace-nowrap">
        {config.label}
      </span>

      {/* Optional Range (e.g. Bậc 1-2) */}
      {showTierRange && (
        <span className="opacity-75 text-[9px] font-mono hidden sm:inline">
          ({config.taxonomyRange})
        </span>
      )}

      {/* 4-Segment Visual Progress Bar Meter */}
      {showMeter && (
        <div 
          className="inline-flex items-center gap-0.5 bg-black/40 p-0.5 rounded-[2px] border border-white/10 shrink-0"
          title={`Tiến độ độ khó: ${config.tier}/4 bậc (${config.percentage}%)`}
        >
          {[1, 2, 3, 4].map(step => {
            const isFilled = step <= config.tier;
            return (
              <span
                key={step}
                className={`rounded-[1px] transition-all duration-300 ${barHeights} ${
                  isFilled 
                    ? `${config.barColor} shadow-[0_0_4px_currentColor]` 
                    : 'bg-white/15 opacity-40'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

interface DifficultyQuickToggleBarProps {
  filterLevel: string; // 'ALL' | CognitiveLevel
  onLevelChange: (level: string) => void;
  questions: QuestionItem[];
  className?: string;
}

/**
 * Dedicated Quick-Toggle Segmented Control for filtering questions by Difficulty
 */
export const DifficultyQuickToggleBar: React.FC<DifficultyQuickToggleBarProps> = ({
  filterLevel,
  onLevelChange,
  questions,
  className = ''
}) => {
  // Compute counts for each difficulty level
  const counts = React.useMemo(() => {
    const map: Record<string, number> = {
      ALL: questions.length,
      NHAN_BIET: 0,
      THONG_HIEU: 0,
      VAN_DUNG: 0,
      VAN_DUNG_CAO: 0
    };

    questions.forEach(q => {
      const lvl = q.cognitive_level || 'THONG_HIEU';
      if (lvl in map) {
        map[lvl]++;
      }
    });

    return map;
  }, [questions]);

  const handleToggle = (key: string) => {
    vibrateTap();
    soundFx.playClick();
    if (filterLevel === key && key !== 'ALL') {
      onLevelChange('ALL'); // Clicking active level toggles back to ALL
    } else {
      onLevelChange(key);
    }
  };

  const levels: CognitiveLevel[] = ['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'];

  return (
    <div className={`flex flex-wrap items-center gap-1.5 p-1.5 rounded-[5px] bg-[#14062E] border border-theme-accent/25 text-xs font-mono select-none ${className}`}>
      {/* Label Title */}
      <div className="flex items-center gap-1 text-[#B6A6D8] font-bold px-1.5 py-0.5 text-[11px] shrink-0">
        <Activity className="w-3.5 h-3.5 text-theme-accent" />
        <span className="hidden sm:inline">Mức độ nhận thức:</span>
        <span className="sm:hidden">Mức độ:</span>
      </div>

      {/* ALL Button */}
      <button
        type="button"
        id="btn-filter-difficulty-all"
        onClick={() => handleToggle('ALL')}
        className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
          filterLevel === 'ALL'
            ? 'bg-theme-accent text-[#190839] border-theme-accent shadow-md shadow-theme-accent/20 font-black'
            : 'bg-[#241148] text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
        }`}
      >
        <span>Tất cả</span>
        <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono ${
          filterLevel === 'ALL' ? 'bg-[#190839]/25 text-[#190839] font-black' : 'bg-white/10 text-white/70'
        }`}>
          {counts.ALL}
        </span>
      </button>

      {/* 4 Difficulty Level Buttons */}
      {levels.map(lvlKey => {
        const config = DIFFICULTY_CONFIGS[lvlKey];
        const isSelected = filterLevel === lvlKey;
        const IconComponent = config.icon;
        const count = counts[lvlKey] || 0;

        return (
          <button
            key={lvlKey}
            type="button"
            id={`btn-filter-difficulty-${lvlKey.toLowerCase()}`}
            onClick={() => handleToggle(lvlKey)}
            className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              isSelected
                ? `${config.bgBadge} ${config.textColor} ${config.borderBadge} ring-2 ring-current shadow-md ${config.glowColor}`
                : 'bg-[#241148] text-slate-300 border-white/10 hover:border-white/20 hover:text-white'
            }`}
            title={`Lọc: ${config.label} (${config.taxonomyRange}) - ${config.difficultyName}. ${count} câu hỏi`}
          >
            {/* Level Icon */}
            <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isSelected ? config.textColor : 'text-slate-400'}`} />

            {/* Name */}
            <span className={isSelected ? 'font-black' : 'font-medium'}>
              {config.label}
            </span>

            {/* 4-Segment Mini Meter */}
            <div className="hidden md:inline-flex items-center gap-0.5 bg-black/40 p-0.5 rounded-[2px] border border-white/10">
              {[1, 2, 3, 4].map(step => (
                <span
                  key={step}
                  className={`w-1.5 h-2 rounded-[0.5px] ${
                    step <= config.tier
                      ? `${config.barColor}`
                      : 'bg-white/15 opacity-30'
                  }`}
                />
              ))}
            </div>

            {/* Count Badge */}
            <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono ${
              isSelected
                ? 'bg-black/40 text-white font-bold'
                : 'bg-white/10 text-white/70'
            }`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
