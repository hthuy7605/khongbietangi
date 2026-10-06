import { useCallback, useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { cn } from 'cn';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AdminDataProvider, useAdminData } from '@/components/admin/AdminData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, toApiError } from '@/lib/api';
import DishesTab from './DishesTab';
import GroupsTab from './GroupsTab';
import LoginPage from './LoginPage';
import OverviewTab from './OverviewTab';
import PlacesTab from './PlacesTab';
import ReviewTab from './ReviewTab';
import SettingsTab from './SettingsTab';

const TABS = [
  { to: '/admin', label: 'Duyệt', end: true },
  { to: '/admin/mon', label: 'Món' },
  { to: '/admin/quan', label: 'Quán' },
  { to: '/admin/nhom', label: 'Nhóm' },
  { to: '/admin/tong-quan', label: 'Tổng quan' },
  { to: '/admin/cai-dat', label: 'Cài đặt' },
];

function Shell({ onLogout }: { onLogout: () => void }) {
  const { stats } = useAdminData();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
          <Link to="/admin" className="mr-auto text-lg font-extrabold tracking-tight">
            <span aria-hidden>🍜</span> Quản trị
          </Link>
          <Button variant="ghost" asChild className="h-10">
            <Link to="/">Xem trang chủ</Link>
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="size-10" aria-label="Đăng xuất" onClick={onLogout}>
            <LogOut />
          </Button>
        </div>
        <nav aria-label="Mục quản trị" className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                )
              }
            >
              {t.label}
              {t.to === '/admin' && (stats?.pending ?? 0) > 0 && (
                <Badge variant="destructive" aria-label={`${stats?.pending} đề xuất đang chờ`}>
                  {stats?.pending}
                </Badge>
              )}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-5">
        <Routes>
          <Route index element={<ReviewTab />} />
          <Route path="mon" element={<DishesTab />} />
          <Route path="quan" element={<PlacesTab />} />
          <Route path="nhom" element={<GroupsTab />} />
          <Route path="tong-quan" element={<OverviewTab />} />
          <Route path="cai-dat" element={<SettingsTab />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function Gate() {
  const navigate = useNavigate();
  const [state, setState] = useState<'checking' | 'ok' | 'error'>('checking');
  const [error, setError] = useState('');
  const toLogin = useCallback(() => navigate('/admin/login', { replace: true }), [navigate]);

  useEffect(() => {
    api
      .me()
      .then(() => setState('ok'))
      .catch((e) => {
        const err = toApiError(e);
        if (err.status === 401) toLogin();
        else {
          setError(err.message);
          setState('error');
        }
      });
  }, [toLogin]);

  async function logout() {
    await api.logout().catch(() => undefined);
    toLogin();
  }

  if (state === 'checking') return <p className="p-8 text-center text-muted-foreground">Đang kiểm tra đăng nhập…</p>;
  if (state === 'error') {
    return (
      <div className="p-8 text-center">
        <p role="alert" className="font-semibold text-destructive">{error}</p>
        <Button className="mt-4 h-11" onClick={() => window.location.reload()}>Thử lại</Button>
      </div>
    );
  }
  return (
    <AdminDataProvider onUnauthorized={toLogin}>
      <Shell onLogout={() => void logout()} />
    </AdminDataProvider>
  );
}

export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="*" element={<Gate />} />
    </Routes>
  );
}
