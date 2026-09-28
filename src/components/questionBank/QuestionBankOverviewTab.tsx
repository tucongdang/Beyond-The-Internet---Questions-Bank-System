import React, { useMemo } from 'react';
import { 
  BarChart3, 
  Sparkles,
  Layers,
  Compass,
  Rocket,
  Flag,
  FileSpreadsheet,
  Theater,
  BookOpen,
  Zap,
  Plus,
  ShieldAlert,
  ArrowRight,
  Target,
  FileText,
  Clock,
  CheckCircle2,
  CheckCircle,
  FileEdit,
  Terminal,
  Award,
  PlayCircle,
  TrendingUp
} from 'lucide-react';
import { QuestionItem, BtiRoundGroupKey, DigitalCompetencyDomainKey } from '../../types';
import { DIGITAL_COMPETENCY_DOMAINS } from '../../data/digitalCompetencyData';
import { DashboardOverviewHeader } from './DashboardOverviewHeader';
import { KnowledgeAreaDifficultyWidget } from './KnowledgeAreaDifficultyWidget';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap } from '../../utils/hapticUtils';

interface QuestionBankOverviewTabProps {
  questions: QuestionItem[];
  stats: any;
  onNavigateTab: (tab: 'QUESTIONS' | 'MODERATION' | 'AI_STUDIO' | 'EXCEL_HUB' | 'SCENARIOS' | 'LEGAL_DOCS' | 'MATRIX' | 'STATS' | 'PRACTICE') => void;
  onFilterRound: (round: BtiRoundGroupKey) => void;
  onFilterLevel: (level: string) => void;
  onFilterDomain?: (domain: string) => void;
  onFilterStatus: (status: string) => void;
  onOpenAddQuestion: () => void;
  onOpenBulkImport: () => void;
  onOpenExamGenerator: () => void;
  onOpenDuplicateChecker?: () => void;
  onOpenBulkGenerator?: () => void;
  onOpenSimulator?: () => void;
  onOpenCertificate?: () => void;
}

