import { 
  QuestionActivityLog,
  QuestionVersion,
  QuestionVersionSnapshot,
  QuestionItem, 
  CompetitionStage, 
  CognitiveLevel, 
  DigitalCompetencyDomainKey, 
  ApprovalStatus, 
  LegalDocument, 
  InteractiveScenario, 
  AppUser, 
  UserRole, 
  GeneratedExam,
  QuestionRoundFormat,
  CustomCategory
} from '../types';
import { INITIAL_QUESTION_BANK } from '../data/questionBank';
import { 
  PRESEEDED_LEGAL_DOCUMENTS, 
  INITIAL_APP_USERS,
  getRoundGroupByFormat,
  BtiRoundGroupKey
} from '../data/digitalCompetencyData';
import { PRESEEDED_SCENARIOS } from '../data/interactiveScenarios';
import { syncService } from './syncService';
import { setCategoryColor } from '../utils/categoryColorUtils';

const STORAGE_KEYS = {
  QUESTIONS: 'bti2026_question_bank_v2',
  SCENARIOS: 'bti2026_interactive_scenarios_v1',
  DOCUMENTS: 'bti2026_legal_documents_v1',
  CURRENT_USER: 'bti2026_active_user_v1',
  USERS_LIST: 'bti2026_app_users_v1',
  GENERATED_EXAMS: 'bti2026_generated_exams_v1',
  TAGS: 'bti2026_custom_tags_v1',
  CATEGORIES: 'bti2026_custom_categories_v2'
};

const INITIAL_CUSTOM_CATEGORIES: CustomCategory[] = [
  { id: 'cat_logic', name: 'Tư duy Logic', description: 'Suy luận logic, giải đố suy đoán và quy luật chuỗi', color: 'sky', isSystem: true },
  { id: 'cat_math', name: 'Toán học & Thuật toán', description: 'Tính toán đại số, thuật toán số và mô hình dữ liệu', color: 'indigo', isSystem: true },
  { id: 'cat_trivia', name: 'Đố vui & Tri thức số', description: 'Tri thức công nghệ thông tin tổng hợp, lịch sử và mẹo hay', color: 'amber', isSystem: true },
  { id: 'cat_domain1', name: 'Khai thác dữ liệu & Thông tin', description: 'Tìm kiếm, lọc, đánh giá và quản lý dữ liệu số', color: 'emerald', isSystem: true },
  { id: 'cat_domain2', name: 'Giao tiếp & Trách nhiệm số', description: 'Văn hóa mạng, chia sẻ thông tin và ứng xử văn minh', color: 'teal', isSystem: true },
  { id: 'cat_domain3', name: 'Sáng tạo nội dung số', description: 'Thiết kế, mã hóa, tích hợp và sở hữu trí tuệ', color: 'purple', isSystem: true },
  { id: 'cat_domain4', name: 'An toàn & Quyền riêng tư', description: 'Bảo mật thông tin, bảo vệ dữ liệu cá nhân Nghị định 13/2023', color: 'rose', isSystem: true },
  { id: 'cat_domain6', name: 'Trí tuệ nhân tạo (AI & GenAI)', description: 'AI tạo sinh, đạo đức AI và phòng chống Deepfake', color: 'cyan', isSystem: true }
];

