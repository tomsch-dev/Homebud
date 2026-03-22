import client from './client';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billing_cycle: string;
  category: string;
  next_billing_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  monthly_cost: number;
}

export interface CreateSubscription {
  name: string;
  amount: number;
  currency?: string;
  billing_cycle?: string;
  category?: string;
  next_billing_date?: string;
  notes?: string;
}

export const subscriptionApi = {
  getAll: () => client.get<Subscription[]>('/api/subscriptions/').then((r) => r.data),
  create: (data: CreateSubscription) => client.post<Subscription>('/api/subscriptions/', data).then((r) => r.data),
  update: (id: string, data: Partial<CreateSubscription & { is_active: boolean }>) =>
    client.patch<Subscription>(`/api/subscriptions/${id}`, data).then((r) => r.data),
  delete: (id: string) => client.delete(`/api/subscriptions/${id}`),
};
