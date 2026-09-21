import React, { useState, useMemo } from 'react';
import {
  X,
  Target,
  BarChart3,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  Zap,
  Info,
  ChevronRight,
  Search,
  ExternalLink
} from 'lucide-react';
import { QuestionItem, DigitalCompetencyDomainKey, CognitiveLevel } from '../../types';
import { DIGITAL_COMPETENCY_DOMAINS } from '../../data/digitalCompetencyData';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';

interface BtiCompetencyMatrixQuickPopupProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestionItem[];
  onOpenAddQuestionForSlot?: (domainKey: DigitalCompetencyDomainKey, level: CognitiveLevel, subCode?: string) => void;
  onNavigateToFullMatrix?: () => void;
}

export const BtiCompetencyMatrixQuickPopup: React.FC<BtiCompetencyMatrixQuickPopupProps> = ({
  isOpen,
  onClose,
  questions,
  onOpenAddQuestionForSlot,
  onNavigateToFullMatrix
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'GRID' | 'GAPS' | '24_SUB'>('GRID');
  const [targetPerCell, setTargetPerCell] = useState<number>(3);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const domainKeys: DigitalCompetencyDomainKey[] = ['MIEN_1', 'MIEN_2', 'MIEN_3', 'MIEN_4', 'MIEN_5', 'MIEN_6'];
  const cognitiveLevels: CognitiveLevel[] = ['NHAN_BIET', 'THONG_HIEU', 'VAN_DUNG', 'VAN_DUNG_CAO'];

  const levelLabels: Record<CognitiveLevel, string> = {
    NHAN_BIET: 'Nhận Biết (B1-B2)',
    THONG_HIEU: 'Thông Hiểu (B3-B4)',
    VAN_DUNG: 'Vận Dụng (B5-B6)',
    VAN_DUNG_CAO: 'Vận Dụng Cao (B7-B8)'
  };

  const levelShorts: Record<CognitiveLevel, string> = {
    NHAN_BIET: 'NB',
    THONG_HIEU: 'TH',
    VAN_DUNG: 'VD',
    VAN_DUNG_CAO: 'VDC'
  };

  // Calculate Grid Stats
  const matrixStats = useMemo(() => {
    const grid: Record<DigitalCompetencyDomainKey, Record<CognitiveLevel, number>> = {
      MIEN_1: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_2: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_3: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_4: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_5: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
      MIEN_6: { NHAN_BIET: 0, THONG_HIEU: 0, VAN_DUNG: 0, VAN_DUNG_CAO: 0 },
    };

    questions.forEach(q => {
      const d = q.digital_competency_domain || 'MIEN_1';
      const l = q.cognitive_level || 'THONG_HIEU';
      if (grid[d] && grid[d][l] !== undefined) {
        grid[d][l]++;
      }
    });

    let emptyCount = 0;
    let metTargetCount = 0;
    const gapsList: Array<{
      domainKey: DigitalCompetencyDomainKey;
      domainCode: string;
      domainName: string;
      level: CognitiveLevel;
      count: number;
      needed: number;
    }> = [];

    domainKeys.forEach(dKey => {
      const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
      cognitiveLevels.forEach(lvl => {
        const cnt = grid[dKey][lvl];
        if (cnt === 0) emptyCount++;
        if (cnt >= targetPerCell) {
          metTargetCount++;
        } else {
          gapsList.push({
            domainKey: dKey,
            domainCode: dom.code,
            domainName: dom.name,
            level: lvl,
            count: cnt,
            needed: targetPerCell - cnt
          });
        }
      });
    });

    const totalCells = 24;
    const coverage = Math.round(((totalCells - emptyCount) / totalCells) * 100);

    return { grid, emptyCount, metTargetCount, gapsList, coverage };
  }, [questions, targetPerCell]);

  // Handle Quick Create Question for specific cell
  const handleQuickCreate = (dKey: DigitalCompetencyDomainKey, lvl: CognitiveLevel, subCode?: string) => {
    vibrateTap();
    soundFx.playClick();
    if (onOpenAddQuestionForSlot) {
      onOpenAddQuestionForSlot(dKey, lvl, subCode);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn font-mono">
      <div className="fluent-card w-full max-w-3xl bg-[#180933] border border-amber-400/50 rounded-[6px] shadow-2xl p-4 sm:p-5 text-slate-100 relative space-y-4 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-500/30 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-purple-600 rounded text-white shadow-md">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Tra Cứu Nhanh Ma Trận BTI 2026
                </h3>
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  TT 02/2025
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Tóm tắt độ phủ 6 Miền x 4 Mức độ nhận thức - Tra cứu vùng thiếu sót khi soạn đề
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#100421] p-2.5 rounded-[4px] border border-purple-500/30 text-xs shrink-0">
          <div>
            <span className="text-slate-400 text-[10.5px] block">Tổng số câu hỏi:</span>
            <strong className="text-amber-300 font-bold text-sm">{questions.length} câu</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10.5px] block">Độ phủ ma trận:</span>
            <strong className="text-emerald-300 font-bold text-sm">{matrixStats.coverage}%</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10.5px] block">Số ô đạt chỉ tiêu:</span>
            <strong className="text-sky-300 font-bold text-sm">{matrixStats.metTargetCount} / 24 ô</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10.5px] block">Vùng trắng (0 câu):</span>
            <strong className="text-rose-400 font-bold text-sm">{matrixStats.emptyCount} ô</strong>
          </div>
        </div>

        {/* Tab & Threshold Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0 border-b border-purple-500/20 pb-2">
          <div className="flex items-center gap-1 bg-[#100421] p-1 rounded border border-purple-500/30 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('GRID')}
              className={`px-3 py-1 rounded text-xs font-bold transition ${
                activeTab === 'GRID' ? 'bg-amber-500 text-purple-950 shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Ma Trận 6x4 Heatmap
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('GAPS')}
              className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 ${
                activeTab === 'GAPS' ? 'bg-amber-500 text-purple-950 shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>Vùng Cần Bổ Sung</span>
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/30 text-rose-200 text-[10px] font-mono">
                {matrixStats.gapsList.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Chỉ tiêu:</span>
            <select
              value={targetPerCell}
              onChange={(e) => setTargetPerCell(Number(e.target.value))}
              className="bg-[#100421] text-amber-300 border border-purple-500/40 rounded px-2 py-0.5 font-bold focus:outline-none text-xs"
            >
              <option value={1}>≥ 1 câu/ô</option>
              <option value={2}>≥ 2 câu/ô</option>
              <option value={3}>≥ 3 câu/ô</option>
              <option value={5}>≥ 5 câu/ô</option>
            </select>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-3 text-xs custom-scrollbar min-h-[220px]">
          {activeTab === 'GRID' && (
            <div className="space-y-2">
              <div className="overflow-x-auto border border-purple-500/30 rounded">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-[#100421] text-slate-300 border-b border-purple-500/30 text-[11px]">
                      <th className="p-2 text-left w-2/5">Miền Năng Lực</th>
                      {cognitiveLevels.map(lvl => (
                        <th key={lvl} className="p-2 w-1/8 font-mono">{levelShorts[lvl]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {domainKeys.map(dKey => {
                      const dom = DIGITAL_COMPETENCY_DOMAINS[dKey];
                      const row = matrixStats.grid[dKey];
                      return (
                        <tr key={dKey} className="border-b border-purple-500/20 hover:bg-purple-900/20 transition">
                          <td className="p-2 text-left font-sans text-slate-200">
                            <span className="font-bold font-mono text-amber-300 mr-1.5">{dom.code}</span>
                            <span className="text-[11.5px] truncate block sm:inline">{dom.name}</span>
                          </td>
                          {cognitiveLevels.map(lvl => {
                            const cnt = row[lvl];
                            const isZero = cnt === 0;
                            const isTargetMet = cnt >= targetPerCell;

                            return (
                              <td key={lvl} className="p-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleQuickCreate(dKey, lvl)}
                                  className={`w-full py-1.5 px-1 rounded font-mono font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer group ${
                                    isZero
                                      ? 'bg-rose-950/60 border border-rose-500/50 text-rose-300 hover:bg-rose-800/80'
                                      : isTargetMet
                                      ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-800/70'
                                      : 'bg-amber-950/50 border border-amber-500/40 text-amber-300 hover:bg-amber-800/70'
                                  }`}
                                  title={`Bấm để tạo ngay câu hỏi cho ${dom.name} - ${levelLabels[lvl]}`}
                                >
                                  <span>{cnt}</span>
                                  <PlusCircle className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-white" />
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 bg-[#100421] p-2 rounded border border-purple-500/20">
                <span className="flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bấm trực tiếp vào ô số câu để mở modal Soạn câu hỏi mới cho Miền & Mức độ tương ứng.</span>
                </span>
              </div>
            </div>
          )}

          {activeTab === 'GAPS' && (
            <div className="space-y-2">
              {matrixStats.gapsList.length === 0 ? (
                <div className="p-6 text-center bg-emerald-950/30 border border-emerald-500/40 rounded text-emerald-200 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="font-bold text-sm">Tất cả 24 ô ma trận đã đạt chỉ tiêu ({targetPerCell} câu/ô)!</p>
                  <p className="text-xs text-slate-300">Kho câu hỏi của bạn đã phủ kín Khung Năng Lực BTI 2026.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {matrixStats.gapsList.map((gap, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#100421] border border-rose-500/30 rounded flex items-center justify-between gap-3 hover:border-rose-400/60 transition"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.2 bg-rose-500/20 border border-rose-400/40 rounded text-rose-300 font-bold text-[10px]">
                            {gap.domainCode}
                          </span>
                          <strong className="text-amber-300 font-sans text-xs">{gap.domainName}</strong>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          Mức độ: <span className="text-sky-300 font-bold">{levelLabels[gap.level]}</span> | Hiện có: <span className="text-rose-400 font-bold">{gap.count} câu</span> (Cần bổ sung <span className="text-amber-300 font-bold">+{gap.needed} câu</span>)
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuickCreate(gap.domainKey, gap.level)}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded text-xs flex items-center gap-1 transition cursor-pointer shrink-0 shadow-sm"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                        <span>Soạn Đề Ngay</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-purple-500/30 pt-3 shrink-0">
          {onNavigateToFullMatrix ? (
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                onNavigateToFullMatrix();
                onClose();
              }}
              className="text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-1 underline transition cursor-pointer"
            >
              <span>Xem Bảng Ma Trận Đầy Đủ (Heatmap, Recharts, AI Mapping)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded text-xs transition cursor-pointer"
          >
            Đóng Tra Cứu
          </button>
        </div>

      </div>
    </div>
  );
};
