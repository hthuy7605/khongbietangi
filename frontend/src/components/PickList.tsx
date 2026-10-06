import { useId, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from 'cn';
import { Input } from '@/components/ui/input';

export interface PickItem {
  id: number;
  label: string;
  sub?: string;
  emoji?: string;
}

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();

interface Props {
  items: PickItem[];
  value: number[];
  onChange: (ids: number[]) => void;
  searchLabel: string;
  empty?: string;
}

export function PickList({ items, value, onChange, searchLabel, empty = 'Chưa có mục nào' }: Props) {
  const [q, setQ] = useState('');
  const listId = useId();
  const shown = useMemo(() => {
    const needle = fold(q.trim());
    return needle ? items.filter((i) => fold(`${i.label} ${i.sub ?? ''}`).includes(needle)) : items;
  }, [items, q]);

  return (
    <div className="grid gap-2">
      <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchLabel} aria-label={searchLabel} aria-controls={listId} />
      <ul id={listId} className="grid max-h-56 gap-1 overflow-y-auto rounded-2xl border border-border bg-card p-1.5">
        {shown.length === 0 && <li className="px-3 py-4 text-center text-sm text-muted-foreground">{items.length ? 'Không tìm thấy' : empty}</li>}
        {shown.map((i) => {
          const on = value.includes(i.id);
          return (
            <li key={i.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => onChange(on ? value.filter((x) => x !== i.id) : [...value, i.id])}
                className={cn(
                  'flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                  on ? 'bg-accent font-bold' : 'hover:bg-muted',
                )}
              >
                {i.emoji && <span aria-hidden>{i.emoji}</span>}
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{i.label}</span>
                  {i.sub && <span className="block truncate text-xs font-normal text-muted-foreground">{i.sub}</span>}
                </span>
                {on && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ul>
      {value.length > 0 && <p className="text-xs font-semibold text-muted-foreground">Đã chọn {value.length}</p>}
    </div>
  );
}
