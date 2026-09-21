import os

code = '''import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Printer, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  Table, 
  FileText, 
  Eye, 
  EyeOff, 
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { QuestionItem } from '../../types';
import { vibrateTap } from '../../utils/hapticUtils';
import { soundFx } from '../../services/audioEffects';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestionItem[];
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  questions
}) => {
  useLockBodyScroll(isOpen);

  // Settings state
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [viewFormat, setViewFormat] = useState<'TABLE' | 'EXAM'>('TABLE');
  const [showAnswers, setShowAnswers] = useState<boolean>(true);
  const [viewPageMode, setViewPageMode] = useState<'ALL' | 'SINGLE'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [fontSize, setFontSize] = useState<'compact' | 'standard' | 'large'>('standard');

  // Chunk questions into pages
  const pageChunks = useMemo(() => {
    if (itemsPerPage <= 0) return [questions];
    const chunks: QuestionItem[][] = [];
    for (let i = 0; i < questions.length; i += itemsPerPage) {
      chunks.push(questions.slice(i, i + itemsPerPage));
    }
    return chunks.length > 0 ? chunks : [[]];
  }, [questions, itemsPerPage]);

  const totalPages = pageChunks.length;

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handlePrint = () => {
    soundFx.playClick();
    vibrateTap();
    window.print();
  };

  const getDifficultyText = (level?: string) => {
    switch (level) {
      case 'NHAN_BIET': return 'Nhận biết';
      case 'THONG_HIEU': return 'Thông hiểu';
      case 'VAN_DUNG': return 'Vận dụng';
      case 'VAN_DUNG_CAO': return 'Vận dụng cao';
      default: return level || 'N/A';
    }
  };

  const fontSizeClasses = {
    compact: 'text-xs leading-tight',
    standard: 'text-sm leading-normal',
    large: 'text-base leading-relaxed'
  }[fontSize];

  // Render a single A4 page sheet
  const renderA4Sheet = (pageQuestions: QuestionItem[], pageIndex: number) => {
    const startIdx = pageIndex * (itemsPerPage > 0 ? itemsPerPage : questions.length);

    return (
      <div 
        key={pageIndex}
        className="print-page bg-white text-black w-[210mm] max-w-[95vw] sm:max-w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none p-8 sm:p-10 print:p-0 border border-slate-300 print:border-none relative flex flex-col justify-between mb-8 print:mb-0 mx-auto rounded-sm print:rounded-none select-text"
        style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
      >
        <div>
          {/* Header Section */}
          <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
            <div>
              <div className="text-[11px] font-bold tracking-widest text-gray-500 uppercase font-mono mb-1">
                BEYOND THE INTERNET 2026 • HỆ THỐNG NGÂN HÀNG CÂU HỎI
              </div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-black">
                {viewFormat === 'EXAM' ? 'ĐỀ THI TỰ LUẬN & TRẮC NGHIỆM' : 'NGÂN HÀNG CÂU HỎI HỆ THỐNG'}
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                Khung năng lực số người học (TT 02/2025/TT-BGDĐT) & Quy định BTI 2026
              </p>
            </div>
            <div className="text-right shrink-0 font-mono text-xs text-gray-700">
              <div className="font-bold text-black">TRANG {pageIndex + 1} / {totalPages}</div>
              <div className="text-[11px] text-gray-500">Ngày xuất: {new Date().toLocaleDateString('vi-VN')}</div>
            </div>
          </div>

          {/* Render Table Format */}
          {viewFormat === 'TABLE' && (
            <table className={`w-full text-left border-collapse ${fontSizeClasses}`}>
              <thead>
                <tr className="bg-gray-100 border-b-2 border-black font-bold uppercase text-xs">
                  <th className="p-2 border border-gray-400 w-10 text-center">STT</th>
                  <th className="p-2 border border-gray-400 w-[42%]">Nội dung câu hỏi & Lựa chọn</th>
                  {showAnswers && <th className="p-2 border border-gray-400 w-[18%]">Đáp án</th>}
                  <th className="p-2 border border-gray-400 w-28">Phân loại</th>
                  <th className="p-2 border border-gray-400">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {pageQuestions.map((q, idx) => {
                  const globalIdx = startIdx + idx + 1;
                  return (
                    <tr key={q.id || idx} className="border-b border-gray-400 align-top break-inside-avoid">
                      <td className="p-2 border border-gray-400 text-center font-bold font-mono">
                        {globalIdx}
                      </td>
                      <td className="p-2 border border-gray-400">
                        <div className="font-medium whitespace-pre-wrap">{q.question_text}</div>
                        {q.options && Object.keys(q.options).length > 0 && (
                          <ul className="pl-4 mt-2 space-y-1 text-xs list-none border-t border-gray-200 pt-1.5">
                            {Object.entries(q.options).map(([k, opt]) => (
                              <li 
                                key={k} 
                                className={showAnswers && k === q.correct_key ? 'font-bold text-black underline decoration-gray-400' : 'text-gray-800'}
                              >
                                <span className="font-mono font-bold mr-1">{k}.</span> {opt}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      {showAnswers && (
                        <td className="p-2 border border-gray-400 font-bold whitespace-pre-wrap text-emerald-900 bg-emerald-50/30">
                          {q.correct_key ? (
                            <div>
                              <span className="font-mono text-sm bg-black text-white px-1.5 py-0.5 rounded mr-1">
                                {q.correct_key}
                              </span>
                              {q.options && q.options[q.correct_key] && (
                                <span className="text-xs font-normal text-gray-700 block mt-1">
                                  {q.options[q.correct_key]}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Chưa lập</span>
                          )}
                        </td>
                      )}
                      <td className="p-2 border border-gray-400 text-xs text-gray-700">
                        <div className="font-bold text-gray-900">{q.round_name || 'Khác'}</div>
                        <div className="text-[11px] text-gray-600">{getDifficultyText(q.cognitive_level)}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">{q.category}</div>
                      </td>
                      <td className="p-2 border border-gray-400 text-xs text-gray-600">
                        {q.legal_reference && (
                          <div className="text-[11px] font-mono text-gray-700">
                            <strong>Căn cứ:</strong> {q.legal_reference}
                          </div>
                        )}
                        {q.time_limit && (
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Thời gian: {q.time_limit}s
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {pageQuestions.length === 0 && (
                  <tr>
                    <td colSpan={showAnswers ? 5 : 4} className="p-8 text-center text-gray-500 italic border border-gray-400">
                      Không có câu hỏi nào ở trang này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* Render Exam Question Layout Format */}
          {viewFormat === 'EXAM' && (
            <div className={`space-y-6 ${fontSizeClasses}`}>
              {pageQuestions.map((q, idx) => {
                const globalIdx = startIdx + idx + 1;
                return (
                  <div key={q.id || idx} className="break-inside-avoid border-b border-gray-200 pb-4">
                    <div className="font-bold text-gray-900 mb-2 flex items-start gap-2">
                      <span className="font-mono bg-black text-white text-xs px-2 py-0.5 rounded shrink-0">
                        Câu {globalIdx}:
                      </span>
                      <span className="whitespace-pre-wrap">{q.question_text}</span>
                    </div>

                    {q.options && Object.keys(q.options).length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6 mt-2">
                        {Object.entries(q.options).map(([k, opt]) => (
                          <div 
                            key={k} 
                            className={`p-2 border rounded text-xs ${
                              showAnswers && k === q.correct_key 
                                ? 'border-black bg-gray-100 font-bold' 
                                : 'border-gray-300 text-gray-800'
                            }`}
                          >
                            <span className="font-mono font-bold mr-1.5">{k}.</span>
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {showAnswers && (
                      <div className="mt-2 pl-6 text-xs text-emerald-800 font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Đáp án đúng: <strong>{q.correct_key}</strong></span>
                        {q.explanation && (
                          <span className="text-gray-600 italic font-normal">• {q.explanation}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="pt-4 mt-8 border-t border-gray-300 flex justify-between items-center text-[11px] text-gray-500 font-mono">
          <div>BTI 2026 Question Bank • Bản in chính thức</div>
          <div>Trang {pageIndex + 1} / {totalPages}</div>
        </div>
      </div>
    );
  };

  const visibleChunks = viewPageMode === 'SINGLE' 
    ? [pageChunks[currentPage - 1] || []] 
    : pageChunks;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex flex-col bg-slate-900/95 backdrop-blur-md print:bg-white animate-fadeIn">
      {/* Top Controls Bar (Hidden during actual browser printing) */}
      <div className="bg-[#190839] border-b border-theme-accent/30 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 no-print shrink-0 shadow-2xl">
        {/* Title & Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[4px] bg-theme-accent/20 text-theme-accent flex items-center justify-center border border-theme-accent/30 shadow-inner shrink-0">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono tracking-wider flex items-center gap-2">
              <span>XEM TRƯỚC BẢN IN (A4)</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30 font-sans">
                {totalPages} Trang A4
              </span>
            </h2>
            <p className="text-[11px] text-[#B6A6D8] font-mono">
              Tổng số: {questions.length} câu hỏi • Chia {itemsPerPage} câu / trang
            </p>
          </div>
        </div>

        {/* Toolbar Settings Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Format Mode Selector */}
          <div className="flex items-center bg-black/40 p-1 rounded-[4px] border border-white/10 text-xs font-mono">
            <button
              onClick={() => { vibrateTap(); setViewFormat('TABLE'); }}
              className={`px-2.5 py-1 rounded-[3px] flex items-center gap-1.5 transition ${
                viewFormat === 'TABLE' 
                  ? 'bg-theme-accent text-[#190839] font-bold shadow' 
                  : 'text-white/70 hover:text-white'
              }`}
              title="Dạng Bảng Ma Trận"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Dạng Bảng</span>
            </button>
            <button
              onClick={() => { vibrateTap(); setViewFormat('EXAM'); }}
              className={`px-2.5 py-1 rounded-[3px] flex items-center gap-1.5 transition ${
                viewFormat === 'EXAM' 
                  ? 'bg-theme-accent text-[#190839] font-bold shadow' 
                  : 'text-white/70 hover:text-white'
              }`}
              title="Dạng Đề Thi Trắc Nghiệm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Dạng Đề Thi</span>
            </button>
          </div>

          {/* Items Per Page Dropdown */}
          <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-[4px] border border-white/10 text-xs font-mono text-white">
            <span className="text-[#B6A6D8] text-[11px] hidden sm:inline">Số câu/trang:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                vibrateTap();
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer border-none"
            >
              <option value={5} className="bg-[#190839] text-white">5 câu / trang</option>
              <option value={8} className="bg-[#190839] text-white">8 câu / trang</option>
              <option value={10} className="bg-[#190839] text-white">10 câu / trang</option>
              <option value={15} className="bg-[#190839] text-white">15 câu / trang</option>
              <option value={20} className="bg-[#190839] text-white">20 câu / trang</option>
              <option value={0} className="bg-[#190839] text-white">Toàn bộ (1 trang)</option>
            </select>
          </div>

          {/* Toggle Answer Key */}
          <button
            onClick={() => { vibrateTap(); setShowAnswers(!showAnswers); }}
            className={`px-2.5 py-1.5 rounded-[4px] border text-xs font-mono flex items-center gap-1.5 transition ${
              showAnswers 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
            }`}
            title={showAnswers ? "Đang HIỆN đáp án (Nhấn để Ẩn)" : "Đang ẨN đáp án (Nhấn để Hiện)"}
          >
            {showAnswers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{showAnswers ? 'Hiện Đáp Án' : 'Ẩn Đáp Án'}</span>
          </button>

          {/* View Page Mode Toggle (ALL vs SINGLE) */}
          <div className="flex items-center bg-black/40 p-1 rounded-[4px] border border-white/10 text-xs font-mono">
            <button
              onClick={() => { vibrateTap(); setViewPageMode('ALL'); }}
              className={`px-2 py-1 rounded-[3px] text-[11px] ${
                viewPageMode === 'ALL' ? 'bg-white/20 text-white font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              Tất cả trang
            </button>
            <button
              onClick={() => { vibrateTap(); setViewPageMode('SINGLE'); }}
              className={`px-2 py-1 rounded-[3px] text-[11px] ${
                viewPageMode === 'SINGLE' ? 'bg-white/20 text-white font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              Từng trang
            </button>
          </div>

          {/* Single Page Navigation Controls */}
          {viewPageMode === 'SINGLE' && totalPages > 1 && (
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-[4px] border border-white/10 text-xs font-mono text-white">
              <button
                disabled={currentPage <= 1}
                onClick={() => { vibrateTap(); setCurrentPage(p => Math.max(1, p - 1)); }}
                className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-1 text-[11px] font-bold">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => { vibrateTap(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <button
            onClick={() => { vibrateTap(); onClose(); }}
            className="px-3.5 py-1.5 border border-white/20 rounded-[4px] text-white/70 hover:text-white hover:bg-white/10 transition text-xs font-bold font-mono"
          >
            Đóng
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-theme-accent text-[#190839] hover:bg-white rounded-[4px] font-bold text-xs font-mono shadow-md flex items-center gap-2 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Ngay (Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* Print Preview Canvas Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center bg-slate-900/80 print:p-0 print:bg-white print:block">
        {viewPageMode === 'SINGLE' ? (
          renderA4Sheet(pageChunks[currentPage - 1] || [], currentPage - 1)
        ) : (
          pageChunks.map((chunk, idx) => renderA4Sheet(chunk, idx))
        )}
      </div>
    </div>,
    document.body
  );
};
'''

with open("src/components/questionBank/PrintPreviewModal.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated PrintPreviewModal.tsx successfully")
