/**
 * ApiKeyConfigModal – Unified Gemini AI & Firebase Config panel
 * Allows users to configure & persist their Gemini API Key and Firebase settings.
 */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { geminiKeyService, KeyStatus } from '../services/geminiKeyService';
import { syncService } from '../services/syncService';
import { FirebaseConfig } from '../types';
import {
  Sparkles, Database, Key, Eye, EyeOff, CheckCircle2,
  AlertTriangle, ExternalLink, X, Save, Loader2, RefreshCw, Info
} from 'lucide-react';
import { soundFx } from '../services/audioEffects';
import { vibrateSubmit, vibrateSuccess, vibrateError, vibrateTap } from '../utils/hapticUtils';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface ApiKeyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = 'GEMINI' | 'FIREBASE';

export const ApiKeyConfigModal: React.FC<ApiKeyConfigModalProps> = ({ isOpen, onClose }) => {
  useLockBodyScroll(isOpen);

  const [activeTab, setActiveTab] = useState<ActiveTab>('GEMINI');

  // ── Gemini API Key state ────────────────────────────────────────────────────
  const [geminiKey, setGeminiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<KeyStatus>(() => geminiKeyService.getStatus());
  const [serverMasked, setServerMasked] = useState<string>('');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiMsg, setGeminiMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Firebase state ─────────────────────────────────────────────────────────
  const existingFirebase = syncService.getFirebaseConfig();
  const [fbUrl, setFbUrl] = useState(existingFirebase?.databaseURL || '');
  const [fbApiKey, setFbApiKey] = useState(existingFirebase?.apiKey || '');
  const [fbProjectId, setFbProjectId] = useState(existingFirebase?.projectId || '');
  const [fbMsg, setFbMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const isFirebaseConnected = syncService.getIsFirebaseConnected();

  // On mount, subscribe to key status & check server
  useEffect(() => {
    const unsub = geminiKeyService.subscribe(setKeyStatus);
    // Non-blocking: check if server already has a key
    geminiKeyService.checkServerStatus().then(({ hasKey, maskedKey }) => {
      if (hasKey && maskedKey) setServerMasked(maskedKey);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  // ── Gemini handlers ────────────────────────────────────────────────────────
  const handleSaveGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiKey.trim()) {
      vibrateError();
      setGeminiMsg({ type: 'error', text: 'Vui lòng nhập API Key từ Google AI Studio.' });
      return;
    }
    vibrateSubmit();
    soundFx.playClick();
    setGeminiLoading(true);
    setGeminiMsg(null);

    const { success, error } = await geminiKeyService.saveToServer(geminiKey.trim());
    setGeminiLoading(false);

    if (success) {
      vibrateSuccess();
      setGeminiMsg({ type: 'success', text: 'Đã lưu & xác thực Gemini API Key thành công! Tất cả tính năng AI sẵn sàng.' });
      setServerMasked(geminiKey.slice(0, 8) + '...' + geminiKey.slice(-4));
      setGeminiKey('');
    } else {
      vibrateError();
      setGeminiMsg({ type: 'error', text: error || 'Không thể xác thực API Key.' });
    }
  };

  const handleClearGemini = () => {
    vibrateTap();
    soundFx.playClick();
    geminiKeyService.clearLocal();
    setServerMasked('');
    setGeminiKey('');
    setGeminiMsg({ type: 'success', text: 'Đã xoá API Key khỏi thiết bị. (Key trên server .env vẫn còn cho đến khi server khởi động lại)' });
  };

  // ── Firebase handlers ──────────────────────────────────────────────────────
  const handleSaveFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbUrl.trim()) {
      vibrateError();
      setFbMsg({ type: 'error', text: 'Vui lòng nhập Firebase Database URL.' });
      return;
    }
    soundFx.playClick();
    vibrateSubmit();

    const config: FirebaseConfig = {
      databaseURL: fbUrl.trim(),
      apiKey: fbApiKey.trim() || undefined,
      projectId: fbProjectId.trim() || undefined,
    };

    const success = syncService.initializeFirebase(config);
    if (success) {
      vibrateSuccess();
      setFbMsg({ type: 'success', text: 'Đã kết nối Firebase! Cấu hình được lưu và sẽ tự động khôi phục sau khi tải lại trang.' });
    } else {
      vibrateError();
      setFbMsg({ type: 'error', text: 'Không thể kết nối. Kiểm tra lại URL Firebase RTDB.' });
    }
  };

  const handleDisconnectFirebase = () => {
    soundFx.playClick();
    vibrateTap();
    syncService.disconnectFirebase();
    setFbUrl('');
    setFbApiKey('');
    setFbProjectId('');
    setFbMsg({ type: 'success', text: 'Đã ngắt kết nối Firebase.' });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const geminiStatusBadge = (() => {
    if (keyStatus === 'valid' || serverMasked) {
      return { color: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Đã cấu hình' };
    }
    if (keyStatus === 'invalid') {
      return { color: 'text-rose-400', dot: 'bg-rose-400', label: 'Key không hợp lệ' };
    }
    return { color: 'text-amber-400', dot: 'bg-amber-400 animate-pulse', label: 'Chưa cấu hình' };
  })();

  return createPortal(
    <div
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn select-none"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-700/80 shadow-2xl text-slate-100 relative overflow-hidden bg-[#0e0520]/98 select-text flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-md">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cấu hình API Key & Kết nối</h3>
              <p className="text-[10px] uppercase font-mono text-slate-400 tracking-wider mt-0.5">
                Gemini AI • Firebase RTDB • Persistent Storage
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/60 shrink-0">
          {(['GEMINI', 'FIREBASE'] as ActiveTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => { vibrateTap(); setActiveTab(tab); }}
              className={`flex-1 py-3 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition border-b-2 ${
                activeTab === tab
                  ? 'border-theme-accent text-theme-accent bg-theme-accent/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {tab === 'GEMINI' ? <Sparkles className="w-3.5 h-3.5" /> : <Database className="w-3.5 h-3.5" />}
              {tab === 'GEMINI' ? 'Gemini AI API Key' : 'Firebase RTDB'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* ── GEMINI TAB ── */}
          {activeTab === 'GEMINI' && (
            <>
              {/* Status badge */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${geminiStatusBadge.dot}`} />
                  <span className={`font-semibold ${geminiStatusBadge.color}`}>{geminiStatusBadge.label}</span>
                  {serverMasked && (
                    <span className="font-mono text-slate-400 text-[11px]">({serverMasked})</span>
                  )}
                </div>
                {(keyStatus === 'valid' || serverMasked) && (
                  <button
                    onClick={handleClearGemini}
                    className="text-rose-400 hover:text-rose-300 font-mono text-[11px] font-semibold"
                  >
                    Xoá key cục bộ
                  </button>
                )}
              </div>

              {/* Info box */}
              <div className="flex gap-2.5 p-3 rounded-lg bg-blue-500/8 border border-blue-500/20 text-[11px] text-blue-300">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                <div className="space-y-1">
                  <p>Key Gemini AI miễn phí từ <strong>Google AI Studio</strong> và được lưu vào file <code className="bg-blue-500/15 px-1 rounded">.env</code> trên máy chủ. Key sẽ tồn tại qua các lần khởi động lại server.</p>
                  <p className="text-blue-400/80">Lưu ý: Mỗi lần nhập key sẽ được xác thực thật sự với Gemini API trước khi lưu.</p>
                </div>
              </div>

              {/* Status message */}
              {geminiMsg && (
                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                  geminiMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  {geminiMsg.type === 'success'
                    ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{geminiMsg.text}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSaveGemini} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Gemini API Key <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      autoComplete="off"
                      className="w-full fluent-input px-3.5 py-2.5 pr-10 text-xs font-mono placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-600/60 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white text-xs font-mono transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Lấy key miễn phí
                  </a>
                  <button
                    type="submit"
                    disabled={geminiLoading}
                    className="flex-1 fluent-btn-primary px-4 py-2.5 text-xs font-mono flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {geminiLoading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xác thực...</>
                      : <><Save className="w-4 h-4" /> Lưu & Xác thực</>}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── FIREBASE TAB ── */}
          {activeTab === 'FIREBASE' && (
            <>
              {/* Status */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isFirebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="font-medium text-slate-300">
                    {isFirebaseConnected ? 'Đã kết nối Firebase RTDB Cloud' : 'Chế độ Cục bộ / Đa Tab (Không cần cài đặt)'}
                  </span>
                </div>
                {isFirebaseConnected && (
                  <button onClick={handleDisconnectFirebase} className="text-rose-400 hover:text-rose-300 font-mono text-[11px] font-semibold">
                    Ngắt kết nối
                  </button>
                )}
              </div>

              {/* Status message */}
              {fbMsg && (
                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                  fbMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  {fbMsg.type === 'success'
                    ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{fbMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveFirebase} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Firebase Database URL <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://bti2026-default-rtdb.asia-southeast1.firebasedatabase.app"
                    value={fbUrl}
                    onChange={(e) => setFbUrl(e.target.value)}
                    className="w-full fluent-input px-3.5 py-2.5 text-xs font-mono placeholder-slate-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">API Key (Tùy chọn)</label>
                    <input
                      type="text"
                      placeholder="AIzaSy..."
                      value={fbApiKey}
                      onChange={(e) => setFbApiKey(e.target.value)}
                      className="w-full fluent-input px-3.5 py-2.5 text-xs font-mono placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">Project ID (Tùy chọn)</label>
                    <input
                      type="text"
                      placeholder="beyond-the-internet-2026"
                      value={fbProjectId}
                      onChange={(e) => setFbProjectId(e.target.value)}
                      className="w-full fluent-input px-3.5 py-2.5 text-xs font-mono placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-end gap-2.5">
                  <button type="button" onClick={onClose} className="fluent-btn-secondary px-4 py-2.5 text-xs font-mono">
                    Đóng
                  </button>
                  <button type="submit" className="fluent-btn-primary px-5 py-2.5 text-xs font-mono flex items-center gap-2">
                    <Save className="w-4 h-4" /> Lưu & Kết nối
                  </button>
                </div>
              </form>

              {/* Firebase Rules hint */}
              <div className="pt-2 border-t border-slate-700/60 text-[11px] text-slate-400">
                <p className="font-semibold text-slate-300 mb-1.5">Gợi ý Firebase Rules (Phát sóng công khai):</p>
                <pre className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-700/60 font-mono text-[10px] text-emerald-400 overflow-x-auto">{`{
  "rules": {
    "game_state": { ".read": true, ".write": true },
    "responses":  { ".read": true, ".write": true },
    "presence":   { ".read": true, ".write": true }
  }
}`}</pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
