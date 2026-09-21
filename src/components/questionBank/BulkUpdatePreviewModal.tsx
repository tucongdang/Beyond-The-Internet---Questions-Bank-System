import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';
import { QuestionItem } from '../../types';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';

export interface BulkPreviewItem {
  id: string;
  original: QuestionItem;
  modified: QuestionItem;
}

interface BulkUpdatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewItems: BulkPreviewItem[];
  title: string;
  onConfirm: () => void;
}

export const BulkUpdatePreviewModal: React.FC<BulkUpdatePreviewModalProps> = ({
  isOpen,
  onClose,
  previewItems,
  title,
  onConfirm
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    vibrateSuccess();
    soundFx.playCorrect();
    onConfirm();
  };

  const getChangedFields = (original: QuestionItem, modified: QuestionItem) => {
    const changes: { key: string; oldVal: string; newVal: string }[] = [];
    const keysToCheck = [
      'category', 'stage', 'round_format', 'round_name', 'cognitive_level', 
      'digital_competency_domain', 'legal_reference', 'approval_status'
    ] as (keyof QuestionItem)[];

    keysToCheck.forEach(key => {
      if (original[key] !== modified[key]) {
        changes.push({
          key: key.toString(),
          oldVal: String(original[key] || 'Trống'),
          newVal: String(modified[key] || 'Trống')
        });
      }
    });

    // Handle ID changes if reindexed
    if (original.id !== modified.id) {
      changes.push({
        key: 'id',
        oldVal: original.id,
        newVal: modified.id
      });
    }

    return changes;
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="max-w-4xl w-full h-[85vh] max-h-[85vh] rounded-[8px] border border-theme-accent/30 shadow-2xl flex flex-col bg-[#190839] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#241148] border-b border-theme-accent/20 shrink-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Xem trước thay đổi: {title}</h2>
              <p className="text-xs text-[#B6A6D8] mt-0.5">Sẽ có {previewItems.length} câu hỏi được cập nhật</p>
            </div>
          </div>
          <button 
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="grid gap-3">
            {previewItems.map(item => {
              const changes = getChangedFields(item.original, item.modified);
              
              if (changes.length === 0) return null; // No actual changes for this item

              return (
                <div key={item.id} className="p-3 bg-white/5 border border-white/10 rounded-[4px] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-theme-accent">
                    <span>{item.original.id}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 line-clamp-2 italic mb-2">
                    "{item.original.question_text}"
                  </div>
                  <div className="space-y-1.5">
                    {changes.map((change, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[10px] font-mono bg-black/40 p-1.5 rounded">
                        <span className="text-white/40 w-24 shrink-0">{change.key}:</span>
                        <span className="text-rose-300 line-through truncate max-w-[120px] sm:max-w-[180px]">{change.oldVal}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="text-emerald-300 font-bold truncate max-w-[120px] sm:max-w-[180px]">{change.newVal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-theme-accent/20 flex items-center justify-end gap-3 bg-[#14062E]">
          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-[4px] bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="fluent-btn-primary px-6 py-2 rounded-[4px] font-mono font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Xác nhận Cập nhật ({previewItems.length})</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
