/**
 * Gemini Studio Service: Multi-turn Chat, Image Creation & Editing, Veo Video Generation
 */
import { geminiKeyService } from './geminiKeyService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  modelUsed?: string;
}

export interface ChatRolePreset {
  id: string;
  title: string;
  badge: string;
  description: string;
  systemInstruction: string;
  recommendedModel: string;
}

export const CHAT_ROLES: ChatRolePreset[] = [
  {
    id: 'BTI_EXAM_EXPERT',
    title: 'Cố vấn Khảo thí BTI 2026',
    badge: 'TT 02/2025',
    description: 'Chuyên gia biên soạn, hiệu đính và thẩm định câu hỏi thi theo Khung năng lực số.',
    recommendedModel: 'gemini-3.1-pro-preview',
    systemInstruction: `Bạn là Cố vấn Khảo thí Cấp cao của Cuộc thi Beyond The Internet 2026 (BTI 2026).
Nhiệm vụ: Tư vấn, xây dựng câu hỏi, thẩm định tính chuẩn xác khoa học công nghệ và căn cứ pháp luật Việt Nam (Thông tư 02/2025/TT-BGDĐT, Nghị định 13/2023/NĐ-CP, Luật An ninh mạng 2018).
Hãy trả lời chuyên sâu, dẫn chứng điều luật cụ thể, văn phong sư phạm chuẩn mực.`
  },
  {
    id: 'BTI_REFEREE',
    title: 'Trọng tài & Luật thi đấu',
    badge: 'Luật thi 4 vòng',
    description: 'Giải đáp quy tắc thi đấu, tính điểm, thời gian và thể thức Khởi động, VCNV, Tăng tốc, Về đích.',
    recommendedModel: 'gemini-3.5-flash',
    systemInstruction: `Bạn là Trưởng Ban Trọng tài Cuộc thi Beyond The Internet 2026.
Nhiệm vụ: Giải đáp luật chơi, cơ chế bấm chuông giành quyền, quy tắc tính điểm 4 vòng (Khởi động, Vượt Chướng Ngại Vật, Tăng tốc, Về đích) và thể thức đề thi Vòng loại 28 câu.
Trả lời súc tích, dứt khoát, công bằng và chính xác theo điều lệ cuộc thi.`
  },
  {
    id: 'FAST_ASSISTANT',
    title: 'Trợ lý Soạn thảo Nhanh',
    badge: 'Phản hồi siêu tốc',
    description: 'Tra cứu nhanh từ khóa, sinh gợi ý chướng ngại vật, viết nhanh câu trắc nghiệm ngắn gọn.',
    recommendedModel: 'gemini-3.1-flash-lite',
    systemInstruction: `Bạn là Trợ lý Soạn thảo Nhanh của Ban Tổ chức BTI 2026.
Nhiệm vụ: Trả lời thật ngắn gọn, đi thẳng vào trọng tâm, đưa ra gợi ý tức thì cho các câu hỏi, từ khóa hoặc tóm tắt nhanh tài liệu.`
  },
  {
    id: 'CYBER_SECURITY',
    title: 'Chuyên gia An toàn số & AI',
    badge: 'Tech & An ninh mạng',
    description: 'Phân tích các bẫy lừa đảo mạng, kỹ thuật Deepfake, bảo mật tài khoản và các xu hướng số 2026.',
    recommendedModel: 'gemini-3.8-flash',
    systemInstruction: `Bạn là Kỹ sư An toàn thông tin và Chuyên gia AI của BTI 2026.
Nhiệm vụ: Cung cấp kiến thức công nghệ hiện đại (phishing, ransomware, deepfake, AI tạo sinh, xác thực đa yếu tố, mã hóa dữ liệu) giúp đưa vào các câu hỏi tình huống thực tế cho học sinh/sinh viên.`
  }
];

export async function sendGeminiChat(
  messages: Array<{ role: 'user' | 'model'; text: string }>,
  systemInstruction?: string,
  model?: string
): Promise<{ text: string; usedModel: string }> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...geminiKeyService.getAuthHeaders() },
    body: JSON.stringify({ messages, systemInstruction, model }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Lỗi gửi tin nhắn đến Gemini.');
  }

  return { text: data.text, usedModel: data.usedModel };
}

export async function generateOrEditImage(options: {
  prompt: string;
  base64Image?: string;
  mimeType?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  mode?: 'generate' | 'edit';
}): Promise<{ imageUrl: string; usedModel: string }> {
  const response = await fetch('/api/ai/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...geminiKeyService.getAuthHeaders() },
    body: JSON.stringify(options),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Lỗi tạo hoặc chỉnh sửa ảnh.');
  }

  return { imageUrl: data.imageUrl, usedModel: data.usedModel };
}

export async function generateVeoVideo(
  options: {
    prompt?: string;
    base64Image: string;
    mimeType?: string;
    aspectRatio?: '16:9' | '9:16';
  },
  onStatusUpdate?: (status: string) => void
): Promise<{ videoUrl: string }> {
  onStatusUpdate?.('Đang gửi ảnh và khởi tạo mô hình Veo (veo-3.1-fast-generate-preview)...');

  const startRes = await fetch('/api/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  const startData = await startRes.json();
  if (!startRes.ok) {
    throw new Error(startData.error || 'Lỗi khi khởi tạo video với Veo.');
  }

  const { operationName } = startData;
  if (!operationName) {
    throw new Error('Không nhận được mã tiến trình video (operationName).');
  }

  // Polling loop with friendly status updates
  const reassuranceMessages = [
    'AI đang phân tích chuyển động không gian và ánh sáng...',
    'Đang render khung hình mượt mà bằng Veo 3.1...',
    'Đang hoàn thiện các chi tiết điện ảnh và độ nét cao...',
    'Sắp hoàn tất, đang đóng gói tệp video MP4...'
  ];

  let pollCount = 0;
  while (true) {
    await new Promise((r) => setTimeout(r, 4000));
    pollCount++;

    const msgIdx = (pollCount - 1) % reassuranceMessages.length;
    onStatusUpdate?.(reassuranceMessages[msgIdx] + ` (Thời gian chờ: ${pollCount * 4}s)`);

    const statusRes = await fetch('/api/video-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationName }),
    });

    const statusData = await statusRes.json();
    if (!statusRes.ok) {
      throw new Error(statusData.error || 'Lỗi kiểm tra tiến trình video.');
    }

    if (statusData.error) {
      throw new Error(statusData.error);
    }

    if (statusData.done) {
      onStatusUpdate?.('Đang tải video hoàn chỉnh từ máy chủ...');
      break;
    }

    if (pollCount > 90) { // 6 minutes limit
      throw new Error('Quá thời gian chờ tạo video (Timeout). Vui lòng thử lại sau.');
    }
  }

  // Download finished video
  const dlRes = await fetch('/api/video-download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationName }),
  });

  if (!dlRes.ok) {
    const errText = await dlRes.text();
    throw new Error(errText || 'Lỗi tải tệp video MP4.');
  }

  const blob = await dlRes.blob();
  const videoUrl = URL.createObjectURL(blob);
  return { videoUrl };
}
