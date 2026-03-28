import { useEffect, useMemo, useState } from 'react';
import { Building2, KeyRound, LogIn, MapPin, ShieldCheck } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { authAPI } from '../services/api';

function normalizePreviewResponse(response) {
  const raw = response?.data;
  if (raw?.data && typeof raw.data === 'object') return raw.data;
  if (raw && typeof raw === 'object') return raw;
  return null;
}

export default function GarageLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/customers';
  const { authReady, isAuthenticated, login } = useAuth();
  const { success, error } = useToast();

  const [form, setForm] = useState({
    garage_code: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [previewGarage, setPreviewGarage] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const debouncedGarageCode = useDebounce(form.garage_code, 450);

  useEffect(() => {
    const code = String(debouncedGarageCode || '').trim();
    if (!code) {
      setPreviewGarage(null);
      setPreviewError('');
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError('');

    authAPI
      .resolveGarageByCode(code)
      .then((response) => {
        if (cancelled) return;
        const garage = normalizePreviewResponse(response);
        setPreviewGarage(garage);
        setPreviewError('');
      })
      .catch((previewRequestError) => {
        if (cancelled) return;
        setPreviewGarage(null);
        setPreviewError(previewRequestError?.message || 'Không tìm thấy gara tương ứng với mã này.');
      })
      .finally(() => {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedGarageCode]);

  const previewMeta = useMemo(() => {
    if (!previewGarage) {
      return null;
    }

    return {
      name: previewGarage.name || 'Gara chưa đặt tên',
      code: previewGarage.code || String(form.garage_code || '').trim().toUpperCase(),
      address: previewGarage.address || 'Chưa cập nhật địa chỉ',
      avatarUrl: previewGarage.avatar_url || '',
      status: previewGarage.status || 'active',
    };
  }, [form.garage_code, previewGarage]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const garageCode = String(form.garage_code || '').trim().toUpperCase();
    const password = String(form.password || '');

    if (!garageCode || !password) {
      error('Vui lòng nhập mã gara và mật khẩu.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await login({
        garage_code: garageCode,
        password,
      });

      const garageName = result?.session?.garage?.name || previewMeta?.name || garageCode;
      success(`Đăng nhập gara thành công: ${garageName}`);
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      error(loginError?.message || 'Không thể đăng nhập gara.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />
          <p className="text-sm text-slate-300">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (authReady && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_28%),linear-gradient(160deg,_#081120_0%,_#0f172a_45%,_#1e293b_100%)] px-4 py-8 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">
            <ShieldCheck size={14} />
            Multi-Gara Admin
          </div>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
              Đăng nhập đúng gara, làm việc đúng phạm vi dữ liệu.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Từ bây giờ mỗi phiên quản trị chỉ gắn với một gara. Sau khi đăng nhập, toàn bộ khách hàng, đơn dịch vụ,
              nhân viên, catalog và thông báo sẽ tự scope theo token gara hiện tại.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-200">
                <Building2 size={20} />
              </div>
              <div className="text-sm font-semibold text-white">Mã gara + mật khẩu</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">Không còn chọn tenant ở từng màn hình quản trị.</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-200">
                <ShieldCheck size={20} />
              </div>
              <div className="text-sm font-semibold text-white">Token tự suy ra gara</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">Frontend không cần gửi `garage_id` cho admin API nữa.</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-200">
                <KeyRound size={20} />
              </div>
              <div className="text-sm font-semibold text-white">Đổi gara là đổi phiên</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">State cũ sẽ được dọn để không lẫn dữ liệu giữa các gara.</p>
            </div>
          </div>
        </section>

        <section className="app-panel overflow-hidden border-white/10 bg-slate-950/60 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.9)] backdrop-blur-xl">
          <div className="app-panel-header border-white/10 bg-[linear-gradient(135deg,rgba(30,41,59,0.96),rgba(15,23,42,0.96))]">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-200">
                <Building2 size={28} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">Cổng quản trị gara</p>
                <h2 className="text-2xl font-bold text-white">Đăng nhập quản trị</h2>
              </div>
            </div>
          </div>

          <div className="app-panel-body space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200">Mã gara</label>
                <input
                  type="text"
                  value={form.garage_code}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      garage_code: event.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="VD: DEFAULT"
                  autoComplete="username"
                  className="app-input bg-slate-950/70 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200">Mật khẩu</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Nhập mật khẩu quản trị gara"
                  autoComplete="current-password"
                  className="app-input bg-slate-950/70 text-white placeholder:text-slate-500"
                />
              </div>

              <button type="submit" disabled={submitting} className="btn-gradient-primary w-full">
                <LogIn size={18} />
                {submitting ? 'Đang đăng nhập...' : 'Đăng nhập gara'}
              </button>
            </form>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Thông tin gara</div>
                  <div className="text-xs text-slate-400">Preview theo mã gara trước khi đăng nhập.</div>
                </div>
                {previewLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-blue-300" />
                ) : null}
              </div>

              {previewMeta ? (
                <div className="flex gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-900/70">
                    {previewMeta.avatarUrl ? (
                      <img src={previewMeta.avatarUrl} alt={previewMeta.name} className="h-full w-full object-cover" />
                    ) : (
                      <Building2 size={28} className="text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-base font-bold text-white">{previewMeta.name}</div>
                      <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-200">
                        {previewMeta.code}
                      </span>
                    </div>
                    <div className="mt-2 flex items-start gap-2 text-sm text-slate-300">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-slate-500" />
                      <span>{previewMeta.address}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400">
                  {previewError
                    ? previewError
                    : 'Nhập mã gara để kiểm tra nhanh tên gara trước khi gửi form đăng nhập.'}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
