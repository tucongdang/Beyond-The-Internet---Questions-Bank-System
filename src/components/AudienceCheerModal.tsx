import { t } from '../utils/i18n';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { createPortal } from 'react-dom';
import { Heart, Flame, Zap, X, Activity, Sparkles, Trophy, Users, Pin } from 'lucide-react';
import { cheerService } from '../services/cheerService';
import { UserInfo, CheerType, CheerIntensityData } from '../types';
import { soundFx } from '../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../utils/hapticUtils';
import { AudienceCheerButton } from './AudienceCheerButton';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface AudienceCheerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserInfo | null;
  isHighContrast?: boolean;
}

export const AudienceCheerModal: React.FC<AudienceCheerModalProps> = ({
  isOpen,
  onClose,
  user,
  isHighContrast = false
}) => {
  useLockBodyScroll(isOpen);
  const { localLanguage } = useLanguage();

  const [mounted, setMounted] = useState(false);
  const [intensityData, setIntensityData] = useState<CheerIntensityData>(cheerService.getCurrentIntensityData());
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsub = cheerService.subscribe((data) => {
      setIntensityData(data);
    });
    return () => unsub();
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className={`fluent-dialog-overlay z-[9999999] animate-fadeIn ${isAlwaysOnTop ? 'is-pinned always-on-top' : ''}`}
      style={isAlwaysOnTop ? { zIndex: 2147483646 } : undefined}
    >
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div
        className={`fluent-dialog p-5 sm:p-6 w-full max-w-lg animate-fluent-dialog-spring ${isAlwaysOnTop ? 'is-pinned always-on-top z-[2147483647]' : ''} ${isHighContrast ? "bg-black/95 border-2 border-white text-white" : ""}`}
        style={isAlwaysOnTop ? { zIndex: 2147483647 } : undefined}
        data-pinned={isAlwaysOnTop}
        data-always-on-top={isAlwaysOnTop}
      >
        {/* Header */}
        <div className="fluent-dialog-header flex items-center justify-between pb-3 border-b border-white/10 relative z-10 !cursor-default">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-[4px] flex items-center justify-center border"
              style={{
                backgroundColor: `${intensityData.colorHex}25`,
                borderColor: `${intensityData.colorHex}50`,
                color: intensityData.colorHex
              }}
            >
              <Heart className="w-5 h-5 fill-current animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                TIẾP SỨC SÂN KHẤU
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[4px] bg-white/10 text-rose-300 border border-rose-500/30">
                  LIVE 100%
                </span>
              </h2>
              <p className="text-xs text-white/60 font-mono">
                {localLanguage === 'en' ? 'Every tap increases the heartbeat and hype on screen!' : 'Mỗi lượt bấm sẽ tăng nhịp tim và khí thế trên màn chiếu!'}
              </p>
            </div>
          </div>

          <div className="fluent-dialog-header-actions flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                setIsAlwaysOnTop(prev => !prev);
              }}
              className={`fluent-dialog-pin-btn p-1.5 rounded-[4px] transition cursor-pointer flex items-center justify-center ${
                isAlwaysOnTop
                  ? 'active text-theme-accent bg-theme-accent/20 border border-theme-accent/40 shadow-[0_0_10px_rgba(var(--bti-accent-rgb,247,202,201),0.35)]'
                  : 'text-white/60 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
              title={isAlwaysOnTop ? "Bỏ ghim / Tắt Always on Top" : "Ghim lên đầu / Always on Top"}
              aria-label="Always on Top"
              aria-pressed={isAlwaysOnTop}
              data-role="always-on-top"
            >
              <Pin className={`w-4 h-4 transition-transform duration-200 ${isAlwaysOnTop ? 'rotate-45 fill-current text-theme-accent' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                onClose();
              }}
              className="fluent-dialog-close-btn p-1.5 rounded-[4px] text-white/60 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/15 transition cursor-pointer flex items-center justify-center"
              title="Đóng"
              aria-label="Close"
              data-role="close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="py-4 space-y-4 relative z-10 overflow-y-auto">
          {/* Main Cheer Tap Component */}
          <AudienceCheerButton user={user} isHighContrast={isHighContrast} />

          {/* Live Stage Stats Bento Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="fluent-box-nested rounded-[4px] p-3 border border-white/10">
              <div className="text-[10px] font-mono text-white/50 uppercase">{localLanguage === 'en' ? 'Audience Heartbeat' : 'Nhịp tim khán phòng'}</div>
              <div className="text-xl font-mono font-black text-rose-400 flex items-center gap-1.5 mt-1">
                <Activity className="w-4 h-4 text-rose-400 animate-pulse" />
                {intensityData.bpm} <span className="text-xs text-white/40">BPM</span>
              </div>
              <div className="text-[10px] font-mono text-white/60 mt-0.5" style={{ color: intensityData.colorHex }}>
                {intensityData.levelTitle}
              </div>
            </div>

            <div className="fluent-box-nested rounded-[4px] p-3 border border-white/10">
              <div className="text-[10px] font-mono text-white/50 uppercase">{localLanguage === 'en' ? 'Total Cheers' : 'Tổng lượt tiếp lửa'}</div>
              <div className="text-xl font-mono font-black text-amber-400 flex items-center gap-1.5 mt-1">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {intensityData.totalCheers.toLocaleString('vi-VN')}
              </div>
              <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                {intensityData.activeCheerers > 0 ? (localLanguage === 'en' ? `${intensityData.activeCheerers} audiences tapping` : `${intensityData.activeCheerers} khán giả đang gõ`) : (localLanguage === 'en' ? 'Ready to cheer' : 'Sẵn sàng tiếp lửa')}
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/50">
          <span>{t("cheer_sync", localLanguage)}</span>
          <button
            type="button"
            onClick={onClose}
            className="text-rose-300 hover:text-rose-200 font-bold underline"
          >
            Đóng bảng
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
