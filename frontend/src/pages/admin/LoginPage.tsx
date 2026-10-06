import { useState } from 'react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Field } from '@/components/Field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, toApiError } from '@/lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Nhập tên đăng nhập và mật khẩu nhé');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.login(username.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err) {
      const apiErr = toApiError(err);
      setError(apiErr.status === 429 ? 'Bạn đăng nhập sai quá nhiều lần, thử lại sau 15 phút nhé' : apiErr.message);
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <form onSubmit={submit} className="grid w-full max-w-sm gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm" noValidate>
        <div className="text-center">
          <p aria-hidden className="text-5xl">🔐</p>
          <h1 className="mt-2 text-2xl font-extrabold">Quản trị</h1>
          <p className="text-sm text-muted-foreground">Đăng nhập để duyệt đề xuất và quản lý món, quán.</p>
        </div>
        <Field label="Tên đăng nhập" htmlFor="login-user">
          <Input id="login-user" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus className="h-11" />
        </Field>
        <Field label="Mật khẩu" htmlFor="login-pass">
          <div className="relative">
            <Input
              id="login-pass"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="h-11 pr-12"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              aria-pressed={show}
              className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </Field>
        {error && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="h-11" disabled={busy}>
          {busy && <LoaderCircle className="animate-spin" />}
          Đăng nhập
        </Button>
        <Link to="/" className="text-center text-sm font-semibold text-muted-foreground hover:underline">
          ← Về trang quay số
        </Link>
      </form>
    </div>
  );
}
