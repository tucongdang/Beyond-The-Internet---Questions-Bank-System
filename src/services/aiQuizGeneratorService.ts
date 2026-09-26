import { 
  QuestionItem, 
  CompetitionStage, 
  CognitiveLevel, 
  DigitalCompetencyDomainKey,
  GeneratedExam 
} from '../types';
import { questionBankManager } from './questionBankManager';
import { DIGITAL_COMPETENCY_DOMAINS } from '../data/digitalCompetencyData';

export type MockQuizPresetKey = 
  | 'STANDARD_BGD_28'
  | 'BALANCED_40_GAMESHOW'
  | 'QUICK_PRACTICE_15'
  | 'DIAGNOSTIC_ASSESSMENT_24'
  | 'FINAL_CHALLENGE_30'
  | 'CUSTOM';

export interface MockQuizPreset {
  key: MockQuizPresetKey;
  name: string;
  badge: string;
  description: string;
  defaultQuestionsCount: number;
  defaultTimeMinutes: number;
  defaultStage: CompetitionStage;
  difficultyDistribution: {
    NHAN_BIET: number; // percentage (0-100)
    THONG_HIEU: number;
    VAN_DUNG: number;
    VAN_DUNG_CAO: number;
  };
  recommendedDomains: DigitalCompetencyDomainKey[];
  focusTopic: string;
}

export const MOCK_QUIZ_PRESETS: Record<MockQuizPresetKey, MockQuizPreset> = {
  STANDARD_BGD_28: {
    key: 'STANDARD_BGD_28',
    name: 'Đề Chuẩn Vòng Loại Bộ GD&ĐT',
    badge: 'Chuẩn TT 02/2025',
    description: 'Cấu trúc 28 câu chuẩn hóa kiểm tra toàn diện 6 miền năng lực số với tỷ lệ phân hóa khảo thí tối ưu (40-30-20-10).',
    defaultQuestionsCount: 28,
    defaultTimeMinutes: 45,
    defaultStage: 'VONG_LOAI',
    difficultyDistribution: {
      NHAN_BIET: 40,
      THONG_HIEU: 30,
      VAN_DUNG: 20,
      VAN_DUNG_CAO: 10
    },
    recommendedDomains: ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'],
    focusTopic: 'Khung năng lực số người học & An toàn dữ liệu số'
  },
  BALANCED_40_GAMESHOW: {
    key: 'BALANCED_40_GAMESHOW',
    name: 'Đề Thi Đấu Gameshow BTI (40 câu)',
    badge: 'BTI Arena 2026',
    description: 'Bộ đề 40 câu mô phỏng 4 vòng thi Khởi Động - VCNV - Tăng Tốc - Về Đích với độ kịch tính và phân hóa thực chiến cao.',
    defaultQuestionsCount: 40,
    defaultTimeMinutes: 60,
    defaultStage: 'BAN_KET_1',
    difficultyDistribution: {
      NHAN_BIET: 25,
      THONG_HIEU: 35,
      VAN_DUNG: 25,
      VAN_DUNG_CAO: 15
    },
    recommendedDomains: ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'],
    focusTopic: 'Kịch bản đấu loại trực tiếp & Vượt chướng ngại vật'
  },
  QUICK_PRACTICE_15: {
    key: 'QUICK_PRACTICE_15',
    name: 'Đề Luyện Nhanh (15 câu - 15 phút)',
    badge: 'Tốc Độ & Nhớ Nhanh',
    description: 'Bộ đề 15 câu thời gian ngắn giúp kiểm tra nhanh mức độ nắm bắt kiến thức nền tảng và phản xạ số.',
    defaultQuestionsCount: 15,
    defaultTimeMinutes: 15,
    defaultStage: 'BAN_KET_1',
    difficultyDistribution: {
      NHAN_BIET: 50,
      THONG_HIEU: 35,
      VAN_DUNG: 15,
      VAN_DUNG_CAO: 0
    },
    recommendedDomains: ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'],
    focusTopic: 'Ôn tập cốt lõi & Pháp luật an toàn thông tin'
  },
  DIAGNOSTIC_ASSESSMENT_24: {
    key: 'DIAGNOSTIC_ASSESSMENT_24',
    name: 'Đánh Giá Năng Lực Số Toàn Diện (24 câu)',
    badge: 'Chẩn Đoán Điểm Yếu',
    description: 'Mỗi miền năng lực số phân bổ đúng 4 câu (từ Dễ đến Khó) giúp phát hiện chính xác lỗ hổng tri thức của học sinh.',
    defaultQuestionsCount: 24,
    defaultTimeMinutes: 40,
    defaultStage: 'VONG_LOAI',
    difficultyDistribution: {
      NHAN_BIET: 25,
      THONG_HIEU: 25,
      VAN_DUNG: 25,
      VAN_DUNG_CAO: 25
    },
    recommendedDomains: ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'],
    focusTopic: 'Khảo sát 6 miền năng lực số TT 02/2025'
  },
  FINAL_CHALLENGE_30: {
    key: 'FINAL_CHALLENGE_30',
    name: 'Thử Thách Vận Dụng Cao Chung Kết (30 câu)',
    badge: 'Phân Loại Cao',
    description: 'Bộ đề chuyên sâu tập trung vào xử lý tình huống thực tế, xử lý vi phạm Nghị định 13/2023/NĐ-CP và kịch bản Về Đích.',
    defaultQuestionsCount: 30,
    defaultTimeMinutes: 50,
    defaultStage: 'CHUNG_KET',
    difficultyDistribution: {
      NHAN_BIET: 10,
      THONG_HIEU: 20,
      VAN_DUNG: 40,
      VAN_DUNG_CAO: 30
    },
    recommendedDomains: ['MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'],
    focusTopic: 'Tình huống pháp lý, bảo mật nâng cao & Trí tuệ nhân tạo'
  },
  CUSTOM: {
    key: 'CUSTOM',
    name: 'Đề Thi Tùy Biến Linh Hoạt',
    badge: 'Tự Do Cấu Hình',
    description: 'Tùy chỉnh số lượng, thời gian, tỷ lệ độ khó và lựa chọn miền tri thức số theo ý muốn.',
    defaultQuestionsCount: 20,
    defaultTimeMinutes: 30,
    defaultStage: 'VONG_LOAI',
    difficultyDistribution: {
      NHAN_BIET: 30,
      THONG_HIEU: 40,
      VAN_DUNG: 20,
      VAN_DUNG_CAO: 10
    },
    recommendedDomains: ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'],
    focusTopic: 'Tùy biến theo nhu cầu kiểm tra'
  }
};

