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
  MoreHorizontal,
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
  RotateCcw,
  TrendingUp
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
import { QuestionEditorModal } from './QuestionEditorModal';
import { BulkQuestionImportModal } from './BulkQuestionImportModal';
import { BulkQuestionGeneratorModal } from './BulkQuestionGeneratorModal';
import { QuestionVariantsModal } from './QuestionVariantsModal';
import { PsychometricItemAnalysisModal } from './PsychometricItemAnalysisModal';
import { InteractiveScenarioSimulatorModal } from './InteractiveScenarioSimulatorModal';
import { AiVoiceReaderModal } from './AiVoiceReaderModal';
import { MultiTierApprovalWorkflowModal } from './MultiTierApprovalWorkflowModal';
import { BtiDigitalCertificateModal } from './BtiDigitalCertificateModal';
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
import { QuestionQualityReviewModal } from './QuestionQualityReviewModal';
import { InteractiveQuizPreviewModal } from './InteractiveQuizPreviewModal';
import { SmartTaggingModal } from './SmartTaggingModal';
import { AllInOneAuthoringSuiteModal } from './AllInOneAuthoringSuiteModal';
import { questionReviewService, getStatusInfo } from '../../services/questionReviewService';
import { BtiCompetencyMatrixQuickPopup } from './BtiCompetencyMatrixQuickPopup';
import { GeminiCameraDocumentScannerModal } from './GeminiCameraDocumentScannerModal';
import { GoogleDrivePickerModal } from '../common/GoogleDrivePickerModal';
import { googlePickerService, loadPickerApi } from '../../services/googlePickerService';
import { driveImportProcessorService } from '../../services/driveImportProcessorService';
import { MatrixStatusFilterType } from './BtiCompetencyMatrixFilterBar';
import { ShortcutMappingModal } from '../ShortcutMappingModal';
import { shortcutService } from '../../services/shortcutService';
import { Printer, Award } from 'lucide-react';
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
import { QuestionBankStatsView } from './QuestionBankStatsView';
import { PracticeExamView } from './PracticeExamView';

type MainTab = 'OVERVIEW' | 'QUESTIONS' | 'MODERATION' | 'AI_STUDIO' | 'EXCEL_HUB' | 'SCENARIOS' | 'LEGAL_DOCS' | 'MATRIX' | 'STATS' | 'PRACTICE';

