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
  HelpCircle, 
  Sparkles, 
  Layers, 
  FileText, 
  ShieldCheck, 
  Flag, 
  ArrowRight, 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  BookOpen, 
  Scale, 
  Trophy, 
  Target, 
  Award, 
  Shuffle, 
  Settings2, 
  Sliders, 
  Printer, 
  Maximize2, 
  Minimize2, 
  Zap, 
  Eye, 
  Flame, 
  BarChart3, 
  Filter, 
  Share2,
  ListChecks,
  AlertCircle
} from 'lucide-react';
import { QuestionItem, CognitiveLevel, DigitalCompetencyDomainKey } from '../../types';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { soundFx } from '../../services/audioEffects';
import { 
  vibrateTap, 
  vibrateSelection, 
  vibrateSubmit, 
  vibrateCorrect, 
  vibrateWrong, 
  vibrateCountdownCritical, 
  vibrateSuccess 
} from '../../utils/hapticUtils';
import { confetti } from '../../utils/confetti';
import { 
  DIGITAL_COMPETENCY_DOMAINS, 
  COGNITIVE_LEVELS, 
  BTI_ROUND_GROUPS,
  BtiRoundGroupKey 
} from '../../data/digitalCompetencyData';
import { DifficultyBadgeAndMeter } from './DifficultyBadgeAndMeter';
import { questionBankManager } from '../../services/questionBankManager';

export interface InteractiveQuizPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuestions?: QuestionItem[];
  allAvailableQuestions?: QuestionItem[];
  filterContextLabel?: string;
}

type QuizMode = 'IMMEDIATE_FEEDBACK' | 'TIMED_EXAM';
type QuizStage = 'SETUP' | 'RUNNING' | 'RESULTS';

interface UserAnswerRecord {
  questionId: string;
  selectedOption?: string;
  shortAnswerText?: string;
  tfAnswers?: Record<string, 'DUNG' | 'SAI'>;
  isCorrect: boolean;
  timeSpentSeconds: number;
  timestamp: number;
  flagged?: boolean;
}

