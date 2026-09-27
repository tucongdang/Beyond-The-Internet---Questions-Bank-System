import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  GitMerge,
  Search,
  Filter,
  RefreshCw,
  Zap,
  Sliders,
  ChevronRight,
  Info,
  ShieldAlert,
  ArrowRight,
  Eye,
  Check,
  Sparkles,
  Layers,
  FileSpreadsheet,
  Download,
  BookOpen,
  Edit3,
  Lightbulb,
  CheckSquare
} from 'lucide-react';
import { QuestionItem } from '../../types';
import { questionBankManager } from '../../services/questionBankManager';
import {
  scanForDuplicates,
  detectDuplicatesWithAI,
  mergeDuplicateQuestions,
  autoResolveExactDuplicates,
  DuplicatePair,
  DuplicateScanSummary,
  DuplicateType
} from '../../services/duplicateDetectionService';
import { soundFx } from '../../services/audioEffects';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { vibrateTap, vibrateSuccess, vibrateError, vibrateWarning } from '../../utils/hapticUtils';
import { DIGITAL_COMPETENCY_DOMAINS } from '../../data/digitalCompetencyData';

interface DuplicateCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions?: QuestionItem[];
  onEditQuestion?: (question: QuestionItem) => void;
}

type PairFilterTab = 'ALL' | 'EXACT' | 'SEMANTIC' | 'DOMAIN' | 'REDUNDANT';

