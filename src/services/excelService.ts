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

export type MappedQuestionField = 
  | 'id'
  | 'question_text'
  | 'option_a'
  | 'option_b'
  | 'option_c'
  | 'option_d'
  | 'option_e'
  | 'correct_key'
  | 'explanation'
  | 'cognitive_level'
  | 'digital_competency_domain'
  | 'points'
  | 'time_limit'
  | 'legal_reference'
  | 'round_name'
  | 'media_url'
  | 'audio_url'
  | 'distractor_script'
  | 'custom_constant'
  | 'unmapped';

export interface ColumnMappingItem {
  colIndex: number;
  originalHeader: string;
  mappedField: MappedQuestionField;
  constantValue?: string;
  sampleValues: string[];
  confidence?: number;
}

export interface CustomTemplateSheetBlueprint {
  sheetName: string;
  headerRowIndex: number;
  preHeaderRows: any[][];
  columns: ColumnMappingItem[];
  totalSampleRows: number;
}

export interface CustomTemplateBlueprint {
  id: string;
  name: string;
  analyzedAt: number;
  systemName?: string;
  aiSummary?: string;
  sheets: CustomTemplateSheetBlueprint[];
  targetSheetName: string;
}

export const MAPPED_FIELD_LABELS: Record<MappedQuestionField, string> = {
  id: 'Mã câu / STT',
  question_text: 'Nội dung câu hỏi (*)',
  option_a: 'Phương án A / Ý a',
  option_b: 'Phương án B / Ý b',
  option_c: 'Phương án C / Ý c',
  option_d: 'Phương án D / Ý d',
  option_e: 'Phương án E',
  correct_key: 'Đáp án đúng (*)',
  explanation: 'Lời giải chi tiết / Hướng dẫn',
  cognitive_level: 'Mức độ nhận thức',
  digital_competency_domain: 'Miền năng lực số',
  points: 'Điểm số',
  time_limit: 'Thời gian (giây)',
  legal_reference: 'Căn cứ pháp lý',
  round_name: 'Vòng thi / Phần thi',
  media_url: 'Ảnh / Video đính kèm',
  audio_url: 'File âm thanh',
  distractor_script: 'Kịch bản phương án sai / bẫy',
  custom_constant: 'Giá trị cố định',
  unmapped: 'Bỏ qua (Không sử dụng)'
};

/**
 * Intelligent Column Matcher using regex heuristics
 */
