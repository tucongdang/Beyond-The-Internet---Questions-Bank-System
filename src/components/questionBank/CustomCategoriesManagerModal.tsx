import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  FolderPlus, 
  Search, 
  Trash2, 
  Edit2, 
  Check, 
  AlertTriangle, 
  Folder, 
  Sparkles,
  RefreshCw,
  Layers,
  Filter,
  Plus,
  Zap,
  FolderCheck,
  Sliders,
  ChevronRight,
  Info,
  CheckCircle2,
  Terminal,
  Bell,
  Activity,
  BarChart3,
  PieChart,
  AlertCircle,
  FileText,
  ArrowRight
} from 'lucide-react';
import { CustomCategory, QuestionItem } from '../../types';
import { questionBankManager } from '../../services/questionBankManager';
import { CATEGORY_COLOR_SCHEMES, getCategoryColorScheme, setCategoryColor } from '../../utils/categoryColorUtils';
import { 
  smartOrganizeAllQuestions, 
  smartOrganizeAllQuestionsAsync, 
  classifyQuestionSmart,
  SmartOrganizeSummary, 
  OrganizeProgressInfo 
} from '../../services/smartCategorizationService';

import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateError } from '../../utils/hapticUtils';

interface CustomCategoriesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions?: QuestionItem[];
}

type FilterTab = 'ALL' | 'HAS_QUESTIONS' | 'NO_QUESTIONS' | 'SYSTEM' | 'SMART_REPORT';


