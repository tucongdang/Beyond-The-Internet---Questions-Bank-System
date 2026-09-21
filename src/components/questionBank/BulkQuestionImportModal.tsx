import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Plus, 
  Trash2, 
  Download, 
  Clipboard, 
  Sparkles, 
  Settings2, 
  Check, 
  Layers, 
  HelpCircle,
  FileSpreadsheet,
  Zap,
  Info,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  FileUp,
  Edit3,
  AlertCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { 
  QuestionItem, 
  CompetitionStage, 
  CognitiveLevel, 
  DigitalCompetencyDomainKey,
  QuestionRoundFormat,
  ApprovalStatus
} from '../../types';
import { DIGITAL_COMPETENCY_DOMAINS, COMPETITION_STAGES } from '../../data/digitalCompetencyData';
import { questionBankManager } from '../../services/questionBankManager';
import { excelService } from '../../services/excelService';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface BulkQuestionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (count: number) => void;
}

type InputFormatMode = 'FILE_UPLOAD' | 'EXCEL_TSV' | 'SIMPLE_TEXT';

interface ColumnMapping {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctKey: string;
  explanation: string;
  stage: string;
  round: string;
  domain: string;
  level: string;
  points: string;
  timeLimit: string;
  legalReference: string;
}

const DEFAULT_COLUMN_MAPPING: ColumnMapping = {
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctKey: '',
  explanation: '',
  stage: '',
  round: '',
  domain: '',
  level: '',
  points: '',
  timeLimit: '',
  legalReference: ''
};

