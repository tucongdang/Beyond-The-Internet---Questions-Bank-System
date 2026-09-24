import React, { useState, useMemo } from 'react';
import {
  Target,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Sparkles,
  Layers,
  HelpCircle,
  ExternalLink,
  Filter,
  Grid3X3,
  Flame,
  Info
} from 'lucide-react';
import {
  QuestionItem,
  DigitalCompetencyDomainKey,
  CognitiveLevel
} from '../../types';
import {
  DIGITAL_COMPETENCY_DOMAINS,
  COGNITIVE_LEVELS
} from '../../data/digitalCompetencyData';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap } from '../../utils/hapticUtils';

export type MatrixStatusFilterType = 'ALL' | 'GAP_DEFICIT' | 'GAP_EMPTY' | 'MET_TARGET' | 'UNASSIGNED';

interface BtiCompetencyMatrixFilterBarProps {
  questions: QuestionItem[];
  filteredCount: number;
  filterDomain: string;
  onDomainChange: (domain: string) => void;
  filterSubCompetency: string;
  onSubCompetencyChange: (sub: string) => void;
  filterLevel: string;
  onLevelChange: (level: string) => void;
  filterMatrixStatus: MatrixStatusFilterType;
  onMatrixStatusChange: (status: MatrixStatusFilterType) => void;
  onOpenAddQuestionForSlot?: (domainKey: DigitalCompetencyDomainKey, level: CognitiveLevel, subCode?: string) => void;
  onNavigateToFullMatrix?: () => void;
}

