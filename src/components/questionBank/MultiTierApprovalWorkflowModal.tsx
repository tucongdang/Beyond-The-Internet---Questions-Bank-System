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
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#140827] border border-emerald-500/40 rounded-[6px] shadow-2xl overflow-hidden text-white font-sans flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="h-14 px-4 bg-[#0d041c] border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Stamp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <span>Quy Trình Kiểm Duyệt 3 Cấp &amp; Ký Số Điện Tử</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Hội Đồng BTI 2026
                </span>
              </h2>
              <p className="text-[11px] text-white/60 truncate">
                Kiểm định phản biện chuyên môn và ký số xác thực đề thi trước khi đưa vào ngân hàng chính thức
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Tier Step Indicator */}
        <div className="grid grid-cols-3 p-3 bg-black/40 border-b border-white/10 text-xs font-mono">
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
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar space-y-4 text-xs">
          {/* Question Summary */}
          <div className="p-3 rounded bg-white/[0.03] border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300">
              <span>Mã câu hỏi: {question.id}</span>
              <span>Trạng thái hiện tại: {question.approval_status || 'PENDING_REVIEW'}</span>
            </div>
            <p className="font-semibold text-white leading-relaxed">{question.question_text}</p>
          </div>

          {/* Review Form */}
          <div className="space-y-3 font-sans">
            <div>
              <label className="text-[11px] font-mono text-white/70 block mb-1">Họ tên Cán bộ Phản biện / Giám khảo:</label>
              <input
                type="text"
                value={reviewerName}
                onChange={e => setReviewerName(e.target.value)}
                className="w-full p-2 bg-black/60 border border-white/15 rounded text-white text-xs outline-none focus:border-emerald-400 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-white/70 block mb-1">Ý kiến nhận xét &amp; Căn cứ phê duyệt:</label>
              <textarea
                rows={3}
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                className="w-full p-2 bg-black/60 border border-white/15 rounded text-white text-xs outline-none focus:border-emerald-400"
              />
            </div>

            {/* Digital Stamp Simulation */}
            <div className="p-3.5 rounded bg-emerald-950/20 border border-emerald-500/40 flex items-center justify-between gap-3 font-mono text-xs">
              <div className="space-y-0.5">
                <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Chữ Ký Số Hội Đồng Khảo Thí BTI</span>
                </div>
                <div className="text-[10px] text-white/60 truncate">{digitalSignatureKey}</div>
              </div>
              <div className="text-right text-[10px] text-emerald-400">
                <span>SHA-256 Verified</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => handleApplyApproval('REVISE_REQUESTED')}
              className="flex-1 py-2 px-3 rounded bg-amber-600/20 hover:bg-amber-600 border border-amber-500/40 text-amber-200 hover:text-white font-mono font-bold text-xs transition cursor-pointer"
            >
              Yêu Cầu Chỉnh Sửa
            </button>

            <button
              type="button"
              onClick={() => handleApplyApproval('APPROVED')}
              className="flex-1 py-2 px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
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
