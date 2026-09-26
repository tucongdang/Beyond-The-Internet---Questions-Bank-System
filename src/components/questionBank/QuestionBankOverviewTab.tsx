import React, { useMemo } from 'react';
import { 
  BarChart3, 
  Target, 
  ShieldCheck, 
  Sparkles,
  Layers,
  Compass,
  Rocket,
  Flag,
  Scale,
  FileSpreadsheet,
  Theater,
  Award,
  BookOpen,
  Zap,
  ArrowRight,
  Plus,
  ShieldAlert
} from 'lucide-react';
import { QuestionItem, BtiRoundGroupKey, DigitalCompetencyDomainKey } from '../../types';
import { DIGITAL_COMPETENCY_DOMAINS } from '../../data/digitalCompetencyData';
import { QuestionBankStatsWidget } from './QuestionBankStatsWidget';
import { DashboardOverviewHeader } from './DashboardOverviewHeader';
import { BtiMatrixOverviewWidget } from './BtiMatrixOverviewWidget';
import { KnowledgeAreaDifficultyWidget } from './KnowledgeAreaDifficultyWidget';
import { DifficultyTrendChart30D } from './DifficultyTrendChart30D';
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

  // 6 Competency Domains Breakdown
  const domainData = useMemo(() => {
    const domainKeys: DigitalCompetencyDomainKey[] = ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'];
    return domainKeys.map((key, idx) => {
      const dom = DIGITAL_COMPETENCY_DOMAINS[key];
      const count = stats.byDomain?.[key] || 0;
      const pct = totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0;
      return {
        id: key,
        name: dom?.name || key,
        shortName: `Miền ${idx + 1}`,
        count,
        pct,
        color: dom?.color || '#38bdf8'
      };
    });
  }, [stats, totalQuestions]);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. TOURNAMENT STAGE KPI BAR (Image 2) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Tổng câu hỏi */}
        <div 
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            onNavigateTab('QUESTIONS');
          }}
          className="fluent-stat-card cursor-pointer hover:border-theme-accent/50 transition-all hover:bg-[#241148]/90"
        >
          <span className="text-[#B6A6D8] block text-[10px] font-mono">Tổng câu hỏi:</span>
          <span className="text-xl font-bold text-theme-accent">{stats.total}</span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">
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
          className="fluent-stat-card cursor-pointer hover:border-theme-accent/50 transition-all hover:bg-[#241148]/90"
        >
          <span className="text-[#B6A6D8] block text-[10px] font-mono">Vòng Loại Bộ GD&ĐT:</span>
          <span className="text-xl font-bold text-theme-accent">{stats.byStage?.VONG_LOAI || 0}</span>
          <span className="text-[10px] text-[#B6A6D8] block mt-0.5">Chuẩn 28 câu</span>
        </div>

        {/* Card 3: 3 Vòng Bán Kết */}
        <div 
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            onFilterRound('BAN_KET' as any);
          }}
          className="fluent-stat-card cursor-pointer hover:border-theme-accent/50 transition-all hover:bg-[#241148]/90"
        >
          <span className="text-[#B6A6D8] block text-[10px] font-mono">3 Vòng Bán Kết:</span>
          <span className="text-xl font-bold text-[#B6A6D8]">
            {(stats.byStage?.BAN_KET_1 || 0) + (stats.byStage?.BAN_KET_2 || 0) + (stats.byStage?.BAN_KET_3 || 0)}
          </span>
          <span className="text-[10px] text-[#B6A6D8] block mt-0.5">Lượt riêng &amp; Lượt chung</span>
        </div>

        {/* Card 4: Đêm Chung Kết */}
        <div 
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            onFilterRound('CHUNG_KET' as any);
          }}
          className="fluent-stat-card cursor-pointer hover:border-theme-accent/50 transition-all hover:bg-[#241148]/90"
        >
          <span className="text-[#B6A6D8] block text-[10px] font-mono">Đêm Chung Kết:</span>
          <span className="text-xl font-bold text-[#E39A96]">{stats.byStage?.CHUNG_KET || 0}</span>
          <span className="text-[10px] text-[#B6A6D8] block mt-0.5">Tăng tốc &amp; Về đích</span>
        </div>

        {/* Card 5: Kịch Bản Tương Tác */}
        <div 
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            onNavigateTab('SCENARIOS');
          }}
          className="fluent-stat-card cursor-pointer hover:border-amber-500/50 transition-all hover:bg-[#241148]/90"
        >
          <span className="text-[#B6A6D8] block text-[10px] font-mono">Kịch Bản Tương Tác:</span>
          <span className="text-xl font-bold text-amber-300">{stats.scenariosCount || 0}</span>
          <span className="text-[10px] text-[#B6A6D8] block mt-0.5">Kèm Rubric chấm</span>
        </div>

        {/* Card 6: Văn Bản Pháp Lý */}
        <div 
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            onNavigateTab('LEGAL_DOCS');
          }}
          className="fluent-stat-card cursor-pointer hover:border-emerald-500/50 transition-all hover:bg-[#241148]/90"
        >
          <span className="text-[#B6A6D8] block text-[10px] font-mono">Văn Bản Pháp Lý:</span>
          <span className="text-xl font-bold text-emerald-400">{stats.documentsCount || 0}</span>
          <span className="text-[10px] text-[#B6A6D8] block mt-0.5">Căn cứ tham chiếu</span>
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

      {/* 2. MA TRẬN ĐỘ PHỦ & PHÂN BỐ MIỀN TRI THỨC VỚI 4 MỨC ĐỘ NHẬN THỨC (RECHARTS WIDGET) */}
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

      {/* 2B. BIỂU ĐỒ ĐƯỜNG BIẾN THIÊN ĐỘ KHÓ TRUNG BÌNH 30 NGÀY QUA */}
      <DifficultyTrendChart30D
        questions={questions}
        daysRange={30}
        onFilterLevel={(lvl) => {
          onFilterLevel(lvl);
        }}
      />

      {/* 3. PHÂN BỔ 4 PHẦN THI GAMESHOW BTI 2026 */}
      <div className="fluent-card p-3 sm:p-4 border border-theme-accent/25 bg-gradient-to-r from-[#241148]/90 via-[#1c0a36]/90 to-[#241148]/90 backdrop-blur-md rounded-[6px] space-y-3">
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
              <p className="text-[11px] text-[#B6A6D8]/80">
                Thống kê số lượng câu hỏi hiện có theo từng phần thi. Nhấp vào từng phần thi để lọc nhanh câu hỏi tương ứng.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono text-[#B6A6D8] bg-black/40 px-2.5 py-1 rounded-[4px] border border-white/10">
            Tổng 4 phần thi: <strong className="text-theme-accent font-bold">{totalGameshowQuestions}</strong> câu
          </span>
        </div>

        {/* 4 Rounds Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* 1. Khởi động */}
          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              onFilterRound('KHOI_DONG');
            }}
            className="group relative p-3 rounded-[5px] text-left transition-all cursor-pointer border bg-black/40 border-sky-500/20 hover:border-sky-400/50 hover:bg-sky-500/10"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[4px] bg-sky-500/20 text-sky-300 flex items-center justify-center border border-sky-500/30 shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-sky-200 block">1. Khởi Động</span>
                  <span className="text-[9px] text-[#B6A6D8] block font-mono">60s &amp; Bấm chuông</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-xl font-black text-sky-300 font-mono group-hover:scale-105 transition-transform">
                    {roundCounts.KHOI_DONG.total}
                  </span>
                  <span className="text-[10px] text-sky-300/70 font-mono">câu</span>
                </div>
                <span className="text-[9px] text-[#B6A6D8] font-mono block">
                  {totalGameshowQuestions > 0 ? Math.round((roundCounts.KHOI_DONG.total / totalGameshowQuestions) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Mini Status Progress Bar (Approved / Pending / Draft) */}
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2 flex" title="Tỷ lệ: Đã duyệt (Xanh) / Chờ duyệt (Cam) / Bản thảo (Xám)">
              <div
                className="bg-emerald-400 h-full transition-all duration-500"
                style={{
                  width: `${roundCounts.KHOI_DONG.total > 0 ? (roundCounts.KHOI_DONG.approved / roundCounts.KHOI_DONG.total) * 100 : 0}%`
                }}
              />
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{
                  width: `${roundCounts.KHOI_DONG.total > 0 ? (roundCounts.KHOI_DONG.pending / roundCounts.KHOI_DONG.total) * 100 : 0}%`
                }}
              />
              <div
                className="bg-slate-400 h-full transition-all duration-500"
                style={{
                  width: `${roundCounts.KHOI_DONG.total > 0 ? (roundCounts.KHOI_DONG.draft / roundCounts.KHOI_DONG.total) * 100 : 0}%`
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] text-[#B6A6D8] mt-1.5 font-mono">
              <span className="truncate">Lượt riêng &amp; Lượt chung</span>
              <span className="text-[9px] font-semibold text-[#B6A6D8]/60 group-hover:text-sky-300">
                Lọc →
              </span>
            </div>
          </button>

          {/* 2. Vượt Chướng Ngại Vật (VCNV) */}
          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              onFilterRound('VCNV');
            }}
            className="group relative p-3 rounded-[5px] text-left transition-all cursor-pointer border bg-black/40 border-amber-500/20 hover:border-amber-400/50 hover:bg-amber-500/10"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[4px] bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30 shrink-0">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-amber-200 block">2. Vượt CNV</span>
                  <span className="text-[9px] text-[#B6A6D8] block font-mono">Hàng ngang &amp; Trung tâm</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-xl font-black text-amber-300 font-mono group-hover:scale-105 transition-transform">
                    {roundCounts.VCNV.total}
                  </span>
                  <span className="text-[10px] text-amber-300/70 font-mono">câu</span>
                </div>
                <span className="text-[9px] text-[#B6A6D8] font-mono block">
                  {totalGameshowQuestions > 0 ? Math.round((roundCounts.VCNV.total / totalGameshowQuestions) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2 flex" title="Tỷ lệ: Đã duyệt (Xanh) / Chờ duyệt (Cam) / Bản thảo (Xám)">
              <div
                className="bg-emerald-400 h-full transition-all duration-500"
                style={{
                  width: `${roundCounts.VCNV.total > 0 ? (roundCounts.VCNV.approved / roundCounts.VCNV.total) * 100 : 0}%`
                }}
              />
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{
                  width: `${roundCounts.VCNV.total > 0 ? (roundCounts.VCNV.pending / roundCounts.VCNV.total) * 100 : 0}%`
                }}
              />
              <div
                className="bg-slate-400 h-full transition-all duration-500"
                style={{
                  width: `${roundCounts.VCNV.total > 0 ? (roundCounts.VCNV.draft / roundCounts.VCNV.total) * 100 : 0}%`
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] text-[#B6A6D8] mt-1.5 font-mono">
              <span className="truncate">Chướng ngại vật bí ẩn</span>
              <span className="text-[9px] font-semibold text-[#B6A6D8]/60 group-hover:text-amber-300">
                Lọc →
              </span>
            </div>
          </button>

          {/* 3. Tăng Tốc */}
          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              onFilterRound('TANG_TOC');
            }}
            className="group relative p-3 rounded-[5px] text-left transition-all cursor-pointer border bg-black/40 border-purple-500/20 hover:border-purple-400/50 hover:bg-purple-500/10"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[4px] bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30 shrink-0">
                  <Rocket className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-purple-200 block">3. Tăng Tốc</span>
                  <span className="text-[9px] text-[#B6A6D8] block font-mono">10s-20s-30s-40s</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-xl font-black text-purple-300 font-mono group-hover:scale-105 transition-transform">
                    {roundCounts.TANG_TOC.total}
                  </span>
                  <span className="text-[10px] text-purple-300/70 font-mono">câu</span>
                </div>
                <span className="text-[9px] text-[#B6A6D8] font-mono block">
                  {totalGameshowQuestions > 0 ? Math.round((roundCounts.TANG_TOC.total / totalGameshowQuestions) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2 flex" title="Tỷ lệ: Đã duyệt (Xanh) / Chờ duyệt (Cam) / Bản thảo (Xám)">
              <div
                className="bg-emerald-400 h-full transition-all duration-500"
                style={{
                  width: `${roundCounts.TANG_TOC.total > 0 ? (roundCounts.TANG_TOC.approved / roundCounts.TANG_TOC.total) * 100 : 0}%`
                }}
              />
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{
                  width: `${roundCounts.TANG_TOC.total > 0 ? (roundCounts.TANG_TOC.pending / roundCounts.TANG_TOC.total) * 100 : 0}%`
                }}
              />
              <div
                className="bg-slate-400 h-full transition-all duration-500"
                style={{
                  width: `${roundCounts.TANG_TOC.total > 0 ? (roundCounts.TANG_TOC.draft / roundCounts.TANG_TOC.total) * 100 : 0}%`
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] text-[#B6A6D8] mt-1.5 font-mono">
              <span className="truncate">Thang điểm chuẩn 40đ</span>
              <span className="text-[9px] font-semibold text-[#B6A6D8]/60 group-hover:text-purple-300">
                Lọc →
              </span>
            </div>
          </button>

          {/* 4. Về Đích */}
          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              onFilterRound('VE_DICH');
            }}
            className="group relative p-3 rounded-[5px] text-left transition-all cursor-pointer border bg-black/40 border-rose-500/20 hover:border-rose-400/50 hover:bg-rose-500/10"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[4px] bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-500/30 shrink-0">
                  <Flag className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-rose-200 block">4. Về Đích</span>
                  <span className="text-[9px] text-[#B6A6D8] block font-mono">Gói 20đ - 30đ - 40đ</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-xl font-black text-rose-300 font-mono group-hover:scale-105 transition-transform">
                    {roundCounts.VE_DICH.total}
                  </span>
                  <span className="text-[10px] text-rose-300/70 font-mono">câu</span>
                </div>
                <span className="text-[9px] text-[#B6A6D8] font-mono block">
                  {totalGameshowQuestions > 0 ? Math.round((roundCounts.VE_DICH.total / totalGameshowQuestions) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2 flex" title="Tỷ lệ: Đã duyệt (Xanh) / Chờ duyệt (Cam) / Bản thảo (Xám)">
              <div
                className="bg-emerald-400 h-full transition-all duration-500"
                style={{
                  width: `${roundCounts.VE_DICH.total > 0 ? (roundCounts.VE_DICH.approved / roundCounts.VE_DICH.total) * 100 : 0}%`
                }}
              />
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{
                  width: `${roundCounts.VE_DICH.total > 0 ? (roundCounts.VE_DICH.pending / roundCounts.VE_DICH.total) * 100 : 0}%`
                }}
              />
              <div
                className="bg-slate-400 h-full transition-all duration-500"
                style={{
                  width: `${roundCounts.VE_DICH.total > 0 ? (roundCounts.VE_DICH.draft / roundCounts.VE_DICH.total) * 100 : 0}%`
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] text-[#B6A6D8] mt-1.5 font-mono">
              <span className="truncate">NSHV &amp; Tình huống</span>
              <span className="text-[9px] font-semibold text-[#B6A6D8]/60 group-hover:text-rose-300">
                Lọc →
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. QUICK ACTION SHORTCUTS & 6 COMPETENCY DOMAINS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 cols): Quick Actions */}
        <div className="lg:col-span-2 p-4 rounded-lg bg-[#241148]/80 border border-theme-accent/20 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Tác Vụ Nhanh Biên Tập &amp; Quản Lý
              </h3>
              <span className="text-[11px] text-theme-accent/80 font-mono">
                BTI 2026 Toolkit
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3.5">
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onOpenAddQuestion();
                }}
                className="p-3 rounded bg-white/5 hover:bg-theme-accent/15 border border-white/10 hover:border-theme-accent/40 text-left transition flex flex-col justify-between group cursor-pointer"
              >
                <div className="w-8 h-8 rounded bg-theme-accent/20 text-theme-accent flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-theme-accent transition">Thêm Câu Hỏi</span>
                  <span className="text-[10px] text-white/50 block font-mono">Soạn thủ công</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onNavigateTab('AI_STUDIO');
                }}
                className="p-3 rounded bg-white/5 hover:bg-purple-500/15 border border-white/10 hover:border-purple-400/40 text-left transition flex flex-col justify-between group cursor-pointer"
              >
                <div className="w-8 h-8 rounded bg-purple-500/20 text-purple-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-purple-300 transition">AI Studio</span>
                  <span className="text-[10px] text-white/50 block font-mono">Sinh đề tự động</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onOpenBulkImport();
                }}
                className="p-3 rounded bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-400/40 text-left transition flex flex-col justify-between group cursor-pointer"
              >
                <div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-emerald-300 transition">Nhập Hàng Loạt</span>
                  <span className="text-[10px] text-white/50 block font-mono">Text / Excel</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onOpenExamGenerator();
                }}
                className="p-3 rounded bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-400/60 text-left transition flex flex-col justify-between group cursor-pointer shadow-sm"
              >
                <div className="w-8 h-8 rounded bg-amber-500/20 text-amber-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform border border-amber-400/40">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-amber-300 transition flex items-center gap-1">
                    <span>Tạo Đề Thi Thử AI</span>
                  </span>
                  <span className="text-[10px] text-amber-200/70 block font-mono">Cân bằng ma trận độ khó</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onNavigateTab('SCENARIOS');
                }}
                className="p-3 rounded bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-400/40 text-left transition flex flex-col justify-between group cursor-pointer"
              >
                <div className="w-8 h-8 rounded bg-rose-500/20 text-rose-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Theater className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-rose-300 transition">Kịch Bản Tình Huống</span>
                  <span className="text-[10px] text-white/50 block font-mono">Phần thi Về Đích</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onNavigateTab('EXCEL_HUB');
                }}
                className="p-3 rounded bg-white/5 hover:bg-teal-500/15 border border-white/10 hover:border-teal-400/40 text-left transition flex flex-col justify-between group cursor-pointer"
              >
                <div className="w-8 h-8 rounded bg-teal-500/20 text-teal-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-teal-300 transition">Mẫu Excel</span>
                  <span className="text-[10px] text-white/50 block font-mono">Tải template</span>
                </div>
              </button>

              {onOpenDuplicateChecker && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onOpenDuplicateChecker();
                  }}
                  className="p-3 rounded bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 hover:border-rose-400/60 text-left transition flex flex-col justify-between group cursor-pointer shadow-sm"
                >
                  <div className="w-8 h-8 rounded bg-rose-500/25 text-rose-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform border border-rose-400/40">
                    <ShieldAlert className="w-4 h-4 text-rose-300" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block group-hover:text-rose-300 transition flex items-center gap-1">
                      <span>Detect Duplicates</span>
                      <Sparkles className="w-3 h-3 text-amber-300" />
                    </span>
                    <span className="text-[10px] text-rose-200/70 block font-mono">Rà soát trùng lặp AI</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): 6 Competency Domains Quick List */}
        <div className="p-4 rounded-lg bg-[#241148]/80 border border-white/10 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  6 Miền Năng Lực Số (TT 02)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onNavigateTab('MATRIX');
                }}
                className="text-[11px] text-theme-accent hover:underline font-mono cursor-pointer"
              >
                Ma trận 6x4 →
              </button>
            </div>

            <div className="space-y-1.5 mt-2.5">
              {domainData.map((d) => (
                <div 
                  key={d.id} 
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onNavigateTab('MATRIX');
                  }}
                  className="p-2 rounded bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between text-xs transition cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-white/90 truncate font-medium">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 font-mono">
                    <span className="font-bold text-white">{d.count}</span>
                    <span className="text-[10px] text-white/50">({d.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2.5 border-t border-white/10 mt-2.5 flex items-center justify-between text-[11px] text-white/60 font-mono">
            <span>Tiêu chuẩn Bộ GD&amp;ĐT</span>
            <span className="text-emerald-400 font-semibold">Đầy đủ 6 miền</span>
          </div>
        </div>
      </div>
    </div>
  );
};
