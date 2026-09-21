import { 
  CompetitionStage, 
  CognitiveLevel, 
  DigitalCompetencyDomainKey, 
  QuestionRoundFormat, 
  RoundType 
} from '../types';
import { BtiRoundGroupKey } from '../data/digitalCompetencyData';

export interface QuestionDraft {
  id?: string; // 'new' or specific question id (e.g. 'KD-01')
  savedAt?: string; // ISO timestamp
  stage?: CompetitionStage;
  roundGroup?: BtiRoundGroupKey;
  roundFormat?: QuestionRoundFormat;
  roundName?: string;
  roundType?: RoundType;
  timeLimit?: number;
  points?: number;
  kdTurn?: 'RIENG' | 'CHUNG';
  vcnvImage?: string;
  domain?: DigitalCompetencyDomainKey;
  subCompetency?: string;
  cognitiveLevel?: CognitiveLevel;
  legalReference?: string;
  tagsInput?: string;
  questionText?: string;
  explanation?: string;
  mediaType?: 'NONE' | 'IMAGE' | 'VIDEO' | 'AUDIO';
  mediaUrl?: string;
  optionCount?: number;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  optionE?: string;
  optionF?: string;
  correctKey?: string;
  shortAnswerKey?: string;
  tfItems?: { key: string; text: string; isCorrect: boolean }[];
  vcnvRiskQuestion?: string;
  vcnvRiskAnswer?: string;
  vcnvClue1?: string;
  vcnvAns1?: string;
  vcnvClue2?: string;
  vcnvAns2?: string;
  vcnvClue3?: string;
  vcnvAns3?: string;
  vcnvClue4?: string;
  vcnvAns4?: string;
  vcnvCenter?: string;
  vcnvCenterAns?: string;
  characterCount?: number;
  titleSnippet?: string;
  customData?: Record<string, any>;
}

const DRAFT_PREFIX = 'bti_question_draft_';
const LEGACY_DRAFT_KEY = 'question_draft_data';

class QuestionDraftService {
  private getStorageKey(draftId: string = 'new'): string {
    return `${DRAFT_PREFIX}${draftId.trim() || 'new'}`;
  }

  /**
   * Checks if draft content has meaningful user input (not just blank templates)
   */
  public isMeaningful(draft: Partial<QuestionDraft> | null): boolean {
    if (!draft) return false;
    const textLen = (draft.questionText || '').trim().length;
    const expLen = (draft.explanation || '').trim().length;
    const optALen = (draft.optionA || '').trim().length;
    const vcnvRiskLen = (draft.vcnvRiskQuestion || '').trim().length;
    const vcnvCenterLen = (draft.vcnvCenter || '').trim().length;
    const vcnvClue1Len = (draft.vcnvClue1 || '').trim().length;
    const customTfALen = (draft.customData?.customTfA || '').trim().length;

    // Has at least 4-6 characters in any significant field
    return textLen >= 4 || expLen >= 6 || optALen >= 4 || vcnvRiskLen >= 4 || vcnvCenterLen >= 4 || vcnvClue1Len >= 4 || customTfALen >= 4;
  }

  /**
   * Save draft state into LocalStorage
   */
  public saveDraft(draftId: string = 'new', data: Partial<QuestionDraft>): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false;

    // Don't save if content is completely empty
    if (!this.isMeaningful(data)) {
      return false;
    }

    try {
      const storageKey = this.getStorageKey(draftId);
      const text = data.questionText || data.vcnvCenter || data.vcnvRiskQuestion || '';
      const snippet = text.length > 60 ? `${text.substring(0, 57)}...` : text;
      
      const draftObj: QuestionDraft = {
        ...data,
        id: draftId,
        savedAt: new Date().toISOString(),
        characterCount: text.length,
        titleSnippet: snippet || 'Chưa đặt tiêu đề'
      };

      const serialized = JSON.stringify(draftObj);
      window.localStorage.setItem(storageKey, serialized);
      // Also update legacy key for backwards compatibility
      if (draftId === 'new') {
        window.localStorage.setItem(LEGACY_DRAFT_KEY, serialized);
      }
      return true;
    } catch (error) {
      console.warn('[QuestionDraftService] Failed to save draft to LocalStorage:', error);
      return false;
    }
  }

  /**
   * Retrieve draft from LocalStorage (with fallback to legacy key)
   */
  public getDraft(draftId: string = 'new'): QuestionDraft | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;

    try {
      const storageKey = this.getStorageKey(draftId);
      let raw = window.localStorage.getItem(storageKey);
      
      // Fallback for new drafts stored in legacy key
      if (!raw && draftId === 'new') {
        raw = window.localStorage.getItem(LEGACY_DRAFT_KEY);
      }

      if (!raw) return null;

      const parsed: QuestionDraft = JSON.parse(raw);
      if (!parsed || !this.isMeaningful(parsed)) {
        return null;
      }
      return parsed;
    } catch (error) {
      console.warn('[QuestionDraftService] Failed to read draft from LocalStorage:', error);
      return null;
    }
  }

  /**
   * Alias for getDraft
   */
  public loadDraft(draftId: string = 'new'): QuestionDraft | null {
    return this.getDraft(draftId);
  }

  /**
   * Delete draft from LocalStorage
   */
  public clearDraft(draftId: string = 'new'): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const storageKey = this.getStorageKey(draftId);
      window.localStorage.removeItem(storageKey);
      if (draftId === 'new') {
        window.localStorage.removeItem(LEGACY_DRAFT_KEY);
      }
    } catch (error) {
      console.warn('[QuestionDraftService] Failed to clear draft:', error);
    }
  }

  /**
   * Clean up all legacy draft keys from localStorage
   */
  public cleanupLegacyDrafts(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.removeItem(LEGACY_DRAFT_KEY);
    } catch (error) {
      console.warn('[QuestionDraftService] Failed to clean legacy drafts:', error);
    }
  }

  /**
   * Format friendly relative time in Vietnamese (e.g. "vừa xong", "2 phút trước", "15:30 06/09")
   */
  public formatFriendlyTime(isoString: string): string {
    if (!isoString) return 'Vừa xong';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);

      if (diffSec < 15) return 'Vừa xong';
      if (diffSec < 60) return `${diffSec} giây trước`;
      if (diffMin < 60) return `${diffMin} phút trước`;
      if (diffHour < 24) return `${diffHour} giờ trước`;

      const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${timeStr} ${dateStr}`;
    } catch {
      return 'Gần đây';
    }
  }
}

export const questionDraftService = new QuestionDraftService();
