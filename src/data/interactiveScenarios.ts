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
    branches: {
      A: {
        key: 'A',
        text: 'Đọc mã OTP nhưng chỉ đọc 5 số đầu để thăm dò',
        isOptimal: false,
        statusType: 'DANGER',
        reactionScript: `[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN A]:
Kẻ mạo danh (cười đắc ý trong máy): "Cảm ơn em, hệ thống đã nhận 5 số! Số cuối cùng chắc chắn là..." (kẻ xấu chạy mã brute-force hoặc dùng kỹ thuật tâm lý dồn dập).
Kẻ mạo danh: "Đường truyền đang nghẽn, em đọc nốt số cuối để tiền vào tài khoản ngay nào!"
Chỉ 10 giây sau, chuông điện thoại Nam reo vang thông báo từ Ngân hàng: "Tài khoản của bạn đã bị trừ 25.000.000 VND".
MC bước ra can thiệp: "Thí sinh đã mắc bẫy! Kẻ gian chỉ cần 5 chữ số là đã có thể thu hẹp tổ hợp brute-force hoặc tạo sức ép tâm lý dồn dập khiến nạn nhân buông xuôi số cuối cùng."`,
        consequence: 'Tài khoản sinh viên bị rút sạch tiền trong tích tắc. Dữ liệu CCCD và thông tin tài khoản bị ghi vào danh sách đen bán cho các đường dây rửa tiền xuyên biên giới.',
        feedback: 'Sai lầm nghiêm trọng: Mã OTP là lớp phòng thủ xác thực hai yếu tố (2FA) cuối cùng. Cung cấp một phần cũng như cung cấp toàn bộ, vi phạm nguyên tắc bảo mật thông tin tối thiểu theo Điều 9 Nghị định 13/2023/NĐ-CP.'
      },
      B: {
        key: 'B',
        text: 'Lập tức cúp máy, KHÔNG cung cấp OTP, chụp màn hình tin nhắn/số điện thoại, khóa thẻ tạm thời trên App Ngân hàng và báo cáo Cán bộ phụ trách trường',
        isOptimal: true,
        statusType: 'SUCCESS',
        reactionScript: `[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN B]:
Nam (dứt khoát trên sân khấu): "Tôi không bao giờ cung cấp mã OTP cho bất kỳ ai qua điện thoại. Mọi thủ tục học bổng tôi sẽ làm việc trực tiếp tại Văn phòng Hợp tác Quốc tế của Trường!"
Kẻ mạo danh (hoảng hốt): "Ơ này... em sẽ mất học bổng đấy..." -> Nam cúp máy dứt khoát!
Nam lập tức mở điện thoại, thao tác khóa nhanh tính năng giao dịch trực tuyến trên ứng dụng ngân hàng số, chụp lại ảnh màn hình số điện thoại mạo danh và tin nhắn OTP.
MC vỗ tay: "Xử lý tuyệt vời! Thí sinh đã thực hiện chuẩn mực phản xạ an toàn số: Ngắt kết nối - Cô lập rủi ro - Khóa tài khoản - Lưu vết chứng cứ!"
Cán bộ trường xuất hiện: "Cảm ơn em đã cảnh giác, Nhà trường sẽ phát thông báo cảnh báo toàn trường ngay lập tức."`,
        consequence: 'Bảo toàn nguyên vẹn 100% tài sản và thông tin cá nhân. Nhà trường kịp thời phát cảnh báo diện rộng giúp hàng nghìn sinh viên khác không bị mắc bẫy.',
        feedback: 'Phương án chuẩn xác tuyệt đối! Thể hiện trọn vẹn Năng lực số Miền 4 (An toàn và An sinh số theo TT 02/2025). Thao tác khóa thẻ trên app và lưu chứng cứ đáp ứng đúng quy trình ứng cứu sự cố an ninh thông tin.'
      },
      C: {
        key: 'C',
        text: 'Chuyển trước 500.000đ phí kích hoạt như kẻ mạo danh yêu cầu',
        isOptimal: false,
        statusType: 'DANGER',
        reactionScript: `[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN C]:
Nam chuyển tiền qua mã QR tài khoản cá nhân của kẻ xấu.
Kẻ mạo danh (giọng điệu thay đổi): "Đã nhận 500.000đ. Tuy nhiên hồ sơ của em bị vướng thuế giải ngân quốc tế, em cần đóng thêm 2.000.000đ tiền bảo hiểm khoản vay thì mới nhận được 5.000 USD!"
Nam lúng túng xin nợ thì kẻ mạo danh đe dọa: "Nếu em không nộp trong 15 phút, bên anh sẽ hủy kết quả học bổng và báo về trường em có dấu hiệu gian dối!"
MC can thiệp: "Đây chính là bẫy chi phí chìm (Sunk Cost Fallacy). Càng nộp, nạn nhân càng lún sâu vào chiếc bẫy tống tiền không lối thoát!"`,
        consequence: 'Mất trắng số tiền đã chuyển, đồng thời bị kẻ lừa đảo liệt vào danh sách "con mồi tiềm năng" để tiếp tục gọi điện đe dọa, khủng bố tinh thần.',
        feedback: 'Không có bất kỳ học bổng chính thống nào yêu cầu đóng "phí kích hoạt" vào tài khoản cá nhân. Hành vi này thể hiện sự thiếu hụt kiến thức nhận diện lừa đảo kỹ thuật xã hội (Social Engineering).'
      },
      D: {
        key: 'D',
        text: 'Chia sẻ số điện thoại kẻ lừa đảo lên Facebook để nhờ bạn bè gọi điện chửi bới',
        isOptimal: false,
        statusType: 'WARNING',
        reactionScript: `[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN D]:
Nam chụp màn hình số điện thoại đăng công khai lên trang cá nhân với lời lẽ công kích, kích động bạn bè gọi điện "dội bom" số điện thoại này.
Hôm sau, một người phụ nữ lớn tuổi liên lạc trong nước mắt: "Cháu ơi, số điện thoại này của cô bị kẻ xấu chiếm đoạt quyền điều khiển (SIM Swap / Spoofing Caller ID), cô không hề lừa đảo ai mà suốt đêm qua bị hàng trăm cuộc gọi chửi bới, đe dọa tính mạng!"
MC bước ra cảnh báo: "Hành động cảm tính của thí sinh vô tình biến một nạn nhân khác thành đối tượng bị bạo lực mạng!"`,
        consequence: 'Gây tổn hại tinh thần cho người vô tội do kẻ gian sử dụng số điện thoại ảo / giả mạo danh tính gọi đến. Bản thân Nam có nguy cơ bị xử phạt hành chính do phát tán thông tin xúc phạm người khác.',
        feedback: 'Vi phạm Điều 8 và Điều 16 Luật An ninh mạng 2018 (Hành vi xúc phạm danh dự, phát tán thông tin chưa kiểm chứng). Việc xử lý tội phạm mạng phải thông qua cơ quan điều tra công an (A05), không được tự ý kích động đám đông trừng phạt số.'
      }
    },
    subOptimalScript: `[KỊCH BẢN ỨNG BIẾN KHI CHỌN PHƯƠNG ÁN SAI / CHƯA TỐI ƯU]:
MC bước nhanh ra sân khấu: "Rất tiếc! Thí sinh đã đưa ra một quyết định chưa tối ưu và rơi vào bẫy tâm lý khẩn cấp của đối tượng mạo danh!"
Màn hình sân khấu nhấp nháy đèn đỏ báo động: [CẢNH BÁO SỰ CỐ: TÀI KHOẢN BỊ XÂM NHẬP - DỮ LIỆU CCCD VÀ OTP BỊ RÒ RỈ].
MC: "Xin trân trọng kính mời TS. Hoàng Minh Sơn - Cố vấn An ninh mạng của Cuộc thi đưa ra nhận định chuyên môn cho tình huống này!"
TS. Hoàng Minh Sơn (Cố vấn): "Trong tình huống này, đối tượng sử dụng chiêu thức Social Engineering kết hợp đòn tâm lý 'hết hạn trong 5 phút'. Việc cung cấp dù chỉ 5 số đầu của OTP (Phương án A), nộp tiền phí kích hoạt (Phương án C) hay tự ý phát tán số điện thoại kích động bạo lực mạng (Phương án D) đều là những sai lầm chết người. Quy tắc an toàn số cốt lõi: Tuyệt đối không chia sẻ mã OTP cho bất kỳ ai, và luôn xác thực qua kênh chính thống của Nhà trường!"
MC: "Xin cảm ơn lời khuyên quý báu của Thầy Cố vấn. Đây là bài học cảnh tỉnh sâu sắc cho tất cả chúng ta khi tham gia môi trường mạng."`,
    actionChecklist: [
      'Tuyệt đối không cung cấp mã OTP, mật khẩu, thông tin thẻ tín dụng/ATM cho bất kỳ ai qua điện thoại',
      'Giữ bình tĩnh, không để bị thao túng tâm lý bởi chiêu trò "khẩn cấp / sắp hết hạn"',
      'Chủ động ngắt kết nối cuộc gọi, lập tức kích hoạt tính năng khóa thẻ/tài khoản trên ứng dụng ngân hàng số',
      'Lưu vết bằng chứng: chụp màn hình tin nhắn, ghi âm cuộc gọi, lưu số điện thoại mạo danh',
      'Báo cáo ngay cho Phòng Công tác Sinh viên của Nhà trường và đường dây nóng Cục An ninh mạng (A05 - Bộ Công an)'
    ],
    timeLimitThought: 20,
    timeLimitAction: 60,
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
    branches: {
      A: {
        key: 'A',
        text: 'Đồng ý nộp ngay để kịp thời gian, nếu bị phát hiện thì đổ lỗi cho công cụ AI tự bịa',
        isOptimal: false,
        statusType: 'DANGER',
        reactionScript: `[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN A]:
Nhóm bấm nộp bài vào phút chót.
3 ngày sau, Hội đồng Thẩm định BTI Quốc gia gửi thông báo triệu tập khẩn cấp: "Hội đồng phát hiện 15 tài liệu tham khảo trong báo cáo hoàn toàn không có thực. Đây là hành vi ngụy tạo dữ liệu khoa học đặc biệt nghiêm trọng."
Nhóm trưởng thanh minh: "Dạ thưa thầy do ChatGPT tự sinh ra ạ!"
Chủ tịch Hội đồng tuyên bố: "Người đứng tên công trình phải chịu 100% trách nhiệm về tính xác thực của nội dung. Toàn đội bị hủy tư cách thi và thông báo kỷ luật về trường đại học!"`,
        consequence: 'Toàn bộ nhóm bị loại khỏi cuộc thi BTI 2026, bị ghi vết kỷ luật học thuật trên hồ sơ sinh viên, đánh mất hoàn toàn cơ hội tham gia các đề tài NCKH trong tương lai.',
        feedback: 'Vi phạm nghiêm trọng Quy định Liêm chính học thuật số của Bộ GD&ĐT và Miền 6 Thông tư 02/2025/TT-BGDĐT. Trí tuệ nhân tạo chỉ là công cụ hỗ trợ, con người là chủ thể chịu trách nhiệm giải trình (Accountability) cao nhất.'
      },
      B: {
        key: 'B',
        text: 'Kiên quyết từ chối nộp nội dung bịa đặt; sử dụng các công cụ kiểm chứng nguồn thực tế; xin phép ban tổ chức hoãn 1 giờ hoặc nộp bản tóm tắt có nguồn xác thực',
        isOptimal: true,
        statusType: 'SUCCESS',
        reactionScript: `[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN B]:
Nhóm trưởng (bản lĩnh, quả quyết): "Không được nộp! Uy tín khoa học và danh dự của nhóm quan trọng hơn một bài báo cáo chắp vá. Chúng ta dừng nộp phần tài liệu giả mạo này ngay!"
Nhóm trưởng phân công: "Bạn Nam mở ngay Google Scholar và Thư viện Quốc gia tìm 5 bài báo thật có mã DOI chính xác. Tớ gửi email khẩn cấp thông báo Ban Tổ chức về việc cập nhật bản hiệu đính nguồn minh bạch."
MC xuất hiện vỗ tay: "Bản lĩnh xuất sắc của người nhóm trưởng số! Không khoan nhượng với ngụy tạo học thuật, dũng cảm đối diện sự cố kỹ thuật bằng giải pháp chuyên nghiệp."
Hội đồng Ban Giám khảo chấm điểm: Đánh giá cao tính trung thực, trao giải "Nhóm có tinh thần Liêm chính Học thuật Số xuất sắc nhất".`,
        consequence: 'Bảo vệ uy tín danh dự của đội thi. Bài thi dù rút gọn nhưng 100% dữ liệu thực, được Hội đồng chuyên môn khen ngợi về đạo đức số và kỹ năng quản lý khủng hoảng.',
        feedback: 'Phương án tối ưu! Thể hiện chuẩn Năng lực số Miền 6.2 & 6.3 (Sử dụng AI có trách nhiệm và Đạo đức học thuật theo Thông tư 02/2025). Khả năng lãnh đạo nhóm và giải quyết khủng hoảng liêm chính số tuyệt vời.'
      },
      C: {
        key: 'C',
        text: 'Tự động sửa lại tên bài báo cho giống thật hơn',
        isOptimal: false,
        statusType: 'DANGER',
        reactionScript: `[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN C]:
Cả nhóm ngồi sửa tên bài báo, ghép tên các giáo sư nổi tiếng vào để đánh lừa phần mềm quét đạo văn.
Tại vòng phản biện trực tiếp, một vị Giám khảo là chuyên gia quốc tế ngạc nhiên: "Bài báo này tôi là đồng tác giả, nhưng tôi chưa bao giờ công bố nội dung như nhóm trích dẫn!"
Cả nhóm sững sờ, không nói nên lời. MC thở dài thất vọng.
Hội đồng lập tức đình chỉ thi vì hành vi giả mạo công trình nghiên cứu của nhà khoa học.`,
        consequence: 'Hành vi cố tình làm giả trích dẫn chuyển từ sơ suất kỹ thuật thành "gian lận học thuật có tổ chức", hậu quả pháp lý và kỷ luật nặng nề hơn gấp nhiều lần.',
        feedback: 'Sai lầm tai hại: Cố tình che giấu lỗi bằng sự dối trá. Trong kỷ nguyên số, mọi dấu vết (Digital Footprint) và mã định danh DOI đều có thể tra cứu tức thì chỉ sau một click chuột.'
      },
      D: {
        key: 'D',
        text: 'Rút lui khỏi cuộc thi và từ mặt thành viên nhóm',
        isOptimal: false,
        statusType: 'WARNING',
        reactionScript: `[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN D]:
Nhóm trưởng tức giận đập bàn: "Tớ không thi nữa! Tớ không thể làm việc với người vô trách nhiệm như cậu!" và tự ý gửi đơn xin rút lui lên Ban Tổ chức.
Cả nhóm tan rã trong bầu không khí u ám, nhiều tháng công sức chuẩn bị đổ sông đổ biển.
Thành viên nhóm buồn bã: "Giá như nhóm trưởng hướng dẫn tớ cách kiểm chứng nguồn thay vì bỏ rơi tập thể như vậy..."`,
        consequence: 'Đội thi bị loại oan uổng dù đã đi đến vòng bán kết. Mâu thuẫn cá nhân không được giải quyết, thành viên không rút ra được bài học sư phạm về sử dụng GenAI.',
        feedback: 'Kỹ năng làm việc nhóm và năng lực lãnh đạo số yếu kém. Một thủ lĩnh công nghệ cần có khả năng kiểm soát cảm xúc, nhận diện lỗi hệ thống và dẫn dắt đồng đội sửa sai theo chuẩn mực.'
      }
    },
    subOptimalScript: `[KỊCH BẢN ỨNG BIẾN KHI CHỌN PHƯƠNG ÁN SAI / CHƯA TỐI ƯU]:
MC bước ra sân khấu, nét mặt nghiêm túc: "Quyết định vừa rồi của thí sinh tiềm ẩn nguy cơ rất lớn về liêm chính học thuật số trong kỷ nguyên trí tuệ nhân tạo!"
Màn hình sân khấu hiển thị thông báo từ Hội đồng Thẩm định: [CẢNH BÁO VI PHẠM: PHÁT HIỆN TÀI LIỆU TRÍCH DẪN KHÔNG TỒN TẠI (AI HALLUCINATION)].
MC: "Kính mời PGS. TS. Trần Quốc Bảo - Thành viên Hội đồng Giám khảo phân tích về tính liêm chính số!"
PGS. TS. Trần Quốc Bảo: "Trí tuệ nhân tạo tạo sinh (GenAI) là công cụ trợ lực tuyệt vời, nhưng hiện tượng 'ảo giác' (Hallucination) bịa đặt nguồn là rất phổ biến. Nếu nhóm đồng ý nộp bài bịa (Phương án A) hoặc tự sửa tên cho giống thật (Phương án C), hành vi đó sẽ bị coi là gian lận học thuật nghiêm trọng. Ngược lại, bỏ cuộc và từ mặt đồng đội (Phương án D) thể hiện kỹ năng lãnh đạo kém. Chuẩn Thông tư 02/2025/TT-BGDĐT Miền 6 quy định: Con người là chủ thể chịu trách nhiệm giải trình cuối cùng trước mọi thông tin do AI sinh ra!"
MC: "Cảm ơn Thầy. Một thông điệp đắt giá về đạo đức và trách nhiệm số cho các nhà nghiên cứu trẻ!"`,
    actionChecklist: [
      'Nhận diện hiện tượng AI Hallucination (Ảo giác AI - sinh tài liệu tham khảo giả mạo)',
      'Tuân thủ nguyên tắc liêm chính học thuật và đạo đức AI theo Thông tư 02/2025/TT-BGDĐT Miền 6.2 & 6.3',
      'Kiểm chứng chéo (Fact-checking) mọi thông tin do GenAI sinh ra bằng nguồn cơ sở dữ liệu học thuật chính thống',
      'Minh bạch hóa việc sử dụng AI (Ghi chú rõ công cụ đã sử dụng và phạm vi hỗ trợ trong báo cáo)',
      'Giao tiếp nội bộ quyết đoán, bảo vệ uy tín của nhóm'
    ],
    timeLimitThought: 15,
    timeLimitAction: 60,
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
    branches: {
      A: {
        key: 'A',
        text: 'Ủng hộ việc tấn công mạng đánh sập Fanpage để trả thù',
        isOptimal: false,
        statusType: 'DANGER',
        reactionScript: `[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN A]:
Các bạn sinh viên thuê dịch vụ DDoS và dùng công cụ phá hoại để đánh sập Fanpage.
Ngay chiều hôm đó, Đội An ninh mạng Công an tỉnh phối hợp Nhà trường lập biên bản: "Hành vi sử dụng công cụ tấn công mạng làm gián đoạn hạ tầng thông tin đã vi phạm Điều 8 Luật An ninh mạng."
Những sinh viên tham gia bị xử phạt hành chính 15.000.000đ/người và nhận cảnh cáo toàn trường.
Trong khi đó, kẻ đăng bài vu khống đã nhanh chóng tạo Fanpage mới để tiếp tục bêu rếu!`,
        consequence: 'Từ nạn nhân trở thành người vi phạm pháp luật hình sự/hành chính. Fanpage bị sập không giải quyết được nguồn cơn vụ việc, còn gây thêm rắc rối pháp lý nghiêm trọng.',
        feedback: 'Sai lầm nguy hiểm: Tuyệt đối không được dùng hành vi bất hợp pháp để đáp trả hành vi bất hợp pháp. Mọi hành vi tấn công mạng đều bị nghiêm cấm theo Điều 8 Luật An ninh mạng 2018.'
      },
      B: {
        key: 'B',
        text: 'Bảo bạn gái im lặng khóa Facebook coi như không có chuyện gì xảy ra',
        isOptimal: false,
        statusType: 'WARNING',
        reactionScript: `[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN B]:
Nạn nhân khóa trang cá nhân và trùm chăn khóc một mình.
Tuy nhiên, vì không có tiếng nói đính chính hay sự can thiệp của tổ chức, những kẻ bắt nạt càng hả hê. Tin đồn thất thiệt lan truyền vào tận lớp học, bạn bè xung quanh bắt đầu xì xào né tránh.
Nạn nhân rơi vào trầm cảm nặng, phải bảo lưu kết quả học tập để điều trị tâm lý.`,
        consequence: 'Vấn nạn bạo lực mạng tiếp tục leo thang không có điểm dừng. Nạn nhân bị cô lập hoàn toàn và chịu tổn thương tâm lý lâu dài.',
        feedback: 'Im lặng trong trường hợp này là sự thoái lui tiêu cực, vi phạm chuẩn an sinh số (Digital Wellbeing). Nạn nhân của Cyberbullying cần được hỗ trợ kịp thời để lên tiếng và tìm kiếm sự bảo vệ pháp lý.'
      },
      C: {
        key: 'C',
        text: 'Hỗ trợ tâm lý, hướng dẫn thu thập vi bằng/ảnh chụp bài viết và bình luận, liên hệ Ban quản trị trường học và cơ quan an ninh mạng yêu cầu gỡ bỏ, xử phạt theo Nghị định 14/2022/NĐ-CP',
        isOptimal: true,
        statusType: 'SUCCESS',
        reactionScript: `[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN C]:
Thí sinh (Cán bộ Đoàn): "Bạn yên tâm, bạn không đơn độc! Hãy ngồi xuống uống nước, chúng mình cùng nhau giải quyết."
Thí sinh phân công: Một bạn liên hệ Phòng Tư vấn Tâm lý học đường hỗ trợ nạn nhân; một bạn phụ trách chụp màn hình toàn bộ bài viết, các bình luận xúc phạm, lưu lại URL và đến Văn phòng Thừa phát lại lập Vi bằng điện tử.
Đoàn trường cùng Nhà trường gửi công văn đề nghị cơ quan Công an can thiệp.
Chỉ 24h sau, bài viết bị gỡ bỏ bắt buộc. Kẻ ẩn danh đăng bài bị cơ quan chức năng triệu tập, xử phạt 7.500.000đ theo Điều 101 Nghị định 15/2020/NĐ-CP và phải công khai xin lỗi nạn nhân.`,
        consequence: 'Vấn đề được giải quyết triệt để, đúng pháp luật. Nạn nhân được bảo vệ danh dự và phục hồi tâm lý. Kẻ bắt nạt bị trừng phạt đích đáng, tạo tính răn đe cao trong toàn trường.',
        feedback: 'Phương án chuẩn mực cao nhất! Vừa thể hiện sự thấu cảm, an sinh sức khỏe số (Miền 4.3 TT 02/2025), vừa thể hiện trình độ văn hóa pháp lý số sắc sảo: Thu thập chứng cứ hợp pháp (Vi bằng) và dựa vào cơ quan thực thi pháp luật.'
      },
      D: {
        key: 'D',
        text: 'Vào tranh cãi tay đôi dưới phần bình luận của bài viết',
        isOptimal: false,
        statusType: 'WARNING',
        reactionScript: `[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN D]:
Thí sinh cùng bạn bè vào phần bình luận đôi co, cãi vã với các tài khoản ẩn danh suốt đêm.
Thuật toán mạng xã hội nhận diện bài viết có lượng tương tác (Engagement) bùng nổ, càng đẩy bài viết lên xu hướng (Trending).
Từ 2.000 lượt xem ban đầu, bài viết tăng vọt lên 50.000 lượt tiếp cận! Tranh cãi biến thành những cuộc công kích cá nhân hỗn loạn, không ai còn quan tâm sự thật là gì.`,
        consequence: 'Vô tình giúp kẻ xấu lan truyền tin giả đi xa hơn do tiếp tay cho thuật toán tương tác của mạng xã hội (Engagement Bait), làm khủng hoảng truyền thông bùng phát không thể kiểm soát.',
        feedback: 'Thiếu hiểu biết về thuật toán phân phối nội dung số và tâm lý đám đông mạng. Tranh cãi với "Troll mạng" là sai lầm kinh điển, chỉ làm tăng mức độ hiển thị của nội dung độc hại.'
      }
    },
    subOptimalScript: `[KỊCH BẢN ỨNG BIẾN KHI CHỌN PHƯƠNG ÁN SAI / CHƯA TỐI ƯU]:
MC bước ra cạnh thí sinh: "Tình huống bắt nạt qua mạng vừa rồi vô cùng phức tạp và nhạy cảm. Lựa chọn của thí sinh đã để lại những hệ quả đáng tiếc!"
Màn hình sân khấu mô phỏng mạng xã hội: [TRANH CÃI BÙNG PHÁT - NẠN NHÂN TỔN THƯƠNG TÂM LÝ - HẠ TẦNG MẠNG BỊ TẤN CÔNG BẤT HỢP PHÁP].
MC: "Xin kính mời ThS. Nguyễn Thu Trang - Chuyên gia An sinh số & Pháp lý học đường phân tích!"
ThS. Nguyễn Thu Trang: "Khi đối diện Cyberbullying, hai phản ứng sai lầm phổ biến nhất là: (1) Dùng bạo lực đáp trả bạo lực như thuê DDoS đánh sập trang (Phương án A) - hành vi này vi phạm Điều 8 Luật An ninh mạng; (2) Im lặng né tránh (Phương án B) hoặc sa đà cãi tay đôi (Phương án D) - chỉ làm tổn thương thêm nạn nhân và tiếp tay cho thuật toán lan truyền tin độc. Giải pháp chuẩn mực duy nhất là: Trấn an tâm lý nạn nhân, thu thập Vi bằng điện tử hợp pháp và phối hợp Nhà trường, cơ quan công an xử lý theo Nghị định 14/2022/NĐ-CP."
MC: "Cảm ơn Chuyên gia. Văn hóa ứng xử số và sự bảo vệ pháp lý chính là lá chắn vững chắc nhất trước nạn bạo lực mạng."`,
    actionChecklist: [
      'Ưu tiên sơ cứu tâm lý, đảm bảo nạn nhân không bị cô lập hay có hành vi tự hại',
      'Hướng dẫn lập vi bằng điện tử, lưu ảnh chụp màn hình, đường link bài viết và các bình luận quấy rối',
      'Ngăn chặn hành vi trả đũa bằng bạo lực hoặc tấn công mạng trái pháp luật',
      'Báo cáo bài viết vi phạm tiêu chuẩn cộng đồng nền tảng và báo cáo Nhà trường can thiệp',
      'Yêu cầu cơ quan chức năng xử lý đối tượng phát tán thông tin vu khống theo Điều 16 Luật An ninh mạng và Nghị định 14/2022/NĐ-CP'
    ],
    timeLimitThought: 15,
    timeLimitAction: 45,
    legalBasis: 'Khoản 2 Điều 2 & Miền 4.3 Thông tư 02/2025/TT-BGDĐT; Điều 8, 16 Luật An ninh mạng 2018; Điểm a Khoản 1 Điều 101 Nghị định 15/2020/NĐ-CP (sửa đổi bởi NĐ 14/2022/NĐ-CP).',
    status: 'APPROVED',
    author: 'PGS. TS. Trần Quốc Bảo',
    createdAt: Date.now() - 86400000 * 2
  }
];
