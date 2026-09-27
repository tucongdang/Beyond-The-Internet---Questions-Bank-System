import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  Terminal, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RotateCw, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  Download, 
  BookOpen, 
  ShieldCheck, 
  Zap, 
  Scale, 
  Target, 
  Cpu, 
  ListFilter,
  Plus
} from 'lucide-react';
import { 
  QuestionItem, 
  CompetitionStage, 
  CognitiveLevel, 
  DigitalCompetencyDomainKey, 
  QuestionRoundFormat 
} from '../../types';
import { 
  DIGITAL_COMPETENCY_DOMAINS, 
  COGNITIVE_LEVELS, 
  COMPETITION_STAGES,
  QUESTION_ROUND_FORMATS 
} from '../../data/digitalCompetencyData';
import { questionBankManager } from '../../services/questionBankManager';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateError } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface BulkQuestionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsAdded?: (questions: QuestionItem[]) => void;
}

export const BulkQuestionGeneratorModal: React.FC<BulkQuestionGeneratorModalProps> = ({
  isOpen,
  onClose,
  onQuestionsAdded
}) => {
  useLockBodyScroll(isOpen);

  // Form Configurations
  const [topic, setTopic] = useState<string>('Bảo mật tài khoản, xác thực 2 lớp (2FA) và phòng chống tấn công lừa đảo trực tuyến');
  const [quantity, setQuantity] = useState<number>(5);
  const [stage, setStage] = useState<CompetitionStage>('BAN_KET_1');
  const [domain, setDomain] = useState<DigitalCompetencyDomainKey>('MIEN_4');
  const [roundFormat, setRoundFormat] = useState<QuestionRoundFormat>('KHOI_DONG_RIENG');
  const [cognitiveLevel, setCognitiveLevel] = useState<string>('AUTO');
  const [legalReference, setLegalReference] = useState<string>('Khoản 2 Điều 4 Thông tư 02/2025/TT-BGDĐT & Nghị định 13/2023/NĐ-CP');
  const [customRequirements, setCustomRequirements] = useState<string>('Đưa ra các tình huống thực tiễn sinh viên đại học thường gặp.');

  // Execution States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<QuestionItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [stepsTimeline, setStepsTimeline] = useState<any[]>([]);
  const [agentName, setAgentName] = useState<string>('antigravity-preview-09-2026');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'QUESTIONS' | 'SANDBOX_STEPS'>('QUESTIONS');
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);

  // Editing single item state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);

  // Quick Presets for BTI 2026
  const BTI_PRESETS = [
    {
      title: 'Miền 4: An toàn & Bảo mật Số',
      domain: 'MIEN_4' as DigitalCompetencyDomainKey,
      topic: 'Nhận diện bẫy lừa đảo mạng xã hội, phòng chống Deepfake và bảo vệ mật khẩu OTP/Passkey',
      legal: 'Nghị định 13/2023/NĐ-CP & Thông tư 02/2025/TT-BGDĐT'
    },
    {
      title: 'Miền 3: Sáng tạo Nội dung & GenAI',
      domain: 'MIEN_3' as DigitalCompetencyDomainKey,
      topic: 'Sử dụng công cụ Trí tuệ Nhân tạo tạo sinh (GenAI) tuân thủ liêm chính học thuật và bản quyền số',
      legal: 'Thông tư 02/2025/TT-BGDĐT & Luật Sở hữu Trí tuệ'
    },
    {
      title: 'Miền 1: Dữ liệu & Thông tin Số',
      domain: 'MIEN_1' as DigitalCompetencyDomainKey,
      topic: 'Kỹ năng tìm kiếm tài liệu học thuật số, nhận diện tin giả (Fake News) và đánh giá độ tin cậy dữ liệu',
      legal: 'Khoản 1 Điều 3 Thông tư 02/2025/TT-BGDĐT'
    },
    {
      title: 'Miền 6: Ứng dụng AI & Công nghệ Mới',
      domain: 'MIEN_6' as DigitalCompetencyDomainKey,
      topic: 'Tư duy Prompt Engineering, ứng dụng AI giải quyết vấn đề thực tiễn và định hướng nghề nghiệp số',
      legal: 'Chuẩn năng lực số Châu Âu DigComp 2.2 & TT 02/2025'
    }
  ];

  // Global ESC key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating) {
        onClose();
        vibrateTap();
        soundFx.playClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isGenerating, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleApplyPreset = (preset: typeof BTI_PRESETS[0]) => {
    vibrateTap();
    soundFx.playClick();
    setDomain(preset.domain);
    setTopic(preset.topic);
    setLegalReference(preset.legal);
  };

  const handleGenerate = async () => {
    if (!topic.trim() || isGenerating) return;

    vibrateTap();
    soundFx.playClick();
    setIsGenerating(true);
    setErrorMsg(null);
    setGeneratedQuestions([]);
    setSelectedIndices(new Set());
    setStepsTimeline([]);
    setIsSavedSuccess(false);

    try {
      const res = await fetch('/api/ai/antigravity-bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          quantity,
          domain,
          stage,
          roundFormat,
          cognitiveLevel,
          legalReference: legalReference.trim(),
          customRequirements: customRequirements.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi sinh câu hỏi hàng loạt bằng Agent Antigravity.');
      }

      const qList: QuestionItem[] = data.questions || [];
      setGeneratedQuestions(qList);
      setAgentName(data.agent || 'antigravity-preview-09-2026');
      setStepsTimeline(data.steps || []);
      // Select all by default
      setSelectedIndices(new Set(qList.map((_, i) => i)));
      soundFx.playPacingChime('complete');
      vibrateSuccess();
    } catch (err: any) {
      console.error(err);
      soundFx.playError();
      vibrateError();
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ sinh câu hỏi Agent Antigravity.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleSelectAll = () => {
    vibrateTap();
    if (selectedIndices.size === generatedQuestions.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(generatedQuestions.map((_, i) => i)));
    }
  };

  const handleToggleSelect = (idx: number) => {
    vibrateTap();
    const next = new Set(selectedIndices);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedIndices(next);
  };

  const handleDeleteQuestion = (idx: number) => {
    vibrateTap();
    soundFx.playClick();
    const updated = generatedQuestions.filter((_, i) => i !== idx);
    setGeneratedQuestions(updated);
    const nextSelected = new Set<number>();
    selectedIndices.forEach(i => {
      if (i < idx) nextSelected.add(i);
      else if (i > idx) nextSelected.add(i - 1);
    });
    setSelectedIndices(nextSelected);
  };

  const handleSaveToBank = () => {
    if (selectedIndices.size === 0) return;
    vibrateSuccess();
    soundFx.playPacingChime('complete');

    const toSave = generatedQuestions.filter((_, i) => selectedIndices.has(i));
    toSave.forEach(q => {
      questionBankManager.addQuestion(q);
    });

    setIsSavedSuccess(true);
    if (onQuestionsAdded) {
      onQuestionsAdded(toSave);
    }

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleSaveEditedQuestion = () => {
    if (editingIndex === null || !editingQuestion) return;
    vibrateTap();
    const updated = [...generatedQuestions];
    updated[editingIndex] = editingQuestion;
    setGeneratedQuestions(updated);
    setEditingIndex(null);
    setEditingQuestion(null);
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-hidden select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Agent Antigravity Bulk Question Generator"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) {
          onClose();
          vibrateTap();
          soundFx.playClick();
        }
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-[#140827]/95 fluent-acrylic-surface border border-sky-500/40 rounded-[6px] shadow-[0_24px_64px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden max-w-6xl h-[90vh] min-h-[560px] max-h-[940px]"
      >
        {/* Top Header */}
        <div className="h-14 px-4 bg-[#0e041f]/95 border-b border-sky-500/20 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-[4px] bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 shadow-sm shrink-0">
              <Terminal className="w-4 h-4 text-sky-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide truncate">
                  Sinh Câu Hỏi Hàng Loạt • Agent Antigravity
                </h2>
                <span className="text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-1.5 py-0.5 rounded-[4px]">
                  BTI 2026 Sandbox
                </span>
              </div>
              <p className="text-[11px] text-white/60 hidden md:block truncate">
                Động cơ sinh bộ đề tự động kèm kiểm thử giải thuật &amp; phương án trắc nghiệm trong Remote Sandbox
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!isGenerating) {
                  onClose();
                  vibrateTap();
                  soundFx.playClick();
                }
              }}
              disabled={isGenerating}
              className="h-8 px-3 bg-rose-500/20 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/30 rounded-[4px] transition flex items-center gap-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              <span>Đóng</span>
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden bg-[#0A0218]/80 text-[#F5EFF9]">
          
          {/* Left Column: Generator Parameters */}
          <div className="w-full md:w-5/12 p-4 border-r border-white/10 flex flex-col gap-3.5 overflow-y-auto custom-scrollbar shrink-0">
            
            {/* Presets Row */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase font-bold text-sky-300 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-sky-400" />
                <span>Mẫu Cấu Hình Đề Thi 6 Miền Năng Lực</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {BTI_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    disabled={isGenerating}
                    className="text-left p-2 rounded-[2px] bg-white/[0.03] hover:bg-sky-500/10 border border-white/10 hover:border-sky-500/40 transition text-xs font-mono group cursor-pointer"
                  >
                    <div className="font-bold text-white text-[11px] group-hover:text-sky-300 truncate">
                      {p.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase font-bold text-white/70 tracking-wider block">
                Chủ đề / Yêu cầu trọng tâm <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={2}
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Nhập chủ đề khảo thí chi tiết..."
                disabled={isGenerating}
                className="w-full p-2.5 rounded-[2px] bg-black/60 border border-white/15 focus:border-sky-400 text-xs text-white outline-none resize-none font-mono"
              />
            </div>

            {/* Quantity & Domain Selector */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase font-bold text-white/70 tracking-wider mb-1 block">
                  Số lượng câu ({quantity} câu)
                </label>
                <select
                  value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value, 10))}
                  disabled={isGenerating}
                  className="w-full p-2 rounded-[2px] bg-black/60 border border-white/15 focus:border-sky-400 text-xs font-mono text-white outline-none"
                >
                  <option value={3}>3 câu hỏi</option>
                  <option value={5}>5 câu hỏi (Chuẩn lượt)</option>
                  <option value={10}>10 câu hỏi (Bộ đề)</option>
                  <option value={15}>15 câu hỏi (Vòng Bán Kết)</option>
                  <option value={20}>20 câu hỏi (Đầy đủ)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase font-bold text-white/70 tracking-wider mb-1 block">
                  Miền Năng Lực Số
                </label>
                <select
                  value={domain}
                  onChange={e => setDomain(e.target.value as DigitalCompetencyDomainKey)}
                  disabled={isGenerating}
                  className="w-full p-2 rounded-[2px] bg-black/60 border border-white/15 focus:border-sky-400 text-xs font-mono text-white outline-none"
                >
                  {Object.values(DIGITAL_COMPETENCY_DOMAINS).map(d => (
                    <option key={d.key} value={d.key}>
                      {d.code}: {d.name.slice(0, 22)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stage & Round Format */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase font-bold text-white/70 tracking-wider mb-1 block">
                  Vòng thi mục tiêu
                </label>
                <select
                  value={stage}
                  onChange={e => setStage(e.target.value as CompetitionStage)}
                  disabled={isGenerating}
                  className="w-full p-2 rounded-[2px] bg-black/60 border border-white/15 focus:border-sky-400 text-xs font-mono text-white outline-none"
                >
                  {Object.entries(COMPETITION_STAGES).map(([k, st]) => (
                    <option key={k} value={k}>{st.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase font-bold text-white/70 tracking-wider mb-1 block">
                  Phân bổ Cấp độ nhận thức
                </label>
                <select
                  value={cognitiveLevel}
                  onChange={e => setCognitiveLevel(e.target.value)}
                  disabled={isGenerating}
                  className="w-full p-2 rounded-[2px] bg-black/60 border border-white/15 focus:border-sky-400 text-xs font-mono text-white outline-none"
                >
                  <option value="AUTO">Tự động cân bằng 4 cấp độ</option>
                  <option value="NHAN_BIET">Nhận biết (NB)</option>
                  <option value="THONG_HIEU">Thông hiểu (TH)</option>
                  <option value="VAN_DUNG">Vận dụng (VD)</option>
                  <option value="VAN_DUNG_CAO">Vận dụng cao (VDC)</option>
                </select>
              </div>
            </div>

            {/* Legal Reference & Custom notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase font-bold text-white/70 tracking-wider block">
                Căn cứ pháp lý tham chiếu
              </label>
              <input
                type="text"
                value={legalReference}
                onChange={e => setLegalReference(e.target.value)}
                placeholder="VD: Thông tư 02/2025/TT-BGDĐT, Nghị định 13/2023/NĐ-CP..."
                disabled={isGenerating}
                className="w-full p-2 rounded-[2px] bg-black/60 border border-white/15 focus:border-sky-400 text-xs font-mono text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase font-bold text-white/70 tracking-wider block">
                Yêu cầu bổ sung cho Agent Antigravity
              </label>
              <input
                type="text"
                value={customRequirements}
                onChange={e => setCustomRequirements(e.target.value)}
                placeholder="VD: Kèm code snippet Python ngắn, chú trọng bảo mật..."
                disabled={isGenerating}
                className="w-full p-2 rounded-[2px] bg-black/60 border border-white/15 focus:border-sky-400 text-xs font-mono text-white outline-none"
              />
            </div>

            {/* Submit Action */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="w-full py-3 px-4 rounded-[3px] bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 disabled:opacity-50 text-white font-mono font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-sky-950/60 flex items-center justify-center gap-2 cursor-pointer active:scale-98 mt-auto"
            >
              {isGenerating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-white" />
                  <span>Agent Antigravity đang sinh &amp; kiểm thử...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current text-sky-200" />
                  <span>Sinh {quantity} Câu Hỏi Hàng Loạt (Sandbox)</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Generated Questions Output & Sandbox Inspector */}
          <div className="w-full md:w-7/12 flex flex-col h-full bg-[#080114] overflow-hidden">
            
            {/* Top Bar Switcher */}
            <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/10 flex items-center justify-between text-xs font-mono shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('QUESTIONS')}
                  className={`px-3 py-1 rounded-[2px] font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'QUESTIONS' ? 'bg-sky-500 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Kết Quả Câu Hỏi ({generatedQuestions.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('SANDBOX_STEPS')}
                  className={`px-3 py-1 rounded-[2px] font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'SANDBOX_STEPS' ? 'bg-sky-500 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Nhật Ký Sandbox ({stepsTimeline.length})</span>
                </button>
              </div>

              {generatedQuestions.length > 0 && activeTab === 'QUESTIONS' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="p-1 px-2 rounded bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition text-[10px] cursor-pointer border border-white/10"
                  >
                    {selectedIndices.size === generatedQuestions.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToBank}
                    disabled={selectedIndices.size === 0 || isSavedSuccess}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition flex items-center gap-1 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSavedSuccess ? 'Đã Lưu Thành Công!' : `Lưu (${selectedIndices.size}) Câu`}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
              
              {/* Loading State */}
              {isGenerating && (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-center text-white/60 py-16">
                  <div className="w-12 h-12 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
                  <div className="space-y-1">
                    <div className="text-sky-300 font-bold text-sm">Agent Antigravity đang sinh &amp; kiểm thử Sandbox</div>
                    <div className="text-xs text-white/50">Đang khởi tạo container, phân tích mã nguồn và xác minh tính duy nhất của đáp án...</div>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 rounded bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs font-mono flex items-start gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Empty Initial State */}
              {!isGenerating && generatedQuestions.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-center text-white/40 py-16">
                  <Terminal className="w-10 h-10 text-white/20" />
                  <p className="text-xs font-mono">Chưa có câu hỏi nào được sinh ra. Chọn chủ đề bên trái và nhấn nút "Sinh Câu Hỏi Hàng Loạt".</p>
                </div>
              )}

              {/* TAB 1: QUESTIONS LIST */}
              {!isGenerating && activeTab === 'QUESTIONS' && generatedQuestions.length > 0 && (
                <div className="space-y-3">
                  {generatedQuestions.map((q, idx) => {
                    const isSelected = selectedIndices.has(idx);
                    return (
                      <div 
                        key={q.id || idx}
                        className={`p-3.5 rounded-[4px] border transition relative ${
                          isSelected 
                            ? 'bg-[#15072B] border-sky-500/50 shadow-md' 
                            : 'bg-white/[0.02] border-white/10 opacity-70'
                        }`}
                      >
                        {/* Top Question Row */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(idx)}
                              className="w-4 h-4 rounded bg-black border-white/20 text-sky-500 focus:ring-0 cursor-pointer"
                            />
                            <span className="text-xs font-mono font-bold text-sky-300">
                              Câu {idx + 1}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200 border border-purple-400/30">
                              {q.cognitive_level || 'THONG_HIEU'}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                              {q.digital_competency_domain || domain}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingIndex(idx);
                                setEditingQuestion({ ...q });
                              }}
                              className="p-1 text-white/60 hover:text-white transition cursor-pointer"
                              title="Chỉnh sửa câu hỏi"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(idx)}
                              className="p-1 text-white/60 hover:text-rose-400 transition cursor-pointer"
                              title="Xóa câu hỏi này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Question Text */}
                        <p className="text-xs font-semibold text-white leading-relaxed mb-2.5">
                          {q.question_text}
                        </p>

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2.5">
                          {Object.entries(q.options || {}).map(([key, optText]) => {
                            const isCorrect = q.correct_key === key;
                            return (
                              <div
                                key={key}
                                className={`p-2 rounded text-xs flex items-start gap-2 ${
                                  isCorrect 
                                    ? 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 font-bold' 
                                    : 'bg-black/40 border border-white/5 text-white/80'
                                }`}
                              >
                                <span className={`w-4 h-4 rounded flex items-center justify-center font-bold text-[10px] shrink-0 font-mono ${
                                  isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-white'
                                }`}>
                                  {key}
                                </span>
                                <span className="leading-snug">{String(optText)}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation & Legal Ref */}
                        <div className="p-2 bg-black/40 rounded text-[11px] font-mono space-y-1 border border-white/5">
                          <div className="text-white/70">
                            <strong className="text-emerald-300">Giải thích:</strong> {q.explanation}
                          </div>
                          {q.legal_reference && (
                            <div className="text-amber-300/90 text-[10px] flex items-center gap-1 pt-0.5 border-t border-white/5">
                              <Scale className="w-3 h-3 text-amber-400" />
                              <span>Căn cứ: {q.legal_reference}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: SANDBOX TIMELINE STEPS */}
              {!isGenerating && activeTab === 'SANDBOX_STEPS' && (
                <div className="space-y-2 font-mono text-xs">
                  {stepsTimeline.length === 0 ? (
                    <div className="text-white/40 text-center py-8">Không có bản ghi bước sandbox nào.</div>
                  ) : (
                    stepsTimeline.map((st, i) => (
                      <div key={i} className="p-3 rounded bg-black/40 border border-white/10 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-sky-300">
                          <span className="flex items-center gap-1.5 uppercase">
                            <Terminal className="w-3.5 h-3.5 text-sky-400" />
                            <span>Bước {i + 1}: {st.type}</span>
                          </span>
                          {st.name && <span className="text-[10px] text-amber-300">{st.name}</span>}
                        </div>
                        {st.summary && <div className="text-white/80 font-sans">{st.summary}</div>}
                        {st.arguments && (
                          <pre className="text-[10px] p-2 rounded bg-black/60 border border-white/5 text-amber-200 overflow-x-auto">
                            {JSON.stringify(st.arguments, null, 2)}
                          </pre>
                        )}
                        {st.result && (
                          <pre className="text-[10px] p-2 rounded bg-black/60 border border-emerald-500/20 text-emerald-200 overflow-x-auto">
                            {typeof st.result === 'string' ? st.result : JSON.stringify(st.result, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inline Edit Modal */}
        {editingQuestion && (
          <div className="fixed inset-0 z-[99999999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="fluent-box p-5 max-w-lg w-full bg-[#1A0835] border border-amber-500/40 rounded space-y-3 text-xs font-mono text-white">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-bold text-amber-300 text-sm">Chỉnh sửa nhanh câu hỏi</span>
                <button onClick={() => setEditingQuestion(null)} className="text-white/60 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-[10px] text-white/70 block mb-1">Nội dung câu hỏi:</label>
                <textarea
                  rows={3}
                  value={editingQuestion.question_text}
                  onChange={e => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })}
                  className="w-full p-2 bg-black/60 border border-white/15 rounded text-white text-xs outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-white/70 block">4 Phương án &amp; Đáp án đúng:</label>
                {['A', 'B', 'C', 'D'].map(key => (
                  <div key={key} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion({ ...editingQuestion, correct_key: key })}
                      className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                        editingQuestion.correct_key === key ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-white'
                      }`}
                    >
                      {key}
                    </button>
                    <input
                      type="text"
                      value={editingQuestion.options?.[key] || ''}
                      onChange={e => setEditingQuestion({
                        ...editingQuestion,
                        options: { ...editingQuestion.options, [key]: e.target.value }
                      })}
                      className="flex-1 p-1.5 bg-black/60 border border-white/15 rounded text-white text-xs outline-none"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[10px] text-white/70 block mb-1">Giải thích:</label>
                <input
                  type="text"
                  value={editingQuestion.explanation}
                  onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  className="w-full p-1.5 bg-black/60 border border-white/15 rounded text-white text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-3 py-1.5 rounded bg-white/10 text-white"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedQuestion}
                  className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
