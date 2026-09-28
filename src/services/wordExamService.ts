import { QuestionItem } from '../types';

export interface ParseWordResult {
  questions: QuestionItem[];
  warnings: string[];
}

export const wordExamService = {
  /**
   * Parses raw Word document text (or clipboard text copied from Word)
   */
  parseWordExamText(text: string): ParseWordResult {
    const questions: QuestionItem[] = [];
    const warnings: string[] = [];
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    let currentQText = '';
    let currentOptions: Record<string, string> = {};
    let currentKey = '';
    let currentExplanation = '';
    let currentPoints = 10;
    let currentCognitiveLevel: any = 'THONG_HIEU';

    const commitCurrent = () => {
      if (currentQText.length > 5) {
        const hasOptions = Object.keys(currentOptions).length >= 2;
        questions.push({
          id: `WORD_${Date.now().toString(36)}_${questions.length + 1}`,
          round_name: 'Đề thi nhập từ Word (.docx)',
          round_type: hasOptions ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER',
          category: 'Nhập khẩu từ Microsoft Word',
          question_text: currentQText,
          options: currentOptions,
          correct_key: currentKey || (hasOptions ? 'A' : ''),
          explanation: currentExplanation || 'Nhập từ biểu mẫu soạn đề Word',
          time_limit: 30,
          points: currentPoints,
          stage: 'BAN_KET_1',
          cognitive_level: currentCognitiveLevel,
          digital_competency_domain: 'MIEN_1',
          approval_status: 'APPROVED',
          created_by: 'Word Document Parser',
          created_at: Date.now()
        });
      }
      currentQText = '';
      currentOptions = {};
      currentKey = '';
      currentExplanation = '';
      currentPoints = 10;
      currentCognitiveLevel = 'THONG_HIEU';
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Question start marker: e.g. "Câu 1:", "Câu 1.", "1.", "Question 1:"
      const qMatch = line.match(/^(?:câu|question|\b)\s*(\d+)[\.\:\)]\s*(.*)/i);
      if (qMatch && !line.match(/^[A-D][\.\:\)]/)) {
        commitCurrent();
        currentQText = qMatch[2] || line;

        // Check if points are in brackets, e.g. "(20 điểm)" or "(10đ)"
        const ptsMatch = line.match(/\((\d+)\s*(?:điểm|đ|pts)\)/i);
        if (ptsMatch) {
          currentPoints = parseInt(ptsMatch[1], 10);
        }
        continue;
      }

      // Option markers: e.g. "A. Nội dung", "B)", "*C." (indicated correct answer with asterisk)
      const optMatch = line.match(/^(\*?)\s*([A-F])[\.\:\)]\s*(.*)/i);
      if (optMatch) {
        const isMarkedCorrect = optMatch[1] === '*';
        const key = optMatch[2].toUpperCase();
        const content = optMatch[3].trim();
        currentOptions[key] = content;
        if (isMarkedCorrect) {
          currentKey = key;
        }
        continue;
      }

      // Explicit Answer line: e.g. "Đáp án: B" or "Key: C"
      const ansMatch = line.match(/^(?:đáp án|dap an|answer|key)[\.\:\s]+([A-F]|.+)/i);
      if (ansMatch) {
        const rawKey = ansMatch[1].trim();
        if (['A', 'B', 'C', 'D', 'E', 'F'].includes(rawKey.toUpperCase())) {
          currentKey = rawKey.toUpperCase();
        } else {
          currentKey = rawKey;
        }
        continue;
      }

      // Explanation line: e.g. "Lời giải:", "Giải thích:", "Hướng dẫn:"
      const expMatch = line.match(/^(?:lời giải|loi giai|giải thích|giai thich|hướng dẫn|huong dan|explanation)[\.\:\s]+(.*)/i);
      if (expMatch) {
        currentExplanation = expMatch[1].trim();
        continue;
      }

      // If already inside question text, append line
      if (currentQText && Object.keys(currentOptions).length === 0) {
        currentQText += ' ' + line;
      }
    }

    commitCurrent();

    if (questions.length === 0) {
      warnings.push('Không nhận diện được câu hỏi nào từ văn bản. Vui lòng đảm bảo câu hỏi bắt đầu bằng "Câu 1:", "Câu 2:" và các phương án bắt đầu bằng "A.", "B.", "C.", "D."');
    }

    return { questions, warnings };
  },

  /**
   * Exports an official exam paper to a Word-compatible document (.doc / .docx)
   * with high-standard typography, Ministry exam headers, and a separate Answer Key sheet.
   */
  exportExamToWord(
    questions: QuestionItem[],
    examTitle: string = 'ĐỀ THI CUỘC THI BEYOND THE INTERNET 2026',
    includeAnswerKey: boolean = true
  ): void {
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 10), 0);
    const dateStr = new Date().toLocaleDateString('vi-VN');

    let htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${examTitle}</title>
  <style>
    body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.4; color: #000; margin: 1.5in 1in; }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .header-table td { vertical-align: top; font-size: 11pt; }
    .title-box { text-align: center; margin: 25px 0 20px 0; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 10px 0; }
    .title-box h1 { font-size: 16pt; font-weight: bold; margin: 0 0 5px 0; text-transform: uppercase; }
    .candidate-info { width: 100%; border: 1px dashed #444; padding: 10px; margin-bottom: 25px; font-size: 11pt; }
    .q-item { margin-bottom: 16px; page-break-inside: avoid; }
    .q-text { font-weight: bold; margin-bottom: 6px; }
    .q-pts { font-weight: normal; color: #555; font-style: italic; }
    .opt-grid { margin-left: 20px; display: table; width: 100%; }
    .opt-row { display: table-row; }
    .opt-cell { display: table-cell; width: 50%; padding-bottom: 4px; }
    .page-break { page-break-before: always; }
    .key-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .key-table th, .key-table td { border: 1px solid #000; padding: 6px 10px; font-size: 11pt; text-align: left; }
    .key-table th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
  </style>
</head>
<body>
  <!-- Header Table -->
  <table class="header-table">
    <tr>
      <td style="width: 50%; text-align: center;">
        <strong>BỘ GIÁO DỤC VÀ ĐÀO TẠO</strong><br>
        <strong>BAN TỔ CHỨC CUỘC THI BTI 2026</strong><br>
        <span style="font-size: 9pt;">Số: ...../BTC-BTI2026</span>
      </td>
      <td style="width: 50%; text-align: center;">
        <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>
        <strong>Độc lập - Tự do - Hạnh phúc</strong><br>
        <span style="font-size: 10pt;">------------------------</span>
      </td>
    </tr>
  </table>

  <!-- Exam Title -->
  <div class="title-box">
    <h1>${examTitle}</h1>
    <div><strong>Khung năng lực số người học (Thông tư 02/2025/TT-BGDĐT)</strong></div>
    <div style="font-size: 11pt; margin-top: 4px;">Thời gian làm bài: 60 phút | Tổng số câu: ${questions.length} câu (${totalPoints} điểm)</div>
  </div>

  <!-- Candidate Info -->
  <div class="candidate-info">
    Họ và tên thí sinh: ............................................................................ Lớp / SBD: .....................................<br>
    Trường: .............................................................................................. Ngày thi: ${dateStr}
  </div>

  <!-- Questions Body -->
  <div class="questions-list">
`;

    questions.forEach((q, idx) => {
      const isMc = q.options && Object.keys(q.options).length >= 2;
      htmlContent += `
    <div class="q-item">
      <div class="q-text">
        Câu ${idx + 1}: ${q.question_text} <span class="q-pts">(${q.points || 10} điểm)</span>
      </div>
      `;

      if (isMc) {
        htmlContent += `<div class="opt-grid">`;
        const keys = Object.keys(q.options);
        for (let i = 0; i < keys.length; i += 2) {
          const k1 = keys[i];
          const k2 = keys[i + 1];
          htmlContent += `<div class="opt-row">`;
          htmlContent += `<div class="opt-cell"><strong>${k1}.</strong> ${q.options[k1]}</div>`;
          if (k2) {
            htmlContent += `<div class="opt-cell"><strong>${k2}.</strong> ${q.options[k2]}</div>`;
          } else {
            htmlContent += `<div class="opt-cell"></div>`;
          }
          htmlContent += `</div>`;
        }
        htmlContent += `</div>`;
      } else {
        htmlContent += `<div style="margin-left: 20px; font-style: italic; color: #555;">(Thí sinh ghi câu trả lời ngắn vào phiếu làm bài)</div>`;
      }

      htmlContent += `</div>`;
    });

    htmlContent += `
  </div>
  <div style="text-align: center; margin-top: 30px; font-style: italic;">--- HẾT ---<br><small>Cán bộ coi thi không giải thích gì thêm.</small></div>
`;

    // Attached Answer Key Sheet (on separate page)
    if (includeAnswerKey) {
      htmlContent += `
  <div class="page-break"></div>
  <div style="text-align: center; margin-bottom: 20px;">
    <h2 style="font-size: 15pt; text-transform: uppercase; margin: 0 0 5px 0;">ĐÁP ÁN & MA TRẬN KHẢO THÍ CHÍNH THỨC</h2>
    <div style="font-size: 11pt;">(Kèm theo đề thi: ${examTitle})</div>
  </div>

  <table class="key-table">
    <thead>
      <tr>
        <th style="width: 8%;">Câu</th>
        <th style="width: 15%;">Đáp án chuẩn</th>
        <th style="width: 10%;">Điểm</th>
        <th style="width: 17%;">Miền năng lực</th>
        <th style="width: 15%;">Mức độ</th>
        <th style="width: 35%;">Hướng dẫn giải & Căn cứ pháp lý</th>
      </tr>
    </thead>
    <tbody>
`;

      questions.forEach((q, idx) => {
        htmlContent += `
      <tr>
        <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
        <td style="font-weight: bold; color: #b91c1c; text-align: center;">${q.correct_key}</td>
        <td style="text-align: center;">${q.points || 10}đ</td>
        <td>${q.digital_competency_domain || 'MIEN_1'}</td>
        <td>${q.cognitive_level || 'THONG_HIEU'}</td>
        <td>${q.explanation || ''} ${q.legal_reference ? `<br><small style="color: #666;">Căn cứ: ${q.legal_reference}</small>` : ''}</td>
      </tr>
`;
      });

      htmlContent += `
    </tbody>
  </table>
`;
    }

    htmlContent += `
</body>
</html>
`;

    // Trigger download of Word (.doc) file
    const blob = new Blob(['\uFEFF' + htmlContent], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${examTitle.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
