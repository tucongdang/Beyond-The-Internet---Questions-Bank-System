import { QuestionItem, DigitalCompetencyDomainKey, CustomCategory, CognitiveLevel, ApprovalStatus } from '../types';
import { questionBankManager } from './questionBankManager';
import { mergeTagsList } from './aiAutoTaggingService';

export interface CategorizationRule {
  categoryId: string;
  categoryName: string;
  domainKey?: DigitalCompetencyDomainKey;
  keywords: string[];
  weight: number;
}

export interface CategorizationResult {
  suggestedCategory: string;
  suggestedDomain?: DigitalCompetencyDomainKey;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  matchScore: number;
  matchedKeywords: string[];
  reasoning: string;
  suggestedTags?: string[];
}

export interface CategorizationDetail {
  questionId: string;
  questionText: string;
  oldCategory: string;
  newCategory: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  matchedKeywords: string[];
  reasoning: string;
}

export interface SmartOrganizeSummary {
  totalProcessed: number;
  totalCategorized: number;
  totalUnchanged: number;
  categoryBreakdown: Record<string, number>;
  details: CategorizationDetail[];
}

/**
 * Rules mapping content keywords/patterns to BTI 2026 categories and domains
 */
export const CATEGORIZATION_RULES: CategorizationRule[] = [
  {
    categoryId: 'cat_mien_4',
    categoryName: 'Miền IV: An toàn & Quyền riêng tư',
    domainKey: 'MIEN_4',
    keywords: [
      'nghị định 13', '13/2023', 'quyền riêng tư', 'dữ liệu cá nhân', 'xác thực hai yếu tố', '2fa', 
      'mật khẩu', 'password', 'phishing', 'lừa đảo', 'mã độc', 'malware', 'virus', 'ransomware', 
      'deepfake', 'mã hóa', 'bảo vệ thiết bị', 'chống giả mạo', 'luật an ninh mạng', 'otp', 
      'an toàn thông tin', 'bảo mật', 'bắt nạt mạng', 'cyberbullying', 'sao lưu 3-2-1', 'backup'
    ],
    weight: 2
  },
  {
    categoryId: 'cat_mien_6',
    categoryName: 'Miền VI: Trí tuệ nhân tạo (AI)',
    domainKey: 'MIEN_6',
    keywords: [
      'trí tuệ nhân tạo', 'ai', 'genai', 'gen ai', 'generative ai', 'chatgpt', 'gemini', 
      'copilot', 'llm', 'hallucination', 'ảo giác', 'prompt', 'kỹ thuật đặt câu lệnh', 
      'mô hình tạo sinh', 'bias', 'thiên kiến', 'liêm chính học thuật', 'đạo đức ai', 
      'tạo ra dữ liệu mới'
    ],
    weight: 2
  },
  {
    categoryId: 'cat_mien_1',
    categoryName: 'Miền I: Khai thác dữ liệu & thông tin',
    domainKey: 'MIEN_1',
    keywords: [
      'thông tư 02', 'khai thác dữ liệu', 'tìm kiếm', 'lọc dữ liệu', 'đánh giá thông tin', 
      'tin giả', 'fake news', 'quản lý dữ liệu', 'truy xuất dữ liệu', 'độ tin cậy', 
      'nguồn dữ liệu', 'bộ lọc thông tin', 'chiến lược tìm kiếm'
    ],
    weight: 2
  },
  {
    categoryId: 'cat_mien_2',
    categoryName: 'Miền II: Giao tiếp & Trách nhiệm số',
    domainKey: 'MIEN_2',
    keywords: [
      'netiquette', 'quy tắc ứng xử', 'nghị định 15', 'dịch vụ công', 'danh tính số', 
      'mạng xã hội', 'hợp tác số', 'chia sẻ nội dung', 'trách nhiệm công dân', 'quy tắc ứng xử mạng', 
      'phát tán tin đồn', 'facebook', 'zalo', 'tiktok'
    ],
    weight: 2
  },
  {
    categoryId: 'cat_mien_3',
    categoryName: 'Miền III: Sáng tạo nội dung số',
    domainKey: 'MIEN_3',
    keywords: [
      'bản quyền', 'creative commons', 'sở hữu trí tuệ', 'lập trình', 'thuật toán', 
      'tạo lập nội dung', 'chỉnh sửa video', 'đa phương tiện', 'sáng tạo nội dung', 
      'giấy phép số', 'kết nối tri thức', 'mã nguồn'
    ],
    weight: 2
  },
  {
    categoryId: 'cat_mien_5',
    categoryName: 'Miền V: Giải quyết vấn đề & Kỹ năng số',
    domainKey: 'MIEN_5',
    keywords: [
      'sự cố kỹ thuật', 'khắc phục lỗi', 'xử lý sự cố', 'lựa chọn công cụ', 'nhu cầu công nghệ', 
      'đổi mới quy trình', 'năng lực số', 'khoảng trống năng lực', 'vận hành hệ thống', 'phần cứng'
    ],
    weight: 2
  },
  {
    categoryId: 'cat_logic',
    categoryName: 'Tư duy Logic & Thuật toán',
    keywords: [
      'tư duy logic', 'mã giả', 'pseudocode', 'sơ đồ khối', 'flowchart', 'thuật toán tìm kiếm', 
      'thuật toán sắp xếp', 'vòng lặp', 'biến số', 'cấu trúc điều kiện'
    ],
    weight: 1.5
  },
  {
    categoryId: 'cat_phap_ly',
    categoryName: 'Luật An ninh mạng & Pháp lý số',
    keywords: [
      'luật an ninh mạng 2018', 'nghị định 15/2020', 'xử phạt vi phạm', 'hành chính', 
      'pháp luật số', 'bảo vệ bí mật nhà nước', 'vi phạm pháp luật'
    ],
    weight: 1.5
  }
];

