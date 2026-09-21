import React from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Sparkles, 
  FileSpreadsheet, 
  RotateCcw, 
  Target, 
  Zap, 
  Trophy, 
  Users, 
  HelpCircle, 
  Layers, 
  Tag, 
  ShieldCheck, 
  Lightbulb, 
  ArrowRight,
  Search,
  BookOpen
} from 'lucide-react';
import { BtiRoundGroupKey, BTI_ROUND_GROUPS, DIGITAL_COMPETENCY_DOMAINS } from '../../data/digitalCompetencyData';
import { DigitalCompetencyDomainKey } from '../../types';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap } from '../../utils/hapticUtils';

export interface QuestionBankEmptyStateProps {
  filterRoundGroup: BtiRoundGroupKey | 'ALL';
  filterTopic: string;
  filterDomain: string;
  filterStage?: string;
  filterLevel?: string;
  searchQuery?: string;
  totalQuestionsCount: number;
  onAddQuestion: () => void;
  onOpenAIStudio: () => void;
  onImportExcel: () => void;
  onResetFilters: () => void;
}

export const QuestionBankEmptyState: React.FC<QuestionBankEmptyStateProps> = ({
  filterRoundGroup,
  filterTopic,
  filterDomain,
  filterStage = 'ALL',
  filterLevel = 'ALL',
  searchQuery = '',
  totalQuestionsCount,
  onAddQuestion,
  onOpenAIStudio,
  onImportExcel,
  onResetFilters
}) => {
  const hasActiveFilters = 
    filterRoundGroup !== 'ALL' || 
    filterTopic !== 'ALL' || 
    filterDomain !== 'ALL' || 
    filterStage !== 'ALL' || 
    filterLevel !== 'ALL' || 
    Boolean(searchQuery && searchQuery.trim().length > 0);

  // Determine round info if filtered
  const roundInfo = filterRoundGroup !== 'ALL' ? BTI_ROUND_GROUPS[filterRoundGroup] : null;

  // Determine domain info if filtered
  const domainInfo = filterDomain !== 'ALL' && filterDomain in DIGITAL_COMPETENCY_DOMAINS 
    ? DIGITAL_COMPETENCY_DOMAINS[filterDomain as DigitalCompetencyDomainKey] 
    : null;

  // Determine context icon and badge
  const getContextBadge = () => {
    if (filterRoundGroup !== 'ALL' && roundInfo) {
      return {
        label: roundInfo.name,
        badge: roundInfo.badge,
        color: roundInfo.color,
        icon: roundInfo.key === 'VCNV' ? Target :
              roundInfo.key === 'TANG_TOC' ? Zap :
              roundInfo.key === 'VE_DICH' ? Trophy :
              roundInfo.key === 'KHOI_DONG' ? Users :
              roundInfo.key === 'VONG_LOAI' ? Layers : HelpCircle
      };
    }
    if (filterTopic !== 'ALL') {
      return {
        label: `Chủ đề: ${filterTopic}`,
        badge: 'Chủ đề',
        color: '#a855f7',
        icon: Tag
      };
    }
    if (domainInfo) {
      return {
        label: `${domainInfo.code}: ${domainInfo.name}`,
        badge: 'Miền Năng Lực',
        color: '#06b6d4',
        icon: ShieldCheck
      };
    }
    if (searchQuery && searchQuery.trim()) {
      return {
        label: `Tìm kiếm: "${searchQuery}"`,
        badge: 'Tìm kiếm',
        color: '#f59e0b',
        icon: Search
      };
    }
    return null;
  };

  const contextBadge = getContextBadge();

  // Determine headline and customized description
  const getEmptyStateContent = () => {
    if (totalQuestionsCount === 0) {
      return {
        title: 'Ngân hàng câu hỏi của bạn đang trống',
        description: 'Chưa có câu hỏi nào được lưu trong hệ thống. Hãy khởi tạo câu hỏi đầu tiên bằng trình soạn thảo, dùng Trợ lý Gemini AI sinh tự động hoặc nạp từ file Excel mẫu.'
      };
    }

    if (filterRoundGroup !== 'ALL' && roundInfo) {
      let advice = 'Khởi tạo câu hỏi mới phù hợp với thể thức thi đấu của vòng này.';
      if (filterRoundGroup === 'KHOI_DONG') {
        advice = 'Vòng Khởi Động gồm các câu hỏi trả lời ngắn 5 giây hoặc trắc nghiệm 4 lựa chọn để thí sinh bứt phá tốc độ.';
      } else if (filterRoundGroup === 'VCNV') {
        advice = 'Vòng Vượt Chướng Ngại Vật cần Từ khóa chính (Chướng ngại vật), 4 câu hỏi hàng ngang gợi ý và câu hỏi ô hiểm họa.';
      } else if (filterRoundGroup === 'TANG_TOC') {
        advice = 'Vòng Tăng Tốc gồm 7 dạng chuẩn BTI: Sắp xếp logic, điền từ, câu hỏi tính toán và suy luận công nghệ.';
      } else if (filterRoundGroup === 'VE_DICH') {
        advice = 'Vòng Về Đích gồm các gói câu hỏi 20, 30, 40 điểm với tình huống thực tế và câu hỏi 4 ý Đúng/Sai.';
      } else if (filterRoundGroup === 'VONG_LOAI') {
        advice = 'Vòng Loại áp dụng cấu trúc đề 28 câu chuẩn hóa của Bộ GD&ĐT (24 câu Phần I và 4 câu Phần II).';
      }

      return {
        title: `Chưa có câu hỏi nào cho ${roundInfo.shortName || roundInfo.name}`,
        description: advice
      };
    }

    if (filterTopic !== 'ALL') {
      return {
        title: `Chưa có câu hỏi thuộc chủ đề "${filterTopic}"`,
        description: `Chuyên đề này hiện chưa có dữ liệu câu hỏi nào. Bạn có thể tự soạn thảo hoặc nhờ Trợ lý AI sinh các câu hỏi sâu sát chuyên đề này.`
      };
    }

    if (domainInfo) {
      return {
        title: `Chưa có câu hỏi cho ${domainInfo.name}`,
        description: `Miền năng lực số này theo Thông tư 02/2025/TT-BGDĐT đang trống. Hãy bổ sung để hoàn thiện ma trận kiến thức cho kỳ thi.`
      };
    }

    if (searchQuery && searchQuery.trim()) {
      return {
        title: `Không tìm thấy câu hỏi với từ khóa "${searchQuery}"`,
        description: 'Không có câu hỏi nào khớp với nội dung tìm kiếm. Hãy thử từ khóa khác ngắn hơn hoặc xóa bộ lọc để xem toàn bộ danh sách.'
      };
    }

    return {
      title: 'Không có câu hỏi nào phù hợp với bộ lọc hiện tại',
      description: 'Tiêu chí tìm kiếm và các bộ lọc kết hợp chưa có dữ liệu tương ứng. Hãy thử nới lỏng bộ lọc hoặc tạo câu hỏi mới cho phân loại này.'
    };
  };

  const { title, description } = getEmptyStateContent();

  const handleAddClick = () => {
    vibrateTap();
    soundFx.playClick();
    onAddQuestion();
  };

  const handleAIClick = () => {
    vibrateTap();
    soundFx.playClick();
    onOpenAIStudio();
  };

  const handleExcelClick = () => {
    vibrateTap();
    soundFx.playClick();
    onImportExcel();
  };

  const handleResetClick = () => {
    vibrateTap();
    soundFx.playClick();
    onResetFilters();
  };

  return (
    <div className="fluent-card relative overflow-hidden border border-theme-accent/30 rounded-[8px] bg-gradient-to-b from-[#1c0b3f] via-[#160731] to-[#120526] p-6 sm:p-10 shadow-2xl text-center">
      {/* Ambient background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-10 right-10 w-48 h-48 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Decorative cyber grid lines */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
        {/* Friendly Character / Mascot Illustration */}
        <motion.div 
          className="relative mb-6 select-none cursor-pointer"
          animate={{ y: [-4, 6, -4], rotate: [-0.5, 0.5, -0.5] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          whileHover={{ scale: 1.05 }}
          onClick={handleAddClick}
          title="Nhấn để thêm câu hỏi ngay"
        >
          {/* Glowing pedestal circle */}
          <div className="w-44 h-44 sm:w-48 sm:h-48 relative flex items-center justify-center">
            {/* Pulsing ring */}
            <div className="absolute inset-2 rounded-full border border-purple-500/30 bg-purple-500/10 animate-pulse" />
            <div className="absolute inset-6 rounded-full border border-dashed border-pink-500/25 animate-spin-slow" />

            {/* Custom Friendly SVG Illustration: The BTI Quiz Companion */}
            <svg 
              viewBox="0 0 200 200" 
              className="w-36 h-36 sm:w-40 sm:h-40 drop-shadow-[0_10px_25px_rgba(139,92,246,0.35)]"
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="bodyGrad" x1="40" y1="30" x2="160" y2="170" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#9333EA" />
                  <stop offset="0.5" stopColor="#6366F1" />
                  <stop offset="1" stopColor="#3B82F6" />
                </linearGradient>
                <linearGradient id="screenGrad" x1="60" y1="65" x2="140" y2="135" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0B1120" />
                  <stop offset="1" stopColor="#1E1B4B" />
                </linearGradient>
                <linearGradient id="paperGrad" x1="120" y1="40" x2="180" y2="120" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F8FAFC" />
                  <stop offset="1" stopColor="#E2E8F0" />
                </linearGradient>
                <radialGradient id="sparkleGlow" cx="0.5" cy="0.5" r="0.5">
                  <stop stopColor="#F472B6" />
                  <stop offset="1" stopColor="#F472B6" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Little robot antenna */}
              <line x1="100" y1="42" x2="100" y2="24" stroke="#A855F7" strokeWidth="4" strokeLinecap="round" />
              <circle cx="100" cy="20" r="7" fill="#F43F5E" className="animate-ping" style={{ animationDuration: '3s' }} />
              <circle cx="100" cy="20" r="6" fill="#F43F5E" />
              <circle cx="98" cy="18" r="2" fill="#FFFFFF" />

              {/* Robot Head / Body Capsule */}
              <rect x="52" y="42" width="96" height="88" rx="28" fill="url(#bodyGrad)" stroke="#C084FC" strokeWidth="2.5" />

              {/* Friendly Digital Screen Face */}
              <rect x="62" y="54" width="76" height="64" rx="18" fill="url(#screenGrad)" stroke="#4338CA" strokeWidth="1.5" />

              {/* Cute Digital Eyes (Happy Curved Blink Expression) */}
              <path d="M76 82 Q83 74 90 82" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M110 82 Q117 74 124 82" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              {/* Rosy glowing cheeks */}
              <circle cx="73" cy="92" r="4.5" fill="#F472B6" opacity="0.6" />
              <circle cx="127" cy="92" r="4.5" fill="#F472B6" opacity="0.6" />
              {/* Friendly smiling mouth */}
              <path d="M93 93 Q100 101 107 93" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" fill="none" />

              {/* Floating holographic Question Paper / Card */}
              <g className="animate-bounce" style={{ animationDuration: '3.5s' }}>
                <rect x="122" y="48" width="46" height="58" rx="7" fill="url(#paperGrad)" stroke="#CBD5E1" strokeWidth="1.5" />
                <line x1="130" y1="60" x2="158" y2="60" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="130" y1="70" x2="154" y2="70" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                <line x1="130" y1="78" x2="150" y2="78" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                <line x1="130" y1="86" x2="144" y2="86" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" />
                {/* Checkmark icon on paper */}
                <circle cx="152" cy="88" r="5" fill="#10B981" />
                <path d="M150 88 L151.5 89.5 L154.5 86.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              {/* Floating Question Mark Badge on left */}
              <g>
                <circle cx="44" cy="90" r="16" fill="#8B5CF6" stroke="#C084FC" strokeWidth="2" />
                <text x="44" y="96" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="bold" fontFamily="monospace">?</text>
              </g>

              {/* Floating Sparkles and Stars */}
              <path d="M40 45 L43 51 L49 54 L43 57 L40 63 L37 57 L31 54 L37 51 Z" fill="#FDE047" />
              <path d="M165 125 L167 129 L171 131 L167 133 L165 137 L163 133 L159 131 L163 129 Z" fill="#F472B6" />
              <circle cx="160" cy="35" r="3" fill="#38BDF8" />
              <circle cx="35" cy="120" r="2.5" fill="#A78BFA" />

              {/* Base shadow pill beneath robot */}
              <ellipse cx="100" cy="165" rx="42" ry="7" fill="#000000" opacity="0.35" />
            </svg>
          </div>
        </motion.div>

        {/* Dynamic Context Tag / Badge if filtered */}
        {contextBadge && (
          <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300 shadow-sm backdrop-blur-sm">
            {React.createElement(contextBadge.icon, {
              className: 'w-3.5 h-3.5',
              style: { color: contextBadge.color }
            })}
            <span className="font-mono text-white font-semibold">{contextBadge.label}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-400 uppercase tracking-wider">
              {contextBadge.badge}
            </span>
          </div>
        )}

        {/* Main Heading */}
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide mb-2 leading-tight">
          {title}
        </h3>

        {/* Contextual Description */}
        <p className="text-sm sm:text-base text-slate-300 max-w-xl mb-7 leading-relaxed">
          {description}
        </p>

        {/* Primary Call-To-Actions (Action Bar) */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full mb-8">
          {/* Button 1: Add New Question (Primary) */}
          <button
            type="button"
            onClick={handleAddClick}
            className="px-5 py-2.5 rounded-[6px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Câu Hỏi Mới</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/30 text-white/90 text-[10px] font-mono border border-white/20">
              Ctrl+N
            </kbd>
          </button>

          {/* Button 2: Generate with AI Studio */}
          <button
            type="button"
            onClick={handleAIClick}
            className="px-4 py-2.5 rounded-[6px] bg-[#241148] hover:bg-[#321764] border border-theme-accent/50 text-theme-accent hover:text-white font-semibold text-sm flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-fuchsia-400" />
            <span>Soạn Thảo Bằng AI</span>
          </button>

          {/* Button 3: Import from Excel */}
          <button
            type="button"
            onClick={handleExcelClick}
            className="px-4 py-2.5 rounded-[6px] bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 hover:text-emerald-100 font-semibold text-sm flex items-center gap-2 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Nhập File Excel</span>
          </button>

          {/* Button 4: Reset Filter (Shown if filters are active) */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetClick}
              className="px-4 py-2.5 rounded-[6px] bg-white/5 hover:bg-white/10 border border-white/20 text-slate-300 hover:text-white font-medium text-sm flex items-center gap-2 transition cursor-pointer"
              title="Đặt lại toàn bộ bộ lọc và xem tất cả câu hỏi"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa Bộ Lọc</span>
            </button>
          )}
        </div>

        {/* Helpful Prompt Inspiration Cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 text-left border-t border-white/10 pt-6">
          {/* Card 1: AI Prompting Idea */}
          <div 
            onClick={handleAIClick}
            className="p-3.5 rounded-[6px] bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-purple-500/30 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-fuchsia-400 font-bold text-xs mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gợi ý tạo bằng AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-snug group-hover:text-slate-300 transition">
              Tạo bộ câu hỏi theo chuẩn Thông tư 02/2025/TT-BGDĐT với đầy đủ 4 phương án, đáp án và giải thích.
            </p>
          </div>

          {/* Card 2: Excel Template Idea */}
          <div 
            onClick={handleExcelClick}
            className="p-3.5 rounded-[6px] bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-emerald-500/30 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Tải mẫu Excel BTI</span>
            </div>
            <p className="text-xs text-slate-400 leading-snug group-hover:text-slate-300 transition">
              Nạp hàng loạt câu hỏi cho VCNV, Tăng tốc, Về đích từ file Excel được thiết kế chuẩn cấu trúc.
            </p>
          </div>

          {/* Card 3: Manual Customization */}
          <div 
            onClick={handleAddClick}
            className="p-3.5 rounded-[6px] bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-blue-500/30 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs mb-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Soạn thảo trực quan</span>
            </div>
            <p className="text-xs text-slate-400 leading-snug group-hover:text-slate-300 transition">
              Hỗ trợ tùy biến căn cứ pháp lý, thời gian trả lời (5s - 60s), điểm số và hình ảnh minh họa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
