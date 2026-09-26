import * as XLSX from 'xlsx';
import { 
  QuestionItem, 
  DigitalCompetencyDomainKey, 
  CognitiveLevel, 
  ApprovalStatus,
  BtiRoundGroupKey,
  CompetitionStage
} from '../types';
import { 
  DIGITAL_COMPETENCY_DOMAINS, 
  COGNITIVE_LEVELS,
  BTI_ROUND_GROUPS,
  COMPETITION_STAGES
} from '../data/digitalCompetencyData';

export interface BtiMatrixReportOptions {
  questions: QuestionItem[];
  targetPerCell?: number;
  stageFilter?: string;
  statusFilter?: 'ALL' | ApprovalStatus;
  dimension?: 'DOMAIN_X_LEVEL' | 'CATEGORY_X_LEVEL' | 'ROUND_X_LEVEL' | 'STAGE_X_LEVEL' | 'ALL';
  notes?: string;
  reporterName?: string;
  reportTitle?: string;
}

/**
 * Generate and download a comprehensive, professional Excel workbook (.xlsx)
 * for Question Bank Coverage Matrix & Gap Analysis
 */
export const exportBtiMatrixToExcel = (options: BtiMatrixReportOptions): { success: boolean; filename: string } => {
  const { 
    questions, 
    targetPerCell = 3, 
    stageFilter = 'ALL', 
    statusFilter = 'ALL',
    notes = '', 
    reporterName = 'Ban Chuyên Môn BTI 2026',
    reportTitle = 'BÁO CÁO TIẾN ĐỘ & MA TRẬN ĐỘ PHỦ NGÂN HÀNG CÂU HỎI BTI 2026'
  } = options;

  const domainKeys: DigitalCompetencyDomainKey[] = ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'];
  const cognitiveLevels: CognitiveLevel[] = ['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'];

  // 1. Filter Questions
  let filteredQuestions = questions;
  if (stageFilter !== 'ALL') {
    filteredQuestions = filteredQuestions.filter(q => q.stage === stageFilter || q.round_name?.includes(stageFilter));
  }
  if (statusFilter !== 'ALL') {
    filteredQuestions = filteredQuestions.filter(q => q.approval_status === statusFilter);
  }

  const totalFilteredCount = filteredQuestions.length;
  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN');
  const timeStr = now.toLocaleTimeString('vi-VN');

  // 2. Compute 6 Domains x 4 Levels Grid Stats
  const domainGrid: Record<DigitalCompetencyDomainKey, Record<CognitiveLevel, QuestionItem[]>> = {
    MIEN_1: { NHAN_BIET: [], THONG_HIEU: [], VAN_DUNG: [], VAN_DUNG_CAO: [] },
    MIEN_2: { NHAN_BIET: [], THONG_HIEU: [], VAN_DUNG: [], VAN_DUNG_CAO: [] },
    MIEN_3: { NHAN_BIET: [], THONG_HIEU: [], VAN_DUNG: [], VAN_DUNG_CAO: [] },
    MIEN_4: { NHAN_BIET: [], THONG_HIEU: [], VAN_DUNG: [], VAN_DUNG_CAO: [] },
    MIEN_5: { NHAN_BIET: [], THONG_HIEU: [], VAN_DUNG: [], VAN_DUNG_CAO: [] },
    MIEN_6: { NHAN_BIET: [], THONG_HIEU: [], VAN_DUNG: [], VAN_DUNG_CAO: [] },
  };

  const domainTotals: Record<DigitalCompetencyDomainKey, number> = {
    MIEN_1: 0, MIEN_2: 0, MIEN_3: 0, MIEN_4: 0, MIEN_5: 0, MIEN_6: 0
  };

  const levelTotals: Record<CognitiveLevel, number> = {
    NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0
  };

  filteredQuestions.forEach(q => {
    let dom = q.digital_competency_domain;
    if (!dom || !domainGrid[dom]) {
      if (q.category?.includes('Miền 1') || q.category?.includes('Miền I')) dom = 'MIEN_1';
      else if (q.category?.includes('Miền 2') || q.category?.includes('Miền II')) dom = 'MIEN_2';
      else if (q.category?.includes('Miền 3') || q.category?.includes('Miền III')) dom = 'MIEN_3';
      else if (q.category?.includes('Miền 4') || q.category?.includes('Miền IV')) dom = 'MIEN_4';
      else if (q.category?.includes('Miền 5') || q.category?.includes('Miền V')) dom = 'MIEN_5';
      else if (q.category?.includes('Miền 6') || q.category?.includes('Miền VI')) dom = 'MIEN_6';
      else dom = 'MIEN_1';
    }

    let lvl = q.cognitive_level;
    if (!lvl || !levelTotals[lvl]) {
      if ((q as any).difficulty === 'EASY') lvl = 'NHAN_BIET';
      else if ((q as any).difficulty === 'MEDIUM') lvl = 'THONG_HIEU';
      else if ((q as any).difficulty === 'HARD') lvl = 'VAN_DUNG';
      else lvl = 'THONG_HIEU';
    }

    if (domainGrid[dom] && domainGrid[dom][lvl]) {
      domainGrid[dom][lvl].push(q);
      domainTotals[dom]++;
      levelTotals[lvl]++;
    }
  });

  let emptyDomainCells = 0;
  let metTargetDomainCells = 0;
  let deficitDomainCells = 0;

  domainKeys.forEach(d => {
    cognitiveLevels.forEach(l => {
      const cnt = domainGrid[d][l].length;
      if (cnt === 0) emptyDomainCells++;
      else if (cnt >= targetPerCell) metTargetDomainCells++;
      else deficitDomainCells++;
    });
  });

  const totalDomainCells = 24;
  const coveragePercent = Math.round(((totalDomainCells - emptyDomainCells) / totalDomainCells) * 100);
  const targetMetPercent = Math.round((metTargetDomainCells / totalDomainCells) * 100);

  // ==========================================
  // SHEET 1: TỔNG QUAN KPI & MA TRẬN 6 MIỀN
  // ==========================================
  const sheet1Data: any[] = [
    [reportTitle],
    ['Căn cứ Thông tư 02/2025/TT-BGDĐT ban hành Khung năng lực số cho người học'],
    [`Thời điểm xuất: ${dateStr} ${timeStr}`, '', `Người lập báo cáo: ${reporterName}`],
    [`Phạm vi lọc: Giai đoạn [${stageFilter}] | Trạng thái phê duyệt [${statusFilter === 'ALL' ? 'Tất cả' : statusFilter}]`],
    [],
    ['=== I. CHỈ SỐ KPI ĐỘ PHỦ TỔNG QUAN ==='],
    ['Chỉ số KPI', 'Giá trị', 'Đơn vị', 'Đánh giá'],
    ['Tổng số câu hỏi trong ngân hàng', totalFilteredCount, 'câu hỏi', totalFilteredCount >= 50 ? '✓ Đủ quy mô' : '⚠️ Cần mở rộng'],
    ['Chỉ tiêu tối thiểu khuyến nghị', targetPerCell, 'câu / ô ma trận', 'Chuẩn kiểm định'],
    ['Tỷ lệ lấp đầy ma trận (Coverage)', `${coveragePercent}%`, `${totalDomainCells - emptyDomainCells} / ${totalDomainCells} ô có câu`, coveragePercent >= 80 ? '✓ Độ phủ tốt' : '⚠️ Cần lấp đầy'],
    ['Số ô đạt chỉ tiêu chuẩn', metTargetDomainCells, `ô (${targetMetPercent}%)`, metTargetDomainCells >= 18 ? '✓ Tối ưu' : '⚠️ Cần bổ sung'],
    ['Số ô thiếu câu (< mục tiêu)', deficitDomainCells, 'ô', 'Cần tăng cường'],
    ['Số vùng trắng (0 câu hỏi)', emptyDomainCells, 'ô', emptyDomainCells === 0 ? '✓ Không còn vùng trắng' : '❌ Cần soạn khẩn cấp'],
    [],
    ['=== II. MA TRẬN ĐỘ PHỦ 6 MIỀN NĂNG LỰC SỐ × 4 MỨC ĐỘ NHẬN THỨC (HEATMAP MATRIX) ==='],
    [
      'Mã Miền',
      'Tên Miền Năng Lực Số (TT 02/2025)',
      'Nhận Biết (B1-B2)',
      'Thông Hiểu (B3-B4)',
      'Vận Dụng (B5-B6)',
      'Vận Dụng Cao (B7-B8)',
      'Tổng Số Câu',
      'Tỷ Lệ %',
      'Đánh Giá Trạng Thái'
    ]
  ];

  domainKeys.forEach(dKey => {
    const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
    const row = domainGrid[dKey];
    const total = domainTotals[dKey];
    const pct = totalFilteredCount > 0 ? ((total / totalFilteredCount) * 100).toFixed(1) + '%' : '0%';
    const emptyInDomain = cognitiveLevels.filter(l => row[l].length === 0).length;
    const statusText = emptyInDomain === 0 
      ? '✓ Đã phủ 4/4 mức độ' 
      : `❌ Còn ${emptyInDomain} vùng trắng`;

    sheet1Data.push([
      dom.code,
      dom.name,
      row.NHAN_BIET.length,
      row.THONG_HIEU.length,
      row.VAN_DUNG.length,
      row.VAN_DUNG_CAO.length,
      total,
      pct,
      statusText
    ]);
  });

  sheet1Data.push([
    'TỔNG THEO MỨC ĐỘ',
    'Toàn bộ ngân hàng câu hỏi',
    levelTotals.NHAN_BIET,
    levelTotals.THONG_HIEU,
    levelTotals.VAN_DUNG,
    levelTotals.VAN_DUNG_CAO,
    totalFilteredCount,
    '100%',
    `${coveragePercent}% Coverage`
  ]);

  if (notes) {
    sheet1Data.push([]);
    sheet1Data.push(['Ghi chú & Chỉ đạo của Ban Tổ Chức:', notes]);
  }

  // ==========================================
  // SHEET 2: MA TRẬN THEO CHUYÊN ĐỀ / DANH MỤC
  // ==========================================
  const catMap: Record<string, Record<CognitiveLevel, number>> = {};
  filteredQuestions.forEach(q => {
    const cat = (q.category || 'Chưa phân loại').trim();
    if (!catMap[cat]) {
      catMap[cat] = { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 };
    }
    const lvl = q.cognitive_level || 'THONG_HIEU';
    if (catMap[cat][lvl] !== undefined) {
      catMap[cat][lvl]++;
    }
  });

  const sortedCategories = Object.keys(catMap).sort((a, b) => {
    const totalA = Object.values(catMap[a]).reduce((s, v) => s + v, 0);
    const totalB = Object.values(catMap[b]).reduce((s, v) => s + v, 0);
    return totalB - totalA;
  });

  const sheet2Data: any[] = [
    ['MA TRẬN PHÂN PHỐI CÂU HỎI THEO CHUYÊN ĐỀ / DANH MỤC × 4 MỨC ĐỘ NHẬN THỨC'],
    [`Thời điểm xuất: ${dateStr} ${timeStr}`],
    [],
    ['STT', 'Chuyên Đề / Danh Mục Câu Hỏi', 'Nhận Biết', 'Thông Hiểu', 'Vận Dụng', 'Vận Dụng Cao', 'Tổng Số Câu', 'Tỷ Lệ %', 'Trạng Thái']
  ];

  sortedCategories.forEach((cat, idx) => {
    const row = catMap[cat];
    const sum = row.NHAN_BIET + row.THONG_HIEU + row.VAN_DUNG + row.VAN_DUNG_CAO;
    const pct = totalFilteredCount > 0 ? ((sum / totalFilteredCount) * 100).toFixed(1) + '%' : '0%';
    const emptyCount = cognitiveLevels.filter(l => row[l] === 0).length;
    const evalText = emptyCount === 0 ? '✓ Đủ 4 mức độ' : `⚠️ Khuyết ${emptyCount} mức độ`;

    sheet2Data.push([
      idx + 1,
      cat,
      row.NHAN_BIET,
      row.THONG_HIEU,
      row.VAN_DUNG,
      row.VAN_DUNG_CAO,
      sum,
      pct,
      evalText
    ]);
  });

  // ==========================================
  // SHEET 3: MA TRẬN PHẦN THI GAMESHOW BTI
  // ==========================================
  const roundKeys: BtiRoundGroupKey[] = ['KHOI_DONG', 'VCNV', 'TANG_TOC', 'VE_DICH', 'VONG_LOAI'];
  const roundGrid: Record<BtiRoundGroupKey, Record<CognitiveLevel, number>> = {
    KHOI_DONG: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
    VCNV: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
    TANG_TOC: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
    VE_DICH: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
    VONG_LOAI: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
  };

  filteredQuestions.forEach(q => {
    const grp: BtiRoundGroupKey = (q.round_group as BtiRoundGroupKey) || (
      q.round_name?.includes('Khởi động') ? 'KHOI_DONG' :
      q.round_name?.includes('Vượt') ? 'VCNV' :
      q.round_name?.includes('Tăng') ? 'TANG_TOC' :
      q.round_name?.includes('Về đích') ? 'VE_DICH' :
      q.round_name?.includes('Vòng loại') ? 'VONG_LOAI' : 'KHOI_DONG'
    );
    const lvl = q.cognitive_level || 'THONG_HIEU';
    if (roundGrid[grp] && roundGrid[grp][lvl] !== undefined) {
      roundGrid[grp][lvl]++;
    }
  });

  const sheet3Data: any[] = [
    ['MA TRẬN PHÂN BỔ CÂU HỎI THEO PHẦN THI GAMESHOW BTI × 4 MỨC ĐỘ NHẬN THỨC'],
    [`Thời điểm xuất: ${dateStr} ${timeStr}`],
    [],
    ['Mã Phần Thi', 'Tên Phần Thi Gameshow', 'Nhận Biết', 'Thông Hiểu', 'Vận Dụng', 'Vận Dụng Cao', 'Tổng Số Câu', 'Tỷ Lệ %', 'Mô Tả Quy Cách']
  ];

  roundKeys.forEach(rKey => {
    const rInfo = BTI_ROUND_GROUPS[rKey];
    const row = roundGrid[rKey];
    const sum = row.NHAN_BIET + row.THONG_HIEU + row.VAN_DUNG + row.VAN_DUNG_CAO;
    const pct = totalFilteredCount > 0 ? ((sum / totalFilteredCount) * 100).toFixed(1) + '%' : '0%';

    sheet3Data.push([
      rKey,
      rInfo?.name || rKey,
      row.NHAN_BIET,
      row.THONG_HIEU,
      row.VAN_DUNG,
      row.VAN_DUNG_CAO,
      sum,
      pct,
      rInfo?.description || ''
    ]);
  });

  // ==========================================
  // SHEET 4: 24 TIÊU CHÍ NĂNG LỰC SỐ THÀNH PHẦN
  // ==========================================
  const sheet4Data: any[] = [
    ['BẢNG THỐNG KÊ CHI TIẾT 24 TIÊU CHÍ NĂNG LỰC SỐ THÀNH PHẦN (TT 02/2025/TT-BGDĐT)'],
    [`Thời điểm xuất: ${dateStr} ${timeStr}`],
    [],
    [
      'Mã Tiêu Chí', 
      'Miền Năng Lực', 
      'Tên Tiêu Chí Thành Phần', 
      'Nhận Biết', 
      'Thông Hiểu', 
      'Vận Dụng', 
      'Vận Dụng Cao', 
      'Tổng Số Câu', 
      'Chỉ Tiêu Chuẩn', 
      'Trạng Thái Độ Phủ'
    ]
  ];

  domainKeys.forEach(dKey => {
    const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
    if (dom && dom.subCompetencies) {
      dom.subCompetencies.forEach(sub => {
        const subQs = filteredQuestions.filter(q => 
          q.digital_sub_competency === sub.code || 
          (q.digital_competency_domain === dKey && q.question_text?.toLowerCase().includes(sub.name.toLowerCase().slice(0, 15)))
        );

        let nb = 0, th = 0, vd = 0, vdc = 0;
        subQs.forEach(q => {
          const l = q.cognitive_level || 'THONG_HIEU';
          if (l === 'NHAN_BIET') nb++;
          else if (l === 'THONG_HIEU') th++;
          else if (l === 'VAN_DUNG') vd++;
          else if (l === 'VAN_DUNG_CAO') vdc++;
        });

        const sum = subQs.length;
        const status = sum >= targetPerCell ? '✓ Đạt chuẩn' : sum > 0 ? `⚠️ Thiếu (${sum}/${targetPerCell})` : '❌ Vùng trắng (0 câu)';

        sheet4Data.push([
          sub.code,
          dom.name,
          sub.name,
          nb,
          th,
          vd,
          vdc,
          sum,
          `≥ ${targetPerCell} câu`,
          status
        ]);
      });
    }
  });

  // ==========================================
  // SHEET 5: BÁO CÁO VÙNG TRẮNG & LỖ HỔNG (GAP ANALYSIS)
  // ==========================================
  const sheet5Data: any[] = [
    ['BÁO CÁO PHÂN TÍCH LỖ HỔNG & VÙNG TRẮNG CẦN BỔ SUNG CÂU HỎI (GAP ANALYSIS REPORT)'],
    ['Phục vụ chỉ đạo công tác biên soạn đề bổ sung và thiết lập lệnh tạo tự động trên AI Question Studio'],
    [`Thời điểm xuất: ${dateStr} ${timeStr}`],
    [],
    [
      'STT', 
      'Mã Miền', 
      'Tên Miền Năng Lực', 
      'Mức Độ Nhận Thức', 
      'Hiện Có', 
      'Mục Tiêu', 
      'Cần Bổ Sung', 
      'Mức Độ Ưu Tiên', 
      'Gợi Ý Prompt Biên Soạn AI'
    ]
  ];

  let gapIndex = 1;
  domainKeys.forEach(dKey => {
    const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
    cognitiveLevels.forEach(lvl => {
      const cnt = domainGrid[dKey][lvl].length;
      if (cnt < targetPerCell) {
        const needed = targetPerCell - cnt;
        const priority = cnt === 0 ? '🔴 KHẨN CẤP (Vùng trắng 0)' : '🟡 TRUNG BÌNH (Bổ sung)';
        const lvlName = COGNITIVE_LEVELS[lvl]?.name || lvl;
        const promptAdvice = `Tạo ${needed} câu hỏi tình huống số thực tế thuộc ${dom.name} ở mức độ ${lvlName} (${COGNITIVE_LEVELS[lvl]?.verbs}) cho kỳ thi BTI 2026`;
        
        sheet5Data.push([
          gapIndex++,
          dom.code,
          dom.name,
          lvlName,
          cnt,
          targetPerCell,
          needed,
          priority,
          promptAdvice
        ]);
      }
    });
  });

  if (gapIndex === 1) {
    sheet5Data.push(['—', 'HOÀN HẢO', 'Tất cả các ô trong ma trận đều đã đạt chỉ tiêu chuẩn!', '—', '—', '—', 0, '🟢 ĐẠT 100%', 'Ngân hàng câu hỏi sẵn sàng xuất đề thi']);
  }

  // ==========================================
  // SHEET 6: TOÀN BỘ DANH SÁCH CÂU HỎI CHI TIẾT
  // ==========================================
  const sheet6Data: any[] = [
    ['TOÀN BỘ NGÂN HÀNG CÂU HỎI ĐÃ ĐƯỢC ÁNH XẠ KHUNG NĂNG LỰC BTI 2026'],
    [`Tổng số câu hỏi: ${totalFilteredCount} | Thời điểm xuất: ${dateStr} ${timeStr}`],
    [],
    [
      'Mã Câu',
      'Nội Dung Câu Hỏi',
      'Loại Câu Hỏi',
      'Đáp Án Đúng',
      'Giải Thích / Hướng Dẫn',
      'Căn Cứ Pháp Lý',
      'Miền Năng Lực',
      'Tiêu Chí Thành Phần',
      'Mức Độ Nhận Thức',
      'Phần Thi / Vòng',
      'Giai Đoạn Thi',
      'Độ Khó',
      'Trạng Thái Duyệt',
      'Thẻ (Tags)'
    ]
  ];

  filteredQuestions.forEach(q => {
    const answerText = (q as any).correct_answer || (q.options && q.options[q.correct_key]) || q.correct_key || '';
    const diff = (q as any).difficulty || 'MEDIUM';
    const tagString = Array.isArray(q.tags) ? q.tags.join(', ') : '';

    sheet6Data.push([
      q.id,
      q.question_text || '',
      q.round_type || (q as any).round_format || 'MULTIPLE_CHOICE',
      answerText,
      q.explanation || '',
      q.legal_reference || '',
      q.digital_competency_domain || 'Unassigned',
      q.digital_sub_competency || 'Unassigned',
      q.cognitive_level || 'THONG_HIEU',
      q.round_name || q.round_group || 'N/A',
      q.stage || 'N/A',
      diff,
      q.approval_status || 'DRAFT',
      tagString
    ]);
  });

  // ==========================================
  // BUILD WORKBOOK & WRITE FILE
  // ==========================================
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  const ws4 = XLSX.utils.aoa_to_sheet(sheet4Data);
  const ws5 = XLSX.utils.aoa_to_sheet(sheet5Data);
  const ws6 = XLSX.utils.aoa_to_sheet(sheet6Data);

  // Column Widths formatting
  ws1['!cols'] = [{ wch: 12 }, { wch: 38 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 22 }];
  ws2['!cols'] = [{ wch: 6 }, { wch: 35 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 22 }];
  ws3['!cols'] = [{ wch: 14 }, { wch: 32 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 45 }];
  ws4['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 20 }];
  ws5['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 24 }, { wch: 65 }];
  ws6['!cols'] = [
    { wch: 14 }, // ID
    { wch: 65 }, // Question text
    { wch: 18 }, // Type
    { wch: 22 }, // Answer
    { wch: 40 }, // Explanation
    { wch: 25 }, // Legal ref
    { wch: 16 }, // Domain
    { wch: 16 }, // Sub
    { wch: 18 }, // Level
    { wch: 20 }, // Round
    { wch: 16 }, // Stage
    { wch: 12 }, // Difficulty
    { wch: 16 }, // Status
    { wch: 30 }  // Tags
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Tong_Quan_Ma_Tran');
  XLSX.utils.book_append_sheet(wb, ws2, 'Ma_Tran_Chuyen_De');
  XLSX.utils.book_append_sheet(wb, ws3, 'Ma_Tran_Phan_Thi');
  XLSX.utils.book_append_sheet(wb, ws4, 'Chi_Tiet_24_Tieu_Chi');
  XLSX.utils.book_append_sheet(wb, ws5, 'Canh_Bao_Lo_Hong_Gap');
  XLSX.utils.book_append_sheet(wb, ws6, 'Danh_Sach_Cau_Hoi');

  const filename = `BTI2026_MaTran_DoPhu_CauHoi_${now.toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);

  return { success: true, filename };
};
