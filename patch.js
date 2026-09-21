const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `  app.post("/api/ai/generate-advanced-question", async (req, res) => {
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
        count = 1 
      } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API key chưa được cấu hình trên hệ thống server." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const systemPrompt = \`Bạn là Chuyên gia Khảo thí và Biên soạn Ngân hàng Đề thi Quốc gia cho Cuộc thi "Beyond The Internet 2026" (BTI 2026).
Bạn có nhiệm vụ tạo ra câu hỏi thi học thuật xuất sắc, có tính phân loại cao, thực tế và tuân thủ tuyệt đối:

1. KHUNG NĂNG LỰC SỐ CHO NGƯỜI HỌC (Thông tư số 02/2025/TT-BGDĐT ngày 24/01/2025 của Bộ Giáo dục và Đào tạo).
   - Miền năng lực: \${domain} (Thành phần: \${subCompetency})
   - Mức độ nhận thức: \${cognitiveLevel} (Nhận biết / Thông hiểu / Vận dụng / Vận dụng cao)

2. GIAI ĐOẠN VÀ ĐỊNH DẠNG VÒNG THI:
   - Giai đoạn thi: \${stage}
   - Định dạng thi: \${roundFormat}
   \${stage === 'VONG_LOAI' ? \`
   * ĐẶC BIỆT VỚI ĐỀ THI VÒNG LOẠI BTI 2026:
   - Vòng loại chỉ có 1 dạng đề duy nhất gồm 28 câu (24 câu Phần I trắc nghiệm 4 lựa chọn ABCD và 4 câu Phần II Đúng/Sai 4 ý a,b,c,d). Tuyệt đối không chọn hoặc chia theo các vòng thi như Khởi động, VCNV, Tăng tốc, Về đích.
   - Nếu định dạng là BGD_MULTIPLE_CHOICE: Soạn câu trắc nghiệm 4 lựa chọn A, B, C, D với 1 đáp án đúng nhất (roundType: "MULTIPLE_CHOICE", timeLimit: 30, points: 1).
   - Nếu định dạng là BGD_TRUE_FALSE_4: Soạn 1 tình huống cùng 4 nhận định/mệnh đề A, B, C, D (ứng với ý a, b, c, d). correctKey định dạng chuẩn: "A:Đ|B:S|C:Đ|D:S" (roundType: "TRUE_FALSE_4", timeLimit: 60, points: 4).
   \` : ''}

3. CĂN CỨ PHÁP LÝ BẮT BUỘC:
   - Căn cứ pháp lý: \${legalReference}
   \${contextDoc ? \`\\n- NỘI DUNG TÀI LIỆU PHÁP LÝ THAM CHIẾU ĐÍNH KÈM:\\n\${contextDoc.slice(0, 3000)}\\n\` : ''}

4. YÊU CẦU CHẤT LƯỢNG:
   - Câu hỏi gắn liền tình huống số thực tiễn (Deepfake, AI tạo sinh, lừa đảo trực tuyến, bảo vệ dữ liệu cá nhân, liêm chính học thuật, an sinh số).
   - Bẫy logic tinh tế, phân hóa rõ rệt, giải thích chi tiết có trích dẫn điều khoản luật cụ thể.\`;`;

