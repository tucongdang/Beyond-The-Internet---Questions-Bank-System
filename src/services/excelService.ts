import * as XLSX from 'xlsx';
import { QuestionItem, CompetitionStage } from '../types';

export interface ParseExcelResult {
  success: boolean;
  importedQuestions: QuestionItem[];
  detectedFormat: 'BTI_OFFICIAL_MULTI_SHEET' | 'STANDARD_TABLE' | 'CUSTOM';
  sheetNames: string[];
  summary: {
    total: number;
    byRound: Record<string, number>;
  };
  warnings: string[];
}

/**
 * Full sample dataset faithfully extracted from the official 6-page BTI competition template
 */
export const SAMPLE_BTI_EXCEL_DATA = {
  khoiDong: {
    ts1: [
      { q: 'Gieo đồng thời hai con xúc xắc. Xác suất để tích các số chấm xuất hiện là số lẻ bằng bao nhiêu?', a: '0,25', img: 'nani.jpg', audio: '' },
      { q: 'Trong vật lí, chữ cái in hoa nào được dùng để kí hiệu chu kì dao động?', a: 'T', img: '', audio: 'untitled.wav' },
      { q: 'Nguyên tố nào trong tiếng Latin có nghĩa là "sinh ra phèn"?', a: 'Al', img: '', audio: 'tada.mp3' },
      { q: 'Sinh trưởng thứ cấp chủ yếu xảy ra ở loại cây có bao nhiêu lá mầm?', a: '2', img: '', audio: '' },
      { q: '"Nên vợ nên chồng", "Con chó xấu xí", "Làng" là những tác phẩm của nhà văn nào?', a: 'Kim Lân', img: '', audio: '' },
      { q: 'Ai là vị Thủ tướng đầu tiên của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam?', a: 'Phạm Văn Đồng', img: '', audio: '' }
    ],
    ts2: [
      { q: 'Trong hệ điều hành Windows, để xóa một tệp tin vĩnh viễn không qua thùng rác, ta dùng tổ hợp phím nào?', a: 'Shift + Delete', img: '', audio: '' },
      { q: 'Trong bài dân ca Bắc Bộ "Trống cơm", con vật nào được nhắc tới lội sông?', a: 'nhện', img: '', audio: '' },
      { q: 'Du Xuân, Đào liễu, Lới lơ là những làn điệu quen thuộc của loại hình nghệ thuật nào?', a: 'Chèo', img: '', audio: '' },
      { q: 'Who was the leader of the Soviet Union during World War II?', a: 'Stalin', img: '', audio: '' },
      { q: 'Trong mặt phẳng Oxy, cặp số bao gồm hoành độ và tung độ được gọi là gì của một điểm?', a: 'Tọa độ', img: '', audio: '' },
      { q: 'Gương cầu lồi có tâm nằm ở trước hay sau gương?', a: 'sau', img: '', audio: '' }
    ],
    ts3: [
      { q: 'Pin Volta gồm một cực bằng copper và một cực bằng zinc nhúng trong dung dịch loãng của chất nào?', a: 'sulfuric acid', img: '', audio: '' },
      { q: 'Trong chọn giống vật nuôi, người ta không sử dụng phương pháp tự phối. Đúng hay sai?', a: 'đúng', img: '', audio: '' },
      { q: '2 màu sắc nào được nhắc tới trong câu tục ngữ về kinh nghiệm đi đêm: "... thì lội, ... thì tránh"?', a: 'trắng, đen', img: '', audio: '' },
      { q: 'Tập hợp A = {1, 555, 9} có bao nhiêu tập con?', a: '8', img: '', audio: '' },
      { q: '"Không ai tắm hai lần trên một dòng sông" là câu nói nổi tiếng của triết gia Hy Lạp nào?', a: 'Heraclitus', img: '', audio: '' },
      { q: 'AI, IoT, Big Data là những xu thế toàn cầu của cuộc cách mạng công nghiệp lần thứ mấy?', a: '4', img: '', audio: '' }
    ],
    ts4: [
      { q: 'Trong văn hóa Thái Lan, Rắn Naga được đưa vào hình tượng con vật nào?', a: 'Rồng', img: '', audio: '' },
      { q: 'Hoàng đế anh hùng nào trong lịch sử dân tộc thường gắn liền với chiến thắng Ngọc Hồi - Đống Đa?', a: 'Quang Trung', img: '', audio: '' },
      { q: 'Which chemical element are diamonds made of?', a: 'Carbon', img: '', audio: '' },
      { q: 'Trong một mẫu số liệu, giá trị xuất hiện nhiều nhất được gọi là gì?', a: 'mode', img: '', audio: '' },
      { q: 'Đơn vị của momen lực trong hệ SI là gì?', a: 'N.m', img: '', audio: '' },
      { q: 'Mol/s là đơn vị dùng để đo đại lượng hóa học nào?', a: 'Tốc độ phản ứng', img: '', audio: '' }
    ],
    luotChung: [
      { q: 'Khí hậu ... là kiểu khí hậu có sự dao động về thời tiết và nhiệt độ ngày đêm lớn?', a: 'Lục địa', img: '', audio: '' },
      { q: 'Ai là người cắm lá cờ chiến thắng của Mặt trận Dân tộc Giải phóng miền Nam Việt Nam trên nóc Dinh Độc Lập?', a: 'Bùi Quang Thận', img: '', audio: '' },
      { q: 'Vở cải lương "Nợ nước non" kể về thân thế và sự nghiệp của vị lãnh tụ nào?', a: 'Hồ Chí Minh', img: '', audio: '' },
      { q: 'Quảng Nam là nơi lưu giữ nhiều nhất những dấu tích của nền văn hóa cổ nào?', a: 'Champa', img: '', audio: '' },
      { q: 'Các cơn bão ở Nam bán cầu có chiều xoắn thuận hay ngược chiều kim đồng hồ?', a: 'thuận', img: '', audio: '' },
      { q: 'Nhân vật nữ anh hùng nào đã được xưng tụng câu nói: "Tôi muốn cưỡi cơn gió mạnh..."?', a: 'Bà Triệu', img: '', audio: '' },
      { q: 'Ngành công nghiệp nào được ví như "Quả tim của nhóm ngành công nghiệp nặng"?', a: 'cơ khí', img: '', audio: '' },
      { q: '"Zip Postal Code" là hệ thống mã toàn cầu dùng cho lĩnh vực nào?', a: 'bưu chính', img: '', audio: '' },
      { q: 'Hải Thượng Lãn Ông đã ví loài thực vật quý nào là "nhân sâm của người nghèo"?', a: 'đinh lăng', img: '', audio: '' },
      { q: 'Mão lông trĩ, cờ lệnh sau lưng, hia, đai lưng, đao,... là những trang phục đặc trưng của loại hình sân khấu nào?', a: 'tuồng', img: '', audio: '' },
      { q: 'Hai loại quân cờ nào trên bàn cờ tướng chỉ được di chuyển trong cung cấm?', a: 'tướng và sĩ', img: '', audio: '' },
      { q: 'In which continent is the country of Morocco located?', a: 'Africa', img: '', audio: '' }
    ]
  },
  vuotCnv: {
    keyword: 'PHÁO ĐẤT',
    imageFile: 'cnv.jpg',
    piecesCount: '1',
    explanation: 'Đây là giải thích về chướng ngại vật, có thể được mở trên app MC.',
    rows: [
      { name: 'Hàng ngang 1', q: 'Sự kiện văn hóa được tổ chức theo nghi lễ truyền thống của cộng đồng gọi là gì?', a: 'Lễ hội', audio: 'untitled.wav' },
      { name: 'Hàng ngang 2', q: 'Sông Cái, Nhị Hà hay Nhĩ Hà là tên gọi khác của con sông lớn nào ở miền Bắc?', a: 'sông Hồng', audio: '' },
      { name: 'Hàng ngang 3', q: 'Từ nào được dùng để chỉ kế sách quân sự đánh lừa đối phương, giấu giếm ý đồ thật?', a: 'Nghi binh', audio: '' },
      { name: 'Hàng ngang 4', q: 'Từ nào còn thiếu trong câu tục ngữ: "Tiếng lành đồn xa, tiếng dữ đồn..."?', a: 'Nổ', audio: '' },
      { name: 'Hàng ngang trung tâm', q: 'Loại vũ khí nào xuất hiện trên mặt trận chi viện hỏa lực tầm xa?', a: 'Pháo', audio: '' }
    ]
  },
  tangToc: {
    questions: [
      { name: 'Tăng tốc 1', q: 'Trả lời câu hỏi: Hãy xác định phương án bảo mật dữ liệu an toàn?', a: 'B', answerImg: '', mediaList: ['tt1.png'] },
      { name: 'Tăng tốc 2', q: 'Trả lời câu hỏi: Hãy sắp xếp tên các tác phẩm văn học: Ông già và biển cả (Ernest Hemingway), Nhà giả kim...', a: 'ADCBCBAD (Các tác phẩm Ông già và biển cả - Ernest Hemingway, Nhà giả kim...)', answerImg: 'tt2.2.png', mediaList: ['tt2.1.png'] },
      { name: 'Tăng tốc 3', q: 'Trả lời câu hỏi: Quan sát hình khối và đếm số lượng hình lập phương?', a: '6', answerImg: '', mediaList: ['tt3.jpg'] },
      { name: 'Tăng tốc 4', q: 'Đây là ai? Bác sĩ nông học người Việt Nam lai tạo ra giống lúa Nông nghiệp 1?', a: 'Lương Định Của', answerImg: '', mediaList: ['video.mp4'] }
    ]
  },
  veDich: {
    luot1: [
      { pts: 'Câu hỏi 20 điểm', q: 'Mỗi buổi sáng, tôi thường thức dậy và ngắm dãy núi cao nhất thế giới. Dãy núi đó tên là gì?', a: 'Himalaya', media: '', note: '', audio: '' },
      { pts: 'Câu hỏi 20 điểm', q: 'Vì sao một quả bóng nếu bơm căng quá khi đá sẽ nhanh bị hỏng hơn bóng vừa phải?', a: 'Vì bóng khó biến dạng nên tính đàn hồi giảm', media: '', note: '', audio: '' },
      { pts: 'Câu hỏi 20 điểm', q: 'Bạn hãy trả lời câu hỏi sau bằng tiếng Anh: Which organ is the main organ of human\'s circulatory system?', a: 'Heart', media: '', note: 'Which organ is the main organ of human\'s circulatory system?', audio: '' },
      { pts: 'Câu hỏi 30 điểm', q: 'Sự ra đời của tổ chức nào vào cuối năm 1960 đã đánh dấu bước ngoặt của cách mạng miền Nam?', a: 'Mặt trận Dân tộc giải phóng miền Nam Việt Nam', media: '', note: '', audio: '' },
      { pts: 'Câu hỏi 30 điểm', q: 'Trong một đoạn mạch xoay chiều chỉ có điện trở, nếu ta tăng điện áp hiệu dụng giữa hai đầu mạch lên thì công suất tỏa nhiệt thay đổi thế nào?', a: 'Tăng 8 lần', media: '', note: 'công thức P = U^2 / R', audio: '' },
      { pts: 'Câu hỏi 30 điểm', q: 'Trên trán cổng của ngôi đền nào ở Hồ Gươm có khắc ba chữ "Đắc Nguyệt Lâu"?', a: 'Đền Ngọc Sơn', media: '', note: '', audio: '' }
    ],
    luot2: [
      { pts: 'Câu hỏi 20 điểm', q: 'Đặt trên mặt bàn một chiếc điện thoại đang kêu chuông, vì sao khi áp tai vào mặt bàn nghe rõ hơn khi ở trong không khí?', a: 'vì chất rắn truyền âm tốt hơn chất khí.', media: '', note: '', audio: '' },
      { pts: 'Câu hỏi 20 điểm', q: 'Nếu xóa đi 1 trong 10 số nguyên dương liên tiếp thì tổng 9 số còn lại tận cùng bằng chữ số nào?', a: '9 (Tổng của 10 số nguyên dương liên tiếp luôn có tận cùng là 5)', media: '', note: '', audio: '' },
      { pts: 'Câu hỏi 20 điểm', q: '"Thằng nhãi con Tuyên Đức động binh không ngừng/ Đồ nhút nhát Thạnh, Thăng đem dầu chữa cháy". "Thạnh", "Thăng" trong câu chỉ những ai?', a: 'Mộc Thạnh, Liễu Thăng', media: '', note: '', audio: '' },
      { pts: 'Câu hỏi 30 điểm', q: 'Văn bia chùa Thiên ứng dựng đời vua Lê Thái Tông ghi lại sự hình thành của thương cảng phồn thịnh nào?', a: 'Phố Hiến (Hưng Yên)', media: '', note: '', audio: '' },
      { pts: 'Câu hỏi 30 điểm', q: '2 tỉnh nào có lượng mưa trung bình năm cao nhất và thấp nhất nước ta?', a: 'Thừa Thiên Huế (VQG Bạch Mã), Ninh Thuận', media: '', note: '', audio: '' },
      { pts: 'Câu hỏi 30 điểm', q: '"Thư sinh giết giặc bằng ngòi bút" là lời ca ngợi nhân dân dành cho nhà thơ nào?', a: 'Nguyễn Đình Chiểu', media: '', note: '', audio: '' }
    ],
    luot3: [
      { pts: 'Câu hỏi 20 điểm', q: '"Chuồn chuồn bay thấp thì mưa/ Bay cao thì nắng, bay vừa thì râm" phản ánh sự thay đổi của đại lượng nào?', a: 'Độ ẩm không khí', media: '', note: '', audio: '' },
      { pts: 'Câu hỏi 20 điểm', q: 'Kim Tôn là tên thường gọi thời thơ ấu của nhà văn tài hoa nào?', a: 'Nguyễn Tuân', media: '', note: '', audio: '' },
      { pts: 'Câu hỏi 20 điểm', q: 'Nếu hàm lượng nguyên tố Mo (Molipden) trong thực vật cao hơn bình thường có thể gây bệnh gì ở người?', a: 'gout (gút, thống phong)', media: '', note: '', audio: '' },
      { pts: 'Câu hỏi 30 điểm', q: 'Bà là một danh sĩ tài hoa sống vào thời Lê - Trịnh, tác giả bản dịch Chinh phụ ngâm khúc nổi tiếng?', a: 'Đoàn Thị Điểm', media: '', note: '', audio: '' },
      { pts: 'Câu hỏi 30 điểm', q: 'Trong các phát minh sau, (những) phát minh nào của Thomas Edison?', a: 'bóng đèn dây tóc và điện thoại', media: '', note: '', audio: '' },
      { pts: 'Câu hỏi 30 điểm', q: 'Bạn hãy trả lời câu hỏi sau bằng tiếng Anh.', a: 'Scorpion', media: '', note: 'Hi, I\'m Jeremy from Boston. Today, I have a question for you.', audio: '' }
    ],
    luot4: [
      { pts: 'Câu hỏi 20 điểm', q: 'Tìm hiệu của số nguyên tố lớn nhất có 1 chữ số với số nguyên tố nhỏ nhất có 1 chữ số?', a: '3', media: 'video.mp4', note: 'giang đẹp trai', audio: '' },
      { pts: 'Câu hỏi 20 điểm', q: 'Trong "Thi nhân Việt Nam", Hoài Thanh khi nhắc tới tác giả của bài "Chân quê" đã gọi ông là gì?', a: 'Nguyễn Bính', media: 'cnv.jpg', note: '', audio: '' },
      { pts: 'Câu hỏi 20 điểm', q: 'Trong sự phát triển của phôi thai người, cấu trúc khe mang gợi nhớ đến tổ tiên loài nào?', a: 'Cá', media: '', note: '', audio: 'tada.mp3' },
      { pts: 'Câu hỏi 30 điểm', q: 'Xe đạp và người đi xe máy cùng xuất phát từ A đến B...', a: '19,2 km/h', media: 'video.mp4', note: '', audio: '' },
      { pts: 'Câu hỏi 30 điểm', q: 'Có bao nhiêu vùng kinh tế ở nước ta không có cảng biển? Đó là vùng nào?', a: '1, Tây Nguyên', media: 'cnv.jpg', note: '', audio: '' },
      { pts: 'Câu hỏi 30 điểm', q: 'Cơ quan nào trong tế bào động vật đóng vai trò tiêu hóa nội bào?', a: 'Lisosome', media: '', note: '', audio: 'tada.mp3' }
    ]
  },
  cauHoiPhu: [
    { name: 'Câu hỏi phụ 1', q: 'nhiệt độ hà nội hôm nay', a: '20 độ' },
    { name: 'Câu hỏi phụ 2', q: 'nhiệt độ nghệ an hôm nay', a: '30 độ' },
    { name: 'Câu hỏi phụ 3', q: 'nhiệt độ thanh hóa hôm nay', a: '40 độ' }
  ]
};

