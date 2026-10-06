import { useState } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { LoaderCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Chip } from '@/components/Chip';
import { Field } from '@/components/Field';
import { api, toApiError } from '@/lib/api';
import type { PlaceFormValues } from '@/lib/forms';
import { PRICE_HINT, PRICE_LABEL } from '@/lib/labels';
import type { PriceLevel } from '@/lib/types';

const LEVELS: PriceLevel[] = [1, 2, 3];

function MapsLink({ form }: { form: UseFormReturn<PlaceFormValues> }) {
  const { register, watch, setValue, formState } = form;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lat = watch('lat');
  const lng = watch('lng');
  const mapsUrl = watch('mapsUrl');

  async function resolve() {
    if (!mapsUrl.trim()) return;
    setBusy(true);
    setError('');
    try {
      const r = await api.resolveMaps(mapsUrl.trim());
      setValue('lat', r.lat, { shouldDirty: true });
      setValue('lng', r.lng, { shouldDirty: true });
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Field
      label="Link Google Maps"
      htmlFor="place-maps"
      error={formState.errors.mapsUrl?.message ?? (error || undefined)}
      hint="Dán link rồi bấm “Lấy tọa độ” để lọc quán gần bạn"
    >
      <div className="flex gap-2">
        <Input
          id="place-maps"
          inputMode="url"
          placeholder="https://maps.app.goo.gl/..."
          {...register('mapsUrl', {
            onChange: () => {
              setValue('lat', null);
              setValue('lng', null);
              setError('');
            },
          })}
          onBlur={() => {
            if (mapsUrl.trim() && lat === null) void resolve();
          }}
        />
        <Button type="button" variant="secondary" onClick={() => void resolve()} disabled={busy || !mapsUrl.trim()}>
          {busy ? <LoaderCircle className="animate-spin" /> : <MapPin />}
          Lấy tọa độ
        </Button>
      </div>
      {lat !== null && lng !== null && (
        <p className="text-xs font-semibold text-success" role="status">
          Đã có tọa độ: {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      )}
    </Field>
  );
}

export function PlaceFields({ form }: { form: UseFormReturn<PlaceFormValues> }) {
  const { register, control, formState } = form;
  const e = formState.errors;
  return (
    <div className="grid gap-4">
      <Field label="Tên quán" htmlFor="place-name" required error={e.name?.message}>
        <Input id="place-name" placeholder="Ví dụ: Phở Thìn Bờ Hồ" autoComplete="off" aria-invalid={!!e.name} {...register('name')} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Quận / khu vực" htmlFor="place-district" error={e.district?.message}>
          <Input id="place-district" placeholder="Quận 1" {...register('district')} />
        </Field>
        <Field label="Địa chỉ" htmlFor="place-address" error={e.address?.message}>
          <Input id="place-address" placeholder="Số nhà, đường" {...register('address')} />
        </Field>
      </div>

      <MapsLink form={form} />

      <Controller
        control={control}
        name="priceLevel"
        render={({ field }) => (
          <Field label="Mức giá">
            <div className="flex flex-wrap gap-2">
              <Chip active={field.value === null} onClick={() => field.onChange(null)}>
                Chưa rõ
              </Chip>
              {LEVELS.map((l) => (
                <Chip key={l} active={field.value === l} onClick={() => field.onChange(l)}>
                  {PRICE_LABEL[l]} <span className="font-normal opacity-80">{PRICE_HINT[l]}</span>
                </Chip>
              ))}
            </div>
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Giờ mở cửa" htmlFor="place-open" error={e.openTime?.message}>
          <Input id="place-open" type="time" {...register('openTime')} />
        </Field>
        <Field label="Giờ đóng cửa" htmlFor="place-close" error={e.closeTime?.message} hint="Đóng sau nửa đêm vẫn được">
          <Input id="place-close" type="time" {...register('closeTime')} />
        </Field>
      </div>

      <Field label="Link ảnh (tùy chọn)" htmlFor="place-image" error={e.imageUrl?.message} hint="Dán link ảnh có sẵn trên mạng, không cần tải lên">
        <Input id="place-image" inputMode="url" placeholder="https://..." {...register('imageUrl')} />
      </Field>

      <Field label="Ghi chú" htmlFor="place-note" error={e.note?.message}>
        <Textarea id="place-note" rows={2} placeholder="Món nên thử, gợi ý gửi xe..." {...register('note')} />
      </Field>
    </div>
  );
}
