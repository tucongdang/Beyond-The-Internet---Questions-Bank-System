import React, { useState, useRef } from 'react';
import { 
  Film, 
  Upload, 
  Download, 
  RefreshCw, 
  Play, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Layers, 
  CreditCard,
  Info,
  Maximize2
} from 'lucide-react';
import { generateVeoVideo } from '../../services/geminiStudioService';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';

interface VeoVideoStudioTabProps {
  initialImage?: string | null;
}

const MOTION_PROMPT_PRESETS = [
  'Chuyển động camera lướt vào cận cảnh (slow push-in), ánh sáng neon chuyển động huyền ảo',
  'Góc quay fly-cam toàn cảnh mượt mà, hiệu ứng sóng dữ liệu kỹ thuật số lan tỏa',
  'Chuyển động xoay nhẹ 3D (subtle orbit), các chi tiết công nghệ phát sáng sống động',
  'Hiệu ứng bão điện từ và các hạt ánh sáng chuyển động chậm như phim điện ảnh'
];

export const VeoVideoStudioTab: React.FC<VeoVideoStudioTabProps> = ({ initialImage }) => {
  const [base64Image, setBase64Image] = useState<string | null>(initialImage || null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [prompt, setPrompt] = useState<string>('Chuyển động camera mượt mà, ánh sáng điện ảnh sống động');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setBase64Image(dataUrl);
      setMimeType(file.type || 'image/png');
      setErrorMessage(null);
      soundFx.playClick();
      vibrateTap();
    };
    reader.readAsDataURL(file);
  };

  const handleStartVideoGeneration = async () => {
    if (!base64Image) {
      setErrorMessage('Vui lòng tải lên một bức ảnh trước khi tạo video.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedVideoUrl(null);
    vibrateTap();
    soundFx.playClick();

    try {
      const result = await generateVeoVideo(
        {
          prompt: prompt.trim() || undefined,
          base64Image,
          mimeType,
          aspectRatio
        },
        (status) => setStatusMessage(status)
      );

      setGeneratedVideoUrl(result.videoUrl);
      soundFx.playSuccess();
      vibrateSuccess();
    } catch (err: any) {
      console.error('Veo video generation error:', err);
      setErrorMessage(err.message || 'Lỗi trong quá trình render video với Veo 3.1.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedVideoUrl) return;
    const a = document.createElement('a');
    a.href = generatedVideoUrl;
    a.download = `bti-veo-${Date.now()}.mp4`;
    a.click();
    vibrateTap();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 h-full flex-1 min-h-0 overflow-hidden">
      {/* Left Column: Settings & Input */}
      <div className="lg:w-[48%] xl:w-[44%] flex flex-col h-full min-h-0 overflow-y-auto pr-1 sm:pr-2 space-y-3 shrink-0">
        {/* Fluent Callout / Banner Info */}
        <div className="p-2.5 sm:p-3 bg-[#1B0F38]/80 border border-cyan-500/25 rounded-[4px] text-xs space-y-1 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Film className="w-4 h-4 text-cyan-400" />
              <span>Mô hình: <strong className="font-mono text-white">veo-3.1-fast-generate-preview</strong></span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-cyan-500/20 text-cyan-200">720p HD</span>
          </div>
          <p className="text-[11px] text-[#B6A6D8]">
            Tạo hoạt ảnh chuyển động điện ảnh mượt mà từ ảnh tĩnh phục vụ trình chiếu tại các vòng thi BTI.
          </p>
        </div>

        {/* Source Image Selector */}
        <div className="space-y-1.5 shrink-0">
          <label className="text-xs font-semibold text-white/80 flex items-center justify-between">
            <span>Hình ảnh đầu vào (Input Source)</span>
            {base64Image && (
              <button
                onClick={() => setBase64Image(null)}
                className="text-[11px] text-rose-400 hover:underline cursor-pointer"
              >
                Chọn ảnh khác
              </button>
            )}
          </label>

          {base64Image ? (
            <div className="relative h-36 rounded-[4px] border border-cyan-500/30 overflow-hidden bg-[#0D0420]/60 flex items-center justify-center group">
              <img src={base64Image} alt="Input Source" className="h-full object-contain" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white gap-1 transition-opacity font-semibold cursor-pointer"
              >
                <Upload className="w-4 h-4" /> Thay đổi ảnh
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
              }}
              className="h-32 border border-dashed border-cyan-500/30 hover:border-cyan-400 rounded-[4px] bg-[#0D0420]/40 hover:bg-[#0D0420]/70 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-white/60 hover:text-white"
            >
              <Upload className="w-5 h-5 text-cyan-400" />
              <p className="text-xs font-medium">Bấm tải ảnh lên hoặc kéo thả vào đây</p>
              <span className="text-[10px] text-white/40">PNG, JPG sắc nét để video có độ phân giải cao nhất</span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
            }}
          />
        </div>

        {/* Aspect Ratio Selector (16:9 Landscape vs 9:16 Portrait) */}
        <div className="space-y-1.5 shrink-0">
          <label className="text-xs font-semibold text-white/80">Tỷ lệ khung hình video</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setAspectRatio('16:9');
                vibrateTap();
              }}
              className={`py-2 px-3 rounded-[4px] text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                aspectRatio === '16:9'
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-[#0c031d] border-transparent shadow-sm'
                  : 'bg-[#241148]/60 text-white/70 hover:bg-[#3E1D74]/70 hover:text-white border-white/10'
              }`}
            >
              <span className="font-mono font-bold">16:9</span>
              <span className="text-[11px] font-normal opacity-85">(Màn chiếu / TV)</span>
            </button>

            <button
              onClick={() => {
                setAspectRatio('9:16');
                vibrateTap();
              }}
              className={`py-2 px-3 rounded-[4px] text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                aspectRatio === '9:16'
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-[#0c031d] border-transparent shadow-sm'
                  : 'bg-[#241148]/60 text-white/70 hover:bg-[#3E1D74]/70 hover:text-white border-white/10'
              }`}
            >
              <span className="font-mono font-bold">9:16</span>
              <span className="text-[11px] font-normal opacity-85">(Di động / Shorts)</span>
            </button>
          </div>
        </div>

        {/* Prompt Direction */}
        <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
          <label className="text-xs font-semibold text-white/80 flex items-center justify-between">
            <span>Chỉ đạo chuyển động & góc quay (Prompt)</span>
            <span className="text-[10px] font-mono text-white/40">{prompt.length}/300 ký tự</span>
          </label>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Mô tả hướng di chuyển camera, ánh sáng, tốc độ chuyển động..."
            rows={2}
            className="fluent-input w-full p-2.5 text-xs sm:text-sm text-white placeholder-white/40 resize-none rounded-[4px]"
          />

          {/* Quick Presets */}
          <div className="space-y-1 mt-1 shrink-0">
            <span className="text-[11px] text-white/40">Gợi ý chuyển động:</span>
            <div className="flex flex-col gap-1 max-h-24 overflow-y-auto no-scrollbar">
              {MOTION_PROMPT_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(p)}
                  className="text-[10px] sm:text-[11px] bg-[#241148]/60 hover:bg-[#3E1D74]/80 text-white/75 hover:text-white px-2 py-1 rounded-[4px] text-left truncate transition-colors border border-theme-accent/15 cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-2.5 rounded-[4px] bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="font-semibold">{errorMessage}</p>
              {errorMessage.includes('Paid API Key') && (
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Lưu ý: Mô hình Video Veo 3.1 hiện yêu cầu Google Cloud Project có kích hoạt thanh toán (Pay-as-you-go). Chatbot và Tạo ảnh Gemini chạy ổn định trên gói Free.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleStartVideoGeneration}
          disabled={isGenerating || !base64Image}
          className="w-full py-2.5 rounded-[4px] bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 text-[#0c031d] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md hover:brightness-110 active:scale-98 disabled:opacity-50 disabled:pointer-events-none transition-all shrink-0"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-black" />
              <span>Đang kết nối & tạo video Veo 3.1...</span>
            </>
          ) : (
            <>
              <Film className="w-4 h-4" />
              <span>Bắt đầu Animate Video</span>
            </>
          )}
        </button>
      </div>

      {/* Right Column: Video Player Stage (Fluent Card) */}
      <div className="flex-1 flex flex-col fluent-card bg-[#120529]/80 rounded-[6px] border border-theme-accent/25 p-3 sm:p-4 min-h-0 justify-between relative overflow-hidden">
        <div className="flex items-center justify-between pb-2.5 border-b border-theme-accent/15 shrink-0">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Trình chiếu Video Veo 3.1</span>
          </div>
          <span className="text-[10px] font-mono text-white/50 bg-[#0D0420]/60 px-1.5 py-0.5 rounded-[2px]">MP4 H.264 / 720p</span>
        </div>

        {/* Display Stage */}
        <div className="flex-1 flex items-center justify-center p-2 relative overflow-hidden min-h-0">
          {generatedVideoUrl ? (
            <video
              src={generatedVideoUrl}
              controls
              autoPlay
              loop
              playsInline
              className={`rounded-[4px] shadow-2xl border border-cyan-500/30 animate-fadeIn max-h-full max-w-full object-contain ${
                aspectRatio === '9:16' ? 'w-auto' : 'w-full'
              }`}
            />
          ) : (
            <div className="text-center text-white/40 space-y-2 select-none">
              <Play className="w-12 h-12 mx-auto text-white/20" />
              <p className="text-xs font-medium">Chưa có video nào được render</p>
              <p className="text-[11px] text-white/30">Chọn ảnh và nhấn "Bắt đầu Animate Video" để khởi tạo</p>
            </div>
          )}

          {isGenerating && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-4 text-center text-cyan-300">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
                <Film className="w-4 h-4 absolute inset-0 m-auto text-cyan-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold text-white">Veo 3.1 đang xử lý chuyển động</p>
                <p className="text-[11px] text-cyan-300 font-mono transition-all max-w-xs">
                  {statusMessage || 'Đang kết nối cụm máy chủ GPU Google DeepMind...'}
                </p>
              </div>
              <p className="text-[10px] text-white/40 max-w-xs">
                Thời gian xử lý thường từ 30 - 60 giây để đảm bảo độ mượt 24fps
              </p>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        {generatedVideoUrl && (
          <div className="pt-2.5 border-t border-theme-accent/15 flex justify-between items-center shrink-0">
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Video đã hoàn thành
            </span>

            <button
              onClick={handleDownload}
              className="fluent-btn-primary px-3.5 py-1.5 rounded-[4px] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Video MP4</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
