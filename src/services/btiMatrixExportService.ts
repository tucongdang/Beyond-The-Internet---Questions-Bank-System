import * as XLSX from 'xlsx';
import { QuestionItem, DigitalCompetencyDomainKey, CognitiveLevel } from '../types';
import { DIGITAL_COMPETENCY_DOMAINS } from '../data/digitalCompetencyData';

export interface BtiMatrixReportOptions {
  questions: QuestionItem[];
  targetPerCell: number;
  stageFilter?: string;
  notes?: string;
  reporterName?: string;
}

/**
 * Generate and download an Excel workbook containing 4 detailed sheets
 * for BTI 2026 Competency Coverage Progress Report
 */
export const exportBtiMatrixToExcel = (options: BtiMatrixReportOptions) => {
  const { questions, targetPerCell, stageFilter = 'ALL', notes = '', reporterName = 'Ban Chuyên Môn BTI 2026' } = options;
  const domainKeys: DigitalCompetencyDomainKey[] = ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'];
  const cognitiveLevels: CognitiveLevel[] = ['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'];

  const filteredQuestions = stageFilter === 'ALL' 
    ? questions 
    : questions.filter(q => q.stage === stageFilter || q.round_name?.includes(stageFilter));

  // 1. Calculate Grid Stats
  const grid: Record<DigitalCompetencyDomainKey, Record<CognitiveLevel, number>> = {
    MIEN_1: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
    MIEN_2: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
    MIEN_3: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
    MIEN_4: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
    MIEN_5: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
    MIEN_6: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
  };

  const domainTotals: Record<DigitalCompetencyDomainKey, number> = {
    MIEN_1: 0, MIEN_2: 0, MIEN_3: 0, MIEN_4: 0, MIEN_5: 0, MIEN_6: 0
  };

  const levelTotals: Record<CognitiveLevel, number> = {
    NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0
  };

  let emptyCells = 0;
  let metTargetCells = 0;

  filteredQuestions.forEach(q => {
    let dom = q.digital_competency_domain || 'MIEN_1';
    let lvl = q.cognitive_level || 'THONG_HIEU';

    if (grid[dom] && grid[dom][lvl] !== undefined) {
      grid[dom][lvl]++;
      domainTotals[dom]++;
      levelTotals[lvl]++;
    }
  });

  domainKeys.forEach(d => {
    cognitiveLevels.forEach(l => {
      const cnt = grid[d][l];
      if (cnt === 0) emptyCells++;
      if (cnt >= targetPerCell) metTargetCells++;
    });
  });

  const totalCells = 24;
  const coveragePercent = Math.round(((totalCells - emptyCells) / totalCells) * 100);

  // SHEET 1: Summary Matrix (Tong_Quan_Ma_Tran)
  const sheet1Data: any[] = [
    ['BÁO CÁO TIẾN ĐỘ SOẠN ĐỀ & MA TRẬN ĐỘ PHỦ KHUNG NĂNG LỰC BTI 2026'],
    ['Căn cứ Thông tư 02/2025/TT-BGDĐT ban hành Khung năng lực số cho người học'],
    [`Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`],
    [`Người xuất báo cáo: ${reporterName}`],
    [`Giai đoạn / Vòng thi: ${stageFilter}`],
    [],
    ['=== CHỈ SỐ TỔNG QUAN MA TRẬN ==='],
    ['Tổng số câu hỏi trong ngân hàng:', filteredQuestions.length],
    ['Chỉ tiêu tối thiểu mỗi ô:', `${targetPerCell} câu/ô`],
    ['Số ô đạt chỉ tiêu:', `${metTargetCells} / 24 ô`],
    ['Số vùng trắng (0 câu):', `${emptyCells} ô`],
    ['Tỷ lệ phủ khung năng lực:', `${coveragePercent}%`],
    [],
    ['=== MA TRẬN PHỦ 6 MIỀN NĂNG LỰC SỐ x 4 MỨC ĐỘ NHẬN THỨC ==='],
    ['Mã Miền', 'Tên Miền Năng Lực Số', 'Nhận Biết (B1-B2)', 'Thông Hiểu (B3-B4)', 'Vận Dụng (B5-B6)', 'Vận Dụng Cao (B7-B8)', 'Tổng Số Câu', 'Đánh Giá Độ Phủ']
  ];

  domainKeys.forEach(dKey => {
    const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
    const row = grid[dKey];
    const total = domainTotals[dKey];
    const emptyInDomain = cognitiveLevels.filter(l => row[l] === 0).length;
    const statusText = emptyInDomain === 0 ? '✓ Đã phủ 100%' : `⚠️ Thiếu ${emptyInDomain} mức độ`;

    sheet1Data.push([
      dom.code,
      dom.name,
      row.NHAN_BIET,
      row.THONG_HIEU,
      row.VAN_DUNG,
      row.VAN_DUNG_CAO,
      total,
      statusText
    ]);
  });

  sheet1Data.push([
    'TỔNG CỘNG',
    'Toàn bộ ngân hàng câu hỏi',
    levelTotals.NHAN_BIET,
    levelTotals.THONG_HIEU,
    levelTotals.VAN_DUNG,
    levelTotals.VAN_DUNG_CAO,
    filteredQuestions.length,
    `${coveragePercent}% Coverage`
  ]);

  if (notes) {
    sheet1Data.push([]);
    sheet1Data.push(['Ghi chú của Ban Tổ Chức:', notes]);
  }

  // SHEET 2: 24 Sub-competencies Breakdown (Chi_Tiet_24_Tieu_Chi)
  const sheet2Data: any[] = [
    ['CHI TIẾT ĐỘ PHỦ 24 TIÊU CHÍ NĂNG LỰC SỐ THÀNH PHẦN (TT 02/2025/TT-BGDĐT)'],
    [],
    ['Mã Tiêu Chí', 'Miền Năng Lực', 'Tên Tiêu Chí Thành Phần', 'Nhận Biết', 'Thông Hiểu', 'Vận Dụng', 'Vận Dụng Cao', 'Tổng Số Câu', 'Trạng Thái']
  ];

  domainKeys.forEach(dKey => {
    const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
    if (dom && dom.subCompetencies) {
      dom.subCompetencies.forEach(sub => {
        const subQs = filteredQuestions.filter(q => q.digital_sub_competency === sub.code || q.digital_competency_domain === dKey);
        let nb = 0, th = 0, vd = 0, vdc = 0;
        subQs.forEach(q => {
          const l = q.cognitive_level || 'THONG_HIEU';
          if (l === 'NHAN_BIET') nb++;
          else if (l === 'THONG_HIEU') th++;
          else if (l === 'VAN_DUNG') vd++;
          else if (l === 'VAN_DUNG_CAO') vdc++;
        });
        const sum = subQs.length;
        const status = sum >= targetPerCell ? '✓ Đạt chuẩn' : sum > 0 ? '⚠️ Cần bổ sung' : '❌ Vùng trắng';

        sheet2Data.push([
          sub.code,
          dom.name,
          sub.name,
          nb,
          th,
          vd,
          vdc,
          sum,
          status
        ]);
      });
    }
  });

  // SHEET 3: Mapped Questions List (Danh_Sach_Cau_Hoi)
  const sheet3Data: any[] = [
    ['DANH SÁCH CÂU HỎI ĐÃ ÁNH XẠ VÀO KHUNG BTI 2026'],
    [],
    ['Mã Câu Hỏi', 'Nội Dung Câu Hỏi', 'Đáp Án Đúng', 'Miền Năng Lực', 'Tiêu Chí Thành Phần', 'Mức Độ Nhận Thức', 'Giai Đoạn / Phần Thi', 'Độ Khó']
  ];

  filteredQuestions.forEach(q => {
    const answerText = (q as any).correct_answer || (q.options && q.options[q.correct_key]) || q.correct_key || '';
    const diff = (q as any).difficulty || 'MEDIUM';

    sheet3Data.push([
      q.id,
      q.question_text || '',
      answerText,
      q.digital_competency_domain || 'Unassigned',
      q.digital_sub_competency || 'Unassigned',
      q.cognitive_level || 'THONG_HIEU',
      q.round_name || q.stage || 'N/A',
      diff
    ]);
  });

  // SHEET 4: Gap Analysis (Canh_Bao_Lo_Hong)
  const sheet4Data: any[] = [
    ['DANH SÁCH VÙNG TRẮNG CẦN BỔ SUNG CÂU HỎI (GAP ANALYSIS REPORT)'],
    ['Phục vụ công tác chỉ đạo biên soạn đề bổ sung cho Ban Chuyên Môn BTI 2026'],
    [],
    ['STT', 'Mã Miền', 'Tên Miền Năng Lực', 'Mức Độ Nhận Thức', 'Số Câu Hiện Có', 'Số Câu Cần Bổ Sung', 'Gợi Ý Hướng Biên Soạn AI']
  ];

  let gapIndex = 1;
  domainKeys.forEach(dKey => {
    const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
    cognitiveLevels.forEach(lvl => {
      const cnt = grid[dKey][lvl];
      if (cnt < targetPerCell) {
        const needed = targetPerCell - cnt;
        const promptAdvice = `Tạo ${needed} câu hỏi tình huống thực tế thuộc ${dom.name} ở mức độ ${lvl} cho thí sinh BTI 2026`;
        sheet4Data.push([
          gapIndex++,
          dom.code,
          dom.name,
          lvl,
          cnt,
          needed,
          promptAdvice
        ]);
      }
    });
  });

  // Create Workbook
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  const ws4 = XLSX.utils.aoa_to_sheet(sheet4Data);

  // Set column widths
  ws1['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 20 }];
  ws2['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 18 }];
  ws3['!cols'] = [{ wch: 14 }, { wch: 60 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 12 }];
  ws4['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 30 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 60 }];

  XLSX.utils.book_append_sheet(wb, ws1, 'Tong_Quan_Ma_Tran');
  XLSX.utils.book_append_sheet(wb, ws2, 'Chi_Tiet_24_Tieu_Chi');
  XLSX.utils.book_append_sheet(wb, ws3, 'Danh_Sach_Cau_Hoi');
  XLSX.utils.book_append_sheet(wb, ws4, 'Canh_Bao_Lo_Hong');

  const fileName = `BTI2026_BaoCao_MaTran_DoPhu_NangLuc_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
