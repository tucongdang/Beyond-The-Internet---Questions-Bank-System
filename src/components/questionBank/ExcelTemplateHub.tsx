import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  Eye,
  Trash2,
  Volume2,
  Image as ImageIcon,
  Video,
  StickyNote,
  HelpCircle,
  Zap,
  Target,
  Trophy,
  Users,
  Compass,
  FileCheck
} from 'lucide-react';
import { excelService, SAMPLE_BTI_EXCEL_DATA } from '../../services/excelService';
import { questionBankManager } from '../../services/questionBankManager';
import { QuestionItem, CompetitionStage } from '../../types';
import { BulkQuestionImportModal } from './BulkQuestionImportModal';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';

interface ExcelTemplateHubProps {
  onImportComplete?: () => void;
}

export const ExcelTemplateHub: React.FC<ExcelTemplateHubProps> = ({ onImportComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSubTab, setActiveSubTab] = useState<'IMPORT' | 'EXPORT' | 'AI_PARSE' | 'GUIDE'>('IMPORT');
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);

  // Import states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsedQuestions, setParsedQuestions] = useState<QuestionItem[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [filterRound, setFilterRound] = useState<'ALL' | 'KD' | 'VCNV' | 'TT' | 'VD' | 'CHP'>('ALL');

  // AI text parse states
  const [rawText, setRawText] = useState<string>('');
  const [isAiParsing, setIsAiParsing] = useState<boolean>(false);

  // Export states
  const [exportStage, setExportStage] = useState<CompetitionStage | 'ALL'>('ALL');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Handle Download Blank Template
  const handleDownloadBlankTemplate = () => {
    vibrateTap();
    soundFx.playClick();
    excelService.downloadBlankTemplate();
  };

  // Handle Download Sample Template with real questions from PDF
  const handleDownloadSampleTemplate = () => {
    vibrateTap();
    soundFx.playClick();
    excelService.downloadSampleTemplate();
  };

  // Direct load sample questions into parsed state for testing
  const handleLoadSampleDirectly = () => {
    vibrateTap();
    soundFx.playClick();
    setIsParsing(true);
    setParseWarnings([]);
    setImportSuccessMsg(null);

    const questions: QuestionItem[] = [];

    // 1. Khởi động (TS 1-4 & Lượt chung)
    const kd = SAMPLE_BTI_EXCEL_DATA.khoiDong;
    const tsKeys = ['ts1', 'ts2', 'ts3', 'ts4'] as const;
    tsKeys.forEach((key, tsIdx) => {
      const slot = tsIdx + 1;
      kd[key].forEach((item, idx) => {
        questions.push({
          id: `KD_TS${slot}_${idx + 1}`,
          round_name: `Vòng 1: Khởi động (Lượt riêng - Thí sinh ${slot})`,
          round_type: 'SHORT_ANSWER',
          round_format: 'KHOI_DONG_RIENG',
          category: 'Khởi động BTI 2026',
          question_text: item.q,
          options: {},
          correct_key: item.a,
          media_type: item.img ? 'IMAGE' : (item.audio ? 'AUDIO' : 'NONE'),
          media_url: item.img || undefined,
          audio_url: item.audio || undefined,
          time_limit: 10,
          points: 10,
          participant_slot: slot,
          explanation: `Lượt riêng Thí sinh ${slot}`,
          stage: 'BAN_KET_1',
          cognitive_level: 'THONG_HIEU',
          digital_competency_domain: 'MIEN_1',
          approval_status: 'APPROVED',
          created_by: 'Mẫu Đề Thi Chuẩn PDF',
          created_at: Date.now()
        });
      });
    });

    // Lượt chung
    kd.luotChung.forEach((item, idx) => {
      questions.push({
        id: `KD_CHUNG_${idx + 1}`,
        round_name: 'Vòng 1: Khởi động (Lượt chung)',
        round_type: 'SHORT_ANSWER',
        round_format: 'KHOI_DONG_CHUNG',
        category: 'Khởi động BTI 2026',
        question_text: item.q,
        options: {},
        correct_key: item.a,
        media_type: item.img ? 'IMAGE' : (item.audio ? 'AUDIO' : 'NONE'),
        media_url: item.img || undefined,
        audio_url: item.audio || undefined,
        time_limit: 15,
        points: 10,
        explanation: 'Khởi động chuông nhanh cả 4 thí sinh',
        stage: 'BAN_KET_1',
        cognitive_level: 'THONG_HIEU',
        digital_competency_domain: 'MIEN_1',
        approval_status: 'APPROVED',
        created_by: 'Mẫu Đề Thi Chuẩn PDF',
        created_at: Date.now()
      });
    });

    // 2. Vượt Chướng Ngại Vật
    const vcnv = SAMPLE_BTI_EXCEL_DATA.vuotCnv;
    vcnv.rows.forEach((r, idx) => {
      const isCenter = r.name.toLowerCase().includes('trung tâm');
      questions.push({
        id: `VCNV_${idx + 1}`,
        round_name: `Vòng 2: VCNV (${r.name})`,
        round_type: 'VCNV',
        round_format: isCenter ? 'VCNV_TRUNG_TAM' : 'VCNV_HANG_NGANG',
        category: 'Vượt Chướng Ngại Vật BTI 2026',
        question_text: r.q,
        options: {},
        correct_key: r.a,
        audio_url: r.audio || undefined,
        explanation: vcnv.explanation,
        time_limit: 15,
        points: isCenter ? 40 : 10,
        obstacle_info: {
          obstacleKey: vcnv.keyword,
          obstacleImage: vcnv.imageFile,
          explanation: vcnv.explanation
        },
        stage: 'BAN_KET_1',
        cognitive_level: 'THONG_HIEU',
        digital_competency_domain: 'MIEN_2',
        approval_status: 'APPROVED',
        created_by: 'Mẫu Đề Thi Chuẩn PDF',
        created_at: Date.now()
      });
    });

    // 3. Tăng Tốc
    const tt = SAMPLE_BTI_EXCEL_DATA.tangToc;
    tt.questions.forEach((q, idx) => {
      const time = idx < 2 ? 20 : 30;
      questions.push({
        id: `TT_${idx + 1}`,
        round_name: `Vòng 3: Tăng tốc (${q.name})`,
        round_type: 'SEQUENCING',
        round_format: 'TANG_TOC',
        category: 'Tăng tốc BTI 2026',
        question_text: q.q,
        options: {},
        correct_key: q.a,
        answer_media_url: q.answerImg || undefined,
        media_links: q.mediaList,
        media_url: q.mediaList[0] || undefined,
        media_type: q.mediaList[0]?.endsWith('.mp4') ? 'VIDEO' : 'IMAGE',
        time_limit: time,
        points: 40,
        explanation: 'Thí sinh trả lời nhanh nhất nhận 40đ, 30đ, 20đ, 10đ',
        stage: 'BAN_KET_1',
        cognitive_level: 'VAN_DUNG',
        digital_competency_domain: 'MIEN_3',
        approval_status: 'APPROVED',
        created_by: 'Mẫu Đề Thi Chuẩn PDF',
        created_at: Date.now()
      });
    });

    // 4. Về Đích
    const vd = SAMPLE_BTI_EXCEL_DATA.veDich;
    const luotKeys = ['luot1', 'luot2', 'luot3', 'luot4'] as const;
    luotKeys.forEach((key, lIdx) => {
      const slot = lIdx + 1;
      vd[key].forEach((item, idx) => {
        const pts = item.pts.includes('30') ? 30 : 20;
        questions.push({
          id: `VD_L${slot}_${idx + 1}`,
          round_name: `Vòng 4: Về đích (Lượt ${slot} - ${pts} điểm)`,
          round_type: 'SHORT_ANSWER',
          round_format: pts === 20 ? 'VE_DICH_20' : 'VE_DICH_30',
          category: 'Về đích BTI 2026',
          question_text: item.q,
          options: {},
          correct_key: item.a,
          host_notes: item.note || undefined,
          explanation: item.note || 'MC chú ý đối chiếu đáp án',
          media_type: item.media ? (item.media.endsWith('.mp4') ? 'VIDEO' : 'IMAGE') : (item.audio ? 'AUDIO' : 'NONE'),
          media_url: item.media || undefined,
          audio_url: item.audio || undefined,
          time_limit: pts === 20 ? 15 : 20,
          points: pts,
          participant_slot: slot,
          stage: 'BAN_KET_1',
          cognitive_level: pts === 30 ? 'VAN_DUNG_CAO' : 'VAN_DUNG',
          digital_competency_domain: 'MIEN_4',
          approval_status: 'APPROVED',
          created_by: 'Mẫu Đề Thi Chuẩn PDF',
          created_at: Date.now()
        });
      });
    });

    // 5. Câu Hỏi Phụ
    SAMPLE_BTI_EXCEL_DATA.cauHoiPhu.forEach((item, idx) => {
      questions.push({
        id: `CHP_${idx + 1}`,
        round_name: 'Câu hỏi phụ (Tie-breaker)',
        round_type: 'SHORT_ANSWER',
        round_format: 'CAU_HOI_PHU',
        category: 'Câu hỏi phụ BTI 2026',
        question_text: item.q,
        options: {},
        correct_key: item.a,
        time_limit: 15,
        points: 10,
        explanation: 'Đấu loại trực tiếp khi có thí sinh hòa điểm',
        stage: 'BAN_KET_1',
        cognitive_level: 'THONG_HIEU',
        digital_competency_domain: 'MIEN_1',
        approval_status: 'APPROVED',
        created_by: 'Mẫu Đề Thi Chuẩn PDF',
        created_at: Date.now()
      });
    });

    setParsedQuestions(questions);
    setIsParsing(false);
    soundFx.playCorrect();
    vibrateSuccess();
  };

  // Handle File Upload & Parsing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsParsing(true);
    setParseWarnings([]);
    setImportSuccessMsg(null);
    vibrateTap();
    soundFx.playClick();

    try {
      const result = await excelService.parseExcelFile(file);
      setParsedQuestions(result.importedQuestions);
      setParseWarnings(result.warnings);

      if (result.importedQuestions.length > 0) {
        soundFx.playCorrect();
        vibrateSuccess();
      } else {
        soundFx.playError();
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setParseWarnings([err.message || 'Lỗi đọc tệp Excel. Vui lòng kiểm tra định dạng file.']);
      soundFx.playError();
    } finally {
      setIsParsing(false);
    }
  };

  // Confirm Import parsed questions into store
  const handleCommitImport = () => {
    if (parsedQuestions.length === 0) return;
    vibrateTap();
    soundFx.playCorrect();

    questionBankManager.batchImport(parsedQuestions);
    setImportSuccessMsg(`Đã nhập thành công ${parsedQuestions.length} câu hỏi chuẩn BTI vào Ngân hàng dữ liệu.`);
    setParsedQuestions([]);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onImportComplete) onImportComplete();
  };

  // AI Parse Raw Text
  const handleAiParseText = async () => {
    if (!rawText.trim()) return;
    vibrateTap();
    soundFx.playClick();
    setIsAiParsing(true);
    setParseWarnings([]);

    try {
      const res = await fetch('/api/ai/parse-excel-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi bóc tách đề thi.');
      }

      const mapped: QuestionItem[] = (data.questions || []).map((q: any, i: number) => ({
        id: `AI_IMPORT_${Date.now().toString(36)}_${i + 1}`,
        round_name: q.roundName || 'Vòng 1: Khởi động',
        round_type: q.roundType || 'MULTIPLE_CHOICE',
        category: q.domain ? `Miền: ${q.domain}` : 'Khung năng lực số',
        question_text: q.questionText,
        options: q.options || {},
        correct_key: q.correctKey || 'A',
        explanation: q.explanation || '',
        time_limit: 20,
        stage: 'BAN_KET_1',
        digital_competency_domain: q.domain || 'MIEN_4',
        cognitive_level: q.cognitiveLevel || 'THONG_HIEU',
        legal_reference: q.legalReference || 'Thông tư 02/2025/TT-BGDĐT',
        approval_status: 'APPROVED',
        created_at: Date.now(),
        created_by: 'AI Text Parser'
      }));

      setParsedQuestions(mapped);
      soundFx.playCorrect();
      vibrateSuccess();
    } catch (err: any) {
      console.error('AI Parse error:', err);
      setParseWarnings([err.message || 'Lỗi khi gọi AI phân tích văn bản.']);
      soundFx.playError();
    } finally {
      setIsAiParsing(false);
    }
  };

  // Handle Export to Excel
  const handleExport = () => {
    vibrateTap();
    soundFx.playClick();
    setIsExporting(true);

    try {
      const allQ = questionBankManager.getQuestions();
      const filtered = exportStage === 'ALL' 
        ? allQ 
        : allQ.filter(q => q.stage === exportStage);

      const filename = `BTI2026_NganHangCauHoi_${exportStage}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      excelService.exportQuestionsToExcel(filtered, filename);
      soundFx.playCorrect();
      vibrateSuccess();
    } catch (e) {
      console.error('Export error:', e);
      soundFx.playError();
    } finally {
      setIsExporting(false);
    }
  };

  // Filtered parsed questions
  const displayedQuestions = parsedQuestions.filter(q => {
    if (filterRound === 'ALL') return true;
    if (filterRound === 'KD') return q.round_name.includes('Khởi động');
    if (filterRound === 'VCNV') return q.round_name.includes('VCNV') || q.round_type === 'VCNV';
    if (filterRound === 'TT') return q.round_name.includes('Tăng tốc');
    if (filterRound === 'VD') return q.round_name.includes('Về đích');
    if (filterRound === 'CHP') return q.round_name.includes('phụ');
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with Action Buttons */}
      <div className="fluent-box p-5 relative overflow-hidden bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-black/60 border border-emerald-500/20 rounded-[4px]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold mb-2 border border-emerald-400/30">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chuẩn Mẫu Thi Đấu BTI 2026 • Đồng Bộ Đa Sheet Ban Tổ Chức</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              Trung Tâm Nhập & Xuất Mẫu Excel Khảo Thí
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-2xl">
              Quy trình chuẩn hóa 5 vòng thi: Khởi động (Lượt riêng/Lượt chung), Vượt CNV (Hàng ngang/Ô trung tâm), Tăng tốc (Ảnh đáp án/Link media), Về đích (Gói 20/30đ, Chú thích MC) & Câu hỏi phụ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadBlankTemplate}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-[4px] text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 border border-white/20 transition cursor-pointer"
              title="Tải khung mẫu trắng 6 trang tính để điền đề thi mới"
            >
              <Download className="w-3.5 h-3.5 text-white/80" />
              <span>Tải Mẫu Trắng (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSampleTemplate}
              className="px-3.5 py-2 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-[4px] text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition cursor-pointer"
              title="Tải file Excel mẫu chứa sẵn toàn bộ câu hỏi thực tế trong PDF"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Tải Mẫu Đề Thực Tế (PDF)</span>
            </button>

            <button
              type="button"
              onClick={handleLoadSampleDirectly}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-[4px] text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-orange-950/40 transition cursor-pointer"
              title="Nạp ngay 45+ câu hỏi mẫu từ PDF vào trình duyệt để thử nghiệm hoặc lưu vào ngân hàng"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Nạp Đề Mẫu PDF (1-Click)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setShowBulkModal(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-[4px] text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition cursor-pointer"
              title="Nhập hàng loạt câu hỏi từ file văn bản (.txt) hoặc copy-paste bảng Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Nhập Nhanh (Copy-Paste/Text)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs: Import vs AI Parse vs Export vs Guide */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('IMPORT')}
          className={`px-4 py-2.5 text-xs font-mono font-bold transition flex items-center gap-2 border-b-2 -mb-px cursor-pointer whitespace-nowrap ${
            activeSubTab === 'IMPORT'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Nhập Từ Tệp Excel (.xlsx)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('GUIDE')}
          className={`px-4 py-2.5 text-xs font-mono font-bold transition flex items-center gap-2 border-b-2 -mb-px cursor-pointer whitespace-nowrap ${
            activeSubTab === 'GUIDE'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4 text-sky-400" />
          <span>Sơ Đồ 5 Vòng Thi Theo Mẫu PDF</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('AI_PARSE')}
          className={`px-4 py-2.5 text-xs font-mono font-bold transition flex items-center gap-2 border-b-2 -mb-px cursor-pointer whitespace-nowrap ${
            activeSubTab === 'AI_PARSE'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>AI Bóc Tách Văn Bản Thô</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('EXPORT')}
          className={`px-4 py-2.5 text-xs font-mono font-bold transition flex items-center gap-2 border-b-2 -mb-px cursor-pointer whitespace-nowrap ${
            activeSubTab === 'EXPORT'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Xuất Dữ Liệu Ra Excel</span>
        </button>
      </div>

      {/* SUB-TAB: GUIDE TO THE 5 COMPETITION ROUNDS */}
      {activeSubTab === 'GUIDE' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Card 1: Khởi động */}
            <div className="p-4 rounded-[4px] bg-white/[0.03] border border-sky-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-sky-500/20 text-sky-300">
                  VÒNG 1: KHỞI ĐỘNG
                </span>
                <Users className="w-4 h-4 text-sky-400" />
              </div>
              <h4 className="text-sm font-bold text-white">Lượt Riêng & Lượt Chung</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                • <strong>Lượt riêng:</strong> 4 phần mục riêng cho Thí sinh 1, 2, 3, 4 (mỗi TS 6 câu hỏi / 60s).<br />
                • <strong>Lượt chung:</strong> 12 câu bấm chuông phản xạ cho cả 4 thí sinh.<br />
                • <strong>Hỗ trợ media:</strong> Cột "Ảnh (nếu có)" và "Âm thanh (nếu có)" độc lập.
              </p>
            </div>

            {/* Card 2: Vượt CNV */}
            <div className="p-4 rounded-[4px] bg-white/[0.03] border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300">
                  VÒNG 2: VƯỢT CHƯỚNG NGẠI VẬT
                </span>
                <Target className="w-4 h-4 text-amber-400" />
              </div>
              <h4 className="text-sm font-bold text-white">Chướng Ngại Vật & 5 Mảnh Ghép</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                • <strong>Ô B3 & C3:</strong> Tên Chướng ngại vật (ví dụ: PHÁO ĐẤT) và file ảnh CNV (cnv.jpg).<br />
                • <strong>4 Hàng ngang:</strong> Câu hỏi gợi ý lật mở từng góc ảnh kèm file âm thanh.<br />
                • <strong>Ô trung tâm & Giải thích:</strong> Hàng ngang trung tâm và ô ghi chú dành riêng cho app MC.
              </p>
            </div>

            {/* Card 3: Tăng tốc */}
            <div className="p-4 rounded-[4px] bg-white/[0.03] border border-purple-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300">
                  VÒNG 3: TĂNG TỐC
                </span>
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <h4 className="text-sm font-bold text-white">4 Câu Phản Xạ & Dữ Liệu Media</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                • <strong>Bảng 1:</strong> Câu hỏi, đáp án chuẩn, và file "Ảnh đáp án" (ví dụ: tt2.2.png).<br />
                • <strong>Bảng 2:</strong> "LINK DỮ LIỆU TĂNG TỐC" chứa số lượng ảnh và danh sách đường link/file ảnh/video cho từng câu (tt1.png, video.mp4...).
              </p>
            </div>

            {/* Card 4: Về đích */}
            <div className="p-4 rounded-[4px] bg-white/[0.03] border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                  VÒNG 4: VỀ ĐÍCH
                </span>
                <Trophy className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-sm font-bold text-white">4 Lượt Thi & Chú Thích MC/Host</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                • <strong>4 Lượt thi:</strong> Chia theo Lượt 1, Lượt 2, Lượt 3, Lượt 4 cho 4 thí sinh.<br />
                • <strong>Gói điểm:</strong> Câu hỏi 20 điểm và 30 điểm.<br />
                • <strong>Cột Chú thích:</strong> Hiển thị công thức vật lý, câu hỏi tiếng Anh, hoặc lưu ý riêng cho MC/Host.<br />
                • <strong>Cột Media:</strong> File ảnh, video.mp4 và file âm thanh tada.mp3.
              </p>
            </div>

            {/* Card 5: Câu hỏi phụ */}
            <div className="p-4 rounded-[4px] bg-white/[0.03] border border-rose-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/20 text-rose-300">
                  PHẦN 5: CÂU HỎI PHỤ
                </span>
                <HelpCircle className="w-4 h-4 text-rose-400" />
              </div>
              <h4 className="text-sm font-bold text-white">Phân Định Thắng Thua</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                • Các câu hỏi phụ phân định thứ hạng trong trường hợp bằng điểm.<br />
                • Câu hỏi phụ 1, 2, 3... trả lời ngắn (15 giây).
              </p>
            </div>

            {/* Card 6: Đề thi Bộ GD&ĐT */}
            <div className="p-4 rounded-[4px] bg-white/[0.03] border border-teal-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-teal-500/20 text-teal-300">
                  VÒNG LOẠI BỘ GD&ĐT
                </span>
                <Layers className="w-4 h-4 text-teal-400" />
              </div>
              <h4 className="text-sm font-bold text-white">Khung Năng Lực Số TT 02/2025</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                • <strong>Phần I:</strong> Trắc nghiệm 4 lựa chọn (30s - 1đ).<br />
                • <strong>Phần II:</strong> Đúng / Sai 4 ý a, b, c, d (60s - 4đ).<br />
                • <strong>Phần III:</strong> Trả lời ngắn / Số liệu (45s - 2đ).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: IMPORT EXCEL */}
      {activeSubTab === 'IMPORT' && (
        <div className="space-y-5">
          {/* Drag & drop dropzone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/20 hover:border-emerald-400/60 bg-black/40 hover:bg-emerald-950/10 rounded-[4px] p-8 sm:p-12 text-center cursor-pointer transition space-y-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Upload className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-white font-mono">
                {selectedFile ? selectedFile.name : 'Bấm để chọn hoặc kéo thả tệp Excel vào đây'}
              </p>
              <p className="text-xs text-white/50 max-w-xl mx-auto">
                Tự động nhận diện cấu trúc tệp mẫu chuẩn: KHOI_DONG (Lượt riêng/Lượt chung), VUOT_CNV, TANG_TOC, VE_DICH, CAU_HOI_PHU và VÒNG LOẠI BỘ GD&ĐT.
              </p>
            </div>

            {isParsing && (
              <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 animate-pulse pt-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang phân tích cấu trúc các trang tính...</span>
              </div>
            )}
          </div>

          {/* Success Message */}
          {importSuccessMsg && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-[4px] text-emerald-300 text-xs font-mono flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{importSuccessMsg}</span>
            </div>
          )}

          {/* Warnings */}
          {parseWarnings.length > 0 && (
            <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-[4px] text-amber-200 text-xs space-y-1">
              <div className="font-bold flex items-center gap-2 text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Cảnh báo khi đọc tệp:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-white/70 font-mono text-[11px]">
                {parseWarnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedQuestions.length > 0 && (
            <div className="fluent-box p-5 rounded-[4px] border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Đã nhận diện {parsedQuestions.length} câu hỏi hợp lệ theo mẫu chuẩn
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Kiểm tra các trường dữ liệu (Ảnh, Âm thanh, Chú thích MC, Điểm số) trước khi lưu vào Ngân hàng.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setParsedQuestions([]);
                      setSelectedFile(null);
                    }}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-mono rounded-[4px] transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="button"
                    onClick={handleCommitImport}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono uppercase tracking-wider rounded-[4px] transition shadow-md shadow-emerald-950/40 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Lưu Vào Ngân Hàng ({parsedQuestions.length})</span>
                  </button>
                </div>
              </div>

              {/* Round filter tabs */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                <span className="text-white/50 mr-1 text-[11px]">Lọc theo vòng:</span>
                {[
                  { id: 'ALL', label: 'Tất cả', count: parsedQuestions.length },
                  { id: 'KD', label: 'Khởi động', count: parsedQuestions.filter(q => q.round_name.includes('Khởi động')).length },
                  { id: 'VCNV', label: 'Vượt CNV', count: parsedQuestions.filter(q => q.round_name.includes('VCNV')).length },
                  { id: 'TT', label: 'Tăng tốc', count: parsedQuestions.filter(q => q.round_name.includes('Tăng tốc')).length },
                  { id: 'VD', label: 'Về đích', count: parsedQuestions.filter(q => q.round_name.includes('Về đích')).length },
                  { id: 'CHP', label: 'Câu hỏi phụ', count: parsedQuestions.filter(q => q.round_name.includes('phụ')).length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterRound(tab.id as any)}
                    className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold transition cursor-pointer ${
                      filterRound === tab.id
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {/* Table list */}
              <div className="overflow-x-auto max-h-96 overflow-y-auto border border-white/10 rounded-[4px] custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-white/15 bg-white/5 font-mono text-white/70 text-[11px]">
                      <th className="p-2.5">Mã / STT</th>
                      <th className="p-2.5">Phần thi / Lượt</th>
                      <th className="p-2.5">Nội dung câu hỏi</th>
                      <th className="p-2.5">Đáp án chuẩn</th>
                      <th className="p-2.5">Media đính kèm</th>
                      <th className="p-2.5">Ghi chú MC / Host</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {displayedQuestions.map((q, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition">
                        <td className="p-2.5 font-mono text-sky-400 font-bold whitespace-nowrap">
                          {q.id}
                        </td>
                        <td className="p-2.5 font-mono text-purple-300 whitespace-nowrap">
                          <div className="text-[11px]">{q.round_name}</div>
                          {q.participant_slot && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 text-[10px] border border-sky-800">
                              TS {q.participant_slot}
                            </span>
                          )}
                          {q.points && (
                            <span className="inline-block mt-0.5 ml-1 px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 text-[10px] border border-amber-800">
                              {q.points}đ
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 max-w-sm">
                          <p className="line-clamp-2 text-white/90" title={q.question_text}>
                            {q.question_text}
                          </p>
                          {q.obstacle_info && (
                            <div className="mt-1 text-[10px] text-amber-300 font-mono">
                              CNV: {q.obstacle_info.obstacleKey} ({q.obstacle_info.obstacleImage || 'Không có ảnh'})
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-emerald-400 whitespace-pre-wrap max-w-xs">
                          {q.correct_key}
                          {q.answer_media_url && (
                            <div className="mt-0.5 text-[10px] text-sky-300 flex items-center gap-1 font-normal">
                              <ImageIcon className="w-3 h-3" />
                              <span>Đáp án: {q.answer_media_url}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-[11px] whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {q.media_url && (
                              <span className="inline-flex items-center gap-1 text-sky-300 text-[10px] bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800">
                                {q.media_type === 'VIDEO' ? <Video className="w-3 h-3 text-rose-400" /> : <ImageIcon className="w-3 h-3 text-sky-400" />}
                                <span className="truncate max-w-[100px]">{q.media_url}</span>
                              </span>
                            )}
                            {q.audio_url && (
                              <span className="inline-flex items-center gap-1 text-amber-300 text-[10px] bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800">
                                <Volume2 className="w-3 h-3 text-amber-400" />
                                <span className="truncate max-w-[100px]">{q.audio_url}</span>
                              </span>
                            )}
                            {q.media_links && q.media_links.length > 0 && (
                              <span className="text-[10px] text-purple-300">
                                {q.media_links.length} media links
                              </span>
                            )}
                            {!q.media_url && !q.audio_url && (
                              <span className="text-white/30 text-[10px]">Không</span>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5 text-[11px] text-white/60 max-w-xs">
                          {q.host_notes || q.explanation || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: AI PARSE UNSTRUCTURED TEXT */}
      {activeSubTab === 'AI_PARSE' && (
        <div className="space-y-4">
          <div className="fluent-box p-5 rounded-[4px] border border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Dán Đề Thi Thô / Bảng Sao Chép Để AI Bóc Tách
            </h3>
            <p className="text-xs text-white/60">
              Dán nội dung đề thi từ Word, văn bản PDF hoặc Google Form. Trợ lý AI sẽ tự động phân tách câu hỏi, các lựa chọn A/B/C/D, đáp án đúng và phân loại vào 6 Miền năng lực số của TT 02/2025.
            </p>

            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              rows={8}
              placeholder="Ví dụ:&#10;Câu 1: Theo Nghị định 13/2023/NĐ-CP, hành vi nào bị nghiêm cấm?&#10;A. Xử lý dữ liệu cá nhân theo hợp đồng&#10;B. Xử lý dữ liệu cá nhân trái quy định pháp luật&#10;C. Xóa dữ liệu khi có yêu cầu&#10;D. Cập nhật dữ liệu chính xác&#10;Đáp án: B. Giải thích: Điều 8 NĐ 13/2023..."
              className="w-full bg-black/50 border border-white/15 rounded-[4px] p-3 text-xs text-white font-mono placeholder-white/30 focus:border-emerald-400 focus:outline-none"
            />

            <button
              type="button"
              onClick={handleAiParseText}
              disabled={isAiParsing || !rawText.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-[4px] text-xs font-bold uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition disabled:opacity-50 cursor-pointer"
            >
              {isAiParsing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Đang Nhận Diện & Bóc Tách...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Bóc Tách & Nhập Vào Mẫu BTI 2026</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: EXPORT EXCEL */}
      {activeSubTab === 'EXPORT' && (
        <div className="space-y-4">
          <div className="fluent-box p-5 rounded-[4px] border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Download className="w-4 h-4 text-sky-400" />
              Xuất Ngân Hàng Câu Hỏi Ra File Excel Chuẩn
            </h3>
            <p className="text-xs text-white/60">
              Hệ thống sẽ biên soạn và tải về file Excel đa sheet đúng chuẩn mẫu phần mềm điều khiển trận đấu BTI 2026 (Khởi động, VCNV, Tăng tốc, Về đích, Câu hỏi phụ).
            </p>

            <div className="max-w-md space-y-3">
              <div>
                <label className="block text-xs font-mono text-white/70 mb-1.5 font-semibold">
                  Chọn Giai Đoạn Xuất Đề:
                </label>
                <select
                  value={exportStage}
                  onChange={e => setExportStage(e.target.value as any)}
                  className="w-full bg-black/50 border border-white/15 rounded-[4px] px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                >
                  <option value="ALL">Tất Cả Các Giai Đoạn (Toàn bộ ngân hàng)</option>
                  <option value="VONG_LOAI">Vòng loại (Theo đề thi chuẩn Bộ GD&ĐT)</option>
                  <option value="BAN_KET_1">Vòng Bán kết 1</option>
                  <option value="BAN_KET_2">Vòng Bán kết 2</option>
                  <option value="BAN_KET_3">Vòng Bán kết 3</option>
                  <option value="CHUNG_KET">Đêm Chung kết</option>
                </select>
              </div>

              <div className="p-3 bg-white/5 rounded-[4px] border border-white/10 text-xs font-mono text-white/70 space-y-1">
                <div className="flex justify-between">
                  <span>Tổng số câu hiện có:</span>
                  <strong className="text-white">{questionBankManager.getQuestions().length} câu</strong>
                </div>
                <div className="flex justify-between">
                  <span>Định dạng xuất:</span>
                  <strong className="text-emerald-400">Microsoft Excel (.xlsx) chuẩn BTC</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[4px] text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition cursor-pointer"
              >
                {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Tải File Excel Ngân Hàng Đề Thi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Question Import Modal (Text & Excel Copy-Paste) */}
      {showBulkModal && (
        <BulkQuestionImportModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          onImportSuccess={() => {
            if (onImportComplete) onImportComplete();
          }}
        />
      )}
    </div>
  );
};
