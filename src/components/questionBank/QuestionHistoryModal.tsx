import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  History, 
  X, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  GitBranch, 
  GitCommit, 
  Eye, 
  ArrowRight, 
  Check, 
  Tag, 
  Scale, 
  FileText, 
  Layers, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckSquare,
  Square,
  Sliders,
  SlidersHorizontal,
  RefreshCw,
  ListChecks,
  Columns3,
  HelpCircle
} from 'lucide-react';
import { QuestionItem, QuestionVersion, QuestionActivityLog } from '../../types';
import { questionBankManager } from '../../services/questionBankManager';
import { soundFx } from '../../services/audioEffects';
import { vibrateSuccess, vibrateWarning, vibrateTap } from '../../utils/hapticUtils';
import { QuestionHistoryPdfReportModal } from './QuestionHistoryPdfReportModal';
import { Printer } from 'lucide-react';

interface QuestionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: QuestionItem | null;
  onRevertSuccess?: (updatedQuestion: QuestionItem) => void;
}

export type RevertFieldOption = 
  | 'ALL'
  | 'question_text'
  | 'options_answer'
  | 'explanation_legal'
  | 'competency_level'
  | 'time_points'
  | 'category_tags'
  | 'round_format'
  | 'media_obstacle';

interface FieldConfig {
  id: RevertFieldOption;
  label: string;
  desc: string;
  icon: string;
}

const FIELD_CONFIGS: FieldConfig[] = [
  { id: 'question_text', label: 'Nội dung câu hỏi', desc: 'Đề bài và câu hỏi chính', icon: '📝' },
  { id: 'options_answer', label: 'Phương án & Đáp án đúng', desc: 'Các lựa chọn A, B, C, D và key đáp án', icon: '🔠' },
  { id: 'explanation_legal', label: 'Giải thích & Căn cứ pháp lý', desc: 'Lời giải chi tiết và căn cứ thông tư/luật', icon: '⚖️' },
  { id: 'competency_level', label: 'Miền năng lực & Mức độ', desc: 'Miền số BTI và mức độ nhận thức', icon: '🎯' },
  { id: 'time_points', label: 'Thời gian & Điểm số', desc: 'Giới hạn thời gian (giây) và số điểm', icon: '⏱️' },
  { id: 'category_tags', label: 'Danh mục & Thẻ nhãn (Tags)', desc: 'Chủ đề và từ khóa phân loại', icon: '🏷️' },
  { id: 'round_format', label: 'Vòng thi & Định dạng', desc: 'Vòng Khởi động, VCNV, Tăng tốc, Về đích...', icon: '🏆' },
  { id: 'media_obstacle', label: 'Đa phương tiện & Dữ liệu VCNV', desc: 'Hình ảnh đính kèm và cấu hình ô chữ', icon: '🖼️' }
];

