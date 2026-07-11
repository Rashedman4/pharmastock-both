import { apiClient } from './api';
import { API_ROUTES } from '@/constants/api';
import type { PaginatedResponse, DailyUpdateItem } from '@/types/content';

export async function fetchDailyUpdates(page = 1, limit = 20): Promise<PaginatedResponse<DailyUpdateItem>> {
  const { data } = await apiClient.get<PaginatedResponse<DailyUpdateItem>>(API_ROUTES.dailyUpdates.list, {
    params: { page, limit },
  });
  return data;
}

export async function fetchDailyUpdateItem(id: number): Promise<DailyUpdateItem> {
  const { data } = await apiClient.get<DailyUpdateItem>(API_ROUTES.dailyUpdates.detail(id));
  return data;
}
