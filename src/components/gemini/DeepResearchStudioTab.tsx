import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  BookOpen, 
  Compass, 
  RotateCw, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Layers, 
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateError } from '../../utils/hapticUtils';

interface StepItem {
  type: string;
  name?: string;
  summary?: string;
  arguments?: any;
  result?: any;
  content?: Array<{ type: string; text?: string }>;
}

export const DeepResearchStudioTab: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [details, setDetails] = useState('');
  const [depth, setDepth] = useState<'fast' | 'max'>('fast');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [steps, setSteps] = useState<StepItem[]>([]);
  const [researchId, setResearchId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const pollTimerRef = useRef<any>(null);

  const sampleTopics = [
    {
      title: 'Đối sánh Thông tư 02/2025/TT-BGDĐT với Ma trận BTI 2026',
      desc: 'Phân tích cơ sở pháp lý và định hướng 6 miền năng lực số sinh viên',
      topic: 'Nghiên cứu cơ sở pháp lý Thông tư 02/2025/TT-BGDĐT về chuẩn năng lực số của sinh viên các cơ sở đào tạo đại học',
      details: 'Đối sánh 6 miền năng lực số của Thông tư 02/2025/TT-BGDĐT với khung năng lực số DigComp 2.2 của Châu Âu và khung UNESCO. Đề xuất ma trận câu hỏi khảo thí thực chiến cho cuộc thi BTI 2026.'
    },
    {
      title: 'Đánh giá Năng lực AI & Trí tuệ Nhân tạo Sinh viên',
      desc: 'Khảo cứu chuẩn đánh giá AI Literacy, Prompt Engineering & Đạo đức AI',
      topic: 'Khung năng lực sử dụng Trí tuệ nhân tạo (AI Literacy) cho sinh viên Việt Nam trong bối cảnh GenAI',
      details: 'Nghiên cứu các tiêu chí đánh giá kỹ năng tạo prompt, tư duy phản biện khi kiểm chứng output của AI, an toàn dữ liệu cá nhân và bản quyền trí tuệ.'
    },
    {
      title: 'Chuẩn an toàn số & An ninh mạng trong Khảo thí',
      desc: 'Dẫn xuất quy chuẩn bảo mật tài khoản, xác thực đa yếu tố & phòng chống lừa đảo mạng',
      topic: 'Chuẩn an toàn thông tin cá nhân và phòng chống tấn công phi kỹ thuật (Social Engineering) cho thế hệ số',
      details: 'Tổng hợp các tình huống khảo thí thực tiễn về nhận diện lừa đảo Deepfake, bảo mật mật khẩu OTP/Passkey, kiểm soát quyền ứng dụng trên thiết bị di động.'
    }
  ];

  const startResearch = async (overrideTopic?: string, overrideDetails?: string) => {
    const t = overrideTopic || topic;
    const d = overrideDetails || details;
    if (!t.trim() || loading) return;

    vibrateTap();
    soundFx.playClick();
    setLoading(true);
    setReport(null);
    setSteps([]);
    setStatusMsg('Đang khởi chạy Agent Deep Research Pro...');

    try {
      const res = await fetch('/api/ai/deep-research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: t.trim(),
          prompt: d.trim() || t.trim(),
          depth
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khởi chạy Deep Research.');
      }

      setResearchId(data.researchId);
      setStatusMsg('Agent Deep Research đang thu thập dẫn chứng và phân tích văn bản pháp quy...');

      // Begin polling status
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);

      let attempts = 0;
      pollTimerRef.current = setInterval(async () => {
        attempts++;
        try {
          const pollRes = await fetch(`/api/ai/deep-research/status/${data.researchId}`);
          const pollData = await pollRes.json();

          if (pollData.success) {
            if (pollData.steps && Array.isArray(pollData.steps)) {
              setSteps(pollData.steps);
            }
            if (pollData.status === 'completed') {
              clearInterval(pollTimerRef.current);
              setReport(pollData.report);
              setLoading(false);
              setStatusMsg('Khảo cứu hoàn tất.');
              soundFx.playPacingChime('complete');
              vibrateSuccess();
            } else if (pollData.status === 'failed' || pollData.status === 'cancelled') {
              clearInterval(pollTimerRef.current);
              setLoading(false);
              setStatusMsg('Tác vụ nghiên cứu gặp sự cố.');
              setReport(pollData.error || 'Không thể hoàn tất nghiên cứu.');
              soundFx.playError();
              vibrateError();
            } else {
              setStatusMsg(`Đang tiến hành nghiên cứu giai đoạn ${Math.min(4, Math.floor(attempts / 2) + 1)}/4 (Đối sánh dữ liệu)...`);
            }
          }
        } catch (e) {
          console.warn('Poll research status note:', e);
        }

        if (attempts > 30) { // 2.5 minutes timeout
          clearInterval(pollTimerRef.current);
          if (loading) {
            // Fallback to synchronous query
            try {
              setStatusMsg('Đang tổng hợp báo cáo trực tiếp...');
              const syncRes = await fetch('/api/ai/deep-research/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: t.trim(), prompt: d.trim() || t.trim() })
              });
              const syncData = await syncRes.json();
              setReport(syncData.report || 'Đã tạo báo cáo nghiên cứu.');
              setSteps(syncData.steps || []);
              soundFx.playPacingChime('complete');
            } catch {
              // Ignore
            } finally {
              setLoading(false);
            }
          }
        }
      }, 5000);

    } catch (err: any) {
      console.error(err);
      soundFx.playError();
      vibrateError();
      setReport(`❌ Lỗi: ${err?.message || 'Không thể kết nối với Agent Deep Research.'}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    vibrateSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BTI2026_Deep_Research_${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    vibrateSuccess();
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-3 p-3 sm:p-4 overflow-hidden h-full text-[#F5EFF9] bg-[#0E0322]/80">
      {/* Left Column: Form & Presets */}
      <div className="w-full md:w-5/12 flex flex-col gap-3 shrink-0 h-full overflow-y-auto custom-scrollbar pr-1">
        {/* Banner */}
        <div className="p-3 rounded-[4px] bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/30">
          <div className="flex items-center gap-2 text-emerald-300 font-mono text-xs font-bold uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
            <span>Agent Deep Research Pro (Multi-Step Engine)</span>
          </div>
          <p className="text-[11px] text-white/70 leading-relaxed font-sans">
            Agent nghiên cứu chuyên sâu đa bước với khả năng tìm kiếm dẫn chứng thực tiễn, tra cứu các văn bản pháp quy giáo dục (Thông tư 02/2025/TT-BGDĐT) và xây dựng tài liệu khảo cứu học thuật toàn diện.
          </p>
        </div>

        {/* Depth Selector */}
        <div className="flex items-center justify-between p-2 rounded-[2px] bg-white/[0.03] border border-white/10 text-xs font-mono">
          <span className="text-white/70">Mức độ nghiên cứu:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setDepth('fast');
                vibrateTap();
              }}
              className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold transition cursor-pointer ${
                depth === 'fast' ? 'bg-emerald-600 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              Nhanh (Preview)
            </button>
            <button
              type="button"
              onClick={() => {
                setDepth('max');
                vibrateTap();
              }}
              className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold transition cursor-pointer ${
                depth === 'max' ? 'bg-emerald-600 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              Chuyên Sâu (Max)
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase font-bold text-white/50 tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Chủ Đề Khảo Cứu Năng Lực Số Chuẩn</span>
          </label>
          <div className="space-y-1.5">
            {sampleTopics.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTopic(item.topic);
                  setDetails(item.details);
                  startResearch(item.topic, item.details);
                }}
                disabled={loading}
                className="w-full text-left p-2 rounded-[2px] bg-white/[0.03] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/40 transition group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-white group-hover:text-emerald-300 transition flex items-center justify-between font-mono">
                  <span>{item.title}</span>
                  <Zap className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <div className="text-[10px] text-white/50 line-clamp-1 mt-0.5 font-sans">
                  {item.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-mono uppercase font-bold text-white/60 tracking-wider mb-1 block">
              Chủ đề nghiên cứu / Câu hỏi trọng tâm
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="VD: Đối sánh Thông tư 02/2025/TT-BGDĐT với chuẩn DigComp 2.2..."
              disabled={loading}
              className="w-full p-2 rounded-[2px] bg-[#0A0218] border border-white/15 focus:border-emerald-400 text-xs font-mono text-white outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase font-bold text-white/60 tracking-wider mb-1 block">
              Yêu cầu cụ thể &amp; Định hướng đối sánh
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Nhập các yêu cầu cụ thể (VD: dẫn nguồn số liệu, gợi ý các dạng bài tập thực hành, lập ma trận khảo thí 6 miền)..."
              disabled={loading}
              rows={3}
              className="w-full p-2 rounded-[2px] bg-[#0A0218] border border-white/15 focus:border-emerald-400 text-xs font-mono text-white outline-none resize-none placeholder:text-white/30"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => startResearch()}
          disabled={loading || !topic.trim()}
          className="w-full py-2.5 px-3 rounded-[2px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          {loading ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin text-white" />
              <span>Đang tiến hành nghiên cứu đa bước...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Khởi chạy Agent Deep Research</span>
            </>
          )}
        </button>
      </div>

      {/* Right Column: Dossier Report & Findings */}
      <div className="w-full md:w-7/12 flex flex-col h-full bg-[#080114] border border-white/10 rounded-[4px] overflow-hidden">
        {/* Top Action Bar */}
        <div className="px-3 py-2 bg-white/[0.02] border-b border-white/10 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-[11px]">Báo Cáo Nghiên Cứu &amp; Đối Sánh Học Thuật</span>
          </div>

          <div className="flex items-center gap-2">
            {report && (
              <>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 px-2 rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition flex items-center gap-1 text-[10px] cursor-pointer"
                  title="Sao chép toàn bộ báo cáo"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="p-1 px-2 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1 text-[10px] cursor-pointer"
                  title="Tải tệp Markdown (.md)"
                >
                  <Download className="w-3 h-3" />
                  <span>Tải .MD</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 p-3.5 overflow-y-auto custom-scrollbar font-sans text-xs leading-relaxed text-white/90">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center text-white/60 py-12">
              <div className="w-10 h-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
              <div className="space-y-1">
                <div className="text-emerald-300 font-bold text-sm">Agent Deep Research đang khảo cứu</div>
                <div className="text-[11px] text-white/50">{statusMsg || 'Đang quét tài liệu pháp lý và học thuật...'}</div>
              </div>
            </div>
          )}

          {!loading && !report && (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-center text-white/40 py-12">
              <BookOpen className="w-8 h-8 text-white/20" />
              <p className="text-xs">Chưa có hồ sơ nghiên cứu. Chọn một chủ đề khảo cứu bên trái để kích hoạt Agent Deep Research.</p>
            </div>
          )}

          {!loading && report && (
            <div className="space-y-3">
              <div className="p-3 rounded-[2px] bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs font-mono flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Hồ Sơ Nghiên Cứu Chuẩn Hóa BTI 2026</span>
                </span>
                <span className="text-[10px] text-white/40">Grounded via Deep Research Pro</span>
              </div>

              <div className="whitespace-pre-wrap leading-relaxed select-text p-3 bg-[#05000C] border border-white/10 rounded font-sans text-xs text-white/90 shadow-inner">
                {report}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
