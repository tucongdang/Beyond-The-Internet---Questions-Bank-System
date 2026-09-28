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
  onBatchAutoPilot?: () => void;
  onBatchDifficultySuggest?: () => void;
  onDetectDuplicates?: () => void;
  onPrintSelected?: () => void;
  onInteractiveQuizPreview?: () => void;
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
  onBatchAutoPilot,
  onBatchDifficultySuggest,
  onDetectDuplicates,
  onPrintSelected,
  onInteractiveQuizPreview,
  currentRoundName,
  canApprove,
  canDelete,
  onChangeStatus
}) => {
  const hasSelection = selectedCount > 0;

  return (
    <div className={`sticky top-2 z-40 rounded-[6px] border transition-all duration-200 overflow-hidden shadow-md font-mono ${
      isSelectionMode || hasSelection
        ? 'fluent-box border-theme-accent/60 shadow-theme-accent/15 shadow-xl ring-1 ring-theme-accent/30'
        : 'fluent-card border-theme-accent/20'
    }`}>
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Master checkbox & Selection count indicator */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Selection Mode Indicator Badge */}
          {isSelectionMode && (
            <div className="fluent-badge fluent-badge-warning flex items-center gap-1.5 text-[11px] shadow-sm animate-pulse">
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
            <span className={`fluent-badge ${
              hasSelection
                ? 'fluent-badge-accent font-bold text-[11px]'
                : 'text-slate-400 text-[11px]'
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
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onDeleteSelected();
                }}
                className="fluent-btn-secondary px-3.5 py-1.5 rounded-[4px] bg-rose-600/90 hover:bg-rose-500 text-white border-rose-400/50 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md ring-1 ring-rose-400/30"
                title="Xóa vĩnh viễn các câu hỏi đã chọn trong một lần thao tác hàng loạt"
                data-testid="bulk-delete-button"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>XÓA HÀNG LOẠT ({selectedCount})</span>
              </button>

              {/* Set Status Dropdown - Change status in batch */}
              {onChangeStatus && (
                <div className="flex items-center gap-1.5 flex-wrap">
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
                      className="fluent-input fluent-select px-3 py-1.5 rounded-[4px] text-xs font-bold transition cursor-pointer appearance-none pr-8 focus:outline-none shadow-sm"
                      title="Đổi trạng thái đồng thời tự động phân loại và gắn thẻ theo ma trận độ phủ cho các câu hỏi đã chọn"
                      defaultValue=""
                      data-testid="bulk-status-select"
                    >
                      <option value="" disabled hidden>Đổi trạng thái ({selectedCount} câu)...</option>
                      <option value="APPROVED" className="bg-[#190839] text-emerald-300 font-semibold">✓ Đã duyệt (Approved)</option>
                      <option value="PENDING_REVIEW" className="bg-[#190839] text-amber-300 font-semibold">⏱ Chờ duyệt (Pending Review)</option>
                      <option value="DRAFT" className="bg-[#190839] text-slate-200 font-semibold">📝 Bản nháp (Draft)</option>
                      <option value="NEEDS_REVISION" className="bg-[#190839] text-rose-300 font-semibold">⚠️ Yêu cầu sửa (Needs Revision)</option>
                      <option value="REJECTED" className="bg-[#190839] text-red-400 font-semibold">✕ Từ chối (Rejected)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-theme-accent absolute right-2.5 pointer-events-none" />
                  </div>

                  {/* Auto-tag and matrix coverage indicator badge */}
                  <span 
                    className="fluent-badge fluent-badge-warning hidden xl:inline-flex items-center gap-1 text-[10px] font-mono"
                    title="Hệ thống tự động phân loại miền năng lực số và gắn thẻ theo ma trận độ phủ BTI 2026 khi cập nhật trạng thái"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                    <span>Auto-tag Ma trận</span>
                  </span>

                  {/* Quick 1-click Approval */}
                  <button
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      soundFx.playClick();
                      onChangeStatus('APPROVED');
                    }}
                    className="fluent-btn-primary px-3 py-1.5 rounded-[4px] text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
                    title="Duyệt nhanh tất cả câu hỏi đã chọn sang ĐÃ DUYỆT (kèm tự động gắn thẻ ma trận)"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Duyệt ({selectedCount})</span>
                  </button>
                </div>
              )}

              {/* Interactive Quiz Preview Button */}
              {onInteractiveQuizPreview && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onInteractiveQuizPreview();
                  }}
                  className="fluent-btn-secondary px-3 py-1.5 rounded-[4px] text-amber-200 hover:text-white border-amber-400/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  title="Thử nghiệm tương tác: Mô phỏng bài thi với Progress Tracker & Phản hồi tức thì"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Thử Nghiệm ({selectedCount})</span>
                </button>
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
                  className="fluent-btn-secondary px-3 py-1.5 rounded-[4px] text-amber-200 hover:text-white border-amber-400/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  title="So sánh 2 câu hỏi đã chọn"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
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
                className="fluent-btn-secondary px-3 py-1.5 rounded-[4px] text-theme-accent hover:text-white border-theme-accent/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Thay đổi danh mục, vòng thi, miền năng lực hoặc mức độ nhận thức cho các câu hỏi đã chọn"
              >
                <FolderEdit className="w-3.5 h-3.5 text-theme-accent" />
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
                  className="fluent-btn-secondary px-3 py-1.5 rounded-[4px] text-purple-200 hover:text-white border-purple-400/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  title="Phân tích nội dung và tự động gắn thẻ (Auto-Tag) bằng AI Gemini cho các câu hỏi đã chọn"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                  <span>Auto-Tag AI</span>
                </button>
              )}

              {/* Batch AutoPilot All-in-One Authoring Studio button */}
              {onBatchAutoPilot && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onBatchAutoPilot();
                  }}
                  className="fluent-btn-primary px-3 py-1.5 rounded-[4px] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  title="Chuẩn hóa toàn diện 1-Click: Tự động phân tích phương án nhiễu, mở rộng rubric và đối soát chuẩn TT 02"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#190839] animate-pulse" />
                  <span>⚡ AutoPilot Trọn Gói</span>
                </button>
              )}

              {/* Batch Difficulty Suggestion Advisor button */}
              {onBatchDifficultySuggest && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onBatchDifficultySuggest();
                  }}
                  className="fluent-btn-secondary px-3 py-1.5 rounded-[4px] text-amber-200 hover:text-white border-amber-400/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  title="Gợi ý & chuẩn hóa mức độ nhận thức (độ khó) bằng cách đối chiếu độ phức tạp với các câu hỏi đã thẩm định trong ngân hàng"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Advisor Độ Khó</span>
                </button>
              )}

              {/* Detect Duplicates AI button */}
              {onDetectDuplicates && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onDetectDuplicates();
                  }}
                  className="fluent-btn-secondary px-3 py-1.5 rounded-[4px] text-rose-200 hover:text-white border-rose-400/50 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  title="Phát hiện câu hỏi trùng lặp hoặc chồng lấn miền tri thức bằng AI"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
                  <span>Detect Duplicates AI</span>
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
                  className="fluent-btn-primary px-3 py-1.5 rounded-[4px] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  title="Phê duyệt hàng loạt các câu hỏi đã chọn"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#190839]" />
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
                  className="fluent-btn-secondary px-3 py-1.5 rounded-[4px] text-amber-200 hover:text-white border-amber-400/30 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  title="Khôi phục hàng loạt các câu hỏi đã chọn về phiên bản liền trước"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
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
                className="fluent-btn-secondary px-3 py-1.5 rounded-[4px] text-sky-200 hover:text-white border-sky-400/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                title="Xuất các câu hỏi đã chọn ra tệp PDF hoặc JSON để in ấn và chia sẻ ngoại tuyến"
              >
                <Download className="w-3.5 h-3.5 text-sky-300" />
                <span className="hidden sm:inline">Xuất PDF • JSON ({selectedCount})</span>
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
                  className="fluent-btn-secondary px-3 py-1.5 rounded-[4px] text-amber-300 hover:text-white border-amber-300/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  title="Xem trước bản in A4 tiêu chuẩn các câu hỏi đã chọn trong hệ thống xem trước"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
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
                className="fluent-btn-secondary px-2.5 py-1.5 rounded-[4px] text-slate-300 hover:text-white text-xs transition cursor-pointer flex items-center gap-1"
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
                  className="fluent-btn-secondary px-2.5 py-1.5 rounded-[4px] text-amber-300 hover:text-white border-amber-500/30 text-xs transition cursor-pointer font-bold"
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
