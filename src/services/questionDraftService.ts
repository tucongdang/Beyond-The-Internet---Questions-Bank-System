import { 
  CompetitionStage, 
  CognitiveLevel, 
  DigitalCompetencyDomainKey, 
  QuestionRoundFormat, 
  RoundType 
} from '../types';
import { BtiRoundGroupKey } from '../data/digitalCompetencyData';

export interface QuestionDraft {
  id?: string; // 'new' or specific question id (e.g. 'edit_KD-01')
  savedAt?: string; // ISO timestamp
  savedTimestamp?: number; // epoch ms for fast sorting/indexing
  storageType?: 'IndexedDB' | 'LocalStorage';
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
  customCategoryInput?: string;
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

const DB_NAME = 'bti_question_drafts_db';
const DB_VERSION = 1;
const STORE_NAME = 'question_drafts';

const DRAFT_PREFIX = 'bti_question_draft_';
const LEGACY_DRAFT_KEY = 'question_draft_data';

class QuestionDraftService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryCache: Map<string, QuestionDraft> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      // Warm up IndexedDB connection early
      this.openDB().catch(err => {
        console.warn('[QuestionDraftService] IndexedDB init notice:', err);
      });
    }
  }

  private getStorageKey(draftId: string = 'new'): string {
    return `${DRAFT_PREFIX}${draftId.trim() || 'new'}`;
  }

  /**
   * Opens or returns the cached IndexedDB database connection
   */
  public openDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB is not supported in this environment'));
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('savedTimestamp', 'savedTimestamp', { unique: false });
            store.createIndex('savedAt', 'savedAt', { unique: false });
            store.createIndex('stage', 'stage', { unique: false });
            store.createIndex('roundGroup', 'roundGroup', { unique: false });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          this.dbPromise = null;
          reject(request.error);
        };

        request.onblocked = () => {
          console.warn('[QuestionDraftService] IndexedDB connection blocked by another tab');
        };
      } catch (err) {
        this.dbPromise = null;
        reject(err);
      }
    });

    return this.dbPromise;
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
    const catLen = (draft.customCategoryInput || '').trim().length;

    // Has at least 4-6 characters in any significant field
    return textLen >= 4 || expLen >= 6 || optALen >= 4 || vcnvRiskLen >= 4 || vcnvCenterLen >= 4 || vcnvClue1Len >= 4 || customTfALen >= 4 || catLen >= 4;
  }

  /**
   * Helper to build a complete QuestionDraft record
   */
  private createDraftObject(draftId: string = 'new', data: Partial<QuestionDraft>): QuestionDraft {
    const cleanId = draftId.trim() || 'new';
    const text = data.questionText || data.vcnvCenter || data.vcnvRiskQuestion || data.customCategoryInput || '';
    const snippet = text.length > 70 ? `${text.substring(0, 67)}...` : text;
    const now = new Date();

    return {
      ...data,
      id: cleanId,
      savedAt: now.toISOString(),
      savedTimestamp: now.getTime(),
      storageType: 'IndexedDB',
      characterCount: text.length,
      titleSnippet: snippet || 'Chưa đặt tiêu đề'
    };
  }

  /**
   * Save draft directly to IndexedDB (with synchronized LocalStorage mirror for zero-loss recovery)
   */
  public async saveDraftToIndexedDB(draftId: string = 'new', data: Partial<QuestionDraft>): Promise<QuestionDraft | null> {
    if (!this.isMeaningful(data)) {
      return null;
    }

    const draftObj = this.createDraftObject(draftId, data);

    // 1. Synchronously mirror to memory & LocalStorage for instant access during fast unloads
    this.memoryCache.set(draftObj.id, draftObj);
    this.saveToLocalStorage(draftObj.id, draftObj);

    // 2. Persist to IndexedDB
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(draftObj);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        tx.onabort = () => reject(tx.error);
      });

      // Dispatch window event so other components (e.g. Dashboard) can react
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bti:draft-saved', { detail: { draftId: draftObj.id, draft: draftObj } }));
      }

      return draftObj;
    } catch (err) {
      console.warn('[QuestionDraftService] IndexedDB save failed, LocalStorage fallback active:', err);
      return draftObj;
    }
  }

  /**
   * Retrieve draft directly from IndexedDB (with fallback to LocalStorage)
   */
  public async getDraftFromIndexedDB(draftId: string = 'new'): Promise<QuestionDraft | null> {
    const cleanId = draftId.trim() || 'new';

    // 1. Try IndexedDB first
    try {
      const db = await this.openDB();
      const draft = await new Promise<QuestionDraft | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(cleanId);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });

      if (draft && this.isMeaningful(draft)) {
        this.memoryCache.set(cleanId, draft);
        return draft;
      }
    } catch (err) {
      console.warn('[QuestionDraftService] IndexedDB get failed, falling back to LocalStorage:', err);
    }

    // 2. Fallback to LocalStorage
    const localDraft = this.getFromLocalStorage(cleanId);
    if (localDraft && this.isMeaningful(localDraft)) {
      // Re-seed into IndexedDB in the background
      this.saveDraftToIndexedDB(cleanId, localDraft).catch(() => {});
      return localDraft;
    }

    return null;
  }

  /**
   * Delete draft from both IndexedDB and LocalStorage
   */
  public async clearDraftFromIndexedDB(draftId: string = 'new'): Promise<void> {
    const cleanId = draftId.trim() || 'new';
    this.memoryCache.delete(cleanId);
    this.removeFromLocalStorage(cleanId);

    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(cleanId);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        tx.onabort = () => reject(tx.error);
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bti:draft-cleared', { detail: { draftId: cleanId } }));
      }
    } catch (err) {
      console.warn('[QuestionDraftService] IndexedDB delete error:', err);
    }
  }

  /**
   * Retrieve all saved drafts from IndexedDB sorted newest first
   */
  public async getAllDraftsFromIndexedDB(): Promise<QuestionDraft[]> {
    try {
      const db = await this.openDB();
      const list = await new Promise<QuestionDraft[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('savedTimestamp');
        const req = index.getAll();

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      return list
        .filter(d => this.isMeaningful(d))
        .sort((a, b) => (b.savedTimestamp || 0) - (a.savedTimestamp || 0));
    } catch (err) {
      console.warn('[QuestionDraftService] getAllDraftsFromIndexedDB failed, returning LocalStorage fallback:', err);
      // Fallback
      const fallbackList: QuestionDraft[] = [];
      const newDraft = this.getFromLocalStorage('new');
      if (newDraft) fallbackList.push(newDraft);
      return fallbackList;
    }
  }

  // ==========================================
  // SYNCHRONOUS METHODS (FOR BACKWARD COMPATIBILITY)
  // ==========================================

  /**
   * Synchronous save interface: saves to LocalStorage immediately and triggers IndexedDB in background.
   * Returns boolean synchronously for callers like AdminPortal.
   */
  public saveDraft(draftId: string = 'new', data: Partial<QuestionDraft>): boolean {
    if (!this.isMeaningful(data)) {
      return false;
    }

    const draftObj = this.createDraftObject(draftId, data);
    this.memoryCache.set(draftObj.id, draftObj);
    const localOk = this.saveToLocalStorage(draftObj.id, draftObj);

    // Trigger IndexedDB asynchronously
    this.saveDraftToIndexedDB(draftId, data).catch(err => {
      console.warn('[QuestionDraftService] Background IndexedDB save error:', err);
    });

    return localOk;
  }

  /**
   * Synchronous get interface: returns from memory cache or LocalStorage.
   */
  public getDraft(draftId: string = 'new'): QuestionDraft | null {
    const cleanId = draftId.trim() || 'new';
    if (this.memoryCache.has(cleanId)) {
      const cached = this.memoryCache.get(cleanId)!;
      if (this.isMeaningful(cached)) return cached;
    }

    return this.getFromLocalStorage(cleanId);
  }

  /**
   * Alias for loadDraft (synchronous for backward compatibility with AdminPortal)
   */
  public loadDraft(draftId: string = 'new'): QuestionDraft | null {
    return this.getDraft(draftId);
  }

  /**
   * Synchronous clear draft interface: removes from memory and LocalStorage, and deletes from IndexedDB in background.
   */
  public clearDraft(draftId: string = 'new'): void {
    const cleanId = draftId.trim() || 'new';
    this.memoryCache.delete(cleanId);
    this.removeFromLocalStorage(cleanId);
    this.clearDraftFromIndexedDB(cleanId).catch(() => {});
  }

  // ==========================================
  // LOCALSTORAGE PRIVATE HELPERS
  // ==========================================

  private saveToLocalStorage(cleanId: string, draftObj: QuestionDraft): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      const storageKey = this.getStorageKey(cleanId);
      const serialized = JSON.stringify(draftObj);
      window.localStorage.setItem(storageKey, serialized);
      if (cleanId === 'new') {
        window.localStorage.setItem(LEGACY_DRAFT_KEY, serialized);
      }
      return true;
    } catch (err) {
      console.warn('[QuestionDraftService] LocalStorage save warning:', err);
      return false;
    }
  }

  private getFromLocalStorage(cleanId: string): QuestionDraft | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const storageKey = this.getStorageKey(cleanId);
      let raw = window.localStorage.getItem(storageKey);
      if (!raw && cleanId === 'new') {
        raw = window.localStorage.getItem(LEGACY_DRAFT_KEY);
      }
      if (!raw) return null;
      const parsed: QuestionDraft = JSON.parse(raw);
      return this.isMeaningful(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private removeFromLocalStorage(cleanId: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const storageKey = this.getStorageKey(cleanId);
      window.localStorage.removeItem(storageKey);
      if (cleanId === 'new') {
        window.localStorage.removeItem(LEGACY_DRAFT_KEY);
      }
    } catch {
      // Ignore
    }
  }

  public cleanupLegacyDrafts(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.removeItem(LEGACY_DRAFT_KEY);
    } catch {
      // Ignore
    }
  }

  /**
   * Format friendly relative time in Vietnamese (e.g. "vừa xong", "2 phút trước", "15:30 06/09")
   */
  public formatFriendlyTime(isoStringOrTimestamp?: string | number): string {
    if (!isoStringOrTimestamp) return 'Vừa xong';
    try {
      const date = typeof isoStringOrTimestamp === 'number' ? new Date(isoStringOrTimestamp) : new Date(isoStringOrTimestamp);
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
