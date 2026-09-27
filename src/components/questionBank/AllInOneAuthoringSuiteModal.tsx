import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Scale, 
  Activity, 
  Copy, 
  Check, 
  Layers, 
  Volume2, 
  BookOpen, 
  ShieldCheck, 
  Cpu, 
  Flame, 
  RotateCcw,
  ArrowRight,
  Sliders,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { autopilotAuthoringService, AutopilotAuthoringResult } from '../../services/autopilotAuthoringService';
import { DIGITAL_COMPETENCY_DOMAINS, COGNITIVE_LEVELS } from '../../data/digitalCompetencyData';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface AllInOneAuthoringSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessAdded?: (count: number) => void;
  onShowToast?: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const AllInOneAuthoringSuiteModal: React.FC<AllInOneAuthoringSuiteModalProps> = ({
  isOpen,
  onClose,
  onSuccessAdded,
  onShowToast
}) => {
  useLockBodyScroll(isOpen);

  const [prompt, setPrompt] = useState<string>('Tình huống nhân viên nhận email giả mạo ngân hàng yêu cầu cung cấp OTP, đối chiếu với quy định tại Nghị định 13/2023/NĐ-CP');
  const [domainKey, setDomainKey] = useState<string>('AUTO');
  const [cognitiveLevel, setCognitiveLevel] = useState<string>('AUTO');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'>('MEDIUM');
  const [includeVariants, setIncludeVariants] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AutopilotAuthoringResult | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'QUESTION' | 'LEGAL' | 'PSYCHOMETRICS' | 'VARIANTS' | 'FORMATS' | 'VOICE'>('QUESTION');
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Global ESC key listener for effortless closing
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
        vibrateTap();
        soundFx.playClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, loading]);

  const presets = [
    { label: '🛡️ Bảo vệ dữ liệu cá nhân NĐ 13/2023', text: 'Tình huống doanh nghiệp thu thập dữ liệu sinh trắc học khách hàng mà chưa có sự đồng ý rõ ràng theo Nghị định 13/2023/NĐ-CP' },
    { label: '🎭 Nhận diện Deepfake AI', text: 'Kỹ thuật nhận biết cuộc gọi video Deepfake mạo danh lãnh đạo chuyển tiền và các biện pháp xác minh an toàn' },
    { label: '🎣 Tấn công Phishing & 2FA', text: 'Kịch bản tấn công Phishing qua tin nhắn SMS Brandname giả mạo cổng dịch vụ công trực tuyến và cách xử lý sự cố' },
    { label: '📚 Liêm chính học thuật GenAI', text: 'Quy tắc trích dẫn nguồn và liêm chính học thuật khi sử dụng ChatGPT/Claude để hỗ trợ nghiên cứu khoa học theo TT 02/2025' },
    { label: '🌐 Văn hóa mạng Netiquette', text: 'Trách nhiệm công dân số và quy tắc ứng xử văn minh trên mạng xã hội, phòng chống bạo lực mạng Cyberbullying' }
  ];

  const handleRunAutoPilot = async () => {
    if (!prompt.trim()) {
      onShowToast?.('Chưa nhập thông tin', 'Vui lòng nhập chủ đề hoặc chọn một gợi ý mẫu.', 'warning');
      return;
    }

    setLoading(true);
    vibrateTap();
    soundFx.playClick();

    try {
      const res = await autopilotAuthoringService.generateFullSuite({
        prompt,
        domainKey: domainKey === 'AUTO' ? undefined : domainKey,
        cognitiveLevel: cognitiveLevel === 'AUTO' ? undefined : cognitiveLevel,
        difficulty,
        generateVariants: includeVariants
      });

      setResult(res);
      vibrateSuccess();
      soundFx.playSuccess();
      onShowToast?.('✨ Hoàn tất soạn thảo trọn gói!', 'Đã sinh câu hỏi, thẩm định pháp lý, đo lường IRT và tạo biến thể thành công.', 'success');
    } catch (err: any) {
      console.error('Autopilot authoring error:', err);
      onShowToast?.('Lỗi soạn thảo', err.message || 'Không thể hoàn tất soạn thảo toàn diện.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToBank = (withVariants = false) => {
    if (!result) return;
    vibrateTap();
    vibrateSuccess();
    soundFx.playSuccess();

    const { mainId, variantCount } = autopilotAuthoringService.saveQuestionFromSuite(result, withVariants);
    const totalCount = 1 + variantCount;

    onShowToast?.(
      'Thêm thành công vào Ngân hàng đề!',
      `Đã thêm ${totalCount} câu hỏi (${mainId}${variantCount > 0 ? ` + ${variantCount} biến thể` : ''}) vào ngân hàng đề thi.`,
      'success'
    );

    if (onSuccessAdded) {
      onSuccessAdded(totalCount);
    }
    onClose();
  };

  const handleCopyMarkdown = () => {
    if (!result) return;
    vibrateTap();
    soundFx.playClick();

    const mq = result.mainQuestion;
    const text = `### [BTI 2026] ${mq.question_text}
A. ${mq.options.A}
B. ${mq.options.B}
C. ${mq.options.C}
D. ${mq.options.D}

👉 Đáp án đúng: ${mq.correct_key}
📖 Lời giải: ${mq.explanation}
⚖️ Pháp lý: ${mq.legal_reference}
🏷️ Miền: ${mq.digital_competency_domain} (${mq.digital_sub_competency}) | Bậc: ${mq.cognitive_level}
🏷️ Tags: #${mq.tags.join(' #')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast?.('Đã sao chép', 'Nội dung câu hỏi đã được lưu vào clipboard.', 'info');
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn overflow-hidden modal-backdrop-isolated select-none"
      role="dialog"
      aria-modal="true"
      aria-label="AutoPilot Master Authoring Suite"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
          vibrateTap();
          soundFx.playClick();
        }
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full bg-[#160A2A]/95 fluent-acrylic-surface border border-amber-400/40 rounded-[6px] shadow-[0_24px_64px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen 
            ? 'h-[98dvh] max-w-[99vw] m-1' 
            : 'w-[96vw] lg:w-[92vw] xl:w-[88vw] max-w-6xl h-[88vh] min-h-[520px] max-h-[940px]'
        }`}
      >
        {/* Fluent Title Bar (Windows 11 Mica Bar) - Level with Gemini AI Studio */}
        <div className="min-h-[52px] sm:h-14 px-3 sm:px-4 py-2 sm:py-0 bg-[#120529]/95 border-b border-amber-400/30 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 shrink-0 select-none">
          {/* Brand & Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-[4px] bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-sm shrink-0">
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-white tracking-wide truncate">
                  AutoPilot 1-Click Master Authoring Suite
                </h2>
                <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded-[4px] shrink-0">
                  All-in-One Full Package
                </span>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950/40 border border-purple-500/30 px-1.5 py-0.5 rounded-[4px] hidden sm:inline-block">
                  TT 02/2025 • NĐ 13/2023
                </span>
              </div>
              <p className="text-[11px] text-[#B6A6D8]/80 hidden md:block truncate">
                Tự động hóa 7 khâu: Soạn thảo ➜ Sinh đáp án nhiễu ➜ Phân tầng TT 02/2025 ➜ Đối soát pháp lý ➜ Đo lường IRT ➜ 3 Biến thể
              </p>
            </div>
          </div>

          {/* Window Control Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <button
              type="button"
              onClick={() => {
                setIsFullscreen(!isFullscreen);
                vibrateTap();
              }}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-[4px] transition-colors cursor-pointer hidden sm:flex items-center justify-center"
              title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
              aria-label={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                vibrateTap();
                soundFx.playClick();
              }}
              className="h-8 sm:h-9 px-2.5 sm:px-3.5 bg-rose-500/25 hover:bg-rose-600 text-rose-100 hover:text-white border border-rose-500/40 hover:border-transparent rounded-[4px] transition-all flex items-center gap-1.5 cursor-pointer font-bold text-xs shadow-sm active:scale-95"
              title="Đóng hộp thoại (Phím Esc hoặc bấm ra ngoài)"
              aria-label="Đóng hộp thoại AutoPilot"
            >
              <X className="w-4 h-4 text-white" />
              <span className="font-sans">Đóng</span>
              <kbd className="hidden md:inline text-[9px] bg-black/40 px-1 py-0.2 rounded font-mono text-white/80">Esc</kbd>
            </button>
          </div>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          
          {/* Input & Configuration Section */}
          <div className="p-4 rounded-xl bg-black/40 border border-purple-500/30 space-y-3.5">
            <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
              <span className="font-bold flex items-center gap-1.5 text-amber-300">
                <Zap className="w-4 h-4 text-amber-400" />
                Nhập chủ đề, từ khóa hoặc yêu cầu câu hỏi:
              </span>
              <span className="text-[11px] text-purple-300">AI tự động phân tích và ôm trọn quy trình</span>
            </div>

            <div className="relative">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={2}
                placeholder="Ví dụ: Tình huống nhân viên công sở chia sẻ file danh sách khách hàng lên Google Drive công khai, vi phạm điều khoản nào trong Nghị định 13/2023/NĐ-CP..."
                className="w-full p-3 rounded-lg bg-black/50 border border-purple-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none font-sans"
              />
            </div>

            {/* Presets Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-mono">Gợi ý 1-click:</span>
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    setPrompt(p.text);
                  }}
                  className="px-2.5 py-1 rounded-full bg-purple-950/60 hover:bg-purple-900 text-purple-200 hover:text-white border border-purple-500/30 text-[11px] font-medium transition cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Options Bar */}
            <div className="pt-2 border-t border-purple-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Miền Năng Lực Số:</label>
                <select
                  value={domainKey}
                  onChange={e => setDomainKey(e.target.value)}
                  className="w-full p-1.5 rounded bg-black/50 border border-purple-500/30 text-xs text-white focus:outline-none"
                >
                  <option value="AUTO">✨ Tự động nhận diện</option>
                  <option value="MIEN_1">Miền I: Khai thác dữ liệu</option>
                  <option value="MIEN_2">Miền II: Giao tiếp số</option>
                  <option value="MIEN_3">Miền III: Sáng tạo nội dung</option>
                  <option value="MIEN_4">Miền IV: An toàn số</option>
                  <option value="MIEN_5">Miền V: Giải quyết vấn đề</option>
                  <option value="MIEN_6">Miền VI: Trí tuệ nhân tạo (AI)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Bậc Nhận Thức:</label>
                <select
                  value={cognitiveLevel}
                  onChange={e => setCognitiveLevel(e.target.value)}
                  className="w-full p-1.5 rounded bg-black/50 border border-purple-500/30 text-xs text-white focus:outline-none"
                >
                  <option value="AUTO">✨ Tự động phân tầng</option>
                  <option value="NHAN_BIET">Nhận biết (Bậc 1-2)</option>
                  <option value="THONG_HIEU">Thông hiểu (Bậc 3-4)</option>
                  <option value="VAN_DUNG">Vận dụng (Bậc 5-6)</option>
                  <option value="VAN_DUNG_CAO">Vận dụng cao (Bậc 7-8)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 mb-1">Độ Khó Khảo Thí:</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as any)}
                  className="w-full p-1.5 rounded bg-black/50 border border-purple-500/30 text-xs text-white focus:outline-none"
                >
                  <option value="EASY">Dễ (Chuẩn Nhận biết)</option>
                  <option value="MEDIUM">Trung bình (Chuẩn BTI)</option>
                  <option value="HARD">Khó (Phân loại cao)</option>
                  <option value="EXPERT">Chuyên sâu (Chung kết)</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleRunAutoPilot}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:brightness-110 text-slate-950 font-black font-mono text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-amber-500/30 disabled:opacity-50"
                >
                  <Zap className={`w-4 h-4 text-slate-950 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? 'Đang ôm trọn gói...' : '⚡ SINH TRỌN GÓI 1-CLICK'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Loading Animation */}
          {loading && (
            <div className="p-8 rounded-xl bg-purple-950/20 border border-amber-400/40 flex flex-col items-center justify-center gap-3 text-center animate-pulse">
              <div className="relative">
                <Cpu className="w-12 h-12 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                <Sparkles className="w-6 h-6 text-purple-400 absolute -top-1 -right-1 animate-ping" />
              </div>
              <div className="font-bold text-white text-sm">
                Master AutoPilot AI đang thực hiện trọn gói 7 công đoạn...
              </div>
              <div className="text-xs text-purple-200/70 max-w-md">
                1. Soạn thảo câu hỏi & phân tích nhiễu ➜ 2. Ánh xạ TT 02/2025 ➜ 3. Đối soát NĐ 13/2023 ➜ 4. Đo lường IRT 3PL ➜ 5. Sinh 3 biến thể ➜ 6. Chuyển đổi Đúng/Sai & Tự luận.
              </div>
            </div>
          )}

          {/* Results Master Dashboard */}
          {result && !loading && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Tab Navigation for Generated Package */}
              <div className="flex items-center gap-1.5 border-b border-purple-500/30 pb-2 overflow-x-auto text-xs font-mono">
                <button
                  type="button"
                  onClick={() => { vibrateTap(); setActiveResultTab('QUESTION'); }}
                  className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeResultTab === 'QUESTION'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-purple-200/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Câu Gốc & Phương Án Nhiễu</span>
                </button>

                <button
                  type="button"
                  onClick={() => { vibrateTap(); setActiveResultTab('LEGAL'); }}
                  className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeResultTab === 'LEGAL'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-purple-200/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Đối Soát Pháp Lý (NĐ 13 &amp; TT 02)</span>
                </button>

                <button
                  type="button"
                  onClick={() => { vibrateTap(); setActiveResultTab('PSYCHOMETRICS'); }}
                  className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeResultTab === 'PSYCHOMETRICS'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-purple-200/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Đo Lường IRT 3PL</span>
                </button>

                <button
                  type="button"
                  onClick={() => { vibrateTap(); setActiveResultTab('VARIANTS'); }}
                  className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeResultTab === 'VARIANTS'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-purple-200/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>3 Biến Thể Song Song ({result.variants?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => { vibrateTap(); setActiveResultTab('FORMATS'); }}
                  className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeResultTab === 'FORMATS'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-purple-200/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Đúng/Sai 4 Ý &amp; Tự Luận</span>
                </button>

                <button
                  type="button"
                  onClick={() => { vibrateTap(); setActiveResultTab('VOICE'); }}
                  className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    activeResultTab === 'VOICE'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-purple-200/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Kịch Bản MC Audio</span>
                </button>
              </div>

              {/* TAB 1: MAIN QUESTION & DISTRACTORS */}
              {activeResultTab === 'QUESTION' && (
                <div className="space-y-3.5">
                  {/* Metadata Chips */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="px-2.5 py-1 rounded bg-sky-950 text-sky-300 font-mono font-bold border border-sky-700/40">
                      {DIGITAL_COMPETENCY_DOMAINS[result.mainQuestion.digital_competency_domain]?.code} - {DIGITAL_COMPETENCY_DOMAINS[result.mainQuestion.digital_competency_domain]?.name}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 font-mono border border-indigo-700/40">
                      Mã {result.mainQuestion.digital_sub_competency}: {result.mainQuestion.sub_competency_name || 'Năng lực số'}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 font-mono font-bold border border-emerald-700/40">
                      {COGNITIVE_LEVELS[result.mainQuestion.cognitive_level]?.name || result.mainQuestion.cognitive_level}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-amber-950 text-amber-300 font-mono border border-amber-700/40">
                      ⏱️ {result.mainQuestion.time_limit}s • {result.mainQuestion.points} điểm
                    </span>
                  </div>

                  {/* Question Text */}
                  <div className="p-4 rounded-lg bg-black/40 border border-purple-500/30 text-sm font-semibold text-white leading-relaxed">
                    {result.mainQuestion.question_text}
                  </div>

                  {/* Options with Distractor Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {Object.entries(result.mainQuestion.options).map(([key, optText]) => {
                      const isCorrect = key === result.mainQuestion.correct_key;
                      const distractorReason = result.mainQuestion.distractor_analysis?.[key];
                      return (
                        <div
                          key={key}
                          className={`p-3 rounded-lg border transition ${
                            isCorrect
                              ? 'bg-emerald-950/40 border-emerald-500/60 text-white shadow-md shadow-emerald-950/40'
                              : 'bg-black/30 border-purple-500/20 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                                isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-purple-900/60 text-purple-300'
                              }`}>
                                {key}
                              </span>
                              <span className="font-medium text-xs">{optText}</span>
                            </div>
                            {isCorrect && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 font-bold font-mono text-[9.5px]">
                                ĐÚNG
                              </span>
                            )}
                          </div>

                          {distractorReason && (
                            <div className="text-[11px] text-amber-300/80 italic pt-1 border-t border-white/5">
                              ⚠️ <strong className="not-italic">Phân tích nhiễu:</strong> {distractorReason}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation & Legal */}
                  <div className="p-3.5 rounded-lg bg-purple-950/30 border border-purple-500/20 text-xs space-y-1.5">
                    <div className="font-bold text-purple-300 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      Lời giải chi tiết & Căn cứ chuẩn:
                    </div>
                    <div className="text-slate-300 leading-relaxed font-sans">
                      {result.mainQuestion.explanation}
                    </div>
                    <div className="text-amber-300 font-mono text-[11px] pt-1">
                      ⚖️ <strong>Căn cứ pháp lý:</strong> {result.mainQuestion.legal_reference}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-xs text-slate-400 font-mono">Thẻ tri thức:</span>
                    {result.mainQuestion.tags.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-purple-900/40 text-purple-200 font-mono text-[10px] border border-purple-500/20">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: LEGAL AUDIT */}
              {activeResultTab === 'LEGAL' && (
                <div className="p-4 rounded-lg bg-black/40 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2 font-mono">
                      <Scale className="w-4 h-4 text-amber-400" />
                      Kết Quả Thẩm Định Pháp Lý Chuyên Sâu (Deep Research)
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/40">
                      ✓ {result.legalAudit.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded bg-amber-950/20 border border-amber-500/20 space-y-1">
                      <span className="font-bold text-amber-300">Văn bản quy phạm áp dụng:</span>
                      <p className="text-slate-200 font-mono">{result.legalAudit.referencedDecree}</p>
                    </div>

                    <div className="p-3 rounded bg-amber-950/20 border border-amber-500/20 space-y-1">
                      <span className="font-bold text-amber-300">Điều khoản liên đới:</span>
                      <p className="text-slate-200 font-mono">{result.legalAudit.relevantArticles.join(', ')}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded bg-purple-950/20 border border-purple-500/20 text-xs space-y-1">
                    <span className="font-bold text-purple-300">Nhận xét tính chuẩn xác & phòng ngừa lỗi thời:</span>
                    <p className="text-slate-300 leading-relaxed">{result.legalAudit.legalNotes}</p>
                  </div>
                </div>
              )}

              {/* TAB 3: PSYCHOMETRICS & IRT 3PL */}
              {activeResultTab === 'PSYCHOMETRICS' && (
                <div className="p-4 rounded-lg bg-black/40 border border-sky-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2 font-mono">
                      <Activity className="w-4 h-4 text-sky-400" />
                      Dự Báo Tâm Lý Học Khảo Thí (Mô hình IRT 3PL)
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-xs font-bold">
                      Đánh giá: {result.psychometricEstimate.qualityRating}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded bg-sky-950/30 border border-sky-500/20 space-y-1">
                      <div className="text-[10px] text-slate-400 font-mono">ĐỘ KHÓ (b parameter)</div>
                      <div className="text-lg font-black text-sky-300 font-mono">
                        {result.psychometricEstimate.difficultyB > 0 ? `+${result.psychometricEstimate.difficultyB}` : result.psychometricEstimate.difficultyB}
                      </div>
                      <div className="text-[10px] text-slate-500">Thang chuẩn -3 đến +3</div>
                    </div>

                    <div className="p-3 rounded bg-emerald-950/30 border border-emerald-500/20 space-y-1">
                      <div className="text-[10px] text-slate-400 font-mono">ĐỘ PHÂN BIỆT (a parameter)</div>
                      <div className="text-lg font-black text-emerald-300 font-mono">
                        {result.psychometricEstimate.discriminationA}
                      </div>
                      <div className="text-[10px] text-slate-500">&gt; 1.5: Phân hóa cực tốt</div>
                    </div>

                    <div className="p-3 rounded bg-amber-950/30 border border-amber-500/20 space-y-1">
                      <div className="text-[10px] text-slate-400 font-mono">TỶ LỆ VƯỢT QUA DỰ KIẾN</div>
                      <div className="text-lg font-black text-amber-300 font-mono">
                        {result.psychometricEstimate.expectedPassRate}
                      </div>
                      <div className="text-[10px] text-slate-500">Đoán mò c: {result.psychometricEstimate.guessingC}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: 3 PARALLEL VARIANTS */}
              {activeResultTab === 'VARIANTS' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-300 font-mono">
                    3 mã đề biến thể song song cùng đo lường một chuẩn năng lực:
                  </div>
                  {result.variants?.map((v, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg bg-black/40 border border-purple-500/20 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-300 font-mono">
                        <span>{v.title || `Biến thể ${idx + 1}`}</span>
                        <span className="text-emerald-400">Đáp án: {v.correct_key}</span>
                      </div>
                      <div className="text-xs text-slate-200">{v.question_text}</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                        {Object.entries(v.options).map(([k, text]) => (
                          <div key={k} className={`p-1.5 rounded border truncate ${k === v.correct_key ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 font-bold' : 'bg-black/30 border-white/10 text-slate-400'}`}>
                            {k}. {text}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 5: ALTERNATIVE FORMATS */}
              {activeResultTab === 'FORMATS' && (
                <div className="space-y-3 text-xs">
                  {result.alternativeFormats?.trueFalse4 && (
                    <div className="p-3.5 rounded-lg bg-black/40 border border-purple-500/30 space-y-2">
                      <span className="font-bold text-purple-300 font-mono">1. Định dạng Đúng/Sai 4 ý (Bộ GD&amp;ĐT):</span>
                      <p className="text-slate-200">{result.alternativeFormats.trueFalse4.question_text}</p>
                      <div className="space-y-1 font-mono text-[11px]">
                        {Object.entries(result.alternativeFormats.trueFalse4.options).map(([k, text]) => (
                          <div key={k} className="p-1.5 rounded bg-black/30 border border-white/5 text-slate-300">
                            <strong>Ý {k}:</strong> {text}
                          </div>
                        ))}
                      </div>
                      <div className="text-emerald-300 font-mono font-bold text-[11px]">
                        Đáp án chuẩn: {result.alternativeFormats.trueFalse4.correct_key}
                      </div>
                    </div>
                  )}

                  {result.alternativeFormats?.shortAnswer && (
                    <div className="p-3.5 rounded-lg bg-black/40 border border-purple-500/30 space-y-1.5">
                      <span className="font-bold text-purple-300 font-mono">2. Định dạng Tự luận ngắn (Short Answer):</span>
                      <p className="text-slate-200">{result.alternativeFormats.shortAnswer.question_text}</p>
                      <div className="text-emerald-300 font-mono font-bold">
                        Từ khóa đáp án: {result.alternativeFormats.shortAnswer.correct_key}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: AUDIO MC SCRIPT */}
              {activeResultTab === 'VOICE' && (
                <div className="p-4 rounded-lg bg-black/40 border border-purple-500/30 space-y-2.5 text-xs">
                  <div className="font-bold text-amber-300 font-mono flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-amber-400" />
                    Kịch Bản MC &amp; Giọng Đọc AI Trực Tiếp:
                  </div>
                  <div className="p-3 rounded bg-purple-950/30 border border-purple-500/20 text-slate-200 font-sans leading-relaxed italic">
                    "{result.audioMCGuide?.mcSpeechScript}"
                  </div>
                  <div className="text-slate-400 font-mono text-[11px]">
                    Nhịp độ khuyến nghị: {result.audioMCGuide?.voicePacing}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-purple-500/30 bg-[#170836] flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            {result && (
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="px-3 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800 text-purple-200 font-mono flex items-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép đề thi'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition cursor-pointer"
            >
              Đóng
            </button>

            {result && (
              <>
                <button
                  type="button"
                  onClick={() => handleSaveToBank(false)}
                  className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-bold font-mono transition cursor-pointer shadow-md"
                >
                  📥 Thêm Câu Gốc
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveToBank(true)}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:brightness-110 text-slate-950 font-black font-mono flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-amber-500/30"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>🚀 Ôm Trọn Gói (Gốc + 3 Biến Thể)</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
