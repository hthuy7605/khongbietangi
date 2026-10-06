import { Dices, Lightbulb, Settings } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { cn } from 'cn';
import { ThemeToggle } from '@/components/ThemeToggle';

const NAV = [
  { to: '/', label: 'Quay số', end: true, icon: Dices },
  { to: '/de-xuat', label: 'Đề xuất', end: false, icon: Lightbulb },
];

const topLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-full px-3.5 py-2 text-sm font-bold whitespace-nowrap transition-colors',
    isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent',
  );

const bottomLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-bold whitespace-nowrap transition-colors',
    isActive ? 'text-primary' : 'text-muted-foreground',
  );

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4">
          <Link to="/" className="mr-auto flex items-center gap-2 text-lg font-extrabold whitespace-nowrap">
            <span aria-hidden className="text-2xl">🍜</span>
            <span>Không biết ăn gì</span>
          </Link>
          <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 sm:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={topLink}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-5 pb-10">
        <Outlet />
      </main>

      <footer className="border-t border-border/70 pt-5 pb-24 text-center text-xs text-muted-foreground sm:pb-5">
        <p>
          Được làm bởi{' '}
          <a href="mailto:h.thuy7605@gmail.com" className="font-semibold text-foreground hover:underline">
            h.thuy7605@gmail.com
          </a>
        </p>
        <Link to="/admin" className="mt-1 hidden hover:underline sm:inline-block">
          Quản trị
        </Link>
      </footer>

      <nav
        aria-label="Điều hướng chính"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={bottomLink}>
            <n.icon className="size-5" aria-hidden />
            {n.label}
          </NavLink>
        ))}
        <Link to="/admin" className={bottomLink({ isActive: false })}>
          <Settings className="size-5" aria-hidden />
          Quản trị
        </Link>
      </nav>
    </div>
  );
}
