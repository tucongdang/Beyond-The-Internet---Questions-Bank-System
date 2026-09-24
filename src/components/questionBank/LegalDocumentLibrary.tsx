import React, { useState, useRef } from 'react';
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
  HardDrive
} from 'lucide-react';
import { LegalDocument, PickedDriveFile } from '../../types';
import { questionBankManager } from '../../services/questionBankManager';
import { googlePickerService } from '../../services/googlePickerService';
import { GooglePickerTriggerButton } from '../common/GooglePickerTriggerButton';
import { soundFx } from '../../services/audioEffects';

import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface LegalDocumentLibraryProps {
  onSelectForAI?: (doc: LegalDocument) => void;
}

export const LegalDocumentLibrary: React.FC<LegalDocumentLibraryProps> = ({ onSelectForAI }) => {
  const [documents, setDocuments] = useState<LegalDocument[]>(() => questionBankManager.getDocuments());
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  useLockBodyScroll(showAddModal);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentDoc = documents.find(d => d.id === selectedDocId) || documents[0];

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    vibrateTap();
    soundFx.playClick();
    setIsUploading(true);

    try {
      // Read file text content
      const text = await file.text();
      const filenameWithoutExt = file.name.replace(/\.[^/.]+$/, "");

      const newDoc: LegalDocument = {
        id: `DOC_${Date.now()}`,
        title: filenameWithoutExt,
        documentNumber: `VB_${Math.floor(100 + Math.random() * 900)}/${new Date().getFullYear()}`,
        issuingAuthority: 'Cơ quan có thẩm quyền',
        issuedDate: new Date().toISOString().slice(0, 10),
        issueDate: new Date().toISOString().slice(0, 10),
        effectiveDate: new Date().toISOString().slice(0, 10),
        type: file.name.endsWith('.pdf') ? 'LUAT' : 'QUY_DINH_KHAC',
        domain: 'MIEN_4',
        summary: text.slice(0, 300) || 'Văn bản pháp lý cập nhật phục vụ công tác khảo thí BTI 2026.',
        fullText: text,
        relatedDomains: ['MIEN_4'],
        keyArticles: [
          { article: 'Trích đoạn 1', content: text.slice(0, 200) }
        ],
        uploadedAt: Date.now(),
        uploadedBy: questionBankManager.getCurrentUser().name
      };

      questionBankManager.addDocument(newDoc);
      const updated = questionBankManager.getDocuments();
      setDocuments(updated);
      setSelectedDocId(newDoc.id);
      soundFx.playCorrect();
      vibrateSuccess();
    } catch (err) {
      console.error('Upload document error:', err);
      soundFx.playError();
      alert('Không thể đọc file văn bản. Vui lòng thử lại với định dạng văn bản .txt, .json, .csv hoặc .pdf.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDriveDocPicked = async (file: PickedDriveFile) => {
    setIsUploading(true);
    try {
      let contentText = '';
      try {
        const result = await googlePickerService.downloadFileContent(file.id, file.mimeType);
        contentText = result.text || '';
      } catch (e) {
        console.warn('Could not read full text of Drive file, creating reference entry:', e);
      }

      const filenameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const newDoc: LegalDocument = {
        id: `DRIVE_${file.id}`,
        title: filenameWithoutExt,
        documentNumber: `DRIVE_${file.id.slice(0, 8).toUpperCase()}`,
        issuingAuthority: 'Tài liệu Google Drive',
        issuedDate: new Date().toISOString().slice(0, 10),
        issueDate: new Date().toISOString().slice(0, 10),
        effectiveDate: new Date().toISOString().slice(0, 10),
        type: file.mimeType.includes('pdf') ? 'LUAT' : 'QUY_DINH_KHAC',
        domain: 'MIEN_4',
        summary: contentText ? contentText.slice(0, 300) : `Tệp được chọn từ Google Drive: ${file.name}.`,
        fullText: contentText || `Tệp Google Drive: ${file.name}\nLiên kết: ${file.url || ''}`,
        relatedDomains: ['MIEN_4'],
        keyArticles: [
          { article: 'Tệp nguồn Drive', content: file.url ? `Liên kết xem: ${file.url}` : 'Đã kết nối qua Google Picker' }
        ],
        uploadedAt: Date.now(),
        uploadedBy: questionBankManager.getCurrentUser().name
      };

      questionBankManager.addDocument(newDoc);
      const updated = questionBankManager.getDocuments();
      setDocuments(updated);
      setSelectedDocId(newDoc.id);
      soundFx.playCorrect();
      vibrateSuccess();
    } catch (err: any) {
      console.error('Error importing document from Google Drive:', err);
      soundFx.playError();
      alert('Không thể nhập tài liệu từ Google Drive: ' + (err.message || 'Lỗi'));
    } finally {
      setIsUploading(false);
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
    setShowAddModal(false);
  };

  const handleDeleteDoc = (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa văn bản này khỏi thư viện?')) return;
    vibrateTap();
    soundFx.playClick();

    questionBankManager.deleteDocument(id);
    const updated = questionBankManager.getDocuments();
    setDocuments(updated);
    if (selectedDocId === id && updated[0]) {
      setSelectedDocId(updated[0].id);
    }
  };

  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.issuingAuthority.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="fluent-box p-4 sm:p-5 relative overflow-hidden bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-black/60 border border-amber-500/20 rounded-[4px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold mb-2 border border-amber-400/30">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>Legal Regulatory Repository • Căn Cứ Khảo Thí</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              Thư Viện Văn Bản Pháp Lý & Căn Cứ Đề Thi
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-2xl">
              Hỗ trợ tải lên tài liệu pháp luật (Thông tư 02/2025/TT-BGDĐT, Nghị định 13/2023/NĐ-CP, Luật An ninh mạng) để cập nhật và làm căn cứ cho AI soạn câu hỏi chuẩn xác.
            </p>
          </div>

          <div className="flex items-center gap-2">
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
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-[4px] text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-950/50 transition cursor-pointer shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Đang Đọc File...' : 'Upload Văn Bản Mới'}</span>
            </button>

            <GooglePickerTriggerButton
              viewId="PDFS"
              label="Chọn từ Drive (PDF/Doc)"
              title="Chọn tài liệu căn cứ từ Google Drive (Google Picker)"
              onFilePicked={handleDriveDocPicked}
              className="py-2.5 px-3 rounded-[4px] shrink-0"
            />

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-[4px] text-xs font-bold font-mono transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Library layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: List of Legal Docs */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo số hiệu, tên văn bản..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/15 rounded-[4px] pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredDocs.map(doc => {
              const isSelected = doc.id === selectedDocId;
              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    setSelectedDocId(doc.id);
                  }}
                  className={`p-3.5 rounded-[4px] border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'border-amber-500/60 bg-amber-950/20 shadow-md shadow-amber-950/40'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-amber-300 font-bold bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/30">
                      {doc.documentNumber}
                    </span>
                    <span className="text-[10px] font-mono text-white/50">
                      {doc.issuedDate || doc.issueDate}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2">
                    {doc.title}
                  </h4>

                  <p className="text-[11px] text-white/60 line-clamp-2">
                    {doc.summary}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-white/40 pt-1 border-t border-white/5">
                    <span>{doc.issuingAuthority}</span>
                    <span className="text-emerald-400">{doc.keyArticles?.length || 0} điều khoản</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Inspector & Key Articles */}
        <div className="lg:col-span-8 space-y-4">
          {currentDoc ? (
            <div className="fluent-box p-5 rounded-[4px] border border-white/10 space-y-5">
              {/* Header */}
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

                  {questionBankManager.canDelete() && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(currentDoc.id)}
                      className="p-1.5 text-rose-400 hover:bg-rose-950/30 rounded-[4px] transition"
                      title="Xóa văn bản"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
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
                <p className="text-white/80 leading-relaxed">
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

                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {currentDoc.keyArticles?.map((art, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-black/40 rounded-[4px] border border-white/10 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-amber-400">
                          {art.article}
                        </span>
                      </div>
                      <p className="text-white/80 leading-relaxed font-sans">
                        {art.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="fluent-box p-12 text-center text-white/40">
              Chưa chọn văn bản nào
            </div>
          )}
        </div>
      </div>

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
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-[4px] text-xs font-bold font-mono"
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
