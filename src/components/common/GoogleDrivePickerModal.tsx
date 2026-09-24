import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FolderCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  FileText, 
  Layers, 
  LogIn, 
  LogOut, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  HardDrive,
  Download
} from 'lucide-react';
import { googlePickerService } from '../../services/googlePickerService';
import { PickedDriveFile } from '../../types';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFilePicked?: (file: PickedDriveFile) => void;
  defaultView?: 'ALL' | 'SPREADSHEETS' | 'DOCS_IMAGES' | 'PDFS' | 'DOCS';
  title?: string;
}

export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({
  isOpen,
  onClose,
  onFilePicked,
  defaultView = 'ALL',
  title = 'Google Drive Picker — Beyond The Internet 2026'
}) => {
  useLockBodyScroll(isOpen);

  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'SPREADSHEETS' | 'DOCS_IMAGES' | 'PDFS' | 'DOCS'>(defaultView);
  const [pickedFiles, setPickedFiles] = useState<PickedDriveFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(googlePickerService.getCurrentUser());
  const [hasToken, setHasToken] = useState(googlePickerService.isAuthenticated());

  useEffect(() => {
    if (isOpen) {
      setCurrentUser(googlePickerService.getCurrentUser());
      setHasToken(googlePickerService.isAuthenticated());
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignInGoogle = async () => {
    vibrateTap();
    soundFx.playClick();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await googlePickerService.authenticate(true);
      setHasToken(true);
      setCurrentUser(googlePickerService.getCurrentUser());
      soundFx.playSuccess();
      vibrateSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Không thể đăng nhập Google với quyền Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPicker = async (category = selectedCategory) => {
    vibrateTap();
    soundFx.playClick();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      let mimeFilter: string | undefined;
      if (category === 'SPREADSHEETS') {
        mimeFilter = 'application/vnd.google-apps.spreadsheet,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';
      } else if (category === 'DOCS_IMAGES') {
        mimeFilter = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml';
      } else if (category === 'PDFS') {
        mimeFilter = 'application/pdf';
      }

      const files = await googlePickerService.openPicker({
        viewId: category,
        multiselect: false,
        title: `Chọn tệp từ Google Drive [${category}]`,
        mimeTypes: mimeFilter
      });

      if (files && files.length > 0) {
        const picked = files[0];
        console.log('Selected file metadata:', picked);
        setPickedFiles(prev => [picked, ...prev.filter(f => f.id !== picked.id)]);
        soundFx.playSuccess();
        vibrateSuccess();

        if (onFilePicked) {
          onFilePicked(picked);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Không thể mở Google Picker.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    vibrateTap();
    soundFx.playClick();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#13072b] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-950/60 to-cyan-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Google Picker API
                </span>
              </h2>
              <p className="text-xs text-white/60">
                Chọn Google Sheets, hình ảnh, tài liệu trực tiếp từ tài khoản Google Drive của bạn
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth State Banner */}
        <div className="px-5 py-3 bg-white/5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-white/70">Trạng thái Google OAuth:</span>
            {hasToken ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã kết nối {currentUser?.email ? `(${currentUser.email})` : 'Google Drive'}
              </span>
            ) : (
              <span className="text-amber-300 font-medium">Chưa cấp quyền Google Drive</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!hasToken ? (
              <button
                onClick={handleSignInGoogle}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                <span>Đăng nhập Google</span>
              </button>
            ) : (
              <button
                onClick={async () => {
                  vibrateTap();
                  soundFx.playClick();
                  await googlePickerService.signOut();
                  setHasToken(false);
                  setCurrentUser(null);
                }}
                className="px-2.5 py-1 rounded text-white/50 hover:text-white hover:bg-white/10 text-xs flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span>Đăng xuất</span>
              </button>
            )}
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Lỗi khởi tạo Picker</p>
              <p className="opacity-90">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-300 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Category Picker Tabs */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            <label className="text-xs font-mono font-semibold text-cyan-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> CHỌN DANH MỤC TỆP CẦN DUYỆT TỪ DRIVE:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('SPREADSHEETS');
                  vibrateTap();
                  soundFx.playClick();
                }}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                  selectedCategory === 'SPREADSHEETS'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-950/50'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                <span className="text-xs font-medium">Bảng tính Sheets</span>
                <span className="text-[10px] text-white/40">.gsheet, .xlsx, .csv</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('DOCS_IMAGES');
                  vibrateTap();
                  soundFx.playClick();
                }}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                  selectedCategory === 'DOCS_IMAGES'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-950/50'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                <ImageIcon className="w-6 h-6 text-cyan-400" />
                <span className="text-xs font-medium">Hình ảnh & Media</span>
                <span className="text-[10px] text-white/40">Ảnh minh họa / VCNV</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('PDFS');
                  vibrateTap();
                  soundFx.playClick();
                }}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                  selectedCategory === 'PDFS'
                    ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-md shadow-rose-950/50'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                <FileText className="w-6 h-6 text-rose-400" />
                <span className="text-xs font-medium">Tài liệu PDF</span>
                <span className="text-[10px] text-white/40">Văn bản & Thể lệ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('ALL');
                  vibrateTap();
                  soundFx.playClick();
                }}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                  selectedCategory === 'ALL'
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-md shadow-purple-950/50'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                <FolderCheck className="w-6 h-6 text-purple-400" />
                <span className="text-xs font-medium">Tất cả tệp</span>
                <span className="text-[10px] text-white/40">Toàn bộ Google Drive</span>
              </button>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              onClick={() => handleOpenPicker()}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-500/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang tải Google Picker...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>MỞ GOOGLE PICKER ĐỂ CHỌN TỆP</span>
                </>
              )}
            </button>
          </div>

          {/* Recently Picked List */}
          {pickedFiles.length > 0 && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-white/80">
                  CÁC TỆP ĐÃ CHỌN GẦN ĐÂY ({pickedFiles.length}):
                </span>
                <button
                  onClick={() => setPickedFiles([])}
                  className="text-[11px] text-white/40 hover:text-white transition-colors"
                >
                  Xóa danh sách
                </button>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {pickedFiles.map(file => (
                  <div
                    key={file.id}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {file.iconUrl ? (
                        <img src={file.iconUrl} alt="icon" className="w-5 h-5 shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-[11px] text-white/50 font-mono flex items-center gap-2">
                          <span>{file.mimeType.split('.').pop() || file.mimeType}</span>
                          {file.sizeBytes && <span>• {formatFileSize(file.sizeBytes)}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCopy(file.id, file.id)}
                        title="Sao chép File ID"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors text-xs flex items-center gap-1 font-mono"
                      >
                        {copiedId === file.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>ID</span>
                      </button>

                      {file.url && (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Mở trên Google Drive"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {onFilePicked && (
                        <button
                          onClick={() => {
                            vibrateTap();
                            soundFx.playSuccess();
                            onFilePicked(file);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold"
                        >
                          Sử dụng
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-white/50">
          <span>Tích hợp Google Workspace Picker API theo tiêu chuẩn an toàn</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
