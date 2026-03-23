import client from './client';

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  checked: boolean;
  created_at: string;
}

export interface CreateShoppingListItem {
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
}

export interface ShoppingListSuggestion {
  name: string;
  category?: string;
  frequency: number;
}

export const shoppingListApi = {
  getAll: () => client.get<ShoppingListItem[]>('/api/shopping-list/').then((r) => r.data),
  create: (data: CreateShoppingListItem) => client.post<ShoppingListItem>('/api/shopping-list/', data).then((r) => r.data),
  update: (id: string, data: Partial<{ name: string; quantity: number; unit: string; category: string; checked: boolean }>) =>
    client.patch<ShoppingListItem>(`/api/shopping-list/${id}`, data).then((r) => r.data),
  delete: (id: string) => client.delete(`/api/shopping-list/${id}`),
  clearChecked: () => client.delete('/api/shopping-list/'),
  getSuggestions: () => client.get<ShoppingListSuggestion[]>('/api/shopping-list/suggestions').then((r) => r.data),
};
