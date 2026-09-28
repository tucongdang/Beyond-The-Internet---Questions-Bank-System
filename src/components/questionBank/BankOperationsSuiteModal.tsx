import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  GitBranch, 
  Layers, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  Download, 
  Upload, 
  X, 
  Lock, 
  Unlock, 
  Search, 
  Tag, 
  Sliders, 
  Award, 
  Flame, 
  Activity, 
  Compass, 
  ChevronRight, 
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { QuestionItem, CompetitionStage, VaultPartitionKey, QuestionLifecycleStatus } from '../../types';
import { questionBankManager } from '../../services/questionBankManager';
import { questionLifecycleService } from '../../services/questionLifecycleService';
import { bankGapAnalysisService } from '../../services/bankGapAnalysisService';
import { psychometricFlawService } from '../../services/psychometricFlawService';
import { isomorphicVariantService } from '../../services/isomorphicVariantService';
import { examSealService } from '../../services/examSealService';
import { wordExamService } from '../../services/wordExamService';
import { regulatoryLinterService } from '../../services/regulatoryLinterService';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateWarning } from '../../utils/hapticUtils';

export type BankOperationsTabKey = 
  | 'LIFECYCLE' 
  | 'GAP_ANALYSIS' 
  | 'PSYCHOMETRICS' 
  | 'VARIANTS' 
  | 'SEAL_VAULT' 
  | 'WORD_STUDIO' 
  | 'LINTER';

interface BankOperationsSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: BankOperationsTabKey;
  onQuestionsUpdated?: () => void;
}

