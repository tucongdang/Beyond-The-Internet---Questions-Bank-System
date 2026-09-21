import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Trash2, 
  X, 
  Sparkles,
  Plus,
  Edit3,
  Layers,
  ShieldCheck
} from 'lucide-react';

export type ToastType = 'success' | 'add' | 'edit' | 'delete' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  code?: string;
  duration?: number;
  timestamp: number;
}

interface QuestionBankToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const getToastIcon = (type: ToastType) => {
  switch (type) {
    case 'add':
      return <Plus className="w-4 h-4 text-emerald-300" />;
    case 'edit':
      return <Edit3 className="w-4 h-4 text-sky-300" />;
    case 'delete':
      return <Trash2 className="w-4 h-4 text-rose-300" />;
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-emerald-300" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-300" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-rose-300" />;
    case 'info':
    default:
      return <Info className="w-4 h-4 text-theme-accent" />;
  }
};

const getToastStyles = (type: ToastType) => {
  switch (type) {
    case 'add':
    case 'success':
      return {
        border: 'border-emerald-500/40',
        bgIcon: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        titleColor: 'text-emerald-200',
        progressColor: 'bg-emerald-400',
        badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
        glow: 'shadow-[0_8px_24px_rgba(16,185,129,0.22)]'
      };
    case 'edit':
      return {
        border: 'border-sky-500/40',
        bgIcon: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        titleColor: 'text-sky-200',
        progressColor: 'bg-sky-400',
        badge: 'bg-sky-950/60 text-sky-300 border-sky-500/30',
        glow: 'shadow-[0_8px_24px_rgba(56,189,248,0.22)]'
      };
    case 'delete':
      return {
        border: 'border-rose-500/40',
        bgIcon: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        titleColor: 'text-rose-200',
        progressColor: 'bg-rose-400',
        badge: 'bg-rose-950/60 text-rose-300 border-rose-500/30',
        glow: 'shadow-[0_8px_24px_rgba(244,63,94,0.25)]'
      };
    case 'warning':
      return {
        border: 'border-amber-500/40',
        bgIcon: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        titleColor: 'text-amber-200',
        progressColor: 'bg-amber-400',
        badge: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
        glow: 'shadow-[0_8px_24px_rgba(245,158,11,0.22)]'
      };
    case 'error':
      return {
        border: 'border-rose-500/40',
        bgIcon: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        titleColor: 'text-rose-200',
        progressColor: 'bg-rose-500',
        badge: 'bg-rose-950/60 text-rose-300 border-rose-500/30',
        glow: 'shadow-[0_8px_24px_rgba(244,63,94,0.25)]'
      };
    case 'info':
    default:
      return {
        border: 'border-theme-accent/40',
        bgIcon: 'bg-theme-accent/20 text-theme-accent border-theme-accent/40',
        titleColor: 'text-theme-accent',
        progressColor: 'bg-theme-accent',
        badge: 'bg-[#241148] text-theme-accent border-theme-accent/30',
        glow: 'shadow-[0_8px_24px_rgba(247,202,201,0.2)]'
      };
  }
};

