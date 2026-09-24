import * as XLSX from 'xlsx';
import { 
  QuestionItem, 
  PickedDriveFile, 
  CognitiveLevel, 
  DigitalCompetencyDomainKey, 
  QuestionRoundFormat, 
  RoundType 
} from '../types';
import { googlePickerService } from './googlePickerService';
import { questionBankManager } from './questionBankManager';
import { excelService } from './excelService';

export type DriveFileType = 
  | 'CSV' 
  | 'JSON' 
  | 'GOOGLE_DOC' 
  | 'GOOGLE_SHEET' 
  | 'EXCEL' 
  | 'PLAIN_TEXT' 
  | 'PDF' 
  | 'IMAGE' 
  | 'UNKNOWN';

export type DriveImportActionType = 
  | 'IMPORT_CSV_QUESTIONS'
  | 'IMPORT_JSON_QUESTIONS'
  | 'IMPORT_GOOGLE_DOC_QUESTIONS'
  | 'IMPORT_GOOGLE_SHEET_QUESTIONS'
  | 'IMPORT_EXCEL_QUESTIONS'
  | 'IMPORT_TEXT_QUESTIONS'
  | 'SCAN_DOCUMENT_AI'
  | 'UNSUPPORTED_FORMAT';

export interface DriveParsedFileMetadata {
  fileId: string;
  fileName: string;
  originalMimeType: string;
  extension: string;
  fileType: DriveFileType;
  actionType: DriveImportActionType;
  actionLabel: string;
  description: string;
  humanReadableSize?: string;
  canAutoParse: boolean;
  url?: string;
  embedUrl?: string;
  iconUrl?: string;
  lastEditedUtc?: number;
}

export interface DriveImportResult {
  success: boolean;
  fileMetadata: DriveParsedFileMetadata;
  actionTriggered: DriveImportActionType;
  importedQuestions: QuestionItem[];
  summary: {
    total: number;
    valid: number;
    duplicates: number;
    byDomain?: Record<string, number>;
  };
  rawSnippet?: string;
  warnings: string[];
  error?: string;
  requiresUserConfirmation?: boolean;
}

type DriveImportListener = (result: DriveImportResult) => void;

class DriveImportProcessorService {
  private listeners: Set<DriveImportListener> = new Set();

