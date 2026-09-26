import React, { useState, useMemo } from 'react';
import {
  Grid,
  Target,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Layers,
  Plus,
  Filter,
  Eye,
  Info,
  ChevronRight,
  TrendingUp,
  HelpCircle,
  FolderOpen,
  ArrowRight,
  Zap,
  Flame,
  Crown,
  ListFilter,
  BarChart2,
  Sliders,
  Check,
  RotateCcw,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import {
  QuestionItem,
  DigitalCompetencyDomainKey,
  CognitiveLevel,
  ApprovalStatus,
  BtiRoundGroupKey,
  CompetitionStage
} from '../../types';
import {
  DIGITAL_COMPETENCY_DOMAINS,
  COGNITIVE_LEVELS,
  COMPETITION_STAGES,
  BTI_ROUND_GROUPS
} from '../../data/digitalCompetencyData';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';
import { exportBtiMatrixToExcel } from '../../services/btiMatrixExportService';

export type HeatmapDimension = 'DOMAIN_X_LEVEL' | 'CATEGORY_X_LEVEL' | 'ROUND_X_LEVEL' | 'STAGE_X_LEVEL';
export type HeatmapMetricMode = 'COUNT' | 'PERCENTAGE' | 'TARGET_STATUS';

interface BtiQuestionCoverageHeatmapViewProps {
  questions: QuestionItem[];
  onFilterMatrixCell?: (domain: string, level: CognitiveLevel, category?: string) => void;
  onOpenAddQuestion?: (prefill: { domain?: DigitalCompetencyDomainKey; level?: CognitiveLevel; category?: string }) => void;
  onNavigateToAIStudio?: (prefill: { domain?: DigitalCompetencyDomainKey; level?: CognitiveLevel; category?: string }) => void;
  onSwitchToListView?: () => void;
  currentFilterDomain?: string;
  currentFilterLevel?: string;
}

interface CellData {
  rowKey: string;
  rowLabel: string;
  rowSubLabel?: string;
  rowCode?: string;
  rowColor?: string;
  colKey: CognitiveLevel;
  colLabel: string;
  questions: QuestionItem[];
  count: number;
  percentage: number;
}

export const BtiQuestionCoverageHeatmapView: React.FC<BtiQuestionCoverageHeatmapViewProps> = ({
  questions,
  onFilterMatrixCell,
  onOpenAddQuestion,
  onNavigateToAIStudio,
  onSwitchToListView,
  currentFilterDomain,
  currentFilterLevel
}) => {
  // State
  const [dimension, setDimension] = useState<HeatmapDimension>('DOMAIN_X_LEVEL');
  const [metricMode, setMetricMode] = useState<HeatmapMetricMode>('COUNT');
  const [targetThreshold, setTargetThreshold] = useState<number>(3); // Standard min questions per cell
  const [statusFilter, setStatusFilter] = useState<'ALL' | ApprovalStatus>('ALL');
  const [selectedCell, setSelectedCell] = useState<{
    rowKey: string;
    colKey: CognitiveLevel;
    rowLabel: string;
    colLabel: string;
  } | null>(null);

  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [exportToastMessage, setExportToastMessage] = useState<string | null>(null);

  const cognitiveLevels: CognitiveLevel[] = ['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'];

  // Handle Export Matrix to Excel (.xlsx)
  const handleExportExcel = () => {
    vibrateTap();
    soundFx.playClick();
    setIsExportingExcel(true);

    setTimeout(() => {
      try {
        const dimensionLabels: Record<HeatmapDimension, string> = {
          DOMAIN_X_LEVEL: '6 MIỀN NĂNG LỰC SỐ BTI 2026',
          CATEGORY_X_LEVEL: 'CHUYÊN ĐỀ / DANH MỤC CÂU HỎI',
          ROUND_X_LEVEL: 'PHẦN THI GAMESHOW BTI',
          STAGE_X_LEVEL: 'GIAI ĐOẠN THI ĐẤU'
        };

        const result = exportBtiMatrixToExcel({
          questions: filteredQuestions,
          targetPerCell: targetThreshold,
          statusFilter: statusFilter,
          dimension: dimension,
          reporterName: 'Ban Chuyên Môn BTI 2026',
          reportTitle: `BÁO CÁO TIẾN ĐỘ & MA TRẬN ĐỘ PHỦ NGÂN HÀNG CÂU HỎI BTI 2026 (${dimensionLabels[dimension]})`
        });

        soundFx.playCorrect();
        vibrateSuccess();
        setExportToastMessage(`Đã xuất thành công tệp Excel: ${result.filename}`);
        setTimeout(() => setExportToastMessage(null), 5000);
      } catch (err) {
        console.error('Error exporting matrix to Excel:', err);
      } finally {
        setIsExportingExcel(false);
      }
    }, 250);
  };

  // 1. Filter questions by status if requested
  const filteredQuestions = useMemo(() => {
    if (statusFilter === 'ALL') return questions;
    return questions.filter(q => q.approval_status === statusFilter);
  }, [questions, statusFilter]);

  const totalFilteredCount = filteredQuestions.length;

  // 2. Build rows based on selected dimension
  const rowDefinitions = useMemo(() => {
    switch (dimension) {
      case 'DOMAIN_X_LEVEL': {
        const domainKeys: DigitalCompetencyDomainKey[] = ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'];
        return domainKeys.map(key => {
          const dom = DIGITAL_COMPETENCY_DOMAINS[key];
          return {
            key,
            code: dom.code,
            label: dom.name,
            subLabel: dom.description,
            color: dom.color
          };
        });
      }

      case 'CATEGORY_X_LEVEL': {
        // Extract top unique categories from questions
        const catCounts: Record<string, number> = {};
        filteredQuestions.forEach(q => {
          const cat = (q.category || 'Chưa phân loại').trim();
          catCounts[cat] = (catCounts[cat] || 0) + 1;
        });

        // Sort by frequency, top 10 categories
        const sortedCats = Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a]);
        return sortedCats.slice(0, 10).map((cat, idx) => ({
          key: cat,
          code: `C${idx + 1}`,
          label: cat,
          subLabel: `Tổng ${catCounts[cat]} câu hỏi trong ngân hàng`,
          color: '#a855f7'
        }));
      }

      case 'ROUND_X_LEVEL': {
        const roundKeys: BtiRoundGroupKey[] = ['KHOI_DONG', 'VCNV', 'TANG_TOC', 'VE_DICH', 'VONG_LOAI'];
        return roundKeys.map(rKey => {
          const rInfo = BTI_ROUND_GROUPS[rKey];
          return {
            key: rKey,
            code: rInfo?.shortName || rKey,
            label: rInfo?.name || rKey,
            subLabel: rInfo?.description || 'Phần thi Gameshow BTI',
            color: rKey === 'KHOI_DONG' ? '#38bdf8' : rKey === 'VCNV' ? '#f59e0b' : rKey === 'TANG_TOC' ? '#a855f7' : '#f43f5e'
          };
        });
      }

      case 'STAGE_X_LEVEL': {
        const stageKeys: CompetitionStage[] = ['VONG_LOAI', 'BAN_KET_1', 'BAN_KET_2', 'CHUNG_KET'];
        return stageKeys.map(sKey => {
          const sInfo = COMPETITION_STAGES[sKey];
          return {
            key: sKey,
            code: sKey,
            label: sInfo?.name || sKey,
            subLabel: sInfo?.subTitle || 'Giai đoạn thi đấu',
            color: sKey === 'CHUNG_KET' ? '#eab308' : sKey.includes('BAN_KET') ? '#a855f7' : '#38bdf8'
          };
        });
      }
    }
  }, [dimension, filteredQuestions]);

  // 3. Compute 2D Matrix Grid
  const { matrixGrid, maxCellCount, totalCells, coveredCellsCount, deficitCellsCount, emptyCellsCount } = useMemo(() => {
    let maxCount = 0;
    let covered = 0;
    let deficit = 0;
    let empty = 0;

    const grid: Record<string, Record<CognitiveLevel, CellData>> = {};

    rowDefinitions.forEach(row => {
      grid[row.key] = {} as Record<CognitiveLevel, CellData>;

      cognitiveLevels.forEach(lvl => {
        // Filter questions matching row & column
        const cellQs = filteredQuestions.filter(q => {
          // Level match
          const qLvl = q.cognitive_level || 'THONG_HIEU';
          if (qLvl !== lvl) return false;

          // Row match
          if (dimension === 'DOMAIN_X_LEVEL') {
            return q.digital_competency_domain === row.key;
          } else if (dimension === 'CATEGORY_X_LEVEL') {
            return (q.category || 'Chưa phân loại').trim() === row.key;
          } else if (dimension === 'ROUND_X_LEVEL') {
            const grp = q.round_group || (
              q.round_name?.includes('Khởi động') ? 'KHOI_DONG' :
              q.round_name?.includes('Vượt') ? 'VCNV' :
              q.round_name?.includes('Tăng') ? 'TANG_TOC' :
              q.round_name?.includes('Về đích') ? 'VE_DICH' :
              q.round_name?.includes('Vòng loại') ? 'VONG_LOAI' : 'KHOI_DONG'
            );
            return grp === row.key;
          } else if (dimension === 'STAGE_X_LEVEL') {
            return q.stage === row.key;
          }
          return false;
        });

        const count = cellQs.length;
        if (count > maxCount) maxCount = count;

        if (count === 0) empty++;
        else if (count < targetThreshold) deficit++;
        else covered++;

        const pct = totalFilteredCount > 0 ? (count / totalFilteredCount) * 100 : 0;

        grid[row.key][lvl] = {
          rowKey: row.key,
          rowLabel: row.label,
          rowSubLabel: row.subLabel,
          rowCode: row.code,
          rowColor: row.color,
          colKey: lvl,
          colLabel: COGNITIVE_LEVELS[lvl]?.name || lvl,
          questions: cellQs,
          count,
          percentage: pct
        };
      });
    });

    const cellTotal = rowDefinitions.length * cognitiveLevels.length;

    return {
      matrixGrid: grid,
      maxCellCount: Math.max(maxCount, 1),
      totalCells: cellTotal,
      coveredCellsCount: covered,
      deficitCellsCount: deficit,
      emptyCellsCount: empty
    };
  }, [rowDefinitions, cognitiveLevels, filteredQuestions, dimension, targetThreshold, totalFilteredCount]);

  // Active cell data currently inspected
  const activeCellData: CellData | null = useMemo(() => {
    if (!selectedCell || !matrixGrid[selectedCell.rowKey] || !matrixGrid[selectedCell.rowKey][selectedCell.colKey]) {
      return null;
    }
    return matrixGrid[selectedCell.rowKey][selectedCell.colKey];
  }, [selectedCell, matrixGrid]);

  // Coverage statistics
  const coverageRate = totalCells > 0 ? Math.round(((totalCells - emptyCellsCount) / totalCells) * 100) : 0;
  const targetMetRate = totalCells > 0 ? Math.round((coveredCellsCount / totalCells) * 100) : 0;

  // Dynamic Heatmap Shading Helper
  const getHeatmapColor = (count: number, isSelected: boolean) => {
    if (count === 0) {
      return {
        bg: 'bg-rose-950/25 hover:bg-rose-900/40',
        border: isSelected ? 'border-rose-400 ring-2 ring-rose-400 shadow-rose-900/50 shadow-md' : 'border-rose-500/30 hover:border-rose-500/60',
        text: 'text-rose-300 font-normal',
        tagBg: 'bg-rose-950/60 text-rose-300 border-rose-500/40',
        label: 'Vùng Trắng (0 câu)',
        densityIcon: '○'
      };
    }

    const ratio = count / maxCellCount;

    if (count < targetThreshold) {
      return {
        bg: 'bg-amber-950/40 hover:bg-amber-900/60',
        border: isSelected ? 'border-amber-400 ring-2 ring-amber-400 shadow-amber-900/50 shadow-md' : 'border-amber-500/40 hover:border-amber-400/70',
        text: 'text-amber-200 font-bold',
        tagBg: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
        label: `Cần Bổ Sung (< ${targetThreshold})`,
        densityIcon: '◐'
      };
    }

    if (ratio < 0.5) {
      return {
        bg: 'bg-emerald-950/40 hover:bg-emerald-900/60',
        border: isSelected ? 'border-emerald-400 ring-2 ring-emerald-400 shadow-emerald-900/50 shadow-md' : 'border-emerald-500/40 hover:border-emerald-400/70',
        text: 'text-emerald-300 font-bold',
        tagBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
        label: 'Đạt Chuẩn (Vừa)',
        densityIcon: '●'
      };
    }

    if (ratio < 0.8) {
      return {
        bg: 'bg-gradient-to-br from-indigo-900/50 to-purple-900/60 hover:from-indigo-900/70 hover:to-purple-900/80',
        border: isSelected ? 'border-theme-accent ring-2 ring-theme-accent shadow-purple-900/60 shadow-lg' : 'border-purple-400/40 hover:border-theme-accent',
        text: 'text-purple-100 font-extrabold',
        tagBg: 'bg-purple-950/90 text-purple-200 border-purple-400/50',
        label: 'Mật Độ Cao',
        densityIcon: '◆'
      };
    }

    // Very high density
    return {
      bg: 'bg-gradient-to-br from-fuchsia-950/60 via-purple-900/70 to-pink-950/60 hover:brightness-110',
      border: isSelected ? 'border-pink-400 ring-2 ring-pink-400 shadow-pink-900/60 shadow-xl' : 'border-pink-500/50 hover:border-pink-400',
      text: 'text-pink-200 font-black',
      tagBg: 'bg-pink-950/90 text-pink-200 border-pink-400/60',
      label: 'Mật Độ Rất Cao (Hotspot)',
      densityIcon: '★'
    };
  };

  return (
    <div className="space-y-4 font-mono text-slate-100 animate-fadeIn">
      {/* 1. Header Toolbar: Mode Selector, Target Threshold, Status Filter */}
      <div className="p-3.5 sm:p-4 rounded-[4px] bg-[#16072D] border border-theme-accent/30 space-y-3 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Title & Badge */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-md border border-purple-400/40">
              <Grid className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-tight">
                  Ma Trận Trực Quan Độ Phủ Câu Hỏi (Coverage Heatmap)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  Heatmap 2D InterActive
                </span>
              </div>
              <p className="text-[11.5px] text-[#B6A6D8] font-sans mt-0.5">
                Quan sát nhanh sự phân bổ mật độ câu hỏi theo cấp độ nhận thức và chuyên đề, nhận diện ngay các lỗ hổng kiến thức.
              </p>
            </div>
          </div>

          {/* Quick return to list / Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Export Excel (.xlsx) button */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="px-3.5 py-1.5 rounded-[4px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/50 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
              title="Xuất toàn bộ ma trận độ phủ, chỉ số KPI và danh sách câu hỏi ra tệp Excel (.xlsx)"
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 text-amber-300 ${isExportingExcel ? 'animate-spin' : ''}`} />
              <span>{isExportingExcel ? 'Đang Xuất Excel...' : 'Xuất Excel (.xlsx)'}</span>
            </button>

            {onSwitchToListView && (
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onSwitchToListView();
                }}
                className="px-3 py-1.5 rounded-[4px] bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/20 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Quay lại danh sách câu hỏi thông thường"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                <span>Xem Dạng Danh Sách</span>
              </button>
            )}
          </div>
        </div>

        {/* Export Success Banner */}
        {exportToastMessage && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-[4px] text-xs font-mono text-emerald-200 flex items-center justify-between gap-2 animate-fadeIn shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{exportToastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setExportToastMessage(null)}
              className="text-emerald-400 hover:text-white px-1.5 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Controls row: Dimension Switcher, Metric Display, Threshold, Status */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-purple-500/20 text-xs">
          
          {/* Left: Dimension Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#B6A6D8] text-[11px] font-medium hidden sm:inline">Phân tích theo:</span>
            
            <div className="inline-flex rounded-[3px] bg-[#120424] p-0.5 border border-purple-500/30">
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setDimension('DOMAIN_X_LEVEL');
                  setSelectedCell(null);
                }}
                className={`px-2.5 py-1 rounded-[2px] text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  dimension === 'DOMAIN_X_LEVEL'
                    ? 'bg-theme-accent text-[#190839] shadow-sm'
                    : 'text-[#B6A6D8] hover:text-white hover:bg-white/5'
                }`}
                title="Ma trận 6 Miền Năng Lực Số (TT 02/2025/TT-BGDĐT) x 4 Mức Độ Nhận Thức"
              >
                <Sparkles className="w-3 h-3" />
                <span>6 Miền Năng Lực</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setDimension('CATEGORY_X_LEVEL');
                  setSelectedCell(null);
                }}
                className={`px-2.5 py-1 rounded-[2px] text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  dimension === 'CATEGORY_X_LEVEL'
                    ? 'bg-theme-accent text-[#190839] shadow-sm'
                    : 'text-[#B6A6D8] hover:text-white hover:bg-white/5'
                }`}
                title="Ma trận Chuyên đề / Danh mục đề thi x 4 Mức Độ Nhận Thức"
              >
                <FolderOpen className="w-3 h-3" />
                <span>Chuyên Đề / Danh Mục</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setDimension('ROUND_X_LEVEL');
                  setSelectedCell(null);
                }}
                className={`px-2.5 py-1 rounded-[2px] text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  dimension === 'ROUND_X_LEVEL'
                    ? 'bg-theme-accent text-[#190839] shadow-sm'
                    : 'text-[#B6A6D8] hover:text-white hover:bg-white/5'
                }`}
                title="Ma trận Phần Thi Gameshow x 4 Mức Độ Nhận Thức"
              >
                <Layers className="w-3 h-3" />
                <span>Phần Thi (Gameshow)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setDimension('STAGE_X_LEVEL');
                  setSelectedCell(null);
                }}
                className={`px-2.5 py-1 rounded-[2px] text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                  dimension === 'STAGE_X_LEVEL'
                    ? 'bg-theme-accent text-[#190839] shadow-sm'
                    : 'text-[#B6A6D8] hover:text-white hover:bg-white/5'
                }`}
                title="Ma trận Vòng Thi Đấu (Vòng loại, Bán kết, Chung kết) x 4 Mức Độ Nhận Thức"
              >
                <Flame className="w-3 h-3" />
                <span>Giai Đoạn Thi</span>
              </button>
            </div>
          </div>

          {/* Right: Metrics & Target controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Metric Mode */}
            <div className="flex items-center gap-1 bg-[#120424] px-2 py-1 rounded-[3px] border border-purple-500/30">
              <span className="text-[10.5px] text-[#B6A6D8]">Hiển thị:</span>
              <select
                value={metricMode}
                onChange={(e) => setMetricMode(e.target.value as HeatmapMetricMode)}
                className="bg-transparent text-amber-300 font-bold text-[11px] focus:outline-none cursor-pointer"
              >
                <option value="COUNT" className="bg-[#190839] text-white">Số lượng câu (N)</option>
                <option value="PERCENTAGE" className="bg-[#190839] text-white">Tỷ lệ phần trăm (%)</option>
                <option value="TARGET_STATUS" className="bg-[#190839] text-white">Trạng thái chỉ tiêu</option>
              </select>
            </div>

            {/* Target Threshold */}
            <div className="flex items-center gap-1 bg-[#120424] px-2 py-1 rounded-[3px] border border-purple-500/30">
              <span className="text-[10.5px] text-[#B6A6D8]">Ngưỡng chuẩn:</span>
              <select
                value={targetThreshold}
                onChange={(e) => setTargetThreshold(Number(e.target.value))}
                className="bg-transparent text-emerald-300 font-bold text-[11px] focus:outline-none cursor-pointer"
              >
                <option value={1} className="bg-[#190839] text-white">≥ 1 câu / ô</option>
                <option value={2} className="bg-[#190839] text-white">≥ 2 câu / ô</option>
                <option value={3} className="bg-[#190839] text-white">≥ 3 câu (Khuyến nghị)</option>
                <option value={5} className="bg-[#190839] text-white">≥ 5 câu / ô</option>
                <option value={8} className="bg-[#190839] text-white">≥ 8 câu / ô</option>
              </select>
            </div>

            {/* Approval Status Filter */}
            <div className="flex items-center gap-1 bg-[#120424] px-2 py-1 rounded-[3px] border border-purple-500/30">
              <span className="text-[10.5px] text-[#B6A6D8]">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent text-sky-300 font-bold text-[11px] focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#190839] text-white">Tất cả ({questions.length})</option>
                <option value="APPROVED" className="bg-[#190839] text-emerald-300">Đã duyệt (Approved)</option>
                <option value="PENDING_REVIEW" className="bg-[#190839] text-amber-300">Chờ duyệt (Pending)</option>
                <option value="DRAFT" className="bg-[#190839] text-slate-300">Bản nháp (Draft)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-[4px] bg-[#16072D] border border-theme-accent/25 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] text-[#B6A6D8]">TỶ LỆ LẤP ĐẦY MA TRẬN</div>
            <div className="text-xl font-black text-white mt-0.5">{coverageRate}%</div>
            <div className="text-[10px] text-slate-400 font-sans">
              {totalCells - emptyCellsCount} / {totalCells} ô có câu hỏi
            </div>
          </div>
          <div className="p-2 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
            <Target className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-[4px] bg-[#16072D] border border-emerald-500/30 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] text-emerald-300">ĐẠT CHỈ TIÊU (≥ {targetThreshold})</div>
            <div className="text-xl font-black text-emerald-200 mt-0.5">{coveredCellsCount} ô</div>
            <div className="text-[10px] text-emerald-400/80 font-sans">
              {targetMetRate}% số ô đạt chuẩn
            </div>
          </div>
          <div className="p-2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-[4px] bg-[#16072D] border border-amber-500/30 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] text-amber-300">CẦN BỔ SUNG (&lt; {targetThreshold})</div>
            <div className="text-xl font-black text-amber-200 mt-0.5">{deficitCellsCount} ô</div>
            <div className="text-[10px] text-amber-400/80 font-sans">
              Có câu hỏi nhưng chưa đủ số lượng
            </div>
          </div>
          <div className="p-2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-[4px] bg-[#16072D] border border-rose-500/30 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] text-rose-300">VÙNG TRẮNG (0 CÂU)</div>
            <div className="text-xl font-black text-rose-200 mt-0.5">{emptyCellsCount} ô</div>
            <div className="text-[10px] text-rose-400/80 font-sans">
              Lỗ hổng kiến thức cần soạn ngay
            </div>
          </div>
          <div className="p-2 rounded bg-rose-500/20 text-rose-300 border border-rose-400/30">
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* 3. Heatmap Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2 rounded-[4px] bg-[#120424] border border-purple-500/25 text-[11px]">
        <div className="flex items-center gap-2 text-slate-300">
          <Info className="w-3.5 h-3.5 text-theme-accent shrink-0" />
          <span className="font-semibold">Thang màu mật độ (Heatmap Scale):</span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] bg-rose-950 border border-rose-500/50" />
            <span className="text-rose-300 text-[10.5px]">0 câu (Rỗng)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] bg-amber-950 border border-amber-500/50" />
            <span className="text-amber-300 text-[10.5px]">1 - {targetThreshold - 1} câu (Thiếu)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] bg-emerald-950 border border-emerald-500/50" />
            <span className="text-emerald-300 text-[10.5px]">≥ {targetThreshold} câu (Đạt chuẩn)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] bg-indigo-900 border border-purple-400/60" />
            <span className="text-purple-300 text-[10.5px]">Mật độ cao</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[2px] bg-pink-900 border border-pink-400/60" />
            <span className="text-pink-300 text-[10.5px]">Rất cao (Hotspot)</span>
          </div>
        </div>

        <div className="text-[10.5px] text-slate-400 italic">
          💡 Nhấp vào ô bất kỳ để xem danh sách câu hỏi & thao tác bù đắp
        </div>
      </div>

      {/* 4. THE INTERACTIVE HEATMAP MATRIX TABLE */}
      <div className="rounded-[4px] border border-theme-accent/30 bg-[#16072D] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#120424] border-b border-purple-500/30 text-purple-200">
                <th className="p-3.5 min-w-[220px] font-bold text-xs uppercase tracking-wide">
                  {dimension === 'DOMAIN_X_LEVEL' ? 'Miền Năng Lực Số (Khung BTI 2026)' :
                   dimension === 'CATEGORY_X_LEVEL' ? 'Chuyên Đề / Danh Mục Thực Tế' :
                   dimension === 'ROUND_X_LEVEL' ? 'Phần Thi (Gameshow BTI)' : 'Giai Đoạn Thi'}
                </th>

                {cognitiveLevels.map(lvl => {
                  const lvlInfo = COGNITIVE_LEVELS[lvl];
                  return (
                    <th key={lvl} className="p-3 text-center min-w-[150px] border-l border-purple-500/20">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1 font-bold" style={{ color: lvlInfo?.color || '#38bdf8' }}>
                          {lvl === 'NHAN_BIET' && <Target className="w-3.5 h-3.5 text-blue-400" />}
                          {lvl === 'THONG_HIEU' && <Zap className="w-3.5 h-3.5 text-emerald-400" />}
                          {lvl === 'VAN_DUNG' && <Flame className="w-3.5 h-3.5 text-amber-400" />}
                          {lvl === 'VAN_DUNG_CAO' && <Crown className="w-3.5 h-3.5 text-rose-400" />}
                          <span>{lvlInfo?.name || lvl}</span>
                        </div>
                        <span className="text-[9.5px] text-slate-400 font-normal">
                          {lvlInfo?.levelsRange}
                        </span>
                      </div>
                    </th>
                  );
                })}

                <th className="p-3 text-center min-w-[90px] border-l border-purple-500/30 bg-[#1B083A] text-white font-bold">
                  Tổng Hàng
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-purple-500/15">
              {rowDefinitions.map(row => {
                // Calculate row total
                let rowTotal = 0;
                cognitiveLevels.forEach(lvl => {
                  rowTotal += matrixGrid[row.key]?.[lvl]?.count || 0;
                });

                return (
                  <tr key={row.key} className="hover:bg-purple-950/20 transition-colors">
                    {/* Row Header info */}
                    <td className="p-3.5 border-r border-purple-500/20 align-top">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {row.code && (
                            <span 
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
                              style={{ 
                                backgroundColor: 'rgba(168, 85, 247, 0.15)', 
                                color: row.color || '#c084fc',
                                border: `1px solid ${row.color || 'rgba(168,85,247,0.4)'}` 
                              }}
                            >
                              {row.code}
                            </span>
                          )}
                          <span className="text-white font-bold text-xs leading-snug line-clamp-2">
                            {row.label}
                          </span>
                        </div>
                        {row.subLabel && (
                          <p className="text-[10.5px] text-slate-400 font-sans line-clamp-1">
                            {row.subLabel}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* 4 Cognitive Level Cells */}
                    {cognitiveLevels.map(lvl => {
                      const cell = matrixGrid[row.key]?.[lvl] || {
                        count: 0,
                        percentage: 0,
                        questions: []
                      };
                      const count = cell.count;
                      const isSelected = selectedCell?.rowKey === row.key && selectedCell?.colKey === lvl;
                      const style = getHeatmapColor(count, isSelected);

                      return (
                        <td
                          key={lvl}
                          onClick={() => {
                            vibrateTap();
                            soundFx.playClick();
                            setSelectedCell({
                              rowKey: row.key,
                              colKey: lvl,
                              rowLabel: row.label,
                              colLabel: COGNITIVE_LEVELS[lvl]?.name || lvl
                            });
                          }}
                          className={`p-3 text-center border-l border-purple-500/20 cursor-pointer transition-all duration-150 relative select-none group ${style.bg} ${style.border}`}
                          title={`Nhấp để khám phá chi tiết ô: ${row.label} × ${COGNITIVE_LEVELS[lvl]?.name} (${count} câu)`}
                        >
                          <div className="flex flex-col items-center justify-center space-y-1.5">
                            
                            {/* Primary Metric */}
                            {metricMode === 'COUNT' && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 group-hover:text-white transition">
                                  {style.densityIcon}
                                </span>
                                <span className={`text-base font-black ${style.text}`}>
                                  {count}
                                </span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  câu
                                </span>
                              </div>
                            )}

                            {metricMode === 'PERCENTAGE' && (
                              <div className="flex items-center gap-1">
                                <span className={`text-sm font-black ${style.text}`}>
                                  {cell.percentage.toFixed(1)}%
                                </span>
                              </div>
                            )}

                            {metricMode === 'TARGET_STATUS' && (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${style.tagBg}`}>
                                {count === 0 ? 'TRẮNG (0)' : count >= targetThreshold ? 'ĐẠT' : `THIẾU (${count}/${targetThreshold})`}
                              </span>
                            )}

                            {/* Status tag */}
                            {metricMode !== 'TARGET_STATUS' && (
                              <span className={`px-1.5 py-0.2 rounded text-[9.5px] border ${style.tagBg}`}>
                                {count === 0 ? 'Trắng (0)' : count >= targetThreshold ? 'Đạt' : `Thiếu (${count}/${targetThreshold})`}
                              </span>
                            )}

                            {/* Mini Distribution Bar (Fill to Target) */}
                            <div className="w-16 bg-black/40 h-1 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${
                                  count === 0 ? 'bg-rose-500' :
                                  count < targetThreshold ? 'bg-amber-400' :
                                  'bg-emerald-400'
                                }`}
                                style={{ width: `${Math.min(Math.round((count / Math.max(targetThreshold, 1)) * 100), 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      );
                    })}

                    {/* Row Total */}
                    <td className="p-3 text-center border-l border-purple-500/30 bg-[#1B083A] font-bold align-middle">
                      <span className="text-sm font-black text-amber-300">
                        {rowTotal}
                      </span>
                      <div className="text-[9.5px] text-slate-400">
                        {totalFilteredCount > 0 ? ((rowTotal / totalFilteredCount) * 100).toFixed(0) : 0}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. INTERACTIVE CELL INSPECTOR PANEL (When a cell is selected) */}
      {selectedCell && activeCellData && (
        <div className="p-4 sm:p-5 rounded-[4px] bg-[#1F0A3D] border-2 border-amber-400/80 space-y-4 shadow-2xl animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/30 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40">
                <Sliders className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30">
                    CHI TIẾT Ô ĐANG CHỌN
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    ({activeCellData.count} câu hỏi)
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white mt-1">
                  {selectedCell.rowLabel} &bull; <span className="text-sky-300 font-mono">{selectedCell.colLabel}</span>
                </h4>
              </div>
            </div>

            {/* Quick Action buttons for this slot */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Questions */}
              {onFilterMatrixCell && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onFilterMatrixCell(
                      selectedCell.rowKey, 
                      selectedCell.colKey, 
                      dimension === 'CATEGORY_X_LEVEL' ? selectedCell.rowKey : undefined
                    );
                  }}
                  className="px-3 py-1.5 rounded-[4px] bg-theme-accent text-[#190839] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md hover:brightness-110 active:scale-95"
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>Lọc &amp; Xem {activeCellData.count} Câu Hỏi</span>
                </button>
              )}

              {/* Add Question to this slot */}
              {onOpenAddQuestion && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onOpenAddQuestion({
                      domain: dimension === 'DOMAIN_X_LEVEL' ? (selectedCell.rowKey as DigitalCompetencyDomainKey) : undefined,
                      level: selectedCell.colKey,
                      category: dimension === 'CATEGORY_X_LEVEL' ? selectedCell.rowKey : undefined
                    });
                  }}
                  className="px-3 py-1.5 rounded-[4px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md active:scale-95"
                  title="Thêm câu hỏi mới chuẩn hóa ngay vào ô này"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm Câu Hỏi Mới</span>
                </button>
              )}

              {/* AI Question Studio prefill */}
              {onNavigateToAIStudio && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onNavigateToAIStudio({
                      domain: dimension === 'DOMAIN_X_LEVEL' ? (selectedCell.rowKey as DigitalCompetencyDomainKey) : undefined,
                      level: selectedCell.colKey,
                      category: dimension === 'CATEGORY_X_LEVEL' ? selectedCell.rowKey : undefined
                    });
                  }}
                  className="px-3 py-1.5 rounded-[4px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md active:scale-95"
                  title="Mở AI Studio để tạo câu hỏi tự động bù đắp ô này"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>⚡ Soạn AI Bù Đắp</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedCell(null)}
                className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 text-xs transition cursor-pointer"
                title="Đóng bảng chi tiết"
              >
                ✕ Đóng
              </button>
            </div>
          </div>

          {/* Question List Preview inside this slot */}
          {activeCellData.count === 0 ? (
            <div className="p-6 text-center rounded-[4px] bg-rose-950/20 border border-rose-500/40 space-y-2">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto animate-bounce" />
              <div className="text-sm font-bold text-rose-200">
                Ô này hiện đang rỗng (0 câu hỏi)!
              </div>
              <p className="text-xs text-rose-300/80 font-sans max-w-md mx-auto">
                Để bảo đảm độ bao phủ ngân hàng đề thi chuẩn BTI 2026, bạn cần bổ sung ít nhất {targetThreshold} câu hỏi vào miền này ở mức độ {selectedCell.colLabel}.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                {onNavigateToAIStudio && (
                  <button
                    type="button"
                    onClick={() => onNavigateToAIStudio({
                      domain: dimension === 'DOMAIN_X_LEVEL' ? (selectedCell.rowKey as DigitalCompetencyDomainKey) : undefined,
                      level: selectedCell.colKey
                    })}
                    className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Dùng AI Tạo Ngay 3 Câu</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-[#B6A6D8] font-bold flex items-center justify-between">
                <span>Danh sách câu hỏi trong ô ({activeCellData.count}):</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Chỉ tiêu tối thiểu: ≥ {targetThreshold} câu ({activeCellData.count >= targetThreshold ? '✓ Đã đạt' : `⚠️ Cần thêm ${targetThreshold - activeCellData.count} câu`})
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-white/10 border border-purple-500/20 rounded-[4px] bg-[#14062E] p-2 space-y-1.5 custom-scrollbar">
                {activeCellData.questions.map((q, idx) => (
                  <div key={q.id} className="py-1.5 px-2 rounded hover:bg-white/5 transition flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-amber-400">#{q.id}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-500/30">
                          {q.round_name || q.stage}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${
                          q.approval_status === 'APPROVED' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' :
                          q.approval_status === 'PENDING_REVIEW' ? 'bg-amber-950/80 text-amber-300 border-amber-500/40' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {q.approval_status === 'APPROVED' ? 'Đã duyệt' : q.approval_status === 'PENDING_REVIEW' ? 'Chờ duyệt' : 'Bản nháp'}
                        </span>
                      </div>
                      <p className="text-slate-200 text-xs font-sans line-clamp-2">
                        {q.question_text}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[10.5px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        {q.correct_key ? `Đ/A: ${q.correct_key}` : 'Tự luận'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
