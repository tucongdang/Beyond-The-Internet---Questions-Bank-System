import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Info, 
  BookOpen, 
  Scale, 
  RefreshCw,
  Eye,
  Key,
  Send,
  Edit3,
  HelpCircle,
  Sparkles,
  Layers,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { QuestionItem } from '../../types';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { soundFx } from '../../services/audioEffects';
import { 
  vibrateTap, 
  vibrateSelection, 
  vibrateSubmit, 
  vibrateCorrect, 
  vibrateWrong, 
  vibrateCountdownCritical 
} from '../../utils/hapticUtils';
import { confetti } from '../../utils/confetti';
import { DIGITAL_COMPETENCY_DOMAINS, COGNITIVE_LEVELS } from '../../data/digitalCompetencyData';
import { DifficultyBadgeAndMeter } from './DifficultyBadgeAndMeter';
import { QuestionHistoryPdfReportModal } from './QuestionHistoryPdfReportModal';
import { QuestionVariantsModal } from './QuestionVariantsModal';
import { PsychometricItemAnalysisModal } from './PsychometricItemAnalysisModal';
import { AiVoiceReaderModal } from './AiVoiceReaderModal';
import { MultiTierApprovalWorkflowModal } from './MultiTierApprovalWorkflowModal';
import { Shuffle, Activity, Radio, Stamp } from 'lucide-react';

interface QuestionQuickPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: QuestionItem | null;
  onEdit?: (question: QuestionItem) => void;
  onQuickReview?: (question: QuestionItem) => void;
}

