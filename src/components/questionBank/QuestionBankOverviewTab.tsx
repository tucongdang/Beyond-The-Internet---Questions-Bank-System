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
  FileEdit
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
  onNavigateTab: (tab: 'QUESTIONS' | 'MODERATION' | 'AI_STUDIO' | 'EXCEL_HUB' | 'SCENARIOS' | 'LEGAL_DOCS' | 'MATRIX') => void;
  onFilterRound: (round: BtiRoundGroupKey) => void;
  onFilterLevel: (level: string) => void;
  onFilterDomain?: (domain: string) => void;
  onFilterStatus: (status: string) => void;
  onOpenAddQuestion: () => void;
  onOpenBulkImport: () => void;
  onOpenExamGenerator: () => void;
  onOpenDuplicateChecker?: () => void;
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
  onOpenDuplicateChecker
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
      {/* 1. TOURNAMENT STAGE KPI BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Card 1: Tổng câu hỏi */}
        <div 
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            onNavigateTab('QUESTIONS');
          }}
          className="fluent-stat-card p-3 cursor-pointer hover:border-theme-accent/50 transition-all hover:bg-[#241148]/90"
        >
          <span className="text-[#B6A6D8] block text-[10px] font-mono">Tổng câu hỏi:</span>
          <span className="text-xl font-bold text-theme-accent">{stats.total}</span>
          <span className="text-[10px] text-emerald-400 block mt-0.5 font-mono">
            {stats.byStatus?.APPROVED || 0} đã duyệt
          </span>
        </div>

        {/* Card 2: Vòng Loại Bộ GD&ĐT */}
        <div 
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            onFilterRound('VONG_LOAI' as any);
          }}
          className="fluent-stat-card p-3 cursor-pointer hover:border-theme-accent/50 transition-all hover:bg-[#241148]/90"
        >
          <span className="text-[#B6A6D8] block text-[10px] font-mono">Vòng Loại Bộ GD&ĐT:</span>
          <span className="text-xl font-bold text-theme-accent">{stats.byStage?.VONG_LOAI || 0}</span>
          <span className="text-[10px] text-[#B6A6D8] block mt-0.5 font-mono">Chuẩn 28 câu</span>
        </div>

        {/* Card 3: 3 Vòng Bán Kết */}
        <div 
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            onFilterRound('BAN_KET' as any);
          }}
          className="fluent-stat-card p-3 cursor-pointer hover:border-theme-accent/50 transition-all hover:bg-[#241148]/90"
        >
          <span className="text-[#B6A6D8] block text-[10px] font-mono">3 Vòng Bán Kết:</span>
          <span className="text-xl font-bold text-[#B6A6D8]">
            {(stats.byStage?.BAN_KET_1 || 0) + (stats.byStage?.BAN_KET_2 || 0) + (stats.byStage?.BAN_KET_3 || 0)}
          </span>
          <span className="text-[10px] text-[#B6A6D8] block mt-0.5 font-mono">Lượt riêng &amp; chung</span>
        </div>

        {/* Card 4: Đêm Chung Kết */}
        <div 
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            onFilterRound('CHUNG_KET' as any);
          }}
          className="fluent-stat-card p-3 cursor-pointer hover:border-theme-accent/50 transition-all hover:bg-[#241148]/90"
        >
          <span className="text-[#B6A6D8] block text-[10px] font-mono">Đêm Chung Kết:</span>
          <span className="text-xl font-bold text-[#E39A96]">{stats.byStage?.CHUNG_KET || 0}</span>
          <span className="text-[10px] text-[#B6A6D8] block mt-0.5 font-mono">Tăng tốc &amp; Về đích</span>
        </div>

        {/* Card 5: Kịch Bản Tương Tác */}
        <div 
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            onNavigateTab('SCENARIOS');
          }}
          className="fluent-stat-card p-3 cursor-pointer hover:border-amber-500/50 transition-all hover:bg-[#241148]/90"
        >
          <span className="text-[#B6A6D8] block text-[10px] font-mono">Kịch Bản Tương Tác:</span>
          <span className="text-xl font-bold text-amber-300">{stats.scenariosCount || 0}</span>
          <span className="text-[10px] text-[#B6A6D8] block mt-0.5 font-mono">Kèm 4 kịch bản rẽ nhánh</span>
        </div>

        {/* Card 6: Văn Bản Pháp Lý */}
        <div 
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            onNavigateTab('LEGAL_DOCS');
          }}
          className="fluent-stat-card p-3 cursor-pointer hover:border-emerald-500/50 transition-all hover:bg-[#241148]/90"
        >
          <span className="text-[#B6A6D8] block text-[10px] font-mono">Văn Bản Pháp Lý:</span>
          <span className="text-xl font-bold text-emerald-400">{stats.documentsCount || 0}</span>
          <span className="text-[10px] text-[#B6A6D8] block mt-0.5 font-mono">Căn cứ tham chiếu</span>
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
      <div className="fluent-card p-3.5 sm:p-4 border border-theme-accent/25 bg-gradient-to-r from-[#241148]/90 via-[#1c0a36]/90 to-[#241148]/90 backdrop-blur-md rounded-[6px] space-y-3">
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
      <div className="fluent-card p-3.5 sm:p-4 rounded-[6px] bg-[#1b083a]/90 border border-theme-accent/25 backdrop-blur-md space-y-3">
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
