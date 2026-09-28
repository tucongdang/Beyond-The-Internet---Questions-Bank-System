import { QuestionItem, QuestionLifecycleStatus, VaultPartitionKey, CompetitionStage, QuestionQuarantineInfo } from '../types';
import { questionBankManager } from './questionBankManager';

/**
 * Question Lifecycle & Match Quarantine Service
 * Manages assessment item lifecycles (DRAFT -> IN_REVIEW -> APPROVED -> QUARANTINED -> ARCHIVED)
 * and prevents question leakage/reuse across tournament matches.
 */
export const questionLifecycleService = {
  /**
   * Set lifecycle status of a question with automatic audit trail
   */
  setLifecycleStatus(
    questionId: string, 
    status: QuestionLifecycleStatus, 
    user: string = 'Hệ Thống'
  ): boolean {
    const q = questionBankManager.getQuestionById(questionId);
    if (!q) return false;

    const prevStatus = q.lifecycle_status || (q.approval_status === 'APPROVED' ? 'APPROVED' : 'DRAFT');
    const updated: QuestionItem = {
      ...q,
      lifecycle_status: status,
      // Keep approval_status synchronized for backward compatibility
      approval_status: status === 'APPROVED' || status === 'QUARANTINED' ? 'APPROVED' : (status === 'IN_REVIEW' ? 'PENDING_REVIEW' : 'DRAFT')
    };

    questionBankManager.updateQuestion(q.id, updated, `Chuyển trạng thái vòng đời: ${prevStatus} ➔ ${status}`);
    return true;
  },

  /**
   * Batch set vault partition (Kho Chính Thức, Dự Phòng, Thi Thử, Lưu Trữ)
   */
  setVaultPartition(
    questionIds: string[], 
    vault: VaultPartitionKey
  ): number {
    let count = 0;
    questionIds.forEach(id => {
      const q = questionBankManager.getQuestionById(id);
      if (q) {
        questionBankManager.updateQuestion(q.id, {
          vault_partition: vault
        }, `Chuyển sang phân vùng kho: ${vault}`);
        count++;
      }
    });
    return count;
  },

  /**
   * Quarantine questions used in an official competition match to prevent duplicate appearance
   */
  quarantineQuestionsForMatch(
    questionIds: string[],
    matchName: string,
    stage: CompetitionStage,
    quarantinedBy: string = 'Ban Trọng Tài BTI'
  ): number {
    let count = 0;
    const now = Date.now();

    questionIds.forEach(id => {
      const q = questionBankManager.getQuestionById(id);
      if (q) {
        const quarantineInfo: QuestionQuarantineInfo = {
          matchName,
          stage,
          quarantinedAt: now,
          quarantinedBy,
          notes: `Đã sử dụng trong trận ${matchName} (${stage}) vào ngày ${new Date(now).toLocaleDateString('vi-VN')}`
        };

        questionBankManager.updateQuestion(q.id, {
          lifecycle_status: 'QUARANTINED',
          vault_partition: 'ARCHIVED',
          quarantine_info: quarantineInfo
        }, `Cách ly câu hỏi sau trận đấu: ${matchName}`);
        count++;
      }
    });

    return count;
  },

  /**
   * Release quarantine on questions (e.g. For new tournament season or training reuse)
   */
  releaseQuarantine(questionIds: string[]): number {
    let count = 0;
    questionIds.forEach(id => {
      const q = questionBankManager.getQuestionById(id);
      if (q && q.lifecycle_status === 'QUARANTINED') {
        questionBankManager.updateQuestion(q.id, {
          lifecycle_status: 'APPROVED',
          vault_partition: 'OFFICIAL',
          quarantine_info: undefined
        }, 'Giải phóng cách ly câu hỏi để tái sử dụng');
        count++;
      }
    });
    return count;
  },

  /**
   * Get all currently quarantined questions
   */
  getQuarantinedQuestions(): QuestionItem[] {
    return questionBankManager.getQuestions().filter(
      q => q.lifecycle_status === 'QUARANTINED' || !!q.quarantine_info
    );
  },

  /**
   * Filter questions eligible for a specific competition stage (excluding quarantined items)
   */
  getEligibleQuestionsForMatch(stage?: CompetitionStage): QuestionItem[] {
    return questionBankManager.getQuestions().filter(q => {
      // Must be approved
      const isApproved = q.lifecycle_status === 'APPROVED' || (!q.lifecycle_status && q.approval_status === 'APPROVED');
      // Must NOT be quarantined
      const isNotQuarantined = q.lifecycle_status !== 'QUARANTINED' && !q.quarantine_info;
      // Must not be in archived vault
      const notArchived = q.vault_partition !== 'ARCHIVED';

      if (!isApproved || !isNotQuarantined || !notArchived) return false;

      if (stage && q.stage) {
        return q.stage === stage || q.stage === 'VONG_LOAI';
      }

      return true;
    });
  },

  /**
   * Computes statistics by Vault Partition & Lifecycle Status
   */
  getVaultStats() {
    const questions = questionBankManager.getQuestions();
    const vaultCounts: Record<VaultPartitionKey, number> = {
      OFFICIAL: 0,
      RESERVE: 0,
      PRACTICE: 0,
      ARCHIVED: 0
    };

    const lifecycleCounts: Record<QuestionLifecycleStatus, number> = {
      DRAFT: 0,
      IN_REVIEW: 0,
      APPROVED: 0,
      QUARANTINED: 0,
      ARCHIVED: 0
    };

    questions.forEach(q => {
      const vault: VaultPartitionKey = q.vault_partition || (q.lifecycle_status === 'QUARANTINED' ? 'ARCHIVED' : 'OFFICIAL');
      vaultCounts[vault] = (vaultCounts[vault] || 0) + 1;

      const status: QuestionLifecycleStatus = q.lifecycle_status || 
        (q.approval_status === 'APPROVED' ? 'APPROVED' : (q.approval_status === 'PENDING_REVIEW' ? 'IN_REVIEW' : 'DRAFT'));
      lifecycleCounts[status] = (lifecycleCounts[status] || 0) + 1;
    });

    return { vaultCounts, lifecycleCounts, total: questions.length };
  }
};
