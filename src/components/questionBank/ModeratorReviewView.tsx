import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileEdit, 
  Search, 
  Filter, 
  Sparkles, 
  AlertTriangle, 
  RotateCcw, 
  CheckCheck, 
  Edit3, 
  Eye, 
  ExternalLink, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  UserCheck, 
  BookOpen, 
  Scale, 
  MessageSquare, 
  Send, 
  Info,
  Layers,
  ArrowRight,
  ListFilter,
  Check,
  X,
  Zap,
  HelpCircle,
  Copy,
  Tag,
  History,
  Printer
} from 'lucide-react';
import { 
  QuestionItem, 
  ApprovalStatus, 
  CompetitionStage, 
  QuestionRoundFormat, 
  CognitiveLevel, 
  DigitalCompetencyDomainKey 
} from '../../types';
import { questionBankManager } from '../../services/questionBankManager';
import { 
  BTI_ROUND_GROUPS, 
  COGNITIVE_LEVELS, 
  DIGITAL_COMPETENCY_DOMAINS 
} from '../../data/digitalCompetencyData';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateWarning } from '../../utils/hapticUtils';
import { exportQuestionsToPdf } from '../../utils/printExport';
import { QuestionQuickReviewModal } from './QuestionQuickReviewModal';
import { QuestionQualityReviewModal } from './QuestionQualityReviewModal';
import { questionReviewService, getStatusInfo } from '../../services/questionReviewService';
import { HighlightedText } from '../../services/fullTextSearchService';

interface ModeratorReviewViewProps {
  onEditQuestion: (question: QuestionItem) => void;
  onPreviewQuestion?: (question: QuestionItem) => void;
  onSelectQuestionForDetails?: (question: QuestionItem) => void;
  toastMessage?: string | null;
  onShowToast: (msg: string) => void;
}

interface AiAuditResult {
  recommendation: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  qualityScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  legalCheck: {
    isCompliant: boolean;
    notes: string;
  };
  suggestedReviewNotes: string;
  suggestedFixes?: string;
}