export const BankOperationsSuiteModal: React.FC<BankOperationsSuiteModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'LIFECYCLE',
  onQuestionsUpdated
}) => {
  const [activeTab, setActiveTab] = useState<BankOperationsTabKey>(defaultTab);

  // General Questions state
  const [questions, setQuestions] = useState<QuestionItem[]>(() => questionBankManager.getQuestions());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const refreshData = () => {
    const qList = questionBankManager.getQuestions();
    setQuestions(qList);
    if (onQuestionsUpdated) onQuestionsUpdated();
  };

  // 1. LIFECYCLE & QUARANTINE STATE
  const vaultStats = useMemo(() => questionLifecycleService.getVaultStats(), [questions]);
  const quarantinedQuestions = useMemo(() => questionLifecycleService.getQuarantinedQuestions(), [questions]);
  const [quarantineStage, setQuarantineStage] = useState<CompetitionStage>('BAN_KET_1');
  const [quarantineMatchName, setQuarantineMatchName] = useState<string>('Trận Bán Kết 1 - BTI 2026');

  const handleQuarantineStage = () => {
    vibrateTap();
    soundFx.playClick();
    const stageQuestions = questions.filter(q => q.stage === quarantineStage);
    if (stageQuestions.length === 0) {
      alert(`Không tìm thấy câu hỏi nào thuộc giai đoạn ${quarantineStage} để cách ly.`);
      return;
    }
    const count = questionLifecycleService.quarantineQuestionsForMatch(
      stageQuestions.map(q => q.id),
      quarantineMatchName,
      quarantineStage
    );
    refreshData();
    soundFx.playCorrect();
    vibrateSuccess();
    setSuccessMsg(`Đã cách ly thành công ${count} câu hỏi của "${quarantineMatchName}" để chống lặp đề.`);
  };

  const handleReleaseAllQuarantine = () => {
    vibrateTap();
    soundFx.playPop();
    const ids = quarantinedQuestions.map(q => q.id);
    const count = questionLifecycleService.releaseQuarantine(ids);
    refreshData();
    soundFx.playCorrect();
    vibrateSuccess();
    setSuccessMsg(`Đã giải phóng cách ly cho ${count} câu hỏi để sẵn sàng cho mùa thi mới.`);
  };

  // 2. GAP ANALYSIS STATE
  const gapAnalysis = useMemo(() => bankGapAnalysisService.analyzeBank(questions), [questions]);
  const [selectedGapPrompt, setSelectedGapPrompt] = useState<string | null>(null);

  // 3. PSYCHOMETRICS & KEY BALANCE STATE
  const keyDistribution = useMemo(() => psychometricFlawService.analyzeKeyDistribution(questions), [questions]);
  const itemFlaws = useMemo(() => psychometricFlawService.scanBankForFlaws(questions), [questions]);

  // 4. ISOMORPHIC TWINS STATE
  const [selectedParentQId, setSelectedParentQId] = useState<string>(questions[0]?.id || '');
  const [twinQuestionText, setTwinQuestionText] = useState<string>('');
  const [twinCorrectKey, setTwinCorrectKey] = useState<string>('');
  const [twinExplanation, setTwinExplanation] = useState<string>('');
  const parentQuestion = useMemo(() => questions.find(q => q.id === selectedParentQId), [questions, selectedParentQId]);
  const existingTwins = useMemo(() => isomorphicVariantService.getVariantsForQuestion(selectedParentQId), [selectedParentQId, questions]);

  const handleCreateTwin = () => {
    if (!parentQuestion || !twinQuestionText.trim() || !twinCorrectKey.trim()) {
      alert('Vui lòng điền nội dung câu hỏi và đáp án cho biến thể song sinh.');
      return;
    }
    vibrateTap();
    soundFx.playClick();
    isomorphicVariantService.createIsomorphicVariant(parentQuestion, {
      question_text: twinQuestionText,
      correct_key: twinCorrectKey,
      explanation: twinExplanation
    });
    setTwinQuestionText('');
    setTwinCorrectKey('');
    setTwinExplanation('');
    refreshData();
    soundFx.playCorrect();
    vibrateSuccess();
    setSuccessMsg(`Đã tạo thành công câu hỏi song sinh dự phòng cho mã ${parentQuestion.id}.`);
  };

  // 5. SEAL VAULT STATE
  const [sealedPackages, setSealedPackages] = useState(() => examSealService.getAllSeals());
  const [sealName, setSealName] = useState<string>('Bộ Đề Bán Kết 1 (Chính Thức)');
  const [sealStage, setSealStage] = useState<CompetitionStage>('BAN_KET_1');
  const [sealNotes, setSealNotes] = useState<string>('Đề thi đã được hội đồng khảo thí duyệt 100%');
  const [verifyResult, setVerifyResult] = useState<{ id: string; msg: string; isValid: boolean } | null>(null);

  const handleCreateSeal = async () => {
    vibrateTap();
    soundFx.playClick();
    const stageQs = questions.filter(q => q.stage === sealStage);
    if (stageQs.length === 0) {
      alert(`Không có câu hỏi nào thuộc giai đoạn ${sealStage} để niêm phong.`);
      return;
    }
    const sealed = await examSealService.sealExamPackage(
      sealName,
      sealStage,
      stageQs,
      'Hội Đồng Khảo Thí BTI 2026',
      'Chủ Tịch Hội Đồng',
      sealNotes
    );
    setSealedPackages(examSealService.getAllSeals());
    refreshData();
    soundFx.playCorrect();
    vibrateSuccess();
    setSuccessMsg(`Đã niêm phong mật mã SHA-256 thành công cho ${stageQs.length} câu hỏi. Mã Checksum: ${sealed.sha256Checksum.substring(0, 16)}...`);
  };

  const handleVerifySeal = async (sealId: string) => {
    vibrateTap();
    soundFx.playClick();
    try {
      const res = await examSealService.verifySealIntegrity(sealId, 'Thư Ký Giám Sát');
      setVerifyResult({
        id: sealId,
        isValid: res.isValid,
        msg: res.notes
      });
      if (res.isValid) {
        soundFx.playCorrect();
        vibrateSuccess();
      } else {
        soundFx.playError();
        vibrateWarning();
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi đối soát mã băm');
    }
  };

  // 6. WORD STUDIO STATE
  const [wordInputText, setWordInputText] = useState<string>('');
  const [isExportingWord, setIsExportingWord] = useState<boolean>(false);

  const handleParseWordText = () => {
    if (!wordInputText.trim()) return;
    vibrateTap();
    soundFx.playClick();
    const { questions: parsed, warnings } = wordExamService.parseWordExamText(wordInputText);
    if (parsed.length > 0) {
      questionBankManager.batchImport(parsed);
      refreshData();
      soundFx.playCorrect();
      vibrateSuccess();
      setWordInputText('');
      setSuccessMsg(`Đã bóc tách và nhập khẩu thành công ${parsed.length} câu hỏi từ định dạng Word.`);
    } else {
      alert(warnings.join('\n') || 'Không tìm thấy câu hỏi hợp lệ.');
    }
  };

  const handleExportWord = (stage?: CompetitionStage) => {
    vibrateTap();
    soundFx.playClick();
    setIsExportingWord(true);
    try {
      const exportQs = stage ? questions.filter(q => q.stage === stage) : questions;
      const title = stage 
        ? `ĐỀ THI BTI 2026 - GIAI ĐOẠN ${stage}` 
        : 'NGÂN HÀNG CÂU HỎI KHẢO THÍ BTI 2026';
      wordExamService.exportExamToWord(exportQs, title, true);
      soundFx.playCorrect();
      vibrateSuccess();
    } catch (e: any) {
      console.error(e);
      alert('Lỗi xuất file Word');
    } finally {
      setIsExportingWord(false);
    }
  };

  // 7. REGULATORY LINTER STATE
  const linterIssues = useMemo(() => regulatoryLinterService.lintBank(questions), [questions]);
  const handleAutoFixAllTerminology = () => {
    vibrateTap();
    soundFx.playClick();
    const count = regulatoryLinterService.autoFixTerminology(questions.map(q => q.id));
    refreshData();
    soundFx.playCorrect();
    vibrateSuccess();
    setSuccessMsg(`Đã tự động chuẩn hóa thuật ngữ CNTT và cập nhật căn cứ pháp lý hiện hành cho ${count} câu hỏi.`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#120524] border border-purple-500/40 rounded-[8px] w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-100">
        
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-purple-500/30 bg-gradient-to-r from-purple-950/80 via-[#180730] to-[#0c182b] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-950/50">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">
                  Assessment Item Bank Operations Suite
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  BTI 2026 Core
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black font-mono text-white tracking-tight">
                Trung Tâm Nghiệp Vụ Khảo Thí & Sức Khỏe Ngân Hàng Câu Hỏi
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[4px] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Notification Banner */}
        {successMsg && (
          <div className="px-5 py-2.5 bg-emerald-950/50 border-b border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setSuccessMsg(null)}
              className="text-white/60 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 7 Functional Tabs Navigation */}
        <div className="flex border-b border-white/10 bg-black/40 overflow-x-auto gap-1 px-4 pt-1.5 scrollbar-thin">
          {[
            { id: 'LIFECYCLE', label: '1. Vòng Đời & Cách Ly', icon: Layers, badge: `${vaultStats.vaultCounts.ARCHIVED} Cách ly` },
            { id: 'GAP_ANALYSIS', label: '2. Khoảng Trống Ma Trận', icon: Compass, badge: `${gapAnalysis.healthScore}% Sức khỏe` },
            { id: 'PSYCHOMETRICS', label: '3. Thẩm Định & Lệch Đáp Án', icon: Activity, badge: `${itemFlaws.length} Lỗi` },
            { id: 'VARIANTS', label: '4. Biến Thể Song Sinh 1:1', icon: GitBranch, badge: 'Dự phòng' },
            { id: 'SEAL_VAULT', label: '5. Niêm Phong SHA-256', icon: Lock, badge: `${sealedPackages.length} Gói` },
            { id: 'WORD_STUDIO', label: '6. Soạn Thảo Word .docx', icon: FileText, badge: 'In ấn & Soi' },
            { id: 'LINTER', label: '7. Thuật Ngữ & Pháp Lý', icon: BookOpen, badge: `${linterIssues.length} Chuẩn hóa` },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setActiveTab(tab.id as BankOperationsTabKey);
                }}
                className={`px-3.5 py-2.5 text-xs font-mono font-bold flex items-center gap-2 border-b-2 -mb-px transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-purple-400 text-purple-200 bg-purple-950/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-purple-500/30 text-purple-200' : 'bg-black/40 text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: LIFECYCLE & MATCH QUARANTINE */}
          {activeTab === 'LIFECYCLE' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Vault Partition Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="fluent-card p-4 rounded-[6px] bg-[#16072d] border border-purple-500/30 space-y-1">
                  <span className="text-[10.5px] font-mono text-purple-300 uppercase">Kho Đề Thi Đấu</span>
                  <div className="text-2xl font-black font-mono text-white">{vaultStats.vaultCounts.OFFICIAL} câu</div>
                  <p className="text-[10px] text-slate-400">Sẵn sàng xuất trận đấu</p>
                </div>

                <div className="fluent-card p-4 rounded-[6px] bg-amber-950/20 border border-amber-500/30 space-y-1">
                  <span className="text-[10.5px] font-mono text-amber-300 uppercase">Kho Đề Dự Phòng</span>
                  <div className="text-2xl font-black font-mono text-amber-400">{vaultStats.vaultCounts.RESERVE} câu</div>
                  <p className="text-[10px] text-slate-400">Biến thể song sinh & tie-break</p>
                </div>

                <div className="fluent-card p-4 rounded-[6px] bg-sky-950/20 border border-sky-500/30 space-y-1">
                  <span className="text-[10.5px] font-mono text-sky-300 uppercase">Kho Đề Luyện Tập</span>
                  <div className="text-2xl font-black font-mono text-sky-400">{vaultStats.vaultCounts.PRACTICE} câu</div>
                  <p className="text-[10px] text-slate-400">Mở công khai cho thí sinh ôn</p>
                </div>

                <div className="fluent-card p-4 rounded-[6px] bg-rose-950/20 border border-rose-500/30 space-y-1">
                  <span className="text-[10.5px] font-mono text-rose-300 uppercase">Cách Ly / Đã Thi</span>
                  <div className="text-2xl font-black font-mono text-rose-400">{vaultStats.vaultCounts.ARCHIVED} câu</div>
                  <p className="text-[10px] text-slate-400">Khóa để chống lặp đề</p>
                </div>
              </div>

              {/* Quarantine Action Panel */}
              <div className="fluent-card p-5 rounded-[6px] bg-black/40 border border-purple-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      Cơ Chế Cách Ly Đề Thi Sau Trận Đấu (Anti-Leak Quarantine)
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Sau khi một trận đấu diễn ra, toàn bộ câu hỏi của trận đó sẽ được đưa vào diện cách ly để các trận sau không bị bốc trùng đề.
                    </p>
                  </div>

                  {quarantinedQuestions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleReleaseAllQuarantine}
                      className="px-3.5 py-1.5 rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 text-xs font-mono font-bold cursor-pointer transition flex items-center gap-1.5 shrink-0"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Giải Phóng Toàn Bộ Cách Ly</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-300 font-bold">Chọn Giai Đoạn Đã Thi:</label>
                    <select
                      value={quarantineStage}
                      onChange={e => setQuarantineStage(e.target.value as CompetitionStage)}
                      className="w-full bg-black/60 border border-white/20 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    >
                      <option value="BAN_KET_1">Bán Kết 1</option>
                      <option value="BAN_KET_2">Bán Kết 2</option>
                      <option value="BAN_KET_3">Bán Kết 3</option>
                      <option value="CHUNG_KET">Chung Kết</option>
                      <option value="VONG_LOAI">Vòng Loại</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-300 font-bold">Tên Trận Đấu Ghi Nhận:</label>
                    <input
                      type="text"
                      value={quarantineMatchName}
                      onChange={e => setQuarantineMatchName(e.target.value)}
                      placeholder="Ví dụ: Trận Bán Kết 1..."
                      className="w-full bg-black/60 border border-white/20 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleQuarantineStage}
                      className="w-full py-2 px-4 rounded bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Cách Ly Câu Hỏi Trận Này</span>
                    </button>
                  </div>
                </div>

                {/* Quarantined items list */}
                {quarantinedQuestions.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-mono text-slate-400 font-bold">
                      Danh sách {quarantinedQuestions.length} câu hỏi đang trong thời gian cách ly:
                    </span>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-black/50 border border-white/10 rounded">
                      {quarantinedQuestions.map(q => (
                        <div key={q.id} className="p-2 bg-white/[0.02] border border-white/5 rounded text-xs flex items-center justify-between gap-2">
                          <div className="truncate max-w-lg">
                            <strong className="text-rose-400 font-mono mr-2">[{q.id}]</strong>
                            <span className="text-slate-200">{q.question_text}</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800 shrink-0">
                            {q.quarantine_info?.matchName || 'Đã cách ly'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GAP ANALYSIS & AUTO-FILL */}
          {activeTab === 'GAP_ANALYSIS' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Health Score Banner */}
              <div className="fluent-card p-5 rounded-[6px] bg-gradient-to-r from-[#180730] to-[#0d182b] border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[11px] font-mono font-bold">
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                    <span>Chỉ Số Sức Khỏe Ngân Hàng Khảo Thí</span>
                  </div>
                  <h3 className="text-base font-bold text-white font-mono">
                    Độ Sẵn Sàng Tổ Chức Mùa Giải BTI 2026
                  </h3>
                  <p className="text-xs text-slate-300">
                    Đánh giá độ phủ ma trận 6 Miền năng lực số (Thông tư 02/2025/TT-BGDĐT), 4 cấp độ tư duy và cơ cấu 5 vòng thi.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="px-4 py-2.5 rounded-[6px] bg-black/50 border border-purple-500/30 text-center font-mono">
                    <span className="text-[10px] text-slate-400 block uppercase">Hệ Số An Toàn</span>
                    <strong className="text-xl font-black text-sky-400">{gapAnalysis.safetyRatio}x</strong>
                    <span className="text-[9.5px] text-slate-400 block">chuẩn 1:4</span>
                  </div>
                  <div className="px-4 py-2.5 rounded-[6px] bg-emerald-950/40 border border-emerald-500/40 text-center font-mono">
                    <span className="text-[10px] text-emerald-300 block uppercase">Chỉ Số Sức Khỏe</span>
                    <strong className="text-xl font-black text-emerald-400">{gapAnalysis.healthScore}%</strong>
                    <span className="text-[9.5px] text-emerald-300/70 block">Hoàn thiện</span>
                  </div>
                </div>
              </div>

              {/* 6 Domains Coverage Grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  Độ Phủ 6 Miền Năng Lực Số (Thông Tư 02/2025/TT-BGDĐT):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(gapAnalysis.domainCoverage).map(([dKey, item]) => (
                    <div key={dKey} className="fluent-card p-3 rounded-[4px] bg-black/40 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <strong className="text-purple-300">{dKey}</strong>
                        <span className="text-white font-bold">{item.count} / {item.required} câu</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            item.healthPct >= 100 ? 'bg-emerald-400' : (item.healthPct >= 60 ? 'bg-sky-400' : 'bg-amber-400')
                          }`} 
                          style={{ width: `${item.healthPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Đạt {item.healthPct}%</span>
                        <span className={item.gap > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {item.gap > 0 ? `Thiếu ${item.gap} câu` : '✓ Đủ chỉ tiêu'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Critical Missing Gaps & AI Prompt Template */}
              <div className="fluent-card p-4 rounded-[6px] bg-black/40 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Khoảng Trống Cần Ưu Tiên Bổ Sung ({gapAnalysis.criticalGaps.length} vị trí)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">1-Click AI Auto-Fill</span>
                </div>

                <div className="space-y-2">
                  {gapAnalysis.criticalGaps.slice(0, 5).map((gap, idx) => (
                    <div key={idx} className="p-3 bg-white/[0.02] border border-white/10 rounded-[4px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                            gap.priority === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {gap.priority}
                          </span>
                          <strong className="text-white font-mono">{gap.category}</strong>
                        </div>
                        <p className="text-slate-300">{gap.description}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setSelectedGapPrompt(bankGapAnalysisService.generateAutoFillPrompt(gap));
                        }}
                        className="px-3 py-1.5 rounded bg-purple-600/40 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-mono font-bold cursor-pointer transition shrink-0 flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Xem Prompt AI Viết Bù</span>
                      </button>
                    </div>
                  ))}
                </div>

                {selectedGapPrompt && (
                  <div className="p-3 bg-black/70 border border-purple-500/40 rounded space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between text-purple-300 font-bold">
                      <span>Prompt AI Tạo Câu Hỏi Bù Đắp Khoảng Trống:</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          navigator.clipboard.writeText(selectedGapPrompt);
                          soundFx.playCorrect();
                          vibrateSuccess();
                          setSuccessMsg('Đã sao chép prompt AI vào bộ nhớ tạm.');
                        }}
                        className="text-sky-400 hover:text-sky-300 underline cursor-pointer"
                      >
                        Sao chép Prompt
                      </button>
                    </div>
                    <pre className="text-slate-300 text-[11px] whitespace-pre-wrap bg-white/5 p-2 rounded">
                      {selectedGapPrompt}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PSYCHOMETRICS & KEY BALANCING */}
          {activeTab === 'PSYCHOMETRICS' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Key Distribution Meter */}
              <div className="fluent-card p-5 rounded-[6px] bg-black/40 border border-purple-500/30 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div>
                    <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-sky-400" />
                      Phân Bổ Vị Trí Khóa Đáp Án (A, B, C, D Key Balance)
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Kiểm tra sự cân bằng giữa các phương án đúng trắc nghiệm để tránh thí sinh bắt bài đoán mò.
                    </p>
                  </div>
                  <span className={`text-xs font-mono px-2.5 py-1 rounded font-bold ${
                    keyDistribution.isBalanced ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {keyDistribution.isBalanced ? '✓ Phân bổ chuẩn cân đối' : '⚠️ Có cảnh báo lệch'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(keyDistribution.distribution).map(([key, item]) => (
                    <div key={key} className="p-3 bg-white/[0.02] border border-white/10 rounded text-center space-y-1">
                      <div className="text-sm font-mono font-bold text-sky-300">Khóa {key}</div>
                      <div className="text-2xl font-black font-mono text-white">{item.percentage}%</div>
                      <div className="text-[11px] font-mono text-slate-400">{item.count} câu</div>
                    </div>
                  ))}
                </div>

                {keyDistribution.warnings.length > 0 && (
                  <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded space-y-1 text-xs text-amber-200 font-mono">
                    {keyDistribution.warnings.map((w, idx) => (
                      <div key={idx}>• {w}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Item Flaws Review */}
              <div className="fluent-card p-5 rounded-[6px] bg-black/40 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Phát Hiện Lỗi Soạn Đề Khảo Thí ({itemFlaws.length} phát hiện)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Classical Test Theory (CTT)</span>
                </div>

                {itemFlaws.length === 0 ? (
                  <div className="text-center py-6 text-emerald-400 font-mono text-xs">
                    ✓ Hoàn hảo: Không phát hiện lỗi thiên vị độ dài hay phương án nhiễu chết nào trong ngân hàng.
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {itemFlaws.slice(0, 10).map((flaw, idx) => (
                      <div key={idx} className="p-3 bg-white/[0.02] border border-white/10 rounded space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <strong className="text-amber-300 font-mono">[{flaw.flawType}] Mã câu: {flaw.questionId}</strong>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                            {flaw.severity}
                          </span>
                        </div>
                        <p className="text-slate-300">{flaw.details}</p>
                        {flaw.suggestedFix && (
                          <div className="text-[11px] text-sky-300/90 font-mono">
                            💡 Khuyến nghị: {flaw.suggestedFix}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ISOMORPHIC TWIN VARIANTS */}
          {activeTab === 'VARIANTS' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="fluent-card p-5 rounded-[6px] bg-black/40 border border-purple-500/30 space-y-4">
                <div className="pb-2 border-b border-white/10">
                  <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-purple-400" />
                    Tạo Biến Thể Song Sinh 1:1 Làm Câu Hỏi Dự Phòng Khẩn Cấp
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Câu hỏi song sinh giữ nguyên 100% chuẩn năng lực số và mức độ tư duy nhưng thay đổi thông số hoặc ngữ cảnh kỹ thuật.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Parent Question */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-slate-300 font-bold">Chọn Câu Hỏi Gốc:</label>
                      <select
                        value={selectedParentQId}
                        onChange={e => setSelectedParentQId(e.target.value)}
                        className="w-full bg-black/60 border border-white/20 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none"
                      >
                        {questions.slice(0, 50).map(q => (
                          <option key={q.id} value={q.id}>
                            [{q.id}] {q.question_text.substring(0, 45)}...
                          </option>
                        ))}
                      </select>
                    </div>

                    {parentQuestion && (
                      <div className="p-3 bg-white/[0.02] border border-white/10 rounded space-y-1.5 text-xs">
                        <div className="text-purple-300 font-bold font-mono">Nội dung câu gốc:</div>
                        <p className="text-white">{parentQuestion.question_text}</p>
                        <div className="text-emerald-400 font-mono font-bold">Đáp án: {parentQuestion.correct_key}</div>
                        <div className="text-slate-400 text-[10px] font-mono">
                          Vòng: {parentQuestion.round_name} | {parentQuestion.points || 10}đ | {parentQuestion.time_limit}s
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Create New Twin Form */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-slate-300 font-bold">Nội Dung Biến Thể Song Sinh 1:1:</label>
                      <textarea
                        value={twinQuestionText}
                        onChange={e => setTwinQuestionText(e.target.value)}
                        rows={3}
                        placeholder="Nhập nội dung câu hỏi dự phòng tương đương..."
                        className="w-full bg-black/60 border border-white/20 rounded p-2.5 text-xs font-mono text-white placeholder-white/30 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-mono text-slate-300 font-bold">Đáp Án Chuẩn:</label>
                        <input
                          type="text"
                          value={twinCorrectKey}
                          onChange={e => setTwinCorrectKey(e.target.value)}
                          placeholder="Đáp án..."
                          className="w-full bg-black/60 border border-white/20 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-mono text-slate-300 font-bold">Giải Thích / Chú Thích:</label>
                        <input
                          type="text"
                          value={twinExplanation}
                          onChange={e => setTwinExplanation(e.target.value)}
                          placeholder="Lời giải..."
                          className="w-full bg-black/60 border border-white/20 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateTwin}
                      className="w-full py-2.5 px-4 rounded bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition shadow-md shadow-purple-950/50"
                    >
                      <GitBranch className="w-4 h-4" />
                      <span>Lưu Biến Thể Vào Kho Dự Phòng</span>
                    </button>
                  </div>
                </div>

                {/* Sibling variants list */}
                {existingTwins.length > 1 && (
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <span className="text-xs font-mono text-purple-300 font-bold">
                      Các biến thể liên kết cùng mã câu ({existingTwins.length} câu):
                    </span>
                    <div className="space-y-1.5">
                      {existingTwins.map(twin => (
                        <div key={twin.id} className="p-2 bg-white/[0.02] border border-white/5 rounded text-xs flex items-center justify-between gap-2">
                          <div>
                            <span className="font-mono text-purple-400 font-bold mr-2">[{twin.id}]</span>
                            <span className="text-slate-200">{twin.question_text}</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 shrink-0">
                            {twin.id === selectedParentQId ? 'Câu gốc' : 'Song sinh 1:1'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: CRYPTOGRAPHIC EXAM SEAL VAULT */}
          {activeTab === 'SEAL_VAULT' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="fluent-card p-5 rounded-[6px] bg-black/40 border border-purple-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      Niêm Phong Mật Mã SHA-256 Chống Lộ / Sửa Đổi Đề Thi
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Đề thi được khóa đóng băng toàn vẹn (Tamper-proof Seal) kèm mã băm SHA-256 để đối soát trước giờ mở máy chủ trận đấu.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-300 font-bold">Tên Gói Niêm Phong:</label>
                    <input
                      type="text"
                      value={sealName}
                      onChange={e => setSealName(e.target.value)}
                      className="w-full bg-black/60 border border-white/20 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-300 font-bold">Giai Đoạn Trận Đấu:</label>
                    <select
                      value={sealStage}
                      onChange={e => setSealStage(e.target.value as CompetitionStage)}
                      className="w-full bg-black/60 border border-white/20 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    >
                      <option value="BAN_KET_1">Bán Kết 1</option>
                      <option value="BAN_KET_2">Bán Kết 2</option>
                      <option value="BAN_KET_3">Bán Kết 3</option>
                      <option value="CHUNG_KET">Chung Kết</option>
                      <option value="VONG_LOAI">Vòng Loại</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleCreateSeal}
                      className="w-full py-2 px-4 rounded bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Niêm Phong Gói Đề Ngay</span>
                    </button>
                  </div>
                </div>

                {/* Sealed packages list */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-mono text-slate-300 font-bold">
                    Các gói đề thi đã được niêm phong mật mã:
                  </span>
                  {sealedPackages.length === 0 ? (
                    <div className="p-4 bg-white/[0.02] border border-dashed border-white/15 rounded text-center text-xs text-slate-400 font-mono">
                      Chưa có gói đề thi nào được niêm phong mật mã.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {sealedPackages.map(pkg => (
                        <div key={pkg.id} className="p-3.5 bg-black/60 border border-emerald-500/30 rounded space-y-2 text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {pkg.stage}
                              </span>
                              <strong className="text-white font-mono text-sm">{pkg.name}</strong>
                              <span className="text-slate-400 text-[11px]">({pkg.questionCount} câu hỏi)</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleVerifySeal(pkg.id)}
                              className="px-3 py-1 bg-sky-600/30 hover:bg-sky-600 text-sky-200 hover:text-white border border-sky-500/40 rounded text-xs font-mono font-bold cursor-pointer transition shrink-0"
                            >
                              Kiểm Tra Toàn Vẹn Mã Băm
                            </button>
                          </div>

                          <div className="p-2 bg-black/40 rounded border border-white/10 font-mono text-[11px] text-slate-300 space-y-1">
                            <div><strong className="text-emerald-400">SHA-256 Checksum:</strong> <code className="text-amber-300">{pkg.sha256Checksum}</code></div>
                            <div className="text-[10px] text-slate-400">
                              Niêm phong bởi: <strong className="text-white">{pkg.sealedBy}</strong> vào ngày {new Date(pkg.sealedAt).toLocaleString('vi-VN')}
                            </div>
                          </div>

                          {verifyResult && verifyResult.id === pkg.id && (
                            <div className={`p-2.5 rounded font-mono text-xs border ${
                              verifyResult.isValid ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40' : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
                            }`}>
                              {verifyResult.msg}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: WORD EXAM STUDIO (.docx) */}
          {activeTab === 'WORD_STUDIO' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Parse Word exam text */}
                <div className="fluent-card p-5 rounded-[6px] bg-black/40 border border-purple-500/30 space-y-3.5">
                  <div className="pb-2 border-b border-white/10">
                    <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                      <Upload className="w-4 h-4 text-purple-400" />
                      Bóc Tách Đề Thi Soạn Bằng Word
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Sao chép và dán đề thi từ file Microsoft Word (.docx) của giáo viên vào đây.
                    </p>
                  </div>

                  <textarea
                    value={wordInputText}
                    onChange={e => setWordInputText(e.target.value)}
                    rows={8}
                    placeholder="Ví dụ:&#10;Câu 1: Khung năng lực số cho người học ban hành kèm Thông tư 02/2025/TT-BGDĐT gồm bao nhiêu miền?&#10;A. 4 miền&#10;B. 5 miền&#10;*C. 6 miền&#10;D. 8 miền&#10;Đáp án: C&#10;Lời giải: Theo Điều 1 Thông tư 02/2025/TT-BGDĐT..."
                    className="w-full bg-black/60 border border-white/20 rounded p-3 text-xs font-mono text-white placeholder-white/30 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={handleParseWordText}
                    disabled={!wordInputText.trim()}
                    className="w-full py-2.5 px-4 rounded bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50 shadow-md"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Bóc Tách & Nạp Vào Ngân Hàng</span>
                  </button>
                </div>

                {/* Right: Export Word Official Paper */}
                <div className="fluent-card p-5 rounded-[6px] bg-black/40 border border-purple-500/30 space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="pb-2 border-b border-white/10">
                      <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                        <Download className="w-4 h-4 text-emerald-400" />
                        Xuất Đề Thi Ra File Word (.doc) Chuẩn Bộ GD&ĐT
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Tệp Word xuất ra gồm: Quốc hiệu, Bộ GD&ĐT, Bảng thông tin thí sinh, đề thi căn lề chuẩn và Phiếu Soi Đáp Án & Ma Trận Khảo Thí trên trang riêng.
                      </p>
                    </div>

                    <div className="p-3 bg-white/[0.02] border border-white/10 rounded font-mono text-xs text-slate-300 space-y-1.5">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Định dạng tương thích Microsoft Word 100%</span>
                      </div>
                      <div>• Bảng thông tin thí sinh & khung số báo danh chuẩn</div>
                      <div>• Tự động ngắt trang (Page Break) sang bảng đáp án cho giám khảo</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => handleExportWord()}
                      disabled={isExportingWord}
                      className="w-full py-3 px-4 rounded bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isExportingWord ? 'Đang Xuất Word...' : 'Tải File Word (.doc) Toàn Ngân Hàng'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportWord('BAN_KET_1')}
                      className="w-full py-2 px-3 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold cursor-pointer transition"
                    >
                      Xuất File Word Riêng Trận Bán Kết 1
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: REGULATORY & TERMINOLOGY LINTER */}
          {activeTab === 'LINTER' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="fluent-card p-5 rounded-[6px] bg-black/40 border border-purple-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-sky-400" />
                      Thẩm Tra Thuật Ngữ CNTT & Căn Cứ Pháp Lý Hết Hiệu Lực
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Tự động quét phát hiện các câu hỏi trích dẫn luật cũ (như Luật Giao dịch điện tử 2005) hoặc viết sai chuẩn thuật ngữ CNTT quốc tế.
                    </p>
                  </div>

                  {linterIssues.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAutoFixAllTerminology}
                      className="px-4 py-2 rounded bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg transition shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>1-Click Tự Động Chuẩn Hóa Toàn Bộ</span>
                    </button>
                  )}
                </div>

                {linterIssues.length === 0 ? (
                  <div className="text-center py-8 text-emerald-400 font-mono text-xs space-y-2">
                    <CheckCircle2 className="w-8 h-8 mx-auto" />
                    <div>✓ Tuyệt vời: Toàn bộ câu hỏi trong ngân hàng đều chuẩn hóa thuật ngữ và bám sát căn cứ pháp lý hiện hành!</div>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-2.5">
                    {linterIssues.map((issue, idx) => (
                      <div key={idx} className="p-3 bg-white/[0.02] border border-white/10 rounded space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <strong className="text-amber-300 font-mono">
                            Mã câu: {issue.questionId} — {issue.flawType === 'DEPRECATED_LEGAL' ? '📜 Văn bản hết hiệu lực' : '🔤 Thuật ngữ CNTT'}
                          </strong>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            issue.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-sky-950 text-sky-300 border border-sky-800'
                          }`}>
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-slate-200">{issue.details}</p>
                        {issue.suggestedFix && (
                          <div className="text-[11px] text-emerald-300/90 font-mono bg-emerald-950/20 p-2 rounded border border-emerald-500/20">
                            ✓ Đề xuất tự động cập nhật: {issue.suggestedFix}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Bar */}
        <div className="px-5 py-3 border-t border-purple-500/30 bg-black/60 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            Hệ thống ngân hàng khảo thí chuẩn: <strong className="text-white">{questions.length} câu hỏi</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer transition"
          >
            Đóng Trung Tâm Nghiệp Vụ
          </button>
        </div>

      </div>
    </div>
  );
};
