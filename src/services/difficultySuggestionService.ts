import { 
  QuestionItem, 
  CognitiveLevel, 
  DigitalCompetencyDomainKey 
} from '../types';
import { questionBankManager } from './questionBankManager';
import { COGNITIVE_LEVELS, DIGITAL_COMPETENCY_DOMAINS } from '../data/digitalCompetencyData';

export interface ComplexityFactors {
  lengthScore: number;       // 1.0 - 4.0 based on length & depth
  verbScore: number;         // 1.0 - 4.0 based on Bloom action verbs
  scenarioScore: number;     // 1.0 - 4.0 based on practical scenario context
  technicalDensityScore: number; // 1.0 - 4.0 based on specialized terminology
  distractorScore: number;   // 1.0 - 4.0 based on option choices nuance
  verifiedNeighborScore: number; // 1.0 - 4.0 based on similar verified questions
}

export interface VerifiedNeighborMatch {
  id: string;
  questionText: string;
  verifiedLevel: CognitiveLevel;
  domain?: DigitalCompetencyDomainKey;
  similarityPercentage: number;
}

export interface DifficultySuggestionResult {
  suggestedLevel: CognitiveLevel;
  confidenceScore: number;      // 0 - 100%
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  complexityIndex: number;      // 1.00 - 4.00
  reasoning: string;
  matchedKeywords: string[];
  matchedActionVerbs: string[];
  similarVerifiedQuestions: VerifiedNeighborMatch[];
  factors: ComplexityFactors;
  levelComparison: {
    currentLevel?: CognitiveLevel;
    matchesCurrent: boolean;
    recommendationNote: string;
  };
}

export interface BatchDifficultySuggestionItem {
  questionId: string;
  questionText: string;
  currentLevel: CognitiveLevel;
  suggestedLevel: CognitiveLevel;
  confidenceScore: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  complexityIndex: number;
  reasoning: string;
  similarVerifiedCount: number;
}

export interface BatchDifficultyAnalysisSummary {
  totalAnalyzed: number;
  totalWithSuggestedChange: number;
  bySuggestedLevel: Record<CognitiveLevel, number>;
  averageComplexity: number;
  items: BatchDifficultySuggestionItem[];
}

// Action Verbs Dictionary grouped by Bloom's Taxonomy & TT 02/2025
const ACTION_VERBS_DICTIONARY: Record<CognitiveLevel, { verbs: string[]; weight: number }> = {
  NHAN_BIET: {
    verbs: [
      'là gì', 'định nghĩa', 'nêu', 'liệt kê', 'chỉ ra', 'kể tên', 'nhắc lại', 'nhận biết',
      'chọn đúng', 'kí hiệu', 'ký hiệu', 'tên gọi', 'bao nhiêu', 'ở đâu', 'năm nào',
      'đúng hay sai', 'phím tắt', 'tổ hợp phím', 'thuộc loại', 'viết tắt của', 'khái niệm'
    ],
    weight: 1.0
  },
  THONG_HIEU: {
    verbs: [
      'giải thích', 'tại sao', 'vì sao', 'ý nghĩa', 'so sánh', 'phân biệt', 'minh họa',
      'thể hiện', 'phân loại', 'mô tả', 'tóm tắt', 'bản chất', 'nguyên lý', 'hiểu thế nào',
      'mục đích của', 'cho thấy', 'dấu hiệu nào', 'đặc điểm chính', 'liên hệ'
    ],
    weight: 2.0
  },
  VAN_DUNG: {
    verbs: [
      'áp dụng', 'sử dụng', 'xử lý', 'thực hiện', 'cần làm gì', 'phải làm gì', 'khắc phục',
      'thiết lập', 'cấu hình', 'hướng dẫn', 'tính toán', 'bước tiếp theo', 'tình huống',
      'thao tác nào', 'phương án an toàn', 'phòng tránh', 'sao lưu', 'bảo vệ', 'sửa lỗi',
      'tìm kiếm nâng cao', 'kiểm chứng', 'xác thực'
    ],
    weight: 3.0
  },
  VAN_DUNG_CAO: {
    verbs: [
      'đánh giá', 'phản biện', 'thẩm định', 'thiết kế', 'kiến tạo', 'xây dựng giải pháp',
      'phân tích rủi ro', 'tối ưu hóa', 'giải pháp toàn diện', 'so sánh đa chiều',
      'nhận định nào đúng đắn nhất', 'dự đoán xu hướng', 'đề xuất chiến lược',
      'xử lý xung đột', 'tình huống phức tạp', 'tấn công có chủ đích', 'lỗ hổng zero-day'
    ],
    weight: 4.0
  }
};

