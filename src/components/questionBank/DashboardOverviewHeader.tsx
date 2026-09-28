import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
  CartesianGrid,
  TooltipProps
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
  FileEdit,
  XCircle,
  Target,
  Zap,
  Flame,
  Crown,
  Layers,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Sparkles,
  Award,
  Filter,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckSquare,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { QuestionItem, CognitiveLevel, ApprovalStatus, BtiRoundGroupKey } from '../../types';
import { DIFFICULTY_CONFIGS, DifficultyBadgeAndMeter } from './DifficultyBadgeAndMeter';
import { DifficultyTrendChart30D } from './DifficultyTrendChart30D';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap } from '../../utils/hapticUtils';

interface DashboardOverviewHeaderProps {
  questions: QuestionItem[];
  currentFilterLevel?: string;
  currentFilterStatus?: string;
  currentFilterRoundGroup?: string;
  onFilterLevel?: (level: string) => void;
  onFilterStatus?: (status: string) => void;
  onFilterRoundGroup?: (round: BtiRoundGroupKey | 'ALL') => void;
  onResetFilters?: () => void;
  defaultExpanded?: boolean;
  className?: string;
}

type HeaderViewTab = 'COMBINED' | 'DIFFICULTY' | 'DIFFICULTY_TREND_30D' | 'STATUS' | 'STACKED_MATRIX';

