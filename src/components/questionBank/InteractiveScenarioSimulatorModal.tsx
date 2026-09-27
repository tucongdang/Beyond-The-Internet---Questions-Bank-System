import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldAlert, 
  Terminal, 
  Mail, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  RotateCw, 
  Sparkles, 
  Play, 
  ShieldCheck, 
  Eye, 
  Lock, 
  Globe, 
  ExternalLink,
  Award,
  Zap,
  ArrowRight,
  HelpCircle,
  Clock
} from 'lucide-react';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateError } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface InteractiveScenarioSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ScenarioSimulation {
  id: string;
  title: string;
  category: string;
  domain: string;
  legalBase: string;
  scenarioDescription: string;
  simulatedUiType: 'PHISHING_EMAIL' | 'FAKE_PORTAL' | 'RANSOMWARE_ALERT' | 'DATA_BREACH';
  simulatedData: {
    sender?: string;
    subject?: string;
    url?: string;
    bodyText?: string;
    warningHeader?: string;
    ransomAmount?: string;
    countdownSeconds?: number;
  };
  options: {
    id: string;
    label: string;
    isSafe: boolean;
    score: number;
    feedback: string;
    legalNote: string;
  }[];
}

const BTI_SCENARIOS: ScenarioSimulation[] = [
  {
    id: 'sc_01',
    title: 'Tình huống 1: Email Khẩn Mạo Danh Phòng Đào Tạo',
    category: 'An Toàn Số & Phòng Chống Phishing',
    domain: 'MIEN_4 (An toàn & Bảo mật Số)',
    legalBase: 'Khoản 2 Điều 4 Thông tư 02/2025/TT-BGDĐT & Nghị định 13/2023/NĐ-CP',
    scenarioDescription: 'Bạn nhận được email thông báo khẩn cấp từ "phongdaotao@daihoc-edu-vn.com" yêu cầu xác nhận tài khoản sinh viên và cập nhật CCCD trước 24h để tránh bị đình chỉ môn học.',
    simulatedUiType: 'PHISHING_EMAIL',
    simulatedData: {
      sender: 'Phòng Đào Tạo Đại Học <admin@daihoc-edu-vn.com.xyz>',
      subject: '[KHẨN CẤP] Xác minh thông tin CCCD & Cổng sinh viên tránh hủy lịch thi',
      url: 'https://sinhvien-portal-auth-verification.com/login-sso',
      bodyText: 'Kính gửi Sinh viên, Hệ thống ghi nhận tài khoản của bạn chưa cập nhật xác thực 2 lớp (2FA) và số CCCD gắn chip theo quy định mới. Vui lòng bấm vào liên kết bên dưới và đăng nhập bằng tài khoản Cổng trường để hoàn tất xác minh trong vòng 6 giờ.'
    },
    options: [
      {
        id: 'opt_1',
        label: 'A. Bấm ngay vào đường link trong email và nhập mật khẩu cổng trường cùng ảnh 2 mặt CCCD để kịp hạn chót.',
        isSafe: false,
        score: 0,
        feedback: '❌ RẤT NGUY HIỂM! Tên miền người gửi là ".com.xyz" và liên kết đích là trang web giả mạo (Phishing) nhằm đánh cắp thông tin tài khoản và danh tính.',
        legalNote: 'Hành vi làm lộ dữ liệu cá nhân vi phạm nguyên tắc tự bảo vệ dữ liệu theo Điều 4 Nghị định 13/2023/NĐ-CP.'
      },
      {
        id: 'opt_2',
        label: 'B. Kiểm tra kỹ tên miền người gửi (@daihoc-edu-vn.com.xyz), KHÔNG bấm vào link, đăng nhập trực tiếp qua cổng chính thức và báo cáo cho Trung tâm CNTT của trường.',
        isSafe: true,
        score: 100,
        feedback: '✅ CHÍNH XÁC 100%! Bạn đã nhận diện đúng dấu hiệu Phishing qua tên miền phụ mạo danh và thực hiện đúng quy trình ứng phó sự cố.',
        legalNote: 'Đáp ứng năng lực 4.1 và 4.2 Khung năng lực số TT 02/2025/TT-BGDĐT về bảo vệ thiết bị và dữ liệu cá nhân.'
      },
      {
        id: 'opt_3',
        label: 'C. Chuyển tiếp email này vào nhóm Zalo lớp học để hỏi các bạn xem có ai nhận được giống mình không.',
        isSafe: false,
        score: 30,
        feedback: '⚠️ RỦI RO LAN TRUYỀN! Việc chuyển tiếp liên kết độc hại vào nhóm đông người có thể khiến các bạn khác bất cẩn bấm vào và bị lừa theo.',
        legalNote: 'Cần cảnh báo kèm khuyến cáo không bấm link thay vì chỉ gửi link thô.'
      }
    ]
  },
  {
    id: 'sc_02',
    title: 'Tình huống 2: Cảnh Báo Mã Độc Tống Tiền (Ransomware)',
    category: 'Ứng Phó Sự Cố Mã Độc & Dữ Liệu',
    domain: 'MIEN_4 (An toàn Số) & MIEN_1 (Dữ liệu Số)',
    legalBase: 'Luật An toàn thông tin mạng 2015 & Thông tư 02/2025/TT-BGDĐT',
    scenarioDescription: 'Màn hình máy tính phòng thực hành bất ngờ hiện cảnh báo toàn bộ tệp tài liệu đồ án tốt nghiệp (.docx, .pdf, .sql) đã bị mã hóa khóa AES-256.',
    simulatedUiType: 'RANSOMWARE_ALERT',
    simulatedData: {
      warningHeader: 'YOUR FILES ARE ENCRYPTED (BTI-LOCKER V2.4)',
      ransomAmount: '0.05 BTC (~$3,500 USD)',
      countdownSeconds: 86400,
      bodyText: 'Tất cả tài liệu của bạn đã bị mã hóa. Bạn có 24 giờ để chuyển tiền chuộc vào ví Bitcoin bên dưới. Nếu tắt máy hoặc báo cơ quan chức năng, khóa giải mã sẽ bị hủy vĩnh viễn.'
    },
    options: [
      {
        id: 'opt_1',
        label: 'A. Ngay lập tức ngắt kết nối mạng (rút dây LAN / tắt Wi-Fi), KHÔNG trả tiền chuộc, báo cán bộ quản trị mạng và khôi phục từ bản sao lưu (Backup ngoại tuyến).',
        isSafe: true,
        score: 100,
        feedback: '✅ XỬ LÝ CHUẨN XÁC! Ngắt kết nối mạng ngay lập tức giúp ngăn chặn mã độc lây lan sang các máy khác trong mạng nội bộ (Lateral Movement).',
        legalNote: 'Thực hiện đúng khuyến nghị của Cục An toàn thông tin - Bộ TT&TT về phòng chống Ransomware.'
      },
      {
        id: 'opt_2',
        label: 'B. Gom tiền chuyển Bitcoin cho kẻ tấn công để xin lại chìa khóa giải mã càng sớm càng tốt.',
        isSafe: false,
        score: 0,
        feedback: '❌ KHÔNG ĐƯỢC LÀM! Trả tiền chuộc không đảm bảo sẽ nhận lại dữ liệu và tiếp tay cho tội phạm mạng tiếp tục tống tiền.',
        legalNote: 'Khuyến cáo của các cơ quan an ninh mạng quốc tế và Việt Nam là tuyệt đối không thỏa hiệp với tống tiền mạng.'
      }
    ]
  }
];