// Specialized Technical Terminology & Domain Weighting
const TECHNICAL_TERMS: { term: string; weight: number }[] = [
  // High complexity terms (Weight 3.5 - 4.0)
  { term: 'zero-day', weight: 4.0 },
  { term: 'buffer overflow', weight: 4.0 },
  { term: 'cryptanalysis', weight: 4.0 },
  { term: 'mật mã bất đối xứng', weight: 3.8 },
  { term: 'rsa', weight: 3.5 },
  { term: 'blockchain', weight: 3.5 },
  { term: 'smart contract', weight: 3.8 },
  { term: 'ddos', weight: 3.5 },
  { term: 'botnet', weight: 3.5 },
  { term: 'adversarial attack', weight: 4.0 },
  { term: 'hallucination', weight: 3.5 },
  { term: 'generative ai', weight: 3.5 },
  { term: 'fine-tuning', weight: 3.8 },
  { term: 'version history', weight: 2.5 },
  { term: 'cross-site scripting', weight: 3.8 },
  { term: 'sql injection', weight: 3.8 },

  // Medium complexity terms (Weight 2.0 - 3.0)
  { term: 'phishing', weight: 2.8 },
  { term: 'ransomware', weight: 3.0 },
  { term: 'malware', weight: 2.6 },
  { term: 'xác thực hai yếu tố', weight: 2.7 },
  { term: '2fa', weight: 2.7 },
  { term: 'otp', weight: 2.4 },
  { term: 'nghị định 13', weight: 3.0 },
  { term: 'luật an ninh mạng', weight: 2.8 },
  { term: 'thông tư 02', weight: 2.5 },
  { term: 'creative commons', weight: 2.6 },
  { term: 'bản quyền', weight: 2.3 },
  { term: 'sao lưu 3-2-1', weight: 2.8 },
  { term: 'netiquette', weight: 2.2 },
  { term: 'deepfake', weight: 3.2 }
];

export class DifficultySuggestionService {

