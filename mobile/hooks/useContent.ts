import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  fetchNews,
  fetchNewsItem,
} from '@/services/news.service';
import {
  fetchBreakthroughs,
  fetchBreakthrough,
  fetchMarketPrice,
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

export function useMarketPrice(symbol: string | undefined) {
  return useQuery({
    queryKey: ['market', symbol],
    queryFn: () => fetchMarketPrice(symbol!),
    enabled: !!symbol,
    staleTime: 30_000,
    retry: false,
  });
}