export const BtiCompetencyMatrixFilterBar: React.FC<BtiCompetencyMatrixFilterBarProps> = ({
  questions,
  filteredCount,
  filterDomain,
  onDomainChange,
  filterSubCompetency,
  onSubCompetencyChange,
  filterLevel,
  onLevelChange,
  filterMatrixStatus,
  onMatrixStatusChange,
  onOpenAddQuestionForSlot,
  onNavigateToFullMatrix
}) => {
  const [isMiniGridOpen, setIsMiniGridOpen] = useState<boolean>(false);
  const targetPerCell = 3; // Standard target per matrix cell

  const domainKeys: DigitalCompetencyDomainKey[] = ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'];
  const cognitiveLevels: CognitiveLevel[] = ['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'];

  const levelShortNames: Record<CognitiveLevel, string> = {
    NHAN_BIET: 'NB',
    THONG_HIEU: 'TH',
    VAN_DUNG: 'VD',
    VAN_DUNG_CAO: 'VDC'
  };

  // Compute 6x4 matrix statistics and domain totals
  const matrixStats = useMemo(() => {
    const grid: Record<DigitalCompetencyDomainKey, Record<CognitiveLevel, number>> = {
      MIEN_1: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_2: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_3: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_4: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_5: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_6: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
    };

    const domainTotals: Record<DigitalCompetencyDomainKey, number> = {
      MIEN_1: 0, MIEN_2: 0, MIEN_3: 0, MIEN_4: 0, MIEN_5: 0, MIEN_6: 0
    };

    const subTotals: Record<string, number> = {};

    let unassignedCount = 0;

    questions.forEach(q => {
      const d = q.digital_competency_domain;
      const l = q.cognitive_level || 'THONG_HIEU';
      const sub = q.digital_sub_competency;

      if (d && grid[d]) {
        grid[d][l]++;
        domainTotals[d]++;
      } else {
        unassignedCount++;
      }

      if (sub) {
        subTotals[sub] = (subTotals[sub] || 0) + 1;
      }
    });

    let emptyCellsCount = 0;
    let deficitCellsCount = 0;
    let metTargetCellsCount = 0;

    const emptySlotsList: Array<{
      domainKey: DigitalCompetencyDomainKey;
      domainCode: string;
      domainName: string;
      level: CognitiveLevel;
    }> = [];

    const deficitSlotsList: Array<{
      domainKey: DigitalCompetencyDomainKey;
      domainCode: string;
      domainName: string;
      level: CognitiveLevel;
      count: number;
      needed: number;
    }> = [];

    domainKeys.forEach(dKey => {
      const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
      cognitiveLevels.forEach(lvl => {
        const count = grid[dKey][lvl];
        if (count === 0) {
          emptyCellsCount++;
          emptySlotsList.push({
            domainKey: dKey,
            domainCode: dom.code,
            domainName: dom.name,
            level: lvl
          });
        } else if (count < targetPerCell) {
          deficitCellsCount++;
          deficitSlotsList.push({
            domainKey: dKey,
            domainCode: dom.code,
            domainName: dom.name,
            level: lvl,
            count,
            needed: targetPerCell - count
          });
        } else {
          metTargetCellsCount++;
        }
      });
    });

    const totalCells = 24;
    const coveragePercent = Math.round(((totalCells - emptyCellsCount) / totalCells) * 100);

    return {
      grid,
      domainTotals,
      subTotals,
      unassignedCount,
      emptyCellsCount,
      deficitCellsCount,
      metTargetCellsCount,
      emptySlotsList,
      deficitSlotsList,
      coveragePercent
    };
  }, [questions, targetPerCell]);

  // Available sub-competencies for current selected domain
  const currentSubCompetencies = useMemo(() => {
    if (filterDomain === 'ALL' || filterDomain === 'UNASSIGNED') {
      return [];
    }
    const dom = DIGITAL_COMPETENCY_DOMAINS[filterDomain as DigitalCompetencyDomainKey];
    return dom ? dom.subCompetencies : [];
  }, [filterDomain]);

  // Check if any matrix filter is active
  const isMatrixFilterActive = 
    filterDomain !== 'ALL' || 
    filterSubCompetency !== 'ALL' || 
    filterMatrixStatus !== 'ALL';

  const handleResetMatrixFilters = () => {
    vibrateTap();
    soundFx.playClick();
    onDomainChange('ALL');
    onSubCompetencyChange('ALL');
    onMatrixStatusChange('ALL');
    onLevelChange('ALL');
  };

  const handleSelectCell = (domainKey: DigitalCompetencyDomainKey, level: CognitiveLevel) => {
    vibrateTap();
    soundFx.playClick();
    onDomainChange(domainKey);
    onLevelChange(level);
    onSubCompetencyChange('ALL');
  };

  return (
    <div className="fluent-card bg-[#15072e] border border-amber-400/40 rounded-[4px] p-2.5 sm:p-3 space-y-2.5 shadow-lg relative z-20">
      
      {/* Top Header Bar: Title, KPI Indicators, and Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/25 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1.5 bg-gradient-to-br from-amber-500 to-purple-600 rounded text-slate-950 font-bold shadow-sm">
            <Target className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs uppercase tracking-wide text-amber-300 flex items-center gap-1.5">
                <span>Ma Trận Độ Phủ Khung Năng Lực BTI 2026</span>
              </span>
              <span className="px-1.5 py-0.2 text-[10px] font-bold font-mono rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                TT 02/2025
              </span>
            </div>
            <p className="text-[10.5px] text-[#B6A6D8] font-mono">
              Lọc theo 6 Miền Năng Lực Số, 4 Mức Độ Nhận Thức &amp; Kỹ năng còn thiếu trong ma trận
            </p>
          </div>
        </div>

        {/* Quick KPI badges & Mini Heatmap Toggle */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <span 
            className={`px-2 py-0.5 rounded-[4px] border font-bold flex items-center gap-1 ${
              matrixStats.coveragePercent >= 80 
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
                : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
            }`}
            title="Tỷ lệ phủ kín ma trận (ô có ít nhất 1 câu)"
          >
            <span>Độ phủ:</span>
            <strong className="text-white">{matrixStats.coveragePercent}%</strong>
          </span>

          {matrixStats.emptyCellsCount > 0 && (
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                onMatrixStatusChange('GAP_EMPTY');
              }}
              className={`px-2 py-0.5 rounded-[4px] border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
                filterMatrixStatus === 'GAP_EMPTY'
                  ? 'bg-rose-600 text-white border-rose-400 shadow-sm'
                  : 'bg-rose-950/60 hover:bg-rose-900/80 border-rose-500/40 text-rose-300'
              }`}
              title="Xem danh sách các ô ma trận chưa có câu hỏi (0 câu)"
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>{matrixStats.emptyCellsCount} ô trắng</span>
            </button>
          )}

          {matrixStats.unassignedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                onMatrixStatusChange('UNASSIGNED');
                onDomainChange('UNASSIGNED');
              }}
              className={`px-2 py-0.5 rounded-[4px] border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
                filterMatrixStatus === 'UNASSIGNED' || filterDomain === 'UNASSIGNED'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                  : 'bg-purple-950/60 hover:bg-purple-900/80 border-purple-500/40 text-purple-300'
              }`}
              title="Lọc các câu hỏi chưa được gán Miền Năng Lực Số"
            >
              <HelpCircle className="w-3 h-3 text-purple-400" />
              <span>{matrixStats.unassignedCount} chưa gán</span>
            </button>
          )}

          {/* Toggle Mini Heatmap */}
          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              setIsMiniGridOpen(prev => !prev);
            }}
            className={`px-2.5 py-1 rounded-[4px] border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition ${
              isMiniGridOpen
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                : 'bg-[#241148] hover:bg-white/10 text-amber-300 border-amber-400/40'
            }`}
            title="Bật/Tắt Lưới Ma Trận 6x4 Thu Nhỏ để lọc nhanh theo từng ô"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Lưới 6x4 Nhanh</span>
            {isMiniGridOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Coverage Status Quick Filter Buttons (Tất cả / Kỹ năng còn thiếu / Đã đạt chuẩn / Chưa gán) */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 text-[11px] flex items-center gap-1">
            <Filter className="w-3 h-3 text-amber-400" />
            <span>Trạng thái độ phủ:</span>
          </span>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              onMatrixStatusChange('ALL');
            }}
            className={`px-2 py-0.5 rounded-[4px] text-[11px] font-bold border transition cursor-pointer ${
              filterMatrixStatus === 'ALL' && filterDomain !== 'UNASSIGNED'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-[#241148] text-slate-300 border-white/10 hover:bg-white/5 hover:text-white'
            }`}
          >
            Tất cả ({questions.length})
          </button>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              onMatrixStatusChange('GAP_DEFICIT');
            }}
            className={`px-2 py-0.5 rounded-[4px] text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
              filterMatrixStatus === 'GAP_DEFICIT'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/60'
            }`}
            title="Lọc các câu hỏi thuộc ô/kỹ năng còn thiếu (dưới 3 câu/ô) để bổ sung"
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Kỹ năng thiếu (&lt;3 câu)</span>
            <span className="px-1 py-0.1 bg-black/40 rounded text-[9.5px]">
              {matrixStats.deficitCellsCount} ô
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              onMatrixStatusChange('MET_TARGET');
            }}
            className={`px-2 py-0.5 rounded-[4px] text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
              filterMatrixStatus === 'MET_TARGET'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/60'
            }`}
            title="Lọc các câu hỏi thuộc ô đã đạt chuẩn chỉ tiêu (≥ 3 câu/ô)"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Đã đạt chuẩn (≥3 câu)</span>
            <span className="px-1 py-0.1 bg-black/40 rounded text-[9.5px]">
              {matrixStats.metTargetCellsCount} ô
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              onMatrixStatusChange('UNASSIGNED');
              onDomainChange('UNASSIGNED');
            }}
            className={`px-2 py-0.5 rounded-[4px] text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
              filterMatrixStatus === 'UNASSIGNED' || filterDomain === 'UNASSIGNED'
                ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                : 'bg-purple-950/40 text-purple-300 border-purple-500/30 hover:bg-purple-900/60'
            }`}
            title="Lọc các câu hỏi chưa được gán nhãn Khung BTI để phân loại"
          >
            <HelpCircle className="w-3 h-3 text-purple-400" />
            <span>Chưa gắn Khung BTI ({matrixStats.unassignedCount})</span>
          </button>
        </div>

        {/* Clear Matrix Filters Button */}
        {isMatrixFilterActive && (
          <button
            type="button"
            onClick={handleResetMatrixFilters}
            className="text-[11px] text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 px-2 py-0.5 rounded border border-rose-500/40 font-bold flex items-center gap-1 cursor-pointer transition ml-auto"
          >
            <X className="w-3 h-3" />
            <span>Đặt lại bộ lọc năng lực</span>
          </button>
        )}
      </div>

      {/* 6 Digital Competency Domain Quick Select Pills (Miền I -> Miền VI) */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-thin">
          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              onDomainChange('ALL');
              onSubCompetencyChange('ALL');
            }}
            className={`px-2.5 py-1 rounded-[4px] text-xs font-bold border transition cursor-pointer shrink-0 ${
              filterDomain === 'ALL'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-[#241148] text-slate-300 border-white/10 hover:bg-white/5 hover:text-white'
            }`}
          >
            Tất cả 6 Miền ({questions.length - matrixStats.unassignedCount})
          </button>

          {domainKeys.map(dKey => {
            const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
            const isSelected = filterDomain === dKey;
            const count = matrixStats.domainTotals[dKey];
            const hasEmptyCell = cognitiveLevels.some(l => matrixStats.grid[dKey][l] === 0);

            return (
              <button
                key={dKey}
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  if (isSelected) {
                    onDomainChange('ALL');
                    onSubCompetencyChange('ALL');
                  } else {
                    onDomainChange(dKey);
                    onSubCompetencyChange('ALL');
                  }
                }}
                className={`px-2.5 py-1 rounded-[4px] text-xs font-bold border transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm ring-1 ring-amber-300'
                    : 'bg-[#1e0a3d] text-slate-200 border-purple-500/30 hover:bg-purple-900/40'
                }`}
                title={dom.description}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: dom.color }}
                />
                <span className="font-mono">{dom.code}:</span>
                <span className="font-sans font-medium text-[11.5px] truncate max-w-[150px] sm:max-w-none">
                  {dom.name}
                </span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  isSelected ? 'bg-black/30 text-slate-950' : 'bg-black/40 text-amber-300'
                }`}>
                  {count}
                </span>
                {hasEmptyCell && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping shrink-0" title="Miền này có ô trống cần bổ sung!" />
                )}
              </button>
            );
          })}
        </div>

        {/* 24 Sub-Competency Filter Pills (shown when a specific domain is selected) */}
        {currentSubCompetencies.length > 0 && (
          <div className="p-2 bg-[#100421] border border-purple-500/30 rounded-[4px] space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="text-amber-300 font-bold">
                Tiêu chí thành phần của {DIGITAL_COMPETENCY_DOMAINS[filterDomain as DigitalCompetencyDomainKey]?.name}:
              </span>
              {filterSubCompetency !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    onSubCompetencyChange('ALL');
                  }}
                  className="text-rose-300 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Xóa lọc tiêu chí</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onSubCompetencyChange('ALL');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition cursor-pointer ${
                  filterSubCompetency === 'ALL'
                    ? 'bg-purple-600 text-white border-purple-400'
                    : 'bg-slate-900/60 text-slate-300 border-white/10 hover:bg-white/5'
                }`}
              >
                Tất cả tiêu chí
              </button>

              {currentSubCompetencies.map(sub => {
                const isSelected = filterSubCompetency === sub.code;
                const count = matrixStats.subTotals[sub.code] || 0;
                const isDeficit = count < targetPerCell;

                return (
                  <button
                    key={sub.code}
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      soundFx.playClick();
                      onSubCompetencyChange(isSelected ? 'ALL' : sub.code);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] border transition cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-300 shadow-sm'
                        : isDeficit
                        ? 'bg-amber-950/30 text-amber-300 border-amber-500/30 hover:bg-amber-900/50'
                        : 'bg-slate-900/60 text-slate-200 border-white/10 hover:bg-white/5'
                    }`}
                    title={sub.description}
                  >
                    <span className="font-bold">{sub.code}</span>
                    <span className="text-[10.5px] truncate max-w-[130px]">{sub.name}</span>
                    <span className={`px-1 py-0.1 rounded text-[9.5px] font-bold ${
                      isSelected ? 'bg-black/30 text-slate-950' : 'bg-black/40 text-slate-300'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mini 6x4 Heatmap Drawer (Interactive Cell Selection) */}
      {isMiniGridOpen && (
        <div className="p-3 bg-[#100421] border border-amber-500/40 rounded-[4px] space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between gap-2 border-b border-purple-500/30 pb-2">
            <div className="flex items-center gap-2">
              <Grid3X3 className="w-4 h-4 text-amber-400" />
              <strong className="text-xs font-mono text-amber-300">
                Lưới 6 Miền × 4 Mức Độ Nhận Thức (Bấm ô để lọc câu hỏi tức thì)
              </strong>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-600/70 border border-rose-400 inline-block" />
                <span>0 câu (Thiếu)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-600/70 border border-amber-400 inline-block" />
                <span>&lt;3 câu</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600/70 border border-emerald-400 inline-block" />
                <span>≥3 câu</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-[#180933] text-slate-300 border-b border-purple-500/30 text-[11px]">
                  <th className="p-1.5 text-left w-2/5">Miền Năng Lực (TT 02/2025)</th>
                  {cognitiveLevels.map(lvl => (
                    <th key={lvl} className="p-1.5 font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          onLevelChange(filterLevel === lvl ? 'ALL' : lvl);
                        }}
                        className={`px-2 py-0.5 rounded transition hover:text-white ${
                          filterLevel === lvl ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
                        }`}
                        title={`Bấm để lọc toàn bộ câu hỏi mức ${COGNITIVE_LEVELS[lvl].name}`}
                      >
                        {levelShortNames[lvl]} - {COGNITIVE_LEVELS[lvl].name}
                      </button>
                    </th>
                  ))}
                  <th className="p-1.5 text-right pr-2">Tổng</th>
                </tr>
              </thead>
              <tbody>
                {domainKeys.map(dKey => {
                  const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
                  const row = matrixStats.grid[dKey];
                  const isDomainSelected = filterDomain === dKey;

                  return (
                    <tr 
                      key={dKey} 
                      className={`border-b border-purple-500/20 transition ${
                        isDomainSelected ? 'bg-purple-900/30' : 'hover:bg-purple-900/20'
                      }`}
                    >
                      <td className="p-1.5 text-left font-sans">
                        <button
                          type="button"
                          onClick={() => {
                            vibrateTap();
                            soundFx.playClick();
                            onDomainChange(isDomainSelected ? 'ALL' : dKey);
                          }}
                          className="hover:underline flex items-center gap-1.5 text-left cursor-pointer"
                        >
                          <span className="font-mono font-bold text-amber-300">{dom.code}:</span>
                          <span className="text-slate-200 text-[11.5px] truncate max-w-[220px]">
                            {dom.name}
                          </span>
                        </button>
                      </td>

                      {cognitiveLevels.map(lvl => {
                        const count = row[lvl];
                        const isZero = count === 0;
                        const isMet = count >= targetPerCell;
                        const isThisCellActive = filterDomain === dKey && filterLevel === lvl;

                        return (
                          <td key={lvl} className="p-1">
                            <button
                              type="button"
                              onClick={() => handleSelectCell(dKey, lvl)}
                              className={`w-full py-1 px-1 rounded font-mono font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer ${
                                isThisCellActive
                                  ? 'ring-2 ring-amber-300 bg-amber-500 text-slate-950 shadow-md'
                                  : isZero
                                  ? 'bg-rose-950/60 border border-rose-500/50 text-rose-300 hover:bg-rose-800/80 animate-pulse'
                                  : isMet
                                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-800/70'
                                  : 'bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-800/70'
                              }`}
                              title={`Bấm để lọc: ${dom.name} × ${COGNITIVE_LEVELS[lvl].name} (${count} câu)`}
                            >
                              <span>{count}</span>
                              {isZero && onOpenAddQuestionForSlot && (
                                <span 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    vibrateTap();
                                    onOpenAddQuestionForSlot(dKey, lvl);
                                  }}
                                  className="text-[9px] hover:text-white underline ml-0.5" 
                                  title="Soạn câu hỏi ngay"
                                >
                                  +
                                </span>
                              )}
                            </button>
                          </td>
                        );
                      })}

                      <td className="p-1.5 text-right font-bold text-amber-300 pr-2">
                        {matrixStats.domainTotals[dKey]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>Bấm vào số câu trên bất kỳ ô nào để tự động lọc danh sách câu hỏi theo ô ma trận đó.</span>
            </span>

            {onNavigateToFullMatrix && (
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onNavigateToFullMatrix();
                }}
                className="text-amber-300 hover:text-amber-200 underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <span>Mở Dashboard Ma Trận Đầy Đủ (Biểu đồ Recharts, Xuất Báo Cáo A4)</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action Banner for Empty Cells Filter ('GAP_EMPTY') */}
      {filterMatrixStatus === 'GAP_EMPTY' && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-[4px] space-y-2 text-xs font-mono animate-fadeIn">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
              <strong className="text-rose-200">
                Danh sách {matrixStats.emptySlotsList.length} ô ma trận còn trống hoàn toàn (0 câu hỏi):
              </strong>
            </div>
            <span className="text-[11px] text-slate-300">
              Chọn ô để bắt đầu soạn câu hỏi bổ sung
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
            {matrixStats.emptySlotsList.map((slot, idx) => (
              <div
                key={idx}
                className="p-2 bg-[#180933] border border-rose-500/30 rounded flex items-center justify-between gap-2 hover:border-rose-400 transition"
              >
                <div className="space-y-0.5 truncate">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold truncate">
                    <span>{slot.domainCode}:</span>
                    <span className="truncate text-slate-200 text-[11px]">{slot.domainName}</span>
                  </div>
                  <div className="text-[10.5px] text-rose-300">
                    Mức độ: <strong>{COGNITIVE_LEVELS[slot.level]?.name}</strong> (0 câu)
                  </div>
                </div>

                {onOpenAddQuestionForSlot && (
                  <button
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      soundFx.playClick();
                      onOpenAddQuestionForSlot(slot.domainKey, slot.level);
                    }}
                    className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10.5px] font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
                    title={`Soạn ngay câu hỏi cho ${slot.domainCode} mức ${COGNITIVE_LEVELS[slot.level]?.name}`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>Soạn ngay</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Matrix Filter Summary Alert */}
      {isMatrixFilterActive && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-400/30 rounded-[4px] text-[11px] font-mono text-amber-200">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-amber-300">Đang lọc ma trận:</span>
            {filterDomain !== 'ALL' && (
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-200 rounded border border-amber-400/40">
                {filterDomain === 'UNASSIGNED' 
                  ? 'Chưa gán miền' 
                  : `${DIGITAL_COMPETENCY_DOMAINS[filterDomain as DigitalCompetencyDomainKey]?.code}: ${DIGITAL_COMPETENCY_DOMAINS[filterDomain as DigitalCompetencyDomainKey]?.name}`}
              </span>
            )}
            {filterSubCompetency !== 'ALL' && (
              <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-200 rounded border border-purple-400/40">
                Tiêu chí {filterSubCompetency}
              </span>
            )}
            {filterLevel !== 'ALL' && (
              <span className="px-1.5 py-0.2 bg-sky-500/20 text-sky-200 rounded border border-sky-400/40">
                Mức {COGNITIVE_LEVELS[filterLevel as CognitiveLevel]?.name || filterLevel}
              </span>
            )}
            {filterMatrixStatus !== 'ALL' && (
              <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-200 rounded border border-rose-400/40">
                {filterMatrixStatus === 'GAP_DEFICIT' && 'Kỹ năng thiếu (< 3 câu)'}
                {filterMatrixStatus === 'GAP_EMPTY' && 'Vùng trắng (0 câu)'}
                {filterMatrixStatus === 'MET_TARGET' && 'Đã đạt chuẩn (≥ 3 câu)'}
                {filterMatrixStatus === 'UNASSIGNED' && 'Chưa gán Khung BTI'}
              </span>
            )}
            <span className="text-slate-400">({filteredCount} câu hỏi phù hợp)</span>
          </div>

          <button
            type="button"
            onClick={handleResetMatrixFilters}
            className="text-rose-300 hover:text-white underline cursor-pointer shrink-0 ml-2"
          >
            Bỏ lọc ma trận
          </button>
        </div>
      )}

    </div>
  );
};