// Custom Recharts Dark Glass Tooltip
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#190839] border border-theme-accent/50 px-3 py-2.5 rounded-[6px] shadow-2xl text-xs font-mono z-[1000] text-white min-w-[160px] max-w-[260px] sm:max-w-[300px] pointer-events-none select-none">
        <div className="flex items-center gap-1.5 pb-1.5 border-b border-white/10 font-bold text-theme-accent">
          {data.icon && <data.icon className="w-3.5 h-3.5 shrink-0 text-theme-accent" />}
          <span className="whitespace-normal break-words">{data.name || label}</span>
        </div>
        <div className="pt-1.5 space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
              <span className="text-slate-300 flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
                <span>{entry.name || 'Số lượng'}:</span>
              </span>
              <span className="font-bold text-white shrink-0">
                {entry.value} câu {data.percentage !== undefined ? `(${data.percentage}%)` : ''}
              </span>
            </div>
          ))}
          {data.description && (
            <p className="text-[10px] text-slate-300 pt-1.5 border-t border-white/10 leading-relaxed whitespace-normal break-words">
              {data.description}
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const DashboardOverviewHeader: React.FC<DashboardOverviewHeaderProps> = ({
  questions,
  currentFilterLevel = 'ALL',
  currentFilterStatus = 'ALL',
  currentFilterRoundGroup = 'ALL',
  onFilterLevel,
  onFilterStatus,
  onFilterRoundGroup,
  onResetFilters,
  defaultExpanded = true,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [activeTab, setActiveTab] = useState<HeaderViewTab>('COMBINED');
  const [activeChartType, setActiveChartType] = useState<'DONUT' | 'BAR'>('DONUT');

  const totalQuestions = questions.length;

  // 1. Difficulty Level Breakdown
  const difficultyData = useMemo(() => {
    let nhanBiet = 0;
    let thongHieu = 0;
    let vanDung = 0;
    let vanDungCao = 0;

    questions.forEach(q => {
      const lvl = q.cognitive_level;
      if (lvl === 'NHAN_BIET' || (q as any).difficulty === 'EASY') nhanBiet++;
      else if (lvl === 'THONG_HIEU' || (q as any).difficulty === 'MEDIUM') thongHieu++;
      else if (lvl === 'VAN_DUNG' || (q as any).difficulty === 'HARD') vanDung++;
      else if (lvl === 'VAN_DUNG_CAO') vanDungCao++;
      else thongHieu++;
    });

    const divisor = totalQuestions || 1;

    return [
      {
        key: 'NHAN_BIET',
        name: 'Nhận biết (Bậc 1-2)',
        shortName: 'Nhận biết',
        difficultyLabel: 'Dễ',
        count: nhanBiet,
        percentage: Math.round((nhanBiet / divisor) * 100),
        color: '#38bdf8', // sky-400
        hoverColor: '#7dd3fc',
        badgeBg: 'bg-sky-500/15',
        badgeBorder: 'border-sky-500/35',
        badgeText: 'text-sky-300',
        icon: Target,
        description: 'Tái hiện, nhận diện định nghĩa và thao tác cơ bản'
      },
      {
        key: 'THONG_HIEU',
        name: 'Thông hiểu (Bậc 3-4)',
        shortName: 'Thông hiểu',
        difficultyLabel: 'Trung bình',
        count: thongHieu,
        percentage: Math.round((thongHieu / divisor) * 100),
        color: '#34d399', // emerald-400
        hoverColor: '#6ee7b7',
        badgeBg: 'bg-emerald-500/15',
        badgeBorder: 'border-emerald-500/35',
        badgeText: 'text-emerald-300',
        icon: Zap,
        description: 'Hiểu bản chất, giải thích quy trình và phân loại'
      },
      {
        key: 'VAN_DUNG',
        name: 'Vận dụng (Bậc 5-6)',
        shortName: 'Vận dụng',
        difficultyLabel: 'Khá',
        count: vanDung,
        percentage: Math.round((vanDung / divisor) * 100),
        color: '#fbbf24', // amber-400
        hoverColor: '#fde68a',
        badgeBg: 'bg-amber-500/15',
        badgeBorder: 'border-amber-500/35',
        badgeText: 'text-amber-300',
        icon: Flame,
        description: 'Áp dụng kiến thức xử lý tình huống thực tế và sự cố số'
      },
      {
        key: 'VAN_DUNG_CAO',
        name: 'Vận dụng cao (Bậc 7-8)',
        shortName: 'Vận dụng cao',
        difficultyLabel: 'Khó',
        count: vanDungCao,
        percentage: Math.round((vanDungCao / divisor) * 100),
        color: '#f43f5e', // rose-500
        hoverColor: '#fb7185',
        badgeBg: 'bg-rose-500/15',
        badgeBorder: 'border-rose-500/35',
        badgeText: 'text-rose-300',
        icon: Crown,
        description: 'Phân tích đa chiều, phản biện và kiến tạo giải pháp an toàn'
      }
    ];
  }, [questions, totalQuestions]);

  // 2. Status & Pipeline Breakdown (Draft, Reviewed, Published, Rejected)
  const statusData = useMemo(() => {
    let published = 0; // APPROVED
    let reviewed = 0;  // PENDING_REVIEW
    let draft = 0;     // DRAFT / undefined
    let rejected = 0;  // REJECTED

    questions.forEach(q => {
      const st = q.approval_status;
      if (st === 'APPROVED') published++;
      else if (st === 'PENDING_REVIEW') reviewed++;
      else if (st === 'REJECTED') rejected++;
      else draft++;
    });

    const divisor = totalQuestions || 1;

    return [
      {
        key: 'APPROVED',
        name: 'Đã phê duyệt (Published)',
        shortName: 'Đã phê duyệt',
        count: published,
        percentage: Math.round((published / divisor) * 100),
        color: '#10b981', // emerald-500
        hoverColor: '#34d399',
        badgeBg: 'bg-emerald-500/15',
        badgeBorder: 'border-emerald-500/35',
        badgeText: 'text-emerald-300',
        icon: CheckCircle2,
        description: 'Đã qua thẩm định và sẵn sàng sử dụng trong trận đấu'
      },
      {
        key: 'PENDING_REVIEW',
        name: 'Chờ duyệt (Reviewed/Pending)',
        shortName: 'Chờ kiểm duyệt',
        count: reviewed,
        percentage: Math.round((reviewed / divisor) * 100),
        color: '#f59e0b', // amber-500
        hoverColor: '#fbbf24',
        badgeBg: 'bg-amber-500/15',
        badgeBorder: 'border-amber-500/35',
        badgeText: 'text-amber-300',
        icon: Clock,
        description: 'Đã soạn thảo hoàn tất và đang chờ Hội đồng rà soát'
      },
      {
        key: 'DRAFT',
        name: 'Bản nháp (Draft)',
        shortName: 'Bản nháp',
        count: draft,
        percentage: Math.round((draft / divisor) * 100),
        color: '#38bdf8', // sky-400
        hoverColor: '#60a5fa',
        badgeBg: 'bg-sky-500/15',
        badgeBorder: 'border-sky-500/35',
        badgeText: 'text-sky-300',
        icon: FileEdit,
        description: 'Đang biên soạn hoặc chỉnh sửa cục bộ'
      },
      {
        key: 'REJECTED',
        name: 'Cần chỉnh sửa (Revision)',
        shortName: 'Cần chỉnh sửa',
        count: rejected,
        percentage: Math.round((rejected / divisor) * 100),
        color: '#f43f5e', // rose-500
        hoverColor: '#fb7185',
        badgeBg: 'bg-rose-500/15',
        badgeBorder: 'border-rose-500/35',
        badgeText: 'text-rose-300',
        icon: XCircle,
        description: 'Hội đồng yêu cầu điều chỉnh nội dung hoặc căn cứ pháp lý'
      }
    ];
  }, [questions, totalQuestions]);

  // 3. Stacked Cross-Matrix Data: Difficulty Level vs Approval Status
  const stackedDifficultyStatusData = useMemo(() => {
    const map: Record<string, { levelKey: string; name: string; shortName: string; APPROVED: number; PENDING_REVIEW: number; DRAFT: number; REJECTED: number; total: number }> = {
      NHAN_BIET: { levelKey: 'NHAN_BIET', name: 'Nhận biết (Dễ)', shortName: 'Nhận biết', APPROVED: 0, PENDING_REVIEW: 0, DRAFT: 0, REJECTED: 0, total: 0 },
      THONG_HIEU: { levelKey: 'THONG_HIEU', name: 'Thông hiểu (TB)', shortName: 'Thông hiểu', APPROVED: 0, PENDING_REVIEW: 0, DRAFT: 0, REJECTED: 0, total: 0 },
      VAN_DUNG: { levelKey: 'VAN_DUNG', name: 'Vận dụng (Khá)', shortName: 'Vận dụng', APPROVED: 0, PENDING_REVIEW: 0, DRAFT: 0, REJECTED: 0, total: 0 },
      VAN_DUNG_CAO: { levelKey: 'VAN_DUNG_CAO', name: 'Vận dụng cao (Khó)', shortName: 'VD Cao', APPROVED: 0, PENDING_REVIEW: 0, DRAFT: 0, REJECTED: 0, total: 0 }
    };

    questions.forEach(q => {
      const lvl = q.cognitive_level || 'THONG_HIEU';
      const target = map[lvl] || map.THONG_HIEU;
      const st = q.approval_status || 'DRAFT';

      if (st === 'APPROVED') target.APPROVED++;
      else if (st === 'PENDING_REVIEW') target.PENDING_REVIEW++;
      else if (st === 'REJECTED') target.REJECTED++;
      else target.DRAFT++;

      target.total++;
    });

    return Object.values(map);
  }, [questions]);

  // 4. Quick KPI Metrics
  const approvedCount = statusData.find(s => s.key === 'APPROVED')?.count || 0;
  const pendingCount = statusData.find(s => s.key === 'PENDING_REVIEW')?.count || 0;
  const draftCount = statusData.find(s => s.key === 'DRAFT')?.count || 0;
  const publishedRate = totalQuestions > 0 ? Math.round((approvedCount / totalQuestions) * 100) : 0;

  // Handler for chart clicks
  const handleDifficultyClick = (levelKey: string) => {
    vibrateTap();
    soundFx.playClick();
    if (onFilterLevel) {
      if (currentFilterLevel === levelKey) {
        onFilterLevel('ALL');
      } else {
        onFilterLevel(levelKey);
      }
    }
  };

  const handleStatusClick = (statusKey: string) => {
    vibrateTap();
    soundFx.playClick();
    if (onFilterStatus) {
      if (currentFilterStatus === statusKey) {
        onFilterStatus('ALL');
      } else {
        onFilterStatus(statusKey);
      }
    }
  };

  const hasActiveFilters = currentFilterLevel !== 'ALL' || currentFilterStatus !== 'ALL' || currentFilterRoundGroup !== 'ALL';

  return (
    <div
      id="dashboard-overview-header"
      className={`fluent-card fluent-box rounded-[6px] overflow-hidden transition-all ${className}`}
    >
      {/* 1. Header Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-[#241148]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[4px] bg-theme-accent/20 border border-theme-accent/40 flex items-center justify-center text-theme-accent shadow-inner">
            <BarChart3 className="w-4 h-4 text-theme-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5 font-mono">
                <span>Tổng Quan Cơ Cấu Ngân Hàng Đề</span>
                <span className="fluent-badge fluent-badge-accent tabular-nums">
                  {totalQuestions} Câu Hỏi
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-[#B6A6D8] font-mono">
              Trực quan hóa thành phần theo Mức độ nhận thức (Độ khó) và Trạng thái kiểm duyệt
            </p>
          </div>
        </div>

        {/* View Switchers & Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Active Filter Indicators */}
          {hasActiveFilters && (
            <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/35 px-2 py-1 rounded-[4px] text-[11px] text-amber-300 font-mono">
              <Filter className="w-3 h-3 text-amber-400" />
              <span>Đang lọc:</span>
              {currentFilterLevel !== 'ALL' && (
                <span className="font-bold underline decoration-amber-400">
                  {DIFFICULTY_CONFIGS[currentFilterLevel as CognitiveLevel]?.label || currentFilterLevel}
                </span>
              )}
              {currentFilterStatus !== 'ALL' && (
                <span className="font-bold underline decoration-amber-400">
                  {currentFilterStatus === 'APPROVED' ? 'Đã duyệt' : currentFilterStatus === 'PENDING_REVIEW' ? 'Chờ duyệt' : currentFilterStatus}
                </span>
              )}
              {onResetFilters && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="ml-1 hover:text-white underline text-[10px] cursor-pointer flex items-center gap-0.5"
                  title="Xóa tất cả bộ lọc"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Xóa</span>
                </button>
              )}
            </div>
          )}

          {/* Tab Selector */}
          <div className="inline-flex rounded-[4px] bg-[#140827] p-0.5 border border-white/10 text-[11px] font-mono">
            <button
              type="button"
              id="tab-overview-combined"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setActiveTab('COMBINED');
              }}
              className={`fluent-subtab-btn ${activeTab === 'COMBINED' ? 'active' : ''}`}
            >
              <Activity className="w-3 h-3" />
              <span>Toàn cảnh</span>
            </button>
            <button
              type="button"
              id="tab-overview-difficulty"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setActiveTab('DIFFICULTY');
              }}
              className={`fluent-subtab-btn ${activeTab === 'DIFFICULTY' ? 'active' : ''}`}
            >
              <Target className="w-3 h-3" />
              <span>Độ khó</span>
            </button>
            <button
              type="button"
              id="tab-overview-trend"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setActiveTab('DIFFICULTY_TREND_30D');
              }}
              className={`fluent-subtab-btn ${activeTab === 'DIFFICULTY_TREND_30D' ? 'active' : ''}`}
              title="Biểu đồ đường biến thiên độ khó trung bình 30 ngày qua"
            >
              <TrendingUp className="w-3 h-3 text-amber-400" />
              <span>Xu hướng 30 ngày</span>
            </button>
            <button
              type="button"
              id="tab-overview-status"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setActiveTab('STATUS');
              }}
              className={`fluent-subtab-btn ${activeTab === 'STATUS' ? 'active' : ''}`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Trạng thái</span>
            </button>
            <button
              type="button"
              id="tab-overview-matrix"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setActiveTab('STACKED_MATRIX');
              }}
              className={`fluent-subtab-btn ${activeTab === 'STACKED_MATRIX' ? 'active' : ''}`}
            >
              <Layers className="w-3 h-3" />
              <span>Ma trận chồng</span>
            </button>
          </div>

          {/* Expand/Collapse Toggle */}
          <button
            type="button"
            id="btn-toggle-overview-collapse"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              setIsExpanded(!isExpanded);
            }}
            className="p-1.5 rounded-[4px] bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition cursor-pointer"
            title={isExpanded ? 'Thu gọn phần tổng quan' : 'Mở rộng phần tổng quan biểu đồ'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4 text-theme-accent" /> : <ChevronDown className="w-4 h-4 text-theme-accent" />}
          </button>
        </div>
      </div>

      {/* 2. Top Quick KPI Summary Cards Synchronized with Image 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-black/20 border-b border-white/5">
        {/* KPI 1: Tổng số câu */}
        <div className="fluent-card p-3 sm:p-3.5 rounded-[6px] bg-[#1C093B]/80 border border-purple-500/40 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-purple-200">
            <span className="font-semibold text-slate-200">Tổng Số Câu Hỏi</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-white font-mono tracking-tight tabular-nums">
              {totalQuestions}
            </strong>
            <span className="text-[11px] font-mono text-slate-400">câu hỏi</span>
          </div>
          <p className="text-[10px] text-purple-200/80 font-mono truncate">
            Toàn bộ dữ liệu ngân hàng đề
          </p>
        </div>

        {/* KPI 2: Tỷ lệ phê duyệt / Published */}
        <div 
          onClick={() => handleStatusClick('APPROVED')}
          className="fluent-card p-3 sm:p-3.5 rounded-[6px] bg-emerald-950/25 border border-emerald-500/40 hover:border-emerald-400/70 hover:translate-y-[-1px] transition-all duration-200 cursor-pointer shadow-md space-y-1 group"
          title="Bấm để lọc câu hỏi Đã phê duyệt"
        >
          <div className="flex items-center justify-between text-xs font-mono text-emerald-300">
            <span className="font-semibold text-slate-200">Đã Duyệt (Phát Hành)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-emerald-400 font-mono tracking-tight tabular-nums">
              {approvedCount}
            </strong>
            <span className="text-[11px] font-mono text-emerald-300/80">({publishedRate}%)</span>
          </div>
          <p className="text-[10px] text-emerald-200/80 font-mono truncate">
            Đã thẩm định sẵn sàng thi
          </p>
        </div>

        {/* KPI 3: Chờ kiểm duyệt / Pending */}
        <div 
          onClick={() => handleStatusClick('PENDING_REVIEW')}
          className="fluent-card p-3 sm:p-3.5 rounded-[6px] bg-amber-950/25 border border-amber-500/40 hover:border-amber-400/70 hover:translate-y-[-1px] transition-all duration-200 cursor-pointer shadow-md space-y-1 group"
          title="Bấm để lọc câu hỏi Đang chờ kiểm duyệt"
        >
          <div className="flex items-center justify-between text-xs font-mono text-amber-300">
            <span className="font-semibold text-slate-200">Chờ Duyệt (Review)</span>
            <Clock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-amber-400 font-mono tracking-tight tabular-nums">
              {pendingCount}
            </strong>
            <span className="text-[11px] font-mono text-slate-400">câu</span>
          </div>
          <p className="text-[10px] text-amber-200/80 font-mono truncate">
            Cần Ban Thư ký thẩm định
          </p>
        </div>

        {/* KPI 4: Bản nháp / Draft */}
        <div 
          onClick={() => handleStatusClick('DRAFT')}
          className="fluent-card p-3 sm:p-3.5 rounded-[6px] bg-sky-950/25 border border-sky-500/40 hover:border-sky-400/70 hover:translate-y-[-1px] transition-all duration-200 cursor-pointer shadow-md space-y-1 group"
          title="Bấm để lọc câu hỏi Bản nháp"
        >
          <div className="flex items-center justify-between text-xs font-mono text-sky-300">
            <span className="font-semibold text-slate-200">Bản Nháp (Draft)</span>
            <FileEdit className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-sky-400 font-mono tracking-tight tabular-nums">
              {draftCount}
            </strong>
            <span className="text-[11px] font-mono text-slate-400">câu</span>
          </div>
          <p className="text-[10px] text-sky-200/80 font-mono truncate">
            Đang soạn thảo &amp; lưu nháp
          </p>
        </div>
      </div>

      {/* 3. Expandable Chart Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 animate-fadeIn">
          {/* TAB 1: COMBINED (Side-by-Side Donut / Bar Charts) */}
          {activeTab === 'COMBINED' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* Left Column: Difficulty Donut Chart (6 cols) */}
              <div className="lg:col-span-6 p-4 rounded-[6px] bg-[#16062f]/90 border border-theme-accent/20 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white font-mono">
                    <Target className="w-4 h-4 text-sky-400" />
                    <span>Phân bổ Mức độ nhận thức (Độ khó)</span>
                  </div>
                  <span className="text-[10px] text-[#B6A6D8] font-mono">4 Bậc nhận thức</span>
                </div>

                {/* Recharts Pie / Donut Chart */}
                <div className="h-[210px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={difficultyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="count"
                        onClick={(entry: any) => handleDifficultyClick(String(entry?.key || entry?.payload?.key || ''))}
                        cursor="pointer"
                      >
                        {difficultyData.map((entry) => {
                          const isSelected = currentFilterLevel === entry.key;
                          return (
                            <Cell
                              key={`cell-diff-${entry.key}`}
                              fill={entry.color}
                              stroke={isSelected ? '#ffffff' : 'rgba(255,255,255,0.1)'}
                              strokeWidth={isSelected ? 3 : 1}
                              className="transition-all duration-300 hover:opacity-80"
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip />} wrapperStyle={{ zIndex: 1000, outline: 'none' }} allowEscapeViewBox={{ x: true, y: true }} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered Donut Summary Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Độ khó</span>
                    <span className="text-xl font-black text-white font-mono">{totalQuestions}</span>
                    <span className="text-[9px] font-mono text-theme-accent">100%</span>
                  </div>
                </div>

                {/* Interactive Legend / Filter Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2 border-t border-white/10">
                  {difficultyData.map(item => {
                    const isSelected = currentFilterLevel === item.key;
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleDifficultyClick(item.key)}
                        className={`p-1.5 rounded-[4px] border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? `${item.badgeBg} ${item.badgeBorder} ring-1 ring-current shadow-md`
                            : 'bg-black/30 border-white/5 hover:border-white/20'
                        }`}
                        title={`Bấm để lọc: ${item.name} (${item.count} câu, ${item.percentage}%)`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-[10px] font-bold truncate flex items-center gap-1 ${item.badgeText}`}>
                            <IconComponent className="w-3 h-3 shrink-0" />
                            <span className="truncate">{item.shortName}</span>
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">{item.percentage}%</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-black text-white font-mono">{item.count}</span>
                          <span className="text-[9px] font-mono text-slate-400">câu</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Status Pipeline Donut Chart (6 cols) */}
              <div className="lg:col-span-6 p-4 rounded-[6px] bg-[#16062f]/90 border border-theme-accent/20 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white font-mono">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Trạng thái kiểm duyệt &amp; Phát hành (Workflow)</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">{publishedRate}% Đã duyệt</span>
                </div>

                {/* Recharts Pie / Donut Chart */}
                <div className="h-[210px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="count"
                        onClick={(entry: any) => handleStatusClick(String(entry?.key || entry?.payload?.key || ''))}
                        cursor="pointer"
                      >
                        {statusData.map((entry) => {
                          const isSelected = currentFilterStatus === entry.key;
                          return (
                            <Cell
                              key={`cell-status-${entry.key}`}
                              fill={entry.color}
                              stroke={isSelected ? '#ffffff' : 'rgba(255,255,255,0.1)'}
                              strokeWidth={isSelected ? 3 : 1}
                              className="transition-all duration-300 hover:opacity-80"
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip />} wrapperStyle={{ zIndex: 1000, outline: 'none' }} allowEscapeViewBox={{ x: true, y: true }} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered Donut Summary Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Đã duyệt</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">{approvedCount}</span>
                    <span className="text-[9px] font-mono text-slate-400">/{totalQuestions} câu</span>
                  </div>
                </div>

                {/* Interactive Legend / Filter Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2 border-t border-white/10">
                  {statusData.map(item => {
                    const isSelected = currentFilterStatus === item.key;
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleStatusClick(item.key)}
                        className={`p-1.5 rounded-[4px] border text-left transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? `${item.badgeBg} ${item.badgeBorder} ring-1 ring-current shadow-md`
                            : 'bg-black/30 border-white/5 hover:border-white/20'
                        }`}
                        title={`Bấm để lọc: ${item.name} (${item.count} câu, ${item.percentage}%)`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-[10px] font-bold truncate flex items-center gap-1 ${item.badgeText}`}>
                            <IconComponent className="w-3 h-3 shrink-0" />
                            <span className="truncate">{item.shortName}</span>
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">{item.percentage}%</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-black text-white font-mono">{item.count}</span>
                          <span className="text-[9px] font-mono text-slate-400">câu</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIFFICULTY DETAILED BAR CHART */}
          {activeTab === 'DIFFICULTY' && (
            <div className="p-4 rounded-[6px] bg-[#16062f]/90 border border-theme-accent/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-white font-mono">Biểu đồ Phân bổ Mức độ nhận thức (Taxonomy 4 bậc)</span>
                </div>
                <span className="text-xs text-[#B6A6D8] font-mono">Bấm trực tiếp vào cột hoặc nhãn để lọc</span>
              </div>

              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={difficultyData} margin={{ top: 10, right: 35, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                    <XAxis 
                      dataKey="shortName" 
                      stroke="#B6A6D8" 
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#B6A6D8" 
                      fontSize={11}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      content={<CustomChartTooltip />} 
                      wrapperStyle={{ zIndex: 1000, outline: 'none' }} 
                      allowEscapeViewBox={{ x: true, y: true }} 
                      cursor={{ fill: 'rgba(247, 202, 201, 0.10)', radius: 4 }} 
                    />
                    <Bar 
                      dataKey="count" 
                      name="Số câu hỏi" 
                      radius={[4, 4, 0, 0]}
                      onClick={(entry: any) => handleDifficultyClick(String(entry?.key || entry?.payload?.key || ''))}
                      cursor="pointer"
                    >
                      {difficultyData.map((entry) => {
                        const isSelected = currentFilterLevel === entry.key;
                        return (
                          <Cell
                            key={`diff-bar-${entry.key}`}
                            fill={entry.color}
                            stroke={isSelected ? '#ffffff' : 'transparent'}
                            strokeWidth={isSelected ? 2 : 0}
                            className="transition-all duration-200 hover:brightness-125 cursor-pointer"
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Cognitive Level Explanatory Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-white/10">
                {difficultyData.map(item => {
                  const isSelected = currentFilterLevel === item.key;
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleDifficultyClick(item.key)}
                      className={`p-2.5 rounded-[4px] border transition cursor-pointer ${
                        isSelected
                          ? `${item.badgeBg} ${item.badgeBorder} ring-1 ring-current`
                          : 'bg-black/25 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <DifficultyBadgeAndMeter level={item.key} showMeter={true} size="xs" />
                        <span className="text-xs font-black text-white font-mono">{item.count} câu</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-tight">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: STATUS & WORKFLOW DETAILED VIEW */}
          {activeTab === 'STATUS' && (
            <div className="p-4 rounded-[6px] bg-[#16062f]/90 border border-theme-accent/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white font-mono">Quy trình Kiểm duyệt &amp; Phát hành (Workflow Pipeline)</span>
                </div>
                <span className="text-xs text-[#B6A6D8] font-mono">{publishedRate}% Sẵn sàng thi đấu</span>
              </div>

              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} layout="vertical" margin={{ top: 10, right: 35, left: 40, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" horizontal={false} />
                    <XAxis type="number" stroke="#B6A6D8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="shortName" stroke="#B6A6D8" fontSize={11} tickLine={false} width={90} />
                    <Tooltip 
                      content={<CustomChartTooltip />} 
                      wrapperStyle={{ zIndex: 1000, outline: 'none' }} 
                      allowEscapeViewBox={{ x: true, y: true }} 
                      cursor={{ fill: 'rgba(247, 202, 201, 0.10)', radius: 4 }} 
                    />
                    <Bar 
                      dataKey="count" 
                      name="Số câu" 
                      radius={[0, 4, 4, 0]}
                      onClick={(entry: any) => handleStatusClick(String(entry?.key || entry?.payload?.key || ''))}
                      cursor="pointer"
                    >
                      {statusData.map((entry) => {
                        const isSelected = currentFilterStatus === entry.key;
                        return (
                          <Cell
                            key={`status-bar-${entry.key}`}
                            fill={entry.color}
                            stroke={isSelected ? '#ffffff' : 'transparent'}
                            strokeWidth={isSelected ? 2 : 0}
                            className="transition-all duration-200 hover:brightness-125 cursor-pointer"
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Status Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-white/10">
                {statusData.map(item => {
                  const isSelected = currentFilterStatus === item.key;
                  const IconComponent = item.icon;
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleStatusClick(item.key)}
                      className={`p-2.5 rounded-[4px] border transition cursor-pointer ${
                        isSelected
                          ? `${item.badgeBg} ${item.badgeBorder} ring-1 ring-current`
                          : 'bg-black/25 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[11px] font-bold flex items-center gap-1 ${item.badgeText}`}>
                          <IconComponent className="w-3.5 h-3.5" />
                          <span>{item.shortName}</span>
                        </span>
                        <span className="text-xs font-black text-white font-mono">{item.count} câu</span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-tight">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: STACKED CROSS-MATRIX (Difficulty by Status) */}
          {activeTab === 'STACKED_MATRIX' && (
            <div className="p-4 rounded-[6px] bg-[#16062f]/90 border border-theme-accent/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white font-mono">Ma trận chồng: Mức độ nhận thức × Trạng thái kiểm duyệt</span>
                </div>
                <div className="flex items-center gap-3 text-[10.5px] font-mono text-slate-300">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-[1px] bg-emerald-500 inline-block" /> Đã duyệt</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-[1px] bg-amber-500 inline-block" /> Chờ duyệt</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-[1px] bg-sky-400 inline-block" /> Bản nháp</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-[1px] bg-rose-500 inline-block" /> Cần sửa</span>
                </div>
              </div>

              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stackedDifficultyStatusData} margin={{ top: 10, right: 35, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                    <XAxis dataKey="name" stroke="#B6A6D8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#B6A6D8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip 
                      content={<CustomChartTooltip />} 
                      wrapperStyle={{ zIndex: 1000, outline: 'none' }} 
                      allowEscapeViewBox={{ x: true, y: true }} 
                      cursor={{ fill: 'rgba(247, 202, 201, 0.10)', radius: 4 }} 
                    />
                    <Bar dataKey="APPROVED" name="Đã duyệt" stackId="a" fill="#10b981" />
                    <Bar dataKey="PENDING_REVIEW" name="Chờ duyệt" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="DRAFT" name="Bản nháp" stackId="a" fill="#38bdf8" />
                    <Bar dataKey="REJECTED" name="Cần sửa" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Table breakdown below */}
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] font-mono text-left border border-white/10 rounded-[4px] overflow-hidden">
                  <thead className="bg-[#0c021c] text-[#B6A6D8]">
                    <tr>
                      <th className="p-2 border-b border-white/10 font-bold">Mức độ nhận thức</th>
                      <th className="p-2 border-b border-white/10 text-emerald-400 text-center font-bold">Đã duyệt</th>
                      <th className="p-2 border-b border-white/10 text-amber-300 text-center font-bold">Chờ duyệt</th>
                      <th className="p-2 border-b border-white/10 text-sky-300 text-center font-bold">Bản nháp</th>
                      <th className="p-2 border-b border-white/10 text-rose-300 text-center font-bold">Cần sửa</th>
                      <th className="p-2 border-b border-white/10 text-white text-right font-bold">Tổng cộng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-black/20">
                    {stackedDifficultyStatusData.map(row => (
                      <tr key={row.levelKey} className="hover:bg-white/5 transition">
                        <td className="p-2 font-bold text-white flex items-center gap-1.5">
                          <DifficultyBadgeAndMeter level={row.levelKey} showMeter={false} size="xs" />
                          <span>{row.name}</span>
                        </td>
                        <td className="p-2 text-center text-emerald-300 font-bold">{row.APPROVED}</td>
                        <td className="p-2 text-center text-amber-300 font-bold">{row.PENDING_REVIEW}</td>
                        <td className="p-2 text-center text-sky-300 font-bold">{row.DRAFT}</td>
                        <td className="p-2 text-center text-rose-300 font-bold">{row.REJECTED}</td>
                        <td className="p-2 text-right font-black text-theme-accent">{row.total} câu</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: DIFFICULTY TREND 30 DAYS LINE CHART */}
          {activeTab === 'DIFFICULTY_TREND_30D' && (
            <DifficultyTrendChart30D
              questions={questions}
              onFilterLevel={onFilterLevel}
            />
          )}
        </div>
      )}
    </div>
  );
};
