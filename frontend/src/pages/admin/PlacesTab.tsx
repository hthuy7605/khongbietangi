import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Chip } from '@/components/Chip';
import { Field } from '@/components/Field';
import { PlaceFields } from '@/components/PlaceFields';
import { useAdminData } from '@/components/admin/AdminData';
import { ConfirmDialog, EditSheet, LinkChecklist, SaveBar, SearchBox, StarPicker, Stars, applyApiError, fold } from '@/components/admin/parts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { api, toApiError } from '@/lib/api';
import { placeDefaults, placeFormSchema, placeToForm, toPlaceBody, type PlaceFormValues } from '@/lib/forms';
import { PRICE_LABEL } from '@/lib/labels';
import type { Place } from '@/lib/types';

function PlaceEditor({ place, onDone }: { place: Place | null; onDone: () => void }) {
  const { dishes, reload } = useAdminData();
  const form = useForm<PlaceFormValues>({
    resolver: zodResolver(placeFormSchema),
    defaultValues: place ? placeToForm(place) : placeDefaults,
  });
  const [weight, setWeight] = useState(place?.weight ?? 3);
  const [isActive, setIsActive] = useState(place?.isActive ?? true);
  const [dishIds, setDishIds] = useState<number[]>(place?.dishIds ?? []);
  const [busy, setBusy] = useState(false);

  async function submit(v: PlaceFormValues) {
    setBusy(true);
    try {
      await api.admin.savePlace(place?.id ?? null, { ...toPlaceBody(v), weight, isActive, dishIds });
      toast.success(place ? 'Đã lưu quán' : 'Đã thêm quán');
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
      <PlaceFields form={form} />
      <Field label="Độ yêu thích" hint="Càng nhiều sao càng dễ được quay trúng">
        <StarPicker value={weight} onChange={setWeight} />
      </Field>
      <Field label="Món quán này bán">
        <LinkChecklist
          items={dishes.map((d) => ({ id: d.id, label: `${d.emoji} ${d.name}` }))}
          value={dishIds}
          onChange={setDishIds}
          searchLabel="Tìm món"
          empty="Chưa có món nào"
        />
      </Field>
      <label className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4">
        <span className="text-sm font-bold">Hiện trong trang quay số</span>
        <Switch checked={isActive} onCheckedChange={setIsActive} aria-label="Hiện quán trong trang quay số" />
      </label>
      <SaveBar busy={busy} label={place ? 'Lưu thay đổi' : 'Thêm quán'} />
    </form>
  );
}

export default function PlacesTab() {
  const { places, loading, error, reload, dishName } = useAdminData();
  const [q, setQ] = useState('');
  const [show, setShow] = useState<'all' | 'on' | 'off'>('all');
  const [editing, setEditing] = useState<Place | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Place | null>(null);
  const [busy, setBusy] = useState(false);

  const list = useMemo(
    () =>
      places.filter(
        (p) =>
          fold(`${p.name} ${p.district} ${p.address}`).includes(fold(q.trim())) &&
          (show === 'all' || (show === 'on') === (p.isActive ?? true)),
      ),
    [places, q, show],
  );

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.admin.deletePlace(deleting.id);
      toast.success(`Đã xóa quán “${deleting.name}”`);
      setDeleting(null);
      await reload();
    } catch (e) {
      toast.error(toApiError(e).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="places-title" className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="places-title" className="text-xl font-extrabold">
          Quán ăn <span className="text-base font-semibold text-muted-foreground">({places.length})</span>
        </h2>
        <Button className="h-11" onClick={() => setEditing('new')}>
          <Plus /> Thêm quán
        </Button>
      </div>
      <SearchBox value={q} onChange={setQ} placeholder="Tìm quán theo tên, quận, địa chỉ" />
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
          {places.length === 0 ? 'Chưa có quán nào. Bấm “Thêm quán” để bắt đầu.' : 'Không có quán phù hợp.'}
        </p>
      )}

      <ul className="grid gap-3 md:grid-cols-2">
        {list.map((p) => (
          <li key={p.id} className={`rounded-2xl border border-border bg-card p-4 ${p.isActive === false ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold">{p.name}</p>
                <p className="truncate text-sm text-muted-foreground">{[p.address, p.district].filter(Boolean).join(', ') || 'Chưa có địa chỉ'}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                  <Stars value={p.weight} />
                  {p.priceLevel && <Badge variant="secondary">{PRICE_LABEL[p.priceLevel]}</Badge>}
                  {p.openTime && p.closeTime && <Badge variant="secondary">{p.openTime}–{p.closeTime}</Badge>}
                  {p.lat !== null && <Badge variant="outline">Có tọa độ</Badge>}
                  {p.isActive === false && <Badge variant="outline">Đang ẩn</Badge>}
                </div>
                {(p.dishIds?.length ?? 0) > 0 && (
                  <p className="mt-2 line-clamp-2 text-sm">
                    <span className="text-muted-foreground">Bán: </span>
                    {p.dishIds!.map(dishName).join(', ')}
                  </p>
                )}
                {p.mapsUrl && (
                  <a
                    href={p.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex min-h-8 items-center gap-1 text-sm font-bold text-primary underline-offset-4 hover:underline"
                  >
                    Mở bản đồ <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button variant="ghost" size="icon" className="size-11" aria-label={`Sửa quán ${p.name}`} onClick={() => setEditing(p)}>
                  <Pencil />
                </Button>
                <Button variant="ghost" size="icon" className="size-11 text-destructive" aria-label={`Xóa quán ${p.name}`} onClick={() => setDeleting(p)}>
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
        title={editing === 'new' ? 'Thêm quán mới' : 'Sửa quán'}
        description="Điền thông tin quán, các ô có dấu * là bắt buộc."
      >
        {editing !== null && <PlaceEditor key={editing === 'new' ? 'new' : editing.id} place={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />}
      </EditSheet>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Xóa quán này?"
        description={`Quán “${deleting?.name ?? ''}” sẽ bị xóa vĩnh viễn cùng các liên kết với món. Nếu chỉ muốn tạm ngưng, hãy tắt “Hiện trong trang quay số”.`}
        confirmLabel="Xóa quán"
        busy={busy}
        onConfirm={() => void remove()}
      />
    </section>
  );
}
