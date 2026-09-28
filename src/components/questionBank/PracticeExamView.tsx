import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  PlayCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Trophy,
  Target,
  Brain,
  Layers,
  ShieldCheck,
  X,
  AlertTriangle,
  BookOpen,
  Sparkles,
  ListChecks,
  Check
} from 'lucide-react';
import { QuestionItem, DigitalCompetencyDomainKey, CognitiveLevel } from '../../types';
import { questionBankManager } from '../../services/questionBankManager';
import { DIGITAL_COMPETENCY_DOMAINS } from '../../data/digitalCompetencyData';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateWarning } from '../../utils/hapticUtils';

// ─── Types ─────────────────────────────────────────────────────────────────

type ExamScreen = 'SETUP' | 'EXAM' | 'RESULTS';

interface ExamConfig {
  domains: DigitalCompetencyDomainKey[];
  questionCount: 10 | 20 | 30;
  timeLimitMinutes: 15 | 30 | 45;
  approvedOnly: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const ALL_DOMAINS: DigitalCompetencyDomainKey[] = ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'];

// ─── Props ──────────────────────────────────────────────────────────────────

interface PracticeExamViewProps {
  onClose?: () => void;
}

// ─── Setup Screen (Fluent UI v2) ───────────────────────────────────────────

const SetupScreen: React.FC<{
  config: ExamConfig;
  setConfig: React.Dispatch<React.SetStateAction<ExamConfig>>;
  availableCount: number;
  onStart: () => void;
}> = ({ config, setConfig, availableCount, onStart }) => {
  const toggleDomain = (d: DigitalCompetencyDomainKey) => {
    vibrateTap();
    soundFx.playClick();
    setConfig(prev => ({
      ...prev,
      domains: prev.domains.includes(d)
        ? prev.domains.length > 1 ? prev.domains.filter(x => x !== d) : prev.domains
        : [...prev.domains, d]
    }));
  };

  const domainAccentColors: Record<DigitalCompetencyDomainKey, { border: string; text: string; bg: string }> = {
    MIEN_1: { border: 'border-sky-500/40', text: 'text-sky-300', bg: 'bg-sky-500/15' },
    MIEN_2: { border: 'border-purple-500/40', text: 'text-purple-300', bg: 'bg-purple-500/15' },
    MIEN_3: { border: 'border-pink-500/40', text: 'text-pink-300', bg: 'bg-pink-500/15' },
    MIEN_4: { border: 'border-rose-500/40', text: 'text-rose-300', bg: 'bg-rose-500/15' },
    MIEN_5: { border: 'border-orange-500/40', text: 'text-orange-300', bg: 'bg-orange-500/15' },
    MIEN_6: { border: 'border-cyan-500/40', text: 'text-cyan-300', bg: 'bg-cyan-500/15' },
  };

  const canStart = availableCount >= config.questionCount;

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fadeIn">
      {/* Header Banner - Fluent 2 Mica Card */}
      <div className="fluent-box p-6 rounded-[8px] relative overflow-hidden text-center space-y-2.5">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto text-emerald-300 shadow-lg shadow-emerald-950/40">
          <PlayCircle className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10.5px] font-mono font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Môi Trường Luyện Tập Chuẩn BTI 2026</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Chế Độ Thi Thử Năng Lực Số</h2>
          <p className="text-xs text-white/60 max-w-lg mx-auto font-sans">
            Đánh giá toàn diện 6 Miền năng lực theo Thông tư 02/2025/TT-BGDĐT. Trích xuất câu hỏi ngẫu nhiên từ ngân hàng đã thẩm định.
          </p>
        </div>
      </div>

