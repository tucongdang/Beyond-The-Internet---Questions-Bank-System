import React from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { QuestionItem } from '../../types';

interface BulkDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedQuestions: QuestionItem[];
}

export const BulkDeleteConfirmModal: React.FC<BulkDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedQuestions
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  const count = selectedQuestions.length;

  return createPortal(
    <div className="fixed inset-0 z-[10000000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden modal-backdrop-isolated select-none">
      <div className="fluent-card w-full max-w-lg bg-[#190839] border border-rose-500/40 rounded-[6px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-rose-950/60 px-5 py-3.5 border-b border-rose-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[4px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <Trash2 className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">
                XÁC NHẬN XÓA HÀNG LOẠT
              </h3>
              <p className="text-[11px] text-rose-300">
                Thao tác xóa {count} câu hỏi khỏi ngân hàng đề
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-3.5 rounded-[4px] bg-rose-950/30 border border-rose-500/30 text-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-[12.5px] text-rose-100">
                Bạn có chắc chắn muốn xóa vĩnh viễn {count} câu hỏi đã chọn?
              </p>
              <p className="text-[11.5px] leading-relaxed text-rose-300/90">
                Hành động này sẽ loại bỏ hoàn toàn các câu hỏi được đánh dấu khỏi bộ nhớ hệ thống và không thể hoàn tác.
              </p>
            </div>
          </div>

          {/* List preview (first 5 questions) */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono text-[#B6A6D8] font-semibold">
              Danh sách câu hỏi sắp bị xóa ({count}):
            </div>
            <div className="max-h-40 overflow-y-auto divide-y divide-white/5 border border-white/10 rounded-[4px] bg-[#14062E] p-2 space-y-1 custom-scrollbar">
              {selectedQuestions.slice(0, 10).map((q, idx) => (
                <div key={q.id} className="py-1 text-[11px] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono font-bold text-rose-400 shrink-0">#{q.id}</span>
                    <span className="text-slate-300 truncate">{q.question_text}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                    {q.round_name || q.stage}
                  </span>
                </div>
              ))}
              {selectedQuestions.length > 10 && (
                <div className="text-[10.5px] text-slate-400 italic pt-1 text-center">
                  ... và {selectedQuestions.length - 10} câu hỏi khác
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3 font-mono shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[4px] bg-white/5 hover:bg-white/10 text-slate-300 text-xs cursor-pointer transition"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-5 py-2 rounded-[4px] bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-lg"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xác nhận xóa {count} câu</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
