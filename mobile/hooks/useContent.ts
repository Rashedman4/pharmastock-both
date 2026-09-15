import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  fetchNews,
  fetchNewsItem,
} from '@/services/news.service';
import {
  fetchDailyUpdates,
  fetchDailyUpdateItem,
  fetchAvailableDates,
} from '@/services/dailyUpdates.service';
import {
  fetchBreakthroughs,
  fetchBreakthrough,
  type BreakthroughFilters,
} from '@/services/breakthroughs.service';

export function useNews() {
  return useInfiniteQuery({
    queryKey: ['news'],
    queryFn: ({ pageParam = 1 }) => fetchNews(pageParam as number),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 120_000,
  });
}

export function useNewsItem(id: number) {
  return useQuery({
    queryKey: ['news', id],
    queryFn: () => fetchNewsItem(id),
    enabled: !!id,
    staleTime: 120_000,
  });
}

/**
 * One calendar day of updates. The day is part of the query key so each day
 * caches independently, and `placeholderData` keeps the previous day's rows on
 * screen while the new one loads instead of flashing an empty list.
 */
export function useDailyUpdates(date: string) {
  return useInfiniteQuery({
    queryKey: ['dailyUpdates', date],
    queryFn: ({ pageParam = 1 }) => fetchDailyUpdates({ date, page: pageParam as number }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 120_000,
    placeholderData: keepPreviousData,
  });
}

/** Days with at least one update, for marking empty days in the picker. */
export function useAvailableDates(from: string, to: string) {
  return useQuery({
    queryKey: ['dailyUpdates', 'availableDates', from, to],
    queryFn: () => fetchAvailableDates(from, to),
    enabled: !!from && !!to,
    staleTime: 300_000,
  });
}

export function useDailyUpdateItem(id: number) {
  return useQuery({
    queryKey: ['dailyUpdates', id],
    queryFn: () => fetchDailyUpdateItem(id),
    enabled: !!id,
    staleTime: 120_000,
  });
}

export function useBreakthroughs(filters?: BreakthroughFilters) {
  return useInfiniteQuery({
    queryKey: ['breakthroughs', filters],
    queryFn: ({ pageParam = 1 }) =>
      fetchBreakthroughs(pageParam as number, 20, filters),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 120_000,
  });
}

export function useBreakthrough(id: number) {
  return useQuery({
    queryKey: ['breakthroughs', id],
    queryFn: () => fetchBreakthrough(id),
    enabled: !!id,
    staleTime: 120_000,
  });
}