const SingleToastCard: React.FC<{
  toast: ToastItem;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  const duration = toast.duration ?? 4000;
  const style = getToastStyles(toast.type);
  const [progress, setProgress] = useState<number>(100);

  useEffect(() => {
    if (duration <= 0) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remainingPct);
      if (elapsed >= duration) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [toast.id, duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.94, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -16, scale: 0.9, filter: 'blur(4px)', transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 24, stiffness: 320 }}
      className={`relative w-full max-w-sm sm:max-w-md bg-[#190839]/95 backdrop-blur-xl border ${style.border} ${style.glow} rounded-[6px] p-3.5 shadow-2xl overflow-hidden pointer-events-auto font-mono text-xs`}
    >
      <div className="flex items-start gap-3">
        {/* Icon Pill */}
        <div className={`p-1.5 rounded-[4px] border shrink-0 mt-0.5 ${style.bgIcon}`}>
          {getToastIcon(toast.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h5 className={`font-bold text-xs ${style.titleColor}`}>
              {toast.title}
            </h5>
            {toast.code && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono font-bold ${style.badge}`}>
                {toast.code}
              </span>
            )}
          </div>
          {toast.message && (
            <p className="text-slate-200 text-[11.5px] leading-relaxed font-sans line-clamp-2">
              {toast.message}
            </p>
          )}
        </div>

        {/* Dismiss X button */}
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="p-1 text-slate-400 hover:text-white rounded-[3px] hover:bg-white/10 transition cursor-pointer shrink-0 -mt-0.5"
          title="Đóng thông báo"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Auto-dismiss progress line */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/10 overflow-hidden">
          <div
            className={`h-full ${style.progressColor} transition-all duration-75`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};

export const QuestionBankToastContainer: React.FC<QuestionBankToastContainerProps> = ({
  toasts,
  onDismiss
}) => {
  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed bottom-5 right-5 z-[99999999] flex flex-col-reverse gap-2.5 max-w-[calc(100vw-2.5rem)] pointer-events-none"
      aria-live="polite"
      role="status"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <SingleToastCard key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};

// Global / React hook for triggering toasts
export function useQuestionBankToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (
    title: string,
    message?: string,
    type: ToastType = 'success',
    code?: string,
    duration = 3800
  ) => {
    const id = `qb_toast_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newToast: ToastItem = {
      id,
      title,
      message,
      type,
      code,
      duration,
      timestamp: Date.now()
    };

    setToasts(prev => {
      // Prevent duplicate toasts with the same title & message within 2.5 seconds
      const existing = prev.find(t => t.title === title && t.message === message);
      if (existing && Date.now() - existing.timestamp < 2500) {
        return prev;
      }
      return [newToast, ...prev.slice(0, 4)];
    }); // Keep at most 5 toasts on screen
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    // Specialized shortcuts:
    notifyAddQuestion: (questionId: string, questionText?: string) => {
      addToast(
        'Đã thêm câu hỏi mới',
        questionText ? `"${questionText.slice(0, 65)}${questionText.length > 65 ? '...' : ''}"` : 'Câu hỏi đã được lưu vào ngân hàng đề.',
        'add',
        questionId
      );
    },
    notifyEditQuestion: (questionId: string, questionText?: string) => {
      addToast(
        'Đã cập nhật câu hỏi',
        questionText ? `"${questionText.slice(0, 65)}${questionText.length > 65 ? '...' : ''}"` : 'Các thay đổi đã được áp dụng.',
        'edit',
        questionId
      );
    },
    notifyDeleteQuestion: (questionId: string, questionText?: string) => {
      addToast(
        'Đã xóa câu hỏi',
        questionText ? `"${questionText.slice(0, 65)}${questionText.length > 65 ? '...' : ''}"` : 'Câu hỏi đã được xóa vĩnh viễn khỏi hệ thống.',
        'delete',
        questionId
      );
    },
    notifyBulkDelete: (count: number) => {
      addToast(
        'Đã xóa hàng loạt câu hỏi',
        `Đã loại bỏ thành công ${count} câu hỏi khỏi ngân hàng đề thi.`,
        'delete',
        `${count} câu`
      );
    },
    notifyBulkUpdate: (count: number, roundName?: string) => {
      addToast(
        'Đã đổi danh mục / phân loại',
        `Đã cập nhật thuộc tính cho ${count} câu hỏi đã chọn${roundName ? ` sang "${roundName}"` : ''}.`,
        'edit',
        `${count} câu`
      );
    },
    notifyBatchApprove: (count: number) => {
      addToast(
        'Đã phê duyệt hàng loạt',
        `Đã thẩm định và duyệt thành công ${count} câu hỏi sẵn sàng thi đấu.`,
        'success',
        `${count} câu`
      );
    },
    notifyBulkImport: (count: number) => {
      addToast(
        'Nhập câu hỏi thành công',
        `Đã nhập và cấu trúc hóa ${count} câu hỏi mới vào ngân hàng đề BTI 2026.`,
        'success',
        `+${count} câu`
      );
    },
    notifyReindex: (roundName: string, count: number, prefix: string) => {
      addToast(
        `Đã chuẩn hóa mã ${roundName}`,
        `Đã đánh lại mã ${count} câu hỏi theo định dạng chuẩn (${prefix}_01, ${prefix}_02...).`,
        'info',
        `${prefix}`
      );
    }
  };
}
