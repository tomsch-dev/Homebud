import client from './client';

export interface FoodDataItem {
  api_food_id: string;
  display_name: string;
  canonical_name: string;
  description?: string;
  category?: string;
  is_fast_food: boolean;
  calories_kcal?: number;
  protein_g?: number;
  carbs_g?: number;
  sugars_g?: number;
  fiber_g?: number;
  fat_g?: number;
  saturated_fat_g?: number;
  sodium_mg?: number;
  cholesterol_mg?: number;
  quality_score?: number;
  source?: string;
  fdc_id?: number;
  is_new?: boolean;
}

export interface RecipeNutrition {
  servings: number;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  per_serving_calories: number;
  per_serving_protein_g: number;
  per_serving_carbs_g: number;
  per_serving_fat_g: number;
  ingredients: {
    name: string;
    matched: boolean;
    quantity: number;
    unit: string;
    calories_kcal?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
  }[];
  matched_count: number;
  total_count: number;
}

export const foodDataApi = {
  search: (q: string, limit = 8) =>
    client.get<FoodDataItem[]>('/api/food-data/search', { params: { q, limit } }).then((r) => r.data),
  getOne: (id: string) =>
    client.get<FoodDataItem>(`/api/food-data/${id}`).then((r) => r.data),
  categories: () =>
    client.get<string[]>('/api/food-data/categories').then((r) => r.data),
  getRecipeNutrition: (recipeId: string) =>
    client.get<RecipeNutrition>(`/api/recipes/${recipeId}/nutrition`).then((r) => r.data),
};