interface QuestionBankDashboardProps {
  onOpenGeminiStudio?: (tab?: 'CHAT' | 'AUTOPILOT' | 'ANTIGRAVITY' | 'DEEP_RESEARCH' | 'IMAGE' | 'VIDEO') => void;
  onOpenAuthoringSuite?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export const QuestionBankDashboard: React.FC<QuestionBankDashboardProps> = ({ 
  onOpenGeminiStudio,
  onOpenAuthoringSuite,
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
  const [showOverviewHeaderInQuestions, setShowOverviewHeaderInQuestions] = useState<boolean>(false);

  // Modals
  const [showExamModal, setShowExamModal] = useState<boolean>(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState<boolean>(false);
  const [editorInitialRound, setEditorInitialRound] = useState<BtiRoundGroupKey | undefined>(undefined);
  const [editorInitialDomain, setEditorInitialDomain] = useState<string | undefined>(undefined);
  const [showBulkImportModal, setShowBulkImportModal] = useState<boolean>(false);
  const [showBulkGeneratorModal, setShowBulkGeneratorModal] = useState<boolean>(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState<boolean>(false);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [showVariantModal, setShowVariantModal] = useState<boolean>(false);
  const [selectedVariantQuestion, setSelectedVariantQuestion] = useState<QuestionItem | null>(null);
  const [showPsychometricModal, setShowPsychometricModal] = useState<boolean>(false);
  const [selectedPsychometricQuestion, setSelectedPsychometricQuestion] = useState<QuestionItem | null>(null);
  const [showVoiceReaderModal, setShowVoiceReaderModal] = useState<boolean>(false);
  const [selectedVoiceQuestion, setSelectedVoiceQuestion] = useState<QuestionItem | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [selectedApprovalQuestion, setSelectedApprovalQuestion] = useState<QuestionItem | null>(null);
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
  const [showQualityReviewModal, setShowQualityReviewModal] = useState<boolean>(false);
  const [selectedQualityReviewQuestion, setSelectedQualityReviewQuestion] = useState<QuestionItem | null>(null);
  const [showInteractiveQuizModal, setShowInteractiveQuizModal] = useState<boolean>(false);
  const [interactiveQuizQuestions, setInteractiveQuizQuestions] = useState<QuestionItem[]>([]);
  const [showSmartTaggingModal, setShowSmartTaggingModal] = useState<boolean>(false);
  const [smartTaggingTargetQuestion, setSmartTaggingTargetQuestion] = useState<QuestionItem | null>(null);
  const [smartTaggingSelectedQuestions, setSmartTaggingSelectedQuestions] = useState<QuestionItem[]>([]);
  const [showAllInOneModal, setShowAllInOneModal] = useState<boolean>(false);

  // Hero Command Bar Dropdowns State
  const [activeHeaderMenu, setActiveHeaderMenu] = useState<'import' | 'export' | 'ai' | 'more' | null>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  // Tab Tools Dropdown State
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setActiveHeaderMenu(null);
      }
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
        setIsToolsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute pending moderation count for Tab badge
  const pendingModerationCount = useMemo(() => {
    return questions.filter(q => (q as any).approval_status === 'PENDING_REVIEW' || (q as any).approvalStatus === 'PENDING_REVIEW' || (q as any).status === 'PENDING_REVIEW').length;
  }, [questions]);

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

  // Filter Context summary label for print & quiz previews
  const filterContextLabel = useMemo(() => {
    return [
      filterRoundGroup !== 'ALL' ? `Vòng ${filterRoundGroup}` : '',
      filterDomain !== 'ALL' ? `Miền ${filterDomain}` : '',
      filterLevel !== 'ALL' ? filterLevel : '',
      searchQuery ? `"${searchQuery}"` : ''
    ].filter(Boolean).join(' • ');
  }, [filterRoundGroup, filterDomain, filterLevel, searchQuery]);

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

  const handleBatchAutoTag = () => {
    if (selectedIds.size === 0) {
      addToast('Chưa chọn câu hỏi', 'Vui lòng chọn ít nhất 1 câu hỏi để tự động gắn thẻ thông minh (Smart Tagging).', 'warning');
      return;
    }
    vibrateTap();
    soundFx.playClick();
    const selectedList = questions.filter(q => selectedIds.has(q.id));
    setSmartTaggingSelectedQuestions(selectedList);
    setSmartTaggingTargetQuestion(selectedList[0] || null);
    setShowSmartTaggingModal(true);
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
        if (isFocusMode) {
          e.preventDefault();
          vibrateTap();
          soundFx.playClick();
          if (onToggleFocusMode) onToggleFocusMode();
          else setInternalIsFocusMode(false);
          return;
        }
      }

      // If any modal is open, don't intercept typing or editor shortcuts
      const isModalOpen =
        showAddQuestionModal ||
        showExamModal ||
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
    showAddQuestionModal, showExamModal, showBulkImportModal,
    showBulkCategoryModal, showBulkDeleteModal, showTagsManagerModal,
    showCategoriesManagerModal, showPrintPreviewModal, showExportModal, showShortcutsModal,
    isCompareModalOpen, previewQuestion, historyQuestion, activeTab, selectedIds,
    filteredQuestions
  ]);

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      {/* Sleek Minimal Focus Mode Bar */}
      {isFocusMode && (
        <div className="flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-[4px] bg-[#241148]/90 border border-amber-500/40 text-xs backdrop-blur-md shadow-md animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]" />
            <span className="font-mono font-bold text-amber-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>Focus Mode</span>
            </span>
            <span className="text-[10px] text-white/50 hidden md:inline font-mono">
              • Đã ẩn các công cụ phụ để tối đa không gian soạn câu hỏi
            </span>
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
              className="fluent-btn-primary px-2.5 py-1 text-xs flex items-center gap-1.5 cursor-pointer rounded-[4px]"
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
              className="px-2.5 py-1 rounded-[4px] bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center gap-1.5 cursor-pointer transition border border-white/20"
              title="Thoát Chế Độ Tập Trung (Alt + F hoặc Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Thoát [Alt+F / Esc]</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Banner & User Profile Header (Hidden in Focus Mode) */}
      {!isFocusMode && (
        <div className="fluent-card p-4 sm:p-5 relative rounded-[4px] shadow-md z-30">
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

            {/* Clean 1-Row Command Bar with Purpose-Grouped Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 xl:items-center relative" ref={headerMenuRef}>
              {/* Primary Action Button */}
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setSelectedQuestion(null);
                  setShowAddQuestionModal(true);
                }}
                className="fluent-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer rounded-[4px] shadow-lg shadow-theme-accent/20 hover:scale-[1.02] active:scale-[0.98] transition"
                title="Thêm Câu Hỏi Mới (Ctrl + N)"
              >
                <Plus className="w-4 h-4 text-[#190839]" />
                <span>Thêm Câu Hỏi</span>
                <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/20 text-[#190839] border border-black/20 font-bold ml-0.5">
                  Ctrl+N
                </kbd>
              </button>

              {/* Nhập Dropdown Group */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    setActiveHeaderMenu(prev => prev === 'import' ? null : 'import');
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-[4px] border flex items-center gap-1.5 cursor-pointer transition ${
                    activeHeaderMenu === 'import'
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-[#241148]/80 hover:bg-[#3E1D74]/80 text-emerald-300 border-emerald-500/30'
                  }`}
                  title="Nhập câu hỏi từ Excel, Google Drive hoặc Quét AI"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Nhập</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${activeHeaderMenu === 'import' ? 'rotate-180' : ''}`} />
                </button>

                {activeHeaderMenu === 'import' && (
                  <div className="absolute right-0 mt-2 w-64 py-1.5 bg-[#170933]/98 backdrop-blur-2xl border border-emerald-500/30 rounded-[6px] shadow-2xl shadow-black/80 z-[110] animate-fadeIn text-xs divide-y divide-white/10 font-sans">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveHeaderMenu(null);
                          setShowBulkGeneratorModal(true);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-white hover:bg-sky-600/20 transition cursor-pointer"
                      >
                        <Zap className="w-4 h-4 text-sky-400" />
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>Sinh Hàng Loạt (Antigravity)</span>
                            <span className="text-[9px] bg-sky-400/20 text-sky-300 px-1 rounded font-mono">Sandbox AI</span>
                          </div>
                          <div className="text-[10px] text-[#B6A6D8]">Sinh nhiều câu hỏi cùng lúc theo chủ đề BTI</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveHeaderMenu(null);
                          setShowBulkImportModal(true);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-white hover:bg-emerald-600/20 transition cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="font-bold">Nhập Hàng Loạt (Text/Excel)</div>
                          <div className="text-[10px] text-[#B6A6D8]">Paste từ Excel, Word hoặc tệp thô</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveHeaderMenu(null);
                          setShowGeminiScannerModal(true);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-white hover:bg-purple-600/20 transition cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-amber-300" />
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>Quét Đề AI (Camera / PDF)</span>
                            <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1 rounded font-mono">Gemini 3.8</span>
                          </div>
                          <div className="text-[10px] text-[#B6A6D8]">Chuyển ảnh/scan thành câu hỏi chuẩn</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          setActiveHeaderMenu(null);
                          handleImportFromDrive();
                        }}
                        disabled={isDrivePickerLoading}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-white hover:bg-cyan-600/20 transition cursor-pointer disabled:opacity-50"
                      >
                        <HardDrive className={`w-4 h-4 text-cyan-400 ${isDrivePickerLoading ? 'animate-spin' : ''}`} />
                        <div>
                          <div className="font-bold">Import từ Google Drive</div>
                          <div className="text-[10px] text-[#B6A6D8]">Chọn file Doc/Sheet trực tiếp từ Drive</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* AutoPilot 1-Click Master Authoring Suite */}
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setShowAllInOneModal(true);
                }}
                className="px-3.5 py-2 text-xs font-black flex items-center gap-1.5 cursor-pointer rounded-[4px] border border-amber-400/50 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:brightness-110 text-slate-950 transition shadow-md shadow-amber-500/20 active:scale-95"
                title="Studio Soạn Đề Toàn Diện 1-Click: Ôm trọn 7 công đoạn soạn thảo, nhiễu, pháp lý, IRT và biến thể"
              >
                <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
                <span>⚡ Ôm Trọn Gói (AutoPilot)</span>
              </button>

              {/* Quick Interactive Quiz Preview */}
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  const selectedList = selectedIds.size > 0 
                    ? questions.filter(q => selectedIds.has(q.id))
                    : filteredQuestions.length > 0 ? filteredQuestions : questions;
                  setInteractiveQuizQuestions(selectedList);
                  setShowInteractiveQuizModal(true);
                }}
                className="px-3 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer rounded-[4px] border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 transition shadow-sm"
                title="Mô phỏng trải nghiệm thi thử tương tác với Progress Tracker & Phản hồi tức thì"
              >
                <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">Thử Nghiệm Quiz</span>
                <span className="text-[10px] bg-amber-500/30 px-1 py-0.2 rounded font-mono font-bold">
                  {selectedIds.size > 0 ? selectedIds.size : filteredQuestions.length}
                </span>
              </button>

