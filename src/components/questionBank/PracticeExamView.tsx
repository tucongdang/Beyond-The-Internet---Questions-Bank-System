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
  ListChecks
} from 'lucide-react';
import { QuestionItem, DigitalCompetencyDomainKey, CognitiveLevel } from '../../types';
import { questionBankManager } from '../../services/questionBankManager';
import { DIGITAL_COMPETENCY_DOMAINS, COGNITIVE_LEVELS } from '../../data/digitalCompetencyData';
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

interface AnswerRecord {
  questionId: string;
  selectedKey: string | null;
  isCorrect: boolean;
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

// ─── Setup Screen ───────────────────────────────────────────────────────────

const SetupScreen: React.FC<{
  config: ExamConfig;
  setConfig: React.Dispatch<React.SetStateAction<ExamConfig>>;
  availableCount: number;
  onStart: () => void;
}> = ({ config, setConfig, availableCount, onStart }) => {
  const toggleDomain = (d: DigitalCompetencyDomainKey) => {
    vibrateTap();
    setConfig(prev => ({
      ...prev,
      domains: prev.domains.includes(d)
        ? prev.domains.length > 1 ? prev.domains.filter(x => x !== d) : prev.domains
        : [...prev.domains, d]
    }));
  };

  const domainColors: Record<DigitalCompetencyDomainKey, string> = {
    MIEN_1: 'border-sky-500/40 text-sky-300',
    MIEN_2: 'border-purple-500/40 text-purple-300',
    MIEN_3: 'border-pink-500/40 text-pink-300',
    MIEN_4: 'border-rose-500/40 text-rose-300',
    MIEN_5: 'border-orange-500/40 text-orange-300',
    MIEN_6: 'border-cyan-500/40 text-cyan-300',
  };
  const domainBg: Record<DigitalCompetencyDomainKey, string> = {
    MIEN_1: 'bg-sky-500/20',
    MIEN_2: 'bg-purple-500/20',
    MIEN_3: 'bg-pink-500/20',
    MIEN_4: 'bg-rose-500/20',
    MIEN_5: 'bg-orange-500/20',
    MIEN_6: 'bg-cyan-500/20',
  };

  const canStart = availableCount >= config.questionCount;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="fluent-box p-6 rounded-[6px] border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-black/60 text-center space-y-2">
        <PlayCircle className="w-12 h-12 text-emerald-400 mx-auto" />
        <h2 className="text-xl font-black text-white">Chế Độ Thi Thử BTI 2026</h2>
        <p className="text-xs text-white/60">Luyện tập với câu hỏi thực từ ngân hàng đề — kết quả phân tích theo Miền &amp; Cấp độ Bloom</p>
      </div>

      {/* Domain Selection */}
      <div className="fluent-box p-5 rounded-[6px] border border-white/15 bg-[#190839]/40 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <Layers className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-bold text-white font-mono">Chọn Miền Năng Lực</span>
          <button
            type="button"
            onClick={() => { vibrateTap(); setConfig(prev => ({ ...prev, domains: [...ALL_DOMAINS] })); }}
            className="ml-auto text-[11px] font-mono text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/50 px-2 py-0.5 rounded border border-purple-500/30 transition cursor-pointer"
          >
            Chọn tất cả
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ALL_DOMAINS.map(d => {
            const info = DIGITAL_COMPETENCY_DOMAINS[d];
            const selected = config.domains.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDomain(d)}
                className={`p-3 rounded-[4px] border text-left transition cursor-pointer flex items-start gap-2 ${
                  selected
                    ? `${domainBg[d]} ${domainColors[d]} border-opacity-80`
                    : 'border-white/10 bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                  selected ? 'bg-emerald-500 border-emerald-400' : 'border-white/30'
                }`}>
                  {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <div className="text-[10px] font-mono font-bold">{info.code}</div>
                  <div className="text-[11px] font-sans leading-tight mt-0.5">{info.name}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Config Options */}
      <div className="fluent-box p-5 rounded-[6px] border border-white/15 bg-[#190839]/40 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <Target className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-white font-mono">Cài Đặt Bài Thi</span>
        </div>

        {/* Question count */}
        <div>
          <label className="text-[11px] font-mono text-white/60 uppercase tracking-wider block mb-2">Số câu hỏi</label>
          <div className="flex gap-2">
            {([10, 20, 30] as const).map(n => (
              <button
                key={n}
                type="button"
                onClick={() => { vibrateTap(); setConfig(prev => ({ ...prev, questionCount: n })); }}
                className={`flex-1 py-2 rounded-[4px] border text-sm font-bold font-mono transition cursor-pointer ${
                  config.questionCount === n
                    ? 'bg-purple-600 border-purple-400 text-white'
                    : 'bg-white/5 border-white/15 text-white/60 hover:bg-white/10'
                }`}
              >
                {n} câu
              </button>
            ))}
          </div>
        </div>

        {/* Time limit */}
        <div>
          <label className="text-[11px] font-mono text-white/60 uppercase tracking-wider block mb-2">Thời gian</label>
          <div className="flex gap-2">
            {([15, 30, 45] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { vibrateTap(); setConfig(prev => ({ ...prev, timeLimitMinutes: t })); }}
                className={`flex-1 py-2 rounded-[4px] border text-sm font-bold font-mono transition cursor-pointer ${
                  config.timeLimitMinutes === t
                    ? 'bg-amber-600 border-amber-400 text-white'
                    : 'bg-white/5 border-white/15 text-white/60 hover:bg-white/10'
                }`}
              >
                {t} phút
              </button>
            ))}
          </div>
        </div>