  /**
   * Main Background Analysis: Suggests Difficulty Level for a given question
   * by analyzing syntax, verbs, scenario depth and comparing against verified questions.
   */
  public suggestDifficulty(
    question: Partial<QuestionItem>,
    existingQuestions?: QuestionItem[]
  ): DifficultySuggestionResult {
    const qText = (question.question_text || '').trim();
    const explanation = (question.explanation || '').trim();
    const options = question.options || {};
    const optionValues = Object.values(options);
    const combinedContent = `${qText} ${explanation} ${optionValues.join(' ')}`.toLowerCase();

    // 1. Get Verified Questions from Bank as Ground Truth Reference
    const bankQuestions = existingQuestions || questionBankManager.getQuestions();
    const verifiedQuestions = bankQuestions.filter(q => 
      (q.approval_status === 'APPROVED' || q.approval_status === 'PENDING_REVIEW') &&
      q.id !== question.id &&
      q.question_text &&
      q.question_text.length > 5
    );

    // If question text is empty or very short
    if (qText.length < 5) {
      return {
        suggestedLevel: 'THONG_HIEU',
        confidenceScore: 30,
        confidenceLevel: 'LOW',
        complexityIndex: 2.0,
        reasoning: 'Nội dung câu hỏi quá ngắn để phân tích chi tiết. Mặc định ở mức Thông hiểu.',
        matchedKeywords: [],
        matchedActionVerbs: [],
        similarVerifiedQuestions: [],
        factors: {
          lengthScore: 2.0,
          verbScore: 2.0,
          scenarioScore: 2.0,
          technicalDensityScore: 2.0,
          distractorScore: 2.0,
          verifiedNeighborScore: 2.0
        },
        levelComparison: {
          currentLevel: question.cognitive_level,
          matchesCurrent: question.cognitive_level === 'THONG_HIEU',
          recommendationNote: 'Nhập thêm nội dung chi tiết để hệ thống phân tích chính xác hơn.'
        }
      };
    }

    // ========================================================
    // FACTOR 1: Lexical Length & Scenario Narrative Complexity
    // ========================================================
    const words = qText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    let lengthScore = 1.0;

    if (wordCount < 12) lengthScore = 1.2;
    else if (wordCount <= 25) lengthScore = 2.0;
    else if (wordCount <= 45) lengthScore = 2.9;
    else lengthScore = 3.7; // Long narrative, complex scenario

    // Check for scenario indicators
    const isScenario = /một\s+học\s+sinh|một\s+người\s+dùng|trong\s+tình\s+huống|khi\s+gặp\s+sự\s+cố|giả\s+sử|hãy\s+xử\s+lý|tình\s+huống\s*\:/i.test(qText);
    const scenarioScore = isScenario ? (wordCount > 30 ? 3.8 : 3.2) : (wordCount < 15 ? 1.2 : 2.0);

    // ========================================================
    // FACTOR 2: Bloom's Taxonomy Action Verbs Detection
    // ========================================================
    const matchedVerbs: { verb: string; level: CognitiveLevel; weight: number }[] = [];
    const levelCounts: Record<CognitiveLevel, number> = {
      NHAN_BIET: 0,
      THONG_HIEU: 0,
      VAN_DUNG: 0,
      VAN_DUNG_CAO: 0
    };

    (Object.keys(ACTION_VERBS_DICTIONARY) as CognitiveLevel[]).forEach(lvl => {
      const config = ACTION_VERBS_DICTIONARY[lvl];
      config.verbs.forEach(v => {
        if (combinedContent.includes(v)) {
          matchedVerbs.push({ verb: v, level: lvl, weight: config.weight });
          levelCounts[lvl]++;
        }
      });
    });

    let verbScore = 2.0; // Baseline
    if (matchedVerbs.length > 0) {
      const weightedSum = matchedVerbs.reduce((acc, v) => acc + v.weight, 0);
      verbScore = Number((weightedSum / matchedVerbs.length).toFixed(2));
    }

    // ========================================================
    // FACTOR 3: Specialized Technical Terminology Density
    // ========================================================
    const matchedTerms: string[] = [];
    let termWeightsSum = 0;

    TECHNICAL_TERMS.forEach(item => {
      if (combinedContent.includes(item.term)) {
        matchedTerms.push(item.term);
        termWeightsSum += item.weight;
      }
    });

    let technicalDensityScore = 2.0;
    if (matchedTerms.length > 0) {
      technicalDensityScore = Math.min(4.0, Number((termWeightsSum / matchedTerms.length).toFixed(2)));
    }

    // ========================================================
    // FACTOR 4: Option Choices / Distractors Complexity
    // ========================================================
    let distractorScore = 2.0;
    if (optionValues.length > 0) {
      const avgOptionLength = optionValues.reduce((sum, opt) => sum + opt.length, 0) / optionValues.length;
      if (avgOptionLength < 15) distractorScore = 1.3; // Short single-word choices
      else if (avgOptionLength <= 40) distractorScore = 2.2;
      else if (avgOptionLength <= 80) distractorScore = 3.1;
      else distractorScore = 3.8; // Detailed paragraph-style choices
    }

    // ========================================================
    // FACTOR 5: Nearest Neighbor Matching against Verified Questions
    // ========================================================
    const neighborMatches: VerifiedNeighborMatch[] = [];

    if (verifiedQuestions.length > 0) {
      const qTokens = this.tokenizeText(qText);

      verifiedQuestions.forEach(verifiedQ => {
        const vTokens = this.tokenizeText(verifiedQ.question_text || '');
        const sim = this.calculateJaccardSimilarity(qTokens, vTokens);

        if (sim > 0.15) { // Meaningful overlap threshold
          neighborMatches.push({
            id: verifiedQ.id,
            questionText: verifiedQ.question_text,
            verifiedLevel: verifiedQ.cognitive_level || 'THONG_HIEU',
            domain: verifiedQ.digital_competency_domain,
            similarityPercentage: Math.round(sim * 100)
          });
        }
      });

      // Sort by similarity descending and pick top 3
      neighborMatches.sort((a, b) => b.similarityPercentage - a.similarityPercentage);
    }

    const topNeighbors = neighborMatches.slice(0, 3);
    let verifiedNeighborScore = verbScore; // Fallback to verbScore if no neighbors

    if (topNeighbors.length > 0) {
      const levelToWeight: Record<CognitiveLevel, number> = {
        NHAN_BIET: 1.0,
        THONG_HIEU: 2.0,
        VAN_DUNG: 3.0,
        VAN_DUNG_CAO: 4.0
      };

      let neighborWeightedSum = 0;
      let weightTotal = 0;

      topNeighbors.forEach(n => {
        const w = levelToWeight[n.verifiedLevel] || 2.0;
        const simWeight = n.similarityPercentage / 100;
        neighborWeightedSum += w * simWeight;
        weightTotal += simWeight;
      });

      if (weightTotal > 0) {
        verifiedNeighborScore = Number((neighborWeightedSum / weightTotal).toFixed(2));
      }
    }

    // ========================================================
    // FINAL COMPOSITE COMPLEXITY INDEX (1.00 - 4.00)
    // ========================================================
    // Weight allocations:
    // - Action Verbs: 30%
    // - Verified Nearest Neighbors: 25%
    // - Scenario & Context Depth: 20%
    // - Technical Terminology: 15%
    // - Options Complexity: 10%
    const compositeIndex = Number((
      (verbScore * 0.30) +
      (verifiedNeighborScore * 0.25) +
      (scenarioScore * 0.20) +
      (technicalDensityScore * 0.15) +
      (distractorScore * 0.10)
    ).toFixed(2));

    // Map Composite Index to Cognitive Level
    let suggestedLevel: CognitiveLevel = 'THONG_HIEU';
    if (compositeIndex < 1.75) suggestedLevel = 'NHAN_BIET';
    else if (compositeIndex < 2.55) suggestedLevel = 'THONG_HIEU';
    else if (compositeIndex < 3.35) suggestedLevel = 'VAN_DUNG';
    else suggestedLevel = 'VAN_DUNG_CAO';

    // Calculate Confidence Score
    let confidenceScore = 65; // Base confidence
    if (topNeighbors.length > 0 && topNeighbors[0].similarityPercentage >= 60) confidenceScore += 20;
    if (matchedVerbs.length >= 2) confidenceScore += 10;
    if (matchedTerms.length >= 2) confidenceScore += 5;
    confidenceScore = Math.min(98, confidenceScore);

    const confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 
      confidenceScore >= 80 ? 'HIGH' : confidenceScore >= 60 ? 'MEDIUM' : 'LOW';

    // Build Detailed Human-Readable Reasoning
    const reasoningParts: string[] = [];
    const levelName = COGNITIVE_LEVELS[suggestedLevel]?.name || suggestedLevel;

    if (isScenario) {
      reasoningParts.push('Có ngữ cảnh tình huống thực tế');
    }
    if (matchedVerbs.length > 0) {
      reasoningParts.push(`Chứa các động từ hành động đặc trưng: "${matchedVerbs.map(v => v.verb).slice(0, 3).join('", "')}"`);
    }
    if (matchedTerms.length > 0) {
      reasoningParts.push(`Mật độ thuật ngữ chuyên sâu: ${matchedTerms.slice(0, 3).join(', ')}`);
    }
    if (topNeighbors.length > 0) {
      reasoningParts.push(`Tương đồng với ${topNeighbors.length} câu hỏi đã thẩm định mức ${COGNITIVE_LEVELS[topNeighbors[0].verifiedLevel]?.name || topNeighbors[0].verifiedLevel} (${topNeighbors[0].similarityPercentage}%)`);
    }

    const reasoning = reasoningParts.length > 0
      ? `Được xếp vào mức ${levelName} (Điểm phức hợp ${compositeIndex}/4.0): ${reasoningParts.join('; ')}.`
      : `Phân tích cấu trúc câu và từ vựng tương đương mức ${levelName} (${compositeIndex}/4.0).`;

    const matchesCurrent = question.cognitive_level === suggestedLevel;
    let recommendationNote = 'Mức độ nhận thức hiện tại hoàn toàn phù hợp.';
    if (!matchesCurrent && question.cognitive_level) {
      recommendationNote = `Đề xuất chuyển từ ${COGNITIVE_LEVELS[question.cognitive_level]?.name || question.cognitive_level} sang ${levelName} để phản ánh đúng độ phức tạp của câu hỏi.`;
    }

    return {
      suggestedLevel,
      confidenceScore,
      confidenceLevel,
      complexityIndex: compositeIndex,
      reasoning,
      matchedKeywords: matchedTerms,
      matchedActionVerbs: matchedVerbs.map(v => v.verb),
      similarVerifiedQuestions: topNeighbors,
      factors: {
        lengthScore,
        verbScore,
        scenarioScore,
        technicalDensityScore,
        distractorScore,
        verifiedNeighborScore
      },
      levelComparison: {
        currentLevel: question.cognitive_level,
        matchesCurrent,
        recommendationNote
      }
    };
  }