export const DuplicateCheckerModal: React.FC<DuplicateCheckerModalProps> = ({
  isOpen,
  onClose,
  questions = [],
  onEditQuestion
}) => {
  useLockBodyScroll(isOpen);

  const [threshold, setThreshold] = useState<number>(65);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStatusMessage, setScanStatusMessage] = useState<string>('');
  const [scanProgressPercent, setScanProgressPercent] = useState<number>(0);
  const [scanMode, setScanMode] = useState<'AI' | 'FAST'>('AI');

  const [pairs, setPairs] = useState<DuplicatePair[]>([]);
  const [summary, setSummary] = useState<DuplicateScanSummary | null>(null);
  const [activeTab, setActiveTab] = useState<PairFilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSuggestionPairId, setExpandedSuggestionPairId] = useState<string | null>(null);

  const [toastNotification, setToastNotification] = useState<{
    type: 'success' | 'info' | 'warning';
    title: string;
    message: string;
  } | null>(null);

  const allQuestions = questions.length > 0 ? questions : questionBankManager.getQuestions();

  // Run initial AI scan when modal opens
  useEffect(() => {
    if (isOpen) {
      handleRunAiScan(threshold);
    }
  }, [isOpen]);

  // AI-Powered Deep Scan
  const handleRunAiScan = async (minThreshold: number = threshold) => {
    soundFx.playClick();
    vibrateTap();
    setIsScanning(true);
    setScanMode('AI');
    setScanProgressPercent(10);
    setScanStatusMessage('Đang chuẩn bị dữ liệu và quét ban đầu...');

    try {
      const result = await detectDuplicatesWithAI(
        allQuestions,
        minThreshold,
        (stepMsg, pct) => {
          setScanStatusMessage(stepMsg);
          setScanProgressPercent(pct);
        }
      );
      setSummary(result);
      setPairs(result.pairs);
      soundFx.playCorrect();
      vibrateSuccess();
    } catch (err: any) {
      console.error('Error during AI duplicate scan:', err);
      // Fallback to local scan
      const fallbackResult = scanForDuplicates(allQuestions, minThreshold);
      setSummary(fallbackResult);
      setPairs(fallbackResult.pairs);
      soundFx.playWarning();
      vibrateWarning();
    } finally {
      setIsScanning(false);
    }
  };

  // Fast Heuristic Lexical Scan
  const handleRunFastScan = (minThreshold: number = threshold) => {
    soundFx.playClick();
    vibrateTap();
    setIsScanning(true);
    setScanMode('FAST');
    setScanProgressPercent(50);
    setScanStatusMessage('Đang quét nhanh từ khóa và cấu trúc văn bản...');

    setTimeout(() => {
      const result = scanForDuplicates(allQuestions, minThreshold);
      setSummary(result);
      setPairs(result.pairs);
      setIsScanning(false);
      setScanProgressPercent(100);
      soundFx.playCorrect();
      vibrateSuccess();
    }, 250);
  };

  // 1-Click Auto Delete Exact 100% Matches
  const handleAutoDeleteExact = () => {
    soundFx.playClick();
    vibrateTap();

    const exactPairs = pairs.filter(p => p.similarityScore === 100);
    if (exactPairs.length === 0) {
      setToastNotification({
        type: 'info',
        title: 'Không có câu trùng 100%',
        message: 'Không tìm thấy cặp câu trùng lặp tuyệt đối nào.'
      });
      setTimeout(() => setToastNotification(null), 3000);
      return;
    }

    const { deletedCount } = autoResolveExactDuplicates(pairs);

    // Refresh questions and rescanning
    handleRunAiScan(threshold);
    soundFx.playCorrect();
    vibrateSuccess();

    setToastNotification({
      type: 'success',
      title: 'Đã tự động xử lý trùng lặp!',
      message: `Đã dọn dẹp ${deletedCount} câu trùng 100% để giữ ngân hàng đề trong sạch.`
    });
    setTimeout(() => setToastNotification(null), 5000);
  };

  // Delete question B (Keep question A)
  const handleDeleteQuestionB = (pairId: string, qB: QuestionItem) => {
    soundFx.playClick();
    vibrateTap();

    questionBankManager.deleteQuestion(qB.id);
    setPairs(prev => prev.filter(p => p.id !== pairId));
    soundFx.playCorrect();
    vibrateSuccess();

    setToastNotification({
      type: 'success',
      title: 'Đã xóa câu trùng lặp!',
      message: `Đã xóa câu "${(qB.question_text || '').slice(0, 35)}..."`
    });
    setTimeout(() => setToastNotification(null), 3000);
  };

  // Delete question A (Keep question B)
  const handleDeleteQuestionA = (pairId: string, qA: QuestionItem) => {
    soundFx.playClick();
    vibrateTap();

    questionBankManager.deleteQuestion(qA.id);
    setPairs(prev => prev.filter(p => p.id !== pairId));
    soundFx.playCorrect();
    vibrateSuccess();

    setToastNotification({
      type: 'success',
      title: 'Đã xóa câu A!',
      message: `Đã xóa câu "${(qA.question_text || '').slice(0, 35)}...", giữ lại Câu B.`
    });
    setTimeout(() => setToastNotification(null), 3000);
  };

  // Merge Question B into Question A
  const handleMergeQuestions = (pairId: string, qA: QuestionItem, qB: QuestionItem) => {
    soundFx.playClick();
    vibrateTap();

    if (mergeDuplicateQuestions(qA, qB)) {
      setPairs(prev => prev.filter(p => p.id !== pairId));
      soundFx.playCorrect();
      vibrateSuccess();

      setToastNotification({
        type: 'success',
        title: 'Đã gộp câu thành công!',
        message: 'Đã tổng hợp thẻ tag, giải thích vào Câu A và xóa Câu B.'
      });
      setTimeout(() => setToastNotification(null), 3000);
    }
  };

  // Ignore pair / Keep both
  const handleIgnorePair = (pairId: string) => {
    soundFx.playClick();
    vibrateTap();
    setPairs(prev => prev.filter(p => p.id !== pairId));
    setToastNotification({
      type: 'info',
      title: 'Đã giữ cả 2 câu',
      message: 'Đã bỏ qua cặp này và giữ nguyên trong ngân hàng đề.'
    });
    setTimeout(() => setToastNotification(null), 2500);
  };

  // Export Duplicate Report as JSON/CSV
  const handleExportReport = () => {
    vibrateTap();
    soundFx.playClick();

    const reportData = {
      scanDate: new Date().toISOString(),
      totalScanned: allQuestions.length,
      thresholdPercent: threshold,
      summary: summary,
      pairs: pairs.map(p => ({
        similarityScore: p.similarityScore,
        domainOverlapScore: p.domainOverlapScore,
        duplicateType: p.duplicateType,
        isRedundant: p.isRedundant,
        matchReason: p.matchReason,
        overlappingConcepts: p.overlappingConcepts,
        analysis: p.analysis,
        recommendation: p.recommendation,
        differentiateSuggestion: p.differentiateSuggestion,
        questionA: {
          id: p.questionA.id,
          text: p.questionA.question_text,
          category: p.questionA.category,
          domain: p.questionA.digital_competency_domain || (p.questionA as any).domain,
          subCompetency: p.questionA.digital_sub_competency || (p.questionA as any).subCompetency
        },
        questionB: {
          id: p.questionB.id,
          text: p.questionB.question_text,
          category: p.questionB.category,
          domain: p.questionB.digital_competency_domain || (p.questionB as any).domain,
          subCompetency: p.questionB.digital_sub_competency || (p.questionB as any).subCompetency
        }
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BTI_2026_Duplicate_Audit_Report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    soundFx.playSuccess();
    vibrateSuccess();
  };

  // Filtered pairs list
  const filteredPairs = useMemo(() => {
    let list = pairs;

    if (activeTab === 'EXACT') {
      list = list.filter(p => p.similarityScore === 100 || p.duplicateType === 'EXACT');
    } else if (activeTab === 'SEMANTIC') {
      list = list.filter(p => p.duplicateType === 'SEMANTIC_PARAPHRASE' || (p.similarityScore >= 75 && p.similarityScore < 100));
    } else if (activeTab === 'DOMAIN') {
      list = list.filter(p => p.duplicateType === 'DOMAIN_OVERLAP' || (p.domainOverlapScore && p.domainOverlapScore >= 70));
    } else if (activeTab === 'REDUNDANT') {
      list = list.filter(p => p.isRedundant || p.similarityScore >= 80);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        (p.questionA.question_text || '').toLowerCase().includes(q) ||
        (p.questionB.question_text || '').toLowerCase().includes(q) ||
        (p.questionA.category || '').toLowerCase().includes(q) ||
        (p.matchReason || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [pairs, activeTab, searchQuery]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn overflow-hidden modal-backdrop-isolated select-none font-mono"
      role="dialog"
      aria-modal="true"
      aria-label="AI Phát Hiện & Xử Lý Trùng Lặp"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isScanning) {
          onClose();
          vibrateTap();
          soundFx.playClick();
        }
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl h-[92vh] max-h-[940px] bg-[#140827]/98 fluent-acrylic-surface border border-rose-500/40 rounded-[8px] shadow-[0_24px_64px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-slate-100"
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-500/30 bg-[#1B0838]/95 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-[6px] bg-gradient-to-br from-rose-500/30 to-purple-600/30 border border-rose-400/50 text-rose-300 shadow-md">
              <ShieldAlert className="w-5 h-5 text-rose-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight font-mono uppercase flex items-center gap-2">
                  <span>AI Phát Hiện & Xử Lý Trùng Lặp</span>
                  <span className="text-rose-400 font-normal text-sm">/ Detect Duplicates</span>
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Gemini 3.8 Flash Semantic AI</span>
                </span>
              </div>
              <p className="text-xs text-[#B6A6D8] mt-0.5 font-sans">
                Tự động rà soát câu hỏi trùng lặp ngữ nghĩa, câu diễn đạt tương đồng (paraphrase) và trùng lặp miền tri thức/năng lực TT 02/2025 để giữ ngân hàng đề trong sạch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportReport}
              className="p-2 text-slate-300 hover:text-white rounded-[4px] hover:bg-white/10 transition cursor-pointer border border-white/10 flex items-center gap-1.5 text-xs"
              title="Xuất báo cáo kiểm định trùng lặp"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Xuất Báo Cáo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                vibrateTap();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-[4px] hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Notification Banner */}
        {toastNotification && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-[4px] bg-emerald-950/90 border border-emerald-500/50 text-emerald-100 flex items-center justify-between gap-3 shadow-xl animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-emerald-300">{toastNotification.title}</h4>
                <p className="text-[11.5px] text-emerald-100/90">{toastNotification.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="p-1 hover:bg-white/10 rounded text-emerald-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          
          {/* Controls & Scanner Card */}
          <div className="fluent-card p-4 rounded-[6px] border border-rose-500/35 bg-[#1A0735] space-y-3.5 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              
              {/* Threshold Slider */}
              <div className="space-y-1.5 flex-1 max-w-md">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-rose-400" />
                    <span>Ngưỡng nhạy tương đồng:</span>
                  </span>
                  <strong className="text-rose-300 font-bold text-sm">{threshold}%</strong>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  step="5"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>40% (Bao quát cao)</span>
                  <span>65% (Khuyên dùng AI)</span>
                  <span>100% (Chính xác 100%)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* AI Deep Scan Button */}
                <button
                  type="button"
                  onClick={() => handleRunAiScan(threshold)}
                  disabled={isScanning}
                  className="px-4 py-2.5 text-xs font-bold flex items-center gap-2 rounded-[4px] cursor-pointer shadow-lg bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-slate-950 hover:brightness-110 disabled:opacity-50 transition"
                  title="Quét ngữ nghĩa và phát hiện câu hỏi trùng lặp bằng mô hình Gemini 3.8 Flash"
                >
                  {isScanning && scanMode === 'AI' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Đang phân tích AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                      <span>Quét Trùng Lặp AI ({threshold}%)</span>
                    </>
                  )}
                </button>

                {/* Fast Lexical Scan Button */}
                <button
                  type="button"
                  onClick={() => handleRunFastScan(threshold)}
                  disabled={isScanning}
                  className="px-3.5 py-2.5 text-xs font-semibold flex items-center gap-1.5 rounded-[4px] cursor-pointer bg-[#241148] hover:bg-[#341866] border border-purple-500/40 text-purple-200 transition disabled:opacity-50"
                  title="Quét nhanh theo từ khóa và cấu trúc văn bản"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Quét Nhanh</span>
                </button>

                {/* Auto Delete Exact Matches */}
                <button
                  type="button"
                  onClick={handleAutoDeleteExact}
                  disabled={isScanning || !summary || summary.exactMatchesCount === 0}
                  className="px-3.5 py-2.5 text-xs font-bold flex items-center gap-1.5 rounded-[4px] cursor-pointer shadow-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 disabled:opacity-40 transition"
                  title="Tự động xóa tất cả câu bị trùng lặp 100%"
                >
                  <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                  <span>Xóa 100% Trùng ({summary?.exactMatchesCount || 0})</span>
                </button>
              </div>
            </div>

            {/* Scanning Progress */}
            {isScanning && (
              <div className="space-y-1.5 pt-2 border-t border-rose-500/20 animate-fadeIn">
                <div className="flex justify-between text-xs text-rose-200">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                    <span>{scanStatusMessage || 'Đang phân tích và so sánh từng câu hỏi...'}</span>
                  </span>
                  <span>{allQuestions.length} câu</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-rose-500/30">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${scanProgressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Scan Results KPI Bar */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="fluent-card p-3 rounded-[4px] bg-[#1A0835] border border-purple-500/30 space-y-0.5">
                <span className="text-[10px] text-slate-400 block">Tổng câu đã quét</span>
                <strong className="text-lg font-bold text-white">{summary.totalScanned}</strong>
              </div>

              <div className="fluent-card p-3 rounded-[4px] bg-rose-950/40 border border-rose-500/40 space-y-0.5">
                <span className="text-[10px] text-rose-300 block">Cặp nghi vấn trùng</span>
                <strong className="text-lg font-bold text-rose-300">{pairs.length}</strong>
              </div>

              <div className="fluent-card p-3 rounded-[4px] bg-amber-950/40 border border-amber-500/40 space-y-0.5">
                <span className="text-[10px] text-amber-300 block">Trùng tuyệt đối 100%</span>
                <strong className="text-lg font-bold text-amber-300">{summary.exactMatchesCount}</strong>
              </div>

              <div className="fluent-card p-3 rounded-[4px] bg-purple-950/40 border border-purple-500/40 space-y-0.5">
                <span className="text-[10px] text-purple-300 block">Trùng ngữ nghĩa AI</span>
                <strong className="text-lg font-bold text-purple-300">{summary.semanticMatchesCount}</strong>
              </div>

              <div className="fluent-card p-3 rounded-[4px] bg-cyan-950/40 border border-cyan-500/40 space-y-0.5">
                <span className="text-[10px] text-cyan-300 block">Trùng miền tri thức</span>
                <strong className="text-lg font-bold text-cyan-300">{summary.domainOverlapCount}</strong>
              </div>
            </div>
          )}

          {/* Filter Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/20 pb-3">
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-[4px] font-semibold transition cursor-pointer border ${
                  activeTab === 'ALL'
                    ? 'bg-rose-600/40 text-rose-200 border-rose-400/80'
                    : 'bg-[#180730] text-slate-400 border-purple-500/30 hover:text-white'
                }`}
              >
                Tất cả ({pairs.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('REDUNDANT')}
                className={`px-3 py-1.5 rounded-[4px] font-semibold transition cursor-pointer border ${
                  activeTab === 'REDUNDANT'
                    ? 'bg-rose-700/50 text-rose-100 border-rose-400'
                    : 'bg-[#180730] text-slate-400 border-purple-500/30 hover:text-white'
                }`}
              >
                Cần dọn dẹp ({pairs.filter(p => p.isRedundant || p.similarityScore >= 80).length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('SEMANTIC')}
                className={`px-3 py-1.5 rounded-[4px] font-semibold transition cursor-pointer border ${
                  activeTab === 'SEMANTIC'
                    ? 'bg-purple-600/40 text-purple-200 border-purple-400/80'
                    : 'bg-[#180730] text-slate-400 border-purple-500/30 hover:text-white'
                }`}
              >
                Trùng Ngữ Nghĩa AI ({pairs.filter(p => p.duplicateType === 'SEMANTIC_PARAPHRASE' || (p.similarityScore >= 75 && p.similarityScore < 100)).length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('DOMAIN')}
                className={`px-3 py-1.5 rounded-[4px] font-semibold transition cursor-pointer border ${
                  activeTab === 'DOMAIN'
                    ? 'bg-cyan-600/40 text-cyan-200 border-cyan-400/80'
                    : 'bg-[#180730] text-slate-400 border-purple-500/30 hover:text-white'
                }`}
              >
                Trùng Miền Tri Thức ({pairs.filter(p => p.duplicateType === 'DOMAIN_OVERLAP' || (p.domainOverlapScore && p.domainOverlapScore >= 70)).length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('EXACT')}
                className={`px-3 py-1.5 rounded-[4px] font-semibold transition cursor-pointer border ${
                  activeTab === 'EXACT'
                    ? 'bg-amber-600/40 text-amber-200 border-amber-400/80'
                    : 'bg-[#180730] text-slate-400 border-purple-500/30 hover:text-white'
                }`}
              >
                Trùng 100% ({pairs.filter(p => p.similarityScore === 100).length})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm nội dung, từ khóa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#140628] border border-rose-500/30 rounded-[4px] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>

          {/* Pairs List */}
          <div className="space-y-4">
            {filteredPairs.length === 0 ? (
              <div className="p-12 text-center bg-[#15062B] border border-dashed border-rose-500/30 rounded-[6px] space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400/70 mx-auto" />
                <h3 className="text-sm font-bold text-white">Không phát hiện câu trùng lặp!</h3>
                <p className="text-xs text-slate-400 font-sans max-w-md mx-auto">
                  {pairs.length === 0 
                    ? `Toàn bộ ngân hàng câu hỏi đạt chuẩn phân biệt và đa dạng hóa tốt ở ngưỡng ${threshold}%.` 
                    : 'Không tìm thấy cặp câu trùng phù hợp với bộ lọc hiện tại.'}
                </p>
              </div>
            ) : (
              filteredPairs.map((pair) => (
                <div 
                  key={pair.id}
                  className={`fluent-card p-4 rounded-[6px] bg-[#17062F] border transition shadow-lg ${
                    pair.isRedundant || pair.similarityScore >= 85
                      ? 'border-rose-500/50 shadow-rose-950/20 ring-1 ring-rose-500/20'
                      : 'border-rose-500/30 hover:border-rose-400/50'
                  }`}
                >
                  {/* Pair Header Banner */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b border-rose-500/20 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Similarity Badge */}
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded border flex items-center gap-1 ${
                        pair.similarityScore === 100 
                          ? 'bg-amber-500/25 text-amber-200 border-amber-400/60'
                          : pair.similarityScore >= 80 
                          ? 'bg-rose-500/25 text-rose-200 border-rose-400/60'
                          : 'bg-purple-500/25 text-purple-200 border-purple-400/60'
                      }`}>
                        <Zap className="w-3 h-3" />
                        <span>{pair.similarityScore}% TƯƠNG ĐỒNG NGỮ NGHĨA</span>
                      </span>

                      {/* Domain Overlap Badge */}
                      {pair.domainOverlapScore !== undefined && pair.domainOverlapScore > 50 && (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-cyan-300" />
                          <span>{pair.domainOverlapScore}% Trùng Miền Tri Thức</span>
                        </span>
                      )}

                      {/* AI Type Badge */}
                      <span className="px-2 py-0.5 text-[10.5px] rounded bg-purple-900/60 text-purple-200 border border-purple-500/40">
                        {pair.duplicateType === 'EXACT' 
                          ? 'Trùng Lặp Toàn Văn (Exact)' 
                          : pair.duplicateType === 'SEMANTIC_PARAPHRASE' 
                          ? 'Diễn Đạt Tương Đồng (Paraphrase)' 
                          : pair.duplicateType === 'DOMAIN_OVERLAP'
                          ? 'Trùng Miền Năng Lực'
                          : 'Khác Biệt Nhẹ'}
                      </span>

                      {pair.isAiAnalyzed && (
                        <span className="px-1.5 py-0.2 text-[10px] rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Gemini Verified</span>
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleMergeQuestions(pair.id, pair.questionA, pair.questionB)}
                        className="px-2.5 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/40 rounded-[4px] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title="Gộp thẻ tag & dữ liệu vào Câu A, xóa Câu B"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>Gộp 2 Câu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuestionB(pair.id, pair.questionB)}
                        className="px-2.5 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-400/40 rounded-[4px] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title="Xóa Câu B trùng lặp, giữ lại Câu A"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa Câu B</span>
                      </button>

                      {onEditQuestion && (
                        <button
                          type="button"
                          onClick={() => {
                            vibrateTap();
                            soundFx.playClick();
                            onEditQuestion(pair.questionB);
                          }}
                          className="px-2.5 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-400/40 rounded-[4px] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          title="Sửa Câu B để tạo sự khác biệt"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa Câu B</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleIgnorePair(pair.id)}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-[4px] text-xs transition cursor-pointer"
                        title="Giữ cả 2 câu trong ngân hàng đề"
                      >
                        Giữ cả hai
                      </button>
                    </div>
                  </div>

                  {/* AI Analysis & Reasoning Box */}
                  <div className="p-3 rounded bg-[#100320] border border-rose-500/20 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-300 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Nhận định & Khuyến nghị của AI:</span>
                      {pair.recommendation && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-200 border border-rose-400/30">
                          {pair.recommendation === 'DELETE_B' ? 'NÊN XÓA CÂU B' : pair.recommendation === 'MERGE' ? 'NÊN GỘP CÂU' : pair.recommendation === 'DIFFERENTIATE' ? 'NÊN CHỈNH SỬA PHÂN HÓA' : 'HỢP LỆ'}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 font-sans leading-relaxed text-[12px]">
                      {pair.analysis || pair.matchReason}
                    </p>

                    {/* Overlapping concepts chips */}
                    {pair.overlappingConcepts && pair.overlappingConcepts.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                        <span className="text-slate-400">Khái niệm & căn cứ trùng:</span>
                        {pair.overlappingConcepts.map((kw, i) => (
                          <span key={i} className="px-2 py-0.5 bg-rose-500/15 text-rose-200 border border-rose-400/25 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actionable differentiation suggestion */}
                    {pair.differentiateSuggestion && (
                      <div className="mt-2 pt-2 border-t border-white/10 text-[11.5px] text-amber-200 font-sans flex items-start gap-2 bg-amber-500/10 p-2 rounded border border-amber-400/20">
                        <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-300 block font-mono text-[11px]">Gợi ý phân hóa nếu muốn giữ cả 2 câu:</strong>
                          <span>{pair.differentiateSuggestion}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Side-by-side Question Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    
                    {/* Left: Question A (Keeper) */}
                    <div className="p-3.5 rounded-[6px] bg-[#110424] border border-emerald-500/40 space-y-2">
                      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          CÂU A (CÂU GỐC / GIỮ LẠI)
                        </span>
                        <span className="text-[10.5px] text-slate-400">ID: {pair.questionA.id}</span>
                      </div>

                      <p className="text-xs font-semibold text-white leading-relaxed font-sans">
                        {pair.questionA.question_text || 'Không có nội dung câu hỏi'}
                      </p>

                      {pair.questionA.options && (
                        <div className="p-2 rounded bg-black/30 border border-white/5 space-y-1 text-[11px]">
                          {Object.entries(pair.questionA.options).map(([k, v]) => (
                            <div key={k} className="text-slate-300 font-sans">
                              <strong className="text-theme-accent">{k}:</strong> {v}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400 space-y-0.5 pt-1 border-t border-white/5 font-sans">
                        <span className="text-purple-300 block">Miền: {pair.questionA.digital_competency_domain || 'Chưa gán'} • Thành phần: {pair.questionA.digital_sub_competency || 'N/A'}</span>
                        {pair.questionA.legal_reference && (
                          <span className="text-emerald-300 block text-[10.5px]">Căn cứ: {pair.questionA.legal_reference}</span>
                        )}
                      </div>
                    </div>

                    {/* Right: Question B (Duplicate Candidate) */}
                    <div className="p-3.5 rounded-[6px] bg-[#1F0727] border border-rose-500/40 space-y-2">
                      <div className="flex items-center justify-between border-b border-rose-500/20 pb-1.5">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          CÂU B (NGHI VẤN TRÙNG LẶP)
                        </span>
                        <span className="text-[10.5px] text-slate-400">ID: {pair.questionB.id}</span>
                      </div>

                      <p className="text-xs font-semibold text-rose-100 leading-relaxed font-sans">
                        {pair.questionB.question_text || 'Không có nội dung câu hỏi'}
                      </p>

                      {pair.questionB.options && (
                        <div className="p-2 rounded bg-black/30 border border-white/5 space-y-1 text-[11px]">
                          {Object.entries(pair.questionB.options).map(([k, v]) => (
                            <div key={k} className="text-rose-200/90 font-sans">
                              <strong className="text-rose-400">{k}:</strong> {v}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400 space-y-0.5 pt-1 border-t border-white/5 font-sans">
                        <span className="text-purple-300 block">Miền: {pair.questionB.digital_competency_domain || 'Chưa gán'} • Thành phần: {pair.questionB.digital_sub_competency || 'N/A'}</span>
                        {pair.questionB.legal_reference && (
                          <span className="text-rose-300 block text-[10.5px]">Căn cứ: {pair.questionB.legal_reference}</span>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-rose-500/30 bg-[#1B0838]/95 backdrop-blur-md flex items-center justify-between text-xs">
          <span className="text-slate-400 font-sans">
            Mô hình phân tích đối chiếu ngữ nghĩa & miền năng lực số BTI 2026.
          </span>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              onClose();
            }}
            className="fluent-btn-primary px-5 py-2 text-xs font-bold rounded-[4px] cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