        {/* Approved only toggle */}
        <div className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-[4px] border border-white/10">
          <div>
            <div className="text-xs font-bold text-white">Chỉ câu hỏi đã duyệt (APPROVED)</div>
            <div className="text-[11px] text-white/50 mt-0.5">Lọc bỏ câu Nháp &amp; Chờ duyệt</div>
          </div>
          <button
            type="button"
            onClick={() => { vibrateTap(); setConfig(prev => ({ ...prev, approvedOnly: !prev.approvedOnly })); }}
            className={`w-12 h-6 rounded-full transition-all cursor-pointer relative ${config.approvedOnly ? 'bg-emerald-500' : 'bg-white/20'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-all ${config.approvedOnly ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Available count + Start */}
      <div className="space-y-3">
        <div className={`p-3 rounded-[4px] border text-center text-sm font-mono ${
          canStart ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300' : 'border-amber-500/30 bg-amber-950/20 text-amber-300'
        }`}>
          {canStart
            ? <><CheckCircle2 className="w-4 h-4 inline mr-1.5 -mt-0.5" />{availableCount} câu hỏi phù hợp — Sẵn sàng thi thử!</>
            : <><AlertTriangle className="w-4 h-4 inline mr-1.5 -mt-0.5" />Chỉ có {availableCount} câu hỏi — cần ít nhất {config.questionCount} câu. Giảm số câu hoặc mở rộng bộ lọc.</>
          }
        </div>

        <button
          type="button"
          disabled={!canStart}
          onClick={() => { vibrateSuccess(); soundFx.playClick(); onStart(); }}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-white/10 disabled:to-white/10 disabled:text-white/40 text-white font-black text-base rounded-[6px] transition cursor-pointer shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
        >
          <PlayCircle className="w-5 h-5" />
          Bắt Đầu Thi Thử
        </button>
      </div>
    </div>
  );
};

// ─── Exam Screen ────────────────────────────────────────────────────────────

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
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Top bar */}
      <div className="fluent-box px-4 py-3 rounded-[6px] border border-white/15 bg-[#190839]/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full font-mono font-black text-base flex items-center gap-1.5 ${
            isLowTime ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : 'bg-black/40 text-white border border-white/15'
          }`}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs font-mono text-white/60">
            Câu <span className="text-white font-bold">{currentIndex + 1}</span>/{questions.length}
          </span>
          <span className="text-xs font-mono text-amber-300">
            {answeredCount}/{questions.length} đã trả lời
          </span>
        </div>
        <button
          type="button"
          onClick={() => { vibrateTap(); setShowConfirm(true); }}
          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono rounded-[4px] transition cursor-pointer flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" />
          Huỷ bài
        </button>
      </div>

