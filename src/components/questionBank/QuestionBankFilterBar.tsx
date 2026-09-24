import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  X, 
  Filter, 
  RotateCcw, 
  Sparkles, 
  Tag, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  Clock, 
  FileEdit,
  Zap,
  Target,
  Scale,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  History,
  HelpCircle,
  Hash,
  BookOpen,
  Lock,
  Key,
  Database,
  ShieldAlert,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';
import { getTagColorScheme } from '../../utils/tagColorUtils';
import { getCategoryColorScheme } from '../../utils/categoryColorUtils';
import { 
  QuestionItem, 
  CognitiveLevel, 
  DigitalCompetencyDomainKey, 
  ApprovalStatus,
  CompetitionStage,
  QuestionRoundFormat,
  CustomCategory
} from '../../types';
import { 
  DIGITAL_COMPETENCY_DOMAINS, 
  COGNITIVE_LEVELS, 
  COMPETITION_STAGES,
  BTI_ROUND_GROUPS,
  BtiRoundGroupKey,
  getActiveFormatsForRoundGroup
} from '../../data/digitalCompetencyData';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap } from '../../utils/hapticUtils';
import { questionBankManager } from '../../services/questionBankManager';
import { 
  searchHistoryService, 
  POPULAR_SEARCH_PRESETS,
  parseSearchQuery 
} from '../../services/fullTextSearchService';
import { DifficultyQuickToggleBar } from './DifficultyBadgeAndMeter';
import { FolderPlus, Folder } from 'lucide-react';
import { BtiCompetencyMatrixFilterBar, MatrixStatusFilterType } from './BtiCompetencyMatrixFilterBar';

interface QuestionBankFilterBarProps {
  questions: QuestionItem[];
  filteredCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;

  // Filters
  filterRoundGroup: BtiRoundGroupKey | 'ALL';
  onRoundGroupChange: (grp: BtiRoundGroupKey | 'ALL') => void;

  filterLevel: string; // Difficulty / Cognitive Level ('ALL' | CognitiveLevel)
  onLevelChange: (lvl: string) => void;

  filterTopic: string; // Category / Topic
  onTopicChange: (topic: string) => void;
  onManageCategoriesClick?: () => void;

  filterTag?: string; // Custom Tag
  onTagChange?: (tag: string) => void;

  selectedTags?: string[]; // Multi-select tags
  onTagsChange?: (tags: string[]) => void;
  tagMatchMode?: 'OR' | 'AND';
  onTagMatchModeChange?: (mode: 'OR' | 'AND') => void;
  onManageTagsClick?: () => void;

  filterStatus: string; // Approval Status ('ALL' | ApprovalStatus)
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  onStatusChange: (st: string) => void;

  filterDomain: string; // Digital Competency Domain
  onDomainChange: (dom: string) => void;

  filterSubCompetency?: string; // Digital Sub-Competency (1.1 - 6.3)
  onSubCompetencyChange?: (sub: string) => void;

  filterMatrixStatus?: MatrixStatusFilterType; // Matrix Coverage Status
  onMatrixStatusChange?: (st: MatrixStatusFilterType) => void;

  onOpenAddQuestionForSlot?: (domainKey: DigitalCompetencyDomainKey, level: CognitiveLevel, subCode?: string) => void;
  onNavigateToFullMatrix?: () => void;

  filterStage: string; // Competition Stage
  onStageChange: (stage: string) => void;

  onResetAllFilters: () => void;
}

