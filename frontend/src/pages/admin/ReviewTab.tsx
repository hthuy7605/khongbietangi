import { useCallback, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ExternalLink, PencilLine, TriangleAlert, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Chip } from '@/components/Chip';
import { DishFields } from '@/components/DishFields';
import { PlaceFields } from '@/components/PlaceFields';
import { useAdminData } from '@/components/admin/AdminData';
import { ConfirmDialog, EditSheet, SaveBar } from '@/components/admin/parts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api, toApiError } from '@/lib/api';
import {
  dishFormSchema,
  dishToForm,
  placeFormSchema,
  placeToForm,
  toDishBody,
  toPlaceBody,
  type DishFormValues,
  type PlaceFormValues,
} from '@/lib/forms';
import { MEAL_LABEL, PRICE_LABEL } from '@/lib/labels';
import type { Suggestion, SuggestionStatus } from '@/lib/types';

type DishSuggestion = Extract<Suggestion, { kind: 'dish' }>;
type PlaceSuggestion = Extract<Suggestion, { kind: 'place' }>;

const STATUS_LABEL: Record<SuggestionStatus, string> = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Đã từ chối' };
const KIND_LABEL = { dish: 'Món mới', place: 'Quán mới', link: 'Gán quán vào món' } as const;
const dateFmt = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 text-sm sm:grid-cols-[7rem_1fr] sm:gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-semibold">{children}</dd>
    </div>
  );
}

