import { QuestionItem, DigitalCompetencyDomainKey, CognitiveLevel } from '../types';
import { DIGITAL_COMPETENCY_DOMAINS, COGNITIVE_LEVELS } from '../data/digitalCompetencyData';

export interface AutoTagResult {
  suggestedTags: string[];
  suggestedSubject?: string;
  suggestedCategory?: string;
  suggestedDomain?: DigitalCompetencyDomainKey;
  suggestedDomainName?: string;
  suggestedSubCompetency?: string;
  suggestedSubCompetencyName?: string;
  suggestedLegalReference?: string;
  suggestedCognitiveLevel?: CognitiveLevel;
  confidenceScore?: number; // 0 - 100%
  keyConcepts?: string[];
  reasoning?: string;
  isFallback?: boolean;
}

export interface AutoTagInput {
  questionText: string;
  options?: Record<string, string> | any;
  explanation?: string;
  legalReference?: string;
  category?: string;
  domain?: string;
  cognitiveLevel?: string;
  existingTags?: string[];
}

/**
 * Local Rule-Based Keyword & Classification Extractor for Instant/Offline Auto-Tagging Fallback
 */
export function extractLocalRuleClassification(input: AutoTagInput): AutoTagResult {
  const textToScan = [
    input.questionText || '',
    input.explanation || '',
    input.legalReference || '',
    input.category || '',
    JSON.stringify(input.options || {})
  ].join(' ').toLowerCase();

  const detectedTags = new Set<string>();
  let suggestedDomain: DigitalCompetencyDomainKey = 'MIEN_4';
  let suggestedSubCompetency = '4.1';
  let suggestedSubject = 'An toàn và Bảo vệ dữ liệu số';
  let suggestedLegalReference = '';
  let suggestedCognitiveLevel: CognitiveLevel = 'THONG_HIEU';
  let confidence = 75;
  const keyConcepts: string[] = [];

  // 1. Legal Framework Rules
  if (textToScan.includes('13/2023') || textToScan.includes('nghị định 13') || textToScan.includes('dữ liệu cá nhân')) {
    detectedTags.add('nghi_dinh_13');
    detectedTags.add('bao_ve_du_lieu');
    detectedTags.add('quyen_rieng_tu');
    suggestedDomain = 'MIEN_4';
    suggestedSubCompetency = '4.2';
    suggestedSubject = 'Bảo vệ dữ liệu cá nhân & Quyền riêng tư số';
    suggestedLegalReference = 'Nghị định 13/2023/NĐ-CP (Bảo vệ dữ liệu cá nhân)';
    keyConcepts.push('Dữ liệu cá nhân cơ bản/nhạy cảm', 'Quyền rút lại sự đồng ý');
    confidence = 90;
  } else if (textToScan.includes('02/2025') || textToScan.includes('thông tư 02') || textToScan.includes('người học') || textToScan.includes('chuẩn đầu ra')) {
    detectedTags.add('thong_tu_02');
    detectedTags.add('khung_nang_luc_so');
    suggestedDomain = 'MIEN_5';
    suggestedSubCompetency = '5.1';
    suggestedSubject = 'Khung năng lực số người học & Pháp lý số';
    suggestedLegalReference = 'Thông tư 02/2025/TT-BGDĐT';
    confidence = 88;
  } else if (textToScan.includes('luật an ninh mạng') || textToScan.includes('an ninh mạng 2018') || textToScan.includes('điều 8')) {
    detectedTags.add('luat_an_ninh_mang');
    detectedTags.add('phap_luat_so');
    suggestedDomain = 'MIEN_5';
    suggestedSubCompetency = '5.3';
    suggestedSubject = 'Pháp luật An ninh mạng & Trách nhiệm số';
    suggestedLegalReference = 'Luật An ninh mạng 2018 (Điều 8 & 16)';
    confidence = 88;
  }

  // 2. Security, Threats & AI Rules
  if (textToScan.includes('deepfake') || textToScan.includes('giả mạo khuôn mặt') || textToScan.includes('giả mạo giọng nói') || textToScan.includes('hoán đổi khuôn mặt')) {
    detectedTags.add('deepfake');
    detectedTags.add('ai_gia_mao');
    detectedTags.add('phong_chong_lua_dao');
    suggestedDomain = 'MIEN_4';
    suggestedSubCompetency = '4.3';
    suggestedSubject = 'Nhận diện Deepfake & Giả mạo AI';
    keyConcepts.push('Kỹ thuật Deepfake', 'Dấu hiệu nhận biết chớp mắt/biến dạng');
    confidence = 95;
  }
  
  if (textToScan.includes('phishing') || textToScan.includes('lừa đảo') || textToScan.includes('mạo danh') || textToScan.includes('link lạ') || textToScan.includes('tin nhắn mạo danh')) {
    detectedTags.add('phishing');
    detectedTags.add('lua_dao_truc_tuyen');
    detectedTags.add('an_toan_mang');
    suggestedDomain = 'MIEN_4';
    suggestedSubCompetency = '4.1';
    suggestedSubject = 'Phòng chống Tấn công Phishing & Lừa đảo số';
    keyConcepts.push('Kỹ thuật Phishing', 'Kiểm tra tên miền URL');
    confidence = 92;
  }

  if (textToScan.includes('2fa') || textToScan.includes('xác thực hai yếu tố') || textToScan.includes('otp') || textToScan.includes('mật khẩu') || textToScan.includes('password')) {
    detectedTags.add('xac_thuc_2fa');
    detectedTags.add('mat_khau_manh');
    detectedTags.add('bao_mat_tai_khoan');
    suggestedDomain = 'MIEN_4';
    suggestedSubCompetency = '4.1';
    suggestedSubject = 'Quản trị danh tính & Xác thực đa yếu tố (2FA)';
    confidence = 90;
  }

  if (textToScan.includes('bản quyền') || textToScan.includes('sở hữu trí tuệ') || textToScan.includes('creative commons') || textToScan.includes('liêm chính học thuật') || textToScan.includes('đạo văn')) {
    detectedTags.add('so_huu_tri_tue');
    detectedTags.add('liem_chinh_hoc_thuat');
    detectedTags.add('ban_quyen_so');
    suggestedDomain = 'MIEN_6';
    suggestedSubCompetency = '6.3';
    suggestedSubject = 'Bản quyền số & Liêm chính học thuật GenAI';
    keyConcepts.push('Giấy phép Creative Commons', 'Trích dẫn nguồn');
    confidence = 92;
  }

  if (textToScan.includes('mạng xã hội') || textToScan.includes('cyberbullying') || textToScan.includes('bắt nạt mạng') || textToScan.includes('văn hóa mạng') || textToScan.includes('dấu chân số')) {
    detectedTags.add('van_hoa_mang');
    detectedTags.add('dau_chan_so');
    detectedTags.add('giao_tiep_so');
    suggestedDomain = 'MIEN_3';
    suggestedSubCompetency = '3.2';
    suggestedSubject = 'Văn hóa ứng xử & Quản trị dấu chân số';
    confidence = 88;
  }

  if (textToScan.includes('chatgpt') || textToScan.includes('prompt') || textToScan.includes('generative ai') || textToScan.includes('ảo giác ai') || textToScan.includes('hallucination')) {
    detectedTags.add('generative_ai');
    detectedTags.add('ky_thuat_prompt');
    detectedTags.add('tri_tue_nhan_tao');
    suggestedDomain = 'MIEN_6';
    suggestedSubCompetency = '6.1';
    suggestedSubject = 'Ứng dụng Trí tuệ nhân tạo (GenAI) & Prompt Engineering';
    confidence = 92;
  }

  if (textToScan.includes('tìm kiếm') || textToScan.includes('xác thực thông tin') || textToScan.includes('tin giả') || textToScan.includes('fake news') || textToScan.includes('fact check')) {
    detectedTags.add('kiem_chung_tin_tuc');
    detectedTags.add('chong_tin_gia');
    detectedTags.add('danh_gia_du_lieu');
    suggestedDomain = 'MIEN_2';
    suggestedSubCompetency = '2.2';
    suggestedSubject = 'Khai thác dữ liệu & Kiểm chứng tin giả (Fact-Checking)';
    confidence = 90;
  }

  // Cognitive level heuristic
  if (textToScan.includes('tình huống') || textToScan.includes('xử lý như thế nào') || textToScan.includes('hành vi nào sau đây đúng')) {
    suggestedCognitiveLevel = 'VAN_DUNG';
  } else if (textToScan.includes('phân tích') || textToScan.includes('hậu quả pháp lý') || textToScan.includes('chiến lược')) {
    suggestedCognitiveLevel = 'VAN_DUNG_CAO';
  } else if (textToScan.includes('định nghĩa') || textToScan.includes('là gì') || textToScan.includes('khái niệm')) {
    suggestedCognitiveLevel = 'NHAN_BIET';
  }

  const domObj = DIGITAL_COMPETENCY_DOMAINS[suggestedDomain];

  return {
    suggestedTags: Array.from(detectedTags),
    suggestedSubject,
    suggestedCategory: suggestedSubject,
    suggestedDomain,
    suggestedDomainName: domObj?.name || '',
    suggestedSubCompetency,
    suggestedSubCompetencyName: domObj?.subCompetencies?.find(s => s.code === suggestedSubCompetency)?.name || '',
    suggestedLegalReference,
    suggestedCognitiveLevel,
    confidenceScore: confidence,
    keyConcepts,
    reasoning: `Phân tích dựa trên ngữ nghĩa từ khóa và mục tiêu khảo thí (${suggestedSubject}).`,
    isFallback: true
  };
}