export const QuestionBankOverviewTab: React.FC<QuestionBankOverviewTabProps> = ({
  questions,
  stats,
  onNavigateTab,
  onFilterRound,
  onFilterLevel,
  onFilterDomain,
  onFilterStatus,
  onOpenAddQuestion,
  onOpenBulkImport,
  onOpenExamGenerator,
  onOpenDuplicateChecker,
  onOpenBulkGenerator,
  onOpenSimulator,
  onOpenCertificate
}) => {
  const totalQuestions = questions.length;

  // 4 Gameshow Rounds Breakdown
  const roundCounts = useMemo(() => {
    const counts = {
      KHOI_DONG: { total: 0, approved: 0, pending: 0, draft: 0 },
      VCNV: { total: 0, approved: 0, pending: 0, draft: 0 },
      TANG_TOC: { total: 0, approved: 0, pending: 0, draft: 0 },
      VE_DICH: { total: 0, approved: 0, pending: 0, draft: 0 },
    };

    questions.forEach(q => {
      const r = q.round_group || (
        q.round_name?.includes('Khởi động') ? 'KHOI_DONG' :
        q.round_name?.includes('Vượt') ? 'VCNV' :
        q.round_name?.includes('Tăng') ? 'TANG_TOC' :
        q.round_name?.includes('Về đích') ? 'VE_DICH' : 'KHOI_DONG'
      );

      const st = q.approval_status;
      if (counts[r as keyof typeof counts]) {
        counts[r as keyof typeof counts].total++;
        if (st === 'APPROVED') counts[r as keyof typeof counts].approved++;
        else if (st === 'PENDING_REVIEW') counts[r as keyof typeof counts].pending++;
        else counts[r as keyof typeof counts].draft++;
      }
    });

    return counts;
  }, [questions]);

  const totalGameshowQuestions = 
    roundCounts.KHOI_DONG.total + 
    roundCounts.VCNV.total + 
    roundCounts.TANG_TOC.total + 
    roundCounts.VE_DICH.total;

  // 4 Gameshow Rounds Config for Compact, Clean Rendering
  const roundConfigs = useMemo(() => [
    {
      key: 'KHOI_DONG' as BtiRoundGroupKey,
      name: 'Khởi Động',
      target: '28 câu / trận',
      subtitle: 'Tốc độ & phản xạ nhanh',
      icon: Zap,
      accentColor: '#fbbf24',
      badgeClass: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
      data: roundCounts.KHOI_DONG
    },
    {
      key: 'VCNV' as BtiRoundGroupKey,
      name: 'Vượt CNV',
      fullName: 'Vượt Chướng Ngại Vật',
      target: '16 câu + Từ khóa',
      subtitle: 'Suy luận & xâu chuỗi',
      icon: Compass,
      accentColor: '#38bdf8',
      badgeClass: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
      data: roundCounts.VCNV
    },
    {
      key: 'TANG_TOC' as BtiRoundGroupKey,
      name: 'Tăng Tốc',
      target: '16 câu / trận',
      subtitle: 'Đột phá điểm số',
      icon: Rocket,
      accentColor: '#c084fc',
      badgeClass: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
      data: roundCounts.TANG_TOC
    },
    {
      key: 'VE_DICH' as BtiRoundGroupKey,
      name: 'Về Đích',
      target: '16 câu / gói',
      subtitle: 'NSHV & Tình huống',
      icon: Flag,
      accentColor: '#fb7185',
      badgeClass: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
      data: roundCounts.VE_DICH
    }
  ], [roundCounts]);

  // Quick Action Hub Configuration
  const quickActions = useMemo(() => [
    {
      id: 'add',
      title: 'Thêm Câu Hỏi Mới',
      subtitle: 'Soạn thủ công KaTeX & Media',
      icon: Plus,
      colorClass: 'text-theme-accent bg-theme-accent/15 border-theme-accent/30 hover:border-theme-accent hover:bg-theme-accent/25',
      iconBg: 'bg-theme-accent/20 text-theme-accent',
      onClick: () => {
        vibrateTap();
        soundFx.playClick();
        onOpenAddQuestion();
      }
    },
    {
      id: 'ai_studio',
      title: 'AI Studio',
      subtitle: 'Sinh đề tự động chuẩn BTI',
      icon: Sparkles,
      colorClass: 'text-purple-300 bg-purple-500/10 border-purple-500/25 hover:border-purple-400 hover:bg-purple-500/20',
      iconBg: 'bg-purple-500/20 text-purple-300',
      onClick: () => {
        vibrateTap();
        soundFx.playClick();
        onNavigateTab('AI_STUDIO');
      }
    },
    {
      id: 'bulk_import',
      title: 'Nhập Hàng Loạt',
      subtitle: 'File Excel (.xlsx) hoặc Text',
      icon: FileSpreadsheet,
      colorClass: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25 hover:border-emerald-400 hover:bg-emerald-500/20',
      iconBg: 'bg-emerald-500/20 text-emerald-300',
      onClick: () => {
        vibrateTap();
        soundFx.playClick();
        onOpenBulkImport();
      }
    },
    ...(onOpenBulkGenerator ? [{
      id: 'antigravity_bulk',
      title: 'Sinh Hàng Loạt Sandbox',
      subtitle: 'Agent Antigravity tạo & kiểm thử',
      icon: Terminal,
      colorClass: 'text-sky-300 bg-sky-500/15 border-sky-500/30 hover:border-sky-400 hover:bg-sky-500/25',
      iconBg: 'bg-sky-500/20 text-sky-300',
      onClick: () => {
        vibrateTap();
        soundFx.playClick();
        onOpenBulkGenerator();
      }
    }] : []),
    {
      id: 'exam_gen',
      title: 'Tạo Đề Thi Thử AI',
      subtitle: 'Cân bằng ma trận độ khó TT 02',
      icon: Sparkles,
      colorClass: 'text-amber-300 bg-amber-500/10 border-amber-500/25 hover:border-amber-400 hover:bg-amber-500/20',
      iconBg: 'bg-amber-500/20 text-amber-300',
      onClick: () => {
        vibrateTap();
        soundFx.playClick();
        onOpenExamGenerator();
      }
    },
    {
      id: 'scenarios',
      title: 'Kịch Bản Tình Huống',
      subtitle: 'Tình huống & 4 Nhánh Kịch',
      icon: Theater,
      colorClass: 'text-rose-300 bg-rose-500/10 border-rose-500/25 hover:border-rose-400 hover:bg-rose-500/20',
      iconBg: 'bg-rose-500/20 text-rose-300',
      onClick: () => {
        vibrateTap();
        soundFx.playClick();
        onNavigateTab('SCENARIOS');
      }
    },
    {
      id: 'excel_hub',
      title: 'Mẫu Excel Chuẩn',
      subtitle: 'Tải template nhập liệu BTI',
      icon: FileSpreadsheet,
      colorClass: 'text-teal-300 bg-teal-500/10 border-teal-500/25 hover:border-teal-400 hover:bg-teal-500/20',
      iconBg: 'bg-teal-500/20 text-teal-300',
      onClick: () => {
        vibrateTap();
        soundFx.playClick();
        onNavigateTab('EXCEL_HUB');
      }
    },
    ...(onOpenSimulator ? [{
      id: 'simulator',
      title: 'Giả Lập An Toàn Số',
      subtitle: 'Mô phỏng Phishing & NĐ 13/2023',
      icon: ShieldAlert,
      colorClass: 'text-sky-300 bg-sky-500/10 border-sky-500/25 hover:border-sky-400 hover:bg-sky-500/20',
      iconBg: 'bg-sky-500/20 text-sky-300',
      onClick: () => {
        vibrateTap();
        soundFx.playClick();
        onOpenSimulator();
      }
    }] : []),
    ...(onOpenCertificate ? [{
      id: 'certificate',
      title: 'Chứng Nhận Năng Lực Số',
      subtitle: 'Cấp chứng chỉ BTI kèm mã QR',
      icon: Award,
      colorClass: 'text-amber-300 bg-amber-500/10 border-amber-500/25 hover:border-amber-400 hover:bg-amber-500/20',
      iconBg: 'bg-amber-500/20 text-amber-300',
      onClick: () => {
        vibrateTap();
        soundFx.playClick();
        onOpenCertificate();
      }
    }] : []),
    ...(onOpenDuplicateChecker ? [{
      id: 'duplicate_checker',
      title: 'Rà Soát Trùng Lặp',
      subtitle: 'Quét đối sánh trùng lặp AI',
      icon: ShieldAlert,
      colorClass: 'text-rose-300 bg-rose-500/10 border-rose-500/25 hover:border-rose-400 hover:bg-rose-500/20',
      iconBg: 'bg-rose-500/20 text-rose-300',
      onClick: () => {
        vibrateTap();
        soundFx.playClick();
        onOpenDuplicateChecker();
      }
    }] : []),
    {
      id: 'stats_dashboard',
      title: 'Thống Kê Toàn Diện',
      subtitle: 'Ma trận nhiệt 6x4 & KPI',
      icon: TrendingUp,
      colorClass: 'text-purple-300 bg-purple-500/10 border-purple-500/25 hover:border-purple-400 hover:bg-purple-500/20',
      iconBg: 'bg-purple-500/20 text-purple-300',
      onClick: () => {
        vibrateTap();
        soundFx.playClick();
        onNavigateTab('STATS');
      }
    },
    {
      id: 'practice_exam',
      title: 'Thi Thử BTI 2026',
      subtitle: 'Luyện tập ngẫu nhiên có bấm giờ',
      icon: PlayCircle,
      colorClass: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25 hover:border-emerald-400 hover:bg-emerald-500/20',
      iconBg: 'bg-emerald-500/20 text-emerald-300',
      onClick: () => {
        vibrateTap();
        soundFx.playClick();
        onNavigateTab('PRACTICE');
      }
    },
    {
      id: 'matrix',
      title: 'Ma Trận 6x4 Toàn Diện',
      subtitle: 'Chi tiết 24 ô chuẩn Bộ GD&ĐT',
      icon: Layers,
      colorClass: 'text-sky-300 bg-sky-500/10 border-sky-500/25 hover:border-sky-400 hover:bg-sky-500/20',
      iconBg: 'bg-sky-500/20 text-sky-300',
      onClick: () => {
        vibrateTap();
        soundFx.playClick();
        onNavigateTab('MATRIX');
      }
    }
  ], [onOpenAddQuestion, onNavigateTab, onOpenBulkImport, onOpenExamGenerator, onOpenDuplicateChecker]);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. TOURNAMENT STAGE KPI BAR - Fluent 2 Cards Synchronized with Image 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Card 1: Tổng câu hỏi */}
        <div 
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            onNavigateTab('QUESTIONS');
          }}
          className="fluent-card p-4 rounded-[6px] bg-[#1C093B]/80 border border-purple-500/40 hover:border-purple-400/70 hover:translate-y-[-1px] transition-all duration-200 cursor-pointer shadow-lg space-y-1 group"
        >
          <div className="flex items-center justify-between text-xs font-mono text-purple-200">
            <span className="font-semibold text-slate-200">Tổng Câu Hỏi</span>
            <Layers className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-white group-hover:text-purple-300 font-mono tracking-tight tabular-nums">
              {stats.total}
            </strong>
            <span className="text-[11px] font-mono text-emerald-400">
              ({stats.byStatus?.APPROVED || 0} đã duyệt)
            </span>
          </div>
          <p className="text-[10.5px] text-purple-200/80 font-mono truncate">
            Sẵn sàng xuất đề thi tự động
          </p>
        </div>

        {/* Card 2: Vòng Loại Bộ GD&ĐT */}
        <div 
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            onFilterRound('VONG_LOAI' as any);
          }}
          className="fluent-card p-4 rounded-[6px] bg-indigo-950/30 border border-indigo-500/40 hover:border-indigo-400/70 hover:translate-y-[-1px] transition-all duration-200 cursor-pointer shadow-lg space-y-1 group"
        >
          <div className="flex items-center justify-between text-xs font-mono text-indigo-300">
            <span className="font-semibold text-slate-200">Vòng Loại BGD</span>
            <Zap className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-white group-hover:text-indigo-300 font-mono tracking-tight tabular-nums">
              {stats.byStage?.VONG_LOAI || 0}
            </strong>
            <span className="text-[11px] font-mono text-slate-400">câu</span>
          </div>
          <p className="text-[10.5px] text-indigo-200/80 font-mono truncate">
            Chuẩn 28 câu trắc nghiệm &amp; điền
          </p>
        </div>

        {/* Card 3: 3 Vòng Bán Kết */}
        <div 
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            onFilterRound('BAN_KET' as any);
          }}
          className="fluent-card p-4 rounded-[6px] bg-sky-950/30 border border-sky-500/40 hover:border-sky-400/70 hover:translate-y-[-1px] transition-all duration-200 cursor-pointer shadow-lg space-y-1 group"
        >
          <div className="flex items-center justify-between text-xs font-mono text-sky-300">
            <span className="font-semibold text-slate-200">3 Vòng Bán Kết</span>
            <Compass className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-white group-hover:text-sky-300 font-mono tracking-tight tabular-nums">
              {(stats.byStage?.BAN_KET_1 || 0) + (stats.byStage?.BAN_KET_2 || 0) + (stats.byStage?.BAN_KET_3 || 0)}
            </strong>
            <span className="text-[11px] font-mono text-slate-400">câu</span>
          </div>
          <p className="text-[10.5px] text-sky-200/80 font-mono truncate">
            Lượt riêng &amp; chung 3 trận
          </p>
        </div>

        {/* Card 4: Đêm Chung Kết */}
        <div 
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            onFilterRound('CHUNG_KET' as any);
          }}
          className="fluent-card p-4 rounded-[6px] bg-rose-950/30 border border-rose-500/40 hover:border-rose-400/70 hover:translate-y-[-1px] transition-all duration-200 cursor-pointer shadow-lg space-y-1 group"
        >
          <div className="flex items-center justify-between text-xs font-mono text-rose-300">
            <span className="font-semibold text-slate-200">Đêm Chung Kết</span>
            <Award className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-white group-hover:text-rose-300 font-mono tracking-tight tabular-nums">
              {stats.byStage?.CHUNG_KET || 0}
            </strong>
            <span className="text-[11px] font-mono text-slate-400">câu</span>
          </div>
          <p className="text-[10.5px] text-rose-200/80 font-mono truncate">
            Tăng tốc &amp; Về đích trực tiếp
          </p>
        </div>

        {/* Card 5: Kịch Bản Tương Tác */}
        <div 
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            onNavigateTab('SCENARIOS');
          }}
          className="fluent-card p-4 rounded-[6px] bg-amber-950/30 border border-amber-500/40 hover:border-amber-400/70 hover:translate-y-[-1px] transition-all duration-200 cursor-pointer shadow-lg space-y-1 group"
        >
          <div className="flex items-center justify-between text-xs font-mono text-amber-300">
            <span className="font-semibold text-slate-200">Kịch Bản Tình Huống</span>
            <Theater className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-amber-300 font-mono tracking-tight tabular-nums">
              {stats.scenariosCount || 0}
            </strong>
            <span className="text-[11px] font-mono text-slate-400">kịch bản</span>
          </div>
          <p className="text-[10.5px] text-amber-200/80 font-mono truncate">
            4 kịch bản rẽ nhánh thực tế
          </p>
        </div>

        {/* Card 6: Văn Bản Pháp Lý */}
        <div 
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            onNavigateTab('LEGAL_DOCS');
          }}
          className="fluent-card p-4 rounded-[6px] bg-emerald-950/30 border border-emerald-500/40 hover:border-emerald-400/70 hover:translate-y-[-1px] transition-all duration-200 cursor-pointer shadow-lg space-y-1 group"
        >
          <div className="flex items-center justify-between text-xs font-mono text-emerald-300">
            <span className="font-semibold text-slate-200">Văn Bản Pháp Lý</span>
            <BookOpen className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-emerald-300 font-mono tracking-tight tabular-nums">
              {stats.documentsCount || 0}
            </strong>
            <span className="text-[11px] font-mono text-slate-400">văn bản</span>
          </div>
          <p className="text-[10.5px] text-emerald-200/80 font-mono truncate">
            Căn cứ TT 02 &amp; NĐ 13
          </p>
        </div>
      </div>

      {/* 2. THỐNG KÊ NGÂN HÀNG ĐỀ (Visual Recharts Dashboard Overview Header) */}
      <DashboardOverviewHeader
        questions={questions}
        onFilterLevel={(lvl) => {
          onFilterLevel(lvl);
        }}
        onFilterStatus={(st) => {
          onFilterStatus(st);
        }}
        onFilterRoundGroup={(r) => {
          if (r !== 'ALL') onFilterRound(r);
        }}
        defaultExpanded={true}
      />

      {/* 3. PHÂN BỔ 4 PHẦN THI GAMESHOW BTI 2026 (Streamlined 4-Round Grid) */}
      <div className="fluent-box p-4 rounded-[8px] space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[4px] bg-theme-accent/15 text-theme-accent shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[#F5EFF9] tracking-wide uppercase font-mono">
                  Phân Bổ Câu Hỏi Theo 4 Phần Thi (Gameshow BTI 2026)
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[#B6A6D8] font-mono">
                  4 Vòng Thi Đấu
                </span>
              </div>
              <p className="text-[11px] text-[#B6A6D8]/80 font-mono">
                Nhấp vào từng phần thi để lọc nhanh câu hỏi tương ứng trong ngân hàng đề.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-[#B6A6D8]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Đã duyệt
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Chờ duyệt
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> Bản nháp
            </span>
          </div>
        </div>

        {/* 4 Round Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {roundConfigs.map((round) => {
            const Icon = round.icon;
            const roundPct = totalGameshowQuestions > 0 
              ? Math.round((round.data.total / totalGameshowQuestions) * 100) 
              : 0;
            const approvedPct = round.data.total > 0 ? (round.data.approved / round.data.total) * 100 : 0;
            const pendingPct = round.data.total > 0 ? (round.data.pending / round.data.total) * 100 : 0;
            const draftPct = round.data.total > 0 ? (round.data.draft / round.data.total) * 100 : 0;

            return (
              <button
                key={round.key}
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onFilterRound(round.key);
                }}
                className="group relative p-3 rounded-[6px] bg-[#190839]/80 hover:bg-[#241148] border border-white/10 hover:border-theme-accent/60 transition-all text-left flex flex-col justify-between cursor-pointer hover:shadow-lg shadow-black/20"
              >
                <div>
                  {/* Top: Icon + Name + Target Badge */}
                  <div className="flex items-start justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <div className="w-6 h-6 rounded-[4px] bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-105 transition-transform" style={{ color: round.accentColor }}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-white group-hover:text-theme-accent transition truncate">
                        {round.name}
                      </span>
                    </div>
                    <span className={`text-[9.5px] px-1.5 py-0.5 rounded-[3px] border font-mono font-medium shrink-0 ${round.badgeClass}`}>
                      {round.target}
                    </span>
                  </div>

                  {/* Middle: Count & Breakdown */}
                  <div className="flex items-baseline justify-between mb-1.5 font-mono">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white group-hover:text-theme-accent transition">
                        {round.data.total}
                      </span>
                      <span className="text-[10px] text-[#B6A6D8]">câu ({roundPct}%)</span>
                    </div>
                  </div>

                  {/* Segmented Progress Bar */}
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden flex my-2">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-500"
                      style={{ width: `${approvedPct}%` }}
                      title={`Đã duyệt: ${round.data.approved}`}
                    />
                    <div
                      className="bg-amber-400 h-full transition-all duration-500"
                      style={{ width: `${pendingPct}%` }}
                      title={`Chờ duyệt: ${round.data.pending}`}
                    />
                    <div
                      className="bg-slate-400 h-full transition-all duration-500"
                      style={{ width: `${draftPct}%` }}
                      title={`Bản nháp: ${round.data.draft}`}
                    />
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center justify-between text-[10px] text-[#B6A6D8] font-mono pt-1">
                    <span className="text-emerald-400 font-semibold">{round.data.approved} duyệt</span>
                    <span className="text-amber-300">{round.data.pending} chờ</span>
                    <span className="text-slate-300">{round.data.draft} nháp</span>
                  </div>
                </div>

                {/* Bottom: Subtitle & Filter prompt */}
                <div className="flex items-center justify-between text-[9px] text-[#B6A6D8]/80 mt-2.5 pt-2 border-t border-white/5 font-mono">
                  <span className="truncate">{round.subtitle}</span>
                  <span className="text-[9px] font-semibold text-theme-accent group-hover:translate-x-0.5 transition-transform shrink-0">
                    Lọc →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. MA TRẬN ĐỘ PHỦ & PHÂN BỐ MIỀN TRI THỨC (RECHARTS WIDGET) */}
      <KnowledgeAreaDifficultyWidget
        questions={questions}
        onFilterDomainAndLevel={(domainKey, level) => {
          vibrateTap();
          soundFx.playClick();
          if (domainKey && domainKey !== 'ALL') {
            onFilterDomain?.(domainKey);
          }
          if (level) {
            onFilterLevel(level);
          }
          onNavigateTab('QUESTIONS');
        }}
        onOpenFullMatrix={() => onNavigateTab('MATRIX')}
      />

      {/* 5. TÁC VỤ NHANH BIÊN TẬP & QUẢN TRỊ (BTI Toolkit Hub) */}
      <div className="fluent-box p-4 rounded-[8px] space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-[4px] bg-amber-400/15 text-amber-400 shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Tác Vụ Nhanh Biên Tập &amp; Quản Trị
              </h3>
              <p className="text-[11px] text-[#B6A6D8]/80 font-mono">
                Truy cập tức thì các công cụ tạo lập, kiểm thử, nhập liệu và kiểm duyệt ngân hàng đề
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-theme-accent/15 text-theme-accent border border-theme-accent/30 font-mono">
            BTI 2026 Toolkit
          </span>
        </div>

        {/* 8-Action Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                className={`p-3 rounded-[6px] border text-left transition-all flex items-start gap-2.5 group cursor-pointer hover:shadow-md ${action.colorClass}`}
              >
                <div className={`w-8 h-8 rounded-[4px] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${action.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block group-hover:text-theme-accent transition truncate">
                    {action.title}
                  </span>
                  <span className="text-[10px] text-white/60 block font-mono truncate mt-0.5">
                    {action.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
