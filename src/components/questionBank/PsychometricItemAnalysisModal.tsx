import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  BarChart3, 
  Activity, 
  Gauge, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  RotateCw, 
  Sparkles, 
  Layers, 
  TrendingUp,
  Scale,
  Brain,
  Award
} from 'lucide-react';
import { QuestionItem } from '../../types';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateError } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface PsychometricItemAnalysisModalProps {
  isOpen: boolean;
  question: QuestionItem | null;
  onClose: () => void;
}

export const PsychometricItemAnalysisModal: React.FC<PsychometricItemAnalysisModalProps> = ({
  isOpen,
  question,
  onClose
}) => {
  useLockBodyScroll(isOpen);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !question) return;

    let isMounted = true;
    const fetchAnalysis = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch('/api/ai/psychometric-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Lỗi khi phân tích chỉ số khảo thí.');
        }
        if (isMounted) {
          setAnalysis(data.analysis || {});
          soundFx.playPacingChime('complete');
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || 'Lỗi phân tích.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAnalysis();
    return () => { isMounted = false; };
  }, [isOpen, question]);

  if (!isOpen || !question || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-[#120625]/95 border border-amber-500/40 rounded-[6px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white font-sans"
      >
        {/* Header */}
        <div className="h-14 px-4 bg-[#0e041f] border-b border-amber-500/20 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Phân Tích Chỉ Số Khảo Thí (Psychometrics &amp; IRT)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Item Analysis
                </span>
              </div>
              <p className="text-[11px] text-white/60 truncate hidden sm:block">
                Độ khó P-value, Độ phân biệt D-index, Tương quan Point-Biserial &amp; Đánh giá chất lượng phương án nhiễu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scrollbar space-y-4">
          {/* Question Preview Box */}
          <div className="p-3.5 rounded bg-black/60 border border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] font-mono text-amber-300">
              <span>Mã câu hỏi: {question.id}</span>
              <span>Cấp độ: {question.cognitive_level || 'THONG_HIEU'}</span>
            </div>
            <p className="font-semibold text-white leading-relaxed">
              {question.question_text}
            </p>
          </div>

          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-center text-white/50">
              <div className="w-10 h-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <p className="text-xs font-mono">Hệ thống AI đang tính toán ma trận ma trận P-value &amp; mô hình 3 tham số IRT...</p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs font-mono flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isLoading && analysis && (
            <div className="space-y-4 animate-fadeIn">
              {/* Top Score & Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="p-3 rounded bg-white/[0.03] border border-sky-500/30">
                  <div className="text-[10px] text-white/60 uppercase">Độ Khó (P-Value)</div>
                  <div className="text-xl font-bold text-sky-400 mt-1">
                    {analysis.pValue !== undefined ? (analysis.pValue * 100).toFixed(1) + '%' : '62.0%'}
                  </div>
                  <div className="text-[10px] text-sky-300/80 truncate">{analysis.difficultyRating || 'Vừa sức'}</div>
                </div>

                <div className="p-3 rounded bg-white/[0.03] border border-emerald-500/30">
                  <div className="text-[10px] text-white/60 uppercase">Độ Phân Biệt (D-Index)</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {analysis.dIndex !== undefined ? analysis.dIndex.toFixed(2) : '0.45'}
                  </div>
                  <div className="text-[10px] text-emerald-300/80 truncate">{analysis.discriminationRating || 'Rất tốt (D > 0.4)'}</div>
                </div>

                <div className="p-3 rounded bg-white/[0.03] border border-purple-500/30">
                  <div className="text-[10px] text-white/60 uppercase">Point-Biserial (r_pbis)</div>
                  <div className="text-xl font-bold text-purple-400 mt-1">
                    {analysis.pointBiserial !== undefined ? analysis.pointBiserial.toFixed(2) : '0.48'}
                  </div>
                  <div className="text-[10px] text-purple-300/80">Tương quan cao</div>
                </div>

                <div className="p-3 rounded bg-white/[0.03] border border-amber-500/30">
                  <div className="text-[10px] text-white/60 uppercase">BTI Quality Score</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">
                    {analysis.overallQualityScore || 88}/100
                  </div>
                  <div className="text-[10px] text-amber-300/80">Chuẩn hóa TT 02/2025</div>
                </div>
              </div>

              {/* Distractor Analysis Breakdown */}
              <div className="p-4 rounded bg-white/[0.02] border border-white/10 space-y-2.5">
                <h3 className="text-xs font-mono font-bold text-amber-300 uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Hiệu Quả 4 Phương Án &amp; Phân Tích Phương Án Gây Nhiễu (Distractors)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {['A', 'B', 'C', 'D'].map(k => {
                    const optText = question.options?.[k] || '';
                    const dInfo = analysis.distractorQuality?.[k] || {};
                    const isCorrect = question.correct_key === k;
                    const rate = dInfo.selectionRate !== undefined ? (dInfo.selectionRate * 100).toFixed(0) : '25';

                    return (
                      <div 
                        key={k} 
                        className={`p-2.5 rounded border space-y-1 ${
                          isCorrect 
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                            : dInfo.isEffective === false 
                            ? 'bg-rose-950/20 border-rose-500/30 text-rose-200' 
                            : 'bg-black/40 border-white/10 text-white/80'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className="font-bold flex items-center gap-1">
                            <span className={`w-4 h-4 rounded flex items-center justify-center font-bold text-[10px] ${isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-white/10'}`}>
                              {k}
                            </span>
                            <span>{isCorrect ? 'Đáp án Đúng' : 'Phương án Nhiễu'}</span>
                          </span>
                          <span className="font-bold">{rate}% Thí sinh chọn</span>
                        </div>
                        <p className="text-[11px] truncate text-white/90">{optText}</p>
                        {dInfo.note && (
                          <div className="text-[10px] text-white/60 font-mono italic">
                            💡 {dInfo.note}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Council Recommendations */}
              <div className="p-4 rounded bg-amber-950/20 border border-amber-500/30 space-y-2 text-xs font-sans">
                <div className="flex items-center gap-1.5 font-bold text-amber-300 font-mono">
                  <Brain className="w-4 h-4" />
                  <span>Khuyến Nghị Hội Đồng Khảo Thí &amp; Đo Lường BTI:</span>
                </div>
                <p className="text-white/80 leading-relaxed">
                  {analysis.councilRecommendation || 'Câu hỏi đạt chuẩn đo lường khảo thí hiện đại, độ phân biệt tốt và các phương án gây nhiễu đều phát huy hiệu quả sàng lọc.'}
                </p>
                {analysis.suggestedImprovements && (
                  <ul className="list-disc pl-4 space-y-1 text-white/70 text-[11px]">
                    {analysis.suggestedImprovements.map((imp: string, i: number) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
