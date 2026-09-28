import { 
  QuestionItem, 
  BankGapAnalysisResult, 
  DigitalCompetencyDomainKey, 
  CognitiveLevel 
} from '../types';
import { questionBankManager } from './questionBankManager';

/**
 * Standard quotas required for a full BTI 2026 tournament cycle
 * (Vòng loại + 3 Bán kết + 1 Chung kết = 4 trận đấu sân khấu + vòng loại trực tuyến)
 */
const BTI_TARGET_QUOTAS = {
  // Required questions per domain across the whole bank
  domains: {
    MIEN_1: 40, // Dữ liệu và Thông tin số
    MIEN_2: 40, // Giao tiếp và Hợp tác số
    MIEN_3: 35, // Sáng tạo nội dung số
    MIEN_4: 45, // An toàn và An ninh số (Trọng tâm BTI)
    MIEN_5: 30, // Giải quyết vấn đề số
    MIEN_6: 30, // Ứng dụng AI & Công nghệ tương lai
  } as Record<DigitalCompetencyDomainKey, number>,

  // Cognitive level distribution standard (40% Nhận biết, 30% Thông hiểu, 20% Vận dụng, 10% Vận dụng cao)
  levels: {
    NHAN_BIET: 80,
    THONG_HIEU: 65,
    VAN_DUNG: 50,
    VAN_DUNG_CAO: 25,
  } as Record<CognitiveLevel, number>,

  // Standard requirements by round group for minimum tournament readiness
  rounds: {
    KHOI_DONG: 93,   // 48 câu riêng + 45 câu chung mỗi trận
    VCNV: 15,        // Tối thiểu 15 câu CNV cho các trận
    TANG_TOC: 16,    // 4 trận x 4 câu
    VE_DICH: 36,     // Tối thiểu 36 câu (9 câu x 4 lượt)
    CAU_HOI_PHU: 12, // 2 trận x 6 câu tie-breaker
    VONG_LOAI: 28,   // Chuẩn 28 câu TT 02/2025
  } as Record<string, number>
};

