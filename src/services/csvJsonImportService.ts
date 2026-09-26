import { 
  QuestionItem, 
  CognitiveLevel, 
  DigitalCompetencyDomainKey, 
  CompetitionStage,
  RoundType,
  QuestionRoundFormat,
  ApprovalStatus
} from '../types';
import { DIGITAL_COMPETENCY_DOMAINS, COGNITIVE_LEVELS } from '../data/digitalCompetencyData';

export interface CsvJsonParseResult {
  success: boolean;
  format: 'JSON' | 'CSV' | 'TSV' | 'UNKNOWN';
  questions: QuestionItem[];
  validCount: number;
  invalidCount: number;
  errors: string[];
  warnings: string[];
  summary: {
    totalParsed: number;
    byDomain: Record<string, number>;
    byLevel: Record<string, number>;
    byRound: Record<string, number>;
  };
}

export interface CsvJsonImportOptions {
  defaultStage?: CompetitionStage | 'AUTO';
  defaultDomain?: DigitalCompetencyDomainKey | 'AUTO';
  defaultLevel?: CognitiveLevel | 'AUTO';
  defaultCognitiveLevel?: CognitiveLevel | 'AUTO';
  defaultPoints?: number;
  defaultTimeLimit?: number;
  autoApprove?: boolean;
}

/**
 * Service to parse, validate and convert CSV, TSV and JSON files into QuestionItem models
 */
export class CsvJsonImportService {

  /**
   * Parse uploaded File (CSV, TSV, or JSON)
   */
  public async parseFile(file: File, options?: CsvJsonImportOptions): Promise<CsvJsonParseResult> {
    const filename = file.name.toLowerCase();
    const content = await file.text();

    if (filename.endsWith('.json')) {
      return this.parseJsonContent(content, options);
    } else if (filename.endsWith('.csv')) {
      return this.parseCsvContent(content, ',', options);
    } else if (filename.endsWith('.tsv') || filename.endsWith('.txt')) {
      // Check if content looks like JSON
      const trimmed = content.trim();
      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
        try {
          return this.parseJsonContent(content, options);
        } catch {
          // Fallback to TSV/CSV
        }
      }
      return this.parseCsvContent(content, '\t', options);
    }

