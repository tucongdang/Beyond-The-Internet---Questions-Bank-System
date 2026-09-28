import React, { useMemo } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
  Layers,
  Brain,
  Target,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  BookOpen,
  Zap,
  Scale,
  Theater
} from 'lucide-react';
import { questionBankManager } from '../../services/questionBankManager';
import { DIGITAL_COMPETENCY_DOMAINS, COGNITIVE_LEVELS } from '../../data/digitalCompetencyData';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  borderColor?: string;
}

// ─── Fluent 2 Stat Card ───────────────────────────────────────────────────────

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon, color }) => (
  <div className="fluent-card p-4 rounded-[6px] relative overflow-hidden space-y-2 cursor-default group hover:translate-y-[-1px] transition-all duration-200">
    <div className={`absolute top-0 left-0 right-0 h-[2px] ${color} opacity-85`} />
    <div className="relative flex items-center justify-between">
      <span className="text-[11px] font-mono font-bold text-white/60 uppercase tracking-wider">{label}</span>
      <div className={`p-1.5 rounded-[4px] ${color} bg-opacity-20 shadow-sm transition-transform duration-200 group-hover:scale-105`}>
        {icon}
      </div>
    </div>
    <div className="relative">
      <span className="text-2xl font-black text-white tabular-nums tracking-tight">{value}</span>
      {sub && <span className="text-[11px] text-white/50 ml-2 font-mono">{sub}</span>}
    </div>
  </div>
);

// ─── Fluent 2 Horizontal Metric Bar ──────────────────────────────────────────

interface HBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
  badge?: string;
}

const HBar: React.FC<HBarProps> = ({ label, count, total, color, badge }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/85 font-sans font-medium truncate max-w-[200px]">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          {badge && (
            <span className="text-[10px] font-mono text-white/45 bg-white/5 px-1.5 py-0.2 rounded-[3px] border border-white/10">
              {badge}
            </span>
          )}
          <span className="font-mono font-bold text-white text-[11px] tabular-nums">{count}</span>
          <span className="text-white/40 text-[10px] font-mono">({pct}%)</span>
        </div>
      </div>
      <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Main Component (Fluent UI v2) ───────────────────────────────────────────

