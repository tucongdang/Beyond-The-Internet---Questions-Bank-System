import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FirebaseConfig } from '../types';
import { syncService } from '../services/syncService';
import { Database, CheckCircle2, AlertTriangle, ExternalLink, X, Save, RefreshCw } from 'lucide-react';
import { soundFx } from '../services/audioEffects';
import { vibrateSubmit, vibrateSuccess, vibrateError, vibrateTap } from '../utils/hapticUtils';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose,
  isConnected
}) => {
  useLockBodyScroll(isOpen);

  const existingConfig = syncService.getFirebaseConfig();
  const [databaseURL, setDatabaseURL] = useState(existingConfig?.databaseURL || '');
  const [apiKey, setApiKey] = useState(existingConfig?.apiKey || '');
  const [projectId, setProjectId] = useState(existingConfig?.projectId || '');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!databaseURL.trim()) {
      vibrateError();
      setStatusMsg({ type: 'error', text: 'Vui lòng nhập Firebase Database URL (https://...firebaseio.com)' });
      return;
    }

    soundFx.playClick();
    vibrateSubmit();
    const config: FirebaseConfig = {
      databaseURL: databaseURL.trim(),
      apiKey: apiKey.trim() || undefined,
      projectId: projectId.trim() || undefined
    };

    const success = syncService.initializeFirebase(config);
    if (success) {
      vibrateSuccess();
      setStatusMsg({ type: 'success', text: 'Đã kết nối thành công tới Firebase Realtime Database!' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      vibrateError();
      setStatusMsg({ type: 'error', text: 'Không thể kết nối. Vui lòng kiểm tra lại URL định dạng Firebase RTDB.' });
    }
  };

  const handleDisconnect = () => {
    soundFx.playClick();
    vibrateTap();
    syncService.disconnectFirebase();
    setDatabaseURL('');
    setApiKey('');
    setProjectId('');
    setStatusMsg({ type: 'success', text: 'Đã ngắt kết nối Firebase. Đang dùng chế độ Đồng bộ Realtime Cục bộ / Đa tab.' });
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      id="firebase-modal-overlay"
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn modal-backdrop-isolated select-none"
    >
      <div
        id="firebase-modal-card"
        className="w-full max-w-lg fluent-card rounded-2xl border border-slate-700/80 shadow-2xl p-6 text-slate-100 relative overflow-hidden bg-slate-900/95 overscroll-contain select-text"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0078D4] text-white flex items-center justify-center border border-blue-400/30 shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Cấu hình Firebase Realtime Database
              </h3>
              <p className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">
                Node Cluster Sync • Stage &amp; Multi-client
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status pill */}
        <div className="my-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className="font-medium text-slate-300">
              {isConnected
                ? 'Đã kết nối trực tiếp Firebase RTDB Cloud'
                : 'Chế độ Cục bộ & Broadcast Sync Đa Tab (Không cần cài đặt)'}
            </span>
          </div>
          {isConnected && (
            <button
              onClick={handleDisconnect}
              className="text-rose-400 hover:text-rose-300 font-mono text-[11px] font-semibold"
            >
              Ngắt kết nối
            </button>
          )}
        </div>

        {statusMsg && (
          <div
            className={`p-3 mb-4 rounded-xl text-xs flex items-center gap-2 border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          <div>
            <label
              htmlFor="input-firebase-url"
              className="block font-medium text-slate-300 mb-1"
            >
              Firebase Database URL <span className="text-rose-400">*</span>
            </label>
            <input
              id="input-firebase-url"
              type="text"
              placeholder="https://bti2026-default-rtdb.asia-southeast1.firebasedatabase.app"
              value={databaseURL}
              onChange={(e) => setDatabaseURL(e.target.value)}
              className="w-full fluent-input px-3.5 py-2.5 text-xs font-mono placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="input-firebase-apikey"
                className="block font-medium text-slate-300 mb-1"
              >
                API Key (Tùy chọn)
              </label>
              <input
                id="input-firebase-apikey"
                type="text"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full fluent-input px-3.5 py-2.5 text-xs font-mono placeholder-slate-500"
              />
            </div>
            <div>
              <label
                htmlFor="input-firebase-projectid"
                className="block font-medium text-slate-300 mb-1"
              >
                Project ID (Tùy chọn)
              </label>
              <input
                id="input-firebase-projectid"
                type="text"
                placeholder="beyond-the-internet-2026"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full fluent-input px-3.5 py-2.5 text-xs font-mono placeholder-slate-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="fluent-btn-secondary px-4 py-2.5 text-xs font-mono"
            >
              Đóng
            </button>
            <button
              id="btn-save-firebase-config"
              type="submit"
              className="fluent-btn-primary px-5 py-2.5 text-xs font-mono flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Lưu &amp; Kết nối
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400">
          <p className="font-semibold text-slate-300 mb-1">
            Gợi ý bảo mật Firebase Rules (Công khai đọc/ghi trong giờ phát sóng):
          </p>
          <pre className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-700/60 font-mono text-[10px] text-emerald-400 overflow-x-auto">
{`{
  "rules": {
    "game_state": { ".read": true, ".write": true },
    "responses": { ".read": true, ".write": true },
    "presence": { ".read": true, ".write": true }
  }
}`}
          </pre>
        </div>
      </div>
    </div>,
    document.body
  );
};
