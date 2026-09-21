import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Printer, 
  Table, 
  FileText, 
  Eye, 
  EyeOff, 
  Sliders,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  FileCheck,
  Settings2,
  GraduationCap,
  Sparkles,
  BookOpen,
  Info,
  CheckSquare,
  Square,
  HelpCircle,
  FileSpreadsheet,
  Image as ImageIcon,
  Layers,
  Zap,
  Key
} from 'lucide-react';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { QuestionItem } from '../../types';
import { vibrateTap } from '../../utils/hapticUtils';
import { soundFx } from '../../services/audioEffects';

export interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestionItem[];
  selectedQuestions?: QuestionItem[];
}

type DocumentFormat = 'EXAM' | 'TABLE' | 'ANSWER_KEY';
type PageOrientation = 'portrait' | 'landscape';
type PaperSize = 'a4' | 'letter' | 'a3';
type MarginSize = 'standard' | 'narrow' | 'wide';
type FontSizeChoice = 'compact' | 'standard' | 'large';
type PageScope = 'ALL' | 'CURRENT' | 'CUSTOM';

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  questions: initialQuestions,
  selectedQuestions = []
}) => {
  useLockBodyScroll(isOpen);

  // Scope: Filtered questions vs Selected questions
  const hasSelected = selectedQuestions.length > 0;
  const [useSelectionOnly, setUseSelectionOnly] = useState<boolean>(false);

  // Active question set based on scope
  const activeQuestions = useMemo(() => {
    if (useSelectionOnly && hasSelected) {
      return selectedQuestions;
    }
    return initialQuestions;
  }, [useSelectionOnly, hasSelected, selectedQuestions, initialQuestions]);

  // Settings state - Layout & Paper
  const [docFormat, setDocFormat] = useState<DocumentFormat>('EXAM');
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [paperSize, setPaperSize] = useState<PaperSize>('a4');
  const [marginSize, setMarginSize] = useState<MarginSize>('standard');
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [fontSize, setFontSize] = useState<FontSizeChoice>('standard');

  // Content options
  const [showAnswers, setShowAnswers] = useState<boolean>(true);
  const [showExplanations, setShowExplanations] = useState<boolean>(true);
  const [showLegalRef, setShowLegalRef] = useState<boolean>(true);
  const [showStudentInfo, setShowStudentInfo] = useState<boolean>(true);
  const [showHeaderFooter, setShowHeaderFooter] = useState<boolean>(true);
  const [ecoInkMode, setEcoInkMode] = useState<boolean>(false);

  // Custom Header Text
  const [institutionName, setInstitutionName] = useState<string>('BỘ GIÁO DỤC VÀ ĐÀO TẠO • HỘI ĐỒNG THI BTI');
  const [examTitle, setExamTitle] = useState<string>('ĐỀ THI ĐÁNH GIÁ NĂNG LỰC SỐ NGƯỜI HỌC 2026');
  const [examSubtitle, setExamSubtitle] = useState<string>('MÃ ĐỀ: 101 • THỜI GIAN LÀM BÀI: 45 PHÚT');

  // Preview Navigation & Zoom
  const [viewPageMode, setViewPageMode] = useState<'ALL' | 'SINGLE'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(90); // percentage: 50% to 130%
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Page Scope
  const [pageScope, setPageScope] = useState<PageScope>('ALL');
  const [customPageRange, setCustomPageRange] = useState<string>('');

  // Auto-switch to landscape if user chooses Table format and vice versa
  const handleFormatChange = (fmt: DocumentFormat) => {
    vibrateTap();
    soundFx.playClick();
    setDocFormat(fmt);
    if (fmt === 'TABLE') {
      setOrientation('landscape');
      setItemsPerPage(6);
    } else if (fmt === 'ANSWER_KEY') {
      setOrientation('portrait');
      setItemsPerPage(0); // continuous or full
    } else {
      setOrientation('portrait');
      setItemsPerPage(5);
    }
  };

  // Keyboard shortcut for print and escape
  useEffect(() => {
    if (!isOpen) return;

    if (selectedQuestions.length > 0) {
      setUseSelectionOnly(true);
    } else {
      setUseSelectionOnly(false);
    }

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
  }, [isOpen, selectedQuestions.length]);

  // Chunk questions into pages
  const pageChunks = useMemo(() => {
    if (activeQuestions.length === 0) return [[]];
    if (itemsPerPage <= 0 || docFormat === 'ANSWER_KEY') {
      // In answer key or continuous mode, single/dynamic chunk
      return [activeQuestions];
    }
    const chunks: QuestionItem[][] = [];
    for (let i = 0; i < activeQuestions.length; i += itemsPerPage) {
      chunks.push(activeQuestions.slice(i, i + itemsPerPage));
    }
    return chunks.length > 0 ? chunks : [[]];
  }, [activeQuestions, itemsPerPage, docFormat]);

  const totalPages = pageChunks.length;

  // Validate current page bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Helper to parse page range (e.g. "1-2, 4")
  const parsedPrintPages = useMemo(() => {
    if (pageScope === 'ALL') {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (pageScope === 'CURRENT') {
      return [currentPage];
    }
    // CUSTOM
    if (!customPageRange.trim()) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = new Set<number>();
    const tokens = customPageRange.split(/[,;\s]+/);
    for (const t of tokens) {
      if (!t) continue;
      if (t.includes('-')) {
        const [sStr, eStr] = t.split('-');
        const s = parseInt(sStr, 10);
        const e = parseInt(eStr, 10);
        if (!isNaN(s) && !isNaN(e)) {
          for (let p = Math.max(1, Math.min(s, e)); p <= Math.min(totalPages, Math.max(s, e)); p++) {
            pages.add(p);
          }
        }
      } else {
        const p = parseInt(t, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          pages.add(p);
        }
      }
    }
    return pages.size > 0 ? Array.from(pages).sort((a, b) => a - b) : Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [pageScope, customPageRange, totalPages, currentPage]);

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
      default: return level || 'Cơ bản';
    }
  };

  // Font size classes for document
  const fontSizeClasses = {
    compact: 'text-[11px] leading-tight',
    standard: 'text-[12.5px] leading-snug',
    large: 'text-[14px] leading-relaxed'
  }[fontSize];

  // Paper margin classes
  const marginPaddingClasses = {
    narrow: 'p-4 sm:p-5',
    standard: 'p-6 sm:p-8',
    wide: 'p-8 sm:p-10'
  }[marginSize];

  // Paper size dimension specs in mm
  const paperDimensions = {
    a4: orientation === 'portrait' ? { width: '210mm', minHeight: '297mm' } : { width: '297mm', minHeight: '210mm' },
    letter: orientation === 'portrait' ? { width: '216mm', minHeight: '279mm' } : { width: '279mm', minHeight: '216mm' },
    a3: orientation === 'portrait' ? { width: '297mm', minHeight: '420mm' } : { width: '420mm', minHeight: '297mm' }
  }[paperSize];

  // Internal keys to filter out from standard multiple-choice option listings
  const INTERNAL_OPTION_KEYS = new Set([
    'kdTurn', 'obstacleImage', 'riskQuestion', 'riskAnswer',
    'clue1', 'ans1', 'clue2', 'ans2', 'clue3', 'ans3', 'clue4', 'ans4',
    'centerText', 'centerAnswer', '_raw'
  ]);

  // Helper to extract image URL from various potential question properties
  const getQuestionImageUrl = (q: QuestionItem): string => {
    if (q.options?.obstacleImage && typeof q.options.obstacleImage === 'string' && q.options.obstacleImage.trim()) {
      return q.options.obstacleImage.trim();
    }
    if (q.obstacle_info?.obstacleImage && typeof q.obstacle_info.obstacleImage === 'string' && q.obstacle_info.obstacleImage.trim()) {
      return q.obstacle_info.obstacleImage.trim();
    }
    if (q.media_url && typeof q.media_url === 'string' && q.media_url.trim()) {
      return q.media_url.trim();
    }
    if ((q as any).image_url && typeof (q as any).image_url === 'string' && (q as any).image_url.trim()) {
      return (q as any).image_url.trim();
    }
    return '';
  };

  // Helper to check if a question is VCNV (Vượt Chướng Ngại Vật)
  const isVcnvQuestion = (q: QuestionItem): boolean => {
    const roundGrp = q.round_group || '';
    const roundType = q.round_type || '';
    const roundFormat = q.round_format || '';
    const cat = q.category || '';
    if (roundGrp === 'VCNV' || roundType === 'VCNV' || roundFormat.includes('VCNV') || cat.includes('VCNV')) {
      return true;
    }
    if (q.obstacle_info && (q.obstacle_info.obstacleKey || q.obstacle_info.obstacleImage)) {
      return true;
    }
    if (q.options && ('clue1' in q.options || 'ans1' in q.options || 'riskQuestion' in q.options || 'obstacleImage' in q.options)) {
      return true;
    }
    return false;
  };

  // Render VCNV structured content for Exam and Table views
  const renderVcnvContent = (q: QuestionItem, showAnswersMode: boolean, isTableMode: boolean) => {
    const kw = (q.correct_key || q.obstacle_info?.obstacleKey || q.options?.riskAnswer || q.options?.centerAnswer || 'DEEPFAKE').toUpperCase();
    const kwLen = kw.replace(/\s/g, '').length;
    const rQ = q.options?.riskQuestion;
    const rA = q.options?.riskAnswer;
    const centerText = q.options?.centerText;
    const centerAns = q.options?.centerAnswer;
    const imgUrl = getQuestionImageUrl(q);

    return (
      <div className={`space-y-2 mt-2 pt-2 border-t border-gray-300 break-inside-avoid ${isTableMode ? 'text-xs' : ''}`}>
        {/* VCNV Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50/70 p-2 rounded border border-amber-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
            <Layers className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>BỘ CÂU HỎI VƯỢT CHƯỚNG NGẠI VẬT (7 HÀNG CHUẨN)</span>
          </div>
          {showAnswersMode && (
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-gray-600 font-bold">Từ khóa CNV:</span>
              <span className="bg-black text-white px-2 py-0.5 rounded font-black tracking-wider text-xs">
                {kw}
              </span>
              <span className="text-[10.5px] text-amber-800 font-semibold">({kwLen} chữ cái)</span>
            </div>
          )}
        </div>

        {/* ẢNH GỢI Ý CHƯỚNG NGẠI VẬT */}
        {imgUrl && (
          <div className="p-2 bg-gray-50 rounded border border-gray-300 flex flex-col sm:flex-row items-start gap-3 print:p-1.5">
            <div className="shrink-0">
              <img
                src={imgUrl}
                alt="Hình ảnh gợi ý Chướng Ngại Vật"
                className="max-h-48 max-w-full sm:max-w-[260px] object-contain rounded border border-gray-400 bg-white p-1 shadow-sm block print:max-h-36"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-xs text-gray-700 leading-snug space-y-1">
              <div className="font-bold text-blue-900 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>HÌNH ẢNH GỢI Ý CHƯỚNG NGẠI VẬT (BỊ CHE BỞI CÁC MẢNH GHÉP)</span>
              </div>
              <p className="text-[11px] text-gray-600">
                Hình ảnh bí mật được chia thành 4 góc mảnh ghép tương ứng với 4 hàng ngang và 1 mảnh ghép Ô Trung Tâm.
              </p>
              {imgUrl.startsWith('http') && (
                <span className="text-[10px] text-gray-400 font-mono block truncate max-w-xs">
                  Nguồn: {imgUrl}
                </span>
              )}
            </div>
          </div>
        )}

        {/* HÀNG 2: Ô MẠO HIỂM */}
        {rQ && (
          <div className="p-2 rounded bg-rose-50/70 border border-rose-200 text-xs">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-bold text-rose-900 flex items-center gap-1 text-[11.5px]">
                <Zap className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Hàng 2: Ô Mạo Hiểm (+120 điểm nếu đúng / -50% điểm nếu sai)</span>
              </span>
              {showAnswersMode && rA && (
                <span className="font-mono font-bold bg-rose-200 text-rose-950 px-2 py-0.5 rounded text-[11px] border border-rose-300">
                  Đáp án: {rA}
                </span>
              )}
            </div>
            <p className="text-gray-800 leading-relaxed">{rQ}</p>
          </div>
        )}

        {/* 4 HÀNG NGANG GỢI Ý (HÀNG 3 - 6) */}
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-blue-900 uppercase font-mono flex items-center justify-between border-b border-gray-200 pb-0.5">
            <span>4 Hàng ngang gợi ý (15 giây suy nghĩ • +10 điểm / hàng)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
            {[1, 2, 3, 4].map(cNum => {
              const clue = q.options?.[`clue${cNum}`];
              const ans = q.options?.[`ans${cNum}`];
              if (!clue && !ans) return null;
              const ansLen = ans ? ans.replace(/\s/g, '').length : 0;
              return (
                <div key={cNum} className="p-2 rounded border border-gray-200 bg-gray-50 text-gray-900 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-blue-950 text-[11px]">
                      Hàng ngang {cNum} {ansLen > 0 ? `(${ansLen} chữ cái)` : ''}:
                    </span>
                    {showAnswersMode && ans && (
                      <span className="font-mono font-bold bg-blue-100 text-blue-950 px-1.5 py-0.5 rounded text-[10.5px] border border-blue-200">
                        {ans}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-800 leading-snug">{clue || '(Chưa có gợi ý)'}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* HÀNG 7: Ô TRUNG TÂM */}
        {centerText && (
          <div className="p-2 rounded bg-purple-50/70 border border-purple-200 text-xs">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-bold text-purple-900 text-[11.5px]">
                🌟 Hàng 7: Ô Trung Tâm (Lật mở mảnh ghép trung tâm)
              </span>
              {showAnswersMode && centerAns && (
                <span className="font-mono font-bold bg-purple-200 text-purple-950 px-2 py-0.5 rounded text-[11px] border border-purple-300">
                  Đáp án: {centerAns}
                </span>
              )}
            </div>
            <p className="text-gray-800 leading-relaxed">{centerText}</p>
          </div>
        )}
      </div>
    );
  };

  // Render Sheet Content - EXAM FORMAT
  const renderExamFormat = (pageQuestions: QuestionItem[], startIdx: number) => {
    return (
      <div className={`space-y-4 ${fontSizeClasses}`}>
        {pageQuestions.map((q, idx) => {
          const globalIdx = startIdx + idx + 1;
          const isVcnv = isVcnvQuestion(q);
          const isTrueFalse4 = q.round_type === 'TRUE_FALSE_4' || Boolean(q.round_format?.includes('TRUE_FALSE'));
          const imgUrl = getQuestionImageUrl(q);
          const validOptions = Object.entries(q.options || {}).filter(
            ([k, v]) => !INTERNAL_OPTION_KEYS.has(k) && v !== '' && v !== undefined && v !== null
          );

          return (
            <div key={q.id || idx} className="break-inside-avoid border-b border-gray-300 pb-3 last:border-b-0">
              {/* Question Text */}
              <div className="font-bold text-gray-950 mb-1.5 flex items-start gap-2">
                <span className="font-mono bg-black text-white text-[11px] px-2 py-0.5 rounded-[2px] shrink-0 font-bold">
                  Câu {globalIdx}:
                </span>
                <div className="flex-1">
                  <span className="whitespace-pre-wrap leading-relaxed">{q.question_text}</span>
                  {showLegalRef && (q.legal_reference || q.cognitive_level) && (
                    <span className="ml-2 text-[10.5px] font-normal text-gray-500 font-mono inline-block">
                      [{getDifficultyText(q.cognitive_level)}{q.legal_reference ? ` • ${q.legal_reference}` : ''}]
                    </span>
                  )}
                </div>
              </div>

              {/* Case 1: VCNV Question Structure */}
              {isVcnv ? (
                renderVcnvContent(q, showAnswers, false)
              ) : (
                <>
                  {/* General Question Image if provided */}
                  {imgUrl && (
                    <div className="my-2 p-1.5 bg-gray-50 rounded border border-gray-300 inline-block max-w-full break-inside-avoid">
                      <img
                        src={imgUrl}
                        alt="Hình ảnh minh họa câu hỏi"
                        className="max-h-48 max-w-full object-contain rounded border border-gray-400 bg-white p-1 shadow-sm block print:max-h-40"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Case 2: True/False 4 statements */}
                  {isTrueFalse4 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-6 mt-1.5 text-xs">
                      {['a', 'b', 'c', 'd'].map(key => {
                        const text = q.options?.[key] || q.options?.[key.toUpperCase()];
                        if (!text) return null;
                        const correctStr = q.correct_key || '';
                        const isTrue = correctStr.includes(`${key}:Đ`) || correctStr.includes(`${key}:T`) || correctStr.includes(`${key}:1`) || correctStr.includes(`${key.toUpperCase()}:Đ`);
                        const isFalse = correctStr.includes(`${key}:S`) || correctStr.includes(`${key}:F`) || correctStr.includes(`${key}:0`) || correctStr.includes(`${key.toUpperCase()}:S`);
                        return (
                          <div key={key} className="p-1 rounded bg-gray-50 border border-gray-200 flex items-baseline justify-between gap-1.5">
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-mono font-bold text-gray-900">{key})</span>
                              <span className="text-gray-800">{text}</span>
                            </div>
                            {showAnswers && (
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold shrink-0 ${
                                isTrue ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : isFalse ? 'bg-rose-100 text-rose-900 border border-rose-300' : 'text-gray-500'
                              }`}>
                                {isTrue ? 'ĐÚNG' : isFalse ? 'SAI' : ''}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Case 3: Standard Multiple Choice Options */
                    validOptions.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pl-6 mt-1.5">
                        {validOptions.map(([k, opt]) => {
                          const isCorrect = showAnswers && k === q.correct_key;
                          return (
                            <div 
                              key={k} 
                              className={`py-0.5 px-1 rounded flex items-baseline gap-1.5 text-xs leading-normal ${
                                isCorrect 
                                  ? 'font-bold text-black bg-gray-100/90 underline decoration-gray-400' 
                                  : 'text-gray-800'
                              }`}
                            >
                              <span className={`font-mono font-bold shrink-0 ${isCorrect ? 'text-black' : 'text-gray-700'}`}>
                                {k}.
                              </span>
                              <span>{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </>
              )}

              {/* Scenario details if any */}
              {q.scenario_details?.scriptText && (
                <div className="pl-6 mt-2 text-xs italic text-gray-700 bg-gray-50/80 p-2 rounded border-l-2 border-amber-400">
                  <div className="font-bold not-italic text-gray-900 mb-0.5">Tình huống / Bối cảnh:</div>
                  <div>{q.scenario_details.scriptText}</div>
                  {q.scenario_details.dilemma && (
                    <div className="mt-1 font-semibold text-amber-900">Vấn đề: {q.scenario_details.dilemma}</div>
                  )}
                </div>
              )}

              {/* Answer Key & Explanation if enabled */}
              {showAnswers && (
                <div className="mt-2 pl-6 text-[11.5px] text-gray-800 bg-gray-50 p-2 rounded border border-gray-200">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Đáp án đúng: <span className="font-mono bg-emerald-700 text-white px-1.5 py-0.2 rounded text-xs">{q.correct_key || 'Chưa xác định'}</span></span>
                    {q.points && <span className="text-gray-600 font-normal">({q.points} điểm)</span>}
                  </div>
                  {showExplanations && q.explanation && (
                    <div className="mt-1 text-gray-700 italic border-t border-gray-200 pt-1 font-normal">
                      <strong>Giải thích:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render Sheet Content - TABLE FORMAT
  const renderTableFormat = (pageQuestions: QuestionItem[], startIdx: number) => {
    return (
      <table className={`w-full text-left border-collapse ${fontSizeClasses}`}>
        <thead>
          <tr className="bg-gray-100 border-b-2 border-black font-bold uppercase text-[10.5px]">
            <th className="p-2 border border-gray-400 w-9 text-center">STT</th>
            <th className="p-2 border border-gray-400 w-[42%]">Nội dung câu hỏi & Lựa chọn</th>
            {showAnswers && <th className="p-2 border border-gray-400 w-[18%]">Đáp án</th>}
            <th className="p-2 border border-gray-400 w-28">Phân loại & Mức độ</th>
            <th className="p-2 border border-gray-400">Căn cứ & Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {pageQuestions.map((q, idx) => {
            const globalIdx = startIdx + idx + 1;
            const isVcnv = isVcnvQuestion(q);
            const isTrueFalse4 = q.round_type === 'TRUE_FALSE_4' || Boolean(q.round_format?.includes('TRUE_FALSE'));
            const imgUrl = getQuestionImageUrl(q);
            const validOptions = Object.entries(q.options || {}).filter(
              ([k, v]) => !INTERNAL_OPTION_KEYS.has(k) && v !== '' && v !== undefined && v !== null
            );

            return (
              <tr key={q.id || idx} className="border-b border-gray-400 align-top break-inside-avoid">
                <td className="p-2 border border-gray-400 text-center font-bold font-mono text-xs">
                  {globalIdx}
                </td>
                <td className="p-2 border border-gray-400">
                  <div className="font-semibold text-gray-900 leading-snug">{q.question_text}</div>

                  {/* Case 1: VCNV Question Breakdown */}
                  {isVcnv ? (
                    renderVcnvContent(q, showAnswers, true)
                  ) : (
                    <>
                      {/* Question Image if provided */}
                      {imgUrl && (
                        <div className="my-2 p-1.5 bg-gray-50 rounded border border-gray-300 inline-block max-w-full">
                          <img
                            src={imgUrl}
                            alt="Hình ảnh đính kèm câu hỏi"
                            className="max-h-44 max-w-full object-contain rounded border border-gray-400 bg-white p-1 shadow-sm block print:max-h-36"
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {/* Case 2: True/False 4 statements */}
                      {isTrueFalse4 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1.5 pt-1.5 border-t border-gray-200 text-xs">
                          {['a', 'b', 'c', 'd'].map(key => {
                            const text = q.options?.[key] || q.options?.[key.toUpperCase()];
                            if (!text) return null;
                            const correctStr = q.correct_key || '';
                            const isTrue = correctStr.includes(`${key}:Đ`) || correctStr.includes(`${key}:T`) || correctStr.includes(`${key}:1`) || correctStr.includes(`${key.toUpperCase()}:Đ`);
                            const isFalse = correctStr.includes(`${key}:S`) || correctStr.includes(`${key}:F`) || correctStr.includes(`${key}:0`) || correctStr.includes(`${key.toUpperCase()}:S`);
                            return (
                              <div key={key} className="p-1 rounded bg-gray-50 border border-gray-200 flex items-baseline justify-between gap-1.5">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="font-mono font-bold text-gray-900">{key})</span>
                                  <span className="text-gray-800">{text}</span>
                                </div>
                                {showAnswers && (
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold shrink-0 ${
                                    isTrue ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : isFalse ? 'bg-rose-100 text-rose-900 border border-rose-300' : 'text-gray-500'
                                  }`}>
                                    {isTrue ? 'ĐÚNG' : isFalse ? 'SAI' : ''}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Case 3: Multiple choice options */
                        validOptions.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-0.5 mt-1.5 pt-1.5 border-t border-gray-200 text-xs">
                            {validOptions.map(([k, opt]) => (
                              <div 
                                key={k} 
                                className={`leading-snug ${showAnswers && k === q.correct_key ? 'font-bold text-black underline decoration-gray-400' : 'text-gray-800'}`}
                              >
                                <span className="font-mono font-bold mr-1">{k}.</span> {opt}
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </>
                  )}
                </td>
                {showAnswers && (
                  <td className="p-2 border border-gray-400 text-xs text-gray-900 bg-emerald-50/40">
                    {isVcnv ? (
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500 font-mono uppercase font-bold block">Từ khóa CNV:</span>
                        <span className="font-mono text-xs bg-black text-white px-2 py-0.5 rounded font-black tracking-wider inline-block">
                          {(q.correct_key || q.obstacle_info?.obstacleKey || q.options?.riskAnswer || q.options?.centerAnswer || 'DEEPFAKE').toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-600 font-mono block">
                          ({(q.correct_key || q.obstacle_info?.obstacleKey || q.options?.riskAnswer || q.options?.centerAnswer || 'DEEPFAKE').replace(/\s/g, '').length} chữ cái)
                        </span>
                        
                        <div className="mt-1.5 pt-1 border-t border-gray-300 text-[10.5px] font-mono space-y-0.5 text-gray-800">
                          {q.options?.ans1 && <div>HN1: <strong className="text-emerald-900">{q.options.ans1}</strong></div>}
                          {q.options?.ans2 && <div>HN2: <strong className="text-emerald-900">{q.options.ans2}</strong></div>}
                          {q.options?.ans3 && <div>HN3: <strong className="text-emerald-900">{q.options.ans3}</strong></div>}
                          {q.options?.ans4 && <div>HN4: <strong className="text-emerald-900">{q.options.ans4}</strong></div>}
                          {q.options?.riskAnswer && <div>Mạo hiểm: <strong className="text-rose-900">{q.options.riskAnswer}</strong></div>}
                          {q.options?.centerAnswer && <div>Trung tâm: <strong className="text-purple-900">{q.options.centerAnswer}</strong></div>}
                        </div>

                        {showExplanations && q.explanation && (
                          <span className="text-[10px] text-gray-600 font-normal italic block mt-1 border-t border-gray-200 pt-0.5">
                            {q.explanation}
                          </span>
                        )}
                      </div>
                    ) : q.correct_key ? (
                      <div>
                        <span className="font-mono text-xs bg-black text-white px-1.5 py-0.5 rounded mr-1">
                          {q.correct_key}
                        </span>
                        {q.options && q.options[q.correct_key] && (
                          <span className="text-[11px] font-normal text-gray-700 block mt-1 leading-tight">
                            {q.options[q.correct_key]}
                          </span>
                        )}
                        {showExplanations && q.explanation && (
                          <span className="text-[10px] text-gray-500 font-normal italic block mt-1 border-t border-gray-200 pt-0.5">
                            {q.explanation}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Chưa lập</span>
                    )}
                  </td>
                )}
                <td className="p-2 border border-gray-400 text-xs text-gray-700">
                  <div className="font-bold text-gray-900">{q.round_name || 'Đại trà'}</div>
                  <div className="text-[11px] text-gray-700 font-medium">{getDifficultyText(q.cognitive_level)}</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">{q.category}</div>
                </td>
                <td className="p-2 border border-gray-400 text-xs text-gray-600">
                  {showLegalRef && q.legal_reference && (
                    <div className="text-[11px] font-mono text-gray-800 leading-tight">
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
        </tbody>
      </table>
    );
  };

  // Render Sheet Content - ANSWER KEY FORMAT (Phiếu đáp án & barem chấm)
  const renderAnswerKeyFormat = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-black border-b pb-1 mb-3">
            BẢNG ĐÁP ÁN TRẮC NGHIỆM NHANH ({activeQuestions.length} CÂU)
          </h2>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 text-center font-mono">
            {activeQuestions.map((q, idx) => {
              const isVcnv = isVcnvQuestion(q);
              const ansText = isVcnv 
                ? (q.correct_key || q.obstacle_info?.obstacleKey || q.options?.riskAnswer || q.options?.centerAnswer || 'VCNV')
                : (q.correct_key || '-');
              return (
                <div key={q.id || idx} className="border border-gray-400 p-1.5 rounded bg-gray-50 flex flex-col justify-center items-center">
                  <div className="text-[10px] text-gray-500 font-bold">Câu {idx + 1}</div>
                  <div className={`font-black text-black truncate max-w-full ${ansText.length > 4 ? 'text-[10.5px] tracking-tight' : 'text-sm'}`} title={ansText}>
                    {ansText}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Rubric / Explanations */}
        {showExplanations && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-black border-b pb-1 mb-3">
              HƯỚNG DẪN GIẢI CHI TIẾT & BIỂU ĐIỂM
            </h2>
            <div className="space-y-3 text-xs">
              {activeQuestions.map((q, idx) => (
                <div key={q.id || idx} className="border-b border-gray-200 pb-2">
                  <div className="font-bold text-gray-900 flex items-center justify-between">
                    <span>Câu {idx + 1}: Đáp án {q.correct_key || 'Chưa lập'}</span>
                    <span className="font-mono text-gray-500 text-[11px] font-normal">
                      {q.legal_reference || ''}
                    </span>
                  </div>
                  <div className="text-gray-700 mt-0.5">
                    {q.explanation || 'Không có giải thích chi tiết.'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render a Single Sheet (Page)
  const renderA4Sheet = (pageQuestions: QuestionItem[], pageIndex: number) => {
    const startIdx = pageIndex * (itemsPerPage > 0 ? itemsPerPage : activeQuestions.length);
    const pageNumber = pageIndex + 1;
    const isLastPage = pageIndex === totalPages - 1;
    const shouldPrintThisPage = parsedPrintPages.includes(pageNumber);

    return (
      <div 
        key={pageIndex}
        className={`print-page bg-white text-black shadow-2xl print:shadow-none border border-slate-300 print:border-none relative block mb-8 print:mb-0 mx-auto rounded-sm print:rounded-none select-text box-border ${marginPaddingClasses} ${
          shouldPrintThisPage ? 'print:block' : 'print:hidden'
        } ${ecoInkMode ? 'grayscale' : ''}`}
        style={{ 
          width: paperDimensions.width,
          minHeight: paperDimensions.minHeight,
          fontFamily: "var(--app-font-family, 'SVN-Gilroy', 'Gilroy', 'Lexend'), sans-serif",
          fontWeight: 500,
          pageBreakAfter: isLastPage ? 'avoid' : 'always', 
          breakAfter: isLastPage ? 'avoid' : 'page' 
        }}
      >
        <div className="flex flex-col justify-between min-h-full print:min-h-0 print:block">
          <div>
            {/* Header Section */}
            {showHeaderFooter && (
              <div className="border-b-2 border-black pb-3 mb-4 print:pb-2 print:mb-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="text-[10px] font-bold tracking-widest text-gray-700 uppercase font-mono mb-0.5">
                      {institutionName}
                    </div>
                    <h1 className="text-base sm:text-lg font-black uppercase tracking-wide text-black leading-tight">
                      {examTitle}
                    </h1>
                    <p className="text-[11px] text-gray-600 font-mono mt-0.5">
                      {examSubtitle}
                    </p>
                  </div>
                  <div className="text-right shrink-0 font-mono text-xs text-gray-700 border-l pl-3 border-gray-300">
                    <div className="font-bold text-black text-sm">TRANG {pageNumber} / {totalPages}</div>
                    <div className="text-[10px] text-gray-500">Khổ: {paperSize.toUpperCase()} ({orientation === 'portrait' ? 'Dọc' : 'Ngang'})</div>
                    <div className="text-[10px] text-gray-500">Ngày in: {new Date().toLocaleDateString('vi-VN')}</div>
                  </div>
                </div>

                {/* Student Info Box - Only on Page 1 for Exam Format */}
                {showStudentInfo && docFormat === 'EXAM' && pageIndex === 0 && (
                  <div className="mt-3 p-2.5 border border-gray-400 rounded bg-gray-50/60 text-xs font-mono grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                    <div>Họ và tên thí sinh: ..............................................................</div>
                    <div>Số báo danh: .....................................................</div>
                    <div>Lớp / Đơn vị: .....................................................................</div>
                    <div>Phòng thi số: ....................................................</div>
                    <div className="col-span-2 pt-1 border-t border-gray-200 text-[10.5px] text-gray-500 flex justify-between">
                      <span>Cán bộ coi thi 1: ................................................</span>
                      <span>Cán bộ coi thi 2: ................................................</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Document Body Format */}
            {docFormat === 'EXAM' && renderExamFormat(pageQuestions, startIdx)}
            {docFormat === 'TABLE' && renderTableFormat(pageQuestions, startIdx)}
            {docFormat === 'ANSWER_KEY' && renderAnswerKeyFormat()}
          </div>

          {/* Footer Section */}
          {showHeaderFooter && (
            <div className="pt-3 mt-6 border-t border-gray-400 flex justify-between items-center text-[10px] text-gray-600 font-mono print:pt-2 print:mt-3">
              <div>Hệ thống ngân hàng câu hỏi BTI 2026 • TT 02/2025/TT-BGDĐT</div>
              <div>Trang {pageNumber} / {totalPages}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Visible chunks for preview in SINGLE page mode vs ALL pages mode
  const displayedChunkIndexes = viewPageMode === 'SINGLE' 
    ? [currentPage - 1] 
    : Array.from({ length: totalPages }, (_, i) => i);

  return createPortal(
    <div className="print-modal-root fixed inset-0 z-[9999999] flex flex-col bg-[#0D0420] text-slate-100 font-sans print:bg-white animate-fadeIn select-none">
      {/* Dynamic CSS @page injection for orientation & paper size */}
      <style>{`
        @media print {
          @page {
            size: ${paperSize} ${orientation};
            margin: ${marginSize === 'narrow' ? '8mm' : marginSize === 'wide' ? '25mm' : '15mm'};
          }
        }
      `}</style>

      {/* Top Bar Header (Hidden when printing) */}
      <div className="h-14 bg-[#190839] border-b border-theme-accent/25 px-4 flex items-center justify-between gap-3 shrink-0 shadow-lg no-print z-20">
        {/* Left: Title and Status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[4px] bg-theme-accent/15 text-theme-accent border border-theme-accent/30 flex items-center justify-center shrink-0">
            <Printer className="w-5 h-5 text-theme-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white font-mono tracking-wide">
                HỘP THOẠI IN & XUẤT BẢN ĐỀ THI
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {totalPages} Trang ({paperSize.toUpperCase()})
              </span>
            </div>
            <p className="text-[11px] text-[#B6A6D8] font-mono">
              Tổng số: {activeQuestions.length} câu hỏi {useSelectionOnly ? '(Đang chọn)' : '(Toàn bộ)'}
            </p>
          </div>
        </div>

        {/* Center: Quick Zoom & Page Switcher Controls */}
        <div className="hidden md:flex items-center gap-2 bg-black/40 px-3 py-1 rounded-[4px] border border-white/10 text-xs font-mono">
          {/* Zoom controls */}
          <button 
            type="button"
            onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
            className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white"
            title="Thu nhỏ xem trước (-10%)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-12 text-center text-[11px] font-bold text-amber-300">
            {zoomLevel}%
          </span>
          <button 
            type="button"
            onClick={() => setZoomLevel(prev => Math.min(130, prev + 10))}
            className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white"
            title="Phóng to xem trước (+10%)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button 
            type="button"
            onClick={() => setZoomLevel(90)}
            className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 hover:bg-white/20 text-slate-300"
            title="Đặt lại mức thu phóng 90%"
          >
            Mặc định
          </button>

          <div className="w-[1px] h-4 bg-white/20 mx-1" />

          {/* View mode toggle: ALL vs SINGLE */}
          <button
            type="button"
            onClick={() => { vibrateTap(); setViewPageMode('ALL'); }}
            className={`px-2 py-0.5 rounded text-[11px] transition ${
              viewPageMode === 'ALL' ? 'bg-theme-accent text-[#190839] font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cuộn tất cả
          </button>
          <button
            type="button"
            onClick={() => { vibrateTap(); setViewPageMode('SINGLE'); }}
            className={`px-2 py-0.5 rounded text-[11px] transition ${
              viewPageMode === 'SINGLE' ? 'bg-theme-accent text-[#190839] font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Từng trang
          </button>

          {viewPageMode === 'SINGLE' && totalPages > 1 && (
            <div className="flex items-center gap-1 pl-2 border-l border-white/20">
              <button
                disabled={currentPage <= 1}
                onClick={() => { vibrateTap(); setCurrentPage(p => Math.max(1, p - 1)); }}
                className="p-0.5 rounded hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-bold text-white px-1">
                {currentPage}/{totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => { vibrateTap(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                className="p-0.5 rounded hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Toggle Sidebar & Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`px-3 py-1.5 rounded-[4px] border text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isSidebarOpen 
                ? 'bg-[#241148] text-white border-theme-accent/40' 
                : 'bg-white/5 text-slate-300 border-white/20 hover:text-white'
            }`}
            title="Ẩn / Hiện thanh thiết lập in"
          >
            <Settings2 className="w-3.5 h-3.5 text-theme-accent" />
            <span className="hidden sm:inline">Cài đặt in</span>
          </button>

          <button
            type="button"
            onClick={() => { vibrateTap(); onClose(); }}
            className="px-3.5 py-1.5 border border-white/20 rounded-[4px] text-slate-300 hover:text-white hover:bg-white/10 transition text-xs font-mono font-bold cursor-pointer"
          >
            Đóng (Esc)
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-[4px] font-mono font-bold text-xs shadow-lg shadow-amber-950/40 flex items-center gap-2 transition cursor-pointer"
            title="Mở lệnh in trình duyệt hoặc xuất file PDF (Ctrl + P)"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>In Ngay (Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body: Sidebar + Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Complete Print Settings Panel (Dialog Sidebar) */}
        {isSidebarOpen && (
          <div className="w-80 sm:w-96 bg-[#160731] border-r border-theme-accent/20 flex flex-col shrink-0 no-print z-10 shadow-2xl">
            {/* Sidebar Scrollable Sections */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 text-xs font-mono">
              {/* Section 1: Destination & Scope */}
              <div className="bg-[#210c47]/80 p-3 rounded-[4px] border border-theme-accent/20 space-y-2.5">
                <div className="flex items-center justify-between text-[#F7CAC9] font-bold text-[11px] uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Máy in / Đích đến</span>
                  </div>
                </div>
                <div className="bg-black/40 p-2 rounded border border-white/10 text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Lưu dưới dạng PDF / Máy in hệ thống</span>
                  <span className="text-emerald-400 text-[10px]">● Sẵn sàng</span>
                </div>

                {/* Scope selector if has selected questions */}
                {hasSelected && (
                  <div className="pt-2 border-t border-white/10">
                    <label className="text-[11px] text-slate-300 font-bold block mb-1">
                      Phạm vi câu hỏi:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => { vibrateTap(); setUseSelectionOnly(false); }}
                        className={`p-1.5 rounded text-[10.5px] text-center border transition ${
                          !useSelectionOnly 
                            ? 'bg-theme-accent/25 text-theme-accent border-theme-accent/50 font-bold' 
                            : 'bg-black/20 text-slate-400 border-white/10 hover:text-white'
                        }`}
                      >
                        Toàn bộ ({initialQuestions.length} câu)
                      </button>
                      <button
                        type="button"
                        onClick={() => { vibrateTap(); setUseSelectionOnly(true); }}
                        className={`p-1.5 rounded text-[10.5px] text-center border transition ${
                          useSelectionOnly 
                            ? 'bg-theme-accent/25 text-theme-accent border-theme-accent/50 font-bold' 
                            : 'bg-black/20 text-slate-400 border-white/10 hover:text-white'
                        }`}
                      >
                        Đã chọn ({selectedQuestions.length} câu)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Document Layout Format */}
              <div className="bg-[#210c47]/80 p-3 rounded-[4px] border border-theme-accent/20 space-y-2.5">
                <div className="text-[#F7CAC9] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-theme-accent" />
                  <span>Hình thức tài liệu</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleFormatChange('EXAM')}
                    className={`p-2 rounded border text-center flex flex-col items-center gap-1 transition ${
                      docFormat === 'EXAM'
                        ? 'bg-theme-accent text-[#190839] border-theme-accent font-bold shadow'
                        : 'bg-black/30 text-slate-300 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <FileCheck className="w-4 h-4" />
                    <span className="text-[10.5px]">Đề thi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatChange('TABLE')}
                    className={`p-2 rounded border text-center flex flex-col items-center gap-1 transition ${
                      docFormat === 'TABLE'
                        ? 'bg-theme-accent text-[#190839] border-theme-accent font-bold shadow'
                        : 'bg-black/30 text-slate-300 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <Table className="w-4 h-4" />
                    <span className="text-[10.5px]">Ma trận</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatChange('ANSWER_KEY')}
                    className={`p-2 rounded border text-center flex flex-col items-center gap-1 transition ${
                      docFormat === 'ANSWER_KEY'
                        ? 'bg-theme-accent text-[#190839] border-theme-accent font-bold shadow'
                        : 'bg-black/30 text-slate-300 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span className="text-[10.5px]">Đáp án</span>
                  </button>
                </div>
              </div>

              {/* Section 3: Pages to Print (Trang in) */}
              <div className="bg-[#210c47]/80 p-3 rounded-[4px] border border-theme-accent/20 space-y-2.5">
                <div className="text-[#F7CAC9] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-sky-400" />
                  <span>Trang in</span>
                </div>
                <div className="space-y-1.5 text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="pageScope" 
                      checked={pageScope === 'ALL'} 
                      onChange={() => setPageScope('ALL')}
                      className="accent-amber-400 cursor-pointer"
                    />
                    <span>Tất cả các trang ({totalPages} trang)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="pageScope" 
                      checked={pageScope === 'CURRENT'} 
                      onChange={() => setPageScope('CURRENT')}
                      className="accent-amber-400 cursor-pointer"
                    />
                    <span>Chỉ trang hiện tại (Trang {currentPage})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="pageScope" 
                      checked={pageScope === 'CUSTOM'} 
                      onChange={() => setPageScope('CUSTOM')}
                      className="accent-amber-400 cursor-pointer"
                    />
                    <span>Tùy chỉnh khoảng trang</span>
                  </label>

                  {pageScope === 'CUSTOM' && (
                    <div className="pl-5 pt-1">
                      <input
                        type="text"
                        value={customPageRange}
                        onChange={(e) => setCustomPageRange(e.target.value)}
                        placeholder="Ví dụ: 1-2, 4"
                        className="w-full bg-black/50 border border-white/20 px-2.5 py-1 rounded text-white text-xs outline-none focus:border-theme-accent font-mono"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Sẽ in: {parsedPrintPages.join(', ')} (Tổng: {parsedPrintPages.length} trang)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Orientation, Paper Size & Margins */}
              <div className="bg-[#210c47]/80 p-3 rounded-[4px] border border-theme-accent/20 space-y-2.5">
                <div className="text-[#F7CAC9] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bố cục & Khổ giấy</span>
                </div>
                
                {/* Orientation toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { vibrateTap(); setOrientation('portrait'); }}
                    className={`p-1.5 rounded border text-center transition ${
                      orientation === 'portrait'
                        ? 'bg-theme-accent/30 text-theme-accent border-theme-accent font-bold'
                        : 'bg-black/30 text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    Dọc (Portrait)
                  </button>
                  <button
                    type="button"
                    onClick={() => { vibrateTap(); setOrientation('landscape'); }}
                    className={`p-1.5 rounded border text-center transition ${
                      orientation === 'landscape'
                        ? 'bg-theme-accent/30 text-theme-accent border-theme-accent font-bold'
                        : 'bg-black/30 text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    Ngang (Landscape)
                  </button>
                </div>

                {/* Paper Size & Margin */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10.5px] text-slate-400 block mb-1">Khổ giấy:</label>
                    <select
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                      className="w-full bg-black/40 border border-white/20 p-1.5 rounded text-white text-xs cursor-pointer outline-none font-mono"
                    >
                      <option value="a4" className="bg-[#190839]">A4 (210 x 297 mm)</option>
                      <option value="letter" className="bg-[#190839]">Letter (8.5 x 11 in)</option>
                      <option value="a3" className="bg-[#190839]">A3 (297 x 420 mm)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10.5px] text-slate-400 block mb-1">Lề trang:</label>
                    <select
                      value={marginSize}
                      onChange={(e) => setMarginSize(e.target.value as MarginSize)}
                      className="w-full bg-black/40 border border-white/20 p-1.5 rounded text-white text-xs cursor-pointer outline-none font-mono"
                    >
                      <option value="narrow" className="bg-[#190839]">Hẹp (8 mm)</option>
                      <option value="standard" className="bg-[#190839]">Chuẩn (15 mm)</option>
                      <option value="wide" className="bg-[#190839]">Rộng (25 mm)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 5: Density & Font Size */}
              <div className="bg-[#210c47]/80 p-3 rounded-[4px] border border-theme-accent/20 space-y-2.5">
                <div className="text-[#F7CAC9] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Mật độ & Cỡ chữ</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10.5px] text-slate-400 block mb-1">Số câu / trang:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="w-full bg-black/40 border border-white/20 p-1.5 rounded text-white text-xs cursor-pointer outline-none font-mono"
                    >
                      <option value={4} className="bg-[#190839]">4 câu (Thoáng)</option>
                      <option value={5} className="bg-[#190839]">5 câu (Chuẩn A4)</option>
                      <option value={6} className="bg-[#190839]">6 câu (Vừa)</option>
                      <option value={8} className="bg-[#190839]">8 câu (Dày)</option>
                      <option value={0} className="bg-[#190839]">In liên tục</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10.5px] text-slate-400 block mb-1">Cỡ chữ in:</label>
                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value as FontSizeChoice)}
                      className="w-full bg-black/40 border border-white/20 p-1.5 rounded text-white text-xs cursor-pointer outline-none font-mono"
                    >
                      <option value="compact" className="bg-[#190839]">Nhỏ gọn (11px)</option>
                      <option value="standard" className="bg-[#190839]">Tiêu chuẩn (12.5px)</option>
                      <option value="large" className="bg-[#190839]">Lớn rõ nét (14px)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 6: Content Display Options */}
              <div className="bg-[#210c47]/80 p-3 rounded-[4px] border border-theme-accent/20 space-y-2">
                <div className="text-[#F7CAC9] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tùy chọn nội dung</span>
                </div>

                <div className="space-y-1.5 text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={showAnswers}
                      onChange={(e) => setShowAnswers(e.target.checked)}
                      className="accent-theme-accent cursor-pointer"
                    />
                    <span>Hiện đáp án đúng</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={showExplanations}
                      onChange={(e) => setShowExplanations(e.target.checked)}
                      className="accent-theme-accent cursor-pointer"
                    />
                    <span>Hiện lời giải / giải thích chi tiết</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={showStudentInfo}
                      onChange={(e) => setShowStudentInfo(e.target.checked)}
                      className="accent-theme-accent cursor-pointer"
                    />
                    <span>Khung thông tin Thí sinh (Họ tên, SBD...)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={showLegalRef}
                      onChange={(e) => setShowLegalRef(e.target.checked)}
                      className="accent-theme-accent cursor-pointer"
                    />
                    <span>Căn cứ pháp lý (TT 02/2025/TT-BGDĐT)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={showHeaderFooter}
                      onChange={(e) => setShowHeaderFooter(e.target.checked)}
                      className="accent-theme-accent cursor-pointer"
                    />
                    <span>Tiêu đề đầu trang & Số trang chân trang</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-white pt-1 border-t border-white/10">
                    <input
                      type="checkbox"
                      checked={ecoInkMode}
                      onChange={(e) => setEcoInkMode(e.target.checked)}
                      className="accent-amber-400 cursor-pointer"
                    />
                    <span className="text-amber-200">Chế độ Đen trắng (Tiết kiệm mực in)</span>
                  </label>
                </div>
              </div>

              {/* Section 7: Custom Exam Header Inputs */}
              <div className="bg-[#210c47]/80 p-3 rounded-[4px] border border-theme-accent/20 space-y-2">
                <div className="text-[#F7CAC9] font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tiêu đề đề thi tùy chỉnh</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Đơn vị / Trường:</label>
                    <input
                      type="text"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      className="w-full bg-black/40 border border-white/20 px-2 py-1 rounded text-white text-xs outline-none focus:border-theme-accent font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Tên kỳ thi / Đề kiểm tra:</label>
                    <input
                      type="text"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      className="w-full bg-black/40 border border-white/20 px-2 py-1 rounded text-white text-xs outline-none focus:border-theme-accent font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Mã đề / Thời gian:</label>
                    <input
                      type="text"
                      value={examSubtitle}
                      onChange={(e) => setExamSubtitle(e.target.value)}
                      className="w-full bg-black/40 border border-white/20 px-2 py-1 rounded text-white text-xs outline-none focus:border-theme-accent font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Bottom Action Controls */}
            <div className="p-3.5 bg-[#190839] border-t border-theme-accent/25 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => { vibrateTap(); onClose(); }}
                className="flex-1 py-2 rounded-[4px] border border-white/20 text-slate-300 hover:text-white hover:bg-white/10 font-bold text-xs transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-[4px] shadow-lg shadow-amber-950/50 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-950" />
                <span>IN NGAY</span>
              </button>
            </div>
          </div>
        )}

        {/* Right: Realistic Print Preview Canvas */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 flex flex-col items-center bg-[#0D0420] print:p-0 print:bg-white print:block print:overflow-visible">
          {/* Screen preview container with applied zoom scale */}
          <div 
            className="w-full flex flex-col items-center print:hidden transition-transform duration-150 origin-top"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {displayedChunkIndexes.map((chunkIdx) => 
              renderA4Sheet(pageChunks[chunkIdx] || [], chunkIdx)
            )}
          </div>

          {/* When native window.print() is executing: Browser sees all targeted pages at native 100% scale */}
          <div className="hidden print:block w-full">
            {pageChunks.map((chunk, idx) => renderA4Sheet(chunk, idx))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
