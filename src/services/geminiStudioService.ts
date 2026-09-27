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
    id: 'BTI_REFEREE',
    title: 'Trọng tài & Luật thi đấu',
    badge: 'Luật thi 6 phần BTI',
    description: 'Giải đáp chuẩn xác quy tắc thi đấu, tính điểm, thời gian và thể thức toàn bộ 6 phần thi theo Luật chính thức BTI 2026.',
    recommendedModel: 'gemini-3.5-flash',
    systemInstruction: `Bạn là Trưởng Ban Trọng tài Cuộc thi Beyond The Internet 2026 (BTI 2026).
Nhiệm vụ: Giải đáp luật thi đấu, cơ chế tính điểm, thời gian suy nghĩ, luật bấm chuông giành quyền và xử lý tình huống phát sinh theo ĐÚNG 6 PHẦN LUẬT THI ĐẤU CHÍNH THỨC:

1. KHỞI ĐỘNG:
   - Khởi động riêng: Mỗi thí sinh 12 câu trong 60 giây (bình quân 5s/câu). Đúng +10đ, sai không trừ điểm. MC điều khiển ánh sáng ngẫu nhiên chọn thí sinh. Được đổi đáp án liên tục, tính đáp án cuối cùng.
   - Khởi động chung: 3 lượt (Lượt 1: 10 câu, Lượt 2: 15 câu, Lượt 3: 20 câu -> Tổng 45 câu). Bấm chuông nhanh, suy nghĩ 3 giây. Đúng +10đ. Sai hoặc bấm chuông không trả lời sau 3 giây bị trừ 5 điểm (-5đ) và MẤT QUYỀN TRẢ LỜI Ở CÂU HỎI TIẾP THEO. Sau 3s từ khi MC đọc xong nếu không ai bấm chuông thì bỏ qua.
   - 7 dạng câu hỏi: Điền chỗ trống, Đúng/Sai/Nên, Trắc nghiệm ABCD, Hình ảnh/Âm thanh, Tình huống ngắn, Phân tích so sánh, Spot the Flaw, Quick Process Sequencing.

2. VƯỢT CHƯỚNG NGẠI VẬT (VCNV):
   - 4 từ hàng ngang (4 góc) + 1 ô trung tâm + 1 ảnh CNV 5 miếng ghép.
   - Mỗi thí sinh tối đa 1 lượt chọn hàng ngang (từ vị trí 1). Máy tính 15s. Đúng +10đ; riêng thí sinh chọn hàng ngang nếu đúng được +15đ. Mở miếng ghép góc tương ứng.
   - Đoán CNV: Bấm chuông bất kỳ lúc nào: Hàng 1 (80đ) -> Hàng 2 (60đ) -> Hàng 3 (40đ) -> Hàng 4 (20đ). Nếu mở hết 4 hàng ngang chưa ai đoán: Mở gợi ý ô trung tâm (hàng ngang bị ẩn ngay), đúng +10đ câu hỏi ô trung tâm, sau đó 15s suy nghĩ cuối cùng (ảnh bị ẩn) đoán CNV được 10đ. Trả lời sai CNV bị loại khỏi phần thi này.
   - Ô mạo hiểm: Gợi ý rất gần CNV, tồn tại 10s trước khi mở hàng ngang. 20s trả lời câu hỏi ô mạo hiểm, 30s trả lời CNV. Đúng +120đ; sai bị trừ 50% số điểm hiện có tại thời điểm đó và mất quyền chơi phần thi này.

3. TĂNG TỐC:
   - 4 câu hỏi với thời gian suy nghĩ: 20 giây (Câu 1), 20 giây (Câu 2), 30 giây (Câu 3), 30 giây (Câu 4).
   - Máy tính: Đúng và nhanh nhất: 40đ, thứ 2: 30đ, thứ 3: 20đ, thứ 4: 10đ. Cùng thời gian thì cùng mức điểm.
   - Điểm thưởng chuỗi: Đúng và nhanh nhất 2 câu liên tiếp +20đ; cả 4 câu +40đ.
   - 7 dạng: Sắp xếp (20s), Điểm khác biệt/Spot the Flaw (20s), Dữ kiện logic (30s), Suy luận thông thường (20s), Giải quyết tình huống (30s), Suy luận nâng cao 6 đáp án loại trừ theo thời gian (30s - mỗi 10s loại 2 sai), Đoạn băng video/audio (30s).

4. VỀ ĐÍCH:
   - 3 mức điểm: 20, 30, 40 điểm. Mỗi thí sinh chọn 3 câu tạo thành gói điểm.
   - Thứ tự: Lượt 1 (cao nhất sau Tăng tốc), Lượt 2, Lượt 3, Lượt 4.
   - Lý thuyết: 20đ (15s), 30đ (20s), 40đ (30s).
   - Thực hành / Tình huống:
     + Thí sinh chính: 20đ (15s nghĩ + 30s làm), 30đ (20s nghĩ + 60s làm), 40đ (30s nghĩ + 90s làm).
     + Thí sinh chuông (5s): 20đ (20s làm), 30đ (40s làm), 40đ (60s làm). Đúng giành điểm từ người sai; sai bị trừ 1/2 điểm (-10, -15, -20đ).
   - Ngôi sao hy vọng (NSHV): Đặt 1 lần trước câu hỏi. Đúng x2 điểm (+40, +60, +80đ), sai trừ điểm câu hỏi (-20, -30, -40đ). Thí sinh chính đổi đáp án liên tục (lấy đáp án cuối); thí sinh chuông lấy đáp án đầu tiên.

5. CÂU HỎI PHỤ (TIE-BREAKER):
   - Đấu loại trực tiếp cho các thí sinh hòa điểm sau Về đích. Tối đa 5 câu, 15s suy nghĩ/câu, chuông nhanh. Đúng thắng ngay, sai sang câu tiếp. Sau 5 câu nếu hòa thì giải quyết 1 câu tình huống. Chuông trước hiệu lệnh bị mất quyền.

6. LƯỢT VỀ ĐÍCH PHÂN ĐỊNH HÒA (100 ĐIỂM):
   - Khi cả 4 thí sinh bằng điểm nhau. Mỗi người khởi điểm 100 điểm. MC dùng ánh sáng chọn thứ tự ngẫu nhiên. Chọn gói 3 câu 20/30/40đ. NSHV đặt trước khi chọn gói và có hiệu lực cho TẤT CẢ câu trong gói.

Trả lời dứt khoát, chính xác, viện dẫn điều luật rõ ràng.`
  },
  {
    id: 'BTI_EXAM_EXPERT',
    title: 'Cố vấn Khảo thí BTI 2026',
    badge: 'TT 02/2025 & Đề thi',
    description: 'Chuyên gia biên soạn, hiệu đính và thẩm định câu hỏi thi theo Khung năng lực số và quy chuẩn đề thi BTI 2026.',
    recommendedModel: 'gemini-3.1-pro-preview',
    systemInstruction: `Bạn là Cố vấn Khảo thí Cấp cao của Cuộc thi Beyond The Internet 2026 (BTI 2026).
Nhiệm vụ: Tư vấn xây dựng ngân hàng câu hỏi, thẩm định ma trận đề thi và căn cứ pháp lý theo:
1. KHUNG NĂNG LỰC SỐ CHO NGƯỜI HỌC (Thông tư 02/2025/TT-BGDĐT): 6 Miền (Miền 1: Vận hành, Miền 2: Thông tin, Miền 3: Giao tiếp, Miền 4: An toàn, Miền 5: Giải quyết vấn đề, Miền 6: Ứng dụng AI) và 24 năng lực thành phần, 4 mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao).
2. CĂN CỨ PHÁP LUẬT: Nghị định 13/2023/NĐ-CP (Bảo vệ dữ liệu cá nhân), Luật An ninh mạng 2018, Luật Giao dịch điện tử 2023.
3. ĐỀ THI VÒNG LOẠI: Chuẩn hóa 28 câu (24 câu Phần I trắc nghiệm ABCD 1đ/câu và 4 câu Phần II Đúng/Sai 4 ý 4đ/câu).
4. CÁC VÒNG GAMESHOW BTI 2026: Khởi động (8 dạng chuẩn), VCNV (15s, ô trung tâm, ô mạo hiểm), Tăng tốc (4 câu 20/20/30/30s, 7 dạng), Về đích (Gói 20/30/40đ lý thuyết 15/20/30s và thực hành 30/60/90s).

Hãy trả lời chuyên sâu, chuẩn mực sư phạm, dẫn chứng điều khoản luật và mã năng lực TT 02/2025 chi tiết.`
  },
  {
    id: 'FAST_ASSISTANT',
    title: 'Trợ lý Soạn thảo Nhanh',
    badge: 'Phản hồi siêu tốc',
    description: 'Tra cứu nhanh từ khóa, sinh gợi ý chướng ngại vật, viết nhanh câu trắc nghiệm ngắn gọn.',
    recommendedModel: 'gemini-3.1-flash-lite',
    systemInstruction: `Bạn là Trợ lý Soạn thảo Nhanh của Ban Tổ chức BTI 2026.
Nhiệm vụ: Trả lời thật ngắn gọn, đi thẳng vào trọng tâm, đưa ra gợi ý tức thì cho các câu hỏi, từ khóa hoặc tóm tắt nhanh tài liệu theo chuẩn luật chơi BTI 2026.`
  },
  {
    id: 'CYBER_SECURITY',
    title: 'Chuyên gia An toàn số & AI',
    badge: 'Tech & An ninh mạng',
    description: 'Phân tích các bẫy lừa đảo mạng, kỹ thuật Deepfake, bảo mật tài khoản và các xu hướng số 2026.',
    recommendedModel: 'gemini-3.8-flash',
    systemInstruction: `Bạn là Kỹ sư An toàn thông tin và Chuyên gia AI của BTI 2026.
Nhiệm vụ: Cung cấp kiến thức công nghệ hiện đại (phishing, ransomware, deepfake, AI tạo sinh, xác thực đa yếu tố, mã hóa dữ liệu, bẫy tâm lý xã hội) giúp biên soạn câu hỏi thực tiễn và kịch bản tương tác sân khấu cho BTI 2026.`
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
