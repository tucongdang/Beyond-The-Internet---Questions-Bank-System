import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  X,
  CheckCircle2,
  Download,
  Printer,
  FileSpreadsheet,
  Layers,
  Clock,
  Award,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  FileText,
  Sliders,
  Target,
  Zap,
  PlayCircle,
  Eye,
  EyeOff,
  RotateCcw,
  BookOpen,
  Check,
  SlidersHorizontal,
  Flame,
  ArrowRight,
  HelpCircle,
  Info
} from 'lucide-react';
import {
  QuestionItem,
  CompetitionStage,
  CognitiveLevel,
  DigitalCompetencyDomainKey,
  GeneratedExam
} from '../../types';
import {
  COMPETITION_STAGES,
  DIGITAL_COMPETENCY_DOMAINS
} from '../../data/digitalCompetencyData';
import { questionBankManager } from '../../services/questionBankManager';
import {
  MOCK_QUIZ_PRESETS,
  MockQuizPresetKey,
  AiGeneratedMockQuiz,
  generateBalancedMockQuizWithAI,
  generateBalancedMockQuizHeuristic,
  findAlternativeQuestions
} from '../../services/aiQuizGeneratorService';
import { excelService } from '../../services/excelService';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateWarning } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface AiMockQuizGeneratorModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onExamCreated?: (exam: GeneratedExam) => void;
}

