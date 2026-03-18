import client from './client';

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  name: string;
  quantity: number;
  unit: string;
  food_item_id?: string;
}

export interface RecipeStep {
  id: string;
  recipe_id: string;
  step_number: number;
  instruction: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  servings: number;
  prep_time_min?: number;
  cook_time_min?: number;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface CreateRecipe {
  name: string;
  description?: string;
  servings: number;
  prep_time_min?: number;
  cook_time_min?: number;
  is_ai_generated?: boolean;
  ingredients: { name: string; quantity: number; unit: string; food_item_id?: string }[];
  steps: { step_number: number; instruction: string }[];
}

export interface RecipeSuggestion {
  name: string;
  description: string;
  servings: number;
  prep_time_min: number;
  cook_time_min: number;
  ingredients: { name: string; quantity: number; unit: string }[];
  steps: { step_number: number; instruction: string }[];
}

export const recipesApi = {
  getAll: () => client.get<Recipe[]>('/api/recipes/').then((r) => r.data),
  getOne: (id: string) => client.get<Recipe>(`/api/recipes/${id}`).then((r) => r.data),
  create: (data: CreateRecipe) => client.post<Recipe>('/api/recipes/', data).then((r) => r.data),
  update: (id: string, data: Partial<CreateRecipe>) =>
    client.patch<Recipe>(`/api/recipes/${id}`, data).then((r) => r.data),
  delete: (id: string) => client.delete(`/api/recipes/${id}`),
  getRecommendations: (lang = 'en', itemIds?: string[]) =>
    client.post<{ recipes: RecipeSuggestion[] }>(`/api/ai/recommendations?lang=${lang}`, { item_ids: itemIds || null }, { timeout: 60000 }).then((r) => r.data.recipes),
};
