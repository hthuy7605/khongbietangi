import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAdminData } from '@/components/admin/AdminData';

export default function OverviewTab() {
  const { stats, loading, error, reload } = useAdminData();
  const tiles = [
    { label: 'Món ăn', value: stats?.dishes },
    { label: 'Quán ăn', value: stats?.places },
    { label: 'Đề xuất đang chờ', value: stats?.pending, highlight: true },
    { label: 'Đề xuất 7 ngày qua', value: stats?.weekSuggestions },
  ];
  return (
    <section aria-labelledby="overview-title" className="grid gap-4">
      <h2 id="overview-title" className="text-xl font-extrabold">Tổng quan</h2>
      {error && (
        <p role="alert" className="rounded-2xl border border-destructive/40 p-4 text-sm font-semibold text-destructive">
          {error} <button className="underline" onClick={() => void reload()}>Thử lại</button>
        </p>
      )}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className={`rounded-2xl border p-4 ${t.highlight && (t.value ?? 0) > 0 ? 'border-primary bg-accent' : 'border-border bg-card'}`}>
            <dt className="text-sm text-muted-foreground">{t.label}</dt>
            <dd className="mt-1 text-3xl font-extrabold tabular-nums">{loading ? '…' : (t.value ?? 0)}</dd>
          </div>
        ))}
      </dl>
      {(stats?.pending ?? 0) > 0 && (
        <Button asChild className="h-11 w-fit">
          <Link to="/admin">Duyệt {stats?.pending} đề xuất đang chờ</Link>
        </Button>
      )}
    </section>
  );
}
