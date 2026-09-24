import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Plus, 
  Save, 
  Sparkles, 
  Scale, 
  Layers, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  FileText, 
  HelpCircle,
  Hash,
  Award,
  Video,
  Image as ImageIcon,
  Volume2,
  Target,
  Users,
  Upload,
  Keyboard,
  Wand2,
  Bot,
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Loader2,
  Undo2,
  Redo2,
  History,
  Eye,
  Trash2,
  WifiOff,
  HardDrive,
  Check,
  RotateCcw
} from 'lucide-react';
import { 
  QuestionItem, 
  CompetitionStage, 
  CognitiveLevel, 
  DigitalCompetencyDomainKey, 
  QuestionRoundFormat, 
  RoundType 
} from '../../types';
import { 
  DIGITAL_COMPETENCY_DOMAINS, 
  COGNITIVE_LEVELS, 
  COMPETITION_STAGES,
  QUESTION_ROUND_FORMATS,
  BTI_ROUND_GROUPS,
  BtiRoundGroupKey,
  getActiveFormatsForRoundGroup,
  getRoundGroupByFormat,
  getRoundGroupsForStage
} from '../../data/digitalCompetencyData';
import { questionBankManager } from '../../services/questionBankManager';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateError, vibrateWarning } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { useQuestionBankToasts } from './QuestionBankToast';
import { questionDraftService, QuestionDraft } from '../../services/questionDraftService';
import { generateAutoTagsWithAI, mergeTagsList } from '../../services/aiAutoTaggingService';
import { GooglePickerTriggerButton } from '../common/GooglePickerTriggerButton';
import { googlePickerService } from '../../services/googlePickerService';

