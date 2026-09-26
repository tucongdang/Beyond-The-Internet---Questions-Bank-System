import { QuestionItem, DigitalCompetencyDomainKey, CognitiveLevel } from '../types';
import { DIGITAL_COMPETENCY_DOMAINS, COGNITIVE_LEVELS } from '../data/digitalCompetencyData';

export type ExportScope = 'ALL' | 'FILTERED' | 'SELECTED';

export type PdfExamLayout = 'STUDENT' | 'TEACHER' | 'MATRIX_ONLY';

export interface PdfExportOptions {
  scope: ExportScope;
  layout: PdfExamLayout;
  title?: string;
  institution?: string;
  subtitle?: string;
  includeLegalRef?: boolean;
  includeExplanation?: boolean;
  includeQuickAnswerKey?: boolean;
  includeStudentInfoBox?: boolean;
  includeCompetencyMatrix?: boolean;
  fontSize?: 'compact' | 'standard' | 'large';
  paperSize?: 'a4' | 'letter';
}

export interface JsonExportOptions {
  scope: ExportScope;
  includeAnswers?: boolean;
  includeExplanations?: boolean;
  includeMetadataEnvelope?: boolean;
  pretty?: boolean;
  customFilename?: string;
}

export interface ExportSummaryStats {
  total: number;
  byRound: Record<string, number>;
  byDomain: Record<string, number>;
  byCognitiveLevel: Record<string, number>;
  withImages: number;
}

/**
 * Calculates demographic & pedagogical stats for the exported question set
 */
export function calculateExportStats(questions: QuestionItem[]): ExportSummaryStats {
  const stats: ExportSummaryStats = {
    total: questions.length,
    byRound: {},
    byDomain: {},
    byCognitiveLevel: {},
    withImages: 0
  };

  for (const q of questions) {
    // Round
    const round = q.round_name || q.round_group || q.round_type || 'Chưa phân loại';
    stats.byRound[round] = (stats.byRound[round] || 0) + 1;

    // Domain
    const domainKey = q.digital_competency_domain || 'CHUA_PHAN_LOAI';
    stats.byDomain[domainKey] = (stats.byDomain[domainKey] || 0) + 1;

    // Cognitive Level
    const level = q.cognitive_level || 'THONG_HIEU';
    stats.byCognitiveLevel[level] = (stats.byCognitiveLevel[level] || 0) + 1;

    // Media
    if (q.media_url || (q.option_images && Object.keys(q.option_images).length > 0)) {
      stats.withImages++;
    }
  }

  return stats;
}

/**
 * Strips answers and sensitive scoring details from questions for student mock exams
 */
export function sanitizeQuestionsForStudents(questions: QuestionItem[]): Partial<QuestionItem>[] {
  return questions.map(q => {
    const copy: any = { ...q };
    delete copy.correct_key;
    delete copy.explanation;
    delete copy.review_notes;
    delete copy.approval_status;
    delete copy.approved_by;
    if (copy.obstacle_info) {
      copy.obstacle_info = {
        obstacleImage: copy.obstacle_info.obstacleImage
      };
    }
    return copy;
  });
}

/**
 * Builds standard JSON export content and metadata envelope
 */
export function generateJsonExport(
  questions: QuestionItem[],
  options: JsonExportOptions
): { jsonString: string; filename: string; count: number } {
  const count = questions.length;
  const includeAnswers = options.includeAnswers !== false;
  const includeExplanations = options.includeExplanations !== false;
  const includeEnvelope = options.includeMetadataEnvelope !== false;
  const pretty = options.pretty !== false;

  const processedQuestions = questions.map(q => {
    const item: any = { ...q };
    if (!includeAnswers) {
      delete item.correct_key;
      if (item.obstacle_info) {
        delete item.obstacle_info.obstacleKey;
      }
    }
    if (!includeExplanations) {
      delete item.explanation;
      delete item.review_notes;
      if (item.obstacle_info) {
        delete item.obstacle_info.explanation;
      }
    }
    return item;
  });

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
  const filename = options.customFilename || `BTI_2026_QuestionBank_${options.scope.toLowerCase()}_${count}Q_${dateStr}_${timeStr}.json`;

  let finalData: any = processedQuestions;

  if (includeEnvelope) {
    const stats = calculateExportStats(questions);
    finalData = {
      project: "Beyond The Internet 2026 (BTI 2026)",
      system: "BTI 2026 Digital Competency Assessment Platform",
      exportTimestamp: now.toISOString(),
      schemaVersion: "2.1",
      exportScope: options.scope,
      totalQuestions: count,
      contentConfiguration: {
        includeAnswers,
        includeExplanations
      },
      statistics: stats,
      questions: processedQuestions
    };
  }

  const jsonString = pretty ? JSON.stringify(finalData, null, 2) : JSON.stringify(finalData);

  return { jsonString, filename, count };
}

