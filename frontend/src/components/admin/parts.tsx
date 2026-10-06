import { useMemo, useState, type ReactNode } from 'react';
import { LoaderCircle, Search, Star } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toApiError } from '@/lib/api';
import { toast } from 'sonner';
import type { UseFormReturn, FieldValues, Path } from 'react-hook-form';

export function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 rounded-full bg-card pl-9"
      />
    </div>
  );
}

export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Độ yêu thích" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} sao`}
          onClick={() => onChange(n)}
          className="grid size-11 place-items-center rounded-xl transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Star className={cn('size-6', n <= value ? 'fill-primary text-primary' : 'text-muted-foreground/50')} />
        </button>
      ))}
    </div>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-primary" role="img" aria-label={`${value} trên 5 sao`}>
      <Star aria-hidden className="size-3.5 fill-current" />
      <span className="text-xs font-bold">{value}</span>
    </span>
  );
}

export interface LinkItem {
  id: number;
  label: string;
}

export function LinkChecklist({
  items,
  value,
  onChange,
  searchLabel,
  empty,
}: {
  items: LinkItem[];
  value: number[];
  onChange: (v: number[]) => void;
  searchLabel: string;
  empty: string;
}) {
  const [q, setQ] = useState('');
  const shown = useMemo(() => items.filter((i) => fold(i.label).includes(fold(q.trim()))), [items, q]);
  return (
    <div className="grid gap-2 rounded-2xl border border-border bg-card p-3">
      <SearchBox value={q} onChange={setQ} placeholder={searchLabel} />
      <p className="text-xs text-muted-foreground">Đã chọn {value.length}</p>
      <ul className="max-h-52 overflow-y-auto">
        {shown.map((i) => {
          const checked = value.includes(i.id);
          return (
            <li key={i.id}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 text-sm font-semibold hover:bg-accent">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange(checked ? value.filter((x) => x !== i.id) : [...value, i.id])}
                  className="size-5 accent-primary"
                />
                {i.label}
              </label>
            </li>
          );
        })}
        {shown.length === 0 && <li className="px-2 py-3 text-sm text-muted-foreground">{items.length === 0 ? empty : 'Không có kết quả'}</li>}
      </ul>
    </div>
  );
}

export function SaveBar({ busy, label = 'Lưu' }: { busy: boolean; label?: string }) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-2 border-t border-border bg-background px-4 py-3">
      <Button type="submit" size="lg" className="h-11 w-full" disabled={busy}>
        {busy && <LoaderCircle className="animate-spin" />}
        {label}
      </Button>
    </div>
  );
}

export function EditSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  busy,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  busy: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter className="gap-2">
          <Button variant="outline" className="h-11" onClick={() => onOpenChange(false)} disabled={busy}>
            Hủy
          </Button>
          <Button variant="destructive" className="h-11" onClick={onConfirm} disabled={busy}>
            {busy && <LoaderCircle className="animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Đưa lỗi theo trường từ API vào form; trả về true nếu có ít nhất một trường khớp. */
export function applyApiError<T extends FieldValues>(form: UseFormReturn<T>, e: unknown): void {
  const err = toApiError(e);
  let matched = false;
  for (const [k, msg] of Object.entries(err.fields ?? {})) {
    if (k in form.getValues()) {
      form.setError(k as Path<T>, { message: msg });
      matched = true;
    }
  }
  toast.error(matched ? 'Vui lòng kiểm tra lại các ô báo lỗi' : err.message);
}
