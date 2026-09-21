import React, { useMemo } from 'react';
import { BarChart3, Target, ChevronRight, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { QuestionItem, DigitalCompetencyDomainKey } from '../../types';
import { DIGITAL_COMPETENCY_DOMAINS } from '../../data/digitalCompetencyData';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap } from '../../utils/hapticUtils';

interface BtiMatrixOverviewWidgetProps {
  questions: QuestionItem[];
  onOpenFullMatrix: () => void;
}

export const BtiMatrixOverviewWidget: React.FC<BtiMatrixOverviewWidgetProps> = ({
  questions,
  onOpenFullMatrix
}) => {
  const domainKeys: DigitalCompetencyDomainKey[] = ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'];

  const chartData = useMemo(() => {
    return domainKeys.map(dKey => {
      const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
      const domQuestions = questions.filter(q => {
        if (q.digital_competency_domain === dKey) return true;
        if (q.category?.includes(dom?.code || '')) return true;
        return false;
      });

      let nb = 0, th = 0, vd = 0, vdc = 0;
      domQuestions.forEach(q => {
        const lvl = q.cognitive_level || 'THONG_HIEU';
        if (lvl === 'NHAN_BIET') nb++;
        else if (lvl === 'THONG_HIEU') th++;
        else if (lvl === 'VAN_DUNG') vd++;
        else if (lvl === 'VAN_DUNG_CAO') vdc++;
        else th++;
      });

      return {
        domainCode: dom?.code || dKey,
        domainName: dom?.name || dKey,
        'Nhận biết': nb,
        'Thông hiểu': th,
        'Vận dụng': vd,
        'Vận dụng cao': vdc,
        total: domQuestions.length
      };
    });
  }, [questions]);

  return (
    <div className="fluent-card p-4 sm:p-5 rounded-[4px] bg-[#16072D] border border-theme-accent/30 space-y-3">
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded bg-purple-600/30 text-amber-300 border border-purple-400/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
              Phân Phối Độ Phủ Khung Năng Lực BTI 2026
            </h3>
            <p className="text-xs text-slate-300">
              Độ phủ 6 Miền Năng Lực Số (TT 02/2025/TT-BGDĐT) & 4 Mức Độ Nhận Thức
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            onOpenFullMatrix();
          }}
          className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 border border-amber-400/40 rounded text-xs font-mono font-bold flex items-center gap-1 transition cursor-pointer"
        >
          <span>Xem Ma Trận Đầy Đủ</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-64 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="domainCode" stroke="#B6A6D8" fontSize={11} tickLine={false} />
            <YAxis stroke="#B6A6D8" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1C093B', borderColor: '#8b5cf6', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
            <Bar dataKey="Nhận biết" stackId="a" fill="#38bdf8" />
            <Bar dataKey="Thông hiểu" stackId="a" fill="#34d399" />
            <Bar dataKey="Vận dụng" stackId="a" fill="#fbbf24" />
            <Bar dataKey="Vận dụng cao" stackId="a" fill="#f43f5e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
