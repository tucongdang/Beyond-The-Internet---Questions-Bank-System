import { DigitalCompetencyDomainKey, CognitiveLevel, CompetitionStage, LegalDocument, AppUser, QuestionRoundFormat, RoundType } from '../types';

export interface CompetencySubItem {
  code: string;
  name: string;
  description: string;
}

export interface CompetencyDomainInfo {
  key: DigitalCompetencyDomainKey;
  code: string;
  name: string;
  description: string;
  color: string;
  borderColor: string;
  bgLight: string;
  subCompetencies: CompetencySubItem[];
}

export const DIGITAL_COMPETENCY_DOMAINS: Record<DigitalCompetencyDomainKey, CompetencyDomainInfo> = {
  MIEN_1: {
    key: 'MIEN_1',
    code: 'Miền I',
    name: 'Khai thác dữ liệu và thông tin',
    description: 'Xác định nhu cầu thông tin, tìm kiếm, lọc, đánh giá tính xác thực và quản lý dữ liệu, thông tin và nội dung số.',
    color: '#38bdf8', // sky-400
    borderColor: 'rgba(56, 189, 248, 0.3)',
    bgLight: 'rgba(56, 189, 248, 0.1)',
    subCompetencies: [
      { code: '1.1', name: 'Duyệt, tìm kiếm và lọc dữ liệu, thông tin và nội dung số', description: 'Xác định nhu cầu thông tin; tìm kiếm và lọc thông tin trong môi trường số; xây dựng chiến lược tìm kiếm.' },
      { code: '1.2', name: 'Đánh giá dữ liệu, thông tin và nội dung số', description: 'Phân tích, so sánh và đánh giá độ tin cậy, tính xác thực của các nguồn dữ liệu, tin giả và nội dung số.' },
      { code: '1.3', name: 'Quản lý dữ liệu, thông tin và nội dung số', description: 'Tổ chức, lưu trữ, sắp xếp và truy xuất dữ liệu trong các môi trường số có cấu trúc.' }
    ]
  },
  MIEN_2: {
    key: 'MIEN_2',
    code: 'Miền II',
    name: 'Giao tiếp và hợp tác trong môi trường số',
    description: 'Tương tác, chia sẻ thông tin, làm việc nhóm, thực hiện trách nhiệm công dân số, quy tắc ứng xử mạng (Netiquette) và quản lý danh tính số.',
    color: '#a855f7', // purple-500
    borderColor: 'rgba(168, 85, 247, 0.3)',
    bgLight: 'rgba(168, 85, 247, 0.1)',
    subCompetencies: [
      { code: '2.1', name: 'Tương tác thông qua công nghệ số', description: 'Lựa chọn và sử dụng phương tiện giao tiếp số phù hợp với bối cảnh cụ thể.' },
      { code: '2.2', name: 'Chia sẻ thông tin và nội dung qua công nghệ số', description: 'Chia sẻ dữ liệu có trích dẫn nguồn, đóng vai trò trung gian thông tin đáng tin cậy.' },
      { code: '2.3', name: 'Sử dụng công nghệ số thực hiện trách nhiệm công dân', description: 'Tham gia đóng góp xã hội qua dịch vụ công trực tuyến, cổng thông tin chính phủ số.' },
      { code: '2.4', name: 'Hợp tác thông qua công nghệ số', description: 'Sử dụng công cụ cộng tác, đồng sáng tạo dữ liệu và tài nguyên tri thức.' },
      { code: '2.5', name: 'Thực hiện quy tắc ứng xử trên mạng (Netiquette)', description: 'Ứng xử văn minh, nhận diện chuẩn mực hành vi, tôn trọng sự đa dạng văn hóa.' },
      { code: '2.6', name: 'Quản lý danh tính số', description: 'Tạo lập, bảo vệ danh tính số và bảo vệ uy tín trực tuyến của bản thân.' }
    ]
  },
  MIEN_3: {
    key: 'MIEN_3',
    code: 'Miền III',
    name: 'Sáng tạo nội dung số',
    description: 'Tạo lập, chỉnh sửa và chia sẻ nội dung số; tích hợp tri thức số; thực thi bản quyền & giấy phép số; lập trình cơ bản.',
    color: '#ec4899', // pink-500
    borderColor: 'rgba(236, 72, 153, 0.3)',
    bgLight: 'rgba(236, 72, 153, 0.1)',
    subCompetencies: [
      { code: '3.1', name: 'Phát triển nội dung số', description: 'Tạo và chỉnh sửa nội dung đa phương tiện ở các định dạng khác nhau.' },
      { code: '3.2', name: 'Tích hợp và tạo lập lại nội dung số', description: 'Sửa đổi, cải tiến và kết hợp các khối kiến thức sẵn có để sáng tạo nội dung mới độc đáo.' },
      { code: '3.3', name: 'Thực thi bản quyền và giấy phép', description: 'Hiểu và áp dụng bản quyền (Copyright, Creative Commons), sở hữu trí tuệ số.' },
      { code: '3.4', name: 'Lập trình', description: 'Lập kế hoạch và phát triển các chuỗi câu lệnh thuật toán giải quyết vấn đề bằng máy tính.' }
    ]
  },
  MIEN_4: {
    key: 'MIEN_4',
    code: 'Miền IV',
    name: 'An toàn',
    description: 'Bảo vệ thiết bị số, bảo mật dữ liệu cá nhân & quyền riêng tư, an sinh & sức khỏe tâm lý trên mạng (chống bắt nạt mạng, lừa đảo), bảo vệ môi trường.',
    color: '#ef4444', // red-500
    borderColor: 'rgba(239, 68, 68, 0.3)',
    bgLight: 'rgba(239, 68, 68, 0.1)',
    subCompetencies: [
      { code: '4.1', name: 'Bảo vệ thiết bị', description: 'Bảo vệ thiết bị phần cứng, hệ điều hành, chống mã độc, ransomware, phần mềm độc hại.' },
      { code: '4.2', name: 'Bảo vệ dữ liệu cá nhân và quyền riêng tư', description: 'Tuân thủ NĐ 13/2023/NĐ-CP, chính sách quyền riêng tư, bảo vệ OTP, thông tin nhạy cảm.' },
      { code: '4.3', name: 'Bảo vệ sức khỏe và an sinh số', description: 'Phòng tránh bắt nạt mạng (Cyberbullying), nghiện mạng xã hội, giữ cân bằng thể chất và tinh thần.' },
      { code: '4.4', name: 'Bảo vệ môi trường', description: 'Nhận thức tác động carbon của công nghệ số, giảm thiểu rác thải điện tử.' }
    ]
  },
  MIEN_5: {
    key: 'MIEN_5',
    code: 'Miền V',
    name: 'Giải quyết vấn đề',
    description: 'Khắc phục sự cố kỹ thuật số, lựa chọn giải pháp công nghệ khả thi, tư duy sáng tạo đổi mới và xác định lỗ hổng năng lực số cần bồi dưỡng.',
    color: '#f59e0b', // amber-500
    borderColor: 'rgba(245, 158, 11, 0.3)',
    bgLight: 'rgba(245, 158, 11, 0.1)',
    subCompetencies: [
      { code: '5.1', name: 'Giải quyết các vấn đề kỹ thuật', description: 'Xử lý sự cố phần cứng, phần mềm, kết nối mạng và vận hành hệ thống.' },
      { code: '5.2', name: 'Xác định nhu cầu và giải pháp công nghệ', description: 'Đánh giá nhu cầu người dùng và lựa chọn công cụ số tối ưu để giải quyết.' },
      { code: '5.3', name: 'Sử dụng sáng tạo công nghệ số', description: 'Ứng dụng linh hoạt công nghệ để đổi mới quy trình làm việc, sản phẩm số.' },
      { code: '5.4', name: 'Xác định các vấn đề cần cải thiện về năng lực số', description: 'Tự đánh giá khoảng trống năng lực số và tìm kiếm cơ hội bồi dưỡng.' }
    ]
  },
  MIEN_6: {
    key: 'MIEN_6',
    code: 'Miền VI',
    name: 'Ứng dụng trí tuệ nhân tạo (AI)',
    description: 'Hiểu biết bản chất và giới hạn AI/GenAI, sử dụng AI có trách nhiệm và đạo đức, đánh giá độ tin cậy và thiên kiến (Bias) của mô hình AI.',
    color: '#10b981', // emerald-500
    borderColor: 'rgba(16, 185, 129, 0.3)',
    bgLight: 'rgba(16, 185, 129, 0.1)',
    subCompetencies: [
      { code: '6.1', name: 'Hiểu biết về AI (bao gồm Gen AI)', description: 'Nắm vững nguyên tắc hoạt động của AI/GenAI, khả năng sinh dữ liệu, ảo giác AI (Hallucination) và giới hạn.' },
      { code: '6.2', name: 'Sử dụng AI có đạo đức và trách nhiệm', description: 'Áp dụng AI vào học tập và công việc tuân thủ liêm chính học thuật, đạo đức, bảo mật dữ liệu.' },
      { code: '6.3', name: 'Đánh giá các công cụ AI', description: 'Kiểm tra độ chính xác, thiên kiến (Bias), tính minh bạch và an toàn của hệ thống AI.' }
    ]
  }
};

