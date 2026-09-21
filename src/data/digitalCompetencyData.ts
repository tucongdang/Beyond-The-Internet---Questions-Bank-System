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
    lastActive: Date.now()
  },
  {
    id: 'usr_editor',
    name: 'ThS. Nguyễn Thu Trang',
    email: 'trang.nt@bti2026.org',
    role: 'HEAD_EDITOR',
    title: 'Trưởng Ban Đề Thi & Thẩm Định',
    organization: 'Viện Công Nghệ Giáo Dục Số',
    lastActive: Date.now() - 1000 * 60 * 15
  },
  {
    id: 'usr_examiner',
    name: 'PGS. TS. Trần Quốc Bảo',
    email: 'bao.tq@univ.edu.vn',
    role: 'EXAMINER',
    title: 'Chủ Tịch Hội Đồng Giám Khảo',
    organization: 'Hội Đồng Khảo Thí Quốc Gia',
    lastActive: Date.now() - 1000 * 60 * 45
  },
  {
    id: 'usr_contributor',
    name: 'ThS. Đặng Minh Tuấn',
    email: 'dangtu2006@gmail.com',
    role: 'CONTRIBUTOR',
    title: 'Chuyên Viên Biên Soạn Câu Hỏi',
    organization: 'Tổ Ra Đề Môn Năng Lực Số',
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
  KHOI_DONG_RIENG: {
    format: 'KHOI_DONG_RIENG',
    name: '1.1 Khởi động tổng quát (Trả lời ngắn chuẩn BTI)',
    shortName: '1.1 Khởi động tổng quát',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 5,
    defaultPoints: 10,
    description: 'Câu hỏi khởi động dạng trả lời ngắn, áp dụng linh hoạt cho lượt riêng (60s/12 câu) hoặc lượt chung (chuông 3s).',
    scoringRule: '+10 điểm/câu đúng. Riêng: 0đ nếu sai/bỏ qua. Chung: -5đ nếu bấm chuông trả lời sai.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1',
    isPrimary: true,
    order: 1
  },
  KHOI_DONG_CHUNG: {
    format: 'KHOI_DONG_CHUNG',
    name: 'Khởi động chung (Bấm chuông 3 lượt - Cũ)',
    shortName: 'Khởi động chung (Cũ)',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 3,
    defaultPoints: 10,
    description: '4 thí sinh cùng bấm chuông giành quyền trả lời câu hỏi ngắn. Có 3 giây để đưa ra đáp án sau khi chuông reo.',
    scoringRule: '+10 điểm nếu đúng. Sai hoặc không trả lời bị trừ 5 điểm (1 câu chỉ 1 người bấm).',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1.2',
    isPrimary: false
  },
  KD_DIEN_CHO_TRONG: {
    format: 'KD_DIEN_CHO_TRONG',
    name: '1.2 Điền vào chỗ trống / Khuyết từ (Trả lời ngắn)',
    shortName: '1.2 Điền chỗ trống',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 10,
    defaultPoints: 10,
    description: 'Thí sinh điền từ ngữ/thuật ngữ số còn thiếu vào khoảng trống trong văn bản định nghĩa.',
    scoringRule: '+10 điểm/câu đúng. Sai/không trả lời: 0đ (lượt riêng) hoặc -5đ (lượt chung).',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1.3',
    isPrimary: true,
    order: 2
  },
  KD_DUNG_SAI_NEN: {
    format: 'KD_DUNG_SAI_NEN',
    name: '1.3 Đúng/Sai hoặc Nên/Không nên (Trả lời ngắn)',
    shortName: '1.3 Đúng/Sai - Nên/Không nên',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 8,
    defaultPoints: 10,
    description: 'Lựa chọn nhanh Đúng/Sai hoặc Nên/Không nên đối với các hành vi an toàn số, văn hóa mạng.',
    scoringRule: '+10 điểm/câu đúng. Sai: 0đ (lượt riêng) hoặc -5đ (lượt chung).',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1.3',
    isPrimary: true,
    order: 3
  },
  KD_HINH_ANH_AM_THANH: {
    format: 'KD_HINH_ANH_AM_THANH',
    name: '1.4 Nhận diện Hình ảnh hoặc Đoạn âm thanh (Trả lời ngắn)',
    shortName: '1.4 Hình ảnh / Âm thanh',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 12,
    defaultPoints: 10,
    description: 'Câu hỏi nhận diện biểu tượng, thiết bị số, thuật toán hoặc tín hiệu âm thanh dạng trả lời ngắn.',
    scoringRule: '+10 điểm/câu đúng.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1.3',
    isPrimary: true,
    order: 4
  },
  KD_TINH_HUONG_NGAN: {
    format: 'KD_TINH_HUONG_NGAN',
    name: '1.5 Tình huống ngắn phản xạ (Trả lời ngắn)',
    shortName: '1.5 Tình huống ngắn',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 15,
    defaultPoints: 10,
    description: 'Tình huống số ngắn gọn phản xạ nhanh về bảo mật cá nhân, phòng tránh lừa đảo.',
    scoringRule: '+10 điểm/câu đúng.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1.3',
    isPrimary: true,
    order: 5
  },
  KD_TRAC_NGHIEM_ABCD: {
    format: 'KD_TRAC_NGHIEM_ABCD',
    name: '1.6 Trắc nghiệm 4 lựa chọn ABCD (Trắc nghiệm)',
    shortName: '1.6 Trắc nghiệm ABCD',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'MULTIPLE_CHOICE',
    defaultTimeLimit: 10,
    defaultPoints: 10,
    description: 'Câu hỏi trắc nghiệm 4 phương án A, B, C, D duy nhất trong phần thi Khởi động.',
    scoringRule: '+10 điểm/câu đúng. Chọn sai: 0đ (lượt riêng) hoặc -5đ (lượt chung).',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1.3',
    isPrimary: true,
    order: 6
  },
  // Các dạng bổ trợ chuẩn hóa
  KD_PHAN_TICH_SO_SANH: {
    format: 'KD_PHAN_TICH_SO_SANH',
    name: '1.7 Phân tích, so sánh nhanh dữ liệu số (Trả lời ngắn)',
    shortName: '1.7 Phân tích so sánh',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 12,
    defaultPoints: 10,
    description: 'So sánh nhanh hai giao thức, hai công nghệ hoặc hai nguyên tắc pháp lý số.',
    scoringRule: '+10 điểm/câu đúng.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1.3',
    isPrimary: true,
    order: 7
  },
  KD_SPOT_THE_FLAW: {
    format: 'KD_SPOT_THE_FLAW',
    name: 'Spot the Flaw (Thuộc Vòng 3 Tăng Tốc mục 3.2)',
    shortName: 'KD: Spot the Flaw',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 15,
    defaultPoints: 10,
    description: 'Phát hiện điểm bất thường, lỗi lập trình hoặc dấu hiệu deepfake.',
    scoringRule: '+10 điểm/câu đúng.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1.3',
    isPrimary: false
  },
  KD_QUICK_PROCESS: {
    format: 'KD_QUICK_PROCESS',
    name: 'Trình tự thao tác (Thuộc Vòng 3 Tăng Tốc mục 3.1)',
    shortName: 'KD: Trình tự nhanh',
    roundGroup: 'KHOI_DONG',
    roundGroupName: 'Vòng 1: Khởi Động',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 15,
    defaultPoints: 10,
    description: 'Sắp xếp quy trình các thao tác cơ bản.',
    scoringRule: '+10 điểm/câu đúng.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 1.3',
    isPrimary: false
  },

  // 2. VƯỢT CHƯỚNG NGẠI VẬT
  VCNV_HANG_NGANG: {
    format: 'VCNV_HANG_NGANG',
    name: 'Vòng 2: Vượt Chướng Ngại Vật (Bộ đề 7 hàng chuẩn BTI 2026)',
    shortName: 'Bộ đề VCNV (7 hàng)',
    roundGroup: 'VCNV',
    roundGroupName: 'Vòng 2: Vượt Chướng Ngại Vật',
    defaultRoundType: 'VCNV',
    defaultTimeLimit: 60,
    defaultPoints: 80,
    description: 'Quy chuẩn 7 hàng: 1 Từ khóa chính + 1 Ô mạo hiểm (+120đ) + 4 Hàng ngang gợi ý (10đ/15s) + 1 Ô trung tâm & Ảnh gợi ý đính kèm.',
    scoringRule: 'Ô mạo hiểm: +120đ/-50% điểm; Hàng ngang: +10đ; Ô trung tâm: +10đ; Đoán CNV: 80đ - 60đ - 40đ - 20đ - 10đ.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 2 (VCNV)',
    isPrimary: true,
    order: 1
  },
  VCNV_TRUNG_TAM: {
    format: 'VCNV_TRUNG_TAM',
    name: 'Ô trung tâm gợi ý (Thuộc bộ đề VCNV)',
    shortName: 'Ô trung tâm gợi ý',
    roundGroup: 'VCNV',
    roundGroupName: 'Vòng 2: Vượt Chướng Ngại Vật',
    defaultRoundType: 'VCNV',
    defaultTimeLimit: 15,
    defaultPoints: 10,
    description: 'Mảnh ghép ô trung tâm mở ra gợi ý quan trọng nhất để tìm từ khóa chướng ngại vật.',
    scoringRule: '+10 điểm cho mỗi thí sinh trả lời đúng.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 2.2',
    isPrimary: false,
    order: 2
  },
  VCNV_MAO_HIEM: {
    format: 'VCNV_MAO_HIEM',
    name: 'Ô Mạo Hiểm (Thuộc bộ đề VCNV)',
    shortName: 'Ô Mạo Hiểm (120đ)',
    roundGroup: 'VCNV',
    roundGroupName: 'Vòng 2: Vượt Chướng Ngại Vật',
    defaultRoundType: 'VCNV',
    defaultTimeLimit: 20,
    defaultPoints: 120,
    description: 'Xuất hiện sau khi mở tối thiểu 1 hàng ngang. 10 giây để nhấp chọn mạo hiểm, 20 giây trả lời.',
    scoringRule: 'Đúng +120 điểm. Trả lời sai bị trừ một nửa số điểm hiện có tại thời điểm đó.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 2.3',
    isPrimary: false,
    order: 3
  },
  VCNV_DOAN_CHUONG_NGAI: {
    format: 'VCNV_DOAN_CHUONG_NGAI',
    name: 'Từ khóa Chướng Ngại Vật chính (Thuộc bộ đề VCNV)',
    shortName: 'Từ khóa CNV chính',
    roundGroup: 'VCNV',
    roundGroupName: 'Vòng 2: Vượt Chướng Ngại Vật',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 15,
    defaultPoints: 80,
    description: 'Thí sinh bấm chuông trả lời từ khóa chướng ngại vật vào bất kỳ thời điểm nào trong vòng thi.',
    scoringRule: 'Hàng 1: 80đ; Hàng 2: 60đ; Hàng 3: 40đ; Hàng 4: 20đ; Ô trung tâm: 10đ. Trả lời sai bị loại khỏi phần thi VCNV.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 2.2',
    isPrimary: false,
    order: 4
  },

  // 3. TĂNG TỐC (7 Dạng Chuẩn BTI 2026: Tất cả là câu trả lời ngắn)
  TANG_TOC: {
    format: 'TANG_TOC',
    name: 'Tăng Tốc tổng quát (Trả lời ngắn)',
    shortName: 'Tăng tốc: Tổng quát',
    roundGroup: 'TANG_TOC',
    roundGroupName: 'Vòng 3: Tăng Tốc',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 20,
    defaultPoints: 40,
    description: '4 câu hỏi tăng tốc dạng câu trả lời ngắn. Điểm thưởng trao theo thứ tự thời gian nộp bài: Nhanh nhất +40, nhì +30, ba +20, tư +10.',
    scoringRule: 'Người nhanh nhất: +40đ, tiếp theo: +30đ, +20đ, +10đ.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 3',
    isPrimary: false
  },
  TT_SAP_XEP: {
    format: 'TT_SAP_XEP',
    name: '3.1 Sắp xếp trình tự quy trình (Trả lời ngắn - Tự động sắp xếp)',
    shortName: '3.1 Sắp xếp trình tự',
    roundGroup: 'TANG_TOC',
    roundGroupName: 'Vòng 3: Tăng Tốc',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 20,
    defaultPoints: 40,
    description: 'Sắp xếp các bước thực hiện, giai đoạn phát triển hoặc quy trình xử lý dữ liệu. Tự động xuất đáp án sắp xếp chuẩn.',
    scoringRule: '+40đ / +30đ / +20đ / +10đ theo thứ tự gửi đáp án chính xác.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 3.1',
    isPrimary: true,
    order: 1
  },
  TT_DIEM_KHAC_BIET: {
    format: 'TT_DIEM_KHAC_BIET',
    name: '3.2 Tìm điểm khác biệt / Spot the Flaw (Trả lời ngắn)',
    shortName: '3.2 Tìm điểm khác biệt',
    roundGroup: 'TANG_TOC',
    roundGroupName: 'Vòng 3: Tăng Tốc',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 20,
    defaultPoints: 40,
    description: 'So sánh hình ảnh hệ thống số hoặc sơ đồ dữ liệu để phát hiện điểm khác biệt hoặc lỗ hổng duy nhất.',
    scoringRule: '+40đ / +30đ / +20đ / +10đ theo thứ tự gửi đáp án chính xác.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 3.2',
    isPrimary: true,
    order: 2
  },
  TT_DU_KIEN: {
    format: 'TT_DU_KIEN',
    name: '3.3 Dữ kiện xâu chuỗi logic thời gian (Trả lời ngắn)',
    shortName: '3.3 Dữ kiện logic',
    roundGroup: 'TANG_TOC',
    roundGroupName: 'Vòng 3: Tăng Tốc',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 30,
    defaultPoints: 40,
    description: 'Xâu chuỗi các dữ kiện gợi ý xuất hiện liên tiếp theo mốc thời gian để tìm ra từ khóa/đối tượng bí mật.',
    scoringRule: '+40đ / +30đ / +20đ / +10đ theo thứ tự gửi đáp án chính xác.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 3.3',
    isPrimary: true,
    order: 3
  },
  TT_SUY_LUAN_THUONG: {
    format: 'TT_SUY_LUAN_THUONG',
    name: '3.4 Suy luận logic thông thường (Trả lời ngắn)',
    shortName: '3.4 Suy luận logic',
    roundGroup: 'TANG_TOC',
    roundGroupName: 'Vòng 3: Tăng Tốc',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 20,
    defaultPoints: 40,
    description: 'Vận dụng logic công nghệ và tư duy phản biện để suy luận ra câu trả lời ngắn chính xác.',
    scoringRule: '+40đ / +30đ / +20đ / +10đ theo thứ tự gửi đáp án chính xác.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 3.4',
    isPrimary: true,
    order: 4
  },
  TT_GIAI_QUYET_TH: {
    format: 'TT_GIAI_QUYET_TH',
    name: '3.5 Giải quyết tình huống số nhanh (Trả lời ngắn)',
    shortName: '3.5 Giải quyết tình huống',
    roundGroup: 'TANG_TOC',
    roundGroupName: 'Vòng 3: Tăng Tốc',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 30,
    defaultPoints: 40,
    description: 'Xử lý tình huống an toàn thông tin, bảo mật tài khoản hoặc ứng xử khi bị tấn công mạng dưới dạng trả lời ngắn.',
    scoringRule: '+40đ / +30đ / +20đ / +10đ theo thứ tự gửi đáp án chính xác.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 3.5',
    isPrimary: true,
    order: 5
  },
  TT_TRAC_NGHIEM_6: {
    format: 'TT_TRAC_NGHIEM_6',
    name: '3.6 Suy luận nâng cao 6 phương án (Trả lời ngắn - Tự động đưa ra đáp án)',
    shortName: '3.6 Suy luận 6 phương án',
    roundGroup: 'TANG_TOC',
    roundGroupName: 'Vòng 3: Tăng Tốc',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 30,
    defaultPoints: 40,
    description: '6 phương án lựa chọn loại trừ theo thời gian. Thí sinh nộp câu trả lời ngắn, hệ thống tự động đưa ra đáp án khi xuất.',
    scoringRule: '+40đ (1-10s), +30đ (11-20s), +20đ (21-30s) tùy thuộc thời điểm chốt đáp án đúng.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 3.6',
    isPrimary: true,
    order: 6
  },
  TT_DOAN_BANG: {
    format: 'TT_DOAN_BANG',
    name: '3.7 Đoạn băng Video / Audio clue làm rõ dần (Trả lời ngắn)',
    shortName: '3.7 Đoạn băng clue',
    roundGroup: 'TANG_TOC',
    roundGroupName: 'Vòng 3: Tăng Tốc',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 30,
    defaultPoints: 40,
    description: 'Đoạn video/audio phát liên tục và dần rõ ràng để thí sinh tìm ra lời giải ngắn chính xác.',
    scoringRule: '+40đ / +30đ / +20đ / +10đ theo thứ tự gửi đáp án chính xác.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 3.7',
    isPrimary: true,
    order: 7
  },

  // 4. VỀ ĐÍCH (Quy về 3 dạng cho tất cả các gói điểm 20đ, 30đ, 40đ)
  VD_SHORT_ANSWER: {
    format: 'VD_SHORT_ANSWER',
    name: '4.1 Trả lời ngắn (Tự luận ngắn / Từ khóa số - Gói 20đ, 30đ, 40đ)',
    shortName: '4.1 VĐ: Trả lời ngắn',
    roundGroup: 'VE_DICH',
    roundGroupName: 'Vòng 4: Về Đích',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 20,
    defaultPoints: 20,
    description: 'Thí sinh trả lời ngắn / nêu từ khóa số chính xác. Áp dụng cho cả 3 gói điểm 20đ (15s), 30đ (20s) và 40đ (30s). Có quyền đặt Ngôi sao hy vọng.',
    scoringRule: 'Đúng nhận đủ điểm gói câu hỏi (nhân đôi nếu có NSHV). Sai bị trừ 50% số điểm nếu đặt NSHV; đối thủ được bấm chuông giành quyền.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 4.1',
    isPrimary: true,
    order: 1
  },
  VD_TRUE_FALSE_4: {
    format: 'VD_TRUE_FALSE_4',
    name: '4.2 Câu hỏi tình huống 4 ý đúng/sai (Gói 20đ, 30đ, 40đ)',
    shortName: '4.2 VĐ: Tình huống 4 ý Đúng/Sai',
    roundGroup: 'VE_DICH',
    roundGroupName: 'Vòng 4: Về Đích',
    defaultRoundType: 'TRUE_FALSE_4',
    defaultTimeLimit: 20,
    defaultPoints: 30,
    description: 'Đưa ra 1 tình huống số thực tiễn kèm 4 nhận định a, b, c, d (Đúng/Sai). Áp dụng cho cả 3 gói điểm 20đ, 30đ, 40đ. Có quyền đặt Ngôi sao hy vọng.',
    scoringRule: 'Đúng cả 4 ý nhận trọn điểm gói. Đúng 1 ý được 10%, 2 ý được 25%, 3 ý được 50% số điểm gói (hoặc nhân đôi nếu đặt NSHV).',
    ruleSection: 'Luật chơi BTI 2026 - Mục 4.1 & 4.2',
    isPrimary: true,
    order: 2
  },
  VD_AID_4: {
    format: 'VD_AID_4',
    name: '4.3 Câu hỏi AID 4 phương án trả lời ABCD (Gói 20đ, 30đ, 40đ)',
    shortName: '4.3 VĐ: Câu hỏi AID ABCD',
    roundGroup: 'VE_DICH',
    roundGroupName: 'Vòng 4: Về Đích',
    defaultRoundType: 'MULTIPLE_CHOICE',
    defaultTimeLimit: 20,
    defaultPoints: 20,
    description: 'Câu hỏi ứng dụng Trí tuệ nhân tạo (AID) & Năng lực số với 4 phương án A, B, C, D. Áp dụng cho cả 3 gói điểm 20đ, 30đ, 40đ. Có quyền đặt Ngôi sao hy vọng.',
    scoringRule: 'Đúng nhận trọn điểm gói (nhân đôi nếu đặt NSHV). Sai không có điểm, thí sinh khác bấm chuông.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 4.1',
    isPrimary: true,
    order: 3
  },

  // Các dạng cũ được lưu để tương thích ngược dữ liệu
  VE_DICH_20: {
    format: 'VE_DICH_20',
    name: 'Gói câu hỏi 20 điểm (Cũ - Mời dùng 3 dạng chuẩn 4.1 - 4.3)',
    shortName: 'Gói 20 điểm (Cũ)',
    roundGroup: 'VE_DICH',
    roundGroupName: 'Vòng 4: Về Đích',
    defaultRoundType: 'MULTIPLE_CHOICE',
    defaultTimeLimit: 15,
    defaultPoints: 20,
    description: 'Gói câu hỏi 20 điểm.',
    scoringRule: 'Đúng: +20đ (hoặc +40đ nếu đặt NSHV).',
    ruleSection: 'Luật chơi BTI 2026 - Mục 4.1',
    isPrimary: false
  },
  VE_DICH_30: {
    format: 'VE_DICH_30',
    name: 'Gói câu hỏi 30 điểm (Cũ - Mời dùng 3 dạng chuẩn 4.1 - 4.3)',
    shortName: 'Gói 30 điểm (Cũ)',
    roundGroup: 'VE_DICH',
    roundGroupName: 'Vòng 4: Về Đích',
    defaultRoundType: 'TRUE_FALSE_4',
    defaultTimeLimit: 20,
    defaultPoints: 30,
    description: 'Gói câu hỏi 30 điểm.',
    scoringRule: 'Đúng: +30đ (hoặc +60đ nếu đặt NSHV).',
    ruleSection: 'Luật chơi BTI 2026 - Mục 4.1',
    isPrimary: false
  },
  VE_DICH_40: {
    format: 'VE_DICH_40',
    name: 'Gói câu hỏi 40 điểm (Cũ - Mời dùng 3 dạng chuẩn 4.1 - 4.3)',
    shortName: 'Gói 40 điểm (Cũ)',
    roundGroup: 'VE_DICH',
    roundGroupName: 'Vòng 4: Về Đích',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 30,
    defaultPoints: 40,
    description: 'Gói câu hỏi 40 điểm.',
    scoringRule: 'Đúng: +40đ (hoặc +80đ nếu đặt NSHV).',
    ruleSection: 'Luật chơi BTI 2026 - Mục 4.1',
    isPrimary: false
  },
  THUC_HANH_TINH_HUONG: {
    format: 'THUC_HANH_TINH_HUONG',
    name: 'Thực hành thao tác số / Xử lý tình huống',
    shortName: 'Thực hành tình huống',
    roundGroup: 'VE_DICH',
    roundGroupName: 'Vòng 4: Về Đích',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 60,
    defaultPoints: 30,
    description: 'Câu hỏi thực hành trên máy tính hoặc xử lý tình huống số chuyên sâu.',
    scoringRule: 'Theo thời gian suy nghĩ và thao tác.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 4.2',
    isPrimary: false
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
    description: 'Tiểu phẩm kịch tương tác sân khấu.',
    scoringRule: 'Đánh giá theo Rubric chuẩn hóa.',
    ruleSection: 'Quy chế Chung kết BTI 2026',
    isPrimary: false
  },
  VE_DICH_HOA_100: {
    format: 'VE_DICH_HOA_100',
    name: 'Lượt Về đích phân định hòa (100đ)',
    shortName: 'Phân định hòa 100đ',
    roundGroup: 'VE_DICH',
    roundGroupName: 'Vòng 4: Về Đích',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 30,
    defaultPoints: 30,
    description: 'Áp dụng khi cả 4 thí sinh có cùng số điểm sau 4 vòng thi.',
    scoringRule: 'Khởi điểm 100 điểm.',
    ruleSection: 'Luật chơi BTI 2026 - Mục 6',
    isPrimary: false
  },

  // 5. CÂU HỎI PHỤ
  CAU_HOI_PHU: {
    format: 'CAU_HOI_PHU',
    name: '5.1 Câu hỏi phụ đấu loại trực tiếp (15s - Chuông nhanh)',
    shortName: '5.1 Câu hỏi phụ',
    roundGroup: 'PHU',
    roundGroupName: '5. Câu Hỏi Phụ (Tie-breaker)',
    defaultRoundType: 'SHORT_ANSWER',
    defaultTimeLimit: 15,
    defaultPoints: 10,
    description: 'Tối đa 5 câu hỏi phụ. Thí sinh bấm chuông giành quyền trả lời. Trả lời đúng thắng ngay lập tức.',
    scoringRule: 'Thí sinh trả lời đúng sẽ giành chiến thắng ngay lập tức. Trả lời sai quyền chuyển cho đối thủ.',
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

