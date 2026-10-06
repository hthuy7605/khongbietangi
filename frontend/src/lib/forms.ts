import { z } from 'zod';
import type { Meal, PriceLevel } from './types';

const url = z
  .string()
  .trim()
  .max(500, 'Link quá dài')
  .refine((v) => v === '' || /^https?:\/\//i.test(v), 'Link phải bắt đầu bằng http:// hoặc https://');
const time = z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ dạng HH:MM');

export const dishFormSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên món').max(100, 'Tên tối đa 100 ký tự'),
  emoji: z.string().trim().min(1, 'Chọn một emoji').max(16),
  description: z.string().trim().max(300, 'Tối đa 300 ký tự'),
  meals: z.array(z.enum(['sang', 'trua', 'toi', 'khuya'])),
  groupIds: z.array(z.number()),
});
export type DishFormValues = z.infer<typeof dishFormSchema>;
export const dishDefaults: DishFormValues = { name: '', emoji: '🍽️', description: '', meals: [], groupIds: [] };

export const placeFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Nhập tên quán').max(120, 'Tên tối đa 120 ký tự'),
    district: z.string().trim().max(100),
    address: z.string().trim().max(255),
    mapsUrl: url,
    lat: z.number().nullable(),
    lng: z.number().nullable(),
    priceLevel: z.number().int().min(1).max(3).nullable(),
    openTime: time,
    closeTime: time,
    imageUrl: url,
    note: z.string().trim().max(300, 'Tối đa 300 ký tự'),
  })
  .refine((v) => (v.openTime === '') === (v.closeTime === ''), {
    message: 'Nhập đủ cả giờ mở và giờ đóng (hoặc bỏ trống cả hai)',
    path: ['closeTime'],
  });
export type PlaceFormValues = z.infer<typeof placeFormSchema>;
export const placeDefaults: PlaceFormValues = {
  name: '',
  district: '',
  address: '',
  mapsUrl: '',
  lat: null,
  lng: null,
  priceLevel: null,
  openTime: '',
  closeTime: '',
  imageUrl: '',
  note: '',
};

export const toDishBody = (v: DishFormValues) => ({ ...v, description: v.description || null });

export const toPlaceBody = (v: PlaceFormValues) => ({
  ...v,
  mapsUrl: v.mapsUrl || null,
  imageUrl: v.imageUrl || null,
  note: v.note || null,
  openTime: v.openTime || null,
  closeTime: v.closeTime || null,
});

export function dishToForm(d: { name: string; emoji: string; description: string | null; meals: Meal[]; groupIds: number[] }): DishFormValues {
  return { name: d.name, emoji: d.emoji, description: d.description ?? '', meals: d.meals, groupIds: d.groupIds };
}

export function placeToForm(p: {
  name: string;
  district: string;
  address: string;
  mapsUrl: string | null;
  lat: number | null;
  lng: number | null;
  priceLevel: PriceLevel | null;
  openTime: string | null;
  closeTime: string | null;
  imageUrl: string | null;
  note: string | null;
}): PlaceFormValues {
  return {
    name: p.name,
    district: p.district,
    address: p.address,
    mapsUrl: p.mapsUrl ?? '',
    lat: p.lat,
    lng: p.lng,
    priceLevel: p.priceLevel,
    openTime: p.openTime ?? '',
    closeTime: p.closeTime ?? '',
    imageUrl: p.imageUrl ?? '',
    note: p.note ?? '',
  };
}
