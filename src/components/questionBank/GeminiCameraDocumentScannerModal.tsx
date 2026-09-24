import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera,
  Upload,
  FileText,
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Sliders,
  Play,
  RotateCcw,
  Zap,
  Check,
  ChevronRight,
  Search,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Copy,
  Info,
  Edit3
} from 'lucide-react';
import {
  QuestionItem,
  CompetitionStage,
  CognitiveLevel,
  DigitalCompetencyDomainKey,
  QuestionRoundFormat,
  RoundType
} from '../../types';
import { DIGITAL_COMPETENCY_DOMAINS, COMPETITION_STAGES } from '../../data/digitalCompetencyData';
import { questionBankManager } from '../../services/questionBankManager';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface GeminiCameraDocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (count: number) => void;
}

type ScanSourceMode = 'CAMERA' | 'IMAGE_FILE' | 'TEXT_DOCUMENT';

interface ExtractedRawQuestion {
  questionText: string;
  roundType?: string;
  options?: Record<string, string>;
  tfItems?: Array<{ key: string; text: string; isCorrect: boolean }>;
  vcnvData?: {
    obstacleKeyword?: string;
    clue1?: string;
    ans1?: string;
    clue2?: string;
    ans2?: string;
    clue3?: string;
    ans3?: string;
    clue4?: string;
    ans4?: string;
    riskQuestion?: string;
    riskAnswer?: string;
  };
  correctKey: string;
  explanation: string;
  legalReference?: string;
  domain?: string;
  subCompetency?: string;
  cognitiveLevel?: string;
  timeLimit?: number;
  points?: number;
  tags?: string[];
  detectedRawText?: string;
  selected?: boolean;
}

