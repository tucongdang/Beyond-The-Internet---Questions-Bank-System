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
  color: string; // tailwind bg class
  borderColor: string;
}

// ─── Small stat card ──────────────────────────────────────────────────────────

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon, color, borderColor }) => (
  <div className={`p-4 rounded-[6px] border ${borderColor} bg-black/40 space-y-2 relative overflow-hidden`}>
    <div className={`absolute inset-0 opacity-5 ${color}`} />
    <div className="relative flex items-center justify-between">
      <span className="text-[11px] font-mono font-bold text-white/60 uppercase tracking-wider">{label}</span>
      <div className={`p-1.5 rounded-[4px] ${color} bg-opacity-20`}>{icon}</div>
    </div>
    <div className="relative">
      <span className="text-2xl font-black text-white tabular-nums">{value}</span>
      {sub && <span className="text-[11px] text-white/50 ml-2 font-mono">{sub}</span>}
    </div>
  </div>
);

// ─── Horizontal bar ───────────────────────────────────────────────────────────

interface HBarProps {
  label: string;
  count: number;
  total: number;
  color: string; // tailwind bg class for bar fill
  badge?: string;
}

const HBar: React.FC<HBarProps> = ({ label, count, total, color, badge }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/80 font-sans truncate max-w-[180px]">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          {badge && (
            <span className="text-[10px] font-mono text-white/40 bg-white/5 px-1.5 py-0.2 rounded border border-white/10">
              {badge}
            </span>
          )}
          <span className="font-mono font-bold text-white text-[11px]">{count}</span>
          <span className="text-white/40 text-[10px]">({pct}%)</span>
        </div>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const QuestionBankStatsView: React.FC = () => {
  const stats = useMemo(() => questionBankManager.getMatrixStats(), []);
  const questions = useMemo(() => questionBankManager.getQuestions(), []);
  const total = stats.total;

  // Recent activity: questions created in last 7 days
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
    MIEN_1: 'Miền 1: Khai thác dữ liệu',
    MIEN_2: 'Miền 2: Giao tiếp số',
    MIEN_3: 'Miền 3: Sáng tạo nội dung',
    MIEN_4: 'Miền 4: An toàn & Bảo mật',
    MIEN_5: 'Miền 5: Giải quyết vấn đề',
    MIEN_6: 'Miền 6: Trí tuệ nhân tạo'
  };

  const domainColors: Record<string, string> = {
    MIEN_1: 'bg-emerald-500',
    MIEN_2: 'bg-teal-500',
    MIEN_3: 'bg-purple-500',
    MIEN_4: 'bg-rose-500',
    MIEN_5: 'bg-sky-500',
    MIEN_6: 'bg-cyan-500'
  };

  const cogColors: Record<string, string> = {
    NHAN_BIET: 'bg-sky-400',
    THONG_HIEU: 'bg-emerald-400',
    VAN_DUNG: 'bg-amber-400',
    VAN_DUNG_CAO: 'bg-rose-400'
  };

  const cogLabels: Record<string, string> = {
    NHAN_BIET: 'Nhận biết (L1)',
    THONG_HIEU: 'Thông hiểu (L2)',
    VAN_DUNG: 'Vận dụng (L3)',
    VAN_DUNG_CAO: 'Vận dụng cao (L4)'
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
    <div className="space-y-6">
      {/* Header */}
      <div className="fluent-box p-5 rounded-[6px] border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-black/60 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-bold mb-2 border border-purple-400/30">
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Thống Kê Ngân Hàng Đề • Real-time Analytics</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Bảng Thống Kê Toàn Diện</h2>
            <p className="text-xs text-white/60 mt-0.5">
              Phân tích đầy đủ {total} câu hỏi theo Miền, Cấp độ Bloom, Vòng thi và Trạng thái duyệt.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center p-3 bg-black/40 border border-white/15 rounded-[6px]">
              <div className="text-3xl font-black text-white tabular-nums">{total}</div>
              <div className="text-[10px] font-mono text-white/50 uppercase tracking-wider mt-0.5">Tổng Câu Hỏi</div>
            </div>
            <div className="text-center p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-[6px]">
              <div className="text-3xl font-black text-emerald-300 tabular-nums">{completionRate}%</div>
              <div className="text-[10px] font-mono text-emerald-400/70 uppercase tracking-wider mt-0.5">Tỉ lệ Duyệt</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Đã Duyệt"
          value={approvedCount}
          sub={`${total > 0 ? Math.round(approvedCount / total * 100) : 0}%`}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          color="bg-emerald-500"
          borderColor="border-emerald-500/30"
        />
        <StatCard
          label="Chờ Duyệt"
          value={pendingCount}
          icon={<Clock className="w-4 h-4 text-amber-400" />}
          color="bg-amber-500"
          borderColor="border-amber-500/30"
        />
        <StatCard
          label="Nháp"
          value={draftCount}
          icon={<FileText className="w-4 h-4 text-sky-400" />}
          color="bg-sky-500"
          borderColor="border-sky-500/30"
        />
        <StatCard
          label="Bị Từ Chối"
          value={rejectedCount}
          icon={<XCircle className="w-4 h-4 text-rose-400" />}
          color="bg-rose-500"
          borderColor="border-rose-500/30"
        />
        <StatCard
          label="7 Ngày Qua"
          value={last7d}
          sub="câu mới"
          icon={<TrendingUp className="w-4 h-4 text-purple-400" />}
          color="bg-purple-500"
          borderColor="border-purple-500/30"
        />
        <StatCard
          label="30 Ngày Qua"
          value={last30d}
          sub="câu mới"
          icon={<Sparkles className="w-4 h-4 text-indigo-400" />}
          color="bg-indigo-500"
          borderColor="border-indigo-500/30"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* By Domain */}
        <div className="fluent-box p-5 rounded-[6px] border border-white/15 bg-[#190839]/40 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Layers className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white font-mono">Phân bổ theo Miền Năng Lực Số</h3>
          </div>
          <div className="space-y-3">
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

        {/* By Cognitive Level */}
        <div className="fluent-box p-5 rounded-[6px] border border-white/15 bg-[#190839]/40 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Brain className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white font-mono">Phân bổ theo Cấp độ Bloom (Nhận thức)</h3>
          </div>
          <div className="space-y-3">
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

          {/* By Approval Status mini */}
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white font-mono">Trạng Thái Duyệt</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono">
              {[
                { key: 'APPROVED', label: 'Duyệt', count: approvedCount, cls: 'border-emerald-500/30 text-emerald-300 bg-emerald-950/30' },
                { key: 'PENDING_REVIEW', label: 'Chờ', count: pendingCount, cls: 'border-amber-500/30 text-amber-300 bg-amber-950/30' },
                { key: 'DRAFT', label: 'Nháp', count: draftCount, cls: 'border-sky-500/30 text-sky-300 bg-sky-950/30' },
                { key: 'REJECTED', label: 'Từ chối', count: rejectedCount, cls: 'border-rose-500/30 text-rose-300 bg-rose-950/30' },
                { key: 'NEEDS_REVISION', label: 'Sửa', count: needsRevisionCount, cls: 'border-orange-500/30 text-orange-300 bg-orange-950/30' }
              ].map(s => (
                <div key={s.key} className={`p-2 rounded border ${s.cls}`}>
                  <div className="text-lg font-black">{s.count}</div>
                  <div className="text-[9px] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Round Group Distribution */}
      <div className="fluent-box p-5 rounded-[6px] border border-white/15 bg-[#190839]/40 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <Target className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold text-white font-mono">Phân bổ theo Vòng Thi BTI 2026</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(roundGroupLabels).map(([key, { label, color }]) => {
            const count = stats.byRoundGroup[key as keyof typeof stats.byRoundGroup] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={key} className="p-3 bg-black/40 rounded-[6px] border border-white/10 text-center space-y-2">
                <div className={`h-1.5 rounded-full ${color} mx-4`} style={{ opacity: count > 0 ? 1 : 0.2 }} />
                <div className="text-xl font-black text-white tabular-nums">{count}</div>
                <div className="text-[10px] font-mono text-white/50 leading-tight">{label}</div>
                <div className={`text-[11px] font-bold font-mono ${count > 0 ? 'text-white/70' : 'text-white/30'}`}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2D Matrix Heatmap: Domain × Cognitive Level */}
      <div className="fluent-box p-5 rounded-[6px] border border-white/15 bg-[#190839]/40 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white font-mono">Ma Trận Nhiệt: Miền × Cấp Độ Bloom</h3>
          <span className="text-[10px] font-mono text-white/40 ml-auto">Màu đậm = nhiều câu hơn</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr>
                <th className="text-left text-white/40 font-normal p-2 w-36">Miền / Cấp độ</th>
                {cogLevels.map(l => (
                  <th key={l} className="text-center text-white/60 font-bold p-2 min-w-[80px]">
                    {cogLabels[l].split(' ')[0]}
                  </th>
                ))}
                <th className="text-center text-white/60 font-bold p-2">Tổng</th>
              </tr>
            </thead>
            <tbody>
              {domains.map(d => {
                const rowTotal = cogLevels.reduce((sum, l) => sum + (stats.matrix2D[d]?.[l] || 0), 0);
                return (
                  <tr key={d} className="border-t border-white/5">
                    <td className="p-2 text-white/70 font-sans text-[11px] whitespace-nowrap">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${domainColors[d]}`} />
                      {domainLabels[d].split(':')[0]}
                    </td>
                    {cogLevels.map(l => {
                      const val = stats.matrix2D[d]?.[l] || 0;
                      const intensity = maxMatrixVal > 0 ? val / maxMatrixVal : 0;
                      const bg = val === 0
                        ? 'bg-white/5 text-white/20'
                        : intensity > 0.75
                          ? 'bg-emerald-500/60 text-white font-bold'
                          : intensity > 0.5
                            ? 'bg-emerald-500/40 text-white'
                            : intensity > 0.25
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-emerald-500/10 text-emerald-400/60';
                      return (
                        <td key={l} className="p-1 text-center">
                          <span className={`inline-block px-3 py-1 rounded ${bg} min-w-[40px]`}>
                            {val}
                          </span>
                        </td>
                      );
                    })}
                    <td className="p-2 text-center font-bold text-white/80">{rowTotal}</td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr className="border-t border-white/15">
                <td className="p-2 font-bold text-white/60 text-[11px]">Tổng cộng</td>
                {cogLevels.map(l => (
                  <td key={l} className="p-2 text-center font-bold text-white/70">
                    {domains.reduce((sum, d) => sum + (stats.matrix2D[d]?.[l] || 0), 0)}
                  </td>
                ))}
                <td className="p-2 text-center font-black text-white">{total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom row: Scenarios & Docs counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-black/40 border border-purple-500/20 rounded-[6px] flex items-center gap-3">
          <Theater className="w-7 h-7 text-purple-400 shrink-0" />
          <div>
            <div className="text-xl font-black text-white">{stats.scenariosCount}</div>
            <div className="text-[10px] font-mono text-white/50">Kịch Bản Tương Tác</div>
          </div>
        </div>
        <div className="p-4 bg-black/40 border border-amber-500/20 rounded-[6px] flex items-center gap-3">
          <Scale className="w-7 h-7 text-amber-400 shrink-0" />
          <div>
            <div className="text-xl font-black text-white">{stats.documentsCount}</div>
            <div className="text-[10px] font-mono text-white/50">Văn Bản Pháp Lý</div>
          </div>
        </div>
        <div className="p-4 bg-black/40 border border-emerald-500/20 rounded-[6px] flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-emerald-400 shrink-0" />
          <div>
            <div className="text-xl font-black text-white">{approvedCount}</div>
            <div className="text-[10px] font-mono text-white/50">Câu Sẵn Sàng Thi</div>
          </div>
        </div>
        <div className="p-4 bg-black/40 border border-sky-500/20 rounded-[6px] flex items-center gap-3">
          <Zap className="w-7 h-7 text-sky-400 shrink-0" />
          <div>
            <div className="text-xl font-black text-white">{last7d}</div>
            <div className="text-[10px] font-mono text-white/50">Câu Mới (7 ngày)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
