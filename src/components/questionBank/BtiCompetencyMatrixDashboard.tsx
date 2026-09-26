import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Layers,
  Plus,
  Filter,
  Printer,
  Download,
  Info,
  ChevronRight,
  PieChart as PieIcon,
  ShieldCheck,
  Zap,
  Flame,
  Crown,
  Grid,
  TrendingUp,
  FileSpreadsheet,
  HelpCircle,
  Eye,
  RefreshCw,
  Search,
  ArrowUpRight,
  CheckSquare,
  Wand2,
  Tag,
  Sliders,
  Check
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
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell
} from 'recharts';
import {
  QuestionItem,
  DigitalCompetencyDomainKey,
  CognitiveLevel,
  BtiRoundGroupKey
} from '../../types';
import { DIGITAL_COMPETENCY_DOMAINS } from '../../data/digitalCompetencyData';
import { questionBankManager } from '../../services/questionBankManager';
import { BtiMatrixReportExportModal } from './BtiMatrixReportExportModal';
import { BtiCompetencyVisualDashboard } from './BtiCompetencyVisualDashboard';
import { BtiQuestionCoverageHeatmapView } from './BtiQuestionCoverageHeatmapView';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';

interface BtiCompetencyMatrixDashboardProps {
  questions: QuestionItem[];
  onFilterMatrixCell?: (domain: DigitalCompetencyDomainKey, level: CognitiveLevel) => void;
  onNavigateToAIStudio?: (prefill: { domain: DigitalCompetencyDomainKey; level: CognitiveLevel }) => void;
  onOpenAddQuestion?: (prefill: { domain: DigitalCompetencyDomainKey; level: CognitiveLevel }) => void;
}

type MatrixViewMode = 'CHARTS_VISUAL' | 'CELL_HEATMAP' | 'SUB_COMPETENCY' | 'GAP_ANALYSIS' | 'QUESTION_MAPPING';

