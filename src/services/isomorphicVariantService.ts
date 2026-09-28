import { QuestionItem } from '../types';
import { questionBankManager } from './questionBankManager';

export const isomorphicVariantService = {
  /**
   * Generates a paired isomorphic twin question (for emergency backup or alternative forms)
   */
  createIsomorphicVariant(
    parentQuestion: QuestionItem,
    variation: {
      question_text: string;
      options?: Record<string, string>;
      correct_key: string;
      explanation?: string;
      notes?: string;
    },
    user: string = 'Ban Đề Thi'
  ): QuestionItem {
    const variantId = `VAR_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    const newVariant: QuestionItem = {
      ...parentQuestion,
      id: variantId,
      question_text: variation.question_text,
      options: variation.options || parentQuestion.options,
      correct_key: variation.correct_key,
      explanation: variation.explanation || parentQuestion.explanation,
      host_notes: variation.notes || `[Câu hỏi dự phòng song sinh 1:1 của mã ${parentQuestion.id}]`,
      parent_question_id: parentQuestion.id,
      variant_type: 'ISOMORPHIC',
      vault_partition: 'RESERVE', // Default to Reserve vault for backups
      lifecycle_status: 'APPROVED',
      created_by: `Variant Generator (${user})`,
      created_at: Date.now()
    };

    questionBankManager.addQuestion(newVariant);
    return newVariant;
  },

  /**
   * Get all sibling variants belonging to a parent question
   */
  getVariantsForQuestion(questionId: string): QuestionItem[] {
    return questionBankManager.getQuestions().filter(
      q => q.parent_question_id === questionId || q.id === questionId
    );
  },

  /**
   * Pre-generates AI prompt for Gemini to create a 1:1 isomorphic twin
   */
  buildTwinPrompt(q: QuestionItem): string {
    const isMc = q.options && Object.keys(q.options).length > 0;
    return `Bạn là Chuyên gia Khảo thí cấp cao của Cuộc thi BTI 2026.
Hãy tạo 1 CÂU HỎI SONG SINH (ISOMORPHIC TWIN VARIANT) tương đương 1:1 về độ khó và chuẩn năng lực cho câu hỏi gốc sau đây:

[CÂU HỎI GỐC]:
- Vòng thi: ${q.round_name} (${q.points || 10} điểm, ${q.time_limit} giây)
- Mức độ nhận thức: ${q.cognitive_level || 'THONG_HIEU'}
- Miền năng lực số: ${q.digital_competency_domain || 'MIEN_1'}
- Đề bài: "${q.question_text}"
${isMc ? `- Các phương án: ${JSON.stringify(q.options)}\n- Đáp án đúng: ${q.correct_key}` : `- Đáp án chuẩn: ${q.correct_key}`}
- Căn cứ pháp lý: ${q.legal_reference || 'Nghị định 13/2023/NĐ-CP & Thông tư 02/2025/TT-BGDĐT'}

[QUY TẮC BẮT BUỘC CHO BIẾN THỂ SONG SINH]:
1. Giữ nguyên 100% về: Mức độ tư duy, thang điểm, chuẩn năng lực số và phong cách thi BTI.
2. Đổi ngữ cảnh: Thay đổi thông số kỹ thuật số, tên phần mềm/giao thức tương đương, hoặc tình huống an toàn thông tin song song.
3. Độ khó tuyệt đối cân bằng để làm câu hỏi dự phòng thay thế trên sân khấu nếu có khiếu nại.`;
  }
};
