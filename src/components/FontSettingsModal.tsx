import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Type, 
  Upload, 
  Check, 
  Sparkles, 
  RotateCcw, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  FolderUp,
  FileCheck,
  ChevronRight
} from 'lucide-react';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { 
  PRESET_FONTS, 
  getActiveFont, 
  applyPresetFont, 
  uploadAndApplyCustomFont, 
  resetToDefaultFont, 
  ActiveFontState,
  PresetFont
} from '../utils/fontManager';
import { soundFx } from '../services/audioEffects';
import { vibrateTap } from '../utils/hapticUtils';

interface FontSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FontSettingsModal: React.FC<FontSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  useLockBodyScroll(isOpen);

  const [activeFont, setActiveFont] = useState<ActiveFontState>(() => getActiveFont());
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string>(
    'Hội đồng khảo thí BTI 2026 • Đánh giá Năng lực số người học theo TT 02/2025/TT-BGDĐT'
  );
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when custom font changes globally
  useEffect(() => {
    if (!isOpen) return;
    const handleFontChange = () => {
      setActiveFont(getActiveFont());
    };
    window.addEventListener('fontchange', handleFontChange);
    return () => window.removeEventListener('fontchange', handleFontChange);
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  // Handle Preset selection
  const handleSelectPreset = async (preset: PresetFont) => {
    vibrateTap();
    soundFx.playClick();
    setUploadError(null);
    setUploadSuccess(`Đã áp dụng phông chữ "${preset.name}" cho toàn bộ ứng dụng!`);
    await applyPresetFont(preset.id);
    setActiveFont(getActiveFont());
  };

  // Handle file processing
  const handleProcessFontFile = async (file: File) => {
    const validExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => lowerName.endsWith(ext));

    if (!isValid) {
      setUploadError('Định dạng file không hỗ trợ. Vui lòng chọn file .ttf, .otf, .woff hoặc .woff2.');
      setUploadSuccess(null);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const result = await uploadAndApplyCustomFont(file);
      soundFx.playClick();
      vibrateTap();
      setActiveFont(result);
      setUploadSuccess(`Đã tải lên và áp dụng font "${result.fontName}" (${(file.size / 1024).toFixed(1)} KB) cho toàn bộ ứng dụng!`);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Không thể nạp file font này vào hệ thống.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFontFile(file);
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFontFile(file);
    }
  };

  // Handle Reset to Default
  const handleResetDefault = async () => {
    vibrateTap();
    soundFx.playClick();
    await resetToDefaultFont();
    setActiveFont(getActiveFont());
    setUploadError(null);
    setUploadSuccess('Đã khôi phục phông chữ mặc định Lexend cho toàn bộ ứng dụng.');
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-4 animate-fadeIn select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-md" 
        onClick={() => { vibrateTap(); onClose(); }}
      />

      {/* Dialog Container */}
      <div className="relative w-full max-w-2xl bg-[#170634] border border-theme-accent/30 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 font-sans">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-theme-accent/20 flex items-center justify-between bg-[#210c47]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[4px] bg-theme-accent/15 text-theme-accent border border-theme-accent/30 flex items-center justify-center shrink-0">
              <Type className="w-5 h-5 text-theme-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-mono tracking-wider">
                  CÀI ĐẶT PHÔNG CHỮ TOÀN HỆ THỐNG
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-theme-accent/20 text-theme-accent border border-theme-accent/30">
                  {activeFont.fontName}
                </span>
              </div>
              <p className="text-[11px] text-[#B6A6D8] font-mono">
                Tải lên font riêng hoặc chọn bộ font tuyển chọn áp dụng tức thì cho toàn bộ ứng dụng
              </p>
            </div>
          </div>
          <button
            onClick={() => { vibrateTap(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-[4px] text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 text-xs">
          
          {/* Status Banners */}
          {uploadSuccess && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-[4px] text-emerald-300 flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-mono text-[11.5px] leading-tight">{uploadSuccess}</span>
            </div>
          )}

          {uploadError && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-[4px] text-rose-300 flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-mono text-[11.5px] leading-tight">{uploadError}</span>
            </div>
          )}

          {/* SECTION 1: UPLOAD CUSTOM FONT */}
          <div className="p-4 bg-[#241148]/70 rounded-lg border border-theme-accent/25 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-mono font-bold text-xs">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>TẢI LÊN PHÔNG CHỮ RIÊNG TỪ MÁY TÍNH</span>
              </div>
              <span className="text-[10.5px] text-slate-400 font-mono">
                Hỗ trợ .ttf, .otf, .woff, .woff2
              </span>
            </div>

            <p className="text-slate-300 text-[11.5px] leading-relaxed">
              Bạn có thể tải lên bất kỳ file font nào từ máy tính. Font sẽ được lưu trữ cục bộ trên trình duyệt (IndexedDB) và tự động áp dụng trên mọi trang, nút bấm, đề thi và bản in.
            </p>

            {/* Drag & Drop Box */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer transition ${
                isDragOver 
                  ? 'border-amber-400 bg-amber-500/10' 
                  : 'border-theme-accent/30 bg-black/20 hover:border-theme-accent/60 hover:bg-black/30'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" 
                className="hidden" 
                onChange={handleFileChange}
              />
              <div className="w-12 h-12 rounded-full bg-theme-accent/15 border border-theme-accent/30 flex items-center justify-center text-theme-accent">
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-theme-accent border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FolderUp className="w-6 h-6 text-theme-accent" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-white font-mono">
                  {isUploading ? 'Đang nạp và đăng ký font...' : 'Nhấp để chọn file font hoặc kéo thả vào đây'}
                </div>
                <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                  Định dạng: TrueType (.ttf), OpenType (.otf), Web Open Font (.woff, .woff2)
                </div>
              </div>
            </div>

            {/* Currently Active Custom Font Card if in custom mode */}
            {activeFont.mode === 'custom' && (
              <div className="mt-2 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold font-mono">
                    Aa
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
                      <span>{activeFont.fontName}</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded">
                        Đang hoạt động toàn app
                      </span>
                    </div>
                    <div className="text-[10.5px] text-slate-300 font-mono">
                      File: {activeFont.customFileName || 'font.ttf'} 
                      {activeFont.customFileSize ? ` • ${(activeFont.customFileSize / 1024).toFixed(1)} KB` : ''}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="text-xs font-mono text-slate-300 hover:text-white px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 transition cursor-pointer"
                >
                  Xoá font này
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: CURATED VIETNAMESE GOOGLE FONTS */}
          <div className="p-4 bg-[#241148]/70 rounded-lg border border-theme-accent/25 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-mono font-bold text-xs">
                <Sparkles className="w-4 h-4 text-theme-accent" />
                <span>BỘ PHÔNG CHỮ VIỆT HÓA TUYỂN CHỌN (1-CLICK ĐỔI TOÀN BỘ APP)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_FONTS.map((preset) => {
                const isSelected = activeFont.mode === 'preset' && activeFont.presetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-theme-accent/25 border-theme-accent shadow-md text-white'
                        : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-white font-mono flex items-center gap-1.5">
                          {preset.name}
                          {preset.id === 'lexend' && (
                            <span className="text-[9.5px] font-normal text-amber-300 bg-amber-400/20 px-1.5 py-0.2 rounded">
                              Mặc định
                            </span>
                          )}
                        </span>
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-theme-accent text-[#190839] flex items-center justify-center font-bold">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-400">
                            {preset.category}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                        {preset.description}
                      </p>
                    </div>

                    {/* Preview sample */}
                    <div 
                      className="mt-3 pt-2 border-t border-white/10 text-xs text-white/90 truncate"
                      style={{ fontFamily: preset.fontFamily }}
                    >
                      BTI 2026: Đề thi đánh giá năng lực số
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: LIVE TYPOGRAPHY PREVIEW CANVAS */}
          <div className="p-4 bg-[#241148]/70 rounded-lg border border-theme-accent/25 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-mono font-bold text-xs">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>KHUNG XEM THỰC TẾ PHÔNG CHỮ HIỆN TẠI</span>
              </div>
              <span className="text-[10.5px] text-theme-accent font-mono">
                Font: {activeFont.fontName}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">Văn bản mẫu:</span>
                <input
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/20 px-2.5 py-1 rounded text-white text-xs outline-none focus:border-theme-accent font-mono"
                  placeholder="Nhập văn bản bất kỳ để kiểm tra hiển thị..."
                />
              </div>

              {/* Simulated Paper Box */}
              <div className="p-4 rounded bg-white text-slate-950 shadow-inner space-y-2 select-text">
                <div className="text-base sm:text-lg font-bold leading-snug border-b border-gray-300 pb-2">
                  {previewText}
                </div>
                <div className="text-xs text-gray-700 leading-relaxed">
                  <strong>Kiểm tra dấu tiếng Việt:</strong> 
                  <span className="block font-medium mt-0.5">
                    Ă, Â, Đ, Ê, Ô, Ơ, Ư — à, á, ả, ã, ạ, ắ, ằ, ẳ, ẵ, ặ, ế, ề, ể, ễ, ệ, ố, ồ, ổ, ỗ, ộ, ớ, ờ, ở, ỡ, ợ, ứ, ừ, ử, ữ, ự, kỳ, mỹ, kỹ...
                  </span>
                </div>
                <div className="text-xs text-gray-600 border-t border-gray-200 pt-1 flex justify-between font-mono">
                  <span>Số & Ký hiệu: 0123456789 (±, ×, ÷, =, %, $, €, ©, ®)</span>
                  <span className="text-[10.5px] text-gray-400">Xem trước chuẩn</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#190839] border-t border-theme-accent/25 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleResetDefault}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-white/20 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-mono transition cursor-pointer"
            title="Khôi phục font mặc định SVN-Gilroy"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Về font mặc định (SVN-Gilroy)</span>
          </button>

          <button
            type="button"
            onClick={() => { vibrateTap(); onClose(); }}
            className="px-5 py-1.5 bg-theme-accent hover:bg-[#FCEEEC] text-[#190839] font-mono font-bold text-xs rounded-[4px] shadow-md transition cursor-pointer"
          >
            Hoàn tất & Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
