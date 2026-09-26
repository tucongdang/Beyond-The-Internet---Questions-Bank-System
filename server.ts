import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type, GenerateVideosOperation } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Health check endpoint for Cloud Run
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Resilient Gemini content generator with exponential backoff, Search Grounding & multi-tier model fallbacks
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  async function generateWithFallback(ai: GoogleGenAI, params: any) {
    // Approved models hierarchy with gemini-3.8-flash for multimodal & fast text
    const fallbackModels = [
      "gemini-3.8-flash",
      "gemini-3.5-flash",
      "gemini-3.6-flash",
      "gemini-flash-latest",
      "gemini-3.1-flash-lite"
    ];

    let lastError: any = null;

    const { useSearchGrounding = true, config = {}, ...restParams } = params;

    const configWithSearch = {
      ...config,
    };

    // Attach Google Search Grounding tool if enabled
    if (useSearchGrounding !== false) {
      configWithSearch.tools = [
        ...(configWithSearch.tools || []),
        { googleSearch: {} }
      ];
    }

    for (let i = 0; i < fallbackModels.length; i++) {
      const model = fallbackModels[i];
      const maxRetries = 2;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await ai.models.generateContent({
            ...restParams,
            config: configWithSearch,
            model,
          });
          return result;
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.code || err?.error?.code;
          const message = err?.message || String(err);
          const isTransient = 
            status === 503 || 
            status === 429 || 
            status === "UNAVAILABLE" || 
            status === "RESOURCE_EXHAUSTED" ||
            message.includes("high demand") || 
            message.includes("overloaded") || 
            message.includes("rate limit");

          if (isTransient && attempt < maxRetries) {
            const delayMs = attempt * 600 + Math.floor(Math.random() * 200);
            await sleep(delayMs);
            continue;
          }
          break; // move to next model fallback
        }
      }
    }

    throw lastError;
  }

  // API route for generating questions
  app.post("/api/generate-question", async (req, res) => {
    try {
      const { prompt } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "API key is not configured on the server." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await generateWithFallback(ai, {
        contents: prompt || "Tạo 1 câu hỏi trắc nghiệm ngẫu nhiên, vui nhộn.",
        config: {
          responseMimeType: "application/json",
          systemInstruction: "Bạn là một trợ lý ảo chuyên tạo câu hỏi trắc nghiệm. Hãy luôn trả về đúng định dạng JSON.",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questionText: {
                type: Type.STRING,
                description: "Nội dung câu hỏi",
              },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: "Danh sách 4 phương án (ví dụ: A. xxx, B. yyy, C. zzz, D. www)",
              },
              correctAnswerIndex: {
                type: Type.INTEGER,
                description: "Vị trí của đáp án đúng (từ 0 đến 3)",
              }
            },
            required: ["questionText", "options", "correctAnswerIndex"]
          }
        }
      });

      if (!response.text) {
        throw new Error("No text returned from Gemini");
      }

      const data = JSON.parse(response.text.trim());
      res.json(data);
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Đã có lỗi xảy ra khi gọi AI." });
    }
  });

  // Quick AI Question Draft Route (Gemini API Fast Assistant for Question Editor Modal)
  app.post("/api/ai/quick-draft-question", async (req, res) => {
    try {
      const { 
        topic = '', 
        stage = 'BAN_KET_1',
        roundFormat = 'KHOI_DONG_RIENG',
        domain = 'MIEN_4',
        subCompetency = '4.2',
        cognitiveLevel = 'THONG_HIEU',
        legalReference = 'Thông tư 02/2025/TT-BGDĐT & Nghị định 13/2023/NĐ-CP'
      } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Bạn là Trợ lý AI Khảo thí chuyên sâu của Cuộc thi "Beyond The Internet 2026" (BTI 2026).
Nhiệm vụ: Tạo nhanh 1 câu hỏi thi hoàn chỉnh, tính phân loại cao, thực tế số năm 2026, đúng định dạng và bám sát:
- Từ khóa/Chủ đề: "${topic || 'An toàn số, bảo vệ quyền riêng tư & phòng chống lừa đảo trực tuyến'}"
- Giai đoạn: ${stage}
- Định dạng vòng thi: ${roundFormat}
- Khung năng lực số người học (TT 02/2025/TT-BGDĐT): Miền ${domain}, Thành phần ${subCompetency}
- Mức độ nhận thức: ${cognitiveLevel}
- Căn cứ pháp lý tham chiếu: ${legalReference}

Yêu cầu chi tiết theo từng định dạng:
1. Nếu định dạng là trắc nghiệm nhiều lựa chọn (MULTIPLE_CHOICE, BGD_MULTIPLE_CHOICE, KHOI_DONG, TANG_TOC, VE_DICH):
   - questionText: Nội dung câu hỏi tình huống thực tế, rõ ràng.
   - options: 4 phương án A, B, C, D chất lượng cao.
   - correctKey: "A", "B", "C" hoặc "D".
2. Nếu định dạng là Đúng/Sai 4 ý (BGD_TRUE_FALSE_4, TRUE_FALSE_4, VE_DICH_4_1):
   - questionText: Bối cảnh tình huống số thực tiễn.
   - tfItems: 4 nhận định a, b, c, d với trường { key: 'a'|'b'|'c'|'d', text: string, isCorrect: boolean }.
   - correctKey: chuỗi định dạng "a:Đ,b:S,c:Đ,d:S" hoặc "A:Đ|B:S|C:Đ|D:S".
3. Nếu định dạng là Vượt Chướng Ngại Vật (VCNV, VCNV_7_ROWS):
   - questionText: "Vượt chướng ngại vật: [TỪ KHÓA CHƯỚNG NGẠI VẬT]"
   - vcnvData: {
       obstacleKeyword: "TỪ KHÓA CHỦ ĐỀ CHÍNH (IN HOA)",
       riskQuestion: "Câu hỏi ô mạo hiểm",
       riskAnswer: "Đáp án mạo hiểm",
       clue1: "Gợi ý hàng 1", ans1: "ĐÁP ÁN 1",
       clue2: "Gợi ý hàng 2", ans2: "ĐÁP ÁN 2",
       clue3: "Gợi ý hàng 3", ans3: "ĐÁP ÁN 3",
       clue4: "Gợi ý hàng 4", ans4: "ĐÁP ÁN 4",
       centerClue: "Gợi ý ô trung tâm", centerAns: "ĐÁP ÁN TRUNG TÂM"
     }
   - correctKey: TỪ KHÓA CHÍNH (IN HOA)
4. Nếu định dạng là Trả lời ngắn / Điền từ (SHORT_ANSWER, BGD_SHORT_ANSWER, KD_DIEN_CHO_TRONG):
   - questionText: Câu hỏi yêu cầu đưa ra từ khóa / định nghĩa chính xác.
   - correctKey: Từ khóa hoặc cụm từ đáp án chính xác.
5. Luôn cung cấp:
   - explanation: Lời giải thích khoa học, logic và trích dẫn văn bản luật cụ thể.
   - legalReference: Căn cứ pháp lý chuẩn xác (VD: "Nghị định 13/2023/NĐ-CP Điều 9", "Luật An ninh mạng 2018").
   - tags: 2-4 tags phân loại ngắn gọn (VD: ["an_toan_so", "deepfake", "bao_ve_du_lieu"]).
   - domain: Miền năng lực số chuẩn ("MIEN_1" đến "MIEN_6").
   - subCompetency: Mã năng lực thành phần TT 02/2025 (VD: "4.2").
   - cognitiveLevel: "NHAN_BIET" | "THONG_HIEU" | "VAN_DUNG" | "VAN_DUNG_CAO".`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: "Bạn là chuyên gia biên soạn đề thi cho BTI 2026. Hãy trả về JSON hợp lệ theo Schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questionText: { type: Type.STRING, description: "Nội dung câu hỏi tình huống" },
              roundType: { type: Type.STRING, description: "MULTIPLE_CHOICE | SHORT_ANSWER | TRUE_FALSE_4 | VCNV | FILL_IN_BLANK" },
              options: {
                type: Type.OBJECT,
                properties: {
                  A: { type: Type.STRING },
                  B: { type: Type.STRING },
                  C: { type: Type.STRING },
                  D: { type: Type.STRING }
                }
              },
              tfItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING },
                    text: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN }
                  },
                  required: ["key", "text", "isCorrect"]
                }
              },
              vcnvData: {
                type: Type.OBJECT,
                properties: {
                  obstacleKeyword: { type: Type.STRING },
                  riskQuestion: { type: Type.STRING },
                  riskAnswer: { type: Type.STRING },
                  clue1: { type: Type.STRING },
                  ans1: { type: Type.STRING },
                  clue2: { type: Type.STRING },
                  ans2: { type: Type.STRING },
                  clue3: { type: Type.STRING },
                  ans3: { type: Type.STRING },
                  clue4: { type: Type.STRING },
                  ans4: { type: Type.STRING },
                  centerClue: { type: Type.STRING },
                  centerAns: { type: Type.STRING }
                }
              },
              correctKey: { type: Type.STRING, description: "Đáp án đúng hoặc từ khóa chính" },
              explanation: { type: Type.STRING, description: "Giải thích chi tiết kèm căn cứ pháp lý" },
              legalReference: { type: Type.STRING, description: "Căn cứ pháp lý viện dẫn" },
              domain: { type: Type.STRING, description: "MIEN_1 đến MIEN_6" },
              subCompetency: { type: Type.STRING, description: "VD: 4.2" },
              cognitiveLevel: { type: Type.STRING, description: "NHAN_BIET, THONG_HIEU, VAN_DUNG, VAN_DUNG_CAO" },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["questionText", "correctKey", "explanation", "legalReference"]
          }
        }
      });

      if (!response.text) {
        throw new Error("Không nhận được nội dung phản hồi từ mô hình Gemini.");
      }

      const generatedData = JSON.parse(response.text.trim());
      res.json({ success: true, question: generatedData });
    } catch (error: any) {
      console.error("Gemini Quick Draft Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi tạo nhanh câu hỏi bằng Gemini API." });
    }
  });

  // Multimodal Scanner Route: Scans camera snapshot images or document text files using Gemini
  app.post("/api/ai/scan-and-extract-questions", async (req, res) => {
    try {
      const {
        image,
        text,
        stage = 'BAN_KET_1',
        roundGroup = 'KHOI_DONG',
        defaultDomain = 'MIEN_4'
      } = req.body;

      if (!image && (!text || !text.trim())) {
        return res.status(400).json({ error: "Vui lòng cung cấp ảnh chụp từ camera hoặc nội dung văn bản để quét." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const parts: any[] = [];

      // 1. Process Image Part if present
      if (image && image.base64) {
        let cleanBase64 = image.base64;
        let mime = image.mimeType || 'image/jpeg';
        if (cleanBase64.includes(',')) {
          const split = cleanBase64.split(',');
          const match = split[0].match(/:(.*?);/);
          if (match) mime = match[1];
          cleanBase64 = split[1];
        }

        parts.push({
          inlineData: {
            mimeType: mime,
            data: cleanBase64
          }
        });
      }

      // 2. Prompt instructions for OCR & structured conversion
      const textPrompt = `Bạn là Trợ lý AI Khảo thí & OCR Chuyên sâu của Cuộc thi "Beyond The Internet 2026" (BTI 2026).
Nhiệm vụ: Quét và phân tích toàn bộ tài liệu được cung cấp (ảnh chụp từ camera, ảnh chụp đề thi hoặc văn bản có sẵn), trích xuất TẤT CẢ các câu hỏi có trong tài liệu và chuyển đổi thành cấu trúc dữ liệu câu hỏi chuẩn BTI 2026.

${text && text.trim() ? `NỘI DUNG VĂN BẢN ĐÍNH KÈM CẦN QUÉT:\n"""\n${text}\n"""\n` : ''}

Ngữ cảnh mặc định:
- Giai đoạn thi: ${stage}
- Vòng thi: ${roundGroup}
- Miền năng lực số mặc định nếu không xác định được: ${defaultDomain}

Quy tắc trích xuất & chuyển đổi:
1. Đọc và nhận diện toàn bộ các câu hỏi có trong ảnh/văn bản. Không bỏ sót câu nào.
2. Nhận diện cấu trúc loại câu hỏi:
   - MULTIPLE_CHOICE: Trắc nghiệm 4 phương án A, B, C, D.
   - TRUE_FALSE_4: Đúng/Sai 4 ý (a, b, c, d).
   - SHORT_ANSWER: Câu hỏi trả lời ngắn, điền từ vào chỗ trống.
   - VCNV: Vượt chướng ngại vật (nếu có ô chữ / từ khóa / gợi ý).
3. Xác định đáp án đúng (correctKey):
   - Nếu đề thi có khoanh tròn, đánh dấu tích, gạch chân hoặc in đậm đáp án -> Chọn phương án đó làm correctKey.
   - Nếu đề thi KHÔNG có đánh dấu đáp án -> Bạn hãy tự động giải và đưa ra đáp án chính xác nhất.
   - Với TRUE_FALSE_4, format correctKey là chuỗi dạng "a:Đ,b:S,c:Đ,d:S" hoặc "A:Đ|B:S|C:Đ|D:S".
4. Cung cấp lời giải thích (explanation) rõ ràng, khoa học, có lập luận logic.
5. Gán căn cứ pháp lý (legalReference) chuẩn mực của Việt Nam về kỷ nguyên số (VD: "Thông tư 02/2025/TT-BGDĐT", "Nghị định 13/2023/NĐ-CP", "Luật An ninh mạng 2018", "Luật Giao dịch điện tử 2023"...).
6. Tự động phân loại vào 6 Miền năng lực số BTI:
   - MIEN_1: Khai thác dữ liệu & Thông tin số (1.1, 1.2, 1.3)
   - MIEN_2: Giao tiếp & Hợp tác số (2.1, 2.2, 2.3, 2.4)
   - MIEN_3: Sáng tạo nội dung số (3.1, 3.2, 3.3, 3.4)
   - MIEN_4: An toàn & An ninh số (4.1, 4.2, 4.3, 4.4)
   - MIEN_5: Giải quyết vấn đề trong môi trường số (5.1, 5.2, 5.3, 5.4)
   - MIEN_6: Ứng dụng AI & Công nghệ tương lai (6.1, 6.2, 6.3)
7. Đánh giá mức độ nhận thức: "NHAN_BIET" | "THONG_HIEU" | "VAN_DUNG" | "VAN_DUNG_CAO".
8. Ước tính thời gian làm bài (timeLimit): 15-30 giây cho Khởi động, 20-30 giây cho Tăng tốc, 40-60 giây cho Về đích.
9. Đề xuất điểm số (points): 10, 20, 30 hoặc 40 điểm.
10. Gán các tags ngắn gọn (2-4 tags).

Hãy trả về JSON hợp lệ theo Schema được quy định.`;

      parts.push({ text: textPrompt });

      const response = await generateWithFallback(ai, {
        contents: parts.length === 1 ? parts[0].text : { parts },
        useSearchGrounding: false,
        config: {
          systemInstruction: "Bạn là chuyên gia số hóa đề thi BTI 2026. Hãy đọc kỹ ảnh chụp và văn bản, trích xuất chuẩn xác thành JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              extractedQuestions: {
                type: Type.ARRAY,
                description: "Danh sách tất cả câu hỏi được bóc tách từ ảnh/tài liệu",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionText: { type: Type.STRING, description: "Nội dung câu hỏi" },
                    roundType: { type: Type.STRING, description: "MULTIPLE_CHOICE | TRUE_FALSE_4 | SHORT_ANSWER | VCNV" },
                    options: {
                      type: Type.OBJECT,
                      properties: {
                        A: { type: Type.STRING },
                        B: { type: Type.STRING },
                        C: { type: Type.STRING },
                        D: { type: Type.STRING }
                      }
                    },
                    tfItems: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          key: { type: Type.STRING },
                          text: { type: Type.STRING },
                          isCorrect: { type: Type.BOOLEAN }
                        },
                        required: ["key", "text", "isCorrect"]
                      }
                    },
                    vcnvData: {
                      type: Type.OBJECT,
                      properties: {
                        obstacleKeyword: { type: Type.STRING },
                        clue1: { type: Type.STRING },
                        ans1: { type: Type.STRING },
                        clue2: { type: Type.STRING },
                        ans2: { type: Type.STRING },
                        clue3: { type: Type.STRING },
                        ans3: { type: Type.STRING },
                        clue4: { type: Type.STRING },
                        ans4: { type: Type.STRING }
                      }
                    },
                    correctKey: { type: Type.STRING, description: "Đáp án đúng hoặc từ khóa chính" },
                    explanation: { type: Type.STRING, description: "Lời giải thích chi tiết" },
                    legalReference: { type: Type.STRING, description: "Căn cứ pháp lý viện dẫn" },
                    domain: { type: Type.STRING, description: "MIEN_1 đến MIEN_6" },
                    subCompetency: { type: Type.STRING, description: "Mã kỹ năng số ví dụ 4.2" },
                    cognitiveLevel: { type: Type.STRING, description: "NHAN_BIET, THONG_HIEU, VAN_DUNG, VAN_DUNG_CAO" },
                    timeLimit: { type: Type.INTEGER, description: "Thời gian làm bài tính bằng giây" },
                    points: { type: Type.INTEGER, description: "Điểm số gợi ý" },
                    tags: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    detectedRawText: { type: Type.STRING, description: "Trích đoạn văn bản gốc tương ứng" }
                  },
                  required: ["questionText", "correctKey", "explanation"]
                }
              },
              scanSummary: {
                type: Type.OBJECT,
                properties: {
                  totalDetected: { type: Type.INTEGER, description: "Tổng số câu hỏi phát hiện được" },
                  notes: { type: Type.STRING, description: "Ghi chú chất lượng quét (ví dụ: ảnh mờ, chữ viết tay, phát hiện đáp án khoanh tròn...)" }
                }
              }
            },
            required: ["extractedQuestions"]
          }
        }
      });

      if (!response.text) {
        throw new Error("Không nhận được nội dung trích xuất từ Gemini.");
      }

      const parsedData = JSON.parse(response.text.trim());
      res.json({
        success: true,
        extractedQuestions: parsedData.extractedQuestions || [],
        scanSummary: parsedData.scanSummary || { totalDetected: (parsedData.extractedQuestions || []).length }
      });
    } catch (error: any) {
      console.error("Gemini Scan & Extract Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi quét ảnh hoặc phân tích tài liệu bằng Gemini API." });
    }
  });

  // AI Moderation & Quality Audit Route: Evaluates questions and generates review notes
  app.post("/api/ai/audit-question", async (req, res) => {
    try {
      const { question } = req.body;
      if (!question) {
        return res.status(400).json({ error: "Thiếu dữ liệu câu hỏi cần thẩm định." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Bạn là Trưởng Ban Thẩm định Khảo thí Cuộc thi "Beyond The Internet 2026" (BTI 2026).
Nhiệm vụ: Thẩm định chuyên sâu và đánh giá chất lượng câu hỏi thi dưới đây dựa trên:
1. Độ chuẩn xác về mặt khoa học, kỹ thuật số và an toàn thông tin năm 2026.
2. Tính chuẩn mực pháp lý (Nghị định 13/2023/NĐ-CP, Luật An ninh mạng 2018, Thông tư 02/2025/TT-BGDĐT...).
3. Độ rõ ràng của đề bài, tính phân loại, không đa nghĩa gây tranh cãi.
4. Chất lượng các phương án nhiễu (distractors) hoặc gợi ý (đối với VCNV).
5. Tính khớp nối với Miền năng lực số và Mức độ nhận thức.

Dữ liệu câu hỏi cần thẩm định:
${JSON.stringify(question, null, 2)}

Hãy đưa ra đánh giá khách quan, đề xuất quyết định duyệt (APPROVED hoặc REJECTED hoặc NEEDS_REVISION), điểm chất lượng (0-100), nhận xét ưu nhược điểm và đoạn văn bản ghi chú thẩm định (review notes) chuẩn mực để gửi cho tác giả.`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: "Bạn là Trưởng Ban Thẩm định Khảo thí BTI 2026. Hãy trả về JSON hợp lệ theo Schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendation: { type: Type.STRING, description: "APPROVED | REJECTED | NEEDS_REVISION" },
              qualityScore: { type: Type.INTEGER, description: "Thang điểm từ 0 đến 100" },
              summary: { type: Type.STRING, description: "Tóm tắt đánh giá chất lượng" },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Các điểm mạnh của câu hỏi"
              },
              weaknesses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Các điểm hạn chế cần cải thiện hoặc rủi ro tranh cãi"
              },
              legalCheck: {
                type: Type.OBJECT,
                properties: {
                  isCompliant: { type: Type.BOOLEAN },
                  notes: { type: Type.STRING }
                },
                required: ["isCompliant", "notes"]
              },
              suggestedReviewNotes: { type: Type.STRING, description: "Gợi ý nội dung ghi chú thẩm định chuyên nghiệp để lưu vào review_notes" },
              suggestedFixes: { type: Type.STRING, description: "Đề xuất chỉnh sửa cụ thể nếu có" }
            },
            required: ["recommendation", "qualityScore", "summary", "suggestedReviewNotes"]
          }
        }
      });

      if (!response.text) {
        throw new Error("Không nhận được phản hồi từ AI thẩm định.");
      }

      const auditResult = JSON.parse(response.text.trim());
      res.json({ success: true, audit: auditResult });
    } catch (error: any) {
      console.error("Gemini Audit Question Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi thẩm định câu hỏi bằng AI." });
    }
  });

  // AI Duplicate & Overlapping Knowledge Detection Route
  app.post("/api/ai/detect-duplicates", async (req, res) => {
    try {
      const { candidatePairs } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên server." });
      }

      if (!candidatePairs || !Array.isArray(candidatePairs) || candidatePairs.length === 0) {
        return res.json({ success: true, evaluations: [] });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      // Prepare pair summaries for prompt
      const pairsText = candidatePairs.slice(0, 20).map((cp: any, idx: number) => {
        return `
[CẶP #${idx + 1} - ID Cặp: "${cp.pairId}"]
- CÂU A (ID: ${cp.questionA?.id}):
  + Nội dung: ${cp.questionA?.question_text || ''}
  + Lựa chọn: ${JSON.stringify(cp.questionA?.options || {})}
  + Miền / Năng lực: ${cp.questionA?.domain || ''} - ${cp.questionA?.subCompetency || ''}
  + Mức nhận thức: ${cp.questionA?.cognitive_level || ''}
  + Căn cứ pháp lý: ${cp.questionA?.legal_reference || ''}
  + Thẻ tags: ${(cp.questionA?.tags || []).join(', ')}

- CÂU B (ID: ${cp.questionB?.id}):
  + Nội dung: ${cp.questionB?.question_text || ''}
  + Lựa chọn: ${JSON.stringify(cp.questionB?.options || {})}
  + Miền / Năng lực: ${cp.questionB?.domain || ''} - ${cp.questionB?.subCompetency || ''}
  + Mức nhận thức: ${cp.questionB?.cognitive_level || ''}
  + Căn cứ pháp lý: ${cp.questionB?.legal_reference || ''}
  + Thẻ tags: ${(cp.questionB?.tags || []).join(', ')}
`;
      }).join('\n----------------------------------------\n');

      const prompt = `Bạn là Chuyên gia Khảo thí và Kiểm định Ngân hàng Đề thi Quốc gia cho cuộc thi BTI 2026.
Nhiệm vụ của bạn là rà soát, đánh giá chuyên sâu từng cặp câu hỏi dưới đây để phát hiện:
1. TRÙNG LẶP NỘI DUNG (Content Duplicate / Paraphrase): Câu hỏi diễn đạt khác từ ngữ nhưng hỏi cùng 1 tình huống, sự kiện, câu hỏi trắc nghiệm giống nhau hoặc chỉ đảo thứ tự đáp án.
2. TRÙNG LẶP MIỀN TRI THỨC & NĂNG LỰC (Overlapping Knowledge Domains / Competency Redundancy): Cả 2 câu đều kiểm tra cùng 1 điều luật (VD: Điều 9 NĐ 13/2023, TT 02/2025), cùng 1 khái niệm lý thuyết cốt lõi, cùng 1 tình huống số mà không tạo ra sự phân hóa mới trong ngân hàng đề.
3. KHÁC BIỆT HỢP LỆ (Distinct): Khác nhau rõ ràng về mục tiêu đánh giá hoặc kiến thức kiểm tra.

Danh sách các cặp câu hỏi cần đánh giá:
${pairsText}

Hãy phân tích cẩn trọng và trả về danh sách đánh giá theo định dạng JSON chuẩn.`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: "Bạn là AI Thẩm định Trùng lặp Khảo thí BTI 2026. Hãy trả về JSON hợp lệ theo Schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              evaluations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    pairId: { type: Type.STRING },
                    similarityScore: { type: Type.INTEGER, description: "Điểm tương đồng ngữ nghĩa tổng thể (0 - 100)" },
                    domainOverlapScore: { type: Type.INTEGER, description: "Mức độ trùng lặp miền tri thức và năng lực (0 - 100)" },
                    duplicateType: { 
                      type: Type.STRING, 
                      description: "EXACT | SEMANTIC_PARAPHRASE | DOMAIN_OVERLAP | DISTINCT" 
                    },
                    isRedundant: { 
                      type: Type.BOOLEAN, 
                      description: "true nếu ngân hàng đề thi bị dư thừa và nên gộp hoặc xóa bớt 1 câu" 
                    },
                    overlappingConcepts: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Danh sách các khái niệm, điều luật, kỹ năng bị trùng lặp"
                    },
                    analysis: { 
                      type: Type.STRING, 
                      description: "Phân tích ngữ nghĩa chi tiết: vì sao trùng lặp hoặc điểm khác biệt then chốt" 
                    },
                    recommendation: { 
                      type: Type.STRING, 
                      description: "MERGE | DELETE_B | DIFFERENTIATE | KEEP_BOTH" 
                    },
                    differentiateSuggestion: { 
                      type: Type.STRING, 
                      description: "Gợi ý cách sửa Câu B nếu muốn giữ cả 2 câu mà không bị trùng lặp" 
                    }
                  },
                  required: ["pairId", "similarityScore", "domainOverlapScore", "duplicateType", "isRedundant", "overlappingConcepts", "analysis", "recommendation"]
                }
              }
            },
            required: ["evaluations"]
          }
        }
      });

      if (!response.text) {
        throw new Error("Không nhận được nội dung phân tích từ Gemini API.");
      }

      const result = JSON.parse(response.text.trim());
      res.json({ success: true, evaluations: result.evaluations || [] });
    } catch (error: any) {
      console.error("Gemini Detect Duplicates Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi chạy AI phát hiện trùng lặp." });
    }
  });

  // AI Balanced Mock Quiz / Test Generator Route
  app.post("/api/ai/generate-mock-quiz", async (req, res) => {
    try {
      const {
        presetType = 'BALANCED_MOCK_TEST',
        targetCount = 28,
        timeMinutes = 45,
        stage = 'VONG_LOAI',
        desiredDistribution = { NHAN_BIET: 40, THONG_HIEU: 30, VAN_DUNG: 20, VAN_DUNG_CAO: 10 },
        selectedDomains = ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'],
        candidateQuestions = []
      } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên server." });
      }

      if (!candidateQuestions || !Array.isArray(candidateQuestions) || candidateQuestions.length === 0) {
        return res.status(400).json({ error: "Ngân hàng câu hỏi chưa có đủ dữ liệu để tạo đề thi thử." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      // Prepare candidate summary list for AI to pick from (limit to 120 items to fit prompt nicely)
      const sampledCandidates = candidateQuestions.slice(0, 120).map((q: any, idx: number) => ({
        idx: idx + 1,
        id: q.id,
        text: (q.question_text || '').slice(0, 160),
        level: q.cognitive_level || 'THONG_HIEU',
        domain: q.digital_competency_domain || q.domain || 'MIEN_4',
        subComp: q.digital_sub_competency || q.subCompetency || '',
        legal: q.legal_reference || '',
        category: q.category || ''
      }));

      const prompt = `Bạn là Trưởng ban Đề thi Quốc gia & Chuyên gia Khảo thí Cuộc thi "Beyond The Internet 2026" (BTI 2026).
Nhiệm vụ: Tạo một BỘ ĐỀ THI THỬ (MOCK QUIZ) HOÀN CHỈNH, CHUẨN XÁC VÀ CÂN BẰNG TỐI ƯU từ danh sách câu hỏi có sẵn trong ngân hàng đề.

THÔNG SỐ ĐỀ THI YÊU CẦU:
- Loại đề (Preset): "${presetType}"
- Số lượng câu hỏi cần chọn: ${targetCount} câu
- Thời gian làm bài: ${timeMinutes} phút
- Giai đoạn thi: ${stage}
- Tỷ lệ độ khó mục tiêu:
  + Nhận biết: ${desiredDistribution.NHAN_BIET || 40}% (khoảng ${Math.round((targetCount * (desiredDistribution.NHAN_BIET || 40)) / 100)} câu)
  + Thông hiểu: ${desiredDistribution.THONG_HIEU || 30}% (khoảng ${Math.round((targetCount * (desiredDistribution.THONG_HIEU || 30)) / 100)} câu)
  + Vận dụng: ${desiredDistribution.VAN_DUNG || 20}% (khoảng ${Math.round((targetCount * (desiredDistribution.VAN_DUNG || 20)) / 100)} câu)
  + Vận dụng cao: ${desiredDistribution.VAN_DUNG_CAO || 10}% (khoảng ${Math.max(1, Math.round((targetCount * (desiredDistribution.VAN_DUNG_CAO || 10)) / 100))} câu)
- Các miền năng lực số cần bao phủ (TT 02/2025/TT-BGDĐT): ${selectedDomains.join(', ')}

DANH SÁCH CÂU HỎI TRONG NGÂN HÀNG ĐỀ:
${JSON.stringify(sampledCandidates, null, 1)}

YÊU CẦU CHỌN LỌC & SẮP XẾP CỦA AI:
1. Chọn đúng chính xác ${Math.min(targetCount, candidateQuestions.length)} câu hỏi (danh sách ID trong selectedQuestionIds) không bị trùng lặp, đảm bảo:
   - Cân đối ma trận 4 mức độ nhận thức.
   - Trải đều các miền năng lực số được yêu cầu.
   - Ưu tiên câu hỏi có tình huống thực tế hay, căn cứ pháp lý rõ ràng.
2. Sắp xếp thứ tự làm bài thông minh (bắt đầu từ các câu Nhận biết khởi động -> Thông hiểu -> tăng dần đến Vận dụng / Vận dụng cao ở cuối).
3. Đưa ra phân tích sư phạm (pedagogicalRationale), hướng dẫn chiến thuật làm bài và bảng phân bổ ma trận.`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: "Bạn là Chuyên gia Khảo thí BTI 2026. Hãy trả về JSON hợp lệ theo Schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              quizTitle: { type: Type.STRING, description: "Tiêu đề đề thi thử trang trọng, thu hút" },
              quizSubtitle: { type: Type.STRING, description: "Phụ đề mô tả chuẩn mực đề thi" },
              instructions: { type: Type.STRING, description: "Hướng dẫn làm bài và lưu ý cho thí sinh" },
              pedagogicalRationale: { type: Type.STRING, description: "Giải thích cơ cấu phân bổ độ khó và miền tri thức của đề thi" },
              difficultyIndex: { type: Type.NUMBER, description: "Điểm độ khó tổng thể từ 1.0 đến 10.0" },
              difficultyLabel: { type: Type.STRING, description: "Nhãn độ khó (VD: Cân Bằng Chuẩn Khảo Thí, Phân Hóa Cao, v.v.)" },
              timePacingTip: { type: Type.STRING, description: "Chiến thuật phân bổ thời gian từng phần" },
              selectedQuestionIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Danh sách ID các câu hỏi được chọn theo đúng thứ tự làm bài tối ưu"
              },
              distributionSummary: {
                type: Type.OBJECT,
                properties: {
                  nhanBietCount: { type: Type.INTEGER },
                  thongHieuCount: { type: Type.INTEGER },
                  vanDungCount: { type: Type.INTEGER },
                  vanDungCaoCount: { type: Type.INTEGER },
                  averageSolveTimeSec: { type: Type.INTEGER }
                },
                required: ["nhanBietCount", "thongHieuCount", "vanDungCount", "vanDungCaoCount"]
              },
              domainBreakdown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    domainKey: { type: Type.STRING },
                    domainName: { type: Type.STRING },
                    questionCount: { type: Type.INTEGER }
                  },
                  required: ["domainKey", "domainName", "questionCount"]
                }
              }
            },
            required: ["quizTitle", "pedagogicalRationale", "difficultyIndex", "difficultyLabel", "selectedQuestionIds", "distributionSummary"]
          }
        }
      });

      if (!response.text) {
        throw new Error("Không nhận được phản hồi từ AI tạo đề thi.");
      }

      const result = JSON.parse(response.text.trim());
      res.json({ success: true, mockQuizBlueprint: result });
    } catch (error: any) {
      console.error("Gemini Generate Mock Quiz Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi tạo đề thi thử bằng AI." });
    }
  });

  // Advanced AI Route: Question Drafting based on Vietnam Digital Competency Framework (TT 02/2025/TT-BGDĐT)
  app.post("/api/ai/generate-advanced-question", async (req, res) => {
    try {
      const { 
        stage = 'BAN_KET_1',
        roundFormat = 'KHOI_DONG_RIENG',
        domain = 'MIEN_4',
        subCompetency = '4.2',
        cognitiveLevel = 'THONG_HIEU',
        legalReference = 'Thông tư 02/2025/TT-BGDĐT & Nghị định 13/2023/NĐ-CP',
        contextDoc = '',
        topicPrompt = '',
        count = 1,
        formatDetails
      } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API key chưa được cấu hình trên hệ thống server." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      let formatRules = '';
      if (formatDetails) {
        formatRules = `
   * ĐẶC THÙ CỦA ĐỊNH DẠNG NÀY THEO LUẬT CHƠI BTI 2026:
   - Tên định dạng: ${formatDetails.name}
   - Yêu cầu biên soạn: ${formatDetails.description}
   - Luật tính điểm: ${formatDetails.scoringRule}
   - BẮT BUỘC SỬ DỤNG roundType: "${formatDetails.defaultRoundType}"
   - Thời gian suy nghĩ: ${formatDetails.defaultTimeLimit} giây
   - Điểm số: ${formatDetails.defaultPoints} điểm
        `;
      }

      const systemPrompt = `Bạn là Chuyên gia Khảo thí và Biên soạn Ngân hàng Đề thi Quốc gia cho Cuộc thi "Beyond The Internet 2026" (BTI 2026).
Bạn có nhiệm vụ tạo ra câu hỏi thi học thuật xuất sắc, có tính phân loại cao, thực tế và tuân thủ tuyệt đối:
1. KHUNG NĂNG LỰC SỐ CHO NGƯỜI HỌC (Thông tư số 02/2025/TT-BGDĐT ngày 24/01/2025 của Bộ Giáo dục và Đào tạo).
   - Miền năng lực: ${domain} (Thành phần: ${subCompetency})
   - Mức độ nhận thức: ${cognitiveLevel} (Nhận biết / Thông hiểu / Vận dụng / Vận dụng cao)
2. GIAI ĐOẠN VÀ ĐỊNH DẠNG VÒNG THI:
   - Giai đoạn thi: ${stage}
   - Định dạng thi: ${roundFormat}
   ${stage === 'VONG_LOAI' ? `
   * ĐẶC BIỆT VỚI ĐỀ THI VÒNG LOẠI BTI 2026:
   - Vòng loại chỉ có 1 dạng đề duy nhất gồm 28 câu (24 câu Phần I trắc nghiệm 4 lựa chọn ABCD và 4 câu Phần II Đúng/Sai 4 ý a,b,c,d). Tuyệt đối không chọn hoặc chia theo các vòng thi như Khởi động, VCNV, Tăng tốc, Về đích.
   - Nếu định dạng là BGD_MULTIPLE_CHOICE: Soạn câu trắc nghiệm 4 lựa chọn A, B, C, D với 1 đáp án đúng nhất (roundType: "MULTIPLE_CHOICE", timeLimit: 30, points: 1).
   - Nếu định dạng là BGD_TRUE_FALSE_4: Soạn 1 tình huống cùng 4 nhận định/mệnh đề A, B, C, D (ứng với ý a, b, c, d). correctKey định dạng chuẩn: "A:Đ|B:S|C:Đ|D:S" (roundType: "TRUE_FALSE_4", timeLimit: 60, points: 4).
   ` : formatRules}
3. CĂN CỨ PHÁP LÝ BẮT BUỘC:
   - Căn cứ pháp lý: ${legalReference}
   ${contextDoc ? `\n- NỘI DUNG TÀI LIỆU PHÁP LÝ THAM CHIẾU ĐÍNH KÈM:\n${contextDoc.slice(0, 3000)}\n` : formatRules}
4. YÊU CẦU CHẤT LƯỢNG KỸ THUẬT:
   - ĐỐI VỚI VƯỢT CHƯỚNG NGẠI VẬT: correctKey CHỈ là Từ khóa Hàng ngang (rất ngắn gọn).
   - ĐỐI VỚI ĐIỀN KHUYẾT / TRẢ LỜI NGẮN: correctKey phải CHÍNH XÁC là cụm từ cần điền, không dư thừa chữ.
   - Trắc nghiệm (MULTIPLE_CHOICE): correctKey là A, B, C, D.
   - Câu hỏi gắn liền tình huống số thực tiễn (Deepfake, AI tạo sinh, lừa đảo trực tuyến, bảo vệ dữ liệu cá nhân, liêm chính học thuật, an sinh số).
   - Bẫy logic tinh tế, phân hóa rõ rệt, giải thích chi tiết có trích dẫn điều khoản luật cụ thể.
   - BẮT BUỘC cung cấp tags, mediaType (IMAGE, VIDEO, AUDIO, NONE). Nếu là dạng Vượt Chướng Ngại Vật (VCNV), phải cung cấp obstacleInfo chứa độ dài từ khóa, câu hỏi gợi ý và đáp án.`;

      const userMessage = `Hãy biên soạn ${Math.min(Math.max(count, 1), 5)} câu hỏi theo yêu cầu trên. Chủ đề mong muốn bổ sung: "${topicPrompt || 'Tình huống an toàn số và công nghệ thực tiễn năm 2026'}".`;

      const response = await generateWithFallback(ai, {
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionText: { type: Type.STRING, description: "Nội dung câu hỏi chi tiết, rõ ràng" },
                roundType: { type: Type.STRING, description: "MULTIPLE_CHOICE | SHORT_ANSWER | TRUE_FALSE_4 | VCNV" },
                options: {
                  type: Type.OBJECT,
                  properties: {
                    A: { type: Type.STRING },
                    B: { type: Type.STRING },
                    C: { type: Type.STRING },
                    D: { type: Type.STRING }
                  },
                  description: "Các phương án lựa chọn A, B, C, D (đối với trắc nghiệm)"
                },
                correctKey: { type: Type.STRING, description: "Đáp án đúng (A, B, C, D hoặc từ khóa đối với câu trả lời ngắn)" },
                explanation: { type: Type.STRING, description: "Lời giải thích chi tiết và trích dẫn văn bản pháp lý tương ứng" },
                timeLimit: { type: Type.INTEGER, description: "Thời gian trả lời (giây, vd: 15, 20, 30)" },
                points: { type: Type.INTEGER, description: "Điểm số quy định (10, 20, 30, 40)" },
                legalReference: { type: Type.STRING, description: "Căn cứ điều khoản luật cụ thể (vd: Điều 9 NĐ 13/2023/NĐ-CP)" },
                cognitiveLevel: { type: Type.STRING, description: "NHAN_BIET | THONG_HIEU | VAN_DUNG | VAN_DUNG_CAO" },
                subCompetency: { type: Type.STRING, description: "Mã năng lực thành phần TT 02/2025 (vd: 4.2)" },
                tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách 1-3 nhãn/tag phân loại" },
                mediaType: { type: Type.STRING, description: "IMAGE | VIDEO | AUDIO | NONE" },
                obstacleInfo: {
                  type: Type.OBJECT,
                  description: "Chỉ điền nếu là dạng Vượt Chướng Ngại Vật",
                  properties: {
                    rowNumber: { type: Type.INTEGER },
                    rowLength: { type: Type.INTEGER },
                    clueText: { type: Type.STRING },
                    answerText: { type: Type.STRING },
                    isCentralKeyword: { type: Type.BOOLEAN }
                  }
                }
              },
              required: ["questionText", "correctKey", "explanation", "legalReference"]
            }
          }
        }
      });

      if (!response.text) {
        throw new Error("Không nhận được dữ liệu từ mô hình AI.");
      }

      const candidate = response.candidates?.[0];
      const groundingMeta = candidate?.groundingMetadata;
      const groundingSources = groundingMeta?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || 'Google Search',
        uri: chunk.web?.uri || ''
      })).filter((s: any) => s.uri) || [];
      const searchQueries = groundingMeta?.webSearchQueries || [];

      const generatedItems = JSON.parse(response.text.trim());
      res.json({ 
        success: true, 
        questions: generatedItems,
        groundingSources,
        searchQueries
      });
    } catch (error: any) {
      console.error("AI Advanced Question Error:", error);
      res.status(500).json({ error: error.message || "Lỗi trong quá trình AI biên soạn câu hỏi." });
    }
  });

  // AI Route: Interactive Drama & Scenario Script Generator (Kịch tương tác)
  app.post("/api/ai/generate-scenario", async (req, res) => {
    try {
      const { 
        stage = 'CHUNG_KET',
        domain = 'MIEN_4',
        topic = 'Bẫy lừa đảo mạo danh ngân hàng và tống tiền mạng',
        legalDocSummary = ''
      } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Soạn thảo một kịch bản Kịch tương tác / Tình huống thực hành trên sân khấu Cuộc thi BTI 2026.
Chủ đề: ${topic}
Miền năng lực số: ${domain} (Theo Thông tư 02/2025/TT-BGDĐT)
Giai đoạn: ${stage}
${legalDocSummary ? `Căn cứ pháp lý: ${legalDocSummary}` : ''}

Kịch bản phải gồm:
1. Tiêu đề tình huống
2. Danh sách nhân vật (MC, Thí sinh, Nhân vật gây biến cố)
3. Bối cảnh không gian số
4. Lời thoại diễn xuất kịch tính (Phân cảnh 1, Phân cảnh 2, Cao trào tình huống)
5. Câu hỏi tình huống / Thử thách quyết định cho thí sinh
6. Danh sách các phương án xử lý hoặc checklist hành động đúng của thí sinh
7. Phương án đúng / Tối ưu nhất
8. Thời gian suy nghĩ (15-30s) và thời gian diễn xuất / thực hành (45-90s)
9. Thang điểm Rubric chấm điểm chi tiết của Ban Giám khảo (tổng 40 điểm)
10. Căn cứ pháp lý cụ thể (Điều luật, nghị định)`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              characters: { type: Type.ARRAY, items: { type: Type.STRING } },
              setting: { type: Type.STRING },
              scriptText: { type: Type.STRING },
              dilemmaQuestion: { type: Type.STRING },
              actionChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
              options: {
                type: Type.OBJECT,
                properties: {
                  A: { type: Type.STRING },
                  B: { type: Type.STRING },
                  C: { type: Type.STRING },
                  D: { type: Type.STRING }
                }
              },
              correctOption: { type: Type.STRING },
              timeLimitThought: { type: Type.INTEGER },
              timeLimitAction: { type: Type.INTEGER },
              rubric: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    criterion: { type: Type.STRING },
                    maxPoints: { type: Type.INTEGER },
                    description: { type: Type.STRING }
                  },
                  required: ["criterion", "maxPoints", "description"]
                }
              },
              legalBasis: { type: Type.STRING }
            },
            required: ["title", "characters", "setting", "scriptText", "dilemmaQuestion", "actionChecklist", "rubric", "legalBasis"]
          }
        }
      });

      if (!response.text) throw new Error("AI không trả về dữ liệu.");
      res.json({ success: true, scenario: JSON.parse(response.text.trim()) });
    } catch (error: any) {
      console.error("AI Scenario Error:", error);
      res.status(500).json({ error: error.message || "Lỗi tạo kịch bản tương tác." });
    }
  });

  // AI Route: Question Audit & Fact-check against Vietnam Law & TT 02/2025
  app.post("/api/ai/audit-question", async (req, res) => {
    try {
      const { question } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY." });

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Bạn là Trưởng Ban Thẩm định Đề thi Cuộc thi Beyond The Internet 2026.
Hãy thẩm định và đánh giá toàn diện câu hỏi sau:
Nội dung: "${question.question_text || question.questionText}"
Phương án: ${JSON.stringify(question.options)}
Đáp án công bố: "${question.correct_key || question.correctKey}"
Lời giải thích: "${question.explanation}"
Miền năng lực hiện tại: "${question.digital_competency_domain || ''}"
Mức độ nhận thức: "${question.cognitive_level || ''}"

Hãy kiểm tra:
1. Tính chính xác khoa học & công nghệ (có bị lỗi thời, sai thuật ngữ không?).
2. Tính chuẩn xác của căn cứ pháp luật Việt Nam (Thông tư 02/2025/TT-BGDĐT, Nghị định 13/2023/NĐ-CP, Luật An ninh mạng 2018).
3. Đánh giá phương án nhiễu (distractors): Có phương án nào gây tranh cãi 2 đáp án đúng không?
4. Đánh giá mức độ nhận thức (Nhận biết/Thông hiểu/Vận dụng/Vận dụng cao) có phù hợp không?
5. Điểm số chất lượng (thang 100).
6. Đề xuất chỉnh sửa cải tiến câu hỏi để hay hơn.`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              qualityScore: { type: Type.INTEGER, description: "Điểm chất lượng từ 0 đến 100" },
              isLegalValid: { type: Type.BOOLEAN, description: "Đúng chuẩn văn bản pháp lý" },
              identifiedDomain: { type: Type.STRING, description: "Miền năng lực số chuẩn xác nhất" },
              identifiedLevel: { type: Type.STRING, description: "Mức độ nhận thức phù hợp" },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              improvedQuestionText: { type: Type.STRING },
              improvedExplanation: { type: Type.STRING },
              legalReferenceVerified: { type: Type.STRING }
            },
            required: ["qualityScore", "isLegalValid", "strengths", "weaknesses", "improvedQuestionText"]
          }
        }
      });

      if (!response.text) throw new Error("AI không trả về đánh giá.");
      res.json({ success: true, audit: JSON.parse(response.text.trim()) });
    } catch (error: any) {
      console.error("AI Audit Error:", error);
      res.status(500).json({ error: error.message || "Lỗi thẩm định câu hỏi." });
    }
  });

  // AI Route: Auto-classify drafted question for tags and levels
  app.post("/api/ai/classify-question", async (req, res) => {
    try {
      const { questionText, options, explanation } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY." });

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Hãy phân tích câu hỏi sau để tự động phân loại theo chuẩn BTI 2026:
Nội dung: "${questionText}"
Phương án: ${JSON.stringify(options)}
Giải thích: "${explanation}"

Yêu cầu trả về JSON:
- domain: từ MIEN_1 đến MIEN_6 (Thông tư 02/2025/TT-BGDĐT)
- subCompetency: Mã năng lực thành phần tương ứng (ví dụ: "4.2", "1.1")
- cognitiveLevel: NHAN_BIET | THONG_HIEU | VAN_DUNG | VAN_DUNG_CAO
- tags: Mảng 3-5 chuỗi từ khóa ngắn gọn mô tả chủ đề (ví dụ: "lừa_đảo_mạng", "phishing", "bảo_mật", "deepfake")
- suggestedCategory: Tên chủ đề/danh mục tổng quát phù hợp nhất (dưới 40 ký tự) `;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              domain: { type: Type.STRING },
              subCompetency: { type: Type.STRING },
              cognitiveLevel: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedCategory: { type: Type.STRING }
            },
            required: ["domain", "subCompetency", "cognitiveLevel", "tags"]
          }
        }
      });

      if (!response.text) throw new Error("AI không trả về kết quả.");
      res.json({ success: true, classification: JSON.parse(response.text.trim()) });
    } catch (error: any) {
      console.error("AI Classify Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi phân loại câu hỏi." });
    }
  });

  // Dedicated AI Auto-Tagging, Subject & Knowledge Area Classification Endpoint
  app.post("/api/ai/auto-suggest-tags", async (req, res) => {
    try {
      const { questionText, options, explanation, legalReference, category, domain, cognitiveLevel, existingTags } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." });

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Bạn là Chuyên gia Khảo thí và Cố vấn Học thuật Trưởng của Cuộc thi "Beyond The Internet 2026" (BTI 2026).
Nhiệm vụ: Phân tích sâu nội dung câu hỏi, phương án lựa chọn, lời giải thích và ngữ cảnh để TỰ ĐỘNG ĐỀ XUẤT:
1. 'Subject' (Chủ đề / Môn học / Lĩnh vực chuyên môn chính): Tên chủ đề súc tích, chuyên nghiệp (VD: "An toàn dữ liệu cá nhân & Quyền riêng tư", "Phòng chống lừa đảo trực tuyến & Phishing", "Đạo đức trí tuệ nhân tạo & Liêm chính học thuật", "Văn hóa ứng xử & Giao tiếp trên mạng xã hội", "Bản quyền số & Sở hữu trí tuệ", v.v.).
2. 'Knowledge Area' (Miền tri thức & Năng lực số theo Thông tư 02/2025/TT-BGDĐT):
   - MIEN_1: Vận hành thiết bị, phần mềm và quản trị kết nối số
   - MIEN_2: Khai thác thông tin, dữ liệu và đánh giá độ tin cậy số
   - MIEN_3: Giao tiếp, hợp tác và tương tác trong môi trường số
   - MIEN_4: An toàn số, bảo vệ thông tin và dữ liệu cá nhân
   - MIEN_5: Đạo đức số, văn hóa mạng và tuân thủ pháp luật số
   - MIEN_6: Sáng tạo nội dung số, ứng dụng GenAI và giải quyết vấn đề
3. 'Sub-Competency' (Mã & tên năng lực thành phần tương ứng): ví dụ "4.2", "5.1", "2.3"...
4. 'Legal Reference' (Căn cứ văn bản pháp luật tham chiếu): ví dụ "Nghị định 13/2023/NĐ-CP Điều 9", "Thông tư 02/2025/TT-BGDĐT", "Luật An ninh mạng 2018 Điều 8"...
5. 'Cognitive Level' (Mức độ nhận thức phù hợp): NHAN_BIET | THONG_HIEU | VAN_DUNG | VAN_DUNG_CAO
6. 'Tags' (3-6 Thẻ từ khóa chuyên sâu): ví dụ ["deepfake", "phishing", "nghi_dinh_13", "xac_thuc_2fa", "mat_khau_manh"]

THÔNG TIN CÂU HỎI:
- Đề bài: "${questionText || ''}"
- Các phương án: ${JSON.stringify(options || {})}
- Lời giải thích: "${explanation || ''}"
- Căn cứ pháp lý hiện tại: "${legalReference || ''}"
- Danh mục hiện tại: "${category || ''}"
- Miền hiện tại: "${domain || ''}"
- Mức độ hiện tại: "${cognitiveLevel || ''}"
- Tags hiện tại: ${JSON.stringify(existingTags || [])}`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: "Bạn là chuyên gia thẩm định đề thi BTI 2026. Hãy trả về JSON chuẩn theo Schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedSubject: {
                type: Type.STRING,
                description: "Tên chủ đề / môn học chuyên môn phù hợp nhất"
              },
              suggestedCategory: {
                type: Type.STRING,
                description: "Danh mục phân loại ngắn gọn"
              },
              suggestedDomain: {
                type: Type.STRING,
                description: "Miền năng lực số chuẩn (MIEN_1, MIEN_2, MIEN_3, MIEN_4, MIEN_5, MIEN_6)"
              },
              suggestedDomainName: {
                type: Type.STRING,
                description: "Tên đầy đủ của miền năng lực số"
              },
              suggestedSubCompetency: {
                type: Type.STRING,
                description: "Mã năng lực thành phần (ví dụ: 4.2)"
              },
              suggestedSubCompetencyName: {
                type: Type.STRING,
                description: "Tên mô tả của năng lực thành phần"
              },
              suggestedLegalReference: {
                type: Type.STRING,
                description: "Căn cứ pháp lý tham chiếu chuẩn xác nhất"
              },
              suggestedCognitiveLevel: {
                type: Type.STRING,
                description: "Mức độ nhận thức dự đoán (NHAN_BIET | THONG_HIEU | VAN_DUNG | VAN_DUNG_CAO)"
              },
              suggestedTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Danh sách 3 đến 6 tags gợi ý chuẩn hóa"
              },
              confidenceScore: {
                type: Type.INTEGER,
                description: "Độ tin cậy của đề xuất (0 - 100%)"
              },
              keyConcepts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Các khái niệm tri thức cốt lõi được phát hiện"
              },
              reasoning: {
                type: Type.STRING,
                description: "Lý do sư phạm ngắn gọn đề xuất các nhãn này"
              }
            },
            required: ["suggestedSubject", "suggestedDomain", "suggestedSubCompetency", "suggestedTags", "confidenceScore", "reasoning"]
          }
        }
      });

      if (!response.text) throw new Error("Mô hình AI không trả về kết quả.");
      const result = JSON.parse(response.text.trim());
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("AI Auto-Tagging Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi tự động sinh tags bằng AI." });
    }
  });

  // AI Route: Parse raw text / unstructured exam into BTI 2026 format
  app.post("/api/ai/parse-excel-text", async (req, res) => {
    try {
      const { rawText } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY." });

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Dưới đây là nội dung đề thi / bảng dữ liệu thô:
"""
${rawText.slice(0, 8000)}
"""

Hãy bóc tách thành danh sách các câu hỏi theo cấu trúc Ngân hàng Đề thi BTI 2026:
- Tự động nhận diện câu hỏi Khởi động, Vượt CNV, Tăng tốc, Về đích, hoặc Đề Bộ GD&ĐT.
- Bóc tách nội dung câu hỏi, các phương án A, B, C, D (nếu có), đáp án đúng, giải thích.
- Dự đoán Miền năng lực số (MIEN_1 đến MIEN_6) theo Thông tư 02/2025/TT-BGDĐT.
- Dự đoán mức độ nhận thức (NHAN_BIET, THONG_HIEU, VAN_DUNG, VAN_DUNG_CAO).`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionText: { type: Type.STRING },
                roundName: { type: Type.STRING },
                roundType: { type: Type.STRING },
                options: {
                  type: Type.OBJECT,
                  properties: {
                    A: { type: Type.STRING },
                    B: { type: Type.STRING },
                    C: { type: Type.STRING },
                    D: { type: Type.STRING }
                  }
                },
                correctKey: { type: Type.STRING },
                explanation: { type: Type.STRING },
                domain: { type: Type.STRING },
                cognitiveLevel: { type: Type.STRING },
                legalReference: { type: Type.STRING }
              },
              required: ["questionText", "correctKey"]
            }
          }
        }
      });

      if (!response.text) throw new Error("AI không trả về kết quả.");
      res.json({ success: true, questions: JSON.parse(response.text.trim()) });
    } catch (error: any) {
      console.error("AI Parse Text Error:", error);
      res.status(500).json({ error: error.message || "Lỗi bóc tách đề thi." });
    }
  });

  // API route for summarizing audience interactions (Shouts or Q&A)
  app.post("/api/summarize-audience", async (req, res) => {
    try {
      const { type, data } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "API key is not configured on the server." });
      }
      
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });
      
      let prompt = "";
      if (type === 'SHOUTS') {
        prompt = `Hãy đóng vai một trợ lý AI phân tích bầu không khí sự kiện. Dưới đây là danh sách các tin nhắn/tiếng hô cổ vũ (shout) của khán giả trong ít phút vừa qua:\n\n${JSON.stringify(data)}\n\nHãy tóm tắt ngắn gọn trong 2-3 câu (tối đa 50 từ): Khán giả đang cảm thấy thế nào? Ai đang được cổ vũ nhiều nhất? Từ khóa nào xuất hiện nhiều? Hãy viết với giọng điệu năng động, MC có thể đọc ngay để khuấy động sân khấu.`;
      } else if (type === 'QA') {
        prompt = `Hãy đóng vai một trợ lý AI phân tích sự kiện. Dưới đây là danh sách các câu hỏi mà khán giả vừa gửi:\n\n${JSON.stringify(data)}\n\nHãy tóm tắt ngắn gọn trong 3-4 ý gạch đầu dòng: Đâu là những chủ đề chính/câu hỏi được quan tâm nhiều nhất? Có xu hướng chung nào trong các câu hỏi không? Phù hợp để MC tham khảo đọc lên sân khấu.`;
      } else {
        return res.status(400).json({ error: "Loại dữ liệu không hợp lệ." });
      }

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: "Bạn là trợ lý ảo phân tích tương tác trực tiếp cho MC sự kiện. Trả lời ngắn gọn, súc tích, văn phong tự nhiên, chuyên nghiệp.",
        }
      });

      if (!response.text) {
        throw new Error("No text returned from Gemini");
      }

      res.json({ summary: response.text.trim() });
    } catch (error: any) {
      console.error("Gemini Summarize Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi gọi AI tóm tắt." });
    }
  });

  // ==========================================
  // 1. GEMINI MULTI-TURN CHATBOT ROUTE
  // ==========================================
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { messages, systemInstruction, model } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      // Target model requested by user or default
      const requestedModel = model || "gemini-3.8-flash";
      
      // Multi-tier hierarchy fallback list to ensure zero failure
      const fallbackList = [
        requestedModel,
        "gemini-3.8-flash",
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite"
      ].filter((v, i, a) => a.indexOf(v) === i);

      // Convert history to contents format
      const contents = (messages || []).map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text || "" }]
      }));

      if (contents.length === 0) {
        return res.status(400).json({ error: "Lịch sử tin nhắn không được để trống." });
      }

      let replyText = "";
      let usedModel = requestedModel;
      let lastError: any = null;

      for (const m of fallbackList) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents,
            config: {
              systemInstruction: (systemInstruction ? systemInstruction + "\n\n" : "") + "HƯỚNG DẪN ĐỊNH DẠNG: Khi trình bày công thức toán học, thuật toán, hàm điều kiện hoặc tính điểm số, hãy sử dụng cú pháp LaTeX chuẩn được bao bởi $$ cho khối (block math) hoặc $ cho inline. Trong các môi trường \\begin{cases}...\\end{cases} hoặc ma trận/hệ phương trình, luôn sử dụng dấu xuống dòng hai gạch chéo '\\\\' rõ ràng giữa các nhánh.",
            }
          });
          if (response.text) {
            replyText = response.text;
            usedModel = m;
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${m} encountered an issue, trying fallback:`, err?.message || err);
        }
      }

      if (!replyText) {
        throw lastError || new Error("Không nhận được phản hồi từ mô hình Gemini.");
      }

      res.json({ success: true, text: replyText, usedModel });
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: error.message || "Lỗi xử lý cuộc hội thoại với Gemini." });
    }
  });

  // ==========================================
  // 2. CREATE & EDIT IMAGES WITH GEMINI
  // Model: gemini-3.1-flash-image-preview
  // ==========================================
  app.post("/api/ai/generate-image", async (req, res) => {
    try {
      const { prompt, base64Image, mimeType = "image/png", aspectRatio = "1:1", mode = "generate" } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Vui lòng nhập mô tả ảnh (prompt)." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const isEdit = mode === "edit" && Boolean(base64Image);
      const cleanBase64 = base64Image ? base64Image.replace(/^data:image\/\w+;base64,/, '') : '';

      // Models priority: gemini-3.1-flash-image-preview, gemini-3.1-flash-image, gemini-3.1-flash-lite-image, imagen-3.0-generate-002
      const candidateModels = isEdit
        ? ["gemini-3.1-flash-image-preview", "gemini-3.1-flash-lite-image", "gemini-3.1-flash-image"]
        : ["gemini-3.1-flash-image-preview", "gemini-3.1-flash-lite-image", "gemini-3.1-flash-image", "imagen-3.0-generate-002"];

      let imageUrl = "";
      let usedModel = "";
      let lastError: any = null;

      for (const model of candidateModels) {
        try {
          if (model === "imagen-3.0-generate-002" && !isEdit) {
            const validAspect = (aspectRatio === "16:9" || aspectRatio === "9:16" || aspectRatio === "4:3" || aspectRatio === "3:4" || aspectRatio === "1:1") ? aspectRatio : "1:1";
            const imgResp = await ai.models.generateImages({
              model: "imagen-3.0-generate-002",
              prompt,
              config: {
                numberOfImages: 1,
                aspectRatio: validAspect,
              }
            });
            const b64 = imgResp.generatedImages?.[0]?.image?.imageBytes;
            if (b64) {
              imageUrl = `data:image/png;base64,${b64}`;
              usedModel = model;
              break;
            }
          } else {
            const parts: any[] = [];
            if (isEdit && cleanBase64) {
              parts.push({
                inlineData: {
                  data: cleanBase64,
                  mimeType: mimeType || "image/png"
                }
              });
            }
            parts.push({ text: prompt });

            const resp = await ai.models.generateContent({
              model,
              contents: { parts },
              config: {
                imageConfig: {
                  aspectRatio: aspectRatio || "1:1",
                }
              }
            });

            const cParts = resp.candidates?.[0]?.content?.parts || [];
            for (const p of cParts) {
              if (p.inlineData?.data) {
                const mime = p.inlineData.mimeType || "image/png";
                imageUrl = `data:${mime};base64,${p.inlineData.data}`;
                usedModel = model;
                break;
              }
            }

            if (imageUrl) break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Image model ${model} failed, trying next fallback:`, err?.message || err);
        }
      }

      if (!imageUrl) {
        throw lastError || new Error("Không thể tạo hoặc chỉnh sửa ảnh từ mô hình AI.");
      }

      res.json({ success: true, imageUrl, usedModel });
    } catch (error: any) {
      console.error("Gemini Image Generation Error:", error);
      res.status(500).json({ error: error.message || "Lỗi trong quá trình tạo hoặc chỉnh sửa ảnh." });
    }
  });

  // ==========================================
  // 3. ANIMATE IMAGES INTO VIDEO (VEO)
  // Model: veo-3.1-fast-generate-preview
  // ==========================================
  app.post("/api/generate-video", async (req, res) => {
    try {
      const { prompt, base64Image, mimeType = "image/png", aspectRatio = "16:9" } = req.body;
      if (!base64Image) {
        return res.status(400).json({ error: "Vui lòng tải lên ảnh để biến thành video." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
      const validAspectRatio = aspectRatio === "9:16" ? "9:16" : "16:9";

      // Video models hierarchy
      const videoModels = ["veo-3.1-fast-generate-preview", "veo-3.1-lite-generate-preview", "veo-3.1-generate-preview"];
      let operation: any = null;
      let lastError: any = null;

      for (const model of videoModels) {
        try {
          operation = await ai.models.generateVideos({
            model,
            prompt: prompt || "Cinematic and smooth animation of the scene with subtle natural motion",
            image: {
              imageBytes: cleanBase64,
              mimeType: mimeType || "image/png"
            },
            config: {
              numberOfVideos: 1,
              resolution: "720p",
              aspectRatio: validAspectRatio
            }
          });
          if (operation?.name) break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Veo model ${model} failed, trying fallback:`, err?.message || err);
        }
      }

      if (!operation || !operation.name) {
        throw lastError || new Error("Không thể khởi tạo tiến trình video với Veo.");
      }

      res.json({ operationName: operation.name });
    } catch (error: any) {
      console.error("Veo Video Start Error:", error);
      const msg = error.message || String(error);
      const isBilling = msg.includes("billing") || msg.includes("quota") || msg.includes("403") || msg.includes("not enabled");
      const friendlyMsg = isBilling 
        ? "Mô hình Veo yêu cầu API Key có kích hoạt thanh toán (Paid API Key). Vui lòng gắn API Key trả phí để sử dụng tính năng này." 
        : (error.message || "Lỗi khi khởi tạo video với Veo.");
      res.status(500).json({ error: friendlyMsg });
    }
  });

  app.post("/api/video-status", async (req, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
        return res.status(400).json({ error: "Thiếu operationName." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });

      res.json({ 
        done: Boolean(updated.done),
        error: updated.error ? (updated.error.message || String(updated.error)) : null 
      });
    } catch (error: any) {
      console.error("Veo Status Error:", error);
      res.status(500).json({ error: error.message || "Lỗi kiểm tra tiến trình video." });
    }
  });

  app.post("/api/video-download", async (req, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
        return res.status(400).json({ error: "Thiếu operationName." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

      if (!uri) {
        return res.status(404).json({ error: "Video chưa hoàn thành hoặc không tìm thấy liên kết tải." });
      }

      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': apiKey },
      });

      if (!videoRes.ok) {
        throw new Error(`Tải video từ Google API thất bại: ${videoRes.status}`);
      }

      const arrayBuffer = await videoRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error: any) {
      console.error("Veo Download Error:", error);
      res.status(500).json({ error: error.message || "Lỗi khi tải dữ liệu video." });
    }
  });

  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', '*');
      }
    }));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath, (err) => {
          if (err && !res.headersSent) {
            res.status(500).send('Error serving application.');
          }
        });
      } else {
        res.status(404).send('Application build not found.');
      }
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown handling for container environments (Cloud Run)
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Closing server gracefully...');
    server.close(() => {
      console.log('Server closed successfully.');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received. Closing server gracefully...');
    server.close(() => {
      console.log('Server closed successfully.');
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