export const ModeratorReviewView: React.FC<ModeratorReviewViewProps> = ({
  onEditQuestion,
  onPreviewQuestion,
  onSelectQuestionForDetails,
  onShowToast
}) => {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentUser, setCurrentUser] = useState(questionBankManager.getCurrentUser());

  // Filter & Search states
  const [statusTab, setStatusTab] = useState<ApprovalStatus | 'ALL'>('PENDING_REVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [filterFormat, setFilterFormat] = useState<string>('ALL');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterDomain, setFilterDomain] = useState<string>('ALL');

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Local draft review notes being edited per question ID
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  // Expanded card details per question ID
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  
  // Expanded history logs per question ID
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});

  // AI Audit State
  const [auditingQuestionId, setAuditingQuestionId] = useState<string | null>(null);
  const [auditModalData, setAuditModalData] = useState<{
    question: QuestionItem;
    result: AiAuditResult;
  } | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Bulk action notes modal
  const [bulkActionModal, setBulkActionModal] = useState<{
    action: 'APPROVE' | 'REJECT' | 'PENDING';
    count: number;
  } | null>(null);
  const [bulkNotes, setBulkNotes] = useState('');
  const [quickReviewQuestion, setQuickReviewQuestion] = useState<QuestionItem | null>(null);
  const [qualityReviewQuestion, setQualityReviewQuestion] = useState<QuestionItem | null>(null);

  // Subscribe to QuestionBankManager updates
  useEffect(() => {
    const unsub = questionBankManager.subscribe(() => {
      setQuestions([...questionBankManager.getQuestions()]);
      setCurrentUser(questionBankManager.getCurrentUser());
    });
    setQuestions([...questionBankManager.getQuestions()]);
    setCurrentUser(questionBankManager.getCurrentUser());
    return unsub;
  }, []);

  // Quick stats
  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let draft = 0;

    questions.forEach(q => {
      if (q.approval_status === 'PENDING_REVIEW') pending++;
      else if (q.approval_status === 'APPROVED') approved++;
      else if (q.approval_status === 'REJECTED') rejected++;
      else draft++;
    });

    return {
      total: questions.length,
      pending,
      approved,
      rejected,
      draft
    };
  }, [questions]);

  // Filter questions according to active tab and filters
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      // Status tab
      if (statusTab !== 'ALL') {
        const qStatus = q.approval_status || 'PENDING_REVIEW';
        if (qStatus !== statusTab) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const qry = searchQuery.toLowerCase().trim();
        const matchId = q.id.toLowerCase().includes(qry);
        const matchText = q.question_text.toLowerCase().includes(qry);
        const matchNotes = (q.review_notes || '').toLowerCase().includes(qry);
        const matchLegal = (q.legal_reference || '').toLowerCase().includes(qry);
        const matchAuthor = (q.created_by || '').toLowerCase().includes(qry);
        const matchKey = (q.correct_key || '').toLowerCase().includes(qry);
        if (!matchId && !matchText && !matchNotes && !matchLegal && !matchAuthor && !matchKey) {
          return false;
        }
      }

      // Filter Stage
      if (filterStage !== 'ALL' && q.stage !== filterStage) {
        return false;
      }

      // Filter Round Format
      if (filterFormat !== 'ALL' && q.round_format !== filterFormat) {
        return false;
      }

      // Filter Cognitive Level
      if (filterLevel !== 'ALL' && q.cognitive_level !== filterLevel) {
        return false;
      }

      // Filter Competency Domain
      if (filterDomain !== 'ALL' && q.digital_competency_domain !== filterDomain) {
        return false;
      }

      return true;
    });
  }, [questions, statusTab, searchQuery, filterStage, filterFormat, filterLevel, filterDomain]);

  // Toggle selection for a question
  const toggleSelect = (id: string) => {
    vibrateTap();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all or deselect visible questions
  const toggleSelectAll = () => {
    vibrateTap();
    if (selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map(q => q.id)));
    }
  };

  // Handle single question approve
  const handleApprove = (q: QuestionItem) => {
    vibrateSuccess();
    soundFx.playCorrect();
    const notesToSave = editingNotes[q.id] !== undefined ? editingNotes[q.id] : q.review_notes;
    questionBankManager.approveQuestion(q.id, notesToSave);
    onShowToast(`✓ Đã PHÊ DUYỆT câu hỏi [${q.id}] thành công!`);
  };

  // Handle single question reject
  const handleReject = (q: QuestionItem) => {
    vibrateWarning();
    soundFx.playClick();
    const notesToSave = editingNotes[q.id] !== undefined ? editingNotes[q.id] : q.review_notes;
    questionBankManager.rejectQuestion(q.id, notesToSave);
    onShowToast(`✗ Đã TỪ CHỐI câu hỏi [${q.id}] và lưu ghi chú chỉnh sửa.`);
  };

  // Handle set pending
  const handleSetPending = (q: QuestionItem) => {
    vibrateTap();
    const notesToSave = editingNotes[q.id] !== undefined ? editingNotes[q.id] : q.review_notes;
    questionBankManager.setPendingReview(q.id, notesToSave);
    onShowToast(`⏳ Đã chuyển câu hỏi [${q.id}] về trạng thái Chờ Thẩm Định.`);
  };

  // Save notes only
  const handleSaveNotesOnly = (q: QuestionItem) => {
    vibrateTap();
    const notesToSave = editingNotes[q.id] || '';
    questionBankManager.updateReviewNotes(q.id, notesToSave);
    onShowToast(`💾 Đã lưu ghi chú thẩm định cho câu hỏi [${q.id}].`);
  };

  // Toggle card expansion
  const toggleExpandCard = (id: string) => {
    vibrateTap();
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Execute Bulk Action
  const executeBulkAction = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length || !bulkActionModal) return;

    if (bulkActionModal.action === 'APPROVE') {
      questionBankManager.batchApprove(ids, bulkNotes);
      soundFx.playCorrect();
      vibrateSuccess();
      onShowToast(`✓ Đã PHÊ DUYỆT ${ids.length} câu hỏi thành công!`);
    } else if (bulkActionModal.action === 'REJECT') {
      questionBankManager.batchReject(ids, bulkNotes);
      soundFx.playClick();
      vibrateWarning();
      onShowToast(`✗ Đã TỪ CHỐI ${ids.length} câu hỏi và gửi ghi chú thẩm định.`);
    } else if (bulkActionModal.action === 'PENDING') {
      questionBankManager.batchSetPending(ids, bulkNotes);
      vibrateTap();
      onShowToast(`⏳ Đã chuyển ${ids.length} câu hỏi sang Chờ Thẩm Định.`);
    }

    setSelectedIds(new Set());
    setBulkActionModal(null);
    setBulkNotes('');
  };

  // Trigger AI Audit for a single question
  const handleAiAudit = async (q: QuestionItem) => {
    vibrateTap();
    setAuditingQuestionId(q.id);
    setIsAuditing(true);

    try {
      const res = await fetch('/api/ai/audit-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Lỗi khi gọi AI thẩm định.');
      }

      const data = await res.json();
      if (data.success && data.audit) {
        soundFx.playClick();
        setAuditModalData({
          question: q,
          result: data.audit
        });
      }
    } catch (err: any) {
      console.error('AI Audit Error:', err);
      onShowToast(`⚠️ Lỗi AI thẩm định: ${err.message}`);
    } finally {
      setIsAuditing(false);
      setAuditingQuestionId(null);
    }
  };

  // Apply suggested review notes from AI
  const applyAiSuggestedNotes = (questionId: string, suggestedNotes: string) => {
    vibrateTap();
    setEditingNotes(prev => ({
      ...prev,
      [questionId]: suggestedNotes
    }));
    questionBankManager.updateReviewNotes(questionId, suggestedNotes);
    onShowToast(`✓ Đã áp dụng gợi ý AI vào Review Notes của [${questionId}]!`);
    setAuditModalData(null);
  };

  // Preset feedback suggestions
  const presetSnippets = [
    '✓ Đạt chuẩn khảo thí BTI 2026 & TT 02/2025/TT-BGDĐT.',
    '⚠️ Cần bổ sung trích dẫn điều khoản luật cụ thể.',
    '❌ Phương án gây nhiễu chưa đủ thuyết phục / có thể đa nghĩa.',
    '✏️ Cần chuẩn hóa thuật ngữ và chính tả tiếng Việt.',
    '🔢 Kiểm tra số lượng chữ cái từ khóa (VCNV / Trả lời ngắn).'
  ];

  return (
    <div className="space-y-4">
      {/* 1. Header Banner & Stats Overview */}
      <div className="p-4 sm:p-5 rounded-[4px] bg-gradient-to-r from-[#1b0838] via-[#220a44] to-[#15052c] border border-amber-500/40 shadow-xl relative overflow-hidden">
        {/* Background glow accent */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                TRUNG TÂM THẨM ĐỊNH &amp; PHÊ DUYỆT ĐỀ THI (MODERATOR REVIEW)
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-500/20 text-purple-200 border border-purple-400/30">
                Hội Đồng Khảo Thí BTI 2026
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed font-sans">
              Quy trình kiểm duyệt 2 vòng chuyên môn: Thẩm định tính chuẩn xác pháp lý (Thông tư 02/2025/TT-BGDĐT, Nghị định 13/2023/NĐ-CP), mức độ phân loại nhận thức và chất lượng phương án trả lời.
            </p>
          </div>

          {/* Current Moderator Identity & Role */}
          <div className="flex items-center gap-3 bg-black/40 px-3.5 py-2.5 rounded-[4px] border border-white/15 self-start lg:self-center shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-bold text-xs font-mono shadow">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left font-mono">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{currentUser.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  {currentUser.role}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Quyền hạn: {currentUser.role === 'SUPER_ADMIN' ? 'Toàn quyền Thẩm định & Phê duyệt' : currentUser.role === 'HEAD_EDITOR' ? 'Trưởng Ban Thẩm Định' : 'Cán bộ Khảo thí'}
              </div>
            </div>
          </div>
        </div>

        {/* Status Tab Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-4 mt-4 border-t border-white/10 font-mono text-xs">
          {[
            {
              id: 'PENDING_REVIEW' as ApprovalStatus | 'ALL',
              label: 'Chờ Thẩm Định',
              count: stats.pending,
              icon: Clock,
              activeCls: 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md ring-2 ring-amber-400/50',
              badgeCls: 'bg-amber-950 text-amber-200 border-amber-700',
              pillCls: 'text-amber-300 bg-amber-500/10 border-amber-500/30'
            },
            {
              id: 'APPROVED' as ApprovalStatus | 'ALL',
              label: 'Đã Phê Duyệt',
              count: stats.approved,
              icon: CheckCircle2,
              activeCls: 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md ring-2 ring-emerald-400/50',
              badgeCls: 'bg-emerald-950 text-emerald-200 border-emerald-700',
              pillCls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
            },
            {
              id: 'REJECTED' as ApprovalStatus | 'ALL',
              label: 'Từ Chối / Cần Sửa',
              count: stats.rejected,
              icon: XCircle,
              activeCls: 'bg-rose-500 text-white font-bold border-rose-400 shadow-md ring-2 ring-rose-400/50',
              badgeCls: 'bg-rose-950 text-rose-200 border-rose-700',
              pillCls: 'text-rose-300 bg-rose-500/10 border-rose-500/30'
            },
            {
              id: 'DRAFT' as ApprovalStatus | 'ALL',
              label: 'Bản Thảo (Draft)',
              count: stats.draft,
              icon: FileEdit,
              activeCls: 'bg-slate-400 text-slate-950 font-bold border-slate-300 shadow-md',
              badgeCls: 'bg-slate-900 text-slate-200 border-slate-700',
              pillCls: 'text-slate-300 bg-slate-500/10 border-slate-500/30'
            },
            {
              id: 'ALL' as ApprovalStatus | 'ALL',
              label: 'Tất Cả Câu Hỏi',
              count: stats.total,
              icon: Layers,
              activeCls: 'bg-purple-500 text-white font-bold border-purple-400 shadow-md',
              badgeCls: 'bg-purple-950 text-purple-200 border-purple-700',
              pillCls: 'text-purple-300 bg-purple-500/10 border-purple-500/30'
            }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = statusTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  vibrateTap();
                  setStatusTab(tab.id);
                  setSelectedIds(new Set());
                }}
                className={`p-2.5 rounded-[4px] border flex items-center justify-between gap-2 transition cursor-pointer ${
                  isActive
                    ? tab.activeCls
                    : `bg-black/40 border-white/10 text-white/70 hover:text-white hover:border-white/25 hover:bg-white/5`
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? '' : 'opacity-70'}`} />
                  <span className="truncate">{tab.label}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold shrink-0 ${
                  isActive ? tab.badgeCls : tab.pillCls
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Filter & Search Controls Bar */}
      <div className="p-3.5 bg-[#14062E]/90 border border-white/10 rounded-[4px] shadow-sm space-y-3 font-mono">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2">
          {/* Search box */}
          <div className="lg:col-span-4 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo ID, câu hỏi, căn cứ luật, ghi chú..."
              className="w-full bg-black/60 border border-white/15 rounded-[4px] pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:border-amber-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Stage */}
          <div className="lg:col-span-2">
            <select
              value={filterStage}
              onChange={e => setFilterStage(e.target.value)}
              className="w-full bg-black/60 border border-white/15 rounded-[4px] px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
            >
              <option value="ALL">🏆 Vòng thi: Tất cả</option>
              <option value="VONG_LOAI">Vòng Loại (Bộ GD&ĐT)</option>
              <option value="BAN_KET_1">Bán Kết 1</option>
              <option value="BAN_KET_2">Bán Kết 2</option>
              <option value="BAN_KET_3">Bán Kết 3</option>
              <option value="CHUNG_KET">Chung Kết Toàn Quốc</option>
            </select>
          </div>

          {/* Filter Format */}
          <div className="lg:col-span-2">
            <select
              value={filterFormat}
              onChange={e => setFilterFormat(e.target.value)}
              className="w-full bg-black/60 border border-white/15 rounded-[4px] px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
            >
              <option value="ALL">📋 Thể thức: Tất cả</option>
              {Object.entries(BTI_ROUND_GROUPS).map(([k, v]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Cognitive Level */}
          <div className="lg:col-span-2">
            <select
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value)}
              className="w-full bg-black/60 border border-white/15 rounded-[4px] px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
            >
              <option value="ALL">🎯 Độ khó: Tất cả</option>
              {Object.values(COGNITIVE_LEVELS).map(lvl => (
                <option key={lvl.level} value={lvl.level}>{lvl.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Competency Domain */}
          <div className="lg:col-span-2">
            <select
              value={filterDomain}
              onChange={e => setFilterDomain(e.target.value)}
              className="w-full bg-black/60 border border-white/15 rounded-[4px] px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
            >
              <option value="ALL">🌐 Miền NL: 6 Miền</option>
              {Object.values(DIGITAL_COMPETENCY_DOMAINS).map(d => (
                <option key={d.key} value={d.key}>{d.code}: {d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Bulk Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-mono flex items-center gap-1.5 transition cursor-pointer border border-white/15"
            >
              <Check className={`w-3 h-3 ${selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0 ? 'text-emerald-400' : 'opacity-50'}`} />
              <span>
                {selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </span>
            </button>

            {selectedIds.size > 0 && (
              <span className="text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                Đã chọn: {selectedIds.size} câu
              </span>
            )}

            {filteredQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  const exportList = selectedIds.size > 0 
                    ? filteredQuestions.filter(q => selectedIds.has(q.id))
                    : filteredQuestions;
                  exportQuestionsToPdf(exportList, 'Ngân Hàng Câu Hỏi - Bộ Đề Thử Nghiệm');
                  onShowToast(`Đang xuất ${exportList.length} câu hỏi ra PDF...`);
                }}
                className="px-2.5 py-1 rounded bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 font-mono flex items-center gap-1.5 transition cursor-pointer border border-sky-500/30 ml-1"
                title={selectedIds.size > 0 ? 'Xuất PDF các câu đã chọn' : 'Xuất PDF danh sách đang lọc'}
              >
                <Printer className="w-3 h-3" />
                <span>Xuất PDF</span>
              </button>
            )}
          </div>

          {/* Bulk Action Buttons */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-white/50 text-[11px]">Thao tác hàng loạt:</span>
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  setBulkActionModal({ action: 'APPROVE', count: selectedIds.size });
                  setBulkNotes('✓ Đã phê duyệt hàng loạt bởi Hội đồng Khảo thí BTI 2026.');
                }}
                className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 transition cursor-pointer shadow-sm text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Duyệt ({selectedIds.size})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  setBulkActionModal({ action: 'REJECT', count: selectedIds.size });
                  setBulkNotes('⚠️ Yêu cầu tác giả rà soát và chỉnh sửa căn cứ pháp lý & phương án đáp án.');
                }}
                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1 transition cursor-pointer shadow-sm text-xs"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Từ chối ({selectedIds.size})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  setBulkActionModal({ action: 'PENDING', count: selectedIds.size });
                  setBulkNotes('⏳ Chuyển lại trạng thái Chờ Thẩm Định.');
                }}
                className="px-3 py-1 rounded bg-amber-600/80 hover:bg-amber-600 text-white font-bold flex items-center gap-1 transition cursor-pointer shadow-sm text-xs"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Chờ Duyệt ({selectedIds.size})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Question List / Review Cards */}
      {filteredQuestions.length === 0 ? (
        <div className="p-12 text-center bg-[#170836]/60 border border-white/10 rounded-[4px] space-y-3 font-mono">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCheck className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold text-sm">
            {statusTab === 'PENDING_REVIEW' 
              ? 'Tuyệt vời! Không còn câu hỏi nào đang chờ thẩm định.'
              : 'Không tìm thấy câu hỏi phù hợp với bộ lọc hiện tại.'}
          </h3>
          <p className="text-white/50 text-xs max-w-md mx-auto">
            {statusTab === 'PENDING_REVIEW' 
              ? 'Tất cả câu hỏi trong ngân hàng đã được duyệt hoặc xử lý. Bạn có thể xem các tab "Đã Phê Duyệt" hoặc "Tất Cả".'
              : 'Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh các tiêu chí lọc.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((q, index) => {
            const isSelected = selectedIds.has(q.id);
            const isExpanded = !!expandedCards[q.id];
            const currentNotes = editingNotes[q.id] !== undefined ? editingNotes[q.id] : (q.review_notes || '');
            const hasNotesChanged = editingNotes[q.id] !== undefined && editingNotes[q.id] !== (q.review_notes || '');
            const isAuditingThis = auditingQuestionId === q.id;

            return (
              <div
                key={q.id}
                className={`rounded-[4px] border transition-all ${
                  q.approval_status === 'APPROVED'
                    ? 'bg-[#150a2e]/90 border-emerald-500/30 hover:border-emerald-500/60'
                    : q.approval_status === 'REJECTED'
                    ? 'bg-[#1a082b]/90 border-rose-500/30 hover:border-rose-500/60'
                    : q.approval_status === 'PENDING_REVIEW'
                    ? 'bg-[#1a0c36]/95 border-amber-500/40 hover:border-amber-500/70 shadow-lg'
                    : 'bg-[#14062c]/80 border-white/15'
                } ${isSelected ? 'ring-2 ring-amber-400/80 bg-amber-950/20' : ''}`}
              >
                {/* Top Question Header Bar */}
                <div className="p-3 sm:p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Checkbox for bulk action */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(q.id)}
                      className="w-4 h-4 rounded border-white/30 text-amber-500 focus:ring-amber-400 bg-black/50 cursor-pointer"
                    />

                    {/* Question ID Badge */}
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-black/60 text-amber-300 border border-amber-500/40">
                      #{q.id}
                    </span>

                    {/* Stage & Round Name */}
                    <span className="text-xs font-mono font-bold text-sky-300">
                      {q.stage} • {q.round_name || q.round_format}
                    </span>

                    {/* Cognitive Level Badge */}
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      q.cognitive_level === 'NHAN_BIET' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' :
                      q.cognitive_level === 'THONG_HIEU' ? 'bg-sky-500/20 text-sky-300 border-sky-400/30' :
                      q.cognitive_level === 'VAN_DUNG' ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' :
                      'bg-rose-500/20 text-rose-300 border-rose-400/30'
                    }`}>
                      {COGNITIVE_LEVELS[q.cognitive_level]?.name || q.cognitive_level}
                    </span>

                    {/* Digital Competency Domain */}
                    {q.digital_competency_domain && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                        {DIGITAL_COMPETENCY_DOMAINS[q.digital_competency_domain]?.code || q.digital_competency_domain}
                        {q.digital_sub_competency ? ` (${q.digital_sub_competency})` : ''}
                      </span>
                    )}
                  </div>

                  {/* Right Status Badge & Creation Metadata */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        vibrateTap();
                        soundFx.playClick();
                        setQuickReviewQuestion(q);
                      }}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border flex items-center gap-1 cursor-pointer hover:brightness-125 transition ${
                        q.approval_status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' :
                        (q.approval_status === 'REJECTED' || q.approval_status === 'NEEDS_REVISION') ? 'bg-rose-500/20 text-rose-300 border-rose-400/40' :
                        q.approval_status === 'PENDING_REVIEW' ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 animate-pulse' :
                        'bg-slate-500/20 text-slate-300 border-slate-400/40'
                      }`}
                      title="Nhấp để Review nhanh trạng thái & ghi chú (Lưu Firestore)"
                    >
                      {q.approval_status === 'APPROVED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {(q.approval_status === 'REJECTED' || q.approval_status === 'NEEDS_REVISION') && <XCircle className="w-3.5 h-3.5" />}
                      {q.approval_status === 'PENDING_REVIEW' && <Clock className="w-3.5 h-3.5" />}
                      {getStatusInfo(q.approval_status).label}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        vibrateTap();
                        soundFx.playClick();
                        setQuickReviewQuestion(q);
                      }}
                      className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 text-[11px] font-mono font-bold flex items-center gap-1 transition cursor-pointer"
                      title="Review nhanh trạng thái & ghi chú trực tiếp vào Firestore"
                    >
                      <ShieldCheck className="w-3 h-3 text-amber-400" />
                      <span>Review nhanh</span>
                    </button>

                    {q.approved_by && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30" title="Kiểm duyệt viên đã phê duyệt">
                        Duyệt: {q.approved_by}
                      </span>
                    )}

                    <span className="text-[10px] font-mono text-white/40">
                      Tác giả: {q.created_by || 'Khảo thí viên'}
                    </span>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="p-3.5 sm:p-4 space-y-3">
                  {/* Question Stem / Text */}
                  <div className="text-white text-sm leading-relaxed font-sans font-medium">
                    <span className="text-amber-400 font-mono font-bold mr-1.5">Câu hỏi:</span>
                    <HighlightedText text={q.question_text} searchQuery={searchQuery} />
                  </div>

                  {/* Formatted Answer / Structure Breakdown */}
                  {q.round_type === 'MULTIPLE_CHOICE' || q.round_format === 'BGD_MULTIPLE_CHOICE' || q.round_format === 'KD_TRAC_NGHIEM_ABCD' || q.round_format === 'VD_AID_4' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs pt-1">
                      {['A', 'B', 'C', 'D'].map(key => {
                        const optText = (q.options as Record<string, string>)?.[key];
                        const isCorrect = q.correct_key === key;
                        if (!optText) return null;
                        return (
                          <div
                            key={key}
                            className={`p-2 rounded border flex items-start gap-2 ${
                              isCorrect
                                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 ring-1 ring-emerald-500/40 font-bold'
                                : 'bg-black/40 border-white/10 text-white/70'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                              isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-white/60'
                            }`}>
                              {key}
                            </span>
                            <span className="flex-1 leading-snug">
                              <HighlightedText text={optText} searchQuery={searchQuery} />
                            </span>
                            {isCorrect && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : q.round_type === 'TRUE_FALSE_4' || q.round_format === 'BGD_TRUE_FALSE_4' ? (
                    <div className="p-2.5 rounded bg-purple-950/30 border border-purple-500/30 space-y-1.5 text-xs font-mono">
                      <span className="text-purple-300 font-bold block text-[11px]">4 Mệnh đề Đúng/Sai:</span>
                      {q.options && typeof q.options === 'object' && Object.entries(q.options).map(([k, val]) => (
                        <div key={k} className="flex items-center justify-between gap-2 p-1.5 rounded bg-black/40 border border-white/5">
                          <span className="text-white/90">
                            <strong className="text-purple-300 mr-1">{k})</strong> {typeof val === 'string' ? val : (val as any).text}
                          </span>
                          <span className={`px-2 py-0.2 rounded font-bold text-[10px] ${
                            (typeof val === 'object' && (val as any).isCorrect) || (typeof val === 'string' && val.includes('ĐÚNG'))
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}>
                            {(typeof val === 'object' && (val as any).isCorrect) || (typeof val === 'string' && val.includes('ĐÚNG')) ? 'ĐÚNG' : 'SAI'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : q.round_type === 'VCNV' || q.round_format === 'VCNV_HANG_NGANG' ? (
                    <div className="p-2.5 rounded bg-amber-950/20 border border-amber-500/30 space-y-1 text-xs font-mono">
                      <div className="flex items-center justify-between text-amber-300 font-bold text-[11px]">
                        <span>🧩 Từ khóa VCNV: {(q.obstacle_info as any)?.obstacleKeyword || q.correct_key}</span>
                        <span>{(q.obstacle_info as any)?.clues?.length || 4} hàng ngang + Ô Trung Tâm + Câu Hiểm Họa</span>
                      </div>
                      <p className="text-[11px] text-white/60">
                        Hiểm họa: {(q.obstacle_info as any)?.riskQuestion || 'Chưa thiết lập'} (Đ/A: {(q.obstacle_info as any)?.riskAnswer || 'Chưa có'})
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded bg-cyan-950/20 border border-cyan-500/30 text-xs font-mono flex items-center justify-between gap-2">
                      <span className="text-cyan-300">
                        <strong>Đáp án chuẩn:</strong> {q.correct_key}
                      </span>
                      <span className="text-white/40 text-[10px]">
                        {q.correct_key ? `${q.correct_key.length} ký tự` : ''}
                      </span>
                    </div>
                  )}

                  {/* Explanation & Legal Basis Drawer / Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-black/40 border border-white/10 space-y-1">
                      <span className="text-white/50 text-[10px] flex items-center gap-1 font-bold">
                        <BookOpen className="w-3 h-3 text-blue-400" />
                        GIẢI THÍCH ĐÁP ÁN:
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {q.explanation ? <HighlightedText text={q.explanation} searchQuery={searchQuery} /> : 'Chưa có nội dung giải thích chi tiết.'}
                      </p>
                    </div>

                    <div className="p-2 rounded bg-black/40 border border-white/10 space-y-1">
                      <span className="text-white/50 text-[10px] flex items-center gap-1 font-bold">
                        <Scale className="w-3 h-3 text-amber-400" />
                        CĂN CỨ PHÁP LÝ &amp; CHUẨN KHẢO THÍ:
                      </span>
                      <p className="text-amber-200 text-[11px] leading-relaxed">
                        <HighlightedText text={q.legal_reference || 'Thông tư 02/2025/TT-BGDĐT & Nghị định 13/2023/NĐ-CP'} searchQuery={searchQuery} />
                      </p>
                    </div>
                  </div>

                  {/* 4. MODERATOR REVIEW NOTES SECTION */}
                  <div className="p-3 rounded bg-[#160830] border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ghi Chú Thẩm Định / Review Notes:</span>
                        {q.approval_status === 'REJECTED' && (
                          <span className="text-rose-400 text-[10px] font-normal">(Lý do từ chối &amp; yêu cầu sửa)</span>
                        )}
                      </label>

                      {hasNotesChanged && (
                        <button
                          type="button"
                          onClick={() => handleSaveNotesOnly(q)}
                          className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-mono cursor-pointer flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Lưu ghi chú</span>
                        </button>
                      )}
                    </div>

                    <textarea
                      rows={2}
                      value={currentNotes}
                      onChange={e => {
                        const val = e.target.value;
                        setEditingNotes(prev => ({
                          ...prev,
                          [q.id]: val
                        }));
                      }}
                      placeholder="Nhập nhận xét thẩm định, phân tích tính chuẩn xác hoặc lý do phê duyệt/từ chối..."
                      className="w-full bg-black/60 border border-amber-500/30 rounded-[4px] px-3 py-1.5 text-xs text-amber-200 placeholder-amber-200/30 focus:border-amber-400 focus:outline-none leading-relaxed"
                    />

                    {/* Quick Preset Feedback Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] font-mono text-white/40">Gợi ý nhanh:</span>
                      {presetSnippets.map(snippet => (
                        <button
                          key={snippet}
                          type="button"
                          onClick={() => {
                            vibrateTap();
                            const newNotes = currentNotes ? `${currentNotes.trim()}\n${snippet}` : snippet;
                            setEditingNotes(prev => ({
                              ...prev,
                              [q.id]: newNotes
                            }));
                            questionBankManager.updateReviewNotes(q.id, newNotes);
                            onShowToast(`Đã thêm ghi chú: "${snippet.slice(0, 30)}..."`);
                          }}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 hover:bg-amber-500/20 text-white/70 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 transition cursor-pointer"
                        >
                          {snippet}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. MODERATOR ACTION BUTTONS BAR */}
                  <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                    {/* Left: AI Audit & Edit */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setQualityReviewQuestion(q);
                        }}
                        className="px-3 py-1.5 rounded bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-200 border border-amber-400/40 flex items-center gap-1.5 transition cursor-pointer font-bold shadow-xs"
                        title="Thẩm định chất lượng & Đối soát pháp quy chuyên sâu với Deep Research Pro"
                      >
                        <Scale className="w-3.5 h-3.5 text-amber-300" />
                        <span>⚖️ Thẩm Định Deep Research</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setQuickReviewQuestion(q);
                        }}
                        className="px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 flex items-center gap-1.5 transition cursor-pointer font-bold shadow-xs"
                        title="Mở hộp thoại Review nhanh để đổi trạng thái và thêm ghi chú trực tiếp vào Firestore"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                        <span>⚡ Review Nhanh (Firestore)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAiAudit(q)}
                        disabled={isAuditingThis}
                        className="px-3 py-1.5 rounded bg-gradient-to-r from-purple-600/40 to-indigo-600/40 hover:from-purple-600/60 hover:to-indigo-600/60 text-purple-200 border border-purple-400/40 flex items-center gap-1.5 transition cursor-pointer font-bold shadow-sm"
                        title="Dùng Gemini AI thẩm định tự động tính chuẩn xác pháp lý và chất lượng khảo thí"
                      >
                        <Sparkles className={`w-3.5 h-3.5 text-purple-300 ${isAuditingThis ? 'animate-spin' : ''}`} />
                        <span>{isAuditingThis ? 'Đang AI Thẩm Định...' : '🤖 AI Thẩm Định'}</span>
                      </button>

                      {onPreviewQuestion && (
                        <button
                          type="button"
                          onClick={() => {
                            vibrateTap();
                            soundFx.playClick();
                            onPreviewQuestion(q);
                          }}
                          className="px-3 py-1.5 rounded bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition cursor-pointer"
                          title="Xem trước nội dung câu hỏi & thử nghiệm đồng hồ đếm ngược"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Xem trước câu hỏi</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          onEditQuestion(q);
                        }}
                        className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1.5 transition cursor-pointer"
                        title="Mở cửa sổ soạn thảo để sửa chi tiết nội dung câu hỏi"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-sky-300" />
                        <span>Sửa Chi Tiết</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setExpandedHistory(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                        className={`px-3 py-1.5 rounded border flex items-center gap-1.5 transition cursor-pointer ${
                          expandedHistory[q.id] 
                            ? 'bg-sky-900/40 border-sky-500/50 text-sky-300' 
                            : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                        }`}
                        title="Xem lịch sử chỉnh sửa và cập nhật của câu hỏi"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Lịch sử ({q.activity_logs?.length || 0})</span>
                      </button>
                    </div>

                    {/* Right: Decision Action Controls */}
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {q.approval_status !== 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => handleApprove(q)}
                          className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                          title="Phê duyệt câu hỏi này vào ngân hàng chính thức"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>✓ Phê Duyệt</span>
                        </button>
                      )}

                      {q.approval_status !== 'REJECTED' && (
                        <button
                          type="button"
                          onClick={() => handleReject(q)}
                          className="px-3.5 py-1.5 rounded bg-rose-600/80 hover:bg-rose-600 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                          title="Từ chối câu hỏi và yêu cầu tác giả chỉnh sửa"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>✗ Từ Chối</span>
                        </button>
                      )}

                      {q.approval_status !== 'PENDING_REVIEW' && (
                        <button
                          type="button"
                          onClick={() => handleSetPending(q)}
                          className="px-3 py-1.5 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 flex items-center gap-1 transition cursor-pointer"
                          title="Chuyển lại về trạng thái chờ thẩm định"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Chờ Duyệt</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 6. HISTORY LOGS */}
                  {expandedHistory[q.id] && (
                    <div className="pt-3 mt-1 border-t border-white/10 animate-in slide-in-from-top-2">
                      <h4 className="text-xs font-mono text-white/50 mb-2 flex items-center gap-1.5 uppercase">
                        <History className="w-3.5 h-3.5" />
                        Nhật ký hoạt động
                      </h4>
                      {(!q.activity_logs || q.activity_logs.length === 0) ? (
                        <div className="text-[11px] text-white/40 italic py-2 px-3 bg-black/20 rounded">
                          Không có dữ liệu lịch sử hoạt động cho câu hỏi này.
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                          {q.activity_logs.map(log => (
                            <div key={log.id} className="text-xs font-mono bg-black/40 rounded p-2 flex items-start justify-between gap-3 border border-white/5 hover:border-white/10 transition">
                              <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className={`font-bold ${
                                    log.action === 'CREATED' ? 'text-emerald-400' :
                                    log.action === 'EDITED' ? 'text-sky-400' :
                                    log.action === 'STATUS_CHANGED' ? 'text-amber-400' :
                                    log.action === 'NOTE_ADDED' ? 'text-purple-400' :
                                    'text-rose-400'
                                  }`}>
                                    {log.action}
                                  </span>
                                  <span className="text-white/40 text-[10px]">•</span>
                                  <span className="text-white/80">{log.user}</span>
                                </div>
                                {log.details && (
                                  <p className="text-white/60 text-[11px] mt-0.5">{log.details}</p>
                                )}
                              </div>
                              <span className="text-white/40 text-[10px] whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString('vi-VN', {
                                  hour: '2-digit', minute: '2-digit', 
                                  day: '2-digit', month: '2-digit', year: 'numeric'
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. AI AUDIT RESULT MODAL */}
      {auditModalData && (
        <div className="fixed inset-0 z-[10000000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#180838] border border-purple-500/50 rounded-[4px] shadow-2xl overflow-hidden font-mono flex flex-col max-h-[90vh] animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-[#1e0a44] border-b border-purple-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-bold text-sm">
                  BÁO CÁO THẨM ĐỊNH TỰ ĐỘNG BẰNG AI (BTI 2026 AUDIT)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAuditModalData(null)}
                className="p-1 rounded text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Question summary */}
              <div className="p-3 bg-black/40 rounded border border-white/10">
                <span className="text-white/50 text-[10px] block mb-1">CÂU HỎI THẨM ĐỊNH:</span>
                <p className="text-white font-sans">{auditModalData.question.question_text}</p>
              </div>

              {/* Recommendation & Score Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`p-3.5 rounded border ${
                  auditModalData.result.recommendation === 'APPROVED' ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200' :
                  auditModalData.result.recommendation === 'REJECTED' ? 'bg-rose-950/60 border-rose-500 text-rose-200' :
                  'bg-amber-950/60 border-amber-500 text-amber-200'
                }`}>
                  <span className="text-[10px] opacity-70 block">KHUYẾN NGHỊ TỪ AI:</span>
                  <div className="text-base font-bold mt-1 flex items-center gap-2">
                    {auditModalData.result.recommendation === 'APPROVED' && <span>✓ ĐỀ XUẤT PHÊ DUYỆT</span>}
                    {auditModalData.result.recommendation === 'REJECTED' && <span>✗ ĐỀ XUẤT TỪ CHỐI</span>}
                    {auditModalData.result.recommendation === 'NEEDS_REVISION' && <span>⚠️ CẦN CHỈNH SỬA LẠI</span>}
                  </div>
                </div>

                <div className="p-3.5 rounded bg-black/50 border border-purple-500/40 text-purple-200">
                  <span className="text-[10px] text-white/50 block">ĐIỂM CHẤT LƯỢNG KHẢO THÍ:</span>
                  <div className="text-2xl font-bold text-amber-300 mt-0.5">
                    {auditModalData.result.qualityScore} / 100
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="p-3 bg-black/40 rounded border border-white/10 space-y-1">
                <span className="text-purple-300 font-bold block">TỔNG QUAN ĐÁNH GIÁ:</span>
                <p className="text-slate-300 leading-relaxed font-sans">{auditModalData.result.summary}</p>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-950/30 rounded border border-emerald-500/30 space-y-1.5">
                  <span className="text-emerald-300 font-bold block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Ưu Điểm &amp; Điểm Mạnh:
                  </span>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside">
                    {auditModalData.result.strengths.map((s, idx) => (
                      <li key={idx} className="font-sans leading-relaxed">{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-rose-950/30 rounded border border-rose-500/30 space-y-1.5">
                  <span className="text-rose-300 font-bold block flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Hạn Chế &amp; Điểm Cần Cải Thiện:
                  </span>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside">
                    {auditModalData.result.weaknesses.map((w, idx) => (
                      <li key={idx} className="font-sans leading-relaxed">{w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Legal Check */}
              <div className="p-3 bg-black/50 rounded border border-amber-500/30 space-y-1">
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5" />
                  Kiểm Tra Tính Chuẩn Xác Pháp Lý:
                </span>
                <p className="text-slate-300 font-sans leading-relaxed">
                  {auditModalData.result.legalCheck?.notes || 'Đã kiểm tra căn cứ TT 02/2025 và NĐ 13/2023.'}
                </p>
              </div>

              {/* Suggested Review Notes */}
              <div className="p-3 bg-[#1e0b3c] rounded border border-purple-500/40 space-y-2">
                <span className="text-purple-300 font-bold block">GỢI Ý NỘI DUNG GHI CHÚ THẨM ĐỊNH (REVIEW NOTES):</span>
                <p className="text-amber-200 font-sans bg-black/40 p-2.5 rounded border border-white/10 leading-relaxed">
                  {auditModalData.result.suggestedReviewNotes}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#14052e] border-t border-purple-500/30 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setAuditModalData(null)}
                className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-white font-mono cursor-pointer text-xs"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={() => applyAiSuggestedNotes(auditModalData.question.id, auditModalData.result.suggestedReviewNotes)}
                className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold font-mono cursor-pointer flex items-center gap-1.5 text-xs shadow-md"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Áp Dụng Vào Review Notes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. BULK ACTION MODAL */}
      {bulkActionModal && (
        <div className="fixed inset-0 z-[10000000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#180838] border border-amber-500/50 rounded-[4px] shadow-2xl p-5 font-mono space-y-4 text-xs animate-in zoom-in-95">
            <h3 className="text-white font-bold text-sm flex items-center gap-2 border-b border-white/10 pb-3">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              XÁC NHẬN THAO TÁC HÀNG LOẠT ({bulkActionModal.count} CÂU HỎI)
            </h3>

            <p className="text-slate-300">
              Bạn đang thực hiện thao tác:{' '}
              <strong className={bulkActionModal.action === 'APPROVE' ? 'text-emerald-400' : bulkActionModal.action === 'REJECT' ? 'text-rose-400' : 'text-amber-400'}>
                {bulkActionModal.action === 'APPROVE' ? 'PHÊ DUYỆT HÀNG LOẠT' : bulkActionModal.action === 'REJECT' ? 'TỪ CHỐI HÀNG LOẠT' : 'CHUYỂN VỀ CHỜ DUYỆT'}
              </strong>{' '}
              cho <strong>{bulkActionModal.count} câu hỏi</strong> đã chọn.
            </p>

            <div className="space-y-1.5">
              <label className="text-white/70 block">Ghi chú thẩm định áp dụng chung (Tùy chọn):</label>
              <textarea
                rows={3}
                value={bulkNotes}
                onChange={e => setBulkNotes(e.target.value)}
                placeholder="Nhập ghi chú hoặc lý do chung..."
                className="w-full bg-black/60 border border-white/15 rounded-[4px] p-2.5 text-amber-200 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setBulkActionModal(null)}
                className="px-3.5 py-1.5 rounded bg-white/10 text-white hover:bg-white/20 cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={executeBulkAction}
                className={`px-4 py-1.5 rounded font-bold text-white cursor-pointer shadow ${
                  bulkActionModal.action === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-500' :
                  bulkActionModal.action === 'REJECT' ? 'bg-rose-600 hover:bg-rose-500' :
                  'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                Xác Nhận Thực Hiện
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Quick Review Modal */}
      {quickReviewQuestion && (
        <QuestionQuickReviewModal
          isOpen={Boolean(quickReviewQuestion)}
          question={quickReviewQuestion}
          onClose={() => setQuickReviewQuestion(null)}
          onReviewSaved={(updatedQ, status, notes) => {
            setQuestions([...questionBankManager.getQuestions()]);
            onShowToast(`Đã cập nhật câu hỏi #${updatedQ.id} sang [${getStatusInfo(status).label}] và lưu Firestore thành công!`);
          }}
        />
      )}

      {/* Deep Research Question Quality Review Modal */}
      {qualityReviewQuestion && (
        <QuestionQualityReviewModal
          isOpen={Boolean(qualityReviewQuestion)}
          question={qualityReviewQuestion}
          onClose={() => setQualityReviewQuestion(null)}
          onQuestionUpdated={(updatedQ) => {
            setQuestions([...questionBankManager.getQuestions()]);
            onShowToast(`Đã cập nhật câu hỏi #${updatedQ.id} sau thẩm định pháp quy.`);
          }}
          onShowToast={(title, msg) => {
            onShowToast(`${title}: ${msg}`);
          }}
        />
      )}
    </div>
  );
};
