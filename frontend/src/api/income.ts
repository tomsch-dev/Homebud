import client from './client';

export interface Income {
  id: string;
  amount: number;
  currency: string;
  source: string;
  income_date: string;
  is_recurring: boolean;
  frequency?: string;
  notes?: string;
  created_at: string;
}

export interface CreateIncome {
  amount: number;
  currency?: string;
  source: string;
  income_date: string;
  is_recurring?: boolean;
  frequency?: string;
  notes?: string;
}

export const incomeApi = {
  getAll: () => client.get<Income[]>('/api/income/').then((r) => r.data),
  create: (data: CreateIncome) => client.post<Income>('/api/income/', data).then((r) => r.data),
  update: (id: string, data: Partial<CreateIncome>) =>
    client.patch<Income>(`/api/income/${id}`, data).then((r) => r.data),
  delete: (id: string) => client.delete(`/api/income/${id}`),
};