export const AiMockQuizGeneratorModal: React.FC<AiMockQuizGeneratorModalProps> = ({
  isOpen = true,
  onClose,
  onExamCreated
}) => {
  useLockBodyScroll(true);

  // Configuration States
  const [selectedPreset, setSelectedPreset] = useState<MockQuizPresetKey>('STANDARD_BGD_28');
  const [examTitle, setExamTitle] = useState<string>('');
  const [totalQuestions, setTotalQuestions] = useState<number>(28);
  const [timeMinutes, setTimeMinutes] = useState<number>(45);
  const [stage, setStage] = useState<CompetitionStage>('VONG_LOAI');
  const [onlyApproved, setOnlyApproved] = useState<boolean>(true);

  // Cognitive distribution weights
  const [distNhanBiet, setDistNhanBiet] = useState<number>(40);
  const [distThongHieu, setDistThongHieu] = useState<number>(30);
  const [distVanDung, setDistVanDung] = useState<number>(20);
  const [distVanDungCao, setDistVanDungCao] = useState<number>(10);

  const [selectedDomains, setSelectedDomains] = useState<DigitalCompetencyDomainKey[]>([
    'MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'
  ]);

  // Generation & Interactive View States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [progressPct, setProgressPct] = useState<number>(0);
  const [generatedQuiz, setGeneratedQuiz] = useState<AiGeneratedMockQuiz | null>(null);
  const [showAnswerKeys, setShowAnswerKeys] = useState<boolean>(false);
  const [swappingQuestionIndex, setSwappingQuestionIndex] = useState<number | null>(null);

  // Interactive Test Simulator Mode States
  const [isTestModeActive, setIsTestModeActive] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isTestSubmitted, setIsTestSubmitted] = useState<boolean>(false);
  const [testTimeLeft, setTestTimeLeft] = useState<number>(0);

  const totalPercentage = distNhanBiet + distThongHieu + distVanDung + distVanDungCao;

  // Question bank statistics for reference
  const bankStats = useMemo(() => {
    const all = questionBankManager.getQuestions();
    const approved = all.filter(q => q.approval_status === 'APPROVED');
    return {
      total: all.length,
      approved: approved.length,
      nhanBiet: all.filter(q => q.cognitive_level === 'NHAN_BIET').length,
      thongHieu: all.filter(q => q.cognitive_level === 'THONG_HIEU').length,
      vanDung: all.filter(q => q.cognitive_level === 'VAN_DUNG').length,
      vanDungCao: all.filter(q => q.cognitive_level === 'VAN_DUNG_CAO').length
    };
  }, []);

  // Handle preset selection
  const handleSelectPreset = (key: MockQuizPresetKey) => {
    vibrateTap();
    soundFx.playClick();
    setSelectedPreset(key);

    const preset = MOCK_QUIZ_PRESETS[key];
    setTotalQuestions(preset.defaultQuestionsCount);
    setTimeMinutes(preset.defaultTimeMinutes);
    setStage(preset.defaultStage);
    setDistNhanBiet(preset.difficultyDistribution.NHAN_BIET);
    setDistThongHieu(preset.difficultyDistribution.THONG_HIEU);
    setDistVanDung(preset.difficultyDistribution.VAN_DUNG);
    setDistVanDungCao(preset.difficultyDistribution.VAN_DUNG_CAO);
    setSelectedDomains(preset.recommendedDomains);
  };

  const toggleDomain = (key: DigitalCompetencyDomainKey) => {
    vibrateTap();
    setSelectedDomains(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Generate Mock Quiz using AI
  const handleGenerateAiQuiz = async () => {
    vibrateTap();
    soundFx.playClick();

    if (totalPercentage !== 100) {
      soundFx.playWarning();
      vibrateWarning();
      alert(`Tổng tỷ lệ độ khó phải bằng 100% (Hiện tại là ${totalPercentage}%). Vui lòng điều chỉnh lại.`);
      return;
    }

    setIsGenerating(true);
    setProgressPct(15);
    setProgressMsg('Đang thu thập và phân tích ma trận câu hỏi trong ngân hàng đề...');

    try {
      const quiz = await generateBalancedMockQuizWithAI({
        presetKey: selectedPreset,
        customTitle: examTitle.trim() || undefined,
        targetCount: totalQuestions,
        timeMinutes,
        stage,
        distribution: {
          NHAN_BIET: distNhanBiet,
          THONG_HIEU: distThongHieu,
          VAN_DUNG: distVanDung,
          VAN_DUNG_CAO: distVanDungCao
        },
        selectedDomains,
        onlyApproved,
        onProgress: (msg, pct) => {
          setProgressMsg(msg);
          setProgressPct(pct);
        }
      });

      setGeneratedQuiz(quiz);
      soundFx.playCorrect();
      vibrateSuccess();

      if (onExamCreated) {
        const matrixSummary = {
          byLevel: {
            NHAN_BIET: quiz.distributionSummary.nhanBietCount,
            THONG_HIEU: quiz.distributionSummary.thongHieuCount,
            VAN_DUNG: quiz.distributionSummary.vanDungCount,
            VAN_DUNG_CAO: quiz.distributionSummary.vanDungCaoCount
          },
          byDomain: {
            MIEN_1: quiz.questions.filter(q => q.digital_competency_domain === 'MIEN_1').length,
            MIEN_2: quiz.questions.filter(q => q.digital_competency_domain === 'MIEN_2').length,
            MIEN_3: quiz.questions.filter(q => q.digital_competency_domain === 'MIEN_3').length,
            MIEN_4: quiz.questions.filter(q => q.digital_competency_domain === 'MIEN_4').length,
            MIEN_5: quiz.questions.filter(q => q.digital_competency_domain === 'MIEN_5').length,
            MIEN_6: quiz.questions.filter(q => q.digital_competency_domain === 'MIEN_6').length
          }
        };

        onExamCreated({
          id: quiz.code,
          code: quiz.code,
          title: quiz.title,
          stage: quiz.stage,
          totalQuestions: quiz.totalQuestions,
          totalScore: quiz.questions.length * 10,
          timeAllowedMinutes: quiz.timeMinutes,
          questions: quiz.questions,
          createdAt: quiz.createdAt,
          createdBy: 'AI Exam Generator',
          matrixSummary
        });
      }
    } catch (err: any) {
      console.error('Failed to generate AI quiz:', err);
      // Fallback
      const fallbackQuiz = generateBalancedMockQuizHeuristic({
        presetKey: selectedPreset,
        customTitle: examTitle.trim() || undefined,
        targetCount: totalQuestions,
        timeMinutes,
        stage,
        distribution: {
          NHAN_BIET: distNhanBiet,
          THONG_HIEU: distThongHieu,
          VAN_DUNG: distVanDung,
          VAN_DUNG_CAO: distVanDungCao
        },
        selectedDomains,
        onlyApproved
      });
      setGeneratedQuiz(fallbackQuiz);
      soundFx.playCorrect();
      vibrateSuccess();
    } finally {
      setIsGenerating(false);
    }
  };

  // Swap question with alternative
  const handleSwapQuestion = (index: number, replacement: QuestionItem) => {
    if (!generatedQuiz) return;
    vibrateTap();
    soundFx.playClick();

    const updated = [...generatedQuiz.questions];
    updated[index] = replacement;

    setGeneratedQuiz({
      ...generatedQuiz,
      questions: updated
    });
    setSwappingQuestionIndex(null);
    soundFx.playCorrect();
    vibrateSuccess();
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!generatedQuiz) return;
    vibrateTap();
    soundFx.playClick();
    excelService.exportQuestionsToExcel(generatedQuiz.questions, generatedQuiz.stage);
  };

  // Print A4
  const handlePrint = () => {
    vibrateTap();
    soundFx.playClick();
    window.print();
  };

  // Start Interactive Test Mode
  const handleStartTestSimulator = () => {
    if (!generatedQuiz) return;
    vibrateTap();
    soundFx.playSuccess();
    setIsTestModeActive(true);
    setUserAnswers({});
    setIsTestSubmitted(false);
    setTestTimeLeft(generatedQuiz.timeMinutes * 60);
  };

  // Calculate score in Test Simulator
  const testResults = useMemo(() => {
    if (!generatedQuiz || !isTestSubmitted) return null;
    let correct = 0;
    generatedQuiz.questions.forEach(q => {
      const uAns = userAnswers[q.id];
      if (uAns && q.correct_key && uAns.trim().toUpperCase() === q.correct_key.trim().toUpperCase()) {
        correct++;
      }
    });
    const pct = Math.round((correct / generatedQuiz.questions.length) * 100);
    return {
      correct,
      total: generatedQuiz.questions.length,
      percentage: pct,
      passed: pct >= 60
    };
  }, [generatedQuiz, isTestSubmitted, userAnswers]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      id="ai-mock-quiz-modal-overlay"
      className="fixed inset-0 z-[9999999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-hidden animate-fadeIn modal-backdrop-isolated select-none font-mono"
    >
      <div 
        id="ai-mock-quiz-modal-dialog"
        className="border border-theme-accent/40 rounded-[8px] max-w-6xl w-full h-[92vh] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden bg-[#120626] text-[#F5EFF9] overscroll-contain select-text"
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#1B0838] border-b border-theme-accent/25 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-gradient-to-br from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center text-slate-950 shadow-md font-bold shrink-0">
              <Sparkles className="w-5 h-5 text-slate-950 fill-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight uppercase">
                  AI Quiz Generator • Tạo Đề Thi Thử Tự Động
                </h3>
                <span className="text-[10.5px] text-amber-300 border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 rounded-[4px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Gemini 3.8 Flash Balanced Matrix</span>
                </span>
              </div>
              <p className="text-xs text-[#B6A6D8] font-sans">
                Tự động chọn lọc và cân bằng tỷ lệ 4 mức độ nhận thức (Nhận biết - Thông hiểu - Vận dụng - Vận dụng cao) và 6 miền tri thức số.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-[4px] hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split Layout */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10 bg-[#16062E]">
          
          {/* LEFT PANEL: Presets & Balancing Matrix Controls (5 cols) */}
          <div className="lg:col-span-5 h-full overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
            
            {/* Presets Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300 font-bold flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  <span>1. Chọn Khung Đề Chuẩn (Presets):</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.values(MOCK_QUIZ_PRESETS).map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handleSelectPreset(preset.key)}
                    className={`p-2.5 rounded-[6px] border text-left transition cursor-pointer flex flex-col justify-between ${
                      selectedPreset === preset.key
                        ? 'bg-theme-accent/20 border-theme-accent ring-1 ring-theme-accent shadow-md'
                        : 'bg-[#1E093D]/70 hover:bg-[#250D4C] border-white/10 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`font-bold text-xs ${selectedPreset === preset.key ? 'text-white' : 'text-slate-200'}`}>
                          {preset.name}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-[#B6A6D8] font-sans line-clamp-2 leading-tight">
                        {preset.description}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-white/10">
                      <span className="text-amber-300 font-bold">{preset.defaultQuestionsCount} câu • {preset.defaultTimeMinutes}p</span>
                      <span className="text-emerald-300">{preset.badge}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Test Settings */}
            <div className="fluent-card p-3.5 rounded-[6px] bg-[#1B0838] border border-white/10 space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-white/10 pb-2">
                <Sliders className="w-3.5 h-3.5 text-theme-accent" />
                <span>2. Thông Số Cơ Bản:</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Tiêu đề đề thi thử:</label>
                  <input
                    type="text"
                    placeholder={`Đề Thi Thử BTI 2026 (${totalQuestions} câu)...`}
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#120626] border border-white/15 rounded text-white text-xs placeholder-slate-500 focus:outline-none focus:border-theme-accent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Số câu hỏi:</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={totalQuestions}
                      onChange={(e) => setTotalQuestions(Math.max(5, Math.min(100, Number(e.target.value))))}
                      className="w-full px-3 py-1.5 bg-[#120626] border border-white/15 rounded text-white text-xs font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Thời gian (phút):</label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={timeMinutes}
                      onChange={(e) => setTimeMinutes(Math.max(5, Math.min(180, Number(e.target.value))))}
                      className="w-full px-3 py-1.5 bg-[#120626] border border-white/15 rounded text-white text-xs font-bold text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Giai đoạn thi đấu:</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as CompetitionStage)}
                    className="w-full px-3 py-1.5 bg-[#120626] border border-white/15 rounded text-white text-xs cursor-pointer"
                  >
                    {Object.entries(COMPETITION_STAGES).map(([k, v]) => (
                      <option key={k} value={k} className="bg-[#190839]">
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Cognitive Level Distribution Sliders */}
            <div className="fluent-card p-3.5 rounded-[6px] bg-[#1B0838] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span>3. Tỷ Lệ Độ Khó (Phải = 100%):</span>
                </span>
                <span className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                  totalPercentage === 100 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  Tổng: {totalPercentage}%
                </span>
              </div>

              {/* Sliders */}
              <div className="space-y-2.5 text-xs">
                {/* Nhận biết */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-sky-300 font-semibold">1. Nhận biết (Bậc 1-2):</span>
                    <strong className="text-white font-mono">{distNhanBiet}% ({Math.round((totalQuestions * distNhanBiet)/100)} câu)</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={distNhanBiet}
                    onChange={(e) => setDistNhanBiet(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-900 rounded appearance-none cursor-pointer accent-sky-400"
                  />
                </div>

                {/* Thông hiểu */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-emerald-300 font-semibold">2. Thông hiểu (Bậc 3-4):</span>
                    <strong className="text-white font-mono">{distThongHieu}% ({Math.round((totalQuestions * distThongHieu)/100)} câu)</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={distThongHieu}
                    onChange={(e) => setDistThongHieu(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-900 rounded appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                {/* Vận dụng */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-amber-300 font-semibold">3. Vận dụng (Bậc 5-6):</span>
                    <strong className="text-white font-mono">{distVanDung}% ({Math.round((totalQuestions * distVanDung)/100)} câu)</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={distVanDung}
                    onChange={(e) => setDistVanDung(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-900 rounded appearance-none cursor-pointer accent-amber-400"
                  />
                </div>

                {/* Vận dụng cao */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-rose-300 font-semibold">4. Vận dụng cao (Bậc 7-8):</span>
                    <strong className="text-white font-mono">{distVanDungCao}% ({Math.max(1, Math.round((totalQuestions * distVanDungCao)/100))} câu)</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={distVanDungCao}
                    onChange={(e) => setDistVanDungCao(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-900 rounded appearance-none cursor-pointer accent-rose-400"
                  />
                </div>
              </div>
            </div>

            {/* 6 Competency Domains Coverage */}
            <div className="fluent-card p-3.5 rounded-[6px] bg-[#1B0838] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>4. Miền Năng Lực Số (TT 02/2025):</span>
                </span>
                <span className="text-[10px] text-slate-400">Đã chọn: {selectedDomains.length}/6</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {(['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'] as DigitalCompetencyDomainKey[]).map((dKey, idx) => {
                  const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
                  const isChecked = selectedDomains.includes(dKey);
                  return (
                    <button
                      key={dKey}
                      type="button"
                      onClick={() => toggleDomain(dKey)}
                      className={`p-2 rounded text-left transition flex items-center justify-between border cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40'
                          : 'bg-[#120626] text-slate-400 border-white/10 opacity-60'
                      }`}
                    >
                      <span className="font-semibold text-[11px] truncate">
                        M{idx + 1}: {dom?.name.slice(0, 18)}...
                      </span>
                      {isChecked && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <button
              type="button"
              onClick={handleGenerateAiQuiz}
              disabled={isGenerating || totalPercentage !== 100}
              className="w-full py-3 bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider rounded-[6px] shadow-lg flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Đang Khởi Tạo Đề Thi Cân Bằng AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>⚡ AI Tự Động Tạo Đề Thi Thử ({totalQuestions} câu)</span>
                </>
              )}
            </button>

            {/* Progress Bar */}
            {isGenerating && (
              <div className="space-y-1.5 animate-fadeIn">
                <div className="flex justify-between text-[11px] text-amber-300">
                  <span>{progressMsg}</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-amber-500/30">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-purple-500 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

          </div>

          {/* RIGHT PANEL: Generated Mock Quiz View & Interactive Test (7 cols) */}
          <div className="lg:col-span-7 h-full overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#140526] custom-scrollbar">
            
            {/* Header / Actions Banner */}
            {generatedQuiz ? (
              <div className="space-y-4">
                
                {/* AI Rationale & Difficulty Breakdown Card */}
                <div className="fluent-card p-4 rounded-[6px] bg-[#1D083B] border border-theme-accent/40 shadow-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white font-mono">
                          {generatedQuiz.title}
                        </h4>
                        <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-purple-500/20 text-purple-200 border border-purple-400/30">
                          {generatedQuiz.code}
                        </span>
                      </div>
                      <p className="text-xs text-[#B6A6D8] font-sans mt-0.5">
                        {generatedQuiz.subtitle}
                      </p>
                    </div>

                    {/* Difficulty Rating Badge */}
                    <div className="text-right shrink-0">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold text-xs">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>Độ Khó: {generatedQuiz.difficultyIndex}/10</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">
                        {generatedQuiz.difficultyLabel}
                      </span>
                    </div>
                  </div>

                  {/* AI Pedagogical Rationale */}
                  <div className="p-3 rounded bg-black/40 border border-white/10 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Phân Tích Sư Phạm & Cơ Cấu Cân Bằng Của AI:</span>
                    </div>
                    <p className="text-slate-200 font-sans leading-relaxed text-[11.5px]">
                      {generatedQuiz.pedagogicalRationale}
                    </p>
                    {generatedQuiz.timePacingTip && (
                      <div className="text-[11px] text-emerald-300 font-sans flex items-center gap-1 pt-1 border-t border-white/5">
                        <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span><strong>Chiến thuật thời gian:</strong> {generatedQuiz.timePacingTip}</span>
                      </div>
                    )}
                  </div>

                  {/* Distribution Counters */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1 font-mono">
                    <div className="p-2 rounded bg-sky-950/40 border border-sky-500/30">
                      <span className="text-[10px] text-sky-300 block">Nhận biết</span>
                      <strong className="text-sm text-white">{generatedQuiz.distributionSummary.nhanBietCount} câu</strong>
                    </div>

                    <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/30">
                      <span className="text-[10px] text-emerald-300 block">Thông hiểu</span>
                      <strong className="text-sm text-white">{generatedQuiz.distributionSummary.thongHieuCount} câu</strong>
                    </div>

                    <div className="p-2 rounded bg-amber-950/40 border border-amber-500/30">
                      <span className="text-[10px] text-amber-300 block">Vận dụng</span>
                      <strong className="text-sm text-white">{generatedQuiz.distributionSummary.vanDungCount} câu</strong>
                    </div>

                    <div className="p-2 rounded bg-rose-950/40 border border-rose-500/30">
                      <span className="text-[10px] text-rose-300 block">Vận dụng cao</span>
                      <strong className="text-sm text-white">{generatedQuiz.distributionSummary.vanDungCaoCount} câu</strong>
                    </div>
                  </div>

                  {/* Top Actions: Test Simulator, Print, Excel, Answer Keys */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAnswerKeys(!showAnswerKeys)}
                        className="px-3 py-1.5 bg-[#2A1152] hover:bg-[#38176D] text-slate-200 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-white/10"
                      >
                        {showAnswerKeys ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>{showAnswerKeys ? 'Ẩn đáp án' : 'Hiện đáp án & lời giải'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleStartTestSimulator}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-slate-950 rounded text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                        title="Vào phòng thi thử online ngay trên hệ thống"
                      >
                        <PlayCircle className="w-4 h-4 text-slate-950" />
                        <span>Thi Thử Ngay</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExportExcel}
                        className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 transition cursor-pointer border border-white/10"
                        title="Xuất tệp Excel"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      </button>

                      <button
                        type="button"
                        onClick={handlePrint}
                        className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 transition cursor-pointer border border-white/10"
                        title="In đề thi ra giấy A4 hoặc PDF"
                      >
                        <Printer className="w-4 h-4 text-sky-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* TEST SIMULATOR VIEW (When user clicks 'Thi Thử Ngay') */}
                {isTestModeActive ? (
                  <div className="p-4 rounded-[6px] bg-[#1E093D] border border-emerald-500/50 shadow-2xl space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                      <div className="flex items-center gap-2">
                        <PlayCircle className="w-5 h-5 text-emerald-400" />
                        <h4 className="text-sm font-bold text-white uppercase">Phòng Thi Thử Trực Tuyến</h4>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-amber-300 font-bold bg-black/40 px-2.5 py-1 rounded border border-amber-500/30">
                          Đã làm: {Object.keys(userAnswers).length}/{generatedQuiz.questions.length} câu
                        </span>

                        <button
                          type="button"
                          onClick={() => setIsTestModeActive(false)}
                          className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-300 text-xs cursor-pointer"
                        >
                          Thoát chế độ thi
                        </button>
                      </div>
                    </div>

                    {/* Result Banner if submitted */}
                    {isTestSubmitted && testResults && (
                      <div className={`p-4 rounded-[6px] border text-center space-y-2 ${
                        testResults.passed 
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100'
                          : 'bg-rose-950/80 border-rose-500 text-rose-100'
                      }`}>
                        <h3 className="text-base font-bold">
                          {testResults.passed ? '🎉 Chúc mừng! Bạn đã hoàn thành tốt bài thi thử!' : '⚠️ Bạn chưa đạt điểm chuẩn! Hãy tiếp tục ôn luyện!'}
                        </h3>
                        <p className="text-sm font-mono">
                          Kết quả: <strong>{testResults.correct}</strong> / {testResults.total} câu đúng ({testResults.percentage}%)
                        </p>
                      </div>
                    )}

                    {/* Questions in Test Mode */}
                    <div className="space-y-4">
                      {generatedQuiz.questions.map((q, idx) => (
                        <div key={q.id} className="p-3.5 rounded bg-black/40 border border-white/10 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                            <span>Câu {idx + 1}:</span>
                            <span className="text-[10px] text-purple-300 font-mono">{q.cognitive_level}</span>
                          </div>
                          <p className="text-xs font-medium text-white font-sans">{q.question_text}</p>

                          {q.options && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {Object.entries(q.options).map(([k, v]) => {
                                const isSelected = userAnswers[q.id] === k;
                                const isCorrect = q.correct_key === k;
                                return (
                                  <button
                                    key={k}
                                    type="button"
                                    disabled={isTestSubmitted}
                                    onClick={() => {
                                      vibrateTap();
                                      soundFx.playClick();
                                      setUserAnswers(prev => ({ ...prev, [q.id]: k }));
                                    }}
                                    className={`p-2 rounded text-left text-xs font-sans transition cursor-pointer border ${
                                      isTestSubmitted && isCorrect
                                        ? 'bg-emerald-600/40 text-emerald-100 border-emerald-400 font-bold'
                                        : isTestSubmitted && isSelected && !isCorrect
                                        ? 'bg-rose-600/40 text-rose-100 border-rose-400 line-through'
                                        : isSelected
                                        ? 'bg-amber-500/30 text-amber-200 border-amber-400 font-bold'
                                        : 'bg-[#180730] text-slate-300 border-white/10 hover:border-white/30'
                                    }`}
                                  >
                                    <strong className="text-amber-300 font-mono mr-1.5">{k}.</strong>
                                    <span>{v}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {!isTestSubmitted && (
                      <button
                        type="button"
                        onClick={() => {
                          vibrateSuccess();
                          soundFx.playCorrect();
                          setIsTestSubmitted(true);
                        }}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase rounded cursor-pointer transition shadow-lg"
                      >
                        Nộp Bài &amp; Xem Kết Quả Chấm Điểm
                      </button>
                    )}
                  </div>
                ) : (
                  /* Standard Question Inspection List */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
                      <span>DANH SÁCH {generatedQuiz.questions.length} CÂU HỎI TRONG ĐỀ:</span>
                      <span className="text-[11px] text-slate-400">Thứ tự làm bài đã được AI tối ưu hóa</span>
                    </div>

                    {generatedQuiz.questions.map((q, idx) => (
                      <div 
                        key={q.id}
                        className="p-3.5 rounded-[6px] bg-[#1A0735] border border-white/10 space-y-2.5 hover:border-white/20 transition shadow"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-theme-accent text-[#190839] flex items-center justify-center font-bold text-[11px]">
                              {idx + 1}
                            </span>
                            <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                              q.cognitive_level === 'NHAN_BIET' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' :
                              q.cognitive_level === 'THONG_HIEU' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                              q.cognitive_level === 'VAN_DUNG' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                              'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}>
                              {q.cognitive_level || 'THONG_HIEU'}
                            </span>
                            <span className="text-[10px] text-slate-400">ID: {q.id}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSwappingQuestionIndex(swappingQuestionIndex === idx ? null : idx)}
                              className="px-2 py-1 bg-white/5 hover:bg-white/15 text-slate-300 rounded text-[10.5px] flex items-center gap-1 transition cursor-pointer border border-white/10"
                              title="Chọn câu hỏi thay thế có cùng mức độ nhận thức"
                            >
                              <RotateCcw className="w-3 h-3 text-amber-400" />
                              <span>Đổi câu khác</span>
                            </button>
                          </div>
                        </div>

                        {/* Question Text */}
                        <p className="text-xs font-semibold text-white leading-relaxed font-sans">
                          {q.question_text}
                        </p>

                        {/* Options */}
                        {q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                            {Object.entries(q.options).map(([k, v]) => (
                              <div 
                                key={k}
                                className={`p-2 rounded text-[11.5px] font-sans border ${
                                  showAnswerKeys && q.correct_key === k
                                    ? 'bg-emerald-950/60 border-emerald-500/70 text-emerald-200 font-bold'
                                    : 'bg-black/30 border-white/5 text-slate-300'
                                }`}
                              >
                                <strong className="text-theme-accent font-mono mr-1.5">{k}.</strong>
                                <span>{v}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Explanation & Legal (When showAnswerKeys is ON) */}
                        {showAnswerKeys && (
                          <div className="mt-2 p-2.5 rounded bg-emerald-950/30 border border-emerald-500/30 text-xs font-sans text-emerald-200 space-y-1">
                            <div className="flex items-center gap-2 font-mono font-bold text-[11px] text-emerald-300">
                              <span>Đáp án: <strong>{q.correct_key}</strong></span>
                              {q.legal_reference && <span>• Căn cứ: {q.legal_reference}</span>}
                            </div>
                            {q.explanation && (
                              <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                                {q.explanation}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Swapping Panel */}
                        {swappingQuestionIndex === idx && (
                          <div className="p-3 rounded bg-black/60 border border-amber-500/40 space-y-2 mt-2 animate-fadeIn">
                            <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
                              <span>Chọn câu hỏi thay thế từ ngân hàng đề:</span>
                              <button
                                type="button"
                                onClick={() => setSwappingQuestionIndex(null)}
                                className="text-slate-400 hover:text-white"
                              >
                                Đóng
                              </button>
                            </div>

                            {(() => {
                              const excluded = new Set(generatedQuiz.questions.map(item => item.id));
                              const alternatives = findAlternativeQuestions(q, excluded);
                              if (alternatives.length === 0) {
                                return (
                                  <p className="text-xs text-slate-400 italic">
                                    Không còn câu hỏi thay thế nào khác cùng mức độ nhận thức trong ngân hàng đề.
                                  </p>
                                );
                              }
                              return (
                                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                                  {alternatives.map((alt) => (
                                    <div
                                      key={alt.id}
                                      onClick={() => handleSwapQuestion(idx, alt)}
                                      className="p-2 rounded bg-[#1C0838] hover:bg-emerald-950/60 border border-white/10 hover:border-emerald-400/50 transition cursor-pointer text-xs flex items-center justify-between gap-2"
                                    >
                                      <p className="font-sans line-clamp-1 text-slate-200">{alt.question_text}</p>
                                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] shrink-0">
                                        Chọn thay
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            ) : (
              /* Empty / Getting Started Guide */
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/20 via-rose-500/20 to-purple-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-xl">
                  <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
                </div>

                <div className="max-w-md space-y-1.5">
                  <h4 className="text-base font-bold text-white">
                    Sẵn Sàng Tạo Đề Thi Thử Cân Bằng Tự Động
                  </h4>
                  <p className="text-xs text-[#B6A6D8] font-sans leading-relaxed">
                    Chọn khung đề mong muốn ở cột bên trái hoặc tùy chỉnh tỷ lệ 4 mức độ nhận thức. Mô hình Gemini 3.8 Flash sẽ tự động chọn lọc danh sách câu hỏi tối ưu nhất.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full max-w-sm text-left text-xs font-mono">
                  <div className="p-3 rounded bg-white/5 border border-white/10 space-y-1">
                    <span className="text-[10px] text-slate-400 block">Tổng câu trong kho</span>
                    <strong className="text-base font-bold text-theme-accent">{bankStats.total} câu</strong>
                  </div>

                  <div className="p-3 rounded bg-white/5 border border-white/10 space-y-1">
                    <span className="text-[10px] text-slate-400 block">Đã qua thẩm định</span>
                    <strong className="text-base font-bold text-emerald-400">{bankStats.approved} câu</strong>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-theme-accent/25 bg-[#1B0838] flex items-center justify-between text-xs">
          <span className="text-slate-400 font-sans hidden sm:inline">
            Chuẩn hóa khảo thí &amp; phân phối độ khó tự động cho Kỳ thi Beyond The Internet 2026.
          </span>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              onClose();
            }}
            className="fluent-btn-primary px-5 py-2 text-xs font-bold rounded cursor-pointer ml-auto"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