export const QuestionQuickPreviewModal: React.FC<QuestionQuickPreviewModalProps> = ({
  isOpen,
  onClose,
  question,
  onEdit,
  onQuickReview
}) => {
  useLockBodyScroll(isOpen);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showPdfReportModal, setShowPdfReportModal] = useState<boolean>(false);
  const [showVariantsModal, setShowVariantsModal] = useState<boolean>(false);
  const [showPsychometricsModal, setShowPsychometricsModal] = useState<boolean>(false);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  
  // Inspector panel toggle (default to open on desktop)
  const [showInspector, setShowInspector] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // Timer simulation state
  const defaultTimeLimit = question?.time_limit || 15;
  const [customTimeLimit, setCustomTimeLimit] = useState<number>(defaultTimeLimit);
  const [timeLeft, setTimeLeft] = useState<number>(defaultTimeLimit);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);

  // Interaction & verification testing state
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [shortAnswerInput, setShortAnswerInput] = useState<string>('');
  const [tfSelections, setTfSelections] = useState<Record<string, 'DUNG' | 'SAI'>>({});
  const [sequenceSelections, setSequenceSelections] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submissionTimestamp, setSubmissionTimestamp] = useState<number | null>(null);

  // Answer reveal state
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // Sync state when question changes
  useEffect(() => {
    if (!question) return;
    const limit = question.time_limit || 15;
    setCustomTimeLimit(limit);
    setTimeLeft(limit);
    setIsRunning(false);
    setIsTimeUp(false);
    setSelectedOption('');
    setShortAnswerInput('');
    setTfSelections({});
    setSequenceSelections([]);
    setIsSubmitted(false);
    setSubmissionTimestamp(null);
    setIsRevealed(false);
  }, [question, isOpen]);

  // Handle countdown interval
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsRunning(false);
          setIsTimeUp(true);
          if (soundEnabled) soundFx.playLock();
          vibrateCountdownCritical();
          return 0;
        }

        const next = prev - 1;
        if (soundEnabled) soundFx.playTick(next <= 3);
        if (next <= 3) vibrateCountdownCritical();
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, soundEnabled]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleToggleTimer();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleResetTimer();
      } else if (['1', '2', '3', '4'].includes(e.key) && (question?.round_type === 'MULTIPLE_CHOICE' || !question?.round_type)) {
        const map: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
        handleSelectOption(map[e.key]);
      } else if (['a', 'b', 'c', 'd'].includes(e.key.toLowerCase()) && (question?.round_type === 'MULTIPLE_CHOICE' || !question?.round_type)) {
        handleSelectOption(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRunning, isTimeUp, isSubmitted, isRevealed, question]);

  // Ergonomics reading evaluation
  const totalWords = useMemo(() => {
    if (!question) return 0;
    const qText = question.question_text || '';
    const optText = Object.values(question.options || {}).join(' ');
    const all = `${qText} ${optText}`.trim();
    return all.split(/\s+/).filter(Boolean).length;
  }, [question]);

  const estimatedReadTimeSec = Math.max(2, Math.round(totalWords / 3.3));
  const isTimeTight = customTimeLimit < estimatedReadTimeSec;

  const pointsAtStake = question?.points || (
    question?.round_format === 'VE_DICH_30' ? 30 :
    question?.round_format === 'VE_DICH_20' ? 20 :
    question?.round_format === 'TANG_TOC' ? 40 : 10
  );

  const handleToggleTimer = () => {
    vibrateTap();
    if (soundEnabled) soundFx.playClick();
    if (isTimeUp) {
      handleResetTimer();
      setIsRunning(true);
    } else {
      setIsRunning(prev => !prev);
    }
  };

  const handleResetTimer = (newLimit?: number) => {
    vibrateTap();
    if (soundEnabled) soundFx.playClick();
    const limit = newLimit !== undefined ? newLimit : customTimeLimit;
    if (newLimit !== undefined) {
      setCustomTimeLimit(limit);
    }
    setTimeLeft(limit);
    setIsRunning(false);
    setIsTimeUp(false);
    setIsSubmitted(false);
    setSubmissionTimestamp(null);
    setIsRevealed(false);
    setSelectedOption('');
    setShortAnswerInput('');
    setTfSelections({});
    setSequenceSelections([]);
  };

  const handleSelectOption = (key: string) => {
    if (isSubmitted || isTimeUp || isRevealed) return;
    vibrateSelection();
    if (soundEnabled) soundFx.playClick();
    setSelectedOption(key);
  };

  const handleSubmitAnswer = () => {
    if (isSubmitted || isTimeUp) return;
    vibrateSubmit();
    if (soundEnabled) soundFx.playClick();
    setIsSubmitted(true);
    setSubmissionTimestamp(customTimeLimit - timeLeft);
  };

  const handleRevealAnswer = () => {
    vibrateTap();
    setIsRevealed(true);

    let isCorrect = false;
    if (question?.round_type === 'MULTIPLE_CHOICE' || !question?.round_type) {
      const correctKey = (question?.correct_key || '').trim().toUpperCase();
      isCorrect = selectedOption.trim().toUpperCase() === correctKey;
    } else if (question?.round_type === 'SHORT_ANSWER' || question?.round_type === 'FILL_IN_BLANK') {
      const correctKey = (question?.correct_key || '').trim().toLowerCase();
      const contestantInput = shortAnswerInput.trim().toLowerCase();
      isCorrect = contestantInput.length > 0 && (contestantInput === correctKey || correctKey.includes(contestantInput));
    } else if (question?.round_type === 'TRUE_FALSE_4') {
      const correctKey = question?.correct_key || '';
      let correctMatches = 0;
      ['a', 'b', 'c', 'd'].forEach(letter => {
        const regex = new RegExp(`${letter}\\s*:\\s*([ĐSđsTFtf])`, 'i');
        const m = correctKey.match(regex);
        if (m) {
          const expected = (m[1].toUpperCase() === 'Đ' || m[1].toUpperCase() === 'T') ? 'DUNG' : 'SAI';
          if (tfSelections[letter] === expected) correctMatches++;
        }
      });
      isCorrect = correctMatches === 4;
    }

    if (isCorrect) {
      if (soundEnabled) soundFx.playReveal(true);
      vibrateCorrect();
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
    } else {
      if (soundEnabled) soundFx.playReveal(false);
      vibrateWrong();
    }
  };

  const handleToggleTf = (itemKey: string, val: 'DUNG' | 'SAI') => {
    if (isSubmitted || isTimeUp || isRevealed) return;
    vibrateSelection();
    if (soundEnabled) soundFx.playClick();
    setTfSelections(prev => ({
      ...prev,
      [itemKey]: prev[itemKey] === val ? (undefined as any) : val
    }));
  };

  const handleToggleSequenceItem = (key: string) => {
    if (isSubmitted || isTimeUp || isRevealed) return;
    vibrateSelection();
    if (soundEnabled) soundFx.playClick();
    setSequenceSelections(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
  };

  const tfCalculatedScore = useMemo(() => {
    if (!question || question.round_type !== 'TRUE_FALSE_4') return null;
    const correctKey = question.correct_key || '';
    let matches = 0;
    ['a', 'b', 'c', 'd'].forEach(letter => {
      const regex = new RegExp(`${letter}\\s*:\\s*([ĐSđsTFtf])`, 'i');
      const m = correctKey.match(regex);
      if (m) {
        const expected = (m[1].toUpperCase() === 'Đ' || m[1].toUpperCase() === 'T') ? 'DUNG' : 'SAI';
        if (tfSelections[letter] === expected) matches++;
      }
    });

    let points = 0;
    if (matches === 1) points = 0.1;
    else if (matches === 2) points = 0.25;
    else if (matches === 3) points = 0.5;
    else if (matches === 4) points = 1.0;

    return { matches, points };
  }, [question, tfSelections]);

  const correctOptionLetter = (question?.correct_key || '').trim().toUpperCase();
  const isVcnv = Boolean(question && (question.round_type === 'VCNV' || ('clue1' in (question.options || {}))));

  if (!isOpen || !question) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Modal Card */}
      <div 
        className="relative z-10 w-full max-w-5xl max-h-[92vh] flex flex-col rounded-xl bg-[#14062E] border border-theme-accent/35 shadow-2xl shadow-purple-950/70 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* TOP HEADER */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#190839] border-b border-theme-accent/25 select-none shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-mono font-bold text-sm text-white flex items-center gap-1.5 shrink-0">
              <Eye className="w-4 h-4 text-theme-accent" />
              <span>Xem trước &amp; Thử nghiệm câu hỏi</span>
            </span>

            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-theme-accent/20 text-theme-accent border border-theme-accent/30 shrink-0">
              {question.id}
            </span>

            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-mono text-amber-300 bg-amber-950/40 border border-amber-500/30 shrink-0">
              +{pointsAtStake} điểm
            </span>

            <DifficultyBadgeAndMeter
              level={question.cognitive_level}
              showMeter={true}
              showTierRange={true}
              size="sm"
            />

            <span className="hidden md:inline-block text-xs text-purple-200 font-mono truncate max-w-[200px]">
              {question.round_name || 'Vòng thi BTI'}
            </span>

            <span className={`hidden lg:inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
              question.approval_status === 'APPROVED' 
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}>
              {question.approval_status === 'APPROVED' ? '✓ Đã duyệt' : '• Chờ duyệt'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) soundFx.playClick();
                vibrateTap();
              }}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                soundEnabled 
                  ? 'bg-purple-950/40 border-purple-500/40 text-purple-300' 
                  : 'bg-white/5 border-white/10 text-slate-500'
              }`}
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Inspector Toggle */}
            <button
              type="button"
              onClick={() => {
                setShowInspector(prev => !prev);
                vibrateTap();
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition cursor-pointer ${
                showInspector 
                  ? 'bg-amber-950/50 border-amber-500/50 text-amber-300' 
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
              title="Bật/tắt thanh hồ sơ thẩm định & căn cứ pháp lý"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Hồ sơ thẩm định</span>
            </button>

            {/* AI MC Voice Reader */}
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setShowVoiceModal(true);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-mono text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95 font-bold"
              title="Phát giọng đọc MC đề thi AI"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Đọc Đề AI</span>
            </button>

            {/* AI Variants Generator */}
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setShowVariantsModal(true);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-mono text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95 font-bold"
              title="Sinh biến thể mã đề & phân tích phương án nhiễu"
            >
              <Shuffle className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Biến Thể</span>
            </button>

            {/* Psychometrics & IRT Analysis */}
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setShowPsychometricsModal(true);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95 font-bold"
              title="Phân tích chỉ số P-value, D-index & IRT"
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Khảo Thí IRT</span>
            </button>

            {/* Multi-Tier Approval Workflow */}
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setShowApprovalModal(true);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95 font-bold"
              title="Quy trình phản biện & Ký số Hội đồng"
            >
              <Stamp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Ký Số</span>
            </button>

            {/* Export PDF History Report Button */}
            <button
              type="button"
              id="btn-quick-preview-export-pdf"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setShowPdfReportModal(true);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 border border-red-500/40 font-mono text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              title="Xuất báo cáo lịch sử và phiếu thẩm định câu hỏi dạng PDF"
            >
              <FileText className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline font-bold">Xuất PDF Lịch Sử</span>
              <span className="sm:hidden font-bold">PDF</span>
            </button>

            {/* Quick Review */}
            {onQuickReview && (
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onQuickReview(question);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 font-mono text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95 font-bold"
                title="Review nhanh trạng thái & ghi chú (Lưu Firestore)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Review nhanh</span>
              </button>
            )}

            {/* Edit Question */}
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(question);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-theme-accent/15 hover:bg-theme-accent/25 text-theme-accent border border-theme-accent/30 font-mono text-xs flex items-center gap-1 cursor-pointer"
                title="Chỉnh sửa chi tiết câu hỏi này"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chỉnh sửa</span>
              </button>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 transition cursor-pointer"
              title="Đóng cửa sổ (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TIMER & SIMULATION CONTROL BAR */}
        <div className="px-4 py-2.5 bg-[#190839]/90 border-b border-theme-accent/20 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Timer Play / Reset / Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleToggleTimer}
              className={`px-3 py-1.5 rounded-md font-mono font-bold flex items-center gap-1.5 transition cursor-pointer text-xs shadow-sm ${
                isRunning
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : isTimeUp
                  ? 'bg-rose-600 text-white hover:bg-rose-500 animate-pulse'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Dừng đồng hồ (Space)</span>
                </>
              ) : isTimeUp ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Hết giờ (Chạy lại)</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Bắt đầu đếm ({timeLeft}s)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleResetTimer()}
              className="px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-mono text-xs flex items-center gap-1 transition cursor-pointer"
              title="Đặt lại đồng hồ về đầu (R)"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset (R)</span>
            </button>

            {/* Quick Timer Presets */}
            <div className="flex items-center gap-1 pl-2 border-l border-white/10 font-mono text-xs">
              <span className="text-slate-500 mr-1 hidden sm:inline">Thử thời gian:</span>
              {[5, 10, 15, 20, 30].map(sec => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => handleResetTimer(sec)}
                  className={`px-2 py-0.5 rounded transition cursor-pointer ${
                    customTimeLimit === sec 
                      ? 'bg-theme-accent text-[#190839] font-bold' 
                      : 'bg-white/5 hover:bg-white/10 text-slate-400'
                  }`}
                >
                  {sec}s
                </button>
              ))}
              {question.time_limit && ![5, 10, 15, 20, 30].includes(question.time_limit) && (
                <button
                  type="button"
                  onClick={() => handleResetTimer(question.time_limit)}
                  className={`px-2 py-0.5 rounded transition cursor-pointer ${
                    customTimeLimit === question.time_limit 
                      ? 'bg-theme-accent text-[#190839] font-bold' 
                      : 'bg-white/5 hover:bg-white/10 text-slate-400'
                  }`}
                >
                  Gốc ({question.time_limit}s)
                </button>
              )}
            </div>
          </div>

          {/* Reveal / Answer Verification Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRevealAnswer}
              disabled={isRevealed}
              className={`px-3 py-1.5 rounded-md font-mono font-bold flex items-center gap-1.5 transition text-xs ${
                isRevealed 
                  ? 'bg-white/10 text-slate-400 border border-white/5 cursor-default' 
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white cursor-pointer shadow-md'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isRevealed ? 'Đã công bố đáp án' : 'Chốt & Xem đáp án chuẩn'}</span>
            </button>

            {isRevealed && (
              <button
                type="button"
                onClick={() => {
                  handleResetTimer();
                  soundFx.playClick();
                }}
                className="px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-500/30 font-mono flex items-center gap-1 text-xs cursor-pointer"
                title="Làm lại từ đầu"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Thử làm lại</span>
              </button>
            )}
          </div>
        </div>

        {/* MAIN BODY AREA: QUESTION PREVIEW + INSPECTOR */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-theme-accent/20">
          
          {/* QUESTION PREVIEW CONTENT */}
          <div className="flex-1 p-4 sm:p-6 bg-[#0d0420]/40 space-y-4 overflow-y-auto">
            {/* Realtime Timer Progress Header */}
            <div className="p-3.5 rounded-xl bg-[#190839] border border-theme-accent/30 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-theme-accent/20 text-theme-accent font-mono font-bold text-xs border border-theme-accent/30 uppercase">
                    {question.round_name || 'Vòng thi BTI'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Mã đề: <strong className="text-white">[{question.id}]</strong>
                  </span>
                </div>

                <div className={`px-3 py-1 rounded-lg font-mono text-sm font-black border flex items-center gap-1.5 transition-all ${
                  timeLeft <= 3 
                    ? 'bg-rose-600 text-white border-rose-400 animate-bounce' 
                    : timeLeft <= 5
                    ? 'bg-amber-500 text-slate-950 border-amber-300 animate-pulse'
                    : 'bg-[#241148] text-theme-accent border-theme-accent/40'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span>{timeLeft}s / {customTimeLimit}s</span>
                </div>
              </div>

              {/* Countdown Progress Bar */}
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    timeLeft <= 3 ? 'bg-rose-500' : timeLeft <= 5 ? 'bg-amber-400' : 'bg-theme-accent'
                  }`}
                  style={{ width: `${(timeLeft / customTimeLimit) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Text Box */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#190839] border border-white/10 space-y-3 shadow-md">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-white/10 pb-2">
                <span className="text-theme-accent font-bold">NỘI DUNG CÂU HỎI</span>
                <span className="text-amber-300 font-bold">+{pointsAtStake} ĐIỂM</span>
              </div>

              <p className="text-base sm:text-lg font-semibold text-white leading-relaxed">
                {question.question_text}
              </p>

              {/* Media if exists */}
              {question.media_type === 'IMAGE' && question.media_url && (
                <div className="mt-3 rounded-lg overflow-hidden border border-white/15 max-w-xl mx-auto">
                  <img 
                    src={question.media_url} 
                    alt="Question media" 
                    crossOrigin="anonymous"
                    className="w-full max-h-80 object-contain bg-black/50" 
                  />
                </div>
              )}
            </div>

            {/* INTERACTIVE QUESTION OPTIONS / ANSWERS SECTION */}
            <div className="space-y-3">
              {/* FORMAT 1: MULTIPLE CHOICE */}
              {(question.round_type === 'MULTIPLE_CHOICE' || !question.round_type) && (
                <div className="space-y-2">
                  <span className="text-xs font-mono text-slate-400 block">
                    Các phương án trả lời (Nhấp chuột hoặc bấm phím tắt 1-4 / A-D để chọn):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {Object.entries(question.options || {}).map(([key, label]) => {
                      const isSelected = selectedOption === key;
                      const isCorrect = isRevealed && key.toUpperCase() === correctOptionLetter;
                      const isWrongSelection = isRevealed && isSelected && !isCorrect;

                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={isSubmitted || isTimeUp || isRevealed}
                          onClick={() => handleSelectOption(key)}
                          className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
                            isCorrect
                              ? 'bg-emerald-950/90 border-emerald-500 text-white shadow-md ring-2 ring-emerald-400'
                              : isWrongSelection
                              ? 'bg-rose-950/90 border-rose-500 text-rose-200 ring-1 ring-rose-400'
                              : isSelected
                              ? 'bg-theme-accent/25 border-theme-accent text-white ring-1 ring-theme-accent'
                              : 'bg-[#1e0a3c] hover:bg-[#280e50] border-white/10 text-slate-200'
                          } ${isSubmitted || isTimeUp ? 'cursor-not-allowed opacity-90' : ''}`}
                        >
                          <span className={`w-8 h-8 rounded-lg font-mono font-bold text-sm flex items-center justify-center shrink-0 border transition ${
                            isCorrect
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : isWrongSelection
                              ? 'bg-rose-600 text-white border-rose-400'
                              : isSelected
                              ? 'bg-theme-accent text-[#190839] border-theme-accent'
                              : 'bg-[#2b1055] text-purple-200 border-white/10'
                          }`}>
                            {key}
                          </span>
                          <div className="flex-1 pt-1 min-w-0">
                            <span className="text-sm leading-snug font-medium block">
                              {label}
                            </span>
                          </div>
                          {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                          {isWrongSelection && <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FORMAT 2: TRUE / FALSE 4-PART (BỘ GD&ĐT a, b, c, d) */}
              {question.round_type === 'TRUE_FALSE_4' && (
                <div className="space-y-2.5">
                  <span className="text-xs font-mono text-slate-400 block">
                    Đánh giá tính Đúng / Sai của từng mệnh đề (Quy chế khảo thí BGDĐT):
                  </span>
                  <div className="space-y-2">
                    {['a', 'b', 'c', 'd'].map(letter => {
                      const label = question.options?.[letter] || `Ý ${letter}`;
                      const currentChoice = tfSelections[letter];

                      let expected: 'DUNG' | 'SAI' | null = null;
                      if (isRevealed && question.correct_key) {
                        const match = question.correct_key.match(new RegExp(`${letter}\\s*:\\s*([ĐSđsTFtf])`, 'i'));
                        if (match) {
                          expected = (match[1].toUpperCase() === 'Đ' || match[1].toUpperCase() === 'T') ? 'DUNG' : 'SAI';
                        }
                      }

                      return (
                        <div 
                          key={letter}
                          className="p-3 rounded-xl bg-[#1e0a3c] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-start gap-2.5 flex-1">
                            <span className="w-6 h-6 rounded-md bg-purple-900/60 font-mono font-bold text-xs text-theme-accent flex items-center justify-center shrink-0">
                              {letter}
                            </span>
                            <p className="text-slate-100 text-sm leading-relaxed">{label}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              disabled={isSubmitted || isTimeUp || isRevealed}
                              onClick={() => handleToggleTf(letter, 'DUNG')}
                              className={`py-1.5 px-3 rounded-lg font-mono font-bold text-xs border transition cursor-pointer ${
                                currentChoice === 'DUNG'
                                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                                  : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
                              }`}
                            >
                              ĐÚNG
                            </button>
                            <button
                              type="button"
                              disabled={isSubmitted || isTimeUp || isRevealed}
                              onClick={() => handleToggleTf(letter, 'SAI')}
                              className={`py-1.5 px-3 rounded-lg font-mono font-bold text-xs border transition cursor-pointer ${
                                currentChoice === 'SAI'
                                  ? 'bg-rose-600 text-white border-rose-400 shadow-sm'
                                  : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
                              }`}
                            >
                              SAI
                            </button>

                            {isRevealed && expected && (
                              <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                                expected === 'DUNG' ? 'text-emerald-400 bg-emerald-950/60' : 'text-rose-400 bg-rose-950/60'
                              }`}>
                                Chuẩn: {expected} {currentChoice === expected ? '✓' : '✗'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FORMAT 3: SHORT ANSWER */}
              {(question.round_type === 'SHORT_ANSWER' || question.round_type === 'FILL_IN_BLANK') && (
                <div className="p-4 rounded-xl bg-[#1e0a3c] border border-white/10 space-y-2.5">
                  <label className="text-xs font-mono text-slate-300 block">
                    Nhập câu trả lời ngắn để thử nghiệm đối chiếu đáp án:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      disabled={isSubmitted || isTimeUp || isRevealed}
                      value={shortAnswerInput}
                      onChange={(e) => setShortAnswerInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSubmitAnswer();
                      }}
                      placeholder="Gõ từ khóa câu trả lời..."
                      className="flex-1 px-3 py-2 rounded-lg bg-[#0d0420] border border-white/20 text-white font-mono text-sm focus:outline-none focus:border-theme-accent"
                    />
                    <button
                      type="button"
                      disabled={isSubmitted || isTimeUp || isRevealed || !shortAnswerInput.trim()}
                      onClick={handleSubmitAnswer}
                      className="px-4 py-2 rounded-lg bg-theme-accent text-[#190839] font-mono font-bold text-xs hover:bg-theme-accent/90 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Xác nhận</span>
                    </button>
                  </div>

                  {!isRevealed && (
                    <div className="flex items-center gap-2 pt-1 text-xs font-mono">
                      <span className="text-slate-500">Thử nhanh:</span>
                      <button
                        type="button"
                        onClick={() => setShortAnswerInput(question.correct_key || '')}
                        className="text-emerald-400 underline hover:text-emerald-300 cursor-pointer"
                      >
                        [Điền đáp án đúng]
                      </button>
                      <button
                        type="button"
                        onClick={() => setShortAnswerInput('Thử sai')}
                        className="text-rose-400 underline hover:text-rose-300 cursor-pointer"
                      >
                        [Điền đáp án sai]
                      </button>
                    </div>
                  )}

                  {isRevealed && (
                    <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs font-mono">
                      <span className="text-slate-400 block text-[10px]">ĐÁP ÁN CHÍNH XÁC:</span>
                      <span className="font-bold text-emerald-300 text-sm">
                        {question.correct_key || '(Chưa có đáp án)'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* FORMAT 4: SEQUENCING */}
              {question.round_type === 'SEQUENCING' && (
                <div className="space-y-2 p-4 rounded-xl bg-[#1e0a3c] border border-white/10">
                  <span className="text-xs font-mono text-slate-300 block">
                    Chạm vào các mục theo thứ tự sắp xếp:
                  </span>
                  <div className="space-y-1.5">
                    {Object.entries(question.options || {}).map(([key, label]) => {
                      const orderIndex = sequenceSelections.indexOf(key);
                      const isChosen = orderIndex !== -1;

                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={isSubmitted || isTimeUp || isRevealed}
                          onClick={() => handleToggleSequenceItem(key)}
                          className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition cursor-pointer ${
                            isChosen 
                              ? 'bg-purple-900/60 border-purple-400 text-white' 
                              : 'bg-[#14062E] hover:bg-[#200a42] border-white/10 text-slate-300'
                          }`}
                        >
                          <span className="font-medium text-xs">[{key}] {label}</span>
                          {isChosen && (
                            <span className="w-5 h-5 rounded-full bg-theme-accent text-[#190839] font-bold text-[10px] flex items-center justify-center font-mono">
                              {orderIndex + 1}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {sequenceSelections.length > 0 && (
                    <div className="text-xs font-mono text-theme-accent pt-1">
                      Thứ tự đã chọn: {sequenceSelections.join(' ➔ ')}
                    </div>
                  )}
                </div>
              )}

              {/* FORMAT 5: VCNV (VƯỢT CHƯỚNG NGẠI VẬT) */}
              {isVcnv && (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4" />
                      CẤU TRÚC VƯỢT CHƯỚNG NGẠI VẬT (BTI 2026)
                    </span>
                    <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                      Từ khóa CNV
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#190839] border border-white/10 space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                      <span className="text-slate-400">Từ khóa Chướng Ngại Vật:</span>
                      <span className="font-bold text-amber-300 text-sm">
                        🔑 {question.correct_key || 'DEEPFAKE'}
                      </span>
                    </div>

                    {question.options?.clue1 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-slate-400 block text-[11px]">Các gợi ý hàng ngang:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          {[1, 2, 3, 4].map(idx => {
                            const clue = question.options?.[`clue${idx}`];
                            const ans = question.options?.[`ans${idx}`];
                            if (!clue && !ans) return null;
                            return (
                              <div key={idx} className="p-2 rounded bg-black/30 border border-white/5">
                                <span className="text-purple-300 font-bold block">Hàng {idx}: {clue}</span>
                                <span className="text-emerald-300 font-bold">Đáp án: {ans}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Test Button */}
              {(question.round_type === 'MULTIPLE_CHOICE' || !question.round_type || question.round_type === 'TRUE_FALSE_4') && (
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isSubmitted || isTimeUp || isRevealed || (!selectedOption && Object.keys(tfSelections).length === 0)}
                    onClick={handleSubmitAnswer}
                    className={`w-full py-2.5 rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                      isSubmitted
                        ? 'bg-emerald-600 text-white border border-emerald-400'
                        : 'bg-theme-accent hover:bg-theme-accent/90 text-[#190839] disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {isSubmitted 
                        ? `Đã gửi đáp án thử (${submissionTimestamp !== null ? `${submissionTimestamp}s` : ''})` 
                        : 'XÁC NHẬN CÂU TRẢ LỜI ĐỂ KIỂM TRA'}
                    </span>
                  </button>
                </div>
              )}

              {/* Revealed Result Banner */}
              {isRevealed && (
                <div className="p-3.5 rounded-xl bg-purple-950/80 border border-purple-400/50 space-y-1.5 animate-fadeIn">
                  <span className="text-[11px] font-mono text-purple-300 uppercase font-bold block">
                    KẾT QUẢ ĐỐI CHIẾU ĐÁP ÁN
                  </span>
                  <div className="text-sm font-bold text-white">
                    {question.round_type === 'MULTIPLE_CHOICE' || !question.round_type ? (
                      selectedOption.toUpperCase() === correctOptionLetter ? (
                        <span className="text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Trả lời chính xác! (+{pointsAtStake} điểm) • Khớp đáp án chuẩn [{correctOptionLetter}]
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1.5">
                          <XCircle className="w-4 h-4" /> Phương án chưa đúng • Đáp án chuẩn: [{correctOptionLetter}]
                        </span>
                      )
                    ) : question.round_type === 'TRUE_FALSE_4' ? (
                      <span className="text-amber-300">
                        Khớp {tfCalculatedScore?.matches}/4 ý • Đạt: {tfCalculatedScore?.points} điểm (Quy chế khảo thí BGDĐT)
                      </span>
                    ) : (
                      <span className="text-emerald-300">
                        Đáp án chuẩn: {question.correct_key}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT INSPECTOR PANEL: PEDAGOGICAL AUDIT & REGULATORY METADATA */}
          {showInspector && (
            <div className="w-full lg:w-96 p-4 sm:p-5 bg-[#170733] overflow-y-auto space-y-4 shrink-0 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-theme-accent/20">
                <span className="font-mono font-bold text-xs text-theme-accent flex items-center gap-1.5">
                  <Scale className="w-4 h-4" />
                  Hồ sơ Thẩm định &amp; Pháp lý
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                  BTI 2026 Audit
                </span>
              </div>

              {/* Ergonomics Check */}
              <div className="p-3 rounded-xl bg-[#241148] border border-theme-accent/30 space-y-2">
                <span className="font-mono font-bold text-[11px] text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Độ dài &amp; Thời lượng khảo thí
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-black/30 border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Tổng số từ đề &amp; đáp án:</span>
                    <strong className="text-white text-xs">{totalWords} từ</strong>
                  </div>
                  <div className="p-2 rounded bg-black/30 border border-white/5">
                    <span className="text-slate-400 block text-[10px]">Ước tính thời gian đọc:</span>
                    <strong className="text-amber-300 text-xs">~{estimatedReadTimeSec}s</strong>
                  </div>
                </div>

                <div className={`p-2 rounded font-mono text-[10.5px] flex items-center gap-1.5 ${
                  isTimeTight 
                    ? 'bg-rose-950/40 border border-rose-500/40 text-rose-300' 
                    : 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                }`}>
                  {isTimeTight ? (
                    <span>⚠️ Câu hỏi khá dài, thời gian {customTimeLimit}s có thể hơi gấp.</span>
                  ) : (
                    <span>✓ Thời lượng {customTimeLimit}s phù hợp để thí sinh đọc &amp; trả lời.</span>
                  )}
                </div>
              </div>

              {/* Official Answer */}
              <div className="p-3 rounded-xl bg-[#241148] border border-theme-accent/30 space-y-1.5">
                <span className="font-mono font-bold text-[11px] text-emerald-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  Đáp án chuẩn chính thức
                </span>
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 font-mono font-black text-emerald-300 text-sm">
                  {question.correct_key || '(Chưa xác định đáp án)'}
                </div>
              </div>

              {/* Domain & Cognitive Level */}
              <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-2 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Mức độ nhận thức:</span>
                  <DifficultyBadgeAndMeter
                    level={question.cognitive_level}
                    showMeter={true}
                    showTierRange={true}
                    size="sm"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Miền năng lực số:</span>
                  <span className="text-white font-bold text-right truncate max-w-[170px]" title={question.digital_competency_domain}>
                    {question.digital_competency_domain ? (DIGITAL_COMPETENCY_DOMAINS[question.digital_competency_domain]?.name || question.digital_competency_domain) : 'Năng lực số'}
                  </span>
                </div>
                {question.digital_sub_competency && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Năng lực thành phần:</span>
                    <span className="text-purple-300 font-bold">{question.digital_sub_competency}</span>
                  </div>
                )}
              </div>

              {/* Legal Reference */}
              {question.legal_reference && (
                <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/30 space-y-1.5">
                  <span className="font-mono font-bold text-[11px] text-sky-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Căn cứ pháp lý:
                  </span>
                  <p className="text-slate-200 font-sans leading-relaxed text-xs">
                    {question.legal_reference}
                  </p>
                </div>
              )}

              {/* Detailed Explanation */}
              {question.explanation && (
                <div className="p-3 rounded-xl bg-[#241148] border border-white/10 space-y-1.5">
                  <span className="font-mono font-bold text-[11px] text-slate-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-theme-accent" />
                    Giải thích chi tiết:
                  </span>
                  <p className="text-slate-300 font-sans leading-relaxed text-xs">
                    {question.explanation}
                  </p>
                </div>
              )}

              {/* Action Button: Export PDF Report */}
              <div className="pt-2">
                <button
                  type="button"
                  id="btn-inspector-export-pdf"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    setShowPdfReportModal(true);
                  }}
                  className="w-full p-2.5 rounded-xl bg-gradient-to-r from-red-600/30 to-rose-600/30 hover:from-red-600/50 hover:to-rose-600/50 border border-red-500/40 text-red-200 hover:text-white font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98] shadow-lg"
                >
                  <FileText className="w-4 h-4 text-red-400" />
                  <span>Xuất Báo Cáo Thẩm Định &amp; Lịch Sử (PDF)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER SHORTCUTS */}
        <div className="px-4 py-2 bg-[#0D0420] border-t border-theme-accent/20 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400 shrink-0 select-none">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-slate-500">Phím tắt:</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded text-slate-300">Space: Bật/Dừng timer</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded text-slate-300">R: Reset</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded text-slate-300">1-4: Chọn A-D</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded text-slate-300">Esc: Đóng</span>
          </div>
          <div className="text-purple-300 text-[11px]">
            Hệ thống Quản lý Ngân hàng Câu hỏi • Beyond The Internet 2026
          </div>
        </div>

        {/* PDF Report Modal */}
        <QuestionHistoryPdfReportModal
          isOpen={showPdfReportModal}
          onClose={() => setShowPdfReportModal(false)}
          question={question}
        />

        {/* AI Variants Generator Modal */}
        {showVariantsModal && (
          <QuestionVariantsModal
            isOpen={showVariantsModal}
            question={question}
            onClose={() => setShowVariantsModal(false)}
          />
        )}

        {/* Psychometrics & IRT Modal */}
        {showPsychometricsModal && (
          <PsychometricItemAnalysisModal
            isOpen={showPsychometricsModal}
            question={question}
            onClose={() => setShowPsychometricsModal(false)}
          />
        )}

        {/* AI MC Voice Reader Modal */}
        {showVoiceModal && (
          <AiVoiceReaderModal
            isOpen={showVoiceModal}
            question={question}
            onClose={() => setShowVoiceModal(false)}
          />
        )}

        {/* Multi-Tier Approval Workflow Modal */}
        {showApprovalModal && (
          <MultiTierApprovalWorkflowModal
            isOpen={showApprovalModal}
            question={question}
            onClose={() => setShowApprovalModal(false)}
          />
        )}
      </div>
    </div>,
    document.body
  );
};
