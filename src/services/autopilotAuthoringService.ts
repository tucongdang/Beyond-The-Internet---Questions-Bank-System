import { QuestionItem, DigitalCompetencyDomainKey, CognitiveLevel } from '../types';
import { questionBankManager } from './questionBankManager';

export interface AutopilotAuthoringResult {
  mainQuestion: {
    question_text: string;
    options: Record<string, string>;
    correct_key: string;
    explanation: string;
    distractor_analysis?: Record<string, string>;
    digital_competency_domain: DigitalCompetencyDomainKey;
    digital_sub_competency: string;
    sub_competency_name?: string;
    cognitive_level: CognitiveLevel;
    legal_reference: string;
    time_limit: number;
    points: number;
    tags: string[];
    category: string;
  };
  legalAudit: {
    status: 'VERIFIED_COMPLIANT' | 'WARNING_AMBIGUOUS' | 'NEEDS_REVISION';
    referencedDecree: string;
    relevantArticles: string[];
    legalNotes: string;
    outdatedInfoRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  psychometricEstimate: {
    difficultyB: number;
    discriminationA: number;
    guessingC: number;
    qualityRating: string;
    targetAudience: string;
    expectedPassRate: string;
  };
  variants?: Array<{
    id: string;
    title: string;
    question_text: string;
    options: Record<string, string>;
    correct_key: string;
    explanation: string;
  }>;
  alternativeFormats?: {
    trueFalse4?: {
      question_text: string;
      options: Record<string, string>;
      correct_key: string;
      explanation: string;
    };
    shortAnswer?: {
      question_text: string;
      correct_key: string;
      explanation: string;
    };
  };
  audioMCGuide?: {
    mcSpeechScript: string;
    voicePacing: string;
  };
}

export interface AutopilotAuthoringInput {
  prompt: string;
  domainKey?: string;
  cognitiveLevel?: string;
  targetFormat?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  generateVariants?: boolean;
  performLegalAudit?: boolean;
  performIrtDiagnostics?: boolean;
}

class AutopilotAuthoringService {
  public async generateFullSuite(input: AutopilotAuthoringInput): Promise<AutopilotAuthoringResult> {
    const bank = questionBankManager.getQuestions().slice(0, 15);

    const response = await fetch('/api/ai/autopilot-authoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...input,
        bankQuestionsSample: bank
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.result) {
      return data.result;
    }
    throw new Error('Dữ liệu phản hồi không hợp lệ.');
  }

  public saveQuestionFromSuite(result: AutopilotAuthoringResult, includeVariants = false): { mainId: string; variantCount: number } {
    const mq = result.mainQuestion;
    const mainId = `AP_${Date.now().toString().slice(-4)}`;

    const newQuestion: QuestionItem = {
      id: mainId,
      round_name: 'Khởi động chung',
      round_type: 'MULTIPLE_CHOICE',
      question_text: mq.question_text,
      options: mq.options,
      correct_key: mq.correct_key,
      explanation: mq.explanation,
      time_limit: mq.time_limit || 30,
      points: mq.points || 10,
      category: mq.category || 'Miền IV: An toàn số',
      digital_competency_domain: mq.digital_competency_domain,
      digital_sub_competency: mq.digital_sub_competency,
      cognitive_level: mq.cognitive_level,
      legal_reference: mq.legal_reference,
      tags: mq.tags,
      approval_status: 'APPROVED',
      created_by: 'AutoPilot All-in-One AI Studio',
      created_at: Date.now()
    };

    questionBankManager.addQuestion(newQuestion);

    let variantCount = 0;
    if (includeVariants && result.variants && result.variants.length > 0) {
      result.variants.forEach((v, idx) => {
        const vId = `${mainId}_V${idx + 1}`;
        const vQuestion: QuestionItem = {
          ...newQuestion,
          id: vId,
          question_text: v.question_text,
          options: v.options,
          correct_key: v.correct_key,
          explanation: v.explanation,
          tags: [...(newQuestion.tags || []), 'variant_auto']
        };
        questionBankManager.addQuestion(vQuestion);
        variantCount++;
      });
    }

    return { mainId, variantCount };
  }
}

export const autopilotAuthoringService = new AutopilotAuthoringService();
