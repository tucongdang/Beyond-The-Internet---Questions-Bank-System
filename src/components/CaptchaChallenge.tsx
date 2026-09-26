import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { soundFx } from '../services/audioEffects';
import { vibrateTap } from '../utils/hapticUtils';

export interface CaptchaChallengeProps {
  value: string;
  captchaId?: string;
  onChange: (id: string, val: string) => void;
  disabled?: boolean;
  apiEndpoint?: string;
}

interface LocalCaptcha {
  id: string;
  question: string;
  answer: number;
}

function generateLocalCaptcha(): LocalCaptcha {
  const ops = ['+', '-', '×'] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  let n1: number;
  let n2: number;
  let ans: number;

  if (op === '+') {
    n1 = Math.floor(Math.random() * 40) + 10;
    n2 = Math.floor(Math.random() * 40) + 5;
    ans = n1 + n2;
  } else if (op === '-') {
    n1 = Math.floor(Math.random() * 40) + 20;
    n2 = Math.floor(Math.random() * (n1 - 5)) + 5;
    ans = n1 - n2;
  } else {
    n1 = Math.floor(Math.random() * 8) + 2;
    n2 = Math.floor(Math.random() * 8) + 2;
    ans = n1 * n2;
  }

  const id = `c_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  return {
    id,
    question: `${n1} ${op} ${n2} = ?`,
    answer: ans
  };
}

export const CaptchaChallenge: React.FC<CaptchaChallengeProps> = ({
  value,
  captchaId,
  onChange,
  disabled = false,
  apiEndpoint
}) => {
  const [localCaptcha, setLocalCaptcha] = useState<LocalCaptcha>(() => generateLocalCaptcha());
  const [isRotating, setIsRotating] = useState(false);

  const refreshCaptcha = useCallback(async () => {
    setIsRotating(true);
    soundFx.playClick();
    vibrateTap();

    if (apiEndpoint) {
      try {
        const res = await fetch(apiEndpoint);
        if (res.ok) {
          const data = await res.json();
          if (data.id && data.question) {
            setLocalCaptcha({ id: data.id, question: data.question, answer: data.answer ?? 0 });
            onChange(data.id, '');
            setTimeout(() => setIsRotating(false), 300);
            return;
          }
        }
      } catch {
        // Fallback to local generator
      }
    }

    const next = generateLocalCaptcha();
    setLocalCaptcha(next);
    onChange(next.id, '');
    setTimeout(() => setIsRotating(false), 300);
  }, [apiEndpoint, onChange]);

  // Initial notify if captchaId is empty
  useEffect(() => {
    if (!captchaId) {
      onChange(localCaptcha.id, value);
    }
  }, [captchaId, localCaptcha.id, onChange, value]);

  return (
    <div className="space-y-1 select-none">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] sm:text-[11px] font-mono font-bold text-white/70">
          Xác thực bảo vệ (CAPTCHA) *
        </label>
        <span className="text-[9px] text-sky-300 font-mono flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-sky-400" />
          <span>Chống tự động</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Math expression display */}
        <div
          onClick={refreshCaptcha}
          title="Nhấp để đổi bài toán khác"
          className="flex-1 px-3 py-1.5 bg-[#0D0420] border border-sky-500/30 hover:border-sky-400/60 rounded-[2px] flex items-center justify-between cursor-pointer transition shadow-inner group"
        >
          <span className="font-mono font-bold text-xs sm:text-sm text-sky-300 tracking-wider font-mono">
            {localCaptcha.question}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              refreshCaptcha();
            }}
            disabled={disabled}
            className="text-white/40 group-hover:text-white transition p-0.5"
            title="Đổi bài toán khác"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* User answer input */}
        <div className="w-28 sm:w-32 shrink-0">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            disabled={disabled}
            placeholder="Đáp án..."
            value={value}
            onChange={(e) => onChange(localCaptcha.id, e.target.value)}
            className="w-full bg-[#0D0420]/60 border border-white/10 hover:border-white/20 focus:border-sky-400 font-mono text-xs text-white text-center px-2 py-1.5 sm:py-2 rounded-[2px] outline-none transition placeholder:text-white/30 placeholder:text-xs placeholder:font-normal font-bold"
          />
        </div>
      </div>
    </div>
  );
};
