import { QuestionItem, ItemFlawReport } from '../types';
import { questionBankManager } from './questionBankManager';

interface TerminologyReplacement {
  regex: RegExp;
  replacement: string;
  termName: string;
}

const TERMINOLOGY_RULES: TerminologyReplacement[] = [
  { regex: /\binternet\b/g, replacement: 'Internet', termName: 'Internet (viết hoa chuẩn quốc tế)' },
  { regex: /\b(phishing|Phising)\b/g, replacement: 'Phishing', termName: 'Phishing (tấn công giả mạo)' },
  { regex: /\b(ddos|Ddos|DDOS)\b/g, replacement: 'DDoS', termName: 'DDoS (từ viết tắt chuẩn)' },
  { regex: /\b(ransomware|RansomWare)\b/g, replacement: 'Ransomware', termName: 'Ransomware (mã độc tống tiền)' },
  { regex: /\b(wifi|wi-fi|Wifi)\b/g, replacement: 'Wi-Fi', termName: 'Wi-Fi (chuẩn liên minh Wi-Fi)' },
  { regex: /\b(ipv4|Ipv4|IP v4)\b/g, replacement: 'IPv4', termName: 'IPv4 (chuẩn giao thức IP)' },
  { regex: /\b(ipv6|Ipv6|IP v6)\b/g, replacement: 'IPv6', termName: 'IPv6 (chuẩn giao thức IP)' },
  { regex: /\b(bluetooth|BlueTooth)\b/g, replacement: 'Bluetooth', termName: 'Bluetooth' },
  { regex: /\b(malware|MalWare)\b/g, replacement: 'Malware', termName: 'Malware (mã độc hại)' },
  { regex: /\b(firewall|FireWall)\b/g, replacement: 'Firewall', termName: 'Firewall (tường lửa mạng)' },
  { regex: /\b(deepfake|DeepFake)\b/g, replacement: 'Deepfake', termName: 'Deepfake' },
];

const DEPRECATED_LAWS = [
  {
    regex: /Luật Giao dịch điện tử (?:năm )?2005/gi,
    replacement: 'Luật Giao dịch điện tử 2023 (Luật số 20/2023/QH15, có hiệu lực từ 01/07/2024)',
    lawName: 'Luật Giao dịch điện tử 2005 (đã hết hiệu lực từ ngày 01/07/2024)'
  },
  {
    regex: /Nghị định (?:số )?72\/2013\/NĐ-CP/gi,
    replacement: 'Nghị định 147/2024/NĐ-CP (thay thế Nghị định 72/2013/NĐ-CP từ tháng 12/2024)',
    lawName: 'Nghị định 72/2013/NĐ-CP (được thay thế bởi NĐ 147/2024/NĐ-CP)'
  }
];

export const regulatoryLinterService = {
  /**
   * Scans a question for terminology inconsistencies and deprecated legal citations
   */
  lintQuestion(q: QuestionItem): ItemFlawReport[] {
    const flaws: ItemFlawReport[] = [];
    const fullText = `${q.question_text} ${q.explanation} ${q.legal_reference || ''} ${Object.values(q.options || {}).join(' ')}`;

    // 1. Check Deprecated Laws
    DEPRECATED_LAWS.forEach(rule => {
      if (rule.regex.test(fullText)) {
        flaws.push({
          questionId: q.id,
          questionText: q.question_text,
          flawType: 'DEPRECATED_LEGAL',
          severity: 'CRITICAL',
          details: `Phát hiện trích dẫn văn bản quy phạm pháp luật đã hết hiệu lực: "${rule.lawName}".`,
          suggestedFix: `Thay thế bằng căn cứ pháp lý hiện hành: "${rule.replacement}".`
        });
      }
    });

    // 2. Check Non-standard Tech Terminology
    TERMINOLOGY_RULES.forEach(rule => {
      const match = fullText.match(rule.regex);
      if (match && match.some(m => m !== rule.replacement)) {
        flaws.push({
          questionId: q.id,
          questionText: q.question_text,
          flawType: 'TERMINOLOGY_ISSUE',
          severity: 'INFO',
          details: `Thuật ngữ CNTT chưa chuẩn hóa: Tìm thấy "${match[0]}", chuẩn Bộ TT&TT quy định là "${rule.replacement}".`,
          suggestedFix: `Tự động chuẩn hóa thành "${rule.replacement}".`
        });
      }
    });

    return flaws;
  },

  /**
   * Scans the entire bank for regulatory and terminology issues
   */
  lintBank(customQuestions?: QuestionItem[]): ItemFlawReport[] {
    const questions = customQuestions || questionBankManager.getQuestions();
    const allFlaws: ItemFlawReport[] = [];

    questions.forEach(q => {
      const qFlaws = this.lintQuestion(q);
      allFlaws.push(...qFlaws);
    });

    return allFlaws;
  },

  /**
   * Auto-fixes terminology issues across a list of questions in 1-Click
   */
  autoFixTerminology(questionIds: string[]): number {
    let fixedCount = 0;

    questionIds.forEach(id => {
      const q = questionBankManager.getQuestionById(id);
      if (!q) return;

      let changed = false;
      let newText = q.question_text;
      let newExp = q.explanation;
      let newLegal = q.legal_reference || '';
      const newOpts: Record<string, string> = { ...q.options };

      // Apply terminology replacements
      TERMINOLOGY_RULES.forEach(rule => {
        if (rule.regex.test(newText)) {
          newText = newText.replace(rule.regex, rule.replacement);
          changed = true;
        }
        if (rule.regex.test(newExp)) {
          newExp = newExp.replace(rule.regex, rule.replacement);
          changed = true;
        }
        if (newLegal && rule.regex.test(newLegal)) {
          newLegal = newLegal.replace(rule.regex, rule.replacement);
          changed = true;
        }
        Object.keys(newOpts).forEach(k => {
          if (rule.regex.test(newOpts[k])) {
            newOpts[k] = newOpts[k].replace(rule.regex, rule.replacement);
            changed = true;
          }
        });
      });

      // Apply deprecated law replacements
      DEPRECATED_LAWS.forEach(law => {
        if (law.regex.test(newText)) {
          newText = newText.replace(law.regex, law.replacement);
          changed = true;
        }
        if (law.regex.test(newExp)) {
          newExp = newExp.replace(law.regex, law.replacement);
          changed = true;
        }
        if (newLegal && law.regex.test(newLegal)) {
          newLegal = newLegal.replace(law.regex, law.replacement);
          changed = true;
        }
      });

      if (changed) {
        questionBankManager.updateQuestion(q.id, {
          question_text: newText,
          explanation: newExp,
          legal_reference: newLegal || undefined,
          options: newOpts
        }, 'Tự động chuẩn hóa thuật ngữ CNTT & cập nhật căn cứ pháp lý hiện hành');
        fixedCount++;
      }
    });

    return fixedCount;
  }
};