export interface CognitiveLevelInfo {
  level: CognitiveLevel;
  name: string;
  levelsRange: string;
  description: string;
  verbs: string;
  color: string;
  bgBadge: string;
  borderBadge: string;
}

export const COGNITIVE_LEVELS: Record<CognitiveLevel, CognitiveLevelInfo> = {
  NHAN_BIET: {
    level: 'NHAN_BIET',
    name: 'Nhận biết',
    levelsRange: 'Bậc 1 - 2 (Cơ bản)',
    description: 'Nhớ lại hoặc nhận ra thông tin, thuật ngữ, định nghĩa, thao tác đơn giản khi có hướng dẫn.',
    verbs: 'Liệt kê, nhận diện, chỉ ra, nhắc lại, phân biệt cơ bản',
    color: '#60a5fa', // blue-400
    bgBadge: 'bg-blue-500/15 text-blue-300',
    borderBadge: 'border-blue-500/30'
  },
  THONG_HIEU: {
    level: 'THONG_HIEU',
    name: 'Thông hiểu',
    levelsRange: 'Bậc 3 - 4 (Trung cấp)',
    description: 'Hiểu ý nghĩa, giải thích được quy trình, so sánh và mô tả các mối liên hệ độc lập.',
    verbs: 'Giải thích, mô tả, phân loại, minh họa, so sánh',
    color: '#34d399', // emerald-400
    bgBadge: 'bg-emerald-500/15 text-emerald-300',
    borderBadge: 'border-emerald-500/30'
  },
  VAN_DUNG: {
    level: 'VAN_DUNG',
    name: 'Vận dụng',
    levelsRange: 'Bậc 5 - 6 (Nâng cao)',
    description: 'Áp dụng kiến thức, kỹ năng để giải quyết vấn đề mới trong các tình huống thực tiễn cụ thể.',
    verbs: 'Áp dụng, thực thi, xử lý sự cố, hướng dẫn, điều chỉnh',
    color: '#fbbf24', // amber-400
    bgBadge: 'bg-amber-500/15 text-amber-300',
    borderBadge: 'border-amber-500/30'
  },
  VAN_DUNG_CAO: {
    level: 'VAN_DUNG_CAO',
    name: 'Vận dụng cao',
    levelsRange: 'Bậc 7 - 8 (Chuyên sâu)',
    description: 'Phân tích sâu, phản biện, đánh giá rủi ro phức tạp, kiến tạo giải pháp hoặc kịch bản mới.',
    verbs: 'Đánh giá, phản biện, thiết kế giải pháp, kiến tạo, thẩm định',
    color: '#f87171', // rose-400
    bgBadge: 'bg-rose-500/15 text-rose-300',
    borderBadge: 'border-rose-500/30'
  }
};

export interface StageInfo {
  stage: CompetitionStage;
  name: string;
  subTitle: string;
  formatDescription: string;
  standard: string;
  color: string;
  icon: string;
}

export const COMPETITION_STAGES: Record<CompetitionStage, StageInfo> = {
  VONG_LOAI: {
    stage: 'VONG_LOAI',
    name: 'Vòng Loại Trực Tuyến',
    subTitle: 'Đề thi 28 câu chuẩn hóa duy nhất (24 câu Phần I & 4 câu Phần II)',
    formatDescription: 'Vòng loại chỉ có 1 dạng đề gồm 28 câu: 24 câu Phần I (Trắc nghiệm 4 lựa chọn ABCD) và 4 câu Phần II (Đúng/Sai 4 ý a, b, c, d). Không chọn/chia các vòng thi như Bán kết và Chung kết.',
    standard: 'Quy chuẩn Đề thi Vòng loại 28 câu BTI 2026',
    color: '#38bdf8',
    icon: 'FileText'
  },
  BAN_KET_1: {
    stage: 'BAN_KET_1',
    name: 'Vòng Bán Kết 1',
    subTitle: 'Đấu trường Gameshow Học thuật BTI 2026',
    formatDescription: '5 phần thi: Khởi động (Riêng 12 câu / Chung 3 lượt), Vượt CNV (4 hàng ngang + Ô trung tâm + Mạo hiểm), Tăng tốc (4 câu 20-30s), Về đích (Gói 20/30/40), Câu hỏi phụ.',
    standard: 'Luật thi Beyond The Internet 2026',
    color: '#a855f7',
    icon: 'Flame'
  },
  BAN_KET_2: {
    stage: 'BAN_KET_2',
    name: 'Vòng Bán Kết 2',
    subTitle: 'Đấu trường Gameshow Học thuật BTI 2026',
    formatDescription: '5 phần thi: Khởi động, Vượt CNV, Tăng tốc (Spot the Flaw, Quick Process Sequencing), Về đích, Câu hỏi phụ.',
    standard: 'Luật thi Beyond The Internet 2026',
    color: '#ec4899',
    icon: 'Zap'
  },
  BAN_KET_3: {
    stage: 'BAN_KET_3',
    name: 'Vòng Bán Kết 3',
    subTitle: 'Đấu trường Gameshow Học thuật BTI 2026',
    formatDescription: '5 phần thi: Khởi động, Vượt CNV, Tăng tốc loại trừ 6 đáp án, Về đích giải quyết tình huống, Câu hỏi phụ.',
    standard: 'Luật thi Beyond The Internet 2026',
    color: '#f59e0b',
    icon: 'Sparkles'
  },
  CHUNG_KET: {
    stage: 'CHUNG_KET',
    name: 'Đêm Chung Kết Toàn Quốc',
    subTitle: 'Đỉnh cao Tranh tài BTI 2026 & Kịch tương tác',
    formatDescription: 'Toàn bộ format gameshow phân hóa cao, tích hợp Kịch bản Kịch tương tác sân khấu, Tình huống thực hành 20/30/40 điểm (30s-90s) và Lượt về đích phân định hòa 100 điểm.',
    standard: 'Chung kết BTI 2026 Grand Final',
    color: '#ef4444',
    icon: 'Trophy'
  }
};

