import React, { useState } from 'react';
import { 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  Scale, 
  Activity, 
  Copy, 
  Check, 
  Layers, 
  BookOpen, 
  ShieldCheck, 
  Cpu, 
  Flame, 
  RotateCcw,
  Sliders,
  AlertTriangle,
  Send,
  Plus
} from 'lucide-react';
import { autopilotAuthoringService, AutopilotAuthoringResult } from '../../services/autopilotAuthoringService';
import { DIGITAL_COMPETENCY_DOMAINS, COGNITIVE_LEVELS } from '../../data/digitalCompetencyData';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';
import { questionBankManager } from '../../services/questionBankManager';

export const AutopilotStudioTab: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [domainKey, setDomainKey] = useState<string>('AUTO');
  const [cognitiveLevel, setCognitiveLevel] = useState<string>('AUTO');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'>('MEDIUM');
  const [includeVariants, setIncludeVariants] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AutopilotAuthoringResult | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'QUESTION' | 'LEGAL' | 'PSYCHOMETRICS' | 'VARIANTS'>('QUESTION');
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  const presets = [
    { label: '🛡️ NĐ 13/2023 Dữ liệu cá nhân', text: 'Tình huống doanh nghiệp thu thập dữ liệu sinh trắc học khách hàng mà chưa có sự đồng ý rõ ràng theo Nghị định 13/2023/NĐ-CP' },
    { label: '🎭 Deepfake AI & Mạo danh', text: 'Kỹ thuật nhận biết cuộc gọi video Deepfake mạo danh lãnh đạo chuyển tiền và các biện pháp xác minh an toàn' },
    { label: '🎣 Tấn công Phishing & 2FA', text: 'Kịch bản tấn công Phishing qua tin nhắn SMS Brandname giả mạo cổng dịch vụ công trực tuyến và cách xử lý sự cố' },
    { label: '📚 Liêm chính học thuật GenAI', text: 'Quy tắc trích dẫn nguồn và liêm chính học thuật khi sử dụng ChatGPT/Claude để hỗ trợ nghiên cứu khoa học theo TT 02/2025' },
    { label: '🌐 Văn hóa mạng Netiquette', text: 'Trách nhiệm công dân số và quy tắc ứng xử văn minh trên mạng xã hội, phòng chống bạo lực mạng Cyberbullying' }
  ];

  const handleRunAutoPilot = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setSavedSuccessMsg(null);
    vibrateTap();
    soundFx.playClick();

    try {
      const res = await autopilotAuthoringService.generateFullSuite({
        prompt,
        domainKey: domainKey === 'AUTO' ? undefined : domainKey,
        cognitiveLevel: cognitiveLevel === 'AUTO' ? undefined : cognitiveLevel,
        difficulty,
        generateVariants: includeVariants
      });

      setResult(res);
      vibrateSuccess();
      soundFx.playSuccess();
    } catch (err: any) {
      console.error(err);
      soundFx.playError();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToBank = (withVariants: boolean = true) => {
    if (!result) return;
    vibrateSuccess();
    soundFx.playSuccess();

    const { mainId, variantCount } = autopilotAuthoringService.saveQuestionFromSuite(result, withVariants);
    const totalCount = 1 + variantCount;

    setSavedSuccessMsg(`Đã thêm thành công ${totalCount} câu hỏi (${mainId}${variantCount > 0 ? ` + ${variantCount} biến thể` : ''}) vào ngân hàng đề thi!`);
    setTimeout(() => setSavedSuccessMsg(null), 4000);
  };

  const handleCopyMarkdown = () => {
    if (!result) return;
    vibrateTap();
    soundFx.playClick();

    const mq = result.mainQuestion;
    const text = `### [BTI 2026] ${mq.question_text}
A. ${mq.options.A}
B. ${mq.options.B}
C. ${mq.options.C}
D. ${mq.options.D}

👉 Đáp án đúng: ${mq.correct_key}
📖 Lời giải: ${mq.explanation}
⚖️ Pháp lý: ${mq.legal_reference}
🏷️ Miền: ${mq.digital_competency_domain} (${mq.digital_sub_competency}) | Bậc: ${mq.cognitive_level}
🏷️ Tags: #${mq.tags.join(' #')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col min-h-0 text-slate-100 font-sans space-y-3 overflow-hidden select-text">
      {/* Top Banner Info */}
      <div className="px-4 py-2.5 rounded-[6px] bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-amber-500/10 border border-amber-400/30 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-[4px] bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold shrink-0">
            <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                AutoPilot Master Suite (Cùng cấp độ Gemini Studio)
              </h3>
              <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30">
                7 Khâu Trọn Gói
              </span>
            </div>
            <p className="text-[11px] text-[#B6A6D8] truncate">
              Soạn thảo ➜ Sinh đáp án nhiễu ➜ Phân tầng TT 02/2025 ➜ Đối soát pháp lý NĐ 13 ➜ Đo lường IRT ➜ 3 Biến thể
            </p>
          </div>
        </div>

        {savedSuccessMsg && (
          <div className="px-3 py-1 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-fadeIn shrink-0">
            <Check className="w-3.5 h-3.5" />
            <span>{savedSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Left Controls (1/3) & Right Preview (2/3) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        {/* Left Column: Form & Presets */}
        <div className="lg:col-span-5 flex flex-col min-h-0 bg-[#120529]/80 rounded-[6px] border border-theme-accent/20 p-3 space-y-3 overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Chủ đề, kịch bản hoặc từ khóa câu hỏi:</span>
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={3}
              placeholder="Ví dụ: Tình huống nhân viên chia sẻ file khách hàng lên Google Drive công khai, vi phạm điều khoản nào trong Nghị định 13/2023/NĐ-CP..."
              className="w-full p-2.5 rounded-[4px] bg-black/50 border border-theme-accent/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none font-sans"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-[11px] font-mono text-white/60 block mb-1.5 font-semibold">
              Gợi ý kịch bản tình huống chuẩn BTI 2026:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    setPrompt(p.text);
                  }}
                  className="px-2 py-1 rounded-[4px] bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/80 hover:text-white transition cursor-pointer text-left"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] text-white/70 mb-1 font-mono">Miền năng lực:</label>
              <select
                value={domainKey}
                onChange={e => setDomainKey(e.target.value)}
                className="w-full p-1.5 rounded-[4px] bg-black/60 border border-theme-accent/30 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
              >
                <option value="AUTO">✨ AI tự động phân tích</option>
                {Object.entries(DIGITAL_COMPETENCY_DOMAINS).map(([key, dom]) => (
                  <option key={key} value={key}>{dom.code}: {dom.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-white/70 mb-1 font-mono">Cấp độ nhận thức:</label>
              <select
                value={cognitiveLevel}
                onChange={e => setCognitiveLevel(e.target.value)}
                className="w-full p-1.5 rounded-[4px] bg-black/60 border border-theme-accent/30 text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
              >
                <option value="AUTO">✨ AI tự động chuẩn hóa</option>
                {Object.entries(COGNITIVE_LEVELS).map(([key, lvl]) => (
                  <option key={key} value={key}>{lvl.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleRunAutoPilot}
              disabled={loading || !prompt.trim()}
              className="w-full py-2.5 rounded-[4px] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition cursor-pointer active:scale-98"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý 7 công đoạn...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Kích Hoạt AutoPilot Biên Soạn Trọn Gói</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Results & Interactive Inspection */}
        <div className="lg:col-span-7 flex flex-col min-h-0 bg-[#120529]/80 rounded-[6px] border border-theme-accent/20 p-3 overflow-hidden">
          {!result && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-white/50 space-y-3">
              <div className="w-14 h-14 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Zap className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Chưa có kết quả biên soạn</h4>
                <p className="text-xs text-white/60 max-w-sm mt-1">
                  Nhập yêu cầu câu hỏi hoặc chọn một kịch bản tình huống bên trái, sau đó nhấn kích hoạt để AI xử lý toàn diện.
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border-3 border-amber-400 border-t-transparent animate-spin" />
              <div className="text-xs font-mono text-amber-300">
                Đang xử lý pipeline: Soạn câu hỏi ➜ Sinh 3 đáp án nhiễu ➜ Phân tầng TT 02/2025 ➜ Kiểm toán pháp lý...
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="flex-1 min-h-0 flex flex-col space-y-2.5 overflow-hidden">
              {/* Result Tabs & Quick Actions */}
              <div className="flex items-center justify-between border-b border-theme-accent/20 pb-2 shrink-0 flex-wrap gap-2">
                <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-[4px] border border-theme-accent/20 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveResultTab('QUESTION')}
                    className={`px-2.5 py-1 rounded-[3px] transition cursor-pointer ${
                      activeResultTab === 'QUESTION' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Câu Hỏi &amp; Nhiễu
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveResultTab('LEGAL')}
                    className={`px-2.5 py-1 rounded-[3px] transition cursor-pointer ${
                      activeResultTab === 'LEGAL' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Đối Soát Pháp Lý
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveResultTab('PSYCHOMETRICS')}
                    className={`px-2.5 py-1 rounded-[3px] transition cursor-pointer ${
                      activeResultTab === 'PSYCHOMETRICS' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Tâm Trắc IRT
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveResultTab('VARIANTS')}
                    className={`px-2.5 py-1 rounded-[3px] transition cursor-pointer ${
                      activeResultTab === 'VARIANTS' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    3 Biến Thể ({result.variants?.length || 0})
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyMarkdown}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs flex items-center gap-1 border border-white/10 transition cursor-pointer"
                    title="Sao chép nội dung"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Đã chép' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveToBank(true)}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow transition cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Lưu Vào Ngân Hàng Đề</span>
                  </button>
                </div>
              </div>

              {/* Tab Content Body */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar text-xs">
                {activeResultTab === 'QUESTION' && (
                  <div className="space-y-3">
                    {/* Question text box */}
                    <div className="p-3 rounded bg-black/40 border border-theme-accent/20 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-amber-300">
                        <span>Đề bài câu hỏi:</span>
                        <span>{result.mainQuestion.digital_competency_domain} • {result.mainQuestion.cognitive_level}</span>
                      </div>
                      <p className="text-white font-medium leading-relaxed">
                        {result.mainQuestion.question_text}
                      </p>
                    </div>

                    {/* Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(result.mainQuestion.options).map(([k, val]) => (
                        <div
                          key={k}
                          className={`p-2.5 rounded border flex items-start gap-2 ${
                            k === result.mainQuestion.correct_key
                              ? 'bg-emerald-950/40 border-emerald-400 text-emerald-200 font-bold'
                              : 'bg-black/30 border-white/10 text-white/80'
                          }`}
                        >
                          <span className="font-mono font-bold">{k}.</span>
                          <span className="leading-snug">{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    <div className="p-2.5 rounded bg-white/5 border border-white/10 space-y-1">
                      <strong className="text-amber-300 font-mono text-[11px]">Giải thích &amp; Hướng dẫn chấm:</strong>
                      <p className="text-white/80 leading-relaxed">{result.mainQuestion.explanation}</p>
                    </div>
                  </div>
                )}

                {activeResultTab === 'LEGAL' && (
                  <div className="space-y-2.5">
                    <div className="p-3 rounded bg-blue-950/30 border border-blue-500/30 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-blue-300">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        <span>Căn cứ pháp lý tham chiếu:</span>
                      </div>
                      <p className="text-white/90 font-mono font-bold text-amber-300">{result.legalAudit.referencedDecree}</p>
                      <p className="text-white/80">{result.legalAudit.legalNotes}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded bg-black/40 border border-white/10">
                        <span className="text-white/60 text-[11px] block">Trạng thái rà soát:</span>
                        <span className="text-xs font-bold text-emerald-300">
                          {result.legalAudit.status === 'VERIFIED_COMPLIANT' ? '✓ Đạt chuẩn pháp lý' : 'Cần rà soát thêm'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-black/40 border border-white/10">
                        <span className="text-white/60 text-[11px] block">Rủi ro văn bản lỗi thời:</span>
                        <span className="text-xs font-bold text-cyan-300 uppercase">
                          {result.legalAudit.outdatedInfoRisk || 'LOW'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeResultTab === 'PSYCHOMETRICS' && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded bg-black/40 border border-white/10 text-center">
                        <span className="text-white/60 text-[10px] block">Độ khó IRT (b):</span>
                        <span className="text-base font-bold text-amber-300 font-mono">
                          {Number(result.psychometricEstimate.difficultyB).toFixed(2)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-black/40 border border-white/10 text-center">
                        <span className="text-white/60 text-[10px] block">Độ phân biệt (a):</span>
                        <span className="text-base font-bold text-emerald-300 font-mono">
                          {Number(result.psychometricEstimate.discriminationA).toFixed(2)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-black/40 border border-white/10 text-center">
                        <span className="text-white/60 text-[10px] block">Dự kiến đúng:</span>
                        <span className="text-base font-bold text-cyan-300 font-mono">
                          {result.psychometricEstimate.expectedPassRate}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-white/5 border border-white/10">
                      <strong className="text-white/70 block mb-1">Đánh giá chất lượng đo lường:</strong>
                      <p className="text-white/80">{result.psychometricEstimate.qualityRating} • Đối tượng: {result.psychometricEstimate.targetAudience}</p>
                    </div>
                  </div>
                )}

                {activeResultTab === 'VARIANTS' && (
                  <div className="space-y-2.5">
                    {result.variants?.map((v, i) => (
                      <div key={i} className="p-2.5 rounded bg-black/40 border border-theme-accent/20 space-y-1.5">
                        <div className="flex items-center justify-between text-amber-300 font-mono font-bold text-[11px]">
                          <span>{v.title || `Biến thể song sinh #${i + 1}`}</span>
                          <span className="text-[10px] text-emerald-300 font-normal">Mã đề {102 + i}</span>
                        </div>
                        <p className="text-white/90">{v.question_text}</p>
                        <div className="text-[11px] text-white/60">
                          Đáp án đúng: <strong className="text-emerald-300 font-mono">{v.correct_key}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
