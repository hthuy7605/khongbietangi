import { distanceKm, type Coords } from './distance';
import { dishKey, placeKey, type Rejections } from './rejections';
import { isOpenNow } from './time';
import type { Dish, Meal, Place } from './types';

export const NEARBY_KM = 3;

export interface Filters {
  meal: Meal | null;
  groupId: number | null;
  district: string | null;
  openNow: boolean;
  nearby: boolean;
}

export const noFilters: Filters = { meal: null, groupId: null, district: null, openNow: false, nearby: false };

export interface FilterContext {
  places: Map<number, Place>;
  coords: Coords | null;
  rejected: Rejections;
  now: Date;
}

export interface PlaceView {
  place: Place;
  km: number | null;
  open: boolean | null;
}

export const placeFiltersActive = (f: Filters) => f.district !== null || f.openNow || f.nearby;

/** Quán bán món này sau khi áp bộ lọc quán và bỏ quán đã chê; gần nhất lên đầu nếu có GPS. */
export function placesForDish(dish: Dish, f: Filters, c: FilterContext): PlaceView[] {
  const views: PlaceView[] = [];
  for (const id of dish.placeIds) {
    const place = c.places.get(id);
    if (!place || c.rejected[placeKey(place.id)]) continue;
    const km = c.coords && place.lat !== null && place.lng !== null ? distanceKm(c.coords, { lat: place.lat, lng: place.lng }) : null;
    const open = isOpenNow(place.openTime, place.closeTime, c.now);
    if (f.district !== null && place.district !== f.district) continue;
    if (f.openNow && open === false) continue;
    if (f.nearby && (km === null || km > NEARBY_KM)) continue;
    views.push({ place, km, open });
  }
  return views.sort((a, b) => {
    if (a.km !== null && b.km !== null) return a.km - b.km;
    if (a.km !== null) return -1;
    if (b.km !== null) return 1;
    return b.place.weight - a.place.weight || a.place.name.localeCompare(b.place.name, 'vi');
  });
}

export function eligibleDishes(dishes: Dish[], f: Filters, c: FilterContext): Dish[] {
  return dishes.filter(
    (d) =>
      !c.rejected[dishKey(d.id)] &&
      (f.meal === null || d.meals.length === 0 || d.meals.includes(f.meal)) &&
      (f.groupId === null || d.groupIds.includes(f.groupId)) &&
      (!placeFiltersActive(f) || placesForDish(d, f, c).length > 0),
  );
}

export function mapsLink(p: Place): string {
  if (p.mapsUrl) return p.mapsUrl;
  const q = p.lat !== null && p.lng !== null ? `${p.lat},${p.lng}` : [p.name, p.address, p.district].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