export const CustomCategoriesManagerModal: React.FC<CustomCategoriesManagerModalProps> = ({
  isOpen,
  onClose,
  questions = questionBankManager.getQuestions()
}) => {
  const [categories, setCategories] = useState<CustomCategory[]>(() => questionBankManager.getCustomCategories());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  
  // New Category Form State
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedColor, setSelectedColor] = useState('purple');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit State
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('purple');

  // Delete Confirmation State
  const [deletingCategory, setDeletingCategory] = useState<CustomCategory | null>(null);
  const [reassignCategoryName, setReassignCategoryName] = useState<string>('Khác / Chưa phân loại');

  // Smart Categorization State
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [overwriteAllMode, setOverwriteAllMode] = useState<boolean>(false);
  const [organizeSummary, setOrganizeSummary] = useState<SmartOrganizeSummary | null>(null);
  const [progressInfo, setProgressInfo] = useState<OrganizeProgressInfo | null>(null);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [toastNotification, setToastNotification] = useState<{
    type: 'success' | 'info' | 'warning';
    title: string;
    message: string;
  } | null>(null);

  // Handle One-Click Smart Organize All with Real-Time Progress & Logs
  const handleOrganizeAll = async () => {
    soundFx.playClick();
    vibrateTap();
    setIsOrganizing(true);
    setLiveLogs([]);
    setProgressInfo({
      processed: 0,
      total: questions.length,
      percent: 0,
      movedCount: 0,
      categoryBreakdown: {}
    });

    try {
      const summary = await smartOrganizeAllQuestionsAsync({
        overwriteAll: overwriteAllMode,
        onProgress: (info) => {
          setProgressInfo(info);
          if (info.logMessage) {
            setLiveLogs(prev => [info.logMessage!, ...prev].slice(0, 10));
          }
        }
      });

      setOrganizeSummary(summary);
      setIsOrganizing(false);
      setCategories(questionBankManager.getCustomCategories());
      soundFx.playCorrect();
      vibrateSuccess();

      // Trigger Toast Notification
      const catCount = Object.keys(summary.categoryBreakdown).length;
      setToastNotification({
        type: 'success',
        title: '⚡ Hoàn Tất Phân Loại Thông Minh!',
        message: `Đã di chuyển thành công ${summary.totalCategorized} câu hỏi vào ${catCount} danh mục chuẩn BTI 2026.`
      });

      // Auto dismiss toast after 6 seconds
      setTimeout(() => {
        setToastNotification(null);
      }, 6000);

    } catch (e) {
      console.error('Error during smart categorization:', e);
      setIsOrganizing(false);
      soundFx.playError();
      vibrateError();
    }
  };


  // Sync state when modal opens or questionBankManager updates
  useEffect(() => {
    if (!isOpen) return;
    const updateCategories = () => {
      // Auto-sync categories from questions to guarantee all 67 are present
      questionBankManager.syncCategoriesFromQuestions();
      setCategories(questionBankManager.getCustomCategories());
    };
    updateCategories();
    return questionBankManager.subscribe(updateCategories);
  }, [isOpen]);

  // Map category usage counts
  const categoryUsageMap = useMemo(() => {
    const map: Record<string, number> = {};
    questions.forEach(q => {
      if (q.category && q.category.trim()) {
        const cat = q.category.trim();
        map[cat] = (map[cat] || 0) + 1;
      }
    });
    return map;
  }, [questions]);

  // Smart Analysis Report Data Computation
  const smartReportData = useMemo(() => {
    const genericCategories = new Set([
      '', 'khác / chưa phân loại', 'chưa phân loại', 'tổng hợp', 'khác', 'undefined'
    ]);

    const orphanQuestions: {
      question: QuestionItem;
      suggestedCategory: string;
      confidence: 'HIGH' | 'MEDIUM' | 'LOW';
      reasoning: string;
    }[] = [];

    const categoryCounts: Record<string, number> = {};

    questions.forEach(q => {
      const cat = (q.category || '').trim();
      if (!cat || genericCategories.has(cat.toLowerCase())) {
        const smartResult = classifyQuestionSmart(q);
        orphanQuestions.push({
          question: q,
          suggestedCategory: smartResult.suggestedCategory,
          confidence: smartResult.confidence,
          reasoning: smartResult.reasoning
        });
      }
      const finalCat = cat || 'Khác / Chưa phân loại';
      categoryCounts[finalCat] = (categoryCounts[finalCat] || 0) + 1;
    });

    const totalQuestions = questions.length;
    const orphanCount = orphanQuestions.length;
    const categorizedCount = totalQuestions - orphanCount;
    const categorizationRate = totalQuestions > 0 ? Math.round((categorizedCount / totalQuestions) * 100) : 0;

    // Distribution across all categories
    const distribution = categories.map(c => {
      const count = categoryCounts[c.name] || 0;
      return {
        id: c.id,
        categoryName: c.name,
        color: c.color || 'purple',
        count,
        percentage: totalQuestions > 0 ? Math.round((count / totalQuestions) * 100) : 0
      };
    }).sort((a, b) => b.count - a.count);

    return {
      totalQuestions,
      categorizedCount,
      orphanCount,
      categorizationRate,
      activeCategoriesCount: distribution.filter(d => d.count > 0).length,
      emptyCategoriesCount: distribution.filter(d => d.count === 0).length,
      distribution,
      orphanQuestions
    };
  }, [questions, categories]);

  // Handle Quick Assign Category for Orphan Question from Report View
  const handleAssignOrphanCategory = (questionId: string, targetCategoryName: string) => {
    soundFx.playClick();
    vibrateTap();
    questionBankManager.batchUpdate([questionId], { category: targetCategoryName });
    setCategories(questionBankManager.getCustomCategories());
    soundFx.playCorrect();
    vibrateSuccess();

    setToastNotification({
      type: 'success',
      title: 'Đã gán danh mục thành công!',
      message: `Đã xếp câu hỏi vào danh mục "${targetCategoryName}".`
    });

    setTimeout(() => setToastNotification(null), 4000);
  };


  // Handle Manual Full Sync
  const handleManualSync = () => {
    soundFx.playClick();
    vibrateTap();
    const added = questionBankManager.syncCategoriesFromQuestions();
    const updatedList = questionBankManager.getCustomCategories();
    setCategories(updatedList);
    soundFx.playCorrect();
    vibrateSuccess();
  };

  // Filtered categories list
  const filteredCategories = useMemo(() => {
    let list = categories;

    // Filter by Tab
    if (activeTab === 'HAS_QUESTIONS') {
      list = list.filter(c => (categoryUsageMap[c.name] || 0) > 0);
    } else if (activeTab === 'NO_QUESTIONS') {
      list = list.filter(c => (categoryUsageMap[c.name] || 0) === 0);
    } else if (activeTab === 'SYSTEM') {
      list = list.filter(c => c.isSystem);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.description && c.description.toLowerCase().includes(q))
      );
    }

    // Sort by count descending then name
    return [...list].sort((a, b) => {
      const countA = categoryUsageMap[a.name] || 0;
      const countB = categoryUsageMap[b.name] || 0;
      if (countB !== countA) return countB - countA;
      return a.name.localeCompare(b.name, 'vi');
    });
  }, [categories, searchQuery, activeTab, categoryUsageMap]);

  if (!isOpen) return null;

  // Handle Add Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const name = newName.trim();
    if (!name) {
      setFormError('Vui lòng nhập tên danh mục!');
      soundFx.playError();
      vibrateError();
      return;
    }

    const created = questionBankManager.addCustomCategory({
      name,
      description: newDesc,
      color: selectedColor
    });

    if (!created) {
      setFormError(`Danh mục "${name}" đã tồn tại trong hệ thống!`);
      soundFx.playError();
      vibrateError();
      return;
    }

    soundFx.playCorrect();
    vibrateSuccess();
    setNewName('');
    setNewDesc('');
    setSelectedColor('purple');
    setCategories(questionBankManager.getCustomCategories());
  };

  // Start Editing
  const handleStartEdit = (cat: CustomCategory) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
    setEditColor(cat.color || 'purple');
    vibrateTap();
  };

  // Save Edit
  const handleSaveEdit = () => {
    if (!editingCategory) return;
    const name = editName.trim();
    if (!name) {
      alert('Tên danh mục không được để trống!');
      return;
    }

    const success = questionBankManager.updateCustomCategory(editingCategory.id, {
      name,
      description: editDesc,
      color: editColor
    });

    if (success) {
      soundFx.playCorrect();
      vibrateSuccess();
      setEditingCategory(null);
      setCategories(questionBankManager.getCustomCategories());
    } else {
      soundFx.playError();
      alert('Không thể lưu! Tên danh mục có thể đã bị trùng.');
    }
  };

  // Handle Delete
  const handleConfirmDelete = () => {
    if (!deletingCategory) return;
    
    questionBankManager.deleteCustomCategory(deletingCategory.id, reassignCategoryName);
    soundFx.playClick();
    vibrateSuccess();
    setDeletingCategory(null);
    setCategories(questionBankManager.getCustomCategories());
  };

  const totalCategoriesCount = categories.length;
  const categoriesWithQuestionsCount = categories.filter(c => (categoryUsageMap[c.name] || 0) > 0).length;
  const emptyCategoriesCount = totalCategoriesCount - categoriesWithQuestionsCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#14062E] border border-purple-500/30 rounded-[4px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 font-sans">
        
        {/* Fluent UI Header Banner */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-purple-500/20 bg-[#1A083B]/90 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-[4px] bg-purple-500/20 border border-purple-400/40 text-purple-300">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight font-mono uppercase">
                  Quản Lý Danh Mục Câu Hỏi
                </h2>
                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-[4px] bg-purple-500/30 text-purple-200 border border-purple-400/40">
                  {totalCategoriesCount} danh mục
                </span>
              </div>
              <p className="text-xs text-[#B6A6D8] mt-0.5">
                Cấu trúc phân loại 67 chủ đề & miền năng lực số BTI 2026. Tự động đồng bộ với dữ liệu ngân hàng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualSync}
              className="px-2.5 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/40 rounded-[4px] text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Đồng bộ tự động tất cả danh mục từ ngân hàng câu hỏi"
            >
              <RefreshCw className="w-3.5 h-3.5 text-purple-300" />
              <span className="hidden sm:inline">Đồng bộ 67 Danh mục</span>
            </button>

            <button
              type="button"
              onClick={() => {
                vibrateTap();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-[4px] hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-time Toast Notification Banner */}
        {toastNotification && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-[4px] bg-emerald-950/90 border border-emerald-500/50 text-emerald-100 flex items-center justify-between gap-3 shadow-xl animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
              <div>
                <h4 className="text-xs font-bold font-mono text-emerald-300">{toastNotification.title}</h4>
                <p className="text-[11.5px] text-emerald-100/90">{toastNotification.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="p-1 hover:bg-white/10 rounded text-emerald-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          
          {/* Smart Categorization Fluent Card */}
          <div className="fluent-card p-4 sm:p-5 rounded-[4px] border border-amber-500/30 bg-gradient-to-r from-[#211105]/80 via-[#1F0938]/90 to-[#12072B]/90 space-y-3.5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-[4px] bg-amber-500/20 border border-amber-400/40 text-amber-300">
                  <Zap className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-amber-200 font-mono uppercase tracking-wide">
                      Phân Loại Thông Minh (Smart Categorization)
                    </h3>
                    <span className="px-2 py-0.2 text-[10px] font-mono font-bold rounded-[3px] bg-amber-500/30 text-amber-200 border border-amber-400/30">
                      BTI 2026 AI Engine
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-300 mt-0.5">
                    Tự động phân tích nội dung, văn bản pháp lý (NĐ 13/2023, TT 02/2025, NĐ 15) & từ khóa để xếp câu hỏi vào đúng thư mục danh mục tương ứng.
                  </p>
                </div>
              </div>

              {/* One-Click Organize All Button */}
              <button
                type="button"
                onClick={handleOrganizeAll}
                disabled={isOrganizing}
                className="fluent-btn-primary px-4 py-2.5 text-xs font-mono font-bold flex items-center justify-center gap-2 rounded-[4px] cursor-pointer shadow-lg shadow-amber-950/40 shrink-0 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 hover:brightness-110 disabled:opacity-50"
              >
                {isOrganizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Đang tự động phân loại...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                    <span>⚡ Tự Động Phân Loại Tất Cả</span>
                  </>
                )}
              </button>
            </div>

            {/* Mode selection toggles */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  Chế độ xử lý:
                </span>

                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-200 hover:text-white">
                  <input
                    type="radio"
                    name="overwriteMode"
                    checked={!overwriteAllMode}
                    onChange={() => setOverwriteAllMode(false)}
                    className="accent-amber-400 cursor-pointer"
                  />
                  <span>Chỉ các câu chưa phân loại (Khác / Trống)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-amber-200 hover:text-amber-100 font-semibold">
                  <input
                    type="radio"
                    name="overwriteMode"
                    checked={overwriteAllMode}
                    onChange={() => setOverwriteAllMode(true)}
                    className="accent-amber-400 cursor-pointer"
                  />
                  <span>Phân loại lại TOÀN BỘ ngân hàng đề</span>
                </label>
              </div>

              <div className="text-[10.5px] text-slate-400 italic">
                Giảm 95% thời gian quản lý & phân loại thủ công
              </div>
            </div>

            {/* Real-time Progress & Log Feed Visual Card */}
            {(isOrganizing || (progressInfo && progressInfo.processed > 0)) && (
              <div className="p-3.5 bg-[#140628] border border-amber-500/40 rounded-[4px] space-y-2.5 shadow-inner animate-fadeIn mt-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <Activity className={`w-4 h-4 text-amber-400 ${isOrganizing ? 'animate-spin' : ''}`} />
                    <span>Tiến trình phân loại thời gian thực:</span>
                  </span>
                  <span className="text-amber-200 font-bold font-mono text-sm">
                    {progressInfo?.percent || 0}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-amber-500/30">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-150"
                    style={{ width: `${progressInfo?.percent || 0}%` }}
                  />
                </div>

                {/* Real-time Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono pt-1">
                  <div className="p-2 bg-[#1C093B] border border-purple-500/20 rounded-[3px] flex items-center justify-between">
                    <span className="text-slate-400">Đã xử lý:</span>
                    <strong className="text-white">{progressInfo?.processed || 0} / {progressInfo?.total || 0}</strong>
                  </div>

                  <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-[3px] flex items-center justify-between">
                    <span className="text-emerald-300">Đã di chuyển:</span>
                    <strong className="text-emerald-300 font-bold">{progressInfo?.movedCount || 0} câu</strong>
                  </div>

                  <div className="col-span-2 sm:col-span-1 p-2 bg-[#1A0938] border border-amber-500/20 rounded-[3px] flex items-center justify-between">
                    <span className="text-amber-300">Danh mục cập nhật:</span>
                    <strong className="text-amber-200 font-bold">{Object.keys(progressInfo?.categoryBreakdown || {}).length}</strong>
                  </div>
                </div>

                {/* Real-time Visual Log Feed */}
                {liveLogs.length > 0 && (
                  <div className="bg-[#0B031A] border border-purple-500/30 rounded-[4px] p-2.5 space-y-1 font-mono text-[10.5px] mt-2">
                    <div className="flex items-center justify-between border-b border-purple-500/20 pb-1 mb-1">
                      <span className="text-purple-300 font-bold flex items-center gap-1">
                        <Terminal className="w-3.5 h-3.5 text-purple-400" />
                        <span>Nhật ký hoạt động thời gian thực (Live Task Log)</span>
                      </span>
                      <span className="text-slate-500 text-[9.5px]">Tự động cập nhật</span>
                    </div>

                    <div className="space-y-1 max-h-28 overflow-y-auto custom-scrollbar">
                      {liveLogs.map((log, idx) => (
                        <div 
                          key={idx} 
                          className={`leading-relaxed ${
                            log.includes('[Phân loại]') ? 'text-amber-200 font-semibold' : 'text-slate-400'
                          }`}
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>


          {/* Create New Category Fluent Card */}
          <div className="fluent-card p-4 sm:p-5 rounded-[4px] border border-purple-500/25 bg-[#1C093F]/80 space-y-3">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
              <h3 className="text-xs font-bold text-purple-200 font-mono uppercase tracking-wide flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                Thêm Danh Mục Mới
              </h3>
              <span className="text-[11px] text-[#B6A6D8]">Tạo chủ đề phân loại tùy chỉnh cho BTI 2026</span>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tên danh mục <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="VD: Miền VII: Đổi mới sáng tạo số..."
                    className="w-full px-3 py-2 text-xs bg-[#100424] border border-purple-500/30 rounded-[4px] text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mô tả danh mục (Không bắt buộc)
                  </label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Mô tả phạm vi hoặc chuẩn đầu ra..."
                    className="w-full px-3 py-2 text-xs bg-[#100424] border border-purple-500/30 rounded-[4px] text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
                  />
                </div>
              </div>

              {/* Color Scheme Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tông màu nhận diện
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {Object.values(CATEGORY_COLOR_SCHEMES).map((scheme) => (
                    <button
                      key={scheme.id}
                      type="button"
                      onClick={() => setSelectedColor(scheme.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border text-xs font-medium transition cursor-pointer ${
                        selectedColor === scheme.id
                          ? 'ring-2 ring-purple-300 border-white bg-[#2A0E5C] text-white'
                          : 'border-purple-500/25 bg-[#13062B] text-slate-400 hover:border-purple-400/50 hover:text-slate-200'
                      }`}
                    >
                      <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: scheme.hex }} 
                      />
                      <span className="text-[11px]">{scheme.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="p-2.5 rounded-[4px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="fluent-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 rounded-[4px] cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4 text-[#190839]" />
                  <span>Tạo Danh Mục Mới</span>
                </button>
              </div>
            </form>
          </div>

          {/* Fluent Search Bar & Filter Tabs */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('ALL')}
                  className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-semibold transition cursor-pointer border ${
                    activeTab === 'ALL'
                      ? 'bg-purple-600/40 text-purple-100 border-purple-400/60 shadow-sm'
                      : 'bg-[#180838] text-slate-400 border-purple-500/20 hover:text-slate-200'
                  }`}
                >
                  Tất cả ({totalCategoriesCount})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('HAS_QUESTIONS')}
                  className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-semibold transition cursor-pointer border ${
                    activeTab === 'HAS_QUESTIONS'
                      ? 'bg-purple-600/40 text-purple-100 border-purple-400/60 shadow-sm'
                      : 'bg-[#180838] text-slate-400 border-purple-500/20 hover:text-slate-200'
                  }`}
                >
                  Có câu hỏi ({categoriesWithQuestionsCount})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('NO_QUESTIONS')}
                  className={`px-3 py-1.5 rounded-[4px] text-xs font-mono font-semibold transition cursor-pointer border ${
                    activeTab === 'NO_QUESTIONS'
                      ? 'bg-purple-600/40 text-purple-100 border-purple-400/60 shadow-sm'
                      : 'bg-[#180838] text-slate-400 border-purple-500/20 hover:text-slate-200'
                  }`}
                >
                  Trống ({emptyCategoriesCount})
                </button>

                {/* Smart Report Tab */}
                <button
                  type="button"
                  onClick={() => setActiveTab('SMART_REPORT')}
                  className={`px-3.5 py-1.5 rounded-[4px] text-xs font-mono font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                    activeTab === 'SMART_REPORT'
                      ? 'bg-gradient-to-r from-amber-500/40 via-yellow-500/30 to-amber-500/40 text-amber-200 border-amber-400/80 shadow-md shadow-amber-950/50'
                      : 'bg-[#201005]/80 text-amber-300/80 border-amber-500/30 hover:text-amber-200'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Báo Cáo Phân Loại (Smart Report)</span>
                  {smartReportData.orphanCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-rose-500/30 text-rose-300 border border-rose-400/40">
                      {smartReportData.orphanCount} mồ côi
                    </span>
                  )}
                </button>
              </div>


              {/* Live Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-purple-300" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên danh mục..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#12052B] border border-purple-500/30 rounded-[4px] text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List Header Info */}
            <div className="flex items-center justify-between text-xs text-[#B6A6D8] px-1">
              <span>Hiển thị {filteredCategories.length} / {totalCategoriesCount} danh mục</span>
              <span className="font-mono text-[11px]">Sắp xếp: Số lượng câu hỏi giảm dần</span>
            </div>
          </div>

          {/* Main View Area: Smart Analysis Report vs Categories Grid */}
          {activeTab === 'SMART_REPORT' ? (
            <div className="space-y-5 animate-fadeIn pt-1">
              {/* Report Header Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="fluent-card p-3.5 rounded-[4px] bg-[#1B083C] border border-purple-500/30 space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 block">Tổng số câu hỏi</span>
                  <strong className="text-xl font-bold text-white font-mono">{smartReportData.totalQuestions}</strong>
                  <span className="text-[10px] text-purple-300 block">Trong ngân hàng đề</span>
                </div>

                <div className="fluent-card p-3.5 rounded-[4px] bg-emerald-950/40 border border-emerald-500/30 space-y-1">
                  <span className="text-[11px] font-mono text-emerald-300 block">Tỷ lệ đã phân loại</span>
                  <strong className="text-xl font-bold text-emerald-300 font-mono">{smartReportData.categorizationRate}%</strong>
                  <span className="text-[10px] text-emerald-200/80 block">{smartReportData.categorizedCount} / {smartReportData.totalQuestions} câu có thư mục</span>
                </div>

                <div className="fluent-card p-3.5 rounded-[4px] bg-[#1F0E3A] border border-purple-500/30 space-y-1">
                  <span className="text-[11px] font-mono text-purple-300 block">Danh mục hoạt động</span>
                  <strong className="text-xl font-bold text-purple-200 font-mono">{smartReportData.activeCategoriesCount} / 67</strong>
                  <span className="text-[10px] text-slate-400 block">{smartReportData.emptyCategoriesCount} danh mục trống</span>
                </div>

                <div className={`fluent-card p-3.5 rounded-[4px] border space-y-1 ${
                  smartReportData.orphanCount > 0 
                    ? 'bg-rose-950/40 border-rose-500/40' 
                    : 'bg-emerald-950/30 border-emerald-500/30'
                }`}>
                  <span className={`text-[11px] font-mono block ${smartReportData.orphanCount > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                    Câu mồ côi (Chưa xếp)
                  </span>
                  <strong className={`text-xl font-bold font-mono ${smartReportData.orphanCount > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                    {smartReportData.orphanCount}
                  </strong>
                  <span className="text-[10px] text-slate-400 block">
                    {smartReportData.orphanCount > 0 ? 'Cần gán danh mục' : 'Hoàn hảo 100%'}
                  </span>
                </div>
              </div>

              {/* Section 1: Distribution Across All 67 BTI 2026 Categories */}
              <div className="fluent-card p-4 sm:p-5 rounded-[4px] bg-[#1A083A] border border-purple-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-amber-400" />
                    <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                      Phân Bổ Thống Kê Theo 67 Danh Mục BTI 2026
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Tự động xếp theo số câu giảm dần</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                  {smartReportData.distribution.map((item) => {
                    const scheme = getCategoryColorScheme(item.categoryName, item.color);
                    return (
                      <div 
                        key={item.id} 
                        className="p-3 rounded-[4px] bg-[#13052A] border border-purple-500/20 space-y-2 hover:border-purple-400/40 transition"
                      >
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-semibold text-slate-200 line-clamp-1 flex-1 pr-2">
                            {item.categoryName}
                          </span>
                          <span className="text-amber-300 font-bold shrink-0">
                            {item.count} câu <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                          </span>
                        </div>

                        {/* Progress Fill Bar */}
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-purple-500/20">
                          <div 
                            className="h-full transition-all duration-300"
                            style={{ 
                              width: `${Math.max(item.percentage, item.count > 0 ? 3 : 0)}%`,
                              backgroundColor: scheme.hex || '#a855f7'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Orphan & Unassigned Questions Inspection Box */}
              <div className="fluent-card p-4 sm:p-5 rounded-[4px] bg-[#1C083E] border border-amber-500/30 space-y-3.5">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-xs font-bold text-amber-200 font-mono uppercase tracking-wide">
                        Danh Sách Câu Hỏi Mồ Côi & Gợi Ý Gán Danh Mục ({smartReportData.orphanCount})
                      </h3>
                      <p className="text-[11.5px] text-slate-300 mt-0.5">
                        Các câu hỏi chưa thuộc 67 thư mục danh mục chính thức. Bạn có thể gán 1-click theo gợi ý bên dưới.
                      </p>
                    </div>
                  </div>
                </div>

                {smartReportData.orphanQuestions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-emerald-300 bg-emerald-950/20 rounded-[4px] border border-emerald-500/30 space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                    <strong className="block text-sm">Tuyệt vời! Không có câu hỏi mồ côi.</strong>
                    <p className="text-emerald-200/80">Tất cả câu hỏi trong ngân hàng đề đều đã được xếp vào các thư mục danh mục chuẩn.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                    {smartReportData.orphanQuestions.map((item, idx) => (
                      <div 
                        key={item.question.id || idx}
                        className="p-3.5 rounded-[4px] bg-[#120427] border border-amber-500/25 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-semibold text-slate-200 flex-1 line-clamp-2">
                            {item.question.question_text || 'Không có nội dung câu hỏi'}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                            Chưa xếp
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#1B0A3B] p-2.5 rounded-[3px] border border-purple-500/20">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300 font-bold">
                              <span>Gợi ý danh mục:</span>
                              <span>{item.suggestedCategory}</span>
                            </div>
                            <div className="text-[10.5px] text-slate-400 flex items-center gap-1">
                              <Info className="w-3 h-3 text-purple-400 shrink-0" />
                              <span>{item.reasoning}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAssignOrphanCategory(item.question.id, item.suggestedCategory)}
                            className="fluent-btn-primary px-3 py-1.5 text-[11px] font-mono font-bold flex items-center gap-1 rounded cursor-pointer shrink-0 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 hover:brightness-110"
                          >
                            <span>⚡ Gán danh mục này</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Categories Grid List */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredCategories.length === 0 ? (
                <div className="col-span-full p-8 text-center bg-[#180838]/50 border border-dashed border-purple-500/30 rounded-[4px]">
                  <Folder className="w-8 h-8 text-purple-400/50 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">
                    {searchQuery ? 'Không tìm thấy danh mục phù hợp từ khóa.' : 'Chưa có danh mục nào trong bộ lọc này.'}
                  </p>
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const isEditing = editingCategory?.id === cat.id;
                  const count = categoryUsageMap[cat.name] || 0;
                  const scheme = getCategoryColorScheme(cat.name, isEditing ? editColor : cat.color);

                  if (isEditing) {
                    return (
                      <div 
                        key={cat.id} 
                        className="col-span-full p-4 rounded-[4px] bg-[#1E0942] border-2 border-purple-400 space-y-3 shadow-xl animate-fadeIn"
                      >
                        <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
                          <span className="text-xs font-bold text-purple-200 font-mono">Đang chỉnh sửa: {cat.name}</span>
                          <span className="text-[11px] text-slate-400">{count} câu hỏi đang gán</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-slate-300 font-semibold mb-1">Tên danh mục</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-[#100424] border border-purple-500/30 rounded-[4px] text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-300 font-semibold mb-1">Mô tả danh mục</label>
                            <input
                              type="text"
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs bg-[#100424] border border-purple-500/30 rounded-[4px] text-white"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-400 font-semibold">Tông màu:</span>
                            {Object.values(CATEGORY_COLOR_SCHEMES).map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => setEditColor(s.id)}
                                className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                                  editColor === s.id ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                                }`}
                                style={{ backgroundColor: s.hex }}
                              />
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingCategory(null)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-[4px] border border-slate-700 cursor-pointer"
                            >
                              Hủy
                            </button>

                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="fluent-btn-primary px-3.5 py-1.5 text-xs font-bold flex items-center gap-1 rounded-[4px] cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 text-[#190839]" />
                            <span>Lưu Thay Đổi</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={cat.id}
                    className="p-3 rounded-[4px] bg-[#180838]/80 border border-purple-500/25 hover:border-purple-400/50 hover:bg-[#200A4A] transition flex flex-col justify-between gap-2.5 group shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`px-2.5 py-0.5 text-xs font-bold font-mono rounded-[4px] border ${scheme.badgeStyle} truncate max-w-full`}>
                            {cat.name}
                          </span>
                          {cat.isSystem && (
                            <span className="px-1.5 py-0.2 text-[9.5px] font-mono bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-[3px]">
                              Hệ thống
                            </span>
                          )}
                        </div>
                        <p className="text-[11.5px] text-[#B6A6D8] line-clamp-2 leading-relaxed">
                          {cat.description || <span className="italic text-slate-500 text-[11px]">Chưa có mô tả</span>}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-purple-500/20 rounded-[4px] transition cursor-pointer"
                          title="Chỉnh sửa danh mục"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeletingCategory(cat);
                            vibrateTap();
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-[4px] transition cursor-pointer"
                          title="Xóa danh mục"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-purple-500/15 text-[10.5px]">
                      <span className="font-mono text-slate-400 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-purple-400" />
                        <span>Sử dụng:</span>
                        <strong className={`font-bold ${count > 0 ? 'text-purple-300' : 'text-slate-500'}`}>
                          {count} câu hỏi
                        </strong>
                      </span>

                      <span className="text-[10px] text-slate-500 font-mono">
                        ID: {cat.id.slice(0, 12)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Fluent Footer */}
        <div className="px-5 py-3 border-t border-purple-500/20 bg-[#1A083B]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#B6A6D8] font-mono text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Tự động đồng bộ với 67 danh mục chuẩn BTI 2026.</span>
          </div>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              onClose();
            }}
            className="fluent-btn-secondary px-4 py-1.5 text-xs font-semibold rounded-[4px] cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>

        {/* Fluent Delete Confirmation Sub-Modal */}
        {deletingCategory && (
          <div className="absolute inset-0 z-20 bg-black/85 backdrop-blur-sm p-4 flex items-center justify-center animate-fadeIn">
            <div className="w-full max-w-md bg-[#160733] border border-rose-500/40 rounded-[4px] p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h4 className="text-sm font-bold text-white font-mono uppercase">
                  Xác Nhận Xóa Danh Mục
                </h4>
              </div>

              <p className="text-xs text-slate-200">
                Bạn sắp xóa danh mục <strong className="text-rose-300">"{deletingCategory.name}"</strong>.
              </p>

              {categoryUsageMap[deletingCategory.name] > 0 ? (
                <div className="space-y-2.5 bg-rose-950/20 border border-rose-500/30 p-3 rounded-[4px]">
                  <p className="text-xs text-rose-200">
                    Hiện có <strong className="font-bold underline">{categoryUsageMap[deletingCategory.name]} câu hỏi</strong> đang sử dụng danh mục này. Vui lòng chọn danh mục thay thế:
                  </p>

                  <select
                    value={reassignCategoryName}
                    onChange={(e) => setReassignCategoryName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[#100424] border border-rose-500/40 rounded-[4px] text-white"
                  >
                    <option value="Khác / Chưa phân loại">Khác / Chưa phân loại</option>
                    {categories
                      .filter(c => c.id !== deletingCategory.id)
                      .map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))
                    }
                  </select>
                </div>
              ) : (
                <p className="text-xs text-slate-300">
                  Danh mục này chưa được gán cho câu hỏi nào. Bạn có chắc chắn muốn xóa không?
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-[4px] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-[4px] shadow-lg shadow-rose-900/40 cursor-pointer"
                >
                  Xác Nhận Xóa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Smart Categorization Summary Result Modal */}
        {organizeSummary && (
          <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md p-4 flex items-center justify-center animate-fadeIn">
            <div className="w-full max-w-2xl bg-[#150730] border border-amber-500/40 rounded-[4px] p-5 shadow-2xl flex flex-col max-h-[88vh] space-y-4">
              
              <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-[4px] bg-amber-500/20 border border-amber-400/40 text-amber-300">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white font-mono uppercase tracking-tight">
                      Kết Quả Phân Loại Thông Minh
                    </h4>
                    <p className="text-xs text-amber-200/90 mt-0.5">
                      Đã hoàn tất tự động xếp câu hỏi vào các thư mục tương ứng theo từ khóa BTI 2026.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOrganizeSummary(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-[4px] hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#1C0A3B] border border-amber-500/20 rounded-[4px] text-center">
                  <span className="text-[11px] text-slate-400 font-mono block">Tổng xử lý</span>
                  <strong className="text-lg font-bold text-white font-mono">{organizeSummary.totalProcessed}</strong>
                </div>

                <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-[4px] text-center">
                  <span className="text-[11px] text-emerald-300 font-mono block">Đã xếp danh mục</span>
                  <strong className="text-lg font-bold text-emerald-300 font-mono">{organizeSummary.totalCategorized}</strong>
                </div>

                <div className="p-3 bg-slate-900/60 border border-slate-700/50 rounded-[4px] text-center">
                  <span className="text-[11px] text-slate-400 font-mono block">Giữ nguyên</span>
                  <strong className="text-lg font-bold text-slate-300 font-mono">{organizeSummary.totalUnchanged}</strong>
                </div>
              </div>

              {/* Distribution breakdown */}
              {Object.keys(organizeSummary.categoryBreakdown).length > 0 && (
                <div className="space-y-2 bg-[#1A083A] p-3 rounded-[4px] border border-purple-500/20">
                  <span className="text-xs font-bold text-purple-200 font-mono block">
                    Phân bổ vào các thư mục danh mục:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(organizeSummary.categoryBreakdown).map(([catName, count]) => (
                      <span 
                        key={catName} 
                        className="px-2.5 py-1 text-xs font-mono font-semibold bg-purple-600/30 border border-purple-400/40 text-purple-200 rounded-[4px] flex items-center gap-1.5"
                      >
                        <span>{catName}:</span>
                        <strong className="text-white">{count} câu</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed list of categorization changes */}
              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                <span className="text-xs font-bold text-slate-300 font-mono block">
                  Chi tiết các câu hỏi vừa được cập nhật ({organizeSummary.details.length}):
                </span>

                {organizeSummary.details.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 bg-[#160733] rounded-[4px] border border-purple-500/20">
                    Tất cả các câu hỏi đã thuộc đúng danh mục hoặc chưa phát hiện thay đổi mới.
                  </div>
                ) : (
                  organizeSummary.details.map((item, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-[4px] bg-[#1B083C] border border-purple-500/25 space-y-1.5 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-200 line-clamp-1 flex-1">
                          {item.questionText}
                        </span>
                        <span className={`px-1.5 py-0.2 text-[9.5px] font-mono font-bold rounded-[3px] border shrink-0 ${
                          item.confidence === 'HIGH' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          item.confidence === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                          'bg-slate-700/50 text-slate-300 border-slate-600'
                        }`}>
                          {item.confidence === 'HIGH' ? 'ĐỘ CHÍNH XÁC CAO' : item.confidence === 'MEDIUM' ? 'ĐỘ CHÍNH XÁC TRUNG BÌNH' : 'THẤP'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-slate-400 line-through">{item.oldCategory}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-amber-300 font-bold">{item.newCategory}</span>
                      </div>

                      <div className="text-[10.5px] text-slate-400 flex items-center gap-1.5">
                        <Info className="w-3 h-3 text-purple-400 shrink-0" />
                        <span>{item.reasoning}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-purple-500/20">
                <button
                  type="button"
                  onClick={() => setOrganizeSummary(null)}
                  className="fluent-btn-primary px-5 py-2 text-xs font-mono font-bold rounded-[4px] cursor-pointer"
                >
                  Hoàn Tất & Đóng
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
