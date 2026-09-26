import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard,
  Layers, 
  Sparkles, 
  FileSpreadsheet, 
  Theater, 
  Scale, 
  Dices, 
  Users, 
  Filter, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Download, 
  Trash2, 
  Edit3, 
  Eye, 
  BarChart3, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Zap,
  Rocket,
  Flag,
  Compass,
  X,
  Image as ImageIcon,
  Target,
  Key,
  Keyboard,
  List,
  LayoutList,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  History,
  Tag,
  FolderPlus,
  PlayCircle,
  CheckSquare,
  ListChecks,
  Lock,
  Unlock,
  GripVertical,
  ShieldAlert,
  Camera,
  HardDrive,
  Grid,
  Database,
  RotateCcw
} from 'lucide-react';
import { questionDraftService, QuestionDraft } from '../../services/questionDraftService';
import { 
  QuestionItem, 
  CompetitionStage, 
  CognitiveLevel, 
  DigitalCompetencyDomainKey, 
  ApprovalStatus,
  PickedDriveFile
} from '../../types';
import { 
  DIGITAL_COMPETENCY_DOMAINS, 
  COGNITIVE_LEVELS, 
  COMPETITION_STAGES,
  QUESTION_ROUND_FORMATS,
  BTI_ROUND_GROUPS,
  getActiveFormatsForRoundGroup,
  getRoundGroupByFormat,
  BtiRoundGroupKey
} from '../../data/digitalCompetencyData';
import { questionBankManager } from '../../services/questionBankManager';
import { AIQuestionStudio } from './AIQuestionStudio';
import { ExcelTemplateHub } from './ExcelTemplateHub';
import { InteractiveScenarioEditor } from './InteractiveScenarioEditor';
import { LegalDocumentLibrary } from './LegalDocumentLibrary';
import { RandomExamGeneratorModal } from './RandomExamGeneratorModal';
import { AiMockQuizGeneratorModal } from './AiMockQuizGeneratorModal';
import { UserRoleManagerModal } from './UserRoleManagerModal';
import { QuestionEditorModal } from './QuestionEditorModal';
import { BulkQuestionImportModal } from './BulkQuestionImportModal';
import { BulkActionToolbar } from './BulkActionToolbar';
import { BulkCategoryChangeModal } from './BulkCategoryChangeModal';
import { BulkDeleteConfirmModal } from './BulkDeleteConfirmModal';
import { QuestionHistoryModal } from './QuestionHistoryModal';
import { QuestionCompareModal } from './QuestionCompareModal';
import { CustomTagsManagerModal } from './CustomTagsManagerModal';
import { CustomCategoriesManagerModal } from './CustomCategoriesManagerModal';
import { DuplicateCheckerModal } from './DuplicateCheckerModal';
import { PrintPreviewModal } from './PrintPreviewModal';
import { QuestionExportModal } from './QuestionExportModal';
import { QuestionQuickPreviewModal } from './QuestionQuickPreviewModal';
import { QuestionQuickReviewModal } from './QuestionQuickReviewModal';
import { questionReviewService, getStatusInfo } from '../../services/questionReviewService';
import { BtiCompetencyMatrixQuickPopup } from './BtiCompetencyMatrixQuickPopup';
import { GeminiCameraDocumentScannerModal } from './GeminiCameraDocumentScannerModal';
import { GoogleDrivePickerModal } from '../common/GoogleDrivePickerModal';
import { googlePickerService, loadPickerApi } from '../../services/googlePickerService';
import { driveImportProcessorService } from '../../services/driveImportProcessorService';
import { MatrixStatusFilterType } from './BtiCompetencyMatrixFilterBar';
import { ShortcutMappingModal } from '../ShortcutMappingModal';
import { shortcutService } from '../../services/shortcutService';
import { Printer } from 'lucide-react';
import { QuestionBankEmptyState } from './QuestionBankEmptyState';
import { QuestionBankFilterBar } from './QuestionBankFilterBar';
import { QuestionBankStatsWidget } from './QuestionBankStatsWidget';
import { ModeratorReviewView } from './ModeratorReviewView';
import { QuestionBankOverviewTab } from './QuestionBankOverviewTab';
import { DashboardOverviewHeader } from './DashboardOverviewHeader';
import { BtiCompetencyMatrixDashboard } from './BtiCompetencyMatrixDashboard';
import { BtiQuestionCoverageHeatmapView } from './BtiQuestionCoverageHeatmapView';
import { QuestionBankToastContainer, useQuestionBankToasts } from './QuestionBankToast';
import { generateAutoTagsWithAI, mergeTagsList } from '../../services/aiAutoTaggingService';
import { batchClassifyAndTagWithMatrix } from '../../services/smartCategorizationService';
import { BulkUpdatePreviewModal, BulkPreviewItem } from './BulkUpdatePreviewModal';
import { DifficultyBadgeAndMeter } from './DifficultyBadgeAndMeter';
import { DifficultyBatchSuggestionModal } from './DifficultyBatchSuggestionModal';
import { 
  fullTextSearchQuestions, 
  SearchResultItem, 
  HighlightedText 
} from '../../services/fullTextSearchService';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateWarning } from '../../utils/hapticUtils';
import { getTagColorScheme } from '../../utils/tagColorUtils';

type MainTab = 'OVERVIEW' | 'QUESTIONS' | 'MODERATION' | 'AI_STUDIO' | 'EXCEL_HUB' | 'SCENARIOS' | 'LEGAL_DOCS' | 'MATRIX';

