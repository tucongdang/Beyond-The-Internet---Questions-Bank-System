import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  PieChart as PieIcon,
  Target,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Layers,
  Filter,
  ArrowUpDown,
  Maximize2,
  ChevronRight,
  Plus,
  Info,
  Sliders,
  TrendingUp,
  Flame,
  Award,
  Zap,
  HelpCircle,
  Search,
  ExternalLink,
  RefreshCw,
  X
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
  Cell,
  ReferenceLine,
  PieChart,
  Pie,
  Sector
} from 'recharts';
import {
  QuestionItem,
  DigitalCompetencyDomainKey,
  CognitiveLevel
} from '../../types';
import {
  DIGITAL_COMPETENCY_DOMAINS,
  COGNITIVE_LEVELS,
  CompetencySubItem
} from '../../data/digitalCompetencyData';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap } from '../../utils/hapticUtils';

interface BtiCompetencyVisualDashboardProps {
  questions: QuestionItem[];
  onFilterQuestionsBySkill?: (domainKey: DigitalCompetencyDomainKey, subCode?: string, level?: CognitiveLevel) => void;
  onOpenAddQuestionForSkill?: (domainKey: DigitalCompetencyDomainKey, subCode?: string, level?: CognitiveLevel) => void;
  onNavigateToFullMatrix?: () => void;
}

export type ChartOrientation = 'HORIZONTAL' | 'VERTICAL';
export type SkillSortMode = 'DEFAULT' | 'COUNT_DESC' | 'COUNT_ASC' | 'GAP_DESC';
export type BarChartType = 'SUB_COMPETENCY' | 'DOMAIN_LEVEL_STACKED' | 'DOMAIN_LEVEL_GROUPED' | 'GAP_DEFICIT';

interface SubCompetencyStatItem {
  code: string;
  name: string;
  shortName: string;
  description: string;
  domainKey: DigitalCompetencyDomainKey;
  domainCode: string;
  domainName: string;
  domainColor: string;
  count: number;
  target: number;
  deficit: number;
  isMet: boolean;
  isZero: boolean;
  byLevel: Record<CognitiveLevel, number>;
  sampleQuestions: QuestionItem[];
}