/**
 * AI-Powered Auto-Tagging & Classification Service using Gemini 3.8 Flash
 */
export async function generateAutoTagsWithAI(input: AutoTagInput): Promise<AutoTagResult> {
  try {
    const response = await fetch('/api/ai/auto-suggest-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && (data.suggestedTags || data.suggestedSubject || data.suggestedDomain)) {
        const domKey = (data.suggestedDomain as DigitalCompetencyDomainKey) || 'MIEN_4';
        const domObj = DIGITAL_COMPETENCY_DOMAINS[domKey];

        return {
          suggestedTags: Array.isArray(data.suggestedTags) ? data.suggestedTags : [],
          suggestedSubject: data.suggestedSubject || data.suggestedCategory || 'An toàn số',
          suggestedCategory: data.suggestedCategory || data.suggestedSubject || 'An toàn số',
          suggestedDomain: domKey,
          suggestedDomainName: data.suggestedDomainName || domObj?.name || '',
          suggestedSubCompetency: data.suggestedSubCompetency || '4.1',
          suggestedSubCompetencyName: data.suggestedSubCompetencyName || domObj?.subCompetencies?.find(s => s.code === data.suggestedSubCompetency)?.name || '',
          suggestedLegalReference: data.suggestedLegalReference || '',
          suggestedCognitiveLevel: data.suggestedCognitiveLevel as CognitiveLevel || 'THONG_HIEU',
          confidenceScore: typeof data.confidenceScore === 'number' ? data.confidenceScore : 92,
          keyConcepts: Array.isArray(data.keyConcepts) ? data.keyConcepts : [],
          reasoning: data.reasoning || 'Phân tích tự động từ mô hình Gemini 3.8 Flash',
          isFallback: false
        };
      }
    }
  } catch (err) {
    console.warn('AI Auto-Tagging network request failed, falling back to local rule-based engine:', err);
  }

  // Fallback to local rule-based classifier
  return extractLocalRuleClassification(input);
}

/**
 * Merge newly suggested tags into an existing comma-separated tags string or array without duplicates
 */
export function mergeTagsList(existingTags: string | string[], newTags: string[]): string {
  const current = Array.isArray(existingTags)
    ? existingTags.map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean)
    : (existingTags || '')
        .split(',')
        .map(t => t.trim().toLowerCase().replace(/^#/, ''))
        .filter(Boolean);

  const set = new Set(current);
  newTags.forEach(t => {
    const clean = t.trim().toLowerCase().replace(/^#/, '');
    if (clean) set.add(clean);
  });

  return Array.from(set).join(', ');
}
