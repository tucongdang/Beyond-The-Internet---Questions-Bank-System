import React, { useState, useEffect } from 'react';
import { syncService } from './services/syncService';
import { soundFx } from './services/audioEffects';
import { vibrateTap } from './utils/hapticUtils';
import { Navbar } from './components/Navbar';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { ApiKeyConfigModal } from './components/ApiKeyConfigModal';
import { OfflineBanner } from './components/OfflineBanner';
import { InstallAppModal } from './components/InstallAppModal';
import { FluentTooltip } from './components/FluentTooltip';
import { getWorkspaceHighContrast } from './utils/themeManager';
import { applyBatterySaverClasses, getBatterySaverMode, useBatterySaver } from './utils/batterySaverUtils';
import { QuestionBankDashboard } from './components/questionBank/QuestionBankDashboard';
import { UserRoleManagerModal } from './components/questionBank/UserRoleManagerModal';
import { WorkspaceSettingsModal } from './components/WorkspaceSettingsModal';
import { FontSettingsModal } from './components/FontSettingsModal';
import { GeminiAiStudioModal, GeminiStudioTabKey } from './components/gemini/GeminiAiStudioModal';
import { AppFooter } from './components/AppFooter';
import { PasswordGate } from './components/PasswordGate';
import { AdminUser, AppUser, TECHNICAL_ROLES } from './types';
import { questionBankManager } from './services/questionBankManager';

