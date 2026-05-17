import { memo, useCallback, useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import Modal from '../ui/Modal';
import { useToast } from '../../contexts/ToastContext';
import { getApiErrorMessage } from '../../services/api';

function PasswordInput({ id, label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 pr-11 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-[#1e406b] focus:ring-1 focus:ring-[#1e406b]"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-200"
          tabIndex={-1}
          aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

/**
 * Modal đổi mật khẩu cho một tài khoản quản lí.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - manager: { id, name } — tài khoản cần đổi mật khẩu
 *  - api: object có method changePassword(id, { new_password })
 *         Nếu api không yêu cầu current_password (admin đổi hộ), truyền requireCurrentPassword={false}
 *  - requireCurrentPassword: boolean (default true)
 */
function ChangePasswordModal({ isOpen, onClose, manager, api, requireCurrentPassword = true }) {
  const { success: showSuccess, error: showError } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!newPassword) {
        showError('Vui lòng nhập mật khẩu mới.');
        return;
      }

      if (newPassword.length < 6) {
        showError('Mật khẩu mới phải có ít nhất 6 ký tự.');
        return;
      }

      if (newPassword !== confirmPassword) {
        showError('Mật khẩu xác nhận không khớp.');
        return;
      }

      if (requireCurrentPassword && !currentPassword) {
        showError('Vui lòng nhập mật khẩu hiện tại.');
        return;
      }

      setLoading(true);
      try {
        const payload = { new_password: newPassword };
        if (requireCurrentPassword) {
          payload.current_password = currentPassword;
        }
        await api.changePassword(manager.id, payload);
        showSuccess('Đổi mật khẩu thành công.');
        handleClose();
      } catch (err) {
        showError(getApiErrorMessage(err, 'Không thể đổi mật khẩu. Vui lòng thử lại.'));
      } finally {
        setLoading(false);
      }
    },
    [api, confirmPassword, currentPassword, handleClose, manager, newPassword, requireCurrentPassword, showError, showSuccess]
  );

  if (!manager) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Đổi mật khẩu" size="sm" placement="top">
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1e406b]/30 text-[#eecd7e]">
            <KeyRound size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Tài khoản</p>
            <p className="truncate text-sm font-semibold text-slate-100">{manager.name || `#${manager.id}`}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {requireCurrentPassword ? (
            <PasswordInput
              id="current-password"
              label="Mật khẩu hiện tại"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Nhập mật khẩu hiện tại"
            />
          ) : null}

          <PasswordInput
            id="new-password"
            label="Mật khẩu mới"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Tối thiểu 6 ký tự"
          />

          <PasswordInput
            id="confirm-password"
            label="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Nhập lại mật khẩu mới"
          />

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <button type="button" onClick={handleClose} disabled={loading} className="btn-gradient-secondary flex-1">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="btn-gradient-primary flex-1">
              {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export default memo(ChangePasswordModal);
