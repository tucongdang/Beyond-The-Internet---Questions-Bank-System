import React, { useState, useRef, useMemo } from 'react';
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
  FileCheck,
  Cpu,
  Sliders,
  Check,
  Settings2,
  ArrowRight,
  BookOpen,
  Save,
  CheckCheck
} from 'lucide-react';
import { 
  excelService, 
  SAMPLE_BTI_EXCEL_DATA, 
  CustomTemplateBlueprint, 
  ColumnMappingItem, 
  MappedQuestionField, 
  MAPPED_FIELD_LABELS, 
  customTemplateStorage 
} from '../../services/excelService';
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
  const templateFileInputRef = useRef<HTMLInputElement>(null);
  const [activeSubTab, setActiveSubTab] = useState<'IMPORT' | 'EXPORT' | 'AI_PARSE' | 'GUIDE' | 'TEMPLATE_LEARNER'>('IMPORT');
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);

  // Upload mode: Import questions into bank vs Learn template form structure
  const [uploadMode, setUploadMode] = useState<'IMPORT_QUESTIONS' | 'LEARN_TEMPLATE'>('IMPORT_QUESTIONS');

  // Learned Template States
  const [savedBlueprints, setSavedBlueprints] = useState<CustomTemplateBlueprint[]>(() => customTemplateStorage.getAll());
  const [activeBlueprint, setActiveBlueprint] = useState<CustomTemplateBlueprint | null>(() => customTemplateStorage.getActive());
  const [activeSheetName, setActiveSheetName] = useState<string>(() => {
    const act = customTemplateStorage.getActive();
    return act ? act.targetSheetName : '';
  });
  const [isAnalyzingTemplate, setIsAnalyzingTemplate] = useState<boolean>(false);
  const [templateSuccessMsg, setTemplateSuccessMsg] = useState<string | null>(null);
  const [showPreHeaderPreview, setShowPreHeaderPreview] = useState<boolean>(false);

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
  const [exportMode, setExportMode] = useState<'BTI_OFFICIAL' | 'CUSTOM_ADAPTIVE'>('BTI_OFFICIAL');
  const [exportStage, setExportStage] = useState<CompetitionStage | 'ALL'>('ALL');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Bank questions & stage statistics for export
  const allBankQuestions = useMemo(() => questionBankManager.getQuestions(), [activeSubTab]);
  const stageStats = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: allBankQuestions.length,
      VONG_LOAI: 0,
      BAN_KET_1: 0,
      BAN_KET_2: 0,
      BAN_KET_3: 0,
      CHUNG_KET: 0,
    };
    allBankQuestions.forEach(q => {
      if (q.stage && counts[q.stage] !== undefined) {
        counts[q.stage]++;
      }
    });
    return counts;
  }, [allBankQuestions]);

  const questionsToExportCount = exportStage === 'ALL' 
    ? allBankQuestions.length 
    : (stageStats[exportStage] || 0);

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

  // Handle Learning a Template from File
  const handleLearnTemplateFile = async (file: File) => {
    setIsAnalyzingTemplate(true);
    setParseWarnings([]);
    setTemplateSuccessMsg(null);
    vibrateTap();
    soundFx.playClick();

    try {
      const blueprint = await excelService.analyzeCustomTemplate(file);
      setActiveBlueprint(blueprint);
      setActiveSheetName(blueprint.targetSheetName);
      setSavedBlueprints(customTemplateStorage.getAll());
      setActiveSubTab('TEMPLATE_LEARNER');
      setTemplateSuccessMsg(`Agent đã giải mã thành công cấu trúc mẫu "${file.name}" (${blueprint.systemName || 'Hệ thống khảo thí'})!`);
      soundFx.playCorrect();
      vibrateSuccess();
    } catch (err: any) {
      console.error('Template analysis error:', err);
      setParseWarnings([err.message || 'Lỗi khi phân tích cấu trúc mẫu đề.']);
      soundFx.playError();
    } finally {
      setIsAnalyzingTemplate(false);
    }
  };

  // Handle File Upload & Parsing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadMode === 'LEARN_TEMPLATE') {
      await handleLearnTemplateFile(file);
      if (e.target) e.target.value = '';
      return;
    }

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

  // Learn currently uploaded file as a custom template
  const handleQuickLearnCurrentFile = async () => {
    if (!selectedFile) return;
    await handleLearnTemplateFile(selectedFile);
  };

  // Update Column Mapping in Active Blueprint
  const handleUpdateColumnMapping = (colIndex: number, newField: MappedQuestionField) => {
    if (!activeBlueprint) return;
    const updated: CustomTemplateBlueprint = JSON.parse(JSON.stringify(activeBlueprint));
    const sheet = updated.sheets.find(s => s.sheetName === activeSheetName) || updated.sheets[0];
    if (sheet) {
      const col = sheet.columns.find(c => c.colIndex === colIndex);
      if (col) {
        col.mappedField = newField;
        col.confidence = 1.0;
      }
    }
    setActiveBlueprint(updated);
    customTemplateStorage.save(updated);
    setSavedBlueprints(customTemplateStorage.getAll());
    vibrateTap();
  };

  // Update Constant Value for a Column
  const handleUpdateConstantValue = (colIndex: number, val: string) => {
    if (!activeBlueprint) return;
    const updated: CustomTemplateBlueprint = JSON.parse(JSON.stringify(activeBlueprint));
    const sheet = updated.sheets.find(s => s.sheetName === activeSheetName) || updated.sheets[0];
    if (sheet) {
      const col = sheet.columns.find(c => c.colIndex === colIndex);
      if (col) {
        col.constantValue = val;
      }
    }
    setActiveBlueprint(updated);
    customTemplateStorage.save(updated);
    setSavedBlueprints(customTemplateStorage.getAll());
  };

  // Select another saved blueprint
  const handleSelectActiveBlueprint = (blueprint: CustomTemplateBlueprint) => {
    setActiveBlueprint(blueprint);
    setActiveSheetName(blueprint.targetSheetName);
    customTemplateStorage.setActive(blueprint.id);
    vibrateTap();
    soundFx.playClick();
  };

  // Delete a saved blueprint
  const handleDeleteActiveBlueprint = (blueprintId: string) => {
    vibrateTap();
    soundFx.playPop();
    customTemplateStorage.delete(blueprintId);
    const updatedList = customTemplateStorage.getAll();
    setSavedBlueprints(updatedList);
    const act = customTemplateStorage.getActive();
    setActiveBlueprint(act);
    setActiveSheetName(act ? act.targetSheetName : '');
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

  // Handle Export to Excel (Standard BTI or Matching Custom Template)
  const handleExport = () => {
    vibrateTap();
    soundFx.playClick();
    setIsExporting(true);

    try {
      const allQ = questionBankManager.getQuestions();
      const filtered = exportStage === 'ALL' 
        ? allQ 
        : allQ.filter(q => q.stage === exportStage);

      if (exportMode === 'CUSTOM_ADAPTIVE') {
        if (!activeBlueprint) {
          throw new Error('Vui lòng chọn hoặc nạp mẫu đề tùy biến trước khi xuất.');
        }
        excelService.exportMatchingCustomTemplate(filtered, activeBlueprint, 'Đề thi.xlsx');
      } else {
        excelService.exportQuestionsToExcel(filtered, 'Đề thi.xlsx');
      }
      soundFx.playCorrect();
      vibrateSuccess();
    } catch (e: any) {
      console.error('Export error:', e);
      soundFx.playError();
      alert(`Lỗi xuất file Excel: ${e.message || e}`);
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

      {/* Tabs: Import vs Template Learner vs Export vs Guide vs AI Parse */}
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
          onClick={() => setActiveSubTab('TEMPLATE_LEARNER')}
          className={`px-4 py-2.5 text-xs font-mono font-bold transition flex items-center gap-2 border-b-2 -mb-px cursor-pointer whitespace-nowrap ${
            activeSubTab === 'TEMPLATE_LEARNER'
              ? 'border-purple-400 text-purple-400 bg-purple-950/20'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4 text-purple-400" />
          <span>Học & Khớp Mẫu Đề (Adaptive Blueprint)</span>
          {savedBlueprints.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/30 text-purple-300 font-mono font-bold">
              {savedBlueprints.length}
            </span>
          )}
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
          {/* Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/[0.02] border border-white/10 rounded-[4px]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-white/50">Mục đích thao tác:</span>
              <div className="inline-flex p-0.5 rounded bg-black/60 border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode('IMPORT_QUESTIONS');
                    vibrateTap();
                  }}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    uploadMode === 'IMPORT_QUESTIONS'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>1. Nhập Câu Hỏi Vào Ngân Hàng</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode('LEARN_TEMPLATE');
                    vibrateTap();
                  }}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    uploadMode === 'LEARN_TEMPLATE'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-purple-300" />
                  <span>2. Phân Tích & Học Mẫu Đề Này (Adaptive)</span>
                </button>
              </div>
            </div>

            {savedBlueprints.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('TEMPLATE_LEARNER');
                  vibrateTap();
                }}
                className="text-xs font-mono text-purple-300 hover:text-purple-200 flex items-center gap-1 cursor-pointer"
              >
                <span>Xem {savedBlueprints.length} mẫu đã học</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Drag & drop dropzone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[4px] p-8 sm:p-12 text-center cursor-pointer transition space-y-3 ${
              uploadMode === 'LEARN_TEMPLATE'
                ? 'border-purple-500/40 hover:border-purple-400 bg-purple-950/10 hover:bg-purple-950/20'
                : 'border-white/20 hover:border-emerald-400/60 bg-black/40 hover:bg-emerald-950/10'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className={`w-14 h-14 rounded-full border flex items-center justify-center mx-auto ${
              uploadMode === 'LEARN_TEMPLATE'
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              {uploadMode === 'LEARN_TEMPLATE' ? <Cpu className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-white font-mono">
                {uploadMode === 'LEARN_TEMPLATE'
                  ? (selectedFile ? selectedFile.name : 'Bấm để nạp file Excel mẫu của hệ thống thi để Agent học cấu trúc')
                  : (selectedFile ? selectedFile.name : 'Bấm để chọn hoặc kéo thả tệp Excel vào đây')}
              </p>
              <p className="text-xs text-white/50 max-w-xl mx-auto">
                {uploadMode === 'LEARN_TEMPLATE'
                  ? 'Tải lên mẫu nhập đề của Azota, K12Online, OLM, Shub, Quizizz, Canvas... Agent sẽ tự động giải mã vị trí cột và ghi nhớ để xuất đề khớp 100%!'
                  : 'Tự động nhận diện cấu trúc tệp mẫu chuẩn: KHOI_DONG (Lượt riêng/Lượt chung), VUOT_CNV, TANG_TOC, VE_DICH, CAU_HOI_PHU và VÒNG LOẠI BỘ GD&ĐT.'}
              </p>
            </div>

            {(isParsing || isAnalyzingTemplate) && (
              <div className={`inline-flex items-center gap-2 text-xs font-mono animate-pulse pt-2 ${
                uploadMode === 'LEARN_TEMPLATE' ? 'text-purple-400' : 'text-emerald-400'
              }`}>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>
                  {uploadMode === 'LEARN_TEMPLATE'
                    ? 'Agent đang phân tích & giải mã cấu trúc mẫu đề...'
                    : 'Đang phân tích cấu trúc các trang tính...'}
                </span>
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
                    onClick={handleQuickLearnCurrentFile}
                    className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 text-xs font-mono rounded-[4px] border border-purple-800 transition flex items-center gap-1.5 cursor-pointer"
                    title="Lưu cấu trúc tệp này làm mẫu xuất đề thích ứng"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Học Mẫu File Này</span>
                  </button>

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

      {/* SUB-TAB: ADAPTIVE TEMPLATE LEARNER */}
      {activeSubTab === 'TEMPLATE_LEARNER' && (
        <div className="space-y-5">
          {/* Header Action & Selector Bar */}
          <div className="fluent-box p-5 rounded-[4px] border border-purple-500/30 bg-gradient-to-r from-purple-950/30 via-black/40 to-slate-950/30 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30 mb-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>Agent Adaptive Blueprint Engine</span>
                </div>
                <h3 className="text-base font-bold text-white font-mono">
                  Phân Tích & Tái Tạo Mẫu Đề Thi Tùy Biến
                </h3>
                <p className="text-xs text-white/60">
                  Khi bạn nạp file Excel mẫu của bất kỳ hệ thống khảo thí nào (Azota, K12Online, OLM, Shub, Quizizz, Bộ GD&ĐT...), Agent sẽ ghi nhớ cấu trúc cột, tiêu đề và các dòng chỉ dẫn để xuất đề thi khớp 100%.
                </p>
              </div>

              {/* Upload new template button */}
              <div className="flex items-center gap-2 shrink-0">
                <input
                  ref={templateFileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleLearnTemplateFile(f);
                    if (e.target) e.target.value = '';
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => templateFileInputRef.current?.click()}
                  disabled={isAnalyzingTemplate}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-[4px] text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 shadow-md shadow-purple-950/50 transition cursor-pointer disabled:opacity-50"
                >
                  {isAnalyzingTemplate ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang Phân Tích...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Nạp Mẫu Đề Mới (.xlsx)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* List of saved blueprints if any */}
            {savedBlueprints.length > 0 && (
              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-white/50">Mẫu đã ghi nhớ:</span>
                {savedBlueprints.map(bp => {
                  const isActive = activeBlueprint?.id === bp.id;
                  return (
                    <button
                      key={bp.id}
                      type="button"
                      onClick={() => handleSelectActiveBlueprint(bp)}
                      className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-purple-500/25 text-purple-200 border border-purple-400/50 shadow'
                          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
                      <span className="max-w-[180px] truncate">{bp.name}</span>
                      {bp.systemName && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                          {bp.systemName}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Success / Warning notifications */}
          {templateSuccessMsg && (
            <div className="p-4 bg-purple-950/40 border border-purple-500/50 rounded-[4px] text-purple-200 text-xs font-mono flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
                <span>{templateSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setTemplateSuccessMsg(null)}
                className="text-white/50 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* If No Blueprint Saved */}
          {!activeBlueprint && (
            <div className="fluent-box p-12 text-center rounded-[4px] border border-dashed border-white/20 space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                <Cpu className="w-8 h-8 animate-pulse" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-base font-bold text-white font-mono">Chưa Có Mẫu Đề Nào Được Học</h4>
                <p className="text-xs text-white/60 leading-relaxed">
                  Tải lên tệp Excel mẫu nhập đề của trường, sở hoặc các phần mềm thi online (Azota, K12Online, OLM, Canvas...). Trợ lý AI sẽ giải mã cấu trúc tệp ngay lập tức để đồng bộ xuất đề.
                </p>
              </div>
              <button
                type="button"
                onClick={() => templateFileInputRef.current?.click()}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-[4px] text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-2 shadow-lg shadow-purple-950/50 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Chọn File Mẫu Excel (.xlsx) Để Phân Tích</span>
              </button>
            </div>
          )}

          {/* Active Blueprint Detail Inspector */}
          {activeBlueprint && (() => {
            const currentSheet = activeBlueprint.sheets.find(s => s.sheetName === activeSheetName) || activeBlueprint.sheets[0];
            const mappedCount = currentSheet?.columns.filter(c => c.mappedField !== 'unmapped').length || 0;

            return (
              <div className="space-y-4">
                {/* Blueprint Summary Card */}
                <div className="fluent-box p-5 rounded-[4px] border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-400/30">
                          {activeBlueprint.systemName || 'Hệ thống khảo thí'}
                        </span>
                        <h4 className="text-sm font-bold text-white font-mono">
                          {activeBlueprint.name}
                        </h4>
                      </div>
                      <p className="text-xs text-white/50 mt-1 font-mono">
                        Thời gian phân tích: {new Date(activeBlueprint.analyzedAt).toLocaleString('vi-VN')} • {currentSheet?.columns.length || 0} cột • {mappedCount} cột đã ánh xạ
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setExportMode('CUSTOM_ADAPTIVE');
                          setActiveSubTab('EXPORT');
                          vibrateTap();
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[4px] text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Xuất Khớp Mẫu Này</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteActiveBlueprint(activeBlueprint.id)}
                        className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 rounded-[4px] text-xs font-mono border border-rose-800/60 transition cursor-pointer"
                        title="Xóa mẫu đề này khỏi bộ nhớ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* AI Summary Quote */}
                  {activeBlueprint.aiSummary && (
                    <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-[4px] flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-mono font-bold text-purple-300 uppercase tracking-wide">
                          Nhận định cấu trúc của Agent:
                        </span>
                        <p className="text-xs text-white/80 leading-relaxed font-sans">
                          {activeBlueprint.aiSummary}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Sheet Tabs if multi-sheet */}
                  {activeBlueprint.sheets.length > 1 && (
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <span className="text-xs font-mono text-white/50">Trang tính (Sheet):</span>
                      {activeBlueprint.sheets.map(sh => (
                        <button
                          key={sh.sheetName}
                          type="button"
                          onClick={() => {
                            setActiveSheetName(sh.sheetName);
                            vibrateTap();
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                            activeSheetName === sh.sheetName
                              ? 'bg-purple-600 text-white shadow'
                              : 'bg-white/5 text-white/60 hover:text-white'
                          }`}
                        >
                          {sh.sheetName} ({sh.columns.length} cột)
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Pre-header preserved notice */}
                  {currentSheet && currentSheet.preHeaderRows.length > 0 && (
                    <div className="p-3 bg-white/[0.02] border border-white/10 rounded-[4px] space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono text-white/70">
                        <div className="flex items-center gap-2">
                          <CheckCheck className="w-4 h-4 text-emerald-400" />
                          <span>
                            Bảo lưu <strong>{currentSheet.preHeaderRows.length}</strong> dòng chỉ dẫn / tiêu đề gốc phía trước bảng câu hỏi (dòng 1 đến {currentSheet.headerRowIndex}).
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowPreHeaderPreview(!showPreHeaderPreview)}
                          className="text-sky-400 hover:text-sky-300 underline cursor-pointer text-[11px]"
                        >
                          {showPreHeaderPreview ? 'Ẩn dòng chỉ dẫn' : 'Xem dòng chỉ dẫn'}
                        </button>
                      </div>

                      {showPreHeaderPreview && (
                        <div className="p-2.5 bg-black/40 rounded border border-white/10 font-mono text-[11px] text-white/60 space-y-1 max-h-36 overflow-y-auto">
                          {currentSheet.preHeaderRows.map((r, rIdx) => (
                            <div key={rIdx} className="truncate">
                              <span className="text-purple-300 font-bold mr-2">Dòng {rIdx + 1}:</span>
                              {r.filter(Boolean).join(' | ') || '(Dòng trống)'}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Column Mapping Table */}
                {currentSheet && (
                  <div className="fluent-box p-5 rounded-[4px] border border-white/10 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-purple-400" />
                          Bảng Khớp Nối Cột (Column Field Mappings)
                        </h4>
                        <p className="text-xs text-white/50 mt-0.5">
                          Kiểm tra và tùy chỉnh trường dữ liệu của Ngân hàng BTI tương ứng với từng cột trong biểu mẫu Excel.
                        </p>
                      </div>

                      <span className="text-xs font-mono text-white/40">
                        Dòng tiêu đề: Hàng {currentSheet.headerRowIndex + 1}
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-white/10 rounded-[4px]">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                          <tr className="border-b border-white/15 bg-white/5 font-mono text-white/70 text-[11px]">
                            <th className="p-3 w-16 text-center">Cột</th>
                            <th className="p-3">Tiêu đề gốc trong file</th>
                            <th className="p-3">Trường tương ứng trong BTI</th>
                            <th className="p-3">Dữ liệu mẫu từ tệp</th>
                            <th className="p-3 w-32 text-center">Độ tin cậy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/80">
                          {currentSheet.columns.map(col => {
                            const colLetter = String.fromCharCode(65 + (col.colIndex % 26));
                            const isUnmapped = col.mappedField === 'unmapped';

                            return (
                              <tr 
                                key={col.colIndex} 
                                className={`hover:bg-white/[0.03] transition ${
                                  isUnmapped ? 'opacity-60 bg-white/[0.01]' : ''
                                }`}
                              >
                                <td className="p-3 text-center font-mono font-bold text-purple-300">
                                  {colLetter}
                                  <div className="text-[10px] text-white/30 font-normal">#{col.colIndex + 1}</div>
                                </td>

                                <td className="p-3 font-mono font-bold text-white/90">
                                  <span>{col.originalHeader || `(Cột ${col.colIndex + 1})`}</span>
                                </td>

                                <td className="p-3">
                                  <select
                                    value={col.mappedField}
                                    onChange={e => handleUpdateColumnMapping(col.colIndex, e.target.value as MappedQuestionField)}
                                    className={`w-full max-w-xs px-2.5 py-1.5 text-xs font-mono rounded-[4px] border focus:outline-none transition cursor-pointer ${
                                      col.mappedField === 'unmapped'
                                        ? 'bg-black/40 border-white/20 text-white/40'
                                        : 'bg-purple-950/40 border-purple-500/50 text-purple-200 font-bold'
                                    }`}
                                  >
                                    {Object.entries(MAPPED_FIELD_LABELS).map(([fieldKey, label]) => (
                                      <option key={fieldKey} value={fieldKey} className="bg-slate-900 text-white">
                                        {label}
                                      </option>
                                    ))}
                                  </select>

                                  {col.mappedField === 'custom_constant' && (
                                    <input
                                      type="text"
                                      placeholder="Nhập giá trị cố định..."
                                      value={col.constantValue || ''}
                                      onChange={e => handleUpdateConstantValue(col.colIndex, e.target.value)}
                                      className="mt-1.5 w-full max-w-xs px-2.5 py-1 bg-black/50 border border-white/20 rounded text-xs font-mono text-white placeholder-white/30"
                                    />
                                  )}
                                </td>

                                <td className="p-3 font-mono text-[11px] text-white/60 max-w-xs">
                                  {col.sampleValues.length > 0 ? (
                                    <div className="flex flex-col gap-0.5">
                                      {col.sampleValues.slice(0, 2).map((s, sIdx) => (
                                        <span key={sIdx} className="truncate text-white/70 bg-white/5 px-1.5 py-0.5 rounded border border-white/5" title={s}>
                                          {s}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-white/30 italic">Không có mẫu</span>
                                  )}
                                </td>

                                <td className="p-3 text-center">
                                  {col.confidence && col.confidence >= 0.9 ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                                      <Check className="w-3 h-3" />
                                      {Math.round(col.confidence * 100)}%
                                    </span>
                                  ) : col.confidence && col.confidence >= 0.5 ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800">
                                      Dự đoán {Math.round(col.confidence * 100)}%
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-mono text-white/40">
                                      Tùy chọn
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="text-xs text-white/50 font-mono">
                        * Mẹo: Bạn có thể chọn lại trường dữ liệu cho bất kỳ cột nào. Thay đổi sẽ tự động được lưu.
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setExportMode('CUSTOM_ADAPTIVE');
                          setActiveSubTab('EXPORT');
                          vibrateTap();
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-[4px] text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Chuyển Sang Tab Xuất Đề Khớp Mẫu</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
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

      {/* SUB-TAB 3: EXPORT EXCEL - Fluent UI v2 Responsive Multi-Column Layout */}
      {activeSubTab === 'EXPORT' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Title Banner */}
          <div className="fluent-card p-5 rounded-[6px] bg-gradient-to-r from-[#1C093B]/90 via-[#18072e]/90 to-[#0e1c31]/90 border border-purple-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Xuất Khẩu Ngân Hàng Đề Thi Chuẩn Quốc Gia</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white font-mono tracking-tight flex items-center gap-2">
                <Download className="w-5 h-5 text-sky-400" />
                Xuất Ngân Hàng Câu Hỏi Ra File Excel (.xlsx)
              </h3>
              <p className="text-xs text-slate-300/80 max-w-2xl font-sans">
                Lựa chọn xuất theo mẫu đa trang tính (6 Sheets) chuẩn Phần mềm thi đấu BTI 2026 hoặc xuất khớp 100% cấu trúc các nền tảng khảo thí bạn đã nạp (Azota, K12Online, OLM...).
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="px-3.5 py-2 rounded-[6px] bg-black/40 border border-white/10 text-right font-mono">
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Ngân hàng hiện có</span>
                <span className="text-lg font-black text-white tabular-nums">{allBankQuestions.length} câu</span>
              </div>
              <div className="px-3.5 py-2 rounded-[6px] bg-emerald-950/40 border border-emerald-500/40 text-right font-mono">
                <span className="text-[10px] text-emerald-300 block uppercase tracking-wider">Sẽ xuất tải về</span>
                <span className="text-lg font-black text-emerald-400 tabular-nums">{questionsToExportCount} câu</span>
              </div>
            </div>
          </div>

          {/* Main 2-Column Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Configuration & Export Action (col-span-7) */}
            <div className="lg:col-span-7 space-y-5">
              {/* 1. Format Selection: BTI Official vs Custom Adaptive */}
              <div className="fluent-card p-4 sm:p-5 rounded-[6px] bg-[#16072D]/90 border border-purple-500/30 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-mono">
                  <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-400" />
                    1. Lựa Chọn Định Dạng Mẫu Xuất
                  </span>
                  <span className="text-[11px] text-purple-300 font-mono">Fluent UI v2 Engine</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: BTI Official */}
                  <div
                    onClick={() => {
                      vibrateTap();
                      soundFx.playClick();
                      setExportMode('BTI_OFFICIAL');
                    }}
                    className={`p-4 rounded-[6px] border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden group ${
                      exportMode === 'BTI_OFFICIAL'
                        ? 'bg-emerald-950/30 border-emerald-500/70 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/40'
                        : 'bg-black/30 border-white/10 hover:border-emerald-500/40 hover:bg-emerald-950/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                          exportMode === 'BTI_OFFICIAL' 
                            ? 'border-emerald-400 bg-emerald-500' 
                            : 'border-white/40'
                        }`}>
                          {exportMode === 'BTI_OFFICIAL' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </div>
                        <span className="text-xs font-bold text-white font-mono">Mẫu Thi Đấu BTI 2026</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Chuẩn BTC
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300/80 leading-relaxed font-sans">
                      Đa trang tính (Khởi động, VCNV, Tăng tốc, Về đích, Câu hỏi phụ, Vòng loại BGD). Tương thích 100% phần mềm điều khiển trận đấu BTI.
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-emerald-300 border border-emerald-500/20">
                        6 Sheets riêng biệt
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-sky-300 border border-sky-500/20">
                        Tự khớp Media máy chủ
                      </span>
                    </div>
                  </div>

                  {/* Option 2: Custom Adaptive */}
                  <div
                    onClick={() => {
                      vibrateTap();
                      soundFx.playClick();
                      setExportMode('CUSTOM_ADAPTIVE');
                    }}
                    className={`p-4 rounded-[6px] border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden group ${
                      exportMode === 'CUSTOM_ADAPTIVE'
                        ? 'bg-purple-950/30 border-purple-500/70 shadow-lg shadow-purple-950/30 ring-1 ring-purple-500/40'
                        : 'bg-black/30 border-white/10 hover:border-purple-500/40 hover:bg-purple-950/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                          exportMode === 'CUSTOM_ADAPTIVE' 
                            ? 'border-purple-400 bg-purple-500' 
                            : 'border-white/40'
                        }`}>
                          {exportMode === 'CUSTOM_ADAPTIVE' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs font-bold text-white font-mono">Mẫu Tùy Biến Đã Học</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {savedBlueprints.length} Mẫu
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300/80 leading-relaxed font-sans">
                      Tái tạo 100% thứ tự cột, tiêu đề và banner hướng dẫn của hệ thống khảo thí bạn đã nạp (Azota, K12Online, OLM...).
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-purple-300 border border-purple-500/20">
                        Khớp cột thông minh
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-amber-300 border border-amber-500/20">
                        Bảo lưu banner gốc
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Stage Filter / Scope Selector */}
              <div className="fluent-card p-4 sm:p-5 rounded-[6px] bg-[#16072D]/90 border border-purple-500/30 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-mono">
                  <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-emerald-400" />
                    2. Phạm Vi Giai Đoạn Câu Hỏi Muốn Xuất
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Đang chọn: <strong className="text-emerald-400">{questionsToExportCount} câu</strong>
                  </span>
                </div>

                {/* Quick Stage Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'ALL', label: 'Tất Cả Giai Đoạn', count: stageStats.ALL, desc: 'Toàn bộ ngân hàng đề' },
                    { id: 'VONG_LOAI', label: 'Vòng Loại BGD', count: stageStats.VONG_LOAI, desc: 'Chuẩn 28 câu TT 02' },
                    { id: 'BAN_KET_1', label: 'Bán Kết 1', count: stageStats.BAN_KET_1, desc: 'Trận bán kết 1' },
                    { id: 'BAN_KET_2', label: 'Bán Kết 2', count: stageStats.BAN_KET_2, desc: 'Trận bán kết 2' },
                    { id: 'BAN_KET_3', label: 'Bán Kết 3', count: stageStats.BAN_KET_3, desc: 'Trận bán kết 3' },
                    { id: 'CHUNG_KET', label: 'Đêm Chung Kết', count: stageStats.CHUNG_KET, desc: 'Trận chung kết xếp hạng' },
                  ].map(stage => {
                    const isSelected = exportStage === stage.id;
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setExportStage(stage.id as any);
                        }}
                        className={`p-2.5 rounded-[4px] border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500/70 shadow-sm ring-1 ring-emerald-500/30'
                            : 'bg-black/30 border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className={`font-bold truncate ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                            {stage.label}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold tabular-nums ${
                            isSelected ? 'bg-emerald-500/30 text-emerald-200' : 'bg-white/10 text-white/60'
                          }`}>
                            {stage.count}
                          </span>
                        </div>
                        <span className="text-[10px] text-white/50 truncate font-sans mt-0.5">{stage.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Live Export Metric Summary (Image 1 Style) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="fluent-card p-3.5 rounded-[6px] bg-[#1C093B]/80 border border-purple-500/40 space-y-1 shadow-md">
                  <div className="flex items-center justify-between text-xs font-mono text-purple-200">
                    <span className="font-semibold text-slate-200">Số Câu Sẽ Xuất</span>
                    <Layers className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <strong className="text-2xl font-black text-white font-mono tracking-tight tabular-nums">
                      {questionsToExportCount}
                    </strong>
                    <span className="text-[11px] font-mono text-slate-400">/ {allBankQuestions.length} câu</span>
                  </div>
                  <p className="text-[10px] text-purple-200/80 font-mono truncate">
                    {exportStage === 'ALL' ? 'Toàn bộ câu hỏi hệ thống' : `Lọc theo ${exportStage}`}
                  </p>
                </div>

                <div className="fluent-card p-3.5 rounded-[6px] bg-emerald-950/25 border border-emerald-500/40 space-y-1 shadow-md">
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-300">
                    <span className="font-semibold text-slate-200">Tên Tệp Xuất</span>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <strong className="text-lg font-black text-emerald-300 font-mono tracking-tight">
                      Đề thi.xlsx
                    </strong>
                  </div>
                  <p className="text-[10px] text-emerald-200/80 font-mono truncate">
                    Tên cố định điều khiển BTI
                  </p>
                </div>

                <div className="fluent-card p-3.5 rounded-[6px] bg-sky-950/25 border border-sky-500/40 space-y-1 shadow-md">
                  <div className="flex items-center justify-between text-xs font-mono text-sky-300">
                    <span className="font-semibold text-slate-200">Quy Chuẩn Xuất</span>
                    <Cpu className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <strong className="text-lg font-black text-sky-300 font-mono tracking-tight truncate">
                      {exportMode === 'BTI_OFFICIAL' ? '6 Sheets BTC' : (activeBlueprint?.name || 'Tùy Biến')}
                    </strong>
                  </div>
                  <p className="text-[10px] text-sky-200/80 font-mono truncate">
                    {exportMode === 'BTI_OFFICIAL' ? 'Đa sheet tương thích 100%' : 'Khớp cột khảo thí'}
                  </p>
                </div>
              </div>

              {/* 4. Action Export Button */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting || (exportMode === 'CUSTOM_ADAPTIVE' && !activeBlueprint)}
                  className={`w-full py-3.5 px-5 rounded-[6px] text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-1px] active:translate-y-[0px] ${
                    exportMode === 'CUSTOM_ADAPTIVE'
                      ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/50'
                      : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/50'
                  }`}
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Đang Xuất File Excel & Ánh Xạ Media...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-white" />
                      <span>
                        {exportMode === 'CUSTOM_ADAPTIVE'
                          ? `Tải File Khớp Mẫu "${activeBlueprint?.name || 'Tùy Biến'}"`
                          : 'Tải File "Đề thi.xlsx" Chuẩn Điều Khiển BTI 2026'}
                      </span>
                    </>
                  )}
                </button>
                <p className="text-center text-[10.5px] text-slate-400 font-sans">
                  💡 Tệp Excel sau khi tải về có thể nạp trực tiếp vào phần mềm điều khiển trận đấu BTI 2026 mà không cần chỉnh sửa thủ công.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: Technical Specs & Sheet Structure (col-span-5) */}
            <div className="lg:col-span-5 space-y-4">
              {exportMode === 'BTI_OFFICIAL' ? (
                <>
                  {/* Card 1: Technical Regulation & Server Media Folder Tree */}
                  <div className="fluent-card p-4 sm:p-5 rounded-[6px] bg-emerald-950/20 border border-emerald-500/40 space-y-3.5 shadow-xl">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wide">
                          Quy Định Kỹ Thuật Phần Mềm BTI 2026
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        Đề thi.xlsx
                      </span>
                    </div>

                    {/* Media Directory Tree Inspector */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                        📁 Cây Thư Mục Media Trên Máy Chủ Trận Đấu:
                      </span>
                      <div className="p-3 rounded-[4px] bg-black/60 border border-emerald-500/20 font-mono text-[11px] space-y-1.5">
                        <div className="text-slate-400 flex items-center gap-1">
                          <span className="text-emerald-400">📂</span> Server_BTI_2026/
                        </div>
                        <div className="pl-4 text-slate-300 space-y-1 border-l border-white/10 ml-2">
                          <div className="flex items-center gap-1.5 text-slate-200">
                            <span className="text-amber-400">📁</span>
                            <strong className="text-white">StudentImage/</strong>
                            <span className="text-slate-400 text-[10px]">— Ảnh đại diện thí sinh (slot 1-4)</span>
                          </div>
                          <div className="text-slate-200 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sky-400">📁</span>
                              <strong className="text-white">Media/</strong>
                            </div>
                            <div className="pl-4 space-y-1 border-l border-white/10 ml-2 text-[10.5px]">
                              <div><span className="text-teal-400">📁 Starting/</span> <span className="text-slate-400">— Media Khởi Động & Vòng loại BGD</span></div>
                              <div><span className="text-teal-400">📁 Obstacle/</span> <span className="text-slate-400">— Ảnh gợi ý & Ô trung tâm VCNV</span></div>
                              <div><span className="text-teal-400">📁 Acceleration/</span> <span className="text-slate-400">— Tăng Tốc (<code className="text-amber-300">AC1, AC2, AC3, AC4</code>)</span></div>
                              <div><span className="text-teal-400">📁 Finish/</span> <span className="text-slate-400">— Media câu hỏi Về Đích</span></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Auto-matching Rule */}
                    <div className="p-3 rounded-[4px] bg-black/40 border border-white/10 space-y-1.5 text-[11px] font-mono">
                      <span className="text-sky-300 font-bold flex items-center gap-1.5">
                        ⚙️ Cơ Chế Tự Động Khớp Dữ Liệu:
                      </span>
                      <p className="text-slate-300/80 leading-relaxed text-[10.5px] font-sans">
                        • Tên tệp xuất luôn được cố định là <strong className="text-emerald-300 font-mono">Đề thi.xlsx</strong> (không đổi tên khi nạp vào phần mềm điều khiển trận đấu).<br />
                        • Trong file Excel chỉ lưu <strong className="text-white">tên file gốc</strong> (ví dụ: <code className="text-amber-300 font-mono">cnv.jpg</code>, <code className="text-amber-300 font-mono">tt1.png</code>, <code className="text-amber-300 font-mono">audio.mp3</code>), phần mềm điều khiển sẽ tự động quét và liên kết đúng thư mục phần thi tương ứng.
                      </p>
                    </div>
                  </div>

                  {/* Card 2: 6 Sheets Breakdown in Output Workbook */}
                  <div className="fluent-card p-4 sm:p-5 rounded-[6px] bg-[#16072D]/90 border border-purple-500/30 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-mono">
                      <span className="font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                        Cấu Trúc 6 Trang Tính Trong "Đề thi.xlsx"
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">6/6 Sheets</span>
                    </div>

                    <div className="space-y-1.5 font-mono text-xs">
                      {[
                        { sheet: 'Khởi động', desc: '12 câu lượt riêng (4 thí sinh) + 12 câu lượt chung', color: 'text-amber-300 border-amber-500/30 bg-amber-950/20' },
                        { sheet: 'VCNV', desc: '4 từ hàng ngang + 1 từ khóa trung tâm + ảnh CNV', color: 'text-emerald-300 border-emerald-500/30 bg-emerald-950/20' },
                        { sheet: 'Tăng tốc', desc: '4 câu hỏi với thời gian phản hồi tăng dần', color: 'text-purple-300 border-purple-500/30 bg-purple-950/20' },
                        { sheet: 'Về đích', desc: 'Gói 20đ & 30đ có hỗ trợ cờ Ngôi sao hy vọng', color: 'text-rose-300 border-rose-500/30 bg-rose-950/20' },
                        { sheet: 'Câu hỏi phụ', desc: '3 câu hỏi phụ phân định thắng thua khi hòa điểm', color: 'text-indigo-300 border-indigo-500/30 bg-indigo-950/20' },
                        { sheet: 'Vòng loại Bộ GD&ĐT', desc: '28 câu trắc nghiệm & điền chuẩn TT 02/2025', color: 'text-sky-300 border-sky-500/30 bg-sky-950/20' },
                      ].map((item, idx) => (
                        <div key={idx} className={`p-2 rounded-[4px] border flex items-center justify-between gap-2 ${item.color}`}>
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-black/40 flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <strong className="text-white text-xs">{item.sheet}</strong>
                          </div>
                          <span className="text-[10.5px] text-slate-300/80 font-sans truncate max-w-[220px]">
                            {item.desc}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Adaptive Blueprint Details */
                <div className="fluent-card p-4 sm:p-5 rounded-[6px] bg-purple-950/20 border border-purple-500/40 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="text-xs font-mono font-bold text-purple-200 uppercase tracking-wide">
                        Khớp Mẫu Đề Thi Khảo Thí (Adaptive)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                      {savedBlueprints.length} Mẫu
                    </span>
                  </div>

                  {savedBlueprints.length === 0 ? (
                    <div className="text-center py-6 space-y-3">
                      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                      <div className="space-y-1">
                        <p className="text-xs text-white font-mono font-bold">
                          Chưa có mẫu đề tùy biến nào được lưu trong hệ thống.
                        </p>
                        <p className="text-[11px] text-slate-400 font-sans max-w-sm mx-auto">
                          Tải lên bất kỳ file Excel nào từ Azota, K12Online, OLM để AI tự động giải mã cấu trúc cột và ghi nhớ mẫu đề.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveSubTab('TEMPLATE_LEARNER');
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-[4px] text-xs font-mono font-bold cursor-pointer transition shadow-md"
                      >
                        Chuyển Sang Tab Học Mẫu Đề Ngay
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-mono text-purple-200 font-bold">
                          Chọn Mẫu Khảo Thí Đã Học:
                        </label>
                        <select
                          value={activeBlueprint?.id || ''}
                          onChange={e => {
                            const bp = savedBlueprints.find(b => b.id === e.target.value);
                            if (bp) handleSelectActiveBlueprint(bp);
                          }}
                          className="w-full bg-black/60 border border-purple-500/40 rounded-[4px] px-3 py-2 text-xs text-white font-mono focus:border-purple-400 focus:outline-none"
                        >
                          {savedBlueprints.map(bp => (
                            <option key={bp.id} value={bp.id} className="bg-slate-900 text-white">
                              {bp.systemName ? `[${bp.systemName}] ` : ''}{bp.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {activeBlueprint && (() => {
                        const sheet = activeBlueprint.sheets.find(s => s.sheetName === activeSheetName) || activeBlueprint.sheets[0];
                        return (
                          <div className="p-3 bg-black/40 rounded-[4px] border border-white/10 text-xs font-mono space-y-2 text-slate-300">
                            <div className="flex justify-between pb-1.5 border-b border-white/10">
                              <span>Hệ thống nhận diện:</span>
                              <strong className="text-purple-300 font-bold">{activeBlueprint.systemName || 'Tùy biến'}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Trang tính xuất:</span>
                              <span className="text-white font-bold">{sheet?.sheetName} ({sheet?.columns.length} cột)</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Dòng chỉ dẫn bảo lưu:</span>
                              <span className="text-emerald-400 font-bold">{sheet?.preHeaderRows.length || 0} dòng tiêu đề</span>
                            </div>
                            <div className="pt-1 text-[10.5px] text-slate-400 font-sans">
                              ✓ Tệp xuất ra sẽ giữ nguyên hoàn toàn thứ tự cột, định dạng tiêu đề và văn bản hướng dẫn ban đầu của hệ thống khảo thí này.
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
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