/**
 * Classify a single question based on content keywords & patterns
 */
export function classifyQuestionSmart(question: QuestionItem): CategorizationResult {
  const textToScan = [
    question.question_text || '',
    question.explanation || '',
    question.legal_reference || '',
    question.category || '',
    (question.tags || []).join(' '),
    JSON.stringify(question.options || {})
  ].join(' ').toLowerCase();

  let bestRule: CategorizationRule | null = null;
  let maxScore = 0;
  let bestMatchedKeywords: string[] = [];

  // 1. Evaluate keyword rule scores
  for (const rule of CATEGORIZATION_RULES) {
    let currentScore = 0;
    const matchedForRule: string[] = [];

    for (const kw of rule.keywords) {
      if (textToScan.includes(kw.toLowerCase())) {
        currentScore += rule.weight;
        matchedForRule.push(kw);
      }
    }

    // Direct domain key alignment bonus
    if (rule.domainKey && question.digital_competency_domain === rule.domainKey) {
      currentScore += 3;
    }

    if (currentScore > maxScore) {
      maxScore = currentScore;
      bestRule = rule;
      bestMatchedKeywords = matchedForRule;
    }
  }

  // 2. Domain key mapping fallback if no keywords matched
  if (!bestRule && question.digital_competency_domain) {
    const domainMatch = CATEGORIZATION_RULES.find(r => r.domainKey === question.digital_competency_domain);
    if (domainMatch) {
      bestRule = domainMatch;
      maxScore = 3;
      bestMatchedKeywords = [`Domain: ${question.digital_competency_domain}`];
    }
  }

  // Default fallback if no pattern matched
  if (!bestRule || maxScore === 0) {
    return {
      suggestedCategory: question.category && question.category !== 'Khác / Chưa phân loại' && question.category.trim() !== ''
        ? question.category
        : 'Khác / Chưa phân loại',
      suggestedDomain: question.digital_competency_domain || 'MIEN_1',
      confidence: 'LOW',
      matchScore: 0,
      matchedKeywords: [],
      reasoning: 'Không phát hiện từ khóa đặc trưng rõ ràng; giữ nguyên danh mục mặc định'
    };
  }

  // Determine confidence level
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (maxScore >= 4 || bestMatchedKeywords.length >= 3) {
    confidence = 'HIGH';
  } else if (maxScore >= 2 || bestMatchedKeywords.length >= 1) {
    confidence = 'MEDIUM';
  }

  // Suggested tags extraction
  const suggestedTags = bestMatchedKeywords.slice(0, 4).map(kw => 
    kw.toLowerCase().replace(/[^a-z0-9_đàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/g, '_')
  );

  return {
    suggestedCategory: bestRule.categoryName,
    suggestedDomain: bestRule.domainKey || question.digital_competency_domain,
    confidence,
    matchScore: maxScore,
    matchedKeywords: bestMatchedKeywords,
    reasoning: `Khớp ${bestMatchedKeywords.length} từ khóa chuẩn BTI: [${bestMatchedKeywords.slice(0, 3).join(', ')}]`,
    suggestedTags
  };
}

/**
 * One-Click "Organize All" Execution Engine
 * Automatically moves questions into their respective folders based on smart categorization rules
 */
export function smartOrganizeAllQuestions(options: {
  overwriteAll?: boolean;
  minConfidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  targetQuestionIds?: string[];
} = {}): SmartOrganizeSummary {
  const allQuestions = questionBankManager.getQuestions();
  const questionsToProcess = options.targetQuestionIds && options.targetQuestionIds.length > 0
    ? allQuestions.filter(q => options.targetQuestionIds!.includes(q.id))
    : allQuestions;

  const genericCategories = new Set([
    '', 'khác / chưa phân loại', 'chưa phân loại', 'tổng hợp', 'khác', 'undefined'
  ]);

  const categoryBreakdown: Record<string, number> = {};
  const details: CategorizationDetail[] = [];
  let categorizedCount = 0;
  let unchangedCount = 0;

  questionsToProcess.forEach(q => {
    const currentCategory = q.category || '';
    const isGeneric = genericCategories.has(currentCategory.trim().toLowerCase());

    // Skip if not overwriting all and question already has a specific category
    if (!options.overwriteAll && !isGeneric) {
      unchangedCount++;
      return;
    }

    const result = classifyQuestionSmart(q);

    // Confidence filter check
    if (options.minConfidence === 'HIGH' && result.confidence !== 'HIGH') {
      unchangedCount++;
      return;
    }

    const newCategory = result.suggestedCategory;
    const isCategoryChanged = newCategory.toLowerCase() !== currentCategory.toLowerCase();

    if (isCategoryChanged || isGeneric) {
      // Perform question updates
      const updates: Partial<QuestionItem> = {
        category: newCategory
      };

      if (result.suggestedDomain && result.suggestedDomain !== q.digital_competency_domain) {
        updates.digital_competency_domain = result.suggestedDomain;
      }

      if (result.suggestedTags && result.suggestedTags.length > 0) {
        updates.tags = (q.tags || []).concat(result.suggestedTags.filter(t => !(q.tags || []).includes(t)));
      }

      // Execute batch update in questionBankManager
      questionBankManager.batchUpdate([q.id], updates);

      categorizedCount++;
      categoryBreakdown[newCategory] = (categoryBreakdown[newCategory] || 0) + 1;

      details.push({
        questionId: q.id,
        questionText: q.question_text || 'Không có tiêu đề',
        oldCategory: currentCategory || 'Chưa phân loại',
        newCategory,
        confidence: result.confidence,
        matchedKeywords: result.matchedKeywords,
        reasoning: result.reasoning
      });
    } else {
      unchangedCount++;
    }
  });

  // Guarantee custom categories exist in questionBankManager
  questionBankManager.syncCategoriesFromQuestions();

  return {
    totalProcessed: questionsToProcess.length,
    totalCategorized: categorizedCount,
    totalUnchanged: unchangedCount,
    categoryBreakdown,
    details
  };
}

export interface OrganizeProgressInfo {
  processed: number;
  total: number;
  percent: number;
  movedCount: number;
  currentQuestionText?: string;
  lastMovedCategory?: string;
  categoryBreakdown: Record<string, number>;
  logMessage?: string;
}

/**
 * One-Click "Organize All" Execution Engine (Async with real-time progress updates)
 */
export async function smartOrganizeAllQuestionsAsync(
  options: {
    overwriteAll?: boolean;
    minConfidence?: 'HIGH' | 'MEDIUM' | 'LOW';
    targetQuestionIds?: string[];
    onProgress?: (info: OrganizeProgressInfo) => void;
  } = {}
): Promise<SmartOrganizeSummary> {
  const allQuestions = questionBankManager.getQuestions();
  const questionsToProcess = options.targetQuestionIds && options.targetQuestionIds.length > 0
    ? allQuestions.filter(q => options.targetQuestionIds!.includes(q.id))
    : allQuestions;

  const total = questionsToProcess.length;
  const genericCategories = new Set([
    '', 'khác / chưa phân loại', 'chưa phân loại', 'tổng hợp', 'khác', 'undefined'
  ]);

  const categoryBreakdown: Record<string, number> = {};
  const details: CategorizationDetail[] = [];
  let categorizedCount = 0;
  let unchangedCount = 0;

  for (let i = 0; i < total; i++) {
    const q = questionsToProcess[i];
    const currentCategory = q.category || '';
    const isGeneric = genericCategories.has(currentCategory.trim().toLowerCase());

    let movedInThisStep = false;
    let newCatName = '';

    if (options.overwriteAll || isGeneric) {
      const result = classifyQuestionSmart(q);

      if (!options.minConfidence || options.minConfidence !== 'HIGH' || result.confidence === 'HIGH') {
        const newCategory = result.suggestedCategory;
        const isCategoryChanged = newCategory.toLowerCase() !== currentCategory.toLowerCase();

        if (isCategoryChanged || isGeneric) {
          const updates: Partial<QuestionItem> = { category: newCategory };
          if (result.suggestedDomain && result.suggestedDomain !== q.digital_competency_domain) {
            updates.digital_competency_domain = result.suggestedDomain;
          }
          if (result.suggestedTags && result.suggestedTags.length > 0) {
            updates.tags = (q.tags || []).concat(result.suggestedTags.filter(t => !(q.tags || []).includes(t)));
          }

          questionBankManager.batchUpdate([q.id], updates);

          categorizedCount++;
          categoryBreakdown[newCategory] = (categoryBreakdown[newCategory] || 0) + 1;
          movedInThisStep = true;
          newCatName = newCategory;

          details.push({
            questionId: q.id,
            questionText: q.question_text || 'Không có tiêu đề',
            oldCategory: currentCategory || 'Chưa phân loại',
            newCategory,
            confidence: result.confidence,
            matchedKeywords: result.matchedKeywords,
            reasoning: result.reasoning
          });
        } else {
          unchangedCount++;
        }
      } else {
        unchangedCount++;
      }
    } else {
      unchangedCount++;
    }

    // Call progress callback
    if (options.onProgress) {
      const processed = i + 1;
      const percent = Math.round((processed / total) * 100);
      options.onProgress({
        processed,
        total,
        percent,
        movedCount: categorizedCount,
        currentQuestionText: q.question_text,
        lastMovedCategory: movedInThisStep ? newCatName : undefined,
        categoryBreakdown,
        logMessage: movedInThisStep
          ? `[Phân loại] Đã xếp câu "${(q.question_text || '').slice(0, 35)}..." sang "${newCatName}"`
          : `[Bỏ qua] Giữ nguyên câu "${(q.question_text || '').slice(0, 35)}..."`
      });
    }

    // Small yield every few items to allow UI render smooth progress animation
    if (i % 3 === 0 || i === total - 1) {
      await new Promise(r => setTimeout(r, 12));
    }
  }

  questionBankManager.syncCategoriesFromQuestions();

  return {
    totalProcessed: total,
    totalCategorized: categorizedCount,
    totalUnchanged: unchangedCount,
    categoryBreakdown,
    details
  };
}

/**
 * Alias export for organizeAllQuestions
 */
export const organizeAllQuestions = smartOrganizeAllQuestions;
export const organizeAllQuestionsAsync = smartOrganizeAllQuestionsAsync;

// ================= MATRIX COVERAGE CLASSIFICATION & TAGGING ENGINE =================

export interface MatrixClassificationAndTagResult {
  domain: DigitalCompetencyDomainKey;
  subCompetency: string;
  level: CognitiveLevel;
  category: string;
  newTags: string[];
  allTags: string[];
  isDeficitFiller: boolean;
  reasoning: string;
}

const DOMAIN_SUB_COMPETENCIES: Record<DigitalCompetencyDomainKey, Array<{ code: string; keywords: string[] }>> = {
  MIEN_1: [
    { code: '1.1', keywords: ['tìm kiếm', 'truy xuất', 'chiến lược tìm kiếm', 'lọc dữ liệu', 'bộ lọc', 'search'] },
    { code: '1.2', keywords: ['đánh giá', 'độ tin cậy', 'tin giả', 'fake news', 'xác thực', 'nguồn tin', 'tính chính xác'] },
    { code: '1.3', keywords: ['quản lý dữ liệu', 'lưu trữ', 'sắp xếp dữ liệu', 'tổ chức dữ liệu', 'metadata'] }
  ],
  MIEN_2: [
    { code: '2.1', keywords: ['tương tác', 'phương tiện giao tiếp', 'tin nhắn', 'email', 'hội nghị truyền hình'] },
    { code: '2.2', keywords: ['chia sẻ', 'trích dẫn', 'phổ biến thông tin', 'mạng xã hội'] },
    { code: '2.3', keywords: ['trách nhiệm công dân', 'dịch vụ công', 'chính phủ số', 'cổng thông tin'] },
    { code: '2.4', keywords: ['hợp tác', 'làm việc nhóm', 'đồng sáng tạo', 'google docs', 'cộng tác'] },
    { code: '2.5', keywords: ['netiquette', 'quy tắc ứng xử', 'văn minh', 'xúc phạm', 'bắt nạt'] },
    { code: '2.6', keywords: ['danh tính số', 'uy tín trực tuyến', 'profile', 'thông tin tài khoản'] }
  ],
  MIEN_3: [
    { code: '3.1', keywords: ['phát triển nội dung', 'chỉnh sửa ảnh', 'video', 'đa phương tiện', 'văn bản'] },
    { code: '3.2', keywords: ['tích hợp', 'tạo lập lại', 'phối hợp tài nguyên', 'cải tiến nội dung'] },
    { code: '3.3', keywords: ['bản quyền', 'creative commons', 'sở hữu trí tuệ', 'giấy phép', 'copyright'] },
    { code: '3.4', keywords: ['lập trình', 'thuật toán', 'mã giả', 'ngôn ngữ lập trình', 'code', 'python', 'scratch'] }
  ],
  MIEN_4: [
    { code: '4.1', keywords: ['thiết bị', 'mã độc', 'malware', 'virus', 'ransomware', 'cập nhật hđh', 'bảo vệ phần cứng'] },
    { code: '4.2', keywords: ['dữ liệu cá nhân', 'quyền riêng tư', 'nghị định 13', 'mật khẩu', '2fa', 'otp', 'phishing'] },
    { code: '4.3', keywords: ['sức khỏe', 'an sinh', 'bắt nạt mạng', 'cyberbullying', 'nghiện mạng', 'thời gian sử dụng'] },
    { code: '4.4', keywords: ['môi trường', 'rác thải điện tử', 'tiết kiệm năng lượng', 'dấu chân carbon'] }
  ],
  MIEN_5: [
    { code: '5.1', keywords: ['sự cố kỹ thuật', 'khắc phục lỗi', 'mất kết nối', 'sửa lỗi', 'troubleshoot'] },
    { code: '5.2', keywords: ['nhu cầu công nghệ', 'giải pháp', 'lựa chọn công cụ', 'phần mềm phù hợp'] },
    { code: '5.3', keywords: ['sáng tạo số', 'đổi mới quy trình', 'ứng dụng linh hoạt', 'chuyển đổi số'] },
    { code: '5.4', keywords: ['khoảng trống năng lực', 'nâng cao kỹ năng', 'bồi dưỡng năng lực', 'học tập số'] }
  ],
  MIEN_6: [
    { code: '6.1', keywords: ['ai', 'trí tuệ nhân tạo', 'genai', 'generative ai', 'llm', 'chatgpt', 'gemini'] },
    { code: '6.2', keywords: ['prompt', 'câu lệnh', 'kỹ thuật prompt', 'ngữ cảnh prompt', 'few-shot'] },
    { code: '6.3', keywords: ['đạo đức ai', 'liêm chính', 'thiên kiến', 'bias', 'ảo giác', 'hallucination', 'an toàn ai'] }
  ]
};

const COGNITIVE_LEVEL_RULES: Record<CognitiveLevel, string[]> = {
  NHAN_BIET: [
    'định nghĩa', 'khái niệm', 'văn bản nào', 'nghị định', 'thông tư', 'điều bao nhiêu', 
    'là gì', 'ai là', 'tên gọi', 'chữ viết tắt', 'viết tắt của', 'khi nào', 'năm nào', 
    'mức phạt', 'thời hạn', 'cơ quan nào'
  ],
  THONG_HIEU: [
    'tại sao', 'ý nghĩa', 'mục đích', 'phân biệt', 'đặc điểm', 'bản chất', 'nguyên nhân', 
    'hậu quả', 'so sánh', 'điểm khác nhau', 'điểm giống nhau', 'giải thích vì sao', 'thể hiện'
  ],
  VAN_DUNG: [
    'tình huống', 'bạn nên', 'cần làm gì', 'xử lý như thế nào', 'trong trường hợp', 'thao tác', 
    'bước đầu tiên', 'khi phát hiện', 'phương án', 'cách giải quyết', 'hành động nào', 'để bảo vệ'
  ],
  VAN_DUNG_CAO: [
    'chiến lược', 'giải pháp toàn diện', 'tối ưu hóa', 'đánh giá rủi ro', 'thiết kế giải pháp', 
    'mô hình', 'kịch bản ứng phó', 'tổng thể', 'phân tích sâu', 'đề xuất chính sách'
  ]
};

/**
 * Classifies a single question based on content and the 6x4 coverage matrix deficit.
 */
export function classifyAndTagWithMatrixCoverage(
  question: QuestionItem,
  matrix2D?: Record<DigitalCompetencyDomainKey, Record<CognitiveLevel, number>>
): MatrixClassificationAndTagResult {
  // 1. Text analysis
  const text = [
    question.question_text || '',
    question.explanation || '',
    question.legal_reference || '',
    question.category || '',
    JSON.stringify(question.options || {})
  ].join(' ').toLowerCase();

  // 2. Score all 6 domains
  const domainScores: Record<DigitalCompetencyDomainKey, number> = {
    MIEN_1: 0,
    MIEN_2: 0,
    MIEN_3: 0,
    MIEN_4: 0,
    MIEN_5: 0,
    MIEN_6: 0
  };

  const domainMatchedKws: Record<DigitalCompetencyDomainKey, string[]> = {
    MIEN_1: [],
    MIEN_2: [],
    MIEN_3: [],
    MIEN_4: [],
    MIEN_5: [],
    MIEN_6: []
  };

  CATEGORIZATION_RULES.forEach(rule => {
    if (!rule.domainKey) return;
    rule.keywords.forEach(kw => {
      if (text.includes(kw.toLowerCase())) {
        domainScores[rule.domainKey!] += rule.weight;
        domainMatchedKws[rule.domainKey!].push(kw);
      }
    });
  });

  // Domain affinity bonus if question already has domain assigned
  if (question.digital_competency_domain && domainScores[question.digital_competency_domain] !== undefined) {
    domainScores[question.digital_competency_domain] += 2.5;
  }

  // 3. Matrix deficit evaluation:
  // Domains with lower total count in the matrix receive a coverage boost (+1 to +2.5)
  if (matrix2D) {
    const domainTotals: Record<DigitalCompetencyDomainKey, number> = {
      MIEN_1: Object.values(matrix2D.MIEN_1 || {}).reduce((a, b) => a + b, 0),
      MIEN_2: Object.values(matrix2D.MIEN_2 || {}).reduce((a, b) => a + b, 0),
      MIEN_3: Object.values(matrix2D.MIEN_3 || {}).reduce((a, b) => a + b, 0),
      MIEN_4: Object.values(matrix2D.MIEN_4 || {}).reduce((a, b) => a + b, 0),
      MIEN_5: Object.values(matrix2D.MIEN_5 || {}).reduce((a, b) => a + b, 0),
      MIEN_6: Object.values(matrix2D.MIEN_6 || {}).reduce((a, b) => a + b, 0)
    };

    const minDomainCount = Math.min(...Object.values(domainTotals));
    (Object.keys(domainTotals) as DigitalCompetencyDomainKey[]).forEach(d => {
      if (domainTotals[d] === minDomainCount) {
        domainScores[d] += 2.0; // Boost deficit domain
      } else if (domainTotals[d] < 12) {
        domainScores[d] += 1.0;
      }
    });
  }

  // Find best domain
  let bestDomain: DigitalCompetencyDomainKey = question.digital_competency_domain || 'MIEN_1';
  let highestScore = -1;
  (Object.keys(domainScores) as DigitalCompetencyDomainKey[]).forEach(d => {
    if (domainScores[d] > highestScore) {
      highestScore = domainScores[d];
      bestDomain = d;
    }
  });

  // 4. Infer or balance Cognitive Level
  const levelScores: Record<CognitiveLevel, number> = {
    NHAN_BIET: 0,
    THONG_HIEU: 0,
    VAN_DUNG: 0,
    VAN_DUNG_CAO: 0
  };

  (Object.keys(COGNITIVE_LEVEL_RULES) as CognitiveLevel[]).forEach(lvl => {
    COGNITIVE_LEVEL_RULES[lvl].forEach(cue => {
      if (text.includes(cue)) {
        levelScores[lvl] += 1.5;
      }
    });
  });

  if (question.cognitive_level && levelScores[question.cognitive_level] !== undefined) {
    levelScores[question.cognitive_level] += 2.0;
  }

  // Matrix cell deficit balancing:
  // Check the cell matrix2D[bestDomain][lvl]
  let isDeficit = false;
  if (matrix2D && matrix2D[bestDomain]) {
    (Object.keys(levelScores) as CognitiveLevel[]).forEach(lvl => {
      const cellCount = matrix2D[bestDomain][lvl] || 0;
      if (cellCount < 3) {
        // Boost deficit cell
        levelScores[lvl] += (3 - cellCount) * 1.2;
      }
    });
  }

  let bestLevel: CognitiveLevel = question.cognitive_level || 'THONG_HIEU';
  let highestLvlScore = -1;
  (Object.keys(levelScores) as CognitiveLevel[]).forEach(lvl => {
    if (levelScores[lvl] > highestLvlScore) {
      highestLvlScore = levelScores[lvl];
      bestLevel = lvl;
    }
  });

  if (matrix2D && matrix2D[bestDomain] && (matrix2D[bestDomain][bestLevel] || 0) < 3) {
    isDeficit = true;
  }

  // 5. Sub-competency inference
  let subCode = question.digital_sub_competency || `${bestDomain.replace('MIEN_', '')}.1`;
  const subOptions = DOMAIN_SUB_COMPETENCIES[bestDomain] || [];
  let maxSubScore = 0;
  for (const sub of subOptions) {
    let sScore = 0;
    for (const kw of sub.keywords) {
      if (text.includes(kw)) sScore++;
    }
    if (sScore > maxSubScore) {
      maxSubScore = sScore;
      subCode = sub.code;
    }
  }

  // 6. Category mapping
  const rule = CATEGORIZATION_RULES.find(r => r.domainKey === bestDomain);
  const categoryName = rule?.categoryName || question.category || 'Năng lực số BTI 2026';

  // 7. Intelligent Tag Generation
  const DOMAIN_TAG_NAMES: Record<DigitalCompetencyDomainKey, string> = {
    MIEN_1: 'Mien1_KhaiThacDuLieu',
    MIEN_2: 'Mien2_GiaoTiepSo',
    MIEN_3: 'Mien3_SangTaoNoiDung',
    MIEN_4: 'Mien4_AnToanBaoMat',
    MIEN_5: 'Mien5_GiaiQuyetVanDe',
    MIEN_6: 'Mien6_TriTueNhanTao'
  };

  const LEVEL_TAG_NAMES: Record<CognitiveLevel, string> = {
    NHAN_BIET: 'NhanBiet',
    THONG_HIEU: 'ThongHieu',
    VAN_DUNG: 'VanDung',
    VAN_DUNG_CAO: 'VanDungCao'
  };

  const newTags: string[] = [];
  newTags.push(DOMAIN_TAG_NAMES[bestDomain]);
  newTags.push(LEVEL_TAG_NAMES[bestLevel]);
  newTags.push(`Chuan_${subCode}`);

  if (isDeficit) {
    newTags.push('BoSung_DoPhu_MaTran');
  } else {
    newTags.push('DatChuan_DoPhu');
  }
  newTags.push('MaTran_BTI2026');

  // Topic specific tags
  if (text.includes('nghị định 13') || text.includes('13/2023')) newTags.push('NghiDinh13_DuLieuCaNhan');
  if (text.includes('nghị định 15') || text.includes('15/2020')) newTags.push('NghiDinh15_AnNinhMang');
  if (text.includes('thông tư 02') || text.includes('02/2025')) newTags.push('ThongTu02_BGDDT');
  if (text.includes('luật an ninh mạng')) newTags.push('LuatAnNinhMang');
  if (text.includes('2fa') || text.includes('xác thực hai yếu tố') || text.includes('otp')) newTags.push('BaoMat_2FA');
  if (text.includes('phishing') || text.includes('lừa đảo')) newTags.push('ChongPhishing');
  if (text.includes('ai') || text.includes('gemini') || text.includes('chatgpt') || text.includes('genai')) newTags.push('GenAI_Prompt');
  if (text.includes('deepfake')) newTags.push('NhanDien_Deepfake');
  if (text.includes('bản quyền') || text.includes('creative commons')) newTags.push('BanQuyen_CreativeCommons');
  if (text.includes('netiquette') || text.includes('quy tắc ứng xử')) newTags.push('VanHoaMang_Netiquette');

  // Add matched keywords from rule
  const matched = domainMatchedKws[bestDomain] || [];
  matched.slice(0, 2).forEach(kw => {
    const cleanTag = kw.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_đàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/gi, '');
    if (cleanTag && cleanTag.length >= 3 && cleanTag.length <= 25) {
      newTags.push(cleanTag);
    }
  });

  // Merge with existing tags
  const existingTags = question.tags || [];
  const allTags = Array.from(new Set([...existingTags, ...newTags]));

  const reasoning = `Phân loại ${bestDomain} - Mức ${bestLevel} (${isDeficit ? 'Bổ sung ô thiếu ma trận' : 'Đạt chuẩn độ phủ'})`;

  return {
    domain: bestDomain,
    subCompetency: subCode,
    level: bestLevel,
    category: categoryName,
    newTags,
    allTags,
    isDeficitFiller: isDeficit,
    reasoning
  };
}

