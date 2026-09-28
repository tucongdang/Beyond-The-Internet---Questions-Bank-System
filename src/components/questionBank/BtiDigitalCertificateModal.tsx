import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Award, 
  Download, 
  Printer, 
  X, 
  CheckCircle2, 
  QrCode, 
  ShieldCheck, 
  Sparkles, 
  Scale, 
  Calendar, 
  User,
  Share2
} from 'lucide-react';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface BtiDigitalCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName?: string;
  candidateScore?: number;
  candidateRank?: string;
}

export const BtiDigitalCertificateModal: React.FC<BtiDigitalCertificateModalProps> = ({
  isOpen,
  onClose,
  candidateName = 'NGUYỄN VĂN AN',
  candidateScore = 96,
  candidateRank = 'XUẤT SẮC - CẤP ĐỘ CAO (LEVEL 4)'
}) => {
  useLockBodyScroll(isOpen);

  const [studentName, setStudentName] = useState<string>(candidateName);
  const [certId] = useState<string>(() => `BTI-2026-CERT-${Math.floor(100000 + Math.random() * 900000)}`);
  const certDate = new Date().toLocaleDateString('vi-VN');

  const handlePrint = () => {
    vibrateTap();
    soundFx.playClick();
    window.print();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-[#120625] border border-amber-500/50 rounded-[8px] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden text-white font-sans"
      >
        {/* Modal Top Bar */}
        <div className="h-12 px-4 bg-[#0d031c] border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Chứng Nhận Năng Lực Số BTI 2026 (Thông tư 02/2025/TT-BGDĐT)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="h-8 px-3 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In / Tải PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Canvas Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar flex items-center justify-center bg-[#070110]">
          {/* A4 Landscape Ratio Certificate Container */}
          <div className="w-full max-w-3xl aspect-[1.414/1] bg-gradient-to-br from-[#1b0d36] via-[#100424] to-[#250f4a] border-4 border-amber-400/80 rounded-[8px] p-6 sm:p-8 flex flex-col justify-between relative shadow-[0_0_50px_rgba(245,158,11,0.25)] text-center font-serif text-amber-100 select-none">
            
            {/* Elegant Corner Ornaments */}
            <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400/80" />
            <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400/80" />
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400/80" />
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400/80" />

            {/* Certificate Header */}
            <div className="space-y-1">
              <div className="text-[10px] sm:text-xs tracking-[0.25em] uppercase font-sans font-bold text-amber-400">
                CUỘC THI TÌM HIỂU NĂNG LỰC SỐ • BEYOND THE INTERNET 2026
              </div>
              <h1 className="text-xl sm:text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 uppercase drop-shadow">
                GIẤY CHỨNG NHẬN NĂNG LỰC SỐ
              </h1>
              <p className="text-[11px] sm:text-xs font-sans text-white/70 italic">
                Căn cứ theo Khung chuẩn Năng lực số cho người học ban hành kèm Thông tư 02/2025/TT-BGDĐT
              </p>
            </div>

            {/* Candidate Name & Title */}
            <div className="space-y-2 py-2">
              <p className="text-xs sm:text-sm font-sans text-amber-200/90">Chứng nhận Thí sinh / Học viên:</p>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-wider text-amber-300 uppercase font-serif drop-shadow-md">
                {studentName}
              </h2>
              <p className="text-xs sm:text-sm font-sans text-white/80 max-w-xl mx-auto leading-relaxed">
                Đã hoàn thành xuất sắc kỳ thi sát hạch toàn diện 6 Miền năng lực số BTI 2026 với kết quả:
              </p>
              <div className="inline-flex items-center gap-3 bg-amber-500/20 border border-amber-400/40 px-4 py-1 rounded-full text-xs sm:text-sm font-mono font-bold text-amber-300">
                <span>Điểm tổng: {candidateScore}/100</span>
                <span>•</span>
                <span>Xếp loại: {candidateRank}</span>
              </div>
            </div>

            {/* 6 Competency Domains Badge Grid */}
            <div className="grid grid-cols-6 gap-1.5 py-1 text-[9px] sm:text-[10px] font-mono text-white/80">
              {['1. Dữ liệu', '2. Giao tiếp', '3. Sáng tạo', '4. An toàn', '5. Giải quyết', '6. Ứng dụng AI'].map((m, i) => (
                <div key={i} className="p-1 rounded bg-black/40 border border-amber-500/20 truncate">
                  <span className="text-amber-300 font-bold block">✓ Đạt Chuẩn</span>
                  <span className="truncate">{m}</span>
                </div>
              ))}
            </div>

            {/* Certificate Footer & Seal */}
            <div className="flex items-end justify-between text-left text-xs font-sans pt-2 border-t border-amber-400/30">
              {/* QR Verification */}
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 bg-white p-1 rounded flex items-center justify-center shrink-0">
                  <QrCode className="w-full h-full text-slate-950" />
                </div>
                <div className="text-[10px] font-mono text-white/70 space-y-0.5">
                  <div className="text-amber-300 font-bold">Mã số: {certId}</div>
                  <div>Ngày cấp: {certDate}</div>
                  <div className="text-emerald-400">Xác thực: bti.edu.vn/verify</div>
                </div>
              </div>

              {/* Official Gold Seal & Sign */}
              <div className="text-center font-sans space-y-1">
                <div className="text-[11px] text-amber-200">TM. HỘI ĐỒNG KHẢO THÍ BTI 2026</div>
                <div className="text-[10px] text-white/50 italic">CHỦ TỊCH HỘI ĐỒNG</div>
                <div className="text-sm font-serif font-bold text-amber-300 pt-3">
                  (Đã ký số điện tử)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