export const BulkQuestionImportModal: React.FC<BulkQuestionImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  useLockBodyScroll(isOpen);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  const [inputMode, setInputMode] = useState<InputFormatMode>('FILE_UPLOAD');
  const [rawInput, setRawInput] = useState<string>('');
  
  // File Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [fileSheetNames, setFileSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('ALL');
  const [rawFileRows, setRawFileRows] = useState<any[][]>([]);
  const [detectedFileHeaders, setDetectedFileHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>(DEFAULT_COLUMN_MAPPING);
  const [showColumnMapper, setShowColumnMapper] = useState<boolean>(false);

  // Default fallback configs for batch import
  const [defaultStage, setDefaultStage] = useState<CompetitionStage | 'AUTO'>('AUTO');
  const [defaultDomain, setDefaultDomain] = useState<DigitalCompetencyDomainKey | 'AUTO'>('AUTO');
  const [defaultCognitiveLevel, setDefaultCognitiveLevel] = useState<CognitiveLevel | 'AUTO'>('AUTO');
  const [defaultPoints, setDefaultPoints] = useState<number>(10);
  const [defaultTimeLimit, setDefaultTimeLimit] = useState<number>(20);
  const [autoApprove, setAutoApprove] = useState<boolean>(true);

  // Parsed questions state & Quality filter
  const [parsedList, setParsedList] = useState<QuestionItem[]>([]);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [validationFilter, setValidationFilter] = useState<'ALL' | 'VALID' | 'ISSUES'>('ALL');
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);

  // Success Modal
  const [isSuccessModal, setIsSuccessModal] = useState<boolean>(false);
  const [successCount, setSuccessCount] = useState<number>(0);

  // Sample Text Data for demoing
  const sampleSimpleText = `Câu 1: Theo Thông tư 02/2025/TT-BGDĐT, Miền I trong Khung năng lực số người học có tên gọi là gì?
A. Khai thác dữ liệu và thông tin
B. Giao tiếp và hợp tác trong môi trường số
C. Sáng tạo nội dung số
D. An toàn và quyền riêng tư số
Đáp án: A
Giải thích: Căn cứ Phần B, Điều 4 Thông tư 02/2025/TT-BGDĐT.
Vòng: Vòng loại
Miền: Miền 1
Mức độ: Nhận biết
Điểm: 10
Thời gian: 30s

Câu 2: Về quy định bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP), hành vi nào sau đây bị nghiêm cấm?
A. Cung cấp dữ liệu cá nhân khi có sự đồng ý của chủ thể
B. Xử lý dữ liệu cá nhân trái quy định của pháp luật
C. Thông báo cho chủ thể trước khi xử lý dữ liệu cá nhân
D. Áp dụng các biện pháp kỹ thuật bảo vệ dữ liệu
Đáp án: B
Giải thích: Điều 8 Nghị định 13/2023/NĐ-CP nghiêm cấm xử lý dữ liệu trái pháp luật.
Vòng: Khởi động
Miền: Miền 4
Mức độ: Thông hiểu
Điểm: 10
Thời gian: 15s

Câu 3: Để phòng chống mã độc tống tiền (Ransomware), biện pháp quan trọng hàng đầu là sao lưu dữ liệu thường xuyên theo nguyên tắc nào?
A. Nguyên tắc 3-2-1 (3 bản sao, 2 loại phương tiện, 1 bản lưu offline/cloud)
B. Nguyên tắc 1-1-1
C. Không cần sao lưu nếu đã cài diệt virus
D. Chỉ lưu trên thẻ nhớ USB
Đáp án: A
Giải thích: Nguyên tắc 3-2-1 là tiêu chuẩn vàng sao lưu dữ liệu an toàn.
Vòng: Tăng tốc
Miền: Miền 4
Mức độ: Vận dụng
Điểm: 40
Thời gian: 20s

Câu 4: (Vượt chướng ngại vật) Tên của thuật toán mã hóa khóa công khai phổ biến nhất thế giới được đặt theo chữ cái đầu tên 3 nhà khoa học Rivest, Shamir và Adleman?
Đáp án: RSA
Giải thích: RSA là hệ mật mã hóa bất đối xứng kinh điển do Ron Rivest, Adi Shamir và Leonard Adleman công bố năm 1977.
Vòng: VCNV
Miền: Miền 4
Mức độ: Vận dụng cao
Điểm: 10
Thời gian: 15s

Câu 5: Khi nhận được thư điện tử giả mạo ngân hàng yêu cầu nhấp vào liên kết để đổi mật khẩu, hành động chuẩn xác nhất là:
A. Lập tức nhấp vào link để kiểm tra số dư
B. Không bấm vào liên kết, kiểm tra kỹ địa chỉ email người gửi và liên hệ hotline chính thức của ngân hàng
C. Chuyển tiếp email cho tất cả bạn bè để cảnh báo
D. Trả lời email cung cấp thông tin tài khoản
Đáp án: B
Giải thích: Phòng tránh tấn công lừa đảo trực tuyến (Phishing).
Vòng: Về đích
Miền: Miền 4
Mức độ: Vận dụng
Điểm: 20
Thời gian: 20s`;

  const sampleExcelTsv = `Nội dung câu hỏi\tLựa chọn A\tLựa chọn B\tLựa chọn C\tLựa chọn D\tĐáp án đúng\tGiải thích\tVòng thi\tMiền\tMức độ
Theo Luật An ninh mạng 2018, cơ quan chuyên trách bảo vệ an ninh mạng gồm lực lượng nào?\tLực lượng CAND và QĐND\tChỉ có Bộ GD&ĐT\tCác doanh nghiệp viễn thông tư nhân\tỦy ban nhân dân cấp xã\tA\tCăn cứ Điều 10 Luật An ninh mạng 2018\tVòng loại\tMiền 4\tThông hiểu
Giao thức mạng nào sau đây truyền tải dữ liệu có mã hóa bảo mật?\tHTTP\tFTP\tHTTPS\tTelnet\tC\tHTTPS sử dụng SSL/TLS để mã hóa đường truyền\tKhởi động\tMiền 4\tNhận biết
Trong bảng tính Excel, hàm nào dùng để đếm số ô thỏa mãn một điều kiện cho trước?\tCOUNT\tCOUNTIF\tSUMIF\tAVERAGE\tB\tCú pháp: COUNTIF(range, criteria)\tVòng loại\tMiền 1\tThông hiểu
Đâu là đặc trưng cơ bản của công nghệ chuỗi khối (Blockchain)?\tDữ liệu phân tán, minh bạch và bất biến\tDữ liệu tập trung tại một máy chủ duy nhất\tDễ dàng chỉnh sửa lịch sử giao dịch\tKhông cần kết nối mạng\tA\tBlockchain có tính phân tán và bất biến\tTăng tốc\tMiền 5\tVận dụng cao
(Về đích) Hãy giải thích khái niệm Tấn công Từ chối Dịch vụ Phân tán (DDoS)?\t\t\t\t\tTấn công DDoS là hình thức làm tê liệt máy chủ bằng lưu lượng truy cập giả mạo khổng lồ từ mạng botnet\tCăn cứ tài liệu An toàn thông tin BTI 2026\tVề đích\tMiền 4\tVận dụng`;

  // Auto-detect columns from header strings
  const autoDetectColumnMapping = (headers: string[]): ColumnMapping => {
    const map: ColumnMapping = { ...DEFAULT_COLUMN_MAPPING };
    const lowerHeaders = headers.map(h => String(h || '').trim().toLowerCase());

    const findMatch = (patterns: RegExp[]): string => {
      for (const pattern of patterns) {
        const idx = lowerHeaders.findIndex(h => pattern.test(h));
        if (idx !== -1) return headers[idx];
      }
      return '';
    };

    map.questionText = findMatch([/câu hỏi/i, /question/i, /nội dung/i, /đề bài/i, /prompt/i, /content/i]);
    map.optionA = findMatch([/^a$/i, /phương án a/i, /lựa chọn a/i, /đáp án a/i, /option a/i, /opt a/i, /ý a/i]);
    map.optionB = findMatch([/^b$/i, /phương án b/i, /lựa chọn b/i, /đáp án b/i, /option b/i, /opt b/i, /ý b/i]);
    map.optionC = findMatch([/^c$/i, /phương án c/i, /lựa chọn c/i, /đáp án c/i, /option c/i, /opt c/i, /ý c/i]);
    map.optionD = findMatch([/^d$/i, /phương án d/i, /lựa chọn d/i, /đáp án d/i, /option d/i, /opt d/i, /ý d/i]);
    map.correctKey = findMatch([/đáp án đúng/i, /đáp án/i, /answer/i, /correct/i, /key/i, /khoá/i]);
    map.explanation = findMatch([/giải thích/i, /lời giải/i, /explanation/i, /rationale/i, /ghi chú/i, /note/i]);
    map.stage = findMatch([/giai đoạn/i, /stage/i, /vòng chung kết|bán kết|vòng loại/i]);
    map.round = findMatch([/vòng thi/i, /phần thi/i, /round/i, /dạng câu/i, /format/i]);
    map.domain = findMatch([/miền/i, /domain/i, /năng lực/i, /competency/i]);
    map.level = findMatch([/mức độ/i, /level/i, /độ khó/i, /nhận thức/i, /cognitive/i]);
    map.points = findMatch([/điểm/i, /points/i, /score/i]);
    map.timeLimit = findMatch([/thời gian/i, /time/i, /giây/i, /seconds/i]);
    map.legalReference = findMatch([/căn cứ/i, /pháp lý/i, /legal/i, /văn bản/i, /thông tư/i]);

    return map;
  };

  // Parse Text or TSV Content
  const parseTextContent = (text: string, mode: InputFormatMode): QuestionItem[] => {
    if (!text.trim()) return [];

    const items: QuestionItem[] = [];

    if (mode === 'EXCEL_TSV' || text.includes('\t')) {
      // TSV / Tab-delimited parser
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      let startIndex = 0;

      if (lines.length > 0) {
        const firstLineLower = lines[0].toLowerCase();
        if (firstLineLower.includes('câu hỏi') || firstLineLower.includes('nội dung') || firstLineLower.includes('lựa chọn') || firstLineLower.includes('đáp án') || firstLineLower.includes('question')) {
          startIndex = 1;
        }
      }

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split('\t').map(c => c.trim());

        if (cols.length < 2) continue;

        const qText = cols[0];
        if (!qText) continue;

        let optA = cols[1] || '';
        let optB = cols[2] || '';
        let optC = cols[3] || '';
        let optD = cols[4] || '';
        let correctKey = '';
        let explanation = '';
        let roundStr = '';
        let domainStr = '';
        let levelStr = '';

        if (cols.length >= 6) {
          correctKey = cols[5] || '';
          explanation = cols[6] || '';
          roundStr = cols[7] || '';
          domainStr = cols[8] || '';
          levelStr = cols[9] || '';
        } else if (cols.length >= 2) {
          correctKey = cols[1];
          explanation = cols[2] || '';
          roundStr = cols[3] || '';
          optA = ''; optB = ''; optC = ''; optD = '';
        }

        let roundType: QuestionItem['round_type'] = 'MULTIPLE_CHOICE';
        let roundFormat: QuestionRoundFormat = 'BGD_MULTIPLE_CHOICE';
        let roundName = 'Vòng 1: Khởi động';
        let stage: CompetitionStage = defaultStage === 'AUTO' ? 'VONG_LOAI' : defaultStage;
        let points = defaultPoints;
        let timeLimit = defaultTimeLimit;

        const lowRound = (roundStr + ' ' + qText).toLowerCase();
        if (lowRound.includes('vcnv') || lowRound.includes('chướng ngại vật') || lowRound.includes('hàng ngang')) {
          roundType = 'VCNV';
          roundFormat = 'VCNV_HANG_NGANG';
          roundName = 'Vòng 2: Vượt Chướng Ngại Vật';
          stage = defaultStage === 'AUTO' ? 'BAN_KET_1' : defaultStage;
          timeLimit = 15;
          points = 10;
        } else if (lowRound.includes('tăng tốc') || lowRound.includes('tang toc')) {
          roundType = 'SEQUENCING';
          roundFormat = 'TANG_TOC';
          roundName = 'Vòng 3: Tăng tốc';
          stage = defaultStage === 'AUTO' ? 'BAN_KET_1' : defaultStage;
          timeLimit = 20;
          points = 40;
        } else if (lowRound.includes('về đích') || lowRound.includes('ve dich')) {
          roundType = 'SHORT_ANSWER';
          roundFormat = 'VE_DICH_20';
          roundName = 'Vòng 4: Về đích';
          stage = defaultStage === 'AUTO' ? 'BAN_KET_1' : defaultStage;
          timeLimit = 20;
          points = 20;
        } else if (lowRound.includes('khởi động') || lowRound.includes('khoi dong')) {
          roundType = (optA && optB) ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER';
          roundFormat = 'KHOI_DONG_CHUNG';
          roundName = 'Vòng 1: Khởi động';
          stage = defaultStage === 'AUTO' ? 'BAN_KET_1' : defaultStage;
          timeLimit = 15;
          points = 10;
        } else if (lowRound.includes('vòng loại') || lowRound.includes('bộ gd')) {
          roundType = (optA && optB) ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER';
          roundFormat = 'BGD_MULTIPLE_CHOICE';
          roundName = 'Vòng loại Bộ GD&ĐT';
          stage = 'VONG_LOAI';
        }

        const options: Record<string, string> = {};
        if (optA) options.A = optA;
        if (optB) options.B = optB;
        if (optC) options.C = optC;
        if (optD) options.D = optD;

        if (Object.keys(options).length === 0) {
          roundType = 'SHORT_ANSWER';
        }

        let domainKey: DigitalCompetencyDomainKey = defaultDomain === 'AUTO' ? 'MIEN_1' : defaultDomain;
        const lowDomain = (domainStr + ' ' + qText).toLowerCase();
        if (lowDomain.includes('miền 1') || lowDomain.includes('dữ liệu') || lowDomain.includes('thông tin')) domainKey = 'MIEN_1';
        else if (lowDomain.includes('miền 2') || lowDomain.includes('giao tiếp') || lowDomain.includes('hợp tác')) domainKey = 'MIEN_2';
        else if (lowDomain.includes('miền 3') || lowDomain.includes('sáng tạo') || lowDomain.includes('nội dung số')) domainKey = 'MIEN_3';
        else if (lowDomain.includes('miền 4') || lowDomain.includes('an toàn') || lowDomain.includes('bảo mật')) domainKey = 'MIEN_4';
        else if (lowDomain.includes('miền 5') || lowDomain.includes('giải quyết vấn đề')) domainKey = 'MIEN_5';
        else if (lowDomain.includes('miền 6') || lowDomain.includes('nghề nghiệp')) domainKey = 'MIEN_6';

        let cogLevel: CognitiveLevel = defaultCognitiveLevel === 'AUTO' ? 'THONG_HIEU' : defaultCognitiveLevel;
        const lowLevel = (levelStr + ' ' + qText).toLowerCase();
        if (lowLevel.includes('nhận biết')) cogLevel = 'NHAN_BIET';
        else if (lowLevel.includes('thông hiểu')) cogLevel = 'THONG_HIEU';
        else if (lowLevel.includes('vận dụng cao')) cogLevel = 'VAN_DUNG_CAO';
        else if (lowLevel.includes('vận dụng')) cogLevel = 'VAN_DUNG';

        let finalKey = correctKey.trim().toUpperCase();
        if (finalKey.startsWith('A') && finalKey.length === 1) finalKey = 'A';
        else if (finalKey.startsWith('B') && finalKey.length === 1) finalKey = 'B';
        else if (finalKey.startsWith('C') && finalKey.length === 1) finalKey = 'C';
        else if (finalKey.startsWith('D') && finalKey.length === 1) finalKey = 'D';
        else if (!finalKey) finalKey = correctKey.trim();

        items.push({
          id: `BULK_${Date.now().toString(36)}_${i + 1}`,
          round_name: roundName,
          round_type: roundType,
          round_format: roundFormat,
          category: DIGITAL_COMPETENCY_DOMAINS[domainKey]?.name || 'Năng lực số',
          question_text: qText,
          options,
          correct_key: finalKey || (Object.keys(options).length > 0 ? 'A' : 'Chưa có đáp án'),
          explanation: explanation || 'Nhập từ bảng dữ liệu',
          time_limit: timeLimit,
          points: points,
          stage: stage,
          digital_competency_domain: domainKey,
          cognitive_level: cogLevel,
          approval_status: autoApprove ? 'APPROVED' : 'PENDING_REVIEW',
          created_by: 'Nhập Hàng Loạt TSV',
          created_at: Date.now()
        });
      }
    } else {
      // Simple Text Parser (Numbered Câu 1, Câu 2...)
      const normalized = text.replace(/\r\n/g, '\n');
      const questionBlocks = normalized.split(/\n(?=(?:Câu\s+\d+|Câu\s+hỏi\s+\d+|\d+[\.\)]\s+|Question\s+\d+))/i);

      questionBlocks.forEach((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return;

        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return;

        let qText = '';
        const options: Record<string, string> = {};
        let correctKey = '';
        let explanation = '';
        let roundStr = '';
        let domainStr = '';
        let levelStr = '';
        let pointsNum = defaultPoints;
        let timeNum = defaultTimeLimit;

        const firstLine = lines[0];
        qText = firstLine.replace(/^(?:Câu\s+\d+[:\.]*|Câu\s+hỏi\s+\d+[:\.]*|\d+[\.\)]\s+|Question\s+\d+[:\.]*)\s*/i, '').trim();

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];

          const optMatch = line.match(/^([A-F])[\.\)\:\-]\s*(.*)$/i);
          if (optMatch) {
            const key = optMatch[1].toUpperCase();
            options[key] = optMatch[2].trim();
            continue;
          }

          const ansMatch = line.match(/^(?:Đáp\s*án|Đáp\s*án\s*đúng|Key|Answer|ĐA)[\:\s]+(.*)$/i);
          if (ansMatch) {
            correctKey = ansMatch[1].trim();
            continue;
          }

          const expMatch = line.match(/^(?:Giải\s*thích|Lời\s*giải|Căn\s*cứ|Explanation|Ghi\s*chú)[\:\s]+(.*)$/i);
          if (expMatch) {
            explanation = expMatch[1].trim();
            continue;
          }

          const roundMatch = line.match(/^(?:Vòng|Vòng\s*thi|Phần\s*thi|Giai\s*đoạn|Stage|Round)[\:\s]+(.*)$/i);
          if (roundMatch) {
            roundStr = roundMatch[1].trim();
            continue;
          }

          const domainMatch = line.match(/^(?:Miền|Miền\s*năng\s*lực|Khung\s*năng\s*lực|Domain)[\:\s]+(.*)$/i);
          if (domainMatch) {
            domainStr = domainMatch[1].trim();
            continue;
          }

          const levelMatch = line.match(/^(?:Mức\s*độ|Mức\s*nhận\s*thức|Cấp\s*độ|Level)[\:\s]+(.*)$/i);
          if (levelMatch) {
            levelStr = levelMatch[1].trim();
            continue;
          }

          const ptsMatch = line.match(/^(?:Điểm|Điểm\s*số|Points|Score)[\:\s]+(\d+)/i);
          if (ptsMatch) {
            pointsNum = parseInt(ptsMatch[1], 10) || defaultPoints;
            continue;
          }

          const timeMatch = line.match(/^(?:Thời\s*gian|Thời\s*lượng|Time|Giây)[\:\s]+(\d+)/i);
          if (timeMatch) {
            timeNum = parseInt(timeMatch[1], 10) || defaultTimeLimit;
            continue;
          }

          if (Object.keys(options).length === 0 && !correctKey && !explanation) {
            qText += ' ' + line;
          }
        }

        if (!qText) return;

        let roundType: QuestionItem['round_type'] = Object.keys(options).length > 0 ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER';
        let roundFormat: QuestionRoundFormat = 'BGD_MULTIPLE_CHOICE';
        let roundName = 'Vòng 1: Khởi động';
        let stage: CompetitionStage = defaultStage === 'AUTO' ? 'VONG_LOAI' : defaultStage;

        const combinedText = (roundStr + ' ' + qText).toLowerCase();
        if (combinedText.includes('vcnv') || combinedText.includes('chướng ngại vật') || combinedText.includes('hàng ngang')) {
          roundType = 'VCNV';
          roundFormat = 'VCNV_HANG_NGANG';
          roundName = 'Vòng 2: Vượt Chướng Ngại Vật';
          stage = defaultStage === 'AUTO' ? 'BAN_KET_1' : defaultStage;
          timeNum = 15;
          pointsNum = 10;
        } else if (combinedText.includes('tăng tốc') || combinedText.includes('tang toc')) {
          roundType = 'SEQUENCING';
          roundFormat = 'TANG_TOC';
          roundName = 'Vòng 3: Tăng tốc';
          stage = defaultStage === 'AUTO' ? 'BAN_KET_1' : defaultStage;
          timeNum = 20;
          pointsNum = 40;
        } else if (combinedText.includes('về đích') || combinedText.includes('ve dich')) {
          roundType = 'SHORT_ANSWER';
          roundFormat = pointsNum === 30 ? 'VE_DICH_30' : 'VE_DICH_20';
          roundName = 'Vòng 4: Về đích';
          stage = defaultStage === 'AUTO' ? 'BAN_KET_1' : defaultStage;
          timeNum = 20;
        } else if (combinedText.includes('khởi động') || combinedText.includes('khoi dong')) {
          roundType = Object.keys(options).length > 0 ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER';
          roundFormat = 'KHOI_DONG_CHUNG';
          roundName = 'Vòng 1: Khởi động';
          stage = defaultStage === 'AUTO' ? 'BAN_KET_1' : defaultStage;
          timeNum = 15;
          pointsNum = 10;
        } else if (combinedText.includes('vòng loại') || combinedText.includes('bộ gd')) {
          roundType = Object.keys(options).length > 0 ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER';
          roundFormat = 'BGD_MULTIPLE_CHOICE';
          roundName = 'Vòng loại Bộ GD&ĐT';
          stage = 'VONG_LOAI';
        }

        let domainKey: DigitalCompetencyDomainKey = defaultDomain === 'AUTO' ? 'MIEN_1' : defaultDomain;
        const lowDomain = (domainStr + ' ' + qText).toLowerCase();
        if (lowDomain.includes('miền 1') || lowDomain.includes('dữ liệu') || lowDomain.includes('thông tin')) domainKey = 'MIEN_1';
        else if (lowDomain.includes('miền 2') || lowDomain.includes('giao tiếp') || lowDomain.includes('hợp tác')) domainKey = 'MIEN_2';
        else if (lowDomain.includes('miền 3') || lowDomain.includes('sáng tạo') || lowDomain.includes('nội dung số')) domainKey = 'MIEN_3';
        else if (lowDomain.includes('miền 4') || lowDomain.includes('an toàn') || lowDomain.includes('bảo mật')) domainKey = 'MIEN_4';
        else if (lowDomain.includes('miền 5') || lowDomain.includes('giải quyết vấn đề')) domainKey = 'MIEN_5';
        else if (lowDomain.includes('miền 6') || lowDomain.includes('nghề nghiệp')) domainKey = 'MIEN_6';

        let cogLevel: CognitiveLevel = defaultCognitiveLevel === 'AUTO' ? 'THONG_HIEU' : defaultCognitiveLevel;
        const lowLevel = (levelStr + ' ' + qText).toLowerCase();
        if (lowLevel.includes('nhận biết')) cogLevel = 'NHAN_BIET';
        else if (lowLevel.includes('thông hiểu')) cogLevel = 'THONG_HIEU';
        else if (lowLevel.includes('vận dụng cao')) cogLevel = 'VAN_DUNG_CAO';
        else if (lowLevel.includes('vận dụng')) cogLevel = 'VAN_DUNG';

        let finalKey = correctKey.trim();
        if (finalKey.length === 1 && options[finalKey.toUpperCase()]) {
          finalKey = finalKey.toUpperCase();
        } else if (!finalKey && Object.keys(options).length > 0) {
          finalKey = Object.keys(options)[0];
        }

        items.push({
          id: `BULK_${Date.now().toString(36)}_${idx + 1}`,
          round_name: roundName,
          round_type: roundType,
          round_format: roundFormat,
          category: DIGITAL_COMPETENCY_DOMAINS[domainKey]?.name || 'Năng lực số',
          question_text: qText,
          options,
          correct_key: finalKey || 'A',
          explanation: explanation || 'Nhập từ văn bản',
          time_limit: timeNum,
          points: pointsNum,
          stage: stage,
          digital_competency_domain: domainKey,
          cognitive_level: cogLevel,
          approval_status: autoApprove ? 'APPROVED' : 'PENDING_REVIEW',
          created_by: 'Nhập Hàng Loạt Văn Bản',
          created_at: Date.now()
        });
      });
    }

    return items;
  };

  // Process File Upload (.xlsx, .xls, .csv, .tsv, .txt)
  const processUploadedFile = async (file: File) => {
    setIsLoadingFile(true);
    setSelectedFile(file);

    try {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.txt')) {
        const text = await file.text();
        setRawInput(text);
        setInputMode('SIMPLE_TEXT');
        const parsed = parseTextContent(text, 'SIMPLE_TEXT');
        setParsedList(parsed);
      } else {
        // Read as ArrayBuffer for SheetJS
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        
        setFileSheetNames(wb.SheetNames);
        setSelectedSheet('ALL');

        // Check if official BTI multi-sheet structure
        const result = await excelService.parseUploadedFile(file);
        
        if (result.success && result.importedQuestions.length > 0) {
          setParsedList(result.importedQuestions);
          // Extract headers from first sheet for column mapper
          const firstWs = wb.Sheets[wb.SheetNames[0]];
          const sheetJson: any[][] = XLSX.utils.sheet_to_json(firstWs, { header: 1, defval: '' });
          if (sheetJson.length > 0) {
            const firstRow = sheetJson[0].map(c => String(c || '').trim());
            setDetectedFileHeaders(firstRow.filter(Boolean));
            setRawFileRows(sheetJson);
            const mapping = autoDetectColumnMapping(firstRow);
            setColumnMapping(mapping);
          }
        } else {
          // Parse flat table from first sheet
          const firstWs = wb.Sheets[wb.SheetNames[0]];
          const sheetJson: any[][] = XLSX.utils.sheet_to_json(firstWs, { header: 1, defval: '' });
          if (sheetJson.length > 0) {
            const headers = sheetJson[0].map(c => String(c || '').trim()).filter(Boolean);
            setDetectedFileHeaders(headers);
            setRawFileRows(sheetJson);
            const mapping = autoDetectColumnMapping(headers);
            setColumnMapping(mapping);
            
            // Build parsed items from rows
            const items = parseRowsWithMapping(sheetJson, mapping);
            setParsedList(items);
          }
        }
      }
    } catch (err) {
      console.error('Lỗi khi đọc file:', err);
      soundFx.playWarning();
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Helper to parse rows using custom column mapping
  const parseRowsWithMapping = (rows: any[][], mapping: ColumnMapping): QuestionItem[] => {
    if (rows.length <= 1) return [];
    const headers = rows[0].map(h => String(h || '').trim());

    const getColIdx = (colName: string) => {
      if (!colName) return -1;
      return headers.indexOf(colName);
    };

    const qIdx = getColIdx(mapping.questionText);
    const optAIdx = getColIdx(mapping.optionA);
    const optBIdx = getColIdx(mapping.optionB);
    const optCIdx = getColIdx(mapping.optionC);
    const optDIdx = getColIdx(mapping.optionD);
    const ansIdx = getColIdx(mapping.correctKey);
    const expIdx = getColIdx(mapping.explanation);
    const stageIdx = getColIdx(mapping.stage);
    const roundIdx = getColIdx(mapping.round);
    const domainIdx = getColIdx(mapping.domain);
    const levelIdx = getColIdx(mapping.level);
    const ptsIdx = getColIdx(mapping.points);
    const timeIdx = getColIdx(mapping.timeLimit);
    const legalIdx = getColIdx(mapping.legalReference);

    const items: QuestionItem[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const qText = qIdx !== -1 ? String(row[qIdx] || '').trim() : String(row[0] || '').trim();
      if (!qText || qText.length < 5) continue;

      const optA = optAIdx !== -1 ? String(row[optAIdx] || '').trim() : '';
      const optB = optBIdx !== -1 ? String(row[optBIdx] || '').trim() : '';
      const optC = optCIdx !== -1 ? String(row[optCIdx] || '').trim() : '';
      const optD = optDIdx !== -1 ? String(row[optDIdx] || '').trim() : '';

      const options: Record<string, string> = {};
      if (optA) options.A = optA;
      if (optB) options.B = optB;
      if (optC) options.C = optC;
      if (optD) options.D = optD;

      const rawAns = ansIdx !== -1 ? String(row[ansIdx] || '').trim() : (Object.keys(options).length > 0 ? 'A' : 'Đáp án');
      const exp = expIdx !== -1 ? String(row[expIdx] || '').trim() : '';
      const stageStr = stageIdx !== -1 ? String(row[stageIdx] || '').trim() : '';
      const roundStr = roundIdx !== -1 ? String(row[roundIdx] || '').trim() : '';
      const domainStr = domainIdx !== -1 ? String(row[domainIdx] || '').trim() : '';
      const levelStr = levelIdx !== -1 ? String(row[levelIdx] || '').trim() : '';
      const ptsVal = ptsIdx !== -1 ? parseInt(String(row[ptsIdx]), 10) : defaultPoints;
      const timeVal = timeIdx !== -1 ? parseInt(String(row[timeIdx]), 10) : defaultTimeLimit;
      const legalRef = legalIdx !== -1 ? String(row[legalIdx] || '').trim() : 'Thông tư 02/2025/TT-BGDĐT';

      let stage: CompetitionStage = defaultStage === 'AUTO' ? 'VONG_LOAI' : defaultStage;
      if (stageStr.toUpperCase().includes('CHUNG_KET') || stageStr.toLowerCase().includes('chung kết')) stage = 'CHUNG_KET';
      else if (stageStr.toUpperCase().includes('BAN_KET_1') || stageStr.toLowerCase().includes('bán kết 1')) stage = 'BAN_KET_1';
      else if (stageStr.toUpperCase().includes('BAN_KET_2') || stageStr.toLowerCase().includes('bán kết 2')) stage = 'BAN_KET_2';
      else if (stageStr.toUpperCase().includes('BAN_KET_3') || stageStr.toLowerCase().includes('bán kết 3')) stage = 'BAN_KET_3';
      else if (stageStr.toUpperCase().includes('VONG_LOAI') || stageStr.toLowerCase().includes('vòng loại')) stage = 'VONG_LOAI';

      let domainKey: DigitalCompetencyDomainKey = defaultDomain === 'AUTO' ? 'MIEN_1' : defaultDomain;
      const lowDom = domainStr.toLowerCase();
      if (lowDom.includes('1') || lowDom.includes('dữ liệu')) domainKey = 'MIEN_1';
      else if (lowDom.includes('2') || lowDom.includes('giao tiếp')) domainKey = 'MIEN_2';
      else if (lowDom.includes('3') || lowDom.includes('sáng tạo')) domainKey = 'MIEN_3';
      else if (lowDom.includes('4') || lowDom.includes('an toàn')) domainKey = 'MIEN_4';
      else if (lowDom.includes('5') || lowDom.includes('giải quyết')) domainKey = 'MIEN_5';
      else if (lowDom.includes('6') || lowDom.includes('nghề nghiệp')) domainKey = 'MIEN_6';

      let cogLevel: CognitiveLevel = defaultCognitiveLevel === 'AUTO' ? 'THONG_HIEU' : defaultCognitiveLevel;
      const lowLev = levelStr.toLowerCase();
      if (lowLev.includes('nhận biết') || lowLev.includes('nhan_biet')) cogLevel = 'NHAN_BIET';
      else if (lowLev.includes('thông hiểu') || lowLev.includes('thong_hieu')) cogLevel = 'THONG_HIEU';
      else if (lowLev.includes('vận dụng cao') || lowLev.includes('van_dung_cao')) cogLevel = 'VAN_DUNG_CAO';
      else if (lowLev.includes('vận dụng') || lowLev.includes('van_dung')) cogLevel = 'VAN_DUNG';

      const roundType = Object.keys(options).length > 0 ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER';
      const roundName = roundStr || (stage === 'VONG_LOAI' ? 'Phần I: Trắc nghiệm 4 lựa chọn' : 'Vòng 1: Khởi động');

      items.push({
        id: `IMP_${Date.now().toString(36)}_${r}`,
        round_name: roundName,
        round_type: roundType,
        round_format: stage === 'VONG_LOAI' ? 'BGD_MULTIPLE_CHOICE' : 'KHOI_DONG_CHUNG',
        category: DIGITAL_COMPETENCY_DOMAINS[domainKey]?.name || 'Năng lực số',
        question_text: qText,
        options,
        correct_key: rawAns,
        explanation: exp || `Nhập từ file: ${selectedFile?.name || 'Tập tin'}`,
        time_limit: isNaN(timeVal) ? defaultTimeLimit : timeVal,
        points: isNaN(ptsVal) ? defaultPoints : ptsVal,
        stage,
        digital_competency_domain: domainKey,
        cognitive_level: cogLevel,
        legal_reference: legalRef,
        approval_status: autoApprove ? 'APPROVED' : 'PENDING_REVIEW',
        created_by: 'Nhập Khẩu Tệp BTI',
        created_at: Date.now()
      });
    }

    return items;
  };

  // Re-parse when input text changes in Text/TSV modes
  useEffect(() => {
    if (inputMode === 'SIMPLE_TEXT' || inputMode === 'EXCEL_TSV') {
      const parsed = parseTextContent(rawInput, inputMode);
      setParsedList(parsed);
    }
  }, [rawInput, inputMode, defaultStage, defaultDomain, defaultCognitiveLevel, defaultPoints, defaultTimeLimit, autoApprove]);

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processUploadedFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processUploadedFile(file);
    }
  };

  // Paste from clipboard
  const handlePasteClipboard = async () => {
    try {
      vibrateTap();
      soundFx.playClick();
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawInput(text);
        if (text.includes('\t')) {
          setInputMode('EXCEL_TSV');
        } else {
          setInputMode('SIMPLE_TEXT');
        }
      }
    } catch (err) {
      console.warn('Cannot read clipboard:', err);
    }
  };

  // Quick action templates
  const handleLoadSample = (mode: InputFormatMode) => {
    vibrateTap();
    soundFx.playClick();
    if (mode === 'SIMPLE_TEXT') {
      setRawInput(sampleSimpleText);
    } else if (mode === 'EXCEL_TSV') {
      setRawInput(sampleExcelTsv);
    } else {
      // Demo load sample questions directly
      const parsed = parseTextContent(sampleExcelTsv, 'EXCEL_TSV');
      setParsedList(parsed);
    }
  };

  const handleClear = () => {
    vibrateTap();
    soundFx.playClick();
    setRawInput('');
    setSelectedFile(null);
    setParsedList([]);
    setRawFileRows([]);
    setDetectedFileHeaders([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Row manipulation
  const handleDeleteParsedItem = (index: number) => {
    vibrateTap();
    soundFx.playClick();
    setParsedList(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateParsedItem = (index: number, updates: Partial<QuestionItem>) => {
    setParsedList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  // Batch updates across all parsed questions
  const handleBatchApplyStage = (stage: CompetitionStage) => {
    vibrateTap();
    soundFx.playClick();
    setParsedList(prev => prev.map(q => ({ ...q, stage })));
  };

  const handleBatchApplyDomain = (domain: DigitalCompetencyDomainKey) => {
    vibrateTap();
    soundFx.playClick();
    setParsedList(prev => prev.map(q => ({
      ...q, 
      digital_competency_domain: domain,
      category: DIGITAL_COMPETENCY_DOMAINS[domain]?.name || q.category
    })));
  };

  const handleBatchApplyLevel = (level: CognitiveLevel) => {
    vibrateTap();
    soundFx.playClick();
    setParsedList(prev => prev.map(q => ({ ...q, cognitive_level: level })));
  };

  // Quality check diagnostics
  const validationSummary = useMemo(() => {
    let valid = 0;
    let warnings = 0;
    let errors = 0;
    let duplicates = 0;

    parsedList.forEach(q => {
      let isInvalid = false;
      let hasWarning = false;

      if (!q.question_text || q.question_text.length < 5) isInvalid = true;
      if (!q.correct_key) isInvalid = true;
      if (q.round_type === 'MULTIPLE_CHOICE' && (!q.options || Object.keys(q.options).length < 2)) {
        hasWarning = true;
      }

      const dups = questionBankManager.findDuplicateQuestions(q.question_text);
      if (dups.length > 0) duplicates++;

      if (isInvalid) errors++;
      else if (hasWarning) warnings++;
      else valid++;
    });

    return { total: parsedList.length, valid, warnings, errors, duplicates };
  }, [parsedList]);

  // Filtered list for preview
  const displayedQuestions = useMemo(() => {
    return parsedList.filter((item, idx) => {
      // Query filter
      if (filterQuery.trim()) {
        const q = filterQuery.toLowerCase();
        const matchesText = item.question_text.toLowerCase().includes(q);
        const matchesKey = item.correct_key.toLowerCase().includes(q);
        const matchesCategory = (item.category || '').toLowerCase().includes(q);
        const matchesRound = (item.round_name || '').toLowerCase().includes(q);
        if (!matchesText && !matchesKey && !matchesCategory && !matchesRound) return false;
      }

      // Quality filter
      if (validationFilter === 'VALID') {
        return item.question_text && item.question_text.length >= 5 && item.correct_key;
      }
      if (validationFilter === 'ISSUES') {
        const isInvalid = !item.question_text || item.question_text.length < 5 || !item.correct_key;
        const hasWarning = item.round_type === 'MULTIPLE_CHOICE' && (!item.options || Object.keys(item.options).length < 2);
        return isInvalid || hasWarning;
      }

      return true;
    });
  }, [parsedList, filterQuery, validationFilter]);

  // Commit & Save
  const handleCommitImport = () => {
    if (parsedList.length === 0) return;

    if (validationSummary.duplicates > 0) {
      soundFx.playWarning();
      vibrateTap();
      const msg = `CẢNH BÁO TRÙNG LẶP\n\nPhát hiện ${validationSummary.duplicates}/${parsedList.length} câu hỏi chuẩn bị import có nội dung rất giống với các câu hỏi đã có sẵn trong ngân hàng.\n\nBạn có muốn tiếp tục lưu toàn bộ vào ngân hàng đề thi không?`;
      if (!window.confirm(msg)) {
        return;
      }
    }

    vibrateSuccess();
    soundFx.playCorrect();

    questionBankManager.batchImport(parsedList);
    setSuccessCount(parsedList.length);
    setIsSuccessModal(true);

    if (onImportSuccess) {
      onImportSuccess(parsedList.length);
    }
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      id="bulk-import-modal-overlay"
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn overflow-hidden modal-backdrop-isolated select-none"
    >
      <div 
        id="bulk-import-modal-dialog"
        className="max-w-6xl w-full h-[94vh] max-h-[94vh] rounded-[8px] border border-theme-accent/30 text-[#F5EFF9] shadow-2xl flex flex-col bg-[#190839] overflow-hidden overscroll-contain select-text"
      >
        
        {/* ================= MODAL HEADER ================= */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#241148] border-b border-theme-accent/20 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[4px] bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Nhập Hàng Loạt Câu Hỏi</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  Excel / CSV / TSV / Văn bản
                </span>
              </h2>
              <p className="text-xs text-[#B6A6D8]">
                Bóc tách tức thì từ tệp bảng tính (.xlsx, .csv), bảng copy từ Google Sheets hoặc tệp văn bản .txt.
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Template Hub Dropdown / Buttons */}
            <div className="hidden md:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  excelService.downloadCsvTemplate();
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-[4px] bg-white/5 hover:bg-white/10 text-white/80 text-xs font-mono border border-white/10 transition cursor-pointer"
                title="Tải tệp mẫu CSV (.csv chuẩn UTF-8 BOM mở bằng Excel)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mẫu CSV (.csv)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  excelService.downloadStandardExcelTemplate();
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-[4px] bg-white/5 hover:bg-white/10 text-white/80 text-xs font-mono border border-white/10 transition cursor-pointer"
                title="Tải tệp mẫu Excel bảng chuẩn (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Mẫu Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  excelService.downloadOfficialTemplate(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-[4px] bg-white/5 hover:bg-white/10 text-white/80 text-xs font-mono border border-white/10 transition cursor-pointer"
                title="Tải bộ đề thi BTI 2026 chính thức 6 sheets"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Mẫu BTI 2026 (6 Sheets)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                onClose();
              }}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-[4px] transition cursor-pointer ml-1"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= MODAL BODY ================= */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain modal-scroll-isolated custom-scrollbar">
          
          {/* Format Mode Selector Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-[6px] bg-[#241148]/60 border border-theme-accent/20">
            <div className="flex flex-wrap items-center gap-1.5 bg-black/50 p-1 rounded-[4px] border border-white/10">
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setInputMode('FILE_UPLOAD');
                }}
                className={`px-3.5 py-1.5 rounded-[3px] text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  inputMode === 'FILE_UPLOAD'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>1. Tải Tệp Excel / CSV (.xlsx, .csv)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setInputMode('EXCEL_TSV');
                }}
                className={`px-3.5 py-1.5 rounded-[3px] text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  inputMode === 'EXCEL_TSV'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>2. Dán Từ Bảng Tính (TSV / Sheets)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setInputMode('SIMPLE_TEXT');
                }}
                className={`px-3.5 py-1.5 rounded-[3px] text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  inputMode === 'SIMPLE_TEXT'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>3. Văn Bản Đánh Số (.txt / Word)</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleLoadSample(inputMode)}
                className="px-3 py-1.5 rounded-[4px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                title="Nạp dữ liệu mẫu ví dụ để kiểm tra khả năng bóc tách"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nạp Mẫu Ví Dụ</span>
              </button>

              {(rawInput || selectedFile || parsedList.length > 0) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1.5 rounded-[4px] bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 border border-rose-500/30 text-xs font-mono flex items-center gap-1 transition cursor-pointer"
                  title="Xóa toàn bộ nội dung"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa Hết</span>
                </button>
              )}
            </div>
          </div>

          {/* Main 2-Column Split: Input on Left (5 Cols), Real-time Data Grid on Right (7 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left Column: Input Interfaces & Defaults (5 Cols) */}
            <div className="lg:col-span-5 space-y-3.5 flex flex-col">
              
              {/* MODE 1: FILE UPLOAD ZONE */}
              {inputMode === 'FILE_UPLOAD' && (
                <div className="space-y-3">
                  <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-[6px] p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[200px] ${
                      isDragging 
                        ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]' 
                        : selectedFile 
                          ? 'border-emerald-500/40 bg-emerald-950/20' 
                          : 'border-white/20 bg-black/30 hover:border-emerald-500/40 hover:bg-black/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv, .tsv, .txt"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                      <FileUp className="w-6 h-6" />
                    </div>

                    {selectedFile ? (
                      <div className="space-y-1">
                        <div className="font-bold text-white font-mono text-sm flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>{selectedFile.name}</span>
                        </div>
                        <p className="text-[11px] text-emerald-300/80 font-mono">
                          {(selectedFile.size / 1024).toFixed(1)} KB • Đã bóc tách {parsedList.length} câu hỏi
                        </p>
                        <p className="text-[10px] text-white/50 pt-1">
                          (Bấm hoặc kéo tệp khác vào đây để thay thế)
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-white font-mono">
                          Kéo thả tệp <span className="text-emerald-300">.xlsx, .xls, .csv</span> vào đây
                        </p>
                        <p className="text-[11px] text-[#B6A6D8]">
                          hoặc bấm để chọn tệp từ máy tính của bạn
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Multi-Sheet Selector if Excel file has multiple sheets */}
                  {fileSheetNames.length > 1 && (
                    <div className="p-3 rounded-[4px] bg-[#241148]/60 border border-theme-accent/20 flex items-center justify-between gap-3 text-xs">
                      <span className="font-mono text-[#B6A6D8] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-sky-400" />
                        <span>Trang tính (Sheet):</span>
                      </span>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] border border-emerald-500/30">
                          {fileSheetNames.length} Sheets (BTI Official)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Column Mapper Drawer Trigger */}
                  {detectedFileHeaders.length > 0 && (
                    <div className="p-3 rounded-[4px] bg-black/40 border border-white/10 space-y-2">
                      <button
                        type="button"
                        onClick={() => setShowColumnMapper(prev => !prev)}
                        className="w-full flex items-center justify-between text-xs font-mono font-bold text-white hover:text-emerald-300 transition cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-theme-accent" />
                          <span>Ánh Xạ Cột Tùy Chỉnh ({detectedFileHeaders.length} cột phát hiện)</span>
                        </span>
                        {showColumnMapper ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {showColumnMapper && (
                        <div className="pt-2 border-t border-white/10 space-y-2 text-[11px] font-mono">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-white/60 mb-0.5">Cột Câu hỏi (*):</label>
                              <select
                                value={columnMapping.questionText}
                                onChange={(e) => {
                                  const updated = { ...columnMapping, questionText: e.target.value };
                                  setColumnMapping(updated);
                                  if (rawFileRows.length > 0) setParsedList(parseRowsWithMapping(rawFileRows, updated));
                                }}
                                className="w-full bg-black/70 border border-white/20 rounded px-1.5 py-1 text-white text-xs"
                              >
                                <option value="">-- Chọn cột --</option>
                                {detectedFileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                            </div>

                            <div>
                              <label className="block text-white/60 mb-0.5">Cột Đáp án đúng (*):</label>
                              <select
                                value={columnMapping.correctKey}
                                onChange={(e) => {
                                  const updated = { ...columnMapping, correctKey: e.target.value };
                                  setColumnMapping(updated);
                                  if (rawFileRows.length > 0) setParsedList(parseRowsWithMapping(rawFileRows, updated));
                                }}
                                className="w-full bg-black/70 border border-white/20 rounded px-1.5 py-1 text-white text-xs"
                              >
                                <option value="">-- Chọn cột --</option>
                                {detectedFileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-1.5 pt-1">
                            {['optionA', 'optionB', 'optionC', 'optionD'].map((optKey, idx) => (
                              <div key={optKey}>
                                <label className="block text-white/60 mb-0.5">Ý {String.fromCharCode(65 + idx)}:</label>
                                <select
                                  value={(columnMapping as any)[optKey]}
                                  onChange={(e) => {
                                    const updated = { ...columnMapping, [optKey]: e.target.value };
                                    setColumnMapping(updated);
                                    if (rawFileRows.length > 0) setParsedList(parseRowsWithMapping(rawFileRows, updated));
                                  }}
                                  className="w-full bg-black/70 border border-white/20 rounded px-1 py-1 text-white text-[10px]"
                                >
                                  <option value="">--</option>
                                  {detectedFileHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2 & 3: TEXTAREA FOR TSV / SIMPLE TEXT */}
              {(inputMode === 'EXCEL_TSV' || inputMode === 'SIMPLE_TEXT') && (
                <div className="space-y-2 flex-1 flex flex-col">
                  <div className="flex items-center justify-between text-xs font-mono text-[#B6A6D8]">
                    <span className="font-bold flex items-center gap-1.5 text-[#F5EFF9]">
                      <FileText className="w-3.5 h-3.5 text-theme-accent" />
                      <span>{inputMode === 'EXCEL_TSV' ? 'Bảng dán từ Excel / Sheets:' : 'Văn bản câu hỏi đầu vào:'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[10px] font-mono border border-sky-400/30 flex items-center gap-1 cursor-pointer"
                    >
                      <Clipboard className="w-3 h-3" />
                      <span>Dán Clipboard</span>
                    </button>
                  </div>

                  <div className="relative flex-1 min-h-[220px]">
                    <textarea
                      value={rawInput}
                      onChange={(e) => setRawInput(e.target.value)}
                      placeholder={
                        inputMode === 'EXCEL_TSV'
                          ? "Bôi đen các cột trong bảng Excel/Google Sheets rồi dán vào đây:\nCột 1: Câu hỏi | Cột 2-5: Phương án A, B, C, D | Cột 6: Đáp án | Cột 7: Giải thích"
                          : "Dán câu hỏi đánh số theo mẫu:\n\nCâu 1: Theo Thông tư 02/2025/TT-BGDĐT...\nA. Phương án 1\nB. Phương án 2\nC. Phương án 3\nD. Phương án 4\nĐáp án: A\nGiải thích: ..."
                      }
                      className="w-full h-full min-h-[240px] max-h-[360px] bg-black/50 border border-theme-accent/25 rounded-[4px] p-3 text-xs text-[#F5EFF9] font-mono leading-relaxed placeholder-white/25 focus:border-theme-accent focus:outline-none custom-scrollbar"
                    />
                  </div>
                </div>
              )}

              {/* Global Defaults & Batch Configuration */}
              <div className="p-3.5 rounded-[6px] bg-[#241148]/60 border border-theme-accent/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                    <Settings2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cấu hình mặc định áp dụng chung:</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-mono text-[#B6A6D8] mb-1">Giai đoạn thi:</label>
                    <select
                      value={defaultStage}
                      onChange={(e) => setDefaultStage(e.target.value as any)}
                      className="w-full bg-black/60 border border-white/20 rounded-[4px] px-2 py-1 text-xs text-white focus:border-theme-accent focus:outline-none font-mono"
                    >
                      <option value="AUTO">Tự động nhận diện</option>
                      <option value="VONG_LOAI">Vòng loại (Bộ GD&ĐT)</option>
                      <option value="BAN_KET_1">Vòng Bán kết 1</option>
                      <option value="BAN_KET_2">Vòng Bán kết 2</option>
                      <option value="BAN_KET_3">Vòng Bán kết 3</option>
                      <option value="CHUNG_KET">Đêm Chung kết</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#B6A6D8] mb-1">Miền năng lực số:</label>
                    <select
                      value={defaultDomain}
                      onChange={(e) => setDefaultDomain(e.target.value as any)}
                      className="w-full bg-black/60 border border-white/20 rounded-[4px] px-2 py-1 text-xs text-white focus:border-theme-accent focus:outline-none font-mono"
                    >
                      <option value="AUTO">Tự động phân loại</option>
                      <option value="MIEN_1">Miền 1: Dữ liệu</option>
                      <option value="MIEN_2">Miền 2: Giao tiếp</option>
                      <option value="MIEN_3">Miền 3: Sáng tạo</option>
                      <option value="MIEN_4">Miền 4: An toàn</option>
                      <option value="MIEN_5">Miền 5: Giải quyết VĐ</option>
                      <option value="MIEN_6">Miền 6: Nghề nghiệp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#B6A6D8] mb-1">Mức độ nhận thức:</label>
                    <select
                      value={defaultCognitiveLevel}
                      onChange={(e) => setDefaultCognitiveLevel(e.target.value as any)}
                      className="w-full bg-black/60 border border-white/20 rounded-[4px] px-2 py-1 text-xs text-white focus:border-theme-accent focus:outline-none font-mono"
                    >
                      <option value="AUTO">Tự động</option>
                      <option value="NHAN_BIET">Nhận biết</option>
                      <option value="THONG_HIEU">Thông hiểu</option>
                      <option value="VAN_DUNG">Vận dụng</option>
                      <option value="VAN_DUNG_CAO">Vận dụng cao</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="inline-flex items-center gap-2 cursor-pointer pb-1">
                      <input
                        type="checkbox"
                        checked={autoApprove}
                        onChange={(e) => setAutoApprove(e.target.checked)}
                        className="rounded bg-black/60 border-white/20 text-theme-accent focus:ring-0"
                      />
                      <span className="text-[11px] font-mono text-emerald-300 font-semibold">
                        Duyệt ngay (Approved)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Parsed Question Data Grid with Inline Editing (7 Cols) */}
            <div className="lg:col-span-7 space-y-3 flex flex-col">
              
              {/* Top Filter & Quality Diagnostic Stats */}
              <div className="p-3 rounded-[6px] bg-[#241148]/60 border border-theme-accent/20 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Đã nhận diện: {parsedList.length} câu</span>
                  </span>

                  {/* Filter chips */}
                  <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-[4px] text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => setValidationFilter('ALL')}
                      className={`px-2 py-0.5 rounded transition ${validationFilter === 'ALL' ? 'bg-white/20 text-white font-bold' : 'text-white/60 hover:text-white'}`}
                    >
                      Tất cả ({validationSummary.total})
                    </button>
                    <button
                      type="button"
                      onClick={() => setValidationFilter('VALID')}
                      className={`px-2 py-0.5 rounded transition ${validationFilter === 'VALID' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-300/70 hover:text-emerald-300'}`}
                    >
                      Hợp lệ ({validationSummary.valid})
                    </button>
                    {(validationSummary.warnings > 0 || validationSummary.errors > 0) && (
                      <button
                        type="button"
                        onClick={() => setValidationFilter('ISSUES')}
                        className={`px-2 py-0.5 rounded transition ${validationFilter === 'ISSUES' ? 'bg-amber-600 text-white font-bold' : 'text-amber-300/70 hover:text-amber-300'}`}
                      >
                        Cần kiểm tra ({validationSummary.warnings + validationSummary.errors})
                      </button>
                    )}
                  </div>
                </div>

                {/* Search in preview */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Tìm trong danh sách..."
                    className="bg-black/60 border border-white/20 rounded-[4px] pl-7 pr-2 py-1 text-[11px] text-white placeholder-white/30 focus:border-theme-accent focus:outline-none font-mono w-40 sm:w-48"
                  />
                </div>
              </div>

              {/* Quick Batch Override Buttons */}
              {parsedList.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
                  <span className="text-[10px] text-white/50 shrink-0">Gán nhanh:</span>
                  <button
                    type="button"
                    onClick={() => handleBatchApplyStage('VONG_LOAI')}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-white/80 border border-white/10 shrink-0"
                  >
                    Vòng loại BGD
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchApplyStage('BAN_KET_1')}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-white/80 border border-white/10 shrink-0"
                  >
                    Bán kết
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchApplyStage('CHUNG_KET')}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-white/80 border border-white/10 shrink-0"
                  >
                    Chung kết
                  </button>
                  <span className="text-white/20">|</span>
                  <button
                    type="button"
                    onClick={() => handleBatchApplyLevel('NHAN_BIET')}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-emerald-300 border border-white/10 shrink-0"
                  >
                    Nhận biết
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchApplyLevel('THONG_HIEU')}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-sky-300 border border-white/10 shrink-0"
                  >
                    Thông hiểu
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchApplyLevel('VAN_DUNG')}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-amber-300 border border-white/10 shrink-0"
                  >
                    Vận dụng
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBatchApplyLevel('VAN_DUNG_CAO')}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-rose-300 border border-white/10 shrink-0"
                  >
                    Vận dụng cao
                  </button>
                </div>
              )}

              {/* Parsed List Data Grid */}
              <div className="flex-1 min-h-[320px] max-h-[480px] overflow-y-auto border border-theme-accent/25 rounded-[4px] bg-black/40 p-2 space-y-2.5 custom-scrollbar">
                {displayedQuestions.length === 0 ? (
                  <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-6 text-white/40 space-y-2">
                    <HelpCircle className="w-8 h-8 text-white/20" />
                    <p className="text-xs font-mono">Chưa có câu hỏi nào để hiển thị.</p>
                    <p className="text-[11px] text-white/30 max-w-sm">
                      Kéo thả tệp Excel/CSV hoặc bấm "Nạp Mẫu Ví Dụ" để hệ thống tự động bóc tách.
                    </p>
                  </div>
                ) : (
                  displayedQuestions.map((item, idx) => {
                    const isInvalid = !item.question_text || item.question_text.length < 5 || !item.correct_key;
                    const isEditing = editingItemIdx === idx;

                    return (
                      <div 
                        key={item.id || idx}
                        className={`p-3 rounded-[4px] border transition space-y-2 text-xs ${
                          isInvalid 
                            ? 'bg-rose-950/30 border-rose-500/40' 
                            : 'bg-[#241148]/60 border-white/10 hover:border-theme-accent/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 font-mono font-bold text-[10px] border border-sky-800">
                              #{idx + 1}
                            </span>
                            <span className="font-mono text-[11px] text-purple-300 font-semibold">
                              {item.round_name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono text-[10px]">
                              {item.stage}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono text-[10px] border border-amber-800">
                              {item.cognitive_level} • {item.points}đ • {item.time_limit}s
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingItemIdx(isEditing ? null : idx)}
                              className="text-white/40 hover:text-theme-accent p-1 transition cursor-pointer"
                              title="Chỉnh sửa câu này"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteParsedItem(idx)}
                              className="text-white/40 hover:text-rose-400 p-1 transition cursor-pointer"
                              title="Xóa câu này khỏi danh sách"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Question Text (Editable or Static) */}
                        {isEditing ? (
                          <div className="space-y-1.5 pt-1">
                            <textarea
                              value={item.question_text}
                              onChange={(e) => handleUpdateParsedItem(idx, { question_text: e.target.value })}
                              className="w-full bg-black/80 border border-theme-accent/40 rounded p-1.5 text-xs text-white font-mono focus:outline-none"
                              rows={2}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={item.correct_key}
                                onChange={(e) => handleUpdateParsedItem(idx, { correct_key: e.target.value })}
                                placeholder="Đáp án đúng..."
                                className="bg-black/80 border border-emerald-500/40 rounded px-2 py-1 text-xs text-emerald-300 font-mono"
                              />
                              <input
                                type="text"
                                value={item.explanation || ''}
                                onChange={(e) => handleUpdateParsedItem(idx, { explanation: e.target.value })}
                                placeholder="Giải thích chi tiết..."
                                className="bg-black/80 border border-white/20 rounded px-2 py-1 text-xs text-white/80 font-mono"
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="font-semibold text-white/90 leading-relaxed font-sans">
                            {item.question_text}
                          </p>
                        )}

                        {/* Options Grid */}
                        {item.options && Object.keys(item.options).length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                            {Object.entries(item.options).map(([optKey, optVal]) => {
                              const isCorrect = item.correct_key.toUpperCase().includes(optKey);
                              return (
                                <div 
                                  key={optKey}
                                  className={`px-2 py-1 rounded-[3px] text-[11px] font-mono flex items-start gap-1.5 border ${
                                    isCorrect 
                                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-bold' 
                                      : 'bg-black/30 border-white/10 text-white/70'
                                  }`}
                                >
                                  <span className={isCorrect ? 'text-emerald-400' : 'text-white/40'}>
                                    {optKey}.
                                  </span>
                                  <span className="line-clamp-2">{optVal}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Correct Key & Metadata Footer */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-mono font-bold">
                              Đáp án: {item.correct_key}
                            </span>
                            {item.explanation && (
                              <span className="text-white/50 truncate max-w-xs" title={item.explanation}>
                                • {item.explanation}
                              </span>
                            )}
                          </div>

                          <span className="text-theme-accent/70 font-mono text-[10px]">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#241148] border-t border-theme-accent/20 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#B6A6D8] font-mono flex items-center gap-2">
            <span>Sẵn sàng lưu:</span>
            <strong className="text-emerald-400 font-bold text-sm">{parsedList.length}</strong>
            <span>câu hỏi</span>
            {validationSummary.warnings > 0 && (
              <span className="text-amber-400 text-[11px]">
                ({validationSummary.warnings} cần lưu ý)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-[4px] bg-white/10 hover:bg-white/15 text-white/80 text-xs font-mono transition cursor-pointer"
            >
              Hủy Bỏ
            </button>

            <button
              type="button"
              onClick={handleCommitImport}
              disabled={parsedList.length === 0}
              className="px-5 py-2 rounded-[4px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold font-mono text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition disabled:opacity-40 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Lưu {parsedList.length} Câu Hỏi Vào Ngân Hàng</span>
            </button>
          </div>
        </div>

      </div>

      {/* ================= SUCCESS CONFIRMATION MODAL ================= */}
      {isSuccessModal && (
        <div className="fixed inset-0 z-[10000000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn select-none">
          <div className="bg-[#190839] border border-emerald-500/50 rounded-[8px] max-w-md w-full p-6 text-center space-y-4 shadow-2xl shadow-emerald-950/80">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white font-mono">
                Nhập Dữ Liệu Thành Công!
              </h3>
              <p className="text-xs text-[#B6A6D8]">
                Đã thêm <strong className="text-emerald-300">{successCount}</strong> câu hỏi chuẩn BTI 2026 vào kho dữ liệu khảo thí với đầy đủ lịch sử phiên bản v1.0.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setIsSuccessModal(false);
                  onClose();
                }}
                className="w-full py-2.5 rounded-[4px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
              >
                Hoàn Tất &amp; Xem Ngân Hàng Câu Hỏi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>,
    document.body
  );
};
