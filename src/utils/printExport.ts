import { QuestionItem } from '../types';
import { BTI_ROUND_GROUPS, COGNITIVE_LEVELS, DIGITAL_COMPETENCY_DOMAINS } from '../data/digitalCompetencyData';

export const exportQuestionsToPdf = (questions: QuestionItem[], title: string = 'Ngân Hàng Câu Hỏi') => {
  // Create an iframe to hold the print content
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  // Generate HTML content for the questions
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body {
          font-family: 'Times New Roman', Times, serif;
          color: #000;
          line-height: 1.5;
          margin: 0;
          padding: 0;
          font-size: 12pt;
        }
        h1 { text-align: center; font-size: 18pt; margin-bottom: 5px; text-transform: uppercase; }
        .meta-info { text-align: center; font-size: 11pt; margin-bottom: 30px; font-style: italic; }
        .question-block { page-break-inside: avoid; margin-bottom: 20px; }
        .question-header { font-size: 10pt; color: #555; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 8px; }
        .question-text { font-weight: bold; margin-bottom: 10px; }
        .options-list { list-style-type: none; padding-left: 20px; margin: 0 0 10px 0; }
        .options-list li { margin-bottom: 5px; }
        .answer-box { background-color: #f9f9f9; border: 1px solid #ddd; padding: 10px; font-size: 11pt; }
        .answer-key { font-weight: bold; color: #d32f2f; }
        .true-false-table { width: 100%; border-collapse: collapse; margin-top: 5px; margin-bottom: 10px; }
        .true-false-table th, .true-false-table td { border: 1px solid #aaa; padding: 5px; text-align: left; }
        .true-false-table th { background-color: #eee; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta-info">Xuất ngày: ${new Date().toLocaleDateString('vi-VN')} • Số lượng: ${questions.length} câu hỏi</div>
  `;

  questions.forEach((q, index) => {
    const roundName = BTI_ROUND_GROUPS[q.round_format as keyof typeof BTI_ROUND_GROUPS]?.name || q.round_format;
    const cogLevel = COGNITIVE_LEVELS[q.cognitive_level as keyof typeof COGNITIVE_LEVELS]?.name || q.cognitive_level;
    
    htmlContent += `
      <div class="question-block">
        <div class="question-header">
          <strong>Câu ${index + 1}</strong> [ID: ${q.id}] | ${roundName} | ${cogLevel}
        </div>
        <div class="question-text">
          ${q.question_text}
        </div>
    `;

    // Render options based on type
    if (q.round_type === 'MULTIPLE_CHOICE' || q.round_format === 'BGD_MULTIPLE_CHOICE' || q.round_format === 'KD_TRAC_NGHIEM_ABCD' || q.round_format === 'VD_AID_4') {
      const opts = q.options as Record<string, string>;
      if (opts) {
        htmlContent += `<ul class="options-list">`;
        ['A', 'B', 'C', 'D'].forEach(k => {
          if (opts[k]) {
            htmlContent += `<li><strong>${k}.</strong> ${opts[k]}</li>`;
          }
        });
        htmlContent += `</ul>`;
      }
    } else if (q.round_type === 'TRUE_FALSE_4' || q.round_format === 'BGD_TRUE_FALSE_4') {
      const opts = q.options as Record<string, any>;
      if (opts) {
        htmlContent += `
          <table class="true-false-table">
            <thead>
              <tr>
                <th width="80%">Mệnh đề</th>
                <th width="20%">Đúng/Sai</th>
              </tr>
            </thead>
            <tbody>
        `;
        ['a', 'b', 'c', 'd'].forEach(k => {
          if (opts[k]) {
            const text = typeof opts[k] === 'string' ? opts[k] : opts[k].text;
            htmlContent += `
              <tr>
                <td><strong>${k})</strong> ${text}</td>
                <td></td>
              </tr>
            `;
          }
        });
        htmlContent += `</tbody></table>`;
      }
    } else if (q.round_type === 'VCNV' || q.round_format === 'VCNV_HANG_NGANG') {
      htmlContent += `<div style="margin-bottom:10px; font-style:italic;">(Thể thức: Vượt chướng ngại vật)</div>`;
    }

    htmlContent += `
        <div class="answer-box">
          <div class="answer-key">Đáp án: ${q.correct_key || 'Chưa có'}</div>
          ${q.explanation ? `<div style="margin-top: 5px;"><strong>Giải thích:</strong> ${q.explanation}</div>` : ''}
          ${q.legal_reference ? `<div style="margin-top: 5px; font-size: 10pt; color: #444;"><em>Căn cứ: ${q.legal_reference}</em></div>` : ''}
        </div>
      </div>
    `;
  });

  htmlContent += `
    </body>
    </html>
  `;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Wait for content to load and trigger print
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    // Clean up
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);
};
