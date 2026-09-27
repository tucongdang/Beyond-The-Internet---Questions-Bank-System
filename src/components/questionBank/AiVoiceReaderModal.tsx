import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Sparkles, 
  Mic, 
  Radio, 
  Sliders, 
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';
import { QuestionItem } from '../../types';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface AiVoiceReaderModalProps {
  isOpen: boolean;
  question: QuestionItem | null;
  onClose: () => void;
}

export const AiVoiceReaderModal: React.FC<AiVoiceReaderModalProps> = ({
  isOpen,
  question,
  onClose
}) => {
  useLockBodyScroll(isOpen);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [readingSection, setReadingSection] = useState<'QUESTION' | 'OPTIONS' | 'EXPLANATION' | 'ALL'>('ALL');
  const [activeSpeechIndex, setActiveSpeechIndex] = useState<number>(0);

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const getFullRecitationText = () => {
    if (!question) return '';
    let text = `Câu hỏi khảo thí BTI 2026. ${question.question_text}. `;
    if (readingSection === 'ALL' || readingSection === 'OPTIONS') {
      text += `Phương án A: ${question.options?.A || ''}. `;
      text += `Phương án B: ${question.options?.B || ''}. `;
      text += `Phương án C: ${question.options?.C || ''}. `;
      text += `Phương án D: ${question.options?.D || ''}. `;
    }
    if (readingSection === 'ALL' || readingSection === 'EXPLANATION') {
      text += `Đáp án chính xác là ${question.correct_key}. Giải thích: ${question.explanation || ''}. `;
      if (question.legal_reference) {
        text += `Căn cứ theo ${question.legal_reference}.`;
      }
    }
    return text;
  };

  const handlePlayVoice = () => {
    if (!synthRef.current || !question) return;

    vibrateTap();
    soundFx.playClick();

    if (isPlaying) {
      synthRef.current.cancel();
      setIsPlaying(false);
      return;
    }

    synthRef.current.cancel();

    const textToSpeak = getFullRecitationText();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'vi-VN';
    utterance.rate = speed;
    utterance.pitch = pitch;

    // Look for Vietnamese voice
    const voices = synthRef.current.getVoices();
    const viVoice = voices.find(v => v.lang.includes('vi') || v.lang.includes('VN'));
    if (viVoice) {
      utterance.voice = viVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const handleStopVoice = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    vibrateTap();
  };

  if (!isOpen || !question || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleStopVoice();
          onClose();
        }
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#15072B] border border-cyan-500/40 rounded-[6px] shadow-2xl overflow-hidden text-white font-sans"
      >
        {/* Header */}
        <div className="h-12 px-4 bg-[#0e041f] border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Giọng Đọc Đề Thi AI (MC Recitation Voice)</span>
          </div>
          <button
            onClick={() => {
              handleStopVoice();
              onClose();
            }}
            className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 text-xs">
          {/* Audio Wave Visualizer Simulation */}
          <div className="p-4 rounded bg-black/60 border border-cyan-500/30 flex flex-col items-center justify-center gap-3">
            <div className="flex items-center gap-1.5 h-10">
              {[40, 75, 90, 50, 85, 100, 60, 45, 95, 70, 80, 60, 30].map((h, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 bg-gradient-to-t from-cyan-500 to-sky-300 rounded-full transition-all duration-150 ${
                    isPlaying ? 'animate-pulse' : 'opacity-40'
                  }`}
                  style={{ height: isPlaying ? `${h}%` : '20%' }}
                />
              ))}
            </div>
            <div className="text-[11px] font-mono text-cyan-300 font-bold flex items-center gap-2">
              <span>{isPlaying ? '🎙️ Đang đọc đề thi trực tiếp...' : '⏹️ Sẵn sàng phát âm thanh'}</span>
            </div>
          </div>

          {/* Question Snippet */}
          <div className="p-2.5 rounded bg-white/[0.03] border border-white/10 text-white/90 leading-relaxed font-sans text-xs">
            <strong className="text-cyan-300 font-mono">Nội dung đọc:</strong> {question.question_text}
          </div>

          {/* Controls: Speed & Pitch */}
          <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
            <div className="space-y-1">
              <div className="flex justify-between text-white/70">
                <span>Tốc độ đọc:</span>
                <span className="text-cyan-300 font-bold">{speed}x</span>
              </div>
              <input 
                type="range" 
                min={0.7} 
                max={1.5} 
                step={0.1}
                value={speed}
                onChange={e => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-white/70">
                <span>Cao độ giọng:</span>
                <span className="text-cyan-300 font-bold">{pitch.toFixed(1)}</span>
              </div>
              <input 
                type="range" 
                min={0.8} 
                max={1.3} 
                step={0.1}
                value={pitch}
                onChange={e => setPitch(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Play / Stop Button */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePlayVoice}
              className={`flex-1 py-2.5 px-4 rounded font-mono font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                isPlaying 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Tạm Dừng Giọng Đọc</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Phát Giọng Đọc MC (Việt Nam)</span>
                </>
              )}
            </button>

            {isPlaying && (
              <button
                type="button"
                onClick={handleStopVoice}
                className="px-3 py-2.5 rounded bg-rose-600/30 hover:bg-rose-600 border border-rose-500/40 text-rose-200 hover:text-white transition cursor-pointer"
                title="Dừng hẳn"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
