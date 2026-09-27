import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Scale, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  X, 
  RotateCcw, 
  Copy, 
  Check, 
  BookOpen, 
  ShieldCheck, 
  ArrowRight, 
  FileText, 
  Layers, 
  ChevronRight, 
  ChevronDown, 
  Clock, 
  Info, 
  Flame, 
  Save, 
  CheckCheck,
  Search,
  ExternalLink,
  Zap,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { QuestionItem, LegalDocument, ApprovalStatus } from '../../types';
import { 
  questionQualityReviewService, 
  QuestionQualityReviewResult, 
  QualityReviewInconsistency 
} from '../../services/questionQualityReviewService';
import { questionBankManager } from '../../services/questionBankManager';
import { questionReviewService } from '../../services/questionReviewService';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateWarning } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface QuestionQualityReviewModalProps {
  isOpen: boolean;
  question: QuestionItem | null;
  onClose: () => void;
  onQuestionUpdated?: (updatedQuestion: QuestionItem) => void;
  onShowToast?: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

type TabType = 'OVERVIEW' | 'INCONSISTENCIES' | 'DISTRACTORS' | 'DIFF_RECTIFY' | 'LEGAL_SOURCES';

export const QuestionQualityReviewModal: React.FC<QuestionQualityReviewModalProps> = ({
  isOpen,
  question,
  onClose,
  onQuestionUpdated,
  onShowToast
}) => {
  useLockBodyScroll(isOpen);

  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reviewResult, setReviewResult] = useState<QuestionQualityReviewResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [researchDepth, setResearchDepth] = useState<'fast' | 'max'>('fast');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [isApplyingFixes, setIsApplyingFixes] = useState<boolean>(false);

  // Legal documentation source selection
  const allLegalDocs = useMemo(() => questionBankManager.getDocuments(), []);
  const [selectedLegalDocIds, setSelectedLegalDocIds] = useState<Set<string>>(() => {
    return new Set(allLegalDocs.map(d => d.id));
  });
  const [customLegalContext, setCustomLegalContext] = useState<string>('');

  // Initial review trigger when opened or question changes
  useEffect(() => {
    if (isOpen && question) {
      handleRunReview();
    } else {
      setReviewResult(null);
      setErrorMessage(null);
    }
  }, [isOpen, question?.id]);

  const handleRunReview = async (overrideDepth?: 'fast' | 'max') => {
    if (!question) return;

    vibrateTap();
    soundFx.playClick();
    setIsLoading(true);
    setErrorMessage(null);

    const activeDocs = allLegalDocs.filter(d => selectedLegalDocIds.has(d.id));
    const effectiveDepth = overrideDepth || researchDepth;

    try {
      const result = await questionQualityReviewService.reviewQuestion(question, {
        legalDocuments: activeDocs,
        researchDepth: effectiveDepth,
        customLegalContext: customLegalContext.trim()
      });

      setReviewResult(result);
      vibrateSuccess();
      soundFx.playSuccess();
    } catch (err: any) {
      console.error('Quality review execution error:', err);
      setErrorMessage(err?.message || 'Không thể thực hiện thẩm định Deep Research. Vui lòng thử lại.');
      vibrateWarning();
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLegalDoc = (id: string) => {
    vibrateTap();
    setSelectedLegalDocIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id); // Keep at least one
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyReport = () => {
    if (!question || !reviewResult) return;
    vibrateTap();
    soundFx.playClick();

    const md = questionQualityReviewService.generateMarkdownReport(question, reviewResult);
    navigator.clipboard.writeText(md).then(() => {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2500);
      onShowToast?.('Đã sao chép báo cáo', 'Nội dung biên bản thẩm định pháp lý đã được chép vào Clipboard.', 'success');
    });
  };

  const handleApplySuggestedQuestion = async () => {
    if (!question || !reviewResult?.suggestedQuestion) return;

    vibrateTap();
    soundFx.playClick();
    setIsApplyingFixes(true);

    try {
      const suggested = reviewResult.suggestedQuestion;
      const updated: QuestionItem = {
        ...question,
        question_text: suggested.question_text || question.question_text,
        options: (suggested.options as any) || question.options,
        correct_key: suggested.correct_key || question.correct_key,
        explanation: suggested.explanation || question.explanation,
        legal_reference: suggested.legal_reference || question.legal_reference,
        cognitive_level: suggested.cognitive_level || question.cognitive_level,
        digital_competency_domain: suggested.digital_competency_domain || question.digital_competency_domain,
        approval_status: 'APPROVED',
        review_notes: `[Deep Research Pro] Đã tự động cập nhật văn bản pháp quy & chuẩn hóa câu hỏi (${new Date().toLocaleDateString('vi-VN')})`
      };

      questionBankManager.updateQuestion(question.id, updated);
      await questionReviewService.saveReview(updated, 'APPROVED', updated.review_notes || '');

      vibrateSuccess();
      soundFx.playSuccess();
      onShowToast?.('Đã chuẩn hóa câu hỏi', `Mã ${question.id} đã được cập nhật thành công và phê duyệt.`, 'success');
      onQuestionUpdated?.(updated);
      onClose();
    } catch (err: any) {
      console.error('Apply fix error:', err);
      onShowToast?.('Lỗi cập nhật', 'Không thể áp dụng bản sửa đổi.', 'error');
    } finally {
      setIsApplyingFixes(false);
    }
  };

  const handleSetApprovalStatus = async (status: ApprovalStatus, notes: string) => {
    if (!question) return;

    vibrateTap();
    soundFx.playClick();

    try {
      const updated: QuestionItem = {
        ...question,
        approval_status: status,
        review_notes: notes
      };

      questionBankManager.updateQuestion(question.id, updated);
      await questionReviewService.saveReview(question, status, notes);

      vibrateSuccess();
      soundFx.playSuccess();
      onShowToast?.(
        status === 'APPROVED' ? 'Đã phê duyệt' : 'Đã yêu cầu chỉnh sửa',
        `Đã lưu trạng thái thẩm định cho câu hỏi ${question.id}.`,
        'success'
      );
      onQuestionUpdated?.(updated);
      onClose();
    } catch (err: any) {
      console.error('Save status error:', err);
      onShowToast?.('Lỗi lưu trạng thái', 'Không thể cập nhật trạng thái thẩm định.', 'error');
    }
  };

  if (!isOpen || !question) return null;

  const filteredInconsistencies = (reviewResult?.inconsistencies || []).filter(item => {
    if (severityFilter === 'ALL') return true;
    return item.severity === severityFilter;
  });

  const criticalCount = (reviewResult?.inconsistencies || []).filter(i => i.severity === 'CRITICAL').length;
  const warningCount = (reviewResult?.inconsistencies || []).filter(i => i.severity === 'WARNING').length;

  if (!isOpen || !question) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn overflow-hidden modal-backdrop-isolated select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Thẩm Định Chất Lượng Câu Hỏi"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading && !isApplyingFixes) {
          onClose();
          vibrateTap();
          soundFx.playClick();
        }
      }}
    >
      <div 
        className="w-full max-w-5xl h-[92vh] max-h-[940px] bg-[#140827]/98 fluent-acrylic-surface border border-theme-accent/40 rounded-[8px] shadow-[0_24px_64px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-theme-accent/25 bg-[#1C0D38] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-gradient-to-br from-theme-accent/30 to-amber-500/20 text-theme-accent border border-theme-accent/40 flex items-center justify-center shrink-0 shadow-inner">
              <Scale className="w-5 h-5 text-theme-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-sm sm:text-base text-white">
                  Thẩm Định Chất Lượng & Đối Soát Pháp Quy
                </span>
                <span className="text-[10.5px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Deep Research Pro
                </span>
              </div>
              <p className="text-xs text-[#B6A6D8] font-mono mt-0.5">
                Mã: <strong className="text-theme-accent">{question.id}</strong> • {question.stage || 'BTI 2026'} • {question.cognitive_level || 'THONG_HIEU'} • {question.digital_competency_domain || 'MIEN_4'}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleRunReview()}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-[4px] bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-mono font-medium flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Chạy lại thẩm định với Deep Research"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-theme-accent ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Thẩm định lại</span>
            </button>

            <button
              type="button"
              onClick={handleCopyReport}
              disabled={!reviewResult}
              className="px-3 py-1.5 rounded-[4px] bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-mono font-medium flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Sao chép toàn bộ biên bản thẩm định (Markdown)"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
              <span className="hidden sm:inline">{copiedReport ? 'Đã sao chép' : 'Xuất biên bản'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="px-4 border-b border-theme-accent/20 bg-[#160A2D] flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => { vibrateTap(); setActiveTab('OVERVIEW'); }}
              className={`px-3.5 py-2.5 text-xs font-mono font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'OVERVIEW'
                  ? 'border-theme-accent text-theme-accent bg-white/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Tổng Quan & Điểm Số</span>
              {reviewResult && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  reviewResult.overallScore >= 80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {reviewResult.overallScore}/100
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => { vibrateTap(); setActiveTab('INCONSISTENCIES'); }}
              className={`px-3.5 py-2.5 text-xs font-mono font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'INCONSISTENCIES'
                  ? 'border-theme-accent text-theme-accent bg-white/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Bất Cập & Lỗi Thời</span>
              {reviewResult && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  criticalCount > 0 ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40' : 'bg-slate-700 text-slate-300'
                }`}>
                  {reviewResult.inconsistencies.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => { vibrateTap(); setActiveTab('DISTRACTORS'); }}
              className={`px-3.5 py-2.5 text-xs font-mono font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'DISTRACTORS'
                  ? 'border-theme-accent text-theme-accent bg-white/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Phương Án Nhiễu & Ma Trận</span>
            </button>

            <button
              type="button"
              onClick={() => { vibrateTap(); setActiveTab('DIFF_RECTIFY'); }}
              className={`px-3.5 py-2.5 text-xs font-mono font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'DIFF_RECTIFY'
                  ? 'border-theme-accent text-theme-accent bg-white/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Đối Soát So Sánh (Diff)</span>
            </button>

            <button
              type="button"
              onClick={() => { vibrateTap(); setActiveTab('LEGAL_SOURCES'); }}
              className={`px-3.5 py-2.5 text-xs font-mono font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'LEGAL_SOURCES'
                  ? 'border-theme-accent text-theme-accent bg-white/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Tài Liệu Đối Soát ({selectedLegalDocIds.size})</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-[#B6A6D8]">
            <span>Chế độ:</span>
            <span className="text-amber-300 font-bold">Deep Research 4 Giai đoạn</span>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar bg-[#130826]">
          {/* LOADING STATE */}
          {isLoading && (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-theme-accent/20 border-t-theme-accent animate-spin" />
                <Scale className="w-7 h-7 text-theme-accent absolute inset-0 m-auto" />
              </div>
              <div className="space-y-1">
                <h4 className="font-mono font-bold text-sm text-white">
                  Đang khởi chạy Deep Research Pro đối soát pháp quy...
                </h4>
                <p className="text-xs text-[#B6A6D8] font-sans max-w-md">
                  Hệ thống đang truy xuất Thông tư 02/2025/TT-BGDĐT, DigComp 2.2 và đối chứng dữ liệu khoa học cho câu hỏi <strong>{question.id}</strong>.
                </p>
              </div>

              {/* Progress Stepper Animation */}
              <div className="w-full max-w-md bg-[#1D0E3B] border border-theme-accent/30 rounded-[6px] p-3 text-left space-y-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1. Nạp cơ sở dữ liệu pháp lý & chuẩn năng lực số</span>
                </div>
                <div className="flex items-center gap-2 text-amber-300 animate-pulse">
                  <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin shrink-0" />
                  <span>2. Quét mâu thuẫn câu từ & thông tin văn bản hết hiệu lực...</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                  <span>3. Thẩm định bẫy tư duy các phương án gây nhiễu</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                  <span>4. Tổng hợp biên bản thẩm định & đề xuất hoàn thiện</span>
                </div>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {!isLoading && errorMessage && (
            <div className="p-4 rounded-[6px] bg-rose-950/40 border border-rose-500/50 text-rose-200 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-mono text-rose-300 block">Đã xảy ra lỗi trong quá trình thẩm định</strong>
                  <p>{errorMessage}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRunReview()}
                className="px-3 py-1 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded text-xs font-mono cursor-pointer transition shrink-0"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* CONTENT TABS */}
          {!isLoading && reviewResult && (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Score & Verdict Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Score Card */}
                    <div className="p-4 rounded-[6px] bg-[#1D0E3B] border border-theme-accent/30 flex items-center justify-between gap-4 shadow-sm">
                      <div className="space-y-1">
                        <span className="text-[11px] font-mono text-[#B6A6D8] block">ĐIỂM CHẤT LƯỢNG KHẢO THÍ</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-3xl font-black font-mono ${
                            reviewResult.overallScore >= 85 ? 'text-emerald-400' : reviewResult.overallScore >= 65 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {reviewResult.overallScore}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">/ 100</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Chuẩn kiểm định BTI 2026
                        </span>
                      </div>
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${
                        reviewResult.overallScore >= 85 
                          ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300' 
                          : reviewResult.overallScore >= 65 
                            ? 'border-amber-500/50 bg-amber-950/30 text-amber-300' 
                            : 'border-rose-500/50 bg-rose-950/30 text-rose-300'
                      }`}>
                        <Scale className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Verdict Card */}
                    <div className="p-4 rounded-[6px] bg-[#1D0E3B] border border-theme-accent/30 space-y-1.5 shadow-sm md:col-span-2 flex flex-col justify-between">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-mono text-[#B6A6D8]">KẾT LUẬN THẨM ĐỊNH HỘI ĐỒNG</span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                          reviewResult.verdict === 'APPROVED_HIGH_QUALITY'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : reviewResult.verdict === 'NEEDS_MINOR_REVISION'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}>
                          {reviewResult.verdictLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">
                        {reviewResult.summary}
                      </p>
                      <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-slate-400">
                        <span>Phát hiện: <strong className="text-rose-300">{criticalCount}</strong> bất cập nghiêm trọng</span>
                        <span>•</span>
                        <span><strong className="text-amber-300">{warningCount}</strong> cảnh báo</span>
                      </div>
                    </div>
                  </div>

                  {/* Legal Compliance Box */}
                  <div className={`p-4 rounded-[6px] border space-y-2.5 ${
                    reviewResult.legalCompliance.status === 'VALID'
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : reviewResult.legalCompliance.status === 'OUTDATED'
                        ? 'bg-rose-950/25 border-rose-500/50'
                        : 'bg-amber-950/25 border-amber-500/40'
                  }`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="font-mono font-bold text-xs text-white">
                          ĐỐI SOÁT CĂN CỨ PHÁP LÝ & HIỆU LỰC VĂN BẢN
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold border ${
                        reviewResult.legalCompliance.status === 'VALID'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}>
                        {reviewResult.legalCompliance.statusLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded bg-black/30 border border-white/5 space-y-1">
                        <span className="text-[10.5px] text-slate-400 font-mono block">Trích dẫn trong đề ban đầu:</span>
                        <p className="text-slate-200 font-mono text-xs">
                          {reviewResult.legalCompliance.citedDocument || '— (Chưa ghi rõ trích dẫn)'}
                        </p>
                      </div>
                      <div className="p-2.5 rounded bg-black/30 border border-white/5 space-y-1">
                        <span className="text-[10.5px] text-amber-300 font-mono block">Văn bản hiện hành chuẩn xác nhất:</span>
                        <p className="text-amber-200 font-mono text-xs font-semibold">
                          {reviewResult.legalCompliance.activeDocument || 'Thông tư 02/2025/TT-BGDĐT'}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1 border-t border-white/10">
                      {reviewResult.legalCompliance.analysis}
                    </p>
                  </div>

                  {/* Deep Research Steps Timeline */}
                  <div className="p-4 rounded-[6px] bg-[#1D0E3B] border border-theme-accent/25 space-y-3">
                    <span className="font-mono font-bold text-xs text-theme-accent block">
                      TIẾN TRÌNH KHẢO CỨU DEEP RESEARCH PRO (4 GIAI ĐOẠN)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                      {reviewResult.researchSteps.map((s, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-[#130826] border border-white/10 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-200 block text-[11px]">{s.phase}</span>
                            <span className="text-[10.5px] text-slate-400 block font-sans">{s.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Council Note Box */}
                  <div className="p-3.5 rounded-[6px] bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                    <span className="font-mono font-bold text-amber-300 block text-[11px]">
                      GHI CHÚ HỘI ĐỒNG KHẢO THÍ (COUNCIL RECOMMENDATION):
                    </span>
                    <p className="text-slate-200 font-sans italic leading-relaxed">
                      "{reviewResult.councilNotes}"
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: INCONSISTENCIES & OUTDATED INFO */}
              {activeTab === 'INCONSISTENCIES' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Filter Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-[6px] bg-[#1D0E3B] border border-theme-accent/30 text-xs font-mono">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-400 mr-1">Lọc mức độ:</span>
                      {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map(sev => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => { vibrateTap(); setSeverityFilter(sev); }}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                            severityFilter === sev
                              ? 'bg-theme-accent text-[#130826]'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {sev === 'ALL' ? `Tất cả (${reviewResult.inconsistencies.length})` : sev === 'CRITICAL' ? `🔴 Nghiêm trọng (${criticalCount})` : sev === 'WARNING' ? `🟡 Cảnh báo (${warningCount})` : '🔵 Thông tin'}
                        </button>
                      ))}
                    </div>
                    <span className="text-[11px] text-[#B6A6D8]">
                      Hiển thị {filteredInconsistencies.length} vấn đề phát hiện
                    </span>
                  </div>

                  {/* Issues List */}
                  {filteredInconsistencies.length === 0 ? (
                    <div className="py-12 px-4 text-center space-y-2 bg-[#1D0E3B]/40 rounded-[6px] border border-white/5">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <h4 className="font-mono font-bold text-sm text-white">
                        Không phát hiện điểm bất cập nào
                      </h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Câu hỏi không chứa dữ liệu lỗi thời, mâu thuẫn câu từ hoặc văn bản pháp lý hết hiệu lực theo bộ lọc hiện tại.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredInconsistencies.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className={`p-4 rounded-[6px] border space-y-2.5 text-xs transition ${
                            item.severity === 'CRITICAL'
                              ? 'bg-rose-950/20 border-rose-500/50 shadow-sm'
                              : item.severity === 'WARNING'
                                ? 'bg-amber-950/20 border-amber-500/40'
                                : 'bg-[#1D0E3B] border-theme-accent/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                item.severity === 'CRITICAL'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : item.severity === 'WARNING'
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              }`}>
                                {item.severity === 'CRITICAL' ? '🔴 NGHIÊM TRỌNG' : item.severity === 'WARNING' ? '🟡 CẢNH BÁO' : '🔵 THÔNG TIN'}
                              </span>
                              <span className="font-mono font-bold text-xs text-white">
                                {item.title}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                              {item.type}
                            </span>
                          </div>

                          <p className="text-slate-200 font-sans leading-relaxed">
                            {item.description}
                          </p>

                          {item.evidenceOrCitation && (
                            <div className="p-2.5 rounded bg-black/40 border border-white/5 text-[11px] font-mono text-amber-300 space-y-0.5">
                              <span className="text-slate-400 text-[10px] block">Dẫn chứng pháp quy đối chiếu:</span>
                              <span>⚖️ {item.evidenceOrCitation}</span>
                            </div>
                          )}

                          <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-500/30 text-[11px] space-y-0.5">
                            <span className="text-emerald-400 font-mono font-bold block">💡 Khuyến nghị chỉnh sửa:</span>
                            <span className="text-emerald-200 font-sans">{item.recommendation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DISTRACTORS & MATRIX */}
              {activeTab === 'DISTRACTORS' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Matrix Alignment */}
                  <div className="p-4 rounded-[6px] bg-[#1D0E3B] border border-theme-accent/30 space-y-3">
                    <span className="font-mono font-bold text-xs text-theme-accent block">
                      ĐỐI CHIẾU MA TRẬN NĂNG LỰC SỐ & CẤP ĐỘ NHẬN THỨC
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded bg-black/30 border border-white/10 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400 font-mono text-[11px]">Miền năng lực số:</span>
                          <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10.5px] ${
                            reviewResult.matrixAlignment.domainMatch ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {reviewResult.matrixAlignment.domainMatch ? '✓ Phù hợp' : '⚠️ Cần điều chỉnh'}
                          </span>
                        </div>
                        <p className="text-slate-200 font-sans mt-1">
                          {reviewResult.matrixAlignment.domainNotes}
                        </p>
                      </div>

                      <div className="p-3 rounded bg-black/30 border border-white/10 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400 font-mono text-[11px]">Cấp độ nhận thức Bloom:</span>
                          <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10.5px] ${
                            reviewResult.matrixAlignment.levelMatch ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {reviewResult.matrixAlignment.levelMatch ? '✓ Phù hợp' : '⚠️ Cần điều chỉnh'}
                          </span>
                        </div>
                        <p className="text-slate-200 font-sans mt-1">
                          {reviewResult.matrixAlignment.levelNotes}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Distractor Rigor Matrix */}
                  <div className="space-y-3">
                    <span className="font-mono font-bold text-xs text-theme-accent block">
                      THẨM TRA 4 PHƯƠNG ÁN LỰA CHỌN (DISTRACTOR RIGOR AUDIT)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(question.options || {}).map(([key, text]) => {
                        const isCorrect = question.correct_key === key || question.correct_key?.includes(key);
                        const analysis = reviewResult.distractorAnalysis?.[key];

                        return (
                          <div
                            key={key}
                            className={`p-3.5 rounded-[6px] border space-y-2 text-xs ${
                              isCorrect
                                ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm'
                                : 'bg-[#1D0E3B] border-theme-accent/25'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs ${
                                  isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-200'
                                }`}>
                                  {key}
                                </span>
                                <span className="font-mono font-bold text-xs text-slate-200">
                                  {isCorrect ? '🎯 ĐÁP ÁN ĐÚNG' : 'Phương án gây nhiễu'}
                                </span>
                              </div>
                              {analysis && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                  analysis.plausible ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                                }`}>
                                  {analysis.plausible ? 'Bẫy tốt' : 'Dễ loại trừ'}
                                </span>
                              )}
                            </div>

                            <p className="text-slate-200 font-sans leading-relaxed">
                              {text}
                            </p>

                            {analysis && (
                              <p className="text-[11px] font-sans text-slate-400 italic pt-1 border-t border-white/5">
                                "{analysis.critique}"
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: DIFF & RECTIFY */}
              {activeTab === 'DIFF_RECTIFY' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-[6px] bg-amber-500/10 border border-amber-500/30 text-xs flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-amber-200">
                      <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Hệ thống đã tự động đối soát và sinh ra bản đề xuất chuẩn hóa thay thế câu hỏi cũ.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplySuggestedQuestion}
                      disabled={isApplyingFixes}
                      className="px-3.5 py-1.5 rounded-[4px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>{isApplyingFixes ? 'Đang lưu...' : '⚡ Áp dụng bản sửa đổi ngay'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                    {/* Original Question */}
                    <div className="p-4 rounded-[6px] bg-[#1D0E3B] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <span className="font-mono font-bold text-slate-400">1. CÂU HỎI HIỆN TẠI (GỐC)</span>
                        <span className="font-mono text-[11px] text-slate-500">{question.id}</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-slate-200 font-sans leading-relaxed font-semibold">
                          {question.question_text}
                        </p>
                        <div className="space-y-1.5 pt-1">
                          {Object.entries(question.options || {}).map(([k, v]) => (
                            <div key={k} className="p-2 rounded bg-black/30 text-slate-300 font-mono text-[11px]">
                              <strong>{k}.</strong> {v}
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 text-slate-400 font-mono text-[11px] space-y-1">
                          <div>Đáp án: <strong className="text-emerald-400">{question.correct_key}</strong></div>
                          <div>Căn cứ: <span className="text-amber-300">{question.legal_reference || 'Chưa có'}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Rectified Suggested Question */}
                    <div className="p-4 rounded-[6px] bg-emerald-950/20 border border-emerald-500/40 space-y-3 shadow-inner">
                      <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
                        <span className="font-mono font-bold text-emerald-300">2. ĐỀ XUẤT CHUẨN HÓA AI (RECTIFIED)</span>
                        <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">Khuyên dùng</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-emerald-100 font-sans leading-relaxed font-semibold">
                          {reviewResult.suggestedQuestion.question_text || question.question_text}
                        </p>
                        <div className="space-y-1.5 pt-1">
                          {Object.entries(reviewResult.suggestedQuestion.options || question.options || {}).map(([k, v]) => (
                            <div key={k} className="p-2 rounded bg-black/40 text-emerald-200 font-mono text-[11px] border border-emerald-500/20">
                              <strong>{k}.</strong> {v}
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 text-emerald-300 font-mono text-[11px] space-y-1">
                          <div>Đáp án: <strong className="text-emerald-400">{reviewResult.suggestedQuestion.correct_key || question.correct_key}</strong></div>
                          <div>Căn cứ mới: <span className="text-amber-300">{reviewResult.suggestedQuestion.legal_reference || question.legal_reference}</span></div>
                          {reviewResult.suggestedQuestion.explanation && (
                            <div className="text-slate-300 font-sans text-[11px] italic mt-1 pt-1 border-t border-emerald-500/20">
                              "{reviewResult.suggestedQuestion.explanation}"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: LEGAL SOURCES */}
              {activeTab === 'LEGAL_SOURCES' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-[6px] bg-[#1D0E3B] border border-theme-accent/30 text-xs space-y-1">
                    <span className="font-mono font-bold text-theme-accent block">
                      CHỌN TÀI LIỆU QUY PHẠM PHÁP LUẬT ĐỂ ĐỐI SOÁT
                    </span>
                    <p className="text-slate-300 font-sans text-[11px]">
                      Agent Deep Research Pro sẽ quét và đối chứng nội dung câu hỏi với các tài liệu được tích chọn dưới đây.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {allLegalDocs.map(doc => {
                      const isSelected = selectedLegalDocIds.has(doc.id);
                      return (
                        <div
                          key={doc.id}
                          onClick={() => handleToggleLegalDoc(doc.id)}
                          className={`p-3.5 rounded-[6px] border cursor-pointer transition flex items-start gap-3 select-none ${
                            isSelected
                              ? 'bg-[#25124A] border-theme-accent/60 shadow-md ring-1 ring-theme-accent/30'
                              : 'bg-[#1D0E3B]/50 border-white/5 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-1 rounded accent-theme-accent cursor-pointer"
                          />
                          <div className="space-y-1 text-xs">
                            <span className="font-mono font-bold text-amber-300 block">
                              {doc.documentNumber}
                            </span>
                            <p className="text-slate-200 font-sans font-semibold leading-snug">
                              {doc.title}
                            </p>
                            <span className="text-[10.5px] text-slate-400 font-mono block">
                              {doc.issuingAuthority} • Hiệu lực: {doc.effectiveDate}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom Legal Directives */}
                  <div className="p-4 rounded-[6px] bg-[#1D0E3B] border border-theme-accent/30 space-y-2">
                    <label className="font-mono font-bold text-xs text-slate-200 block">
                      Ghi chú / Trích dẫn pháp luật bổ sung (Tùy chọn):
                    </label>
                    <textarea
                      value={customLegalContext}
                      onChange={e => setCustomLegalContext(e.target.value)}
                      placeholder="Ví dụ: Kiểm tra thêm theo Thông tư 02/2025 Điều 6 Khoản 1 về An toàn bảo mật sinh viên..."
                      rows={2}
                      className="w-full px-3 py-2 bg-[#130826] border border-white/10 rounded text-xs text-slate-100 font-sans focus:outline-none focus:border-theme-accent"
                    />
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleRunReview()}
                        className="px-3 py-1.5 rounded bg-theme-accent hover:bg-theme-accent-hover text-[#130826] font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Thẩm định lại với tài liệu đã chọn</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAL FOOTER ACTION BAR */}
        <div className="p-3.5 sm:p-4 border-t border-theme-accent/25 bg-[#1C0D38] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#B6A6D8]">Hành động Khảo thí:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap ml-auto">
            {/* Mark Needs Revision */}
            <button
              type="button"
              onClick={() => handleSetApprovalStatus('NEEDS_REVISION', reviewResult?.councilNotes || 'Cần chỉnh sửa theo biên bản thẩm định Deep Research')}
              className="px-3 py-1.5 rounded-[4px] bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/35 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Đánh dấu câu hỏi cần sửa đổi vào Firestore"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Cần sửa đổi</span>
            </button>

            {/* Direct Approve */}
            <button
              type="button"
              onClick={() => handleSetApprovalStatus('APPROVED', reviewResult?.councilNotes || 'Đã thẩm định chuẩn hóa đạt tiêu chuẩn BTI 2026')}
              className="px-3 py-1.5 rounded-[4px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Phê duyệt câu hỏi vào ngân hàng chính thức"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Phê duyệt (Approved)</span>
            </button>

            {/* Apply Rectified Version */}
            <button
              type="button"
              onClick={handleApplySuggestedQuestion}
              disabled={!reviewResult?.suggestedQuestion || isApplyingFixes}
              className="px-4 py-1.5 rounded-[4px] bg-theme-accent hover:bg-theme-accent-hover text-[#130826] font-mono font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
              title="Cập nhật trực tiếp nội dung chuẩn hóa do AI đề xuất vào Ngân hàng đề"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isApplyingFixes ? 'Đang cập nhật...' : 'Áp dụng bản sửa đổi AI'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