class QuestionBankManager {
  private questions: QuestionItem[] = [];
  private scenarios: InteractiveScenario[] = [];
  private documents: LegalDocument[] = [];
  private users: AppUser[] = [];
  private currentUser: AppUser = INITIAL_APP_USERS[0];
  private generatedExams: GeneratedExam[] = [];
  private customTags: string[] = [];
  private customCategories: CustomCategory[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    try {
      // 1. Load Questions
      const savedQ = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
      if (savedQ) {
        this.questions = JSON.parse(savedQ);

        // Ensure VCNV questions with empty clues get populated with the full 7 rows and standardized IDs (VCNV_01, VCNV_02...)
        let updatedAny = false;
        let vcnvCounter = 0;

        this.questions = this.questions.map(q => {
          const isVcnv = q.round_type === 'VCNV' || 
            q.id === 'VCNV_01' || 
            q.id.startsWith('VCNV_') || 
            q.id.startsWith('CNV') || 
            Boolean(q.round_format?.includes('VCNV')) ||
            (q.round_name && q.round_name.toLowerCase().includes('chướng ngại vật'));

          if (isVcnv) {
            vcnvCounter++;
            const standardId = `VCNV_${vcnvCounter < 10 ? '0' + vcnvCounter : vcnvCounter}`;
            const idNeedsUpdate = q.id !== standardId;
            const hasClues = Boolean(q.options?.clue1 && q.options?.ans1);
            
            if (idNeedsUpdate || !hasClues || q.round_type !== 'VCNV') {
              updatedAny = true;
              return {
                ...q,
                id: standardId,
                round_type: 'VCNV',
                round_format: 'VCNV_HANG_NGANG',
                round_name: 'Vòng 2: Vượt Chướng Ngại Vật',
                correct_key: q.correct_key || 'DEEPFAKE',
                options: {
                  ...q.options,
                  riskQuestion: q.options?.riskQuestion || 'Kỹ thuật sử dụng trí tuệ nhân tạo (AI / Deep Learning) để tổng hợp, hoán đổi hoặc giả mạo hình ảnh, âm thanh, video khuôn mặt và giọng nói của người thật với độ chân thực cực cao là gì?',
                  riskAnswer: q.options?.riskAnswer || 'DEEPFAKE',
                  clue1: q.options?.clue1 || 'Thuật toán học sâu (Deep Learning) sử dụng mạng nơ-ron đối nghịch để tái tạo và tổng hợp khuôn mặt giả mạo có tên viết tắt tiếng Anh là gì?',
                  ans1: q.options?.ans1 || 'GAN',
                  clue2: q.options?.clue2 || 'Hành vi sử dụng công nghệ giả mạo hình ảnh, giọng nói nhằm lừa đảo chiếm đoạt tài sản trên không gian mạng vi phạm Luật nào của Việt Nam?',
                  ans2: q.options?.ans2 || 'AN NINH MANG',
                  clue3: q.options?.clue3 || 'Hình thức xác thực sinh trắc học nào trên điện thoại thông minh có nguy cơ bị đánh lừa cao nhất khi kẻ xấu sử dụng video Deepfake thời gian thực?',
                  ans3: q.options?.ans3 || 'KHUON MAT',
                  clue4: q.options?.clue4 || 'Khi nhận cuộc gọi video có dấu hiệu giật lag, cử động mắt bất thường và yêu cầu chuyển tiền gấp, biện pháp kiểm chứng tức thì an toàn nhất là gì?',
                  ans4: q.options?.ans4 || 'GOI DIEN LAI',
                  centerText: q.options?.centerText || 'Gợi ý Ô Trung Tâm: Công nghệ AI giả mạo tinh vi đang là hiểm họa an toàn thông tin số toàn cầu năm 2026.',
                  centerAnswer: q.options?.centerAnswer || 'DEEPFAKE',
                  obstacleImage: q.options?.obstacleImage || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80'
                },
                obstacle_info: q.obstacle_info || {
                  obstacleKey: q.correct_key || 'DEEPFAKE',
                  obstacleImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
                  explanation: 'Từ khóa Chướng Ngại Vật: DEEPFAKE (8 chữ cái).'
                }
              };
            }
          }
          return q;
        });

        if (updatedAny) {
          this.saveQuestions();
        }
      } else {
        // Hydrate initial question bank with default domain & stage metadata
        this.questions = INITIAL_QUESTION_BANK.map((q, idx) => {
          let stage: CompetitionStage = 'BAN_KET_1';
          let domain: DigitalCompetencyDomainKey = 'MIEN_4';
          let level: CognitiveLevel = 'THONG_HIEU';

          if (q.id.startsWith('KD')) {
            domain = idx % 2 === 0 ? 'MIEN_4' : idx % 3 === 0 ? 'MIEN_1' : 'MIEN_2';
            level = idx < 15 ? 'NHAN_BIET' : idx < 35 ? 'THONG_HIEU' : 'VAN_DUNG';
          } else if (q.id.startsWith('VCNV')) {
            domain = 'MIEN_4';
            level = 'VAN_DUNG';
          } else if (q.id.startsWith('TT')) {
            domain = 'MIEN_3';
            level = 'VAN_DUNG_CAO';
          } else if (q.id.startsWith('VD')) {
            domain = idx % 2 === 0 ? 'MIEN_5' : 'MIEN_6';
            level = 'VAN_DUNG_CAO';
          }

          return {
            ...q,
            stage,
            digital_competency_domain: domain,
            cognitive_level: level,
            approval_status: 'APPROVED' as ApprovalStatus,
            legal_reference: 'Thông tư 02/2025/TT-BGDĐT',
            created_at: Date.now() - 86400000 * 7,
            created_by: 'Hội đồng Khảo thí BTI 2026'
          };
        });

        // Add pre-seeded Vòng loại (Bộ GD&ĐT) questions
        this.appendPreseededBgdQuestions();
        this.saveQuestions();
      }

      // 2. Load Scenarios
      const savedScenarios = localStorage.getItem(STORAGE_KEYS.SCENARIOS);
      if (savedScenarios) {
        try {
          const loaded: InteractiveScenario[] = JSON.parse(savedScenarios);
          this.scenarios = loaded.map(sc => {
            const preseeded = PRESEEDED_SCENARIOS.find(p => p.id === sc.id);
            if (preseeded) {
              return { 
                ...sc, 
                branches: preseeded.branches, 
                options: preseeded.options, 
                correctOption: preseeded.correctOption,
                subOptimalScript: preseeded.subOptimalScript || sc.subOptimalScript
              };
            }
            if (!sc.branches && sc.options) {
              const branches: Record<string, any> = {};
              (['A', 'B', 'C', 'D'] as const).forEach(key => {
                if (sc.options && sc.options[key]) {
                  const isOpt = sc.correctOption === key;
                  branches[key] = {
                    key,
                    text: sc.options[key],
                    isOptimal: isOpt,
                    statusType: isOpt ? 'SUCCESS' : 'WARNING',
                    reactionScript: `[DIỄN BIẾN PHÍA SAU - PHƯƠNG ÁN ${key}]:\nThí sinh lựa chọn phương án ${key}. Diễn viên sân khấu tiếp tục tình huống dựa trên quyết định này...`,
                    consequence: isOpt ? 'Giải quyết tình huống an toàn, hạn chế tối đa rủi ro số.' : 'Tiềm ẩn rủi ro về an toàn thông tin hoặc xử lý chưa triệt để.',
                    feedback: isOpt ? 'Phương án xử lý phù hợp với quy định pháp luật và chuẩn năng lực số.' : 'Cần lưu ý thêm về quy trình an toàn và trách nhiệm số.'
                  };
                }
              });
              return { 
                ...sc, 
                branches,
                subOptimalScript: sc.subOptimalScript || `[KỊCH BẢN ỨNG BIẾN KHI CHỌN PHƯƠNG ÁN SAI / CHƯA TỐI ƯU]:\nMC bước ra: "Thí sinh đã lựa chọn một phương án tiềm ẩn rủi ro số. Xin mời Ban Giám khảo phân tích và định hướng giải pháp an toàn!"`
              };
            }
            if (!sc.subOptimalScript) {
              sc.subOptimalScript = `[KỊCH BẢN ỨNG BIẾN KHI CHỌN PHƯƠNG ÁN SAI / CHƯA TỐI ƯU]:\nMC bước ra: "Thí sinh đã lựa chọn một phương án tiềm ẩn rủi ro số. Xin mời Ban Giám khảo phân tích và định hướng giải pháp an toàn!"`;
            }
            return sc;
          });

          // Ensure preseeded scenarios exist if missing
          PRESEEDED_SCENARIOS.forEach(ps => {
            if (!this.scenarios.some(s => s.id === ps.id)) {
              this.scenarios.push(ps);
            }
          });
          this.saveScenarios();
        } catch (e) {
          console.error("Failed to parse saved scenarios, resetting to preseeded:", e);
          this.scenarios = [...PRESEEDED_SCENARIOS];
          this.saveScenarios();
        }
      } else {
        this.scenarios = [...PRESEEDED_SCENARIOS];
        this.saveScenarios();
      }

      // 3. Load Documents
      const savedDocs = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      if (savedDocs) {
        this.documents = JSON.parse(savedDocs);
      } else {
        this.documents = [...PRESEEDED_LEGAL_DOCUMENTS];
        this.saveDocuments();
      }

      // 4. Load Users
      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS_LIST);
      if (savedUsers) {
        this.users = JSON.parse(savedUsers);
      } else {
        this.users = [...INITIAL_APP_USERS];
        this.saveUsers();
      }

      // 5. Load Active User
      const savedCurUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (savedCurUser) {
        this.currentUser = JSON.parse(savedCurUser);
      } else {
        this.currentUser = this.users[0] || INITIAL_APP_USERS[0];
      }

      // 6. Load Generated Exams
      const savedExams = localStorage.getItem(STORAGE_KEYS.GENERATED_EXAMS);
      if (savedExams) {
        this.generatedExams = JSON.parse(savedExams);
      }

      // 7. Load Custom Tags
      const savedTags = localStorage.getItem(STORAGE_KEYS.TAGS);
      if (savedTags) {
        this.customTags = JSON.parse(savedTags);
      } else {
        // Automatically extract tags from questions if none exist
        this.extractTagsFromQuestions();
      }

      // 8. Load Custom Categories
      const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (savedCategories) {
        this.customCategories = JSON.parse(savedCategories);
      } else {
        this.customCategories = [...INITIAL_CUSTOM_CATEGORIES];
      }
      // Ensure all unique categories from questions are synced
      this.syncCategoriesFromQuestions();
    } catch (e) {
      console.error('Error initializing QuestionBankManager:', e);
    }
  }

  public syncCategoriesFromQuestions(): number {
    const existingNames = new Set(this.customCategories.map(c => c.name.trim().toLowerCase()));
    let addedCount = 0;

    this.questions.forEach(q => {
      if (q.category && q.category.trim()) {
        const catName = q.category.trim();
        if (!existingNames.has(catName.toLowerCase())) {
          existingNames.add(catName.toLowerCase());
          this.customCategories.push({
            id: `cat_auto_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
            name: catName,
            description: `Danh mục BTI được tự động trích xuất từ câu hỏi trong ngân hàng`,
            color: 'purple',
            isSystem: false,
            createdAt: Date.now()
          });
          addedCount++;
        }
      }
    });

    if (addedCount > 0 || !localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      this.saveCategories();
      this.notify();
    }
    return addedCount;
  }

  private saveCategories(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(this.customCategories));
    }
  }

  private extractTagsFromQuestions() {
    const tags = new Set<string>();
    this.questions.forEach(q => {
      if (q.tags && Array.isArray(q.tags)) {
        q.tags.forEach(t => tags.add(t));
      } else if (q.category && q.category.trim()) { // Fallback to category for legacy support
        tags.add(q.category.trim());
      }
    });
    this.customTags = Array.from(tags).sort();
    this.saveTags();
  }

  private appendPreseededBgdQuestions() {
    const bgdQuestions: QuestionItem[] = [
      {
        id: 'VL_BGD_01',
        round_name: 'Vòng loại Bộ GD&ĐT',
        round_type: 'MULTIPLE_CHOICE',
        round_format: 'BGD_MULTIPLE_CHOICE',
        category: 'Miền I: Khai thác dữ liệu',
        question_text: 'Theo Thông tư 02/2025/TT-BGDĐT, Miền I "Khai thác dữ liệu và thông tin" KHÔNG bao gồm năng lực thành phần nào sau đây?',
        options: {
          A: 'Duyệt, tìm kiếm và lọc dữ liệu, thông tin và nội dung số',
          B: 'Đánh giá dữ liệu, thông tin và nội dung số',
          C: 'Quản lý dữ liệu, thông tin và nội dung số',
          D: 'Lập trình thuật toán xử lý dữ liệu lớn'
        },
        correct_key: 'D',
        explanation: 'Theo Thông tư 02/2025/TT-BGDĐT, Miền I gồm 3 năng lực thành phần: 1.1 Duyệt, tìm kiếm và lọc; 1.2 Đánh giá; 1.3 Quản lý dữ liệu. Năng lực "Lập trình" thuộc Miền III (Sáng tạo nội dung số, mục 3.4).',
        time_limit: 30,
        stage: 'VONG_LOAI',
        digital_competency_domain: 'MIEN_1',
        digital_sub_competency: '1.1',
        cognitive_level: 'NHAN_BIET',
        approval_status: 'APPROVED',
        legal_reference: 'Thông tư 02/2025/TT-BGDĐT Phần B, Miền I',
        created_by: 'Ban Đề Thi Quốc Gia',
        created_at: Date.now()
      },
      {
        id: 'VL_BGD_02',
        round_name: 'Vòng loại Bộ GD&ĐT',
        round_type: 'TRUE_FALSE_4',
        round_format: 'BGD_TRUE_FALSE_4',
        category: 'Miền IV: An toàn & Quyền riêng tư',
        question_text: 'Về quy định bảo vệ dữ liệu cá nhân theo Nghị định số 13/2023/NĐ-CP và Thông tư 02/2025/TT-BGDĐT, thí sinh xác định tính Đúng (Đ) hoặc Sai (S) cho từng nhận định sau:',
        options: {
          A: 'Họ tên, ngày tháng năm sinh, số điện thoại là dữ liệu cá nhân cơ bản.',
          B: 'Dữ liệu vị trí định vị thời gian thực của cá nhân là dữ liệu cá nhân cơ bản, không cần bảo vệ nghiêm ngặt.',
          C: 'Chủ thể dữ liệu có quyền yêu cầu Bên Kiểm soát dữ liệu xóa toàn bộ dữ liệu cá nhân của mình trừ trường hợp luật có quy định khác.',
          D: 'Tổ chức được phép chia sẻ dữ liệu cá nhân cho bên thứ ba vì mục đích thương mại mà không cần sự đồng ý của chủ thể.'
        },
        correct_key: 'A:Đ|B:S|C:Đ|D:S',
        explanation: 'Nhận định A ĐÚNG (Điều 2 Khoản 3). Nhận định B SAI vì dữ liệu định vị cá nhân là dữ liệu cá nhân nhạy cảm (Điều 2 Khoản 4). Nhận định C ĐÚNG (Điều 9 Khoản 5). Nhận định D SAI vì vi phạm nguyên tắc bảo vệ dữ liệu cá nhân (Điều 3).',
        time_limit: 45,
        stage: 'VONG_LOAI',
        digital_competency_domain: 'MIEN_4',
        digital_sub_competency: '4.2',
        cognitive_level: 'THONG_HIEU',
        approval_status: 'APPROVED',
        legal_reference: 'Nghị định 13/2023/NĐ-CP Điều 2, Điều 9',
        created_by: 'Ban Đề Thi Quốc Gia',
        created_at: Date.now()
      },
      {
        id: 'VL_BGD_03',
        round_name: 'Vòng loại Bộ GD&ĐT',
        round_type: 'SHORT_ANSWER',
        round_format: 'BGD_SHORT_ANSWER',
        category: 'Miền VI: Trí tuệ nhân tạo (AI)',
        question_text: 'Theo Thông tư 02/2025/TT-BGDĐT, công nghệ AI có khả năng tạo ra dữ liệu mới như văn bản, hình ảnh, âm thanh từ câu lệnh (prompt) được gọi là Trí tuệ nhân tạo gì?',
        options: {},
        correct_key: 'TRÍ TUỆ NHÂN TẠO TẠO SINH',
        explanation: 'Khoản 19 Điều 2 Thông tư 02/2025/TT-BGDĐT quy định: "Trí tuệ nhân tạo tạo sinh (Gen AI) là công nghệ trí tuệ nhân tạo có khả năng tạo ra dữ liệu mới như văn bản, hình ảnh hoặc các phương tiện truyền thông khác bằng cách sử dụng các mô hình tạo sinh."',
        time_limit: 30,
        stage: 'VONG_LOAI',
        digital_competency_domain: 'MIEN_6',
        digital_sub_competency: '6.1',
        cognitive_level: 'NHAN_BIET',
        approval_status: 'APPROVED',
        legal_reference: 'Khoản 19 Điều 2 Thông tư 02/2025/TT-BGDĐT',
        created_by: 'Ban Đề Thi Quốc Gia',
        created_at: Date.now()
      },
      {
        id: 'VL_BGD_04',
        round_name: 'Vòng loại Bộ GD&ĐT',
        round_type: 'MULTIPLE_CHOICE',
        round_format: 'BGD_MULTIPLE_CHOICE',
        category: 'Miền II: Giao tiếp & Trách nhiệm số',
        question_text: 'Hành vi phát tán tin đồn sai sự thật trên mạng xã hội gây hoang mang trong nhân dân sẽ bị xử phạt vi phạm hành chính theo văn bản nào sau đây?',
        options: {
          A: 'Nghị định 15/2020/NĐ-CP (sửa đổi, bổ sung bởi Nghị định 14/2022/NĐ-CP)',
          B: 'Luật Sở hữu trí tuệ',
          C: 'Nghị định 13/2023/NĐ-CP',
          D: 'Thông tư 02/2025/TT-BGDĐT'
        },
        correct_key: 'A',
        explanation: 'Điều 101 Nghị định 15/2020/NĐ-CP (sửa đổi bởi Nghị định 14/2022/NĐ-CP) quy định xử phạt từ 10.000.000 đến 20.000.000 đồng đối với hành vi cung cấp, chia sẻ thông tin giả mạo, thông tin sai sự thật.',
        time_limit: 30,
        stage: 'VONG_LOAI',
        digital_competency_domain: 'MIEN_2',
        digital_sub_competency: '2.5',
        cognitive_level: 'VAN_DUNG',
        approval_status: 'APPROVED',
        legal_reference: 'Nghị định 15/2020/NĐ-CP Điều 101',
        created_by: 'Ban Đề Thi Quốc Gia',
        created_at: Date.now()
      }
    ];

    this.questions = [...bgdQuestions, ...this.questions];
  }

  private saveTags(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(this.customTags));
    }
  }

  // ================= TAGS MANAGEMENT =================
  public getCustomTags(): string[] {
    return [...this.customTags];
  }

  public addCustomTag(tag: string): void {
    const trimmed = tag.trim();
    if (trimmed && !this.customTags.includes(trimmed)) {
      this.customTags.push(trimmed);
      this.customTags.sort();
      this.saveTags();
      this.notify();
    }
  }

  public deleteCustomTag(tag: string): void {
    this.customTags = this.customTags.filter(t => t !== tag);
    // Remove from all questions
    let updated = false;
    this.questions = this.questions.map(q => {
      if (q.tags && q.tags.includes(tag)) {
        updated = true;
        return { ...q, tags: q.tags.filter(t => t !== tag) };
      }
      return q;
    });
    this.saveTags();
    if (updated) this.saveQuestions();
    this.notify();
  }

  public updateCustomTag(oldTag: string, newTag: string): void {
    const trimmedOld = oldTag.trim();
    const trimmedNew = newTag.trim();
    if (!trimmedOld || !trimmedNew || trimmedOld === trimmedNew) return;

    this.customTags = this.customTags.map(t => t === trimmedOld ? trimmedNew : t).sort();
    // Update in all questions
    let updated = false;
    this.questions = this.questions.map(q => {
      if (q.tags && q.tags.includes(trimmedOld)) {
        updated = true;
        return { 
          ...q, 
          tags: q.tags.map(t => t === trimmedOld ? trimmedNew : t) 
        };
      }
      return q;
    });
    this.saveTags();
    if (updated) this.saveQuestions();
    this.notify();
  }

  // ================= CATEGORIES MANAGEMENT =================
  public getCustomCategories(): CustomCategory[] {
    this.syncCategoriesFromQuestions();
    return [...this.customCategories];
  }

  public addCustomCategory(data: { name: string; description?: string; color?: string }): CustomCategory | null {
    const trimmedName = data.name.trim();
    if (!trimmedName) return null;

    const exists = this.customCategories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) return null;

    const newCat: CustomCategory = {
      id: `cat_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: trimmedName,
      description: data.description?.trim() || '',
      color: data.color || 'purple',
      isSystem: false,
      createdAt: Date.now()
    };

    if (data.color) {
      setCategoryColor(trimmedName, data.color);
    }

    this.customCategories.push(newCat);
    this.saveCategories();
    this.notify();
    return newCat;
  }

  public updateCustomCategory(idOrOldName: string, updates: { name?: string; description?: string; color?: string }): boolean {
    const idx = this.customCategories.findIndex(c => c.id === idOrOldName || c.name === idOrOldName);
    if (idx === -1) return false;

    const oldCategory = this.customCategories[idx];
    const newName = updates.name !== undefined ? updates.name.trim() : oldCategory.name;

    if (!newName) return false;

    // Check duplicate name if changing name
    if (newName.toLowerCase() !== oldCategory.name.toLowerCase()) {
      const exists = this.customCategories.some(c => c.id !== oldCategory.id && c.name.toLowerCase() === newName.toLowerCase());
      if (exists) return false;
    }

    const updatedCat: CustomCategory = {
      ...oldCategory,
      name: newName,
      description: updates.description !== undefined ? updates.description.trim() : oldCategory.description,
      color: updates.color || oldCategory.color
    };

    if (updates.color) {
      setCategoryColor(newName, updates.color);
    }

    const nameChanged = oldCategory.name !== newName;
    this.customCategories[idx] = updatedCat;
    this.saveCategories();

    // Reassign questions if category name changed
    if (nameChanged) {
      let qUpdated = false;
      this.questions = this.questions.map(q => {
        if (q.category === oldCategory.name) {
          qUpdated = true;
          return { ...q, category: newName };
        }
        return q;
      });
      if (qUpdated) this.saveQuestions();
    }

    this.notify();
    return true;
  }

  public deleteCustomCategory(idOrName: string, reassignCategoryName?: string): boolean {
    const target = this.customCategories.find(c => c.id === idOrName || c.name === idOrName);
    if (!target) return false;

    this.customCategories = this.customCategories.filter(c => c.id !== target.id);
    this.saveCategories();

    // Update questions using this category
    const targetName = target.name;
    const newCategoryToAssign = reassignCategoryName || 'Khác / Chưa phân loại';

    let qUpdated = false;
    this.questions = this.questions.map(q => {
      if (q.category === targetName) {
        qUpdated = true;
        return { ...q, category: newCategoryToAssign };
      }
      return q;
    });

    if (qUpdated) this.saveQuestions();
    this.notify();
    return true;
  }
  public getQuestions(): QuestionItem[] {
    return [...this.questions];
  }

  public getQuestionById(id: string): QuestionItem | undefined {
    return this.questions.find(q => q.id === id);
  }

  public reorderQuestion(draggedId: string, targetId: string): void {
    const draggedIndex = this.questions.findIndex(q => q.id === draggedId);
    const targetIndex = this.questions.findIndex(q => q.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;

    const [draggedItem] = this.questions.splice(draggedIndex, 1);
    
    // Recalculate targetIndex after removal if it was after draggedIndex
    const newTargetIndex = this.questions.findIndex(q => q.id === targetId);
    
    this.questions.splice(newTargetIndex, 0, draggedItem);
    this.saveQuestions();
  }

  // Calculate string similarity based on token overlap (Jaccard index approximation)
  private calculateSimilarity(str1: string, str2: string): number {
    const tokenize = (s: string) => {
      return s.toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=-_~()""'']/g, "")
        .split(/\s+/)
        .filter(w => w.length > 2); // Ignore short stop words
    };
    
    const set1 = new Set(tokenize(str1));
    const set2 = new Set(tokenize(str2));
    
    if (set1.size === 0 && set2.size === 0) return 1;
    if (set1.size === 0 || set2.size === 0) return 0;
    
    let intersection = 0;
    for (const word of set1) {
      if (set2.has(word)) intersection++;
    }
    
    const union = set1.size + set2.size - intersection;
    return intersection / union;
  }

  public findSimilarQuestions(questionText: string, currentId?: string, threshold: number = 0.6): {question: QuestionItem, score: number}[] {
    if (!questionText || questionText.trim().length < 10) return [];
    
    const results: {question: QuestionItem, score: number}[] = [];
    
    for (const q of this.questions) {
      if (currentId && q.id === currentId) continue;
      if (!q.question_text) continue;
      
      const score = this.calculateSimilarity(questionText, q.question_text);
      if (score >= threshold) {
        results.push({ question: q, score });
      }
    }
    
    return results.sort((a, b) => b.score - a.score);
  }

  public findDuplicateQuestions(questionText: string, currentId?: string): QuestionItem[] {
    if (!questionText || questionText.trim() === '') return [];
    
    // Normalize string for comparison: lowercase, remove special characters and extra spaces
    const normalize = (str: string) => {
      return str.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()""'']/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
    };

    const normalizedTarget = normalize(questionText);
    
    return this.questions.filter(q => {
      // Skip the current question if we're editing
      if (currentId && q.id === currentId) return false;
      if (!q.question_text) return false;
      return normalize(q.question_text) === normalizedTarget;
    });
  }

  // ================= VERSION HISTORY & SNAPSHOTS =================
  public extractSnapshot(q: QuestionItem): QuestionVersionSnapshot {
    return {
      question_text: q.question_text || '',
      options: { ...(q.options || {}) },
      option_images: q.option_images ? { ...q.option_images } : undefined,
      correct_key: q.correct_key || '',
      explanation: q.explanation || '',
      category: q.category || '',
      round_name: q.round_name || '',
      round_type: q.round_type || 'MULTIPLE_CHOICE',
      round_format: q.round_format,
      cognitive_level: q.cognitive_level,
      digital_competency_domain: q.digital_competency_domain,
      digital_sub_competency: q.digital_sub_competency,
      legal_reference: q.legal_reference,
      approval_status: q.approval_status,
      time_limit: q.time_limit || 15,
      tags: q.tags ? [...q.tags] : [],
      points: q.points,
      media_type: q.media_type,
      media_url: q.media_url,
      host_notes: q.host_notes,
      review_notes: q.review_notes,
      obstacle_info: q.obstacle_info ? { ...q.obstacle_info } : undefined
    };
  }

  public detectChangedFields(oldSnap: QuestionVersionSnapshot, newSnap: QuestionVersionSnapshot): { fieldNames: string[], summary: string } {
    const changes: string[] = [];

    if (oldSnap.question_text !== newSnap.question_text) {
      changes.push('Nội dung câu hỏi');
    }
    if (oldSnap.correct_key !== newSnap.correct_key) {
      changes.push('Đáp án đúng');
    }
    if (JSON.stringify(oldSnap.options) !== JSON.stringify(newSnap.options)) {
      changes.push('Các phương án lựa chọn');
    }
    if (oldSnap.explanation !== newSnap.explanation) {
      changes.push('Giải thích chi tiết');
    }
    if (oldSnap.cognitive_level !== newSnap.cognitive_level) {
      changes.push('Mức độ nhận thức');
    }
    if (oldSnap.digital_competency_domain !== newSnap.digital_competency_domain || oldSnap.digital_sub_competency !== newSnap.digital_sub_competency) {
      changes.push('Miền năng lực số');
    }
    if (oldSnap.legal_reference !== newSnap.legal_reference) {
      changes.push('Căn cứ pháp lý');
    }
    if (oldSnap.approval_status !== newSnap.approval_status) {
      changes.push('Trạng thái phê duyệt');
    }
    if (oldSnap.time_limit !== newSnap.time_limit) {
      changes.push('Thời gian làm bài');
    }
    if (oldSnap.points !== newSnap.points) {
      changes.push('Điểm số');
    }
    if (oldSnap.round_name !== newSnap.round_name || oldSnap.round_format !== newSnap.round_format || oldSnap.round_type !== newSnap.round_type) {
      changes.push('Định dạng & Vòng thi');
    }
    if (oldSnap.category !== newSnap.category) {
      changes.push('Danh mục');
    }
    if (JSON.stringify(oldSnap.tags || []) !== JSON.stringify(newSnap.tags || [])) {
      changes.push('Thẻ nhãn (Tags)');
    }
    if (oldSnap.media_url !== newSnap.media_url || oldSnap.media_type !== newSnap.media_type) {
      changes.push('Tài liệu đa phương tiện');
    }
    if (oldSnap.review_notes !== newSnap.review_notes) {
      changes.push('Ghi chú thẩm định');
    }
    if (JSON.stringify(oldSnap.obstacle_info || {}) !== JSON.stringify(newSnap.obstacle_info || {})) {
      changes.push('Dữ liệu VCNV');
    }

    if (changes.length === 0) {
      return { fieldNames: ['Chỉnh sửa thông tin'], summary: 'Cập nhật thông tin câu hỏi' };
    }

    const summary = `Cập nhật: ${changes.join(', ')}`;
    return { fieldNames: changes, summary };
  }

  public getQuestionVersions(questionId: string): QuestionVersion[] {
    const q = this.questions.find(item => item.id === questionId);
    if (!q) return [];
    if (!q.versions || q.versions.length === 0) {
      const initialVersion: QuestionVersion = {
        id: `v_init_${q.id}`,
        versionNumber: 1,
        timestamp: q.created_at || Date.now(),
        modifiedBy: q.created_by || 'Hội đồng Khảo thí BTI 2026',
        userRole: 'ADMIN',
        action: 'CREATED',
        changeSummary: 'Phiên bản khởi tạo ban đầu của câu hỏi',
        changedFields: ['Khởi tạo ban đầu'],
        snapshot: this.extractSnapshot(q)
      };
      q.versions = [initialVersion];
    }
    return q.versions;
  }

  public revertQuestionVersion(questionId: string, versionId: string): boolean {
    const idx = this.questions.findIndex(q => q.id === questionId);
    if (idx === -1) return false;

    const currentQ = this.questions[idx];
    const versions = this.getQuestionVersions(questionId);
    const targetVersion = versions.find(v => v.id === versionId);
    if (!targetVersion) return false;

    // Apply target snapshot to question
    const targetSnapshot = targetVersion.snapshot;
    const nextVerNum = (versions[0]?.versionNumber || versions.length) + 1;

    const updatedQ: QuestionItem = {
      ...currentQ,
      ...targetSnapshot,
      id: currentQ.id // preserve the ID
    };

    const newSnapshot = this.extractSnapshot(updatedQ);
    const revertVersion: QuestionVersion = {
      id: `v_${Date.now()}_${nextVerNum}`,
      versionNumber: nextVerNum,
      timestamp: Date.now(),
      modifiedBy: this.currentUser.name,
      userRole: this.currentUser.role,
      action: 'REVERTED',
      changeSummary: `Khôi phục về Phiên bản v${targetVersion.versionNumber} (tạo bởi ${targetVersion.modifiedBy} lúc ${new Date(targetVersion.timestamp).toLocaleDateString('vi-VN')})`,
      changedFields: [`Khôi phục về v${targetVersion.versionNumber}`],
      snapshot: newSnapshot
    };

    updatedQ.versions = [revertVersion, ...versions];

    // Log action
    const newLog: QuestionActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      action: 'REVERTED',
      timestamp: Date.now(),
      user: this.currentUser.name,
      userRole: this.currentUser.role,
      details: revertVersion.changeSummary,
      versionNumber: nextVerNum,
      versionId: revertVersion.id
    };
    updatedQ.activity_logs = [newLog, ...(updatedQ.activity_logs || [])];

    this.questions[idx] = updatedQ;
    this.saveQuestions();
    this.notify();
    return true;
  }

  public revertQuestionFields(
    questionId: string, 
    versionId: string, 
    fieldsToRevert: string[], 
    customSummary?: string
  ): boolean {
    const idx = this.questions.findIndex(q => q.id === questionId);
    if (idx === -1) return false;

    const currentQ = this.questions[idx];
    const versions = this.getQuestionVersions(questionId);
    const targetVersion = versions.find(v => v.id === versionId);
    if (!targetVersion) return false;

    const snap = targetVersion.snapshot;
    const isAll = fieldsToRevert.includes('ALL');
    const updatedQ: QuestionItem = { ...currentQ };
    const changedLabels: string[] = [];

    if (isAll || fieldsToRevert.includes('question_text')) {
      updatedQ.question_text = snap.question_text;
      changedLabels.push('Nội dung câu hỏi');
    }
    if (isAll || fieldsToRevert.includes('options_answer')) {
      updatedQ.options = { ...snap.options };
      updatedQ.option_images = snap.option_images ? { ...snap.option_images } : undefined;
      updatedQ.correct_key = snap.correct_key;
      changedLabels.push('Phương án & Đáp án');
    }
    if (isAll || fieldsToRevert.includes('explanation_legal')) {
      updatedQ.explanation = snap.explanation;
      updatedQ.legal_reference = snap.legal_reference;
      changedLabels.push('Lời giải & Căn cứ pháp lý');
    }
    if (isAll || fieldsToRevert.includes('competency_level')) {
      updatedQ.cognitive_level = snap.cognitive_level;
      updatedQ.digital_competency_domain = snap.digital_competency_domain;
      updatedQ.digital_sub_competency = snap.digital_sub_competency;
      changedLabels.push('Miền năng lực & Mức độ');
    }
    if (isAll || fieldsToRevert.includes('time_points')) {
      updatedQ.time_limit = snap.time_limit;
      updatedQ.points = snap.points;
      changedLabels.push('Thời gian & Điểm');
    }
    if (isAll || fieldsToRevert.includes('category_tags')) {
      updatedQ.category = snap.category;
      updatedQ.tags = snap.tags ? [...snap.tags] : [];
      changedLabels.push('Danh mục & Thẻ');
    }
    if (isAll || fieldsToRevert.includes('round_format')) {
      updatedQ.round_name = snap.round_name;
      updatedQ.round_type = snap.round_type;
      updatedQ.round_format = snap.round_format;
      changedLabels.push('Vòng thi & Định dạng');
    }
    if (isAll || fieldsToRevert.includes('media_obstacle')) {
      updatedQ.media_type = snap.media_type;
      updatedQ.media_url = snap.media_url;
      updatedQ.obstacle_info = snap.obstacle_info ? { ...snap.obstacle_info } : undefined;
      changedLabels.push('Đa phương tiện / VCNV');
    }

    const nextVerNum = (versions[0]?.versionNumber || versions.length) + 1;
    const newSnapshot = this.extractSnapshot(updatedQ);
    const summary = customSummary || `Khôi phục có chọn lọc từ v${targetVersion.versionNumber} (${changedLabels.join(', ')})`;

    const revertVersion: QuestionVersion = {
      id: `v_${Date.now()}_${nextVerNum}`,
      versionNumber: nextVerNum,
      timestamp: Date.now(),
      modifiedBy: this.currentUser.name,
      userRole: this.currentUser.role,
      action: 'REVERTED',
      changeSummary: summary,
      changedFields: changedLabels,
      snapshot: newSnapshot
    };

    updatedQ.versions = [revertVersion, ...versions];

    const newLog: QuestionActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      action: 'REVERTED',
      timestamp: Date.now(),
      user: this.currentUser.name,
      userRole: this.currentUser.role,
      details: summary,
      versionNumber: nextVerNum,
      versionId: revertVersion.id
    };
    updatedQ.activity_logs = [newLog, ...(updatedQ.activity_logs || [])];

    this.questions[idx] = updatedQ;
    this.saveQuestions();
    this.notify();
    return true;
  }

  public batchRevertQuestions(questionIds: string[], mode: 'PREVIOUS' | 'INITIAL' = 'PREVIOUS'): { count: number; failed: number } {
    let count = 0;
    let failed = 0;

    for (const qId of questionIds) {
      const versions = this.getQuestionVersions(qId);
      if (versions.length <= 1) {
        failed++;
        continue;
      }

      let targetVersion: QuestionVersion | undefined;
      if (mode === 'PREVIOUS') {
        // Immediate previous version is index 1
        targetVersion = versions[1];
      } else {
        // Initial version is the last one in versions array (v1)
        targetVersion = versions[versions.length - 1];
      }

      if (targetVersion && this.revertQuestionVersion(qId, targetVersion.id)) {
        count++;
      } else {
        failed++;
      }
    }

    return { count, failed };
  }

  private _logAction(question: QuestionItem, action: QuestionActivityLog['action'], details?: string, versionNumber?: number, versionId?: string): QuestionItem {
    const newLog: QuestionActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      action,
      timestamp: Date.now(),
      user: this.currentUser.name,
      userRole: this.currentUser.role,
      details,
      versionNumber,
      versionId
    };
    return {
      ...question,
      activity_logs: [newLog, ...(question.activity_logs || [])]
    };
  }

  public addQuestion(question: QuestionItem): void {
    let newQ: QuestionItem = {
      ...question,
      id: question.id || `Q_${Date.now()}`,
      created_at: question.created_at || Date.now(),
      created_by: question.created_by || this.currentUser.name,
      approval_status: question.approval_status || (this.canAutoApprove() ? 'APPROVED' : 'PENDING_REVIEW')
    };

    const initialSnapshot = this.extractSnapshot(newQ);
    const initialVersion: QuestionVersion = {
      id: `v_${Date.now()}_1`,
      versionNumber: 1,
      timestamp: Date.now(),
      modifiedBy: this.currentUser.name,
      userRole: this.currentUser.role,
      action: 'CREATED',
      changeSummary: 'Tạo mới câu hỏi trong ngân hàng đề',
      changedFields: ['Tạo mới'],
      snapshot: initialSnapshot
    };
    newQ.versions = [initialVersion];
    newQ = this._logAction(newQ, 'CREATED', 'Tạo mới câu hỏi trong ngân hàng đề', 1, initialVersion.id);
    
    this.questions.unshift(newQ);
    this.saveQuestions();
    this.notify();
  }

  public updateQuestion(id: string, updates: Partial<QuestionItem>, customSummary?: string): void {
    const idx = this.questions.findIndex(q => q.id === id);
    if (idx !== -1) {
      const oldQ = this.questions[idx];
      const oldSnapshot = this.extractSnapshot(oldQ);
      let updatedQ: QuestionItem = { ...oldQ, ...updates };
      const newSnapshot = this.extractSnapshot(updatedQ);

      const diff = this.detectChangedFields(oldSnapshot, newSnapshot);
      const existingVersions = this.getQuestionVersions(id);
      const nextVerNum = (existingVersions[0]?.versionNumber || existingVersions.length) + 1;

      const newVersion: QuestionVersion = {
        id: `v_${Date.now()}_${nextVerNum}`,
        versionNumber: nextVerNum,
        timestamp: Date.now(),
        modifiedBy: this.currentUser.name,
        userRole: this.currentUser.role,
        action: 'EDITED',
        changeSummary: customSummary || diff.summary,
        changedFields: diff.fieldNames,
        snapshot: newSnapshot
      };

      updatedQ.versions = [newVersion, ...existingVersions];
      updatedQ = this._logAction(updatedQ, 'EDITED', customSummary || diff.summary, nextVerNum, newVersion.id);

      this.questions[idx] = updatedQ;
      this.saveQuestions();
      this.notify();
    }
  }

  public deleteQuestion(id: string): void {
    this.questions = this.questions.filter(q => q.id !== id);
    this.saveQuestions();
    this.notify();
  }

  public batchDelete(ids: string[]): number {
    const idSet = new Set(ids);
    const initialLen = this.questions.length;
    this.questions = this.questions.filter(q => !idSet.has(q.id));
    const deletedCount = initialLen - this.questions.length;
    this.saveQuestions();
    this.notify();
    return deletedCount;
  }

  public batchUpdate(ids: string[], updates: Partial<QuestionItem>): number {
    const idSet = new Set(ids);
    let updatedCount = 0;
    this.questions = this.questions.map(q => {
      if (idSet.has(q.id)) {
        updatedCount++;
        const oldSnapshot = this.extractSnapshot(q);
        const updatedQ: QuestionItem = { ...q, ...updates };
        const newSnapshot = this.extractSnapshot(updatedQ);
        const diff = this.detectChangedFields(oldSnapshot, newSnapshot);
        const existingVersions = q.versions || this.getQuestionVersions(q.id);
        const nextVerNum = (existingVersions[0]?.versionNumber || existingVersions.length) + 1;

        const newVersion: QuestionVersion = {
          id: `v_${Date.now()}_${nextVerNum}`,
          versionNumber: nextVerNum,
          timestamp: Date.now(),
          modifiedBy: this.currentUser.name,
          userRole: this.currentUser.role,
          action: 'EDITED',
          changeSummary: `Cập nhật hàng loạt: ${diff.summary}`,
          changedFields: diff.fieldNames,
          snapshot: newSnapshot
        };

        updatedQ.versions = [newVersion, ...existingVersions];
        return this._logAction(updatedQ, 'EDITED', `Cập nhật hàng loạt: ${diff.summary}`, nextVerNum, newVersion.id);
      }
      return q;
    });
    this.saveQuestions();
    this.notify();
    return updatedCount;
  }

  public approveQuestion(id: string, notes?: string): void {
    const idx = this.questions.findIndex(q => q.id === id);
    if (idx !== -1) {
      const oldQ = this.questions[idx];
      let updatedQ: QuestionItem = {
        ...oldQ,
        approval_status: 'APPROVED' as ApprovalStatus,
        approved_by: this.currentUser.name,
        review_notes: notes !== undefined ? notes : oldQ.review_notes
      };
      
      const newSnapshot = this.extractSnapshot(updatedQ);
      const existingVersions = this.getQuestionVersions(id);
      const nextVerNum = (existingVersions[0]?.versionNumber || existingVersions.length) + 1;
      const summary = notes ? `Đã phê duyệt câu hỏi (Ghi chú: ${notes})` : 'Đã phê duyệt câu hỏi vào ngân hàng chính thức';

      const newVersion: QuestionVersion = {
        id: `v_${Date.now()}_${nextVerNum}`,
        versionNumber: nextVerNum,
        timestamp: Date.now(),
        modifiedBy: this.currentUser.name,
        userRole: this.currentUser.role,
        action: 'STATUS_CHANGED',
        changeSummary: summary,
        changedFields: ['Trạng thái phê duyệt: ĐÃ DUYỆT'],
        snapshot: newSnapshot
      };

      updatedQ.versions = [newVersion, ...existingVersions];
      updatedQ = this._logAction(updatedQ, 'STATUS_CHANGED', summary, nextVerNum, newVersion.id);
      this.questions[idx] = updatedQ;
      this.saveQuestions();
      this.notify();
    }
  }

  public rejectQuestion(id: string, notes?: string): void {
    const idx = this.questions.findIndex(q => q.id === id);
    if (idx !== -1) {
      const oldQ = this.questions[idx];
      let updatedQ: QuestionItem = {
        ...oldQ,
        approval_status: 'REJECTED' as ApprovalStatus,
        approved_by: this.currentUser.name,
        review_notes: notes !== undefined ? notes : oldQ.review_notes
      };

      const newSnapshot = this.extractSnapshot(updatedQ);
      const existingVersions = this.getQuestionVersions(id);
      const nextVerNum = (existingVersions[0]?.versionNumber || existingVersions.length) + 1;
      const summary = notes ? `Từ chối câu hỏi / Yêu cầu chỉnh sửa (Lý do: ${notes})` : 'Từ chối câu hỏi / Yêu cầu chỉnh sửa';

      const newVersion: QuestionVersion = {
        id: `v_${Date.now()}_${nextVerNum}`,
        versionNumber: nextVerNum,
        timestamp: Date.now(),
        modifiedBy: this.currentUser.name,
        userRole: this.currentUser.role,
        action: 'STATUS_CHANGED',
        changeSummary: summary,
        changedFields: ['Trạng thái phê duyệt: TỪ CHỐI'],
        snapshot: newSnapshot
      };

      updatedQ.versions = [newVersion, ...existingVersions];
      updatedQ = this._logAction(updatedQ, 'STATUS_CHANGED', summary, nextVerNum, newVersion.id);
      this.questions[idx] = updatedQ;
      this.saveQuestions();
      this.notify();
    }
  }

  public setPendingReview(id: string, notes?: string): void {
    const idx = this.questions.findIndex(q => q.id === id);
    if (idx !== -1) {
      const oldQ = this.questions[idx];
      let updatedQ: QuestionItem = {
        ...oldQ,
        approval_status: 'PENDING_REVIEW' as ApprovalStatus,
        review_notes: notes !== undefined ? notes : oldQ.review_notes
      };

      const newSnapshot = this.extractSnapshot(updatedQ);
      const existingVersions = this.getQuestionVersions(id);
      const nextVerNum = (existingVersions[0]?.versionNumber || existingVersions.length) + 1;
      const summary = 'Chuyển về trạng thái chờ thẩm định';

      const newVersion: QuestionVersion = {
        id: `v_${Date.now()}_${nextVerNum}`,
        versionNumber: nextVerNum,
        timestamp: Date.now(),
        modifiedBy: this.currentUser.name,
        userRole: this.currentUser.role,
        action: 'STATUS_CHANGED',
        changeSummary: summary,
        changedFields: ['Trạng thái: CHỜ THẨM ĐỊNH'],
        snapshot: newSnapshot
      };

      updatedQ.versions = [newVersion, ...existingVersions];
      updatedQ = this._logAction(updatedQ, 'STATUS_CHANGED', summary, nextVerNum, newVersion.id);
      this.questions[idx] = updatedQ;
      this.saveQuestions();
      this.notify();
    }
  }

  public setQuestionReview(id: string, status: ApprovalStatus, notes?: string, reviewerName?: string): void {
    const idx = this.questions.findIndex(q => q.id === id);
    if (idx === -1) return;

    const oldQ = this.questions[idx];
    const reviewer = reviewerName || this.currentUser.name;
    const statusLabels: Record<string, string> = {
      'DRAFT': 'Đang soạn',
      'PENDING_REVIEW': 'Chờ duyệt',
      'APPROVED': 'Đã duyệt',
      'REJECTED': 'Cần sửa / Từ chối',
      'NEEDS_REVISION': 'Cần sửa'
    };
    const label = statusLabels[status] || status;

    let updatedQ: QuestionItem = {
      ...oldQ,
      approval_status: status,
      approved_by: reviewer,
      review_notes: notes !== undefined ? notes : oldQ.review_notes
    };

    const newSnapshot = this.extractSnapshot(updatedQ);
    const existingVersions = this.getQuestionVersions(id);
    const nextVerNum = (existingVersions[0]?.versionNumber || existingVersions.length) + 1;
    const summary = notes 
      ? `Review nhanh: [${label}] - Ghi chú: ${notes}`
      : `Review nhanh: Chuyển trạng thái sang [${label}]`;

    const newVersion: QuestionVersion = {
      id: `v_${Date.now()}_${nextVerNum}`,
      versionNumber: nextVerNum,
      timestamp: Date.now(),
      modifiedBy: reviewer,
      userRole: this.currentUser.role,
      action: 'STATUS_CHANGED',
      changeSummary: summary,
      changedFields: [`Trạng thái: ${label}`, ...(notes ? ['Ghi chú review'] : [])],
      snapshot: newSnapshot
    };

    updatedQ.versions = [newVersion, ...existingVersions];
    updatedQ = this._logAction(updatedQ, 'STATUS_CHANGED', summary, nextVerNum, newVersion.id);
    this.questions[idx] = updatedQ;
    this.saveQuestions();
    this.notify();
  }

  public updateReviewNotes(id: string, notes: string): void {
    const idx = this.questions.findIndex(q => q.id === id);
    if (idx !== -1) {
      let updatedQ: QuestionItem = {
        ...this.questions[idx],
        review_notes: notes
      };
      updatedQ = this._logAction(updatedQ, 'NOTE_ADDED', `Cập nhật ghi chú thẩm định: ${notes}`);
      this.questions[idx] = updatedQ;
      this.saveQuestions();
      this.notify();
    }
  }

  public batchApprove(ids: string[], notes?: string): void {
    const idSet = new Set(ids);
    this.questions = this.questions.map(q => {
      if (idSet.has(q.id)) {
        return {
          ...q,
          approval_status: 'APPROVED',
          approved_by: this.currentUser.name,
          ...(notes !== undefined && notes.trim() ? { review_notes: notes } : {})
        };
      }
      return q;
    });
    this.saveQuestions();
    this.notify();
  }

  public batchReject(ids: string[], notes?: string): void {
    const idSet = new Set(ids);
    this.questions = this.questions.map(q => {
      if (idSet.has(q.id)) {
        return {
          ...q,
          approval_status: 'REJECTED',
          approved_by: this.currentUser.name,
          ...(notes !== undefined && notes.trim() ? { review_notes: notes } : {})
        };
      }
      return q;
    });
    this.saveQuestions();
    this.notify();
  }

  public batchSetPending(ids: string[], notes?: string): void {
    const idSet = new Set(ids);
    this.questions = this.questions.map(q => {
      if (idSet.has(q.id)) {
        return {
          ...q,
          approval_status: 'PENDING_REVIEW',
          ...(notes !== undefined && notes.trim() ? { review_notes: notes } : {})
        };
      }
      return q;
    });
    this.saveQuestions();
    this.notify();
  }

  public batchImport(newQuestions: QuestionItem[]): void {
    const timestamp = Date.now();
    const questionsWithMeta = newQuestions.map((q, idx) => {
      const qId = q.id || `IMP_${timestamp.toString(36)}_${idx + 1}`;
      const itemWithId: QuestionItem = {
        ...q,
        id: qId,
        created_at: q.created_at || timestamp,
        created_by: q.created_by || this.currentUser.name,
        approval_status: q.approval_status || (this.canAutoApprove() ? 'APPROVED' : 'PENDING_REVIEW')
      };

      const initialVersion: QuestionVersion = {
        id: `v_init_${qId}`,
        versionNumber: 1,
        timestamp: itemWithId.created_at || timestamp,
        modifiedBy: itemWithId.created_by || this.currentUser.name,
        userRole: this.currentUser.role,
        action: 'IMPORTED',
        changeSummary: `Nhập hàng loạt từ tập tin (${q.category || 'Tập tin dữ liệu'})`,
        changedFields: ['Khởi tạo từ tệp nhập khẩu'],
        snapshot: this.extractSnapshot(itemWithId)
      };

      const initialLog: QuestionActivityLog = {
        id: Math.random().toString(36).substring(2, 9),
        action: 'CREATED',
        timestamp: itemWithId.created_at || timestamp,
        user: itemWithId.created_by || this.currentUser.name,
        userRole: this.currentUser.role,
        details: `Nhập hàng loạt vào ngân hàng đề thi: ${itemWithId.round_name || 'Câu hỏi mới'}`,
        versionNumber: 1,
        versionId: initialVersion.id
      };

      return {
        ...itemWithId,
        versions: itemWithId.versions && itemWithId.versions.length > 0 ? itemWithId.versions : [initialVersion],
        activity_logs: itemWithId.activity_logs && itemWithId.activity_logs.length > 0 ? itemWithId.activity_logs : [initialLog]
      };
    });

    this.questions = [...questionsWithMeta, ...this.questions];
    this.saveQuestions();
    this.notify();
  }

  private saveQuestions(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(this.questions));
    }
  }

  // ================= SCENARIOS CRUD =================
  public getScenarios(): InteractiveScenario[] {
    return [...this.scenarios];
  }

  public addScenario(scenario: InteractiveScenario): void {
    this.scenarios.unshift({
      ...scenario,
      id: scenario.id || `SCENARIO_${Date.now()}`,
      createdAt: scenario.createdAt || Date.now(),
      author: scenario.author || this.currentUser.name,
      status: scenario.status || (this.canAutoApprove() ? 'APPROVED' : 'PENDING_REVIEW')
    });
    this.saveScenarios();
    this.notify();
  }

  public updateScenario(id: string, updates: Partial<InteractiveScenario>): void {
    const idx = this.scenarios.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.scenarios[idx] = { ...this.scenarios[idx], ...updates };
      this.saveScenarios();
      this.notify();
    }
  }

  public deleteScenario(id: string): void {
    this.scenarios = this.scenarios.filter(s => s.id !== id);
    this.saveScenarios();
    this.notify();
  }

  private saveScenarios(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SCENARIOS, JSON.stringify(this.scenarios));
    }
  }

  // ================= LEGAL DOCUMENTS CRUD =================
  public getDocuments(): LegalDocument[] {
    return [...this.documents];
  }

  public addDocument(doc: LegalDocument): void {
    this.documents.unshift({
      ...doc,
      id: doc.id || `DOC_${Date.now()}`,
      uploadedAt: doc.uploadedAt || Date.now(),
      uploadedBy: doc.uploadedBy || this.currentUser.name
    });
    this.saveDocuments();
    this.notify();
  }

  public deleteDocument(id: string): void {
    this.documents = this.documents.filter(d => d.id !== id);
    this.saveDocuments();
    this.notify();
  }

  private saveDocuments(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(this.documents));
    }
  }

  // ================= USERS & RBAC =================
  public getUsers(): AppUser[] {
    return [...this.users];
  }

  public getCurrentUser(): AppUser {
    return this.currentUser;
  }

  public setCurrentUser(user: AppUser): void {
    this.currentUser = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
    this.notify();
  }

  public switchUserById(id: string): void {
    const u = this.users.find(x => x.id === id);
    if (u) this.setCurrentUser(u);
  }

  public addUser(user: AppUser): void {
    this.users.push(user);
    this.saveUsers();
    this.notify();
  }

  public updateUserRole(userId: string, newRole: UserRole): boolean {
    const u = this.users.find(x => x.id === userId);
    if (!u) return false;
    u.role = newRole;
    if (this.currentUser.id === userId) {
      this.currentUser = { ...this.currentUser, role: newRole };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
      }
    }
    this.saveUsers();
    this.notify();
    return true;
  }

  public deleteUser(userId: string): boolean {
    if (this.currentUser.id === userId) return false; // Không xóa chính mình
    this.users = this.users.filter(x => x.id !== userId);
    this.saveUsers();
    this.notify();
    return true;
  }

  public updateUserProfile(userId: string, updates: Partial<AppUser>): boolean {
    const u = this.users.find(x => x.id === userId);
    if (!u) return false;
    Object.assign(u, updates);
    if (this.currentUser.id === userId) {
      this.currentUser = { ...this.currentUser, ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
      }
    }
    this.saveUsers();
    this.notify();
    return true;
  }

  public canApprove(): boolean {
    return ['SUPER_ADMIN', 'HEAD_EDITOR'].includes(this.currentUser.role);
  }

  public canExport(): boolean {
    return ['SUPER_ADMIN', 'HEAD_EDITOR', 'EXAMINER'].includes(this.currentUser.role);
  }

  public canAutoApprove(): boolean {
    return ['SUPER_ADMIN', 'HEAD_EDITOR'].includes(this.currentUser.role);
  }

  public canDelete(): boolean {
    return ['SUPER_ADMIN', 'HEAD_EDITOR'].includes(this.currentUser.role);
  }

  public canManageUsers(): boolean {
    return this.currentUser.role === 'SUPER_ADMIN';
  }

  private saveUsers(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(this.users));
    }
  }

  // ================= STATISTICS & MATRIX =================
  public getMatrixStats() {
    const total = this.questions.length;
    const byStage: Record<string, number> = {
      VONG_LOAI: 0,
      BAN_KET_1: 0,
      BAN_KET_2: 0,
      BAN_KET_3: 0,
      CHUNG_KET: 0
    };
    const byDomain: Record<DigitalCompetencyDomainKey, number> = {
      MIEN_1: 0,
      MIEN_2: 0,
      MIEN_3: 0,
      MIEN_4: 0,
      MIEN_5: 0,
      MIEN_6: 0
    };
    const byLevel: Record<CognitiveLevel, number> = {
      NHAN_BIET: 0,
      THONG_HIEU: 0,
      VAN_DUNG: 0,
      VAN_DUNG_CAO: 0
    };
    const byStatus: Record<ApprovalStatus, number> = {
      APPROVED: 0,
      PENDING_REVIEW: 0,
      DRAFT: 0,
      REJECTED: 0,
      NEEDS_REVISION: 0
    };
    const byRoundGroup: Record<BtiRoundGroupKey, number> = {
      KHOI_DONG: 0,
      VCNV: 0,
      TANG_TOC: 0,
      VE_DICH: 0,
      VONG_LOAI: 0,
      PHU: 0
    };

    // 2D Matrix: Domain x Level
    const matrix2D: Record<DigitalCompetencyDomainKey, Record<CognitiveLevel, number>> = {
      MIEN_1: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_2: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_3: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_4: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_5: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_6: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 }
    };

    this.questions.forEach(q => {
      const s = q.stage || 'BAN_KET_1';
      byStage[s] = (byStage[s] || 0) + 1;

      const d = q.digital_competency_domain || 'MIEN_1';
      byDomain[d] = (byDomain[d] || 0) + 1;

      const l = q.cognitive_level || 'THONG_HIEU';
      byLevel[l] = (byLevel[l] || 0) + 1;

      const st = q.approval_status || 'APPROVED';
      byStatus[st] = (byStatus[st] || 0) + 1;

      // Determine round group
      let rg: BtiRoundGroupKey = 'KHOI_DONG';
      if (q.stage === 'VONG_LOAI' || (q.round_format && q.round_format.startsWith('BGD_'))) {
        rg = 'VONG_LOAI';
      } else if (q.round_format) {
        rg = getRoundGroupByFormat(q.round_format) || 'KHOI_DONG';
      } else {
        const idUpper = (q.id || '').toUpperCase();
        if (idUpper.startsWith('KD_') || idUpper.startsWith('KD')) rg = 'KHOI_DONG';
        else if (idUpper.startsWith('VCNV_') || idUpper.startsWith('VCNV')) rg = 'VCNV';
        else if (idUpper.startsWith('TT_') || idUpper.startsWith('TT')) rg = 'TANG_TOC';
        else if (idUpper.startsWith('VD_') || idUpper.startsWith('VD')) rg = 'VE_DICH';
        else {
          const nameLower = (q.round_name || '').toLowerCase();
          if (nameLower.includes('khởi động') || nameLower.includes('khoi dong')) rg = 'KHOI_DONG';
          else if (nameLower.includes('chướng ngại vật') || nameLower.includes('vcnv')) rg = 'VCNV';
          else if (nameLower.includes('tăng tốc') || nameLower.includes('tang toc')) rg = 'TANG_TOC';
          else if (nameLower.includes('về đích') || nameLower.includes('ve dich')) rg = 'VE_DICH';
        }
      }
      byRoundGroup[rg] = (byRoundGroup[rg] || 0) + 1;

      if (matrix2D[d] && matrix2D[d][l] !== undefined) {
        matrix2D[d][l]++;
      }
    });

    return {
      total,
      byStage,
      byRoundGroup,
      byDomain,
      byLevel,
      byStatus,
      matrix2D,
      scenariosCount: this.scenarios.length,
      documentsCount: this.documents.length
    };
  }

  // ================= RANDOM EXAM GENERATION =================
  public generateRandomExam(config: {
    title: string;
    stage: CompetitionStage;
    totalQuestions: number;
    timeMinutes: number;
    levelDistribution: {
      NHAN_BIET: number; // percentage
      THONG_HIEU: number;
      VAN_DUNG: number;
      VAN_DUNG_CAO: number;
    };
    domainFilters?: DigitalCompetencyDomainKey[];
    onlyApproved?: boolean;
  }): GeneratedExam {
    const candidates = this.questions.filter(q => {
      if (config.onlyApproved && q.approval_status !== 'APPROVED') return false;
      if (config.domainFilters && config.domainFilters.length > 0) {
        if (!q.digital_competency_domain || !config.domainFilters.includes(q.digital_competency_domain)) {
          return false;
        }
      }
      return true;
    });

    // Bucket by level
    const buckets: Record<CognitiveLevel, QuestionItem[]> = {
      NHAN_BIET: candidates.filter(q => q.cognitive_level === 'NHAN_BIET'),
      THONG_HIEU: candidates.filter(q => q.cognitive_level === 'THONG_HIEU'),
      VAN_DUNG: candidates.filter(q => q.cognitive_level === 'VAN_DUNG'),
      VAN_DUNG_CAO: candidates.filter(q => q.cognitive_level === 'VAN_DUNG_CAO')
    };

    // Calculate count per level
    const countNhanBiet = Math.round((config.totalQuestions * config.levelDistribution.NHAN_BIET) / 100);
    const countThongHieu = Math.round((config.totalQuestions * config.levelDistribution.THONG_HIEU) / 100);
    const countVanDung = Math.round((config.totalQuestions * config.levelDistribution.VAN_DUNG) / 100);
    const countVanDungCao = config.totalQuestions - (countNhanBiet + countThongHieu + countVanDung);

    const targetCounts: Record<CognitiveLevel, number> = {
      NHAN_BIET: countNhanBiet,
      THONG_HIEU: countThongHieu,
      VAN_DUNG: countVanDung,
      VAN_DUNG_CAO: Math.max(0, countVanDungCao)
    };

    const selectedQuestions: QuestionItem[] = [];
    const usedIds = new Set<string>();

    if (config.stage === 'VONG_LOAI') {
      // VÒNG LOẠI BTI 2026: Đề thi chuẩn hóa 28 câu (24 câu Phần I trắc nghiệm 4 lựa chọn + 4 câu Phần II Đúng/Sai 4 ý)
      // Không chọn hoặc phân chia theo các vòng thi Gameshow (Khởi động, VCNV, Tăng tốc, Về đích).
      const part1Pool = candidates.filter(q => 
        q.round_format === 'BGD_MULTIPLE_CHOICE' || 
        q.round_type === 'MULTIPLE_CHOICE' ||
        (q.options && Object.keys(q.options).length >= 4 && q.round_type !== 'TRUE_FALSE_4')
      );
      const part1Fallback = this.questions.filter(q => 
        !usedIds.has(q.id) && (
          q.round_format === 'BGD_MULTIPLE_CHOICE' || 
          q.round_type === 'MULTIPLE_CHOICE' ||
          (q.options && Object.keys(q.options).length >= 4 && q.round_type !== 'TRUE_FALSE_4')
        )
      );

      const part2Pool = candidates.filter(q => 
        q.round_format === 'BGD_TRUE_FALSE_4' || 
        q.round_type === 'TRUE_FALSE_4'
      );
      const part2Fallback = this.questions.filter(q => 
        !usedIds.has(q.id) && (
          q.round_format === 'BGD_TRUE_FALSE_4' || 
          q.round_type === 'TRUE_FALSE_4'
        )
      );

      const targetP1 = 24;
      const p1NhanBiet = Math.round((targetP1 * config.levelDistribution.NHAN_BIET) / 100);
      const p1ThongHieu = Math.round((targetP1 * config.levelDistribution.THONG_HIEU) / 100);
      const p1VanDung = Math.round((targetP1 * config.levelDistribution.VAN_DUNG) / 100);
      const p1VanDungCao = targetP1 - (p1NhanBiet + p1ThongHieu + p1VanDung);

      const p1Targets: Record<CognitiveLevel, number> = {
        NHAN_BIET: p1NhanBiet,
        THONG_HIEU: p1ThongHieu,
        VAN_DUNG: p1VanDung,
        VAN_DUNG_CAO: Math.max(0, p1VanDungCao)
      };

      const pickForArray = (pool: QuestionItem[], count: number, target: QuestionItem[]) => {
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        for (const item of shuffled) {
          if (!usedIds.has(item.id)) {
            target.push(item);
            usedIds.add(item.id);
            count--;
            if (count <= 0) break;
          }
        }
      };

      const part1Selected: QuestionItem[] = [];
      (['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'] as CognitiveLevel[]).forEach(lvl => {
        const lvlPool = part1Pool.filter(q => q.cognitive_level === lvl);
        pickForArray(lvlPool, p1Targets[lvl], part1Selected);
      });
      if (part1Selected.length < 24) {
        pickForArray(part1Pool, 24 - part1Selected.length, part1Selected);
      }
      if (part1Selected.length < 24) {
        pickForArray(part1Fallback, 24 - part1Selected.length, part1Selected);
      }

      const part2Selected: QuestionItem[] = [];
      pickForArray(part2Pool, 4, part2Selected);
      if (part2Selected.length < 4) {
        pickForArray(part2Fallback, 4 - part2Selected.length, part2Selected);
      }

      // Đóng gói 24 câu Phần I và 4 câu Phần II
      const part1Decorated = part1Selected.map((q, idx) => ({
        ...q,
        round_name: 'Phần I: Trắc nghiệm 4 lựa chọn (24 câu)',
        round_format: 'BGD_MULTIPLE_CHOICE' as QuestionRoundFormat,
        stage: 'VONG_LOAI' as CompetitionStage,
        order_in_exam: idx + 1
      }));

      const part2Decorated = part2Selected.map((q, idx) => ({
        ...q,
        round_name: 'Phần II: Câu hỏi Đúng / Sai (4 câu)',
        round_format: 'BGD_TRUE_FALSE_4' as QuestionRoundFormat,
        round_type: 'TRUE_FALSE_4' as const,
        stage: 'VONG_LOAI' as CompetitionStage,
        order_in_exam: 24 + idx + 1
      }));

      selectedQuestions.push(...part1Decorated, ...part2Decorated);
    } else {
      // Helper random pick for Gameshow rounds (Bán kết, Chung kết)
      const pickRandom = (arr: QuestionItem[], count: number) => {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        for (const item of shuffled) {
          if (selectedQuestions.length >= config.totalQuestions) break;
          if (!usedIds.has(item.id)) {
            selectedQuestions.push(item);
            usedIds.add(item.id);
            count--;
            if (count <= 0) break;
          }
        }
      };

      // Pick from buckets
      (['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'] as CognitiveLevel[]).forEach(level => {
        pickRandom(buckets[level], targetCounts[level]);
      });

      // Fill remaining if candidates in specific bucket were insufficient
      if (selectedQuestions.length < config.totalQuestions) {
        const remainingCandidates = candidates.filter(q => !usedIds.has(q.id));
        pickRandom(remainingCandidates, config.totalQuestions - selectedQuestions.length);
      }
    }

    // Attach matching scenarios for Finals
    const attachedScenarios = config.stage === 'CHUNG_KET' ? this.scenarios.slice(0, 2) : [];

    const examCode = `BTI26_${config.stage}_${Math.floor(100 + Math.random() * 900)}`;
    const exam: GeneratedExam = {
      id: `EXAM_${Date.now()}`,
      code: examCode,
      title: config.title || `Bộ Đề ${config.stage} - BTI 2026`,
      stage: config.stage,
      createdAt: Date.now(),
      createdBy: this.currentUser.name,
      totalQuestions: selectedQuestions.length,
      totalScore: 100,
      timeAllowedMinutes: config.timeMinutes || 45,
      questions: selectedQuestions,
      scenarios: attachedScenarios,
      matrixSummary: {
        byLevel: {
          NHAN_BIET: selectedQuestions.filter(q => q.cognitive_level === 'NHAN_BIET').length,
          THONG_HIEU: selectedQuestions.filter(q => q.cognitive_level === 'THONG_HIEU').length,
          VAN_DUNG: selectedQuestions.filter(q => q.cognitive_level === 'VAN_DUNG').length,
          VAN_DUNG_CAO: selectedQuestions.filter(q => q.cognitive_level === 'VAN_DUNG_CAO').length
        },
        byDomain: {
          MIEN_1: selectedQuestions.filter(q => q.digital_competency_domain === 'MIEN_1').length,
          MIEN_2: selectedQuestions.filter(q => q.digital_competency_domain === 'MIEN_2').length,
          MIEN_3: selectedQuestions.filter(q => q.digital_competency_domain === 'MIEN_3').length,
          MIEN_4: selectedQuestions.filter(q => q.digital_competency_domain === 'MIEN_4').length,
          MIEN_5: selectedQuestions.filter(q => q.digital_competency_domain === 'MIEN_5').length,
          MIEN_6: selectedQuestions.filter(q => q.digital_competency_domain === 'MIEN_6').length
        }
      }
    };

    this.generatedExams.unshift(exam);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.GENERATED_EXAMS, JSON.stringify(this.generatedExams));
    }
    this.notify();
    return exam;
  }

  public getGeneratedExams(): GeneratedExam[] {
    return [...this.generatedExams];
  }

  /**
   * Đánh lại mã toàn bộ câu hỏi theo từng vòng thi (VCNV_01..., KD_01..., TT_01..., VD_01..., VL_01..., PHU_01...)
   */
  public reindexRoundQuestions(roundGroup: BtiRoundGroupKey): { reindexedCount: number; updatedQuestions: QuestionItem[] } {
    let index = 0;
    let anyChanged = false;

    const prefixMap: Record<BtiRoundGroupKey, string> = {
      KHOI_DONG: 'KD',
      VCNV: 'VCNV',
      TANG_TOC: 'TT',
      VE_DICH: 'VD',
      VONG_LOAI: 'VL',
      PHU: 'PHU'
    };

    const prefix = prefixMap[roundGroup] || 'Q';

    this.questions = this.questions.map(q => {
      let belongs = false;
      const idUpper = (q.id || '').toUpperCase();
      const nameLower = (q.round_name || '').toLowerCase();

      if (roundGroup === 'VCNV') {
        belongs = q.round_type === 'VCNV' || 
          idUpper === 'VCNV_01' || 
          idUpper.startsWith('VCNV_') || 
          idUpper.startsWith('CNV') || 
          Boolean(q.round_format?.includes('VCNV')) ||
          nameLower.includes('chướng ngại vật') ||
          ('clue1' in (q.options || {}));
      } else if (roundGroup === 'KHOI_DONG') {
        belongs = (Boolean(q.round_format?.startsWith('KD_')) || Boolean(q.round_format?.startsWith('KHOI_DONG')) || 
          idUpper.startsWith('KD_') || idUpper.startsWith('KD') ||
          nameLower.includes('khởi động') || nameLower.includes('khoi dong')) &&
          q.round_type !== 'VCNV' && !idUpper.startsWith('VCNV') && !idUpper.startsWith('CNV');
      } else if (roundGroup === 'TANG_TOC') {
        belongs = Boolean(q.round_format?.startsWith('TT_')) || q.round_format === 'TANG_TOC' || 
          idUpper.startsWith('TT_') || idUpper.startsWith('TT') ||
          nameLower.includes('tăng tốc') || nameLower.includes('tang toc');
      } else if (roundGroup === 'VE_DICH') {
        belongs = Boolean(q.round_format?.startsWith('VD_')) || Boolean(q.round_format?.startsWith('VE_DICH')) || 
          q.round_format === 'THUC_HANH_TINH_HUONG' || q.round_format === 'KICH_TUONG_TAC' ||
          idUpper.startsWith('VD_') || idUpper.startsWith('VD') ||
          nameLower.includes('về đích') || nameLower.includes('ve dich');
      } else if (roundGroup === 'VONG_LOAI') {
        belongs = Boolean(q.stage === 'VONG_LOAI' || q.round_format?.startsWith('BGD_') || idUpper.startsWith('VL_'));
      } else if (roundGroup === 'PHU') {
        belongs = Boolean(q.round_format === 'CAU_HOI_PHU' || idUpper.startsWith('PHU_') || nameLower.includes('phụ'));
      }

      if (belongs) {
        index++;
        const targetId = `${prefix}_${index < 10 ? '0' + index : index}`;
        if (q.id !== targetId || (roundGroup === 'VCNV' && (q.round_type !== 'VCNV' || q.round_format !== 'VCNV_HANG_NGANG'))) {
          anyChanged = true;
          return {
            ...q,
            id: targetId,
            ...(roundGroup === 'VCNV' ? {
              round_type: 'VCNV' as const,
              round_format: 'VCNV_HANG_NGANG' as const,
              round_name: 'Vòng 2: Vượt Chướng Ngại Vật'
            } : {})
          };
        }
      }
      return q;
    });

    if (anyChanged) {
      this.saveQuestions();
      this.notify();
    }

    return { reindexedCount: index, updatedQuestions: this.questions };
  }

  /**
   * Đánh lại mã toàn bộ câu hỏi VCNV trong ngân hàng câu hỏi theo chuẩn VCNV_01, VCNV_02,...
   */
  public reindexVcnvQuestions(): { reindexedCount: number; updatedQuestions: QuestionItem[] } {
    return this.reindexRoundQuestions('VCNV');
  }

  // ================= REACTIVE SUBSCRIPTION =================
  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }
}

export const questionBankManager = new QuestionBankManager();