      {/* Domain Selection - Fluent 2 Interactive Cards */}
      <div className="fluent-box p-5 rounded-[8px] space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wide">
              1. Chọn Miền Năng Lực Số ({config.domains.length}/6)
            </span>
          </div>
          <button
            type="button"
            onClick={() => { 
              vibrateTap(); 
              soundFx.playClick();
              setConfig(prev => ({ ...prev, domains: [...ALL_DOMAINS] })); 
            }}
            className="text-[11px] font-mono text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/60 px-2.5 py-1 rounded-[4px] border border-purple-500/30 transition cursor-pointer"
          >
            Chọn tất cả
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {ALL_DOMAINS.map(d => {
            const info = DIGITAL_COMPETENCY_DOMAINS[d];
            const selected = config.domains.includes(d);
            const palette = domainAccentColors[d];
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDomain(d)}
                className={`p-3 rounded-[6px] border text-left transition-all duration-200 cursor-pointer flex items-start gap-2.5 relative overflow-hidden select-none active:scale-[0.985] ${
                  selected
                    ? `${palette.bg} ${palette.border} text-white shadow-md ring-1 ring-white/10`
                    : 'bg-black/30 border-white/10 text-white/50 hover:bg-white/5 hover:border-white/20'
                }`}
              >
                <div className={`w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  selected ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-white/30 bg-black/40'
                }`}>
                  {selected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div className="min-w-0">
                  <div className={`text-[10.5px] font-mono font-bold tracking-tight ${selected ? palette.text : 'text-white/60'}`}>
                    {info.code}
                  </div>
                  <div className="text-xs font-sans leading-snug line-clamp-1 mt-0.5 text-white/90">
                    {info.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Config Options - Fluent 2 Segmented Controls */}
      <div className="fluent-box p-5 rounded-[8px] space-y-4">
        <div className="flex items-center gap-2 pb-2.5 border-b border-white/10">
          <Target className="w-4 h-4 text-amber-400" />
          <span className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wide">
            2. Thiết Lập Bài Thi
          </span>
        </div>

        {/* Question count */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-white/70 uppercase tracking-wider block">
            Quy mô bộ đề
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([10, 20, 30] as const).map(n => (
              <button
                key={n}
                type="button"
                onClick={() => { 
                  vibrateTap(); 
                  soundFx.playClick();
                  setConfig(prev => ({ ...prev, questionCount: n })); 
                }}
                className={`py-2 rounded-[4px] border text-xs font-bold font-mono transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                  config.questionCount === n
                    ? 'fluent-btn-primary shadow-md'
                    : 'fluent-btn-secondary'
                }`}
              >
                <span>{n} câu hỏi</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time limit */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-white/70 uppercase tracking-wider block">
            Thời lượng làm bài
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([15, 30, 45] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { 
                  vibrateTap(); 
                  soundFx.playClick();
                  setConfig(prev => ({ ...prev, timeLimitMinutes: t })); 
                }}
                className={`py-2 rounded-[4px] border text-xs font-bold font-mono transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                  config.timeLimitMinutes === t
                    ? 'fluent-btn-primary shadow-md'
                    : 'fluent-btn-secondary'
                }`}
              >
                <Clock className="w-3.5 h-3.5 opacity-80" />
                <span>{t} phút</span>
              </button>
            ))}
          </div>
        </div>

        {/* Approved only toggle switch */}
        <div className="flex items-center justify-between p-3 rounded-[6px] bg-black/40 border border-white/10">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-white font-sans">Chỉ dùng câu hỏi đã duyệt (APPROVED)</div>
              <div className="text-[11px] text-white/50 font-sans">Loại bỏ các câu nháp hoặc đang chờ hội đồng thẩm định</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { 
              vibrateTap(); 
              soundFx.playClick();
              setConfig(prev => ({ ...prev, approvedOnly: !prev.approvedOnly })); 
            }}
            className={`w-11 h-6 rounded-full transition-all duration-200 cursor-pointer relative shrink-0 ${
              config.approvedOnly ? 'bg-emerald-500 shadow-inner' : 'bg-white/20'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform duration-200 ${
              config.approvedOnly ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>

      {/* Available count info + Action */}
      <div className="space-y-3">
        <div className={`p-3 rounded-[6px] border text-center text-xs font-mono transition-colors ${
          canStart 
            ? 'border-emerald-500/30 bg-emerald-950/25 text-emerald-300' 
            : 'border-amber-500/30 bg-amber-950/25 text-amber-300'
        }`}>
          {canStart ? (
            <span className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Ngân hàng có <strong>{availableCount}</strong> câu thỏa mãn bộ lọc. Đủ điều kiện khởi tạo bộ đề!</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Chỉ có <strong>{availableCount}</strong> câu phù hợp (cần tối thiểu {config.questionCount} câu). Vui lòng chọn thêm Miền hoặc tắt bộ lọc duyệt.</span>
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={!canStart}
          onClick={() => { 
            vibrateSuccess(); 
            soundFx.playClick(); 
            onStart(); 
          }}
          className="fluent-btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
        >
          <PlayCircle className="w-5 h-5 text-[#190839]" />
          <span>Bắt Đầu Làm Bài Thi Thử</span>
        </button>
      </div>
    </div>
  );
};

// ─── Exam Screen (Fluent UI v2) ─────────────────────────────────────────────

const ExamScreen: React.FC<{
  questions: QuestionItem[];
  timeLimitSeconds: number;
  answers: Record<string, string | null>;
  onAnswer: (qId: string, key: string) => void;
  onSubmit: (timeLeft: number) => void;
  onAbandon: () => void;
}> = ({ questions, timeLimitSeconds, answers, onAnswer, onSubmit, onAbandon }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const [showConfirm, setShowConfirm] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onSubmit(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [onSubmit]);

  const q = questions[currentIndex];
  const answeredCount = Object.values(answers).filter(v => v !== null).length;
  const unanswered = questions.length - answeredCount;
  const isLowTime = timeLeft < 120;
  const optionKeys = q.options ? Object.keys(q.options) : [];

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fadeIn">
      {/* Top Command Bar - Fluent 2 Acrylic Header */}
      <div className="fluent-box px-4 py-2.5 rounded-[8px] flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          {/* Countdown Clock */}
          <div className={`px-3 py-1 rounded-[4px] font-mono font-bold text-sm flex items-center gap-1.5 transition-colors ${
            isLowTime 
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
              : 'bg-black/50 text-white border border-white/15'
          }`}>
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <div className="text-xs font-mono text-white/70">
            Câu <strong className="text-white font-bold">{currentIndex + 1}</strong> / {questions.length}
          </div>

          <div className="hidden sm:inline-flex text-xs font-mono text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded-[4px] border border-emerald-500/30">
            {answeredCount}/{questions.length} đã chọn
          </div>
        </div>

        <button
          type="button"
          onClick={() => { vibrateTap(); setShowConfirm(true); }}
          className="fluent-btn-secondary px-3 py-1.5 text-xs text-rose-300 hover:text-white border-rose-500/30 hover:bg-rose-600/30 cursor-pointer flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          <span>Hủy Bài</span>
        </button>
      </div>

      {/* Domain & Cognitive Level Metadata Pills */}
      {q.digital_competency_domain && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-purple-300 bg-purple-950/40 px-2.5 py-0.5 rounded-[4px] border border-purple-500/30">
            {DIGITAL_COMPETENCY_DOMAINS[q.digital_competency_domain]?.code} — {DIGITAL_COMPETENCY_DOMAINS[q.digital_competency_domain]?.name}
          </span>
          {q.cognitive_level && (
            <span className="text-[11px] font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-[4px] border border-amber-500/30">
              {q.cognitive_level.replace(/_/g, ' ')}
            </span>
          )}
          {q.round_name && (
            <span className="text-[11px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded-[4px] border border-white/10">
              {q.round_name}
            </span>
          )}
        </div>
      )}

      {/* Main Question Card - Fluent 2 Question Surface */}
      <div className="fluent-question-box p-6 rounded-[8px] space-y-5">
        <p className="text-base sm:text-lg font-bold text-white leading-relaxed font-sans">
          {q.question_text}
        </p>

        {/* Options Grid */}
        <div className="space-y-2.5">
          {optionKeys.map(key => {
            const selected = answers[q.id] === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onAnswer(q.id, key);
                }}
                className={`fluent-option-btn w-full text-left p-3.5 rounded-[6px] flex items-start gap-3.5 cursor-pointer ${
                  selected ? 'selected' : ''
                }`}
              >
                <span className={`fluent-option-badge w-7 h-7 rounded-[4px] flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                  selected ? 'bg-theme-accent text-[#190839]' : 'text-white/80'
                }`}>
                  {key}
                </span>
                <span className="text-sm font-sans leading-relaxed pt-0.5 text-white/95">
                  {q.options[key]}
                </span>
              </button>
            );
          })}

          {/* True / False binary choices */}
          {optionKeys.length === 0 && (q.round_type === 'TRUE_FALSE' || q.round_type === 'TRUE_FALSE_4') && (
            <div className="grid grid-cols-2 gap-3">
              {['ĐÚNG', 'SAI'].map(key => {
                const selected = answers[q.id] === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { 
                      vibrateTap(); 
                      soundFx.playClick();
                      onAnswer(q.id, key); 
                    }}
                    className={`fluent-option-btn p-4 rounded-[6px] flex items-center justify-center gap-2 cursor-pointer font-bold ${
                      selected ? 'selected text-white' : 'text-white/80'
                    }`}
                  >
                    {key === 'ĐÚNG' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
                    <span>{key}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Short answer input */}
          {optionKeys.length === 0 && q.round_type !== 'TRUE_FALSE' && q.round_type !== 'TRUE_FALSE_4' && (
            <input
              type="text"
              placeholder="Nhập câu trả lời của bạn..."
              value={answers[q.id] || ''}
              onChange={e => onAnswer(q.id, e.target.value)}
              className="fluent-input w-full bg-black/60 border border-white/20 rounded-[4px] px-4 py-3 text-sm text-white placeholder-white/40 focus:border-theme-accent focus:outline-none font-mono"
            />
          )}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => { 
            vibrateTap(); 
            soundFx.playClick();
            setCurrentIndex(i => i - 1); 
          }}
          className="fluent-btn-secondary px-4 py-2 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Câu Trước</span>
        </button>

        {/* Question Selector Dots (Max 15 visible at a time) */}
        <div className="flex flex-wrap justify-center gap-1 max-w-sm">
          {questions.slice(0, 20).map((item, idx) => {
            const answered = answers[item.id] !== null && answers[item.id] !== undefined;
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => { 
                  vibrateTap(); 
                  soundFx.playClick();
                  setCurrentIndex(idx); 
                }}
                className={`w-6 h-6 rounded-[3px] text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? 'fluent-btn-primary ring-2 ring-white/50'
                    : answered
                      ? 'bg-emerald-600/70 text-white hover:bg-emerald-600'
                      : 'bg-white/10 text-white/50 hover:bg-white/20'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
          {questions.length > 20 && (
            <span className="text-[10px] text-white/40 font-mono self-center px-1">+{questions.length - 20}</span>
          )}
        </div>

        {currentIndex < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => { 
              vibrateTap(); 
              soundFx.playClick();
              setCurrentIndex(i => i + 1); 
            }}
            className="fluent-btn-secondary px-4 py-2 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <span>Câu Sau</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { 
              vibrateTap(); 
              setShowConfirm(true); 
            }}
            className="fluent-btn-primary px-4 py-2 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <ListChecks className="w-4 h-4 text-[#190839]" />
            <span>Nộp Bài</span>
          </button>
        )}
      </div>

      {/* Submit Confirmation Dialog - Fluent 2 Overlay */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="fluent-box p-6 rounded-[8px] max-w-sm w-full space-y-4 shadow-2xl border border-white/20">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-base font-black text-white">Xác nhận nộp bài?</h3>
              {unanswered > 0 ? (
                <p className="text-xs text-amber-300 font-sans">
                  Bạn còn <strong>{unanswered}</strong> câu chưa điền đáp án.
                </p>
              ) : (
                <p className="text-xs text-emerald-300 font-sans">
                  Bạn đã hoàn thành toàn bộ <strong>{questions.length}</strong> câu hỏi!
                </p>
              )}
              <div className="text-[11px] text-white/50 font-mono">
                Thời gian còn lại: <strong className="text-white">{formatTime(timeLeft)}</strong>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => { vibrateTap(); setShowConfirm(false); }}
                className="fluent-btn-secondary flex-1 py-2 text-xs font-mono cursor-pointer"
              >
                Tiếp tục làm
              </button>
              <button
                type="button"
                onClick={() => { 
                  vibrateSuccess(); 
                  setShowConfirm(false); 
                  onSubmit(timeLeft); 
                }}
                className="fluent-btn-primary flex-1 py-2 text-xs font-mono font-bold cursor-pointer"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Results Screen (Fluent UI v2) ─────────────────────────────────────────

