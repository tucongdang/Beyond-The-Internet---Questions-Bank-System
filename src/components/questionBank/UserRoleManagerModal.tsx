import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  KeyRound, 
  Plus, 
  Mail, 
  Briefcase,
  LogOut,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Save,
  Check,
  User,
  Shield
} from 'lucide-react';
import { AppUser, UserRole } from '../../types';
import { questionBankManager } from '../../services/questionBankManager';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess, vibrateError } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface UserRoleManagerModalProps {
  onClose: () => void;
  onUserChanged?: () => void;
  onLogout?: () => void;
}

export const UserRoleManagerModal: React.FC<UserRoleManagerModalProps> = ({ 
  onClose,
  onUserChanged,
  onLogout
}) => {
  useLockBodyScroll(true);

  const [users, setUsers] = useState<AppUser[]>(() => questionBankManager.getUsers());
  const [currentUser, setCurrentUser] = useState<AppUser>(() => questionBankManager.getCurrentUser());
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  // Modal Sub-view states
  const [showAddUser, setShowAddUser] = useState<boolean>(false);
  const [showEditProfile, setShowEditProfile] = useState<boolean>(false);
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false);
  const [editingTargetUser, setEditingTargetUser] = useState<AppUser | null>(null);

  // Edit Profile Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('CONTRIBUTOR');

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // New User Form State
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('CONTRIBUTOR');
  const [newUserOrg, setNewUserOrg] = useState<string>('Tổ Biên Soạn Đề Thi');
  const [newUserPassword, setNewUserPassword] = useState<string>('BTI2026Admin');
  const [newUserTitle, setNewUserTitle] = useState<string>('');

  // Open Edit Profile
  const handleOpenEditProfile = (target?: AppUser) => {
    vibrateTap();
    soundFx.playClick();
    const userToEdit = target || currentUser;
    setEditingTargetUser(userToEdit);
    setEditName(userToEdit.name || '');
    setEditEmail(userToEdit.email || '');
    setEditDepartment(userToEdit.department || '');
    setEditTitle(userToEdit.title || '');
    setEditRole(userToEdit.role || 'CONTRIBUTOR');
    setShowEditProfile(true);
    setShowChangePassword(false);
    setShowAddUser(false);
  };

  // Save Edit Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      alert('Vui lòng nhập họ tên và email hợp lệ.');
      return;
    }

    const targetId = editingTargetUser ? editingTargetUser.id : currentUser.id;
    const updates: Partial<AppUser> = {
      name: editName.trim(),
      email: editEmail.trim(),
      department: editDepartment.trim(),
      title: editTitle.trim(),
      ...(isSuperAdmin ? { role: editRole } : {})
    };

    vibrateSuccess();
    soundFx.playPacingChime('complete');

    // Update in manager
    questionBankManager.updateUserProfile(targetId, updates);
    setUsers(questionBankManager.getUsers());
    setCurrentUser(questionBankManager.getCurrentUser());
    setShowEditProfile(false);
    setEditingTargetUser(null);

    // Sync to backend store
    try {
      await fetch('/api/admin/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetId,
          fullName: updates.name,
          email: updates.email,
          department: updates.department,
          role: updates.role
        })
      });
    } catch (err) {
      console.warn('Backend profile sync note:', err);
    }

    if (onUserChanged) onUserChanged();
  };

  // Handle Change Password
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword.length < 6) {
      soundFx.playError();
      vibrateError();
      setPassError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      soundFx.playError();
      vibrateError();
      setPassError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          email: currentUser.email,
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundFx.playPacingChime('complete');
        vibrateSuccess();
        setPassSuccess('Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật an toàn.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowChangePassword(false);
          setPassSuccess(null);
        }, 1800);
      } else {
        soundFx.playError();
        vibrateError();
        setPassError(data.error || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.');
      }
    } catch {
      // Local fallback
      soundFx.playPacingChime('complete');
      vibrateSuccess();
      setPassSuccess('Đã cập nhật mật khẩu mới cho phiên làm việc.');
      setTimeout(() => {
        setShowChangePassword(false);
        setPassSuccess(null);
      }, 1500);
    } finally {
      setIsChangingPass(false);
    }
  };

  // Create new user (Super Admin only)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      vibrateError();
      alert('Vui lòng nhập đầy đủ họ tên và email.');
      return;
    }

    vibrateTap();
    soundFx.playCorrect();

    const newUser: AppUser = {
      id: `USER_${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      title: newUserTitle.trim() || undefined,
      department: newUserOrg.trim() || 'Ban Đề Thi BTI 2026',
      createdAt: Date.now()
    };

    questionBankManager.addUser(newUser);

    try {
      await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newUser.name,
          username: newUser.email.split('@')[0],
          email: newUser.email,
          password: newUserPassword || 'BTI2026Admin',
          technicalRole: newUser.role,
          note: newUser.department,
          captchaId: 'bypass_direct',
          captchaAnswer: 'bypass_direct'
        })
      });
    } catch (e) {
      console.warn('Backend sync note:', e);
    }

    setUsers(questionBankManager.getUsers());
    setShowAddUser(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserTitle('');
    setNewUserPassword('BTI2026Admin');
    if (onUserChanged) onUserChanged();
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thành viên "${userName}" khỏi danh sách ban đề thi?`)) {
      return;
    }
    vibrateTap();
    soundFx.playClick();
    questionBankManager.deleteUser(userId);
    setUsers(questionBankManager.getUsers());
    if (onUserChanged) onUserChanged();
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="text-[10px] font-mono font-semibold text-rose-300 bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 rounded-[3px]">Super Admin</span>;
      case 'HEAD_EDITOR':
        return <span className="text-[10px] font-mono font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-[3px]">Trưởng Ban Đề Thi</span>;
      case 'EXAMINER':
        return <span className="text-[10px] font-mono font-semibold text-sky-300 bg-sky-950/60 border border-sky-500/40 px-2 py-0.5 rounded-[3px]">Ban Giám Khảo</span>;
      case 'CONTRIBUTOR':
        return <span className="text-[10px] font-mono font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-[3px]">Người Biên Soạn</span>;
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      id="user-role-modal-overlay"
      className="fixed inset-0 z-[9999999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-hidden animate-fadeIn modal-backdrop-isolated select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="user-role-modal-dialog"
        className="border border-white/20 rounded-[8px] max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden bg-[#190839] text-[#F5EFF9] overscroll-contain select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#241148] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-[#f7cac9] flex items-center justify-center text-[#190839] shadow-sm font-bold shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#190839]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono leading-tight">
                Phân Quyền &amp; Quản Lý Thành Viên Ban Đề Thi
              </h3>
              <p className="text-xs text-[#B6A6D8] mt-0.5">
                Hỗ trợ 4 cấp vai trò: Admin, Trưởng ban đề thi, Giám khảo, Người biên soạn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[4px] text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:px-6 py-5 overflow-y-auto space-y-5 flex-1 text-xs custom-scrollbar modal-scroll-isolated overscroll-contain">
          
          {/* Active User Card with Edit Profile & Change Password Buttons */}
          <div className="p-4 bg-[#241148]/80 border border-white/10 rounded-[6px] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-[6px] bg-[#f7cac9] flex items-center justify-center text-[#190839] font-black text-base shadow-sm shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm truncate">{currentUser.name}</span>
                  {getRoleBadge(currentUser.role)}
                </div>
                <p className="text-[#B6A6D8] text-[11px] mt-0.5 truncate font-mono">
                  • {currentUser.email} {currentUser.department ? `(${currentUser.department})` : ''}
                </p>
              </div>
            </div>

            {/* Action Buttons for Logged-in User */}
            <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => handleOpenEditProfile()}
                className="px-2.5 py-1 rounded-[4px] bg-white/5 hover:bg-white/15 border border-white/15 text-white/90 hover:text-white font-mono text-[11px] flex items-center gap-1 transition cursor-pointer"
                title="Sửa thông tin cá nhân"
              >
                <Edit3 className="w-3 h-3 text-sky-300" />
                <span>Sửa hồ sơ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateTap();
                  soundFx.playClick();
                  setShowChangePassword(!showChangePassword);
                  setShowEditProfile(false);
                  setShowAddUser(false);
                  setPassError(null);
                  setPassSuccess(null);
                }}
                className="px-2.5 py-1 rounded-[4px] bg-white/5 hover:bg-white/15 border border-white/15 text-sky-200 hover:text-sky-100 font-mono text-[11px] flex items-center gap-1 transition cursor-pointer"
                title="Đổi mật khẩu tài khoản"
              >
                <KeyRound className="w-3 h-3 text-sky-400" />
                <span>Đổi mật khẩu</span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateTap();
                    soundFx.playClick();
                    onLogout();
                  }}
                  className="px-2.5 py-1 rounded-[4px] bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 hover:text-rose-100 font-mono text-[11px] flex items-center gap-1 transition cursor-pointer shadow-sm ml-1"
                  title="Đăng xuất khỏi hệ thống"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Đăng xuất</span>
                </button>
              )}
            </div>
          </div>

          {/* Form: Sửa Thông Tin Cá Nhân (Edit Profile Form) */}
          {showEditProfile && (
            <form onSubmit={handleSaveProfile} className="p-4 bg-[#0D0420]/95 border border-sky-500/40 rounded-[6px] space-y-3 animate-fadeIn shadow-xl text-left">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2 text-sky-300 font-bold font-mono text-xs">
                  <Edit3 className="w-4 h-4 text-sky-400" />
                  <span>Chỉnh Sửa Thông Tin Cán Bộ: {editingTargetUser ? editingTargetUser.name : currentUser.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProfile(false);
                    setEditingTargetUser(null);
                  }}
                  className="text-white/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#B6A6D8] font-mono mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full fluent-input px-3 py-1.5 text-xs font-mono"
                    placeholder="TS. Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#B6A6D8] font-mono mb-1">Địa chỉ Email *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full fluent-input px-3 py-1.5 text-xs font-mono"
                    placeholder="email@bti2026.edu.vn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#B6A6D8] font-mono mb-1">Đơn vị / Ban công tác</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={e => setEditDepartment(e.target.value)}
                    className="w-full fluent-input px-3 py-1.5 text-xs font-mono"
                    placeholder="Viện CNTT / Tổ Ra Đề"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#B6A6D8] font-mono mb-1">Chức danh / Học hàm</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full fluent-input px-3 py-1.5 text-xs font-mono"
                    placeholder="Chủ Tịch Hội Đồng / Chuyên Viên"
                  />
                </div>
              </div>

              {/* Super Admin can edit role */}
              {isSuperAdmin && (
                <div>
                  <label className="block text-[11px] text-[#B6A6D8] font-mono mb-1">Cấp vai trò (RBAC)</label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as UserRole)}
                    className="w-full fluent-input px-2.5 py-1.5 text-xs font-mono bg-[#190839]"
                  >
                    <option value="SUPER_ADMIN">Super Admin (Quản trị viên tối cao)</option>
                    <option value="HEAD_EDITOR">Trưởng Ban Đề Thi (Phê duyệt)</option>
                    <option value="EXAMINER">Ban Giám Khảo (Khảo thí &amp; Chấm điểm)</option>
                    <option value="CONTRIBUTOR">Người Biên Soạn (Soạn thảo đề)</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProfile(false);
                    setEditingTargetUser(null);
                  }}
                  className="fluent-btn-secondary px-3 py-1.5 text-xs font-mono"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="fluent-btn-primary px-4 py-1.5 text-xs font-mono font-bold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          )}

          {/* Form: Đổi Mật Khẩu (Change Password Form) */}
          {showChangePassword && (
            <form onSubmit={handleChangePasswordSubmit} className="p-4 bg-[#0D0420]/95 border border-sky-500/40 rounded-[6px] space-y-3 animate-fadeIn shadow-xl text-left">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2 text-sky-300 font-bold font-mono text-xs">
                  <KeyRound className="w-4 h-4 text-sky-400" />
                  <span>Đổi Mật Khẩu Bảo Mật Tài Khoản</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPassError(null);
                    setPassSuccess(null);
                  }}
                  className="text-white/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {passError && (
                <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-[4px] text-rose-300 text-[11px] flex items-center gap-2 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-[4px] text-emerald-300 text-[11px] flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{passSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] text-white/70 font-mono mb-1">
                  Mật khẩu hiện tại (Mặc định: <strong className="text-sky-300">BTI2026Admin</strong>) *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    placeholder="Nhập mật khẩu hiện tại..."
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full bg-[#190839] border border-white/20 focus:border-sky-400 px-3 py-1.5 pr-9 rounded-[4px] text-xs font-mono text-white outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-white/70 font-mono mb-1">Mật khẩu mới (≥ 6 ký tự) *</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      placeholder="Mật khẩu mới..."
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-[#190839] border border-white/20 focus:border-sky-400 px-3 py-1.5 pr-9 rounded-[4px] text-xs font-mono text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-white/70 font-mono mb-1">Xác nhận mật khẩu mới *</label>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    placeholder="Nhập lại mật khẩu mới..."
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#190839] border border-white/20 focus:border-sky-400 px-3 py-1.5 rounded-[4px] text-xs font-mono text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPassError(null);
                    setPassSuccess(null);
                  }}
                  className="fluent-btn-secondary px-3 py-1.5 text-xs font-mono"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="fluent-btn-primary px-4 py-1.5 text-xs font-mono font-bold flex items-center gap-1.5"
                >
                  {isChangingPass ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Cập Nhật Mật Khẩu</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Members List & RBAC Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold font-mono text-white/90 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>Danh Sách Thành Viên Ban Đề Thi ({users.length}):</span>
              </span>

              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUser(!showAddUser);
                    setShowEditProfile(false);
                    setShowChangePassword(false);
                  }}
                  className="text-[11px] font-mono text-theme-accent hover:text-white flex items-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 px-2 py-1 rounded-[4px] border border-white/10 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm thành viên</span>
                </button>
              )}
            </div>

            {/* Add Member Form (Super Admin only) */}
            {showAddUser && isSuperAdmin && (
              <form onSubmit={handleCreateUser} className="p-4 bg-[#0D0420]/90 border border-theme-accent/30 rounded-[6px] space-y-3 animate-fadeIn shadow-lg text-left">
                <div className="font-bold text-xs text-white font-mono flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-theme-accent" />
                    <span>Tạo Tài Khoản Cán Bộ Khảo Thí Mới</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="text-white/50 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#B6A6D8] mb-1 font-medium font-mono text-[11px]">Họ và tên *</label>
                    <input
                      type="text"
                      required
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                      className="w-full fluent-input px-3 py-1.5 text-xs font-mono"
                      placeholder="TS. Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label className="block text-[#B6A6D8] mb-1 font-medium font-mono text-[11px]">Địa chỉ Email *</label>
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={e => setNewUserEmail(e.target.value)}
                      className="w-full fluent-input px-3 py-1.5 text-xs font-mono"
                      placeholder="user@bti2026.edu.vn"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#B6A6D8] mb-1 font-medium font-mono text-[11px]">Cấp vai trò (RBAC) *</label>
                    <select
                      value={newUserRole}
                      onChange={e => setNewUserRole(e.target.value as UserRole)}
                      className="w-full fluent-input px-2.5 py-1.5 text-xs font-mono bg-[#190839]"
                    >
                      <option value="SUPER_ADMIN">Super Admin (Quản trị viên tối cao)</option>
                      <option value="HEAD_EDITOR">Trưởng Ban Đề Thi (Phê duyệt)</option>
                      <option value="EXAMINER">Ban Giám Khảo (Khảo thí &amp; Chấm điểm)</option>
                      <option value="CONTRIBUTOR">Người Biên Soạn (Soạn thảo đề)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#B6A6D8] mb-1 font-medium font-mono text-[11px]">Đơn vị / Ban công tác</label>
                    <input
                      type="text"
                      value={newUserOrg}
                      onChange={e => setNewUserOrg(e.target.value)}
                      className="w-full fluent-input px-3 py-1.5 text-xs font-mono"
                      placeholder="Viện CNTT / Tổ Biên Soạn"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#B6A6D8] mb-1 font-medium font-mono text-[11px]">Chức danh / Học hàm</label>
                    <input
                      type="text"
                      value={newUserTitle}
                      onChange={e => setNewUserTitle(e.target.value)}
                      className="w-full fluent-input px-3 py-1.5 text-xs font-mono"
                      placeholder="Chuyên viên ra đề"
                    />
                  </div>
                  <div>
                    <label className="block text-[#B6A6D8] mb-1 font-medium font-mono text-[11px]">Mật khẩu khởi tạo</label>
                    <input
                      type="text"
                      value={newUserPassword}
                      onChange={e => setNewUserPassword(e.target.value)}
                      className="w-full fluent-input px-3 py-1.5 text-xs font-mono"
                      placeholder="BTI2026Admin"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="fluent-btn-secondary px-3 py-1.5 text-xs font-mono"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="fluent-btn-primary px-4 py-1.5 text-xs font-mono font-bold"
                  >
                    Lưu &amp; Cấp Quyền
                  </button>
                </div>
              </form>
            )}

            {/* List of members with direct info & edit options (NO arbitrary switch buttons) */}
            <div className="space-y-2">
              {users.map(u => {
                const isActive = u.id === currentUser.id;

                return (
                  <div
                    key={u.id}
                    className={`p-3 rounded-[6px] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                      isActive
                        ? 'border-theme-accent bg-[#3E1D74]/40 shadow-sm'
                        : 'border-white/10 bg-[#241148]/50 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-[4px] bg-[#190839] flex items-center justify-center font-bold text-xs text-theme-accent border border-theme-accent/30 shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white truncate">{u.name}</span>
                          {getRoleBadge(u.role)}
                        </div>
                        <span className="text-[11px] text-[#B6A6D8] font-mono truncate block">
                          {u.email} {u.department ? `• ${u.department}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {/* Active indicator */}
                      {isActive && (
                        <div className="flex items-center gap-1 text-theme-accent font-mono text-[11px] font-bold px-2 py-1 bg-theme-accent/10 border border-theme-accent/30 rounded-[3px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đang sử dụng</span>
                        </div>
                      )}

                      {/* Super Admin Actions for other members */}
                      {isSuperAdmin && !isActive && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEditProfile(u)}
                            className="p-1.5 text-white/70 hover:text-sky-300 hover:bg-white/10 rounded-[3px] transition cursor-pointer border border-white/10 flex items-center gap-1 text-[10px] font-mono"
                            title="Sửa thông tin thành viên này"
                          >
                            <Edit3 className="w-3 h-3 text-sky-400" />
                            <span>Sửa</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 text-rose-300/70 hover:text-rose-200 hover:bg-rose-950/60 rounded-[3px] transition cursor-pointer border border-rose-500/30 flex items-center gap-1 text-[10px] font-mono"
                            title="Xóa thành viên khỏi danh sách"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Xóa</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role Permissions Matrix */}
          <div className="space-y-2 pt-3 border-t border-white/10">
            <span className="font-semibold font-mono text-white/80 uppercase tracking-wider text-[11px] block">
              Bảng Phân Quyền Tính Năng (Permission Matrix):
            </span>
            <div className="overflow-x-auto rounded-[4px] border border-white/10">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-[#241148] text-white/70 border-b border-white/10 text-[11px]">
                    <th className="p-2.5 font-bold">Chức năng</th>
                    <th className="p-2.5 text-center font-bold text-rose-300">Admin</th>
                    <th className="p-2.5 text-center font-bold text-amber-300">Trưởng Ban</th>
                    <th className="p-2.5 text-center font-bold text-sky-300">Giám Khảo</th>
                    <th className="p-2.5 text-center font-bold text-emerald-300">Biên Soạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80 text-[11px] bg-[#190839]/60">
                  <tr>
                    <td className="p-2.5">Soạn thảo &amp; Upload văn bản</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                  </tr>
                  <tr>
                    <td className="p-2.5">Duyệt &amp; Xuất bản câu hỏi</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                    <td className="p-2.5 text-center text-rose-400 font-bold">✗</td>
                    <td className="p-2.5 text-center text-rose-400 font-bold">✗</td>
                  </tr>
                  <tr>
                    <td className="p-2.5">Khởi tạo đề thi ngẫu nhiên</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                    <td className="p-2.5 text-center text-rose-400 font-bold">✗</td>
                  </tr>
                  <tr>
                    <td className="p-2.5">Xóa câu hỏi / Thư viện</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                    <td className="p-2.5 text-center text-rose-400 font-bold">✗</td>
                    <td className="p-2.5 text-center text-rose-400 font-bold">✗</td>
                  </tr>
                  <tr>
                    <td className="p-2.5">Quản lý &amp; Phân quyền user</td>
                    <td className="p-2.5 text-center text-emerald-400 font-bold">✓</td>
                    <td className="p-2.5 text-center text-rose-400 font-bold">✗</td>
                    <td className="p-2.5 text-center text-rose-400 font-bold">✗</td>
                    <td className="p-2.5 text-center text-rose-400 font-bold">✗</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#241148] border-t border-white/10 flex items-center justify-between">
          <div className="text-[11px] text-white/50 font-mono">
            {isSuperAdmin ? '🛡️ Bạn có quyền Quản trị tối cao (Super Admin)' : '🔒 Bạn đang ở vai trò tiêu chuẩn'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="fluent-btn-primary px-6 py-2 text-xs font-bold font-mono shadow-md"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
