import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Cloud, 
  Save, 
  History, 
  Clock, 
  User, 
  FileEdit, 
  Sparkles, 
  Check, 
  Tag, 
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { QuestionItem, ApprovalStatus, QuestionReviewRecord, CognitiveLevel } from '../../types';
import { 
  questionReviewService, 
  REVIEW_STATUS_OPTIONS, 
  PRESET_REVIEW_NOTES, 
  getStatusInfo 
} from '../../services/questionReviewService';
import { difficultySuggestionService, DifficultySuggestionResult } from '../../services/difficultySuggestionService';
import { COGNITIVE_LEVELS } from '../../data/digitalCompetencyData';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateWarning } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface QuestionQuickReviewModalProps {
  isOpen: boolean;
  question: QuestionItem | null;
  onClose: () => void;
  onReviewSaved: (updatedQuestion: QuestionItem, status: ApprovalStatus, notes: string) => void;
}

export const QuestionQuickReviewModal: React.FC<QuestionQuickReviewModalProps> = ({
  isOpen,
  question,
  onClose,
  onReviewSaved
}) => {
  useLockBodyScroll(isOpen);

  if (!isOpen || !question) return null;
  if (typeof document === 'undefined') return null;

  const existingReview = questionReviewService.getReview(question.id);
  
  const [selectedStatus, setSelectedStatus] = useState<ApprovalStatus>(() => {
    return (existingReview?.approval_status || question.approval_status || 'PENDING_REVIEW') as ApprovalStatus;
  });

  const [notes, setNotes] = useState<string>(() => {
    return existingReview?.review_notes || question.review_notes || '';
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Background Difficulty Suggestion comparing content complexity against verified questions
  const diffSuggestion: DifficultySuggestionResult | null = React.useMemo(() => {
    if (!question || !question.question_text) return null;
    return difficultySuggestionService.suggestDifficulty(question);
  }, [question]);

  useEffect(() => {
    if (question) {
      const rev = questionReviewService.getReview(question.id);
      setSelectedStatus((rev?.approval_status || question.approval_status || 'PENDING_REVIEW') as ApprovalStatus);
      setNotes(rev?.review_notes || question.review_notes || '');
      setSaveSuccess(false);
      setErrorMessage(null);
    }
  }, [question]);

  const handleSelectStatus = (status: ApprovalStatus) => {
    vibrateTap();
    soundFx.playClick();
    setSelectedStatus(status);
  };

  const handleAddPresetNote = (preset: string) => {
    vibrateTap();
    soundFx.playClick();
    setNotes(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return preset;
      if (trimmed.includes(preset)) return trimmed;
      return `${trimmed}; ${preset}`;
    });
  };

  const handleSave = async () => {
    if (!question) return;

    vibrateTap();
    soundFx.playClick();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const result = await questionReviewService.saveReview(
        question,
        selectedStatus,
        notes
      );

      if (result.success) {
        vibrateSuccess();
        soundFx.playSuccess();
        setSaveSuccess(true);

        const updatedQ: QuestionItem = {
          ...question,
          approval_status: selectedStatus,
          review_notes: notes.trim()
        };

        setTimeout(() => {
          onReviewSaved(updatedQ, selectedStatus, notes.trim());
          onClose();
        }, 400);
      } else {
        vibrateWarning();
        setErrorMessage(result.error || 'Có lỗi khi lưu vào Firestore');
      }
    } catch (e) {
      vibrateWarning();
      setErrorMessage('Không thể kết nối hoặc lưu dữ liệu vào Firestore');
    } finally {
      setIsSaving(false);
    }
  };

  const currentStatusConfig = getStatusInfo(selectedStatus);
  const historyList = existingReview?.history || [];

  return createPortal(
    <div 
      className="fluent-dialog-overlay fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn overflow-hidden modal-backdrop-isolated select-none font-sans"
      role="dialog"
      aria-modal="true"
      aria-label="Review Nhanh Câu Hỏi"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onClose();
          vibrateTap();
          soundFx.playClick();
        }
      }}
    >
      <div 
        className="fluent-dialog w-full max-w-2xl bg-[#190839] text-[#F5EFF9] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] select-text"
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="fluent-dialog-header p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-[#f7cac9] flex items-center justify-center text-[#190839] font-bold shadow-sm">
              <ShieldCheck className="w-4 h-4 text-[#190839]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg text-white font-mono">
                  Review Nhanh Câu Hỏi
                </h3>
                <span className="fluent-badge fluent-badge-accent">
                  {question.id}
                </span>
                <span className="fluent-badge text-[#B6A6D8]">
                  {question.round_name || 'BTI 2026'}
                </span>
              </div>
              <p className="text-xs text-[#B6A6D8] mt-0.5 font-sans">
                Cập nhật trạng thái phê duyệt &amp; ghi chú thẩm định đồng bộ tức thì vào Firestore
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="fluent-dialog-close-btn"
            title="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="fluent-dialog-body p-4 sm:p-5 overflow-y-auto space-y-4 custom-scrollbar">
          {/* Question Summary Banner */}
          <div className="fluent-box-nested p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-theme-accent font-semibold flex items-center gap-1.5 font-mono">
                <FileEdit className="w-3.5 h-3.5 text-theme-accent" />
                Nội dung câu hỏi:
              </span>
              <span className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded border ${getStatusInfo(question.approval_status).badgeClass}`}>
                Hiện tại: {getStatusInfo(question.approval_status).label}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans font-medium line-clamp-3">
              {question.question_text}
            </p>
            <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] font-mono text-[#B6A6D8]">
              <span className="bg-[#241148] px-2 py-0.5 rounded border border-theme-accent/20">
                Đáp án: <strong className="text-emerald-300">{question.correct_key || '—'}</strong>
              </span>
              {question.cognitive_level && (
                <span className="bg-amber-950/40 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                  Mức độ: {question.cognitive_level}
                </span>
              )}
              {question.category && (
                <span className="bg-purple-950/40 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded truncate max-w-[200px]">
                  {question.category}
                </span>
              )}
            </div>
          </div>

          {/* AI DIFFICULTY ADVISOR & COMPLEXITY COMPARISON */}
          {diffSuggestion && (
            <div className="p-3.5 rounded-[4px] bg-gradient-to-r from-[#20093f] via-[#16072D] to-[#20093f] border border-amber-500/40 space-y-2 text-xs font-mono shadow-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <span className="font-bold text-amber-300">
                      AI Difficulty Advisor (Phân Tích Độ Phức Tạp)
                    </span>
                    <span className="text-[10px] text-white/50 block font-sans">
                      Đối chiếu cú pháp, động từ Bloom &amp; các câu hỏi đã thẩm định trong ngân hàng đề
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                    Điểm phức hợp: {diffSuggestion.complexityIndex} / 4.00
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    Độ tin cậy: {diffSuggestion.confidenceScore}% ({diffSuggestion.confidenceLevel})
                  </span>
                </div>
              </div>

              {/* Suggestion detail */}
              <div className="p-2.5 rounded bg-black/40 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-white/70">Mức độ đề xuất:</span>
                    <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                      {COGNITIVE_LEVELS[diffSuggestion.suggestedLevel]?.name || diffSuggestion.suggestedLevel}
                    </span>
                    {diffSuggestion.suggestedLevel !== question.cognitive_level && (
                      <span className="text-[10px] text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                        (Khác mức hiện tại: {question.cognitive_level ? (COGNITIVE_LEVELS[question.cognitive_level]?.name || question.cognitive_level) : 'Chưa gán'})
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  {diffSuggestion.reasoning}
                </p>

                {/* Similar Verified Questions in Bank */}
                {diffSuggestion.similarVerifiedQuestions.length > 0 && (
                  <div className="pt-1 border-t border-white/10 mt-2 space-y-1">
                    <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider block">
                      Đối chiếu câu hỏi đã thẩm định tương đồng nhất:
                    </span>
                    <div className="space-y-1">
                      {diffSuggestion.similarVerifiedQuestions.map(neighbor => (
                        <div key={neighbor.id} className="flex items-center justify-between gap-2 text-[10px] text-white/80 bg-white/5 p-1.5 rounded">
                          <span className="truncate max-w-[340px] font-sans">
                            • [{neighbor.id}] {neighbor.questionText}
                          </span>
                          <div className="flex items-center gap-1 shrink-0 font-mono">
                            <span className="text-amber-300">
                              {COGNITIVE_LEVELS[neighbor.verifiedLevel]?.name || neighbor.verifiedLevel}
                            </span>
                            <span className="text-emerald-400 font-bold">
                              ({neighbor.similarityPercentage}% trùng khớp)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STATUS SELECTOR */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-white uppercase tracking-wider">
              1. Chọn Trạng Thái Câu Hỏi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {REVIEW_STATUS_OPTIONS.map((opt) => {
                const isSelected = selectedStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectStatus(opt.value)}
                    className={`p-2.5 rounded-[4px] border text-left transition cursor-pointer flex flex-col justify-between gap-1 relative ${
                      isSelected 
                        ? `${opt.activeBtnClass} ring-2` 
                        : 'bg-[#241148]/60 hover:bg-[#241148] border-theme-accent/20 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                        {opt.value === 'APPROVED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {opt.value === 'PENDING_REVIEW' && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                        {opt.value === 'DRAFT' && <FileEdit className="w-3.5 h-3.5 text-slate-400" />}
                        {opt.value === 'NEEDS_REVISION' && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                        {opt.value === 'REJECTED' && <X className="w-3.5 h-3.5 text-red-400" />}
                        <span>{opt.label}</span>
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#B6A6D8] leading-tight line-clamp-2">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* QUICK NOTES INPUT */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                2. Ghi Chú Review Nhanh (Lưu Firestore)
              </label>
              <span className="text-[11px] text-[#B6A6D8] font-mono">
                {notes.length} ký tự
              </span>
            </div>

            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Nhập ghi chú nhận xét, lưu ý thẩm định, hoặc lý do yêu cầu sửa câu hỏi..."
              rows={3}
              className="w-full fluent-textarea p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 transition resize-y font-sans leading-relaxed"
            />

            {/* PRESET CHIPS */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-[#B6A6D8] flex items-center gap-1 font-semibold font-mono">
                <Tag className="w-3 h-3 text-theme-accent" />
                Gợi ý nhận xét nhanh (nhấp để chèn):
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {PRESET_REVIEW_NOTES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddPresetNote(preset)}
                    className="fluent-btn-secondary px-2.5 py-1 text-[11px] font-sans flex items-center gap-1 cursor-pointer"
                  >
                    <span>{preset}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FIRESTORE AUDIT TRAIL ACCORDION */}
          {historyList.length > 0 && (
            <div className="fluent-box-nested rounded-[4px] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="w-full p-2.5 px-3 flex items-center justify-between text-xs font-mono font-semibold text-[#B6A6D8] hover:text-white transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-sky-400" />
                  Lịch sử review trên Firestore ({historyList.length} lần)
                </span>
                {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showHistory && (
                <div className="p-3 border-t border-white/10 space-y-2 max-h-40 overflow-y-auto">
                  {historyList.map((h, i) => (
                    <div key={i} className="p-2 rounded bg-[#190839] border border-white/10 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className={`px-1.5 py-0.2 rounded font-bold ${getStatusInfo(h.status).badgeClass}`}>
                          {getStatusInfo(h.status).label}
                        </span>
                        <span className="text-[#B6A6D8]">
                          {new Date(h.at).toLocaleDateString('vi-VN')} {new Date(h.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {h.by}
                        </span>
                      </div>
                      {h.notes && (
                        <p className="text-slate-300 text-xs font-sans italic">
                          "{h.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ERROR ALERT */}
          {errorMessage && (
            <div className="p-2.5 rounded bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SUCCESS BADGE */}
          {saveSuccess && (
            <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Đã lưu thành công và đồng bộ Firestore tức thì!</span>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="fluent-dialog-footer p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-[#B6A6D8]">
            <Cloud className="w-4 h-4 text-sky-400" />
            <span>Bộ sưu tập: <strong className="text-white">/question_reviews/{question.id}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="fluent-btn-secondary px-3.5 py-1.5 text-xs font-semibold"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="fluent-btn-primary px-4 py-1.5 text-xs font-mono font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Đang lưu Firestore...' : 'Lưu & Đồng Bộ Firestore'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