export default function App() {
  const { isBatterySaver } = useBatterySaver();

  // Modals & User Role State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('BTI2026_ADMIN_AUTH') === 'true' ||
             localStorage.getItem('BTI2026_ADMIN_AUTH') === 'true';
    }
    return false;
  });

  const handleAdminAuthenticated = (user?: AdminUser) => {
    setIsAdminAuthenticated(true);
    if (user) {
      const appUser: AppUser = {
        id: user.id,
        name: user.fullName || user.username,
        email: user.email,
        role: user.role || 'SUPER_ADMIN',
        title: user.technicalRole ? TECHNICAL_ROLES[user.technicalRole]?.label : undefined,
        organization: 'Ban Đề Thi BTI 2026',
        lastActive: Date.now()
      };
      questionBankManager.setCurrentUser(appUser);
    }
  };

  const handleAdminLogout = () => {
    soundFx.playClick();
    vibrateTap();
    setIsAdminAuthenticated(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('BTI2026_ADMIN_AUTH');
      sessionStorage.removeItem('BTI2026_ADMIN_TOKEN');
      sessionStorage.removeItem('BTI2026_TECH_USER');
      localStorage.removeItem('BTI2026_ADMIN_AUTH');
      localStorage.removeItem('BTI2026_ADMIN_TOKEN');
      localStorage.removeItem('BTI2026_TECH_USER');
    }
  };

  const [isUserRolesOpen, setIsUserRolesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [isFirebaseConfigOpen, setIsFirebaseConfigOpen] = useState<boolean>(false);
  const [isApiKeyConfigOpen, setIsApiKeyConfigOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isGeminiStudioOpen, setIsGeminiStudioOpen] = useState<boolean>(false);
  const [geminiStudioTab, setGeminiStudioTab] = useState<GeminiStudioTabKey>('CHAT');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isOfflineBannerDismissed, setIsOfflineBannerDismissed] = useState<boolean>(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(() => syncService.getIsFirebaseConnected());
  const [isWorkspaceHighContrast, setIsWorkspaceHighContrast] = useState<boolean>(getWorkspaceHighContrast());
  const [isFocusMode, setIsFocusMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bti_qb_focus_mode') === 'true';
    }
    return false;
  });

  const handleToggleFocusMode = () => {
    vibrateTap();
    soundFx.playClick();
    setIsFocusMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem('bti_qb_focus_mode', String(next));
      } catch {}
      return next;
    });
  };

  const handleOpenGeminiStudio = (tab: GeminiStudioTabKey = 'CHAT') => {
    if (isGeminiStudioOpen && geminiStudioTab === tab) {
      setIsGeminiStudioOpen(false);
      return;
    }
    setGeminiStudioTab(tab);
    setIsGeminiStudioOpen(true);
  };


  // Subscribe to Workspace High Contrast
  useEffect(() => {
    const handleHcChange = () => setIsWorkspaceHighContrast(getWorkspaceHighContrast());
    window.addEventListener('wshc_change', handleHcChange);
    return () => window.removeEventListener('wshc_change', handleHcChange);
  }, []);

  // Keep battery saver theme classes in sync
  useEffect(() => {
    applyBatterySaverClasses(getBatterySaverMode());
  }, [isBatterySaver]);

  // Subscribe to Realtime Connection Status
  useEffect(() => {
    const unsubConnection = syncService.subscribeToConnection((connected) => {
      setIsFirebaseConnected(connected);
    });

    return () => {
      unsubConnection();
    };
  }, []);

  // Sound toggle handler
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.setEnabled(next);
    if (next) soundFx.playClick();
  };

  // Global Escape key listener to close modals
  useEffect(() => {
    const handleGlobalEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        let closed = false;
        if (isGeminiStudioOpen) {
          setIsGeminiStudioOpen(false);
          closed = true;
        }
        if (isApiKeyConfigOpen) {
          setIsApiKeyConfigOpen(false);
          closed = true;
        }
        if (isUserRolesOpen) {
          setIsUserRolesOpen(false);
          closed = true;
        }
        if (isFirebaseConfigOpen) {
          setIsFirebaseConfigOpen(false);
          closed = true;
        }
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          closed = true;
        }
        if (isFontModalOpen) {
          setIsFontModalOpen(false);
          closed = true;
        }
        if (isInstallModalOpen) {
          setIsInstallModalOpen(false);
          closed = true;
        }
        if (closed) {
          vibrateTap();
          soundFx.playClick();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalEsc);
    return () => window.removeEventListener('keydown', handleGlobalEsc);
  }, [isGeminiStudioOpen, isApiKeyConfigOpen, isUserRolesOpen, isFirebaseConfigOpen, isInstallModalOpen, isSettingsOpen, isFontModalOpen]);

  // If not authenticated, display PasswordGate as protective wall
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[100dvh] h-[100dvh] overflow-hidden bg-[#190839] text-[#F5EFF9] font-sans flex flex-col antialiased selection:bg-theme-accent selection:text-[#190839] relative z-0">
        <div className="fixed inset-0 z-[-3] bg-gradient-to-b from-[#0D0420] via-[#190839] to-[#0D0420]">
          <div className="absolute -top-[20%] left-1/4 w-[60vw] h-[40vw] bg-[#8B5CF6]/15 rounded-full blur-[160px] pointer-events-none" />
          <div className="absolute top-1/2 -right-[10%] w-[50vw] h-[50vw] bg-[#E39A96]/10 rounded-full blur-[160px] pointer-events-none" />
        </div>
        <div className="fixed inset-0 z-[-1] opacity-25 pointer-events-none bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px]" />

        <PasswordGate
          isAuthenticated={isAdminAuthenticated}
          onAuthenticated={handleAdminAuthenticated}
          viewName="Ngân Hàng Câu Hỏi & Khảo Thí BTI 2026"
        >
          {null}
        </PasswordGate>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] h-[100dvh] overflow-hidden bg-[#190839] text-[#F5EFF9] font-sans flex flex-col antialiased selection:bg-theme-accent selection:text-[#190839] relative z-0">
      {/* Ambient Background */}
      {isWorkspaceHighContrast ? (
        <div className="fixed inset-0 z-[-3] bg-black" />
      ) : (
        <>
          <div className="fixed inset-0 z-[-3] bg-gradient-to-b from-[#0D0420] via-[#190839] to-[#0D0420]">
            <div className="absolute -top-[20%] left-1/4 w-[60vw] h-[40vw] bg-[#8B5CF6]/15 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute top-1/2 -right-[10%] w-[50vw] h-[50vw] bg-[#E39A96]/10 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute -bottom-[20%] left-1/3 w-[50vw] h-[40vw] bg-[#3B82F6]/10 rounded-full blur-[160px] pointer-events-none" />
          </div>
          <div className="fixed inset-0 z-[-1] opacity-25 pointer-events-none bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px]" />
        </>
      )}

      {/* Dedicated Question Bank Navigation Bar (Hidden in Focus Mode) */}
      {!isFocusMode && (
        <Navbar
          isFocusMode={isFocusMode}
          onToggleFocusMode={handleToggleFocusMode}
          onOpenFirebaseConfig={() => setIsFirebaseConfigOpen(true)}
          onOpenApiKeyConfig={() => setIsApiKeyConfigOpen(true)}
          isFirebaseConnected={isFirebaseConnected}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onAdminLogout={handleAdminLogout}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
          onOpenUserRoles={() => setIsUserRolesOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenFontModal={() => setIsFontModalOpen(true)}
          onOpenGeminiStudio={handleOpenGeminiStudio}
        />
      )}

      {/* Main Focus: Question Bank Dashboard */}
      <main className="flex-1 flex flex-col relative overflow-x-hidden overflow-y-auto">
        <div className={`flex-1 w-full mx-auto transition-all duration-300 animate-fadeIn ${
          isFocusMode ? 'max-w-[1800px] p-2 sm:p-3 md:p-4' : 'max-w-[1560px] p-3 sm:p-5 md:p-6'
        }`}>
          <QuestionBankDashboard 
            onOpenGeminiStudio={handleOpenGeminiStudio}
            isFocusMode={isFocusMode}
            onToggleFocusMode={handleToggleFocusMode}
          />
        </div>

        {/* Regulatory & Technical Architecture Footer */}
        {!isFocusMode && (
          <AppFooter
            onOpenFirebaseConfig={() => setIsFirebaseConfigOpen(true)}
          />
        )}
      </main>

      {/* Gemini AI Studio Modal (Chatbot, Image Generation/Edit, Veo Video) */}
      <GeminiAiStudioModal
        isOpen={isGeminiStudioOpen}
        onClose={() => setIsGeminiStudioOpen(false)}
        defaultTab={geminiStudioTab}
      />

      {/* Unified API Key & Firebase Config Modal */}
      <ApiKeyConfigModal
        isOpen={isApiKeyConfigOpen}
        onClose={() => {
          setIsApiKeyConfigOpen(false);
          setIsFirebaseConnected(syncService.getIsFirebaseConnected());
        }}
      />

      {/* Firebase Database Config Modal (legacy, still accessible from footer) */}
      <FirebaseConfigModal
        isOpen={isFirebaseConfigOpen}
        onClose={() => {
          setIsFirebaseConfigOpen(false);
          setIsFirebaseConnected(syncService.getIsFirebaseConnected());
        }}
        isConnected={isFirebaseConnected}
      />

      {/* PWA Home Screen Install Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      <WorkspaceSettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenFontModal={() => setIsFontModalOpen(true)}
      />

      {/* System Font & Custom Font Upload Modal */}
      <FontSettingsModal
        isOpen={isFontModalOpen}
        onClose={() => setIsFontModalOpen(false)}
      />

      {/* User Role & Permission Manager Modal */}
      {isUserRolesOpen && (
        <UserRoleManagerModal 
          onClose={() => setIsUserRolesOpen(false)} 
          onLogout={() => {
            setIsUserRolesOpen(false);
            handleAdminLogout();
          }}
          onUserChanged={() => {
            // Trigger app-level re-render if needed
            setIsFirebaseConnected(syncService.getIsFirebaseConnected());
          }}
        />
      )}


      {/* Offline Alert Banner with Auto-Reconnect */}
      <OfflineBanner
        isFirebaseConnected={isFirebaseConnected}
        isDismissed={isOfflineBannerDismissed}
        onDismiss={() => {
          setIsOfflineBannerDismissed(true);
          setTimeout(() => {
            setIsOfflineBannerDismissed(false);
          }, 60000);
        }}
      />

      {/* Global Fluent UI 2 Tooltip Overlay */}
      <FluentTooltip />
    </div>
  );
}
