import { InteractiveScenario } from '../types';

export const PRESEEDED_SCENARIOS: InteractiveScenario[] = [
  {
    id: 'SCENARIO_01',
    title: 'Tình huống 1: Bẫy Lừa Đảo Học Bổng Quốc Tế & Rò Rỉ Dữ Liệu Học Đường',
    stage: 'CHUNG_KET',
    domain: 'MIEN_4',
    cognitiveLevel: 'VAN_DUNG_CAO',
    characters: ['MC / Dẫn kịch', 'Thí sinh (Vai Sinh viên Nam)', 'Kẻ mạo danh Cán bộ Phòng Hợp tác Quốc tế'],
    setting: 'Tại bàn làm việc ký túc xá. Màn hình máy tính hiển thị trang Fanpage giả mạo mang tên "Học bổng Erasmus+ Vietnam 2026".',
    scriptText: `[PHÂN CẢNH 1]:
Kẻ mạo danh (gọi điện thoại qua Zalo Business): "Chào em Nam, em đã vượt qua vòng sơ loại học bổng Toàn phần BTI 2026. Hiện tại ban tổ chức cần em cung cấp số định danh cá nhân CCCD gắn chip và ảnh chụp 2 mặt, kèm theo số thẻ ATM để kích hoạt tài khoản giải ngân học bổng 5.000 USD trước 17h00 hôm nay."

[PHÂN CẢNH 2]:
Kẻ mạo danh: "Hệ thống vừa gửi mã xác nhận bảo mật gồm 6 chữ số về số điện thoại của em. Em đọc ngay mã này cho anh để hoàn tất hồ sơ, nếu chậm quá 5 phút học bổng sẽ chuyển cho thí sinh dự bị tiếp theo!"

[TÌNH HUỐNG CAO TRÀO]:
Nam nhìn điện thoại thấy tin nhắn gửi từ ngân hàng có nội dung: "OTP xác nhận chuyển tiền 25.000.000 VND từ tài khoản sinh viên". Nam đang rất hoang mang và bị kẻ xấu liên tục hối thúc.`,
    dilemmaQuestion: 'Nếu em là Nam, hãy đóng vai và thể hiện cách xử lý tình huống ngay trên sân khấu trong 60 giây để vừa bảo vệ an toàn tài sản, dữ liệu cá nhân, vừa thu thập chứng cứ báo cáo cơ quan chức năng?',
    options: {
      A: 'Đọc mã OTP nhưng chỉ đọc 5 số đầu để thăm dò',
      B: 'Lập tức cúp máy, KHÔNG cung cấp OTP, chụp màn hình tin nhắn/số điện thoại, khóa thẻ tạm thời trên App Ngân hàng và báo cáo Cán bộ phụ trách trường',
      C: 'Chuyển trước 500.000đ phí kích hoạt như kẻ mạo danh yêu cầu',
      D: 'Chia sẻ số điện thoại kẻ lừa đảo lên Facebook để nhờ bạn bè gọi điện chửi bới'
    },
    correctOption: 'B',
    actionChecklist: [
      'Tuyệt đối không cung cấp mã OTP, mật khẩu, thông tin thẻ tín dụng/ATM cho bất kỳ ai qua điện thoại',
      'Giữ bình tĩnh, không để bị thao túng tâm lý bởi chiêu trò "khẩn cấp / sắp hết hạn"',
      'Chủ động ngắt kết nối cuộc gọi, lập tức kích hoạt tính năng khóa thẻ/tài khoản trên ứng dụng ngân hàng số',
      'Lưu vết bằng chứng: chụp màn hình tin nhắn, ghi âm cuộc gọi, lưu số điện thoại mạo danh',
      'Báo cáo ngay cho Phòng Công tác Sinh viên của Nhà trường và đường dây nóng Cục An ninh mạng (A05 - Bộ Công an)'
    ],
    timeLimitThought: 20,
    timeLimitAction: 60,
    rubric: [
      { criterion: 'Phản xạ an toàn số (Bảo mật OTP & Ngừng cung cấp thông tin)', maxPoints: 10, description: 'Từ chối dứt khoát việc đọc mã OTP, nhận diện đúng bẫy tâm lý Social Engineering.' },
      { criterion: 'Thao tác kỹ thuật ứng phó sự cố (Khóa thẻ & Giữ chứng cứ)', maxPoints: 15, description: 'Trình bày hoặc mô phỏng thao tác khóa thẻ trên app ngân hàng, chụp lại log tin nhắn.' },
      { criterion: 'Căn cứ pháp lý & Quy trình báo cáo (NĐ 13/2023 & Báo cơ quan)', maxPoints: 15, description: 'Dẫn chứng điều khoản bảo vệ dữ liệu cá nhân, báo cáo đúng kênh chính thống.' }
    ],
    legalBasis: 'Điều 9, Điều 13 Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân; Điều 8 Luật An ninh mạng 2018 (Nghiêm cấm hành vi lừa đảo, chiếm đoạt tài sản trên không gian mạng).',
    status: 'APPROVED',
    author: 'TS. Hoàng Minh Sơn',
    createdAt: Date.now() - 86400000 * 5
  },
  {
    id: 'SCENARIO_02',
    title: 'Tình huống 2: Ứng Dụng GenAI Viết Luận & Liêm Chính Học Thuật Số',
    stage: 'BAN_KET_3',
    domain: 'MIEN_6',
    cognitiveLevel: 'VAN_DUNG_CAO',
    characters: ['MC', 'Thí sinh (Nhóm trưởng dự án)', 'Thành viên nhóm lạm dụng AI'],
    setting: 'Tại phòng họp trực tuyến Google Meet. Nhóm đang tổng duyệt báo cáo nghiên cứu khoa học tham gia vòng bán kết BTI 2026.',
    scriptText: `[PHÂN CẢNH 1]:
Thành viên nhóm hớn hở: "Cả nhóm yên tâm! Phần tổng quan tài liệu và phân tích dữ liệu 30 trang tớ đã dùng ChatGPT và Gemini Pro tạo ra trong 10 phút. Tớ còn dùng prompt bảo nó trích dẫn 15 bài báo khoa học chuẩn Scopus quốc tế nữa, nhìn cực kỳ chuyên nghiệp và uy tín!"

[PHÂN CẢNH 2]:
Nhóm trưởng (Thí sinh) kiểm tra ngẫu nhiên 3 trích dẫn DOI trong tài liệu thì phát hiện link đều báo lỗi 404, tác giả có tên nhưng bài báo không hề tồn tại trên hệ thống Google Scholar hay IEEE.

[TÌNH HUỐNG CAO TRÀO]:
Chỉ còn 30 phút nữa là hạn chót nộp bài dự thi lên cổng thẩm định quốc gia. Nếu nộp bài này nhóm có nguy cơ bị hủy tư cách thi vì gian lận và ngụy tạo dữ liệu. Thành viên nhóm thì năn nỉ: "Thôi cứ nộp đi, ban giám khảo làm sao kiểm tra từng bài được!"`,
    dilemmaQuestion: 'Nhóm trưởng cần đưa ra quyết định gì và xử lý tình huống như thế nào để vừa bảo đảm liêm chính học thuật (Academic Integrity), tuân thủ chuẩn năng lực số TT 02/2025 về ứng dụng AI, vừa có giải pháp cứu vãn bài báo cáo của nhóm?',
    options: {
      A: 'Đồng ý nộp ngay để kịp thời gian, nếu bị phát hiện thì đổ lỗi cho công cụ AI tự bịa',
      B: 'Kiên quyết từ chối nộp nội dung bịa đặt; sử dụng các công cụ kiểm chứng nguồn thực tế; xin phép ban tổ chức hoãn 1 giờ hoặc nộp bản tóm tắt có nguồn xác thực',
      C: 'Tự động sửa lại tên bài báo cho giống thật hơn',
      D: 'Rút lui khỏi cuộc thi và từ mặt thành viên nhóm'
    },
    correctOption: 'B',
    actionChecklist: [
      'Nhận diện hiện tượng AI Hallucination (Ảo giác AI - sinh tài liệu tham khảo giả mạo)',
      'Tuân thủ nguyên tắc liêm chính học thuật và đạo đức AI theo Thông tư 02/2025/TT-BGDĐT Miền 6.2 & 6.3',
      'Kiểm chứng chéo (Fact-checking) mọi thông tin do GenAI sinh ra bằng nguồn cơ sở dữ liệu học thuật chính thống',
      'Minh bạch hóa việc sử dụng AI (Ghi chú rõ công cụ đã sử dụng và phạm vi hỗ trợ trong báo cáo)',
      'Giao tiếp nội bộ quyết đoán, bảo vệ uy tín của nhóm'
    ],
    timeLimitThought: 15,
    timeLimitAction: 60,
    rubric: [
      { criterion: 'Nhận thức về đạo đức & rủi ro GenAI', maxPoints: 15, description: 'Phân tích đúng hiện tượng AI Hallucination và vi phạm liêm chính khoa học.' },
      { criterion: 'Giải pháp xử lý tình huống & Quản lý khủng hoảng', maxPoints: 15, description: 'Đưa ra lộ trình sửa đổi, kiểm chứng tài liệu, minh bạch trách nhiệm.' },
      { criterion: 'Kỹ năng làm việc nhóm & Lãnh đạo số', maxPoints: 10, description: 'Thuyết phục đồng đội, giữ gìn uy tín tập thể.' }
    ],
    legalBasis: 'Khoản 19 Điều 2 & Miền VI Thông tư 02/2025/TT-BGDĐT: Năng lực sử dụng AI có đạo đức và trách nhiệm; Luật Sở hữu trí tuệ; Quy định về liêm chính học thuật số của Bộ GD&ĐT.',
    status: 'APPROVED',
    author: 'ThS. Nguyễn Thu Trang',
    createdAt: Date.now() - 86400000 * 3
  },
  {
    id: 'SCENARIO_03',
    title: 'Tình huống 3: Bắt Nạt Qua Mạng (Cyberbullying) & Xử Lý Khủng Hoảng Truyền Thông Học Đường',
    stage: 'BAN_KET_2',
    domain: 'MIEN_4',
    cognitiveLevel: 'VAN_DUNG',
    characters: ['MC', 'Thí sinh (Lớp trưởng / Ban Chấp hành Đoàn)', 'Nạn nhân bị bạo lực mạng'],
    setting: 'Tại góc hành lang giảng đường. Một trang Confession của trường với 150.000 theo dõi vừa đăng bài viết ẩn danh bịa đặt đời tư, xúc phạm nhân phẩm một bạn nữ sinh viên kèm ảnh chụp lén.',
    scriptText: `[PHÂN CẢNH 1]:
Nạn nhân vừa khóc vừa run rẩy: "Cả đêm qua tớ không dám ngủ. Dưới bài viết có hơn 2.000 bình luận lăng mạ, chế giễu ngoại hình của tớ. Có người còn tìm ra địa chỉ nhà và gửi tin nhắn đe dọa. Tớ không muốn đến trường nữa..."

[PHÂN CẢNH 2]:
Một số bạn cùng lớp bức xúc đề nghị: "Tụi mình lập hội đi hack sập cái Fanpage Confession đó đi, rồi truy tìm danh tính admin đăng bài để đánh dằn mặt!"

[TÌNH HUỐNG CAO TRÀO]:
Tình hình đang lan rộng nhanh chóng trên TikTok và Threads. Nạn nhân có dấu hiệu suy sụp tâm lý nghiêm trọng. Là cán bộ lớp, thí sinh cần có kế hoạch hành động ngay tức khắc.`,
    dilemmaQuestion: 'Em sẽ tư vấn và hỗ trợ nạn nhân như thế nào theo đúng quy chuẩn An sinh số (Digital Wellbeing) và các chế tài pháp luật hiện hành?',
    options: {
      A: 'Ủng hộ việc tấn công mạng đánh sập Fanpage để trả thù',
      B: 'Bảo bạn gái im lặng khóa Facebook coi như không có chuyện gì xảy ra',
      C: 'Hỗ trợ tâm lý, hướng dẫn thu thập vi bằng/ảnh chụp bài viết và bình luận, liên hệ Ban quản trị trường học và cơ quan an ninh mạng yêu cầu gỡ bỏ, xử phạt theo Nghị định 14/2022/NĐ-CP',
      D: 'Vào tranh cãi tay đôi dưới phần bình luận của bài viết'
    },
    correctOption: 'C',
    actionChecklist: [
      'Ưu tiên sơ cứu tâm lý, đảm bảo nạn nhân không bị cô lập hay có hành vi tự hại',
      'Hướng dẫn lập vi bằng điện tử, lưu ảnh chụp màn hình, đường link bài viết và các bình luận quấy rối',
      'Ngăn chặn hành vi trả đũa bằng bạo lực hoặc tấn công mạng trái pháp luật',
      'Báo cáo bài viết vi phạm tiêu chuẩn cộng đồng nền tảng và báo cáo Nhà trường can thiệp',
      'Yêu cầu cơ quan chức năng xử lý đối tượng phát tán thông tin vu khống theo Điều 16 Luật An ninh mạng và Nghị định 14/2022/NĐ-CP'
    ],
    timeLimitThought: 15,
    timeLimitAction: 45,
    rubric: [
      { criterion: 'Bảo vệ an sinh & sức khỏe tâm lý số (Miền 4.3)', maxPoints: 15, description: 'Biện pháp trấn an tinh thần, đường dây nóng hỗ trợ tâm lý học đường.' },
      { criterion: 'Kỹ năng pháp lý số & Lập vi bằng chứng cứ', maxPoints: 15, description: 'Biết cách thu thập bằng chứng hợp pháp trước khi kẻ xấu xóa bài.' },
      { criterion: 'Tuân thủ pháp luật, tránh hành vi vi phạm thứ cấp', maxPoints: 10, description: 'Ngăn chặn tấn công mạng trả đũa, xử lý văn minh theo pháp luật.' }
    ],
    legalBasis: 'Khoản 2 Điều 2 & Miền 4.3 Thông tư 02/2025/TT-BGDĐT; Điều 8, 16 Luật An ninh mạng 2018; Điểm a Khoản 1 Điều 101 Nghị định 15/2020/NĐ-CP (sửa đổi bởi NĐ 14/2022/NĐ-CP).',
    status: 'APPROVED',
    author: 'PGS. TS. Trần Quốc Bảo',
    createdAt: Date.now() - 86400000 * 2
  }
];
