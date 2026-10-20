import { apiClient } from './api';
import { API_ROUTES } from '@/constants/api';
import type { WatchlistEntry } from '@/types/content';

export async function fetchWatchlist(): Promise<WatchlistEntry[]> {
  const { data } = await apiClient.get<{ data: WatchlistEntry[] }>(
    API_ROUTES.watchlist.list
  );
  return data.data;
}

/**
 * Adds a symbol. The server caps the list at 50 and answers
 * `WATCHLIST_LIMIT`; the caller surfaces that as a message rather than a
 * generic failure.
 */
export async function addToWatchlist(symbol: string): Promise<WatchlistEntry[]> {
  const { data } = await apiClient.post<{ data: WatchlistEntry[] }>(
    API_ROUTES.watchlist.list,
    { symbol }
  );
  return data.data;
}

export async function removeFromWatchlist(symbol: string): Promise<void> {
  await apiClient.delete(API_ROUTES.watchlist.item(symbol));
}

export async function setWatchAlerts(
  symbol: string,
  alertsEnabled: boolean
): Promise<void> {
  await apiClient.patch(API_ROUTES.watchlist.item(symbol), {
    alerts_enabled: alertsEnabled,
  });
}
