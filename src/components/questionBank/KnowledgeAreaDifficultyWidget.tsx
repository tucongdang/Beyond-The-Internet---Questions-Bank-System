import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Flame, 
  Percent, 
  Sliders, 
  Target, 
  ChevronRight, 
  Sparkles, 
  Layers, 
  Filter, 
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowUpDown,
  Maximize2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { QuestionItem, DigitalCompetencyDomainKey, CognitiveLevel, BtiRoundGroupKey } from '../../types';
import { DIGITAL_COMPETENCY_DOMAINS, COGNITIVE_LEVELS } from '../../data/digitalCompetencyData';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap } from '../../utils/hapticUtils';

export type ChartVisualizationType = 'STACKED_BAR' | 'NORMALIZED_BAR' | 'HEATMAP';
export type GroupDimensionType = 'DOMAINS' | 'CATEGORIES';

export interface KnowledgeAreaDifficultyWidgetProps {
  questions: QuestionItem[];
  onFilterDomainAndLevel?: (domainKey: string, level?: CognitiveLevel) => void;
  onOpenFullMatrix?: () => void;
  title?: string;
  defaultChartType?: ChartVisualizationType;
  compact?: boolean;
}

const DIFFICULTY_CONFIG: Record<CognitiveLevel, { name: string; shortName: string; color: string; benchmarkPct: number }> = {
  NHAN_BIET: { name: 'Nhận biết', shortName: 'NB', color: '#38bdf8', benchmarkPct: 30 },
  THONG_HIEU: { name: 'Thông hiểu', shortName: 'TH', color: '#34d399', benchmarkPct: 40 },
  VAN_DUNG: { name: 'Vận dụng', shortName: 'VD', color: '#fbbf24', benchmarkPct: 20 },
  VAN_DUNG_CAO: { name: 'Vận dụng cao', shortName: 'VDC', color: '#f43f5e', benchmarkPct: 10 }
};

const COGNITIVE_KEYS: CognitiveLevel[] = ['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'];