export const PRESEEDED_LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: 'DOC_TT02_2025',
    title: 'Thông tư số 02/2025/TT-BGDĐT - Quy định Khung năng lực số cho người học',
    documentNumber: '02/2025/TT-BGDĐT',
    issuedDate: '24/01/2025',
    issuingAuthority: 'Bộ Giáo dục và Đào tạo',
    domain: 'Khung năng lực số quốc gia',
    summary: 'Quy định Khung năng lực số cho người học gồm 6 miền năng lực với 24 năng lực thành phần, chia thành 4 trình độ (Nhận biết đến Vận dụng cao) theo 8 bậc.',
    keyArticles: [
      { article: 'Điều 2, Khoản 1', content: 'An sinh số: xem xét tác động của công nghệ và dịch vụ số đối với sức khỏe tinh thần, thể chất và cảm xúc.' },
      { article: 'Điều 2, Khoản 2', content: 'Bắt nạt trên mạng: hành vi có chủ đích xấu đe dọa, xâm hại, làm nhục, xúc phạm danh dự qua tin nhắn, mạng internet.' },
      { article: 'Điều 2, Khoản 3', content: 'Danh tính số: tổng hợp thông tin về một người tồn tại ở dạng kỹ thuật số để định danh và phân biệt.' },
      { article: 'Điều 2, Khoản 18-19', content: 'Trí tuệ nhân tạo (AI) và Trí tuệ nhân tạo tạo sinh (Gen AI): tạo ra dữ liệu mới như văn bản, hình ảnh, âm thanh, video.' },
      { article: 'Phần B - Miền IV', content: 'An toàn: bảo vệ thiết bị, dữ liệu cá nhân, quyền riêng tư, sức khỏe số và môi trường số.' },
      { article: 'Phần B - Miền VI', content: 'Ứng dụng AI: hiểu biết, sử dụng AI có đạo đức và trách nhiệm, đánh giá công cụ AI khách quan, chống thiên kiến.' }
    ],
    fullText: 'Thông tư số 02/2025/TT-BGDĐT ngày 24 tháng 01 năm 2025 của Bộ Giáo dục và Đào tạo quy định Khung năng lực số cho người học. Bao gồm 6 miền: I. Khai thác dữ liệu và thông tin; II. Giao tiếp và hợp tác trong môi trường số; III. Sáng tạo nội dung số; IV. An toàn; V. Giải quyết vấn đề; VI. Ứng dụng trí tuệ nhân tạo.',
    uploadedAt: Date.now() - 86400000 * 30,
    uploadedBy: 'Ban Tổ Chức BTI'
  },
  {
    id: 'DOC_ND13_2023',
    title: 'Nghị định số 13/2023/NĐ-CP - Bảo vệ dữ liệu cá nhân',
    documentNumber: '13/2023/NĐ-CP',
    issuedDate: '17/04/2023',
    issuingAuthority: 'Chính phủ',
    domain: 'Bảo vệ dữ liệu cá nhân & An ninh mạng',
    summary: 'Quy định về bảo vệ dữ liệu cá nhân, quyền và nghĩa vụ của chủ thể dữ liệu, biện pháp bảo vệ dữ liệu cơ bản và dữ liệu nhạy cảm.',
    keyArticles: [
      { article: 'Điều 3', content: 'Nguyên tắc bảo vệ dữ liệu cá nhân: hợp pháp, minh bạch, đúng mục đích, bảo mật và toàn vẹn.' },
      { article: 'Điều 9', content: 'Quyền của chủ thể dữ liệu: quyền được biết, đồng ý, truy cập, rút lại sự đồng ý, xóa dữ liệu, khiếu nại, bồi thường thiệt hại.' },
      { article: 'Điều 13', content: 'Bảo vệ dữ liệu cá nhân cơ bản: họ tên, ngày sinh, số điện thoại, CCCD, nơi ở, địa chỉ email, hình ảnh cá nhân.' },
      { article: 'Điều 14', content: 'Dữ liệu cá nhân nhạy cảm: dữ liệu sinh trắc học, tài khoản ngân hàng, thông tin sức khỏe, tình trạng tài chính.' }
    ],
    uploadedAt: Date.now() - 86400000 * 20,
    uploadedBy: 'Ban Tổ Chức BTI'
  },
  {
    id: 'DOC_LUAT_ANM_2018',
    title: 'Luật An ninh mạng số 24/2018/QH14',
    documentNumber: '24/2018/QH14',
    issuedDate: '12/06/2018',
    issuingAuthority: 'Quốc hội',
    domain: 'An ninh mạng & Phòng chống tội phạm công nghệ cao',
    summary: 'Quy định về hoạt động bảo vệ an ninh quốc gia và bảo đảm trật tự, an toàn xã hội trên không gian mạng.',
    keyArticles: [
      { article: 'Điều 8', content: 'Các hành vi bị nghiêm cấm trên không gian mạng: tuyên truyền chống phá, kích động, lừa đảo, tấn công mạng, phát tán mã độc.' },
      { article: 'Điều 16', content: 'Phòng ngừa, xử lý thông tin trên không gian mạng có nội dung vi phạm pháp luật: tin giả, xuyên tạc, vu khống.' },
      { article: 'Điều 26', content: 'Bảo đảm an toàn thông tin trên không gian mạng đối với doanh nghiệp cung cấp dịch vụ mạng.' }
    ],
    uploadedAt: Date.now() - 86400000 * 15,
    uploadedBy: 'Ban Tổ Chức BTI'
  },
  {
    id: 'DOC_LUAT_GDDT_2023',
    title: 'Luật Giao dịch điện tử số 20/2023/QH15',
    documentNumber: '20/2023/QH15',
    issuedDate: '22/06/2023',
    issuingAuthority: 'Quốc hội',
    domain: 'Chữ ký số & Hợp đồng điện tử',
    summary: 'Quy định về thông điệp dữ liệu, chữ ký điện tử, dịch vụ tin cậy, hợp đồng điện tử và giao dịch điện tử của cơ quan nhà nước.',
    keyArticles: [
      { article: 'Điều 22', content: 'Chữ ký điện tử chuyên dùng và chữ ký số: giá trị pháp lý tương đương chữ ký tay của cá nhân.' },
      { article: 'Điều 34', content: 'Giá trị pháp lý của hợp đồng điện tử không bị phủ nhận chỉ vì được thể hiện dưới dạng thông điệp dữ liệu.' }
    ],
    uploadedAt: Date.now() - 86400000 * 10,
    uploadedBy: 'Ban Tổ Chức BTI'
  }
];

export const INITIAL_APP_USERS: AppUser[] = [
  {
    id: 'usr_admin',
    name: 'TS. Hoàng Minh Sơn',
    email: 'admin.bti2026@edu.vn',
    role: 'SUPER_ADMIN',
    title: 'Tổng Trưởng Ban Chỉ Đạo',
    organization: 'Ban Tổ Chức BTI 2026',
    status: 'APPROVED',
    lastActive: Date.now()
  },
  {
    id: 'usr_editor',
    name: 'ThS. Nguyễn Thu Trang',
    email: 'trang.nt@bti2026.org',
    role: 'HEAD_EDITOR',
    title: 'Trưởng Ban Đề Thi & Thẩm Định',
    organization: 'Viện Công Nghệ Giáo Dục Số',
    status: 'APPROVED',
    lastActive: Date.now() - 1000 * 60 * 15
  },
  {
    id: 'usr_examiner',
    name: 'PGS. TS. Trần Quốc Bảo',
    email: 'bao.tq@univ.edu.vn',
    role: 'EXAMINER',
    title: 'Chủ Tịch Hội Đồng Giám Khảo',
    organization: 'Hội Đồng Khảo Thí Quốc Gia',
    status: 'APPROVED',
    lastActive: Date.now() - 1000 * 60 * 45
  },
  {
    id: 'usr_contributor',
    name: 'ThS. Đặng Minh Tuấn',
    email: 'dangtu2006@gmail.com',
    role: 'CONTRIBUTOR',
    title: 'Chuyên Viên Biên Soạn Câu Hỏi',
    organization: 'Tổ Ra Đề Môn Năng Lực Số',
    status: 'APPROVED',
    lastActive: Date.now() - 1000 * 60 * 5
  }
];

