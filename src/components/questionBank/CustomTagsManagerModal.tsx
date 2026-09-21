import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Tag, Plus, Trash2, Edit3, X, Check, Search, Palette } from 'lucide-react';
import { questionBankManager } from '../../services/questionBankManager';
import { vibrateTap, vibrateSuccess, vibrateError } from '../../utils/hapticUtils';
import { soundFx } from '../../services/audioEffects';
import { TAG_COLOR_SCHEMES, getTagColorScheme, setTagColor } from '../../utils/tagColorUtils';

interface CustomTagsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: string[];
}

export const CustomTagsManagerModal: React.FC<CustomTagsManagerModalProps> = ({
  isOpen,
  onClose,
  tags
}) => {
  const [newTag, setNewTag] = useState('');
  const [newTagColor, setNewTagColor] = useState('purple');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeColorMenuTag, setActiveColorMenuTag] = useState<string | null>(null);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    
    if (tags.includes(newTag.trim())) {
      vibrateError();
      soundFx.playError();
      alert('Nhãn này đã tồn tại!');
      return;
    }

    vibrateSuccess();
    soundFx.playCorrect();
    const cleanTag = newTag.trim();
    questionBankManager.addCustomTag(cleanTag);
    setTagColor(cleanTag, newTagColor);
    setNewTag('');
  };

  const handleStartEdit = (tag: string) => {
    vibrateTap();
    setEditingTag(tag);
    setEditValue(tag);
  };

  const handleSaveEdit = () => {
    if (!editValue.trim() || editValue.trim() === editingTag) {
      setEditingTag(null);
      return;
    }

    if (tags.includes(editValue.trim())) {
      vibrateError();
      soundFx.playError();
      alert('Tên nhãn này đã tồn tại!');
      return;
    }

    vibrateSuccess();
    soundFx.playCorrect();
    questionBankManager.updateCustomTag(editingTag!, editValue.trim());
    setEditingTag(null);
  };

  const handleDelete = (tag: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nhãn "${tag}"?\nHành động này sẽ gỡ bỏ nhãn khỏi tất cả các câu hỏi đang sử dụng.`)) return;
    
    vibrateTap();
    soundFx.playClick();
    questionBankManager.deleteCustomTag(tag);
  };

  const handleSelectColorForTag = (tag: string, colorId: string) => {
    vibrateTap();
    soundFx.playClick();
    setTagColor(tag, colorId);
    setActiveColorMenuTag(null);
  };

  const filteredTags = tags.filter(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-hidden modal-backdrop-isolated select-none">
      <div className="fluent-card w-full max-w-lg bg-[#190839] border border-theme-accent/30 rounded-[6px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#241148] px-5 py-4 border-b border-theme-accent/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[4px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Tag className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                Quản Lý Phân Loại & Thư Mục Thẻ (Smart Tags)
              </h3>
              <p className="text-[11px] text-purple-300/80">
                Tạo nhãn phân loại có màu sắc để lọc danh sách câu hỏi linh hoạt
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
          {/* Add New Tag Form with Color Picker */}
          <form onSubmit={handleAddTag} className="space-y-3 bg-[#14062E] p-3.5 rounded border border-white/10">
            <div className="text-[11px] font-mono text-purple-300 uppercase font-bold flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-purple-400" />
              <span>Tạo Thẻ / Thư Mục Mới</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="Nhập tên nhãn / thư mục..."
                className="flex-1 px-3 py-2 bg-[#190839] border border-white/10 rounded-[4px] text-white text-sm focus:border-purple-400 focus:outline-none transition"
                maxLength={40}
              />
              <button
                type="submit"
                disabled={!newTag.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-[4px] font-bold text-sm flex items-center gap-2 transition cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                Tạo
              </button>
            </div>

            {/* Color Palette Selector for New Tag */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-300 font-mono">Màu nhãn:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.values(TAG_COLOR_SCHEMES).map(scheme => (
                  <button
                    key={scheme.id}
                    type="button"
                    onClick={() => setNewTagColor(scheme.id)}
                    className={`w-5 h-5 rounded-full border transition cursor-pointer flex items-center justify-center ${
                      newTagColor === scheme.id
                        ? 'ring-2 ring-white scale-110 border-white'
                        : 'opacity-70 hover:opacity-100 border-black/40'
                    }`}
                    style={{ backgroundColor: scheme.hex }}
                    title={scheme.name}
                  >
                    {newTagColor === scheme.id && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nhãn..."
              className="w-full pl-9 pr-3 py-2 bg-[#14062E] border border-white/10 rounded-[4px] text-white text-sm focus:border-purple-400 focus:outline-none transition"
            />
          </div>

          {/* Tag List */}
          <div className="bg-[#14062E] border border-white/10 rounded-[4px] overflow-hidden max-h-[320px] overflow-y-auto custom-scrollbar">
            {filteredTags.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm italic">
                Không tìm thấy nhãn nào.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredTags.map(tag => {
                  const scheme = getTagColorScheme(tag);
                  const isColorMenuOpen = activeColorMenuTag === tag;

                  return (
                    <div key={tag} className="flex flex-col p-3 hover:bg-white/5 transition group">
                      <div className="flex items-center justify-between">
                        {editingTag === tag ? (
                          <div className="flex items-center gap-2 flex-1 mr-4">
                            <input
                              type="text"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="flex-1 px-2 py-1 bg-[#190839] border border-purple-400/50 rounded text-white text-sm focus:outline-none"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') setEditingTag(null);
                              }}
                            />
                            <button
                              onClick={handleSaveEdit}
                              className="p-1.5 text-emerald-400 hover:bg-emerald-400/20 rounded transition cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingTag(null)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5 text-sm text-slate-200">
                              <span
                                className="w-3.5 h-3.5 rounded-full inline-block shadow-sm ring-1 ring-white/20"
                                style={{ backgroundColor: scheme.hex }}
                              />
                              <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${scheme.badgeStyle}`}>
                                {tag}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                              <button
                                type="button"
                                onClick={() => setActiveColorMenuTag(isColorMenuOpen ? null : tag)}
                                className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-amber-500/20 rounded transition cursor-pointer"
                                title="Đổi màu thẻ"
                              >
                                <Palette className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(tag)}
                                className="p-1.5 text-slate-400 hover:text-sky-300 hover:bg-sky-500/20 rounded transition cursor-pointer"
                                title="Đổi tên nhãn"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(tag)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded transition cursor-pointer"
                                title="Xóa nhãn"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Color Palette Popover for existing tag */}
                      {isColorMenuOpen && (
                        <div className="mt-2.5 p-2 bg-[#190839] rounded border border-purple-500/30 flex items-center gap-2 flex-wrap animate-in fade-in duration-150">
                          <span className="text-[10px] text-slate-300 font-mono">Chọn màu:</span>
                          <div className="flex items-center gap-1.5">
                            {Object.values(TAG_COLOR_SCHEMES).map(c => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleSelectColorForTag(tag, c.id)}
                                className="w-4 h-4 rounded-full border border-black/40 hover:scale-125 transition cursor-pointer"
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