      {/* Domain badge */}
      {q.digital_competency_domain && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30">
            {DIGITAL_COMPETENCY_DOMAINS[q.digital_competency_domain]?.code} — {DIGITAL_COMPETENCY_DOMAINS[q.digital_competency_domain]?.name}
          </span>
          {q.cognitive_level && (
            <span className="text-[11px] font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
              {q.cognitive_level.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      )}

      {/* Question card */}
      <div className="fluent-box p-6 rounded-[6px] border border-white/15 bg-[#190839]/40 space-y-5">
        <p className="text-base sm:text-lg font-bold text-white leading-relaxed">{q.question_text}</p>

        {/* Options */}
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
                className={`w-full text-left p-3 rounded-[6px] border transition flex items-start gap-3 cursor-pointer ${
                  selected
                    ? 'bg-purple-600/30 border-purple-400 text-white'
                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/25'
                }`}
              >
                <span className={`w-7 h-7 rounded-[4px] flex items-center justify-center font-black text-sm shrink-0 ${
                  selected ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/60'
                }`}>
                  {key}
                </span>
                <span className="text-sm leading-relaxed pt-0.5">{q.options[key]}</span>
              </button>
            );
          })}

          {/* TRUE_FALSE_4 or TRUE_FALSE format */}
          {optionKeys.length === 0 && (q.round_type === 'TRUE_FALSE' || q.round_type === 'TRUE_FALSE_4') && (
            <>
              {['ĐÚNG', 'SAI'].map(key => {
                const selected = answers[q.id] === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { vibrateTap(); onAnswer(q.id, key); }}
                    className={`w-full text-left p-3 rounded-[6px] border transition flex items-center gap-3 cursor-pointer ${
                      selected ? 'bg-purple-600/30 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {key === 'ĐÚNG' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
                    <span className="font-bold">{key}</span>
                  </button>
                );
              })}
            </>
          )}

          {/* SHORT_ANSWER */}
          {optionKeys.length === 0 && q.round_type !== 'TRUE_FALSE' && q.round_type !== 'TRUE_FALSE_4' && (
            <input
              type="text"
              placeholder="Nhập câu trả lời ngắn..."
              value={answers[q.id] || ''}
              onChange={e => onAnswer(q.id, e.target.value)}
              className="w-full bg-black/60 border border-white/20 rounded-[4px] px-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:border-purple-400 focus:outline-none"
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => { vibrateTap(); setCurrentIndex(i => i - 1); }}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-30 text-white rounded-[4px] text-sm font-mono transition cursor-pointer flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" /> Câu trước
        </button>

        {/* Dot indicators */}
        <div className="flex flex-wrap justify-center gap-1.5 max-w-xs">
          {questions.slice(0, 20).map((qq, i) => {
            const answered = answers[qq.id] !== null && answers[qq.id] !== undefined;
            return (
              <button
                key={qq.id}
                type="button"
                onClick={() => { vibrateTap(); setCurrentIndex(i); }}
                className={`w-6 h-6 rounded-[3px] text-[10px] font-mono font-bold transition cursor-pointer ${
                  i === currentIndex
                    ? 'bg-purple-500 text-white'
                    : answered
                      ? 'bg-emerald-600/60 text-white'
                      : 'bg-white/10 text-white/50 hover:bg-white/20'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
          {questions.length > 20 && (
            <span className="text-[10px] text-white/40 font-mono self-center">+{questions.length - 20}</span>
          )}
        </div>

        {currentIndex < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => { vibrateTap(); setCurrentIndex(i => i + 1); }}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-[4px] text-sm font-mono transition cursor-pointer flex items-center gap-1.5"
          >
            Câu sau <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { vibrateTap(); setShowConfirm(true); }}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-[4px] text-sm font-bold font-mono transition cursor-pointer flex items-center gap-1.5"
          >
            <ListChecks className="w-4 h-4" /> Nộp Bài
          </button>
        )}
      </div>

      {/* Submit confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#170933] border border-white/20 rounded-[8px] p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="text-center">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
              <h3 className="text-base font-black text-white">Xác nhận nộp bài?</h3>
              {unanswered > 0 && (
                <p className="text-sm text-amber-300 mt-1">
                  Còn <strong>{unanswered}</strong> câu chưa trả lời.
                </p>
              )}
              <p className="text-xs text-white/60 mt-1">Thời gian còn lại: <strong>{formatTime(timeLeft)}</strong></p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { vibrateTap(); setShowConfirm(false); }}
                className="flex-1 py-2 border border-white/20 text-white/70 hover:text-white rounded-[4px] text-sm font-mono transition cursor-pointer"
              >
                Tiếp tục làm
              </button>
              <button
                type="button"
                onClick={() => { vibrateSuccess(); setShowConfirm(false); onSubmit(timeLeft); }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-[4px] text-sm font-mono transition cursor-pointer"
              >
                Nộp bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Abandon confirm */}
      {showConfirm === false && false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button type="button" onClick={onAbandon}>Huỷ</button>
        </div>
      )}
    </div>
  );
};

