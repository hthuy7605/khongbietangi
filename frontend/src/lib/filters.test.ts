import { describe, expect, it } from 'vitest';
import { eligibleDishes, noFilters, placesForDish, type FilterContext } from './filters';
import type { Dish, Place } from './types';

const place = (id: number, extra: Partial<Place> = {}): Place => ({
  id, name: `Quán ${id}`, district: 'Q1', address: '', mapsUrl: null, lat: null, lng: null,
  priceLevel: null, openTime: null, closeTime: null, imageUrl: null, note: null, weight: 3, ...extra,
});
const dish = (id: number, extra: Partial<Dish> = {}): Dish => ({
  id, name: `Món ${id}`, emoji: '🍜', description: null, meals: [], weight: 3, groupIds: [], placeIds: [], ...extra,
});
// 12:00 giờ Việt Nam
const noon = new Date(Date.UTC(2026, 0, 15, 5, 0));
const ctx = (places: Place[], extra: Partial<FilterContext> = {}): FilterContext => ({
  places: new Map(places.map((p) => [p.id, p])), coords: null, rejected: {}, now: noon, ...extra,
});

describe('eligibleDishes', () => {
  it('món không giới hạn bữa hợp mọi bữa; món có bữa thì phải khớp', () => {
    const ds = [dish(1), dish(2, { meals: ['sang'] }), dish(3, { meals: ['toi'] })];
    const out = eligibleDishes(ds, { ...noFilters, meal: 'sang' }, ctx([]));
    expect(out.map((d) => d.id)).toEqual([1, 2]);
  });
  it('bỏ món đã chê', () => {
    const out = eligibleDishes([dish(1), dish(2)], noFilters, ctx([], { rejected: { 'dish:1': noon.getTime() + 1000 } }));
    expect(out.map((d) => d.id)).toEqual([2]);
  });
  it('lọc theo nhóm', () => {
    const out = eligibleDishes([dish(1, { groupIds: [5] }), dish(2)], { ...noFilters, groupId: 5 }, ctx([]));
    expect(out.map((d) => d.id)).toEqual([1]);
  });
  it('lọc quận: món phải có ít nhất một quán đúng quận', () => {
    const places = [place(1, { district: 'Q1' }), place(2, { district: 'Q3' })];
    const ds = [dish(1, { placeIds: [1] }), dish(2, { placeIds: [2] }), dish(3)];
    const out = eligibleDishes(ds, { ...noFilters, district: 'Q3' }, ctx(places));
    expect(out.map((d) => d.id)).toEqual([2]);
  });
  it('đang mở: loại quán chắc chắn đóng, giữ quán chưa nhập giờ', () => {
    const places = [place(1, { openTime: '18:00', closeTime: '23:00' }), place(2), place(3, { openTime: '06:00', closeTime: '22:00' })];
    const d = dish(1, { placeIds: [1, 2, 3] });
    const out = placesForDish(d, { ...noFilters, openNow: true }, ctx(places));
    expect(out.map((v) => v.place.id).sort()).toEqual([2, 3]);
  });
  it('gần tôi: chỉ quán có tọa độ trong 3km, gần nhất đứng trước', () => {
    const me = { lat: 10.77, lng: 106.7 };
    const places = [
      place(1, { lat: 10.78, lng: 106.7 }),
      place(2, { lat: 10.772, lng: 106.7 }),
      place(3, { lat: 11.5, lng: 106.7 }),
      place(4),
    ];
    const d = dish(1, { placeIds: [1, 2, 3, 4] });
    const out = placesForDish(d, { ...noFilters, nearby: true }, ctx(places, { coords: me }));
    expect(out.map((v) => v.place.id)).toEqual([2, 1]);
  });
  it('bỏ quán đã chê khỏi danh sách', () => {
    const d = dish(1, { placeIds: [1, 2] });
    const out = placesForDish(d, noFilters, ctx([place(1), place(2)], { rejected: { 'place:1': noon.getTime() + 1000 } }));
    expect(out.map((v) => v.place.id)).toEqual([2]);
  });
});
