import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ApprovalStatus, QuestionReviewRecord, QuestionItem } from '../types';
import { questionBankManager } from './questionBankManager';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
    },
    operationType,
    path
  };
  console.error('[Firestore QuestionReview Error]:', JSON.stringify(errInfo));
}

const LOCAL_STORAGE_KEY_REVIEWS = 'bti2026_question_reviews_cache_v1';

export const REVIEW_STATUS_OPTIONS: Array<{
  value: ApprovalStatus;
  label: string;
  description: string;
  colorScheme: 'slate' | 'amber' | 'emerald' | 'rose' | 'red';
  badgeClass: string;
  activeBtnClass: string;
}> = [
  {
    value: 'DRAFT',
    label: 'Đang soạn',
    description: 'Câu hỏi mới hoặc đang hoàn thiện nội dung, chưa sẵn sàng thi',
    colorScheme: 'slate',
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/35',
    activeBtnClass: 'bg-slate-700/80 text-white border-slate-400 shadow-sm ring-1 ring-slate-400/50'
  },
  {
    value: 'PENDING_REVIEW',
    label: 'Chờ duyệt',
    description: 'Đã hoàn tất biên soạn, chuyển Hội đồng Khảo thí thẩm định',
    colorScheme: 'amber',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    activeBtnClass: 'bg-amber-600/30 text-amber-200 border-amber-400 shadow-sm ring-1 ring-amber-400/50'
  },
  {
    value: 'APPROVED',
    label: 'Đã duyệt',
    description: 'Đã thẩm định đạt chuẩn năng lực số BTI 2026 & TT 02/2025',
    colorScheme: 'emerald',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
    activeBtnClass: 'bg-emerald-600/30 text-emerald-200 border-emerald-400 shadow-sm ring-1 ring-emerald-400/50'
  },
  {
    value: 'NEEDS_REVISION',
    label: 'Cần sửa',
    description: 'Cần chỉnh sửa đáp án, ngữ pháp, dữ kiện hoặc căn cứ pháp lý',
    colorScheme: 'rose',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/35',
    activeBtnClass: 'bg-rose-600/30 text-rose-200 border-rose-400 shadow-sm ring-1 ring-rose-400/50'
  },
  {
    value: 'REJECTED',
    label: 'Từ chối',
    description: 'Không phù hợp tiêu chí hoặc trùng lặp với câu hỏi khác',
    colorScheme: 'red',
    badgeClass: 'bg-red-500/15 text-red-300 border-red-500/35',
    activeBtnClass: 'bg-red-600/30 text-red-200 border-red-400 shadow-sm ring-1 ring-red-400/50'
  }
];

export const PRESET_REVIEW_NOTES = [
  '✅ Nội dung chuẩn xác, đạt yêu cầu BTI 2026',
  '⚠️ Cần kiểm tra lại tính chính xác của đáp án đúng',
  '⚖️ Cập nhật lại trích dẫn căn cứ pháp lý theo TT 02/2025',
  '⏱️ Cần điều chỉnh lại thời gian làm bài cho phù hợp',
  '🎨 Cần bổ sung hình ảnh minh họa chất lượng cao',
  '📝 Sửa lại câu từ cho rõ nghĩa, tránh hiểu nhầm',
  '💡 Ý tưởng câu hỏi hay, phân hóa năng lực tốt'
];

export function getStatusInfo(status?: ApprovalStatus) {
  const match = REVIEW_STATUS_OPTIONS.find(opt => opt.value === status);
  if (match) return match;
  return {
    value: 'DRAFT' as ApprovalStatus,
    label: status === 'APPROVED' ? 'Đã duyệt' : status === 'REJECTED' ? 'Cần sửa / Từ chối' : 'Đang soạn',
    description: '',
    colorScheme: 'slate' as const,
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/35',
    activeBtnClass: 'bg-slate-700/80 text-white border-slate-400'
  };
}

class QuestionReviewService {
  private reviewsCache: Record<string, QuestionReviewRecord> = {};
  private listeners: Set<(reviews: Record<string, QuestionReviewRecord>) => void> = new Set();
  private isListening: boolean = false;
  private unsubscribeFirestore: (() => void) | null = null;

  constructor() {
    this.loadLocalCache();
    this.startFirestoreListener();
  }

