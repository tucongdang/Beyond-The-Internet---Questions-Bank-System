import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Copy,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  GitMerge,
  Search,
  Filter,
  RefreshCw,
  Zap,
  Sliders,
  ChevronRight,
  Info,
  ShieldAlert,
  ArrowRight,
  Eye,
  Check
} from 'lucide-react';
import { QuestionItem } from '../../types';
import { questionBankManager } from '../../services/questionBankManager';
import {
  scanForDuplicates,
  calculateQuestionSimilarity,
  mergeDuplicateQuestions,
  autoResolveExactDuplicates,
  DuplicatePair,
  DuplicateScanSummary
} from '../../services/duplicateDetectionService';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateError } from '../../utils/hapticUtils';

interface DuplicateCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions?: QuestionItem[];
}

type PairFilterTab = 'ALL' | 'EXACT' | 'HIGH';

export const DuplicateCheckerModal: React.FC<DuplicateCheckerModalProps> = ({
  isOpen,
  onClose,
  questions = []
}) => {
  const [threshold, setThreshold] = useState<number>(75);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<{ scanned: number; total: number; percent: number }>({
    scanned: 0,
    total: 0,
    percent: 0
  });

  const [pairs, setPairs] = useState<DuplicatePair[]>([]);
  const [summary, setSummary] = useState<DuplicateScanSummary | null>(null);
  const [activeTab, setActiveTab] = useState<PairFilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [toastNotification, setToastNotification] = useState<{
    type: 'success' | 'info' | 'warning';
    title: string;
    message: string;
  } | null>(null);

  const allQuestions = questions.length > 0 ? questions : questionBankManager.getQuestions();

  // Run initial scan when modal opens
  useEffect(() => {
    if (isOpen) {
      handleRunScan(threshold);
    }
  }, [isOpen]);

  const handleRunScan = (minThreshold: number = threshold) => {
    soundFx.playClick();
    vibrateTap();
    setIsScanning(true);
    setScanProgress({ scanned: 0, total: allQuestions.length, percent: 0 });

    setTimeout(() => {
      const result = scanForDuplicates(allQuestions, minThreshold);
      setSummary(result);
      setPairs(result.pairs);
      setIsScanning(false);
      soundFx.playCorrect();
      vibrateSuccess();
    }, 300);
  };

  // 1-Click Auto Delete Exact 100% Matches
  const handleAutoDeleteExact = () => {
    soundFx.playClick();
    vibrateTap();

    const exactPairs = pairs.filter(p => p.similarityScore === 100);
    if (exactPairs.length === 0) {
      setToastNotification({
        type: 'info',
        title: 'Không có câu trùng 100%',
        message: 'Không tìm thấy cặp câu trùng lặp tuyệt đối nào.'
      });
      setTimeout(() => setToastNotification(null), 3000);
      return;
    }

    const { deletedCount } = autoResolveExactDuplicates(pairs);

    // Refresh questions and rescanning
    handleRunScan(threshold);
    soundFx.playCorrect();
    vibrateSuccess();

    setToastNotification({
      type: 'success',
      title: 'Đã tự động xử lý trùng lặp!',
      message: `Đã xóa thành công ${deletedCount} câu trùng 100% khỏi ngân hàng đề.`
    });
    setTimeout(() => setToastNotification(null), 5000);
  };

  // Delete question B (Keep question A)
  const handleDeleteQuestionB = (pairId: string, qB: QuestionItem) => {
    soundFx.playClick();
    vibrateTap();

    questionBankManager.deleteQuestion(qB.id);
    setPairs(prev => prev.filter(p => p.id !== pairId));
    soundFx.playCorrect();
    vibrateSuccess();

    setToastNotification({
      type: 'success',
      title: 'Đã xóa câu trùng lặp!',
      message: `Đã xóa câu "${(qB.question_text || '').slice(0, 30)}..."`
    });
    setTimeout(() => setToastNotification(null), 3000);
  };

  // Merge Question B into Question A
  const handleMergeQuestions = (pairId: string, qA: QuestionItem, qB: QuestionItem) => {
    soundFx.playClick();
    vibrateTap();

    if (mergeDuplicateQuestions(qA, qB)) {
      setPairs(prev => prev.filter(p => p.id !== pairId));
      soundFx.playCorrect();
      vibrateSuccess();

      setToastNotification({
        type: 'success',
        title: 'Đã gộp câu thành công!',
        message: 'Đã tổng hợp thẻ tag và dữ liệu vào Câu A, dọn dẹp Câu B.'
      });
      setTimeout(() => setToastNotification(null), 3000);
    }
  };

  // Ignore pair
  const handleIgnorePair = (pairId: string) => {
    soundFx.playClick();
    vibrateTap();
    setPairs(prev => prev.filter(p => p.id !== pairId));
  };

  // Filtered pairs list
  const filteredPairs = useMemo(() => {
    let list = pairs;

    if (activeTab === 'EXACT') {
      list = list.filter(p => p.similarityScore === 100);
    } else if (activeTab === 'HIGH') {
      list = list.filter(p => p.similarityScore >= 80 && p.similarityScore < 100);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        (p.questionA.question_text || '').toLowerCase().includes(q) ||
        (p.questionB.question_text || '').toLowerCase().includes(q) ||
        (p.questionA.category || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [pairs, activeTab, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="fluent-modal w-full max-w-6xl max-h-[92vh] bg-[#120626] border border-rose-500/30 rounded-[4px] shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-500/20 bg-[#1B0838]/90 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-[4px] bg-rose-500/20 border border-rose-400/40 text-rose-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight font-mono uppercase">
                  Rà Soát & Xử Lý Câu Hỏi Trùng Lặp
                </h2>
                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-[4px] bg-rose-500/30 text-rose-200 border border-rose-400/40">
                  Duplicate Checker BTI 2026
                </span>
              </div>
              <p className="text-xs text-[#B6A6D8] mt-0.5">
                Phát hiện câu hỏi bị trùng nội dung hoặc tương đồng ngữ nghĩa. Giúp làm sạch và chuẩn hóa ngân hàng đề.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-[4px] hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notification Banner */}
        {toastNotification && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-[4px] bg-emerald-950/90 border border-emerald-500/50 text-emerald-100 flex items-center justify-between gap-3 shadow-xl animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold font-mono text-emerald-300">{toastNotification.title}</h4>
                <p className="text-[11.5px] text-emerald-100/90">{toastNotification.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="p-1 hover:bg-white/10 rounded text-emerald-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          
          {/* Controls & Scanner Card */}
          <div className="fluent-card p-4 rounded-[4px] border border-rose-500/30 bg-[#1A0735] space-y-3.5 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Threshold Slider */}
              <div className="space-y-1.5 flex-1 max-w-md">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-rose-400" />
                    <span>Ngưỡng nhạy tương đồng:</span>
                  </span>
                  <strong className="text-rose-300 font-bold text-sm">{threshold}%</strong>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>50% (Rộng)</span>
                  <span>75% (Khuyên dùng)</span>
                  <span>100% (Chính xác 100%)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleRunScan(threshold)}
                  disabled={isScanning}
                  className="fluent-btn-primary px-4 py-2.5 text-xs font-mono font-bold flex items-center gap-2 rounded-[4px] cursor-pointer shadow-lg bg-gradient-to-r from-rose-500 via-rose-600 to-purple-600 text-white hover:brightness-110 disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang quét trùng...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Quét Trùng Lặp ({threshold}%)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleAutoDeleteExact}
                  disabled={isScanning || !summary || summary.exactMatchesCount === 0}
                  className="fluent-btn-primary px-4 py-2.5 text-xs font-mono font-bold flex items-center gap-2 rounded-[4px] cursor-pointer shadow-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 disabled:opacity-40"
                  title="Xóa tự động tất cả câu bị trùng lặp 100%"
                >
                  <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>⚡ Tự Động Xóa 100% Trùng ({summary?.exactMatchesCount || 0})</span>
                </button>
              </div>
            </div>

            {/* Scanning Progress */}
            {isScanning && (
              <div className="space-y-1.5 pt-2 border-t border-rose-500/20">
                <div className="flex justify-between text-xs font-mono text-rose-200">
                  <span>Đang phân tích và so sánh từng câu hỏi...</span>
                  <span>{allQuestions.length} câu</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-rose-500/30">
                  <div className="h-full bg-gradient-to-r from-rose-500 to-amber-400 animate-pulse w-full" />
                </div>
              </div>
            )}
          </div>

          {/* Scan Results Summary Bar */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="fluent-card p-3 rounded-[4px] bg-[#1A0835] border border-purple-500/30 space-y-0.5">
                <span className="text-[10.5px] text-slate-400 font-mono block">Tổng câu đã quét</span>
                <strong className="text-lg font-bold text-white font-mono">{summary.totalScanned}</strong>
              </div>

              <div className="fluent-card p-3 rounded-[4px] bg-rose-950/40 border border-rose-500/30 space-y-0.5">
                <span className="text-[10.5px] text-rose-300 font-mono block">Cặp nghi vấn trùng</span>
                <strong className="text-lg font-bold text-rose-300 font-mono">{pairs.length}</strong>
              </div>

              <div className="fluent-card p-3 rounded-[4px] bg-amber-950/40 border border-amber-500/30 space-y-0.5">
                <span className="text-[10.5px] text-amber-300 font-mono block">Trùng tuyệt đối 100%</span>
                <strong className="text-lg font-bold text-amber-300 font-mono">{summary.exactMatchesCount}</strong>
              </div>

              <div className="fluent-card p-3 rounded-[4px] bg-purple-950/40 border border-purple-500/30 space-y-0.5">
                <span className="text-[10.5px] text-purple-300 font-mono block">Tương đồng cao (80-99%)</span>
                <strong className="text-lg font-bold text-purple-300 font-mono">{summary.highSimilarityCount}</strong>
              </div>
            </div>
          )}

          {/* Filter Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/20 pb-3">
            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-[4px] font-semibold transition cursor-pointer border ${
                  activeTab === 'ALL'
                    ? 'bg-rose-600/40 text-rose-200 border-rose-400/80'
                    : 'bg-[#180730] text-slate-400 border-purple-500/30 hover:text-white'
                }`}
              >
                Tất cả cặp ({pairs.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('EXACT')}
                className={`px-3 py-1.5 rounded-[4px] font-semibold transition cursor-pointer border ${
                  activeTab === 'EXACT'
                    ? 'bg-amber-600/40 text-amber-200 border-amber-400/80'
                    : 'bg-[#180730] text-slate-400 border-purple-500/30 hover:text-white'
                }`}
              >
                Trùng 100% ({pairs.filter(p => p.similarityScore === 100).length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('HIGH')}
                className={`px-3 py-1.5 rounded-[4px] font-semibold transition cursor-pointer border ${
                  activeTab === 'HIGH'
                    ? 'bg-purple-600/40 text-purple-200 border-purple-400/80'
                    : 'bg-[#180730] text-slate-400 border-purple-500/30 hover:text-white'
                }`}
              >
                Tương đồng cao ({pairs.filter(p => p.similarityScore >= 80 && p.similarityScore < 100).length})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm từ khóa trong cặp trùng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#140628] border border-rose-500/30 rounded-[4px] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>

          {/* Side-by-side Pairs Comparison List */}
          <div className="space-y-4">
            {filteredPairs.length === 0 ? (
              <div className="p-10 text-center bg-[#15062B] border border-dashed border-rose-500/30 rounded-[4px] space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400/60 mx-auto" />
                <h3 className="text-sm font-bold text-white font-mono">Không phát hiện câu trùng lặp!</h3>
                <p className="text-xs text-slate-400">
                  {pairs.length === 0 
                    ? `Toàn bộ ngân hàng câu hỏi đạt chuẩn phân biệt tốt với ngưỡng ${threshold}%.` 
                    : 'Không tìm thấy cặp câu trùng phù hợp từ khóa lọc.'}
                </p>
              </div>
            ) : (
              filteredPairs.map((pair) => (
                <div 
                  key={pair.id}
                  className="fluent-card p-4 rounded-[4px] bg-[#17062F] border border-rose-500/30 space-y-3 shadow-lg hover:border-rose-400/50 transition"
                >
                  {/* Pair Header Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-500/20 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-[3px] border ${
                        pair.similarityScore === 100 
                          ? 'bg-amber-500/25 text-amber-200 border-amber-400/50'
                          : pair.similarityScore >= 85 
                          ? 'bg-rose-500/25 text-rose-200 border-rose-400/50'
                          : 'bg-purple-500/25 text-purple-200 border-purple-400/50'
                      }`}>
                        ⚡ {pair.similarityScore}% TRÙNG LẶP
                      </span>
                      <span className="text-xs text-slate-300 italic">{pair.matchReason}</span>
                    </div>

                    {/* Pair Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMergeQuestions(pair.id, pair.questionA, pair.questionB)}
                        className="px-2.5 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/40 rounded-[4px] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title="Gộp thẻ tag & dữ liệu vào Câu A, dọn dẹp Câu B"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>Gộp 2 Câu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuestionB(pair.id, pair.questionB)}
                        className="px-2.5 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-400/40 rounded-[4px] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title="Xóa Câu B trùng lặp, giữ lại Câu A"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa Câu B</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleIgnorePair(pair.id)}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-[4px] text-xs font-mono transition cursor-pointer"
                        title="Bỏ qua cặp này"
                      >
                        Bỏ qua
                      </button>
                    </div>
                  </div>

                  {/* Matched Keywords chips */}
                  {pair.matchedPhrases.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-mono">
                      <span className="text-slate-400">Từ vựng trùng khớp:</span>
                      {pair.matchedPhrases.map((kw, i) => (
                        <span key={i} className="px-2 py-0.2 bg-rose-500/20 text-rose-200 border border-rose-400/30 rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Side-by-side Question Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    
                    {/* Left: Question A (Keeper) */}
                    <div className="p-3.5 rounded-[4px] bg-[#110424] border border-emerald-500/40 space-y-2">
                      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                        <span className="px-2 py-0.2 text-[10px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          CÂU A (CÂU GỐC)
                        </span>
                        <span className="text-[10.5px] text-slate-400 font-mono">ID: {pair.questionA.id}</span>
                      </div>

                      <p className="text-xs font-semibold text-white leading-relaxed">
                        {pair.questionA.question_text || 'Không có nội dung câu hỏi'}
                      </p>

                      <div className="text-[11px] text-slate-300 font-mono space-y-0.5">
                        <span className="text-purple-300 block">Thư mục: {pair.questionA.category || 'Chưa phân loại'}</span>
                        {pair.questionA.options && (
                          <div className="text-[10.5px] text-slate-400 line-clamp-2">
                            A: {pair.questionA.options.A} | B: {pair.questionA.options.B}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Question B (Duplicate Candidate) */}
                    <div className="p-3.5 rounded-[4px] bg-[#1F0727] border border-rose-500/40 space-y-2">
                      <div className="flex items-center justify-between border-b border-rose-500/20 pb-1.5">
                        <span className="px-2 py-0.2 text-[10px] font-mono font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          CÂU B (CÂU NGHĨ CỦA TRÙNG)
                        </span>
                        <span className="text-[10.5px] text-slate-400 font-mono">ID: {pair.questionB.id}</span>
                      </div>

                      <p className="text-xs font-semibold text-rose-100 leading-relaxed">
                        {pair.questionB.question_text || 'Không có nội dung câu hỏi'}
                      </p>

                      <div className="text-[11px] text-slate-300 font-mono space-y-0.5">
                        <span className="text-purple-300 block">Thư mục: {pair.questionB.category || 'Chưa phân loại'}</span>
                        {pair.questionB.options && (
                          <div className="text-[10.5px] text-slate-400 line-clamp-2">
                            A: {pair.questionB.options.A} | B: {pair.questionB.options.B}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-rose-500/20 bg-[#1B0838]/90 backdrop-blur-md flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono">
            Quét và lọc trùng lặp tự động theo thuật toán Jaccard + Character Shingles.
          </span>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              onClose();
            }}
            className="fluent-btn-primary px-5 py-2 text-xs font-mono font-bold rounded-[4px] cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
