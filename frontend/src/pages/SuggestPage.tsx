import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, LoaderCircle, Plus, Send, X } from 'lucide-react';
import { useForm, type FieldPath, type FieldValues, type UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';
import { DishFields } from '@/components/DishFields';
import { Field } from '@/components/Field';
import { PickList } from '@/components/PickList';
import { PlaceFields } from '@/components/PlaceFields';
import { Turnstile, turnstileEnabled } from '@/components/Turnstile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCatalog } from '@/hooks/useCatalog';
import { api, toApiError } from '@/lib/api';
import {
  dishDefaults,
  dishFormSchema,
  placeDefaults,
  placeFormSchema,
  toDishBody,
  toPlaceBody,
  type DishFormValues,
  type PlaceFormValues,
} from '@/lib/forms';
import type { Catalog, SuggestionKind } from '@/lib/types';

function useSender(kind: SuggestionKind) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const honeypot = useRef<HTMLInputElement>(null);

  async function send<T extends FieldValues>(payload: unknown, setError?: UseFormSetError<T>): Promise<boolean> {
    if (turnstileEnabled && !token) {
      toast.error('Bấm ô xác minh “Tôi không phải robot” trước khi gửi nhé');
      return false;
    }
    setBusy(true);
    try {
      await api.suggest(kind, payload, { website: honeypot.current?.value, turnstileToken: token ?? undefined });
      setSent(true);
      return true;
    } catch (e) {
      const err = toApiError(e);
      if (err.fields && setError) {
        for (const [k, message] of Object.entries(err.fields)) setError(k as FieldPath<T>, { message });
      }
      toast.error(err.message);
      return false;
    } finally {
      setBusy(false);
      setResetKey((n) => n + 1);
    }
  }

  const guard = (
    <>
      <input ref={honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <Turnstile onToken={setToken} resetKey={resetKey} />
    </>
  );
  return { busy, sent, send, guard, again: () => setSent(false) };
}

function Sent({ onAgain }: { onAgain: () => void }) {
  return (
    <div className="grid justify-items-center gap-3 rounded-3xl border border-border bg-card px-6 py-10 text-center" role="status">
      <CheckCircle2 className="size-12 text-success" aria-hidden />
      <h2 className="text-xl font-extrabold">Đã gửi, cảm ơn bạn!</h2>
      <p className="text-sm text-muted-foreground">Đề xuất đang chờ duyệt. Khi được duyệt, nó sẽ xuất hiện trong lần quay số.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={onAgain}>Gửi thêm</Button>
        <Button asChild variant="outline">
          <Link to="/">Về trang quay số</Link>
        </Button>
      </div>
    </div>
  );
}

function SubmitButton({ busy }: { busy: boolean }) {
  return (
    <Button type="submit" size="lg" className="h-12 rounded-full font-extrabold" disabled={busy}>
      {busy ? <LoaderCircle className="animate-spin" /> : <Send />} Gửi đề xuất
    </Button>
  );
}

const placeItems = (c: Catalog) => c.places.map((p) => ({ id: p.id, label: p.name, sub: [p.address, p.district].filter(Boolean).join(', ') }));
const dishItems = (c: Catalog) => c.dishes.map((d) => ({ id: d.id, label: d.name, emoji: d.emoji }));

function DishSuggest({ catalog }: { catalog: Catalog }) {
  const form = useForm<DishFormValues>({ resolver: zodResolver(dishFormSchema), defaultValues: dishDefaults });
  const [placeIds, setPlaceIds] = useState<number[]>([]);
  const s = useSender('dish');
  const places = useMemo(() => placeItems(catalog), [catalog]);

  if (s.sent) {
    return <Sent onAgain={() => { form.reset(dishDefaults); setPlaceIds([]); s.again(); }} />;
  }
  return (
    <form
      noValidate
      className="relative grid gap-5"
      onSubmit={form.handleSubmit(async (v) => {
        await s.send({ ...toDishBody(v), placeIds }, form.setError);
      })}
    >
      <DishFields form={form} groups={catalog.groups} />
      <Field label="Bán ở những quán nào?" hint="Chọn các quán đã có sẵn. Quán chưa có thì đề xuất ở thẻ “Quán mới”.">
        <PickList items={places} value={placeIds} onChange={setPlaceIds} searchLabel="Tìm quán" empty="Chưa có quán nào" />
      </Field>
      {s.guard}
      <SubmitButton busy={s.busy} />
    </form>
  );
}

function NewDishNames({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState('');
  const add = () => {
    const name = text.trim();
    if (name && !value.some((v) => v.toLowerCase() === name.toLowerCase()) && value.length < 10) onChange([...value, name]);
    setText('');
  };
  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Món chưa có trong danh sách"
          aria-label="Tên món mới"
        />
        <Button type="button" variant="secondary" onClick={add} disabled={!text.trim()}>
          <Plus /> Thêm
        </Button>
      </div>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((n) => (
            <li key={n} className="inline-flex items-center gap-1 rounded-full bg-accent py-1 pr-1 pl-3 text-sm font-bold">
              {n}
              <button type="button" aria-label={`Bỏ ${n}`} className="grid size-7 place-items-center rounded-full hover:bg-background" onClick={() => onChange(value.filter((x) => x !== n))}>
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PlaceSuggest({ catalog }: { catalog: Catalog }) {
  const form = useForm<PlaceFormValues>({ resolver: zodResolver(placeFormSchema), defaultValues: placeDefaults });
  const [dishIds, setDishIds] = useState<number[]>([]);
  const [newDishNames, setNewDishNames] = useState<string[]>([]);
  const s = useSender('place');
  const dishes = useMemo(() => dishItems(catalog), [catalog]);

  if (s.sent) {
    return <Sent onAgain={() => { form.reset(placeDefaults); setDishIds([]); setNewDishNames([]); s.again(); }} />;
  }
  return (
    <form
      noValidate
      className="relative grid gap-5"
      onSubmit={form.handleSubmit(async (v) => {
        if (dishIds.length + newDishNames.length === 0) {
          toast.error('Chọn ít nhất một món mà quán này bán nhé');
          return;
        }
        await s.send({ ...toPlaceBody(v), dishIds, newDishNames }, form.setError);
      })}
    >
      <PlaceFields form={form} />
      <Field label="Quán bán những món nào?" required>
        <PickList items={dishes} value={dishIds} onChange={setDishIds} searchLabel="Tìm món" empty="Chưa có món nào" />
        <NewDishNames value={newDishNames} onChange={setNewDishNames} />
      </Field>
      {s.guard}
      <SubmitButton busy={s.busy} />
    </form>
  );
}

function LinkSuggest({ catalog }: { catalog: Catalog }) {
  const [dishId, setDishId] = useState<number | null>(null);
  const [placeId, setPlaceId] = useState<number | null>(null);
  const s = useSender('link');
  const dishes = useMemo(() => dishItems(catalog), [catalog]);
  const places = useMemo(() => placeItems(catalog), [catalog]);
  const already = dishId !== null && placeId !== null && catalog.dishes.find((d) => d.id === dishId)?.placeIds.includes(placeId);

  if (s.sent) return <Sent onAgain={() => { setDishId(null); setPlaceId(null); s.again(); }} />;
  return (
    <form
      noValidate
      className="relative grid gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (dishId === null || placeId === null) return toast.error('Chọn cả món và quán nhé');
        if (already) return toast.error('Quán này đã bán món đó rồi');
        await s.send({ dishId, placeId });
      }}
    >
      <Field label="Món" required>
        <PickList items={dishes} value={dishId === null ? [] : [dishId]} onChange={(ids) => setDishId(ids.at(-1) ?? null)} searchLabel="Tìm món" />
      </Field>
      <Field label="Quán bán món đó" required error={already ? 'Quán này đã bán món đó rồi' : undefined}>
        <PickList items={places} value={placeId === null ? [] : [placeId]} onChange={(ids) => setPlaceId(ids.at(-1) ?? null)} searchLabel="Tìm quán" />
      </Field>
      {s.guard}
      <SubmitButton busy={s.busy} />
    </form>
  );
}

export default function SuggestPage() {
  const { catalog, loading, error, reload } = useCatalog();

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Đề xuất món, quán mới</h1>
        <p className="text-sm text-muted-foreground">Không cần đăng nhập. Mọi đề xuất sẽ được xem qua trước khi đăng.</p>
      </div>
      {loading && <Skeleton className="h-64 rounded-3xl" />}
      {!loading && (error || !catalog) && (
        <div className="grid justify-items-center gap-3 rounded-3xl border border-dashed border-input px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">{error || 'Không tải được dữ liệu'}</p>
          <Button onClick={() => void reload()}>Thử lại</Button>
        </div>
      )}
      {catalog && (
        <Tabs defaultValue="dish" className="gap-5">
          <TabsList className="grid h-12 w-full grid-cols-3 rounded-2xl p-1">
            <TabsTrigger value="dish" className="rounded-xl text-sm font-bold">Món mới</TabsTrigger>
            <TabsTrigger value="place" className="rounded-xl text-sm font-bold">Quán mới</TabsTrigger>
            <TabsTrigger value="link" className="rounded-xl text-sm font-bold">Gán quán</TabsTrigger>
          </TabsList>
          <TabsContent value="dish"><DishSuggest catalog={catalog} /></TabsContent>
          <TabsContent value="place"><PlaceSuggest catalog={catalog} /></TabsContent>
          <TabsContent value="link"><LinkSuggest catalog={catalog} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}