/**
 * Triggers a browser download of the generated JSON file
 */
export function downloadJsonFile(jsonString: string, filename: string): void {
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}

/**
 * Generates a complete standalone printable HTML document with embedded styles
 * that renders beautifully for printing or saving as PDF in any browser.
 */
export function generatePrintableHtmlDocument(
  questions: QuestionItem[],
  options: PdfExportOptions
): string {
  const institution = options.institution || 'BỘ GIÁO DỤC VÀ ĐÀO TẠO • BAN TỔ CHỨC BTI 2026';
  const title = options.title || 'ĐỀ THI ĐÁNH GIÁ NĂNG LỰC SỐ NGƯỜI HỌC 2026';
  const subtitle = options.subtitle || 'KỲ THI: BEYOND THE INTERNET 2026 • THỜI GIAN LÀM BÀI: 45 PHÚT';
  const isTeacher = options.layout === 'TEACHER';
  const isStudent = options.layout === 'STUDENT';
  const includeLegalRef = options.includeLegalRef !== false;
  const includeExplanation = options.includeExplanation !== false && isTeacher;
  const includeStudentInfo = options.includeStudentInfoBox !== false;
  const includeQuickKey = options.includeQuickAnswerKey !== false;
  const includeMatrix = options.includeCompetencyMatrix !== false;

  const fontSizeClass = {
    compact: '11pt',
    standard: '12pt',
    large: '13pt'
  }[options.fontSize || 'standard'];

  // Build Answer Key Rows for quick sheet
  const quickKeyItems = questions.map((q, idx) => ({
    num: idx + 1,
    id: q.id,
    key: q.correct_key || '—'
  }));

  // Render question items
  const questionsHtml = questions.map((q, index) => {
    const qNum = index + 1;
    const cognitiveName = q.cognitive_level ? (COGNITIVE_LEVELS[q.cognitive_level]?.name || q.cognitive_level) : '';
    const domainObj = q.digital_competency_domain ? DIGITAL_COMPETENCY_DOMAINS[q.digital_competency_domain] : null;
    const domainName = domainObj ? domainObj.name : '';

    const optionsEntries = Object.entries(q.options || {}).filter(([k]) => {
      return !['kdTurn', 'obstacleImage', 'riskQuestion', 'riskAnswer', 'clue1', 'ans1', 'clue2', 'ans2', 'clue3', 'ans3', 'clue4', 'ans4', 'centerText', 'centerAnswer', '_raw'].includes(k);
    });

    const optionsHtml = optionsEntries.length > 0 ? `
      <div class="options-grid">
        ${optionsEntries.map(([k, val]) => {
          const isCorrect = isTeacher && (q.correct_key === k || q.correct_key?.toUpperCase().includes(k.toUpperCase()));
          return `
            <div class="option-item ${isCorrect ? 'correct-option' : ''}">
              <span class="option-letter ${isCorrect ? 'correct-badge' : ''}">${k}.</span>
              <span class="option-text">${val}</span>
              ${isCorrect ? '<span class="correct-mark">✓ [ĐÁP ÁN ĐÚNG]</span>' : ''}
            </div>
          `;
        }).join('')}
      </div>
    ` : '';

    const teacherMetaHtml = isTeacher ? `
      <div class="teacher-notes">
        <div class="meta-row">
          <strong>Đáp án đúng:</strong> <span class="badge-accent">${q.correct_key || 'Chưa nhập'}</span>
          ${q.points ? `&bull; <strong>Điểm số:</strong> ${q.points} điểm` : ''}
          ${cognitiveName ? `&bull; <strong>Mức độ nhận thức:</strong> ${cognitiveName}` : ''}
          ${domainName ? `&bull; <strong>Miền tri thức:</strong> ${domainName}` : ''}
        </div>
        ${includeLegalRef && q.legal_reference ? `
          <div class="legal-row">
            ⚖️ <strong>Căn cứ văn bản pháp lý:</strong> <em>${q.legal_reference}</em>
          </div>
        ` : ''}
        ${includeExplanation && q.explanation ? `
          <div class="explanation-box">
            💡 <strong>Lời giải thích chi tiết:</strong> ${q.explanation}
          </div>
        ` : ''}
      </div>
    ` : '';

    return `
      <div class="question-container">
        <div class="question-header">
          <span class="q-number">Câu ${qNum} [${q.id}]:</span>
          <span class="q-round">${q.round_name || q.round_group || ''}</span>
          ${isStudent && q.points ? `<span class="q-points">(${q.points} điểm)</span>` : ''}
        </div>
        <div class="question-body">
          ${q.question_text || ''}
        </div>
        ${q.media_url ? `
          <div class="media-container">
            <img src="${q.media_url}" alt="Hình ảnh câu hỏi" class="q-image" />
          </div>
        ` : ''}
        ${optionsHtml}
        ${teacherMetaHtml}
      </div>
    `;
  }).join('');

  // Quick Answer Sheet Grid HTML
  const quickKeyHtml = includeQuickKey ? `
    <div class="page-break"></div>
    <div class="section-title">BẢNG ĐÁP ÁN NHANH (ANSWER KEY SHEET)</div>
    <div class="quick-key-grid">
      ${quickKeyItems.map(item => `
        <div class="key-box">
          <span class="key-num">Câu ${item.num}</span>
          <strong class="key-val ${isTeacher ? 'key-visible' : 'key-blank'}">${isTeacher ? item.key : '&nbsp;'}</strong>
        </div>
      `).join('')}
    </div>
  ` : '';

  // Optional Competency Matrix Summary HTML
  const stats = calculateExportStats(questions);
  const matrixSummaryHtml = includeMatrix ? `
    <div class="matrix-card">
      <div class="matrix-title">📊 MA TRẬN PHÂN BỔ ĐỀ THI (THÔNG TƯ 02/2025/TT-BGDĐT)</div>
      <div class="matrix-grid">
        <div class="matrix-col">
          <strong>Tổng số câu:</strong> ${stats.total} câu
        </div>
        <div class="matrix-col">
          <strong>Số câu có hình ảnh/media:</strong> ${stats.withImages} câu
        </div>
      </div>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${institution}</title>
  <style>
    @page {
      size: ${options.paperSize || 'a4'} portrait;
      margin: 15mm 15mm 15mm 15mm;
      @bottom-right {
        content: "Trang " counter(page);
        font-family: Arial, sans-serif;
        font-size: 9pt;
      }
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    body {
      font-family: "Segoe UI", Arial, Helvetica, sans-serif;
      font-size: ${fontSizeClass};
      line-height: 1.5;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .exam-wrapper {
      max-width: 820px;
      margin: 0 auto;
      padding: 10px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      border-bottom: 2px solid #000000;
      padding-bottom: 10px;
    }
    .header-table td {
      vertical-align: top;
    }
    .header-left {
      width: 58%;
      text-align: left;
    }
    .header-right {
      width: 42%;
      text-align: right;
    }
    .institution-name {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1f2937;
    }
    .exam-main-title {
      font-size: 13pt;
      font-weight: 900;
      text-transform: uppercase;
      margin-top: 4px;
      color: #000000;
    }
    .exam-sub-title {
      font-size: 9.5pt;
      font-weight: 600;
      color: #4b5563;
      margin-top: 2px;
    }
    .student-info-box {
      border: 1px dashed #6b7280;
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 16px;
      background: #f9fafb;
    }
    .student-fields {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 10pt;
    }
    .student-fields .field {
      flex: 1;
      min-width: 180px;
    }
    .dots {
      border-bottom: 1px dotted #374151;
      display: inline-block;
      width: 60%;
      height: 14px;
    }
    .section-title {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1.5px solid #1f2937;
      padding-bottom: 4px;
      margin: 18px 0 12px 0;
      color: #111827;
    }
    .question-container {
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .question-header {
      font-weight: bold;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .q-number {
      font-weight: 900;
      color: #000000;
    }
    .q-round {
      font-size: 8.5pt;
      padding: 1px 6px;
      border: 1px solid #9ca3af;
      border-radius: 3px;
      background: #f3f4f6;
      font-weight: normal;
    }
    .q-points {
      font-size: 9pt;
      font-style: italic;
      color: #4b5563;
    }
    .question-body {
      margin-bottom: 8px;
      text-align: justify;
      line-height: 1.55;
    }
    .options-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 16px;
      margin-left: 12px;
      margin-bottom: 6px;
    }
    .option-item {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: ${fontSizeClass};
      padding: 3px 6px;
      border-radius: 3px;
    }
    .option-letter {
      font-weight: bold;
      min-width: 18px;
    }
    .correct-option {
      background: #ecfdf5;
      border: 1px solid #10b981;
    }
    .correct-badge {
      color: #065f46;
    }
    .correct-mark {
      font-size: 8pt;
      font-weight: bold;
      color: #047857;
      margin-left: auto;
    }
    .media-container {
      text-align: center;
      margin: 8px 0;
    }
    .q-image {
      max-width: 320px;
      max-height: 200px;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }
    .teacher-notes {
      margin-top: 6px;
      padding: 6px 10px;
      background: #f0fdf4;
      border-left: 3px solid #10b981;
      font-size: 9pt;
      border-radius: 0 4px 4px 0;
    }
    .meta-row {
      color: #1f2937;
      margin-bottom: 4px;
    }
    .badge-accent {
      background: #10b981;
      color: #ffffff;
      padding: 1px 6px;
      border-radius: 3px;
      font-weight: bold;
    }
    .legal-row {
      color: #0369a1;
      margin-bottom: 4px;
    }
    .explanation-box {
      color: #374151;
      background: #ffffff;
      padding: 4px 8px;
      border-radius: 3px;
      border: 1px solid #d1fae5;
    }
    .page-break {
      page-break-before: always;
    }
    .quick-key-grid {
      display: grid;
      grid-template-columns: repeat(10, 1fr);
      gap: 6px;
      margin-top: 10px;
    }
    .key-box {
      border: 1px solid #000000;
      text-align: center;
      padding: 4px 2px;
      border-radius: 2px;
    }
    .key-num {
      display: block;
      font-size: 8pt;
      color: #4b5563;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 2px;
    }
    .key-val {
      display: block;
      font-size: 11pt;
      color: #000000;
    }
    .key-visible {
      color: #047857;
      font-weight: bold;
    }
    .key-blank {
      color: transparent;
    }
    .matrix-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 16px;
      font-size: 9pt;
    }
    .matrix-title {
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .matrix-grid {
      display: flex;
      gap: 20px;
      color: #475569;
    }
    @media print {
      .exam-wrapper {
        max-width: 100%;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="exam-wrapper">
    <table class="header-table">
      <tr>
        <td class="header-left">
          <div class="institution-name">${institution}</div>
          <div class="exam-main-title">${title}</div>
          <div class="exam-sub-title">${subtitle}</div>
        </td>
        <td class="header-right">
          <div style="font-weight:bold; font-size:10pt;">KỲ THI ĐÁNH GIÁ NĂNG LỰC SỐ 2026</div>
          <div style="font-size:9pt; color:#4b5563;">HÌNH THỨC: ${isTeacher ? 'ĐÁP ÁN & HƯỚNG DẪN CHẤM' : 'ĐỀ THI CHÍNH THỨC'}</div>
          <div style="font-size:8.5pt; color:#6b7280; margin-top:4px;">Tổng số câu: ${questions.length} câu</div>
        </td>
      </tr>
    </table>

    ${includeStudentInfo && isStudent ? `
      <div class="student-info-box">
        <div class="student-fields">
          <div class="field">Họ và tên thí sinh: <span class="dots" style="width:70%;"></span></div>
          <div class="field">Số báo danh (SBD): <span class="dots" style="width:50%;"></span></div>
          <div class="field">Lớp / Trường: <span class="dots" style="width:65%;"></span></div>
          <div class="field">Phòng thi: <span class="dots" style="width:40%;"></span></div>
        </div>
      </div>
    ` : ''}

    ${matrixSummaryHtml}

    <div class="questions-list">
      ${questionsHtml}
    </div>

    ${quickKeyHtml}
  </div>
</body>
</html>`;
}

/**
 * Triggers the browser print dialog for printing or saving as PDF
 */
export function printHtmlDocument(htmlContent: string): void {
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    alert('Trình duyệt đã chặn cửa sổ in (Pop-up). Vui lòng cho phép Pop-up để mở bản in đề thi.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };
}

/**
 * Triggers browser download of a standalone offline HTML document
 */
export function downloadHtmlDocument(htmlContent: string, filename: string): void {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}
