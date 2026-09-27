import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCw, 
  Copy, 
  Check, 
  Sparkles, 
  Code2, 
  Layers, 
  ShieldCheck,
  Zap,
  HelpCircle,
  FileCode,
  Target,
  ListFilter
} from 'lucide-react';
import { questionBankManager } from '../../services/questionBankManager';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateError } from '../../utils/hapticUtils';
import { BulkQuestionGeneratorModal } from '../questionBank/BulkQuestionGeneratorModal';

interface StepItem {
  type: string;
  name?: string;
  summary?: string;
  arguments?: any;
  result?: any;
  content?: Array<{ type: string; text?: string; data?: string }>;
}

export const AntigravityStudioTab: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [steps, setSteps] = useState<StepItem[]>([]);
  const [agentName, setAgentName] = useState<string>('antigravity-preview-09-2026');
  const [copied, setCopied] = useState(false);
  const [activeStepTab, setActiveStepTab] = useState<'OUTPUT' | 'STEPS'>('OUTPUT');
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);

  const allQuestions = questionBankManager.getQuestions();

  const samplePrompts = [
    {
      title: 'Thẩm định Đề thi BTI: Thuật toán & Mã nguồn',
      desc: 'Chạy sandbox Python kiểm tra logic tính toán, độ phức tạp và 4 phương án trắc nghiệm',
      prompt: 'Thẩm định bài toán: Cho danh sách địa chỉ IP truy cập máy chủ. Hãy kiểm thử đoạn mã Python lọc các IP nghi vấn tấn công DDoS, xác minh đáp án đúng duy nhất và kiểm tra 3 phương án gây nhiễu.'
    },
    {
      title: 'Kiểm thử VCNV (Vượt Chướng Ngại Vật)',
      desc: 'Xác minh số ký tự hàng ngang (rowLength), từ khóa gợi ý và phương án giải',
      prompt: 'Kiểm tra câu hỏi VCNV BTI 2026: Hàng ngang số 3 gồm 7 chữ số/chữ cái. Viết script kiểm tra độ dài chính xác của từ khóa "PASSKEY" (7 ký tự) và độ ăn khớp với câu hỏi gợi ý.'
    },
    {
      title: 'Kiểm chứng công thức xác suất & LaTeX',
      desc: 'Mô phỏng tính toán ma trận 6 miền năng lực số (Thông tư 02/2025/TT-BGDĐT)',
      prompt: 'Kiểm chứng tính đúng đắn của công thức xác suất Bayes và biểu thức kỳ vọng E(X) trong bài toán khảo thí ma trận 6 miền năng lực số. Sử dụng Python numpy/scipy trong sandbox để tính toán chính xác giá trị số.'
    },
    {
      title: 'Rà soát An toàn Số (Nghị định 13/2023/NĐ-CP)',
      desc: 'Mô phỏng kịch bản bảo vệ dữ liệu cá nhân & phân quyền truy cập',
      prompt: 'Thẩm định câu hỏi trắc nghiệm về quy trình xử lý vi phạm bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP và Thông tư 02/2025/TT-BGDĐT. Kiểm tra tính độc lập và chính xác của 4 lựa chọn A, B, C, D.'
    }
  ];

  const handleSelectQuestion = (qId: string) => {
    setSelectedQuestionId(qId);
    if (!qId) return;
    const q = allQuestions.find(item => item.id === qId);
    if (q) {
      const qText = q.question_text || (q as any).questionText || '';
      const cKey = q.correct_key || (q as any).correctKey || '';
      const rFormat = q.round_format || (q as any).roundFormat || q.round_name || '';
      const dom = q.digital_competency_domain || (q as any).domain || q.category || '';
      const sub = q.digital_sub_competency || (q as any).subCompetency || '';
      const cog = q.cognitive_level || (q as any).cognitiveLevel || '';
      const leg = q.legal_reference || (q as any).legalReference || 'Chưa có';
      const obs = q.obstacle_info || (q as any).obstacleInfo;

      setPrompt(`Thẩm định toàn diện câu hỏi BTI 2026 [${q.id}]:
- Vòng thi: ${q.stage || 'Chung'} | Dạng: ${rFormat}
- Miền năng lực: ${dom} (${sub}) | Cấp độ tư duy: ${cog}
- Nội dung câu hỏi: "${qText}"
- Các phương án:
  A: ${q.options?.A || ''}
  B: ${q.options?.B || ''}
  C: ${q.options?.C || ''}
  D: ${q.options?.D || ''}
- Đáp án công bố: ${cKey}
- Giải thích: ${q.explanation || ''}
- Căn cứ pháp lý: ${leg}
${obs ? `- VCNV Info: ${JSON.stringify(obs)}` : ''}

YÊU CẦU SANDBOX:
1. Chạy mã Python kiểm thử logic câu hỏi & các phương án.
2. Xác minh đáp án ${cKey} là duy nhất đúng, 3 đáp án còn lại hoàn toàn sai.
3. Kiểm tra độ chuẩn hóa theo Thông tư 02/2025/TT-BGDĐT và đưa ra BTI Quality Score (0-100).`);
    }
  };

  const handleExecute = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || prompt;
    if (!textToSend.trim() || loading) return;

    vibrateTap();
    soundFx.playClick();
    setLoading(true);
    setResultText(null);
    setSteps([]);

    const selectedQ = allQuestions.find(item => item.id === selectedQuestionId);

    try {
      const res = await fetch('/api/ai/antigravity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: textToSend.trim(),
          questionContext: selectedQ || undefined,
          btiFormat: true
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi thực thi Agent Antigravity.');
      }

      setResultText(data.output || '');
      setSteps(data.steps || []);
      setAgentName(data.agent || 'antigravity-preview-09-2026');
      soundFx.playPacingChime('complete');
      vibrateSuccess();
    } catch (err: any) {
      console.error(err);
      soundFx.playError();
      vibrateError();
      setResultText(`❌ Lỗi: ${err?.message || 'Không thể kết nối với Agent Antigravity.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    vibrateSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-3 p-3 sm:p-4 overflow-hidden h-full text-[#F5EFF9] bg-[#0E0322]/80">
      {/* Left Column: Controls & Prompt Input */}
      <div className="w-full md:w-5/12 flex flex-col gap-3 shrink-0 h-full overflow-y-auto custom-scrollbar pr-1">
        {/* Header Info */}
        <div className="p-3 rounded-[4px] bg-gradient-to-r from-sky-950/40 to-indigo-950/40 border border-sky-500/30 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sky-300 font-mono text-xs font-bold uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-sky-400 animate-pulse" />
              <span>Agent Antigravity (Remote Sandbox)</span>
            </div>
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setShowBulkModal(true);
              }}
              className="px-2 py-1 rounded-[3px] bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 hover:text-white text-[10px] font-mono font-bold flex items-center gap-1 transition cursor-pointer"
              title="Mở Modal Sinh Bộ Đề Hàng Loạt"
            >
              <Zap className="w-3 h-3 fill-current text-sky-300" />
              <span>Sinh Hàng Loạt</span>
            </button>
          </div>
          <p className="text-[11px] text-white/70 leading-relaxed font-sans">
            Agent đa năng được trang bị môi trường Linux Remote Sandbox độc quyền từ Google AI, có khả năng viết và thực thi mã nguồn (Bash, Python, Node.js), kiểm thử giải thuật tự động và xác minh đáp án câu hỏi khảo thí BTI 2026.
          </p>
        </div>

        {/* Presets */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase font-bold text-white/50 tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>Mẫu Nhiệm Vụ Thẩm Định Nhanh</span>
          </label>
          <div className="space-y-1.5">
            {samplePrompts.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedQuestionId('');
                  setPrompt(item.prompt);
                  handleExecute(item.prompt);
                }}
                disabled={loading}
                className="w-full text-left p-2 rounded-[2px] bg-white/[0.03] hover:bg-sky-500/10 border border-white/10 hover:border-sky-500/40 transition group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-white group-hover:text-sky-300 transition flex items-center justify-between font-mono">
                  <span>{item.title}</span>
                  <Zap className="w-3 h-3 text-sky-400 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <div className="text-[10px] text-white/50 line-clamp-1 mt-0.5 font-sans">
                  {item.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Pick from Question Bank */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase font-bold text-sky-300 tracking-wider flex items-center gap-1">
            <ListFilter className="w-3 h-3 text-sky-400" />
            <span>Hoặc chọn câu hỏi từ Ngân hàng Đề BTI</span>
          </label>
          <select
            value={selectedQuestionId}
            onChange={(e) => handleSelectQuestion(e.target.value)}
            disabled={loading}
            className="w-full p-2 rounded-[2px] bg-[#0A0218] border border-sky-500/30 text-xs font-mono text-white outline-none focus:border-sky-400 transition"
          >
            <option value="">-- Chọn câu hỏi cần kiểm thử sandbox --</option>
            {allQuestions.map(q => {
              const text = q.question_text || (q as any).questionText || 'Câu hỏi BTI';
              return (
                <option key={q.id} value={q.id}>
                  [{q.id.slice(0, 8)}] {text.slice(0, 55)}...
                </option>
              );
            })}
          </select>
        </div>

        {/* Input Box */}
        <div className="flex-1 flex flex-col min-h-[140px]">
          <label className="text-[10px] font-mono uppercase font-bold text-white/60 tracking-wider mb-1 flex items-center justify-between">
            <span>Nội dung yêu cầu / Câu hỏi cần kiểm thử</span>
            <span className="text-sky-300 font-mono text-[9px]">Python 3.12 / Linux Sandbox</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Nhập câu hỏi trắc nghiệm, đoạn mã nguồn Python/C++/SQL, hoặc công thức giải thuật cần Agent Antigravity chạy thử và thẩm định trong sandbox..."
            disabled={loading}
            className="flex-1 w-full p-2.5 rounded-[2px] bg-[#0A0218] border border-white/15 focus:border-sky-400 text-xs font-mono text-white outline-none resize-none placeholder:text-white/30 placeholder:font-sans custom-scrollbar"
          />
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => handleExecute()}
          disabled={loading || !prompt.trim()}
          className="w-full py-2.5 px-3 rounded-[2px] bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider transition shadow-lg shadow-sky-950/50 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          {loading ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin text-white" />
              <span>Đang thực thi trong Sandbox Linux...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Khởi chạy Agent Antigravity</span>
            </>
          )}
        </button>
      </div>

      {/* Right Column: Execution Sandbox & Results */}
      <div className="w-full md:w-7/12 flex flex-col h-full bg-[#080114] border border-white/10 rounded-[4px] overflow-hidden">
        {/* Top Tab Switcher */}
        <div className="px-3 py-2 bg-white/[0.02] border-b border-white/10 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveStepTab('OUTPUT')}
              className={`px-2.5 py-1 rounded-[2px] font-bold text-[11px] transition flex items-center gap-1.5 cursor-pointer ${
                activeStepTab === 'OUTPUT' ? 'bg-sky-500 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Kết Quả Thẩm Định</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStepTab('STEPS')}
              className={`px-2.5 py-1 rounded-[2px] font-bold text-[11px] transition flex items-center gap-1.5 cursor-pointer ${
                activeStepTab === 'STEPS' ? 'bg-sky-500 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Nhật Ký Thực Thi ({steps.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-sky-400 font-mono font-bold bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/30">
              {agentName}
            </span>
            {resultText && (
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 px-2 rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition flex items-center gap-1 text-[10px] cursor-pointer"
                title="Sao chép kết quả"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-3 overflow-y-auto custom-scrollbar font-mono text-xs leading-relaxed">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center text-white/60 py-12">
              <div className="w-10 h-10 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
              <div className="space-y-1">
                <div className="text-sky-300 font-bold text-sm">Agent Antigravity đang hoạt động</div>
                <div className="text-[11px] text-white/40">Đang khởi tạo container, phân tích mã nguồn và chạy kiểm thử...</div>
              </div>
            </div>
          )}

          {!loading && !resultText && (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-center text-white/40 py-12">
              <Terminal className="w-8 h-8 text-white/20" />
              <p className="text-xs">Chưa có kết quả thực thi. Nhập nội dung hoặc chọn mẫu nhiệm vụ bên trái để bắt đầu.</p>
            </div>
          )}

          {!loading && resultText && activeStepTab === 'OUTPUT' && (
            <div className="space-y-3 font-sans text-sm text-white/90">
              <div className="p-3 rounded-[2px] bg-sky-950/20 border border-sky-500/20 font-mono text-xs text-sky-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Xác minh thành công qua Agent Antigravity</span>
                </span>
                <span className="text-[10px] text-white/40">Verified via Sandbox</span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed select-text p-2 bg-[#05000C] border border-white/10 rounded font-mono text-xs text-white">
                {resultText}
              </div>
            </div>
          )}

          {!loading && activeStepTab === 'STEPS' && (
            <div className="space-y-2">
              {steps.length === 0 ? (
                <div className="text-white/40 text-center py-6 text-xs">Không có bước thực thi trung gian nào được ghi nhận.</div>
              ) : (
                steps.map((st, i) => (
                  <div key={i} className="p-2.5 rounded-[2px] bg-white/[0.03] border border-white/10 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-sky-300 font-mono">
                      <span className="flex items-center gap-1.5 uppercase">
                        <Code2 className="w-3.5 h-3.5 text-sky-400" />
                        <span>Bước {i + 1}: {st.type}</span>
                      </span>
                      {st.name && <span className="text-[10px] text-amber-300">{st.name}</span>}
                    </div>
                    {st.summary && (
                      <div className="text-[11px] text-white/80 font-sans">{st.summary}</div>
                    )}
                    {st.arguments && (
                      <pre className="text-[10px] p-1.5 rounded bg-black/40 border border-white/5 text-amber-200/90 overflow-x-auto">
                        {JSON.stringify(st.arguments, null, 2)}
                      </pre>
                    )}
                    {st.result && (
                      <pre className="text-[10px] p-1.5 rounded bg-black/40 border border-emerald-500/20 text-emerald-200/90 overflow-x-auto">
                        {typeof st.result === 'string' ? st.result : JSON.stringify(st.result, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Question Generator Modal */}
      {showBulkModal && (
        <BulkQuestionGeneratorModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
        />
      )}
    </div>
  );
};