export const KnowledgeAreaDifficultyWidget: React.FC<KnowledgeAreaDifficultyWidgetProps> = ({
  questions,
  onFilterDomainAndLevel,
  onOpenFullMatrix,
  title = 'Phân Bố Miền Tri Thức & Mức Độ Nhận Thức (Knowledge Areas × Difficulty)',
  defaultChartType = 'STACKED_BAR',
  compact = false
}) => {
  // Chart visual type
  const [chartType, setChartType] = useState<ChartVisualizationType>(defaultChartType);
  
  // Group Dimension: 6 Domains (TT 02) or Subject Categories
  const [dimension, setDimension] = useState<GroupDimensionType>('DOMAINS');

  // Gameshow Round Filter
  const [selectedRound, setSelectedRound] = useState<BtiRoundGroupKey | 'ALL'>('ALL');

  // Sort order
  const [sortBy, setSortBy] = useState<'DEFAULT' | 'COUNT_DESC' | 'COUNT_ASC'>('DEFAULT');

  // Filter questions by gameshow round if specified
  const filteredQuestions = useMemo(() => {
    if (selectedRound === 'ALL') return questions;
    return questions.filter(q => {
      const r = q.round_group || (
        q.round_name?.includes('Khởi động') ? 'KHOI_DONG' :
        q.round_name?.includes('Vượt') ? 'VCNV' :
        q.round_name?.includes('Tăng') ? 'TANG_TOC' :
        q.round_name?.includes('Về đích') ? 'VE_DICH' : ''
      );
      return r === selectedRound;
    });
  }, [questions, selectedRound]);

  // Aggregate Data for Recharts Stacked Bar Chart & Heatmap
  const aggregatedData = useMemo(() => {
    if (dimension === 'DOMAINS') {
      const domainKeys: DigitalCompetencyDomainKey[] = ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'];

      const list = domainKeys.map(dKey => {
        const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
        const domQuestions = filteredQuestions.filter(q => {
          if (q.digital_competency_domain === dKey) return true;
          if (q.category && dom?.code && q.category.includes(dom.code)) return true;
          return false;
        });

        let nb = 0, th = 0, vd = 0, vdc = 0;
        domQuestions.forEach(q => {
          const lvl = q.cognitive_level || 'THONG_HIEU';
          if (lvl === 'NHAN_BIET') nb++;
          else if (lvl === 'THONG_HIEU') th++;
          else if (lvl === 'VAN_DUNG') vd++;
          else if (lvl === 'VAN_DUNG_CAO') vdc++;
          else th++;
        });

        const total = domQuestions.length;
        const nbPct = total > 0 ? Math.round((nb / total) * 100) : 0;
        const thPct = total > 0 ? Math.round((th / total) * 100) : 0;
        const vdPct = total > 0 ? Math.round((vd / total) * 100) : 0;
        const vdcPct = total > 0 ? Math.round((vdc / total) * 100) : 0;

        return {
          id: dKey,
          code: dom?.code || dKey,
          label: dom ? `${dom.code}. ${dom.name}` : dKey,
          shortName: dom?.name || dKey,
          domainColor: dom?.color || '#a855f7',
          NHAN_BIET: nb,
          THONG_HIEU: th,
          VAN_DUNG: vd,
          VAN_DUNG_CAO: vdc,
          NHAN_BIET_PCT: nbPct,
          THONG_HIEU_PCT: thPct,
          VAN_DUNG_PCT: vdPct,
          VAN_DUNG_CAO_PCT: vdcPct,
          total
        };
      });

      if (sortBy === 'COUNT_DESC') {
        return list.sort((a, b) => b.total - a.total);
      } else if (sortBy === 'COUNT_ASC') {
        return list.sort((a, b) => a.total - b.total);
      }
      return list;
    } else {
      // Group by Categories / Knowledge Topics
      const catMap = new Map<string, { nb: number; th: number; vd: number; vdc: number; total: number }>();

      filteredQuestions.forEach(q => {
        const cat = (q.category || 'Chưa phân loại').trim();
        if (!catMap.has(cat)) {
          catMap.set(cat, { nb: 0, th: 0, vd: 0, vdc: 0, total: 0 });
        }
        const record = catMap.get(cat)!;
        record.total++;
        const lvl = q.cognitive_level || 'THONG_HIEU';
        if (lvl === 'NHAN_BIET') record.nb++;
        else if (lvl === 'THONG_HIEU') record.th++;
        else if (lvl === 'VAN_DUNG') record.vd++;
        else if (lvl === 'VAN_DUNG_CAO') record.vdc++;
        else record.th++;
      });

      // Take top 8 categories
      const sorted = Array.from(catMap.entries())
        .map(([cat, stats], idx) => {
          const total = stats.total;
          return {
            id: `CAT_${idx}`,
            code: cat.length > 18 ? `${cat.substring(0, 16)}...` : cat,
            label: cat,
            shortName: cat,
            domainColor: '#818cf8',
            NHAN_BIET: stats.nb,
            THONG_HIEU: stats.th,
            VAN_DUNG: stats.vd,
            VAN_DUNG_CAO: stats.vdc,
            NHAN_BIET_PCT: total > 0 ? Math.round((stats.nb / total) * 100) : 0,
            THONG_HIEU_PCT: total > 0 ? Math.round((stats.th / total) * 100) : 0,
            VAN_DUNG_PCT: total > 0 ? Math.round((stats.vd / total) * 100) : 0,
            VAN_DUNG_CAO_PCT: total > 0 ? Math.round((stats.vdc / total) * 100) : 0,
            total
          };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 8);

      return sorted;
    }
  }, [dimension, filteredQuestions, sortBy]);

  // Overall Cognitive Level Totals & Assessment Benchmark
  const overallStats = useMemo(() => {
    let nb = 0, th = 0, vd = 0, vdc = 0;
    filteredQuestions.forEach(q => {
      const lvl = q.cognitive_level || 'THONG_HIEU';
      if (lvl === 'NHAN_BIET') nb++;
      else if (lvl === 'THONG_HIEU') th++;
      else if (lvl === 'VAN_DUNG') vd++;
      else if (lvl === 'VAN_DUNG_CAO') vdc++;
      else th++;
    });

    const total = filteredQuestions.length;
    return {
      total,
      counts: { NHAN_BIET: nb, THONG_HIEU: th, VAN_DUNG: vd, VAN_DUNG_CAO: vdc },
      pcts: {
        NHAN_BIET: total > 0 ? Math.round((nb / total) * 100) : 0,
        THONG_HIEU: total > 0 ? Math.round((th / total) * 100) : 0,
        VAN_DUNG: total > 0 ? Math.round((vd / total) * 100) : 0,
        VAN_DUNG_CAO: total > 0 ? Math.round((vdc / total) * 100) : 0
      }
    };
  }, [filteredQuestions]);

  // Max value in any cell for heatmap intensity calculation
  const maxHeatmapCellVal = useMemo(() => {
    let max = 1;
    aggregatedData.forEach(d => {
      max = Math.max(max, d.NHAN_BIET, d.THONG_HIEU, d.VAN_DUNG, d.VAN_DUNG_CAO);
    });
    return max;
  }, [aggregatedData]);

  // Heatmap background color interpolator
  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-[#180836]/60 border-white/5 text-slate-500';
    const ratio = count / maxHeatmapCellVal;
    if (ratio < 0.25) return 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200';
    if (ratio < 0.55) return 'bg-emerald-600/30 border-emerald-400/50 text-emerald-100 font-bold';
    if (ratio < 0.8) return 'bg-amber-500/30 border-amber-400/60 text-amber-200 font-black';
    return 'bg-gradient-to-br from-amber-500/40 to-rose-500/40 border-amber-400 text-white font-black shadow-md';
  };

  // Custom Recharts Tooltip
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataItem = aggregatedData.find(d => d.code === label || d.label === label);
    if (!dataItem) return null;

    return (
      <div className="p-3 rounded-[6px] bg-[#160731] border border-theme-accent/60 shadow-2xl text-xs space-y-2 max-w-xs font-sans">
        <div className="border-b border-white/10 pb-1.5 flex items-center justify-between gap-2">
          <div className="font-bold text-white font-mono text-[12px] truncate">
            {dataItem.label}
          </div>
          <span className="px-1.5 py-0.5 rounded bg-white/10 text-theme-accent font-mono font-bold text-[11px]">
            {dataItem.total} câu
          </span>
        </div>

        <div className="space-y-1 font-mono text-[11px]">
          {COGNITIVE_KEYS.map(key => {
            const cfg = DIFFICULTY_CONFIG[key];
            const count = (dataItem as any)[key] || 0;
            const pct = (dataItem as any)[`${key}_PCT`] || 0;
            return (
              <div key={key} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                  <span className="text-slate-300">{cfg.name}:</span>
                </div>
                <div className="font-bold text-white flex items-center gap-1">
                  <span>{count}</span>
                  <span className="text-slate-400 font-normal text-[10px]">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-1.5 border-t border-white/10 text-[10px] text-purple-200/80 font-sans italic flex items-center justify-between">
          <span>Chuẩn khảo thí BTI 2026</span>
          <span className="text-emerald-400 font-semibold">Tỷ lệ 30:40:20:10</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fluent-card p-4 sm:p-5 rounded-[8px] bg-gradient-to-br from-[#1C093B] via-[#16072E] to-[#100324] border border-theme-accent/35 shadow-xl space-y-4">
      {/* 1. Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-[6px] bg-gradient-to-br from-purple-600/30 to-amber-500/20 text-amber-300 border border-purple-400/40 shadow">
            {chartType === 'HEATMAP' ? <Flame className="w-5 h-5 text-amber-400" /> : <BarChart3 className="w-5 h-5 text-amber-300" />}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-mono uppercase tracking-wide flex items-center gap-2">
              <span>{title}</span>
              <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-purple-500/20 text-purple-200 border border-purple-400/30">
                Recharts
              </span>
            </h3>
            <p className="text-xs text-[#B6A6D8]">
              Tương quan phân bổ 6 Miền Tri Thức (TT 02/2025/TT-BGDĐT) và 4 Mức Độ Nhận Thức Bloom
            </p>
          </div>
        </div>

        {/* Action Controls & View Mode Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Chart View Mode Switcher */}
          <div className="inline-flex rounded-[4px] bg-black/40 p-0.5 border border-white/15 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setChartType('STACKED_BAR');
              }}
              className={`px-2.5 py-1 rounded-[3px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                chartType === 'STACKED_BAR'
                  ? 'bg-theme-accent text-[#190839] shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title="Biểu đồ cột xếp chồng (Stacked Bar Chart)"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cột Xếp Chồng</span>
            </button>

            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setChartType('NORMALIZED_BAR');
              }}
              className={`px-2.5 py-1 rounded-[3px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                chartType === 'NORMALIZED_BAR'
                  ? 'bg-theme-accent text-[#190839] shadow'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title="Biểu đồ tỷ lệ chuẩn hóa 100% (100% Normalized)"
            >
              <Percent className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tỷ Lệ 100%</span>
            </button>

            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setChartType('HEATMAP');
              }}
              className={`px-2.5 py-1 rounded-[3px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                chartType === 'HEATMAP'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow'
                  : 'text-amber-300/80 hover:text-amber-200 hover:bg-white/5'
              }`}
              title="Ma trận nhiệt 2D trực quan (Matrix Heatmap)"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Bản Đồ Nhiệt 2D</span>
            </button>
          </div>

          {/* Dimension Toggle: Domains vs Categories */}
          <div className="inline-flex rounded-[4px] bg-black/40 p-0.5 border border-white/15 text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setDimension('DOMAINS');
              }}
              className={`px-2 py-1 rounded-[3px] transition cursor-pointer ${
                dimension === 'DOMAINS'
                  ? 'bg-purple-600/40 text-purple-200 font-bold border border-purple-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Nhóm theo 6 Miền Năng Lực Số Chuẩn TT 02"
            >
              6 Miền TT 02
            </button>
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setDimension('CATEGORIES');
              }}
              className={`px-2 py-1 rounded-[3px] transition cursor-pointer ${
                dimension === 'CATEGORIES'
                  ? 'bg-purple-600/40 text-purple-200 font-bold border border-purple-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Nhóm theo Chủ đề câu hỏi (Custom Categories)"
            >
              Chủ Đề
            </button>
          </div>

          {/* Gameshow Round Filter Dropdown */}
          <select
            value={selectedRound}
            onChange={(e) => {
              vibrateTap();
              soundFx.playClick();
              setSelectedRound(e.target.value as any);
            }}
            className="bg-black/50 border border-white/20 px-2 py-1 rounded-[4px] text-xs font-mono text-purple-200 outline-none cursor-pointer focus:border-theme-accent"
          >
            <option value="ALL" className="bg-[#190839]">Tất cả vòng thi</option>
            <option value="KHOI_DONG" className="bg-[#190839]">1. Khởi Động</option>
            <option value="VCNV" className="bg-[#190839]">2. VCNV</option>
            <option value="TANG_TOC" className="bg-[#190839]">3. Tăng Tốc</option>
            <option value="VE_DICH" className="bg-[#190839]">4. Về Đích</option>
          </select>

          {/* Full Matrix Navigation */}
          {onOpenFullMatrix && (
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                onOpenFullMatrix();
              }}
              className="p-1.5 rounded-[4px] bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition cursor-pointer border border-white/10"
              title="Mở toàn màn hình Bảng Ma Trận Chi Tiết 6x4"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Metric Benchmark Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
        {COGNITIVE_KEYS.map(key => {
          const cfg = DIFFICULTY_CONFIG[key];
          const count = overallStats.counts[key];
          const pct = overallStats.pcts[key];
          const diffFromBenchmark = pct - cfg.benchmarkPct;

          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                onFilterDomainAndLevel?.('ALL', key);
              }}
              className="p-2.5 rounded-[6px] bg-black/40 border border-white/10 hover:border-theme-accent/50 text-left transition cursor-pointer space-y-1 hover:bg-white/5"
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 font-bold" style={{ color: cfg.color }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <span>{cfg.name}</span>
                </div>
                <span className="text-white font-black text-sm">{count} câu</span>
              </div>

              {/* Progress bar vs Benchmark */}
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden flex">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: cfg.color }} />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Hiện tại: <strong className="text-white">{pct}%</strong></span>
                <span className="text-[9.5px]">Chuẩn: <strong>{cfg.benchmarkPct}%</strong></span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Main Visualization Area */}
      {chartType === 'HEATMAP' ? (
        /* ================= 2D HEATMAP GRID VIEW ================= */
        <div className="space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span className="flex items-center gap-1.5 text-amber-300">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>BẢN ĐỒ NHIỆT MẬT ĐỘ CÂU HỎI (2D MATRIX HEATMAP)</span>
            </span>
            <div className="flex items-center gap-2 text-[10.5px]">
              <span className="text-slate-400">Thang nhiệt:</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#180836] border border-white/10">0 câu</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-900/60 border border-emerald-500/40 text-emerald-200">Ít</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/40 border border-amber-400/60 text-amber-200 font-bold">Vừa</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/50 border border-rose-400 text-white font-bold">Nhiều 🔥</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse border border-white/10 rounded-[6px] overflow-hidden">
              <thead>
                <tr className="bg-[#241048] border-b border-white/15 text-slate-200 text-[11px]">
                  <th className="p-2.5 text-left font-bold w-1/3">
                    {dimension === 'DOMAINS' ? 'Miền Năng Lực Số (TT 02)' : 'Chủ Đề Tri Thức'}
                  </th>
                  {COGNITIVE_KEYS.map(k => (
                    <th key={k} className="p-2.5 text-center font-bold" style={{ color: DIFFICULTY_CONFIG[k].color }}>
                      {DIFFICULTY_CONFIG[k].name} ({DIFFICULTY_CONFIG[k].shortName})
                    </th>
                  ))}
                  <th className="p-2.5 text-center font-bold text-white bg-black/40">Tổng Số</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {aggregatedData.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition">
                    <td className="p-2.5 font-bold text-white flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.domainColor }} />
                      <span className="truncate max-w-xs" title={row.label}>{row.label}</span>
                    </td>

                    {COGNITIVE_KEYS.map(k => {
                      const count = (row as any)[k] || 0;
                      const cellColor = getHeatmapColor(count);

                      return (
                        <td key={k} className="p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              vibrateTap();
                              soundFx.playClick();
                              onFilterDomainAndLevel?.(row.id, k);
                            }}
                            className={`w-full py-2 rounded-[4px] border transition cursor-pointer flex flex-col items-center justify-center ${cellColor} hover:scale-105 active:scale-95`}
                            title={`Xem danh sách các câu hỏi thuộc ${row.label} - Mức độ ${DIFFICULTY_CONFIG[k].name} (${count} câu)`}
                          >
                            <span className="text-[13px]">{count}</span>
                            {count > 0 && row.total > 0 && (
                              <span className="text-[9.5px] opacity-70">
                                {Math.round((count / row.total) * 100)}%
                              </span>
                            )}
                          </button>
                        </td>
                      );
                    })}

                    <td className="p-2.5 text-center font-black text-amber-300 bg-black/20 text-sm">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#1C093B] border-t-2 border-theme-accent/40 font-bold text-white">
                  <td className="p-2.5 uppercase font-mono">TỔNG TOÀN BỘ</td>
                  {COGNITIVE_KEYS.map(k => (
                    <td key={k} className="p-2.5 text-center font-black" style={{ color: DIFFICULTY_CONFIG[k].color }}>
                      {overallStats.counts[k]}
                      <span className="block text-[10px] font-normal text-slate-400">
                        {overallStats.pcts[k]}%
                      </span>
                    </td>
                  ))}
                  <td className="p-2.5 text-center font-black text-amber-300 text-base bg-black/40">
                    {overallStats.total}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        /* ================= RECHARTS STACKED BAR CHART ================= */
        <div className="space-y-2 animate-fadeIn">
          <div className="h-72 sm:h-80 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={aggregatedData} 
                margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis 
                  dataKey="code" 
                  stroke="#B6A6D8" 
                  fontSize={11} 
                  tickLine={false} 
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis 
                  stroke="#B6A6D8" 
                  fontSize={11} 
                  tickLine={false} 
                  unit={chartType === 'NORMALIZED_BAR' ? '%' : ''}
                  domain={chartType === 'NORMALIZED_BAR' ? [0, 100] : ['auto', 'auto']}
                />
                <Tooltip 
                  content={renderCustomTooltip} 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                />
                <Legend 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                  iconType="circle"
                />

                {/* Stacked Bars for 4 Cognitive Levels */}
                <Bar 
                  dataKey={chartType === 'NORMALIZED_BAR' ? 'NHAN_BIET_PCT' : 'NHAN_BIET'} 
                  name="Nhận biết" 
                  stackId="diff" 
                  fill={DIFFICULTY_CONFIG.NHAN_BIET.color} 
                />
                <Bar 
                  dataKey={chartType === 'NORMALIZED_BAR' ? 'THONG_HIEU_PCT' : 'THONG_HIEU'} 
                  name="Thông hiểu" 
                  stackId="diff" 
                  fill={DIFFICULTY_CONFIG.THONG_HIEU.color} 
                />
                <Bar 
                  dataKey={chartType === 'NORMALIZED_BAR' ? 'VAN_DUNG_PCT' : 'VAN_DUNG'} 
                  name="Vận dụng" 
                  stackId="diff" 
                  fill={DIFFICULTY_CONFIG.VAN_DUNG.color} 
                />
                <Bar 
                  dataKey={chartType === 'NORMALIZED_BAR' ? 'VAN_DUNG_CAO_PCT' : 'VAN_DUNG_CAO'} 
                  name="Vận dụng cao" 
                  stackId="diff" 
                  fill={DIFFICULTY_CONFIG.VAN_DUNG_CAO.color} 
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">💡 Phân tích sư phạm:</span>
              <span>
                {overallStats.pcts.VAN_DUNG_CAO < 8 
                  ? 'Tỷ lệ câu Vận dụng cao đang dưới 8%. Khuyến nghị bổ sung thêm câu hỏi phân loại học sinh giỏi.'
                  : 'Phân bố độ khó đang tiệm cận tỷ lệ chuẩn hóa khảo thí BTI 2026.'}
              </span>
            </div>

            {onOpenFullMatrix && (
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onOpenFullMatrix();
                }}
                className="text-theme-accent hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <span>Chi tiết Ma Trận 6x4 TT 02</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
