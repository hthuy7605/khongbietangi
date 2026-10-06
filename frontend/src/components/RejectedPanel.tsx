import { Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Rejections } from '@/lib/rejections';
import type { Dish, Place } from '@/lib/types';

interface Props {
  rejected: Rejections;
  now: number;
  dishes: Map<number, Dish>;
  places: Map<number, Place>;
  onUndo: (key: string) => void;
  onClear: () => void;
}

export function RejectedPanel({ rejected, now, dishes, places, onUndo, onClear }: Props) {
  const rows = Object.entries(rejected)
    .map(([key, exp]) => {
      const [type, rawId] = key.split(':');
      const id = Number(rawId);
      const label = type === 'dish' ? dishes.get(id)?.name : places.get(id)?.name;
      const emoji = type === 'dish' ? (dishes.get(id)?.emoji ?? '🍽️') : '📍';
      return { key, label, emoji, minutes: Math.max(1, Math.ceil((exp - now) / 60_000)) };
    })
    .filter((r) => r.label);
  if (rows.length === 0) return null;

  return (
    <details className="group rounded-2xl border border-border bg-card px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold">
        <span>Đã chê ({rows.length})</span>
        <span className="text-xs font-normal text-muted-foreground group-open:hidden">Bấm để xem</span>
      </summary>
      <ul className="mt-3 grid gap-2">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-2 text-sm">
            <span aria-hidden>{r.emoji}</span>
            <span className="min-w-0 flex-1 truncate font-semibold">{r.label}</span>
            <span className="shrink-0 text-xs text-muted-foreground">còn {r.minutes} phút</span>
            <Button variant="ghost" size="sm" onClick={() => onUndo(r.key)} aria-label={`Bỏ chê ${r.label}`}>
              <Undo2 /> Bỏ chê
            </Button>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" className="mt-3" onClick={onClear}>
        Xóa tất cả
      </Button>
    </details>
  );
}