export interface AiGeneratedMockQuiz {
  code: string;
  title: string;
  subtitle?: string;
  presetKey: MockQuizPresetKey;
  stage: CompetitionStage;
  totalQuestions: number;
  timeMinutes: number;
  difficultyIndex: number; // 1.0 to 10.0
  difficultyLabel: string;
  instructions: string;
  pedagogicalRationale: string;
  timePacingTip?: string;
  questions: QuestionItem[];
  distributionSummary: {
    nhanBietCount: number;
    thongHieuCount: number;
    vanDungCount: number;
    vanDungCaoCount: number;
    averageSolveTimeSec?: number;
  };
  domainBreakdown?: Array<{
    domainKey: string;
    domainName: string;
    questionCount: number;
  }>;
  createdAt: number;
  isAiOptimized: boolean;
}

export interface MockQuizGeneratorOptions {
  presetKey?: MockQuizPresetKey;
  customTitle?: string;
  targetCount?: number;
  timeMinutes?: number;
  stage?: CompetitionStage;
  distribution?: {
    NHAN_BIET: number;
    THONG_HIEU: number;
    VAN_DUNG: number;
    VAN_DUNG_CAO: number;
  };
  selectedDomains?: DigitalCompetencyDomainKey[];
  onlyApproved?: boolean;
  onProgress?: (msg: string, percent: number) => void;
}

/**
 * Heuristic Balanced Selector fallback ensuring 0 duplicate IDs and exact quota matching
 */
