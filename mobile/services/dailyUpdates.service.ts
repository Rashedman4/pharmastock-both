import { apiClient } from './api';
import { API_ROUTES } from '@/constants/api';
import type { PaginatedResponse, DailyUpdateItem, AvailableDate } from '@/types/content';

export interface DailyUpdatesParams {
  /** Calendar day to fetch, YYYY-MM-DD. Omitted means the backend's "today". */
  date?: string;
  page?: number;
  limit?: number;
}

export async function fetchDailyUpdates(
  params: DailyUpdatesParams = {}
): Promise<PaginatedResponse<DailyUpdateItem>> {
  const { date, page = 1, limit = 20 } = params;
  const { data } = await apiClient.get<PaginatedResponse<DailyUpdateItem>>(
    API_ROUTES.dailyUpdates.list,
    { params: { page, limit, ...(date ? { date } : {}) } }
  );
  return data;
}

/**
 * Days that actually have updates, so the picker can mark empty days instead of
 * making the user tap into one to find out. Range is capped server-side at 90
 * days.
 */
export async function fetchAvailableDates(
  from: string,
  to: string
): Promise<AvailableDate[]> {
  const { data } = await apiClient.get<{ data: AvailableDate[] }>(
    API_ROUTES.dailyUpdates.availableDates,
    { params: { from, to } }
  );
  return data.data;
}

export async function fetchDailyUpdateItem(id: number): Promise<DailyUpdateItem> {
  const { data } = await apiClient.get<DailyUpdateItem>(API_ROUTES.dailyUpdates.detail(id));
  return data;
}
