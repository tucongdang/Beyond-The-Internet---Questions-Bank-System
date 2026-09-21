import React, { useState, useRef, useEffect } from 'react';
import { FluentMarkdown } from '../common/FluentMarkdown';
import { 
  Send, 
  Bot, 
  User, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  RefreshCw, 
  ChevronDown,
  Cpu,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  CornerDownLeft
} from 'lucide-react';
import { 
  ChatMessage, 
  CHAT_ROLES, 
  ChatRolePreset, 
  sendGeminiChat 
} from '../../services/geminiStudioService';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';

const QUICK_PROMPTS = [
  'Gợi ý 1 câu hỏi VCNV 7 hàng về chủ đề Deepfake theo Thông tư 02/2025.',
  'Giải thích luật bấm chuông và cách trừ điểm vòng Khởi động BTI 2026.',
  'Soạn 1 tình huống Đúng/Sai 4 ý về bảo vệ dữ liệu cá nhân theo NĐ 13/2023.',
  'Tư vấn cách thiết kế phương án nhiễu (distractor) hay cho câu trắc nghiệm.'
];

export const GeminiChatTab: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<ChatRolePreset>(CHAT_ROLES[0]);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'init-1',
        role: 'model',
        text: `Xin chào! Tôi là **${CHAT_ROLES[0].title}**.\nTôi sẵn sàng hỗ trợ bạn biên soạn đề thi BTI 2026, tra cứu chuẩn năng lực số theo **Thông tư 02/2025/TT-BGDĐT** và thẩm định căn cứ pháp luật. Hãy đặt câu hỏi bất kỳ!`,
        timestamp: Date.now(),
        modelUsed: 'gemini-3.5-flash'
      }
    ];
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleRoleChange = (role: ChatRolePreset) => {
    setSelectedRole(role);
    setSelectedModel(role.recommendedModel);
    vibrateTap();
    soundFx.playClick();
    
    // Add system notification in chat
    const switchMsg: ChatMessage = {
      id: 'switch-' + Date.now(),
      role: 'model',
      text: `*Đã chuyển sang vai trò:* **${role.title}** (${role.badge})\n_${role.description}_`,
      timestamp: Date.now(),
      modelUsed: role.recommendedModel
    };
    setMessages(prev => [...prev, switchMsg]);
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'u-' + Date.now(),
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);
    vibrateTap();
    soundFx.playClick();

    try {
      const historyPayload = [...messages, userMsg].map(m => ({
        role: m.role,
        text: m.text
      }));

      const result = await sendGeminiChat(
        historyPayload,
        selectedRole.systemInstruction,
        selectedModel
      );

      const aiMsg: ChatMessage = {
        id: 'm-' + Date.now(),
        role: 'model',
        text: result.text,
        timestamp: Date.now(),
        modelUsed: result.usedModel
      };

      setMessages(prev => [...prev, aiMsg]);
      soundFx.playSuccess();
      vibrateSuccess();
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        role: 'model',
        text: `⚠️ **Không thể kết nối với Gemini:** ${err.message || 'Đã có lỗi xảy ra.'}\n\n*Hệ thống đã tự động thử các mô hình dự phòng. Vui lòng thử lại hoặc chọn mô hình khác.*`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    vibrateTap();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện không?')) {
      setMessages([
        {
          id: 'init-reset',
          role: 'model',
          text: `Đã làm mới cuộc hội thoại với **${selectedRole.title}**. Bạn cần hỗ trợ gì tiếp theo?`,
          timestamp: Date.now(),
          modelUsed: selectedModel
        }
      ]);
      vibrateTap();
      soundFx.playClick();
    }
  };

  return (
    <div className="flex flex-col h-full flex-1 min-h-0 bg-[#120529]/80 rounded-[6px] border border-theme-accent/20 overflow-hidden shadow-xl">
      {/* Top CommandBar: Role selector & Model picker */}
      <div className="p-2 sm:p-3 bg-[#190839]/90 border-b border-theme-accent/20 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        {/* Role Segmented Group */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full no-scrollbar">
          {CHAT_ROLES.map(role => {
            const isSelected = selectedRole.id === role.id;
            return (
              <button
                key={role.id}
                onClick={() => handleRoleChange(role)}
                className={`px-2.5 py-1.5 rounded-[4px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'fluent-btn-primary border-transparent shadow-sm font-bold'
                    : 'bg-[#241148]/60 text-white/70 hover:bg-[#3E1D74]/70 hover:text-white border-white/10'
                }`}
              >
                <span>{role.title}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-[2px] font-mono ${
                  isSelected ? 'bg-[#190839]/20 text-[#190839] font-bold' : 'bg-white/10 text-white/60'
                }`}>
                  {role.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Model Picker & Reset */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 bg-[#0D0420]/80 px-2 py-1 rounded-[4px] border border-theme-accent/20 text-xs">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-white/90 text-xs font-mono outline-none cursor-pointer"
            >
              <option value="gemini-3.5-flash" className="bg-[#190839] text-white">gemini-3.5-flash (Chuẩn)</option>
              <option value="gemini-3.1-pro-preview" className="bg-[#190839] text-white">gemini-3.1-pro (Suy luận)</option>
              <option value="gemini-3.1-flash-lite" className="bg-[#190839] text-white">gemini-3.1-flash-lite (Nhanh)</option>
              <option value="gemini-3.8-flash" className="bg-[#190839] text-white">gemini-3.8-flash (Mới)</option>
            </select>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-1.5 text-white/50 hover:text-rose-400 hover:bg-rose-500/10 rounded-[4px] transition-colors cursor-pointer border border-transparent hover:border-rose-500/20"
            title="Làm mới cuộc trò chuyện"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Thread (Flexibly scales with container) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-4 font-sans text-xs sm:text-sm">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-2.5 sm:gap-3 max-w-[92%] sm:max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-[4px] flex items-center justify-center shrink-0 shadow-sm ${
                isUser 
                  ? 'bg-gradient-to-tr from-amber-400 to-rose-400 text-black font-bold' 
                  : 'bg-theme-accent/20 border border-theme-accent/40 text-theme-accent'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="space-y-1 min-w-0">
                <div
                  className={`p-3 sm:p-3.5 rounded-[6px] leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-theme-accent to-[#E39A96] text-[#190839] font-medium shadow-sm border border-theme-accent/40 whitespace-pre-wrap'
                      : 'fluent-card bg-[#1E0E3D]/85 border border-theme-accent/20 text-white/95 shadow-sm'
                  }`}
                >
                  {isUser ? (
                    m.text
                  ) : (
                    <FluentMarkdown content={m.text} />
                  )}
                </div>

                <div className={`flex items-center gap-2 text-[10px] sm:text-[11px] text-white/40 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <span>{new Date(m.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  {m.modelUsed && (
                    <span className="font-mono text-[9px] text-cyan-300 bg-cyan-950/50 px-1.5 py-0.2 rounded-[2px] border border-cyan-500/20">
                      {m.modelUsed}
                    </span>
                  )}
                  {!isUser && (
                    <button
                      onClick={() => handleCopy(m.text, m.id)}
                      className="hover:text-white/90 transition-colors p-0.5 rounded-[2px] cursor-pointer"
                      title="Sao chép nội dung"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2.5 max-w-[85%] mr-auto items-center animate-pulse">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[4px] bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-2.5 sm:p-3 bg-[#1E0E3D]/80 rounded-[6px] text-xs text-cyan-300 font-mono flex items-center gap-2 border border-cyan-500/20">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>Gemini đang tra cứu và suy luận câu trả lời...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3 sm:px-4 py-1.5 bg-[#0D0420]/70 border-t border-theme-accent/15 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-[10px] sm:text-[11px] text-white/50 shrink-0">Gợi ý nhanh:</span>
        {QUICK_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            disabled={isLoading}
            className="text-[10px] sm:text-[11px] bg-[#241148]/60 hover:bg-[#3E1D74]/80 text-white/80 hover:text-white px-2.5 py-1 rounded-[4px] whitespace-nowrap transition-colors border border-theme-accent/15 cursor-pointer disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Dock */}
      <div className="p-2.5 sm:p-3 md:p-3.5 bg-[#160733] border-t border-theme-accent/20 flex items-end gap-2 shrink-0">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={`Hỏi ${selectedRole.title}... (Shift + Enter để xuống dòng)`}
          rows={2}
          className="fluent-input flex-1 p-2.5 sm:p-3 text-xs sm:text-sm text-white placeholder-white/40 resize-none rounded-[4px]"
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputMessage.trim() || isLoading}
          className="fluent-btn-primary h-11 px-4 sm:px-5 rounded-[4px] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none shrink-0"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Gửi</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
