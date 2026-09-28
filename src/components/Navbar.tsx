import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Menu, 
  X, 
  Maximize, 
  Minimize, 
  Activity, 
  RefreshCw, 
  Download, Settings, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  ChevronDown,
  Type,
  Sparkles,
  Target,
  Key,
  Users,
  LogOut,
  Zap
} from 'lucide-react';
import { GameState, PingInfo } from '../types';
import { soundFx } from '../services/audioEffects';
import { vibrateTap, vibrateSelection } from '../utils/hapticUtils';
import { syncService } from '../services/syncService';
import { questionBankManager } from '../services/questionBankManager';
import { BatteryIndicator } from './BatteryIndicator';
import { geminiKeyService } from '../services/geminiKeyService';

interface NavbarProps {
  currentView?: string;
  onViewChange?: (view: any) => void;
  gameState?: GameState;
  activeCount?: number;
  user?: any;
  onOpenProfile?: () => void;
  onLogout?: () => void;
  onOpenFirebaseConfig: () => void;
  onOpenApiKeyConfig?: () => void;
  isFirebaseConnected: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onAdminLogout?: () => void;
  onOpenQrCode?: () => void;
  onOpenInstallModal?: () => void;
  onOpenUserRoles?: () => void;
  onOpenSettings?: () => void;
  onOpenFontModal?: () => void;
  onOpenGeminiStudio?: (tab?: 'CHAT' | 'AUTOPILOT' | 'ANTIGRAVITY' | 'DEEP_RESEARCH' | 'IMAGE' | 'VIDEO') => void;
  onOpenAuthoringSuite?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenFirebaseConfig,
  onOpenApiKeyConfig,
  isFirebaseConnected,
  soundEnabled,
  onToggleSound,
  onAdminLogout,
  onOpenInstallModal,
  onOpenUserRoles,
  onOpenSettings,
  onOpenFontModal,
  onOpenGeminiStudio,
  onOpenAuthoringSuite,
  isFocusMode = false,
  onToggleFocusMode
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [qbUser, setQbUser] = useState(() => questionBankManager.getCurrentUser());
  const [geminiKeyStatus, setGeminiKeyStatus] = useState(() => geminiKeyService.getStatus());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return questionBankManager.subscribe(() => {
      setQbUser(questionBankManager.getCurrentUser());
    });
  }, []);

  useEffect(() => {
    return geminiKeyService.subscribe(setGeminiKeyStatus);
  }, []);

  // Fullscreen State & Change Listeners
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
    }
    return false;
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    vibrateSelection();
    soundFx.playClick();
    try {
      if (!isFullscreen) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).mozRequestFullScreen) {
          await (elem as any).mozRequestFullScreen();
        } else if ((elem as any).msRequestFullscreen) {
          await (elem as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen request could not be completed:', err);
    }
  };

  const [pingInfo, setPingInfo] = useState<PingInfo>(() => syncService.getPingInfo());
  const [isMeasuringPing, setIsMeasuringPing] = useState(false);

  useEffect(() => {
    const unsubscribe = syncService.subscribeToPing((info) => {
      setPingInfo(info);
      setIsMeasuringPing(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleManualPing = async () => {
    vibrateTap();
    soundFx.playClick();
    setIsMeasuringPing(true);
    await syncService.measurePing();
    setIsMeasuringPing(false);
  };

  const getPingBadgeStyle = () => {
    if (pingInfo.quality === 'offline' || pingInfo.latencyMs === null) {
      return {
        container: 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400 hover:border-zinc-500/50',
        dot: 'bg-zinc-500',
        icon: 'text-zinc-400',
        label: 'Offline',
        qualityText: 'Mất kết nối',
        description: 'Mất kết nối Firebase'
      };
    }
    if (pingInfo.quality === 'excellent') {
      return {
        container: 'bg-white/10 backdrop-blur-md border-emerald-500/30 text-emerald-400 hover:border-emerald-500/50',
        dot: 'bg-emerald-400',
        icon: 'text-emerald-400',
        label: `${pingInfo.latencyMs}ms`,
        qualityText: 'Cực tốt',
        description: 'Độ trễ cực tốt (< 100ms)'
      };
    }
    if (pingInfo.quality === 'good') {
      return {
        container: 'bg-white/10 backdrop-blur-md border-sky-500/30 text-sky-400 hover:border-sky-500/50',
        dot: 'bg-sky-400',
        icon: 'text-sky-400',
        label: `${pingInfo.latencyMs}ms`,
        qualityText: 'Tốt',
        description: 'Độ trễ ổn định (< 250ms)'
      };
    }
    return {
      container: 'bg-white/10 backdrop-blur-md border-amber-500/30 text-amber-400 hover:border-amber-500/50',
      dot: 'bg-amber-400',
      icon: 'text-amber-400',
      label: `${pingInfo.latencyMs}ms`,
      qualityText: 'Trung bình',
      description: 'Độ trễ trung bình (< 500ms)'
    };
  };

  const pingBadge = getPingBadgeStyle();

  return (
    <header
      id="app-navbar"
      className="sticky top-0 z-[100] w-full select-none transition-all border-b border-theme-accent/20 bg-[#0c031d]/90 backdrop-blur-xl text-[#F5EFF9] shadow-md shadow-[#0d0420]/50"
    >
      <div className="max-w-[1560px] mx-auto px-3 sm:px-5 h-16 flex items-center justify-between gap-3">
        {/* Left: Branding & Regulatory Standards */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div
            onClick={() => {
              vibrateTap();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0"
            title="Ngân Hàng Câu Hỏi & Khảo Thí BTI 2026"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 bg-theme-accent rounded-[4px] flex items-center justify-center font-black text-sm sm:text-base text-[#190839] shadow-md shadow-theme-accent/20 border border-theme-accent/40 group-hover:bg-[#FCEEEC] group-hover:scale-105 transition duration-200">
              BTI
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight leading-tight text-white whitespace-nowrap">
                  BEYOND THE INTERNET <span className="text-theme-accent">2026</span>
                </h1>
                <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono font-semibold bg-theme-accent/15 text-theme-accent border border-theme-accent/30 whitespace-nowrap">
                  NHCH
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#B6A6D8] font-mono leading-none mt-1 whitespace-nowrap">
                Hệ Thống Quản Lý Ngân Hàng Câu Hỏi &amp; Khảo Thí
              </p>
            </div>
          </div>

        </div>

        {/* Right: User Role Switcher & System Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* User Persona Button */}
          <button
            type="button"
            id="btn-navbar-qb-role"
            onClick={() => {
              vibrateTap();
              if (onOpenUserRoles) onOpenUserRoles();
            }}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-[#241148]/80 hover:bg-[#3E1D74]/80 border border-theme-accent/25 hover:border-theme-accent/45 rounded-[4px] text-xs select-none shadow-sm transition cursor-pointer shrink-0"
            title="Nhấn để xem phân quyền hoặc đổi vai trò (Admin, Trưởng ban thẩm định, Giám khảo, Biên soạn)"
          >
            <div className="w-6 h-6 rounded-[4px] bg-theme-accent text-[#190839] font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
              {qbUser.name.charAt(0)}
            </div>
            <div className="flex flex-col items-start font-mono text-left">
              <span className="font-semibold text-[#F5EFF9] text-[11px] leading-tight truncate max-w-[130px]">
                {qbUser.name}
              </span>
              <span className="text-theme-accent text-[9px] leading-tight font-medium flex items-center gap-1">
                <span>{qbUser.role}</span>
                <ChevronDown className="w-2.5 h-2.5 text-[#B6A6D8]" />
              </span>
            </div>
          </button>

          {/* Gemini AI Studio Quick Access Button */}
          {onOpenGeminiStudio && (
            <button
              id="btn-navbar-gemini-studio"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                onOpenGeminiStudio('CHAT');
              }}
              data-tooltip="Mở Gemini AI Studio: Chatbot Đa vai trò, Tạo & Chỉnh sửa ảnh, Animate Video Veo"
              data-tooltip-title="Gemini AI Studio"
              data-tooltip-placement="bottom"
              className="has-tooltip flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-900/70 via-indigo-900/70 to-purple-950/90 hover:from-purple-800 hover:to-indigo-800 border border-theme-accent/50 rounded-[4px] text-xs font-bold text-theme-accent shadow-md shadow-purple-950/40 transition cursor-pointer shrink-0 group"
            >
              <Sparkles className="w-3.5 h-3.5 text-theme-accent group-hover:scale-110 transition-transform animate-pulse" />
              <span className="hidden xl:inline">Gemini Studio</span>
            </button>
          )}

          {/* AutoPilot 1-Click Master Authoring Suite Button (Level with Gemini AI Studio) */}
          {(onOpenAuthoringSuite || onOpenGeminiStudio) && (
            <button
              id="btn-navbar-autopilot-suite"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                if (onOpenAuthoringSuite) {
                  onOpenAuthoringSuite();
                } else if (onOpenGeminiStudio) {
                  onOpenGeminiStudio('AUTOPILOT');
                }
              }}
              data-tooltip="Mở AutoPilot 1-Click Master Authoring Suite: Soạn đề, sinh đáp án nhiễu, đối soát pháp lý, chuẩn ma trận"
              data-tooltip-title="AutoPilot Soạn Đề"
              data-tooltip-placement="bottom"
              className="has-tooltip flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-600/30 via-orange-600/30 to-amber-700/30 hover:from-amber-600/50 hover:to-orange-600/50 border border-amber-400/50 rounded-[4px] text-xs font-bold text-amber-300 shadow-md shadow-amber-950/40 transition cursor-pointer shrink-0 group"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform animate-pulse" />
              <span className="hidden xl:inline">AutoPilot Soạn Đề</span>
            </button>
          )}

          {/* API Key Config Button */}
          {onOpenApiKeyConfig && (
            <button
              id="btn-navbar-api-key"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                onOpenApiKeyConfig();
              }}
              data-tooltip={`Gemini AI API Key: ${geminiKeyStatus === 'valid' ? 'Đã cấu hình ✓' : 'Chưa cấu hình – Nhấn để cài đặt'} • Nhấn để mở cấu hình`}
              data-tooltip-title="Cấu hình API Key"
              data-tooltip-placement="bottom"
              className={`has-tooltip relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] border text-xs font-mono transition cursor-pointer shrink-0 ${
                geminiKeyStatus === 'valid'
                  ? 'text-emerald-300 bg-[#241148]/80 hover:bg-[#3E1D74]/80 border-emerald-500/40'
                  : 'text-amber-300 bg-[#241148]/80 hover:bg-[#3E1D74]/80 border-amber-500/40 animate-pulse'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  geminiKeyStatus === 'valid'
                    ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                    : 'bg-amber-400'
                }`}
              />
            </button>
          )}

          {/* Database Sync Status (Integrated with Ping & Connection Info) */}
          <button
            id="btn-navbar-db-sync"
            onClick={() => {
              vibrateTap();
              onOpenFirebaseConfig();
            }}
            data-tooltip={`Cơ sở dữ liệu: ${isFirebaseConnected ? 'Firebase Đám Mây (Online)' : 'Chế độ ngoại tuyến (IndexedDB/Local)'} • Độ trễ: ${pingInfo.latencyMs !== null ? `${pingInfo.latencyMs}ms (${pingBadge.description})` : 'Mất kết nối'} • Nhấn để cấu hình`}
            data-tooltip-title="Trạng Thái Cơ Sở Dữ Liệu"
            data-tooltip-placement="bottom"
            className={`has-tooltip flex items-center gap-2 px-2.5 py-1.5 rounded-[4px] border text-xs font-mono transition cursor-pointer shrink-0 ${
              isFirebaseConnected
                ? 'text-emerald-300 bg-[#241148]/80 hover:bg-[#3E1D74]/80 border-emerald-500/40'
                : 'text-amber-300 bg-[#241148]/80 hover:bg-[#3E1D74]/80 border-amber-500/40'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isFirebaseConnected ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="hidden sm:inline text-[11px] font-bold">
              {pingInfo.latencyMs !== null ? `${pingInfo.latencyMs}ms` : (isFirebaseConnected ? 'Sync' : 'Offline')}
            </span>
          </button>

          {/* Sound Toggle Button */}
          <button
            id="btn-toggle-sound"
            onClick={() => {
              vibrateSelection();
              onToggleSound();
            }}
            data-tooltip={soundEnabled ? 'Tắt hiệu ứng âm thanh' : 'Bật hiệu ứng âm thanh thao tác'}
            data-tooltip-title="Âm Thanh Hệ Thống"
            data-tooltip-placement="bottom"
            className="has-tooltip flex items-center justify-center p-2 rounded-[4px] bg-[#241148]/80 hover:bg-[#3E1D74]/80 border border-theme-accent/25 hover:border-theme-accent/40 text-[#F5EFF9]/80 hover:text-white transition cursor-pointer shrink-0"
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-theme-accent" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-white/40" />
            )}
          </button>

          {/* Unified Settings Dropdown (Fullscreen, Font, Workspace, PWA) */}
          <div className="relative shrink-0" ref={settingsRef}>
            <button
              id="btn-navbar-settings-dropdown"
              type="button"
              onClick={() => {
                vibrateTap();
                setIsSettingsOpen(!isSettingsOpen);
              }}
              data-tooltip="Tiện ích & Cài đặt hệ thống (Toàn màn hình, Phông chữ, Tùy chỉnh...)"
              data-tooltip-title="Cài Đặt & Tiện Ích"
              data-tooltip-placement="bottom"
              className={`has-tooltip flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] border text-xs font-mono font-medium transition cursor-pointer ${
                isSettingsOpen
                  ? 'bg-theme-accent text-[#190839] border-theme-accent font-bold'
                  : 'bg-[#241148]/80 hover:bg-[#3E1D74]/80 text-[#F5EFF9]/90 hover:text-white border-theme-accent/25 hover:border-theme-accent/40'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">Cài đặt</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-56 py-1.5 bg-[#170933]/98 backdrop-blur-2xl border border-theme-accent/30 rounded-[6px] shadow-2xl shadow-black/80 z-[110] animate-fadeIn text-xs divide-y divide-white/10 font-sans">
                <div className="py-1">
                  {/* Fullscreen Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleFullscreen();
                      setIsSettingsOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center justify-between text-[#F5EFF9]/90 hover:bg-white/10 hover:text-white transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {isFullscreen ? (
                        <Minimize className="w-4 h-4 text-theme-accent" />
                      ) : (
                        <Maximize className="w-4 h-4 text-theme-accent/80" />
                      )}
                      <span>{isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}</span>
                    </div>
                    <kbd className="text-[10px] font-mono px-1 py-0.2 rounded bg-black/40 text-theme-accent border border-theme-accent/30">
                      {isFullscreen ? 'ON' : 'F11'}
                    </kbd>
                  </button>

                  {/* Font Customization */}
                  {onOpenFontModal && (
                    <button
                      type="button"
                      onClick={() => {
                        vibrateTap();
                        soundFx.playClick();
                        onOpenFontModal();
                        setIsSettingsOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-[#F5EFF9]/90 hover:bg-white/10 hover:text-white transition cursor-pointer"
                    >
                      <Type className="w-4 h-4 text-theme-accent" />
                      <span>Phông chữ hệ thống</span>
                    </button>
                  )}

                  {/* Workspace Settings */}
                  {onOpenSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        vibrateTap();
                        soundFx.playClick();
                        onOpenSettings();
                        setIsSettingsOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-[#F5EFF9]/90 hover:bg-white/10 hover:text-white transition cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-theme-accent" />
                      <span>Tùy chỉnh giao diện</span>
                    </button>
                  )}
                </div>

                {/* Battery & PWA Install Section */}
                <div className="py-1">
                  <div className="px-3 py-1.5">
                    <BatteryIndicator showDetails className="w-full text-[10px]" />
                  </div>

                  {onOpenInstallModal && (
                    <button
                      type="button"
                      onClick={() => {
                        vibrateTap();
                        soundFx.playClick();
                        onOpenInstallModal();
                        setIsSettingsOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center justify-between text-theme-accent hover:bg-white/10 transition cursor-pointer font-medium"
                    >
                      <div className="flex items-center gap-2.5">
                        <Download className="w-4 h-4 text-theme-accent" />
                        <span>Cài đặt ứng dụng (PWA)</span>
                      </div>
                      <span className="text-[9px] bg-theme-accent/20 px-1.5 py-0.2 rounded font-mono border border-theme-accent/30">
                        App
                      </span>
                    </button>
                  )}
                </div>

                {/* Account & Session Management Section */}
                <div className="py-1">
                  {onAdminLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        vibrateTap();
                        soundFx.playClick();
                        onAdminLogout();
                        setIsSettingsOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2.5 text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition cursor-pointer font-medium"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Hamburger Menu Toggle for Mobile */}
          <button
            onClick={() => {
              vibrateTap();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            className="sm:hidden p-2 fluent-nav-btn text-white/70 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-white/10 bg-[#0c031d]/95 backdrop-blur-2xl p-4 space-y-3 shadow-2xl absolute top-full left-0 w-full z-[100] animate-fadeIn">
          {/* Gemini AI Studio Quick Access Card */}
          {onOpenGeminiStudio && (
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                onOpenGeminiStudio('CHAT');
                setIsMobileMenuOpen(false);
              }}
              className="w-full p-3 bg-gradient-to-r from-purple-950/80 via-[#241148] to-indigo-950/80 hover:bg-[#3E1D74] border border-theme-accent/40 rounded-[4px] flex items-center justify-between text-left transition shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[4px] bg-theme-accent text-[#190839] font-bold flex items-center justify-center text-sm shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Gemini AI Studio</span>
                    <span className="text-[9px] bg-theme-accent/20 text-theme-accent px-1.5 py-0.2 rounded">Pro</span>
                  </div>
                  <div className="text-[10px] text-[#B6A6D8]">Chatbot, Tạo/Sửa ảnh & Video Veo</div>
                </div>
              </div>
              <span className="text-[11px] text-theme-accent font-bold">Mở →</span>
            </button>
          )}

          {/* Focus Mode Card for Mobile */}
          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              if (onToggleFocusMode) onToggleFocusMode();
              setIsMobileMenuOpen(false);
            }}
            className={`w-full p-3 border rounded-[4px] flex items-center justify-between text-left transition shadow-md ${
              isFocusMode
                ? 'bg-amber-400 text-[#190839] border-amber-300 font-bold'
                : 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-500/40 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-[4px] font-bold flex items-center justify-center text-sm shadow-sm ${
                isFocusMode ? 'bg-[#190839] text-amber-400' : 'bg-amber-500/20 text-amber-400 border border-amber-400/30'
              }`}>
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5 font-mono">
                  <span>Chế Độ Tập Trung (Focus Mode)</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                    isFocusMode ? 'bg-[#190839]/20 text-[#190839]' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  }`}>
                    {isFocusMode ? 'ĐANG BẬT' : 'Alt+F'}
                  </span>
                </div>
                <div className={`text-[10px] ${isFocusMode ? 'text-[#190839]/80' : 'text-amber-200/70'}`}>
                  Ẩn thanh điều hướng &amp; biểu đồ, tối đa không gian soạn câu hỏi
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold font-mono">{isFocusMode ? 'TẮT ✕' : 'BẬT →'}</span>
          </button>

          {/* User Role Card */}
          <button
            type="button"
            onClick={() => {
              vibrateTap();
              if (onOpenUserRoles) onOpenUserRoles();
              setIsMobileMenuOpen(false);
            }}
            className="w-full p-3 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/40 rounded-[4px] flex items-center justify-between text-left transition shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[4px] bg-purple-600 text-white font-bold flex items-center justify-center text-sm">
                {qbUser.name.charAt(0)}
              </div>
              <div>
                <div className="text-xs font-bold text-white font-mono">{qbUser.name}</div>
                <div className="text-[10px] text-purple-300 font-mono">{qbUser.role} • {qbUser.department}</div>
              </div>
            </div>
            <span className="text-[11px] text-sky-300 font-mono underline">Đổi vai trò</span>
          </button>

          {/* Connection & Ping Card */}
          <div className="p-3 fluent-box-nested border border-white/10 rounded-[4px] flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-[4px] flex items-center justify-center border ${pingBadge.container}`}>
                <Activity className={`w-4 h-4 ${isMeasuringPing ? 'animate-spin text-white' : pingBadge.icon}`} />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                  <span>Firebase Ping</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-[2px] bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                    {pingBadge.qualityText}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-white/70 flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${pingBadge.dot}`} />
                  <span>RTT: <strong className="text-white font-bold">{pingInfo.latencyMs !== null ? `${pingInfo.latencyMs} ms` : 'Mất kết nối'}</strong></span>
                </div>
              </div>
            </div>
            <button
              onClick={handleManualPing}
              disabled={isMeasuringPing}
              className="px-2.5 py-1.5 fluent-action-btn text-xs font-mono font-bold border border-white/10 shrink-0 rounded-[4px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isMeasuringPing ? 'animate-spin' : ''}`} />
              <span className="text-[11px]">{isMeasuringPing ? 'Đo...' : 'Đo lại'}</span>
            </button>
          </div>

          {/* Battery Status */}
          <BatteryIndicator showDetails className="w-full" />

                    {/* Font Settings */}
          {onOpenFontModal && (
            <button
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                onOpenFontModal();
                setIsMobileMenuOpen(false);
              }}
              className="w-full p-3 fluent-box-nested border border-white/10 rounded-[4px] flex items-center justify-between shadow-inner hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[4px] bg-theme-accent/20 text-theme-accent border border-theme-accent/30 flex items-center justify-center">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-mono">Phông Chữ Hệ Thống</div>
                  <div className="text-[10px] text-white/50 font-mono">Tải font riêng (.ttf/.otf), Đổi font...</div>
                </div>
              </div>
            </button>
          )}

          {/* Workspace Settings */}
          {onOpenSettings && (
            <button
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                onOpenSettings();
                setIsMobileMenuOpen(false);
              }}
              className="w-full p-3 fluent-box-nested border border-white/10 rounded-[4px] flex items-center justify-between shadow-inner hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[4px] bg-theme-accent/20 text-theme-accent border border-theme-accent/30 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-mono">Cài Đặt Workspace</div>
                  <div className="text-[10px] text-white/50 font-mono">Chủ đề, Màu sắc...</div>
                </div>
              </div>
            </button>
          )}
          
          {/* Fullscreen & PWA Install */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => {
                handleToggleFullscreen();
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2 px-3 rounded-[4px] bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-white flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                {isFullscreen ? <Minimize className="w-4 h-4 text-sky-300" /> : <Maximize className="w-4 h-4 text-white/70" />}
                <span>{isFullscreen ? 'Thoát Toàn Màn Hình' : 'Bật Toàn Màn Hình'}</span>
              </span>
              <span className="text-[10px] text-sky-400">{isFullscreen ? 'ON' : 'OFF'}</span>
            </button>

            {onOpenInstallModal && (
              <button
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onOpenInstallModal();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2 px-3 rounded-[4px] bg-sky-950/30 hover:bg-sky-900/40 border border-sky-500/30 text-xs font-mono font-bold text-sky-300 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-sky-300" />
                  <span>Cài Đặt Ứng Dụng (PWA)</span>
                </span>
                <span className="text-[10px] text-sky-200 bg-sky-900/50 px-1.5 py-0.5 rounded-[2px]">Install</span>
              </button>
            )}

            {onAdminLogout && (
              <button
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onAdminLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2 px-3 rounded-[4px] bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/50 text-xs font-mono font-bold text-rose-300 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng Xuất Khỏi Hệ Thống</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
