import { z } from 'zod';

export const MEALS = ['sang', 'trua', 'toi', 'khuya'] as const;

const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);
const optUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https?:\/\//i.test(v), 'Link phải bắt đầu bằng http(s)://')
  .nullish()
  .transform((v) => v || null);
const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ dạng HH:MM')
  .nullish()
  .transform((v) => v ?? null);
const weight = z.number().int().min(1).max(5).default(3);
const ids = z.array(z.number().int().positive()).max(200).default([]);

const dishFields = z.object({
  name: z.string().trim().min(1, 'Nhập tên món').max(100),
  emoji: z.string().trim().min(1).max(16).default('🍽️'),
  description: opt(300),
  meals: z.array(z.enum(MEALS)).max(4).default([]),
  groupIds: ids,
  placeIds: ids,
});
export const dishInput = dishFields.extend({ weight, isActive: z.boolean().default(true) });
export const dishSuggestion = dishFields;

type PlaceShape = { lat: number | null; lng: number | null; openTime: string | null; closeTime: string | null };
const placeRules = <T extends z.ZodType<PlaceShape>>(s: T) =>
  s
    .refine((v) => (v.lat === null) === (v.lng === null), { message: 'Cần đủ cả vĩ độ và kinh độ', path: ['lat'] })
    .refine((v) => (v.openTime === null) === (v.closeTime === null), {
      message: 'Cần đủ giờ mở và giờ đóng',
      path: ['openTime'],
    });

const placeFields = z.object({
  name: z.string().trim().min(1, 'Nhập tên quán').max(120),
  district: z.string().trim().max(100).default(''),
  address: z.string().trim().max(255).default(''),
  mapsUrl: optUrl,
  lat: z.number().min(-90).max(90).nullish().transform((v) => v ?? null),
  lng: z.number().min(-180).max(180).nullish().transform((v) => v ?? null),
  priceLevel: z.number().int().min(1).max(3).nullish().transform((v) => v ?? null),
  openTime: time,
  closeTime: time,
  imageUrl: optUrl,
  note: opt(300),
  dishIds: ids,
});
export const placeInput = placeRules(placeFields.extend({ weight, isActive: z.boolean().default(true) }));
export const placeSuggestion = placeRules(
  placeFields.extend({ newDishNames: z.array(z.string().trim().min(1).max(100)).max(10).default([]) }),
);

export const linkSuggestion = z.object({ dishId: z.number().int().positive(), placeId: z.number().int().positive() });

export const groupInput = z.object({
  name: z.string().trim().min(1, 'Nhập tên nhóm').max(60),
  emoji: z.string().trim().min(1).max(16).default('🍽️'),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export const payloadSchemas = { dish: dishSuggestion, place: placeSuggestion, link: linkSuggestion } as const;
export type SuggestionKind = keyof typeof payloadSchemas;

export const suggestionEnvelope = z.object({
  kind: z.enum(['dish', 'place', 'link']),
  payload: z.unknown(),
  website: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export const loginInput = z.object({
  username: z.string().trim().min(1).max(50),
  password: z.string().min(1).max(200),
});

export type DishInput = z.output<typeof dishInput>;
export type PlaceInput = z.output<typeof placeInput>;
