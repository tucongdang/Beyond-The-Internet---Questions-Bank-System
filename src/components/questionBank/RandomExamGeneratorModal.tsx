import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Dices, 
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
  FileText
} from 'lucide-react';
import { 
  CompetitionStage, 
  DigitalCompetencyDomainKey, 
  GeneratedExam 
} from '../../types';
import { 
  COMPETITION_STAGES, 
  DIGITAL_COMPETENCY_DOMAINS 
} from '../../data/digitalCompetencyData';
import { questionBankManager } from '../../services/questionBankManager';
import { excelService } from '../../services/excelService';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface RandomExamGeneratorModalProps {
  onClose: () => void;
  onExamCreated?: (exam: GeneratedExam) => void;
}

export const RandomExamGeneratorModal: React.FC<RandomExamGeneratorModalProps> = ({ 
  onClose,
  onExamCreated 
}) => {
  useLockBodyScroll(true);

  const [stage, setStage] = useState<CompetitionStage>('BAN_KET_1');
  const [examTitle, setExamTitle] = useState<string>('Bộ Đề Thi Chính Thức BTI 2026');
  const [totalQuestions, setTotalQuestions] = useState<number>(30);
  const [timeMinutes, setTimeMinutes] = useState<number>(45);

  // Distribution weights
  const [distNhanBiet, setDistNhanBiet] = useState<number>(40);
  const [distThongHieu, setDistThongHieu] = useState<number>(30);
  const [distVanDung, setDistVanDung] = useState<number>(20);
  const [distVanDungCao, setDistVanDungCao] = useState<number>(10);

  const [selectedDomains, setSelectedDomains] = useState<DigitalCompetencyDomainKey[]>([
    'MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'
  ]);

  const [generatedExam, setGeneratedExam] = useState<GeneratedExam | null>(null);
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(false);

  const handleStageChange = (newStage: CompetitionStage) => {
    setStage(newStage);
    if (newStage === 'VONG_LOAI') {
      setTotalQuestions(28);
      setTimeMinutes(45);
      setExamTitle('Đề Thi Vòng Loại BTI 2026 (28 câu chuẩn hóa)');
    } else {
      if (totalQuestions === 28) {
        setTotalQuestions(30);
      }
    }
  };

  const totalPercentage = distNhanBiet + distThongHieu + distVanDung + distVanDungCao;

  const toggleDomain = (key: DigitalCompetencyDomainKey) => {
    vibrateTap();
    setSelectedDomains(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleGenerate = () => {
    vibrateTap();
    soundFx.playClick();

    if (totalPercentage !== 100) {
      alert(`Tổng tỷ lệ các mức độ nhận thức phải bằng 100% (Hiện tại là ${totalPercentage}%). Vui lòng điều chỉnh lại.`);
      return;
    }

    const exam = questionBankManager.generateRandomExam({
      title: examTitle || `Bộ Đề ${COMPETITION_STAGES[stage].name}`,
      stage,
      totalQuestions,
      timeMinutes,
      levelDistribution: {
        NHAN_BIET: distNhanBiet,
        THONG_HIEU: distThongHieu,
        VAN_DUNG: distVanDung,
        VAN_DUNG_CAO: distVanDungCao
      },
      domainFilters: selectedDomains,
      onlyApproved: true
    });

    setGeneratedExam(exam);
    soundFx.playCorrect();
    vibrateSuccess();

    if (onExamCreated) onExamCreated(exam);
  };

  const handleExportExcel = () => {
    if (!generatedExam) return;
    vibrateTap();
    soundFx.playClick();
    const filename = `${generatedExam.code}_${generatedExam.stage}_Exam.xlsx`;
    excelService.exportQuestionsToExcel(generatedExam.questions, filename);
  };

  const handlePrint = () => {
    vibrateTap();
    soundFx.playClick();
    window.print();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      id="random-exam-modal-overlay"
      className="fixed inset-0 z-[9999999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-hidden animate-fadeIn modal-backdrop-isolated select-none"
    >
      <div 
        id="random-exam-modal-dialog"
        className="border border-theme-accent/30 rounded-[8px] max-w-4xl w-full h-[90vh] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden bg-[#190839] text-[#F5EFF9] overscroll-contain select-text"
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#241148] border-b border-theme-accent/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-theme-accent flex items-center justify-center text-[#190839] shadow-sm font-bold shrink-0">
              <Dices className="w-5 h-5 text-[#190839]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                <span>Ma Trận & Khởi Tạo Đề Thi Ngẫu Nhiên</span>
                <span className="text-[10px] text-theme-accent border border-theme-accent/30 bg-[#3E1D74]/40 px-2 py-0.5 rounded-[4px] font-mono">
                  TT 02/2025/TT-BGDĐT
                </span>
              </h3>
              <p className="text-xs text-[#B6A6D8]">
                Tự động bốc thăm ngẫu nhiên không trùng lặp theo ma trận nhận thức & miền năng lực
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[4px] text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:px-6 py-5 overflow-y-auto space-y-6 flex-1 text-xs custom-scrollbar modal-scroll-isolated overscroll-contain">
          {!generatedExam ? (
            /* CONFIGURATION VIEW */
            <div className="space-y-5">
              {/* Row 1: Title & Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#B6A6D8] font-mono mb-1.5 font-semibold">
                    1. Tên Bộ Đề:
                  </label>
                  <input
                    type="text"
                    value={examTitle}
                    onChange={e => setExamTitle(e.target.value)}
                    className="w-full fluent-input px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-[#B6A6D8] font-mono mb-1.5 font-semibold">
                    2. Giai Đoạn Cuộc Thi:
                  </label>
                  <select
                    value={stage}
                    onChange={e => handleStageChange(e.target.value as CompetitionStage)}
                    className="w-full fluent-input px-3 py-2"
                  >
                    {Object.values(COMPETITION_STAGES).map(s => (
                      <option key={s.stage} value={s.stage} className="bg-[#190839] text-white">
                        {s.name} ({s.subTitle})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Thông tin quy chuẩn Vòng loại duy nhất */}
              {stage === 'VONG_LOAI' && (
                <div className="p-3 bg-[#241148]/80 border border-theme-accent/30 rounded-[4px] flex items-start gap-2.5 text-xs">
                  <FileText className="w-4 h-4 text-theme-accent mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <div className="font-bold text-theme-accent font-mono flex items-center justify-between">
                      <span>🎯 QUY CHUẨN ĐỀ THI VÒNG LOẠI (28 CÂU DUY NHẤT):</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-[4px] border border-emerald-500/30 font-mono">
                        Chuẩn BTI 2026
                      </span>
                    </div>
                    <p className="text-[#B6A6D8] leading-relaxed text-[11.5px]">
                      • <strong>Phần I (24 câu):</strong> Trắc nghiệm 4 lựa chọn A, B, C, D (1 phương án đúng nhất).<br />
                      • <strong>Phần II (4 câu):</strong> Câu hỏi Đúng / Sai (mỗi câu gồm 4 ý a, b, c, d).<br />
                      <span className="text-amber-300/90 italic">* Vòng loại chỉ có 1 dạng đề chuẩn hóa 28 câu, không chọn các vòng thi Gameshow (Khởi động, VCNV, Tăng tốc, Về đích) như Bán kết &amp; Chung kết.</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Row 2: Total questions & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#B6A6D8] font-mono mb-1.5 font-semibold flex items-center justify-between">
                    <span>3. Số Lượng Câu Hỏi:</span>
                    {stage === 'VONG_LOAI' && (
                      <span className="text-amber-400 text-[10px] font-normal font-mono">Cố định 28 câu</span>
                    )}
                  </label>
                  {stage === 'VONG_LOAI' ? (
                    <div className="w-full bg-[#0D0420] border border-theme-accent/30 rounded-[4px] px-3 py-2 text-theme-accent font-mono font-bold text-xs flex items-center justify-between">
                      <span>28 câu</span>
                      <span className="text-[10px] text-[#B6A6D8] font-normal">(24 câu P.I + 4 câu P.II)</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={totalQuestions}
                      onChange={e => setTotalQuestions(Number(e.target.value))}
                      className="w-full fluent-input px-3 py-2"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[#B6A6D8] font-mono mb-1.5 font-semibold">
                    4. Thời Gian Làm Bài (phút):
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={180}
                    value={timeMinutes}
                    onChange={e => setTimeMinutes(Number(e.target.value))}
                    className="w-full fluent-input px-3 py-2"
                  />
                </div>
              </div>

              {/* Row 3: Cognitive Distribution (Ma trận nhận thức) */}
              <div className="p-4 bg-[#241148]/60 rounded-[4px] border border-theme-accent/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-white font-bold font-mono uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-theme-accent" />
                    5. Ma Trận Phân Bố Mức Độ Nhận Thức (%):
                  </label>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded-[4px] text-xs ${
                    totalPercentage === 100 
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40' 
                      : 'bg-rose-950/60 text-rose-400 border border-rose-500/40'
                  }`}>
                    Tổng: {totalPercentage}% {totalPercentage !== 100 && '(Cần = 100%)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 bg-[#0D0420]/80 rounded-[4px] border border-theme-accent/15">
                    <span className="text-[#B6A6D8] block font-mono text-[10px]">Nhận biết:</span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        value={distNhanBiet}
                        onChange={e => setDistNhanBiet(Number(e.target.value))}
                        className="w-full bg-transparent text-sm font-bold text-sky-400 focus:outline-none font-mono"
                      />
                      <span className="text-white/40 font-mono">%</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#0D0420]/80 rounded-[4px] border border-theme-accent/15">
                    <span className="text-[#B6A6D8] block font-mono text-[10px]">Thông hiểu:</span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        value={distThongHieu}
                        onChange={e => setDistThongHieu(Number(e.target.value))}
                        className="w-full bg-transparent text-sm font-bold text-emerald-400 focus:outline-none font-mono"
                      />
                      <span className="text-white/40 font-mono">%</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#0D0420]/80 rounded-[4px] border border-theme-accent/15">
                    <span className="text-[#B6A6D8] block font-mono text-[10px]">Vận dụng:</span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        value={distVanDung}
                        onChange={e => setDistVanDung(Number(e.target.value))}
                        className="w-full bg-transparent text-sm font-bold text-amber-400 focus:outline-none font-mono"
                      />
                      <span className="text-white/40 font-mono">%</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#0D0420]/80 rounded-[4px] border border-theme-accent/15">
                    <span className="text-[#B6A6D8] block font-mono text-[10px]">Vận dụng cao:</span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        value={distVanDungCao}
                        onChange={e => setDistVanDungCao(Number(e.target.value))}
                        className="w-full bg-transparent text-sm font-bold text-rose-400 focus:outline-none font-mono"
                      />
                      <span className="text-white/40 font-mono">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Domain filter checkboxes */}
              <div>
                <label className="block text-[#B6A6D8] font-mono mb-2 font-semibold">
                  6. Chọn Các Miền Năng Lực Số (Thông tư 02/2025):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.values(DIGITAL_COMPETENCY_DOMAINS).map(d => {
                    const isChecked = selectedDomains.includes(d.key);
                    return (
                      <div
                        key={d.key}
                        onClick={() => toggleDomain(d.key)}
                        className={`p-2.5 rounded-[4px] border text-xs flex items-center justify-between cursor-pointer transition ${
                          isChecked
                            ? 'bg-[#3E1D74]/50 border-theme-accent text-white shadow-sm'
                            : 'bg-[#241148]/40 border-theme-accent/15 text-[#B6A6D8] hover:border-theme-accent/30'
                        }`}
                      >
                        <span className="font-mono">{d.code}: {d.name}</span>
                        {isChecked && <CheckCircle2 className="w-4 h-4 text-theme-accent shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleGenerate}
                className="w-full py-3 fluent-btn-primary text-xs flex items-center justify-center gap-2 cursor-pointer font-mono"
              >
                <Dices className="w-4 h-4" />
                <span>Bốc Thăm &amp; Xuất Đề Thi Ngẫu Nhiên</span>
              </button>
            </div>
          ) : (
            /* GENERATED EXAM PREVIEW */
            <div className="space-y-5">
              {/* Exam Header Card */}
              <div className="p-4 bg-gradient-to-r from-[#241148] via-[#190839] to-[#0D0420] rounded-[4px] border border-theme-accent/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-theme-accent bg-[#3E1D74]/60 px-2.5 py-0.5 rounded-[4px] border border-theme-accent/40">
                        {generatedExam.code}
                      </span>
                      <span className="text-xs font-mono text-[#B6A6D8]">
                        {generatedExam.stage}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white mt-1">
                      {generatedExam.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAnswerKey(!showAnswerKey)}
                      className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-bold transition cursor-pointer border ${
                        showAnswerKey 
                          ? 'bg-amber-600 text-white border-amber-400' 
                          : 'bg-white/10 text-white/80 border-white/20'
                      }`}
                    >
                      {showAnswerKey ? 'Ẩn Đáp Án' : 'Hiện Đáp Án & Hướng Dẫn'}
                    </button>

                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[4px] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Xuất Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-[4px] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>In Đề</span>
                    </button>
                  </div>
                </div>

                {/* Matrix summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-white/80">
                  <div className="p-2 bg-white/5 rounded-[4px] border border-white/10">
                    <span className="text-white/50 block text-[10px]">Tổng số câu:</span>
                    <strong className="text-white">{generatedExam.totalQuestions} câu</strong>
                  </div>
                  <div className="p-2 bg-white/5 rounded-[4px] border border-white/10">
                    <span className="text-white/50 block text-[10px]">Thời gian làm bài:</span>
                    <strong className="text-amber-300">{generatedExam.timeAllowedMinutes} phút</strong>
                  </div>
                  <div className="p-2 bg-white/5 rounded-[4px] border border-white/10">
                    <span className="text-white/50 block text-[10px]">Nhận biết / Thông hiểu:</span>
                    <strong className="text-sky-300">
                      {generatedExam.matrixSummary.byLevel.NHAN_BIET} / {generatedExam.matrixSummary.byLevel.THONG_HIEU} câu
                    </strong>
                  </div>
                  <div className="p-2 bg-white/5 rounded-[4px] border border-white/10">
                    <span className="text-white/50 block text-[10px]">Vận dụng / Vận dụng cao:</span>
                    <strong className="text-emerald-300">
                      {generatedExam.matrixSummary.byLevel.VAN_DUNG} / {generatedExam.matrixSummary.byLevel.VAN_DUNG_CAO} câu
                    </strong>
                  </div>
                </div>
              </div>

              {/* Question list for Exam Paper */}
              <div className="space-y-4">
                {generatedExam.questions.map((q, idx) => (
                  <div 
                    key={q.id}
                    className="p-4 rounded-[4px] border border-theme-accent/20 bg-[#0D0420]/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-theme-accent">
                        Câu {idx + 1} ({q.points || 10} điểm)
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-white/50 text-[10px]">{q.cognitive_level}</span>
                        <span className="text-purple-300 text-[10px] bg-purple-950/50 px-1.5 py-0.5 rounded-[2px] border border-purple-500/20">
                          {q.digital_competency_domain}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                      {q.question_text}
                    </p>

                    {/* Question Image if any */}
                    {(() => {
                      const imgUrl = q.options?.obstacleImage || q.obstacle_info?.obstacleImage || (q.media_type === 'IMAGE' ? q.media_url : '') || (q as any).image_url;
                      if (!imgUrl) return null;
                      return (
                        <div className="my-2 p-1 bg-black/40 rounded border border-white/10 inline-block max-w-full">
                          <img
                            src={imgUrl}
                            alt="Minh họa câu hỏi"
                            className="max-h-40 max-w-full object-contain rounded border border-white/20"
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      );
                    })()}

                    {/* VCNV or Multiple choice options */}
                    {(() => {
                      const isVcnv = q.round_group === 'VCNV' || q.round_type === 'VCNV' || q.round_format?.includes('VCNV') || Boolean(q.options && ('clue1' in q.options || 'obstacleImage' in q.options));
                      if (isVcnv) {
                        return (
                          <div className="space-y-1.5 p-2.5 rounded bg-amber-950/20 border border-amber-500/30 text-xs font-mono">
                            <div className="flex items-center justify-between text-amber-300 font-bold">
                              <span>🧩 Vượt Chướng Ngại Vật: 4 hàng ngang + Ô Trung Tâm + Ô Mạo hiểm</span>
                              {showAnswerKey && (
                                <span className="bg-black/60 px-2 py-0.5 rounded text-amber-200 border border-amber-500/40">
                                  Từ khóa: {q.correct_key || q.options?.riskAnswer || 'DEEPFAKE'}
                                </span>
                              )}
                            </div>
                            {q.options?.riskQuestion && (
                              <p className="text-white/70 text-[11px]">
                                Mạo hiểm: {q.options.riskQuestion}
                              </p>
                            )}
                          </div>
                        );
                      }

                      const INTERNAL_KEYS = new Set([
                        'kdTurn', 'obstacleImage', 'riskQuestion', 'riskAnswer',
                        'clue1', 'ans1', 'clue2', 'ans2', 'clue3', 'ans3', 'clue4', 'ans4',
                        'centerText', 'centerAnswer', '_raw'
                      ]);
                      const validOptions = Object.entries(q.options || {}).filter(([k, v]) => !INTERNAL_KEYS.has(k) && v !== '' && v !== undefined && v !== null);

                      if (validOptions.length === 0) return null;

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                          {validOptions.map(([k, v]) => (
                            <div 
                              key={k}
                              className={`p-2 rounded-[4px] border ${
                                showAnswerKey && (q.correct_key === k || q.correct_key?.includes(k))
                                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold'
                                  : 'bg-[#190839]/60 border-theme-accent/15 text-white/80'
                              }`}
                            >
                              <span className="font-bold mr-2 text-white/60">{k}.</span>
                              <span>{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Answer Key if toggled */}
                    {showAnswerKey && (
                      <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-[4px] text-xs space-y-1 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-emerald-400 font-bold">Đáp án đúng:</span>
                          <span className="font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded-[2px]">
                            {q.correct_key}
                          </span>
                        </div>
                        {q.explanation && (
                          <p className="text-white/70">
                            <strong>Giải thích:</strong> {q.explanation}
                          </p>
                        )}
                        {q.legal_reference && (
                          <p className="text-amber-300/80 text-[11px]">
                            <strong>Căn cứ:</strong> {q.legal_reference}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Scenarios attached for Finals */}
                {generatedExam.scenarios && generatedExam.scenarios.length > 0 && (
                  <div className="p-4 bg-purple-950/20 border border-purple-500/30 rounded-[4px] space-y-3">
                    <h4 className="text-xs font-bold font-mono text-purple-300 uppercase tracking-wider">
                      Phần Thi Tình Huống Kịch Tương Tác Kèm Theo:
                    </h4>
                    {generatedExam.scenarios.map(sc => (
                      <div key={sc.id} className="p-3 bg-black/40 rounded-[4px] border border-white/10 space-y-1">
                        <h5 className="font-bold text-white text-xs">{sc.title}</h5>
                        <p className="text-[11px] text-white/70">{sc.dilemmaQuestion}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action bar to generate new */}
              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setGeneratedExam(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-[4px] text-xs font-mono transition"
                >
                  Quay Lại Cấu Hình
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 fluent-btn-primary rounded-[4px] text-xs font-bold font-mono transition"
                >
                  Hoàn Tất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