export const GeminiCameraDocumentScannerModal: React.FC<GeminiCameraDocumentScannerModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  useLockBodyScroll(isOpen);

  // Source tab: CAMERA, IMAGE_FILE, TEXT_DOCUMENT
  const [sourceMode, setSourceMode] = useState<ScanSourceMode>('CAMERA');

  // Configuration state
  const [selectedStage, setSelectedStage] = useState<CompetitionStage>('BAN_KET_1');
  const [selectedRoundGroup, setSelectedRoundGroup] = useState<string>('KHOI_DONG');
  const [defaultDomain, setDefaultDomain] = useState<DigitalCompetencyDomainKey>('MIEN_4');

  // Camera stream & snapshot states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  // Captured / Uploaded Image State
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');

  // Text & Document file state
  const [textContent, setTextContent] = useState<string>('');
  const [textFileName, setTextFileName] = useState<string>('');

  // Processing & Review States
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStepMessage, setScanStepMessage] = useState<string>('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedRawQuestion[]>([]);
  const [scanNotes, setScanNotes] = useState<string>('');
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);

  // Start Camera Stream
  const startCamera = async (deviceId?: string) => {
    try {
      setCameraError(null);
      stopCamera();

      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } } 
          : { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Enumerate available video input devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setCameraDevices(videoInputs);
      if (!selectedCameraId && videoInputs.length > 0) {
        setSelectedCameraId(videoInputs[0].deviceId);
      }
    } catch (err: any) {
      console.warn("Camera init error:", err);
      setCameraError(
        err?.name === 'NotAllowedError'
          ? 'Quyền truy cập Camera bị từ chối. Vui lòng cấp quyền trong trình duyệt hoặc sử dụng tính năng Tải ảnh lên.'
          : 'Không tìm thấy hoặc không thể khởi động Camera trên thiết bị này.'
      );
      setIsCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Switch camera when device changed
  useEffect(() => {
    if (isOpen && sourceMode === 'CAMERA' && !capturedImageBase64 && !isReviewMode) {
      startCamera(selectedCameraId || undefined);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, sourceMode, selectedCameraId, capturedImageBase64, isReviewMode]);

  // Handle Capture Photo from Live Camera
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    vibrateTap();
    soundFx.playClick();

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImageBase64(dataUrl);
    setImageFileName(`Chụp_Camera_${new Date().toLocaleTimeString('vi-VN').replace(/:/g, '-')}.jpg`);
    stopCamera();
  };

  // Retake Photo
  const handleRetake = () => {
    vibrateTap();
    soundFx.playClick();
    setCapturedImageBase64(null);
    setImageFileName('');
    if (sourceMode === 'CAMERA') {
      startCamera(selectedCameraId || undefined);
    }
  };

  // Handle File Upload for Images
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    vibrateTap();
    soundFx.playClick();
    setImageFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCapturedImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  // Handle Clipboard Paste for Images
  useEffect(() => {
    if (!isOpen || isReviewMode) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            vibrateTap();
            soundFx.playClick();
            const reader = new FileReader();
            reader.onload = () => {
              setCapturedImageBase64(reader.result as string);
              setImageFileName(`Anh_Dan_Clipboard_${new Date().toLocaleTimeString('vi-VN').replace(/:/g, '-')}.png`);
              setSourceMode('IMAGE_FILE');
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, isReviewMode]);

  // Handle Text/Document File Upload
  const handleTextFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    vibrateTap();
    soundFx.playClick();
    setTextFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      setTextContent(content);
    };
    reader.readAsText(file);
  };

  // Send to Gemini API for Scanning and Extraction
  const handleScanWithGemini = async () => {
    try {
      setScanError(null);
      setIsScanning(true);
      vibrateTap();
      soundFx.playClick();

      setScanStepMessage('Đang truyền dữ liệu hình ảnh/văn bản đến máy chủ...');

      let imagePayload: { mimeType: string; base64: string } | null = null;
      if (capturedImageBase64) {
        let mime = 'image/jpeg';
        let cleanBase64 = capturedImageBase64;
        if (capturedImageBase64.includes(',')) {
          const parts = capturedImageBase64.split(',');
          const match = parts[0].match(/:(.*?);/);
          if (match) mime = match[1];
          cleanBase64 = parts[1];
        }
        imagePayload = { mimeType: mime, base64: cleanBase64 };
      }

      setScanStepMessage('Gemini 3.8 Flash đang phân tích văn bản & nhận diện cấu trúc câu hỏi...');

      const response = await fetch('/api/ai/scan-and-extract-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imagePayload,
          text: textContent,
          stage: selectedStage,
          roundGroup: selectedRoundGroup,
          defaultDomain
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Máy chủ phản hồi lỗi ${response.status}`);
      }

      setScanStepMessage('Đang xử lý kết quả và đối chiếu ma trận BTI 2026...');

      const data = await response.json();
      const list: ExtractedRawQuestion[] = (data.extractedQuestions || []).map((q: any) => ({
        ...q,
        selected: true
      }));

      if (list.length === 0) {
        throw new Error('Gemini không tìm thấy câu hỏi nào trong hình ảnh hoặc văn bản được cung cấp. Vui lòng kiểm tra lại độ rõ nét của ảnh hoặc nội dung văn bản.');
      }

      setExtractedQuestions(list);
      setScanNotes(data.scanSummary?.notes || '');
      setIsReviewMode(true);
      vibrateSuccess();
      soundFx.playSuccess();
    } catch (err: any) {
      console.error('Scan Error:', err);
      setScanError(err.message || 'Đã có lỗi xảy ra trong quá trình quét tài liệu.');
      soundFx.playWarning();
    } finally {
      setIsScanning(false);
      setScanStepMessage('');
    }
  };

  // Toggle selection of a question in review list
  const handleToggleQuestionSelection = (index: number) => {
    vibrateTap();
    setExtractedQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  };

  // Toggle select all
  const handleToggleSelectAll = () => {
    vibrateTap();
    const allSelected = extractedQuestions.every(q => q.selected);
    setExtractedQuestions(prev => prev.map(q => ({ ...q, selected: !allSelected })));
  };

  // Import selected questions into the question bank
  const handleBatchImportQuestions = () => {
    const selectedList = extractedQuestions.filter(q => q.selected);
    if (selectedList.length === 0) {
      alert('Vui lòng chọn ít nhất 1 câu hỏi để nhập.');
      return;
    }

    vibrateTap();
    soundFx.playClick();

    const currentUser = questionBankManager.getCurrentUser();
    let importedCount = 0;

    selectedList.forEach(raw => {
      const roundType: RoundType = 
        raw.roundType === 'TRUE_FALSE_4' ? 'TRUE_FALSE_4' :
        raw.roundType === 'SHORT_ANSWER' ? 'SHORT_ANSWER' :
        raw.roundType === 'VCNV' ? 'VCNV' : 'MULTIPLE_CHOICE';

      // Map domain key
      let domainKey: DigitalCompetencyDomainKey = defaultDomain;
      if (raw.domain && raw.domain.startsWith('MIEN_')) {
        domainKey = raw.domain as DigitalCompetencyDomainKey;
      }

      // Format options
      let formattedOptions: Record<string, string> = {};
      if (roundType === 'MULTIPLE_CHOICE') {
        formattedOptions = {
          A: raw.options?.A || 'Phương án A',
          B: raw.options?.B || 'Phương án B',
          C: raw.options?.C || 'Phương án C',
          D: raw.options?.D || 'Phương án D'
        };
      } else if (roundType === 'TRUE_FALSE_4' && raw.tfItems) {
        raw.tfItems.forEach(item => {
          formattedOptions[item.key] = item.text;
        });
      } else if (roundType === 'VCNV' && raw.vcnvData) {
        formattedOptions = {
          obstacleKeyword: raw.vcnvData.obstacleKeyword || raw.correctKey || '',
          clue1: raw.vcnvData.clue1 || '',
          ans1: raw.vcnvData.ans1 || '',
          clue2: raw.vcnvData.clue2 || '',
          ans2: raw.vcnvData.ans2 || '',
          clue3: raw.vcnvData.clue3 || '',
          ans3: raw.vcnvData.ans3 || '',
          clue4: raw.vcnvData.clue4 || '',
          ans4: raw.vcnvData.ans4 || '',
          riskQuestion: raw.vcnvData.riskQuestion || '',
          riskAnswer: raw.vcnvData.riskAnswer || ''
        };
      }

      const roundFormat: QuestionRoundFormat = 
        selectedRoundGroup === 'KHOI_DONG' ? 'KD_TRAC_NGHIEM_ABCD' :
        selectedRoundGroup === 'VCNV' ? 'VCNV_HANG_NGANG' :
        selectedRoundGroup === 'TANG_TOC' ? 'TANG_TOC' :
        selectedRoundGroup === 'VONG_LOAI' ? 'BGD_MULTIPLE_CHOICE' :
        roundType === 'TRUE_FALSE_4' ? 'VD_TRUE_FALSE_4' : 'VD_SHORT_ANSWER';

      const newQuestion: QuestionItem = {
        id: `Q_GEMINI_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        question_text: raw.questionText,
        options: formattedOptions,
        correct_key: raw.correctKey,
        explanation: raw.explanation || 'Không có lời giải thích.',
        category: `Miền ${domainKey.replace('MIEN_', '')}`,
        round_name: selectedRoundGroup === 'KHOI_DONG' ? '1. Khởi Động' :
                    selectedRoundGroup === 'VCNV' ? '2. Vượt Chướng Ngại Vật' :
                    selectedRoundGroup === 'TANG_TOC' ? '3. Tăng Tốc' : '4. Về Đích',
        round_type: roundType,
        round_format: roundFormat,
        cognitive_level: (raw.cognitiveLevel as CognitiveLevel) || 'THONG_HIEU',
        digital_competency_domain: domainKey,
        digital_sub_competency: raw.subCompetency || `${domainKey.replace('MIEN_', '')}.1`,
        legal_reference: raw.legalReference || 'Thông tư 02/2025/TT-BGDĐT',
        stage: selectedStage,
        round_group: selectedRoundGroup,
        time_limit: raw.timeLimit || 20,
        points: raw.points || 20,
        tags: raw.tags && raw.tags.length > 0 ? raw.tags : ['gemini_ocr_scan', 'bti_2026'],
        approval_status: 'PENDING_REVIEW',
        created_by: currentUser?.name || 'Chuyên gia AI',
        created_at: Date.now()
      };

      questionBankManager.addQuestion(newQuestion);
      importedCount++;
    });

    vibrateSuccess();
    soundFx.playSuccess();

    if (onImportSuccess) {
      onImportSuccess(importedCount);
    }
    onClose();
  };

  // Reset to scan another document
  const handleResetScan = () => {
    vibrateTap();
    soundFx.playClick();
    setIsReviewMode(false);
    setExtractedQuestions([]);
    setCapturedImageBase64(null);
    setImageFileName('');
    setTextContent('');
    setTextFileName('');
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#190839] border border-amber-400/40 rounded-[6px] w-full max-w-5xl h-[90vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:px-6 border-b border-purple-500/30 flex items-center justify-between bg-[#120424]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[4px] bg-gradient-to-br from-amber-400 via-purple-600 to-indigo-600 text-slate-950 font-bold shadow-lg border border-amber-300/40">
              <Camera className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black font-mono text-white tracking-tight uppercase">
                  Quét Đề Thi Thông Minh Bằng Gemini AI
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  Gemini 3.8 Flash OCR
                </span>
              </div>
              <p className="text-xs text-[#B6A6D8] font-mono">
                Tự động quét ảnh chụp Camera, tải ảnh đề thi hoặc file văn bản để số hóa câu hỏi vào Ngân hàng BTI 2026.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN BODY: SPLIT INTO INPUT STAGE OR REVIEW STAGE */}
        {!isReviewMode ? (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            
            {/* LEFT SIDE: SCAN SOURCE (CAMERA / IMAGE / TEXT) */}
            <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-y-auto space-y-4 border-b lg:border-b-0 lg:border-r border-purple-500/30">
              
              {/* SOURCE TABS SELECTOR */}
              <div className="grid grid-cols-3 gap-2 bg-[#120424] p-1.5 rounded-[4px] border border-purple-500/30 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    setSourceMode('CAMERA');
                  }}
                  className={`py-2 px-3 rounded font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    sourceMode === 'CAMERA'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>1. Chụp Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    setSourceMode('IMAGE_FILE');
                  }}
                  className={`py-2 px-3 rounded font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    sourceMode === 'IMAGE_FILE'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>2. Tải / Dán Ảnh</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    setSourceMode('TEXT_DOCUMENT');
                  }}
                  className={`py-2 px-3 rounded font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    sourceMode === 'TEXT_DOCUMENT'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>3. File Văn Bản</span>
                </button>
              </div>

              {/* 1. CAMERA STREAM & SNAPSHOT VIEW */}
              {sourceMode === 'CAMERA' && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                  {!capturedImageBase64 ? (
                    <div className="w-full flex-1 min-h-[300px] relative rounded-[4px] overflow-hidden bg-black border border-purple-500/40 flex items-center justify-center shadow-inner">
                      {isCameraActive ? (
                        <>
                          <video
                            ref={videoRef}
                            playsInline
                            autoPlay
                            muted
                            className="w-full h-full object-cover"
                          />
                          {/* Camera Target Frame Overlay */}
                          <div className="absolute inset-8 border-2 border-dashed border-amber-400/60 rounded pointer-events-none flex flex-col justify-between p-3">
                            <div className="flex justify-between">
                              <div className="w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                              <div className="w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                            </div>
                            <div className="text-center">
                              <span className="px-3 py-1 rounded bg-black/60 text-[11px] font-mono text-amber-300 backdrop-blur-sm">
                                Căn chỉnh trang đề thi vào khung và giữ yên máy
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <div className="w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                              <div className="w-4 h-4 border-b-2 border-r-2 border-amber-400" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-6 text-center space-y-3 text-slate-300">
                          {cameraError ? (
                            <>
                              <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
                              <p className="text-xs text-rose-300 font-mono">{cameraError}</p>
                              <button
                                type="button"
                                onClick={() => startCamera(selectedCameraId || undefined)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-mono font-bold cursor-pointer"
                              >
                                Thử lại
                              </button>
                            </>
                          ) : (
                            <>
                              <Camera className="w-10 h-10 text-amber-400/60 mx-auto animate-pulse" />
                              <p className="text-xs font-mono">Đang kết nối Camera...</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Captured Photo Review */
                    <div className="w-full flex-1 min-h-[300px] relative rounded-[4px] overflow-hidden bg-black border-2 border-emerald-500/50 flex items-center justify-center">
                      <img
                        src={capturedImageBase64}
                        alt="Ảnh chụp từ camera"
                        className="max-h-[320px] w-auto object-contain rounded"
                      />
                      <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-black/70 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Ảnh chụp thành công</span>
                      </div>
                    </div>
                  )}

                  {/* Camera Controls Bar */}
                  <div className="w-full flex items-center justify-between gap-3 font-mono text-xs">
                    {/* Device Selector */}
                    {cameraDevices.length > 1 && !capturedImageBase64 && (
                      <select
                        value={selectedCameraId}
                        onChange={(e) => {
                          setSelectedCameraId(e.target.value);
                          startCamera(e.target.value);
                        }}
                        className="bg-[#120424] text-slate-300 border border-purple-500/40 rounded px-2.5 py-1.5 text-xs focus:outline-none"
                      >
                        {cameraDevices.map((dev, idx) => (
                          <option key={dev.deviceId} value={dev.deviceId}>
                            {dev.label || `Camera ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    )}

                    {!capturedImageBase64 ? (
                      <button
                        type="button"
                        onClick={handleCaptureSnapshot}
                        disabled={!isCameraActive}
                        className="ml-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded text-xs flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Bấm Chụp Ảnh Ngay</span>
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={handleRetake}
                          className="px-3.5 py-2 bg-[#241148] hover:bg-[#341866] text-amber-300 border border-amber-400/30 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Chụp lại</span>
                        </button>
                        <span className="text-[11px] text-slate-400 font-mono truncate">{imageFileName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. IMAGE FILE UPLOAD / DRAG & DROP / CLIPBOARD PASTE */}
              {sourceMode === 'IMAGE_FILE' && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                  {!capturedImageBase64 ? (
                    <label className="w-full flex-1 min-h-[260px] border-2 border-dashed border-purple-500/40 hover:border-amber-400/80 rounded-[4px] p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-[#120424]/60 hover:bg-[#120424]">
                      <input
                        type="file"
                        accept="image/*,.heic,.webp"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                      <div className="p-4 rounded-full bg-purple-600/20 border border-purple-400/30 text-amber-300 mb-3">
                        <Upload className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-bold text-white font-mono">
                        Chọn file ảnh hoặc Kéo &amp; Thả vào đây
                      </p>
                      <p className="text-xs text-[#B6A6D8] mt-1 font-mono">
                        Hỗ trợ PNG, JPG, JPEG, WEBP.
                      </p>
                      <div className="mt-3 px-3 py-1.5 rounded bg-black/40 border border-purple-500/20 text-[11px] font-mono text-amber-300">
                        💡 Bạn có thể chụp màn hình rồi bấm <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-bold">Ctrl + V</kbd> để dán ảnh trực tiếp!
                      </div>
                    </label>
                  ) : (
                    <div className="w-full flex-1 min-h-[260px] relative rounded-[4px] overflow-hidden bg-black border-2 border-emerald-500/50 flex items-center justify-center">
                      <img
                        src={capturedImageBase64}
                        alt="Ảnh tải lên"
                        className="max-h-[300px] w-auto object-contain rounded"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRetake}
                          className="px-2.5 py-1 rounded bg-black/80 hover:bg-rose-900/80 text-rose-300 text-xs font-mono font-bold border border-rose-500/40 transition cursor-pointer"
                        >
                          Xóa &amp; Chọn ảnh khác
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. TEXT & DOCUMENT INGESTION */}
              {sourceMode === 'TEXT_DOCUMENT' && (
                <div className="flex-1 flex flex-col space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300 font-bold">Nội dung văn bản / đề thi sao chép:</span>
                    <label className="text-amber-300 hover:text-amber-200 cursor-pointer flex items-center gap-1 font-bold">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Tải file .txt / .md</span>
                      <input
                        type="file"
                        accept=".txt,.md,.json,.csv"
                        onChange={handleTextFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Dán nội dung đề thi, câu hỏi trắc nghiệm hoặc bài tập từ Word, PDF, Zalo tại đây...
Ví dụ:
Câu 1: Theo Nghị định 13/2023/NĐ-CP, việc xử lý dữ liệu cá nhân của trẻ em phải:
A. Luôn cần sự đồng ý của cha mẹ
B. Không cần sự đồng ý
C. Chỉ cần trẻ em trên 7 tuổi đồng ý
D. Tự do khai thác trên mạng xã hội
Đáp án: A
Giải thích: Căn cứ Điều 20 Nghị định 13/2023/NĐ-CP..."
                    rows={12}
                    className="w-full flex-1 p-3 bg-[#120424] text-slate-100 border border-purple-500/30 rounded-[4px] text-xs font-mono focus:outline-none focus:border-amber-400 transition leading-relaxed resize-none"
                  />

                  {/* Sample Template Button */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{textContent.length} ký tự</span>
                    <button
                      type="button"
                      onClick={() => {
                        vibrateTap();
                        setTextContent(`Câu 1 (Khởi động): Hành vi nào sau đây bị nghiêm cấm theo Luật An ninh mạng 2018?
A. Sử dụng không gian mạng để tuyên truyền chống phá Nhà nước
B. Nghiên cứu tài liệu khoa học mở
C. Đăng ký tài khoản mạng xã hội chính danh
D. Sử dụng chứng thư số hợp pháp
Đáp án: A
Giải thích: Điều 8 Luật An ninh mạng 2018 quy định các hành vi bị nghiêm cấm về an ninh mạng.

Câu 2 (Đúng/Sai BTI): Khi tham gia hoạt động trên không gian mạng, người học có trách nhiệm:
a) Tự bảo vệ thông tin cá nhân và mật khẩu tài khoản
b) Chia sẻ ngay các tin tức giật gân chưa kiểm chứng
c) Tôn trọng bản quyền tác giả khi sử dụng hình ảnh số
d) Cài đặt phần mềm từ các nguồn lạ không rõ xuất xứ
Đáp án: a:Đ, b:S, c:Đ, d:S
Giải thích: Căn cứ Khung năng lực số người học Thông tư 02/2025/TT-BGDĐT Miền 4 (An toàn số).`);
                      }}
                      className="text-amber-300 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Chèn đề thi mẫu thử nghiệm</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT SIDE: CONFIGURATION & SCAN TRIGGER */}
            <div className="w-full lg:w-80 p-4 sm:p-5 bg-[#120424] flex flex-col justify-between space-y-4 font-mono text-xs">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-purple-500/30 pb-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-amber-300 uppercase">Cấu hình BTI đích</span>
                </div>

                {/* Target Competition Stage */}
                <div className="space-y-1">
                  <label className="text-slate-300 text-[11px] block">Giai đoạn thi:</label>
                  <select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value as CompetitionStage)}
                    className="w-full bg-[#1C093B] text-slate-100 border border-purple-500/40 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
                  >
                    {Object.entries(COMPETITION_STAGES).map(([id, s]) => (
                      <option key={id} value={id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Target Round Group */}
                <div className="space-y-1">
                  <label className="text-slate-300 text-[11px] block">Phần thi / Vòng thi:</label>
                  <select
                    value={selectedRoundGroup}
                    onChange={(e) => setSelectedRoundGroup(e.target.value)}
                    className="w-full bg-[#1C093B] text-slate-100 border border-purple-500/40 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
                  >
                    <option value="KHOI_DONG">1. Khởi Động (Trắc nghiệm nhanh)</option>
                    <option value="VCNV">2. Vượt Chướng Ngại Vật (VCNV)</option>
                    <option value="TANG_TOC">3. Tăng Tốc (Tốc độ &amp; Nhận thức)</option>
                    <option value="VE_DICH">4. Về Đích (Tình huống sâu)</option>
                    <option value="VONG_LOAI">Vòng Loại Bộ GD&ĐT (28 câu)</option>
                  </select>
                </div>

                {/* Default Competency Domain */}
                <div className="space-y-1">
                  <label className="text-slate-300 text-[11px] block">Miền năng lực dự phòng:</label>
                  <select
                    value={defaultDomain}
                    onChange={(e) => setDefaultDomain(e.target.value as DigitalCompetencyDomainKey)}
                    className="w-full bg-[#1C093B] text-slate-100 border border-purple-500/40 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
                  >
                    <option value="MIEN_1">Miền I: Dữ liệu &amp; Thông tin</option>
                    <option value="MIEN_2">Miền II: Giao tiếp &amp; Hợp tác số</option>
                    <option value="MIEN_3">Miền III: Sáng tạo nội dung số</option>
                    <option value="MIEN_4">Miền IV: An toàn &amp; An ninh số</option>
                    <option value="MIEN_5">Miền V: Giải quyết vấn đề</option>
                    <option value="MIEN_6">Miền VI: Ứng dụng Trí tuệ nhân tạo (AI)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 italic">
                    * Gemini sẽ tự động nhận diện Miền chính xác từ nội dung câu hỏi; mục này dùng làm fallback.
                  </p>
                </div>

                {/* AI Features Checklist */}
                <div className="p-3 rounded bg-black/40 border border-purple-500/20 space-y-1.5 text-[11px]">
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Năng lực Gemini 3.8 Flash:</span>
                  </span>
                  <div className="space-y-1 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Nhận diện chữ viết tay &amp; in ấn</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Phát hiện đáp án khoanh tròn / tích</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Tự động giải đáp &amp; trích dẫn luật</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Ánh xạ chuẩn Thông tư 02/2025</span>
                    </div>
                  </div>
                </div>

                {/* Error Banner if any */}
                {scanError && (
                  <div className="p-2.5 rounded bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{scanError}</span>
                  </div>
                )}
              </div>

              {/* ACTION BUTTON: TRIGGER GEMINI SCAN */}
              <div className="space-y-2 pt-3 border-t border-purple-500/30">
                <button
                  type="button"
                  onClick={handleScanWithGemini}
                  disabled={isScanning || (!capturedImageBase64 && !textContent.trim())}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:via-purple-500 hover:to-indigo-500 text-slate-950 font-black rounded-[4px] text-xs font-mono uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 transition transform active:scale-95"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Đang quét tài liệu...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Bắt Đầu Quét Bằng Gemini</span>
                    </>
                  )}
                </button>

                {isScanning && (
                  <p className="text-[11px] text-amber-300 text-center animate-pulse">
                    {scanStepMessage || 'Vui lòng đợi giây lát...'}
                  </p>
                )}
              </div>

            </div>

          </div>
        ) : (
          /* REVIEW & IMPORT STAGE (When questions are extracted) */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Top Bar of Review Stage */}
            <div className="p-3.5 sm:px-6 bg-[#120424] border-b border-purple-500/30 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <span className="font-bold text-white text-sm">
                  Đã bóc tách thành công {extractedQuestions.length} câu hỏi
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px]">
                  Đang chọn: {extractedQuestions.filter(q => q.selected).length}/{extractedQuestions.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="px-2.5 py-1 bg-black/40 hover:bg-white/10 text-slate-300 rounded border border-white/10 text-xs transition cursor-pointer"
                >
                  {extractedQuestions.every(q => q.selected) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>

                <button
                  type="button"
                  onClick={handleResetScan}
                  className="px-2.5 py-1 bg-[#241148] hover:bg-[#341866] text-amber-300 rounded border border-amber-400/30 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Quét tiếp trang khác</span>
                </button>
              </div>
            </div>

            {/* Extracted Questions List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {scanNotes && (
                <div className="p-3 rounded bg-amber-500/10 border border-amber-400/30 text-amber-200 text-xs font-mono flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Ghi chú quét từ Gemini: {scanNotes}</span>
                </div>
              )}

              {extractedQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-[4px] border transition space-y-3 ${
                    q.selected
                      ? 'bg-[#1C093B] border-amber-400/60 shadow-lg'
                      : 'bg-[#100421]/60 border-white/10 opacity-60'
                  }`}
                >
                  {/* Card Header: Checkbox, Index, Badges */}
                  <div className="flex items-start justify-between gap-3 border-b border-purple-500/20 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={q.selected || false}
                        onChange={() => handleToggleQuestionSelection(idx)}
                        className="w-4 h-4 rounded text-amber-500 cursor-pointer accent-amber-500"
                      />
                      <span className="font-mono font-black text-amber-300 text-sm">
                        Câu {idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-purple-900/50 text-purple-200 border border-purple-400/30">
                        {q.roundType || 'MULTIPLE_CHOICE'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px] flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                        {q.domain || defaultDomain} ({q.subCompetency || '4.1'})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        {q.cognitiveLevel || 'THONG_HIEU'}
                      </span>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="text-sm font-semibold text-white leading-relaxed">
                    {q.questionText}
                  </div>

                  {/* Options Preview for Multiple Choice */}
                  {q.options && Object.keys(q.options).length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      {Object.entries(q.options).map(([k, v]) => {
                        const isCorrect = q.correctKey === k || q.correctKey?.includes(k);
                        return (
                          <div
                            key={k}
                            className={`p-2 rounded border flex items-start gap-2 ${
                              isCorrect
                                ? 'bg-emerald-950/50 border-emerald-400 text-emerald-200 font-bold'
                                : 'bg-black/30 border-white/10 text-slate-300'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${
                              isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-slate-300'
                            }`}>
                              {k}
                            </span>
                            <span className="flex-1">{v}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* True / False Items Preview */}
                  {q.tfItems && q.tfItems.length > 0 && (
                    <div className="space-y-1.5 text-xs font-mono">
                      {q.tfItems.map((item) => (
                        <div key={item.key} className="p-2 rounded bg-black/30 border border-white/10 flex items-center justify-between">
                          <span><strong>{item.key})</strong> {item.text}</span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                            item.isCorrect ? 'bg-emerald-500/30 text-emerald-300' : 'bg-rose-500/30 text-rose-300'
                          }`}>
                            {item.isCorrect ? 'ĐÚNG' : 'SAI'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Explanation & Legal Reference */}
                  <div className="pt-2 border-t border-purple-500/20 text-xs font-mono text-slate-300 space-y-1">
                    <p><strong className="text-amber-300">Lời giải:</strong> {q.explanation}</p>
                    {q.legalReference && (
                      <p className="text-[11px] text-amber-200/80">
                        <strong>Căn cứ:</strong> {q.legalReference}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Action Footer for Review Stage */}
            <div className="p-4 sm:px-6 bg-[#120424] border-t border-purple-500/30 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetScan}
                className="px-4 py-2 bg-[#241148] hover:bg-[#341866] text-slate-300 border border-purple-500/30 rounded text-xs font-mono font-bold transition cursor-pointer"
              >
                Quay lại màn hình quét
              </button>

              <button
                type="button"
                onClick={handleBatchImportQuestions}
                disabled={extractedQuestions.filter(q => q.selected).length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded text-xs font-mono uppercase tracking-wide flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 transition transform active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>
                  Nhập {extractedQuestions.filter(q => q.selected).length} Câu Vào Ngân Hàng
                </span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>,
    document.body
  );
};
