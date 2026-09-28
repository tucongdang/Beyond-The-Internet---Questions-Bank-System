import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Download, 
  Printer, 
  FileText, 
  FileCode, 
  Copy, 
  Check, 
  FileCheck, 
  Sliders, 
  BookOpen, 
  ExternalLink,
  Layers,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { QuestionItem } from '../../types';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';
import { soundFx } from '../../services/audioEffects';
import { 
  ExportScope, 
  PdfExamLayout, 
  calculateExportStats, 
  generateJsonExport, 
  downloadJsonFile, 
  generatePrintableHtmlDocument, 
  printHtmlDocument, 
  downloadHtmlDocument,
  downloadWordDocument
} from '../../services/questionExportService';

export interface QuestionExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allQuestions: QuestionItem[];
  filteredQuestions: QuestionItem[];
  selectedQuestions: QuestionItem[];
  onOpenPrintPreview?: () => void;
  onToast?: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const QuestionExportModal: React.FC<QuestionExportModalProps> = ({
  isOpen,
  onClose,
  allQuestions,
  filteredQuestions,
  selectedQuestions,
  onOpenPrintPreview,
  onToast
}) => {
  useLockBodyScroll(isOpen);

  // Active Tab: PDF vs JSON
  const [activeTab, setActiveTab] = useState<'PDF' | 'JSON'>('PDF');

  // Scope: ALL vs FILTERED vs SELECTED
  const [scope, setScope] = useState<ExportScope>(() => {
    return selectedQuestions.length > 0 ? 'SELECTED' : 'FILTERED';
  });

  // Re-adjust scope if selectedQuestions change
  React.useEffect(() => {
    if (selectedQuestions.length > 0) {
      setScope('SELECTED');
    } else {
      setScope('FILTERED');
    }
  }, [selectedQuestions.length, isOpen]);

  // PDF Configuration State
  const [pdfLayout, setPdfLayout] = useState<PdfExamLayout>('STUDENT');
  const [institution, setInstitution] = useState<string>('BỘ GIÁO DỤC VÀ ĐÀO TẠO • BAN TỔ CHỨC BTI 2026');
  const [examTitle, setExamTitle] = useState<string>('ĐỀ THI ĐÁNH GIÁ NĂNG LỰC SỐ NGƯỜI HỌC 2026');
  const [examSubtitle, setExamSubtitle] = useState<string>('KỲ THI BEYOND THE INTERNET • THỜI GIAN LÀM BÀI: 45 PHÚT');
  const [includeStudentInfo, setIncludeStudentInfo] = useState<boolean>(true);
  const [includeLegalRef, setIncludeLegalRef] = useState<boolean>(true);
  const [includeQuickAnswerKey, setIncludeQuickAnswerKey] = useState<boolean>(true);
  const [includeCompetencyMatrix, setIncludeCompetencyMatrix] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<'compact' | 'standard' | 'large'>('standard');

  // JSON Configuration State
  const [includeAnswersInJson, setIncludeAnswersInJson] = useState<boolean>(true);
  const [includeExplanationsInJson, setIncludeExplanationsInJson] = useState<boolean>(true);
  const [includeMetadataEnvelope, setIncludeMetadataEnvelope] = useState<boolean>(true);
  const [prettyPrintJson, setPrettyPrintJson] = useState<boolean>(true);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Active questions dataset based on selected scope
  const targetQuestions = useMemo(() => {
    switch (scope) {
      case 'SELECTED':
        return selectedQuestions.length > 0 ? selectedQuestions : filteredQuestions;
      case 'ALL':
        return allQuestions;
      case 'FILTERED':
      default:
        return filteredQuestions;
    }
  }, [scope, selectedQuestions, filteredQuestions, allQuestions]);

  const stats = useMemo(() => {
    return calculateExportStats(targetQuestions);
  }, [targetQuestions]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  // Handle PDF Print / Save as PDF
  const handlePrintPdf = () => {
    if (targetQuestions.length === 0) {
      soundFx.playWarning();
      onToast?.('Không có câu hỏi', 'Vui lòng chọn ít nhất 1 câu hỏi để xuất PDF.', 'warning');
      return;
    }
    vibrateTap();
    soundFx.playClick();

    const html = generatePrintableHtmlDocument(targetQuestions, {
      scope,
      layout: pdfLayout,
      title: examTitle,
      institution,
      subtitle: examSubtitle,
      includeLegalRef,
      includeExplanation: pdfLayout === 'TEACHER',
      includeQuickAnswerKey,
      includeStudentInfoBox: includeStudentInfo,
      includeCompetencyMatrix,
      fontSize
    });

    printHtmlDocument(html);
    onToast?.('Đang mở bản in PDF', `Đã chuẩn bị tài liệu gồm ${targetQuestions.length} câu hỏi. Chọn 'Save as PDF' trong hộp thoại in để lưu tệp PDF.`, 'success');
  };

  // Handle Download Standalone Printable HTML
  const handleDownloadHtml = () => {
    if (targetQuestions.length === 0) return;
    vibrateSuccess();
    soundFx.playCorrect();

    const html = generatePrintableHtmlDocument(targetQuestions, {
      scope,
      layout: pdfLayout,
      title: examTitle,
      institution,
      subtitle: examSubtitle,
      includeLegalRef,
      includeExplanation: pdfLayout === 'TEACHER',
      includeQuickAnswerKey,
      includeStudentInfoBox: includeStudentInfo,
      includeCompetencyMatrix,
      fontSize
    });

    const now = new Date().toISOString().slice(0, 10);
    const filename = `BTI_2026_${pdfLayout}_${targetQuestions.length}Q_${now}.html`;
    downloadHtmlDocument(html, filename);

    onToast?.('Đã tải tài liệu ngoại tuyến', `Đã tải về tệp "${filename}" có thể mở trên mọi thiết bị mà không cần Internet.`, 'info');
  };

  // Handle Download Word Document (.doc)
  const handleDownloadWord = () => {
    if (targetQuestions.length === 0) return;
    vibrateSuccess();
    soundFx.playCorrect();

    const html = generatePrintableHtmlDocument(targetQuestions, {
      scope,
      layout: pdfLayout,
      title: examTitle,
      institution,
      subtitle: examSubtitle,
      includeLegalRef,
      includeExplanation: pdfLayout === 'TEACHER',
      includeQuickAnswerKey,
      includeStudentInfoBox: includeStudentInfo,
      includeCompetencyMatrix,
      fontSize
    });

    const now = new Date().toISOString().slice(0, 10);
    const filename = `BTI_2026_${pdfLayout}_${targetQuestions.length}Q_${now}.doc`;
    downloadWordDocument(html, filename);

    onToast?.('Đã xuất file Word', `Đã tải về tệp "${filename}" có thể mở và biên tập trực tiếp trong Microsoft Word hoặc Google Docs.`, 'success');
  };

  // Handle Download JSON
  const handleDownloadJson = () => {
    if (targetQuestions.length === 0) {
      soundFx.playWarning();
      onToast?.('Không có câu hỏi', 'Vui lòng chọn ít nhất 1 câu hỏi để xuất.', 'warning');
      return;
    }
    vibrateSuccess();
    soundFx.playCorrect();

    const { jsonString, filename, count } = generateJsonExport(targetQuestions, {
      scope,
      includeAnswers: includeAnswersInJson,
      includeExplanations: includeExplanationsInJson,
      includeMetadataEnvelope,
      pretty: prettyPrintJson
    });

    downloadJsonFile(jsonString, filename);
    onToast?.('Đã xuất JSON thành công', `Đã tải tệp "${filename}" chứa ${count} câu hỏi dữ liệu chuẩn BTI 2026.`, 'success');
  };

  // Handle Copy JSON to Clipboard
  const handleCopyJson = async () => {
    if (targetQuestions.length === 0) return;
    try {
      vibrateTap();
      soundFx.playClick();
      const { jsonString, count } = generateJsonExport(targetQuestions, {
        scope,
        includeAnswers: includeAnswersInJson,
        includeExplanations: includeExplanationsInJson,
        includeMetadataEnvelope,
        pretty: prettyPrintJson
      });

      await navigator.clipboard.writeText(jsonString);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2500);

      onToast?.('Đã sao chép vào Clipboard', `Đã sao chép dữ liệu JSON của ${count} câu hỏi vào bộ nhớ tạm.`, 'info');
    } catch {
      onToast?.('Lỗi sao chép', 'Không thể truy cập Clipboard của trình duyệt.', 'error');
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn overflow-hidden modal-backdrop-isolated select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Xuất Dữ Liệu Ngân Hàng Câu Hỏi"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
          vibrateTap();
          soundFx.playClick();
        }
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl h-[92vh] max-h-[940px] flex flex-col rounded-[8px] bg-[#140827]/98 fluent-acrylic-surface border border-theme-accent/40 shadow-[0_24px_64px_rgba(0,0,0,0.85)] text-slate-100 overflow-hidden font-sans"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#250D4D] border-b border-theme-accent/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow">
              <Download className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono tracking-wide text-white flex items-center gap-2">
                <span>XUẤT ĐỀ THI & DỮ LIỆU CÂU HỎI (EXPORT HUB)</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono border border-amber-400/30">
                  BTI 2026
                </span>
              </h2>
              <p className="text-[11px] text-purple-200/80">
                Chia sẻ ngoại tuyến, in ấn đề thi chuẩn khảo thí (PDF) hoặc sao lưu dữ liệu ngân hàng đề (JSON)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              onClose();
            }}
            className="w-8 h-8 rounded-[4px] bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer border border-white/10"
            title="Đóng (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="px-5 pt-3 bg-[#1D093B] border-b border-white/10 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              setActiveTab('PDF');
            }}
            className={`px-4 py-2 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'PDF'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>📄 Xuất Bản In & Tệp PDF</span>
          </button>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              setActiveTab('JSON');
            }}
            className={`px-4 py-2 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'JSON'
                ? 'border-sky-400 text-sky-300 bg-sky-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>🗄️ Xuất Tệp Dữ Liệu JSON</span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 text-xs">
          
          {/* 1. QUESTION SCOPE SELECTOR */}
          <div className="p-3.5 rounded-[6px] bg-black/40 border border-theme-accent/30 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>1. PHẠM VI CÂU HỎI XUẤT RA (QUESTION SCOPE)</span>
              </span>
              <span className="text-[11px] text-purple-200 font-sans">
                Đang chọn: <strong>{targetQuestions.length}</strong> câu
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono">
              {/* Option A: Filtered Questions */}
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  setScope('FILTERED');
                }}
                className={`p-2.5 rounded-[4px] border text-left flex flex-col justify-between transition cursor-pointer ${
                  scope === 'FILTERED'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[11px]">🔍 Danh sách lọc hiện tại</span>
                  {scope === 'FILTERED' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div className="text-[10.5px] text-slate-400 font-sans">
                  Các câu hỏi phù hợp bộ lọc đang xem
                </div>
                <div className="text-[12px] font-bold text-amber-300 mt-1">
                  {filteredQuestions.length} câu hỏi
                </div>
              </button>

              {/* Option B: Selected Questions */}
              <button
                type="button"
                disabled={selectedQuestions.length === 0}
                onClick={() => {
                  vibrateTap();
                  setScope('SELECTED');
                }}
                className={`p-2.5 rounded-[4px] border text-left flex flex-col justify-between transition ${
                  selectedQuestions.length === 0
                    ? 'opacity-40 cursor-not-allowed bg-black/20 border-white/5 text-slate-500'
                    : scope === 'SELECTED'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-sm cursor-pointer'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[11px]">✅ Các câu hỏi được chọn</span>
                  {scope === 'SELECTED' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="text-[10.5px] text-slate-400 font-sans">
                  {selectedQuestions.length > 0 ? 'Chỉ xuất các câu đã tích dấu chọn' : 'Chưa có câu hỏi nào được tích chọn'}
                </div>
                <div className="text-[12px] font-bold text-emerald-300 mt-1">
                  {selectedQuestions.length} câu hỏi
                </div>
              </button>

              {/* Option C: All Questions in Bank */}
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  setScope('ALL');
                }}
                className={`p-2.5 rounded-[4px] border text-left flex flex-col justify-between transition cursor-pointer ${
                  scope === 'ALL'
                    ? 'bg-purple-500/25 border-purple-400 text-purple-200 shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[11px]">🌐 Toàn bộ Ngân hàng đề</span>
                  {scope === 'ALL' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <div className="text-[10.5px] text-slate-400 font-sans">
                  Tất cả các câu hỏi trong hệ thống
                </div>
                <div className="text-[12px] font-bold text-purple-300 mt-1">
                  {allQuestions.length} câu hỏi
                </div>
              </button>
            </div>

            {/* Visual Demographic Breakdown Pills */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-[10.5px] font-mono">
              <span className="text-slate-400">Phân bố vòng thi:</span>
              {Object.entries(stats.byRound).map(([round, cnt]) => (
                <span key={round} className="px-2 py-0.5 rounded bg-white/10 text-purple-200 border border-white/10">
                  {round}: <strong>{cnt}</strong>
                </span>
              ))}
              {stats.withImages > 0 && (
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-200 border border-sky-500/30">
                  Media / Ảnh: <strong>{stats.withImages}</strong>
                </span>
              )}
            </div>
          </div>

          {/* TAB 1: PDF CONFIGURATION */}
          {activeTab === 'PDF' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Document Format & Layout */}
              <div className="p-3.5 rounded-[6px] bg-black/40 border border-theme-accent/30 space-y-3">
                <div className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-theme-accent" />
                  <span>2. HÌNH THỨC ĐỀ THI & MỤC ĐÍCH IN ẤN (PDF LAYOUT)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      setPdfLayout('STUDENT');
                    }}
                    className={`p-3 rounded-[4px] border text-left transition cursor-pointer flex flex-col justify-between ${
                      pdfLayout === 'STUDENT'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[11.5px] flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-amber-400" />
                          <span>Đề thi Thí sinh</span>
                        </span>
                        {pdfLayout === 'STUDENT' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <p className="text-[10.5px] text-slate-300 font-sans leading-snug">
                        Ẩn đáp án & lời giải. Có khung điền thông tin thí sinh (Họ tên, SBD) và ô khoanh trắc nghiệm.
                      </p>
                    </div>
                    <span className="mt-2 text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                      Student Exam Paper
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      setPdfLayout('TEACHER');
                    }}
                    className={`p-3 rounded-[4px] border text-left transition cursor-pointer flex flex-col justify-between ${
                      pdfLayout === 'TEACHER'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-sm'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[11.5px] flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-emerald-400" />
                          <span>Đáp án & Giám khảo</span>
                        </span>
                        {pdfLayout === 'TEACHER' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <p className="text-[10.5px] text-slate-300 font-sans leading-snug">
                        Đánh dấu đáp án đúng, kèm lời giải thích chi tiết, mức độ nhận thức và căn cứ pháp lý.
                      </p>
                    </div>
                    <span className="mt-2 text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                      Teacher / Examiner Key
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      setPdfLayout('MATRIX_ONLY');
                    }}
                    className={`p-3 rounded-[4px] border text-left transition cursor-pointer flex flex-col justify-between ${
                      pdfLayout === 'MATRIX_ONLY'
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sm'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[11.5px] flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-sky-400" />
                          <span>Hồ Sơ Khảo Thí</span>
                        </span>
                        {pdfLayout === 'MATRIX_ONLY' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                      <p className="text-[10.5px] text-slate-300 font-sans leading-snug">
                        Kèm bảng tổng hợp phân bổ 6 miền năng lực số và bảng đáp án nhanh ở cuối tài liệu.
                      </p>
                    </div>
                    <span className="mt-2 text-[10px] text-sky-300 font-bold uppercase tracking-wider">
                      Competency Audit Matrix
                    </span>
                  </button>
                </div>

                {/* Additional PDF Options */}
                <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={includeQuickAnswerKey}
                      onChange={(e) => setIncludeQuickAnswerKey(e.target.checked)}
                      className="accent-amber-400 cursor-pointer"
                    />
                    <span>Kèm bảng phiếu đáp án nhanh (Quick Answer Sheet)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={includeLegalRef}
                      onChange={(e) => setIncludeLegalRef(e.target.checked)}
                      className="accent-amber-400 cursor-pointer"
                    />
                    <span>Kèm căn cứ văn bản pháp lý (TT 02 & NĐ 13)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={includeCompetencyMatrix}
                      onChange={(e) => setIncludeCompetencyMatrix(e.target.checked)}
                      className="accent-amber-400 cursor-pointer"
                    />
                    <span>Kèm tóm tắt ma trận phân bổ năng lực số</span>
                  </label>

                  {pdfLayout === 'STUDENT' && (
                    <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                      <input
                        type="checkbox"
                        checked={includeStudentInfo}
                        onChange={(e) => setIncludeStudentInfo(e.target.checked)}
                        className="accent-amber-400 cursor-pointer"
                      />
                      <span>Khung thông tin Thí sinh (Họ tên, SBD, Lớp)</span>
                    </label>
                  )}
                </div>

                {/* Font Size & Header Customization */}
                <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10.5px] text-slate-400 mb-1 font-mono">Đơn vị / Trường học:</label>
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="w-full bg-black/60 border border-white/20 rounded px-2 py-1 text-white font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] text-slate-400 mb-1 font-mono">Tiêu đề đề thi:</label>
                    <input
                      type="text"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      className="w-full bg-black/60 border border-white/20 rounded px-2 py-1 text-white font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] text-slate-400 mb-1 font-mono">Cỡ chữ in:</label>
                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value as any)}
                      className="w-full bg-black/60 border border-white/20 rounded px-2 py-1 text-white font-mono text-[11px]"
                    >
                      <option value="compact">Nhỏ gọn (11pt)</option>
                      <option value="standard">Tiêu chuẩn (12pt)</option>
                      <option value="large">Lớn rõ nét (13pt)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JSON CONFIGURATION */}
          {activeTab === 'JSON' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 rounded-[6px] bg-black/40 border border-theme-accent/30 space-y-3">
                <div className="text-xs font-mono font-bold text-sky-300 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-sky-400" />
                  <span>2. CẤU HÌNH DỮ LIỆU JSON XUẤT RA</span>
                </div>

                <div className="space-y-2 text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={includeAnswersInJson}
                      onChange={(e) => setIncludeAnswersInJson(e.target.checked)}
                      className="accent-sky-400 cursor-pointer"
                    />
                    <span>Bao gồm đáp án đúng (Correct Answer Keys)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={includeExplanationsInJson}
                      onChange={(e) => setIncludeExplanationsInJson(e.target.checked)}
                      className="accent-sky-400 cursor-pointer"
                    />
                    <span>Bao gồm lời giải thích & phân tích sư phạm (Explanations)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={includeMetadataEnvelope}
                      onChange={(e) => setIncludeMetadataEnvelope(e.target.checked)}
                      className="accent-sky-400 cursor-pointer"
                    />
                    <span>Đóng gói cùng thông tin siêu dữ liệu BTI 2026 (Metadata & Statistics)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={prettyPrintJson}
                      onChange={(e) => setPrettyPrintJson(e.target.checked)}
                      className="accent-sky-400 cursor-pointer"
                    />
                    <span>Định dạng thụt lề dễ đọc (Pretty formatted - 2 spaces)</span>
                  </label>
                </div>

                {/* JSON Preview snippet */}
                <div className="p-2.5 rounded bg-black/60 border border-white/10 font-mono text-[10.5px] text-slate-400 overflow-x-auto">
                  <div className="text-sky-300 mb-1 font-bold">Mẫu định dạng JSON xuất ra:</div>
                  <pre className="text-emerald-400 text-[10px]">
{`{
  "project": "Beyond The Internet 2026 (BTI 2026)",
  "totalQuestions": ${targetQuestions.length},
  "exportScope": "${scope}",
  "questions": [
    {
      "id": "${targetQuestions[0]?.id || 'KD-01'}",
      "question_text": "${targetQuestions[0]?.question_text?.substring(0, 45) || 'Nội dung câu hỏi...'}...",
      "round_group": "${targetQuestions[0]?.round_group || 'KHOI_DONG'}",
      "options": { "A": "...", "B": "..." },
      ${includeAnswersInJson ? `"correct_key": "${targetQuestions[0]?.correct_key || 'A'}",` : ''}
      "digital_competency_domain": "${targetQuestions[0]?.digital_competency_domain || 'MIEN_4'}"
    }
    // ... và ${Math.max(0, targetQuestions.length - 1)} câu hỏi tiếp theo
  ]
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions Footer */}
        <div className="px-5 py-3.5 bg-[#190839] border-t border-theme-accent/30 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-purple-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Sẵn sàng xuất: <strong>{targetQuestions.length}</strong> câu hỏi</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap ml-auto">
            {activeTab === 'PDF' ? (
              <>
                {onOpenPrintPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      soundFx.playClick();
                      onClose();
                      onOpenPrintPreview();
                    }}
                    className="px-3 py-1.5 rounded-[4px] bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/20 text-xs font-mono transition cursor-pointer flex items-center gap-1.5"
                    title="Mở toàn màn hình giao diện xem trước bản in khổ A4 tương tác"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Xem Trước Khổ A4</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="px-3.5 py-1.5 rounded-[4px] bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/40 text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5"
                  title="Tải tệp HTML độc lập để mở và in trên mọi máy tính ngoại tuyến"
                >
                  <Download className="w-3.5 h-3.5 text-purple-300" />
                  <span>Tải HTML Ngoại Tuyến</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadWord}
                  className="px-3.5 py-1.5 rounded-[4px] bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 border border-sky-400/40 text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5"
                  title="Tải file Microsoft Word (.doc) chuẩn để mở và biên tập trực tiếp trong Word / Docs"
                >
                  <FileText className="w-3.5 h-3.5 text-sky-300" />
                  <span>Xuất File Word (.doc)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="px-4 py-1.5 rounded-[4px] bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 text-xs font-mono font-black transition cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-95"
                  title="Mở hộp thoại in của trình duyệt để in ra giấy hoặc Lưu thành file PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                  <span>IN / LƯU PDF NGAY (Save as PDF)</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-3.5 py-1.5 rounded-[4px] bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Đã Sao Chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                      <span>Sao Chép JSON</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="px-4 py-1.5 rounded-[4px] bg-gradient-to-r from-sky-400 to-blue-500 hover:brightness-110 text-slate-950 text-xs font-mono font-black transition cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                  <span>TẢI TỆP JSON ({targetQuestions.length} CÂU)</span>
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