export const BtiCompetencyMatrixDashboard: React.FC<BtiCompetencyMatrixDashboardProps> = ({
  questions,
  onFilterMatrixCell,
  onNavigateToAIStudio,
  onOpenAddQuestion
}) => {
  const [viewMode, setViewMode] = useState<MatrixViewMode>('CHARTS_VISUAL');
  const [targetPerCell, setTargetPerCell] = useState<number>(3); // Recommended min target per cell
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [selectedCell, setSelectedCell] = useState<{
    domain: DigitalCompetencyDomainKey;
    level: CognitiveLevel;
  } | null>(null);

  // Question Mapping Tool state
  const [mappingFilterDomain, setMappingFilterDomain] = useState<string>('ALL');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [targetDomainToAssign, setTargetDomainToAssign] = useState<DigitalCompetencyDomainKey>('MIEN_1');
  const [targetSubToAssign, setTargetSubToAssign] = useState<string>('1.1');
  const [targetLevelToAssign, setTargetLevelToAssign] = useState<CognitiveLevel>('THONG_HIEU');
  const [mappingToast, setMappingToast] = useState<string | null>(null);

  const totalQuestions = questions.length;
  const domainKeys: DigitalCompetencyDomainKey[] = ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'];
  const cognitiveLevels: CognitiveLevel[] = ['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'];

  // 1. Calculate 2D Matrix Grid Data (6 Domains x 4 Cognitive Levels)
  const matrixStats = useMemo(() => {
    const grid: Record<DigitalCompetencyDomainKey, Record<CognitiveLevel, QuestionItem[]>> = {
      MIEN_1: { NHAN_BIET: [], THONG_HIEU: [], VAN_DUNG: [], VAN_DUNG_CAO: [] },
      MIEN_2: { NHAN_BIET: [], THONG_HIEU: [], VAN_DUNG: [], VAN_DUNG_CAO: [] },
      MIEN_3: { NHAN_BIET: [], THONG_HIEU: [], VAN_DUNG: [], VAN_DUNG_CAO: [] },
      MIEN_4: { NHAN_BIET: [], THONG_HIEU: [], VAN_DUNG: [], VAN_DUNG_CAO: [] },
      MIEN_5: { NHAN_BIET: [], THONG_HIEU: [], VAN_DUNG: [], VAN_DUNG_CAO: [] },
      MIEN_6: { NHAN_BIET: [], THONG_HIEU: [], VAN_DUNG: [], VAN_DUNG_CAO: [] },
    };

    const domainTotals: Record<DigitalCompetencyDomainKey, number> = {
      MIEN_1: 0, MIEN_2: 0, MIEN_3: 0, MIEN_4: 0, MIEN_5: 0, MIEN_6: 0
    };

    const levelTotals: Record<CognitiveLevel, number> = {
      NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0
    };

    let emptyCellsCount = 0;
    let metTargetCellsCount = 0;

    questions.forEach(q => {
      let dom = q.digital_competency_domain;
      if (!dom || !grid[dom]) {
        // Fallback domain detection based on category or ID
        if (q.category?.includes('Miền 1') || q.category?.includes('Miền I')) dom = 'MIEN_1';
        else if (q.category?.includes('Miền 2') || q.category?.includes('Miền II')) dom = 'MIEN_2';
        else if (q.category?.includes('Miền 3') || q.category?.includes('Miền III')) dom = 'MIEN_3';
        else if (q.category?.includes('Miền 4') || q.category?.includes('Miền IV')) dom = 'MIEN_4';
        else if (q.category?.includes('Miền 5') || q.category?.includes('Miền V')) dom = 'MIEN_5';
        else if (q.category?.includes('Miền 6') || q.category?.includes('Miền VI')) dom = 'MIEN_6';
        else dom = 'MIEN_1';
      }

      let lvl = q.cognitive_level;
      if (!lvl || !levelTotals[lvl]) {
        if ((q as any).difficulty === 'EASY') lvl = 'NHAN_BIET';
        else if ((q as any).difficulty === 'MEDIUM') lvl = 'THONG_HIEU';
        else if ((q as any).difficulty === 'HARD') lvl = 'VAN_DUNG';
        else lvl = 'THONG_HIEU';
      }

      if (grid[dom] && grid[dom][lvl]) {
        grid[dom][lvl].push(q);
        domainTotals[dom]++;
        levelTotals[lvl]++;
      }
    });

    const totalCells = 24; // 6 domains x 4 levels
    domainKeys.forEach(d => {
      cognitiveLevels.forEach(l => {
        const count = grid[d][l].length;
        if (count === 0) emptyCellsCount++;
        if (count >= targetPerCell) metTargetCellsCount++;
      });
    });

    const coveragePercentage = Math.round(((totalCells - emptyCellsCount) / totalCells) * 100);

    return {
      grid,
      domainTotals,
      levelTotals,
      emptyCellsCount,
      metTargetCellsCount,
      totalCells,
      coveragePercentage
    };
  }, [questions, targetPerCell]);

  // 2. Format Recharts Data for Stacked Bar Chart
  const rechartsStackedData = useMemo(() => {
    return domainKeys.map(dKey => {
      const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
      const row = matrixStats.grid[dKey];
      return {
        domainCode: dom?.code || dKey,
        domainName: dom?.name || dKey,
        shortName: dom?.code || dKey,
        'Nhận biết': row.NHAN_BIET.length,
        'Thông hiểu': row.THONG_HIEU.length,
        'Vận dụng': row.VAN_DUNG.length,
        'Vận dụng cao': row.VAN_DUNG_CAO.length,
        total: matrixStats.domainTotals[dKey]
      };
    });
  }, [matrixStats]);

  // 3. Format Recharts Data for Radar Chart (6 Domains vs Target)
  const rechartsRadarData = useMemo(() => {
    const targetPerDomain = targetPerCell * 4; // 4 levels
    return domainKeys.map(dKey => {
      const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
      const actual = matrixStats.domainTotals[dKey];
      return {
        domain: dom?.code || dKey,
        fullDomainName: dom?.name || dKey,
        'Thực Tế': actual,
        'Chỉ Tiêu': targetPerDomain,
      };
    });
  }, [matrixStats, targetPerCell]);

  // 4. Sub-competencies detailed breakdown (24 sub-items)
  const subCompetencyStats = useMemo(() => {
    const list: Array<{
      code: string;
      domainKey: DigitalCompetencyDomainKey;
      domainName: string;
      name: string;
      description: string;
      count: number;
      byLevel: Record<CognitiveLevel, number>;
    }> = [];

    domainKeys.forEach(dKey => {
      const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
      if (dom && dom.subCompetencies) {
        dom.subCompetencies.forEach(sub => {
          const subQuestions = questions.filter(q => {
            const matchSub = q.digital_sub_competency === sub.code;
            const matchDomain = q.digital_competency_domain === dKey || q.category?.includes(dom.code);
            return matchSub || (matchDomain && q.question_text?.toLowerCase().includes(sub.name.toLowerCase().slice(0, 15)));
          });

          const byLevel: Record<CognitiveLevel, number> = {
            NHAN_BIET: 0,
            THONG_HIEU: 0,
            VAN_DUNG: 0,
            VAN_DUNG_CAO: 0
          };

          subQuestions.forEach(q => {
            const l = q.cognitive_level || 'THONG_HIEU';
            if (byLevel[l] !== undefined) byLevel[l]++;
          });

          list.push({
            code: sub.code,
            domainKey: dKey,
            domainName: dom.name,
            name: sub.name,
            description: sub.description,
            count: subQuestions.length,
            byLevel
          });
        });
      }
    });

    return list;
  }, [questions]);

  // Questions matching currently selected cell
  const cellQuestions = useMemo(() => {
    if (!selectedCell) return [];
    return matrixStats.grid[selectedCell.domain][selectedCell.level];
  }, [selectedCell, matrixStats]);

  // Helper for Cell Status Styling
  const getCellStatusStyle = (count: number) => {
    if (count === 0) {
      return {
        bg: 'bg-rose-950/40 hover:bg-rose-900/60',
        border: 'border-rose-500/50',
        text: 'text-rose-300',
        badge: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
        label: 'Vùng Trắng (0 câu)'
      };
    }
    if (count < targetPerCell) {
      return {
        bg: 'bg-amber-950/30 hover:bg-amber-900/50',
        border: 'border-amber-500/40',
        text: 'text-amber-300',
        badge: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
        label: `Cần bổ sung (<${targetPerCell})`
      };
    }
    return {
      bg: 'bg-emerald-950/30 hover:bg-emerald-900/50',
      border: 'border-emerald-500/40',
      text: 'text-emerald-300',
      badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
      label: 'Đạt Chuẩn Coverage'
    };
  };

  // Questions filtered for mapping tool
  const mappingQuestions = useMemo(() => {
    if (mappingFilterDomain === 'ALL') return questions;
    if (mappingFilterDomain === 'UNASSIGNED') {
      return questions.filter(q => !q.digital_competency_domain || !q.digital_sub_competency);
    }
    return questions.filter(q => q.digital_competency_domain === mappingFilterDomain);
  }, [questions, mappingFilterDomain]);

  // Batch Map Selected Questions to Target Domain, Sub & Level
  const handleApplyBatchMapping = () => {
    if (selectedQuestionIds.size === 0) return;
    vibrateTap();
    soundFx.playClick();

    const ids = Array.from(selectedQuestionIds);
    questionBankManager.batchUpdate(ids, {
      digital_competency_domain: targetDomainToAssign,
      digital_sub_competency: targetSubToAssign,
      cognitive_level: targetLevelToAssign
    });

    soundFx.playCorrect();
    vibrateSuccess();

    setMappingToast(`Đã ánh xạ thành công ${ids.length} câu hỏi vào ${DIGITAL_COMPETENCY_DOMAINS[targetDomainToAssign]?.code} - Tiêu chí ${targetSubToAssign}!`);
    setSelectedQuestionIds(new Set());
    setTimeout(() => setMappingToast(null), 3500);
  };

  // AI Auto-Suggest Mappings based on keyword analysis
  const handleRunAiAutoMapping = () => {
    vibrateTap();
    soundFx.playClick();

    let mappedCount = 0;
    questions.forEach(q => {
      if (q.digital_competency_domain && q.digital_sub_competency) return; // Skip if already mapped

      const text = (q.question_text + ' ' + (q.category || '')).toLowerCase();

      // Rule-based keyword matching for BTI 2026 sub-competencies
      let predictedDomain: DigitalCompetencyDomainKey = 'MIEN_1';
      let predictedSub = '1.1';

      if (text.includes('an toàn') || text.includes('mật khẩu') || text.includes('quyền riêng tư') || text.includes('mã độc') || text.includes('lừa đảo')) {
        predictedDomain = 'MIEN_4';
        predictedSub = text.includes('mật khẩu') || text.includes('quyền riêng tư') ? '4.2' : '4.1';
      } else if (text.includes('giao tiếp') || text.includes('chia sẻ') || text.includes('mạng xã hội') || text.includes('netiquette')) {
        predictedDomain = 'MIEN_2';
        predictedSub = '2.1';
      } else if (text.includes('sáng tạo') || text.includes('bản quyền') || text.includes('lập trình') || text.includes('nội dung số')) {
        predictedDomain = 'MIEN_3';
        predictedSub = text.includes('bản quyền') ? '3.3' : text.includes('lập trình') ? '3.4' : '3.1';
      } else if (text.includes('sự cố') || text.includes('kỹ thuật') || text.includes('khắc phục') || text.includes('giải quyết')) {
        predictedDomain = 'MIEN_5';
        predictedSub = '5.1';
      } else if (text.includes('trí tuệ nhân tạo') || text.includes('ai') || text.includes('prompt') || text.includes('chatgpt') || text.includes('deepfake')) {
        predictedDomain = 'MIEN_6';
        predictedSub = '6.1';
      }

      questionBankManager.batchUpdate([q.id], {
        digital_competency_domain: predictedDomain,
        digital_sub_competency: predictedSub
      });
      mappedCount++;
    });

    soundFx.playCorrect();
    vibrateSuccess();

    setMappingToast(`AI đã tự động phân tích ngữ nghĩa và ánh xạ thành công ${mappedCount} câu hỏi chưa gắn nhãn!`);
    setTimeout(() => setMappingToast(null), 4000);
  };

  return (
    <div className="fluent-box p-4 sm:p-6 rounded-[4px] border border-theme-accent/30 bg-[#16072D] space-y-6 animate-fadeIn text-slate-100">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-theme-accent/25 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-[4px] bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-lg border border-purple-400/40">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-tight font-mono">
                Ma Trận Độ Phủ Khung Năng Lực BTI 2026
              </h2>
              <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                TT 02/2025/TT-BGDĐT
              </span>
            </div>
            <p className="text-xs text-[#B6A6D8] mt-0.5">
              Phân tích biểu đồ Recharts, Ma trận 6x4 Heatmap & Bảng Ánh xạ Kỹ năng cho 24 Tiêu chí Năng lực số BTI.
            </p>
          </div>
        </div>

        {/* Target Selector & Print Report */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-[#100421] px-3 py-1.5 rounded-[4px] border border-purple-500/30 text-xs font-mono">
            <span className="text-slate-300">Mục tiêu/Ô:</span>
            <select
              value={targetPerCell}
              onChange={(e) => setTargetPerCell(Number(e.target.value))}
              className="bg-[#1C093B] text-amber-300 font-bold border border-amber-500/40 rounded px-2 py-0.5 focus:outline-none"
            >
              <option value={1}>≥ 1 câu / ô</option>
              <option value={2}>≥ 2 câu / ô</option>
              <option value={3}>≥ 3 câu (Khuyên dùng)</option>
              <option value={5}>≥ 5 câu / ô</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              setShowExportModal(true);
            }}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/50 rounded-[4px] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            <span>Xuất Báo Cáo (PDF / Excel)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              window.print();
            }}
            className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/40 rounded-[4px] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">In Báo Cáo A4</span>
          </button>
        </div>
      </div>

      {/* Export Report Modal */}
      <BtiMatrixReportExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        questions={questions}
      />

      {/* Toast Banner */}
      {mappingToast && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-[4px] text-xs font-mono text-emerald-200 flex items-center gap-2 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{mappingToast}</span>
        </div>
      )}

      {/* KPI Overview Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        
        {/* Metric 1: Coverage Rate */}
        <div className="fluent-card p-4 rounded-[4px] bg-[#1C093B] border border-purple-500/40 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span>Tỷ Lệ Phủ Khung</span>
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-amber-300 font-mono">
              {matrixStats.coveragePercentage}%
            </strong>
            <span className="text-[11px] font-mono text-slate-400">
              ({matrixStats.totalCells - matrixStats.emptyCellsCount}/24 ô)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-purple-500/30 mt-1">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${matrixStats.coveragePercentage}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Empty Gap Cells */}
        <div className="fluent-card p-4 rounded-[4px] bg-rose-950/30 border border-rose-500/40 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-rose-300">
            <span>Vùng Trắng (Chưa có câu)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-rose-300 font-mono">
              {matrixStats.emptyCellsCount}
            </strong>
            <span className="text-[11px] font-mono text-slate-400">ô trắng</span>
          </div>
          <p className="text-[10.5px] text-rose-200/80 font-mono">
            {matrixStats.emptyCellsCount === 0 
              ? '✓ Hoàn thành phủ 100% tất cả các ô ma trận' 
              : 'Cần bổ sung câu hỏi bằng AI Studio'}
          </p>
        </div>

        {/* Metric 3: Target Reached */}
        <div className="fluent-card p-4 rounded-[4px] bg-emerald-950/30 border border-emerald-500/40 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-300">
            <span>Đạt Chỉ Tiêu (≥{targetPerCell} câu)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-emerald-300 font-mono">
              {matrixStats.metTargetCellsCount}
            </strong>
            <span className="text-[11px] font-mono text-slate-400">/ 24 ô</span>
          </div>
          <p className="text-[10.5px] text-emerald-200/80 font-mono">
            Đạt chuẩn độ cân bằng đề thi BTI
          </p>
        </div>

        {/* Metric 4: Total Questions */}
        <div className="fluent-card p-4 rounded-[4px] bg-[#1F083F] border border-theme-accent/40 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span>Tổng Số Câu Trong Ngân Hàng</span>
            <Layers className="w-4 h-4 text-theme-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-theme-accent font-mono">
              {totalQuestions}
            </strong>
            <span className="text-[11px] font-mono text-slate-400">câu hỏi</span>
          </div>
          <p className="text-[10.5px] text-purple-300/80 font-mono">
            Sẵn sàng xuất đề thi tự động
          </p>
        </div>

      </div>

      {/* View Mode Pivot Tabs */}
      <div className="flex items-center gap-1.5 border-b border-purple-500/30 pb-3 font-mono text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            setViewMode('CHARTS_VISUAL');
          }}
          className={`px-3.5 py-1.5 rounded-[4px] font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
            viewMode === 'CHARTS_VISUAL'
              ? 'bg-amber-500/20 text-amber-200 border-amber-400/80'
              : 'bg-[#120424] text-slate-400 border-purple-500/20 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
          <span>Biểu Đồ Recharts Ma Trận</span>
        </button>

        <button
          type="button"
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            setViewMode('CELL_HEATMAP');
          }}
          className={`px-3.5 py-1.5 rounded-[4px] font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
            viewMode === 'CELL_HEATMAP'
              ? 'bg-amber-500/20 text-amber-200 border-amber-400/80'
              : 'bg-[#120424] text-slate-400 border-purple-500/20 hover:text-white'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Bảng Heatmap 6x4 Fluent</span>
        </button>

        <button
          type="button"
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            setViewMode('SUB_COMPETENCY');
          }}
          className={`px-3.5 py-1.5 rounded-[4px] font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
            viewMode === 'SUB_COMPETENCY'
              ? 'bg-amber-500/20 text-amber-200 border-amber-400/80'
              : 'bg-[#120424] text-slate-400 border-purple-500/20 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>24 Tiêu Chí Chi Tiết</span>
        </button>

        <button
          type="button"
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            setViewMode('QUESTION_MAPPING');
          }}
          className={`px-3.5 py-1.5 rounded-[4px] font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
            viewMode === 'QUESTION_MAPPING'
              ? 'bg-purple-600/30 text-purple-200 border-purple-400/80'
              : 'bg-[#120424] text-slate-400 border-purple-500/20 hover:text-white'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
          <span>Bộ Ánh Xạ Kỹ Năng BTI</span>
        </button>

        <button
          type="button"
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            setViewMode('GAP_ANALYSIS');
          }}
          className={`px-3.5 py-1.5 rounded-[4px] font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap border ${
            viewMode === 'GAP_ANALYSIS'
              ? 'bg-rose-500/20 text-rose-200 border-rose-400/80'
              : 'bg-[#120424] text-slate-400 border-purple-500/20 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Cảnh Báo Lỗ Hổng ({matrixStats.emptyCellsCount})</span>
        </button>
      </div>

      {/* VIEW MODE 0: RECHARTS VISUAL MATRIX CHARTS */}
      {viewMode === 'CHARTS_VISUAL' && (
        <div className="space-y-6">
          {/* Main Visual Recharts Dashboard with Pie & Bar Charts */}
          <BtiCompetencyVisualDashboard
            questions={questions}
            onFilterQuestionsBySkill={(domainKey, subCode, level) => {
              onFilterMatrixCell?.(domainKey, level || 'THONG_HIEU');
            }}
            onOpenAddQuestionForSkill={(domainKey, subCode, level) => {
              onOpenAddQuestion?.({ domain: domainKey, level: level || 'THONG_HIEU' });
            }}
            onNavigateToFullMatrix={() => setViewMode('CELL_HEATMAP')}
          />

          {/* Complementary Radar Chart: Balance Benchmark */}
          <div className="fluent-card p-4 rounded-[4px] bg-[#120424] border border-purple-500/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
              <h3 className="text-xs font-bold text-sky-300 font-mono flex items-center gap-1.5 uppercase">
                <Target className="w-4 h-4 text-sky-400" />
                <span>III. BIỂU ĐỒ MẠNG NHỆN CÂN BẰNG 6 MIỀN BTI 2026 (RADAR BENCHMARK)</span>
              </h3>
              <span className="text-[10.5px] font-mono text-slate-400">Recharts Radar Plot</span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={80} data={rechartsRadarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.15)" />
                  <PolarAngleAxis dataKey="domain" stroke="#B6A6D8" fontSize={11} />
                  <PolarRadiusAxis stroke="#B6A6D8" fontSize={10} angle={30} domain={[0, 'auto']} />
                  <Radar name="Số lượng thực tế" dataKey="Thực Tế" stroke="#a855f7" fill="#a855f7" fillOpacity={0.5} />
                  <Radar name="Chỉ tiêu khuyến nghị" dataKey="Chỉ Tiêu" stroke="#34d399" fill="#34d399" fillOpacity={0.2} strokeDasharray="3 3" />
                  <Tooltip contentStyle={{ backgroundColor: '#1C093B', borderColor: '#8b5cf6', borderRadius: '4px', color: '#fff', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: 6x4 CELL HEATMAP MATRIX & MULTI-DIMENSIONAL HEATMAP */}
      {viewMode === 'CELL_HEATMAP' && (
        <BtiQuestionCoverageHeatmapView
          questions={questions}
          onFilterMatrixCell={(domain, level, category) => {
            vibrateTap();
            soundFx.playClick();
            if (onFilterMatrixCell) {
              onFilterMatrixCell(domain as DigitalCompetencyDomainKey, level);
            }
          }}
          onNavigateToAIStudio={onNavigateToAIStudio}
          onOpenAddQuestion={onOpenAddQuestion}
        />
      )}

      {/* VIEW MODE 2: SUB-COMPETENCY DETAILED MATRIX (24 Items) */}
      {viewMode === 'SUB_COMPETENCY' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subCompetencyStats.map(sub => (
              <div 
                key={sub.code}
                className="fluent-card p-3.5 rounded-[4px] bg-[#140529] border border-purple-500/30 space-y-2 hover:border-amber-400/50 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-purple-500/20 text-purple-200 border border-purple-400/30">
                    Tiêu chí {sub.code}
                  </span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    sub.count > 0 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' 
                      : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                  }`}>
                    {sub.count} câu
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white font-sans">{sub.name}</h4>
                <p className="text-[11px] text-slate-400 font-sans line-clamp-2">{sub.description}</p>

                {/* Difficulty Spread Bar */}
                <div className="grid grid-cols-4 gap-1 text-[10px] font-mono pt-1 border-t border-purple-500/20 text-center">
                  <div className="bg-sky-950/40 p-1 rounded border border-sky-500/20">
                    <span className="text-sky-300 block">NB: {sub.byLevel.NHAN_BIET}</span>
                  </div>
                  <div className="bg-emerald-950/40 p-1 rounded border border-emerald-500/20">
                    <span className="text-emerald-300 block">TH: {sub.byLevel.THONG_HIEU}</span>
                  </div>
                  <div className="bg-amber-950/40 p-1 rounded border border-amber-500/20">
                    <span className="text-amber-300 block">VD: {sub.byLevel.VAN_DUNG}</span>
                  </div>
                  <div className="bg-rose-950/40 p-1 rounded border border-rose-500/20">
                    <span className="text-rose-300 block">VDC: {sub.byLevel.VAN_DUNG_CAO}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: BỘ ÁNH XẠ KỸ NĂNG & LĨNH VỰC NĂNG LỰC BTI (MAPPING TOOL) */}
      {viewMode === 'QUESTION_MAPPING' && (
        <div className="space-y-4">
          <div className="fluent-card p-4 rounded-[4px] bg-[#120424] border border-purple-500/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
              <div>
                <h3 className="text-sm font-bold text-amber-300 font-mono flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-400" />
                  <span>CÔNG CỤ ÁNH XẠ CÂU HỎI VÀO KHUNG NĂNG LỰC BTI 2026</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Gán hàng loạt Miền Năng Lực Số (Miền I - VI), Tiêu chí thành phần (1.1 - 6.4) và Mức độ nhận thức cho câu hỏi.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunAiAutoMapping}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-bold text-xs rounded-[4px] flex items-center gap-1.5 transition cursor-pointer shadow-md shrink-0"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>AI Tự Động Ánh Xạ Toàn Bộ</span>
              </button>
            </div>

            {/* Target Mapping Assign Controls Bar */}
            <div className="p-3 bg-[#1C093B] border border-purple-500/30 rounded-[4px] space-y-3">
              <span className="text-xs font-mono font-bold text-purple-300 block uppercase">
                1. Chọn Thông Số Ánh Xạ Để Áp Dụng Cho Các Câu Đã Chọn ({selectedQuestionIds.size} câu)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div>
                  <label className="text-slate-300 block mb-1">Miền Năng Lực Số:</label>
                  <select
                    value={targetDomainToAssign}
                    onChange={(e) => setTargetDomainToAssign(e.target.value as DigitalCompetencyDomainKey)}
                    className="w-full bg-[#100421] text-amber-300 font-bold border border-purple-500/40 rounded p-1.5"
                  >
                    {domainKeys.map(k => (
                      <option key={k} value={k}>
                        {DIGITAL_COMPETENCY_DOMAINS[k]?.code}: {DIGITAL_COMPETENCY_DOMAINS[k]?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Tiêu Chí Thành Phần:</label>
                  <select
                    value={targetSubToAssign}
                    onChange={(e) => setTargetSubToAssign(e.target.value)}
                    className="w-full bg-[#100421] text-sky-300 font-bold border border-purple-500/40 rounded p-1.5"
                  >
                    {DIGITAL_COMPETENCY_DOMAINS[targetDomainToAssign]?.subCompetencies.map(s => (
                      <option key={s.code} value={s.code}>
                        Tiêu chí {s.code}: {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Mức Độ Nhận Thức:</label>
                  <select
                    value={targetLevelToAssign}
                    onChange={(e) => setTargetLevelToAssign(e.target.value as CognitiveLevel)}
                    className="w-full bg-[#100421] text-emerald-300 font-bold border border-purple-500/40 rounded p-1.5"
                  >
                    <option value="NHAN_BIET">Nhận biết (Dễ)</option>
                    <option value="THONG_HIEU">Thông hiểu (Trung bình)</option>
                    <option value="VAN_DUNG">Vận dụng (Khá)</option>
                    <option value="VAN_DUNG_CAO">Vận dụng cao (Khó)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  disabled={selectedQuestionIds.size === 0}
                  onClick={handleApplyBatchMapping}
                  className={`px-4 py-2 font-mono font-bold text-xs rounded-[4px] flex items-center gap-1.5 transition ${
                    selectedQuestionIds.size > 0
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Áp Dụng Ánh Xạ ({selectedQuestionIds.size} Câu)</span>
                </button>
              </div>
            </div>

            {/* Questions Table Filter */}
            <div className="flex items-center justify-between gap-2 pt-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-300">Lọc theo:</span>
                <select
                  value={mappingFilterDomain}
                  onChange={(e) => setMappingFilterDomain(e.target.value)}
                  className="bg-[#1C093B] text-purple-200 border border-purple-500/30 rounded px-2.5 py-1"
                >
                  <option value="ALL">Tất cả câu hỏi trong ngân hàng ({questions.length})</option>
                  <option value="UNASSIGNED">⚠️ Chưa được gán Miền/Tiêu chí BTI</option>
                  {domainKeys.map(k => (
                    <option key={k} value={k}>
                      {DIGITAL_COMPETENCY_DOMAINS[k]?.code} ({questions.filter(q => q.digital_competency_domain === k).length})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (selectedQuestionIds.size === mappingQuestions.length) {
                    setSelectedQuestionIds(new Set());
                  } else {
                    setSelectedQuestionIds(new Set(mappingQuestions.map(q => q.id)));
                  }
                }}
                className="text-amber-300 hover:text-white underline"
              >
                {selectedQuestionIds.size === mappingQuestions.length ? 'Bỏ chọn tất cả' : 'Chọn toàn bộ danh sách lọc'}
              </button>
            </div>

            {/* Questions List for Mapping */}
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar border-t border-purple-500/20 pt-2">
              {mappingQuestions.map(q => {
                const isSelected = selectedQuestionIds.has(q.id);
                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      const newSet = new Set(selectedQuestionIds);
                      if (isSelected) newSet.delete(q.id);
                      else newSet.add(q.id);
                      setSelectedQuestionIds(newSet);
                    }}
                    className={`p-3 rounded-[4px] border text-xs transition cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-purple-950/60 border-amber-400 text-white ring-1 ring-amber-400'
                        : 'bg-[#18052B] border-purple-500/20 text-slate-200 hover:border-purple-400/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-0.5 rounded border-purple-400 text-purple-600 focus:ring-0 accent-purple-500"
                    />

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-300">{q.id}</span>
                        <div className="flex items-center gap-2 font-mono text-[10.5px]">
                          <span className="px-1.5 py-0.2 bg-purple-900/40 text-purple-200 rounded border border-purple-400/30">
                            {q.digital_competency_domain || '⚠️ Chưa gán Miền'}
                          </span>
                          <span className="px-1.5 py-0.2 bg-sky-900/40 text-sky-200 rounded border border-sky-400/30">
                            Tiêu chí: {q.digital_sub_competency || 'Chưa gán'}
                          </span>
                        </div>
                      </div>

                      <p className="font-sans text-slate-100">{q.question_text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* VIEW MODE 4: GAP ANALYSIS & AI RECOMMENDATIONS */}
      {viewMode === 'GAP_ANALYSIS' && (
        <div className="space-y-4">
          <div className="fluent-card p-4 rounded-[4px] bg-rose-950/20 border border-rose-500/40 space-y-3">
            <h3 className="text-sm font-bold text-rose-200 font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>BÁO CÁO VÙNG TRẮNG CẦN BỔ SUNG CÂU HỎI (GAP ANALYSIS)</span>
            </h3>
            <p className="text-xs text-slate-300">
              Danh sách các ô giao giữa Miền Năng Lực Số và Mức Độ Nhận Thức hiện có 0 câu hoặc thấp hơn chỉ tiêu ({targetPerCell} câu).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {domainKeys.flatMap(dKey => 
                cognitiveLevels
                  .filter(lvl => matrixStats.grid[dKey][lvl].length < targetPerCell)
                  .map(lvl => {
                    const count = matrixStats.grid[dKey][lvl].length;
                    const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];

                    return (
                      <div key={`${dKey}_${lvl}`} className="p-3 rounded bg-[#18052B] border border-rose-500/30 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-bold text-rose-300">{dom.code} - {lvl}</span>
                          <span className="px-2 py-0.2 bg-rose-500/20 text-rose-200 rounded border border-rose-400/30">
                            {count === 0 ? 'VÙNG TRẮNG 0' : `Thiếu (${count}/${targetPerCell})`}
                          </span>
                        </div>

                        <p className="text-xs text-slate-200 font-sans font-semibold">{dom.name}</p>

                        {onNavigateToAIStudio && (
                          <button
                            type="button"
                            onClick={() => {
                              vibrateTap();
                              soundFx.playClick();
                              onNavigateToAIStudio({ domain: dKey, level: lvl });
                            }}
                            className="w-full py-1.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-mono font-bold text-xs rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>Soạn AI Cho Ô Phù Hợp</span>
                          </button>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