  /**
   * Subscribe to import events triggered by Google Picker
   */
  public addListener(listener: DriveImportListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all registered UI listeners
   */
  private notify(result: DriveImportResult): void {
    this.listeners.forEach(cb => {
      try {
        cb(result);
      } catch (err) {
        console.error('Error in DriveImportProcessor listener:', err);
      }
    });
  }

  /**
   * Parse and analyze raw Google Picker metadata into structured file properties
   */
  public parseMetadata(file: PickedDriveFile): DriveParsedFileMetadata {
    const rawId = (file.id || '').trim();
    // Normalize file ID in case Google Picker returned a compound or URL string
    const fileId = rawId.split('?')[0].split('#')[0];
    const fileName = (file.name || 'Untitled').trim();
    const mimeType = (file.mimeType || '').toLowerCase().trim();

    // Extract extension from file name
    const nameParts = fileName.split('.');
    const extension = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : '';

    let fileType: DriveFileType = 'UNKNOWN';
    let actionType: DriveImportActionType = 'UNSUPPORTED_FORMAT';
    let actionLabel = 'Không hỗ trợ định dạng này';
    let description = 'Tệp không thuộc danh mục hỗ trợ bóc tách câu hỏi tự động';
    let canAutoParse = false;

    // 1. Google Docs
    if (
      mimeType === 'application/vnd.google-apps.document' || 
      extension === 'gdoc' || 
      extension === 'docx' || 
      extension === 'doc'
    ) {
      fileType = 'GOOGLE_DOC';
      actionType = 'IMPORT_GOOGLE_DOC_QUESTIONS';
      actionLabel = 'Bóc tách đề thi từ Google Docs';
      description = 'Tự động xuất tệp văn bản Google Docs và nhận diện câu hỏi trắc nghiệm, tự luận';
      canAutoParse = true;
    }
    // 2. Google Sheets
    else if (
      mimeType === 'application/vnd.google-apps.spreadsheet' || 
      extension === 'gsheet'
    ) {
      fileType = 'GOOGLE_SHEET';
      actionType = 'IMPORT_GOOGLE_SHEET_QUESTIONS';
      actionLabel = 'Bóc tách từ Google Sheets';
      description = 'Xuất bảng tính Google Sheets sang định dạng Excel để nạp câu hỏi 6 vòng BTI 2026';
      canAutoParse = true;
    }
    // 3. CSV File
    else if (
      mimeType === 'text/csv' || 
      mimeType === 'application/csv' || 
      mimeType === 'text/comma-separated-values' || 
      extension === 'csv'
    ) {
      fileType = 'CSV';
      actionType = 'IMPORT_CSV_QUESTIONS';
      actionLabel = 'Nhập câu hỏi từ tệp CSV';
      description = 'Bóc tách dữ liệu câu hỏi từ tệp CSV theo các cột tiêu đề chuẩn';
      canAutoParse = true;
    }
    // 4. JSON File
    else if (
      mimeType === 'application/json' || 
      mimeType === 'text/json' || 
      extension === 'json'
    ) {
      fileType = 'JSON';
      actionType = 'IMPORT_JSON_QUESTIONS';
      actionLabel = 'Nhập câu hỏi từ tệp JSON';
      description = 'Đọc cấu trúc dữ liệu câu hỏi JSON chuẩn ngân hàng đề thi BTI';
      canAutoParse = true;
    }
    // 5. Microsoft Excel (.xlsx, .xls)
    else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
      mimeType === 'application/vnd.ms-excel' || 
      extension === 'xlsx' || 
      extension === 'xls'
    ) {
      fileType = 'EXCEL';
      actionType = 'IMPORT_EXCEL_QUESTIONS';
      actionLabel = 'Nhập câu hỏi từ tệp Excel';
      description = 'Đọc mẫu bảng tính Excel đa sheet hoặc bảng phẳng chuẩn';
      canAutoParse = true;
    }
    // 6. Plain Text / Markdown
    else if (
      mimeType === 'text/plain' || 
      mimeType === 'text/markdown' || 
      extension === 'txt' || 
      extension === 'md'
    ) {
      fileType = 'PLAIN_TEXT';
      actionType = 'IMPORT_TEXT_QUESTIONS';
      actionLabel = 'Bóc tách từ văn bản thuần';
      description = 'Phân tích văn bản đánh số (Câu 1, Câu 2...) thành danh sách câu hỏi';
      canAutoParse = true;
    }
    // 7. PDF Document
    else if (mimeType === 'application/pdf' || extension === 'pdf') {
      fileType = 'PDF';
      actionType = 'SCAN_DOCUMENT_AI';
      actionLabel = 'Quét tài liệu PDF bằng Gemini AI';
      description = 'Tài liệu PDF đề thi cần mở qua bộ quét OCR thông minh';
      canAutoParse = false;
    }
    // 8. Image files
    else if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
      fileType = 'IMAGE';
      actionType = 'SCAN_DOCUMENT_AI';
      actionLabel = 'Quét ảnh đề thi qua Camera/AI';
      description = 'Ảnh chứa đề thi hoặc minh họa VCNV';
      canAutoParse = false;
    }

    const formatBytes = (bytes?: number) => {
      if (!bytes || isNaN(bytes)) return undefined;
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return {
      fileId,
      fileName,
      originalMimeType: mimeType,
      extension,
      fileType,
      actionType,
      actionLabel,
      description,
      humanReadableSize: formatBytes(file.sizeBytes),
      canAutoParse,
      url: file.url,
      embedUrl: file.embedUrl,
      iconUrl: file.iconUrl,
      lastEditedUtc: file.lastEditedUtc
    };
  }