interface QuestionBankDashboardProps {
  onOpenGeminiStudio?: (tab?: 'CHAT' | 'IMAGE' | 'VIDEO') => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export const QuestionBankDashboard: React.FC<QuestionBankDashboardProps> = ({ 
  onOpenGeminiStudio,
  isFocusMode: propIsFocusMode,
  onToggleFocusMode
}) => {
  const [internalIsFocusMode, setInternalIsFocusMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bti_qb_focus_mode') === 'true';
    }
    return false;
  });
  const isFocusMode = propIsFocusMode ?? internalIsFocusMode;

  const [activeTab, setActiveTab] = useState<MainTab>('OVERVIEW');
  const [questions, setQuestions] = useState<QuestionItem[]>(() => questionBankManager.getQuestions());
  const [stats, setStats] = useState(() => questionBankManager.getMatrixStats());
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => questionBankManager.getCurrentUser());

  // Filters
  const [filterRoundGroup, setFilterRoundGroup] = useState<BtiRoundGroupKey | 'ALL'>('ALL');
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [filterFormat, setFilterFormat] = useState<string>('ALL');
  const [filterDomain, setFilterDomain] = useState<string>('ALL');
  const [filterSubCompetency, setFilterSubCompetency] = useState<string>('ALL');
  const [filterMatrixStatus, setFilterMatrixStatus] = useState<MatrixStatusFilterType>('ALL');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterTopic, setFilterTopic] = useState<string>('ALL');
  const [filterTag, setFilterTag] = useState<string>('ALL');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagMatchMode, setTagMatchMode] = useState<'OR' | 'AND'>('OR');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('NEWEST');
  
  // Ensure QUESTIONS view is active when Focus Mode is turned ON if user is on overview/legal tabs
  useEffect(() => {
    if (isFocusMode && (activeTab === 'OVERVIEW' || activeTab === 'MATRIX' || activeTab === 'LEGAL_DOCS' || activeTab === 'EXCEL_HUB')) {
      setActiveTab('QUESTIONS');
    }
  }, [isFocusMode]);
  // Drag and Drop state with lock/unlock control
  const [isDragDropEnabled, setIsDragDropEnabled] = useState<boolean>(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!isDragDropEnabled) {
      e.preventDefault();
      return;
    }
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    if (!isDragDropEnabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = (e: React.DragEvent, id: string) => {
    if (!isDragDropEnabled) return;
    if (dragOverId === id) {
      setDragOverId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    if (!isDragDropEnabled) return;
    e.preventDefault();
    setDragOverId(null);
    if (!draggedId || draggedId === targetId) return;

    questionBankManager.reorderQuestion(draggedId, targetId);
    setQuestions(questionBankManager.getQuestions());
    setSortBy('MANUAL');
    setDraggedId(null);
    vibrateTap();
    soundFx.playClick();
    addToast('Đã sắp xếp thứ tự', 'Đã lưu vị trí mới cho câu hỏi vừa kéo thả.', 'info');
  };

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showExamModal, setShowExamModal] = useState<boolean>(false);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState<boolean>(false);
  const [editorInitialRound, setEditorInitialRound] = useState<BtiRoundGroupKey | undefined>(undefined);
  const [editorInitialDomain, setEditorInitialDomain] = useState<string | undefined>(undefined);
  const [showBulkImportModal, setShowBulkImportModal] = useState<boolean>(false);
  const [showGooglePickerModal, setShowGooglePickerModal] = useState<boolean>(false);
  const [selectedDriveFile, setSelectedDriveFile] = useState<PickedDriveFile | null>(null);
  const [isDrivePickerLoading, setIsDrivePickerLoading] = useState<boolean>(false);

  // IndexedDB Auto-Saved Draft detection for easy resume after page refresh or navigation
  const [unsavedIndexedDbDraft, setUnsavedIndexedDbDraft] = useState<QuestionDraft | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkUnsavedDraft = async () => {
      try {
        const draft = await questionDraftService.getDraftFromIndexedDB('new');
        if (!isMounted) return;
        if (draft && questionDraftService.isMeaningful(draft)) {
          setUnsavedIndexedDbDraft(draft);
        } else {
          setUnsavedIndexedDbDraft(null);
        }
      } catch (err) {
        console.warn('[QuestionBankDashboard] Error checking IndexedDB draft:', err);
      }
    };

    checkUnsavedDraft();

    const handleDraftUpdated = () => checkUnsavedDraft();
    window.addEventListener('bti:draft-saved', handleDraftUpdated);
    window.addEventListener('bti:draft-cleared', handleDraftUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('bti:draft-saved', handleDraftUpdated);
      window.removeEventListener('bti:draft-cleared', handleDraftUpdated);
    };
  }, []);

  // Pre-load Google Picker client library on dashboard mount
  useEffect(() => {
    loadPickerApi().catch((err) => {
      console.warn('Google Picker API preload note:', err);
    });
  }, []);

  const handleImportFromDrive = async () => {
    vibrateTap();
    soundFx.playClick();
    setIsDrivePickerLoading(true);
    try {
      // Trigger the Google Picker interface directly
      const files = await googlePickerService.openPicker({
        viewId: 'ALL',
        title: 'Import from Drive — Chọn tệp từ Google Drive',
        multiselect: false
      });

      if (files && files.length > 0) {
        const file = files[0];
        // Explicitly log the selected file metadata to the console for further processing
        console.log('Selected file metadata:', file);
        console.log('[Import from Drive] Selected file metadata:', {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          url: file.url,
          embedUrl: file.embedUrl,
          iconUrl: file.iconUrl,
          sizeBytes: file.sizeBytes,
          lastEditedUtc: file.lastEditedUtc,
          description: file.description
        });

        // Also fetch full Drive file metadata and log it
        try {
          const fullMetadata = await googlePickerService.getFileMetadata(file.id);
          console.log('[Import from Drive] Full Drive API metadata:', fullMetadata);
        } catch (metaErr) {
          console.log('[Import from Drive] Metadata note:', metaErr);
        }

        setSelectedDriveFile(file);
        soundFx.playSuccess();
        vibrateSuccess();

        // Process file metadata with driveImportProcessorService (parsing file IDs and mime types to trigger actions)
        const processResult = await driveImportProcessorService.handlePickerMetadata(file, false);
        console.log('[DriveImportProcessor] Result:', processResult);

        if (processResult.actionTriggered === 'SCAN_DOCUMENT_AI') {
          addToast(
            'Chuyển tiếp đến Gemini AI Scanner',
            `Tệp "${file.name}" thuộc định dạng ảnh/PDF. Đang mở bộ quét tài liệu AI.`,
            'info'
          );
          setShowGeminiScannerModal(true);
        } else if (processResult.importedQuestions.length > 0) {
          addToast(
            'Bóc tách câu hỏi thành công',
            `Đã nhận diện ${processResult.importedQuestions.length} câu hỏi (${processResult.fileMetadata.actionLabel}).`,
            'success'
          );
          setShowBulkImportModal(true);
        } else {
          addToast(
            'Import từ Google Drive',
            `Đã nhận tệp "${file.name}" [${processResult.fileMetadata.fileType}]. Metadata đã được ghi vào console.`,
            'success'
          );

          // If it's a spreadsheet, doc or table, open bulk import modal
          if (
            file.mimeType.includes('spreadsheet') ||
            file.mimeType.includes('document') ||
            file.name.endsWith('.xlsx') ||
            file.name.endsWith('.xls') ||
            file.name.endsWith('.csv') ||
            file.name.endsWith('.json') ||
            file.name.endsWith('.txt')
          ) {
            setShowBulkImportModal(true);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to trigger Google Picker interface:', err);
      // Fallback to opening the modal if popup was blocked or direct call threw
      setShowGooglePickerModal(true);
    } finally {
      setIsDrivePickerLoading(false);
    }
  };
  const [showGeminiScannerModal, setShowGeminiScannerModal] = useState<boolean>(false);
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState<boolean>(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
  const [showTagsManagerModal, setShowTagsManagerModal] = useState<boolean>(false);
  const [showCategoriesManagerModal, setShowCategoriesManagerModal] = useState<boolean>(false);
  const [showDuplicateCheckerModal, setShowDuplicateCheckerModal] = useState<boolean>(false);
  const [showDifficultyBatchModal, setShowDifficultyBatchModal] = useState<boolean>(false);
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showBtiMatrixQuickPopup, setShowBtiMatrixQuickPopup] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [historyQuestion, setHistoryQuestion] = useState<QuestionItem | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<QuestionItem | null>(null);
  const [quickReviewQuestion, setQuickReviewQuestion] = useState<QuestionItem | null>(null);

  // Subscribe to real-time question reviews from Firestore
  useEffect(() => {
    const unsubscribe = questionReviewService.subscribe(() => {
      setQuestions(questionBankManager.getQuestions());
      setStats(questionBankManager.getMatrixStats());
    });
    return () => unsubscribe();
  }, []);

  // Selected item for detail inspection
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null);

  // Batch actions & selection mode
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);

  const handleToggleSelectionMode = () => {
    vibrateTap();
    soundFx.playClick();
    setIsSelectionMode(prev => {
      const next = !prev;
      if (!next) {
        setSelectedIds(new Set());
      }
      return next;
    });
  };

  const handleExitSelectionMode = () => {
    vibrateTap();
    soundFx.playClick();
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  // Toast notifications for CRUD actions
  const {
    toasts,
    removeToast,
    addToast,
    notifyAddQuestion,
    notifyEditQuestion,
    notifyDeleteQuestion,
    notifyBulkDelete,
    notifyBulkUpdate,
    notifyBatchApprove,
    notifyBulkImport,
    notifyReindex
  } = useQuestionBankToasts();

  const handleToggleDragDrop = () => {
    vibrateTap();
    soundFx.playClick();
    if (isDragDropEnabled) {
      setIsDragDropEnabled(false);
      setDraggedId(null);
      setDragOverId(null);
      addToast('Đã khóa kéo thả', 'Đã khóa vị trí câu hỏi, tránh bị kéo thả nhầm.', 'info');
    } else {
      setIsDragDropEnabled(true);
      addToast('Mở khóa kéo thả', 'Bạn có thể kéo thả các câu hỏi để sắp xếp thứ tự tùy chỉnh.', 'info');
    }
  };

  // View mode: 'compact' (Bảng rút gọn - high density) vs 'detailed' (Thẻ chi tiết) vs 'heatmap' (Ma trận độ phủ trực quan)
  const [viewMode, setViewMode] = useState<'compact' | 'detailed' | 'heatmap'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bti_qb_view_mode');
      if (saved === 'compact' || saved === 'detailed' || saved === 'heatmap') return saved;
    }
    return 'compact';
  });

  // Track expanded items in compact view mode
  const [expandedCompactIds, setExpandedCompactIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleToggleExpandCompact = (id: string) => {
    vibrateTap();
    setExpandedCompactIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAllCompact = () => {
    vibrateTap();
    soundFx.playClick();
    const allIds = new Set(filteredQuestions.map(q => q.id));
    setExpandedCompactIds(allIds);
  };

  const handleCollapseAllCompact = () => {
    vibrateTap();
    soundFx.playClick();
    setExpandedCompactIds(new Set());
  };

  const handleSwitchViewMode = (mode: 'compact' | 'detailed' | 'heatmap') => {
    vibrateTap();
    soundFx.playClick();
    setViewMode(mode);
    try {
      localStorage.setItem('bti_qb_view_mode', mode);
    } catch {}
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    vibrateTap();
    soundFx.playClick();
    navigator.clipboard.writeText(id).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to identify round group of any question item
  const getQuestionRoundGroup = (q: QuestionItem): BtiRoundGroupKey => {
    if (q.stage === 'VONG_LOAI' || (q.round_format && q.round_format.startsWith('BGD_'))) {
      return 'VONG_LOAI';
    }
    if (q.round_format) {
      const grp = getRoundGroupByFormat(q.round_format);
      if (grp) return grp;
    }
    const idUpper = (q.id || '').toUpperCase();
    if (idUpper.startsWith('KD_') || idUpper.startsWith('KD')) return 'KHOI_DONG';
    if (idUpper.startsWith('VCNV_') || idUpper.startsWith('VCNV') || idUpper.startsWith('CNV_') || idUpper.startsWith('CNV')) return 'VCNV';
    if (idUpper.startsWith('TT_') || idUpper.startsWith('TT')) return 'TANG_TOC';
    if (idUpper.startsWith('VD_') || idUpper.startsWith('VD')) return 'VE_DICH';
    
    if (q.round_type === 'VCNV' || ('clue1' in (q.options || {}))) return 'VCNV';

    const nameLower = (q.round_name || '').toLowerCase();
    if (nameLower.includes('khởi động') || nameLower.includes('khoi dong')) return 'KHOI_DONG';
    if (nameLower.includes('chướng ngại vật') || nameLower.includes('vcnv')) return 'VCNV';
    if (nameLower.includes('tăng tốc') || nameLower.includes('tang toc')) return 'TANG_TOC';
    if (nameLower.includes('về đích') || nameLower.includes('ve dich')) return 'VE_DICH';
    
    return 'KHOI_DONG';
  };

  // Count questions by 4 competition rounds (Khởi động, VCNV, Tăng tốc, Về đích)
  const roundCounts = useMemo(() => {
    type RoundStats = { total: number; approved: number; pending: number; draft: number };
    const counts: Record<'KHOI_DONG' | 'VCNV' | 'TANG_TOC' | 'VE_DICH', RoundStats> = {
      KHOI_DONG: { total: 0, approved: 0, pending: 0, draft: 0 },
      VCNV: { total: 0, approved: 0, pending: 0, draft: 0 },
      TANG_TOC: { total: 0, approved: 0, pending: 0, draft: 0 },
      VE_DICH: { total: 0, approved: 0, pending: 0, draft: 0 },
    };
    questions.forEach(q => {
      const grp = getQuestionRoundGroup(q);
      const st = q.approval_status || 'APPROVED';
      if (grp === 'KHOI_DONG' || grp === 'VCNV' || grp === 'TANG_TOC' || grp === 'VE_DICH') {
        counts[grp].total++;
        if (st === 'APPROVED') counts[grp].approved++;
        else if (st === 'PENDING_REVIEW') counts[grp].pending++;
        else counts[grp].draft++;
      }
    });
    return counts;
  }, [questions]);

  const totalGameshowQuestions = 
    roundCounts.KHOI_DONG.total + roundCounts.VCNV.total + roundCounts.TANG_TOC.total + roundCounts.VE_DICH.total;

  const handleRoundCardClick = (groupKey: 'KHOI_DONG' | 'VCNV' | 'TANG_TOC' | 'VE_DICH') => {
    vibrateTap();
    soundFx.playClick();
    if (filterRoundGroup === groupKey) {
      setFilterRoundGroup('ALL');
    } else {
      setFilterRoundGroup(groupKey);
      if (activeTab !== 'QUESTIONS') {
        setActiveTab('QUESTIONS');
      }
    }
  };

  // Subscribe to changes in manager
  useEffect(() => {
    const unsub = questionBankManager.subscribe(() => {
      setQuestions(questionBankManager.getQuestions());
      setStats(questionBankManager.getMatrixStats());
      setCurrentUser(questionBankManager.getCurrentUser());
    });
    return () => unsub();
  }, []);

  // Filter & Search logic using fullTextSearchQuestions
  const filteredQuestions = useMemo(() => {
    // Pre-calculate 6x4 matrix cell counts when filtering by matrix deficit / target
    const matrixCellCounts: Record<string, number> = {};
    if (filterMatrixStatus === 'GAP_DEFICIT' || filterMatrixStatus === 'MET_TARGET') {
      questions.forEach(q => {
        const d = q.digital_competency_domain;
        const l = q.cognitive_level || 'THONG_HIEU';
        if (d) {
          const key = `${d}_${l}`;
          matrixCellCounts[key] = (matrixCellCounts[key] || 0) + 1;
        }
      });
    }

    let list = questions.filter(q => {
      if (filterRoundGroup !== 'ALL') {
        const grp = getQuestionRoundGroup(q);
        if (grp !== filterRoundGroup) return false;
      }
      if (filterStage !== 'ALL' && q.stage !== filterStage) return false;
      if (filterFormat !== 'ALL' && q.round_format !== filterFormat) return false;
      
      // Competency Domain Filter
      if (filterDomain !== 'ALL') {
        if (filterDomain === 'UNASSIGNED') {
          if (q.digital_competency_domain) return false;
        } else {
          if (q.digital_competency_domain !== filterDomain) return false;
        }
      }

      // Sub-Competency Filter (1.1 - 6.3)
      if (filterSubCompetency !== 'ALL' && q.digital_sub_competency !== filterSubCompetency) {
        return false;
      }

      // Cognitive / Competency Level Filter
      if (filterLevel !== 'ALL' && q.cognitive_level !== filterLevel) return false;

      // Matrix Coverage Status Filter
      if (filterMatrixStatus !== 'ALL') {
        if (filterMatrixStatus === 'UNASSIGNED') {
          if (q.digital_competency_domain) return false;
        } else if (filterMatrixStatus === 'GAP_EMPTY') {
          // Empty cells have 0 questions
          return false;
        } else if (filterMatrixStatus === 'GAP_DEFICIT') {
          const d = q.digital_competency_domain;
          const l = q.cognitive_level || 'THONG_HIEU';
          if (!d) return true;
          const count = matrixCellCounts[`${d}_${l}`] || 0;
          if (count >= 3) return false;
        } else if (filterMatrixStatus === 'MET_TARGET') {
          const d = q.digital_competency_domain;
          const l = q.cognitive_level || 'THONG_HIEU';
          if (!d) return false;
          const count = matrixCellCounts[`${d}_${l}`] || 0;
          if (count < 3) return false;
        }
      }

      if (filterTopic !== 'ALL' && q.category !== filterTopic) return false;
      
      // Multi-tag vs Single-tag filter
      if (selectedTags.length > 0) {
        const qTags = q.tags || [];
        if (tagMatchMode === 'AND') {
          if (!selectedTags.every(t => qTags.includes(t))) return false;
        } else {
          if (!selectedTags.some(t => qTags.includes(t))) return false;
        }
      } else if (filterTag !== 'ALL' && !(q.tags && q.tags.includes(filterTag))) {
        return false;
      }

      if (filterStatus !== 'ALL' && q.approval_status !== filterStatus) return false;
      return true;
    });

    const searchScoresMap = new Map<string, number>();

    if (searchQuery.trim()) {
      const searchResults = fullTextSearchQuestions(list, searchQuery);
      list = searchResults.map(res => {
        searchScoresMap.set(res.question.id, res.score);
        return res.question;
      });
    }

    const levelWeight: Record<string, number> = {
      'NHAN_BIET': 1,
      'THONG_HIEU': 2,
      'VAN_DUNG': 3,
      'VAN_DUNG_CAO': 4
    };

    return list.sort((a, b) => {
      if (sortBy === 'RELEVANCE' && searchQuery.trim()) {
        const scoreA = searchScoresMap.get(a.id) || 0;
        const scoreB = searchScoresMap.get(b.id) || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
      }
      if (sortBy === 'MANUAL') {
        return 0;
      } else if (sortBy === 'OLDEST') {
        return (a.created_at || 0) - (b.created_at || 0);
      } else if (sortBy === 'DIFFICULTY_ASC') {
        const wa = levelWeight[a.cognitive_level] || 0;
        const wb = levelWeight[b.cognitive_level] || 0;
        return wa - wb;
      } else if (sortBy === 'DIFFICULTY_DESC') {
        const wa = levelWeight[a.cognitive_level] || 0;
        const wb = levelWeight[b.cognitive_level] || 0;
        return wb - wa;
      }
      // Default NEWEST
      return (b.created_at || 0) - (a.created_at || 0);
    });
  }, [
    questions, 
    filterRoundGroup, 
    filterStage, 
    filterFormat, 
    filterDomain, 
    filterSubCompetency,
    filterMatrixStatus,
    filterLevel, 
    filterTopic, 
    filterTag, 
    selectedTags,
    tagMatchMode,
    filterStatus, 
    searchQuery, 
    sortBy
  ]);

  const handleResetAllFilters = () => {
    vibrateTap();
    soundFx.playClick();
    setSearchQuery('');
    setFilterRoundGroup('ALL');
    setFilterLevel('ALL');
    setFilterTopic('ALL');
    setFilterTag('ALL');
    setSelectedTags([]);
    setTagMatchMode('OR');
    setFilterStatus('ALL');
    setFilterDomain('ALL');
    setFilterSubCompetency('ALL');
    setFilterMatrixStatus('ALL');
    setFilterStage('ALL');
    setFilterFormat('ALL');
    setSortBy('NEWEST');
  };

  const handleToggleSelect = (id: string) => {
    vibrateTap();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size > 0 && !isSelectionMode) {
        setIsSelectionMode(true);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    vibrateTap();
    if (selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map(q => q.id)));
      setIsSelectionMode(true);
    }
  };

  const handleClearSelection = () => {
    vibrateTap();
    soundFx.playClick();
    setSelectedIds(new Set());
  };

  const handleSelectAllFiltered = () => {
    vibrateTap();
    soundFx.playClick();
    setSelectedIds(new Set(filteredQuestions.map(q => q.id)));
    setIsSelectionMode(true);
  };

  const handleBatchStatusChange = (status: ApprovalStatus) => {
    if (selectedIds.size === 0) return;
    
    const statusNames: Record<ApprovalStatus, string> = {
      'DRAFT': 'Nháp (Draft)',
      'PENDING_REVIEW': 'Chờ duyệt (Pending Review)',
      'APPROVED': 'Đã duyệt (Approved)',
      'REJECTED': 'Từ chối (Rejected)',
      'NEEDS_REVISION': 'Cần sửa (Needs Revision)'
    };
    
    const ids = Array.from(selectedIds);
    // Tự động phân loại miền năng lực, mức độ nhận thức và gắn thẻ (tags) theo ma trận độ phủ khi batch update trạng thái
    const batchResult = batchClassifyAndTagWithMatrix(ids, status);
    
    setQuestions(questionBankManager.getQuestions());
    setStats(questionBankManager.getMatrixStats());
    
    const deficitInfo = batchResult.deficitFilledCount > 0 
      ? ` (trong đó có ${batchResult.deficitFilledCount} câu bổ sung lấp đầy ô thiếu ma trận)` 
      : '';

    addToast(
      'Cập nhật trạng thái & Tự động gắn thẻ ma trận', 
      `Đã chuyển ${batchResult.processedCount} câu sang "${statusNames[status] || status}". Tự động chuẩn hóa phân loại và gắn ${batchResult.tagsAddedCount} thẻ nhãn theo ma trận độ phủ BTI 2026${deficitInfo}.`, 
      'success'
    );
    vibrateSuccess();
    soundFx.playSuccess();
    
    setSelectedIds(new Set());
  };

  const handleBatchApprove = () => {
    if (selectedIds.size === 0) return;
    vibrateTap();
    handleBatchStatusChange('APPROVED');
  };

  const handleBatchRevert = () => {
    if (selectedIds.size === 0) {
      addToast('Chưa chọn câu hỏi', 'Vui lòng chọn ít nhất 1 câu hỏi để khôi phục phiên bản.', 'warning');
      return;
    }
    vibrateWarning();
    soundFx.playClick();
    
    const result = questionBankManager.batchRevertQuestions(Array.from(selectedIds), 'PREVIOUS');
    if (result.count > 0) {
      soundFx.playCorrect();
      vibrateSuccess();
      setSelectedIds(new Set());
      setQuestions(questionBankManager.getQuestions());
      setStats(questionBankManager.getMatrixStats());
      addToast(
        'Khôi phục thành công',
        `Đã khôi phục ${result.count} câu hỏi về phiên bản liền trước${result.failed > 0 ? ` (${result.failed} câu không có phiên bản cũ)` : ''}.`,
        'success'
      );
    } else {
      addToast(
        'Không có phiên bản cũ',
        'Các câu hỏi đã chọn đang ở phiên bản khởi tạo ban đầu (v1) nên không thể lùi thêm.',
        'warning'
      );
    }
  };

  const handleOpenBulkCategoryModal = () => {
    if (selectedIds.size === 0) {
      addToast('Chưa chọn câu hỏi', 'Vui lòng chọn ít nhất 1 câu hỏi để đổi danh mục / phân loại.', 'warning');
      return;
    }
    vibrateTap();
    soundFx.playClick();
    setShowBulkCategoryModal(true);
  };

  const handleOpenBulkDeleteModal = () => {
    if (selectedIds.size === 0) {
      addToast('Chưa chọn câu hỏi', 'Vui lòng chọn ít nhất 1 câu hỏi để xóa.', 'warning');
      return;
    }
    vibrateTap();
    soundFx.playClick();
    setShowBulkDeleteModal(true);
  };

  const handleBatchAutoTag = async () => {
    if (selectedIds.size === 0) {
      addToast('Chưa chọn câu hỏi', 'Vui lòng chọn ít nhất 1 câu hỏi để tự động gắn thẻ (Auto-Tag).', 'warning');
      return;
    }
    const count = selectedIds.size;
    vibrateTap();
    soundFx.playClick();

    addToast('Đang Auto-Tag AI...', `Đang phân tích và gắn thẻ Gemini AI cho ${count} câu hỏi...`, 'info');

    let updatedCount = 0;
    const selectedQuestions = questions.filter(q => selectedIds.has(q.id));

    for (const q of selectedQuestions) {
      try {
        const res = await generateAutoTagsWithAI({
          questionText: q.question_text || '',
          options: q.options,
          explanation: q.explanation,
          legalReference: q.legal_reference,
          domain: q.digital_competency_domain,
          cognitiveLevel: q.cognitive_level,
          existingTags: q.tags || []
        });

        if (res.suggestedTags && res.suggestedTags.length > 0) {
          const mergedTags = mergeTagsList(q.tags || [], res.suggestedTags).split(',').map(t => t.trim()).filter(Boolean);
          questionBankManager.updateQuestion(q.id, { tags: mergedTags });
          updatedCount++;
        }
      } catch (e) {
        console.warn(`Auto-tag error for question ${q.id}:`, e);
      }
    }

    setQuestions(questionBankManager.getQuestions());
    setStats(questionBankManager.getMatrixStats());
    soundFx.playCorrect();
    vibrateSuccess();
    addToast(
      '✨ Auto-Tag Hoàn Tất',
      `Đã tự động bổ sung thẻ nhãn tìm kiếm bằng AI thành công cho ${updatedCount}/${count} câu hỏi.`,
      'success'
    );
  };

  const handleConfirmBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const deletedCount = questionBankManager.batchDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsSelectionMode(false);
    setShowBulkDeleteModal(false);
    vibrateSuccess();
    soundFx.playCorrect();
    setQuestions(questionBankManager.getQuestions());
    setStats(questionBankManager.getMatrixStats());
    notifyBulkDelete(deletedCount);
    addToast(
      'Đã xóa hàng loạt', 
      `Đã xóa thành công ${deletedCount} câu hỏi khỏi ngân hàng đề.`, 
      'delete'
    );
  };

  const handleExportSelected = () => {
    vibrateTap();
    soundFx.playClick();
    setShowExportModal(true);
  };

  const handlePopulateSampleVcnv = (q: QuestionItem) => {
    vibrateTap();
    soundFx.playClick();
    const sampleOptions = {
      riskQuestion: 'Kỹ thuật sử dụng trí tuệ nhân tạo (AI / Deep Learning) để tổng hợp, hoán đổi hoặc giả mạo hình ảnh, âm thanh, video khuôn mặt và giọng nói của người thật với độ chân thực cực cao là gì?',
      riskAnswer: 'DEEPFAKE',
      clue1: 'Thuật toán học sâu (Deep Learning) sử dụng mạng nơ-ron đối nghịch để tái tạo và tổng hợp khuôn mặt giả mạo có tên viết tắt tiếng Anh là gì?',
      ans1: 'GAN',
      clue2: 'Hành vi sử dụng công nghệ giả mạo hình ảnh, giọng nói nhằm lừa đảo chiếm đoạt tài sản trên không gian mạng vi phạm Luật nào của Việt Nam?',
      ans2: 'AN NINH MANG',
      clue3: 'Hình thức xác thực sinh trắc học nào trên điện thoại thông minh có nguy cơ bị đánh lừa cao nhất khi kẻ xấu sử dụng video Deepfake thời gian thực?',
      ans3: 'KHUON MAT',
      clue4: 'Khi nhận cuộc gọi video có dấu hiệu giật lag, cử động mắt bất thường và yêu cầu chuyển tiền gấp, biện pháp kiểm chứng tức thì an toàn nhất là gì?',
      ans4: 'GOI DIEN LAI',
      centerText: 'Gợi ý Ô Trung Tâm: Công nghệ AI giả mạo tinh vi đang là hiểm họa an toàn thông tin số toàn cầu năm 2026.',
      centerAnswer: 'DEEPFAKE',
      obstacleImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80'
    };
    questionBankManager.updateQuestion(q.id, {
      correct_key: 'DEEPFAKE',
      options: sampleOptions,
      obstacle_info: {
        obstacleKey: 'DEEPFAKE',
        obstacleImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
        explanation: 'Từ khóa Chướng Ngại Vật: DEEPFAKE (8 chữ cái).'
      }
    });
    setQuestions(questionBankManager.getQuestions());
  };

  const getRoundReindexInfo = (groupKey: string) => {
    switch (groupKey) {
      case 'KHOI_DONG':
        return { name: 'Khởi Động', prefix: 'KD', example: 'KD_01, KD_02...', color: 'text-sky-300 border-sky-500/40 bg-sky-500/20 hover:bg-sky-500/30' };
      case 'VCNV':
        return { name: 'VCNV', prefix: 'VCNV', example: 'VCNV_01, VCNV_02...', color: 'text-amber-300 border-amber-500/40 bg-amber-500/20 hover:bg-amber-500/30' };
      case 'TANG_TOC':
        return { name: 'Tăng Tốc', prefix: 'TT', example: 'TT_01, TT_02...', color: 'text-purple-300 border-purple-500/40 bg-purple-500/20 hover:bg-purple-500/30' };
      case 'VE_DICH':
        return { name: 'Về Đích', prefix: 'VD', example: 'VD_01, VD_02...', color: 'text-rose-300 border-rose-500/40 bg-rose-500/20 hover:bg-rose-500/30' };
      case 'VONG_LOAI':
        return { name: 'Vòng Loại', prefix: 'VL', example: 'VL_01, VL_02...', color: 'text-blue-300 border-blue-500/40 bg-blue-500/20 hover:bg-blue-500/30' };
      case 'PHU':
        return { name: 'Câu Hỏi Phụ', prefix: 'PHU', example: 'PHU_01, PHU_02...', color: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30' };
      default:
        return null;
    }
  };

  const handleReindexRound = (groupKey: string) => {
    if (groupKey === 'ALL') return;
    vibrateTap();
    soundFx.playClick();
    const info = getRoundReindexInfo(groupKey);
    if (!info) return;

    const confirmed = confirm(`Bạn có chắc muốn đánh lại mã toàn bộ câu hỏi ${info.name} theo chuẩn (${info.example})?`);
    if (!confirmed) return;

    const result = questionBankManager.reindexRoundQuestions(groupKey as any);
    setQuestions(questionBankManager.getQuestions());
    setStats(questionBankManager.getMatrixStats());
    notifyReindex(info.name, result.reindexedCount, info.prefix);
  };

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Comprehensive Global Keyboard Shortcuts for Question Bank System
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isTyping = Boolean(
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable)
      );

      const isModifier = e.ctrlKey || e.metaKey;

      // 1. ESC KEY HANDLER
      if (e.key === 'Escape') {
        if (activeEl === searchInputRef.current) {
          e.preventDefault();
          setSearchQuery('');
          searchInputRef.current?.blur();
          return;
        }
        if (selectedIds.size > 0) {
          e.preventDefault();
          setSelectedIds(new Set());
          setIsSelectionMode(false);
          vibrateTap();
          soundFx.playClick();
          return;
        }
      }

      // If any modal is open, don't intercept typing or editor shortcuts
      const isModalOpen =
        showAddQuestionModal ||
        showExamModal ||
        showUserModal ||
        showBulkImportModal ||
        showBulkCategoryModal ||
        showBulkDeleteModal ||
        showTagsManagerModal ||
        showCategoriesManagerModal ||
        showPrintPreviewModal ||
        showExportModal ||
        showShortcutsModal ||
        isCompareModalOpen ||
        Boolean(previewQuestion) ||
        Boolean(historyQuestion);

      if (isModalOpen) return;

      // 2. SHORTCUT: Ctrl + K / Cmd + K / ? / F1 -> Open Shortcuts Help Modal
      if ((isModifier && (e.key === 'k' || e.key === 'K')) || (!isTyping && e.key === '?') || e.key === 'F1') {
        e.preventDefault();
        e.stopPropagation();
        vibrateTap();
        soundFx.playClick();
        setShowShortcutsModal(true);
        return;
      }

      // 3. SHORTCUT: Ctrl + N / Cmd + N -> New Question
      if (isModifier && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        e.stopPropagation();
        vibrateTap();
        soundFx.playClick();
        setSelectedQuestion(null);
        setShowAddQuestionModal(true);
        if (activeTab !== 'QUESTIONS') setActiveTab('QUESTIONS');
        return;
      }

      // 4. SHORTCUT: Ctrl + F / Cmd + F / / -> Search Focus
      if ((isModifier && (e.key === 'f' || e.key === 'F')) || (!isTyping && e.key === '/')) {
        e.preventDefault();
        e.stopPropagation();
        if (activeTab !== 'QUESTIONS') setActiveTab('QUESTIONS');
        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 30);
        return;
      }

      // 5. SHORTCUT: Ctrl + P / Cmd + P -> Print Preview A4
      if (isModifier && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        e.stopPropagation();
        vibrateTap();
        soundFx.playClick();
        setShowPrintPreviewModal(true);
        return;
      }

      // 5b. SHORTCUT: Ctrl + E / Cmd + E -> Export Questions (PDF / JSON)
      if (isModifier && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        e.stopPropagation();
        vibrateTap();
        soundFx.playClick();
        setShowExportModal(true);
        return;
      }

      // 6. SHORTCUT: Ctrl + I / Cmd + I -> Bulk Import
      if (isModifier && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        e.stopPropagation();
        vibrateTap();
        soundFx.playClick();
        setShowBulkImportModal(true);
        return;
      }

      // 7. SHORTCUT: Ctrl + G / Cmd + G -> Exam Generator
      if (isModifier && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        e.stopPropagation();
        vibrateTap();
        soundFx.playClick();
        setShowExamModal(true);
        return;
      }

      // 8. SHORTCUT: Ctrl + Shift + T -> Custom Tags Manager
      if (isModifier && e.shiftKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        e.stopPropagation();
        vibrateTap();
        soundFx.playClick();
        setShowTagsManagerModal(true);
        return;
      }

      // 9. SHORTCUT: Ctrl + Shift + M -> Custom Categories Manager
      if (isModifier && e.shiftKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        e.stopPropagation();
        vibrateTap();
        soundFx.playClick();
        setShowCategoriesManagerModal(true);
        return;
      }

      // 10. SHORTCUT: Ctrl + Shift + A -> Select All Filtered Questions
      if (isModifier && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        e.stopPropagation();
        vibrateTap();
        soundFx.playClick();
        const allFilteredIds = new Set(filteredQuestions.map(q => q.id));
        setSelectedIds(allFilteredIds);
        setIsSelectionMode(true);
        addToast(
          'Đã Chọn Tất Cả (Ctrl + Shift + A)',
          `Đã chọn ${allFilteredIds.size} câu hỏi trong bảng`,
          'info'
        );
        return;
      }

      // 11. SHORTCUT: Ctrl + Shift + C -> Bulk Category Change
      if (isModifier && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
        if (selectedIds.size > 0) {
          e.preventDefault();
          e.stopPropagation();
          vibrateTap();
          soundFx.playClick();
          setShowBulkCategoryModal(true);
          return;
        }
      }

      // 12. SHORTCUT: Delete / Ctrl + Shift + D -> Bulk Delete Selected
      if ((!isTyping && e.key === 'Delete') || (isModifier && e.shiftKey && (e.key === 'd' || e.key === 'D'))) {
        if (selectedIds.size > 0) {
          e.preventDefault();
          e.stopPropagation();
          vibrateWarning();
          soundFx.playWarning();
          setShowBulkDeleteModal(true);
          return;
        }
      }

      // 13. SHORTCUT: Alt + V -> Toggle Compact vs Detailed View
      if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        e.stopPropagation();
        vibrateTap();
        soundFx.playClick();
        setViewMode(prev => {
          const next = prev === 'compact' ? 'detailed' : 'compact';
          try {
            localStorage.setItem('bti_qb_view_mode', next);
          } catch {}
          return next;
        });
        return;
      }

      // 13b. SHORTCUT: Alt + H -> Toggle Heatmap View
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        e.stopPropagation();
        vibrateTap();
        soundFx.playClick();
        setViewMode(prev => {
          const next = prev === 'heatmap' ? 'compact' : 'heatmap';
          try {
            localStorage.setItem('bti_qb_view_mode', next);
          } catch {}
          return next;
        });
        return;
      }

      // 14. SHORTCUT: Alt + F -> Toggle Focus Mode
      if (e.altKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        e.stopPropagation();
        vibrateTap();
        soundFx.playClick();
        if (onToggleFocusMode) {
          onToggleFocusMode();
        } else {
          setInternalIsFocusMode(prev => {
            const next = !prev;
            try {
              localStorage.setItem('bti_qb_focus_mode', String(next));
            } catch {}
            return next;
          });
        }
        return;
      }

      // 15. SHORTCUT: Alt + 1-8 -> Switch Main Tabs
      if (e.altKey && !isModifier && !e.shiftKey) {
        const keyNum = parseInt(e.key, 10);
        if (keyNum >= 1 && keyNum <= 8) {
          e.preventDefault();
          vibrateTap();
          soundFx.playClick();
          const mainTabs: MainTab[] = ['OVERVIEW', 'QUESTIONS', 'MODERATION', 'MATRIX', 'SCENARIOS', 'LEGAL_DOCS', 'AI_STUDIO', 'EXCEL_HUB'];
          const targetTab = mainTabs[keyNum - 1];
          if (targetTab) {
            setActiveTab(targetTab);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [
    showAddQuestionModal, showExamModal, showUserModal, showBulkImportModal,
    showBulkCategoryModal, showBulkDeleteModal, showTagsManagerModal,
    showCategoriesManagerModal, showPrintPreviewModal, showExportModal, showShortcutsModal,
    isCompareModalOpen, previewQuestion, historyQuestion, activeTab, selectedIds,
    filteredQuestions
  ]);

  return (
    <div className="space-y-6">
      {/* Focus Mode Workspace Header Bar (Visible when Focus Mode is ON) */}
      {isFocusMode && (
        <div className="p-3 px-4 rounded-[4px] bg-gradient-to-r from-amber-950/80 via-[#241148] to-purple-950/80 border border-amber-500/50 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] bg-amber-400 text-[#190839] flex items-center justify-center font-black text-sm shadow-md">
              <Target className="w-4 h-4 text-[#190839]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-amber-300 font-mono tracking-tight uppercase flex items-center gap-1.5">
                  <span>🎯 CHẾ ĐỘ TẬP TRUNG (FOCUS MODE)</span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/30">MAXIMIZED WORKSPACE</span>
                </h2>
                <span className="text-[11px] text-white/50 font-mono hidden md:inline">• Đã tối đa hóa diện tích làm việc</span>
              </div>
              <p className="text-[11px] text-[#B6A6D8]">
                Đã ẩn thanh điều hướng, biểu đồ &amp; các bảng chức năng phụ. Tập trung hoàn toàn vào danh sách &amp; bộ biên soạn câu hỏi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setSelectedQuestion(null);
                setShowAddQuestionModal(true);
              }}
              className="fluent-btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer rounded-[4px]"
              title="Thêm Câu Hỏi Mới (Ctrl + N)"
            >
              <Plus className="w-3.5 h-3.5 text-[#190839]" />
              <span>Thêm Câu Hỏi</span>
            </button>

            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                if (onToggleFocusMode) onToggleFocusMode();
                else setInternalIsFocusMode(false);
              }}
              className="px-3 py-1.5 rounded-[4px] bg-amber-400 hover:bg-amber-300 text-[#190839] font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-md"
              title="Thoát Chế Độ Tập Trung (Alt + F)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Thoát Focus Mode (Alt+F)</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Banner & User Profile Header (Hidden in Focus Mode) */}
      {!isFocusMode && (
        <div className="fluent-card p-4 sm:p-5 relative overflow-hidden rounded-[4px] shadow-md">
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
            <div className="min-w-[280px] flex-1 space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[4px] bg-theme-accent/15 text-theme-accent text-xs font-mono font-semibold mb-1 border border-theme-accent/30">
                <Layers className="w-3.5 h-3.5 text-theme-accent" />
                <span>Hệ Thống Quản Lý Ngân Hàng Câu Hỏi BTI 2026</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug break-words">
                BEYOND THE INTERNET 2026 • QUESTION BANK SYSTEM
              </h1>
              <p className="text-xs sm:text-sm text-[#B6A6D8] leading-relaxed max-w-3xl">
                Cấu trúc theo chuẩn Khung năng lực số người học (Thông tư 02/2025/TT-BGDĐT), Nghị định 13/2023/NĐ-CP và kịch bản thi đấu BTI 2026.
              </p>
            </div>

            {/* User Persona & Quick Actions Organized in 2 Rows */}
            <div className="flex flex-col gap-2 shrink-0 xl:items-end">
              {/* Row 1: Primary Actions & User Role */}
              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    setShowUserModal(true);
                  }}
                  className="px-3 py-2 bg-[#241148]/80 hover:bg-[#3E1D74]/80 border border-theme-accent/25 hover:border-theme-accent/40 rounded-[4px] flex items-center gap-2.5 transition text-xs cursor-pointer shadow-sm"
                  title="Nhấn để đổi vai trò / xem phân quyền"
                >
                  <div className="w-6 h-6 rounded-[4px] bg-theme-accent text-[#190839] flex items-center justify-center font-bold text-[11px] shadow-sm">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left font-mono">
                    <span className="font-semibold text-slate-100 block text-[11px] leading-tight">{currentUser.name}</span>
                    <span className="text-[10px] text-theme-accent font-mono">{currentUser.role}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#B6A6D8]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    setSelectedQuestion(null);
                    setShowAddQuestionModal(true);
                  }}
                  className="fluent-btn-primary px-3.5 py-2 text-xs flex items-center gap-2 cursor-pointer rounded-[4px]"
                  title="Thêm Câu Hỏi Mới (Ctrl + N)"
                >
                  <Plus className="w-4 h-4 text-[#190839]" />
                  <span>Thêm Câu Hỏi</span>
                  <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/20 text-[#190839] border border-black/20 font-bold ml-0.5">
                    Ctrl+N
                  </kbd>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    setShowBulkImportModal(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer rounded-[4px] shadow-md shadow-emerald-950/40 border border-emerald-400/40 transition"
                  title="Nhập hàng loạt câu hỏi từ file văn bản hoặc copy-paste từ Excel/Sheets"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>Nhập Hàng Loạt (Text/Excel)</span>
                </button>

                <button
                  type="button"
                  onClick={handleImportFromDrive}
                  disabled={isDrivePickerLoading}
                  className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer rounded-[4px] shadow-md shadow-cyan-950/40 border border-cyan-400/40 transition disabled:opacity-50"
                  title="Import from Drive — Mở Google Picker để chọn tệp, bảng tính đề thi hoặc ảnh từ Google Drive"
                  data-testid="import-from-drive-button"
                  aria-label="Import from Drive"
                >
                  <HardDrive className={`w-4 h-4 text-cyan-200 ${isDrivePickerLoading ? 'animate-spin' : ''}`} />
                  <span>Import from Drive</span>
                </button>


                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    setShowGeminiScannerModal(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:via-purple-500 hover:to-indigo-500 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer rounded-[4px] shadow-md shadow-purple-950/40 border border-amber-300/50 transition transform active:scale-95"
                  title="Quét ảnh từ Camera hoặc tải file văn bản để Gemini tự động chuyển đổi thành câu hỏi"
                >
                  <Camera className="w-4 h-4 text-slate-950" />
                  <span>Quét Đề AI (Camera / File)</span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-slate-950/20 text-slate-950 border border-slate-950/20">
                    Gemini 3.8
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    if (onToggleFocusMode) onToggleFocusMode();
                    else setInternalIsFocusMode(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-600/30 via-amber-700/40 to-amber-800/40 hover:from-amber-500/40 hover:to-amber-600/50 border border-amber-500/50 rounded-[4px] flex items-center gap-2 text-xs font-bold text-amber-300 cursor-pointer shadow-sm transition"
                  title="Bật Chế Độ Tập Trung (Focus Mode) (Alt + F)"
                >
                  <Target className="w-4 h-4 text-amber-400" />
                  <span>Focus Mode</span>
                  <kbd className="hidden lg:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-amber-300 border border-amber-400/30 font-bold ml-0.5">
                    Alt+F
                  </kbd>
                </button>
              </div>

              {/* Row 2: Secondary Utilities & Export Tools */}
              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    setShowBtiMatrixQuickPopup(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500/20 via-purple-600/30 to-indigo-600/30 hover:from-amber-500/30 hover:to-indigo-600/40 border border-amber-400/50 rounded-[4px] flex items-center gap-2 text-xs font-bold text-amber-200 cursor-pointer shadow-sm transition"
                  title="Tra cứu nhanh độ phủ Ma trận BTI 2026 (Popup popup)"
                >
                  <Target className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Tra Cứu Ma Trận BTI</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    setShowPrintPreviewModal(true);
                  }}
                  className="fluent-btn-secondary px-3.5 py-2 text-xs flex items-center gap-2 cursor-pointer rounded-[4px]"
                  title="Xem Trước & In A4 (PDF)"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>In / Xem A4</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    setShowExportModal(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-sky-600/30 via-indigo-600/30 to-purple-600/30 hover:from-sky-600/50 hover:to-indigo-600/50 border border-sky-400/50 rounded-[4px] flex items-center gap-2 text-xs font-bold text-sky-200 cursor-pointer shadow-sm transition"
                  title="Xuất Ngân Hàng Câu Hỏi thành tệp PDF hoặc JSON để in ấn và chia sẻ ngoại tuyến (Ctrl + E)"
                >
                  <Download className="w-4 h-4 text-sky-300" />
                  <span>Xuất Đề (PDF • JSON)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    setShowExamModal(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-purple-600/30 hover:from-amber-500/40 hover:to-purple-600/40 border border-amber-400/50 rounded-[4px] flex items-center gap-2 text-xs font-bold text-amber-200 cursor-pointer shadow-sm transition"
                  title="AI Mock Quiz Generator - Tự động tạo đề thi thử cân bằng độ khó & miền tri thức"
                  data-testid="ai-mock-quiz-generator-button"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>AI Mock Quiz Generator</span>
                  <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9.5px] font-mono bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    Auto-Balance
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    setShowTagsManagerModal(true);
                  }}
                  className="fluent-btn-secondary px-3.5 py-2 text-xs flex items-center gap-2 cursor-pointer rounded-[4px]"
                  title="Quản lý Phân loại (Tags)"
                >
                  <Tag className="w-4 h-4 text-purple-400" />
                  <span>Quản Lý Tags</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    setShowDuplicateCheckerModal(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-rose-600/40 via-rose-700/50 to-purple-800/50 hover:from-rose-500/50 hover:to-purple-700/60 border border-rose-500/50 rounded-[4px] flex items-center gap-2 text-xs font-bold text-rose-200 cursor-pointer shadow-sm transition"
                  title="Detect Duplicates - Quét & Xử Lý Câu Hỏi Trùng Lặp bằng AI Gemini"
                  data-testid="detect-duplicates-button"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-300" />
                  <span>Detect Duplicates AI</span>
                  <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9.5px] font-mono bg-rose-500/20 text-rose-300 border border-rose-400/30">
                    Gemini 3.8
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    setShowShortcutsModal(true);
                  }}
                  className="fluent-btn-secondary px-3.5 py-2 text-xs flex items-center gap-2 cursor-pointer rounded-[4px] border border-purple-500/40 text-purple-200 hover:text-white hover:bg-purple-600/30 transition"
                  title="Mở Bảng Ánh Xạ & Cấu Hình Phím Tắt [Ctrl + K / ? / F1]"
                >
                  <Keyboard className="w-4 h-4 text-purple-300 animate-pulse" />
                  <span>Phím Tắt</span>
                  <kbd className="hidden lg:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-purple-300 border border-purple-400/30 font-bold ml-0.5">
                    Ctrl+K
                  </kbd>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editorial Keyboard Shortcuts Bar (Hidden in Focus Mode) */}
      {!isFocusMode && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2 rounded-[4px] bg-[#190839]/90 border border-theme-accent/25 text-xs text-[#B6A6D8] shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-amber-300 flex items-center gap-1.5 text-[11px]">
              <Keyboard className="w-4 h-4 text-amber-400" />
              <span>PHÍM TẮT BIÊN TẬP:</span>
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
              <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-theme-accent border border-theme-accent/30 font-bold shadow-sm">Ctrl + N</kbd>
              <span className="text-slate-300">Thêm mới</span>
            </span>
            <span className="text-white/20">•</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
              <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-amber-300 border border-amber-500/30 font-bold shadow-sm">Ctrl + F / /</kbd>
              <span className="text-slate-300">Tìm kiếm</span>
            </span>
            <span className="text-white/20">•</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
              <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-emerald-300 border border-emerald-500/30 font-bold shadow-sm">Ctrl + P</kbd>
              <span className="text-slate-300">In A4</span>
            </span>
            <span className="text-white/20">•</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
              <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-indigo-300 border border-indigo-500/30 font-bold shadow-sm">Ctrl + Shift + A</kbd>
              <span className="text-slate-300">Chọn tất cả</span>
            </span>
            <span className="text-white/20">•</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
              <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-slate-300 border border-white/20 font-bold shadow-sm">Esc</kbd>
              <span className="text-slate-300">Bỏ chọn / Đóng</span>
            </span>
            <span className="text-white/20">•</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
              <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-amber-300 border border-amber-500/30 font-bold shadow-sm">Alt + F</kbd>
              <span className="text-slate-300">Focus Mode</span>
            </span>
            <span className="text-white/20">•</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
              <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-emerald-300 border border-emerald-500/30 font-bold shadow-sm">Alt + V</kbd>
              <span className="text-slate-300">Xem Compact / Chi Tiết</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              setShowShortcutsModal(true);
            }}
            className="px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/40 text-[11px] font-mono font-bold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
          >
            <Keyboard className="w-3.5 h-3.5 text-purple-300" />
            <span>Tất cả phím tắt [Ctrl + K]</span>
          </button>
        </div>
      )}

      {/* Unsaved IndexedDB Draft Resume Alert Banner */}
      {unsavedIndexedDbDraft && !showAddQuestionModal && (
        <div className="p-3 sm:p-3.5 rounded-[6px] bg-gradient-to-r from-amber-950/90 via-[#2e150a] to-amber-950/90 border-2 border-amber-500/70 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-[4px] bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow">
              <Database className="w-4 h-4 text-slate-950 animate-pulse" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap font-mono">
                <span className="font-bold text-amber-200">
                  ⚡ Bạn có bản nháp câu hỏi chưa lưu trong IndexedDB:
                </span>
                <span className="px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
                  {questionDraftService.formatFriendlyTime(unsavedIndexedDbDraft.savedAt)}
                </span>
              </div>
              <p className="text-[11px] text-amber-100/90 font-sans truncate max-w-xl">
                {unsavedIndexedDbDraft.titleSnippet ? `"${unsavedIndexedDbDraft.titleSnippet}"` : 'Bản nháp đang soạn thảo dở dang'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 font-mono">
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playCorrect();
                setSelectedQuestion(null);
                setShowAddQuestionModal(true);
              }}
              className="px-3.5 py-1.5 rounded-[4px] bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-bold flex items-center gap-1.5 transition cursor-pointer shadow active:scale-95 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
              <span>Tiếp Tục Soạn Thảo (Resume)</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                vibrateTap();
                soundFx.playClick();
                await questionDraftService.clearDraftFromIndexedDB('new');
                setUnsavedIndexedDbDraft(null);
                addToast('Đã xóa bản nháp', 'Bản nháp IndexedDB đã được dọn sạch.', 'info');
              }}
              className="px-2.5 py-1.5 rounded-[4px] bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer border border-white/15"
              title="Xóa bỏ bản nháp này"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
            </button>
          </div>
        </div>
      )}

      {/* Fluent 2 Pivot Navigation Tabs (Hidden in Focus Mode) */}
      {!isFocusMode && (
        <div className="bg-[#241148]/60 p-1 rounded-[4px] border border-theme-accent/20 flex overflow-x-auto gap-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              setActiveTab('OVERVIEW');
            }}
            className={`px-3.5 py-2 rounded-[4px] text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-theme-accent text-[#190839] shadow-md shadow-theme-accent/20 font-bold'
                : 'text-[#F5EFF9]/75 hover:text-white hover:bg-white/10'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Tổng Quan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              setActiveTab('QUESTIONS');
            }}
            className={`px-3.5 py-2 rounded-[4px] text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'QUESTIONS'
                ? 'bg-theme-accent text-[#190839] shadow-md shadow-theme-accent/20 font-bold'
                : 'text-[#F5EFF9]/75 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kho Câu Hỏi</span>
            <span className={`px-1.5 py-0.2 rounded-[2px] text-[10px] font-mono ${
              activeTab === 'QUESTIONS' ? 'bg-[#190839]/20 text-[#190839] font-bold' : 'bg-[#190839]/60 text-[#B6A6D8]'
            }`}>
              {questions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              setActiveTab('MODERATION');
            }}
            className={`px-3.5 py-2 rounded-[4px] text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'MODERATION'
                ? 'bg-theme-accent text-[#190839] shadow-md shadow-theme-accent/20 font-bold'
                : 'text-[#F5EFF9]/75 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Kiểm Duyệt</span>
          </button>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              setActiveTab('AI_STUDIO');
            }}
            className={`px-3.5 py-2 rounded-[4px] text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'AI_STUDIO'
                ? 'bg-theme-accent text-[#190839] shadow-md shadow-theme-accent/20 font-bold'
                : 'text-[#F5EFF9]/75 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Soạn Thảo Bằng AI</span>
          </button>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              setActiveTab('EXCEL_HUB');
            }}
            className={`px-3.5 py-2 rounded-[4px] text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'EXCEL_HUB'
                ? 'bg-theme-accent text-[#190839] shadow-md shadow-theme-accent/20 font-bold'
                : 'text-[#F5EFF9]/75 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Mẫu Excel Phần Mềm Thi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              setActiveTab('SCENARIOS');
            }}
            className={`px-3.5 py-2 rounded-[4px] text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'SCENARIOS'
                ? 'bg-theme-accent text-[#190839] shadow-md shadow-theme-accent/20 font-bold'
                : 'text-[#F5EFF9]/75 hover:text-white hover:bg-white/10'
            }`}
          >
            <Theater className="w-4 h-4 text-purple-400" />
            <span>Kịch Tương Tác</span>
            <span className={`px-1.5 py-0.2 rounded-[2px] text-[10px] font-mono ${
              activeTab === 'SCENARIOS' ? 'bg-[#190839]/20 text-[#190839] font-bold' : 'bg-[#190839]/60 text-[#B6A6D8]'
            }`}>
              {stats.scenariosCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              setActiveTab('LEGAL_DOCS');
            }}
            className={`px-3.5 py-2 rounded-[4px] text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'LEGAL_DOCS'
                ? 'bg-theme-accent text-[#190839] shadow-md shadow-theme-accent/20 font-bold'
                : 'text-[#F5EFF9]/75 hover:text-white hover:bg-white/10'
            }`}
          >
            <Scale className="w-4 h-4 text-amber-400" />
            <span>Thư Viện Pháp Lý</span>
            <span className={`px-1.5 py-0.2 rounded-[2px] text-[10px] font-mono ${
              activeTab === 'LEGAL_DOCS' ? 'bg-[#190839]/20 text-[#190839] font-bold' : 'bg-[#190839]/60 text-[#B6A6D8]'
            }`}>
              {stats.documentsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              setActiveTab('MATRIX');
            }}
            className={`px-3.5 py-2 rounded-[4px] text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'MATRIX'
                ? 'bg-theme-accent text-[#190839] shadow-md shadow-theme-accent/20 font-bold'
                : 'text-[#F5EFF9]/75 hover:text-white hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-theme-accent" />
            <span>Ma Trận &amp; Biểu Đồ Độ Phủ BTI</span>
          </button>
        </div>
      )}

      {/* TAB 0: OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <QuestionBankOverviewTab
          questions={questions}
          stats={stats}
          onNavigateTab={(tab) => {
            vibrateTap();
            soundFx.playClick();
            setActiveTab(tab);
          }}
          onFilterRound={(r) => {
            setFilterRoundGroup(r);
            setActiveTab('QUESTIONS');
          }}
          onFilterLevel={(lvl) => {
            setFilterLevel(lvl);
            setActiveTab('QUESTIONS');
          }}
          onFilterDomain={(dom) => {
            setFilterDomain(dom);
            setActiveTab('QUESTIONS');
          }}
          onFilterStatus={(st) => {
            setFilterStatus(st);
            setActiveTab('QUESTIONS');
          }}
          onOpenAddQuestion={() => {
            setSelectedQuestion(null);
            setShowAddQuestionModal(true);
          }}
          onOpenBulkImport={() => {
            setShowBulkImportModal(true);
          }}
          onOpenExamGenerator={() => {
            setShowExamModal(true);
          }}
          onOpenDuplicateChecker={() => {
            setShowDuplicateCheckerModal(true);
          }}
        />
      )}

      {/* TAB 1: QUESTIONS REPOSITORY */}
      {activeTab === 'QUESTIONS' && (
        <div className="space-y-4">
          {/* Dashboard Overview Header Section (Visual Recharts Composition - Hidden in Focus Mode) */}
          {!isFocusMode && (
            <DashboardOverviewHeader
              questions={questions}
              currentFilterLevel={filterLevel}
              currentFilterStatus={filterStatus}
              currentFilterRoundGroup={filterRoundGroup}
              onFilterLevel={(lvl) => setFilterLevel(lvl)}
              onFilterStatus={(st) => setFilterStatus(st)}
              onFilterRoundGroup={(r) => setFilterRoundGroup(r)}
              onResetFilters={handleResetAllFilters}
              defaultExpanded={true}
            />
          )}

          {/* Active Round Filter Banner */}
          {filterRoundGroup !== 'ALL' && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 px-3.5 rounded-[5px] bg-theme-accent/10 border border-theme-accent/30 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#B6A6D8]">Đang lọc theo phần thi:</span>
                <span className="font-bold text-theme-accent font-mono flex items-center gap-1.5">
                  {filterRoundGroup === 'KHOI_DONG' && <><Zap className="w-3.5 h-3.5 text-sky-400" /> 1. Khởi Động</>}
                  {filterRoundGroup === 'VCNV' && <><Layers className="w-3.5 h-3.5 text-amber-400" /> 2. Vượt Chướng Ngại Vật (VCNV)</>}
                  {filterRoundGroup === 'TANG_TOC' && <><Rocket className="w-3.5 h-3.5 text-purple-400" /> 3. Tăng Tốc</>}
                  {filterRoundGroup === 'VE_DICH' && <><Flag className="w-3.5 h-3.5 text-rose-400" /> 4. Về Đích</>}
                  {filterRoundGroup === 'VONG_LOAI' && <>Vòng Loại Bộ GD&ĐT (28 câu)</>}
                  {filterRoundGroup === 'PHU' && <>5. Câu Hỏi Phụ (Tie-breaker)</>}
                </span>
                <span className="text-[#B6A6D8] font-mono">({filteredQuestions.length} câu)</span>
              </div>

              <div className="flex items-center gap-2">
                {getRoundReindexInfo(filterRoundGroup) && (
                  <button
                    type="button"
                    onClick={() => handleReindexRound(filterRoundGroup)}
                    className={`px-2.5 py-1 border rounded-[4px] text-[11px] font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer ${getRoundReindexInfo(filterRoundGroup)?.color}`}
                    title={`Đánh lại mã toàn bộ câu hỏi phần thi này (${getRoundReindexInfo(filterRoundGroup)?.example})`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Đánh lại mã ({getRoundReindexInfo(filterRoundGroup)?.prefix}_01...)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    setFilterRoundGroup('ALL');
                  }}
                  className="px-2.5 py-1 rounded-[4px] bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 cursor-pointer transition text-[11px] font-mono"
                >
                  <X className="w-3 h-3" />
                  <span>Xem tất cả câu hỏi</span>
                </button>
              </div>
            </div>
          )}

          {/* Enhanced Search & Filter Bar */}
          <QuestionBankFilterBar
            questions={questions}
            filteredCount={filteredQuestions.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchInputRef={searchInputRef}
            filterRoundGroup={filterRoundGroup}
            onRoundGroupChange={setFilterRoundGroup}
            filterLevel={filterLevel}
            onLevelChange={setFilterLevel}
            filterTopic={filterTopic}
            onTopicChange={setFilterTopic}
            onManageCategoriesClick={() => setShowCategoriesManagerModal(true)}
            filterTag={filterTag}
            onTagChange={setFilterTag}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            tagMatchMode={tagMatchMode}
            onTagMatchModeChange={setTagMatchMode}
            onManageTagsClick={() => setShowTagsManagerModal(true)}
            filterStatus={filterStatus}
            onStatusChange={setFilterStatus}
            sortBy={sortBy}
            onSortChange={setSortBy}
            filterDomain={filterDomain}
            onDomainChange={setFilterDomain}
            filterSubCompetency={filterSubCompetency}
            onSubCompetencyChange={setFilterSubCompetency}
            filterMatrixStatus={filterMatrixStatus}
            onMatrixStatusChange={setFilterMatrixStatus}
            onOpenAddQuestionForSlot={(dKey, lvl) => {
              setEditorInitialDomain(dKey);
              setFilterLevel(lvl);
              setSelectedQuestion(null);
              setShowAddQuestionModal(true);
            }}
            onNavigateToFullMatrix={() => setActiveTab('MATRIX')}
            filterStage={filterStage}
            onStageChange={setFilterStage}
            onResetAllFilters={handleResetAllFilters}
          />

          {/* DEDICATED BULK ACTION TOOLBAR (Accessible whenever questions are available) */}
          {filteredQuestions.length > 0 && (
            <BulkActionToolbar
              totalCount={questions.length}
              filteredCount={filteredQuestions.length}
              selectedCount={selectedIds.size}
              isAllSelected={selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0}
              isSelectionMode={isSelectionMode}
              onToggleSelectionMode={handleToggleSelectionMode}
              onExitSelectionMode={handleExitSelectionMode}
              onToggleSelectAll={handleSelectAllVisible}
              onSelectAllFiltered={handleSelectAllFiltered}
              onClearSelection={handleClearSelection}
              onDeleteSelected={handleOpenBulkDeleteModal}
              onChangeCategory={handleOpenBulkCategoryModal}
              onBatchApprove={handleBatchApprove}
              onBatchRevert={handleBatchRevert}
              onBatchAutoTag={handleBatchAutoTag}
              onBatchDifficultySuggest={() => setShowDifficultyBatchModal(true)}
              onDetectDuplicates={() => setShowDuplicateCheckerModal(true)}
              onChangeStatus={handleBatchStatusChange}
              onExportSelected={handleExportSelected}
              onCompareSelected={() => setIsCompareModalOpen(true)}
              onPrintSelected={() => {
                vibrateTap();
                soundFx.playClick();
                setShowPrintPreviewModal(true);
              }}
              currentRoundName={filterRoundGroup !== 'ALL' ? getRoundReindexInfo(filterRoundGroup)?.name : undefined}
              canApprove={true}
              canDelete={true}
            />
          )}

          {/* Unified Compact Control & Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-[4px] bg-[#190839]/90 border border-theme-accent/25 text-xs font-mono shadow-sm">
            {/* Left side: View switcher, selection mode, drag-drop, item count */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* View Mode Switcher */}
              <div className="inline-flex rounded-[3px] bg-[#241148] p-0.5 border border-theme-accent/25">
                <button
                  type="button"
                  onClick={() => handleSwitchViewMode('compact')}
                  className={`px-2.5 py-1 rounded-[2px] text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                    viewMode === 'compact'
                      ? 'bg-theme-accent text-[#190839] shadow-sm'
                      : 'text-[#B6A6D8] hover:text-white hover:bg-white/5'
                  }`}
                  title="Bảng Rút Gọn (Compact View) - Hiển thị gọn nhiều câu trên màn hình (Alt + V)"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Bảng Gọn</span>
                  <span className={`px-1 py-0.2 rounded text-[9px] font-mono ${viewMode === 'compact' ? 'bg-[#190839]/25 text-[#190839] font-black' : 'bg-black/40 text-slate-400'}`}>
                    {filteredQuestions.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchViewMode('detailed')}
                  className={`px-2.5 py-1 rounded-[2px] text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                    viewMode === 'detailed'
                      ? 'bg-theme-accent text-[#190839] shadow-sm'
                      : 'text-[#B6A6D8] hover:text-white hover:bg-white/5'
                  }`}
                  title="Chế độ Thẻ Chi Tiết (Detailed View) (Alt + V)"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>Thẻ Chi Tiết</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchViewMode('heatmap')}
                  className={`px-2.5 py-1 rounded-[2px] text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    viewMode === 'heatmap'
                      ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-[#190839] shadow-sm font-black'
                      : 'text-amber-300/80 hover:text-amber-200 hover:bg-white/5'
                  }`}
                  title="Chế độ xem Ma Trận Độ Phủ trực quan Heatmap 2D (Alt + H)"
                >
                  <Grid className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ma Trận Heatmap</span>
                  <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-amber-950/60 text-amber-300 border border-amber-400/40">
                    2D
                  </span>
                </button>
              </div>

              {/* Selection Mode Toggle */}
              <button
                type="button"
                onClick={handleToggleSelectionMode}
                className={`px-2.5 py-1 rounded-[3px] text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                  isSelectionMode
                    ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-300 shadow-sm'
                    : 'bg-[#241148] hover:bg-[#2e155b] text-[#B6A6D8] hover:text-white border border-theme-accent/25'
                }`}
                title="Bật/Tắt chế độ chọn nhiều câu hỏi"
              >
                <CheckSquare className={`w-3.5 h-3.5 ${isSelectionMode ? 'text-slate-950' : 'text-theme-accent'}`} />
                <span>{isSelectionMode ? `Chọn (${selectedIds.size})` : 'Chọn nhiều'}</span>
                {selectedIds.size > 0 && !isSelectionMode && (
                  <span className="px-1 py-0.2 rounded bg-theme-accent text-[#190839] text-[9px] font-bold">
                    {selectedIds.size}
                  </span>
                )}
              </button>

              {/* Drag and Drop Lock/Unlock */}
              <button
                type="button"
                onClick={handleToggleDragDrop}
                className={`px-2 py-1 rounded-[3px] text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                  isDragDropEnabled
                    ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-300 animate-pulse'
                    : 'bg-[#241148] hover:bg-[#2e155b] text-[#B6A6D8] hover:text-white border border-theme-accent/25'
                }`}
                title={isDragDropEnabled ? 'Kéo thả đang BẬT: Nhấn để Khóa' : 'Kéo thả đang KHÓA: Nhấn để Mở khóa sắp xếp'}
              >
                {isDragDropEnabled ? (
                  <Unlock className="w-3.5 h-3.5 text-slate-950" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="hidden sm:inline">{isDragDropEnabled ? 'Kéo: Mở' : 'Kéo: Khóa'}</span>
              </button>

              {/* Compact table expand/collapse all */}
              {viewMode === 'compact' && filteredQuestions.length > 0 && (
                <div className="flex items-center gap-1 border-l border-white/10 pl-1.5">
                  <button
                    type="button"
                    onClick={handleExpandAllCompact}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[10px] flex items-center gap-1 transition cursor-pointer"
                    title="Mở rộng tất cả dòng"
                  >
                    <Maximize2 className="w-3 h-3 text-theme-accent" />
                    <span className="hidden md:inline">Mở rộng</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCollapseAllCompact}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[10px] flex items-center gap-1 transition cursor-pointer"
                    title="Thu gọn tất cả dòng"
                  >
                    <Minimize2 className="w-3 h-3 text-slate-400" />
                    <span className="hidden md:inline">Thu gọn</span>
                  </button>
                </div>
              )}

              {/* Count indicator */}
              <span className="text-[11px] text-[#B6A6D8] pl-1 hidden lg:inline">
                ({filteredQuestions.length}/{questions.length} câu)
              </span>
            </div>

            {/* Right side: Primary Creation & AI actions */}
            <div className="flex items-center gap-1.5 flex-wrap ml-auto">
              {filterRoundGroup !== 'ALL' && getRoundReindexInfo(filterRoundGroup) && (
                <button
                  type="button"
                  onClick={() => handleReindexRound(filterRoundGroup)}
                  className={`px-2 py-1 border rounded-[3px] text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ${getRoundReindexInfo(filterRoundGroup)?.color}`}
                  title={`Đánh lại mã (${getRoundReindexInfo(filterRoundGroup)?.example})`}
                >
                  <Layers className="w-3 h-3" />
                  <span className="hidden md:inline">Đánh lại mã</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setShowDuplicateCheckerModal(true);
                }}
                className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/45 border border-rose-400/50 text-rose-300 hover:text-white rounded-[3px] text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shadow-sm active:scale-95"
                title="Quét phát hiện câu hỏi trùng lặp & trùng lặp miền tri thức bằng AI Gemini"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
                <span className="hidden sm:inline">Detect Duplicates AI</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setShowDifficultyBatchModal(true);
                }}
                className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/45 border border-amber-400/50 text-amber-300 hover:text-white rounded-[3px] text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shadow-sm active:scale-95"
                title="Gợi ý & chuẩn hóa độ khó tự động cho câu hỏi bằng phân tích độ phức tạp ngữ nghĩa đối chiếu ngân hàng đề"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">🎯 Advisor Độ Khó</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setShowBulkImportModal(true);
                }}
                className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/45 border border-emerald-400/50 text-emerald-300 hover:text-white rounded-[3px] text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shadow-sm active:scale-95"
                title="Nhập câu hỏi hàng loạt từ tệp CSV, JSON, Excel hoặc Google Drive"
              >
                <Download className="w-3.5 h-3.5 rotate-180 text-emerald-400" />
                <span className="hidden sm:inline">Nhập CSV / JSON</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setShowExportModal(true);
                }}
                className="px-2.5 py-1 bg-sky-600/30 hover:bg-sky-600/45 border border-sky-400/50 text-sky-300 hover:text-white rounded-[3px] text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shadow-sm active:scale-95"
                title="Xuất đề thi dạng PDF hoặc JSON (Ctrl + E)"
              >
                <Download className="w-3.5 h-3.5 text-sky-300" />
                <span className="hidden sm:inline">Xuất PDF/JSON</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setShowPrintPreviewModal(true);
                }}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 text-amber-300 hover:text-white rounded-[3px] text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shadow-sm active:scale-95"
                title="Mở giao diện In A4 / Xem trước bản in đề thi chuẩn"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">In A4 (Preview)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setSelectedQuestion(null);
                  setShowAddQuestionModal(true);
                }}
                className="px-2.5 py-1 bg-gradient-to-r from-purple-600/30 to-pink-500/30 hover:from-purple-600/50 hover:to-pink-500/50 border border-theme-accent/50 text-theme-accent hover:text-white rounded-[3px] text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shadow-sm active:scale-95"
                title="Mở soạn câu hỏi bằng Gemini AI"
              >
                <Sparkles className="w-3 h-3 text-theme-accent animate-pulse" />
                <span>⚡ Soạn AI</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setSelectedQuestion(null);
                  setShowAddQuestionModal(true);
                }}
                className="fluent-btn-primary px-3 py-1 text-[11px] flex items-center gap-1 cursor-pointer font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition rounded-[3px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm Câu Hỏi</span>
              </button>
            </div>
          </div>

          {/* Drag and Drop Active Banner */}
          {isDragDropEnabled && (
            <div className="mb-3 px-4 py-2.5 rounded-[4px] bg-amber-500/15 border border-amber-500/40 flex items-center justify-between gap-3 text-xs text-amber-200 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-2">
                <Unlock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Đang mở khóa kéo thả:</strong> Bạn có thể giữ biểu tượng <GripVertical className="inline w-3.5 h-3.5 text-amber-400 -mt-0.5" /> hoặc kéo thả thẻ câu hỏi để thay đổi thứ tự sắp xếp tùy chỉnh.
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleDragDrop}
                className="px-2.5 py-1 rounded-[3px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shrink-0 flex items-center gap-1 cursor-pointer transition shadow-sm"
                title="Khóa kéo thả lại"
              >
                <Lock className="w-3 h-3 text-slate-950" />
                <span>Khóa lại</span>
              </button>
            </div>
          )}

          {/* Questions Grid / List (Compact Table OR Detailed Cards) */}
          {filteredQuestions.length === 0 ? (
            <QuestionBankEmptyState
              filterRoundGroup={filterRoundGroup}
              filterTopic={filterTopic}
              filterDomain={filterDomain}
              filterSubCompetency={filterSubCompetency}
              filterMatrixStatus={filterMatrixStatus}
              filterStage={filterStage}
              filterLevel={filterLevel}
              searchQuery={searchQuery}
              totalQuestionsCount={questions.length}
              onAddQuestion={() => {
                setSelectedQuestion(null);
                setEditorInitialRound(filterRoundGroup !== 'ALL' ? filterRoundGroup : undefined);
                setEditorInitialDomain(filterDomain !== 'ALL' ? filterDomain : undefined);
                setShowAddQuestionModal(true);
              }}
              onOpenAIStudio={() => {
                vibrateTap();
                soundFx.playClick();
                setActiveTab('AI_STUDIO');
              }}
              onImportExcel={() => {
                vibrateTap();
                soundFx.playClick();
                setActiveTab('EXCEL_HUB');
              }}
              onScanCamera={() => {
                vibrateTap();
                soundFx.playClick();
                setShowGeminiScannerModal(true);
              }}
              onResetFilters={handleResetAllFilters}
            />
          ) : viewMode === 'heatmap' ? (
            /* HEATMAP COVERAGE MATRIX VIEW */
            <BtiQuestionCoverageHeatmapView
              questions={questions}
              onFilterMatrixCell={(domain, level, category) => {
                vibrateTap();
                soundFx.playClick();
                if (category) {
                  setFilterTopic(category);
                } else if (domain) {
                  setFilterDomain(domain);
                }
                if (level) {
                  setFilterLevel(level);
                }
                setViewMode('compact');
                addToast('Đã lọc câu hỏi theo ô ma trận', `Đang hiển thị các câu hỏi thuộc ô ${domain || category} - ${level}`, 'info');
              }}
              onOpenAddQuestion={(prefill) => {
                vibrateTap();
                soundFx.playClick();
                if (prefill.domain) setEditorInitialDomain(prefill.domain);
                setSelectedQuestion(null);
                setShowAddQuestionModal(true);
              }}
              onNavigateToAIStudio={(prefill) => {
                vibrateTap();
                soundFx.playClick();
                if (prefill.domain) setFilterDomain(prefill.domain);
                if (prefill.level) setFilterLevel(prefill.level);
                setActiveTab('AI_STUDIO');
              }}
              onSwitchToListView={() => handleSwitchViewMode('compact')}
              currentFilterDomain={filterDomain}
              currentFilterLevel={filterLevel}
            />
          ) : viewMode === 'compact' ? (
            /* COMPACT HIGH-DENSITY TABLE VIEW */
            <div className="fluent-card overflow-hidden border border-theme-accent/25 rounded-[4px] shadow-lg bg-[#190839]">
              {/* Table Header */}
              <div className="bg-[#241148] border-b border-theme-accent/25 px-3 py-2 text-[11px] font-mono font-bold text-[#B6A6D8] grid grid-cols-12 gap-2 items-center select-none sticky top-0 z-10 shadow-sm">
                <div className="col-span-3 sm:col-span-2 md:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0}
                    onChange={handleSelectAllVisible}
                    className="w-3.5 h-3.5 rounded-[2px] bg-[#190839] border-theme-accent/30 text-theme-accent accent-theme-accent focus:ring-0 cursor-pointer"
                    title="Chọn tất cả câu hỏi trong danh sách lọc"
                    data-testid="compact-select-all-checkbox"
                    aria-label="Chọn tất cả câu hỏi trong danh sách"
                  />
                  <span>MÃ CÂU</span>
                </div>
                <div className="col-span-2 hidden md:block">PHẦN THI / VÒNG</div>
                <div className="col-span-2 hidden lg:block">MIỀN NL &amp; MỨC ĐỘ</div>
                <div className="col-span-9 sm:col-span-6 md:col-span-5 lg:col-span-3">NỘI DUNG CÂU HỎI</div>
                <div className="col-span-2 hidden sm:block text-center">ĐÁP ÁN ĐÚNG</div>
                <div className="col-span-1 hidden xl:block text-center">TRẠNG THÁI</div>
                <div className="col-span-3 sm:col-span-2 md:col-span-1 text-right pr-1">THAO TÁC</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-white/5">
                {filteredQuestions.map((q, idx) => {
                  const isSelected = selectedIds.has(q.id);
                  const isExpanded = expandedCompactIds.has(q.id);
                  const roundGrp = getQuestionRoundGroup(q);
                  const isVcnv = roundGrp === 'VCNV' || q.round_type === 'VCNV' || Boolean(q.round_format?.includes('VCNV')) || Boolean(q.options && ('clue1' in q.options || 'obstacleImage' in q.options));
                  const isTrueFalse4 = q.round_type === 'TRUE_FALSE_4' || q.round_format === 'BGD_TRUE_FALSE_4';

                  return (
                    <div 
                      key={q.id}
                      draggable={isDragDropEnabled}
                      onDragStart={(e) => handleDragStart(e, q.id)}
                      onDragOver={(e) => handleDragOver(e, q.id)}
                      onDragLeave={(e) => handleDragLeave(e, q.id)}
                      onDrop={(e) => handleDrop(e, q.id)} 
                      className={`transition-colors ${
                        isDragDropEnabled ? 'cursor-grab active:cursor-grabbing' : ''
                      } ${
                        isSelected 
                          ? 'bg-[#3E1D74]/40 border-l-2 border-l-theme-accent' 
                          : idx % 2 === 0 
                            ? 'bg-transparent hover:bg-[#241148]/70' 
                            : 'bg-white/[0.015] hover:bg-[#241148]/70'
                      } ${
                        dragOverId === q.id ? 'border-y-2 border-fuchsia-400 opacity-80 bg-fuchsia-950/30' : ''
                      } ${
                        draggedId === q.id ? 'opacity-30' : ''
                      }`}
                    >
                      {/* Compact Row */}
                      <div 
                        onClick={() => {
                          if (isSelectionMode) {
                            handleToggleSelect(q.id);
                          } else {
                            handleToggleExpandCompact(q.id);
                          }
                        }}
                        className={`px-3 py-2 text-xs grid grid-cols-12 gap-2 items-center cursor-pointer select-none group transition-colors ${
                          isSelectionMode && isSelected
                            ? 'bg-[#3E1D74]/70 ring-1 ring-theme-accent/50'
                            : ''
                        }`}
                      >
                        {/* Drag Handle + Checkbox + Caret + ID */}
                        <div className="col-span-3 sm:col-span-2 md:col-span-2 flex items-center gap-1.5 font-mono" onClick={e => e.stopPropagation()}>
                          {isDragDropEnabled && (
                            <span className="text-amber-400 hover:text-amber-300 cursor-grab active:cursor-grabbing shrink-0" title="Kéo thả để sắp xếp">
                              <GripVertical className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(q.id)}
                            className={`rounded-[3px] bg-[#190839] border-theme-accent/40 text-theme-accent accent-theme-accent focus:ring-0 cursor-pointer shrink-0 transition-transform ${
                              isSelectionMode ? 'w-4 h-4 ring-1 ring-theme-accent/70' : 'w-3.5 h-3.5'
                            }`}
                            data-testid={`compact-checkbox-${q.id}`}
                            aria-label={`Chọn câu hỏi ${q.id}`}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleExpandCompact(q.id);
                            }}
                            className="p-0.5 text-slate-400 hover:text-theme-accent transition cursor-pointer shrink-0"
                            title={isExpanded ? 'Thu gọn' : 'Xem chi tiết câu hỏi'}
                          >
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-theme-accent' : 'text-slate-400'}`} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(q.id, e)}
                            className="font-bold text-theme-accent hover:text-white hover:underline text-[11px] truncate flex items-center gap-1 cursor-pointer"
                            title="Bấm để sao chép mã câu hỏi"
                          >
                            <span className="truncate">{q.id}</span>
                            {copiedId === q.id ? (
                              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-slate-500 opacity-0 group-hover:opacity-100 transition shrink-0" />
                            )}
                          </button>
                        </div>

                        {/* Round / Format */}
                        <div className="col-span-2 hidden md:flex items-center gap-1.5 truncate">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[3px] border truncate ${
                            isVcnv ? 'bg-amber-950/40 text-amber-300 border-amber-500/30' :
                            q.id.startsWith('KD') ? 'bg-sky-950/40 text-sky-300 border-sky-500/30' :
                            q.id.startsWith('TT') ? 'bg-purple-950/40 text-purple-300 border-purple-500/30' :
                            q.id.startsWith('VD') ? 'bg-rose-950/40 text-rose-300 border-rose-500/30' :
                            'bg-[#241148] text-theme-accent border-theme-accent/20'
                          }`}>
                            {q.round_name || q.stage || 'BTI 2026'}
                          </span>
                        </div>

                        {/* Domain & Level */}
                        <div className="col-span-2 hidden lg:flex items-center gap-1.5 text-[10.5px] font-mono text-[#B6A6D8] truncate">
                          <DifficultyBadgeAndMeter
                            level={q.cognitive_level}
                            showMeter={true}
                            showTierRange={false}
                            size="xs"
                            interactive={true}
                            onClick={() => setFilterLevel(q.cognitive_level || 'THONG_HIEU')}
                            tooltipText={`Mức độ: ${q.cognitive_level || 'THONG_HIEU'}. Bấm để lọc toàn bộ câu hỏi theo mức độ này.`}
                          />
                          <span className="truncate text-slate-400 text-[10px]" title={q.digital_competency_domain}>
                            {q.digital_competency_domain ? (DIGITAL_COMPETENCY_DOMAINS[q.digital_competency_domain]?.name || q.digital_competency_domain) : 'Năng lực số'}
                          </span>
                        </div>

                        {/* Question Text */}
                        <div className="col-span-9 sm:col-span-6 md:col-span-5 lg:col-span-3 pr-2">
                          <p className="text-slate-100 font-medium text-xs truncate leading-snug group-hover:text-white" title={q.question_text}>
                            <HighlightedText text={q.question_text} searchQuery={searchQuery} />
                          </p>
                        </div>

                        {/* Correct Key */}
                        <div className="col-span-2 hidden sm:flex items-center justify-center font-mono">
                          <span className="px-2 py-0.5 rounded-[3px] bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] truncate max-w-[130px]" title={q.correct_key}>
                            {isVcnv ? (q.correct_key ? `🔑 ${q.correct_key}` : '🔑 VCNV') : (q.correct_key || '—')}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="col-span-1 hidden xl:flex items-center justify-center font-mono">
                          <button
                            type="button"
                            onClick={() => {
                              vibrateTap();
                              soundFx.playClick();
                              setQuickReviewQuestion(q);
                            }}
                            className={`text-[10px] px-1.5 py-0.5 rounded-[3px] font-semibold border truncate cursor-pointer hover:brightness-125 transition ${getStatusInfo(q.approval_status).badgeClass}`}
                            title={`Trạng thái: ${getStatusInfo(q.approval_status).label}. Nhấp để Review nhanh (Firestore)`}
                          >
                            {getStatusInfo(q.approval_status).label}
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="col-span-3 sm:col-span-2 md:col-span-1 flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              vibrateTap();
                              soundFx.playClick();
                              setQuickReviewQuestion(q);
                            }}
                            className="p-1 text-slate-400 hover:text-amber-300 hover:bg-amber-950/40 rounded transition cursor-pointer"
                            title="Review nhanh: Thay đổi trạng thái & Ghi chú vào Firestore"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              vibrateTap();
                              soundFx.playClick();
                              setPreviewQuestion(q);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded transition cursor-pointer"
                            title="Xem trước câu hỏi & Thử nghiệm (Quick Preview)"
                          >
                            <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              vibrateTap();
                              soundFx.playClick();
                              setSelectedQuestion(q);
                              setShowAddQuestionModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-theme-accent hover:bg-white/10 rounded transition cursor-pointer"
                            title="Chỉnh sửa câu hỏi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistoryQuestion(q)}
                            className="p-1 text-slate-400 hover:text-sky-300 hover:bg-sky-950/40 rounded transition cursor-pointer"
                            title="Xem lịch sử thay đổi"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Accordion Expanded Preview */}
                      {isExpanded && (
                        <div className="p-3.5 sm:p-4 bg-[#14062E]/95 border-t border-b border-theme-accent/25 space-y-3 animate-in fade-in duration-150">
                          {/* Full Question Text */}
                          <div className="text-xs sm:text-sm font-semibold text-white leading-relaxed bg-[#190839] p-3 rounded-[4px] border border-theme-accent/25 flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-theme-accent font-mono font-bold bg-[#241148] px-2 py-0.5 rounded border border-theme-accent/30 text-xs">
                                  {q.id}
                                </span>
                                <span className="text-[11px] font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded">
                                  {q.stage || 'BTI 2026'} • {q.round_name}
                                </span>
                                <span className="text-[11px] font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                                  {q.cognitive_level}
                                </span>
                              </div>
                              <p className="text-slate-100 font-sans text-xs sm:text-sm">
                                <HighlightedText text={q.question_text} searchQuery={searchQuery} />
                              </p>

                              {/* Question Smart Tag Chips */}
                              {q.tags && q.tags.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                  {q.tags.map(t => {
                                    const scheme = getTagColorScheme(t);
                                    const isSelected = selectedTags.includes(t);
                                    return (
                                      <button
                                        key={t}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          vibrateTap();
                                          soundFx.playClick();
                                          if (selectedTags.includes(t)) {
                                            setSelectedTags(selectedTags.filter(st => st !== t));
                                          } else {
                                            setSelectedTags([...selectedTags, t]);
                                          }
                                        }}
                                        className={`px-2 py-0.5 rounded text-[10.5px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                                          isSelected ? scheme.activeClass : `${scheme.badgeStyle} hover:scale-[1.03]`
                                        }`}
                                        title={`Lọc theo nhãn "${t}"`}
                                      >
                                        <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: scheme.hex }} />
                                        <span>#{t}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  vibrateTap();
                                  soundFx.playClick();
                                  setQuickReviewQuestion(q);
                                }}
                                className="px-2.5 py-1.5 rounded-[4px] bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                                title="Review nhanh: Thay đổi trạng thái & Ghi chú (Lưu Firestore)"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Review nhanh</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  vibrateTap();
                                  soundFx.playClick();
                                  setPreviewQuestion(q);
                                }}
                                className="px-2.5 py-1.5 rounded-[4px] bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                                title="Xem trước nội dung câu hỏi & Thử nghiệm đồng hồ"
                              >
                                <PlayCircle className="w-3.5 h-3.5" />
                                <span>Xem trước câu hỏi</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  vibrateTap();
                                  soundFx.playClick();
                                  setSelectedQuestion(q);
                                  setShowAddQuestionModal(true);
                                }}
                                className="px-2.5 py-1.5 rounded-[4px] bg-theme-accent/15 hover:bg-theme-accent/25 text-theme-accent border border-theme-accent/30 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Sửa</span>
                              </button>
                            </div>
                          </div>

                          {/* Options / VCNV Course / True-False Section */}
                          {(() => {
                            // CASE 1: VCNV
                            if (isVcnv) {
                              const kw = (q.correct_key || q.options?.riskAnswer || q.options?.centerAnswer || 'DEEPFAKE').toUpperCase();
                              const kwLen = kw.replace(/\s/g, '').length;
                              const rQ = q.options?.riskQuestion;
                              const rA = q.options?.riskAnswer;
                              const centerText = q.options?.centerText;
                              const centerAns = q.options?.centerAnswer;
                              const imgUrl = q.options?.obstacleImage || q.obstacle_info?.obstacleImage || (q.media_type === 'IMAGE' ? q.media_url : '');
                              const hasAnyClues = Boolean(q.options?.clue1 && q.options?.ans1);

                              return (
                                <div className="space-y-2.5 pt-1">
                                  <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-[4px] bg-[#190839] border border-theme-accent/40 shadow-inner">
                                    <div className="flex items-center gap-2">
                                      <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                                      <span className="font-mono font-bold text-xs text-amber-200">
                                        CẤU TRÚC 7 HÀNG VCNV CHUẨN BTI 2026
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-[#241148] px-2.5 py-1 rounded-[4px] border border-amber-500/40">
                                      <span className="text-[11px] text-[#B6A6D8] font-mono">🔑 TỪ KHÓA:</span>
                                      <span className="font-mono font-black text-xs text-amber-300 tracking-wider">
                                        {kw}
                                      </span>
                                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                                        {kwLen} chữ cái
                                      </span>
                                    </div>
                                  </div>

                                  {/* Risk Row */}
                                  <div className="p-2.5 rounded-[4px] border bg-rose-950/20 border-rose-500/40 text-xs space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-mono font-bold text-rose-300 text-xs">
                                        ⚡ HÀNG 2: Ô MẠO HIỂM (+120đ / -50% điểm)
                                      </span>
                                      {rA && (
                                        <span className="bg-rose-950/80 text-rose-200 font-mono font-bold px-2 py-0.5 rounded text-[11px] border border-rose-500/50">
                                          Đáp án: {rA}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-200 leading-relaxed font-sans">{rQ || <span className="text-slate-400 italic">Chưa thiết lập câu hỏi Ô mạo hiểm</span>}</p>
                                  </div>

                                  {/* 4 Horizontal Clues */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    {[1, 2, 3, 4].map(cNum => {
                                      const clue = q.options?.[`clue${cNum}`];
                                      const ans = q.options?.[`ans${cNum}`];
                                      return (
                                        <div key={cNum} className="p-2 rounded-[4px] border bg-[#190839]/90 border-theme-accent/25 text-slate-200 space-y-1">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono font-bold text-amber-300 text-[11px]">Hàng ngang {cNum}</span>
                                            {ans && <span className="bg-emerald-950/70 text-emerald-300 font-mono font-bold px-1.5 py-0.5 rounded text-[10.5px] border border-emerald-500/40">{ans}</span>}
                                          </div>
                                          <p className="text-slate-300 text-[11px] leading-relaxed font-sans">{clue || <span className="text-slate-500 italic">Chưa có câu hỏi</span>}</p>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Center Clue */}
                                  <div className="p-2.5 rounded-[4px] border bg-purple-950/25 border-purple-500/40 text-xs space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-mono font-bold text-purple-300 text-xs">🌟 HÀNG 7: Ô TRUNG TÂM</span>
                                      {centerAns && <span className="bg-purple-950/80 text-purple-200 font-mono font-bold px-2 py-0.5 rounded text-[11px] border border-purple-500/50">Đáp án: {centerAns}</span>}
                                    </div>
                                    <p className="text-xs text-slate-200 leading-relaxed font-sans">{centerText || <span className="text-slate-400 italic">Chưa có gợi ý trung tâm</span>}</p>
                                  </div>
                                </div>
                              );
                            }

                            // CASE 2: TRUE_FALSE_4
                            if (isTrueFalse4) {
                              return (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                                  {['a', 'b', 'c', 'd'].map(key => {
                                    const text = q.options?.[key] || q.options?.[key.toUpperCase()];
                                    if (!text) return null;
                                    const correctStr = q.correct_key || '';
                                    const isTrue = correctStr.includes(`${key}:Đ`) || correctStr.includes(`${key}:T`) || correctStr.includes(`${key}:1`) || correctStr.includes(`${key.toUpperCase()}:Đ`);
                                    const isFalse = correctStr.includes(`${key}:S`) || correctStr.includes(`${key}:F`) || correctStr.includes(`${key}:0`) || correctStr.includes(`${key.toUpperCase()}:S`);
                                    return (
                                      <div key={key} className="p-2 rounded-[4px] border bg-[#190839]/80 border-theme-accent/25 flex items-start justify-between gap-2 text-xs">
                                        <div className="flex items-start gap-2">
                                          <span className="font-mono font-bold text-sky-300 bg-sky-950/60 border border-sky-500/30 px-1.5 py-0.5 rounded text-[11px] shrink-0">{key})</span>
                                          <span className="text-slate-200 font-sans mt-0.5">{text}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 border ${
                                          isTrue ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' : isFalse ? 'bg-rose-950/80 text-rose-300 border-rose-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                                        }`}>
                                          {isTrue ? '✓ ĐÚNG' : isFalse ? '✗ SAI' : 'Đ/S'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }

                            // CASE 3: Multiple choice or Short-Answer
                            const INTERNAL_OPTION_KEYS = new Set([
                              'kdTurn', 'obstacleImage', 'riskQuestion', 'riskAnswer',
                              'clue1', 'ans1', 'clue2', 'ans2', 'clue3', 'ans3', 'clue4', 'ans4',
                              'centerText', 'centerAnswer', '_raw'
                            ]);
                            const validOptions = Object.entries(q.options || {}).filter(([k, v]) => !INTERNAL_OPTION_KEYS.has(k) && v !== '' && v !== undefined && v !== null);

                            if (validOptions.length === 0) {
                              return (
                                <div className="p-3 rounded-[4px] bg-[#190839]/90 border border-theme-accent/30 flex flex-wrap items-center justify-between gap-2 shadow-sm">
                                  <span className="text-[11px] font-mono text-[#B6A6D8]">
                                    Hình thức: <strong>Tự luận / Trả lời ngắn</strong>
                                  </span>
                                  <div className="flex items-center gap-1.5 bg-emerald-950/70 px-2.5 py-1 rounded-[4px] border border-emerald-500/40">
                                    <span className="text-[11px] text-emerald-400 font-mono font-bold">🔑 ĐÁP ÁN:</span>
                                    <span className="font-mono font-bold text-xs text-emerald-300 tracking-wide">
                                      {q.correct_key || 'Chưa thiết lập'}
                                    </span>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                                {validOptions.map(([k, v]) => {
                                  const isCorrect = q.correct_key === k || q.correct_key?.includes(k);
                                  return (
                                    <div
                                      key={k}
                                      className={`p-2.5 rounded-[4px] border flex items-start gap-2 transition ${
                                        isCorrect
                                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 font-semibold shadow-sm'
                                          : 'bg-slate-900/50 border-slate-700/60 text-slate-300'
                                      }`}
                                    >
                                      <span className={`min-w-[20px] h-5 px-1.5 rounded-[3px] flex items-center justify-center font-bold text-[10.5px] shrink-0 font-mono ${
                                        isCorrect ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-200 border border-slate-700'
                                      }`}>
                                        {k}
                                      </span>
                                      <span className="leading-relaxed mt-0.5 break-words">{String(v)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}

                          {/* Footer with full explanation & legal citation (No truncation) */}
                          <div className="pt-2.5 border-t border-slate-800/80 space-y-2 text-xs">
                            <div className="text-slate-200 leading-relaxed break-words">
                              <span className="text-emerald-400 font-mono font-bold mr-1.5">
                                Đáp án: {q.correct_key || '—'}
                              </span>
                              {q.explanation && (
                                <span className="text-slate-300 font-sans">
                                  — {q.explanation}
                                </span>
                              )}
                            </div>

                            {q.legal_reference && (
                              <div className="inline-flex items-start gap-1.5 bg-amber-500/10 text-amber-300/95 px-2.5 py-1 rounded-[4px] border border-amber-500/25 text-[11px] font-mono leading-relaxed break-words">
                                <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span>{q.legal_reference}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* DETAILED CARDS VIEW (2 Columns Layout) */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
              {filteredQuestions.map((q, idx) => {
                const isSelected = selectedIds.has(q.id);
                const isVcnv = getQuestionRoundGroup(q) === 'VCNV' || 
                  q.round_type === 'VCNV' || 
                  Boolean(q.round_format?.includes('VCNV')) || 
                  Boolean(q.options && ('clue1' in q.options || 'ans1' in q.options || 'obstacleImage' in q.options || 'riskQuestion' in q.options));

                return (
                  <div
                    key={q.id}
                    draggable={isDragDropEnabled}
                    onDragStart={(e) => handleDragStart(e, q.id)}
                    onDragOver={(e) => handleDragOver(e, q.id)}
                    onDragLeave={(e) => handleDragLeave(e, q.id)}
                    onDrop={(e) => handleDrop(e, q.id)}
                    onClick={() => {
                      if (isSelectionMode) {
                        handleToggleSelect(q.id);
                      }
                    }}
                    className={`fluent-question-box p-4 sm:p-5 space-y-3 transition-all flex flex-col justify-between ${
                      isVcnv ? 'lg:col-span-2' : ''
                    } ${
                      isDragDropEnabled ? 'cursor-grab active:cursor-grabbing hover:border-amber-400/50' : ''
                    } ${
                      isSelected 
                        ? 'border-theme-accent bg-[#3E1D74]/50 shadow-xl ring-2 ring-theme-accent/60' 
                        : isSelectionMode
                          ? 'hover:border-theme-accent/50 hover:bg-[#2e155b]/40 cursor-pointer'
                          : ''
                    } ${
                      dragOverId === q.id ? 'border-dashed border-2 border-fuchsia-400 opacity-70 transform scale-[1.02] bg-fuchsia-950/30' : ''
                    } ${
                      draggedId === q.id ? 'opacity-30' : ''
                    }`}
                  >
                    {/* Meta row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isDragDropEnabled && (
                          <span className="text-amber-400 hover:text-amber-300 cursor-grab active:cursor-grabbing shrink-0" title="Kéo thả để đổi thứ tự câu hỏi">
                            <GripVertical className="w-4 h-4" />
                          </span>
                        )}
                        <label
                          className="flex items-center gap-1.5 cursor-pointer select-none group/chk"
                          onClick={(e) => e.stopPropagation()}
                          title={isSelected ? "Bỏ chọn câu hỏi này" : "Tích chọn để xóa hoặc đổi trạng thái hàng loạt"}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(q.id)}
                            className={`rounded-[3px] bg-[#190839] border-theme-accent/50 text-theme-accent accent-theme-accent focus:ring-1 focus:ring-theme-accent cursor-pointer transition-transform ${
                              isSelectionMode ? 'w-4 h-4 scale-110 ring-1 ring-theme-accent/70' : 'w-4 h-4'
                            }`}
                            aria-label={`Chọn câu hỏi ${q.id}`}
                            data-testid={`checkbox-question-${q.id}`}
                          />
                          {isSelected && (
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-theme-accent text-[#190839] shadow-xs">
                              ĐÃ CHỌN
                            </span>
                          )}
                        </label>
                        <button
                          type="button"
                          onClick={(e) => handleCopyId(q.id, e)}
                          className="font-mono font-bold text-theme-accent hover:text-white text-xs bg-[#241148] border border-theme-accent/30 px-2 py-0.5 rounded-[4px] flex items-center gap-1 cursor-pointer"
                          title="Sao chép mã câu hỏi"
                        >
                          <span>{q.id}</span>
                          {copiedId === q.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-slate-400" />}
                        </button>
                        <span className="text-[11px] font-mono text-[#B6A6D8] bg-[#241148]/70 px-2 py-0.5 rounded-[4px] border border-theme-accent/20">
                          {q.stage || 'BAN_KET_1'}
                        </span>
                        {q.round_format && QUESTION_ROUND_FORMATS[q.round_format] && (
                          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded-[4px] border border-emerald-500/30">
                            {QUESTION_ROUND_FORMATS[q.round_format].shortName}
                          </span>
                        )}
                        <DifficultyBadgeAndMeter
                          level={q.cognitive_level}
                          showMeter={true}
                          showTierRange={true}
                          size="sm"
                          interactive={true}
                          onClick={() => setFilterLevel(q.cognitive_level || 'THONG_HIEU')}
                          tooltipText={`Mức độ: ${q.cognitive_level || 'THONG_HIEU'}. Bấm để lọc toàn bộ câu hỏi theo mức độ này.`}
                        />
                        <span className="text-[11px] font-mono text-[#B6A6D8]">
                          {q.round_name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            vibrateTap();
                            soundFx.playClick();
                            setQuickReviewQuestion(q);
                          }}
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[4px] border cursor-pointer hover:brightness-125 transition ${getStatusInfo(q.approval_status).badgeClass}`}
                          title="Bấm để Review nhanh trạng thái & ghi chú (Lưu Firestore)"
                        >
                          {getStatusInfo(q.approval_status).label}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            vibrateTap();
                            soundFx.playClick();
                            setQuickReviewQuestion(q);
                          }}
                          className="px-2.5 py-1 rounded-[4px] bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                          title="Review nhanh: Thay đổi trạng thái & Ghi chú nhanh vào Firestore"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Review nhanh</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            vibrateTap();
                            soundFx.playClick();
                            setPreviewQuestion(q);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded-[4px] transition cursor-pointer"
                          title="Xem trước câu hỏi & Thử nghiệm (Quick Preview)"
                        >
                          <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            vibrateTap();
                            soundFx.playClick();
                            setSelectedQuestion(q);
                            setShowAddQuestionModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-theme-accent hover:bg-[#241148] rounded-[4px] transition cursor-pointer"
                          title="Chỉnh sửa câu hỏi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHistoryQuestion(q);
                          }}
                          className="p-1.5 text-slate-400 hover:text-sky-300 hover:bg-slate-800/60 rounded-[4px] transition cursor-pointer"
                          title="Xem lịch sử thay đổi"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question text */}
                    <p className="text-sm font-semibold text-slate-100 leading-relaxed">
                      {q.question_text}
                    </p>

                    {/* Question Smart Tag Chips */}
                    {q.tags && q.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {q.tags.map(t => {
                          const scheme = getTagColorScheme(t);
                          const isSelected = selectedTags.includes(t);
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                vibrateTap();
                                soundFx.playClick();
                                if (selectedTags.includes(t)) {
                                  setSelectedTags(selectedTags.filter(st => st !== t));
                                } else {
                                  setSelectedTags([...selectedTags, t]);
                                }
                              }}
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                                isSelected ? scheme.activeClass : `${scheme.badgeStyle} hover:scale-[1.03]`
                              }`}
                              title={`Lọc theo nhãn "${t}"`}
                            >
                              <span className="w-2 h-2 rounded-full inline-block shrink-0 shadow-xs" style={{ backgroundColor: scheme.hex }} />
                              <span>#{t}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* QUESTION CONTENT / OPTIONS / VCNV BOARD */}
                    {(() => {
                      const isVcnv = getQuestionRoundGroup(q) === 'VCNV' || 
                        q.round_type === 'VCNV' || 
                        Boolean(q.round_format?.includes('VCNV')) || 
                        Boolean(q.options && ('clue1' in q.options || 'ans1' in q.options || 'obstacleImage' in q.options || 'riskQuestion' in q.options));
                      
                      const isTrueFalse4 = q.round_type === 'TRUE_FALSE_4' || q.round_format === 'BGD_TRUE_FALSE_4';

                      // CASE 1: VCNV (Cấu trúc 7 Hàng Vượt Chướng Ngại Vật & Ảnh Gợi Ý BTI 2026)
                      if (isVcnv) {
                        const kw = (q.correct_key || q.options?.riskAnswer || q.options?.centerAnswer || 'DEEPFAKE').toUpperCase();
                        const kwLen = kw.replace(/\s/g, '').length;
                        const rQ = q.options?.riskQuestion;
                        const rA = q.options?.riskAnswer;
                        const centerText = q.options?.centerText;
                        const centerAns = q.options?.centerAnswer;
                        const imgUrl = q.options?.obstacleImage || q.obstacle_info?.obstacleImage || (q.media_type === 'IMAGE' ? q.media_url : '');
                        const hasAnyClues = Boolean(q.options?.clue1 && q.options?.ans1);

                        return (
                          <div className="space-y-3 pt-1">
                            {/* VCNV Main Banner */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-[4px] bg-[#190839] border border-theme-accent/40 shadow-inner">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-[4px] bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/40 shrink-0">
                                  <Layers className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="font-mono font-bold text-xs text-amber-200 block">
                                    BỘ ĐỀ VƯỢT CHƯỚNG NGẠI VẬT — ĐỦ 7 HÀNG CHUẨN BTI 2026
                                  </span>
                                  <span className="text-[10.5px] text-[#B6A6D8] font-mono block">
                                    Từ khóa CNV (Hàng 1) • Ô Mạo hiểm (Hàng 2) • 4 Hàng ngang (Hàng 3-6) • Ô Trung tâm (Hàng 7) &amp; Ảnh gợi ý
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handlePopulateSampleVcnv(q)}
                                  className="px-2.5 py-1 rounded-[4px] bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-200 text-[11px] font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer"
                                  title="Điền đầy đủ dữ liệu 7 hàng chuẩn BTI 2026"
                                >
                                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                                  <span>{hasAnyClues ? 'Khôi phục 7 hàng chuẩn BTI' : '⚡ Nạp mẫu đầy đủ 7 hàng'}</span>
                                </button>

                                <div className="flex items-center gap-1.5 bg-[#241148] px-3 py-1 rounded-[4px] border border-amber-500/40 shadow-sm">
                                  <span className="text-[11px] text-[#B6A6D8] font-mono">🔑 HÀNG 1 (TỪ KHÓA):</span>
                                  <span className="font-mono font-black text-xs text-amber-300 tracking-wider">
                                    {kw}
                                  </span>
                                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                                    {kwLen} chữ cái
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* HÀNG 2: Ô MẠO HIỂM (+120đ / -50% điểm) */}
                            <div className="p-3 rounded-[4px] border bg-rose-950/20 border-rose-500/40 text-xs space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono font-bold text-rose-300 text-xs flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded-[2px] bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30">
                                    HÀNG 2
                                  </span>
                                  ⚡ Ô MẠO HIỂM (+120đ nếu đúng / -50% tổng điểm nếu sai)
                                </span>
                                {rA ? (
                                  <span className="bg-rose-950/80 text-rose-200 font-mono font-bold px-2.5 py-0.5 rounded-[3px] border border-rose-500/50 text-[11px]">
                                    Đáp án: {rA}
                                  </span>
                                ) : (
                                  <span className="text-rose-400/60 text-[10px] italic font-mono">(Chưa có đáp án)</span>
                                )}
                              </div>
                              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                                {rQ || <span className="text-slate-400 italic">Chưa thiết lập câu hỏi tình huống Ô mạo hiểm. Nhấn nút [⚡ Nạp mẫu đầy đủ 7 hàng] hoặc icon cây bút [Chỉnh sửa] để bổ sung.</span>}
                              </p>
                            </div>

                            {/* HÀNG 3 - HÀNG 6: 4 HÀNG NGANG GỢI Ý (15s - 10đ) */}
                            <div className="space-y-1.5">
                              <div className="text-[11px] font-mono font-bold text-sky-300 flex items-center justify-between border-b border-sky-500/20 pb-1">
                                <span>🧩 4 HÀNG NGANG GỢI Ý MỞ 4 MẢNH GHÉP ẢNH (HÀNG 3 - 6)</span>
                                <span className="text-[10px] text-sky-300/70 font-mono">15 giây suy nghĩ • +10 điểm / hàng</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {[
                                  { rowNum: 3, clueNum: 1 },
                                  { rowNum: 4, clueNum: 2 },
                                  { rowNum: 5, clueNum: 3 },
                                  { rowNum: 6, clueNum: 4 },
                                ].map(({ rowNum, clueNum }) => {
                                  const clue = q.options?.[`clue${clueNum}`];
                                  const ans = q.options?.[`ans${clueNum}`];
                                  const hasData = Boolean(clue || ans);
                                  const ansLen = ans ? ans.replace(/\s/g, '').length : 0;
                                  return (
                                    <div
                                      key={clueNum}
                                      className={`p-2.5 rounded-[4px] border transition ${
                                        hasData
                                          ? 'bg-[#190839]/90 border-theme-accent/25 text-slate-200'
                                          : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <span className="font-mono font-bold text-amber-300 text-[11px] flex items-center gap-1.5">
                                          <span className="px-1.5 py-0.5 rounded-[2px] bg-sky-500/20 text-sky-300 font-bold text-[10px] border border-sky-500/30">
                                            HÀNG {rowNum}
                                          </span>
                                          Hàng ngang {clueNum}
                                        </span>
                                        {ans ? (
                                          <span className="bg-emerald-950/70 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-[3px] border border-emerald-500/40 text-[11px]">
                                            {ans} ({ansLen} chữ)
                                          </span>
                                        ) : (
                                          <span className="text-slate-500 text-[10px] italic font-mono">(Chưa có đáp án)</span>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                                        {clue ? clue : <span className="text-slate-500 italic">Chưa thiết lập câu hỏi gợi ý cho hàng ngang {clueNum}</span>}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* HÀNG 7: Ô TRUNG TÂM (Gợi ý cuối cùng - 15s - 10đ) */}
                            <div className="p-3 rounded-[4px] border bg-purple-950/25 border-purple-500/40 text-xs space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono font-bold text-purple-300 text-xs flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded-[2px] bg-purple-500/20 text-purple-300 font-bold text-[10px] border border-purple-500/30">
                                    HÀNG 7
                                  </span>
                                  🌟 Ô TRUNG TÂM (Gợi ý quyết định mở sau 4 hàng ngang - 15s - 10đ)
                                </span>
                                {centerAns ? (
                                  <span className="bg-purple-950/80 text-purple-200 font-mono font-bold px-2.5 py-0.5 rounded-[3px] border border-purple-500/50 text-[11px]">
                                    Đáp án: {centerAns} ({centerAns.replace(/\s/g, '').length} chữ)
                                  </span>
                                ) : (
                                  <span className="text-purple-400/60 text-[10px] italic font-mono">(Chưa có đáp án)</span>
                                )}
                              </div>
                              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                                {centerText || <span className="text-slate-400 italic">Chưa thiết lập câu hỏi gợi ý Ô Trung Tâm. Mảnh ghép trung tâm sẽ lật mở gợi ý này.</span>}
                              </p>
                            </div>

                            {/* ẢNH GỢI Ý CHƯỚNG NGẠI VẬT (BỊ CHE BỞI CÁC MẢNH GHÉP HÀNG NGANG & TRUNG TÂM) */}
                            <div className="p-2.5 rounded-[4px] border bg-[#190839]/70 border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2.5 text-cyan-300 font-mono">
                                <div className="w-6 h-6 rounded bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30 shrink-0">
                                  <ImageIcon className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <span className="font-bold block text-cyan-200">
                                    ẢNH GỢI Ý CHƯỚNG NGẠI VẬT (MẢNH GHÉP CHE HÌNH)
                                  </span>
                                  <span className="text-[10px] text-white/50 block">
                                    Bị che bởi 4 mảnh ghép Hàng ngang (Hàng 3-6) và 1 Ô Trung tâm (Hàng 7)
                                  </span>
                                </div>
                              </div>
                              {imgUrl ? (
                                <div className="flex items-center gap-2 shrink-0">
                                  <img
                                    src={imgUrl}
                                    alt="Minh họa CNV"
                                    className="w-12 h-8 object-cover rounded border border-cyan-500/40 bg-black"
                                  />
                                  <span className="text-[11px] font-mono text-cyan-200 truncate max-w-[200px] bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                                    {imgUrl.startsWith('data:') ? 'Ảnh đính kèm sẵn' : imgUrl}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10.5px] font-mono text-cyan-400/60 italic bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-500/20">
                                  (Chưa có ảnh gợi ý. Vào [Chỉnh sửa] để tải ảnh lên)
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // CASE 2: TRUE_FALSE_4 (Đúng / Sai 4 ý - Bộ GD&ĐT)
                      if (isTrueFalse4) {
                        return (
                          <div className="space-y-1.5 pt-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {['a', 'b', 'c', 'd'].map(key => {
                                const text = q.options?.[key] || q.options?.[key.toUpperCase()];
                                if (!text) return null;
                                const correctStr = q.correct_key || '';
                                const isTrue = correctStr.includes(`${key}:Đ`) || correctStr.includes(`${key}:T`) || correctStr.includes(`${key}:1`) || correctStr.includes(`${key.toUpperCase()}:Đ`);
                                const isFalse = correctStr.includes(`${key}:S`) || correctStr.includes(`${key}:F`) || correctStr.includes(`${key}:0`) || correctStr.includes(`${key.toUpperCase()}:S`);
                                return (
                                  <div
                                    key={key}
                                    className="p-2.5 rounded-[4px] border bg-[#190839]/80 border-theme-accent/25 flex items-start justify-between gap-2 text-xs"
                                  >
                                    <div className="flex items-start gap-2">
                                      <span className="font-mono font-bold text-sky-300 bg-sky-950/60 border border-sky-500/30 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                                        {key})
                                      </span>
                                      <span className="text-slate-200 leading-relaxed font-sans mt-0.5">{text}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 border ${
                                      isTrue
                                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                                        : isFalse
                                          ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                                          : 'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}>
                                      {isTrue ? '✓ ĐÚNG' : isFalse ? '✗ SAI' : 'Đ/S'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      // CASE 3: Standard Multiple Choice / Options or Short-Answer
                      const INTERNAL_OPTION_KEYS = new Set([
                        'kdTurn', 'obstacleImage', 'riskQuestion', 'riskAnswer',
                        'clue1', 'ans1', 'clue2', 'ans2', 'clue3', 'ans3', 'clue4', 'ans4',
                        'centerText', 'centerAnswer', '_raw'
                      ]);

                      const validOptions = Object.entries(q.options || {}).filter(([k, v]) => {
                        if (INTERNAL_OPTION_KEYS.has(k)) return false;
                        if (v === '' || v === undefined || v === null) return false;
                        return true;
                      });

                      if (validOptions.length === 0) {
                        return (
                          <div className="p-3 rounded-[4px] bg-[#190839]/90 border border-theme-accent/30 flex flex-wrap items-center justify-between gap-2 shadow-sm">
                            <span className="text-[11px] font-mono text-[#B6A6D8]">
                              Hình thức: <strong>Tự luận / Trả lời ngắn</strong>
                            </span>
                            <div className="flex items-center gap-1.5 bg-emerald-950/70 px-3 py-1 rounded-[4px] border border-emerald-500/40">
                              <span className="text-[11px] text-emerald-400 font-mono font-bold">🔑 ĐÁP ÁN:</span>
                              <span className="font-mono font-bold text-xs text-emerald-300 tracking-wide">
                                {q.correct_key || 'Chưa thiết lập'}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                          {validOptions.map(([k, v]) => {
                            const isCorrect = q.correct_key === k || q.correct_key?.includes(k);
                            return (
                              <div
                                key={k}
                                className={`p-2.5 rounded-[4px] border flex items-start gap-2.5 transition ${
                                  isCorrect
                                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 font-semibold shadow-sm'
                                    : 'bg-slate-900/50 border-slate-700/60 text-slate-300'
                                }`}
                              >
                                <span className={`min-w-[22px] h-5 px-1.5 rounded-[4px] flex items-center justify-center font-bold text-[11px] shrink-0 font-mono ${
                                  isCorrect ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold' : 'bg-slate-800 text-slate-200 border border-slate-700'
                                }`}>
                                  {k}
                                </span>
                                <span className="leading-relaxed mt-0.5 break-words">{String(v)}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Explanation & Legal footer (Full Content - No Truncation) */}
                    <div className="pt-2.5 border-t border-slate-800/80 space-y-2 text-xs">
                      <div className="text-slate-200 leading-relaxed break-words">
                        {(getQuestionRoundGroup(q) === 'VCNV' || q.round_type === 'VCNV' || q.round_format?.includes('VCNV')) ? (
                          <span className="text-amber-300 font-mono font-bold bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-[4px] mr-2 inline-block">
                            🔑 Từ khóa CNV: <strong className="text-amber-200 tracking-wider text-xs">{q.correct_key || 'DEEPFAKE'}</strong>
                            {q.correct_key && ` (${q.correct_key.replace(/\s/g, '').length} chữ cái)`}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-mono font-bold mr-1.5">
                            Đáp án: {q.correct_key || '—'}
                          </span>
                        )}
                        {q.explanation && (
                          <span className="text-slate-300 font-sans">
                            — {q.explanation}
                          </span>
                        )}
                      </div>

                      {q.legal_reference && (
                        <div className="inline-flex items-start gap-1.5 bg-amber-500/10 text-amber-300/95 px-2.5 py-1 rounded-[4px] border border-amber-500/25 text-[11px] font-mono leading-relaxed break-words">
                          <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{q.legal_reference}</span>
                        </div>
                      )}

                      {q.review_notes && (
                        <div className="flex items-start gap-2 p-2.5 rounded-[4px] bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs">
                          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-mono font-bold text-amber-300 block text-[11px]">
                              Ghi chú review ({getStatusInfo(q.approval_status).label}):
                            </span>
                            <p className="italic font-sans text-amber-100/90 mt-0.5 leading-relaxed">
                              "{q.review_notes}"
                            </p>
                          </div>
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

      {/* TAB 1.5: MODERATION REVIEW */}
      {activeTab === 'MODERATION' && (
        <ModeratorReviewView
          onEditQuestion={(q) => {
            setSelectedQuestion(q);
            setShowAddQuestionModal(true);
          }}
          onPreviewQuestion={(q) => setPreviewQuestion(q)}
          onShowToast={(msg) => addToast('Hệ thống', msg, 'success')}
        />
      )}

      {/* TAB 2: AI STUDIO */}
      {activeTab === 'AI_STUDIO' && (
        <AIQuestionStudio 
          onOpenGeminiStudio={onOpenGeminiStudio}
          onQuestionCreated={() => {
            setQuestions(questionBankManager.getQuestions());
            setStats(questionBankManager.getMatrixStats());
            addToast('Đã thêm câu hỏi từ AI Studio', 'Câu hỏi tạo tự động đã được lưu thành công vào ngân hàng đề.', 'add');
          }} 
          onEditQuestion={(q) => {
            setSelectedQuestion(q);
            setShowAddQuestionModal(true);
          }}
        />
      )}

      {/* TAB 3: EXCEL HUB */}
      {activeTab === 'EXCEL_HUB' && (
        <ExcelTemplateHub onImportComplete={() => {
          setQuestions(questionBankManager.getQuestions());
          setStats(questionBankManager.getMatrixStats());
          addToast('Nhập Excel hoàn tất', 'Dữ liệu câu hỏi từ bảng tính Excel đã được đồng bộ vào ngân hàng.', 'success');
        }} />
      )}

      {/* TAB 4: INTERACTIVE SCENARIOS */}
      {activeTab === 'SCENARIOS' && (
        <InteractiveScenarioEditor />
      )}

      {/* TAB 5: LEGAL DOCUMENTS */}
      {activeTab === 'LEGAL_DOCS' && (
        <LegalDocumentLibrary 
          onSelectForAI={(doc) => {
            setActiveTab('AI_STUDIO');
          }}
        />
      )}

      {/* TAB 6: BTI 2026 COMPETENCY MATRIX DASHBOARD */}
      {activeTab === 'MATRIX' && (
        <BtiCompetencyMatrixDashboard
          questions={questions}
          onFilterMatrixCell={(domain, level) => {
            vibrateTap();
            soundFx.playClick();
            setFilterDomain(domain);
            setFilterLevel(level);
            setActiveTab('QUESTIONS');
          }}
          onNavigateToAIStudio={(prefill) => {
            vibrateTap();
            soundFx.playClick();
            if (prefill?.domain) setFilterDomain(prefill.domain);
            if (prefill?.level) setFilterLevel(prefill.level);
            setActiveTab('AI_STUDIO');
          }}
          onOpenAddQuestion={(prefill) => {
            vibrateTap();
            soundFx.playClick();
            setSelectedQuestion(null);
            setShowAddQuestionModal(true);
          }}
        />
      )}

      {/* AI Mock Quiz & Balanced Exam Generator Modal */}
      {showExamModal && (
        <AiMockQuizGeneratorModal 
          isOpen={showExamModal}
          onClose={() => setShowExamModal(false)}
          onExamCreated={(exam) => {
            addToast(
              'Đã tạo đề thi thử AI thành công',
              `Bộ đề "${exam.title}" (${exam.totalQuestions} câu) đã được tạo với tỷ lệ phân hóa cân bằng.`,
              'success'
            );
          }}
        />
      )}

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={showPrintPreviewModal}
        onClose={() => setShowPrintPreviewModal(false)}
        questions={filteredQuestions}
        selectedQuestions={questions.filter(q => selectedIds.has(q.id))}
      />

      {/* Question Export Modal (PDF & JSON) */}
      <QuestionExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        allQuestions={questions}
        filteredQuestions={filteredQuestions}
        selectedQuestions={questions.filter(q => selectedIds.has(q.id))}
        onOpenPrintPreview={() => setShowPrintPreviewModal(true)}
        onToast={(title, msg, type) => addToast(title, msg, type)}
      />

      {/* User Role Modal */}
      {showUserModal && (
        <UserRoleManagerModal 
          onClose={() => setShowUserModal(false)}
          onUserChanged={() => setCurrentUser(questionBankManager.getCurrentUser())}
        />
      )}

      {/* Manual Question Creator / Editor Modal */}
      {showAddQuestionModal && (
        <QuestionEditorModal
          isOpen={showAddQuestionModal}
          questionToEdit={selectedQuestion}
          initialRoundGroup={editorInitialRound}
          initialDomain={editorInitialDomain}
          onClose={() => {
            setShowAddQuestionModal(false);
            setSelectedQuestion(null);
            setEditorInitialRound(undefined);
            setEditorInitialDomain(undefined);
          }}
          onSaved={(savedQuestion) => {
            if (selectedQuestion) {
              notifyEditQuestion(savedQuestion?.id || selectedQuestion.id, savedQuestion?.question_text || selectedQuestion.question_text);
            } else if (savedQuestion) {
              notifyAddQuestion(savedQuestion.id, savedQuestion.question_text);
            } else {
              addToast('Đã lưu câu hỏi thành công', 'Thông tin câu hỏi đã được đồng bộ vào ngân hàng đề.', 'success');
            }
            setQuestions(questionBankManager.getQuestions());
            setStats(questionBankManager.getMatrixStats());
          }}
        />
      )}

      {/* Bulk Question Import Modal (Text & Excel Copy-Paste) */}
      {showBulkImportModal && (
        <BulkQuestionImportModal
          isOpen={showBulkImportModal}
          initialDriveFile={selectedDriveFile}
          onClose={() => {
            setShowBulkImportModal(false);
            setSelectedDriveFile(null);
          }}
          onImportSuccess={(count) => {
            notifyBulkImport(count);
            setQuestions(questionBankManager.getQuestions());
            setStats(questionBankManager.getMatrixStats());
          }}
        />
      )}

      {/* Google Drive Picker Modal */}
      {showGooglePickerModal && (
        <GoogleDrivePickerModal
          isOpen={showGooglePickerModal}
          onClose={() => setShowGooglePickerModal(false)}
          onFilePicked={async (file) => {
            console.log('Selected file metadata:', file);
            console.log('[Google Drive Picker] Selected file metadata:', {
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              url: file.url,
              sizeBytes: file.sizeBytes,
              lastEditedUtc: file.lastEditedUtc
            });
            setSelectedDriveFile(file);
            setShowGooglePickerModal(false);

            // Process file metadata with driveImportProcessorService
            const processResult = await driveImportProcessorService.handlePickerMetadata(file, false);
            console.log('[DriveImportProcessor] Modal picked result:', processResult);

            if (processResult.actionTriggered === 'SCAN_DOCUMENT_AI') {
              setShowGeminiScannerModal(true);
            } else if (
              processResult.importedQuestions.length > 0 ||
              file.mimeType.includes('spreadsheet') || 
              file.name.endsWith('.xlsx') || 
              file.name.endsWith('.csv') || 
              file.name.endsWith('.txt') ||
              file.name.endsWith('.json') ||
              file.mimeType.includes('document')
            ) {
              setShowBulkImportModal(true);
            } else {
              addToast(
                'Đã chọn tệp từ Google Drive',
                `Đã nhận tệp "${file.name}". Metadata đã được ghi nhận vào console.`,
                'success'
              );
            }
          }}
        />
      )}

      {/* Gemini Camera & Document Scanner Modal */}
      {showGeminiScannerModal && (
        <GeminiCameraDocumentScannerModal
          isOpen={showGeminiScannerModal}
          onClose={() => setShowGeminiScannerModal(false)}
          onImportSuccess={(count) => {
            notifyBulkImport(count);
            addToast(
              'Số hóa thành công bằng Gemini!',
              `Đã tự động trích xuất và nhập ${count} câu hỏi vào ngân hàng đề thi.`,
              'success'
            );
            setQuestions(questionBankManager.getQuestions());
            setStats(questionBankManager.getMatrixStats());
          }}
        />
      )}

      {/* Bulk Category / Round Change Modal */}
      <QuestionCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        questions={selectedIds.size === 2 ? [
          questionBankManager.getQuestionById(Array.from(selectedIds)[0])!,
          questionBankManager.getQuestionById(Array.from(selectedIds)[1])!
        ] : [null as any, null as any]}
      />

      {showBulkCategoryModal && (
        <BulkCategoryChangeModal
          isOpen={showBulkCategoryModal}
          onClose={() => setShowBulkCategoryModal(false)}
          selectedQuestionIds={Array.from(selectedIds)}
          questions={questions}
          onSuccess={(updatedCount) => {
            setSelectedIds(new Set());
            notifyBulkUpdate(updatedCount);
            setQuestions(questionBankManager.getQuestions());
            setStats(questionBankManager.getMatrixStats());
          }}
        />
      )}

      {/* Quick Preview Modal for Contestant Experience & Timer Simulation */}
      <QuestionQuickPreviewModal
        isOpen={previewQuestion !== null}
        question={previewQuestion}
        onClose={() => setPreviewQuestion(null)}
        onEdit={(q) => {
          setSelectedQuestion(q);
          setShowAddQuestionModal(true);
        }}
        onQuickReview={(q) => {
          setPreviewQuestion(null);
          setQuickReviewQuestion(q);
        }}
      />

      {/* Question History & Version Audit Modal */}
      <QuestionHistoryModal
        isOpen={!!historyQuestion}
        onClose={() => setHistoryQuestion(null)}
        question={historyQuestion}
        onRevertSuccess={(updatedQ) => {
          setQuestions(questionBankManager.getQuestions());
          setStats(questionBankManager.getMatrixStats());
          setHistoryQuestion(updatedQ);
          addToast('Đã khôi phục phiên bản', `Câu hỏi ${updatedQ.id} đã được khôi phục thành công.`, 'success');
        }}
      />

      {/* Custom Tags Manager Modal */}
      {showTagsManagerModal && (
        <CustomTagsManagerModal
          isOpen={showTagsManagerModal}
          onClose={() => setShowTagsManagerModal(false)}
          tags={questionBankManager.getCustomTags()}
        />
      )}

      {/* Custom Categories Manager Modal */}
      {showCategoriesManagerModal && (
        <CustomCategoriesManagerModal
          isOpen={showCategoriesManagerModal}
          onClose={() => {
            setShowCategoriesManagerModal(false);
            setQuestions(questionBankManager.getQuestions());
            setStats(questionBankManager.getMatrixStats());
          }}
        />
      )}

      {/* Duplicate & Similarity Checker Modal */}
      {showDuplicateCheckerModal && (
        <DuplicateCheckerModal
          isOpen={showDuplicateCheckerModal}
          onClose={() => {
            setShowDuplicateCheckerModal(false);
            setQuestions(questionBankManager.getQuestions());
            setStats(questionBankManager.getMatrixStats());
          }}
          questions={questions}
          onEditQuestion={(q) => {
            setSelectedQuestion(q);
            setShowAddQuestionModal(true);
            setShowDuplicateCheckerModal(false);
          }}
        />
      )}

      {/* Bulk Delete Confirm Modal */}
      {showBulkDeleteModal && (
        <BulkDeleteConfirmModal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
          onConfirm={handleConfirmBulkDelete}
          selectedQuestions={questions.filter(q => selectedIds.has(q.id))}
        />
      )}

      {/* Global Shortcut Mapping & Help Modal */}
      {showShortcutsModal && (
        <ShortcutMappingModal
          isOpen={showShortcutsModal}
          onClose={() => setShowShortcutsModal(false)}
          initialCategory="QUESTION_BANK"
          defaultQbOnly={true}
        />
      )}

      {/* Quick BTI Competency Matrix Popup */}
      <BtiCompetencyMatrixQuickPopup
        isOpen={showBtiMatrixQuickPopup}
        onClose={() => setShowBtiMatrixQuickPopup(false)}
        questions={questions}
        onOpenAddQuestionForSlot={(dKey, level) => {
          setEditorInitialDomain(dKey);
          setFilterLevel(level);
          setSelectedQuestion(null);
          setShowAddQuestionModal(true);
        }}
        onFilterQuestions={(domain, level) => {
          setFilterDomain(domain);
          setFilterLevel(level);
          setFilterSubCompetency('ALL');
          setFilterMatrixStatus('ALL');
          setActiveTab('QUESTIONS');
        }}
        onNavigateToFullMatrix={() => setActiveTab('MATRIX')}
      />

      {/* Quick Review Modal */}
      {quickReviewQuestion && (
        <QuestionQuickReviewModal
          isOpen={Boolean(quickReviewQuestion)}
          question={quickReviewQuestion}
          onClose={() => setQuickReviewQuestion(null)}
          onReviewSaved={(updatedQ, status, notes) => {
            setQuestions(questionBankManager.getQuestions());
            setStats(questionBankManager.getMatrixStats());
            addToast(
              'Review nhanh thành công',
              `Câu hỏi ${updatedQ.id} đã chuyển trạng thái [${getStatusInfo(status).label}] và lưu trực tiếp vào Firestore.`,
              'success'
            );
          }}
        />
      )}

      {/* Difficulty Batch Suggestion Advisor Modal */}
      {showDifficultyBatchModal && (
        <DifficultyBatchSuggestionModal
          isOpen={showDifficultyBatchModal}
          questions={questions}
          onClose={() => setShowDifficultyBatchModal(false)}
          onApplyComplete={(updatedCount) => {
            setQuestions(questionBankManager.getQuestions());
            setStats(questionBankManager.getMatrixStats());
            addToast(
              'Chuẩn hóa độ khó thành công',
              `Đã cập nhật mức độ nhận thức cho ${updatedCount} câu hỏi theo đề xuất của AI Difficulty Advisor.`,
              'success'
            );
          }}
        />
      )}

      {/* Question Bank Toast Notifications Container */}
      <QuestionBankToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
