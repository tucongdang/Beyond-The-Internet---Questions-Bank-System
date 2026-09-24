import React, { useState, useEffect } from 'react';
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
import { QuestionItem, ApprovalStatus, QuestionReviewRecord } from '../../types';
import { 
  questionReviewService, 
  REVIEW_STATUS_OPTIONS, 
  PRESET_REVIEW_NOTES, 
  getStatusInfo 
} from '../../services/questionReviewService';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateWarning } from '../../utils/hapticUtils';

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
  if (!isOpen || !question) return null;

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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#190839] border border-theme-accent/40 rounded-[6px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-theme-accent/25 bg-[#241148] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-theme-accent/20 border border-theme-accent/40 flex items-center justify-center text-theme-accent">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Review Nhanh Câu Hỏi
                </h3>
                <span className="font-mono text-xs font-bold text-theme-accent bg-[#190839] px-2 py-0.5 rounded border border-theme-accent/30">
                  {question.id}
                </span>
                <span className="text-[11px] font-mono text-[#B6A6D8] bg-white/5 px-2 py-0.5 rounded">
                  {question.round_name || 'BTI 2026'}
                </span>
              </div>
              <p className="text-xs text-[#B6A6D8] mt-0.5">
                Cập nhật trạng thái phê duyệt &amp; ghi chú thẩm định đồng bộ tức thì vào Firestore
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Question Summary Banner */}
          <div className="p-3.5 bg-[#14062E] rounded-[4px] border border-theme-accent/20 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-theme-accent font-semibold flex items-center gap-1.5">
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
              className="w-full bg-[#14062E] border border-theme-accent/30 focus:border-theme-accent rounded-[4px] p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-hidden transition resize-y font-sans leading-relaxed"
            />

            {/* PRESET CHIPS */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-[#B6A6D8] flex items-center gap-1 font-semibold">
                <Tag className="w-3 h-3 text-theme-accent" />
                Gợi ý nhận xét nhanh (nhấp để chèn):
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {PRESET_REVIEW_NOTES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddPresetNote(preset)}
                    className="px-2 py-1 rounded-[3px] bg-[#241148] hover:bg-[#2e155b] text-[#F5EFF9]/85 hover:text-white border border-theme-accent/20 text-[11px] font-sans transition cursor-pointer flex items-center gap-1"
                  >
                    <span>{preset}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FIRESTORE AUDIT TRAIL ACCORDION */}
          {historyList.length > 0 && (
            <div className="border border-theme-accent/20 rounded-[4px] bg-[#14062E]/70 overflow-hidden">
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
                <div className="p-3 border-t border-theme-accent/15 space-y-2 max-h-40 overflow-y-auto">
                  {historyList.map((h, i) => (
                    <div key={i} className="p-2 rounded bg-[#190839] border border-theme-accent/15 text-xs space-y-1">
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
        <div className="p-3.5 sm:p-4 bg-[#241148] border-t border-theme-accent/25 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-[#B6A6D8]">
            <Cloud className="w-4 h-4 text-sky-400" />
            <span>Bộ sưu tập: <strong className="text-white">/question_reviews/{question.id}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-[4px] bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-[4px] bg-theme-accent hover:bg-theme-accent-hover text-[#190839] font-bold text-xs font-mono flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Đang lưu Firestore...' : 'Lưu & Đồng Bộ Firestore'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
