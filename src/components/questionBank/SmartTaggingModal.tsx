import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Sparkles, 
  Tag, 
  Check, 
  Plus, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  BookOpen, 
  ShieldCheck, 
  Scale, 
  Layers, 
  CheckCircle2, 
  TrendingUp, 
  BarChart2, 
  Copy, 
  Download, 
  FileText, 
  Cpu, 
  Share2, 
  ArrowRight,
  Info,
  Sliders,
  Flame,
  Search
} from 'lucide-react';
import { QuestionItem, DigitalCompetencyDomainKey, CognitiveLevel } from '../../types';
import { smartTaggingService, SmartTagItem, SmartTaggingAnalysis, BatchSmartTagResult } from '../../services/smartTaggingService';
import { questionBankManager } from '../../services/questionBankManager';
import { DIGITAL_COMPETENCY_DOMAINS, COGNITIVE_LEVELS } from '../../data/digitalCompetencyData';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface SmartTaggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetQuestion?: QuestionItem | null;
  selectedQuestions?: QuestionItem[];
  allQuestions?: QuestionItem[];
  onShowToast?: (title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onQuestionUpdated?: (updatedQuestion: QuestionItem) => void;
}

export const SmartTaggingModal: React.FC<SmartTaggingModalProps> = ({
  isOpen,
  onClose,
  targetQuestion,
  selectedQuestions = [],
  allQuestions = [],
  onShowToast,
  onQuestionUpdated
}) => {
  useLockBodyScroll(isOpen);

  const bankQuestions = useMemo(() => {
    return allQuestions.length > 0 ? allQuestions : questionBankManager.getQuestions();
  }, [allQuestions]);

  // Mode: 'SINGLE' | 'BATCH' | 'TAXONOMY'
  const [activeTab, setActiveTab] = useState<'SINGLE' | 'BATCH' | 'TAXONOMY'>('SINGLE');
  
  // Single mode state
  const questionPool = useMemo(() => {
    if (selectedQuestions.length > 0) return selectedQuestions;
    if (targetQuestion) return [targetQuestion];
    return bankQuestions;
  }, [selectedQuestions, targetQuestion, bankQuestions]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const activeQuestion = questionPool[currentIndex] || targetQuestion || bankQuestions[0];

  // Analysis State
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<SmartTaggingAnalysis | null>(null);
  const [agentName, setAgentName] = useState<string>('antigravity-preview-09-2026');
  
  // Tag Selection in Single Mode
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [syncDomain, setSyncDomain] = useState<boolean>(true);
  const [syncCognitiveLevel, setSyncCognitiveLevel] = useState<boolean>(true);
  const [syncLegalRef, setSyncLegalRef] = useState<boolean>(true);

  // Batch Mode State
  const [batchLoading, setBatchLoading] = useState<boolean>(false);
  const [batchResults, setBatchResults] = useState<BatchSmartTagResult[]>([]);
  const [batchSelectedIds, setBatchSelectedIds] = useState<Set<string>>(new Set());
  const [batchSyncDomain, setBatchSyncDomain] = useState<boolean>(true);

  // Taxonomy Search
  const [taxonomySearch, setTaxonomySearch] = useState<string>('');

  // Initial load when modal opens or active question changes
  useEffect(() => {
    if (!isOpen) return;
    if (selectedQuestions.length > 1) {
      setActiveTab('BATCH');
      handleRunBatchAnalysis(selectedQuestions);
    } else {
      setActiveTab('SINGLE');
      if (targetQuestion) {
        const idx = questionPool.findIndex(q => q.id === targetQuestion.id);
        if (idx >= 0) setCurrentIndex(idx);
      }
    }
  }, [isOpen, targetQuestion, selectedQuestions]);

  // Trigger analysis for active question in SINGLE mode
  useEffect(() => {
    if (!isOpen || activeTab !== 'SINGLE' || !activeQuestion) return;
    runSingleAnalysis(activeQuestion);
  }, [isOpen, activeTab, activeQuestion?.id]);

  const runSingleAnalysis = async (q: QuestionItem, force = false) => {
    setLoading(true);
    try {
      const res = await smartTaggingService.analyzeQuestion(q, bankQuestions, force);
      if (res.success && res.analysis) {
        setAnalysis(res.analysis);
        setAgentName(res.agentUsed);

        // Pre-select high confidence tags (> 75%) and existing tags
        const initialSelected = new Set<string>();
        (q.tags || []).forEach(t => initialSelected.add(t.trim().toLowerCase().replace(/^#/, '')));
        res.analysis.suggestedTags.forEach(st => {
          if (st.confidence >= 75) {
            initialSelected.add(st.tag.trim().toLowerCase().replace(/^#/, ''));
          }
        });
        setSelectedTags(initialSelected);
      }
    } catch (err: any) {
      console.error('Smart tagging analysis error:', err);
      onShowToast?.('Lỗi phân tích', 'Không thể hoàn tất phân tích với Agent Antigravity.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRunBatchAnalysis = async (targets: QuestionItem[]) => {
    setBatchLoading(true);
    try {
      const results = await smartTaggingService.batchAnalyzeQuestions(targets, bankQuestions);
      setBatchResults(results);
      setBatchSelectedIds(new Set(results.map(r => r.id)));
      onShowToast?.('Hoàn tất phân tích hàng loạt', `Đã phân tích và đề xuất thẻ tri thức cho ${results.length} câu hỏi.`, 'success');
    } catch (err: any) {
      console.error('Batch analysis error:', err);
      onShowToast?.('Lỗi phân tích hàng loạt', 'Không thể phân tích hàng loạt với Agent Antigravity.', 'error');
    } finally {
      setBatchLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    vibrateTap();
    soundFx.playClick();
    const clean = tag.trim().toLowerCase().replace(/^#/, '');
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(clean)) {
        next.delete(clean);
      } else {
        next.add(clean);
      }
      return next;
    });
  };

  const handleAddCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customTagInput.trim().toLowerCase().replace(/^#/, '');
    if (!clean) return;

    vibrateTap();
    soundFx.playSuccess();
    setSelectedTags(prev => new Set(prev).add(clean));
    setCustomTagInput('');
    onShowToast?.('Đã thêm thẻ', `Đã thêm thẻ #${clean}`, 'info');
  };

  const handleApplySingle = () => {
    if (!activeQuestion) return;

    vibrateTap();
    vibrateSuccess();
    soundFx.playSuccess();

    const tagList = Array.from(selectedTags);
    const updates: any = {};

    if (syncDomain && analysis?.primaryKnowledgeArea) {
      updates.domain = analysis.primaryKnowledgeArea.domainKey;
      updates.subCompetency = analysis.primaryKnowledgeArea.subCompetencyCode;
    }
    if (syncCognitiveLevel && analysis?.suggestedCognitiveLevel) {
      updates.cognitiveLevel = analysis.suggestedCognitiveLevel.level;
    }
    if (syncLegalRef && analysis?.suggestedLegalReference) {
      updates.legalReference = analysis.suggestedLegalReference.reference;
    }

    smartTaggingService.applyTagsToQuestion(activeQuestion.id, tagList, updates);
    const updated = questionBankManager.getQuestionById(activeQuestion.id);

    if (updated && onQuestionUpdated) {
      onQuestionUpdated(updated);
    }

    onShowToast?.(
      'Gắn thẻ thành công',
      `Đã cập nhật ${tagList.length} thẻ tri thức cho câu hỏi [${activeQuestion.id}].`,
      'success'
    );

    // Auto-advance to next question if pool has more
    if (currentIndex < questionPool.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleApplyBatch = () => {
    if (batchResults.length === 0) return;

    vibrateTap();
    vibrateSuccess();
    soundFx.playSuccess();

    let count = 0;
    batchResults.forEach(item => {
      if (!batchSelectedIds.has(item.id)) return;
      const tags = item.suggestedTags.map(t => t.tag);
      const updates: any = {};
      if (batchSyncDomain && item.suggestedDomain) {
        updates.domain = item.suggestedDomain;
        updates.subCompetency = item.suggestedSubCompetency;
      }
      if (item.suggestedCognitiveLevel) {
        updates.cognitiveLevel = item.suggestedCognitiveLevel;
      }
      if (item.suggestedLegalReference) {
        updates.legalReference = item.suggestedLegalReference;
      }

      smartTaggingService.applyTagsToQuestion(item.id, tags, updates);
      count++;
    });

    onShowToast?.(
      'Gắn thẻ hàng loạt thành công',
      `Đã cập nhật thẻ tri thức và chuẩn hóa năng lực cho ${count} câu hỏi đã chọn.`,
      'success'
    );
    onClose();
  };

  const bankTaxonomy = useMemo(() => {
    return smartTaggingService.getBankTagTaxonomy(bankQuestions);
  }, [bankQuestions, isOpen]);

  const filteredTaxonomy = useMemo(() => {
    if (!taxonomySearch.trim()) return bankTaxonomy.topTags;
    const term = taxonomySearch.toLowerCase();
    return bankTaxonomy.topTags.filter(t => t.tag.toLowerCase().includes(term));
  }, [bankTaxonomy, taxonomySearch]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn overflow-hidden modal-backdrop-isolated select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Smart Tagging System"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading && !batchLoading) {
          onClose();
          vibrateTap();
          soundFx.playClick();
        }
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl h-[92vh] max-h-[940px] flex flex-col bg-[#140827]/98 fluent-acrylic-surface border border-purple-500/40 rounded-[8px] shadow-[0_24px_64px_rgba(0,0,0,0.85)] overflow-hidden text-slate-100 font-sans"
      >
        
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-purple-500/30 bg-gradient-to-r from-[#21094E] via-[#2A105B] to-[#170836] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-amber-400/20 to-purple-600/30 border border-amber-400/40 text-amber-300 shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  Smart Tagging & Knowledge Area Analyzer
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  Agent Antigravity
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-200 border border-purple-500/30">
                  TT 02/2025 • DigComp 2.2
                </span>
              </div>
              <p className="text-xs text-purple-200/70 truncate">
                Tự động khai phá tri thức, đối soát mẫu hình ngân hàng đề và chuẩn hóa ma trận phân loại câu hỏi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="px-5 py-2 border-b border-purple-500/20 bg-[#180933]/90 flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                setActiveTab('SINGLE');
              }}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'SINGLE'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
                  : 'text-purple-200/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Phân Tích Chi Tiết</span>
              {questionPool.length > 1 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-purple-900/60 text-purple-300">
                  {currentIndex + 1}/{questionPool.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                vibrateTap();
                setActiveTab('BATCH');
                if (batchResults.length === 0) {
                  handleRunBatchAnalysis(selectedQuestions.length > 0 ? selectedQuestions : questionPool);
                }
              }}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'BATCH'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
                  : 'text-purple-200/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Gắn Thẻ Hàng Loạt ({selectedQuestions.length > 0 ? selectedQuestions.length : questionPool.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                vibrateTap();
                setActiveTab('TAXONOMY');
              }}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'TAXONOMY'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
                  : 'text-purple-200/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Taxonomy Ngân Hàng ({bankTaxonomy.totalTags} thẻ)</span>
            </button>
          </div>

          {/* Stepper if in Single Mode */}
          {activeTab === 'SINGLE' && questionPool.length > 1 && (
            <div className="flex items-center gap-1 text-slate-300 font-mono">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => {
                  vibrateTap();
                  setCurrentIndex(prev => Math.max(0, prev - 1));
                }}
                className="p-1 rounded bg-purple-900/40 hover:bg-purple-800/60 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                title="Câu trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 py-0.5 rounded bg-black/40 text-[11px] font-bold">
                Câu {currentIndex + 1} / {questionPool.length}
              </span>
              <button
                type="button"
                disabled={currentIndex >= questionPool.length - 1}
                onClick={() => {
                  vibrateTap();
                  setCurrentIndex(prev => Math.min(questionPool.length - 1, prev + 1));
                }}
                className="p-1 rounded bg-purple-900/40 hover:bg-purple-800/60 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                title="Câu tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          
          {/* TAB 1: SINGLE QUESTION DEEP ANALYSIS */}
          {activeTab === 'SINGLE' && (
            <>
              {/* Question Context Card */}
              <div className="p-4 rounded-lg bg-black/30 border border-purple-500/20 backdrop-blur-sm space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/50 font-mono font-bold text-xs">
                      {activeQuestion?.id || 'Q-TARGET'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/40 text-xs">
                      {activeQuestion?.round_name || 'Vòng thi'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">
                      {activeQuestion?.category || 'Chuyên đề'}
                    </span>
                  </div>
                  
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      vibrateTap();
                      runSingleAnalysis(activeQuestion, true);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-500/30 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Phân tích lại với AI</span>
                  </button>
                </div>

                <div className="text-sm font-medium text-slate-200 leading-relaxed font-sans">
                  {activeQuestion?.question_text}
                </div>

                {activeQuestion?.explanation && (
                  <div className="text-xs text-slate-400 bg-purple-950/20 p-2.5 rounded border border-purple-500/15">
                    <span className="font-bold text-purple-300">Giải thích: </span>
                    {activeQuestion.explanation}
                  </div>
                )}
              </div>

              {/* Agent Proof of Work Status */}
              {loading ? (
                <div className="p-6 rounded-xl bg-purple-950/20 border border-purple-500/30 flex flex-col items-center justify-center gap-3 text-center animate-pulse">
                  <div className="relative">
                    <Cpu className="w-10 h-10 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                    <Sparkles className="w-5 h-5 text-purple-400 absolute -top-1 -right-1 animate-ping" />
                  </div>
                  <div className="font-bold text-white text-sm">
                    Agent Antigravity đang khai phá tri thức & đối soát mẫu hình ngân hàng...
                  </div>
                  <div className="text-xs text-purple-200/70 max-w-md">
                    Đang giải mã cú pháp, ánh xạ khung năng lực TT 02/2025 và truy vấn ma trận xuất hiện thẻ của 40+ câu hỏi liên đới.
                  </div>
                </div>
              ) : analysis ? (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Agent Proof of Work Timeline */}
                  <div className="p-3 rounded-lg bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-500/20">
                    <div className="flex items-center justify-between text-xs font-mono text-purple-300 mb-2">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Cpu className="w-3.5 h-3.5 text-amber-400" />
                        Tiến trình lập luận của Agent ({agentName})
                      </span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Hoàn tất
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                      {analysis.agentExecutionSteps.map((step, idx) => (
                        <div key={idx} className="p-2 rounded bg-black/40 border border-purple-500/15 space-y-0.5">
                          <div className="font-bold text-slate-200 flex items-center gap-1">
                            <span className="w-4 h-4 rounded-full bg-purple-700/60 text-purple-200 flex items-center justify-center text-[10px]">
                              {step.stepNumber}
                            </span>
                            <span className="truncate">{step.title}</span>
                          </div>
                          <div className="text-slate-400 text-[10px] leading-tight line-clamp-2">
                            {step.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Knowledge Area & Competency Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    
                    {/* Primary Knowledge Area */}
                    <div className="p-3.5 rounded-lg bg-black/40 border border-sky-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-sky-400">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4" />
                          Miền Năng Lực Số
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px]">
                          {analysis.primaryKnowledgeArea.confidence}% Tin cậy
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-white text-sm">
                          {DIGITAL_COMPETENCY_DOMAINS[analysis.primaryKnowledgeArea.domainKey]?.code} - {analysis.primaryKnowledgeArea.domainName}
                        </div>
                        <div className="text-xs text-sky-200/80">
                          Mã {analysis.primaryKnowledgeArea.subCompetencyCode}: {analysis.primaryKnowledgeArea.subCompetencyName}
                        </div>
                        <div className="text-[11px] text-slate-400 italic pt-1">
                          "{analysis.primaryKnowledgeArea.rationale}"
                        </div>
                      </div>
                      <label className="flex items-center gap-2 pt-1 text-[11px] text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={syncDomain}
                          onChange={e => setSyncDomain(e.target.checked)}
                          className="rounded border-purple-500/40 text-purple-600 focus:ring-purple-500"
                        />
                        <span>Cập nhật Miền vào câu hỏi</span>
                      </label>
                    </div>

                    {/* Cognitive Level & Depth */}
                    <div className="p-3.5 rounded-lg bg-black/40 border border-emerald-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4" />
                          Bậc Nhận Thức Khảo Thí
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                          {analysis.suggestedCognitiveLevel.confidence}%
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{COGNITIVE_LEVELS[analysis.suggestedCognitiveLevel.level]?.name || analysis.suggestedCognitiveLevel.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-300 font-mono">
                            {COGNITIVE_LEVELS[analysis.suggestedCognitiveLevel.level]?.levelsRange}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 pt-1">
                          {analysis.suggestedCognitiveLevel.rationale}
                        </div>
                      </div>
                      <label className="flex items-center gap-2 pt-1 text-[11px] text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={syncCognitiveLevel}
                          onChange={e => setSyncCognitiveLevel(e.target.checked)}
                          className="rounded border-emerald-500/40 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Cập nhật Bậc nhận thức</span>
                      </label>
                    </div>

                    {/* Legal Grounding */}
                    <div className="p-3.5 rounded-lg bg-black/40 border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                        <span className="flex items-center gap-1.5">
                          <Scale className="w-4 h-4" />
                          Căn Cứ Pháp Lý Đề Xuất
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                          {analysis.suggestedLegalReference?.confidence || 90}%
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-white text-sm truncate">
                          {analysis.suggestedLegalReference?.reference || 'Nghị định 13/2023/NĐ-CP'}
                        </div>
                        {analysis.suggestedLegalReference?.relevantArticle && (
                          <div className="text-xs text-amber-200/80">
                            Điều khoản: {analysis.suggestedLegalReference.relevantArticle}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 pt-1">
                          Đã đối soát với kho văn bản pháp luật số BTI.
                        </div>
                      </div>
                      <label className="flex items-center gap-2 pt-1 text-[11px] text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={syncLegalRef}
                          onChange={e => setSyncLegalRef(e.target.checked)}
                          className="rounded border-amber-500/40 text-amber-600 focus:ring-amber-500"
                        />
                        <span>Đồng bộ căn cứ pháp lý</span>
                      </label>
                    </div>
                  </div>

                  {/* Interactive Tag Recommendation Grid */}
                  <div className="p-4 rounded-xl bg-black/40 border border-purple-500/30 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-purple-400" />
                        <h3 className="font-bold text-white text-sm">
                          Danh Sách Thẻ Tri Thức Đề Xuất ({analysis.suggestedTags.length})
                        </h3>
                        <span className="text-xs text-slate-400">
                          (Click để chọn/bỏ chọn thẻ áp dụng)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            vibrateTap();
                            const all = new Set<string>();
                            analysis.suggestedTags.forEach(t => all.add(t.tag));
                            (activeQuestion.tags || []).forEach(t => all.add(t));
                            setSelectedTags(all);
                          }}
                          className="text-purple-300 hover:text-white transition cursor-pointer underline"
                        >
                          Chọn tất cả
                        </button>
                        <span className="text-slate-600">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            vibrateTap();
                            setSelectedTags(new Set());
                          }}
                          className="text-slate-400 hover:text-white transition cursor-pointer underline"
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {analysis.suggestedTags.map((item, idx) => {
                        const isSelected = selectedTags.has(item.tag);
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleTag(item.tag)}
                            className={`p-2.5 rounded-lg border transition cursor-pointer flex flex-col justify-between gap-2 ${
                              isSelected
                                ? 'bg-purple-900/40 border-purple-400 text-white shadow-md shadow-purple-950/50'
                                : 'bg-black/30 border-purple-500/20 text-slate-300 hover:border-purple-400/50 hover:bg-purple-950/20'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                                  isSelected ? 'bg-purple-500 text-white' : 'border border-slate-600 text-transparent'
                                }`}>
                                  ✓
                                </div>
                                <span className="font-mono font-bold text-xs truncate">
                                  {item.displayName || `#${item.tag}`}
                                </span>
                              </div>

                              <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold ${
                                item.confidence >= 90
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {item.confidence}%
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-400 leading-tight">
                              {item.rationale}
                            </div>

                            {item.isPatternMatched && (
                              <div className="text-[10px] text-purple-300 flex items-center gap-1 font-mono">
                                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                                <span>Khớp mẫu hình ngân hàng</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Custom Tag Input */}
                    <div className="pt-2 border-t border-purple-500/15 flex items-center gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={customTagInput}
                          onChange={e => setCustomTagInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomTag();
                            }
                          }}
                          placeholder="Thêm thẻ tùy chỉnh (VD: #chong_phishing, #luat_an_ninh_mang)..."
                          className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-black/50 border border-purple-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddCustomTag()}
                        className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm</span>
                      </button>
                    </div>
                  </div>

                  {/* Pattern Insights & Bank Correlation Panel */}
                  {analysis.bankPatternInsights && (
                    <div className="p-3.5 rounded-lg bg-black/30 border border-indigo-500/20 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono text-indigo-300">
                        <span className="flex items-center gap-1.5 font-bold">
                          <TrendingUp className="w-4 h-4 text-indigo-400" />
                          Thông Tin Cụm & Mẫu Hình Ngân Hàng Đề
                        </span>
                        <span>Độ tin cậy cụm: {analysis.bankPatternInsights.patternConfidence}%</span>
                      </div>
                      <div className="text-xs text-slate-300">
                        <span className="font-bold text-indigo-200">Cụm chủ đề: </span>
                        {analysis.bankPatternInsights.clusterTheme} ({analysis.bankPatternInsights.similarBankQuestionsCount} câu tương đồng)
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-400">
                        <span>Thẻ đồng xuất hiện cao trong kho:</span>
                        {analysis.bankPatternInsights.topCoOccurringTags.map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 font-mono text-[10px] border border-indigo-700/30">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ) : null}
            </>
          )}

          {/* TAB 2: BATCH TAGGING MODE */}
          {activeTab === 'BATCH' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-black/40 border border-purple-500/30 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Gắn Thẻ Thông Minh Hàng Loạt với Agent Antigravity
                  </h3>
                  <p className="text-xs text-slate-400">
                    Phân tích đồng thời {batchResults.length || questionPool.length} câu hỏi, đề xuất thẻ chuẩn ma trận BTI.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={batchLoading}
                    onClick={() => handleRunBatchAnalysis(selectedQuestions.length > 0 ? selectedQuestions : questionPool)}
                    className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${batchLoading ? 'animate-spin' : ''}`} />
                    <span>Chạy Lại Phân Tích Hàng Loạt</span>
                  </button>
                </div>
              </div>

              {batchLoading ? (
                <div className="p-8 rounded-xl bg-purple-950/20 border border-purple-500/30 flex flex-col items-center justify-center gap-3 text-center animate-pulse">
                  <Cpu className="w-10 h-10 text-amber-400 animate-spin" />
                  <div className="font-bold text-white text-sm">
                    Agent Antigravity đang chạy phân tích hàng loạt...
                  </div>
                  <div className="text-xs text-purple-200/70">
                    Đang xử lý phân loại miền năng lực số và gắn thẻ chuẩn cho các câu hỏi được chọn.
                  </div>
                </div>
              ) : batchResults.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={batchSelectedIds.size === batchResults.length}
                          onChange={e => {
                            if (e.target.checked) {
                              setBatchSelectedIds(new Set(batchResults.map(r => r.id)));
                            } else {
                              setBatchSelectedIds(new Set());
                            }
                          }}
                          className="rounded border-purple-500/40 text-purple-600"
                        />
                        <span className="font-bold">Chọn tất cả ({batchResults.length} câu)</span>
                      </label>
                      <span className="text-slate-600">•</span>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={batchSyncDomain}
                          onChange={e => setBatchSyncDomain(e.target.checked)}
                          className="rounded border-purple-500/40 text-purple-600"
                        />
                        <span>Tự động cập nhật Miền Năng Lực Số</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {batchResults.map((item, idx) => {
                      const qObj = bankQuestions.find(q => q.id === item.id);
                      const isChecked = batchSelectedIds.has(item.id);
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border transition ${
                            isChecked
                              ? 'bg-purple-950/30 border-purple-500/40 text-white'
                              : 'bg-black/30 border-purple-500/15 text-slate-400 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setBatchSelectedIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(item.id)) next.delete(item.id);
                                    else next.add(item.id);
                                    return next;
                                  });
                                }}
                                className="mt-1 rounded border-purple-500/40 text-purple-600"
                              />
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 font-mono text-[10px] font-bold border border-purple-700/40">
                                    {item.id}
                                  </span>
                                  {item.suggestedDomain && (
                                    <span className="px-1.5 py-0.2 rounded bg-sky-950/80 text-sky-300 text-[10px] border border-sky-700/40">
                                      {DIGITAL_COMPETENCY_DOMAINS[item.suggestedDomain]?.code}
                                    </span>
                                  )}
                                  {item.suggestedCognitiveLevel && (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 text-[10px]">
                                      {item.suggestedCognitiveLevel}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs font-medium text-slate-200 line-clamp-2">
                                  {qObj?.question_text || 'Câu hỏi'}
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                  {item.suggestedTags.map((t, tIdx) => (
                                    <span key={tIdx} className="px-2 py-0.5 rounded bg-purple-900/40 text-purple-200 font-mono text-[10px] border border-purple-500/20">
                                      {t.displayName || `#${t.tag}`}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono text-[10px] font-bold">
                              {item.confidenceScore}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 3: TAXONOMY & PATTERN EXPLORER */}
          {activeTab === 'TAXONOMY' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-black/40 border border-purple-500/30 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-purple-400" />
                    Bản Đồ Cụm Thẻ & Ma Trận Phân Bố ({bankTaxonomy.totalTags} thẻ độc nhất)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Phân tích tần suất xuất hiện và cấu trúc cụm thẻ trong toàn bộ ngân hàng câu hỏi.
                  </p>
                </div>

                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={taxonomySearch}
                    onChange={e => setTaxonomySearch(e.target.value)}
                    placeholder="Tìm kiếm thẻ..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-black/50 border border-purple-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Top Bank Tags Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {filteredTaxonomy.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-black/30 border border-purple-500/20 flex items-center justify-between gap-2"
                  >
                    <span className="font-mono text-xs text-purple-200 font-bold truncate">
                      #{item.tag}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-purple-900/60 text-purple-300 font-mono text-[10px] font-bold">
                      {item.count} câu
                    </span>
                  </div>
                ))}
              </div>

              {/* Domain Taxonomy Distribution */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-xs text-slate-300 font-mono flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                  Phân Bổ Thẻ Theo 6 Miền Năng Lực Số (TT 02/2025):
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {bankTaxonomy.domainTagTaxonomy.map((dom, idx) => {
                    const domInfo = dom.domainKey !== 'UNASSIGNED' ? DIGITAL_COMPETENCY_DOMAINS[dom.domainKey as DigitalCompetencyDomainKey] : null;
                    return (
                      <div key={idx} className="p-3 rounded-lg bg-black/30 border border-purple-500/20 space-y-2">
                        <div className="font-bold text-xs text-white flex items-center justify-between">
                          <span>{domInfo ? `${domInfo.code} - ${domInfo.name}` : 'Chưa phân miền'}</span>
                          <span className="text-purple-300 text-[10px] font-mono">{dom.tags.length} thẻ</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {dom.tags.slice(0, 10).map((t, tIdx) => (
                            <span key={tIdx} className="px-2 py-0.5 rounded bg-purple-950 text-purple-200 font-mono text-[10px] border border-purple-500/20">
                              #{t}
                            </span>
                          ))}
                          {dom.tags.length > 10 && (
                            <span className="text-[10px] text-slate-500">+{dom.tags.length - 10} khác</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Action Bar */}
        <div className="px-5 py-3.5 border-t border-purple-500/30 bg-[#170836] flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="text-slate-400 text-xs">
            {activeTab === 'SINGLE' ? (
              <span>Đã chọn <strong className="text-white">{selectedTags.size}</strong> thẻ áp dụng</span>
            ) : activeTab === 'BATCH' ? (
              <span>Đã chọn <strong className="text-white">{batchSelectedIds.size}</strong> / {batchResults.length} câu hỏi</span>
            ) : null}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition cursor-pointer"
            >
              Đóng
            </button>

            {activeTab === 'SINGLE' && (
              <button
                type="button"
                disabled={selectedTags.size === 0 || loading}
                onClick={handleApplySingle}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-purple-950/60 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Áp Dụng Thẻ ({selectedTags.size})</span>
              </button>
            )}

            {activeTab === 'BATCH' && (
              <button
                type="button"
                disabled={batchSelectedIds.size === 0 || batchLoading}
                onClick={handleApplyBatch}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-purple-950/60 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Áp Dụng Hàng Loạt ({batchSelectedIds.size} câu)</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