export type BtiRoundGroupKey = 'VONG_LOAI' | 'KHOI_DONG' | 'VCNV' | 'TANG_TOC' | 'VE_DICH' | 'PHU';

export interface BtiRoundGroupInfo {
  key: BtiRoundGroupKey;
  name: string;
  shortName: string;
  badge: string;
  color: string;
  icon: string;
  description: string;
  order: number;
}

export const BTI_ROUND_GROUPS: Record<BtiRoundGroupKey, BtiRoundGroupInfo> = {
  VONG_LOAI: {
    key: 'VONG_LOAI',
    name: 'Vòng Loại (Đề thi 28 câu: 24 câu Phần I & 4 câu Phần II)',
    shortName: 'Đề Vòng Loại (28 câu)',
    badge: 'Đề 28 câu',
    color: '#0284c7',
    icon: 'Layers',
    description: 'Đề thi chuẩn hóa duy nhất gồm 28 câu (24 câu Phần I trắc nghiệm ABCD & 4 câu Phần II Đúng/Sai 4 ý). Không chia vòng thi như Bán kết/Chung kết.',
    order: 1
  },
  KHOI_DONG: {
    key: 'KHOI_DONG',
    name: 'Vòng 1: Khởi Động',
    shortName: 'Vòng 1: Khởi Động',
    badge: 'Vòng 1',
    color: '#3b82f6',
    icon: 'Users',
    description: '7 dạng câu hỏi: Tất cả là câu trả lời ngắn (Trừ dạng trắc nghiệm ABCD)',
    order: 2
  },
  VCNV: {
    key: 'VCNV',
    name: 'Vòng 2: Vượt Chướng Ngại Vật',
    shortName: 'Vòng 2: VCNV',
    badge: 'Vòng 2',
    color: '#f59e0b',
    icon: 'Target',
    description: 'Từ khóa CNV chính, Ô mạo hiểm, 4 hàng ngang và Ô trung tâm (Tự động đếm chữ cái)',
    order: 3
  },
  TANG_TOC: {
    key: 'TANG_TOC',
    name: 'Vòng 3: Tăng Tốc (7 Dạng Chuẩn)',
    shortName: 'Vòng 3: Tăng Tốc',
    badge: 'Vòng 3',
    color: '#a855f7',
    icon: 'Zap',
    description: 'Tất cả là câu trả lời ngắn. Tự động sắp xếp và xuất đáp án chuẩn',
    order: 4
  },
  VE_DICH: {
    key: 'VE_DICH',
    name: 'Vòng 4: Về Đích (3 Dạng Chuẩn BTI)',
    shortName: 'Vòng 4: Về Đích',
    badge: 'Vòng 4',
    color: '#10b981',
    icon: 'Trophy',
    description: 'Quy về 3 dạng: Trả lời ngắn, Tình huống 4 ý Đúng/Sai, Câu hỏi AID 4 phương án (Gói 20/30/40đ)',
    order: 5
  },
  PHU: {
    key: 'PHU',
    name: 'Phần 5: Câu Hỏi Phụ (Tie-breaker)',
    shortName: 'Phần 5: Câu Hỏi Phụ',
    badge: 'Phụ',
    color: '#f43f5e',
    icon: 'HelpCircle',
    description: 'Đấu loại trực tiếp 15 giây khi các thí sinh có cùng tổng điểm số',
    order: 6
  }
};

export interface RoundFormatInfo {
  format: QuestionRoundFormat;
  name: string;
  shortName: string;
  roundGroup: BtiRoundGroupKey;
  roundGroupName: string;
  defaultRoundType: RoundType;
  defaultTimeLimit: number;
  defaultPoints: number;
  description: string;
  scoringRule: string;
  ruleSection: string;
  isPrimary?: boolean;
  order?: number;
}

