import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Target,
  CheckCircle2,
  AlertTriangle,
  Layers,
  X,
  RefreshCw,
  Check,
  ChevronRight,
  TrendingUp,
  Activity,
  Flame,
  Zap,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';
import { QuestionItem, CognitiveLevel } from '../../types';
import { COGNITIVE_LEVELS } from '../../data/digitalCompetencyData';
import { DIFFICULTY_CONFIGS, DifficultyBadgeAndMeter } from './DifficultyBadgeAndMeter';
import { difficultySuggestionService, BatchDifficultyAnalysisSummary } from '../../services/difficultySuggestionService';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface DifficultyBatchSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestionItem[];
  onApplyComplete?: (count: number) => void;
}

export const DifficultyBatchSuggestionModal: React.FC<DifficultyBatchSuggestionModalProps> = ({
  isOpen,
  onClose,
  questions,
  onApplyComplete
}) => {
  useLockBodyScroll(isOpen);

  const [onlyUnverified, setOnlyUnverified] = useState<boolean>(true);
  const [filterDifference, setFilterDifference] = useState<'ALL' | 'ONLY_CHANGES'>('ONLY_CHANGES');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Run Analysis in Background
  const analysisSummary: BatchDifficultyAnalysisSummary = useMemo(() => {
    return difficultySuggestionService.analyzeBatchQuestions(questions, onlyUnverified);
  }, [questions, onlyUnverified]);

  // Initial select all items that have suggested change
  React.useEffect(() => {
    const diffIds = new Set<string>();
    analysisSummary.items.forEach(item => {
      if (item.currentLevel !== item.suggestedLevel) {
        diffIds.add(item.questionId);
      }
    });
    setSelectedIds(diffIds);
  }, [analysisSummary]);

  if (!isOpen) return null;

  // Filter items for display
  const displayedItems = analysisSummary.items.filter(item => {
    if (filterDifference === 'ONLY_CHANGES' && item.currentLevel === item.suggestedLevel) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.questionText.toLowerCase().includes(q) || item.reasoning.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleSelect = (id: string) => {
    vibrateTap();
    soundFx.playClick();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    vibrateTap();
    soundFx.playClick();
    if (selectedIds.size === displayedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedItems.map(i => i.questionId)));
    }
  };

  // Commit selected changes
  const handleApplySelected = () => {
    if (selectedIds.size === 0) return;
    vibrateTap();
    soundFx.playClick();
    setIsApplying(true);

    setTimeout(() => {
      const updates = analysisSummary.items
        .filter(item => selectedIds.has(item.questionId))
        .map(item => ({
          questionId: item.questionId,
          suggestedLevel: item.suggestedLevel
        }));

      const result = difficultySuggestionService.applyBatchSuggestions(updates);
      setIsApplying(false);
      soundFx.playSuccess();
      vibrateSuccess();

      if (onApplyComplete) {
        onApplyComplete(result.updatedCount);
      }
      onClose();
    }, 400);
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn overflow-hidden modal-backdrop-isolated select-none font-mono"
      role="dialog"
      aria-modal="true"
      aria-label="Gợi Ý & Chuẩn Hóa Mức Độ Nhận Thức Tự Động"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isApplying) {
          onClose();
          vibrateTap();
          soundFx.playClick();
        }
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl h-[92vh] max-h-[940px] bg-[#140827]/98 fluent-acrylic-surface border border-amber-400/50 rounded-[8px] shadow-[0_24px_64px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-slate-100"
      >
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-purple-500/30 flex items-center justify-between bg-gradient-to-r from-[#20093f] via-[#16072D] to-[#20093f]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[4px] bg-gradient-to-br from-amber-500/30 to-purple-600/40 text-amber-300 border border-amber-400/40 shadow-md">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                  Gợi Ý &amp; Chuẩn Hóa Mức Độ Nhận Thức Tự Động (AI Advisor)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  Background Complexity Engine
                </span>
              </div>
              <p className="text-xs text-[#B6A6D8] font-sans mt-0.5">
                Đối chiếu độ phức tạp ngữ nghĩa, từ khóa hành động và mẫu câu hỏi đã thẩm định để đề xuất mức độ nhận thức tối ưu cho ngân hàng đề.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-[4px] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top KPI Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-black/30 border-b border-purple-500/20 text-xs">
          <div className="p-2.5 rounded-[4px] bg-[#120424] border border-white/10 space-y-0.5">
            <span className="text-[10px] text-[#B6A6D8] block">Tổng số câu phân tích:</span>
            <span className="text-lg font-black text-white">{analysisSummary.totalAnalyzed} câu</span>
          </div>

          <div className="p-2.5 rounded-[4px] bg-[#120424] border border-amber-500/30 space-y-0.5">
            <span className="text-[10px] text-amber-300 block">Đề xuất điều chỉnh mức độ:</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-amber-400">{analysisSummary.totalWithSuggestedChange}</span>
              <span className="text-[10px] text-amber-300/80">câu hỏi</span>
            </div>
          </div>

          <div className="p-2.5 rounded-[4px] bg-[#120424] border border-purple-500/30 space-y-0.5">
            <span className="text-[10px] text-purple-300 block">Độ phức tạp trung bình:</span>
            <span className="text-lg font-black text-purple-200">{analysisSummary.averageComplexity} / 4.0</span>
          </div>

          <div className="p-2.5 rounded-[4px] bg-[#120424] border border-emerald-500/30 space-y-0.5">
            <span className="text-[10px] text-emerald-300 block">Đang chọn áp dụng:</span>
            <span className="text-lg font-black text-emerald-400">{selectedIds.size} câu</span>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="p-3 bg-[#16072D] border-b border-purple-500/20 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Toggle: All vs Only Changes */}
            <div className="inline-flex rounded-[3px] bg-[#100421] p-0.5 border border-purple-500/30">
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setFilterDifference('ONLY_CHANGES');
                }}
                className={`px-2.5 py-1 rounded-[2px] text-[11px] font-bold transition cursor-pointer ${
                  filterDifference === 'ONLY_CHANGES'
                    ? 'bg-theme-accent text-[#190839]'
                    : 'text-[#B6A6D8] hover:text-white'
                }`}
              >
                Chỉ câu có đề xuất thay đổi ({analysisSummary.totalWithSuggestedChange})
              </button>
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setFilterDifference('ALL');
                }}
                className={`px-2.5 py-1 rounded-[2px] text-[11px] font-bold transition cursor-pointer ${
                  filterDifference === 'ALL'
                    ? 'bg-theme-accent text-[#190839]'
                    : 'text-[#B6A6D8] hover:text-white'
                }`}
              >
                Tất cả ({analysisSummary.totalAnalyzed})
              </button>
            </div>

            {/* Scope Filter */}
            <label className="flex items-center gap-1.5 text-[11px] text-[#B6A6D8] cursor-pointer ml-1">
              <input
                type="checkbox"
                checked={onlyUnverified}
                onChange={(e) => setOnlyUnverified(e.target.checked)}
                className="rounded border-purple-500 text-amber-500 focus:ring-amber-400 cursor-pointer"
              />
              <span>Chỉ duyệt câu nháp / chờ duyệt</span>
            </label>
          </div>

          {/* Quick Select & Search */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="px-2.5 py-1 rounded-[3px] bg-white/10 hover:bg-white/15 text-slate-200 text-[11px] flex items-center gap-1 transition cursor-pointer border border-white/15"
            >
              {selectedIds.size === displayedItems.length ? <CheckSquare className="w-3.5 h-3.5 text-amber-400" /> : <Square className="w-3.5 h-3.5" />}
              <span>{selectedIds.size === displayedItems.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Questions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar bg-[#0e031c]">
          {displayedItems.length === 0 ? (
            <div className="p-8 text-center text-[#B6A6D8] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-bold text-sm text-white">Tất cả câu hỏi đều đã chuẩn hóa đúng mức độ nhận thức!</p>
              <p className="text-xs">Không có đề xuất thay đổi nào cần cập nhật.</p>
            </div>
          ) : (
            displayedItems.map((item, idx) => {
              const isSelected = selectedIds.has(item.questionId);
              const isDifferent = item.currentLevel !== item.suggestedLevel;
              const currentCfg = DIFFICULTY_CONFIGS[item.currentLevel];
              const suggestedCfg = DIFFICULTY_CONFIGS[item.suggestedLevel];

              return (
                <div
                  key={item.questionId}
                  onClick={() => toggleSelect(item.questionId)}
                  className={`p-3 rounded-[4px] border transition cursor-pointer text-xs space-y-2 ${
                    isSelected
                      ? 'bg-[#220d3f] border-amber-400/60 shadow-md'
                      : 'bg-[#140626] border-purple-500/20 hover:border-purple-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="pt-0.5">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-[#B6A6D8] font-bold">
                          #{idx + 1} &bull; Mã: {item.questionId}
                        </div>
                        <p className="font-sans text-[13px] text-white font-medium leading-snug">
                          {item.questionText}
                        </p>
                      </div>
                    </div>

                    {/* Level Transition Pill */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${currentCfg.bgBadge} ${currentCfg.textColor} border ${currentCfg.borderBadge}`}>
                        {currentCfg.label}
                      </span>
                      {isDifferent && (
                        <>
                          <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${suggestedCfg.bgBadge} ${suggestedCfg.textColor} border ${suggestedCfg.borderBadge} shadow-sm animate-pulse`}>
                            {suggestedCfg.label}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Reasoning & Diagnostics */}
                  <div className="pt-1.5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#B6A6D8]">
                    <div className="flex items-center gap-1.5 text-amber-300/90 font-sans">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{item.reasoning}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-[10.5px]">
                      <span className="text-purple-300">Độ phức tạp: <strong>{item.complexityIndex}/4.0</strong></span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="text-emerald-400">Tin cậy: <strong>{item.confidenceScore}%</strong></span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-purple-500/30 flex items-center justify-between bg-black/40 text-xs">
          <div className="text-[11px] text-[#B6A6D8]">
            Đã chọn: <strong className="text-amber-300 font-bold">{selectedIds.size}</strong> / {displayedItems.length} câu hỏi
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-[4px] bg-white/10 hover:bg-white/15 text-slate-200 transition cursor-pointer font-bold"
            >
              Hủy Bỏ
            </button>

            <button
              type="button"
              onClick={handleApplySelected}
              disabled={selectedIds.size === 0 || isApplying}
              className="px-4 py-1.5 rounded-[4px] bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold transition cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isApplying ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{isApplying ? 'Đang Cập Nhật...' : `Áp Dụng (${selectedIds.size} Câu)`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