export const bankGapAnalysisService = {
  /**
   * Performs in-depth gap analysis comparing the bank to national BTI standards
   */
  analyzeBank(customQuestions?: QuestionItem[]): BankGapAnalysisResult {
    const questions = customQuestions || questionBankManager.getQuestions();
    const total = questions.length;

    // 1. Domain Coverage Analysis
    const domainCounts: Record<DigitalCompetencyDomainKey, number> = {
      MIEN_1: 0, MIEN_2: 0, MIEN_3: 0, MIEN_4: 0, MIEN_5: 0, MIEN_6: 0
    };

    // 2. Cognitive Level Coverage Analysis
    const levelCounts: Record<CognitiveLevel, number> = {
      NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0
    };

    // 3. Round Coverage Analysis
    const roundCounts: Record<string, number> = {
      KHOI_DONG: 0, VCNV: 0, TANG_TOC: 0, VE_DICH: 0, CAU_HOI_PHU: 0, VONG_LOAI: 0
    };

    questions.forEach(q => {
      // Count domains
      if (q.digital_competency_domain && domainCounts[q.digital_competency_domain] !== undefined) {
        domainCounts[q.digital_competency_domain]++;
      } else {
        domainCounts['MIEN_1']++;
      }

      // Count cognitive levels
      if (q.cognitive_level && levelCounts[q.cognitive_level] !== undefined) {
        levelCounts[q.cognitive_level]++;
      } else {
        levelCounts['THONG_HIEU']++;
      }

      // Count rounds
      const rName = (q.round_name || '').toLowerCase();
      const rFmt = (q.round_format || '').toLowerCase();
      if (rName.includes('khởi động') || rFmt.includes('khoi_dong')) roundCounts.KHOI_DONG++;
      else if (rName.includes('vcnv') || rName.includes('chướng ngại') || rFmt.includes('vcnv')) roundCounts.VCNV++;
      else if (rName.includes('tăng tốc') || rFmt.includes('tang_toc')) roundCounts.TANG_TOC++;
      else if (rName.includes('về đích') || rFmt.includes('ve_dich')) roundCounts.VE_DICH++;
      else if (rName.includes('phụ') || rFmt.includes('cau_hoi_phu')) roundCounts.CAU_HOI_PHU++;
      else if (q.stage === 'VONG_LOAI' || rFmt.includes('bgd')) roundCounts.VONG_LOAI++;
      else roundCounts.KHOI_DONG++;
    });

    // Build Domain Breakdown
    const domainCoverage: Record<DigitalCompetencyDomainKey, { count: number; required: number; gap: number; healthPct: number }> = {} as any;
    (Object.keys(BTI_TARGET_QUOTAS.domains) as DigitalCompetencyDomainKey[]).forEach(dKey => {
      const count = domainCounts[dKey] || 0;
      const req = BTI_TARGET_QUOTAS.domains[dKey];
      const gap = Math.max(0, req - count);
      const healthPct = Math.min(100, Math.round((count / req) * 100));
      domainCoverage[dKey] = { count, required: req, gap, healthPct };
    });

    // Build Level Breakdown
    const levelCoverage: Record<CognitiveLevel, { count: number; required: number; gap: number; healthPct: number }> = {} as any;
    (Object.keys(BTI_TARGET_QUOTAS.levels) as CognitiveLevel[]).forEach(lKey => {
      const count = levelCounts[lKey] || 0;
      const req = BTI_TARGET_QUOTAS.levels[lKey];
      const gap = Math.max(0, req - count);
      const healthPct = Math.min(100, Math.round((count / req) * 100));
      levelCoverage[lKey] = { count, required: req, gap, healthPct };
    });

    // Build Round Breakdown
    const roundCoverage: Record<string, { count: number; required: number; gap: number; healthPct: number }> = {};
    Object.keys(BTI_TARGET_QUOTAS.rounds).forEach(rKey => {
      const count = roundCounts[rKey] || 0;
      const req = BTI_TARGET_QUOTAS.rounds[rKey];
      const gap = Math.max(0, req - count);
      const healthPct = Math.min(100, Math.round((count / req) * 100));
      roundCoverage[rKey] = { count, required: req, gap, healthPct };
    });

    // Detect Critical Gaps
    const criticalGaps: BankGapAnalysisResult['criticalGaps'] = [];

    // Domain gaps
    (Object.entries(domainCoverage) as [DigitalCompetencyDomainKey, typeof domainCoverage[DigitalCompetencyDomainKey]][]).forEach(([dKey, val]) => {
      if (val.gap > 0) {
        criticalGaps.push({
          category: `Miền Năng Lực (${dKey})`,
          description: `Thiếu ${val.gap} câu hỏi đạt chuẩn ${dKey} (hiện có ${val.count}/${val.required} câu)`,
          missingCount: val.gap,
          priority: val.healthPct < 50 ? 'CRITICAL' : (val.healthPct < 80 ? 'HIGH' : 'MEDIUM'),
          domainKey: dKey
        });
      }
    });

    // Level gaps (especially Vận dụng cao)
    if (levelCoverage.VAN_DUNG_CAO.gap > 0) {
      criticalGaps.push({
        category: 'Mức Nhận Thức (Vận Dụng Cao)',
        description: `Thiếu ${levelCoverage.VAN_DUNG_CAO.gap} câu hỏi Vận dụng cao cho các gói Về đích 40 điểm`,
        missingCount: levelCoverage.VAN_DUNG_CAO.gap,
        priority: levelCoverage.VAN_DUNG_CAO.healthPct < 60 ? 'CRITICAL' : 'HIGH',
        levelKey: 'VAN_DUNG_CAO'
      });
    }

    // Round gaps
    if (roundCoverage.VE_DICH.gap > 0) {
      criticalGaps.push({
        category: 'Vòng Thi (Về Đích)',
        description: `Thiếu ${roundCoverage.VE_DICH.gap} câu hỏi Về đích để cung cấp đầy đủ 3 gói điểm 20-30-40`,
        missingCount: roundCoverage.VE_DICH.gap,
        priority: 'CRITICAL',
        roundGroup: 'VE_DICH'
      });
    }

    if (roundCoverage.TANG_TOC.gap > 0) {
      criticalGaps.push({
        category: 'Vòng Thi (Tăng Tốc)',
        description: `Thiếu ${roundCoverage.TANG_TOC.gap} câu hỏi Tăng tốc cho các trận đấu`,
        missingCount: roundCoverage.TANG_TOC.gap,
        priority: 'HIGH',
        roundGroup: 'TANG_TOC'
      });
    }

    // Calculate Health Score (weighted average of domain and round completion)
    const domainHealthAvg = Object.values(domainCoverage).reduce((acc, c) => acc + c.healthPct, 0) / 6;
    const roundHealthAvg = Object.values(roundCoverage).reduce((acc, c) => acc + c.healthPct, 0) / 6;
    const healthScore = Math.min(100, Math.round(domainHealthAvg * 0.5 + roundHealthAvg * 0.5));

    // Safety ratio based on minimal required single-match questions (148 questions)
    const safetyRatio = Math.round((total / 148) * 10) / 10;

    return {
      totalQuestions: total,
      healthScore,
      safetyRatio,
      domainCoverage,
      levelCoverage,
      roundCoverage,
      criticalGaps: criticalGaps.sort((a, b) => (a.priority === 'CRITICAL' ? -1 : 1))
    };
  },

  /**
   * Generates prompt template for AI Auto-Fill based on specific gap
   */
  generateAutoFillPrompt(gapItem: BankGapAnalysisResult['criticalGaps'][0]): string {
    return `Hãy tạo thêm ${Math.min(5, gapItem.missingCount)} câu hỏi khảo thí chất lượng cao cho cuộc thi BTI 2026.
Yêu cầu chuyên môn:
- Danh mục: ${gapItem.category}
- Chi tiết khoảng trống cần bù đắp: ${gapItem.description}
- Khung pháp lý: Bám sát Thông tư 02/2025/TT-BGDĐT và Nghị định 13/2023/NĐ-CP
- Định dạng xuất: Đầy đủ Câu hỏi, 4 Phương án A/B/C/D (nếu trắc nghiệm) hoặc Đáp án ngắn, Lời giải chi tiết, Thời gian suy nghĩ và Điểm số.`;
  }
};
