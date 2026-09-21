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
  Pie
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  CheckCircle2, 
  Clock, 
  FileEdit, 
  Target, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Layers,
  XCircle
} from 'lucide-react';
import { QuestionItem, CognitiveLevel, ApprovalStatus } from '../../types';
import { COGNITIVE_LEVELS } from '../../data/digitalCompetencyData';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap } from '../../utils/hapticUtils';

interface QuestionBankStatsWidgetProps {
  questions: QuestionItem[];
  currentFilterLevel?: string;
  currentFilterStatus?: string;
  onFilterLevel?: (level: string) => void;
  onFilterStatus?: (status: string) => void;
}

type StatViewMode = 'DIFFICULTY' | 'STATUS';

export const QuestionBankStatsWidget: React.FC<QuestionBankStatsWidgetProps> = ({
  questions,
  currentFilterLevel = 'ALL',
  currentFilterStatus = 'ALL',
  onFilterLevel,
  onFilterStatus
}) => {
  const [viewMode, setViewMode] = useState<StatViewMode>('DIFFICULTY');
  const [chartType, setChartType] = useState<'BAR' | 'PIE'>('BAR');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // 1. Difficulty / Cognitive Level Statistics
  const difficultyStats = useMemo(() => {
    let nhanBiet = 0;   // Dễ
    let thongHieu = 0;  // Trung bình
    let vanDung = 0;    // Khó
    let vanDungCao = 0; // Rất khó

    questions.forEach(q => {
      const lvl = q.cognitive_level;
      if (lvl === 'NHAN_BIET' || (q as any).difficulty === 'EASY') {
        nhanBiet++;
      } else if (lvl === 'THONG_HIEU' || (q as any).difficulty === 'MEDIUM') {
        thongHieu++;
      } else if (lvl === 'VAN_DUNG' || (q as any).difficulty === 'HARD') {
        vanDung++;
      } else if (lvl === 'VAN_DUNG_CAO') {
        vanDungCao++;
      } else {
        // Fallback or default
        thongHieu++;
      }
    });

    const total = questions.length || 1;

    return [
      {
        key: 'NHAN_BIET',
        name: 'Dễ (Nhận biết)',
        shortName: 'Dễ',
        count: nhanBiet,
        percentage: Math.round((nhanBiet / total) * 100),
        color: '#60a5fa', // Blue
        hoverColor: '#93c5fd',
        bgBadge: 'bg-blue-500/20 text-blue-300 border-blue-400/40'
      },
      {
        key: 'THONG_HIEU',
        name: 'Trung bình (Thông hiểu)',
        shortName: 'Trung bình',
        count: thongHieu,
        percentage: Math.round((thongHieu / total) * 100),
        color: '#34d399', // Emerald
        hoverColor: '#6ee7b7',
        bgBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
      },
      {
        key: 'VAN_DUNG',
        name: 'Khó (Vận dụng)',
        shortName: 'Khó',
        count: vanDung,
        percentage: Math.round((vanDung / total) * 100),
        color: '#fbbf24', // Amber
        hoverColor: '#fde68a',
        bgBadge: 'bg-amber-500/20 text-amber-300 border-amber-400/40'
      },
      {
        key: 'VAN_DUNG_CAO',
        name: 'Rất khó (Vận dụng cao)',
        shortName: 'Rất khó',
        count: vanDungCao,
        percentage: Math.round((vanDungCao / total) * 100),
        color: '#f87171', // Rose
        hoverColor: '#fca5a5',
        bgBadge: 'bg-rose-500/20 text-rose-300 border-rose-400/40'
      }
    ];
  }, [questions]);

  // 2. Approval Status Statistics
  const statusStats = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    let draft = 0;

    questions.forEach(q => {
      const st = q.approval_status;
      if (st === 'APPROVED') {
        approved++;
      } else if (st === 'PENDING_REVIEW') {
        pending++;
      } else if (st === 'REJECTED') {
        rejected++;
      } else {
        draft++;
      }
    });

    const total = questions.length || 1;

    return [
      {
        key: 'APPROVED',
        name: 'Đã phê duyệt',
        shortName: 'Đã duyệt',
        count: approved,
        percentage: Math.round((approved / total) * 100),
        color: '#10b981', // Emerald green
        hoverColor: '#34d399',
        bgBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
        icon: CheckCircle2
      },
      {
        key: 'PENDING_REVIEW',
        name: 'Chờ thẩm định',
        shortName: 'Chờ duyệt',
        count: pending,
        percentage: Math.round((pending / total) * 100),
        color: '#f59e0b', // Amber
        hoverColor: '#fbbf24',
        bgBadge: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
        icon: Clock
      },
      {
        key: 'REJECTED',
        name: 'Từ chối / Cần sửa',
        shortName: 'Từ chối',
        count: rejected,
        percentage: Math.round((rejected / total) * 100),
        color: '#f43f5e', // Rose
        hoverColor: '#fb7185',
        bgBadge: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
        icon: XCircle
      },
      {
        key: 'DRAFT',
        name: 'Bản thảo',
        shortName: 'Bản thảo',
        count: draft,
        percentage: Math.round((draft / total) * 100),
        color: '#94a3b8', // Slate
        hoverColor: '#cbd5e1',
        bgBadge: 'bg-slate-500/20 text-slate-300 border-slate-400/40',
        icon: FileEdit
      }
    ];
  }, [questions]);

  const activeData = viewMode === 'DIFFICULTY' ? difficultyStats : statusStats;
  const totalCount = questions.length;

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#190839] border border-theme-accent/50 p-2.5 rounded-[6px] shadow-2xl text-xs font-mono max-w-[260px] z-[1000] text-white pointer-events-none select-none">
          <div className="flex items-center gap-2 font-bold text-white mb-1 pb-1 border-b border-white/10">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
            <span className="whitespace-normal break-words">{data.name}</span>
          </div>
          <div className="text-slate-300 flex items-center justify-between gap-4">
            <span>Số lượng:</span>
            <strong className="text-white font-extrabold text-sm">{data.count} câu</strong>
          </div>
          <div className="text-slate-400 flex items-center justify-between gap-4 text-[11px]">
            <span>Tỷ trọng:</span>
            <span className="text-theme-accent font-bold">{data.percentage}%</span>
          </div>
          <div className="text-[10px] text-sky-300 italic pt-1 mt-1 border-t border-white/10">
            • Nhấn vào để lọc câu hỏi
          </div>
        </div>
      );
    }
    return null;
  };

  const handleItemClick = (itemKey: string) => {
    vibrateTap();
    soundFx.playClick();
    if (viewMode === 'DIFFICULTY' && onFilterLevel) {
      onFilterLevel(currentFilterLevel === itemKey ? 'ALL' : itemKey);
    } else if (viewMode === 'STATUS' && onFilterStatus) {
      onFilterStatus(currentFilterStatus === itemKey ? 'ALL' : itemKey);
    }
  };

  return (
    <div className="fluent-card bg-[#190839]/95 border border-theme-accent/25 shadow-lg rounded-[6px] overflow-hidden transition-all duration-200">
      {/* Header Bar */}
      <div className="px-4 py-2.5 bg-[#241148]/90 border-b border-theme-accent/20 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-[4px] bg-theme-accent/20 text-theme-accent border border-theme-accent/30">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide flex items-center gap-1.5">
              <span>Thống Kê Ngân Hàng Đề</span>
              <span className="text-[11px] text-theme-accent font-semibold lowercase">
                ({totalCount} câu)
              </span>
            </h4>
            <p className="text-[10px] text-[#B6A6D8] font-mono">
              Phân bổ câu hỏi theo độ khó & tiến độ thẩm định
            </p>
          </div>
        </div>

        {/* View mode toggle controls */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Difficulty vs Status Mode Toggle */}
          <div className="bg-[#14062E] p-0.5 rounded-[4px] border border-white/15 flex items-center text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setViewMode('DIFFICULTY');
              }}
              className={`px-2.5 py-1 rounded-[3px] text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'DIFFICULTY'
                  ? 'bg-theme-accent text-[#190839] shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title="Xem thống kê theo mức độ khó (Dễ, Trung bình, Khó, Rất khó)"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Theo Mức Độ Khó</span>
            </button>

            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setViewMode('STATUS');
              }}
              className={`px-2.5 py-1 rounded-[3px] text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'STATUS'
                  ? 'bg-theme-accent text-[#190839] shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title="Xem thống kê theo trạng thái duyệt (Đã duyệt, Chờ duyệt, Bản thảo)"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Theo Trạng Thái Duyệt</span>
            </button>
          </div>

          {/* Chart Type Toggle (Bar vs Donut) */}
          <div className="bg-[#14062E] p-0.5 rounded-[4px] border border-white/15 flex items-center">
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setChartType('BAR');
              }}
              className={`p-1 rounded-[3px] transition cursor-pointer ${
                chartType === 'BAR' ? 'bg-theme-accent text-[#190839]' : 'text-slate-400 hover:text-white'
              }`}
              title="Biểu đồ cột"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setChartType('PIE');
              }}
              className={`p-1 rounded-[3px] transition cursor-pointer ${
                chartType === 'PIE' ? 'bg-theme-accent text-[#190839]' : 'text-slate-400 hover:text-white'
              }`}
              title="Biểu đồ tròn"
            >
              <PieIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Collapse / Expand toggle */}
          <button
            type="button"
            onClick={() => {
              vibrateTap();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 rounded-[4px] text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title={isExpanded ? 'Thu gọn biểu đồ' : 'Mở rộng biểu đồ'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Chart & Stat Cards Body */}
      {isExpanded && (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Left: Interactive Metric Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-2">
            <div className="text-[11px] font-mono text-[#B6A6D8] font-semibold flex items-center justify-between">
              <span>{viewMode === 'DIFFICULTY' ? 'Phân loại mức độ nhận thức:' : 'Tiến độ phê duyệt đề thi:'}</span>
              <span className="text-[10px] text-sky-300 italic">Nhấp để lọc nhanh</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {activeData.map(item => {
                const isSelected =
                  (viewMode === 'DIFFICULTY' && currentFilterLevel === item.key) ||
                  (viewMode === 'STATUS' && currentFilterStatus === item.key);

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleItemClick(item.key)}
                    className={`p-2.5 rounded-[4px] border text-left transition cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'bg-white/15 border-theme-accent ring-1 ring-theme-accent shadow-md scale-[1.02]'
                        : 'bg-[#14062E]/90 border-white/10 hover:border-white/25 hover:bg-white/5'
                    }`}
                  >
                    {/* Top indicator color pill */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: item.color }}
                    />

                    <div className="flex items-center justify-between gap-1 pt-1">
                      <span className="text-xs font-bold text-slate-200 truncate group-hover:text-white">
                        {item.shortName}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-theme-accent">
                        {item.percentage}%
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-1 mt-1">
                      <span className="text-lg font-black font-mono text-white">
                        {item.count}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">câu</span>
                    </div>

                    {/* Mini Progress track */}
                    <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Visual Recharts Chart (7 cols) */}
          <div className="lg:col-span-7 bg-[#14062E]/70 border border-white/10 rounded-[5px] p-3 h-48 flex flex-col justify-center">
            {totalCount === 0 ? (
              <div className="text-center text-xs text-slate-400 py-8 font-mono">
                Chưa có dữ liệu câu hỏi để hiển thị biểu đồ
              </div>
            ) : chartType === 'BAR' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activeData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="shortName"
                    tick={{ fill: '#B6A6D8', fontSize: 11, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#ffffff20' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#B6A6D8', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#ffffff20' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    content={<CustomTooltip />} 
                    wrapperStyle={{ zIndex: 1000, outline: 'none' }} 
                    allowEscapeViewBox={{ x: true, y: true }} 
                    cursor={{ fill: 'rgba(247, 202, 201, 0.10)', radius: 4 }} 
                  />
                  <Bar
                    dataKey="count"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(entry: any) => {
                      if (entry && entry.key) handleItemClick(String(entry.key));
                    }}
                  >
                    {activeData.map((entry) => {
                      const isSelected =
                        (viewMode === 'DIFFICULTY' && currentFilterLevel === entry.key) ||
                        (viewMode === 'STATUS' && currentFilterStatus === entry.key);

                      return (
                        <Cell
                          key={`cell-${entry.key}`}
                          fill={entry.color}
                          stroke={isSelected ? 'var(--bti-accent, #F7CAC9)' : 'transparent'}
                          strokeWidth={isSelected ? 2 : 0}
                          opacity={isSelected ? 1 : 0.85}
                          className="transition-all duration-200 hover:brightness-125 cursor-pointer"
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center gap-4 h-full">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 1000, outline: 'none' }} allowEscapeViewBox={{ x: true, y: true }} />
                      <Pie
                        data={activeData}
                        dataKey="count"
                        nameKey="shortName"
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={62}
                        paddingAngle={3}
                        cursor="pointer"
                        onClick={(entry: any) => {
                          if (entry && entry.key) handleItemClick(String(entry.key));
                        }}
                      >
                        {activeData.map((entry) => {
                          const isSelected =
                            (viewMode === 'DIFFICULTY' && currentFilterLevel === entry.key) ||
                            (viewMode === 'STATUS' && currentFilterStatus === entry.key);

                          return (
                            <Cell
                              key={`pie-cell-${entry.key}`}
                              fill={entry.color}
                              stroke={isSelected ? 'var(--bti-accent, #F7CAC9)' : '#14062E'}
                              strokeWidth={isSelected ? 2.5 : 1}
                            />
                          );
                        })}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend list */}
                <div className="w-1/2 space-y-1.5 text-xs font-mono">
                  {activeData.map(entry => (
                    <div
                      key={entry.key}
                      onClick={() => handleItemClick(entry.key)}
                      className="flex items-center justify-between gap-2 p-1 rounded hover:bg-white/5 cursor-pointer text-[11px]"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-slate-300 truncate">{entry.shortName}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <strong className="text-white font-bold">{entry.count}</strong>
                        <span className="text-[10px] text-slate-400">({entry.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
