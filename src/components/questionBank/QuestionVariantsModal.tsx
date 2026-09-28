import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  Layers, 
  Copy, 
  Check, 
  CheckCircle2, 
  X, 
  RotateCw, 
  Plus, 
  AlertCircle, 
  ShieldAlert, 
  Cpu, 
  ArrowRight,
  Shuffle,
  FileCheck
} from 'lucide-react';
import { QuestionItem } from '../../types';
import { questionBankManager } from '../../services/questionBankManager';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateError } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface QuestionVariantsModalProps {
  isOpen: boolean;
  question: QuestionItem | null;
  onClose: () => void;
  onVariantsAdded?: (count: number) => void;
}

export const QuestionVariantsModal: React.FC<QuestionVariantsModalProps> = ({
  isOpen,
  question,
  onClose,
  onVariantsAdded
}) => {
  useLockBodyScroll(isOpen);

  const [strategy, setStrategy] = useState<'CONTEXT_DIVERSIFICATION' | 'NUMERICAL_PARAMETER_SHIFT' | 'DISTRACTOR_ENHANCEMENT'>('CONTEXT_DIVERSIFICATION');
  const [variantCount, setVariantCount] = useState<number>(3);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (!isOpen || !question || typeof document === 'undefined') return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    setVariants([]);
    setSelectedVariants(new Set());
    vibrateTap();
    soundFx.playClick();

    try {
      const res = await fetch('/api/ai/generate-question-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          variantCount,
          strategy
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi sinh biến thể câu hỏi.');
      }

      const list = data.variants || [];
      setVariants(list);
      setSelectedVariants(new Set(list.map((_: any, i: number) => i)));
      soundFx.playPacingChime('complete');
      vibrateSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ AI.');
      soundFx.playError();
      vibrateError();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleSelect = (idx: number) => {
    vibrateTap();
    const next = new Set(selectedVariants);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedVariants(next);
  };

  const handleSaveSelectedVariants = () => {
    if (selectedVariants.size === 0) return;
    vibrateSuccess();
    soundFx.playPacingChime('complete');

    let addedCount = 0;
    variants.forEach((v, idx) => {
      if (!selectedVariants.has(idx)) return;
      const newQuestion: QuestionItem = {
        id: `q_var_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        round_name: question.round_name || 'Vòng Thi BTI',
        round_type: question.round_type || 'MULTIPLE_CHOICE',
        category: question.category,
        question_text: v.question_text || `Biến thể câu hỏi ${idx + 1}`,
        options: v.options || question.options,
        correct_key: v.correct_key || question.correct_key,
        explanation: v.explanation || question.explanation,
        media_type: question.media_type || 'NONE',
        time_limit: question.time_limit || 30,
        stage: question.stage,
        round_format: question.round_format,
        cognitive_level: question.cognitive_level,
        digital_competency_domain: question.digital_competency_domain,
        digital_sub_competency: question.digital_sub_competency,
        legal_reference: question.legal_reference,
        approval_status: 'PENDING_REVIEW',
        created_by: 'AI Variant Generator (BTI 2026)',
        created_at: Date.now(),
        tags: [...(question.tags || []), 'variant', `base_${question.id.slice(0, 6)}`],
        likes: 0
      };

      questionBankManager.addQuestion(newQuestion);
      addedCount++;
    });

    if (onVariantsAdded) {
      onVariantsAdded(addedCount);
    }
    onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) onClose();
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl bg-[#130726]/95 border border-purple-500/40 rounded-[6px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white font-sans"
      >
        {/* Header */}
        <div className="h-14 px-4 bg-[#0e041f] border-b border-purple-500/20 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <Shuffle className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Bộ Sinh Biến Thể &amp; Phương Án Gây Nhiễu (Anti-Cheat)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  Gemini 3.1 Pro
                </span>
              </div>
              <p className="text-[11px] text-white/60 truncate hidden sm:block">
                Tạo các mã đề tương đương về năng lực số BTI 2026, chống lộ đề và phân tích độ bẫy tư duy
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left: Base Question & Config */}
          <div className="w-full md:w-5/12 p-4 border-r border-white/10 flex flex-col gap-3 overflow-y-auto custom-scrollbar shrink-0 bg-[#0c031c]">
            <div>
              <label className="text-[10px] font-mono uppercase font-bold text-purple-300 tracking-wider mb-1 block">
                Câu Hỏi Gốc Mục Tiêu [{question.id.slice(0, 8)}]
              </label>
              <div className="p-3 rounded bg-black/60 border border-purple-500/30 space-y-2 text-xs">
                <p className="font-semibold text-white leading-relaxed">
                  {question.question_text}
                </p>
                <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                  {Object.entries(question.options || {}).map(([k, v]) => (
                    <div 
                      key={k} 
                      className={`p-1.5 rounded ${question.correct_key === k ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 font-bold' : 'bg-white/5 text-white/70'}`}
                    >
                      <span className="font-bold mr-1">{k}:</span> {String(v)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Configs */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase font-bold text-white/70 tracking-wider block">
                Chiến lược sinh biến thể (Strategy)
              </label>
              <select
                value={strategy}
                onChange={e => setStrategy(e.target.value as any)}
                disabled={isGenerating}
                className="w-full p-2 bg-black/60 border border-white/15 rounded text-xs font-mono text-white outline-none focus:border-purple-400"
              >
                <option value="CONTEXT_DIVERSIFICATION">1. Đa dạng hóa Ngữ cảnh &amp; Tình huống thực tế</option>
                <option value="NUMERICAL_PARAMETER_SHIFT">2. Thay đổi Tham số / Đối tượng kỹ thuật số</option>
                <option value="DISTRACTOR_ENHANCEMENT">3. Nâng cấp Bẫy tư duy &amp; Phương án gây nhiễu</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase font-bold text-white/70 tracking-wider block">
                Số lượng biến thể ({variantCount} mã đề)
              </label>
              <div className="flex gap-2">
                {[2, 3, 4, 5].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setVariantCount(cnt)}
                    disabled={isGenerating}
                    className={`flex-1 py-1.5 rounded text-xs font-mono font-bold transition cursor-pointer ${
                      variantCount === cnt 
                        ? 'bg-purple-600 text-white shadow-sm' 
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {cnt} Biến thể
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-auto"
            >
              {isGenerating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-white" />
                  <span>Đang phân tích &amp; sinh biến thể...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Khởi Tạo {variantCount} Biến Thể Mã Đề</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Variants Result */}
          <div className="w-full md:w-7/12 flex flex-col h-full bg-[#080114] overflow-hidden">
            <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/10 flex items-center justify-between text-xs font-mono shrink-0">
              <span className="text-white/80 font-bold">
                Danh Sách Biến Thể Đề Thi ({variants.length})
              </span>
              {variants.length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveSelectedVariants}
                  disabled={selectedVariants.size === 0}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Lưu ({selectedVariants.size}) Biến Thể Vào Ngân Hàng</span>
                </button>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3">
              {isGenerating && (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-16 text-white/50">
                  <div className="w-10 h-10 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                  <p className="text-xs font-mono">Đang sinh các mã đề tương đương &amp; thẩm định phương án gây nhiễu...</p>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs font-mono flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {!isGenerating && variants.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-center text-white/40 py-16">
                  <Shuffle className="w-8 h-8 text-white/20" />
                  <p className="text-xs font-mono">Nhấn nút "Khởi Tạo Biến Thể" bên trái để bắt đầu sinh mã đề.</p>
                </div>
              )}

              {!isGenerating && variants.map((v, idx) => {
                const isSelected = selectedVariants.has(idx);
                return (
                  <div 
                    key={idx}
                    className={`p-3.5 rounded border transition space-y-2 text-xs ${
                      isSelected 
                        ? 'bg-[#1a0833] border-purple-500/60 shadow' 
                        : 'bg-white/[0.02] border-white/10 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(idx)}
                          className="w-4 h-4 rounded bg-black border-white/20 text-purple-600 focus:ring-0 cursor-pointer"
                        />
                        <span className="font-mono font-bold text-purple-300">
                          {v.variant_name || `Mã Đề Biến Thể #${idx + 1}`}
                        </span>
                        {v.similarity_to_base_pct && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                            Tương đồng ~{v.similarity_to_base_pct}%
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="font-semibold text-white leading-relaxed">
                      {v.question_text}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {Object.entries(v.options || {}).map(([key, val]) => (
                        <div 
                          key={key}
                          className={`p-2 rounded flex items-start gap-1.5 ${
                            v.correct_key === key 
                              ? 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 font-bold' 
                              : 'bg-black/40 border border-white/5 text-white/80'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded flex items-center justify-center font-bold text-[10px] shrink-0 font-mono ${
                            v.correct_key === key ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-white'
                          }`}>
                            {key}
                          </span>
                          <span className="leading-snug">{String(val)}</span>
                        </div>
                      ))}
                    </div>

                    {v.distractor_analysis && (
                      <div className="p-2 rounded bg-black/40 border border-purple-500/20 text-[10.5px] text-purple-200/90 font-mono">
                        <strong className="text-amber-300">Phân tích Bẫy Phương Án:</strong> {v.distractor_analysis}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
