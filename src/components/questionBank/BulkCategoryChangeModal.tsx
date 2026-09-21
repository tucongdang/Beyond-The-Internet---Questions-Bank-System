import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  FolderEdit, 
  X, 
  CheckCircle2, 
  Layers, 
  Tag, 
  Sparkles, 
  Scale, 
  ShieldCheck, 
  Target, 
  AlertCircle,
  HelpCircle,
  Hash
} from 'lucide-react';
import { 
  QuestionItem, 
  CompetitionStage, 
  CognitiveLevel, 
  DigitalCompetencyDomainKey, 
  ApprovalStatus,
  QuestionRoundFormat
} from '../../types';
import { 
  DIGITAL_COMPETENCY_DOMAINS, 
  COGNITIVE_LEVELS, 
  COMPETITION_STAGES,
  QUESTION_ROUND_FORMATS,
  BTI_ROUND_GROUPS,
  BtiRoundGroupKey,
  getActiveFormatsForRoundGroup
} from '../../data/digitalCompetencyData';
import { questionBankManager } from '../../services/questionBankManager';
import { BulkUpdatePreviewModal, BulkPreviewItem } from './BulkUpdatePreviewModal';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';

interface BulkCategoryChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedQuestionIds: string[];
  questions: QuestionItem[];
  onSuccess: (updatedCount: number) => void;
}

