import React from 'react';
import { createPortal } from 'react-dom';
import { X, Scale, CheckCircle2, AlertTriangle, Image as ImageIcon, Volume2, Video } from 'lucide-react';
import { QuestionItem } from '../../types';

interface QuestionCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: [QuestionItem, QuestionItem];
}

export const QuestionCompareModal: React.FC<QuestionCompareModalProps> = ({
  isOpen,
  onClose,
  questions
}) => {
  if (!isOpen || !questions || questions.length !== 2) return null;

  const [q1, q2] = questions;

  const renderMediaInfo = (q: QuestionItem) => {
    if (!q.media_type || q.media_type === 'NONE') return null;
    return (
      <div className="flex items-center gap-1.5 text-xs text-sky-300 bg-sky-950/40 px-2 py-1 rounded-[3px] border border-sky-500/30 w-max mt-2 font-mono">
        {q.media_type === 'IMAGE' && <ImageIcon className="w-3.5 h-3.5" />}
        {q.media_type === 'VIDEO' && <Video className="w-3.5 h-3.5" />}
        {q.media_type === 'AUDIO' && <Volume2 className="w-3.5 h-3.5" />}
        <span className="truncate max-w-[150px]" title={q.media_url}>{q.media_url || 'Đã đính kèm media'}</span>
      </div>
    );
  };

  const INTERNAL_KEYS = new Set([
    'kdTurn', 'obstacleImage', 'riskQuestion', 'riskAnswer',
    'clue1', 'ans1', 'clue2', 'ans2', 'clue3', 'ans3', 'clue4', 'ans4',
    'centerText', 'centerAnswer', '_raw'
  ]);

  const renderOptions = (q: QuestionItem) => {
    const isVcnv = q.round_group === 'VCNV' || q.round_type === 'VCNV' || q.round_format?.includes('VCNV') || Boolean(q.options && ('clue1' in q.options || 'obstacleImage' in q.options));
    const imgUrl = q.options?.obstacleImage || q.obstacle_info?.obstacleImage || (q.media_type === 'IMAGE' ? q.media_url : '') || (q as any).image_url;

    if (isVcnv) {
      return (
        <div className="space-y-1.5 mt-2">
          {imgUrl && (
            <img src={imgUrl} alt="VCNV" className="w-full h-24 object-cover rounded-[4px] border border-cyan-500/40" />
          )}
          <div className="text-xs text-amber-300 font-mono font-bold">
            🔑 Từ khóa: {q.correct_key || 'DEEPFAKE'}
          </div>
          {q.options?.clue1 && (
            <div className="text-[11px] text-white/70 font-sans">
              4 Hàng ngang &amp; Ô Mạo hiểm
            </div>
          )}
        </div>
      );
    }

    const validOptions = Object.entries(q.options || {}).filter(([k, v]) => !INTERNAL_KEYS.has(k) && v !== '' && v !== undefined && v !== null);

    if (validOptions.length === 0) {
      if (q.round_type === 'SHORT_ANSWER') {
        return (
          <div className="text-xs text-white/60 italic font-sans">
            (Câu hỏi điền khuyết / trả lời ngắn)
          </div>
        );
      }
      return null;
    }

    return (
      <div className="grid grid-cols-1 gap-1.5 mt-2">
        {imgUrl && (
          <img src={imgUrl} alt="Media" className="w-full h-24 object-cover rounded-[4px] border border-white/20 mb-1" />
        )}
        {validOptions.map(([key, val]) => {
          const isCorrect = q.correct_key?.toUpperCase().includes(key.toUpperCase());
          return (
            <div 
              key={key}
              className={`p-2 rounded-[4px] border text-xs flex items-start gap-2 ${
                isCorrect 
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                  : 'bg-white/5 border-white/10 text-white/80'
              }`}
            >
              <span className={`w-5 h-5 rounded-[3px] font-mono font-bold flex items-center justify-center shrink-0 text-[10px] ${
                isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-white/70'
              }`}>
                {key}
              </span>
              <span className="leading-snug">{String(val)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const calculateSimilarity = (str1: string, str2: string) => {
    if (!str1 || !str2) return 0;
    const tokenize = (s: string) => s.toLowerCase().replace(/[.,/#!$%^&*;:{}=-_~()""'']/g, "").split(/\s+/).filter(w => w.length > 2);
    const set1 = new Set(tokenize(str1));
    const set2 = new Set(tokenize(str2));
    if (set1.size === 0 && set2.size === 0) return 1;
    if (set1.size === 0 || set2.size === 0) return 0;
    
    let intersection = 0;
    for (const word of set1) {
      if (set2.has(word)) intersection++;
    }
    const union = set1.size + set2.size - intersection;
    return Math.round((intersection / union) * 100);
  };

  const simScore = calculateSimilarity(q1.question_text, q2.question_text);

  return createPortal(
    <div className="fluent-dialog-overlay fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fadeIn modal-backdrop-isolated select-none">
      <div 
        onClick={e => e.stopPropagation()}
        className="fluent-dialog w-full max-w-5xl max-h-[92vh] flex flex-col rounded-[8px] bg-[#190839] text-[#F5EFF9] shadow-2xl overflow-hidden font-sans select-text"
      >
        {/* Header */}
        <div className="fluent-dialog-header px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-[#f7cac9] flex items-center justify-center text-[#190839] font-bold shadow-sm">
              <Scale className="w-5 h-5 text-[#190839]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono leading-tight">So sánh nội dung câu hỏi</h2>
              <p className="text-xs text-[#B6A6D8] mt-0.5">Đối chiếu trực tiếp 2 câu hỏi để phát hiện trùng lặp</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="fluent-dialog-close-btn"
            title="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="fluent-dialog-body flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 custom-scrollbar">
          
          {/* Similarity Warning */}
          {simScore > 50 && (
            <div className="p-3.5 rounded-[6px] bg-amber-950/40 border border-amber-500/40 flex flex-col items-center justify-center text-center shadow-md">
              <AlertTriangle className="w-7 h-7 text-amber-400 mb-1.5" />
              <h3 className="text-sm font-bold text-amber-300 font-mono">Nội dung có độ tương đồng cao</h3>
              <p className="text-xs text-amber-200/90 mt-1">2 câu hỏi này có <strong className="tabular-nums">{simScore}%</strong> từ vựng giống nhau. Hãy kiểm tra kỹ xem có phải là 1 câu bị lặp không.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Question 1 */}
            <div className="fluent-question-box flex flex-col rounded-[6px] overflow-hidden">
              <div className="px-4 py-2 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <span className="font-mono text-xs text-white/60">ID: {q1.id}</span>
                <span className={`fluent-badge ${q1.approval_status === 'APPROVED' ? 'fluent-badge-success' : 'fluent-badge-warning'}`}>
                  {q1.approval_status || 'PENDING'}
                </span>
              </div>
              <div className="p-4 flex-1">
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  <span className="fluent-badge fluent-badge-accent">{q1.round_name || 'BTI 2026'}</span>
                  {q1.cognitive_level && <span className="fluent-badge">{q1.cognitive_level}</span>}
                </div>
                
                <h4 className="text-sm text-white font-semibold leading-relaxed mb-4">
                  {q1.question_text}
                </h4>
                
                {renderMediaInfo(q1)}
                {renderOptions(q1)}
                
                <div className="mt-4 p-3 fluent-box-nested rounded-[4px]">
                  <div className="text-[10px] text-white/50 mb-1 font-mono uppercase">Đáp án đúng</div>
                  <div className="text-xs font-bold text-emerald-400 font-mono">{q1.correct_key}</div>
                  <div className="text-[10px] text-white/50 mt-3 mb-1 font-mono uppercase">Giải thích</div>
                  <div className="text-[11px] text-white/80 leading-relaxed line-clamp-3" title={q1.explanation}>{q1.explanation || 'Không có giải thích'}</div>
                </div>
              </div>
            </div>

            {/* Question 2 */}
            <div className="fluent-question-box flex flex-col rounded-[6px] overflow-hidden">
              <div className="px-4 py-2 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <span className="font-mono text-xs text-white/60">ID: {q2.id}</span>
                <span className={`fluent-badge ${q2.approval_status === 'APPROVED' ? 'fluent-badge-success' : 'fluent-badge-warning'}`}>
                  {q2.approval_status || 'PENDING'}
                </span>
              </div>
              <div className="p-4 flex-1">
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  <span className="fluent-badge fluent-badge-accent">{q2.round_name || 'BTI 2026'}</span>
                  {q2.cognitive_level && <span className="fluent-badge">{q2.cognitive_level}</span>}
                </div>
                
                <h4 className="text-sm text-white font-semibold leading-relaxed mb-4">
                  {q2.question_text}
                </h4>

                {renderMediaInfo(q2)}
                {renderOptions(q2)}
                
                <div className="mt-4 p-3 fluent-box-nested rounded-[4px]">
                  <div className="text-[10px] text-white/50 mb-1 font-mono uppercase">Đáp án đúng</div>
                  <div className="text-xs font-bold text-emerald-400 font-mono">{q2.correct_key}</div>
                  <div className="text-[10px] text-white/50 mt-3 mb-1 font-mono uppercase">Giải thích</div>
                  <div className="text-[11px] text-white/80 leading-relaxed line-clamp-3" title={q2.explanation}>{q2.explanation || 'Không có giải thích'}</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="fluent-dialog-footer p-4 flex justify-end">
          <button 
            type="button"
            onClick={onClose}
            className="fluent-btn-primary px-6 py-2 text-xs font-mono font-bold"
          >
            Đóng bảng so sánh
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
