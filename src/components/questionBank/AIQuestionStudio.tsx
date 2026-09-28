import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Clock, 
  Scale, 
  Layers, 
  Plus, 
  RefreshCw, 
  Copy, 
  Eye, 
  FileCheck2,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Target,
  Lightbulb,
  MessageSquare,
  Film,
  Globe,
  ExternalLink,
  Award,
  Zap,
  Info,
  Terminal,
  Compass,
  Cpu
} from 'lucide-react';
import { 
  CompetitionStage, 
  CognitiveLevel, 
  DigitalCompetencyDomainKey, 
  QuestionRoundFormat, 
  QuestionItem 
} from '../../types';
import { 
  DIGITAL_COMPETENCY_DOMAINS, 
  COGNITIVE_LEVELS, 
  COMPETITION_STAGES,
  QUESTION_ROUND_FORMATS,
  BTI_ROUND_GROUPS,
  BtiRoundGroupKey,
  getActiveFormatsForRoundGroup,
  getRoundGroupByFormat,
  getRoundGroupsForStage
} from '../../data/digitalCompetencyData';
import { questionBankManager } from '../../services/questionBankManager';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateError } from '../../utils/hapticUtils';
import { NotebookLMChatView } from './NotebookLMChatView';
import { BulkQuestionGeneratorModal } from './BulkQuestionGeneratorModal';

interface AIQuestionStudioProps {
  onQuestionCreated?: () => void;
  onEditQuestion?: (q: QuestionItem) => void;
  onOpenGeminiStudio?: (tab?: 'CHAT' | 'ANTIGRAVITY' | 'DEEP_RESEARCH' | 'IMAGE' | 'VIDEO') => void;
}

const AI_KEYWORD_SUGGESTIONS: Record<string, string[]> = {
  'MIEN_1': [
    'Phân biệt tin giả (Fake news) mạo danh cơ quan nhà nước',
    'Kỹ năng tìm kiếm tài liệu chuẩn học thuật',
    'Nhận diện thông tin lừa đảo trên TikTok, Facebook',
    'Xác thực nguồn gốc hình ảnh bằng công cụ AI'
  ],
  'MIEN_2': [
    'Bạo lực mạng (Cyberbullying) chốn học đường',
    'Quy tắc ứng xử văn minh trong nhóm chat lớp học',
    'Tác hại của phát ngôn thù ghét trên mạng xã hội',
    'Bảo vệ hình ảnh cá nhân khi chia sẻ trực tuyến'
  ],
  'MIEN_3': [
    'Nhận diện Deepfake audio lừa đảo mượn tiền',
    'Sử dụng ChatGPT không vi phạm liêm chính học thuật',
    'Bản quyền hình ảnh khi dùng AI tạo sinh (Midjourney, Canva)',
    'Rủi ro pháp lý khi chế ảnh, meme người khác'
  ],
  'MIEN_4': [
    'Lừa đảo chiếm đoạt tài khoản ngân hàng trực tuyến',
    'Cài đặt bảo mật 2 lớp (2FA) chống hack tài khoản',
    'Phòng chống mã độc tống tiền (Ransomware)',
    'Nhận diện đường link lạ (Phishing) và tệp đính kèm độc hại'
  ],
  'MIEN_5': [
    'Cân bằng thời gian sử dụng thiết bị số (Screen time)',
    'Tác động của ánh sáng xanh đến giấc ngủ',
    'Phòng tránh nghiện game online và mạng xã hội',
    'Bảo vệ cột sống và thị lực khi dùng máy tính lâu'
  ],
  'MIEN_6': [
    'Định hướng nghề nghiệp số thời đại AI',
    'Kỹ năng học tập suốt đời (Lifelong learning)',
    'Xây dựng thương hiệu cá nhân tích cực trên mạng',
    'Tư duy giải quyết vấn đề bằng ứng dụng công nghệ'
  ]
};

