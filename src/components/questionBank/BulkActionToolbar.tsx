import React from 'react';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  FolderEdit, 
  CheckCircle2, 
  Download, 
  X, 
  Layers, 
  Sparkles, 
  AlertTriangle,
  FileSpreadsheet,
  ChevronDown,
  ListChecks,
  RotateCcw,
  Printer
} from 'lucide-react';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap } from '../../utils/hapticUtils';
import { ApprovalStatus } from '../../types';

interface BulkActionToolbarProps {
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
  isAllSelected: boolean;
  isSelectionMode?: boolean;
  onToggleSelectionMode?: () => void;
  onExitSelectionMode?: () => void;
  onToggleSelectAll: () => void;
  onSelectAllFiltered: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onChangeCategory: () => void;
  onBatchApprove?: () => void;
  onBatchRevert?: () => void;
  onExportSelected: () => void;
  onCompareSelected?: () => void;
  onBatchAutoTag?: () => void;
  onPrintSelected?: () => void;
  currentRoundName?: string;
  canApprove: boolean;
  canDelete: boolean;
  onChangeStatus?: (status: ApprovalStatus) => void;
}

export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  totalCount,
  filteredCount,
  selectedCount,
  isAllSelected,
  isSelectionMode = false,
  onToggleSelectionMode,
  onExitSelectionMode,
  onToggleSelectAll,
  onSelectAllFiltered,
  onClearSelection,
  onDeleteSelected,
  onChangeCategory,
  onBatchApprove,
  onBatchRevert,
  onExportSelected,
  onCompareSelected,
  onBatchAutoTag,
  onPrintSelected,
  currentRoundName,
  canApprove,
  canDelete,
  onChangeStatus
}) => {
  const hasSelection = selectedCount > 0;

  return (
    <div className={`sticky top-2 z-40 rounded-[6px] border transition-all duration-200 overflow-hidden shadow-md font-mono ${
      isSelectionMode || hasSelection
        ? 'bg-gradient-to-r from-[#2B1055] via-[#3E1D74] to-[#241148] border-theme-accent/60 shadow-theme-accent/15 shadow-xl ring-1 ring-theme-accent/30'
        : 'bg-[#190839]/85 border-theme-accent/20'
    }`}>
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Master checkbox & Selection count indicator */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Selection Mode Indicator Badge */}
          {isSelectionMode && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-bold text-[11px] shadow-sm animate-pulse">
              <ListChecks className="w-3.5 h-3.5" />
              <span>CHẾ ĐỘ CHỌN NHIỀU</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              onToggleSelectAll();
            }}
            className="flex items-center gap-2 font-bold text-slate-200 hover:text-white transition cursor-pointer select-none"
            title={isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả câu hỏi trong danh sách'}
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-theme-accent" />
            ) : selectedCount > 0 ? (
              <div className="w-4 h-4 rounded-[3px] bg-theme-accent flex items-center justify-center text-[#190839] font-black text-[10px]">
                -
              </div>
            ) : (
              <Square className="w-4 h-4 text-slate-400 hover:text-white" />
            )}
            <span>
              {isAllSelected ? 'Bỏ chọn tất cả' : `Chọn tất cả (${filteredCount})`}
            </span>
          </button>

          <div className="h-4 w-px bg-white/15 hidden sm:block" />

          {/* Badge indicator */}
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-[4px] font-bold text-[11px] border transition ${
              hasSelection
                ? 'bg-theme-accent text-[#190839] border-theme-accent shadow-sm'
                : 'bg-black/30 text-slate-400 border-white/10'
            }`}>
              Đã chọn: <strong className="font-extrabold">{selectedCount}</strong> / {filteredCount} câu
            </span>

            {hasSelection && selectedCount < filteredCount && (
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onSelectAllFiltered();
                }}
                className="text-[11px] text-sky-300 hover:text-sky-200 underline underline-offset-2 transition cursor-pointer hidden md:inline"
              >
                Chọn toàn bộ {filteredCount} câu trong bộ lọc
              </button>
            )}
          </div>

          {currentRoundName && (
            <span className="hidden xl:inline text-[11px] text-[#B6A6D8] font-normal">
              • Vòng đang lọc: <strong className="text-white">{currentRoundName}</strong>
            </span>
          )}
        </div>

        {/* Right: Actions Toolbar Buttons */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {hasSelection ? (
            <>
              {/* Delete Selected button - HIGH VISIBILITY PRIMARY BATCH ACTION */}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onDeleteSelected();
                  }}
                  className="px-3.5 py-1.5 rounded-[4px] bg-rose-600 hover:bg-rose-500 text-white border border-rose-400/50 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] ring-1 ring-rose-400/30"
                  title="Xóa vĩnh viễn các câu hỏi đã chọn trong một lần thao tác hàng loạt"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>XÓA HÀNG LOẠT ({selectedCount})</span>
                </button>
              )}

              {/* Set Status Dropdown */}
              {canApprove && onChangeStatus && (
                <div className="relative flex items-center">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        vibrateTap();
                        soundFx.playClick();
                        onChangeStatus(e.target.value as any);
                        e.target.value = '';
                      }
                    }}
                    className="px-3 py-1.5 rounded-[4px] bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-200 hover:text-white border border-indigo-400/30 text-xs font-medium transition cursor-pointer appearance-none pr-8 focus:outline-none"
                    title="Đổi trạng thái các câu hỏi đã chọn"
                    defaultValue=""
                  >
                    <option value="" disabled hidden>Cập nhật trạng thái...</option>
                    <option value="DRAFT" className="bg-[#190839] text-white">Chuyển thành: Nháp (Draft)</option>
                    <option value="PENDING_REVIEW" className="bg-[#190839] text-amber-300">Chuyển thành: Chờ duyệt (Pending)</option>
                    <option value="APPROVED" className="bg-[#190839] text-emerald-300">Chuyển thành: Đã duyệt (Approved)</option>
                    <option value="REJECTED" className="bg-[#190839] text-rose-300">Chuyển thành: Từ chối (Rejected)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-indigo-300 absolute right-2.5 pointer-events-none" />
                </div>
              )}

              {/* Compare Selected button */}
              {selectedCount === 2 && onCompareSelected && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onCompareSelected();
                  }}
                  className="px-3 py-1.5 rounded-[4px] bg-amber-600 hover:bg-amber-500 text-white border border-amber-400/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                  title="So sánh 2 câu hỏi đã chọn"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">So sánh</span>
                </button>
              )}

              {/* Change Category / Round button */}
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onChangeCategory();
                }}
                className="px-3 py-1.5 rounded-[4px] bg-theme-accent/20 hover:bg-theme-accent/30 text-theme-accent hover:text-white border border-theme-accent/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                title="Thay đổi danh mục, vòng thi, miền năng lực hoặc mức độ nhận thức cho các câu hỏi đã chọn"
              >
                <FolderEdit className="w-3.5 h-3.5" />
                <span>Đổi Danh Mục</span>
              </button>

              {/* Batch AI Auto-Tag button */}
              {onBatchAutoTag && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onBatchAutoTag();
                  }}
                  className="px-3 py-1.5 rounded-[4px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                  title="Phân tích nội dung và tự động gắn thẻ (Auto-Tag) bằng AI Gemini cho các câu hỏi đã chọn"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>Auto-Tag AI</span>
                </button>
              )}

              {/* Batch Approve button */}
              {canApprove && onBatchApprove && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onBatchApprove();
                  }}
                  className="px-3 py-1.5 rounded-[4px] bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                  title="Phê duyệt hàng loạt các câu hỏi đã chọn"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Duyệt nhanh</span>
                  <span>({selectedCount})</span>
                </button>
              )}

              {/* Batch Revert to Previous button */}
              {onBatchRevert && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onBatchRevert();
                  }}
                  className="px-3 py-1.5 rounded-[4px] bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 hover:text-white border border-amber-400/30 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  title="Khôi phục hàng loạt các câu hỏi đã chọn về phiên bản liền trước"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Khôi phục bản trước</span>
                </button>
              )}

              {/* Export Selected button */}
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onExportSelected();
                }}
                className="px-3 py-1.5 rounded-[4px] bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 hover:text-white border border-sky-400/30 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                title="Xuất các câu hỏi đã chọn ra tệp dữ liệu"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xuất JSON</span>
              </button>

              {/* Dedicated Print Preview for Selected Questions */}
              {onPrintSelected && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onPrintSelected();
                  }}
                  className="px-3 py-1.5 rounded-[4px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold border border-amber-300 text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
                  title="Xem trước bản in A4 tiêu chuẩn các câu hỏi đã chọn trong hệ thống xem trước"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-950" />
                  <span>In A4 ({selectedCount})</span>
                </button>
              )}

              {/* Deselect All */}
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onClearSelection();
                }}
                className="px-2.5 py-1.5 rounded-[4px] bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white text-xs transition cursor-pointer flex items-center gap-1"
                title="Bỏ chọn tất cả"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Bỏ chọn</span>
              </button>

              {/* Exit selection mode */}
              {onExitSelectionMode && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onExitSelectionMode();
                  }}
                  className="px-2.5 py-1.5 rounded-[4px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs transition cursor-pointer font-bold"
                  title="Thoát chế độ chọn nhiều"
                >
                  <span>Thoát chọn</span>
                </button>
              )}
            </>
          ) : isSelectionMode ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-amber-300 font-medium hidden sm:inline">
                👉 Nhấp chuột vào bất kỳ dòng/thẻ câu hỏi để chọn
              </span>
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onToggleSelectAll();
                }}
                className="px-2.5 py-1 rounded bg-theme-accent/20 hover:bg-theme-accent/30 text-theme-accent border border-theme-accent/40 font-bold text-xs cursor-pointer"
              >
                Chọn tất cả ({filteredCount})
              </button>
              {onExitSelectionMode && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onExitSelectionMode();
                  }}
                  className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-300 text-xs cursor-pointer"
                >
                  Thoát chọn
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-[#B6A6D8]">
              <Sparkles className="w-3 h-3 text-theme-accent shrink-0" />
              <span className="hidden sm:inline">Bật "Chế độ chọn nhiều" hoặc tích chọn câu hỏi để xóa/thao tác hàng loạt</span>
              <span className="sm:hidden">Tích chọn để thao tác hàng loạt</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
