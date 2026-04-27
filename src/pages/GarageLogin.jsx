import { useState } from 'react';
import { Building2, LogIn } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ThemeToggle from '../components/ui/ThemeToggle';

export default function GarageLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/customers';
  const { authReady, isAuthenticated, login } = useAuth();
  const { success, error } = useToast();

  const [form, setForm] = useState({
    login: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const loginInput = String(form.login || '').trim();
    const password = String(form.password || '');

    if (!loginInput || !password) {
      error('Vui lòng nhập số điện thoại/email và mật khẩu.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await login({ login: loginInput, password });
      const garageName = result?.session?.garage?.name || 'gara của bạn';
      const roleLabel = result?.session?.garage?.is_super_garage ? ' (Super Garage)' : '';
      success(`Đăng nhập gara thành công: ${garageName}${roleLabel}`);
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      error(loginError?.message || 'Không thể đăng nhập gara.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-200">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-[#e0a02e]" />
          <p className="text-sm text-slate-300">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (authReady && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(30,64,107,0.28),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(195,123,30,0.18),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(180,130,66,0.12),transparent_45%)]" />
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <section className="relative w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/85 p-6 shadow-[0_20px_80px_-30px_rgba(17,37,82,0.45)] backdrop-blur-xl">
        <header className="mb-6">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#1e406b]/15 text-[#eecd7e] ring-1 ring-[#1e406b]/30">
            <Building2 size={20} />
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#eecd7e]">GaraOne Admin</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Đăng nhập quản lý gara</h1>
          <p className="mt-1 text-sm text-slate-400">Nhập số điện thoại hoặc email và mật khẩu để tiếp tục.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={form.login}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                login: event.target.value,
              }))
            }
            placeholder="Số điện thoại hoặc email"
            autoComplete="username"
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-[#e0a02e] focus:outline-none focus:ring-2 focus:ring-[#1e406b]/30"
          />

          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="Mật khẩu"
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-[#e0a02e] focus:outline-none focus:ring-2 focus:ring-[#1e406b]/30"
          />

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1e406b] to-[#c37b1e] px-4 py-2.5 font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LogIn size={18} />
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
          Tài khoản đăng nhập dùng chung cho web quản trị và app quản lý gara.
        </div>
      </section>
    </div>
  );
}
