export type Meal = 'sang' | 'trua' | 'toi' | 'khuya';
export type PriceLevel = 1 | 2 | 3;

export interface Group {
  id: number;
  name: string;
  emoji: string;
  sortOrder?: number;
}

export interface Dish {
  id: number;
  name: string;
  emoji: string;
  description: string | null;
  meals: Meal[];
  weight: number;
  groupIds: number[];
  placeIds: number[];
  isActive?: boolean;
}

export interface Place {
  id: number;
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
  weight: number;
  isActive?: boolean;
  dishIds?: number[];
}

export interface Catalog {
  groups: Group[];
  dishes: Dish[];
  places: Place[];
}

export type SuggestionKind = 'dish' | 'place' | 'link';
export type SuggestionStatus = 'pending' | 'approved' | 'rejected';

export interface DishSuggestionPayload {
  name: string;
  emoji: string;
  description: string | null;
  meals: Meal[];
  groupIds: number[];
  placeIds: number[];
}

export interface PlaceSuggestionPayload {
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
  dishIds: number[];
  newDishNames: string[];
}

export interface LinkSuggestionPayload {
  dishId: number;
  placeId: number;
}

export interface Duplicate {
  type: 'dish' | 'place' | 'link';
  id: number;
  name: string;
}

export type Suggestion = {
  id: number;
  status: SuggestionStatus;
  rejectReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  duplicates: Duplicate[];
} & (
  | { kind: 'dish'; payload: DishSuggestionPayload }
  | { kind: 'place'; payload: PlaceSuggestionPayload }
  | { kind: 'link'; payload: LinkSuggestionPayload }
);

export interface Stats {
  dishes: number;
  places: number;
  pending: number;
  weekSuggestions: number;
}
