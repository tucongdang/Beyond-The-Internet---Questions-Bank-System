import { QuestionItem, DigitalCompetencyDomainKey, CustomCategory } from '../types';
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


