import client from './client';

export interface Nutrition {
  id: string;
  food_item_id: string;
  serving_size_g: number;
  calories: number;
  protein_g: number;
  fat_total_g: number;
  carbohydrates_total_g: number;
  fetched_at: string;
}

export interface FoodItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  expiry_date?: string;
  notes?: string;
  price_per_unit?: number;
  price_currency: string;
  created_at: string;
  updated_at: string;
  nutrition?: Nutrition;
}

export type CreateFoodItem = Omit<FoodItem, 'id' | 'created_at' | 'updated_at' | 'nutrition'> & {
  calories_kcal?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
};

export const foodItemsApi = {
  getAll: () => client.get<FoodItem[]>('/api/food-items/').then((r) => r.data),
  getOne: (id: string) => client.get<FoodItem>(`/api/food-items/${id}`).then((r) => r.data),
  create: (data: CreateFoodItem) => client.post<FoodItem>('/api/food-items/', data).then((r) => r.data),
  update: (id: string, data: Partial<CreateFoodItem>) =>
    client.patch<FoodItem>(`/api/food-items/${id}`, data).then((r) => r.data),
  delete: (id: string) => client.delete(`/api/food-items/${id}`),
};
