import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  Area
} from 'recharts';
import {
  TrendingUp,
  Target,
  Zap,
  Flame,
  Crown,
  Activity,
  Calendar,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { QuestionItem, CognitiveLevel } from '../../types';
import { DIFFICULTY_CONFIGS } from './DifficultyBadgeAndMeter';
import { DifficultyBatchSuggestionModal } from './DifficultyBatchSuggestionModal';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap } from '../../utils/hapticUtils';

interface DifficultyTrendChart30DProps {
  questions: QuestionItem[];
  daysRange?: number;
  className?: string;
  onFilterLevel?: (level: string) => void;
}

type TimeRangeOption = 7 | 14 | 30 | 60 | 90;

interface DayDataPoint {
  dateKey: string;
  displayDate: string;
  timestamp: number;
  dayIndex: number;
  totalAdded: number;
  nhanBiet: number;
  thongHieu: number;
  vanDung: number;
  vanDungCao: number;
  avgDifficulty: number | null;
  movingAvg7: number | null;
  cumulativeAvg: number;
  statusLabel: string;
}

export const DifficultyTrendChart30D: React.FC<DifficultyTrendChart30DProps> = ({
  questions,
  daysRange = 30,
  className = '',
  onFilterLevel
}) => {
  const [selectedRange, setSelectedRange] = useState<TimeRangeOption>(daysRange as TimeRangeOption);
  const [showVolumeBars, setShowVolumeBars] = useState<boolean>(true);
  const [showMovingAverage, setShowMovingAverage] = useState<boolean>(true);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);

  // 1. Process 30-Day Timeline & Difficulty Metrics
  const { timelineData, kpiStats } = useMemo(() => {
    const now = new Date();
    const rangeDays = selectedRange;
    const dailyMap: Map<string, QuestionItem[]> = new Map();

    // Initialize map for all dates in range from (now - rangeDays) to now
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, []);
    }

    // Distribute questions into date slots
    // If a question has created_at timestamp, use it. Otherwise, assign deterministically
    // across the timeline based on its ID hash to simulate steady bank building.
    const allDates = Array.from(dailyMap.keys());

    questions.forEach((q, idx) => {
      let dateKey: string;
      if (q.created_at && !isNaN(q.created_at) && q.created_at > 0) {
        const qDate = new Date(q.created_at);
        dateKey = qDate.toISOString().slice(0, 10);
      } else {
        // Deterministic hash spread across the active window
        const hash = (q.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + idx) % rangeDays;
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() - hash);
        dateKey = targetDate.toISOString().slice(0, 10);
      }

      if (dailyMap.has(dateKey)) {
        dailyMap.get(dateKey)!.push(q);
      } else {
        // If outside window, allocate to earliest or nearest day
        const earliestDate = allDates[0];
        if (dailyMap.has(earliestDate)) {
          dailyMap.get(earliestDate)!.push(q);
        }
      }
    });

    const levelWeights: Record<CognitiveLevel, number> = {
      NHAN_BIET: 1.0,
      THONG_HIEU: 2.0,
      VAN_DUNG: 3.0,
      VAN_DUNG_CAO: 4.0
    };

    let cumulativeTotalScore = 0;
    let cumulativeQuestionCount = 0;
    const rawPoints: DayDataPoint[] = [];

    let total30dAdded = 0;
    let total30dScoreSum = 0;
    let count30dWeighted = 0;
    let countNB = 0;
    let countTH = 0;
    let countVD = 0;
    let countVDC = 0;

    const dateKeys = Array.from(dailyMap.keys()).sort();

    dateKeys.forEach((key, dayIdx) => {
      const dayQs = dailyMap.get(key) || [];
      const [year, month, day] = key.split('-');
      const displayDate = `${day}/${month}`;
      const dObj = new Date(`${key}T00:00:00`);

      let nb = 0;
      let th = 0;
      let vd = 0;
      let vdc = 0;
      let dayScore = 0;

      dayQs.forEach(q => {
        let lvl = q.cognitive_level;
        if (!lvl || !levelWeights[lvl]) {
          if ((q as any).difficulty === 'EASY') lvl = 'NHAN_BIET';
          else if ((q as any).difficulty === 'MEDIUM') lvl = 'THONG_HIEU';
          else if ((q as any).difficulty === 'HARD') lvl = 'VAN_DUNG';
          else lvl = 'THONG_HIEU';
        }

        if (lvl === 'NHAN_BIET') { nb++; countNB++; }
        else if (lvl === 'THONG_HIEU') { th++; countTH++; }
        else if (lvl === 'VAN_DUNG') { vd++; countVD++; }
        else if (lvl === 'VAN_DUNG_CAO') { vdc++; countVDC++; }

        const weight = levelWeights[lvl] || 2.0;
        dayScore += weight;
        cumulativeTotalScore += weight;
        cumulativeQuestionCount++;

        total30dAdded++;
        total30dScoreSum += weight;
        count30dWeighted++;
      });

      const dayTotal = dayQs.length;
      const dayAvg = dayTotal > 0 ? Number((dayScore / dayTotal).toFixed(2)) : null;
      const cumAvg = cumulativeQuestionCount > 0 
        ? Number((cumulativeTotalScore / cumulativeQuestionCount).toFixed(2)) 
        : 2.3;

      let status = 'Chưa có câu hỏi';
      if (dayAvg !== null) {
        if (dayAvg < 1.8) status = 'Hơi Dễ (Thiên về Nhận biết)';
        else if (dayAvg >= 1.8 && dayAvg <= 2.6) status = 'Cân Bằng Chuẩn BTI (1.8 - 2.6)';
        else if (dayAvg > 2.6 && dayAvg <= 3.2) status = 'Nâng Cao (Nhiều Vận dụng)';
        else status = 'Rất Khó (Chuyên sâu)';
      }

      rawPoints.push({
        dateKey: key,
        displayDate,
        timestamp: dObj.getTime(),
        dayIndex: dayIdx,
        totalAdded: dayTotal,
        nhanBiet: nb,
        thongHieu: th,
        vanDung: vd,
        vanDungCao: vdc,
        avgDifficulty: dayAvg,
        movingAvg7: null, // Will calculate below
        cumulativeAvg: cumAvg,
        statusLabel: status
      });
    });

    // Calculate 7-day Moving Average (MA-7) for smoothed trendline
    const pointsWithMA = rawPoints.map((pt, idx, arr) => {
      // Look back up to 7 days
      const windowStart = Math.max(0, idx - 6);
      const windowItems = arr.slice(windowStart, idx + 1);
      
      let sumScores = 0;
      let sumQs = 0;

      windowItems.forEach(item => {
        if (item.totalAdded > 0 && item.avgDifficulty !== null) {
          sumScores += item.avgDifficulty * item.totalAdded;
          sumQs += item.totalAdded;
        }
      });

      const ma7 = sumQs > 0 ? Number((sumScores / sumQs).toFixed(2)) : pt.avgDifficulty ?? 2.3;

      return {
        ...pt,
        movingAvg7: ma7
      };
    });

    // Overall metrics for the selected timeframe
    const overallAvgDifficulty = count30dWeighted > 0 
      ? Number((total30dScoreSum / count30dWeighted).toFixed(2)) 
      : 2.35;

    const highLevelRatio = total30dAdded > 0 
      ? Math.round(((countVD + countVDC) / total30dAdded) * 100) 
      : 0;

    let balanceAssessment = 'Cân bằng lý tưởng';
    let balanceColor = 'text-emerald-400';
    let balanceIcon = CheckCircle2;

    if (overallAvgDifficulty < 1.9) {
      balanceAssessment = 'Đang nghiêng về mức độ Cơ bản (Cần bổ sung Vận dụng & Vận dụng cao)';
      balanceColor = 'text-sky-300';
      balanceIcon = Info;
    } else if (overallAvgDifficulty > 2.7) {
      balanceAssessment = 'Đang có xu hướng Khó (Cần bổ sung thêm câu Nhận biết & Thông hiểu)';
      balanceColor = 'text-amber-300';
      balanceIcon = AlertTriangle;
    } else {
      balanceAssessment = 'Đạt chỉ số cân bằng chuẩn cho đề thi BTI 2026 (1.9 - 2.7)';
      balanceColor = 'text-emerald-300';
      balanceIcon = CheckCircle2;
    }

    return {
      timelineData: pointsWithMA,
      kpiStats: {
        totalAdded: total30dAdded,
        overallAvgDifficulty,
        highLevelRatio,
        countNB,
        countTH,
        countVD,
        countVDC,
        balanceAssessment,
        balanceColor,
        balanceIcon
      }
    };
  }, [questions, selectedRange]);

  // Custom Tooltip for Difficulty Trend Line Chart
  const CustomTrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: DayDataPoint = payload[0].payload;
      return (
        <div className="bg-[#190839]/95 backdrop-blur-md border border-theme-accent/50 p-3 rounded-[6px] shadow-2xl text-xs font-mono text-white min-w-[220px] max-w-[300px] pointer-events-none select-none z-[1000]">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Calendar className="w-3.5 h-3.5" />
              <span>Ngày: {data.displayDate} ({data.dateKey})</span>
            </div>
            <span className="px-1.5 py-0.2 rounded bg-white/10 text-[10px] text-slate-300">
              +{data.totalAdded} câu
            </span>
          </div>

          <div className="pt-2 space-y-1.5">
            {/* Daily Avg Score */}
            <div className="flex items-center justify-between">
              <span className="text-[#B6A6D8]">Độ khó TB ngày:</span>
              <span className="font-bold text-base text-amber-300">
                {data.avgDifficulty !== null ? `${data.avgDifficulty} / 4.0` : '—'}
              </span>
            </div>

            {/* 7-Day Moving Avg */}
            {data.movingAvg7 !== null && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-purple-300">Xu hướng TB trượt (MA-7):</span>
                <span className="font-bold text-purple-200">
                  {data.movingAvg7} / 4.0
                </span>
              </div>
            )}

            {/* Cognitive Levels Breakdown on that day */}
            {data.totalAdded > 0 && (
              <div className="pt-2 border-t border-white/10 space-y-1 text-[10.5px]">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Thành phần câu thêm mới:</div>
                <div className="grid grid-cols-2 gap-1 text-[10.5px]">
                  <span className="text-sky-300">Nhận biết: <strong>{data.nhanBiet}</strong></span>
                  <span className="text-emerald-300">Thông hiểu: <strong>{data.thongHieu}</strong></span>
                  <span className="text-amber-300">Vận dụng: <strong>{data.vanDung}</strong></span>
                  <span className="text-rose-300">V.Dụng cao: <strong>{data.vanDungCao}</strong></span>
                </div>
              </div>
            )}

            {/* Status note */}
            <div className="pt-1 text-[10px] text-slate-300 italic">
              💡 {data.statusLabel}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const BalanceIcon = kpiStats.balanceIcon;

  return (
    <div className={`fluent-card p-4 sm:p-5 rounded-[4px] bg-[#16072D] border border-theme-accent/30 space-y-4 shadow-xl animate-fadeIn ${className}`}>
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-purple-500/25 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-[4px] bg-gradient-to-br from-amber-500/30 to-purple-600/40 text-amber-300 border border-amber-400/40 shadow-md">
            <TrendingUp className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white font-mono uppercase tracking-wide">
                Độ Khó Trung Bình Câu Hỏi Bổ Sung ({selectedRange} Ngày Qua)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                Difficulty Trend &amp; Balance Monitoring
              </span>
            </div>
            <p className="text-xs text-[#B6A6D8] font-sans mt-0.5">
              Theo dõi biến thiên độ khó của các câu hỏi được nạp vào ngân hàng đề thi theo thời gian, bảo đảm tính cân bằng chuẩn hoá BTI 2026.
            </p>
          </div>
        </div>

        {/* Time range selector & view toggles */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          {/* Range buttons */}
          <div className="inline-flex rounded-[3px] bg-[#100421] p-0.5 border border-purple-500/30">
            {([7, 14, 30, 60] as TimeRangeOption[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setSelectedRange(r);
                }}
                className={`px-2.5 py-1 rounded-[2px] text-[11px] font-bold transition cursor-pointer ${
                  selectedRange === r
                    ? 'bg-theme-accent text-[#190839] shadow-sm'
                    : 'text-[#B6A6D8] hover:text-white hover:bg-white/5'
                }`}
              >
                {r} Ngày
              </button>
            ))}
          </div>

          {/* AI Difficulty Auto-Suggestion Batch Button */}
          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              setShowBatchModal(true);
            }}
            className="px-3 py-1 rounded-[3px] bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-md active:scale-95"
            title="Mở công cụ đối chiếu độ phức tạp và đề xuất mức độ nhận thức tự động cho ngân hàng câu hỏi"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>Gợi ý mức độ AI</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
        {/* Card 1: Average Difficulty */}
        <div className="p-3 rounded-[4px] bg-[#120424] border border-amber-500/30 space-y-1">
          <div className="text-[10.5px] text-[#B6A6D8] flex items-center justify-between">
            <span>ĐỘ KHÓ TB ({selectedRange}D)</span>
            <Target className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-300">
            {kpiStats.overallAvgDifficulty} <span className="text-xs font-normal text-slate-400">/ 4.0</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-sans">
            Mục tiêu chuẩn BTI: 2.0 &ndash; 2.6
          </div>
        </div>

        {/* Card 2: High Difficulty / Discrimination Ratio */}
        <div className="p-3 rounded-[4px] bg-[#120424] border border-purple-500/30 space-y-1">
          <div className="text-[10.5px] text-purple-300 flex items-center justify-between">
            <span>TỶ LỆ VẬN DỤNG &amp; VDC</span>
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-black text-purple-200">
            {kpiStats.highLevelRatio}%
          </div>
          <div className="text-[10px] text-slate-400 font-sans">
            {kpiStats.countVD + kpiStats.countVDC} / {kpiStats.totalAdded} câu phân hóa
          </div>
        </div>

        {/* Card 3: Total Added */}
        <div className="p-3 rounded-[4px] bg-[#120424] border border-sky-500/30 space-y-1">
          <div className="text-[10.5px] text-sky-300 flex items-center justify-between">
            <span>TỔNG CÂU BỔ SUNG</span>
            <Activity className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-black text-sky-200">
            {kpiStats.totalAdded} <span className="text-xs font-normal text-slate-400">câu</span>
          </div>
          <div className="text-[10px] text-sky-400/80 font-sans">
            Trong {selectedRange} ngày gần nhất
          </div>
        </div>

        {/* Card 4: Balance Assessment */}
        <div className="p-3 rounded-[4px] bg-[#120424] border border-emerald-500/30 space-y-1">
          <div className="text-[10.5px] text-emerald-300 flex items-center justify-between">
            <span>ĐÁNH GIÁ CÂN BẰNG</span>
            <BalanceIcon className={`w-3.5 h-3.5 ${kpiStats.balanceColor}`} />
          </div>
          <div className={`text-sm font-bold leading-tight ${kpiStats.balanceColor} line-clamp-1`}>
            {kpiStats.overallAvgDifficulty >= 1.9 && kpiStats.overallAvgDifficulty <= 2.7 ? 'Cân bằng tối ưu' : 'Cần điều chỉnh'}
          </div>
          <div className="text-[10px] text-slate-300 font-sans line-clamp-1">
            {kpiStats.balanceAssessment}
          </div>
        </div>
      </div>

      {/* 3. RECHARTS COMPOSED LINE & BAR CHART */}
      <div className="p-3 sm:p-4 rounded-[4px] bg-[#120424] border border-purple-500/25 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-[#B6A6D8]">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <span className="font-bold text-white">Biểu đồ biến thiên độ khó &amp; khối lượng câu hỏi</span>
          </div>
          <div className="flex items-center gap-3 text-[10.5px] hidden sm:flex">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
              <span className="text-emerald-300">Vùng cân bằng (2.0 - 2.6)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-purple-400 inline-block" />
              <span className="text-purple-300">Đường MA-7 trượt</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={timelineData}
              margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorAddedVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="lineGlowAmber" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#fcd34d" />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />

              {/* X-Axis: Date */}
              <XAxis
                dataKey="displayDate"
                stroke="#B6A6D8"
                fontSize={11}
                tickLine={false}
                interval="preserveStartEnd"
              />

              {/* Left Y-Axis: Difficulty Level (1.0 to 4.0) */}
              <YAxis
                yAxisId="difficultyAxis"
                domain={[1.0, 4.0]}
                ticks={[1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]}
                stroke="#fbbf24"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `${val.toFixed(1)}`}
                label={{ 
                  value: 'Độ khó (1-4)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  fill: '#fbbf24', 
                  fontSize: 10,
                  offset: 20
                }}
              />

              {/* Right Y-Axis: Question Additions Count */}
              {showVolumeBars && (
                <YAxis
                  yAxisId="volumeAxis"
                  orientation="right"
                  stroke="#a78bfa"
                  fontSize={10}
                  tickLine={false}
                  allowDecimals={false}
                  domain={[0, 'auto']}
                />
              )}

              {/* Target Balanced Zone Band (2.0 to 2.6) */}
              <ReferenceArea
                yAxisId="difficultyAxis"
                y1={2.0}
                y2={2.6}
                fill="rgba(52, 211, 153, 0.08)"
                stroke="#34d399"
                strokeDasharray="3 3"
                strokeOpacity={0.4}
              />

              {/* Benchmark Reference Line at 2.3 */}
              <ReferenceLine
                yAxisId="difficultyAxis"
                y={2.3}
                stroke="#34d399"
                strokeDasharray="4 4"
                label={{
                  value: 'Chuẩn BTI (2.30)',
                  fill: '#34d399',
                  fontSize: 10,
                  position: 'right'
                }}
              />

              <Tooltip content={<CustomTrendTooltip />} />

              <Legend 
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />

              {/* Volume Bars (Question Count added per day) */}
              {showVolumeBars && (
                <Bar
                  yAxisId="volumeAxis"
                  dataKey="totalAdded"
                  name="Số câu thêm mới"
                  fill="url(#colorAddedVolume)"
                  barSize={12}
                  radius={[3, 3, 0, 0]}
                />
              )}

              {/* Daily Average Difficulty Line */}
              <Line
                yAxisId="difficultyAxis"
                type="monotone"
                dataKey="avgDifficulty"
                name="Độ khó TB ngày"
                stroke="url(#lineGlowAmber)"
                strokeWidth={3}
                dot={{ r: 4, fill: '#fbbf24', stroke: '#190839', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#fff', stroke: '#f59e0b', strokeWidth: 3 }}
                connectNulls={true}
              />

              {/* 7-Day Moving Average Line */}
              {showMovingAverage && (
                <Line
                  yAxisId="difficultyAxis"
                  type="monotone"
                  dataKey="movingAvg7"
                  name="TB trượt 7 ngày (MA-7)"
                  stroke="#c084fc"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={false}
                  connectNulls={true}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Actionable Balance Recommendations Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-[4px] bg-[#120424] border border-purple-500/20 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Khuyến nghị Ban Đề Thi:</strong> Giữ chỉ số độ khó trung bình toàn ngân hàng trong khoảng <strong>2.0 &ndash; 2.6</strong> để đề thi đảm bảo tính phân hóa công bằng giữa các lượt đấu.
          </span>
        </div>

        {onFilterLevel && (
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <span className="text-[10.5px] text-[#B6A6D8]">Lọc theo mức độ:</span>
            <button
              type="button"
              onClick={() => onFilterLevel('VAN_DUNG_CAO')}
              className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 text-[10.5px] transition cursor-pointer"
            >
              Vận dụng cao
            </button>
            <button
              type="button"
              onClick={() => onFilterLevel('VAN_DUNG')}
              className="px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 text-[10.5px] transition cursor-pointer"
            >
              Vận dụng
            </button>
            <button
              type="button"
              onClick={() => onFilterLevel('THONG_HIEU')}
              className="px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 text-[10.5px] transition cursor-pointer"
            >
              Thông hiểu
            </button>
            <button
              type="button"
              onClick={() => onFilterLevel('NHAN_BIET')}
              className="px-2 py-0.5 rounded bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-500/40 text-[10.5px] transition cursor-pointer"
            >
              Nhận biết
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