export const BulkCategoryChangeModal: React.FC<BulkCategoryChangeModalProps> = ({
  isOpen,
  onClose,
  selectedQuestionIds,
  questions,
  onSuccess
}) => {
  // Enabled toggles
  const [updateCategory, setUpdateCategory] = useState<boolean>(true);
  const [updateRoundGroup, setUpdateRoundGroup] = useState<boolean>(false);
  const [updateStage, setUpdateStage] = useState<boolean>(false);
  const [updateDomain, setUpdateDomain] = useState<boolean>(false);
  const [updateLevel, setUpdateLevel] = useState<boolean>(false);
  const [updateLegal, setUpdateLegal] = useState<boolean>(false);
  const [updateStatus, setUpdateStatus] = useState<boolean>(false);
  const [reindexIdPrefix, setReindexIdPrefix] = useState<boolean>(false);

  // Field values
  const [category, setCategory] = useState<string>('An toàn thông tin & Quyền riêng tư');
  const [selectedRoundGroup, setSelectedRoundGroup] = useState<BtiRoundGroupKey>('KHOI_DONG');
  const [roundFormat, setRoundFormat] = useState<QuestionRoundFormat>('KHOI_DONG_RIENG');
  const [stage, setStage] = useState<CompetitionStage>('BAN_KET_1');
  const [domain, setDomain] = useState<DigitalCompetencyDomainKey>('MIEN_4');
  const [level, setLevel] = useState<CognitiveLevel>('THONG_HIEU');
  const [legalReference, setLegalReference] = useState<string>('Thông tư 02/2025/TT-BGDĐT');
  const [status, setStatus] = useState<ApprovalStatus>('APPROVED');

  // Preview state
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [previewItems, setPreviewItems] = useState<BulkPreviewItem[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<Partial<QuestionItem>>({});
  const [pendingReindex, setPendingReindex] = useState<boolean>(false);

  if (!isOpen) return null;

  const count = selectedQuestionIds.length;

  const customCatNames = questionBankManager.getCustomCategories().map(c => c.name);
  const categoryPresets = Array.from(new Set([
    ...customCatNames,
    'Tư duy Logic',
    'Toán học & Thuật toán',
    'Đố vui & Tri thức số',
    'Miền I: Khai thác dữ liệu & thông tin',
    'Miền II: Giao tiếp & Trách nhiệm số',
    'Miền III: Sáng tạo nội dung số',
    'Miền IV: An toàn & Quyền riêng tư',
    'Miền V: Giải quyết vấn đề & Kỹ năng số',
    'Miền VI: Trí tuệ nhân tạo (AI & GenAI)',
    'Luật An ninh mạng 2018',
    'Nghị định 13/2023/NĐ-CP (Bảo vệ dữ liệu cá nhân)',
    'Nghị định 15/2020/NĐ-CP (Xử phạt hành chính viễn thông)',
    'Bộ Quy tắc ứng xử trên mạng xã hội',
    'Phòng chống Deepfake & Lừa đảo trực tuyến'
  ]));

  const legalPresets = [
    'Thông tư 02/2025/TT-BGDĐT',
    'Nghị định 13/2023/NĐ-CP',
    'Nghị định 15/2020/NĐ-CP (sửa đổi NĐ 14/2022/NĐ-CP)',
    'Luật An ninh mạng 2018',
    'Luật Giao dịch điện tử 2023',
    'Luật An toàn thông tin mạng 2015',
    'Khung DigComp 2.2 Châu Âu'
  ];

  const handleRoundGroupChange = (grp: BtiRoundGroupKey) => {
    setSelectedRoundGroup(grp);
    const activeFormats = getActiveFormatsForRoundGroup(grp);
    if (activeFormats.length > 0) {
      setRoundFormat(activeFormats[0].format);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (count === 0) {
      alert('Chưa có câu hỏi nào được chọn.');
      return;
    }

    if (!updateCategory && !updateRoundGroup && !updateStage && !updateDomain && !updateLevel && !updateLegal && !updateStatus && !reindexIdPrefix) {
      alert('Vui lòng tích chọn ít nhất 1 thuộc tính để cập nhật hàng loạt.');
      return;
    }

    vibrateTap();
    soundFx.playClick();

    const updates: Partial<QuestionItem> = {};

    if (updateCategory) {
      updates.category = category.trim();
    }

    if (updateRoundGroup) {
      updates.round_format = roundFormat;
      const fmtInfo = QUESTION_ROUND_FORMATS[roundFormat];
      if (fmtInfo) {
        updates.round_name = fmtInfo.name;
        updates.round_type = fmtInfo.defaultRoundType;
        if (fmtInfo.defaultTimeLimit) {
          updates.time_limit = fmtInfo.defaultTimeLimit;
        }
        if (fmtInfo.defaultPoints) {
          updates.points = fmtInfo.defaultPoints;
        }
      }
    }

    if (updateStage) {
      updates.stage = stage;
    }

    if (updateDomain) {
      updates.digital_competency_domain = domain;
    }

    if (updateLevel) {
      updates.cognitive_level = level;
    }

    if (updateLegal) {
      updates.legal_reference = legalReference.trim();
    }

    if (updateStatus) {
      updates.approval_status = status;
      if (status === 'APPROVED') {
        updates.approved_by = questionBankManager.getCurrentUser().name;
      }
    }

    // Process updates
    let updatedCount = 0;
    if (reindexIdPrefix && updateRoundGroup) {
      // Reindex prefix according to round group
      const prefixMap: Record<BtiRoundGroupKey, string> = {
        KHOI_DONG: 'KD',
        VCNV: 'VCNV',
        TANG_TOC: 'TT',
        VE_DICH: 'VD',
        VONG_LOAI: 'VL',
        PHU: 'PHU'
      };
      const prefix = prefixMap[selectedRoundGroup] || 'Q';

      const allQuestions = questionBankManager.getQuestions();
      const idSet = new Set(selectedQuestionIds);
      let localCounter = 0;

      // Count existing questions with this prefix not in selected set
      allQuestions.forEach(q => {
        if (!idSet.has(q.id) && q.id.startsWith(prefix + '_')) {
          const numPart = parseInt(q.id.replace(prefix + '_', ''), 10);
          if (!isNaN(numPart) && numPart > localCounter) {
            localCounter = numPart;
          }
        }
      });

      selectedQuestionIds.forEach(id => {
        localCounter++;
        const newId = `${prefix}_${localCounter < 10 ? '0' + localCounter : localCounter}`;
        questionBankManager.updateQuestion(id, {
          ...updates,
          id: newId
        });
        updatedCount++;
      });
    } else {
      updatedCount = questionBankManager.batchUpdate(selectedQuestionIds, updates);
    }

    vibrateSuccess();
    soundFx.playCorrect();
    onSuccess(updatedCount);
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-hidden modal-backdrop-isolated select-none">
      <div className="fluent-card w-full max-w-2xl bg-[#190839] border border-theme-accent/30 rounded-[6px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#241148] px-5 py-3.5 border-b border-theme-accent/25 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[4px] bg-theme-accent/15 border border-theme-accent/30 text-theme-accent">
              <FolderEdit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>ĐỔI DANH MỤC &amp; PHÂN LOẠI HÀNG LOẠT</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  {count} câu hỏi đã chọn
                </span>
              </h3>
              <p className="text-xs text-[#B6A6D8]">
                Chọn các trường cần thay đổi hàng loạt cho {count} câu hỏi được đánh dấu.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Notice */}
          <div className="p-3 rounded-[4px] bg-amber-950/30 border border-amber-500/30 text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11.5px] leading-relaxed">
              <strong>Lưu ý:</strong> Chỉ những mục được <span className="text-amber-300 font-bold">tích chọn [✓]</span> mới được áp dụng cập nhật đồng thời lên {count} câu hỏi đã chọn. Các trường không tích chọn sẽ được giữ nguyên giá trị ban đầu.
            </div>
          </div>

          {/* 1. Category (Chủ đề / Danh mục) */}
          <div className={`p-3.5 rounded-[4px] border transition ${updateCategory ? 'bg-[#241148]/90 border-theme-accent/40 shadow-sm' : 'bg-white/[0.02] border-white/10 opacity-70'}`}>
            <label className="flex items-center gap-2 font-mono font-bold text-slate-200 mb-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={updateCategory}
                onChange={e => setUpdateCategory(e.target.checked)}
                className="w-4 h-4 rounded-[2px] bg-[#190839] border-theme-accent/40 text-theme-accent accent-theme-accent cursor-pointer"
              />
              <Tag className="w-3.5 h-3.5 text-theme-accent" />
              <span>1. Tên Danh Mục / Chủ Đề (Category)</span>
            </label>

            {updateCategory && (
              <div className="space-y-2 mt-2 pl-6">
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="Nhập tên chủ đề hoặc chọn từ danh sách bên dưới..."
                  className="w-full px-3 py-2 bg-[#14062E] border border-theme-accent/30 rounded-[4px] text-white focus:outline-none focus:border-theme-accent text-xs"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {categoryPresets.slice(0, 6).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCategory(preset)}
                      className={`text-[10px] px-2 py-0.5 rounded-[3px] border transition cursor-pointer ${
                        category === preset
                          ? 'bg-theme-accent text-[#190839] border-theme-accent font-bold'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Round Group & Format (Phần thi / Vòng thi) */}
          <div className={`p-3.5 rounded-[4px] border transition ${updateRoundGroup ? 'bg-[#241148]/90 border-sky-500/40 shadow-sm' : 'bg-white/[0.02] border-white/10 opacity-70'}`}>
            <label className="flex items-center gap-2 font-mono font-bold text-slate-200 mb-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={updateRoundGroup}
                onChange={e => setUpdateRoundGroup(e.target.checked)}
                className="w-4 h-4 rounded-[2px] bg-[#190839] border-sky-400 text-sky-400 accent-sky-400 cursor-pointer"
              />
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>2. Vòng Thi &amp; Định Dạng Phần Thi (Round &amp; Format)</span>
            </label>

            {updateRoundGroup && (
              <div className="space-y-3 mt-2 pl-6">
                <div>
                  <label className="block text-[11px] font-mono text-[#B6A6D8] mb-1">Chọn Vòng thi BTI 2026:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {Object.values(BTI_ROUND_GROUPS).map(grp => (
                      <button
                        key={grp.key}
                        type="button"
                        onClick={() => handleRoundGroupChange(grp.key)}
                        className={`px-2.5 py-1.5 rounded-[4px] text-[11px] font-mono font-bold border text-left transition cursor-pointer ${
                          selectedRoundGroup === grp.key
                            ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-sm'
                            : 'bg-[#14062E] text-slate-300 border-white/10 hover:bg-white/5'
                        }`}
                      >
                        {grp.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#B6A6D8] mb-1">Định dạng câu hỏi cụ thể:</label>
                  <select
                    value={roundFormat}
                    onChange={e => setRoundFormat(e.target.value as QuestionRoundFormat)}
                    className="w-full px-3 py-2 bg-[#14062E] border border-sky-500/30 rounded-[4px] text-white focus:outline-none focus:border-sky-400 text-xs"
                  >
                    {getActiveFormatsForRoundGroup(selectedRoundGroup).map(fmt => (
                      <option key={fmt.format} value={fmt.format}>
                        {fmt.name} ({fmt.defaultTimeLimit}s) - {fmt.scoringRule}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 text-[11px] text-amber-300 font-mono cursor-pointer select-none bg-amber-950/20 p-2 rounded border border-amber-500/30">
                    <input
                      type="checkbox"
                      checked={reindexIdPrefix}
                      onChange={e => setReindexIdPrefix(e.target.checked)}
                      className="w-3.5 h-3.5 rounded-[2px] text-amber-400 accent-amber-400 cursor-pointer"
                    />
                    <Hash className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Đánh lại tiền tố mã câu theo vòng mới (VD: KD_01, VCNV_01, TT_01, VD_01...)</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* 3. Stage & Domain (Giai đoạn & Miền Năng Lực Số) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Stage */}
            <div className={`p-3.5 rounded-[4px] border transition ${updateStage ? 'bg-[#241148]/90 border-purple-500/40 shadow-sm' : 'bg-white/[0.02] border-white/10 opacity-70'}`}>
              <label className="flex items-center gap-2 font-mono font-bold text-slate-200 mb-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={updateStage}
                  onChange={e => setUpdateStage(e.target.checked)}
                  className="w-4 h-4 rounded-[2px] bg-[#190839] border-purple-400 text-purple-400 accent-purple-400 cursor-pointer"
                />
                <Target className="w-3.5 h-3.5 text-purple-400" />
                <span>3. Giai Đoạn Thi Đấu (Stage)</span>
              </label>

              {updateStage && (
                <div className="pl-6 mt-1">
                  <select
                    value={stage}
                    onChange={e => setStage(e.target.value as CompetitionStage)}
                    className="w-full px-2.5 py-1.5 bg-[#14062E] border border-purple-500/30 rounded-[4px] text-white focus:outline-none focus:border-purple-400 text-xs"
                  >
                    {Object.values(COMPETITION_STAGES).map(st => (
                      <option key={st.stage} value={st.stage}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Level */}
            <div className={`p-3.5 rounded-[4px] border transition ${updateLevel ? 'bg-[#241148]/90 border-amber-500/40 shadow-sm' : 'bg-white/[0.02] border-white/10 opacity-70'}`}>
              <label className="flex items-center gap-2 font-mono font-bold text-slate-200 mb-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={updateLevel}
                  onChange={e => setUpdateLevel(e.target.checked)}
                  className="w-4 h-4 rounded-[2px] bg-[#190839] border-amber-400 text-amber-400 accent-amber-400 cursor-pointer"
                />
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>4. Mức Độ Nhận Thức (Level)</span>
              </label>

              {updateLevel && (
                <div className="pl-6 mt-1">
                  <select
                    value={level}
                    onChange={e => setLevel(e.target.value as CognitiveLevel)}
                    className="w-full px-2.5 py-1.5 bg-[#14062E] border border-amber-500/30 rounded-[4px] text-white focus:outline-none focus:border-amber-400 text-xs"
                  >
                    {Object.values(COGNITIVE_LEVELS).map(lvl => (
                      <option key={lvl.level} value={lvl.level}>
                        {lvl.name} ({lvl.levelsRange})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 5. Digital Competency Domain */}
          <div className={`p-3.5 rounded-[4px] border transition ${updateDomain ? 'bg-[#241148]/90 border-emerald-500/40 shadow-sm' : 'bg-white/[0.02] border-white/10 opacity-70'}`}>
            <label className="flex items-center gap-2 font-mono font-bold text-slate-200 mb-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={updateDomain}
                onChange={e => setUpdateDomain(e.target.checked)}
                className="w-4 h-4 rounded-[2px] bg-[#190839] border-emerald-400 text-emerald-400 accent-emerald-400 cursor-pointer"
              />
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>5. Miền Năng Lực Số (Thông tư 02/2025/TT-BGDĐT)</span>
            </label>

            {updateDomain && (
              <div className="pl-6 mt-2 space-y-2">
                <select
                  value={domain}
                  onChange={e => setDomain(e.target.value as DigitalCompetencyDomainKey)}
                  className="w-full px-3 py-2 bg-[#14062E] border border-emerald-500/30 rounded-[4px] text-white focus:outline-none focus:border-emerald-400 text-xs"
                >
                  {Object.values(DIGITAL_COMPETENCY_DOMAINS).map(dom => (
                    <option key={dom.key} value={dom.key}>
                      {dom.code}: {dom.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#B6A6D8] italic">
                  {DIGITAL_COMPETENCY_DOMAINS[domain]?.description}
                </p>
              </div>
            )}
          </div>

          {/* 6. Legal Reference & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Legal */}
            <div className={`p-3.5 rounded-[4px] border transition ${updateLegal ? 'bg-[#241148]/90 border-amber-500/40 shadow-sm' : 'bg-white/[0.02] border-white/10 opacity-70'}`}>
              <label className="flex items-center gap-2 font-mono font-bold text-slate-200 mb-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={updateLegal}
                  onChange={e => setUpdateLegal(e.target.checked)}
                  className="w-4 h-4 rounded-[2px] bg-[#190839] border-amber-400 text-amber-400 accent-amber-400 cursor-pointer"
                />
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                <span>6. Căn Cứ Pháp Lý (Legal)</span>
              </label>

              {updateLegal && (
                <div className="pl-6 mt-1 space-y-1.5">
                  <input
                    type="text"
                    value={legalReference}
                    onChange={e => setLegalReference(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#14062E] border border-amber-500/30 rounded-[4px] text-white focus:outline-none focus:border-amber-400 text-xs"
                    placeholder="VD: Nghị định 13/2023/NĐ-CP"
                  />
                  <div className="flex flex-wrap gap-1">
                    {legalPresets.slice(0, 3).map(lp => (
                      <button
                        key={lp}
                        type="button"
                        onClick={() => setLegalReference(lp)}
                        className="text-[9.5px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 cursor-pointer"
                      >
                        {lp}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Approval Status */}
            <div className={`p-3.5 rounded-[4px] border transition ${updateStatus ? 'bg-[#241148]/90 border-emerald-500/40 shadow-sm' : 'bg-white/[0.02] border-white/10 opacity-70'}`}>
              <label className="flex items-center gap-2 font-mono font-bold text-slate-200 mb-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={updateStatus}
                  onChange={e => setUpdateStatus(e.target.checked)}
                  className="w-4 h-4 rounded-[2px] bg-[#190839] border-emerald-400 text-emerald-400 accent-emerald-400 cursor-pointer"
                />
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>7. Trạng Thái Duyệt (Status)</span>
              </label>

              {updateStatus && (
                <div className="pl-6 mt-1">
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as ApprovalStatus)}
                    className="w-full px-2.5 py-1.5 bg-[#14062E] border border-emerald-500/30 rounded-[4px] text-white focus:outline-none focus:border-emerald-400 text-xs"
                  >
                    <option value="APPROVED">✓ Đã Phê Duyệt (APPROVED)</option>
                    <option value="PENDING_REVIEW">• Chờ Thẩm Định (PENDING_REVIEW)</option>
                    <option value="DRAFT">✎ Bản Thảo (DRAFT)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-theme-accent/20 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[4px] bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              className="fluent-btn-primary px-6 py-2 rounded-[4px] font-mono font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Áp dụng cập nhật cho {count} câu hỏi</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
