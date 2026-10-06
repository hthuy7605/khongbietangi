import { vnMinutes } from './time';
import type { Meal, PriceLevel } from './types';

export const MEAL_LABEL: Record<Meal, string> = {
  sang: 'Sáng',
  trua: 'Trưa',
  toi: 'Tối',
  khuya: 'Khuya',
};
export const MEAL_EMOJI: Record<Meal, string> = { sang: '🌅', trua: '☀️', toi: '🌙', khuya: '🦉' };
export const MEALS: Meal[] = ['sang', 'trua', 'toi', 'khuya'];

export const PRICE_LABEL: Record<PriceLevel, string> = { 1: 'đ', 2: 'đđ', 3: 'đđđ' };
export const PRICE_HINT: Record<PriceLevel, string> = { 1: 'Rẻ', 2: 'Vừa', 3: 'Sang' };

export function currentMeal(date = new Date()): Meal {
  const h = Math.floor(vnMinutes(date) / 60);
  if (h >= 5 && h < 10) return 'sang';
  if (h >= 10 && h < 15) return 'trua';
  if (h >= 15 && h < 22) return 'toi';
  return 'khuya';
}
