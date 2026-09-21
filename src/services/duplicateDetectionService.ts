import { QuestionItem } from '../types';
import { questionBankManager } from './questionBankManager';

export interface DuplicatePair {
  id: string;
  questionA: QuestionItem;
  questionB: QuestionItem;
  similarityScore: number; // 0 to 100
  matchReason: string;
  matchedPhrases: string[];
  status: 'PENDING' | 'RESOLVED_MERGED' | 'RESOLVED_DELETED' | 'IGNORED';
}

export interface DuplicateScanSummary {
  totalScanned: number;
  duplicatePairsFound: number;
  exactMatchesCount: number;
  highSimilarityCount: number;
  pairs: DuplicatePair[];
}

/**
 * Tokenize and normalize Vietnamese text into clean word tokens
 */
function normalizeAndTokenize(text: string): string[] {
  if (!text) return [];
  const clean = text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return clean.split(' ').filter(w => w.length > 1);
}

/**
 * Extract 3-gram character shingles for fuzzy string matching
 */
function getShingles(text: string, k: number = 3): Set<string> {
  const clean = (text || '').toLowerCase().replace(/\s+/g, '');
  const shingles = new Set<string>();
  if (clean.length < k) {
    if (clean) shingles.add(clean);
    return shingles;
  }
  for (let i = 0; i <= clean.length - k; i++) {
    shingles.add(clean.substring(i, i + k));
  }
  return shingles;
}

/**
 * Calculate Jaccard Similarity between two sets
 */
function jaccardSimilarity<T>(setA: Set<T>, setB: Set<T>): number {
  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersection = 0;
  setA.forEach(item => {
    if (setB.has(item)) intersection++;
  });

  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

/**
 * Calculate similarity score between two questions (0 - 100%)
 */
export function calculateQuestionSimilarity(
  q1: QuestionItem,
  q2: QuestionItem
): { score: number; reason: string; matchedPhrases: string[] } {
  const text1 = q1.question_text || '';
  const text2 = q2.question_text || '';

  // 1. Exact text match
  if (text1.trim().toLowerCase() === text2.trim().toLowerCase()) {
    return {
      score: 100,
      reason: 'Nội dung câu hỏi hoàn toàn trùng khớp 100%',
      matchedPhrases: ['100% Exact Match']
    };
  }

  // 2. Token overlap similarity
  const tokens1 = new Set(normalizeAndTokenize(text1));
  const tokens2 = new Set(normalizeAndTokenize(text2));
  const tokenSim = jaccardSimilarity(tokens1, tokens2);

  // 3. Shingle character fuzzy similarity
  const shing1 = getShingles(text1);
  const shing2 = getShingles(text2);
  const shingSim = jaccardSimilarity(shing1, shing2);

  // Combined score formula
  let combinedScore = (tokenSim * 0.6 + shingSim * 0.4) * 100;

  // Options match bonus
  if (q1.options && q2.options) {
    const opts1 = Object.values(q1.options).map(v => v.trim().toLowerCase()).sort().join('|');
    const opts2 = Object.values(q2.options).map(v => v.trim().toLowerCase()).sort().join('|');
    if (opts1 && opts2 && opts1 === opts2) {
      combinedScore = Math.min(100, combinedScore + 15);
    }
  }

  const finalScore = Math.round(combinedScore);

  // Find matched phrases
  const matchedPhrases: string[] = [];
  tokens1.forEach(t => {
    if (tokens2.has(t) && t.length > 3) {
      matchedPhrases.push(t);
    }
  });

  let reason = `Độ tương đồng từ vựng và cấu trúc đạt ${finalScore}%`;
  if (finalScore >= 90) {
    reason = `Trùng lặp gần như tuyệt đối (${finalScore}%)`;
  } else if (finalScore >= 80) {
    reason = `Mức độ tương đồng cao (${finalScore}%) - nghi vấn trùng nội dung`;
  }

  return {
    score: finalScore,
    reason,
    matchedPhrases: matchedPhrases.slice(0, 6)
  };
}

/**
 * Scan entire Question Bank or target array for duplicates
 */
export function scanForDuplicates(
  questions: QuestionItem[],
  minThresholdPercent: number = 70,
  onProgress?: (progress: { scanned: number; total: number; found: number }) => void
): DuplicateScanSummary {
  const pairs: DuplicatePair[] = [];
  const n = questions.length;
  let scannedCount = 0;
  let exactCount = 0;
  let highCount = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      scannedCount++;
      const q1 = questions[i];
      const q2 = questions[j];

      const sim = calculateQuestionSimilarity(q1, q2);

      if (sim.score >= minThresholdPercent) {
        if (sim.score === 100) exactCount++;
        else if (sim.score >= 85) highCount++;

        pairs.push({
          id: `dup_${q1.id}_${q2.id}`,
          questionA: q1,
          questionB: q2,
          similarityScore: sim.score,
          matchReason: sim.reason,
          matchedPhrases: sim.matchedPhrases,
          status: 'PENDING'
        });
      }
    }

    if (onProgress && i % 10 === 0) {
      onProgress({
        scanned: i + 1,
        total: n,
        found: pairs.length
      });
    }
  }

  // Sort pairs by highest similarity score
  pairs.sort((a, b) => b.similarityScore - a.similarityScore);

  return {
    totalScanned: n,
    duplicatePairsFound: pairs.length,
    exactMatchesCount: exactCount,
    highSimilarityCount: highCount,
    pairs
  };
}

/**
 * Merge two questions: Keep qKeep, copy any unique tags/metadata from qDelete, then delete qDelete.
 */
export function mergeDuplicateQuestions(qKeep: QuestionItem, qDelete: QuestionItem): boolean {
  try {
    const combinedTags = Array.from(new Set([
      ...(qKeep.tags || []),
      ...(qDelete.tags || [])
    ]));

    const updates: Partial<QuestionItem> = {
      tags: combinedTags
    };

    if (!qKeep.explanation && qDelete.explanation) {
      updates.explanation = qDelete.explanation;
    }
    if (!qKeep.legal_reference && qDelete.legal_reference) {
      updates.legal_reference = qDelete.legal_reference;
    }

    // Update keeper
    questionBankManager.batchUpdate([qKeep.id], updates);
    // Delete duplicate
    questionBankManager.deleteQuestion(qDelete.id);

    return true;
  } catch (err) {
    console.error('Error merging questions:', err);
    return false;
  }
}

/**
 * Bulk delete all exact 100% duplicate questions automatically (keeps first occurrence)
 */
export function autoResolveExactDuplicates(pairs: DuplicatePair[]): {
  deletedCount: number;
  retainedCount: number;
} {
  const exactPairs = pairs.filter(p => p.similarityScore === 100);
  const idsToDelete = new Set<string>();

  exactPairs.forEach(p => {
    // Retain questionA, delete questionB
    if (!idsToDelete.has(p.questionA.id)) {
      idsToDelete.add(p.questionB.id);
    }
  });

  let deleted = 0;
  idsToDelete.forEach(id => {
    questionBankManager.deleteQuestion(id);
    deleted++;
  });

  return {
    deletedCount: deleted,
    retainedCount: exactPairs.length - deleted
  };
}
