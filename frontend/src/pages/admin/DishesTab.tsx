import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DishFields } from '@/components/DishFields';
import { useAdminData } from '@/components/admin/AdminData';
import { ConfirmDialog, EditSheet, LinkChecklist, SaveBar, SearchBox, StarPicker, Stars, applyApiError, fold } from '@/components/admin/parts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Field } from '@/components/Field';
import { Chip } from '@/components/Chip';
import { api, toApiError } from '@/lib/api';
import { dishDefaults, dishFormSchema, dishToForm, toDishBody, type DishFormValues } from '@/lib/forms';
import { MEAL_LABEL } from '@/lib/labels';
import type { Dish } from '@/lib/types';

function DishEditor({ dish, onDone }: { dish: Dish | null; onDone: () => void }) {
  const { groups, places, reload } = useAdminData();
  const form = useForm<DishFormValues>({
    resolver: zodResolver(dishFormSchema),
    defaultValues: dish ? dishToForm(dish) : dishDefaults,
  });
  const [weight, setWeight] = useState(dish?.weight ?? 3);
  const [isActive, setIsActive] = useState(dish?.isActive ?? true);
  const [placeIds, setPlaceIds] = useState<number[]>(dish?.placeIds ?? []);
  const [busy, setBusy] = useState(false);

  async function submit(v: DishFormValues) {
    setBusy(true);
    try {
      await api.admin.saveDish(dish?.id ?? null, { ...toDishBody(v), weight, isActive, placeIds });
      toast.success(dish ? 'Đã lưu món' : 'Đã thêm món');
      await reload();
      onDone();
    } catch (e) {
      applyApiError(form, e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} className="grid gap-5" noValidate>
      <DishFields form={form} groups={groups} />
      <Field label="Độ yêu thích" hint="Càng nhiều sao càng dễ được quay trúng">
        <StarPicker value={weight} onChange={setWeight} />
      </Field>
      <Field label="Quán bán món này">
        <LinkChecklist
          items={places.map((p) => ({ id: p.id, label: p.district ? `${p.name} · ${p.district}` : p.name }))}
          value={placeIds}
          onChange={setPlaceIds}
          searchLabel="Tìm quán"
          empty="Chưa có quán nào"
        />
      </Field>
      <label className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4">
        <span className="text-sm font-bold">Hiện trong trang quay số</span>
        <Switch checked={isActive} onCheckedChange={setIsActive} aria-label="Hiện món trong trang quay số" />
      </label>
      <SaveBar busy={busy} label={dish ? 'Lưu thay đổi' : 'Thêm món'} />
    </form>
  );
}

export default function DishesTab() {
  const { dishes, groups, loading, error, reload } = useAdminData();
  const [q, setQ] = useState('');
  const [show, setShow] = useState<'all' | 'on' | 'off'>('all');
  const [editing, setEditing] = useState<Dish | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Dish | null>(null);
  const [busy, setBusy] = useState(false);

  const list = useMemo(
    () =>
      dishes.filter(
        (d) =>
          fold(d.name).includes(fold(q.trim())) && (show === 'all' || (show === 'on') === (d.isActive ?? true)),
      ),
    [dishes, q, show],
  );
  const groupName = (id: number) => groups.find((g) => g.id === id);

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.admin.deleteDish(deleting.id);
      toast.success(`Đã xóa món “${deleting.name}”`);
      setDeleting(null);
      await reload();
    } catch (e) {
      toast.error(toApiError(e).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="dishes-title" className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="dishes-title" className="text-xl font-extrabold">
          Món ăn <span className="text-base font-semibold text-muted-foreground">({dishes.length})</span>
        </h2>
        <Button className="h-11" onClick={() => setEditing('new')}>
          <Plus /> Thêm món
        </Button>
      </div>
      <SearchBox value={q} onChange={setQ} placeholder="Tìm món theo tên" />
      <div className="flex gap-2" role="group" aria-label="Lọc theo trạng thái">
        <Chip active={show === 'all'} onClick={() => setShow('all')}>Tất cả</Chip>
        <Chip active={show === 'on'} onClick={() => setShow('on')}>Đang hiện</Chip>
        <Chip active={show === 'off'} onClick={() => setShow('off')}>Đang ẩn</Chip>
      </div>

      {error && (
        <p role="alert" className="rounded-2xl border border-destructive/40 p-4 text-sm font-semibold text-destructive">
          {error}{' '}
          <button className="underline" onClick={() => void reload()}>Thử lại</button>
        </p>
      )}
      {loading && <p className="py-8 text-center text-muted-foreground">Đang tải…</p>}
      {!loading && list.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border py-10 text-center text-muted-foreground">
          {dishes.length === 0 ? 'Chưa có món nào. Bấm “Thêm món” để bắt đầu.' : 'Không có món phù hợp.'}
        </p>
      )}

      <ul className="grid gap-3 md:grid-cols-2">
        {list.map((d) => (
          <li key={d.id} className={`rounded-2xl border border-border bg-card p-4 ${d.isActive === false ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3">
              <span aria-hidden className="text-3xl leading-none">{d.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold">{d.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                  <Stars value={d.weight} />
                  <span className="text-muted-foreground">{d.placeIds.length} quán</span>
                  {d.isActive === false && <Badge variant="outline">Đang ẩn</Badge>}
                </div>
                {d.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.description}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {d.meals.map((m) => (
                    <Badge key={m} variant="secondary">{MEAL_LABEL[m]}</Badge>
                  ))}
                  {d.groupIds.map((id) => {
                    const g = groupName(id);
                    return g ? <Badge key={id} variant="outline">{g.emoji} {g.name}</Badge> : null;
                  })}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button variant="ghost" size="icon" className="size-11" aria-label={`Sửa món ${d.name}`} onClick={() => setEditing(d)}>
                  <Pencil />
                </Button>
                <Button variant="ghost" size="icon" className="size-11 text-destructive" aria-label={`Xóa món ${d.name}`} onClick={() => setDeleting(d)}>
                  <Trash2 />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <EditSheet
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing === 'new' ? 'Thêm món mới' : 'Sửa món'}
        description="Điền thông tin món ăn, các ô có dấu * là bắt buộc."
      >
        {editing !== null && <DishEditor key={editing === 'new' ? 'new' : editing.id} dish={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />}
      </EditSheet>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Xóa món này?"
        description={`Món “${deleting?.name ?? ''}” sẽ bị xóa vĩnh viễn cùng các liên kết với quán. Nếu chỉ muốn tạm ngưng, hãy tắt “Hiện trong trang quay số”.`}
        confirmLabel="Xóa món"
        busy={busy}
        onConfirm={() => void remove()}
      />
    </section>
  );
}