export const BtiCompetencyVisualDashboard: React.FC<BtiCompetencyVisualDashboardProps> = ({
  questions,
  onFilterQuestionsBySkill,
  onOpenAddQuestionForSkill,
  onNavigateToFullMatrix
}) => {
  // Config & Filter States
  const [targetPerSkill, setTargetPerSkill] = useState<number>(3);
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<DigitalCompetencyDomainKey | 'ALL'>('ALL');
  const [chartOrientation, setChartOrientation] = useState<ChartOrientation>('HORIZONTAL');
  const [skillSortMode, setSkillSortMode] = useState<SkillSortMode>('DEFAULT');
  const [barChartType, setBarChartType] = useState<BarChartType>('SUB_COMPETENCY');
  const [selectedSkillModal, setSelectedSkillModal] = useState<SubCompetencyStatItem | null>(null);

  // Active Pie Chart hover index
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  const domainKeys: DigitalCompetencyDomainKey[] = ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'];
  const cognitiveLevels: CognitiveLevel[] = ['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'];

  // Color palette for domains
  const domainColors: Record<DigitalCompetencyDomainKey, string> = {
    MIEN_1: '#38bdf8', // sky-400
    MIEN_2: '#a855f7', // purple-500
    MIEN_3: '#ec4899', // pink-500
    MIEN_4: '#ef4444', // red-500
    MIEN_5: '#f59e0b', // amber-500
    MIEN_6: '#10b981', // emerald-500
  };

  const cognitiveLevelColors: Record<CognitiveLevel, string> = {
    NHAN_BIET: '#38bdf8',
    THONG_HIEU: '#34d399',
    VAN_DUNG: '#fbbf24',
    VAN_DUNG_CAO: '#f43f5e',
  };

  // 1. Calculate All 24 Sub-Competencies Statistics
  const subCompetencyStats = useMemo(() => {
    const list: SubCompetencyStatItem[] = [];

    domainKeys.forEach(dKey => {
      const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
      if (!dom || !dom.subCompetencies) return;

      dom.subCompetencies.forEach(sub => {
        // Match questions that belong to this sub-competency
        const matchedQuestions = questions.filter(q => {
          if (q.digital_sub_competency === sub.code) return true;
          // Fallback matching by domain and category / text
          const hasDomain = q.digital_competency_domain === dKey || q.category?.includes(dom.code);
          if (hasDomain) {
            const text = (q.question_text || '').toLowerCase();
            const words = sub.name.toLowerCase().split(' ').filter(w => w.length > 3);
            return words.slice(0, 3).some(w => text.includes(w));
          }
          return false;
        });

        const byLevel: Record<CognitiveLevel, number> = {
          NHAN_BIET: 0,
          THONG_HIEU: 0,
          VAN_DUNG: 0,
          VAN_DUNG_CAO: 0
        };

        matchedQuestions.forEach(q => {
          const l = q.cognitive_level || 'THONG_HIEU';
          if (byLevel[l] !== undefined) byLevel[l]++;
          else byLevel.THONG_HIEU++;
        });

        const count = matchedQuestions.length;
        const deficit = Math.max(0, targetPerSkill - count);

        list.push({
          code: sub.code,
          name: sub.name,
          shortName: `${sub.code} ${sub.name.slice(0, 26)}...`,
          description: sub.description,
          domainKey: dKey,
          domainCode: dom.code,
          domainName: dom.name,
          domainColor: domainColors[dKey],
          count,
          target: targetPerSkill,
          deficit,
          isMet: count >= targetPerSkill,
          isZero: count === 0,
          byLevel,
          sampleQuestions: matchedQuestions
        });
      });
    });

    return list;
  }, [questions, targetPerSkill]);

  // 2. Filter & Sort Sub-Competency Data for Bar Charts
  const filteredSortedSubStats = useMemo(() => {
    let result = subCompetencyStats.slice();

    // Filter by Domain
    if (selectedDomainFilter !== 'ALL') {
      result = result.filter(item => item.domainKey === selectedDomainFilter);
    }

    // Sort
    if (skillSortMode === 'COUNT_DESC') {
      result.sort((a, b) => b.count - a.count);
    } else if (skillSortMode === 'COUNT_ASC') {
      result.sort((a, b) => a.count - b.count);
    } else if (skillSortMode === 'GAP_DESC') {
      result.sort((a, b) => b.deficit - a.deficit || a.count - b.count);
    } else {
      // Default order: 1.1 -> 6.3
      result.sort((a, b) => {
        const [aMaj, aMin] = a.code.split('.').map(Number);
        const [bMaj, bMin] = b.code.split('.').map(Number);
        if (aMaj !== bMaj) return aMaj - bMaj;
        return aMin - bMin;
      });
    }

    return result;
  }, [subCompetencyStats, selectedDomainFilter, skillSortMode]);

  // 3. Data for Pie Chart 1: Domain Distribution
  const domainPieData = useMemo(() => {
    return domainKeys.map(dKey => {
      const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
      const count = questions.filter(q => {
        if (q.digital_competency_domain === dKey) return true;
        if (q.category?.includes(dom.code)) return true;
        return false;
      }).length;

      const subItems = subCompetencyStats.filter(s => s.domainKey === dKey);
      const metSubs = subItems.filter(s => s.isMet).length;

      return {
        name: dom.name,
        code: dom.code,
        domainKey: dKey,
        value: count,
        color: domainColors[dKey],
        subCount: subItems.length,
        metSubs
      };
    });
  }, [questions, subCompetencyStats]);

  // 4. Data for Pie Chart 2: Cognitive Levels Distribution
  const cognitivePieData = useMemo(() => {
    const counts: Record<CognitiveLevel, number> = {
      NHAN_BIET: 0,
      THONG_HIEU: 0,
      VAN_DUNG: 0,
      VAN_DUNG_CAO: 0
    };

    questions.forEach(q => {
      const l = q.cognitive_level || 'THONG_HIEU';
      if (counts[l] !== undefined) counts[l]++;
      else counts.THONG_HIEU++;
    });

    return [
      { name: 'Nhận biết', level: 'NHAN_BIET', value: counts.NHAN_BIET, color: cognitiveLevelColors.NHAN_BIET, benchmarkPct: '40%' },
      { name: 'Thông hiểu', level: 'THONG_HIEU', value: counts.THONG_HIEU, color: cognitiveLevelColors.THONG_HIEU, benchmarkPct: '30%' },
      { name: 'Vận dụng', level: 'VAN_DUNG', value: counts.VAN_DUNG, color: cognitiveLevelColors.VAN_DUNG, benchmarkPct: '20%' },
      { name: 'Vận dụng cao', level: 'VAN_DUNG_CAO', value: counts.VAN_DUNG_CAO, color: cognitiveLevelColors.VAN_DUNG_CAO, benchmarkPct: '10%' },
    ];
  }, [questions]);

  // 5. Data for Pie Chart 3: Skill Coverage Status Donut
  const coverageStatusPieData = useMemo(() => {
    let met = 0;
    let deficit = 0;
    let zero = 0;

    subCompetencyStats.forEach(item => {
      if (item.isZero) zero++;
      else if (item.isMet) met++;
      else deficit++;
    });

    return [
      { name: `Đạt chuẩn (≥${targetPerSkill} câu)`, value: met, color: '#10b981', status: 'MET' },
      { name: `Thiếu câu (<${targetPerSkill} câu)`, value: deficit, color: '#f59e0b', status: 'DEFICIT' },
      { name: 'Trắng hoàn toàn (0 câu)', value: zero, color: '#f43f5e', status: 'ZERO' }
    ];
  }, [subCompetencyStats, targetPerSkill]);

  // 6. Data for Domain Stacked/Grouped Bar Chart (6 Domains x 4 Levels)
  const domainStackedBarData = useMemo(() => {
    return domainKeys.map(dKey => {
      const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
      const domQuestions = questions.filter(q => {
        if (q.digital_competency_domain === dKey) return true;
        if (q.category?.includes(dom.code)) return true;
        return false;
      });

      let nb = 0, th = 0, vd = 0, vdc = 0;
      domQuestions.forEach(q => {
        const l = q.cognitive_level || 'THONG_HIEU';
        if (l === 'NHAN_BIET') nb++;
        else if (l === 'THONG_HIEU') th++;
        else if (l === 'VAN_DUNG') vd++;
        else if (l === 'VAN_DUNG_CAO') vdc++;
        else th++;
      });

      return {
        domainCode: dom.code,
        domainName: dom.name,
        'Nhận biết': nb,
        'Thông hiểu': th,
        'Vận dụng': vd,
        'Vận dụng cao': vdc,
        total: domQuestions.length
      };
    });
  }, [questions]);

  // 7. Data for Gap Deficit Bar Chart (Skills needing questions)
  const gapDeficitBarData = useMemo(() => {
    return subCompetencyStats
      .filter(item => item.deficit > 0)
      .sort((a, b) => b.deficit - a.deficit)
      .map(item => ({
        code: item.code,
        shortName: `${item.code} ${item.name.slice(0, 20)}...`,
        name: item.name,
        domainCode: item.domainCode,
        domainColor: item.domainColor,
        count: item.count,
        deficit: item.deficit,
        target: item.target
      }));
  }, [subCompetencyStats]);

  // Key KPI Metrics
  const kpis = useMemo(() => {
    const totalSkills = subCompetencyStats.length; // 24 skills
    const coveredSkills = subCompetencyStats.filter(s => s.count > 0).length;
    const metSkills = subCompetencyStats.filter(s => s.isMet).length;
    const zeroSkills = subCompetencyStats.filter(s => s.isZero).length;
    const coverageRate = Math.round((coveredSkills / totalSkills) * 100);
    const metRate = Math.round((metSkills / totalSkills) * 100);

    // Find top skill & top deficit skill
    const sortedByCount = [...subCompetencyStats].sort((a, b) => b.count - a.count);
    const sortedByDeficit = [...subCompetencyStats].sort((a, b) => b.deficit - a.deficit);

    const topSkill = sortedByCount[0] || null;
    const topDeficitSkill = sortedByDeficit.find(s => s.deficit > 0) || null;

    return {
      totalSkills,
      coveredSkills,
      metSkills,
      zeroSkills,
      coverageRate,
      metRate,
      topSkill,
      topDeficitSkill
    };
  }, [subCompetencyStats]);

  const totalQuestions = questions.length;

  // Handler: Click Bar/Pie to inspect skill
  const handleBarClick = (data: any) => {
    if (!data) return;
    vibrateTap();
    soundFx.playClick();

    const code = data.code;
    const found = subCompetencyStats.find(s => s.code === code);
    if (found) {
      setSelectedSkillModal(found);
    }
  };

  return (
    <div className="fluent-card p-4 sm:p-6 bg-[#16072D] border border-theme-accent/40 rounded-[4px] space-y-6 text-slate-100 animate-fadeIn relative">
      
      {/* 1. Header Banner & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-purple-500/25 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[4px] bg-gradient-to-br from-amber-500 via-purple-600 to-indigo-700 text-slate-950 font-bold shadow-lg border border-amber-400/40">
            <PieIcon className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white font-mono uppercase tracking-tight">
                Bảng Điều Khiển Trực Quan Recharts Ma Trận Độ Phủ
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                TT 02/2025/TT-BGDĐT
              </span>
            </div>
            <p className="text-xs text-[#B6A6D8] mt-0.5 font-mono">
              Biểu đồ Tròn &amp; Cột phân tích độ phủ 24 Kỹ năng Năng lực số, 6 Miền &amp; 4 Mức độ nhận thức BTI 2026.
            </p>
          </div>
        </div>

        {/* Global Controls: Target Selector & Shortcuts */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-[#100421] px-3 py-1.5 rounded-[4px] border border-purple-500/30 text-xs font-mono">
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300">Chỉ tiêu / Kỹ năng:</span>
            <select
              value={targetPerSkill}
              onChange={(e) => {
                vibrateTap();
                setTargetPerSkill(Number(e.target.value));
              }}
              className="bg-[#1C093B] text-amber-300 font-bold border border-amber-500/40 rounded px-2 py-0.5 focus:outline-none cursor-pointer"
            >
              <option value={1}>≥ 1 câu (Cơ bản)</option>
              <option value={2}>≥ 2 câu / kỹ năng</option>
              <option value={3}>≥ 3 câu (Khuyên dùng BTI)</option>
              <option value={5}>≥ 5 câu (Ngân hàng phong phú)</option>
            </select>
          </div>

          {onNavigateToFullMatrix && (
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                onNavigateToFullMatrix();
              }}
              className="px-3 py-1.5 bg-[#241148] hover:bg-[#341866] text-amber-300 border border-amber-400/40 rounded-[4px] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Ma Trận 6x4 Lưới</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Skill Coverage Rate */}
        <div className="p-3.5 rounded-[4px] bg-[#1a0838] border border-purple-500/30 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span>Độ Phủ 24 Kỹ Năng</span>
            <Target className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-sky-300 font-mono">
              {kpis.coverageRate}%
            </strong>
            <span className="text-[11px] font-mono text-slate-400">
              ({kpis.coveredSkills}/24 kỹ năng)
            </span>
          </div>
          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-sky-500/20">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${kpis.coverageRate}%` }}
            />
          </div>
        </div>

        {/* Card 2: Met Target Rate */}
        <div className="p-3.5 rounded-[4px] bg-[#1a0838] border border-purple-500/30 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span>Đạt Chuẩn Chỉ Tiêu</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-emerald-300 font-mono">
              {kpis.metRate}%
            </strong>
            <span className="text-[11px] font-mono text-slate-400">
              ({kpis.metSkills}/24 đạt ≥{targetPerSkill} câu)
            </span>
          </div>
          <p className="text-[10.5px] text-emerald-200/80 font-mono truncate">
            {kpis.metSkills === 24 ? '✓ Hoàn thành 100% chỉ tiêu!' : `Còn ${24 - kpis.metSkills} kỹ năng cần thêm câu`}
          </p>
        </div>

        {/* Card 3: Top Performing Skill */}
        <div className="p-3.5 rounded-[4px] bg-[#1a0838] border border-purple-500/30 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span>Kỹ Năng Phủ Mạnh Nhất</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          {kpis.topSkill ? (
            <div>
              <div className="flex items-baseline gap-1.5 truncate">
                <span className="font-mono font-bold text-amber-300 text-sm">{kpis.topSkill.code}:</span>
                <span className="text-xs font-medium text-slate-200 truncate">{kpis.topSkill.name}</span>
              </div>
              <p className="text-[11px] font-mono text-amber-200/80 mt-0.5">
                {kpis.topSkill.count} câu hỏi ({Math.round((kpis.topSkill.count / Math.max(1, totalQuestions)) * 100)}% tổng số)
              </p>
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-mono">Chưa có dữ liệu</span>
          )}
        </div>

        {/* Card 4: Top Bottleneck / Gap */}
        <div className="p-3.5 rounded-[4px] bg-rose-950/30 border border-rose-500/40 space-y-1 shadow-md">
          <div className="flex items-center justify-between text-xs font-mono text-rose-300">
            <span>Cần Ưu Tiên Bổ Sung</span>
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          {kpis.topDeficitSkill ? (
            <div>
              <div className="flex items-baseline gap-1.5 truncate">
                <span className="font-mono font-bold text-rose-300 text-sm">{kpis.topDeficitSkill.code}:</span>
                <span className="text-xs font-medium text-slate-200 truncate">{kpis.topDeficitSkill.name}</span>
              </div>
              <p className="text-[11px] font-mono text-rose-300 mt-0.5">
                Hiện có {kpis.topDeficitSkill.count} câu (Thiếu {kpis.topDeficitSkill.deficit} câu)
              </p>
            </div>
          ) : (
            <span className="text-xs text-emerald-300 font-mono">Không có kỹ năng nào thiếu!</span>
          )}
        </div>
      </div>

      {/* 3. ROW OF PIE / DONUT CHARTS (3 Biểu Đồ Tròn Trực Quan) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold font-mono text-amber-300 uppercase tracking-wide">
              I. CƠ CẤU ĐỘ PHỦ THEO BIỂU ĐỒ TRÒN (PIE &amp; DONUT CHARTS)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Bấm vào lát cắt hoặc nhãn để lọc kỹ năng
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Pie Chart 1: Domain Share (6 Miền) */}
          <div className="p-3.5 bg-[#120424] border border-purple-500/30 rounded-[4px] space-y-2 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-sky-300">1. Tỷ Trọng 6 Miền Năng Lực</span>
              <span className="text-[10.5px] font-mono text-slate-400">{totalQuestions} câu</span>
            </div>

            <div className="h-56 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1C093B', borderColor: '#8b5cf6', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} câu hỏi (${Math.round((Number(val) / Math.max(1, totalQuestions)) * 100)}%)`,
                      `${item.payload.code}: ${item.payload.name}`
                    ]}
                  />
                  <Pie
                    data={domainPieData}
                    dataKey="value"
                    nameKey="code"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    onClick={(entry: any) => {
                      vibrateTap();
                      soundFx.playClick();
                      const key = entry?.domainKey || entry?.payload?.domainKey;
                      if (key) {
                        setSelectedDomainFilter(key as DigitalCompetencyDomainKey);
                      }
                    }}
                    cursor="pointer"
                  >
                    {domainPieData.map((entry, index) => (
                      <Cell
                        key={`domain-cell-${index}`}
                        fill={entry.color}
                        stroke={selectedDomainFilter === entry.domainKey ? '#fbbf24' : '#1C093B'}
                        strokeWidth={selectedDomainFilter === entry.domainKey ? 3 : 1}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center donut metric */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-lg font-mono font-black text-amber-300">{totalQuestions}</span>
                <span className="text-[9.5px] font-mono text-slate-300 uppercase">Câu hỏi</span>
              </div>
            </div>

            {/* Quick legend buttons */}
            <div className="grid grid-cols-3 gap-1 pt-1 text-[10.5px] font-mono">
              {domainPieData.map(d => (
                <button
                  key={d.domainKey}
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    setSelectedDomainFilter(prev => prev === d.domainKey ? 'ALL' : d.domainKey as DigitalCompetencyDomainKey);
                  }}
                  className={`px-1.5 py-1 rounded text-left transition flex items-center gap-1 cursor-pointer truncate border ${
                    selectedDomainFilter === d.domainKey
                      ? 'bg-amber-500/30 border-amber-400 text-white font-bold'
                      : 'bg-black/30 border-white/10 text-slate-300 hover:text-white'
                  }`}
                  title={`${d.code}: ${d.name} (${d.value} câu)`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="truncate">{d.code}</span>
                  <span className="font-bold ml-auto">{d.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pie Chart 2: Cognitive Levels Distribution */}
          <div className="p-3.5 bg-[#120424] border border-purple-500/30 rounded-[4px] space-y-2 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-300">2. Cơ Cấu 4 Mức Độ Nhận Thức</span>
              <span className="text-[10.5px] font-mono text-slate-400">Chuẩn 40-30-20-10</span>
            </div>

            <div className="h-56 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1C093B', borderColor: '#8b5cf6', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} câu (${Math.round((Number(val) / Math.max(1, totalQuestions)) * 100)}%) | Chuẩn BTI: ${item.payload.benchmarkPct}`,
                      item.payload.name
                    ]}
                  />
                  <Pie
                    data={cognitivePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    paddingAngle={2}
                    cursor="pointer"
                  >
                    {cognitivePieData.map((entry, index) => (
                      <Cell key={`cog-cell-${index}`} fill={entry.color} stroke="#1C093B" strokeWidth={1} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Cognitive Level breakdown cards */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10.5px] font-mono">
              {cognitivePieData.map(l => (
                <div key={l.level} className="p-1.5 rounded bg-black/30 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                    <span className="text-slate-200 truncate">{l.name}</span>
                  </div>
                  <div className="font-bold text-white shrink-0 ml-1">
                    {l.value} <span className="text-[9px] text-slate-400 font-normal">({l.benchmarkPct})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pie Chart 3: Skill Coverage Achievement Donut */}
          <div className="p-3.5 bg-[#120424] border border-purple-500/30 rounded-[4px] space-y-2 flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-300">3. Trạng Thái Đạt Chuẩn 24 Kỹ Năng</span>
              <span className="text-[10.5px] font-mono text-slate-400">Target ≥ {targetPerSkill}</span>
            </div>

            <div className="h-56 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1C093B', borderColor: '#8b5cf6', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any, name: any) => [`${val}/24 kỹ năng (${Math.round((Number(val) / 24) * 100)}%)`, name]}
                  />
                  <Pie
                    data={coverageStatusPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    cursor="pointer"
                  >
                    {coverageStatusPieData.map((entry, index) => (
                      <Cell key={`status-cell-${index}`} fill={entry.color} stroke="#1C093B" strokeWidth={1} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-lg font-mono font-black text-emerald-300">{kpis.metSkills}/24</span>
                <span className="text-[9.5px] font-mono text-slate-300 uppercase">Đạt chuẩn</span>
              </div>
            </div>

            <div className="space-y-1 pt-1 text-[11px] font-mono">
              {coverageStatusPieData.map(s => (
                <div key={s.name} className="flex items-center justify-between px-2 py-1 rounded bg-black/30 border border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-slate-300 text-[10.5px]">{s.name}</span>
                  </div>
                  <strong className="text-white font-bold">{s.value} kỹ năng</strong>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 4. MAIN BAR CHART SECTION (Biểu Đồ Cột 24 Kỹ Năng / Xếp Chồng / Gap Deficit) */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold font-mono text-amber-300 uppercase tracking-wide">
              II. BIỂU ĐỒ CỘT ĐỘ PHỦ KỸ NĂNG &amp; MA TRẬN BTI
            </h3>
          </div>

          {/* Sub-view toggle buttons for Bar Chart */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                setBarChartType('SUB_COMPETENCY');
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                barChartType === 'SUB_COMPETENCY'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-[#120424] text-slate-300 border-white/10 hover:text-white'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>24 Kỹ Năng Chi Tiết</span>
            </button>

            <button
              type="button"
              onClick={() => {
                vibrateTap();
                setBarChartType('DOMAIN_LEVEL_STACKED');
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                barChartType === 'DOMAIN_LEVEL_STACKED'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-[#120424] text-slate-300 border-white/10 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Xếp Chồng 6 Miền × 4 Mức</span>
            </button>

            <button
              type="button"
              onClick={() => {
                vibrateTap();
                setBarChartType('GAP_DEFICIT');
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                barChartType === 'GAP_DEFICIT'
                  ? 'bg-rose-600 text-white border-rose-400 shadow-sm'
                  : 'bg-rose-950/40 text-rose-300 border-rose-500/30 hover:bg-rose-900/60'
              }`}
            >
              <Flame className="w-3 h-3 text-rose-400" />
              <span>Khoảng Trống Thiếu Hụt ({gapDeficitBarData.length})</span>
            </button>
          </div>
        </div>

        {/* Bar Chart Filter Controls Toolbar (Only for Sub-Competency View) */}
        {barChartType === 'SUB_COMPETENCY' && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#120424] border border-purple-500/25 rounded-[4px] text-xs font-mono">
            {/* Domain Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Filter className="w-3 h-3 text-amber-400" />
                <span>Lọc Miền:</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  setSelectedDomainFilter('ALL');
                }}
                className={`px-2 py-0.5 rounded text-[10.5px] font-bold border transition cursor-pointer ${
                  selectedDomainFilter === 'ALL'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-black/30 text-slate-300 border-white/10 hover:text-white'
                }`}
              >
                Tất cả (24 kỹ năng)
              </button>

              {domainKeys.map(dKey => {
                const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
                const isSelected = selectedDomainFilter === dKey;
                return (
                  <button
                    key={dKey}
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      setSelectedDomainFilter(isSelected ? 'ALL' : dKey);
                    }}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                        : 'bg-black/30 text-slate-300 border-white/10 hover:text-white'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: domainColors[dKey] }} />
                    <span>{dom.code}</span>
                  </button>
                );
              })}
            </div>

            {/* Sort & Orientation Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-[11px] text-slate-300">
                <ArrowUpDown className="w-3 h-3 text-sky-400" />
                <span>Sắp xếp:</span>
                <select
                  value={skillSortMode}
                  onChange={(e) => {
                    vibrateTap();
                    setSkillSortMode(e.target.value as SkillSortMode);
                  }}
                  className="bg-[#1C093B] text-sky-300 border border-purple-500/40 rounded px-1.5 py-0.5 text-[10.5px] focus:outline-none cursor-pointer"
                >
                  <option value="DEFAULT">Mã chuẩn (1.1 → 6.3)</option>
                  <option value="COUNT_DESC">Nhiều câu nhất trước</option>
                  <option value="COUNT_ASC">Ít câu nhất trước</option>
                  <option value="GAP_DESC">Thiếu nhiều nhất lên đầu</option>
                </select>
              </div>

              {/* Orientation: Horizontal vs Vertical */}
              <div className="flex items-center border border-purple-500/30 rounded overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    setChartOrientation('HORIZONTAL');
                  }}
                  className={`px-2 py-0.5 text-[10.5px] font-bold transition cursor-pointer ${
                    chartOrientation === 'HORIZONTAL'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-[#1C093B] text-slate-400 hover:text-white'
                  }`}
                  title="Biểu đồ cột nằm ngang (dễ đọc tên tiêu chí)"
                >
                  Cột Ngang
                </button>
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    setChartOrientation('VERTICAL');
                  }}
                  className={`px-2 py-0.5 text-[10.5px] font-bold transition cursor-pointer ${
                    chartOrientation === 'VERTICAL'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-[#1C093B] text-slate-400 hover:text-white'
                  }`}
                  title="Biểu đồ cột đứng cổ điển"
                >
                  Cột Đứng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4.1 VIEW A: 24 SUB-COMPETENCY BAR CHART */}
        {barChartType === 'SUB_COMPETENCY' && (
          <div className="p-4 bg-[#120424] border border-purple-500/30 rounded-[4px] space-y-3 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <strong className="text-amber-300 font-bold">
                  {selectedDomainFilter === 'ALL'
                    ? `Toàn Bộ 24 Kỹ Năng Thành Phần (Chuẩn BTI 2026)`
                    : `Các Kỹ Năng Thành Phần của ${DIGITAL_COMPETENCY_DOMAINS[selectedDomainFilter]?.code}: ${DIGITAL_COMPETENCY_DOMAINS[selectedDomainFilter]?.name}`}
                </strong>
                <span className="px-1.5 py-0.2 bg-black/40 text-slate-300 rounded text-[10.5px]">
                  {filteredSortedSubStats.length} kỹ năng
                </span>
              </div>

              {/* Color legend guide */}
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                  <span className="text-emerald-300">Đạt chuẩn (≥{targetPerSkill})</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                  <span className="text-amber-300">Cần thêm (&lt;{targetPerSkill})</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                  <span className="text-rose-300">Trắng (0 câu)</span>
                </span>
              </div>
            </div>

            {/* Dynamic Chart Container */}
            <div
              className="w-full pt-2"
              style={{
                height: chartOrientation === 'HORIZONTAL'
                  ? Math.max(420, filteredSortedSubStats.length * 34)
                  : 380
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                {chartOrientation === 'HORIZONTAL' ? (
                  // HORIZONTAL BAR CHART (Easy to read skill names)
                  <BarChart
                    data={filteredSortedSubStats}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 70, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
                    <XAxis type="number" stroke="#B6A6D8" fontSize={11} tickLine={false} />
                    <YAxis
                      dataKey="code"
                      type="category"
                      stroke="#B6A6D8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `Kỹ năng ${val}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1C093B', borderColor: '#8b5cf6', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any, name: any, item: any) => [
                        `${val} câu hỏi (Mục tiêu: ${targetPerSkill}) | Thiếu: ${item.payload.deficit}`,
                        `${item.payload.code} - ${item.payload.name}`
                      ]}
                    />
                    <ReferenceLine x={targetPerSkill} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Chỉ tiêu (${targetPerSkill})`, fill: '#f59e0b', fontSize: 10, position: 'top' }} />
                    <Bar
                      dataKey="count"
                      name="Số câu hiện có"
                      radius={[0, 4, 4, 0]}
                      onClick={handleBarClick}
                      cursor="pointer"
                    >
                      {filteredSortedSubStats.map((entry, index) => (
                        <Cell
                          key={`sub-bar-${index}`}
                          fill={entry.isZero ? '#f43f5e' : entry.isMet ? '#10b981' : '#f59e0b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  // VERTICAL BAR CHART
                  <BarChart
                    data={filteredSortedSubStats}
                    margin={{ top: 15, right: 10, left: -20, bottom: 35 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis
                      dataKey="code"
                      stroke="#B6A6D8"
                      fontSize={10.5}
                      tickLine={false}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis stroke="#B6A6D8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1C093B', borderColor: '#8b5cf6', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any, name: any, item: any) => [
                        `${val} câu hỏi (Mục tiêu: ${targetPerSkill}) | Thiếu: ${item.payload.deficit}`,
                        `${item.payload.code} - ${item.payload.name}`
                      ]}
                    />
                    <ReferenceLine y={targetPerSkill} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Chỉ tiêu (${targetPerSkill})`, fill: '#f59e0b', fontSize: 10, position: 'right' }} />
                    <Bar
                      dataKey="count"
                      name="Số câu hiện có"
                      radius={[4, 4, 0, 0]}
                      onClick={handleBarClick}
                      cursor="pointer"
                    >
                      {filteredSortedSubStats.map((entry, index) => (
                        <Cell
                          key={`sub-vbar-${index}`}
                          fill={entry.isZero ? '#f43f5e' : entry.isMet ? '#10b981' : '#f59e0b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            <p className="text-[11px] text-slate-400 font-mono text-center pt-1 border-t border-purple-500/20">
              💡 Mẹo: Nhấp vào bất kỳ cột nào trên biểu đồ để xem chi tiết kỹ năng, phân bố mức độ và lọc câu hỏi ngay lập tức.
            </p>
          </div>
        )}

        {/* 4.2 VIEW B: DOMAIN x LEVEL STACKED BAR CHART */}
        {barChartType === 'DOMAIN_LEVEL_STACKED' && (
          <div className="p-4 bg-[#120424] border border-purple-500/30 rounded-[4px] space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono">
              <strong className="text-sky-300 font-bold">
                Phân Phối Xếp Chồng 6 Miền Năng Lực &amp; 4 Mức Độ Nhận Thức
              </strong>
              <span className="text-slate-400 text-[11px]">Recharts Stacked Bar</span>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={domainStackedBarData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="domainCode" stroke="#B6A6D8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#B6A6D8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1C093B', borderColor: '#8b5cf6', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="Nhận biết" stackId="a" fill={cognitiveLevelColors.NHAN_BIET} />
                  <Bar dataKey="Thông hiểu" stackId="a" fill={cognitiveLevelColors.THONG_HIEU} />
                  <Bar dataKey="Vận dụng" stackId="a" fill={cognitiveLevelColors.VAN_DUNG} />
                  <Bar dataKey="Vận dụng cao" stackId="a" fill={cognitiveLevelColors.VAN_DUNG_CAO} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 4.3 VIEW C: GAP DEFICIT BAR CHART */}
        {barChartType === 'GAP_DEFICIT' && (
          <div className="p-4 bg-rose-950/20 border border-rose-500/40 rounded-[4px] space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <strong className="text-rose-200 font-bold">
                  Bảng Xếp Hạng Kỹ Năng Thiếu Hụt (Cần Bổ Sung Thêm Câu Hỏi)
                </strong>
              </div>
              <span className="text-[11px] text-rose-300 font-bold">
                {gapDeficitBarData.length} kỹ năng chưa đạt chỉ tiêu (≥{targetPerSkill} câu)
              </span>
            </div>

            {gapDeficitBarData.length > 0 ? (
              <div
                className="w-full pt-2"
                style={{ height: Math.max(320, gapDeficitBarData.length * 32) }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={gapDeficitBarData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 70, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
                    <XAxis type="number" stroke="#B6A6D8" fontSize={11} tickLine={false} />
                    <YAxis
                      dataKey="code"
                      type="category"
                      stroke="#B6A6D8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `Kỹ năng ${val}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1C093B', borderColor: '#f43f5e', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any, name: any, item: any) => [
                        `Cần thêm: ${val} câu (Hiện có: ${item.payload.count}/${item.payload.target})`,
                        `${item.payload.code} - ${item.payload.name}`
                      ]}
                    />
                    <Bar
                      dataKey="deficit"
                      name="Số câu cần thêm"
                      fill="#f43f5e"
                      radius={[0, 4, 4, 0]}
                      onClick={handleBarClick}
                      cursor="pointer"
                    >
                      {gapDeficitBarData.map((entry, index) => (
                        <Cell
                          key={`gap-bar-${index}`}
                          fill={entry.count === 0 ? '#f43f5e' : '#f59e0b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-6 text-center text-emerald-300 font-mono space-y-1">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                <p className="font-bold">Tuyệt vời! Không có kỹ năng nào bị thiếu hụt.</p>
                <p className="text-xs text-slate-300">Tất cả 24 kỹ năng thành phần đều đã đạt mức chỉ tiêu ≥{targetPerSkill} câu.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. SKILL DETAIL POPUP MODAL (When clicking any bar or pie slice) */}
      {selectedSkillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1C093B] border border-amber-400/50 rounded-[4px] max-w-lg w-full p-4 sm:p-5 shadow-2xl space-y-4 text-slate-100">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-purple-500/30 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: selectedSkillModal.domainColor }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-amber-300 text-sm">
                      Kỹ năng {selectedSkillModal.code}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10.5px] font-mono font-bold bg-purple-900/60 text-purple-200 border border-purple-400/40">
                      {selectedSkillModal.domainCode}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-0.5">
                    {selectedSkillModal.name}
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSkillModal(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-[#B6A6D8] font-sans italic bg-[#100421] p-2.5 rounded border border-purple-500/20">
              "{selectedSkillModal.description}"
            </p>

            {/* Coverage Status Indicator */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2 bg-black/30 rounded border border-white/10">
                <div className="text-slate-400 text-[10.5px]">Số câu hiện có</div>
                <strong className="text-lg text-amber-300 font-bold">{selectedSkillModal.count}</strong>
              </div>
              <div className="p-2 bg-black/30 rounded border border-white/10">
                <div className="text-slate-400 text-[10.5px]">Chỉ tiêu chuẩn</div>
                <strong className="text-lg text-slate-200 font-bold">≥ {selectedSkillModal.target}</strong>
              </div>
              <div className={`p-2 rounded border ${
                selectedSkillModal.isMet 
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                  : selectedSkillModal.isZero
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              }`}>
                <div className="text-[10.5px]">Tình trạng</div>
                <strong className="text-xs font-bold">
                  {selectedSkillModal.isMet ? 'Đạt chuẩn ✓' : selectedSkillModal.isZero ? '0 câu (Trắng)' : `Thiếu ${selectedSkillModal.deficit} câu`}
                </strong>
              </div>
            </div>

            {/* Level breakdown pills */}
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-slate-300 font-bold">Phân rã theo 4 Mức độ nhận thức:</span>
              <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-mono">
                <div className="p-1.5 rounded bg-sky-950/40 border border-sky-500/30">
                  <div className="text-[10px] text-sky-300">Nhận biết</div>
                  <strong className="text-white">{selectedSkillModal.byLevel.NHAN_BIET}</strong>
                </div>
                <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-300">Thông hiểu</div>
                  <strong className="text-white">{selectedSkillModal.byLevel.THONG_HIEU}</strong>
                </div>
                <div className="p-1.5 rounded bg-amber-950/40 border border-amber-500/30">
                  <div className="text-[10px] text-amber-300">Vận dụng</div>
                  <strong className="text-white">{selectedSkillModal.byLevel.VAN_DUNG}</strong>
                </div>
                <div className="p-1.5 rounded bg-rose-950/40 border border-rose-500/30">
                  <div className="text-[10px] text-rose-300">VD Cao</div>
                  <strong className="text-white">{selectedSkillModal.byLevel.VAN_DUNG_CAO}</strong>
                </div>
              </div>
            </div>

            {/* Action Buttons: Filter in Bank or Add Question */}
            <div className="flex items-center gap-2 pt-2 border-t border-purple-500/30">
              {onFilterQuestionsBySkill && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onFilterQuestionsBySkill(selectedSkillModal.domainKey, selectedSkillModal.code);
                    setSelectedSkillModal(null);
                  }}
                  className="flex-1 py-2 bg-[#241148] hover:bg-[#341866] text-sky-300 border border-sky-400/40 rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Lọc trong Ngân Hàng</span>
                </button>
              )}

              {onOpenAddQuestionForSkill && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onOpenAddQuestionForSkill(selectedSkillModal.domainKey, selectedSkillModal.code);
                    setSelectedSkillModal(null);
                  }}
                  className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-300" />
                  <span>Soạn Câu Hỏi Mới</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
