import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  Scale, 
  ArrowRight, 
  X, 
  Layers, 
  BookOpen, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  HelpCircle,
  ShieldCheck,
  Check
} from 'lucide-react';
import { LegalDocument } from '../../types';
import { questionBankManager } from '../../services/questionBankManager';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';
import { 
  notebookLMService, 
  NotebookLMCitation, 
  NotebookLMChatMessage 
} from '../../services/notebooklmService';

export interface NotebookLMChatViewProps {
  onUseForExamQuestion?: (params: {
    topic: string;
    legalReference?: string;
    docId?: string;
    contextText?: string;
  }) => void;
  className?: string;
  compactHeader?: boolean;
}

const DEFAULT_WELCOME_MESSAGE: NotebookLMChatMessage = {
  id: 'welcome-nb',
  role: 'model',
  text: 'Xin chào! Tôi là **NotebookLM Legal Agent** của Cuộc thi BTI 2026.\n\nMọi câu trả lời của tôi đều được **kiểm chứng và dẫn chứng chính xác (Grounded)** từ các văn bản pháp lý đang kích hoạt (Thông tư 02/2025/TT-BGDĐT, Nghị định 13/2023, Luật An ninh mạng...). Bạn có thể hỏi tôi về quy định, quyền nghĩa vụ, so sánh điều khoản hoặc áp dụng trực tiếp vào soạn câu hỏi thi BTI!',
  keyTakeaway: 'Nguồn căn cứ pháp lý đã sẵn sàng: Toàn bộ điều khoản đều được trích dẫn số hiệu và nội dung xác thực.',
  suggestedFollowUps: [
    'Tóm tắt các điểm mới của Thông tư 02/2025/TT-BGDĐT về Khung năng lực số',
    'Nghị định 13/2023 quy định những quyền gì của chủ thể dữ liệu cá nhân?',
    'Các hành vi nào bị nghiêm cấm trên không gian mạng theo Luật An ninh mạng 2018?',
    'Gợi ý 3 tình huống số thực tiễn có thể ra đề thi BTI 2026'
  ],
  timestamp: Date.now()
};