function Payload({ s }: { s: Suggestion }) {
  const { dishName, placeName, groups } = useAdminData();
  if (s.kind === 'link') {
    return (
      <p className="font-extrabold">
        {dishName(s.payload.dishId)} <span className="font-normal text-muted-foreground">bán tại</span> {placeName(s.payload.placeId)}
      </p>
    );
  }
  if (s.kind === 'dish') {
    const p = s.payload;
    return (
      <div className="grid gap-2">
        <p className="text-lg font-extrabold">
          <span aria-hidden>{p.emoji}</span> {p.name}
        </p>
        <dl className="grid gap-1.5">
          {p.description && <Row label="Mô tả">{p.description}</Row>}
          {p.meals.length > 0 && <Row label="Bữa">{p.meals.map((m) => MEAL_LABEL[m]).join(', ')}</Row>}
          {p.groupIds.length > 0 && <Row label="Nhóm">{p.groupIds.map((id) => groups.find((g) => g.id === id)?.name ?? `#${id}`).join(', ')}</Row>}
          {p.placeIds.length > 0 && <Row label="Bán tại">{p.placeIds.map(placeName).join(', ')}</Row>}
        </dl>
      </div>
    );
  }
  const p = s.payload;
  return (
    <div className="grid gap-2">
      <p className="text-lg font-extrabold">{p.name}</p>
      <dl className="grid gap-1.5">
        {(p.address || p.district) && <Row label="Địa chỉ">{[p.address, p.district].filter(Boolean).join(', ')}</Row>}
        {p.priceLevel && <Row label="Giá">{PRICE_LABEL[p.priceLevel]}</Row>}
        {p.openTime && p.closeTime && <Row label="Giờ mở cửa">{p.openTime} – {p.closeTime}</Row>}
        {p.lat !== null && p.lng !== null && <Row label="Tọa độ">{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</Row>}
        {p.dishIds.length > 0 && <Row label="Bán món">{p.dishIds.map(dishName).join(', ')}</Row>}
        {p.newDishNames.length > 0 && <Row label="Món mới">{p.newDishNames.join(', ')}</Row>}
        {p.note && <Row label="Ghi chú">{p.note}</Row>}
        {p.mapsUrl && (
          <Row label="Bản đồ">
            <a href={p.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
              Mở link <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </Row>
        )}
      </dl>
    </div>
  );
}

function DishEdit({ s, onSubmit, busy }: { s: DishSuggestion; onSubmit: (payload: unknown) => void; busy: boolean }) {
  const { groups } = useAdminData();
  const form = useForm<DishFormValues>({ resolver: zodResolver(dishFormSchema), defaultValues: dishToForm(s.payload) });
  return (
    <form onSubmit={form.handleSubmit((v) => onSubmit({ ...toDishBody(v), placeIds: s.payload.placeIds }))} className="grid gap-5" noValidate>
      <DishFields form={form} groups={groups} />
      <SaveBar busy={busy} label="Lưu và duyệt" />
    </form>
  );
}

function PlaceEdit({ s, onSubmit, busy }: { s: PlaceSuggestion; onSubmit: (payload: unknown) => void; busy: boolean }) {
  const form = useForm<PlaceFormValues>({ resolver: zodResolver(placeFormSchema), defaultValues: placeToForm(s.payload) });
  return (
    <form
      onSubmit={form.handleSubmit((v) => onSubmit({ ...toPlaceBody(v), dishIds: s.payload.dishIds, newDishNames: s.payload.newDishNames }))}
      className="grid gap-5"
      noValidate
    >
      <PlaceFields form={form} />
      <SaveBar busy={busy} label="Lưu và duyệt" />
    </form>
  );
}

export default function ReviewTab() {
  const { reload } = useAdminData();
  const [status, setStatus] = useState<SuggestionStatus>('pending');
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Suggestion | null>(null);
  const [rejecting, setRejecting] = useState<Suggestion | null>(null);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await api.admin.suggestions(status));
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(s: Suggestion, payload?: unknown) {
    setBusyId(s.id);
    try {
      await api.admin.approve(s.id, payload);
      toast.success('Đã duyệt đề xuất');
      setEditing(null);
      await Promise.all([load(), reload()]);
    } catch (e) {
      toast.error(toApiError(e).message);
      void load();
    } finally {
      setBusyId(null);
    }
  }

  async function reject() {
    if (!rejecting) return;
    setBusyId(rejecting.id);
    try {
      await api.admin.reject(rejecting.id, reason.trim() || null);
      toast.success('Đã từ chối đề xuất');
      setRejecting(null);
      setReason('');
      await Promise.all([load(), reload()]);
    } catch (e) {
      toast.error(toApiError(e).message);
      void load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section aria-labelledby="review-title" className="grid gap-4">
      <h2 id="review-title" className="text-xl font-extrabold">Đề xuất từ khách</h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo trạng thái">
        {(Object.keys(STATUS_LABEL) as SuggestionStatus[]).map((st) => (
          <Chip key={st} active={status === st} onClick={() => setStatus(st)}>
            {STATUS_LABEL[st]}
          </Chip>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-2xl border border-destructive/40 p-4 text-sm font-semibold text-destructive">
          {error} <button className="underline" onClick={() => void load()}>Thử lại</button>
        </p>
      )}
      {loading && <p className="py-8 text-center text-muted-foreground">Đang tải…</p>}
      {!loading && !error && items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border py-10 text-center text-muted-foreground">
          {status === 'pending' ? 'Không có đề xuất nào đang chờ. Bạn đã duyệt hết rồi!' : 'Chưa có đề xuất nào ở mục này.'}
        </p>
      )}

      <ul className="grid gap-3 lg:grid-cols-2">
        {items.map((s) => (
          <li key={s.id} className="grid content-start gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{KIND_LABEL[s.kind]}</Badge>
              <span className="text-xs text-muted-foreground">{dateFmt.format(new Date(s.createdAt))}</span>
            </div>
            {s.duplicates.length > 0 && (
              <div role="alert" className="flex flex-wrap items-center gap-1.5 rounded-xl bg-secondary p-2 text-xs font-bold text-secondary-foreground">
                <TriangleAlert className="size-4 shrink-0" aria-hidden />
                <span>Có thể trùng:</span>
                {s.duplicates.map((d) => (
                  <Badge key={`${d.type}-${d.id}-${d.name}`} variant="outline" className="bg-card">
                    {d.type === 'dish' ? 'Món' : d.type === 'place' ? 'Quán' : ''} {d.name}
                  </Badge>
                ))}
              </div>
            )}
            <Payload s={s} />
            {s.status === 'pending' ? (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button className="h-11 flex-1" disabled={busyId === s.id} onClick={() => void approve(s)}>
                  <Check /> Duyệt
                </Button>
                {s.kind !== 'link' && (
                  <Button variant="secondary" className="h-11 flex-1" disabled={busyId === s.id} onClick={() => setEditing(s)}>
                    <PencilLine /> Sửa rồi duyệt
                  </Button>
                )}
                <Button variant="outline" className="h-11 flex-1 text-destructive" disabled={busyId === s.id} onClick={() => setRejecting(s)}>
                  <X /> Từ chối
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {STATUS_LABEL[s.status]}
                {s.reviewedAt && ` lúc ${dateFmt.format(new Date(s.reviewedAt))}`}
                {s.rejectReason && ` · Lý do: ${s.rejectReason}`}
              </p>
            )}
          </li>
        ))}
      </ul>

      <EditSheet
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Sửa rồi duyệt"
        description="Chỉnh lại thông tin nếu cần, bấm lưu để duyệt luôn."
      >
        {editing?.kind === 'dish' && <DishEdit key={editing.id} s={editing} busy={busyId === editing.id} onSubmit={(p) => void approve(editing, p)} />}
        {editing?.kind === 'place' && <PlaceEdit key={editing.id} s={editing} busy={busyId === editing.id} onSubmit={(p) => void approve(editing, p)} />}
      </EditSheet>

      <ConfirmDialog
        open={rejecting !== null}
        onOpenChange={(o) => {
          if (!o) {
            setRejecting(null);
            setReason('');
          }
        }}
        title="Từ chối đề xuất?"
        description="Bạn có thể ghi lý do để tiện theo dõi (không bắt buộc)."
        confirmLabel="Từ chối"
        busy={busyId !== null && busyId === rejecting?.id}
        onConfirm={() => void reject()}
      >
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={3} placeholder="Ví dụ: trùng món đã có" aria-label="Lý do từ chối" />
      </ConfirmDialog>
    </section>
  );
}
