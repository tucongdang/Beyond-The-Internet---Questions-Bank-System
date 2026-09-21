import React, { useEffect } from 'react';
import { X, BarChart3 } from 'lucide-react';
import { GameState, EmergencyQuestionDraft, UserResponse } from '../types';
import { AdminPollManager } from './AdminPollManager';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface EmergencyPollControlProps {
  gameState: GameState;
  allResponses?: Record<string, Record<string, UserResponse>>;
  activeAudienceCount?: number;
  isOpen: boolean;
  onClose: () => void;
  onOpenHistoryTab?: () => void;
  initialDraft?: EmergencyQuestionDraft | null;
  onClearInitialDraft?: () => void;
}

export const EmergencyPollControl: React.FC<EmergencyPollControlProps> = ({
  gameState,
  allResponses,
  activeAudienceCount = 1,
  isOpen,
  onClose,
  onOpenHistoryTab,
  initialDraft,
  onClearInitialDraft
}) => {
  useLockBodyScroll(isOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-hidden animate-fadeIn modal-backdrop-isolated">
      <div className="relative w-full max-w-5xl border border-theme-accent/30 bg-[#190839] rounded-[8px] shadow-2xl overflow-hidden h-[90vh] max-h-[90vh] flex flex-col text-white overscroll-contain">
        {/* Modal Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-accent/20 bg-[#241148] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[6px] bg-theme-accent text-[#190839] border border-theme-accent/30 flex items-center justify-center font-bold shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Hệ Thống Khảo Sát Khẩn Cấp & Live Poll Unified
              </h3>
              <p className="text-[11px] text-[#B6A6D8]">
                Phát sóng khảo sát đa dạng (2-6 đáp án), xem telemetry trực tiếp & điều khiển trên cùng một giao diện duy nhất
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[4px] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body hosting AdminPollManager */}
        <div className="p-5 sm:px-6 py-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar modal-scroll-isolated overscroll-contain">
          <AdminPollManager
            gameState={gameState}
            allResponses={allResponses}
            activeAudienceCount={activeAudienceCount}
            onOpenHistoryTab={() => {
              onClose();
              if (onOpenHistoryTab) onOpenHistoryTab();
            }}
            initialDraft={initialDraft}
            onClearInitialDraft={onClearInitialDraft}
          />
        </div>
      </div>
    </div>
  );
};