export const NotebookLMChatView: React.FC<NotebookLMChatViewProps> = ({
  onUseForExamQuestion,
  className = '',
  compactHeader = false
}) => {
  const documents = questionBankManager.getDocuments();

  // Active sources for NotebookLM grounding
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(() => {
    return new Set(documents.map(d => d.id));
  });

  const [showSourcesPanel, setShowSourcesPanel] = useState<boolean>(false);

  // Chat messages
  const [chatMessages, setChatMessages] = useState<NotebookLMChatMessage[]>([DEFAULT_WELCOME_MESSAGE]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [activeCitation, setActiveCitation] = useState<NotebookLMCitation | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const activeSources = documents.filter(d => selectedSourceIds.has(d.id));

  // Auto scroll
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const toggleSource = (id: string) => {
    vibrateTap();
    soundFx.playClick();
    setSelectedSourceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllSources = () => {
    vibrateTap();
    soundFx.playClick();
    if (selectedSourceIds.size === documents.length) {
      setSelectedSourceIds(new Set([documents[0]?.id]));
    } else {
      setSelectedSourceIds(new Set(documents.map(d => d.id)));
    }
  };

  const handleSendChat = async (queryText?: string) => {
    const q = queryText || chatInput;
    if (!q.trim() || isChatLoading) return;

    if (activeSources.length === 0) {
      alert('Vui lòng tích chọn ít nhất 1 nguồn văn bản pháp lý làm căn cứ.');
      return;
    }

    vibrateTap();
    soundFx.playClick();

    const userMsg: NotebookLMChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: q.trim(),
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const history = chatMessages.slice(-6).map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await notebookLMService.askChat({
        sources: activeSources,
        query: q.trim(),
        chatHistory: history
      });

      const modelMsg: NotebookLMChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: res.answer,
        citations: res.citations,
        keyTakeaway: res.keyTakeaway,
        suggestedFollowUps: res.suggestedFollowUps,
        timestamp: Date.now()
      };

      setChatMessages(prev => [...prev, modelMsg]);
      soundFx.playCorrect();
      vibrateSuccess();
    } catch (err: any) {
      console.error('NotebookLM Chat Error:', err);
      soundFx.playError();
      const errorMsg: NotebookLMChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `⚠️ **Không thể kiểm chứng nguồn:** ${err.message || 'Lỗi kết nối máy chủ NotebookLM.'}\nVui lòng thử lại hoặc giảm số lượng câu hỏi.`,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleApplyToStudio = (msg: NotebookLMChatMessage) => {
    if (!onUseForExamQuestion) return;
    vibrateTap();
    soundFx.playClick();

    const firstCitation = msg.citations?.[0];
    const legalRef = firstCitation 
      ? `${firstCitation.sourceTitle} (${firstCitation.article})` 
      : (activeSources[0]?.title || 'Thông tư 02/2025/TT-BGDĐT');

    const topic = msg.keyTakeaway || msg.text.slice(0, 160).replace(/\*\*/g, '');

    onUseForExamQuestion({
      topic,
      legalReference: legalRef,
      docId: activeSources[0]?.id,
      contextText: `${msg.text}\n\nCăn cứ: ${msg.citations?.map(c => `${c.documentNumber} - ${c.article}: ${c.snippet}`).join('; ')}`
    });
  };

  return (
    <div className={`space-y-3.5 flex flex-col ${className}`}>
      {/* Top Controls: Sources & Grounding Banner */}
      <div className="p-3 bg-black/40 rounded-[6px] border border-white/10 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-purple-300 bg-purple-950/60 px-2.5 py-1 rounded border border-purple-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>NotebookLM Grounded Chat</span>
          </div>

          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>{activeSources.length}/{documents.length} Nguồn luật đang bật</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSourcesPanel(!showSourcesPanel)}
            className="text-[11px] font-mono text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded border border-white/10 transition flex items-center gap-1 cursor-pointer"
          >
            <Layers className="w-3 h-3 text-purple-400" />
            <span>{showSourcesPanel ? 'Ẩn Nguồn' : 'Chọn Nguồn Luật'}</span>
            {showSourcesPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            type="button"
            onClick={toggleAllSources}
            className="text-[11px] font-mono text-purple-300 hover:text-purple-200 underline cursor-pointer"
          >
            {selectedSourceIds.size === documents.length ? 'Bỏ chọn' : 'Tất cả'}
          </button>
        </div>
      </div>

      {/* Expandable Sources Selector Drawer */}
      {showSourcesPanel && (
        <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-[6px] space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-[11px] font-mono text-white/60">
            <span>Tích chọn các văn bản pháp lý AI sẽ sử dụng để kiểm chứng và trích dẫn:</span>
            <span className="text-amber-300 font-bold">{activeSources.length} nguồn chọn</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {documents.map(doc => {
              const isChecked = selectedSourceIds.has(doc.id);
              return (
                <label
                  key={doc.id}
                  onClick={() => toggleSource(doc.id)}
                  className={`flex items-start gap-2 p-2 rounded border text-xs cursor-pointer transition select-none ${
                    isChecked
                      ? 'bg-purple-950/60 border-purple-400/50 text-white'
                      : 'bg-black/30 border-white/10 text-white/50 hover:text-white/80'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-3.5 h-3.5 mt-0.5 rounded text-purple-600 focus:ring-purple-500 border-white/30 bg-black/40 cursor-pointer shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-[10.5px] text-amber-300 block truncate">
                      {doc.documentNumber}
                    </span>
                    <span className="text-[11px] leading-tight line-clamp-1 block">
                      {doc.title}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar min-h-[420px] max-h-[560px]">
        {chatMessages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[85%] rounded-[6px] p-3.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-none shadow-md'
                  : 'bg-black/50 border border-white/15 text-white/90 rounded-bl-none shadow-md space-y-2.5'
              }`}
            >
              {/* Speaker Header */}
              <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-white/50 border-b border-white/10 pb-1">
                <span className="font-bold flex items-center gap-1">
                  {msg.role === 'user' ? 'Bạn' : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>NotebookLM Legal Agent</span>
                    </>
                  )}
                </span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Message Body */}
              <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed space-y-1">
                {msg.text}
              </div>

              {/* Key Takeaway Box */}
              {msg.keyTakeaway && (
                <div className="mt-2.5 p-2 bg-emerald-950/30 border border-emerald-500/30 rounded font-mono text-[11px] text-emerald-300 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Kết luận then chốt:</strong> {msg.keyTakeaway}
                  </div>
                </div>
              )}

              {/* Citations Chips */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1 font-mono">
                  <span className="text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1">
                    <Scale className="w-3 h-3 text-amber-400" />
                    Căn cứ trích dẫn kiểm chứng ({msg.citations.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {msg.citations.map((cite, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          soundFx.playClick();
                          setActiveCitation(cite);
                        }}
                        className="px-2 py-0.5 rounded text-[10.5px] bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition cursor-pointer flex items-center gap-1"
                        title="Xem chi tiết đoạn trích dẫn"
                      >
                        <span>[{cite.documentNumber} - {cite.article}]</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Follow-up Questions */}
              {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1 font-mono">
                  <span className="text-[10px] text-purple-300/80 block">Gợi ý câu hỏi tiếp theo:</span>
                  <div className="flex flex-col gap-1">
                    {msg.suggestedFollowUps.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendChat(sug)}
                        className="text-left text-[11px] text-white/80 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded border border-white/10 transition flex items-center justify-between group cursor-pointer"
                      >
                        <span>• {sug}</span>
                        <ArrowRight className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action: Use for Exam Question Studio */}
              {msg.role === 'model' && onUseForExamQuestion && msg.id !== 'welcome-nb' && (
                <div className="mt-2.5 pt-2 border-t border-white/10 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleApplyToStudio(msg)}
                    className="px-2.5 py-1 rounded bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-indigo-950/40"
                    title="Chuyển sang màn hình soạn thảo đề thi với căn cứ pháp lý này"
                  >
                    <FileQuestion className="w-3 h-3 text-amber-300" />
                    <span>Áp Dụng Soạn Đề Thi BTI</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isChatLoading && (
          <div className="flex items-center gap-2 p-3 bg-black/40 rounded-[6px] border border-white/10 text-xs font-mono text-purple-300 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
            <span>NotebookLM Agent đang tra cứu và kiểm chứng từ {activeSources.length} nguồn tài liệu...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Bar & Quick Prompts */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendChat();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={`Đặt câu hỏi pháp lý dựa trên ${activeSources.length} nguồn văn bản đang chọn...`}
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            disabled={isChatLoading}
            className="flex-1 bg-black/60 border border-white/20 rounded-[4px] px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:border-purple-400 focus:outline-none"
          />

          <button
            type="submit"
            disabled={isChatLoading || !chatInput.trim()}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/40 text-white rounded-[4px] text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-950/40 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Hỏi</span>
          </button>
        </form>

        {/* Quick Prompts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10.5px] font-mono text-white/70 custom-scrollbar">
          <span className="text-white/40 shrink-0">Gợi ý nhanh:</span>
          <button
            type="button"
            onClick={() => handleSendChat("Tóm tắt các điểm mới và phạm vi điều chỉnh của các văn bản đang chọn")}
            className="px-2 py-0.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded shrink-0 transition cursor-pointer"
          >
            Tóm tắt điểm mới
          </button>
          <button
            type="button"
            onClick={() => handleSendChat("Liệt kê các hành vi bị cấm và chế tài xử lý theo luật")}
            className="px-2 py-0.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded shrink-0 transition cursor-pointer"
          >
            Hành vi bị cấm
          </button>
          <button
            type="button"
            onClick={() => handleSendChat("Quy định cụ thể về bảo vệ dữ liệu cá nhân của người học và học sinh")}
            className="px-2 py-0.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded shrink-0 transition cursor-pointer"
          >
            Bảo vệ dữ liệu cá nhân
          </button>
          <button
            type="button"
            onClick={() => handleSendChat("Gợi ý 3 chủ đề tình huống hay cho đề thi BTI 2026")}
            className="px-2 py-0.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded shrink-0 transition cursor-pointer"
          >
            Chủ đề thi BTI 2026
          </button>
        </div>
      </div>

      {/* Citation Preview Modal */}
      {activeCitation && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveCitation(null)}
        >
          <div 
            className="bg-[#190839] border border-amber-500/40 rounded-[8px] max-w-lg w-full p-5 space-y-3 shadow-2xl text-white font-sans"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-mono font-bold text-amber-400 text-xs flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-amber-400" />
                Trích dẫn căn cứ pháp lý kiểm chứng
              </span>
              <button
                type="button"
                onClick={() => setActiveCitation(null)}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-white/50 block text-[10px] font-mono">Văn bản:</span>
                <span className="font-bold text-white text-xs">{activeCitation.sourceTitle} ({activeCitation.documentNumber})</span>
              </div>
              <div>
                <span className="text-white/50 block text-[10px] font-mono">Điều khoản:</span>
                <span className="font-bold text-amber-300 font-mono text-xs">{activeCitation.article}</span>
              </div>
              <div className="p-3 bg-black/40 rounded border border-white/10 text-white/85 leading-relaxed italic">
                "{activeCitation.snippet}"
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveCitation(null)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-mono font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
