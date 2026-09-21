import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Upload, 
  Download, 
  RefreshCw, 
  Wand2, 
  Film, 
  Copy, 
  Check, 
  Crop, 
  Layers, 
  AlertCircle,
  Eye,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { generateOrEditImage } from '../../services/geminiStudioService';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';

interface GeminiImageStudioTabProps {
  onSendToVideo?: (base64Image: string) => void;
}

const PRESET_IMAGE_PROMPTS = [
  'Biểu tượng Chướng Ngại Vật: Chiếc khiên số phát sáng bảo vệ dữ liệu cá nhân, phong cách 3D cyber neon',
  'Minh họa vụ lừa đảo Deepfake cuộc gọi video mạo danh người thân mượn tiền khẩn cấp',
  'Khái niệm Bức tường lửa (Firewall) và Mật mã 2 lớp 2FA ngăn chặn tin tặc xâm nhập',
  'Mô phỏng bão thông tin và tin giả (Fake News) lan truyền trên các mạng xã hội di động',
  'Học sinh Việt Nam tương tác với trí tuệ nhân tạo tương lai trong lớp học thông minh 2026'
];

export const GeminiImageStudioTab: React.FC<GeminiImageStudioTabProps> = ({ onSendToVideo }) => {
  const [mode, setMode] = useState<'generate' | 'edit'>('generate');
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setBase64Image(dataUrl);
      setMimeType(file.type || 'image/png');
      setErrorMsg(null);
      soundFx.playClick();
      vibrateTap();
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateOrEdit = async () => {
    if (!prompt.trim()) {
      setErrorMsg('Vui lòng nhập mô tả bức ảnh bạn muốn tạo hoặc chỉnh sửa.');
      return;
    }
    if (mode === 'edit' && !base64Image) {
      setErrorMsg('Vui lòng tải lên ảnh gốc để chỉnh sửa.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    vibrateTap();
    soundFx.playClick();

    try {
      const res = await generateOrEditImage({
        prompt,
        base64Image: mode === 'edit' ? (base64Image || undefined) : undefined,
        mimeType: mode === 'edit' ? mimeType : undefined,
        aspectRatio,
        mode
      });

      setResultImage(res.imageUrl);
      setUsedModel(res.usedModel);
      soundFx.playSuccess();
      vibrateSuccess();
    } catch (err: any) {
      console.error('Image gen error:', err);
      setErrorMsg(err.message || 'Lỗi khi tạo ảnh với Gemini. Vui lòng kiểm tra lại prompt.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `bti-gemini-${Date.now()}.png`;
    a.click();
    vibrateTap();
  };

  const handleCopyToClipboard = async () => {
    if (!resultImage) return;
    try {
      const res = await fetch(resultImage);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      vibrateTap();
    } catch {
      // Fallback text copy
      navigator.clipboard.writeText(resultImage);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 h-full flex-1 min-h-0 overflow-hidden">
      {/* Left Column: Controls & Prompt */}
      <div className="lg:w-[48%] xl:w-[44%] flex flex-col h-full min-h-0 overflow-y-auto pr-1 sm:pr-2 space-y-3 shrink-0">
        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0D0420]/80 rounded-[4px] border border-theme-accent/20 w-fit shrink-0">
          <button
            onClick={() => {
              setMode('generate');
              vibrateTap();
            }}
            className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'generate'
                ? 'fluent-btn-primary shadow-sm font-bold'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tạo ảnh mới (Text-to-Image)</span>
          </button>

          <button
            onClick={() => {
              setMode('edit');
              vibrateTap();
            }}
            className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'edit'
                ? 'fluent-btn-primary shadow-sm font-bold'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Chỉnh sửa ảnh</span>
          </button>
        </div>

        {/* Model info banner */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#241148]/60 border border-theme-accent/20 rounded-[4px] text-xs shrink-0">
          <div className="flex items-center gap-2 text-white/90">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Model: <strong className="font-mono text-theme-accent">gemini-3.1-flash-image-preview</strong></span>
          </div>
          <span className="text-[10px] font-mono text-white/50 bg-[#0D0420]/60 px-1.5 py-0.5 rounded-[2px]">Tự động fallback</span>
        </div>

        {/* Edit mode: Image Upload Zone */}
        {mode === 'edit' && (
          <div className="space-y-1.5 shrink-0">
            <label className="text-xs font-semibold text-white/80 flex items-center justify-between">
              <span>Ảnh gốc cần chỉnh sửa</span>
              {base64Image && (
                <button
                  onClick={() => setBase64Image(null)}
                  className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                >
                  Xóa ảnh
                </button>
              )}
            </label>

            {base64Image ? (
              <div className="relative h-32 rounded-[4px] border border-theme-accent/30 overflow-hidden bg-[#0D0420]/60 flex items-center justify-center group">
                <img src={base64Image} alt="Base" className="h-full object-contain" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white gap-1 transition-opacity font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Thay ảnh khác
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
                className="h-28 border border-dashed border-theme-accent/30 hover:border-theme-accent rounded-[4px] bg-[#0D0420]/40 hover:bg-[#0D0420]/70 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-white/60 hover:text-white"
              >
                <Upload className="w-5 h-5 text-theme-accent" />
                <p className="text-xs font-medium">Bấm để tải ảnh lên hoặc kéo thả vào đây</p>
                <span className="text-[10px] text-white/40">PNG, JPG, WEBP tối đa 20MB</span>
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
        )}

        {/* Aspect Ratio Selector */}
        <div className="space-y-1.5 shrink-0">
          <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
            <Crop className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tỷ lệ khung hình (Aspect Ratio)</span>
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {(['1:1', '16:9', '9:16', '4:3', '3:4'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => {
                  setAspectRatio(ratio);
                  vibrateTap();
                }}
                className={`py-1.5 px-1 text-center rounded-[4px] text-xs font-mono font-bold transition-all border cursor-pointer ${
                  aspectRatio === ratio
                    ? 'fluent-btn-primary border-transparent shadow-sm font-bold'
                    : 'bg-[#241148]/60 text-white/70 hover:bg-[#3E1D74]/70 hover:text-white border-white/10'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
          <label className="text-xs font-semibold text-white/80 flex items-center justify-between">
            <span>{mode === 'generate' ? 'Mô tả hình ảnh (Prompt)' : 'Yêu cầu chỉnh sửa'}</span>
            <span className="text-[10px] font-mono text-white/40">{prompt.length}/500 ký tự</span>
          </label>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mode === 'generate'
                ? 'Ví dụ: Chiếc khiên số an toàn thông tin phát sáng 3D cyber neon chuẩn bị cho câu hỏi BTI 2026...'
                : 'Ví dụ: Thêm hiệu ứng chùm sáng xanh vào nền và đổi màu viền sang vàng ánh kim...'
            }
            rows={3}
            className="fluent-input w-full p-2.5 sm:p-3 text-xs sm:text-sm text-white placeholder-white/40 resize-none rounded-[4px]"
          />

          {/* Prompt Presets */}
          <div className="space-y-1 mt-1 shrink-0">
            <span className="text-[11px] text-white/40">Gợi ý chủ đề BTI:</span>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto no-scrollbar">
              {PRESET_IMAGE_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(p)}
                  className="text-[10px] sm:text-[11px] bg-[#241148]/60 hover:bg-[#3E1D74]/80 text-white/80 hover:text-white px-2 py-1 rounded-[4px] text-left truncate max-w-full transition-colors border border-theme-accent/15 cursor-pointer"
                  title={p}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-[4px] bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleGenerateOrEdit}
          disabled={isProcessing || !prompt.trim() || (mode === 'edit' && !base64Image)}
          className="fluent-btn-primary w-full py-2.5 rounded-[4px] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none shrink-0 shadow-md"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang sinh ảnh bằng Gemini AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{mode === 'generate' ? 'Tạo hình ảnh ngay' : 'Thực hiện chỉnh sửa'}</span>
            </>
          )}
        </button>
      </div>

      {/* Right Column: Visual Result Preview & Export Options (Fluid Card) */}
      <div className="flex-1 flex flex-col fluent-card bg-[#120529]/80 rounded-[6px] border border-theme-accent/25 p-3 sm:p-4 min-h-0 justify-between relative overflow-hidden">
        <div className="flex items-center justify-between pb-2.5 border-b border-theme-accent/15 shrink-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-theme-accent" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Xem trước hình ảnh</span>
          </div>
          {usedModel && (
            <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded-[2px] border border-cyan-500/20">
              {usedModel}
            </span>
          )}
        </div>

        {/* Image Stage (scales dynamically to remaining height) */}
        <div className="flex-1 flex items-center justify-center p-2 relative overflow-hidden min-h-0">
          {resultImage ? (
            <img
              src={resultImage}
              alt="Generated Result"
              className="max-h-full max-w-full object-contain rounded-[4px] shadow-2xl border border-theme-accent/20 animate-fadeIn"
            />
          ) : (
            <div className="text-center text-white/40 space-y-2 select-none">
              <ImageIcon className="w-12 h-12 mx-auto text-white/20" />
              <p className="text-xs font-medium">Chưa có hình ảnh nào được tạo</p>
              <p className="text-[11px] text-white/30">Nhập prompt và bấm "Tạo hình ảnh ngay" để bắt đầu</p>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5 text-theme-accent">
              <RefreshCw className="w-7 h-7 animate-spin" />
              <p className="text-xs font-semibold text-white">Gemini đang dựng hình ảnh...</p>
              <span className="text-[10px] text-white/60">Tốc độ xử lý từ 3 - 6 giây</span>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        {resultImage && (
          <div className="pt-2.5 border-t border-theme-accent/15 flex flex-wrap gap-2 justify-between items-center shrink-0">
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="fluent-btn-secondary px-3 py-1.5 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                title="Tải ảnh PNG về máy"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải PNG</span>
              </button>

              <button
                onClick={handleCopyToClipboard}
                className="fluent-btn-secondary px-3 py-1.5 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                title="Sao chép ảnh vào clipboard"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>
            </div>

            {onSendToVideo && (
              <button
                onClick={() => {
                  onSendToVideo(resultImage);
                  soundFx.playSuccess();
                  vibrateSuccess();
                }}
                className="px-3.5 py-1.5 rounded-[4px] bg-gradient-to-r from-cyan-400 to-sky-400 text-[#0c031d] text-xs font-bold flex items-center gap-1.5 shadow-sm hover:brightness-110 transition-all cursor-pointer"
              >
                <Film className="w-3.5 h-3.5 text-black" />
                <span>Biến thành Video Veo</span>
                <ChevronRight className="w-3.5 h-3.5 text-black" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
