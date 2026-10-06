import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Field } from '@/components/Field';
import { useAdminData } from '@/components/admin/AdminData';
import { ConfirmDialog, EditSheet, SaveBar } from '@/components/admin/parts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, toApiError } from '@/lib/api';
import type { Group } from '@/lib/types';

function GroupEditor({ group, onDone }: { group: Group | null; onDone: () => void }) {
  const { reload } = useAdminData();
  const [name, setName] = useState(group?.name ?? '');
  const [emoji, setEmoji] = useState(group?.emoji ?? '🍽️');
  const [sortOrder, setSortOrder] = useState(String(group?.sortOrder ?? 0));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const order = Number(sortOrder);
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Nhập tên nhóm';
    if (!emoji.trim()) next.emoji = 'Nhập một emoji';
    if (!Number.isInteger(order) || order < 0 || order > 999) next.sortOrder = 'Nhập số từ 0 đến 999';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await api.admin.saveGroup(group?.id ?? null, { name: name.trim(), emoji: emoji.trim(), sortOrder: order });
      toast.success(group ? 'Đã lưu nhóm' : 'Đã thêm nhóm');
      await reload();
      onDone();
    } catch (err) {
      const apiErr = toApiError(err);
      if (apiErr.code === 'duplicate') setErrors({ name: 'Tên nhóm này đã có' });
      else toast.error(apiErr.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <Field label="Tên nhóm" htmlFor="group-name" required error={errors.name}>
        <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="off" aria-invalid={!!errors.name} />
      </Field>
      <Field label="Emoji" htmlFor="group-emoji" required error={errors.emoji}>
        <Input id="group-emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={16} className="w-28 text-center text-lg" />
      </Field>
      <Field label="Thứ tự hiển thị" htmlFor="group-order" hint="Số nhỏ hiện trước" error={errors.sortOrder}>
        <Input id="group-order" inputMode="numeric" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-28" />
      </Field>
      <SaveBar busy={busy} label={group ? 'Lưu thay đổi' : 'Thêm nhóm'} />
    </form>
  );
}

export default function GroupsTab() {
  const { groups, dishes, loading, reload } = useAdminData();
  const [editing, setEditing] = useState<Group | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Group | null>(null);
  const [busy, setBusy] = useState(false);

  const countOf = (id: number) => dishes.filter((d) => d.groupIds.includes(id)).length;

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.admin.deleteGroup(deleting.id);
      toast.success(`Đã xóa nhóm “${deleting.name}”`);
      setDeleting(null);
      await reload();
    } catch (e) {
      toast.error(toApiError(e).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="groups-title" className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="groups-title" className="text-xl font-extrabold">
          Nhóm món <span className="text-base font-semibold text-muted-foreground">({groups.length})</span>
        </h2>
        <Button className="h-11" onClick={() => setEditing('new')}>
          <Plus /> Thêm nhóm
        </Button>
      </div>
      {loading && <p className="py-8 text-center text-muted-foreground">Đang tải…</p>}
      {!loading && groups.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border py-10 text-center text-muted-foreground">Chưa có nhóm nào.</p>
      )}
      <ul className="grid gap-3 md:grid-cols-2">
        {groups.map((g) => (
          <li key={g.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <span aria-hidden className="text-3xl leading-none">{g.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-extrabold">{g.name}</p>
              <p className="text-xs text-muted-foreground">{countOf(g.id)} món · thứ tự {g.sortOrder ?? 0}</p>
            </div>
            <Button variant="ghost" size="icon" className="size-11" aria-label={`Sửa nhóm ${g.name}`} onClick={() => setEditing(g)}>
              <Pencil />
            </Button>
            <Button variant="ghost" size="icon" className="size-11 text-destructive" aria-label={`Xóa nhóm ${g.name}`} onClick={() => setDeleting(g)}>
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>

      <EditSheet
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing === 'new' ? 'Thêm nhóm mới' : 'Sửa nhóm'}
        description="Nhóm dùng để lọc món trên trang quay số."
      >
        {editing !== null && <GroupEditor key={editing === 'new' ? 'new' : editing.id} group={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />}
      </EditSheet>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Xóa nhóm này?"
        description={`Nhóm “${deleting?.name ?? ''}” sẽ bị gỡ khỏi ${deleting ? countOf(deleting.id) : 0} món. Các món vẫn được giữ lại.`}
        confirmLabel="Xóa nhóm"
        busy={busy}
        onConfirm={() => void remove()}
      />
    </section>
  );
}
