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
  Image as ImageIcon,
  Target,
  Lightbulb,
  MessageSquare,
  Film,
  Globe,
  ExternalLink
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
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';

interface AIQuestionStudioProps {
  onQuestionCreated?: () => void;
  onEditQuestion?: (q: QuestionItem) => void;
  onOpenGeminiStudio?: (tab?: 'CHAT' | 'IMAGE' | 'VIDEO') => void;
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
      // Optional: don't save yet, let the modal save it
      onEditQuestion(draftItem);
      // Mark as saved since it will be opened in modal
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="fluent-box p-4 sm:p-5 relative overflow-hidden bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-black/60 border border-blue-500/20 rounded-[4px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-bold mb-2 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>AI Question Drafting Studio • TT 02/2025/TT-BGDĐT</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              Trợ Lý AI Soạn Thảo Đề Thi BTI 2026
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-2xl">
              Tạo câu hỏi phân hóa cao bám sát 6 Miền năng lực số, 4 mức độ nhận thức chuẩn Bộ GD&ĐT và trích dẫn chuẩn xác các văn bản pháp lý hiện hành.
            </p>
          </div>

          {/* Gemini AI Studio Quick Action Bar */}
          {onOpenGeminiStudio && (
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenGeminiStudio('CHAT')}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                title="Mở Chatbot Gemini đa lượt với vai trò Cố vấn khảo thí"
              >
                <MessageSquare className="w-3.5 h-3.5 text-purple-300" />
                <span>Chatbot Cố vấn</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenGeminiStudio('IMAGE')}
                className="px-3 py-2 rounded-lg bg-gradient-to-r from-theme-accent/20 to-purple-500/20 hover:from-theme-accent/30 hover:to-purple-500/30 border border-theme-accent/40 text-theme-accent text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                title="Tạo hoặc chỉnh sửa ảnh minh họa bằng gemini-3.1-flash-image-preview"
              >
                <ImageIcon className="w-3.5 h-3.5 text-theme-accent" />
                <span>Tạo & Sửa Ảnh</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenGeminiStudio('VIDEO')}
                className="px-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                title="Animate ảnh thành video bằng Veo 3.1 Fast Preview"
              >
                <Film className="w-3.5 h-3.5 text-cyan-400" />
                <span>Video Veo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 5 Cols: Configuration Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="fluent-box p-4 sm:p-5 space-y-4 rounded-[4px] border border-white/10">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 pb-2 border-b border-white/10">
              <Layers className="w-4 h-4 text-sky-400" />
              Tham Số Khảo Thí & Căn Cứ
            </h3>

            {/* 1. Stage */}
            <div>
              <label className="block text-xs font-mono text-white/70 mb-1.5 font-semibold">
                1. Giai Đoạn Vòng Thi:
              </label>
              <select
                value={stage}
                onChange={e => handleStageChange(e.target.value as CompetitionStage)}
                className="w-full bg-black/50 border border-white/15 rounded-[4px] px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
              >
                {Object.values(COMPETITION_STAGES).map(s => (
                  <option key={s.stage} value={s.stage}>
                    {s.name} ({s.subTitle})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Hierarchical 2-Level Selection */}
            <div className="p-3 bg-white/[0.03] border border-white/10 rounded-[4px] space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-sky-300">
                <span>🎯 PHÂN LOẠI 2 MỨC: VÒNG THI ⇒ DẠNG ĐỀ</span>
                <span className="text-emerald-400 font-normal">Chuẩn BTI 2026</span>
              </div>

              {/* Mức 1: Vòng thi / Giai đoạn đề thi */}
              <div>
                <label className="block text-[11px] font-mono text-sky-300 mb-1 font-semibold flex items-center justify-between">
                  <span>🏆 MỨC 1: {stage === 'VONG_LOAI' ? 'GIAI ĐOẠN ĐỀ THI' : 'CHỌN VÒNG THI'}</span>
                  <span className="text-[10px] text-white/40 font-normal">
                    {stage === 'VONG_LOAI' ? 'Đề 28 câu chuẩn hóa' : '5 vòng Gameshow'}
                  </span>
                </label>
                {stage === 'VONG_LOAI' ? (
                  <div className="p-2 bg-sky-950/40 border border-sky-400/30 rounded-[4px] text-xs space-y-0.5">
                    <div className="text-sky-300 font-bold font-mono text-[11px]">
                      Đề thi Vòng Loại (28 câu duy nhất)
                    </div>
                    <p className="text-white/60 text-[10px]">
                      Vòng loại chỉ có 1 dạng đề gồm 28 câu (24 câu Phần I và 4 câu Phần II), không chọn các vòng thi như Bán kết và Chung kết.
                    </p>
                  </div>
                ) : (
                  <select
                    value={roundGroup}
                    onChange={e => handleRoundGroupChange(e.target.value as BtiRoundGroupKey)}
                    className="w-full bg-black/70 border border-sky-500/40 rounded-[4px] px-2.5 py-1.5 text-xs text-white focus:border-sky-400 focus:outline-none"
                  >
                    {getRoundGroupsForStage(stage).map(g => (
                      <option key={g.key} value={g.key}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Mức 2: Dạng đề / Phần thi */}
              <div>
                <label className="block text-[11px] font-mono text-amber-300 mb-1 font-semibold flex items-center justify-between">
                  <span>📋 MỨC 2: {stage === 'VONG_LOAI' ? 'PHẦN THI TRONG ĐỀ 28 CÂU' : 'DẠNG ĐỀ THI'}</span>
                  <span className="text-[10px] text-amber-400/80 font-normal">
                    {getActiveFormatsForRoundGroup(stage === 'VONG_LOAI' ? 'VONG_LOAI' : roundGroup).length} dạng
                  </span>
                </label>
                <select
                  value={roundFormat}
                  onChange={e => handleFormatChange(e.target.value as QuestionRoundFormat)}
                  className="w-full bg-black/70 border border-amber-500/40 rounded-[4px] px-2.5 py-1.5 text-xs text-amber-200 focus:border-amber-400 focus:outline-none"
                >
                  {getActiveFormatsForRoundGroup(stage === 'VONG_LOAI' ? 'VONG_LOAI' : roundGroup).map(fmt => (
                    <option key={fmt.format} value={fmt.format}>
                      {fmt.name}
                    </option>
                  ))}
                </select>
              </div>

              {QUESTION_ROUND_FORMATS[roundFormat] && (
                <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-[4px] text-[11px] space-y-1.5 mt-2 shadow-sm">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300 border-b border-amber-500/20 pb-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Luật Chơi: {QUESTION_ROUND_FORMATS[roundFormat].ruleSection}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] mb-1">
                    <span className="px-1.5 py-0.5 bg-black/40 rounded text-sky-300">
                      ⏱️ {QUESTION_ROUND_FORMATS[roundFormat].defaultTimeLimit} giây
                    </span>
                    <span className="px-1.5 py-0.5 bg-black/40 rounded text-amber-300">
                      ⭐ {QUESTION_ROUND_FORMATS[roundFormat].defaultPoints} điểm
                    </span>
                    <span className="px-1.5 py-0.5 bg-black/40 rounded text-rose-300">
                      📝 {QUESTION_ROUND_FORMATS[roundFormat].defaultRoundType}
                    </span>
                  </div>
                  <p className="text-white/80 leading-snug">
                    <strong className="text-white">Mô tả:</strong> {QUESTION_ROUND_FORMATS[roundFormat].description}
                  </p>
                  <p className="text-emerald-400/90 leading-snug">
                    <strong className="text-emerald-400">Tính điểm:</strong> {QUESTION_ROUND_FORMATS[roundFormat].scoringRule}
                  </p>
                </div>
              )}
            </div>

            {/* 3. Domain */}
            <div>
              <label className="block text-xs font-mono text-white/70 mb-1.5 font-semibold">
                3. Miền Năng Lực Số (Thông tư 02/2025):
              </label>
              <select
                value={domain}
                onChange={e => handleDomainChange(e.target.value as DigitalCompetencyDomainKey)}
                className="w-full bg-black/50 border border-white/15 rounded-[4px] px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
              >
                {Object.values(DIGITAL_COMPETENCY_DOMAINS).map(d => (
                  <option key={d.key} value={d.key}>
                    {d.code}: {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Sub-competency */}
            <div>
              <label className="block text-xs font-mono text-white/70 mb-1.5 font-semibold">
                4. Năng Lực Thành Phần:
              </label>
              <select
                value={subCompetency}
                onChange={e => setSubCompetency(e.target.value)}
                className="w-full bg-black/50 border border-white/15 rounded-[4px] px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
              >
                {DIGITAL_COMPETENCY_DOMAINS[domain].subCompetencies.map(sub => (
                  <option key={sub.code} value={sub.code}>
                    {sub.code}: {sub.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-white/50 mt-1 italic">
                {DIGITAL_COMPETENCY_DOMAINS[domain].subCompetencies.find(s => s.code === subCompetency)?.description}
              </p>
            </div>

            {/* 5. Cognitive Level */}
            <div>
              <label className="block text-xs font-mono text-white/70 mb-1.5 font-semibold">
                5. Mức Độ Nhận Thức (Chuẩn Bộ GD&ĐT):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(COGNITIVE_LEVELS).map(lvl => (
                  <button
                    key={lvl.level}
                    type="button"
                    onClick={() => setCognitiveLevel(lvl.level)}
                    className={`px-2.5 py-2 rounded-[4px] border text-left transition text-xs ${
                      cognitiveLevel === lvl.level
                        ? 'border-sky-400 bg-sky-500/20 text-white font-bold shadow-sm'
                        : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{lvl.name}</span>
                      {cognitiveLevel === lvl.level && <CheckCircle2 className="w-3 h-3 text-sky-300" />}
                    </div>
                    <span className="text-[10px] opacity-70 block font-normal">{lvl.levelsRange}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Legal Document Context Grounding */}
            <div>
              <label className="block text-xs font-mono text-white/70 mb-1.5 font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-amber-400" />
                  6. Văn Bản Pháp Lý Tham Chiếu:
                </span>
                <span className="text-[10px] text-emerald-400">Đã cập nhật {documents.length} văn bản</span>
              </label>
              <select
                value={selectedDocId}
                onChange={e => setSelectedDocId(e.target.value)}
                className="w-full bg-black/50 border border-white/15 rounded-[4px] px-3 py-2 text-xs text-white focus:border-sky-400 focus:outline-none"
              >
                {documents.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.documentNumber} - {doc.title}
                  </option>
                ))}
              </select>
            </div>

            {/* 7. Topic & Prompt */}
            <div>
              <label className="block text-xs font-mono text-white/70 mb-1.5 font-semibold flex items-center justify-between">
                <span>7. Chủ Đề / Gợi Ý Nội Dung Soạn Thảo:</span>
                <button
                  type="button"
                  onClick={() => {
                    const suggestions = AI_KEYWORD_SUGGESTIONS[domain as string] || AI_KEYWORD_SUGGESTIONS['MIEN_4'];
                    const randomKeyword = suggestions[Math.floor(Math.random() * suggestions.length)];
                    setTopicPrompt(randomKeyword);
                  }}
                  className="text-amber-400 hover:text-amber-300 font-normal flex items-center gap-1 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/20 transition-colors"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  Gợi ý ngẫu nhiên
                </button>
              </label>
              <textarea
                value={topicPrompt}
                onChange={e => setTopicPrompt(e.target.value)}
                rows={3}
                placeholder="Nhập tình huống, công nghệ thực tế, hoặc gợi ý cụ thể..."
                className="w-full bg-black/50 border border-white/15 rounded-[4px] p-2.5 text-xs text-white placeholder-white/30 focus:border-sky-400 focus:outline-none mb-2"
              />
              
              {/* Keyword Chips */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="text-[10px] text-white/40 flex items-center pt-0.5 mr-1"><Sparkles className="w-3 h-3 mr-1" /> Gợi ý AI:</span>
                {(AI_KEYWORD_SUGGESTIONS[domain as string] || []).map((keyword, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTopicPrompt(keyword)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-sky-900/30 hover:bg-sky-800/60 text-sky-200 border border-sky-500/30 transition-colors text-left max-w-full truncate"
                    title={keyword}
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>

            {/* 8. Google Search Grounding Toggle */}
            <div className="p-3 rounded-[4px] bg-gradient-to-r from-emerald-950/40 via-blue-950/30 to-black/50 border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-300">
                  <input
                    type="checkbox"
                    checked={useSearchGrounding}
                    onChange={e => setUseSearchGrounding(e.target.checked)}
                    className="w-4 h-4 rounded border-emerald-500 bg-black text-emerald-500 focus:ring-emerald-400"
                  />
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    Tra cứu Google Search Grounding
                  </span>
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono font-bold">
                  Gemini 3.5 Flash
                </span>
              </div>
              <p className="text-[11px] text-white/70 leading-relaxed pl-6">
                Tự động tìm kiếm tin tức an toàn thông tin, tình huống thực tế & văn bản quy phạm pháp luật mới nhất 2025-2026 trên Google.
              </p>
            </div>

            {/* Number of questions & Submit button */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-28 shrink-0">
                <label className="block text-[11px] font-mono text-white/60 mb-1">Số lượng:</label>
                <select
                  value={questionCount}
                  onChange={e => setQuestionCount(Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/15 rounded-[4px] px-2 py-2 text-xs text-white text-center focus:border-sky-400 focus:outline-none"
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
                className="flex-1 mt-4 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-[4px] text-xs font-bold uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>AI Đang Soạn Đề...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Khởi Tạo Bằng AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Results & Auditing Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Kết Quả AI Soạn Thảo ({generatedQuestions.length})
            </h3>
            {generatedQuestions.length > 0 && (
              <button
                type="button"
                onClick={handleSaveAll}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono rounded-[4px] transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Lưu Tất Cả Vào Ngân Hàng
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="fluent-box p-4 border-rose-500/40 bg-rose-950/30 text-rose-300 text-xs rounded-[4px] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Lỗi biên soạn câu hỏi:</p>
                <p className="text-white/80 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Search Grounding Sources Display */}
          {groundingSources.length > 0 && (
            <div className="fluent-box p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-[4px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  Nguồn Trích Dẫn Google Search Grounding ({groundingSources.length}):
                </span>
                {searchQueries.length > 0 && (
                  <span className="text-[10px] text-white/50 font-mono truncate max-w-xs">
                    Từ khóa: {searchQueries.join(', ')}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {groundingSources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-black/40 hover:bg-black/70 border border-emerald-500/20 hover:border-emerald-400/50 rounded flex items-center justify-between text-emerald-200 transition-colors group"
                  >
                    <span className="truncate pr-2 font-medium group-hover:underline">{source.title || source.uri}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="fluent-box p-8 rounded-[4px] border border-sky-500/30 text-center space-y-3 animate-pulse">
              <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
              <p className="text-sm font-bold text-white font-mono">Đang kết nối Gemini Pro & Khảo thí TT 02/2025...</p>
              <p className="text-xs text-white/50 max-w-md mx-auto">
                Mô hình đang đối chiếu câu hỏi với {selectedDocId ? 'văn bản pháp lý đã chọn' : 'Khung năng lực số'} và tạo phương án nhiễu khoa học.
              </p>
            </div>
          )}

          {!isGenerating && generatedQuestions.length === 0 && !errorMsg && (
            <div className="fluent-box p-12 rounded-[4px] border border-white/10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white font-mono">Chưa có câu hỏi nào được tạo</p>
              <p className="text-xs text-white/50 max-w-md mx-auto">
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
                className={`fluent-box p-4 sm:p-5 rounded-[4px] border transition-all space-y-3.5 ${
                  isSaved ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-white/15 bg-black/40'
                }`}
              >
                {/* Header Meta */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded">
                      Câu #{idx + 1}
                    </span>
                    <span className="text-xs font-mono text-white/60 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                      {stage}
                    </span>
                    <span className="text-xs font-mono text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30">
                      {q.cognitiveLevel || cognitiveLevel}
                    </span>
                    {q.mediaType && q.mediaType !== 'NONE' && (
                      <span className="text-xs font-mono text-pink-300 bg-pink-950/40 px-2 py-0.5 rounded border border-pink-500/30 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> {q.mediaType}
                      </span>
                    )}
                    {q.tags && q.tags.map((tag: string, i: number) => (
                      <span key={i} className="text-[10px] font-mono text-amber-300/80 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-500/20">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAuditQuestion(q, idx)}
                      disabled={isAuditing}
                      className="px-2.5 py-1 text-[11px] font-mono font-bold text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 rounded flex items-center gap-1 transition cursor-pointer"
                    >
                      {isAuditing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3 text-amber-400" />}
                      <span>Thẩm Định AI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEditBeforeSave(q, idx)}
                      disabled={isSaved}
                      className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded flex items-center gap-1 transition cursor-pointer ${
                        isSaved 
                          ? 'bg-purple-900/40 text-purple-300 border border-purple-500/30' 
                          : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Sửa & Lưu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveToBank(q, idx)}
                      disabled={isSaved}
                      className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded flex items-center gap-1 transition cursor-pointer ${
                        isSaved 
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isSaved ? 'Đã Lưu' : 'Lưu Nhanh'}</span>
                    </button>
                  </div>
                </div>

                {/* Question Text & VCNV Info */}
                {q.obstacleInfo && (
                  <div className="mb-2 p-2 bg-amber-950/20 border border-amber-500/20 rounded text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1 border-b border-amber-500/20 pb-1">
                      <Target className="w-3.5 h-3.5" />
                      <span>Thông tin Vượt Chướng Ngại Vật</span>
                    </div>
                    <p className="text-white/80"><span className="text-white/50">Hàng ngang:</span> {q.obstacleInfo.rowNumber} <span className="text-white/50 ml-2">Độ dài:</span> {q.obstacleInfo.rowLength} ký tự</p>
                    <p className="text-white/80"><span className="text-white/50">Gợi ý:</span> {q.obstacleInfo.clueText}</p>
                  </div>
                )}
                <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                  {q.questionText}
                </p>

                {/* Options (if multiple choice or True/False) */}
                {q.options && Object.keys(q.options).length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {Object.entries(q.options).map(([optKey, optText]) => {
                      const isCorrect = q.correctKey === optKey || q.correctKey?.includes(optKey);
                      return (
                        <div
                          key={optKey}
                          className={`p-2.5 rounded-[4px] border text-xs flex items-start gap-2 ${
                            isCorrect
                              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200 font-semibold'
                              : 'bg-white/5 border-white/10 text-white/80'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] shrink-0 ${
                            isCorrect ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white'
                          }`}>
                            {optKey}
                          </span>
                          <span className="leading-snug">{String(optText)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Answer & Explanation */}
                <div className="p-3 bg-white/5 rounded-[4px] border border-white/10 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-emerald-400 font-bold uppercase">Đáp án chuẩn:</span>
                    <span className="font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                      {q.correctKey}
                    </span>
                  </div>
                  <p className="text-white/70 leading-relaxed">
                    <span className="font-semibold text-white/90">Giải thích:</span> {q.explanation}
                  </p>
                  {q.legalReference && (
                    <p className="text-amber-300/90 text-[11px] flex items-center gap-1.5 pt-1 border-t border-white/5">
                      <Scale className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>Căn cứ pháp lý: <strong>{q.legalReference}</strong></span>
                    </p>
                  )}
                </div>

                {/* Audit Feedback Panel (if evaluated) */}
                {audit && (
                  <div className="p-3.5 bg-amber-950/20 border border-amber-500/40 rounded-[4px] space-y-2 text-xs animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono text-amber-300 flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5" />
                        Đánh Giá Thẩm Định Hội Đồng Khảo Thí:
                      </span>
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                        {audit.qualityScore}/100 Điểm
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-white/80 pt-1">
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
    </div>
  );
};
