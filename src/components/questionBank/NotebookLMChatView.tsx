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
      if (documents.length > 0) setSelectedSourceIds(new Set([documents[0].id]));
    } else {
      setSelectedSourceIds(new Set(documents.map(d => d.id)));
    }
  };

  const handleSendChat = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || chatInput;
    if (!promptToSend.trim() || isChatLoading) return;

    vibrateTap();
    soundFx.playClick();

    const userMessage: NotebookLMChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: promptToSend.trim(),
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMessage]);
    if (!overridePrompt) setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await notebookLMService.queryGroundedAnswer({
        query: promptToSend,
        sourceDocuments: activeSources
      });

      const modelMessage: NotebookLMChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: response.answer,
        citations: response.citations,
        keyTakeaway: response.keyTakeaway,
        suggestedFollowUps: response.suggestedQuestions,
        timestamp: Date.now()
      };

      setChatMessages(prev => [...prev, modelMessage]);
      vibrateSuccess();
    } catch (err: any) {
      const errorMessage: NotebookLMChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `Đã xảy ra lỗi khi tra cứu tài liệu: ${err?.message || 'Vui lòng kiểm tra lại API key hoặc kết nối mạng.'}`,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleApplyToStudio = (msg: NotebookLMChatMessage) => {
    if (!onUseForExamQuestion) return;
    vibrateSuccess();
    soundFx.playClick();

    const firstCitation = msg.citations && msg.citations.length > 0 ? msg.citations[0] : undefined;
    onUseForExamQuestion({
      topic: msg.keyTakeaway || msg.text.slice(0, 120),
      legalReference: firstCitation ? `${firstCitation.documentNumber} - ${firstCitation.article}` : undefined,
      docId: firstCitation?.documentId,
      contextText: firstCitation ? firstCitation.snippet : msg.text.slice(0, 300)
    });
  };

  return (
    <div className={`fluent-box rounded-[8px] flex flex-col p-4 sm:p-5 space-y-4 shadow-xl ${className}`}>
      {/* Header bar - Fluent 2 Header */}
      {!compactHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 text-[10.5px] font-mono font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Grounded Legal Assistant • NotebookLM</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Trợ Lý Pháp Lý Chuyên Sâu BTI</h3>
            <p className="text-xs text-white/60 font-sans">
              Hỏi đáp quy định, đối chiếu điều khoản và trích dẫn chuẩn hóa theo văn bản pháp quy.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-[4px] border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeSources.length}/{documents.length} Nguồn Bật</span>
            </span>

            <button
              type="button"
              onClick={() => { vibrateTap(); setShowSourcesPanel(!showSourcesPanel); }}
              className="fluent-btn-secondary px-2.5 py-1 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>{showSourcesPanel ? 'Ẩn Nguồn' : 'Chọn Nguồn'}</span>
              {showSourcesPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Expandable Sources Selector Drawer - Fluent 2 Nested Box */}
      {showSourcesPanel && (
        <div className="fluent-box-nested p-4 rounded-[6px] space-y-3 animate-fadeIn border border-purple-500/30">
          <div className="flex items-center justify-between text-xs font-mono text-white/70">
            <span className="font-bold text-amber-300">Tài liệu pháp lý đang nạp vào bộ nhớ Agent:</span>
            <button
              type="button"
              onClick={toggleAllSources}
              className="text-[11px] text-purple-300 hover:text-white underline cursor-pointer"
            >
              {selectedSourceIds.size === documents.length ? 'Bỏ chọn tất cả' : 'Chọn toàn bộ nguồn'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {documents.map(doc => {
              const isChecked = selectedSourceIds.has(doc.id);
              return (
                <label
                  key={doc.id}
                  onClick={() => toggleSource(doc.id)}
                  className={`flex items-start gap-2.5 p-2 rounded-[4px] border text-xs cursor-pointer transition select-none ${
                    isChecked
                      ? 'bg-purple-950/70 border-purple-400/50 text-white shadow-sm ring-1 ring-purple-400/30'
                      : 'bg-black/30 border-white/10 text-white/50 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-3.5 h-3.5 mt-0.5 rounded-[2px] text-purple-600 focus:ring-purple-500 border-white/30 bg-black/40 cursor-pointer shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-[10.5px] text-amber-300 block truncate">
                      {doc.documentNumber}
                    </span>
                    <span className="text-[11px] leading-tight line-clamp-1 block text-white/90">
                      {doc.title}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Messages Area - Fluent 2 Scrollable Stream */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar min-h-[420px] max-h-[560px]">
        {chatMessages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}
          >
            <div
              className={`max-w-[92%] sm:max-w-[85%] text-xs leading-relaxed transition-all ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-[8px] rounded-br-[2px] p-3.5 shadow-md'
                  : 'fluent-box-nested rounded-[8px] rounded-bl-[2px] p-4 text-white/90 shadow-md space-y-3 border border-white/15'
              }`}
            >
              {/* Speaker Header */}
              <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-white/50 border-b border-white/10 pb-1.5">
                <span className="font-bold flex items-center gap-1.5">
                  {msg.role === 'user' ? (
                    <span className="text-white/90">Bạn</span>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span className="text-amber-200">NotebookLM Legal Agent</span>
                    </>
                  )}
                </span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Message Body */}
              <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed space-y-1.5 text-white/95">
                {msg.text}
              </div>

              {/* Key Takeaway Box */}
              {msg.keyTakeaway && (
                <div className="mt-2.5 p-2.5 bg-emerald-950/30 border border-emerald-500/35 rounded-[4px] font-mono text-[11px] text-emerald-300 flex items-start gap-2 shadow-inner">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-200">Kết luận then chốt:</strong> {msg.keyTakeaway}
                  </div>
                </div>
              )}

              {/* Citations Chips - Fluent 2 Chips */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5 font-mono">
                  <span className="text-[10.5px] uppercase font-bold text-amber-300 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-amber-400" />
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
                        className="px-2.5 py-1 rounded-[4px] text-[10.5px] bg-amber-500/15 border border-amber-500/35 text-amber-200 hover:bg-amber-500/30 hover:border-amber-400 transition cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                        title="Xem chi tiết đoạn trích dẫn từ văn bản pháp lý"
                      >
                        <span>[{cite.documentNumber} - {cite.article}]</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Follow-up Questions */}
              {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5 font-mono">
                  <span className="text-[10px] text-purple-300/80 block uppercase tracking-wider">Gợi ý câu hỏi tiếp theo:</span>
                  <div className="flex flex-col gap-1.5">
                    {msg.suggestedFollowUps.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendChat(sug)}
                        className="text-left text-[11px] text-white/80 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-[4px] border border-white/10 transition flex items-center justify-between group cursor-pointer active:scale-[0.99]"
                      >
                        <span className="font-sans">• {sug}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-purple-400 opacity-0 group-hover:opacity-100 transition shrink-0 ml-1.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action: Use for Exam Question Studio */}
              {msg.role === 'model' && onUseForExamQuestion && msg.id !== 'welcome-nb' && (
                <div className="mt-2.5 pt-2.5 border-t border-white/10 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleApplyToStudio(msg)}
                    className="fluent-btn-primary px-3 py-1.5 text-[11px] font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                    title="Chuyển dữ liệu này sang màn hình soạn thảo câu hỏi thi BTI"
                  >
                    <FileQuestion className="w-3.5 h-3.5 text-[#190839]" />
                    <span>Áp Dụng Soạn Đề Thi BTI</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isChatLoading && (
          <div className="fluent-box-nested flex items-center gap-2.5 p-3.5 rounded-[6px] text-xs font-mono text-purple-300 animate-pulse border border-purple-500/30">
            <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
            <span>NotebookLM Agent đang tra cứu và kiểm chứng từ {activeSources.length} nguồn tài liệu...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Bar & Quick Prompts - Fluent 2 Input Controls */}
      <div className="space-y-2.5 pt-2 border-t border-white/10">
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
            className="fluent-input flex-1 bg-black/60 border border-white/20 rounded-[4px] px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:border-theme-accent focus:outline-none font-sans"
          />

          <button
            type="submit"
            disabled={isChatLoading || !chatInput.trim()}
            className="fluent-btn-primary px-4 py-2.5 text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-3.5 h-3.5 text-[#190839]" />
            <span>Gửi</span>
          </button>
        </form>

        {/* Quick Prompts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10.5px] font-mono text-white/70 custom-scrollbar">
          <span className="text-white/40 shrink-0">Gợi ý nhanh:</span>
          <button
            type="button"
            onClick={() => handleSendChat("Tóm tắt các điểm mới và phạm vi điều chỉnh của các văn bản đang chọn")}
            className="px-2 py-0.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-[3px] shrink-0 transition cursor-pointer"
          >
            Tóm tắt điểm mới
          </button>
          <button
            type="button"
            onClick={() => handleSendChat("Liệt kê các hành vi bị cấm và chế tài xử lý theo luật")}
            className="px-2 py-0.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-[3px] shrink-0 transition cursor-pointer"
          >
            Hành vi bị cấm
          </button>
          <button
            type="button"
            onClick={() => handleSendChat("Quy định cụ thể về bảo vệ dữ liệu cá nhân của người học và học sinh")}
            className="px-2 py-0.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-[3px] shrink-0 transition cursor-pointer"
          >
            Bảo vệ dữ liệu cá nhân
          </button>
          <button
            type="button"
            onClick={() => handleSendChat("Gợi ý 3 chủ đề tình huống hay cho đề thi BTI 2026")}
            className="px-2 py-0.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-[3px] shrink-0 transition cursor-pointer"
          >
            Chủ đề thi BTI 2026
          </button>
        </div>
      </div>

      {/* Citation Preview Modal - Fluent 2 Dialog */}
      {activeCitation && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveCitation(null)}
        >
          <div 
            className="fluent-box rounded-[8px] max-w-lg w-full p-5 space-y-3.5 shadow-2xl text-white font-sans border border-amber-500/40"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="font-mono font-bold text-amber-300 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Trích Dẫn Căn Cứ Pháp Lý Kiểm Chứng</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveCitation(null)}
                className="text-white/60 hover:text-white cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-white/50 block text-[10.5px] font-mono uppercase">Văn bản pháp quy:</span>
                <span className="font-bold text-white text-xs">{activeCitation.sourceTitle} ({activeCitation.documentNumber})</span>
              </div>
              <div>
                <span className="text-white/50 block text-[10.5px] font-mono uppercase">Điều khoản căn cứ:</span>
                <span className="font-bold text-amber-300 font-mono text-xs">{activeCitation.article}</span>
              </div>
              <div className="p-3.5 bg-black/50 rounded-[4px] border border-white/15 text-white/90 leading-relaxed italic font-serif">
                "{activeCitation.snippet}"
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveCitation(null)}
                className="fluent-btn-primary px-4 py-1.5 text-xs font-mono font-bold cursor-pointer"
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
