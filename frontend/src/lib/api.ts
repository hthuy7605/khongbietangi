import axios, { AxiosError } from 'axios';
import type { Catalog, Dish, Group, Place, Stats, Suggestion, SuggestionKind, SuggestionStatus } from './types';

export const http = axios.create({ baseURL: '/api', withCredentials: true });

export interface ApiError {
  status: number;
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export function toApiError(e: unknown): ApiError {
  if (e instanceof AxiosError) {
    const err = e.response?.data?.error;
    if (err) return { status: e.response!.status, code: err.code, message: err.message, fields: err.fields };
    if (!e.response) return { status: 0, code: 'network', message: 'Không kết nối được máy chủ, kiểm tra mạng rồi thử lại nhé' };
  }
  return { status: 500, code: 'unknown', message: 'Có lỗi xảy ra, thử lại sau nhé' };
}

const data = <T>(p: Promise<{ data: T }>) => p.then((r) => r.data);

export const api = {
  catalog: () => data<Catalog>(http.get('/catalog')),
  resolveMaps: (url: string) => data<{ url: string; lat: number; lng: number }>(http.post('/maps/resolve', { url })),
  suggest: (kind: SuggestionKind, payload: unknown, extra: { website?: string; turnstileToken?: string } = {}) =>
    data<{ ok: true }>(http.post('/suggestions', { kind, payload, ...extra })),

  login: (username: string, password: string) => data<{ username: string }>(http.post('/auth/login', { username, password })),
  logout: () => data<{ ok: true }>(http.post('/auth/logout')),
  me: () => data<{ ok: true }>(http.get('/auth/me')),

  admin: {
    stats: () => data<Stats>(http.get('/admin/stats')),
    groups: () => data<Group[]>(http.get('/admin/groups')),
    saveGroup: (id: number | null, body: Omit<Group, 'id'>) =>
      data<Group>(id ? http.put(`/admin/groups/${id}`, body) : http.post('/admin/groups', body)),
    deleteGroup: (id: number) => data<{ ok: true }>(http.delete(`/admin/groups/${id}`)),
    dishes: () => data<Dish[]>(http.get('/admin/dishes')),
    saveDish: (id: number | null, body: unknown) =>
      data<{ id: number }>(id ? http.put(`/admin/dishes/${id}`, body) : http.post('/admin/dishes', body)),
    deleteDish: (id: number) => data<{ ok: true }>(http.delete(`/admin/dishes/${id}`)),
    places: () => data<Place[]>(http.get('/admin/places')),
    savePlace: (id: number | null, body: unknown) =>
      data<{ id: number }>(id ? http.put(`/admin/places/${id}`, body) : http.post('/admin/places', body)),
    deletePlace: (id: number) => data<{ ok: true }>(http.delete(`/admin/places/${id}`)),
    suggestions: (status: SuggestionStatus) => data<Suggestion[]>(http.get('/admin/suggestions', { params: { status } })),
    approve: (id: number, payload?: unknown) => data<{ ok: true }>(http.post(`/admin/suggestions/${id}/approve`, { payload })),
    reject: (id: number, reason: string | null) => data<{ ok: true }>(http.post(`/admin/suggestions/${id}/reject`, { reason })),
    settings: () => data<{ dishWeightEnabled: boolean; placeWeightEnabled: boolean }>(http.get('/admin/settings')),
    toggleSetting: (key: 'dish_weight_enabled' | 'place_weight_enabled') =>
      data<{ ok: boolean; [key: string]: boolean }>(http.post('/admin/settings/toggle', { key })),
  },
};