  /**
   * High-level entry point: handles the metadata returned by Google Picker,
   * analyzes the file ID and MIME type, downloads or exports the file from Google Drive,
   * parses the content into QuestionItem objects, and optionally commits to QuestionBankManager.
   */
  public async handlePickerMetadata(
    file: PickedDriveFile,
    autoCommit: boolean = false
  ): Promise<DriveImportResult> {
    const meta = this.parseMetadata(file);

    console.group(`[DriveImportProcessor] Processing Picker File: "${meta.fileName}"`);
    console.log('Parsed Metadata:', meta);
    console.log('Target Action:', meta.actionType);
    console.groupEnd();

    try {
      let importedQuestions: QuestionItem[] = [];
      const warnings: string[] = [];
      let rawSnippet = '';

      switch (meta.actionType) {
        case 'IMPORT_CSV_QUESTIONS': {
          const content = await this.fetchFileText(meta.fileId);
          rawSnippet = content.slice(0, 500);
          importedQuestions = this.parseCsvQuestions(content, warnings);
          break;
        }

        case 'IMPORT_JSON_QUESTIONS': {
          const content = await this.fetchFileText(meta.fileId);
          rawSnippet = content.slice(0, 500);
          importedQuestions = this.parseJsonQuestions(content, warnings);
          break;
        }

        case 'IMPORT_GOOGLE_DOC_QUESTIONS': {
          // Export Google Doc as plain text
          const content = await this.exportGoogleDocAsText(meta.fileId);
          rawSnippet = content.slice(0, 500);
          importedQuestions = this.parseTextQuestions(content, warnings);
          break;
        }

        case 'IMPORT_GOOGLE_SHEET_QUESTIONS': {
          // Export Google Sheet as Excel ArrayBuffer and parse with excelService
          const arrayBuffer = await this.exportGoogleSheetAsExcel(meta.fileId);
          importedQuestions = await this.parseExcelBuffer(arrayBuffer, warnings);
          break;
        }

        case 'IMPORT_EXCEL_QUESTIONS': {
          const arrayBuffer = await this.fetchFileBuffer(meta.fileId);
          importedQuestions = await this.parseExcelBuffer(arrayBuffer, warnings);
          break;
        }

        case 'IMPORT_TEXT_QUESTIONS': {
          const content = await this.fetchFileText(meta.fileId);
          rawSnippet = content.slice(0, 500);
          importedQuestions = this.parseTextQuestions(content, warnings);
          break;
        }

        case 'SCAN_DOCUMENT_AI': {
          return {
            success: true,
            fileMetadata: meta,
            actionTriggered: meta.actionType,
            importedQuestions: [],
            summary: { total: 0, valid: 0, duplicates: 0 },
            warnings: ['Tệp này là định dạng hình ảnh/PDF. Cần quét tự động qua Gemini AI Scanner.'],
            requiresUserConfirmation: true
          };
        }

        default: {
          throw new Error(`Định dạng tệp "${meta.fileName}" (${meta.originalMimeType}) chưa được hỗ trợ nhập tự động.`);
        }
      }

      // Check duplicates against existing question bank
      let duplicateCount = 0;
      const domainStats: Record<string, number> = {};

      importedQuestions.forEach(q => {
        const domain = q.digital_competency_domain || 'MIEN_1';
        domainStats[domain] = (domainStats[domain] || 0) + 1;

        const similar = questionBankManager.findSimilarQuestions(q.question_text, undefined, 0.7);
        if (similar.length > 0) {
          duplicateCount++;
        }
      });

      // Auto-commit if requested and questions were extracted
      if (autoCommit && importedQuestions.length > 0) {
        questionBankManager.batchImport(importedQuestions);
        console.log(`[DriveImportProcessor] Successfully committed ${importedQuestions.length} questions into QuestionBank.`);
      }

      const result: DriveImportResult = {
        success: importedQuestions.length > 0,
        fileMetadata: meta,
        actionTriggered: meta.actionType,
        importedQuestions,
        summary: {
          total: importedQuestions.length,
          valid: importedQuestions.length,
          duplicates: duplicateCount,
          byDomain: domainStats
        },
        rawSnippet,
        warnings
      };

      this.notify(result);
      return result;
    } catch (error: any) {
      console.error('[DriveImportProcessor] Error processing drive file:', error);
      const errorResult: DriveImportResult = {
        success: false,
        fileMetadata: meta,
        actionTriggered: meta.actionType,
        importedQuestions: [],
        summary: { total: 0, valid: 0, duplicates: 0 },
        warnings: [],
        error: error.message || 'Lỗi không xác định khi bóc tách tệp từ Google Drive.'
      };
      this.notify(errorResult);
      return errorResult;
    }
  }

  // ================= FETCHING / DOWNLOADING HELPERS =================

  private async getValidToken(): Promise<string> {
    const token = googlePickerService.getAccessToken();
    if (token) return token;
    return await googlePickerService.authenticate();
  }

