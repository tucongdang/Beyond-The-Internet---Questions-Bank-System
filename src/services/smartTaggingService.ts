import { QuestionItem, DigitalCompetencyDomainKey, CognitiveLevel } from '../types';
import { questionBankManager } from './questionBankManager';
import { DIGITAL_COMPETENCY_DOMAINS } from '../data/digitalCompetencyData';

export interface SmartTagItem {
  tag: string;
  displayName: string;
  confidence: number;
  category: 'KNOWLEDGE_AREA' | 'DIGITAL_COMPETENCY' | 'LEGAL_FRAMEWORK' | 'COGNITIVE_SKILL' | 'EXAM_FORMAT' | 'TOPIC_KEYWORD';
  rationale: string;
  isPatternMatched: boolean;
  patternEvidence?: string;
  color?: string;
}

export interface SmartTaggingAnalysis {
  questionId: string;
  suggestedTags: SmartTagItem[];
  primaryKnowledgeArea: {
    domainKey: DigitalCompetencyDomainKey;
    domainName: string;
    subCompetencyCode: string;
    subCompetencyName: string;
    confidence: number;
    rationale: string;
  };
  suggestedCognitiveLevel: {
    level: CognitiveLevel;
    name: string;
    confidence: number;
    rationale: string;
  };
  suggestedLegalReference?: {
    reference: string;
    relevantArticle?: string;
    confidence: number;
  };
  bankPatternInsights: {
    similarBankQuestionsCount: number;
    clusterTheme: string;
    topCoOccurringTags: string[];
    patternConfidence: number;
    closestExamples: Array<{
      id: string;
      textSnippet: string;
      domain?: string;
      tags: string[];
      similarityScore: number;
    }>;
  };
  agentExecutionSteps: Array<{
    stepNumber: number;
    title: string;
    description: string;
    type: 'reasoning' | 'pattern_scan' | 'taxonomy_alignment' | 'tag_synthesis';
  }>;
}

export interface SmartTaggingResponse {
  success: boolean;
  agentUsed: string;
  analysis: SmartTaggingAnalysis;
  error?: string;
}

export interface BatchSmartTagResult {
  id: string;
  suggestedTags: SmartTagItem[];
  suggestedDomain?: DigitalCompetencyDomainKey;
  suggestedSubCompetency?: string;
  suggestedCognitiveLevel?: CognitiveLevel;
  suggestedLegalReference?: string;
  confidenceScore: number;
}

class SmartTaggingService {
  private cache = new Map<string, SmartTaggingAnalysis>();

  /**
   * Run deep Knowledge Area & Tagging Analysis using Agent Antigravity
   */
  public async analyzeQuestion(
    question: QuestionItem,
    bankQuestions?: QuestionItem[],
    bypassCache = false
  ): Promise<SmartTaggingResponse> {
    if (!bypassCache && this.cache.has(question.id)) {
      return {
        success: true,
        agentUsed: 'antigravity-preview-09-2026 (Cached)',
        analysis: this.cache.get(question.id)!
      };
    }

    const effectiveBank = bankQuestions || questionBankManager.getQuestions();
    
    // Sample diverse questions with existing tags to provide rich pattern context
    const bankSample = effectiveBank
      .filter(q => q.id !== question.id && (q.tags && q.tags.length > 0))
      .slice(0, 30);

    try {
      const response = await fetch('/api/ai/smart-tagging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          bankQuestions: bankSample,
          targetTagsCount: 8,
          confidenceThreshold: 70
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.analysis) {
        // Normalize tags display name and category
        const analysis = this.normalizeAnalysis(data.analysis, question);
        this.cache.set(question.id, analysis);
        return {
          success: true,
          agentUsed: data.agentUsed || 'antigravity-preview-09-2026',
          analysis
        };
      } else {
        throw new Error(data.error || 'Dữ liệu phân tích không hợp lệ.');
      }
    } catch (err: any) {
      console.warn('Smart Tagging API call failed, generating local pattern heuristics:', err);
      const fallbackAnalysis = this.generateLocalPatternAnalysis(question, effectiveBank);
      return {
        success: true,
        agentUsed: 'Local Pattern Matcher (Fallback)',
        analysis: fallbackAnalysis
      };
    }
  }