    // Attempt auto-detection
    return this.parseRawText(content, options);
  }

  /**
   * Parse Raw Text with intelligent format detection
   */
  public parseRawText(content: string, options?: CsvJsonImportOptions): CsvJsonParseResult {
    const trimmed = content.trim();

    if (!trimmed) {
      return {
        success: false,
        format: 'UNKNOWN',
        questions: [],
        validCount: 0,
        invalidCount: 0,
        errors: ['Nội dung tệp trống.'],
        warnings: [],
        summary: { totalParsed: 0, byDomain: {}, byLevel: {}, byRound: {} }
      };
    }

    // Try JSON first
    if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        return this.parseJsonContent(trimmed, options);
      } catch (err: any) {
        // Not valid JSON, continue to CSV detection
      }
    }

    // Check delimiter for CSV / TSV
    const firstLine = trimmed.split('\n')[0] || '';
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;

    let delimiter = ',';
    if (tabCount > commaCount && tabCount > semicolonCount) delimiter = '\t';
    else if (semicolonCount > commaCount) delimiter = ';';

    return this.parseCsvContent(trimmed, delimiter, options);
  }

  /**
   * Parse JSON content
   */
  public parseJsonContent(jsonStr: string, options: CsvJsonImportOptions = {}): CsvJsonParseResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const parsedQuestions: QuestionItem[] = [];

    let parsedData: any;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (err: any) {
      return {
        success: false,
        format: 'JSON',
        questions: [],
        validCount: 0,
        invalidCount: 0,
        errors: [`Lỗi cú pháp JSON: ${err.message}`],
        warnings: [],
        summary: { totalParsed: 0, byDomain: {}, byLevel: {}, byRound: {} }
      };
    }

    // Extract list if wrapped in an object like { questions: [...] } or { data: [...] }
    let rawItems: any[] = [];
    if (Array.isArray(parsedData)) {
      rawItems = parsedData;
    } else if (parsedData && typeof parsedData === 'object') {
      if (Array.isArray(parsedData.questions)) rawItems = parsedData.questions;
      else if (Array.isArray(parsedData.data)) rawItems = parsedData.data;
      else if (Array.isArray(parsedData.items)) rawItems = parsedData.items;
      else if (Array.isArray(parsedData.quiz)) rawItems = parsedData.quiz;
      else {
        // Single question object
        rawItems = [parsedData];
      }
    }

    if (rawItems.length === 0) {
      return {
        success: false,
        format: 'JSON',
        questions: [],
        validCount: 0,
        invalidCount: 0,
        errors: ['Không tìm thấy danh sách câu hỏi hợp lệ trong tệp JSON.'],
        warnings: [],
        summary: { totalParsed: 0, byDomain: {}, byLevel: {}, byRound: {} }
      };
    }

    const {
      defaultStage = 'VONG_LOAI',
      defaultDomain = 'AUTO',
      defaultLevel = options.defaultCognitiveLevel || options.defaultLevel || 'AUTO',
      defaultPoints = 10,
      defaultTimeLimit = 20,
      autoApprove = true
    } = options;

    rawItems.forEach((item, index) => {
      try {
        const itemNumber = index + 1;
        const qText = (item.question_text || item.question || item.text || item.content || item.title || '').trim();

        if (!qText) {
          warnings.push(`Dòng ${itemNumber}: Bỏ qua do thiếu nội dung câu hỏi (question_text/question).`);
          return;
        }

        // Parse options
        const optionsMap: Record<string, string> = {};
        if (item.options && typeof item.options === 'object' && !Array.isArray(item.options)) {
          Object.entries(item.options).forEach(([k, v]) => {
            if (v !== undefined && v !== null && String(v).trim()) {
              optionsMap[k.toUpperCase()] = String(v).trim();
            }
          });
        } else if (Array.isArray(item.options)) {
          const keys = ['A', 'B', 'C', 'D', 'E', 'F'];
          item.options.forEach((opt: any, optIdx: number) => {
            if (optIdx < keys.length && opt !== undefined && opt !== null) {
              const text = typeof opt === 'object' ? (opt.text || opt.content || opt.label || '') : String(opt);
              if (text.trim()) {
                optionsMap[keys[optIdx]] = text.trim();
              }
            }
          });
        } else {
          // Direct properties like optionA, optionB, or A, B, C, D
          ['A', 'B', 'C', 'D', 'E', 'F'].forEach(k => {
            const val = item[`option_${k.toLowerCase()}`] || item[`option${k}`] || item[k] || item[k.toLowerCase()];
            if (val) optionsMap[k] = String(val).trim();
          });
        }

        // Correct Answer Key
        let correctKey = String(
          item.correct_key || 
          item.correct_answer || 
          item.answer || 
          item.correct || 
          item.key || 
          ''
        ).trim();

        if (correctKey.length === 1 && optionsMap[correctKey.toUpperCase()]) {
          correctKey = correctKey.toUpperCase();
        } else if (!correctKey && Object.keys(optionsMap).length > 0) {
          correctKey = Object.keys(optionsMap)[0];
        }

        // Competency Domain
        let domain: DigitalCompetencyDomainKey = defaultDomain === 'AUTO' ? 'MIEN_1' : defaultDomain;
        const rawDomain = String(item.digital_competency_domain || item.domain || item.category || '').toLowerCase();
        if (rawDomain.includes('mien_1') || rawDomain.includes('miền 1') || rawDomain.includes('dữ liệu') || rawDomain.includes('thông tin')) domain = 'MIEN_1';
        else if (rawDomain.includes('mien_2') || rawDomain.includes('miền 2') || rawDomain.includes('giao tiếp') || rawDomain.includes('hợp tác')) domain = 'MIEN_2';
        else if (rawDomain.includes('mien_3') || rawDomain.includes('miền 3') || rawDomain.includes('sáng tạo') || rawDomain.includes('nội dung')) domain = 'MIEN_3';
        else if (rawDomain.includes('mien_4') || rawDomain.includes('miền 4') || rawDomain.includes('an toàn') || rawDomain.includes('bảo mật')) domain = 'MIEN_4';
        else if (rawDomain.includes('mien_5') || rawDomain.includes('miền 5') || rawDomain.includes('giải quyết')) domain = 'MIEN_5';
        else if (rawDomain.includes('mien_6') || rawDomain.includes('miền 6') || rawDomain.includes('nghề nghiệp')) domain = 'MIEN_6';

        // Cognitive Level
        let level: CognitiveLevel = defaultLevel === 'AUTO' ? 'THONG_HIEU' : defaultLevel;
        const rawLevel = String(item.cognitive_level || item.level || item.difficulty || '').toLowerCase();
        if (rawLevel.includes('nhan_biet') || rawLevel.includes('nhận biết') || rawLevel.includes('easy') || rawLevel.includes('bậc 1')) level = 'NHAN_BIET';
        else if (rawLevel.includes('thong_hieu') || rawLevel.includes('thông hiểu') || rawLevel.includes('medium') || rawLevel.includes('bậc 3')) level = 'THONG_HIEU';
        else if (rawLevel.includes('van_dung_cao') || rawLevel.includes('vận dụng cao') || rawLevel.includes('very_hard') || rawLevel.includes('bậc 7')) level = 'VAN_DUNG_CAO';
        else if (rawLevel.includes('van_dung') || rawLevel.includes('vận dụng') || rawLevel.includes('hard') || rawLevel.includes('bậc 5')) level = 'VAN_DUNG';

        // Round Name & Type
        const hasOptions = Object.keys(optionsMap).length > 0;
        const roundName = item.round_name || item.round || (hasOptions ? 'Vòng loại Bộ GD&ĐT (Trắc nghiệm ABCD)' : 'Vòng 1: Khởi động');
        const roundType: RoundType = item.round_type || (hasOptions ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER');
        const roundFormat: QuestionRoundFormat = item.round_format || (hasOptions ? 'BGD_MULTIPLE_CHOICE' : 'KHOI_DONG_CHUNG');

        // Tags
        let tags: string[] = [];
        if (Array.isArray(item.tags)) tags = item.tags.map(String);
        else if (typeof item.tags === 'string' && item.tags) tags = item.tags.split(',').map(s => s.trim()).filter(Boolean);

        const newItem: QuestionItem = {
          id: item.id || `JSON_IMPORT_${Date.now().toString(36)}_${itemNumber}`,
          round_name: roundName,
          round_type: roundType,
          round_format: roundFormat,
          category: item.category || DIGITAL_COMPETENCY_DOMAINS[domain]?.name || 'Năng lực số BTI',
          question_text: qText,
          options: optionsMap,
          correct_key: correctKey || 'A',
          explanation: item.explanation || item.notes || 'Nhập từ tệp JSON',
          legal_reference: item.legal_reference || item.reference || 'Thông tư 02/2025/TT-BGDĐT',
          digital_competency_domain: domain,
          digital_sub_competency: item.digital_sub_competency || item.sub_competency || `${domain.replace('MIEN_', '')}.1`,
          cognitive_level: level,
          stage: item.stage || (defaultStage === 'AUTO' ? 'VONG_LOAI' : defaultStage),
          time_limit: typeof item.time_limit === 'number' ? item.time_limit : defaultTimeLimit,
          points: typeof item.points === 'number' ? item.points : defaultPoints,
          approval_status: (item.approval_status as ApprovalStatus) || (autoApprove ? 'APPROVED' : 'PENDING_REVIEW'),
          created_by: item.created_by || 'Nhập JSON Ngoại Tuyến',
          created_at: item.created_at || Date.now(),
          tags: tags.length > 0 ? tags : ['JSON_IMPORT', domain]
        };

        parsedQuestions.push(newItem);
      } catch (err: any) {
        warnings.push(`Mục thứ ${index + 1}: Lỗi xử lý (${err.message}).`);
      }
    });

    const summary = this.buildSummary(parsedQuestions);

    return {
      success: parsedQuestions.length > 0,
      format: 'JSON',
      questions: parsedQuestions,
      validCount: parsedQuestions.length,
      invalidCount: rawItems.length - parsedQuestions.length,
      errors,
      warnings,
      summary
    };
  }

  /**
   * Parse CSV / TSV text content
   */
  public parseCsvContent(csvStr: string, delimiter = ',', options: CsvJsonImportOptions = {}): CsvJsonParseResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const parsedQuestions: QuestionItem[] = [];

    const rows = this.parseCsvToRows(csvStr, delimiter);
    if (rows.length < 2) {
      return {
        success: false,
        format: delimiter === '\t' ? 'TSV' : 'CSV',
        questions: [],
        validCount: 0,
        invalidCount: 0,
        errors: ['Tệp CSV không có đủ dòng dữ liệu (cần ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu).'],
        warnings: [],
        summary: { totalParsed: 0, byDomain: {}, byLevel: {}, byRound: {} }
      };
    }

    const headers = rows[0].map(h => h.trim().toLowerCase());
    
    // Map column indices
    const findIndex = (keywords: string[]) => {
      return headers.findIndex(h => keywords.some(k => h.includes(k)));
    };

    const qIdx = findIndex(['câu hỏi', 'question', 'noi dung', 'nội dung', 'q_text', 'question_text', 'de bai', 'đề bài']);
    const optAIdx = findIndex(['phương án a', 'lựa chọn a', 'option a', 'option_a', 'dap an a', 'a']);
    const optBIdx = findIndex(['phương án b', 'lựa chọn b', 'option b', 'option_b', 'dap an b', 'b']);
    const optCIdx = findIndex(['phương án c', 'lựa chọn c', 'option c', 'option_c', 'dap an c', 'c']);
    const optDIdx = findIndex(['phương án d', 'lựa chọn d', 'option d', 'option_d', 'dap an d', 'd']);
    const ansIdx = findIndex(['đáp án đúng', 'dap an dung', 'đáp án', 'dap an', 'correct', 'answer', 'correct_key', 'key', 'da']);
    const expIdx = findIndex(['giải thích', 'giai thich', 'lời giải', 'loi giai', 'explanation', 'huong dan', 'ghi chu']);
    const domainIdx = findIndex(['miền', 'mien', 'domain', 'khung năng lực', 'năng lực số']);
    const levelIdx = findIndex(['mức độ', 'muc do', 'level', 'cognitive', 'độ khó', 'do kho', 'difficulty']);
    const roundIdx = findIndex(['phần thi', 'phan thi', 'vòng thi', 'vong thi', 'round', 'round_name']);
    const stageIdx = findIndex(['giai đoạn', 'giai doan', 'stage']);
    const pointsIdx = findIndex(['điểm', 'diem', 'points', 'score']);
    const timeIdx = findIndex(['thời gian', 'thoi gian', 'time_limit', 'time', 'giây']);
    const refIdx = findIndex(['căn cứ', 'can cu', 'pháp lý', 'legal', 'reference', 'thông tư']);
    const tagsIdx = findIndex(['thẻ', 'the', 'tags', 'tag']);

    if (qIdx === -1) {
      errors.push('Không tìm thấy cột nội dung câu hỏi (chứa từ khóa "Câu hỏi", "Question", hoặc "Nội dung").');
    }

    const {
      defaultStage = 'VONG_LOAI',
      defaultDomain = 'AUTO',
      defaultLevel = options.defaultCognitiveLevel || options.defaultLevel || 'AUTO',
      defaultPoints = 10,
      defaultTimeLimit = 20,
      autoApprove = true
    } = options;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.length === 0 || row.every(c => !c.trim())) continue;

      const qText = qIdx !== -1 ? (row[qIdx] || '').trim() : (row[0] || '').trim();
      if (!qText || qText.length < 3) {
        warnings.push(`Dòng ${r + 1}: Bỏ qua vì nội dung câu hỏi quá ngắn hoặc trống.`);
        continue;
      }

      // Extract options
      const optionsMap: Record<string, string> = {};
      if (optAIdx !== -1 && row[optAIdx]?.trim()) optionsMap.A = row[optAIdx].trim();
      if (optBIdx !== -1 && row[optBIdx]?.trim()) optionsMap.B = row[optBIdx].trim();
      if (optCIdx !== -1 && row[optCIdx]?.trim()) optionsMap.C = row[optCIdx].trim();
      if (optDIdx !== -1 && row[optDIdx]?.trim()) optionsMap.D = row[optDIdx].trim();

      // Extract correct answer
      let correctKey = ansIdx !== -1 ? (row[ansIdx] || '').trim() : '';
      if (correctKey.length === 1 && optionsMap[correctKey.toUpperCase()]) {
        correctKey = correctKey.toUpperCase();
      } else if (!correctKey && Object.keys(optionsMap).length > 0) {
        correctKey = 'A';
      }

      // Domain
      let domain: DigitalCompetencyDomainKey = defaultDomain === 'AUTO' ? 'MIEN_1' : defaultDomain;
      const domainStr = (domainIdx !== -1 ? (row[domainIdx] || '') : '').toLowerCase();
      if (domainStr.includes('1') || domainStr.includes('dữ liệu') || domainStr.includes('thông tin')) domain = 'MIEN_1';
      else if (domainStr.includes('2') || domainStr.includes('giao tiếp') || domainStr.includes('hợp tác')) domain = 'MIEN_2';
      else if (domainStr.includes('3') || domainStr.includes('sáng tạo') || domainStr.includes('nội dung')) domain = 'MIEN_3';
      else if (domainStr.includes('4') || domainStr.includes('an toàn') || domainStr.includes('bảo mật')) domain = 'MIEN_4';
      else if (domainStr.includes('5') || domainStr.includes('giải quyết')) domain = 'MIEN_5';
      else if (domainStr.includes('6') || domainStr.includes('nghề nghiệp')) domain = 'MIEN_6';

      // Level
      let level: CognitiveLevel = defaultLevel === 'AUTO' ? 'THONG_HIEU' : defaultLevel;
      const levelStr = (levelIdx !== -1 ? (row[levelIdx] || '') : '').toLowerCase();
      if (levelStr.includes('nhận biết') || levelStr.includes('nhan biet') || levelStr.includes('easy') || levelStr.includes('1')) level = 'NHAN_BIET';
      else if (levelStr.includes('thông hiểu') || levelStr.includes('thong hieu') || levelStr.includes('medium') || levelStr.includes('2')) level = 'THONG_HIEU';
      else if (levelStr.includes('vận dụng cao') || levelStr.includes('van dung cao') || levelStr.includes('hard') || levelStr.includes('4')) level = 'VAN_DUNG_CAO';
      else if (levelStr.includes('vận dụng') || levelStr.includes('van dung') || levelStr.includes('3')) level = 'VAN_DUNG';

      const roundStr = roundIdx !== -1 ? (row[roundIdx] || '') : '';
      const hasOptions = Object.keys(optionsMap).length > 0;
      const roundName = roundStr.trim() || (hasOptions ? 'Vòng loại Bộ GD&ĐT (Trắc nghiệm ABCD)' : 'Vòng 1: Khởi động');
      const roundType: RoundType = hasOptions ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER';
      const roundFormat: QuestionRoundFormat = hasOptions ? 'BGD_MULTIPLE_CHOICE' : 'KHOI_DONG_CHUNG';

      const pts = pointsIdx !== -1 && !isNaN(Number(row[pointsIdx])) ? Number(row[pointsIdx]) : defaultPoints;
      const time = timeIdx !== -1 && !isNaN(Number(row[timeIdx])) ? Number(row[timeIdx]) : defaultTimeLimit;
      const explanation = expIdx !== -1 ? (row[expIdx] || '').trim() : 'Nhập từ tệp CSV';
      const legalRef = refIdx !== -1 ? (row[refIdx] || '').trim() : 'Thông tư 02/2025/TT-BGDĐT';
      
      let tags: string[] = [];
      if (tagsIdx !== -1 && row[tagsIdx]) {
        tags = row[tagsIdx].split(',').map(s => s.trim()).filter(Boolean);
      }

      parsedQuestions.push({
        id: `CSV_IMPORT_${Date.now().toString(36)}_${r}`,
        round_name: roundName,
        round_type: roundType,
        round_format: roundFormat,
        category: DIGITAL_COMPETENCY_DOMAINS[domain]?.name || 'Năng lực số BTI',
        question_text: qText,
        options: optionsMap,
        correct_key: correctKey || 'A',
        explanation: explanation,
        legal_reference: legalRef,
        digital_competency_domain: domain,
        digital_sub_competency: `${domain.replace('MIEN_', '')}.1`,
        cognitive_level: level,
        stage: defaultStage === 'AUTO' ? 'VONG_LOAI' : defaultStage,
        time_limit: time,
        points: pts,
        approval_status: autoApprove ? 'APPROVED' : 'PENDING_REVIEW',
        created_by: 'Nhập CSV Ngoại Tuyến',
        created_at: Date.now(),
        tags: tags.length > 0 ? tags : ['CSV_IMPORT', domain]
      });
    }

    const summary = this.buildSummary(parsedQuestions);

    return {
      success: parsedQuestions.length > 0,
      format: delimiter === '\t' ? 'TSV' : 'CSV',
      questions: parsedQuestions,
      validCount: parsedQuestions.length,
      invalidCount: rows.length - 1 - parsedQuestions.length,
      errors,
      warnings,
      summary
    };
  }

  /**
   * Helper: Parse CSV text into 2D array supporting quotes and newlines inside cells
   */
  private parseCsvToRows(text: string, delimiter = ','): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // Skip escaped quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        currentRow.push(currentCell);
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') i++; // Skip CRLF
        currentRow.push(currentCell);
        currentCell = '';
        if (currentRow.length > 0 && currentRow.some(c => c.trim())) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentCell += char;
      }
    }

    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell);
      if (currentRow.some(c => c.trim())) {
        rows.push(currentRow);
      }
    }

    return rows;
  }

  /**
   * Helper: Aggregate stats summary
   */
  private buildSummary(questions: QuestionItem[]) {
    const byDomain: Record<string, number> = {};
    const byLevel: Record<string, number> = {};
    const byRound: Record<string, number> = {};

    questions.forEach(q => {
      const d = q.digital_competency_domain || 'MIEN_1';
      byDomain[d] = (byDomain[d] || 0) + 1;

      const l = q.cognitive_level || 'THONG_HIEU';
      byLevel[l] = (byLevel[l] || 0) + 1;

      const r = q.round_name || 'Vòng loại';
      byRound[r] = (byRound[r] || 0) + 1;
    });

    return {
      totalParsed: questions.length,
      byDomain,
      byLevel,
      byRound
    };
  }

  /**
   * Download ready-to-use Sample CSV File
   */
  public downloadSampleCsv() {
    const headers = [
      'Nội dung câu hỏi',
      'Phương án A',
      'Phương án B',
      'Phương án C',
      'Phương án D',
      'Đáp án đúng',
      'Giải thích chi tiết',
      'Miền năng lực',
      'Mức độ nhận thức',
      'Phần thi',
      'Điểm số',
      'Thời gian (s)',
      'Căn cứ pháp lý',
      'Thẻ (Tags)'
    ];

    const sampleRows = [
      [
        'Theo Thông tư 02/2025/TT-BGDĐT, Miền 1 trong Khung năng lực số người học có tên gọi là gì?',
        'Khai thác dữ liệu và thông tin',
        'Giao tiếp và hợp tác trong môi trường số',
        'Sáng tạo nội dung số',
        'An toàn và bảo mật số',
        'A',
        'Căn cứ Điều 4 Thông tư 02/2025/TT-BGDĐT Khung năng lực số người học.',
        'Miền 1',
        'Nhận biết',
        'Vòng loại Bộ GD&ĐT',
        '10',
        '20',
        'Thông tư 02/2025/TT-BGDĐT',
        'TT02, Mien1, NhanBiet'
      ],
      [
        'Thao tác nào sau đây giúp kiểm chứng độ tin cậy của một bài viết trên mạng xã hội trước khi chia sẻ?',
        'Chia sẻ ngay khi thấy nhiều lượt tương tác',
        'Đối chiếu thông tin với các nguồn tin chính thống và tác giả gốc',
        'Lưu ảnh chụp màn hình và đăng lại',
        'Chỉ đọc tiêu đề và bình luận',
        'B',
        'Thuộc tiêu chí 1.2: Đánh giá dữ liệu và thông tin số theo Thông tư 02/2025.',
        'Miền 1',
        'Thông hiểu',
        'Vòng loại Bộ GD&ĐT',
        '10',
        '20',
        'Thông tư 02/2025/TT-BGDĐT',
        'TT02, Mien1, ThongHieu'
      ],
      [
        'Một học sinh nhận được email yêu cầu cung cấp mật khẩu tài khoản học tập trực tuyến kèm đường link lạ. Học sinh cần làm gì để đảm bảo an toàn?',
        'Nhập ngay mật khẩu để không bị khóa tài khoản',
        'Không bấm vào link, báo cáo với giáo viên quản trị hệ thống và kiểm tra địa chỉ người gửi',
        'Chuyển tiếp email cho các bạn cùng lớp để hỏi ý kiến',
        'Đổi mật khẩu theo hướng dẫn trong email lạ',
        'B',
        'Kỹ năng phòng chống tấn công lừa đảo (Phishing) thuộc Miền 4: An toàn số.',
        'Miền 4',
        'Vận dụng',
        'Vòng 3: Tăng tốc',
        '20',
        '30',
        'Luật An ninh mạng & TT 02/2025',
        'TT02, Mien4, VanDung'
      ],
      [
        'Tổ hợp phím nào trong hệ điều hành Windows dùng để khóa nhanh màn hình làm việc khi rời khỏi vị trí?',
        'Windows + L',
        'Windows + D',
        'Ctrl + Alt + Delete',
        'Alt + F4',
        'A',
        'Phím tắt Windows + L giúp Lock máy tính ngay lập tức để bảo vệ dữ liệu riêng tư.',
        'Miền 4',
        'Nhận biết',
        'Vòng 1: Khởi động',
        '10',
        '15',
        'Kỹ năng tin học cơ bản',
        'KhoiDong, Windows, Mien4'
      ]
    ];

    const csvContent = '\uFEFF' + [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...sampleRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BTI2026_Mau_Import_CauHoi_CSV_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Download ready-to-use Sample JSON File
   */
  public downloadSampleJson() {
    const sampleQuestions = [
      {
        id: "BTI2026_SAMPLE_001",
        question_text: "Theo Thông tư 02/2025/TT-BGDĐT, Miền 1 trong Khung năng lực số người học bao gồm những năng lực thành phần nào?",
        round_name: "Vòng loại Bộ GD&ĐT (Trắc nghiệm ABCD)",
        round_type: "MULTIPLE_CHOICE",
        round_format: "BGD_MULTIPLE_CHOICE",
        options: {
          A: "Duyệt, tìm kiếm và lọc dữ liệu; Đánh giá dữ liệu; Quản lý dữ liệu và thông tin",
          B: "Tương tác và chia sẻ; Tham gia quyền công dân số; Hợp tác qua công nghệ số",
          C: "Phát triển nội dung số; Bản quyền và giấy phép; Lập trình",
          D: "Bảo vệ thiết bị; Bảo vệ dữ liệu cá nhân; Bảo vệ sức khỏe"
        },
        correct_key: "A",
        explanation: "Căn cứ Điều 4 Thông tư 02/2025/TT-BGDĐT, Miền 1 (Khai thác dữ liệu và thông tin) gồm 3 tiêu chí thành phần: 1.1, 1.2 và 1.3.",
        legal_reference: "Thông tư 02/2025/TT-BGDĐT",
        digital_competency_domain: "MIEN_1",
        digital_sub_competency: "1.1",
        cognitive_level: "NHAN_BIET",
        stage: "VONG_LOAI",
        time_limit: 20,
        points: 10,
        approval_status: "APPROVED",
        tags: ["TT02", "Mien1", "NhanBiet"]
      },
      {
        id: "BTI2026_SAMPLE_002",
        question_text: "Khi tham gia làm việc nhóm trực tuyến trên nền tảng đám mây, hành vi nào thể hiện năng lực 'Hợp tác qua công nghệ số' (Miền 2) đạt hiệu quả cao?",
        round_name: "Vòng loại Bộ GD&ĐT (Trắc nghiệm ABCD)",
        round_type: "MULTIPLE_CHOICE",
        round_format: "BGD_MULTIPLE_CHOICE",
        options: {
          A: "Tải file về máy cá nhân chỉnh sửa rồi gửi đè lên file của nhóm mà không thông báo",
          B: "Sử dụng tính năng phân quyền, theo dõi lịch sử chỉnh sửa (Version History) và để lại nhận xét (Comments) rõ ràng cho thành viên",
          C: "Xóa toàn bộ nội dung của thành viên khác nếu không ưng ý mà không thảo luận",
          D: "Chỉ một người duy nhất được cấp quyền truy cập tài liệu"
        },
        correct_key: "B",
        explanation: "Hợp tác số văn minh và an toàn đòi hỏi tận dụng các công cụ cộng tác thời gian thực, quản lý phiên bản và giao tiếp tôn trọng.",
        legal_reference: "Thông tư 02/2025/TT-BGDĐT (Tiêu chí 2.4)",
        digital_competency_domain: "MIEN_2",
        digital_sub_competency: "2.4",
        cognitive_level: "THONG_HIEU",
        stage: "VONG_LOAI",
        time_limit: 20,
        points: 10,
        approval_status: "APPROVED",
        tags: ["TT02", "Mien2", "ThongHieu"]
      },
      {
        id: "BTI2026_SAMPLE_003",
        question_text: "Bạn hãy thiết lập quy tắc tạo mật khẩu mạnh và an toàn cho tài khoản định danh số cá nhân.",
        round_name: "Vòng 1: Khởi động",
        round_type: "SHORT_ANSWER",
        round_format: "KHOI_DONG_CHUNG",
        options: {},
        correct_key: "Tối thiểu 12 ký tự, kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt, không dùng thông tin cá nhân dễ đoán",
        explanation: "Mật khẩu an toàn theo khuyến nghị an ninh mạng quốc gia và Thông tư 02/2025/TT-BGDĐT.",
        legal_reference: "Luật An toàn thông tin mạng & TT 02/2025",
        digital_competency_domain: "MIEN_4",
        digital_sub_competency: "4.2",
        cognitive_level: "VAN_DUNG",
        stage: "BAN_KET_1",
        time_limit: 15,
        points: 10,
        approval_status: "APPROVED",
        tags: ["AnToanSo", "Password", "Mien4"]
      }
    ];

    const jsonStr = JSON.stringify(sampleQuestions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BTI2026_Mau_Import_CauHoi_JSON_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const csvJsonImportService = new CsvJsonImportService();