// ─── Results Screen ─────────────────────────────────────────────────────────

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
  const scoreBg = accuracy >= 70 ? 'border-emerald-500/30 bg-emerald-950/20' : accuracy >= 50 ? 'border-amber-500/30 bg-amber-950/20' : 'border-rose-500/30 bg-rose-950/20';

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
    NHAN_BIET: 'Nhận biết',
    THONG_HIEU: 'Thông hiểu',
    VAN_DUNG: 'Vận dụng',
    VAN_DUNG_CAO: 'Vận dụng cao',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Score header */}
      <div className={`fluent-box p-6 rounded-[6px] border ${scoreBg} text-center space-y-3`}>
        <Trophy className={`w-12 h-12 mx-auto ${scoreColor}`} />
        <div>
          <div className={`text-5xl font-black tabular-nums ${scoreColor}`}>{correct}/{total}</div>
          <div className="text-white/60 text-sm mt-1 font-mono">câu đúng • {accuracy}% chính xác</div>
        </div>
        <div className="flex justify-center gap-6 text-xs font-mono text-white/60 pt-2 border-t border-white/10">
          <span><Clock className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-amber-400" />Thời gian: <strong className="text-white">{formatTime(timeTakenSeconds)}</strong></span>
          <span><Target className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-sky-400" />{config.domains.length} miền</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Domain breakdown */}
        <div className="fluent-box p-4 rounded-[6px] border border-white/15 bg-[#190839]/40 space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-white/10">
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-white font-mono">Theo Miền Năng Lực</span>
          </div>
          {domainStats.map(({ d, total: dt, correct: dc }) => {
            const pct = dt > 0 ? Math.round((dc / dt) * 100) : 0;
            return (
              <div key={d} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/70 font-sans">{DIGITAL_COMPETENCY_DOMAINS[d].code}</span>
                  <span className={`font-mono font-bold ${pct >= 70 ? 'text-emerald-300' : pct >= 50 ? 'text-amber-300' : 'text-rose-300'}`}>
                    {dc}/{dt} ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full">
                  <div className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Cognitive breakdown */}
        <div className="fluent-box p-4 rounded-[6px] border border-white/15 bg-[#190839]/40 space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-white/10">
            <Brain className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white font-mono">Theo Cấp Độ Bloom</span>
          </div>
          {cogStats.map(({ l, total: ct, correct: cc }) => {
            const pct = ct > 0 ? Math.round((cc / ct) * 100) : 0;
            return (
              <div key={l} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/70 font-sans">{cogLabels[l]}</span>
                  <span className={`font-mono font-bold ${pct >= 70 ? 'text-emerald-300' : pct >= 50 ? 'text-amber-300' : 'text-rose-300'}`}>
                    {cc}/{ct} ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full">
                  <div className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => { vibrateSuccess(); onRetry(); }}
          className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold font-mono rounded-[6px] transition cursor-pointer flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Thi Lại
        </button>
        <button
          type="button"
          onClick={() => { vibrateTap(); setShowReview(v => !v); }}
          className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white font-mono rounded-[6px] transition cursor-pointer flex items-center justify-center gap-2 border border-white/15"
        >
          <BookOpen className="w-4 h-4" /> {showReview ? 'Ẩn' : 'Xem'} Đáp Án
        </button>
        {onClose && (
          <button
            type="button"
            onClick={() => { vibrateTap(); onClose(); }}
            className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-mono rounded-[6px] transition cursor-pointer border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Question review list */}
      {showReview && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white font-mono">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Xem Lại Từng Câu
          </div>
          {results.map(({ q, selected, isCorrect }, idx) => (
            <div
              key={q.id}
              className={`p-4 rounded-[6px] border space-y-2 ${isCorrect ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-rose-500/30 bg-rose-950/10'}`}
            >
              <div className="flex items-start gap-2">
                <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                  {isCorrect ? '✓' : '✗'}
                </span>
                <p className="text-sm text-white font-sans leading-relaxed">{idx + 1}. {q.question_text}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono pl-8">
                {selected && (
                  <span className={`px-2 py-0.5 rounded border ${isCorrect ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'}`}>
                    Bạn chọn: {selected}
                  </span>
                )}
                {!isCorrect && (
                  <span className="px-2 py-0.5 rounded border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                    Đáp án: {q.correct_key}
                  </span>
                )}
                {!selected && (
                  <span className="px-2 py-0.5 rounded border bg-white/10 text-white/50 border-white/15">Bỏ trống</span>
                )}
              </div>
              {q.explanation && (
                <div className="pl-8 text-[11px] text-white/60 font-sans leading-relaxed border-t border-white/5 pt-2">
                  <strong className="text-white/80">Giải thích:</strong> {q.explanation}
                </div>
              )}
              {q.legal_reference && (
                <div className="pl-8 text-[10.5px] text-amber-300/70 font-mono">
                  📖 {q.legal_reference}
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
      // Only questions with options or short answer
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
    <div className="min-h-[600px] py-4">
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
