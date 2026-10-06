import { Controller, type UseFormReturn } from 'react-hook-form';
import { Chip } from '@/components/Chip';
import { Field } from '@/components/Field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { DishFormValues } from '@/lib/forms';
import { MEALS, MEAL_EMOJI, MEAL_LABEL } from '@/lib/labels';
import type { Group } from '@/lib/types';

const EMOJIS = ['🍜', '🍲', '🍚', '🍛', '🍝', '🥖', '🥟', '🍢', '🍗', '🥩', '🍤', '🥗', '🍕', '🍔', '🌮', '🧋', '☕', '🍰', '🍧', '🍡', '🥘', '🐟', '🦀', '🍽️'];

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export function DishFields({ form, groups }: { form: UseFormReturn<DishFormValues>; groups: Group[] }) {
  const { register, control, formState } = form;
  const e = formState.errors;
  return (
    <div className="grid gap-4">
      <Field label="Tên món" htmlFor="dish-name" required error={e.name?.message}>
        <Input id="dish-name" placeholder="Ví dụ: Phở bò" autoComplete="off" aria-invalid={!!e.name} {...register('name')} />
      </Field>

      <Controller
        control={control}
        name="emoji"
        render={({ field }) => (
          <Field label="Emoji đại diện" error={e.emoji?.message}>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Chọn emoji">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => field.onChange(em)}
                  aria-pressed={field.value === em}
                  aria-label={`Emoji ${em}`}
                  className={`size-10 rounded-xl border text-xl transition-colors ${
                    field.value === em ? 'border-primary bg-accent ring-2 ring-primary/40' : 'border-input bg-card hover:bg-accent'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
            <Input
              value={field.value}
              onChange={(ev) => field.onChange(ev.target.value)}
              maxLength={16}
              className="mt-1 w-28 text-center text-lg"
              aria-label="Hoặc nhập emoji khác"
            />
          </Field>
        )}
      />

      <Field label="Mô tả ngắn" htmlFor="dish-desc" hint="Ví dụ: nóng, nhiều nước, hợp ngày mưa" error={e.description?.message}>
        <Textarea id="dish-desc" rows={2} {...register('description')} />
      </Field>

      <Controller
        control={control}
        name="meals"
        render={({ field }) => (
          <Field label="Bữa phù hợp" hint="Bỏ trống nếu món ăn lúc nào cũng hợp">
            <div className="flex flex-wrap gap-2">
              {MEALS.map((m) => (
                <Chip key={m} active={field.value.includes(m)} onClick={() => field.onChange(toggle(field.value, m))}>
                  <span aria-hidden>{MEAL_EMOJI[m]}</span> {MEAL_LABEL[m]}
                </Chip>
              ))}
            </div>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="groupIds"
        render={({ field }) => (
          <Field label="Nhóm" hint="Dùng để lọc khi quay số">
            <div className="flex flex-wrap gap-2">
              {groups.map((g) => (
                <Chip key={g.id} active={field.value.includes(g.id)} onClick={() => field.onChange(toggle(field.value, g.id))}>
                  <span aria-hidden>{g.emoji}</span> {g.name}
                </Chip>
              ))}
            </div>
          </Field>
        )}
      />
    </div>
  );
}
