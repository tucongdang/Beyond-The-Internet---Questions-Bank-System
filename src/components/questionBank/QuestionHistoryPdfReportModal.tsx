import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Printer, 
  FileText, 
  Download, 
  Eye, 
  CheckCircle2, 
  Clock, 
  User, 
  GitCommit, 
  Scale, 
  Tag, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Layers, 
  Award, 
  Sparkles, 
  CheckSquare, 
  Square,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  Calendar,
  Share2,
  SlidersHorizontal
} from 'lucide-react';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { QuestionItem, QuestionVersion, QuestionActivityLog } from '../../types';
import { questionBankManager } from '../../services/questionBankManager';
import { DIGITAL_COMPETENCY_DOMAINS, COGNITIVE_LEVELS } from '../../data/digitalCompetencyData';
import { DIFFICULTY_CONFIGS } from './DifficultyBadgeAndMeter';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';
import { soundFx } from '../../services/audioEffects';

export interface QuestionHistoryPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: QuestionItem | null;
}

export const QuestionHistoryPdfReportModal: React.FC<QuestionHistoryPdfReportModalProps> = ({
  isOpen,
  onClose,
  question
}) => {
  useLockBodyScroll(isOpen);

  // Print settings
  const [zoomLevel, setZoomLevel] = useState<number>(95);
  const [includeDiffs, setIncludeDiffs] = useState<boolean>(true);
  const [includeLogs, setIncludeLogs] = useState<boolean>(true);
  const [includeLegal, setIncludeLegal] = useState<boolean>(true);
  const [includeSignOff, setIncludeSignOff] = useState<boolean>(true);
  const [ecoMode, setEcoMode] = useState<boolean>(false);
  const [paperSize, setPaperSize] = useState<'a4' | 'letter'>('a4');
  const [customExaminer, setCustomExaminer] = useState<string>('Hội đồng Chấm & Thẩm định BTI 2026');

  const reportRef = useRef<HTMLDivElement>(null);

  // Fetch all versions dynamically
  const versions: QuestionVersion[] = useMemo(() => {
    if (!question) return [];
    return questionBankManager.getQuestionVersions(question.id);
  }, [question, question?.versions]);

  // Activity logs
  const logs: QuestionActivityLog[] = useMemo(() => {
    if (!question) return [];
    return question.activity_logs || [];
  }, [question, question?.activity_logs]);

  // Printable Date Formats
  const reportDate = useMemo(() => {
    const now = new Date();
    return {
      full: now.toLocaleDateString('vi-VN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      iso: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  }, []);

  // Keyboard shortcut for print and escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !question) return null;
  if (typeof document === 'undefined') return null;

  const handlePrint = () => {
    soundFx.playClick();
    vibrateTap();
    window.print();
  };

  const cognitiveInfo = question.cognitive_level ? COGNITIVE_LEVELS[question.cognitive_level] : null;
  const domainInfo = question.digital_competency_domain ? DIGITAL_COMPETENCY_DOMAINS[question.digital_competency_domain] : null;
  const difficultyConf = DIFFICULTY_CONFIGS[question.cognitive_level || 'THONG_HIEU'];

  const correctOptionLetter = (question.correct_key || '').trim().toUpperCase();

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Modal Card */}
      <div 
        className="relative z-10 w-full max-w-6xl h-[94vh] flex flex-col rounded-xl bg-[#14062E] border border-theme-accent/35 shadow-2xl shadow-purple-950/80 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* TOP TOOLBAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#190839] border-b border-theme-accent/25 select-none shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-[4px] bg-red-500/20 text-red-400 border border-red-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                <span>Xuất Báo Cáo Lịch Sử &amp; Thẩm Định Câu Hỏi (PDF)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-theme-accent text-[#190839] font-mono font-bold">
                  {question.id}
                </span>
              </h2>
              <p className="text-[11px] text-[#B6A6D8] font-mono">
                Bản in chuẩn hóa A4 kèm lịch sử phiên bản, nhật ký thay đổi và chữ ký hội đồng
              </p>
            </div>
          </div>

          {/* Quick Toolbar Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-[#0c021c] p-0.5 rounded-[4px] border border-white/10 text-xs font-mono">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(60, prev - 10))}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 cursor-pointer"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 text-[11px] text-theme-accent font-bold w-10 text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(130, prev + 10))}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Print / Save PDF Button */}
            <button
              type="button"
              id="btn-print-pdf-report"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-[4px] bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-red-950/50 cursor-pointer transition active:scale-95"
              title="Mở hộp thoại In / Lưu thành tệp PDF (Ctrl+P)"
            >
              <Printer className="w-4 h-4" />
              <span>In / Lưu PDF</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[4px] bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 transition cursor-pointer"
              title="Đóng (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MAIN BODY: OPTIONS SIDEBAR + PDF PREVIEW CANVAS */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* LEFT: SETTINGS PANEL */}
          <div className="w-full md:w-72 bg-[#16062f] border-r border-white/10 p-3.5 space-y-4 overflow-y-auto shrink-0 select-none text-xs font-mono">
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 pb-2 border-b border-white/10 uppercase tracking-wider text-theme-accent">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Cấu hình xuất báo cáo</span>
              </h3>
            </div>

            {/* Section Toggles */}
            <div className="space-y-2">
              <span className="text-[11px] text-slate-400 font-bold block">Nội dung đính kèm:</span>
              
              <label className="flex items-center gap-2 p-2 rounded bg-black/30 border border-white/5 cursor-pointer hover:border-white/20 transition">
                <input 
                  type="checkbox" 
                  checked={includeDiffs} 
                  onChange={e => setIncludeDiffs(e.target.checked)}
                  className="rounded text-theme-accent focus:ring-0 cursor-pointer"
                />
                <span className="text-white">Bảng so sánh phiên bản (Diffs)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-black/30 border border-white/5 cursor-pointer hover:border-white/20 transition">
                <input 
                  type="checkbox" 
                  checked={includeLogs} 
                  onChange={e => setIncludeLogs(e.target.checked)}
                  className="rounded text-theme-accent focus:ring-0 cursor-pointer"
                />
                <span className="text-white">Nhật ký thẩm định &amp; Hoạt động</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-black/30 border border-white/5 cursor-pointer hover:border-white/20 transition">
                <input 
                  type="checkbox" 
                  checked={includeLegal} 
                  onChange={e => setIncludeLegal(e.target.checked)}
                  className="rounded text-theme-accent focus:ring-0 cursor-pointer"
                />
                <span className="text-white">Căn cứ pháp lý &amp; Tài liệu số</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-black/30 border border-white/5 cursor-pointer hover:border-white/20 transition">
                <input 
                  type="checkbox" 
                  checked={includeSignOff} 
                  onChange={e => setIncludeSignOff(e.target.checked)}
                  className="rounded text-theme-accent focus:ring-0 cursor-pointer"
                />
                <span className="text-white">Khung chữ ký Hội đồng Thẩm định</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-black/30 border border-white/5 cursor-pointer hover:border-white/20 transition">
                <input 
                  type="checkbox" 
                  checked={ecoMode} 
                  onChange={e => setEcoMode(e.target.checked)}
                  className="rounded text-theme-accent focus:ring-0 cursor-pointer"
                />
                <span className="text-white">Tiết kiệm mực (Đen trắng chuẩn)</span>
              </label>
            </div>

            {/* Paper Size */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <span className="text-[11px] text-slate-400 font-bold block">Khổ giấy:</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaperSize('a4')}
                  className={`p-1.5 rounded border text-center font-bold cursor-pointer transition ${
                    paperSize === 'a4' ? 'bg-theme-accent text-[#190839] border-theme-accent' : 'bg-black/30 border-white/10 text-slate-300'
                  }`}
                >
                  Khổ A4 (Chuẩn)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize('letter')}
                  className={`p-1.5 rounded border text-center font-bold cursor-pointer transition ${
                    paperSize === 'letter' ? 'bg-theme-accent text-[#190839] border-theme-accent' : 'bg-black/30 border-white/10 text-slate-300'
                  }`}
                >
                  US Letter
                </button>
              </div>
            </div>

            {/* Quick Metadata Info */}
            <div className="p-2.5 rounded bg-purple-950/40 border border-purple-500/20 space-y-1 text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Số phiên bản:</span>
                <span className="font-bold text-white">{versions.length} bản ghi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nhật ký thẩm định:</span>
                <span className="font-bold text-white">{logs.length} sự kiện</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trạng thái hiện tại:</span>
                <span className="font-bold text-emerald-400">
                  {question.approval_status === 'APPROVED' ? 'Đã phê duyệt' : 'Chờ duyệt'}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: PDF DOCUMENT PREVIEW CANVAS */}
          <div className="flex-1 bg-slate-900 p-4 sm:p-6 overflow-y-auto flex justify-center items-start">
            {/* The actual printable sheet */}
            <div 
              id="printable-question-history-report"
              ref={reportRef}
              style={{ 
                transform: `scale(${zoomLevel / 100})`, 
                transformOrigin: 'top center',
                width: paperSize === 'a4' ? '210mm' : '216mm',
                minHeight: paperSize === 'a4' ? '297mm' : '279mm'
              }}
              className={`bg-white text-slate-900 shadow-2xl p-8 sm:p-10 font-sans transition-transform duration-200 border border-slate-300 print:m-0 print:border-none print:shadow-none print:w-full print:p-6 ${
                ecoMode ? 'filter grayscale contrast-125' : ''
              }`}
            >
              {/* DOCUMENT HEADER */}
              <div className="border-b-2 border-slate-800 pb-4 mb-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-left">
                    <p className="text-[11px] font-bold tracking-wider text-slate-700 uppercase">
                      BỘ GIÁO DỤC VÀ ĐÀO TẠO • HỘI ĐỒNG THẨM ĐỊNH BTI 2026
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      HỘI THI ĐÁNH GIÁ NĂNG LỰC SỐ HỌC SINH (BEYOND THE INTERNET)
                    </p>
                  </div>
                  <div className="text-right font-mono text-[10.5px] text-slate-600">
                    <p className="font-bold text-slate-900">MÃ ĐỀ: <span className="text-red-700 font-black">{question.id}</span></p>
                    <p>Ngày xuất: {reportDate.iso} {reportDate.time}</p>
                  </div>
                </div>

                <div className="text-center mt-4">
                  <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                    PHIẾU THẨM ĐỊNH VÀ LỊCH SỬ PHIÊN BẢN CÂU HỎI
                  </h1>
                  <p className="text-xs text-slate-600 font-serif italic mt-0.5">
                    (Question Audit, Pedagogy Validation &amp; Version Evolution Report)
                  </p>
                </div>
              </div>

              {/* 1. BASIC QUESTION METADATA MATRIX */}
              <div className="mb-5 bg-slate-50 border border-slate-300 rounded p-3 text-xs">
                <h3 className="font-bold text-slate-900 text-xs uppercase mb-2 pb-1 border-b border-slate-200 flex items-center justify-between">
                  <span>1. THÔNG TIN ĐỊNH DANH &amp; PHÂN LOẠI SƯ PHẠM</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    question.approval_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {question.approval_status === 'APPROVED' ? '✓ ĐÃ PHÊ DUYỆT PHÁT HÀNH' : '• ĐANG CHỜ RÀ SOÁT / BẢN NHÁP'}
                  </span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-[11.5px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Phần thi (Round):</span>
                    <span className="font-bold text-slate-800">{question.round_name || 'Vòng thi BTI'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Mức độ nhận thức:</span>
                    <span className="font-bold text-slate-800">
                      {cognitiveInfo ? `${cognitiveInfo.name} (${difficultyConf?.label || 'Bậc'})` : (question.cognitive_level || 'Thông hiểu')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Điểm số &amp; Thời gian:</span>
                    <span className="font-bold text-slate-800">+{question.points || 10} điểm / {question.time_limit || 15}s</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block text-[10px]">Miền năng lực số (DigComp 2.2):</span>
                    <span className="font-bold text-slate-800">
                      {domainInfo ? `${domainInfo.name}` : (question.digital_competency_domain || 'Năng lực số')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Chủ đề & Danh mục:</span>
                    <span className="font-bold text-slate-800">{question.category || 'An toàn & Pháp luật số'}</span>
                  </div>
                </div>
              </div>

              {/* 2. CURRENT ACTIVE CONTENT (SNAPSHOT HIỆN TẠI) */}
              <div className="mb-5 border border-slate-300 rounded p-3 text-xs bg-white">
                <h3 className="font-bold text-slate-900 text-xs uppercase mb-2 pb-1 border-b border-slate-200">
                  2. NỘI DUNG CÂU HỎI HIỆN TẠI (ACTIVE REPOSITORY SNAPSHOT)
                </h3>

                {/* Prompt */}
                <div className="mb-3">
                  <span className="text-[10.5px] font-bold text-slate-600 block mb-1">Đề bài câu hỏi:</span>
                  <div className="p-3 bg-slate-50 rounded border border-slate-200 font-medium text-slate-900 leading-relaxed text-[12.5px]">
                    {question.question_text || '(Không có nội dung)'}
                  </div>
                </div>

                {/* Options / Answers */}
                {question.options && Object.keys(question.options).length > 0 && (
                  <div className="mb-3">
                    <span className="text-[10.5px] font-bold text-slate-600 block mb-1">Phương án lựa chọn &amp; Đáp án đúng:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[11.5px]">
                      {Object.entries(question.options)
                        .filter(([k]) => ['A', 'B', 'C', 'D'].includes(k.toUpperCase()))
                        .map(([key, val]) => {
                          const isCorrect = key.toUpperCase() === correctOptionLetter;
                          return (
                            <div 
                              key={key} 
                              className={`p-2 rounded border flex items-start gap-2 ${
                                isCorrect 
                                  ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-950' 
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                              }`}>
                                {key}
                              </span>
                              <span className="flex-1 font-sans">{String(val)}</span>
                              {isCorrect && (
                                <span className="text-[10px] font-bold text-emerald-700 font-mono shrink-0">
                                  [ĐÚNG]
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Pedagogical Explanation & Legal Citations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-[11px]">
                  <div>
                    <span className="font-bold text-slate-700 block mb-0.5">Lời giải &amp; Giải thích sư phạm:</span>
                    <p className="text-slate-800 leading-normal bg-slate-50 p-2 rounded border border-slate-200">
                      {question.explanation || '(Chưa có giải thích chi tiết)'}
                    </p>
                  </div>
                  {includeLegal && (
                    <div>
                      <span className="font-bold text-slate-700 block mb-0.5">Căn cứ pháp lý &amp; Tham chiếu:</span>
                      <p className="text-slate-800 leading-normal bg-slate-50 p-2 rounded border border-slate-200">
                        {question.legal_reference || 'Thông tư 08/2023/TT-BGDĐT, Luật An ninh mạng 2018.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. VERSION HISTORY AUDIT TABLE */}
              <div className="mb-5 border border-slate-300 rounded p-3 text-xs bg-white">
                <h3 className="font-bold text-slate-900 text-xs uppercase mb-2 pb-1 border-b border-slate-200 flex items-center justify-between">
                  <span>3. BẢNG TIẾN TRÌNH LỊCH SỬ PHIÊN BẢN (VERSION AUDIT TRAIL)</span>
                  <span className="text-[10px] font-mono text-slate-500 font-normal">
                    Tổng cộng: <strong>{versions.length}</strong> phiên bản
                  </span>
                </h3>

                <table className="w-full text-left border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-700">
                      <th className="p-1.5 font-bold">Phiên bản</th>
                      <th className="p-1.5 font-bold">Thời gian</th>
                      <th className="p-1.5 font-bold">Người thực hiện</th>
                      <th className="p-1.5 font-bold">Hành động / Thao tác</th>
                      <th className="p-1.5 font-bold text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {versions.map((ver, idx) => (
                      <tr key={ver.id || idx} className={idx === 0 ? 'bg-purple-50/50 font-bold' : ''}>
                        <td className="p-1.5 text-purple-900">
                          {ver.versionNumber ? `v${ver.versionNumber.toFixed(1)}` : `v1.${versions.length - idx}`}
                          {idx === 0 && <span className="ml-1 text-[9px] px-1 bg-purple-200 text-purple-800 rounded font-normal">Hiện hành</span>}
                        </td>
                        <td className="p-1.5 text-slate-600">
                          {new Date(ver.timestamp).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="p-1.5 text-slate-800">
                          {ver.modifiedBy || 'Hội đồng BTI'}
                        </td>
                        <td className="p-1.5 text-slate-700">
                          {ver.changeSummary || (idx === versions.length - 1 ? 'Khởi tạo câu hỏi ban đầu' : 'Cập nhật nội dung & sư phạm')}
                        </td>
                        <td className="p-1.5 text-right font-sans">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            (ver.snapshot?.approval_status || question.approval_status) === 'APPROVED' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {(ver.snapshot?.approval_status || question.approval_status) === 'APPROVED' ? 'Đã duyệt' : 'Chờ duyệt'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4. DETAILED VERSION DIFFS (SO SÁNH CHI TIẾT CÁC LẦN SỬA ĐỔI) */}
              {includeDiffs && versions.length > 1 && (
                <div className="mb-5 border border-slate-300 rounded p-3 text-xs bg-white">
                  <h3 className="font-bold text-slate-900 text-xs uppercase mb-2 pb-1 border-b border-slate-200">
                    4. CHI TIẾT THAY ĐỔI QUA CÁC PHIÊN BẢN (EVOLUTION DETAILS)
                  </h3>

                  <div className="space-y-3 font-sans text-[11.5px]">
                    {versions.slice(0, 3).map((ver, idx) => (
                      <div key={ver.id || idx} className="p-2.5 rounded bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between font-mono text-[11px] font-bold text-slate-800 mb-1 border-b border-slate-200 pb-1">
                          <span>Phiên bản v{ver.versionNumber ? ver.versionNumber.toFixed(1) : `1.${versions.length - idx}`} ({ver.changeSummary || 'Hiệu chỉnh'})</span>
                          <span className="text-slate-500 font-normal">
                            {new Date(ver.timestamp).toLocaleString('vi-VN')} • Bởi {ver.modifiedBy || 'Hệ thống'}
                          </span>
                        </div>
                        <p className="text-slate-700 italic">
                          "{ver.snapshot?.question_text || question.question_text}"
                        </p>
                        {ver.snapshot?.correct_key && (
                          <div className="mt-1 font-mono text-[10.5px] text-slate-600">
                            Đáp án ghi nhận: <strong>{ver.snapshot.correct_key}</strong> | Mức độ: <strong>{ver.snapshot?.cognitive_level || 'Thông hiểu'}</strong>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. ACTIVITY LOGS (NHẬT KÝ THẨM ĐỊNH) */}
              {includeLogs && logs.length > 0 && (
                <div className="mb-5 border border-slate-300 rounded p-3 text-xs bg-white">
                  <h3 className="font-bold text-slate-900 text-xs uppercase mb-2 pb-1 border-b border-slate-200">
                    5. NHẬT KÝ THẨM ĐỊNH &amp; PHÊ DUYỆT (AUDIT LOGS)
                  </h3>

                  <ul className="space-y-1.5 text-[11px]">
                    {logs.map((log, idx) => (
                      <li key={log.id || idx} className="flex items-start justify-between gap-2 p-1.5 bg-slate-50 rounded border border-slate-200">
                        <div>
                          <span className="font-bold text-slate-900 font-mono mr-2">[{log.action || 'HOẠT ĐỘNG'}]</span>
                          <span className="text-slate-700">{log.details || 'Thực hiện thẩm định tiêu chuẩn.'}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {new Date(log.timestamp).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 6. OFFICIAL SIGN-OFF CERTIFICATION BOX */}
              {includeSignOff && (
                <div className="mt-8 pt-4 border-t-2 border-slate-800 text-xs">
                  <div className="text-right text-[11px] font-serif italic text-slate-600 mb-3">
                    Hà Nội, {reportDate.full}
                  </div>
                  <div className="grid grid-cols-3 text-center gap-4 text-[11.5px]">
                    <div>
                      <p className="font-bold uppercase text-slate-800">NGƯỜI BIÊN SOẠN</p>
                      <p className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
                      <div className="h-16 flex items-end justify-center font-serif text-slate-600 italic">
                        {question.created_by || 'Hội đồng Biên soạn BTI'}
                      </div>
                    </div>

                    <div>
                      <p className="font-bold uppercase text-slate-800">THẨM ĐỊNH SƯ PHẠM</p>
                      <p className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
                      <div className="h-16 flex items-end justify-center font-serif text-slate-600 italic">
                        {customExaminer}
                      </div>
                    </div>

                    <div>
                      <p className="font-bold uppercase text-slate-800">TRƯỞNG BAN ĐỀ THI</p>
                      <p className="text-[10px] text-slate-500 italic">(Ký duyệt phát hành)</p>
                      <div className="h-16 flex items-end justify-center font-serif text-slate-600 italic">
                        Ban Chỉ Đạo BTI 2026
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* FOOTER NOTICE */}
              <div className="mt-8 pt-2 border-t border-slate-300 flex justify-between items-center text-[9.5px] text-slate-500 font-mono">
                <span>Hội thi Beyond The Internet (BTI 2026) • Bộ Giáo dục và Đào tạo</span>
                <span>Trang 1/1 • Mã kiểm tra: {question.id}-{Date.now().toString().slice(-6)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