/**
 * Automatically classifies domain, cognitive level, category, and assigns semantic tags
 * based on question content AND coverage matrix deficits for a batch of questions.
 */
export function batchClassifyAndTagWithMatrix(
  questionIds: string[],
  statusUpdate?: ApprovalStatus
): {
  processedCount: number;
  tagsAddedCount: number;
  domainUpdatedCount: number;
  levelUpdatedCount: number;
  categoryUpdatedCount: number;
  deficitFilledCount: number;
  details: Array<{
    id: string;
    domain: DigitalCompetencyDomainKey;
    level: CognitiveLevel;
    category: string;
    addedTags: string[];
    isDeficitFiller: boolean;
  }>;
} {
  const allQuestions = questionBankManager.getQuestions();
  const qMap = new Map(allQuestions.map(q => [q.id, q]));

  // Get current matrix2D clone to allow dynamic balancing within the batch
  const matrixStats = questionBankManager.getMatrixStats();
  const matrix2DClone: Record<DigitalCompetencyDomainKey, Record<CognitiveLevel, number>> = JSON.parse(
    JSON.stringify(matrixStats.matrix2D)
  );

  let processedCount = 0;
  let tagsAddedCount = 0;
  let domainUpdatedCount = 0;
  let levelUpdatedCount = 0;
  let categoryUpdatedCount = 0;
  let deficitFilledCount = 0;
  const details: any[] = [];

  const currentUser = questionBankManager.getCurrentUser();

  questionIds.forEach(id => {
    const q = qMap.get(id);
    if (!q) return;

    const result = classifyAndTagWithMatrixCoverage(q, matrix2DClone);

    const oldDomain = q.digital_competency_domain;
    const oldLevel = q.cognitive_level;
    const oldCategory = q.category;
    const oldTags = new Set(q.tags || []);
    const newlyAddedTags = result.newTags.filter(t => !oldTags.has(t));

    if (result.domain !== oldDomain) domainUpdatedCount++;
    if (result.level !== oldLevel) levelUpdatedCount++;
    if (result.category !== oldCategory) categoryUpdatedCount++;
    if (result.isDeficitFiller) deficitFilledCount++;
    tagsAddedCount += newlyAddedTags.length;

    // Update dynamic matrix clone so subsequent questions in the batch balance coverage
    if (matrix2DClone[result.domain] && matrix2DClone[result.domain][result.level] !== undefined) {
      matrix2DClone[result.domain][result.level]++;
    }

    const updates: Partial<QuestionItem> = {
      ...(statusUpdate ? { approval_status: statusUpdate } : {}),
      digital_competency_domain: result.domain,
      digital_sub_competency: result.subCompetency,
      cognitive_level: result.level,
      category: result.category,
      tags: result.allTags,
      ...(statusUpdate === 'APPROVED' ? { approved_by: currentUser.name } : {})
    };

    questionBankManager.updateQuestion(
      id, 
      updates, 
      `Batch update [${statusUpdate || 'TRẠNG THÁI'}]: Tự động phân loại ${result.domain} (${result.level}) và gắn ${newlyAddedTags.length} thẻ ma trận độ phủ.`
    );
    processedCount++;

    details.push({
      id: q.id,
      domain: result.domain,
      level: result.level,
      category: result.category,
      addedTags: newlyAddedTags,
      isDeficitFiller: result.isDeficitFiller
    });
  });

  // Sync any newly created categories or tags
  questionBankManager.syncCategoriesFromQuestions();

  return {
    processedCount,
    tagsAddedCount,
    domainUpdatedCount,
    levelUpdatedCount,
    categoryUpdatedCount,
    deficitFilledCount,
    details
  };
}



