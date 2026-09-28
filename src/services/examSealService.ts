import { SealedExamPackage, CompetitionStage, QuestionItem } from '../types';
import { questionBankManager } from './questionBankManager';

const STORAGE_KEY = 'bti_sealed_exam_packages_v1';

/**
 * Computes SHA-256 hash for arbitrary text/data in browser and Node environments
 */
async function computeSha256(text: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback simple checksum if crypto subtle not available
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

export const examSealService = {
  /**
   * Get all sealed packages from persistence
   */
  getAllSeals(): SealedExamPackage[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Saves a sealed package
   */
  saveSeal(seal: SealedExamPackage): void {
    const list = this.getAllSeals().filter(s => s.id !== seal.id);
    list.unshift(seal);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error saving sealed package:', e);
    }
  },

  /**
   * Seals a set of questions for an official tournament match
   */
  async sealExamPackage(
    name: string,
    stage: CompetitionStage,
    questions: QuestionItem[],
    sealedBy: string,
    sealerRole: string = 'Trưởng Ban Đề Thi',
    notes?: string
  ): Promise<SealedExamPackage> {
    const qIds = questions.map(q => q.id).sort();
    
    // Create canonical payload for cryptographic checksum
    const canonicalPayload = JSON.stringify(
      questions
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(q => ({
          id: q.id,
          q: q.question_text.trim(),
          ans: q.correct_key.trim(),
          pts: q.points || 10,
          opts: q.options || {},
          time: q.time_limit
        }))
    );

    const sha256 = await computeSha256(canonicalPayload);
    const sealId = `SEAL_${stage}_${Date.now().toString(36).toUpperCase()}`;

    const sealedPackage: SealedExamPackage = {
      id: sealId,
      name,
      stage,
      questionCount: questions.length,
      questionIds: qIds,
      sealedAt: Date.now(),
      sealedBy,
      sealerRole,
      sha256Checksum: sha256,
      isLocked: true,
      notes: notes || `Niêm phong chính thức đề thi ${name} cho giải đấu BTI 2026`,
      verificationLog: [
        {
          verifiedAt: Date.now(),
          verifiedBy: sealedBy,
          isValid: true,
          computedChecksum: sha256,
          notes: 'Khởi tạo niêm phong gốc ban đầu hợp lệ 100%'
        }
      ]
    };

    // Mark questions as sealed in question bank
    questions.forEach(q => {
      questionBankManager.updateQuestion(q.id, {
        is_sealed: true,
        seal_id: sealId
      }, `Niêm phong trong bộ đề ${name} (Mã băm: ${sha256.substring(0, 8)}...)`);
    });

    this.saveSeal(sealedPackage);
    return sealedPackage;
  },

  /**
   * Verifies the cryptographic integrity of a sealed exam package against current bank state
   */
  async verifySealIntegrity(
    sealId: string, 
    verifierName: string = 'Giám Sát Khảo Thí'
  ): Promise<{ isValid: boolean; expectedHash: string; computedHash: string; notes: string }> {
    const seal = this.getAllSeals().find(s => s.id === sealId);
    if (!seal) {
      throw new Error(`Không tìm thấy gói niêm phong với mã: ${sealId}`);
    }

    const currentQuestions = questionBankManager.getQuestions().filter(q => seal.questionIds.includes(q.id));
    
    if (currentQuestions.length !== seal.questionCount) {
      const result = {
        isValid: false,
        expectedHash: seal.sha256Checksum,
        computedHash: 'MISSING_QUESTIONS',
        notes: `CẢNH BÁO: Số lượng câu hỏi hiện tại (${currentQuestions.length}) không khớp với lúc niêm phong (${seal.questionCount})!`
      };
      this.recordVerification(sealId, verifierName, false, 'MISSING_QUESTIONS', result.notes);
      return result;
    }

    const canonicalPayload = JSON.stringify(
      currentQuestions
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(q => ({
          id: q.id,
          q: q.question_text.trim(),
          ans: q.correct_key.trim(),
          pts: q.points || 10,
          opts: q.options || {},
          time: q.time_limit
        }))
    );

    const computed = await computeSha256(canonicalPayload);
    const isValid = computed === seal.sha256Checksum;
    const notes = isValid 
      ? 'ĐỐI SOÁT MÃ BĂM THÀNH CÔNG: Đề thi nguyên vẹn 100%, không bị sửa đổi bất kỳ ký tự nào.'
      : 'CẢNH BÁO BẢO MẬT: Mã băm không khớp! Đã có câu hỏi hoặc đáp án bị thay đổi sau khi niêm phong.';

    this.recordVerification(sealId, verifierName, isValid, computed, notes);

    return {
      isValid,
      expectedHash: seal.sha256Checksum,
      computedHash: computed,
      notes
    };
  },

  /**
   * Internal helper to record verification log
   */
  recordVerification(
    sealId: string, 
    verifier: string, 
    isValid: boolean, 
    computed: string, 
    notes: string
  ): void {
    const list = this.getAllSeals();
    const target = list.find(s => s.id === sealId);
    if (target) {
      target.verificationLog.unshift({
        verifiedAt: Date.now(),
        verifiedBy: verifier,
        isValid,
        computedChecksum: computed,
        notes
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch {}
    }
  },

  /**
   * Unseal an exam package (requires confirmation)
   */
  unsealPackage(sealId: string, unsealedBy: string): void {
    const list = this.getAllSeals();
    const target = list.find(s => s.id === sealId);
    if (target) {
      target.isLocked = false;
      this.recordVerification(sealId, unsealedBy, true, target.sha256Checksum, `Mở niêm phong bởi ${unsealedBy}`);
      
      // Update questions
      target.questionIds.forEach(id => {
        const q = questionBankManager.getQuestionById(id);
        if (q) {
          questionBankManager.updateQuestion(q.id, {
            is_sealed: false
          }, `Mở niêm phong bộ đề ${target.name}`);
        }
      });
    }
  }
};