const replacement = `  app.post("/api/ai/generate-advanced-question", async (req, res) => {
    try {
      const { 
        stage = 'BAN_KET_1',
        roundFormat = 'KHOI_DONG_RIENG',
        formatDetails,
        domain = 'MIEN_4',
        subCompetency = '4.2',
        cognitiveLevel = 'THONG_HIEU',
        legalReference = 'Thông tư 02/2025/TT-BGDĐT & Nghị định 13/2023/NĐ-CP',
        contextDoc = '',
        topicPrompt = '',
        count = 1 
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
        formatRules = \`
   * ĐẶC THÙ CỦA ĐỊNH DẠNG NÀY THEO LUẬT CHƠI BTI 2026:
   - Tên định dạng: \${formatDetails.name}
   - Yêu cầu biên soạn: \${formatDetails.description}
   - Luật tính điểm: \${formatDetails.scoringRule}
   - BẮT BUỘC SỬ DỤNG roundType: "\${formatDetails.defaultRoundType}"
   - Thời gian suy nghĩ: \${formatDetails.defaultTimeLimit} giây
   - Điểm số: \${formatDetails.defaultPoints} điểm
        \`;
      }

      const systemPrompt = \`Bạn là Chuyên gia Khảo thí và Biên soạn Ngân hàng Đề thi Quốc gia cho Cuộc thi "Beyond The Internet 2026" (BTI 2026).
Bạn có nhiệm vụ tạo ra câu hỏi thi học thuật xuất sắc, có tính phân loại cao, thực tế và tuân thủ tuyệt đối:

1. KHUNG NĂNG LỰC SỐ CHO NGƯỜI HỌC (Thông tư số 02/2025/TT-BGDĐT ngày 24/01/2025 của Bộ Giáo dục và Đào tạo).
   - Miền năng lực: \${domain} (Thành phần: \${subCompetency})
   - Mức độ nhận thức: \${cognitiveLevel} (Nhận biết / Thông hiểu / Vận dụng / Vận dụng cao)

2. GIAI ĐOẠN VÀ ĐỊNH DẠNG VÒNG THI:
   - Giai đoạn thi: \${stage}
   - Định dạng thi: \${roundFormat}
   \${stage === 'VONG_LOAI' ? \`
   * ĐẶC BIỆT VỚI ĐỀ THI VÒNG LOẠI BTI 2026:
   - Vòng loại chỉ có 1 dạng đề duy nhất gồm 28 câu (24 câu Phần I trắc nghiệm 4 lựa chọn ABCD và 4 câu Phần II Đúng/Sai 4 ý a,b,c,d). Tuyệt đối không chọn hoặc chia theo các vòng thi như Khởi động, VCNV, Tăng tốc, Về đích.
   - Nếu định dạng là BGD_MULTIPLE_CHOICE: Soạn câu trắc nghiệm 4 lựa chọn A, B, C, D với 1 đáp án đúng nhất (roundType: "MULTIPLE_CHOICE", timeLimit: 30, points: 1).
   - Nếu định dạng là BGD_TRUE_FALSE_4: Soạn 1 tình huống cùng 4 nhận định/mệnh đề A, B, C, D (ứng với ý a, b, c, d). correctKey định dạng chuẩn: "A:Đ|B:S|C:Đ|D:S" (roundType: "TRUE_FALSE_4", timeLimit: 60, points: 4).
   \` : formatRules}

3. CĂN CỨ PHÁP LÝ BẮT BUỘC:
   - Căn cứ pháp lý: \${legalReference}
   \${contextDoc ? \`\\n- NỘI DUNG TÀI LIỆU PHÁP LÝ THAM CHIẾU ĐÍNH KÈM:\\n\${contextDoc.slice(0, 3000)}\\n\` : ''}

4. YÊU CẦU CHẤT LƯỢNG KỸ THUẬT:
   - ĐỐI VỚI VƯỢT CHƯỚNG NGẠI VẬT: correctKey CHỈ là Từ khóa Hàng ngang (rất ngắn gọn).
   - ĐỐI VỚI ĐIỀN KHUYẾT / TRẢ LỜI NGẮN: correctKey phải CHÍNH XÁC là cụm từ cần điền, không dư thừa chữ.
   - Trắc nghiệm (MULTIPLE_CHOICE): correctKey là A, B, C, D.
   - Câu hỏi gắn liền tình huống số thực tiễn (Deepfake, AI tạo sinh, lừa đảo trực tuyến, bảo vệ dữ liệu cá nhân, liêm chính học thuật, an sinh số).
   - Bẫy logic tinh tế, phân hóa rõ rệt, giải thích chi tiết có trích dẫn điều khoản luật cụ thể.\`;`;

if (code.includes(target)) {
  fs.writeFileSync('server.ts', code.replace(target, replacement));
  console.log('Success');
} else {
  console.log('Target not found in server.ts');
}
