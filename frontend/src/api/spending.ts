import client from './client';

export interface EatingOutExpense {
  id: string;
  restaurant_name: string;
  expense_date: string;
  amount: number;
  currency: string;
  meal_type: string;
  notes?: string;
  created_at: string;
}

export interface CreateEatingOut {
  restaurant_name: string;
  expense_date: string;
  amount: number;
  currency?: string;
  meal_type?: string;
  notes?: string;
}

export interface WeeklyBreakdown {
  week_start: string;
  week_end: string;
  grocery_total: number;
  eating_out_total: number;
  total: number;
  currency: string;
}

export interface SpendingSummary {
  period_start: string;
  period_end: string;
  grocery_total: number;
  eating_out_total: number;
  subscription_total: number;
  income_total: number;
  total: number;
  currency: string;
  weekly_breakdown: WeeklyBreakdown[];
  top_stores: { store: string; total: number }[];
  top_restaurants: { restaurant: string; total: number }[];
}

export const eatingOutApi = {
  getAll: () => client.get<EatingOutExpense[]>('/api/eating-out/').then((r) => r.data),
  create: (data: CreateEatingOut) => client.post<EatingOutExpense>('/api/eating-out/', data).then((r) => r.data),
  update: (id: string, data: Partial<CreateEatingOut>) =>
    client.patch<EatingOutExpense>(`/api/eating-out/${id}`, data).then((r) => r.data),
  delete: (id: string) => client.delete(`/api/eating-out/${id}`),
};

export const spendingApi = {
  getSummary: (start: string, end: string, currency = 'EUR') =>
    client
      .get<SpendingSummary>('/api/spending/summary', { params: { start, end, currency } })
      .then((r) => r.data),
};