export const QuestionHistoryModal: React.FC<QuestionHistoryModalProps> = ({
  isOpen,
  onClose,
  question,
  onRevertSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'versions' | 'compare' | 'audit'>('versions');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  
  // Bulk Selection of Versions State
  const [selectedVersionIds, setSelectedVersionIds] = useState<string[]>([]);
  const [targetRevertVersionId, setTargetRevertVersionId] = useState<string | null>(null);
  
  // Selective Fields for Revert
  const [selectedFields, setSelectedFields] = useState<RevertFieldOption[]>([
    'question_text',
    'options_answer',
    'explanation_legal',
    'competency_level',
    'time_points',
    'category_tags',
    'round_format',
    'media_obstacle'
  ]);
  const [isAllFieldsSelected, setIsAllFieldsSelected] = useState<boolean>(true);

  // Confirmation Modals
  const [showRevertConfirm, setShowRevertConfirm] = useState<boolean>(false);
  const [versionToRevert, setVersionToRevert] = useState<QuestionVersion | null>(null);
  const [isBulkRevertMode, setIsBulkRevertMode] = useState<boolean>(false);
  const [showPdfReportModal, setShowPdfReportModal] = useState<boolean>(false);

  // Fetch all versions dynamically
  const versions: QuestionVersion[] = useMemo(() => {
    if (!question) return [];
    return questionBankManager.getQuestionVersions(question.id);
  }, [question, question?.versions]);

  // Activity logs
  const logs: QuestionActivityLog[] = useMemo(() => {
    if (!question) return [];
    return question.activity_logs || [];
  }, [question, question?.activity_logs]);

  // Default selected version is the latest one
  const selectedVersion = useMemo(() => {
    if (!versions.length) return null;
    if (selectedVersionId) {
      return versions.find(v => v.id === selectedVersionId) || versions[0];
    }
    return versions[0];
  }, [versions, selectedVersionId]);

  const currentVersion = versions[0];
  const isSelectedCurrent = selectedVersion?.id === currentVersion?.id;

  // Selected snapshots for comparison or bulk actions
  const selectedSnapshots = useMemo(() => {
    return versions.filter(v => selectedVersionIds.includes(v.id));
  }, [versions, selectedVersionIds]);

  // Active target for revert when viewing bulk panel
  const activeBulkTarget = useMemo(() => {
    if (!targetRevertVersionId) {
      return selectedSnapshots.find(s => s.id !== currentVersion?.id) || selectedSnapshots[0] || versions[1];
    }
    return versions.find(v => v.id === targetRevertVersionId) || versions[1];
  }, [versions, targetRevertVersionId, selectedSnapshots, currentVersion]);

  if (!isOpen || !question) return null;

  // Toggle version selection in bulk list
  const handleToggleVersionCheck = (vId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    vibrateTap();
    setSelectedVersionIds(prev => {
      const exists = prev.includes(vId);
      if (exists) {
        return prev.filter(id => id !== vId);
      } else {
        const next = [...prev, vId];
        // If we haven't picked a target revert version yet, set it to this newly picked one
        if (!targetRevertVersionId) {
          setTargetRevertVersionId(vId);
        }
        return next;
      }
    });
  };

  const handleSelectAllVersions = () => {
    vibrateTap();
    soundFx.playClick();
    const allIds = versions.map(v => v.id);
    setSelectedVersionIds(allIds);
    if (!targetRevertVersionId && versions.length > 1) {
      setTargetRevertVersionId(versions[1].id);
    }
  };

  const handleSelectPastVersionsOnly = () => {
    vibrateTap();
    soundFx.playClick();
    const pastIds = versions.slice(1).map(v => v.id);
    setSelectedVersionIds(pastIds);
    if (pastIds.length > 0) {
      setTargetRevertVersionId(pastIds[0]);
    }
  };

  const handleClearVersionSelection = () => {
    vibrateTap();
    setSelectedVersionIds([]);
    setTargetRevertVersionId(null);
  };

  const handleSelectVersion = (vId: string) => {
    vibrateTap();
    setSelectedVersionId(vId);
  };

  // Field selection toggles
  const handleToggleField = (fieldId: RevertFieldOption) => {
    vibrateTap();
    if (fieldId === 'ALL') {
      if (isAllFieldsSelected) {
        setIsAllFieldsSelected(false);
        setSelectedFields([]);
      } else {
        setIsAllFieldsSelected(true);
        setSelectedFields(FIELD_CONFIGS.map(f => f.id));
      }
      return;
    }

    setSelectedFields(prev => {
      const exists = prev.includes(fieldId);
      let updated: RevertFieldOption[];
      if (exists) {
        updated = prev.filter(f => f !== fieldId);
      } else {
        updated = [...prev, fieldId];
      }
      setIsAllFieldsSelected(updated.length === FIELD_CONFIGS.length);
      return updated;
    });
  };

  // Single Revert prompt
  const handlePromptSingleRevert = (v: QuestionVersion) => {
    vibrateWarning();
    soundFx.playClick();
    setVersionToRevert(v);
    setIsBulkRevertMode(false);
    setShowRevertConfirm(true);
  };

  // Bulk Revert prompt (from selected snapshots)
  const handlePromptBulkRevert = () => {
    if (!targetRevertVersionId && selectedVersionIds.length > 0) {
      setTargetRevertVersionId(selectedVersionIds[0]);
    }
    const target = versions.find(v => v.id === (targetRevertVersionId || selectedVersionIds[0]));
    if (!target) return;

    vibrateWarning();
    soundFx.playClick();
    setVersionToRevert(target);
    setIsBulkRevertMode(true);
    setShowRevertConfirm(true);
  };

  // Confirm Revert execution
  const handleConfirmRevert = () => {
    if (!versionToRevert || !question) return;

    let success = false;
    if (isAllFieldsSelected || selectedFields.length === FIELD_CONFIGS.length) {
      // Full revert
      success = questionBankManager.revertQuestionVersion(question.id, versionToRevert.id);
    } else {
      // Selective fields revert
      const fields = selectedFields.length === 0 ? ['question_text'] : selectedFields;
      success = questionBankManager.revertQuestionFields(
        question.id, 
        versionToRevert.id, 
        fields,
        `Khôi phục chọn lọc từ Bản v${versionToRevert.versionNumber} (${fields.length} mục dữ liệu)`
      );
    }

    if (success) {
      soundFx.playCorrect();
      vibrateSuccess();
      const updated = questionBankManager.getQuestionById(question.id);
      setShowRevertConfirm(false);
      setVersionToRevert(null);
      setIsBulkRevertMode(false);
      handleClearVersionSelection();
      
      if (updated && onRevertSuccess) {
        onRevertSuccess(updated);
      }
      setSelectedVersionId(null);
    }
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return {
      date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      relative: getRelativeTime(ts)
    };
  };

  function getRelativeTime(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    return new Date(ts).toLocaleDateString('vi-VN');
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-hidden font-sans modal-backdrop-isolated select-none">
      <div className="fluent-card w-full max-w-6xl bg-[#190839] border border-theme-accent/30 rounded-[8px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#241148] px-5 py-3.5 border-b border-theme-accent/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[4px] bg-sky-500/20 text-sky-300 border border-sky-500/30">
              <History className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                  Lịch Sử Phiên Bản & Khôi Phục Hàng Loạt
                </h3>
                <span className="px-2 py-0.5 rounded bg-theme-accent/20 border border-theme-accent/40 text-theme-accent text-xs font-mono font-bold">
                  {question.id}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ({versions.length} mốc phiên bản)
                </span>
              </div>
              <p className="text-[11.5px] text-[#B6A6D8] truncate max-w-lg mt-0.5">
                {question.question_text}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View tabs */}
            <div className="inline-flex rounded-[4px] bg-[#190839] p-0.5 border border-theme-accent/30 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  setActiveTab('versions');
                }}
                className={`px-3 py-1 rounded-[3px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'versions'
                    ? 'bg-theme-accent text-[#190839] shadow-sm font-bold'
                    : 'text-[#B6A6D8] hover:text-white'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Mốc Lịch Sử ({versions.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  if (selectedVersionIds.length === 0 && versions.length > 1) {
                    setSelectedVersionIds([versions[0].id, versions[1].id]);
                  }
                  setActiveTab('compare');
                }}
                className={`px-3 py-1 rounded-[3px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'compare'
                    ? 'bg-theme-accent text-[#190839] shadow-sm font-bold'
                    : 'text-[#B6A6D8] hover:text-white'
                }`}
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span>So Sánh ({selectedVersionIds.length || (versions.length > 1 ? 2 : 1)})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  setActiveTab('audit');
                }}
                className={`px-3 py-1 rounded-[3px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'audit'
                    ? 'bg-theme-accent text-[#190839] shadow-sm font-bold'
                    : 'text-[#B6A6D8] hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Nhật Ký ({logs.length})</span>
              </button>
            </div>

            {/* Export PDF Button */}
            <button
              type="button"
              id="btn-history-modal-export-pdf"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setShowPdfReportModal(true);
              }}
              className="px-3 py-1.5 rounded-[4px] bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 border border-red-500/40 font-mono text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ml-1"
              title="Xuất phiếu thẩm định và lịch sử phiên bản dạng báo cáo PDF"
            >
              <Printer className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Xuất PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-white/10 transition cursor-pointer ml-1"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BULK SELECTION ACTION BAR (Appears when 1 or more historical versions are selected) */}
        {selectedVersionIds.length > 0 && activeTab === 'versions' && (
          <div className="bg-gradient-to-r from-[#311364] via-[#401980] to-[#250d4f] border-b border-theme-accent/40 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0 shadow-lg animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-theme-accent text-slate-950 font-black text-xs shadow-sm">
                <ListChecks className="w-4 h-4" />
                <span>ĐÃ CHỌN {selectedVersionIds.length} BẢN</span>
              </div>

              <span className="text-slate-300 text-[11.5px] hidden sm:inline">
                Chọn mốc mục tiêu cần khôi phục dữ liệu:
              </span>

              {/* Target version selector */}
              <select
                value={targetRevertVersionId || ''}
                onChange={(e) => {
                  vibrateTap();
                  setTargetRevertVersionId(e.target.value);
                }}
                className="px-2.5 py-1 rounded bg-black/60 text-amber-300 border border-amber-500/40 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
              >
                {selectedSnapshots.map(s => (
                  <option key={s.id} value={s.id} className="bg-[#190839] text-white">
                    🎯 Khôi phục về v{s.versionNumber} ({formatTimestamp(s.timestamp).date} - {s.modifiedBy})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleClearVersionSelection}
                className="text-slate-400 hover:text-white text-[11px] underline underline-offset-2 transition cursor-pointer"
              >
                Bỏ chọn tất cả
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  setActiveTab('compare');
                }}
                className="px-3 py-1.5 rounded bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 border border-sky-400/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="So sánh chi tiết các phiên bản đã chọn"
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span>So sánh {selectedVersionIds.length} bản</span>
              </button>

              {/* ONE-ACTION BULK REVERT BUTTON */}
              <button
                type="button"
                onClick={handlePromptBulkRevert}
                className="px-4 py-1.5 rounded bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] ring-1 ring-amber-400"
                title="Khôi phục trạng thái câu hỏi về mốc phiên bản mục tiêu đã chọn trong một lần thao tác"
              >
                <RotateCcw className="w-4 h-4 text-slate-950" />
                <span>Khôi Phục Trong 1 Bước (Bulk Revert)</span>
              </button>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {activeTab === 'versions' ? (
            <>
              {/* Left Column: Version list timeline with Multi-Select Controls */}
              <div className="w-full md:w-5/12 border-r border-theme-accent/20 flex flex-col max-h-[42vh] md:max-h-[72vh] bg-[#190839]/70">
                
                {/* List Toolbar */}
                <div className="p-3 border-b border-theme-accent/15 bg-[#241148]/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-theme-accent" />
                    <span className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">
                      Lịch sử phiên bản
                    </span>
                  </div>

                  {/* Multi-select shortcuts */}
                  <div className="flex items-center gap-1.5 text-[10.5px]">
                    <button
                      type="button"
                      onClick={handleSelectAllVersions}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition cursor-pointer"
                      title="Chọn tất cả các phiên bản"
                    >
                      Chọn tất cả
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectPastVersionsOnly}
                      className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition cursor-pointer"
                      title="Chọn tất cả các phiên bản cũ (trừ phiên bản hiện tại)"
                    >
                      Chỉ bản cũ
                    </button>
                  </div>
                </div>

                {/* Versions Scrollable Timeline */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                  {versions.map((ver, idx) => {
                    const isLatest = idx === 0;
                    const isSelectedDetail = selectedVersion?.id === ver.id;
                    const isChecked = selectedVersionIds.includes(ver.id);
                    const isTargetRevert = targetRevertVersionId === ver.id;
                    const timeInfo = formatTimestamp(ver.timestamp);

                    return (
                      <div
                        key={ver.id}
                        onClick={() => handleSelectVersion(ver.id)}
                        className={`group relative p-3 rounded-[6px] border transition cursor-pointer font-mono ${
                          isSelectedDetail
                            ? 'bg-[#2e155b] border-theme-accent shadow-md ring-1 ring-theme-accent/50'
                            : isChecked
                            ? 'bg-[#261247] border-amber-500/60'
                            : 'bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.06]'
                        }`}
                      >
                        {/* Top Header Line */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            
                            {/* Checkbox for Bulk Selection */}
                            <button
                              type="button"
                              onClick={(e) => handleToggleVersionCheck(ver.id, e)}
                              className="p-0.5 text-slate-400 hover:text-theme-accent transition cursor-pointer"
                              title={isChecked ? 'Bỏ chọn phiên bản này' : 'Chọn phiên bản này để so sánh/khôi phục'}
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-theme-accent" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                              )}
                            </button>

                            <span className={`px-2 py-0.5 rounded text-xs font-black ${
                              isLatest
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-white/10 text-slate-300 border border-white/10'
                            }`}>
                              v{ver.versionNumber}
                            </span>

                            {isLatest && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                                Hiện tại
                              </span>
                            )}

                            {isTargetRevert && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase flex items-center gap-1">
                                🎯 Mục tiêu khôi phục
                              </span>
                            )}

                            <span className={`text-[10px] px-1.5 py-0.2 rounded border ${
                              ver.action === 'CREATED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              ver.action === 'REVERTED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              ver.action === 'STATUS_CHANGED' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                              'bg-sky-500/10 text-sky-400 border-sky-500/20'
                            }`}>
                              {ver.action}
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-400 font-sans" title={`${timeInfo.date} ${timeInfo.time}`}>
                            {timeInfo.relative}
                          </span>
                        </div>

                        {/* Summary */}
                        <p className="text-xs text-slate-200 font-sans font-medium line-clamp-2 mb-2 leading-relaxed">
                          {ver.changeSummary || 'Cập nhật thông tin câu hỏi'}
                        </p>

                        {/* Changed Fields Badges */}
                        {ver.changedFields && ver.changedFields.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {ver.changedFields.slice(0, 3).map((f, fIdx) => (
                              <span key={fIdx} className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-slate-300 border border-white/5">
                                • {f}
                              </span>
                            ))}
                            {ver.changedFields.length > 3 && (
                              <span className="px-1 py-0.5 rounded bg-black/40 text-[9.5px] text-slate-400">
                                +{ver.changedFields.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* User & Date info */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-white/5">
                          <span className="flex items-center gap-1 truncate text-white/80 font-sans text-[11px]">
                            <User className="w-3 h-3 text-theme-accent" />
                            {ver.modifiedBy} {ver.userRole ? `(${ver.userRole})` : ''}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {timeInfo.date} {timeInfo.time}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Version Inspector, Field Selection & Restoration Config */}
              <div className="w-full md:w-7/12 flex flex-col max-h-[55vh] md:max-h-[72vh] bg-[#120528]/80">
                {selectedVersion ? (
                  <>
                    {/* Detail Header bar */}
                    <div className="p-3.5 border-b border-theme-accent/20 bg-[#241148]/70 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-mono">
                          Chi tiết Phiên bản v{selectedVersion.versionNumber}
                        </span>
                        {isSelectedCurrent ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
                            Đang áp dụng (Live)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold">
                            Mốc lịch sử cũ
                          </span>
                        )}
                      </div>

                      {/* Single Revert Button */}
                      {!isSelectedCurrent && (
                        <button
                          type="button"
                          onClick={() => handlePromptSingleRevert(selectedVersion)}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-[4px] text-xs font-mono flex items-center gap-1.5 transition cursor-pointer shadow-md active:scale-95"
                          title="Khôi phục trạng thái câu hỏi về dữ liệu tại phiên bản này"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Khôi Phục Bản Này (Revert)</span>
                        </button>
                      )}
                    </div>

                    {/* SELECTIVE FIELD RESTORATION CONFIGURATION (Shows when examining a past version) */}
                    {!isSelectedCurrent && (
                      <div className="p-3.5 bg-gradient-to-r from-[#200d3d] to-[#17082e] border-b border-white/10 text-xs font-mono">
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-theme-accent" />
                            <span className="text-white font-bold uppercase tracking-wider text-[11px]">
                              Tùy chọn trường dữ liệu khôi phục:
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleToggleField('ALL')}
                            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-theme-accent text-[11px] font-bold transition cursor-pointer"
                          >
                            {isAllFieldsSelected ? 'Bỏ chọn tất cả các trường' : 'Chọn toàn bộ các trường'}
                          </button>
                        </div>

                        {/* Fields Checkbox Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {FIELD_CONFIGS.map(f => {
                            const isChecked = selectedFields.includes(f.id);
                            return (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => handleToggleField(f.id)}
                                className={`p-1.5 rounded-[4px] border text-left flex items-center gap-1.5 transition cursor-pointer ${
                                  isChecked
                                    ? 'bg-theme-accent/20 border-theme-accent text-white font-bold'
                                    : 'bg-black/20 border-white/5 text-slate-400 hover:text-slate-200'
                                }`}
                                title={f.desc}
                              >
                                <span>{f.icon}</span>
                                <span className="text-[10.5px] truncate">{f.label}</span>
                                {isChecked && <Check className="w-3 h-3 text-theme-accent ml-auto shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Snapshot Fields Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs font-mono">
                      
                      {/* Meta stats bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/30 p-2.5 rounded-[4px] border border-white/5 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Người sửa đổi:</span>
                          <span className="text-white font-bold">{selectedVersion.modifiedBy}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Thời điểm:</span>
                          <span className="text-white">{formatTimestamp(selectedVersion.timestamp).date} {formatTimestamp(selectedVersion.timestamp).time}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Định dạng:</span>
                          <span className="text-theme-accent font-bold">{selectedVersion.snapshot.round_type}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Trạng thái lúc đó:</span>
                          <span className={`font-bold ${
                            selectedVersion.snapshot.approval_status === 'APPROVED' ? 'text-emerald-400' :
                            selectedVersion.snapshot.approval_status === 'REJECTED' ? 'text-rose-400' : 'text-amber-400'
                          }`}>
                            {selectedVersion.snapshot.approval_status || 'CHƯA DUYỆT'}
                          </span>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-theme-accent" />
                          Nội dung câu hỏi:
                        </label>
                        <div className={`p-3 rounded-[4px] bg-black/40 border leading-relaxed font-sans text-sm ${
                          selectedVersion.snapshot.question_text !== currentVersion.snapshot.question_text && !isSelectedCurrent
                            ? 'border-amber-500/50 bg-amber-500/5 text-amber-200'
                            : 'border-white/10 text-white'
                        }`}>
                          {selectedVersion.snapshot.question_text}
                        </div>
                      </div>

                      {/* Options & Correct Key */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                            Phương án & Đáp án đúng:
                          </label>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                            Đáp án: {selectedVersion.snapshot.correct_key}
                          </span>
                        </div>

                        {selectedVersion.snapshot.options && Object.keys(selectedVersion.snapshot.options).length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(selectedVersion.snapshot.options).map(([optKey, optVal]) => {
                              const isCorrect = selectedVersion.snapshot.correct_key?.toUpperCase().includes(optKey);
                              return (
                                <div
                                  key={optKey}
                                  className={`p-2.5 rounded-[4px] border flex items-start gap-2 ${
                                    isCorrect
                                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
                                      : 'bg-white/5 border-white/10 text-slate-300'
                                  }`}
                                >
                                  <span className={`px-1.5 py-0.5 rounded font-black text-xs shrink-0 ${
                                    isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-slate-300'
                                  }`}>
                                    {optKey}
                                  </span>
                                  <span className="font-sans text-xs leading-normal">{optVal}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-2.5 rounded bg-white/5 border border-white/10 text-slate-300 font-sans">
                            {selectedVersion.snapshot.correct_key ? `Đáp án dạng tự luận / nhập: ${selectedVersion.snapshot.correct_key}` : 'Không có phương án lựa chọn.'}
                          </div>
                        )}
                      </div>

                      {/* Explanation & Legal Reference */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-sky-400" />
                          Giải thích chi tiết & Căn cứ pháp lý:
                        </label>
                        <div className="p-3 rounded-[4px] bg-black/30 border border-white/10 text-slate-300 font-sans text-xs leading-relaxed">
                          {selectedVersion.snapshot.explanation || 'Chưa có lời giải thích chi tiết.'}
                          {selectedVersion.snapshot.legal_reference && (
                            <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-sky-300 font-mono">
                              📜 Căn cứ: {selectedVersion.snapshot.legal_reference}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Domain, Cognitive Level & Time */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="p-2.5 rounded bg-black/30 border border-white/5">
                          <span className="text-slate-400 block text-[10px]">Miền Năng Lực Số:</span>
                          <span className="text-theme-accent font-bold">{selectedVersion.snapshot.digital_competency_domain || 'Chưa phân loại'}</span>
                        </div>
                        <div className="p-2.5 rounded bg-black/30 border border-white/5">
                          <span className="text-slate-400 block text-[10px]">Mức độ nhận thức:</span>
                          <span className="text-amber-300 font-bold">{selectedVersion.snapshot.cognitive_level || 'Chưa gán'}</span>
                        </div>
                        <div className="p-2.5 rounded bg-black/30 border border-white/5">
                          <span className="text-slate-400 block text-[10px]">Thời gian & Điểm:</span>
                          <span className="text-white font-bold">{selectedVersion.snapshot.time_limit}s ({selectedVersion.snapshot.points || 10} điểm)</span>
                        </div>
                      </div>

                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 italic text-sm">
                    Chọn một phiên bản ở cột bên trái để xem chi tiết
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'compare' ? (
            /* Multi-Version Side-by-Side Comparison Matrix */
            <div className="w-full flex-1 overflow-y-auto p-4 custom-scrollbar max-h-[72vh] flex flex-col space-y-4">
              <div className="p-3 bg-gradient-to-r from-[#241148] to-[#1b0a38] rounded-[6px] border border-theme-accent/30 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Columns3 className="w-4 h-4 text-theme-accent" />
                  <span className="text-white font-bold">
                    Bảng So Sánh Các Mốc Phiên Bản Đã Chọn ({selectedSnapshots.length || versions.length} bản)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePromptBulkRevert}
                    className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Khôi Phục Trạng Thái Được Chọn</span>
                  </button>
                </div>
              </div>

              {/* Side by side columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(selectedSnapshots.length > 0 ? selectedSnapshots : versions.slice(0, 3)).map((ver, vIdx) => {
                  const isCurrent = ver.id === currentVersion?.id;
                  const timeInfo = formatTimestamp(ver.timestamp);

                  return (
                    <div 
                      key={ver.id}
                      className={`p-3.5 rounded-[6px] border flex flex-col font-mono text-xs ${
                        isCurrent 
                          ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md' 
                          : 'bg-black/30 border-white/10'
                      }`}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-xs font-black ${
                            isCurrent ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-white'
                          }`}>
                            v{ver.versionNumber}
                          </span>
                          <span className="text-white font-bold">
                            {isCurrent ? 'Phiên bản Hiện Tại' : `Bản v${ver.versionNumber}`}
                          </span>
                        </div>

                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handlePromptSingleRevert(ver)}
                            className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10.5px] font-bold transition cursor-pointer flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Khôi phục</span>
                          </button>
                        )}
                      </div>

                      {/* Author & Time */}
                      <div className="text-[11px] text-slate-400 mb-3 space-y-0.5 font-sans">
                        <p className="flex items-center gap-1 text-white">
                          <User className="w-3 h-3 text-theme-accent" />
                          {ver.modifiedBy}
                        </p>
                        <p>{timeInfo.date} lúc {timeInfo.time}</p>
                      </div>

                      {/* Question Text */}
                      <div className="mb-3 space-y-1">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Nội dung câu hỏi:</span>
                        <div className="p-2.5 rounded bg-black/40 border border-white/5 font-sans text-xs text-white leading-relaxed">
                          {ver.snapshot.question_text}
                        </div>
                      </div>

                      {/* Options & Key */}
                      <div className="mb-3 space-y-1">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Đáp án đúng & Phương án:</span>
                        <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold mb-1">
                          Key: {ver.snapshot.correct_key}
                        </div>
                        {ver.snapshot.options && (
                          <div className="space-y-1">
                            {Object.entries(ver.snapshot.options).map(([k, v]) => (
                              <div key={k} className="p-1.5 rounded bg-white/5 text-[11px] font-sans flex items-start gap-1.5">
                                <span className="font-mono font-bold text-theme-accent">{k}:</span>
                                <span>{v}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Legal & Explanation */}
                      <div className="mt-auto pt-2 border-t border-white/5 space-y-1 text-[11px] text-slate-300 font-sans">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold font-mono">Giải thích & Căn cứ:</span>
                        <p className="line-clamp-3 italic text-slate-300">
                          {ver.snapshot.explanation || 'Chưa có giải thích'}
                        </p>
                        {ver.snapshot.legal_reference && (
                          <p className="text-sky-300 text-[10.5px]">📜 {ver.snapshot.legal_reference}</p>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Audit Logs View */
            <div className="w-full flex-1 overflow-y-auto p-5 custom-scrollbar max-h-[72vh]">
              {(!logs || logs.length === 0) ? (
                <div className="text-center py-12 text-slate-400 italic font-mono text-sm">
                  Không có dữ liệu nhật ký kiểm toán cho câu hỏi này.
                </div>
              ) : (
                <div className="relative border-l-2 border-theme-accent/30 ml-4 space-y-6 pb-4 font-mono">
                  {logs.map((log) => {
                    const timeInfo = formatTimestamp(log.timestamp);
                    return (
                      <div key={log.id} className="relative pl-6">
                        {/* Timeline dot */}
                        <div className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full ring-4 ring-[#190839] ${
                          log.action === 'CREATED' ? 'bg-emerald-400' :
                          log.action === 'EDITED' ? 'bg-sky-400' :
                          log.action === 'REVERTED' ? 'bg-amber-400' :
                          log.action === 'STATUS_CHANGED' ? 'bg-purple-400' :
                          log.action === 'NOTE_ADDED' ? 'bg-pink-400' :
                          'bg-rose-400'
                        }`} />
                        
                        <div className="bg-white/5 border border-white/10 rounded-[6px] p-3.5 hover:border-white/20 transition shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-sm ${
                                log.action === 'CREATED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                log.action === 'EDITED' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                                log.action === 'REVERTED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                log.action === 'STATUS_CHANGED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                log.action === 'NOTE_ADDED' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' :
                                'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}>
                                {log.action}
                              </span>

                              {log.versionNumber && (
                                <span className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 text-xs">
                                  v{log.versionNumber}
                                </span>
                              )}

                              <span className="text-white font-semibold text-sm font-sans flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-theme-accent" />
                                {log.user} {log.userRole ? `(${log.userRole})` : ''}
                              </span>
                            </div>

                            <span className="text-slate-400 font-mono text-[11px] bg-black/40 px-2 py-0.5 rounded">
                              {timeInfo.date} • {timeInfo.time} ({timeInfo.relative})
                            </span>
                          </div>

                          {log.details && (
                            <div className="text-[13px] text-slate-200 bg-black/30 p-2.5 rounded border border-white/5 font-sans leading-relaxed">
                              {log.details}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#241148] px-5 py-3 border-t border-theme-accent/20 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11.5px]">
            <Sparkles className="w-3.5 h-3.5 text-theme-accent" />
            <span>Khôi phục hàng loạt hoặc có chọn lọc theo trường dữ liệu sẽ tự động tạo một phiên bản lưu vết mới.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-[4px] bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>

      {/* REVERT CONFIRMATION MODAL */}
      {showRevertConfirm && versionToRevert && (
        <div className="fixed inset-0 z-[10000000] flex items-center justify-center bg-black/90 p-4">
          <div className="fluent-card w-full max-w-md bg-[#190839] border border-amber-500/50 rounded-[8px] p-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-[6px] bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  Xác nhận khôi phục {isBulkRevertMode ? 'hàng loạt mốc' : 'phiên bản'}?
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Bạn đang chuẩn bị áp dụng trạng thái từ <strong className="text-amber-300">Phiên bản v{versionToRevert.versionNumber}</strong> (tạo bởi <strong>{versionToRevert.modifiedBy}</strong> vào ngày {formatTimestamp(versionToRevert.timestamp).date}) vào câu hỏi <strong className="text-theme-accent">{question.id}</strong> trong một lần thao tác.
                </p>
              </div>
            </div>

            {/* Selected fields scope */}
            <div className="bg-black/40 p-3 rounded border border-white/10 mb-4 text-xs font-mono text-slate-300 space-y-1.5">
              <p className="font-bold text-white flex items-center justify-between">
                <span>Phạm vi khôi phục:</span>
                <span className="text-theme-accent font-bold">
                  {isAllFieldsSelected || selectedFields.length === FIELD_CONFIGS.length 
                    ? 'Toàn bộ dữ liệu snapshot' 
                    : `${selectedFields.length} trường dữ liệu đã chọn`}
                </span>
              </p>
              
              <div className="pt-1.5 border-t border-white/10">
                <p className="font-bold text-slate-200 mb-0.5">Nội dung đề bài:</p>
                <p className="line-clamp-2 italic text-slate-300 font-sans">"{versionToRevert.snapshot.question_text}"</p>
                <p className="mt-1 text-emerald-400 font-bold">Đáp án: {versionToRevert.snapshot.correct_key}</p>
              </div>
            </div>

            <p className="text-[11px] text-amber-300/90 mb-4 italic">
              💡 Lưu ý: Hệ thống sẽ tự động tạo một phiên bản mới (v{(versions[0]?.versionNumber || versions.length) + 1}) ghi nhận hành động khôi phục này để không làm mất lịch sử hiện tại.
            </p>

            <div className="flex items-center justify-end gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowRevertConfirm(false);
                  setVersionToRevert(null);
                  setIsBulkRevertMode(false);
                }}
                className="px-3.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmRevert}
                className="px-4 py-1.5 rounded bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold transition cursor-pointer shadow-md"
              >
                Đồng ý khôi phục ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Report Modal */}
      <QuestionHistoryPdfReportModal
        isOpen={showPdfReportModal}
        onClose={() => setShowPdfReportModal(false)}
        question={question}
      />

    </div>,
    document.body
  );
};