export function detectColumnField(headerText: string, sampleValues: string[] = []): { field: MappedQuestionField; confidence: number } {
  const norm = normVn(headerText).toLowerCase()
    .replace(/[*_#:]/g, ' ')
    .replace(/\s+/g, ' ');

  const origNorm = (headerText || '').toLowerCase().trim();

  // 1. Specific option columns
  if (/\b(phuong an a|dap an a|lua chon a|cau a|y a|option a)\b/i.test(norm) || /^(\(?)a(\)?)[\.\s:]*$/i.test(origNorm)) {
    return { field: 'option_a', confidence: 0.95 };
  }
  if (/\b(phuong an b|dap an b|lua chon b|cau b|y b|option b)\b/i.test(norm) || /^(\(?)b(\)?)[\.\s:]*$/i.test(origNorm)) {
    return { field: 'option_b', confidence: 0.95 };
  }
  if (/\b(phuong an c|dap an c|lua chon c|cau c|y c|option c)\b/i.test(norm) || /^(\(?)c(\)?)[\.\s:]*$/i.test(origNorm)) {
    return { field: 'option_c', confidence: 0.95 };
  }
  if (/\b(phuong an d|dap an d|lua chon d|cau d|y d|option d)\b/i.test(norm) || /^(\(?)d(\)?)[\.\s:]*$/i.test(origNorm)) {
    return { field: 'option_d', confidence: 0.95 };
  }
  if (/\b(phuong an e|dap an e|lua chon e|cau e|y e|option e)\b/i.test(norm) || /^(\(?)e(\)?)[\.\s:]*$/i.test(origNorm)) {
    return { field: 'option_e', confidence: 0.95 };
  }

  // 2. Question text
  if (/\b(cau hoi|noi dung|de bai|question|prompt|cau|de)\b/i.test(norm) && !norm.includes('ma cau') && !norm.includes('so cau')) {
    return { field: 'question_text', confidence: 0.95 };
  }

  // 3. Correct answer
  if (/\b(dap an dung|dap an chuan|dap an chinh xac|khoa dap an|correct answer|correct key|key dap an|correct)\b/i.test(norm) ||
      /^(\(?)dap an(\)?)[\.\s:]*$/i.test(norm) || /^(\(?)key(\)?)[\.\s:]*$/i.test(norm) || /^(\(?)ket qua(\)?)[\.\s:]*$/i.test(norm)) {
    return { field: 'correct_key', confidence: 0.95 };
  }

  // 4. Explanation / Solution
  if (/\b(giai thich|loi giai|huong dan giai|huong dan|chu thich|explanation|solution|feedback)\b/i.test(norm)) {
    return { field: 'explanation', confidence: 0.9 };
  }

  // 5. Distractor Script / Phương án sai
  if (/\b(kich ban sai|phuong an sai|kich ban|phan bien|bay|distractor)\b/i.test(norm)) {
    return { field: 'distractor_script', confidence: 0.9 };
  }

  // 6. Cognitive Level / Mức độ nhận thức
  if (/\b(muc do|nhan thuc|do kho|cognitive|level|bloom|cap do)\b/i.test(norm)) {
    return { field: 'cognitive_level', confidence: 0.9 };
  }

  // 7. Domain / Miền năng lực
  if (/\b(mien|nang luc|chu de|chuyen de|domain|competency|linh vuc)\b/i.test(norm)) {
    return { field: 'digital_competency_domain', confidence: 0.9 };
  }

  // 8. Points
  if (/\b(diem|diem so|muc diem|thang diem|point|points|score)\b/i.test(norm)) {
    return { field: 'points', confidence: 0.9 };
  }

  // 9. Time limit
  if (/\b(thoi gian|thoi luong|giay|time|seconds|duration)\b/i.test(norm)) {
    return { field: 'time_limit', confidence: 0.9 };
  }

  // 10. Legal reference
  if (/\b(can cu|phap ly|thong tu|nghi dinh|luat|legal|reference)\b/i.test(norm)) {
    return { field: 'legal_reference', confidence: 0.9 };
  }

  // 11. Round name / Stage
  if (/\b(vong thi|phan thi|giai doan|danh muc|loai cau|round|stage|category)\b/i.test(norm)) {
    return { field: 'round_name', confidence: 0.85 };
  }

  // 12. Media / Audio
  if (/\b(am thanh|audio|mp3|wav|sound)\b/i.test(norm)) {
    return { field: 'audio_url', confidence: 0.9 };
  }
  if (/\b(anh|hinh anh|media|video|image|photo|picture)\b/i.test(norm)) {
    return { field: 'media_url', confidence: 0.9 };
  }

  // 13. ID / STT
  if (/\b(stt|so thu tu|ma cau|ma|id|code|no)\b/i.test(norm)) {
    return { field: 'id', confidence: 0.9 };
  }

  // Fallback: Check sample values
  if (sampleValues.length > 0) {
    const s0 = (sampleValues[0] || '').trim();
    if (s0.length > 30) {
      return { field: 'question_text', confidence: 0.6 };
    }
    const s0Norm = normVn(s0);
    if (s0Norm.includes('HANG NGANG') || s0Norm.includes('TANG TOC') || s0Norm.includes('THI SINH') || s0Norm.includes('CAU HOI PHU') || s0Norm.includes('VONG')) {
      return { field: 'round_name', confidence: 0.85 };
    }
    // Sequential integers like 1, 2, 3 -> STT (id)
    if (/^\d+$/.test(s0) && Number(s0) <= 50) {
      return { field: 'id', confidence: 0.8 };
    }
    if (/^[A-D]$/i.test(s0)) {
      return { field: 'correct_key', confidence: 0.6 };
    }
    if (/^\d+$/.test(s0) && Number(s0) <= 100) {
      return { field: 'points', confidence: 0.5 };
    }
  }

  return { field: 'unmapped', confidence: 0.1 };
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

/**
 * Vietnamese diacritic normalization supporting Latin D/Đ
 */
export function normVn(str: string): string {
  return String(str || '')
    .trim()
    .toUpperCase()
    .replace(/Đ/g, 'D')
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Strips directory prefixes and URLs, leaving only pure media file names (e.g. "image.jpg")
 * compliant with the BTI competition software which auto-resolves paths within Media/ subfolders.
 */
export function cleanMediaFileName(raw?: string): string {
  if (!raw) return '';
  let str = String(raw).trim().replace(/^["']|["']$/g, '').replace(/\\/g, '/');
  if (str.includes('/')) {
    const parts = str.split('/').filter(Boolean);
    str = parts[parts.length - 1] || str;
  }
  return str.trim();
}

export const isKdSheet = (s: string) => {
  const norm = normVn(s);
  return norm.includes('KHOI DONG') || norm === 'KD' || norm.startsWith('KD');
};

export const isVcnvSheet = (s: string) => {
  const norm = normVn(s);
  return norm.includes('CNV') || norm.includes('VUOT') || norm.includes('CHUONG NGAI') || norm === 'VCNV';
};

export const isTtSheet = (s: string) => {
  const norm = normVn(s);
  return norm.includes('TANG TOC') || norm === 'TT' || norm.startsWith('TT');
};

export const isVdSheet = (s: string) => {
  const norm = normVn(s);
  return norm.includes('VE DICH') || norm === 'VD' || norm.startsWith('VD');
};

export const isChpSheet = (s: string) => {
  const norm = normVn(s);
  return norm.includes('CAU HOI PHU') || norm.includes('PHU') || norm === 'CHP';
};

export const isBgdSheet = (s: string) => {
  const norm = normVn(s);
  return norm.includes('VONG LOAI') || norm.includes('BGD') || norm.includes('BO GIAO DUC');
};

export interface StackedBtiSection {
  section: 'KD' | 'VCNV' | 'TT' | 'VD' | 'CHP';
  startRow: number;
  endRow: number;
}

export function detectStackedBtiSections(rows: any[][], minDistinct: number = 2): StackedBtiSection[] {
  const anchors: { section: StackedBtiSection['section']; row: number }[] = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    
    const c0 = normVn(row[0]);
    const firstNonEmpty = normVn(row.find(c => String(c).trim() !== ''));
    const target = c0 || firstNonEmpty;

    if (target === 'KHOI DONG' || target.startsWith('PHAN THI KHOI DONG') || target === 'PHAN 1: KHOI DONG') {
      anchors.push({ section: 'KD', row: r });
    } else if (target === 'VUOT CHUONG NGAI VAT' || target.startsWith('PHAN THI VUOT CHUONG NGAI VAT') || target === 'PHAN 2: VUOT CHUONG NGAI VAT') {
      anchors.push({ section: 'VCNV', row: r });
    } else if (target === 'TANG TOC' || target.startsWith('PHAN THI TANG TOC') || target === 'PHAN 3: TANG TOC') {
      anchors.push({ section: 'TT', row: r });
    } else if (target === 'VE DICH' || target.startsWith('PHAN THI VE DICH') || target === 'PHAN 4: VE DICH') {
      anchors.push({ section: 'VD', row: r });
    } else if (target === 'CAU HOI PHU' || target.startsWith('PHAN THI CAU HOI PHU') || target === 'PHAN 5: CAU HOI PHU') {
      anchors.push({ section: 'CHP', row: r });
    }
  }

  const distinct = new Set(anchors.map(a => a.section));
  if (distinct.size < minDistinct) return [];

  const result: StackedBtiSection[] = [];
  for (let i = 0; i < anchors.length; i++) {
    const cur = anchors[i];
    const nextRow = i + 1 < anchors.length ? anchors[i + 1].row : rows.length;
    result.push({
      section: cur.section,
      startRow: cur.row,
      endRow: nextRow
    });
  }

  return result;
}

export function parseBtiKdRows(rows: any[][]): QuestionItem[] {
  const items: QuestionItem[] = [];
  let currentSection: 'TS1' | 'TS2' | 'TS3' | 'TS4' | 'CHUNG' | 'NONE' = 'NONE';
  let currentSlot = 1;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    const fullRowText = normVn(row.map(c => String(c || '').trim()).join(' '));

    if (fullRowText.includes('THI SINH 1') || fullRowText.includes('TS 1')) {
      currentSection = 'TS1';
      currentSlot = 1;
      continue;
    } else if (fullRowText.includes('THI SINH 2') || fullRowText.includes('TS 2')) {
      currentSection = 'TS2';
      currentSlot = 2;
      continue;
    } else if (fullRowText.includes('THI SINH 3') || fullRowText.includes('TS 3')) {
      currentSection = 'TS3';
      currentSlot = 3;
      continue;
    } else if (fullRowText.includes('THI SINH 4') || fullRowText.includes('TS 4')) {
      currentSection = 'TS4';
      currentSlot = 4;
      continue;
    } else if (fullRowText.includes('LUOT CHUNG') || fullRowText.includes('CHUNG')) {
      currentSection = 'CHUNG';
      continue;
    }

    if (fullRowText.includes('CAU HOI') && fullRowText.includes('DAP AN')) continue;
    if (fullRowText.includes('HUONG DAN') || fullRowText === 'LUOT RIENG' || fullRowText === 'KHOI DONG') continue;

    const col1 = String(row[1] || '').trim();
    const col2 = String(row[2] || '').trim();
    const col3 = String(row[3] || '').trim();
    const col4 = String(row[4] || '').trim();

    const qText = col1.length > 5 ? col1 : (String(row[0] || '').length > 10 ? String(row[0] || '').trim() : '');
    const ansText = col1.length > 5 ? col2 : (col1 || col2);
    const imgFile = cleanMediaFileName(col3);
    const audioFile = cleanMediaFileName(col4);

    if (qText && qText.length > 3 && ansText) {
      const isChung = currentSection === 'CHUNG';
      const roundName = isChung ? 'Vòng 1: Khởi động (Lượt chung)' : `Vòng 1: Khởi động (Lượt riêng - Thí sinh ${currentSlot})`;
      items.push({
        id: `KD_${currentSection}_${items.length + 1}`,
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
      });
    }
  }
  return items;
}

export function parseBtiVcnvRows(rows: any[][]): QuestionItem[] {
  const items: QuestionItem[] = [];
  let obstacleKeyword = 'CHƯỚNG NGẠI VẬT';
  let obstacleImg = '';
  let obstacleExp = '';

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    const fullRowText = normVn(row.map(c => String(c || '').trim()).join(' '));

    if (fullRowText.includes('CHUONG NGAI VAT') && !fullRowText.includes('HUONG DAN')) {
      for (let c = 1; c < row.length; c++) {
        const val = String(row[c] || '').trim();
        if (val && !obstacleImg && (val.endsWith('.jpg') || val.endsWith('.png') || val.endsWith('.jpeg') || val.endsWith('.webp'))) {
          obstacleImg = cleanMediaFileName(val);
        } else if (val && val !== '1' && val.length > 1 && obstacleKeyword === 'CHƯỚNG NGẠI VẬT') {
          obstacleKeyword = val;
        }
      }
    }

    if (fullRowText.includes('GIAI THICH') || fullRowText.includes('APP MC') || fullRowText.includes('DAY LA GIAI THICH')) {
      obstacleExp = row.map(c => String(c || '').trim()).filter(Boolean).join(' ').trim();
    }

    const label = String(row[0] || '').trim();
    const qText = String(row[1] || '').trim();
    const ans = String(row[2] || '').trim();
    const audio = cleanMediaFileName(String(row[3] || '').trim());

    if (normVn(label).includes('HANG NGANG') && qText.length > 3) {
      const isCenter = normVn(label).includes('TRUNG TAM');
      const roundFormat = isCenter ? 'VCNV_TRUNG_TAM' : 'VCNV_HANG_NGANG';
      items.push({
        id: `VCNV_${items.length + 1}`,
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
      });
    }
  }
  return items;
}

export function parseBtiTtRows(rows: any[][]): QuestionItem[] {
  const ttQuestionItems: QuestionItem[] = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    const col2 = String(row[2] || '').trim();
    const col3 = cleanMediaFileName(String(row[3] || '').trim());

    if (normVn(col0).includes('TANG TOC') && col1.length > 3) {
      const ttIndex = ttQuestionItems.length + 1;
      const time = ttIndex <= 2 ? 20 : 30;
      ttQuestionItems.push({
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
      });
    }

    if (normVn(col0).includes('LINK ANH') || normVn(col0).includes('LINK DU LIEU') || normVn(col0).includes('LINK')) {
      const mediaCols = [1, 3, 5, 7];
      mediaCols.forEach((cIdx, i) => {
        const link = cleanMediaFileName(String(row[cIdx] || '').trim());
        if (link && ttQuestionItems[i]) {
          if (!ttQuestionItems[i].media_links) ttQuestionItems[i].media_links = [];
          ttQuestionItems[i].media_links!.push(link);
          if (!ttQuestionItems[i].media_url) {
            ttQuestionItems[i].media_url = link;
            ttQuestionItems[i].media_type = link.endsWith('.mp4') ? 'VIDEO' : 'IMAGE';
          }
        }
      });
    }
  }
  return ttQuestionItems;
}

export function parseBtiVdAndChpRows(rows: any[][]): { vdQuestions: QuestionItem[]; chpQuestions: QuestionItem[] } {
  const vdQuestions: QuestionItem[] = [];
  const chpQuestions: QuestionItem[] = [];
  let currentLuot = 1;
  let inChpSection = false;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    const fullRowText = normVn(row.map(c => String(c || '').trim()).join(' '));

    if (fullRowText.includes('CAU HOI PHU')) {
      inChpSection = true;
      continue;
    }

    if (inChpSection) {
      if (fullRowText.includes('CAU HOI') && fullRowText.includes('DAP AN')) continue;
      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();
      const col2 = String(row[2] || '').trim();

      const qText = col1.length > 3 ? col1 : (col0.length > 5 && !normVn(col0).includes('CAU HOI PHU') ? col0 : '');
      const ans = col1.length > 3 ? col2 : col1;

      if (qText && qText.length > 3 && ans && !normVn(qText).includes('CAU HOI')) {
        chpQuestions.push({
          id: `CHP_${chpQuestions.length + 1}`,
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
        });
      }
      continue;
    }

    if (fullRowText.includes('LUOT 1')) currentLuot = 1;
    else if (fullRowText.includes('LUOT 2')) currentLuot = 2;
    else if (fullRowText.includes('LUOT 3')) currentLuot = 3;
    else if (fullRowText.includes('LUOT 4')) currentLuot = 4;

    if (fullRowText.includes('MUC DIEM') && fullRowText.includes('CAU HOI')) continue;
    if (fullRowText.includes('HUONG DAN') || fullRowText === 'VE DICH') continue;

    const ptsStr = String(row[0] || '').trim();
    const qText = String(row[1] || '').trim();
    const ans = String(row[2] || '').trim();
    const media = cleanMediaFileName(String(row[3] || '').trim());
    const note = String(row[4] || '').trim();
    const audio = cleanMediaFileName(String(row[5] || '').trim());

    if (qText.length > 3 && ans) {
      const pts = ptsStr.includes('30') ? 30 : ptsStr.includes('40') ? 40 : 20;
      vdQuestions.push({
        id: `VD_L${currentLuot}_${vdQuestions.length + 1}`,
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
      });
    }
  }

  return { vdQuestions, chpQuestions };
}

export function parseBtiChpRows(rows: any[][]): QuestionItem[] {
  const items: QuestionItem[] = [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    const col2 = String(row[2] || '').trim();

    const qText = col1.length > 3 ? col1 : (col0.length > 5 && !normVn(col0).includes('CAU HOI PHU') ? col0 : '');
    const ans = col1.length > 3 ? col2 : col1;

    if (qText && qText.length > 3 && ans && !normVn(qText).includes('CAU HOI')) {
      items.push({
        id: `CHP_${items.length + 1}`,
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
      });
    }
  }
  return items;
}

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
    XLSX.utils.book_append_sheet(wb, wsKd, 'Khởi động');

    // -------------------------------------------------------------
    // SHEET 2: VƯỢT CHƯỚNG NGẠI VẬT (B3=CNV, C3=Ảnh, 4 hàng ngang + trung tâm)
    // -------------------------------------------------------------
    const vcnv = SAMPLE_BTI_EXCEL_DATA.vuotCnv;
    const vcnvRows: any[][] = [
      ['VƯỢT CHƯỚNG NGẠI VẬT'],
      ['Hướng dẫn: Nhập Chướng ngại vật vào ô B3. Nhập tên ảnh Chướng ngại vật vào ô C3. Nhập câu hỏi và đáp án tương ứng theo mẫu dưới đây.'],
      ['CHƯỚNG NGẠI VẬT', includeSampleData ? vcnv.keyword : '', includeSampleData ? cleanMediaFileName(vcnv.imageFile) : '', includeSampleData ? vcnv.piecesCount : '1'],
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
      vcnvRows.push([r.name, r.q, r.a, cleanMediaFileName(r.audio)]);
    });

    vcnvRows.push([]);
    vcnvRows.push([includeSampleData ? vcnv.explanation : 'Đây là giải thích về chướng ngại vật, có thể được mở trên app MC.']);

    const wsVcnv = XLSX.utils.aoa_to_sheet(vcnvRows);
    XLSX.utils.book_append_sheet(wb, wsVcnv, 'Vượt chướng ngại vật');

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
      ttRows.push([item.name, item.q, item.a, cleanMediaFileName(item.answerImg)]);
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
      includeSampleData ? cleanMediaFileName(ttList[0].mediaList[0]) : '', '',
      includeSampleData ? cleanMediaFileName(ttList[1].mediaList[0]) : '', '',
      includeSampleData ? cleanMediaFileName(ttList[2].mediaList[0]) : '', '',
      includeSampleData ? cleanMediaFileName(ttList[3].mediaList[0]) : '', ''
    ]);

    const wsTt = XLSX.utils.aoa_to_sheet(ttRows);
    XLSX.utils.book_append_sheet(wb, wsTt, 'Tăng tốc');

    // -------------------------------------------------------------
    // SHEET 4: VỀ ĐÍCH (Lượt 1, 2, 3, 4 với Mức điểm, Chú thích MC, Audio/Video & Câu hỏi phụ)
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
        vdRows.push([item.pts, item.q, item.a, cleanMediaFileName(item.media), item.note, cleanMediaFileName(item.audio)]);
      });
    }

    // Append CÂU HỎI PHỤ into Về đích sheet matching the official BTI template file
    vdRows.push([]);
    vdRows.push(['CÂU HỎI PHỤ']);
    vdRows.push(['', 'Câu hỏi', 'Đáp án']);
    const chpList = includeSampleData 
      ? SAMPLE_BTI_EXCEL_DATA.cauHoiPhu 
      : [
          { name: 'Câu hỏi phụ 1', q: '', a: '' },
          { name: 'Câu hỏi phụ 2', q: '', a: '' },
          { name: 'Câu hỏi phụ 3', q: '', a: '' }
        ];

    chpList.forEach(item => {
      vdRows.push([item.name, item.q, item.a]);
    });

    const wsVd = XLSX.utils.aoa_to_sheet(vdRows);
    XLSX.utils.book_append_sheet(wb, wsVd, 'Về đích');

    // -------------------------------------------------------------
    // SHEET 5: CÂU HỎI PHỤ (Trang tính riêng tiện dụng)
    // -------------------------------------------------------------
    const chpRows: any[][] = [
      ['CÂU HỎI PHỤ'],
      ['', 'Câu hỏi', 'Đáp án']
    ];

    chpList.forEach(item => {
      chpRows.push([item.name, item.q, item.a]);
    });

    const wsChp = XLSX.utils.aoa_to_sheet(chpRows);
    XLSX.utils.book_append_sheet(wb, wsChp, 'Câu hỏi phụ');

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
    XLSX.utils.book_append_sheet(wb, wsBgd, 'Vòng loại Bộ GD&ĐT');

    const filename = includeSampleData 
      ? 'Đề thi_KemDuLieuMau.xlsx' 
      : 'Đề thi.xlsx';

    XLSX.writeFile(wb, filename);
  },

  downloadBlankTemplate(): void {
    this.downloadOfficialTemplate(false);
  },

  downloadSampleTemplate(): void {
    this.downloadOfficialTemplate(true);
  },

  /**
   * Export questions from the system to the official BTI Excel format ("Đề thi.xlsx")
   */
  exportToBTIExcel(questions: QuestionItem[], stageName: string = 'Đề thi.xlsx'): void {
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
          kdRows.push([i + 1, q.question_text, q.correct_key, cleanMediaFileName(q.media_url), cleanMediaFileName(q.audio_url)]);
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
        kdRows.push([i + 1, q.question_text, q.correct_key, cleanMediaFileName(q.media_url), cleanMediaFileName(q.audio_url)]);
      } else {
        kdRows.push([i + 1, '', '', '', '']);
      }
    }

    const wsKd = XLSX.utils.aoa_to_sheet(kdRows);
    XLSX.utils.book_append_sheet(wb, wsKd, 'Khởi động');

    // 2. SHEET: VƯỢT CHƯỚNG NGẠI VẬT
    const vcnvQuestions = questions.filter(q => 
      q.round_name.includes('Vượt Chướng Ngại Vật') || 
      q.round_type === 'VCNV' || 
      q.round_format?.startsWith('VCNV_')
    );

    const firstVcnv = vcnvQuestions[0];
    const opts = firstVcnv?.options || {};
    const obstacleKey = firstVcnv?.obstacle_info?.obstacleKey || firstVcnv?.correct_key || 'AN TOÀN THÔNG TIN';
    const obstacleImg = cleanMediaFileName(firstVcnv?.obstacle_info?.obstacleImage || firstVcnv?.media_url || 'cnv.jpg');
    
    // Check if there is risk question
    let obstacleExp = firstVcnv?.obstacle_info?.explanation || firstVcnv?.explanation || '';
    if (opts.riskQuestion || opts.riskAnswer) {
      obstacleExp = `[Ô MẠO HIỂM]: ${opts.riskQuestion || ''} ➔ ĐÁP ÁN: ${opts.riskAnswer || ''}. ${obstacleExp}`.trim();
    }
    if (!obstacleExp) {
      obstacleExp = 'Đây là giải thích về chướng ngại vật, có thể được mở trên app MC.';
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
        vcnvRows.push([label, q?.question_text || '', q?.correct_key || '', cleanMediaFileName(q?.audio_url)]);
      });
    }

    vcnvRows.push([]);
    vcnvRows.push([obstacleExp]);

    const wsVcnv = XLSX.utils.aoa_to_sheet(vcnvRows);
    XLSX.utils.book_append_sheet(wb, wsVcnv, 'Vượt chướng ngại vật');

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

      ttRows.push([`Tăng tốc ${i}`, q?.question_text || '', formattedAnswer, cleanMediaFileName(q?.answer_media_url)]);
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
      cleanMediaFileName(ttQuestions[0]?.media_links?.[0] || ttQuestions[0]?.media_url || 'tt1.png'), '',
      cleanMediaFileName(ttQuestions[1]?.media_links?.[0] || ttQuestions[1]?.media_url || 'tt2.1.png'), '',
      cleanMediaFileName(ttQuestions[2]?.media_links?.[0] || ttQuestions[2]?.media_url || 'tt3.jpg'), '',
      cleanMediaFileName(ttQuestions[3]?.media_links?.[0] || ttQuestions[3]?.media_url || 'video.mp4'), ''
    ]);

    const wsTt = XLSX.utils.aoa_to_sheet(ttRows);
    XLSX.utils.book_append_sheet(wb, wsTt, 'Tăng tốc');

    // 4. SHEET: VỀ ĐÍCH
    const vdQuestions = questions.filter(q => 
      q.round_name.includes('Về đích') || 
      q.round_format?.startsWith('VE_DICH') ||
      q.round_format === 'THUC_HANH_TINH_HUONG'
    );

    const chpQuestions = questions.filter(q => 
      q.round_name.includes('phụ') || 
      q.round_format === 'CAU_HOI_PHU'
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
          vdRows.push([ptsText, q.question_text, q.correct_key, cleanMediaFileName(q.media_url), q.host_notes || q.explanation || '', cleanMediaFileName(q.audio_url)]);
        } else {
          vdRows.push([i < 3 ? 'Câu hỏi 20 điểm' : 'Câu hỏi 30 điểm', '', '', '', '', '']);
        }
      }
    }

    // Append CÂU HỎI PHỤ into Về đích sheet matching the official BTI template file
    vdRows.push([]);
    vdRows.push(['CÂU HỎI PHỤ']);
    vdRows.push(['', 'Câu hỏi', 'Đáp án']);
    if (chpQuestions.length > 0) {
      chpQuestions.forEach((q, idx) => {
        vdRows.push([`Câu hỏi phụ ${idx + 1}`, q.question_text, q.correct_key]);
      });
    } else {
      vdRows.push(['Câu hỏi phụ 1', '', '']);
      vdRows.push(['Câu hỏi phụ 2', '', '']);
      vdRows.push(['Câu hỏi phụ 3', '', '']);
    }

    const wsVd = XLSX.utils.aoa_to_sheet(vdRows);
    XLSX.utils.book_append_sheet(wb, wsVd, 'Về đích');

    // 5. SHEET: CÂU HỎI PHỤ (Trang tính độc lập)
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
    XLSX.utils.book_append_sheet(wb, wsChp, 'Câu hỏi phụ');

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
      XLSX.utils.book_append_sheet(wb, wsBgd, 'Vòng loại Bộ GD&ĐT');
    }

    let fileName = 'Đề thi.xlsx';
    if (stageName && stageName.toLowerCase().endsWith('.xlsx')) {
      fileName = stageName;
    } else if (stageName && stageName !== 'Đề thi.xlsx' && stageName !== 'Đề Thi BTI 2026') {
      fileName = `Đề thi_${stageName.replace(/\s+/g, '_')}.xlsx`;
    }
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

    // 1. If file has a single sheet (e.g. CSV or single-sheet workbook), check for vertically stacked BTI sections
    let isStackedSingleSheet = false;
    if (sheetNames.length === 1) {
      const ws = wb.Sheets[sheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const stacked = detectStackedBtiSections(rows, 2);
      if (stacked.length >= 2) {
        isStackedSingleSheet = true;
        detectedFormat = 'BTI_OFFICIAL_MULTI_SHEET';

        for (const sec of stacked) {
          const secRows = rows.slice(sec.startRow, sec.endRow);
          if (sec.section === 'KD') {
            const qs = parseBtiKdRows(secRows);
            qs.forEach(q => {
              importedQuestions.push(q);
              byRound[q.round_name] = (byRound[q.round_name] || 0) + 1;
            });
          } else if (sec.section === 'VCNV') {
            const qs = parseBtiVcnvRows(secRows);
            qs.forEach(q => {
              importedQuestions.push(q);
              byRound['Vòng 2: Vượt Chướng Ngại Vật'] = (byRound['Vòng 2: Vượt Chướng Ngại Vật'] || 0) + 1;
            });
          } else if (sec.section === 'TT') {
            const qs = parseBtiTtRows(secRows);
            qs.forEach(q => {
              importedQuestions.push(q);
              byRound['Vòng 3: Tăng tốc'] = (byRound['Vòng 3: Tăng tốc'] || 0) + 1;
            });
          } else if (sec.section === 'VD') {
            const { vdQuestions, chpQuestions } = parseBtiVdAndChpRows(secRows);
            vdQuestions.forEach(q => {
              importedQuestions.push(q);
              byRound['Vòng 4: Về đích'] = (byRound['Vòng 4: Về đích'] || 0) + 1;
            });
            chpQuestions.forEach(q => {
              importedQuestions.push(q);
              byRound['Câu hỏi phụ'] = (byRound['Câu hỏi phụ'] || 0) + 1;
            });
          } else if (sec.section === 'CHP') {
            const qs = parseBtiChpRows(secRows);
            qs.forEach(q => {
              importedQuestions.push(q);
              byRound['Câu hỏi phụ'] = (byRound['Câu hỏi phụ'] || 0) + 1;
            });
          }
        }
      }
    }

    if (!isStackedSingleSheet) {
      const hasBtiOfficialSheets = sheetNames.some(s => isKdSheet(s) || isVcnvSheet(s) || isTtSheet(s) || isVdSheet(s) || isChpSheet(s));
      if (hasBtiOfficialSheets) {
        detectedFormat = 'BTI_OFFICIAL_MULTI_SHEET';
      }

      let parsedChpInVd = false;

      // Iterate through all sheets
      for (const sheetName of sheetNames) {
        const ws = wb.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (rows.length === 0) continue;

        // =========================================================================
        // 1. KHỞI ĐỘNG SHEET
        // =========================================================================
        if (isKdSheet(sheetName)) {
          const qs = parseBtiKdRows(rows);
          qs.forEach(q => {
            importedQuestions.push(q);
            byRound[q.round_name] = (byRound[q.round_name] || 0) + 1;
          });
          continue;
        }

        // =========================================================================
        // 2. VƯỢT CHƯỚNG NGẠI VẬT SHEET
        // =========================================================================
        if (isVcnvSheet(sheetName)) {
          const qs = parseBtiVcnvRows(rows);
          qs.forEach(q => {
            importedQuestions.push(q);
            byRound['Vòng 2: Vượt Chướng Ngại Vật'] = (byRound['Vòng 2: Vượt Chướng Ngại Vật'] || 0) + 1;
          });
          continue;
        }

        // =========================================================================
        // 3. TĂNG TỐC SHEET
        // =========================================================================
        if (isTtSheet(sheetName)) {
          const qs = parseBtiTtRows(rows);
          qs.forEach(q => {
            importedQuestions.push(q);
            byRound['Vòng 3: Tăng tốc'] = (byRound['Vòng 3: Tăng tốc'] || 0) + 1;
          });
          continue;
        }

        // =========================================================================
        // 4. VỀ ĐÍCH SHEET (Bao gồm cả CÂU HỎI PHỤ nếu có ở cuối trang tính)
        // =========================================================================
        if (isVdSheet(sheetName)) {
          const { vdQuestions, chpQuestions } = parseBtiVdAndChpRows(rows);
          vdQuestions.forEach(q => {
            importedQuestions.push(q);
            byRound['Vòng 4: Về đích'] = (byRound['Vòng 4: Về đích'] || 0) + 1;
          });
          if (chpQuestions.length > 0) {
            parsedChpInVd = true;
            chpQuestions.forEach(q => {
              importedQuestions.push(q);
              byRound['Câu hỏi phụ'] = (byRound['Câu hỏi phụ'] || 0) + 1;
            });
          }
          continue;
        }

        // =========================================================================
        // 5. CÂU HỎI PHỤ SHEET (Nếu không được tích hợp trong sheet Về đích)
        // =========================================================================
        if (isChpSheet(sheetName)) {
          if (!parsedChpInVd) {
            const qs = parseBtiChpRows(rows);
            qs.forEach(q => {
              importedQuestions.push(q);
              byRound['Câu hỏi phụ'] = (byRound['Câu hỏi phụ'] || 0) + 1;
            });
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

  /**
   * Analyzes an uploaded custom Excel exam template file:
   * - Detects sheets, title/instruction banners (pre-header rows)
   * - Detects table header row index
   * - Scans column headers and matches them to standard QuestionItem fields
   * - Extracts sample values for verification
   * - Communicates with Gemini AI for semantic refinement when available
   * - Automatically persists the blueprint
   */
  async analyzeCustomTemplate(file: File): Promise<CustomTemplateBlueprint> {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });

    const sheetBlueprints: CustomTemplateSheetBlueprint[] = [];

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (rawRows.length === 0) continue;

      // Detect header row by scoring keywords and structure
      let bestRowIdx = 0;
      let bestScore = -1;

      for (let r = 0; r < Math.min(rawRows.length, 25); r++) {
        const row = rawRows[r];
        if (!row || row.length === 0) continue;

        let score = 0;
        const rowStr = row.map(c => String(c || '').toLowerCase()).join(' ');

        // Instructions banner penalty (e.g. "Hướng dẫn: ...", "Lưu ý: ...")
        if (rowStr.startsWith('hướng dẫn') || rowStr.startsWith('lưu ý') || rowStr.includes('hướng dẫn:')) {
          score -= 30;
        }

        // Count non-empty columns
        const nonEmptyCount = row.filter(c => String(c || '').trim().length > 0).length;
        if (nonEmptyCount >= 2) score += 4;
        if (nonEmptyCount >= 3) score += 3;

        // Reward column header keywords
        row.forEach(cell => {
          const val = normVn(cell);
          if (val === 'CAU HOI' || val === 'QUESTION' || val === 'NOI DUNG' || val === 'NOI DUNG CAU HOI') score += 10;
          else if (val.includes('CAU HOI') && val.length < 30) score += 6;
          
          if (val === 'DAP AN' || val === 'ANSWER' || val === 'KEY') score += 10;
          else if (val.includes('DAP AN') && val.length < 30) score += 6;

          if (val === 'MUC DIEM' || val === 'DIEM') score += 6;
          if (val.includes('ANH') || val.includes('MEDIA') || val.includes('VIDEO')) score += 6;
          if (val.includes('AM THANH') || val.includes('AUDIO')) score += 6;
          if (val.includes('CHU THICH')) score += 6;
          if (val === 'STT' || val === 'SO THU TU') score += 4;
        });

        const textCells = row.map(c => String(c || '').trim().toUpperCase());
        if (textCells.includes('A') && textCells.includes('B')) score += 8;

        if (score > bestScore) {
          bestScore = score;
          bestRowIdx = r;
        }
      }

      if (bestScore < 2) bestRowIdx = 0;

      const preHeaderRows = rawRows.slice(0, bestRowIdx);
      const headerRow = rawRows[bestRowIdx] || [];
      const columns: ColumnMappingItem[] = [];

      for (let c = 0; c < headerRow.length; c++) {
        const headerName = String(headerRow[c] || '').trim();
        if (!headerName && c > 15) break;

        const samples: string[] = [];
        for (let r = bestRowIdx + 1; r < Math.min(rawRows.length, bestRowIdx + 10); r++) {
          const cellVal = String(rawRows[r]?.[c] || '').trim();
          if (cellVal) {
            samples.push(cellVal);
            if (samples.length >= 3) break;
          }
        }

        const detected = detectColumnField(headerName || `Cột ${c + 1}`, samples);
        columns.push({
          colIndex: c,
          originalHeader: headerName || `Cột ${c + 1}`,
          mappedField: detected.field,
          sampleValues: samples,
          confidence: detected.confidence
        });
      }

      sheetBlueprints.push({
        sheetName,
        headerRowIndex: bestRowIdx,
        preHeaderRows,
        columns,
        totalSampleRows: Math.max(0, rawRows.length - (bestRowIdx + 1))
      });
    }

    if (sheetBlueprints.length === 0) {
      throw new Error('Tệp Excel không chứa trang tính hoặc dữ liệu nào.');
    }

    // Determine target sheet (the sheet with the most question fields mapped)
    let targetSheetName = sheetBlueprints[0].sheetName;
    let maxMappedScore = -1;

    for (const sb of sheetBlueprints) {
      const score = sb.columns.filter(c => c.mappedField !== 'unmapped').length;
      if (score > maxMappedScore) {
        maxMappedScore = score;
        targetSheetName = sb.sheetName;
      }
    }

    // Check if uploaded template is BTI Official or stacked BTI
    const lowerFileName = file.name.toLowerCase();
    const isBtiTemplate = lowerFileName.includes('đề thi') || 
      lowerFileName.includes('de thi') || 
      lowerFileName.includes('bti') ||
      sheetBlueprints.some(s => isKdSheet(s.sheetName) || isVcnvSheet(s.sheetName) || isTtSheet(s.sheetName) || isVdSheet(s.sheetName));

    // If single sheet contains stacked BTI sections, partition into virtual sheets
    if (sheetBlueprints.length === 1 && wb.SheetNames.length === 1) {
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const stacked = detectStackedBtiSections(rawRows);
      if (stacked.length >= 2) {
        const sectionNames: Record<StackedBtiSection['section'], string> = {
          KD: 'Khởi động',
          VCNV: 'Vượt chướng ngại vật',
          TT: 'Tăng tốc',
          VD: 'Về đích',
          CHP: 'Câu hỏi phụ'
        };

        const virtualSheets: CustomTemplateSheetBlueprint[] = [];
        stacked.forEach(sec => {
          const secRows = rawRows.slice(sec.startRow, sec.endRow);
          let hIdx = 0;
          for (let r = 0; r < Math.min(secRows.length, 10); r++) {
            const str = secRows[r].join(' ').toLowerCase();
            if (str.includes('câu hỏi') && (str.includes('đáp án') || str.includes('mức điểm') || str.includes('ảnh'))) {
              hIdx = r;
              break;
            }
          }
          const preRows = secRows.slice(0, hIdx);
          const headerRow = secRows[hIdx] || [];
          const columns: ColumnMappingItem[] = [];

          for (let c = 0; c < headerRow.length; c++) {
            const hName = String(headerRow[c] || '').trim();
            if (!hName && c > 10) break;
            const samples: string[] = [];
            for (let r = hIdx + 1; r < Math.min(secRows.length, hIdx + 10); r++) {
              const val = String(secRows[r]?.[c] || '').trim();
              if (val) {
                samples.push(val);
                if (samples.length >= 3) break;
              }
            }
            const det = detectColumnField(hName || `Cột ${c + 1}`, samples);
            columns.push({
              colIndex: c,
              originalHeader: hName || `Cột ${c + 1}`,
              mappedField: det.field,
              sampleValues: samples,
              confidence: det.confidence
            });
          }

          virtualSheets.push({
            sheetName: sectionNames[sec.section] || sec.section,
            headerRowIndex: hIdx,
            preHeaderRows: preRows,
            columns,
            totalSampleRows: Math.max(0, secRows.length - (hIdx + 1))
          });
        });

        if (virtualSheets.length > 0) {
          sheetBlueprints.length = 0;
          sheetBlueprints.push(...virtualSheets);
          targetSheetName = virtualSheets[0].sheetName;
        }
      }
    }

    // Initial heuristic system name
    let systemName = 'Biểu Mẫu Khảo Thí Tùy Biến';
    if (isBtiTemplate) {
      systemName = 'Phần mềm BTI (Đề thi.xlsx)';
    } else if (lowerFileName.includes('azota')) systemName = 'Azota';
    else if (lowerFileName.includes('k12')) systemName = 'K12Online';
    else if (lowerFileName.includes('shub')) systemName = 'Shub Classroom';
    else if (lowerFileName.includes('olm')) systemName = 'OLM';
    else if (lowerFileName.includes('quizizz')) systemName = 'Quizizz';
    else if (lowerFileName.includes('bgd') || lowerFileName.includes('bo_giao_duc')) systemName = 'Chuẩn Bộ GD&ĐT';
    else if (lowerFileName.includes('subiz')) systemName = 'Subiz';
    else if (lowerFileName.includes('canvas') || lowerFileName.includes('moodle')) systemName = 'Canvas / Moodle';

    let aiSummary = isBtiTemplate
      ? `Agent đã nhận diện chuẩn mẫu tệp của Phần mềm Điều khiển BTI 2026 ("Đề thi.xlsx").\n• Quy định bắt buộc: Tên file luôn phải đặt là "Đề thi.xlsx" (không đổi tên).\n• Cây thư mục Media: Media/Starting (Khởi động), Media/Obstacle (VCNV), Media/Acceleration/AC1-AC4 (Tăng tốc), Media/Finish (Về đích), StudentImage (Ảnh thí sinh).\n• Các cột media chỉ ghi tên file gốc, phần mềm tự liên kết theo thư mục phần thi tương ứng.`
      : `Agent đã phân tích biểu mẫu "${file.name}": Nhận diện ${sheetBlueprints.length} trang tính, dòng tiêu đề ở vị trí ${sheetBlueprints[0].headerRowIndex + 1} và đã ánh xạ ${sheetBlueprints[0].columns.filter(c => c.mappedField !== 'unmapped').length} cột dữ liệu.`;

    // Try Gemini AI enhancement via backend
    try {
      const sheetsPayload = sheetBlueprints.map(sb => {
        const ws = wb.Sheets[sb.sheetName];
        const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        return {
          sheetName: sb.sheetName,
          rows: raw.slice(0, 10)
        };
      });

      const res = await fetch('/api/ai/analyze-excel-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, sheets: sheetsPayload })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.analysis) {
          if (json.analysis.systemName) systemName = json.analysis.systemName;
          if (json.analysis.aiSummary) aiSummary = json.analysis.aiSummary;
          if (json.analysis.targetSheetName) targetSheetName = json.analysis.targetSheetName;

          // Merge AI column mapping if provided
          if (Array.isArray(json.analysis.columnMappings)) {
            const targetSb = sheetBlueprints.find(s => s.sheetName === targetSheetName) || sheetBlueprints[0];
            json.analysis.columnMappings.forEach((aiCol: any) => {
              const matchedCol = targetSb.columns.find(c => c.colIndex === aiCol.colIndex);
              if (matchedCol && aiCol.mappedField && aiCol.mappedField in MAPPED_FIELD_LABELS) {
                matchedCol.mappedField = aiCol.mappedField as MappedQuestionField;
                matchedCol.confidence = 0.99;
              }
            });
          }
        }
      }
    } catch (aiErr) {
      console.warn('AI Template analysis fallback to heuristic:', aiErr);
    }

    const blueprint: CustomTemplateBlueprint = {
      id: `TMPL_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      analyzedAt: Date.now(),
      systemName,
      aiSummary,
      sheets: sheetBlueprints,
      targetSheetName
    };

    customTemplateStorage.save(blueprint);
    return blueprint;
  },

  /**
   * Adaptive Exporter:
   * Exports questions from Question Bank matching 100% the layout, instructions, and column structure of an analyzed template blueprint.
   */
  exportMatchingCustomTemplate(
    questions: QuestionItem[], 
    blueprint: CustomTemplateBlueprint, 
    customFileName?: string
  ): void {
    const wb = XLSX.utils.book_new();
    const targetSheet = blueprint.sheets.find(s => s.sheetName === blueprint.targetSheetName) || blueprint.sheets[0];

    if (!targetSheet) {
      throw new Error('Không tìm thấy cấu trúc trang tính trong mẫu đề.');
    }

    const rows: any[][] = [];

    // 1. Recreate all original pre-header rows (instruction banners, titles)
    for (const pRow of targetSheet.preHeaderRows) {
      rows.push([...pRow]);
    }

    // 2. Insert original header row
    const headerRow = targetSheet.columns.map(c => c.originalHeader);
    rows.push(headerRow);

    // 3. Map question data into each corresponding column
    questions.forEach((q, qIdx) => {
      const rowData: any[] = [];

      for (const col of targetSheet.columns) {
        let val: any = '';

        switch (col.mappedField) {
          case 'id':
            val = q.id || String(qIdx + 1);
            break;
          case 'question_text':
            val = q.question_text || '';
            break;
          case 'option_a':
            val = q.options?.A || q.options?.a || '';
            break;
          case 'option_b':
            val = q.options?.B || q.options?.b || '';
            break;
          case 'option_c':
            val = q.options?.C || q.options?.c || '';
            break;
          case 'option_d':
            val = q.options?.D || q.options?.d || '';
            break;
          case 'option_e':
            val = q.options?.E || q.options?.e || '';
            break;
          case 'correct_key': {
            const sample = (col.sampleValues[0] || '').trim();
            let key = (q.correct_key || '').trim();

            if (/^[1-4]$/.test(sample)) {
              const numMap: Record<string, string> = { A: '1', B: '2', C: '3', D: '4' };
              key = numMap[key.toUpperCase()] || key;
            } else if (/^[a-d]$/.test(sample)) {
              key = key.toLowerCase();
            } else if (/^[A-D]$/.test(sample)) {
              key = key.toUpperCase();
            } else if (sample.length > 5 && q.options) {
              const fullOption = q.options[key.toUpperCase()] || q.options[key];
              if (fullOption) key = fullOption;
            }
            val = key;
            break;
          }
          case 'explanation':
            val = q.explanation || q.host_notes || '';
            break;
          case 'cognitive_level': {
            const sample = (col.sampleValues[0] || '').toLowerCase();
            const level = q.cognitive_level || 'THONG_HIEU';
            if (sample.includes('nhận biết') || sample.includes('thông hiểu') || sample.includes('vận dụng')) {
              const map: Record<string, string> = {
                NHAN_BIET: 'Nhận biết',
                THONG_HIEU: 'Thông hiểu',
                VAN_DUNG: 'Vận dụng',
                VAN_DUNG_CAO: 'Vận dụng cao'
              };
              val = map[level] || 'Thông hiểu';
            } else {
              val = level;
            }
            break;
          }
          case 'digital_competency_domain': {
            const sample = (col.sampleValues[0] || '').toLowerCase();
            const dom = q.digital_competency_domain || 'MIEN_1';
            if (sample.includes('miền') || sample.includes('chủ đề')) {
              const map: Record<string, string> = {
                MIEN_1: 'Miền 1: Dữ liệu và thông tin',
                MIEN_2: 'Miền 2: Giao tiếp và hợp tác',
                MIEN_3: 'Miền 3: Sáng tạo nội dung số',
                MIEN_4: 'Miền 4: An toàn số',
                MIEN_5: 'Miền 5: Giải quyết vấn đề',
                MIEN_6: 'Miền 6: Sử dụng thiết bị'
              };
              val = map[dom] || 'Miền 1';
            } else {
              val = dom;
            }
            break;
          }
          case 'points':
            val = q.points ?? 10;
            break;
          case 'time_limit':
            val = q.time_limit ?? 30;
            break;
          case 'legal_reference':
            val = q.legal_reference || 'Thông tư 02/2025/TT-BGDĐT';
            break;
          case 'round_name':
            val = q.round_name || 'Vòng 1: Khởi động';
            break;
          case 'media_url':
            val = q.media_url || '';
            break;
          case 'audio_url':
            val = q.audio_url || '';
            break;
          case 'distractor_script':
            val = q.scenario_details?.scriptText || q.host_notes || '';
            break;
          case 'custom_constant':
            val = col.constantValue || '';
            break;
          case 'unmapped':
          default:
            val = '';
            break;
        }

        rowData.push(val);
      }

      rows.push(rowData);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Dynamic column width calculation
    ws['!cols'] = targetSheet.columns.map((c, colIdx) => {
      let maxLen = (c.originalHeader || '').length;
      for (let r = 0; r < Math.min(rows.length, 50); r++) {
        const cellStr = String(rows[r]?.[colIdx] || '');
        if (cellStr.length > maxLen) maxLen = cellStr.length;
      }
      return { wch: Math.min(Math.max(maxLen + 3, 10), 65) };
    });

    XLSX.utils.book_append_sheet(wb, ws, targetSheet.sheetName || 'DE_THI');

    // Add remaining sheets from blueprint if any, maintaining original multi-sheet format
    for (const otherSheet of blueprint.sheets) {
      if (otherSheet.sheetName !== targetSheet.sheetName) {
        const otherRows: any[][] = [];
        for (const pRow of otherSheet.preHeaderRows) {
          otherRows.push([...pRow]);
        }
        otherRows.push(otherSheet.columns.map(c => c.originalHeader));
        const wsOther = XLSX.utils.aoa_to_sheet(otherRows);
        XLSX.utils.book_append_sheet(wb, wsOther, otherSheet.sheetName);
      }
    }

    const baseName = blueprint.name.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_');
    const finalFilename = customFileName || `DeThi_KhopMau_${baseName}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(wb, finalFilename);
  },

  parseExcelFile(file: File): Promise<ParseExcelResult> {
    return this.parseUploadedFile(file);
  },

  exportQuestionsToExcel(questions: QuestionItem[], filename?: string): void {
    this.exportToBTIExcel(questions, filename);
  }
};

/**
 * Storage helpers for learned custom templates
 */
const BLUEPRINTS_STORAGE_KEY = 'BTI2026_CUSTOM_EXCEL_TEMPLATE_BLUEPRINTS';
const ACTIVE_BLUEPRINT_KEY = 'BTI2026_ACTIVE_CUSTOM_EXCEL_TEMPLATE_ID';

export const customTemplateStorage = {
  getAll(): CustomTemplateBlueprint[] {
    try {
      const raw = localStorage.getItem(BLUEPRINTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  save(blueprint: CustomTemplateBlueprint): void {
    const list = this.getAll().filter(b => b.id !== blueprint.id);
    list.unshift(blueprint);
    localStorage.setItem(BLUEPRINTS_STORAGE_KEY, JSON.stringify(list));
    localStorage.setItem(ACTIVE_BLUEPRINT_KEY, blueprint.id);
  },
  getActive(): CustomTemplateBlueprint | null {
    const activeId = localStorage.getItem(ACTIVE_BLUEPRINT_KEY);
    const list = this.getAll();
    if (activeId) {
      const found = list.find(b => b.id === activeId);
      if (found) return found;
    }
    return list[0] || null;
  },
  setActive(id: string): void {
    localStorage.setItem(ACTIVE_BLUEPRINT_KEY, id);
  },
  delete(id: string): void {
    const list = this.getAll().filter(b => b.id !== id);
    localStorage.setItem(BLUEPRINTS_STORAGE_KEY, JSON.stringify(list));
    if (localStorage.getItem(ACTIVE_BLUEPRINT_KEY) === id) {
      if (list.length > 0) {
        localStorage.setItem(ACTIVE_BLUEPRINT_KEY, list[0].id);
      } else {
        localStorage.removeItem(ACTIVE_BLUEPRINT_KEY);
      }
    }
  }
};
