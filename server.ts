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
    // Approved models hierarchy with gemini-3.5-flash for Search Grounding
    const fallbackModels = [
      "gemini-3.5-flash",
      "gemini-3.8-flash",
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

  // Dedicated AI Auto-Tagging & Search Optimization Endpoint
  app.post("/api/ai/auto-suggest-tags", async (req, res) => {
    try {
      const { questionText, options, explanation, legalReference, category, domain, cognitiveLevel, existingTags } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ." });

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Bạn là Trợ lý AI Khảo thí chuyên sâu về Phân loại & Tự động Đánh Thẻ (Auto-Tagging) cho Ngân hàng Đề thi Cuộc thi "Beyond The Internet 2026" (BTI 2026).
Nhiệm vụ: Phân tích kỹ lưỡng nội dung câu hỏi, các phương án lựa chọn, lời giải thích và căn cứ pháp lý để tự động đề xuất 3-6 thẻ/tags phân loại có tính tìm kiếm cao nhất.

Quy tắc sinh thẻ (Tags):
1. Mỗi tag ngắn gọn (1-3 từ), viết thường, có thể sử dụng dấu gạch dưới thay cho khoảng trắng hoặc viết cách thông thường (VD: "deepfake", "phishing", "nghi_dinh_13", "xac_thuc_2fa", "bao_mat_email", "quyen_rieng_tu", "liem_chinh_hoc_thuat").
2. Đa dạng các khía cạnh:
   - Kỹ thuật / Mối đe dọa / Công nghệ (VD: deepfake, phishing, ransomware, 2fa, encryption, generative_ai)
   - Văn bản pháp lý & chuẩn mực (VD: nghi_dinh_13, thong_tu_02, luat_an_ninh_mang)
   - Tình huống thực tiễn & miền năng lực (VD: email_sinh_vien, quyen_rieng_tu, an_toan_giao_dich, sao_luu_321)
3. Không lặp lại các tags đã có nếu không cần thiết.

Nội dung câu hỏi:
- Đề bài: "${questionText || ''}"
- Các phương án: ${JSON.stringify(options || {})}
- Lời giải thích: "${explanation || ''}"
- Căn cứ pháp lý: "${legalReference || ''}"
- Danh mục / Chủ đề: "${category || ''}"
- Miền năng lực: "${domain || ''}"
- Mức độ nhận thức: "${cognitiveLevel || ''}"
- Nhãn hiện tại: ${JSON.stringify(existingTags || [])}`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          systemInstruction: "Bạn là chuyên gia khảo thí BTI 2026. Hãy trả về JSON chuẩn theo Schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Danh sách 3 đến 6 tags gợi ý chuẩn hóa"
              },
              suggestedCategory: {
                type: Type.STRING,
                description: "Danh mục / Chủ đề phù hợp nhất"
              },
              suggestedDomain: {
                type: Type.STRING,
                description: "Miền năng lực số dự đoán (MIEN_1 đến MIEN_6)"
              },
              suggestedCognitiveLevel: {
                type: Type.STRING,
                description: "Mức độ nhận thức dự đoán (NHAN_BIET | THONG_HIEU | VAN_DUNG | VAN_DUNG_CAO)"
              },
              reasoning: {
                type: Type.STRING,
                description: "Lý do ngắn gọn đề xuất các tags này"
              }
            },
            required: ["suggestedTags", "reasoning"]
          }
        }
      });

      if (!response.text) throw new Error("Mô hình AI không trả về kết quả.");
      res.json({ success: true, ...JSON.parse(response.text.trim()) });
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
