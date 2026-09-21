import { QuestionItem, DigitalCompetencyDomainKey, CognitiveLevel } from '../types';
import { DIGITAL_COMPETENCY_DOMAINS } from '../data/digitalCompetencyData';

export interface AutoTagResult {
  suggestedTags: string[];
  suggestedCategory?: string;
  suggestedDomain?: DigitalCompetencyDomainKey;
  suggestedCognitiveLevel?: CognitiveLevel;
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
 * Local Rule-Based Keyword Extractor for Instant/Offline Auto-Tagging Fallback
 */
export function extractLocalRuleTags(input: AutoTagInput): string[] {
  const textToScan = [
    input.questionText || '',
    input.explanation || '',
    input.legalReference || '',
    input.category || '',
    JSON.stringify(input.options || {})
  ].join(' ').toLowerCase();

  const detectedTags = new Set<string>();

  // Legal Framework Rules
  if (textToScan.includes('13/2023') || textToScan.includes('nghị định 13') || textToScan.includes('bảo vệ dữ liệu cá nhân')) {
    detectedTags.add('nghi_dinh_13');
    detectedTags.add('bao_ve_du_lieu');
  }
  if (textToScan.includes('02/2025') || textToScan.includes('thông tư 02') || textToScan.includes('người học')) {
    detectedTags.add('thong_tu_02');
    detectedTags.add('khung_nang_luc_so');
  }
  if (textToScan.includes('luật an ninh mạng') || textToScan.includes('an ninh mạng 2018')) {
    detectedTags.add('luat_an_ninh_mang');
  }

  // Security & Threats Rules
  if (textToScan.includes('deepfake') || textToScan.includes('giả mạo khuôn mặt') || textToScan.includes('giả mạo giọng nói')) {
    detectedTags.add('deepfake');
    detectedTags.add('ai_gia_mao');
  }
  if (textToScan.includes('phishing') || textToScan.includes('lừa đảo') || textToScan.includes('mạo danh') || textToScan.includes('giả mạo email')) {
    detectedTags.add('phishing');
    detectedTags.add('lua_dao_truc_tuyen');
  }
  if (textToScan.includes('2fa') || textToScan.includes('xác thực hai yếu tố') || textToScan.includes('xác thực 2 lớp') || textToScan.includes('otp')) {
    detectedTags.add('xac_thuc_2fa');
    detectedTags.add('bao_mat_tai_khoan');
  }
  if (textToScan.includes('mật khẩu') || textToScan.includes('password') || textToScan.includes('độ mạnh mật khẩu')) {
    detectedTags.add('mat_khau_manh');
  }
  if (textToScan.includes('mã hóa') || textToScan.includes('encryption') || textToScan.includes('https')) {
    detectedTags.add('ma_hoa_du_lieu');
  }
  if (textToScan.includes('mạng xã hội') || textToScan.includes('facebook') || textToScan.includes('tiktok') || textToScan.includes('zalo')) {
    detectedTags.add('mang_xa_hoi');
  }
  if (textToScan.includes('quyền riêng tư') || textToScan.includes('dấu chân số') || textToScan.includes('pháp lý số')) {
    detectedTags.add('quyen_rieng_tu');
  }
  if (textToScan.includes('bản quyền') || textToScan.includes('sở hữu trí tuệ') || textToScan.includes('liêm chính học thuật') || textToScan.includes('sao chép')) {
    detectedTags.add('so_huu_tri_tue');
    detectedTags.add('liem_chinh_hoc_thuat');
  }
  if (textToScan.includes('sao lưu') || textToScan.includes('backup') || textToScan.includes('3-2-1')) {
    detectedTags.add('sao_luu_321');
  }
  if (textToScan.includes('malware') || textToScan.includes('mã độc') || textToScan.includes('virus') || textToScan.includes('ransomware')) {
    detectedTags.add('ma_doc');
  }

  // Domain Mapping Fallback
  if (input.domain && DIGITAL_COMPETENCY_DOMAINS[input.domain as DigitalCompetencyDomainKey]) {
    const domObj = DIGITAL_COMPETENCY_DOMAINS[input.domain as DigitalCompetencyDomainKey];
    if (domObj?.code) {
      detectedTags.add(`mien_${domObj.code.replace('I', '1').replace('V', '5').toLowerCase()}`);
    }
  }

  return Array.from(detectedTags);
}

/**
 * AI-Powered Auto-Tagging Service using Gemini
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
      if (data.success && Array.isArray(data.suggestedTags)) {
        return {
          suggestedTags: data.suggestedTags,
          suggestedCategory: data.suggestedCategory,
          suggestedDomain: data.suggestedDomain,
          suggestedCognitiveLevel: data.suggestedCognitiveLevel,
          reasoning: data.reasoning,
          isFallback: false
        };
      }
    }

    // Try fallback endpoint /api/ai/classify-question
    const fallbackResponse = await fetch('/api/ai/classify-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionText: input.questionText,
        options: input.options,
        explanation: input.explanation
      })
    });

    if (fallbackResponse.ok) {
      const fbData = await fallbackResponse.json();
      if (fbData.success && fbData.classification && Array.isArray(fbData.classification.tags)) {
        return {
          suggestedTags: fbData.classification.tags,
          suggestedCategory: fbData.classification.suggestedCategory,
          suggestedDomain: fbData.classification.domain,
          suggestedCognitiveLevel: fbData.classification.cognitiveLevel,
          reasoning: 'Gợi ý từ mô hình phân loại Gemini AI',
          isFallback: false
        };
      }
    }
  } catch (err) {
    console.warn('AI Auto-Tagging network request failed, falling back to local rule-based engine:', err);
  }

  // Local fallback
  const localTags = extractLocalRuleTags(input);
  return {
    suggestedTags: localTags.length > 0 ? localTags : ['an_toan_so', 'bti_2026'],
    reasoning: 'Gợi ý bằng Trình trích xuất từ khóa quy tắc nội bộ',
    isFallback: true
  };
}

/**
 * Utility to merge new tags with existing tag string or array
 */
export function mergeTagsList(existing: string | string[], newTags: string[]): string {
  const existingArray = Array.isArray(existing)
    ? existing
    : (existing || '').split(',').map(t => t.trim()).filter(Boolean);

  const set = new Set<string>();
  existingArray.forEach(t => set.add(t.toLowerCase().replace(/^#/, '')));
  newTags.forEach(t => {
    if (t) set.add(t.trim().toLowerCase().replace(/^#/, ''));
  });

  return Array.from(set).join(', ');
}
