import client from './client';

export interface GroceryTripItem {
  id: string;
  trip_id: string;
  food_item_id?: string;
  name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  discount: number;
  total_price: number;
  currency: string;
}

export interface GroceryTrip {
  id: string;
  store_name: string;
  trip_date: string;
  notes?: string;
  currency: string;
  created_at: string;
  items: GroceryTripItem[];
  total_amount: number;
}

export interface CreateGroceryTripItem {
  food_item_id?: string;
  name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  discount?: number;
  currency?: string;
}

export interface CreateGroceryTrip {
  store_name: string;
  trip_date: string;
  notes?: string;
  currency?: string;
  items: CreateGroceryTripItem[];
}

export const groceryApi = {
  getAll: () => client.get<GroceryTrip[]>('/api/grocery-trips/').then((r) => r.data),
  getOne: (id: string) => client.get<GroceryTrip>(`/api/grocery-trips/${id}`).then((r) => r.data),
  create: (data: CreateGroceryTrip) => client.post<GroceryTrip>('/api/grocery-trips/', data).then((r) => r.data),
  update: (id: string, data: Partial<CreateGroceryTrip>) =>
    client.patch<GroceryTrip>(`/api/grocery-trips/${id}`, data).then((r) => r.data),
  delete: (id: string) => client.delete(`/api/grocery-trips/${id}`),
};
