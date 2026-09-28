import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileText, 
  Upload, 
  Plus, 
  Trash2, 
  Scale, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  BookOpen, 
  Search, 
  Calendar, 
  Layers, 
  ArrowRight, 
  X,
  HardDrive,
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ShieldCheck,
  ListCheck,
  Sliders,
  Download,
  RefreshCw,
  Info,
  ChevronRight,
  ChevronDown,
  Compass,
  Zap
} from 'lucide-react';
import { LegalDocument, PickedDriveFile, QuestionItem } from '../../types';
import { questionBankManager } from '../../services/questionBankManager';
import { googlePickerService } from '../../services/googlePickerService';
import { GooglePickerTriggerButton } from '../common/GooglePickerTriggerButton';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateError } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { 
  notebookLMService, 
  NotebookLMCitation, 
  NotebookLMPodcast, 
  NotebookLMStudyGuide, 
  NotebookLMQuestion 
} from '../../services/notebooklmService';

interface LegalDocumentLibraryProps {
  onSelectForAI?: (doc: LegalDocument) => void;
}

type NotebookLMMode = 'INSPECTOR' | 'STUDY_GUIDE' | 'AUDIO' | 'DEEP_RESEARCH';

export const LegalDocumentLibrary: React.FC<LegalDocumentLibraryProps> = ({ onSelectForAI }) => {
  const [documents, setDocuments] = useState<LegalDocument[]>(() => questionBankManager.getDocuments());
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Active Sources for NotebookLM Grounding (Default: all documents active)
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(() => {
    return new Set(questionBankManager.getDocuments().map(d => d.id));
  });

  // Current NotebookLM Mode (Default: INSPECTOR - Chi tiết điều khoản)
  const [activeMode, setActiveMode] = useState<NotebookLMMode>('INSPECTOR');

  // Focus Article
  const [focusArticle, setFocusArticle] = useState<{ article: string; content: string } | null>(null);

  // 1. NotebookLM Audio Overview Podcast State
  const [podcast, setPodcast] = useState<NotebookLMPodcast | null>(null);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState<boolean>(false);
  const [isPlayingPodcast, setIsPlayingPodcast] = useState<boolean>(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const [copiedPodcast, setCopiedPodcast] = useState<boolean>(false);

  // 2. NotebookLM Study Guide State
  const [studyGuide, setStudyGuide] = useState<NotebookLMStudyGuide | null>(null);
  const [isGeneratingStudyGuide, setIsGeneratingStudyGuide] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // 3. Deep Research Pro State
  const [deepResearchTopic, setDeepResearchTopic] = useState<string>('');
  const [deepResearchDetails, setDeepResearchDetails] = useState<string>('');
  const [deepResearchDepth, setDeepResearchDepth] = useState<'fast' | 'max'>('fast');
  const [isResearching, setIsResearching] = useState<boolean>(false);
  const [researchReport, setResearchReport] = useState<string | null>(null);
  const [researchSteps, setResearchSteps] = useState<any[]>([]);
  const [researchStatusMsg, setResearchStatusMsg] = useState<string>('');
  const [copiedResearch, setCopiedResearch] = useState<boolean>(false);
  const researchPollTimerRef = useRef<any>(null);

  // Citation Preview Modal / Tooltip
  const [activeCitation, setActiveCitation] = useState<NotebookLMCitation | null>(null);

  useLockBodyScroll(showAddModal);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentDoc = documents.find(d => d.id === selectedDocId) || documents[0];
  const activeSources = documents.filter(d => selectedSourceIds.has(d.id));

  // New doc manual form
  const [newDocForm, setNewDocForm] = useState<Partial<LegalDocument>>({
    title: '',
    documentNumber: '',
    issuingAuthority: 'Bộ Giáo dục và Đào tạo',
    issueDate: '2025-01-24',
    effectiveDate: '2025-03-10',
    type: 'THONG_TU',
    summary: '',
    relatedDomains: ['MIEN_4'],
    keyArticles: [{ article: 'Điều 1', content: '' }]
  });

  const [uploadStatusText, setUploadStatusText] = useState<string | null>(null);


  // Clean up audio playback on unmount
  useEffect(() => {
    return () => {
      notebookLMService.stopAudioPlayback();
      if (researchPollTimerRef.current) clearInterval(researchPollTimerRef.current);
    };
  }, []);

  // 3. Deep Research Pro Execution Handler
  const handleLaunchDeepResearch = async (customTopic?: string, customDetails?: string) => {
    const targetDoc = currentDoc;
    const t = customTopic || deepResearchTopic || (targetDoc ? `Nghiên cứu đối sánh văn bản: ${targetDoc.documentNumber} - ${targetDoc.title}` : 'Khảo cứu pháp quy BTI 2026');
    const d = customDetails || deepResearchDetails || (targetDoc ? `Phân tích toàn diện ${targetDoc.documentNumber} (${targetDoc.title}), các điều khoản trọng yếu liên quan đến ${targetDoc.relatedDomains?.join(', ')} và đối chiếu với Thông tư 02/2025/TT-BGDĐT cùng chuẩn năng lực số BTI 2026.` : '');

    vibrateTap();
    soundFx.playClick();
    setIsResearching(true);
    setResearchReport(null);
    setResearchSteps([]);
    setResearchStatusMsg('Đang khởi chạy Agent Deep Research Pro...');

    try {
      const res = await fetch('/api/ai/deep-research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: t,
          prompt: d,
          depth: deepResearchDepth
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khởi chạy Deep Research.');
      }

      setResearchStatusMsg('Agent Deep Research đang thu thập án lệ, văn bản liên tịch và đối sánh...');

      if (researchPollTimerRef.current) clearInterval(researchPollTimerRef.current);
      let attempts = 0;
      researchPollTimerRef.current = setInterval(async () => {
        attempts++;
        try {
          const pollRes = await fetch(`/api/ai/deep-research/status/${data.researchId}`);
          const pollData = await pollRes.json();
          if (pollData.success) {
            if (pollData.steps) setResearchSteps(pollData.steps);
            if (pollData.status === 'completed') {
              clearInterval(researchPollTimerRef.current);
              setResearchReport(pollData.report);
              setIsResearching(false);
              setResearchStatusMsg('Khảo cứu hoàn tất.');
              soundFx.playPacingChime('complete');
              vibrateSuccess();
            } else if (pollData.status === 'failed' || pollData.status === 'cancelled') {
              clearInterval(researchPollTimerRef.current);
              setIsResearching(false);
              setResearchReport(pollData.error || 'Không thể hoàn tất tác vụ nghiên cứu.');
              soundFx.playError();
              vibrateError();
            } else {
              setResearchStatusMsg(`Đang nghiên cứu đa bước giai đoạn ${Math.min(4, Math.floor(attempts / 2) + 1)}/4...`);
            }
          }
        } catch (e) {
          console.warn('Poll error:', e);
        }

        if (attempts > 30) {
          clearInterval(researchPollTimerRef.current);
          if (isResearching) {
            try {
              setResearchStatusMsg('Đang tổng hợp báo cáo trực tiếp...');
              const syncRes = await fetch('/api/ai/deep-research/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: t, prompt: d })
              });
              const syncData = await syncRes.json();
              setResearchReport(syncData.report);
              setResearchSteps(syncData.steps || []);
              soundFx.playPacingChime('complete');
            } finally {
              setIsResearching(false);
            }
          }
        }
      }, 5000);
    } catch (err: any) {
      console.error(err);
      soundFx.playError();
      vibrateError();
      setResearchReport(`❌ Lỗi: ${err?.message || 'Không thể kết nối với Agent Deep Research.'}`);
      setIsResearching(false);
    }
  };

  const handleCopyResearch = () => {
    if (!researchReport) return;
    navigator.clipboard.writeText(researchReport);
    setCopiedResearch(true);
    vibrateSuccess();
    setTimeout(() => setCopiedResearch(false), 2000);
  };

  const handleDownloadResearch = () => {
    if (!researchReport) return;
    const blob = new Blob([researchReport], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BTI2026_Legal_Deep_Research_${currentDoc?.documentNumber || 'Report'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    vibrateSuccess();
  };

  // Source selection toggles
  const toggleSource = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    vibrateTap();
    soundFx.playClick();
    setSelectedSourceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id); // Keep at least 1 source
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
      // Keep only current doc
      setSelectedSourceIds(new Set([selectedDocId || documents[0]?.id]));
    } else {
      setSelectedSourceIds(new Set(documents.map(d => d.id)));
    }
  };

  // Upload Document File with Multimodal AI Recognition & OCR
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    vibrateTap();
    soundFx.playClick();
    setIsUploading(true);
    setUploadStatusText(`Đang xử lý tệp ${file.name}...`);

    try {
      const filenameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const isPlainText = file.type?.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json');
      let textContent = '';
      if (isPlainText) {
        try {
          textContent = await file.text();
        } catch (e) {
          console.warn('Text file read error:', e);
        }
      }

      // Convert to Base64 for Multimodal Gemini analysis
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setUploadStatusText('AI Gemini đang quét OCR, nhận diện số hiệu và bóc tách điều khoản...');

      let parsedDoc: any = null;
      try {
        parsedDoc = await notebookLMService.parseLegalDocument({
          fileBase64,
          mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain'),
          fileName: file.name,
          rawText: isPlainText ? textContent : undefined
        });
      } catch (aiErr) {
        console.warn('AI Document parse failed, fallback to file metadata:', aiErr);
      }

      const newDoc: LegalDocument = {
        id: `DOC_${Date.now()}`,
        title: parsedDoc?.title || filenameWithoutExt,
        documentNumber: parsedDoc?.documentNumber || `VB_${Math.floor(100 + Math.random() * 900)}/${new Date().getFullYear()}`,
        issuingAuthority: parsedDoc?.issuingAuthority || 'Cơ quan có thẩm quyền',
        issuedDate: parsedDoc?.issuedDate || new Date().toISOString().slice(0, 10),
        issueDate: parsedDoc?.issuedDate || new Date().toISOString().slice(0, 10),
        effectiveDate: parsedDoc?.effectiveDate || parsedDoc?.issuedDate || new Date().toISOString().slice(0, 10),
        type: (parsedDoc?.type as any) || (file.name.endsWith('.pdf') ? 'LUAT' : 'QUY_DINH_KHAC'),
        domain: (parsedDoc?.domain as any) || 'MIEN_4',
        summary: parsedDoc?.summary || (textContent ? textContent.slice(0, 300) : 'Văn bản pháp lý cập nhật phục vụ công tác khảo thí BTI 2026.'),
        fullText: parsedDoc?.extractedTextSnippet || textContent || parsedDoc?.summary || file.name,
        relatedDomains: (parsedDoc?.relatedDomains as any) || [parsedDoc?.domain || 'MIEN_4'],
        keyArticles: (parsedDoc?.keyArticles && parsedDoc?.keyArticles.length > 0)
          ? parsedDoc.keyArticles
          : [{ article: 'Trích đoạn 1', content: (parsedDoc?.summary || textContent || 'Nội dung trích xuất từ văn bản').slice(0, 300) }],
        uploadedAt: Date.now(),
        uploadedBy: questionBankManager.getCurrentUser().name
      };

      questionBankManager.addDocument(newDoc);
      const updated = questionBankManager.getDocuments();
      setDocuments(updated);
      setSelectedDocId(newDoc.id);
      setSelectedSourceIds(prev => new Set([...prev, newDoc.id]));
      soundFx.playCorrect();
      vibrateSuccess();
    } catch (err: any) {
      console.error('Upload document error:', err);
      soundFx.playError();
      alert('Không thể đọc file văn bản: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setIsUploading(false);
      setUploadStatusText(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Import from Google Drive with AI Parsing
  const handleDriveDocPicked = async (file: PickedDriveFile) => {
    setIsUploading(true);
    setUploadStatusText(`Đang tải tệp "${file.name}" từ Google Drive...`);
    try {
      let contentText = '';
      try {
        const result = await googlePickerService.downloadFileContent(file.id, file.mimeType);
        contentText = result.text || '';
      } catch (e) {
        console.warn('Could not read full text of Drive file, creating reference entry:', e);
      }

      setUploadStatusText('AI Gemini đang phân tích nội dung văn bản từ Google Drive...');

      let parsedDoc: any = null;
      try {
        parsedDoc = await notebookLMService.parseLegalDocument({
          mimeType: file.mimeType || 'application/pdf',
          fileName: file.name,
          rawText: contentText || undefined
        });
      } catch (aiErr) {
        console.warn('AI Drive parse fallback:', aiErr);
      }

      const filenameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const newDoc: LegalDocument = {
        id: `DRIVE_${file.id}`,
        title: parsedDoc?.title || filenameWithoutExt,
        documentNumber: parsedDoc?.documentNumber || `DRIVE_${file.id.slice(0, 8).toUpperCase()}`,
        issuingAuthority: parsedDoc?.issuingAuthority || 'Tài liệu Google Drive',
        issuedDate: parsedDoc?.issuedDate || new Date().toISOString().slice(0, 10),
        issueDate: parsedDoc?.issuedDate || new Date().toISOString().slice(0, 10),
        effectiveDate: parsedDoc?.effectiveDate || parsedDoc?.issuedDate || new Date().toISOString().slice(0, 10),
        type: (parsedDoc?.type as any) || (file.mimeType.includes('pdf') ? 'LUAT' : 'QUY_DINH_KHAC'),
        domain: (parsedDoc?.domain as any) || 'MIEN_4',
        summary: parsedDoc?.summary || (contentText ? contentText.slice(0, 300) : `Tệp được chọn từ Google Drive: ${file.name}.`),
        fullText: parsedDoc?.extractedTextSnippet || contentText || `Tệp Google Drive: ${file.name}\nLiên kết: ${file.url || ''}`,
        relatedDomains: (parsedDoc?.relatedDomains as any) || [parsedDoc?.domain || 'MIEN_4'],
        keyArticles: (parsedDoc?.keyArticles && parsedDoc?.keyArticles.length > 0)
          ? parsedDoc.keyArticles
          : [
            { article: 'Tệp nguồn Drive', content: file.url ? `Liên kết xem: ${file.url}` : 'Đã kết nối qua Google Picker' }
          ],
        uploadedAt: Date.now(),
        uploadedBy: questionBankManager.getCurrentUser().name
      };

      questionBankManager.addDocument(newDoc);
      const updated = questionBankManager.getDocuments();
      setDocuments(updated);
      setSelectedDocId(newDoc.id);
      setSelectedSourceIds(prev => new Set([...prev, newDoc.id]));
      soundFx.playCorrect();
      vibrateSuccess();
    } catch (err: any) {
      console.error('Error importing document from Google Drive:', err);
      soundFx.playError();
      alert('Không thể nhập tài liệu từ Google Drive: ' + (err.message || 'Lỗi'));
    } finally {
      setIsUploading(false);
      setUploadStatusText(null);
    }
  };

  const handleAddManualDoc = () => {
    if (!newDocForm.title || !newDocForm.documentNumber) {
      alert('Vui lòng nhập đầy đủ tiêu đề và số hiệu văn bản.');
      return;
    }

    vibrateTap();
    soundFx.playCorrect();

    const doc: LegalDocument = {
      id: `DOC_${Date.now()}`,
      title: newDocForm.title!,
      documentNumber: newDocForm.documentNumber!,
      issuingAuthority: newDocForm.issuingAuthority || 'Cơ quan ban hành',
      issuedDate: newDocForm.issueDate || newDocForm.issuedDate || '2025-01-01',
      issueDate: newDocForm.issueDate || newDocForm.issuedDate || '2025-01-01',
      effectiveDate: newDocForm.effectiveDate || '2025-01-01',
      type: newDocForm.type || 'THONG_TU',
      domain: (newDocForm.relatedDomains && newDocForm.relatedDomains[0]) || 'MIEN_4',
      summary: newDocForm.summary || '',
      relatedDomains: newDocForm.relatedDomains || ['MIEN_4'],
      keyArticles: newDocForm.keyArticles || [],
      uploadedAt: Date.now(),
      uploadedBy: questionBankManager.getCurrentUser().name
    };

    questionBankManager.addDocument(doc);
    const updated = questionBankManager.getDocuments();
    setDocuments(updated);
    setSelectedDocId(doc.id);
    setSelectedSourceIds(prev => new Set([...prev, doc.id]));
    setShowAddModal(false);
  };

  const handleDeleteDoc = (id: string) => {
    const docToDelete = documents.find(d => d.id === id);
    const docName = docToDelete ? `"${docToDelete.title}" (${docToDelete.documentNumber})` : 'văn bản này';
    if (!confirm(`Bạn có chắc chắn muốn xóa ${docName} khỏi thư viện pháp lý?`)) return;
    vibrateTap();
    soundFx.playClick();

    questionBankManager.deleteDocument(id);
    const updated = questionBankManager.getDocuments();
    setDocuments(updated);
    setSelectedSourceIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (selectedDocId === id && updated[0]) {
      setSelectedDocId(updated[0].id);
    }
    soundFx.playCorrect();
    vibrateSuccess();
  };



  // Generate Audio Overview Podcast
  const handleGeneratePodcast = async () => {
    if (activeSources.length === 0) {
      alert('Vui lòng chọn ít nhất 1 nguồn tài liệu để tạo Audio Overview.');
      return;
    }

    vibrateTap();
    soundFx.playClick();
    setIsGeneratingPodcast(true);

    try {
      const result = await notebookLMService.generateAudioOverview(activeSources);
      setPodcast(result);
      soundFx.playSuccess();
      vibrateSuccess();
    } catch (err: any) {
      console.error('Audio Overview Error:', err);
      soundFx.playError();
      alert(`Lỗi tạo Audio Overview: ${err.message}`);
    } finally {
      setIsGeneratingPodcast(false);
    }
  };

  // Play / Pause Podcast Audio
  const handleTogglePodcastAudio = () => {
    if (!podcast || podcast.dialogue.length === 0) return;

    vibrateTap();
    soundFx.playClick();

    if (isPlayingPodcast) {
      notebookLMService.stopAudioPlayback();
      setIsPlayingPodcast(false);
    } else {
      setIsPlayingPodcast(true);
      notebookLMService.playPodcastDialogue(
        podcast.dialogue,
        (idx) => {
          setCurrentLineIndex(idx);
        },
        () => {
          setIsPlayingPodcast(false);
          setCurrentLineIndex(-1);
          soundFx.playCorrect();
        },
        (err) => {
          setIsPlayingPodcast(false);
          setCurrentLineIndex(-1);
          console.warn('Audio playback error:', err);
        }
      );
    }
  };

  const handleStopPodcastAudio = () => {
    vibrateTap();
    soundFx.playClick();
    notebookLMService.stopAudioPlayback();
    setIsPlayingPodcast(false);
    setCurrentLineIndex(-1);
  };

  // Generate Study Guide
  const handleGenerateStudyGuide = async () => {
    if (activeSources.length === 0) {
      alert('Vui lòng chọn ít nhất 1 nguồn tài liệu để tạo Cẩm nang.');
      return;
    }

    vibrateTap();
    soundFx.playClick();
    setIsGeneratingStudyGuide(true);

    try {
      const result = await notebookLMService.generateStudyGuide(activeSources);
      setStudyGuide(result);
      soundFx.playSuccess();
      vibrateSuccess();
    } catch (err: any) {
      console.error('Study Guide Error:', err);
      soundFx.playError();
      alert(`Lỗi tổng hợp Cẩm nang: ${err.message}`);
    } finally {
      setIsGeneratingStudyGuide(false);
    }
  };



  // Filtered Docs for Left Column
  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.issuingAuthority.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Top Banner NotebookLM Style */}
      <div className="fluent-box p-4 sm:p-5 relative overflow-hidden bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-black/60 border border-purple-500/30 rounded-[6px] shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-bold mb-2 border border-purple-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>NotebookLM Legal Agent • Nghiên Cứu Pháp Lý Kiểm Chứng</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
              <span>Thư Viện Pháp Lý & NotebookLM AI Agent</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/70 mt-1 max-w-3xl leading-relaxed">
              Trợ lý nghiên cứu pháp lý theo tiêu chuẩn <strong>Google NotebookLM</strong>: Hỏi đáp có trích dẫn điều khoản cụ thể, Cẩm nang nghiên cứu, Podcast Audio Overview 2 chuyên gia và Biên soạn đề thi BTI 2026 bám sát thực tiễn.
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex items-center flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf, .docx, .doc, .txt, .json"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-[4px] text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-purple-950/50 transition cursor-pointer shrink-0"
              title="Upload văn bản pháp lý mới (.pdf, .txt, .docx)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Đang Đọc File...' : 'Thêm Nguồn'}</span>
            </button>

            <GooglePickerTriggerButton
              viewId="PDFS"
              label="Từ Google Drive"
              title="Chọn tài liệu căn cứ từ Google Drive (Google Picker)"
              onFilePicked={handleDriveDocPicked}
              className="py-2 px-3 rounded-[4px] shrink-0 text-xs"
            />

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-[4px] text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1"
              title="Nhập văn bản thủ công"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nhập Tay</span>
            </button>
          </div>
        </div>

        {/* Upload & AI Extraction Status Indicator */}
        {isUploading && (
          <div className="mt-3.5 p-3 rounded-[4px] bg-purple-950/60 border border-purple-500/40 flex items-center justify-between gap-3 text-xs animate-pulse">
            <div className="flex items-center gap-2.5 text-purple-200 font-mono">
              <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
              <span>{uploadStatusText || 'Hệ thống AI đang xử lý và phân tích văn bản pháp lý...'}</span>
            </div>
            <span className="text-[11px] font-mono text-purple-400 bg-black/40 px-2 py-0.5 rounded border border-purple-500/30">
              Multimodal Gemini OCR
            </span>
          </div>
        )}

        {/* Grounded Sources Indicator Bar */}
        <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Nguồn Đang Kích Hoạt Grounding:
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
              {activeSources.length} / {documents.length} Văn bản
            </span>
            <span className="text-white/50 text-[11px] hidden sm:inline">
              (AI chỉ trả lời và kiểm chứng dựa trên các nguồn này)
            </span>
          </div>

          <button
            type="button"
            onClick={toggleAllSources}
            className="text-[11px] text-purple-300 hover:text-white underline cursor-pointer"
          >
            {selectedSourceIds.size === documents.length ? 'Bỏ chọn bớt' : 'Chọn tất cả nguồn'}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Sources Panel & Right NotebookLM Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* =========================================================================
            LEFT COLUMN: NGUỒN TÀI LIỆU NOTEBOOKLM (GROUNDED SOURCES)
            ========================================================================= */}
        <div className="lg:col-span-4 space-y-3">
          {/* Header of Sources */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Nguồn Tài Liệu ({documents.length})</span>
            </h3>
            <span className="text-[10px] font-mono text-white/50">
              Tích chọn để cấp quyền AI
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm số hiệu, tên văn bản..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/15 rounded-[4px] pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:border-purple-400 focus:outline-none"
            />
          </div>

          {/* Sources List */}
          <div className="space-y-2.5 max-h-[660px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredDocs.map(doc => {
              const isSelectedDoc = doc.id === selectedDocId;
              const isSourceActive = selectedSourceIds.has(doc.id);

              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    setSelectedDocId(doc.id);
                  }}
                  className={`p-3 rounded-[6px] border transition-all cursor-pointer space-y-2 relative group ${
                    isSourceActive 
                      ? isSelectedDoc
                        ? 'border-purple-400 bg-purple-950/40 shadow-lg shadow-purple-950/50'
                        : 'border-purple-500/30 bg-purple-950/15 hover:border-purple-400/60'
                      : isSelectedDoc
                        ? 'border-white/30 bg-white/10'
                        : 'border-white/10 bg-white/5 opacity-60 hover:opacity-100'
                  }`}
                >
                  {/* Top Bar: Checkbox for Grounding + Doc Number + Delete Action */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <label 
                        className="flex items-center cursor-pointer shrink-0"
                        title={isSourceActive ? "Đang bật nguồn cho NotebookLM" : "Bật nguồn cho NotebookLM"}
                        onClick={e => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSourceActive}
                          onChange={() => toggleSource(doc.id)}
                          className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 border-white/30 bg-black/40 cursor-pointer"
                        />
                      </label>
                      <span className="text-[11px] font-mono text-purple-300 font-bold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30 truncate">
                        {doc.documentNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono text-white/50">
                        {doc.issuedDate || doc.issueDate}
                      </span>
                      {/* Nút xóa nhanh tài liệu trực tiếp trên thẻ */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDoc(doc.id);
                        }}
                        className="p-1 rounded text-white/40 hover:text-rose-400 hover:bg-rose-950/60 transition cursor-pointer"
                        title={`Xóa văn bản ${doc.documentNumber}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                    {doc.title}
                  </h4>

                  {/* Summary */}
                  <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed">
                    {doc.summary}
                  </p>

                  {/* Bottom Meta */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/50 pt-1.5 border-t border-white/5">
                    <span className="truncate max-w-[140px]">{doc.issuingAuthority}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-400 font-semibold">{doc.keyArticles?.length || 0} điều</span>
                      {isSourceActive && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded border border-emerald-500/30">
                          AI ON
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: NOTEBOOKLM AGENT WORKSPACE (5 MODES)
            ========================================================================= */}
        <div className="lg:col-span-8 space-y-4">
          {/* Navigation Tabs for NotebookLM Modes */}
          <div className="flex items-center justify-between flex-wrap gap-2 p-1.5 bg-black/50 border border-white/10 rounded-[6px]">
            <div className="flex items-center flex-wrap gap-1">
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setActiveMode('AUDIO');
                }}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeMode === 'AUDIO'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Headphones className="w-3.5 h-3.5 text-amber-300" />
                <span>Audio Overview (Podcast)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setActiveMode('STUDY_GUIDE');
                }}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeMode === 'STUDY_GUIDE'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                <span>Cẩm Nang Pháp Lý</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setActiveMode('INSPECTOR');
                }}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeMode === 'INSPECTOR'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Soi Chi Tiết Điều Khoản</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setActiveMode('DEEP_RESEARCH');
                  if (!deepResearchTopic && currentDoc) {
                    setDeepResearchTopic(`Nghiên cứu đối sánh văn bản: ${currentDoc.documentNumber} - ${currentDoc.title}`);
                    setDeepResearchDetails(`Khảo cứu đối sánh ${currentDoc.documentNumber} với Thông tư 02/2025/TT-BGDĐT, chuẩn DigComp 2.2 và đề xuất các tình huống khảo thí trắc nghiệm cho cuộc thi BTI 2026.`);
                  }
                }}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  activeMode === 'DEEP_RESEARCH'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-emerald-300 hover:text-white hover:bg-emerald-950/40'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-emerald-300 animate-spin-slow" />
                <span>Deep Research Pro</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-black/30 text-emerald-200">AI</span>
              </button>
            </div>

            {/* Current Active Sources Count */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-purple-300 px-2 py-1 bg-purple-950/40 rounded border border-purple-500/20">
              <span>{activeSources.length} nguồn</span>
            </div>
          </div>

          {/* =========================================================================
              TAB 1: NOTEBOOKLM AUDIO OVERVIEW (PODCAST 2 CHUYÊN GIA)
              ========================================================================= */}
          {activeMode === 'AUDIO' && (
            <div className="fluent-box p-5 rounded-[6px] border border-white/15 bg-[#190839] space-y-5">
              {/* Header Banner for Audio Overview */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-amber-300 font-mono text-xs font-bold bg-amber-950/50 px-2.5 py-0.5 rounded border border-amber-500/30 mb-1">
                    <Headphones className="w-3.5 h-3.5 text-amber-400" />
                    <span>NotebookLM Audio Overview Deep Dive</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Podcast Đối Thoại 2 Chuyên Gia Pháp Lý & Khảo Thí
                  </h3>
                  <p className="text-xs text-white/60 mt-0.5">
                    Chương trình thảo luận chuyên sâu giữa <strong>Minh Thảo</strong> (Chuyên gia Khảo thí BTI) và <strong>Quốc Hoàng</strong> (Luật sư Công nghệ) phân tích các căn cứ pháp lý theo phong cách NotebookLM.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGeneratePodcast}
                  disabled={isGeneratingPodcast}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-[4px] text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-950/50 shrink-0"
                >
                  {isGeneratingPodcast ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{isGeneratingPodcast ? 'Đang Tạo Kịch Bản...' : 'Tạo Podcast Audio'}</span>
                </button>
              </div>

              {podcast ? (
                <div className="space-y-4">
                  {/* Player Control Bar */}
                  <div className="p-4 bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/30 rounded-[6px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>🎙️ {podcast.episodeTitle}</span>
                        <span className="text-[10px] font-mono text-amber-300 bg-amber-950/40 px-2 py-0.2 rounded border border-amber-500/30">
                          {podcast.durationMinutes || 4} phút
                        </span>
                      </h4>
                      <p className="text-xs text-white/70 italic">
                        {podcast.episodeSubtitle || podcast.summary}
                      </p>
                    </div>

                    {/* Audio Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleTogglePodcastAudio}
                        className={`px-4 py-2 rounded-[4px] text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer shadow-md ${
                          isPlayingPodcast
                            ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                            : 'bg-emerald-600 text-white hover:bg-emerald-500'
                        }`}
                      >
                        {isPlayingPodcast ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                        <span>{isPlayingPodcast ? 'Tạm Dừng' : 'Phát Podcast'}</span>
                      </button>

                      {isPlayingPodcast && (
                        <button
                          type="button"
                          onClick={handleStopPodcastAudio}
                          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-[4px] transition cursor-pointer"
                          title="Dừng phát"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          vibrateTap();
                          const fullScript = podcast.dialogue.map(d => `[${d.speaker} - ${d.role}]:\n${d.text}`).join('\n\n');
                          navigator.clipboard.writeText(fullScript);
                          setCopiedPodcast(true);
                          soundFx.playCorrect();
                          setTimeout(() => setCopiedPodcast(false), 2000);
                        }}
                        className="px-2.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-[4px] text-xs font-mono transition cursor-pointer flex items-center gap-1"
                        title="Sao chép toàn bộ kịch bản"
                      >
                        {copiedPodcast ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{copiedPodcast ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Highlights */}
                  {podcast.keyHighlights && podcast.keyHighlights.length > 0 && (
                    <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded text-xs space-y-1 font-mono">
                      <span className="text-amber-400 font-bold uppercase block text-[10.5px]">
                        Điểm nhấn cốt lõi của tập Podcast:
                      </span>
                      <ul className="list-disc pl-4 space-y-0.5 text-white/80">
                        {podcast.keyHighlights.map((hl, i) => (
                          <li key={i}>{hl}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Dialogue Transcript Display */}
                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1.5 custom-scrollbar">
                    {podcast.dialogue.map((line, idx) => {
                      const isCurrentLine = currentLineIndex === idx;
                      const isMinhThao = line.speaker.includes('Minh Thảo') || line.speaker.includes('Thảo');

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-[6px] border transition-all text-xs space-y-1 ${
                            isCurrentLine
                              ? 'border-amber-400 bg-amber-950/30 shadow-md ring-1 ring-amber-400/50 scale-[1.01]'
                              : isMinhThao
                                ? 'border-purple-500/20 bg-purple-950/20 hover:border-purple-500/40'
                                : 'border-sky-500/20 bg-sky-950/20 hover:border-sky-500/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.2 rounded font-bold border ${
                                isMinhThao
                                  ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                                  : 'bg-sky-950/60 text-sky-300 border-sky-500/40'
                              }`}>
                                {line.speaker}
                              </span>
                              <span className="text-white/40 text-[10px]">({line.role})</span>
                            </div>

                            {isCurrentLine && (
                              <span className="text-amber-300 font-bold text-[10px] flex items-center gap-1 animate-pulse">
                                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                                Đang phát...
                              </span>
                            )}
                          </div>

                          <p className="text-white/90 leading-relaxed font-sans text-xs pt-0.5">
                            {line.text}
                          </p>

                          {line.emphasis && (
                            <span className="inline-block text-[10px] font-mono text-amber-300/80 bg-black/30 px-1.5 py-0.2 rounded">
                              Trọng tâm: {line.emphasis}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-white/50 border border-dashed border-white/15 rounded-[6px] space-y-3">
                  <Headphones className="w-10 h-10 text-purple-400/60 mx-auto" />
                  <p className="text-sm font-semibold text-white/80">Chưa tạo kịch bản Audio Overview</p>
                  <p className="text-xs text-white/50 max-w-md mx-auto">
                    Bấm nút <strong>"Tạo Podcast Audio"</strong> ở trên để AI tạo cuộc đối thoại 2 người sống động, phân tích chuyên sâu các căn cứ pháp lý đã chọn.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 3: NOTEBOOKLM STUDY GUIDE & FAQS
              ========================================================================= */}
          {activeMode === 'STUDY_GUIDE' && (
            <div className="fluent-box p-5 rounded-[6px] border border-white/15 bg-[#190839] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-emerald-300 font-mono text-xs font-bold bg-emerald-950/50 px-2.5 py-0.5 rounded border border-emerald-500/30 mb-1">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>NotebookLM Executive Study Guide</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Cẩm Nang Pháp Lý & Bộ Hỏi Đáp Chuyên Sâu
                  </h3>
                  <p className="text-xs text-white/60 mt-0.5">
                    Tổng hợp cô đọng bản tóm tắt điều hành, chủ thể tác động, các điều khoản trọng tâm và bộ câu hỏi thường gặp (FAQs).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateStudyGuide}
                  disabled={isGeneratingStudyGuide}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-[4px] text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 shrink-0"
                >
                  {isGeneratingStudyGuide ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{isGeneratingStudyGuide ? 'Đang Tổng Hợp...' : 'Tổng Hợp Cẩm Nang'}</span>
                </button>
              </div>

              {studyGuide ? (
                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {/* Executive Summary */}
                  <div className="p-3.5 bg-black/40 rounded-[6px] border border-white/10 space-y-1.5 text-xs">
                    <span className="font-mono text-emerald-400 font-bold uppercase tracking-wider block text-[11px]">
                      1. Bản Tóm Tắt Điều Hành (Executive Summary):
                    </span>
                    <p className="text-white/80 leading-relaxed font-sans">
                      {studyGuide.executiveSummary}
                    </p>
                    {studyGuide.jurisdictionScope && (
                      <div className="text-[11px] font-mono text-white/60 pt-1 border-t border-white/5">
                        <strong>Phạm vi điều chỉnh:</strong> {studyGuide.jurisdictionScope}
                      </div>
                    )}
                  </div>

                  {/* BTI Exam Relevance */}
                  {studyGuide.btiExamRelevance && (
                    <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded text-xs space-y-1 font-mono">
                      <span className="text-purple-300 font-bold uppercase block text-[10.5px]">
                        2. Ý nghĩa và Mối liên kết với Cuộc thi BTI 2026:
                      </span>
                      <p className="text-white/80 leading-relaxed font-sans">
                        {studyGuide.btiExamRelevance}
                      </p>
                    </div>
                  )}

                  {/* Key Entities Matrix */}
                  {studyGuide.keyEntities && studyGuide.keyEntities.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-mono text-sky-400 font-bold uppercase tracking-wider block text-[11px]">
                        3. Ma Trận Chủ Thể Chịu Tác Động & Trách Nhiệm Pháp Lý:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {studyGuide.keyEntities.map((ent, i) => (
                          <div key={i} className="p-3 bg-black/40 border border-white/10 rounded space-y-1 font-mono">
                            <span className="font-bold text-white text-[11px] block">{ent.entity}</span>
                            <div className="text-[10.5px] text-emerald-300">
                              <span className="font-semibold">Quyền:</span> {ent.rights}
                            </div>
                            <div className="text-[10.5px] text-amber-300">
                              <span className="font-semibold">Nghĩa vụ:</span> {ent.obligations}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Critical Articles */}
                  {studyGuide.criticalArticles && studyGuide.criticalArticles.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-mono text-amber-400 font-bold uppercase tracking-wider block text-[11px]">
                        4. Các Điều Khoản Trọng Tâm Hay Gặp Trong Đề Thi BTI:
                      </span>
                      <div className="space-y-1.5">
                        {studyGuide.criticalArticles.map((art, i) => (
                          <div key={i} className="p-2.5 bg-black/40 border border-white/10 rounded text-xs space-y-0.5 font-mono">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-amber-300">[{art.documentNumber}] {art.article}</span>
                            </div>
                            <p className="text-white/80 font-sans text-xs">{art.summary}</p>
                            <div className="text-[10.5px] text-purple-300 pt-0.5">
                              <em>Gợi ý BTI:</em> {art.relevanceToBTI}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FAQs Accordion */}
                  {studyGuide.faqs && studyGuide.faqs.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-mono text-emerald-400 font-bold uppercase tracking-wider block text-[11px]">
                        5. Bộ Hỏi Đáp Thường Gặp (FAQs - {studyGuide.faqs.length} Câu):
                      </span>
                      <div className="space-y-1.5">
                        {studyGuide.faqs.map((faq, i) => {
                          const isOpen = openFaqIndex === i;
                          return (
                            <div key={i} className="border border-white/10 rounded bg-black/30 overflow-hidden text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  vibrateTap();
                                  setOpenFaqIndex(isOpen ? null : i);
                                }}
                                className="w-full p-2.5 text-left font-bold text-white hover:bg-white/5 transition flex items-center justify-between gap-2 cursor-pointer font-sans"
                              >
                                <span>Q{i + 1}: {faq.question}</span>
                                {isOpen ? <ChevronDown className="w-4 h-4 text-emerald-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-white/40 shrink-0" />}
                              </button>

                              {isOpen && (
                                <div className="p-3 bg-white/5 border-t border-white/10 space-y-1 font-sans text-white/80 animate-fadeIn">
                                  <p className="leading-relaxed">{faq.answer}</p>
                                  {faq.legalReference && (
                                    <div className="text-[10.5px] font-mono text-amber-300 pt-1 flex items-center gap-1">
                                      <Scale className="w-3 h-3 text-amber-400" />
                                      <span>Căn cứ: <strong>{faq.legalReference}</strong></span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Compliance Checklist */}
                  {studyGuide.complianceChecklist && studyGuide.complianceChecklist.length > 0 && (
                    <div className="p-3 bg-black/40 border border-white/10 rounded space-y-1.5 text-xs font-mono">
                      <span className="text-emerald-400 font-bold uppercase block text-[11px]">
                        6. Checklist Hành Động Tuân Thủ Cho Người Học & Nhà Trường:
                      </span>
                      <div className="space-y-1">
                        {studyGuide.complianceChecklist.map((item, i) => (
                          <div key={i} className="flex items-start gap-2 text-white/80 font-sans text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center text-white/50 border border-dashed border-white/15 rounded-[6px] space-y-3">
                  <BookOpen className="w-10 h-10 text-emerald-400/60 mx-auto" />
                  <p className="text-sm font-semibold text-white/80">Chưa tổng hợp Cẩm nang pháp lý</p>
                  <p className="text-xs text-white/50 max-w-md mx-auto">
                    Nhấn vào nút <strong>"Tổng Hợp Cẩm Nang"</strong> ở trên để AI tự động trích xuất bản tóm tắt điều hành, bảng ma trận chủ thể và bộ câu hỏi thường gặp FAQs.
                  </p>
                </div>
              )}
            </div>
          )}


          {/* =========================================================================
              TAB 3: DOCUMENT INSPECTOR (CHI TIẾT VĂN BẢN & ĐIỀU KHOẢN)
              ========================================================================= */}
          {activeMode === 'INSPECTOR' && (
            <div className="fluent-box p-5 rounded-[6px] border border-white/15 bg-[#190839] space-y-5">
              {currentDoc ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div>
                      <span className="text-xs font-mono text-amber-400 font-bold bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-500/30">
                        {currentDoc.documentNumber}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-white mt-1.5">
                        {currentDoc.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {onSelectForAI && (
                        <button
                          type="button"
                          onClick={() => {
                            vibrateTap();
                            soundFx.playClick();
                            onSelectForAI(currentDoc);
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-[4px] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-950/40"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Dùng Cho AI Soạn Đề</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(currentDoc.id)}
                        className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-white rounded-[4px] text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title="Xóa văn bản này khỏi thư viện pháp lý"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa Văn Bản</span>
                      </button>
                    </div>
                  </div>

                  {/* Meta Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-2.5 bg-white/5 rounded-[4px] border border-white/10">
                      <span className="text-white/50 block text-[10px]">Cơ quan ban hành:</span>
                      <span className="font-bold text-white text-[11px] truncate block">{currentDoc.issuingAuthority}</span>
                    </div>
                    <div className="p-2.5 bg-white/5 rounded-[4px] border border-white/10">
                      <span className="text-white/50 block text-[10px]">Ngày ban hành:</span>
                      <span className="font-bold text-amber-300 text-[11px]">{currentDoc.issuedDate || currentDoc.issueDate}</span>
                    </div>
                    <div className="p-2.5 bg-white/5 rounded-[4px] border border-white/10">
                      <span className="text-white/50 block text-[10px]">Hiệu lực:</span>
                      <span className="font-bold text-emerald-400 text-[11px]">{currentDoc.effectiveDate || currentDoc.issuedDate}</span>
                    </div>
                    <div className="p-2.5 bg-white/5 rounded-[4px] border border-white/10">
                      <span className="text-white/50 block text-[10px]">Người cập nhật:</span>
                      <span className="font-bold text-sky-400 text-[11px] truncate block">{currentDoc.uploadedBy}</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-3.5 bg-white/5 rounded-[4px] border border-white/10 space-y-1 text-xs">
                    <span className="font-mono text-[11px] text-white/50 uppercase tracking-wider font-bold block">
                      Tóm Tắt & Phạm Vi Điều Chỉnh:
                    </span>
                    <p className="text-white/80 leading-relaxed font-sans">
                      {currentDoc.summary}
                    </p>
                  </div>

                  {/* Key Articles List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-400" />
                        Các Điều Khoản & Căn Cứ Trọng Tâm ({currentDoc.keyArticles?.length || 0})
                      </h4>
                    </div>

                    <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                      {currentDoc.keyArticles?.map((art, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-black/40 rounded-[4px] border border-white/10 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-amber-400 text-xs">
                              {art.article}
                            </span>
                            
                            <div className="flex items-center gap-1.5">
                              {onSelectForAI && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    vibrateTap();
                                    soundFx.playClick();
                                    onSelectForAI(currentDoc);
                                  }}
                                  className="px-2 py-0.5 rounded text-[10.5px] font-mono text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 transition flex items-center gap-1 cursor-pointer"
                                  title="Chuyển sang AI Studio để hỏi về điều khoản này"
                                >
                                  <Sparkles className="w-3 h-3 text-purple-400" />
                                  <span>Dùng AI Studio</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-white/80 leading-relaxed font-sans">
                            {art.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-white/40">
                  Chưa chọn văn bản nào
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 4: AGENT DEEP RESEARCH PRO (KHẢO CỨU ĐỐI SÁNH PHÁP QUY & BTI MATRIX)
              ========================================================================= */}
          {activeMode === 'DEEP_RESEARCH' && (
            <div className="fluent-box p-5 rounded-[6px] border border-emerald-500/30 bg-[#120529] space-y-5">
              {/* Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-emerald-300 font-mono text-xs font-bold bg-emerald-950/50 px-2.5 py-0.5 rounded border border-emerald-500/30 mb-1">
                    <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
                    <span>Agent Deep Research Pro Preview</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Viện Khảo Cứu Pháp Lý &amp; Đối Sánh Chuẩn Năng Lực Số BTI 2026
                  </h3>
                  <p className="text-xs text-slate-300 font-sans mt-0.5">
                    Tự động đối chiếu văn bản pháp lý đang chọn với Thông tư 02/2025/TT-BGDĐT, chuẩn DigComp 2.2 và xây dựng hồ sơ học thuật hoàn chỉnh cho Hội đồng Đề thi.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div className="flex items-center gap-1 p-1 bg-black/40 rounded border border-white/10 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setDeepResearchDepth('fast')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                        deepResearchDepth === 'fast' ? 'bg-emerald-600 text-white' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Nhanh (Preview)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeepResearchDepth('max')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                        deepResearchDepth === 'max' ? 'bg-emerald-600 text-white' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Toàn Diện (Max)
                    </button>
                  </div>
                </div>
              </div>

              {/* Research Controls */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5 space-y-3">
                  <div className="p-3 bg-white/[0.03] border border-white/10 rounded-[4px] space-y-2 text-xs">
                    <span className="font-mono font-bold text-amber-300 text-[11px] block">
                      Văn bản mục tiêu hiện tại:
                    </span>
                    <div className="font-bold text-white text-xs leading-snug">
                      {currentDoc ? `${currentDoc.documentNumber} - ${currentDoc.title}` : 'Chưa chọn văn bản'}
                    </div>
                    {currentDoc?.relatedDomains && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {currentDoc.relatedDomains.map((dm: string) => (
                          <span key={dm} className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200 border border-purple-400/30">
                            {dm}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Research Presets */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase font-bold text-white/50 tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>Mẫu Nghiên Cứu Pháp Quy Nhanh</span>
                    </label>
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const topic = `Đối sánh ${currentDoc?.documentNumber || 'Thông tư 02/2025/TT-BGDĐT'} với Khung năng lực số DigComp 2.2 và UNESCO`;
                          const details = `Khảo cứu chuyên sâu: Phân tích 6 miền năng lực số trong ${currentDoc?.documentNumber || 'Thông tư 02/2025/TT-BGDĐT'}, đối chiếu với Khung năng lực số châu Âu DigComp 2.2 và Khung UNESCO. Đề xuất ma trận câu hỏi khảo thí phù hợp cho cuộc thi BTI 2026.`;
                          setDeepResearchTopic(topic);
                          setDeepResearchDetails(details);
                          handleLaunchDeepResearch(topic, details);
                        }}
                        disabled={isResearching}
                        className="w-full text-left p-2 rounded-[2px] bg-white/[0.03] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/40 transition group cursor-pointer text-xs font-mono"
                      >
                        <div className="font-bold text-white group-hover:text-emerald-300 transition flex items-center justify-between">
                          <span>Đối sánh Chuẩn Châu Âu DigComp 2.2</span>
                          <Zap className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition" />
                        </div>
                        <div className="text-[10px] text-white/50 line-clamp-1 mt-0.5 font-sans">
                          So sánh cấu trúc 6 miền năng lực số với tiêu chuẩn quốc tế
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const topic = `Tra cứu văn bản liên tịch & án lệ an toàn số cho ${currentDoc?.documentNumber || 'Nghị định 13/2023/NĐ-CP'}`;
                          const details = `Tra cứu các văn bản quy phạm pháp luật liên quan đến xử phạt vi phạm an toàn thông tin, quyền riêng tư dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP và Luật An ninh mạng. Đề xuất các tình huống đề thi thực tế.`;
                          setDeepResearchTopic(topic);
                          setDeepResearchDetails(details);
                          handleLaunchDeepResearch(topic, details);
                        }}
                        disabled={isResearching}
                        className="w-full text-left p-2 rounded-[2px] bg-white/[0.03] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/40 transition group cursor-pointer text-xs font-mono"
                      >
                        <div className="font-bold text-white group-hover:text-emerald-300 transition flex items-center justify-between">
                          <span>Án lệ &amp; Tình huống Thực tiễn</span>
                          <Zap className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition" />
                        </div>
                        <div className="text-[10px] text-white/50 line-clamp-1 mt-0.5 font-sans">
                          Tìm kiếm vụ việc vi phạm thực tế để đưa vào câu hỏi Vận Dụng Cao
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-mono uppercase font-bold text-white/60 tracking-wider mb-1 block">
                        Đề tài nghiên cứu:
                      </label>
                      <input
                        type="text"
                        value={deepResearchTopic}
                        onChange={e => setDeepResearchTopic(e.target.value)}
                        placeholder="Nhập đề tài hoặc câu hỏi pháp quy..."
                        disabled={isResearching}
                        className="w-full p-2 rounded-[2px] bg-black/50 border border-white/15 focus:border-emerald-400 text-xs font-mono text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase font-bold text-white/60 tracking-wider mb-1 block">
                        Chi tiết yêu cầu đối sánh:
                      </label>
                      <textarea
                        rows={3}
                        value={deepResearchDetails}
                        onChange={e => setDeepResearchDetails(e.target.value)}
                        placeholder="Yêu cầu cụ thể: Trích dẫn điều khoản, tìm dẫn chứng số liệu, đề xuất ma trận câu hỏi..."
                        disabled={isResearching}
                        className="w-full p-2 rounded-[2px] bg-black/50 border border-white/15 focus:border-emerald-400 text-xs font-mono text-white outline-none resize-none placeholder:text-white/30"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLaunchDeepResearch()}
                      disabled={isResearching}
                      className="w-full py-2.5 px-3 rounded-[2px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      {isResearching ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Đang thực hiện Deep Research...</span>
                        </>
                      ) : (
                        <>
                          <Compass className="w-4 h-4" />
                          <span>Khởi Chạy Deep Research Pháp Lý</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Report Panel */}
                <div className="md:col-span-7 flex flex-col min-h-[420px] bg-black/50 border border-white/10 rounded-[4px] overflow-hidden">
                  <div className="px-3 py-2 bg-white/[0.02] border-b border-white/10 flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-emerald-300 text-[11px] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Hồ Sơ Khảo Cứu Pháp Quy Chi Tiết
                    </span>

                    {researchReport && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleCopyResearch}
                          className="p-1 px-2 rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition flex items-center gap-1 text-[10px] cursor-pointer"
                          title="Sao chép toàn bộ báo cáo"
                        >
                          {copiedResearch ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedResearch ? 'Đã chép' : 'Sao chép'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadResearch}
                          className="p-1 px-2 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1 text-[10px] cursor-pointer"
                          title="Tải báo cáo Markdown (.md)"
                        >
                          <Download className="w-3 h-3" />
                          <span>Tải .MD</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-3.5 overflow-y-auto custom-scrollbar font-sans text-xs leading-relaxed text-white/90">
                    {isResearching && (
                      <div className="h-full flex flex-col items-center justify-center gap-3 text-center text-white/60 py-12">
                        <div className="w-10 h-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                        <div className="space-y-1">
                          <div className="text-emerald-300 font-bold text-sm">Agent Deep Research đang thu thập dẫn chứng</div>
                          <div className="text-[11px] text-white/50">{researchStatusMsg || 'Đang quét văn bản pháp quy và cơ sở học thuật...'}</div>
                        </div>
                      </div>
                    )}

                    {!isResearching && !researchReport && (
                      <div className="h-full flex flex-col items-center justify-center gap-2 text-center text-white/40 py-12">
                        <Compass className="w-8 h-8 text-white/20" />
                        <p className="text-xs">Chọn mẫu nghiên cứu hoặc nhập đề tài pháp lý bên trái để khởi chạy Agent Deep Research Pro.</p>
                      </div>
                    )}

                    {!isResearching && researchReport && (
                      <div className="space-y-3">
                        <div className="p-3 rounded-[2px] bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs font-mono flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>Báo Cáo Khảo Cứu Pháp Lý Chuẩn Hóa</span>
                          </span>
                          <span className="text-[10px] text-white/40">Grounded via Deep Research Pro</span>
                        </div>

                        <div className="whitespace-pre-wrap leading-relaxed select-text p-3 bg-[#05000C] border border-white/10 rounded font-sans text-xs text-white/90 shadow-inner">
                          {researchReport}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
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
                className="text-white/60 hover:text-white"
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
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-mono font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Manual Add Document Modal */}
      {showAddModal && typeof document !== 'undefined' && createPortal(
        <div 
          id="legal-doc-modal-overlay"
          className="fixed inset-0 z-[9999999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 overflow-hidden animate-fadeIn modal-backdrop-isolated select-none"
        >
          <div 
            id="legal-doc-modal-dialog"
            className="bg-[#190839] border border-theme-accent/30 rounded-[8px] max-w-xl w-full p-6 space-y-4 shadow-2xl text-[#F5EFF9] overscroll-contain select-text"
          >
            <div className="flex items-center justify-between border-b border-theme-accent/20 pb-3">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                Thêm Văn Bản Pháp Lý Mới
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-[4px] text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#B6A6D8] mb-1 font-mono font-semibold">Tiêu đề văn bản:</label>
                <input
                  type="text"
                  placeholder="Vd: Nghị định quy định về..."
                  value={newDocForm.title}
                  onChange={e => setNewDocForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#B6A6D8] mb-1 font-mono font-semibold">Số hiệu văn bản:</label>
                  <input
                    type="text"
                    placeholder="Vd: 02/2025/TT-BGDĐT"
                    value={newDocForm.documentNumber}
                    onChange={e => setNewDocForm(p => ({ ...p, documentNumber: e.target.value }))}
                    className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#B6A6D8] mb-1 font-mono font-semibold">Cơ quan ban hành:</label>
                  <input
                    type="text"
                    placeholder="Vd: Bộ Giáo dục và Đào tạo"
                    value={newDocForm.issuingAuthority}
                    onChange={e => setNewDocForm(p => ({ ...p, issuingAuthority: e.target.value }))}
                    className="w-full bg-black/60 border border-white/15 rounded-[4px] px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#B6A6D8] mb-1 font-mono font-semibold">Tóm tắt nội dung chính:</label>
                <textarea
                  rows={3}
                  placeholder="Quy định về khung năng lực số hoặc bảo vệ dữ liệu..."
                  value={newDocForm.summary}
                  onChange={e => setNewDocForm(p => ({ ...p, summary: e.target.value }))}
                  className="w-full bg-black/60 border border-white/15 rounded-[4px] p-2.5 text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-theme-accent/20">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-[4px] text-xs font-mono transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddManualDoc}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-[4px] text-xs font-bold font-mono"
              >
                Lưu Văn Bản
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