const COGNITIVE_PILLS: { level: CognitiveLevel; short: string; label: string; activeClass: string; badgeClass: string }[] = [
  { level: 'NHAN_BIET', short: 'NB', label: 'Nhận biết', activeClass: 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow-sm', badgeClass: 'text-sky-300' },
  { level: 'THONG_HIEU', short: 'TH', label: 'Thông hiểu', activeClass: 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-sm', badgeClass: 'text-emerald-300' },
  { level: 'VAN_DUNG', short: 'VD', label: 'Vận dụng', activeClass: 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm', badgeClass: 'text-amber-300' },
  { level: 'VAN_DUNG_CAO', short: 'VDC', label: 'VD Cao', activeClass: 'bg-rose-500 text-white font-bold border-rose-400 shadow-sm', badgeClass: 'text-rose-300' },
];

export const AIQuestionStudio: React.FC<AIQuestionStudioProps> = ({ onQuestionCreated, onEditQuestion, onOpenGeminiStudio }) => {
  const documents = questionBankManager.getDocuments();

  const [stage, setStage] = useState<CompetitionStage>('BAN_KET_1');
  const [roundGroup, setRoundGroup] = useState<BtiRoundGroupKey>('KHOI_DONG');
  const [roundFormat, setRoundFormat] = useState<QuestionRoundFormat>('KHOI_DONG_RIENG');
  const [domain, setDomain] = useState<DigitalCompetencyDomainKey>('MIEN_4');
  const [subCompetency, setSubCompetency] = useState<string>('4.2');
  const [cognitiveLevel, setCognitiveLevel] = useState<CognitiveLevel>('THONG_HIEU');
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [topicPrompt, setTopicPrompt] = useState<string>('Bẫy lừa đảo mạng xã hội mạo danh nhà trường và cách nhận biết');
  const [questionCount, setQuestionCount] = useState<number>(1);
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(true);
  const [groundingSources, setGroundingSources] = useState<{ title: string; uri: string }[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [showRuleDetails, setShowRuleDetails] = useState<boolean>(false);
  const [studioMode, setStudioMode] = useState<'GENERATOR' | 'CHAT'>('GENERATOR');
  const [showBulkGeneratorModal, setShowBulkGeneratorModal] = useState<boolean>(false);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  // Auditing state
  const [auditResults, setAuditResults] = useState<Record<number, any>>({});
  const [auditingIdx, setAuditingIdx] = useState<number | null>(null);

  const handleDomainChange = (newDomain: DigitalCompetencyDomainKey) => {
    setDomain(newDomain);
    const subList = DIGITAL_COMPETENCY_DOMAINS[newDomain].subCompetencies;
    if (subList && subList.length > 0) {
      setSubCompetency(subList[0].code);
    }
  };

  const handleGenerate = async () => {
    vibrateTap();
    soundFx.playClick();
    setIsGenerating(true);
    setErrorMsg(null);
    setSavedIds(new Set());
    setAuditResults({});
    setGroundingSources([]);
    setSearchQueries([]);

    try {
      const selectedDoc = documents.find(d => d.id === selectedDocId);
      const legalContext = selectedDoc 
        ? `${selectedDoc.title} (${selectedDoc.documentNumber}). Tóm tắt: ${selectedDoc.summary}. Các điều khoản chính: ${selectedDoc.keyArticles?.map(a => `${a.article}: ${a.content}`).join('; ')}`
        : 'Thông tư 02/2025/TT-BGDĐT Khung năng lực số cho người học';

      const formatDetails = QUESTION_ROUND_FORMATS[roundFormat];

      const res = await fetch('/api/ai/generate-advanced-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage,
          roundFormat,
          formatDetails,
          domain,
          subCompetency,
          cognitiveLevel,
          legalReference: `${selectedDoc?.title || 'Thông tư 02/2025/TT-BGDĐT'} (${subCompetency})`,
          contextDoc: legalContext,
          topicPrompt,
          count: questionCount,
          useSearchGrounding
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi gọi API AI biên soạn câu hỏi.');
      }

      setGeneratedQuestions(data.questions || []);
      setGroundingSources(data.groundingSources || []);
      setSearchQueries(data.searchQueries || []);
      soundFx.playCorrect();
      vibrateSuccess();
    } catch (err: any) {
      console.error('AI Generation Error:', err);
      setErrorMsg(err.message || 'Không thể kết nối với máy chủ AI.');
      soundFx.playError();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAuditQuestion = async (q: any, idx: number) => {
    vibrateTap();
    soundFx.playClick();
    setAuditingIdx(idx);

    try {
      const res = await fetch('/api/ai/audit-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      });
      const data = await res.json();
      if (data.success && data.audit) {
        setAuditResults(prev => ({ ...prev, [idx]: data.audit }));
        soundFx.playCorrect();
      }
    } catch (e) {
      console.error('Audit Error:', e);
    } finally {
      setAuditingIdx(null);
    }
  };

  const handleUseNotebookLMContext = (params: {
    topic: string;
    legalReference?: string;
    docId?: string;
    contextText?: string;
  }) => {
    if (params.topic) {
      setTopicPrompt(params.topic);
    }
    if (params.docId) {
      setSelectedDocId(params.docId);
    }
    setStudioMode('GENERATOR');
    soundFx.playCorrect();
    vibrateSuccess();
  };

  const createQuestionItemFromAI = (q: any, idx: number): QuestionItem => {
    const formatMeta = QUESTION_ROUND_FORMATS[roundFormat];
    
    let roundName = formatMeta?.roundGroupName || 'Câu hỏi AI Sinh';
    
    if (stage === 'VONG_LOAI') {
      roundName = formatMeta?.name || 'Vòng Loại';
    }

    const resolvedTimeLimit = q.timeLimit || formatMeta?.defaultTimeLimit || 20;
    const resolvedPoints = q.points || formatMeta?.defaultPoints || 10;

    return {
      id: `AI_${Date.now().toString(36)}_${idx + 1}`,
      round_name: roundName,
      round_type: q.roundType || formatMeta?.defaultRoundType || (Object.keys(q.options || {}).length > 0 ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER'),
      round_format: roundFormat,
      category: `${DIGITAL_COMPETENCY_DOMAINS[domain].code}: ${DIGITAL_COMPETENCY_DOMAINS[domain].name}`,
      question_text: q.questionText,
      options: q.options || {},
      correct_key: q.correctKey,
      explanation: q.explanation || '',
      time_limit: resolvedTimeLimit,
      points: resolvedPoints,
      stage,
      cognitive_level: (q.cognitiveLevel as CognitiveLevel) || cognitiveLevel,
      digital_competency_domain: domain,
      digital_sub_competency: subCompetency,
      legal_reference: q.legalReference || `Thông tư 02/2025/TT-BGDĐT (${subCompetency})`,
      tags: q.tags || [],
      media_type: q.mediaType || 'NONE',
      obstacle_info: q.obstacleInfo ? {
        obstacleKey: (q.obstacleInfo as any).answerText || (q.obstacleInfo as any).obstacleKey || q.correctKey,
        obstacleImage: (q.obstacleInfo as any).obstacleImage || '',
        explanation: (q.obstacleInfo as any).clueText || (q.obstacleInfo as any).explanation || ''
      } : undefined,
      approval_status: questionBankManager.canAutoApprove() ? 'APPROVED' : 'PENDING_REVIEW',
      created_by: `Trợ lý AI (${questionBankManager.getCurrentUser().name})`,
      created_at: Date.now()
    };
  };

  const handleEditBeforeSave = (q: any, idx: number) => {
    if (onEditQuestion) {
      const draftItem = createQuestionItemFromAI(q, idx);
      onEditQuestion(draftItem);
      setSavedIds(prev => new Set(prev).add(idx));
    }
  };

  const handleSaveToBank = (q: any, idx: number) => {
    const newItem = createQuestionItemFromAI(q, idx);
    questionBankManager.addQuestion(newItem);
    setSavedIds(prev => new Set(prev).add(idx));
    if (onQuestionCreated) onQuestionCreated();
  };

  const handleSaveAll = () => {
    generatedQuestions.forEach((q, idx) => {
      if (!savedIds.has(idx)) {
        handleSaveToBank(q, idx);
      }
    });
  };

  const handleStageChange = (newStage: CompetitionStage) => {
    setStage(newStage);
    if (newStage === 'VONG_LOAI') {
      setRoundGroup('VONG_LOAI');
      setRoundFormat('BGD_MULTIPLE_CHOICE');
    } else if (roundGroup === 'VONG_LOAI') {
      setRoundGroup('KHOI_DONG');
      setRoundFormat('KHOI_DONG_RIENG');
    }
  };

  const handleRoundGroupChange = (newGroup: BtiRoundGroupKey) => {
    setRoundGroup(newGroup);
    if (newGroup === 'VONG_LOAI' && stage !== 'VONG_LOAI') {
      setStage('VONG_LOAI');
    } else if (newGroup !== 'VONG_LOAI' && stage === 'VONG_LOAI') {
      setStage('BAN_KET_1');
    }
    const formats = getActiveFormatsForRoundGroup(newGroup);
    if (formats.length > 0) {
      setRoundFormat(formats[0].format);
    }
  };

  const handleFormatChange = (fmt: QuestionRoundFormat) => {
    setRoundFormat(fmt);
    const grp = getRoundGroupByFormat(fmt);
    setRoundGroup(grp);
  };

  const currentFormatMeta = QUESTION_ROUND_FORMATS[roundFormat];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. COMPACT TOP HEADER STRIP & MODE TOGGLE */}
      <div className="fluent-card px-4 py-3 bg-gradient-to-r from-[#190839] via-[#241148] to-[#190839] border border-theme-accent/25 rounded-[6px] shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[4px] bg-theme-accent/15 border border-theme-accent/30 flex items-center justify-center text-theme-accent shrink-0">
            <Sparkles className="w-4 h-4 text-theme-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Trợ Lý AI Soạn Thảo & Khảo Thí BTI 2026
              </h2>
              <span className="text-[10px] px-2 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono font-semibold border border-purple-400/30">
                TT 02/2025/TT-BGDĐT
              </span>
            </div>
            <p className="text-[11px] text-[#B6A6D8] font-mono">
              Biên soạn câu hỏi phân hóa cao & Trò chuyện cố vấn chuyên sâu cùng Trợ lý AI BTI
            </p>
          </div>
        </div>

        {/* Tab Mode Switcher: Studio Generator vs Chat NotebookLM Grounded */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-black/50 p-1 rounded-[6px] border border-white/15">
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setStudioMode('GENERATOR');
              }}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                studioMode === 'GENERATOR'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Soạn Thảo Đề Thi AI</span>
            </button>

            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setStudioMode('CHAT');
              }}
              className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                studioMode === 'CHAT'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>Chat NotebookLM (Nguồn Luật)</span>
            </button>
          </div>

          {/* Gemini AI Studio Quick Shortcuts */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setShowBulkGeneratorModal(true);
              }}
              className="px-2.5 py-1.5 rounded-[4px] bg-gradient-to-r from-sky-600/30 to-indigo-600/30 hover:from-sky-600/50 hover:to-indigo-600/50 border border-sky-400/40 text-sky-200 text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Mở hộp thoại Sinh câu hỏi hàng loạt tự động bằng Agent Antigravity"
            >
              <Zap className="w-3.5 h-3.5 text-sky-300 fill-current" />
              <span>Sinh Hàng Loạt (Antigravity)</span>
            </button>

            {onOpenGeminiStudio && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    setStudioMode('CHAT');
                  }}
                  className="px-2.5 py-1.5 rounded-[4px] bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-purple-300 text-[11px] font-mono font-medium flex items-center gap-1.5 transition cursor-pointer"
                  title="Mở Chat NotebookLM tra cứu căn cứ pháp lý & trích dẫn điều khoản"
                >
                  <BookOpen className="w-3 h-3 text-amber-300" />
                  <span className="hidden sm:inline">NotebookLM</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenGeminiStudio('ANTIGRAVITY')}
                  className="px-2.5 py-1.5 rounded-[4px] bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-300 text-[11px] font-mono font-medium flex items-center gap-1.5 transition cursor-pointer"
                  title="Thẩm định mã nguồn & thuật toán trong Remote Sandbox với Agent Antigravity"
                >
                  <Terminal className="w-3 h-3 text-sky-400" />
                  <span className="hidden sm:inline">Agent Antigravity</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenGeminiStudio('DEEP_RESEARCH')}
                  className="px-2.5 py-1.5 rounded-[4px] bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-[11px] font-mono font-medium flex items-center gap-1.5 transition cursor-pointer"
                  title="Khảo cứu học thuật & đối sánh pháp quy Thông tư 02 với Agent Deep Research Pro"
                >
                  <Compass className="w-3 h-3 text-emerald-400" />
                  <span className="hidden sm:inline">Deep Research</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenGeminiStudio('IMAGE')}
                  className="px-2.5 py-1.5 rounded-[4px] bg-theme-accent/15 hover:bg-theme-accent/25 border border-theme-accent/30 text-theme-accent text-[11px] font-mono font-medium flex items-center gap-1.5 transition cursor-pointer"
                  title="Tạo ảnh minh họa câu hỏi với Gemini Flash Image"
                >
                  <ImageIcon className="w-3 h-3 text-theme-accent" />
                  <span className="hidden sm:inline">Tạo Ảnh</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenGeminiStudio('VIDEO')}
                  className="px-2.5 py-1.5 rounded-[4px] bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 text-[11px] font-mono font-medium flex items-center gap-1.5 transition cursor-pointer"
                  title="Tạo video minh họa với Veo 3.1"
                >
                  <Film className="w-3 h-3 text-cyan-300" />
                  <span className="hidden sm:inline">Video Veo</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. NOTEBOOKLM CHAT MODE OR GENERATOR MODE */}
      {studioMode === 'CHAT' ? (
        <div className="fluent-card p-4 sm:p-5 rounded-[6px] bg-[#1a073a]/90 border border-theme-accent/25 shadow-xl animate-fadeIn min-h-[620px]">
          <NotebookLMChatView onUseForExamQuestion={handleUseNotebookLMContext} />
        </div>
      ) : (
        /* MAIN 2-COLUMN WORKSPACE GRID (GENERATOR) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN (5 COLS): STREAMLINED CONFIGURATION PANEL */}
        <div className="lg:col-span-5 space-y-3">
          <div className="fluent-card p-3.5 sm:p-4 rounded-[6px] bg-[#1a073a]/90 border border-theme-accent/25 space-y-3">
            {/* Group Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
              <span className="font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Cấu Hình Khảo Thí &amp; Ma Trận
              </span>
              <span className="text-[10px] text-theme-accent font-mono">BTI Studio</span>
            </div>

            {/* Row 1: Giai đoạn & Vòng thi (2 cols) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-mono text-white/70 mb-1 font-semibold">
                  1. Giai đoạn:
                </label>
                <select
                  value={stage}
                  onChange={e => handleStageChange(e.target.value as CompetitionStage)}
                  className="w-full bg-[#120427] border border-white/15 rounded-[4px] px-2 py-1.5 text-xs text-white focus:border-theme-accent focus:outline-none truncate font-medium"
                >
                  {Object.values(COMPETITION_STAGES).map(s => (
                    <option key={s.stage} value={s.stage}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-sky-300 mb-1 font-semibold">
                  2. Phần thi / Vòng:
                </label>
                {stage === 'VONG_LOAI' ? (
                  <div className="px-2 py-1.5 bg-sky-950/40 border border-sky-400/30 rounded-[4px] text-xs text-sky-300 font-mono truncate font-medium">
                    Chuẩn 28 câu
                  </div>
                ) : (
                  <select
                    value={roundGroup}
                    onChange={e => handleRoundGroupChange(e.target.value as BtiRoundGroupKey)}
                    className="w-full bg-[#120427] border border-sky-500/30 rounded-[4px] px-2 py-1.5 text-xs text-sky-200 focus:border-sky-400 focus:outline-none truncate font-medium"
                  >
                    {getRoundGroupsForStage(stage).map(g => (
                      <option key={g.key} value={g.key}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Row 2: Dạng đề thi & Rule summary strip */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono text-amber-300 font-semibold">
                  3. Dạng câu hỏi / Thể thức:
                </label>
                {currentFormatMeta && (
                  <button
                    type="button"
                    onClick={() => setShowRuleDetails(!showRuleDetails)}
                    className="text-[10px] text-amber-300/80 hover:text-amber-200 underline font-mono cursor-pointer flex items-center gap-0.5"
                  >
                    <span>{showRuleDetails ? 'Ẩn luật' : 'Xem luật'}</span>
                    {showRuleDetails ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                  </button>
                )}
              </div>
              <select
                value={roundFormat}
                onChange={e => handleFormatChange(e.target.value as QuestionRoundFormat)}
                className="w-full bg-[#120427] border border-amber-500/30 rounded-[4px] px-2.5 py-1.5 text-xs text-amber-200 focus:border-amber-400 focus:outline-none font-medium truncate"
              >
                {getActiveFormatsForRoundGroup(stage === 'VONG_LOAI' ? 'VONG_LOAI' : roundGroup).map(fmt => (
                  <option key={fmt.format} value={fmt.format}>
                    {fmt.name}
                  </option>
                ))}
              </select>

              {/* Compact Format Rules Pill Strip */}
              {currentFormatMeta && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#B6A6D8] flex-wrap">
                    <span className="px-1.5 py-0.2 rounded bg-black/40 text-sky-300 border border-white/5">
                      ⏱️ {currentFormatMeta.defaultTimeLimit}s
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-black/40 text-amber-300 border border-white/5">
                      ⭐ {currentFormatMeta.defaultPoints} điểm
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-black/40 text-rose-300 border border-white/5 truncate max-w-[180px]">
                      📝 {currentFormatMeta.ruleSection}
                    </span>
                  </div>

                  {showRuleDetails && (
                    <div className="p-2 bg-amber-950/30 border border-amber-500/25 rounded-[4px] text-[10.5px] text-white/80 space-y-1 animate-fadeIn">
                      <p><strong className="text-white">Mô tả:</strong> {currentFormatMeta.description}</p>
                      <p className="text-emerald-300"><strong className="text-emerald-400">Cách chấm:</strong> {currentFormatMeta.scoringRule}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Row 3: Miền Năng Lực & Năng Lực Thành Phần (2 cols) */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
              <div>
                <label className="block text-[11px] font-mono text-white/70 mb-1 font-semibold">
                  4. Miền năng lực (TT 02):
                </label>
                <select
                  value={domain}
                  onChange={e => handleDomainChange(e.target.value as DigitalCompetencyDomainKey)}
                  className="w-full bg-[#120427] border border-white/15 rounded-[4px] px-2 py-1.5 text-xs text-white focus:border-theme-accent focus:outline-none truncate font-medium"
                >
                  {Object.values(DIGITAL_COMPETENCY_DOMAINS).map(d => (
                    <option key={d.key} value={d.key}>
                      {d.code}: {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-white/70 mb-1 font-semibold">
                  5. Năng lực thành phần:
                </label>
                <select
                  value={subCompetency}
                  onChange={e => setSubCompetency(e.target.value)}
                  className="w-full bg-[#120427] border border-white/15 rounded-[4px] px-2 py-1.5 text-xs text-purple-200 focus:border-purple-400 focus:outline-none truncate font-medium"
                >
                  {DIGITAL_COMPETENCY_DOMAINS[domain].subCompetencies.map(sub => (
                    <option key={sub.code} value={sub.code}>
                      {sub.code}: {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Mức Độ Nhận Thức (4-Pill Segmented Buttons) */}
            <div>
              <label className="block text-[11px] font-mono text-white/70 mb-1.5 font-semibold">
                6. Mức độ nhận thức (Độ khó):
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {COGNITIVE_PILLS.map(p => {
                  const isSelected = cognitiveLevel === p.level;
                  return (
                    <button
                      key={p.level}
                      type="button"
                      onClick={() => {
                        vibrateTap();
                        soundFx.playClick();
                        setCognitiveLevel(p.level);
                      }}
                      className={`py-1.5 px-1 rounded-[4px] border text-center transition cursor-pointer text-xs font-mono select-none ${
                        isSelected
                          ? p.activeClass
                          : 'bg-black/30 border-white/10 text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                      title={p.label}
                    >
                      <span className="block font-bold">{p.short}</span>
                      <span className="text-[9px] block opacity-80 truncate">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 5: Văn Bản Pháp Lý Tham Chiếu */}
            <div>
              <label className="block text-[11px] font-mono text-white/70 mb-1 font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Scale className="w-3 h-3 text-emerald-400" />
                  <span>7. Căn cứ văn bản pháp lý:</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-normal">
                  {documents.length} văn bản
                </span>
              </label>
              <select
                value={selectedDocId}
                onChange={e => setSelectedDocId(e.target.value)}
                className="w-full bg-[#120427] border border-white/15 rounded-[4px] px-2 py-1.5 text-xs text-white focus:border-theme-accent focus:outline-none truncate font-medium"
              >
                {documents.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.documentNumber} - {doc.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 6: Chủ Đề / Gợi Ý Prompt */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono text-white/70 font-semibold">
                  8. Gợi ý chủ đề / Tình huống thực tế:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    const suggestions = AI_KEYWORD_SUGGESTIONS[domain as string] || AI_KEYWORD_SUGGESTIONS['MIEN_4'];
                    const randomKeyword = suggestions[Math.floor(Math.random() * suggestions.length)];
                    setTopicPrompt(randomKeyword);
                  }}
                  className="text-[10px] text-amber-300 hover:text-amber-200 font-mono flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 cursor-pointer transition"
                >
                  <Lightbulb className="w-3 h-3 text-amber-300" />
                  <span>Gợi ý ngẫu nhiên</span>
                </button>
              </div>

              <textarea
                value={topicPrompt}
                onChange={e => setTopicPrompt(e.target.value)}
                rows={2}
                placeholder="Nhập tình huống, công nghệ thực tế, hoặc gợi ý cụ thể..."
                className="w-full bg-[#120427] border border-white/15 rounded-[4px] p-2 text-xs text-white placeholder-white/30 focus:border-theme-accent focus:outline-none leading-relaxed"
              />

              {/* Keyword Chips */}
              <div className="flex flex-wrap gap-1 mt-1">
                {(AI_KEYWORD_SUGGESTIONS[domain as string] || []).slice(0, 3).map((keyword, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      setTopicPrompt(keyword);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950/40 hover:bg-sky-900/60 text-sky-200 border border-sky-500/25 transition cursor-pointer truncate max-w-full text-left"
                    title={keyword}
                  >
                    #{keyword}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 7: Google Search Grounding Inline Switch */}
            <div className="flex items-center justify-between p-2 rounded-[4px] bg-emerald-950/25 border border-emerald-500/25 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-300">
                <input
                  type="checkbox"
                  checked={useSearchGrounding}
                  onChange={e => setUseSearchGrounding(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-emerald-500 bg-black text-emerald-500 focus:ring-emerald-400 accent-emerald-500 cursor-pointer"
                />
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  <span>Tra cứu Google Search Grounding</span>
                </span>
              </label>
              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-400/30">
                Web 2026
              </span>
            </div>

            {/* Row 8: Question Count & Primary Submit Button */}
            <div className="flex items-center gap-2 pt-1 border-t border-white/10">
              <div className="w-24 shrink-0">
                <select
                  value={questionCount}
                  onChange={e => setQuestionCount(Number(e.target.value))}
                  className="w-full bg-[#120427] border border-white/15 rounded-[4px] px-2 py-2 text-xs text-white text-center focus:border-theme-accent focus:outline-none font-mono font-bold"
                  title="Số lượng câu hỏi cần sinh"
                >
                  <option value={1}>1 câu</option>
                  <option value={2}>2 câu</option>
                  <option value={3}>3 câu</option>
                  <option value={5}>5 câu</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-[4px] text-xs font-bold uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>AI Đang Soạn Đề...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Khởi Tạo Bằng AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 COLS): GENERATED RESULTS & AUDIT CARDS */}
        <div className="lg:col-span-7 space-y-3">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Kết Quả AI Soạn Thảo ({generatedQuestions.length})
            </h3>
            {generatedQuestions.length > 0 && (
              <button
                type="button"
                onClick={handleSaveAll}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold font-mono rounded-[4px] transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                <CheckCircle2 className="w-3 h-3" />
                Lưu Tất Cả ({generatedQuestions.length - savedIds.size})
              </button>
            )}
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="fluent-card p-3 border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs rounded-[4px] flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Lỗi biên soạn câu hỏi:</p>
                <p className="text-white/80 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Search Grounding Sources Display */}
          {groundingSources.length > 0 && (
            <div className="fluent-card p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-[4px] space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5 font-mono text-[11px]">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  Nguồn Trích Dẫn Thực Tế ({groundingSources.length}):
                </span>
                {searchQueries.length > 0 && (
                  <span className="text-[10px] text-white/50 font-mono truncate max-w-xs">
                    {searchQueries.join(', ')}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                {groundingSources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-black/40 hover:bg-black/70 border border-emerald-500/20 hover:border-emerald-400/50 rounded flex items-center justify-between text-emerald-200 transition text-[11px] group"
                  >
                    <span className="truncate pr-2 font-medium group-hover:underline">{source.title || source.uri}</span>
                    <ExternalLink className="w-3 h-3 text-emerald-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Loading Animation State */}
          {isGenerating && (
            <div className="fluent-card p-6 rounded-[6px] border border-sky-500/30 text-center space-y-2.5 animate-pulse bg-[#190839]">
              <RefreshCw className="w-6 h-6 text-sky-400 animate-spin mx-auto" />
              <p className="text-xs font-bold text-white font-mono">Đang kết nối Gemini Pro &amp; Khảo thí TT 02/2025...</p>
              <p className="text-[11px] text-white/50 max-w-md mx-auto font-mono">
                Đối chiếu căn cứ pháp lý, tính điểm phân hóa và tạo phương án nhiễu khoa học...
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isGenerating && generatedQuestions.length === 0 && !errorMsg && (
            <div className="fluent-card p-8 rounded-[6px] border border-white/10 text-center space-y-2 bg-[#190839]">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-theme-accent">
                <Sparkles className="w-5 h-5 text-theme-accent" />
              </div>
              <p className="text-xs font-bold text-white font-mono">Chưa có câu hỏi nào được sinh</p>
              <p className="text-[11px] text-white/50 max-w-md mx-auto">
                Chọn giai đoạn thi, miền năng lực số và bấm &quot;Khởi Tạo Bằng AI&quot; để trợ lý tự động biên soạn câu hỏi chuẩn xác kèm căn cứ pháp lý.
              </p>
            </div>
          )}

          {/* Generated Question Cards */}
          {generatedQuestions.map((q, idx) => {
            const isSaved = savedIds.has(idx);
            const audit = auditResults[idx];
            const isAuditing = auditingIdx === idx;

            return (
              <div 
                key={idx} 
                className={`fluent-card p-3.5 sm:p-4 rounded-[6px] border transition-all space-y-2.5 ${
                  isSaved ? 'border-emerald-500/40 bg-emerald-950/15' : 'border-white/15 bg-[#190839]'
                }`}
              >
                {/* Header Meta */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="text-[11px] font-mono font-bold text-sky-300 bg-sky-950/60 border border-sky-500/30 px-2 py-0.2 rounded">
                      #{idx + 1}
                    </span>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-950/40 px-1.5 py-0.2 rounded border border-purple-500/30">
                      {q.cognitiveLevel || cognitiveLevel}
                    </span>
                    {q.mediaType && q.mediaType !== 'NONE' && (
                      <span className="text-[10px] font-mono text-pink-300 bg-pink-950/40 px-1.5 py-0.2 rounded border border-pink-500/30 flex items-center gap-1">
                        <ImageIcon className="w-2.5 h-2.5" /> {q.mediaType}
                      </span>
                    )}
                    {q.tags && q.tags.map((tag: string, i: number) => (
                      <span key={i} className="text-[9.5px] font-mono text-amber-300/80 bg-amber-950/30 px-1.5 py-0.2 rounded border border-amber-500/20">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAuditQuestion(q, idx)}
                      disabled={isAuditing}
                      className="px-2 py-1 text-[10.5px] font-mono font-bold text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 rounded flex items-center gap-1 transition cursor-pointer"
                      title="Chấm điểm thẩm định hội đồng khảo thí"
                    >
                      {isAuditing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3 text-amber-400" />}
                      <span>Thẩm Định</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEditBeforeSave(q, idx)}
                      disabled={isSaved}
                      className={`px-2 py-1 text-[10.5px] font-mono font-bold rounded flex items-center gap-1 transition cursor-pointer ${
                        isSaved 
                          ? 'bg-purple-900/40 text-purple-300 border border-purple-500/30' 
                          : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}
                      title="Mở trình soạn thảo chi tiết trước khi lưu"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Sửa &amp; Lưu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveToBank(q, idx)}
                      disabled={isSaved}
                      className={`px-2 py-1 text-[10.5px] font-mono font-bold rounded flex items-center gap-1 transition cursor-pointer ${
                        isSaved 
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isSaved ? 'Đã Lưu' : 'Lưu Nhanh'}</span>
                    </button>
                  </div>
                </div>

                {/* Obstacle Info if VCNV */}
                {q.obstacleInfo && (
                  <div className="p-2 bg-amber-950/20 border border-amber-500/20 rounded text-xs space-y-0.5 font-mono">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-0.5">
                      <Target className="w-3 h-3" />
                      <span>Thông tin Vượt Chướng Ngại Vật</span>
                    </div>
                    <p className="text-white/80">
                      Hàng ngang: <strong className="text-white">{q.obstacleInfo.rowNumber}</strong> ({q.obstacleInfo.rowLength} ký tự)
                    </p>
                    <p className="text-white/70">Gợi ý: {q.obstacleInfo.clueText}</p>
                  </div>
                )}

                {/* Question Text */}
                <p className="text-sm font-semibold text-white leading-relaxed">
                  {q.questionText}
                </p>

                {/* Options Grid */}
                {q.options && Object.keys(q.options).length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                    {Object.entries(q.options).map(([optKey, optText]) => {
                      const isCorrect = q.correctKey === optKey || q.correctKey?.includes(optKey);
                      return (
                        <div
                          key={optKey}
                          className={`p-2 rounded-[4px] border text-xs flex items-start gap-2 ${
                            isCorrect
                              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 font-semibold shadow-sm'
                              : 'bg-white/5 border-white/10 text-white/80'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded flex items-center justify-center font-bold text-[10px] shrink-0 font-mono ${
                            isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-white'
                          }`}>
                            {optKey}
                          </span>
                          <span className="leading-snug">{String(optText)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Answer, Explanation & Legal Reference */}
                <div className="p-2.5 bg-white/5 rounded-[4px] border border-white/10 space-y-1 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Đáp án:</span>
                    <span className="font-bold text-white bg-emerald-500/20 px-2 py-0.2 rounded border border-emerald-500/30 text-[11px]">
                      {q.correctKey}
                    </span>
                  </div>
                  <p className="text-white/70 text-[11px] leading-relaxed">
                    <span className="font-semibold text-white/90">Giải thích:</span> {q.explanation}
                  </p>
                  {q.legalReference && (
                    <p className="text-amber-300/90 text-[10.5px] flex items-center gap-1 pt-1 border-t border-white/5">
                      <Scale className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>Căn cứ: <strong>{q.legalReference}</strong></span>
                    </p>
                  )}
                </div>

                {/* Audit Feedback Panel */}
                {audit && (
                  <div className="p-2.5 bg-amber-950/20 border border-amber-500/40 rounded-[4px] space-y-1.5 text-xs animate-fadeIn font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px]">
                        <FileCheck2 className="w-3.5 h-3.5" />
                        Đánh Giá Thẩm Định Hội Đồng Khảo Thí:
                      </span>
                      <span className="font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.2 rounded border border-emerald-500/30 text-[11px]">
                        {audit.qualityScore}/100 Điểm
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px] text-white/80 pt-0.5">
                      <div>
                        <span className="text-emerald-400 font-bold block">Ưu điểm:</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-white/70">
                          {audit.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      <div>
                        <span className="text-rose-400 font-bold block">Lưu ý / Cải thiện:</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-white/70">
                          {audit.weaknesses?.map((w: string, i: number) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Bulk Question Generator Modal */}
      {showBulkGeneratorModal && (
        <BulkQuestionGeneratorModal
          isOpen={showBulkGeneratorModal}
          onClose={() => setShowBulkGeneratorModal(false)}
          onQuestionsAdded={() => {
            if (onQuestionCreated) {
              onQuestionCreated();
            }
          }}
        />
      )}
    </div>
  );
};
