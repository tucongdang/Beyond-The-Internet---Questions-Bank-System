import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  UserCheck, 
  Lock, 
  KeyRound, 
  Plus, 
  Mail, 
  Briefcase 
} from 'lucide-react';
import { AppUser, UserRole } from '../../types';
import { questionBankManager } from '../../services/questionBankManager';
import { soundFx } from '../../services/audioEffects';
import { vibrateTap, vibrateSuccess } from '../../utils/hapticUtils';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface UserRoleManagerModalProps {
  onClose: () => void;
  onUserChanged?: () => void;
}

export const UserRoleManagerModal: React.FC<UserRoleManagerModalProps> = ({ 
  onClose,
  onUserChanged 
}) => {
  useLockBodyScroll(true);

  const [users, setUsers] = useState<AppUser[]>(() => questionBankManager.getUsers());
  const [currentUser, setCurrentUser] = useState<AppUser>(() => questionBankManager.getCurrentUser());
  const [showAddUser, setShowAddUser] = useState<boolean>(false);

  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('CONTRIBUTOR');
  const [newUserOrg, setNewUserOrg] = useState<string>('Bộ môn Tin học');

  const handleSwitchUser = (user: AppUser) => {
    vibrateTap();
    soundFx.playClick();
    questionBankManager.setCurrentUser(user);
    setCurrentUser(user);
    if (onUserChanged) onUserChanged();
  };

  const handleCreateUser = () => {
    if (!newUserName || !newUserEmail) {
      alert('Vui lòng nhập họ tên và email.');
      return;
    }

    vibrateTap();
    soundFx.playCorrect();

    const newUser: AppUser = {
      id: `USER_${Date.now()}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      department: newUserOrg,
      createdAt: Date.now()
    };

    questionBankManager.addUser(newUser);
    const updated = questionBankManager.getUsers();
    setUsers(updated);
    setShowAddUser(false);
    setNewUserName('');
    setNewUserEmail('');
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="text-[10px] font-mono font-semibold text-rose-300 bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 rounded-md">Super Admin</span>;
      case 'HEAD_EDITOR':
        return <span className="text-[10px] font-mono font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-md">Trưởng Ban Đề Thi</span>;
      case 'EXAMINER':
        return <span className="text-[10px] font-mono font-semibold text-sky-300 bg-sky-950/60 border border-sky-500/40 px-2 py-0.5 rounded-md">Ban Giám Khảo</span>;
      case 'CONTRIBUTOR':
        return <span className="text-[10px] font-mono font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-md">Người Biên Soạn</span>;
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      id="user-role-modal-overlay"
      className="fixed inset-0 z-[9999999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-hidden animate-fadeIn modal-backdrop-isolated select-none"
    >
      <div 
        id="user-role-modal-dialog"
        className="border border-theme-accent/30 rounded-[8px] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden bg-[#190839] text-[#F5EFF9] overscroll-contain select-text"
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#241148] border-b border-theme-accent/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[6px] bg-theme-accent flex items-center justify-center text-[#190839] shadow-sm font-bold shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#190839]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                Phân Quyền &amp; Quản Lý Thành Viên Ban Đề Thi
              </h3>
              <p className="text-xs text-[#B6A6D8]">
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
        <div className="p-5 sm:px-6 py-5 overflow-y-auto space-y-6 flex-1 text-xs custom-scrollbar modal-scroll-isolated overscroll-contain">
          {/* Active persona box */}
          <div className="p-4 bg-[#241148]/70 border border-theme-accent/20 rounded-[4px] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[4px] bg-theme-accent flex items-center justify-center text-[#190839] font-bold text-sm shadow-sm">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{currentUser.name}</span>
                  {getRoleBadge(currentUser.role)}
                </div>
                <p className="text-[#B6A6D8] text-[11px] mt-0.5">{currentUser.department} • {currentUser.email}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-[4px] border border-emerald-500/40">
                Đang Đăng Nhập
              </span>
            </div>
          </div>

          {/* Quick Persona Switcher */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold font-mono text-theme-accent uppercase tracking-wider text-[11px]">
                Chuyển Đổi Nhanh Tài Khoản Thử Nghiệm RBAC:
              </span>
              <button
                type="button"
                onClick={() => setShowAddUser(!showAddUser)}
                className="text-[11px] font-mono text-theme-accent hover:text-[#FCEEEC] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm thành viên
              </button>
            </div>

            {/* Add member form if toggled */}
            {showAddUser && (
              <div className="p-3.5 bg-[#0D0420]/80 border border-theme-accent/25 rounded-[4px] space-y-3 animate-fadeIn">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#B6A6D8] mb-1 font-medium">Họ và tên:</label>
                    <input
                      type="text"
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                      className="w-full fluent-input px-2.5 py-1.5"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div>
                    <label className="block text-[#B6A6D8] mb-1 font-medium">Email:</label>
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={e => setNewUserEmail(e.target.value)}
                      className="w-full fluent-input px-2.5 py-1.5"
                      placeholder="user@bti2026.edu.vn"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#B6A6D8] mb-1 font-medium">Vai trò:</label>
                    <select
                      value={newUserRole}
                      onChange={e => setNewUserRole(e.target.value as UserRole)}
                      className="w-full fluent-input px-2.5 py-1.5"
                    >
                      <option value="SUPER_ADMIN" className="bg-[#190839] text-white">Super Admin (Quản trị viên tối cao)</option>
                      <option value="HEAD_EDITOR" className="bg-[#190839] text-white">Trưởng Ban Đề Thi (Phê duyệt)</option>
                      <option value="EXAMINER" className="bg-[#190839] text-white">Ban Giám Khảo (Khảo thí &amp; Chấm điểm)</option>
                      <option value="CONTRIBUTOR" className="bg-[#190839] text-white">Người Biên Soạn (Soạn thảo đề)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#B6A6D8] mb-1 font-medium">Đơn vị / Ban:</label>
                    <input
                      type="text"
                      value={newUserOrg}
                      onChange={e => setNewUserOrg(e.target.value)}
                      className="w-full fluent-input px-2.5 py-1.5"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="fluent-btn-secondary px-3 py-1 text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateUser}
                    className="fluent-btn-primary px-3 py-1 text-xs font-semibold"
                  >
                    Lưu Thành Viên
                  </button>
                </div>
              </div>
            )}

            {/* List of existing members to switch */}
            <div className="space-y-2">
              {users.map(u => {
                const isActive = u.id === currentUser.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => handleSwitchUser(u)}
                    className={`p-3 rounded-[4px] border flex items-center justify-between transition cursor-pointer ${
                      isActive
                        ? 'border-theme-accent bg-[#3E1D74]/50 shadow-sm'
                        : 'border-theme-accent/15 bg-[#241148]/50 hover:border-theme-accent/35'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[4px] bg-[#190839] flex items-center justify-center font-semibold text-xs text-theme-accent border border-theme-accent/30">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{u.name}</span>
                          {getRoleBadge(u.role)}
                        </div>
                        <span className="text-[11px] text-[#B6A6D8]">{u.department}</span>
                      </div>
                    </div>

                    {isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-theme-accent" />
                    ) : (
                      <button
                        type="button"
                        className="fluent-btn-secondary px-2.5 py-1 text-[11px] font-mono"
                      >
                        Chuyển Sang
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role Permissions Matrix */}
          <div className="space-y-2 pt-2 border-t border-slate-700/60">
            <span className="font-semibold font-mono text-slate-300 uppercase tracking-wider text-[11px] block">
              Bảng Phân Quyền Tính Năng (Permission Matrix):
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-800/60 text-slate-400 border-b border-slate-700/60 text-[11px]">
                    <th className="p-2 font-medium">Chức năng</th>
                    <th className="p-2 text-center font-medium">Admin</th>
                    <th className="p-2 text-center font-medium">Trưởng Ban</th>
                    <th className="p-2 text-center font-medium">Giám Khảo</th>
                    <th className="p-2 text-center font-medium">Biên Soạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300 text-[11px]">
                  <tr>
                    <td className="p-2">Soạn thảo &amp; Upload văn bản</td>
                    <td className="p-2 text-center text-emerald-400">✓</td>
                    <td className="p-2 text-center text-emerald-400">✓</td>
                    <td className="p-2 text-center text-emerald-400">✓</td>
                    <td className="p-2 text-center text-emerald-400">✓</td>
                  </tr>
                  <tr>
                    <td className="p-2">Duyệt &amp; Xuất bản câu hỏi</td>
                    <td className="p-2 text-center text-emerald-400">✓</td>
                    <td className="p-2 text-center text-emerald-400">✓</td>
                    <td className="p-2 text-center text-rose-400">✗</td>
                    <td className="p-2 text-center text-rose-400">✗</td>
                  </tr>
                  <tr>
                    <td className="p-2">Khởi tạo đề thi ngẫu nhiên</td>
                    <td className="p-2 text-center text-emerald-400">✓</td>
                    <td className="p-2 text-center text-emerald-400">✓</td>
                    <td className="p-2 text-center text-emerald-400">✓</td>
                    <td className="p-2 text-center text-rose-400">✗</td>
                  </tr>
                  <tr>
                    <td className="p-2">Xóa câu hỏi / Thư viện</td>
                    <td className="p-2 text-center text-emerald-400">✓</td>
                    <td className="p-2 text-center text-emerald-400">✓</td>
                    <td className="p-2 text-center text-rose-400">✗</td>
                    <td className="p-2 text-center text-rose-400">✗</td>
                  </tr>
                  <tr>
                    <td className="p-2">Quản lý &amp; Phân quyền user</td>
                    <td className="p-2 text-center text-emerald-400">✓</td>
                    <td className="p-2 text-center text-rose-400">✗</td>
                    <td className="p-2 text-center text-rose-400">✗</td>
                    <td className="p-2 text-center text-rose-400">✗</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-700/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="fluent-btn-primary px-5 py-2 text-xs font-semibold font-mono"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
