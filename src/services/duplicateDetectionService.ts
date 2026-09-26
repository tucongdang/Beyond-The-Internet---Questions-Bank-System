import { QuestionItem } from '../types';
import { questionBankManager } from './questionBankManager';

export type DuplicateType = 'EXACT' | 'SEMANTIC_PARAPHRASE' | 'DOMAIN_OVERLAP' | 'DISTINCT';
export type DuplicateResolution = 'MERGE' | 'DELETE_B' | 'DIFFERENTIATE' | 'KEEP_BOTH';

export interface DuplicatePair {
  id: string;
  questionA: QuestionItem;
  questionB: QuestionItem;
  similarityScore: number; // 0 to 100
  domainOverlapScore?: number; // 0 to 100
  duplicateType?: DuplicateType;
  isRedundant?: boolean;
  matchReason: string;
  matchedPhrases: string[];
  overlappingConcepts?: string[];
  analysis?: string;
  recommendation?: DuplicateResolution;
  differentiateSuggestion?: string;
  isAiAnalyzed?: boolean;
  status: 'PENDING' | 'RESOLVED_MERGED' | 'RESOLVED_DELETED' | 'IGNORED';
}

export interface DuplicateScanSummary {
  totalScanned: number;
  duplicatePairsFound: number;
  exactMatchesCount: number;
  semanticMatchesCount: number;
  domainOverlapCount: number;
  highSimilarityCount: number;
  isAiPowered: boolean;
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
 * Calculate domain & competency overlap score (0 - 100%)
 */
export function calculateDomainOverlap(q1: QuestionItem, q2: QuestionItem): {
  score: number;
  overlappingConcepts: string[];
} {
  const concepts: string[] = [];
  let score = 0;

  // Domain match
  const d1 = q1.digital_competency_domain || (q1 as any).domain;
  const d2 = q2.digital_competency_domain || (q2 as any).domain;
  if (d1 && d2 && d1 === d2) {
    score += 35;
    concepts.push(`Miền năng lực: ${d1}`);
  }

  // SubCompetency match
  const sc1 = q1.digital_sub_competency || (q1 as any).subCompetency;
  const sc2 = q2.digital_sub_competency || (q2 as any).subCompetency;
  if (sc1 && sc2 && sc1 === sc2) {
    score += 30;
    concepts.push(`Năng lực thành phần: ${sc1}`);
  }

  // Legal Reference match
  if (q1.legal_reference && q2.legal_reference) {
    const l1 = q1.legal_reference.toLowerCase().trim();
    const l2 = q2.legal_reference.toLowerCase().trim();
    if (l1 === l2) {
      score += 25;
      concepts.push(`Căn cứ pháp lý: ${q1.legal_reference}`);
    } else if (l1.includes(l2) || l2.includes(l1)) {
      score += 15;
      concepts.push(`Pháp lý tương đồng: ${q1.legal_reference}`);
    }
  }

  // Tag overlap
  if (q1.tags && q2.tags && q1.tags.length > 0 && q2.tags.length > 0) {
    const tags1 = new Set(q1.tags.map(t => t.toLowerCase()));
    const tags2 = new Set(q2.tags.map(t => t.toLowerCase()));
    const tagSim = jaccardSimilarity(tags1, tags2);
    score += Math.round(tagSim * 20);
    tags1.forEach(t => {
      if (tags2.has(t)) concepts.push(`Thẻ #${t}`);
    });
  }

  return {
    score: Math.min(100, score),
    overlappingConcepts: concepts.slice(0, 5)
  };
}

/**
 * Calculate similarity score between two questions (0 - 100%)
 */
export function calculateQuestionSimilarity(
  q1: QuestionItem,
  q2: QuestionItem
): { 
  score: number; 
  reason: string; 
  matchedPhrases: string[]; 
  duplicateType: DuplicateType;
  domainOverlapScore: number;
  overlappingConcepts: string[];
} {
  const text1 = q1.question_text || '';
  const text2 = q2.question_text || '';

  const { score: domainOverlapScore, overlappingConcepts } = calculateDomainOverlap(q1, q2);

  // 1. Exact text match
  if (text1.trim().toLowerCase() === text2.trim().toLowerCase()) {
    return {
      score: 100,
      reason: 'Nội dung câu hỏi hoàn toàn trùng khớp 100%',
      matchedPhrases: ['100% Exact Match'],
      duplicateType: 'EXACT',
      domainOverlapScore: 100,
      overlappingConcepts: ['Trùng khớp 100% toàn văn']
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
  let combinedScore = (tokenSim * 0.55 + shingSim * 0.35 + (domainOverlapScore / 100) * 0.10) * 100;

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

  let duplicateType: DuplicateType = 'DISTINCT';
  let reason = `Độ tương đồng từ vựng và cấu trúc đạt ${finalScore}%`;

  if (finalScore >= 95) {
    duplicateType = 'EXACT';
    reason = `Trùng lặp gần như tuyệt đối (${finalScore}%)`;
  } else if (finalScore >= 75) {
    duplicateType = 'SEMANTIC_PARAPHRASE';
    reason = `Mức độ tương đồng cao (${finalScore}%) - nghi vấn trùng nội dung hoặc cách diễn đạt`;
  } else if (domainOverlapScore >= 70) {
    duplicateType = 'DOMAIN_OVERLAP';
    reason = `Trùng lặp miền tri thức và mục tiêu khảo thí (${domainOverlapScore}%)`;
  }

  return {
    score: finalScore,
    reason,
    matchedPhrases: matchedPhrases.slice(0, 6),
    duplicateType,
    domainOverlapScore,
    overlappingConcepts
  };
}

/**
 * Scan entire Question Bank or target array for duplicates (Heuristic scan)
 */
export function scanForDuplicates(
  questions: QuestionItem[],
  minThresholdPercent: number = 65,
  onProgress?: (progress: { scanned: number; total: number; found: number }) => void
): DuplicateScanSummary {
  const pairs: DuplicatePair[] = [];
  const n = questions.length;
  let scannedCount = 0;
  let exactCount = 0;
  let semanticCount = 0;
  let domainOverlapCount = 0;
  let highCount = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      scannedCount++;
      const q1 = questions[i];
      const q2 = questions[j];

      const sim = calculateQuestionSimilarity(q1, q2);

      const isCandidate = sim.score >= minThresholdPercent || (sim.domainOverlapScore >= 80 && sim.score >= 50);

      if (isCandidate) {
        if (sim.score === 100) exactCount++;
        else if (sim.score >= 80) highCount++;

        if (sim.duplicateType === 'SEMANTIC_PARAPHRASE') semanticCount++;
        if (sim.duplicateType === 'DOMAIN_OVERLAP') domainOverlapCount++;

        pairs.push({
          id: `dup_${q1.id}_${q2.id}`,
          questionA: q1,
          questionB: q2,
          similarityScore: sim.score,
          domainOverlapScore: sim.domainOverlapScore,
          duplicateType: sim.duplicateType,
          isRedundant: sim.score >= 80 || sim.domainOverlapScore >= 85,
          matchReason: sim.reason,
          matchedPhrases: sim.matchedPhrases,
          overlappingConcepts: sim.overlappingConcepts,
          analysis: sim.reason,
          recommendation: sim.score >= 95 ? 'DELETE_B' : sim.score >= 80 ? 'MERGE' : 'DIFFERENTIATE',
          status: 'PENDING',
          isAiAnalyzed: false
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
    semanticMatchesCount: semanticCount,
    domainOverlapCount: domainOverlapCount,
    highSimilarityCount: highCount,
    isAiPowered: false,
    pairs
  };
}

/**
 * AI-Powered Duplicate Detection using Gemini 3.8 Flash Server API
 * Pre-filters candidate pairs and runs deep semantic & domain overlap analysis
 */
export async function detectDuplicatesWithAI(
  questions: QuestionItem[],
  minThresholdPercent: number = 60,
  onProgress?: (step: string, percent: number) => void
): Promise<DuplicateScanSummary> {
  onProgress?.('Đang lọc các cặp câu hỏi tiềm năng trùng lặp...', 20);

  // 1. Initial heuristic scan to find suspicious candidate pairs (reduces O(N^2) to top pairs)
  const initialScan = scanForDuplicates(questions, minThresholdPercent);
  const candidatePairs = initialScan.pairs.slice(0, 20); // Analyze top candidate pairs

  if (candidatePairs.length === 0) {
    onProgress?.('Không phát hiện nghi vấn trùng lặp nào.', 100);
    return {
      ...initialScan,
      isAiPowered: true
    };
  }

  onProgress?.(`Đang gọi Gemini AI phân tích ngữ nghĩa và độ phủ miền tri thức cho ${candidatePairs.length} cặp...`, 50);

  try {
    const payload = candidatePairs.map(p => ({
      pairId: p.id,
      questionA: {
        id: p.questionA.id,
        question_text: p.questionA.question_text,
        options: p.questionA.options,
        domain: p.questionA.digital_competency_domain || (p.questionA as any).domain,
        subCompetency: p.questionA.digital_sub_competency || (p.questionA as any).subCompetency,
        cognitive_level: p.questionA.cognitive_level,
        legal_reference: p.questionA.legal_reference,
        tags: p.questionA.tags
      },
      questionB: {
        id: p.questionB.id,
        question_text: p.questionB.question_text,
        options: p.questionB.options,
        domain: p.questionB.digital_competency_domain || (p.questionB as any).domain,
        subCompetency: p.questionB.digital_sub_competency || (p.questionB as any).subCompetency,
        cognitive_level: p.questionB.cognitive_level,
        legal_reference: p.questionB.legal_reference,
        tags: p.questionB.tags
      }
    }));

    const response = await fetch('/api/ai/detect-duplicates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidatePairs: payload })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Lỗi máy chủ' }));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const evaluations = data.evaluations || [];

    // Map AI evaluations back to pairs
    const evalMap = new Map<string, any>();
    evaluations.forEach((ev: any) => evalMap.set(ev.pairId, ev));

    let exactCount = 0;
    let semanticCount = 0;
    let domainOverlapCount = 0;
    let highCount = 0;

    const enrichedPairs: DuplicatePair[] = initialScan.pairs.map(p => {
      const aiEval = evalMap.get(p.id);
      if (aiEval) {
        const simScore = typeof aiEval.similarityScore === 'number' ? aiEval.similarityScore : p.similarityScore;
        const domScore = typeof aiEval.domainOverlapScore === 'number' ? aiEval.domainOverlapScore : (p.domainOverlapScore || 0);
        const dupType: DuplicateType = aiEval.duplicateType || p.duplicateType || 'SEMANTIC_PARAPHRASE';

        if (simScore === 100) exactCount++;
        else if (simScore >= 80) highCount++;

        if (dupType === 'SEMANTIC_PARAPHRASE') semanticCount++;
        if (dupType === 'DOMAIN_OVERLAP') domainOverlapCount++;

        return {
          ...p,
          similarityScore: simScore,
          domainOverlapScore: domScore,
          duplicateType: dupType,
          isRedundant: Boolean(aiEval.isRedundant),
          matchReason: aiEval.analysis || p.matchReason,
          analysis: aiEval.analysis || p.analysis,
          overlappingConcepts: aiEval.overlappingConcepts || p.overlappingConcepts || [],
          recommendation: aiEval.recommendation || p.recommendation || 'MERGE',
          differentiateSuggestion: aiEval.differentiateSuggestion,
          isAiAnalyzed: true
        };
      } else {
        if (p.similarityScore === 100) exactCount++;
        else if (p.similarityScore >= 80) highCount++;
        if (p.duplicateType === 'SEMANTIC_PARAPHRASE') semanticCount++;
        if (p.duplicateType === 'DOMAIN_OVERLAP') domainOverlapCount++;
        return p;
      }
    });

    // Re-sort pairs: Redundant first, then by similarity score
    enrichedPairs.sort((a, b) => {
      if (a.isRedundant && !b.isRedundant) return -1;
      if (!a.isRedundant && b.isRedundant) return 1;
      return b.similarityScore - a.similarityScore;
    });

    onProgress?.('Hoàn tất đánh giá trùng lặp AI!', 100);

    return {
      totalScanned: questions.length,
      duplicatePairsFound: enrichedPairs.length,
      exactMatchesCount: exactCount,
      semanticMatchesCount: semanticCount,
      domainOverlapCount: domainOverlapCount,
      highSimilarityCount: highCount,
      isAiPowered: true,
      pairs: enrichedPairs
    };
  } catch (err: any) {
    console.warn('AI detect duplicates failed or offline, using heuristic fallback:', err);
    onProgress?.('AI phát hiện lỗi tạm thời, đã chuyển sang phân tích heuristic.', 100);
    return {
      ...initialScan,
      isAiPowered: false
    };
  }
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