export const QuestionBankStatsView: React.FC = () => {
  const stats = useMemo(() => questionBankManager.getMatrixStats(), []);
  const questions = useMemo(() => questionBankManager.getQuestions(), []);
  const total = stats.total;

  // Recent activity: questions created in last 7 days & 30 days
  const now = Date.now();
  const last7d = questions.filter(q => q.created_at && now - q.created_at < 7 * 24 * 3600_000).length;
  const last30d = questions.filter(q => q.created_at && now - q.created_at < 30 * 24 * 3600_000).length;

  // Completion rate (approved / total)
  const approvedCount = stats.byStatus['APPROVED'] || 0;
  const pendingCount = stats.byStatus['PENDING_REVIEW'] || 0;
  const draftCount = stats.byStatus['DRAFT'] || 0;
  const rejectedCount = stats.byStatus['REJECTED'] || 0;
  const needsRevisionCount = stats.byStatus['NEEDS_REVISION'] || 0;
  const completionRate = total > 0 ? Math.round((approvedCount / total) * 100) : 0;

  // Domain labels
  const domainLabels: Record<string, string> = {
    MIEN_1: 'Miền 1: Khai thác dữ liệu & thông tin',
    MIEN_2: 'Miền 2: Giao tiếp & hợp tác số',
    MIEN_3: 'Miền 3: Sáng tạo nội dung số',
    MIEN_4: 'Miền 4: An toàn & bảo mật số',
    MIEN_5: 'Miền 5: Giải quyết vấn đề trong MT số',
    MIEN_6: 'Miền 6: Trí tuệ nhân tạo (AI & GenAI)'
  };

  const domainColors: Record<string, string> = {
    MIEN_1: 'bg-sky-500',
    MIEN_2: 'bg-purple-500',
    MIEN_3: 'bg-pink-500',
    MIEN_4: 'bg-rose-500',
    MIEN_5: 'bg-orange-500',
    MIEN_6: 'bg-cyan-500'
  };

  const cogColors: Record<string, string> = {
    NHAN_BIET: 'bg-sky-400',
    THONG_HIEU: 'bg-emerald-400',
    VAN_DUNG: 'bg-amber-400',
    VAN_DUNG_CAO: 'bg-rose-400'
  };

  const cogLabels: Record<string, string> = {
    NHAN_BIET: 'Nhận biết (Level 1)',
    THONG_HIEU: 'Thông hiểu (Level 2)',
    VAN_DUNG: 'Vận dụng (Level 3)',
    VAN_DUNG_CAO: 'Vận dụng cao (Level 4)'
  };

  const roundGroupLabels: Record<string, { label: string; color: string }> = {
    VONG_LOAI: { label: 'Vòng Loại (Trực tuyến)', color: 'bg-indigo-500' },
    KHOI_DONG: { label: 'Khởi Động', color: 'bg-sky-500' },
    VCNV: { label: 'Vượt Chướng Ngại Vật', color: 'bg-amber-500' },
    TANG_TOC: { label: 'Tăng Tốc', color: 'bg-orange-500' },
    VE_DICH: { label: 'Về Đích', color: 'bg-emerald-500' },
    PHU: { label: 'Câu Hỏi Phụ', color: 'bg-purple-500' }
  };

  // 2D Matrix: Domain × CogLevel
  const domains = ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'] as const;
  const cogLevels = ['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'] as const;

  const maxMatrixVal = Math.max(
    1,
    ...domains.flatMap(d => cogLevels.map(l => stats.matrix2D[d]?.[l] || 0))
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner - Fluent 2 Mica Hero Card */}
      <div className="fluent-box p-6 rounded-[8px] relative overflow-hidden space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 text-[10.5px] font-mono font-bold uppercase tracking-wider mb-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
              <span>Phân Tích Dữ Liệu Thời Gian Thực • BTI 2026</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Thống Kê Ngân Hàng Câu Hỏi</h2>
            <p className="text-xs text-white/60 font-sans max-w-xl">
              Phân tích cơ cấu và chất lượng của <strong>{total}</strong> câu hỏi theo Khung năng lực số (Thông tư 02/2025/TT-BGDĐT), Cấp độ Bloom và Vòng thi.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="text-center px-4 py-2.5 rounded-[6px] bg-black/50 border border-white/10 shadow-inner">
              <div className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight">{total}</div>
              <div className="text-[10px] font-mono text-white/50 uppercase tracking-wider">Tổng Câu Hỏi</div>
            </div>
            <div className="text-center px-4 py-2.5 rounded-[6px] bg-emerald-950/40 border border-emerald-500/40 shadow-inner">
              <div className="text-2xl sm:text-3xl font-black text-emerald-300 tabular-nums tracking-tight">{completionRate}%</div>
              <div className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-wider">Đã Phê Duyệt</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row - Fluent 2 Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Đã Duyệt"
          value={approvedCount}
          sub={`${total > 0 ? Math.round((approvedCount / total) * 100) : 0}%`}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          color="bg-emerald-500"
        />
        <StatCard
          label="Chờ Duyệt"
          value={pendingCount}
          icon={<Clock className="w-4 h-4 text-amber-400" />}
          color="bg-amber-500"
        />
        <StatCard
          label="Bản Nháp"
          value={draftCount}
          icon={<FileText className="w-4 h-4 text-sky-400" />}
          color="bg-sky-500"
        />
        <StatCard
          label="Từ Chối / Sửa"
          value={rejectedCount + needsRevisionCount}
          icon={<XCircle className="w-4 h-4 text-rose-400" />}
          color="bg-rose-500"
        />
        <StatCard
          label="7 Ngày Qua"
          value={last7d}
          sub="câu mới"
          icon={<TrendingUp className="w-4 h-4 text-purple-400" />}
          color="bg-purple-500"
        />
        <StatCard
          label="30 Ngày Qua"
          value={last30d}
          sub="câu mới"
          icon={<Sparkles className="w-4 h-4 text-indigo-400" />}
          color="bg-indigo-500"
        />
      </div>

      {/* Charts Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* By Domain */}
        <div className="fluent-box p-5 rounded-[8px] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Layers className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wide">
              Phân Bổ Theo 6 Miền Năng Lực Số
            </h3>
          </div>
          <div className="space-y-3 pt-1">
            {domains.map(d => (
              <HBar
                key={d}
                label={domainLabels[d]}
                count={stats.byDomain[d] || 0}
                total={total}
                color={domainColors[d]}
                badge={d}
              />
            ))}
          </div>
        </div>

        {/* By Cognitive Level + Approval Badges */}
        <div className="fluent-box p-5 rounded-[8px] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Brain className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wide">
              Phân Bổ Theo Cấp Độ Bloom
            </h3>
          </div>
          <div className="space-y-3 pt-1">
            {cogLevels.map(l => (
              <HBar
                key={l}
                label={cogLabels[l]}
                count={stats.byLevel[l] || 0}
                total={total}
                color={cogColors[l]}
              />
            ))}
          </div>

          {/* Quick status breakdown */}
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                Trạng Thái Kiểm Định
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono">
              {[
                { key: 'APPROVED', label: 'Đã Duyệt', count: approvedCount, cls: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30' },
                { key: 'PENDING_REVIEW', label: 'Chờ Thẩm Định', count: pendingCount, cls: 'border-amber-500/40 text-amber-300 bg-amber-950/30' },
                { key: 'DRAFT', label: 'Bản Nháp', count: draftCount, cls: 'border-sky-500/40 text-sky-300 bg-sky-950/30' },
                { key: 'REJECTED', label: 'Từ Chối', count: rejectedCount, cls: 'border-rose-500/40 text-rose-300 bg-rose-950/30' },
                { key: 'NEEDS_REVISION', label: 'Cần Sửa', count: needsRevisionCount, cls: 'border-orange-500/40 text-orange-300 bg-orange-950/30' }
              ].map(s => (
                <div key={s.key} className={`p-2 rounded-[4px] border ${s.cls} transition-all`}>
                  <div className="text-base font-black tabular-nums">{s.count}</div>
                  <div className="text-[9.5px] mt-0.5 truncate">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Round Group Distribution */}
      <div className="fluent-box p-5 rounded-[8px] space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <Target className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wide">
            Phân Bổ Theo Vòng Thi BTI 2026
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {Object.entries(roundGroupLabels).map(([key, { label, color }]) => {
            const count = stats.byRoundGroup[key as keyof typeof stats.byRoundGroup] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={key} className="fluent-card p-3 rounded-[6px] text-center space-y-2 hover:translate-y-[-1px] transition-all">
                <div className={`h-1.5 rounded-full ${color} mx-3`} style={{ opacity: count > 0 ? 1 : 0.2 }} />
                <div className="text-xl font-black text-white tabular-nums tracking-tight">{count}</div>
                <div className="text-[10.5px] font-mono text-white/60 leading-tight line-clamp-1">{label}</div>
                <div className={`text-[11px] font-mono font-bold ${count > 0 ? 'text-white/80' : 'text-white/30'}`}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2D Heatmap Matrix: Domain × Cognitive Level */}
      <div className="fluent-box p-5 rounded-[8px] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wide">
              Ma Trận Nhiệt Phân Bố: Miền × Cấp Độ Bloom
            </h3>
          </div>
          <span className="text-[10px] font-mono text-white/50">Màu xanh đậm = Mật độ câu hỏi cao</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/50 font-bold p-2.5 w-40 uppercase tracking-wider">Miền / Cấp Độ</th>
                {cogLevels.map(l => (
                  <th key={l} className="text-center text-white/70 font-bold p-2.5 min-w-[90px] uppercase tracking-wider">
                    {cogLabels[l].split(' ')[0]}
                  </th>
                ))}
                <th className="text-center text-white/70 font-bold p-2.5 uppercase tracking-wider">Tổng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {domains.map(d => {
                const rowTotal = cogLevels.reduce((sum, l) => sum + (stats.matrix2D[d]?.[l] || 0), 0);
                return (
                  <tr key={d} className="hover:bg-white/[0.03] transition-colors">
                    <td className="p-2.5 text-white/85 font-sans text-xs whitespace-nowrap font-medium">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${domainColors[d]}`} />
                      {domainLabels[d].split(':')[0]}
                    </td>
                    {cogLevels.map(l => {
                      const val = stats.matrix2D[d]?.[l] || 0;
                      const intensity = maxMatrixVal > 0 ? val / maxMatrixVal : 0;
                      const bg = val === 0
                        ? 'bg-white/5 text-white/20'
                        : intensity > 0.75
                          ? 'bg-emerald-500/70 text-slate-950 font-black shadow-sm ring-1 ring-emerald-400/50'
                          : intensity > 0.5
                            ? 'bg-emerald-500/40 text-white font-bold'
                            : intensity > 0.25
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-emerald-500/10 text-emerald-400/70';
                      return (
                        <td key={l} className="p-1.5 text-center">
                          <span className={`inline-block px-3 py-1 rounded-[4px] ${bg} min-w-[42px] tabular-nums transition-all`}>
                            {val}
                          </span>
                        </td>
                      );
                    })}
                    <td className="p-2.5 text-center font-bold text-white/90 tabular-nums">{rowTotal}</td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr className="border-t-2 border-white/15 bg-white/[0.02]">
                <td className="p-2.5 font-bold text-white/80 uppercase tracking-wider text-xs">Tổng cộng</td>
                {cogLevels.map(l => (
                  <td key={l} className="p-2.5 text-center font-bold text-white/90 tabular-nums">
                    {domains.reduce((sum, d) => sum + (stats.matrix2D[d]?.[l] || 0), 0)}
                  </td>
                ))}
                <td className="p-2.5 text-center font-black text-theme-accent text-sm tabular-nums">{total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Summary Cards - Fluent 2 Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="fluent-card p-4 rounded-[6px] flex items-center gap-3">
          <Theater className="w-7 h-7 text-purple-400 shrink-0" />
          <div>
            <div className="text-xl font-black text-white tabular-nums tracking-tight">{stats.scenariosCount}</div>
            <div className="text-[10px] font-mono text-white/50 uppercase">Kịch Bản Tương Tác</div>
          </div>
        </div>

        <div className="fluent-card p-4 rounded-[6px] flex items-center gap-3">
          <Scale className="w-7 h-7 text-amber-400 shrink-0" />
          <div>
            <div className="text-xl font-black text-white tabular-nums tracking-tight">{stats.documentsCount}</div>
            <div className="text-[10px] font-mono text-white/50 uppercase">Văn Bản Pháp Lý</div>
          </div>
        </div>

        <div className="fluent-card p-4 rounded-[6px] flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-emerald-400 shrink-0" />
          <div>
            <div className="text-xl font-black text-white tabular-nums tracking-tight">{approvedCount}</div>
            <div className="text-[10px] font-mono text-white/50 uppercase">Câu Sẵn Sàng Thi</div>
          </div>
        </div>

        <div className="fluent-card p-4 rounded-[6px] flex items-center gap-3">
          <Zap className="w-7 h-7 text-sky-400 shrink-0" />
          <div>
            <div className="text-xl font-black text-white tabular-nums tracking-tight">{last7d}</div>
            <div className="text-[10px] font-mono text-white/50 uppercase">Câu Mới (7 ngày)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
