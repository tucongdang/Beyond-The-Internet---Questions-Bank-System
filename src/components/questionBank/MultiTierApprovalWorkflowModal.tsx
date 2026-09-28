import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileCheck2, 
  ShieldCheck, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Clock, 
  Stamp, 
  PenTool, 
  FileText, 
  History,
  Lock,
  Layers,
  Award
} from 'lucide-react';
import { QuestionItem } from '../../types';
import { questionBankManager } from '../../services/questionBankManager';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateError } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface MultiTierApprovalWorkflowModalProps {
  isOpen: boolean;
  question: QuestionItem | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export const MultiTierApprovalWorkflowModal: React.FC<MultiTierApprovalWorkflowModalProps> = ({
  isOpen,
  question,
  onClose,
  onUpdated
}) => {
  useLockBodyScroll(isOpen);

  const [currentTier, setCurrentTier] = useState<'TIER_1_AUTHOR' | 'TIER_2_PEER_REVIEW' | 'TIER_3_COUNCIL_SEAL'>('TIER_2_PEER_REVIEW');
  const [reviewerName, setReviewerName] = useState<string>('TS. Nguyễn Văn A (Ban Giám khảo BTI)');
  const [reviewScore, setReviewScore] = useState<number>(95);
  const [reviewNote, setReviewNote] = useState<string>('Đề thi bám sát Thông tư 02/2025/TT-BGDĐT, câu hỏi phân hóa tốt.');
  const [digitalSignatureKey, setDigitalSignatureKey] = useState<string>('BTI-SIG-2026-CERT-8842-HEX');
  const [isSealed, setIsSealed] = useState<boolean>(false);

  if (!isOpen || !question || typeof document === 'undefined') return null;

  const handleApplyApproval = (status: 'APPROVED' | 'REJECTED' | 'REVISE_REQUESTED') => {
    vibrateSuccess();
    soundFx.playPacingChime('complete');

    questionBankManager.updateQuestion(question.id, {
      approval_status: status === 'APPROVED' ? 'APPROVED' : status === 'REJECTED' ? 'REJECTED' : 'DRAFT',
      reviewer_feedback: reviewNote,
      last_reviewed_by: reviewerName,
      last_reviewed_at: Date.now()
    } as any);

    setIsSealed(true);
    if (onUpdated) onUpdated();

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return createPortal(
    <div 
      className="fluent-dialog-overlay fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fadeIn modal-backdrop-isolated select-none"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="fluent-dialog w-full max-w-2xl bg-[#190839] text-[#F5EFF9] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] select-text"
      >
        {/* Header */}
        <div className="fluent-dialog-header px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-[#f7cac9] flex items-center justify-center text-[#190839] font-bold shadow-sm">
              <Stamp className="w-4 h-4 text-[#190839]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2 font-mono">
                <span>Quy Trình Kiểm Duyệt 3 Cấp &amp; Ký Số Điện Tử</span>
                <span className="fluent-badge fluent-badge-accent">
                  Hội Đồng BTI 2026
                </span>
              </h2>
              <p className="text-xs text-[#B6A6D8] truncate font-sans">
                Kiểm định phản biện chuyên môn và ký số xác thực đề thi trước khi đưa vào ngân hàng chính thức
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="fluent-dialog-close-btn"
            title="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3-Tier Step Indicator */}
        <div className="grid grid-cols-3 p-3 bg-black/30 border-b border-white/10 text-xs font-mono">
          <div className="flex items-center gap-2 text-white/60">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">1</div>
            <div>
              <div className="font-bold">Tác Giả Soạn</div>
              <div className="text-[9px] text-emerald-400">✓ Đã nộp bản thảo</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sky-300">
            <div className="w-6 h-6 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">2</div>
            <div>
              <div className="font-bold">Phản Biện (Peer)</div>
              <div className="text-[9px] text-sky-200">Đang thẩm định</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-amber-300/80">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-[10px] font-bold">3</div>
            <div>
              <div className="font-bold">Hội Đồng Ký Số</div>
              <div className="text-[9px] text-amber-300/60">Khảo thí phê duyệt</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="fluent-dialog-body p-4 sm:p-5 overflow-y-auto custom-scrollbar space-y-4 text-xs">
          {/* Question Summary */}
          <div className="fluent-box-nested p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300">
              <span className="fluent-badge fluent-badge-accent">Mã: {question.id}</span>
              <span className="fluent-badge">{question.approval_status || 'PENDING_REVIEW'}</span>
            </div>
            <p className="font-semibold text-white leading-relaxed font-sans">{question.question_text}</p>
          </div>

          {/* Review Form */}
          <div className="space-y-3 font-sans">
            <div>
              <label className="text-[11px] font-mono text-white/70 block mb-1">Họ tên Cán bộ Phản biện / Giám khảo:</label>
              <input
                type="text"
                value={reviewerName}
                onChange={e => setReviewerName(e.target.value)}
                className="w-full fluent-input px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-white/70 block mb-1">Ý kiến nhận xét &amp; Căn cứ phê duyệt:</label>
              <textarea
                rows={3}
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                className="w-full fluent-textarea p-3 text-xs leading-relaxed"
              />
            </div>

            {/* Digital Stamp Simulation */}
            <div className="fluent-box-nested p-3.5 border-emerald-500/40 flex items-center justify-between gap-3 font-mono text-xs">
              <div className="space-y-0.5">
                <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Chữ Ký Số Hội Đồng Khảo Thí BTI</span>
                </div>
                <div className="text-[10px] text-white/60 truncate">{digitalSignatureKey}</div>
              </div>
              <div className="text-right text-[10px] text-emerald-400">
                <span className="fluent-badge fluent-badge-success">SHA-256 Verified</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => handleApplyApproval('REVISE_REQUESTED')}
              className="fluent-btn-secondary flex-1 py-2 px-3 text-amber-200 border-amber-500/40 font-mono text-xs font-bold"
            >
              Yêu Cầu Chỉnh Sửa
            </button>

            <button
              type="button"
              onClick={() => handleApplyApproval('APPROVED')}
              className="fluent-btn-primary flex-1 py-2 px-3 text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Phê Duyệt &amp; Ký Số Chính Thức</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