  /**
   * Fetches raw text of a Drive file via alt=media
   */
  public async fetchFileText(fileId: string): Promise<string> {
    const token = await this.getValidToken();
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Tải tệp từ Google Drive thất bại (${res.status}): ${errText}`);
    }
    return await res.text();
  }

  /**
   * Fetches binary buffer of a Drive file
   */
  public async fetchFileBuffer(fileId: string): Promise<ArrayBuffer> {
    const token = await this.getValidToken();
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Tải dữ liệu nhị phân từ Google Drive thất bại (${res.status}): ${errText}`);
    }
    return await res.arrayBuffer();
  }

  /**
   * Exports a Google Doc as plain UTF-8 text
   */
  public async exportGoogleDocAsText(fileId: string): Promise<string> {
    const token = await this.getValidToken();
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Không thể xuất Google Doc sang dạng văn bản (${res.status}): ${errText}`);
    }
    return await res.text();
  }

  /**
   * Exports a Google Sheet as standard Excel .xlsx format
   */
  public async exportGoogleSheetAsExcel(fileId: string): Promise<ArrayBuffer> {
    const token = await this.getValidToken();
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Không thể xuất Google Sheets sang định dạng Excel (${res.status}): ${errText}`);
    }
    return await res.arrayBuffer();
  }

  // ================= PARSING ENGINES =================

  /**
   * Parse CSV content into QuestionItem[]
   */
  public parseCsvQuestions(csvText: string, warnings: string[]): QuestionItem[] {
    if (!csvText || !csvText.trim()) return [];

    // Parse CSV with XLSX library for robust quote, delimiter, and comma handling
    const wb = XLSX.read(csvText, { type: 'string' });
    const firstSheetName = wb.SheetNames[0];
    if (!firstSheetName) return [];

    const ws = wb.Sheets[firstSheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (rows.length < 2) {
      warnings.push('Tệp CSV không đủ dòng dữ liệu (cần ít nhất 1 dòng tiêu đề và 1 dòng câu hỏi).');
      return [];
    }

    // Find header index
    const headers = rows[0].map(h => String(h || '').trim().toLowerCase());
    
    const colIndex = {
      question: headers.findIndex(h => h.includes('câu hỏi') || h.includes('nội dung') || h.includes('question') || h.includes('de_bai')),
      optA: headers.findIndex(h => h === 'a' || h.includes('phương án a') || h.includes('option a')),
      optB: headers.findIndex(h => h === 'b' || h.includes('phương án b') || h.includes('option b')),
      optC: headers.findIndex(h => h === 'c' || h.includes('phương án c') || h.includes('option c')),
      optD: headers.findIndex(h => h === 'd' || h.includes('phương án d') || h.includes('option d')),
      answer: headers.findIndex(h => h.includes('đáp án') || h.includes('answer') || h.includes('correct') || h === 'key'),
      explanation: headers.findIndex(h => h.includes('giải thích') || h.includes('căn cứ') || h.includes('explanation')),
      domain: headers.findIndex(h => h.includes('miền') || h.includes('domain') || h.includes('khung')),
      level: headers.findIndex(h => h.includes('mức độ') || h.includes('level') || h.includes('nhận thức')),
      stage: headers.findIndex(h => h.includes('vòng') || h.includes('stage') || h.includes('phần thi'))
    };

    // If question column wasn't identified by header, default to column 1 or 0
    const qCol = colIndex.question >= 0 ? colIndex.question : 0;
    const items: QuestionItem[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const qText = String(row[qCol] || '').trim();
      if (!qText || qText.length < 3) continue;

      const optA = colIndex.optA >= 0 ? String(row[colIndex.optA] || '').trim() : '';
      const optB = colIndex.optB >= 0 ? String(row[colIndex.optB] || '').trim() : '';
      const optC = colIndex.optC >= 0 ? String(row[colIndex.optC] || '').trim() : '';
      const optD = colIndex.optD >= 0 ? String(row[colIndex.optD] || '').trim() : '';

      const answer = colIndex.answer >= 0 ? String(row[colIndex.answer] || '').trim().toUpperCase() : 'A';
      const explanation = colIndex.explanation >= 0 ? String(row[colIndex.explanation] || '').trim() : '';

      const options: Record<string, string> = {};
      if (optA) options['A'] = optA;
      if (optB) options['B'] = optB;
      if (optC) options['C'] = optC;
      if (optD) options['D'] = optD;

      const isMultipleChoice = Object.keys(options).length >= 2;

      const qItem: QuestionItem = {
        id: `CSV_${Date.now()}_${r}`,
        round_name: 'Nhập từ Google Drive CSV',
        round_type: isMultipleChoice ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER',
        round_format: isMultipleChoice ? 'BGD_MULTIPLE_CHOICE' : 'BGD_SHORT_ANSWER',
        category: 'Nhập khẩu Google Drive (CSV)',
        question_text: qText,
        options,
        correct_key: answer,
        explanation: explanation || 'Nhập tự động từ tệp CSV Google Drive.',
        time_limit: isMultipleChoice ? 30 : 20,
        stage: 'VONG_LOAI',
        digital_competency_domain: 'MIEN_1',
        cognitive_level: 'THONG_HIEU',
        approval_status: 'PENDING_REVIEW',
        created_by: 'Google Drive CSV Importer',
        created_at: Date.now()
      };

      items.push(qItem);
    }

    return items;
  }

  /**
   * Parse JSON structure into QuestionItem[]
   */
  public parseJsonQuestions(jsonText: string, warnings: string[]): QuestionItem[] {
    if (!jsonText || !jsonText.trim()) return [];

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err: any) {
      throw new Error(`Định dạng JSON không hợp lệ: ${err.message}`);
    }

    let rawList: any[] = [];
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.questions)) {
        rawList = parsed.questions;
      } else if (Array.isArray(parsed.items)) {
        rawList = parsed.items;
      } else if (Array.isArray(parsed.data)) {
        rawList = parsed.data;
      } else {
        rawList = [parsed];
      }
    }

    const items: QuestionItem[] = [];

    rawList.forEach((raw, idx) => {
      if (!raw || typeof raw !== 'object') return;

      const questionText = raw.question_text || raw.question || raw.text || raw.content || '';
      if (!questionText || String(questionText).trim().length < 3) {
        warnings.push(`Bỏ qua phần tử #${idx + 1} do thiếu nội dung câu hỏi.`);
        return;
      }

      const qItem: QuestionItem = {
        id: raw.id || `JSON_${Date.now()}_${idx + 1}`,
        round_name: raw.round_name || 'Nhập từ Google Drive JSON',
        round_type: (raw.round_type as RoundType) || (raw.options && Object.keys(raw.options).length > 1 ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER'),
        round_format: raw.round_format || 'BGD_MULTIPLE_CHOICE',
        category: raw.category || 'Nhập khẩu Google Drive (JSON)',
        question_text: String(questionText).trim(),
        options: raw.options && typeof raw.options === 'object' ? raw.options : {},
        correct_key: String(raw.correct_key || raw.answer || 'A').trim(),
        explanation: raw.explanation || raw.note || 'Nhập tự động từ tệp JSON Google Drive.',
        time_limit: raw.time_limit ? Number(raw.time_limit) : 30,
        stage: raw.stage || 'VONG_LOAI',
        digital_competency_domain: (raw.digital_competency_domain as DigitalCompetencyDomainKey) || 'MIEN_1',
        digital_sub_competency: raw.digital_sub_competency || '1.1',
        cognitive_level: (raw.cognitive_level as CognitiveLevel) || 'THONG_HIEU',
        approval_status: raw.approval_status || 'PENDING_REVIEW',
        legal_reference: raw.legal_reference || 'Thông tư 02/2025/TT-BGDĐT',
        created_by: raw.created_by || 'Google Drive JSON Importer',
        created_at: raw.created_at || Date.now()
      };

      items.push(qItem);
    });

    return items;
  }

  /**
   * Parse plain text document (from Google Docs or .txt) into QuestionItem[]
   */
  public parseTextQuestions(text: string, warnings: string[]): QuestionItem[] {
    if (!text || !text.trim()) return [];

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const items: QuestionItem[] = [];

    // Regex matchers for Vietnamese test documents
    const qStartRegex = /^(?:câu\s*\d+[\s.:)\-]|question\s*\d+[\s.:)\-]|\d+[\s.)\-]\s+)/i;
    const optRegex = /^([A-DF])[\s.:)\-]\s*(.*)$/i;
    const ansRegex = /^(?:đáp\s*án|câu\s*trả\s*lời|answer|key)[\s.:\-]+\s*([^\n\r]+)/i;
    const expRegex = /^(?:giải\s*thích|căn\s*cứ|ghi\s*chú|explanation|note)[\s.:\-]+\s*([^\n\r]+)/i;

    let currentQ: {
      text: string;
      options: Record<string, string>;
      answer: string;
      explanation: string;
    } | null = null;

    const commitCurrent = () => {
      if (!currentQ || !currentQ.text.trim()) return;

      const isMultipleChoice = Object.keys(currentQ.options).length >= 2;
      const qItem: QuestionItem = {
        id: `DOC_${Date.now()}_${items.length + 1}`,
        round_name: 'Nhập từ Google Doc / Văn bản',
        round_type: isMultipleChoice ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER',
        round_format: isMultipleChoice ? 'BGD_MULTIPLE_CHOICE' : 'BGD_SHORT_ANSWER',
        category: 'Nhập khẩu Google Drive (Docs)',
        question_text: currentQ.text.trim(),
        options: currentQ.options,
        correct_key: currentQ.answer || (isMultipleChoice ? 'A' : ''),
        explanation: currentQ.explanation || 'Nhập từ tài liệu văn bản Google Drive.',
        time_limit: isMultipleChoice ? 30 : 20,
        stage: 'VONG_LOAI',
        digital_competency_domain: 'MIEN_1',
        cognitive_level: 'THONG_HIEU',
        approval_status: 'PENDING_REVIEW',
        created_by: 'Google Docs Importer',
        created_at: Date.now()
      };

      items.push(qItem);
      currentQ = null;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if line starts a new question
      if (qStartRegex.test(line)) {
        commitCurrent();
        const cleanText = line.replace(qStartRegex, '').trim();
        currentQ = {
          text: cleanText,
          options: {},
          answer: '',
          explanation: ''
        };
        continue;
      }

      if (!currentQ) continue;

      // Check if line is an option (A, B, C, D)
      const optMatch = line.match(optRegex);
      if (optMatch) {
        const key = optMatch[1].toUpperCase();
        const content = optMatch[2].trim();
        currentQ.options[key] = content;
        continue;
      }

      // Check if line is an answer definition
      const ansMatch = line.match(ansRegex);
      if (ansMatch) {
        currentQ.answer = ansMatch[1].trim();
        continue;
      }

      // Check if line is an explanation
      const expMatch = line.match(expRegex);
      if (expMatch) {
        currentQ.explanation = expMatch[1].trim();
        continue;
      }

      // Otherwise, append to question text or explanation
      if (Object.keys(currentQ.options).length === 0) {
        currentQ.text += ` ${line}`;
      } else if (currentQ.explanation) {
        currentQ.explanation += ` ${line}`;
      }
    }

    commitCurrent();

    if (items.length === 0) {
      warnings.push('Không nhận diện được định dạng câu hỏi có số thứ tự trong văn bản. Đã thử tìm kiếm theo tiền tố "Câu 1:", "1.", v.v.');
    }

    return items;
  }

  /**
   * Parse an Excel / Google Sheet binary buffer using XLSX
   */
  public async parseExcelBuffer(buffer: ArrayBuffer, warnings: string[]): Promise<QuestionItem[]> {
    const wb = XLSX.read(buffer, { type: 'array' });
    const items: QuestionItem[] = [];

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (rows.length < 2) continue;

      // Scan rows for questions
      const headers = rows[0].map(h => String(h || '').trim().toLowerCase());
      const qCol = headers.findIndex(h => h.includes('câu hỏi') || h.includes('nội dung') || h.includes('question'));
      const colIdx = qCol >= 0 ? qCol : 1;

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || !row[colIdx]) continue;

        const qText = String(row[colIdx]).trim();
        if (qText.length < 4 || qText.toLowerCase().includes('hướng dẫn')) continue;

        const answer = String(row[colIdx + 1] || 'A').trim();
        const qItem: QuestionItem = {
          id: `XLS_${Date.now()}_${items.length + 1}`,
          round_name: sheetName,
          round_type: 'SHORT_ANSWER',
          round_format: 'KHOI_DONG_CHUNG',
          category: `Sheet: ${sheetName}`,
          question_text: qText,
          options: {},
          correct_key: answer,
          explanation: `Nhập tự động từ sheet ${sheetName}.`,
          time_limit: 15,
          stage: 'VONG_LOAI',
          digital_competency_domain: 'MIEN_1',
          cognitive_level: 'THONG_HIEU',
          approval_status: 'PENDING_REVIEW',
          created_by: 'Google Drive Sheets Importer',
          created_at: Date.now()
        };
        items.push(qItem);
      }
    }

    return items;
  }
}

export const driveImportProcessorService = new DriveImportProcessorService();