  private loadLocalCache() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_REVIEWS);
      if (saved) {
        this.reviewsCache = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading question reviews cache:', e);
    }
  }

  private saveLocalCache() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_REVIEWS, JSON.stringify(this.reviewsCache));
    } catch (e) {
      console.error('Error saving question reviews cache:', e);
    }
  }

  public startFirestoreListener() {
    if (this.isListening || !db) return;

    try {
      const reviewsCol = collection(db, 'question_reviews');
      this.unsubscribeFirestore = onSnapshot(
        reviewsCol,
        (snapshot) => {
          let hasNewUpdates = false;
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data() as Partial<QuestionReviewRecord>;
            const qId = change.doc.id;

            if (change.type === 'added' || change.type === 'modified') {
              if (data && data.approval_status) {
                const record: QuestionReviewRecord = {
                  question_id: qId,
                  approval_status: data.approval_status as ApprovalStatus,
                  status_label: data.status_label || getStatusInfo(data.approval_status as ApprovalStatus).label,
                  review_notes: data.review_notes || '',
                  reviewed_by: data.reviewed_by || 'Khảo thí',
                  reviewed_at: data.reviewed_at || Date.now(),
                  last_updated: data.last_updated || Date.now(),
                  history: data.history || []
                };

                this.reviewsCache[qId] = record;
                hasNewUpdates = true;

                // Sync with local questionBankManager if question exists
                const existingQ = questionBankManager.getQuestionById(qId);
                if (existingQ && (existingQ.approval_status !== record.approval_status || existingQ.review_notes !== record.review_notes)) {
                  questionBankManager.setQuestionReview(
                    qId, 
                    record.approval_status, 
                    record.review_notes, 
                    record.reviewed_by
                  );
                }
              }
            } else if (change.type === 'removed') {
              delete this.reviewsCache[qId];
              hasNewUpdates = true;
            }
          });

          if (hasNewUpdates) {
            this.saveLocalCache();
            this.notifyListeners();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'question_reviews');
        }
      );

      this.isListening = true;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'question_reviews');
    }
  }

  public subscribe(listener: (reviews: Record<string, QuestionReviewRecord>) => void): () => void {
    this.listeners.add(listener);
    // Emit immediate current state
    listener({ ...this.reviewsCache });

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const copy = { ...this.reviewsCache };
    this.listeners.forEach(fn => {
      try {
        fn(copy);
      } catch (e) {
        console.error('Error notifying review listener:', e);
      }
    });
  }

  public getReview(questionId: string): QuestionReviewRecord | undefined {
    return this.reviewsCache[questionId];
  }

  public getAllReviews(): Record<string, QuestionReviewRecord> {
    return { ...this.reviewsCache };
  }

  /**
   * Saves question review status and notes directly to Firestore and updates local manager.
   */
  public async saveReview(
    question: QuestionItem,
    status: ApprovalStatus,
    notes: string,
    reviewerName?: string
  ): Promise<{ success: boolean; error?: string }> {
    const reviewer = reviewerName || questionBankManager.getCurrentUser().name || 'Hội đồng Khảo thí';
    const now = Date.now();
    const statusLabel = getStatusInfo(status).label;
    const existingRecord = this.reviewsCache[question.id];

    const newHistoryItem = {
      status,
      notes: notes.trim(),
      by: reviewer,
      at: now
    };

    const previousHistory = existingRecord?.history || [];
    const updatedHistory = [newHistoryItem, ...previousHistory.slice(0, 19)]; // Keep up to 20 audit entries

    const record: QuestionReviewRecord = {
      question_id: question.id,
      approval_status: status,
      status_label: statusLabel,
      review_notes: notes.trim(),
      reviewed_by: reviewer,
      reviewed_at: now,
      last_updated: now,
      history: updatedHistory
    };

    // 1. Update local cache and questionBankManager immediately for optimistic UI
    this.reviewsCache[question.id] = record;
    this.saveLocalCache();
    this.notifyListeners();

    questionBankManager.setQuestionReview(question.id, status, notes.trim(), reviewer);

    // 2. Persist to Firestore
    if (db) {
      const docPath = `question_reviews/${question.id}`;
      try {
        const docRef = doc(db, 'question_reviews', question.id);
        const firestorePayload = {
          question_id: question.id,
          question_text: question.question_text || '',
          category: question.category || '',
          round_name: question.round_name || '',
          approval_status: status,
          status_label: statusLabel,
          review_notes: notes.trim(),
          reviewed_by: reviewer,
          reviewed_at: now,
          last_updated: now,
          history: updatedHistory
        };

        await setDoc(docRef, firestorePayload, { merge: true });
        return { success: true };
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Lỗi đồng bộ lên Firestore' 
        };
      }
    } else {
      console.warn('Firestore db instance is not configured, saved to local storage.');
      return { success: true };
    }
  }
}

export const questionReviewService = new QuestionReviewService();