export const QuestionBankFilterBar: React.FC<QuestionBankFilterBarProps> = ({
  questions,
  filteredCount,
  searchQuery,
  onSearchChange,
  searchInputRef,
  filterRoundGroup,
  onRoundGroupChange,
  filterLevel,
  onLevelChange,
  filterTopic,
  onTopicChange,
  onManageCategoriesClick,
  filterTag = 'ALL',
  onTagChange,
  selectedTags = [],
  onTagsChange,
  tagMatchMode = 'OR',
  onTagMatchModeChange,
  onManageTagsClick,
  filterStatus,
  onStatusChange,
  sortBy = 'NEWEST',
  onSortChange,
  filterDomain,
  onDomainChange,
  filterSubCompetency = 'ALL',
  onSubCompetencyChange,
  filterMatrixStatus = 'ALL',
  onMatrixStatusChange,
  onOpenAddQuestionForSlot,
  onNavigateToFullMatrix,
  filterStage,
  onStageChange,
  onResetAllFilters
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isMatrixFilterOpen, setIsMatrixFilterOpen] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSyntaxGuide, setShowSyntaxGuide] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Compact / Shortened view states for Category and Tag bars
  const [hideEmptyCategories, setHideEmptyCategories] = useState(true);
  const [hideEmptyTags, setHideEmptyTags] = useState(true);
  const [isCategoriesCollapsed, setIsCategoriesCollapsed] = useState(false);
  const [isTagsCollapsed, setIsTagsCollapsed] = useState(false);

  // Active tags array combining multi-select or single filterTag
  const activeTagsList = useMemo(() => {
    if (selectedTags && selectedTags.length > 0) return selectedTags;
    if (filterTag && filterTag !== 'ALL') return [filterTag];
    return [];
  }, [selectedTags, filterTag]);

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(searchHistoryService.getHistory());
  }, []);

  // Save to history when search is submitted / debounced
  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      const timer = setTimeout(() => {
        const updated = searchHistoryService.addQuery(searchQuery.trim());
        setSearchHistory(updated);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  // Handle outside click for search suggestions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
        setShowSyntaxGuide(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchInputRef]);

  // Custom categories list from QuestionBankManager
  const customCategories = useMemo(() => {
    return questionBankManager.getCustomCategories();
  }, []);

  // Compute category list with question counts
  const categoryListWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach(q => {
      if (q.category && q.category.trim()) {
        const catName = q.category.trim();
        counts[catName] = (counts[catName] || 0) + 1;
      }
    });

    const definedNames = new Set(customCategories.map(c => c.name));
    const result = customCategories.map(c => ({
      name: c.name,
      color: c.color || 'purple',
      count: counts[c.name] || 0,
      description: c.description
    }));

    // Add legacy or untracked categories
    Object.keys(counts).forEach(catName => {
      if (!definedNames.has(catName)) {
        result.push({
          name: catName,
          color: 'purple',
          count: counts[catName],
          description: undefined
        });
      }
    });

    return result;
  }, [questions, customCategories]);

  // Available topics/categories
  const availableTopics = useMemo(() => {
    return categoryListWithCounts.map(c => c.name);
  }, [categoryListWithCounts]);

  // Available tags in system
  const availableTags = useMemo(() => {
    const set = new Set<string>(questionBankManager.getCustomTags());
    questions.forEach(q => {
      if (q.tags && Array.isArray(q.tags)) {
        q.tags.forEach(t => set.add(t));
      }
    });
    return Array.from(set).filter(Boolean);
  }, [questions]);

  // Question count per tag
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach(q => {
      if (q.tags && Array.isArray(q.tags)) {
        q.tags.forEach(t => {
          counts[t] = (counts[t] || 0) + 1;
        });
      }
    });
    return counts;
  }, [questions]);

  // Filter categories list based on hideEmptyCategories
  const displayedCategories = useMemo(() => {
    if (!hideEmptyCategories) return categoryListWithCounts;
    return categoryListWithCounts.filter(cat => cat.count > 0 || filterTopic === cat.name);
  }, [categoryListWithCounts, hideEmptyCategories, filterTopic]);

  // Filter tags list based on hideEmptyTags
  const displayedTags = useMemo(() => {
    if (!hideEmptyTags) return availableTags;
    return availableTags.filter(tag => (tagCounts[tag] || 0) > 0 || activeTagsList.includes(tag));
  }, [availableTags, hideEmptyTags, tagCounts, activeTagsList]);

  // Parse current search query for active badge details
  const parsedSearch = useMemo(() => {
    return parseSearchQuery(searchQuery);
  }, [searchQuery]);

  // Check if any filter is currently active
  const hasActiveFilters = 
    searchQuery.trim() !== '' ||
    filterRoundGroup !== 'ALL' ||
    filterLevel !== 'ALL' ||
    filterTopic !== 'ALL' ||
    activeTagsList.length > 0 ||
    filterStatus !== 'ALL' ||
    filterDomain !== 'ALL' ||
    filterSubCompetency !== 'ALL' ||
    filterMatrixStatus !== 'ALL' ||
    filterStage !== 'ALL';

  // Count active advanced filters (beyond primary search & round)
  const activeAdvancedCount = 
    (filterTopic !== 'ALL' ? 1 : 0) +
    (filterTag !== 'ALL' ? 1 : 0) +
    (filterDomain !== 'ALL' ? 1 : 0) +
    (filterStage !== 'ALL' ? 1 : 0) +
    (sortBy !== 'NEWEST' && sortBy !== 'RELEVANCE' ? 1 : 0);

  const handleSelectPreset = (presetQuery: string) => {
    vibrateTap();
    soundFx.playClick();
    onSearchChange(presetQuery);
    setIsSearchFocused(false);
    setShowSyntaxGuide(false);
    const updated = searchHistoryService.addQuery(presetQuery);
    setSearchHistory(updated);
  };

  const handleRemoveHistory = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const updated = searchHistoryService.removeQuery(item);
    setSearchHistory(updated);
  };

  const handleClearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    searchHistoryService.clearHistory();
    setSearchHistory([]);
  };

  return (
    <div className="fluent-card p-2.5 sm:p-3 space-y-2.5 bg-[#190839]/90 border border-theme-accent/25 shadow-md relative z-30">
      {/* 1. Quick Round Selection Chips (Filter Within Round) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs font-mono scrollbar-thin flex-1">
          <span className="text-[#B6A6D8] font-bold shrink-0 mr-1 flex items-center gap-1 text-[11px]">
            <Layers className="w-3.5 h-3.5 text-theme-accent" />
            <span>Vòng thi:</span>
          </span>

          <button
            type="button"
            onClick={() => {
              vibrateTap();
              soundFx.playClick();
              onRoundGroupChange('ALL');
            }}
            className={`px-2 py-0.5 rounded-[4px] text-[11px] font-bold border transition cursor-pointer shrink-0 ${
              filterRoundGroup === 'ALL'
                ? 'bg-theme-accent text-[#190839] border-theme-accent shadow-sm'
                : 'bg-[#241148] text-slate-300 border-white/10 hover:bg-white/5 hover:text-white'
            }`}
          >
            Tất cả ({questions.length})
          </button>

          {Object.values(BTI_ROUND_GROUPS).map(grp => {
            const isSelected = filterRoundGroup === grp.key;
            return (
              <button
                key={grp.key}
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  onRoundGroupChange(isSelected ? 'ALL' : grp.key);
                }}
                className={`px-2 py-0.5 rounded-[4px] text-[11px] font-bold border transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  isSelected
                    ? 'bg-theme-accent text-[#190839] border-theme-accent shadow-sm'
                    : 'bg-[#241148] text-slate-300 border-white/10 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{grp.name}</span>
              </button>
            );
          })}
        </div>

        {/* Toggle BTI Competency Matrix Filter Bar */}
        <button
          type="button"
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            setIsMatrixFilterOpen(prev => !prev);
          }}
          className={`px-2.5 py-1 rounded-[4px] text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 border ${
            isMatrixFilterOpen || filterDomain !== 'ALL' || filterMatrixStatus !== 'ALL' || filterSubCompetency !== 'ALL'
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-bold'
              : 'bg-[#241148] text-amber-300 border-amber-400/30 hover:text-white hover:bg-white/10'
          }`}
          title="Bật/Tắt Bộ Lọc Ma Trận Độ Phủ Khung Năng Lực BTI 2026 (TT 02/2025/TT-BGDĐT)"
        >
          <Target className="w-3.5 h-3.5" />
          <span className="hidden xs:inline sm:inline">Ma Trận BTI</span>
          {(filterDomain !== 'ALL' || filterMatrixStatus !== 'ALL' || filterSubCompetency !== 'ALL') && (
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse" />
          )}
          {isMatrixFilterOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Toggle Advanced Filters Button */}
        <button
          type="button"
          onClick={() => {
            vibrateTap();
            soundFx.playClick();
            setIsAdvancedOpen(!isAdvancedOpen);
          }}
          className={`px-2.5 py-1 rounded-[4px] text-[11px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 border ${
            isAdvancedOpen || activeAdvancedCount > 0
              ? 'bg-theme-accent/20 text-theme-accent border-theme-accent/40 shadow-sm'
              : 'bg-[#241148] text-slate-300 border-white/10 hover:text-white hover:bg-white/10'
          }`}
          title={isAdvancedOpen ? 'Thu gọn bộ lọc nâng cao' : 'Mở rộng thêm bộ lọc chủ đề, nhãn, miền năng lực, sắp xếp'}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isAdvancedOpen ? 'Thu gọn lọc' : 'Lọc nâng cao'}</span>
          {activeAdvancedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-theme-accent text-[#190839] text-[9px] font-black">
              {activeAdvancedCount}
            </span>
          )}
          {isAdvancedOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* 2. Primary Full-Text Search & Filter Line */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        {/* Full-Text Search Bar - 6 columns */}
        <div className="relative sm:col-span-6 lg:col-span-6 z-40">
          <div className="relative flex items-center">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
              isSearchFocused || searchQuery ? 'text-theme-accent' : 'text-slate-400'
            }`} />
            
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm toàn văn: từ khóa, #nhãn, nội dung, đáp án, căn cứ luật... (/)"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setIsSearchFocused(false);
                  setShowSyntaxGuide(false);
                } else if (e.key === 'Enter') {
                  setIsSearchFocused(false);
                  setShowSyntaxGuide(false);
                  if (searchQuery.trim()) {
                    const updated = searchHistoryService.addQuery(searchQuery.trim());
                    setSearchHistory(updated);
                  }
                }
              }}
              onChange={e => {
                onSearchChange(e.target.value);
                if (onSortChange && e.target.value.trim() && sortBy === 'NEWEST') {
                  onSortChange('RELEVANCE');
                }
              }}
              className="w-full fluent-input pl-8 pr-16 py-1.5 text-xs placeholder-slate-400 bg-[#14062E] border-theme-accent/30 focus:border-theme-accent text-white rounded-[4px] transition-all"
            />

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onSearchChange('');
                    if (onSortChange && sortBy === 'RELEVANCE') {
                      onSortChange('NEWEST');
                    }
                  }}
                  className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer transition"
                  title="Xóa tìm kiếm (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Syntax Help Toggle */}
              <button
                type="button"
                onClick={() => setShowSyntaxGuide(!showSyntaxGuide)}
                className={`p-1 rounded text-[10px] transition cursor-pointer ${
                  showSyntaxGuide ? 'text-theme-accent bg-theme-accent/20' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Cú pháp tìm kiếm nâng cao (#nhãn, 'cụm từ', mien:4, -loại-trừ)"
              >
                <HelpCircle className="w-3 h-3" />
              </button>

              <kbd className="hidden sm:inline-block text-[9px] font-mono px-1 py-0.2 rounded bg-white/10 text-white/50 border border-white/10 pointer-events-none">
                /
              </kbd>
            </div>
          </div>

          {/* Search Dropdown / Autocomplete / History / Syntax Guide */}
          {(isSearchFocused || showSyntaxGuide) && (
            <div 
              ref={dropdownRef}
              className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#190839] border border-theme-accent/40 rounded-[6px] shadow-2xl p-3 space-y-3 text-xs animate-in fade-in duration-150 backdrop-blur-md max-h-[60vh] overflow-y-auto scrollbar-thin"
            >
              {/* SYNTAX GUIDE CHEATSHEET */}
              {showSyntaxGuide && (
                <div className="p-2.5 rounded-[4px] bg-[#241148] border border-theme-accent/30 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-theme-accent font-bold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Cú pháp Tìm Kiếm Toàn Văn Nâng Cao:</span>
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setShowSyntaxGuide(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px] font-mono text-slate-300">
                    <div><span className="text-amber-300">"an ninh mạng"</span> : Khớp chính xác cụm từ</div>
                    <div><span className="text-sky-300">#chinh-thuc</span> hoặc <span className="text-sky-300">tag:ai</span> : Lọc theo nhãn</div>
                    <div><span className="text-emerald-300">mien:4</span> : Miền NL An toàn &amp; Bảo mật</div>
                    <div><span className="text-purple-300">level:nhan_biet</span> : Lọc mức độ nhận thức</div>
                    <div><span className="text-rose-300">-phishing</span> : Loại trừ từ khóa</div>
                    <div><span className="text-fuchsia-300">id:KD_01</span> : Tìm chính xác mã câu hỏi</div>
                  </div>
                </div>
              )}

              {/* POPULAR PRESET KEYWORDS */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#B6A6D8] mb-1.5 font-bold">
                  <span className="flex items-center gap-1 text-theme-accent">
                    <Sparkles className="w-3 h-3" />
                    <span>Từ khóa tìm nhanh phổ biến:</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCH_PRESETS.map(preset => (
                    <button
                      key={preset.query}
                      type="button"
                      onClick={() => handleSelectPreset(preset.query)}
                      className="px-2 py-0.5 rounded-[4px] bg-[#241148] hover:bg-theme-accent/20 hover:text-theme-accent border border-white/10 hover:border-theme-accent/40 text-slate-200 text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
                    >
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* QUICK TAG FILTER CHIPS */}
              {availableTags.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#B6A6D8] mb-1.5 font-bold">
                    <span className="flex items-center gap-1 text-sky-400">
                      <Hash className="w-3 h-3" />
                      <span>Nhãn phân loại (Tags):</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
                    {availableTags.slice(0, 12).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleSelectPreset(`#${tag}`)}
                        className="px-2 py-0.5 rounded-[4px] bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 border border-sky-500/30 text-[10.5px] font-mono transition cursor-pointer flex items-center gap-1"
                      >
                        <span>#{tag}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* RECENT SEARCH HISTORY */}
              {searchHistory.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#B6A6D8] mb-1.5 font-bold">
                    <span className="flex items-center gap-1">
                      <History className="w-3 h-3 text-slate-400" />
                      <span>Lịch sử tìm kiếm gần đây:</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleClearAllHistory}
                      className="text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      Xóa lịch sử
                    </button>
                  </div>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {searchHistory.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectPreset(item)}
                        className="flex items-center justify-between px-2 py-1 rounded-[4px] hover:bg-[#241148] text-slate-300 hover:text-white cursor-pointer group transition text-xs font-mono"
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <Search className="w-3 h-3 text-slate-500 group-hover:text-theme-accent" />
                          <span>{item}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveHistory(e, item)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 transition"
                          title="Xóa mục này"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Difficulty / Cognitive Level Filter - 3 columns */}
        <div className="sm:col-span-3 lg:col-span-3">
          <select
            value={filterLevel}
            onChange={e => onLevelChange(e.target.value)}
            className="w-full fluent-input px-2 py-1.5 text-xs bg-[#14062E] border-theme-accent/25 text-amber-300 font-medium rounded-[4px]"
            title="Lọc theo mức độ nhận thức / độ khó câu hỏi"
          >
            <option value="ALL" className="bg-[#190839] text-slate-300">🎯 Mức độ: Tất cả</option>
            {Object.values(COGNITIVE_LEVELS).map(lvl => (
              <option key={lvl.level} value={lvl.level} className="bg-[#190839] text-amber-300">
                {lvl.name} ({lvl.levelsRange})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter - 3 columns */}
        <div className="sm:col-span-3 lg:col-span-3">
          <select
            value={filterStatus}
            onChange={e => onStatusChange(e.target.value)}
            className="w-full fluent-input px-2 py-1.5 text-xs bg-[#14062E] border-theme-accent/25 text-emerald-300 font-medium rounded-[4px]"
            title="Lọc theo trạng thái phê duyệt"
          >
            <option value="ALL" className="bg-[#190839] text-slate-300">🛡️ Trạng thái: Tất cả</option>
            <option value="APPROVED" className="bg-[#190839] text-emerald-400">✓ Đã Phê Duyệt</option>
            <option value="PENDING_REVIEW" className="bg-[#190839] text-amber-400">• Chờ Thẩm Định</option>
            <option value="REJECTED" className="bg-[#190839] text-rose-400">✗ Từ Chối / Cần Sửa</option>
            <option value="DRAFT" className="bg-[#190839] text-slate-400">✎ Bản Thảo</option>
          </select>
        </div>
      </div>

      {/* 2.4. Dedicated BTI Competency Matrix Filter Bar */}
      {isMatrixFilterOpen && (
        <BtiCompetencyMatrixFilterBar
          questions={questions}
          filteredCount={filteredCount}
          filterDomain={filterDomain}
          onDomainChange={onDomainChange}
          filterSubCompetency={filterSubCompetency}
          onSubCompetencyChange={onSubCompetencyChange || (() => {})}
          filterLevel={filterLevel}
          onLevelChange={onLevelChange}
          filterMatrixStatus={filterMatrixStatus}
          onMatrixStatusChange={onMatrixStatusChange || (() => {})}
          onOpenAddQuestionForSlot={onOpenAddQuestionForSlot}
          onNavigateToFullMatrix={onNavigateToFullMatrix}
        />
      )}

      {/* 2.5. Dedicated Quick-Toggle Difficulty Filter Bar */}
      <DifficultyQuickToggleBar
        filterLevel={filterLevel}
        onLevelChange={onLevelChange}
        questions={questions}
      />

      {/* 2.5.5. Primary Custom Category Filter Bar with Quick Pills */}
      {categoryListWithCounts.length > 0 && (
        <div className="bg-[#14062E] border border-purple-500/30 rounded-[4px] p-2.5 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-purple-300 font-bold font-mono uppercase text-[11px]">
                <Folder className="w-3.5 h-3.5 text-purple-400" />
                <span>Danh Mục BTI ({displayedCategories.length}/{categoryListWithCounts.length})</span>
              </div>

              {filterTopic !== 'ALL' && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[10.5px] font-bold font-mono flex items-center gap-1">
                  Đang lọc: {filterTopic}
                  <button
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      soundFx.playClick();
                      onTopicChange('ALL');
                    }}
                    className="hover:text-rose-300 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle Hide Zero-Count Categories */}
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setHideEmptyCategories(prev => !prev);
                }}
                className={`text-[10.5px] px-2 py-0.5 rounded font-mono transition cursor-pointer flex items-center gap-1 border ${
                  hideEmptyCategories
                    ? 'bg-purple-600/30 text-purple-200 border-purple-400/40 hover:bg-purple-600/50'
                    : 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                }`}
                title="Lọc ẩn bớt các danh mục chưa có câu hỏi (count = 0) để rút gọn danh sách"
              >
                <span>{hideEmptyCategories ? '✓ Đã rút gọn (>0)' : 'Chưa rút gọn (Tất cả)'}</span>
              </button>

              {/* Collapse/Expand Toggle */}
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setIsCategoriesCollapsed(prev => !prev);
                }}
                className="text-[10.5px] text-purple-300 hover:text-white bg-purple-500/20 hover:bg-purple-500/35 px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1 border border-purple-500/40 font-mono"
                title={isCategoriesCollapsed ? 'Mở rộng khung danh mục' : 'Rút gọn khung danh mục'}
              >
                {isCategoriesCollapsed ? (
                  <>
                    <ChevronDown className="w-3 h-3 text-purple-300" />
                    <span>Mở rộng</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-3 h-3 text-purple-300" />
                    <span>Thu gọn</span>
                  </>
                )}
              </button>

              {/* Manage Categories Button */}
              {onManageCategoriesClick && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onManageCategoriesClick();
                  }}
                  className="text-[10.5px] text-purple-200 hover:text-white bg-purple-600/25 hover:bg-purple-600/45 px-2.5 py-0.5 rounded transition cursor-pointer flex items-center gap-1.5 border border-purple-400/40 font-medium shadow-sm active:scale-95"
                  title="Mở trình quản lý danh mục câu hỏi (Custom Categories Manager)"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-purple-300" />
                  <span>Quản lý Danh mục</span>
                </button>
              )}
            </div>
          </div>

          {/* Color-coded Category Pills List */}
          <div className={`flex items-center gap-1.5 flex-wrap overflow-y-auto custom-scrollbar pt-0.5 transition-all duration-200 ${
            isCategoriesCollapsed ? 'max-h-[38px] overflow-hidden' : 'max-h-[110px]'
          }`}>
            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                onTopicChange('ALL');
              }}
              className={`px-2.5 py-1 rounded-[4px] text-xs transition cursor-pointer flex items-center gap-1.5 border select-none ${
                filterTopic === 'ALL'
                  ? 'bg-purple-600 text-white font-bold border-purple-400 shadow-sm'
                  : 'bg-slate-900/60 text-slate-300 border-slate-700/60 hover:bg-slate-800'
              }`}
            >
              <span>Tất cả danh mục</span>
              <span className="text-[10px] font-mono px-1 bg-black/30 rounded-full text-slate-300">
                {questions.length}
              </span>
            </button>

            {displayedCategories.map(cat => {
              const isSelected = filterTopic === cat.name;
              const scheme = getCategoryColorScheme(cat.name, cat.color);

              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onTopicChange(isSelected ? 'ALL' : cat.name);
                  }}
                  className={`px-2.5 py-1 rounded-[4px] text-xs transition cursor-pointer flex items-center gap-1.5 border select-none ${
                    isSelected
                      ? `${scheme.badgeStyle} ring-2 ring-purple-400 font-bold shadow-md`
                      : `${scheme.badgeStyle} hover:scale-[1.02] opacity-80 hover:opacity-100`
                  }`}
                  title={cat.description || cat.name}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
                    style={{ backgroundColor: scheme.hex }}
                  />
                  <span className="font-medium">{cat.name}</span>
                  <span className={`text-[10px] font-mono px-1 rounded-full ${isSelected ? 'bg-black/40 text-white' : 'bg-black/20 text-slate-300'}`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2.6. Smart Tagging Multi-Select Bar with Color-coded Tags */}
      {availableTags.length > 0 && (
        <div className="bg-[#14062E] border border-theme-accent/25 rounded-[4px] p-2.5 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-purple-300 font-bold font-mono uppercase text-[11px]">
                <Tag className="w-3.5 h-3.5 text-purple-400" />
                <span>Thẻ Phân Loại Smart Tags ({displayedTags.length}/{availableTags.length})</span>
              </div>

              {activeTagsList.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[10.5px] font-bold font-mono">
                  Đang chọn {activeTagsList.length} nhãn
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle Hide Zero-Count Tags */}
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setHideEmptyTags(prev => !prev);
                }}
                className={`text-[10.5px] px-2 py-0.5 rounded font-mono transition cursor-pointer flex items-center gap-1 border ${
                  hideEmptyTags
                    ? 'bg-purple-600/30 text-purple-200 border-purple-400/40 hover:bg-purple-600/50'
                    : 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                }`}
                title="Lọc ẩn bớt các nhãn chưa có câu hỏi (count = 0) để rút gọn danh sách"
              >
                <span>{hideEmptyTags ? '✓ Đã rút gọn (>0)' : 'Chưa rút gọn (Tất cả)'}</span>
              </button>

              {/* Collapse/Expand Toggle */}
              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setIsTagsCollapsed(prev => !prev);
                }}
                className="text-[10.5px] text-purple-300 hover:text-white bg-purple-500/20 hover:bg-purple-500/35 px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1 border border-purple-500/40 font-mono"
                title={isTagsCollapsed ? 'Mở rộng khung nhãn' : 'Rút gọn khung nhãn'}
              >
                {isTagsCollapsed ? (
                  <>
                    <ChevronDown className="w-3 h-3 text-purple-300" />
                    <span>Mở rộng</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-3 h-3 text-purple-300" />
                    <span>Thu gọn</span>
                  </>
                )}
              </button>

              {/* Match Mode Toggle: OR vs AND */}
              {activeTagsList.length > 1 && onTagMatchModeChange && (
                <div className="flex items-center bg-[#190839] p-0.5 rounded border border-white/10 text-[10.5px]">
                  <button
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      soundFx.playClick();
                      onTagMatchModeChange('OR');
                    }}
                    className={`px-2 py-0.5 rounded cursor-pointer font-mono transition ${
                      tagMatchMode === 'OR'
                        ? 'bg-purple-600 text-white font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Khớp câu hỏi có ít nhất 1 trong các nhãn đã chọn (Hoặc)"
                  >
                    Hoặc (OR)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      soundFx.playClick();
                      onTagMatchModeChange('AND');
                    }}
                    className={`px-2 py-0.5 rounded cursor-pointer font-mono transition ${
                      tagMatchMode === 'AND'
                        ? 'bg-purple-600 text-white font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Khớp câu hỏi phải có đồng thời TẤT CẢ các nhãn đã chọn (Và)"
                  >
                    Và (AND)
                  </button>
                </div>
              )}

              {/* Clear selected tags */}
              {activeTagsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    if (onTagsChange) onTagsChange([]);
                    if (onTagChange) onTagChange('ALL');
                  }}
                  className="text-[10.5px] text-rose-300 hover:text-rose-200 bg-rose-500/20 hover:bg-rose-500/30 px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1 border border-rose-500/30"
                >
                  <X className="w-3 h-3" />
                  <span>Bỏ chọn nhãn</span>
                </button>
              )}

              {/* Manage Tags Button */}
              {onManageTagsClick && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onManageTagsClick();
                  }}
                  className="text-[10.5px] text-purple-300 hover:text-white bg-purple-500/20 hover:bg-purple-500/35 px-2.5 py-0.5 rounded transition cursor-pointer flex items-center gap-1 border border-purple-500/40"
                  title="Mở trình quản lý và tùy chỉnh màu sắc thẻ / nhãn"
                >
                  <Tag className="w-3 h-3 text-purple-400" />
                  <span className="hidden sm:inline">Quản lý nhãn</span>
                </button>
              )}
            </div>
          </div>

          {/* Color-coded Tag Pills list */}
          <div className={`flex items-center gap-1.5 flex-wrap overflow-y-auto custom-scrollbar pt-0.5 transition-all duration-200 ${
            isTagsCollapsed ? 'max-h-[38px] overflow-hidden' : 'max-h-[110px]'
          }`}>
            {displayedTags.map(tag => {
              const isSelected = activeTagsList.includes(tag);
              const scheme = getTagColorScheme(tag);
              const count = tagCounts[tag] || 0;

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    if (onTagsChange) {
                      if (isSelected) {
                        onTagsChange(activeTagsList.filter(t => t !== tag));
                      } else {
                        onTagsChange([...activeTagsList, tag]);
                      }
                    } else if (onTagChange) {
                      onTagChange(isSelected ? 'ALL' : tag);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-[4px] text-xs transition cursor-pointer flex items-center gap-1.5 border select-none ${
                    isSelected
                      ? scheme.activeClass
                      : `${scheme.badgeStyle} hover:scale-[1.02]`
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
                    style={{ backgroundColor: scheme.hex }}
                  />
                  <span className="font-medium">{tag}</span>
                  <span className={`text-[10px] font-mono px-1 rounded-full ${isSelected ? 'bg-black/30 text-white' : 'bg-black/20 text-slate-300'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Collapsible Advanced Filters Grid */}
      {isAdvancedOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-white/10 animate-fadeIn">
          {/* Topic / Category Filter */}
          <div>
            <select
              value={filterTopic}
              onChange={e => onTopicChange(e.target.value)}
              className="w-full fluent-input px-2 py-1.5 text-xs bg-[#14062E] border-theme-accent/25 text-purple-300 font-medium rounded-[4px]"
              title="Lọc theo chủ đề / danh mục nội dung"
            >
              <option value="ALL" className="bg-[#190839] text-slate-300">🏷️ Chủ đề: Tất cả chủ đề</option>
              {availableTopics.map(topic => (
                <option key={topic} value={topic} className="bg-[#190839] text-purple-200">
                  {topic}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Tags Filter */}
          {onTagChange && (
            <div>
              <select
                value={filterTag}
                onChange={e => onTagChange(e.target.value)}
                className="w-full fluent-input px-2 py-1.5 text-xs bg-[#14062E] border-theme-accent/25 text-sky-300 font-medium rounded-[4px]"
                title="Lọc theo nhãn phân loại tùy chỉnh (Tags)"
              >
                <option value="ALL" className="bg-[#190839] text-slate-300">📌 Nhãn (Tags): Tất cả</option>
                {availableTags.map(tag => (
                  <option key={tag} value={tag} className="bg-[#190839] text-sky-200">
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Digital Competency Domain Filter */}
          <div>
            <select
              value={filterDomain}
              onChange={e => onDomainChange(e.target.value)}
              className="w-full fluent-input px-2 py-1.5 text-xs bg-[#14062E] border-theme-accent/25 text-sky-300 font-medium rounded-[4px]"
              title="Lọc theo Miền Năng Lực Số (Thông tư 02/2025/TT-BGDĐT)"
            >
              <option value="ALL" className="bg-[#190839] text-slate-300">🌐 Miền NL: Tất cả 6 miền</option>
              {Object.values(DIGITAL_COMPETENCY_DOMAINS).map(d => (
                <option key={d.key} value={d.key} className="bg-[#190839] text-sky-300">
                  {d.code}: {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          {onSortChange && (
            <div>
              <select
                value={sortBy}
                onChange={e => onSortChange(e.target.value)}
                className="w-full fluent-input px-2 py-1.5 text-xs bg-[#14062E] border-theme-accent/25 text-fuchsia-300 font-medium rounded-[4px]"
                title="Sắp xếp câu hỏi"
              >
                {searchQuery.trim() && (
                  <option value="RELEVANCE" className="bg-[#190839] text-amber-300 font-bold">
                    🎯 Độ phù hợp tìm kiếm (Relevance)
                  </option>
                )}
                <option value="NEWEST" className="bg-[#190839] text-fuchsia-300">⏳ Mới nhất</option>
                <option value="OLDEST" className="bg-[#190839] text-fuchsia-300">⌛ Cũ nhất</option>
                <option value="DIFFICULTY_ASC" className="bg-[#190839] text-fuchsia-300">📈 Độ khó: Tăng dần</option>
                <option value="DIFFICULTY_DESC" className="bg-[#190839] text-fuchsia-300">📉 Độ khó: Giảm dần</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* 4. Active Filter Badges & Search Match Summary Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-white/10 text-xs font-mono">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#B6A6D8] text-[10.5px]">Đang lọc:</span>

            {/* Query tag */}
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-theme-accent/20 text-theme-accent border border-theme-accent/40 text-[10.5px] font-semibold">
                <Search className="w-3 h-3 text-theme-accent" />
                <span>"{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    if (onSortChange && sortBy === 'RELEVANCE') {
                      onSortChange('NEWEST');
                    }
                  }}
                  className="hover:text-rose-400 cursor-pointer ml-0.5"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Round tag */}
            {filterRoundGroup !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10.5px]">
                <span>{BTI_ROUND_GROUPS[filterRoundGroup]?.name || filterRoundGroup}</span>
                <button
                  type="button"
                  onClick={() => onRoundGroupChange('ALL')}
                  className="hover:text-rose-400 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Difficulty Level tag */}
            {filterLevel !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10.5px]">
                <span>{COGNITIVE_LEVELS[filterLevel as CognitiveLevel]?.name || filterLevel}</span>
                <button
                  type="button"
                  onClick={() => onLevelChange('ALL')}
                  className="hover:text-rose-400 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Topic tag */}
            {filterTopic !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10.5px]">
                <span>Chủ đề: {filterTopic}</span>
                <button
                  type="button"
                  onClick={() => onTopicChange('ALL')}
                  className="hover:text-rose-400 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Custom Active Tags Badges */}
            {activeTagsList.length > 0 && activeTagsList.map(tag => {
              const scheme = getTagColorScheme(tag);
              return (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10.5px] font-semibold shadow-sm ${scheme.badgeStyle}`}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: scheme.hex }}
                  />
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => {
                      vibrateTap();
                      soundFx.playClick();
                      if (onTagsChange) {
                        onTagsChange(activeTagsList.filter(t => t !== tag));
                      } else if (onTagChange) {
                        onTagChange('ALL');
                      }
                    }}
                    className="hover:text-rose-400 cursor-pointer ml-0.5"
                    title={`Bỏ chọn nhãn ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            {/* Status tag */}
            {filterStatus !== 'ALL' && (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10.5px] ${
                filterStatus === 'APPROVED' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : filterStatus === 'PENDING_REVIEW'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                  : filterStatus === 'REJECTED'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                  : 'bg-slate-500/20 text-slate-300 border-slate-400/30'
              }`}>
                <span>
                  {filterStatus === 'APPROVED' ? 'Đã duyệt' : 
                   filterStatus === 'PENDING_REVIEW' ? 'Chờ duyệt' : 
                   filterStatus === 'REJECTED' ? 'Từ chối' : 'Bản thảo'}
                </span>
                <button
                  type="button"
                  onClick={() => onStatusChange('ALL')}
                  className="hover:text-rose-400 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Domain tag */}
            {filterDomain !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10.5px]">
                <span>Miền: {filterDomain === 'UNASSIGNED' ? 'Chưa gán' : (DIGITAL_COMPETENCY_DOMAINS[filterDomain as DigitalCompetencyDomainKey]?.code || filterDomain)}</span>
                <button
                  type="button"
                  onClick={() => onDomainChange('ALL')}
                  className="hover:text-rose-400 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Sub-competency tag */}
            {filterSubCompetency !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10.5px]">
                <span>Tiêu chí: {filterSubCompetency}</span>
                <button
                  type="button"
                  onClick={() => onSubCompetencyChange?.('ALL')}
                  className="hover:text-rose-400 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Matrix status tag */}
            {filterMatrixStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10.5px]">
                <span>
                  Độ phủ: {
                    filterMatrixStatus === 'GAP_DEFICIT' ? 'Thiếu (<3 câu)' :
                    filterMatrixStatus === 'GAP_EMPTY' ? 'Vùng trắng (0 câu)' :
                    filterMatrixStatus === 'MET_TARGET' ? 'Đạt chuẩn (≥3 câu)' :
                    'Chưa gán BTI'
                  }
                </span>
                <button
                  type="button"
                  onClick={() => onMatrixStatusChange?.('ALL')}
                  className="hover:text-rose-400 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {/* Reset All Button & Count */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[#B6A6D8] text-[10.5px] font-semibold">
              Khớp: <strong className="text-theme-accent">{filteredCount}</strong> / {questions.length} câu
            </span>

            <button
              type="button"
              onClick={() => {
                vibrateTap();
                soundFx.playClick();
                onResetAllFilters();
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10.5px] font-bold transition cursor-pointer"
              title="Đặt lại toàn bộ bộ lọc về mặc định"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa lọc</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