export const InteractiveQuizPreviewModal: React.FC<InteractiveQuizPreviewModalProps> = ({
  isOpen,
  onClose,
  initialQuestions = [],
  allAvailableQuestions = [],
  filterContextLabel = ''
}) => {
  useLockBodyScroll(isOpen);

  // Settings & Configuration
  const [quizStage, setQuizStage] = useState<QuizStage>('SETUP');
  const [quizMode, setQuizMode] = useState<QuizMode>('IMMEDIATE_FEEDBACK');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isShuffled, setIsShuffled] = useState<boolean>(false);
  const [isShuffleOptions, setIsShuffleOptions] = useState<boolean>(false);
  const [timeLimitPerQuestion, setTimeLimitPerQuestion] = useState<number>(20); // 0 for untimed
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(() => {
    return initialQuestions.length > 0 ? Math.min(initialQuestions.length, 10) : 5;
  });

  // Source selection in SETUP
  const [sourceType, setSourceType] = useState<'CURRENT_SELECTION' | 'FILTERED_LIST' | 'ALL_BANK'>('CURRENT_SELECTION');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>('ALL');

  // Active Quiz State
  const [activeQuestionList, setActiveQuestionList] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswerRecord>>({});
  
  // Current Question Answering Interaction State
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [shortAnswerInput, setShortAnswerInput] = useState<string>('');
  const [tfSelections, setTfSelections] = useState<Record<string, 'DUNG' | 'SAI'>>({});
  const [isCurrentSubmitted, setIsCurrentSubmitted] = useState<boolean>(false);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [totalQuizTimeSeconds, setTotalQuizTimeSeconds] = useState<number>(0);
  const timerRef = useRef<any>(null);
  const totalTimerRef = useRef<any>(null);

  // Gamification & Streaks
  const [streakCount, setStreakCount] = useState<number>(0);
  const [highestStreak, setHighestStreak] = useState<number>(0);

  // Results Filter
  const [resultsFilter, setResultsFilter] = useState<'ALL' | 'CORRECT' | 'INCORRECT' | 'FLAGGED'>('ALL');

  // Fullscreen container ref
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Initialize pool of questions
  const availablePool = useMemo(() => {
    let pool: QuestionItem[] = [];
    if (sourceType === 'CURRENT_SELECTION' && initialQuestions.length > 0) {
      pool = [...initialQuestions];
    } else if (sourceType === 'FILTERED_LIST' && allAvailableQuestions.length > 0) {
      pool = [...allAvailableQuestions];
    } else {
      pool = questionBankManager.getQuestions();
    }

    if (selectedDomainFilter !== 'ALL') {
      pool = pool.filter(q => q.digital_competency_domain === selectedDomainFilter);
    }
    return pool;
  }, [sourceType, initialQuestions, allAvailableQuestions, selectedDomainFilter]);

  // Adjust selectedQuestionCount bounds
  useEffect(() => {
    if (availablePool.length > 0 && selectedQuestionCount > availablePool.length) {
      setSelectedQuestionCount(availablePool.length);
    }
  }, [availablePool.length, selectedQuestionCount]);

  // Reset to initial setup when opened
  useEffect(() => {
    if (isOpen) {
      if (initialQuestions.length > 0) {
        setSourceType('CURRENT_SELECTION');
        setSelectedQuestionCount(initialQuestions.length);
      } else if (allAvailableQuestions.length > 0) {
        setSourceType('FILTERED_LIST');
        setSelectedQuestionCount(Math.min(allAvailableQuestions.length, 10));
      } else {
        setSourceType('ALL_BANK');
        setSelectedQuestionCount(10);
      }
      setQuizStage('SETUP');
      setUserAnswers({});
      setFlaggedIds(new Set());
      setStreakCount(0);
      setHighestStreak(0);
      setTotalQuizTimeSeconds(0);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    }
  }, [isOpen]);

  // Start the quiz
  const handleStartQuiz = () => {
    vibrateTap();
    soundFx.playClick();

    let list = [...availablePool];
    if (isShuffled) {
      list = list.sort(() => Math.random() - 0.5);
    }

    const finalQuestions = list.slice(0, selectedQuestionCount);
    if (finalQuestions.length === 0) return;

    setActiveQuestionList(finalQuestions);
    setCurrentIndex(0);
    setUserAnswers({});
    setFlaggedIds(new Set());
    setStreakCount(0);
    setHighestStreak(0);
    setTotalQuizTimeSeconds(0);
    setQuizStage('RUNNING');

    loadQuestionState(finalQuestions[0]);

    // Start total quiz time tracker
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    totalTimerRef.current = setInterval(() => {
      setTotalQuizTimeSeconds(prev => prev + 1);
    }, 1000);
  };

  const loadQuestionState = (q: QuestionItem) => {
    const existing = userAnswers[q.id];
    if (existing) {
      setSelectedOption(existing.selectedOption || '');
      setShortAnswerInput(existing.shortAnswerText || '');
      setTfSelections(existing.tfAnswers || {});
      setIsCurrentSubmitted(true);
      setIsTimerRunning(false);
    } else {
      setSelectedOption('');
      setShortAnswerInput('');
      setTfSelections({});
      setIsCurrentSubmitted(false);

      const limit = timeLimitPerQuestion > 0 ? timeLimitPerQuestion : (q.time_limit || 20);
      setTimeLeft(limit);
      setIsTimerRunning(timeLimitPerQuestion > 0);
    }
  };

  // Timer ticking logic
  useEffect(() => {
    if (quizStage !== 'RUNNING' || !isTimerRunning || isCurrentSubmitted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsTimerRunning(false);
          // Auto submit on timeout
          handleAutoSubmitOnTimeout();
          return 0;
        }

        const next = prev - 1;
        if (soundEnabled && next <= 3) {
          soundFx.playTick(true);
          vibrateCountdownCritical();
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizStage, isTimerRunning, isCurrentSubmitted, currentIndex, activeQuestionList]);

  const currentQuestion = activeQuestionList[currentIndex];

  // Auto-submit when time expires
  const handleAutoSubmitOnTimeout = () => {
    if (!currentQuestion || isCurrentSubmitted) return;
    handleSubmitAnswer(true);
  };

  // Check correctness of answer
  const evaluateAnswer = (q: QuestionItem): boolean => {
    const isVcnv = q.round_type === 'VCNV' || Boolean(q.round_format?.includes('VCNV'));
    const isTrueFalse = (q.round_format as string)?.includes('DUNG_SAI') || q.round_type === 'TRUE_FALSE';

    if (isTrueFalse) {
      const correctStr = (q.correct_key || '').toUpperCase();
      // Check each item
      let allMatch = true;
      ['a', 'b', 'c', 'd'].forEach(k => {
        const userChoice = tfSelections[k];
        if (!userChoice) {
          allMatch = false;
          return;
        }
        const isTrueKey = correctStr.includes(`${k}:Đ`) || correctStr.includes(`${k}:T`) || correctStr.includes(`${k}:1`) || correctStr.includes(`${k.toUpperCase()}:Đ`);
        const expected = isTrueKey ? 'DUNG' : 'SAI';
        if (userChoice !== expected) {
          allMatch = false;
        }
      });
      return allMatch;
    }

    if (isVcnv || !q.options || Object.keys(q.options).length === 0) {
      // Short answer
      const userClean = shortAnswerInput.trim().toUpperCase().replace(/\s+/g, '');
      const correctClean = (q.correct_key || '').trim().toUpperCase().replace(/\s+/g, '');
      return userClean.length > 0 && userClean === correctClean;
    }

    // Multiple Choice
    return selectedOption === q.correct_key;
  };

  const handleSubmitAnswer = (isTimeout: boolean = false) => {
    if (!currentQuestion) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(false);
    setIsCurrentSubmitted(true);

    const isCorrect = isTimeout ? false : evaluateAnswer(currentQuestion);
    const limit = timeLimitPerQuestion > 0 ? timeLimitPerQuestion : (currentQuestion.time_limit || 20);
    const timeSpent = Math.max(1, limit - timeLeft);

    const record: UserAnswerRecord = {
      questionId: currentQuestion.id,
      selectedOption: selectedOption || undefined,
      shortAnswerText: shortAnswerInput || undefined,
      tfAnswers: Object.keys(tfSelections).length > 0 ? tfSelections : undefined,
      isCorrect,
      timeSpentSeconds: timeSpent,
      timestamp: Date.now(),
      flagged: flaggedIds.has(currentQuestion.id)
    };

    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: record
    }));

    if (isCorrect) {
      vibrateCorrect();
      if (soundEnabled) soundFx.playCorrect();
      const newStreak = streakCount + 1;
      setStreakCount(newStreak);
      if (newStreak > highestStreak) setHighestStreak(newStreak);

      if (newStreak >= 3 && typeof window !== 'undefined') {
        confetti();
      }
    } else {
      vibrateWrong();
      if (soundEnabled) soundFx.playWrong();
      setStreakCount(0);
    }
  };

  const handleNextQuestion = () => {
    vibrateTap();
    soundFx.playClick();

    if (currentIndex < activeQuestionList.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      loadQuestionState(activeQuestionList[nextIdx]);
    } else {
      // Finish quiz
      handleFinishQuiz();
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      vibrateTap();
      soundFx.playClick();
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      loadQuestionState(activeQuestionList[prevIdx]);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    if (index >= 0 && index < activeQuestionList.length) {
      vibrateTap();
      soundFx.playClick();
      setCurrentIndex(index);
      loadQuestionState(activeQuestionList[index]);
    }
  };

  const handleToggleFlag = (qId: string) => {
    vibrateTap();
    setFlaggedIds(prev => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  const handleFinishQuiz = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    setIsTimerRunning(false);
    setQuizStage('RESULTS');
    vibrateSuccess();
    if (soundEnabled) soundFx.playSuccess();
    if (typeof window !== 'undefined') {
      confetti();
    }
  };

  const handleRetakeQuiz = () => {
    handleStartQuiz();
  };

  const handleRetryMistakes = () => {
    const wrongQuestions = activeQuestionList.filter(q => {
      const ans = userAnswers[q.id];
      return ans && !ans.isCorrect;
    });

    if (wrongQuestions.length === 0) return;

    setActiveQuestionList(wrongQuestions);
    setSelectedQuestionCount(wrongQuestions.length);
    setCurrentIndex(0);
    setUserAnswers({});
    setFlaggedIds(new Set());
    setStreakCount(0);
    setQuizStage('RUNNING');
    loadQuestionState(wrongQuestions[0]);
  };

  const handleToggleFullscreen = () => {
    if (!modalContainerRef.current) return;
    if (!isFullscreen) {
      if (modalContainerRef.current.requestFullscreen) {
        modalContainerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    if (!isOpen || quizStage !== 'RUNNING' || !currentQuestion) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing inside input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Enter' && !isCurrentSubmitted) {
          handleSubmitAnswer();
        }
        return;
      }

      const key = e.key.toUpperCase();

      if (['A', 'B', 'C', 'D'].includes(key) && !isCurrentSubmitted) {
        e.preventDefault();
        vibrateSelection();
        if (soundEnabled) soundFx.playClick();
        setSelectedOption(key);
      } else if (['1', '2', '3', '4'].includes(e.key) && !isCurrentSubmitted) {
        e.preventDefault();
        const map: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
        vibrateSelection();
        if (soundEnabled) soundFx.playClick();
        setSelectedOption(map[e.key]);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isCurrentSubmitted) {
          if (selectedOption || shortAnswerInput || Object.keys(tfSelections).length > 0) {
            handleSubmitAnswer();
          }
        } else {
          handleNextQuestion();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (isCurrentSubmitted) handleNextQuestion();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevQuestion();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleToggleFlag(currentQuestion.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, quizStage, currentQuestion, isCurrentSubmitted, selectedOption, shortAnswerInput, tfSelections]);

  // Statistics calculation for results
  const resultsStats = useMemo(() => {
    const total = activeQuestionList.length;
    let correct = 0;
    let totalTime = 0;
    const domainBreakdown: Record<string, { total: number; correct: number }> = {};
    const levelBreakdown: Record<string, { total: number; correct: number }> = {};

    activeQuestionList.forEach(q => {
      const ans = userAnswers[q.id];
      const isCor = ans?.isCorrect ?? false;
      if (isCor) correct++;
      totalTime += ans?.timeSpentSeconds ?? 0;

      // Domain
      const dom = q.digital_competency_domain || 'MIEN_4';
      if (!domainBreakdown[dom]) domainBreakdown[dom] = { total: 0, correct: 0 };
      domainBreakdown[dom].total++;
      if (isCor) domainBreakdown[dom].correct++;

      // Level
      const lvl = q.cognitive_level || 'THONG_HIEU';
      if (!levelBreakdown[lvl]) levelBreakdown[lvl] = { total: 0, correct: 0 };
      levelBreakdown[lvl].total++;
      if (isCor) levelBreakdown[lvl].correct++;
    });

    const accuracyPct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const avgTimePerQ = total > 0 ? Math.round(totalTime / total) : 0;
    const scorePoints = correct * 10;

    return {
      total,
      correct,
      incorrect: total - correct,
      accuracyPct,
      avgTimePerQ,
      scorePoints,
      domainBreakdown,
      levelBreakdown
    };
  }, [activeQuestionList, userAnswers]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn overflow-hidden modal-backdrop-isolated select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Quiz Preview"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
          vibrateTap();
          soundFx.playClick();
        }
      }}
    >
      <div 
        ref={modalContainerRef}
        className="w-full max-w-5xl h-[92vh] max-h-[940px] bg-[#140827]/98 fluent-acrylic-surface border border-theme-accent/40 rounded-[8px] shadow-[0_24px_64px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col text-slate-100 font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-3.5 sm:p-4 border-b border-theme-accent/25 bg-[#1B0D38] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[6px] bg-gradient-to-br from-amber-500/30 to-purple-600/30 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-inner">
              <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-sm sm:text-base text-white">
                  Interactive Quiz Preview
                </span>
                <span className="text-[10.5px] font-mono font-bold bg-theme-accent/20 text-theme-accent border border-theme-accent/30 px-2 py-0.5 rounded">
                  {quizMode === 'IMMEDIATE_FEEDBACK' ? '⚡ Phản hồi tức thì' : '⏱️ Thi tính giờ BTI'}
                </span>
              </div>
              <p className="text-xs text-[#B6A6D8] font-mono mt-0.5 hidden sm:block">
                Mô phỏng trải nghiệm thi thực tế với Progress Tracker &amp; Phân tích bẫy tư duy
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                setSoundEnabled(prev => !prev);
              }}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono transition cursor-pointer"
              title={soundEnabled ? 'Tắt âm thanh SFX' : 'Bật âm thanh SFX'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-mono transition cursor-pointer hidden md:flex items-center gap-1"
              title="Toàn màn hình"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-300" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-300" />}
            </button>

            {quizStage === 'RUNNING' && (
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setQuizStage('SETUP');
                }}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-500/30 text-xs font-mono transition cursor-pointer flex items-center gap-1"
                title="Cài đặt lại bộ đề"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cài đặt</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STAGE 1: SETUP & CONFIGURATION SCREEN */}
        {/* ========================================================================= */}
        {quizStage === 'SETUP' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-[#120726]">
            {/* Hero Welcome Banner */}
            <div className="p-4 sm:p-5 rounded-[8px] bg-gradient-to-r from-purple-900/40 via-[#241148] to-amber-900/30 border border-theme-accent/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Interactive Test Simulator</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Khởi Tạo Bộ Đề Thử Nghiệm Trắc Nghiệm BTI 2026
                </h3>
                <p className="text-xs text-[#B6A6D8] leading-relaxed max-w-2xl">
                  Trải nghiệm làm bài tương tác như thí sinh thật với đồng hồ bấm giờ, phản hồi kiến thức tức thì và đối soát căn cứ pháp lý theo Thông tư 02/2025/TT-BGDĐT.
                </p>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={handleStartQuiz}
                  disabled={availablePool.length === 0}
                  className="w-full sm:w-auto px-6 py-3 rounded-[6px] bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold font-mono text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 cursor-pointer transition transform active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Bắt Đầu Thử Nghiệm ({selectedQuestionCount} câu)</span>
                </button>
              </div>
            </div>

            {/* Configuration Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Box 1: Nguồn Câu Hỏi */}
              <div className="p-4 rounded-[6px] bg-[#1A0B36] border border-theme-accent/25 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-theme-accent flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>1. CHỌN NGUỒN CÂU HỎI</span>
                  </span>
                  <span className="text-[11px] font-mono text-amber-300">
                    Khả dụng: {availablePool.length} câu
                  </span>
                </div>

                <div className="space-y-2">
                  <div
                    onClick={() => { vibrateTap(); setSourceType('CURRENT_SELECTION'); }}
                    className={`p-3 rounded-[4px] border cursor-pointer transition flex items-center justify-between gap-2 ${
                      sourceType === 'CURRENT_SELECTION'
                        ? 'bg-[#2E155B] border-theme-accent text-white shadow-sm'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${sourceType === 'CURRENT_SELECTION' ? 'border-theme-accent bg-theme-accent' : 'border-slate-500'}`}>
                        {sourceType === 'CURRENT_SELECTION' && <div className="w-1.5 h-1.5 rounded-full bg-[#120726]" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs">Các câu đang chọn trong Dashboard</div>
                        <div className="text-[10.5px] text-[#B6A6D8]">Dựa trên các mục đã tích chọn checkbox</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-amber-300">
                      {initialQuestions.length} câu
                    </span>
                  </div>

                  <div
                    onClick={() => { vibrateTap(); setSourceType('FILTERED_LIST'); }}
                    className={`p-3 rounded-[4px] border cursor-pointer transition flex items-center justify-between gap-2 ${
                      sourceType === 'FILTERED_LIST'
                        ? 'bg-[#2E155B] border-theme-accent text-white shadow-sm'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${sourceType === 'FILTERED_LIST' ? 'border-theme-accent bg-theme-accent' : 'border-slate-500'}`}>
                        {sourceType === 'FILTERED_LIST' && <div className="w-1.5 h-1.5 rounded-full bg-[#120726]" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs">Danh sách câu hỏi đang lọc</div>
                        <div className="text-[10.5px] text-[#B6A6D8]">{filterContextLabel || 'Theo bộ lọc hiện tại'}</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-amber-300">
                      {allAvailableQuestions.length} câu
                    </span>
                  </div>

                  <div
                    onClick={() => { vibrateTap(); setSourceType('ALL_BANK'); }}
                    className={`p-3 rounded-[4px] border cursor-pointer transition flex items-center justify-between gap-2 ${
                      sourceType === 'ALL_BANK'
                        ? 'bg-[#2E155B] border-theme-accent text-white shadow-sm'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${sourceType === 'ALL_BANK' ? 'border-theme-accent bg-theme-accent' : 'border-slate-500'}`}>
                        {sourceType === 'ALL_BANK' && <div className="w-1.5 h-1.5 rounded-full bg-[#120726]" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs">Toàn bộ Ngân hàng Đề thi</div>
                        <div className="text-[10.5px] text-[#B6A6D8]">Lấy ngẫu nhiên từ kho 100+ câu hỏi</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-amber-300">
                      {questionBankManager.getQuestions().length} câu
                    </span>
                  </div>
                </div>

                {/* Question Count Slider */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">Số lượng câu thử nghiệm:</span>
                    <span className="font-bold text-theme-accent text-sm">{selectedQuestionCount} câu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[5, 10, 15, 20].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          setSelectedQuestionCount(Math.min(availablePool.length, cnt));
                        }}
                        disabled={availablePool.length < cnt}
                        className={`px-3 py-1 rounded text-xs font-mono font-bold border transition cursor-pointer ${
                          selectedQuestionCount === cnt
                            ? 'bg-theme-accent text-slate-950 border-theme-accent'
                            : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/10 disabled:opacity-30'
                        }`}
                      >
                        {cnt} câu
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        vibrateTap();
                        setSelectedQuestionCount(availablePool.length);
                      }}
                      className={`px-3 py-1 rounded text-xs font-mono font-bold border transition cursor-pointer ml-auto ${
                        selectedQuestionCount === availablePool.length
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      Tất cả ({availablePool.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Box 2: Chế Độ & Quy Tắc Thi */}
              <div className="p-4 rounded-[6px] bg-[#1A0B36] border border-theme-accent/25 space-y-3.5">
                <span className="font-mono font-bold text-xs text-theme-accent flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  <span>2. CHẾ ĐỘ &amp; QUY TẮC KHẢO THÍ</span>
                </span>

                {/* Mode Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => { vibrateTap(); setQuizMode('IMMEDIATE_FEEDBACK'); }}
                    className={`p-3 rounded-[4px] border cursor-pointer transition space-y-1 ${
                      quizMode === 'IMMEDIATE_FEEDBACK'
                        ? 'bg-[#2E155B] border-theme-accent ring-1 ring-theme-accent/50'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Phản hồi tức thì</span>
                    </div>
                    <p className="text-[10.5px] text-[#B6A6D8] leading-tight">
                      Xem giải thích, căn cứ pháp lý và phân tích bẫy đúng/sai ngay khi nộp từng câu.
                    </p>
                  </div>

                  <div
                    onClick={() => { vibrateTap(); setQuizMode('TIMED_EXAM'); }}
                    className={`p-3 rounded-[4px] border cursor-pointer transition space-y-1 ${
                      quizMode === 'TIMED_EXAM'
                        ? 'bg-[#2E155B] border-theme-accent ring-1 ring-theme-accent/50'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-sky-300">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Thi thử bấm giờ</span>
                    </div>
                    <p className="text-[10.5px] text-[#B6A6D8] leading-tight">
                      Không hiện đáp án trong lúc thi. Chỉ hiển thị tổng kết chi tiết sau khi hoàn thành.
                    </p>
                  </div>
                </div>

                {/* Per-Question Timer */}
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">Thời gian làm bài mỗi câu:</span>
                    <span className="text-amber-300 font-bold">
                      {timeLimitPerQuestion === 0 ? 'Không giới hạn' : `${timeLimitPerQuestion} giây/câu`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[15, 20, 30, 45, 0].map(sec => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          setTimeLimitPerQuestion(sec);
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold border transition cursor-pointer ${
                          timeLimitPerQuestion === sec
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {sec === 0 ? 'Vô hạn' : `${sec}s`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shuffling Options */}
                <div className="pt-2 border-t border-white/10 space-y-2 text-xs">
                  <label className="flex items-center justify-between cursor-pointer p-2 rounded bg-black/30 hover:bg-white/5 transition">
                    <span className="text-slate-300 font-mono">🔀 Xáo trộn thứ tự câu hỏi:</span>
                    <input
                      type="checkbox"
                      checked={isShuffled}
                      onChange={e => setIsShuffled(e.target.checked)}
                      className="rounded accent-theme-accent w-4 h-4 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer p-2 rounded bg-black/30 hover:bg-white/5 transition">
                    <span className="text-slate-300 font-mono">🔊 Bật hiệu ứng âm thanh SFX:</span>
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={e => setSoundEnabled(e.target.checked)}
                      className="rounded accent-theme-accent w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 2: RUNNING QUIZ SCREEN */}
        {/* ========================================================================= */}
        {quizStage === 'RUNNING' && currentQuestion && (
          <div className="flex flex-col flex-1 overflow-hidden bg-[#120726]">
            {/* Top Progress & Status Tracker Header */}
            <div className="p-3 sm:p-4 bg-[#180A30] border-b border-theme-accent/25 flex flex-col gap-2.5 shrink-0">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {/* Left: Question counter & Streak */}
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-xs sm:text-sm text-theme-accent bg-[#2A1252] px-2.5 py-1 rounded border border-theme-accent/30 shadow-inner">
                    CÂU {currentIndex + 1} / {activeQuestionList.length}
                  </span>

                  {streakCount >= 2 && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 border border-orange-500/40 text-xs font-mono font-bold animate-bounce">
                      <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                      <span>Chuỗi {streakCount} câu đúng!</span>
                    </div>
                  )}

                  <DifficultyBadgeAndMeter
                    level={currentQuestion.cognitive_level}
                    size="sm"
                    showMeter={false}
                  />
                </div>

                {/* Right: Countdown Timer & Flag button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleFlag(currentQuestion.id)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                      flaggedIds.has(currentQuestion.id)
                        ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                    }`}
                    title="Đánh dấu câu hỏi để xem lại sau (Phím F)"
                  >
                    <Flag className={`w-3.5 h-3.5 ${flaggedIds.has(currentQuestion.id) ? 'fill-white text-white' : 'text-slate-400'}`} />
                    <span className="hidden sm:inline">{flaggedIds.has(currentQuestion.id) ? 'Đã gắn cờ' : 'Gắn cờ'}</span>
                  </button>

                  {/* Countdown Badge */}
                  {timeLimitPerQuestion > 0 && (
                    <div className={`px-3 py-1 rounded-[4px] font-mono font-bold text-xs flex items-center gap-1.5 border shadow-sm ${
                      timeLeft <= 3
                        ? 'bg-rose-950 text-rose-300 border-rose-500/60 animate-pulse'
                        : timeLeft <= 5
                          ? 'bg-amber-950 text-amber-300 border-amber-500/60'
                          : 'bg-[#25104A] text-slate-200 border-theme-accent/40'
                    }`}>
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{timeLeft}s</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-gradient-to-r from-theme-accent via-amber-400 to-emerald-400 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${((currentIndex + 1) / activeQuestionList.length) * 100}%` }}
                />
              </div>

              {/* Interactive Bubble Navigator Grid */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
                {activeQuestionList.map((q, idx) => {
                  const ans = userAnswers[q.id];
                  const isCurrent = idx === currentIndex;
                  const isFlagged = flaggedIds.has(q.id);

                  let bgStyle = 'bg-black/40 text-slate-400 border-white/10 hover:border-white/30';
                  if (ans) {
                    if (quizMode === 'IMMEDIATE_FEEDBACK') {
                      bgStyle = ans.isCorrect 
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 font-bold' 
                        : 'bg-rose-950/80 text-rose-300 border-rose-500/60 font-bold';
                    } else {
                      bgStyle = 'bg-amber-950/80 text-amber-300 border-amber-500/50 font-bold';
                    }
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleJumpToQuestion(idx)}
                      className={`min-w-[28px] h-7 px-1.5 rounded text-[11px] font-mono border transition flex items-center justify-center relative cursor-pointer ${bgStyle} ${
                        isCurrent ? 'ring-2 ring-theme-accent scale-105 font-black text-white shadow-md' : ''
                      }`}
                      title={`Câu ${idx + 1}: ${q.id}`}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-500 ring-1 ring-black" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Question & Options Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              {/* Question Text */}
              <div className="p-4 sm:p-5 rounded-[6px] bg-[#1A0B36] border border-theme-accent/30 space-y-2 shadow-sm">
                <div className="flex items-center justify-between gap-2 text-xs font-mono text-[#B6A6D8]">
                  <span>{currentQuestion.stage || 'BTI 2026'} • {currentQuestion.round_name || 'Khảo thí số'}</span>
                  <span className="text-amber-300 font-semibold">{currentQuestion.id}</span>
                </div>
                <h2 className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                  {currentQuestion.question_text}
                </h2>
              </div>

              {/* Options Section */}
              {(() => {
                const isVcnv = currentQuestion.round_type === 'VCNV' || Boolean(currentQuestion.round_format?.includes('VCNV'));
                const isTrueFalse = (currentQuestion.round_format as string)?.includes('DUNG_SAI') || currentQuestion.round_type === 'TRUE_FALSE';

                // CASE 1: True / False 4 items
                if (isTrueFalse) {
                  return (
                    <div className="space-y-2.5">
                      <span className="text-xs font-mono text-[#B6A6D8] block">
                        Chọn Đúng (Đ) hoặc Sai (S) cho từng ý dưới đây:
                      </span>
                      {['a', 'b', 'c', 'd'].map(key => {
                        const optText = currentQuestion.options?.[key] || currentQuestion.options?.[key.toUpperCase()];
                        if (!optText) return null;
                        const userVal = tfSelections[key];
                        const correctStr = (currentQuestion.correct_key || '').toUpperCase();
                        const isTrueKey = correctStr.includes(`${key}:Đ`) || correctStr.includes(`${key}:T`) || correctStr.includes(`${key}:1`) || correctStr.includes(`${key.toUpperCase()}:Đ`);
                        const expected = isTrueKey ? 'DUNG' : 'SAI';

                        return (
                          <div
                            key={key}
                            className="p-3 rounded-[6px] bg-[#1A0B36] border border-theme-accent/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                          >
                            <div className="flex items-start gap-2.5 text-xs text-slate-200">
                              <span className="font-mono font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                                {key})
                              </span>
                              <span>{optText}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                disabled={isCurrentSubmitted}
                                onClick={() => {
                                  vibrateSelection();
                                  setTfSelections(prev => ({ ...prev, [key]: 'DUNG' }));
                                }}
                                className={`px-3 py-1 rounded text-xs font-mono font-bold border transition cursor-pointer ${
                                  userVal === 'DUNG'
                                    ? isCurrentSubmitted && quizMode === 'IMMEDIATE_FEEDBACK'
                                      ? expected === 'DUNG'
                                        ? 'bg-emerald-600 text-white border-emerald-400'
                                        : 'bg-rose-600 text-white border-rose-400'
                                      : 'bg-emerald-600 text-white border-emerald-400'
                                    : 'bg-black/40 text-slate-400 border-white/10 hover:bg-white/10'
                                }`}
                              >
                                ✓ ĐÚNG
                              </button>

                              <button
                                type="button"
                                disabled={isCurrentSubmitted}
                                onClick={() => {
                                  vibrateSelection();
                                  setTfSelections(prev => ({ ...prev, [key]: 'SAI' }));
                                }}
                                className={`px-3 py-1 rounded text-xs font-mono font-bold border transition cursor-pointer ${
                                  userVal === 'SAI'
                                    ? isCurrentSubmitted && quizMode === 'IMMEDIATE_FEEDBACK'
                                      ? expected === 'SAI'
                                        ? 'bg-emerald-600 text-white border-emerald-400'
                                        : 'bg-rose-600 text-white border-rose-400'
                                      : 'bg-rose-600 text-white border-rose-400'
                                    : 'bg-black/40 text-slate-400 border-white/10 hover:bg-white/10'
                                }`}
                              >
                                ✗ SAI
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // CASE 2: Short Answer / VCNV
                if (isVcnv || !currentQuestion.options || Object.keys(currentQuestion.options).length === 0) {
                  return (
                    <div className="space-y-3">
                      <label className="text-xs font-mono text-[#B6A6D8] block">
                        Nhập đáp án hoặc từ khóa của bạn:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          disabled={isCurrentSubmitted}
                          value={shortAnswerInput}
                          onChange={e => setShortAnswerInput(e.target.value)}
                          placeholder="Nhập câu trả lời..."
                          className="flex-1 px-4 py-2.5 rounded-[4px] bg-[#1A0B36] border border-theme-accent/40 text-white text-sm font-mono focus:outline-none focus:border-amber-400"
                        />
                        {!isCurrentSubmitted && (
                          <button
                            type="button"
                            onClick={() => handleSubmitAnswer()}
                            disabled={!shortAnswerInput.trim()}
                            className="px-5 py-2.5 rounded-[4px] bg-theme-accent hover:bg-theme-accent-hover text-slate-950 font-bold font-mono text-xs cursor-pointer transition disabled:opacity-40"
                          >
                            Xác nhận
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                // CASE 3: Multiple Choice (A, B, C, D)
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(currentQuestion.options).map(([key, text]) => {
                      const isSelected = selectedOption === key;
                      const isCorrectKey = currentQuestion.correct_key === key;

                      let cardStyle = 'bg-[#1A0B36] border-theme-accent/25 hover:border-theme-accent/60 text-slate-200';
                      let keyBadgeStyle = 'bg-black/40 text-slate-300 border-white/15';

                      if (isCurrentSubmitted && quizMode === 'IMMEDIATE_FEEDBACK') {
                        if (isCorrectKey) {
                          cardStyle = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 ring-2 ring-emerald-500/40 shadow-md';
                          keyBadgeStyle = 'bg-emerald-500 text-slate-950 font-bold';
                        } else if (isSelected && !isCorrectKey) {
                          cardStyle = 'bg-rose-950/40 border-rose-500/60 text-rose-200 ring-1 ring-rose-500/40';
                          keyBadgeStyle = 'bg-rose-500 text-slate-950 font-bold';
                        } else {
                          cardStyle = 'bg-black/30 border-white/5 text-slate-500 opacity-60';
                        }
                      } else if (isSelected) {
                        cardStyle = 'bg-[#2E155B] border-theme-accent text-white ring-2 ring-theme-accent/60 shadow-lg';
                        keyBadgeStyle = 'bg-theme-accent text-slate-950 font-bold';
                      }

                      return (
                        <div
                          key={key}
                          onClick={() => {
                            if (isCurrentSubmitted) return;
                            vibrateSelection();
                            if (soundEnabled) soundFx.playClick();
                            setSelectedOption(key);
                          }}
                          className={`p-3.5 rounded-[6px] border cursor-pointer transition flex items-start gap-3 select-none ${cardStyle}`}
                        >
                          <span className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs shrink-0 border ${keyBadgeStyle}`}>
                            {key}
                          </span>
                          <span className="text-xs sm:text-sm font-sans leading-relaxed mt-0.5">
                            {text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* IMMEDIATE FEEDBACK REVEAL CARD */}
              {isCurrentSubmitted && quizMode === 'IMMEDIATE_FEEDBACK' && (
                <div className={`p-4 sm:p-5 rounded-[6px] border space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
                  evaluateAnswer(currentQuestion)
                    ? 'bg-emerald-950/25 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/25 border-rose-500/50 text-rose-200'
                }`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {evaluateAnswer(currentQuestion) ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                      <span className="font-mono font-bold text-xs sm:text-sm">
                        {evaluateAnswer(currentQuestion) ? '🎉 CHÍNH XÁC (+10 ĐIỂM)' : '❌ CHƯA CHÍNH XÁC'}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-bold bg-black/40 px-2.5 py-0.5 rounded border border-white/10">
                      Đáp án đúng: <strong className="text-amber-300">{currentQuestion.correct_key}</strong>
                    </span>
                  </div>

                  {/* Explanation Text */}
                  {currentQuestion.explanation && (
                    <div className="text-xs text-slate-200 font-sans leading-relaxed pt-2 border-t border-white/10">
                      <span className="font-bold text-amber-300 font-mono mr-1.5">💡 Phân tích giải thích:</span>
                      {currentQuestion.explanation}
                    </div>
                  )}

                  {/* Legal Citation */}
                  {currentQuestion.legal_reference && (
                    <div className="flex items-start gap-1.5 text-[11px] font-mono text-amber-300 bg-black/40 p-2 rounded border border-amber-500/20">
                      <Scale className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>Căn cứ pháp lý: {currentQuestion.legal_reference}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Interaction Action Bar */}
            <div className="p-3 sm:p-4 bg-[#180A30] border-t border-theme-accent/25 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={handlePrevQuestion}
                disabled={currentIndex === 0}
                className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 border border-white/10 text-xs font-mono flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Câu trước</span>
              </button>

              <div className="flex items-center gap-2">
                {!isCurrentSubmitted ? (
                  <button
                    type="button"
                    onClick={() => handleSubmitAnswer()}
                    disabled={!selectedOption && !shortAnswerInput && Object.keys(tfSelections).length === 0}
                    className="px-5 py-2 rounded-[4px] bg-theme-accent hover:bg-theme-accent-hover text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-theme-accent/20 cursor-pointer transition disabled:opacity-40"
                  >
                    <span>Nộp câu trả lời</span>
                    <kbd className="hidden sm:inline text-[9px] bg-black/20 px-1 rounded text-slate-950 font-bold">Enter</kbd>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="px-5 py-2 rounded-[4px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer transition"
                  >
                    <span>{currentIndex < activeQuestionList.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả bài thi'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleFinishQuiz}
                  className="px-3 py-1.5 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/35 text-xs font-mono font-bold cursor-pointer transition ml-1"
                  title="Nộp bài và xem bảng điểm tổng kết"
                >
                  Nộp bài sớm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 3: RESULTS SCORECARD & PERFORMANCE ANALYTICS */}
        {/* ========================================================================= */}
        {quizStage === 'RESULTS' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-[#120726]">
            {/* Grand Score Banner */}
            <div className="p-5 sm:p-6 rounded-[8px] bg-gradient-to-r from-[#2B1055] via-[#3E1D74] to-[#1C093D] border border-theme-accent/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>HOÀN TẤT BÀI THI THỬ NGHIỆM</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {resultsStats.accuracyPct >= 80 ? 'Xuất Sắc! Đạt Chuẩn Năng Lực Số BTI' : resultsStats.accuracyPct >= 50 ? 'Khá Tốt! Cần Luyện Thêm Một Số Chủ Đề' : 'Cần Rèn Luyện Thêm Kiến Thức Cơ Bản'}
                </h2>
                <p className="text-xs text-[#B6A6D8] font-mono">
                  Tổng thời gian hoàn thành: <strong>{Math.floor(totalQuizTimeSeconds / 60)}p {totalQuizTimeSeconds % 60}s</strong> • TB: <strong>{resultsStats.avgTimePerQ}s/câu</strong>
                </p>
              </div>

              {/* Big Score Dial */}
              <div className="flex items-center gap-4 shrink-0 bg-black/40 p-4 rounded-[8px] border border-white/10">
                <div className="text-center">
                  <div className="text-4xl font-black font-mono text-amber-300">
                    {resultsStats.accuracyPct}%
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">ĐỘ CHÍNH XÁC</div>
                </div>

                <div className="h-10 w-px bg-white/10" />

                <div className="text-center font-mono">
                  <div className="text-2xl font-bold text-emerald-400">
                    {resultsStats.correct}/{resultsStats.total}
                  </div>
                  <div className="text-[10px] text-slate-400">CÂU ĐÚNG</div>
                </div>

                <div className="h-10 w-px bg-white/10" />

                <div className="text-center font-mono">
                  <div className="text-2xl font-bold text-theme-accent">
                    +{resultsStats.scorePoints}
                  </div>
                  <div className="text-[10px] text-slate-400">ĐIỂM SỐ</div>
                </div>
              </div>
            </div>

            {/* Competency Mastery Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* Domain Breakdown */}
              <div className="p-4 rounded-[6px] bg-[#1A0B36] border border-theme-accent/25 space-y-3">
                <span className="font-bold text-theme-accent block">
                  KẾT QUẢ THEO MIỀN NĂNG LỰC SỐ (TT 02/2025):
                </span>
                <div className="space-y-2">
                  {Object.entries(resultsStats.domainBreakdown).map(([domKey, info]) => {
                    const domInfo = DIGITAL_COMPETENCY_DOMAINS[domKey as DigitalCompetencyDomainKey];
                    const pct = info.total > 0 ? Math.round((info.correct / info.total) * 100) : 0;
                    return (
                      <div key={domKey} className="p-2 rounded bg-black/30 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-200">{domInfo?.name || domKey}</span>
                          <span className="font-bold text-amber-300">{info.correct}/{info.total} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-black/50 h-1 rounded-full overflow-hidden">
                          <div className="bg-theme-accent h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cognitive Level Breakdown */}
              <div className="p-4 rounded-[6px] bg-[#1A0B36] border border-theme-accent/25 space-y-3">
                <span className="font-bold text-theme-accent block">
                  KẾT QUẢ THEO CẤP ĐỘ NHẬN THỨC (BLOOM):
                </span>
                <div className="space-y-2">
                  {Object.entries(resultsStats.levelBreakdown).map(([lvlKey, info]) => {
                    const lvlInfo = COGNITIVE_LEVELS[lvlKey as CognitiveLevel];
                    const pct = info.total > 0 ? Math.round((info.correct / info.total) * 100) : 0;
                    return (
                      <div key={lvlKey} className="p-2 rounded bg-black/30 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-200">{lvlInfo?.name || lvlKey}</span>
                          <span className="font-bold text-emerald-300">{info.correct}/{info.total} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-black/50 h-1 rounded-full overflow-hidden">
                          <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Question Breakdown List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-mono font-bold text-xs text-white">
                  CHI TIẾT TỪNG CÂU HỎI ({resultsStats.total} CÂU)
                </span>

                <div className="flex items-center gap-1 text-xs font-mono">
                  {(['ALL', 'CORRECT', 'INCORRECT', 'FLAGGED'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setResultsFilter(tab)}
                      className={`px-2.5 py-1 rounded transition cursor-pointer ${
                        resultsFilter === tab
                          ? 'bg-theme-accent text-slate-950 font-bold'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {tab === 'ALL' ? `Tất cả (${resultsStats.total})` : tab === 'CORRECT' ? `Đúng (${resultsStats.correct})` : tab === 'INCORRECT' ? `Sai (${resultsStats.incorrect})` : `Gắn cờ (${flaggedIds.size})`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                {activeQuestionList
                  .filter(q => {
                    const ans = userAnswers[q.id];
                    if (resultsFilter === 'CORRECT') return ans?.isCorrect;
                    if (resultsFilter === 'INCORRECT') return !ans?.isCorrect;
                    if (resultsFilter === 'FLAGGED') return flaggedIds.has(q.id);
                    return true;
                  })
                  .map((q, idx) => {
                    const ans = userAnswers[q.id];
                    const isCor = ans?.isCorrect ?? false;

                    return (
                      <div
                        key={q.id}
                        className={`p-3.5 rounded-[6px] border space-y-2 text-xs font-sans ${
                          isCor
                            ? 'bg-emerald-950/15 border-emerald-500/35'
                            : 'bg-rose-950/15 border-rose-500/35'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {isCor ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            )}
                            <span className="font-mono font-bold text-amber-300">
                              Câu {idx + 1} ({q.id})
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-1.5 py-0.5 rounded">
                              {q.cognitive_level}
                            </span>
                          </div>

                          <div className="font-mono text-[11px] text-slate-300">
                            Đáp án đúng: <strong className="text-emerald-400">{q.correct_key}</strong>
                            {ans?.selectedOption && (
                              <span className="ml-2">
                                Bạn chọn: <strong className={isCor ? 'text-emerald-400' : 'text-rose-400'}>{ans.selectedOption}</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-slate-200 leading-relaxed font-medium">
                          {q.question_text}
                        </p>

                        {q.explanation && (
                          <div className="text-[11px] text-slate-300 italic pt-1 border-t border-white/5">
                            💡 {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* MODAL FOOTER */}
        {quizStage === 'RESULTS' && (
          <div className="p-3.5 sm:p-4 border-t border-theme-accent/25 bg-[#1B0D38] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setQuizStage('SETUP')}
              className="px-3.5 py-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-mono cursor-pointer transition flex items-center gap-1.5"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Thiết lập đề mới</span>
            </button>

            <div className="flex items-center gap-2 flex-wrap ml-auto">
              {resultsStats.incorrect > 0 && (
                <button
                  type="button"
                  onClick={handleRetryMistakes}
                  className="px-3.5 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-mono font-bold cursor-pointer transition flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Luyện lại {resultsStats.incorrect} câu sai</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRetakeQuiz}
                className="px-4 py-1.5 rounded bg-theme-accent hover:bg-theme-accent-hover text-slate-950 font-mono font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm lại bộ đề này</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-mono cursor-pointer transition"
              >
                Hoàn tất &amp; Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