export const QUESTION_ROUND_FORMATS: Record<QuestionRoundFormat, RoundFormatInfo> = {
  // VÒNG LOẠI (Chỉ có 1 dạng đề chuẩn hóa 28 câu: 24 câu Phần I và 4 câu Phần II)
  BGD_MULTIPLE_CHOICE: {
    format: 'BGD_MULTIPLE_CHOICE',
    name: 'Phần I: Trắc nghiệm 4 lựa chọn (24 câu trong đề Vòng Loại)',
    shortName: 'Phần I: 24 câu TN (ABCD)',
    roundGroup: 'VONG_LOAI',
    roundGroupName: 'Vòng Loại (Đề thi 28 câu chuẩn hóa)',
    defaultRoundType: 'MULTIPLE_CHOICE',
    defaultTimeLimit: 30,
    defaultPoints: 1,
    description: '24 câu trắc nghiệm khách quan 4 phương án (A, B, C, D) chọn 1 phương án đúng nhất trong cấu trúc đề thi Vòng Loại 28 câu.',
    scoringRule: '+1 điểm cho mỗi câu trả lời đúng (Tối đa 24 điểm).',
    ruleSection: 'Cấu trúc đề thi Vòng Loại - Phần I (24 câu)',
    isPrimary: true,
    order: 1
  },
  BGD_TRUE_FALSE_4: {
    format: 'BGD_TRUE_FALSE_4',
    name: 'Phần II: Đúng / Sai 4 ý a, b, c, d (4 câu trong đề Vòng Loại)',
    shortName: 'Phần II: 4 câu Đúng/Sai 4 ý',
    roundGroup: 'VONG_LOAI',
    roundGroupName: 'Vòng Loại (Đề thi 28 câu chuẩn hóa)',
    defaultRoundType: 'TRUE_FALSE_4',
    defaultTimeLimit: 60,
    defaultPoints: 4,
    description: '4 câu hỏi tình huống số, mỗi câu có 4 nhận định a, b, c, d (chọn Đúng/Sai) trong cấu trúc đề thi Vòng Loại 28 câu.',
    scoringRule: '1 ý đúng = 0.5đ, 2 ý = 1đ, 3 ý = 2đ, đúng cả 4 ý = 4đ (Tối đa 16 điểm).',
    ruleSection: 'Cấu trúc đề thi Vòng Loại - Phần II (4 câu)',
    isPrimary: true,
    order: 2
  },
  BGD_SHORT_ANSWER: {
    format: 'BGD_SHORT_ANSWER',
    name: 'Phần III: Trả lời ngắn (Không sử dụng trong Vòng Loại BTI 2026)',
    shortName: 'Phần III (Đã loại bỏ khỏi Vòng Loại)',
    roundGroup: 'VONG_LOAI',
    roundGroupName: 'Vòng Loại (Đề thi 28 câu chuẩn hóa)',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 45,
    defaultPoints: 2,
    description: 'Định dạng cũ không sử dụng trong cấu trúc đề 28 câu của Vòng loại.',
    scoringRule: 'Không áp dụng trong cấu trúc đề 28 câu.',
    ruleSection: 'Đã loại bỏ theo thể lệ BTI 2026',
    isPrimary: false,
    order: 3
  },

  // 1. KHỞI ĐỘNG (7 dạng câu hỏi chuẩn: Cho phép lựa chọn Khởi động riêng hoặc chung)
  // 1. KHỞI ĐỘNG (Luật chơi BTI 2026 - Mục 1)
  KHOI_DONG_RIENG: {
    format: 'KHOI_DONG_RIENG',
    name: '1.1 Khởi động riêng (12 câu / 60 giây, +10đ)',
    shortName: '1.1 Khởi động riêng (60s)',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 5,
    defaultPoints: 10,
    description: 'Lượt riêng: Mỗi thí sinh trả lời 12 câu hỏi trong 60 giây. MC điều khiển ánh sáng sân khấu chọn ngẫu nhiên thí sinh.',
    scoringRule: 'Trả lời đúng: +10 điểm. Trả lời sai: 0 điểm (không bị trừ điểm). Được đổi đáp án liên tục, ghi nhận đáp án cuối cùng trước khi MC công bố.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1.1',
    isPrimary: true,
    order: 1
  },
  KHOI_DONG_CHUNG: {
    format: 'KHOI_DONG_CHUNG',
    name: '1.2 Khởi động chung (Bấm chuông 3 lượt: 10 - 15 - 20 câu)',
    shortName: '1.2 Khởi động chung',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 3,
    defaultPoints: 10,
    description: 'Phần thi chung diễn ra trong 3 lượt (lần lượt 10, 15 và 20 câu; tổng 45 câu). 4 thí sinh bấm chuông nhanh giành quyền trả lời. Suy nghĩ 3 giây.',
    scoringRule: 'Trả lời đúng: +10 điểm. Trả lời sai hoặc bấm chuông không trả lời sau 3 giây: trừ 5 điểm và mất quyền trả lời ở câu tiếp theo. Sau 3 giây nếu không ai bấm chuông câu hỏi bị bỏ qua.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1.2',
    isPrimary: true,
    order: 2
  },
  KD_DIEN_CHO_TRONG: {
    format: 'KD_DIEN_CHO_TRONG',
    name: '1.3.1 Điền vào chỗ trống / Tìm đáp án đúng (Trả lời ngắn)',
    shortName: '1.3.1 Điền chỗ trống',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 5,
    defaultPoints: 10,
    description: 'Câu hỏi yêu cầu tìm đáp án đúng, điền từ ngữ/thuật ngữ số còn thiếu vào chỗ trống.',
    scoringRule: '+10 điểm/câu đúng. Riêng: 0đ nếu sai. Chung: -5đ nếu bấm chuông trả lời sai.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1.3',
    isPrimary: true,
    order: 3
  },
  KD_DUNG_SAI_NEN: {
    format: 'KD_DUNG_SAI_NEN',
    name: '1.3.2 Lựa chọn Đúng/Sai, Nên/Không nên (Trả lời ngắn)',
    shortName: '1.3.2 Đúng/Sai - Nên/Không nên',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 5,
    defaultPoints: 10,
    description: 'Lựa chọn nhanh Đúng/Sai hoặc Nên/Không nên đối với các hành vi an toàn số, văn hóa mạng.',
    scoringRule: '+10 điểm/câu đúng. Riêng: 0đ nếu sai. Chung: -5đ nếu bấm chuông trả lời sai.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1.3',
    isPrimary: true,
    order: 4
  },
  KD_TRAC_NGHIEM_ABCD: {
    format: 'KD_TRAC_NGHIEM_ABCD',
    name: '1.3.3 Chọn đáp án có sẵn ABCD / 123 (Trắc nghiệm)',
    shortName: '1.3.3 Chọn đáp án có sẵn',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'MULTIPLE_CHOICE',
    defaultTimeLimit: 5,
    defaultPoints: 10,
    description: 'Câu hỏi lựa chọn các phương án có sẵn (ABCD hoặc 123) phản xạ nhanh trong phần thi Khởi động.',
    scoringRule: '+10 điểm/câu đúng. Riêng: 0đ nếu sai. Chung: -5đ nếu bấm chuông trả lời sai.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1.3',
    isPrimary: true,
    order: 5
  },
  KD_HINH_ANH_AM_THANH: {
    format: 'KD_HINH_ANH_AM_THANH',
    name: '1.3.4 Hình ảnh hoặc đoạn nhạc gợi ý (Trả lời ngắn)',
    shortName: '1.3.4 Hình ảnh / Đoạn nhạc',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 5,
    defaultPoints: 10,
    description: 'Câu hỏi có kèm hình ảnh trực quan hoặc đoạn âm thanh/nhạc gợi ý dạng trả lời ngắn.',
    scoringRule: '+10 điểm/câu đúng. Riêng: 0đ nếu sai. Chung: -5đ nếu bấm chuông trả lời sai.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1.3',
    isPrimary: true,
    order: 6
  },
  KD_TINH_HUONG_NGAN: {
    format: 'KD_TINH_HUONG_NGAN',
    name: '1.3.5 Tình huống ngắn phản xạ (Trả lời ngắn)',
    shortName: '1.3.5 Tình huống ngắn',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 5,
    defaultPoints: 10,
    description: 'Tình huống số ngắn gọn phản xạ nhanh về bảo mật cá nhân, phòng tránh lừa đảo trực tuyến.',
    scoringRule: '+10 điểm/câu đúng. Riêng: 0đ nếu sai. Chung: -5đ nếu bấm chuông trả lời sai.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1.3',
    isPrimary: true,
    order: 7
  },
  KD_PHAN_TICH_SO_SANH: {
    format: 'KD_PHAN_TICH_SO_SANH',
    name: '1.3.6 Phân tích, so sánh nhanh (Trả lời ngắn)',
    shortName: '1.3.6 Phân tích so sánh',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 5,
    defaultPoints: 10,
    description: 'Phân tích, so sánh nhanh hai giao thức, hai công nghệ số hoặc hai phương thức tấn công mạng.',
    scoringRule: '+10 điểm/câu đúng. Riêng: 0đ nếu sai. Chung: -5đ nếu bấm chuông trả lời sai.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1.3',
    isPrimary: true,
    order: 8
  },
  KD_SPOT_THE_FLAW: {
    format: 'KD_SPOT_THE_FLAW',
    name: '1.3.7 Tìm Lỗ Hổng / Phát Hiện Bất Thường - Spot the Flaw (Trả lời ngắn)',
    shortName: '1.3.7 Spot the Flaw',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 5,
    defaultPoints: 10,
    description: 'Quan sát và phát hiện ngay điểm bất thường, lỗ hổng bảo mật hoặc dấu hiệu giả mạo/deepfake.',
    scoringRule: '+10 điểm/câu đúng. Riêng: 0đ nếu sai. Chung: -5đ nếu bấm chuông trả lời sai.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1.3',
    isPrimary: true,
    order: 9
  },
  KD_QUICK_PROCESS: {
    format: 'KD_QUICK_PROCESS',
    name: '1.3.8 Sắp xếp quy trình nhanh - Quick Process Sequencing (Trả lời ngắn)',
    shortName: '1.3.8 Sắp xếp quy trình',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 5,
    defaultPoints: 10,
    description: 'Sắp xếp nhanh quy trình các bước thao tác kỹ thuật số cơ bản.',
    scoringRule: '+10 điểm/câu đúng. Riêng: 0đ nếu sai. Chung: -5đ nếu bấm chuông trả lời sai.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1.3',
    isPrimary: true,
    order: 10
  },

  // 2. VƯỢT CHƯỚNG NGẠI VẬT (Luật chơi BTI 2026 - Mục 2)
  VCNV_HANG_NGANG: {
    format: 'VCNV_HANG_NGANG',
    name: '2.1 Hàng ngang gợi ý (4 từ hàng ngang, 15s, +10đ / +15đ)',
    shortName: '2.1 Hàng ngang (15s)',
    roundGroup: 'VCNV',
    roundGroupName: 'Vòng 2: Vượt Chướng Ngại Vật',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 15,
    defaultPoints: 10,
    description: 'Có 4 từ hàng ngang tương ứng 4 miếng ghép ở 4 góc của hình ảnh gợi ý. Mỗi thí sinh có tối đa 1 lượt chọn hàng ngang (bắt đầu từ thí sinh vị trí 1). Trả lời bằng máy tính trong 15 giây.',
    scoringRule: 'Trả lời đúng: 10 điểm; nếu là thí sinh lựa chọn từ hàng ngang đó thì được 15 điểm. Trả lời đúng sẽ mở miếng ghép góc tương ứng. Yêu cầu đúng chính tả.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 2.1',
    isPrimary: true,
    order: 1
  },
  VCNV_TRUNG_TAM: {
    format: 'VCNV_TRUNG_TAM',
    name: '2.2 Ô trung tâm gợi ý (Gợi ý cuối, 15s, +10đ)',
    shortName: '2.2 Ô trung tâm gợi ý',
    roundGroup: 'VCNV',
    roundGroupName: 'Vòng 2: Vượt Chướng Ngại Vật',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 15,
    defaultPoints: 10,
    description: 'Miếng ghép thứ 5 ở ô trung tâm. Mở ra khi cả 4 hàng ngang đã mở mà không có ai đoán CNV (tất cả hàng ngang bị ẩn). Đúng câu hỏi được 10 điểm. Sau đó có 15s suy nghĩ cuối cùng (ảnh bị ẩn) để đoán CNV được 10 điểm.',
    scoringRule: 'Đúng câu hỏi ô trung tâm: +10đ. Đoán đúng CNV sau ô trung tâm: +10đ. Trả lời sai CNV bị loại khỏi phần thi này.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 2.2',
    isPrimary: true,
    order: 2
  },
  VCNV_MAO_HIEM: {
    format: 'VCNV_MAO_HIEM',
    name: '2.3 Ô Mạo Hiểm (Tồn tại 10s, 20s/30s, +120đ / -50% điểm)',
    shortName: '2.3 Ô Mạo Hiểm (120đ)',
    roundGroup: 'VCNV',
    roundGroupName: 'Vòng 2: Vượt Chướng Ngại Vật',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 20,
    defaultPoints: 120,
    description: 'Ô mạo hiểm với gợi ý rất gần CNV, tồn tại 10 giây trước khi xuất hiện hàng ngang hoặc trước khi thí sinh chọn hàng ngang. 20 giây trả lời câu hỏi ô mạo hiểm, 30 giây trả lời CNV. Chỉ hiện trên máy thí sinh và MC.',
    scoringRule: 'Đúng CNV sau ô mạo hiểm: +120 điểm. Sai CNV sau ô mạo hiểm: Bị trừ một nửa (50%) số điểm hiện có tại thời điểm đó và mất quyền chơi phần thi này.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 2.3',
    isPrimary: true,
    order: 3
  },
  VCNV_DOAN_CHUONG_NGAI: {
    format: 'VCNV_DOAN_CHUONG_NGAI',
    name: '2.4 Đoán Chướng Ngại Vật chính (80đ - 60đ - 40đ - 20đ - 10đ)',
    shortName: '2.4 Đoán CNV',
    roundGroup: 'VCNV',
    roundGroupName: 'Vòng 2: Vượt Chướng Ngại Vật',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 15,
    defaultPoints: 80,
    description: 'Thí sinh bấm chuông trả lời từ khóa chướng ngại vật vào bất kỳ thời điểm nào trong vòng thi.',
    scoringRule: 'Đúng trong 1 hàng ngang đầu: 80đ; trong 2 hàng ngang: 60đ; trong 3 hàng ngang: 40đ; trong 4 hàng ngang: 20đ; sau ô trung tâm: 10đ. Trả lời sai bị loại khỏi phần thi này.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 2.2',
    isPrimary: true,
    order: 4
  },

  // 3. TĂNG TỐC (Luật chơi BTI 2026 - Mục 3: 4 câu với 20s, 20s, 30s, 30s)
  TANG_TOC: {
    format: 'TANG_TOC',
    name: 'Tăng Tốc tổng quát (Trả lời ngắn chuẩn BTI)',
    shortName: 'Tăng tốc: Tổng quát',
    roundGroup: 'TANG_TOC',
    roundGroupName: 'Vòng 3: Tăng Tốc',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 20,
    defaultPoints: 40,
    description: '4 câu hỏi với thời gian suy nghĩ lần lượt là 20s, 20s, 30s, 30s. Điểm thưởng: Nhanh nhất 40đ, thứ 2: 30đ, thứ 3: 20đ, thứ 4: 10đ. Thưởng chuỗi 2 câu liên tiếp +20đ, cả 4 câu +40đ.',
    scoringRule: '+40đ / +30đ / +20đ / +10đ theo tốc độ gửi đáp án chính xác. Thưởng chuỗi 2 câu: +20đ, 4 câu: +40đ.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 3',
    isPrimary: false
  },
  TT_SAP_XEP: {
    format: 'TT_SAP_XEP',
    name: '3.1 Câu hỏi sắp xếp quy trình (20s, Trả lời ngắn)',
    shortName: '3.1 Sắp xếp quy trình',
    roundGroup: 'TANG_TOC',
    roundGroupName: 'Vòng 3: Tăng Tốc',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 20,
    defaultPoints: 40,
    description: 'Sắp xếp các bước thực hiện, giai đoạn phát triển hoặc quy trình xử lý dữ liệu. Thí sinh trả lời bằng máy tính trong 20 giây.',
    scoringRule: '+40đ / +30đ / +20đ / +10đ. Nhanh nhất 2 câu liên tiếp: +20đ; cả 4 câu: +40đ.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 3.1',
    isPrimary: true,
    order: 1
  },
  TT_DIEM_KHAC_BIET: {
    format: 'TT_DIEM_KHAC_BIET',
    name: '3.2 Câu hỏi Tìm điểm khác biệt / Spot the Flaw (20s, Trả lời ngắn)',
    shortName: '3.2 Tìm điểm khác biệt',
    roundGroup: 'TANG_TOC',
    roundGroupName: 'Vòng 3: Tăng Tốc',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 20,
    defaultPoints: 40,
    description: 'Quan sát hình ảnh hệ thống số, giao diện hoặc sơ đồ dữ liệu để tìm ra điểm khác biệt/lỗ hổng duy nhất trong 20 giây.',
    scoringRule: '+40đ / +30đ / +20đ / +10đ. Nhanh nhất 2 câu liên tiếp: +20đ; cả 4 câu: +40đ.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 3.2',
    isPrimary: true,
    order: 2
  },
  TT_DU_KIEN: {
    format: 'TT_DU_KIEN',
    name: '3.3 Câu hỏi dữ kiện logic xâu chuỗi (30s, Trả lời ngắn)',
    shortName: '3.3 Dữ kiện logic',
    roundGroup: 'TANG_TOC',
    roundGroupName: 'Vòng 3: Tăng Tốc',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 30,
    defaultPoints: 40,
    description: 'Xâu chuỗi các dữ kiện gợi ý xuất hiện liên tiếp theo mốc thời gian để tìm ra từ khóa/đối tượng bí mật trong 30 giây.',
    scoringRule: '+40đ / +30đ / +20đ / +10đ. Nhanh nhất 2 câu liên tiếp: +20đ; cả 4 câu: +40đ.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 3.3',
    isPrimary: true,
    order: 3
  },
  TT_SUY_LUAN_THUONG: {
    format: 'TT_SUY_LUAN_THUONG',
    name: '3.4 Câu hỏi suy luận thông thường (20s, Trả lời ngắn)',
    shortName: '3.4 Suy luận thông thường',
    roundGroup: 'TANG_TOC',
    roundGroupName: 'Vòng 3: Tăng Tốc',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 20,
    defaultPoints: 40,
    description: 'Vận dụng logic công nghệ và tư duy phản biện để suy luận ra câu trả lời ngắn chính xác trong 20 giây.',
    scoringRule: '+40đ / +30đ / +20đ / +10đ. Nhanh nhất 2 câu liên tiếp: +20đ; cả 4 câu: +40đ.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 3.4',
    isPrimary: true,
    order: 4
  },
  TT_GIAI_QUYET_TH: {
    format: 'TT_GIAI_QUYET_TH',
    name: '3.5 Câu hỏi giải quyết tình huống (30s, Trả lời ngắn)',
    shortName: '3.5 Giải quyết tình huống',
    roundGroup: 'TANG_TOC',
    roundGroupName: 'Vòng 3: Tăng Tốc',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 30,
    defaultPoints: 40,
    description: 'Xử lý tình huống an toàn thông tin, bảo vệ dữ liệu hoặc phản ứng trước sự cố mạng trong 30 giây.',
    scoringRule: '+40đ / +30đ / +20đ / +10đ. Nhanh nhất 2 câu liên tiếp: +20đ; cả 4 câu: +40đ.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 3.5',
    isPrimary: true,
    order: 5
  },
  TT_TRAC_NGHIEM_6: {
    format: 'TT_TRAC_NGHIEM_6',
    name: '3.6 Suy luận nâng cao 6 đáp án loại trừ theo thời gian (30s, Trả lời ngắn)',
    shortName: '3.6 Suy luận 6 đáp án',
    roundGroup: 'TANG_TOC',
    roundGroupName: 'Vòng 3: Tăng Tốc',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 30,
    defaultPoints: 40,
    description: 'Có 6 đáp án lựa chọn. Sau mỗi 10 giây, 2 đáp án sai bị loại bỏ. Trong 10 giây cuối cùng, 1 đáp án đúng và 1 đáp án sai được giữ lại. Thí sinh nộp câu trả lời bằng máy tính.',
    scoringRule: '+40đ / +30đ / +20đ / +10đ tùy tốc độ chốt đáp án đúng. Nhanh nhất 2 câu liên tiếp: +20đ; cả 4 câu: +40đ.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 3.6',
    isPrimary: true,
    order: 6
  },
  TT_DOAN_BANG: {
    format: 'TT_DOAN_BANG',
    name: '3.7 Câu hỏi đoạn băng Video / Audio (30s, Trả lời ngắn)',
    shortName: '3.7 Đoạn băng Video/Audio',
    roundGroup: 'TANG_TOC',
    roundGroupName: 'Vòng 3: Tăng Tốc',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 30,
    defaultPoints: 40,
    description: 'Câu hỏi dựa trên dữ liệu đoạn băng Video (hoặc chuỗi ảnh/audio phát liên tục) trong 30 giây.',
    scoringRule: '+40đ / +30đ / +20đ / +10đ. Nhanh nhất 2 câu liên tiếp: +20đ; cả 4 câu: +40đ.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 3.7',
    isPrimary: true,
    order: 7
  },

  // 4. VỀ ĐÍCH (Luật chơi BTI 2026 - Mục 4: 3 mức điểm 20, 30, 40 điểm)
  VD_SHORT_ANSWER: {
    format: 'VD_SHORT_ANSWER',
    name: '4.1 Trả lời ngắn (Gói 20đ: 15s | 30đ: 20s | 40đ: 30s)',
    shortName: '4.1 VĐ: Trả lời ngắn',
    roundGroup: 'VE_DICH',
    roundGroupName: 'Vòng 4: Về Đích',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 20,
    defaultPoints: 30,
    description: 'Thí sinh trả lời câu hỏi lý thuyết ngắn. Thời gian suy nghĩ và trả lời: 20đ là 15 giây, 30đ là 20 giây, 40đ là 30 giây. Thí sinh được đổi đáp án liên tục (lấy đáp án cuối). Có quyền đặt Ngôi sao hy vọng.',
    scoringRule: 'Đúng ghi điểm câu hỏi (x2 nếu đặt NSHV). Sai: đối thủ bấm chuông trong 5s. Thí sinh chuông đúng giành điểm từ người sai; thí sinh chuông sai bị trừ 50% số điểm câu hỏi.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 4.1',
    isPrimary: true,
    order: 1
  },
  VD_TRUE_FALSE_4: {
    format: 'VD_TRUE_FALSE_4',
    name: '4.2 Tình huống 4 ý Đúng/Sai (Gói 20đ: 15s | 30đ: 20s | 40đ: 30s)',
    shortName: '4.2 VĐ: Tình huống 4 ý Đúng/Sai',
    roundGroup: 'VE_DICH',
    roundGroupName: 'Vòng 4: Về Đích',
    defaultRoundType: 'TRUE_FALSE_4',
    defaultTimeLimit: 20,
    defaultPoints: 30,
    description: 'Đưa ra bối cảnh số thực tiễn kèm 4 nhận định a, b, c, d (Đúng/Sai). Áp dụng cho cả 3 mức điểm 20đ (15s), 30đ (20s) và 40đ (30s). Có quyền đặt Ngôi sao hy vọng.',
    scoringRule: 'Đúng nhận trọn điểm gói câu hỏi (x2 nếu đặt NSHV). Sai: đối thủ bấm chuông giành quyền trong 5 giây.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 4.1',
    isPrimary: true,
    order: 2
  },
  VD_AID_4: {
    format: 'VD_AID_4',
    name: '4.3 Câu hỏi AID 4 phương án ABCD (Gói 20đ: 15s | 30đ: 20s | 40đ: 30s)',
    shortName: '4.3 VĐ: Câu hỏi AID ABCD',
    roundGroup: 'VE_DICH',
    roundGroupName: 'Vòng 4: Về Đích',
    defaultRoundType: 'MULTIPLE_CHOICE',
    defaultTimeLimit: 20,
    defaultPoints: 20,
    description: 'Câu hỏi ứng dụng Trí tuệ nhân tạo (AID) & Năng lực số với 4 phương án A, B, C, D cho các mức điểm 20, 30, 40 điểm. Có quyền đặt Ngôi sao hy vọng.',
    scoringRule: 'Đúng nhận điểm câu hỏi (x2 nếu đặt NSHV). Sai: đối thủ bấm chuông giành quyền.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 4.1',
    isPrimary: true,
    order: 3
  },
  THUC_HANH_TINH_HUONG: {
    format: 'THUC_HANH_TINH_HUONG',
    name: '4.4 Câu hỏi Thực hành / Giải quyết tình huống (20đ: 15s+30s | 30đ: 20s+60s | 40đ: 30s+90s)',
    shortName: '4.4 VĐ: Thực hành tình huống',
    roundGroup: 'VE_DICH',
    roundGroupName: 'Vòng 4: Về Đích',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 60,
    defaultPoints: 30,
    description: 'Chương trình cung cấp tình huống số. Thí sinh chính: 20đ (15s nghĩ, 30s thực hành), 30đ (20s nghĩ, 60s thực hành), 40đ (30s nghĩ, 90s thực hành). Thí sinh chuông giành quyền: 20đ (20s thực hành), 30đ (40s thực hành), 40đ (60s thực hành).',
    scoringRule: 'Đúng/đạt yêu cầu ghi điểm câu hỏi (x2 nếu có NSHV). Sai/không đạt: đối thủ chuông trong 5s. Thí sinh chuông đúng giành điểm từ người sai; thí sinh chuông sai bị trừ 50% điểm câu hỏi.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 4.2',
    isPrimary: true,
    order: 4
  },
  VE_DICH_20: {
    format: 'VE_DICH_20',
    name: 'Gói câu hỏi 20 điểm (15s suy nghĩ / 30s thực hành)',
    shortName: 'Gói 20 điểm',
    roundGroup: 'VE_DICH',
    roundGroupName: 'Vòng 4: Về Đích',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 15,
    defaultPoints: 20,
    description: 'Gói câu hỏi 20 điểm: Thời gian suy nghĩ và trả lời lý thuyết là 15 giây; đối với thực hành là 15 giây suy nghĩ và 30 giây thực hành.',
    scoringRule: 'Đúng: +20đ (hoặc +40đ nếu đặt NSHV). Sai: Thí sinh chuông đúng giành 20đ; thí sinh chuông sai bị trừ 10đ.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 4.1 & 4.2',
    isPrimary: false
  },
  VE_DICH_30: {
    format: 'VE_DICH_30',
    name: 'Gói câu hỏi 30 điểm (20s suy nghĩ / 60s thực hành)',
    shortName: 'Gói 30 điểm',
    roundGroup: 'VE_DICH',
    roundGroupName: 'Vòng 4: Về Đích',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 20,
    defaultPoints: 30,
    description: 'Gói câu hỏi 30 điểm: Thời gian suy nghĩ và trả lời lý thuyết là 20 giây; đối với thực hành là 20 giây suy nghĩ và 60 giây thực hành.',
    scoringRule: 'Đúng: +30đ (hoặc +60đ nếu đặt NSHV). Sai: Thí sinh chuông đúng giành 30đ; thí sinh chuông sai bị trừ 15đ.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 4.1 & 4.2',
    isPrimary: false
  },
  VE_DICH_40: {
    format: 'VE_DICH_40',
    name: 'Gói câu hỏi 40 điểm (30s suy nghĩ / 90s thực hành)',
    shortName: 'Gói 40 điểm',
    roundGroup: 'VE_DICH',
    roundGroupName: 'Vòng 4: Về Đích',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 30,
    defaultPoints: 40,
    description: 'Gói câu hỏi 40 điểm: Thời gian suy nghĩ và trả lời lý thuyết là 30 giây; đối với thực hành là 30 giây suy nghĩ và 90 giây thực hành.',
    scoringRule: 'Đúng: +40đ (hoặc +80đ nếu đặt NSHV). Sai: Thí sinh chuông đúng giành 40đ; thí sinh chuông sai bị trừ 20đ.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 4.1 & 4.2',
    isPrimary: false
  },
  VE_DICH_HOA_100: {
    format: 'VE_DICH_HOA_100',
    name: '6. Lượt Về đích phân định 4 thí sinh bằng điểm (Khởi điểm 100đ)',
    shortName: '6. Phân định hòa 100đ',
    roundGroup: 'VE_DICH',
    roundGroupName: 'Vòng 4: Về Đích',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 30,
    defaultPoints: 30,
    description: 'Áp dụng khi cả 4 thí sinh có cùng số điểm sau phần thi Về đích. Mỗi thí sinh nhận 100 điểm khởi điểm (không ảnh hưởng điểm trước). MC dùng ánh sáng sân khấu chọn ngẫu nhiên thứ tự. Chọn gói 3 câu 20, 30, 40 điểm. NSHV đặt trước khi chọn gói và có hiệu lực cho TẤT CẢ câu trong gói.',
    scoringRule: 'Khởi điểm 100 điểm. NSHV nhân đôi tất cả các câu trong gói nếu đúng, trừ điểm nếu sai. Kết thúc lượt thi thí sinh cao điểm nhất chiến thắng.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 6',
    isPrimary: true,
    order: 5
  },
  KICH_TUONG_TAC: {
    format: 'KICH_TUONG_TAC',
    name: 'Kịch bản Kịch tương tác sân khấu (Chung kết)',
    shortName: 'Kịch tương tác',
    roundGroup: 'VE_DICH',
    roundGroupName: 'Vòng 4: Về Đích & Chung Kết',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 90,
    defaultPoints: 50,
    description: 'Tiểu phẩm kịch tương tác sân khấu với 4 nhánh kịch bản phản hồi xử lý tình huống số.',
    scoringRule: 'Đánh giá theo Rubric chuẩn hóa của Ban Giám Khảo.',
    ruleSection: 'Quy chế Chung kết BTI 2026',
    isPrimary: false
  },

  // 5. CÂU HỎI PHỤ (Luật chơi BTI 2026 - Mục 5)
  CAU_HOI_PHU: {
    format: 'CAU_HOI_PHU',
    name: '5. Câu hỏi phụ đấu loại trực tiếp (5 câu, 15s suy nghĩ, chuông nhanh)',
    shortName: '5. Câu hỏi phụ (Tie-breaker)',
    roundGroup: 'PHU',
    roundGroupName: '5. Câu Hỏi Phụ (Tie-breaker)',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 15,
    defaultPoints: 10,
    description: 'Áp dụng cho các thí sinh có cùng số điểm sau phần thi Về đích. Các thí sinh trả lời tối đa 5 câu hỏi. Thời gian suy nghĩ: 15 giây. Bấm chuông nhanh nhất trả lời đúng sẽ chiến thắng ngay lập tức. Sau 5 câu nếu hòa sẽ giải quyết 1 câu hỏi tình huống. Bấm chuông trước hiệu lệnh MC bị mất quyền.',
    scoringRule: 'Bấm chuông nhanh nhất và trả lời đúng chiến thắng ngay lập tức. Trả lời sai bước sang câu tiếp theo.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 5',
    isPrimary: true,
    order: 1
  }
};