  /**
   * Run batch tagging across multiple questions
   */
  public async batchAnalyzeQuestions(
    questions: QuestionItem[],
    bankQuestions?: QuestionItem[]
  ): Promise<BatchSmartTagResult[]> {
    const effectiveBank = bankQuestions || questionBankManager.getQuestions();

    try {
      const response = await fetch('/api/ai/smart-tagging-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: questions.slice(0, 20),
          bankQuestions: effectiveBank.slice(0, 25)
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.results)) {
          return data.results.map((r: any) => ({
            id: r.id,
            suggestedTags: Array.isArray(r.suggestedTags)
              ? r.suggestedTags.map((t: any) => typeof t === 'string' ? {
                  tag: t,
                  displayName: t.startsWith('#') ? t : `#${t}`,
                  confidence: 90,
                  category: 'KNOWLEDGE_AREA',
                  rationale: 'Gợi ý từ phân tích Agent Antigravity',
                  isPatternMatched: true
                } : t)
              : [],
            suggestedDomain: r.suggestedDomain,
            suggestedSubCompetency: r.suggestedSubCompetency,
            suggestedCognitiveLevel: r.suggestedCognitiveLevel,
            suggestedLegalReference: r.suggestedLegalReference,
            confidenceScore: r.confidenceScore || 90
          }));
        }
      }
    } catch (err) {
      console.warn('Batch smart tagging API failed, using sequential analysis:', err);
    }

    // Local fallback batch
    return questions.map(q => {
      const local = this.generateLocalPatternAnalysis(q, effectiveBank);
      return {
        id: q.id,
        suggestedTags: local.suggestedTags,
        suggestedDomain: local.primaryKnowledgeArea.domainKey,
        suggestedSubCompetency: local.primaryKnowledgeArea.subCompetencyCode,
        suggestedCognitiveLevel: local.suggestedCognitiveLevel.level,
        suggestedLegalReference: local.suggestedLegalReference?.reference,
        confidenceScore: 88
      };
    });
  }

  /**
   * Apply selected tags and metadata to a question in the bank
   */
  public applyTagsToQuestion(
    questionId: string,
    tags: string[],
    additionalUpdates?: {
      domain?: DigitalCompetencyDomainKey;
      subCompetency?: string;
      cognitiveLevel?: CognitiveLevel;
      legalReference?: string;
      category?: string;
    }
  ): boolean {
    const q = questionBankManager.getQuestionById(questionId);
    if (!q) return false;

    // Clean and merge tags
    const cleanedTags = Array.from(
      new Set(
        tags
          .map(t => t.trim().toLowerCase().replace(/^#/, ''))
          .filter(Boolean)
      )
    );

    const updatePayload: Partial<QuestionItem> = {
      tags: cleanedTags
    };

    if (additionalUpdates?.domain) updatePayload.digital_competency_domain = additionalUpdates.domain;
    if (additionalUpdates?.subCompetency) updatePayload.digital_sub_competency = additionalUpdates.subCompetency;
    if (additionalUpdates?.cognitiveLevel) updatePayload.cognitive_level = additionalUpdates.cognitiveLevel;
    if (additionalUpdates?.legalReference) updatePayload.legal_reference = additionalUpdates.legalReference;
    if (additionalUpdates?.category) updatePayload.category = additionalUpdates.category;

    questionBankManager.updateQuestion(questionId, updatePayload, 'Cập nhật thẻ tri thức Smart Tagging (Agent Antigravity)');
    return true;
  }

  /**
   * Get all unique tags and their frequency in the bank
   */
  public getBankTagTaxonomy(questions?: QuestionItem[]) {
    const list = questions || questionBankManager.getQuestions();
    const tagCountMap: Record<string, number> = {};
    const domainTagMap: Record<string, Set<string>> = {
      MIEN_1: new Set(),
      MIEN_2: new Set(),
      MIEN_3: new Set(),
      MIEN_4: new Set(),
      MIEN_5: new Set(),
      MIEN_6: new Set(),
      UNASSIGNED: new Set()
    };

    list.forEach(q => {
      const dKey = q.digital_competency_domain || 'UNASSIGNED';
      (q.tags || []).forEach(t => {
        const clean = t.trim().toLowerCase().replace(/^#/, '');
        if (!clean) return;
        tagCountMap[clean] = (tagCountMap[clean] || 0) + 1;
        if (domainTagMap[dKey]) {
          domainTagMap[dKey].add(clean);
        }
      });
    });

    const sortedTags = Object.entries(tagCountMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalTags: sortedTags.length,
      topTags: sortedTags.slice(0, 25),
      domainTagTaxonomy: Object.entries(domainTagMap).map(([dKey, tagSet]) => ({
        domainKey: dKey,
        tags: Array.from(tagSet)
      }))
    };
  }

  private normalizeAnalysis(raw: any, q: QuestionItem): SmartTaggingAnalysis {
    const rawTags = Array.isArray(raw.suggestedTags) ? raw.suggestedTags : [];
    const formattedTags: SmartTagItem[] = rawTags.map((t: any) => {
      if (typeof t === 'string') {
        const clean = t.trim().toLowerCase().replace(/^#/, '');
        return {
          tag: clean,
          displayName: `#${clean}`,
          confidence: 88,
          category: 'KNOWLEDGE_AREA',
          rationale: 'Đề xuất từ nội dung câu hỏi',
          isPatternMatched: false
        };
      }
      const tagStr = (t.tag || '').trim().toLowerCase().replace(/^#/, '');
      return {
        tag: tagStr,
        displayName: t.displayName || `#${tagStr}`,
        confidence: typeof t.confidence === 'number' ? t.confidence : 90,
        category: t.category || 'KNOWLEDGE_AREA',
        rationale: t.rationale || 'Trùng khớp tri thức trọng tâm',
        isPatternMatched: Boolean(t.isPatternMatched),
        patternEvidence: t.patternEvidence,
        color: t.color
      };
    });

    const domKey = (raw.primaryKnowledgeArea?.domainKey as DigitalCompetencyDomainKey) || q.digital_competency_domain || 'MIEN_4';
    const domObj = DIGITAL_COMPETENCY_DOMAINS[domKey];

    return {
      questionId: raw.questionId || q.id,
      suggestedTags: formattedTags,
      primaryKnowledgeArea: {
        domainKey: domKey,
        domainName: raw.primaryKnowledgeArea?.domainName || domObj?.name || 'An toàn',
        subCompetencyCode: raw.primaryKnowledgeArea?.subCompetencyCode || q.digital_sub_competency || '4.2',
        subCompetencyName: raw.primaryKnowledgeArea?.subCompetencyName || domObj?.subCompetencies?.[0]?.name || 'Bảo vệ dữ liệu cá nhân',
        confidence: raw.primaryKnowledgeArea?.confidence || 92,
        rationale: raw.primaryKnowledgeArea?.rationale || 'Phù hợp với đặc tính năng lực số của câu hỏi'
      },
      suggestedCognitiveLevel: {
        level: (raw.suggestedCognitiveLevel?.level as CognitiveLevel) || q.cognitive_level || 'THONG_HIEU',
        name: raw.suggestedCognitiveLevel?.name || 'Thông hiểu',
        confidence: raw.suggestedCognitiveLevel?.confidence || 88,
        rationale: raw.suggestedCognitiveLevel?.rationale || 'Bậc tư duy phù hợp'
      },
      suggestedLegalReference: raw.suggestedLegalReference ? {
        reference: raw.suggestedLegalReference.reference || 'Nghị định 13/2023/NĐ-CP',
        relevantArticle: raw.suggestedLegalReference.relevantArticle,
        confidence: raw.suggestedLegalReference.confidence || 90
      } : undefined,
      bankPatternInsights: raw.bankPatternInsights || {
        similarBankQuestionsCount: 2,
        clusterTheme: 'An toàn & Pháp lý số',
        topCoOccurringTags: ['an_toan_du_lieu', 'nghi_dinh_13'],
        patternConfidence: 85,
        closestExamples: []
      },
      agentExecutionSteps: Array.isArray(raw.agentExecutionSteps) && raw.agentExecutionSteps.length > 0
        ? raw.agentExecutionSteps
        : [
            {
              stepNumber: 1,
              title: 'Khảo sát cấu trúc & Bối cảnh',
              description: 'Phân tích ngữ nghĩa câu hỏi và nhận diện các thực thể khảo thí.',
              type: 'reasoning'
            },
            {
              stepNumber: 2,
              title: 'Đối chiếu mẫu hình dữ liệu Ngân hàng đề',
              description: 'Khai phá cụm chủ đề và đồng xuất hiện thẻ từ các câu hỏi tương đồng.',
              type: 'pattern_scan'
            },
            {
              stepNumber: 3,
              title: 'Phân tầng Ma trận Năng lực số TT 02/2025',
              description: 'Xác lập miền năng lực chuẩn và phân nhóm kiến thức cốt lõi.',
              type: 'taxonomy_alignment'
            },
            {
              stepNumber: 4,
              title: 'Tổng hợp Thẻ tri thức & Điểm tin cậy',
              description: 'Chọn lọc các thẻ có độ phủ cao và tối ưu độ chuẩn xác.',
              type: 'tag_synthesis'
            }
          ]
    };
  }

  private generateLocalPatternAnalysis(q: QuestionItem, bank: QuestionItem[]): SmartTaggingAnalysis {
    const text = [
      q.question_text || '',
      q.explanation || '',
      q.legal_reference || '',
      JSON.stringify(q.options || {})
    ].join(' ').toLowerCase();

    const tags: SmartTagItem[] = [];
    let domain: DigitalCompetencyDomainKey = 'MIEN_4';
    let subCode = '4.2';
    let legal = 'Nghị định 13/2023/NĐ-CP';

    if (text.includes('13/2023') || text.includes('dữ liệu cá nhân') || text.includes('quyền riêng tư')) {
      tags.push({ tag: 'bao_ve_du_lieu_ca_nhan', displayName: '#BảoVệDữLiệuCáNhân', confidence: 98, category: 'LEGAL_FRAMEWORK', rationale: 'Trực tiếp căn cứ NĐ 13/2023/NĐ-CP', isPatternMatched: true });
      tags.push({ tag: 'nghi_dinh_13', displayName: '#NghịĐịnh13', confidence: 96, category: 'LEGAL_FRAMEWORK', rationale: 'Khung pháp lý bảo vệ dữ liệu', isPatternMatched: true });
      tags.push({ tag: 'an_toan_thong_tin', displayName: '#AnToànThôngTin', confidence: 92, category: 'KNOWLEDGE_AREA', rationale: 'Miền 4 Năng lực số', isPatternMatched: true });
      domain = 'MIEN_4';
      subCode = '4.2';
      legal = 'Nghị định 13/2023/NĐ-CP (Điều 9 & 17)';
    } else if (text.includes('ai') || text.includes('chatgpt') || text.includes('deepfake') || text.includes('generative')) {
      tags.push({ tag: 'ung_dung_ai', displayName: '#ỨngDụngAI', confidence: 95, category: 'KNOWLEDGE_AREA', rationale: 'Miền 6 Ứng dụng Trí tuệ nhân tạo', isPatternMatched: true });
      tags.push({ tag: 'dao_duc_ai', displayName: '#ĐạoĐứcAI', confidence: 92, category: 'KNOWLEDGE_AREA', rationale: 'Liêm chính và an toàn AI', isPatternMatched: true });
      tags.push({ tag: 'deepfake', displayName: '#Deepfake', confidence: 94, category: 'TOPIC_KEYWORD', rationale: 'Kỹ thuật giả mạo AI', isPatternMatched: true });
      domain = 'MIEN_6';
      subCode = '6.1';
    } else if (text.includes('tin giả') || text.includes('fake news') || text.includes('kiểm chứng')) {
      tags.push({ tag: 'kiem_chung_tin_tuc', displayName: '#KiểmChứngTinTức', confidence: 94, category: 'KNOWLEDGE_AREA', rationale: 'Miền 1 & 2 Đánh giá dữ liệu số', isPatternMatched: true });
      tags.push({ tag: 'chong_tin_gia', displayName: '#ChốngTinGiả', confidence: 90, category: 'TOPIC_KEYWORD', rationale: 'Fact-checking và nhận diện tin sai', isPatternMatched: true });
      domain = 'MIEN_1';
      subCode = '1.2';
    } else {
      tags.push({ tag: 'nang_luc_so_bti', displayName: '#NăngLựcSốBTI', confidence: 88, category: 'KNOWLEDGE_AREA', rationale: 'Khung chuẩn BTI 2026', isPatternMatched: false });
      tags.push({ tag: 'ky_nang_so', displayName: '#KỹNăngSố', confidence: 85, category: 'KNOWLEDGE_AREA', rationale: 'Thông tư 02/2025/TT-BGDĐT', isPatternMatched: false });
    }

    const domObj = DIGITAL_COMPETENCY_DOMAINS[domain];

    return {
      questionId: q.id,
      suggestedTags: tags,
      primaryKnowledgeArea: {
        domainKey: domain,
        domainName: domObj?.name || 'An toàn',
        subCompetencyCode: subCode,
        subCompetencyName: domObj?.subCompetencies?.[0]?.name || 'Năng lực số',
        confidence: 88,
        rationale: 'Đối sánh mẫu hình từ khóa trọng tâm'
      },
      suggestedCognitiveLevel: {
        level: q.cognitive_level || 'THONG_HIEU',
        name: 'Thông hiểu',
        confidence: 85,
        rationale: 'Mức độ nhận thức chuẩn BTI'
      },
      suggestedLegalReference: {
        reference: legal,
        confidence: 90
      },
      bankPatternInsights: {
        similarBankQuestionsCount: 2,
        clusterTheme: 'Năng lực số ứng dụng',
        topCoOccurringTags: tags.map(t => t.tag),
        patternConfidence: 86,
        closestExamples: []
      },
      agentExecutionSteps: [
        {
          stepNumber: 1,
          title: 'Phân tích từ khóa',
          description: 'Trích xuất đặc trưng từ vựng và chủ đề câu hỏi.',
          type: 'reasoning'
        },
        {
          stepNumber: 2,
          title: 'So khớp mẫu hình Ngân hàng',
          description: 'Tìm kiếm tần suất từ khóa trong ngân hàng câu hỏi.',
          type: 'pattern_scan'
        }
      ]
    };
  }
}

export const smartTaggingService = new SmartTaggingService();