const SUGGESTED_AI_TOPICS = [
  'Deepfake & Giả mạo giọng nói AI',
  'Bảo vệ dữ liệu cá nhân Nghị định 13/2023',
  'Phishing & Lừa đảo OTP ngân hàng',
  'Liêm chính học thuật & GenAI',
  'Dấu chân số & Quyền riêng tư',
  'Tấn công Social Engineering',
  'Bản quyền sở hữu trí tuệ số',
  'An toàn mạng xã hội & Bắt nạt mạng'
];

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionToEdit?: QuestionItem | null;
  onSaved?: (savedQuestion: QuestionItem) => void;
  initialRoundGroup?: BtiRoundGroupKey;
  initialDomain?: string;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  onClose,
  questionToEdit,
  onSaved,
  initialRoundGroup,
  initialDomain
}) => {
  const documents = questionBankManager.getDocuments();

  // Basic info
  const [questionId, setQuestionId] = useState<string>('');
  const [stage, setStage] = useState<CompetitionStage>('BAN_KET_1');
  const [roundGroup, setRoundGroup] = useState<BtiRoundGroupKey>('KHOI_DONG');
  const [roundFormat, setRoundFormat] = useState<QuestionRoundFormat>('KHOI_DONG_RIENG');
  const [roundName, setRoundName] = useState<string>('Vòng 1: Khởi động');
  const [roundType, setRoundType] = useState<RoundType>('MULTIPLE_CHOICE');
  const [timeLimit, setTimeLimit] = useState<number>(15);
  const [points, setPoints] = useState<number>(10);

  // Khởi động turn selection (Riêng vs Chung)
  const [kdTurn, setKdTurn] = useState<'RIENG' | 'CHUNG'>('RIENG');

  // Digital Competency and Taxonomy states
  const [domain, setDomain] = useState<DigitalCompetencyDomainKey>((initialDomain as DigitalCompetencyDomainKey) || 'MIEN_4');
  const [subCompetency, setSubCompetency] = useState<string>('4.1');
  const [cognitiveLevel, setCognitiveLevel] = useState<CognitiveLevel>('THONG_HIEU');
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('Tư duy Logic');
  const [legalReference, setLegalReference] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');

  // VCNV obstacle image upload
  const [vcnvImage, setVcnvImage] = useState<string>('');

  // Question content
  const [questionText, setQuestionText] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');

  // Media
  const [mediaType, setMediaType] = useState<'NONE' | 'IMAGE' | 'VIDEO' | 'AUDIO'>('NONE');
  const [mediaUrl, setMediaUrl] = useState<string>('');

  // Option states
  const [optionCount, setOptionCount] = useState<number>(4);
  const [optionA, setOptionA] = useState<string>('');
  const [optionB, setOptionB] = useState<string>('');
  const [optionC, setOptionC] = useState<string>('');
  const [optionD, setOptionD] = useState<string>('');
  const [optionE, setOptionE] = useState<string>('');
  const [optionF, setOptionF] = useState<string>('');
  const [correctKey, setCorrectKey] = useState<string>('A');

  // TRUE_FALSE_4 items state (Part II Bộ GD&ĐT & Về Đích 4.1)
  const [tfItems, setTfItems] = useState([
    { key: 'a', text: '', isCorrect: true },
    { key: 'b', text: '', isCorrect: false },
    { key: 'c', text: '', isCorrect: false },
    { key: 'd', text: '', isCorrect: true },
  ]);

  // Helper count letters excluding spaces
  const countLetters = (str: string = '') => str.replace(/\s+/g, '').length;

  // VCNV states (7-row layout according to BTI 2026 specs)
  // Row 1: Obstacle keyword -> correctKey
  // Row 2: Risk question & answer
  const [vcnvRiskQuestion, setVcnvRiskQuestion] = useState('');
  const [vcnvRiskAnswer, setVcnvRiskAnswer] = useState('');
  // Row 3-6: Horizontal clues & answers
  const [vcnvClue1, setVcnvClue1] = useState('');
  const [vcnvAns1, setVcnvAns1] = useState('');
  const [vcnvClue2, setVcnvClue2] = useState('');
  const [vcnvAns2, setVcnvAns2] = useState('');
  const [vcnvClue3, setVcnvClue3] = useState('');
  const [vcnvAns3, setVcnvAns3] = useState('');
  const [vcnvClue4, setVcnvClue4] = useState('');
  const [vcnvAns4, setVcnvAns4] = useState('');
  // Row 7: Center clue & answer
  const [vcnvCenter, setVcnvCenter] = useState('');
  const [vcnvCenterAns, setVcnvCenterAns] = useState('');

  // Similarity state
  const [similarQuestions, setSimilarQuestions] = useState<{question: QuestionItem, score: number}[]>([]);

  // Tags collapse state
  const [isTagsExpanded, setIsTagsExpanded] = useState<boolean>(false);

  // AI Auto-Tagging State
  const [isGeneratingAutoTags, setIsGeneratingAutoTags] = useState<boolean>(false);
  const [aiSuggestedTags, setAiSuggestedTags] = useState<string[]>([]);
  const [aiTagReasoning, setAiTagReasoning] = useState<string>('');

  const handleAutoTagWithAI = async () => {
    if (!questionText.trim()) {
      soundFx.playWarning();
      vibrateWarning();
      alert('Vui lòng nhập nội dung câu hỏi trước để AI phân tích và tự động đề xuất thẻ (Auto-Tag).');
      return;
    }
    setIsGeneratingAutoTags(true);
    vibrateTap();
    try {
      const result = await generateAutoTagsWithAI({
        questionText,
        options: { A: optionA, B: optionB, C: optionC, D: optionD },
        explanation,
        legalReference,
        domain,
        cognitiveLevel,
        existingTags: tagsInput.split(',').map(t => t.trim()).filter(Boolean)
      });

      if (result.suggestedTags && result.suggestedTags.length > 0) {
        setAiSuggestedTags(result.suggestedTags);
        setAiTagReasoning(result.reasoning || '');
        const merged = mergeTagsList(tagsInput, result.suggestedTags);
        setTagsInput(merged);

        if (result.suggestedDomain && DIGITAL_COMPETENCY_DOMAINS[result.suggestedDomain]) {
          setDomain(result.suggestedDomain);
        }
        if (result.suggestedCognitiveLevel && COGNITIVE_LEVELS[result.suggestedCognitiveLevel]) {
          setCognitiveLevel(result.suggestedCognitiveLevel);
        }

        soundFx.playCorrect();
        vibrateSuccess();
      }
    } catch (err: any) {
      console.error('Auto-tag error:', err);
      soundFx.playError();
      vibrateError();
    } finally {
      setIsGeneratingAutoTags(false);
    }
  };

  // ==========================================
  // AUTO-SAVE & DRAFT RECOVERY ENGINE (LOCALSTORAGE)
  // ==========================================
  const draftKey = questionToEdit ? `edit_${questionToEdit.id}` : 'new';
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [detectedDraft, setDetectedDraft] = useState<QuestionDraft | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState<boolean>(false);
  const [showDraftPreviewModal, setShowDraftPreviewModal] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [draftToastMessage, setDraftToastMessage] = useState<string | null>(null);

  // Live state reference for zero-latency captures on unload / interval
  const draftStateRef = useRef<any>(null);
  useEffect(() => {
    draftStateRef.current = {
      stage, roundGroup, roundFormat, roundName, roundType, timeLimit, points, kdTurn, vcnvImage,
      domain, subCompetency, cognitiveLevel, legalReference, tagsInput,
      questionText, explanation, mediaType, mediaUrl, optionCount,
      optionA, optionB, optionC, optionD, optionE, optionF, correctKey, tfItems,
      vcnvRiskQuestion, vcnvRiskAnswer, vcnvClue1, vcnvAns1, vcnvClue2, vcnvAns2, vcnvClue3, vcnvAns3, vcnvClue4, vcnvAns4, vcnvCenter, vcnvCenterAns
    };
  });

  // Sync draft save immediately to LocalStorage
  const performSaveDraft = useCallback((isManual = false) => {
    const currentState = draftStateRef.current;
    if (!currentState) return false;

    const saved = questionDraftService.saveDraft(draftKey, currentState);
    if (saved) {
      setLastSavedTime(new Date());
      setIsAutoSaving(true);
      setTimeout(() => setIsAutoSaving(false), 800);
      if (isManual) {
        soundFx.playCorrect();
        vibrateSuccess();
        setDraftToastMessage('✓ Đã lưu nháp an toàn vào LocalStorage!');
        setTimeout(() => setDraftToastMessage(null), 3000);
      }
      return true;
    }
    return false;
  }, [draftKey]);

  // Check for existing draft on modal open
  useEffect(() => {
    if (!isOpen) {
      setShowDraftBanner(false);
      setDetectedDraft(null);
      return;
    }

    const savedDraft = questionDraftService.getDraft(draftKey);
    if (savedDraft && questionDraftService.isMeaningful(savedDraft)) {
      setDetectedDraft(savedDraft);
      setShowDraftBanner(true);
      if (savedDraft.savedAt) {
        setLastSavedTime(new Date(savedDraft.savedAt));
      }
    } else {
      setShowDraftBanner(false);
      setDetectedDraft(null);
    }
  }, [isOpen, draftKey]);

  // Debounced auto-save on any change + periodic timer
  useEffect(() => {
    if (!isOpen) return;

    // Debounced save 1.5s after user pauses typing
    const debounceTimer = setTimeout(() => {
      performSaveDraft(false);
    }, 1500);

    return () => clearTimeout(debounceTimer);
  }, [
    isOpen,
    stage, roundGroup, roundFormat, roundName, roundType, timeLimit, points, kdTurn, vcnvImage,
    domain, subCompetency, cognitiveLevel, legalReference, tagsInput,
    questionText, explanation, mediaType, mediaUrl, optionCount,
    optionA, optionB, optionC, optionD, optionE, optionF, correctKey, tfItems,
    vcnvRiskQuestion, vcnvRiskAnswer, vcnvClue1, vcnvAns1, vcnvClue2, vcnvAns2, vcnvClue3, vcnvAns3, vcnvClue4, vcnvAns4, vcnvCenter, vcnvCenterAns,
    performSaveDraft
  ]);

  // Periodic interval backup every 10 seconds
  useEffect(() => {
    if (!isOpen) return;

    const intervalTimer = setInterval(() => {
      performSaveDraft(false);
    }, 10000);

    return () => clearInterval(intervalTimer);
  }, [isOpen, performSaveDraft]);

  // Lifecycle listeners: Save on tab close (beforeunload), pagehide, and visibilitychange
  useEffect(() => {
    if (!isOpen) return;

    const handleBeforeUnload = () => {
      performSaveDraft(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        performSaveDraft(false);
      }
    };

    const handleOnline = () => {
      setIsOffline(false);
      setDraftToastMessage('🟢 Đã khôi phục kết nối mạng!');
      setTimeout(() => setDraftToastMessage(null), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      performSaveDraft(false);
      setDraftToastMessage('⚠️ Đã mất kết nối mạng. Bản nháp được lưu an toàn 100% trong máy!');
      setTimeout(() => setDraftToastMessage(null), 4000);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOpen, performSaveDraft]);

  // Handle restoring a saved draft into form state
  const handleRestoreDraft = (targetDraft?: QuestionDraft | null) => {
    const d = targetDraft || detectedDraft || questionDraftService.getDraft(draftKey);
    if (!d) return;

    try {
      if (d.stage !== undefined) setStage(d.stage);
      if (d.roundGroup !== undefined) setRoundGroup(d.roundGroup);
      if (d.roundFormat !== undefined) setRoundFormat(d.roundFormat);
      if (d.roundName !== undefined) setRoundName(d.roundName);
      if (d.roundType !== undefined) setRoundType(d.roundType);
      if (d.timeLimit !== undefined) setTimeLimit(d.timeLimit);
      if (d.points !== undefined) setPoints(d.points);
      if (d.kdTurn !== undefined) setKdTurn(d.kdTurn);
      if (d.vcnvImage !== undefined) setVcnvImage(d.vcnvImage);
      if (d.domain !== undefined) setDomain(d.domain);
      if (d.subCompetency !== undefined) setSubCompetency(d.subCompetency);
      if (d.cognitiveLevel !== undefined) setCognitiveLevel(d.cognitiveLevel);
      if (d.legalReference !== undefined) setLegalReference(d.legalReference);
      if (d.tagsInput !== undefined) setTagsInput(d.tagsInput);
      if (d.questionText !== undefined) setQuestionText(d.questionText);
      if (d.explanation !== undefined) setExplanation(d.explanation);
      if (d.mediaType !== undefined) setMediaType(d.mediaType);
      if (d.mediaUrl !== undefined) setMediaUrl(d.mediaUrl);
      if (d.optionCount !== undefined) setOptionCount(d.optionCount);
      if (d.optionA !== undefined) setOptionA(d.optionA);
      if (d.optionB !== undefined) setOptionB(d.optionB);
      if (d.optionC !== undefined) setOptionC(d.optionC);
      if (d.optionD !== undefined) setOptionD(d.optionD);
      if (d.optionE !== undefined) setOptionE(d.optionE);
      if (d.optionF !== undefined) setOptionF(d.optionF);
      if (d.correctKey !== undefined) setCorrectKey(d.correctKey);
      if (d.tfItems !== undefined) setTfItems(d.tfItems);
      if (d.vcnvRiskQuestion !== undefined) setVcnvRiskQuestion(d.vcnvRiskQuestion);
      if (d.vcnvRiskAnswer !== undefined) setVcnvRiskAnswer(d.vcnvRiskAnswer);
      if (d.vcnvClue1 !== undefined) setVcnvClue1(d.vcnvClue1);
      if (d.vcnvAns1 !== undefined) setVcnvAns1(d.vcnvAns1);
      if (d.vcnvClue2 !== undefined) setVcnvClue2(d.vcnvClue2);
      if (d.vcnvAns2 !== undefined) setVcnvAns2(d.vcnvAns2);
      if (d.vcnvClue3 !== undefined) setVcnvClue3(d.vcnvClue3);
      if (d.vcnvAns3 !== undefined) setVcnvAns3(d.vcnvAns3);
      if (d.vcnvClue4 !== undefined) setVcnvClue4(d.vcnvClue4);
      if (d.vcnvAns4 !== undefined) setVcnvAns4(d.vcnvAns4);
      if (d.vcnvCenter !== undefined) setVcnvCenter(d.vcnvCenter);
      if (d.vcnvCenterAns !== undefined) setVcnvCenterAns(d.vcnvCenterAns);

      soundFx.playCorrect();
      vibrateSuccess();
      setShowDraftBanner(false);
      setShowDraftPreviewModal(false);
      setDraftToastMessage('✨ Đã khôi phục toàn bộ nội dung bản nháp thành công!');
      setTimeout(() => setDraftToastMessage(null), 4000);
    } catch (err) {
      console.error('[QuestionEditorModal] Error restoring draft:', err);
      soundFx.playWrong();
      vibrateError();
    }
  };

  // Handle discarding/clearing a draft
  const handleDiscardDraft = () => {
    questionDraftService.clearDraft(draftKey);
    setShowDraftBanner(false);
    setDetectedDraft(null);
    setShowDraftPreviewModal(false);
    soundFx.playClick();
    vibrateTap();
    setDraftToastMessage('🗑️ Đã xóa bản nháp khỏi LocalStorage');
    setTimeout(() => setDraftToastMessage(null), 3000);
  };

  // AI Quick Generator States
  const [aiTopic, setAiTopic] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState<boolean>(true);
  const aiTopicInputRef = useRef<HTMLInputElement>(null);

  // Moderation & Review Notes States
  const [approvalStatus, setany] = useState<any>(
    questionToEdit?.approval_status || (questionBankManager.canAutoApprove() ? 'APPROVED' : 'PENDING_REVIEW')
  );
  const [reviewNotes, setReviewNotes] = useState<string>(questionToEdit?.review_notes || '');

  // Auto-generate Question ID based on stage and format
  const generateAutoId = (stg: CompetitionStage, fmt: QuestionRoundFormat) => {
    let prefix = 'Q';
    switch (fmt) {
      // Vòng loại
      case 'BGD_MULTIPLE_CHOICE':
        prefix = 'VL_P1';
        break;
      case 'BGD_TRUE_FALSE_4':
        prefix = 'VL_P2';
        break;
      case 'BGD_SHORT_ANSWER':
        prefix = 'VL_P3';
        break;

      // 1. Khởi động
      case 'KHOI_DONG_RIENG':
        prefix = 'KD_R';
        break;
      case 'KHOI_DONG_CHUNG':
        prefix = 'KD_C';
        break;
      case 'KD_DIEN_CHO_TRONG':
        prefix = 'KD_DCT';
        break;
      case 'KD_DUNG_SAI_NEN':
        prefix = 'KD_DS';
        break;
      case 'KD_HINH_ANH_AM_THANH':
        prefix = 'KD_AV';
        break;
      case 'KD_TINH_HUONG_NGAN':
        prefix = 'KD_TH';
        break;
      case 'KD_TRAC_NGHIEM_ABCD':
        prefix = 'KD_TN';
        break;
      case 'KD_PHAN_TICH_SO_SANH':
        prefix = 'KD_SS';
        break;
      case 'KD_SPOT_THE_FLAW':
        prefix = 'KD_SFL';
        break;
      case 'KD_QUICK_PROCESS':
        prefix = 'KD_QP';
        break;

      // 2. Vượt Chướng Ngại Vật (Chuẩn mã VCNV_01, VCNV_02,...)
      case 'VCNV_HANG_NGANG':
      case 'VCNV_TRUNG_TAM':
      case 'VCNV_MAO_HIEM':
      case 'VCNV_DOAN_CHUONG_NGAI': {
        const allQuestions = questionBankManager.getQuestions();
        let nextIndex = 1;
        while (allQuestions.some(q => q.id === `VCNV_${nextIndex < 10 ? '0' + nextIndex : nextIndex}`)) {
          nextIndex++;
        }
        return `VCNV_${nextIndex < 10 ? '0' + nextIndex : nextIndex}`;
      }

      // 3. Tăng Tốc
      case 'TANG_TOC':
        prefix = 'TT';
        break;
      case 'TT_SAP_XEP':
        prefix = 'TT_SX';
        break;
      case 'TT_DIEM_KHAC_BIET':
        prefix = 'TT_DKB';
        break;
      case 'TT_DU_KIEN':
        prefix = 'TT_DK';
        break;
      case 'TT_SUY_LUAN_THUONG':
        prefix = 'TT_SL';
        break;
      case 'TT_GIAI_QUYET_TH':
        prefix = 'TT_GTH';
        break;
      case 'TT_TRAC_NGHIEM_6':
        prefix = 'TT_TN6';
        break;
      case 'TT_DOAN_BANG':
        prefix = 'TT_DB';
        break;

      // 4. Về Đích (3 dạng chuẩn 4.1 - 4.3 và các dạng khác)
      case 'VD_SHORT_ANSWER':
        prefix = 'VD_TLN';
        break;
      case 'VD_TRUE_FALSE_4':
        prefix = 'VD_DS4';
        break;
      case 'VD_AID_4':
        prefix = 'VD_AID';
        break;
      case 'VE_DICH_20':
        prefix = 'VD_20';
        break;
      case 'VE_DICH_30':
        prefix = 'VD_30';
        break;
      case 'VE_DICH_40':
        prefix = 'VD_40';
        break;
      case 'THUC_HANH_TINH_HUONG':
        prefix = 'VD_TH';
        break;
      case 'VE_DICH_HOA_100':
        prefix = 'VD_H100';
        break;
      case 'KICH_TUONG_TAC':
        prefix = 'KICH';
        break;

      // 5. Câu hỏi phụ
      case 'CAU_HOI_PHU':
        prefix = 'CHP';
        break;

      default:
        prefix = 'BTI';
    }
    const rand = Math.floor(100 + Math.random() * 900);
    return `${prefix}_${Date.now().toString().slice(-4)}${rand}`;
  };

  // Populate or reset form when modal opens or questionToEdit changes
  useEffect(() => {
    if (!isOpen) return;

    if (questionToEdit) {
      setQuestionId(questionToEdit.id);
      setStage(questionToEdit.stage || 'BAN_KET_1');

      // Robust resolution of format and round group
      let resolvedGroup: BtiRoundGroupKey = 'KHOI_DONG';
      let resolvedFormat = questionToEdit.round_format;

      if (questionToEdit.stage === 'VONG_LOAI' || resolvedFormat?.startsWith('BGD_')) {
        resolvedGroup = 'VONG_LOAI';
        if (!resolvedFormat) {
          resolvedFormat = questionToEdit.round_type === 'TRUE_FALSE_4' ? 'BGD_TRUE_FALSE_4' : 'BGD_MULTIPLE_CHOICE';
        }
      } else if (resolvedFormat) {
        resolvedGroup = getRoundGroupByFormat(resolvedFormat) || 'KHOI_DONG';
      } else {
        const idU = (questionToEdit.id || '').toUpperCase();
        const nameL = (questionToEdit.round_name || '').toLowerCase();
        if (idU.startsWith('VCNV') || idU.startsWith('CNV') || nameL.includes('chướng ngại vật') || nameL.includes('vcnv') || questionToEdit.round_type === 'VCNV') {
          resolvedGroup = 'VCNV';
          resolvedFormat = 'VCNV_HANG_NGANG';
        } else if (idU.startsWith('TT') || nameL.includes('tăng tốc') || nameL.includes('tang toc')) {
          resolvedGroup = 'TANG_TOC';
          resolvedFormat = 'TANG_TOC';
        } else if (idU.startsWith('VD') || nameL.includes('về đích') || nameL.includes('ve dich')) {
          resolvedGroup = 'VE_DICH';
          resolvedFormat = 'VE_DICH_20';
        } else {
          resolvedGroup = 'KHOI_DONG';
          resolvedFormat = 'KHOI_DONG_RIENG';
        }
      }

      const isVongLoai = resolvedGroup === 'VONG_LOAI' || questionToEdit.stage === 'VONG_LOAI';
      setRoundFormat(resolvedFormat);
      setRoundGroup(resolvedGroup);
      setRoundName(questionToEdit.round_name || (isVongLoai ? (resolvedFormat === 'BGD_TRUE_FALSE_4' ? 'Phần II: Câu hỏi Đúng / Sai 4 ý (Đề Vòng Loại)' : 'Phần I: Trắc nghiệm 4 lựa chọn (Đề Vòng Loại)') : (resolvedGroup === 'VCNV' ? 'Vòng 2: Vượt Chướng Ngại Vật' : 'Vòng 1: Khởi động')));
      setRoundType(questionToEdit.round_type || (isVongLoai ? (resolvedFormat === 'BGD_TRUE_FALSE_4' ? 'TRUE_FALSE_4' : 'MULTIPLE_CHOICE') : (resolvedGroup === 'VCNV' ? 'VCNV' : 'MULTIPLE_CHOICE')));
      setTimeLimit(isVongLoai ? (resolvedFormat === 'BGD_TRUE_FALSE_4' ? 60 : 30) : (resolvedGroup === 'VCNV' ? 60 : (questionToEdit.time_limit || 15)));
      setPoints(isVongLoai ? (resolvedFormat === 'BGD_TRUE_FALSE_4' ? 4 : 1) : (resolvedGroup === 'VCNV' ? 60 : (questionToEdit.points || 10)));
      setDomain(questionToEdit.digital_competency_domain || 'MIEN_4');
      setSubCompetency(questionToEdit.digital_sub_competency || '4.2');
      setCognitiveLevel(questionToEdit.cognitive_level || 'THONG_HIEU');
      setCustomCategoryInput(questionToEdit.category || 'Tư duy Logic');
      setLegalReference(questionToEdit.legal_reference || 'Nghị định 13/2023/NĐ-CP');
      setTagsInput((questionToEdit.tags || []).join(', '));
      setQuestionText(questionToEdit.question_text || '');
      setExplanation(questionToEdit.explanation || '');
      setMediaType(questionToEdit.media_type || 'NONE');
      setMediaUrl(questionToEdit.media_url || '');

      // Options
      const opts = questionToEdit.options || {};
      setOptionA(opts.A || opts.clue1 || opts.a || '');
      setOptionB(opts.B || opts.clue2 || opts.b || '');
      setOptionC(opts.C || opts.clue3 || opts.c || '');
      setOptionD(opts.D || opts.clue4 || opts.d || '');
      setOptionE(opts.E || opts.centerText || '');
      setOptionF(opts.F || '');
      setCorrectKey(questionToEdit.correct_key || 'A');

      // Khởi động turn
      if (opts.kdTurn === 'CHUNG' || questionToEdit.round_name?.toLowerCase().includes('chung') || questionToEdit.round_format === 'KHOI_DONG_CHUNG') {
        setKdTurn('CHUNG');
      } else {
        setKdTurn('RIENG');
      }

      // VCNV Image
      setVcnvImage(opts.obstacleImage || questionToEdit.obstacle_info?.obstacleImage || (questionToEdit.media_type === 'IMAGE' ? questionToEdit.media_url || '' : ''));

      if (questionToEdit.round_type === 'TRUE_FALSE_4' || resolvedFormat === 'BGD_TRUE_FALSE_4') {
        const keyStr = questionToEdit.correct_key || '';
        setTfItems([
          { key: 'a', text: opts.a || '', isCorrect: keyStr.includes('a:Đ') || keyStr.includes('a:T') || keyStr.includes('a:1') },
          { key: 'b', text: opts.b || '', isCorrect: keyStr.includes('b:Đ') || keyStr.includes('b:T') || keyStr.includes('b:1') },
          { key: 'c', text: opts.c || '', isCorrect: keyStr.includes('c:Đ') || keyStr.includes('c:T') || keyStr.includes('c:1') },
          { key: 'd', text: opts.d || '', isCorrect: keyStr.includes('d:Đ') || keyStr.includes('d:T') || keyStr.includes('d:1') },
        ]);
      } else if (questionToEdit.round_type === 'VCNV' || resolvedGroup === 'VCNV' || resolvedFormat?.includes('VCNV') || questionToEdit.id?.startsWith('CNV') || questionToEdit.id?.startsWith('VCNV')) {
        setVcnvRiskQuestion(opts.riskQuestion || '');
        setVcnvRiskAnswer(opts.riskAnswer || '');
        setVcnvClue1(opts.clue1 || '');
        setVcnvAns1(opts.ans1 || '');
        setVcnvClue2(opts.clue2 || '');
        setVcnvAns2(opts.ans2 || '');
        setVcnvClue3(opts.clue3 || '');
        setVcnvAns3(opts.ans3 || '');
        setVcnvClue4(opts.clue4 || '');
        setVcnvAns4(opts.ans4 || '');
        setVcnvCenter(opts.centerText || '');
        setVcnvCenterAns(opts.centerAnswer || '');
      }
    } else {
      // New question defaults
      let initialStage: CompetitionStage = 'BAN_KET_1';
      let initialGroup: BtiRoundGroupKey = initialRoundGroup || 'KHOI_DONG';
      let initialFormat: QuestionRoundFormat = 'KD_DIEN_CHO_TRONG';
      let initRoundName = 'Vòng 1: Khởi động (Lượt riêng)';
      let initRoundType: any = 'SHORT_ANSWER';
      let initTimeLimit = 5;
      let initPoints = 10;

      if (initialGroup === 'VCNV') {
        initialFormat = 'VCNV_HANG_NGANG';
        initRoundName = 'Vòng 2: Vượt Chướng Ngại Vật';
        initRoundType = 'VCNV';
        initTimeLimit = 60;
        initPoints = 60;
      } else if (initialGroup === 'TANG_TOC') {
        initialFormat = 'TANG_TOC';
        initRoundName = 'Vòng 3: Tăng Tốc';
        initRoundType = 'SHORT_ANSWER';
        initTimeLimit = 30;
        initPoints = 40;
      } else if (initialGroup === 'VE_DICH') {
        initialFormat = 'VE_DICH_20';
        initRoundName = 'Vòng 4: Về Đích (Gói 20 điểm)';
        initRoundType = 'SHORT_ANSWER';
        initTimeLimit = 20;
        initPoints = 20;
      } else if (initialGroup === 'VONG_LOAI') {
        initialStage = 'VONG_LOAI';
        initialFormat = 'BGD_MULTIPLE_CHOICE';
        initRoundName = 'Phần I: Trắc nghiệm 4 lựa chọn (Đề Vòng Loại)';
        initRoundType = 'MULTIPLE_CHOICE';
        initTimeLimit = 30;
        initPoints = 1;
      }

      setStage(initialStage);
      setRoundGroup(initialGroup);
      setRoundFormat(initialFormat);
      setRoundName(initRoundName);
      setRoundType(initRoundType);
      setTimeLimit(initTimeLimit);
      setPoints(initPoints);
      setKdTurn('RIENG');
      setVcnvImage('');
      setDomain((initialDomain && initialDomain !== 'ALL') ? (initialDomain as DigitalCompetencyDomainKey) : 'MIEN_4');
      setSubCompetency('4.2');
      setCognitiveLevel('THONG_HIEU');
      setLegalReference('Nghị định 13/2023/NĐ-CP Điều 9');
      setTagsInput('an_toan_so, quyen_rieng_tu');
      setQuestionText('');
      setExplanation('');
      setMediaType('NONE');
      setMediaUrl('');
      setOptionCount(4);
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setOptionE('');
      setOptionF('');
      setCorrectKey('');
      setQuestionId(generateAutoId(initialStage, initialFormat));
      setTfItems([
        { key: 'a', text: '', isCorrect: true },
        { key: 'b', text: '', isCorrect: false },
        { key: 'c', text: '', isCorrect: false },
        { key: 'd', text: '', isCorrect: true },
      ]);
      setVcnvRiskQuestion('');
      setVcnvRiskAnswer('');
      setVcnvClue1('');
      setVcnvAns1('');
      setVcnvClue2('');
      setVcnvAns2('');
      setVcnvClue3('');
      setVcnvAns3('');
      setVcnvClue4('');
      setVcnvAns4('');
      setVcnvCenter('');
      setVcnvCenterAns('');
    }
  }, [isOpen, questionToEdit, initialRoundGroup, initialDomain]);

  // Handle Level 1: Round Group change
  const handleRoundGroupChange = (newGroup: BtiRoundGroupKey) => {
    setRoundGroup(newGroup);
    if (newGroup === 'VONG_LOAI' && stage !== 'VONG_LOAI') {
      setStage('VONG_LOAI');
    } else if (newGroup !== 'VONG_LOAI' && stage === 'VONG_LOAI') {
      setStage('BAN_KET_1');
    }

    if (newGroup === 'VONG_LOAI') {
      const initialFmt: QuestionRoundFormat = 'BGD_MULTIPLE_CHOICE';
      setRoundFormat(initialFmt);
      setRoundName('Phần I: Trắc nghiệm 4 lựa chọn (Đề Vòng Loại)');
      setRoundType('MULTIPLE_CHOICE');
      setTimeLimit(30);
      setPoints(1);
      setQuestionId(generateAutoId('VONG_LOAI', initialFmt));
      return;
    }

    if (newGroup === 'VCNV') {
      setRoundFormat('VCNV_HANG_NGANG');
      setRoundName('Vòng 2: Vượt Chướng Ngại Vật');
      setRoundType('VCNV');
      setTimeLimit(15);
      setPoints(10);
      setQuestionId(generateAutoId(stage, 'VCNV_HANG_NGANG'));
      return;
    }

    if (newGroup === 'KHOI_DONG') {
      const initialFmt: QuestionRoundFormat = 'KD_DIEN_CHO_TRONG';
      setRoundFormat(initialFmt);
      setRoundName(kdTurn === 'RIENG' ? 'Vòng 1: Khởi động (Lượt riêng)' : 'Vòng 1: Khởi động (Lượt chung)');
      setRoundType('SHORT_ANSWER');
      setTimeLimit(kdTurn === 'RIENG' ? 5 : 3);
      setPoints(10);
      setQuestionId(generateAutoId(stage, initialFmt));
      return;
    }

    if (newGroup === 'TANG_TOC') {
      const initialFmt: QuestionRoundFormat = 'TT_SAP_XEP';
      setRoundFormat(initialFmt);
      setRoundName('Vòng 3: Tăng Tốc');
      setRoundType('SHORT_ANSWER');
      setTimeLimit(30);
      setPoints(40);
      setQuestionId(generateAutoId(stage, initialFmt));
      return;
    }

    if (newGroup === 'VE_DICH') {
      const initialFmt: QuestionRoundFormat = 'VD_SHORT_ANSWER';
      setRoundFormat(initialFmt);
      setRoundName('Vòng 4: Về Đích (Gói 20 điểm)');
      setRoundType('SHORT_ANSWER');
      setTimeLimit(15);
      setPoints(20);
      setQuestionId(generateAutoId(stage, initialFmt));
      return;
    }

    const activeFormats = getActiveFormatsForRoundGroup(newGroup);
    if (activeFormats.length > 0) {
      handleFormatChange(activeFormats[0].format);
    }
  };

  // Stage change logic
  const handleStageChange = (newStage: CompetitionStage) => {
    setStage(newStage);
    if (newStage === 'VONG_LOAI') {
      setRoundGroup('VONG_LOAI');
      setRoundFormat('BGD_MULTIPLE_CHOICE');
      setRoundName('Phần I: Trắc nghiệm 4 lựa chọn (Đề Vòng Loại)');
      setRoundType('MULTIPLE_CHOICE');
      setTimeLimit(30);
      setPoints(1);
      setQuestionId(generateAutoId('VONG_LOAI', 'BGD_MULTIPLE_CHOICE'));
    } else {
      if (roundGroup === 'VONG_LOAI') {
        setRoundGroup('KHOI_DONG');
        handleFormatChange('KD_DIEN_CHO_TRONG');
      } else {
        setQuestionId(generateAutoId(newStage, roundFormat));
      }
    }
  };

  // Level 2: Round Format change logic
  const handleFormatChange = (fmt: QuestionRoundFormat) => {
    setRoundFormat(fmt);
    const g = getRoundGroupByFormat(fmt);
    setRoundGroup(g);
    setQuestionId(generateAutoId(stage, fmt));

    const meta = QUESTION_ROUND_FORMATS[fmt];
    if (meta) {
      setRoundType(meta.defaultRoundType);
      if (g === 'KHOI_DONG') {
        setRoundName(kdTurn === 'RIENG' ? 'Vòng 1: Khởi động (Lượt riêng)' : 'Vòng 1: Khởi động (Lượt chung)');
        setTimeLimit(kdTurn === 'RIENG' ? 5 : 3);
        setPoints(10);
      } else if (g === 'VCNV') {
        setRoundName('Vòng 2: Vượt Chướng Ngại Vật');
        setTimeLimit(15);
        setPoints(10);
      } else if (g === 'TANG_TOC') {
        setRoundName('Vòng 3: Tăng Tốc');
        setTimeLimit(30);
        setPoints(40);
      } else if (g === 'VE_DICH') {
        setRoundName(`Vòng 4: Về Đích (Gói ${points || 20} điểm)`);
        setTimeLimit(points === 40 ? 30 : (points === 30 ? 20 : 15));
      } else if (g === 'VONG_LOAI' || stage === 'VONG_LOAI') {
        setRoundName(fmt === 'BGD_TRUE_FALSE_4' 
          ? 'Phần II: Câu hỏi Đúng / Sai 4 ý (Đề Vòng Loại)' 
          : 'Phần I: Trắc nghiệm 4 lựa chọn (Đề Vòng Loại)');
        setTimeLimit(fmt === 'BGD_TRUE_FALSE_4' ? 60 : 30);
        setPoints(fmt === 'BGD_TRUE_FALSE_4' ? 4 : 1);
      } else {
        setRoundName(meta.name);
        setTimeLimit(meta.defaultTimeLimit);
        setPoints(meta.defaultPoints);
      }
    }
  };

  // Toggle Khởi động Riêng / Chung
  const handleKdTurnChange = (newTurn: 'RIENG' | 'CHUNG') => {
    setKdTurn(newTurn);
    setRoundName(newTurn === 'RIENG' ? 'Vòng 1: Khởi động (Lượt riêng)' : 'Vòng 1: Khởi động (Lượt chung)');
    setTimeLimit(newTurn === 'RIENG' ? 5 : 3);
    setPoints(10);
  };

  const [isClassifying, setIsClassifying] = useState<boolean>(false);

  const handleAutoClassify = async () => {
    if (!questionText.trim()) {
      alert('Vui lòng soạn nội dung câu hỏi trước khi AI phân loại.');
      return;
    }
    setIsClassifying(true);
    vibrateTap();
    
    try {
      const payload = {
        questionText,
        options: {
          A: optionA, B: optionB, C: optionC, D: optionD
        },
        explanation
      };
      
      const response = await fetch('/api/ai/classify-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi AI tự động phân loại.');
      }
      
      const { domain: suggestedDomain, subCompetency: suggestedSub, cognitiveLevel: suggestedLevel, tags: suggestedTags } = data.classification;
      
      if (suggestedDomain && DIGITAL_COMPETENCY_DOMAINS[suggestedDomain]) {
        setDomain(suggestedDomain);
      }
      if (suggestedSub) {
        setSubCompetency(suggestedSub);
      }
      if (suggestedLevel && COGNITIVE_LEVELS[suggestedLevel]) {
        setCognitiveLevel(suggestedLevel);
      }
      if (Array.isArray(suggestedTags) && suggestedTags.length > 0) {
        const newTagsStr = suggestedTags.join(', ');
        setTagsInput(newTagsStr);
      }
      
      soundFx.playCorrect();
      vibrateSuccess();
      alert('Phân loại thành công! AI đã đề xuất Miền, Mức độ và Nhãn phù hợp.');
      
    } catch (err: any) {
      console.error(err);
      soundFx.playError();
      alert(`Lỗi AI phân loại: ${err.message || 'Không thể kết nối với máy chủ AI.'}`);
    } finally {
      setIsClassifying(false);
    }
  };

  // Domain change logic
  const handleDomainChange = (newDom: DigitalCompetencyDomainKey) => {
    setDomain(newDom);
    const subList = DIGITAL_COMPETENCY_DOMAINS[newDom]?.subCompetencies || [];
    if (subList.length > 0) {
      setSubCompetency(subList[0].code);
    }
  };

  const [saveToast, setSaveToast] = useState<string | null>(null);


  // UNDO/REDO LOGIC
  const getSnapshot = useCallback(() => ({
    questionId, stage, roundGroup, roundFormat, roundName, roundType, timeLimit, points, kdTurn, vcnvImage, domain, subCompetency, cognitiveLevel, legalReference, tagsInput, questionText, explanation, mediaType, mediaUrl, optionCount, optionA, optionB, optionC, optionD, optionE, optionF, correctKey, tfItems, vcnvRiskQuestion, vcnvRiskAnswer, vcnvClue1, vcnvAns1, vcnvClue2, vcnvAns2, vcnvClue3, vcnvAns3, vcnvClue4, vcnvAns4, vcnvCenter, vcnvCenterAns, aiTopic, approvalStatus, reviewNotes
  }), [questionId, stage, roundGroup, roundFormat, roundName, roundType, timeLimit, points, kdTurn, vcnvImage, domain, subCompetency, cognitiveLevel, legalReference, tagsInput, questionText, explanation, mediaType, mediaUrl, optionCount, optionA, optionB, optionC, optionD, optionE, optionF, correctKey, tfItems, vcnvRiskQuestion, vcnvRiskAnswer, vcnvClue1, vcnvAns1, vcnvClue2, vcnvAns2, vcnvClue3, vcnvAns3, vcnvClue4, vcnvAns4, vcnvCenter, vcnvCenterAns, aiTopic, approvalStatus, reviewNotes]);

  const { canUndo, canRedo, undo, redo, pushState } = useUndoRedo(getSnapshot(), 500);

  useEffect(() => {
    pushState(getSnapshot());
  }, [getSnapshot, pushState]);

  const restoreSnapshot = useCallback((snap: any) => {
    setQuestionId(snap.questionId);
    setStage(snap.stage);
    setRoundGroup(snap.roundGroup);
    setRoundFormat(snap.roundFormat);
    setRoundName(snap.roundName);
    setRoundType(snap.roundType);
    setTimeLimit(snap.timeLimit);
    setPoints(snap.points);
    setKdTurn(snap.kdTurn);
    setVcnvImage(snap.vcnvImage);
    setDomain(snap.domain);
    setSubCompetency(snap.subCompetency);
    setCognitiveLevel(snap.cognitiveLevel);
    setLegalReference(snap.legalReference);
    setTagsInput(snap.tagsInput);
    setQuestionText(snap.questionText);
    setExplanation(snap.explanation);
    setMediaType(snap.mediaType);
    setMediaUrl(snap.mediaUrl);
    setOptionCount(snap.optionCount);
    setOptionA(snap.optionA);
    setOptionB(snap.optionB);
    setOptionC(snap.optionC);
    setOptionD(snap.optionD);
    setOptionE(snap.optionE);
    setOptionF(snap.optionF);
    setCorrectKey(snap.correctKey);
    setTfItems(snap.tfItems);
    setVcnvRiskQuestion(snap.vcnvRiskQuestion);
    setVcnvRiskAnswer(snap.vcnvRiskAnswer);
    setVcnvClue1(snap.vcnvClue1);
    setVcnvAns1(snap.vcnvAns1);
    setVcnvClue2(snap.vcnvClue2);
    setVcnvAns2(snap.vcnvAns2);
    setVcnvClue3(snap.vcnvClue3);
    setVcnvAns3(snap.vcnvAns3);
    setVcnvClue4(snap.vcnvClue4);
    setVcnvAns4(snap.vcnvAns4);
    setVcnvCenter(snap.vcnvCenter);
    setVcnvCenterAns(snap.vcnvCenterAns);
    setAiTopic(snap.aiTopic);
    setany(snap.approvalStatus);
    setReviewNotes(snap.reviewNotes);
  }, []);

  const handleUndo = useCallback(() => {
    const snap = undo();
    if (snap) {
      restoreSnapshot(snap);
      vibrateTap();
    }
  }, [undo, restoreSnapshot]);

  const handleRedo = useCallback(() => {
    const snap = redo();
    if (snap) {
      restoreSnapshot(snap);
      vibrateTap();
    }
  }, [redo, restoreSnapshot]);

  // AI Question Generation Handler
  const handleQuickAiGenerate = async (customTopic?: string) => {
    const topicToUse = (customTopic !== undefined ? customTopic : aiTopic).trim();
    setIsAiGenerating(true);
    setAiError(null);
    setAiSuccessMessage(null);
    vibrateTap();

    try {
      const response = await fetch('/api/ai/quick-draft-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicToUse,
          stage,
          roundFormat,
          domain,
          subCompetency,
          cognitiveLevel,
          legalReference
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.question) {
        throw new Error(data.error || 'Không thể tạo câu hỏi từ AI.');
      }

      const q = data.question;

      // Update question text
      if (q.questionText) {
        setQuestionText(q.questionText);
      }

      // Options
      if (q.options) {
        if (q.options.A !== undefined) setOptionA(q.options.A);
        if (q.options.B !== undefined) setOptionB(q.options.B);
        if (q.options.C !== undefined) setOptionC(q.options.C);
        if (q.options.D !== undefined) setOptionD(q.options.D);
      }

      // True/False 4 items
      if (Array.isArray(q.tfItems) && q.tfItems.length === 4) {
        setTfItems(q.tfItems.map((item: any) => ({
          key: item.key || 'a',
          text: item.text || '',
          isCorrect: Boolean(item.isCorrect)
        })));
      }

      // VCNV clues
      if (q.vcnvData) {
        if (q.vcnvData.riskQuestion) setVcnvRiskQuestion(q.vcnvData.riskQuestion);
        if (q.vcnvData.riskAnswer) setVcnvRiskAnswer(q.vcnvData.riskAnswer);
        if (q.vcnvData.clue1) setVcnvClue1(q.vcnvData.clue1);
        if (q.vcnvData.ans1) setVcnvAns1(q.vcnvData.ans1);
        if (q.vcnvData.clue2) setVcnvClue2(q.vcnvData.clue2);
        if (q.vcnvData.ans2) setVcnvAns2(q.vcnvData.ans2);
        if (q.vcnvData.clue3) setVcnvClue3(q.vcnvData.clue3);
        if (q.vcnvData.ans3) setVcnvAns3(q.vcnvData.ans3);
        if (q.vcnvData.clue4) setVcnvClue4(q.vcnvData.clue4);
        if (q.vcnvData.ans4) setVcnvAns4(q.vcnvData.ans4);
        if (q.vcnvData.centerClue) setVcnvCenter(q.vcnvData.centerClue);
        if (q.vcnvData.centerAns) setVcnvCenterAns(q.vcnvData.centerAns);
        if (q.vcnvData.obstacleKeyword) setCorrectKey(q.vcnvData.obstacleKeyword);
      }

      // Correct key
      if (q.correctKey && !q.vcnvData) {
        setCorrectKey(q.correctKey);
      }

      // Explanation
      if (q.explanation) {
        setExplanation(q.explanation);
      }

      // Metadata
      if (q.legalReference) {
        setLegalReference(q.legalReference);
      }
      if (q.domain && DIGITAL_COMPETENCY_DOMAINS[q.domain as DigitalCompetencyDomainKey]) {
        setDomain(q.domain as DigitalCompetencyDomainKey);
      }
      if (q.subCompetency) {
        setSubCompetency(q.subCompetency);
      }
      if (q.cognitiveLevel && COGNITIVE_LEVELS[q.cognitiveLevel as CognitiveLevel]) {
        setCognitiveLevel(q.cognitiveLevel as CognitiveLevel);
      }
      if (Array.isArray(q.tags) && q.tags.length > 0) {
        setTagsInput(q.tags.join(', '));
      }

      soundFx.playCorrect();
      vibrateSuccess();
      setAiSuccessMessage(`✓ Đã tạo thành công câu hỏi theo chủ đề "${topicToUse || 'Chuẩn BTI 2026'}"! Nội dung đã được điền tự động vào biểu mẫu.`);
      setTimeout(() => setAiSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error("AI Quick Generation Failed:", err);
      soundFx.playError();
      vibrateError();
      setAiError(err.message || 'Lỗi khi kết nối với Gemini API. Vui lòng thử lại.');
      setTimeout(() => setAiError(null), 6000);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Form submission / Save execution
  const executeSave = (andCreateNew: boolean = false) => {
    if (!questionText.trim() && roundGroup !== 'VCNV') {
      soundFx.playError();
      vibrateError();
      alert('Vui lòng nhập nội dung câu hỏi!');
      return;
    }

    if (roundGroup === 'VCNV' && !correctKey.trim()) {
      soundFx.playError();
      vibrateError();
      alert('Vui lòng nhập Từ khóa Chướng Ngại Vật chính (Hàng 1)!');
      return;
    }

    const finalQuestionText = (roundGroup === 'VCNV')
      ? (questionText.trim() || `Vượt chướng ngại vật: ${correctKey.trim().toUpperCase() || 'Chướng ngại vật số'}`)
      : questionText.trim();

    // DUPLICATE CHECK
    const duplicates = questionBankManager.findDuplicateQuestions(finalQuestionText, questionToEdit?.id);
    if (duplicates.length > 0) {
      soundFx.playWarning();
      vibrateWarning();
      const dupIds = duplicates.map(d => d.id).slice(0, 3).join(', ');
      const msg = `CẢNH BÁO TRÙNG LẶP\n\nNội dung câu hỏi này rất giống với ${duplicates.length} câu hỏi đang có trong ngân hàng (VD: ${dupIds}${duplicates.length > 3 ? ', ...' : ''}).\n\nBạn có chắc chắn muốn tiếp tục lưu câu hỏi này không?`;
      if (!window.confirm(msg)) {
        return; // User cancelled
      }
    }

    let finalOptions: Record<string, string> = {};
    let finalCorrectKey = correctKey.trim().toUpperCase();

    if (roundGroup === 'KHOI_DONG') {
      finalOptions.kdTurn = kdTurn;
    }

    if (roundType === 'TRUE_FALSE_4') {
      finalOptions = {
        ...finalOptions,
        a: tfItems[0]?.text.trim() || 'Nhận định a',
        b: tfItems[1]?.text.trim() || 'Nhận định b',
        c: tfItems[2]?.text.trim() || 'Nhận định c',
        d: tfItems[3]?.text.trim() || 'Nhận định d'
      };
      finalCorrectKey = `a:${tfItems[0]?.isCorrect ? 'Đ' : 'S'},b:${tfItems[1]?.isCorrect ? 'Đ' : 'S'},c:${tfItems[2]?.isCorrect ? 'Đ' : 'S'},d:${tfItems[3]?.isCorrect ? 'Đ' : 'S'}`;
    } else if (roundType === 'VCNV' || roundGroup === 'VCNV') {
      finalOptions = {};
      if (vcnvImage.trim()) finalOptions.obstacleImage = vcnvImage.trim();
      if (vcnvRiskQuestion.trim()) finalOptions.riskQuestion = vcnvRiskQuestion.trim();
      if (vcnvRiskAnswer.trim()) finalOptions.riskAnswer = vcnvRiskAnswer.trim();
      if (vcnvClue1.trim()) finalOptions.clue1 = vcnvClue1.trim();
      if (vcnvAns1.trim()) finalOptions.ans1 = vcnvAns1.trim().toUpperCase();
      if (vcnvClue2.trim()) finalOptions.clue2 = vcnvClue2.trim();
      if (vcnvAns2.trim()) finalOptions.ans2 = vcnvAns2.trim().toUpperCase();
      if (vcnvClue3.trim()) finalOptions.clue3 = vcnvClue3.trim();
      if (vcnvAns3.trim()) finalOptions.ans3 = vcnvAns3.trim().toUpperCase();
      if (vcnvClue4.trim()) finalOptions.clue4 = vcnvClue4.trim();
      if (vcnvAns4.trim()) finalOptions.ans4 = vcnvAns4.trim().toUpperCase();
      if (vcnvCenter.trim()) finalOptions.centerText = vcnvCenter.trim();
      if (vcnvCenterAns.trim()) finalOptions.centerAnswer = vcnvCenterAns.trim().toUpperCase();
      finalCorrectKey = correctKey.trim().toUpperCase();
    } else if (roundFormat === 'TT_SAP_XEP' || roundType === 'SEQUENCING') {
      const allKeys = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, optionCount);
      const vals: Record<string, string> = { A: optionA, B: optionB, C: optionC, D: optionD, E: optionE, F: optionF };
      allKeys.forEach(k => {
        if (vals[k]?.trim()) finalOptions[k] = vals[k].trim();
      });
      finalCorrectKey = correctKey.replace(/[\s,]+/g, '-').toUpperCase();
    } else if (roundFormat === 'TT_TRAC_NGHIEM_6' || roundType === 'ELIMINATION_6') {
      if (optionA.trim()) finalOptions.A = optionA.trim();
      if (optionB.trim()) finalOptions.B = optionB.trim();
      if (optionC.trim()) finalOptions.C = optionC.trim();
      if (optionD.trim()) finalOptions.D = optionD.trim();
      if (optionE.trim()) finalOptions.E = optionE.trim();
      if (optionF.trim()) finalOptions.F = optionF.trim();
      finalCorrectKey = correctKey.toUpperCase();
    } else if (roundType === 'SHORT_ANSWER' || roundType === 'FILL_IN_BLANK') {
      finalOptions = {
        ...finalOptions
      };
      finalCorrectKey = correctKey.trim().toUpperCase();
    } else if (roundType === 'TRUE_FALSE') {
      finalOptions = {
        ...finalOptions,
        A: optionA.trim() || 'Đúng',
        B: optionB.trim() || 'Sai'
      };
      finalCorrectKey = correctKey.toUpperCase();
    } else {
      // Standard Multiple choice
      if (optionA.trim()) finalOptions.A = optionA.trim();
      if (optionB.trim()) finalOptions.B = optionB.trim();
      if (optionCount >= 3 && optionC.trim()) finalOptions.C = optionC.trim();
      if (optionCount >= 4 && optionD.trim()) finalOptions.D = optionD.trim();
      finalCorrectKey = correctKey.toUpperCase();
    }

    const domainInfo = DIGITAL_COMPETENCY_DOMAINS[domain];
    const categoryString = customCategoryInput.trim() || `${domainInfo.code}: ${domainInfo.name}`;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const obstacleInfo = (roundGroup === 'VCNV' || roundType === 'VCNV') ? {
      obstacleKey: correctKey.trim().toUpperCase(),
      obstacleImage: vcnvImage.trim() || undefined,
      explanation: explanation.trim() || undefined
    } : undefined;

    const finalMediaType = (roundGroup === 'VCNV' && vcnvImage.trim()) ? 'IMAGE' : mediaType;
    const finalMediaUrl = (roundGroup === 'VCNV' && vcnvImage.trim()) ? vcnvImage.trim() : (mediaType !== 'NONE' ? mediaUrl.trim() : undefined);

    const isVongLoai = roundGroup === 'VONG_LOAI' || stage === 'VONG_LOAI';

    const resolvedTimeLimit = roundGroup === 'KHOI_DONG'
      ? (kdTurn === 'RIENG' ? 5 : 3)
      : roundGroup === 'VCNV'
        ? 15
        : roundGroup === 'TANG_TOC'
          ? 30
          : roundGroup === 'VE_DICH'
            ? (points === 40 ? 30 : (points === 30 ? 20 : 15))
            : isVongLoai
              ? (roundFormat === 'BGD_TRUE_FALSE_4' ? 60 : 30)
              : Number(timeLimit) || 15;

    const resolvedPoints = roundGroup === 'KHOI_DONG'
      ? 10
      : roundGroup === 'VCNV'
        ? 10
        : roundGroup === 'TANG_TOC'
          ? 40
          : roundGroup === 'VE_DICH'
            ? Number(points) || 20
            : isVongLoai
              ? (roundFormat === 'BGD_TRUE_FALSE_4' ? 4 : 1)
              : Number(points) || 10;

    const questionItem: QuestionItem = {
      id: questionId.trim() || `Q_${Date.now()}`,
      stage,
      round_format: roundFormat,
      round_name: roundName.trim(),
      round_type: roundType,
      category: categoryString,
      question_text: finalQuestionText,
      options: finalOptions,
      correct_key: finalCorrectKey,
      explanation: explanation.trim() || (roundGroup === 'VCNV' ? `Từ khóa CNV: ${correctKey.trim().toUpperCase()}` : 'Căn cứ Thông tư 02/2025/TT-BGDĐT và các quy định pháp luật liên quan.'),
      time_limit: resolvedTimeLimit,
      points: resolvedPoints,
      cognitive_level: cognitiveLevel,
      digital_competency_domain: domain,
      digital_sub_competency: subCompetency,
      legal_reference: legalReference.trim(),
      tags,
      media_type: finalMediaType,
      media_url: finalMediaUrl,
      obstacle_info: obstacleInfo,
      approval_status: approvalStatus,
      review_notes: reviewNotes.trim(),
      approved_by: approvalStatus === 'APPROVED' ? (questionToEdit?.approved_by || questionBankManager.getCurrentUser().name) : undefined,
      created_by: questionToEdit?.created_by || questionBankManager.getCurrentUser().name,
      created_at: questionToEdit?.created_at || Date.now()
    };

    if (questionToEdit) {
      questionBankManager.updateQuestion(questionToEdit.id, questionItem);
    } else {
      questionBankManager.addQuestion(questionItem);
    }

    soundFx.playCorrect();
    vibrateSuccess();
    
    // Clear draft on successful save
    questionDraftService.clearDraft(draftKey);
    setShowDraftBanner(false);
    setDetectedDraft(null);
    setLastSavedTime(null);

    if (onSaved) onSaved(questionItem);

    if (andCreateNew) {
      // Clear form fields for entering next question swiftly
      setQuestionId(generateAutoId(stage, roundFormat));
      setQuestionText('');
      setExplanation('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setOptionE('');
      setOptionF('');
      setCorrectKey(roundType === 'TRUE_FALSE' ? 'A' : 'A');
      setTfItems([
        { key: 'a', text: '', isCorrect: true },
        { key: 'b', text: '', isCorrect: false },
        { key: 'c', text: '', isCorrect: false },
        { key: 'd', text: '', isCorrect: true },
      ]);
      setVcnvRiskQuestion('');
      setVcnvRiskAnswer('');
      setVcnvClue1('');
      setVcnvAns1('');
      setVcnvClue2('');
      setVcnvAns2('');
      setVcnvClue3('');
      setVcnvAns3('');
      setVcnvClue4('');
      setVcnvAns4('');
      setVcnvCenter('');
      setVcnvCenterAns('');
      setVcnvImage('');
      setMediaUrl('');
      setMediaType('NONE');
      setSaveToast(`✓ Đã lưu câu hỏi [${questionItem.id}] thành công! Biểu mẫu sẵn sàng nhập câu tiếp theo.`);
      setTimeout(() => setSaveToast(null), 4000);
    } else {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSave(false);
  };

  // Stable references for keyboard listener to avoid stale closure or listener re-creation
  const executeSaveRef = useRef(executeSave);
  executeSaveRef.current = executeSave;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const handleUndoRef = useRef(handleUndo);
  handleUndoRef.current = handleUndo;
  const handleRedoRef = useRef(handleRedo);
  handleRedoRef.current = handleRedo;

  // Keyboard shortcut listener for QuestionEditorModal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;

      // Undo/Redo Shortcuts (Ctrl+Z, Ctrl+Shift+Z / Ctrl+Y)
      if (isModifier && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          handleRedoRef.current(); // Ctrl + Shift + Z
        } else {
          handleUndoRef.current(); // Ctrl + Z
        }
        return;
      }
      if (isModifier && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        e.stopPropagation();
        handleRedoRef.current(); // Ctrl + Y
        return;
      }

      // Ctrl + S / Cmd + S: Save
      if (isModifier && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          executeSaveRef.current(true); // Ctrl + Shift + S: Save & Create next
        } else {
          executeSaveRef.current(false); // Ctrl + S: Save & Close
        }
        return;
      }

      // Escape: Close modal
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        vibrateTap();
        onCloseRef.current();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen]);

  // Lock body scroll when modal is open
  useLockBodyScroll(isOpen);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const currentDomainObj = DIGITAL_COMPETENCY_DOMAINS[domain];

  return createPortal(
    <div 
      id="question-editor-modal-overlay"
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn overflow-hidden modal-backdrop-isolated select-none"
    >
      <div 
        id="question-editor-modal-dialog"
        className="max-w-4xl w-full h-[92vh] max-h-[92vh] rounded-[8px] border border-theme-accent/30 text-[#F5EFF9] shadow-2xl flex flex-col bg-[#190839] overflow-hidden overscroll-contain select-text"
      >
        
        {/* Header - Fixed */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#241148] border-b border-theme-accent/20 shrink-0 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[6px] bg-theme-accent flex items-center justify-center text-[#190839] shadow-sm font-bold shrink-0">
              <Sparkles className="w-5 h-5 text-[#190839]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                <span>{questionToEdit ? 'Chỉnh Sửa Câu Hỏi BTI 2026' : 'Biên Soạn Câu Hỏi Mới'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-[4px] font-mono font-semibold bg-[#3E1D74]/50 text-theme-accent border border-theme-accent/30">
                  TT 02/2025/TT-BGDĐT
                </span>
              </h2>
              <p className="text-xs text-[#B6A6D8] font-mono mt-0.5 truncate">
                Quy chuẩn theo Luật chơi BTI 2026 &amp; Khung năng lực số người học
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Auto-Save & Connectivity Live Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-white/5 border border-white/10 text-[11px] font-mono">
              {isOffline ? (
                <span className="flex items-center gap-1 text-amber-300" title="Mất kết nối mạng. Bản nháp được lưu an toàn 100% trong LocalStorage">
                  <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="hidden md:inline">Ngoại tuyến (Đã lưu nội bộ)</span>
                </span>
              ) : isAutoSaving ? (
                <span className="flex items-center gap-1 text-sky-300">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                  <span className="hidden md:inline">Đang tự động lưu...</span>
                </span>
              ) : lastSavedTime ? (
                <span className="flex items-center gap-1 text-emerald-300" title={`Bản nháp tự động lưu lúc ${lastSavedTime.toLocaleTimeString('vi-VN')}`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  <span className="hidden lg:inline text-slate-400">Tự động lưu:</span>
                  <span className="font-semibold text-emerald-300">{lastSavedTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-400">
                  <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden md:inline">Tự động lưu sẵn sàng</span>
                </span>
              )}

              {/* Quick manual save draft trigger */}
              <button
                type="button"
                onClick={() => performSaveDraft(true)}
                className="ml-1 p-1 hover:bg-white/10 text-slate-300 hover:text-white rounded transition cursor-pointer"
                title="Lưu bản nháp ngay vào LocalStorage"
              >
                <Save className="w-3.5 h-3.5 text-theme-accent" />
              </button>
            </div>

            {/* Undo / Redo Toolbar */}
            <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-[4px]">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                title="Hoàn tác (Undo - Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-white/10"></div>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                title="Làm lại (Redo - Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                vibrateTap();
                setIsAiPanelOpen(true);
                setTimeout(() => aiTopicInputRef.current?.focus(), 50);
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-600/30 to-pink-500/30 hover:from-purple-600/50 hover:to-pink-500/50 border border-theme-accent/50 text-theme-accent hover:text-white rounded-[4px] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Mở trợ lý Gemini AI để tạo nhanh câu hỏi theo từ khóa"
            >
              <Sparkles className="w-3.5 h-3.5 text-theme-accent animate-pulse" />
              <span className="hidden sm:inline">Trợ lý AI Gemini</span>
            </button>

            <button
              type="button"
              onClick={() => {
                vibrateTap();
                onClose();
              }}
              className="w-8 h-8 rounded-[4px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Đóng cửa sổ (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form id="question-editor-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5 text-xs custom-scrollbar modal-scroll-isolated overscroll-contain">
          
          {/* DRAFT RECOVERY NOTIFICATION BANNER (LocalStorage Auto-Save) */}
          {showDraftBanner && detectedDraft && (
            <div className="p-4 bg-gradient-to-r from-amber-950/90 via-[#361c0c] to-amber-950/90 border-2 border-amber-500/70 rounded-[6px] shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-[6px] bg-amber-500 flex items-center justify-center text-slate-950 shadow font-bold shrink-0 mt-0.5">
                    <History className="w-5 h-5 text-slate-950 animate-bounce" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-amber-200 text-xs sm:text-sm flex items-center gap-1.5">
                        ⚡ Phát hiện bản nháp câu hỏi chưa hoàn thành từ phiên trước!
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[10px] font-semibold">
                        Lưu tự động LocalStorage
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-100/80 font-sans">
                      Hệ thống tự động bảo toàn nội dung khi bạn đóng tab hoặc mất kết nối.
                      {detectedDraft.savedAt && (
                        <span className="ml-1 text-amber-300 font-mono font-medium">
                          (Được lưu lúc: {new Date(detectedDraft.savedAt).toLocaleString('vi-VN')})
                        </span>
                      )}
                    </p>
                    {detectedDraft.questionText && (
                      <div className="mt-2 p-2 rounded bg-black/40 border border-amber-500/30 text-amber-200/90 italic text-[11px] line-clamp-2">
                        "{detectedDraft.questionText}"
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDraftBanner(false)}
                  className="text-amber-400/60 hover:text-amber-200 p-1 rounded transition cursor-pointer shrink-0"
                  title="Tạm ẩn thông báo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Recovery Action Buttons */}
              <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleRestoreDraft(detectedDraft)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-[4px] shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-950 font-bold" />
                  <span>✨ Khôi Phục Bản Nháp Này</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDraftPreviewModal(true)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-amber-200 hover:text-white text-xs font-semibold rounded-[4px] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-300" />
                  <span>👁️ Xem Chi Tiết Bản Nháp</span>
                </button>

                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 hover:text-red-200 text-xs font-semibold rounded-[4px] transition flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Xóa Bản Nháp</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Toast feedback for draft actions */}
          {draftToastMessage && (
            <div className="p-3 rounded-[4px] bg-purple-950/90 border border-theme-accent/50 text-white text-xs font-mono flex items-center gap-2 animate-in fade-in slide-in-from-top-1 shadow-xl">
              <CheckCircle2 className="w-4 h-4 text-theme-accent shrink-0" />
              <span className="font-semibold">{draftToastMessage}</span>
            </div>
          )}

          {/* AI QUICK GENERATOR TOOLBAR (Gemini API Assistant) */}
          <div className="p-4 bg-gradient-to-r from-purple-950/70 via-[#26104d] to-indigo-950/70 border border-theme-accent/40 rounded-[6px] shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[4px] bg-gradient-to-tr from-theme-accent to-purple-400 flex items-center justify-center text-[#190839] shadow-sm font-bold">
                  <Sparkles className="w-4 h-4 text-[#190839] animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                      Trợ lý AI Gemini: Tạo Nhanh Câu Hỏi BTI 2026
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-theme-accent border border-theme-accent/30 font-mono text-[10px] font-semibold">
                      Gemini Flash API
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-200/70 font-sans mt-0.5">
                    Nhập từ khóa/chủ đề hoặc chọn gợi ý bên dưới để AI tự động soạn câu hỏi, 4 phương án, đáp án và trích dẫn luật
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  setIsAiPanelOpen(!isAiPanelOpen);
                }}
                className="text-xs text-purple-200 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded transition cursor-pointer shrink-0"
              >
                {isAiPanelOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isAiPanelOpen ? 'Thu gọn' : 'Mở rộng'}</span>
              </button>
            </div>

            {isAiPanelOpen && (
              <div className="space-y-3 pt-1">
                {/* Input row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={aiTopicInputRef}
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isAiGenerating) {
                          e.preventDefault();
                          handleQuickAiGenerate();
                        }
                      }}
                      placeholder="Nhập từ khóa hoặc chủ đề (ví dụ: Deepfake lừa đảo gọi video, Nghị định 13 bảo vệ dữ liệu, Liêm chính AI...)"
                      className="w-full bg-black/60 border border-purple-400/40 rounded-[4px] pl-3 pr-8 py-2 text-xs text-white placeholder-purple-200/40 focus:border-theme-accent focus:outline-none focus:ring-1 focus:ring-theme-accent/40"
                    />
                    {aiTopic && (
                      <button
                        type="button"
                        onClick={() => setAiTopic('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isAiGenerating}
                    onClick={() => handleQuickAiGenerate()}
                    className="px-4 py-2 bg-theme-accent hover:bg-[#ffdedd] text-[#190839] font-bold text-xs rounded-[4px] shadow transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isAiGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#190839]" />
                        <span>Đang biên soạn với Gemini...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5 text-[#190839]" />
                        <span>Tạo câu hỏi với AI</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Suggested Topic Chips */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-purple-300 font-mono">
                    <Lightbulb className="w-3 h-3 text-amber-400" />
                    <span>Chủ đề gợi ý trọng tâm BTI 2026:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_AI_TOPICS.map((topicItem) => (
                      <button
                        key={topicItem}
                        type="button"
                        disabled={isAiGenerating}
                        onClick={() => {
                          setAiTopic(topicItem);
                          handleQuickAiGenerate(topicItem);
                        }}
                        className="px-2.5 py-1 bg-white/10 hover:bg-theme-accent/20 hover:border-theme-accent/50 border border-white/15 rounded text-[11px] text-purple-100 hover:text-white transition font-sans cursor-pointer disabled:opacity-50 flex items-center gap-1 active:scale-95"
                      >
                        <Zap className="w-2.5 h-2.5 text-theme-accent" />
                        <span>{topicItem}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status / feedback alert */}
                {aiSuccessMessage && (
                  <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded text-emerald-300 text-[11px] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{aiSuccessMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickAiGenerate()}
                      disabled={isAiGenerating}
                      className="text-[10.5px] text-emerald-300 hover:text-white underline flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Tạo câu khác cùng chủ đề</span>
                    </button>
                  </div>
                )}

                {aiError && (
                  <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded text-rose-300 text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{aiError}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* SECTION 1: Cấu Trúc Khảo Thí & Luật Thi Đấu */}
          <div className="p-3.5 bg-white/5 rounded-[4px] border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-sky-300 border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>1. CẤU TRÚC GIAI ĐOẠN & VÒNG THI (LUẬT BTI 2026)</span>
              </span>
              <span className="text-[10px] text-white/40">Khảo thí chuẩn hóa</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Stage */}
              <div>
                <label className="block text-white/60 font-mono mb-1 font-semibold">Giai đoạn thi đấu:</label>
                <select
                  value={stage}
                  onChange={e => handleStageChange(e.target.value as CompetitionStage)}
                  className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-2 text-white font-medium focus:border-sky-400 focus:outline-none"
                >
                  {Object.values(COMPETITION_STAGES).map(s => (
                    <option key={s.stage} value={s.stage}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Question ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-white/60 font-mono font-semibold">Mã câu hỏi (ID):</label>
                  <button
                    type="button"
                    onClick={() => setQuestionId(generateAutoId(stage, roundFormat))}
                    className="text-[10px] text-sky-400 hover:text-sky-300 font-mono underline"
                  >
                    ⚡ Sinh mã mới
                  </button>
                </div>
                <input
                  type="text"
                  value={questionId}
                  onChange={e => setQuestionId(e.target.value)}
                  required
                  className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-2 text-sky-300 font-mono font-bold focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>

            {/* 2-LEVEL SELECTION: Vòng thi => Dạng đề thi */}
            <div className="p-3 bg-white/[0.03] border border-white/10 rounded-[4px] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-white/80">
                <span className="flex items-center gap-1.5 text-sky-300">
                  <Layers className="w-3.5 h-3.5" />
                  <span>PHÂN LOẠI 2 MỨC: VÒNG THI ⇒ DẠNG ĐỀ</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-normal">
                  ✓ Chuẩn hóa 6 vòng • Đã rà soát trùng lặp
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Mức 1: Vòng thi / Giai đoạn đề thi */}
                <div>
                  <label className="block text-xs font-mono text-sky-300 mb-1.5 font-bold flex items-center justify-between">
                    <span>🏆 MỨC 1: {stage === 'VONG_LOAI' ? 'GIAI ĐOẠN ĐỀ THI' : 'CHỌN VÒNG THI'}</span>
                    <span className="text-[10px] text-white/50 font-normal">
                      {stage === 'VONG_LOAI' ? 'Đề 28 câu chuẩn hóa' : '5 vòng Gameshow'}
                    </span>
                  </label>
                  {stage === 'VONG_LOAI' ? (
                    <div className="p-2.5 bg-sky-950/40 border border-sky-400/40 rounded-[4px] space-y-1">
                      <div className="text-sky-300 font-bold font-mono text-xs flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-sky-400" />
                        <span>Đề thi Vòng Loại (28 câu duy nhất)</span>
                      </div>
                      <p className="text-white/70 text-[10.5px] leading-relaxed">
                        Vòng loại chỉ có 1 dạng đề gồm 28 câu (24 câu Phần I và 4 câu Phần II), không chọn các vòng thi như Bán kết và Chung kết.
                      </p>
                    </div>
                  ) : (
                    <>
                      <select
                        value={roundGroup}
                        onChange={e => handleRoundGroupChange(e.target.value as BtiRoundGroupKey)}
                        className="w-full bg-black/70 border border-sky-500/40 rounded-[4px] px-3 py-2 text-xs text-white font-medium focus:border-sky-400 focus:outline-none ring-1 ring-sky-500/20"
                      >
                        {getRoundGroupsForStage(stage).map(g => (
                          <option key={g.key} value={g.key}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                      {BTI_ROUND_GROUPS[roundGroup] && (
                        <div className="mt-1 text-[11px] text-white/50 font-mono truncate">
                          {BTI_ROUND_GROUPS[roundGroup].description}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Mức 2: Dạng đề thi / Phần thi trong đề */}
                <div>
                  {roundGroup === 'VCNV' ? (
                    <div>
                      <label className="block text-xs font-mono text-amber-300 mb-1.5 font-bold flex items-center justify-between">
                        <span>📋 MỨC 2: QUY TRÌNH BỘ ĐỀ VCNV</span>
                        <span className="text-[10px] text-emerald-400 font-mono">Quy chuẩn BTI 2026</span>
                      </label>
                      <div className="p-2.5 bg-black/70 border border-amber-500/40 rounded-[4px] text-xs space-y-1">
                        <div className="text-amber-200 font-bold flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-amber-400" />
                          <span>Bộ đề 7 hàng chuẩn hóa (Không cần chọn dạng)</span>
                        </div>
                        <p className="text-white/70 text-[10.5px] leading-relaxed">
                          Gồm 1 Từ khóa chính + 1 Ô mạo hiểm + 4 Hàng ngang gợi ý + 1 Ô trung tâm & Ảnh gợi ý đính kèm.
                        </p>
                      </div>
                    </div>
                  ) : stage === 'VONG_LOAI' ? (
                    <div>
                      <label className="block text-xs font-mono text-amber-300 mb-1.5 font-bold flex items-center justify-between">
                        <span>📋 MỨC 2: PHẦN THI TRONG ĐỀ 28 CÂU</span>
                        <span className="text-[10px] text-amber-400 font-normal">
                          {getActiveFormatsForRoundGroup('VONG_LOAI').length} phần chuẩn hóa
                        </span>
                      </label>
                      <select
                        value={roundFormat}
                        onChange={e => handleFormatChange(e.target.value as QuestionRoundFormat)}
                        className="w-full bg-black/70 border border-amber-500/40 rounded-[4px] px-3 py-2 text-xs text-amber-200 font-medium focus:border-amber-400 focus:outline-none ring-1 ring-amber-500/20"
                      >
                        {getActiveFormatsForRoundGroup('VONG_LOAI').map(fmt => (
                          <option key={fmt.format} value={fmt.format}>
                            {fmt.name}
                          </option>
                        ))}
                      </select>
                      {QUESTION_ROUND_FORMATS[roundFormat] && (
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-amber-400/80 font-mono">
                          <span>⏱️ {QUESTION_ROUND_FORMATS[roundFormat].defaultTimeLimit}s</span>
                          <span>•</span>
                          <span>⭐ {QUESTION_ROUND_FORMATS[roundFormat].defaultPoints} điểm</span>
                          <span>•</span>
                          <span>{QUESTION_ROUND_FORMATS[roundFormat].defaultRoundType}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-mono text-amber-300 mb-1.5 font-bold flex items-center justify-between">
                        <span>📋 MỨC 2: DẠNG ĐỀ THI</span>
                        <span className="text-[10px] text-amber-400 font-normal">
                          {getActiveFormatsForRoundGroup(roundGroup).length} dạng của {BTI_ROUND_GROUPS[roundGroup]?.shortName}
                        </span>
                      </label>
                      <select
                        value={roundFormat}
                        onChange={e => handleFormatChange(e.target.value as QuestionRoundFormat)}
                        className="w-full bg-black/70 border border-amber-500/40 rounded-[4px] px-3 py-2 text-xs text-amber-200 font-medium focus:border-amber-400 focus:outline-none ring-1 ring-amber-500/20"
                      >
                        {getActiveFormatsForRoundGroup(roundGroup).map(fmt => (
                          <option key={fmt.format} value={fmt.format}>
                            {fmt.name}
                          </option>
                        ))}
                      </select>
                      {QUESTION_ROUND_FORMATS[roundFormat] && (
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-amber-400/80 font-mono">
                          <span>⏱️ {QUESTION_ROUND_FORMATS[roundFormat].defaultTimeLimit}s</span>
                          <span>•</span>
                          <span>⭐ {QUESTION_ROUND_FORMATS[roundFormat].defaultPoints} điểm</span>
                          <span>•</span>
                          <span>{QUESTION_ROUND_FORMATS[roundFormat].defaultRoundType}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* KHỞI ĐỘNG: LỰA CHỌN LƯỢT THI RIÊNG HOẶC CHUNG (Áp dụng cho tất cả 7 dạng câu hỏi) */}
              {roundGroup === 'KHOI_DONG' && (
                <div className="p-3 bg-sky-950/40 border border-sky-500/30 rounded-[4px] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-sky-300 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-sky-400" />
                      <span>LỰA CHỌN LƯỢT THI KHỞI ĐỘNG (ÁP DỤNG CHO TẤT CẢ 7 DẠNG CÂU HỎI)</span>
                    </label>
                    <span className="text-[10px] font-mono text-emerald-300 font-semibold">
                      {kdTurn === 'RIENG' ? '✓ Đang chọn: Khởi động riêng' : '✓ Đang chọn: Khởi động chung'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleKdTurnChange('RIENG')}
                      className={`p-2.5 rounded-[4px] border text-left transition cursor-pointer flex items-start gap-2.5 ${
                        kdTurn === 'RIENG'
                          ? 'bg-sky-500/20 border-sky-400 text-white ring-1 ring-sky-400/40 shadow-sm'
                          : 'bg-black/40 border-white/10 text-white/60 hover:bg-white/5 hover:text-white/80'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        kdTurn === 'RIENG' ? 'border-sky-400 bg-sky-500' : 'border-white/30'
                      }`}>
                        {kdTurn === 'RIENG' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-sky-200">1. Khởi động riêng (Lượt từng thí sinh)</div>
                        <div className="text-[10.5px] text-white/60 mt-0.5 leading-snug">
                          Tối đa 12 câu trong 60 giây cá nhân • +10đ/câu đúng, không trừ điểm khi sai/bỏ qua
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleKdTurnChange('CHUNG')}
                      className={`p-2.5 rounded-[4px] border text-left transition cursor-pointer flex items-start gap-2.5 ${
                        kdTurn === 'CHUNG'
                          ? 'bg-indigo-500/20 border-indigo-400 text-white ring-1 ring-indigo-400/40 shadow-sm'
                          : 'bg-black/40 border-white/10 text-white/60 hover:bg-white/5 hover:text-white/80'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        kdTurn === 'CHUNG' ? 'border-indigo-400 bg-indigo-500' : 'border-white/30'
                      }`}>
                        {kdTurn === 'CHUNG' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-indigo-200">2. Khởi động chung (Bấm chuông giành quyền)</div>
                        <div className="text-[10.5px] text-white/60 mt-0.5 leading-snug">
                          Cả 4 thí sinh bấm chuông (3 lượt/12 câu) • 3s trả lời • +10đ đúng, -5đ sai
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Chi tiết quy chuẩn & cách chấm điểm */}
              {QUESTION_ROUND_FORMATS[roundFormat] && (
                <div className="p-2.5 bg-sky-950/40 border border-sky-500/25 rounded-[4px] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sky-300">
                      📜 {QUESTION_ROUND_FORMATS[roundFormat].ruleSection}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                      {QUESTION_ROUND_FORMATS[roundFormat].shortName}
                    </span>
                  </div>
                  <p className="text-white/80 leading-relaxed text-[11.5px]">
                    {QUESTION_ROUND_FORMATS[roundFormat].description}
                  </p>
                  <div className="text-amber-300 text-[11px] pt-0.5 font-medium">
                    🎯 Quy tắc tính điểm: {QUESTION_ROUND_FORMATS[roundFormat].scoringRule}
                  </div>

                  {/* Quick Gói điểm chooser for Về Đích (áp dụng cho cả 3 dạng: Trả lời ngắn, 4 Đúng/Sai, AID 4 PA) */}
                  {roundGroup === 'VE_DICH' && (
                    <div className="pt-2 border-t border-sky-500/20 mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-amber-300">
                        ⚡ Chọn gói điểm Về Đích:
                      </span>
                      {[
                        { pts: 20, sec: 15, label: 'Gói 20 điểm (15s)' },
                        { pts: 30, sec: 20, label: 'Gói 30 điểm (20s)' },
                        { pts: 40, sec: 30, label: 'Gói 40 điểm (30s)' }
                      ].map(pkg => (
                        <button
                          key={pkg.pts}
                          type="button"
                          onClick={() => {
                            setPoints(pkg.pts);
                            setTimeLimit(pkg.sec);
                            setRoundName(`Vòng 4: Về Đích (${pkg.label})`);
                          }}
                          className={`px-3 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                            points === pkg.pts
                              ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-300'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          ⭐ {pkg.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Timing, Score & Round Name: Bỏ chọn thời gian và điểm đối với Vòng Loại, Khởi động, VCNV, Tăng tốc, Về đích */}
            {['VONG_LOAI', 'KHOI_DONG', 'VCNV', 'TANG_TOC', 'VE_DICH'].includes(roundGroup) || stage === 'VONG_LOAI' ? (
              <div className="p-3 bg-white/[0.02] border border-white/10 rounded-[4px] space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-5">
                    <label className="block text-white/60 font-mono mb-1">Tên phần / vòng hiển thị:</label>
                    <input
                      type="text"
                      value={roundName}
                      onChange={e => setRoundName(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-1.5 text-white text-xs"
                    />
                  </div>
                  <div className="sm:col-span-7">
                    <label className="block text-white/60 font-mono mb-1">Quy định thời gian & Thang điểm (Cố định theo luật thi):</label>
                    <div className="p-2 bg-black/60 border border-white/10 rounded-[4px] text-xs font-mono flex items-center justify-between gap-2">
                      {(roundGroup === 'VONG_LOAI' || stage === 'VONG_LOAI') && (
                        <div className="text-emerald-300">
                          {roundFormat === 'BGD_TRUE_FALSE_4' ? (
                            <span>⏱️ Toàn bài thi (45-50 phút) • ⭐ Phần II: 4đ/câu (1 ý: 0.5đ • 2 ý: 1đ • 3 ý: 2đ • 4 ý: 4đ)</span>
                          ) : (
                            <span>⏱️ Toàn bài thi (45-50 phút) • ⭐ Phần I: Cố định +1 điểm / câu trắc nghiệm đúng</span>
                          )}
                        </div>
                      )}
                      {roundGroup === 'KHOI_DONG' && (
                        <div className="text-sky-300">
                          ⏱️ {kdTurn === 'RIENG' ? '60 giây cá nhân (12 câu)' : '3 giây/câu (bấm chuông)'} • ⭐ +10đ/câu đúng
                        </div>
                      )}
                      {roundGroup === 'VCNV' && (
                        <div className="text-amber-300">
                          ⏱️ Hàng ngang 15s • Mạo hiểm 20s • ⭐ Hàng ngang 10đ • Mạo hiểm 120đ • CNV 80đ-10đ
                        </div>
                      )}
                      {roundGroup === 'TANG_TOC' && (
                        <div className="text-amber-300">
                          ⏱️ 30 giây/câu • ⭐ 40đ (Nhanh nhất) • 30đ (Nhì) • 20đ (Ba) • 10đ (Tư)
                        </div>
                      )}
                      {roundGroup === 'VE_DICH' && (
                        <div className="text-amber-300">
                          ⏱️ {points === 40 ? '30' : points === 30 ? '20' : '15'} giây/câu • ⭐ Gói {points || 20} điểm (NSHV: đúng x2, sai -50%)
                        </div>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-normal shrink-0 ${
                        roundGroup === 'VONG_LOAI' || stage === 'VONG_LOAI'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/10 text-white/50'
                      }`}>
                        {roundGroup === 'VONG_LOAI' || stage === 'VONG_LOAI' ? 'Chuẩn Đề 28 câu' : 'Tự động'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Cho phép chỉnh sửa thời gian và điểm ở các vòng tự do khác (như Câu hỏi phụ) */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-white/60 font-mono mb-1">Tên vòng hiển thị:</label>
                  <input
                    type="text"
                    value={roundName}
                    onChange={e => setRoundName(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-white/60 font-mono mb-1">Thời gian đếm ngược (giây):</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={timeLimit}
                      onChange={e => setTimeLimit(Number(e.target.value))}
                      className="w-20 bg-black/60 border border-white/15 rounded-[4px] px-3 py-1.5 text-center font-mono font-bold text-white"
                    />
                    <div className="flex gap-1 flex-1">
                      {[10, 15, 20, 30, 60].map(sec => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setTimeLimit(sec)}
                          className={`px-1.5 py-1 rounded text-[10px] font-mono font-bold ${
                            timeLimit === sec ? 'bg-sky-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/15'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 font-mono mb-1">Thang điểm (Điểm thưởng):</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={points}
                      onChange={e => setPoints(Number(e.target.value))}
                      className="w-20 bg-black/60 border border-white/15 rounded-[4px] px-3 py-1.5 text-center font-mono font-bold text-amber-300"
                    />
                    <div className="flex gap-1 flex-1">
                      {[10, 20, 30, 40, 120].map(pt => (
                        <button
                          key={pt}
                          type="button"
                          onClick={() => setPoints(pt)}
                          className={`px-1.5 py-1 rounded text-[10px] font-mono font-bold ${
                            points === pt ? 'bg-amber-500 text-slate-950' : 'bg-white/10 text-white/60 hover:bg-white/15'
                          }`}
                        >
                          {pt}đ
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Căn Cứ Khung Năng Lực Số & Pháp Lý */}
          <div className="p-3.5 bg-white/5 rounded-[4px] border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-purple-300 border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-purple-400" />
                <span>2. ĐỐI SOÁT THÔNG TƯ 02/2025/TT-BGDĐT & VĂN BẢN PHÁP LÝ</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoClassify}
                  disabled={isClassifying}
                  className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 rounded-[3px] border border-purple-500/30 transition disabled:opacity-50 cursor-pointer"
                  title="AI tự động đọc câu hỏi và đề xuất Miền, Mức độ & Tags phù hợp"
                >
                  {isClassifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Tự động phân loại</span>
                </button>
                <span className="text-[10px] text-white/40">Ma trận 6x4</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Domain */}
              <div>
                <label className="block text-white/60 font-mono mb-1 font-semibold">Miền năng lực số (I ➔ VI):</label>
                <select
                  value={domain}
                  onChange={e => handleDomainChange(e.target.value as DigitalCompetencyDomainKey)}
                  className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-2 text-white font-medium focus:border-purple-400 focus:outline-none"
                >
                  {Object.values(DIGITAL_COMPETENCY_DOMAINS).map(d => (
                    <option key={d.key} value={d.key}>
                      {d.code}: {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub-competency */}
              <div>
                <label className="block text-white/60 font-mono mb-1 font-semibold">Năng lực thành phần:</label>
                <select
                  value={subCompetency}
                  onChange={e => setSubCompetency(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-2 text-white font-medium focus:border-purple-400 focus:outline-none"
                >
                  {currentDomainObj?.subCompetencies?.map(sub => (
                    <option key={sub.code} value={sub.code}>
                      Mục {sub.code}: {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cognitive Level */}
              <div>
                <label className="block text-white/60 font-mono mb-1 font-semibold">Mức độ nhận thức:</label>
                <select
                  value={cognitiveLevel}
                  onChange={e => setCognitiveLevel(e.target.value as CognitiveLevel)}
                  className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-2 text-white font-medium focus:border-purple-400 focus:outline-none"
                >
                  {Object.values(COGNITIVE_LEVELS).map(lvl => (
                    <option key={lvl.level} value={lvl.level}>
                      {lvl.name} ({lvl.levelsRange})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Category Selection Row */}
            <div className="pt-1">
              <label className="block text-white/60 font-mono mb-1 font-semibold flex items-center justify-between">
                <span>Danh mục câu hỏi (Custom Category):</span>
                <span className="text-[10px] text-purple-300 font-normal">Chủ đề chính phân loại đề thi</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={customCategoryInput}
                  onChange={e => setCustomCategoryInput(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-1.5 text-purple-200 font-medium focus:border-purple-400 focus:outline-none"
                >
                  {questionBankManager.getCustomCategories().map(cat => (
                    <option key={cat.id} value={cat.name}>
                      📁 {cat.name} {cat.description ? `(${cat.description})` : ''}
                    </option>
                  ))}
                  {!questionBankManager.getCustomCategories().some(c => c.name === customCategoryInput) && customCategoryInput && (
                    <option value={customCategoryInput}>📁 {customCategoryInput} (Tùy chỉnh)</option>
                  )}
                </select>

                <input
                  type="text"
                  value={customCategoryInput}
                  onChange={e => setCustomCategoryInput(e.target.value)}
                  placeholder="Hoặc tự nhập danh mục mới..."
                  className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-1.5 text-purple-200 font-mono focus:border-purple-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-white/60 font-mono mb-1">Căn cứ pháp lý tham chiếu:</label>
                <input
                  type="text"
                  value={legalReference}
                  onChange={e => setLegalReference(e.target.value)}
                  placeholder="VD: Nghị định 13/2023/NĐ-CP Điều 9..."
                  className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-1.5 text-amber-300 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-white/60 font-mono">Thẻ phân loại (Tags):</label>
                  <button
                    type="button"
                    onClick={handleAutoTagWithAI}
                    disabled={isGeneratingAutoTags}
                    className="flex items-center gap-1.5 px-2.5 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-mono font-bold rounded-[4px] shadow-sm transition disabled:opacity-50 cursor-pointer border border-purple-400/30"
                    title="Phân tích nội dung câu hỏi bằng Gemini AI để tự động gắn thẻ tìm kiếm tối ưu"
                  >
                    {isGeneratingAutoTags ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-purple-200" />
                    ) : (
                      <Wand2 className="w-3 h-3 text-amber-300" />
                    )}
                    <span>✨ Auto-Tag với AI</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  placeholder="Nhập tên nhãn (cách nhau bởi dấu phẩy)..."
                  className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-1.5 text-white/80 font-mono focus:border-purple-400 focus:outline-none"
                />

                {/* AI Auto-Tag Reasoning Banner */}
                {aiTagReasoning && (
                  <div className="mt-2 p-2 rounded bg-purple-950/60 border border-purple-500/30 text-[11px] text-purple-200 flex items-start gap-1.5 animate-fadeIn">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-semibold text-amber-300 font-mono">Gemini AI Auto-Tag: </span>
                      <span>{aiTagReasoning}</span>
                    </div>
                  </div>
                )}

                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-white/40 uppercase font-mono">Gợi ý nhãn có sẵn:</span>
                    {questionBankManager.getCustomTags().length > 10 && (
                      <button 
                        type="button" 
                        onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                        className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                      >
                        {isTagsExpanded ? 'Thu gọn' : 'Xem tất cả'}
                        {isTagsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                  <div className={`flex flex-wrap gap-1.5 overflow-hidden transition-all duration-300 ${isTagsExpanded ? 'max-h-[500px] overflow-y-auto custom-scrollbar pr-1' : 'max-h-[52px]'}`}>
                    {questionBankManager.getCustomTags().map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const currentTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
                          if (!currentTags.includes(tag)) {
                            setTagsInput(currentTags.length > 0 ? `${currentTags.join(', ')}, ${tag}` : tag);
                          }
                        }}
                        className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono border border-purple-400/30 text-purple-300 bg-purple-500/20 hover:bg-purple-500/40 transition cursor-pointer"
                        title="Nhấn để thêm nhãn này"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Nội Dung Đề Bài & Phương Tiện (Bỏ khung nội dung đơn lẻ đối với VCNV vì đã theo quy trình 7 hàng) */}
          {roundGroup !== 'VCNV' && (
            <div className="p-3.5 bg-white/5 rounded-[4px] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-300 border-b border-white/10 pb-2">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>3. NỘI DUNG CÂU HỎI & PHƯƠNG TIỆN ĐÍNH KÈM</span>
                </span>
                <span className="text-[10px] text-white/40">Bối cảnh tình huống</span>
              </div>

              <div>
                <label className="block text-white/60 mb-1 font-semibold">
                  Nội dung câu hỏi / Tình huống thực tiễn: <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  required
                  placeholder="Nhập chi tiết đề bài, tình huống đặt ra cho thí sinh..."
                  className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-2 text-white placeholder-white/40 focus:border-emerald-400 focus:outline-none leading-relaxed"
                />
              </div>
              
              {/* Real-time Similarity Warning */}
              {similarQuestions.length > 0 && (
                <div className="bg-amber-950/40 border border-amber-500/40 rounded-[4px] p-3 text-xs mt-2 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Cảnh báo trùng lặp nội dung ({similarQuestions.length} câu tương tự)</span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {similarQuestions.map((sim, idx) => (
                      <div key={idx} className="bg-black/30 border border-white/5 rounded p-2">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-white/50 font-mono text-[10px]">ID: {sim.question.id}</span>
                          <span className={`font-mono font-bold ${sim.score > 0.8 ? 'text-rose-400' : 'text-amber-400'}`}>
                            Trùng khớp {Math.round(sim.score * 100)}%
                          </span>
                        </div>
                        <p className="text-white/80 line-clamp-2">{sim.question.question_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Media Attachment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-white/60 font-mono mb-1">Phương tiện minh họa:</label>
                  <select
                    value={mediaType}
                    onChange={e => setMediaType(e.target.value as any)}
                    className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-1.5 text-white"
                  >
                    <option value="NONE">Không đính kèm</option>
                    <option value="IMAGE">Hình ảnh (URL)</option>
                    <option value="VIDEO">Video (URL / YouTube)</option>
                    <option value="AUDIO">Âm thanh (URL Audio)</option>
                  </select>
                </div>

                {mediaType !== 'NONE' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-white/60 font-mono">Đường dẫn liên kết (URL):</label>
                      <GooglePickerTriggerButton
                        viewId={mediaType === 'IMAGE' ? 'DOCS_IMAGES' : (mediaType === 'VIDEO' ? 'DOCS_VIDEOS' : 'ALL')}
                        label="Chọn từ Google Drive"
                        variant="subtle"
                        onFilePicked={async (file) => {
                          if (mediaType === 'IMAGE') {
                            const directUrl = await googlePickerService.getDirectImageUrl(file.id);
                            setMediaUrl(directUrl);
                          } else if (file.url) {
                            setMediaUrl(file.url);
                          }
                        }}
                      />
                    </div>
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={e => setMediaUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-1.5 text-sky-300 font-mono"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 4: Các Phương Án & Đáp Án Chuẩn */}
          <div className="p-3.5 bg-white/5 rounded-[4px] border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300 border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>4. CẤU HÌNH PHƯƠNG ÁN & ĐÁP ÁN CHUẨN THEO ĐỊNH DẠNG</span>
              </span>
              <span className="text-[10px] text-white/50 font-mono">
                {roundGroup === 'VCNV' ? 'Cấu trúc 7 hàng & Ảnh VCNV' : `Dạng: ${roundFormat}`}
              </span>
            </div>

            {/* CASE A: VCNV (Quy hoạch cấu trúc 7 hàng & Upload ảnh gợi ý theo chuẩn BTI 2026) */}
            {(roundType === 'VCNV' || roundGroup === 'VCNV') ? (
              <div className="space-y-3 p-3.5 bg-cyan-950/30 border border-cyan-500/40 rounded-[4px]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-cyan-500/20 pb-2">
                  <span className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-amber-400" />
                    CẤU TRÚC 7 HÀNG VƯỢT CHƯỚNG NGẠI VẬT & ẢNH GỢI Ý (BTI 2026)
                  </span>
                  <span className="text-[11px] text-cyan-300/80 font-mono">
                    ✓ Tự động đếm các chữ cái (không tính dấu cách) trừ Ô mạo hiểm
                  </span>
                </div>

                {/* HÀNG 1: Từ khóa chướng ngại vật */}
                <div className="p-3 bg-black/50 border border-amber-500/40 rounded-[4px] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                      <span>🔑 HÀNG 1: TỪ KHÓA CHƯỚNG NGẠI VẬT CHÍNH</span>
                    </label>
                    <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {countLetters(correctKey)} chữ cái
                    </span>
                  </div>
                  <input
                    type="text"
                    value={correctKey}
                    onChange={e => setCorrectKey(e.target.value.toUpperCase())}
                    placeholder="VD: AN TOÀN THÔNG TIN, CHỮ KÝ SỐ, NGHỊ ĐỊNH 13..."
                    required
                    className="w-full bg-black/70 border border-amber-500/50 rounded-[4px] px-3 py-2 text-amber-200 font-mono font-black uppercase text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* BỔ SUNG UPLOAD ẢNH GỢI Ý CHƯỚNG NGẠI VẬT (Bị che bởi các mảnh ghép hàng ngang) */}
                <div className="p-3 bg-black/50 border border-cyan-500/40 rounded-[4px] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-cyan-400" />
                      <span>ẢNH GỢI Ý CHƯỚNG NGẠI VẬT (MẢNH GHÉP CHE ẢNH BỞI CÁC HÀNG NGANG)</span>
                    </label>
                    {vcnvImage && (
                      <button
                        type="button"
                        onClick={() => setVcnvImage('')}
                        className="text-[10px] text-rose-400 hover:text-rose-300 underline font-mono cursor-pointer"
                      >
                        ✕ Xóa ảnh
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-6">
                      <label className="block text-[10px] font-mono text-white/60 mb-1 flex items-center gap-1">
                        <Upload className="w-3 h-3 text-cyan-400" />
                        <span>Tải ảnh từ máy tính (Upload):</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setVcnvImage(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="block w-full text-xs text-white/70 file:mr-2 file:py-1 file:px-2.5 file:rounded-[4px] file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-mono text-white/60">
                          Hoặc chọn ảnh từ Drive / URL:
                        </label>
                        <GooglePickerTriggerButton
                          viewId="DOCS_IMAGES"
                          label="Chọn ảnh từ Drive"
                          variant="subtle"
                          onFilePicked={async (file) => {
                            const directUrl = await googlePickerService.getDirectImageUrl(file.id);
                            setVcnvImage(directUrl);
                          }}
                        />
                      </div>
                      <input
                        type="text"
                        value={vcnvImage.startsWith('data:') ? '(Ảnh tải từ máy tính)' : vcnvImage}
                        onChange={e => setVcnvImage(e.target.value)}
                        placeholder="https://... hoặc /images/obstacle.png"
                        disabled={vcnvImage.startsWith('data:')}
                        className="w-full bg-black/70 border border-white/15 rounded-[4px] px-2.5 py-1.5 text-xs text-white font-mono placeholder-white/30"
                      />
                    </div>
                  </div>

                  {/* Image Preview */}
                  {vcnvImage && (
                    <div className="p-2.5 bg-black/80 border border-cyan-500/30 rounded-[4px] flex items-center gap-3">
                      <img
                        src={vcnvImage}
                        alt="Ảnh gợi ý chướng ngại vật"
                        className="w-24 h-16 object-cover rounded border border-white/20 bg-slate-900 shrink-0"
                      />
                      <div className="text-xs space-y-1">
                        <div className="text-cyan-300 font-bold font-mono flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Đã nạp ảnh gợi ý chướng ngại vật thành công</span>
                        </div>
                        <p className="text-[10.5px] text-white/60 leading-tight">
                          Hình ảnh này sẽ được hệ thống chia làm 4 mảnh ghép che bởi 4 Hàng ngang (Hàng 3-6) và 1 Ô trung tâm (Hàng 7).
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* HÀNG 2: Cột trái: Nội dung ô mạo hiểm; Cột phải: Đáp án */}
                <div className="p-3 bg-black/50 border border-rose-500/30 rounded-[4px] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-rose-300 flex items-center gap-1.5">
                      <span>⚡ HÀNG 2: Ô MẠO HIỂM (+120đ / -50% điểm)</span>
                    </label>
                    <span className="text-[10px] font-mono text-rose-300/60">
                      (Không áp dụng đếm chữ cái)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                    <div className="md:col-span-7">
                      <label className="block text-[11px] font-mono text-white/70 mb-1">
                        Cột trái: Nội dung câu hỏi / tình huống Ô mạo hiểm
                      </label>
                      <textarea
                        rows={2}
                        value={vcnvRiskQuestion}
                        onChange={e => setVcnvRiskQuestion(e.target.value)}
                        placeholder="Nội dung câu hỏi tình huống ô mạo hiểm (chỉ mở 1 lần duy nhất)..."
                        className="w-full bg-black/70 border border-white/15 rounded-[4px] px-3 py-1.5 text-xs text-white focus:border-rose-400 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-5">
                      <label className="block text-[11px] font-mono text-rose-200 mb-1">
                        Cột phải: Đáp án Ô mạo hiểm
                      </label>
                      <textarea
                        rows={2}
                        value={vcnvRiskAnswer}
                        onChange={e => setVcnvRiskAnswer(e.target.value)}
                        placeholder="Đáp án hoặc biểu điểm ô mạo hiểm..."
                        className="w-full bg-black/70 border border-rose-500/40 rounded-[4px] px-3 py-1.5 text-xs text-rose-200 font-medium focus:border-rose-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* HÀNG 3 - 6: Cột trái: Nội dung hàng ngang; Cột phải: Đáp án hàng ngang */}
                <div className="space-y-2">
                  {[
                    { num: 1, label: 'HÀNG 3: HÀNG NGANG 1', clue: vcnvClue1, setClue: setVcnvClue1, ans: vcnvAns1, setAns: setVcnvAns1 },
                    { num: 2, label: 'HÀNG 4: HÀNG NGANG 2', clue: vcnvClue2, setClue: setVcnvClue2, ans: vcnvAns2, setAns: setVcnvAns2 },
                    { num: 3, label: 'HÀNG 5: HÀNG NGANG 3', clue: vcnvClue3, setClue: setVcnvClue3, ans: vcnvAns3, setAns: setVcnvAns3 },
                    { num: 4, label: 'HÀNG 6: HÀNG NGANG 4', clue: vcnvClue4, setClue: setVcnvClue4, ans: vcnvAns4, setAns: setVcnvAns4 },
                  ].map(row => (
                    <div key={row.num} className="p-2.5 bg-black/40 border border-white/10 rounded-[4px] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-sky-300">
                          🧩 {row.label} (15s - 10đ)
                        </span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          {countLetters(row.ans)} chữ cái
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                        <div className="md:col-span-7">
                          <label className="block text-[10px] font-mono text-white/50 mb-0.5">
                            Cột trái: Nội dung câu hỏi hàng ngang {row.num}
                          </label>
                          <input
                            type="text"
                            value={row.clue}
                            onChange={e => row.setClue(e.target.value)}
                            placeholder={`Câu hỏi gợi ý hàng ngang ${row.num}...`}
                            className="w-full bg-black/70 border border-white/15 rounded-[4px] px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div className="md:col-span-5">
                          <label className="block text-[10px] font-mono text-sky-200 mb-0.5">
                            Cột phải: Đáp án hàng ngang {row.num}
                          </label>
                          <input
                            type="text"
                            value={row.ans}
                            onChange={e => row.setAns(e.target.value.toUpperCase())}
                            placeholder={`Đáp án hàng ngang ${row.num}...`}
                            className="w-full bg-black/70 border border-sky-500/40 rounded-[4px] px-3 py-1.5 text-xs text-sky-200 font-mono font-bold uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* HÀNG 7: Cột trái: Nội dung ô trung tâm; Cột phải: Đáp án ô trung tâm */}
                <div className="p-3 bg-black/50 border border-amber-500/30 rounded-[4px] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-300">
                      🌟 HÀNG 7: Ô TRUNG TÂM (Gợi ý cuối cùng - 15s - 10đ)
                    </span>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {countLetters(vcnvCenterAns)} chữ cái
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    <div className="md:col-span-7">
                      <label className="block text-[10px] font-mono text-white/50 mb-0.5">
                        Cột trái: Nội dung gợi ý Ô trung tâm
                      </label>
                      <input
                        type="text"
                        value={vcnvCenter}
                        onChange={e => setVcnvCenter(e.target.value)}
                        placeholder="Gợi ý ô trung tâm xuất hiện sau 4 hàng ngang..."
                        className="w-full bg-black/70 border border-white/15 rounded-[4px] px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="md:col-span-5">
                      <label className="block text-[10px] font-mono text-amber-200 mb-0.5">
                        Cột phải: Đáp án Ô trung tâm
                      </label>
                      <input
                        type="text"
                        value={vcnvCenterAns}
                        onChange={e => setVcnvCenterAns(e.target.value.toUpperCase())}
                        placeholder="Đáp án ô trung tâm..."
                        className="w-full bg-black/70 border border-amber-500/40 rounded-[4px] px-3 py-1.5 text-xs text-amber-200 font-mono font-bold uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : roundType === 'TRUE_FALSE_4' ? (
              /* CASE B: TRUE_FALSE_4 (Câu hỏi tình huống 4 ý đúng/sai - Về Đích 4.2 & Phần II Bộ GD&ĐT) */
              <div className="space-y-3 p-3 bg-purple-950/20 border border-purple-500/30 rounded-[4px]">
                <div className="flex items-center justify-between text-purple-300 font-mono font-bold">
                  <span>4 Mệnh đề / Nhận định Đúng - Sai (a, b, c, d):</span>
                  <span className="text-[10px] text-purple-200 font-normal">
                    Chuẩn Về Đích 4.2 & Phần II Bộ GD&ĐT
                  </span>
                </div>

                <div className="space-y-2.5">
                  {tfItems.map((item, idx) => (
                    <div key={item.key} className="flex items-center gap-2">
                      <span className="w-6 font-mono font-bold text-purple-300 text-center">{item.key})</span>
                      <input
                        type="text"
                        value={item.text}
                        onChange={e => {
                          const next = [...tfItems];
                          next[idx].text = e.target.value;
                          setTfItems(next);
                        }}
                        required
                        placeholder={`Nội dung mệnh đề ${item.key}...`}
                        className="flex-1 bg-black/60 border border-white/15 rounded-[4px] px-3 py-1.5 text-white"
                      />
                      <div className="flex rounded-[4px] overflow-hidden border border-white/15">
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...tfItems];
                            next[idx].isCorrect = true;
                            setTfItems(next);
                          }}
                          className={`px-3 py-1 font-mono font-bold text-xs transition cursor-pointer ${
                            item.isCorrect ? 'bg-emerald-600 text-white' : 'bg-white/5 text-white/40 hover:text-white'
                          }`}
                        >
                          ĐÚNG
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...tfItems];
                            next[idx].isCorrect = false;
                            setTfItems(next);
                          }}
                          className={`px-3 py-1 font-mono font-bold text-xs transition cursor-pointer ${
                            !item.isCorrect ? 'bg-rose-600 text-white' : 'bg-white/5 text-white/40 hover:text-white'
                          }`}
                        >
                          SAI
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] font-mono text-purple-300/80 bg-black/40 p-2 rounded border border-purple-500/20">
                  ⚡ Đáp án tổng hợp: {tfItems.map(i => `${i.key}: ${i.isCorrect ? 'Đ' : 'S'}`).join(' • ')} (Chấm theo barem: Đúng 1 ý=0.1đ, 2 ý=0.25đ, 3 ý=0.5đ, 4 ý=1.0đ)
                </div>
              </div>
            ) : (roundFormat === 'TT_SAP_XEP' || roundType === 'SEQUENCING') ? (
              /* CASE C: TĂNG TỐC - SẮP XẾP QUY TRÌNH (Tất cả là câu trả lời ngắn, tự động sắp xếp đưa ra đáp án) */
              <div className="space-y-3 p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-[4px]">
                <div className="flex items-center justify-between font-mono">
                  <div>
                    <span className="text-amber-300 font-bold text-xs">CÁC BƯỚC QUY TRÌNH (TĂNG TỐC - SẮP XẾP):</span>
                    <p className="text-[10px] text-white/50">Thí sinh nộp câu trả lời ngắn dạng thứ tự (VD: B-C-A-D)</p>
                  </div>
                  <div className="flex gap-1">
                    {[4, 5, 6].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setOptionCount(num);
                          const keys = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, num);
                          setCorrectKey(keys.join('-'));
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          optionCount === num ? 'bg-amber-500 text-slate-950' : 'bg-white/10 text-white/60'
                        }`}
                      >
                        {num} bước
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'A', val: optionA, setVal: setOptionA },
                    { key: 'B', val: optionB, setVal: setOptionB },
                    { key: 'C', val: optionC, setVal: setOptionC },
                    { key: 'D', val: optionD, setVal: setOptionD },
                    ...(optionCount >= 5 ? [{ key: 'E', val: optionE, setVal: setOptionE }] : []),
                    ...(optionCount >= 6 ? [{ key: 'F', val: optionF, setVal: setOptionF }] : [])
                  ].map(step => (
                    <div key={step.key}>
                      <label className="block text-white/60 text-[10px] font-mono mb-0.5">Bước {step.key}:</label>
                      <input
                        type="text"
                        value={step.val}
                        onChange={e => step.setVal(e.target.value)}
                        placeholder={`Nội dung bước ${step.key}...`}
                        className="w-full bg-black/60 border border-white/15 rounded-[4px] px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  ))}
                </div>

                <div className="p-2.5 bg-black/50 border border-amber-500/40 rounded-[4px] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-amber-300 font-mono font-bold text-xs">
                      Trình tự sắp xếp đúng (Các chữ cái nối bằng dấu -):
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const keys = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, optionCount);
                        setCorrectKey(keys.reverse().join('-'));
                      }}
                      className="text-[10px] font-mono text-sky-400 hover:text-sky-300 underline cursor-pointer"
                    >
                      ⚡ Đảo ngược mẫu
                    </button>
                  </div>
                  <input
                    type="text"
                    value={correctKey}
                    onChange={e => setCorrectKey(e.target.value.toUpperCase())}
                    placeholder="VD: B-C-A-D"
                    className="w-full bg-black/70 border border-amber-500/50 rounded-[4px] px-3 py-1.5 text-amber-300 font-mono font-bold uppercase text-sm"
                  />
                  
                  {/* Tự động sắp xếp đưa ra đáp án khi xuất */}
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] font-mono text-amber-200">
                    <span className="font-bold text-amber-300">✓ Tự động đưa ra đáp án khi xuất: </span>
                    {(() => {
                      const keys = correctKey.split(/[-,\s]+/).filter(Boolean);
                      const optsMap: Record<string, string> = { A: optionA, B: optionB, C: optionC, D: optionD, E: optionE, F: optionF };
                      if (keys.length === 0) return 'Chưa nhập thứ tự';
                      return keys.map((k, i) => `${i + 1}. ${k}${optsMap[k] ? ` (${optsMap[k]})` : ''}`).join(' ➔ ');
                    })()}
                  </div>
                </div>
              </div>
            ) : (roundFormat === 'TT_TRAC_NGHIEM_6' || roundType === 'ELIMINATION_6') ? (
              /* CASE D: TĂNG TỐC - TRẮC NGHIỆM 6 PHƯƠNG ÁN (Cho phép chọn phương án đúng, tự động xuất đáp án ngắn) */
              <div className="space-y-3 p-3.5 bg-blue-950/30 border border-blue-500/40 rounded-[4px]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-mono border-b border-blue-500/20 pb-2">
                  <span className="text-blue-300 font-bold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>6 PHƯƠNG ÁN LỰA CHỌN (TĂNG TỐC) — CHỌN 1 PHƯƠNG ÁN ĐÚNG:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-white/60 mr-1">Bấm chọn nhanh:</span>
                    {['A', 'B', 'C', 'D', 'E', 'F'].map(key => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCorrectKey(key)}
                        className={`w-6 h-6 rounded text-xs font-mono font-bold transition cursor-pointer ${
                          correctKey === key
                            ? 'bg-emerald-500 text-slate-950 shadow-sm ring-1 ring-emerald-300'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { key: 'A', val: optionA, setVal: setOptionA },
                    { key: 'B', val: optionB, setVal: setOptionB },
                    { key: 'C', val: optionC, setVal: setOptionC },
                    { key: 'D', val: optionD, setVal: setOptionD },
                    { key: 'E', val: optionE, setVal: setOptionE },
                    { key: 'F', val: optionF, setVal: setOptionF },
                  ].map(opt => {
                    const isSelected = correctKey === opt.key;
                    return (
                      <div 
                        key={opt.key} 
                        className={`p-2 rounded-[4px] border transition ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400/40'
                            : 'bg-black/50 border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-mono font-bold flex items-center gap-1.5">
                            <span className={`w-5 h-5 rounded flex items-center justify-center text-[11px] ${
                              isSelected ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-white/15 text-white/80'
                            }`}>
                              {opt.key}
                            </span>
                            <span className={isSelected ? 'text-emerald-300' : 'text-white/70'}>
                              Phương án {opt.key}
                            </span>
                          </label>

                          <button
                            type="button"
                            onClick={() => setCorrectKey(opt.key)}
                            className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold transition cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                            }`}
                          >
                            {isSelected ? '✓ ĐÁP ÁN ĐÚNG' : 'Chọn đúng'}
                          </button>
                        </div>
                        <input
                          type="text"
                          value={opt.val}
                          onChange={e => opt.setVal(e.target.value)}
                          placeholder={`Nhập nội dung phương án ${opt.key}...`}
                          className="w-full bg-black/60 border border-white/15 rounded-[4px] px-2.5 py-1.5 text-xs text-white focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-[4px] text-xs font-mono flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-300">✓ Đáp án chuẩn xuất ra (Câu trả lời ngắn):</span>
                    {correctKey ? (
                      <span className="text-emerald-300 font-bold">
                        {correctKey}: {({ A: optionA, B: optionB, C: optionC, D: optionD, E: optionE, F: optionF } as Record<string, string>)[correctKey] || '(chưa nhập nội dung phương án)'}
                      </span>
                    ) : (
                      <span className="text-amber-300">Chưa chọn phương án đúng</span>
                    )}
                  </div>
                  <span className="text-[10px] text-white/50">Tự động format chuẩn xuất file & hiển thị</span>
                </div>
              </div>
            ) : (roundType === 'SHORT_ANSWER' || roundType === 'FILL_IN_BLANK') ? (
              /* CASE E: CÂU TRẢ LỜI NGẮN (Áp dụng cho 6 dạng Khởi động, 5 dạng Tăng tốc & Về đích 4.1) */
              <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/30 rounded-[4px] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-cyan-300 font-mono font-bold text-xs">
                    Từ khóa / Câu trả lời ngắn chuẩn xác:
                  </label>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {countLetters(correctKey)} chữ cái
                  </span>
                </div>
                <input
                  type="text"
                  value={correctKey}
                  onChange={e => setCorrectKey(e.target.value)}
                  required
                  placeholder="VD: NGHỊ ĐỊNH 13, 1986, MẬT MÃ KHÓA CÔNG KHAI, CHỮ KÝ SỐ..."
                  className="w-full bg-black/60 border border-cyan-500/40 rounded-[4px] px-3 py-2 text-cyan-300 font-mono font-bold uppercase text-sm focus:border-cyan-400 focus:outline-none"
                />
                <div className="text-[11px] text-white/50 font-mono flex items-center justify-between">
                  <span>• Định dạng câu trả lời ngắn: Hệ thống tự động so khớp không phân biệt hoa thường.</span>
                  <span>{correctKey ? `Độ dài: ${correctKey.length} ký tự` : ''}</span>
                </div>
              </div>
            ) : (
              /* CASE F: MULTIPLE CHOICE ABCD (Áp dụng cho Khởi động ABCD, Về đích AID 4 phương án, Vòng loại P1) */
              <div className="space-y-3">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-white/60">Cấu hình 4 phương án lựa chọn:</span>
                  <span className="text-amber-300 font-bold">
                    {roundFormat === 'KD_TRAC_NGHIEM_ABCD' ? 'Khởi động trắc nghiệm ABCD' : roundFormat === 'VD_AID_4' ? 'Về Đích - Câu hỏi AID 4 phương án' : 'Trắc nghiệm chuẩn'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/50 font-mono mb-1 text-xs">Phương án A: <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      value={optionA}
                      onChange={e => setOptionA(e.target.value)}
                      required
                      placeholder="Nội dung phương án A..."
                      className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-2 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-white/50 font-mono mb-1 text-xs">Phương án B: <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      value={optionB}
                      onChange={e => setOptionB(e.target.value)}
                      required
                      placeholder="Nội dung phương án B..."
                      className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-2 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-white/50 font-mono mb-1 text-xs">Phương án C: <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      value={optionC}
                      onChange={e => setOptionC(e.target.value)}
                      required
                      placeholder="Nội dung phương án C..."
                      className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-2 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-white/50 font-mono mb-1 text-xs">Phương án D: <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      value={optionD}
                      onChange={e => setOptionD(e.target.value)}
                      required
                      placeholder="Nội dung phương án D..."
                      className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-2 text-white text-xs"
                    />
                  </div>
                </div>

                {/* Key selection */}
                <div className="pt-2">
                  <label className="block text-emerald-400 font-mono font-bold mb-1 text-xs">
                    Phương án đúng (Đáp án chuẩn):
                  </label>
                  <select
                    value={correctKey}
                    onChange={e => setCorrectKey(e.target.value)}
                    className="w-full bg-black/60 border border-emerald-500/40 rounded-[4px] px-3 py-2 text-emerald-300 font-mono font-bold text-sm"
                  >
                    <option value="A">Phương án A</option>
                    <option value="B">Phương án B</option>
                    <option value="C">Phương án C</option>
                    <option value="D">Phương án D</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: Giải Thích Chi Tiết & Bóc Tách Bẫy */}
          <div className="p-3.5 bg-white/5 rounded-[4px] border border-white/10 space-y-2">
            <label className="block text-white/60 font-semibold">
              Giải thích đáp án, bóc tách bẫy kỹ thuật & bài học thực tiễn:
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              placeholder="Giải thích vì sao đáp án này đúng, căn cứ vào điều luật nào và dấu hiệu nhận biết..."
              className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-2 text-white placeholder-white/40 focus:border-blue-400 focus:outline-none leading-relaxed"
            />
          </div>

          {/* SECTION 6: Phê Duyệt & Ghi Chú Thẩm Định (Moderation Status & Review Notes) */}
          <div className="p-3.5 bg-[#170933]/90 rounded-[4px] border border-amber-500/30 space-y-3 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-amber-300 font-mono font-bold text-xs flex items-center gap-1.5">
                  🛡️ TRẠNG THÁI PHÊ DUYỆT &amp; GHI CHÚ THẨM ĐỊNH (MODERATION &amp; REVIEW NOTES)
                </span>
              </div>
              {questionToEdit?.approved_by && (
                <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Người duyệt: {questionToEdit.approved_by}
                </span>
              )}
            </div>

            {/* Approval Status Selector */}
            <div>
              <label className="block text-white/70 font-mono text-xs mb-1.5">
                Trạng thái thẩm định (Approval Status):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    id: 'PENDING_REVIEW' as any,
                    label: 'Chờ Thẩm Định',
                    sub: 'Pending Review',
                    icon: '⏳',
                    activeCls: 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/50'
                  },
                  {
                    id: 'APPROVED' as any,
                    label: 'Đã Phê Duyệt',
                    sub: 'Approved',
                    icon: '✓',
                    activeCls: 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/50'
                  },
                  {
                    id: 'REJECTED' as any,
                    label: 'Từ Chối / Cần Sửa',
                    sub: 'Rejected / Fix',
                    icon: '✗',
                    activeCls: 'bg-rose-500/20 border-rose-400 text-rose-300 ring-1 ring-rose-400/50'
                  },
                  {
                    id: 'DRAFT' as any,
                    label: 'Bản Thảo',
                    sub: 'Draft Only',
                    icon: '✎',
                    activeCls: 'bg-slate-500/20 border-slate-400 text-slate-300 ring-1 ring-slate-400/50'
                  }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      setany(opt.id);
                    }}
                    className={`p-2 rounded-[4px] border text-left transition cursor-pointer ${
                      approvalStatus === opt.id
                        ? opt.activeCls
                        : 'bg-black/40 border-white/10 text-white/50 hover:text-white/80 hover:border-white/20'
                    }`}
                  >
                    <div className="font-mono font-bold text-xs flex items-center gap-1.5">
                      <span>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </div>
                    <div className="text-[10px] opacity-70 font-mono mt-0.5">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Review Notes Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-white/70 font-mono text-xs flex items-center gap-1">
                  <span>Ghi chú thẩm định / Review Notes:</span>
                  <span className="text-[10px] text-white/40">(Nhận xét từ Hội đồng Khảo thí &amp; Kiểm duyệt viên)</span>
                </label>
                {reviewNotes && (
                  <button
                    type="button"
                    onClick={() => setReviewNotes('')}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-mono cursor-pointer"
                  >
                    Xóa ghi chú
                  </button>
                )}
              </div>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                placeholder="Nhập nhận xét thẩm định, yêu cầu tác giả bổ sung điều luật, chỉnh sửa đáp án, hoặc lý do từ chối/phê duyệt..."
                className="w-full bg-black/60 border border-amber-500/30 rounded-[4px] px-3 py-2 text-amber-200 text-xs placeholder-amber-200/30 focus:border-amber-400 focus:outline-none leading-relaxed"
              />

              {/* Quick suggestion chips for review notes */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] font-mono text-white/40">Gợi ý nhanh:</span>
                {[
                  '✓ Đạt chuẩn khảo thí BTI 2026 & TT 02/2025',
                  '⚠️ Cần bổ sung trích dẫn điều khoản cụ thể',
                  '❌ Phương án nhiễu có thể gây tranh cãi',
                  '✏️ Cần chuẩn hóa chính tả và thuật ngữ số',
                  '🔢 Kiểm tra lại số lượng ký tự từ khóa'
                ].map(snippet => (
                  <button
                    key={snippet}
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      setReviewNotes(prev => (prev ? `${prev.trim()}\n${snippet}` : snippet));
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 hover:bg-amber-500/20 text-white/70 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 transition cursor-pointer"
                  >
                    {snippet}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {saveToast && (
            <div className="p-2.5 rounded-[4px] bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{saveToast}</span>
            </div>
          )}
        </form>

        {/* Fixed Footer Bar */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#13062c] border-t border-theme-accent/20 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-slate-400 text-[11px] font-mono flex items-center gap-2 flex-wrap">
            <span>Phím tắt:</span>
            <span className="text-theme-accent font-semibold flex items-center gap-1">
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded border border-white/10 text-[10px]">Ctrl+S</kbd> Lưu
            </span>
            <span className="text-sky-300 font-semibold flex items-center gap-1">
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded border border-white/10 text-[10px]">Ctrl+Shift+S</kbd> Lưu &amp; tiếp
            </span>
            <span className="text-slate-300 flex items-center gap-1">
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded border border-white/10 text-[10px]">Esc</kbd> Hủy
            </span>
          </span>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                onClose();
              }}
              className="fluent-btn-secondary px-3.5 py-2 text-xs cursor-pointer font-mono flex items-center gap-1.5"
              title="Đóng cửa sổ (Esc)"
            >
              <span>Hủy</span>
              <kbd className="text-[10px] font-mono opacity-60 bg-white/10 px-1 py-0.2 rounded border border-white/10">Esc</kbd>
            </button>

            <button
              type="button"
              onClick={() => executeSave(true)}
              className="px-3.5 py-2 text-xs rounded-[4px] bg-gradient-to-r from-sky-600/30 to-blue-600/30 hover:from-sky-600/40 hover:to-blue-600/40 border border-sky-500/40 text-sky-200 font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Lưu câu hỏi và làm mới biểu mẫu để nhập tiếp câu mới (Ctrl + Shift + S)"
            >
              <Plus className="w-3.5 h-3.5 text-sky-300" />
              <span>Lưu &amp; Thêm Tiếp</span>
              <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950/80 text-sky-300 border border-sky-500/40">
                Ctrl+Shift+S
              </kbd>
            </button>

            <button
              type="submit"
              form="question-editor-form"
              className="fluent-btn-primary px-4 sm:px-5 py-2 text-xs flex items-center gap-2 cursor-pointer font-mono font-bold"
              title="Lưu câu hỏi và đóng cửa sổ (Ctrl + S)"
            >
              <Save className="w-4 h-4" />
              <span>{questionToEdit ? 'Cập Nhật Câu Hỏi' : 'Lưu Ngân Hàng'}</span>
              <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/20 text-[#190839] border border-black/20 font-bold ml-0.5">
                Ctrl+S
              </kbd>
            </button>
          </div>
        </div>
      </div>

      {/* DRAFT PREVIEW MODAL DIALOG */}
      {showDraftPreviewModal && detectedDraft && (
        <div className="fixed inset-0 z-[10000000] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="max-w-2xl w-full max-h-[85vh] bg-[#200d3d] border border-amber-500/50 rounded-[8px] shadow-2xl flex flex-col overflow-hidden text-white">
            <div className="px-5 py-3.5 bg-[#2a134f] border-b border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                  <Eye className="w-4 h-4 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Chi Tiết Bản Nháp Tự Động</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                      LocalStorage
                    </span>
                  </h3>
                  <p className="text-[11px] text-amber-200/70 font-mono">
                    Lưu lúc: {detectedDraft.savedAt ? new Date(detectedDraft.savedAt).toLocaleString('vi-VN') : 'Không rõ'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDraftPreviewModal(false)}
                className="w-7 h-7 rounded hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs custom-scrollbar">
              {/* Meta tags */}
              <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-slate-300">
                  Giai đoạn: <strong>{detectedDraft.stage}</strong>
                </span>
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-purple-300">
                  Định dạng: <strong>{detectedDraft.roundFormat}</strong>
                </span>
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-amber-300">
                  Nhóm: <strong>{detectedDraft.roundGroup}</strong>
                </span>
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-sky-300">
                  Mức độ: <strong>{detectedDraft.cognitiveLevel}</strong>
                </span>
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-emerald-300">
                  Thời gian: <strong>{detectedDraft.timeLimit}s</strong> • Điểm: <strong>{detectedDraft.points}đ</strong>
                </span>
              </div>

              {/* Question Text */}
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nội dung câu hỏi:</div>
                <div className="p-3 rounded bg-black/40 border border-white/10 text-white font-medium whitespace-pre-wrap leading-relaxed">
                  {detectedDraft.questionText || <span className="italic text-slate-500">(Chưa có nội dung câu hỏi)</span>}
                </div>
              </div>

              {/* Multiple Choice Options */}
              {detectedDraft.roundType === 'MULTIPLE_CHOICE' && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Các phương án &amp; Đáp án đúng:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {['A', 'B', 'C', 'D', 'E', 'F'].slice(0, detectedDraft.optionCount || 4).map((key) => {
                      const optVal = (detectedDraft as any)[`option${key}`];
                      const isCorrect = detectedDraft.correctKey === key;
                      return (
                        <div
                          key={key}
                          className={`p-2.5 rounded border text-xs flex items-start gap-2 ${
                            isCorrect
                              ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-semibold'
                              : 'bg-black/30 border-white/10 text-slate-300'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-slate-300'
                          }`}>
                            {key}
                          </span>
                          <span className="break-words min-w-0 flex-1">{optVal || <span className="italic opacity-40">(trống)</span>}</span>
                          {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* True/False Part II */}
              {detectedDraft.roundType === 'TRUE_FALSE' && detectedDraft.tfItems && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Đúng / Sai 4 ý (Phần II Bộ GD&ĐT):</div>
                  <div className="space-y-1.5">
                    {detectedDraft.tfItems.map((item, idx) => (
                      <div key={idx} className="p-2 rounded bg-black/30 border border-white/10 flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-slate-400 uppercase">{item.key})</span>
                        <span className="flex-1 text-slate-200">{item.text || <span className="italic opacity-40">(trống)</span>}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.isCorrect ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {item.isCorrect ? 'ĐÚNG' : 'SAI'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation & Legal Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {detectedDraft.explanation && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Giải thích chi tiết:</div>
                    <div className="p-2.5 rounded bg-black/30 border border-white/10 text-slate-300 text-[11px] leading-relaxed">
                      {detectedDraft.explanation}
                    </div>
                  </div>
                )}
                {detectedDraft.legalReference && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Căn cứ pháp lý:</div>
                    <div className="p-2.5 rounded bg-black/30 border border-white/10 text-amber-200/90 text-[11px] font-mono">
                      {detectedDraft.legalReference}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3 bg-[#17072f] border-t border-white/10 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-3 py-1.5 rounded bg-red-950/50 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Xóa Bản Nháp</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDraftPreviewModal(false)}
                  className="px-3.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-slate-300 text-xs transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => handleRestoreDraft(detectedDraft)}
                  className="px-4 py-1.5 rounded bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-950 font-bold" />
                  <span>✨ Khôi Phục Bản Nháp Này Ngay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
