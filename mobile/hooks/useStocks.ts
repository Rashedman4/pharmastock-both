import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { searchStocks, fetchStockDetail } from '@/services/stocks.service';
import {
  addToWatchlist,
  fetchWatchlist,
  removeFromWatchlist,
  setWatchAlerts,
} from '@/services/watchlist.service';
import {
  fetchAnnouncement,
  fetchAnnouncements,
} from '@/services/announcements.service';
import type { ApiErrorResponse } from '@/types/api';

export const STOCK_KEYS = {
  search: (q: string) => ['stocks', 'search', q] as const,
  detail: (symbol: string) => ['stock', symbol] as const,
  watchlist: ['watchlist'] as const,
  announcements: ['announcements'] as const,
  announcement: (id: number) => ['announcements', id] as const,
};

/**
 * Debouncing lives in the screen; this only runs once a term arrives.
 * `keepPreviousData` keeps the old matches visible while the next term loads,
 * so the list doesn't blink between keystrokes.
 */
export function useStockSearch(q: string) {
  return useQuery({
    queryKey: STOCK_KEYS.search(q),
    queryFn: () => searchStocks(q),
    enabled: q.trim().length > 0,
    staleTime: 300_000,
    placeholderData: keepPreviousData,
  });
}

export function useStockDetail(symbol: string) {
  return useQuery({
    queryKey: STOCK_KEYS.detail(symbol),
    queryFn: () => fetchStockDetail(symbol),
    enabled: !!symbol,
    staleTime: 60_000,
  });
}

export function useWatchlist() {
  return useQuery({
    queryKey: STOCK_KEYS.watchlist,
    queryFn: fetchWatchlist,
    staleTime: 60_000,
  });
}

/** The server's error code, so the screen can name the 50-symbol cap. */
export function watchlistErrorCode(error: unknown): string | null {
  const response = (error as AxiosError<ApiErrorResponse>)?.response;
  return response?.data?.error?.code ?? null;
}

/**
 * Every watchlist mutation invalidates both `['watchlist']` and the affected
 * `['stock', symbol]`, because the star and bell on the stock page read from
 * the stock payload rather than from the watchlist.
 */
function useWatchlistMutation<TArgs extends { symbol: string }>(
  mutationFn: (args: TArgs) => Promise<unknown>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: STOCK_KEYS.watchlist });
      qc.invalidateQueries({ queryKey: STOCK_KEYS.detail(variables.symbol) });
    },
  });
}

export function useAddToWatchlist() {
  return useWatchlistMutation(({ symbol }: { symbol: string }) =>
    addToWatchlist(symbol)
  );
}

export function useRemoveFromWatchlist() {
  return useWatchlistMutation(({ symbol }: { symbol: string }) =>
    removeFromWatchlist(symbol)
  );
}

export function useSetWatchAlerts() {
  return useWatchlistMutation(
    ({ symbol, alertsEnabled }: { symbol: string; alertsEnabled: boolean }) =>
      setWatchAlerts(symbol, alertsEnabled)
  );
}

export function useAnnouncements(symbol?: string) {
  return useInfiniteQuery({
    queryKey: symbol
      ? [...STOCK_KEYS.announcements, { symbol }]
      : STOCK_KEYS.announcements,
    queryFn: ({ pageParam = 1 }) =>
      fetchAnnouncements(pageParam as number, 20, symbol),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 120_000,
  });
}

export function useAnnouncement(id: number) {
  return useQuery({
    queryKey: STOCK_KEYS.announcement(id),
    queryFn: () => fetchAnnouncement(id),
    enabled: !!id,
    staleTime: 120_000,
  });
}