              {/* Quick Print A4 */}
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setShowPrintPreviewModal(true);
                }}
                className="fluent-btn-secondary px-3 py-2 text-xs flex items-center gap-1.5 cursor-pointer rounded-[4px] border border-white/15 hover:border-emerald-400/40 text-slate-200 hover:text-white transition"
                title="Xem Trước & In A4 (PDF)"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">In A4</span>
              </button>

              {/* Xuất Dropdown Group */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    setActiveHeaderMenu(prev => prev === 'export' ? null : 'export');
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-[4px] border flex items-center gap-1.5 cursor-pointer transition ${
                    activeHeaderMenu === 'export'
                      ? 'bg-sky-600 text-white border-sky-400'
                      : 'bg-[#241148]/80 hover:bg-[#3E1D74]/80 text-sky-300 border-sky-500/30'
                  }`}
                  title="Xuất Ngân Hàng Câu Hỏi thành tệp PDF hoặc JSON"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>Xuất</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${activeHeaderMenu === 'export' ? 'rotate-180' : ''}`} />
                </button>

                {activeHeaderMenu === 'export' && (
                  <div className="absolute right-0 mt-2 w-56 py-1.5 bg-[#170933]/98 backdrop-blur-2xl border border-sky-500/30 rounded-[6px] shadow-2xl shadow-black/80 z-[110] animate-fadeIn text-xs divide-y divide-white/10 font-sans">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveHeaderMenu(null);
                          setShowExportModal(true);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-white hover:bg-sky-600/20 transition cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-sky-400" />
                        <div>
                          <div className="font-bold">Xuất Đề (PDF • JSON)</div>
                          <div className="text-[10px] text-[#B6A6D8]">Tùy chọn format và chia sẻ</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveHeaderMenu(null);
                          setShowPrintPreviewModal(true);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-white hover:bg-emerald-600/20 transition cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="font-bold">In & Xuất Trang Đề A4</div>
                          <div className="text-[10px] text-[#B6A6D8]">Chuẩn A4 khảo thí chính thức</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Tools Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    setActiveHeaderMenu(prev => prev === 'ai' ? null : 'ai');
                  }}
                  className={`px-3 py-2 text-xs font-semibold rounded-[4px] border flex items-center gap-1.5 cursor-pointer transition ${
                    activeHeaderMenu === 'ai'
                      ? 'bg-purple-700 text-white border-purple-400'
                      : 'bg-[#241148]/80 hover:bg-[#3E1D74]/80 text-amber-300 border-amber-400/30'
                  }`}
                  title="Bộ công cụ trí tuệ nhân tạo Gemini AI Studio"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>AI Tools</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${activeHeaderMenu === 'ai' ? 'rotate-180' : ''}`} />
                </button>

                {activeHeaderMenu === 'ai' && (
                  <div className="absolute right-0 mt-2 w-64 py-1.5 bg-[#170933]/98 backdrop-blur-2xl border border-purple-500/40 rounded-[6px] shadow-2xl shadow-black/80 z-[110] animate-fadeIn text-xs divide-y divide-white/10 font-sans">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveHeaderMenu(null);
                          setShowAllInOneModal(true);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-white hover:bg-amber-600/30 transition cursor-pointer bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-transparent border-b border-amber-500/25"
                      >
                        <Zap className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
                        <div>
                          <div className="font-bold flex items-center gap-1 text-amber-200">
                            <span>AutoPilot Master Suite (Ôm Trọn Gói)</span>
                            <span className="text-[9px] bg-amber-400 text-slate-950 font-bold px-1 rounded font-mono">1-Click</span>
                          </div>
                          <div className="text-[10px] text-amber-300/80">Soạn ➜ Nhiễu ➜ TT 02/2025 ➜ NĐ 13 ➜ IRT ➜ 3 Biến thể</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveHeaderMenu(null);
                          setShowExamModal(true);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-white hover:bg-amber-600/20 transition cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <div>
                          <div className="font-bold flex items-center gap-1">
                            <span>AI Mock Quiz Generator</span>
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded font-mono">Auto</span>
                          </div>
                          <div className="text-[10px] text-[#B6A6D8]">Tạo đề thi cân bằng ma trận BTI</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveHeaderMenu(null);
                          setShowDuplicateCheckerModal(true);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-white hover:bg-rose-600/20 transition cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-rose-300" />
                        <div>
                          <div className="font-bold flex items-center gap-1">
                            <span>Detect Duplicates AI</span>
                            <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1 rounded font-mono">Gemini</span>
                          </div>
                          <div className="text-[10px] text-[#B6A6D8]">Quét & xử lý câu hỏi trùng lặp</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveHeaderMenu(null);
                          const target = filteredQuestions[0] || questions[0];
                          if (target) {
                            setSmartTaggingTargetQuestion(target);
                            setSmartTaggingSelectedQuestions(selectedIds.size > 0 ? questions.filter(q => selectedIds.has(q.id)) : [target]);
                            setShowSmartTaggingModal(true);
                          } else {
                            addToast('Thông báo', 'Ngân hàng câu hỏi hiện đang trống.', 'info');
                          }
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-white hover:bg-purple-600/20 transition cursor-pointer"
                      >
                        <Tag className="w-4 h-4 text-purple-300 animate-pulse" />
                        <div>
                          <div className="font-bold flex items-center gap-1">
                            <span>Smart Tagging System</span>
                            <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 rounded font-mono">Agent Antigravity</span>
                          </div>
                          <div className="text-[10px] text-[#B6A6D8]">Tự động gắn thẻ tri thức & phân tầng ma trận BTI</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveHeaderMenu(null);
                          const target = filteredQuestions[0] || questions[0];
                          if (target) {
                            setSelectedQualityReviewQuestion(target);
                            setShowQualityReviewModal(true);
                          } else {
                            addToast('Thông báo', 'Vui lòng chọn hoặc thêm câu hỏi để tiến hành thẩm định.', 'info');
                          }
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-white hover:bg-amber-600/20 transition cursor-pointer"
                      >
                        <Scale className="w-4 h-4 text-amber-300" />
                        <div>
                          <div className="font-bold flex items-center gap-1">
                            <span>Question Quality Review</span>
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded font-mono">Deep Research Pro</span>
                          </div>
                          <div className="text-[10px] text-[#B6A6D8]">Đối soát văn bản pháp lý & phát hiện thông tin lỗi thời</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveHeaderMenu(null);
                          setShowDifficultyBatchModal(true);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-white hover:bg-amber-600/20 transition cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <div>
                          <div className="font-bold flex items-center gap-1">
                            <span>Advisor Độ Khó AI</span>
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded font-mono">BTI Matrix</span>
                          </div>
                          <div className="text-[10px] text-[#B6A6D8]">Gợi ý & chuẩn hóa độ khó theo chuẩn TT 02/2025</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveHeaderMenu(null);
                          setShowSimulatorModal(true);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-white hover:bg-sky-600/20 transition cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-sky-400" />
                        <div>
                          <div className="font-bold flex items-center gap-1">
                            <span>Giả Lập An Toàn Số Tương Tác</span>
                            <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1 rounded font-mono">Sandbox</span>
                          </div>
                          <div className="text-[10px] text-[#B6A6D8]">Mô phỏng Phishing & ứng phó sự cố NĐ 13/2023</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveHeaderMenu(null);
                          setShowCertificateModal(true);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-white hover:bg-amber-600/20 transition cursor-pointer"
                      >
                        <Award className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="font-bold flex items-center gap-1">
                            <span>Chứng Nhận Năng Lực Số BTI</span>
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded font-mono">QR Seal</span>
                          </div>
                          <div className="text-[10px] text-[#B6A6D8]">Cấp chứng chỉ chuẩn TT 02/2025 kèm mã QR</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveHeaderMenu(null);
                          setShowGeminiScannerModal(true);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-white hover:bg-purple-600/20 transition cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-purple-300" />
                        <div>
                          <div className="font-bold">Quét Đề AI (Camera / PDF)</div>
                          <div className="text-[10px] text-[#B6A6D8]">Tự động bóc tách từ ảnh & file</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Overflow More (...) Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    setActiveHeaderMenu(prev => prev === 'more' ? null : 'more');
                  }}
                  className={`px-2.5 py-2 text-xs font-semibold rounded-[4px] border flex items-center gap-1 cursor-pointer transition ${
                    activeHeaderMenu === 'more'
                      ? 'bg-theme-accent text-[#190839] border-theme-accent'
                      : 'bg-[#241148]/80 hover:bg-[#3E1D74]/80 text-[#F5EFF9]/80 hover:text-white border-theme-accent/25'
                  }`}
                  title="Thêm tiện ích & quản lý khác"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {activeHeaderMenu === 'more' && (
                  <div className="absolute right-0 mt-2 w-60 py-1.5 bg-[#170933]/98 backdrop-blur-2xl border border-theme-accent/30 rounded-[6px] shadow-2xl shadow-black/80 z-[110] animate-fadeIn text-xs divide-y divide-white/10 font-sans">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveHeaderMenu(null);
                          setShowBtiMatrixQuickPopup(true);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-white hover:bg-white/10 transition cursor-pointer"
                      >
                        <Target className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="font-bold">Tra Cứu Ma Trận BTI</div>
                          <div className="text-[10px] text-[#B6A6D8]">Kiểm tra độ phủ khung năng lực số</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveHeaderMenu(null);
                          setShowTagsManagerModal(true);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-white hover:bg-white/10 transition cursor-pointer"
                      >
                        <Tag className="w-4 h-4 text-purple-400" />
                        <div>
                          <div className="font-bold">Quản Lý Tags</div>
                          <div className="text-[10px] text-[#B6A6D8]">Thẻ phân loại câu hỏi</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveHeaderMenu(null);
                          setShowCategoriesManagerModal(true);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-white hover:bg-white/10 transition cursor-pointer"
                      >
                        <FolderPlus className="w-4 h-4 text-sky-400" />
                        <div>
                          <div className="font-bold">Quản Lý Danh Mục</div>
                          <div className="text-[10px] text-[#B6A6D8]">Cấu trúc cây chủ đề & miền năng lực</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveHeaderMenu(null);
                          setShowShortcutsModal(true);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center justify-between text-white hover:bg-white/10 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Keyboard className="w-4 h-4 text-amber-300" />
                          <span>Bảng Phím Tắt</span>
                        </div>
                        <kbd className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 text-theme-accent border border-theme-accent/30 font-bold">
                          Ctrl+K
                        </kbd>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveHeaderMenu(null);
                          if (onToggleFocusMode) onToggleFocusMode();
                          else setInternalIsFocusMode(true);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center justify-between text-amber-300 hover:bg-amber-500/10 transition cursor-pointer border-t border-white/10 mt-1 pt-2 font-medium"
                      >
                        <div className="flex items-center gap-2.5">
                          <Target className="w-4 h-4 text-amber-400" />
                          <span>Bật Focus Mode</span>
                        </div>
                        <kbd className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 text-amber-300 border border-amber-500/30 font-bold">
                          Alt+F
                        </kbd>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
        <div className="bg-[#241148]/60 p-1 rounded-[4px] border border-theme-accent/20 flex overflow-x-auto sm:overflow-visible gap-1 backdrop-blur-md items-center relative z-20">
          {/* Tab 1: Tổng Quan */}
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

          {/* Tab 2: Kho Câu Hỏi */}
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

          {/* Tab 3: Kiểm Duyệt (with Pending Count Badge) */}
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
            <ShieldCheck className={`w-4 h-4 ${activeTab === 'MODERATION' ? 'text-[#190839]' : 'text-emerald-400'}`} />
            <span>Kiểm Duyệt</span>
            {pendingModerationCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'MODERATION'
                  ? 'bg-[#190839] text-amber-300'
                  : 'bg-amber-400 text-slate-950 shadow-sm'
              }`}>
                {pendingModerationCount}
              </span>
            )}
          </button>

          {/* Tab 4: AI Studio */}
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
            <Sparkles className={`w-4 h-4 ${activeTab === 'AI_STUDIO' ? 'text-[#190839]' : 'text-amber-400'}`} />
            <span>AI Studio</span>
          </button>

          {/* Tab 5: Công Cụ Dropdown (Excel Hub, Scenarios, Legal Docs, Matrix) */}
          <div className="relative shrink-0" ref={toolsDropdownRef}>
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                setIsToolsDropdownOpen(prev => !prev);
              }}
              className={`px-3.5 py-2 rounded-[4px] text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                ['EXCEL_HUB', 'SCENARIOS', 'LEGAL_DOCS', 'MATRIX'].includes(activeTab)
                  ? 'bg-theme-accent text-[#190839] shadow-md shadow-theme-accent/20 font-bold'
                  : 'text-[#F5EFF9]/75 hover:text-white hover:bg-white/10'
              }`}
            >
              {activeTab === 'EXCEL_HUB' && <FileSpreadsheet className="w-4 h-4 text-emerald-900" />}
              {activeTab === 'SCENARIOS' && <Theater className="w-4 h-4 text-purple-900" />}
              {activeTab === 'LEGAL_DOCS' && <Scale className="w-4 h-4 text-amber-900" />}
              {activeTab === 'MATRIX' && <BarChart3 className="w-4 h-4 text-[#190839]" />}
              {activeTab === 'STATS' && <TrendingUp className="w-4 h-4 text-purple-300" />}
              {activeTab === 'PRACTICE' && <PlayCircle className="w-4 h-4 text-emerald-300" />}
              {!['EXCEL_HUB', 'SCENARIOS', 'LEGAL_DOCS', 'MATRIX', 'STATS', 'PRACTICE'].includes(activeTab) && (
                <FolderPlus className="w-4 h-4 text-purple-300" />
              )}

              <span>
                {activeTab === 'EXCEL_HUB' && 'Mẫu Excel'}
                {activeTab === 'SCENARIOS' && 'Kịch Tương Tác'}
                {activeTab === 'LEGAL_DOCS' && 'Thư Viện Pháp Lý'}
                {activeTab === 'MATRIX' && 'Ma Trận BTI'}
                {activeTab === 'STATS' && 'Thống Kê'}
                {activeTab === 'PRACTICE' && 'Thi Thử'}
                {!['EXCEL_HUB', 'SCENARIOS', 'LEGAL_DOCS', 'MATRIX', 'STATS', 'PRACTICE'].includes(activeTab) && 'Công Cụ Mở Rộng'}
              </span>

              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isToolsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isToolsDropdownOpen && (
              <div className="absolute right-0 sm:left-0 mt-2 w-64 py-1.5 bg-[#170933]/98 backdrop-blur-2xl border border-theme-accent/30 rounded-[6px] shadow-2xl shadow-black/80 z-[110] animate-fadeIn text-xs divide-y divide-white/10 font-sans">
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      soundFx.playClick();
                      setActiveTab('EXCEL_HUB');
                      setIsToolsDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between transition cursor-pointer ${
                      activeTab === 'EXCEL_HUB'
                        ? 'bg-theme-accent/20 text-theme-accent font-bold'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>Mẫu Excel Phần Mềm Thi</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      soundFx.playClick();
                      setActiveTab('SCENARIOS');
                      setIsToolsDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between transition cursor-pointer ${
                      activeTab === 'SCENARIOS'
                        ? 'bg-theme-accent/20 text-theme-accent font-bold'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Theater className="w-4 h-4 text-purple-400" />
                      <span>Kịch Tương Tác</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      {stats.scenariosCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      soundFx.playClick();
                      setActiveTab('LEGAL_DOCS');
                      setIsToolsDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between transition cursor-pointer ${
                      activeTab === 'LEGAL_DOCS'
                        ? 'bg-theme-accent/20 text-theme-accent font-bold'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Scale className="w-4 h-4 text-amber-400" />
                      <span>Thư Viện Pháp Lý</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      {stats.documentsCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      soundFx.playClick();
                      setActiveTab('MATRIX');
                      setIsToolsDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between transition cursor-pointer ${
                      activeTab === 'MATRIX'
                        ? 'bg-theme-accent/20 text-theme-accent font-bold'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className="w-4 h-4 text-theme-accent" />
                      <span>Ma Trận &amp; Độ Phủ BTI</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      soundFx.playClick();
                      setActiveTab('STATS');
                      setIsToolsDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between transition cursor-pointer ${
                      activeTab === 'STATS'
                        ? 'bg-theme-accent/20 text-theme-accent font-bold'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span>Thống Kê Ngân Hàng</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      soundFx.playClick();
                      setActiveTab('PRACTICE');
                      setIsToolsDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between transition cursor-pointer ${
                      activeTab === 'PRACTICE'
                        ? 'bg-theme-accent/20 text-theme-accent font-bold'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <PlayCircle className="w-4 h-4 text-emerald-400" />
                      <span>Thi Thử BTI 2026</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
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
          onOpenBulkGenerator={() => {
            setShowBulkGeneratorModal(true);
          }}
          onOpenExamGenerator={() => {
            setShowExamModal(true);
          }}
          onOpenDuplicateChecker={() => {
            setShowDuplicateCheckerModal(true);
          }}
          onOpenSimulator={() => {
            setShowSimulatorModal(true);
          }}
          onOpenCertificate={() => {
            setShowCertificateModal(true);
          }}
        />
      )}

      {/* TAB 1: QUESTIONS REPOSITORY */}
      {activeTab === 'QUESTIONS' && (
        <div className="space-y-4">
          {/* Dashboard Overview Header Section (Visual Recharts Composition - Collapsible on demand) */}
          {!isFocusMode && showOverviewHeaderInQuestions && (
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

          {/* Enhanced Search & Filter Bar */}
          <QuestionBankFilterBar
            isFocusMode={isFocusMode}
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

          {/* DEDICATED BULK ACTION TOOLBAR (Accessible whenever selection mode is active or questions are selected) */}
          {(isSelectionMode || selectedIds.size > 0) && filteredQuestions.length > 0 && (
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
              onBatchAutoPilot={() => setShowAllInOneModal(true)}
              onBatchDifficultySuggest={() => setShowDifficultyBatchModal(true)}
              onDetectDuplicates={() => setShowDuplicateCheckerModal(true)}
              onChangeStatus={handleBatchStatusChange}
              onExportSelected={handleExportSelected}
              onCompareSelected={() => setIsCompareModalOpen(true)}
              onInteractiveQuizPreview={() => {
                vibrateTap();
                soundFx.playClick();
                const selectedList = questions.filter(q => selectedIds.has(q.id));
                setInteractiveQuizQuestions(selectedList);
                setShowInteractiveQuizModal(true);
              }}
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

            {/* Right side: Reindex and quick filter reset actions */}
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

              {/* Quick Analytics Toggle */}
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setShowOverviewHeaderInQuestions(prev => !prev);
                }}
                className={`px-2 py-1 rounded-[3px] text-[11px] font-mono flex items-center gap-1 transition cursor-pointer border ${
                  showOverviewHeaderInQuestions
                    ? 'bg-theme-accent text-[#190839] border-theme-accent font-bold shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border-white/10'
                }`}
                title="Bật/Tắt biểu đồ phân tích cơ cấu ngân hàng đề"
              >
                <BarChart3 className="w-3 h-3 text-theme-accent" />
                <span className="hidden sm:inline">{showOverviewHeaderInQuestions ? 'Ẩn biểu đồ' : 'Biểu đồ'}</span>
              </button>

              {(filteredQuestions.length !== questions.length || searchQuery || filterRoundGroup !== 'ALL' || filterLevel !== 'ALL' || filterStatus !== 'ALL') && (
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="px-2 py-1 rounded-[3px] bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[11px] font-mono flex items-center gap-1 transition cursor-pointer"
                  title="Xóa tất cả bộ lọc hiện tại để xem toàn bộ ngân hàng câu hỏi"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">Đặt lại bộ lọc</span>
                </button>
              )}
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
                              setSmartTaggingTargetQuestion(q);
                              setSmartTaggingSelectedQuestions([q]);
                              setShowSmartTaggingModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-purple-300 hover:bg-purple-950/40 rounded transition cursor-pointer"
                            title="Smart Tagging AI (Agent Antigravity): Gợi ý thẻ tri thức & ma trận TT 02/2025"
                          >
                            <Tag className="w-3.5 h-3.5 text-purple-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              vibrateTap();
                              soundFx.playClick();
                              setSelectedQualityReviewQuestion(q);
                              setShowQualityReviewModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-amber-300 hover:bg-amber-950/40 rounded transition cursor-pointer"
                            title="Thẩm định Deep Research Pro: Đối soát văn bản pháp quy & phát hiện lỗi thời"
                          >
                            <Scale className="w-3.5 h-3.5 text-amber-400" />
                          </button>
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
                                  setSelectedQualityReviewQuestion(q);
                                  setShowQualityReviewModal(true);
                                }}
                                className="px-2.5 py-1.5 rounded-[4px] bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-200 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                                title="Thẩm định chất lượng & Đối soát pháp quy với Deep Research Pro"
                              >
                                <Scale className="w-3.5 h-3.5 text-amber-300" />
                                <span>Thẩm định Deep Research</span>
                              </button>

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
                                      <span className="leading-relaxed mt-0.5 break-words">
                                    <HighlightedText text={String(v)} searchQuery={searchQuery} />
                                  </span>
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
                                  — <HighlightedText text={q.explanation} searchQuery={searchQuery} />
                                </span>
                              )}
                            </div>

                            {q.legal_reference && (
                              <div className="inline-flex items-start gap-1.5 bg-amber-500/10 text-amber-300/95 px-2.5 py-1 rounded-[4px] border border-amber-500/25 text-[11px] font-mono leading-relaxed break-words">
                                <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span><HighlightedText text={q.legal_reference} searchQuery={searchQuery} /></span>
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
                            setSmartTaggingTargetQuestion(q);
                            setSmartTaggingSelectedQuestions([q]);
                            setShowSmartTaggingModal(true);
                          }}
                          className="px-2.5 py-1 rounded-[4px] bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-500/40 text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                          title="Smart Tagging (Agent Antigravity): Gắn thẻ tri thức & phân tầng năng lực số"
                        >
                          <Tag className="w-3.5 h-3.5 text-purple-300" />
                          <span>Smart Tag AI</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            vibrateTap();
                            soundFx.playClick();
                            setSelectedQualityReviewQuestion(q);
                            setShowQualityReviewModal(true);
                          }}
                          className="px-2.5 py-1 rounded-[4px] bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                          title="Thẩm định Deep Research Pro: Đối soát pháp quy & Phát hiện mâu thuẫn/lỗi thời"
                        >
                          <Scale className="w-3.5 h-3.5 text-amber-300" />
                          <span>Thẩm định Deep Research</span>
                        </button>

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
                      <HighlightedText text={q.question_text} searchQuery={searchQuery} />
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
                                      <span className="text-slate-200 leading-relaxed font-sans mt-0.5">
                                        <HighlightedText text={text} searchQuery={searchQuery} />
                                      </span>
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
                            — <HighlightedText text={q.explanation} searchQuery={searchQuery} />
                          </span>
                        )}
                      </div>

                      {q.legal_reference && (
                        <div className="inline-flex items-start gap-1.5 bg-amber-500/10 text-amber-300/95 px-2.5 py-1 rounded-[4px] border border-amber-500/25 text-[11px] font-mono leading-relaxed break-words">
                          <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span><HighlightedText text={q.legal_reference} searchQuery={searchQuery} /></span>
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

      {/* TAB: STATS - Thống Kê Ngân Hàng Đề */}
      {activeTab === 'STATS' && (
        <QuestionBankStatsView />
      )}

      {/* TAB: PRACTICE - Thi Thử BTI 2026 */}
      {activeTab === 'PRACTICE' && (
        <PracticeExamView onClose={() => setActiveTab('OVERVIEW')} />
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
        filterContextLabel={[
          filterRoundGroup !== 'ALL' ? `Vòng ${filterRoundGroup}` : '',
          filterDomain !== 'ALL' ? `Miền ${filterDomain}` : '',
          filterLevel !== 'ALL' ? filterLevel : '',
          searchQuery ? `"${searchQuery}"` : ''
        ].filter(Boolean).join(' • ')}
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

      {/* Bulk Question Generator Modal (Agent Antigravity) */}
      {showBulkGeneratorModal && (
        <BulkQuestionGeneratorModal
          isOpen={showBulkGeneratorModal}
          onClose={() => setShowBulkGeneratorModal(false)}
          onQuestionsAdded={(newQuestions) => {
            notifyBulkImport(newQuestions.length);
            addToast(
              '⚡ Agent Antigravity sinh thành công!',
              `Đã thêm ${newQuestions.length} câu hỏi trắc nghiệm chất lượng cao vào ngân hàng câu hỏi.`,
              'success'
            );
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

      {/* Feature: Question Quality Review with Deep Research Pro */}
      {showQualityReviewModal && (
        <QuestionQualityReviewModal
          isOpen={showQualityReviewModal}
          question={selectedQualityReviewQuestion}
          onClose={() => {
            setShowQualityReviewModal(false);
            setSelectedQualityReviewQuestion(null);
          }}
          onQuestionUpdated={(updatedQ) => {
            setQuestions(questionBankManager.getQuestions());
            setStats(questionBankManager.getMatrixStats());
          }}
          onShowToast={(title, msg, type) => {
            addToast(title, msg, type as any || 'success');
          }}
        />
      )}

      {/* Feature: Interactive Quiz Preview Simulator Modal */}
      {showInteractiveQuizModal && (
        <InteractiveQuizPreviewModal
          isOpen={showInteractiveQuizModal}
          initialQuestions={interactiveQuizQuestions}
          allAvailableQuestions={filteredQuestions}
          filterContextLabel={filterContextLabel}
          onClose={() => {
            setShowInteractiveQuizModal(false);
            setInteractiveQuizQuestions([]);
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

      {/* Feature 2: Question Variants & Distractor Generator Modal */}
      {showVariantModal && (
        <QuestionVariantsModal
          isOpen={showVariantModal}
          question={selectedVariantQuestion}
          onClose={() => {
            setShowVariantModal(false);
            setSelectedVariantQuestion(null);
          }}
          onVariantsAdded={(count) => {
            setQuestions(questionBankManager.getQuestions());
            setStats(questionBankManager.getMatrixStats());
            addToast('Sinh biến thể thành công!', `Đã tạo và thêm ${count} mã đề biến thể vào ngân hàng đề thi.`, 'success');
          }}
        />
      )}

      {/* Feature 2: Psychometric Item Analysis & IRT Diagnostics Modal */}
      {showPsychometricModal && (
        <PsychometricItemAnalysisModal
          isOpen={showPsychometricModal}
          question={selectedPsychometricQuestion}
          onClose={() => {
            setShowPsychometricModal(false);
            setSelectedPsychometricQuestion(null);
          }}
        />
      )}

      {/* Feature 3: Interactive Cyber Safety Simulator Modal */}
      {showSimulatorModal && (
        <InteractiveScenarioSimulatorModal
          isOpen={showSimulatorModal}
          onClose={() => setShowSimulatorModal(false)}
        />
      )}

      {/* Feature 3: AI MC Voice Reader Modal */}
      {showVoiceReaderModal && (
        <AiVoiceReaderModal
          isOpen={showVoiceReaderModal}
          question={selectedVoiceQuestion}
          onClose={() => {
            setShowVoiceReaderModal(false);
            setSelectedVoiceQuestion(null);
          }}
        />
      )}

      {/* Feature 4: Multi-Tier Approval & Digital Signature Modal */}
      {showApprovalModal && (
        <MultiTierApprovalWorkflowModal
          isOpen={showApprovalModal}
          question={selectedApprovalQuestion}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedApprovalQuestion(null);
          }}
          onUpdated={() => {
            setQuestions(questionBankManager.getQuestions());
            setStats(questionBankManager.getMatrixStats());
            addToast('Phê duyệt thành công', 'Câu hỏi đã được ký số và phê duyệt vào ngân hàng đề.', 'success');
          }}
        />
      )}

      {/* Feature 4: BTI Digital Certificate Modal */}
      {showCertificateModal && (
        <BtiDigitalCertificateModal
          isOpen={showCertificateModal}
          onClose={() => setShowCertificateModal(false)}
        />
      )}

      {/* Smart Tagging System (Agent Antigravity) Modal */}
      {showSmartTaggingModal && (
        <SmartTaggingModal
          isOpen={showSmartTaggingModal}
          onClose={() => {
            setShowSmartTaggingModal(false);
            setSmartTaggingTargetQuestion(null);
            setSmartTaggingSelectedQuestions([]);
          }}
          targetQuestion={smartTaggingTargetQuestion}
          selectedQuestions={smartTaggingSelectedQuestions}
          allQuestions={questions}
          onShowToast={(title, msg, type) => addToast(title, msg, type)}
          onQuestionUpdated={(updatedQ) => {
            setQuestions(questionBankManager.getQuestions());
            setStats(questionBankManager.getMatrixStats());
          }}
        />
      )}

      {/* All-in-One 1-Click Master Authoring Suite Modal */}
      {showAllInOneModal && (
        <AllInOneAuthoringSuiteModal
          isOpen={showAllInOneModal}
          onClose={() => setShowAllInOneModal(false)}
          onSuccessAdded={(count) => {
            setQuestions(questionBankManager.getQuestions());
            setStats(questionBankManager.getMatrixStats());
            addToast('Hoàn tất thêm đề thi', `Đã thêm thành công ${count} câu hỏi vào ngân hàng đề BTI 2026.`, 'success');
          }}
          onShowToast={(title, msg, type) => addToast(title, msg, type)}
        />
      )}

      {/* Mobile Floating Action Button (FAB) */}
      <div className="sm:hidden fixed bottom-16 right-4 z-40">
        <button
          type="button"
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            setSelectedQuestion(null);
            setShowAddQuestionModal(true);
          }}
          className="w-12 h-12 rounded-full bg-theme-accent text-[#190839] shadow-xl shadow-theme-accent/40 flex items-center justify-center font-bold active:scale-95 transition-transform border border-white/20 cursor-pointer"
          aria-label="Thêm câu hỏi mới"
        >
          <Plus className="w-6 h-6 text-[#190839]" />
        </button>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Thanh điều hướng di động"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c031d]/95 backdrop-blur-xl border-t border-theme-accent/20 px-2 py-1.5 flex items-center justify-around shadow-2xl"
      >
        <button
          type="button"
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            setActiveTab('QUESTIONS');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded font-sans transition cursor-pointer ${
            activeTab === 'QUESTIONS' ? 'text-theme-accent font-bold' : 'text-[#B6A6D8] hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] leading-tight">Câu Hỏi</span>
        </button>

        <button
          type="button"
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            setActiveTab('OVERVIEW');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded font-sans transition cursor-pointer ${
            activeTab === 'OVERVIEW' ? 'text-theme-accent font-bold' : 'text-[#B6A6D8] hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px] leading-tight">Tổng Quan</span>
        </button>

        <button
          type="button"
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            setActiveTab('MODERATION');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded font-sans relative transition cursor-pointer ${
            activeTab === 'MODERATION' ? 'text-theme-accent font-bold' : 'text-[#B6A6D8] hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] leading-tight">Kiểm Duyệt</span>
          {pendingModerationCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            setActiveTab('AI_STUDIO');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded font-sans transition cursor-pointer ${
            activeTab === 'AI_STUDIO' ? 'text-theme-accent font-bold' : 'text-[#B6A6D8] hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] leading-tight">AI Studio</span>
        </button>

        <button
          type="button"
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            setIsToolsDropdownOpen(prev => !prev);
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded font-sans transition cursor-pointer ${
            ['EXCEL_HUB', 'SCENARIOS', 'LEGAL_DOCS', 'MATRIX'].includes(activeTab)
              ? 'text-theme-accent font-bold'
              : 'text-[#B6A6D8] hover:text-white'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span className="text-[10px] leading-tight">Công Cụ</span>
        </button>
      </nav>

      {/* Question Bank Toast Notifications Container */}
      <QuestionBankToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