export const excelService = {
  /**
   * Generates the blank or sample-filled Excel Template matching the exact 6-page PDF template
   * utilized by the official BTI competition software.
   */
  downloadOfficialTemplate(includeSampleData: boolean = true): void {
    const wb = XLSX.utils.book_new();

    // -------------------------------------------------------------
    // SHEET 1: KHỞI ĐỘNG (Lượt riêng 4 thí sinh + Lượt chung)
    // -------------------------------------------------------------
    const kdRows: any[][] = [
      ['KHỞI ĐỘNG'],
      ['Hướng dẫn: Nhập Câu hỏi và Đáp án tương ứng với các câu trong mỗi gói (từ trên xuống trong mỗi lượt). Nhập tên file ảnh, âm thanh (nếu có) tương ứng với vị trí của câu hỏi.'],
      ['LƯỢT RIÊNG']
    ];

    const tsNames = ['THÍ SINH 1', 'THÍ SINH 2', 'THÍ SINH 3', 'THÍ SINH 4'];
    const tsDataKeys = ['ts1', 'ts2', 'ts3', 'ts4'] as const;

    for (let tsIdx = 0; tsIdx < 4; tsIdx++) {
      kdRows.push([tsNames[tsIdx]]);
      kdRows.push(['', 'Câu hỏi', 'Đáp án', 'Ảnh (nếu có)', 'Âm thanh (nếu có)']);
      
      const list = includeSampleData 
        ? SAMPLE_BTI_EXCEL_DATA.khoiDong[tsDataKeys[tsIdx]] 
        : Array.from({ length: 6 }, () => ({ q: '', a: '', img: '', audio: '' }));

      list.forEach((item, i) => {
        kdRows.push([i + 1, item.q, item.a, item.img, item.audio]);
      });
    }

    // Lượt chung
    kdRows.push(['LƯỢT CHUNG']);
    kdRows.push(['', 'Câu hỏi', 'Đáp án', 'Ảnh (nếu có)', 'Âm thanh (nếu có)']);
    const chungList = includeSampleData
      ? SAMPLE_BTI_EXCEL_DATA.khoiDong.luotChung
      : Array.from({ length: 12 }, () => ({ q: '', a: '', img: '', audio: '' }));

    chungList.forEach((item, i) => {
      kdRows.push([i + 1, item.q, item.a, item.img, item.audio]);
    });

    const wsKd = XLSX.utils.aoa_to_sheet(kdRows);
    XLSX.utils.book_append_sheet(wb, wsKd, 'KHOI_DONG');

    // -------------------------------------------------------------
    // SHEET 2: VƯỢT CHƯỚNG NGẠI VẬT (B3=CNV, C3=Ảnh, 4 hàng ngang + trung tâm)
    // -------------------------------------------------------------
    const vcnv = SAMPLE_BTI_EXCEL_DATA.vuotCnv;
    const vcnvRows: any[][] = [
      ['VƯỢT CHƯỚNG NGẠI VẬT'],
      ['Hướng dẫn: Nhập Chướng ngại vật vào ô B3. Nhập tên ảnh Chướng ngại vật vào ô C3. Nhập câu hỏi và đáp án tương ứng theo mẫu dưới đây.'],
      ['CHƯỚNG NGẠI VẬT', includeSampleData ? vcnv.keyword : '', includeSampleData ? vcnv.imageFile : '', includeSampleData ? vcnv.piecesCount : '1'],
      ['', 'Câu hỏi', 'Đáp án', 'Âm thanh (nếu có)']
    ];

    const vcnvList = includeSampleData 
      ? vcnv.rows 
      : [
          { name: 'Hàng ngang 1', q: '', a: '', audio: '' },
          { name: 'Hàng ngang 2', q: '', a: '', audio: '' },
          { name: 'Hàng ngang 3', q: '', a: '', audio: '' },
          { name: 'Hàng ngang 4', q: '', a: '', audio: '' },
          { name: 'Hàng ngang trung tâm', q: '', a: '', audio: '' }
        ];

    vcnvList.forEach(r => {
      vcnvRows.push([r.name, r.q, r.a, r.audio]);
    });

    vcnvRows.push([]);
    vcnvRows.push([includeSampleData ? vcnv.explanation : 'Đây là giải thích về chướng ngại vật, có thể được mở trên app MC.']);

    const wsVcnv = XLSX.utils.aoa_to_sheet(vcnvRows);
    XLSX.utils.book_append_sheet(wb, wsVcnv, 'VUOT_CNV');

    // -------------------------------------------------------------
    // SHEET 3: TĂNG TỐC (Bảng 1: Câu hỏi & Đáp án, Bảng 2: Link Dữ Liệu Tăng Tốc)
    // -------------------------------------------------------------
    const tt = SAMPLE_BTI_EXCEL_DATA.tangToc;
    const ttRows: any[][] = [
      ['TĂNG TỐC'],
      ['Hướng dẫn: Nhập câu hỏi và Đáp án tương ứng với các câu hỏi. Nhập liệu ảnh Tăng tốc ở bên dưới. Cột Ảnh đáp án được dùng để nhập ảnh đáp án cho câu hỏi (nếu có).'],
      ['', 'Câu hỏi', 'Đáp án', 'Ảnh đáp án']
    ];

    const ttList = includeSampleData 
      ? tt.questions 
      : [
          { name: 'Tăng tốc 1', q: '', a: '', answerImg: '', mediaList: [''] },
          { name: 'Tăng tốc 2', q: '', a: '', answerImg: '', mediaList: [''] },
          { name: 'Tăng tốc 3', q: '', a: '', answerImg: '', mediaList: [''] },
          { name: 'Tăng tốc 4', q: '', a: '', answerImg: '', mediaList: [''] }
        ];

    ttList.forEach(item => {
      ttRows.push([item.name, item.q, item.a, item.answerImg]);
    });

    ttRows.push([]);
    ttRows.push(['LINK DỮ LIỆU TĂNG TỐC']);
    ttRows.push(['Nhập số lượng dữ liệu vào các ô B12 - H12(số lượng ảnh của mỗi câu). Tại các cột B, D, F, H từ dòng 13, nhập link của 1 ảnh ở mỗi dòng. Ví dụ: Câu Tăng tốc 4 có 20 ảnh thì nhập link 20 ảnh từ ô H13 - H32. Riêng câu 4 có thể dùng ảnh hoặc video, nếu là video thì để ô H12(số lượng) bằng 1. Không nhập dữ liệu vào ô được tô vàng.']);
    
    // Header for columns
    ttRows.push(['Vòng', 'Tăng tốc 1', '', 'Tăng tốc 2', '', 'Tăng tốc 3', '', 'Tăng tốc 4', '']);
    ttRows.push(['Số lượng ảnh', includeSampleData ? 1 : 0, '', includeSampleData ? 1 : 0, '', includeSampleData ? 1 : 0, '', includeSampleData ? 1 : 0, '']);
    
    // First media item
    ttRows.push([
      'Link ảnh', 
      includeSampleData ? ttList[0].mediaList[0] : '', '',
      includeSampleData ? ttList[1].mediaList[0] : '', '',
      includeSampleData ? ttList[2].mediaList[0] : '', '',
      includeSampleData ? ttList[3].mediaList[0] : '', ''
    ]);

    const wsTt = XLSX.utils.aoa_to_sheet(ttRows);
    XLSX.utils.book_append_sheet(wb, wsTt, 'TANG_TOC');

    // -------------------------------------------------------------
    // SHEET 4: VỀ ĐÍCH (Lượt 1, 2, 3, 4 với Mức điểm, Chú thích MC, Audio/Video)
    // -------------------------------------------------------------
    const vd = SAMPLE_BTI_EXCEL_DATA.veDich;
    const vdRows: any[][] = [
      ['VỀ ĐÍCH'],
      ['Hướng dẫn: Nhập Câu hỏi và Đáp án tương ứng với các mức điểm. Nhập tên file ảnh (nếu có) vào vị trí tương ứng. Lưu ý: Chú thích sẽ chỉ hiển thị trên giao diện MC và Host']
    ];

    const luotKeys = ['luot1', 'luot2', 'luot3', 'luot4'] as const;
    const luotTitles = ['LƯỢT 1', 'LƯỢT 2', 'LƯỢT 3', 'LƯỢT 4'];

    for (let lIdx = 0; lIdx < 4; lIdx++) {
      vdRows.push([luotTitles[lIdx]]);
      vdRows.push(['Mức điểm', 'Câu hỏi', 'Đáp án', 'Ảnh / Video (nếu có)', 'Chú thích', 'Âm thanh (nếu có)']);
      
      const list = includeSampleData 
        ? vd[luotKeys[lIdx]] 
        : Array.from({ length: 6 }, (_, i) => ({
            pts: i < 3 ? 'Câu hỏi 20 điểm' : 'Câu hỏi 30 điểm',
            q: '',
            a: '',
            media: '',
            note: '',
            audio: ''
          }));

      list.forEach(item => {
        vdRows.push([item.pts, item.q, item.a, item.media, item.note, item.audio]);
      });
    }

    const wsVd = XLSX.utils.aoa_to_sheet(vdRows);
    XLSX.utils.book_append_sheet(wb, wsVd, 'VE_DICH');

    // -------------------------------------------------------------
    // SHEET 5: CÂU HỎI PHỤ (Câu hỏi phụ 1, 2, 3...)
    // -------------------------------------------------------------
    const chpRows: any[][] = [
      ['CÂU HỎI PHỤ'],
      ['', 'Câu hỏi', 'Đáp án']
    ];

    const chpList = includeSampleData 
      ? SAMPLE_BTI_EXCEL_DATA.cauHoiPhu 
      : [
          { name: 'Câu hỏi phụ 1', q: '', a: '' },
          { name: 'Câu hỏi phụ 2', q: '', a: '' },
          { name: 'Câu hỏi phụ 3', q: '', a: '' }
        ];

    chpList.forEach(item => {
      chpRows.push([item.name, item.q, item.a]);
    });

    const wsChp = XLSX.utils.aoa_to_sheet(chpRows);
    XLSX.utils.book_append_sheet(wb, wsChp, 'CAU_HOI_PHU');

    // -------------------------------------------------------------
    // SHEET 6: VÒNG LOẠI BỘ GD&ĐT (Chuẩn 3 Phần: Trắc nghiệm 4 lựa chọn, Đúng/Sai 4 ý, Trả lời ngắn)
    // -------------------------------------------------------------
    const bgdRows: any[][] = [
      ['ĐỀ THI VÒNG LOẠI BTI 2026 - THEO QUY CHUẨN BỘ GIÁO DỤC & ĐÀO TẠO'],
      ['Khung năng lực số cho người học (Thông tư 02/2025/TT-BGDĐT)'],
      [],
      ['Mã câu', 'Phần thi', 'Nội dung câu hỏi', 'Phương án A / Ý a', 'Phương án B / Ý b', 'Phương án C / Ý c', 'Phương án D / Ý d', 'Đáp án đúng', 'Miền năng lực', 'Mức độ', 'Căn cứ pháp lý'],
      ['VL_01', 'Phần I: 4 lựa chọn', 'Khung năng lực số cho người học ban hành kèm Thông tư 02/2025/TT-BGDĐT gồm bao nhiêu miền?', '4 miền', '5 miền', '6 miền', '8 miền', 'C', 'MIEN_1', 'NHAN_BIET', 'Điều 1 TT 02/2025/TT-BGDĐT'],
      ['VL_02', 'Phần II: Đúng/Sai 4 ý', 'Về quy định bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP):', 'Họ tên là dữ liệu cá nhân cơ bản', 'Số tài khoản ngân hàng là dữ liệu cơ bản', 'Chủ thể dữ liệu có quyền yêu cầu xóa dữ liệu', 'Được phép bán dữ liệu nếu đã ẩn danh 1 phần', 'Đ - S - Đ - S', 'MIEN_4', 'THONG_HIEU', 'Điều 9 NĐ 13/2023/NĐ-CP'],
      ['VL_03', 'Phần III: Trả lời ngắn', 'Theo Thông tư 02/2025/TT-BGDĐT, viết tắt của Trí tuệ nhân tạo tạo sinh bằng tiếng Anh là gì?', '', '', '', '', 'Gen AI', 'MIEN_6', 'NHAN_BIET', 'Khoản 19 Điều 2 TT 02/2025/TT-BGDĐT']
    ];
    const wsBgd = XLSX.utils.aoa_to_sheet(bgdRows);
    XLSX.utils.book_append_sheet(wb, wsBgd, 'VONG_LOAI_BGD');

    const filename = includeSampleData 
      ? 'BTI2026_Mau_Excel_Kem_Du_Lieu_Mau.xlsx' 
      : 'BTI2026_Mau_Excel_Chuan_BanToChuc.xlsx';

    XLSX.writeFile(wb, filename);
  },

  downloadBlankTemplate(): void {
    this.downloadOfficialTemplate(false);
  },

  downloadSampleTemplate(): void {
    this.downloadOfficialTemplate(true);
  },

  /**
   * Export questions from the system to the official 5-sheet BTI Excel format
   */
  exportToBTIExcel(questions: QuestionItem[], stageName: string = 'Đề Thi BTI 2026'): void {
    const wb = XLSX.utils.book_new();

    // 1. SHEET: KHỞI ĐỘNG
    const kdQuestions = questions.filter(q => 
      q.round_name.includes('Khởi động') || 
      q.round_format?.startsWith('KHOI_DONG') ||
      q.round_format?.startsWith('KD_')
    );

    const kdRows: any[][] = [
      ['KHỞI ĐỘNG'],
      ['Hướng dẫn: Nhập Câu hỏi và Đáp án tương ứng với các câu trong mỗi gói (từ trên xuống trong mỗi lượt). Nhập tên file ảnh, âm thanh (nếu có) tương ứng với vị trí của câu hỏi.'],
      ['LƯỢT RIÊNG']
    ];

    const tsNames = ['THÍ SINH 1', 'THÍ SINH 2', 'THÍ SINH 3', 'THÍ SINH 4'];
    for (let ts = 1; ts <= 4; ts++) {
      kdRows.push([tsNames[ts - 1]]);
      kdRows.push(['', 'Câu hỏi', 'Đáp án', 'Ảnh (nếu có)', 'Âm thanh (nếu có)']);
      
      const tsQuestions = kdQuestions.filter(q => q.participant_slot === ts).slice(0, 6);
      const fallback = kdQuestions.slice((ts - 1) * 6, ts * 6);
      const items = tsQuestions.length > 0 ? tsQuestions : fallback;

      for (let i = 0; i < 6; i++) {
        const q = items[i];
        if (q) {
          kdRows.push([i + 1, q.question_text, q.correct_key, q.media_url || '', q.audio_url || '']);
        } else {
          kdRows.push([i + 1, '', '', '', '']);
        }
      }
    }

    // Lượt chung
    kdRows.push(['LƯỢT CHUNG']);
    kdRows.push(['', 'Câu hỏi', 'Đáp án', 'Ảnh (nếu có)', 'Âm thanh (nếu có)']);
    const chungQuestions = kdQuestions.filter(q => q.round_format === 'KHOI_DONG_CHUNG' || !q.participant_slot);
    const chungItems = chungQuestions.length > 0 ? chungQuestions : kdQuestions.slice(24);

    for (let i = 0; i < Math.max(chungItems.length, 12); i++) {
      const q = chungItems[i];
      if (q) {
        kdRows.push([i + 1, q.question_text, q.correct_key, q.media_url || '', q.audio_url || '']);
      } else {
        kdRows.push([i + 1, '', '', '', '']);
      }
    }

    const wsKd = XLSX.utils.aoa_to_sheet(kdRows);
    XLSX.utils.book_append_sheet(wb, wsKd, 'KHOI_DONG');

    // 2. SHEET: VƯỢT CHƯỚNG NGẠI VẬT
    const vcnvQuestions = questions.filter(q => 
      q.round_name.includes('Vượt Chướng Ngại Vật') || 
      q.round_type === 'VCNV' || 
      q.round_format?.startsWith('VCNV_')
    );

    const firstVcnv = vcnvQuestions[0];
    const opts = firstVcnv?.options || {};
    const obstacleKey = firstVcnv?.obstacle_info?.obstacleKey || firstVcnv?.correct_key || 'AN TOÀN THÔNG TIN';
    const obstacleImg = firstVcnv?.obstacle_info?.obstacleImage || firstVcnv?.media_url || 'cnv.jpg';
    
    // Check if there is risk question
    let obstacleExp = firstVcnv?.obstacle_info?.explanation || firstVcnv?.explanation || '';
    if (opts.riskQuestion || opts.riskAnswer) {
      obstacleExp = `[Ô MẠO HIỂM]: ${opts.riskQuestion || ''} ➔ ĐÁP ÁN: ${opts.riskAnswer || ''}. ${obstacleExp}`.trim();
    }
    if (!obstacleExp) {
      obstacleExp = 'Giải thích chướng ngại vật theo chuẩn ngân hàng câu hỏi BTI 2026.';
    }

    const vcnvRows: any[][] = [
      ['VƯỢT CHƯỚNG NGẠI VẬT'],
      ['Hướng dẫn: Nhập Chướng ngại vật vào ô B3. Nhập tên ảnh Chướng ngại vật vào ô C3. Nhập câu hỏi và đáp án tương ứng theo mẫu dưới đây.'],
      ['CHƯỚNG NGẠI VẬT', obstacleKey, obstacleImg, '1'],
      ['', 'Câu hỏi', 'Đáp án', 'Âm thanh (nếu có)']
    ];

    if (opts.clue1 || opts.ans1) {
      // 7-row packaged question
      vcnvRows.push(['Hàng ngang 1', opts.clue1 || '', opts.ans1 || '', '']);
      vcnvRows.push(['Hàng ngang 2', opts.clue2 || '', opts.ans2 || '', '']);
      vcnvRows.push(['Hàng ngang 3', opts.clue3 || '', opts.ans3 || '', '']);
      vcnvRows.push(['Hàng ngang 4', opts.clue4 || '', opts.ans4 || '', '']);
      vcnvRows.push(['Hàng ngang trung tâm', opts.centerText || '', opts.centerAnswer || '', '']);
    } else {
      const rowLabels = ['Hàng ngang 1', 'Hàng ngang 2', 'Hàng ngang 3', 'Hàng ngang 4', 'Hàng ngang trung tâm'];
      rowLabels.forEach((label, idx) => {
        const q = vcnvQuestions[idx];
        vcnvRows.push([label, q?.question_text || '', q?.correct_key || '', q?.audio_url || '']);
      });
    }

    vcnvRows.push([]);
    vcnvRows.push([obstacleExp]);

    const wsVcnv = XLSX.utils.aoa_to_sheet(vcnvRows);
    XLSX.utils.book_append_sheet(wb, wsVcnv, 'VUOT_CNV');

    // 3. SHEET: TĂNG TỐC (Tất cả là câu trả lời ngắn, tự động sắp xếp & đưa ra đáp án)
    const ttQuestions = questions.filter(q => 
      q.round_name.includes('Tăng tốc') || 
      q.round_format === 'TANG_TOC' || 
      q.round_format?.startsWith('TT_')
    );

    const ttRows: any[][] = [
      ['TĂNG TỐC'],
      ['Hướng dẫn: Nhập câu hỏi và Đáp án tương ứng với các câu hỏi. Nhập liệu ảnh Tăng tốc ở bên dưới. Cột Ảnh đáp án được dùng để nhập ảnh đáp án cho câu hỏi (nếu có).'],
      ['', 'Câu hỏi', 'Đáp án', 'Ảnh đáp án']
    ];

    for (let i = 1; i <= 4; i++) {
      const q = ttQuestions[i - 1];
      let formattedAnswer = q?.correct_key || '';

      // Tự động sắp xếp hoặc đưa ra đáp án dạng câu trả lời ngắn chuẩn xác
      if (q) {
        const qOpts = q.options || {};
        if (q.round_format === 'TT_SAP_XEP' || q.round_type === 'SEQUENCING') {
          // Chuỗi thứ tự ví dụ: B-C-A-D hoặc 1-3-2-4
          const steps = (q.correct_key || '').split(/[-,\s]+/).filter(Boolean);
          if (steps.length > 0 && Object.keys(qOpts).length > 0) {
            const stepDesc = steps.map((s, sIdx) => {
              const text = qOpts[s] || qOpts[s.toUpperCase()] || '';
              return `${sIdx + 1}. ${s.toUpperCase()}${text ? ` (${text})` : ''}`;
            }).join(' ➔ ');
            formattedAnswer = `${q.correct_key} (${stepDesc})`;
          }
        } else if (q.round_format === 'TT_TRAC_NGHIEM_6' || q.round_type === 'ELIMINATION_6') {
          // 6 phương án: đưa ra đáp án tự động: Key + nội dung
          const key = (q.correct_key || '').trim().toUpperCase();
          const optionText = qOpts[key] || '';
          formattedAnswer = optionText ? `${key}: ${optionText}` : key;
        }
      }

      ttRows.push([`Tăng tốc ${i}`, q?.question_text || '', formattedAnswer, q?.answer_media_url || '']);
    }

    ttRows.push([]);
    ttRows.push(['LINK DỮ LIỆU TĂNG TỐC']);
    ttRows.push(['Nhập số lượng dữ liệu vào các ô B12 - H12(số lượng ảnh của mỗi câu). Tại các cột B, D, F, H từ dòng 13, nhập link của 1 ảnh ở mỗi dòng. Ví dụ: Câu Tăng tốc 4 có 20 ảnh thì nhập link 20 ảnh từ ô H13 - H32. Riêng câu 4 có thể dùng ảnh hoặc video, nếu là video thì để ô H12(số lượng) bằng 1. Không nhập dữ liệu vào ô được tô vàng.']);
    
    ttRows.push(['Vòng', 'Tăng tốc 1', '', 'Tăng tốc 2', '', 'Tăng tốc 3', '', 'Tăng tốc 4', '']);
    ttRows.push([
      'Số lượng ảnh', 
      ttQuestions[0]?.media_links?.length || 1, '',
      ttQuestions[1]?.media_links?.length || 1, '',
      ttQuestions[2]?.media_links?.length || 1, '',
      ttQuestions[3]?.media_links?.length || 1, ''
    ]);

    ttRows.push([
      'Link ảnh',
      ttQuestions[0]?.media_links?.[0] || ttQuestions[0]?.media_url || 'tt1.png', '',
      ttQuestions[1]?.media_links?.[0] || ttQuestions[1]?.media_url || 'tt2.1.png', '',
      ttQuestions[2]?.media_links?.[0] || ttQuestions[2]?.media_url || 'tt3.jpg', '',
      ttQuestions[3]?.media_links?.[0] || ttQuestions[3]?.media_url || 'video.mp4', ''
    ]);

    const wsTt = XLSX.utils.aoa_to_sheet(ttRows);
    XLSX.utils.book_append_sheet(wb, wsTt, 'TANG_TOC');

    // 4. SHEET: VỀ ĐÍCH
    const vdQuestions = questions.filter(q => 
      q.round_name.includes('Về đích') || 
      q.round_format?.startsWith('VE_DICH') ||
      q.round_format === 'THUC_HANH_TINH_HUONG'
    );

    const vdRows: any[][] = [
      ['VỀ ĐÍCH'],
      ['Hướng dẫn: Nhập Câu hỏi và Đáp án tương ứng với các mức điểm. Nhập tên file ảnh (nếu có) vào vị trí tương ứng. Lưu ý: Chú thích sẽ chỉ hiển thị trên giao diện MC và Host']
    ];

    for (let l = 1; l <= 4; l++) {
      vdRows.push([`LƯỢT ${l}`]);
      vdRows.push(['Mức điểm', 'Câu hỏi', 'Đáp án', 'Ảnh / Video (nếu có)', 'Chú thích', 'Âm thanh (nếu có)']);
      
      const luotQs = vdQuestions.filter(q => q.participant_slot === l);
      const items = luotQs.length > 0 ? luotQs : vdQuestions.slice((l - 1) * 6, l * 6);

      for (let i = 0; i < 6; i++) {
        const q = items[i];
        if (q) {
          const ptsText = q.points ? `Câu hỏi ${q.points} điểm` : (i < 3 ? 'Câu hỏi 20 điểm' : 'Câu hỏi 30 điểm');
          vdRows.push([ptsText, q.question_text, q.correct_key, q.media_url || '', q.host_notes || q.explanation || '', q.audio_url || '']);
        } else {
          vdRows.push([i < 3 ? 'Câu hỏi 20 điểm' : 'Câu hỏi 30 điểm', '', '', '', '', '']);
        }
      }
    }

    const wsVd = XLSX.utils.aoa_to_sheet(vdRows);
    XLSX.utils.book_append_sheet(wb, wsVd, 'VE_DICH');

    // 5. SHEET: CÂU HỎI PHỤ
    const chpQuestions = questions.filter(q => 
      q.round_name.includes('phụ') || 
      q.round_format === 'CAU_HOI_PHU'
    );

    const chpRows: any[][] = [
      ['CÂU HỎI PHỤ'],
      ['', 'Câu hỏi', 'Đáp án']
    ];

    if (chpQuestions.length > 0) {
      chpQuestions.forEach((q, idx) => {
        chpRows.push([`Câu hỏi phụ ${idx + 1}`, q.question_text, q.correct_key]);
      });
    } else {
      chpRows.push(['Câu hỏi phụ 1', '', '']);
      chpRows.push(['Câu hỏi phụ 2', '', '']);
      chpRows.push(['Câu hỏi phụ 3', '', '']);
    }

    const wsChp = XLSX.utils.aoa_to_sheet(chpRows);
    XLSX.utils.book_append_sheet(wb, wsChp, 'CAU_HOI_PHU');

    // 6. SHEET: VÒNG LOẠI BỘ GD&ĐT
    const bgdQuestions = questions.filter(q => 
      q.stage === 'VONG_LOAI' || 
      q.round_format?.startsWith('BGD')
    );

    if (bgdQuestions.length > 0) {
      const bgdRows: any[][] = [
        ['ĐỀ THI VÒNG LOẠI BTI 2026 - THEO ĐỊNH DẠNG CHUẨN BỘ GIÁO DỤC & ĐÀO TẠO'],
        ['Áp dụng Khung năng lực số cho người học (Thông tư 02/2025/TT-BGDĐT)'],
        [],
        ['Mã câu', 'Phần thi (Bộ GD&ĐT)', 'Nội dung câu hỏi', 'Phương án A / Ý a', 'Phương án B / Ý b', 'Phương án C / Ý c', 'Phương án D / Ý d', 'Đáp án đúng', 'Miền năng lực', 'Mức độ nhận thức', 'Căn cứ văn bản pháp lý']
      ];

      bgdQuestions.forEach(q => {
        bgdRows.push([
          q.id,
          q.round_type === 'TRUE_FALSE_4' ? 'Phần II: Đúng/Sai 4 ý' : q.round_type === 'SHORT_ANSWER' ? 'Phần III: Trả lời ngắn' : 'Phần I: Trắc nghiệm 4 lựa chọn',
          q.question_text,
          q.options?.A || '',
          q.options?.B || '',
          q.options?.C || '',
          q.options?.D || '',
          q.correct_key,
          q.digital_competency_domain || 'MIEN_1',
          q.cognitive_level || 'THONG_HIEU',
          q.legal_reference || 'Thông tư 02/2025/TT-BGDĐT'
        ]);
      });

      const wsBgd = XLSX.utils.aoa_to_sheet(bgdRows);
      XLSX.utils.book_append_sheet(wb, wsBgd, 'VONG_LOAI_BGD');
    }

    const fileName = `BTI2026_NganHangDeThi_${stageName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  },

  /**
   * Parse uploaded Excel or CSV file with full support for the official BTI multi-sheet structure
   */
  async parseUploadedFile(file: File): Promise<ParseExcelResult> {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });

    const sheetNames = wb.SheetNames;
    const importedQuestions: QuestionItem[] = [];
    const warnings: string[] = [];
    const byRound: Record<string, number> = {};

    let detectedFormat: ParseExcelResult['detectedFormat'] = 'STANDARD_TABLE';

    // Normalize sheet names check
    const isKdSheet = (s: string) => s.toUpperCase().includes('KHOI_DONG') || s.toUpperCase().includes('KHỞI ĐỘNG') || s.toUpperCase().includes('KD');
    const isVcnvSheet = (s: string) => s.toUpperCase().includes('CNV') || s.toUpperCase().includes('VƯỢT') || s.toUpperCase().includes('CHƯỚNG NGẠI');
    const isTtSheet = (s: string) => s.toUpperCase().includes('TANG_TOC') || s.toUpperCase().includes('TĂNG TỐC') || s.toUpperCase().includes('TT');
    const isVdSheet = (s: string) => s.toUpperCase().includes('VE_DICH') || s.toUpperCase().includes('VỀ ĐÍCH') || s.toUpperCase().includes('VD');
    const isChpSheet = (s: string) => s.toUpperCase().includes('CAU_HOI_PHU') || s.toUpperCase().includes('CÂU HỎI PHỤ') || s.toUpperCase().includes('PHU');
    const isBgdSheet = (s: string) => s.toUpperCase().includes('VONG_LOAI') || s.toUpperCase().includes('BGD');

    const hasBtiOfficialSheets = sheetNames.some(s => isKdSheet(s) || isVcnvSheet(s) || isTtSheet(s) || isVdSheet(s) || isChpSheet(s));
    if (hasBtiOfficialSheets) {
      detectedFormat = 'BTI_OFFICIAL_MULTI_SHEET';
    }

    // Iterate through all sheets
    for (const sheetName of sheetNames) {
      const ws = wb.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      if (rows.length === 0) continue;

      // =========================================================================
      // 1. KHỞI ĐỘNG SHEET
      // =========================================================================
      if (isKdSheet(sheetName)) {
        let currentSection: 'TS1' | 'TS2' | 'TS3' | 'TS4' | 'CHUNG' | 'NONE' = 'NONE';
        let currentSlot = 1;

        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          const fullRowText = row.map(c => String(c || '').trim()).join(' ').toUpperCase();

          if (fullRowText.includes('THÍ SINH 1') || fullRowText.includes('TS 1')) {
            currentSection = 'TS1';
            currentSlot = 1;
            continue;
          } else if (fullRowText.includes('THÍ SINH 2') || fullRowText.includes('TS 2')) {
            currentSection = 'TS2';
            currentSlot = 2;
            continue;
          } else if (fullRowText.includes('THÍ SINH 3') || fullRowText.includes('TS 3')) {
            currentSection = 'TS3';
            currentSlot = 3;
            continue;
          } else if (fullRowText.includes('THÍ SINH 4') || fullRowText.includes('TS 4')) {
            currentSection = 'TS4';
            currentSlot = 4;
            continue;
          } else if (fullRowText.includes('LƯỢT CHUNG') || fullRowText.includes('CHUNG')) {
            currentSection = 'CHUNG';
            continue;
          }

          // Skip headers or empty lines
          if (fullRowText.includes('CÂU HỎI') && fullRowText.includes('ĐÁP ÁN')) continue;
          if (fullRowText.includes('HƯỚNG DẪN') || fullRowText === 'LƯỢT RIÊNG') continue;

          // Find question cell and answer cell
          // Columns typical layout: [STT, Câu hỏi, Đáp án, Ảnh, Âm thanh]
          const col1 = String(row[1] || '').trim();
          const col2 = String(row[2] || '').trim();
          const col3 = String(row[3] || '').trim();
          const col4 = String(row[4] || '').trim();

          const qText = col1.length > 5 ? col1 : (String(row[0] || '').length > 10 ? String(row[0] || '').trim() : '');
          const ansText = col1.length > 5 ? col2 : col1;
          const imgFile = col3;
          const audioFile = col4;

          if (qText && qText.length > 5 && ansText) {
            const isChung = currentSection === 'CHUNG';
            const roundName = isChung ? 'Vòng 1: Khởi động (Lượt chung)' : `Vòng 1: Khởi động (Lượt riêng - Thí sinh ${currentSlot})`;
            const item: QuestionItem = {
              id: `KD_${currentSection}_${importedQuestions.length + 1}`,
              round_name: roundName,
              round_type: 'SHORT_ANSWER',
              round_format: isChung ? 'KHOI_DONG_CHUNG' : 'KHOI_DONG_RIENG',
              category: 'Khởi động BTI 2026',
              question_text: qText,
              options: {},
              correct_key: ansText,
              explanation: `Lượt thi: ${roundName}`,
              time_limit: isChung ? 15 : 10,
              points: 10,
              participant_slot: isChung ? undefined : currentSlot,
              media_type: imgFile ? 'IMAGE' : (audioFile ? 'AUDIO' : 'NONE'),
              media_url: imgFile || undefined,
              audio_url: audioFile || undefined,
              stage: 'BAN_KET_1',
              cognitive_level: 'THONG_HIEU',
              digital_competency_domain: 'MIEN_1',
              approval_status: 'APPROVED',
              created_by: 'BTI Excel Template',
              created_at: Date.now()
            };
            importedQuestions.push(item);
            byRound[roundName] = (byRound[roundName] || 0) + 1;
          }
        }
        continue;
      }

      // =========================================================================
      // 2. VƯỢT CHƯỚNG NGẠI VẬT SHEET
      // =========================================================================
      if (isVcnvSheet(sheetName)) {
        let obstacleKeyword = 'CHƯỚNG NGẠI VẬT';
        let obstacleImg = '';
        let obstacleExp = '';

        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          const fullRowText = row.map(c => String(c || '').trim()).join(' ').toUpperCase();

          if (fullRowText.includes('CHƯỚNG NGẠI VẬT') && !fullRowText.includes('HƯỚNG DẪN')) {
            // Find keyword in row
            for (let c = 1; c < row.length; c++) {
              const val = String(row[c] || '').trim();
              if (val && !obstacleImg && (val.endsWith('.jpg') || val.endsWith('.png') || val.endsWith('.jpeg'))) {
                obstacleImg = val;
              } else if (val && val !== '1' && val.length > 1 && obstacleKeyword === 'CHƯỚNG NGẠI VẬT') {
                obstacleKeyword = val;
              }
            }
          }

          if (fullRowText.includes('GIẢI THÍCH VỀ CHƯỚNG NGẠI VẬT') || fullRowText.includes('APP MC')) {
            obstacleExp = row.join(' ').trim();
          }

          const label = String(row[0] || '').trim();
          const qText = String(row[1] || '').trim();
          const ans = String(row[2] || '').trim();
          const audio = String(row[3] || '').trim();

          if (label.toLowerCase().includes('hàng ngang') && qText.length > 5) {
            const isCenter = label.toLowerCase().includes('trung tâm');
            const roundFormat = isCenter ? 'VCNV_TRUNG_TAM' : 'VCNV_HANG_NGANG';
            const item: QuestionItem = {
              id: `VCNV_${importedQuestions.length + 1}`,
              round_name: `Vòng 2: VCNV (${label})`,
              round_type: 'VCNV',
              round_format: roundFormat,
              category: 'Vượt Chướng Ngại Vật BTI 2026',
              question_text: qText,
              options: {},
              correct_key: ans,
              explanation: `Gợi ý mở hàng ngang cho CNV: "${obstacleKeyword}"`,
              time_limit: 15,
              points: isCenter ? 40 : 10,
              audio_url: audio || undefined,
              obstacle_info: {
                obstacleKey: obstacleKeyword,
                obstacleImage: obstacleImg,
                explanation: obstacleExp
              },
              stage: 'BAN_KET_1',
              cognitive_level: 'THONG_HIEU',
              digital_competency_domain: 'MIEN_2',
              approval_status: 'APPROVED',
              created_by: 'BTI Excel Template',
              created_at: Date.now()
            };
            importedQuestions.push(item);
            byRound['Vòng 2: Vượt Chướng Ngại Vật'] = (byRound['Vòng 2: Vượt Chướng Ngại Vật'] || 0) + 1;
          }
        }
        continue;
      }

      // =========================================================================
      // 3. TĂNG TỐC SHEET
      // =========================================================================
      if (isTtSheet(sheetName)) {
        const ttQuestionItems: QuestionItem[] = [];

        // Parse Table 1: Tăng tốc 1..4
        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          const col0 = String(row[0] || '').trim();
          const col1 = String(row[1] || '').trim();
          const col2 = String(row[2] || '').trim();
          const col3 = String(row[3] || '').trim();

          if (col0.toLowerCase().includes('tăng tốc') && col1.length > 5) {
            const ttIndex = ttQuestionItems.length + 1;
            const time = ttIndex <= 2 ? 20 : 30;
            const item: QuestionItem = {
              id: `TT_${ttIndex}`,
              round_name: `Vòng 3: Tăng tốc (${col0})`,
              round_type: 'SEQUENCING',
              round_format: 'TANG_TOC',
              category: 'Tăng tốc BTI 2026',
              question_text: col1,
              options: {},
              correct_key: col2,
              answer_media_url: col3 || undefined,
              explanation: 'Phần thi Tăng Tốc tính điểm theo thời gian gửi câu trả lời (40 - 30 - 20 - 10 điểm)',
              time_limit: time,
              points: 40,
              stage: 'BAN_KET_1',
              cognitive_level: 'VAN_DUNG',
              digital_competency_domain: 'MIEN_3',
              approval_status: 'APPROVED',
              created_by: 'BTI Excel Template',
              created_at: Date.now()
            };
            ttQuestionItems.push(item);
          }

          // Parse Table 2: LINK DỮ LIỆU TĂNG TỐC
          if (col0.toLowerCase().includes('link ảnh') || col0.toLowerCase().includes('link')) {
            // Columns B, D, F, H
            const mediaCols = [1, 3, 5, 7];
            mediaCols.forEach((cIdx, i) => {
              const link = String(row[cIdx] || '').trim();
              if (link && ttQuestionItems[i]) {
                if (!ttQuestionItems[i].media_links) ttQuestionItems[i].media_links = [];
                ttQuestionItems[i].media_links!.push(link);
                ttQuestionItems[i].media_url = link;
                ttQuestionItems[i].media_type = link.endsWith('.mp4') ? 'VIDEO' : 'IMAGE';
              }
            });
          }
        }

        ttQuestionItems.forEach(q => {
          importedQuestions.push(q);
          byRound['Vòng 3: Tăng tốc'] = (byRound['Vòng 3: Tăng tốc'] || 0) + 1;
        });
        continue;
      }

      // =========================================================================
      // 4. VỀ ĐÍCH SHEET
      // =========================================================================
      if (isVdSheet(sheetName)) {
        let currentLuot = 1;

        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          const fullRowText = row.map(c => String(c || '').trim()).join(' ').toUpperCase();

          if (fullRowText.includes('LƯỢT 1')) currentLuot = 1;
          else if (fullRowText.includes('LƯỢT 2')) currentLuot = 2;
          else if (fullRowText.includes('LƯỢT 3')) currentLuot = 3;
          else if (fullRowText.includes('LƯỢT 4')) currentLuot = 4;

          // Header row skip
          if (fullRowText.includes('MỨC ĐIỂM') && fullRowText.includes('CÂU HỎI')) continue;
          if (fullRowText.includes('HƯỚNG DẪN')) continue;

          const ptsStr = String(row[0] || '').trim();
          const qText = String(row[1] || '').trim();
          const ans = String(row[2] || '').trim();
          const media = String(row[3] || '').trim();
          const note = String(row[4] || '').trim();
          const audio = String(row[5] || '').trim();

          if (qText.length > 5 && ans) {
            const pts = ptsStr.includes('30') ? 30 : ptsStr.includes('40') ? 40 : 20;
            const item: QuestionItem = {
              id: `VD_L${currentLuot}_${importedQuestions.length + 1}`,
              round_name: `Vòng 4: Về đích (Lượt ${currentLuot} - ${pts} điểm)`,
              round_type: 'SHORT_ANSWER',
              round_format: pts === 20 ? 'VE_DICH_20' : (pts === 30 ? 'VE_DICH_30' : 'VE_DICH_40'),
              category: 'Về đích BTI 2026',
              question_text: qText,
              options: {},
              correct_key: ans,
              host_notes: note || undefined,
              explanation: note || 'MC chú ý đối chiếu đáp án và cho quyền chuông nếu trả lời sai',
              media_type: media ? (media.endsWith('.mp4') ? 'VIDEO' : 'IMAGE') : (audio ? 'AUDIO' : 'NONE'),
              media_url: media || undefined,
              audio_url: audio || undefined,
              time_limit: pts === 20 ? 15 : (pts === 30 ? 20 : 30),
              points: pts,
              participant_slot: currentLuot,
              stage: 'BAN_KET_1',
              cognitive_level: pts >= 30 ? 'VAN_DUNG_CAO' : 'VAN_DUNG',
              digital_competency_domain: 'MIEN_4',
              approval_status: 'APPROVED',
              created_by: 'BTI Excel Template',
              created_at: Date.now()
            };
            importedQuestions.push(item);
            byRound['Vòng 4: Về đích'] = (byRound['Vòng 4: Về đích'] || 0) + 1;
          }
        }
        continue;
      }

      // =========================================================================
      // 5. CÂU HỎI PHỤ SHEET
      // =========================================================================
      if (isChpSheet(sheetName)) {
        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          const col0 = String(row[0] || '').trim();
          const col1 = String(row[1] || '').trim();
          const col2 = String(row[2] || '').trim();

          const qText = col1.length > 5 ? col1 : (col0.length > 10 ? col0 : '');
          const ans = col1.length > 5 ? col2 : col1;

          if (qText && qText.length > 5 && ans && !qText.toUpperCase().includes('CÂU HỎI')) {
            const item: QuestionItem = {
              id: `CHP_${importedQuestions.length + 1}`,
              round_name: 'Câu hỏi phụ (Tie-breaker)',
              round_type: 'SHORT_ANSWER',
              round_format: 'CAU_HOI_PHU',
              category: 'Câu hỏi phụ BTI 2026',
              question_text: qText,
              options: {},
              correct_key: ans,
              explanation: 'Câu hỏi phụ đấu loại trực tiếp trong 15 giây',
              time_limit: 15,
              points: 10,
              stage: 'BAN_KET_1',
              cognitive_level: 'THONG_HIEU',
              digital_competency_domain: 'MIEN_1',
              approval_status: 'APPROVED',
              created_by: 'BTI Excel Template',
              created_at: Date.now()
            };
            importedQuestions.push(item);
            byRound['Câu hỏi phụ'] = (byRound['Câu hỏi phụ'] || 0) + 1;
          }
        }
        continue;
      }

      // =========================================================================
      // 6. FALLBACK / GENERAL TABLE OR VÒNG LOẠI BỘ GD&ĐT
      // =========================================================================
      let headerIdx = -1;
      for (let r = 0; r < Math.min(rows.length, 10); r++) {
        const rowText = rows[r].join(' ').toLowerCase();
        if (rowText.includes('câu hỏi') || rowText.includes('question') || rowText.includes('nội dung')) {
          headerIdx = r;
          break;
        }
      }

      if (headerIdx === -1) headerIdx = 0;
      const headers = rows[headerIdx].map((h: any) => String(h || '').trim().toLowerCase());

      const qTextIdx = headers.findIndex(h => h.includes('câu hỏi') || h.includes('question') || h.includes('nội dung'));
      const ansIdx = headers.findIndex(h => h.includes('đáp án') || h.includes('answer') || h.includes('key'));
      const optAIdx = headers.findIndex(h => h === 'a' || h.includes('phương án a') || h.includes('ý a'));
      const optBIdx = headers.findIndex(h => h === 'b' || h.includes('phương án b') || h.includes('ý b'));
      const optCIdx = headers.findIndex(h => h === 'c' || h.includes('phương án c') || h.includes('ý c'));
      const optDIdx = headers.findIndex(h => h === 'd' || h.includes('phương án d') || h.includes('ý d'));
      const domainIdx = headers.findIndex(h => h.includes('miền') || h.includes('domain') || h.includes('năng lực'));
      const levelIdx = headers.findIndex(h => h.includes('mức độ') || h.includes('level') || h.includes('nhận thức'));
      const legalIdx = headers.findIndex(h => h.includes('pháp lý') || h.includes('căn cứ') || h.includes('legal'));

      for (let r = headerIdx + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;

        const qText = qTextIdx !== -1 ? String(row[qTextIdx] || '').trim() : '';
        if (!qText || qText.length < 5) continue;

        const ans = ansIdx !== -1 ? String(row[ansIdx] || '').trim() : 'A';
        const options: Record<string, string> = {};

        if (optAIdx !== -1 && row[optAIdx]) options.A = String(row[optAIdx]).trim();
        if (optBIdx !== -1 && row[optBIdx]) options.B = String(row[optBIdx]).trim();
        if (optCIdx !== -1 && row[optCIdx]) options.C = String(row[optCIdx]).trim();
        if (optDIdx !== -1 && row[optDIdx]) options.D = String(row[optDIdx]).trim();

        let roundType: any = Object.keys(options).length > 0 ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER';
        if (ans.includes('-') && (ans.includes('Đ') || ans.includes('S'))) {
          roundType = 'TRUE_FALSE_4';
        }

        let domain: any = 'MIEN_1';
        if (domainIdx !== -1 && row[domainIdx]) {
          const domStr = String(row[domainIdx]).toUpperCase();
          if (domStr.includes('1')) domain = 'MIEN_1';
          else if (domStr.includes('2')) domain = 'MIEN_2';
          else if (domStr.includes('3')) domain = 'MIEN_3';
          else if (domStr.includes('4')) domain = 'MIEN_4';
          else if (domStr.includes('5')) domain = 'MIEN_5';
          else if (domStr.includes('6')) domain = 'MIEN_6';
        }

        const legalRef = legalIdx !== -1 && row[legalIdx] ? String(row[legalIdx]).trim() : 'Thông tư 02/2025/TT-BGDĐT';
        const isBgd = isBgdSheet(sheetName);

        const newItem: QuestionItem = {
          id: `IMP_${Date.now().toString(36)}_${importedQuestions.length + 1}`,
          round_name: isBgd ? 'Vòng loại Bộ GD&ĐT' : 'Nhập khẩu từ bảng',
          round_type: roundType,
          round_format: isBgd 
            ? (roundType === 'TRUE_FALSE_4' ? 'BGD_TRUE_FALSE_4' : roundType === 'SHORT_ANSWER' ? 'BGD_SHORT_ANSWER' : 'BGD_MULTIPLE_CHOICE')
            : undefined,
          category: `Nhập từ ${sheetName}`,
          question_text: qText,
          options,
          correct_key: ans,
          explanation: `Nhập khẩu từ file: ${file.name} (Sheet: ${sheetName})`,
          time_limit: 30,
          stage: isBgd ? 'VONG_LOAI' : 'BAN_KET_1',
          cognitive_level: 'THONG_HIEU',
          digital_competency_domain: domain,
          legal_reference: legalRef,
          approval_status: 'APPROVED',
          created_by: 'Excel Import',
          created_at: Date.now()
        };

        importedQuestions.push(newItem);
        const key = newItem.round_name;
        byRound[key] = (byRound[key] || 0) + 1;
      }
    }

    if (importedQuestions.length === 0) {
      warnings.push('Không nhận diện được dòng câu hỏi hợp lệ nào trong tệp. Vui lòng kiểm tra định dạng hoặc tải mẫu Excel chuẩn.');
    }

    return {
      success: importedQuestions.length > 0,
      importedQuestions,
      detectedFormat,
      sheetNames,
      summary: {
        total: importedQuestions.length,
        byRound
      },
      warnings
    };
  },

  /**
   * Downloads a standardized CSV template with UTF-8 BOM encoding for seamless opening in Microsoft Excel.
   */
  downloadCsvTemplate(): void {
    const headers = [
      'STT',
      'Nội dung câu hỏi',
      'Phương án A',
      'Phương án B',
      'Phương án C',
      'Phương án D',
      'Đáp án đúng',
      'Giải thích chi tiết',
      'Giai đoạn',
      'Vòng thi / Phần thi',
      'Miền năng lực số',
      'Mức độ nhận thức',
      'Điểm số',
      'Thời gian (giây)',
      'Căn cứ pháp lý'
    ];

    const sampleRows = [
      [
        '1',
        'Theo Khung năng lực số cho người học (Thông tư 02/2025/TT-BGDĐT), hành vi nào sau đây thể hiện việc bảo vệ danh tính số an toàn?',
        'Sử dụng chung một mật khẩu đơn giản cho tất cả tài khoản mạng xã hội',
        'Kích hoạt xác thực 2 yếu tố (2FA) và không chia sẻ mã OTP với người khác',
        'Lưu mật khẩu ngân hàng trong ghi chú công khai trên điện thoại',
        'Nhấp vào tất cả đường link nhận được từ email người lạ',
        'B',
        'Kích hoạt xác thực 2 lớp (2FA) và bảo mật OTP là biện pháp bảo vệ danh tính số cốt lõi theo Miền 4.',
        'Vòng loại',
        'Phần I: Trắc nghiệm 4 lựa chọn',
        'Miền 4: An toàn và An ninh số',
        'Thông hiểu',
        '10',
        '30',
        'Thông tư 02/2025/TT-BGDĐT'
      ],
      [
        '2',
        'Giao thức mạng nào sau đây hoạt động ở tầng Transport và cung cấp kết nối tin cậy (Reliable Connection)?',
        'UDP (User Datagram Protocol)',
        'IP (Internet Protocol)',
        'TCP (Transmission Control Protocol)',
        'HTTP (Hypertext Transfer Protocol)',
        'C',
        'TCP cung cấp kết nối tin cậy với cơ chế bắt tay 3 bước (3-way handshake) và kiểm soát lỗi.',
        'Bán kết 1',
        'Vòng 1: Khởi động',
        'Miền 1: Dữ liệu và Thông tin',
        'Nhận biết',
        '10',
        '15',
        'Chuẩn kiến thức CNTT BTI 2026'
      ],
      [
        '3',
        'Thuật ngữ chỉ hành vi tạo lập các video, hình ảnh hoặc âm thanh giả mạo tinh vi bằng trí tuệ nhân tạo là gì?',
        '',
        '',
        '',
        '',
        'Deepfake',
        'Deepfake là công nghệ tổng hợp hình ảnh/âm thanh người bằng học sâu (Deep Learning).',
        'Chung kết',
        'Vòng 2: Vượt chướng ngại vật',
        'Miền 3: Sáng tạo nội dung số',
        'Vận dụng cao',
        '40',
        '15',
        'Luật An ninh mạng 2018'
      ]
    ];

    const csvRows = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...sampleRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ];

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Mau_Nhap_Lieu_Cau_Hoi_BTI2026_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Downloads a Standard Single-Sheet Excel template (.xlsx) with styled header cells and sample rows.
   */
  downloadStandardExcelTemplate(): void {
    const wb = XLSX.utils.book_new();

    const rows: any[][] = [
      [
        'Mã câu (Tùy chọn)',
        'Nội dung câu hỏi (*)',
        'Phương án A',
        'Phương án B',
        'Phương án C',
        'Phương án D',
        'Đáp án đúng (*)',
        'Giải thích chi tiết',
        'Giai đoạn (VONG_LOAI / BAN_KET_1 / CHUNG_KET)',
        'Phần thi / Vòng thi',
        'Miền năng lực (MIEN_1 -> MIEN_6)',
        'Mức độ (NHAN_BIET / THONG_HIEU / VAN_DUNG / VAN_DUNG_CAO)',
        'Điểm số',
        'Thời gian (giây)',
        'Căn cứ pháp lý'
      ],
      [
        'Q_BGD_001',
        'Theo Thông tư 02/2025/TT-BGDĐT, người học cần có năng lực đánh giá độ tin cậy của thông tin trên môi trường số thuộc Miền năng lực nào?',
        'Miền 1: Dữ liệu và thông tin',
        'Miền 2: Giao tiếp và hợp tác',
        'Miền 3: Sáng tạo nội dung số',
        'Miền 4: An toàn số',
        'A',
        'Đánh giá và phân tích dữ liệu/thông tin số thuộc phạm vi của Miền 1.',
        'VONG_LOAI',
        'Phần I: Trắc nghiệm 4 lựa chọn',
        'MIEN_1',
        'THONG_HIEU',
        10,
        30,
        'Thông tư 02/2025/TT-BGDĐT'
      ],
      [
        'Q_KD_002',
        'Giao thức nào mã hóa toàn bộ dữ liệu trao đổi giữa trình duyệt và máy chủ web bằng SSL/TLS?',
        'HTTP',
        'HTTPS',
        'FTP',
        'SMTP',
        'B',
        'HTTPS (Hypertext Transfer Protocol Secure) sử dụng cổng 443 và mã hóa SSL/TLS.',
        'BAN_KET_1',
        'Vòng 1: Khởi động',
        'MIEN_4',
        'NHAN_BIET',
        10,
        15,
        'Chuẩn An toàn thông tin BTI 2026'
      ],
      [
        'Q_VD_003',
        'Hãy nêu tên một phương pháp tấn công phi kỹ thuật (Social Engineering) giả mạo tổ chức uy tín qua email để lừa người dùng cung cấp mật khẩu.',
        '',
        '',
        '',
        '',
        'Phishing (Tấn công lừa đảo)',
        'Phishing là hình thức giả mạo phổ biến nhất nhằm đánh cắp thông tin đăng nhập.',
        'CHUNG_KET',
        'Vòng 4: Về đích',
        'MIEN_4',
        'VAN_DUNG_CAO',
        30,
        20,
        'Luật An toàn thông tin mạng'
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // ID
      { wch: 45 }, // Question
      { wch: 25 }, // Opt A
      { wch: 25 }, // Opt B
      { wch: 25 }, // Opt C
      { wch: 25 }, // Opt D
      { wch: 18 }, // Correct key
      { wch: 35 }, // Explanation
      { wch: 22 }, // Stage
      { wch: 25 }, // Round
      { wch: 20 }, // Domain
      { wch: 20 }, // Level
      { wch: 10 }, // Points
      { wch: 15 }, // Time
      { wch: 28 }  // Legal
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'NGAN_HANG_CAU_HOI_BTI');
    XLSX.writeFile(wb, `Mau_Excel_Nhap_Cau_Hoi_BTI2026_${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  parseExcelFile(file: File): Promise<ParseExcelResult> {
    return this.parseUploadedFile(file);
  },

  exportQuestionsToExcel(questions: QuestionItem[], filename?: string): void {
    this.exportToBTIExcel(questions, filename);
  }
};
