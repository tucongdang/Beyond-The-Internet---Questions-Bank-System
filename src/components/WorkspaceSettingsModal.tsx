import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { 
  X, 
  Palette, 
  Check, 
  Settings, 
  Moon, 
  Volume2, 
  Smartphone, 
  Contrast, 
  Type, 
  ChevronRight,
  Download,
  Database,
  CheckCircle2,
  FileJson,
  Sparkles,
  HardDriveDownload
} from 'lucide-react';
import { AccentTheme, THEMES, getAccentTheme, setAccentTheme, getWorkspaceHighContrast, setWorkspaceHighContrast } from '../utils/themeManager';
import { getActiveFont, PRESET_FONTS, applyPresetFont, ActiveFontState } from '../utils/fontManager';
import { questionBankManager } from '../services/questionBankManager';
import { INITIAL_QUESTION_BANK } from '../data/questionBank';
import { soundFx } from '../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../utils/hapticUtils';

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFontModal?: () => void;
}

export const WorkspaceSettingsModal: React.FC<WorkspaceSettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenFontModal
}) => {
  useLockBodyScroll(isOpen);
  
  const [accentTheme, setAccentThemeState] = useState<AccentTheme>(getAccentTheme());
  const [isHighContrast, setIsHighContrast] = useState<boolean>(getWorkspaceHighContrast());
  const [activeFont, setActiveFont] = useState<ActiveFontState>(() => getActiveFont());
  const [questionCount, setQuestionCount] = useState<number>(() => {
    try {
      const q = questionBankManager.getQuestions();
      return q && q.length > 0 ? q.length : INITIAL_QUESTION_BANK.length;
    } catch {
      return INITIAL_QUESTION_BANK.length;
    }
  });
  const [backupStatus, setBackupStatus] = useState<{
    status: 'idle' | 'exporting' | 'success';
    message?: string;
  }>({ status: 'idle' });

  useEffect(() => {
    if (!isOpen) return;
    const handleThemeChange = () => setAccentThemeState(getAccentTheme());
    window.addEventListener('themechange', handleThemeChange);

    const handleHcChange = () => setIsHighContrast(getWorkspaceHighContrast());
    window.addEventListener('wshc_change', handleHcChange);

    const handleFontChange = () => setActiveFont(getActiveFont());
    window.addEventListener('fontchange', handleFontChange);

    // Update question count on open
    try {
      const q = questionBankManager.getQuestions();
      setQuestionCount(q && q.length > 0 ? q.length : INITIAL_QUESTION_BANK.length);
    } catch {
      setQuestionCount(INITIAL_QUESTION_BANK.length);
    }

    return () => {
      window.removeEventListener('themechange', handleThemeChange);
      window.removeEventListener('wshc_change', handleHcChange);
      window.removeEventListener('fontchange', handleFontChange);
    };
  }, [isOpen]);

  const handleSetTheme = (t: AccentTheme) => {
    setAccentThemeState(t);
    setAccentTheme(t);
    soundFx.playClick();
    vibrateTap();
  };

  const handleToggleHighContrast = () => {
    const next = !isHighContrast;
    setWorkspaceHighContrast(next);
    soundFx.playClick();
    vibrateTap();
  };

  const handleBackupQuestionBank = () => {
    try {
      setBackupStatus({ status: 'exporting' });
      soundFx.playClick();
      vibrateTap();

      // Retrieve all questions
      let questions = questionBankManager.getQuestions();
      if (!questions || questions.length === 0) {
        questions = [...INITIAL_QUESTION_BANK];
      }

      // Create backup JSON with formatted indentation
      const jsonString = JSON.stringify(questions, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const fileName = `BTI2026_NganHangCauHoi_Backup_${dateStr}.json`;

      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = fileName;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);

      soundFx.playSuccess();
      vibrateSuccess();

      setBackupStatus({ 
        status: 'success', 
        message: `Đã sao lưu ${questions.length} câu hỏi vào tệp "${fileName}"!` 
      });

      setTimeout(() => {
        setBackupStatus({ status: 'idle' });
      }, 5000);
    } catch (err) {
      setBackupStatus({ 
        status: 'idle' 
      });
      console.error('Lỗi khi sao lưu dữ liệu:', err);
    }
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={() => { vibrateTap(); onClose(); }}
      />
      <div className="relative w-full max-w-md bg-[#190839] border border-theme-accent/30 rounded-lg shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[4px] bg-theme-accent/20 text-theme-accent flex items-center justify-center border border-theme-accent/30">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono tracking-wider">Cài Đặt Workspace</h2>
              <p className="text-[10px] text-white/50 font-mono">Tùy chỉnh không gian làm việc cá nhân</p>
            </div>
          </div>
          <button
            onClick={() => { vibrateTap(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-[4px] text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Theme Color */}
          <div className="p-4 rounded-[4px] bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center gap-2.5 mb-2">
              <Palette className="w-4 h-4 text-theme-accent" />
              <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                Màu Chủ Đạo Giao Diện
              </h4>
            </div>
            <p className="text-[11px] text-white/50 mb-3">
              Tùy chỉnh màu sắc điểm nhấn của ứng dụng theo sở thích cá nhân. Áp dụng ngay lập tức.
            </p>
            <div className="flex items-center gap-3">
              {Object.entries(THEMES).map(([key, themeObj]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSetTheme(key as AccentTheme)}
                  className={`relative w-8 h-8 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                    accentTheme === key 
                      ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' 
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: themeObj.color }}
                  title={themeObj.name}
                >
                  {accentTheme === key && <Check className="w-4 h-4 text-black drop-shadow-sm" />}
                </button>
              ))}
            </div>
          </div>
          {/* System Typography & Custom Font Upload */}
          <div className="p-4 rounded-[4px] bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Type className="w-4 h-4 text-theme-accent" />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                    Phông Chữ Hệ Thống
                  </h4>
                  <p className="text-[10px] text-white/50">
                    Áp dụng cho toàn bộ văn bản, đề thi và trang in ấn.
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-theme-accent/20 text-theme-accent border border-theme-accent/30">
                {activeFont.fontName}
              </span>
            </div>

            {/* Quick Switch Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_FONTS.slice(0, 4).map((p) => {
                const isSelected = activeFont.mode === 'preset' && activeFont.presetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={async () => {
                      vibrateTap();
                      soundFx.playClick();
                      await applyPresetFont(p.id);
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono border transition cursor-pointer ${
                      isSelected
                        ? 'bg-theme-accent text-[#190839] border-theme-accent font-bold shadow'
                        : 'bg-black/30 text-slate-300 border-white/10 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>

            {/* Button to open full Font Manager Modal */}
            {onOpenFontModal && (
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onOpenFontModal();
                }}
                className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-theme-accent/20 to-purple-600/20 hover:from-theme-accent/30 hover:to-purple-600/30 border border-theme-accent/40 rounded text-xs font-mono font-bold text-white flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Type className="w-3.5 h-3.5 text-theme-accent" />
                  <span>Tải lên font riêng (.ttf/.otf/.woff) hoặc đổi font</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-theme-accent" />
              </button>
            )}
          </div>

          {/* High Contrast Mode */}
          <div className="p-4 rounded-[4px] bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Contrast className="w-4 h-4 text-amber-400" />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                    Chế Độ Tương Phản Cao
                  </h4>
                  <p className="text-[10px] text-white/50">
                    Nền đen tối ưu (Pure Black) giúp văn bản rõ nét, hỗ trợ thị lực.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleHighContrast}
                className={`w-11 h-6 flex shrink-0 items-center rounded-[4px] p-1 transition duration-300 cursor-pointer ${
                  isHighContrast ? 'bg-amber-500 justify-end' : 'bg-gray-700 justify-start'
                }`}
                title={isHighContrast ? "Tắt tương phản cao" : "Bật tương phản cao"}
              >
                <div className="w-4 h-4 rounded-[2px] bg-white shadow-md transform transition" />
              </button>
            </div>
          </div>

          {/* Backup Question Bank (Sao lưu dữ liệu) */}
          <div className="p-4 rounded-[4px] bg-gradient-to-b from-white/10 to-white/5 border border-theme-accent/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-theme-accent/20 border border-theme-accent/40 flex items-center justify-center text-theme-accent shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                      Sao Lưu Ngân Hàng Đề
                    </h4>
                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-theme-accent/20 text-theme-accent border border-theme-accent/30">
                      {questionCount} câu
                    </span>
                  </div>
                  <p className="text-[10px] text-white/60 font-sans">
                    Xuất toàn bộ ngân hàng câu hỏi thành tệp JSON lưu về máy tính.
                  </p>
                </div>
              </div>
            </div>

            {backupStatus.status === 'success' && backupStatus.message && (
              <div className="p-2.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn font-sans">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="leading-tight">{backupStatus.message}</span>
              </div>
            )}

            <div className="pt-1 flex items-center gap-2">
              <button
                id="btn-backup-question-bank"
                type="button"
                onClick={handleBackupQuestionBank}
                disabled={backupStatus.status === 'exporting'}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-theme-accent/80 via-theme-accent to-purple-500 hover:brightness-110 active:scale-[0.99] text-[#160A2A] font-bold rounded text-xs font-mono shadow-md flex items-center justify-center gap-2 transition cursor-pointer border border-white/20"
                title="Tải xuống tệp JSON sao lưu toàn bộ ngân hàng câu hỏi về máy cá nhân"
              >
                <HardDriveDownload className="w-4 h-4 text-[#160A2A]" />
                <span>Sao lưu</span>
                <span className="text-[10px] font-sans font-normal opacity-85 px-1.5 py-0.5 rounded bg-black/15">.JSON</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
};
