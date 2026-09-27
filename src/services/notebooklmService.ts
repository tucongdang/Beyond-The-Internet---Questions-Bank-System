import { LegalDocument, QuestionItem } from '../types';
import { geminiKeyService } from './geminiKeyService';

export interface NotebookLMCitation {
  sourceTitle: string;
  documentNumber: string;
  article: string;
  snippet: string;
}

export interface NotebookLMChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  citations?: NotebookLMCitation[];
  keyTakeaway?: string;
  suggestedFollowUps?: string[];
  timestamp: number;
}

export interface NotebookLMPodcastLine {
  speaker: 'Minh Thảo' | 'Quốc Hoàng' | string;
  role: string;
  text: string;
  emphasis?: string;
}

export interface NotebookLMPodcast {
  episodeTitle: string;
  episodeSubtitle: string;
  durationMinutes: number;
  summary: string;
  dialogue: NotebookLMPodcastLine[];
  keyHighlights: string[];
}

export interface NotebookLMStudyGuide {
  executiveSummary: string;
  jurisdictionScope: string;
  keyEntities: Array<{
    entity: string;
    rights: string;
    obligations: string;
  }>;
  criticalArticles: Array<{
    documentNumber: string;
    article: string;
    summary: string;
    relevanceToBTI: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
    legalReference: string;
  }>;
  complianceChecklist: string[];
  btiExamRelevance: string;
}

export interface NotebookLMQuestion {
  questionText: string;
  roundType: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'TRUE_FALSE_4';
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctKey: string;
  explanation: string;
  legalReference: string;
  cognitiveLevel: 'NHAN_BIET' | 'THONG_HIEU' | 'VAN_DUNG' | 'VAN_DUNG_CAO';
  digitalCompetencyDomain: 'MIEN_1' | 'MIEN_2' | 'MIEN_3' | 'MIEN_4' | 'MIEN_5' | 'MIEN_6';
  timeLimit?: number;
  points?: number;
}

