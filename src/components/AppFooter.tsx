import React from 'react';
import { 
  ShieldCheck, 
  Scale, 
  Database, 
  Layers, 
  FileText, 
  Sparkles,
  ExternalLink,
  Lock
} from 'lucide-react';
import { vibrateTap } from '../utils/hapticUtils';

interface AppFooterProps {
  onOpenLegalDocs?: () => void;
  onOpenFirebaseConfig?: () => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  onOpenLegalDocs,
  onOpenFirebaseConfig
}) => {
  return (
    <footer className="w-full select-none border-t border-theme-accent/20 bg-[#0c031d]/90 backdrop-blur-xl text-[#B6A6D8] mt-8 py-6 px-4 sm:px-6">
      <div className="max-w-[1560px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Branding & Core Mission */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="w-8 h-8 rounded-[4px] bg-theme-accent text-[#190839] flex items-center justify-center font-black text-xs shadow-md border border-theme-accent/40 shrink-0">
            BTI
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="font-bold text-white text-xs tracking-tight">
                BEYOND THE INTERNET 2026
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-theme-accent/15 text-theme-accent border border-theme-accent/30 font-semibold">
                KHẢO THÍ SỐ
              </span>
            </div>
            <p className="text-[11px] text-[#B6A6D8]/80 font-mono mt-0.5">
              Hệ thống Quản lý Ngân hàng Câu hỏi &amp; Khảo thí Năng lực số thế hệ mới
            </p>
          </div>
        </div>

        {/* Center: Regulatory Standards Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* TT 02/2025/TT-BGDĐT Badge */}
          <div 
            onClick={() => {
              vibrateTap();
              if (onOpenLegalDocs) onOpenLegalDocs();
            }}
            className="px-2.5 py-1 bg-[#241148] border border-theme-accent/30 rounded-[4px] flex items-center gap-1.5 shadow-sm text-[11px] font-mono hover:border-theme-accent/50 cursor-pointer transition"
            title="Thông tư 02/2025/TT-BGDĐT: Quy định Khung năng lực số cho người học trong hệ thống giáo dục quốc dân"
          >
            <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-theme-accent font-semibold">TT 02/2025/TT-BGDĐT</span>
          </div>

          {/* NĐ 13/2023/NĐ-CP Badge */}
          <div 
            onClick={() => {
              vibrateTap();
              if (onOpenLegalDocs) onOpenLegalDocs();
            }}
            className="px-2.5 py-1 bg-[#241148]/80 border border-theme-accent/20 rounded-[4px] flex items-center gap-1.5 shadow-sm text-[11px] font-mono hover:border-theme-accent/40 cursor-pointer transition"
            title="Nghị định 13/2023/NĐ-CP: Bảo vệ dữ liệu cá nhân & An toàn dữ liệu thí sinh"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-emerald-300">NĐ 13/2023/NĐ-CP</span>
          </div>

          {/* ISO / Standard Security Badge */}
          <div className="hidden lg:flex px-2 py-1 bg-[#241148]/60 border border-white/10 rounded-[4px] items-center gap-1.5 text-[10px] font-mono text-slate-300">
            <Lock className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>Mã hóa E2E &amp; IndexedDB</span>
          </div>
        </div>

        {/* Right: Technical Architecture & Realtime Sync Notice */}
        <div className="flex items-center gap-3 text-[11px] font-mono text-center md:text-right">
          <div className="flex flex-col items-center md:items-end">
            <span className="text-slate-200 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span>Firebase Cloud Sync</span>
            </span>
            <span className="text-[10px] text-[#B6A6D8]/60">IndexedDB Local • Offline First</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