/**
 * Lấy danh sách định dạng câu hỏi đang hoạt động (đã rà soát & loại bỏ trùng lặp) theo Vòng thi
 */
export const getActiveFormatsForRoundGroup = (groupKey: BtiRoundGroupKey): RoundFormatInfo[] => {
  return Object.values(QUESTION_ROUND_FORMATS)
    .filter(f => f.roundGroup === groupKey && f.isPrimary !== false)
    .sort((a, b) => (a.order || 99) - (b.order || 99));
};

/**
 * Tra cứu Vòng thi tương ứng từ Định dạng câu hỏi
 */
export const getRoundGroupByFormat = (format: QuestionRoundFormat): BtiRoundGroupKey => {
  const meta = QUESTION_ROUND_FORMATS[format];
  if (meta) return meta.roundGroup;
  if (format.startsWith('BGD_')) return 'VONG_LOAI';
  if (format.startsWith('KHOI_DONG') || format.startsWith('KD_')) return 'KHOI_DONG';
  if (format.startsWith('VCNV_')) return 'VCNV';
  if (format.startsWith('TT_') || format === 'TANG_TOC') return 'TANG_TOC';
  if (format.startsWith('VE_DICH') || format === 'THUC_HANH_TINH_HUONG' || format === 'KICH_TUONG_TAC') return 'VE_DICH';
  if (format === 'CAU_HOI_PHU') return 'PHU';
  return 'KHOI_DONG';
};

/**
 * Lấy danh sách Vòng thi tương ứng với Giai đoạn thi đấu
 * - Vòng Loại: Chỉ có 1 dạng đề chuẩn hóa 28 câu (24 câu Phần I và 4 câu Phần II), KHÔNG chọn các vòng thi như Bán kết và Chung kết.
 * - Bán Kết 1/2/3 & Chung Kết: Chỉ thi các vòng gameshow: Khởi động, VCNV, Tăng tốc, Về đích, Câu hỏi phụ.
 */
export const getRoundGroupsForStage = (stage: CompetitionStage): BtiRoundGroupInfo[] => {
  if (stage === 'VONG_LOAI') {
    return [BTI_ROUND_GROUPS.VONG_LOAI];
  }
  return Object.values(BTI_ROUND_GROUPS).filter(g => g.key !== 'VONG_LOAI');
};

