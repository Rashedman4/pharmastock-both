import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { fetchSignals, fetchSignal, fetchSignalHistory } from '@/services/signals.service';

export function useOpenSignals() {
  return useInfiniteQuery({
    queryKey: ['signals', 'open'],
    queryFn: ({ pageParam = 1 }) => fetchSignals(pageParam as number),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 60_000,
  });
}

export function useSignal(id: number) {
  return useQuery({
    queryKey: ['signals', id],
    queryFn: () => fetchSignal(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useSignalHistory() {
  return useInfiniteQuery({
    queryKey: ['signals', 'history'],
    queryFn: ({ pageParam = 1 }) => fetchSignalHistory(pageParam as number),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 60_000,
  });
}