  /**
   * Batch Analysis: Runs difficulty evaluation across all or unverified questions in bank
   */
  public analyzeBatchQuestions(
    questions: QuestionItem[],
    onlyUnverified = false
  ): BatchDifficultyAnalysisSummary {
    const targetQuestions = onlyUnverified 
      ? questions.filter(q => q.approval_status !== 'APPROVED')
      : questions;

    const items: BatchDifficultySuggestionItem[] = [];
    const bySuggestedLevel: Record<CognitiveLevel, number> = {
      NHAN_BIET: 0,
      THONG_HIEU: 0,
      VAN_DUNG: 0,
      VAN_DUNG_CAO: 0
    };

    let totalScoreSum = 0;
    let changeCount = 0;

    targetQuestions.forEach(q => {
      const res = this.suggestDifficulty(q, questions);
      const isDifferent = q.cognitive_level !== res.suggestedLevel;
      if (isDifferent) changeCount++;

      bySuggestedLevel[res.suggestedLevel]++;
      totalScoreSum += res.complexityIndex;

      items.push({
        questionId: q.id,
        questionText: q.question_text || '',
        currentLevel: q.cognitive_level || 'THONG_HIEU',
        suggestedLevel: res.suggestedLevel,
        confidenceScore: res.confidenceScore,
        confidenceLevel: res.confidenceLevel,
        complexityIndex: res.complexityIndex,
        reasoning: res.reasoning,
        similarVerifiedCount: res.similarVerifiedQuestions.length
      });
    });

    const averageComplexity = targetQuestions.length > 0 
      ? Number((totalScoreSum / targetQuestions.length).toFixed(2)) 
      : 2.3;

    return {
      totalAnalyzed: targetQuestions.length,
      totalWithSuggestedChange: changeCount,
      bySuggestedLevel,
      averageComplexity,
      items
    };
  }