const ResultsScreen: React.FC<{
  questions: QuestionItem[];
  answers: Record<string, string | null>;
  timeTakenSeconds: number;
  config: ExamConfig;
  onRetry: () => void;
  onClose?: () => void;
}> = ({ questions, answers, timeTakenSeconds, config, onRetry, onClose }) => {
  const [showReview, setShowReview] = useState(false);

  const results = useMemo(() => {
    return questions.map(q => {
      const selected = answers[q.id] || null;
      let isCorrect = false;
      if (selected) {
        isCorrect = selected.trim().toUpperCase() === q.correct_key.trim().toUpperCase();
      }
      return { q, selected, isCorrect };
    });
  }, [questions, answers]);

  const correct = results.filter(r => r.isCorrect).length;
  const total = questions.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const scoreColor = accuracy >= 70 ? 'text-emerald-300' : accuracy >= 50 ? 'text-amber-300' : 'text-rose-300';
  const scoreBorder = accuracy >= 70 ? 'border-emerald-500/40 bg-emerald-950/20' : accuracy >= 50 ? 'border-amber-500/40 bg-amber-950/20' : 'border-rose-500/40 bg-rose-950/20';

  // Domain breakdown
  const domainStats = ALL_DOMAINS.map(d => {
    const subset = results.filter(r => r.q.digital_competency_domain === d);
    const domainCorrect = subset.filter(r => r.isCorrect).length;
    return { d, total: subset.length, correct: domainCorrect };
  }).filter(x => x.total > 0);

  // Cognitive breakdown
  const cogStats = (['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'] as CognitiveLevel[]).map(l => {
    const subset = results.filter(r => r.q.cognitive_level === l);
    const cogCorrect = subset.filter(r => r.isCorrect).length;
    return { l, total: subset.length, correct: cogCorrect };
  }).filter(x => x.total > 0);

  const cogLabels: Record<CognitiveLevel, string> = {
    NHAN_BIET: 'Nhận biết (Level 1)',
    THONG_HIEU: 'Thông hiểu (Level 2)',
    VAN_DUNG: 'Vận dụng (Level 3)',
    VAN_DUNG_CAO: 'Vận dụng cao (Level 4)',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fadeIn">
      {/* Score Header - Fluent 2 Trophy Card */}
      <div className={`fluent-box p-6 rounded-[8px] text-center space-y-3 ${scoreBorder}`}>
        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto shadow-inner">
          <Trophy className={`w-8 h-8 ${scoreColor}`} />
        </div>
        <div>
          <div className={`text-5xl font-black tabular-nums tracking-tight ${scoreColor}`}>
            {correct}/{total}
          </div>
          <div className="text-white/70 text-xs mt-1 font-mono uppercase tracking-wider">
            {accuracy}% Chính Xác • {accuracy >= 70 ? 'ĐẠT CHUẨN NĂNG LỰC SỐ' : accuracy >= 50 ? 'MỨC TRUNG BÌNH' : 'CẦN CẢI THIỆN THÊM'}
          </div>
        </div>

        <div className="flex justify-center gap-6 text-xs font-mono text-white/60 pt-3 border-t border-white/10">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Thời gian: <strong className="text-white">{formatTime(timeTakenSeconds)}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-sky-400" />
            <span>Độ phủ: <strong className="text-white">{config.domains.length} miền</strong></span>
          </span>
        </div>
      </div>

      {/* Analytics Breakdown Grid - Fluent 2 Nested Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Domain breakdown */}
        <div className="fluent-box-nested p-4 rounded-[8px] space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wide">
              Theo Miền Năng Lực
            </span>
          </div>

          <div className="space-y-2.5">
            {domainStats.map(({ d, total: dt, correct: dc }) => {
              const pct = dt > 0 ? Math.round((dc / dt) * 100) : 0;
              return (
                <div key={d} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/80 font-sans">{DIGITAL_COMPETENCY_DOMAINS[d].code}</span>
                    <span className={`font-mono font-bold ${pct >= 70 ? 'text-emerald-300' : pct >= 50 ? 'text-amber-300' : 'text-rose-300'}`}>
                      {dc}/{dt} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cognitive level breakdown */}
        <div className="fluent-box-nested p-4 rounded-[8px] space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Brain className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white font-mono uppercase tracking-wide">
              Theo Cấp Độ Nhận Thức
            </span>
          </div>

          <div className="space-y-2.5">
            {cogStats.map(({ l, total: ct, correct: cc }) => {
              const pct = ct > 0 ? Math.round((cc / ct) * 100) : 0;
              return (
                <div key={l} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/80 font-sans">{cogLabels[l]}</span>
                    <span className={`font-mono font-bold ${pct >= 70 ? 'text-emerald-300' : pct >= 50 ? 'text-amber-300' : 'text-rose-300'}`}>
                      {cc}/{ct} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => { vibrateSuccess(); onRetry(); }}
          className="fluent-btn-primary flex-1 py-2.5 text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <RotateCcw className="w-4 h-4 text-[#190839]" />
          <span>Luyện Tập Lại</span>
        </button>

        <button
          type="button"
          onClick={() => { vibrateTap(); setShowReview(v => !v); }}
          className="fluent-btn-secondary flex-1 py-2.5 text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-amber-300" />
          <span>{showReview ? 'Ẩn Đáp Án Chi Tiết' : 'Xem Lại Đáp Án'}</span>
        </button>

        {onClose && (
          <button
            type="button"
            onClick={() => { vibrateTap(); onClose(); }}
            className="fluent-btn-secondary px-3.5 py-2.5 text-xs font-mono cursor-pointer"
            title="Đóng chế độ thi thử"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Question Review Accordion */}
      {showReview && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white font-mono uppercase tracking-wider pb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Đối Chiếu Kết Quả Từng Câu</span>
          </div>

          {results.map(({ q, selected, isCorrect }, idx) => (
            <div
              key={q.id}
              className={`fluent-box-nested p-4 rounded-[8px] space-y-2.5 border transition-all ${
                isCorrect 
                  ? 'border-emerald-500/40 bg-emerald-950/15' 
                  : 'border-rose-500/40 bg-rose-950/15'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className={`shrink-0 w-6 h-6 rounded-[4px] flex items-center justify-center text-xs font-mono font-black ${
                  isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                }`}>
                  {isCorrect ? '✓' : '✗'}
                </span>
                <p className="text-xs sm:text-sm font-sans font-semibold text-white leading-relaxed">
                  #{idx + 1}. {q.question_text}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-mono pl-8">
                {selected && (
                  <span className={`px-2 py-0.5 rounded-[4px] border ${
                    isCorrect 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    Bạn chọn: <strong>{selected}</strong>
                  </span>
                )}
                {!isCorrect && (
                  <span className="px-2 py-0.5 rounded-[4px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Đáp án đúng: <strong>{q.correct_key}</strong>
                  </span>
                )}
                {!selected && (
                  <span className="px-2 py-0.5 rounded-[4px] bg-white/10 text-white/50 border border-white/15">
                    Chưa trả lời
                  </span>
                )}
              </div>

              {q.explanation && (
                <div className="pl-8 text-xs text-white/70 font-sans leading-relaxed border-t border-white/5 pt-2">
                  <strong className="text-white/90">Giải thích sư phạm:</strong> {q.explanation}
                </div>
              )}

              {q.legal_reference && (
                <div className="pl-8 text-[11px] text-amber-300/80 font-mono flex items-center gap-1.5">
                  <span>📖 Căn cứ pháp lý:</span>
                  <strong className="text-amber-200">{q.legal_reference}</strong>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const PracticeExamView: React.FC<PracticeExamViewProps> = ({ onClose }) => {
  const [screen, setScreen] = useState<ExamScreen>('SETUP');
  const [config, setConfig] = useState<ExamConfig>({
    domains: [...ALL_DOMAINS],
    questionCount: 20,
    timeLimitMinutes: 30,
    approvedOnly: true
  });
  const [examQuestions, setExamQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [timeTaken, setTimeTaken] = useState(0);

  const allQuestions = useMemo(() => questionBankManager.getQuestions(), []);

  const filteredPool = useMemo(() => {
    return allQuestions.filter(q => {
      if (config.approvedOnly && q.approval_status !== 'APPROVED') return false;
      if (config.domains.length > 0 && q.digital_competency_domain && !config.domains.includes(q.digital_competency_domain)) return false;
      return true;
    });
  }, [allQuestions, config.approvedOnly, config.domains]);

  const handleStart = useCallback(() => {
    const shuffled = shuffleArray(filteredPool).slice(0, config.questionCount);
    const initialAnswers: Record<string, string | null> = {};
    shuffled.forEach(q => { initialAnswers[q.id] = null; });
    setExamQuestions(shuffled);
    setAnswers(initialAnswers);
    setScreen('EXAM');
  }, [filteredPool, config.questionCount]);

  const handleAnswer = useCallback((qId: string, key: string) => {
    setAnswers(prev => ({ ...prev, [qId]: key }));
  }, []);

  const handleSubmit = useCallback((timeLeft: number) => {
    vibrateSuccess();
    soundFx.playClick();
    setTimeTaken(config.timeLimitMinutes * 60 - timeLeft);
    setScreen('RESULTS');
  }, [config.timeLimitMinutes]);

  const handleRetry = useCallback(() => {
    setScreen('SETUP');
    setExamQuestions([]);
    setAnswers({});
    setTimeTaken(0);
  }, []);

  return (
    <div className="min-h-[600px] py-2">
      {screen === 'SETUP' && (
        <SetupScreen
          config={config}
          setConfig={setConfig}
          availableCount={filteredPool.length}
          onStart={handleStart}
        />
      )}

      {screen === 'EXAM' && (
        <ExamScreen
          questions={examQuestions}
          timeLimitSeconds={config.timeLimitMinutes * 60}
          answers={answers}
          onAnswer={handleAnswer}
          onSubmit={handleSubmit}
          onAbandon={handleRetry}
        />
      )}

      {screen === 'RESULTS' && (
        <ResultsScreen
          questions={examQuestions}
          answers={answers}
          timeTakenSeconds={timeTaken}
          config={config}
          onRetry={handleRetry}
          onClose={onClose}
        />
      )}
    </div>
  );
};