export const InteractiveScenarioSimulatorModal: React.FC<InteractiveScenarioSimulatorModalProps> = ({
  isOpen,
  onClose
}) => {
  useLockBodyScroll(isOpen);

  const [activeScenarioIdx, setActiveScenarioIdx] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [completedScenarios, setCompletedScenarios] = useState<Record<string, number>>({});

  if (!isOpen || typeof document === 'undefined') return null;

  const currentScenario = BTI_SCENARIOS[activeScenarioIdx];
  const selectedOption = currentScenario.options.find(o => o.id === selectedOptionId);

  const handleSelectOption = (optId: string) => {
    if (hasSubmitted) return;
    vibrateTap();
    soundFx.playClick();
    setSelectedOptionId(optId);
  };

  const handleSubmitChoice = () => {
    if (!selectedOptionId || hasSubmitted) return;
    setHasSubmitted(true);
    const opt = currentScenario.options.find(o => o.id === selectedOptionId);
    if (opt?.isSafe) {
      soundFx.playPacingChime('complete');
      vibrateSuccess();
    } else {
      soundFx.playError();
      vibrateError();
    }

    const earned = opt?.score || 0;
    setCompletedScenarios(prev => ({ ...prev, [currentScenario.id]: earned }));
    setTotalScore(prev => prev + earned);
  };

  const handleNextScenario = () => {
    if (activeScenarioIdx < BTI_SCENARIOS.length - 1) {
      setActiveScenarioIdx(prev => prev + 1);
      setSelectedOptionId(null);
      setHasSubmitted(false);
      vibrateTap();
      soundFx.playClick();
    }
  };

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
        className="w-full max-w-5xl bg-[#110524]/95 border border-sky-500/40 rounded-[6px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white font-sans"
      >
        {/* Header */}
        <div className="h-14 px-4 bg-[#0a0218] border-b border-sky-500/20 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300">
              <ShieldAlert className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Giả Lập Tình Huống Tương Tác An Toàn Số (Interactive Sandbox)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  TT 02/2025 &amp; NĐ 13/2023
                </span>
              </div>
              <p className="text-[11px] text-white/60 truncate hidden sm:block">
                Mô phỏng giao diện hộp thư Phishing, mã độc và kịch bản ứng phó sự cố thực tế
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-mono bg-sky-950/60 border border-sky-500/30 px-2.5 py-1 rounded text-sky-300 font-bold">
              Điểm: {totalScore} pts
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scrollbar space-y-4">
          {/* Progress Pill Bar */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-1.5">
              {BTI_SCENARIOS.map((sc, i) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    setActiveScenarioIdx(i);
                    setSelectedOptionId(null);
                    setHasSubmitted(false);
                  }}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                    activeScenarioIdx === i 
                      ? 'bg-sky-500 text-white shadow' 
                      : completedScenarios[sc.id] !== undefined
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  Kịch bản {i + 1}
                </button>
              ))}
            </div>

            <span className="text-[11px] font-mono text-white/60">
              {currentScenario.category}
            </span>
          </div>

          {/* Scenario Description Card */}
          <div className="p-3.5 rounded bg-black/40 border border-sky-500/20 space-y-1 text-xs">
            <h3 className="font-bold text-sky-300 text-sm">{currentScenario.title}</h3>
            <p className="text-white/80 leading-relaxed">{currentScenario.scenarioDescription}</p>
          </div>

          {/* SIMULATED UI CANVAS */}
          {currentScenario.simulatedUiType === 'PHISHING_EMAIL' && (
            <div className="rounded border border-white/20 bg-[#1e1e24] shadow-2xl overflow-hidden font-sans text-xs">
              {/* Fake Email Client Bar */}
              <div className="bg-[#2d2d34] px-3 py-2 border-b border-white/10 flex items-center justify-between text-white/70">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-white text-[11px]">Hộp Thư Đến - Webmail Sinh Viên</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
              </div>

              {/* Email Content Header */}
              <div className="p-3 bg-[#24242b] border-b border-white/10 space-y-1 text-[11px]">
                <div><strong className="text-white/60">Người gửi:</strong> <span className="font-mono text-rose-300">{currentScenario.simulatedData.sender}</span></div>
                <div><strong className="text-white/60">Tiêu đề:</strong> <span className="text-white font-bold">{currentScenario.simulatedData.subject}</span></div>
              </div>

              {/* Email Body */}
              <div className="p-4 bg-white text-slate-900 space-y-3">
                <p className="leading-relaxed">{currentScenario.simulatedData.bodyText}</p>
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-center">
                  <span className="font-mono text-[11px] text-blue-700 underline font-bold cursor-pointer">
                    {currentScenario.simulatedData.url}
                  </span>
                </div>
              </div>
            </div>
          )}

          {currentScenario.simulatedUiType === 'RANSOMWARE_ALERT' && (
            <div className="rounded border-2 border-rose-500 bg-rose-950/90 text-white p-5 space-y-3 font-mono text-xs shadow-2xl">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 animate-pulse text-rose-400" />
                <span>{currentScenario.simulatedData.warningHeader}</span>
              </div>
              <p className="text-white/90 font-sans">{currentScenario.simulatedData.bodyText}</p>
              <div className="p-3 bg-black/60 border border-rose-500/40 rounded flex items-center justify-between">
                <span>Tiền chuộc yêu cầu: <strong className="text-amber-400">{currentScenario.simulatedData.ransomAmount}</strong></span>
                <span className="text-rose-300 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 23:59:45</span>
              </div>
            </div>
          )}

          {/* DECISION OPTIONS */}
          <div className="space-y-2 pt-2">
            <label className="text-[11px] font-mono uppercase font-bold text-sky-300 tracking-wider block">
              Lựa Chọn Quyết Định Xử Lý Của Bạn:
            </label>

            <div className="space-y-2">
              {currentScenario.options.map(opt => {
                const isSelected = selectedOptionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full p-3 rounded text-left transition flex items-start gap-2.5 cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-sky-950/80 border-2 border-sky-400 text-white font-semibold shadow-lg'
                        : 'bg-white/[0.03] border border-white/10 hover:border-white/30 text-white/80'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] shrink-0 font-mono ${
                      isSelected ? 'bg-sky-400 text-slate-950' : 'bg-white/10 text-white'
                    }`}>
                      {opt.id.replace('opt_', '')}
                    </span>
                    <span className="leading-relaxed">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action & Feedback */}
          {!hasSubmitted ? (
            <button
              type="button"
              onClick={handleSubmitChoice}
              disabled={!selectedOptionId}
              className="w-full py-2.5 px-4 rounded bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-white font-mono font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Xác Nhận Quyết Định &amp; Thẩm Định Kết Quả</span>
            </button>
          ) : (
            selectedOption && (
              <div className="space-y-3 animate-fadeIn">
                <div className={`p-4 rounded border ${selectedOption.isSafe ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' : 'bg-rose-950/40 border-rose-500/50 text-rose-200'} space-y-2 text-xs`}>
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span>{selectedOption.isSafe ? '✅ XỬ LÝ AN TOÀN' : '⚠️ NGUY HIỂM / SAI QUY CHUẨN'}</span>
                    <span>+{selectedOption.score} Điểm</span>
                  </div>
                  <p className="leading-relaxed font-sans">{selectedOption.feedback}</p>
                  <div className="text-[10.5px] font-mono text-amber-300 pt-1 border-t border-white/10">
                    ⚖️ {selectedOption.legalNote}
                  </div>
                </div>

                {activeScenarioIdx < BTI_SCENARIOS.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNextScenario}
                    className="w-full py-2.5 px-4 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <span>Kịch Bản Tiếp Theo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