  /**
   * Apply Batch Suggestions to the Question Bank Manager
   */
  public applyBatchSuggestions(
    suggestions: { questionId: string; suggestedLevel: CognitiveLevel }[]
  ): { updatedCount: number } {
    let updatedCount = 0;
    suggestions.forEach(item => {
      const q = questionBankManager.getQuestionById(item.questionId);
      if (q && q.cognitive_level !== item.suggestedLevel) {
        questionBankManager.updateQuestion(item.questionId, {
          cognitive_level: item.suggestedLevel
        });
        updatedCount++;
      }
    });

    return { updatedCount };
  }

  // ==========================================
  // HELPER TOKENIZER & SIMILARITY FUNCTIONS
  // ==========================================
  private tokenizeText(text: string): Set<string> {
    const clean = text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'<>]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = clean.split(' ').filter(w => w.length >= 2);
    
    // Also build bi-grams for better Vietnamese phrase matching
    const tokens = new Set<string>(words);
    for (let i = 0; i < words.length - 1; i++) {
      tokens.add(`${words[i]} ${words[i + 1]}`);
    }

    return tokens;
  }

  private calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 || setB.size === 0) return 0;
    let intersection = 0;
    setA.forEach(item => {
      if (setB.has(item)) intersection++;
    });
    const union = setA.size + setB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }
}

export const difficultySuggestionService = new DifficultySuggestionService();