class NotebookLMService {
  /**
   * Quét và nhận diện chuyên sâu văn bản pháp lý bằng Multimodal AI
   */
  async parseLegalDocument(params: {
    fileBase64?: string;
    mimeType?: string;
    fileName?: string;
    rawText?: string;
  }): Promise<{
    title: string;
    documentNumber: string;
    issuingAuthority: string;
    issuedDate: string;
    effectiveDate: string;
    type: string;
    domain: string;
    summary: string;
    keyArticles: Array<{ article: string; content: string }>;
    relatedDomains?: string[];
    extractedTextSnippet?: string;
  }> {
    const res = await fetch('/api/ai/parse-legal-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...geminiKeyService.getAuthHeaders()
      },
      body: JSON.stringify(params)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Lỗi khi nhận diện văn bản pháp lý.');
    }
    return data.document;
  }

  /**
   * Hỏi đáp có kiểm chứng (Grounded Chat) dựa trên các nguồn văn bản pháp lý đang chọn
   */
  async askChat(params: {
    sources: LegalDocument[];
    query: string;
    chatHistory?: Array<{ role: 'user' | 'model'; text: string }>;
    focusArticle?: { article: string; content: string } | null;
  }): Promise<{
    answer: string;
    citations: NotebookLMCitation[];
    keyTakeaway: string;
    suggestedFollowUps: string[];
  }> {
    const res = await fetch('/api/ai/notebooklm-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...geminiKeyService.getAuthHeaders()
      },
      body: JSON.stringify({
        action: 'CHAT',
        sources: params.sources,
        query: params.query,
        chatHistory: params.chatHistory || [],
        focusArticle: params.focusArticle || null
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Lỗi khi hỏi đáp với NotebookLM Agent.');
    }
    return data.result;
  }

  /**
   * Tạo Cẩm nang nghiên cứu pháp lý tổng hợp (Executive Study Guide & FAQs)
   */
  async generateStudyGuide(sources: LegalDocument[]): Promise<NotebookLMStudyGuide> {
    const res = await fetch('/api/ai/notebooklm-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...geminiKeyService.getAuthHeaders()
      },
      body: JSON.stringify({
        action: 'STUDY_GUIDE',
        sources
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Lỗi khi tạo Cẩm nang pháp lý.');
    }
    return data.result;
  }

  /**
   * Tạo kịch bản Audio Overview (Podcast đối thoại 2 chuyên gia BTI theo phong cách NotebookLM)
   */
  async generateAudioOverview(sources: LegalDocument[]): Promise<NotebookLMPodcast> {
    const res = await fetch('/api/ai/notebooklm-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...geminiKeyService.getAuthHeaders()
      },
      body: JSON.stringify({
        action: 'AUDIO_OVERVIEW',
        sources
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Lỗi khi sản xuất Audio Overview Podcast.');
    }
    return data.result;
  }

  /**
   * Biên soạn nhanh các câu hỏi thi BTI 2026 trực tiếp từ căn cứ pháp lý
   */
  async generateQuestions(params: {
    sources: LegalDocument[];
    focusArticle?: { article: string; content: string } | null;
    questionCount?: number;
  }): Promise<NotebookLMQuestion[]> {
    const res = await fetch('/api/ai/notebooklm-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...geminiKeyService.getAuthHeaders()
      },
      body: JSON.stringify({
        action: 'GENERATE_QUESTIONS',
        sources: params.sources,
        focusArticle: params.focusArticle || null,
        questionCount: params.questionCount || 3
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Lỗi khi sinh câu hỏi từ căn cứ pháp lý.');
    }
    return data.result.questions || [];
  }

  /**
   * Trình phát âm thanh SpeechSynthesis cho Podcast 2 host với 2 giọng/âm sắc khác biệt
   */
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private cancelSpeech = false;

  stopAudioPlayback() {
    this.cancelSpeech = true;
    this.isSpeaking = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  async playPodcastDialogue(
    dialogue: NotebookLMPodcastLine[],
    onLineStart: (index: number) => void,
    onComplete: () => void,
    onError: (err: any) => void
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onError(new Error('Trình duyệt không hỗ trợ Web Speech API'));
      return;
    }

    this.stopAudioPlayback();
    this.cancelSpeech = false;
    this.isSpeaking = true;

    // Tìm các giọng tiếng Việt hoặc fallback
    const voices = window.speechSynthesis.getVoices();
    const vnVoices = voices.filter(v => v.lang.startsWith('vi') || v.lang.includes('VN'));

    for (let i = 0; i < dialogue.length; i++) {
      if (this.cancelSpeech) break;

      const line = dialogue[i];
      onLineStart(i);

      await new Promise<void>((resolve) => {
        if (this.cancelSpeech) {
          resolve();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(line.text);
        this.currentUtterance = utterance;

        // Cấu hình âm sắc cho từng nhân vật
        const isMinhThao = line.speaker.includes('Minh Thảo') || line.speaker.includes('Thảo');
        if (vnVoices.length > 0) {
          if (isMinhThao) {
            utterance.voice = vnVoices[0];
            utterance.pitch = 1.15; // Giọng nữ cao hơn, thanh thoát
            utterance.rate = 1.05;
          } else {
            utterance.voice = vnVoices[vnVoices.length > 1 ? 1 : 0];
            utterance.pitch = 0.85; // Giọng nam trầm, dứt khoát
            utterance.rate = 1.0;
          }
        } else {
          // Fallback pitch
          utterance.pitch = isMinhThao ? 1.2 : 0.8;
          utterance.rate = 1.0;
        }

        utterance.onend = () => {
          // Nghỉ ngắn giữa các lượt thoại cho tự nhiên
          setTimeout(() => resolve(), 350);
        };

        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis error:', e);
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      });
    }

    this.isSpeaking = false;
    if (!this.cancelSpeech) {
      onComplete();
    }
  }

  isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const notebookLMService = new NotebookLMService();
