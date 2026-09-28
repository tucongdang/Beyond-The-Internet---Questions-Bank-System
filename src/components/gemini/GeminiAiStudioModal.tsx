import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  MessageSquare, 
  Image as ImageIcon, 
  Film, 
  X, 
  Maximize2, 
  Minimize2, 
  Cpu, 
  Compass, 
  Terminal,
  Zap
} from 'lucide-react';
import { GeminiChatTab } from './GeminiChatTab';
import { GeminiImageStudioTab } from './GeminiImageStudioTab';
import { VeoVideoStudioTab } from './VeoVideoStudioTab';
import { AntigravityStudioTab } from './AntigravityStudioTab';
import { DeepResearchStudioTab } from './DeepResearchStudioTab';
import { AutopilotStudioTab } from './AutopilotStudioTab';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap } from '../../utils/hapticUtils';

export type GeminiStudioTabKey = 'CHAT' | 'AUTOPILOT' | 'ANTIGRAVITY' | 'DEEP_RESEARCH' | 'IMAGE' | 'VIDEO';

interface GeminiAiStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: GeminiStudioTabKey;
  initialImageForVideo?: string | null;
}

export const GeminiAiStudioModal: React.FC<GeminiAiStudioModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'CHAT',
  initialImageForVideo = null
}) => {
  const [activeTab, setActiveTab] = useState<GeminiStudioTabKey>(defaultTab);
  const [passedImageForVideo, setPassedImageForVideo] = useState<string | null>(initialImageForVideo);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Synchronize activeTab if defaultTab changes when opening
  useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // Global ESC key listener for effortless closing
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        vibrateTap();
        soundFx.playClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleTabChange = (tab: GeminiStudioTabKey) => {
    setActiveTab(tab);
    vibrateTap();
    soundFx.playClick();
  };

  const handleSendImageToVideo = (base64Image: string) => {
    setPassedImageForVideo(base64Image);
    setActiveTab('VIDEO');
    vibrateTap();
    soundFx.playClick();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-1 sm:p-3 md:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-hidden modal-backdrop-isolated select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Gemini AI Studio"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
          vibrateTap();
          soundFx.playClick();
        }
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full bg-[#160A2A]/95 fluent-acrylic-surface border border-theme-accent/30 rounded-[6px] shadow-[0_24px_64px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen 
            ? 'h-[98dvh] max-w-[99vw] m-1' 
            : 'w-[96vw] lg:w-[92vw] xl:w-[88vw] max-w-6xl h-[88vh] min-h-[520px] max-h-[920px]'
        }`}
      >
        {/* Fluent Title Bar (Windows 11 Mica Bar) */}
        <div className="min-h-[52px] sm:h-14 px-3 sm:px-4 py-2 sm:py-0 bg-[#120529]/95 border-b border-theme-accent/20 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 shrink-0 select-none">
          {/* Brand & Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-[4px] bg-theme-accent/15 border border-theme-accent/40 flex items-center justify-center text-theme-accent shadow-sm shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide truncate">
                  Gemini AI Studio
                </h2>
                <span className="text-[10px] font-mono font-bold bg-theme-accent/15 text-theme-accent border border-theme-accent/30 px-1.5 py-0.5 rounded-[4px] shrink-0">
                  BTI 2026
                </span>
              </div>
              <p className="text-[11px] text-[#B6A6D8]/80 hidden md:block truncate">
                Bộ công cụ AI thế hệ mới: Chatbot Cố vấn, Tạo & Sửa ảnh 3.1, Video Veo 3.1
              </p>
            </div>
          </div>

          {/* Center: Fluent Tablist */}
          <div className="flex items-center p-0.5 bg-[#0D0420]/80 rounded-[4px] border border-theme-accent/20 shadow-inner max-w-full overflow-x-auto no-scrollbar order-3 sm:order-2 w-full sm:w-auto justify-center sm:justify-start gap-1">
            <button
              onClick={() => handleTabChange('CHAT')}
              className={`px-2.5 py-1.5 rounded-[4px] text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'CHAT'
                  ? 'fluent-btn-primary shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chatbot Cố Vấn</span>
            </button>

            <button
              onClick={() => handleTabChange('AUTOPILOT')}
              className={`px-2.5 py-1.5 rounded-[4px] text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'AUTOPILOT'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>AutoPilot Soạn Đề</span>
              <span className="text-[9px] px-1 py-0.2 rounded-[2px] bg-black/30 font-mono text-amber-200">1-Click</span>
            </button>

            <button
              onClick={() => handleTabChange('ANTIGRAVITY')}
              className={`px-2.5 py-1.5 rounded-[4px] text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'ANTIGRAVITY'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-sky-300" />
              <span>Agent Antigravity</span>
              <span className="text-[9px] px-1 py-0.2 rounded-[2px] bg-black/30 font-mono text-sky-200">Sandbox</span>
            </button>

            <button
              onClick={() => handleTabChange('DEEP_RESEARCH')}
              className={`px-2.5 py-1.5 rounded-[4px] text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'DEEP_RESEARCH'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-emerald-300" />
              <span>Deep Research</span>
              <span className="text-[9px] px-1 py-0.2 rounded-[2px] bg-black/30 font-mono text-emerald-200">Pro</span>
            </button>

            <button
              onClick={() => handleTabChange('IMAGE')}
              className={`px-2.5 py-1.5 rounded-[4px] text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'IMAGE'
                  ? 'fluent-btn-primary shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Tạo &amp; Sửa Ảnh</span>
            </button>

            <button
              onClick={() => handleTabChange('VIDEO')}
              className={`px-2.5 py-1.5 rounded-[4px] text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'VIDEO'
                  ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-[#0c031d] font-bold shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-cyan-400" />
              <span>Video Veo</span>
              <span className="text-[9px] px-1 py-0.2 rounded-[2px] bg-black/20 font-mono">3.1</span>
            </button>
          </div>

          {/* Window Control Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 order-2 sm:order-3 ml-auto sm:ml-0">
            <button
              onClick={() => {
                setIsFullscreen(!isFullscreen);
                vibrateTap();
              }}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-[4px] transition-colors cursor-pointer hidden sm:flex items-center justify-center"
              title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
              aria-label={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              id="btn-close-gemini-studio"
              onClick={() => {
                onClose();
                vibrateTap();
                soundFx.playClick();
              }}
              className="h-8 sm:h-9 px-2.5 sm:px-3.5 bg-rose-500/25 hover:bg-rose-600 text-rose-100 hover:text-white border border-rose-500/40 hover:border-transparent rounded-[4px] transition-all flex items-center gap-1.5 cursor-pointer font-bold text-xs shadow-sm active:scale-95"
              title="Đóng hộp thoại (Phím Esc hoặc bấm ra ngoài)"
              aria-label="Đóng hộp thoại Gemini AI Studio"
            >
              <X className="w-4 h-4 text-white" />
              <span className="font-sans">Đóng</span>
              <kbd className="hidden md:inline text-[9px] bg-black/40 px-1 py-0.2 rounded font-mono text-white/80">Esc</kbd>
            </button>
          </div>
        </div>

        {/* Modal Body Container - Scales flexibly with flex-1 and min-h-0 */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-2 sm:p-3 md:p-4 bg-[#0e041f]/75">
          {activeTab === 'CHAT' && <GeminiChatTab />}
          {activeTab === 'AUTOPILOT' && <AutopilotStudioTab />}
          {activeTab === 'ANTIGRAVITY' && <AntigravityStudioTab />}
          {activeTab === 'DEEP_RESEARCH' && <DeepResearchStudioTab />}
          {activeTab === 'IMAGE' && (
            <GeminiImageStudioTab onSendToVideo={handleSendImageToVideo} />
          )}
          {activeTab === 'VIDEO' && (
            <VeoVideoStudioTab initialImage={passedImageForVideo} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

