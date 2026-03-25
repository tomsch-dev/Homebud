import client from './client';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  all_day: boolean;
  color: string;
  created_at: string;
}

export interface CreateCalendarEvent {
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  all_day?: boolean;
  color?: string;
}

export const calendarApi = {
  getAll: (start?: string, end?: string) =>
    client.get<CalendarEvent[]>('/api/calendar/', { params: { start, end } }).then((r) => r.data),
  create: (data: CreateCalendarEvent) =>
    client.post<CalendarEvent>('/api/calendar/', data).then((r) => r.data),
  update: (id: string, data: Partial<CreateCalendarEvent>) =>
    client.patch<CalendarEvent>(`/api/calendar/${id}`, data).then((r) => r.data),
  delete: (id: string) => client.delete(`/api/calendar/${id}`),
};
