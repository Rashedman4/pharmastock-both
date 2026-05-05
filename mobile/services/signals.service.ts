import { apiClient } from './api';
import { API_ROUTES } from '@/constants/api';
import type { PaginatedResponse, Signal, SignalHistoryItem } from '@/types/content';

export async function fetchSignals(page = 1, limit = 20): Promise<PaginatedResponse<Signal>> {
  const { data } = await apiClient.get<PaginatedResponse<Signal>>(API_ROUTES.signals.list, {
    params: { page, limit },
  });
  return data;
}

export async function fetchSignal(id: number): Promise<Signal> {
  const { data } = await apiClient.get<Signal>(API_ROUTES.signals.detail(id));
  return data;
}

export async function fetchSignalHistory(
  page = 1,
  limit = 20
): Promise<PaginatedResponse<SignalHistoryItem>> {
  const { data } = await apiClient.get<PaginatedResponse<SignalHistoryItem>>(
    API_ROUTES.signals.history,
    { params: { page, limit } }
  );
  return data;
}
