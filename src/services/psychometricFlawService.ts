import { QuestionItem, ItemFlawReport } from '../types';
import { questionBankManager } from './questionBankManager';

export interface KeyDistributionAnalysis {
  totalMultipleChoice: number;
  distribution: Record<string, { count: number; percentage: number }>;
  isBalanced: boolean;
  warnings: string[];
}

export const psychometricFlawService = {
  /**
   * Scans a single question for classical item writing flaws
   */
  inspectQuestion(q: QuestionItem): ItemFlawReport[] {
    const flaws: ItemFlawReport[] = [];
    const opts = q.options || {};
    const optKeys = Object.keys(opts);
    const correctKey = (q.correct_key || '').trim().toUpperCase();

    // 1. Multiple Choice Specific Flaws
    if (optKeys.length >= 3 && optKeys.includes(correctKey)) {
      const correctText = opts[correctKey] || '';
      const distractorTexts = optKeys.filter(k => k !== correctKey).map(k => opts[k] || '');
      const avgDistractorLen = distractorTexts.reduce((acc, t) => acc + t.length, 0) / distractorTexts.length;

      // 1.1 Length Bias Flaw: Correct option is > 45% longer than average distractors
      if (avgDistractorLen > 10 && correctText.length > avgDistractorLen * 1.55) {
        flaws.push({
          questionId: q.id,
          questionText: q.question_text,
          flawType: 'LENGTH_BIAS',
          severity: 'WARNING',
          details: `Đáp án đúng (${correctKey}) dài ${correctText.length} ký tự, vượt hơn 55% so với độ dài trung bình của các phương án sai (${Math.round(avgDistractorLen)} ký tự). Thí sinh có thể đoán mò phương án dài nhất.`,
          suggestedFix: 'Rút gọn nội dung đáp án đúng hoặc bổ sung chi tiết cho các phương án nhiễu để độ dài tương đương nhau.'
        });
      }

      // 1.2 Dead Distractor Flaw: Distractor is suspiciously short (< 4 chars) or trivial
      distractorTexts.forEach((dText, idx) => {
        if (dText.trim().length <= 3 && correctText.length > 15) {
          flaws.push({
            questionId: q.id,
            questionText: q.question_text,
            flawType: 'DEAD_DISTRACTOR',
            severity: 'CRITICAL',
            details: `Phương án nhiễu quá ngắn hoặc sơ sài ("${dText.trim()}"), thí sinh dễ dàng loại bỏ ngay lập tức (Dead Distractor).`,
            suggestedFix: 'Viết lại phương án nhiễu với nội dung học thuật có tính thuyết phục và gây bẫy hợp lý hơn.'
          });
        }
      });

      // 1.3 Clue Leakage Flaw: Rare significant word from question text appears only in the correct option
      const qWords = q.question_text.toLowerCase().split(/[\s,.\-?!:()"/]+/).filter(w => w.length > 5);
      const significantClues = qWords.filter(w => 
        !['những', 'phương', 'án', 'nào', 'sau', 'đây', 'theo', 'trong', 'được', 'người', 'thông', 'tin'].includes(w)
      );

      for (const clue of significantClues) {
        const inCorrect = correctText.toLowerCase().includes(clue);
        const inDistractors = distractorTexts.some(d => d.toLowerCase().includes(clue));
        if (inCorrect && !inDistractors) {
          flaws.push({
            questionId: q.id,
            questionText: q.question_text,
            flawType: 'CLUE_LEAK',
            severity: 'WARNING',
            details: `Từ khóa đặc thù "${clue}" ở đề bài chỉ xuất hiện trong đáp án đúng (${correctKey}), tạo manh mối vô tình chỉ điểm đáp án.`,
            suggestedFix: 'Thay thế từ khóa chỉ điểm trong đáp án bằng từ đồng nghĩa hoặc đưa từ khóa đó vào thêm 1 phương án nhiễu khác.'
          });
          break; // Report once per question
        }
      }
    }

    return flaws;
  },

  /**
   * Scans the entire question bank for item flaws
   */
  scanBankForFlaws(customQuestions?: QuestionItem[]): ItemFlawReport[] {
    const questions = customQuestions || questionBankManager.getQuestions();
    const allFlaws: ItemFlawReport[] = [];

    questions.forEach(q => {
      const qFlaws = this.inspectQuestion(q);
      allFlaws.push(...qFlaws);
    });

    return allFlaws;
  },

  /**
   * Analyzes Key Distribution (A, B, C, D balance) across multiple-choice questions
   */
  analyzeKeyDistribution(customQuestions?: QuestionItem[]): KeyDistributionAnalysis {
    const questions = customQuestions || questionBankManager.getQuestions();
    const mcQuestions = questions.filter(q => q.options && Object.keys(q.options).length >= 3);
    const total = mcQuestions.length;

    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    mcQuestions.forEach(q => {
      const key = (q.correct_key || '').trim().toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    const distribution: Record<string, { count: number; percentage: number }> = {};
    const warnings: string[] = [];

    ['A', 'B', 'C', 'D'].forEach(key => {
      const c = counts[key] || 0;
      const pct = total > 0 ? Math.round((c / total) * 100) : 0;
      distribution[key] = { count: c, percentage: pct };

      if (total >= 10) {
        if (pct > 35) {
          warnings.push(`Đáp án ${key} chiếm tỉ lệ quá cao (${pct}% > 35%), gây lệch tâm lý chọn đáp án cho thí sinh.`);
        } else if (pct < 15) {
          warnings.push(`Đáp án ${key} xuất hiện quá ít (${pct}% < 15%), phân bổ chưa cân đối.`);
        }
      }
    });

    return {
      totalMultipleChoice: total,
      distribution,
      isBalanced: warnings.length === 0,
      warnings
    };
  }
};