export function generateBalancedMockQuizHeuristic(
  options: MockQuizGeneratorOptions
): AiGeneratedMockQuiz {
  const allBankQuestions = questionBankManager.getQuestions();
  const filteredPool = options.onlyApproved !== false 
    ? allBankQuestions.filter(q => q.approval_status === 'APPROVED' || !q.approval_status)
    : allBankQuestions;

  const preset = MOCK_QUIZ_PRESETS[options.presetKey || 'STANDARD_BGD_28'];
  const targetCount = options.targetCount || preset.defaultQuestionsCount;
  const timeMinutes = options.timeMinutes || preset.defaultTimeMinutes;
  const stage = options.stage || preset.defaultStage;
  const dist = options.distribution || preset.difficultyDistribution;
  const domains = options.selectedDomains || preset.recommendedDomains;

  // Calculate quota for each cognitive level
  const quotaNhanBiet = Math.round((targetCount * dist.NHAN_BIET) / 100);
  const quotaThongHieu = Math.round((targetCount * dist.THONG_HIEU) / 100);
  const quotaVanDung = Math.round((targetCount * dist.VAN_DUNG) / 100);
  const quotaVanDungCao = Math.max(0, targetCount - (quotaNhanBiet + quotaThongHieu + quotaVanDung));

  // Pool buckets by level and domain
  const poolByLevel: Record<CognitiveLevel, QuestionItem[]> = {
    NHAN_BIET: [],
    THONG_HIEU: [],
    VAN_DUNG: [],
    VAN_DUNG_CAO: []
  };

  filteredPool.forEach(q => {
    const dKey = (q.digital_competency_domain || (q as any).domain || 'MIEN_4') as DigitalCompetencyDomainKey;
    if (domains.length === 0 || domains.includes(dKey)) {
      const lvl = (q.cognitive_level || 'THONG_HIEU') as CognitiveLevel;
      if (poolByLevel[lvl]) {
        poolByLevel[lvl].push(q);
      } else {
        poolByLevel.THONG_HIEU.push(q);
      }
    }
  });

  // Shuffle arrays
  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => 0.5 - Math.random());

  const selectedIds = new Set<string>();
  const selectedQuestions: QuestionItem[] = [];

  const pickFromPool = (pool: QuestionItem[], count: number) => {
    const shuffled = shuffle(pool);
    let picked = 0;
    for (const q of shuffled) {
      if (picked >= count) break;
      if (!selectedIds.has(q.id)) {
        selectedIds.add(q.id);
        selectedQuestions.push(q);
        picked++;
      }
    }
  };

  pickFromPool(poolByLevel.NHAN_BIET, quotaNhanBiet);
  pickFromPool(poolByLevel.THONG_HIEU, quotaThongHieu);
  pickFromPool(poolByLevel.VAN_DUNG, quotaVanDung);
  pickFromPool(poolByLevel.VAN_DUNG_CAO, quotaVanDungCao);

  // If still missing questions, fill with any remaining pool questions
  if (selectedQuestions.length < targetCount) {
    const remaining = shuffle(filteredPool.filter(q => !selectedIds.has(q.id)));
    for (const q of remaining) {
      if (selectedQuestions.length >= targetCount) break;
      selectedIds.add(q.id);
      selectedQuestions.push(q);
    }
  }

  // Sort selected questions in pedagogical order: NHAN_BIET -> THONG_HIEU -> VAN_DUNG -> VAN_DUNG_CAO
  const levelRank: Record<string, number> = {
    NHAN_BIET: 1,
    THONG_HIEU: 2,
    VAN_DUNG: 3,
    VAN_DUNG_CAO: 4
  };

  selectedQuestions.sort((a, b) => {
    const rA = levelRank[a.cognitive_level || 'THONG_HIEU'] || 2;
    const rB = levelRank[b.cognitive_level || 'THONG_HIEU'] || 2;
    return rA - rB;
  });

  // Calculate actual counts
  let nb = 0, th = 0, vd = 0, vdc = 0;
  selectedQuestions.forEach(q => {
    const lvl = q.cognitive_level;
    if (lvl === 'NHAN_BIET') nb++;
    else if (lvl === 'VAN_DUNG') vd++;
    else if (lvl === 'VAN_DUNG_CAO') vdc++;
    else th++;
  });

  // Calculate domain breakdown
  const domainCounts: Record<string, number> = {};
  selectedQuestions.forEach(q => {
    const d = q.digital_competency_domain || (q as any).domain || 'MIEN_4';
    domainCounts[d] = (domainCounts[d] || 0) + 1;
  });

  const domainBreakdown = Object.entries(domainCounts).map(([k, count]) => {
    const domInfo = DIGITAL_COMPETENCY_DOMAINS[k as DigitalCompetencyDomainKey];
    return {
      domainKey: k,
      domainName: domInfo?.name || k,
      questionCount: count
    };
  });

  const difficultyIndex = Number((
    (nb * 1 + th * 2.2 + vd * 3.5 + vdc * 5.0) / (selectedQuestions.length || 1) * 2
  ).toFixed(1));

  let diffLabel = 'Cân Bằng Tiêu Chuẩn';
  if (difficultyIndex >= 7.5) diffLabel = 'Phân Hóa Rất Cao';
  else if (difficultyIndex >= 6.5) diffLabel = 'Phân Hóa Khảo Thí';
  else if (difficultyIndex <= 4.5) diffLabel = 'Nền Tảng Cơ Bản';

  const examCode = `MOCK_${stage}_${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    code: examCode,
    title: options.customTitle || `Đề Thi Thử BTI 2026 • ${preset.name}`,
    subtitle: `Bộ đề thi thử số hóa chuẩn Thông tư 02/2025/TT-BGDĐT (${selectedQuestions.length} câu - ${timeMinutes} phút)`,
    presetKey: options.presetKey || 'STANDARD_BGD_28',
    stage,
    totalQuestions: selectedQuestions.length,
    timeMinutes,
    difficultyIndex: Math.min(10.0, Math.max(1.0, difficultyIndex)),
    difficultyLabel: diffLabel,
    instructions: `Thời gian làm bài ${timeMinutes} phút. Thí sinh chọn 01 đáp án đúng nhất cho câu trắc nghiệm nhiều lựa chọn hoặc hoàn thành các nhận định tình huống số.`,
    pedagogicalRationale: `Đề thi được cấu trúc cân bằng với ${nb} câu Nhận biết (${Math.round((nb/selectedQuestions.length)*100)}%), ${th} câu Thông hiểu (${Math.round((th/selectedQuestions.length)*100)}%), ${vd} câu Vận dụng (${Math.round((vd/selectedQuestions.length)*100)}%) và ${vdc} câu Vận dụng cao (${Math.round((vdc/selectedQuestions.length)*100)}%), bao phủ ${domainBreakdown.length} miền năng lực số.`,
    timePacingTip: `Dành 40-50 giây cho câu Nhận biết, 70-90 giây cho câu Thông hiểu và 120-150 giây cho câu Vận dụng tình huống.`,
    questions: selectedQuestions,
    distributionSummary: {
      nhanBietCount: nb,
      thongHieuCount: th,
      vanDungCount: vd,
      vanDungCaoCount: vdc,
      averageSolveTimeSec: Math.round((timeMinutes * 60) / (selectedQuestions.length || 1))
    },
    domainBreakdown,
    createdAt: Date.now(),
    isAiOptimized: false
  };
}

/**
 * AI-Powered Mock Quiz Generator calling Gemini 3.8 Flash via server proxy
 */
export async function generateBalancedMockQuizWithAI(
  options: MockQuizGeneratorOptions = {}
): Promise<AiGeneratedMockQuiz> {
  const allBankQuestions = questionBankManager.getQuestions();
  const candidatePool = options.onlyApproved !== false
    ? allBankQuestions.filter(q => q.approval_status === 'APPROVED' || !q.approval_status)
    : allBankQuestions;

  if (candidatePool.length === 0) {
    throw new Error('Ngân hàng câu hỏi trống hoặc chưa có câu hỏi nào được phê duyệt.');
  }

  const preset = MOCK_QUIZ_PRESETS[options.presetKey || 'STANDARD_BGD_28'];
  const targetCount = options.targetCount || preset.defaultQuestionsCount;
  const timeMinutes = options.timeMinutes || preset.defaultTimeMinutes;
  const stage = options.stage || preset.defaultStage;
  const dist = options.distribution || preset.difficultyDistribution;
  const domains = options.selectedDomains || preset.recommendedDomains;

  options.onProgress?.('Đang phân tích ma trận ngân hàng câu hỏi hiện tại...', 20);

  try {
    const payload = {
      presetType: preset.name,
      targetCount,
      timeMinutes,
      stage,
      desiredDistribution: dist,
      selectedDomains: domains,
      candidateQuestions: candidatePool.map(q => ({
        id: q.id,
        question_text: q.question_text,
        options: q.options,
        correct_key: q.correct_key,
        category: q.category,
        cognitive_level: q.cognitive_level,
        digital_competency_domain: q.digital_competency_domain,
        digital_sub_competency: q.digital_sub_competency,
        legal_reference: q.legal_reference,
        tags: q.tags
      }))
    };

    options.onProgress?.('Gemini 3.8 Flash đang tính toán độ phân hóa và chọn lọc câu hỏi tối ưu...', 50);

    const response = await fetch('/api/ai/generate-mock-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const bp = data.mockQuizBlueprint;

    if (!bp || !bp.selectedQuestionIds || bp.selectedQuestionIds.length === 0) {
      throw new Error('AI không trả về danh sách câu hỏi hợp lệ.');
    }

    // Map selected IDs back to full question objects in correct order
    const questionMap = new Map<string, QuestionItem>();
    candidatePool.forEach(q => questionMap.set(q.id, q));

    const finalQuestions: QuestionItem[] = [];
    const usedIds = new Set<string>();

    for (const id of bp.selectedQuestionIds) {
      const found = questionMap.get(id);
      if (found && !usedIds.has(id)) {
        usedIds.add(id);
        finalQuestions.push(found);
      }
    }

    // If AI picked fewer than target, top-up using heuristic selector
    if (finalQuestions.length < targetCount) {
      const remainingPool = candidatePool.filter(q => !usedIds.has(q.id));
      for (const q of remainingPool) {
        if (finalQuestions.length >= targetCount) break;
        usedIds.add(q.id);
        finalQuestions.push(q);
      }
    }

    options.onProgress?.('Đã tạo thành công bộ đề thi thử cân bằng AI!', 100);

    const examCode = `MOCK_${stage}_${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      code: examCode,
      title: options.customTitle || bp.quizTitle || `Đề Thi Thử BTI 2026 • ${preset.name}`,
      subtitle: bp.quizSubtitle || `Bộ đề thi thử số hóa chuẩn Thông tư 02/2025/TT-BGDĐT (${finalQuestions.length} câu - ${timeMinutes} phút)`,
      presetKey: options.presetKey || 'STANDARD_BGD_28',
      stage,
      totalQuestions: finalQuestions.length,
      timeMinutes,
      difficultyIndex: bp.difficultyIndex || 6.5,
      difficultyLabel: bp.difficultyLabel || 'Cân Bằng Chuẩn Khảo Thí',
      instructions: bp.instructions || `Thời gian làm bài ${timeMinutes} phút. Thí sinh chọn đáp án đúng nhất cho từng câu hỏi tình huống số.`,
      pedagogicalRationale: bp.pedagogicalRationale || 'Đề thi được AI tự động cân đối tỷ lệ độ khó và trải rộng toàn bộ 6 miền năng lực số.',
      timePacingTip: bp.timePacingTip,
      questions: finalQuestions,
      distributionSummary: bp.distributionSummary || {
        nhanBietCount: finalQuestions.filter(q => q.cognitive_level === 'NHAN_BIET').length,
        thongHieuCount: finalQuestions.filter(q => q.cognitive_level === 'THONG_HIEU').length,
        vanDungCount: finalQuestions.filter(q => q.cognitive_level === 'VAN_DUNG').length,
        vanDungCaoCount: finalQuestions.filter(q => q.cognitive_level === 'VAN_DUNG_CAO').length
      },
      domainBreakdown: bp.domainBreakdown,
      createdAt: Date.now(),
      isAiOptimized: true
    };
  } catch (err: any) {
    console.warn('AI Quiz generation failed, fallback to heuristic balanced generator:', err);
    options.onProgress?.('Đã chuyển sang bộ cân bằng thuật toán cục bộ.', 100);
    return generateBalancedMockQuizHeuristic(options);
  }
}

/**
 * Finds alternative replacement questions with matching cognitive level and domain
 */
export function findAlternativeQuestions(
  currentQuestion: QuestionItem,
  excludedIds: Set<string>
): QuestionItem[] {
  const all = questionBankManager.getQuestions();
  const targetLevel = currentQuestion.cognitive_level || 'THONG_HIEU';
  const targetDomain = currentQuestion.digital_competency_domain;

  return all.filter(q => {
    if (excludedIds.has(q.id) || q.id === currentQuestion.id) return false;
    // Prefer matching level and domain
    const matchLevel = (q.cognitive_level || 'THONG_HIEU') === targetLevel;
    const matchDomain = !targetDomain || q.digital_competency_domain === targetDomain;
    return matchLevel && matchDomain;
  }).slice(0, 10);
}
