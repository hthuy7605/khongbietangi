import { LocateFixed, X } from 'lucide-react';
import { Chip } from '@/components/Chip';
import type { Filters } from '@/lib/filters';
import { noFilters } from '@/lib/filters';
import { MEALS, MEAL_EMOJI, MEAL_LABEL } from '@/lib/labels';
import type { Group, Meal } from '@/lib/types';

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  groups: Group[];
  districts: string[];
  nearbyAsking: boolean;
  onToggleNearby: (on: boolean) => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
    </div>
  );
}

export function FilterBar({ filters, onChange, groups, districts, nearbyAsking, onToggleNearby }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const active =
    filters.meal !== null || filters.groupId !== null || filters.district !== null || filters.openNow || filters.nearby;

  return (
    <section aria-label="Bộ lọc" className="grid gap-3">
      <Row label="Bữa">
        <Chip active={filters.meal === null} onClick={() => set({ meal: null })}>
          Mọi bữa
        </Chip>
        {MEALS.map((m: Meal) => (
          <Chip key={m} active={filters.meal === m} onClick={() => set({ meal: filters.meal === m ? null : m })}>
            <span aria-hidden>{MEAL_EMOJI[m]}</span> {MEAL_LABEL[m]}
          </Chip>
        ))}
      </Row>

      {groups.length > 0 && (
        <Row label="Loại món">
          <Chip active={filters.groupId === null} onClick={() => set({ groupId: null })}>
            Tất cả
          </Chip>
          {groups.map((g) => (
            <Chip key={g.id} active={filters.groupId === g.id} onClick={() => set({ groupId: filters.groupId === g.id ? null : g.id })}>
              <span aria-hidden>{g.emoji}</span> {g.name}
            </Chip>
          ))}
        </Row>
      )}

      <Row label="Quán">
        <Chip active={filters.openNow} onClick={() => set({ openNow: !filters.openNow })}>
          Đang mở cửa
        </Chip>
        <Chip active={filters.nearby} disabled={nearbyAsking} onClick={() => onToggleNearby(!filters.nearby)}>
          <LocateFixed className="size-4" aria-hidden /> {nearbyAsking ? 'Đang định vị…' : 'Gần tôi'}
        </Chip>
        {districts.map((d) => (
          <Chip key={d} active={filters.district === d} onClick={() => set({ district: filters.district === d ? null : d })}>
            {d}
          </Chip>
        ))}
      </Row>

      {active && (
        <button
          type="button"
          onClick={() => onChange(noFilters)}
          className="inline-flex w-fit items-center gap-1 text-sm font-bold text-primary hover:underline"
        >
          <X className="size-4" aria-hidden /> Xóa bộ lọc
        </button>
      )}
    </section>
  );
}
